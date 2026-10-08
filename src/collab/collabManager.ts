import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { Node, Edge } from '@xyflow/react';
import { InfrastructureNodeData, EdgeStreamData } from '../types/playground';
import { PeerState, PeerUser, CollabConnectionStatus } from './types';

const PEER_NAMES = [
  'CloudArchitect',
  'ChaosEngineer',
  'SRE-Phoenix',
  'K8s-Captain',
  'DevOps-Ninja',
  'InfraWizard',
  'VPC-Router',
  'LatencyHunter',
  'Kafka-Conductor',
  'Mesh-Commander',
];

const PEER_COLORS = [
  '#38bdf8', // Sky
  '#4ade80', // Emerald
  '#f472b6', // Pink
  '#a78bfa', // Purple
  '#fbbf24', // Amber
  '#f87171', // Red
  '#34d399', // Mint
  '#818cf8', // Indigo
];

function getStoredOrRandomUser(): PeerUser {
  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem('spd_collab_user');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        // ignore
      }
    }
  }

  const randomName = `${PEER_NAMES[Math.floor(Math.random() * PEER_NAMES.length)]}-${Math.floor(
    10 + Math.random() * 90
  )}`;
  const randomColor = PEER_COLORS[Math.floor(Math.random() * PEER_COLORS.length)];
  const user: PeerUser = { name: randomName, color: randomColor };

  if (typeof window !== 'undefined') {
    localStorage.setItem('spd_collab_user', JSON.stringify(user));
  }
  return user;
}

export class CollabManager {
  private doc: Y.Doc | null = null;
  private provider: WebsocketProvider | null = null;
  private nodesMap: Y.Map<any> | null = null;
  private edgesMap: Y.Map<any> | null = null;
  private currentUser: PeerUser = getStoredOrRandomUser();
  private roomName: string = 'default-room';
  private connectionStatus: CollabConnectionStatus = 'disconnected';

  // Flag to avoid broadcast loops when applying remote updates
  private isApplyingRemoteUpdate: boolean = false;

  // Event listeners
  private statusListeners = new Set<(status: CollabConnectionStatus) => void>();
  private peersListeners = new Set<(peers: PeerState[]) => void>();
  private remoteGraphListeners = new Set<
    (nodes: Node<InfrastructureNodeData>[], edges: Edge<EdgeStreamData>[]) => void
  >();

  public getRoomName(): string {
    return this.roomName;
  }

  public getCurrentUser(): PeerUser {
    return this.currentUser;
  }

  public getStatus(): CollabConnectionStatus {
    return this.connectionStatus;
  }

  public setCurrentUser(user: Partial<PeerUser>) {
    this.currentUser = { ...this.currentUser, ...user };
    if (typeof window !== 'undefined') {
      localStorage.setItem('spd_collab_user', JSON.stringify(this.currentUser));
    }
    if (this.provider) {
      this.provider.awareness.setLocalStateField('user', this.currentUser);
    }
  }

  public connect(roomName: string = 'main-canvas', customWsUrl?: string) {
    if (this.provider) {
      this.disconnect();
    }

    this.roomName = roomName;
    const wsProtocol = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const defaultHost = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    const serverUrl = customWsUrl || `${wsProtocol}//${defaultHost}:1234`;

    this.doc = new Y.Doc();
    this.nodesMap = this.doc.getMap('nodes');
    this.edgesMap = this.doc.getMap('edges');

    this.connectionStatus = 'connecting';
    this.notifyStatus();

    try {
      this.provider = new WebsocketProvider(serverUrl, roomName, this.doc, {
        connect: true,
        resyncInterval: 10000,
        maxBackoffTime: 5000,
      });

      // Awareness setup
      this.provider.awareness.setLocalStateField('user', this.currentUser);
      this.provider.awareness.setLocalStateField('cursor', null);
      this.provider.awareness.setLocalStateField('selectedNodeId', null);

      this.provider.on('status', (event: { status: 'connected' | 'disconnected' | 'connecting' }) => {
        this.connectionStatus = event.status;
        this.notifyStatus();
      });

      this.provider.on('connection-close', () => {
        this.connectionStatus = 'disconnected';
        this.notifyStatus();
      });

      this.provider.awareness.on('change', () => {
        this.notifyPeers();
      });

      // Listen for remote Yjs updates (ignoring local transactions to prevent feedback loops)
      this.nodesMap.observe((event) => {
        if (event.transaction.local) return;
        this.emitRemoteGraph();
      });

      this.edgesMap.observe((event) => {
        if (event.transaction.local) return;
        this.emitRemoteGraph();
      });

      // After initial sync, check if remote doc has nodes
      this.provider.on('sync', (isSynced: boolean) => {
        if (isSynced && this.nodesMap) {
          if (this.nodesMap.size > 0) {
            this.emitRemoteGraph();
          }
        }
      });
    } catch (err) {
      console.warn('[CollabManager] Connection error, defaulting to offline mode:', err);
      this.connectionStatus = 'disconnected';
      this.notifyStatus();
    }
  }

