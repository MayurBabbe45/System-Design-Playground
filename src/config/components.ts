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
    color: '#3b82f6', // Blue
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
    color: '#06b6d4', // Cyan
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
    color: '#8b5cf6', // Purple
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
    color: '#a855f7', // Deep Purple
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
    color: '#10b981', // Emerald Green
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
    color: '#f59e0b', // Amber/Gold
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
    color: '#ef4444', // Red
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
    color: '#f97316', // Orange
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
    color: '#ec4899', // Pink
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
    color: '#64748b', // Slate
  },
};
