import React, { memo, useState, useEffect, useRef } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Zap } from 'lucide-react';
import { InfrastructureNodeData, ComponentTypeId } from '../../types/playground';
import { COMPONENT_CATALOG } from '../../config/components';
import { usePlaygroundStore } from '../../store/usePlaygroundStore';
import { ComponentIcon } from '../icons/ComponentIcons';
import { NodeErrorBoundary } from '../common/NodeErrorBoundary';

// Valid downstream components that can be quickly added via the (+) button
const CONNECTABLE_TYPES: ComponentTypeId[] = [
  'dns_router',
  'waf',
  'cdn',
  'api_gateway',
  'load_balancer',
  'web_server',
  'serverless_function',
  'background_worker',
  'cache',
  'relational_db',
  'nosql_db',
  'search_engine',
  'analytics_db',
  'message_queue',
  'standard_queue',
  'pub_sub',
  'object_storage',
  'external_api',
];

const InfrastructureNodeInner: React.FC<NodeProps> = ({ id, data, selected }) => {
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

  const isSimulating = usePlaygroundStore((state) => state.isSimulating);
  const activeNodeIds = usePlaygroundStore((state) => state.activeNodeIds);
  const isNodeActive = activeNodeIds.includes(id);
  const isOperating = isSimulating && isNodeActive && !isEffectivelyDead && (nodeData.currentRps > 0 || isClient);

  const getStatusDot = () => {
    if (isEffectivelyDead) {
      return (
        <span
          className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-600 inline-block shrink-0"
          title={isAzKilled ? 'AZ Down' : 'Offline'}
        />
      );
    }
    // Idle construction / design mode: subtle neutral indicator
    if (!isSimulating || !isNodeActive) {
      return (
        <span
          className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-600 inline-block shrink-0"
          title="Idle (Design Mode)"
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
    if (selected) {
      return 'border-blue-500 ring-2 ring-blue-500 shadow-md';
    }
    if (isSimulating && isNodeActive && nodeData.isBottleneck) {
      return 'border-rose-500 ring-2 ring-rose-500/60 shadow-[0_0_20px_rgba(244,63,94,0.35)] animate-pulse';
    }
    if (isSimulating && isNodeActive && nodeData.status === 'critical') {
      return 'border-rose-500/80 shadow-[0_0_12px_rgba(244,63,94,0.25)]';
    }
    if (isSimulating && isNodeActive && nodeData.status === 'warning') {
      return 'border-amber-500/80 shadow-[0_0_12px_rgba(245,158,11,0.25)]';
    }
    return 'border-[var(--border-card)] hover:border-blue-500/50 shadow-xs hover:shadow-md';
  };

  const utilPercent = nodeData.utilizationPercent || 0;

  // Check if node has a custom label distinct from component archetype
  const isCustomLabel = Boolean(
    nodeData.label &&
    meta?.name &&
    nodeData.label.trim().toLowerCase() !== meta.name.trim().toLowerCase()
  );

  // Compute subtitle text to prevent printing the same name twice
  const getSubtitle = () => {
    if (isSimulating && isNodeActive) {
      if (nodeData.isBottleneck) return 'Bottleneck';
      if (isEffectivelyDead) return 'Offline';
      if (nodeData.status === 'critical') return 'Overloaded';
      if (nodeData.status === 'warning') return 'High Load';
      if (nodeData.instanceCount > 1) return `${nodeData.instanceCount}x · Active`;
      return 'Active';
    }

    if (nodeData.instanceCount > 1) {
      if (isCustomLabel) {
        return `${nodeData.instanceCount}x · ${meta?.name}`;
      }
      return `${nodeData.instanceCount}x Replicas`;
    }

    if (isCustomLabel) {
      return meta?.name;
    }

    // Default label with 1 instance: avoid redundant duplicate name
    return null;
  };

  const subtitle = getSubtitle();

  return (
    <div className="flex flex-col items-center group select-none relative">
      {/* The n8n Node Card Shell */}
      <div
        onClick={() => setSelectedNodeId(id)}
        className={`relative flex items-center justify-center w-[90px] h-[90px] bg-[var(--bg-surface)] border transition-all duration-150 cursor-pointer ${
          isClient ? 'rounded-l-3xl rounded-r-2xl' : 'rounded-2xl'
        } ${getCardBorder()}`}
      >
        {/* n8n Sequential Wave Activation Glow */}
        {isSimulating && isNodeActive && (
          <span
            key={`act-${isNodeActive}`}
            className="absolute -inset-1.5 rounded-2xl border-2 border-emerald-400 pointer-events-none opacity-60 animate-ping"
            style={{ animationIterationCount: 1, animationDuration: '0.9s' }}
          />
        )}

        {/* Role-Specific Dynamic Operational Micro-Animations */}
        {isOperating && (
          <>
            {/* 1. Traffic Generator: Radiating outward beacon wave ripple */}
            {nodeData.typeId === 'traffic_generator' && (
              <span className="absolute -inset-1 rounded-l-3xl rounded-r-2xl border-2 border-orange-500/50 anim-radar-ripple pointer-events-none" />
            )}

            {/* 2. Load Balancer: Alternating dispatch routing beacon */}
            {nodeData.typeId === 'load_balancer' && (
              <span className="absolute -inset-0.5 rounded-2xl border border-cyan-400/40 anim-lb-dispatch pointer-events-none" />
            )}

            {/* 3. Compute / App Server: CPU processing respiration proportional to load */}
            {nodeData.typeId === 'web_server' && (
              <span
                className="absolute inset-0 rounded-2xl anim-cpu-breathe pointer-events-none"
                style={{ '--cpu-speed': `${Math.max(0.6, 2.2 - (utilPercent / 60))}s` } as React.CSSProperties}
              />
            )}

            {/* 4. Cache: High-speed memory quantum shimmer */}
            {nodeData.typeId === 'cache' && (
              <span className="absolute inset-0 rounded-2xl anim-cache-shimmer pointer-events-none" />
            )}

            {/* 5. Database (Relational / NoSQL): Disk I/O storage activity LED */}
            {(nodeData.typeId === 'relational_db' || nodeData.typeId === 'nosql_db') && (
              <div className="absolute top-1.5 right-1.5 flex items-center gap-1 pointer-events-none" title="Disk I/O Active">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 anim-disk-blink shadow-[0_0_5px_#10b981]" />
              </div>
            )}

            {/* 6. Message Queue / Kafka: Streaming pipeline buffer conveyor */}
            {nodeData.typeId === 'message_queue' && (
              <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex items-center gap-1 anim-queue-march pointer-events-none">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shadow-[0_0_4px_#c084fc]" />
                <span className="w-1 h-1 rounded-full bg-purple-300" />
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_4px_#a855f7]" />
              </div>
            )}

            {/* 7. Storage / S3: Data write absorption wave */}
            {nodeData.typeId === 'object_storage' && (
              <span className="absolute inset-x-2 bottom-1.5 h-1.5 rounded-full bg-amber-400/40 animate-pulse pointer-events-none" />
            )}
          </>
        )}

        {/* Trigger Lightning Badge (Left of Trigger Node) */}
        {isClient && (
          <div
            className={`absolute -left-7 top-1/2 -translate-y-1/2 flex items-center justify-center transition-all ${
              isSimulating && isNodeActive ? 'text-orange-500 animate-pulse' : 'text-neutral-400 dark:text-neutral-500 opacity-60'
            }`}
            title="Ingress Traffic Trigger"
          >
            <Zap
              className={`w-5 h-5 ${
                isSimulating && isNodeActive
                  ? 'fill-orange-500 text-orange-500'
                  : 'fill-neutral-400/20 text-neutral-400 dark:text-neutral-500'
              }`}
            />
          </div>
        )}

        {/* Hidden Default Ingress Handle for Legacy & Preset Connections */}
        {!isClient && (
          <Handle
            type="target"
            position={Position.Left}
            id="left-default"
            className="opacity-0 pointer-events-none"
            style={{ left: -6 }}
          />
        )}

        {/* 4 Cardinal Omnidirectional Connection Ports */}
        {/* 1. Top Port */}
        <Handle
          type="source"
          position={Position.Top}
          id="top"
          className="n8n-handle n8n-handle-top !-top-2 !left-1/2 !-translate-x-1/2"
        />

        {/* 2. Left Port */}
        <Handle
          type="source"
          position={Position.Left}
          id="left"
          className="n8n-handle n8n-handle-left !-left-2 !top-1/2 !-translate-y-1/2"
        />

        {/* Clean, Prominent n8n Center Symbol */}
        <div className="flex items-center justify-center transition-transform duration-150 group-hover:scale-105 pointer-events-none">
          <ComponentIcon typeId={nodeData.typeId} size={50} color={meta?.color} />
        </div>

        {/* 3. Right Port */}
        <Handle
          type="source"
          position={Position.Right}
          id="right"
          className="n8n-handle n8n-handle-source n8n-handle-right !-right-2 !top-1/2 !-translate-y-1/2"
        />

        {/* 4. Bottom Port */}
        <Handle
          type="source"
          position={Position.Bottom}
          id="bottom"
          className="n8n-handle n8n-handle-bottom !-bottom-2 !left-1/2 !-translate-x-1/2"
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
          className={`absolute -right-8 top-1/2 -translate-y-1/2 w-5 h-5 rounded-md border border-[var(--border-card)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-blue-500 hover:border-blue-400 hover:scale-110 active:scale-95 flex items-center justify-center text-xs font-bold shadow-xs transition-all cursor-pointer z-10 ${
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
          className="absolute left-[102px] top-4 z-50 w-60 bg-[var(--bg-surface)] border border-[var(--border-card)] rounded-xl shadow-2xl p-2 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="flex items-center justify-between px-2 py-1 border-b border-[var(--border-subtle)] mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
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
          <div className="max-h-60 overflow-y-auto space-y-0.5 custom-scrollbar">
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
                  className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-left hover:bg-blue-500/10 hover:text-blue-500 text-[var(--text-main)] transition-colors cursor-pointer group/item"
                >
                  <div
                    className="w-7 h-7 rounded-md flex items-center justify-center shrink-0 border border-white/5"
                    style={{
                      background: `linear-gradient(135deg, ${itemMeta.color}30 0%, ${itemMeta.color}15 100%)`,
                    }}
                  >
                    <ComponentIcon typeId={type} size={18} color={itemMeta.color} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold truncate group-hover/item:text-blue-500">
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
      <div className="mt-2.5 text-center max-w-[160px] px-1 pointer-events-none">
        <div className="text-sm font-bold text-[var(--text-main)] leading-snug truncate">
          {nodeData.label || meta?.name}
        </div>
        {subtitle && (
          <div className="text-xs text-[var(--text-muted)] font-medium truncate flex items-center justify-center gap-1 mt-0.5">
            {getStatusDot()}
            <span>{subtitle}</span>
          </div>
        )}
      </div>

      {/* Detailed Mode Metrics Pill (Appended Below When Detailed Mode is Active or Selected) */}
      {showDetails && (
        <div className="mt-2 px-2.5 py-1.5 rounded-lg bg-[var(--bg-pill)] border border-[var(--border-subtle)] text-xs font-mono shadow-xs space-y-1 text-center min-w-[130px] pointer-events-none animate-in fade-in duration-150">
          <div className="flex items-center justify-between gap-2 text-[10px] text-[var(--text-muted)] font-semibold uppercase">
            <span>RPS</span>
            <span className="text-blue-500 dark:text-blue-400 font-bold">
              {!isSimulating || !isNodeActive || isEffectivelyDead ? '0' : nodeData.currentRps.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2 text-[10px] text-[var(--text-muted)] font-semibold uppercase">
            <span>Latency</span>
            <span className={`font-bold ${nodeData.currentLatency > 100 && isSimulating && isNodeActive ? 'text-amber-500' : 'text-slate-700 dark:text-slate-300'}`}>
              {!isSimulating || !isNodeActive || isEffectivelyDead ? '0ms' : `${nodeData.currentLatency}ms`}
            </span>
          </div>
          {!isClient && !isEffectivelyDead && (
            <div className="flex items-center justify-between gap-2 text-[10px] text-[var(--text-muted)] font-semibold uppercase">
              <span>Cap</span>
              <span className={`font-bold ${!isSimulating || !isNodeActive ? 'text-slate-500' : utilPercent >= 90 ? 'text-rose-500' : utilPercent >= 75 ? 'text-amber-500' : 'text-emerald-500 dark:text-emerald-400'}`}>
                {!isSimulating || !isNodeActive ? '0%' : `${utilPercent}%`}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const InfrastructureNode: React.FC<NodeProps> = memo((props) => {
  return (
    <NodeErrorBoundary nodeId={props.id} nodeLabel={(props.data as any)?.label}>
      <InfrastructureNodeInner {...props} />
    </NodeErrorBoundary>
  );
});

InfrastructureNode.displayName = 'InfrastructureNode';
