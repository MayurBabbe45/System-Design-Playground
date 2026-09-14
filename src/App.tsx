import React from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Canvas } from './components/Canvas';
import { Inspector } from './components/Inspector';
import { TelemetryDrawer } from './components/TelemetryDrawer';
import { ChaosControlCenter } from './components/ChaosControlCenter';
import { CloudCostModal } from './components/modals/CloudCostModal';
import { HealthAuditModal } from './components/modals/HealthAuditModal';
import { ExportModal } from './components/modals/ExportModal';

export const App: React.FC = () => {
  return (
    <div className="flex flex-col h-screen w-screen bg-[#0e1117] overflow-hidden text-neutral-100 antialiased font-sans">
      {/* Top Header */}
      <Header />

      {/* Main Workspace Layout */}
      <div className="flex flex-1 relative overflow-hidden">
        {/* Left Drag & Drop Component Palette */}
        <Sidebar />

        {/* Center Interactive Infinite Canvas */}
        <Canvas />

        {/* Floating Chaos Control Center */}
        <ChaosControlCenter />

        {/* Right Contextual Properties Inspector */}
        <Inspector />

        {/* Bottom Real-time Telemetry Drawer */}
        <TelemetryDrawer />
      </div>

      {/* Modals */}
      <CloudCostModal />
      <HealthAuditModal />
      <ExportModal />
    </div>
  );
};

export default App;
