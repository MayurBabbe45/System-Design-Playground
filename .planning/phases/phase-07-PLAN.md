# Phase 7 Plan: PostgreSQL + Express API Backend for Authenticated Saves & ClickHouse Telemetry Logging

## Objective
Deliver a production-grade full-stack persistence layer for the **System Design Playground**:
1. **Express.js API Backend**: RESTful architecture CRUD, versioning, forking, and session-based / token authentication.
2. **PostgreSQL Relational Persistence**: Production schema for users, architectures, version revisions, tags, and fork histories (with standard `pg` connection pool and fallback local SQL engine for zero-setup developer experience).
3. **ClickHouse High-Throughput Columnar Telemetry Logger**: High-frequency time-series simulation metrics ingestion (`/api/telemetry/ingest`) and analytical rollup queries (`/api/telemetry/analytics`) computing aggregate latency percentiles (p50, p90, p99), saturation rates, and bottleneck timelines.
4. **Cloud Architecture Library & Analytics UI**: Cloud save modal, user architecture browser with thumbnail previews, 1-click cloud sync, and historical ClickHouse telemetry graphs.

---

## Target Deliverables

### 1. Express API Server & Routing (`server/apiServer.mjs`)
- Express HTTP server running on port `4000`, proxied via Vite dev server (`/api/*`).
- **Endpoints**:
  - `POST /api/auth/login` & `POST /api/auth/register` & `GET /api/auth/me`: User authentication and session token handling.
  - `GET /api/architectures`: List architectures for current user or public gallery.
  - `POST /api/architectures`: Save active diagram (nodes, edges, chaos state, cost, resilience grade, description).
  - `GET /api/architectures/:id`: Fetch specific architecture.
  - `PUT /api/architectures/:id`: Update existing architecture with new revision.
  - `DELETE /api/architectures/:id`: Delete saved architecture.
  - `POST /api/architectures/:id/fork`: Fork an architecture into a new copy.
  - `POST /api/telemetry/ingest`: Batch ingest time-series simulation telemetry.
  - `GET /api/telemetry/analytics/:archId`: Aggregate latency percentiles, throughput, and bottleneck history.

### 2. PostgreSQL Storage Engine (`server/db/postgres.mjs`)
- Relational schema:
  - `users`: `id`, `email`, `name`, `avatar`, `created_at`
  - `architectures`: `id`, `user_id`, `name`, `description`, `nodes_json`, `edges_json`, `chaos_json`, `grade`, `monthly_cost`, `is_public`, `version`, `fork_of_id`, `created_at`, `updated_at`
  - `architecture_revisions`: Historical version checkpoints for undo/rollback.
- Dual-mode driver:
  - Connects to native PostgreSQL when `DATABASE_URL` is set.
  - Seamlessly falls back to an embedded SQLite / file-backed SQL relational store when offline or in dev mode, ensuring zero setup hurdles.

### 3. ClickHouse Time-Series Telemetry Engine (`server/db/clickhouse.mjs`)
- Column-oriented telemetry schema:
  - `telemetry_ticks`: `timestamp`, `architecture_id`, `session_id`, `rps`, `p95_latency_ms`, `queue_depth`, `error_rate`, `bottleneck_node`, `engine_mode`
- Batch ingestion: simulation worker metrics buffer batches records and posts every 2 seconds.
- Analytics endpoints computing time-windowed aggregates:
  - Throughput peaks and troughs
  - p50, p95, p99 latency distributions
  - Total requests processed and aggregate drop counts

### 4. Client Cloud Library & Telemetry Analytics Drawer
- **Cloud Library Modal (`src/components/modals/CloudLibraryModal.tsx`)**:
  - Browse saved architectures with instant load, delete, and fork buttons.
  - 1-click "Save to Cloud" button with version notes.
  - Toggle Public / Private visibility.
- **Header Integration**:
  - Cloud Save button with dirty-state indicator.
  - Architecture Library button (`📂 Cloud Saves`).
  - User profile avatar / auth status indicator.
- **Historical Telemetry Analytics View**:
  - Toggle between live simulation and historical ClickHouse time-series rollup in `TelemetryDrawer.tsx`.

---

## Verification Criteria
1. `npm run server:api` launches Express API and database engine cleanly.
2. Architecture can be saved to the backend, retrieved, updated, and deleted via API.
3. Loading a saved architecture restores exact canvas nodes, edges, and configurations.
4. Telemetry batches stream to `/api/telemetry/ingest` and `/api/telemetry/analytics` returns accurate aggregated percentiles.
5. Frontend compiles cleanly with `npm run build` with zero TypeScript or bundling errors.
