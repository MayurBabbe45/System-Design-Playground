import type { 
  Node, 
  Edge, 
  OnNodesChange, 
  OnEdgesChange, 
  OnConnect 
} from '@xyflow/react';
import type { 
  InfrastructureNodeData, 
  ComponentTypeId, 
  SystemMetricsSnapshot,
  TrafficProfile,
  EdgeStreamData,
  AvailabilityZone,
  SimulationEngineMode,
  EngineBenchmarkData
} from '../types/playground.ts';
import type { SavedArchitecture } from '../api/client.ts';

export interface ActiveProjectSummary {
  id: string;
  name: string;
  description?: string;
  isPublic?: boolean;
}

export interface CanvasSlice {
  // Graph Data
  nodes: Node<InfrastructureNodeData>[];
  edges: Edge<EdgeStreamData>[];
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  activePresetId: string;

  // Graph Event Handlers
  onNodesChange: OnNodesChange<Node<InfrastructureNodeData>>;
  onEdgesChange: OnEdgesChange<Edge<EdgeStreamData>>;
  onConnect: OnConnect;

  // Node & Edge Mutation Actions
  setSelectedNodeId: (id: string | null) => void;
  setSelectedEdgeId: (id: string | null) => void;
  addNodeFromPalette: (typeId: ComponentTypeId, position: { x: number; y: number }) => void;
  appendConnectedNode: (sourceNodeId: string, typeId: ComponentTypeId) => void;
  updateNodeData: (id: string, partialData: Partial<InfrastructureNodeData>) => void;
  updateNodeDnsSettings: (id: string, mode: 'weighted' | 'failover', weights?: Record<string, number>, primaryTargetId?: string) => void;
  updateNodeWafSettings: (id: string, rateLimitRps: number, inspectionLatencyMs: number) => void;
  updateNodeServerlessSettings: (id: string, coldStartLatencyMs: number, warmConcurrency: number) => void;
  updateNodeQueueSettings: (id: string, maxQueueDepth: number, batchSize?: number, pollIntervalMs?: number) => void;
  updateNodeExternalApiSettings: (id: string, latencyMs: number, failureRate: number, timeoutThresholdMs?: number) => void;
  toggleNodeKillSwitch: (id: string) => void;
  deleteNode: (id: string) => void;
  deleteEdge: (id: string) => void;

  // History Undo/Redo & Clipboard
  history: { nodes: Node<InfrastructureNodeData>[]; edges: Edge<EdgeStreamData>[] }[];
  future: { nodes: Node<InfrastructureNodeData>[]; edges: Edge<EdgeStreamData>[] }[];
  copiedNode: Node<InfrastructureNodeData> | null;
  takeSnapshot: () => void;
  undo: () => void;
  redo: () => void;
  copySelectedNode: () => void;
  pasteNode: (position?: { x: number; y: number }) => void;
  duplicateSelectedNode: () => void;

  // Presets & Canvas Operations
  loadPreset: (presetId: string) => void;
  clearCanvas: () => void;
}

export interface SimulationSlice {
  // Simulation Controls & Propagation
  isSimulating: boolean;
  isCascadeRunning: boolean;
  activeNodeIds: string[];
  activeEdgeIds: string[];
  simulationSpeed: number;
  targetGlobalRps: number;
  trafficProfile: TrafficProfile;
  tickCount: number;

  // Diagnostics & Telemetry
  bottleneckNodeId: string | null;
  bottleneckReason: string | null;
  telemetryHistory: SystemMetricsSnapshot[];

  // WebAssembly Simulation Engine & Benchmarks
  engineMode: SimulationEngineMode;
  isWasmReady: boolean;
  computeDurationMs: number;
  isBenchmarkModalOpen: boolean;
  benchmarkData: EngineBenchmarkData | null;
  isBenchmarking: boolean;

  // Actions
  startSimulationCascade: () => void;
  stopSimulation: () => void;
  toggleSimulation: () => void;
  setSimulationSpeed: (speed: number) => void;
  setTargetGlobalRps: (rps: number) => void;
  setTrafficProfile: (profile: TrafficProfile) => void;
  tickSimulation: () => void;
  setEngineMode: (mode: SimulationEngineMode) => void;
  toggleBenchmarkModal: () => void;
  runEngineBenchmark: (iterations?: number) => void;
}

export interface ProjectSlice {
  // Application View Routing
  appView: 'auth' | 'dashboard' | 'playground';
  setAppView: (view: 'auth' | 'dashboard' | 'playground') => void;
  activeProject: ActiveProjectSummary | null;
  isViewOnly: boolean;
  setIsViewOnly: (viewOnly: boolean) => void;

  // Project CRUD & Cloud Storage
  activeCloudArchitectureId: string | null;
  isLibraryModalOpen: boolean;
  toggleLibraryModal: () => void;
  loadSavedArchitecture: (arch: SavedArchitecture) => void;
  openProject: (arch: SavedArchitecture, viewOnly?: boolean) => void;
  openProjectById: (id: string, viewOnly?: boolean) => Promise<boolean>;
  returnToDashboard: () => Promise<void>;
  renameActiveProject: (newName: string) => Promise<void>;
  createNewProject: (name: string, description?: string, presetId?: string) => Promise<string | null>;
  forkActiveProject: () => Promise<string | null>;
  getShareableLink: () => string;
  getCompressedShareUrl: () => string;
  loadFromUrlHash: (hash: string) => boolean;
}

export interface UiModalSlice {
  // Chaos Center State
  killedAzs: AvailabilityZone[];
  globalInjectedLatencyMs: number;
  globalPacketDropPercent: number;
  isChaosCenterOpen: boolean;
  toggleChaosCenter: () => void;
  toggleKillAz: (az: AvailabilityZone) => void;
  resetChaos: () => void;
  setGlobalInjectedLatencyMs: (ms: number) => void;
  setGlobalPacketDropPercent: (percent: number) => void;

  // Modals Visibility
  isCostModalOpen: boolean;
  toggleCostModal: () => void;
  isAuditModalOpen: boolean;
  toggleAuditModal: () => void;
  isExportModalOpen: boolean;
  toggleExportModal: () => void;
  isCollabModalOpen: boolean;
  toggleCollabModal: () => void;

  // Theme & Appearance
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  canvasViewMode: 'simple' | 'detailed';
  setCanvasViewMode: (mode: 'simple' | 'detailed') => void;
  toggleCanvasViewMode: () => void;
}

export type PlaygroundStoreState = CanvasSlice & SimulationSlice & ProjectSlice & UiModalSlice;
