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
    <aside className="w-64 h-[calc(100vh-3.5rem)] bg-[#161922] border-r border-white/10 flex flex-col z-20 select-none">
      {/* Sidebar Header & Search */}
      <div className="p-3.5 border-b border-white/10 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold text-neutral-200 uppercase tracking-wider flex items-center gap-1.5">
            <Icons.Layers className="w-3.5 h-3.5 text-orange-500" />
            Component Palette
          </div>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#0e1117] text-neutral-400 font-mono border border-white/5">
            {catalogItems.length} Nodes
          </span>
        </div>
        <div className="relative">
          <Icons.Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-neutral-500" />
          <input
            type="text"
            placeholder="Search nodes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#0e1117] border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-orange-500/80 transition-colors"
          />
        </div>
      </div>

      {/* Grouped Component List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {CATEGORIES.map((cat) => {
          const itemsInCat = catalogItems.filter((item) => item.category === cat.id);
          if (itemsInCat.length === 0) return null;

          return (
            <div key={cat.id} className="space-y-1.5">
              <div className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider px-1">
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
                      className="group flex items-center justify-between p-2 rounded-lg bg-[#1e2230] hover:bg-[#252a3d] border border-white/5 hover:border-white/20 cursor-grab active:cursor-grabbing transition-all shadow-sm"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0"
                          style={{ backgroundColor: `${item.color}25`, color: item.color }}
                        >
                          <IconComp className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-medium text-neutral-200 group-hover:text-white truncate">
                            {item.name}
                          </div>
                          <div className="text-[10px] text-neutral-400 font-mono">
                            {item.defaultCapacityRps.toLocaleString()} RPS max
                          </div>
                        </div>
                      </div>
                      <Icons.GripVertical className="w-3.5 h-3.5 text-neutral-600 group-hover:text-neutral-400 shrink-0" />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Helper */}
      <div className="p-3 border-t border-white/10 bg-[#0e1117] text-[10px] text-neutral-400 text-center font-medium">
        Drag and drop to canvas
      </div>
    </aside>
  );
};
