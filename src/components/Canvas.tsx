import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { 
  ReactFlow, 
  Background, 
  Controls, 
  MiniMap, 
  useReactFlow, 
  ReactFlowProvider,
  BackgroundVariant,
  ConnectionMode
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { AlertTriangle, Keyboard, X } from 'lucide-react';
import { usePlaygroundStore } from '../store/usePlaygroundStore';
import { InfrastructureNode } from './nodes/InfrastructureNode';
import { FlowEdge } from './edges/FlowEdge';
import { ComponentTypeId, InfrastructureNodeData } from '../types/playground';
import { collabManager } from '../collab/collabManager';
import { Node } from '@xyflow/react';

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
    selectedNodeId,
    selectedEdgeId,
    deleteNode,
    deleteEdge,
    setSelectedEdgeId,
    theme,
    isViewOnly,
    undo,
    redo,
    copySelectedNode,
    pasteNode,
    duplicateSelectedNode,
    toggleSimulation,
    takeSnapshot,
  } = usePlaygroundStore();

  const reactFlowInstance = useReactFlow();

  const [shortcutToast, setShortcutToast] = useState<string | null>(null);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  const showToast = useCallback((message: string) => {
    setShortcutToast(message);
    const timer = setTimeout(() => {
      setShortcutToast((curr) => (curr === message ? null : curr));
    }, 1400);
    return () => clearTimeout(timer);
  }, []);

  // Register custom node and edge types
  const nodeTypes = useMemo(() => ({
    infrastructure: InfrastructureNode,
    infrastructureNode: InfrastructureNode,
  }), []);
  const edgeTypes = useMemo(() => ({ flowEdge: FlowEdge }), []);

  // Comprehensive keyboard shortcuts: Undo, Redo, Copy, Paste, Duplicate, Delete, Space, Zoom
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is currently typing in an input, textarea, or select element
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      const isCtrlOrCmd = e.ctrlKey || e.metaKey;

      // 1. Undo: Ctrl+Z (or Cmd+Z) without Shift
      if (isCtrlOrCmd && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        if (!isViewOnly) {
          e.preventDefault();
          undo();
          showToast('Undo');
        }
        return;
      }

      // 2. Redo: Ctrl+Y or Ctrl+Shift+Z (or Cmd+Shift+Z)
      if ((isCtrlOrCmd && e.key.toLowerCase() === 'y') || (isCtrlOrCmd && e.key.toLowerCase() === 'z' && e.shiftKey)) {
        if (!isViewOnly) {
          e.preventDefault();
          redo();
          showToast('Redo');
        }
        return;
      }

      // 3. Copy: Ctrl+C (or Cmd+C)
      if (isCtrlOrCmd && e.key.toLowerCase() === 'c') {
        if (selectedNodeId) {
          e.preventDefault();
          copySelectedNode();
          showToast('Copied node');
        }
        return;
      }

      // 4. Paste: Ctrl+V (or Cmd+V)
      if (isCtrlOrCmd && e.key.toLowerCase() === 'v') {
        if (!isViewOnly) {
          e.preventDefault();
          pasteNode();
          showToast('Pasted node');
        }
        return;
      }

      // 5. Duplicate: Ctrl+D (or Cmd+D)
      if (isCtrlOrCmd && e.key.toLowerCase() === 'd') {
        if (!isViewOnly && selectedNodeId) {
          e.preventDefault();
          duplicateSelectedNode();
          showToast('Duplicated node');
        }
        return;
      }

      // 6. Delete / Backspace: Remove selected node or edge
      if ((e.key === 'Backspace' || e.key === 'Delete') && !isViewOnly) {
        if (selectedNodeId) {
          e.preventDefault();
          deleteNode(selectedNodeId);
          showToast('Deleted node');
        } else if (selectedEdgeId) {
          e.preventDefault();
          deleteEdge(selectedEdgeId);
          showToast('Disconnected');
        }
        return;
      }

      // 7. Escape: Deselect current selection & close popups
      if (e.key === 'Escape') {
        setSelectedNodeId(null);
        setSelectedEdgeId(null);
        setIsShortcutsOpen(false);
        return;
      }

      // 8. Spacebar: Toggle Simulation (Play / Pause)
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        toggleSimulation();
        showToast(isSimulating ? 'Simulation paused' : 'Simulation running');
        return;
      }

      // 9. Shortcuts Helper modal: '?' (Shift + /)
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        setIsShortcutsOpen((prev) => !prev);
        return;
      }

      // 10. Zoom In: Ctrl + Plus / Equal
      if (isCtrlOrCmd && (e.key === '=' || e.key === '+')) {
        e.preventDefault();
        reactFlowInstance.zoomIn();
        return;
      }

      // 11. Zoom Out: Ctrl + Minus
      if (isCtrlOrCmd && e.key === '-') {
        e.preventDefault();
        reactFlowInstance.zoomOut();
        return;
      }

      // 12. Fit View: Ctrl + 0
      if (isCtrlOrCmd && e.key === '0') {
        e.preventDefault();
        reactFlowInstance.fitView();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isViewOnly,
    selectedNodeId,
    selectedEdgeId,
    undo,
    redo,
    copySelectedNode,
    pasteNode,
    duplicateSelectedNode,
    deleteNode,
    deleteEdge,
    setSelectedNodeId,
    setSelectedEdgeId,
    toggleSimulation,
    isSimulating,
    showToast,
    reactFlowInstance,
  ]);

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
      if (isViewOnly) return;

      const typeId = event.dataTransfer.getData('application/reactflow') as ComponentTypeId;
      if (!typeId) return;

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX - 45,
        y: event.clientY - 42,
      });

      addNodeFromPalette(typeId, position);
    },
    [reactFlowInstance, addNodeFromPalette, isViewOnly]
  );

  return (
    <div
      className="flex-1 h-[calc(100vh-3.25rem)] relative bg-[var(--canvas-bg)] overflow-hidden"
      onDragOver={onDragOver}
      onDrop={onDrop}
      onClick={(e) => {
        // Deselect if clicking on raw canvas background
        if ((e.target as HTMLElement).classList.contains('react-flow__pane')) {
          setSelectedNodeId(null);
          setSelectedEdgeId(null);
        }
      }}
    >
      {/* Subtle Atmospheric VisionOS Depth Lighting behind Canvas Grid */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-1/4 left-1/3 w-[520px] h-[520px] bg-blue-600/5 rounded-full blur-[140px]" />
        <div className="absolute bottom-1/3 right-1/4 w-[480px] h-[480px] bg-purple-600/5 rounded-full blur-[140px]" />
      </div>

      {/* Floating Bottleneck Warning Banner */}
      {bottleneckReason && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 px-4 py-2 rounded-xl spatial-glass border border-rose-500/40 shadow-2xl flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-lg bg-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
            <AlertTriangle className="w-3.5 h-3.5" />
          </div>
          <div className="text-xs text-rose-200">
            <span className="font-bold text-rose-300">Bottleneck: </span>
            <span>{bottleneckReason}</span>
          </div>
        </div>
      )}

      {/* Discreet Floating Shortcut Toast */}
      {shortcutToast && (
        <div className="absolute top-4 right-4 z-30 px-3 py-1.5 rounded-xl spatial-glass border border-white/10 shadow-xl text-xs font-medium text-[var(--text-main)] flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-150">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-xs shadow-blue-400" />
          <span>{shortcutToast}</span>
        </div>
      )}

      {/* Floating Shortcuts Reference Helper Button */}
      <button
        type="button"
        onClick={() => setIsShortcutsOpen((prev) => !prev)}
        title="Keyboard Shortcuts (?)"
        className="absolute bottom-12 left-4 z-10 px-3 py-1.5 rounded-xl spatial-glass-card border border-white/10 hover:border-blue-500/50 text-[11px] font-medium text-[var(--text-muted)] hover:text-[var(--text-main)] shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
      >
        <Keyboard className="w-3.5 h-3.5 text-blue-400" />
        <span>Shortcuts</span>
      </button>

      {/* Keyboard Shortcuts Reference Dialog */}
      {isShortcutsOpen && (
        <div
          className="absolute bottom-22 left-4 z-30 w-76 spatial-glass border border-white/10 rounded-2xl shadow-2xl p-3.5 animate-in fade-in zoom-in-95 duration-150 text-[var(--text-main)]"
        >
          <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2">
            <div className="flex items-center gap-1.5 text-xs font-bold">
              <Keyboard className="w-4 h-4 text-blue-400" />
              <span>Keyboard Shortcuts</span>
            </div>
            <button
              onClick={() => setIsShortcutsOpen(false)}
              className="p-1 rounded-lg spatial-glass-card text-[var(--text-muted)] hover:text-[var(--text-main)] cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[var(--text-muted)]">Undo</span>
              <kbd className="px-1.5 py-0.5 rounded-lg spatial-pill border border-white/10 text-[10px] font-mono">Ctrl + Z</kbd>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[var(--text-muted)]">Redo</span>
              <kbd className="px-1.5 py-0.5 rounded-lg spatial-pill border border-white/10 text-[10px] font-mono">Ctrl + Y</kbd>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[var(--text-muted)]">Copy node</span>
              <kbd className="px-1.5 py-0.5 rounded-lg spatial-pill border border-white/10 text-[10px] font-mono">Ctrl + C</kbd>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[var(--text-muted)]">Paste node</span>
              <kbd className="px-1.5 py-0.5 rounded-lg spatial-pill border border-white/10 text-[10px] font-mono">Ctrl + V</kbd>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[var(--text-muted)]">Duplicate node</span>
              <kbd className="px-1.5 py-0.5 rounded-lg spatial-pill border border-white/10 text-[10px] font-mono">Ctrl + D</kbd>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[var(--text-muted)]">Delete node/edge</span>
              <kbd className="px-1.5 py-0.5 rounded-lg spatial-pill border border-white/10 text-[10px] font-mono">Del / Backspace</kbd>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[var(--text-muted)]">Play / Pause simulation</span>
              <kbd className="px-1.5 py-0.5 rounded-lg spatial-pill border border-white/10 text-[10px] font-mono">Space</kbd>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[var(--text-muted)]">Fit canvas</span>
              <kbd className="px-1.5 py-0.5 rounded-lg spatial-pill border border-white/10 text-[10px] font-mono">Ctrl + 0</kbd>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[var(--text-muted)]">Zoom in / out</span>
              <kbd className="px-1.5 py-0.5 rounded-lg spatial-pill border border-white/10 text-[10px] font-mono">Ctrl + (+ / -)</kbd>
            </div>
          </div>
        </div>
      )}

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={isViewOnly ? undefined : onConnect}
        onNodeDragStart={() => {
          if (!isViewOnly) takeSnapshot();
        }}
        onNodeDragStop={(_, node) => {
          if (!isViewOnly) {
            collabManager.syncSingleNode(node as Node<InfrastructureNodeData>);
          }
        }}
        onEdgeClick={isViewOnly ? undefined : (_, edge) => {
          setSelectedEdgeId(edge.id);
          setSelectedNodeId(null);
        }}
        onNodeClick={(_, node) => {
          setSelectedNodeId(node.id);
          setSelectedEdgeId(null);
        }}
        onPaneClick={() => {
          setSelectedNodeId(null);
          setSelectedEdgeId(null);
        }}
        nodesConnectable={!isViewOnly}
        edgesReconnectable={!isViewOnly}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        nodesDraggable={true}
        fitView
        colorMode={theme}
        connectionMode={ConnectionMode.Loose}
        isValidConnection={(connection) => {
          if (connection.source === connection.target) return false;
          const targetNode = nodes.find((n) => n.id === connection.target);
          if (targetNode?.data?.typeId === 'traffic_generator') return false;
          return true;
        }}
        connectionLineStyle={{
          stroke: theme === 'light' ? '#64748b' : '#ffffff',
          strokeWidth: 2,
          strokeDasharray: '6 4',
        }}
        defaultEdgeOptions={{
          type: 'flowEdge',
          animated: true,
        }}
      >
        {/* Dot grid background - Enhanced visibility */}
        <Background 
          variant={BackgroundVariant.Dots} 
          gap={26} 
          size={2} 
          color={theme === 'dark' ? 'rgba(255, 255, 255, 0.22)' : 'rgba(15, 23, 42, 0.22)'} 
        />
        <Controls showInteractive={false} style={{ marginBottom: '38px' }} />
        <MiniMap
          style={{ marginBottom: '38px' }}
          nodeColor={(n) => {
            const data = n.data as any;
            if (data?.isKilled) return '#ef4444';
            if (data?.isBottleneck) return '#ef4444';
            if (data?.status === 'critical') return '#ef4444';
            if (data?.status === 'warning') return '#f59e0b';
            return '#2563eb';
          }}
          maskColor={theme === 'dark' ? 'rgba(14, 17, 23, 0.75)' : 'rgba(241, 245, 249, 0.75)'}
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
