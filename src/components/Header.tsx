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
  ShieldCheck
} from 'lucide-react';
import { usePlaygroundStore } from '../store/usePlaygroundStore';
import { PRESET_ARCHITECTURES } from '../config/presets';
import { TrafficProfile } from '../types/playground';
import { auditArchitecture } from '../simulation/architectureLinter';

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
    isChaosCenterOpen,
    killedAzs,
  } = usePlaygroundStore();

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
      case 'A': return 'bg-emerald-950 text-emerald-400 border-emerald-700';
      case 'B': return 'bg-blue-950 text-blue-400 border-blue-700';
      case 'C': return 'bg-amber-950 text-amber-400 border-amber-700';
      default: return 'bg-red-950 text-red-400 border-red-700';
    }
  };

  return (
    <header className="h-14 bg-[#161922] border-b border-white/10 px-5 flex items-center justify-between z-30 select-none shadow-sm">
      {/* Brand Title */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-md shadow-orange-500/20 text-white">
          <Zap className="w-4 h-4 fill-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold tracking-tight text-white">
              System Design Playground
            </span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-400 font-mono border border-neutral-700">
              SIMULATOR
            </span>
          </div>
          <div className="text-[10px] text-neutral-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Discrete-Event Queue Engine
          </div>
        </div>
      </div>

      {/* Center Controls: Presets, Traffic Profile, Load Slider, Play/Pause */}
      <div className="flex items-center gap-3">
        {/* Preset Selector */}
        <div className="flex items-center gap-1.5 bg-[#0e1117] px-3 py-1.5 rounded-lg border border-white/10 hover:border-white/20 transition-colors">
          <Layers className="w-3.5 h-3.5 text-purple-400" />
          <select
            value={activePresetId}
            onChange={(e) => loadPreset(e.target.value)}
            className="bg-transparent text-xs text-neutral-200 focus:outline-none cursor-pointer font-medium"
          >
            {PRESET_ARCHITECTURES.map((preset) => (
              <option key={preset.id} value={preset.id} className="bg-[#161922] text-neutral-200">
                {preset.name}
              </option>
            ))}
            <option value="custom" className="bg-[#161922] text-neutral-200" disabled>
              Custom Architecture
            </option>
          </select>
        </div>

        {/* Traffic Profile Selector */}
        <div className="flex items-center gap-1.5 bg-[#0e1117] px-3 py-1.5 rounded-lg border border-white/10 hover:border-white/20 transition-colors">
          <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
          <select
            value={trafficProfile}
            onChange={(e) => setTrafficProfile(e.target.value as TrafficProfile)}
            className="bg-transparent text-xs text-neutral-200 focus:outline-none cursor-pointer font-medium"
          >
            <option value="steady" className="bg-[#161922] text-neutral-200">Steady Load</option>
            <option value="poisson" className="bg-[#161922] text-neutral-200">Poisson Arrivals</option>
            <option value="spike" className="bg-[#161922] text-neutral-200">Flash Sale Spike</option>
            <option value="diurnal" className="bg-[#161922] text-neutral-200">Diurnal 24h Cycle</option>
          </select>
        </div>

        {/* Load Slider */}
        <div className="flex items-center gap-2.5 bg-[#0e1117] px-3 py-1.5 rounded-lg border border-white/10">
          <span className="text-[11px] text-neutral-400 font-medium">Load:</span>
          <input
            type="range"
            min="100"
            max="30000"
            step="100"
            value={targetGlobalRps}
            onChange={(e) => setTargetGlobalRps(Number(e.target.value))}
            className="w-24 accent-blue-500 cursor-pointer h-1.5 bg-neutral-800 rounded-lg"
          />
          <span className="text-xs font-mono font-bold text-blue-400 min-w-[70px] text-right">
            {targetGlobalRps.toLocaleString()} RPS
          </span>
        </div>

        {/* Simulation Play / Pause Button */}
        <button
          onClick={toggleSimulation}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-all ${
            isSimulating
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
              : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-emerald-600/20'
          }`}
        >
          {isSimulating ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
          <span>{isSimulating ? 'Pause' : 'Simulate'}</span>
        </button>
      </div>

      {/* Right Controls: Health Audit, Chaos, Cost, Share */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Architecture Health Audit Button */}
        <button
          onClick={toggleAuditModal}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all hover:scale-102 ${getGradeBadge()}`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Health: {auditResult.grade} ({auditResult.score}%)</span>
        </button>

        {/* Chaos Mode Toggle */}
        <button
          onClick={toggleChaosCenter}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
            isChaosActive
              ? 'bg-red-950/90 text-red-300 border-red-600 shadow-md shadow-red-950/40'
              : 'bg-[#0e1117] text-neutral-300 border-white/10 hover:border-red-500/40'
          }`}
        >
          <Flame className={`w-3.5 h-3.5 ${isChaosActive ? 'text-red-400 animate-bounce' : 'text-orange-400'}`} />
          <span>Chaos</span>
          {killedAzs.length > 0 && (
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
          )}
        </button>

        {/* Saturated Bottleneck focus button */}
        {bottleneckNodeId && (
          <button
            onClick={() => setSelectedNodeId(bottleneckNodeId)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-red-950/80 border border-red-700/80 text-red-300 text-xs font-semibold animate-pulse hover:bg-red-900/80 transition-colors"
            title={bottleneckReason || ''}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
            <span>Bottleneck</span>
          </button>
        )}

        {/* Cloud Cost Pill */}
        <button
          onClick={toggleCostModal}
          title="Click to view detailed itemized Cloud Cost Breakdown"
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#0e1117] hover:bg-[#1e2230] border border-white/10 hover:border-emerald-500/40 text-xs font-mono transition-colors cursor-pointer group shadow-sm"
        >
          <DollarSign className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
          <span className="text-neutral-400">Est:</span>
          <span className="text-emerald-400 font-bold">${monthlyTotal.toLocaleString()}/mo</span>
        </button>

        {/* Share Button (Opens Export & Share Modal) */}
        <button
          onClick={toggleExportModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#ff6d5a] hover:bg-[#ff5740] text-white text-xs font-semibold shadow-sm shadow-orange-500/20 transition-all"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Share</span>
        </button>

        {/* Clear Button */}
        <button
          onClick={clearCanvas}
          title="Clear Canvas"
          className="p-1.5 rounded-lg text-neutral-400 hover:text-red-400 hover:bg-red-500/10 transition-colors border border-transparent hover:border-red-500/30"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
