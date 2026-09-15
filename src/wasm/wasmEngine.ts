import { WASM_BASE64 } from './build/wasmBytecode';
import { solveKendallMMcK as solveKendallMMcKJs } from '../simulation/queueTheory';

export interface WasmSimulationResult {
  rho: number;
  processedRps: number;
  droppedRps: number;
  queueDepth: number;
  latencyMs: number;
  dropProbability: number;
}

interface WasmExports {
  solveKendallMMcK: (
    arrivalRate: number,
    serviceRatePerInstance: number,
    c: number,
    K: number,
    baseLatencyMs: number
  ) => void;
  getResultRho: () => number;
  getResultProcessedRps: () => number;
  getResultDroppedRps: () => number;
  getResultQueueDepth: () => number;
  getResultLatencyMs: () => number;
  getResultDropProbability: () => number;
  runWasmBenchmark: (iterations: number) => number;
}

let wasmInstance: WasmExports | null = null;
let isInitializing = false;
let initPromise: Promise<boolean> | null = null;

/**
 * Initializes the WebAssembly simulation engine from embedded bytecode
 */
export async function initWasmEngine(): Promise<boolean> {
  if (wasmInstance) return true;
  if (initPromise) return initPromise;

  isInitializing = true;
  initPromise = (async () => {
    try {
      // Decode base64 bytecode to binary Uint8Array
      const binaryString = atob(WASM_BASE64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const imports = {
        env: {
          abort(msg: number, file: number, line: number, col: number) {
            console.error(`WASM abort at ${file}:${line}:${col} (msg=${msg})`);
          },
        },
      };

      const result = await WebAssembly.instantiate(bytes, imports);
      wasmInstance = result.instance.exports as unknown as WasmExports;
      return true;
    } catch (err) {
      console.warn('Failed to instantiate WebAssembly engine, falling back to JS:', err);
      wasmInstance = null;
      return false;
    } finally {
      isInitializing = false;
    }
  })();

  return initPromise;
}

/**
 * Returns whether WASM engine is loaded and operational
 */
export function isWasmReady(): boolean {
  return wasmInstance !== null;
}

/**
 * Solves Kendall M/M/c/K queueing model using WebAssembly
 * Falls back to pure JS solver if WASM is uninitialized
 */
export function solveKendallMMcKWasm(
  arrivalRate: number,
  serviceRatePerInstance: number,
  c: number,
  K: number,
  baseLatencyMs: number
): WasmSimulationResult {
  if (!wasmInstance) {
    // Graceful fallback to pure TypeScript/JavaScript implementation
    return solveKendallMMcKJs(arrivalRate, serviceRatePerInstance, c, K, baseLatencyMs);
  }

  wasmInstance.solveKendallMMcK(arrivalRate, serviceRatePerInstance, c, K, baseLatencyMs);

  const rawRho = wasmInstance.getResultRho();
  const rawDropProb = wasmInstance.getResultDropProbability();

  return {
    rho: Number(rawRho.toFixed(3)),
    processedRps: wasmInstance.getResultProcessedRps(),
    droppedRps: wasmInstance.getResultDroppedRps(),
    queueDepth: wasmInstance.getResultQueueDepth(),
    latencyMs: wasmInstance.getResultLatencyMs(),
    dropProbability: Number(rawDropProb.toFixed(3)),
  };
}

export interface BenchmarkMetrics {
  iterations: number;
  durationMs: number;
  opsPerSec: number;
}

/**
 * Benchmarks WebAssembly engine over N iterations
 */
export function benchmarkWasm(iterations: number = 50000): BenchmarkMetrics {
  if (!wasmInstance) {
    return { iterations, durationMs: 0, opsPerSec: 0 };
  }

  const start = performance.now();
  wasmInstance.runWasmBenchmark(iterations);
  const durationMs = Math.max(0.001, performance.now() - start);
  const opsPerSec = Math.round((iterations / durationMs) * 1000);

  return { iterations, durationMs, opsPerSec };
}

/**
 * Benchmarks pure JavaScript engine over N iterations for comparison
 */
export function benchmarkJs(iterations: number = 50000): BenchmarkMetrics {
  const start = performance.now();
  let accumulator = 0;

  for (let i = 0; i < iterations; i++) {
    const arrival = 500 + (i % 2000);
    const capacity = 400;
    const instances = 2 + (i % 4);
    const maxQueue = 500;
    const res = solveKendallMMcKJs(arrival, capacity, instances, maxQueue, 15);
    accumulator += res.rho + res.latencyMs;
  }

  // Prevent dead-code elimination
  if (accumulator === 123456789) console.log(accumulator);

  const durationMs = Math.max(0.001, performance.now() - start);
  const opsPerSec = Math.round((iterations / durationMs) * 1000);

  return { iterations, durationMs, opsPerSec };
}
