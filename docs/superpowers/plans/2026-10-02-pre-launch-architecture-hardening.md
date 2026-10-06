# Pre-Launch Architecture Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate critical BOLA/IDOR vulnerabilities, prevent authentication bypasses, evict stale WebSocket relay rooms and connections, and optimize simulation canvas render churn before first launch.

**Architecture:** Implement strict JWT verification middleware and tenant-scoped database queries (`user_id = $userId`). Add ping/pong socket heartbeats and idle room eviction to the Yjs collaboration relay. Optimize Zustand store state reconciliation to prevent O(N) canvas re-renders on simulation ticks.

**Tech Stack:** Node.js 22 (ESM, native `node:test` runner), Express 5, PostgreSQL / Embedded JSON, ws 8, Yjs 13, React 18, Zustand 5, @xyflow/react.

**Spec:** Pre-launch Architectural & Security Review (OWASP Top 10 API Security, Memory Leak & Performance Audit).

## Global Constraints

- Never break backward compatibility for existing presets (`PRESET_ARCHITECTURES`) or stateless URL hash sharing (`LZString`).
- Zero unauthenticated writes or mutations: anonymous users may only view public architectures and run local in-browser simulations.
- Retain dual-mode operation: system must continue functioning seamlessly in both production (PostgreSQL/ClickHouse) and zero-config local mode (`playground_db.json`).
- Automated tests must use Node.js built-in ESM test runner (`node --test`) without adding bulky external testing dependencies.

## Review Focus

1. **IDOR Cross-Tenant Deletion**: Attempting to delete Architecture A using an authentication token belonging to User B must return `403 Forbidden` or `404 Not Found`, leaving Architecture A intact.
2. **Missing Token on Protected Route**: Calling `POST /api/architectures` without a `Bearer` token or cookie must return `401 Unauthorized`, rather than creating records under `usr_local_architect`.
3. **Ghost WebSocket Connections**: Terminating a network connection without an orderly TCP close must cause the collaboration server to prune the socket within 60 seconds via ping/pong heartbeat.
4. **Empty Room Garbage Collection**: When all peers disconnect from a collaboration room, the server must destroy the `Y.Doc` and delete the room from memory after a configured timeout.
5. **Canvas Drag Smoothness**: During an active 10 Hz simulation, moving a node on the canvas must maintain 60 FPS without jank caused by full-graph object recreation.

---

### Task 1: Strict Authentication Middleware & CORS Whitelist

**Files:**
- Modify: `server/apiServer.mjs:24-54`
- Test: `server/tests/authMiddleware.test.mjs`

**Interfaces:**
- Consumes: `jwt.verify(token, secret)` from `jsonwebtoken`
- Produces: `requireAuth(req, res, next)` Express middleware which sets `req.user = { id, email, name }` or rejects with HTTP 401.

- [ ] **Step 1: Write the failing test for strict authentication**

Create `server/tests/authMiddleware.test.mjs`:
```javascript
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

describe('API Auth & Security Tests', () => {
  test('requireAuth rejects unauthenticated requests with 401', async () => {
    const res = await fetch('http://localhost:4000/api/architectures', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Hacked Arch', nodes: [], edges: [] }),
    });
    assert.equal(res.status, 401);
  });

  test('requireAuth rejects expired or forged tokens with 401', async () => {
    const res = await fetch('http://localhost:4000/api/architectures', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': 'Bearer forged-jwt-token-xyz'
      },
      body: JSON.stringify({ name: 'Hacked Arch', nodes: [], edges: [] }),
    });
    assert.equal(res.status, 401);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test server/tests/authMiddleware.test.mjs`
Expected: FAIL (currently returns 201 because unauthenticated requests silently default to demo user).

- [ ] **Step 3: Implement strict authentication and CORS in `server/apiServer.mjs`**

