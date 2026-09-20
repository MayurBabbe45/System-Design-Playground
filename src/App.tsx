import React, { useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Canvas } from './components/Canvas';
import { Inspector } from './components/Inspector';
import { TelemetryDrawer } from './components/TelemetryDrawer';
import { ChaosControlCenter } from './components/ChaosControlCenter';
import { CloudCostModal } from './components/modals/CloudCostModal';
import { HealthAuditModal } from './components/modals/HealthAuditModal';
import { ShareModal } from './components/modals/ShareModal';
import { AuthScreen } from './components/auth/AuthScreen';
import { DashboardView } from './components/dashboard/DashboardView';
import { useAuthStore } from './store/useAuthStore';
import { usePlaygroundStore } from './store/usePlaygroundStore';

export const App: React.FC = () => {
  const { isAuthenticated, isGuest, isLoading, checkSession } = useAuthStore();
  const { appView, setAppView, openProjectById, loadFromUrlHash, isViewOnly, setIsViewOnly } = usePlaygroundStore();

  // Validate session on startup
  useEffect(() => {
    checkSession();
  }, [checkSession]);

  // Deep linking and browser Back/Forward (popstate) synchronization
  useEffect(() => {
    const handleUrlState = () => {
      const params = new URLSearchParams(window.location.search);
      const projectId = params.get('project');
      const view = params.get('view');
      const mode = params.get('mode');
      const hash = window.location.hash;
      const isView = mode === 'view' || hash.includes('mode=view');

      if (isView) {
        setIsViewOnly(true);
      } else if (view === 'dashboard') {
        setIsViewOnly(false);
      }

      if (projectId && view === 'playground') {
        openProjectById(projectId, isView);
      } else if (hash.includes('architecture=')) {
        loadFromUrlHash(hash);
        setAppView('playground');
      } else if (view === 'dashboard' || view === 'playground') {
        setAppView(view);
      }
    };

    handleUrlState();
    window.addEventListener('popstate', handleUrlState);
    return () => window.removeEventListener('popstate', handleUrlState);
  }, [openProjectById, loadFromUrlHash, setAppView, setIsViewOnly]);

  // Initial loading splash
  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[var(--bg-app)] text-[var(--text-muted)] select-none">
        <div className="flex flex-col items-center gap-3 text-xs">
          <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          <span className="font-medium tracking-wide">Loading Playground...</span>
        </div>
      </div>
    );
  }

  // Check if viewing a shared view-only architecture link
  const isViewMode =
    typeof window !== 'undefined' &&
    (window.location.search.includes('mode=view') ||
      window.location.hash.includes('mode=view') ||
      isViewOnly);

  // If user is neither authenticated nor in guest mode, show Auth Screen (unless viewing a shared view-only link)
  if (!isAuthenticated && !isGuest && !isViewMode) {
    return <AuthScreen onSuccess={() => setAppView('dashboard')} />;
  }

  // If in Home Dashboard view
  if (appView === 'dashboard') {
    return <DashboardView />;
  }

  // Default: Interactive Playground Simulation Canvas
  return (
    <div className="flex flex-col h-screen w-screen bg-[var(--bg-app)] text-[var(--text-main)] overflow-hidden antialiased font-sans transition-colors duration-200">
      {/* Top Header with Breadcrumbs and Controls */}
      <Header />

      {/* Main Workspace Layout */}
      <div className="flex flex-1 relative overflow-hidden">
        {/* Left Drag & Drop Component Palette */}
        <Sidebar />

        {/* Center Interactive Canvas */}
        <Canvas />

        {/* Floating Chaos Control Center */}
        <ChaosControlCenter />

        {/* Right Contextual Properties Inspector */}
        <Inspector />

        {/* Bottom Real-time Telemetry Drawer */}
        <TelemetryDrawer />
      </div>

      {/* Essential Modals */}
      <CloudCostModal />
      <HealthAuditModal />
      <ShareModal />
    </div>
  );
};

export default App;
