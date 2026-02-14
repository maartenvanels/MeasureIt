'use client';

import { useCallback, useEffect, RefObject } from 'react';
import { useCanvasStore } from '@/stores/useCanvasStore';
import { useUIStore } from '@/stores/useUIStore';
import { useMeasurementStore } from '@/stores/useMeasurementStore';
import { screenToImage, pixelDist } from '@/lib/geometry';
import { calcRealDistance } from '@/lib/calculations';

export function useCanvasInteraction(overlayRef: RefObject<HTMLCanvasElement | null>) {
  const canvasStore = useCanvasStore;
  const uiStore = useUIStore;
  const measurementStore = useMeasurementStore;

  const handlePointerDown = useCallback(
    (e: PointerEvent) => {
      const canvas = overlayRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const mode = uiStore.getState().mode;
      const transform = canvasStore.getState().transform;

      // Middle mouse button or left click in 'none' mode → pan
      if (e.button === 1 || (e.button === 0 && mode === 'none')) {
        canvasStore.getState().startPanning({ x: mx, y: my });
        canvas.setPointerCapture(e.pointerId);
        e.preventDefault();
        return;
      }

      // Left click in draw mode
      if (e.button === 0 && (mode === 'reference' || mode === 'measure')) {
        const imgPt = screenToImage(mx, my, transform);
        canvasStore.getState().startDrawing(imgPt);
        canvas.setPointerCapture(e.pointerId);
      }
    },
    [overlayRef, canvasStore, uiStore]
  );

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      const canvas = overlayRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const state = canvasStore.getState();

      if (state.isPanning) {
        state.updatePanning({ x: mx, y: my });
        return;
      }

      if (state.isDrawing) {
        const imgPt = screenToImage(mx, my, state.transform);
        state.updateDrawing(imgPt, e.shiftKey);
      }
    },
    [overlayRef, canvasStore]
  );

  const handlePointerUp = useCallback(
    (e: PointerEvent) => {
      const canvas = overlayRef.current;
      if (!canvas) return;
      const state = canvasStore.getState();

      if (state.isPanning) {
        state.stopPanning();
        return;
      }

      if (state.isDrawing) {
        const result = state.finishDrawing();
        if (result) {
          const mode = uiStore.getState().mode;
          const mStore = measurementStore.getState();
          const id = crypto.randomUUID();
          const name =
            mode === 'reference'
              ? 'Reference'
              : `Measurement ${mStore.getMeasureCount() + 1}`;

          mStore.addMeasurement({
            id,
            type: mode as 'reference' | 'measure',
            start: result.start,
            end: result.end,
            pixelLength: result.pixelLength,
            name,
            createdAt: Date.now(),
          });
        }
      }
    },
    [overlayRef, canvasStore, uiStore, measurementStore]
  );

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();
      const canvas = overlayRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      canvasStore.getState().zoomAtPoint(mx, my, e.deltaY);
    },
    [overlayRef, canvasStore]
  );

  const handleContextMenu = useCallback((e: Event) => {
    e.preventDefault();
  }, []);

  useEffect(() => {
    const canvas = overlayRef.current;
    if (!canvas) return;

    canvas.addEventListener('pointerdown', handlePointerDown);
    canvas.addEventListener('pointermove', handlePointerMove);
    canvas.addEventListener('pointerup', handlePointerUp);
    canvas.addEventListener('wheel', handleWheel, { passive: false });
    canvas.addEventListener('contextmenu', handleContextMenu);

    return () => {
      canvas.removeEventListener('pointerdown', handlePointerDown);
      canvas.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('pointerup', handlePointerUp);
      canvas.removeEventListener('wheel', handleWheel);
      canvas.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [overlayRef, handlePointerDown, handlePointerMove, handlePointerUp, handleWheel, handleContextMenu]);
}

export function useMousePosition(overlayRef: RefObject<HTMLCanvasElement | null>) {
  const getMouseImagePos = useCallback(
    (e: PointerEvent) => {
      const canvas = overlayRef.current;
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const transform = useCanvasStore.getState().transform;
      return screenToImage(mx, my, transform);
    },
    [overlayRef]
  );

  return { getMouseImagePos };
}
