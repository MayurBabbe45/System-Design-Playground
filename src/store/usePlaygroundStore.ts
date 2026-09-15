import { create } from 'zustand';
import { 
  Node, 
  Edge, 
  OnNodesChange, 
  OnEdgesChange, 
  OnConnect, 
  applyNodeChanges, 
  applyEdgeChanges, 
  addEdge 
} from '@xyflow/react';
import LZString from 'lz-string';
import { 
  InfrastructureNodeData, 
  ComponentTypeId, 
  SystemMetricsSnapshot,
  TrafficProfile,
  EdgeStreamData,
  AvailabilityZone,
  SimulationEngineMode,
  EngineBenchmarkData
} from '../types/playground';
import { COMPONENT_CATALOG } from '../config/components';
import { PRESET_ARCHITECTURES } from '../config/presets';
import { WorkerSimulationInput, WorkerSimulationOutput } from '../workers/simulationWorker';
import { benchmarkWasm, benchmarkJs } from '../wasm/wasmEngine';

interface PlaygroundState {
  // React Flow graph state
  nodes: Node<InfrastructureNodeData>[];
  edges: Edge<EdgeStreamData>[];
  selectedNodeId: string | null;
  
  // Simulation Controls
  isSimulating: boolean;
  simulationSpeed: number; // 1x, 2x, 5x
  targetGlobalRps: number;
  trafficProfile: TrafficProfile;
  tickCount: number;
  
  // Chaos Engineering State
  killedAzs: AvailabilityZone[];
  globalInjectedLatencyMs: number;
  globalPacketDropPercent: number;
  isChaosCenterOpen: boolean;
  toggleChaosCenter: () => void;
  toggleKillAz: (az: AvailabilityZone) => void;
  resetChaos: () => void;
  setGlobalInjectedLatencyMs: (ms: number) => void;
  setGlobalPacketDropPercent: (percent: number) => void;

  // Cloud Cost Modal State
  isCostModalOpen: boolean;
  toggleCostModal: () => void;

  // Health Audit Modal State
  isAuditModalOpen: boolean;
  toggleAuditModal: () => void;

  // Export Modal State
  isExportModalOpen: boolean;
  toggleExportModal: () => void;

  // Bottleneck Diagnostics
  bottleneckNodeId: string | null;
  bottleneckReason: string | null;

  // Metrics & History
  telemetryHistory: SystemMetricsSnapshot[];
  activePresetId: string;

  // React Flow event handlers
  onNodesChange: OnNodesChange<Node<InfrastructureNodeData>>;
  onEdgesChange: OnEdgesChange<Edge<EdgeStreamData>>;
  onConnect: OnConnect;
  
  // Custom Actions
  setSelectedNodeId: (id: string | null) => void;
  addNodeFromPalette: (typeId: ComponentTypeId, position: { x: number; y: number }) => void;
  updateNodeData: (id: string, partialData: Partial<InfrastructureNodeData>) => void;
  toggleNodeKillSwitch: (id: string) => void;
  deleteNode: (id: string) => void;
  
  // Preset & Import/Export
  loadPreset: (presetId: string) => void;
  clearCanvas: () => void;
  getCompressedShareUrl: () => string;
  loadFromUrlHash: (hash: string) => boolean;
  
  // Simulation Loop
  toggleSimulation: () => void;
  setSimulationSpeed: (speed: number) => void;
  setTargetGlobalRps: (rps: number) => void;
  setTrafficProfile: (profile: TrafficProfile) => void;
  tickSimulation: () => void;

  // WebAssembly Simulation Engine & Benchmarks
  engineMode: SimulationEngineMode;
  isWasmReady: boolean;
  computeDurationMs: number;
  isBenchmarkModalOpen: boolean;
  benchmarkData: EngineBenchmarkData | null;
  isBenchmarking: boolean;
  setEngineMode: (mode: SimulationEngineMode) => void;
  toggleBenchmarkModal: () => void;
  runEngineBenchmark: (iterations?: number) => void;
}

