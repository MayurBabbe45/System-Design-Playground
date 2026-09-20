import React, { useState } from 'react';
import { 
  Play, 
  Pause, 
  Share2, 
  DollarSign, 
  Zap, 
  Layers, 
  Trash2, 
  TrendingUp, 
  AlertTriangle, 
  Flame, 
  ShieldCheck, 
  Sun, 
  Moon, 
  Users, 
  Cloud,
  ArrowLeft,
  Edit2,
  Check,
  LogOut,
  User as UserIcon
} from 'lucide-react';
import { usePlaygroundStore } from '../store/usePlaygroundStore';
import { useAuthStore } from '../store/useAuthStore';
import { PRESET_ARCHITECTURES } from '../config/presets';
import { TrafficProfile } from '../types/playground';
import { auditArchitecture } from '../simulation/architectureLinter';
import { collabManager } from '../collab/collabManager';
import { CollabConnectionStatus } from '../collab/types';

export const Header: React.FC = () => {
  const {
    isSimulating,
    toggleSimulation,
    targetGlobalRps,
    setTargetGlobalRps,
    trafficProfile,
    setTrafficProfile,
    activePresetId,
    loadPreset,
    clearCanvas,
    nodes,
    edges,
    bottleneckReason,
    bottleneckNodeId,
    setSelectedNodeId,
    toggleCostModal,
    toggleChaosCenter,
    toggleAuditModal,
    toggleExportModal,
    toggleCollabModal,
    toggleLibraryModal,
    toggleBenchmarkModal,
    isChaosCenterOpen,
    killedAzs,
    engineMode,
    computeDurationMs,
    theme,
    toggleTheme,
    activeProject,
    returnToDashboard,
    renameActiveProject,
    setAppView,
  } = usePlaygroundStore();

  const { user, logout } = useAuthStore();

  const [peerCount, setPeerCount] = React.useState(0);
  const [collabStatus, setCollabStatus] = React.useState<CollabConnectionStatus>(collabManager.getStatus());
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);

  React.useEffect(() => {
    const unsubP = collabManager.onPeersChange((peers) => setPeerCount(peers.length));
    const unsubS = collabManager.onStatusChange((s) => setCollabStatus(s));
    return () => {
      unsubP();
      unsubS();
    };
  }, []);

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
      case 'A': return 'bg-emerald-950/80 text-emerald-300 border-emerald-600';
      case 'B': return 'bg-cyan-950/80 text-cyan-300 border-cyan-600';
      case 'C': return 'bg-amber-950/80 text-amber-300 border-amber-600';
      case 'D': return 'bg-orange-950/80 text-orange-300 border-orange-600';
      default: return 'bg-red-950 text-red-400 border-red-700';
    }
  };

  return (
    <header className="h-13 bg-[var(--bg-surface)] border-b border-[var(--border-subtle)] px-3 sm:px-4 flex items-center justify-between z-30 select-none shadow-sm transition-colors duration-200">
      {/* Left: n8n-Style Breadcrumb Navigation */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Return to Dashboard Button */}
        <button
          type="button"
          onClick={returnToDashboard}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--bg-pill)] hover:bg-[var(--bg-panel)] border border-[var(--border-subtle)] text-[var(--text-main)] text-xs font-semibold transition-all hover:-translate-x-0.5"
          title="Return to Projects Workspace"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden sm:inline">Projects</span>
        </button>

        <span className="text-[var(--border-subtle)] font-bold text-xs">/</span>

        {/* Project Title with Inline Rename */}
        <div className="flex items-center">
          {isEditingTitle ? (
            <form onSubmit={handleTitleSubmit} className="flex items-center gap-1">
              <input
                type="text"
                autoFocus
                value={tempTitle}
                onChange={(e) => setTempTitle(e.target.value)}
                onBlur={() => handleTitleSubmit()}
                className="px-2 py-0.5 bg-[var(--bg-panel)] border border-cyan-500 rounded-lg text-xs font-bold text-[var(--text-main)] focus:outline-none max-w-[180px]"
              />
              <button type="submit" className="p-1 text-emerald-400 hover:text-emerald-300">
                <Check className="w-3 h-3" />
              </button>
            </form>
          ) : (
            <div
              onClick={() => {
                setTempTitle(activeProject?.name || 'Untitled Architecture');
                setIsEditingTitle(true);
              }}
              className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-[var(--bg-pill)] cursor-pointer group"
              title="Click to rename architecture"
            >
              <span className="text-xs font-bold text-[var(--text-main)] max-w-[130px] sm:max-w-[200px] md:max-w-[260px] truncate">
                {activeProject?.name || 'Untitled Architecture'}
              </span>
              <Edit2 className="w-2.5 h-2.5 text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            </div>
          )}
        </div>

        {/* Cloud Sync Status Indicator */}
        <div className="hidden lg:flex items-center gap-1.5 pl-1.5 border-l border-[var(--border-subtle)]" title="Project synchronized with database">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50 inline-block" />
          <span className="text-[10px] text-[var(--text-muted)] font-medium">Saved</span>
        </div>
      </div>

      {/* Center: Unified Floating Simulation Capsule */}
      <div className="flex items-center gap-1.5 bg-[var(--bg-pill)] p-1 rounded-xl border border-[var(--border-subtle)] shadow-inner">
        {/* Simulation Play / Pause Button */}
        <button
          onClick={toggleSimulation}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold shadow-sm transition-all cursor-pointer ${
            isSimulating
              ? 'bg-amber-500/20 text-amber-500 dark:text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
              : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-emerald-600/20'
          }`}
        >
          {isSimulating ? <Pause className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current" />}
          <span className="hidden sm:inline">{isSimulating ? 'Pause' : 'Simulate'}</span>
        </button>

        {/* Traffic Profile Selector */}
        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
          <TrendingUp className="w-3 h-3 text-cyan-500 dark:text-cyan-400 shrink-0" />
          <select
            value={trafficProfile}
            onChange={(e) => setTrafficProfile(e.target.value as TrafficProfile)}
            className="bg-transparent text-[11px] text-[var(--text-main)] focus:outline-none cursor-pointer font-medium"
          >
            <option value="steady" className="bg-[var(--bg-surface)] text-[var(--text-main)]">Steady</option>
            <option value="poisson" className="bg-[var(--bg-surface)] text-[var(--text-main)]">Poisson</option>
            <option value="spike" className="bg-[var(--bg-surface)] text-[var(--text-main)]">Spike</option>
            <option value="diurnal" className="bg-[var(--bg-surface)] text-[var(--text-main)]">Diurnal</option>
          </select>
        </div>

        {/* Compact Load Slider */}
        <div className="flex items-center gap-1.5 pl-1 pr-2">
          <input
            type="range"
            min="100"
            max="30000"
            step="100"
            value={targetGlobalRps}
            onChange={(e) => setTargetGlobalRps(Number(e.target.value))}
            className="w-16 sm:w-20 accent-blue-500 cursor-pointer h-1.5 bg-neutral-300 dark:bg-neutral-800 rounded-lg"
            title={`Global Traffic: ${targetGlobalRps.toLocaleString()} RPS`}
          />
          <span className="text-[11px] font-mono font-bold text-blue-500 dark:text-blue-400 min-w-[50px] text-right">
            {targetGlobalRps >= 1000 ? `${(targetGlobalRps / 1000).toFixed(1)}k` : targetGlobalRps} RPS
          </span>
        </div>
      </div>

      {/* Right: Metrics & Action Utility Bar */}
      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
        {/* Architecture Health Audit Pill */}
        <button
          onClick={toggleAuditModal}
          title={`Architecture Resilience: Grade ${auditResult.grade} (${auditResult.score}/100)`}
          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer hover:scale-102 ${getGradeBadge()}`}
        >
          <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
          <span>{auditResult.grade} ({auditResult.score}%)</span>
        </button>

        {/* Cloud Cost Pill */}
        <button
          onClick={toggleCostModal}
          title="Itemized Cloud Cost Breakdown"
          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[var(--bg-pill)] hover:opacity-85 border border-[var(--border-subtle)] text-[11px] font-mono transition-all cursor-pointer group shadow-sm"
        >
          <DollarSign className="w-3 h-3 text-emerald-500 dark:text-emerald-400 group-hover:scale-110 transition-transform shrink-0" />
          <span className="text-emerald-500 dark:text-emerald-400 font-bold">
            ${monthlyTotal >= 1000 ? `${(monthlyTotal / 1000).toFixed(1)}k` : monthlyTotal}/mo
          </span>
        </button>

        {/* WASM Engine Pill */}
        <button
          onClick={toggleBenchmarkModal}
          title={`WebAssembly Simulation Engine (${engineMode.toUpperCase()} mode, ${computeDurationMs > 0 ? `${computeDurationMs}ms` : 'ready'})`}
          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-mono font-semibold border transition-all cursor-pointer hover:scale-102 ${
            engineMode === 'wasm'
              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-300'
              : 'bg-blue-500/15 border-blue-500/40 text-blue-600 dark:text-blue-300'
          }`}
        >
          <Zap className="w-3 h-3 shrink-0" />
          <span className="hidden xl:inline">{engineMode.toUpperCase()}</span>
          <span className="text-[10px] opacity-80">{computeDurationMs > 0 ? `${computeDurationMs}ms` : '0.1ms'}</span>
        </button>

        {/* Saturated Bottleneck alert button (conditional) */}
        {bottleneckNodeId && (
          <button
            onClick={() => setSelectedNodeId(bottleneckNodeId)}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-red-950/80 border border-red-700/80 text-red-300 text-[11px] font-semibold animate-pulse hover:bg-red-900/80 transition-colors cursor-pointer"
            title={bottleneckReason || 'Bottleneck Detected'}
          >
            <AlertTriangle className="w-3 h-3 text-red-400 shrink-0" />
            <span className="hidden xl:inline">Bottleneck</span>
          </button>
        )}

        {/* Multiplayer Real-Time Collaboration Pill */}
        <button
          onClick={toggleCollabModal}
          title={`Real-Time Multiplayer (${collabStatus === 'connected' ? `${peerCount} other peer(s) connected` : collabStatus})`}
          className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
            collabStatus === 'connected'
              ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-400 hover:bg-indigo-500/25 shadow-sm shadow-indigo-500/10'
              : collabStatus === 'connecting'
              ? 'bg-amber-500/15 border-amber-500/40 text-amber-400 hover:bg-amber-500/25'
              : 'bg-[var(--bg-pill)] border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
          }`}
        >
          <div className="relative flex items-center justify-center">
            <Users className="w-3.5 h-3.5" />
            <span
              className={`absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full ${
                collabStatus === 'connected'
                  ? 'bg-emerald-400 animate-pulse'
                  : collabStatus === 'connecting'
                  ? 'bg-amber-400 animate-ping'
                  : 'bg-zinc-500'
              }`}
            />
          </div>
          <span className="hidden xl:inline">
            {collabStatus === 'connected'
              ? `${peerCount + 1} Online`
              : collabStatus === 'connecting'
              ? 'Syncing...'
              : 'Collab'}
          </span>
        </button>

        {/* Chaos Mode Toggle Button */}
        <button
          onClick={toggleChaosCenter}
          title={isChaosActive ? 'Chaos Engineering Active (Outages simulated)' : 'Open Chaos Engineering Simulator'}
          className={`flex items-center gap-1 p-1.5 sm:px-2 sm:py-1 rounded-lg text-xs font-semibold transition-all border cursor-pointer ${
            isChaosActive
              ? 'bg-red-950/90 text-red-300 border-red-600 shadow-md shadow-red-950/40'
              : 'bg-[var(--bg-pill)] text-[var(--text-main)] border-[var(--border-subtle)] hover:border-red-500/40'
          }`}
        >
          <Flame className={`w-3.5 h-3.5 ${isChaosActive ? 'text-red-400 animate-bounce' : 'text-orange-400'}`} />
          <span className="hidden xl:inline">Chaos</span>
          {killedAzs.length > 0 && (
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
          )}
        </button>

        {/* Cloud Saves Library Button (PostgreSQL & ClickHouse) */}
        <button
          onClick={toggleLibraryModal}
          title="Cloud Architecture Hub (PostgreSQL & ClickHouse)"
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600/15 hover:bg-blue-600/25 border border-blue-500/40 text-blue-400 text-xs font-semibold shadow-sm transition-all cursor-pointer"
        >
          <Cloud className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden xl:inline">Cloud Saves</span>
        </button>

        {/* Share Button (Opens Export & Share Modal) */}
        <button
          onClick={toggleExportModal}
          title="Share & Export Architecture"
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#ff6d5a] hover:bg-[#ff5740] text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
        >
          <Share2 className="w-3 h-3 shrink-0" />
          <span className="hidden md:inline">Share</span>
        </button>

        {/* Theme Toggle Button (Light/Dark) */}
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="p-1.5 rounded-lg border border-[var(--border-subtle)] hover:border-white/20 transition-all text-[var(--text-muted)] hover:text-[var(--text-main)] bg-[var(--bg-pill)] hover:opacity-90 cursor-pointer shadow-sm"
        >
          {theme === 'dark' ? (
            <Sun className="w-3.5 h-3.5 text-amber-400 hover:rotate-45 transition-transform" />
          ) : (
            <Moon className="w-3.5 h-3.5 text-indigo-500 hover:-rotate-12 transition-transform" />
          )}
        </button>

        {/* Clear Canvas Button */}
        <button
          onClick={clearCanvas}
          title="Clear Canvas"
          className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 transition-colors border border-transparent hover:border-red-500/30 cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>

        {/* User Account Avatar & Dropdown */}
        <div className="relative border-l border-[var(--border-subtle)] pl-2">
          <button
            type="button"
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-500/20 to-indigo-500/20 border border-cyan-500/40 text-cyan-400 font-bold text-xs flex items-center justify-center hover:bg-cyan-500/30 transition-colors shadow-sm cursor-pointer"
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
                className="w-full px-3 py-1.5 text-left text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-panel)] flex items-center gap-2"
              >
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                <span>Back to Projects</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowUserMenu(false);
                  logout();
                  setAppView('auth');
                }}
                className="w-full px-3 py-1.5 text-left text-rose-400 hover:bg-rose-500/10 flex items-center gap-2"
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
