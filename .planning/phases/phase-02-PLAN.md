# Phase 2 Plan: Advanced Simulation Engine & Real-Time Edge Flow Telemetry

## Objective
Upgrade the System Design Playground with a mathematically accurate **Discrete-Event Simulation (DES)** engine based on **Queueing Theory** (Jackson Open Networks, M/M/c/K Kendall's notation) running inside a **Web Worker**, coupled with **dynamic edge flow particle animations** and an **Automated Bottleneck Detector**.

## Target Deliverables

### 1. Web Worker Discrete-Event Queueing Engine
- Offload discrete-event simulation ticks into a dedicated browser Web Worker (`src/workers/simulationWorker.ts`).
- Mathematically model each node using queueing theory:
  - **Arrival Rate ($\lambda$)**: Inflow rate from upstream nodes or Poisson process generator.
  - **Service Rate ($\mu$)**: Processing capacity per instance ($1 / \text{service\_time}$).
  - **Server Concurrency ($c$)**: Parallel instances count ($c \ge 1$).
  - **Buffer Capacity ($K$)**: Finite queue depth ($M/M/c/K$ model with finite queue drop probability).
  - **Utilization ($\rho = \frac{\lambda}{c \cdot \mu}$)**: Saturation metric.
  - **Jackson Open Network Solver**: Compute probabilistic routing matrices across multi-hop graphs with branching and cache hit/miss feedback loops.

### 2. Traffic Pattern Generators
- Implement selectable traffic profiles for the Traffic Generator:
  - **Steady State**: Constant RPS.
  - **Poisson Arrival**: Realistic stochastic inter-arrival times.
  - **Flash Sale Spike**: Sudden step increase (e.g. 5x load for 10 seconds).
  - **Diurnal Sine Wave**: Continuous day/night cyclic load.

### 3. Animated Edge Flow Particles & Dynamic Edge Types
- Custom React Flow Edge component (`src/components/edges/FlowEdge.tsx`) rendering animated SVG particle packets flowing along edge paths.
- Particle animation speed proportional to request throughput (RPS).
- Particle color turns amber/red when edge experiences packet drops or error rates.
- Interactive edge tooltip showing active RPS, latency ms, and percentage of split traffic.

### 4. Automated Bottleneck Detection & Architecture Diagnostics
- System-wide bottleneck analyzer identifying the critical path constraint node ($\max \rho$).
- Canvas visual highlight on the primary bottleneck node (pulsing red target indicator).
- Architecture Health Diagnostic Bar showing:
  - Maximum system throughput ceiling before degradation.
  - Primary bottleneck component name & reason (e.g. "PostgreSQL Primary DB is saturated at 104% capacity").
  - Remediation recommendation (e.g., "Add read replicas or scale Redis cache").

### 5. Telemetry & Analytics Enhancements
- Export simulation logs as CSV / JSON.
- Comparative latency breakdown (client-to-server RTT vs DB query time vs queue wait time).

## Verification Criteria
- Web Worker runs smoothly without blocking main UI thread at 100,000 simulated RPS.
- Visual edge particles flow along connections with dynamic speed and color coding.
- Bottleneck detector correctly identifies saturated components under load spikes.
- `npm run build` passes with zero TypeScript errors.
