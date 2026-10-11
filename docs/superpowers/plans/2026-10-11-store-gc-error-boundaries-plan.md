# Store Modularization, Worker GC Optimization & Error Boundaries Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the monolithic Zustand store into typed domain slices, pool Web Worker data structures to eliminate 100ms GC heap allocations, and introduce dual-tier React Error Boundaries with strict, non-trivial test verification.

**Architecture:** 
1. Zustand store decomposition via `StateCreator` into `canvasSlice`, `simulationSlice`, `projectSlice`, and `uiModalSlice`, unified in `usePlaygroundStore` for 100% backward compatibility.
2. Web Worker simulation data structure pooling using module-level persistent Maps, Sets, and Arrays with in-place `.clear()` and truncation to eliminate tick heap churn.
3. Dual-tier fault isolation using `NodeErrorBoundary` for individual visual node cards and `CanvasErrorBoundary` for the React Flow canvas container.

**Tech Stack:** React 18, TypeScript 5, Zustand 5, React Flow 12 (@xyflow/react), Web Worker API, WebAssembly (AssemblyScript).

**Spec:** [`docs/superpowers/specs/2026-10-11-store-gc-error-boundaries-spec.md`](file:///c:/Users/babbe/OneDrive/Desktop/study/SYSTEM%20DESIGN%20PLAYGROUND/docs/superpowers/specs/2026-10-11-store-gc-error-boundaries-spec.md)

---

## Global Constraints

- **Strict backward compatibility:** Every hook call to `usePlaygroundStore((state) => state...)` must remain unchanged across the codebase.
- **Zero trivial test cases:** All tests must verify real mathematical invariants, cyclic topologies, cross-slice state flow, and multi-step undo/redo rollbacks.
- **Zero compiler warnings:** TypeScript strict mode must pass with 0 errors via `npm run lint` (`tsc --noEmit`).
- **No forbidden terms:** Never use forbidden reviewer terms ('good job', 'nice', 'perfect').
- **Markdown links:** Format all file references with the `file://` scheme.

## Review Focus

1. **Circular dependency loops in DAG traversal:** Ensure BFS queueing in `simulationWorker.ts` does not enter an infinite loop when graphs contain intentional or accidental cycles.
2. **State leakage across worker ticks:** Verify that reused Maps and Sets in `simulationWorker.ts` do not retain residual values from previous ticks when nodes are removed.
3. **Undo/Redo history stack corruption:** Confirm that mutating node parameters through slice actions preserves immutable snapshots and can be cleanly rolled back.
4. **Isolated Node crash survival:** Verify that when one node throws during render, all sibling nodes and the React Flow canvas remain fully interactive.
5. **Cross-slice state synchronization:** Ensure that operations in `canvasSlice` (e.g. deleting a node) correctly notify `simulationSlice` (clearing bottleneck and cascade state).

---

## Tasks

### Task 1: Web Worker Object Allocation Pooling & GC Elimination

**Files:**
- Modify: [`src/workers/simulationWorker.ts`](file:///c:/Users/babbe/OneDrive/Desktop/study/SYSTEM%20DESIGN%20PLAYGROUND/src/workers/simulationWorker.ts)
- Test: [`tests/workerMemoryStress.test.ts`](file:///c:/Users/babbe/OneDrive/Desktop/study/SYSTEM%20DESIGN%20PLAYGROUND/tests/workerMemoryStress.test.ts)

- [ ] **Step 1.1: Write non-trivial stress & memory invariance tests**
  Create `tests/workerMemoryStress.test.ts` to test:
  1. 500 consecutive simulation ticks executing on a 50-node cyclic network without stack overflow.
  2. Dynamically adding and removing nodes across ticks to verify that deleted nodes leave zero residual entries in reused Maps.
  3. Total throughput conservation: verify that ingress traffic equals processed + dropped traffic across all 500 iterations.
  4. Circular loop termination within the iteration safeguard budget.

- [ ] **Step 1.2: Run test to observe baseline behavior**
  Execute `node --test tests/workerMemoryStress.test.ts`.

- [ ] **Step 1.3: Implement structure pooling in simulationWorker.ts**
  Move `incomingRpsMap`, `edgeFlowMap`, `inDegreeMap`, `visitedNodes`, `edgeInflows`, `circuitBreakerUpdates`, `traversalQueue`, `updatedNodesBuffer`, and `updatedEdgesBuffer` to module scope.
  Add explicit in-place `.clear()` and `length = 0` resets at the beginning of `self.onmessage`.
  Eliminate temporary intermediate array allocations in BFS iteration loops.

- [ ] **Step 1.4: Run memory and stress tests**
  Execute `node --test tests/workerMemoryStress.test.ts` and verify 100% pass rate.

- [ ] **Step 1.5: Commit changes**
  Run `git add src/workers/simulationWorker.ts tests/workerMemoryStress.test.ts; git commit -m "perf(worker): eliminate tick object allocation with persistent module structure pooling"`

---

### Task 2: Dual-Tier React Error Boundaries

**Files:**
- Create: [`src/components/common/NodeErrorBoundary.tsx`](file:///c:/Users/babbe/OneDrive/Desktop/study/SYSTEM%20DESIGN%20PLAYGROUND/src/components/common/NodeErrorBoundary.tsx)
- Create: [`src/components/common/CanvasErrorBoundary.tsx`](file:///c:/Users/babbe/OneDrive/Desktop/study/SYSTEM%20DESIGN%20PLAYGROUND/src/components/common/CanvasErrorBoundary.tsx)
- Modify: [`src/components/nodes/InfrastructureNode.tsx`](file:///c:/Users/babbe/OneDrive/Desktop/study/SYSTEM%20DESIGN%20PLAYGROUND/src/components/nodes/InfrastructureNode.tsx)
- Modify: [`src/components/Canvas.tsx`](file:///c:/Users/babbe/OneDrive/Desktop/study/SYSTEM%20DESIGN%20PLAYGROUND/src/components/Canvas.tsx)
- Test: [`tests/errorBoundary.test.ts`](file:///c:/Users/babbe/OneDrive/Desktop/study/SYSTEM%20DESIGN%20PLAYGROUND/tests/errorBoundary.test.ts)

- [ ] **Step 2.1: Implement NodeErrorBoundary component**
  Create `NodeErrorBoundary.tsx` catching rendering exceptions within individual nodes.
  Render VisionOS fallback card with warning badge, node label, and a "Retry Component" button that resets error state.
  Ensure connection handles (`top`, `bottom`, `left`, `right`) remain rendered so edges connected to other nodes do not break canvas topology.

- [ ] **Step 2.2: Implement CanvasErrorBoundary component**
  Create `CanvasErrorBoundary.tsx` catching React Flow layout/viewport exceptions.
  Render a glassmorphic emergency recovery banner offering "Reset Canvas View", "Clear Selection", and "Export Diagnostics".

- [ ] **Step 2.3: Wrap InfrastructureNode and Canvas in boundaries**
  Wrap internal node card JSX in `NodeErrorBoundary` inside `InfrastructureNode.tsx`.
  Wrap `<ReactFlow>` viewport in `CanvasErrorBoundary` inside `Canvas.tsx`.

- [ ] **Step 2.4: Write and execute error boundary unit tests**
  Create `tests/errorBoundary.test.ts` verifying error interception and state recovery without crashing sibling nodes.
  Execute `node --test tests/errorBoundary.test.ts`.

- [ ] **Step 2.5: Commit changes**
  Run `git add src/components/common/ src/components/nodes/InfrastructureNode.tsx src/components/Canvas.tsx tests/errorBoundary.test.ts; git commit -m "feat(ui): implement dual-tier node and canvas error boundaries"`

---

### Task 3: Store Modularization via Zustand StateCreator

**Files:**
- Create: [`src/store/slices/canvasSlice.ts`](file:///c:/Users/babbe/OneDrive/Desktop/study/SYSTEM%20DESIGN%20PLAYGROUND/src/store/slices/canvasSlice.ts)
- Create: [`src/store/slices/simulationSlice.ts`](file:///c:/Users/babbe/OneDrive/Desktop/study/SYSTEM%20DESIGN%20PLAYGROUND/src/store/slices/simulationSlice.ts)
- Create: [`src/store/slices/projectSlice.ts`](file:///c:/Users/babbe/OneDrive/Desktop/study/SYSTEM%20DESIGN%20PLAYGROUND/src/store/slices/projectSlice.ts)
- Create: [`src/store/slices/uiModalSlice.ts`](file:///c:/Users/babbe/OneDrive/Desktop/study/SYSTEM%20DESIGN%20PLAYGROUND/src/store/slices/uiModalSlice.ts)
- Modify: [`src/store/usePlaygroundStore.ts`](file:///c:/Users/babbe/OneDrive/Desktop/study/SYSTEM%20DESIGN%20PLAYGROUND/src/store/usePlaygroundStore.ts)
- Test: [`tests/storeSlices.test.ts`](file:///c:/Users/babbe/OneDrive/Desktop/study/SYSTEM%20DESIGN%20PLAYGROUND/tests/storeSlices.test.ts)

- [ ] **Step 3.1: Write rigorous cross-slice & history tests**
  Create `tests/storeSlices.test.ts` testing:
  1. Multi-step undo/redo invariant: 10 sequential graph additions/mutations rolled back step-by-step to initial state.
  2. Cross-slice coupling: `deleteNode` in `canvasSlice` cleans up active simulation node IDs in `simulationSlice`.
  3. Preset loading in `projectSlice` correctly populates `nodes` in `canvasSlice` and resets metrics in `simulationSlice`.
  4. Extreme graph mutations (100 rapid nodes added and connected in sequence).

- [ ] **Step 3.2: Implement canvasSlice.ts**
  Extract nodes, edges, selection, history stack, copy/paste, node duplication, and drag-and-drop actions.

- [ ] **Step 3.3: Implement simulationSlice.ts**
  Extract Web Worker messaging, simulation cascade, speed, target RPS, traffic profiles, telemetry history, and WASM benchmark actions.

- [ ] **Step 3.4: Implement projectSlice.ts**
  Extract app view routing, cloud project CRUD, templates shelf, URL hash encode/decode, and view-only sharing.

- [ ] **Step 3.5: Implement uiModalSlice.ts**
  Extract modal visibility flags (Chaos, Health Audit, Cost, Collab, Library, Benchmark) and chaos injection parameters.

- [ ] **Step 3.6: Compose slices in usePlaygroundStore.ts**
  Refactor `usePlaygroundStore.ts` into a clean composition file exporting the unified `usePlaygroundStore` hook.

- [ ] **Step 3.7: Run store slice tests**
  Execute `node --test tests/storeSlices.test.ts`.

- [ ] **Step 3.8: Commit changes**
  Run `git add src/store/ tests/storeSlices.test.ts; git commit -m "refactor(store): modularize monolithic playground store into typed domain slices"`

---

### Task 4: Full System Verification & Regression Testing

**Files:**
- Entire codebase

- [ ] **Step 4.1: Run complete test suite**
  Execute all unit, integration, and stress tests: `node --test tests/*.test.ts server/tests/*.test.mjs`.
  Verify 100% pass rate across all tests.

- [ ] **Step 4.2: Verify TypeScript compiler**
  Execute `npm run lint` (`tsc --noEmit`). Ensure 0 type errors.

- [ ] **Step 4.3: Verify browser UI runtime**
  Open `http://localhost:3000/?view=playground` in browser subagent, interact with canvas, add nodes, run simulation, and check for 0 console errors.

- [ ] **Step 4.4: Final commit and state update**
  Update `.planning/STATE.md` and commit all verified changes.
