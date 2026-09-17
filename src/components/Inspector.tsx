import React from 'react';
import { 
  X, 
  Flame, 
  Trash2, 
  Cpu, 
  Clock, 
  Database, 
  AlertTriangle, 
  DollarSign, 
  Sliders, 
  ShieldCheck,
  Zap,
  Layers,
  Activity,
  Globe
} from 'lucide-react';
import { usePlaygroundStore } from '../store/usePlaygroundStore';
import { COMPONENT_CATALOG } from '../config/components';
import { AvailabilityZone, EvictionPolicy, LoadBalancerAlgorithm } from '../types/playground';

const ALL_AZS: AvailabilityZone[] = ['us-east-1a', 'us-east-1b', 'us-east-1c'];

export const Inspector: React.FC = () => {
  const {
    nodes,
    selectedNodeId,
    setSelectedNodeId,
    updateNodeData,
    toggleNodeKillSwitch,
    deleteNode,
  } = usePlaygroundStore();

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  if (!selectedNode) {
    return (
      <aside className="w-80 h-[calc(100vh-3.5rem)] bg-[var(--bg-surface)] border-l border-[var(--border-subtle)] p-6 flex flex-col items-center justify-center text-center z-20 select-none transition-colors duration-200">
        <div className="w-12 h-12 rounded-xl bg-[var(--bg-pill)] border border-[var(--border-subtle)] flex items-center justify-center text-neutral-400 mb-3 shadow-inner">
          <Sliders className="w-5 h-5" />
        </div>
        <div className="text-sm font-semibold text-[var(--text-main)]">No Node Selected</div>
        <div className="text-xs text-[var(--text-muted)] mt-1 max-w-[200px] leading-relaxed">
          Select any node on the canvas to configure capacity, resilience, and test failure scenarios.
        </div>
      </aside>
    );
  }

  const data = selectedNode.data;
  const meta = COMPONENT_CATALOG[data.typeId];
  const isClient = data.typeId === 'traffic_generator';

  return (
    <aside className="w-80 h-[calc(100vh-3.5rem)] bg-[var(--bg-surface)] border-l border-[var(--border-subtle)] flex flex-col z-20 select-none overflow-y-auto custom-scrollbar transition-colors duration-200">
      {/* Header */}
      <div className="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-panel)]">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0"
            style={{ backgroundColor: `${meta?.color || '#3b82f6'}25`, color: meta?.color || '#3b82f6' }}
          >
            <Cpu className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-[var(--text-main)] truncate">Node Configuration</div>
            <div className="text-[10px] text-[var(--text-muted)] font-medium">{meta?.name}</div>
          </div>
        </div>
        <button
          onClick={() => setSelectedNodeId(null)}
          className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main Parameters */}
      <div className="p-4 space-y-5 flex-1">
        {/* Node Label */}
        <div>
          <label className="text-[11px] font-semibold text-[var(--text-main)] uppercase tracking-wider block mb-1.5">
            Display Label
          </label>
          <input
            type="text"
            value={data.label}
            onChange={(e) => updateNodeData(selectedNode.id, { label: e.target.value })}
            className="w-full bg-[var(--bg-pill)] border border-[var(--border-subtle)] rounded-lg px-3 py-1.5 text-xs text-[var(--text-main)] font-medium focus:outline-none focus:border-blue-500/80 transition-colors"
          />
        </div>

        {/* Availability Zone Selector */}
        <div>
          <label className="text-[11px] font-semibold text-neutral-300 uppercase tracking-wider block mb-1.5 flex items-center gap-1">
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            Cloud Availability Zone
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {ALL_AZS.map((az) => (
              <button
                key={az}
                onClick={() => updateNodeData(selectedNode.id, { availabilityZone: az })}
                className={`py-1.5 px-2 rounded-lg text-xs font-mono font-semibold border transition-all ${
                  data.availabilityZone === az
                    ? 'bg-blue-600/30 text-blue-300 border-blue-500/60 shadow-sm'
                    : 'bg-[#0e1117] text-neutral-400 border-white/10 hover:text-neutral-200'
                }`}
              >
                {az.replace('us-east-', '')}
              </button>
            ))}
          </div>
        </div>

        {/* Chaos Kill Switch */}
        <div className="p-3.5 rounded-xl bg-[#0e1117] border border-white/10 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Flame className={`w-4 h-4 ${data.isKilled ? 'text-red-500 animate-bounce' : 'text-amber-500'}`} />
              <span className="text-xs font-bold text-neutral-200">Chaos Kill Switch</span>
            </div>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                data.isKilled
                  ? 'bg-red-950 text-red-400 border border-red-800'
                  : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
              }`}
            >
              {data.isKilled ? 'DEAD' : 'ACTIVE'}
            </span>
          </div>
          <p className="text-[11px] text-neutral-400 leading-snug">
            Simulate a localized crash to test upstream failover and load balancer retry.
          </p>
          <button
            onClick={() => toggleNodeKillSwitch(selectedNode.id)}
            className={`w-full py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm ${
              data.isKilled
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                : 'bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>{data.isKilled ? 'Revive Node' : 'Kill Node (Simulate Crash)'}</span>
          </button>
        </div>

        {/* Specialized Parameters based on node type */}
        {/* 1. Cache Specific Settings */}
        {data.typeId === 'cache' && (
          <div className="p-3.5 rounded-xl bg-[#0e1117] border border-amber-500/20 space-y-3">
            <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" />
              Redis Cache Parameters
            </div>

            {/* Cache Hit Rate */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-neutral-300 font-medium">Cache Hit Rate</span>
                <span className="font-mono font-bold text-amber-400">{data.hitRatePercent ?? 85}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={data.hitRatePercent ?? 85}
                onChange={(e) => updateNodeData(selectedNode.id, { hitRatePercent: Number(e.target.value) })}
                className="w-full accent-amber-500 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
              />
              <span className="text-[10px] text-neutral-400 block mt-0.5">
                {100 - (data.hitRatePercent ?? 85)}% cache misses forward to database
              </span>
            </div>

            {/* Eviction Policy */}
            <div>
              <label className="text-[11px] text-neutral-300 font-medium block mb-1">Eviction Policy</label>
              <select
                value={data.evictionPolicy ?? 'LRU'}
                onChange={(e) => updateNodeData(selectedNode.id, { evictionPolicy: e.target.value as EvictionPolicy })}
                className="w-full bg-[#161922] border border-white/10 rounded-lg px-2.5 py-1 text-xs text-neutral-200 focus:outline-none"
              >
                <option value="LRU">Least Recently Used (LRU)</option>
                <option value="LFU">Least Frequently Used (LFU)</option>
                <option value="TTL">Volatile TTL Expiration</option>
              </select>
            </div>
          </div>
        )}

        {/* 2. Database Specific Settings */}
        {data.typeId === 'relational_db' && (
          <div className="p-3.5 rounded-xl bg-[#0e1117] border border-red-500/20 space-y-3">
            <div className="text-xs font-bold text-red-400 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5" />
              Database Parameters
            </div>

            {/* Read/Write Split */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-neutral-300 font-medium">Read / Write Ratio</span>
                <span className="font-mono font-bold text-red-400">
                  {data.readRatioPercent ?? 80}% Read / {100 - (data.readRatioPercent ?? 80)}% Write
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="95"
                value={data.readRatioPercent ?? 80}
                onChange={(e) => updateNodeData(selectedNode.id, { readRatioPercent: Number(e.target.value) })}
                className="w-full accent-red-500 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* Max Connection Pool */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-neutral-300 font-medium">Max Connection Pool</span>
                <span className="font-mono font-bold text-neutral-200">{data.connectionPoolSize ?? 200} conns</span>
              </div>
              <input
                type="range"
                min="20"
                max="1000"
                step="20"
                value={data.connectionPoolSize ?? 200}
                onChange={(e) => updateNodeData(selectedNode.id, { connectionPoolSize: Number(e.target.value) })}
                className="w-full accent-neutral-500 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* 3. Load Balancer / Gateway Circuit Breaker Settings */}
        {(data.typeId === 'load_balancer' || data.typeId === 'api_gateway') && (
          <div className="p-3.5 rounded-xl bg-[#0e1117] border border-purple-500/20 space-y-3">
            <div className="text-xs font-bold text-purple-400 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              Resilience & Circuit Breaking
            </div>

            {/* Circuit Breaker Toggle */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-neutral-300">Circuit Breaker</span>
              <button
                onClick={() => updateNodeData(selectedNode.id, { circuitBreakerEnabled: !data.circuitBreakerEnabled })}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                  data.circuitBreakerEnabled
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-neutral-800 text-neutral-400'
                }`}
              >
                {data.circuitBreakerEnabled ? 'Enabled' : 'Disabled'}
              </button>
            </div>

            {/* Routing Strategy */}
            <div>
              <label className="text-[11px] text-neutral-300 font-medium block mb-1">Routing Strategy</label>
              <select
                value={data.lbAlgorithm ?? 'round_robin'}
                onChange={(e) => updateNodeData(selectedNode.id, { lbAlgorithm: e.target.value as LoadBalancerAlgorithm })}
                className="w-full bg-[#161922] border border-white/10 rounded-lg px-2.5 py-1 text-xs text-neutral-200 focus:outline-none"
              >
                <option value="round_robin">Round Robin</option>
                <option value="least_conn">Least Connections</option>
                <option value="ip_hash">IP Hash Sticky Session</option>
              </select>
            </div>
          </div>
        )}

        {/* General Hardware Configuration Sliders */}
        <div className="space-y-4 pt-1">
          {/* Instance Scaling */}
          {!isClient && (
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-neutral-300 font-medium">Instances (Scale)</span>
                <span className="font-mono font-bold text-blue-400">{data.instanceCount}x</span>
              </div>
              <input
                type="range"
                min="1"
                max="16"
                value={data.instanceCount}
                onChange={(e) => updateNodeData(selectedNode.id, { instanceCount: Number(e.target.value) })}
                className="w-full accent-blue-500 h-1.5 bg-[#0e1117] rounded-lg cursor-pointer"
              />
            </div>
          )}

          {/* Processing Capacity (RPS) */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-neutral-300 font-medium">Max Capacity per Node</span>
              <span className="font-mono font-bold text-emerald-400">{data.capacityRps.toLocaleString()} RPS</span>
            </div>
            <input
              type="range"
              min="100"
              max="50000"
              step="100"
              value={data.capacityRps}
              onChange={(e) => updateNodeData(selectedNode.id, { capacityRps: Number(e.target.value) })}
              className="w-full accent-emerald-500 h-1.5 bg-[#0e1117] rounded-lg cursor-pointer"
            />
          </div>

          {/* Base Latency ms */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-neutral-300 font-medium">Base Execution Latency</span>
              <span className="font-mono font-bold text-amber-400">{data.latencyMs} ms</span>
            </div>
            <input
              type="range"
              min="1"
              max="250"
              value={data.latencyMs}
              onChange={(e) => updateNodeData(selectedNode.id, { latencyMs: Number(e.target.value) })}
              className="w-full accent-amber-500 h-1.5 bg-[#0e1117] rounded-lg cursor-pointer"
            />
          </div>

          {/* Queue Max Buffer */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-neutral-300 font-medium">Queue Buffer Depth</span>
              <span className="font-mono font-bold text-purple-400">{data.maxQueueDepth} req</span>
            </div>
            <input
              type="range"
              min="50"
              max="5000"
              step="50"
              value={data.maxQueueDepth}
              onChange={(e) => updateNodeData(selectedNode.id, { maxQueueDepth: Number(e.target.value) })}
              className="w-full accent-purple-500 h-1.5 bg-[#0e1117] rounded-lg cursor-pointer"
            />
          </div>

          {/* Hourly Cost */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-neutral-300 font-medium">Cost / Node / Hr</span>
              <span className="font-mono font-bold text-cyan-400">${data.costPerHour}/hr</span>
            </div>
            <input
              type="range"
              min="0.01"
              max="3.00"
              step="0.01"
              value={data.costPerHour}
              onChange={(e) => updateNodeData(selectedNode.id, { costPerHour: Number(e.target.value) })}
              className="w-full accent-cyan-500 h-1.5 bg-[#0e1117] rounded-lg cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Delete Action */}
      <div className="p-4 border-t border-white/10 bg-[#13161f]">
        <button
          onClick={() => deleteNode(selectedNode.id)}
          className="w-full py-2 px-3 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          <span>Remove Node from Canvas</span>
        </button>
      </div>
    </aside>
  );
};