// Instantiate Web Worker
let simWorker: Worker | null = null;
try {
  simWorker = new Worker(new URL('../workers/simulationWorker.ts', import.meta.url), {
    type: 'module',
  });
} catch (err) {
  console.warn('Web Worker initialization fallback to main thread:', err);
}

export const usePlaygroundStore = create<PlaygroundState>((set, get) => {
  // Wire up Web Worker message response listener
  if (simWorker) {
    simWorker.onmessage = (e: MessageEvent<WorkerSimulationOutput>) => {
      const { 
        updatedNodes, 
        updatedEdges, 
        snapshot, 
        bottleneckNodeId, 
        bottleneckReason,
        isWasmReady,
        computeDurationMs
      } = e.data;
      
      const nextNodes = get().nodes.map((node) => {
        const update = updatedNodes.find((un) => un.id === node.id);
        if (update) {
          return {
            ...node,
            data: {
              ...node.data,
              ...update.data,
            },
          };
        }
        return node;
      });

      const nextEdges = get().edges.map((edge) => {
        const update = updatedEdges.find((ue) => ue.id === edge.id);
        if (update) {
          return {
            ...edge,
            data: {
              ...edge.data,
              ...update.data,
            },
          };
        }
        return edge;
      });

      const currentHistory = get().telemetryHistory;
      const updatedHistory = [...currentHistory.slice(-29), snapshot];

      set({
        nodes: nextNodes,
        edges: nextEdges,
        telemetryHistory: updatedHistory,
        bottleneckNodeId,
        bottleneckReason,
        isWasmReady,
        computeDurationMs,
      });
    };
  }

  return {
    nodes: PRESET_ARCHITECTURES[0].nodes.map((n) => ({
      ...n,
      data: {
        ...n.data,
        utilizationPercent: 0,
        isBottleneck: false,
      },
    })) as Node<InfrastructureNodeData>[],
    edges: PRESET_ARCHITECTURES[0].edges.map((e) => ({
      ...e,
      type: 'flowEdge',
      data: {
        currentFlowRps: 2500,
        latencyMs: 5,
        errorRatePercent: 0,
        animated: true,
      },
    })),
    selectedNodeId: null,
    
    isSimulating: true,
    simulationSpeed: 1,
    targetGlobalRps: 2500,
    trafficProfile: 'steady',
    tickCount: 0,

    // Chaos State
    killedAzs: [],
    globalInjectedLatencyMs: 0,
    globalPacketDropPercent: 0,
    isChaosCenterOpen: false,

    // Modals
    isCostModalOpen: false,
    isAuditModalOpen: false,
    isExportModalOpen: false,
    isBenchmarkModalOpen: false,

    // WebAssembly Simulation Engine & Benchmarks
    engineMode: 'wasm',
    isWasmReady: false,
    computeDurationMs: 0,
    benchmarkData: null,
    isBenchmarking: false,

    bottleneckNodeId: null,
    bottleneckReason: null,
    
    telemetryHistory: [],
    activePresetId: 'classic-web-app',

    toggleChaosCenter: () => {
      set({ isChaosCenterOpen: !get().isChaosCenterOpen });
    },

    toggleCostModal: () => {
      set({ isCostModalOpen: !get().isCostModalOpen });
    },

    toggleAuditModal: () => {
      set({ isAuditModalOpen: !get().isAuditModalOpen });
    },

    toggleExportModal: () => {
      set({ isExportModalOpen: !get().isExportModalOpen });
    },

    toggleBenchmarkModal: () => {
      set({ isBenchmarkModalOpen: !get().isBenchmarkModalOpen });
    },

    setEngineMode: (mode) => {
      set({ engineMode: mode });
    },

    runEngineBenchmark: (iterations = 50000) => {
      set({ isBenchmarking: true });
      setTimeout(() => {
        const wasmRes = benchmarkWasm(iterations);
        const jsRes = benchmarkJs(iterations);
        const speedupFactor = jsRes.durationMs > 0 && wasmRes.durationMs > 0
          ? Number((jsRes.durationMs / wasmRes.durationMs).toFixed(2))
          : 1.0;

        set({
          isBenchmarking: false,
          benchmarkData: {
            wasmOpsPerSec: wasmRes.opsPerSec,
            wasmDurationMs: Number(wasmRes.durationMs.toFixed(2)),
            jsOpsPerSec: jsRes.opsPerSec,
            jsDurationMs: Number(jsRes.durationMs.toFixed(2)),
            speedupFactor,
            iterations,
            timestamp: Date.now(),
          },
        });
      }, 50);
    },

    toggleKillAz: (az) => {
      const current = get().killedAzs;
      const exists = current.includes(az);
      set({
        killedAzs: exists ? current.filter((k) => k !== az) : [...current, az],
      });
    },

    resetChaos: () => {
      set({
        killedAzs: [],
        globalInjectedLatencyMs: 0,
        globalPacketDropPercent: 0,
        nodes: get().nodes.map((n) => ({
          ...n,
          data: {
            ...n.data,
            isKilled: false,
            status: 'healthy',
            circuitBreakerState: 'CLOSED',
          },
        })),
      });
    },

    setGlobalInjectedLatencyMs: (ms) => {
      set({ globalInjectedLatencyMs: ms });
    },

    setGlobalPacketDropPercent: (percent) => {
      set({ globalPacketDropPercent: percent });
    },

    onNodesChange: (changes) => {
      set({
        nodes: applyNodeChanges(changes, get().nodes) as Node<InfrastructureNodeData>[],
      });
    },

    onEdgesChange: (changes) => {
      set({
        edges: applyEdgeChanges(changes, get().edges),
      });
    },

    onConnect: (connection) => {
      const newEdge: Edge<EdgeStreamData> = {
        ...connection,
        id: `e-${connection.source}-${connection.target}-${Date.now()}`,
        type: 'flowEdge',
        data: {
          currentFlowRps: 0,
          latencyMs: 5,
          errorRatePercent: 0,
          animated: true,
        },
      };
      set({
        edges: addEdge(newEdge, get().edges),
      });
    },

    setSelectedNodeId: (id) => {
      set({ selectedNodeId: id });
    },

    addNodeFromPalette: (typeId, position) => {
      const meta = COMPONENT_CATALOG[typeId];
      if (!meta) return;

      const id = `${typeId}-${Date.now()}`;
      const newNode: Node<InfrastructureNodeData> = {
        id,
        type: 'infrastructure',
        position,
        data: {
          label: meta.name,
          typeId: meta.typeId,
          category: meta.category,
          instanceCount: 1,
          capacityRps: meta.defaultCapacityRps,
          latencyMs: meta.defaultLatencyMs,
          maxQueueDepth: meta.defaultQueueDepth,
          failureRate: 0,
          costPerHour: meta.defaultCostPerHour,
          isKilled: false,
          currentRps: 0,
          currentQueue: 0,
          currentLatency: meta.defaultLatencyMs,
          status: 'healthy',
          utilizationPercent: 0,
          isBottleneck: false,
          availabilityZone: 'us-east-1a',
          hitRatePercent: typeId === 'cache' ? 85 : undefined,
          readRatioPercent: typeId === 'relational_db' ? 80 : undefined,
          circuitBreakerEnabled: typeId === 'load_balancer' || typeId === 'api_gateway',
          circuitBreakerState: 'CLOSED',
        },
      };

      set({
        nodes: [...get().nodes, newNode],
        selectedNodeId: id,
      });
    },

    updateNodeData: (id, partialData) => {
      set({
        nodes: get().nodes.map((node) => {
          if (node.id === id) {
            return {
              ...node,
              data: {
                ...node.data,
                ...partialData,
              },
            };
          }
          return node;
        }),
      });
    },

    toggleNodeKillSwitch: (id) => {
      set({
        nodes: get().nodes.map((node) => {
          if (node.id === id) {
            const nextKilledState = !node.data.isKilled;
            return {
              ...node,
              data: {
                ...node.data,
                isKilled: nextKilledState,
                status: nextKilledState ? 'dead' : 'healthy',
                currentRps: nextKilledState ? 0 : node.data.currentRps,
                currentQueue: nextKilledState ? 0 : node.data.currentQueue,
                utilizationPercent: nextKilledState ? 0 : node.data.utilizationPercent,
              },
            };
          }
          return node;
        }),
      });
    },

    deleteNode: (id) => {
      set({
        nodes: get().nodes.filter((n) => n.id !== id),
        edges: get().edges.filter((e) => e.source !== id && e.target !== id),
        selectedNodeId: get().selectedNodeId === id ? null : get().selectedNodeId,
      });
    },

    loadPreset: (presetId) => {
      const preset = PRESET_ARCHITECTURES.find((p) => p.id === presetId);
      if (!preset) return;

      set({
        nodes: preset.nodes.map((n) => ({
          ...n,
          data: {
            ...n.data,
            utilizationPercent: 0,
            isBottleneck: false,
          },
        })) as Node<InfrastructureNodeData>[],
        edges: preset.edges.map((e) => ({
          ...e,
          type: 'flowEdge',
          data: {
            currentFlowRps: 1000,
            latencyMs: 5,
            errorRatePercent: 0,
            animated: true,
          },
        })),
        activePresetId: presetId,
        selectedNodeId: null,
        bottleneckNodeId: null,
        bottleneckReason: null,
        killedAzs: [],
      });
    },

    clearCanvas: () => {
      set({
        nodes: [],
        edges: [],
        selectedNodeId: null,
        activePresetId: 'custom',
        bottleneckNodeId: null,
        bottleneckReason: null,
        killedAzs: [],
      });
    },

    getCompressedShareUrl: () => {
      const stateToExport = {
        nodes: get().nodes.map((n) => ({
          id: n.id,
          type: n.type,
          position: n.position,
          data: n.data,
        })),
        edges: get().edges,
      };
      const jsonString = JSON.stringify(stateToExport);
      const compressed = LZString.compressToEncodedURIComponent(jsonString);
      const url = new URL(window.location.href);
      url.hash = `architecture=${compressed}`;
      return url.toString();
    },

    loadFromUrlHash: (hashStr) => {
      try {
        if (!hashStr.includes('architecture=')) return false;
        const compressed = hashStr.split('architecture=')[1];
        if (!compressed) return false;
        
        const jsonString = LZString.decompressFromEncodedURIComponent(compressed);
        if (!jsonString) return false;

        const parsed = JSON.parse(jsonString);
        if (Array.isArray(parsed.nodes) && Array.isArray(parsed.edges)) {
          set({
            nodes: parsed.nodes.map((n: any) => ({
              ...n,
              data: { ...n.data, utilizationPercent: 0, isBottleneck: false },
            })),
            edges: parsed.edges.map((e: any) => ({
              ...e,
              type: 'flowEdge',
              data: { currentFlowRps: 1000, latencyMs: 5, errorRatePercent: 0, animated: true },
            })),
            activePresetId: 'shared-url',
          });
          return true;
        }
      } catch (e) {
        console.error('Failed to parse state from URL hash', e);
      }
      return false;
    },

    toggleSimulation: () => {
      set({ isSimulating: !get().isSimulating });
    },

    setSimulationSpeed: (speed) => {
      set({ simulationSpeed: speed });
    },

    setTargetGlobalRps: (rps) => {
      set({ targetGlobalRps: rps });
    },

    setTrafficProfile: (profile) => {
      set({ trafficProfile: profile });
    },

    tickSimulation: () => {
      const { 
        nodes, 
        edges, 
        isSimulating, 
        targetGlobalRps, 
        trafficProfile, 
        tickCount,
        killedAzs,
        globalInjectedLatencyMs,
        globalPacketDropPercent
      } = get();
      if (!isSimulating || nodes.length === 0) return;

      const nextTick = tickCount + 1;
      set({ tickCount: nextTick });

      if (simWorker) {
        const input: WorkerSimulationInput = {
          nodes: nodes.map((n) => ({ id: n.id, data: n.data })),
          edges: edges.map((e) => ({ id: e.id, source: e.source, target: e.target, data: e.data })),
          targetGlobalRps,
          trafficProfile,
          tickCount: nextTick,
          killedAzs,
          globalInjectedLatencyMs,
          globalPacketDropPercent,
          engineMode: get().engineMode,
        };
        simWorker.postMessage(input);
      }
    },
  };
});
