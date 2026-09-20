import React, { useState, useEffect, useMemo } from 'react';
import { 
  Network, 
  Layers, 
  Plus, 
  Search, 
  Filter, 
  DollarSign, 
  ShieldCheck, 
  Clock, 
  MoreVertical, 
  GitFork, 
  Trash2, 
  ExternalLink, 
  Sparkles, 
  Sun, 
  Moon, 
  LogOut, 
  User, 
  Cpu, 
  Server, 
  BarChart3, 
  Activity, 
  Sliders, 
  RefreshCw,
  FolderPlus,
  Compass,
  ArrowRight,
  Database
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { usePlaygroundStore } from '../../store/usePlaygroundStore';
import { apiClient, SavedArchitecture } from '../../api/client';
import { CreateProjectModal } from '../modals/CreateProjectModal';

export const DashboardView: React.FC = () => {
  const { user, isGuest, logout } = useAuthStore();
  const { 
    theme, 
    toggleTheme, 
    openProject, 
    setAppView,
    toggleLibraryModal,
    toggleBenchmarkModal
  } = usePlaygroundStore();

  const [projects, setProjects] = useState<SavedArchitecture[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'updated' | 'name' | 'cost'>('updated');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTemplateForCreate, setSelectedTemplateForCreate] = useState<string>('blank');

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const list = await apiClient.listArchitectures();
      setProjects(list);
    } catch (err) {
      console.error('Failed to load projects in dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleOpenProject = (arch: SavedArchitecture) => {
    openProject(arch);
  };

  const handleForkProject = async (arch: SavedArchitecture, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveMenuId(null);
    try {
      const forked = await apiClient.forkArchitecture(arch.id, `${arch.name} (Copy)`);
      setProjects([forked, ...projects]);
    } catch (err) {
      console.error('Failed to fork project:', err);
    }
  };

  const handleDeleteProject = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveMenuId(null);
    if (!confirm('Are you sure you want to delete this project?')) return;
    try {
      await apiClient.deleteArchitecture(id);
      setProjects(projects.filter((p) => p.id !== id));
    } catch (err) {
      console.error('Failed to delete project:', err);
    }
  };

  const handleCreateFromTemplate = (templateId: string) => {
    setSelectedTemplateForCreate(templateId);
    setIsCreateModalOpen(true);
  };

  // Filter & Sort Projects
  const filteredProjects = useMemo(() => {
    return projects
      .filter((p) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => {
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        if (sortBy === 'cost') return (b.monthlyCost || 0) - (a.monthlyCost || 0);
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
  }, [projects, searchQuery, sortBy]);

  // Aggregate stats
  const totalSpend = useMemo(() => {
    return projects.reduce((acc, p) => acc + (p.monthlyCost || 0), 0);
  }, [projects]);

  const totalNodesCount = useMemo(() => {
    return projects.reduce((acc, p) => acc + (p.nodes?.length || 0), 0);
  }, [projects]);

  return (
    <div className="flex h-screen w-screen bg-[var(--bg-app)] text-[var(--text-main)] overflow-hidden select-none font-sans">
      {/* Left Navigation Rail (n8n style) */}
      <aside className="w-64 border-r border-[var(--border-subtle)] bg-[var(--bg-surface)] flex flex-col justify-between shrink-0 transition-colors z-20">
        <div>
          {/* Workspace Switcher Header */}
          <div className="p-4 border-b border-[var(--border-subtle)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-md shadow-cyan-500/20 shrink-0">
                <Network className="w-5 h-5 text-white" />
              </div>
              <div className="overflow-hidden">
                <div className="text-xs font-bold text-[var(--text-main)] truncate">
                  {user?.name ? `${user.name}'s Workspace` : 'Architecture Workspace'}
                </div>
                <div className="text-[10px] text-[var(--text-muted)] flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                  <span>{isGuest ? 'Guest Edition' : 'Pro Architect'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            <button
              type="button"
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-sm"
            >
              <Layers className="w-4 h-4" />
              <span>Projects & Architectures</span>
            </button>

            <button
              type="button"
              onClick={() => handleCreateFromTemplate('flash-sale-ecommerce')}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-panel)] transition-colors"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Starter Templates</span>
            </button>

            <button
              type="button"
              onClick={toggleLibraryModal}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-panel)] transition-colors"
            >
              <Activity className="w-4 h-4 text-indigo-400" />
              <span>ClickHouse Telemetry</span>
            </button>

            <button
              type="button"
              onClick={toggleBenchmarkModal}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-panel)] transition-colors"
            >
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span>WASM Benchmarks</span>
            </button>
          </nav>
        </div>

        {/* User Account & Bottom Actions */}
        <div className="p-3 border-t border-[var(--border-subtle)] space-y-2">
          {/* Theme Switcher Button */}
          <button
            type="button"
            onClick={toggleTheme}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-panel)] transition-colors border border-[var(--border-subtle)]/50"
          >
            <div className="flex items-center gap-2">
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-indigo-400" />}
              <span>Theme</span>
            </div>
            <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">{theme}</span>
          </button>

          {/* User Profile Pill */}
          <div className="p-2.5 rounded-xl bg-[var(--bg-panel)] border border-[var(--border-subtle)] flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-500/20 to-indigo-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center text-xs font-bold shrink-0">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
              </div>
              <div className="overflow-hidden">
                <div className="text-xs font-medium text-[var(--text-main)] truncate">
                  {user?.name || 'Architect'}
                </div>
                <div className="text-[10px] text-[var(--text-muted)] truncate">
                  {user?.email || 'local@playground'}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                logout();
                setAppView('auth');
              }}
              title="Sign Out"
              className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-rose-400 hover:bg-[var(--bg-pill)] transition-colors shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden bg-[var(--bg-app)]">
        {/* Top Header Bar */}
        <header className="h-16 border-b border-[var(--border-subtle)] px-8 flex items-center justify-between bg-[var(--bg-surface)] shrink-0">
          <div>
            <h1 className="text-base font-bold text-[var(--text-main)] tracking-tight">System Architecture Projects</h1>
            <p className="text-[11px] text-[var(--text-muted)]">Design, simulate, and stress-test distributed topologies</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--text-muted)]">
                <Search className="w-3.5 h-3.5" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search architectures..."
                className="w-full pl-8 pr-3 py-1.5 bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-xl text-xs text-[var(--text-main)] placeholder-[var(--text-muted)]/60 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 transition-all"
              />
            </div>

            {/* Sort Selector */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-1.5 bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-xl text-xs font-medium text-[var(--text-muted)] focus:outline-none focus:text-[var(--text-main)] transition-colors cursor-pointer"
            >
              <option value="updated">Recently Updated</option>
              <option value="name">Alphabetical (A-Z)</option>
              <option value="cost">Monthly Cost</option>
            </select>

            {/* Create Project Button */}
            <button
              type="button"
              onClick={() => {
                setSelectedTemplateForCreate('blank');
                setIsCreateModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-cyan-500/20 flex items-center gap-2 transition-all active:scale-[0.99]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Project</span>
            </button>
          </div>
        </header>

        {/* Scrollable Dashboard Body */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          {/* Quick Metrics Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-sm">
              <div className="flex items-center justify-between text-[var(--text-muted)] mb-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Total Projects</span>
                <Layers className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-xl font-bold text-[var(--text-main)]">{projects.length}</div>
              <div className="text-[10px] text-[var(--text-muted)] mt-1">Saved in PostgreSQL layer</div>
            </div>

            <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-sm">
              <div className="flex items-center justify-between text-[var(--text-muted)] mb-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Est. Monthly Spend</span>
                <DollarSign className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-xl font-bold text-[var(--text-main)]">${totalSpend.toLocaleString()}/mo</div>
              <div className="text-[10px] text-[var(--text-muted)] mt-1">Across all infrastructure nodes</div>
            </div>

            <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-sm">
              <div className="flex items-center justify-between text-[var(--text-muted)] mb-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Simulated Nodes</span>
                <Server className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="text-xl font-bold text-[var(--text-main)]">{totalNodesCount} Nodes</div>
              <div className="text-[10px] text-[var(--text-muted)] mt-1">Gateways, LB, DB, Caches & Queues</div>
            </div>

            <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-sm">
              <div className="flex items-center justify-between text-[var(--text-muted)] mb-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Engine Status</span>
                <Activity className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-sm font-bold text-emerald-400 flex items-center gap-1.5 mt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>WASM + ClickHouse Ready</span>
              </div>
              <div className="text-[10px] text-[var(--text-muted)] mt-1">Discrete Event Solver @ 60Hz</div>
            </div>
          </div>

          {/* Starter Templates Shelf */}
          <div>
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-main)]">
                  Starter Architecture Templates
                </h2>
              </div>
              <span className="text-[11px] text-[var(--text-muted)]">Jump-start high-availability designs</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div 
                onClick={() => handleCreateFromTemplate('blank')}
                className="p-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:border-cyan-500/50 hover:bg-[var(--bg-panel)] transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                    <Plus className="w-5 h-5" />
                  </div>
                  <h3 className="text-xs font-bold text-[var(--text-main)] mb-1">Blank Architecture</h3>
                  <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                    Start clean on an infinite canvas. Add your own load balancers, caches, and databases.
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between pt-3 border-t border-[var(--border-subtle)]/50">
                  <span className="text-[10px] text-[var(--text-muted)] font-medium">Empty Canvas</span>
                  <span className="text-xs text-cyan-400 font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    Use <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>

              <div 
                onClick={() => handleCreateFromTemplate('classic-web-app')}
                className="p-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:border-emerald-500/50 hover:bg-[var(--bg-panel)] transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                    <Server className="w-5 h-5" />
                  </div>
                  <h3 className="text-xs font-bold text-[var(--text-main)] mb-1">Multi-AZ Web Application</h3>
                  <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                    High availability 3-tier system with ALB across 2 zones, web nodes, Redis, and Postgres.
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between pt-3 border-t border-[var(--border-subtle)]/50">
                  <span className="text-[10px] text-[var(--text-muted)] font-medium">4 Nodes · $1.4k/mo</span>
                  <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    Use <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>

              <div 
                onClick={() => handleCreateFromTemplate('flash-sale-ecommerce')}
                className="p-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:border-amber-500/50 hover:bg-[var(--bg-panel)] transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                    <Compass className="w-5 h-5" />
                  </div>
                  <h3 className="text-xs font-bold text-[var(--text-main)] mb-1">Flash Sale E-Commerce</h3>
                  <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                    Surge traffic absorption with Edge CDN, API Gateway, Kafka queue buffer & read replicas.
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between pt-3 border-t border-[var(--border-subtle)]/50">
                  <span className="text-[10px] text-[var(--text-muted)] font-medium">8 Nodes · $3.2k/mo</span>
                  <span className="text-xs text-amber-400 font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    Use <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>

              <div 
                onClick={() => handleCreateFromTemplate('microservices-mesh')}
                className="p-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:border-indigo-500/50 hover:bg-[var(--bg-panel)] transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                    <Database className="w-5 h-5" />
                  </div>
                  <h3 className="text-xs font-bold text-[var(--text-main)] mb-1">CQRS & Event Sourcing</h3>
                  <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                    Asynchronous write commands decoupled from materialized view read queries.
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between pt-3 border-t border-[var(--border-subtle)]/50">
                  <span className="text-[10px] text-[var(--text-muted)] font-medium">6 Nodes · $2.1k/mo</span>
                  <span className="text-xs text-indigo-400 font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    Use <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* User Projects Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[var(--text-muted)]" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-main)]">
                  All Architectures ({filteredProjects.length})
                </h2>
              </div>
              <button
                type="button"
                onClick={fetchProjects}
                className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>

            {loading ? (
              <div className="p-12 text-center text-xs text-[var(--text-muted)] flex flex-col items-center justify-center gap-3">
                <RefreshCw className="w-5 h-5 animate-spin text-cyan-400" />
                <span>Loading your architecture projects...</span>
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="p-12 rounded-2xl border border-dashed border-[var(--border-subtle)] bg-[var(--bg-surface)] text-center flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-2xl bg-[var(--bg-panel)] flex items-center justify-center text-[var(--text-muted)] mb-3">
                  <FolderPlus className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-[var(--text-main)] mb-1">
                  {searchQuery ? 'No matching architectures found' : 'No projects created yet'}
                </h3>
                <p className="text-xs text-[var(--text-muted)] max-w-sm mb-5">
                  {searchQuery 
                    ? `Try a different search query than "${searchQuery}"`
                    : 'Create your first distributed system project or select one of the starter templates above.'}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTemplateForCreate('blank');
                    setIsCreateModalOpen(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold flex items-center gap-2 shadow-md shadow-cyan-500/20 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create New Project</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProjects.map((arch) => {
                  const nodeCount = arch.nodes?.length || 0;
                  const grade = arch.grade || 'A';
                  const cost = arch.monthlyCost || 0;

                  return (
                    <div
                      key={arch.id}
                      onClick={() => handleOpenProject(arch)}
                      className="p-5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:border-cyan-500/50 hover:bg-[var(--bg-panel)] transition-all cursor-pointer group flex flex-col justify-between relative shadow-sm"
                    >
                      <div>
                        {/* Card Header */}
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center font-bold text-xs shrink-0">
                              <Network className="w-4 h-4" />
                            </div>
                            <div>
                              <h3 className="text-xs font-bold text-[var(--text-main)] group-hover:text-cyan-400 transition-colors line-clamp-1">
                                {arch.name}
                              </h3>
                              <span className="text-[10px] text-[var(--text-muted)]">
                                v{arch.version || 1}.0 {arch.forkOfId ? '· (Forked)' : ''}
                              </span>
                            </div>
                          </div>

                          {/* Context Menu Button */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuId(activeMenuId === arch.id ? null : arch.id);
                              }}
                              className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-pill)] transition-colors"
                            >
                              <MoreVertical className="w-3.5 h-3.5" />
                            </button>

                            {/* Dropdown Menu */}
                            {activeMenuId === arch.id && (
                              <div className="absolute right-0 top-6 w-36 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-xl py-1 z-30 animate-fadeIn">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenProject(arch);
                                  }}
                                  className="w-full px-3 py-1.5 text-left text-[11px] text-[var(--text-main)] hover:bg-[var(--bg-panel)] flex items-center gap-2"
                                >
                                  <ExternalLink className="w-3 h-3 text-cyan-400" />
                                  <span>Open Canvas</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => handleForkProject(arch, e)}
                                  className="w-full px-3 py-1.5 text-left text-[11px] text-[var(--text-main)] hover:bg-[var(--bg-panel)] flex items-center gap-2"
                                >
                                  <GitFork className="w-3 h-3 text-emerald-400" />
                                  <span>Duplicate / Fork</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => handleDeleteProject(arch.id, e)}
                                  className="w-full px-3 py-1.5 text-left text-[11px] text-rose-400 hover:bg-rose-500/10 flex items-center gap-2"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  <span>Delete Project</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Description */}
                        <p className="text-[11px] text-[var(--text-muted)] line-clamp-2 leading-relaxed mb-4">
                          {arch.description || 'Interactive system architecture simulation topology.'}
                        </p>
                      </div>

                      {/* Card Footer Badges */}
                      <div className="pt-3 border-t border-[var(--border-subtle)]/60 flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md bg-[var(--bg-panel)] border border-[var(--border-subtle)] text-[10px] text-[var(--text-muted)] font-medium">
                            {nodeCount} nodes
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-400 font-semibold">
                            Grade {grade}
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="text-[11px] font-bold text-[var(--text-main)]">
                            ${cost.toLocaleString()}/mo
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          fetchProjects();
        }}
        defaultTemplateId={selectedTemplateForCreate}
      />
    </div>
  );
};
