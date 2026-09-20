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
  EngineBenchmarkData,
  NodeHealthStatus
} from '../types/playground';
import { COMPONENT_CATALOG } from '../config/components';
import { PRESET_ARCHITECTURES } from '../config/presets';
import { WorkerSimulationInput, WorkerSimulationOutput } from '../workers/simulationWorker';
import { benchmarkWasm, benchmarkJs } from '../wasm/wasmEngine';
import { collabManager } from '../collab/collabManager';
import { apiClient, SavedArchitecture } from '../api/client';
import { auditArchitecture } from '../simulation/architectureLinter';

export interface ActiveProjectSummary {
  id: string;
  name: string;
  description?: string;
  isPublic?: boolean;
}

interface PlaygroundState {
  // Application View Routing & Workspace State (Auth -> Dashboard -> Playground)
  appView: 'auth' | 'dashboard' | 'playground';
  setAppView: (view: 'auth' | 'dashboard' | 'playground') => void;
  activeProject: ActiveProjectSummary | null;
  openProject: (arch: SavedArchitecture) => void;
  openProjectById: (id: string) => Promise<boolean>;
  returnToDashboard: () => Promise<void>;
  renameActiveProject: (newName: string) => Promise<void>;
  createNewProject: (name: string, description?: string, presetId?: string) => Promise<string | null>;

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

  // Real-Time Collaboration Modal State
  isCollabModalOpen: boolean;
  toggleCollabModal: () => void;

  // Cloud Architecture Library Modal State (PostgreSQL & ClickHouse)
  isLibraryModalOpen: boolean;
  toggleLibraryModal: () => void;
  activeCloudArchitectureId: string | null;
  loadSavedArchitecture: (arch: SavedArchitecture) => void;

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

  // Theme State
  theme: 'dark' | 'light';
  toggleTheme: () => void;

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

const getInitialTheme = (): 'dark' | 'light' => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('spd_theme');
    if (saved === 'light' || saved === 'dark') return saved;
  }
  return 'dark';
};

const initialTheme = getInitialTheme();
if (typeof document !== 'undefined') {
  document.documentElement.setAttribute('data-theme', initialTheme);
  if (initialTheme === 'light') {
    document.documentElement.classList.add('light');
    document.documentElement.classList.remove('dark');
  } else {
    document.documentElement.classList.add('dark');
    document.documentElement.classList.remove('light');
  }
}

const getInitialAppView = (): 'auth' | 'dashboard' | 'playground' => {
  if (typeof window === 'undefined') return 'auth';
  const token = localStorage.getItem('sdp_auth_token');
  const isGuest = localStorage.getItem('sdp_is_guest') === 'true';
  if (!token && !isGuest) {
    return 'auth';
  }
  const params = new URLSearchParams(window.location.search);
  const viewParam = params.get('view');
  if (viewParam === 'playground') return 'playground';
  return 'dashboard';
};

