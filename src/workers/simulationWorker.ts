import { 
  InfrastructureNodeData, 
  EdgeStreamData, 
  SystemMetricsSnapshot, 
  TrafficProfile,
  AvailabilityZone,
  CircuitBreakerState,
  SimulationEngineMode
} from '../types/playground';
import { 
  calculateDynamicTrafficRate, 
  solveKendallMMcK, 
  solvePullQueueDrain, 
  solveServerlessLatency 
} from '../simulation/queueTheory';
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
        // Effective outflow calculation per component type
        let effectiveOutflow = nodeOutflow;
        let addedHopLatency = 0;

        // Cache hit rate forwarding (misses continue to storage/backends)
        if (currentNode.data.typeId === 'cache') {
          const hitRate = (currentNode.data.hitRatePercent ?? 85) / 100;
          effectiveOutflow = Math.round(nodeOutflow * (1 - hitRate));
        }

        // WAF rate limiting (drops excess, adds security inspection latency)
        if (currentNode.data.typeId === 'waf') {
          const rateLimit = currentNode.data.rateLimitRps ?? 20000;
          effectiveOutflow = Math.min(nodeOutflow, rateLimit);
          addedHopLatency = currentNode.data.inspectionLatencyMs ?? 3;
        }

        // Targets to distribute among
        const targetsToUse = aliveTargets.length > 0 ? aliveTargets : outgoing;

        // Routing & Fan-out strategies
        if (currentNode.data.typeId === 'pub_sub') {
          // 1-to-N Event Fan-Out: Each subscriber edge receives 100% of event outflow
          outgoing.forEach((edge) => {
            const isTargetAlive = targetsToUse.some((t) => t.id === edge.id);
            const flow = isTargetAlive ? effectiveOutflow : 0;

            edgeInflows.set(edge.id, flow);
            const existingTargetInflow = incomingRpsMap.get(edge.target) || 0;
            incomingRpsMap.set(edge.target, existingTargetInflow + flow);

            edgeFlowMap.set(edge.id, {
              flowRps: flow,
              latencyMs: (currentNode.data.latencyMs || 8) + globalInjectedLatencyMs,
              errorRate: isTargetAlive ? (currentNode.data.failureRate || 0) : 100,
            });

            const remaining = (inDegreeMap.get(edge.target) || 1) - 1;
            inDegreeMap.set(edge.target, remaining);
            if (remaining <= 0 && !visitedNodes.has(edge.target)) {
              queue.push(edge.target);
              visitedNodes.add(edge.target);
            }
          });
        } else if (currentNode.data.typeId === 'dns_router') {
          // Route 53 DNS Routing: Weighted (Canary) or Active-Passive Failover
          const routingMode = currentNode.data.dnsRoutingMode || 'weighted';

          if (routingMode === 'failover') {
            const primaryTargetId = currentNode.data.primaryTargetId;
            const primaryAliveEdge = targetsToUse.find(
              (e) => e.target === primaryTargetId || e.id === primaryTargetId
            );

            outgoing.forEach((edge) => {
              let flow = 0;
              if (primaryAliveEdge) {
                // Primary is alive: 100% to primary
                flow = edge.id === primaryAliveEdge.id ? effectiveOutflow : 0;
              } else {
                // Primary is dead: failover evenly to backup alive targets
                const isTargetAlive = targetsToUse.some((t) => t.id === edge.id);
                flow = isTargetAlive ? Math.round(effectiveOutflow / targetsToUse.length) : 0;
              }

              edgeInflows.set(edge.id, flow);
              const existingTargetInflow = incomingRpsMap.get(edge.target) || 0;
              incomingRpsMap.set(edge.target, existingTargetInflow + flow);

              edgeFlowMap.set(edge.id, {
                flowRps: flow,
                latencyMs: (currentNode.data.latencyMs || 12) + globalInjectedLatencyMs,
                errorRate: targetsToUse.some((t) => t.id === edge.id) ? (currentNode.data.failureRate || 0) : 100,
              });

              const remaining = (inDegreeMap.get(edge.target) || 1) - 1;
              inDegreeMap.set(edge.target, remaining);
              if (remaining <= 0 && !visitedNodes.has(edge.target)) {
                queue.push(edge.target);
                visitedNodes.add(edge.target);
              }
            });
          } else {
            // Weighted Traffic Splitting (Canary / Blue-Green)
            const weights = currentNode.data.dnsWeights || {};
            let totalWeight = 0;
            targetsToUse.forEach((edge) => {
              const w = weights[edge.target] ?? weights[edge.id] ?? 0;
              totalWeight += w;
            });

            let allocatedFlow = 0;
            const aliveCount = targetsToUse.length;

            outgoing.forEach((edge) => {
              const isTargetAlive = targetsToUse.some((t) => t.id === edge.id);
              let flow = 0;

              if (isTargetAlive) {
                if (totalWeight > 0) {
                  const targetIdx = targetsToUse.findIndex((t) => t.id === edge.id);
                  const w = weights[edge.target] ?? weights[edge.id] ?? 0;
                  if (targetIdx === aliveCount - 1) {
                    // Exact flow conservation residual
                    flow = Math.max(0, effectiveOutflow - allocatedFlow);
                  } else {
                    flow = Math.round((effectiveOutflow * w) / totalWeight);
                    allocatedFlow += flow;
                  }
                } else {
                  // Fallback equal split
                  flow = Math.round(effectiveOutflow / aliveCount);
                }
              }

              edgeInflows.set(edge.id, flow);
              const existingTargetInflow = incomingRpsMap.get(edge.target) || 0;
              incomingRpsMap.set(edge.target, existingTargetInflow + flow);

              edgeFlowMap.set(edge.id, {
                flowRps: flow,
                latencyMs: (currentNode.data.latencyMs || 12) + globalInjectedLatencyMs,
                errorRate: isTargetAlive ? (currentNode.data.failureRate || 0) : 100,
              });

              const remaining = (inDegreeMap.get(edge.target) || 1) - 1;
              inDegreeMap.set(edge.target, remaining);
              if (remaining <= 0 && !visitedNodes.has(edge.target)) {
                queue.push(edge.target);
                visitedNodes.add(edge.target);
              }
            });
          }
        } else if (currentNode.data.typeId === 'standard_queue' || currentNode.data.typeId === 'message_queue') {
          // Asynchronous Pull-Draining from Queues to Background Workers
          let totalWorkerCapacity = 0;
          targetsToUse.forEach((edge) => {
            const targetNode = nodes.find((n) => n.id === edge.target);
            if (targetNode?.data.typeId === 'background_worker') {
              const wInst = Math.max(1, targetNode.data.instanceCount || 1);
              totalWorkerCapacity += (targetNode.data.capacityRps || 1500) * wInst;
            }
          });

          const currentBacklog = currentNode.data.currentQueue || 0;
          const drainCap = totalWorkerCapacity > 0 ? totalWorkerCapacity : effectiveOutflow;
          const pullResult = solvePullQueueDrain(
            currentBacklog,
            nodeInflow,
            drainCap,
            currentNode.data.maxQueueDepth || 10000
          );

          const splitFlow = Math.round(pullResult.drainedRps / targetsToUse.length);

          outgoing.forEach((edge) => {
            const isTargetAlive = targetsToUse.some((t) => t.id === edge.id);
            const flow = isTargetAlive ? splitFlow : 0;

            edgeInflows.set(edge.id, flow);
            const existingTargetInflow = incomingRpsMap.get(edge.target) || 0;
            incomingRpsMap.set(edge.target, existingTargetInflow + flow);

            edgeFlowMap.set(edge.id, {
              flowRps: flow,
              latencyMs: (currentNode.data.latencyMs || 15) + addedHopLatency + globalInjectedLatencyMs,
              errorRate: isTargetAlive ? (currentNode.data.failureRate || 0) : 100,
            });

            const remaining = (inDegreeMap.get(edge.target) || 1) - 1;
            inDegreeMap.set(edge.target, remaining);
            if (remaining <= 0 && !visitedNodes.has(edge.target)) {
              queue.push(edge.target);
              visitedNodes.add(edge.target);
            }
          });
        } else {
          // Intelligent multi-target load distribution:
          // Check if targets include a mixture of Cache and Database (Read/Write splitting)
          const targetNodes = targetsToUse.map((edge) => ({
            edge,
            node: nodes.find((n) => n.id === edge.target),
          }));

          const hasCache = targetNodes.some((t) => t.node?.data.typeId === 'cache');
          const hasDb = targetNodes.some(
            (t) => t.node?.data.typeId === 'relational_db' || t.node?.data.typeId === 'nosql_db'
          );

          // Flow allocation map per edge ID
          const edgeFlowAllocations = new Map<string, number>();

          if (hasCache && hasDb) {
            // Classical Cache-Aside Read/Write Splitting
            const readRatio = (currentNode.data.readRatioPercent ?? 80) / 100;
            const cacheEdges = targetNodes.filter((t) => t.node?.data.typeId === 'cache');
            const dbEdges = targetNodes.filter(
              (t) => t.node?.data.typeId === 'relational_db' || t.node?.data.typeId === 'nosql_db'
            );
            const otherEdges = targetNodes.filter(
              (t) => t.node?.data.typeId !== 'cache' && t.node?.data.typeId !== 'relational_db' && t.node?.data.typeId !== 'nosql_db'
            );

            const totalReadFlow = Math.round(effectiveOutflow * readRatio);
            const totalWriteFlow = Math.max(0, effectiveOutflow - totalReadFlow);

            // Distribute reads equally among caches
            const perCache = Math.round(totalReadFlow / Math.max(1, cacheEdges.length));
            cacheEdges.forEach((c) => edgeFlowAllocations.set(c.edge.id, perCache));

            // Distribute writes equally among DBs
            const perDb = Math.round(totalWriteFlow / Math.max(1, dbEdges.length));
            dbEdges.forEach((d) => edgeFlowAllocations.set(d.edge.id, perDb));

            otherEdges.forEach((o) => edgeFlowAllocations.set(o.edge.id, 0));
          } else {
            // Weighted Round-Robin by target instance count
            const totalWeight = targetNodes.reduce((sum, t) => {
              const inst = Math.max(1, t.node?.data.instanceCount || 1);
              return sum + inst;
            }, 0);

            let allocated = 0;
            targetNodes.forEach((t, idx) => {
              const inst = Math.max(1, t.node?.data.instanceCount || 1);
              if (idx === targetNodes.length - 1) {
                // Exact flow conservation residual
                edgeFlowAllocations.set(t.edge.id, Math.max(0, effectiveOutflow - allocated));
              } else {
                const flow = Math.round((effectiveOutflow * inst) / Math.max(1, totalWeight));
                allocated += flow;
                edgeFlowAllocations.set(t.edge.id, flow);
              }
            });
          }

          outgoing.forEach((edge) => {
            const isTargetAlive = targetsToUse.some((t) => t.id === edge.id);
            const flow = isTargetAlive ? (edgeFlowAllocations.get(edge.id) ?? 0) : 0;

            edgeInflows.set(edge.id, flow);
            const existingTargetInflow = incomingRpsMap.get(edge.target) || 0;
            incomingRpsMap.set(edge.target, existingTargetInflow + flow);

            edgeFlowMap.set(edge.id, {
              flowRps: flow,
              latencyMs: (currentNode.data.latencyMs || 5) + addedHopLatency + globalInjectedLatencyMs,
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

    let processedRps = qResult.processedRps;
    let droppedRps = qResult.droppedRps;
    let latencyMs = qResult.latencyMs;
    let queueDepth = qResult.queueDepth;

    // Component-specific adjustments

    // 1. WAF: Token-bucket rate limiting (429 drops) and security inspection latency
    if (node.data.typeId === 'waf') {
      const rateLimit = node.data.rateLimitRps ?? 20000;
      const wafDrops = Math.max(0, arrivalRate - rateLimit);
      droppedRps += wafDrops;
      processedRps = Math.min(processedRps, arrivalRate - wafDrops);
      latencyMs += (node.data.inspectionLatencyMs ?? 3);
    }

    // 2. Serverless Function: Cold start latency on un-provisioned burst concurrency
    if (node.data.typeId === 'serverless_function') {
      const warmCap = (node.data.warmConcurrency ?? 10) * capacityPerInstance;
      const serverlessResult = solveServerlessLatency(
        baseLatency,
        arrivalRate,
        warmCap,
        node.data.coldStartLatencyMs ?? 250,
        Math.max(0, qResult.latencyMs - baseLatency)
      );
      latencyMs = serverlessResult.effectiveLatencyMs;
    }

    // 3. External API: 504 timeouts based on chaos failure rate
    if (node.data.typeId === 'external_api') {
      const failRate = node.data.failureRate || 0;
      const timeoutDrops = Math.round(arrivalRate * (failRate / 100));
      droppedRps = Math.max(droppedRps, timeoutDrops);
      processedRps = Math.max(0, arrivalRate - droppedRps);
      latencyMs = (node.data.latencyMs || 150) + globalInjectedLatencyMs;
    }

    // 4. Queues: Track buffer backlog
    if (node.data.typeId === 'standard_queue' || node.data.typeId === 'message_queue') {
      queueDepth = Math.min(maxQueue, qResult.queueDepth);
    }

    const utilizationPercent = Math.min(100, Math.round(qResult.rho * 100));

    // Bottleneck detection on non-traffic-generators
    if (qResult.rho > maxRho && node.data.typeId !== 'traffic_generator') {
      maxRho = qResult.rho;
      if (qResult.rho >= 0.85) {
        bottleneckNodeId = node.id;
        bottleneckReason = `${node.data.label} is at ${utilizationPercent}% capacity. Scale instances or add caching.`;
      }
    }

    if (node.data.typeId !== 'traffic_generator') {
      totalDroppedRps += droppedRps;
      totalActiveQueue += queueDepth;
    }

    let status: 'healthy' | 'warning' | 'critical' | 'dead' = 'healthy';
    if (qResult.rho >= 1.0 || droppedRps > 0) {
      status = 'critical';
    } else if (qResult.rho >= 0.80 || queueDepth > 20) {
      status = 'warning';
    }

    const cbState = circuitBreakerUpdates.get(node.id) || node.data.circuitBreakerState || 'CLOSED';

    return {
      id: node.id,
      data: {
        currentRps: processedRps,
        currentQueue: queueDepth,
        currentLatency: latencyMs,
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

  // Industry-Standard System Ingress Throughput (Goodput):
  // Measures client requests successfully serviced across the system boundary
  const totalIngressOffered = trafficGenerators.length > 0
    ? trafficGenerators.reduce((sum, tg) => sum + (incomingRpsMap.get(tg.id) || 0), 0)
    : nodes
        .filter((n) => (inDegreeMap.get(n.id) || 0) === 0 && !isNodeEffectivelyDead(n))
        .reduce((sum, n) => sum + (incomingRpsMap.get(n.id) || n.data.currentRps || 0), 0);

  const systemThroughputRps = Math.max(0, totalIngressOffered - totalDroppedRps);

  // Cumulative critical path p95 latency:
  // Propagate path latencies through DAG to measure end-to-end client round-trip response time
  const nodeLatencyMap = new Map<string, number>();
  updatedNodes.forEach((n) => nodeLatencyMap.set(n.id, n.data.currentLatency || 0));

  const pathLatencyMap = new Map<string, number>();
  // BFS topological order
  nodes.forEach((n) => {
    const selfLatency = nodeLatencyMap.get(n.id) || 0;
    const incomingEdges = edges.filter((e) => e.target === n.id);
    const maxParentPath = incomingEdges.length > 0
      ? Math.max(...incomingEdges.map((e) => pathLatencyMap.get(e.source) || 0))
      : 0;
    pathLatencyMap.set(n.id, maxParentPath + selfLatency);
  });

  const cumulativeP95Latency = pathLatencyMap.size > 0
    ? Math.max(...Array.from(pathLatencyMap.values()))
    : 0;

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
    totalProcessedRps: systemThroughputRps,
    totalDroppedRps,
    p95LatencyMs: cumulativeP95Latency,
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
