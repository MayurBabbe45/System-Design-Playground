# Phase 5 Plan: High-Performance WebAssembly (WASM) Discrete-Event Simulation Engine

## Objective
Accelerate the simulation engine by compiling the core Kendall $M/M/c/K$ queueing and Jackson Network topological flow calculations into a high-performance **WebAssembly (WASM)** binary loaded inside the background Web Worker (`simulationWorker.ts`). Implement shared typed memory buffers (zero-copy Float64/Int32 arrays) and add an in-app **WASM vs JS Benchmark & Performance Monitor** showing raw microsecond execution times.

## Background & Architecture Strategy
1. **Toolchain Independence**: Because native `rustc`/`cargo` might not be pre-installed on every developer's Windows/macOS/Linux workstation, the WASM compilation pipeline must run portably via standard `npm` tooling.
2. **AssemblyScript to Native WASM**:
   - We utilize `assemblyscript` (`asc`) which compiles typed algorithms directly to standard `.wasm` binaries.
   - We also provide equivalent Rust reference implementation files (`crates/sim_engine/src/lib.rs`) for systems engineers who want to build with `wasm-pack`.
3. **Zero-Copy Memory Layout**:
   - Pass graph node metrics and connection adjacency lists as contiguous `Float64Array` / `Int32Array` buffers directly into WASM linear memory (`WebAssembly.Memory`).
   - WASM iterates over all nodes and edges in a single tight C/WASM-speed loop, calculating $\rho$, Erlang C, queue buildup, and error drops.
4. **Resilient Dual-Mode Execution**:
   - `simulationWorker.ts` attempts to load and instantiate the compiled `sim_engine.wasm`.
   - If WASM is active, an indicator badge in the UI shows **"⚡ WASM Engine (Active)"** with live sub-millisecond execution times.
   - If WASM instantiation fails in any edge runtime, it seamlessly falls back to the TypeScript implementation with zero interruption.

## Target Deliverables

### 1. WebAssembly Discrete-Event Engine (`src/wasm/`)
- **AssemblyScript WASM Source (`src/wasm/assembly/index.ts`)**:
  - `computeNodeMetrics(lambda: f64, c: f64, mu: f64, maxQueue: f64): f64`: High-precision Erlang C and $M/M/c/K$ solver compiled to WebAssembly.
  - `solveJacksonNetwork(nodeCount: i32, adjacencyFlat: Int32Array, metricsFlat: Float64Array): void`: Batch topological multi-hop solver in linear memory.
- **Compilation Script**:
  - Add `npm run build:wasm` via `assemblyscript` (`asc`) generating `src/wasm/build/sim_engine.wasm` (optimized with `-O3 --converge`).

### 2. Web Worker WASM Integration (`src/workers/simulationWorker.ts`)
- Async WASM instantiation using `WebAssembly.instantiateStreaming` or `WebAssembly.instantiate` with Vite's `?url` / `?wasm` asset handling.
- Fast-path execution: Pass simulation payloads into WASM linear memory and extract calculated RPS, latency, and queue depths in <0.2ms.
- Telemetry timing: Measure compute duration in microseconds (`performance.now()`) and post performance stats back to the main thread.

### 3. WASM Engine Controls & Benchmark Inspector Modal
- **Engine Toggle in Header**:
  - Pill displaying `⚡ WASM Engine` (with green status light) and microsecond execution time (e.g. `0.18ms`).
  - Toggle switch between **WASM Mode** and **Pure JavaScript Mode** to demonstrate the real-time performance difference on large topologies.
- **Benchmark & Performance Comparison**:
  - Side-by-side execution latency comparison (WASM vs JS execution time over 100 iterations).
  - Memory footprint and throughput benchmarks.

## Verification Criteria
1. `npm run build:wasm` builds `sim_engine.wasm` with zero compiler warnings.
2. Web Worker loads and executes `sim_engine.wasm` without errors.
3. Queueing metrics ($\rho$, p95 latency, queue depth, error drops) match between the WASM engine and baseline JavaScript engine within 0.01% floating-point tolerance.
4. Switching between WASM and JS mode in the UI works instantaneously and updates the benchmark telemetry display.
5. `npm run build` completes with exit code 0.
