# Nine Infrastructure Components Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand the simulation canvas with 9 production-grade infrastructure components (`dns_router`, `waf`, `serverless_function`, `background_worker`, `standard_queue`, `pub_sub`, `search_engine`, `analytics_db`, and `external_api`) backed by zero-error queueing, flow propagation, and spatial UI controls.

**Architecture:** Extend the core TypeScript domain model, implement custom routing and conservation algorithms in the Web Worker BFS DAG traversal (Canary/Failover DNS, token-bucket WAF, 1-to-N Pub/Sub fan-out, queue-worker pull draining, and serverless cold start latency), build Lucide-style spatial icons, and integrate context-aware inspector parameter controls.

**Tech Stack:** React 18, TypeScript 5.7, @xyflow/react, Lucide React, Web Workers, Node 24 native test runner.

**Spec:** `docs/superpowers/specs/2026-10-10-nine-components-simulation-design.md`

## Global Constraints

- Never break backward compatibility for existing presets or saved graphs; `message_queue` remains valid for Kafka event streams while `standard_queue` supports SQS/RabbitMQ.
- Preserve exact packet conservation across DAG edges except for explicit drops (WAF 429, queue overflow, chaos timeouts) and explicit multiplication (Pub/Sub fan-out).
- Maintain 60 FPS performance in `simulationWorker.ts` with zero asynchronous blocking or memory leaks.
- Retain the Dark Spatial UI design language (acrylic frosted glass, specular borders, accent glows) without introducing light mode styles.

## Review Focus

- DNS Router weighted split distributes uneven percentages (e.g. 90/10) with zero lost or duplicated residual packets.
- DNS Router active-passive failover routes 100% of traffic to backup when the primary target is dead or killed via Chaos AZ.
- WAF drops exactly excess requests when `arrivalRate > rateLimitRps` with 429 status code and forwards permitted traffic.
- Pub/Sub replicates 100% of incoming event traffic to every connected downstream edge without dividing by target count.
- Serverless cold start latency is added exclusively to un-provisioned burst requests when concurrency exceeds warm capacity.

---

### Task 1: Type System & Component Catalog Taxonomy

**Files:**
- Modify: `src/types/playground.ts:1-75`
- Modify: `src/config/components.ts:1-125`

**Interfaces:**
- Consumes: None (Root type definition).
- Produces: `ComponentTypeId` with 9 new types, extended `InfrastructureNodeData` with DNS, WAF, Serverless, and Queue parameters, updated `COMPONENT_CATALOG`.

- [ ] **Step 1: Write type definitions in `src/types/playground.ts`**
  Add `'dns_router'`, `'waf'`, `'serverless_function'`, `'background_worker'`, `'standard_queue'`, `'pub_sub'`, `'search_engine'`, `'analytics_db'`, `'external_api'` to `ComponentTypeId`.
  Add `dnsRoutingMode`, `dnsWeights`, `primaryTargetId`, `rateLimitRps`, `inspectionLatencyMs`, `coldStartLatencyMs`, `warmConcurrency`, `timeoutThresholdMs`, `batchSize`, `pollIntervalMs`, `searchQueryLatencyMs`, `indexingBatchSize` to `InfrastructureNodeData`.

- [ ] **Step 2: Add metadata entries in `src/config/components.ts`**
  Define metadata for all 9 components with proper categories, default RPS, latency, cost per hour, queue buffers, and theme accent colors.

- [ ] **Step 3: Verify TypeScript compilation**
  Run: `npm run lint`
  Expected: PASS with 0 type errors.

- [ ] **Step 4: Commit**
  ```bash
  git add src/types/playground.ts src/config/components.ts
  git commit -m "feat: define types and catalog metadata for 9 infrastructure components"
  ```

---

### Task 2: Simulation Mathematics & Propagation Logic in Web Worker

**Files:**
- Modify: `src/simulation/queueTheory.ts:80-126`
- Modify: `src/workers/simulationWorker.ts:100-260`

