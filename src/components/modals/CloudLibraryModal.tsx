import React, { useState, useEffect } from 'react';
import { 
  Cloud, 
  FolderDown, 
  GitFork, 
  Trash2, 
  Save, 
  X, 
  Check, 
  Sparkles, 
  BarChart3, 
  Globe, 
  Lock, 
  Layers, 
  RefreshCw,
  ExternalLink,
  Activity
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { usePlaygroundStore } from '../../store/usePlaygroundStore';
import { apiClient, SavedArchitecture, TelemetryAnalyticsResult } from '../../api/client';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

export const CloudLibraryModal: React.FC = () => {
  const { 
    isLibraryModalOpen, 
    toggleLibraryModal, 
    nodes, 
    edges, 
    loadSavedArchitecture,
    activeCloudArchitectureId,
    activePresetId
  } = usePlaygroundStore();

  const [activeTab, setActiveTab] = useState<'browse' | 'save' | 'analytics'>('browse');
  const [architectures, setArchitectures] = useState<SavedArchitecture[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [archToDelete, setArchToDelete] = useState<SavedArchitecture | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Save form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Analytics state
  const [analytics, setAnalytics] = useState<TelemetryAnalyticsResult | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  useEffect(() => {
    if (isLibraryModalOpen) {
      loadArchitecturesList();
      loadAnalyticsData();
    }
  }, [isLibraryModalOpen]);

  const loadArchitecturesList = async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await apiClient.listArchitectures();
      setArchitectures(list);
    } catch (err: any) {
      setError(err.message || 'Failed to load cloud architectures');
    } finally {
      setLoading(false);
    }
  };

  const loadAnalyticsData = async () => {
    setLoadingAnalytics(true);
    try {
      const data = await apiClient.queryAnalytics(undefined, 60);
      setAnalytics(data);
    } catch (err) {
      console.warn('Failed to load ClickHouse telemetry analytics:', err);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  if (!isLibraryModalOpen) return null;

  const handleSaveCurrent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const saved = await apiClient.saveArchitecture({
        name: title.trim(),
        description: description.trim(),
        nodes,
        edges,
        isPublic,
      });

      confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setActiveTab('browse');
        loadArchitecturesList();
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Failed to save architecture');
    } finally {
      setLoading(false);
    }
  };

  const handleLoad = async (arch: SavedArchitecture) => {
    loadSavedArchitecture(arch);
    toggleLibraryModal();
  };

  const handleFork = async (arch: SavedArchitecture) => {
    try {
      setLoading(true);
      await apiClient.forkArchitecture(arch.id, `${arch.name} (Fork)`);
      confetti({ particleCount: 40, spread: 50 });
      await loadArchitecturesList();
    } catch (err: any) {
      setError(err.message || 'Failed to fork architecture');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!archToDelete) return;
    try {
      setIsDeleting(true);
      await apiClient.deleteArchitecture(archToDelete.id);
      setArchToDelete(null);
      await loadArchitecturesList();
    } catch (err: any) {
      setError(err.message || 'Failed to delete architecture');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="w-full max-w-2xl rounded-2xl bg-[var(--surface-bg)] border border-[var(--surface-border)] shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--surface-border)] bg-[var(--canvas-bg)]/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <Cloud className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                Cloud Architecture Hub
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30">
                  PostgreSQL & ClickHouse
                </span>
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Relational persistence, version control, and time-series telemetry storage
              </p>
            </div>
          </div>
          <button
            onClick={toggleLibraryModal}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-[var(--surface-border)] bg-[var(--canvas-bg)]/20">
          <button
            onClick={() => setActiveTab('browse')}
            className={`pb-2.5 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'browse'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Saved Architectures ({architectures.length})
          </button>
          <button
            onClick={() => setActiveTab('save')}
            className={`pb-2.5 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'save'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Save className="w-3.5 h-3.5" />
            Save Current Architecture
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`pb-2.5 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'analytics'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            ClickHouse Telemetry Rollup
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-950/40 border border-red-800 text-xs text-red-300">
              {error}
            </div>
          )}

          {/* --- TAB 1: BROWSE ARCHITECTURES --- */}
          {activeTab === 'browse' && (
            <div className="space-y-3">
              {loading && (
                <div className="py-8 text-center text-xs text-[var(--text-muted)] flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
                  Loading architectures from PostgreSQL...
                </div>
              )}

              {!loading && architectures.length === 0 && (
                <div className="py-12 text-center text-xs text-[var(--text-muted)] space-y-2">
                  <Cloud className="w-8 h-8 text-zinc-600 mx-auto stroke-1" />
                  <p>No architectures saved to the cloud yet.</p>
                  <button
                    onClick={() => setActiveTab('save')}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600/30 transition-colors"
                  >
                    Save Your Current Architecture
                  </button>
                </div>
              )}

              {!loading && architectures.map((arch) => (
                <div
                  key={arch.id}
                  className="p-4 rounded-xl bg-[var(--canvas-bg)]/50 border border-[var(--surface-border)] hover:border-blue-500/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-[var(--text-primary)] group-hover:text-blue-400 transition-colors">
                        {arch.name}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[var(--surface-hover)] text-[var(--text-muted)] border border-[var(--surface-border)]">
                        v{arch.version}
                      </span>
                      <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${
                        arch.grade === 'A' ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' :
                        arch.grade === 'B' ? 'text-blue-400 border-blue-500/30 bg-blue-500/10' :
                        'text-amber-400 border-amber-500/30 bg-amber-500/10'
                      }`}>
                        Grade {arch.grade}
                      </span>
                    </div>

                    {arch.description && (
                      <p className="text-[11px] text-[var(--text-secondary)] line-clamp-1">
                        {arch.description}
                      </p>
                    )}

                    <div className="text-[10px] text-[var(--text-muted)] flex items-center gap-3">
                      <span>{arch.nodes.length} Components</span>
                      <span>•</span>
                      <span>${arch.monthlyCost.toLocaleString()}/mo</span>
                      <span>•</span>
                      <span>By {arch.authorName}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleLoad(arch)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <FolderDown className="w-3.5 h-3.5" />
                      Load
                    </button>
                    <button
                      onClick={() => handleFork(arch)}
                      title="Fork Architecture"
                      className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] border border-[var(--surface-border)] transition-colors cursor-pointer"
                    >
                      <GitFork className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setArchToDelete(arch)}
                      title="Delete Architecture"
                      className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* --- TAB 2: SAVE ARCHITECTURE --- */}
          {activeTab === 'save' && (
            <form onSubmit={handleSaveCurrent} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--text-primary)]">Architecture Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Global Multi-Region Payment Engine"
                  className="w-full px-3 py-2 rounded-xl bg-[var(--canvas-bg)] border border-[var(--surface-border)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--text-primary)]">Description / Architecture Notes</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe topology, fault-tolerance measures, target RPS, and database replication strategy..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--canvas-bg)] border border-[var(--surface-border)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--canvas-bg)]/50 border border-[var(--surface-border)]">
                <div className="flex items-center gap-2">
                  {isPublic ? <Globe className="w-4 h-4 text-emerald-400" /> : <Lock className="w-4 h-4 text-amber-400" />}
                  <div>
                    <div className="text-xs font-semibold text-[var(--text-primary)]">
                      {isPublic ? 'Public Architecture' : 'Private (Only You)'}
                    </div>
                    <div className="text-[10px] text-[var(--text-muted)]">
                      {isPublic ? 'Visible to teammates and listed in public gallery' : 'Restricted to your credentials'}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPublic(!isPublic)}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium border border-[var(--surface-border)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
                >
                  Toggle
                </button>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={toggleLibraryModal}
                  className="px-3 py-2 rounded-xl text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {saveSuccess ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Save className="w-3.5 h-3.5" />}
                  {saveSuccess ? 'Saved to PostgreSQL!' : 'Save Architecture'}
                </button>
              </div>
            </form>
          )}

          {/* --- TAB 3: CLICKHOUSE TELEMETRY ROLLUP --- */}
          {activeTab === 'analytics' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-[var(--text-primary)]">
                  Columnar Simulation Metrics Rollup
                </div>
                <button
                  onClick={loadAnalyticsData}
                  className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                  title="Refresh analytics"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingAnalytics ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {analytics && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl bg-[var(--canvas-bg)]/60 border border-[var(--surface-border)]">
                    <div className="text-[10px] text-[var(--text-muted)]">P50 Latency</div>
                    <div className="text-base font-bold font-mono text-emerald-400">{analytics.p50LatencyMs}ms</div>
                  </div>
                  <div className="p-3 rounded-xl bg-[var(--canvas-bg)]/60 border border-[var(--surface-border)]">
                    <div className="text-[10px] text-[var(--text-muted)]">P95 Latency</div>
                    <div className="text-base font-bold font-mono text-cyan-400">{analytics.p95LatencyMs}ms</div>
                  </div>
                  <div className="p-3 rounded-xl bg-[var(--canvas-bg)]/60 border border-[var(--surface-border)]">
                    <div className="text-[10px] text-[var(--text-muted)]">P99 Latency</div>
                    <div className="text-base font-bold font-mono text-amber-400">{analytics.p99LatencyMs}ms</div>
                  </div>
                  <div className="p-3 rounded-xl bg-[var(--canvas-bg)]/60 border border-[var(--surface-border)]">
                    <div className="text-[10px] text-[var(--text-muted)]">Max Recorded RPS</div>
                    <div className="text-base font-bold font-mono text-purple-400">{analytics.maxRps.toLocaleString()}</div>
                  </div>
                </div>
              )}

              <div className="p-4 rounded-xl bg-[var(--canvas-bg)]/40 border border-[var(--surface-border)] space-y-2">
                <div className="text-xs font-semibold text-[var(--text-primary)] flex items-center justify-between">
                  <span>Engine Telemetry Ingest Mode</span>
                  <span className="text-[10px] font-mono text-blue-400">
                    {analytics?.source === 'clickhouse-native' ? 'ClickHouse Native' : 'Embedded Columnar Buffer'}
                  </span>
                </div>
                <p className="text-[11px] text-[var(--text-secondary)]">
                  Total Simulation Ticks Ingested: <span className="font-mono font-semibold text-[var(--text-primary)]">{analytics?.totalTicks.toLocaleString() || 0}</span>
                </p>
                <p className="text-[10px] text-[var(--text-muted)]">
                  Simulation ticks are automatically batched every 2 seconds and streamed into the ClickHouse columnar logging engine for high-throughput percentile calculations.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <ConfirmDeleteModal
        isOpen={Boolean(archToDelete)}
        itemName={archToDelete?.name}
        isDeleting={isDeleting}
        onConfirm={handleConfirmDelete}
        onClose={() => {
          if (!isDeleting) setArchToDelete(null);
        }}
      />
    </div>
  );
};
