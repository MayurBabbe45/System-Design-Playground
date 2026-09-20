# Implementation Roadmap — System Design Playground

## Milestone 1: Core Interactive Web Playground & Traffic Simulator

### Phase 1: Project Setup & Canvas Infrastructure (React + TypeScript + React Flow)
- Set up Vite + React + TypeScript web application with custom modern glassmorphic dark theme.
- Install `@xyflow/react` (React Flow), `lucide-react`, `recharts`, `lz-string`.
- Implement main application layout (Header, Left Node Palette Sidebar, Center Canvas, Right Inspector Drawer, Bottom Metrics Dashboard).
- Create custom React Flow node components for Traffic Generator, API Gateway, Load Balancer, Web Server, Cache, Relational DB, Queue, and CDN.

### Phase 2: Simulation Engine & Real-Time Telemetry Animations
- Implement Discrete Event Simulation (DES) queueing engine in TypeScript/Web Worker.
- Calculate queue buildup, processing latency, bottleneck saturation, and request drop rates.
- Add animated data flow particles along edges indicating request velocity and error rates.
- Build live Recharts telemetry dashboard (Throughput, p95 Latency, Queue Depth, Errors).

### Phase 3: Node Inspector, Chaos Engineering & Cloud Cost Estimator
- Build Node Inspector panel to adjust concurrency, capacity, instance count, latency, and cost per hour.
- Implement Chaos Engineering toggle (Kill Switch) to simulate node crash, AZ outage, and failover routing.
- Implement real-time AWS/GCP cloud cost calculator displaying aggregate monthly cost breakdown.

### Phase 4: Stateless URL Sharing, Architecture Linter & Advanced Presets
- Refine LZ-String canvas serialization and URL hash encoder/decoder for 1-click sharing.
- Build deterministic Architecture Health Linter & Single-Point-of-Failure (SPOF) Rule Checker (detects unbacked single databases, missing load balancer redundancy, and unbuffered slow consumers without requiring an AI model).
- Architecture Export Suite: Download architecture as JSON schema and high-resolution PNG image.
- Expanded Production Presets (e.g. Flash Sale E-Commerce, Multi-Region Failover, CQRS Event Sourcing).
- Final UI polish, keyboard shortcuts (Ctrl+S, Delete, Fit View), and micro-animations.

## Milestone 2: WASM Engine, Multiplayer CRDT & Fullstack Persistence
- Phase 5: Rust WebAssembly Discrete Event Engine compiled for Web Workers. (Completed)
- Phase 6: Yjs CRDT real-time collaboration with Node.js WebSocket relay server. (Completed)
- Phase 7: PostgreSQL + Express API backend for authenticated user saves and ClickHouse telemetry logging. (Completed)

## Milestone 3: n8n-Style Workspace, Authentication & Project Lifecycle
- Phase 8: Authentication System & Session Management (Login, Signup, Guest Mode, JWT/Session Store)
- Phase 9: n8n-Inspired Home Dashboard & Projects Workspace (Workspaces, Projects Grid, Templates Shelf, Project Creation)
- Phase 10: Canvas Project Integration, Breadcrumb Navigation & Auto-Sync (URL routing, Project Breadcrumbs, Live Save Sync)

