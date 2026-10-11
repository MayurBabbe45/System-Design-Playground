import type { TrafficProfile } from '../types/playground';

/**
 * Computes dynamic simulated arrival rate based on chosen traffic profile
 */
export function calculateDynamicTrafficRate(
  baseRps: number,
  profile: TrafficProfile,
  tick: number
): number {
  switch (profile) {
    case 'poisson': {
      // For large lambda, Poisson is well-approximated by Normal(lambda, sqrt(lambda))
      const stdDev = Math.sqrt(baseRps);
      // Box-Muller transform for standard normal random variable
      const u1 = Math.max(0.0001, Math.random());
      const u2 = Math.random();
      const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
      return Math.max(10, Math.round(baseRps + z0 * stdDev));
    }

    case 'spike': {
      // Flash sale spike: every 20 ticks, spike for 5 ticks up to 3.5x base load
      const cycle = tick % 25;
      if (cycle >= 15 && cycle <= 20) {
        const spikeMultiplier = 2.5 + Math.sin((cycle - 15) * Math.PI / 5) * 1.5;
        return Math.round(baseRps * spikeMultiplier);
      }
      return Math.round(baseRps * (0.95 + Math.random() * 0.1));
    }

    case 'diurnal': {
      // Diurnal 24h sine wave cycle (e.g. 60 tick full day period)
      const dayNightFactor = 0.6 + 0.4 * Math.sin((tick * 2 * Math.PI) / 60);
      const jitter = (Math.random() - 0.5) * 0.05;
      return Math.max(10, Math.round(baseRps * (dayNightFactor + jitter)));
    }

    case 'steady':
    default:
      // Slight +/- 2% natural network jitter
      return Math.round(baseRps * (0.98 + Math.random() * 0.04));
  }
}

export interface MMcKResult {
  rho: number; // Utilization ratio
  processedRps: number;
  droppedRps: number;
  queueDepth: number;
  latencyMs: number;
  dropProbability: number;
}

/**
 * Solves M/M/c/K finite queue model
 * @param arrivalRate lambda (RPS)
 * @param serviceRatePerInstance mu (requests per instance per sec)
 * @param c Number of parallel server instances
 * @param K Max capacity of system (instances + queue buffer)
 * @param baseLatencyMs Hardware/processing baseline execution latency
 */
export function solveKendallMMcK(
  arrivalRate: number,
  serviceRatePerInstance: number,
  c: number,
  K: number,
  baseLatencyMs: number
): MMcKResult {
  if (arrivalRate <= 0) {
    return {
      rho: 0,
      processedRps: 0,
      droppedRps: 0,
      queueDepth: 0,
      latencyMs: baseLatencyMs,
      dropProbability: 0,
    };
  }

  const effectiveC = Math.max(1, c);
  const totalCapacity = effectiveC * Math.max(1, serviceRatePerInstance);
  const r = arrivalRate / Math.max(1, serviceRatePerInstance); // Offered load r = lambda / mu
  const rho = arrivalRate / totalCapacity; // System utilization rho = lambda / (c * mu)

  // Finite buffer drop probability approximation
  let dropProbability = 0;
  if (rho > 1.0) {
    // Saturated system: probability of buffer overflow scales asymptotically
    const excess = arrivalRate - totalCapacity;
    dropProbability = Math.min(0.95, excess / arrivalRate);
  } else if (rho > 0.85) {
    // High queueing pressure: slight tail drops based on buffer depth K
    const bufferFactor = Math.max(10, K);
    dropProbability = Math.min(0.25, Math.pow(rho, bufferFactor * 0.1) * 0.15);
  }

  const droppedRps = Math.round(arrivalRate * dropProbability);
  const processedRps = Math.min(totalCapacity, Math.round(arrivalRate - droppedRps));

  // Dynamic queue depth calculation
  let queueDepth = 0;
  if (rho >= 1.0) {
    queueDepth = Math.round(K * Math.min(1.0, 0.5 + (rho - 1.0) * 0.5));
  } else {
    // M/M/c expected queue length approximation: Lq ~ (rho^(sqrt(2*(c+1)))) / (1 - rho)
    const theoreticalLq = (Math.pow(rho, Math.sqrt(2 * (effectiveC + 1)))) / Math.max(0.05, 1 - rho);
    queueDepth = Math.min(K, Math.round(theoreticalLq));
  }

  // Latency with queue wait time: W = Service_Time + Wq
  // Wq = Queue_Depth / Total_Capacity
  const queueWaitSeconds = queueDepth / Math.max(1, totalCapacity);
  const queueWaitMs = Math.round(queueWaitSeconds * 1000);
  const totalLatencyMs = Math.max(baseLatencyMs, baseLatencyMs + queueWaitMs);

  return {
    rho: Number(rho.toFixed(3)),
    processedRps,
    droppedRps,
    queueDepth,
    latencyMs: totalLatencyMs,
    dropProbability: Number(dropProbability.toFixed(3)),
  };
}

