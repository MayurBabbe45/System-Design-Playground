import { 
  InfrastructureNodeData, 
  EdgeStreamData, 
  SystemMetricsSnapshot, 
  TrafficProfile,
  AvailabilityZone,
  CircuitBreakerState,
  SimulationEngineMode
} from '../types/playground';
import { calculateDynamicTrafficRate, solveKendallMMcK } from '../simulation/queueTheory';
import { initWasmEngine, isWasmReady, solveKendallMMcKWasm } from '../wasm/wasmEngine';

// Pre-initialize WASM engine in background worker
initWasmEngine().catch((err) => {
  console.warn('Background WASM initialization:', err);
});

export interface WorkerSimulationInput {
  nodes: Array<{ id: string; data: InfrastructureNodeData }>;
  edges: Array<{ id: string; source: string; target: string; data?: EdgeStreamData }>;
  targetGlobalRps: number;
  trafficProfile: TrafficProfile;
  tickCount: number;
  killedAzs: AvailabilityZone[];
  globalInjectedLatencyMs: number;
  globalPacketDropPercent: number;
  engineMode?: SimulationEngineMode;
}

export interface WorkerSimulationOutput {
  updatedNodes: Array<{ id: string; data: Partial<InfrastructureNodeData> }>;
  updatedEdges: Array<{ id: string; data: Partial<EdgeStreamData> }>;
  snapshot: SystemMetricsSnapshot;
  bottleneckNodeId: string | null;
  bottleneckReason: string | null;
  engineMode: SimulationEngineMode;
  isWasmReady: boolean;
  computeDurationMs: number;
}

