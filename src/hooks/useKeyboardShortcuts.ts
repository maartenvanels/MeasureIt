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
      const { cancelDrawing, isDrawing } = useCanvasStore.getState();

      switch (e.key.toLowerCase()) {
        case 'r':
          if (!e.ctrlKey && !e.metaKey) toggleMode('reference');
          break;
        case 'm':
          if (!e.ctrlKey && !e.metaKey) toggleMode('measure');
          break;
        case 'escape':
          if (isDrawing) {
            cancelDrawing();
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