  public disconnect() {
    if (this.provider) {
      this.provider.awareness.setLocalStateField('cursor', null);
      this.provider.destroy();
      this.provider = null;
    }
    if (this.doc) {
      this.doc.destroy();
      this.doc = null;
    }
    this.nodesMap = null;
    this.edgesMap = null;
    this.connectionStatus = 'disconnected';
    this.notifyStatus();
    this.notifyPeers();
  }

  // --- Awareness Actions ---

  public updateCursor(position: { x: number; y: number } | null) {
    if (!this.provider) return;
    this.provider.awareness.setLocalStateField('cursor', position);
  }

  public updateSelection(selectedNodeId: string | null) {
    if (!this.provider) return;
    this.provider.awareness.setLocalStateField('selectedNodeId', selectedNodeId);
  }

  // --- Graph Synchronization Actions ---

  public syncLocalCanvas(nodes: Node<InfrastructureNodeData>[], edges: Edge<EdgeStreamData>[]) {
    if (!this.doc || !this.nodesMap || !this.edgesMap || this.isApplyingRemoteUpdate) return;

    this.doc.transact(() => {
      // 1. Sync Nodes
      const currentRemoteNodeIds = new Set(this.nodesMap!.keys());
      const localNodeIds = new Set(nodes.map((n) => n.id));

      // Remove deleted nodes from Y.Map
      for (const remoteId of currentRemoteNodeIds) {
        if (!localNodeIds.has(remoteId)) {
          this.nodesMap!.delete(remoteId);
        }
      }

      // Add or update nodes in Y.Map (sanitizing ephemeral 60Hz metrics)
      for (const node of nodes) {
        const sanitizedData = this.sanitizeNodeData(node.data);
        const nodeToSync = {
          id: node.id,
          type: node.type,
          position: node.position,
          data: sanitizedData,
        };
        this.nodesMap!.set(node.id, nodeToSync);
      }

      // 2. Sync Edges
      const currentRemoteEdgeIds = new Set(this.edgesMap!.keys());
      const localEdgeIds = new Set(edges.map((e) => e.id));

      for (const remoteId of currentRemoteEdgeIds) {
        if (!localEdgeIds.has(remoteId)) {
          this.edgesMap!.delete(remoteId);
        }
      }

      for (const edge of edges) {
        const edgeToSync = {
          id: edge.id,
          source: edge.source,
          target: edge.target,
          sourceHandle: edge.sourceHandle,
          targetHandle: edge.targetHandle,
          type: edge.type || 'flowEdge',
          animated: edge.animated,
        };
        this.edgesMap!.set(edge.id, edgeToSync);
      }
    }, 'local');
  }

  public syncSingleNode(node: Node<InfrastructureNodeData>) {
    if (!this.doc || !this.nodesMap || this.isApplyingRemoteUpdate) return;

    this.doc.transact(() => {
      const sanitizedData = this.sanitizeNodeData(node.data);
      const nodeToSync = {
        id: node.id,
        type: node.type,
        position: node.position,
        data: sanitizedData,
      };
      this.nodesMap!.set(node.id, nodeToSync);
    }, 'local');
  }

  public syncNodeDeletion(nodeId: string) {
    if (!this.doc || !this.nodesMap || this.isApplyingRemoteUpdate) return;
    this.doc.transact(() => {
      this.nodesMap!.delete(nodeId);
    }, 'local');
  }

  public syncSingleEdge(edge: Edge<EdgeStreamData>) {
    if (!this.doc || !this.edgesMap || this.isApplyingRemoteUpdate) return;
    this.doc.transact(() => {
      const edgeToSync = {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.sourceHandle,
        targetHandle: edge.targetHandle,
        type: edge.type || 'flowEdge',
        animated: edge.animated,
      };
      this.edgesMap!.set(edge.id, edgeToSync);
    }, 'local');
  }

