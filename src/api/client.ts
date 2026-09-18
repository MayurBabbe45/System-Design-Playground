import { Node, Edge } from '@xyflow/react';
import { InfrastructureNodeData, EdgeStreamData } from '../types/playground';

export interface SavedArchitecture {
  id: string;
  userId: string;
  name: string;
  description: string;
  nodes: Node<InfrastructureNodeData>[];
  edges: Edge<EdgeStreamData>[];
  chaos: Record<string, any>;
  grade: string;
  monthlyCost: number;
  isPublic: boolean;
  version: number;
  forkOfId: string | null;
  createdAt: string;
  updatedAt: string;
  authorName?: string;
}

export interface TelemetryTickInput {
  timestamp: number;
  architectureId: string;
  sessionId: string;
  rps: number;
  p95LatencyMs: number;
  queueDepth: number;
  errorRate: number;
  bottleneckNode?: string;
  engineMode?: string;
}

export interface TelemetryAnalyticsResult {
  totalTicks: number;
  avgRps: number;
  maxRps: number;
  avgQueue: number;
  maxQueue: number;
  avgErrorRate: number;
  p50LatencyMs: number;
  p90LatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  timeSeries?: Array<{
    time: string;
    rps: number;
    latencyMs: number;
    ticks: number;
  }>;
  source: string;
}

// In-memory buffer for batched ClickHouse telemetry streaming
let telemetryQueue: TelemetryTickInput[] = [];
let flushInterval: ReturnType<typeof setInterval> | null = null;

export const apiClient = {
  // --- Architecture CRUD ---

  async listArchitectures(publicOnly: boolean = false): Promise<SavedArchitecture[]> {
    const res = await fetch(`/api/architectures${publicOnly ? '?publicOnly=true' : ''}`);
    if (!res.ok) throw new Error(`Failed to list architectures: ${res.statusText}`);
    const data = await res.json();
    return data.architectures || [];
  },

  async getArchitecture(id: string): Promise<SavedArchitecture> {
    const res = await fetch(`/api/architectures/${id}`);
    if (!res.ok) throw new Error(`Failed to get architecture: ${res.statusText}`);
    const data = await res.json();
    return data.architecture;
  },

  async saveArchitecture(payload: {
    name: string;
    description?: string;
    nodes: Node<InfrastructureNodeData>[];
    edges: Edge<EdgeStreamData>[];
    chaos?: Record<string, any>;
    grade?: string;
    monthlyCost?: number;
    isPublic?: boolean;
  }): Promise<SavedArchitecture> {
    const res = await fetch('/api/architectures', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`Failed to save architecture: ${res.statusText}`);
    const data = await res.json();
    return data.architecture;
  },

  async updateArchitecture(
    id: string,
    payload: Partial<{
      name: string;
      description: string;
      nodes: Node<InfrastructureNodeData>[];
      edges: Edge<EdgeStreamData>[];
      chaos: Record<string, any>;
      grade: string;
      monthlyCost: number;
      isPublic: boolean;
    }>
  ): Promise<SavedArchitecture> {
    const res = await fetch(`/api/architectures/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`Failed to update architecture: ${res.statusText}`);
    const data = await res.json();
    return data.architecture;
  },

  async deleteArchitecture(id: string): Promise<boolean> {
    const res = await fetch(`/api/architectures/${id}`, { method: 'DELETE' });
    return res.ok;
  },

  async forkArchitecture(id: string, newName?: string): Promise<SavedArchitecture> {
    const res = await fetch(`/api/architectures/${id}/fork`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newName }),
    });
    if (!res.ok) throw new Error(`Failed to fork architecture: ${res.statusText}`);
    const data = await res.json();
    return data.architecture;
  },

  // --- ClickHouse Telemetry Streaming ---

  bufferTelemetryTick(tick: TelemetryTickInput) {
    telemetryQueue.push(tick);
    if (telemetryQueue.length >= 50) {
      this.flushTelemetry();
    }
  },

  async flushTelemetry(): Promise<void> {
    if (telemetryQueue.length === 0) return;
    const batch = [...telemetryQueue];
    telemetryQueue = [];

    try {
      await fetch('/api/telemetry/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticks: batch }),
      });
    } catch (err) {
      console.warn('[Telemetry Buffer] Failed to flush to ClickHouse ingest:', err);
    }
  },

  startTelemetryFlusher(intervalMs: number = 2000) {
    if (flushInterval) return;
    flushInterval = setInterval(() => {
      this.flushTelemetry();
    }, intervalMs);
  },

  async queryAnalytics(architectureId?: string, timeWindowMinutes: number = 60): Promise<TelemetryAnalyticsResult> {
    const params = new URLSearchParams();
    if (architectureId) params.set('architectureId', architectureId);
    params.set('timeWindowMinutes', String(timeWindowMinutes));

    const res = await fetch(`/api/telemetry/analytics?${params.toString()}`);
    if (!res.ok) throw new Error(`Failed to query analytics: ${res.statusText}`);
    const data = await res.json();
    return data.analytics;
  },
};

// Initialize flusher in browser
if (typeof window !== 'undefined') {
  apiClient.startTelemetryFlusher();
}
