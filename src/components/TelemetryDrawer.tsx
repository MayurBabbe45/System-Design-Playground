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
  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'throughput' | 'latency' | 'queue' | 'utilization'>('throughput');
  
  const telemetryHistory = usePlaygroundStore((state) => state.telemetryHistory);

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
    <div className={`fixed bottom-0 left-64 right-80 z-20 transition-all duration-300 ${isOpen ? 'h-52' : 'h-9'}`}>
      {/* Toggle Header Bar */}
      <div 
        className="h-9 bg-[var(--bg-surface)] border-t border-x border-[var(--border-subtle)] px-4 flex items-center justify-between cursor-pointer select-none shadow-md transition-colors duration-200" 
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-[var(--text-main)]">
            <Activity className="w-3.5 h-3.5 text-blue-400" />
            <span>REAL-TIME SYSTEM METRICS</span>
          </div>

          {/* Quick Stat Badges */}
          <div className="flex items-center gap-4 font-mono text-xs">
            <span className="text-[var(--text-muted)]">
              Throughput: <strong className="text-emerald-400 font-semibold">{latest.totalProcessedRps.toLocaleString()} RPS</strong>
            </span>
            <span className="text-[var(--text-muted)]">
              p95 Latency: <strong className="text-amber-400 font-semibold">{latest.p95LatencyMs} ms</strong>
            </span>
            <span className="text-[var(--text-muted)]">
              Avg Load: <strong className={latest.avgUtilizationPercent > 85 ? 'text-red-400 font-bold' : 'text-cyan-400 font-semibold'}>{latest.avgUtilizationPercent}%</strong>
            </span>
            <span className="text-[var(--text-muted)]">
              Queue: <strong className={latest.activeQueueTotal > 50 ? 'text-red-400 font-bold' : 'text-neutral-400 font-semibold'}>{latest.activeQueueTotal} req</strong>
            </span>
            {latest.totalDroppedRps > 0 && (
              <span className="text-red-400 font-bold flex items-center gap-1 animate-pulse">
                <AlertOctagon className="w-3 h-3" />
                {latest.totalDroppedRps.toLocaleString()} RPS Dropped!
              </span>
            )}
          </div>
        </div>

        <button className="text-[var(--text-muted)] hover:text-[var(--text-main)] p-1 rounded transition-colors cursor-pointer">
          {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>
      </div>

      {/* Drawer Chart Area */}
      {isOpen && (
        <div className="h-[calc(13rem-2.25rem)] bg-[var(--bg-panel)] border-x border-[var(--border-subtle)] p-3 flex flex-col justify-between transition-colors duration-200">
          {/* Tabs */}
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex gap-1.5">
              <button
                onClick={() => setActiveTab('throughput')}
                className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'throughput'
                    ? 'bg-[var(--bg-surface)] text-emerald-400 border border-emerald-500/40 shadow-sm'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                Throughput (RPS)
              </button>
              <button
                onClick={() => setActiveTab('latency')}
                className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'latency'
                    ? 'bg-[var(--bg-surface)] text-amber-400 border border-amber-500/40 shadow-sm'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                p95 Latency (ms)
              </button>
              <button
                onClick={() => setActiveTab('utilization')}
                className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'utilization'
                    ? 'bg-[var(--bg-surface)] text-cyan-400 border border-cyan-500/40 shadow-sm'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
              >
                <Gauge className="w-3.5 h-3.5" />
                Capacity Utilization %
              </button>
              <button
                onClick={() => setActiveTab('queue')}
                className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  activeTab === 'queue'
                    ? 'bg-[#1e2230] text-purple-400 border border-purple-500/40 shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                Queue Depth
              </button>
            </div>
            <div className="text-[10px] text-neutral-400 font-mono">
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
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="time" stroke="#484f58" fontSize={9} tickLine={false} />
                <YAxis stroke="#484f58" fontSize={9} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#161922',
                    borderColor: 'rgba(255,255,255,0.12)',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontFamily: 'monospace',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                  }}
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
