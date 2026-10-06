import React from 'react';
import { Unplug, Layers, Plus, Compass } from 'lucide-react';
import { usePlaygroundStore } from '../../store/usePlaygroundStore';

interface NotFoundViewProps {
  onReset?: () => void;
}

export const NotFoundView: React.FC<NotFoundViewProps> = ({ onReset }) => {
  const { setAppView, returnToDashboard, clearCanvas } = usePlaygroundStore();

  const handleGoDashboard = () => {
    if (onReset) onReset();
    returnToDashboard();
  };

  const handleStartFresh = () => {
    if (onReset) onReset();
    clearCanvas();
    setAppView('playground');
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[var(--bg-app)] text-[var(--text-main)] p-4 select-none">
      <div className="w-full max-w-md bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-8 shadow-2xl text-center relative overflow-hidden">
        {/* Subtle Background Glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* 404 Status Icon */}
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mx-auto mb-5 shadow-inner">
          <Unplug className="w-8 h-8" />
        </div>

        {/* Status Tag */}
        <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[11px] font-mono font-bold uppercase tracking-wider mb-2">
          HTTP 404 • Disconnected Topology
        </div>

        {/* Headline */}
        <h1 className="text-xl font-bold tracking-tight text-[var(--text-main)] mb-2">
          Architecture Not Found
        </h1>

        <p className="text-xs text-[var(--text-muted)] leading-relaxed mb-6 max-w-sm mx-auto">
          The requested architecture link or project identifier does not exist, has expired, or may have been deleted by its owner.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
          <button
            type="button"
            onClick={handleGoDashboard}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Open Projects Workspace</span>
          </button>

          <button
            type="button"
            onClick={handleStartFresh}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-panel)] hover:bg-[var(--bg-pill)] text-[var(--text-main)] text-xs font-medium flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-blue-500" />
            <span>New Architecture</span>
          </button>
        </div>

        {/* Footer Hint */}
        <div className="mt-8 pt-4 border-t border-[var(--border-subtle)]/60 flex items-center justify-center gap-1.5 text-[11px] text-[var(--text-muted)]">
          <Compass className="w-3.5 h-3.5 text-blue-500" />
          <span>Need inspiration? Explore prebuilt presets in the dashboard.</span>
        </div>
      </div>
    </div>
  );
};
