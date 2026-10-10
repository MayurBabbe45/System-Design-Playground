import React, { useState } from 'react';
import { PanelLeftOpen, PanelLeftClose, Layers, Search, GripVertical, Eye, GitFork } from 'lucide-react';
import { COMPONENT_CATALOG } from '../config/components';
import { ComponentTypeId, NodeCategory } from '../types/playground';
import { usePlaygroundStore } from '../store/usePlaygroundStore';
import { ComponentIcon } from './icons/ComponentIcons';

const CATEGORIES: { id: NodeCategory; name: string }[] = [
  { id: 'CLIENT', name: 'Clients & Gateways' },
  { id: 'NETWORK', name: 'Network & Routing' },
  { id: 'COMPUTE', name: 'Compute & App Servers' },
  { id: 'STORAGE', name: 'Databases & Caches' },
  { id: 'MESSAGING', name: 'Queues & Streaming' },
];

export const Sidebar: React.FC = () => {
  const { isViewOnly, forkActiveProject } = usePlaygroundStore();
  const [search, setSearch] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return typeof window !== 'undefined' ? window.innerWidth < 768 : false;
  });

  const handleDragStart = (event: React.DragEvent, typeId: ComponentTypeId) => {
    if (isViewOnly) {
      event.preventDefault();
      return;
    }
    event.dataTransfer.setData('application/reactflow', typeId);
    event.dataTransfer.effectAllowed = 'move';

    const template = document.getElementById(`drag-preview-${typeId}`);
    if (template && event.dataTransfer.setDragImage) {
      const clone = template.cloneNode(true) as HTMLElement;
      clone.id = `active-drag-clone-${typeId}`;
      clone.style.position = 'fixed';
      clone.style.top = `${event.clientY - 42}px`;
      clone.style.left = `${event.clientX - 45}px`;
      clone.style.zIndex = '99999';
      clone.style.pointerEvents = 'none';
      document.body.appendChild(clone);

      event.dataTransfer.setDragImage(clone, 45, 42);

      setTimeout(() => {
        if (clone.parentNode) {
          clone.parentNode.removeChild(clone);
        }
      }, 0);
    }
  };

  const catalogItems = Object.values(COMPONENT_CATALOG).filter(
    (item) =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.category.toLowerCase().includes(search.toLowerCase())
  );

  const dragPreviewTemplates = (
    <div
      style={{ position: 'fixed', left: -3000, top: -3000, pointerEvents: 'none', zIndex: -100 }}
      aria-hidden="true"
    >
      {Object.values(COMPONENT_CATALOG).map((item) => (
        <div
          key={`drag-preview-${item.typeId}`}
          id={`drag-preview-${item.typeId}`}
          className="flex flex-col items-center select-none"
          style={{ width: '92px' }}
        >
          <div
            className={`w-[84px] h-[84px] flex items-center justify-center bg-[#151926] border-2 shadow-2xl ${
              item.typeId === 'traffic_generator' ? 'rounded-l-3xl rounded-r-2xl' : 'rounded-2xl'
            }`}
            style={{
              borderColor: item.color || '#3b82f6',
              boxShadow: `0 14px 35px rgba(0,0,0,0.85), 0 0 25px ${item.color}50, inset 0 1px 0 rgba(255,255,255,0.25)`,
            }}
          >
            <ComponentIcon typeId={item.typeId} size={48} color={item.color} />
          </div>
          <div
            className="mt-1.5 px-2.5 py-0.5 rounded-lg bg-[#0e111a]/95 border border-white/20 text-[10px] font-bold text-white text-center truncate shadow-xl max-w-[92px]"
          >
            {item.name}
          </div>
        </div>
      ))}
    </div>
  );

  if (isCollapsed) {
    return (
      <>
        <aside className="w-13 h-[calc(100vh-3.25rem)] spatial-glass border-r border-white/10 flex flex-col items-center py-2.5 z-20 select-none transition-all duration-200">
          <button
            onClick={() => setIsCollapsed(false)}
            title="Expand Palette"
            className="p-2 rounded-xl spatial-glass-card text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors mb-3 cursor-pointer"
          >
            <PanelLeftOpen className="w-4 h-4" />
          </button>

          <div className="h-px w-6 bg-white/10 mb-3" />

          <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col items-center gap-2 px-1.5">
            {catalogItems.map((item) => (
              <div
                key={item.typeId}
                draggable
                onDragStart={(e) => handleDragStart(e, item.typeId)}
                title={`${item.name} (${item.defaultCapacityRps.toLocaleString()} RPS max) — Drag to Canvas`}
                className="w-9 h-9 rounded-xl flex items-center justify-center cursor-grab active:cursor-grabbing hover:scale-110 transition-transform spatial-glass-card border border-white/10 shadow-xs"
                style={{
                  background: `linear-gradient(135deg, ${item.color}25 0%, ${item.color}10 100%)`,
                }}
              >
                <ComponentIcon typeId={item.typeId} size={20} color={item.color} />
              </div>
            ))}
          </div>
        </aside>
        {dragPreviewTemplates}
      </>
    );
  }

  return (
    <>
      <aside className="w-68 h-[calc(100vh-3.25rem)] spatial-glass border-r border-white/10 flex flex-col z-20 select-none transition-all duration-200">
      {/* Sidebar Header & Search */}
      <div className="p-3 border-b border-white/10 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold text-[var(--text-main)] uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-blue-400" />
            Component Palette
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[11px] px-2 py-0.5 rounded-lg spatial-pill text-[var(--text-muted)] font-mono border border-white/10">
              {catalogItems.length}
            </span>
            <button
              onClick={() => setIsCollapsed(true)}
              title="Collapse Palette"
              className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] spatial-glass-card transition-colors cursor-pointer ml-1"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search components..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full spatial-pill border border-white/10 rounded-xl pl-8 pr-2.5 py-1.5 text-xs text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none focus:border-blue-500/60 transition-colors"
          />
        </div>

        {/* View-Only Mode Banner */}
        {isViewOnly && (
          <div className="p-2.5 rounded-xl bg-blue-500/15 border border-blue-500/30 space-y-1 text-center">
            <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-blue-300">
              <Eye className="w-3.5 h-3.5" />
              <span>View-Only Mode</span>
            </div>
            <p className="text-[11px] text-blue-200/80 leading-tight">
              Interactive simulation is active. Fork this architecture to edit components.
            </p>
            <button
              type="button"
              onClick={() => forkActiveProject()}
              className="w-full mt-1.5 py-1.5 px-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold transition-all cursor-pointer shadow-xs flex items-center justify-center gap-1.5 border border-blue-400/30"
            >
              <GitFork className="w-3.5 h-3.5" />
              <span>Fork Architecture</span>
            </button>
          </div>
        )}
      </div>

      {/* Grouped Component List */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-3.5 custom-scrollbar">
        {CATEGORIES.map((cat) => {
          const itemsInCat = catalogItems.filter((item) => item.category === cat.id);
          if (itemsInCat.length === 0) return null;

          return (
            <div key={cat.id} className="space-y-1.5">
              <div className="text-[11px] font-bold text-white/50 uppercase tracking-wider px-1">
                {cat.name}
              </div>
              <div className="space-y-1.5">
                {itemsInCat.map((item) => (
                  <div
                    key={item.typeId}
                    draggable={!isViewOnly}
                    onDragStart={(e) => handleDragStart(e, item.typeId)}
                    title={
                      isViewOnly
                        ? `${item.name} (View-Only Mode)`
                        : `${item.name} (${item.defaultCapacityRps.toLocaleString()} RPS max) — Drag to Canvas`
                    }
                    className={`group flex items-center justify-between p-2 rounded-xl spatial-glass-card border border-white/10 transition-all ${
                      isViewOnly
                        ? 'opacity-60 cursor-not-allowed'
                        : 'hover:border-blue-400/40 cursor-grab active:cursor-grabbing hover:scale-[1.01]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border border-white/10 shadow-xs"
                        style={{
                          background: `linear-gradient(135deg, ${item.color}25 0%, ${item.color}10 100%)`,
                        }}
                      >
                        <ComponentIcon typeId={item.typeId} size={24} color={item.color} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-[var(--text-main)] truncate">
                          {item.name}
                        </div>
                        <div className="text-[11px] text-[var(--text-muted)] font-mono">
                          {item.defaultCapacityRps.toLocaleString()} RPS max
                        </div>
                      </div>
                    </div>
                    <GripVertical className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:text-blue-400 shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Helper */}
      <div className="p-2 border-t border-white/10 spatial-glass text-[10px] text-[var(--text-muted)] text-center font-medium">
        {isViewOnly ? 'Interactive simulation active (Read-only)' : 'Drag and drop to canvas'}
      </div>
    </aside>
    {dragPreviewTemplates}
  </>
  );
};
