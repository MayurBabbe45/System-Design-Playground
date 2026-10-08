import React, { useState } from 'react';
import { 
  X, 
  Plus, 
  Layers, 
  Server, 
  Compass,
  Database,
  Loader2, 
  ArrowRight
} from 'lucide-react';
import { usePlaygroundStore } from '../../store/usePlaygroundStore';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTemplateId?: string;
}

interface TemplateOption {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  tag: string;
}

const TEMPLATES: TemplateOption[] = [
  {
    id: 'blank',
    name: 'Blank Canvas',
    description: 'Start from scratch with a clean, empty distributed system canvas.',
    icon: <Plus className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
    tag: 'Custom',
  },
  {
    id: 'classic-web-app',
    name: 'Multi-AZ Web Application',
    description: '3-tier high availability web app with ALB, web nodes, Redis, and Postgres.',
    icon: <Server className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
    tag: 'Recommended',
  },
  {
    id: 'flash-sale-ecommerce',
    name: 'Flash Sale E-Commerce Pipeline',
    description: 'Surge traffic pipeline with CDN, Rate-Limited Gateway, Kafka queue & replicas.',
    icon: <Compass className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
    tag: 'High Throughput',
  },
  {
    id: 'microservices-mesh',
    name: 'CQRS & Event-Driven Services',
    description: 'Decoupled event streaming topology with background workers and partitioned stores.',
    icon: <Database className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
    tag: 'Distributed',
  },
];

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
  defaultTemplateId = 'blank',
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(defaultTemplateId);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { createNewProject } = usePlaygroundStore();

  React.useEffect(() => {
    if (isOpen) {
      setName('');
      setDescription('');
      setSelectedTemplate(defaultTemplateId);
      setIsSubmitting(false);
      setError(null);
    }
  }, [isOpen, defaultTemplateId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const createdId = await createNewProject(name, description, selectedTemplate);
      if (createdId) {
        onClose();
      } else {
        setError('Failed to create architecture project. Please try again.');
        setIsSubmitting(false);
      }
    } catch (err: any) {
      console.error('Failed to create project:', err);
      setError(err?.message || 'Failed to create architecture project.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn select-none">
      <div className="w-full max-w-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-panel)]/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-sm">
              <Layers className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[var(--text-main)]">Create New Architecture Project</h2>
              <p className="text-[11px] text-[var(--text-muted)]">Set up your distributed system canvas</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-pill)] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          {error && (
            <div className="px-3.5 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 dark:text-rose-400 text-xs flex items-center gap-2 animate-fadeIn">
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
              Project Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError(null);
              }}
              placeholder="e.g. Payment Gateway, Order Ingest Service"
              className="w-full px-3.5 py-2.5 bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-xl text-xs text-[var(--text-main)] placeholder-[var(--text-muted)]/60 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the architecture requirements and traffic goals..."
              className="w-full px-3.5 py-2 bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-xl text-xs text-[var(--text-main)] placeholder-[var(--text-muted)]/60 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all resize-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2">
              Choose Starting Topology
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {TEMPLATES.map((tmpl) => {
                const isSelected = selectedTemplate === tmpl.id;
                return (
                  <div
                    key={tmpl.id}
                    onClick={() => setSelectedTemplate(tmpl.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-blue-500 bg-blue-500/10 shadow-sm ring-1 ring-blue-500/40'
                        : 'border-[var(--border-subtle)] bg-[var(--bg-panel)] hover:bg-[var(--bg-pill)]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
                            {tmpl.icon}
                          </div>
                          <span className="text-xs font-semibold text-[var(--text-main)]">{tmpl.name}</span>
                        </div>
                      </div>
                      <p className="text-[10.5px] text-[var(--text-muted)] leading-relaxed">{tmpl.description}</p>
                    </div>
                    <div className="mt-2.5 flex items-center justify-between">
                      <span className="text-[9.5px] px-1.5 py-0.5 rounded bg-[var(--bg-surface)] text-[var(--text-muted)] font-medium border border-[var(--border-subtle)]">
                        {tmpl.tag}
                      </span>
                      {isSelected && (
                        <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1">
                          Selected
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-pill)] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/20 flex items-center gap-2 transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Create & Open Canvas</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
