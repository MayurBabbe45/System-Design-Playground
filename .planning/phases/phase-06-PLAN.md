# Phase 6 Plan: Yjs CRDT Real-Time Collaboration with WebSocket Relay Server

## Objective
Implement real-time multi-user architecture collaboration using **Yjs CRDTs** (Conflict-free Replicated Data Types) and a **Node.js WebSocket Relay Server**, enabling engineering teams to design, inspect, and stress-test distributed architectures collaboratively with live remote cursors, peer presence, and conflict-free concurrent editing.

## Target Deliverables

### 1. Collaborative State Architecture with Yjs
- Install and integrate `yjs` and `y-websocket`.
- Create a synchronized `Y.Doc` representing the architecture canvas:
  - `Y.Map<Node>` for nodes: syncs position, configuration, node data, and chaos states.
  - `Y.Array<Edge>` for edges: syncs topological connections and latency configurations.
- Two-way binding bridge between Zustand/React Flow state and Yjs shared data types:
  - Local canvas actions (drag, drop, connect, parameter edits) dispatch transactional updates to Yjs.
  - Remote Yjs observer callbacks update local canvas state without triggering infinite echo loops.
- **Simulation Decoupling**: Keep 60Hz discrete-event engine ticks and animated particle flows local, while replicating structural graph mutations and chaos switch toggles.

### 2. Multi-User Awareness & Remote Cursor Presence
- Integrate `y-websocket` awareness protocol:
  - Assign random vibrant colors and memorable DevOps engineer handles (e.g. "CloudArchitect-42", "SRE-Phoenix") to each connected client.
  - Real-time mouse cursor tracking across the React Flow infinite canvas (with viewport coordinate transformation).
  - Remote selection highlights: visual halo / badge on nodes currently selected or inspected by remote teammates.

### 3. Collaboration Toolbar & Room Management
- Header **Collaboration Pill**:
  - Live indicator: `🟢 3 Peers Online` / `🟡 Connecting...` / `⚪ Offline (Local Mode)`.
  - Collaborator avatar stack with tooltips showing user names and active inspected nodes.
- **Live Session Sharing Dialog**:
  - 1-click "Invite Teammates" modal with room URL generation (`?room=session-xyz`).
  - Copy room invitation link with embedded preset or current canvas state.

### 4. Node.js WebSocket Relay Server
- Build lightweight relay server in `server/collabServer.ts` using `ws` and Yjs synchronization protocols.
- Add `npm run server:collab` script in `package.json`.
- Automatic reconnection with exponential backoff and offline state persistence.

## Verification Criteria
1. Simultaneous multi-tab test: Changes made in Tab A (node dragging, parameter updates, adding components) reflect in Tab B in real time (<50ms).
2. Remote mouse cursor flows across Tab B's canvas corresponding to Tab A's mouse movements.
3. Node inspector property edits replicate across peers without desync.
4. If WebSocket relay is stopped or unreachable, client gracefully defaults to offline local mode without UI freeze or console crashes.
5. `npm run build` succeeds with zero TypeScript errors.
