import type { StateCreator } from 'zustand';
import type { Node, Edge } from '@xyflow/react';
import { 
  applyNodeChanges, 
  applyEdgeChanges, 
  addEdge 
} from '@xyflow/react';
import type { 
  InfrastructureNodeData, 
  ComponentTypeId, 
  EdgeStreamData,
  NodeHealthStatus
} from '../../types/playground.ts';
import { COMPONENT_CATALOG } from '../../config/components.ts';
import { PRESET_ARCHITECTURES } from '../../config/presets.ts';
import { collabManager } from '../../collab/collabManager.ts';
import type { PlaygroundStoreState, CanvasSlice } from '../types.ts';
import { clearCascadeTimers } from './simulationSlice.ts';

export const createCanvasSlice: StateCreator<
  PlaygroundStoreState,
  [],
  [],
  CanvasSlice
> = (set, get) => ({
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
  selectedEdgeId: null,
  activePresetId: 'classic-web-app',

  // History & Clipboard
  history: [],
  future: [],
  copiedNode: null,

  onNodesChange: (changes) => {
    const nextNodes = applyNodeChanges(changes, get().nodes) as Node<InfrastructureNodeData>[];
    set({ nodes: nextNodes });

    // Synchronize changes to Yjs CRDT (only sync resting position when not actively dragging)
    for (const change of changes) {
      if (change.type === 'position' && change.position && !change.dragging) {
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
        if (get().selectedEdgeId === change.id) {
          set({ selectedEdgeId: null });
        }
      } else if (change.type === 'select') {
        if (change.selected) {
          set({ selectedEdgeId: change.id, selectedNodeId: null });
        } else if (get().selectedEdgeId === change.id) {
          set({ selectedEdgeId: null });
        }
      }
    }
  },

  onConnect: (connection) => {
    get().takeSnapshot();
    const currentNodes = get().nodes;
    const sourceNode = currentNodes.find((n) => n.id === connection.source);
    const targetNode = currentNodes.find((n) => n.id === connection.target);

    let canonicalSource = connection.source;
    let canonicalTarget = connection.target;
    let canonicalSourceHandle = connection.sourceHandle;
    let canonicalTargetHandle = connection.targetHandle;

    if (sourceNode && targetNode) {
      const getComponentTier = (typeId?: string): number => {
        switch (typeId) {
          case 'traffic_generator':
            return 0; // Ingress Client Origin
          case 'dns_router':
          case 'waf':
          case 'cdn':
            return 1; // Edge / DNS / Security Ingress
          case 'api_gateway':
          case 'load_balancer':
            return 2; // Gateways / Load Balancers
          case 'app_server':
          case 'serverless_function':
            return 3; // Application Compute Services
          case 'message_queue':
          case 'standard_queue':
          case 'pub_sub':
            return 4; // Asynchronous Messaging Brokers
          case 'background_worker':
            return 5; // Asynchronous Task Consumers
          case 'cache':
            return 6; // In-memory Caches
          case 'relational_db':
          case 'nosql_db':
          case 'search_engine':
          case 'analytics_db':
          case 'object_storage':
          case 'external_api':
            return 7; // Storage & External Datastores
          default:
            return 3;
        }
      };

      const sourceTier = getComponentTier(sourceNode.data?.typeId);
      const targetTier = getComponentTier(targetNode.data?.typeId);

      // If connection was created in reverse against standard architectural data flow,
      // auto-orient it from upstream producer to downstream consumer.
      if (sourceTier > targetTier) {
        canonicalSource = connection.target;
        canonicalTarget = connection.source;
        canonicalSourceHandle = connection.targetHandle || 'right';
        canonicalTargetHandle = connection.sourceHandle || 'left';
      }
    }

    const newEdge: Edge<EdgeStreamData> = {
      id: `e-${canonicalSource}-${canonicalTarget}-${Date.now()}`,
      source: canonicalSource,
      target: canonicalTarget,
      sourceHandle: canonicalSourceHandle,
      targetHandle: canonicalTargetHandle,
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
    set({ selectedNodeId: id, selectedEdgeId: id ? null : get().selectedEdgeId });
    collabManager.updateSelection(id);
  },

  setSelectedEdgeId: (id) => {
    set({ selectedEdgeId: id, selectedNodeId: id ? null : get().selectedNodeId });
  },

  takeSnapshot: () => {
    const currentNodes = get().nodes.map((n) => ({ ...n, data: { ...n.data } }));
    const currentEdges = get().edges.map((e) => ({ ...e, data: { ...e.data } }));
    set((state) => ({
      history: [...state.history.slice(-35), { nodes: currentNodes, edges: currentEdges }],
      future: [],
    }));
  },

  undo: () => {
    const { history, future, nodes, edges } = get();
    if (history.length === 0) return;

    const previous = history[history.length - 1];
    const newHistory = history.slice(0, history.length - 1);
    const currentSnapshot = {
      nodes: nodes.map((n) => ({ ...n, data: { ...n.data } })),
      edges: edges.map((e) => ({ ...e, data: { ...e.data } })),
    };

    set({
      nodes: previous.nodes,
      edges: previous.edges,
      history: newHistory,
      future: [currentSnapshot, ...future.slice(0, 35)],
      selectedNodeId: null,
      selectedEdgeId: null,
    });

    collabManager.syncLocalCanvas(previous.nodes, previous.edges);
  },

  redo: () => {
    const { history, future, nodes, edges } = get();
    if (future.length === 0) return;

    const next = future[0];
    const newFuture = future.slice(1);
    const currentSnapshot = {
      nodes: nodes.map((n) => ({ ...n, data: { ...n.data } })),
      edges: edges.map((e) => ({ ...e, data: { ...e.data } })),
    };

    set({
      nodes: next.nodes,
      edges: next.edges,
      history: [...history.slice(-35), currentSnapshot],
      future: newFuture,
      selectedNodeId: null,
      selectedEdgeId: null,
    });

    collabManager.syncLocalCanvas(next.nodes, next.edges);
  },

  copySelectedNode: () => {
    const { nodes, selectedNodeId } = get();
    if (!selectedNodeId) return;
    const target = nodes.find((n) => n.id === selectedNodeId);
    if (target) {
      set({ copiedNode: JSON.parse(JSON.stringify(target)) });
    }
  },

  pasteNode: (targetPosition) => {
    const { copiedNode, nodes } = get();
    if (!copiedNode) return;
    get().takeSnapshot();

    const id = `${copiedNode.data.typeId}-${Date.now()}`;
    const position = targetPosition || {
      x: copiedNode.position.x + 50,
      y: copiedNode.position.y + 50,
    };

    const cloned = JSON.parse(JSON.stringify(copiedNode));
    const newNode: Node<InfrastructureNodeData> = {
      ...cloned,
      id,
      position,
      selected: true,
    };

    set({
      nodes: [...nodes.map((n) => ({ ...n, selected: false })), newNode],
      selectedNodeId: id,
      selectedEdgeId: null,
    });

    collabManager.syncSingleNode(newNode);
  },

  duplicateSelectedNode: () => {
    const { selectedNodeId, nodes } = get();
    if (!selectedNodeId) return;
    const target = nodes.find((n) => n.id === selectedNodeId);
    if (!target) return;
    get().takeSnapshot();

    const id = `${target.data.typeId}-${Date.now()}`;
    const cloned = JSON.parse(JSON.stringify(target));
    const newNode: Node<InfrastructureNodeData> = {
      ...cloned,
      id,
      position: {
        x: target.position.x + 50,
        y: target.position.y + 50,
      },
      selected: true,
    };

    set({
      nodes: [...nodes.map((n) => ({ ...n, selected: false })), newNode],
      selectedNodeId: id,
      selectedEdgeId: null,
    });

    collabManager.syncSingleNode(newNode);
  },

  addNodeFromPalette: (typeId, position) => {
    get().takeSnapshot();
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

  appendConnectedNode: (sourceNodeId, typeId) => {
    get().takeSnapshot();
    const sourceNode = get().nodes.find((n) => n.id === sourceNodeId);
    const meta = COMPONENT_CATALOG[typeId];
    if (!sourceNode || !meta) return;

    const existingSourceEdges = get().edges.filter((e) => e.source === sourceNodeId);
    const edgeIndex = existingSourceEdges.length;

    // Position new node downstream to the right with vertical spreading for branches
    const yOffset = edgeIndex === 0 ? 0 : (edgeIndex % 2 === 1 ? Math.ceil(edgeIndex / 2) * 110 : -Math.ceil(edgeIndex / 2) * 110);
    const position = {
      x: sourceNode.position.x + 220,
      y: sourceNode.position.y + yOffset,
    };

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

    const newEdge: Edge<EdgeStreamData> = {
      id: `e-${sourceNodeId}-${id}-${Date.now()}`,
      source: sourceNodeId,
      sourceHandle: 'right',
      target: id,
      targetHandle: 'left',
      type: 'flowEdge',
      data: {
        currentFlowRps: 1000,
        latencyMs: 5,
        errorRatePercent: 0,
        animated: true,
      },
    };

    set({
      nodes: [...get().nodes, newNode],
      edges: [...get().edges, newEdge],
      selectedNodeId: id,
      selectedEdgeId: null,
    });

    collabManager.syncSingleNode(newNode);
    collabManager.syncSingleEdge(newEdge);
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

  updateNodeDnsSettings: (id, mode, weights, primaryTargetId) => {
    get().updateNodeData(id, {
      dnsRoutingMode: mode,
      dnsWeights: weights,
      primaryTargetId,
    });
  },

  updateNodeWafSettings: (id, rateLimitRps, inspectionLatencyMs) => {
    get().updateNodeData(id, {
      rateLimitRps,
      inspectionLatencyMs,
    });
  },

  updateNodeServerlessSettings: (id, coldStartLatencyMs, warmConcurrency) => {
    get().updateNodeData(id, {
      coldStartLatencyMs,
      warmConcurrency,
    });
  },

  updateNodeQueueSettings: (id, maxQueueDepth, batchSize, pollIntervalMs) => {
    get().updateNodeData(id, {
      maxQueueDepth,
      batchSize,
      pollIntervalMs,
    });
  },

  updateNodeExternalApiSettings: (id, latencyMs, failureRate, timeoutThresholdMs) => {
    get().updateNodeData(id, {
      latencyMs,
      failureRate,
      timeoutThresholdMs,
    });
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
    get().takeSnapshot();
    const remainingEdges = get().edges.filter((e) => e.source !== id && e.target !== id);
    const removedEdges = get().edges.filter((e) => e.source === id || e.target === id);
    removedEdges.forEach((e) => collabManager.syncEdgeDeletion(e.id));
    set({
      nodes: get().nodes.filter((n) => n.id !== id),
      edges: remainingEdges,
      selectedNodeId: get().selectedNodeId === id ? null : get().selectedNodeId,
      selectedEdgeId: removedEdges.some((e) => e.id === get().selectedEdgeId) ? null : get().selectedEdgeId,
    });
    collabManager.syncNodeDeletion(id);
  },

  deleteEdge: (id) => {
    get().takeSnapshot();
    set({
      edges: get().edges.filter((e) => e.id !== id),
      selectedEdgeId: get().selectedEdgeId === id ? null : get().selectedEdgeId,
    });
    collabManager.syncEdgeDeletion(id);
  },

  loadPreset: (presetId) => {
    const preset = PRESET_ARCHITECTURES.find((p) => p.id === presetId);
    if (!preset) return;
    get().takeSnapshot();

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

    clearCascadeTimers();
    set({
      nodes: loadedNodes,
      edges: loadedEdges,
      activePresetId: presetId,
      selectedNodeId: null,
      isSimulating: false,
      isCascadeRunning: false,
      activeNodeIds: [],
      activeEdgeIds: [],
      bottleneckNodeId: null,
      bottleneckReason: null,
      killedAzs: [],
    });
    collabManager.syncLocalCanvas(loadedNodes, loadedEdges);
  },

  clearCanvas: () => {
    clearCascadeTimers();
    get().takeSnapshot();
    set({
      nodes: [],
      edges: [],
      selectedNodeId: null,
      isSimulating: false,
      isCascadeRunning: false,
      activeNodeIds: [],
      activeEdgeIds: [],
      activePresetId: 'custom',
      bottleneckNodeId: null,
      bottleneckReason: null,
      killedAzs: [],
    });
    collabManager.syncLocalCanvas([], []);
  },
});