**Interfaces:**
- Consumes: `ComponentTypeId`, `InfrastructureNodeData` from `src/types/playground.ts`.
- Produces: `solvePullQueueDrain`, `solveServerlessLatency` in `queueTheory.ts`, and corrected flow propagation for DNS weighted/failover, WAF rate limit, Pub/Sub fan-out, Queue worker pull, and Serverless cold starts in `simulationWorker.ts`.

- [ ] **Step 1: Implement queue draining & serverless burst latency in `src/simulation/queueTheory.ts`**
  - Add `solvePullQueueDrain(currentBacklog: number, inflowRps: number, workerCapacityRps: number): { drainedRps: number; remainingBacklog: number; droppedOverflowRps: number; isOverflown: boolean }` calculating discrete buffer accumulation and pull drain against max buffer $K$.
  - Add `solveServerlessLatency(baseLatencyMs: number, arrivalRate: number, warmCapacity: number, coldStartLatencyMs: number, queueWaitMs: number): { effectiveLatencyMs: number; isColdBurst: boolean; coldRatio: number }` calculating the proportional cold start penalty on un-provisioned requests.

- [ ] **Step 2: Implement DNS Routing logic in `simulationWorker.ts`**
  When `currentNode.data.typeId === 'dns_router'`:
  - If `dnsRoutingMode === 'failover'`: check if primary target is alive. Route 100% to primary if alive, otherwise 100% to backup targets.
  - If `dnsRoutingMode === 'weighted'`: compute normalized weights over alive targets; distribute flow with rounding residual assigned to primary.

- [ ] **Step 3: Implement WAF rate-limiting & 429 drops in `simulationWorker.ts`**
  When `currentNode.data.typeId === 'waf'`:
  - Calculate `rateLimit = currentNode.data.rateLimitRps ?? 20000`.
  - Calculate `dropped429 = Math.max(0, nodeInflow - rateLimit)`.
  - Permitted outflow is `Math.min(nodeInflow, rateLimit, capacityTotal)`.
  - Add `inspectionLatencyMs` (default 3ms) to latency calculation.

- [ ] **Step 4: Implement Pub/Sub 1-to-N fan-out replication in `simulationWorker.ts`**
  When `currentNode.data.typeId === 'pub_sub'`:
  - Do NOT divide outflow by target count. Assign 100% of `effectiveOutflow` to each alive downstream edge.

- [ ] **Step 5: Implement Queue & Background Worker pull model in `simulationWorker.ts`**
  When upstream node is a queue (`standard_queue` or `message_queue`) connected to `background_worker`:
  - Leverage `solvePullQueueDrain` to drain flow governed by worker's `capacityRps * instanceCount`.
  - Accumulate backlog across ticks and shed overflow to dropped RPS.

- [ ] **Step 6: Implement Serverless cold-start latency model in `simulationWorker.ts`**
  When `currentNode.data.typeId === 'serverless_function'`:
  - Calculate warm capacity `warmCap = (currentNode.data.warmConcurrency ?? 10) * (capacityPerInstance)`.
  - Leverage `solveServerlessLatency` to inject proportional cold latency onto burst arrivals.

- [ ] **Step 7: Implement External API chaos timeouts in `simulationWorker.ts`**
  When `currentNode.data.typeId === 'external_api'`:
  - Apply `failureRate` drop percentage to simulate 504 timeouts.
  - Set baseline latency to `currentNode.data.latencyMs ?? 150`.

- [ ] **Step 8: Verify TypeScript compilation**
  Run: `npm run lint`
  Expected: PASS with 0 type errors.

- [ ] **Step 9: Commit**
  ```bash
  git add src/simulation/queueTheory.ts src/workers/simulationWorker.ts
  git commit -m "feat: implement production-grade flow propagation and queue math for 9 components"
  ```

---

### Task 3: Unit Test Suite for Simulation Mathematics

**Files:**
- Create: `tests/simulationMath.test.ts`

**Interfaces:**
- Consumes: Node data structures and queue theory solvers.
- Produces: Automated verification suite covering DNS, WAF, Pub/Sub, Queues, Serverless, and Chaos scenarios.

