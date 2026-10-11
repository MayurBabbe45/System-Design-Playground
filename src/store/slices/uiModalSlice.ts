import type { StateCreator } from 'zustand';
import type { AvailabilityZone } from '../../types/playground.ts';
import type { PlaygroundStoreState, UiModalSlice } from '../types.ts';

if (typeof document !== 'undefined') {
  document.documentElement.setAttribute('data-theme', 'dark');
  document.documentElement.classList.add('dark');
  document.documentElement.classList.remove('light');
}
if (typeof localStorage !== 'undefined') {
  localStorage.setItem('spd_theme', 'dark');
}

export const getInitialViewMode = (): 'simple' | 'detailed' => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('spd_view_mode');
    if (saved === 'simple' || saved === 'detailed') return saved;
  }
  return 'simple';
};

export const createUiModalSlice: StateCreator<
  PlaygroundStoreState,
  [],
  [],
  UiModalSlice
> = (set, get) => ({
  // Chaos State
  killedAzs: [],
  globalInjectedLatencyMs: 0,
  globalPacketDropPercent: 0,
  isChaosCenterOpen: false,

  // Modals Visibility
  isCostModalOpen: false,
  isAuditModalOpen: false,
  isExportModalOpen: false,
  isCollabModalOpen: false,

  // Theme & Appearance
  theme: 'dark',
  canvasViewMode: getInitialViewMode(),

  toggleChaosCenter: () => {
    set({ isChaosCenterOpen: !get().isChaosCenterOpen });
  },

  toggleCostModal: () => {
    set({ isCostModalOpen: !get().isCostModalOpen });
  },

  toggleAuditModal: () => {
    set({ isAuditModalOpen: !get().isAuditModalOpen });
  },

  toggleExportModal: () => {
    set({ isExportModalOpen: !get().isExportModalOpen });
  },

  toggleCollabModal: () => {
    set({ isCollabModalOpen: !get().isCollabModalOpen });
  },

  toggleKillAz: (az: AvailabilityZone) => {
    const current = get().killedAzs;
    const exists = current.includes(az);
    set({
      killedAzs: exists ? current.filter((k) => k !== az) : [...current, az],
    });
  },

  resetChaos: () => {
    set({
      killedAzs: [],
      globalInjectedLatencyMs: 0,
      globalPacketDropPercent: 0,
      nodes: get().nodes.map((n) => ({
        ...n,
        data: {
          ...n.data,
          isKilled: false,
          status: 'healthy',
          circuitBreakerState: 'CLOSED',
        },
      })),
    });
  },

  setGlobalInjectedLatencyMs: (ms: number) => {
    set({ globalInjectedLatencyMs: ms });
  },

  setGlobalPacketDropPercent: (percent: number) => {
    set({ globalPacketDropPercent: percent });
  },

  toggleTheme: () => {
    // Light mode is permanently disabled
  },

  setCanvasViewMode: (mode: 'simple' | 'detailed') => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('spd_view_mode', mode);
    }
    set({ canvasViewMode: mode });
  },

  toggleCanvasViewMode: () => {
    const next = get().canvasViewMode === 'simple' ? 'detailed' : 'simple';
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('spd_view_mode', next);
    }
    set({ canvasViewMode: next });
  },
});
