# Phase 3 Plan: Chaos Engineering Suite, Multi-Cloud Cost Estimator & Deep Component Inspector

## Objective
Elevate the System Design Playground with an **advanced Chaos Engineering Suite** (AZ Outages, Network Partitions, Circuit Breakers, Auto-Healing Pod Restarts), a **Live AWS & GCP Cloud Cost Calculator Modal** with itemized instance/storage/egress pricing, and **specialized component-level configuration controls** (Cache Hit Rates, Read/Write Splits, Load Balancer Routing Algorithms, Connection Pools).

## Target Deliverables

### 1. Advanced Chaos Engineering Suite
- **Availability Zone (AZ) Partitioning & Outage Simulation**:
  - Assign components to cloud zones (`us-east-1a`, `us-east-1b`, `us-east-1c`).
  - Add a **Chaos Control Center** in the canvas toolbar allowing 1-click regional/AZ blackouts.
  - Observe automatic failover and rerouting of healthy traffic to surviving AZs.
- **Latency Injection & Packet Loss (Network Partition)**:
  - Inject artificial network latency (+100ms, +500ms) or drop packets on specific edges to simulate cross-region WAN degradation.
- **Circuit Breaker & Retry Budget Simulator**:
  - Load balancers and API gateways track downstream error rates.
  - When downstream failure rate exceeds threshold (e.g. 50%), the circuit breaker trips to `OPEN` state, rejecting fast with 503 instead of cascading thread pool starvation.
- **Self-Healing / Kubernetes Pod Restarts**:
  - Optional auto-restart toggle: killed nodes automatically spin back up after a configurable recovery window (e.g. 8s).

### 2. Multi-Cloud Cost Estimator Modal (AWS vs GCP)
- Dedicated **Cloud Cost Analysis Modal** accessible from the Header cost pill:
  - Interactive cost breakdown table categorized into **Compute**, **Databases & Caches**, **Networking & Load Balancing**, and **Storage**.
  - Toggle between **AWS** and **GCP** pricing models.
  - Selectable instance tier sizes (e.g., General Purpose `t4g.xlarge`, Compute Optimized `c6g.2xlarge`, Memory Optimized `r6g.2xlarge`).
  - Visual pie / bar breakdown showing percentage of budget spent on each tier.
  - Monthly vs Annual cost projection with 1-Year Reserved Instance discount comparison.

### 3. Component-Specific Deep Inspector Parameters
- Extend the Inspector with customized parameter tabs depending on node type:
  - **Redis Cache**: Cache Hit Rate slider (0–100%), Memory Capacity (GB), Eviction Policy (LRU / LFU / TTL).
  - **PostgreSQL Database**: Read/Write ratio (e.g. 80% Read / 20% Write), Max Connection Pool size, IOPS provisioned.
  - **Load Balancer**: Routing Strategy (Round Robin, Least Connections, Weighted), Health Check Interval (seconds), Max Retries.
  - **API Gateway**: Rate Limiting Throttling threshold (RPS), Auth Token Validation Overhead (ms).
  - **Kafka Queue**: Partition Count, Retention Hours, Consumer Concurrency.

## Verification Criteria
- Chaos Engineering controls trigger AZ outages and observe surviving nodes absorbing load without crashing the whole graph.
- Circuit breaker state transitions visually indicated on edges and nodes (`CLOSED` -> `OPEN` -> `HALF-OPEN`).
- Cloud Cost modal opens cleanly, calculates realistic AWS/GCP bills, and updates dynamically as nodes are added or scaled.
- `npm run build` compiles with 0 TypeScript errors.
