import React, { useEffect } from 'react';
import { Trash2, AlertTriangle, X, Loader2 } from 'lucide-react';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  title?: string;
  itemName?: string;
  description?: string;
  confirmLabel?: string;
  isDeleting?: boolean;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  title = 'Delete Architecture',
  itemName,
  description,
  confirmLabel = 'Delete Project',
  isDeleting = false,
  onConfirm,
  onClose,
}) => {
  // Dismiss on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isDeleting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isDeleting, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isDeleting) {
          onClose();
        }
      }}
    >
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        className="w-full max-w-md bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-scaleUp"
      >
        {/* Modal Top Bar */}
        <div className="px-5 py-4 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-panel)]/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 dark:text-rose-400">
              <Trash2 className="w-4 h-4" />
            </div>
            <h3 id="confirm-modal-title" className="text-sm font-bold text-[var(--text-main)]">
              {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            aria-label="Close dialog"
            className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-pill)] transition-colors cursor-pointer disabled:opacity-40"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 space-y-3.5">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 dark:text-amber-400 shrink-0 mt-0.5">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div className="space-y-1.5 text-xs text-[var(--text-muted)] leading-relaxed">
              <p>
                {description || (
                  <>
                    Are you sure you want to permanently delete{' '}
                    {itemName ? (
                      <span className="font-semibold text-[var(--text-main)] px-1.5 py-0.5 rounded bg-[var(--bg-pill)] border border-[var(--border-subtle)]">
                        {itemName}
                      </span>
                    ) : (
                      'this architecture project'
                    )}
                    ?
                  </>
                )}
              </p>
              <p className="text-[11px] text-[var(--text-muted)]/80">
                This action cannot be undone. All associated node configurations, connections, and telemetry records will be wiped.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Actions Footer */}
        <div className="px-5 py-3.5 border-t border-[var(--border-subtle)] bg-[var(--bg-panel)]/30 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-pill)] border border-[var(--border-subtle)] transition-all cursor-pointer disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow-sm shadow-rose-600/30 flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>{confirmLabel}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