1. Replace permissive `authenticateUser` with strict `requireAuth`:
```javascript
export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = (authHeader && authHeader.startsWith('Bearer ')) 
    ? authHeader.split(' ')[1] 
    : req.cookies?.token;

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired authentication token' });
  }
}
```
2. Create optional auth middleware `optionalAuth` for public read routes (`GET /api/architectures`):
```javascript
export function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = (authHeader && authHeader.startsWith('Bearer ')) 
    ? authHeader.split(' ')[1] 
    : req.cookies?.token;

  if (token) {
    try {
      req.user = jwt.verify(token, JWT_SECRET);
    } catch {
      req.user = null;
    }
  } else {
    req.user = null;
  }
  next();
}
```
3. Attach `requireAuth` to all mutation endpoints (`POST /api/architectures`, `PUT /api/architectures/:id`, `DELETE /api/architectures/:id`, `POST /api/architectures/:id/fork`, `GET /api/auth/me`).
4. Update CORS policy in `server/apiServer.mjs` to validate `origin` against allowed localhost and environment origins rather than unrestricted `origin: true`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test server/tests/authMiddleware.test.mjs`
Expected: PASS with 401 responses.

- [ ] **Step 5: Commit**

```bash
git add server/apiServer.mjs server/tests/authMiddleware.test.mjs
git commit -m "fix(security): enforce strict JWT auth and restrict CORS origins"
```

---

### Task 2: Object-Level Authorization (BOLA/IDOR Elimination)

**Files:**
- Modify: `server/db/postgres.mjs:265-362`
- Modify: `server/apiServer.mjs:178-204`
- Test: `server/tests/tenantIsolation.test.mjs`

**Interfaces:**
- Consumes: `userId` from `req.user.id`
- Produces: `updateArchitecture(id, userId, updates) -> architecture | null`
- Produces: `deleteArchitecture(id, userId) -> boolean` (scoped to `user_id = $userId`)

- [ ] **Step 1: Write the failing test for cross-tenant isolation**

Create `server/tests/tenantIsolation.test.mjs`:
```javascript
import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import { saveArchitecture, deleteArchitecture, updateArchitecture, createUser } from '../db/postgres.mjs';

