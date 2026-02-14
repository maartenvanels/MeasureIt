'use client';

import { useCallback, useEffect, useRef, RefObject } from 'react';
import { useCanvasStore } from '@/stores/useCanvasStore';
import { useUIStore } from '@/stores/useUIStore';
import { useMeasurementStore } from '@/stores/useMeasurementStore';
import { screenToImage } from '@/lib/geometry';

function pointerDist(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2);
}

export function useCanvasInteraction(overlayRef: RefObject<HTMLCanvasElement | null>) {
  const canvasStore = useCanvasStore;
  const uiStore = useUIStore;
  const measurementStore = useMeasurementStore;

  // Track active pointers for multi-touch
  const activePointers = useRef<Map<number, { x: number; y: number }>>(new Map());

  const handlePointerDown = useCallback(
    (e: PointerEvent) => {
      const canvas = overlayRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const mode = uiStore.getState().mode;
      const transform = canvasStore.getState().transform;

      // Track pointer for touch
      activePointers.current.set(e.pointerId, { x: mx, y: my });

      // If 2 fingers are down, start pinch zoom
      if (activePointers.current.size === 2) {
        const pts = Array.from(activePointers.current.values());
        const dist = pointerDist(pts[0], pts[1]);
        canvasStore.getState().startPinchZoom(dist);
        // Cancel any in-progress drawing
        canvasStore.getState().cancelDrawing();
        canvas.setPointerCapture(e.pointerId);
        e.preventDefault();
        return;
      }

      // Middle mouse button or left click in 'none' mode → pan
      if (e.button === 1 || (e.button === 0 && mode === 'none')) {
        canvasStore.getState().startPanning({ x: mx, y: my });
        canvas.setPointerCapture(e.pointerId);
        e.preventDefault();
        return;
      }

      // Left click in angle mode
      if (e.button === 0 && mode === 'angle') {
        const imgPt = screenToImage(mx, my, transform);
        const state = canvasStore.getState();
        // Start angle drawing if not yet started
        if (!state.angleStep) {
          state.startAngle();
        }
        const result = canvasStore.getState().placeAnglePoint(imgPt);
        if (result) {
          const mStore = measurementStore.getState();
          result.name = `Angle ${mStore.getAngleCount() + 1}`;
          mStore.addAngle(result);
          // Automatically start a new angle sequence
          canvasStore.getState().startAngle();
        }
        canvas.setPointerCapture(e.pointerId);
        return;
      }

      // Left click in draw mode
      if (e.button === 0 && (mode === 'reference' || mode === 'measure')) {
        const imgPt = screenToImage(mx, my, transform);
        canvasStore.getState().startDrawing(imgPt);
        canvas.setPointerCapture(e.pointerId);
      }
    },
    [overlayRef, canvasStore, uiStore, measurementStore]
  );

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      const canvas = overlayRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const state = canvasStore.getState();

      // Update tracked pointer
      if (activePointers.current.has(e.pointerId)) {
        activePointers.current.set(e.pointerId, { x: mx, y: my });
      }

      // Handle pinch zoom
      if (activePointers.current.size === 2 && state.pinchStartDist !== null) {
        const pts = Array.from(activePointers.current.values());
        const dist = pointerDist(pts[0], pts[1]);
        const centerX = (pts[0].x + pts[1].x) / 2;
        const centerY = (pts[0].y + pts[1].y) / 2;
        state.updatePinchZoom(dist, centerX, centerY);
        return;
      }

      if (state.isPanning) {
        state.updatePanning({ x: mx, y: my });
        return;
      }

      if (state.isDrawing) {
        const imgPt = screenToImage(mx, my, state.transform);
        state.updateDrawing(imgPt, e.shiftKey);
      }

      // Update cursor position for angle in-progress preview
      if (state.angleStep) {
        const imgPt = screenToImage(mx, my, state.transform);
        // Store cursor position in drawCurrent for the renderer
        canvasStore.setState({ drawCurrent: imgPt });
      }
    },
    [overlayRef, canvasStore]
  );

  const handlePointerUp = useCallback(
    (e: PointerEvent) => {
      const canvas = overlayRef.current;
      if (!canvas) return;
      const state = canvasStore.getState();

      // Remove tracked pointer
      activePointers.current.delete(e.pointerId);

      // Stop pinch zoom when fingers lift
      if (state.pinchStartDist !== null) {
        if (activePointers.current.size < 2) {
          state.stopPinchZoom();
        }
        return;
      }

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
    canvas.addEventListener('pointercancel', handlePointerUp);
    canvas.addEventListener('wheel', handleWheel, { passive: false });
    canvas.addEventListener('contextmenu', handleContextMenu);

    // Enable touch-action none for proper pointer events on touch
    canvas.style.touchAction = 'none';

    return () => {
      canvas.removeEventListener('pointerdown', handlePointerDown);
      canvas.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('pointerup', handlePointerUp);
      canvas.removeEventListener('pointercancel', handlePointerUp);
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
