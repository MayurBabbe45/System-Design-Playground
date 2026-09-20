import { ComponentMetadata, ComponentTypeId } from '../types/playground';

export const COMPONENT_CATALOG: Record<ComponentTypeId, ComponentMetadata> = {
  traffic_generator: {
    typeId: 'traffic_generator',
    name: 'Traffic Generator',
    category: 'CLIENT',
    description: 'Simulates incoming HTTP/TCP client requests with dynamic load curves.',
    iconName: 'Users',
    defaultCapacityRps: 1000,
    defaultLatencyMs: 0,
    defaultCostPerHour: 0.0,
    defaultQueueDepth: 0,
    color: '#2563eb', // Clean Technical Blue
  },
  cdn: {
    typeId: 'cdn',
    name: 'CDN / Edge Network',
    category: 'NETWORK',
    description: 'Global edge cache delivering static assets and caching API responses.',
    iconName: 'Globe',
    defaultCapacityRps: 50000,
    defaultLatencyMs: 15,
    defaultCostPerHour: 0.25,
    defaultQueueDepth: 1000,
    color: '#0284c7', // Sky / Edge
  },
  api_gateway: {
    typeId: 'api_gateway',
    name: 'API Gateway',
    category: 'NETWORK',
    description: 'Handles rate limiting, JWT authentication, SSL termination, and API routing.',
    iconName: 'ShieldCheck',
    defaultCapacityRps: 10000,
    defaultLatencyMs: 5,
    defaultCostPerHour: 0.15,
    defaultQueueDepth: 500,
    color: '#4f46e5', // Deep Indigo
  },
  load_balancer: {
    typeId: 'load_balancer',
    name: 'Load Balancer (ALB)',
    category: 'NETWORK',
    description: 'Distributes traffic across downstream compute targets with round-robin or least-conn.',
    iconName: 'GitFork',
    defaultCapacityRps: 15000,
    defaultLatencyMs: 8,
    defaultCostPerHour: 0.08,
    defaultQueueDepth: 1000,
    color: '#3b82f6', // Cobalt Blue
  },
  web_server: {
    typeId: 'web_server',
    name: 'App Server (EC2/Pod)',
    category: 'COMPUTE',
    description: 'Executes core application logic, microservices, and API endpoint handlers.',
    iconName: 'Cpu',
    defaultCapacityRps: 2000,
    defaultLatencyMs: 45,
    defaultCostPerHour: 0.12,
    defaultQueueDepth: 200,
    color: '#2563eb', // Primary Compute Blue
  },
  cache: {
    typeId: 'cache',
    name: 'Redis Cache Cluster',
    category: 'STORAGE',
    description: 'In-memory key-value cache providing sub-millisecond read access.',
    iconName: 'Zap',
    defaultCapacityRps: 25000,
    defaultLatencyMs: 2,
    defaultCostPerHour: 0.20,
    defaultQueueDepth: 1000,
    color: '#0284c7', // Fast Cache Sky
  },
  relational_db: {
    typeId: 'relational_db',
    name: 'PostgreSQL Database',
    category: 'STORAGE',
    description: 'ACID-compliant primary/replica relational database for structured data.',
    iconName: 'Database',
    defaultCapacityRps: 1500,
    defaultLatencyMs: 35,
    defaultCostPerHour: 0.45,
    defaultQueueDepth: 300,
    color: '#334155', // Slate Steel
  },
  nosql_db: {
    typeId: 'nosql_db',
    name: 'NoSQL DB (Document)',
    category: 'STORAGE',
    description: 'High-throughput document key-value store optimized for horizontal scale.',
    iconName: 'Layers',
    defaultCapacityRps: 4000,
    defaultLatencyMs: 18,
    defaultCostPerHour: 0.35,
    defaultQueueDepth: 400,
    color: '#475569', // Muted Slate
  },
  message_queue: {
    typeId: 'message_queue',
    name: 'Kafka Message Queue',
    category: 'MESSAGING',
    description: 'Distributed event streaming buffer for asynchronous queueing & decoupled microservices.',
    iconName: 'MessageSquare',
    defaultCapacityRps: 20000,
    defaultLatencyMs: 10,
    defaultCostPerHour: 0.28,
    defaultQueueDepth: 5000,
    color: '#6366f1', // Stream Indigo
  },
  object_storage: {
    typeId: 'object_storage',
    name: 'S3 Object Storage',
    category: 'STORAGE',
    description: 'Scalable object store for files, media assets, and backups.',
    iconName: 'HardDrive',
    defaultCapacityRps: 10000,
    defaultLatencyMs: 60,
    defaultCostPerHour: 0.05,
    defaultQueueDepth: 1000,
    color: '#64748b', // Cool Slate
  },
};
