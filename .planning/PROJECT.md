# SYSTEM DESIGN PLAYGROUND — Interactive Architecture Simulator

## Overview
SYSTEM DESIGN PLAYGROUND is a web-based, interactive system design simulator and visual diagramming tool (resembling n8n / Figma). Users drag and drop cloud infrastructure components (EC2, Load Balancers, PostgreSQL, Redis, Kafka, API Gateways) onto a canvas, connect them, specify hypothetical traffic load (e.g. 100,000 req/sec), and run real-time discrete-event simulations to visualize bottlenecks, queue build-ups, latency spikes, and failure scenarios.

## Target Audience
- **Job Seekers / Engineers**: Practicing for FAANG-level system design interviews with dynamic load testing.
- **Enterprise Cloud Architects & SREs**: Simulating traffic spikes, auto-scaling, and capacity planning.
- **Educators & Students**: Teaching distributed systems, queuing theory, and networking interactively.

## Technical Architecture & Core Stack
- **Frontend**: React 18+ with strict TypeScript, modern dark-mode visual design system.
- **Visual Canvas Layer**: React Flow (`@xyflow/react`) for node/edge rendering, custom ports, drag-and-drop, and interactive node overlays.
- **Simulation Engine**: Discrete Event Simulation (DES) using Queueing Theory (Jackson Networks, Kendall's notation). Rust compiled to WebAssembly (WASM) running in Web Workers for zero-GC pause performance (with pure JS fallback).
- **Stateless URL Sharing**: `LZ-String` URI-safe Base64 compression of JSON canvas state in URL hash.
- **Multiplayer CRDT**: `Yjs` for real-time multiplayer editing via WebSocket relay server.
- **Backend & Database**: Node.js/Express (TypeScript) REST & WS relay, PostgreSQL with `JSONB` for project storage.
- **Analytics & Telemetry**: ClickHouse for high-throughput time-series metrics ingestion (latency, queue depths, drops).

## Differentiating Features
1. **Zero-Backend Compute**: Simulation logic executes in-browser via WebAssembly / Web Workers.
2. **Chaos Engineering Mode**: Live node failure/kill-switch to test resilience, AZ outages, and retry logic.
3. **Live Cloud Cost Estimator**: Calculates real-time estimated monthly AWS/GCP infrastructure costs based on canvas topology.
4. **AI Architecture Judge**: LLM-powered structural critique for single points of failure (SPOF) and performance bottlenecks.
5. **Stateless Share Links**: Compressed URL hashes allowing instant sharing without backend account creation.
