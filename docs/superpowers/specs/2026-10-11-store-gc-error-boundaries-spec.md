# Specification: Store Modularization, Web Worker GC Optimization & React Error Boundaries

**Date:** October 11, 2026  
**Status:** Approved  
**Author:** Senior Lead Engineer & Automated DevOps Auditor  
**Scope:** Architectural Technical Debt Refactoring & Fault-Tolerance Hardening  

---

## 1. Objectives & Executive Intent

This specification establishes the technical blueprint for addressing three core architectural debt and performance areas in the **System Design Playground**:

1. **Store Modularization:** Decompose the monolithic 1,567-line [`usePlaygroundStore.ts`](file:///c:/Users/babbe/OneDrive/Desktop/study/SYSTEM%20DESIGN%20PLAYGROUND/src/store/usePlaygroundStore.ts) into four strictly typed, domain-focused slices (`canvasSlice`, `simulationSlice`, `projectSlice`, `uiModalSlice`) using Zustand's `StateCreator` pattern. Ensure 100% backward compatibility for all consumer components.
2. **Web Worker Garbage Collection Optimization:** Eliminate high-frequency object and collection allocation inside the 100ms discrete-event loop in [`src/workers/simulationWorker.ts`](file:///c:/Users/babbe/OneDrive/Desktop/study/SYSTEM%20DESIGN%20PLAYGROUND/src/workers/simulationWorker.ts) by reusing module-level Maps, Sets, and Arrays with in-place clearing, mitigating micro-stutters and GC pressure on lower-end hardware.
3. **Dual-Tier React Error Boundaries:** Implement fault-tolerant error boundaries wrapping both individual visual node cards and the React Flow canvas container, preventing single-component rendering exceptions or malformed node data from white-screening the entire studio.
4. **Rigorous Test Invariants:** Deliver non-trivial, adversarial test suites verifying cross-slice state synchronization, high-frequency stress loads, cyclic graph topologies, and error boundary recovery.

---

## 2. Technical Architecture & File Layout

```
src/
├── components/
│   ├── common/
│   │   ├── CanvasErrorBoundary.tsx    # Tier 2: Canvas viewport recovery boundary
│   │   └── NodeErrorBoundary.tsx      # Tier 1: Per-node fault isolation boundary
│   ├── nodes/
│   │   └── InfrastructureNode.tsx      # Wrapped in NodeErrorBoundary
│   └── Canvas.tsx                      # Wrapped in CanvasErrorBoundary
├── store/
│   ├── slices/
│   │   ├── canvasSlice.ts              # Graph state, nodes, edges, undo/redo, copy/paste
│   │   ├── simulationSlice.ts          # Worker messaging, tick loop, metrics, WASM
│   │   ├── projectSlice.ts             # Projects, routing, templates, URL hash, export
│   │   └── uiModalSlice.ts             # Chaos Center, Health Audit, Cost, Collab, Theme
│   ├── useAuthStore.ts                 # Existing Auth store (unchanged)
│   └── usePlaygroundStore.ts           # Root store composing all 4 slices
├── workers/
│   └── simulationWorker.ts             # Pre-allocated Map/Set/Array pooling
tests/
├── storeSlices.test.ts                 # Rigorous cross-slice & history invariant tests
└── workerMemoryStress.test.ts          # Worker memory reuse & stress load tests
```

---

## 3. Detailed Technical Requirements

### 3.1 Store Modularization Architecture

#### Slice Contract Definitions
- **`CanvasSlice`:** Manages `nodes`, `edges`, `selectedNodeId`, `selectedEdgeId`, `onNodesChange`, `onEdgesChange`, `onConnect`, `addNodeFromPalette`, `appendConnectedNode`, `deleteNode`, `deleteEdge`, `updateNodeData`, `updateEdgeData`, `history` undo/redo stacks, `copySelectedNode`, `pasteNode`, `duplicateSelectedNode`, `canvasViewMode`.
- **`SimulationSlice`:** Manages `isSimulating`, `isCascadeRunning`, `activeNodeIds`, `activeEdgeIds`, `simulationSpeed`, `targetGlobalRps`, `trafficProfile`, `tickCount`, `startSimulationCascade`, `stopSimulation`, `toggleSimulation`, `tickSimulation`, `setSimulationSpeed`, `setTargetGlobalRps`, `setTrafficProfile`, `bottleneckNodeId`, `bottleneckReason`, `telemetryHistory`, `engineMode`, `setEngineMode`, `benchmarkData`, `runEngineBenchmark`, Web Worker message wiring.
- **`ProjectSlice`:** Manages `appView`, `setAppView`, `activeProject`, `openProject`, `openProjectById`, `returnToDashboard`, `renameActiveProject`, `createNewProject`, `activeCloudArchitectureId`, `activePresetId`, `loadPreset`, `loadSavedArchitecture`, `loadFromUrlHash`, `saveArchitectureToHash`, `isViewOnly`, `setIsViewOnly`, `forkActiveProject`, `getShareableLink`.
- **`UiModalSlice`:** Manages `theme`, `setTheme`, `toggleTheme`, `isChaosCenterOpen`, `toggleChaosCenter`, `killedAzs`, `toggleKillAz`, `resetChaos`, `globalInjectedLatencyMs`, `globalPacketDropPercent`, `isCostModalOpen`, `toggleCostModal`, `isAuditModalOpen`, `toggleAuditModal`, `isExportModalOpen`, `toggleExportModal`, `isCollabModalOpen`, `toggleCollabModal`, `isLibraryModalOpen`, `toggleLibraryModal`, `isBenchmarkModalOpen`, `toggleBenchmarkModal`.

#### Backward Compatibility Constraint
The root `usePlaygroundStore` must export the identical unified `PlaygroundState` interface:
```typescript
export const usePlaygroundStore = create<PlaygroundState>()((...a) => ({
  ...createCanvasSlice(...a),
  ...createSimulationSlice(...a),
  ...createProjectSlice(...a),
  ...createUiModalSlice(...a),
}));
```
Any component consuming `usePlaygroundStore((state) => state.nodes)` or `usePlaygroundStore.getState().addNodeFromPalette` must work without modifying consumer imports.

---

### 3.2 Web Worker Object Allocation & GC Optimization

#### Current Heap Allocation Issues
In [`src/workers/simulationWorker.ts`](file:///c:/Users/babbe/OneDrive/Desktop/study/SYSTEM%20DESIGN%20PLAYGROUND/src/workers/simulationWorker.ts), each 100ms invocation allocates:
1. `incomingRpsMap = new Map()`
2. `edgeFlowMap = new Map()`
3. `inDegreeMap = new Map()`
4. `visitedNodes = new Set()`
5. `edgeInflows = new Map()`
6. `circuitBreakerUpdates = new Map()`
7. Array buffers (`queue = []`, `updatedNodes = []`, `updatedEdges = []`)
8. Filtering collections for traffic generators and dead nodes.

#### Optimization Architecture
1. Move all internal tracking structures to persistent worker module scope:
   ```typescript
   const incomingRpsMap = new Map<string, number>();
   const edgeFlowMap = new Map<string, { flowRps: number; latencyMs: number; errorRate: number }>();
   const inDegreeMap = new Map<string, number>();
   const visitedNodes = new Set<string>();
   const edgeInflows = new Map<string, number>();
   const circuitBreakerUpdates = new Map<string, CircuitBreakerState>();
   const traversalQueue: string[] = [];
   const updatedNodesBuffer: Array<{ id: string; data: Partial<InfrastructureNodeData> }> = [];
   const updatedEdgesBuffer: Array<{ id: string; data: Partial<EdgeStreamData> }> = [];
   ```
2. Reset structures via `.clear()` and `buffer.length = 0` at the start of each execution tick:
   ```typescript
   incomingRpsMap.clear();
   edgeFlowMap.clear();
   inDegreeMap.clear();
   visitedNodes.clear();
   edgeInflows.clear();
   circuitBreakerUpdates.clear();
   traversalQueue.length = 0;
   updatedNodesBuffer.length = 0;
   updatedEdgesBuffer.length = 0;
   ```
3. Avoid redundant intermediate array allocations in BFS DAG traversal loops.

---

### 3.3 Dual-Tier React Error Boundaries

#### Tier 1: Per-Node Fault Isolation (`NodeErrorBoundary`)
- Wraps [`InfrastructureNode.tsx`](file:///c:/Users/babbe/OneDrive/Desktop/study/SYSTEM%20DESIGN%20PLAYGROUND/src/components/nodes/InfrastructureNode.tsx).
- If rendering fails (e.g., malformed SVG parameters, invalid telemetry format, or exception during icon lookup):
  - Catches error in `componentDidCatch`.
  - Renders an isolated fallback node card with VisionOS styling, amber warning indicator, node label, and a "Retry" button.
  - Retains node handles so connection lines to other nodes do not crash the canvas.
  - Logs the error with node ID for debugging.

#### Tier 2: Canvas Viewport Recovery Boundary (`CanvasErrorBoundary`)
- Wraps the `<ReactFlow>` viewport in [`Canvas.tsx`](file:///c:/Users/babbe/OneDrive/Desktop/study/SYSTEM%20DESIGN%20PLAYGROUND/src/components/Canvas.tsx).
- If React Flow throws an unrecoverable layout exception:
  - Renders a spatial glassmorphic recovery panel over the canvas area.
  - Does NOT white-screen the header, sidebar, or inspector.
  - Offers three concrete actions:
    1. **"Reset Canvas Viewport"** (resets pan/zoom coordinates to default).
    2. **"Clear Selection"** (clears corrupt selected node/edge).
    3. **"Export Emergency Snapshot"** (dumps raw graph JSON to clipboard or download).

---

## 4. Testing & Verification Mandate

In accordance with strict DevOps auditor standards:
- **Zero Trivial Assertions:** No empty mock tests or superficial `assert.ok(true)` assertions.
- **Cross-Slice Synchronization Test:**
  Verify that canvas node operations (add, delete, update) correctly trigger simulation state updates (active node cascades, bottleneck recalculations).
- **Undo/Redo History Invariant Test:**
  Execute a 10-step sequence of additions, mutations, and deletions; verify that rolling back 10 steps reproduces the exact initial state byte-for-byte, and redoing 10 steps restores the final state.
- **Worker Memory & Stress Load Test:**
  Execute 500 consecutive simulation ticks with a complex cyclic 50-node topology. Verify:
  - Zero unhandled exceptions.
  - Cycle detection prevents infinite loops.
  - Memory structures clear properly without state leakage across ticks.
  - Total latency and drop calculations remain mathematically bounded.
- **Error Boundary Fallback Test:**
  Render a node with deliberately poisoned props (circular JSON, undefined data, throwing render function) and confirm that the error boundary intercepts the error and renders fallback UI.
