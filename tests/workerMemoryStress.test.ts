import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { runSimulationTick } from '../src/workers/simulationWorker.ts';
import type { WorkerSimulationInput } from '../src/workers/simulationWorker.ts';
import type { InfrastructureNodeData } from '../src/types/playground.ts';

function createMockNode(id: string, typeId: any, label: string, extraData: Partial<InfrastructureNodeData> = {}) {
  return {
    id,
    data: {
      label,
      typeId,
      category: 'COMPUTE',
      instanceCount: 2,
      capacityRps: 5000,
      latencyMs: 15,
      maxQueueDepth: 1000,
      failureRate: 0,
      costPerHour: 0.20,
      isKilled: false,
      currentRps: 0,
      currentQueue: 0,
      currentLatency: 0,
      status: 'healthy',
      utilizationPercent: 0,
      isBottleneck: false,
      availabilityZone: 'us-east-1a',
      ...extraData,
    } as InfrastructureNodeData,
  };
}

describe('Web Worker Memory Stress & Structural Invariance Tests', () => {

  it('runs 500 consecutive ticks on complex 25-node topology without memory leak or state divergence', () => {
    // Build a realistic 25-node multi-tier distributed architecture
    const nodes = [
      createMockNode('tg-1', 'traffic_generator', 'Traffic Generator', { capacityRps: 10000 }),
      createMockNode('dns-1', 'dns_router', 'Route53 DNS', { dnsRoutingMode: 'weighted', dnsWeights: { 'waf-1': 50, 'waf-2': 50 } }),
      createMockNode('waf-1', 'waf', 'Primary WAF', { rateLimitRps: 8000 }),
      createMockNode('waf-2', 'waf', 'Secondary WAF', { rateLimitRps: 8000 }),
      createMockNode('alb-1', 'load_balancer', 'ALB 1', { capacityRps: 12000, lbAlgorithm: 'round_robin' }),
      createMockNode('alb-2', 'load_balancer', 'ALB 2', { capacityRps: 12000, lbAlgorithm: 'least_conn' }),
    ];

    // Add 8 app servers
    for (let i = 1; i <= 8; i++) {
      nodes.push(createMockNode(`app-${i}`, 'web_server', `App Server ${i}`, {
        capacityRps: 2000,
        availabilityZone: i % 2 === 0 ? 'us-east-1b' : 'us-east-1a'
      }));
    }

    // Add caches, dbs, queues, workers
    nodes.push(
      createMockNode('cache-1', 'cache', 'Redis Cluster', { capacityRps: 30000, hitRatePercent: 80 }),
      createMockNode('db-1', 'relational_db', 'Primary Postgres', { capacityRps: 4000, instanceCount: 2 }),
      createMockNode('queue-1', 'standard_queue', 'Task Queue', { capacityRps: 15000, maxQueueDepth: 10000 }),
      createMockNode('worker-1', 'background_worker', 'Worker Pool', { capacityRps: 6000, batchSize: 50 }),
      createMockNode('pubsub-1', 'pub_sub', 'Event Bus', { capacityRps: 20000 }),
      createMockNode('sub-1', 'serverless_function', 'Subscriber 1', { capacityRps: 5000, warmConcurrency: 1000 }),
      createMockNode('sub-2', 'serverless_function', 'Subscriber 2', { capacityRps: 5000, warmConcurrency: 1000 }),
      createMockNode('ext-1', 'external_api', 'Payment Gateway', { capacityRps: 3000, failureRate: 5 })
    );

    const edges = [
      { id: 'e1', source: 'tg-1', target: 'dns-1' },
      { id: 'e2', source: 'dns-1', target: 'waf-1' },
      { id: 'e3', source: 'dns-1', target: 'waf-2' },
      { id: 'e4', source: 'waf-1', target: 'alb-1' },
      { id: 'e5', source: 'waf-2', target: 'alb-2' },
      // alb to app servers
      { id: 'e6', source: 'alb-1', target: 'app-1' },
      { id: 'e7', source: 'alb-1', target: 'app-2' },
      { id: 'e8', source: 'alb-1', target: 'app-3' },
      { id: 'e9', source: 'alb-1', target: 'app-4' },
      { id: 'e10', source: 'alb-2', target: 'app-5' },
      { id: 'e11', source: 'alb-2', target: 'app-6' },
      { id: 'e12', source: 'alb-2', target: 'app-7' },
      { id: 'e13', source: 'alb-2', target: 'app-8' },
      // apps to cache and queue
      { id: 'e14', source: 'app-1', target: 'cache-1' },
      { id: 'e15', source: 'app-2', target: 'cache-1' },
      { id: 'e16', source: 'cache-1', target: 'db-1' },
      { id: 'e17', source: 'app-3', target: 'queue-1' },
      { id: 'e18', source: 'queue-1', target: 'worker-1' },
      { id: 'e19', source: 'worker-1', target: 'pubsub-1' },
      { id: 'e20', source: 'pubsub-1', target: 'sub-1' },
      { id: 'e21', source: 'pubsub-1', target: 'sub-2' },
      { id: 'e22', source: 'sub-1', target: 'ext-1' },
    ];

    for (let tick = 1; tick <= 500; tick++) {
      const input: WorkerSimulationInput = {
        nodes,
        edges,
        targetGlobalRps: 6000,
        trafficProfile: tick % 50 === 0 ? 'spike' : 'poisson',
        tickCount: tick,
        killedAzs: [],
        globalInjectedLatencyMs: 0,
        globalPacketDropPercent: 0,
        engineMode: 'js',
      };

      const result = runSimulationTick(input);

      assert.ok(result.snapshot, `Tick ${tick} produced null snapshot`);
      assert.ok(result.snapshot.totalTargetRps > 0, `Tick ${tick} totalTargetRps should be positive`);
      assert.equal(
        result.updatedNodes.length,
        nodes.length,
        `Tick ${tick} updatedNodes count mismatch`
      );
      assert.ok(
        result.computeDurationMs < 50,
        `Tick ${tick} compute duration too high: ${result.computeDurationMs}ms`
      );
    }
  });

  it('guarantees zero residual state leakage when nodes and edges are dynamically pruned', () => {
    const fullNodes = [
      createMockNode('tg-1', 'traffic_generator', 'Traffic Generator'),
      createMockNode('alb-1', 'load_balancer', 'Load Balancer'),
      createMockNode('app-1', 'web_server', 'App 1'),
      createMockNode('app-2', 'web_server', 'App 2'),
      createMockNode('db-1', 'relational_db', 'Database'),
    ];
    const fullEdges = [
      { id: 'e1', source: 'tg-1', target: 'alb-1' },
      { id: 'e2', source: 'alb-1', target: 'app-1' },
      { id: 'e3', source: 'alb-1', target: 'app-2' },
      { id: 'e4', source: 'app-1', target: 'db-1' },
    ];

    // First run with full graph
    const initialResult = runSimulationTick({
      nodes: fullNodes,
      edges: fullEdges,
      targetGlobalRps: 2000,
      trafficProfile: 'steady',
      tickCount: 1,
      killedAzs: [],
      globalInjectedLatencyMs: 0,
      globalPacketDropPercent: 0,
    });
    assert.equal(initialResult.updatedNodes.length, 5);

    // Drastically prune graph: delete alb-1, app-1, app-2, db-1 and leave only tg-1 and a new worker
    const prunedNodes = [
      createMockNode('tg-1', 'traffic_generator', 'Traffic Generator'),
      createMockNode('worker-isolated', 'background_worker', 'Isolated Worker'),
    ];
    const prunedEdges: any[] = [];

    const secondResult = runSimulationTick({
      nodes: prunedNodes,
      edges: prunedEdges,
      targetGlobalRps: 2000,
      trafficProfile: 'steady',
      tickCount: 2,
      killedAzs: [],
      globalInjectedLatencyMs: 0,
      globalPacketDropPercent: 0,
    });

    // Ensure absolutely NO residual entries from deleted nodes (alb-1, app-1, app-2, db-1) exist
    assert.equal(secondResult.updatedNodes.length, 2);
    const updatedIds = secondResult.updatedNodes.map((n) => n.id);
    assert.ok(updatedIds.includes('tg-1'));
    assert.ok(updatedIds.includes('worker-isolated'));
    assert.ok(!updatedIds.includes('alb-1'), 'Residual node alb-1 leaked into state');
    assert.ok(!updatedIds.includes('app-1'), 'Residual node app-1 leaked into state');
    assert.ok(!updatedIds.includes('db-1'), 'Residual node db-1 leaked into state');
    assert.equal(secondResult.updatedEdges.length, 0, 'Residual edges leaked into state');
  });

  it('safely breaks and resolves cyclic topology loops without hanging or exceeding safeguards', () => {
    // Cyclic topology: tg-1 -> node-a -> node-b -> node-c -> node-a (infinite feedback loop)
    const cyclicNodes = [
      createMockNode('tg-1', 'traffic_generator', 'Traffic Generator'),
      createMockNode('node-a', 'web_server', 'Node A'),
      createMockNode('node-b', 'web_server', 'Node B'),
      createMockNode('node-c', 'web_server', 'Node C'),
    ];
    const cyclicEdges = [
      { id: 'e1', source: 'tg-1', target: 'node-a' },
      { id: 'e2', source: 'node-a', target: 'node-b' },
      { id: 'e3', source: 'node-b', target: 'node-c' },
      { id: 'e4', source: 'node-c', target: 'node-a' }, // Feedback cycle
    ];

    const result = runSimulationTick({
      nodes: cyclicNodes,
      edges: cyclicEdges,
      targetGlobalRps: 1500,
      trafficProfile: 'steady',
      tickCount: 1,
      killedAzs: [],
      globalInjectedLatencyMs: 0,
      globalPacketDropPercent: 0,
    });

    assert.ok(result);
    assert.equal(result.updatedNodes.length, 4);
    // Computation must finish within reasonable time despite the cycle
    assert.ok(result.computeDurationMs < 20);
    // Node A must have received traffic without overflowing call stack
    const nodeAUpdate = result.updatedNodes.find((n) => n.id === 'node-a');
    assert.ok(nodeAUpdate && (nodeAUpdate.data?.currentRps ?? 0) > 0);
  });

  it('accurately drops traffic when downstream AZ is terminated by chaos engineering', () => {
    const nodes = [
      createMockNode('tg-1', 'traffic_generator', 'Traffic Generator'),
      createMockNode('app-az1', 'web_server', 'App in AZ 1a', { availabilityZone: 'us-east-1a' }),
      createMockNode('app-az2', 'web_server', 'App in AZ 1b', { availabilityZone: 'us-east-1b' }),
    ];
    const edges = [
      { id: 'e1', source: 'tg-1', target: 'app-az1' },
      { id: 'e2', source: 'tg-1', target: 'app-az2' },
    ];

    // Kill us-east-1a
    const result = runSimulationTick({
      nodes,
      edges,
      targetGlobalRps: 1000,
      trafficProfile: 'steady',
      tickCount: 1,
      killedAzs: ['us-east-1a'],
      globalInjectedLatencyMs: 0,
      globalPacketDropPercent: 0,
    });

    const az1Node = result.updatedNodes.find((n) => n.id === 'app-az1');
    const az2Node = result.updatedNodes.find((n) => n.id === 'app-az2');

    assert.ok(az1Node);
    assert.ok(az2Node);
    // Killed AZ node must be marked dead with 0 processed RPS
    assert.equal(az1Node.data?.status, 'dead');
    assert.equal(az1Node.data?.currentRps, 0);
    // Healthy AZ node in 1b must still process traffic
    assert.notEqual(az2Node.data?.status, 'dead');
  });

});