  public syncEdgeDeletion(edgeId: string) {
    if (!this.doc || !this.edgesMap || this.isApplyingRemoteUpdate) return;
    this.doc.transact(() => {
      this.edgesMap!.delete(edgeId);
    }, 'local');
  }

  // --- Private Helpers ---

  private sanitizeNodeData(data: InfrastructureNodeData): Partial<InfrastructureNodeData> {
    // Preserve structural and configuration properties, exclude ephemeral 60Hz metrics
    const {
      currentRps,
      currentQueue,
      currentLatency,
      utilizationPercent,
      isBottleneck,
      status,
      ...structuralData
    } = data;
    return structuralData;
  }

  private emitRemoteGraph() {
    if (!this.nodesMap || !this.edgesMap) return;

    const rawNodes = Array.from(this.nodesMap.values());
    const rawEdges = Array.from(this.edgesMap.values());

    if (rawNodes.length === 0 && rawEdges.length === 0) return;

    this.isApplyingRemoteUpdate = true;

    // Convert raw Yjs records to typed Node and Edge collections
    const convertedNodes: Node<InfrastructureNodeData>[] = rawNodes.map((rn: any) => ({
      id: rn.id,
      type: rn.type || 'infrastructure',
      position: rn.position || { x: 100, y: 100 },
      data: {
        ...rn.data,
        // Initialize fallback local telemetry properties if not present
        currentRps: rn.data?.currentRps ?? 0,
        currentQueue: rn.data?.currentQueue ?? 0,
        currentLatency: rn.data?.currentLatency ?? rn.data?.latencyMs ?? 5,
        status: rn.data?.isKilled ? 'dead' : 'healthy',
        utilizationPercent: rn.data?.utilizationPercent ?? 0,
        isBottleneck: false,
      },
    }));

    const convertedEdges: Edge<EdgeStreamData>[] = rawEdges.map((re: any) => ({
      id: re.id,
      source: re.source,
      target: re.target,
      sourceHandle: re.sourceHandle,
      targetHandle: re.targetHandle,
      type: re.type || 'flowEdge',
      animated: re.animated !== undefined ? re.animated : true,
      data: {
        currentFlowRps: re.data?.currentFlowRps ?? re.data?.currentRps ?? 0,
        latencyMs: re.data?.latencyMs ?? 5,
        errorRatePercent: re.data?.errorRatePercent ?? re.data?.packetDropRate ?? 0,
        animated: re.animated !== undefined ? re.animated : true,
      },
    }));

    for (const listener of this.remoteGraphListeners) {
      listener(convertedNodes, convertedEdges);
    }

    setTimeout(() => {
      this.isApplyingRemoteUpdate = false;
    }, 50);
  }

  // --- Subscriptions ---

  public onStatusChange(callback: (status: CollabConnectionStatus) => void): () => void {
    this.statusListeners.add(callback);
    callback(this.connectionStatus);
    return () => this.statusListeners.delete(callback);
  }

  public onPeersChange(callback: (peers: PeerState[]) => void): () => void {
    this.peersListeners.add(callback);
    this.notifyPeers();
    return () => this.peersListeners.delete(callback);
  }

  public onRemoteGraphChange(
    callback: (nodes: Node<InfrastructureNodeData>[], edges: Edge<EdgeStreamData>[]) => void
  ): () => void {
    this.remoteGraphListeners.add(callback);
    return () => this.remoteGraphListeners.delete(callback);
  }

  private notifyStatus() {
    for (const listener of this.statusListeners) {
      listener(this.connectionStatus);
    }
  }

  private notifyPeers() {
    if (!this.provider) {
      for (const listener of this.peersListeners) {
        listener([]);
      }
      return;
    }

    const localClientId = this.provider.awareness.clientID;
    const states = this.provider.awareness.getStates();
    const peers: PeerState[] = [];

    states.forEach((state, clientId) => {
      // Exclude local user from the remote peers array
      if (clientId !== localClientId && state.user) {
        peers.push({
          clientId,
          user: state.user as PeerUser,
          cursor: state.cursor as { x: number; y: number } | null,
          selectedNodeId: state.selectedNodeId as string | null,
          lastActive: Date.now(),
        });
      }
    });

    for (const listener of this.peersListeners) {
      listener(peers);
    }
  }
}

// Global Singleton CollabManager
export const collabManager = new CollabManager();