export interface PullQueueDrainResult {
  drainedRps: number;
  remainingBacklog: number;
  droppedOverflowRps: number;
  isOverflown: boolean;
}

/**
 * Solves asynchronous queue buffer accumulation and pull-based consumer draining.
 * @param currentBacklog Existing pending backlog items in queue buffer
 * @param inflowRps Incoming messages produced this tick
 * @param workerCapacityRps Aggregate draining throughput of connected workers (capacityRps * instanceCount)
 * @param maxBufferK Maximum finite buffer depth K (overflow drops to DLQ)
 */
export function solvePullQueueDrain(
  currentBacklog: number,
  inflowRps: number,
  workerCapacityRps: number,
  maxBufferK: number = 10000
): PullQueueDrainResult {
  const totalOffered = Math.max(0, currentBacklog) + Math.max(0, inflowRps);
  const effectiveWorkerCap = Math.max(0, workerCapacityRps);
  
  // Drained up to worker capacity
  const drainedRps = Math.min(totalOffered, effectiveWorkerCap);
  const tentativeBacklog = totalOffered - drainedRps;

  let droppedOverflowRps = 0;
  let remainingBacklog = tentativeBacklog;

  if (tentativeBacklog > maxBufferK) {
    droppedOverflowRps = tentativeBacklog - maxBufferK;
    remainingBacklog = maxBufferK;
  }

  return {
    drainedRps,
    remainingBacklog,
    droppedOverflowRps,
    isOverflown: droppedOverflowRps > 0,
  };
}

export interface ServerlessLatencyResult {
  effectiveLatencyMs: number;
  isColdBurst: boolean;
  coldRatio: number;
}

/**
 * Computes Serverless Lambda execution latency factoring warm concurrency capacity vs cold start burst penalties.
 * @param baseLatencyMs Warm baseline execution latency
 * @param arrivalRate Current invocation arrival rate (RPS)
 * @param warmCapacity Provisioned warm container capacity (warmConcurrency * capacityPerInstance)
 * @param coldStartLatencyMs Cold start latency penalty for un-provisioned containers (e.g. 250ms)
 * @param queueWaitMs Queue wait latency from M/M/c/K solver
 */
export function solveServerlessLatency(
  baseLatencyMs: number,
  arrivalRate: number,
  warmCapacity: number,
  coldStartLatencyMs: number = 250,
  queueWaitMs: number = 0
): ServerlessLatencyResult {
  if (arrivalRate <= 0) {
    return {
      effectiveLatencyMs: baseLatencyMs,
      isColdBurst: false,
      coldRatio: 0,
    };
  }

  const effectiveWarmCap = Math.max(1, warmCapacity);
  if (arrivalRate <= effectiveWarmCap) {
    return {
      effectiveLatencyMs: Math.round(baseLatencyMs + queueWaitMs),
      isColdBurst: false,
      coldRatio: 0,
    };
  }

  const excess = arrivalRate - effectiveWarmCap;
  const coldRatio = Math.min(1.0, excess / arrivalRate);
  const coldPenalty = Math.round(coldRatio * coldStartLatencyMs);
  const effectiveLatencyMs = Math.round(baseLatencyMs + coldPenalty + queueWaitMs);

  return {
    effectiveLatencyMs,
    isColdBurst: true,
    coldRatio: Number(coldRatio.toFixed(3)),
  };
}

