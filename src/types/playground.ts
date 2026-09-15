export type NodeCategory = 'CLIENT' | 'COMPUTE' | 'STORAGE' | 'MESSAGING' | 'NETWORK';

export type ComponentTypeId = 
  | 'traffic_generator'
  | 'api_gateway'
  | 'load_balancer'
  | 'web_server'
  | 'cache'
  | 'relational_db'
  | 'nosql_db'
  | 'message_queue'
  | 'cdn'
  | 'object_storage';

export type TrafficProfile = 'steady' | 'poisson' | 'spike' | 'diurnal';

export type AvailabilityZone = 'us-east-1a' | 'us-east-1b' | 'us-east-1c';

export type CircuitBreakerState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export type LoadBalancerAlgorithm = 'round_robin' | 'least_conn' | 'ip_hash';

export type EvictionPolicy = 'LRU' | 'LFU' | 'TTL';

export interface ComponentMetadata {
  typeId: ComponentTypeId;
  name: string;
  category: NodeCategory;
  description: string;
  iconName: string;
  defaultCapacityRps: number;
  defaultLatencyMs: number;
  defaultCostPerHour: number;
  defaultQueueDepth: number;
  color: string;
}

export type NodeHealthStatus = 'healthy' | 'warning' | 'critical' | 'dead';

export interface InfrastructureNodeData extends Record<string, unknown> {
  label: string;
  typeId: ComponentTypeId;
  category: NodeCategory;
  instanceCount: number;
  capacityRps: number;
  latencyMs: number;
  maxQueueDepth: number;
  failureRate: number; // 0 to 100 percentage
  costPerHour: number;
  isKilled: boolean;
  
  // Real-time telemetry metrics updated during simulation
  currentRps: number;
  currentQueue: number;
  currentLatency: number;
  status: NodeHealthStatus;
  utilizationPercent: number;
  isBottleneck: boolean;
  
  // Resilience & Multi-AZ
  availabilityZone?: AvailabilityZone;
  circuitBreakerEnabled?: boolean;
  circuitBreakerState?: CircuitBreakerState;
  injectedLatencyMs?: number;
  
  // Component specific parameters
  hitRatePercent?: number; // Cache hit rate (0-100)
  memoryGb?: number; // Cache memory size
  evictionPolicy?: EvictionPolicy;
  readRatioPercent?: number; // DB Read vs Write split
  connectionPoolSize?: number; // DB max connection pool
  lbAlgorithm?: LoadBalancerAlgorithm; // Load balancer routing strategy
}

export interface EdgeStreamData extends Record<string, unknown> {
  currentFlowRps?: number;
  latencyMs?: number;
  errorRatePercent?: number;
  animated?: boolean;
  injectedLatencyMs?: number;
}

export interface SystemMetricsSnapshot {
  timestamp: number;
  totalTargetRps: number;
  totalProcessedRps: number;
  totalDroppedRps: number;
  p95LatencyMs: number;
  activeQueueTotal: number;
  hourlyCost: number;
  avgUtilizationPercent: number;
}

export interface ArchitecturePreset {
  id: string;
  name: string;
  description: string;
  category: string;
  nodes: Array<{
    id: string;
    type: string;
    position: { x: number; y: number };
    data: Partial<InfrastructureNodeData>;
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    type?: string;
    label?: string;
    data?: Partial<EdgeStreamData>;
  }>;
}

export type SimulationEngineMode = 'wasm' | 'js';

export interface EngineBenchmarkData {
  wasmOpsPerSec: number;
  wasmDurationMs: number;
  jsOpsPerSec: number;
  jsDurationMs: number;
  speedupFactor: number;
  iterations: number;
  timestamp: number;
}

