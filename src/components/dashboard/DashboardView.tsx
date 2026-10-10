import React, { useState, useEffect, useMemo } from 'react';
import { 
  Network, 
  Layers, 
  Plus, 
  Search, 
  DollarSign, 
  Clock, 
  MoreVertical, 
  GitFork, 
  Trash2, 
  ExternalLink, 
  Sparkles, 
  LogOut, 
  Server, 
  Activity, 
  Compass, 
  ArrowRight,
  Database,
  LayoutList,
  LayoutGrid,
  CheckCircle2,
  TrendingUp,
  Cpu
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { usePlaygroundStore } from '../../store/usePlaygroundStore';
import { apiClient, SavedArchitecture } from '../../api/client';
import { CreateProjectModal } from '../modals/CreateProjectModal';
import { ConfirmDeleteModal } from '../modals/ConfirmDeleteModal';
import { 
  StudioBrandLogo, 
  TemplateBlankSvg, 
  TemplateMultiAzSvg, 
  TemplateFlashSaleSvg, 
  TemplateCqrsSvg, 
  ArchitectureArchetypeIcon 
} from '../icons/DashboardLogos';

export const DashboardView: React.FC = () => {
  const { user, isGuest, logout } = useAuthStore();
  const { 
    openProject, 
    setAppView
  } = usePlaygroundStore();

  const [projects, setProjects] = useState<SavedArchitecture[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'updated' | 'name' | 'cost' | 'grade'>('updated');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [selectedTab, setSelectedTab] = useState<'all' | 'templates'>('all');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTemplateForCreate, setSelectedTemplateForCreate] = useState<string>('blank');

  const [projectToDelete, setProjectToDelete] = useState<SavedArchitecture | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handlePromptDelete = (arch: SavedArchitecture, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveMenuId(null);
    setProjectToDelete(arch);
  };

  const handleConfirmDelete = async () => {
    if (!projectToDelete) return;
    setIsDeleting(true);
    try {
      await apiClient.deleteArchitecture(projectToDelete.id);
      setProjects((prev) => prev.filter((p) => p.id !== projectToDelete.id));
      setProjectToDelete(null);
    } catch (err) {
      console.error('Failed to delete project:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCreateFromTemplate = (templateId: string) => {
    setSelectedTemplateForCreate(templateId);
    setIsCreateModalOpen(true);
  };

  // Filter and sort architectures
  const filteredProjects = useMemo(() => {
    let result = [...projects];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'cost') return (b.monthlyCost || 0) - (a.monthlyCost || 0);
      if (sortBy === 'grade') return (a.grade || 'Z').localeCompare(b.grade || 'Z');
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

    return result;
  }, [projects, searchQuery, sortBy]);

  const totalSpend = useMemo(() => {
    return projects.reduce((acc, p) => acc + (p.monthlyCost || 0), 0);
  }, [projects]);

  const totalNodesCount = useMemo(() => {
    return projects.reduce((acc, p) => acc + (p.nodes?.length || 0), 0);
  }, [projects]);

  const formatRelativeTime = (dateStr?: string) => {
    if (!dateStr) return 'Recently';
    const now = Date.now();
    const past = new Date(dateStr).getTime();
    if (isNaN(past)) return 'Recently';
    const diffSec = Math.floor((now - past) / 1000);
    if (diffSec < 60) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDays = Math.floor(diffHr / 24);
    if (diffDays < 30) return `${diffDays}d ago`;
    return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const getGradeBadge = (grade: string = 'A') => {
    switch (grade) {
      case 'A':
        return {
          bg: 'bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
          dot: 'bg-emerald-500',
        };
      case 'B':
        return {
          bg: 'bg-blue-500/10 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30',
          dot: 'bg-blue-500',
        };
      case 'C':
        return {
          bg: 'bg-amber-500/10 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
          dot: 'bg-amber-500',
        };
      default:
        return {
          bg: 'bg-rose-500/10 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
          dot: 'bg-rose-500',
        };
    }
  };

  return (
    <div className="relative flex flex-col h-screen w-screen bg-[var(--bg-app)] text-[var(--text-main)] overflow-hidden font-sans select-none">
      {/* Spatial Atmospheric Ambient Depth Lighting */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden z-0">
        <div className="absolute -top-32 left-1/4 w-[550px] h-[550px] bg-blue-600/12 dark:bg-blue-500/10 rounded-full blur-[128px] animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute top-1/3 -right-24 w-[480px] h-[480px] bg-purple-600/10 dark:bg-indigo-500/10 rounded-full blur-[128px] animate-pulse" style={{ animationDuration: '10s' }} />
        <div className="absolute -bottom-24 left-1/3 w-[520px] h-[520px] bg-emerald-600/8 dark:bg-emerald-500/8 rounded-full blur-[140px]" />
      </div>

      {/* Floating Spatial Header (visionOS Glass Island) */}
      <header className="h-16 spatial-glass px-4 sm:px-6 flex items-center justify-between shrink-0 z-30 relative shadow-lg">
        {/* Left: Brand Identity, Workspace Switcher, and Breadcrumbs */}
        <div className="flex items-center gap-3 sm:gap-4 overflow-hidden">
          {/* Logo & Brand */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="relative">
              <StudioBrandLogo size={36} className="shrink-0 drop-shadow-[0_2px_12px_rgba(59,130,246,0.35)]" />
              <span className="absolute -inset-1 rounded-xl bg-blue-500/15 blur-sm pointer-events-none" />
            </div>
            <div className="hidden md:block">
              <div className="text-sm font-bold tracking-tight text-[var(--text-main)]">
                System Design Playground
              </div>
              <div className="text-[10px] uppercase tracking-wider font-semibold text-blue-500">
                Architecture Studio
              </div>
            </div>
          </div>

          <span className="text-[var(--border-subtle)] font-bold text-xs hidden sm:inline">/</span>

          {/* Workspace Pill */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl spatial-glass-card text-xs shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block shrink-0 shadow-[0_0_8px_#10b981]" />
            <span className="font-semibold text-[var(--text-main)] max-w-[140px] sm:max-w-[200px] truncate">
              {user?.name ? `${user.name}'s Workspace` : "Architect's Workspace"}
            </span>
            <span className="text-[11px] text-[var(--text-muted)] font-mono px-1.5 py-0.5 rounded-md spatial-pill border border-white/10 hidden sm:inline">
              {isGuest ? 'Guest' : 'Pro'}
            </span>
          </div>

          {/* Horizontal Navigation Tabs */}
          <nav className="hidden lg:flex items-center gap-1.5 ml-2 p-1 rounded-xl spatial-glass-card">
            <button
              type="button"
              onClick={() => setSelectedTab('all')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedTab === 'all'
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-[0_2px_10px_rgba(59,130,246,0.25)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-white/5'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Architectures</span>
              <span className="ml-1 text-[11px] px-2 py-0.5 rounded-full bg-black/20 border border-white/10 text-[var(--text-muted)] font-mono">
                {projects.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedTab('templates')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedTab === 'templates'
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-[0_2px_10px_rgba(59,130,246,0.25)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-white/5'
              }`}
            >
              <Sparkles className="w-4 h-4 text-blue-500" />
              <span>Templates</span>
            </button>
          </nav>
        </div>

        {/* Right: Quick Tools, Theme Toggle, Profile, and New Architecture CTA */}
        <div className="flex items-center gap-2.5 sm:gap-3.5 shrink-0">

          {/* User Profile Pill & Logout */}
          <div className="flex items-center gap-2 pl-2.5 border-l border-white/10">
            <div
              className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/40 flex items-center justify-center text-xs font-bold shrink-0 shadow-[0_0_12px_rgba(59,130,246,0.25)]"
              title={user?.email || 'Architect'}
            >
              {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
            </div>
            <button
              type="button"
              onClick={() => {
                logout();
                setAppView('auth');
              }}
              title="Sign Out"
              className="p-2 rounded-xl text-[var(--text-muted)] hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          {/* Primary '+ Create Architecture' Button with Specular Glow */}
          <button
            type="button"
            onClick={() => {
              setSelectedTemplateForCreate('blank');
              setIsCreateModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-[0_8px_20px_-4px_rgba(59,130,246,0.5),inset_0_1px_0_rgba(255,255,255,0.25)] active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Architecture</span>
          </button>
        </div>
      </header>

      {/* Main Horizontal Content Area */}
      <main className="flex-1 flex flex-col overflow-y-auto bg-transparent relative z-10">
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-8 py-6 space-y-6">
          {/* Spatial Metric Summary Strip */}
          <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 rounded-2xl spatial-glass">
            <div className="flex flex-wrap items-center gap-5 sm:gap-7 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-[var(--text-muted)] font-medium">Architectures:</span>
                <span className="text-sm font-bold text-[var(--text-main)] font-mono">{projects.length}</span>
              </div>
              <div className="h-4 w-px bg-white/10 hidden sm:block" />
              <div className="flex items-center gap-2">
                <span className="text-[var(--text-muted)] font-medium">Est. Monthly Spend:</span>
                <span className="text-sm font-bold text-emerald-400 font-mono drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]">
                  ${totalSpend.toLocaleString()}/mo
                </span>
              </div>
              <div className="h-4 w-px bg-white/10 hidden sm:block" />
              <div className="flex items-center gap-2">
                <span className="text-[var(--text-muted)] font-medium">Simulated Nodes:</span>
                <span className="text-sm font-bold text-blue-400 font-mono drop-shadow-[0_0_8px_rgba(96,165,250,0.3)]">
                  {totalNodesCount} nodes
                </span>
              </div>
              <div className="h-4 w-px bg-white/10 hidden md:block" />
              <div className="hidden md:flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse shadow-[0_0_8px_#10b981]" />
                <span className="text-[var(--text-muted)] font-medium">Engine:</span>
                <span className="text-xs font-semibold text-[var(--text-main)]">Discrete Event @ 60Hz</span>
              </div>
            </div>

            <div className="text-xs text-[var(--text-muted)] font-medium flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />
              <span>Real-time collaboration active</span>
            </div>
          </div>

          {/* Quick-Start Template Shelf with Dimensional Glass Cards */}
          <div className="px-6 py-4 rounded-2xl spatial-glass space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold text-[var(--text-main)]">
                <Sparkles className="w-4 h-4 text-blue-400 drop-shadow-[0_0_6px_rgba(96,165,250,0.5)]" />
                <span>Quick-Start Templates</span>
              </div>
              <span className="text-xs text-[var(--text-muted)]">Launch pre-configured distributed systems in one click</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {/* Blank Architecture */}
              <div
                onClick={() => handleCreateFromTemplate('blank')}
                className="flex items-center justify-between p-3.5 rounded-xl spatial-glass-card cursor-pointer group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <TemplateBlankSvg size={36} className="shrink-0 group-hover:scale-105 transition-transform drop-shadow-[0_2px_8px_rgba(59,130,246,0.3)]" />
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-[var(--text-main)] truncate group-hover:text-blue-400 transition-colors">
                      Blank Canvas
                    </div>
                    <div className="text-xs text-[var(--text-muted)] truncate">Start from scratch</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[var(--text-muted)] group-hover:text-blue-400 group-hover:translate-x-1 transition-all shrink-0" />
              </div>

              {/* Multi-AZ Web App */}
              <div
                onClick={() => handleCreateFromTemplate('classic-web-app')}
                className="flex items-center justify-between p-3.5 rounded-xl spatial-glass-card cursor-pointer group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <TemplateMultiAzSvg size={36} className="shrink-0 group-hover:scale-105 transition-transform drop-shadow-[0_2px_8px_rgba(16,185,129,0.3)]" />
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-[var(--text-main)] truncate group-hover:text-blue-400 transition-colors">
                      Multi-AZ Web App
                    </div>
                    <div className="text-xs text-[var(--text-muted)] truncate">4 Nodes · $1.4k/mo</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[var(--text-muted)] group-hover:text-blue-400 group-hover:translate-x-1 transition-all shrink-0" />
              </div>

              {/* Flash Sale E-Commerce */}
              <div
                onClick={() => handleCreateFromTemplate('flash-sale-ecommerce')}
                className="flex items-center justify-between p-3.5 rounded-xl spatial-glass-card cursor-pointer group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <TemplateFlashSaleSvg size={36} className="shrink-0 group-hover:scale-105 transition-transform drop-shadow-[0_2px_8px_rgba(245,158,11,0.3)]" />
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-[var(--text-main)] truncate group-hover:text-blue-400 transition-colors">
                      Flash Sale Pipeline
                    </div>
                    <div className="text-xs text-[var(--text-muted)] truncate">8 Nodes · $3.2k/mo</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[var(--text-muted)] group-hover:text-blue-400 group-hover:translate-x-1 transition-all shrink-0" />
              </div>

              {/* CQRS & Event Sourcing */}
              <div
                onClick={() => handleCreateFromTemplate('microservices-mesh')}
                className="flex items-center justify-between p-3.5 rounded-xl spatial-glass-card cursor-pointer group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <TemplateCqrsSvg size={36} className="shrink-0 group-hover:scale-105 transition-transform drop-shadow-[0_2px_8px_rgba(168,85,247,0.3)]" />
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-[var(--text-main)] truncate group-hover:text-blue-400 transition-colors">
                      CQRS & Streaming
                    </div>
                    <div className="text-xs text-[var(--text-muted)] truncate">6 Nodes · $2.1k/mo</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[var(--text-muted)] group-hover:text-blue-400 group-hover:translate-x-1 transition-all shrink-0" />
              </div>
            </div>
          </div>

          {/* Table / List Controls Toolbar with Spatial Inputs */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[280px] max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search architectures by name or description..."
                className="w-full pl-9 pr-3 py-2 spatial-glass-card rounded-xl text-xs text-[var(--text-main)] placeholder-[var(--text-muted)]/60 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 transition-all shadow-inner"
              />
            </div>

            {/* Filter, Sort, and View Mode Switches */}
            <div className="flex items-center gap-2.5">
              {/* Sort Dropdown */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3.5 py-2 spatial-glass-card rounded-xl text-xs font-medium text-[var(--text-muted)] focus:outline-none focus:text-[var(--text-main)] cursor-pointer"
              >
                <option value="updated">Recently Updated</option>
                <option value="name">Name (A-Z)</option>
                <option value="cost">Estimated Cost</option>
                <option value="grade">Resilience Grade</option>
              </select>

              {/* View Toggle (Table vs Grid) */}
              <div className="flex items-center spatial-glass-card p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  title="Horizontal Table / List View"
                  className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                    viewMode === 'table'
                      ? 'bg-blue-600/20 text-blue-400 font-bold border border-blue-500/30 shadow-xs'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                  }`}
                >
                  <LayoutList className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  title="Grid View"
                  className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                    viewMode === 'grid'
                      ? 'bg-blue-600/20 text-blue-400 font-bold border border-blue-500/30 shadow-xs'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Loading Indicator */}
          {loading && (
            <div className="p-12 text-center text-xs text-[var(--text-muted)]">
              Loading architectures...
            </div>
          )}

          {/* Empty State */}
          {!loading && filteredProjects.length === 0 && (
            <div className="p-12 rounded-xl border border-dashed border-[var(--border-subtle)] bg-[var(--bg-surface)] text-center flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-xl bg-[var(--bg-panel)] flex items-center justify-center text-[var(--text-muted)] mb-3">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-[var(--text-main)] mb-1">No architectures found</h3>
              <p className="text-xs text-[var(--text-muted)] max-w-sm mb-4">
                {searchQuery ? 'Try adjusting your search query.' : 'Create your first system design architecture to begin simulating.'}
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedTemplateForCreate('blank');
                  setIsCreateModalOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
              >
                Create New Architecture
              </button>
            </div>
          )}

          {/* Spatial UI Horizontal Table View */}
          {!loading && filteredProjects.length > 0 && viewMode === 'table' && (
            <div className="rounded-2xl spatial-glass overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 dark:border-white/8 bg-black/20 dark:bg-black/35 text-xs uppercase font-bold tracking-wider text-[var(--text-muted)] backdrop-blur-md">
                      <th className="py-4 px-6">Architecture</th>
                      <th className="py-4 px-4">Resilience</th>
                      <th className="py-4 px-4">Topology</th>
                      <th className="py-4 px-4">Est. Spend</th>
                      <th className="py-4 px-4">Updated</th>
                      <th className="py-4 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-xs">
                    {filteredProjects.map((arch) => {
                      const nodeCount = arch.nodes?.length || 0;
                      const grade = arch.grade || 'A';
                      const cost = arch.monthlyCost || 0;
                      const badge = getGradeBadge(grade);

                      return (
                        <tr
                          key={arch.id}
                          onClick={() => handleOpenProject(arch)}
                          className="spatial-row cursor-pointer group"
                        >
                          {/* 1. Name & Description */}
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3.5">
                              <div className="shrink-0 group-hover:scale-105 transition-transform p-1.5 rounded-xl spatial-glass-card shadow-sm">
                                <ArchitectureArchetypeIcon
                                  name={arch.name}
                                  isFork={Boolean(arch.forkOfId)}
                                  size={38}
                                />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-bold text-[var(--text-main)] group-hover:text-blue-400 transition-colors truncate">
                                    {arch.name}
                                  </span>
                                  <span className="text-xs px-2 py-0.5 rounded-md spatial-pill border border-white/10 text-[var(--text-muted)] font-mono">
                                    v{arch.version || 1}.0
                                  </span>
                                  {arch.forkOfId && (
                                    <span className="text-xs px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-400 border border-amber-500/30 font-medium">
                                      Fork
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-[var(--text-muted)] truncate max-w-lg mt-0.5">
                                  {arch.description || 'Interactive system architecture simulation topology.'}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* 2. Resilience Grade */}
                          <td className="py-4 px-4">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border spatial-pill shadow-xs ${badge.bg}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${badge.dot} shadow-[0_0_6px_currentColor]`} />
                              <span>Grade {grade}</span>
                            </span>
                          </td>

                          {/* 3. Topology / Nodes */}
                          <td className="py-4 px-4">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg spatial-glass-card text-xs font-mono text-[var(--text-muted)]">
                              <Server className="w-3.5 h-3.5 text-blue-400" />
                              <span>{nodeCount} nodes</span>
                            </span>
                          </td>

                          {/* 4. Est. Spend */}
                          <td className="py-4 px-4">
                            <span className="font-mono font-bold text-sm text-[var(--text-main)]">
                              ${cost.toLocaleString()}
                              <span className="text-xs text-[var(--text-muted)] font-normal">/mo</span>
                            </span>
                          </td>

                          {/* 5. Last Updated */}
                          <td className="py-4 px-4 text-xs text-[var(--text-muted)]">
                            <span className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                              <span>{formatRelativeTime(arch.updatedAt)}</span>
                            </span>
                          </td>

                          {/* 6. Quick Actions */}
                          <td className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => handleOpenProject(arch)}
                                className="px-3.5 py-1.5 rounded-xl bg-blue-500/15 hover:bg-blue-600 text-blue-400 hover:text-white text-xs font-semibold border border-blue-500/30 hover:border-blue-500 shadow-sm transition-all cursor-pointer"
                              >
                                Open Canvas
                              </button>
                              <button
                                type="button"
                                onClick={(e) => handleForkProject(arch, e)}
                                title="Duplicate architecture"
                                className="p-2 rounded-xl spatial-glass-card text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors cursor-pointer"
                              >
                                <GitFork className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => handlePromptDelete(arch, e)}
                                title="Delete architecture"
                                className="p-2 rounded-xl spatial-glass-card text-[var(--text-muted)] hover:text-rose-500 hover:bg-rose-500/15 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Compact Grid View Alternative with Spatial Glass */}
          {!loading && filteredProjects.length > 0 && viewMode === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProjects.map((arch) => {
                const nodeCount = arch.nodes?.length || 0;
                const grade = arch.grade || 'A';
                const cost = arch.monthlyCost || 0;
                const badge = getGradeBadge(grade);

                return (
                  <div
                    key={arch.id}
                    onClick={() => handleOpenProject(arch)}
                    className="p-5 rounded-2xl spatial-glass-card cursor-pointer group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-3">
                          <div className="shrink-0 group-hover:scale-105 transition-transform p-1.5 rounded-xl spatial-glass-card shadow-sm">
                            <ArchitectureArchetypeIcon
                              name={arch.name}
                              isFork={Boolean(arch.forkOfId)}
                              size={36}
                            />
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-sm font-bold text-[var(--text-main)] group-hover:text-blue-400 transition-colors truncate">
                              {arch.name}
                            </h3>
                            <span className="text-xs text-[var(--text-muted)]">
                              v{arch.version || 1}.0 {arch.forkOfId ? '· (Forked)' : ''}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={(e) => handleForkProject(arch, e)}
                            title="Duplicate"
                            className="p-1.5 rounded-xl spatial-glass-card text-[var(--text-muted)] hover:text-[var(--text-main)] cursor-pointer"
                          >
                            <GitFork className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handlePromptDelete(arch, e)}
                            title="Delete"
                            className="p-1.5 rounded-xl spatial-glass-card text-[var(--text-muted)] hover:text-rose-500 hover:bg-rose-500/15 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <p className="text-xs text-[var(--text-muted)] line-clamp-2 leading-relaxed mb-3">
                        {arch.description || 'Interactive system architecture simulation topology.'}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border spatial-pill ${badge.bg}`}>
                          Grade {grade}
                        </span>
                        <span className="text-xs text-[var(--text-muted)] font-mono">
                          {nodeCount} nodes
                        </span>
                      </div>
                      <div className="font-mono text-xs font-bold text-[var(--text-main)]">
                        ${cost.toLocaleString()}/mo
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Project Creation Modal */}
      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          fetchProjects();
        }}
        defaultTemplateId={selectedTemplateForCreate}
      />

      {/* Custom Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={Boolean(projectToDelete)}
        itemName={projectToDelete?.name}
        isDeleting={isDeleting}
        onConfirm={handleConfirmDelete}
        onClose={() => {
          if (!isDeleting) setProjectToDelete(null);
        }}
      />
    </div>
  );
};
