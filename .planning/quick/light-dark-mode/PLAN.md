# Quick Task Plan: Light and Dark Mode System

## Goal
Implement a persistent Light and Dark theme toggle across the entire System Design Playground using CSS design tokens, Zustand state, and React Flow `colorMode`.

## Deliverables
1. Theme state & persistence in `usePlaygroundStore.ts` (`localStorage` key: `spd_theme`).
2. CSS Variables in `src/index.css` supporting `:root` (dark default) and `[data-theme="light"]`.
3. Sun/Moon theme toggle button in `src/components/Header.tsx`.
4. Canvas React Flow `colorMode` adaptation in `src/components/Canvas.tsx`.
5. High-contrast light styling for `InfrastructureNode.tsx`, `Sidebar.tsx`, `Inspector.tsx`, and `TelemetryDrawer.tsx`.
6. Verification via `npm run build` and interactive browser testing.
