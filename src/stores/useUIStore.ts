import { create } from 'zustand';
import { DrawMode } from '@/types/measurement';

interface UIState {
  mode: DrawMode;
  selectedMeasurementId: string | null;
  sidebarOpen: boolean;
  helpDialogOpen: boolean;
  settingsDialogOpen: boolean;

  setMode: (mode: DrawMode) => void;
  toggleMode: (mode: DrawMode) => void;
  selectMeasurement: (id: string | null) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setHelpDialogOpen: (open: boolean) => void;
  setSettingsDialogOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  mode: 'none',
  selectedMeasurementId: null,
  sidebarOpen: true,
  helpDialogOpen: false,
  settingsDialogOpen: false,

  setMode: (mode) => set({ mode }),
  toggleMode: (mode) => set({ mode: get().mode === mode ? 'none' : mode }),
  selectMeasurement: (id) =>
    set({ selectedMeasurementId: get().selectedMeasurementId === id ? null : id }),
  toggleSidebar: () => set({ sidebarOpen: !get().sidebarOpen }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setHelpDialogOpen: (open) => set({ helpDialogOpen: open }),
  setSettingsDialogOpen: (open) => set({ settingsDialogOpen: open }),
}));
