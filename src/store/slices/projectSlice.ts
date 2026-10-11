import type { StateCreator } from 'zustand';
import type { Node, Edge } from '@xyflow/react';
import LZString from 'lz-string';
import type { InfrastructureNodeData, EdgeStreamData } from '../../types/playground.ts';
import { PRESET_ARCHITECTURES } from '../../config/presets.ts';
import { collabManager } from '../../collab/collabManager.ts';
import { apiClient } from '../../api/client.ts';
import type { SavedArchitecture } from '../../api/client.ts';
import { auditArchitecture } from '../../simulation/architectureLinter.ts';
import { clearCascadeTimers } from './simulationSlice.ts';
import type { PlaygroundStoreState, ProjectSlice } from '../types.ts';

export const getInitialAppView = (): 'auth' | 'dashboard' | 'playground' => {
  if (typeof window === 'undefined') return 'auth';
  const token = localStorage.getItem('sdp_auth_token');
  const isGuest = localStorage.getItem('sdp_is_guest') === 'true';
  if (!token && !isGuest) {
    return 'auth';
  }
  const params = new URLSearchParams(window.location.search);
  const viewParam = params.get('view');
  if (viewParam === 'playground') return 'playground';
  return 'dashboard';
};

export const createProjectSlice: StateCreator<
  PlaygroundStoreState,
  [],
  [],
  ProjectSlice