- [ ] **Step 1: Write automated test file `tests/simulationMath.test.ts`**
  Test cases:
  1. DNS weighted split (90/10 Canary) exact conservation.
  2. DNS active-passive failover when primary node dies.
  3. WAF rate limiting dropping excess RPS with 429 errors.
  4. Pub/Sub fan-out duplicating 100% flow across 3 subscribers.
  5. Serverless cold start latency penalty on burst traffic.
  6. External API chaos timeout failure rate.

- [ ] **Step 2: Run test suite with Node test runner**
  Run: `node --experimental-strip-types --test tests/simulationMath.test.ts`
  Expected: All 6 test suites PASS.

- [ ] **Step 3: Commit**
  ```bash
  git add tests/simulationMath.test.ts
  git commit -m "test: add comprehensive simulation math unit tests"
  ```

---

### Task 4: Custom Dark Spatial UI Infrastructure Icons

**Files:**
- Modify: `src/components/icons/ComponentIcons.tsx:1-150`

**Interfaces:**
- Consumes: Component type IDs and Lucide icon primitives.
- Produces: Exported icon renderers for `dns_router`, `waf`, `serverless_function`, `background_worker`, `standard_queue`, `pub_sub`, `search_engine`, `analytics_db`, and `external_api`.

- [ ] **Step 1: Add SVG icon definitions in `src/components/icons/ComponentIcons.tsx`**
  Create SVG icons with dark spatial gradients and acrylic specular glow styles:
  - `Compass` / `Route53` for DNS Router.
  - `ShieldAlert` for WAF.
  - `Lambda` for Serverless Function.
  - `CogConsumer` for Background Worker.
  - `InboxQueue` for Standard Queue.
  - `Broadcast` for Pub/Sub Topic.
  - `SearchIndex` for Search Engine.
  - `BarChartDb` for Analytics DB.
  - `CloudExternal` for External API.

- [ ] **Step 2: Update `getComponentIcon` helper to map all 9 new type IDs**

- [ ] **Step 3: Verify TypeScript compilation**
  Run: `npm run lint`
  Expected: PASS.

- [ ] **Step 4: Commit**
  ```bash
  git add src/components/icons/ComponentIcons.tsx
  git commit -m "feat: add 9 custom spatial infrastructure icons"
  ```

---

### Task 5: Context-Sensitive Inspector Controls & Zustand Store Mutations

**Files:**
- Modify: `src/store/usePlaygroundStore.ts:120-140,400-500`
- Modify: `src/components/Inspector.tsx:150-350`

**Interfaces:**
- Consumes: Selected node state and update handler from `usePlaygroundStore`.
- Produces: Explicit Zustand mutation actions (`updateNodeDnsSettings`, `updateNodeWafSettings`, `updateNodeServerlessSettings`, `updateNodeQueueSettings`, `updateNodeExternalApiSettings`), interactive sliders, segmented mode toggles, and real-time telemetry badges.

- [ ] **Step 1: Add dedicated store update actions in `src/store/usePlaygroundStore.ts`**
  Add action declarations to `PlaygroundState` interface and implementations in `create<PlaygroundState>`:
  - `updateNodeDnsSettings: (id: string, mode: 'weighted' | 'failover', weights?: Record<string, number>, primaryTargetId?: string) => void`
  - `updateNodeWafSettings: (id: string, rateLimitRps: number, inspectionLatencyMs: number) => void`
  - `updateNodeServerlessSettings: (id: string, coldStartLatencyMs: number, warmConcurrency: number) => void`
  - `updateNodeQueueSettings: (id: string, maxQueueDepth: number, batchSize?: number, pollIntervalMs?: number) => void`
  - `updateNodeExternalApiSettings: (id: string, latencyMs: number, failureRate: number, timeoutThresholdMs?: number) => void`
  Ensure each action mutates node data immutably, triggers DAG history snapshot, and syncs via Yjs collaboration manager if active.

- [ ] **Step 2: Add DNS Router inspector section in `src/components/Inspector.tsx`**
  Toggle between `'weighted'` and `'failover'`. Sliders for target edge weights or primary target selector wired to `updateNodeDnsSettings`.

- [ ] **Step 3: Add WAF inspector section in `src/components/Inspector.tsx`**
  Sliders for `rateLimitRps` and `inspectionLatencyMs` wired to `updateNodeWafSettings`. Display blocked 429 requests counter.

