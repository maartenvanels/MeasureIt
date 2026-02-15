'use client';

import { useCallback, useEffect, useRef, RefObject } from 'react';
import { useCanvasStore } from '@/stores/useCanvasStore';
import { useUIStore } from '@/stores/useUIStore';
import { useMeasurementStore } from '@/stores/useMeasurementStore';
import { screenToImage, findSnapPoint, snapToAxis, imageToScreen, snapToGrid, pixelDist } from '@/lib/geometry';
import { Annotation, Measurement, LabelBounds } from '@/types/measurement';

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

  // Arrow target drag state
  const arrowTargetDrag = useRef<{
    annotationId: string;
    startX: number;
    startY: number;
    origTarget: { x: number; y: number };
  } | null>(null);

  // Endpoint drag state (for adjusting reference/measure line endpoints)
  const endpointDrag = useRef<{
    measurementId: string;
    endpoint: 'start' | 'end';
    startX: number;
    startY: number;
    origPoint: { x: number; y: number };
    otherPoint: { x: number; y: number };
  } | null>(null);

  /** Get image point with snap-to-point and grid snap applied */
  const getSnappedPoint = (mx: number, my: number, excludeId?: string) => {
    const state = canvasStore.getState();
    const imgPt = screenToImage(mx, my, state.transform);
    const measurements = measurementStore.getState().measurements;

    // Priority 1: snap to existing endpoints
    const snap = findSnapPoint(imgPt, measurements, state.transform, 12, excludeId);
    if (snap) {
      state.setSnapPoint(snap);
      return snap;
    }

    // Priority 2: snap to grid
    const { gridEnabled, gridSpacing } = uiStore.getState();
    if (gridEnabled) {
      const gridPt = snapToGrid(imgPt, gridSpacing);
      const gridScreen = imageToScreen(gridPt.x, gridPt.y, state.transform);
      const mouseScreen = imageToScreen(imgPt.x, imgPt.y, state.transform);
      if (pixelDist(gridScreen, mouseScreen) < 12) {
        state.setSnapPoint(gridPt);
        return gridPt;
      }
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

      // Arrow draw mode: place arrowTarget for annotation
      const arrowAnnotationId = uiStore.getState().arrowDrawAnnotationId;
      if (e.button === 0 && arrowAnnotationId) {
        const imgPt = getSnappedPoint(mx, my);
        measurementStore.getState().updateMeasurement(arrowAnnotationId, { arrowTarget: imgPt });
        uiStore.getState().cancelArrowDraw();
        canvas.setPointerCapture(e.pointerId);
        e.preventDefault();
        return;
      }

      // Arrow target drag: check if clicking near an arrow target point (in navigate mode)
      if (e.button === 0 && mode === 'none') {
        const transform = canvasStore.getState().transform;
        const annotations = measurementStore.getState().measurements.filter(
          (m): m is Annotation => m.type === 'annotation' && !!m.arrowTarget
        );
        for (const ann of annotations) {
          const target = ann.arrowTarget!;
          const screenPt = imageToScreen(target.x, target.y, transform);
          const dist = pointerDist({ x: mx, y: my }, screenPt);
          if (dist < 12) {
            arrowTargetDrag.current = {
              annotationId: ann.id,
              startX: mx,
              startY: my,
              origTarget: { ...target },
            };
            canvas.setPointerCapture(e.pointerId);
            e.preventDefault();
            return;
          }
        }
      }

      // Endpoint drag: check if clicking near start/end of reference/measure lines
      if (e.button === 0 && mode === 'none') {
        const transform = canvasStore.getState().transform;
        const lines = measurementStore.getState().measurements.filter(
          (m): m is Measurement => m.type === 'reference' || m.type === 'measure'
        );
        for (const line of lines) {
          for (const ep of ['start', 'end'] as const) {
            const pt = line[ep];
            const screenPt = imageToScreen(pt.x, pt.y, transform);
            if (pointerDist({ x: mx, y: my }, screenPt) < 12) {
              const other = ep === 'start' ? line.end : line.start;
              endpointDrag.current = {
                measurementId: line.id,
                endpoint: ep,
                startX: mx,
                startY: my,
                origPoint: { ...pt },
                otherPoint: { ...other },
              };
              canvas.setPointerCapture(e.pointerId);
              e.preventDefault();
              return;
            }
          }
        }
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

      // Arrow target drag in progress
      if (arrowTargetDrag.current) {
        const drag = arrowTargetDrag.current;
        const transform = canvasStore.getState().transform;
        const dx = (mx - drag.startX) / transform.zoom;
        const dy = (my - drag.startY) / transform.zoom;
        let newTarget = { x: drag.origTarget.x + dx, y: drag.origTarget.y + dy };
        const measurements = measurementStore.getState().measurements;
        const snap = findSnapPoint(newTarget, measurements, transform, 12, drag.annotationId);
        if (snap) {
          newTarget = snap;
          canvasStore.getState().setSnapPoint(snap);
        } else {
          const { gridEnabled, gridSpacing } = uiStore.getState();
          if (gridEnabled) {
            const gridPt = snapToGrid(newTarget, gridSpacing);
            const gs = imageToScreen(gridPt.x, gridPt.y, transform);
            const rs = imageToScreen(newTarget.x, newTarget.y, transform);
            if (pixelDist(gs, rs) < 12) {
              newTarget = gridPt;
              canvasStore.getState().setSnapPoint(gridPt);
            } else {
              canvasStore.getState().setSnapPoint(null);
            }
          } else {
            canvasStore.getState().setSnapPoint(null);
          }
        }
        measurementStore.getState().updateMeasurement(drag.annotationId, { arrowTarget: newTarget });
        return;
      }

      // Endpoint drag in progress
      if (endpointDrag.current) {
        const drag = endpointDrag.current;
        const transform = canvasStore.getState().transform;
        const dx = (mx - drag.startX) / transform.zoom;
        const dy = (my - drag.startY) / transform.zoom;
        let newPoint = { x: drag.origPoint.x + dx, y: drag.origPoint.y + dy };
        const measurements = measurementStore.getState().measurements;
        const snap = findSnapPoint(newPoint, measurements, transform, 12, drag.measurementId);
        if (snap) {
          newPoint = snap;
          canvasStore.getState().setSnapPoint(snap);
        } else {
          const { gridEnabled, gridSpacing } = uiStore.getState();
          if (gridEnabled) {
            const gridPt = snapToGrid(newPoint, gridSpacing);
            const gs = imageToScreen(gridPt.x, gridPt.y, transform);
            const rs = imageToScreen(newPoint.x, newPoint.y, transform);
            if (pixelDist(gs, rs) < 12) {
              newPoint = gridPt;
              canvasStore.getState().setSnapPoint(gridPt);
            } else {
              canvasStore.getState().setSnapPoint(null);
            }
          } else {
            canvasStore.getState().setSnapPoint(null);
          }
        }
        const other = drag.otherPoint;
        const pixelLength = Math.sqrt((newPoint.x - other.x) ** 2 + (newPoint.y - other.y) ** 2);
        measurementStore.getState().updateMeasurement(drag.measurementId, {
          [drag.endpoint]: newPoint,
          pixelLength,
        });
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

      // Label / arrow-target / endpoint hover cursor (in navigate mode)
      if (mode === 'none' && !uiStore.getState().cropMode) {
        let overInteractive = false;
        const transform = canvasStore.getState().transform;
        // Check measurement endpoints
        if (!overInteractive) {
          const lines = measurementStore.getState().measurements.filter(
            (m): m is Measurement => m.type === 'reference' || m.type === 'measure'
          );
          for (const line of lines) {
            for (const ep of [line.start, line.end]) {
              const screenPt = imageToScreen(ep.x, ep.y, transform);
              if (pointerDist({ x: mx, y: my }, screenPt) < 12) {
                overInteractive = true;
                break;
              }
            }
            if (overInteractive) break;
          }
        }
        // Check arrow target points
        if (!overInteractive) {
          const annotations = measurementStore.getState().measurements.filter(
            (m): m is Annotation => m.type === 'annotation' && !!m.arrowTarget
          );
          for (const ann of annotations) {
            const screenPt = imageToScreen(ann.arrowTarget!.x, ann.arrowTarget!.y, transform);
            if (pointerDist({ x: mx, y: my }, screenPt) < 12) {
              overInteractive = true;
              break;
            }
          }
        }
        // Check label bounds
        if (!overInteractive && labelBoundsRef?.current) {
          for (const lb of labelBoundsRef.current) {
            if (mx >= lb.x && mx <= lb.x + lb.w && my >= lb.y && my <= lb.y + lb.h) {
              overInteractive = true;
              break;
            }
          }
        }
        canvas.style.cursor = overInteractive ? 'move' : '';
      }

      // Arrow draw mode cursor
      if (uiStore.getState().arrowDrawAnnotationId) {
        canvas.style.cursor = 'crosshair';
      }

      // Check snap for visual feedback when in a drawing mode
      if (mode !== 'none' || uiStore.getState().arrowDrawAnnotationId) {
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

      // Release arrow target drag
      if (arrowTargetDrag.current) {
        arrowTargetDrag.current = null;
        canvasStore.getState().setSnapPoint(null);
        return;
      }

      // Release endpoint drag
      if (endpointDrag.current) {
        endpointDrag.current = null;
        canvasStore.getState().setSnapPoint(null);
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
