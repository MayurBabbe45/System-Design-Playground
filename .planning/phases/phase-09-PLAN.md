# Phase 9 Plan: n8n-Style Home Dashboard & Projects Workspace

## Objective
Deliver an n8n-inspired home dashboard that acts as the command center for the **System Design Playground**:
1. Provide a professional workspace navigation rail with workspaces, templates, and account controls.
2. Present a high-level statistics summary strip (total projects, monthly cloud spend, simulated node count, telemetry status).
3. Display a starter architecture templates shelf with 1-click instantiate cards.
4. Render a searchable, filterable grid of the user's saved architecture projects with metadata pills (cost, health grade, node count).
5. Build an interactive **"Create New Project"** modal supporting blank canvases and preset starting topologies.

---

## Deliverables

### 1. Main Dashboard View (`src/components/dashboard/DashboardView.tsx`)
- **Left Navigation Rail**:
  - Workspace selector ("Personal Workspace" / "Team Cloud").
  - Navigation links: "Projects / Architectures" (active), "Templates", "Settings", "Docs".
  - Bottom user pill: Avatar, user name, Light/Dark mode toggle, and Sign Out button.
- **Top Control Bar**:
  - Search input with instant client-side query filtering.
  - Sort dropdown: Last Updated, Alphabetical, Monthly Cost.
  - Primary Action Button: **`+ New Project`** (with glowing primary CTA accent).
- **System Overview Stats Strip**:
  - Four status cards: Total Projects, Total Estimated Monthly Spend, Average Health Grade, Telemetry Status.
- **Starter Templates Shelf**:
  - Quick-start architecture cards: "Blank Canvas", "Flash Sale E-Commerce", "Microservices Service Mesh", "Event-Driven CQRS", "Multi-Region Cloud".
- **Projects Grid / List**:
  - Interactive project cards showing Title, Description, Node count, Monthly cost pill (`$X/mo`), Resilience grade badge (`Grade A`), and Last modified date.
  - Context menu / action buttons: **Open in Canvas**, **Fork / Duplicate**, **Rename**, and **Delete**.

### 2. Create Project Modal (`src/components/modals/CreateProjectModal.tsx`)
- Dialog allowing user to enter Project Name, Description, and select a starter template or blank canvas.
- Instant submission via `/api/architectures`, redirecting straight into the interactive simulation canvas.

---

## Verification Criteria
1. Dashboard displays all saved projects belonging to the logged-in user or guest.
2. Search and sorting correctly filter the displayed project cards.
3. Clicking "+ New Project" opens the modal, creates the project, and launches it into the canvas.
4. Templates shelf instantly instantiates pre-configured system designs.