> = (set, get) => ({
  appView: getInitialAppView(),
  activeProject: null,
  isViewOnly: false,
  activeCloudArchitectureId: null,
  isLibraryModalOpen: false,

  setIsViewOnly: (viewOnly: boolean) => set({ isViewOnly: viewOnly }),

  toggleLibraryModal: () => {
    set({ isLibraryModalOpen: !get().isLibraryModalOpen });
  },

  loadSavedArchitecture: (arch) => {
    set({
      nodes: arch.nodes,
      edges: arch.edges,
      activePresetId: 'custom',
      activeCloudArchitectureId: arch.id,
      activeProject: {
        id: arch.id,
        name: arch.name,
        description: arch.description,
        isPublic: arch.isPublic,
      },
      selectedNodeId: null,
      bottleneckNodeId: null,
      bottleneckReason: null,
      killedAzs: [],
    });
    collabManager.syncLocalCanvas(arch.nodes, arch.edges);
  },

  setAppView: (view) => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('view', view);
      if (view !== 'playground') {
        url.searchParams.delete('project');
      }
      window.history.pushState({}, '', url.toString());
    }
    set({ appView: view });
  },

  openProject: (arch, viewOnly = false) => {
    clearCascadeTimers();
    set({
      nodes: arch.nodes,
      edges: arch.edges,
      activePresetId: 'custom',
      activeCloudArchitectureId: arch.id,
      activeProject: {
        id: arch.id,
        name: arch.name,
        description: arch.description,
        isPublic: arch.isPublic,
      },
      appView: 'playground',
      isViewOnly: viewOnly,
      isSimulating: false,
      isCascadeRunning: false,
      activeNodeIds: [],
      activeEdgeIds: [],
      selectedNodeId: null,
      bottleneckNodeId: null,
      bottleneckReason: null,
      killedAzs: [],
    });
    collabManager.syncLocalCanvas(arch.nodes, arch.edges);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('view', 'playground');
      url.searchParams.set('project', arch.id);
      if (viewOnly) {
        url.searchParams.set('mode', 'view');
      } else {
        url.searchParams.delete('mode');
      }
      window.history.pushState({}, '', url.toString());
    }
  },

  openProjectById: async (id: string, viewOnly = false) => {
    try {
      const arch = await apiClient.getArchitecture(id);
      if (!arch) return false;
      get().openProject(arch, viewOnly);
      return true;
    } catch (err) {
      console.error('Failed to open project by id:', err);
      return false;
    }
  },

  returnToDashboard: async () => {
    const activeProj = get().activeProject;
    if (activeProj && !get().isViewOnly) {
      try {
        const audit = auditArchitecture(get().nodes, get().edges);
        const monthlyCost = Math.round(get().nodes.reduce((acc, n) => acc + (n.data.costPerHour || 0) * 730, 0));
        await apiClient.updateArchitecture(activeProj.id, {
          name: activeProj.name,
          nodes: get().nodes,
          edges: get().edges,
          grade: audit.grade,
          monthlyCost,
        });
      } catch (err) {
        console.warn('[Auto-Save] Error saving project before dashboard transition:', err);
      }
    }
    set({ isViewOnly: false });
    get().setAppView('dashboard');
  },

  forkActiveProject: async () => {
    const activeProj = get().activeProject;
    const currentNodes = get().nodes;
    const currentEdges = get().edges;
    const newName = activeProj ? `${activeProj.name} (Fork)` : 'Shared Architecture (Fork)';

    try {
      if (activeProj?.id && activeProj.id !== 'shared') {
        const forked = await apiClient.forkArchitecture(activeProj.id, newName);
        get().openProject(forked, false);
        return forked.id;
      }
    } catch (err) {
      console.warn('Backend fork failed or unavailable, creating clone from current canvas:', err);
    }

    // Clone current nodes & edges directly into a new project
    try {
      const audit = auditArchitecture(currentNodes, currentEdges);
      const monthlyCost = Math.round(currentNodes.reduce((acc, n) => acc + (n.data.costPerHour || 0) * 730, 0));
      const saved = await apiClient.saveArchitecture({
        name: newName,
        nodes: currentNodes,
        edges: currentEdges,
        grade: audit.grade,
        monthlyCost,
        isPublic: true,
      });
      get().openProject(saved, false);
      return saved.id;
    } catch (err) {
      console.warn('Failed to save forked architecture to backend, keeping local clone:', err);
      set({
        activeProject: {
          id: `local_fork_${Date.now()}`,
          name: newName,
        },
        nodes: currentNodes,
        edges: currentEdges,
        isViewOnly: false,
      });
      return null;
    }
  },

  getShareableLink: () => {
    const activeProj = get().activeProject;
    if (typeof window === 'undefined') return '';
    const baseUrl = window.location.origin;
    if (activeProj?.id && activeProj.id !== 'shared') {
      return `${baseUrl}/?view=playground&project=${activeProj.id}&mode=view`;
    }
    return get().getCompressedShareUrl();
  },

  renameActiveProject: async (newName: string) => {
    const activeProj = get().activeProject;
    if (!activeProj || !newName.trim()) return;
    const trimmed = newName.trim();
    set({
      activeProject: {
        ...activeProj,
        name: trimmed,
      },
    });
    try {
      await apiClient.updateArchitecture(activeProj.id, { name: trimmed });
    } catch (err) {
      console.error('Failed to rename architecture:', err);
    }
  },

  createNewProject: async (name: string, description?: string, presetId?: string) => {
    let projectNodes: Node<InfrastructureNodeData>[] = [];
    let projectEdges: Edge<EdgeStreamData>[] = [];

    if (presetId && presetId !== 'blank') {
      const preset = PRESET_ARCHITECTURES.find((p) => p.id === presetId);
      if (preset) {
        projectNodes = preset.nodes.map((n) => ({
          ...n,
          data: {
            ...n.data,
            utilizationPercent: 0,
            isBottleneck: false,
          },
        })) as Node<InfrastructureNodeData>[];
        projectEdges = preset.edges.map((e) => ({
          ...e,
          type: 'flowEdge',
          data: {
            currentFlowRps: 2500,
            latencyMs: 5,
            errorRatePercent: 0,
            animated: true,
          },
        })) as Edge<EdgeStreamData>[];
      }
    }

    const audit = auditArchitecture(projectNodes, projectEdges);
    const monthlyCost = Math.round(projectNodes.reduce((acc, n) => acc + (n.data.costPerHour || 0) * 730, 0));

    try {
      const saved = await apiClient.saveArchitecture({
        name: name.trim() || 'Untitled Architecture',
        description: description?.trim() || '',
        nodes: projectNodes,
        edges: projectEdges,
        grade: audit.grade,
        monthlyCost,
        isPublic: true,
      });

      get().openProject(saved);
      return saved.id;
    } catch (err) {
      console.warn('Backend save unavailable, opening locally initialized architecture:', err);
      const fallbackProject: SavedArchitecture = {
        id: `arch_local_${Date.now()}`,
        userId: 'usr_guest_default',
        name: name.trim() || 'Untitled Architecture',
        description: description?.trim() || '',
        nodes: projectNodes,
        edges: projectEdges,
        chaos: {},
        grade: audit.grade,
        monthlyCost,
        isPublic: true,
        version: 1,
        forkOfId: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      get().openProject(fallbackProject);
      return fallbackProject.id;
    }
  },

  getCompressedShareUrl: () => {
    const stateToExport = {
      name: get().activeProject?.name || 'Shared Architecture',
      nodes: get().nodes.map((n) => ({
        id: n.id,
        type: n.type,
        position: n.position,
        data: n.data,
      })),
      edges: get().edges,
    };
    const jsonString = JSON.stringify(stateToExport);
    const compressed = LZString.compressToEncodedURIComponent(jsonString);
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    return `${baseUrl}/?view=playground&mode=view#architecture=${compressed}`;
  },

  loadFromUrlHash: (hashStr) => {
    try {
      if (!hashStr.includes('architecture=')) return false;
      const hashPayload = hashStr.includes('#') ? hashStr.split('#')[1] : hashStr;
      const match = hashPayload.match(/architecture=([^&]+)/);
      const compressed = match ? match[1] : null;
      if (!compressed) return false;
      
      const jsonString = LZString.decompressFromEncodedURIComponent(compressed);
      if (!jsonString) return false;

      const parsed = JSON.parse(jsonString);
      if (Array.isArray(parsed.nodes) && Array.isArray(parsed.edges)) {
        const isView = hashStr.includes('mode=view') || (typeof window !== 'undefined' && window.location.search.includes('mode=view'));
        set({
          nodes: parsed.nodes.map((n: any) => ({
            ...n,
            data: { ...n.data, utilizationPercent: 0, isBottleneck: false },
          })),
          edges: parsed.edges.map((e: any) => ({
            ...e,
            type: 'flowEdge',
            data: { currentFlowRps: 1000, latencyMs: 5, errorRatePercent: 0, animated: true },
          })),
          activePresetId: 'shared-url',
          activeProject: {
            id: 'shared',
            name: parsed.name || 'Shared Architecture',
          },
          isViewOnly: isView,
        });
        return true;
      }
    } catch (e) {
      console.error('Failed to parse state from URL hash', e);
    }
    return false;
  },
});
