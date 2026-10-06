import React, { memo, useState } from 'react';
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
  const { deleteEdge, isViewOnly, setSelectedEdgeId, selectedEdgeId } = usePlaygroundStore();
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

  // Calculate dynamic flow particle color and animation duration
  // More traffic = faster particles (lower duration)
  const animDuration = Math.max(0.6, Math.min(3.0, 2500 / Math.max(100, flowRps)));
  
  let particleColor = '#3b82f6'; // Blue
  let strokeColor = '#3b82f6';
  if (errorRate > 0) {
    particleColor = '#ef4444';
    strokeColor = '#ef4444';
  } else if (flowRps > 10000) {
    particleColor = '#f59e0b'; // Amber
    strokeColor = '#f59e0b';
  } else if (flowRps > 0) {
    particleColor = '#06b6d4'; // Cyan
    strokeColor = '#06b6d4';
  } else {
    strokeColor = 'rgba(255, 255, 255, 0.2)';
  }

  if (isEdgeSelected) {
    strokeColor = '#38bdf8';
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteEdge(id);
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

      {/* Main Visible Edge */}
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke: strokeColor,
          strokeWidth: isEdgeSelected ? 3.5 : (flowRps > 0 ? 2 : 1.5),
          opacity: isEdgeSelected ? 1 : (flowRps > 0 ? 0.9 : 0.45),
          filter: isEdgeSelected ? 'drop-shadow(0 0 4px #38bdf8)' : undefined,
        }}
      />

      {/* SVG Animated Particles flowing along path */}
      {flowRps > 0 && (
        <g pointerEvents="none">
          {/* Particle 1 */}
          <circle r="3" fill={particleColor} className="filter drop-shadow-[0_0_6px_currentColor]">
            <animateMotion
              dur={`${animDuration}s`}
              repeatCount="indefinite"
              path={edgePath}
            />
          </circle>
          {/* Particle 2 offset */}
          <circle r="2.5" fill={particleColor} className="filter drop-shadow-[0_0_6px_currentColor]">
            <animateMotion
              dur={`${animDuration}s`}
              begin={`${animDuration * 0.5}s`}
              repeatCount="indefinite"
              path={edgePath}
            />
          </circle>
        </g>
      )}

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
          {flowRps > 0 && (
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
