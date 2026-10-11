import type { StateCreator } from 'zustand';
import type { 
  SystemMetricsSnapshot,
  TrafficProfile,
  SimulationEngineMode,
  EngineBenchmarkData
} from '../../types/playground.ts';
import type { WorkerSimulationInput, WorkerSimulationOutput } from '../../workers/simulationWorker.ts';
import { benchmarkWasm, benchmarkJs } from '../../wasm/wasmEngine.ts';
import { collabManager } from '../../collab/collabManager.ts';
import { apiClient } from '../../api/client.ts';
import type { PlaygroundStoreState, SimulationSlice } from '../types.ts';

// Incremental Simulation Cascade Timers
let cascadeTimerIds: ReturnType<typeof setTimeout>[] = [];
export const clearCascadeTimers = () => {
  cascadeTimerIds.forEach((id) => clearTimeout(id));
  cascadeTimerIds = [];
};

// Instantiate Web Worker
export let simWorker: Worker | null = null;
try {
  simWorker = new Worker(new URL('../../workers/simulationWorker.ts', import.meta.url), {
    type: 'module',
  });
} catch (err) {
  console.warn('Web Worker initialization fallback to main thread:', err);
}

export const setupSimulationWorkerListener = (
  set: (partial: Partial<PlaygroundStoreState> | ((state: PlaygroundStoreState) => Partial<PlaygroundStoreState>)) => void,
  get: () => PlaygroundStoreState
) => {
  if (!simWorker) return;

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
    
    let nodesChanged = false;
    const currentNodes = get().nodes;
    const nodeUpdateMap = new Map((updatedNodes || []).map((n) => [n.id, n.data]));
    const nextNodes = currentNodes.map((node) => {
      const u = nodeUpdateMap.get(node.id);
      if (!u) return node;

      const d = node.data;
      const isDifferent =
        d.currentRps !== u.currentRps ||
        d.currentQueue !== u.currentQueue ||
        d.currentLatency !== u.currentLatency ||
        d.status !== u.status ||
        d.utilizationPercent !== u.utilizationPercent ||
        d.isBottleneck !== u.isBottleneck ||
        d.circuitBreakerState !== u.circuitBreakerState;

      if (isDifferent) {
        nodesChanged = true;
        return {
          ...node,
          data: {
            ...node.data,
            ...u,
          },
        };
      }
      return node;
    });

    let edgesChanged = false;
    const currentEdges = get().edges;
    const edgeUpdateMap = new Map((updatedEdges || []).map((e) => [e.id, e.data]));
    const nextEdges = currentEdges.map((edge) => {
      const u = edgeUpdateMap.get(edge.id);
      if (!u) return edge;

      const d = edge.data;
      const isDifferent =
        !d ||
        d.currentFlowRps !== u.currentFlowRps ||
        d.latencyMs !== u.latencyMs ||
        d.errorRatePercent !== u.errorRatePercent ||
        d.animated !== u.animated;

      if (isDifferent) {
        edgesChanged = true;
        return {
          ...edge,
          data: {
            ...edge.data,
            ...u,
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
      nodes: nodesChanged ? nextNodes : currentNodes,
      edges: edgesChanged ? nextEdges : currentEdges,
      telemetryHistory: updatedHistory,
      bottleneckNodeId,
      bottleneckReason,
      isWasmReady,
      computeDurationMs,
    });
  };
};

export const createSimulationSlice: StateCreator<
  PlaygroundStoreState,
  [],
  [],
  SimulationSlice
> = (set, get) => {
  // Bind worker listener on initialization
  setupSimulationWorkerListener(set, get);

  return {
    isSimulating: false,
    isCascadeRunning: false,
    activeNodeIds: [],
    activeEdgeIds: [],
    simulationSpeed: 1,
    targetGlobalRps: 2500,
    trafficProfile: 'steady',
    tickCount: 0,

    bottleneckNodeId: null,
    bottleneckReason: null,
    telemetryHistory: [],

    engineMode: 'wasm',
    isWasmReady: false,
    computeDurationMs: 0,
    isBenchmarkModalOpen: false,
    benchmarkData: null,
    isBenchmarking: false,

    startSimulationCascade: () => {
      clearCascadeTimers();
      const { nodes, edges } = get();
      if (nodes.length === 0) return;

      // 1. Calculate in-degrees to identify ingress root nodes
      const inDegree: Record<string, number> = {};
      nodes.forEach((n) => { inDegree[n.id] = 0; });
      edges.forEach((e) => {
        if (inDegree[e.target] !== undefined) {
          inDegree[e.target] = (inDegree[e.target] || 0) + 1;
        }
      });

      // Roots: nodes with no incoming connections or trigger generators
      const roots = nodes.filter((n) => inDegree[n.id] === 0 || n.data?.typeId === 'traffic_generator');
      const startNodes = roots.length > 0 ? roots : [nodes[0]];

      const nodeTier: Record<string, number> = {};
      const edgeTier: Record<string, number> = {};
      const queue: { nodeId: string; tier: number }[] = startNodes.map((n) => ({
        nodeId: n.id,
        tier: 0,
      }));

      const visited = new Set<string>();

      while (queue.length > 0) {
        const { nodeId, tier } = queue.shift()!;
        if (visited.has(nodeId)) {
          nodeTier[nodeId] = Math.max(nodeTier[nodeId] || 0, tier);
          continue;
        }
        visited.add(nodeId);
        nodeTier[nodeId] = tier;

        const outgoing = edges.filter((e) => e.source === nodeId);
        for (const edge of outgoing) {
          edgeTier[edge.id] = tier;
          if (!visited.has(edge.target)) {
            queue.push({ nodeId: edge.target, tier: tier + 1 });
          }
        }
      }

      // Any remaining disconnected nodes/edges default to max tier
      const maxTier = Math.max(0, ...Object.values(nodeTier));
      nodes.forEach((n) => {
        if (nodeTier[n.id] === undefined) nodeTier[n.id] = maxTier + 1;
      });
      edges.forEach((e) => {
        if (edgeTier[e.id] === undefined) edgeTier[e.id] = maxTier + 1;
      });

      set({
        isSimulating: true,
        isCascadeRunning: true,
        activeNodeIds: [],
        activeEdgeIds: [],
      });

      const tierDelay = 380; // ms per tier for realistic n8n sequential propagation
      const totalTiers = Math.max(0, ...Object.values(nodeTier)) + 1;

      for (let t = 0; t <= totalTiers; t++) {
        // Activate nodes in tier t
        const timerNode = setTimeout(() => {
          const currentNodes = new Set(get().activeNodeIds);
          nodes.forEach((n) => {
            if (nodeTier[n.id] === t) currentNodes.add(n.id);
          });
          set({ activeNodeIds: Array.from(currentNodes) });
        }, t * tierDelay);
        cascadeTimerIds.push(timerNode);

        // Activate outgoing edges in tier t with packet transit delay
        const timerEdge = setTimeout(() => {
          const currentEdges = new Set(get().activeEdgeIds);
          edges.forEach((e) => {
            if (edgeTier[e.id] === t) currentEdges.add(e.id);
          });
          set({ activeEdgeIds: Array.from(currentEdges) });

          if (t === totalTiers) {
            set({ isCascadeRunning: false });
          }
        }, t * tierDelay + 180);
        cascadeTimerIds.push(timerEdge);
      }
    },

    stopSimulation: () => {
      clearCascadeTimers();
      set({
        isSimulating: false,
        isCascadeRunning: false,
        activeNodeIds: [],
        activeEdgeIds: [],
        bottleneckNodeId: null,
        bottleneckReason: null,
        telemetryHistory: [],
        nodes: get().nodes.map((n) => ({
          ...n,
          data: {
            ...n.data,
            currentRps: 0,
            currentQueue: 0,
            currentLatency: 0,
            utilizationPercent: 0,
            status: n.data.isKilled ? 'dead' : 'healthy',
            isBottleneck: false,
          },
        })),
        edges: get().edges.map((e) => ({
          ...e,
          data: {
            ...e.data,
            currentFlowRps: 0,
            errorRatePercent: 0,
          },
        })),
      });
    },

    toggleSimulation: () => {
      const { isSimulating } = get();
      if (isSimulating) {
        get().stopSimulation();
      } else {
        get().startSimulationCascade();
      }
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

    setEngineMode: (mode) => {
      set({ engineMode: mode });
    },

    toggleBenchmarkModal: () => {
      set({ isBenchmarkModalOpen: !get().isBenchmarkModalOpen });
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
  };
};
