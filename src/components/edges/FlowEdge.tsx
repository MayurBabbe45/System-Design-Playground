import React, { memo } from 'react';
import { 
  BaseEdge, 
  EdgeProps, 
  getBezierPath, 
  EdgeLabelRenderer 
} from '@xyflow/react';
import { EdgeStreamData } from '../../types/playground';

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
}) => {
  const edgeData = data as unknown as EdgeStreamData | undefined;
  const flowRps = edgeData?.currentFlowRps || 0;
  const errorRate = edgeData?.errorRatePercent || 0;

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
    strokeColor = 'rgba(255, 255, 255, 0.15)';
  }

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke: strokeColor,
          strokeWidth: flowRps > 0 ? 2 : 1,
          opacity: flowRps > 0 ? 0.9 : 0.4,
        }}
      />

      {/* SVG Animated Particles flowing along path */}
      {flowRps > 0 && (
        <g>
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

      {/* Floating Interactive Flow Metrics Badge */}
      {flowRps > 0 && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
            }}
            className="nodrag nopan px-2 py-0.5 rounded-full bg-[var(--bg-surface)]/90 backdrop-blur-md border border-[var(--border-subtle)] text-[9px] font-mono text-[var(--text-main)] shadow-md flex items-center gap-1 select-none"
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: particleColor }}
            />
            <span>{flowRps.toLocaleString()} RPS</span>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
});

FlowEdge.displayName = 'FlowEdge';
