# System Design Playground - Architectural Improvements Analysis

## Overview
This document contains a comprehensive architectural analysis and improvement recommendations for the System Design Playground project.

## Project Summary
- **Type**: Web-based system architecture canvas and traffic simulator
- **Tech Stack**: React 18 + TypeScript 5 + Vite 6 + Tailwind CSS v4 + Zustand + React Flow + Yjs CRDT + Web Worker + WebAssembly
- **Key Features**: Visual architecture canvas, queueing simulation (M/M/c/K), chaos engineering, SPOF auditing, multi-cloud cost estimation, stateless sharing

## Priority 1: Store Modularization

### Problem
`src/store/usePlaygroundStore.ts` is ~1,300 lines with 100+ actions, state slices, and Web Worker listeners. This violates Single Responsibility Principle and makes maintenance difficult.

### Recommendation: Split Store into Modules
- `src/store/useSimulationStore.ts` - simulation controls + telemetry
- `src/store/useCanvasStore.ts` - canvas state (nodes, edges, history)
- `src/store/useAuthStore.ts` - already separate (good!)
- `src/store/useCollabStore.ts` - collaboration state
- `src/store/usePresetStore.ts` - presets & import/export
- `src/store/useStore.ts` - compose all stores

**Benefits:**
- Smaller bundle sizes (code splitting)
- Better separation of concerns
- Easier unit testing
- Faster rebuilds during development

## Priority 2: Simulation Engine Enhancements

### 1. WASM Initialization Latency
- Add WASM load progress indication
- Show loading state while WASM initializes

### 2. Enhanced Linter Rules
Add new rules:
- **Cost optimization**: suggest instance count adjustments
- **Dependency cycle detection**
- **Network latency impact analysis**
- **Auto-scaling recommendations** based on traffic patterns

### 3. Improved Bottleneck Detection
- Flag nodes approaching capacity (ρ > 0.70) with warning
- Suggest specific instance count increases
- Consider AZ distribution impact

### 4. Simulation Config Validation
- Validate traffic generator capacity vs. downstream capacity
- Warn about unbalanced architectures before simulation starts

## Priority 3: Type Safety & Component Patterns

### Type Improvements
1. **Partial InfrastructureNodeData Usage** - Ensure type safety when spreading node.data
2. **EdgeData Typing Inconsistencies** - Make EdgeStreamData usage consistent
3. **Event Handler Types** - Extract inline types to reusable types

### Component Pattern Improvements
- **InfrastructureNode**: Add onNodeDelete, onNodeDuplicate props; support custom render props; add ARIA labels
- **FlowEdge**: Add onEdgeDelete prop; support custom particle colors/speeds; add edge labeling modes
- **Canvas**: Extract keyboard shortcut logic to reusable hook; add readOnly mode prop; add zoom/pan boundary limits

## Priority 4: Backend API & Database

### API Server Improvements
1. **Request Validation** - Add Zod/Yup schemas for architecture nodes/edges
2. **Error Handling** - Categorize errors (validation vs server); add request ID tracking
3. **Authentication Security** - Move JWT secret to environment variable; add rate limiting on all endpoints; implement token rotation/refresh strategy
4. **Database Optimization** - Add connection pooling; add query performance monitoring
5. **API Versioning** - Add version prefix to all routes (/api/v1/); implement deprecation strategy

## Priority 5: Testing & Quality Assurance

### Missing Testing Infrastructure
**No test files found** in the project. Critical gaps:

**1. Unit Tests Needed**
- `src/simulation/queueTheory.ts` - M/M/c/K solver accuracy
- `src/simulation/architectureLinter.ts` - Rule correctness
- `src/simulation/queueTheory.ts` - Edge cases (zero rate, infinite capacity)
- `src/store/usePlaygroundStore.ts` - state management actions

**2. Integration Tests**
- API endpoint responses
- Web Worker message passing
- URL hash load/export roundtrip
- Collaboration CRDT sync

**3. Linting & Type Checking**
- `npm run lint` runs `tsc --noEmit` - good
- Review ESLint configuration
- Add Prettier for consistency
- Verify TypeScript strict mode

**4. CI/CD Pipeline**
- Add GitHub Actions workflow
- Build + test + lint pipeline
- Deployment automation

## Priority 6: Collaboration & Real-Time Features

### Yjs CRDT Enhancements
- Add custom awareness field for user roles (viewer vs editor)
- Implement local operation queue for offline editing
- Add "room versioning" for session recovery
- Add user presence dots/indicators in UI

## Priority 7: Accessibility & UX

### Accessibility Gaps
1. **Keyboard Navigation** - Focus management could be better; add focus trap modals; add skip links
2. **Screen Readers** - Nodes/edges lack proper ARIA labels; color-dependent information needs text alternatives
3. **Visual Hierarchy** - Button sizes and contrast could be improved; focus outlines inconsistent
4. **Responsiveness** - Canvas layout fixed for desktop; missing mobile/touch support; sidebar collapse for narrow screens

## Recommended Implementation Roadmap

### Phase 1: Foundation (2-3 weeks)
- [ ] Split Zustand store into modular stores
- [ ] Add Zod schemas for API validation
- [ ] Add unit tests for queue theory and linter
- [ ] Fix JWT secret to use environment variable
- [ ] Add ESLint config with relevant rules

### Phase 2: Simulation Enhancements (3-4 weeks)
- [ ] Add WASM load progress indication
- [ ] Enhance linter with 3 new rules (cost optimization, dependency cycles, auto-scaling)
- [ ] Improve bottleneck detection with recommendations
- [ ] Add simulation config validation

### Phase 3: Collaboration & Testing (3-4 weeks)
- [ ] Add unit tests for all components
- [ ] Implement integration test suite
- [ ] Set up CI/CD pipeline
- [ ] Enhance Yjs CRDT with presence and offline support
- [ ] Add API versioning

### Phase 4: Polish & Accessibility (2-3 weeks)
- [ ] Accessibility audit and fixes
- [ ] Responsive design improvements
- [ ] Documentation updates
- [ ] Changelog and release process

## Quick Wins (Can Implement Immediately)

1. **Move JWT secret to environment variable** - security fix, 5 min
2. **Add Zod schema validation** to API routes - prevents malformed data, 2 hours
3. **Split the monolithic store** into 3-4 modules - immediate maintainability improvement
4. **Add unit tests for queue theory** - catches regressions, 4-5 hours
5. **Add linter rule for cost optimization** - immediate value add, 2 hours
6. **Add loading state for WASM** - improves UX during cold start

---
*Generated from comprehensive codebase analysis on October 2026*