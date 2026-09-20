import React, { useState } from 'react';
import { 
  X, 
  Share2, 
  Download, 
  Upload, 
  Check, 
  Copy, 
  FileJson, 
  Link2, 
  Eye, 
  ExternalLink,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { usePlaygroundStore } from '../../store/usePlaygroundStore';

export const ShareModal: React.FC = () => {
  const { 
    isExportModalOpen, 
    toggleExportModal, 
    getShareableLink, 
    nodes, 
    edges,
    activeProject,
  } = usePlaygroundStore();

  const [copied, setCopied] = useState(false);
  const [importedStatus, setImportedStatus] = useState<string | null>(null);

  if (!isExportModalOpen) return null;

  const shareUrl = getShareableLink();
  const isCloudProject = Boolean(activeProject?.id && activeProject.id !== 'shared');

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback if clipboard API is restricted
      const input = document.getElementById('share-link-input') as HTMLInputElement;
      if (input) {
        input.select();
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  };

  const handleDownloadJson = () => {
    const exportData = {
      version: '2.0',
      exportedAt: new Date().toISOString(),
      name: activeProject?.name || 'Architecture Export',
      nodes: nodes.map((n) => ({
        id: n.id,
        type: n.type,
        position: n.position,
        data: n.data,
      })),
      edges: edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        type: e.type,
        label: e.label,
        data: e.data,
      })),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${(activeProject?.name || 'architecture').toLowerCase().replace(/\s+/g, '_')}_${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed.nodes) && Array.isArray(parsed.edges)) {
          usePlaygroundStore.setState({
            nodes: parsed.nodes,
            edges: parsed.edges,
            activePresetId: 'custom',
          });
          setImportedStatus('Architecture successfully restored!');
          setTimeout(() => {
            setImportedStatus(null);
            toggleExportModal();
          }, 1200);
        } else {
          setImportedStatus('Invalid format: file must contain nodes and edges.');
        }
      } catch {
        setImportedStatus('Failed to parse JSON file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 select-none animate-fadeIn">
      <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-main)] rounded-2xl w-full max-w-lg flex flex-col shadow-2xl overflow-hidden transition-all duration-200">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-panel)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/20">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[var(--text-main)] tracking-tight">Share Architecture</h2>
              <p className="text-[11px] text-[var(--text-muted)]">Interactive view-only simulation with zero destructive permissions</p>
            </div>
          </div>
          <button
            onClick={toggleExportModal}
            className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 space-y-4">
          
          {/* Interactive View-Only Callout */}
          <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 text-blue-900 dark:text-blue-200 text-xs space-y-1.5">
            <div className="flex items-center gap-2 font-semibold text-blue-700 dark:text-blue-300">
              <Eye className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
              <span>Interactive View-Only Mode</span>
            </div>
            <p className="text-[11px] text-blue-800/80 dark:text-blue-300/80 leading-relaxed">
              Anyone with this link can interactively simulate traffic, test resilience, trigger chaos scenarios, and inspect system telemetry without modifying your saved design.
            </p>
          </div>

          {/* Shareable Link Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold text-[var(--text-main)]">
              <label className="flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Public Simulation Link</span>
              </label>
              <span className="text-[10px] font-normal text-[var(--text-muted)]">
                {isCloudProject ? 'Cloud Architecture ID' : 'Stateless Encoded Hash'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <input
                id="share-link-input"
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 bg-[var(--bg-pill)] border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-xs text-[var(--text-main)] font-mono focus:outline-none focus:border-blue-500 select-all truncate"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shrink-0 shadow-sm transition-all cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy Link'}</span>
              </button>
            </div>

            <div className="flex items-center justify-between pt-1">
              <a
                href={shareUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-medium"
              >
                <ExternalLink className="w-3 h-3" />
                <span>Test link in new tab</span>
              </a>
              <span className="text-[10px] text-[var(--text-muted)] flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-500" /> Read-only protection active
              </span>
            </div>
          </div>

          {/* JSON Schema Export / Import */}
          <div className="border-t border-[var(--border-subtle)] pt-4 space-y-2">
            <label className="text-xs font-semibold text-[var(--text-main)] flex items-center gap-1.5">
              <FileJson className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>JSON Schema Backup</span>
            </label>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={handleDownloadJson}
                className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-[var(--bg-pill)] hover:bg-[var(--border-subtle)] border border-[var(--border-subtle)] text-[var(--text-main)] text-xs font-medium transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Download .json</span>
              </button>

              <label className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-[var(--bg-pill)] hover:bg-[var(--border-subtle)] border border-[var(--border-subtle)] text-[var(--text-main)] text-xs font-medium cursor-pointer transition-all">
                <Upload className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Import .json</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {importedStatus && (
              <div className="text-xs text-center font-medium text-blue-600 dark:text-blue-400 bg-blue-500/10 border border-blue-500/30 p-2 rounded-xl">
                {importedStatus}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 px-5 border-t border-[var(--border-subtle)] bg-[var(--bg-panel)] flex items-center justify-between text-[11px] text-[var(--text-muted)]">
          <div className="flex items-center gap-2">
            <Zap className="w-3 h-3 text-amber-500" />
            <span>{nodes.length} Nodes · {edges.length} Connections</span>
          </div>
          <button
            type="button"
            onClick={toggleExportModal}
            className="px-3 py-1 rounded-lg bg-[var(--bg-pill)] hover:bg-[var(--border-subtle)] text-[var(--text-main)] text-xs border border-[var(--border-subtle)] transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