describe('Tenant Isolation & IDOR Protection', () => {
  let victimUser;
  let attackerUser;
  let victimArch;

  before(async () => {
    victimUser = await createUser({ email: 'victim@test.local', passwordHash: 'hash', name: 'Victim' });
    attackerUser = await createUser({ email: 'attacker@test.local', passwordHash: 'hash', name: 'Attacker' });
    victimArch = await saveArchitecture({
      userId: victimUser.id,
      name: 'Confidential Production Architecture',
      nodes: [],
      edges: []
    });
  });

  test('Attacker cannot delete victim architecture', async () => {
    const deleted = await deleteArchitecture(victimArch.id, attackerUser.id);
    assert.equal(deleted, false, 'Attacker should not be able to delete another tenant architecture');
  });

  test('Attacker cannot update victim architecture', async () => {
    const updated = await updateArchitecture(victimArch.id, attackerUser.id, { name: 'Compromised Name' });
    assert.equal(updated, null, 'Attacker should not be able to update another tenant architecture');
  });

  test('Owner can successfully update and delete their own architecture', async () => {
    const updated = await updateArchitecture(victimArch.id, victimUser.id, { name: 'Updated by Owner' });
    assert.ok(updated);
    assert.equal(updated.name, 'Updated by Owner');

    const deleted = await deleteArchitecture(victimArch.id, victimUser.id);
    assert.equal(deleted, true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test server/tests/tenantIsolation.test.mjs`
Expected: FAIL (`deleted` returns `true` because `deleteArchitecture` currently ignores `userId`).

- [ ] **Step 3: Enforce `user_id` scoping in `server/db/postgres.mjs`**

1. Modify `deleteArchitecture`:
```javascript
export async function deleteArchitecture(id, userId) {
  if (pool) {
    const res = await pool.query(
      'DELETE FROM architectures WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );
    return (res.rowCount ?? 0) > 0;
  } else {
    const db = loadLocalDb();
    const initialLen = db.architectures.length;
    db.architectures = db.architectures.filter((a) => !(a.id === id && a.user_id === userId));
    db.revisions = db.revisions.filter((r) => r.architecture_id !== id);
    saveLocalDb(db);
    return db.architectures.length < initialLen;
  }
}
```
2. Modify `updateArchitecture` to check ownership:
```javascript
// Check existing architecture owner before applying update
if (pool) {
  const current = await pool.query('SELECT user_id, version, nodes_json, edges_json, chaos_json FROM architectures WHERE id = $1', [id]);
  if (!current.rows[0] || current.rows[0].user_id !== userId) return null;
  // proceed with UPDATE ... WHERE id = $1 AND user_id = $2
} else {
  const db = loadLocalDb();
  const idx = db.architectures.findIndex((a) => a.id === id && a.user_id === userId);
  if (idx === -1) return null;
  // proceed with update
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test server/tests/tenantIsolation.test.mjs`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add server/db/postgres.mjs server/tests/tenantIsolation.test.mjs
git commit -m "fix(security): resolve IDOR by enforcing user_id ownership on architecture mutations"
```

---

### Task 3: WebSocket Relay Heartbeat & Memory Eviction

**Files:**
- Modify: `server/collabServer.mjs:1-163`
- Test: `server/tests/collabServer.test.mjs`

**Interfaces:**
- Consumes: `WebSocketServer` from `ws`
- Produces: `isAlive` socket heartbeat mechanism with 30s interval
- Produces: Timed room eviction `scheduleRoomEviction(roomName, timeoutMs)`

- [ ] **Step 1: Write the failing test for room lifecycle & heartbeat**

Create `server/tests/collabServer.test.mjs`:
```javascript
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { WebSocket } from 'ws';

describe('Collaboration Relay Socket & Memory Management', () => {
  test('Relay responds to ping with pong and assigns room correctly', async () => {
    const ws = new WebSocket('ws://localhost:1234/test-lifecycle-room');
    await new Promise((resolve) => ws.on('open', resolve));

    let receivedPong = false;
    ws.on('pong', () => { receivedPong = true; });
    ws.ping();

    await new Promise((resolve) => setTimeout(resolve, 300));
    assert.equal(receivedPong, true);
    ws.close();
  });
});
```

- [ ] **Step 2: Run test to verify behavior**

Run: `node --test server/tests/collabServer.test.mjs`

- [ ] **Step 3: Implement ping/pong heartbeat and idle room cleanup in `server/collabServer.mjs`**

1. Add ping interval loop:
```javascript
const heartbeatInterval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (!ws.isAlive) {
      console.log('[CollabServer] Terminating zombie socket');
      return ws.terminate();
    }
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

wss.on('close', () => clearInterval(heartbeatInterval));
```
2. Initialize `conn.isAlive = true` on connect and `conn.on('pong', () => { conn.isAlive = true; })`.
3. Add idle room eviction map `roomEvictionTimers = new Map()`:
```javascript
conn.on('close', () => {
  room.conns.delete(conn);
  console.log(`[CollabServer] Client disconnected from '${roomName}'. Remaining: ${room.conns.size}`);

  if (room.conns.size === 0) {
    const timer = setTimeout(() => {
      const activeRoom = rooms.get(roomName);
      if (activeRoom && activeRoom.conns.size === 0) {
        console.log(`[CollabServer] Evicting inactive room '${roomName}' from memory`);
        activeRoom.doc.destroy();
        rooms.delete(roomName);
        roomEvictionTimers.delete(roomName);
      }
    }, 180000); // 3 minutes idle grace period
    roomEvictionTimers.set(roomName, timer);
  }
});
```
4. If a client connects to an existing room scheduled for eviction, cancel the timer:
```javascript
if (roomEvictionTimers.has(roomName)) {
  clearTimeout(roomEvictionTimers.get(roomName));
  roomEvictionTimers.delete(roomName);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test server/tests/collabServer.test.mjs`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add server/collabServer.mjs server/tests/collabServer.test.mjs
git commit -m "fix(collab): add websocket ping-pong heartbeat and idle room memory eviction"
```

---

### Task 4: Simulation Store Render Churn & Granular Reconciliation

**Files:**
- Modify: `src/store/usePlaygroundStore.ts:213-284`
- Test: `npm run lint`

**Interfaces:**
- Consumes: `WorkerSimulationOutput` from `simulationWorker`
- Produces: Optimized Zustand dispatch that minimizes unnecessary object mutations

- [ ] **Step 1: Inspect performance hotspot in `usePlaygroundStore.ts`**

Review lines 224-250: on every worker message (every 100ms-1000ms), `nodes.map(...)` and `edges.map(...)` create brand new node and edge object instances even when dynamic metrics have not materially changed, causing React Flow to re-layout SVG edge paths.

- [ ] **Step 2: Implement memoized state updating for nodes and edges**

Update the message handler in `src/store/usePlaygroundStore.ts`:
1. Check if node metric values (`currentRps`, `currentQueue`, `currentLatency`, `utilizationPercent`, `status`, `isBottleneck`) actually changed before returning a new node object reference.
2. For edges, only construct a new edge object if `currentFlowRps`, `latencyMs`, or `errorRatePercent` differ from current edge data.
3. If no nodes or edges changed, reuse previous `nodes` and `edges` array references to prevent component tree re-rendering.

```typescript
let nodesChanged = false;
const nextNodes = get().nodes.map((node) => {
  const update = updatedNodes.find((un) => un.id === node.id);
  if (!update || !update.data) return node;

  const d = node.data;
  const u = update.data;
  const isDifferent =
    d.currentRps !== u.currentRps ||
    d.currentQueue !== u.currentQueue ||
    d.currentLatency !== u.currentLatency ||
    d.status !== u.status ||
    d.utilizationPercent !== u.utilizationPercent ||
    d.isBottleneck !== u.isBottleneck ||
    d.circuitBreakerState !== u.circuitBreakerState;

  if (isDifferent) {
    nodesChanged = true;
    return { ...node, data: { ...node.data, ...u } };
  }
  return node;
});
```

- [ ] **Step 3: Run TypeScript lint & build to verify type safety**

Run: `npm run lint`
Expected: PASS with 0 type errors.

- [ ] **Step 4: Commit**

```bash
git add src/store/usePlaygroundStore.ts
git commit -m "perf(store): optimize simulation worker state reconciliation to eliminate render churn"
```

---

### Task 5: Asynchronous Non-Blocking Local DB I/O

**Files:**
- Modify: `server/db/postgres.mjs:39-42`
- Test: `server/tests/tenantIsolation.test.mjs`

**Interfaces:**
- Consumes: `fs.promises.writeFile`
- Produces: Debounced / non-blocking `saveLocalDbAsync(data)`

- [ ] **Step 1: Replace synchronous `fs.writeFileSync` in `server/db/postgres.mjs`**

Implement debounced or atomic async saving for local file operations:
```javascript
let isSaving = false;
let pendingDbData = null;

export async function saveLocalDb(data) {
  pendingDbData = data;
  if (isSaving) return;

  isSaving = true;
  try {
    while (pendingDbData) {
      const toWrite = pendingDbData;
      pendingDbData = null;
      await fs.promises.writeFile(LOCAL_DB_PATH, JSON.stringify(toWrite, null, 2), 'utf-8');
    }
  } catch (err) {
    console.error('[DB] Asynchronous local save error:', err);
  } finally {
    isSaving = false;
  }
}
```

- [ ] **Step 2: Run all backend tests to verify persistence integrity**

Run: `node --test server/tests/*.test.mjs`
Expected: All tests PASS.

- [ ] **Step 3: Commit**

```bash
git add server/db/postgres.mjs
git commit -m "perf(db): make local JSON store writes asynchronous and non-blocking"
```

---

### Task 6: Full Verification & Pre-Launch Health Audit

**Files:**
- Verify: `npm run lint`
- Verify: `npm run build`
- Verify: `node --test server/tests/*.test.mjs`

- [ ] **Step 1: Execute test suite**

Run: `node --test server/tests/*.test.mjs`
Expected: PASS.

- [ ] **Step 2: Execute frontend build**

Run: `npm run build`
Expected: AssemblyScript WASM compilation succeeded, TypeScript passed, Vite bundle generated.

- [ ] **Step 3: Final Commit and Launch Tag**

```bash
git add .
git commit -m "chore(release): pre-launch architecture hardening verified"
```
