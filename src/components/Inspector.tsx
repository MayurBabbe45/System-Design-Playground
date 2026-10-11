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
import { ComponentIcon } from './icons/ComponentIcons';

const ALL_AZS: AvailabilityZone[] = ['us-east-1a', 'us-east-1b', 'us-east-1c'];

export const Inspector: React.FC = () => {
  const {
    nodes,
    edges,
    selectedNodeId,
    setSelectedNodeId,
    updateNodeData,
    updateNodeDnsSettings,
    updateNodeWafSettings,
    updateNodeServerlessSettings,
    updateNodeQueueSettings,
    updateNodeExternalApiSettings,
    toggleNodeKillSwitch,
    deleteNode,
  } = usePlaygroundStore();

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedNodeId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setSelectedNodeId]);

  if (!selectedNode) {
    return null;
  }

  const data = selectedNode.data;
  const meta = COMPONENT_CATALOG[data.typeId];
  const isClient = data.typeId === 'traffic_generator';

  return (
    <aside className="w-80 h-[calc(100vh-3.25rem)] bg-[var(--bg-surface)] border-l border-[var(--border-subtle)] flex flex-col z-20 select-none overflow-y-auto custom-scrollbar shadow-2xl animate-in slide-in-from-right-8 duration-200 transition-colors">
      {/* Header */}
      <div className="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-panel)]">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs border border-white/10 dark:border-white/5"
            style={{
              background: `linear-gradient(135deg, ${meta?.color || '#3b82f6'}25 0%, ${meta?.color || '#3b82f6'}10 100%)`,
            }}
          >
            <ComponentIcon typeId={data.typeId} size={26} color={meta?.color || '#3b82f6'} />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-[var(--text-main)] truncate">Node Configuration</div>
            <div className="text-[10px] text-[var(--text-muted)] font-medium">{meta?.name}</div>
          </div>
        </div>
        <button
          onClick={() => setSelectedNodeId(null)}
          className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-pill)] transition-colors cursor-pointer"
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
          <label className="text-[11px] font-semibold text-[var(--text-main)] uppercase tracking-wider block mb-1.5 flex items-center gap-1">
            <Globe className="w-3.5 h-3.5 text-cyan-500 dark:text-cyan-400" />
            Cloud Availability Zone
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {ALL_AZS.map((az) => (
              <button
                key={az}
                onClick={() => updateNodeData(selectedNode.id, { availabilityZone: az })}
                className={`py-1.5 px-2 rounded-lg text-xs font-mono font-semibold border transition-all ${
                  data.availabilityZone === az
                    ? 'bg-blue-600/20 text-blue-600 dark:text-blue-300 border-blue-500 shadow-sm'
                    : 'bg-[var(--bg-pill)] text-[var(--text-muted)] border-[var(--border-subtle)] hover:text-[var(--text-main)]'
                }`}
              >
                {az.replace('us-east-', '')}
              </button>
            ))}
          </div>
        </div>

        {/* Chaos Kill Switch */}
        <div className="p-3.5 rounded-xl bg-[var(--bg-pill)] border border-[var(--border-subtle)] space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Flame className={`w-4 h-4 ${data.isKilled ? 'text-red-500 animate-bounce' : 'text-amber-500'}`} />
              <span className="text-xs font-bold text-[var(--text-main)]">Chaos Kill Switch</span>
            </div>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                data.isKilled
                  ? 'bg-red-500/15 text-red-500 border border-red-500/30'
                  : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
              }`}
            >
              {data.isKilled ? 'DEAD' : 'ACTIVE'}
            </span>
          </div>
          <p className="text-[11px] text-[var(--text-muted)] leading-snug">
            Simulate a localized crash to test upstream failover and load balancer retry.
          </p>
          <button
            onClick={() => toggleNodeKillSwitch(selectedNode.id)}
            className={`w-full py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm ${
              data.isKilled
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                : 'bg-red-500/15 hover:bg-red-500/25 text-red-600 dark:text-red-300 border border-red-500/40'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>{data.isKilled ? 'Revive Node' : 'Kill Node (Simulate Crash)'}</span>
          </button>
        </div>

        {/* Specialized Parameters based on node type */}
        {/* 1. Cache Specific Settings */}
        {data.typeId === 'cache' && (
          <div className="p-3.5 rounded-xl bg-[var(--bg-pill)] border border-amber-500/30 space-y-3">
            <div className="text-xs font-bold text-amber-500 dark:text-amber-400 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" />
              Redis Cache Parameters
            </div>

            {/* Cache Hit Rate */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[var(--text-main)] font-medium">Cache Hit Rate</span>
                <span className="font-mono font-bold text-amber-500 dark:text-amber-400">{data.hitRatePercent ?? 85}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={data.hitRatePercent ?? 85}
                onChange={(e) => updateNodeData(selectedNode.id, { hitRatePercent: Number(e.target.value) })}
                className="w-full accent-amber-500 h-1.5 bg-[var(--bg-panel)] rounded-lg cursor-pointer"
              />
              <span className="text-[10px] text-[var(--text-muted)] block mt-0.5">
                {100 - (data.hitRatePercent ?? 85)}% cache misses forward to database
              </span>
            </div>

            {/* Eviction Policy */}
            <div>
              <label className="text-[11px] text-[var(--text-main)] font-medium block mb-1">Eviction Policy</label>
              <select
                value={data.evictionPolicy ?? 'LRU'}
                onChange={(e) => updateNodeData(selectedNode.id, { evictionPolicy: e.target.value as EvictionPolicy })}
                className="w-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg px-2.5 py-1 text-xs text-[var(--text-main)] focus:outline-none"
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
          <div className="p-3.5 rounded-xl bg-[var(--bg-pill)] border border-red-500/30 space-y-3">
            <div className="text-xs font-bold text-red-500 dark:text-red-400 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5" />
              Database Parameters
            </div>

            {/* Read/Write Split */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[var(--text-main)] font-medium">Read / Write Ratio</span>
                <span className="font-mono font-bold text-red-500 dark:text-red-400">
                  {data.readRatioPercent ?? 80}% Read / {100 - (data.readRatioPercent ?? 80)}% Write
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="95"
                value={data.readRatioPercent ?? 80}
                onChange={(e) => updateNodeData(selectedNode.id, { readRatioPercent: Number(e.target.value) })}
                className="w-full accent-red-500 h-1.5 bg-[var(--bg-panel)] rounded-lg cursor-pointer"
              />
            </div>

            {/* Max Connection Pool */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[var(--text-main)] font-medium">Max Connection Pool</span>
                <span className="font-mono font-bold text-[var(--text-main)]">{data.connectionPoolSize ?? 200} conns</span>
              </div>
              <input
                type="range"
                min="20"
                max="1000"
                step="20"
                value={data.connectionPoolSize ?? 200}
                onChange={(e) => updateNodeData(selectedNode.id, { connectionPoolSize: Number(e.target.value) })}
                className="w-full accent-blue-500 h-1.5 bg-[var(--bg-panel)] rounded-lg cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* 3. Load Balancer / Gateway Circuit Breaker Settings */}
        {(data.typeId === 'load_balancer' || data.typeId === 'api_gateway') && (
          <div className="p-3.5 rounded-xl bg-[var(--bg-pill)] border border-purple-500/30 space-y-3">
            <div className="text-xs font-bold text-purple-500 dark:text-purple-400 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              Resilience & Circuit Breaking
            </div>

            {/* Circuit Breaker Toggle */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--text-main)]">Circuit Breaker</span>
              <button
                onClick={() => updateNodeData(selectedNode.id, { circuitBreakerEnabled: !data.circuitBreakerEnabled })}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                  data.circuitBreakerEnabled
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-[var(--bg-panel)] text-[var(--text-muted)] border border-[var(--border-subtle)]'
                }`}
              >
                {data.circuitBreakerEnabled ? 'Enabled' : 'Disabled'}
              </button>
            </div>

            {/* Routing Strategy */}
            <div>
              <label className="text-[11px] text-[var(--text-main)] font-medium block mb-1">Routing Strategy</label>
              <select
                value={data.lbAlgorithm ?? 'round_robin'}
                onChange={(e) => updateNodeData(selectedNode.id, { lbAlgorithm: e.target.value as LoadBalancerAlgorithm })}
                className="w-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg px-2.5 py-1 text-xs text-[var(--text-main)] focus:outline-none"
              >
                <option value="round_robin">Round Robin</option>
                <option value="least_conn">Least Connections</option>
                <option value="ip_hash">IP Hash Sticky Session</option>
              </select>
            </div>
          </div>
        )}

        {/* 4. DNS Router (Route 53) Settings */}
        {data.typeId === 'dns_router' && (
          <div className="p-3.5 rounded-xl bg-[var(--bg-pill)] border border-sky-500/30 space-y-3">
            <div className="text-xs font-bold text-sky-500 dark:text-sky-400 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5" />
              Route 53 DNS Routing Strategy
            </div>

            <div className="grid grid-cols-2 gap-1.5 bg-[var(--bg-panel)] p-1 rounded-lg border border-[var(--border-subtle)]">
              <button
                type="button"
                onClick={() => updateNodeDnsSettings(selectedNode.id, 'weighted', data.dnsWeights, data.primaryTargetId)}
                className={`py-1 text-[11px] font-semibold rounded-md transition-colors ${
                  (data.dnsRoutingMode ?? 'weighted') === 'weighted'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
              >
                Weighted Split
              </button>
              <button
                type="button"
                onClick={() => updateNodeDnsSettings(selectedNode.id, 'failover', data.dnsWeights, data.primaryTargetId)}
                className={`py-1 text-[11px] font-semibold rounded-md transition-colors ${
                  data.dnsRoutingMode === 'failover'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
              >
                Failover (Active/Passive)
              </button>
            </div>

            {data.dnsRoutingMode === 'failover' ? (
              <div>
                <label className="text-[11px] text-[var(--text-main)] font-medium block mb-1">Primary Target Node</label>
                <select
                  value={data.primaryTargetId ?? ''}
                  onChange={(e) => updateNodeDnsSettings(selectedNode.id, 'failover', data.dnsWeights, e.target.value)}
                  className="w-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg px-2.5 py-1 text-xs text-[var(--text-main)] focus:outline-none"
                >
                  <option value="">Auto (First Target)</option>
                  {edges
                    .filter((e) => e.source === selectedNode.id)
                    .map((edge) => {
                      const targetNode = nodes.find((n) => n.id === edge.target);
                      return (
                        <option key={edge.target} value={edge.target}>
                          {targetNode?.data.label || edge.target}
                        </option>
                      );
                    })}
                </select>
              </div>
            ) : (
              <div className="space-y-2">
                <span className="text-[11px] text-[var(--text-muted)] block">Target Weight Distribution</span>
                {edges
                  .filter((e) => e.source === selectedNode.id)
                  .map((edge) => {
                    const targetNode = nodes.find((n) => n.id === edge.target);
                    const currentWeight = (data.dnsWeights?.[edge.target] ?? 50);
                    return (
                      <div key={edge.target}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-[var(--text-main)] truncate max-w-[140px]">{targetNode?.data.label || edge.target}</span>
                          <span className="font-mono font-bold text-sky-500">{currentWeight}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={currentWeight}
                          onChange={(e) => {
                            const newWeights = { ...(data.dnsWeights || {}), [edge.target]: Number(e.target.value) };
                            updateNodeDnsSettings(selectedNode.id, 'weighted', newWeights, data.primaryTargetId);
                          }}
                          className="w-full accent-sky-500 h-1.5 bg-[var(--bg-panel)] rounded-lg cursor-pointer"
                        />
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}

        {/* 5. WAF Security Parameters */}
        {data.typeId === 'waf' && (
          <div className="p-3.5 rounded-xl bg-[var(--bg-pill)] border border-rose-500/30 space-y-3">
            <div className="text-xs font-bold text-rose-500 dark:text-rose-400 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              WAF Firewall & Rate Limiting
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[var(--text-main)] font-medium">Rate Limit Ceiling</span>
                <span className="font-mono font-bold text-rose-500">{(data.rateLimitRps ?? 20000).toLocaleString()} RPS</span>
              </div>
              <input
                type="range"
                min="500"
                max="50000"
                step="500"
                value={data.rateLimitRps ?? 20000}
                onChange={(e) => updateNodeWafSettings(selectedNode.id, Number(e.target.value), data.inspectionLatencyMs ?? 3)}
                className="w-full accent-rose-500 h-1.5 bg-[var(--bg-panel)] rounded-lg cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[var(--text-main)] font-medium">Inspection Latency</span>
                <span className="font-mono font-bold text-amber-500">{data.inspectionLatencyMs ?? 3} ms</span>
              </div>
              <input
                type="range"
                min="1"
                max="25"
                value={data.inspectionLatencyMs ?? 3}
                onChange={(e) => updateNodeWafSettings(selectedNode.id, data.rateLimitRps ?? 20000, Number(e.target.value))}
                className="w-full accent-amber-500 h-1.5 bg-[var(--bg-panel)] rounded-lg cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* 6. Serverless Lambda Parameters */}
        {data.typeId === 'serverless_function' && (
          <div className="p-3.5 rounded-xl bg-[var(--bg-pill)] border border-orange-500/30 space-y-3">
            <div className="text-xs font-bold text-orange-500 dark:text-orange-400 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" />
              Serverless Concurrency & Cold Starts
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[var(--text-main)] font-medium">Cold Start Penalty</span>
                <span className="font-mono font-bold text-orange-500">{data.coldStartLatencyMs ?? 250} ms</span>
              </div>
              <input
                type="range"
                min="50"
                max="1500"
                step="50"
                value={data.coldStartLatencyMs ?? 250}
                onChange={(e) => updateNodeServerlessSettings(selectedNode.id, Number(e.target.value), data.warmConcurrency ?? 10)}
                className="w-full accent-orange-500 h-1.5 bg-[var(--bg-panel)] rounded-lg cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[var(--text-main)] font-medium">Warm Concurrency Pool</span>
                <span className="font-mono font-bold text-blue-500">{data.warmConcurrency ?? 10} instances</span>
              </div>
              <input
                type="range"
                min="1"
                max="100"
                value={data.warmConcurrency ?? 10}
                onChange={(e) => updateNodeServerlessSettings(selectedNode.id, data.coldStartLatencyMs ?? 250, Number(e.target.value))}
                className="w-full accent-blue-500 h-1.5 bg-[var(--bg-panel)] rounded-lg cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* 7. Background Worker & Queue Settings */}
        {(data.typeId === 'background_worker' || data.typeId === 'standard_queue') && (
          <div className="p-3.5 rounded-xl bg-[var(--bg-pill)] border border-emerald-500/30 space-y-3">
            <div className="text-xs font-bold text-emerald-500 dark:text-emerald-400 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" />
              {data.typeId === 'background_worker' ? 'Worker Consumer Settings' : 'Queue Buffer Parameters'}
            </div>

            {data.typeId === 'background_worker' && (
              <>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[var(--text-main)] font-medium">Batch Consume Size</span>
                    <span className="font-mono font-bold text-emerald-500">{data.batchSize ?? 50} tasks</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="500"
                    step="5"
                    value={data.batchSize ?? 50}
                    onChange={(e) => updateNodeQueueSettings(selectedNode.id, data.maxQueueDepth, Number(e.target.value), data.pollIntervalMs)}
                    className="w-full accent-emerald-500 h-1.5 bg-[var(--bg-panel)] rounded-lg cursor-pointer"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[var(--text-main)] font-medium">Poll Cadence</span>
                    <span className="font-mono font-bold text-purple-500">{data.pollIntervalMs ?? 100} ms</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="1000"
                    step="10"
                    value={data.pollIntervalMs ?? 100}
                    onChange={(e) => updateNodeQueueSettings(selectedNode.id, data.maxQueueDepth, data.batchSize, Number(e.target.value))}
                    className="w-full accent-purple-500 h-1.5 bg-[var(--bg-panel)] rounded-lg cursor-pointer"
                  />
                </div>
              </>
            )}

            {data.typeId === 'standard_queue' && (
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[var(--text-main)] font-medium">Max FIFO Buffer Depth</span>
                  <span className="font-mono font-bold text-emerald-500">{(data.maxQueueDepth ?? 10000).toLocaleString()} req</span>
                </div>
                <input
                  type="range"
                  min="500"
                  max="50000"
                  step="500"
                  value={data.maxQueueDepth ?? 10000}
                  onChange={(e) => updateNodeQueueSettings(selectedNode.id, Number(e.target.value))}
                  className="w-full accent-emerald-500 h-1.5 bg-[var(--bg-panel)] rounded-lg cursor-pointer"
                />
              </div>
            )}
          </div>
        )}

        {/* 8. External API (Chaos Testing & Timeout) */}
        {data.typeId === 'external_api' && (
          <div className="p-3.5 rounded-xl bg-[var(--bg-pill)] border border-slate-500/30 space-y-3">
            <div className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5" />
              Chaos Engineering & 3rd-Party Latency
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[var(--text-main)] font-medium">Failure Rate (504 Timeout)</span>
                <span className="font-mono font-bold text-red-500">{data.failureRate ?? 0}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={data.failureRate ?? 0}
                onChange={(e) => updateNodeExternalApiSettings(selectedNode.id, data.latencyMs, Number(e.target.value), data.timeoutThresholdMs)}
                className="w-full accent-red-500 h-1.5 bg-[var(--bg-panel)] rounded-lg cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[var(--text-main)] font-medium">Timeout Cutoff</span>
                <span className="font-mono font-bold text-amber-500">{data.timeoutThresholdMs ?? 2000} ms</span>
              </div>
              <input
                type="range"
                min="500"
                max="5000"
                step="100"
                value={data.timeoutThresholdMs ?? 2000}
                onChange={(e) => updateNodeExternalApiSettings(selectedNode.id, data.latencyMs, data.failureRate, Number(e.target.value))}
                className="w-full accent-amber-500 h-1.5 bg-[var(--bg-panel)] rounded-lg cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* General Hardware Configuration Sliders */}
        <div className="space-y-4 pt-1">
          {/* Instance Scaling */}
          {!isClient && (
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[var(--text-main)] font-medium">Instances (Scale)</span>
                <span className="font-mono font-bold text-blue-500 dark:text-blue-400">{data.instanceCount}x</span>
              </div>
              <input
                type="range"
                min="1"
                max="16"
                value={data.instanceCount}
                onChange={(e) => updateNodeData(selectedNode.id, { instanceCount: Number(e.target.value) })}
                className="w-full accent-blue-500 h-1.5 bg-[var(--bg-panel)] rounded-lg cursor-pointer"
              />
            </div>
          )}

          {/* Processing Capacity (RPS) */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-[var(--text-main)] font-medium">Max Capacity per Node</span>
              <span className="font-mono font-bold text-emerald-500 dark:text-emerald-400">{data.capacityRps.toLocaleString()} RPS</span>
            </div>
            <input
              type="range"
              min="100"
              max="50000"
              step="100"
              value={data.capacityRps}
              onChange={(e) => updateNodeData(selectedNode.id, { capacityRps: Number(e.target.value) })}
              className="w-full accent-emerald-500 h-1.5 bg-[var(--bg-panel)] rounded-lg cursor-pointer"
            />
          </div>

          {/* Base Latency ms */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-[var(--text-main)] font-medium">Base Execution Latency</span>
              <span className="font-mono font-bold text-amber-500 dark:text-amber-400">{data.latencyMs} ms</span>
            </div>
            <input
              type="range"
              min="0"
              max="250"
              value={data.latencyMs}
              onChange={(e) => updateNodeData(selectedNode.id, { latencyMs: Number(e.target.value) })}
              className="w-full accent-amber-500 h-1.5 bg-[var(--bg-panel)] rounded-lg cursor-pointer"
            />
          </div>

          {/* Queue Max Buffer */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-[var(--text-main)] font-medium">Queue Buffer Depth</span>
              <span className="font-mono font-bold text-purple-500 dark:text-purple-400">{data.maxQueueDepth} req</span>
            </div>
            <input
              type="range"
              min="50"
              max="5000"
              step="50"
              value={data.maxQueueDepth}
              onChange={(e) => updateNodeData(selectedNode.id, { maxQueueDepth: Number(e.target.value) })}
              className="w-full accent-purple-500 h-1.5 bg-[var(--bg-panel)] rounded-lg cursor-pointer"
            />
          </div>

          {/* Hourly Cost */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-[var(--text-main)] font-medium">Cost / Node / Hr</span>
              <span className="font-mono font-bold text-cyan-500 dark:text-cyan-400">${data.costPerHour}/hr</span>
            </div>
            <input
              type="range"
              min="0.01"
              max="3.00"
              step="0.01"
              value={data.costPerHour}
              onChange={(e) => updateNodeData(selectedNode.id, { costPerHour: Number(e.target.value) })}
              className="w-full accent-cyan-500 h-1.5 bg-[var(--bg-panel)] rounded-lg cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Delete Action */}
      <div className="p-4 border-t border-[var(--border-subtle)] bg-[var(--bg-panel)]">
        <button
          onClick={() => deleteNode(selectedNode.id)}
          className="w-full py-2 px-3 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 dark:text-red-400 border border-red-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <Trash2 className="w-4 h-4" />
          <span>Remove Node from Canvas</span>
        </button>
      </div>
    </aside>
  );
};
