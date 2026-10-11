import React, { memo, useState, useMemo } from 'react';
import { 
  BaseEdge, 
  EdgeProps, 
  getBezierPath, 
  EdgeLabelRenderer 
} from '@xyflow/react';
import { X } from 'lucide-react';
import { EdgeStreamData } from '../../types/playground';
import { usePlaygroundStore } from '../../store/usePlaygroundStore';

export const FlowEdge: React.FC<EdgeProps> = memo(({
  id,
  source,
  target,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
  selected,
}) => {
  const edgeData = data as unknown as EdgeStreamData | undefined;
  const flowRps = edgeData?.currentFlowRps || 0;
  const errorRate = edgeData?.errorRatePercent || 0;
  const { deleteEdge, isViewOnly, setSelectedEdgeId, selectedEdgeId, theme } = usePlaygroundStore();
  const isSimulating = usePlaygroundStore((state) => state.isSimulating);
  const activeEdgeIds = usePlaygroundStore((state) => state.activeEdgeIds);
  const isEdgeActive = activeEdgeIds.includes(id);
  const [isHovered, setIsHovered] = useState(false);

  const isEdgeSelected = Boolean(selected || selectedEdgeId === id);

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const nodes = usePlaygroundStore((state) => state.nodes);
  const targetNode = useMemo(() => nodes.find((n) => n.id === target), [nodes, target]);
  const sourceNode = useMemo(() => nodes.find((n) => n.id === source), [nodes, source]);
  const targetType = targetNode?.data?.typeId;
  const sourceType = sourceNode?.data?.typeId;

  // Differentiate connection role by topology
  const isToCache = targetType === 'cache' || sourceType === 'cache';
  const isToDb = targetType === 'relational_db' || targetType === 'nosql_db' || sourceType === 'relational_db' || sourceType === 'nosql_db';
  const isToQueue = targetType === 'message_queue' || sourceType === 'message_queue';
  const isFromTraffic = sourceType === 'traffic_generator';
  const isToStorage = targetType === 'object_storage' || sourceType === 'object_storage';

  // Role-calibrated motion duration
  const baseDuration = Math.max(0.6, Math.min(3.2, 2500 / Math.max(100, flowRps)));
  const animDuration = isToCache
    ? Math.max(0.35, baseDuration * 0.55) // Microsecond memory lookup: ultra-rapid
    : isToDb
    ? Math.max(0.9, baseDuration * 1.3)   // Disk storage: deliberate data query batch pacing
    : isToQueue
    ? Math.max(0.6, baseDuration * 0.85)  // Continuous streaming conveyor
    : baseDuration;
  
  let particleColor = '#3b82f6'; // Blue
  let strokeColor = '#3b82f6';
  if (isSimulating && isEdgeActive && errorRate > 0) {
    particleColor = '#ef4444';
    strokeColor = '#ef4444';
  } else if (isSimulating && isEdgeActive && flowRps > 10000) {
    particleColor = '#f59e0b'; // Amber
    strokeColor = '#f59e0b';
  } else if (isSimulating && isEdgeActive && flowRps > 0) {
    particleColor = '#06b6d4'; // Cyan
    strokeColor = '#06b6d4';
  } else {
    // Theme-adaptive stroke for idle/zero-flow connection lines (crisp bright white in dark mode)
    strokeColor = theme === 'light' ? 'rgba(71, 85, 105, 0.85)' : '#ffffff';
  }

  if (isEdgeSelected) {
    strokeColor = '#38bdf8';
  } else if (isHovered && (!isSimulating || !isEdgeActive || flowRps === 0)) {
    strokeColor = '#ffffff';
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteEdge(id);
  };

  const renderParticles = () => {
    if (!isSimulating || !isEdgeActive || flowRps <= 0) return null;

    if (errorRate > 0) {
      // Degraded / Packet dropping flow: flickering red alert fragments
      return (
        <g pointerEvents="none">
          <g>
            <animateMotion dur={`${animDuration}s`} repeatCount="indefinite" path={edgePath} rotate="auto" />
            <polygon points="-4,-3 4,0 -4,3" fill="#ef4444" className="filter drop-shadow-[0_0_8px_#ef4444]" />
          </g>
          <g>
            <animateMotion dur={`${animDuration}s`} begin={`${animDuration * 0.5}s`} repeatCount="indefinite" path={edgePath} rotate="auto" />
            <circle r="2" fill="#ef4444" className="filter drop-shadow-[0_0_6px_#ef4444]" />
          </g>
        </g>
      );
    }

    if (isToCache) {
      // 1. In-Memory Cache: Ultra-fast electric photon streaks
      return (
        <g pointerEvents="none">
          <g>
            <animateMotion dur={`${animDuration}s`} repeatCount="indefinite" path={edgePath} rotate="auto" />
            <rect x="-10" y="-1.5" width="20" height="3" rx="1.5" fill="#06b6d4" className="filter drop-shadow-[0_0_10px_#06b6d4]" />
            <circle cx="10" cy="0" r="2.2" fill="#ffffff" />
          </g>
          <g>
            <animateMotion dur={`${animDuration}s`} begin={`${animDuration * 0.5}s`} repeatCount="indefinite" path={edgePath} rotate="auto" />
            <rect x="-8" y="-1.2" width="16" height="2.4" rx="1.2" fill="#38bdf8" className="filter drop-shadow-[0_0_8px_#38bdf8]" />
            <circle cx="8" cy="0" r="1.8" fill="#ffffff" />
          </g>
        </g>
      );
    }

    if (isToDb) {
      // 2. Database: Structured SQL record batch blocks
      return (
        <g pointerEvents="none">
          <g>
            <animateMotion dur={`${animDuration}s`} repeatCount="indefinite" path={edgePath} rotate="auto" />
            <rect x="-6" y="-4" width="12" height="8" rx="2" fill="#3b82f6" stroke="#93c5fd" strokeWidth="0.8" className="filter drop-shadow-[0_0_6px_rgba(59,130,246,0.6)]" />
            <line x1="-3" y1="-1" x2="3" y2="-1" stroke="#ffffff" strokeWidth="1" strokeLinecap="round" />
            <line x1="-3" y1="2" x2="1" y2="2" stroke="#ffffff" strokeWidth="1" strokeLinecap="round" />
          </g>
          <g>
            <animateMotion dur={`${animDuration}s`} begin={`${animDuration * 0.5}s`} repeatCount="indefinite" path={edgePath} rotate="auto" />
            <rect x="-6" y="-4" width="12" height="8" rx="2" fill="#2563eb" stroke="#bfdbfe" strokeWidth="0.8" className="filter drop-shadow-[0_0_6px_rgba(37,99,235,0.6)]" />
            <line x1="-3" y1="-1" x2="3" y2="-1" stroke="#ffffff" strokeWidth="1" strokeLinecap="round" />
            <line x1="-3" y1="2" x2="1" y2="2" stroke="#ffffff" strokeWidth="1" strokeLinecap="round" />
          </g>
        </g>
      );
    }

    if (isToQueue) {
      // 3. Kafka / Message Queue: Continuous serialized packet train of 3 message envelopes
      return (
        <g pointerEvents="none">
          <g>
            <animateMotion dur={`${animDuration}s`} repeatCount="indefinite" path={edgePath} rotate="auto" />
            <rect x="-5" y="-3.5" width="10" height="7" rx="1.5" fill="#a855f7" stroke="#e9d5ff" strokeWidth="0.7" className="filter drop-shadow-[0_0_6px_#a855f7]" />
            <path d="M-5 -3.5 L0 0.5 L5 -3.5" stroke="#ffffff" strokeWidth="0.8" fill="none" />
          </g>
          <g>
            <animateMotion dur={`${animDuration}s`} begin={`${animDuration * 0.33}s`} repeatCount="indefinite" path={edgePath} rotate="auto" />
            <rect x="-5" y="-3.5" width="10" height="7" rx="1.5" fill="#8b5cf6" stroke="#e9d5ff" strokeWidth="0.7" className="filter drop-shadow-[0_0_6px_#8b5cf6]" />
            <path d="M-5 -3.5 L0 0.5 L5 -3.5" stroke="#ffffff" strokeWidth="0.8" fill="none" />
          </g>
          <g>
            <animateMotion dur={`${animDuration}s`} begin={`${animDuration * 0.66}s`} repeatCount="indefinite" path={edgePath} rotate="auto" />
            <rect x="-5" y="-3.5" width="10" height="7" rx="1.5" fill="#7c3aed" stroke="#e9d5ff" strokeWidth="0.7" className="filter drop-shadow-[0_0_6px_#7c3aed]" />
            <path d="M-5 -3.5 L0 0.5 L5 -3.5" stroke="#ffffff" strokeWidth="0.8" fill="none" />
          </g>
        </g>
      );
    }

    if (isToStorage) {
      // 4. Object Storage (S3): Binary blob storage payload cubes
      return (
        <g pointerEvents="none">
          <g>
            <animateMotion dur={`${animDuration}s`} repeatCount="indefinite" path={edgePath} rotate="auto" />
            <rect x="-4.5" y="-4.5" width="9" height="9" rx="2" fill="#f59e0b" stroke="#fde68a" strokeWidth="0.8" className="filter drop-shadow-[0_0_6px_#f59e0b]" />
            <rect x="-2" y="-2" width="4" height="4" rx="0.5" fill="#ffffff" fillOpacity="0.85" />
          </g>
          <g>
            <animateMotion dur={`${animDuration}s`} begin={`${animDuration * 0.5}s`} repeatCount="indefinite" path={edgePath} rotate="auto" />
            <rect x="-4.5" y="-4.5" width="9" height="9" rx="2" fill="#d97706" stroke="#fde68a" strokeWidth="0.8" className="filter drop-shadow-[0_0_6px_#d97706]" />
            <rect x="-2" y="-2" width="4" height="4" rx="0.5" fill="#ffffff" fillOpacity="0.85" />
          </g>
        </g>
      );
    }

    if (isFromTraffic) {
      // 5. Client Ingress: Bursty HTTP request pulse beacons
      return (
        <g pointerEvents="none">
          <g>
            <animateMotion dur={`${animDuration}s`} repeatCount="indefinite" path={edgePath} rotate="auto" />
            <circle r="4" fill="#ff7849" className="filter drop-shadow-[0_0_8px_#ff7849]" />
            <circle r="1.6" fill="#ffffff" />
          </g>
          <g>
            <animateMotion dur={`${animDuration}s`} begin={`${animDuration * 0.45}s`} repeatCount="indefinite" path={edgePath} rotate="auto" />
            <circle r="3" fill="#ea580c" className="filter drop-shadow-[0_0_6px_#ea580c]" />
            <circle r="1.2" fill="#ffffff" />
          </g>
        </g>
      );
    }

    // 6. Compute / ALB / API Gateway: Core duplex stream
    return (
      <g pointerEvents="none">
        <g>
          <animateMotion dur={`${animDuration}s`} repeatCount="indefinite" path={edgePath} rotate="auto" />
          <circle r="3.5" fill={particleColor} className="filter drop-shadow-[0_0_6px_currentColor]" />
          <circle r="1.5" fill="#ffffff" />
        </g>
        <g>
          <animateMotion dur={`${animDuration}s`} begin={`${animDuration * 0.5}s`} repeatCount="indefinite" path={edgePath} rotate="auto" />
          <circle r="2.8" fill={particleColor} className="filter drop-shadow-[0_0_5px_currentColor]" />
        </g>
      </g>
    );
  };

  return (
    <>
      {/* Invisible wide hit-area path for easy hovering and clicking */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={24}
        className="cursor-pointer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedEdgeId(id);
        }}
      />

      {/* SVG Directional Arrowhead Marker matching stroke color */}
      <defs>
        <marker
          id={`arrow-${id}`}
          viewBox="0 0 10 10"
          refX="6"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill={strokeColor} />
        </marker>
      </defs>

      {/* Main Visible Edge */}
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd || `url(#arrow-${id})`}
        style={{
          ...style,
          stroke: strokeColor,
          strokeWidth: isEdgeSelected ? 3.5 : isHovered ? 2.5 : (isSimulating && isEdgeActive && flowRps > 0 ? 2.2 : 2),
          opacity: isEdgeSelected ? 1 : isHovered ? 1 : (isSimulating && isEdgeActive && flowRps > 0 ? 0.95 : 0.9),
          filter: isEdgeSelected 
            ? 'drop-shadow(0 0 6px #38bdf8)' 
            : isHovered
            ? 'drop-shadow(0 0 6px rgba(255, 255, 255, 0.7))'
            : (theme === 'dark' ? 'drop-shadow(0 0 3px rgba(255, 255, 255, 0.35))' : undefined),
        }}
      />

      {/* SVG Role-Specific Animated Flow Particles */}
      {renderParticles()}

      {/* Floating Interactive Flow Metrics Badge & Disconnect Button */}
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan flex items-center gap-1.5 select-none z-20"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {isSimulating && isEdgeActive && flowRps > 0 && (
            <div className="px-2 py-0.5 rounded-full bg-[var(--bg-surface)]/90 backdrop-blur-md border border-[var(--border-subtle)] text-[9px] font-mono text-[var(--text-main)] shadow-md flex items-center gap-1">
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: particleColor }}
              />
              <span>{flowRps.toLocaleString()} RPS</span>
            </div>
          )}

          {/* Interactive Delete / Disconnect Button (visible on hover or when edge is selected) */}
          {!isViewOnly && (isHovered || isEdgeSelected) && (
            <button
              type="button"
              onClick={handleDelete}
              title="Disconnect nodes (Delete connection)"
              className="w-5 h-5 rounded-full bg-rose-950/90 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/60 shadow-lg flex items-center justify-center transition-all hover:scale-110 cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
});

FlowEdge.displayName = 'FlowEdge';