- [ ] **Step 4: Add Serverless inspector section in `src/components/Inspector.tsx`**
  Sliders for `coldStartLatencyMs` and `warmConcurrency` wired to `updateNodeServerlessSettings`. Cold invocation warning badge.

- [ ] **Step 5: Add Background Worker & Queue inspector sections in `src/components/Inspector.tsx`**
  Batch size and poll interval controls for worker. Queue max depth slider and backlog gauge for queue wired to `updateNodeQueueSettings`.

- [ ] **Step 6: Add External API inspector section in `src/components/Inspector.tsx`**
  Sliders for `latencyMs` and `failureRate` chaos injection wired to `updateNodeExternalApiSettings`.

- [ ] **Step 7: Verify TypeScript compilation**
  Run: `npm run lint`
  Expected: PASS with 0 type errors.

- [ ] **Step 8: Commit**
  ```bash
  git add src/store/usePlaygroundStore.ts src/components/Inspector.tsx
  git commit -m "feat: add explicit store update actions and specialized Inspector controls for 9 components"
  ```

---

### Task 6: Canvas Node Cards & Draggable Sidebar Palette

**Files:**
- Modify: `src/components/Sidebar.tsx:1-120`
- Modify: `src/components/nodes/InfrastructureNode.tsx:1-200`

**Interfaces:**
- Consumes: `COMPONENT_CATALOG` metadata.
- Produces: Categorized draggable items in Sidebar and rendered node cards on canvas with real-time health badges.

- [ ] **Step 1: Update `Sidebar.tsx` categories**
  Group components into clear spatial categories: `Clients & Network`, `Compute`, `Storage`, `Messaging & Queues`. Ensure all 9 components are draggable onto the canvas with drag ghosts.

- [ ] **Step 2: Update `InfrastructureNode.tsx` status display**
  Render component-specific metrics on the node card (e.g. WAF 429 count, Queue backlog, Pub/Sub fan-out count, Cold start indicator).

- [ ] **Step 3: Verify TypeScript compilation**
  Run: `npm run lint`
  Expected: PASS.

- [ ] **Step 4: Commit**
  ```bash
  git add src/components/Sidebar.tsx src/components/nodes/InfrastructureNode.tsx
  git commit -m "feat: expose all 9 components in Sidebar palette and render real-time node badges"
  ```

---

### Task 7: Architecture Linter Validation Rules

**Files:**
- Modify: `src/simulation/architectureLinter.ts:1-150`

**Interfaces:**
- Consumes: Canvas graph nodes and edges.
- Produces: Architectural warnings and best practice suggestions.

- [ ] **Step 1: Add WAF ingress check**
  Warn if API Gateway is directly exposed without WAF or CDN.

- [ ] **Step 2: Add Queue consumer check**
  Warn if a queue has upstream producers but no downstream background worker.

- [ ] **Step 3: Add Orphan Pub/Sub check**
  Warn if Pub/Sub topic has no subscribers.

- [ ] **Step 4: Add External API circuit breaker check**
  Recommend circuit breaker if external API failure rate > 10%.

- [ ] **Step 5: Verify TypeScript compilation**
  Run: `npm run lint`
  Expected: PASS.

- [ ] **Step 6: Commit**
  ```bash
  git add src/simulation/architectureLinter.ts
  git commit -m "feat: add architecture linter rules for 9 infrastructure components"
  ```

---

### Task 8: End-to-End System Integration & Verification

**Files:**
- Verification: Entire application running locally on port 3000.

- [ ] **Step 1: Run full unit test suite**
  Run: `node --experimental-strip-types --test tests/simulationMath.test.ts`
  Expected: All simulation math tests PASS.

- [ ] **Step 2: Run type check and production build**
  Run: `npm run lint`
  Run: `npm run build`
  Expected: Build succeeds with 0 errors.

- [ ] **Step 3: Test dragging new components on canvas in browser**
  Drag DNS Router, WAF, Serverless, Pub/Sub, Queue, Worker, Search Engine, Analytics DB, and External API onto canvas. Verify flow lines, inspector controls, and metrics updates.
