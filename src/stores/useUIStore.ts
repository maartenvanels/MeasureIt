import { create } from 'zustand';
import { DrawMode, Point, ViewMode, isAreaMode } from '@/types/measurement';

interface UIState {
  mode: DrawMode;
  viewMode: ViewMode;
  selectedMeasurementId: string | null;
  sidebarOpen: boolean;
  sidebarWidth: number;
  helpDialogOpen: boolean;
  settingsDialogOpen: boolean;

  // Annotation editor
  annotationEditorOpen: boolean;
  pendingAnnotationPosition: Point | null;
  editingAnnotationId: string | null;

  // Arrow draw for annotations
  arrowDrawAnnotationId: string | null;

  // Grid
  gridEnabled: boolean;
  gridSpacing: number;

  // Crop mode
  cropMode: boolean;
  cropBounds: { x: number; y: number; w: number; h: number } | null;

  // 3D display options
  show3DAxisDistances: boolean;

  // Last-used area tool
  lastAreaTool: DrawMode;
  setLastAreaTool: (mode: DrawMode) => void;

  setViewMode: (viewMode: ViewMode) => void;
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

  // Arrow draw actions
  startArrowDraw: (annotationId: string) => void;
  cancelArrowDraw: () => void;

  // Grid actions
  setGridEnabled: (enabled: boolean) => void;
  setGridSpacing: (spacing: number) => void;
  toggleGrid: () => void;

  // Crop actions
  setCropMode: (active: boolean) => void;
  setCropBounds: (bounds: { x: number; y: number; w: number; h: number } | null) => void;
  cancelCrop: () => void;

  // 3D display actions
  toggleShow3DAxisDistances: () => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  mode: 'none',
  viewMode: '2d',
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

  arrowDrawAnnotationId: null,

  gridEnabled: false,
  gridSpacing: (() => {
    if (typeof window === 'undefined') return 50;
    try {
      const saved = localStorage.getItem('measureit_grid_spacing');
      return saved ? Math.max(5, Math.min(500, Number(saved))) : 50;
    } catch { return 50; }
  })(),

  cropMode: false,
  cropBounds: null,

  show3DAxisDistances: false,

  lastAreaTool: (() => {
    if (typeof window === 'undefined') return 'area-polygon' as DrawMode;
    try {
      const saved = localStorage.getItem('measureit_last_area_tool');
      return (saved as DrawMode) || 'area-polygon';
    } catch { return 'area-polygon' as DrawMode; }
  })(),

  setLastAreaTool: (mode) => {
    set({ lastAreaTool: mode });
    try { localStorage.setItem('measureit_last_area_tool', mode); } catch {}
  },

  setViewMode: (viewMode) => set({ viewMode, mode: 'none' }),
  setMode: (mode) => {
    set({ mode });
    if (isAreaMode(mode) && mode !== 'area') {
      get().setLastAreaTool(mode);
    }
  },
  toggleMode: (mode) => {
    const current = get().mode;
    const newMode = current === mode ? 'none' : mode;
    set({ mode: newMode });
    if (isAreaMode(mode) && mode !== 'area' && newMode !== 'none') {
      get().setLastAreaTool(mode);
    }
  },
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

  startArrowDraw: (annotationId) => set({ arrowDrawAnnotationId: annotationId, mode: 'none' }),
  cancelArrowDraw: () => set({ arrowDrawAnnotationId: null }),

  setGridEnabled: (enabled) => set({ gridEnabled: enabled }),
  setGridSpacing: (spacing) => {
    const clamped = Math.max(5, Math.min(500, spacing));
    set({ gridSpacing: clamped });
    try { localStorage.setItem('measureit_grid_spacing', String(clamped)); } catch {}
  },
  toggleGrid: () => set({ gridEnabled: !get().gridEnabled }),

  setCropMode: (active) => set({ cropMode: active, cropBounds: null, mode: active ? 'none' : get().mode }),
  setCropBounds: (bounds) => set({ cropBounds: bounds }),
  cancelCrop: () => set({ cropMode: false, cropBounds: null }),

  toggleShow3DAxisDistances: () => set({ show3DAxisDistances: !get().show3DAxisDistances }),
}));
