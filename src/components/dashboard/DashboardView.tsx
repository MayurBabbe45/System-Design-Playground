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
  Sun, 
  Moon, 
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
    theme, 
    toggleTheme, 
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
    <div className="flex flex-col h-screen w-screen bg-[var(--bg-app)] text-[var(--text-main)] overflow-hidden font-sans select-none">
      {/* Top Professional SaaS Header (Horizontal Layout - No Left Panel) */}
      <header className="h-14 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 sm:px-6 flex items-center justify-between shrink-0 z-30 shadow-xs">
        {/* Left: Brand Identity, Workspace Switcher, and Breadcrumbs */}
        <div className="flex items-center gap-3 sm:gap-4 overflow-hidden">
          {/* Logo & Brand */}
          <div className="flex items-center gap-2.5 shrink-0">
            <StudioBrandLogo size={32} className="shrink-0 drop-shadow-sm" />
            <div className="hidden md:block">
              <div className="text-xs font-bold tracking-tight text-[var(--text-main)]">
                System Design Playground
              </div>
              <div className="text-[9px] uppercase tracking-wider font-semibold text-blue-500">
                Architecture Studio
              </div>
            </div>
          </div>

          <span className="text-[var(--border-subtle)] font-bold text-xs hidden sm:inline">/</span>

          {/* Workspace Pill */}
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[var(--bg-panel)] border border-[var(--border-subtle)] text-xs shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block shrink-0" />
            <span className="font-semibold text-[var(--text-main)] max-w-[130px] sm:max-w-[180px] truncate">
              {user?.name ? `${user.name}'s Workspace` : "Architect's Workspace"}
            </span>
            <span className="text-[10px] text-[var(--text-muted)] font-mono px-1.5 py-0.2 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)] hidden sm:inline">
              {isGuest ? 'Guest' : 'Pro'}
            </span>
          </div>

          {/* Horizontal Navigation Tabs */}
          <nav className="hidden lg:flex items-center gap-1 ml-2">
            <button
              type="button"
              onClick={() => setSelectedTab('all')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedTab === 'all'
                  ? 'bg-[var(--bg-pill)] text-blue-600 dark:text-blue-400 border border-[var(--border-subtle)] shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Architectures</span>
              <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-muted)] font-mono">
                {projects.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedTab('templates')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedTab === 'templates'
                  ? 'bg-[var(--bg-pill)] text-blue-600 dark:text-blue-400 border border-[var(--border-subtle)] shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-500" />
              <span>Templates</span>
            </button>
          </nav>
        </div>

        {/* Right: Quick Tools, Theme Toggle, Profile, and New Architecture CTA */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Theme Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-panel)] hover:bg-[var(--bg-pill)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors cursor-pointer"
            title={`Toggle ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-blue-600" />}
          </button>

          {/* User Profile Pill & Logout */}
          <div className="flex items-center gap-2 pl-2 border-l border-[var(--border-subtle)]">
            <div
              className="w-7 h-7 rounded-lg bg-blue-600/15 text-blue-600 dark:text-blue-400 border border-blue-500/30 flex items-center justify-center text-xs font-bold shrink-0"
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
              className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-rose-500 hover:bg-[var(--bg-pill)] transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Primary '+ Create Architecture' Button */}
          <button
            type="button"
            onClick={() => {
              setSelectedTemplateForCreate('blank');
              setIsCreateModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm shadow-blue-600/20 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Architecture</span>
          </button>
        </div>
      </header>

      {/* Main Horizontal Content Area */}
      <main className="flex-1 flex flex-col overflow-y-auto bg-[var(--bg-app)]">
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-8 py-6 space-y-6">
          {/* Horizontal Metric Summary Strip (Replacing 4 bulky vertical cards) */}
          <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-xs">
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-[var(--text-muted)] font-medium">Architectures:</span>
                <span className="font-bold text-[var(--text-main)] font-mono">{projects.length}</span>
              </div>
              <div className="h-3 w-px bg-[var(--border-subtle)] hidden sm:block" />
              <div className="flex items-center gap-2">
                <span className="text-[var(--text-muted)] font-medium">Est. Monthly Spend:</span>
                <span className="font-bold text-emerald-500 dark:text-emerald-400 font-mono">
                  ${totalSpend.toLocaleString()}/mo
                </span>
              </div>
              <div className="h-3 w-px bg-[var(--border-subtle)] hidden sm:block" />
              <div className="flex items-center gap-2">
                <span className="text-[var(--text-muted)] font-medium">Simulated Nodes:</span>
                <span className="font-bold text-blue-500 dark:text-blue-400 font-mono">
                  {totalNodesCount} nodes
                </span>
              </div>
              <div className="h-3 w-px bg-[var(--border-subtle)] hidden md:block" />
              <div className="hidden md:flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
                <span className="text-[var(--text-muted)] font-medium">Engine:</span>
                <span className="font-semibold text-[var(--text-main)]">Discrete Event @ 60Hz</span>
              </div>
            </div>

            <div className="text-[11px] text-[var(--text-muted)] font-medium">
              Real-time collaboration active
            </div>
          </div>

          {/* Quick-Start Template Shelf (Compact Horizontal Carousel / Pills) */}
          <div className="px-4 py-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-main)]">
                <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                <span>Quick-Start Templates</span>
              </div>
              <span className="text-[11px] text-[var(--text-muted)]">Launch pre-configured distributed systems in one click</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {/* Blank Architecture */}
              <div
                onClick={() => handleCreateFromTemplate('blank')}
                className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--bg-panel)] hover:bg-[var(--bg-pill)] border border-[var(--border-subtle)] hover:border-blue-500/40 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <TemplateBlankSvg size={28} className="shrink-0 group-hover:scale-105 transition-transform" />
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-[var(--text-main)] truncate group-hover:text-blue-500 transition-colors">
                      Blank Canvas
                    </div>
                    <div className="text-[10px] text-[var(--text-muted)] truncate">Empty canvas</div>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all shrink-0" />
              </div>

              {/* Multi-AZ Web App */}
              <div
                onClick={() => handleCreateFromTemplate('classic-web-app')}
                className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--bg-panel)] hover:bg-[var(--bg-pill)] border border-[var(--border-subtle)] hover:border-blue-500/40 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <TemplateMultiAzSvg size={28} className="shrink-0 group-hover:scale-105 transition-transform" />
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-[var(--text-main)] truncate group-hover:text-blue-500 transition-colors">
                      Multi-AZ Web App
                    </div>
                    <div className="text-[10px] text-[var(--text-muted)] truncate">4 Nodes · $1.4k/mo</div>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all shrink-0" />
              </div>

              {/* Flash Sale E-Commerce */}
              <div
                onClick={() => handleCreateFromTemplate('flash-sale-ecommerce')}
                className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--bg-panel)] hover:bg-[var(--bg-pill)] border border-[var(--border-subtle)] hover:border-blue-500/40 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <TemplateFlashSaleSvg size={28} className="shrink-0 group-hover:scale-105 transition-transform" />
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-[var(--text-main)] truncate group-hover:text-blue-500 transition-colors">
                      Flash Sale Pipeline
                    </div>
                    <div className="text-[10px] text-[var(--text-muted)] truncate">8 Nodes · $3.2k/mo</div>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all shrink-0" />
              </div>

              {/* CQRS & Event Sourcing */}
              <div
                onClick={() => handleCreateFromTemplate('microservices-mesh')}
                className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--bg-panel)] hover:bg-[var(--bg-pill)] border border-[var(--border-subtle)] hover:border-blue-500/40 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <TemplateCqrsSvg size={28} className="shrink-0 group-hover:scale-105 transition-transform" />
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-[var(--text-main)] truncate group-hover:text-blue-500 transition-colors">
                      CQRS & Streaming
                    </div>
                    <div className="text-[10px] text-[var(--text-muted)] truncate">6 Nodes · $2.1k/mo</div>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all shrink-0" />
              </div>
            </div>
          </div>

          {/* Table / List Controls Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[260px] max-w-md">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search architectures by name or description..."
                className="w-full pl-9 pr-3 py-1.5 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg text-xs text-[var(--text-main)] placeholder-[var(--text-muted)]/60 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
              />
            </div>

            {/* Filter, Sort, and View Mode Switches */}
            <div className="flex items-center gap-2.5">
              {/* Sort Dropdown */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-1.5 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg text-xs font-medium text-[var(--text-muted)] focus:outline-none focus:text-[var(--text-main)] cursor-pointer"
              >
                <option value="updated">Recently Updated</option>
                <option value="name">Name (A-Z)</option>
                <option value="cost">Estimated Cost</option>
                <option value="grade">Resilience Grade</option>
              </select>

              {/* View Toggle (Table vs Grid) */}
              <div className="flex items-center bg-[var(--bg-surface)] p-0.5 rounded-lg border border-[var(--border-subtle)]">
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  title="Horizontal Table / List View"
                  className={`p-1.5 rounded-md transition-all cursor-pointer ${
                    viewMode === 'table'
                      ? 'bg-[var(--bg-panel)] text-blue-600 dark:text-blue-400 font-bold shadow-xs'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                  }`}
                >
                  <LayoutList className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  title="Grid View"
                  className={`p-1.5 rounded-md transition-all cursor-pointer ${
                    viewMode === 'grid'
                      ? 'bg-[var(--bg-panel)] text-blue-600 dark:text-blue-400 font-bold shadow-xs'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
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

          {/* n8n-Style Horizontal Table View (Primary Approach) */}
          {!loading && filteredProjects.length > 0 && viewMode === 'table' && (
            <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-panel)]/60 text-[10px] uppercase font-bold tracking-wider text-[var(--text-muted)]">
                      <th className="py-2.5 px-4">Architecture</th>
                      <th className="py-2.5 px-3">Resilience</th>
                      <th className="py-2.5 px-3">Topology</th>
                      <th className="py-2.5 px-3">Est. Spend</th>
                      <th className="py-2.5 px-3">Updated</th>
                      <th className="py-2.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-subtle)] text-xs">
                    {filteredProjects.map((arch) => {
                      const nodeCount = arch.nodes?.length || 0;
                      const grade = arch.grade || 'A';
                      const cost = arch.monthlyCost || 0;
                      const badge = getGradeBadge(grade);

                      return (
                        <tr
                          key={arch.id}
                          onClick={() => handleOpenProject(arch)}
                          className="hover:bg-[var(--bg-panel)]/70 transition-colors cursor-pointer group"
                        >
                          {/* 1. Name & Description */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="shrink-0 group-hover:scale-105 transition-transform">
                                <ArchitectureArchetypeIcon
                                  name={arch.name}
                                  isFork={Boolean(arch.forkOfId)}
                                  size={32}
                                />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-[var(--text-main)] group-hover:text-blue-500 transition-colors truncate">
                                    {arch.name}
                                  </span>
                                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-[var(--bg-panel)] border border-[var(--border-subtle)] text-[var(--text-muted)] font-mono">
                                    v{arch.version || 1}.0
                                  </span>
                                  {arch.forkOfId && (
                                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20 font-medium">
                                      Fork
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-[var(--text-muted)] truncate max-w-md mt-0.5">
                                  {arch.description || 'Interactive system architecture simulation topology.'}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* 2. Resilience Grade */}
                          <td className="py-3 px-3">
                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold border ${badge.bg}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                              <span>Grade {grade}</span>
                            </span>
                          </td>

                          {/* 3. Topology / Nodes */}
                          <td className="py-3 px-3">
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[var(--bg-panel)] border border-[var(--border-subtle)] text-[11px] font-mono text-[var(--text-muted)]">
                              <Server className="w-3 h-3 text-blue-500" />
                              <span>{nodeCount} nodes</span>
                            </span>
                          </td>

                          {/* 4. Est. Spend */}
                          <td className="py-3 px-3">
                            <span className="font-mono font-semibold text-[var(--text-main)]">
                              ${cost.toLocaleString()}
                              <span className="text-[10px] text-[var(--text-muted)] font-normal">/mo</span>
                            </span>
                          </td>

                          {/* 5. Last Updated */}
                          <td className="py-3 px-3 text-[11px] text-[var(--text-muted)]">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-[var(--text-muted)]" />
                              <span>{formatRelativeTime(arch.updatedAt)}</span>
                            </span>
                          </td>

                          {/* 6. Quick Actions */}
                          <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenProject(arch)}
                                className="px-2.5 py-1 rounded-md bg-blue-600/10 hover:bg-blue-600 text-blue-600 hover:text-white dark:text-blue-400 dark:hover:text-white text-xs font-semibold border border-blue-600/20 transition-all cursor-pointer"
                              >
                                Open Canvas
                              </button>
                              <button
                                type="button"
                                onClick={(e) => handleForkProject(arch, e)}
                                title="Duplicate architecture"
                                className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-panel)] border border-transparent hover:border-[var(--border-subtle)] transition-colors cursor-pointer"
                              >
                                <GitFork className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => handlePromptDelete(arch, e)}
                                title="Delete architecture"
                                className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-rose-500 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
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

          {/* Compact Grid View Alternative (when user toggles to Grid) */}
          {!loading && filteredProjects.length > 0 && viewMode === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredProjects.map((arch) => {
                const nodeCount = arch.nodes?.length || 0;
                const grade = arch.grade || 'A';
                const cost = arch.monthlyCost || 0;
                const badge = getGradeBadge(grade);

                return (
                  <div
                    key={arch.id}
                    onClick={() => handleOpenProject(arch)}
                    className="p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:border-blue-500/40 hover:bg-[var(--bg-panel)] transition-all cursor-pointer group flex flex-col justify-between shadow-xs hover:shadow-md"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2.5">
                          <div className="shrink-0 group-hover:scale-105 transition-transform">
                            <ArchitectureArchetypeIcon
                              name={arch.name}
                              isFork={Boolean(arch.forkOfId)}
                              size={28}
                            />
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-xs font-bold text-[var(--text-main)] group-hover:text-blue-500 transition-colors truncate">
                              {arch.name}
                            </h3>
                            <span className="text-[10px] text-[var(--text-muted)]">
                              v{arch.version || 1}.0 {arch.forkOfId ? '· (Forked)' : ''}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={(e) => handleForkProject(arch, e)}
                            title="Duplicate"
                            className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-main)] cursor-pointer"
                          >
                            <GitFork className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handlePromptDelete(arch, e)}
                            title="Delete"
                            className="p-1 rounded text-[var(--text-muted)] hover:text-rose-500 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      <p className="text-[11px] text-[var(--text-muted)] line-clamp-2 leading-relaxed mb-3">
                        {arch.description || 'Interactive system architecture simulation topology.'}
                      </p>
                    </div>

                    <div className="pt-2.5 border-t border-[var(--border-subtle)] flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-2">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${badge.bg}`}>
                          Grade {grade}
                        </span>
                        <span className="text-[10px] text-[var(--text-muted)] font-mono">
                          {nodeCount} nodes
                        </span>
                      </div>
                      <div className="font-mono text-[10.5px] font-semibold text-[var(--text-main)]">
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
