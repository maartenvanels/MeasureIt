'use client';

import { useCallback, useEffect, useRef, RefObject } from 'react';
import { useCanvasStore } from '@/stores/useCanvasStore';
import { useUIStore } from '@/stores/useUIStore';
import { useMeasurementStore } from '@/stores/useMeasurementStore';
import { screenToImage, findSnapPoint, snapToAxis, imageToScreen } from '@/lib/geometry';
import { LabelBounds } from '@/types/measurement';

function pointerDist(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2);
}

export function useCanvasInteraction(
  overlayRef: RefObject<HTMLCanvasElement | null>,
  labelBoundsRef?: RefObject<LabelBounds[]>
) {
  const canvasStore = useCanvasStore;
  const uiStore = useUIStore;
  const measurementStore = useMeasurementStore;

  // Track active pointers for multi-touch
  const activePointers = useRef<Map<number, { x: number; y: number }>>(new Map());

  // Label drag state
  const labelDrag = useRef<{
    measurementId: string;
    labelType: 'value' | 'name';
    startX: number;
    startY: number;
    origOffset: { x: number; y: number };
  } | null>(null);

  /** Get image point with snap-to-point applied */
  const getSnappedPoint = (mx: number, my: number) => {
    const state = canvasStore.getState();
    const imgPt = screenToImage(mx, my, state.transform);
    const measurements = measurementStore.getState().measurements;
    const snap = findSnapPoint(imgPt, measurements, state.transform);
    if (snap) {
      state.setSnapPoint(snap);
      return snap;
    }
    state.setSnapPoint(null);
    return imgPt;
  };

  const handlePointerDown = useCallback(
    (e: PointerEvent) => {
      const canvas = overlayRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const mode = uiStore.getState().mode;

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

      // Crop mode: draw crop rectangle
      const { cropMode } = uiStore.getState();
      if (cropMode && e.button === 0) {
        const imgPt = screenToImage(mx, my, canvasStore.getState().transform);
        canvasStore.getState().startCropDraw(imgPt);
        canvas.setPointerCapture(e.pointerId);
        e.preventDefault();
        return;
      }

      // Label drag: check if clicking on a label (only in navigate mode)
      if (e.button === 0 && mode === 'none' && labelBoundsRef?.current) {
        for (let i = labelBoundsRef.current.length - 1; i >= 0; i--) {
          const lb = labelBoundsRef.current[i];
          if (mx >= lb.x && mx <= lb.x + lb.w && my >= lb.y && my <= lb.y + lb.h) {
            const m = measurementStore.getState().measurements.find((m) => m.id === lb.measurementId);
            if (m && m.type !== 'annotation') {
              const offsetField = lb.labelType === 'value' ? 'labelOffset' : 'nameLabelOffset';
              const currentOffset = (m as unknown as Record<string, unknown>)[offsetField] as { x: number; y: number } | undefined;
              labelDrag.current = {
                measurementId: lb.measurementId,
                labelType: lb.labelType,
                startX: mx,
                startY: my,
                origOffset: currentOffset ? { ...currentOffset } : { x: 0, y: 0 },
              };
              canvas.setPointerCapture(e.pointerId);
              e.preventDefault();
              return;
            }
          }
        }
      }

      // Middle mouse button or left click in 'none' mode → pan
      if (e.button === 1 || (e.button === 0 && mode === 'none')) {
        canvasStore.getState().startPanning({ x: mx, y: my });
        canvas.setPointerCapture(e.pointerId);
        e.preventDefault();
        return;
      }

      // Left click in annotation mode
      if (e.button === 0 && mode === 'annotation') {
        const imgPt = getSnappedPoint(mx, my);
        uiStore.getState().startAnnotationPlacement(imgPt);
        canvas.setPointerCapture(e.pointerId);
        return;
      }

      // Left click in area mode
      if (e.button === 0 && mode === 'area') {
        const imgPt = getSnappedPoint(mx, my);
        const state = canvasStore.getState();
        const areaPoints = state.areaPoints;

        // Check if clicking near first point to close polygon
        if (areaPoints.length >= 3) {
          const firstPt = areaPoints[0];
          const firstScreen = imageToScreen(firstPt.x, firstPt.y, state.transform);
          const clickDist = pointerDist({ x: mx, y: my }, firstScreen);
          if (clickDist < 15) {
            const result = state.finishArea();
            if (result) {
              const mStore = measurementStore.getState();
              result.name = `Area ${mStore.getAreaCount() + 1}`;
              mStore.addArea(result);
            }
            canvas.setPointerCapture(e.pointerId);
            return;
          }
        }

        state.addAreaPoint(imgPt);
        canvas.setPointerCapture(e.pointerId);
        return;
      }

      // Left click in angle mode — use snapped point
      if (e.button === 0 && mode === 'angle') {
        const imgPt = getSnappedPoint(mx, my);
        const state = canvasStore.getState();
        if (!state.angleStep) {
          state.startAngle();
        }
        const result = canvasStore.getState().placeAnglePoint(imgPt);
        if (result) {
          const mStore = measurementStore.getState();
          result.name = `Angle ${mStore.getAngleCount() + 1}`;
          mStore.addAngle(result);
          canvasStore.getState().startAngle();
        }
        canvas.setPointerCapture(e.pointerId);
        return;
      }

      // Left click in draw mode — use snapped point
      if (e.button === 0 && (mode === 'reference' || mode === 'measure')) {
        const imgPt = getSnappedPoint(mx, my);
        canvasStore.getState().startDrawing(imgPt);
        canvas.setPointerCapture(e.pointerId);
      }
    },
    [overlayRef, canvasStore, uiStore, measurementStore, labelBoundsRef]
  );

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      const canvas = overlayRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const state = canvasStore.getState();
      const mode = uiStore.getState().mode;

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

      // Label drag in progress
      if (labelDrag.current) {
        const drag = labelDrag.current;
        const transform = canvasStore.getState().transform;
        const dx = (mx - drag.startX) / transform.zoom;
        const dy = (my - drag.startY) / transform.zoom;
        const newOffset = { x: drag.origOffset.x + dx, y: drag.origOffset.y + dy };
        const field = drag.labelType === 'value' ? 'labelOffset' : 'nameLabelOffset';
        measurementStore.getState().updateMeasurement(drag.measurementId, { [field]: newOffset });
        return;
      }

      // Crop drawing in progress
      if (state.isCropping) {
        const imgPt = screenToImage(mx, my, state.transform);
        state.updateCropDraw(imgPt);
        return;
      }

      if (state.isPanning) {
        state.updatePanning({ x: mx, y: my });
        return;
      }

      // Label hover cursor (in navigate mode)
      if (mode === 'none' && labelBoundsRef?.current && !uiStore.getState().cropMode) {
        let overLabel = false;
        for (const lb of labelBoundsRef.current) {
          if (mx >= lb.x && mx <= lb.x + lb.w && my >= lb.y && my <= lb.y + lb.h) {
            overLabel = true;
            break;
          }
        }
        canvas.style.cursor = overLabel ? 'move' : '';
      }

      // Check snap for visual feedback when in a drawing mode
      if (mode !== 'none') {
        const imgPt = screenToImage(mx, my, state.transform);
        const measurements = measurementStore.getState().measurements;
        const snap = findSnapPoint(imgPt, measurements, state.transform);
        state.setSnapPoint(snap);
      } else {
        if (state.snapPoint) state.setSnapPoint(null);
      }

      if (state.isDrawing) {
        const imgPt = getSnappedPoint(mx, my);
        const snapped = e.shiftKey && state.drawStart
          ? snapToAxis(state.drawStart, imgPt)
          : imgPt;
        canvasStore.setState({ drawCurrent: snapped });
      }

      // Update cursor position for angle in-progress preview
      if (state.angleStep) {
        const imgPt = getSnappedPoint(mx, my);
        canvasStore.setState({ drawCurrent: imgPt });
      }

      // Update cursor position for area in-progress preview
      if (mode === 'area' && state.areaPoints.length > 0) {
        const imgPt = getSnappedPoint(mx, my);
        canvasStore.setState({ drawCurrent: imgPt });
      }
    },
    [overlayRef, canvasStore, uiStore, measurementStore, labelBoundsRef]
  );

  const handlePointerUp = useCallback(
    (e: PointerEvent) => {
      const canvas = overlayRef.current;
      if (!canvas) return;
      const state = canvasStore.getState();

      // Remove tracked pointer
      activePointers.current.delete(e.pointerId);

      // Release label drag
      if (labelDrag.current) {
        labelDrag.current = null;
        return;
      }

      // Finish crop drawing
      if (state.isCropping) {
        const bounds = state.finishCropDraw();
        if (bounds) {
          uiStore.getState().setCropBounds(bounds);
        }
        return;
      }

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

  const handleDoubleClick = useCallback(
    (e: MouseEvent) => {
      const mode = uiStore.getState().mode;
      if (mode !== 'area') return;
      const state = canvasStore.getState();
      if (state.areaPoints.length >= 3) {
        const result = state.finishArea();
        if (result) {
          const mStore = measurementStore.getState();
          result.name = `Area ${mStore.getAreaCount() + 1}`;
          mStore.addArea(result);
        }
      }
    },
    [canvasStore, uiStore, measurementStore]
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
    canvas.addEventListener('dblclick', handleDoubleClick);
    canvas.addEventListener('contextmenu', handleContextMenu);

    // Enable touch-action none for proper pointer events on touch
    canvas.style.touchAction = 'none';

    return () => {
      canvas.removeEventListener('pointerdown', handlePointerDown);
      canvas.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('pointerup', handlePointerUp);
      canvas.removeEventListener('pointercancel', handlePointerUp);
      canvas.removeEventListener('wheel', handleWheel);
      canvas.removeEventListener('dblclick', handleDoubleClick);
      canvas.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [overlayRef, handlePointerDown, handlePointerMove, handlePointerUp, handleWheel, handleDoubleClick, handleContextMenu]);
}
