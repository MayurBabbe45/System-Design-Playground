import React, { useCallback, useEffect, useMemo } from 'react';
import { 
  ReactFlow, 
  Background, 
  Controls, 
  MiniMap, 
  useReactFlow, 
  ReactFlowProvider,
  BackgroundVariant
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { AlertTriangle } from 'lucide-react';
import { usePlaygroundStore } from '../store/usePlaygroundStore';
import { InfrastructureNode } from './nodes/InfrastructureNode';
import { FlowEdge } from './edges/FlowEdge';
import { ComponentTypeId } from '../types/playground';

const CanvasInner: React.FC = () => {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    setSelectedNodeId,
    addNodeFromPalette,
    loadFromUrlHash,
    tickSimulation,
    isSimulating,
    simulationSpeed,
    bottleneckReason,
  } = usePlaygroundStore();

  const reactFlowInstance = useReactFlow();

  // Register custom node and edge types
  const nodeTypes = useMemo(() => ({ infrastructure: InfrastructureNode }), []);
  const edgeTypes = useMemo(() => ({ flowEdge: FlowEdge }), []);

  // Listen to URL hash changes for instant URL architecture loading
  useEffect(() => {
    if (window.location.hash) {
      loadFromUrlHash(window.location.hash);
    }
  }, [loadFromUrlHash]);

  // Simulation Interval Loop
  useEffect(() => {
    if (!isSimulating) return;
    const intervalMs = Math.max(100, Math.round(1000 / simulationSpeed));
    const timer = setInterval(() => {
      tickSimulation();
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isSimulating, simulationSpeed, tickSimulation]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const typeId = event.dataTransfer.getData('application/reactflow') as ComponentTypeId;
      if (!typeId) return;

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      addNodeFromPalette(typeId, position);
    },
    [reactFlowInstance, addNodeFromPalette]
  );

  return (
    <div
      className="flex-1 h-[calc(100vh-3.5rem)] relative bg-[#0e1117]"
      onDragOver={onDragOver}
      onDrop={onDrop}
      onClick={(e) => {
        // Deselect if clicking on raw canvas background
        if ((e.target as HTMLElement).classList.contains('react-flow__pane')) {
          setSelectedNodeId(null);
        }
      }}
    >
      {/* Sleek Floating Bottleneck Warning Banner */}
      {bottleneckReason && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 px-4 py-2 rounded-xl bg-red-950/90 border border-red-700/80 shadow-2xl shadow-red-950/50 flex items-center gap-2.5 backdrop-blur-md">
          <div className="w-6 h-6 rounded-lg bg-red-900/60 flex items-center justify-center text-red-400 shrink-0">
            <AlertTriangle className="w-3.5 h-3.5" />
          </div>
          <div className="text-xs text-red-200">
            <span className="font-bold text-red-300">Bottleneck Detected: </span>
            <span>{bottleneckReason}</span>
          </div>
        </div>
      )}

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        colorMode="dark"
        defaultEdgeOptions={{
          type: 'flowEdge',
          animated: true,
        }}
      >
        {/* n8n-style dot grid background */}
        <Background 
          variant={BackgroundVariant.Dots} 
          gap={24} 
          size={1.5} 
          color="#222634" 
        />
        <Controls />
        <MiniMap
          nodeColor={(n) => {
            const data = n.data as any;
            if (data?.isKilled) return '#ef4444';
            if (data?.isBottleneck) return '#ef4444';
            if (data?.status === 'critical') return '#ef4444';
            if (data?.status === 'warning') return '#f59e0b';
            return '#388bfd';
          }}
          maskColor="rgba(14, 17, 23, 0.75)"
        />
      </ReactFlow>
    </div>
  );
};

export const Canvas: React.FC = () => {
  return (
    <ReactFlowProvider>
      <CanvasInner />
    </ReactFlowProvider>
  );
};
