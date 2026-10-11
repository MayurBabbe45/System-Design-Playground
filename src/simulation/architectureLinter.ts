import type { InfrastructureNodeData, EdgeStreamData } from '../types/playground.ts';
import type { Node, Edge } from '@xyflow/react';

export type IssueSeverity = 'critical' | 'warning' | 'info';

export interface ArchitectureAuditIssue {
  id: string;
  severity: IssueSeverity;
  title: string;
  description: string;
  affectedNodeId?: string;
  remediation: string;
}

export interface ArchitectureAuditResult {
  score: number; // 0 to 100
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  issues: ArchitectureAuditIssue[];
  passedRules: string[];
}

export function auditArchitecture(
  nodes: Node<InfrastructureNodeData>[],
  edges: Edge<EdgeStreamData>[]
): ArchitectureAuditResult {
  const issues: ArchitectureAuditIssue[] = [];
  const passedRules: string[] = [];

  if (nodes.length === 0) {
    return {
      score: 100,
      grade: 'A',
      issues: [],
      passedRules: ['Canvas is ready for design.'],
    };
  }

  // Rule 1: Single Point of Failure (SPOF) on Database
  const dbNodes = nodes.filter((n) => n.data.typeId === 'relational_db' || n.data.typeId === 'nosql_db');
  let spofDbFound = false;
  dbNodes.forEach((db) => {
    if ((db.data.instanceCount || 1) === 1) {
      spofDbFound = true;
      issues.push({
        id: `spof-db-${db.id}`,
        severity: 'critical',
        title: `Single Point of Failure: ${db.data.label}`,
        description: `Database has only 1 instance with no standby replica. A node failure causes total system downtime.`,
        affectedNodeId: db.id,
        remediation: `Scale instance count to 2+ to enable primary/replica replication.`,
      });
    }
  });
  if (!spofDbFound && dbNodes.length > 0) {
    passedRules.push('Database redundancy: Multi-instance replication configured.');
  }

  // Rule 2: Compute Single Instance
  const computeNodes = nodes.filter((n) => n.data.typeId === 'web_server');
  let spofComputeFound = false;
  computeNodes.forEach((srv) => {
    if ((srv.data.instanceCount || 1) === 1) {
      spofComputeFound = true;
      issues.push({
        id: `spof-compute-${srv.id}`,
        severity: 'warning',
        title: `Single Compute Instance: ${srv.data.label}`,
        description: `App server has only 1 instance. If traffic spikes or the host crashes, requests will drop.`,
        affectedNodeId: srv.id,
        remediation: `Increase instances to 2+ behind a Load Balancer for high availability.`,
      });
    }
  });
  if (!spofComputeFound && computeNodes.length > 0) {
    passedRules.push('Compute redundancy: Application tier is horizontally scaled.');
  }

  // Rule 3: Load Balancer Downstream Target Redundancy
  const lbNodes = nodes.filter((n) => n.data.typeId === 'load_balancer');
  let singleTargetLbFound = false;
  lbNodes.forEach((lb) => {
    const targets = edges.filter((e) => e.source === lb.id);
    if (targets.length === 1) {
      singleTargetLbFound = true;
      issues.push({
        id: `lb-single-target-${lb.id}`,
        severity: 'warning',
        title: `No Load Distribution on ${lb.data.label}`,
        description: `Load balancer only routes traffic to a single downstream component.`,
        affectedNodeId: lb.id,
        remediation: `Connect at least 2 target server nodes to distribute incoming traffic.`,
      });
    }
  });
  if (!singleTargetLbFound && lbNodes.length > 0) {
    passedRules.push('Load Balancer health: Traffic is distributed across multiple targets.');
  }

  // Rule 4: Uncached Read-Heavy Database
  const caches = nodes.filter((n) => n.data.typeId === 'cache');
  dbNodes.forEach((db) => {
    const readRatio = db.data.readRatioPercent ?? 80;
    if (readRatio >= 70 && caches.length === 0) {
      issues.push({
        id: `missing-cache-${db.id}`,
        severity: 'warning',
        title: `Read-Heavy DB without In-Memory Cache: ${db.data.label}`,
        description: `Database has ${readRatio}% read workload without a Redis cache. This can lead to disk I/O exhaustion.`,
        affectedNodeId: db.id,
        remediation: `Introduce a Redis cache cluster upstream to absorb hot read traffic.`,
      });
    }
  });
  if (caches.length > 0) {
    passedRules.push('Caching layer: Redis cache absorbs high-frequency read requests.');
  }

  // Rule 5: Multi-AZ Resilience
  const azs = new Set(nodes.map((n) => n.data.availabilityZone).filter(Boolean));
  if (nodes.length >= 4 && azs.size < 2) {
    issues.push({
      id: 'single-az-risk',
      severity: 'warning',
      title: 'Single Availability Zone Risk',
      description: 'All components are deployed in a single availability zone. A data center blackout will take down the entire system.',
      remediation: 'Distribute components across at least 2 AZs (e.g. us-east-1a and us-east-1b).',
    });
  } else if (azs.size >= 2) {
    passedRules.push(`Multi-AZ deployment: System is distributed across ${azs.size} Availability Zones.`);
  }

  // Rule 6: High Traffic Direct Ingestion without Queue
  const trafficGenerators = nodes.filter((n) => n.data.typeId === 'traffic_generator');
  const hasQueue = nodes.some((n) => n.data.typeId === 'message_queue');
  const highTraffic = trafficGenerators.some((tg) => (tg.data.capacityRps || 0) >= 10000);
  if (highTraffic && !hasQueue && dbNodes.length > 0) {
    issues.push({
      id: 'missing-queue-buffer',
      severity: 'info',
      title: 'High Ingestion Volume without Message Queue',
      description: 'System processes >10K RPS without an asynchronous message queue (Kafka/RabbitMQ) for backpressure buffering.',
      remediation: 'Introduce an event streaming queue between Gateway and DB to smooth traffic spikes.',
    });
  } else if (hasQueue) {
    passedRules.push('Async buffering: Message queue decouples ingest from processing.');
  }

  // Rule 7: WAF Protection on Public API Gateway
  const apiGateways = nodes.filter((n) => n.data.typeId === 'api_gateway');
  const wafs = nodes.filter((n) => n.data.typeId === 'waf');
  const cdns = nodes.filter((n) => n.data.typeId === 'cdn');
  apiGateways.forEach((gw) => {
    const upstreamEdges = edges.filter((e) => e.target === gw.id);
    const hasClientIngress = upstreamEdges.some((e) => {
      const srcNode = nodes.find((n) => n.id === e.source);
      return srcNode?.data.typeId === 'traffic_generator' || srcNode?.data.typeId === 'dns_router';
    });
    const hasProtection = upstreamEdges.some((e) => {
      const srcNode = nodes.find((n) => n.id === e.source);
      return srcNode?.data.typeId === 'waf' || srcNode?.data.typeId === 'cdn';
    });

    if (hasClientIngress && !hasProtection && wafs.length === 0 && cdns.length === 0) {
      issues.push({
        id: `unprotected-gw-${gw.id}`,
        severity: 'warning',
        title: `Unprotected Ingress on ${gw.data.label}`,
        description: `API Gateway receives direct ingress without a Web Application Firewall (WAF) or CDN edge shield. Vulnerable to DDoS and Layer 7 threats.`,
        affectedNodeId: gw.id,
        remediation: `Place a WAF node or CDN in front of the API Gateway to filter malicious traffic and enforce rate limits.`,
      });
    }
  });
  if (wafs.length > 0) {
    passedRules.push('Security Layer: WAF filters malicious traffic and enforces rate limits.');
  }

  // Rule 8: Queue Without Consumer
  const queues = nodes.filter((n) => n.data.typeId === 'standard_queue' || n.data.typeId === 'message_queue');
  queues.forEach((q) => {
    const downstream = edges.filter((e) => e.source === q.id);
    const upstream = edges.filter((e) => e.target === q.id);
    if (upstream.length > 0 && downstream.length === 0) {
      issues.push({
        id: `unconsumed-queue-${q.id}`,
        severity: 'warning',
        title: `Unconsumed Message Queue: ${q.data.label}`,
        description: `Queue receives tasks from upstream producers but has no connected consumers or background workers. Tasks will accumulate and overflow.`,
        affectedNodeId: q.id,
        remediation: `Connect a Background Worker or App Server downstream of the queue to drain tasks.`,
      });
    }
  });

  // Rule 9: Orphan Pub/Sub Topic
  const pubSubs = nodes.filter((n) => n.data.typeId === 'pub_sub');
  pubSubs.forEach((ps) => {
    const downstream = edges.filter((e) => e.source === ps.id);
    const upstream = edges.filter((e) => e.target === ps.id);
    if (upstream.length > 0 && downstream.length === 0) {
      issues.push({
        id: `orphan-pubsub-${ps.id}`,
        severity: 'info',
        title: `Orphan Pub/Sub Topic: ${ps.data.label}`,
        description: `Pub/Sub topic receives published events but has 0 subscriber targets. Events will not reach any consumers.`,
        affectedNodeId: ps.id,
        remediation: `Connect downstream services or queues to subscribe to topic events.`,
      });
    }
  });
  if (pubSubs.length > 0 && pubSubs.every((ps) => edges.some((e) => e.source === ps.id))) {
    passedRules.push('Event Fan-Out: Pub/Sub topic broadcasts events to all active subscriber targets.');
  }

  // Rule 10: External API Resilience
  const extApis = nodes.filter((n) => n.data.typeId === 'external_api');
  extApis.forEach((api) => {
    const failRate = api.data.failureRate || 0;
    if (failRate >= 10) {
      const upstreamEdges = edges.filter((e) => e.target === api.id);
      const callersWithoutCb = upstreamEdges
        .map((e) => nodes.find((n) => n.id === e.source))
        .filter((caller) => caller && !caller.data.circuitBreakerEnabled);

      if (callersWithoutCb.length > 0) {
        issues.push({
          id: `ext-api-cb-${api.id}`,
          severity: 'warning',
          title: `Cascading Failure Risk: ${api.data.label}`,
          description: `External API has high failure rate (${failRate}%) but callers lack Circuit Breakers. Failures can exhaust thread pools.`,
          affectedNodeId: api.id,
          remediation: `Enable Circuit Breaker on upstream callers to fail-fast when the third-party service degrades.`,
        });
      }
    }
  });

  // Calculate Score
  let score = 100;
  issues.forEach((issue) => {
    if (issue.severity === 'critical') score -= 25;
    if (issue.severity === 'warning') score -= 12;
    if (issue.severity === 'info') score -= 5;
  });
  score = Math.max(0, Math.min(100, score));

  // Determine Grade
  let grade: 'A' | 'B' | 'C' | 'D' | 'F' = 'A';
  if (score >= 90) grade = 'A';
  else if (score >= 75) grade = 'B';
  else if (score >= 60) grade = 'C';
  else if (score >= 45) grade = 'D';
  else grade = 'F';

  return {
    score,
    grade,
    issues,
    passedRules,
  };
}
