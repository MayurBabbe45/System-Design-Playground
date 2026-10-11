# Specification: Nine Infrastructure Components & Simulation Math Engine

- **Author**: Antigravity & Lead Engineer
- **Status**: Draft / Under Review
- **Date**: 2026-10-10

---

## 1. Type System & Catalog Metadata

### 1.1 Node Taxonomy Additions

The `ComponentTypeId` union in `src/types/playground.ts` is expanded to include:
- `dns_router`: Network entry point handling weighted or failover DNS resolution.
- `waf`: Network security layer applying token-bucket rate limits and threat inspection latency.
- `serverless_function`: Compute runtime experiencing cold start latency penalties upon concurrency bursts.
- `background_worker`: Compute pull-consumer draining upstream message queues / Kafka partitions.
- `standard_queue`: Messaging point-to-point FIFO/task buffer (SQS / RabbitMQ).
- `pub_sub`: Messaging 1-to-N fan-out event distributor (SNS / EventBridge).
- `search_engine`: Storage inverted index for full-text search workloads (Elasticsearch / Meilisearch).
- `analytics_db`: Storage columnar OLAP engine for aggregate telemetry / analytical batch pipelines (ClickHouse / Snowflake).
- `external_api`: Client/external boundary simulating third-party downstream timeouts and chaos failure rates.

### 1.2 Node Properties Schema Extensions

```typescript
export interface InfrastructureNodeData extends Record<string, unknown> {
  // Existing fields...
  label: string;
  typeId: ComponentTypeId;
  category: NodeCategory;
  instanceCount: number;
  capacityRps: number;
  latencyMs: number;
  maxQueueDepth: number;
  failureRate: number; // 0 to 100 percentage
  costPerHour: number;
  isKilled: boolean;
  
  // Real-time telemetry
  currentRps: number;
  currentQueue: number;
  currentLatency: number;
  status: NodeHealthStatus;
  utilizationPercent: number;
  isBottleneck: boolean;
  
  // Resilience & Multi-AZ
  availabilityZone?: AvailabilityZone;
  circuitBreakerEnabled?: boolean;
  circuitBreakerState?: CircuitBreakerState;
  injectedLatencyMs?: number;

  // DNS Router
  dnsRoutingMode?: 'weighted' | 'failover';
  dnsWeights?: Record<string, number>; // targetNodeId -> percentage (0-100)
  primaryTargetId?: string; // targetNodeId for failover

  // WAF
  rateLimitRps?: number; // Dropped with HTTP 429 when arrivalRate > rateLimitRps
  inspectionLatencyMs?: number;

  // Serverless Function
  coldStartLatencyMs?: number; // Incurred during scaling / concurrency bursts
  warmConcurrency?: number; // Baseline pre-warmed instance capacity

  // External API
  timeoutThresholdMs?: number;

  // Background Worker & Queues
  batchSize?: number;
  pollIntervalMs?: number;

  // Search Engine & Analytics DB
  searchQueryLatencyMs?: number;
  indexingBatchSize?: number;
}
```

### 1.3 Component Catalog Defaults

| Component Type | Display Name | Category | Default Capacity | Default Latency | Default Cost/hr | Queue Buffer | Color |
|---|---|---|---|---|---|---|---|
| `dns_router` | Route 53 DNS | NETWORK | 100,000 RPS | 12 ms | $0.05 | 0 | `#0ea5e9` |
| `waf` | WAF Security | NETWORK | 20,000 RPS | 3 ms | $0.20 | 1,000 | `#f43f5e` |
| `serverless_function` | Lambda Function | COMPUTE | 3,000 RPS | 25 ms | $0.08 | 500 | `#f97316` |
| `background_worker` | Background Worker | COMPUTE | 1,500 RPS | 80 ms | $0.09 | 500 | `#8b5cf6` |
| `standard_queue` | SQS / RabbitMQ | MESSAGING | 10,000 RPS | 15 ms | $0.04 | 10,000 | `#059669` |
| `pub_sub` | SNS / Pub-Sub | MESSAGING | 30,000 RPS | 8 ms | $0.06 | 2,000 | `#d946ef` |
| `search_engine` | Search Engine | STORAGE | 2,500 RPS | 22 ms | $0.35 | 800 | `#eab308` |
| `analytics_db` | Analytics DB (OLAP) | STORAGE | 1,000 RPS | 120 ms | $0.55 | 600 | `#14b8a6` |
| `external_api` | 3rd-Party API | CLIENT | 1,000 RPS | 150 ms | $0.00 | 200 | `#64748b` |

---

## 2. Simulation Mathematics & Flow Propagation

The simulation executes on a periodic tick (1 second real-time window) over a directed acyclic graph (DAG) using topological BFS with in-degree resolution.

