# Phase 4 Plan: Stateless URL Sharing, Architecture Health Linter & Advanced Presets

## Objective
Implement Phase 4 without an external AI judge model. Focus on:
1. **Deterministic Architecture Health Linter & SPOF Rule Checker** (evaluates graph topology against established system design best practices: SPOF detection, cache placement, DB replication, queue buffering).
2. **Architecture Export Suite** (1-click LZ-String compressed URL sharing, JSON schema export/import, and PNG diagram snapshot).
3. **Rich Production Presets** (Flash Sale E-Commerce, CQRS Event Sourcing, Multi-Region Active-Passive).
4. **Keyboard Shortcuts & Visual Polish** (Fit view, delete node shortcut, clean responsive layout).

## Target Deliverables

### 1. Architecture Health Linter (Rule-Based SPOF Analyzer)
- Pure deterministic heuristic engine running in browser:
  - **Rule 1 (Single Point of Failure - DB)**: Flag database nodes with only 1 instance and no read replica or standby.
  - **Rule 2 (Single Point of Failure - Compute)**: Flag web server / microservice nodes with 1 instance.
  - **Rule 3 (Missing Load Balancer Redundancy)**: Flag load balancers routing to only 1 backend target.
  - **Rule 4 (Uncached Relational Reads)**: Flag primary databases queried directly without an in-memory cache (Redis) when read load exceeds 70%.
  - **Rule 5 (Unbuffered Heavy Ingestion)**: Flag high-throughput API endpoints directly writing to disk without an async message queue (Kafka).
  - **System Health Grade**: Calculates overall architecture score (A: 90-100%, B: 75-89%, C: 60-74%, F: <60%).
- Interactive **"Architecture Health Audit"** modal/drawer showing passed rules, warnings, critical vulnerabilities, and 1-click remediation actions.

### 2. Export & Sharing Suite
- **Stateless URL Hash Sharing**: Improved feedback toast, short link generation, and auto-load on URL paste.
- **JSON Architecture Export & Import**: Download architecture file (`.json`) or upload to restore canvas.
- **PNG Diagram Snapshot**: Render and export the visual canvas topology as a PNG image.

### 3. Expanded Production Presets
- Add 2 production-grade presets to `PRESET_ARCHITECTURES`:
  - **Flash Sale E-Commerce Pipeline**: Traffic Surge -> Edge CDN -> API Gateway -> Load Balancer -> Auto-scaled Workers -> Kafka Buffer -> Redis + Postgres Primary/Replica.
  - **CQRS & Event Sourcing**: Client -> Command API -> Kafka Event Store -> Materialized View Workers -> Read Cache -> Read Database.

### 4. Canvas Usability & Shortcuts
- Keyboard shortcuts: `Backspace` / `Delete` to remove selected node/edge, `Space + Drag` pan, `Ctrl/Cmd + S` to share.
- Quick "Fit View" and "Auto Re-center" canvas actions.

## Verification Criteria
- Architecture Linter accurately detects single points of failure on the canvas and awards an appropriate resilience grade.
- 1-click URL sharing and JSON export/import function seamlessly.
- New production presets load with clean layouts and valid topological connections.
- `npm run build` compiles with zero errors.
