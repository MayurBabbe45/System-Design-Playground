import React, { useState } from 'react';
import * as Icons from 'lucide-react';
import { COMPONENT_CATALOG } from '../config/components';
import { ComponentTypeId, NodeCategory } from '../types/playground';

const CATEGORIES: { id: NodeCategory; name: string }[] = [
  { id: 'CLIENT', name: 'Clients & Gateways' },
  { id: 'NETWORK', name: 'Network & Routing' },
  { id: 'COMPUTE', name: 'Compute & App Servers' },
  { id: 'STORAGE', name: 'Databases & Caches' },
  { id: 'MESSAGING', name: 'Queues & Streaming' },
];

export const Sidebar: React.FC = () => {
  const [search, setSearch] = useState('');

  const handleDragStart = (event: React.DragEvent, typeId: ComponentTypeId) => {
    event.dataTransfer.setData('application/reactflow', typeId);
    event.dataTransfer.effectAllowed = 'move';
  };

  const catalogItems = Object.values(COMPONENT_CATALOG).filter(
    (item) =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <aside className="w-64 h-[calc(100vh-3.5rem)] bg-[var(--bg-surface)] border-r border-[var(--border-subtle)] flex flex-col z-20 select-none transition-colors duration-200">
      {/* Sidebar Header & Search */}
      <div className="p-3.5 border-b border-[var(--border-subtle)] space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold text-[var(--text-main)] uppercase tracking-wider flex items-center gap-1.5">
            <Icons.Layers className="w-3.5 h-3.5 text-orange-500" />
            Component Palette
          </div>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg-pill)] text-[var(--text-muted)] font-mono border border-[var(--border-subtle)]">
            {catalogItems.length} Nodes
          </span>
        </div>
        <div className="relative">
          <Icons.Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-neutral-400" />
          <input
            type="text"
            placeholder="Search nodes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[var(--bg-pill)] border border-[var(--border-subtle)] rounded-lg pl-8 pr-3 py-1.5 text-xs text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none focus:border-orange-500/80 transition-colors"
          />
        </div>
      </div>

      {/* Grouped Component List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4 custom-scrollbar">
        {CATEGORIES.map((cat) => {
          const itemsInCat = catalogItems.filter((item) => item.category === cat.id);
          if (itemsInCat.length === 0) return null;

          return (
            <div key={cat.id} className="space-y-1.5">
              <div className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider px-1">
                {cat.name}
              </div>
              <div className="space-y-1.5">
                {itemsInCat.map((item) => {
                  const IconComp =
                    (Icons as unknown as Record<string, React.ElementType>)[item.iconName] || Icons.Cpu;

                  return (
                    <div
                      key={item.typeId}
                      draggable
                      onDragStart={(e) => handleDragStart(e, item.typeId)}
                      className="group flex items-center justify-between p-2 rounded-lg bg-[var(--bg-panel)] hover:border-orange-500/40 border border-[var(--border-subtle)] cursor-grab active:cursor-grabbing transition-all shadow-sm"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0"
                          style={{ backgroundColor: `${item.color}25`, color: item.color }}
                        >
                          <IconComp className="w-3.5 h-3.5" />
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
                      <Icons.GripVertical className="w-3.5 h-3.5 text-neutral-400 group-hover:text-orange-500 shrink-0" />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Helper */}
      <div className="p-3 border-t border-[var(--border-subtle)] bg-[var(--bg-pill)] text-[10px] text-[var(--text-muted)] text-center font-medium">
        Drag and drop to canvas
      </div>
    </aside>
  );
};
