import { describe, it, expect, beforeEach } from 'vitest';
import { useUIStore } from '../useUIStore';

beforeEach(() => {
  useUIStore.setState({
    mode: 'none',
    selectedMeasurementId: null,
    sidebarOpen: true,
    helpDialogOpen: false,
    settingsDialogOpen: false,
    annotationEditorOpen: false,
    pendingAnnotationPosition: null,
    editingAnnotationId: null,
    cropMode: false,
    cropBounds: null,
  });
});

describe('useUIStore', () => {
  describe('mode', () => {
    it('sets mode', () => {
      useUIStore.getState().setMode('measure');
      expect(useUIStore.getState().mode).toBe('measure');
    });

    it('toggles mode on', () => {
      useUIStore.getState().toggleMode('reference');
      expect(useUIStore.getState().mode).toBe('reference');
    });

    it('toggles mode off', () => {
      useUIStore.getState().setMode('measure');
      useUIStore.getState().toggleMode('measure');
      expect(useUIStore.getState().mode).toBe('none');
    });

    it('switches between modes', () => {
      useUIStore.getState().toggleMode('measure');
      useUIStore.getState().toggleMode('angle');
      expect(useUIStore.getState().mode).toBe('angle');
    });
  });

  describe('selection', () => {
    it('selects a measurement', () => {
      useUIStore.getState().selectMeasurement('abc');
      expect(useUIStore.getState().selectedMeasurementId).toBe('abc');
    });

    it('deselects when clicking same id', () => {
      useUIStore.getState().selectMeasurement('abc');
      useUIStore.getState().selectMeasurement('abc');
      expect(useUIStore.getState().selectedMeasurementId).toBeNull();
    });

    it('selects null to deselect', () => {
      useUIStore.getState().selectMeasurement('abc');
      useUIStore.getState().selectMeasurement(null);
      expect(useUIStore.getState().selectedMeasurementId).toBeNull();
    });
  });

  describe('sidebar', () => {
    it('toggles sidebar', () => {
      expect(useUIStore.getState().sidebarOpen).toBe(true);
      useUIStore.getState().toggleSidebar();
      expect(useUIStore.getState().sidebarOpen).toBe(false);
      useUIStore.getState().toggleSidebar();
      expect(useUIStore.getState().sidebarOpen).toBe(true);
    });

    it('sets sidebar open state', () => {
      useUIStore.getState().setSidebarOpen(false);
      expect(useUIStore.getState().sidebarOpen).toBe(false);
    });

    it('sets sidebar width with clamping', () => {
      useUIStore.getState().setSidebarWidth(350);
      expect(useUIStore.getState().sidebarWidth).toBe(350);
    });

    it('clamps minimum sidebar width', () => {
      useUIStore.getState().setSidebarWidth(50);
      expect(useUIStore.getState().sidebarWidth).toBe(200);
    });

    it('clamps maximum sidebar width', () => {
      useUIStore.getState().setSidebarWidth(1000);
      expect(useUIStore.getState().sidebarWidth).toBe(500);
    });
  });

  describe('annotation editor', () => {
    it('starts annotation placement', () => {
      useUIStore.getState().startAnnotationPlacement({ x: 10, y: 20 });
      const state = useUIStore.getState();
      expect(state.annotationEditorOpen).toBe(true);
      expect(state.pendingAnnotationPosition).toEqual({ x: 10, y: 20 });
      expect(state.editingAnnotationId).toBeNull();
    });

    it('opens annotation editor for existing annotation', () => {
      useUIStore.getState().openAnnotationEditor('ann-1');
      const state = useUIStore.getState();
      expect(state.annotationEditorOpen).toBe(true);
      expect(state.editingAnnotationId).toBe('ann-1');
      expect(state.pendingAnnotationPosition).toBeNull();
    });

    it('closes annotation editor', () => {
      useUIStore.getState().startAnnotationPlacement({ x: 10, y: 20 });
      useUIStore.getState().closeAnnotationEditor();
      const state = useUIStore.getState();
      expect(state.annotationEditorOpen).toBe(false);
      expect(state.pendingAnnotationPosition).toBeNull();
      expect(state.editingAnnotationId).toBeNull();
    });
  });

  describe('crop mode', () => {
    it('enables crop mode and resets mode to none', () => {
      useUIStore.getState().setMode('measure');
      useUIStore.getState().setCropMode(true);
      expect(useUIStore.getState().cropMode).toBe(true);
      expect(useUIStore.getState().mode).toBe('none');
    });

    it('disables crop mode', () => {
      useUIStore.getState().setCropMode(true);
      useUIStore.getState().setCropMode(false);
      expect(useUIStore.getState().cropMode).toBe(false);
    });

    it('sets crop bounds', () => {
      const bounds = { x: 10, y: 20, w: 100, h: 200 };
      useUIStore.getState().setCropBounds(bounds);
      expect(useUIStore.getState().cropBounds).toEqual(bounds);
    });

    it('cancelCrop resets all crop state', () => {
      useUIStore.getState().setCropMode(true);
      useUIStore.getState().setCropBounds({ x: 10, y: 20, w: 100, h: 200 });
      useUIStore.getState().cancelCrop();
      expect(useUIStore.getState().cropMode).toBe(false);
      expect(useUIStore.getState().cropBounds).toBeNull();
    });
  });

  describe('dialogs', () => {
    it('opens and closes help dialog', () => {
      useUIStore.getState().setHelpDialogOpen(true);
      expect(useUIStore.getState().helpDialogOpen).toBe(true);
      useUIStore.getState().setHelpDialogOpen(false);
      expect(useUIStore.getState().helpDialogOpen).toBe(false);
    });

    it('opens and closes settings dialog', () => {
      useUIStore.getState().setSettingsDialogOpen(true);
      expect(useUIStore.getState().settingsDialogOpen).toBe(true);
      useUIStore.getState().setSettingsDialogOpen(false);
      expect(useUIStore.getState().settingsDialogOpen).toBe(false);
    });
  });
});