### 2.1 DNS Router (Route 53) — Ingress Routing Models
The DNS Router acts as the traffic ingress distributor. It supports two deterministic routing modes:
- **Weighted Traffic Splitting (Canary / Blue-Green)**:
  Let alive downstream edges be $\{e_1, e_2, \dots, e_k\}$ with configured weights $\{w_1, w_2, \dots, w_k\}$.
  1. Filter out edges leading to dead nodes or killed Availability Zones.
  2. If total weight $W_{alive} = \sum_{i=1}^{k} w_i > 0$:
     $$\text{Flow}(e_i) = \text{round}\left( \text{Outflow}_{DNS} \times \frac{w_i}{W_{alive}} \right)$$
  3. If weights are unconfigured or $W_{alive} = 0$, fall back to balanced round-robin:
     $$\text{Flow}(e_i) = \text{round}\left( \frac{\text{Outflow}_{DNS}}{k} \right)$$
  Conservation check: Any rounding residual $(\text{Outflow}_{DNS} - \sum \text{Flow}(e_i))$ is distributed to the primary edge so zero packets vanish.
- **Active-Passive Regional Failover**:
  Designate primary target $T_{primary}$ and backup targets $T_{backup}$.
  - If $T_{primary}$ is alive and not critical (drop rate $< 95\%$):
    $$\text{Flow}(T_{primary}) = \text{Outflow}_{DNS}, \quad \text{Flow}(T_{backup}) = 0$$
  - If $T_{primary}$ is dead or severely degraded:
    $$\text{Flow}(T_{primary}) = 0, \quad \text{Flow}(T_{backup}) = \text{Outflow}_{DNS}$$

### 2.2 Web Application Firewall (WAF) — Rate-Limiting & Security Inspection
Placed between Ingress/DNS and API Gateway.
- **Token-Bucket Rate Limiter**:
  Let arrival rate be $\lambda$, configured limit be $R_{limit}$ (`rateLimitRps`), and total node hardware capacity be $C_{total}$.
  - Permitted flow:
    $$\text{Flow}_{permitted} = \min(\lambda, R_{limit}, C_{total})$$
  - Security 429 Dropped RPS:
    $$\text{Dropped}_{429} = \max(0, \lambda - R_{limit})$$
- **Inspection Latency**:
  WAF incurs a deep packet inspection latency $\Delta t_{waf} = \text{inspectionLatencyMs} \approx 3\text{ ms}$, propagating cumulatively to edge streams.

### 2.3 Pub/Sub Topic (SNS / EventBridge) — Event Fan-Out Multiplication
Standard load balancers partition incoming traffic ($\frac{\lambda}{N}$). In contrast, Pub/Sub replicates 100% of event traffic to every subscribed downstream consumer:
$$\forall e \in \text{OutgoingEdges}, \quad \text{Flow}(e) = \text{Outflow}_{PubSub}$$
System-wide processed RPS correctly distinguishes between original ingress volume and downstream replicated event activations.

### 2.4 Asynchronous Queues & Background Workers — Pull-Based Draining
Decouples synchronous HTTP requests from background task processing:
- **Queues (`standard_queue` and `message_queue`)**:
  - Arriving tasks are enqueued into a finite buffer with maximum depth $K$ (`maxQueueDepth`).
  - If queue buffer is full ($Q \ge K$), buffer overflow occurs and excess tasks are dropped to DLQ.
- **`background_worker` (Consumer Pull Model)**:
  - Pull capacity per tick:
    $$C_{worker} = \text{capacityRps} \times \text{instanceCount}$$
  - Rate drained from upstream queue:
    $$\text{DrainedRps} = \min(\text{CurrentQueueBacklog} + \text{Inflow}, C_{worker})$$
  - Remaining queue backlog:
    $$\text{QueueBacklog}_{t+1} = \max(0, \text{QueueBacklog}_t + \text{Inflow} - \text{DrainedRps})$$

### 2.5 Serverless Function (Lambda) — Concurrency Burst & Cold Starts
- **Warm vs Cold Partitioning**:
  Let provisioned warm capacity be $C_{warm} = \text{warmConcurrency} \times (\text{capacityRps} / \text{instances})$.
  - If arrival rate $\lambda \le C_{warm}$: $100\%$ of invocations run on warm containers; cold start penalty is $0\text{ ms}$.
  - If arrival rate $\lambda > C_{warm}$:
    $$\text{ColdRatio} = \frac{\lambda - C_{warm}}{\lambda}$$
  - Effective Execution Latency:
    $$L_{effective} = L_{base} + (\text{ColdRatio} \times \text{coldStartLatencyMs}) + W_{queue}$$

### 2.6 External API (3rd-Party Service) — Chaos Engineering & Timeouts
Simulates third-party SaaS dependencies (e.g., Stripe, Twilio).
- **Failure Simulation**:
  $$\text{Dropped}_{timeout} = \text{round}\left(\lambda \times \frac{\text{failureRate}}{100}\right)$$
  $$\text{ProcessedRps} = \lambda - \text{Dropped}_{timeout}$$
- **Latency Profile**: Fixed default latency $L_{base} = 150\text{ ms}$ plus any user-configured chaos jitter.

