'use client';

import { useEffect } from 'react';
import { useUIStore } from '@/stores/useUIStore';
import { useMeasurementStore } from '@/stores/useMeasurementStore';
import { useCanvasStore } from '@/stores/useCanvasStore';

export function useKeyboardShortcuts() {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Skip when typing in inputs
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      const { toggleMode, selectMeasurement, selectedMeasurementId } =
        useUIStore.getState();
      const { undo, redo, removeMeasurement } = useMeasurementStore.getState();
      const { cancelDrawing, isDrawing, cancelAngle, angleStep, cancelArea, areaPoints, cancelCropDraw } = useCanvasStore.getState();

      switch (e.key.toLowerCase()) {
        case 'r':
          if (!e.ctrlKey && !e.metaKey) toggleMode('reference');
          break;
        case 'm':
          if (!e.ctrlKey && !e.metaKey) toggleMode('measure');
          break;
        case 'a':
          if (!e.ctrlKey && !e.metaKey) toggleMode('angle');
          break;
        case 'p':
          if (!e.ctrlKey && !e.metaKey) toggleMode('area');
          break;
        case 't':
          if (!e.ctrlKey && !e.metaKey) toggleMode('annotation');
          break;
        case 'c':
          if (!e.ctrlKey && !e.metaKey) {
            const ui = useUIStore.getState();
            ui.setCropMode(!ui.cropMode);
          }
          break;
        case 'escape':
          if (useUIStore.getState().cropMode) {
            cancelCropDraw();
            useUIStore.getState().cancelCrop();
          } else if (useUIStore.getState().annotationEditorOpen) {
            useUIStore.getState().closeAnnotationEditor();
          } else if (isDrawing) {
            cancelDrawing();
          } else if (angleStep) {
            cancelAngle();
          } else if (areaPoints.length > 0) {
            cancelArea();
          } else {
            useUIStore.getState().setMode('none');
            selectMeasurement(null);
          }
          break;
        case 'z':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            if (e.shiftKey) {
              redo();
            } else {
              undo();
            }
          }
          break;
        case 'delete':
        case 'backspace':
          if (selectedMeasurementId) {
            removeMeasurement(selectedMeasurementId);
            selectMeasurement(null);
          }
          break;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);
}
