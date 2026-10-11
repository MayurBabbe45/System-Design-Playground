import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Handle, Position } from '@xyflow/react';
import { AlertOctagon, RotateCcw } from 'lucide-react';
import { createNodeErrorState, resetNodeErrorState } from './errorBoundaryHelpers';

interface Props {
  children: ReactNode;
  nodeId: string;
  nodeLabel?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class NodeErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = resetNodeErrorState();
  }

  static getDerivedStateFromError(error: Error): State {
    return createNodeErrorState(error);
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[NodeErrorBoundary] Node ${this.props.nodeId} crashed:`, error, errorInfo);
  }

  handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    this.setState(resetNodeErrorState());
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="relative flex flex-col items-center select-none group">
          {/* Card Fallback (Same dimensions as normal nodes) */}
          <div className="relative flex flex-col items-center justify-center w-[90px] h-[90px] bg-rose-950/30 border border-rose-500/60 rounded-2xl backdrop-blur-xl shadow-lg p-2 text-center">
            {/* 4 Cardinal Handles to keep React Flow edges intact */}
            <Handle
              type="source"
              position={Position.Top}
              id="top"
              className="n8n-handle n8n-handle-top !-top-2 !left-1/2 !-translate-x-1/2 opacity-50"
            />
            <Handle
              type="source"
              position={Position.Left}
              id="left"
              className="n8n-handle n8n-handle-left !-left-2 !top-1/2 !-translate-y-1/2 opacity-50"
            />
            <Handle
              type="source"
              position={Position.Right}
              id="right"
              className="n8n-handle n8n-handle-source n8n-handle-right !-right-2 !top-1/2 !-translate-y-1/2 opacity-50"
            />
            <Handle
              type="source"
              position={Position.Bottom}
              id="bottom"
              className="n8n-handle n8n-handle-bottom !-bottom-2 !left-1/2 !-translate-x-1/2 opacity-50"
            />
            <Handle
              type="target"
              position={Position.Left}
              id="left-default"
              className="opacity-0 pointer-events-none"
            />

            <AlertOctagon className="w-6 h-6 text-rose-400 mb-1 animate-pulse" />
            <span className="text-[10px] font-bold text-rose-300 leading-tight">Error</span>

            <button
              type="button"
              onClick={this.handleReset}
              title="Retry rendering this node"
              className="mt-1 flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/40 text-[9px] font-semibold cursor-pointer transition-colors"
            >
              <RotateCcw className="w-2.5 h-2.5" />
              <span>Retry</span>
            </button>
          </div>

          {/* Node label */}
          <div className="mt-2 text-center max-w-[140px] px-1 pointer-events-none">
            <span className="text-xs font-semibold text-rose-400 truncate block">
              {this.props.nodeLabel || 'Component Error'}
            </span>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
