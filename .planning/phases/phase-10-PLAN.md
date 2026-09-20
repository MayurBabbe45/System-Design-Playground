# Phase 10 Plan: Canvas Project Integration, Breadcrumb Navigation & Auto-Sync

## Objective
Seamlessly bridge the Home Dashboard and the Canvas Playground with n8n-style routing, project breadcrumbs, and real-time persistence:
1. Orchestrate top-level app view switching between Auth, Dashboard, and Playground canvas.
2. Synchronize active state with URL query parameters (`?view=dashboard`, `?project=<id>`) to support browser Back/Forward navigation and deep linking.
3. Replace the static Playground header with an n8n-inspired breadcrumb bar (`← Projects / Project Name ✏️ / Sync Status`).
4. Implement automatic project synchronization and revision updates back to the backend.

---

## Deliverables

### 1. Top-Level App View Routing (`src/App.tsx`)
- Define view states: `'auth' | 'dashboard' | 'playground'`.
- If unauthenticated and not in guest mode $\rightarrow$ display `<AuthScreen />`.
- If in dashboard view $\rightarrow$ display `<DashboardView />`.
- If in playground view $\rightarrow$ display full interactive canvas simulation workspace.
- Sync active view and project ID with URL parameters for page reload persistence.

### 2. Header Breadcrumb Navigation (`src/components/Header.tsx`)
- Breadcrumb navigation replacing static title:
  - **`[← Projects]`** button returning to Dashboard with smooth zero-reload transition.
  - **`[Project Name ✏️]`** editable breadcrumb with inline rename capability.
  - **`[Auto-Saved / Unsaved Changes]`** sync status pill.
- User menu dropdown in the utility rail with Profile info, Theme switch, and Logout.

### 3. Active Project Lifecycle & Store Sync (`src/store/usePlaygroundStore.ts`)
- Track `activeProject: { id: string; name: string; description?: string } | null`.
- Action `openProject(id: string)`: fetches architecture from `/api/architectures/:id`, populates nodes, edges, chaos state, and switches view to `'playground'`.
- Action `returnToDashboard()`: commits pending state to backend and switches view to `'dashboard'`.
- Debounced auto-save hook to commit revisions to `/api/architectures/:id`.

---

## Verification Criteria
1. Switching between Dashboard and Playground maintains exact project canvas state.
2. Clicking `← Projects` in the canvas header smoothly navigates back to the Dashboard.
3. Refreshing the browser when on a project (`?project=<id>`) re-opens that exact project in the canvas.
4. Inline renaming updates the project title both in the canvas header and on the backend.
5. Zero regressions on WebAssembly discrete-event simulation, chaos engineering, and collaboration.
