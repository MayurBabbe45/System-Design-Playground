import React, { memo, useState, useEffect, useRef } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Zap } from 'lucide-react';
import { InfrastructureNodeData, ComponentTypeId } from '../../types/playground';
import { COMPONENT_CATALOG } from '../../config/components';
import { usePlaygroundStore } from '../../store/usePlaygroundStore';
import { ComponentIcon } from '../icons/ComponentIcons';

// Valid downstream components that can be quickly added via the (+) button
const CONNECTABLE_TYPES: ComponentTypeId[] = [
  'load_balancer',
  'web_server',
  'cache',
  'relational_db',
  'nosql_db',
  'message_queue',
  'object_storage',
  'api_gateway',
  'cdn',
];

export const InfrastructureNode: React.FC<NodeProps> = memo(({ id, data, selected }) => {
  const nodeData = data as unknown as InfrastructureNodeData;
  const setSelectedNodeId = usePlaygroundStore((state) => state.setSelectedNodeId);
  const appendConnectedNode = usePlaygroundStore((state) => state.appendConnectedNode);
  const isViewOnly = usePlaygroundStore((state) => state.isViewOnly);
  const killedAzs = usePlaygroundStore((state) => state.killedAzs);
  const canvasViewMode = usePlaygroundStore((state) => state.canvasViewMode);
  const meta = COMPONENT_CATALOG[nodeData.typeId];

  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  const isClient = nodeData.typeId === 'traffic_generator';
  const isAzKilled = nodeData.availabilityZone && killedAzs.includes(nodeData.availabilityZone);
  const isEffectivelyDead = nodeData.isKilled || isAzKilled;

  // Show detailed metrics pill under the node if canvas is in 'detailed' mode or selected
  const showDetails = canvasViewMode === 'detailed' || selected;

  // Close picker on click outside or Escape
  useEffect(() => {
    if (!isPickerOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsPickerOpen(false);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setIsPickerOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isPickerOpen]);

  const getStatusDot = () => {
    if (isEffectivelyDead) {
      return (
        <span
          className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-600 inline-block shrink-0"
          title={isAzKilled ? 'AZ Down' : 'Offline'}
        />
      );
    }
    if (nodeData.circuitBreakerState === 'OPEN') {
      return (
        <span
          className="w-2 h-2 rounded-full bg-amber-500 animate-ping inline-block shrink-0"
          title="Circuit Open"
        />
      );
    }
    if (nodeData.isBottleneck) {
      return (
        <span
          className="w-2 h-2 rounded-full bg-rose-500 animate-ping inline-block shrink-0"
          title="Bottleneck"
        />
      );
    }
    switch (nodeData.status) {
      case 'healthy':
        return (
          <span
            className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block shrink-0"
            title="Healthy"
          />
        );
      case 'warning':
        return (
          <span
            className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse inline-block shrink-0"
            title="High Load"
          />
        );
      case 'critical':
        return (
          <span
            className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse inline-block shrink-0"
            title="Overloaded"
          />
        );
      default:
        return null;
    }
  };

  const getCardBorder = () => {
    if (isEffectivelyDead) {
      return 'border-[var(--border-subtle)] opacity-50 grayscale';
    }
    if (nodeData.isBottleneck) {
      return 'border-rose-500 ring-2 ring-rose-500/60 shadow-[0_0_20px_rgba(244,63,94,0.35)] animate-pulse';
    }
    if (selected) {
      return 'border-blue-500 ring-2 ring-blue-500 shadow-md';
    }
    if (nodeData.status === 'critical') {
      return 'border-rose-500/80 shadow-[0_0_12px_rgba(244,63,94,0.25)]';
    }
    if (nodeData.status === 'warning') {
      return 'border-amber-500/80 shadow-[0_0_12px_rgba(245,158,11,0.25)]';
    }
    return 'border-[var(--border-card)] hover:border-blue-500/50 shadow-xs hover:shadow-md';
  };

  const utilPercent = nodeData.utilizationPercent || 0;

  return (
    <div className="flex flex-col items-center group select-none relative">
      {/* The n8n Node Card Shell */}
      <div
        onClick={() => setSelectedNodeId(id)}
        className={`relative flex items-center justify-center w-[76px] h-[76px] bg-[var(--bg-surface)] border transition-all duration-150 cursor-pointer ${
          isClient ? 'rounded-l-3xl rounded-r-2xl' : 'rounded-2xl'
        } ${getCardBorder()}`}
      >
        {/* Trigger Lightning Badge (Left of Trigger Node) */}
        {isClient && (
          <div
            className="absolute -left-6 top-1/2 -translate-y-1/2 flex items-center justify-center text-orange-500 animate-pulse"
            title="Ingress Traffic Trigger"
          >
            <Zap className="w-4 h-4 fill-orange-500 text-orange-500" />
          </div>
        )}

        {/* Target Connection Handle (Left) */}
        {!isClient && (
          <Handle
            type="target"
            position={Position.Left}
            className="n8n-handle n8n-handle-target !-left-2"
          />
        )}

        {/* Clean, Prominent n8n Center Symbol */}
        <div className="flex items-center justify-center transition-transform duration-150 group-hover:scale-105 pointer-events-none">
          <ComponentIcon typeId={nodeData.typeId} size={42} color={meta?.color} />
        </div>

        {/* Source Connection Handle (Right) */}
        <Handle
          type="source"
          position={Position.Right}
          className="n8n-handle n8n-handle-source !-right-2"
        />

        {/* n8n Plus Button: Interactive Quick-Add and Connect Next Node */}
        <button
          type="button"
          disabled={isViewOnly}
          onClick={(e) => {
            e.stopPropagation();
            if (!isViewOnly) setIsPickerOpen((prev) => !prev);
          }}
          title={isViewOnly ? 'View-Only Mode' : 'Quickly add and connect next node (+)'}
          className={`absolute -right-7 top-1/2 -translate-y-1/2 w-4 h-4 rounded border border-[var(--border-card)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-blue-500 hover:border-blue-400 hover:scale-110 active:scale-95 flex items-center justify-center text-[11px] font-bold shadow-xs transition-all cursor-pointer z-10 ${
            isPickerOpen
              ? 'border-blue-500 text-blue-500 ring-2 ring-blue-500/40 bg-blue-500/10'
              : 'opacity-80 hover:opacity-100'
          }`}
        >
          +
        </button>
      </div>

      {/* Quick Node Picker Popover */}
      {isPickerOpen && !isViewOnly && (
        <div
          ref={pickerRef}
          onClick={(e) => e.stopPropagation()}
          className="absolute left-[88px] top-4 z-50 w-56 bg-[var(--bg-surface)] border border-[var(--border-card)] rounded-xl shadow-2xl p-1.5 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="flex items-center justify-between px-2 py-1 border-b border-[var(--border-subtle)] mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Add Connected Node
            </span>
            <button
              type="button"
              onClick={() => setIsPickerOpen(false)}
              className="text-[var(--text-muted)] hover:text-[var(--text-main)] text-xs p-0.5 rounded cursor-pointer leading-none"
            >
              ✕
            </button>
          </div>
          <div className="max-h-56 overflow-y-auto space-y-0.5 custom-scrollbar">
            {CONNECTABLE_TYPES.map((type) => {
              const itemMeta = COMPONENT_CATALOG[type];
              if (!itemMeta) return null;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    appendConnectedNode(id, type);
                    setIsPickerOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left hover:bg-blue-500/10 hover:text-blue-500 text-[var(--text-main)] transition-colors cursor-pointer group/item"
                >
                  <div
                    className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 border border-white/5"
                    style={{
                      background: `linear-gradient(135deg, ${itemMeta.color}30 0%, ${itemMeta.color}15 100%)`,
                    }}
                  >
                    <ComponentIcon typeId={type} size={15} color={itemMeta.color} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium truncate group-hover/item:text-blue-500">
                      {itemMeta.name}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Node Label & Subtitle Below the Card (Matching n8n) */}
      <div className="mt-2 text-center max-w-[140px] px-1 pointer-events-none">
        <div className="text-xs font-bold text-[var(--text-main)] leading-snug truncate">
          {nodeData.label}
        </div>
        <div className="text-[10px] text-[var(--text-muted)] font-medium truncate flex items-center justify-center gap-1 mt-0.5">
          {getStatusDot()}
          <span>
            {nodeData.instanceCount > 1 ? `${nodeData.instanceCount}x · ` : ''}
            {meta?.name}
          </span>
        </div>
      </div>

      {/* Detailed Mode Metrics Pill (Appended Below When Detailed Mode is Active or Selected) */}
      {showDetails && (
        <div className="mt-1.5 px-2 py-1 rounded-lg bg-[var(--bg-pill)] border border-[var(--border-subtle)] text-[9px] font-mono shadow-xs space-y-0.5 text-center min-w-[110px] pointer-events-none animate-in fade-in duration-150">
          <div className="flex items-center justify-between gap-1 text-[8px] text-[var(--text-muted)] font-semibold uppercase">
            <span>RPS</span>
            <span className="text-blue-500 dark:text-blue-400 font-bold">
              {isEffectivelyDead ? '0' : nodeData.currentRps.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between gap-1 text-[8px] text-[var(--text-muted)] font-semibold uppercase">
            <span>Latency</span>
            <span className={`font-bold ${nodeData.currentLatency > 100 ? 'text-amber-500' : 'text-slate-700 dark:text-slate-300'}`}>
              {isEffectivelyDead ? '0ms' : `${nodeData.currentLatency}ms`}
            </span>
          </div>
          {!isClient && !isEffectivelyDead && (
            <div className="flex items-center justify-between gap-1 text-[8px] text-[var(--text-muted)] font-semibold uppercase">
              <span>Cap</span>
              <span className={`font-bold ${utilPercent >= 90 ? 'text-rose-500' : utilPercent >= 75 ? 'text-amber-500' : 'text-emerald-500 dark:text-emerald-400'}`}>
                {utilPercent}%
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

InfrastructureNode.displayName = 'InfrastructureNode';