self.onmessage = (e: MessageEvent<WorkerSimulationInput>) => {
  const computeStartTime = performance.now();
  const { 
    nodes, 
    edges, 
    targetGlobalRps, 
    trafficProfile, 
    tickCount,
    killedAzs = [],
    globalInjectedLatencyMs = 0,
    globalPacketDropPercent = 0,
    engineMode = 'wasm'
  } = e.data;

  // 1. Dynamic arrival rate
  const dynamicRps = calculateDynamicTrafficRate(targetGlobalRps, trafficProfile, tickCount);

  // 2. Identify dead nodes (either explicitly killed or belonging to a killed AZ)
  const isNodeEffectivelyDead = (node: { id: string; data: InfrastructureNodeData }) => {
    if (node.data.isKilled) return true;
    if (node.data.availabilityZone && killedAzs.includes(node.data.availabilityZone)) return true;
    return false;
  };

  const incomingRpsMap = new Map<string, number>();
  const edgeFlowMap = new Map<string, { flowRps: number; latencyMs: number; errorRate: number }>();

  nodes.forEach((n) => incomingRpsMap.set(n.id, 0));

  // Initialize Traffic Generators
  const trafficGenerators = nodes.filter((n) => n.data.typeId === 'traffic_generator' && !isNodeEffectivelyDead(n));
  trafficGenerators.forEach((tg) => {
    // Apply packet drop if globally injected
    const effectiveRps = Math.round(dynamicRps * (1 - globalPacketDropPercent / 100));
    incomingRpsMap.set(tg.id, effectiveRps);
  });

  // Calculate in-degrees
  const inDegreeMap = new Map<string, number>();
  nodes.forEach((n) => {
    const incomingCount = edges.filter((e) => e.target === n.id).length;
    inDegreeMap.set(n.id, incomingCount);
  });

  // Level-by-level BFS traversal with cycle-breaker safety
  const queue: string[] = [];
  const visitedNodes = new Set<string>();

  nodes.forEach((n) => {
    if ((inDegreeMap.get(n.id) || 0) === 0) {
      queue.push(n.id);
      visitedNodes.add(n.id);
    }
  });

  const edgeInflows = new Map<string, number>();
  const circuitBreakerUpdates = new Map<string, CircuitBreakerState>();
  let loopSafeguard = 0;
  const maxIterations = Math.max(50, nodes.length * 4);

  while (loopSafeguard++ < maxIterations) {
    if (queue.length === 0) {
      // Check if there are unvisited nodes in disconnected clusters or cyclic loops
      const unvisited = nodes.filter((n) => !visitedNodes.has(n.id));
      if (unvisited.length > 0) {
        queue.push(unvisited[0].id);
        visitedNodes.add(unvisited[0].id);
      } else {
        break; // All nodes processed
      }
    }

    const currentId = queue.shift()!;
    const currentNode = nodes.find((n) => n.id === currentId);
    if (!currentNode) continue;

    let nodeInflow = incomingRpsMap.get(currentId) || 0;
    if (isNodeEffectivelyDead(currentNode)) {
      nodeInflow = 0;
    }

    // Capacity limit
    const instanceCount = currentNode.data.instanceCount || 1;
    const capacityTotal = (currentNode.data.capacityRps || 1000) * instanceCount;
    const nodeOutflow = Math.min(nodeInflow, capacityTotal);

    const outgoing = edges.filter((e) => e.source === currentId);
    if (outgoing.length > 0 && nodeOutflow > 0) {
      // Filter out dead targets to simulate load balancer failover!
      const aliveTargets = outgoing.filter((e) => {
        const targetNode = nodes.find((n) => n.id === e.target);
        return targetNode && !isNodeEffectivelyDead(targetNode);
      });

      // Circuit Breaker logic
      if (currentNode.data.circuitBreakerEnabled) {
        if (aliveTargets.length === 0) {
          circuitBreakerUpdates.set(currentId, 'OPEN');
        } else {
          circuitBreakerUpdates.set(currentId, 'CLOSED');
        }
      }

      // If circuit breaker is OPEN, shed traffic (fast-fail)
      const isCbOpen = circuitBreakerUpdates.get(currentId) === 'OPEN';
      if (isCbOpen) {
        // Drop traffic immediately, do not forward
        outgoing.forEach((edge) => {
          edgeFlowMap.set(edge.id, {
            flowRps: 0,
            latencyMs: 1,
            errorRate: 100,
          });
        });
      } else {
        // Cache hit rate forwarding
        let effectiveOutflow = nodeOutflow;
        if (currentNode.data.typeId === 'cache') {
          const hitRate = (currentNode.data.hitRatePercent ?? 85) / 100;
          // Misses go to DB
          effectiveOutflow = Math.round(nodeOutflow * (1 - hitRate));
        }

        // Distribute among alive targets, or all if none alive
        const targetsToUse = aliveTargets.length > 0 ? aliveTargets : outgoing;
        const splitFlow = Math.round(effectiveOutflow / targetsToUse.length);

        outgoing.forEach((edge) => {
          const isTargetAlive = targetsToUse.some((t) => t.id === edge.id);
          const flow = isTargetAlive ? splitFlow : 0;
          
          edgeInflows.set(edge.id, flow);
          const existingTargetInflow = incomingRpsMap.get(edge.target) || 0;
          incomingRpsMap.set(edge.target, existingTargetInflow + flow);

          edgeFlowMap.set(edge.id, {
            flowRps: flow,
            latencyMs: (currentNode.data.latencyMs || 5) + globalInjectedLatencyMs,
            errorRate: isTargetAlive ? (currentNode.data.failureRate || 0) : 100,
          });

          // Decrement in-degree
          const remaining = (inDegreeMap.get(edge.target) || 1) - 1;
          inDegreeMap.set(edge.target, remaining);
          if (remaining <= 0 && !visitedNodes.has(edge.target)) {
            queue.push(edge.target);
            visitedNodes.add(edge.target);
          }
        });
      }
    }
  }

  // 3. Compute M/M/c/K queue metrics per node
  let totalHourlyCost = 0;
  let totalProcessedRps = 0;
  let totalDroppedRps = 0;
  let maxP95Latency = 0;
  let totalActiveQueue = 0;
  let maxRho = 0;
  let bottleneckNodeId: string | null = null;
  let bottleneckReason: string | null = null;

  const updatedNodes = nodes.map((node) => {
    const isDead = isNodeEffectivelyDead(node);

    if (isDead) {
      return {
        id: node.id,
        data: {
          currentRps: 0,
          currentQueue: 0,
          currentLatency: 0,
          status: 'dead' as const,
          utilizationPercent: 0,
          isBottleneck: false,
          circuitBreakerState: 'CLOSED' as const,
        },
      };
    }

    const instances = Math.max(1, node.data.instanceCount || 1);
    const nodeCost = (node.data.costPerHour || 0) * instances;
    totalHourlyCost += nodeCost;

    const arrivalRate = incomingRpsMap.get(node.id) || 0;
    const capacityPerInstance = node.data.capacityRps || 1000;
    const maxQueue = node.data.maxQueueDepth || 500;
    const baseLatency = (node.data.latencyMs || 5) + globalInjectedLatencyMs;

    // Kendall M/M/c/K solution (WebAssembly or JavaScript)
    const useWasm = engineMode === 'wasm' && isWasmReady();
    const qResult = useWasm
      ? solveKendallMMcKWasm(
          arrivalRate,
          capacityPerInstance,
          instances,
          maxQueue,
          baseLatency
        )
      : solveKendallMMcK(
          arrivalRate,
          capacityPerInstance,
          instances,
          maxQueue,
          baseLatency
        );

    const utilizationPercent = Math.round(qResult.rho * 100);

    // Bottleneck detection on non-traffic-generators
    if (qResult.rho > maxRho && node.data.typeId !== 'traffic_generator') {
      maxRho = qResult.rho;
      if (qResult.rho >= 0.85) {
        bottleneckNodeId = node.id;
        bottleneckReason = `${node.data.label} is at ${utilizationPercent}% capacity. Scale instances or add caching.`;
      }
    }

    if (node.data.typeId !== 'traffic_generator') {
      totalProcessedRps += qResult.processedRps;
      totalDroppedRps += qResult.droppedRps;
      totalActiveQueue += qResult.queueDepth;
      maxP95Latency = Math.max(maxP95Latency, qResult.latencyMs);
    }

    let status: 'healthy' | 'warning' | 'critical' | 'dead' = 'healthy';
    if (qResult.rho >= 1.0 || qResult.droppedRps > 0) {
      status = 'critical';
    } else if (qResult.rho >= 0.80 || qResult.queueDepth > 20) {
      status = 'warning';
    }

    const cbState = circuitBreakerUpdates.get(node.id) || node.data.circuitBreakerState || 'CLOSED';

    return {
      id: node.id,
      data: {
        currentRps: qResult.processedRps,
        currentQueue: qResult.queueDepth,
        currentLatency: qResult.latencyMs,
        status,
        utilizationPercent,
        isBottleneck: false,
        circuitBreakerState: cbState,
      },
    };
  });

  if (bottleneckNodeId) {
    const bNode = updatedNodes.find((n) => n.id === bottleneckNodeId);
    if (bNode) {
      bNode.data.isBottleneck = true;
    }
  }

  const updatedEdges = edges.map((edge) => {
    const flowInfo = edgeFlowMap.get(edge.id) || {
      flowRps: 0,
      latencyMs: 5 + globalInjectedLatencyMs,
      errorRate: 0,
    };
    return {
      id: edge.id,
      data: {
        currentFlowRps: flowInfo.flowRps,
        latencyMs: flowInfo.latencyMs,
        errorRatePercent: flowInfo.errorRate,
        animated: flowInfo.flowRps > 0,
      },
    };
  });

  const activeComputeNodes = updatedNodes.filter((n) => {
    const orig = nodes.find((node) => node.id === n.id);
    return n.data.status !== 'dead' && orig?.data.typeId !== 'traffic_generator';
  });
  const avgUtilization = activeComputeNodes.length > 0
    ? Math.round(
        activeComputeNodes.reduce((sum, n) => sum + (n.data.utilizationPercent || 0), 0) /
          activeComputeNodes.length
      )
    : 0;

  const snapshot: SystemMetricsSnapshot = {
    timestamp: Date.now(),
    totalTargetRps: dynamicRps,
    totalProcessedRps,
    totalDroppedRps,
    p95LatencyMs: maxP95Latency,
    activeQueueTotal: totalActiveQueue,
    hourlyCost: Number(totalHourlyCost.toFixed(2)),
    avgUtilizationPercent: avgUtilization,
  };

  const computeDurationMs = Math.max(0.01, Number((performance.now() - computeStartTime).toFixed(3)));

  const output: WorkerSimulationOutput = {
    updatedNodes,
    updatedEdges,
    snapshot,
    bottleneckNodeId,
    bottleneckReason,
    engineMode,
    isWasmReady: isWasmReady(),
    computeDurationMs,
  };

  self.postMessage(output);
};
