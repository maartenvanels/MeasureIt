import { create } from 'zustand';
import { DrawMode, Point } from '@/types/measurement';

interface UIState {
  mode: DrawMode;
  selectedMeasurementId: string | null;
  sidebarOpen: boolean;
  helpDialogOpen: boolean;
  settingsDialogOpen: boolean;

  // Annotation editor
  annotationEditorOpen: boolean;
  pendingAnnotationPosition: Point | null;
  editingAnnotationId: string | null;

  setMode: (mode: DrawMode) => void;
  toggleMode: (mode: DrawMode) => void;
  selectMeasurement: (id: string | null) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setHelpDialogOpen: (open: boolean) => void;
  setSettingsDialogOpen: (open: boolean) => void;

  // Annotation editor actions
  startAnnotationPlacement: (position: Point) => void;
  openAnnotationEditor: (id: string) => void;
  closeAnnotationEditor: () => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  mode: 'none',
  selectedMeasurementId: null,
  sidebarOpen: true,
  helpDialogOpen: false,
  settingsDialogOpen: false,

  annotationEditorOpen: false,
  pendingAnnotationPosition: null,
  editingAnnotationId: null,

  setMode: (mode) => set({ mode }),
  toggleMode: (mode) => set({ mode: get().mode === mode ? 'none' : mode }),
  selectMeasurement: (id) =>
    set({ selectedMeasurementId: get().selectedMeasurementId === id ? null : id }),
  toggleSidebar: () => set({ sidebarOpen: !get().sidebarOpen }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setHelpDialogOpen: (open) => set({ helpDialogOpen: open }),
  setSettingsDialogOpen: (open) => set({ settingsDialogOpen: open }),

  startAnnotationPlacement: (position) =>
    set({ annotationEditorOpen: true, pendingAnnotationPosition: position, editingAnnotationId: null }),
  openAnnotationEditor: (id) =>
    set({ annotationEditorOpen: true, editingAnnotationId: id, pendingAnnotationPosition: null }),
  closeAnnotationEditor: () =>
    set({ annotationEditorOpen: false, pendingAnnotationPosition: null, editingAnnotationId: null }),
}));