const initialAppView = getInitialAppView();

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

      // Stream high-frequency simulation metrics to ClickHouse batch buffer
      if (snapshot) {
        const errorRate = snapshot.totalTargetRps > 0 
          ? Number(((snapshot.totalDroppedRps / snapshot.totalTargetRps) * 100).toFixed(1))
          : 0;

        apiClient.bufferTelemetryTick({
          timestamp: snapshot.timestamp || Date.now(),
          architectureId: get().activeCloudArchitectureId || get().activePresetId || 'main',
          sessionId: collabManager.getRoomName(),
          rps: snapshot.totalProcessedRps,
          p95LatencyMs: snapshot.p95LatencyMs,
          queueDepth: snapshot.activeQueueTotal,
          errorRate,
          bottleneckNode: bottleneckNodeId || undefined,
          engineMode: get().engineMode,
        });
      }

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
    isCollabModalOpen: false,
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

    toggleCollabModal: () => {
      set({ isCollabModalOpen: !get().isCollabModalOpen });
    },

    // Application View Routing & Workspace State (Auth -> Dashboard -> Playground)
    appView: initialAppView,
    activeProject: null,
    setAppView: (view) => {
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.searchParams.set('view', view);
        if (view !== 'playground') {
          url.searchParams.delete('project');
        }
        window.history.pushState({}, '', url.toString());
      }
      set({ appView: view });
    },
    openProject: (arch) => {
      set({
        nodes: arch.nodes,
        edges: arch.edges,
        activePresetId: 'custom',
        activeCloudArchitectureId: arch.id,
        activeProject: {
          id: arch.id,
          name: arch.name,
          description: arch.description,
          isPublic: arch.isPublic,
        },
        appView: 'playground',
        selectedNodeId: null,
        bottleneckNodeId: null,
        bottleneckReason: null,
        killedAzs: [],
      });
      collabManager.syncLocalCanvas(arch.nodes, arch.edges);
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.searchParams.set('view', 'playground');
        url.searchParams.set('project', arch.id);
        window.history.pushState({}, '', url.toString());
      }
    },
    openProjectById: async (id: string) => {
      try {
        const arch = await apiClient.getArchitecture(id);
        if (!arch) return false;
        get().openProject(arch);
        return true;
      } catch (err) {
        console.error('Failed to open project by id:', err);
        return false;
      }
    },
    returnToDashboard: async () => {
      const activeProj = get().activeProject;
      if (activeProj) {
        try {
          const audit = auditArchitecture(get().nodes, get().edges);
          const monthlyCost = Math.round(get().nodes.reduce((acc, n) => acc + (n.data.costPerHour || 0) * 730, 0));
          await apiClient.updateArchitecture(activeProj.id, {
            name: activeProj.name,
            nodes: get().nodes,
            edges: get().edges,
            grade: audit.grade,
            monthlyCost,
          });
        } catch (err) {
          console.warn('[Auto-Save] Error saving project before dashboard transition:', err);
        }
      }
      get().setAppView('dashboard');
    },
    renameActiveProject: async (newName: string) => {
      const activeProj = get().activeProject;
      if (!activeProj || !newName.trim()) return;
      const trimmed = newName.trim();
      set({
        activeProject: {
          ...activeProj,
          name: trimmed,
        },
      });
      try {
        await apiClient.updateArchitecture(activeProj.id, { name: trimmed });
      } catch (err) {
        console.error('Failed to rename architecture:', err);
      }
    },
    createNewProject: async (name: string, description?: string, presetId?: string) => {
      let projectNodes: Node<InfrastructureNodeData>[] = [];
      let projectEdges: Edge<EdgeStreamData>[] = [];

      if (presetId && presetId !== 'blank') {
        const preset = PRESET_ARCHITECTURES.find((p) => p.id === presetId);
        if (preset) {
          projectNodes = preset.nodes.map((n) => ({
            ...n,
            data: {
              ...n.data,
              utilizationPercent: 0,
              isBottleneck: false,
            },
          })) as Node<InfrastructureNodeData>[];
          projectEdges = preset.edges.map((e) => ({
            ...e,
            type: 'flowEdge',
            data: {
              currentFlowRps: 2500,
              latencyMs: 5,
              errorRatePercent: 0,
              animated: true,
            },
          })) as Edge<EdgeStreamData>[];
        }
      }

      const audit = auditArchitecture(projectNodes, projectEdges);
      const monthlyCost = Math.round(projectNodes.reduce((acc, n) => acc + (n.data.costPerHour || 0) * 730, 0));

      try {
        const saved = await apiClient.saveArchitecture({
          name: name.trim() || 'Untitled Architecture',
          description: description?.trim() || '',
          nodes: projectNodes,
          edges: projectEdges,
          grade: audit.grade,
          monthlyCost,
          isPublic: true,
        });

        get().openProject(saved);
        return saved.id;
      } catch (err) {
        console.error('Failed to create new project:', err);
        return null;
      }
    },

    // Cloud Architecture Library State & Actions (PostgreSQL)
    isLibraryModalOpen: false,
    activeCloudArchitectureId: null,
    toggleLibraryModal: () => {
      set({ isLibraryModalOpen: !get().isLibraryModalOpen });
    },
    loadSavedArchitecture: (arch) => {
      set({
        nodes: arch.nodes,
        edges: arch.edges,
        activePresetId: 'custom',
        activeCloudArchitectureId: arch.id,
        activeProject: {
          id: arch.id,
          name: arch.name,
          description: arch.description,
          isPublic: arch.isPublic,
        },
        selectedNodeId: null,
        bottleneckNodeId: null,
        bottleneckReason: null,
        killedAzs: [],
      });
      collabManager.syncLocalCanvas(arch.nodes, arch.edges);
    },

    toggleBenchmarkModal: () => {
      set({ isBenchmarkModalOpen: !get().isBenchmarkModalOpen });
    },

    // Theme State
    theme: initialTheme,
    toggleTheme: () => {
      const nextTheme = get().theme === 'dark' ? 'light' : 'dark';
      if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('data-theme', nextTheme);
        if (nextTheme === 'light') {
          document.documentElement.classList.add('light');
          document.documentElement.classList.remove('dark');
        } else {
          document.documentElement.classList.add('dark');
          document.documentElement.classList.remove('light');
        }
      }
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('spd_theme', nextTheme);
      }
      set({ theme: nextTheme });
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
      const nextNodes = applyNodeChanges(changes, get().nodes) as Node<InfrastructureNodeData>[];
      set({ nodes: nextNodes });

      // Synchronize changes to Yjs CRDT
      for (const change of changes) {
        if (change.type === 'position' && change.position) {
          const updatedNode = nextNodes.find((n) => n.id === change.id);
          if (updatedNode) collabManager.syncSingleNode(updatedNode);
        } else if (change.type === 'remove') {
          collabManager.syncNodeDeletion(change.id);
        }
      }
    },

    onEdgesChange: (changes) => {
      const nextEdges = applyEdgeChanges(changes, get().edges);
      set({ edges: nextEdges });

      for (const change of changes) {
        if (change.type === 'remove') {
          collabManager.syncEdgeDeletion(change.id);
        }
      }
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
      collabManager.syncSingleEdge(newEdge);
    },

    setSelectedNodeId: (id) => {
      set({ selectedNodeId: id });
      collabManager.updateSelection(id);
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
      collabManager.syncSingleNode(newNode);
    },

    updateNodeData: (id, partialData) => {
      const updatedNodes = get().nodes.map((node) => {
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
      });
      set({ nodes: updatedNodes });
      const target = updatedNodes.find((n) => n.id === id);
      if (target) collabManager.syncSingleNode(target);
    },

    toggleNodeKillSwitch: (id) => {
      const updatedNodes = get().nodes.map((node) => {
        if (node.id === id) {
          const nextKilledState = !node.data.isKilled;
          return {
            ...node,
            data: {
              ...node.data,
              isKilled: nextKilledState,
              status: (nextKilledState ? 'dead' : 'healthy') as NodeHealthStatus,
              currentRps: nextKilledState ? 0 : node.data.currentRps,
              currentQueue: nextKilledState ? 0 : node.data.currentQueue,
              utilizationPercent: nextKilledState ? 0 : node.data.utilizationPercent,
            },
          };
        }
        return node;
      });
      set({ nodes: updatedNodes });
      const target = updatedNodes.find((n) => n.id === id);
      if (target) collabManager.syncSingleNode(target);
    },

    deleteNode: (id) => {
      set({
        nodes: get().nodes.filter((n) => n.id !== id),
        edges: get().edges.filter((e) => e.source !== id && e.target !== id),
        selectedNodeId: get().selectedNodeId === id ? null : get().selectedNodeId,
      });
      collabManager.syncNodeDeletion(id);
    },

    loadPreset: (presetId) => {
      const preset = PRESET_ARCHITECTURES.find((p) => p.id === presetId);
      if (!preset) return;

      const loadedNodes = preset.nodes.map((n) => ({
        ...n,
        data: {
          ...n.data,
          utilizationPercent: 0,
          isBottleneck: false,
        },
      })) as Node<InfrastructureNodeData>[];

      const loadedEdges = preset.edges.map((e) => ({
        ...e,
        type: 'flowEdge',
        data: {
          currentFlowRps: 1000,
          latencyMs: 5,
          errorRatePercent: 0,
          animated: true,
        },
      }));

      set({
        nodes: loadedNodes,
        edges: loadedEdges,
        activePresetId: presetId,
        selectedNodeId: null,
        bottleneckNodeId: null,
        bottleneckReason: null,
        killedAzs: [],
      });
      collabManager.syncLocalCanvas(loadedNodes, loadedEdges);
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
      collabManager.syncLocalCanvas([], []);
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

// Register Remote Graph Listener from Yjs CRDT
collabManager.onRemoteGraphChange((remoteNodes, remoteEdges) => {
  const currentNodes = usePlaygroundStore.getState().nodes;
  const mergedNodes = remoteNodes.map((rn) => {
    const existing = currentNodes.find((cn) => cn.id === rn.id);
    if (existing) {
      return {
        ...rn,
        data: {
          ...rn.data,
          currentRps: existing.data.currentRps,
          currentQueue: existing.data.currentQueue,
          currentLatency: existing.data.currentLatency,
          status: rn.data.isKilled ? 'dead' : existing.data.status,
          utilizationPercent: existing.data.utilizationPercent,
          isBottleneck: existing.data.isBottleneck,
        },
      };
    }
    return rn;
  });

  usePlaygroundStore.setState({
    nodes: mergedNodes,
    edges: remoteEdges,
  });
});

// Auto-connect to room from URL or default room
if (typeof window !== 'undefined') {
  const params = new URLSearchParams(window.location.search);
  const room = params.get('room') || 'main-architecture-canvas';
  collabManager.connect(room);
}

