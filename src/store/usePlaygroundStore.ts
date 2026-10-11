import { create } from 'zustand';
import { collabManager } from '../collab/collabManager.ts';
import { createCanvasSlice } from './slices/canvasSlice.ts';
import { createSimulationSlice } from './slices/simulationSlice.ts';
import { createProjectSlice } from './slices/projectSlice.ts';
import { createUiModalSlice } from './slices/uiModalSlice.ts';
import type { 
  PlaygroundStoreState,
  ActiveProjectSummary,
  CanvasSlice,
  SimulationSlice,
  ProjectSlice,
  UiModalSlice,
} from './types.ts';

export type {
  PlaygroundStoreState,
  ActiveProjectSummary,
  CanvasSlice,
  SimulationSlice,
  ProjectSlice,
  UiModalSlice,
};

export const usePlaygroundStore = create<PlaygroundStoreState>((...a) => ({
  ...createCanvasSlice(...a),
  ...createSimulationSlice(...a),
  ...createProjectSlice(...a),
  ...createUiModalSlice(...a),
}));

// Register Remote Graph Listener from Yjs CRDT
collabManager.onRemoteGraphChange((remoteNodes, remoteEdges) => {
  const currentNodes = usePlaygroundStore.getState().nodes;
  const currentEdges = usePlaygroundStore.getState().edges;

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

  // Preserve local edge telemetry / flow metrics when remote edges update
  const mergedEdges = remoteEdges.length > 0
    ? remoteEdges.map((re) => {
        const existing = currentEdges.find((ce) => ce.id === re.id);
        if (existing) {
          return {
            ...re,
            data: {
              ...re.data,
              currentFlowRps: existing.data?.currentFlowRps ?? re.data?.currentFlowRps ?? 0,
              latencyMs: existing.data?.latencyMs ?? re.data?.latencyMs ?? 5,
              errorRatePercent: existing.data?.errorRatePercent ?? re.data?.errorRatePercent ?? 0,
              animated: existing.data?.animated ?? re.data?.animated ?? true,
            },
          };
        }
        return re;
      })
    : currentEdges;

  usePlaygroundStore.setState({
    nodes: mergedNodes,
    edges: mergedEdges,
  });
});

// Auto-connect to room from URL or default room
if (typeof window !== 'undefined') {
  const params = new URLSearchParams(window.location.search);
  const room = params.get('room') || 'main-architecture-canvas';
  collabManager.connect(room);
}
