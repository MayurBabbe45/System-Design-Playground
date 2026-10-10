import React, { useState } from 'react';
import { 
  Play, 
  Pause, 
  DollarSign, 
  Layers, 
  Trash2, 
  TrendingUp, 
  AlertTriangle, 
  Flame, 
  ShieldCheck, 
  ArrowLeft,
  Edit2,
  Check,
  LogOut,
  Box,
  Activity,
  Eye,
  GitFork,
  Share2,
  Square,
  Zap
} from 'lucide-react';
import { usePlaygroundStore } from '../store/usePlaygroundStore';
import { useAuthStore } from '../store/useAuthStore';
import { TrafficProfile } from '../types/playground';
import { auditArchitecture } from '../simulation/architectureLinter';

export const Header: React.FC = () => {
  const {
    isSimulating,
    isCascadeRunning,
    toggleSimulation,
    stopSimulation,
    targetGlobalRps,
    setTargetGlobalRps,
    trafficProfile,
    setTrafficProfile,
    clearCanvas,
    nodes,
    edges,
    bottleneckReason,
    bottleneckNodeId,
    setSelectedNodeId,
    toggleCostModal,
    toggleChaosCenter,
    toggleAuditModal,
    isChaosCenterOpen,
    killedAzs,
    canvasViewMode,
    setCanvasViewMode,
    activeProject,
    returnToDashboard,
    renameActiveProject,
    setAppView,
    isViewOnly,
    forkActiveProject,
    toggleExportModal,
  } = usePlaygroundStore();

  const { user, logout } = useAuthStore();

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleTitleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (tempTitle.trim()) {
      renameActiveProject(tempTitle.trim());
    }
    setIsEditingTitle(false);
  };

  const auditResult = React.useMemo(() => auditArchitecture(nodes, edges), [nodes, edges]);
  const monthlyTotal = React.useMemo(() => {
    const hourly = nodes.reduce((acc, n) => acc + (n.data.costPerHour || 0) * (n.data.instanceCount || 1), 0);
    return Math.round(hourly * 730);
  }, [nodes]);

  const isChaosActive = isChaosCenterOpen || killedAzs.length > 0;

  const getGradeBadge = () => {
    switch (auditResult.grade) {
      case 'A': return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 shadow-xs shadow-emerald-500/10';
      case 'B': return 'bg-blue-500/15 text-blue-400 border-blue-500/30 shadow-xs shadow-blue-500/10';
      case 'C': return 'bg-amber-500/15 text-amber-400 border-amber-500/30 shadow-xs shadow-amber-500/10';
      default: return 'bg-rose-500/15 text-rose-400 border-rose-500/30 shadow-xs shadow-rose-500/10';
    }
  };

  return (
    <header className="h-13 spatial-glass border-b border-white/10 px-3 sm:px-4 flex items-center justify-between z-30 select-none transition-all duration-200">
      {/* Left: Breadcrumb Navigation & Project Name */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={returnToDashboard}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl spatial-glass-card border border-white/10 text-[var(--text-main)] text-xs font-semibold cursor-pointer"
          title="Return to Projects Workspace"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-blue-400" />
          <span className="hidden sm:inline">Projects</span>
        </button>

        <span className="text-white/20 font-bold text-xs">/</span>

        {/* Project Title */}
        <div className="flex items-center">
          {isViewOnly ? (
            <div className="flex items-center px-2 py-1">
              <span className="text-xs font-bold text-[var(--text-main)] max-w-[130px] sm:max-w-[200px] md:max-w-[260px] truncate">
                {activeProject?.name || 'Shared Architecture'}
              </span>
            </div>
          ) : isEditingTitle ? (
            <form onSubmit={handleTitleSubmit} className="flex items-center gap-1">
              <input
                type="text"
                autoFocus
                value={tempTitle}
                onChange={(e) => setTempTitle(e.target.value)}
                onBlur={() => handleTitleSubmit()}
                className="px-2.5 py-1 spatial-pill border border-blue-500/60 rounded-xl text-xs font-bold text-[var(--text-main)] focus:outline-none max-w-[180px]"
              />
              <button type="submit" className="p-1 text-emerald-400 hover:opacity-80 cursor-pointer">
                <Check className="w-3 h-3" />
              </button>
            </form>
          ) : (
            <div
              onClick={() => {
                setTempTitle(activeProject?.name || 'Untitled Architecture');
                setIsEditingTitle(true);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl spatial-pill hover:border-white/20 border border-transparent cursor-pointer group transition-all"
              title="Click to rename architecture"
            >
              <span className="text-xs font-bold text-[var(--text-main)] max-w-[130px] sm:max-w-[200px] md:max-w-[260px] truncate">
                {activeProject?.name || 'Untitled Architecture'}
              </span>
              <Edit2 className="w-2.5 h-2.5 text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            </div>
          )}
        </div>

        {/* View-Only Badge & Fork Button OR Saved Indicator */}
        {isViewOnly ? (
          <div className="flex items-center gap-2 pl-1.5 border-l border-white/10">
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-400 text-xs font-semibold">
              <Eye className="w-3 h-3" />
              <span className="hidden sm:inline">View-Only</span>
            </div>
            <button
              type="button"
              onClick={() => forkActiveProject()}
              className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
              title="Clone this architecture to your account to edit and customize"
            >
              <GitFork className="w-3 h-3" />
              <span>Fork to Edit</span>
            </button>
          </div>
        ) : (
          <div className="hidden lg:flex items-center gap-1.5 pl-1.5 border-l border-white/10" title="Project saved automatically">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block shadow-xs shadow-emerald-500" />
            <span className="text-[10px] text-[var(--text-muted)] font-medium">Saved</span>
          </div>
        )}
      </div>

      {/* Center: Mode Switcher & Simulation Capsule */}
      <div className="flex items-center gap-2">
        {/* Simple vs Detailed Canvas Mode Toggle */}
        <div className="hidden md:flex items-center spatial-pill p-0.5 rounded-xl border border-white/10 text-[11px] font-medium">
          <button
            type="button"
            onClick={() => setCanvasViewMode('simple')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              canvasViewMode === 'simple'
                ? 'bg-white/10 dark:bg-white/15 text-blue-400 font-bold shadow-xs border border-white/10'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
            title="Simple Mode: Compact n8n-style nodes. Click a node to reveal full metrics."
          >
            <Box className="w-3 h-3" />
            <span>Simple</span>
          </button>
          <button
            type="button"
            onClick={() => setCanvasViewMode('detailed')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              canvasViewMode === 'detailed'
                ? 'bg-white/10 dark:bg-white/15 text-blue-400 font-bold shadow-xs border border-white/10'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
            title="Detailed Mode: Always display live throughput, latency, and queue metrics on all canvas nodes."
          >
            <Activity className="w-3 h-3" />
            <span>Detailed</span>
          </button>
        </div>

        {/* Clean Simulation Control Capsule */}
        <div className="flex items-center gap-1.5 spatial-pill p-1 rounded-xl border border-white/10 shadow-inner">
          {!isSimulating ? (
            <>
              {/* Primary Simulate Trigger Button */}
              <button
                type="button"
                onClick={toggleSimulation}
                title="Start real-time incremental execution cascade (Space)"
                className="flex items-center gap-1.5 px-3.5 py-1 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 shadow-md shadow-emerald-500/25 active:scale-95 transition-all cursor-pointer border border-emerald-400/30"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Simulate</span>
              </button>

              {/* Design / Construction Mode Indicator */}
              <div
                className="hidden xl:flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[10px] font-semibold text-[var(--text-muted)] bg-white/5 border border-white/10"
                title="Canvas is in construction mode with 0 animation overhead"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                <span>Design Mode</span>
              </div>
            </>
          ) : (
            <>
              {/* Status Badge: Cascade Propagating vs Live Simulating */}
              {isCascadeRunning ? (
                <div
                  className="flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-amber-500/20 border border-amber-500/35 text-amber-300 text-[10px] font-bold"
                  title="Propagating traffic wave down topology DAG"
                >
                  <Zap className="w-3 h-3 fill-amber-400 text-amber-400 animate-bounce" />
                  <span className="hidden sm:inline">Cascading...</span>
                </div>
              ) : (
                <div
                  className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-emerald-500/20 border border-emerald-500/35 text-emerald-300 text-[10px] font-bold"
                  title="Real-time discrete simulation running"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  <span className="hidden sm:inline">Live Sim</span>
                </div>
              )}

              {/* Pause / Resume Button */}
              <button
                type="button"
                onClick={toggleSimulation}
                title="Pause / Resume simulation (Space)"
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/35 transition-all cursor-pointer"
              >
                <Pause className="w-3 h-3 fill-current" />
                <span className="hidden sm:inline">Pause</span>
              </button>

              {/* Stop Button: Resets Canvas to Tranquil Design Mode */}
              <button
                type="button"
                onClick={stopSimulation}
                title="Stop simulation & return to Design Mode"
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/35 transition-all cursor-pointer"
              >
                <Square className="w-3 h-3 fill-current" />
                <span className="hidden sm:inline">Stop</span>
              </button>
            </>
          )}

        {/* Traffic Profile Selector */}
        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-lg hover:bg-white/5 transition-colors">
          <TrendingUp className="w-3 h-3 text-blue-400 shrink-0" />
          <select
            value={trafficProfile}
            onChange={(e) => setTrafficProfile(e.target.value as TrafficProfile)}
            className="bg-transparent text-[11px] text-[var(--text-main)] focus:outline-none cursor-pointer font-medium"
          >
            <option value="steady" className="bg-[#121622] text-white">Steady</option>
            <option value="poisson" className="bg-[#121622] text-white">Poisson</option>
            <option value="spike" className="bg-[#121622] text-white">Spike</option>
            <option value="diurnal" className="bg-[#121622] text-white">Diurnal</option>
          </select>
        </div>

        {/* Load Slider */}
        <div className="flex items-center gap-1.5 pl-1 pr-2">
          <input
            type="range"
            min="100"
            max="30000"
            step="100"
            value={targetGlobalRps}
            onChange={(e) => setTargetGlobalRps(Number(e.target.value))}
            className="w-16 sm:w-20 accent-blue-500 cursor-pointer h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-lg"
            title={`Global Traffic: ${targetGlobalRps.toLocaleString()} RPS`}
          />
          <span className="text-[11px] font-mono font-bold text-blue-400 min-w-[50px] text-right">
            {targetGlobalRps >= 1000 ? `${(targetGlobalRps / 1000).toFixed(1)}k` : targetGlobalRps} RPS
          </span>
        </div>
      </div>
      </div>

      {/* Right: Resilience & Utility Controls */}
      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
        {/* Architecture Resilience Audit Pill */}
        <button
          onClick={toggleAuditModal}
          title={`Architecture Resilience: Grade ${auditResult.grade} (${auditResult.score}/100)`}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-semibold border spatial-pill transition-all cursor-pointer ${getGradeBadge()}`}
        >
          <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden md:inline">Resilience: </span>
          <span>{auditResult.grade} ({auditResult.score}%)</span>
        </button>

        {/* Cloud Cost Pill */}
        <button
          onClick={toggleCostModal}
          title="Itemized Cloud Cost Breakdown"
          className="flex items-center gap-1 px-2.5 py-1 rounded-xl spatial-glass-card border border-white/10 text-[11px] font-mono transition-all cursor-pointer group text-[var(--text-main)]"
        >
          <DollarSign className="w-3 h-3 text-slate-400 group-hover:scale-110 transition-transform shrink-0" />
          <span className="font-semibold">
            ${monthlyTotal >= 1000 ? `${(monthlyTotal / 1000).toFixed(1)}k` : monthlyTotal}/mo
          </span>
        </button>

        {/* Saturated Bottleneck alert button (conditional) */}
        {bottleneckNodeId && (
          <button
            onClick={() => setSelectedNodeId(bottleneckNodeId)}
            className="flex items-center gap-1 px-2 py-1 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[11px] font-semibold animate-pulse hover:opacity-90 transition-colors cursor-pointer"
            title={bottleneckReason || 'Bottleneck Detected'}
          >
            <AlertTriangle className="w-3 h-3 text-rose-400 shrink-0" />
            <span className="hidden xl:inline">Bottleneck</span>
          </button>
        )}

        {/* Chaos Engineering Button */}
        <button
          onClick={toggleChaosCenter}
          title={isChaosActive ? 'Chaos Engineering Active (Outages simulated)' : 'Open Chaos Engineering Simulator'}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
            isChaosActive
              ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-sm shadow-rose-500/20'
              : 'spatial-glass-card border-white/10 text-[var(--text-main)] hover:border-rose-500/40'
          }`}
        >
          <Flame className={`w-3.5 h-3.5 ${isChaosActive ? 'text-rose-400 animate-bounce' : 'text-rose-400'}`} />
          <span className="hidden xl:inline">Chaos Test</span>
          {killedAzs.length > 0 && (
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
          )}
        </button>

        {/* Share Button (Generates View-Only Link) */}
        <button
          type="button"
          onClick={toggleExportModal}
          title="Share interactive view-only architecture simulation"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-blue-500/25 border border-blue-400/30 transition-all cursor-pointer"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Share</span>
        </button>

        {/* Clear Canvas Button (Disabled in View-Only mode) */}
        {!isViewOnly && (
          <button
            onClick={clearCanvas}
            title="Clear Canvas"
            className="p-1.5 rounded-xl spatial-glass-card text-[var(--text-muted)] hover:text-rose-400 hover:border-rose-500/30 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}

        {/* User Account Avatar & Dropdown */}
        <div className="relative border-l border-[var(--border-subtle)] pl-2">
          <button
            type="button"
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="w-7 h-7 rounded-lg bg-blue-600/10 border border-blue-600/30 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center justify-center hover:bg-blue-600/20 transition-colors shadow-sm cursor-pointer"
            title={user?.name || 'Account'}
          >
            {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-9 w-44 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-2xl py-1.5 z-50 animate-fadeIn text-xs">
              <div className="px-3 py-1.5 border-b border-[var(--border-subtle)]">
                <div className="font-semibold text-[var(--text-main)] truncate">{user?.name || 'Architect'}</div>
                <div className="text-[10px] text-[var(--text-muted)] truncate">{user?.email || 'local@playground'}</div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowUserMenu(false);
                  returnToDashboard();
                }}
                className="w-full px-3 py-1.5 text-left text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-panel)] flex items-center gap-2 cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5 text-blue-500" />
                <span>Back to Projects</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowUserMenu(false);
                  logout();
                  setAppView('auth');
                }}
                className="w-full px-3 py-1.5 text-left text-rose-500 hover:bg-rose-500/10 flex items-center gap-2 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
