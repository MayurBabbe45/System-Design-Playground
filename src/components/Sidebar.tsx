import React, { useState } from 'react';
import * as Icons from 'lucide-react';
import { COMPONENT_CATALOG } from '../config/components';
import { ComponentTypeId, NodeCategory } from '../types/playground';

import { usePlaygroundStore } from '../store/usePlaygroundStore';

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
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleDragStart = (event: React.DragEvent, typeId: ComponentTypeId) => {
    if (isViewOnly) {
      event.preventDefault();
      return;
    }
    event.dataTransfer.setData('application/reactflow', typeId);
    event.dataTransfer.effectAllowed = 'move';
  };

  const catalogItems = Object.values(COMPONENT_CATALOG).filter(
    (item) =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.category.toLowerCase().includes(search.toLowerCase())
  );

  if (isCollapsed) {
    return (
      <aside className="w-13 h-[calc(100vh-3.25rem)] bg-[var(--bg-surface)] border-r border-[var(--border-subtle)] flex flex-col items-center py-2.5 z-20 select-none transition-all duration-200">
        <button
          onClick={() => setIsCollapsed(false)}
          title="Expand Palette"
          className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-black/5 dark:hover:bg-white/5 transition-colors mb-3 cursor-pointer"
        >
          <Icons.PanelLeftOpen className="w-4 h-4" />
        </button>

        <div className="h-px w-6 bg-[var(--border-subtle)] mb-3" />

        <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col items-center gap-2 px-1.5">
          {catalogItems.map((item) => {
            const IconComp =
              (Icons as unknown as Record<string, React.ElementType>)[item.iconName] || Icons.Cpu;

            return (
              <div
                key={item.typeId}
                draggable
                onDragStart={(e) => handleDragStart(e, item.typeId)}
                title={`${item.name} (${item.defaultCapacityRps.toLocaleString()} RPS max) — Drag to Canvas`}
                className="w-8 h-8 rounded-lg flex items-center justify-center cursor-grab active:cursor-grabbing hover:scale-110 transition-transform border border-[var(--border-subtle)] shadow-xs"
                style={{ backgroundColor: `${item.color}20`, color: item.color }}
              >
                <IconComp className="w-4 h-4" />
              </div>
            );
          })}
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-64 h-[calc(100vh-3.25rem)] bg-[var(--bg-surface)] border-r border-[var(--border-subtle)] flex flex-col z-20 select-none transition-colors duration-200">
      {/* Sidebar Header & Search */}
      <div className="p-3 border-b border-[var(--border-subtle)] space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold text-[var(--text-main)] uppercase tracking-wider flex items-center gap-1.5">
            <Icons.Layers className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            Component Palette
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-[var(--bg-pill)] text-[var(--text-muted)] font-mono border border-[var(--border-subtle)]">
              {catalogItems.length}
            </span>
            <button
              onClick={() => setIsCollapsed(true)}
              title="Collapse Palette"
              className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer ml-1"
            >
              <Icons.PanelLeftClose className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        <div className="relative">
          <Icons.Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search components..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[var(--bg-pill)] border border-[var(--border-subtle)] rounded-lg pl-8 pr-2.5 py-1 text-xs text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        {/* View-Only Mode Banner */}
        {isViewOnly && (
          <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 space-y-1 text-center">
            <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-blue-700 dark:text-blue-300">
              <Icons.Eye className="w-3.5 h-3.5" />
              <span>View-Only Mode</span>
            </div>
            <p className="text-[10px] text-blue-800/80 dark:text-blue-300/80 leading-tight">
              Interactive simulation is active. Fork this architecture to edit components.
            </p>
            <button
              type="button"
              onClick={() => forkActiveProject()}
              className="w-full mt-1.5 py-1 px-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-semibold transition-all cursor-pointer shadow-xs flex items-center justify-center gap-1"
            >
              <Icons.GitFork className="w-3 h-3" />
              <span>Fork Architecture</span>
            </button>
          </div>
        )}
      </div>

      {/* Grouped Component List */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-3 custom-scrollbar">
        {CATEGORIES.map((cat) => {
          const itemsInCat = catalogItems.filter((item) => item.category === cat.id);
          if (itemsInCat.length === 0) return null;

          return (
            <div key={cat.id} className="space-y-1">
              <div className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider px-1">
                {cat.name}
              </div>
              <div className="space-y-1">
                {itemsInCat.map((item) => {
                  const IconComp =
                    (Icons as unknown as Record<string, React.ElementType>)[item.iconName] || Icons.Cpu;

                  return (
                    <div
                      key={item.typeId}
                      draggable={!isViewOnly}
                      onDragStart={(e) => handleDragStart(e, item.typeId)}
                      title={
                        isViewOnly
                          ? `${item.name} (View-Only Mode)`
                          : `${item.name} (${item.defaultCapacityRps.toLocaleString()} RPS max) — Drag to Canvas`
                      }
                      className={`group flex items-center justify-between p-1.5 rounded-lg bg-[var(--bg-panel)] border border-[var(--border-subtle)] transition-all shadow-xs ${
                        isViewOnly
                          ? 'opacity-60 cursor-not-allowed'
                          : 'hover:border-blue-500/40 cursor-grab active:cursor-grabbing'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className="w-6 h-6 rounded-md flex items-center justify-center text-white shrink-0"
                          style={{ backgroundColor: `${item.color}25`, color: item.color }}
                        >
                          <IconComp className="w-3 h-3" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-medium text-[var(--text-main)] truncate">
                            {item.name}
                          </div>
                          <div className="text-[10px] text-[var(--text-muted)] font-mono">
                            {item.defaultCapacityRps.toLocaleString()} RPS max
                          </div>
                        </div>
                      </div>
                      <Icons.GripVertical className="w-3 h-3 text-[var(--text-muted)] group-hover:text-blue-500 shrink-0" />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Helper */}
      <div className="p-2 border-t border-[var(--border-subtle)] bg-[var(--bg-pill)] text-[10px] text-[var(--text-muted)] text-center font-medium">
        {isViewOnly ? 'Interactive simulation active (Read-only)' : 'Drag and drop to canvas'}
      </div>
    </aside>
  );
};
