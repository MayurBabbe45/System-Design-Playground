<div align="center">

# ⚡ System Design Playground

### Interactive Architecture Simulator & Real-Time Queueing Engine

An open-source, web-based system architecture canvas and traffic simulator. Model distributed architectures, simulate real-world request traffic using Kendall $M/M/c/K$ queueing models, run Chaos Engineering drills, audit Single Points of Failure (SPOF), and forecast multi-cloud infrastructure bills—all in real time right in your browser.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)
[![React](https://img.shields.io/badge/React-18.3-61dafb?style=flat-square&logo=react&logoColor=black)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178c6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.x-646cff?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS v4](https://img.shields.io/badge/TailwindCSS-4.x-38bdf8?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![React Flow](https://img.shields.io/badge/@xyflow/react-12.x-ff0072?style=flat-square)](https://reactflow.dev/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](https://github.com/MayurBabbe45/System-Design-Playground/pulls)

</div>

---

## 🌟 Key Features

### 🎨 Visual Architecture Canvas
- **n8n-Inspired Design System**: Spacious, high-contrast dark slate nodes, status pill indicators, and custom connection ports.
- **Rich Component Catalog**: Clients/Traffic Generators, API Gateways, Load Balancers, Web Servers/Microservices, Redis Caches, PostgreSQL Databases, Kafka Message Queues, and CloudFront CDNs.
- **Topological Edge Routing**: Dynamic orthogonal edge paths with drag-and-drop handles and connection validations.

### ⚡ Discrete-Event Queueing Simulation (DES)
- **Web Worker Engine**: Simulations execute in a dedicated background thread (`simulationWorker.ts`) to maintain 60 FPS canvas rendering.
- **Mathematical Queue Modeling**:
  - **Kendall $M/M/c/K$ Formulation**: Finite-capacity multi-server queue calculations with Erlang C delay probability.
  - **Jackson Networks**: Solves multi-hop routing, split-traffic branches, and cache hit forwarding $(1 - \text{hitRate})$.
  - **Little's Law ($L = \lambda W$)**: Computes steady-state queue depth, average wait time, and server saturation.
- **Selectable Traffic Profiles**:
  - **Constant Steady**: Predictable uniform RPS rate.
  - **Poisson Stochastic**: Realistic exponential inter-arrival distribution.
  - **Flash Sale Spike**: Periodic 5x traffic surges for burst stress testing.
  - **Diurnal 24h**: Sinusoidal daytime/nighttime natural consumer cycles.

### 🌊 Dynamic Animated Flow Edges
- **Real-Time SVG Particles**: Particle frequency and travel speed dynamically scale with calculated request volume (RPS).
- **Visual Error Saturation**: Flow edge particles smoothly shift from green to amber and neon-crimson as downstream nodes drop requests.

### 🔥 Chaos Engineering Suite
- **Multi-AZ Blackout Drills**: Assign components to `us-east-1a`, `us-east-1b`, or `us-east-1c`. Trigger 1-click zone blackouts to verify failover routing.
- **Global Network Degradation**: Inject global WAN network lag (+0ms to +500ms) and random packet drop rates (0% to 50%).
- **Circuit Breaker Fast-Failure**: Load Balancers and Gateways trip to `OPEN` state upon downstream node failure, shedding traffic to prevent cascading worker exhaustion.

### 🛡️ Architecture Health Linter & SPOF Auditor
- **Deterministic Heuristic Rules**:
  - **Rule 1 (SPOF - Database)**: Flags solitary databases without standby replicas.
  - **Rule 2 (SPOF - Compute)**: Detects unscaled web servers/microservices running a single instance.
  - **Rule 3 (Unbacked Load Balancers)**: Identifies load balancers with only 1 backend target.
  - **Rule 4 (Uncached Relational Reads)**: Flags high-read databases missing an in-memory Redis cache.
  - **Rule 5 (Unbuffered Ingestion)**: Catches high-throughput endpoints directly hitting disk storage without a message queue.
- **Resilience Score & 1-Click Auto-Fix**: Generates an overall Letter Grade (`A`, `B`, `C`, `F`) with instant one-click remediation actions that scale nodes directly on the canvas.

### 💰 Multi-Cloud Cost Estimator
- **Itemized Cloud Bill**: Compares monthly costs across **AWS** (`t4g.xlarge`, `db.r6g.xlarge`, `cache.r6g.large`) and **GCP** (`e2-standard-4`, Cloud SQL, Memorystore).
- **Commitment Forecasting**: 1-Year Reserved Instance (RI) discount calculations (~35% savings).
- **Export to CSV**: One-click download of itemized architecture pricing.

### 🔗 Stateless Sharing & Architecture Presets
- **Zero-Backend URL Hash Sharing**: Compresses complete canvas graph topologies into URL fragments via `lz-string` (`#data=...`).
- **Full JSON Import/Export**: Save and restore complete architectural designs with one click.
- **Production Presets**: Preloaded blueprints including **Flash Sale E-Commerce Pipeline**, **Microservices Mesh**, and **CQRS Event Sourcing**.

---

## 📐 Queueing Theory & Mathematical Foundation

The simulation engine calculates system behavior using established operations research and queueing equations:

1. **Traffic Intensity & Utilization ($\rho$)**:
   $$\rho = \frac{\lambda}{c \cdot \mu}$$
   *Where $\lambda$ = arrival rate (RPS), $c$ = server instances, $\mu$ = processing rate per instance.*

2. **Erlang C Delay Probability ($P_q$)**:
   $$P_q = \frac{\frac{(c\rho)^c}{c!(1-\rho)}}{\sum_{k=0}^{c-1} \frac{(c\rho)^k}{k!} + \frac{(c\rho)^c}{c!(1-\rho)}}$$

3. **Total Latency ($W$)**:
   $$W_q = \frac{P_q}{c\mu - \lambda}, \quad W = W_q + \frac{1}{\mu} + \text{WAN Latency}$$

4. **Little's Law (Queue Depth $L_q$)**:
   $$L_q = \lambda \cdot W_q$$

5. **Finite Capacity Drops ($M/M/c/K$)**:
   If queue capacity $K$ is saturated, excess incoming arrivals are dropped at rate $R_{\text{drop}} = \lambda \cdot P_{\text{block}}$.

---

## 🛠️ Tech Stack

- **Frontend**: [React 18](https://reactjs.org/), [TypeScript 5](https://www.typescriptlang.org/), [Vite 6](https://vitejs.dev/)
- **Canvas / Flow**: [@xyflow/react](https://reactflow.dev/) (React Flow v12)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) with custom `@tailwindcss/vite`
- **State Management**: [Zustand](https://github.com/pmndrs/zustand) with custom state hooks
- **Simulation**: Native Web Worker (`Worker` API) with Kendall $M/M/c/K$ solver
- **Charts / Telemetry**: [Recharts](https://recharts.org/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Compression**: [lz-string](https://github.com/pieroxy/lz-string)

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher (or pnpm / yarn)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/MayurBabbe45/System-Design-Playground.git
   cd System-Design-Playground
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run development server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

4. **Build for production**:
   ```bash
   npm run build
   ```
   The optimized production bundle will be output to the `dist/` directory.

---

## ⌨️ Keyboard Shortcuts & Canvas Controls

| Shortcut / Action | Description |
| :--- | :--- |
| **Backspace / Delete** | Remove selected node or edge connection |
| **Space + Click & Drag** | Pan canvas freely |
| **Scroll Wheel** | Zoom in / out of canvas |
| **Click Node** | Open deep component inspector in right drawer |
| **Fit View** | Automatically center and frame active architecture |
| **Reset Chaos** | Restore all offline nodes and reset latency to 0 |

---

## 📁 Project Structure

```text
SYSTEM DESIGN PLAYGROUND/
├── .planning/                  # GSD planning, requirements & milestones
├── src/
│   ├── components/
│   │   ├── edges/
│   │   │   └── FlowEdge.tsx            # Animated SVG particle flow edge
│   │   ├── modals/
│   │   │   ├── CloudCostModal.tsx       # AWS vs GCP monthly cost breakdown
│   │   │   ├── ExportModal.tsx          # URL sharing, JSON & PNG export
│   │   │   └── HealthAuditModal.tsx     # SPOF & resilience rule audit modal
│   │   ├── nodes/
│   │   │   └── InfrastructureNode.tsx  # Sleek n8n-style custom node component
│   │   ├── Canvas.tsx                  # React Flow interactive canvas wrapper
│   │   ├── ChaosControlCenter.tsx      # Multi-AZ blackout & latency controls
│   │   ├── Header.tsx                  # Top navigation, metrics, and presets
│   │   ├── Inspector.tsx               # Node configuration drawer (Cache, DB, LB)
│   │   ├── Sidebar.tsx                 # Left component palette & drag source
│   │   └── TelemetryDrawer.tsx         # Bottom real-time Recharts telemetry graphs
│   ├── config/
│   │   ├── components.ts               # Infrastructure node definitions & pricing
│   │   └── presets.ts                  # Production architectural templates
│   ├── simulation/
│   │   ├── architectureLinter.ts       # Deterministic rule-based SPOF analyzer
│   │   └── queueTheory.ts              # Mathematical queue equations & Erlang C
│   ├── store/
│   │   └── usePlaygroundStore.ts       # Central Zustand application state
│   ├── types/
│   │   └── playground.ts               # Strict TypeScript interface contracts
│   ├── workers/
│   │   └── simulationWorker.ts         # High-speed DES background Web Worker
│   ├── App.tsx                         # Core application shell
│   ├── index.css                       # Tailwind CSS v4 design tokens
│   └── main.tsx                        # React application entry point
├── .gitignore                          # Production Git ignore patterns
├── package.json                        # Dependencies & build scripts
├── tsconfig.json                       # Strict TypeScript configuration
└── vite.config.ts                      # Vite configuration with Tailwind plugin
```

---

## 🤝 Contributing

Contributions are welcome! Whether it's adding new infrastructure components (e.g., Elasticsearch, S3, gRPC microservices), implementing WASM solvers, or enhancing chaos experiments:

1. Fork the repository.
2. Create your feature branch (`git checkout -b feature/amazing-feature`).
3. Commit your changes (`git commit -m "feat: add amazing feature"`).
4. Push to the branch (`git push origin feature/amazing-feature`).
5. Open a Pull Request.

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.

---

<div align="center">
Built with ❤️ for software engineers, systems architects, and system design interview preparation.
</div>
