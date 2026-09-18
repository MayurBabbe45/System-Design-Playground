import React from 'react';
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
  Cloud
} from 'lucide-react';
import { usePlaygroundStore } from '../store/usePlaygroundStore';
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
  } = usePlaygroundStore();

  const [peerCount, setPeerCount] = React.useState(0);
  const [collabStatus, setCollabStatus] = React.useState<CollabConnectionStatus>(collabManager.getStatus());

  React.useEffect(() => {
    const unsubP = collabManager.onPeersChange((peers) => setPeerCount(peers.length));
    const unsubS = collabManager.onStatusChange((s) => setCollabStatus(s));
    return () => {
      unsubP();
      unsubS();
    };
  }, []);

  // Calculate monthly cost ($/hr * 730 hrs)
  const hourlyTotal = nodes.reduce((sum, node) => {
    return sum + (node.data.costPerHour || 0) * (node.data.instanceCount || 1);
  }, 0);
  const monthlyTotal = Math.round(hourlyTotal * 730);

  // Evaluate Architecture Health
  const auditResult = auditArchitecture(nodes, edges);

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
      {/* Left: Brand & Preset Selection */}
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-sm shadow-orange-500/20 text-white shrink-0">
            <Zap className="w-3.5 h-3.5 fill-white" />
          </div>
          <span className="text-xs sm:text-sm font-bold tracking-tight text-[var(--text-main)] hidden md:inline">
            System Design Playground
          </span>
        </div>

        <div className="h-4 w-px bg-[var(--border-subtle)] hidden sm:block" />

        {/* Preset Selector */}
        <div className="flex items-center gap-1 bg-[var(--bg-pill)] px-2 py-1 rounded-lg border border-[var(--border-subtle)] hover:border-white/20 transition-colors">
          <Layers className="w-3 h-3 text-purple-400 shrink-0" />
          <select
            value={activePresetId}
            onChange={(e) => loadPreset(e.target.value)}
            className="bg-transparent text-[11px] text-[var(--text-main)] focus:outline-none cursor-pointer font-medium max-w-[140px] sm:max-w-[190px] truncate"
          >
            {PRESET_ARCHITECTURES.map((preset) => (
              <option key={preset.id} value={preset.id} className="bg-[var(--bg-surface)] text-[var(--text-main)]">
                {preset.name}
              </option>
            ))}
            <option value="custom" className="bg-[var(--bg-surface)] text-[var(--text-main)]" disabled>
              Custom Architecture
            </option>
          </select>
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
      </div>
    </header>
  );
};
