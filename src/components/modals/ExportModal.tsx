import React, { useState } from 'react';
import { 
  X, 
  Share2, 
  Download, 
  Upload, 
  Check, 
  Copy, 
  FileJson, 
  Link, 
  Layers 
} from 'lucide-react';
import { usePlaygroundStore } from '../../store/usePlaygroundStore';

export const ExportModal: React.FC = () => {
  const { 
    isExportModalOpen, 
    toggleExportModal, 
    getCompressedShareUrl, 
    nodes, 
    edges,
    loadPreset 
  } = usePlaygroundStore();

  const [copied, setCopied] = useState(false);
  const [importedStatus, setImportedStatus] = useState<string | null>(null);

  if (!isExportModalOpen) return null;

  const shareUrl = getCompressedShareUrl();

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadJson = () => {
    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
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
    link.download = `system_design_architecture_${Date.now()}.json`;
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
          setImportedStatus('Invalid JSON format: missing nodes/edges.');
        }
      } catch (err) {
        setImportedStatus('Error parsing JSON file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 select-none animate-in fade-in duration-150">
      <div className="bg-[#161922] border border-white/10 rounded-2xl w-full max-w-lg flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-[#11141c]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#ff6d5a]/20 text-[#ff6d5a] flex items-center justify-center border border-[#ff6d5a]/30">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">Share & Export Architecture</h2>
              <p className="text-[11px] text-neutral-400">Stateless URL sharing & JSON export</p>
            </div>
          </div>
          <button
            onClick={toggleExportModal}
            className="p-1 rounded-md text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-5">
          {/* Stateless URL Share Option */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
              <Link className="w-3.5 h-3.5 text-blue-400" />
              Stateless URL Share Link (Compressed Hash)
            </label>
            <p className="text-[11px] text-neutral-400 leading-snug">
              Generates a zero-backend, LZ-String compressed hash stored entirely in the URL. Anyone with this link can view your exact architecture without an account.
            </p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 bg-[#0e1117] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-neutral-300 font-mono focus:outline-none select-all truncate"
              />
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#ff6d5a] hover:bg-[#ff5740] text-white text-xs font-semibold shrink-0 shadow-sm transition-all"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy Link'}</span>
              </button>
            </div>
          </div>

          <div className="border-t border-white/10 pt-4 space-y-3">
            <label className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
              <FileJson className="w-3.5 h-3.5 text-emerald-400" />
              JSON Architecture Schema
            </label>

            <div className="grid grid-cols-2 gap-3">
              {/* Download JSON Button */}
              <button
                onClick={handleDownloadJson}
                className="flex items-center justify-center gap-2 p-3 rounded-xl bg-[#0e1117] hover:bg-[#1a1e2b] border border-white/10 text-neutral-200 text-xs font-semibold transition-all group"
              >
                <Download className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                <span>Download .json</span>
              </button>

              {/* Upload JSON Button */}
              <label className="flex items-center justify-center gap-2 p-3 rounded-xl bg-[#0e1117] hover:bg-[#1a1e2b] border border-white/10 text-neutral-200 text-xs font-semibold cursor-pointer transition-all group">
                <Upload className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
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
              <div className="text-xs text-center font-semibold text-cyan-400 bg-cyan-950/40 border border-cyan-800/60 p-2 rounded-lg">
                {importedStatus}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-[#11141c] flex items-center justify-between text-[11px] text-neutral-400">
          <span>Total Nodes: {nodes.length} · Connections: {edges.length}</span>
          <button
            onClick={toggleExportModal}
            className="px-3 py-1 rounded-md bg-white/5 hover:bg-white/10 text-neutral-200 text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
