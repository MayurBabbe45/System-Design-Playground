# Requirements — System Design Playground

## MVP Requirements (Milestone 1)

### 1. Visual Node Canvas & Component Palette (React Flow)
- [ ] Drag-and-drop cloud infrastructure nodes from a component palette to the canvas.
- [ ] Supported Node Types: Traffic Generator (Client/User), API Gateway, Load Balancer (ALB/NLB), Compute Server (EC2/K8s Pods), Cache (Redis/Memcached), Relational DB (PostgreSQL/MySQL), Message Queue (Kafka/RabbitMQ), CDN/S3.
- [ ] Customizable node properties via an Inspector Panel (RPS capacity, latency ms, queue max depth, instance count, cost model).
- [ ] Connect nodes with directed edges carrying animated data flow packets.

### 2. Discrete Event Simulation (DES) Engine
- [ ] Real-time calculation of request distribution, queuing delay, processing latency, and packet drops.
- [ ] Traffic rate controls (slider from 10 RPS to 100,000 RPS, burst traffic patterns).
- [ ] Visual telemetry feedback: Node color state shifts based on saturation (Green = healthy, Yellow = high load, Red = bottlenecked/dropping requests).
- [ ] Real-time metrics drawer showing total RPS, p95/p99 latency, active queue depth, and drop rate graphs.

### 3. Chaos Engineering Mode & Resilience Testing
- [ ] Interactive Node Kill Switch: Right-click or button trigger to simulate node crash / instance death during simulation.
- [ ] Observe automatic traffic rerouting by load balancer edges or failover database nodes.
- [ ] Retry budget and timeout visualization.

### 4. Architecture Linter, Diagram Export & Stateless URL Sharing
- [ ] Stateless URL Hash sharing powered by `LZ-String` compression for zero-backend architecture link sharing.
- [ ] Deterministic Architecture Health & Single-Point-of-Failure (SPOF) Rule Checker:
  - Detect single non-redundant database instances.
  - Detect load balancers lacking multiple backend targets.
  - Detect write bottlenecks and missing caches.
  - Grade architecture health (A, B, C, F) with deterministic remediation steps.
- [ ] Diagram & Schema Export: Download architecture as JSON schema and high-resolution PNG image.
- [ ] Expanded Production Presets (Flash Sale E-Commerce, CQRS Event Sourcing, Multi-Region Active-Passive).

## Future Milestone Requirements (Milestone 2+)
- [ ] Rust + WASM simulation engine compiled to Web Worker threads.
- [ ] Yjs CRDT real-time multiplayer editing room with WebSocket relay.
- [ ] AI Architecture Judge powered by LLM API for SPOF detection and security review.
- [ ] PostgreSQL + Node.js backend for user authentication and cloud saving.
