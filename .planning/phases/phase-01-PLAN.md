# Phase 1 Plan: Core Visual Canvas & Component Palette

## Objective
Initialize the React 18 + TypeScript + Vite project for **SYSTEM DESIGN PLAYGROUND**, set up the dark glassmorphic design system, integrate `@xyflow/react` (React Flow), and build the interactive visual canvas with drag-and-drop cloud infrastructure node types.

## Target Deliverables
1. **Vite + React 18 + TypeScript Setup**: Complete package configuration with `@xyflow/react`, `lucide-react`, `recharts`, `lz-string`, `clsx`, `tailwind-merge` / vanilla CSS modules.
2. **Design System & Layout**:
   - Modern ultra-sleek dark theme canvas UI with glassmorphic floating panels.
   - Header with active canvas title, preset architecture loader (e.g. Microservices, DB Read Replica, CDN Cache), simulation status, and share button.
   - Left Component Palette Sidebar (Drag-and-Drop infrastructure node templates with icons and color coding).
   - Main Infinite Canvas (`@xyflow/react`) with custom grid, minimap, control toolbar, and dynamic node connections.
   - Right Inspector Drawer (Contextual properties editor for selected node).
   - Bottom Real-time Telemetry Dashboard (Throughput RPS, Latency p95, Queue Depth, Error rate charts).
3. **Custom Cloud Component Node Suite**:
   - `TrafficGeneratorNode`: User/Client icon, adjustable RPS output, burst mode toggle.
   - `ApiGatewayNode`: Rate limiting, authentication delay, routing rules.
   - `LoadBalancerNode`: Round-robin / Least connections routing, capacity limits, health check status.
   - `WebServerNode`: CPU concurrency, processing time (ms), thread pool depth.
   - `CacheNode`: Hit rate %, latency (ms), memory capacity.
   - `DatabaseNode`: Primary/Replica badge, max connection pool, IOPS, read/write split.
   - `QueueNode`: Max queue depth, retention, worker consumers.
   - `CdnNode`: Cache hit ratio, edge bandwidth.
4. **Interactive Palette Drag & Drop**:
   - Drag components from sidebar onto the React Flow canvas to instantiate new active nodes.
   - Dynamic edge connection validation (e.g. connecting Traffic Generator to Load Balancer, LB to Web Server).

## Verification Criteria
- `npm run build` succeeds without TypeScript or bundling errors.
- Visual canvas renders with custom dark grid, nodes can be dragged from sidebar, moved, connected, inspected, and deleted.
- Preset architectures load cleanly onto the canvas with default parameters.
