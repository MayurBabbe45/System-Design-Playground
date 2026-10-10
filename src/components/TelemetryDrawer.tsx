import React, { useState } from 'react';
import { 
  ChevronUp, 
  ChevronDown, 
  Activity, 
  Clock, 
  Layers, 
  AlertOctagon, 
  BarChart3,
  Gauge
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import { usePlaygroundStore } from '../store/usePlaygroundStore';

export const TelemetryDrawer: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'throughput' | 'latency' | 'queue' | 'utilization'>('throughput');
  
  const telemetryHistory = usePlaygroundStore((state) => state.telemetryHistory);
  const selectedNodeId = usePlaygroundStore((state) => state.selectedNodeId);
  const isSimulating = usePlaygroundStore((state) => state.isSimulating);

  // Format data for Recharts
  const chartData = telemetryHistory.map((pt, idx) => ({
    time: `-${telemetryHistory.length - idx}s`,
    Target: pt.totalTargetRps,
    Processed: pt.totalProcessedRps,
    Dropped: pt.totalDroppedRps,
    Latency: pt.p95LatencyMs,
    Queue: pt.activeQueueTotal,
    Utilization: pt.avgUtilizationPercent,
  }));

  const latest = telemetryHistory[telemetryHistory.length - 1] || {
    totalTargetRps: 0,
    totalProcessedRps: 0,
    totalDroppedRps: 0,
    p95LatencyMs: 0,
    activeQueueTotal: 0,
    avgUtilizationPercent: 0,
  };

  return (
    <div className={`fixed bottom-0 left-0 lg:left-68 ${selectedNodeId ? 'lg:right-80' : 'right-0'} z-20 transition-all duration-300 ${isOpen ? 'h-52' : 'h-8.5'}`}>
      {/* Toggle Header Bar */}
      <div 
        className="h-8.5 spatial-glass border-t border-white/10 px-3 sm:px-4 flex items-center justify-between cursor-pointer select-none transition-colors duration-200" 
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-3 text-xs overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1.5 font-bold text-[var(--text-main)] shrink-0">
            <Activity className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-[11px] uppercase tracking-wider">Telemetry</span>
          </div>

          <div className="h-3 w-px bg-white/10 shrink-0" />

          {/* Quick Stat Badges */}
          <div className="flex items-center gap-3 font-mono text-[11px] shrink-0">
            {isSimulating ? (
              <>
                <span className="text-[var(--text-muted)]">
                  Throughput: <strong className="text-emerald-400 font-semibold">{latest.totalProcessedRps.toLocaleString()} RPS</strong>
                </span>
                <span className="text-[var(--text-muted)]">
                  p95: <strong className="text-amber-400 font-semibold">{latest.p95LatencyMs}ms</strong>
                </span>
                <span className="text-[var(--text-muted)]">
                  Load: <strong className={latest.avgUtilizationPercent > 85 ? 'text-red-400 font-bold' : 'text-cyan-400 font-semibold'}>{latest.avgUtilizationPercent}%</strong>
                </span>
                <span className="text-[var(--text-muted)]">
                  Queue: <strong className={latest.activeQueueTotal > 50 ? 'text-red-400 font-bold' : 'text-[var(--text-main)] font-semibold'}>{latest.activeQueueTotal}</strong>
                </span>
                {latest.totalDroppedRps > 0 && (
                  <span className="text-rose-400 font-bold flex items-center gap-1 animate-pulse">
                    <AlertOctagon className="w-3 h-3" />
                    {latest.totalDroppedRps.toLocaleString()} Drop!
                  </span>
                )}
              </>
            ) : (
              <div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)]">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                <span>Simulation Idle · Click <strong className="text-emerald-400">Simulate</strong> to start real-time traffic</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[10px] font-medium text-[var(--text-muted)] hover:text-[var(--text-main)] shrink-0">
          <span>{isOpen ? 'Hide Charts' : 'Show Charts'}</span>
          <button className="p-0.5 rounded transition-colors cursor-pointer">
            {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Drawer Chart Area */}
      {isOpen && (
        <div className="h-[calc(13rem-2.25rem)] spatial-glass border-x border-white/10 p-3 flex flex-col justify-between transition-colors duration-200">
          {/* Tabs */}
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex gap-1.5">
              <button
                onClick={() => setActiveTab('throughput')}
                className={`px-3 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'throughput'
                    ? 'spatial-pill bg-white/10 text-emerald-400 border border-emerald-500/40 shadow-xs'
                    : 'spatial-pill text-[var(--text-muted)] hover:text-white border border-transparent'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                Throughput (RPS)
              </button>
              <button
                onClick={() => setActiveTab('latency')}
                className={`px-3 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'latency'
                    ? 'spatial-pill bg-white/10 text-amber-400 border border-amber-500/40 shadow-xs'
                    : 'spatial-pill text-[var(--text-muted)] hover:text-white border border-transparent'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                p95 Latency (ms)
              </button>
              <button
                onClick={() => setActiveTab('utilization')}
                className={`px-3 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'utilization'
                    ? 'spatial-pill bg-white/10 text-cyan-400 border border-cyan-500/40 shadow-xs'
                    : 'spatial-pill text-[var(--text-muted)] hover:text-white border border-transparent'
                }`}
              >
                <Gauge className="w-3.5 h-3.5" />
                Capacity Utilization %
              </button>
              <button
                onClick={() => setActiveTab('queue')}
                className={`px-3 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'queue'
                    ? 'spatial-pill bg-white/10 text-purple-400 border border-purple-500/40 shadow-xs'
                    : 'spatial-pill text-[var(--text-muted)] hover:text-white border border-transparent'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                Queue Depth
              </button>
            </div>
            <div className="text-[10px] text-[var(--text-muted)] font-mono">
              Web Worker Discrete-Event Sampling
            </div>
          </div>

          {/* Recharts Area Chart */}
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorProcessed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2ea043" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#2ea043" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#d29922" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#d29922" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorUtil" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#388bfd" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#388bfd" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorQueue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a371f7" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#a371f7" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                <XAxis dataKey="time" stroke="var(--text-muted)" fontSize={9} tickLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={9} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--bg-surface)',
                    borderColor: 'var(--border-card)',
                    color: 'var(--text-main)',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontFamily: 'monospace',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                  }}
                  itemStyle={{ color: 'var(--text-main)' }}
                  labelStyle={{ color: 'var(--text-muted)' }}
                />
                {activeTab === 'throughput' && (
                  <>
                    <Area type="monotone" dataKey="Processed" stroke="#2ea043" strokeWidth={2} fillOpacity={1} fill="url(#colorProcessed)" />
                    <Area type="monotone" dataKey="Dropped" stroke="#f85149" strokeWidth={2} fill="#f85149" fillOpacity={0.2} />
                  </>
                )}
                {activeTab === 'latency' && (
                  <Area type="monotone" dataKey="Latency" stroke="#d29922" strokeWidth={2} fillOpacity={1} fill="url(#colorLatency)" />
                )}
                {activeTab === 'utilization' && (
                  <Area type="monotone" dataKey="Utilization" stroke="#388bfd" strokeWidth={2} fillOpacity={1} fill="url(#colorUtil)" />
                )}
                {activeTab === 'queue' && (
                  <Area type="monotone" dataKey="Queue" stroke="#a371f7" strokeWidth={2} fillOpacity={1} fill="url(#colorQueue)" />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};
