import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw, Copy, Check, Sparkles } from 'lucide-react';
import {
  createCanvasErrorState,
  resetCanvasErrorState,
  formatDiagnosticsPayload,
  type CanvasErrorBoundaryState,
} from './errorBoundaryHelpers';

interface Props {
  children: ReactNode;
  onResetViewport?: () => void;
}

export class CanvasErrorBoundary extends Component<Props, CanvasErrorBoundaryState> {
  constructor(props: Props) {
    super(props);
    this.state = resetCanvasErrorState();
  }

  static getDerivedStateFromError(error: Error): CanvasErrorBoundaryState {
    return createCanvasErrorState(error);
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[CanvasErrorBoundary] Canvas viewport encountered an unhandled error:', error, errorInfo);
  }

  handleReload = () => {
    this.setState(resetCanvasErrorState());
  };

  handleResetAll = () => {
    this.props.onResetViewport?.();
    this.setState(resetCanvasErrorState());
  };

  handleCopyDiagnostics = async () => {
    if (!this.state.error) return;
    const diagnostics = formatDiagnosticsPayload(this.state.error);

    try {
      await navigator.clipboard.writeText(diagnostics);
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2000);
    } catch {
      // ignore
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex-1 h-[calc(100vh-3.25rem)] relative bg-[var(--canvas-bg)] flex items-center justify-center p-6 select-none overflow-hidden">
          {/* Subtle Ambient VisionOS Glow */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
            <div className="absolute top-1/3 left-1/3 w-[450px] h-[450px] bg-rose-600/10 rounded-full blur-[140px]" />
          </div>

          <div className="relative z-10 max-w-lg w-full bg-[var(--bg-surface)] border border-rose-500/30 rounded-3xl p-6 shadow-2xl backdrop-blur-2xl text-[var(--text-main)] animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3.5 mb-4 border-b border-[var(--border-subtle)] pb-4">
              <div className="w-11 h-11 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center shrink-0 shadow-lg">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[var(--text-main)] tracking-tight">
                  Canvas Viewport Exception
                </h3>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  The visual canvas encountered a rendering issue. Your architecture graph data is safely preserved.
                </p>
              </div>
            </div>

            {/* Error Message Snippet */}
            <div className="bg-black/20 dark:bg-black/40 rounded-xl p-3 border border-white/5 font-mono text-[11px] text-rose-300 mb-5 overflow-x-auto max-h-24">
              {this.state.error?.message || 'Unknown canvas rendering error'}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-2.5">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full sm:flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reload Canvas</span>
              </button>

              <button
                type="button"
                onClick={this.handleResetAll}
                className="w-full sm:flex-1 py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-[var(--text-main)] border border-white/10 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                <span>Reset Viewport</span>
              </button>

              <button
                type="button"
                onClick={this.handleCopyDiagnostics}
                className="w-full sm:w-auto py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-[var(--text-muted)] hover:text-[var(--text-main)] border border-white/10 font-medium text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                title="Copy error trace"
              >
                {this.state.copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Trace</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