### 2.7 Search Engine & Analytics DB — Heavy OLAP/Indexing Solvers
- **`search_engine`**: High read-throughput profile with sub-quadratic indexing buffer scaling.
- **`analytics_db`**: Columnar batching profile where query latency scales with aggregation batch sizes rather than linear request concurrency.

---

## 3. Inspector Controls & Visual Component Icons

### 3.1 Custom SVG Infrastructure Iconography
We implement 9 custom Lucide-style SVG icons styled with the Dark Spatial UI design system:
- **DNS Router (`Compass` / `Route53`)**: `#0ea5e9` - Navigational compass with directional entry arrows.
- **WAF (`ShieldAlert`)**: `#f43f5e` - Reinforced security shield with flame/filter barrier.
- **Serverless Function (`Lambda`)**: `#f97316` - Greek letter lambda ($\lambda$) with reactive energy spark.
- **Background Worker (`CogConsumer`)**: `#8b5cf6` - Dual interlocking precision gears with cyclic consumption arrows.
- **Standard Queue (`InboxQueue`)**: `#059669` - FIFO sequential packet stack (SQS / RabbitMQ).
- **Pub/Sub Topic (`Broadcast`)**: `#d946ef` - Radial 1-to-N fan-out radio waves radiating outward.
- **Search Engine (`SearchIndex`)**: `#eab308` - Magnifying loupe over indexed inverted document partitions.
- **Analytics DB (`BarChartDb`)**: `#14b8a6` - Columnar OLAP aggregation cylinders with analytics bar chart.
- **External API (`CloudExternal`)**: `#64748b` - Cloud perimeter with outbound handshake plug / webhook.

### 3.2 Context-Sensitive Inspector Controls
Dedicated inspector panels render conditionally based on selected node `typeId`:
1. **DNS Router Settings**:
   - `dnsRoutingMode`: Toggle between `'weighted'` and `'failover'`.
   - `dnsWeights`: Slider per outgoing target edge (0-100%).
   - `primaryTargetId`: Select dropdown for failover mode.
2. **WAF Security Parameters**:
   - `rateLimitRps`: Slider (100 to 100,000 RPS).
   - `inspectionLatencyMs`: Slider (1ms to 25ms).
   - Real-time display of 429 dropped RPS counter.
3. **Serverless Function Parameters**:
   - `coldStartLatencyMs`: Slider (50ms to 2,000ms).
   - `warmConcurrency`: Slider (1 to 200 warm instances).
   - Active cold penalty badge.
4. **Background Worker Parameters**:
   - `batchSize`: Tasks consumed per tick (1 to 500 tasks).
   - `pollIntervalMs`: Polling cadence (10ms to 1,000ms).
5. **Standard Queue Parameters**:
   - `maxQueueDepth`: Slider (1,000 to 50,000 tasks).
   - Real-time queue buffer utilization bar.
6. **Pub/Sub Parameters**:
   - Fan-out multiplier telemetry badge ($N \times \text{Flow}$).
7. **Search Engine Parameters**:
   - `searchQueryLatencyMs`: Base query latency (5ms to 100ms).
   - Indexing throughput capacity.
8. **Analytics DB Parameters**:
   - Aggregation window duration (100ms to 5,000ms).
   - Columnar compression factor.
9. **External API Parameters**:
   - `latencyMs`: Default baseline latency (20ms to 3,000ms).
   - `failureRate`: Chaos error rate percentage (0% to 100%).
   - `timeoutThresholdMs`: Cutoff timeout threshold (500ms to 5,000ms).

---

## 4. Architecture Linter & Best Practice Validations

In `src/simulation/architectureLinter.ts`:
- **`WAF_PLACEMENT`**: Warning if API Gateway receives public ingress without a preceding WAF or CDN.
- **`QUEUE_WITHOUT_CONSUMER`**: Warning if a `standard_queue` or `message_queue` has incoming producers but zero downstream `background_worker` or compute consumers.
- **`ORPHAN_PUB_SUB`**: Warning if a `pub_sub` node has upstream publishers but zero downstream subscribers.
- **`EXTERNAL_API_CIRCUIT_BREAKER`**: Warning/recommendation to enable Circuit Breaker when connecting to an `external_api` with `failureRate > 10%`.

---

## 5. Verification & Testing Criteria

1. **Topological Conservation & Fan-out Tests**:
   - Pub/Sub correctly duplicates 100% of event flow across all connected downstream edges.
   - WAF drops exactly $\max(0, \text{arrivalRate} - \text{rateLimitRps})$ and forwards the remainder.
   - DNS Router weighted split distributes flow matching exact percentage ratios, with zero packet leakage.
   - DNS Router active-passive routes 100% to backup when primary node is killed or degraded.
2. **Queueing & Cold Start Tests**:
   - Serverless function applies `coldStartLatencyMs` only to requests exceeding `warmConcurrency`.
   - Background worker drains queue up to its processing capacity.
   - External API drops requests matching `failureRate` with 504 errors.
3. **Type Safety & Build**:
   - TypeScript compilation (`npx tsc --noEmit`) passes with 0 type errors.
   - Dark Spatial UI rendering on Canvas and Inspector verified in browser.


