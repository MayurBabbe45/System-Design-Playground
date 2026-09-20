import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import * as Icons from 'lucide-react';
import { InfrastructureNodeData } from '../../types/playground';
import { COMPONENT_CATALOG } from '../../config/components';
import { usePlaygroundStore } from '../../store/usePlaygroundStore';

export const InfrastructureNode: React.FC<NodeProps> = memo(({ id, data, selected }) => {
  const nodeData = data as unknown as InfrastructureNodeData;
  const setSelectedNodeId = usePlaygroundStore((state) => state.setSelectedNodeId);
  const killedAzs = usePlaygroundStore((state) => state.killedAzs);
  const meta = COMPONENT_CATALOG[nodeData.typeId];

  // Dynamically resolve icon
  const IconComponent = (Icons as unknown as Record<string, React.ElementType>)[meta?.iconName || 'Cpu'] || Icons.Cpu;

  const isClient = nodeData.typeId === 'traffic_generator';
  const isAzKilled = nodeData.availabilityZone && killedAzs.includes(nodeData.availabilityZone);
  const isEffectivelyDead = nodeData.isKilled || isAzKilled;

  const getStatusBadge = () => {
    if (isEffectivelyDead) {
      return (
        <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-neutral-800 text-slate-700 dark:text-neutral-400 border border-slate-300 dark:border-neutral-700">
          <span className="w-1.5 h-1.5 rounded-full bg-neutral-500" />
          {isAzKilled ? 'AZ DOWN' : 'OFFLINE'}
        </span>
      );
    }
    if (nodeData.circuitBreakerState === 'OPEN') {
      return (
        <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-600 animate-pulse">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
          CIRCUIT OPEN
        </span>
      );
    }
    if (nodeData.isBottleneck) {
      return (
        <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300 border border-red-300 dark:border-red-700 animate-pulse">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
          BOTTLENECK
        </span>
      );
    }
    switch (nodeData.status) {
      case 'healthy':
        return (
          <span className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/60">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Healthy
          </span>
        );
      case 'warning':
        return (
          <span className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800/60">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            High Load
          </span>
        );
      case 'critical':
        return (
          <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950/80 text-red-800 dark:text-red-300 border border-red-300 dark:border-red-800 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
            Overloaded
          </span>
        );
      default:
        return null;
    }
  };

  const getCardBorder = () => {
    if (isEffectivelyDead) {
      return 'border-neutral-300 dark:border-neutral-800 opacity-60 filter grayscale';
    }
    if (nodeData.isBottleneck) {
      return 'border-red-500 ring-2 ring-red-500/50 shadow-[0_0_24px_rgba(239,68,68,0.35)]';
    }
    if (selected) {
      return 'border-blue-500 ring-2 ring-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.35)]';
    }
    if (nodeData.status === 'critical') {
      return 'border-red-500/60 shadow-[0_0_16px_rgba(239,68,68,0.2)]';
    }
    if (nodeData.status === 'warning') {
      return 'border-amber-500/60 shadow-[0_0_16px_rgba(245,158,11,0.2)]';
    }
    return 'border-[var(--border-card)] hover:border-blue-400/40 shadow-md shadow-black/5 dark:shadow-black/20';
  };

  const utilPercent = nodeData.utilizationPercent || 0;

  return (
    <div
      onClick={() => setSelectedNodeId(id)}
      className={`relative w-[245px] bg-[var(--bg-surface)] rounded-xl border p-3 cursor-pointer transition-all duration-150 shadow-sm ${getCardBorder()}`}
    >
      {/* Target Connection Handle (Left) */}
      {!isClient && (
        <Handle
          type="target"
          position={Position.Left}
          className="n8n-handle n8n-handle-target !-left-2"
        />
      )}

      {/* Header: Icon, Title, AZ Pill, Status */}
      <div className="flex items-start justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0 shadow-xs"
            style={{ backgroundColor: `${meta?.color || '#3b82f6'}25`, color: meta?.color || '#3b82f6' }}
          >
            <IconComponent className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold text-[var(--text-main)] truncate">
              {nodeData.label}
            </div>
            <div className="text-[10px] text-[var(--text-muted)] font-medium flex items-center gap-1.5">
              <span>{nodeData.instanceCount > 1 ? `${nodeData.instanceCount}x` : meta?.name}</span>
              {nodeData.availabilityZone && (
                <span className="px-1 py-0.2 rounded bg-[var(--bg-pill)] text-[9px] font-mono text-[var(--text-muted)] border border-[var(--border-subtle)]">
                  {nodeData.availabilityZone.replace('us-east-', '')}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="shrink-0">{getStatusBadge()}</div>
      </div>

      {/* Metrics Row: 3 cleanly separated stat pills */}
      <div className="grid grid-cols-3 gap-1 bg-[var(--bg-pill)] rounded-lg py-1.5 px-1 text-center mb-2 border border-[var(--border-subtle)]">
        <div>
          <div className="text-[8px] text-[var(--text-muted)] uppercase tracking-wider font-semibold">Throughput</div>
          <div className="text-[11px] font-bold font-mono text-blue-500 dark:text-blue-400">
            {isEffectivelyDead ? '0' : nodeData.currentRps.toLocaleString()}
          </div>
        </div>
        <div>
          <div className="text-[8px] text-[var(--text-muted)] uppercase tracking-wider font-semibold">Latency</div>
          <div className="text-[11px] font-bold font-mono text-amber-500 dark:text-amber-400">
            {isEffectivelyDead ? '0ms' : `${nodeData.currentLatency}ms`}
          </div>
        </div>
        <div>
          <div className="text-[8px] text-[var(--text-muted)] uppercase tracking-wider font-semibold">Queue</div>
          <div className={`text-[11px] font-bold font-mono ${nodeData.currentQueue > 50 ? 'text-red-500' : 'text-[var(--text-main)]'}`}>
            {isEffectivelyDead ? '0' : nodeData.currentQueue}
          </div>
        </div>
      </div>

      {/* Utilization Bar (for non-clients) */}
      {!isClient && !isEffectivelyDead && (
        <div className="space-y-0.5">
          <div className="flex items-center justify-between text-[9px] font-mono">
            <span className="text-[var(--text-muted)]">Capacity:</span>
            <span className={`font-bold ${utilPercent >= 90 ? 'text-red-500' : utilPercent >= 75 ? 'text-amber-500' : 'text-emerald-500 dark:text-emerald-400'}`}>
              {utilPercent}%
            </span>
          </div>
          <div className="w-full bg-[var(--bg-pill)] rounded-full h-1.5 overflow-hidden border border-[var(--border-subtle)]">
            <div
              className={`h-full rounded-full transition-all duration-200 ${
                utilPercent >= 90
                  ? 'bg-red-500'
                  : utilPercent >= 75
                  ? 'bg-amber-400'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, utilPercent)}%` }}
            />
          </div>
        </div>
      )}

      {/* Source Connection Handle (Right) */}
      <Handle
        type="source"
        position={Position.Right}
        className="n8n-handle n8n-handle-source !-right-2"
      />
    </div>
  );
});

InfrastructureNode.displayName = 'InfrastructureNode';
