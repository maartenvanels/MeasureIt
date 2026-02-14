import { create } from 'zustand';
import { DrawMode, Point } from '@/types/measurement';

interface UIState {
  mode: DrawMode;
  selectedMeasurementId: string | null;
  sidebarOpen: boolean;
  sidebarWidth: number;
  helpDialogOpen: boolean;
  settingsDialogOpen: boolean;

  // Annotation editor
  annotationEditorOpen: boolean;
  pendingAnnotationPosition: Point | null;
  editingAnnotationId: string | null;

  // Crop mode
  cropMode: boolean;
  cropBounds: { x: number; y: number; w: number; h: number } | null;

  setMode: (mode: DrawMode) => void;
  toggleMode: (mode: DrawMode) => void;
  selectMeasurement: (id: string | null) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setSidebarWidth: (width: number) => void;
  setHelpDialogOpen: (open: boolean) => void;
  setSettingsDialogOpen: (open: boolean) => void;

  // Annotation editor actions
  startAnnotationPlacement: (position: Point) => void;
  openAnnotationEditor: (id: string) => void;
  closeAnnotationEditor: () => void;

  // Crop actions
  setCropMode: (active: boolean) => void;
  setCropBounds: (bounds: { x: number; y: number; w: number; h: number } | null) => void;
  cancelCrop: () => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  mode: 'none',
  selectedMeasurementId: null,
  sidebarOpen: true,
  sidebarWidth: (() => {
    if (typeof window === 'undefined') return 288;
    try {
      const saved = localStorage.getItem('measureit_sidebar_width');
      return saved ? Math.max(200, Math.min(500, Number(saved))) : 288;
    } catch { return 288; }
  })(),
  helpDialogOpen: false,
  settingsDialogOpen: false,

  annotationEditorOpen: false,
  pendingAnnotationPosition: null,
  editingAnnotationId: null,

  cropMode: false,
  cropBounds: null,

  setMode: (mode) => set({ mode }),
  toggleMode: (mode) => set({ mode: get().mode === mode ? 'none' : mode }),
  selectMeasurement: (id) =>
    set({ selectedMeasurementId: get().selectedMeasurementId === id ? null : id }),
  toggleSidebar: () => set({ sidebarOpen: !get().sidebarOpen }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setSidebarWidth: (width) => {
    const clamped = Math.max(200, Math.min(500, width));
    set({ sidebarWidth: clamped });
    try { localStorage.setItem('measureit_sidebar_width', String(clamped)); } catch {}
  },
  setHelpDialogOpen: (open) => set({ helpDialogOpen: open }),
  setSettingsDialogOpen: (open) => set({ settingsDialogOpen: open }),

  startAnnotationPlacement: (position) =>
    set({ annotationEditorOpen: true, pendingAnnotationPosition: position, editingAnnotationId: null }),
  openAnnotationEditor: (id) =>
    set({ annotationEditorOpen: true, editingAnnotationId: id, pendingAnnotationPosition: null }),
  closeAnnotationEditor: () =>
    set({ annotationEditorOpen: false, pendingAnnotationPosition: null, editingAnnotationId: null }),

  setCropMode: (active) => set({ cropMode: active, cropBounds: null, mode: active ? 'none' : get().mode }),
  setCropBounds: (bounds) => set({ cropBounds: bounds }),
  cancelCrop: () => set({ cropMode: false, cropBounds: null }),
}));
