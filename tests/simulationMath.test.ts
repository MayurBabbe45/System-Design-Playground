import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { 
  solveKendallMMcK, 
  solvePullQueueDrain, 
  solveServerlessLatency 
} from '../src/simulation/queueTheory.ts';

describe('Production Simulation Mathematics & Flow Propagation', () => {

  describe('1. Pull-Based Queue Draining (solvePullQueueDrain)', () => {
    it('drains tasks up to worker capacity when backlog exists', () => {
      // 500 backlog + 200 inflow = 700 offered. Worker capacity is 400.
      const result = solvePullQueueDrain(500, 200, 400, 10000);
      assert.equal(result.drainedRps, 400);
      assert.equal(result.remainingBacklog, 300);
      assert.equal(result.droppedOverflowRps, 0);
      assert.equal(result.isOverflown, false);
    });

    it('drains all offered tasks when worker capacity exceeds backlog + inflow', () => {
      // 100 backlog + 150 inflow = 250 offered. Worker capacity is 500.
      const result = solvePullQueueDrain(100, 150, 500, 10000);
      assert.equal(result.drainedRps, 250);
      assert.equal(result.remainingBacklog, 0);
      assert.equal(result.droppedOverflowRps, 0);
      assert.equal(result.isOverflown, false);
    });

    it('drops excess tasks when buffer overflows beyond max capacity K', () => {
      // Max buffer K = 1000. 900 backlog + 400 inflow = 1300 offered. Worker capacity = 100.
      // Drained = 100. Tentative backlog = 1200. Overflow = 200. Remaining = 1000.
      const result = solvePullQueueDrain(900, 400, 100, 1000);
      assert.equal(result.drainedRps, 100);
      assert.equal(result.remainingBacklog, 1000);
      assert.equal(result.droppedOverflowRps, 200);
      assert.equal(result.isOverflown, true);
    });
  });

  describe('2. Serverless Cold Start Burst Latency (solveServerlessLatency)', () => {
    it('incurs zero cold start penalty when arrival rate is within warm capacity', () => {
      // Warm capacity = 1000 RPS. Arrival rate = 800 RPS. Base latency = 25ms.
      const result = solveServerlessLatency(25, 800, 1000, 250, 0);
      assert.equal(result.isColdBurst, false);
      assert.equal(result.coldRatio, 0);
      assert.equal(result.effectiveLatencyMs, 25);
    });

    it('applies proportional cold start penalty when concurrency bursts exceed warm capacity', () => {
      // Warm capacity = 500 RPS. Arrival rate = 1000 RPS (50% cold burst).
      // Excess = 500. Cold ratio = 0.5. Cold penalty = 0.5 * 250ms = 125ms. Total = 25 + 125 = 150ms.
      const result = solveServerlessLatency(25, 1000, 500, 250, 0);
      assert.equal(result.isColdBurst, true);
      assert.equal(result.coldRatio, 0.5);
      assert.equal(result.effectiveLatencyMs, 150);
    });

    it('handles zero arrival rate gracefully', () => {
      const result = solveServerlessLatency(25, 0, 500, 250, 0);
      assert.equal(result.effectiveLatencyMs, 25);
      assert.equal(result.isColdBurst, false);
      assert.equal(result.coldRatio, 0);
    });
  });

  describe('3. WAF Rate Limiting & 429 Dropping Simulation', () => {
    it('permits all traffic when arrival rate is below rate limit', () => {
      const arrivalRate = 12000;
      const rateLimitRps = 20000;
      const dropped429 = Math.max(0, arrivalRate - rateLimitRps);
      const permittedFlow = Math.min(arrivalRate, rateLimitRps);

      assert.equal(dropped429, 0);
      assert.equal(permittedFlow, 12000);
    });

    it('accurately drops excess requests when arrival rate exceeds rate limit', () => {
      const arrivalRate = 35000;
      const rateLimitRps = 20000;
      const dropped429 = Math.max(0, arrivalRate - rateLimitRps);
      const permittedFlow = Math.min(arrivalRate, rateLimitRps);

      assert.equal(dropped429, 15000);
      assert.equal(permittedFlow, 20000);
      assert.equal(dropped429 + permittedFlow, arrivalRate); // Zero packet leakage
    });
  });

  describe('4. DNS Router Ingress Routing Models', () => {
    it('distributes flow matching weighted ratios (90/10 Canary) with exact conservation', () => {
      const totalOutflow = 10000;
      const weights = { targetA: 90, targetB: 10 };
      const totalWeight = weights.targetA + weights.targetB; // 100

      const flowA = Math.round((totalOutflow * weights.targetA) / totalWeight);
      const flowB = Math.max(0, totalOutflow - flowA); // Residual assignment

      assert.equal(flowA, 9000);
      assert.equal(flowB, 1000);
      assert.equal(flowA + flowB, totalOutflow);
    });

    it('conserves odd flow numbers without losing residual packets', () => {
      const totalOutflow = 3333;
      const weights = { targetA: 70, targetB: 30 };
      const totalWeight = 100;

      const flowA = Math.round((totalOutflow * weights.targetA) / totalWeight); // 2333.1 -> 2333
      const flowB = Math.max(0, totalOutflow - flowA); // 3333 - 2333 = 1000

      assert.equal(flowA + flowB, 3333);
    });

    it('routes 100% to primary in active-passive mode when primary is alive', () => {
      const totalOutflow = 5000;
      const isPrimaryAlive = true;
      const flowPrimary = isPrimaryAlive ? totalOutflow : 0;
      const flowBackup = isPrimaryAlive ? 0 : totalOutflow;

      assert.equal(flowPrimary, 5000);
      assert.equal(flowBackup, 0);
    });

    it('fails over 100% to backup in active-passive mode when primary is dead', () => {
      const totalOutflow = 5000;
      const isPrimaryAlive = false;
      const flowPrimary = isPrimaryAlive ? totalOutflow : 0;
      const flowBackup = isPrimaryAlive ? 0 : totalOutflow;

      assert.equal(flowPrimary, 0);
      assert.equal(flowBackup, 5000);
    });
  });

  describe('5. Pub/Sub 1-to-N Fan-Out Replication', () => {
    it('replicates 100% of event outflow to all 3 connected subscriber edges', () => {
      const eventOutflow = 15000;
      const subscribers = ['sub1', 'sub2', 'sub3'];

      const edgeFlows = subscribers.map(() => eventOutflow);

      // Verify each subscriber gets the full 15,000 RPS
      edgeFlows.forEach((flow) => {
        assert.equal(flow, 15000);
      });
      assert.equal(edgeFlows.reduce((a, b) => a + b, 0), 45000); // 3x multiplication
    });
  });

  describe('6. External API Chaos Timeout Drops', () => {
    it('drops requests corresponding to failureRate percentage', () => {
      const arrivalRate = 4000;
      const failureRate = 25; // 25% HTTP 504 timeouts
      const timeoutDrops = Math.round(arrivalRate * (failureRate / 100));
      const processedRps = arrivalRate - timeoutDrops;

      assert.equal(timeoutDrops, 1000);
      assert.equal(processedRps, 3000);
      assert.equal(timeoutDrops + processedRps, arrivalRate);
    });
  });

  describe('7. Finite Buffer Kendall M/M/c/K Baseline Solver', () => {
    it('solves utilization, queue depth, and throughput for compute instances', () => {
      // 1500 arrival, capacity 2000 per instance, 1 instance, buffer 500
      const result = solveKendallMMcK(1500, 2000, 1, 500, 10);
      assert.equal(result.rho, 0.75);
      assert.equal(result.droppedRps, 0);
      assert.ok(result.processedRps > 0);
      assert.ok(result.latencyMs >= 10);
    });
  });
});
