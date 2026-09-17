import React from 'react';
import { 
  Flame, 
  X, 
  RotateCcw, 
  Radio, 
  Clock, 
  AlertTriangle, 
  ShieldAlert,
  ServerOff
} from 'lucide-react';
import { usePlaygroundStore } from '../store/usePlaygroundStore';
import { AvailabilityZone } from '../types/playground';

const ALL_AZS: AvailabilityZone[] = ['us-east-1a', 'us-east-1b', 'us-east-1c'];

export const ChaosControlCenter: React.FC = () => {
  const {
    isChaosCenterOpen,
    toggleChaosCenter,
    killedAzs,
    toggleKillAz,
    resetChaos,
    globalInjectedLatencyMs,
    setGlobalInjectedLatencyMs,
    globalPacketDropPercent,
    setGlobalPacketDropPercent,
    nodes,
    selectedNodeId,
  } = usePlaygroundStore();

  if (!isChaosCenterOpen) return null;

  // Count dead/impacted nodes
  const totalDeadNodes = nodes.filter(
    (n) => n.data.isKilled || (n.data.availabilityZone && killedAzs.includes(n.data.availabilityZone))
  ).length;

  return (
    <div className={`absolute top-4 ${selectedNodeId ? 'right-84' : 'right-4'} z-20 w-80 bg-[var(--bg-surface)]/95 backdrop-blur-xl border border-red-500/30 rounded-xl shadow-2xl p-4 text-[var(--text-main)] select-none animate-in fade-in zoom-in-95 duration-150 transition-all`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-red-600/20 text-red-500 dark:text-red-400 flex items-center justify-center border border-red-500/30">
            <Flame className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-[var(--text-main)] tracking-wide">Chaos Engineering Center</h3>
            <p className="text-[10px] text-[var(--text-muted)]">Simulate outages, lag & failover</p>
          </div>
        </div>
        <button
          onClick={toggleChaosCenter}
          className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-4">
        {/* Availability Zone Outage Simulator */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1.5">
              <ServerOff className="w-3.5 h-3.5 text-orange-500 dark:text-orange-400" />
              AZ Blackout Simulation
            </span>
            {killedAzs.length > 0 && (
              <span className="text-[10px] font-mono text-red-500 dark:text-red-400 font-bold animate-pulse">
                {killedAzs.length} AZs DOWN
              </span>
            )}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {ALL_AZS.map((az) => {
              const isKilled = killedAzs.includes(az);
              const nodesInAz = nodes.filter((n) => n.data.availabilityZone === az).length;

              return (
                <button
                  key={az}
                  onClick={() => toggleKillAz(az)}
                  className={`p-2 rounded-lg border text-center transition-all ${
                    isKilled
                      ? 'bg-red-950 text-red-200 border-red-600 shadow-md shadow-red-900/30'
                      : 'bg-[var(--bg-pill)] text-[var(--text-main)] border-[var(--border-subtle)] hover:border-red-500/40'
                  }`}
                >
                  <div className="text-[10px] font-bold font-mono uppercase">{az.replace('us-east-', '')}</div>
                  <div className="text-[9px] text-[var(--text-muted)] mt-0.5">{nodesInAz} Nodes</div>
                  <div className={`text-[8px] font-bold mt-1 uppercase ${isKilled ? 'text-red-400' : 'text-emerald-500 dark:text-emerald-400'}`}>
                    {isKilled ? 'OUTAGE' : 'ONLINE'}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Global Network Latency Injection */}
        <div className="bg-[var(--bg-pill)] p-2.5 rounded-lg border border-[var(--border-subtle)] space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-[var(--text-main)] font-medium flex items-center gap-1">
              <Clock className="w-3 h-3 text-amber-500 dark:text-amber-400" />
              WAN Latency Injection:
            </span>
            <span className="font-mono font-bold text-amber-500 dark:text-amber-400">+{globalInjectedLatencyMs}ms</span>
          </div>
          <input
            type="range"
            min="0"
            max="500"
            step="25"
            value={globalInjectedLatencyMs}
            onChange={(e) => setGlobalInjectedLatencyMs(Number(e.target.value))}
            className="w-full accent-amber-500 h-1.5 bg-neutral-700/50 dark:bg-neutral-800 rounded-lg cursor-pointer"
          />
        </div>

        {/* Packet Loss Injection */}
        <div className="bg-[var(--bg-pill)] p-2.5 rounded-lg border border-[var(--border-subtle)] space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-[var(--text-main)] font-medium flex items-center gap-1">
              <Radio className="w-3 h-3 text-red-500 dark:text-red-400" />
              Packet Loss Rate:
            </span>
            <span className="font-mono font-bold text-red-500 dark:text-red-400">{globalPacketDropPercent}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="50"
            step="5"
            value={globalPacketDropPercent}
            onChange={(e) => setGlobalPacketDropPercent(Number(e.target.value))}
            className="w-full accent-red-500 h-1.5 bg-neutral-700/50 dark:bg-neutral-800 rounded-lg cursor-pointer"
          />
        </div>

        {/* Impact Summary and Reset */}
        <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between">
          <div className="text-[11px] text-[var(--text-muted)]">
            Affected Nodes: <strong className="text-red-500 dark:text-red-400 font-mono">{totalDeadNodes}</strong>
          </div>
          <button
            onClick={resetChaos}
            className="flex items-center gap-1 px-3 py-1 rounded-lg bg-[var(--bg-pill)] hover:opacity-80 text-[var(--text-main)] text-xs font-semibold border border-[var(--border-subtle)] transition-colors"
          >
            <RotateCcw className="w-3 h-3 text-emerald-500 dark:text-emerald-400" />
            <span>Reset All</span>
          </button>
        </div>
      </div>
    </div>
  );
};
