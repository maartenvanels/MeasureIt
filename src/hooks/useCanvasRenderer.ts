'use client';

import { useEffect, RefObject } from 'react';
import { useCanvasStore } from '@/stores/useCanvasStore';
import { useMeasurementStore } from '@/stores/useMeasurementStore';
import { useUIStore } from '@/stores/useUIStore';
import { renderImage, renderOverlay, drawInProgressCrop, drawCropOverlay } from '@/lib/canvas-rendering';
import { calcRealDistance, calcRealArea } from '@/lib/calculations';
import { pixelDist } from '@/lib/geometry';
import { Measurement, AreaMeasurement, AnyMeasurement, LabelBounds, isAreaMode } from '@/types/measurement';

export function useCanvasRenderer(
  imageCanvasRef: RefObject<HTMLCanvasElement | null>,
  overlayCanvasRef: RefObject<HTMLCanvasElement | null>,
  containerRef: RefObject<HTMLDivElement | null>,
  labelBoundsRef?: RefObject<LabelBounds[]>
) {
  // Resize canvases
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const imgCanvas = imageCanvasRef.current;
      const overlayCanvas = overlayCanvasRef.current;

      for (const canvas of [imgCanvas, overlayCanvas]) {
        if (!canvas) continue;
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.scale(dpr, dpr);
      }
    };

    const observer = new ResizeObserver(resize);
    observer.observe(container);
    resize();

    return () => observer.disconnect();
  }, [containerRef, imageCanvasRef, overlayCanvasRef]);

  // Render loop
  useEffect(() => {
    let rafId: number | undefined;

    const render = () => {
      const imgCanvas = imageCanvasRef.current;
      const overlayCanvas = overlayCanvasRef.current;
      const container = containerRef.current;
      if (!imgCanvas || !overlayCanvas || !container) return;

      const imgCtx = imgCanvas.getContext('2d');
      const overlayCtx = overlayCanvas.getContext('2d');
      if (!imgCtx || !overlayCtx) return;

      const rect = container.getBoundingClientRect();
      const canvasW = rect.width;
      const canvasH = rect.height;

      const { image, transform, isDrawing, drawStart, drawCurrent, angleStep, angleVertex, angleArmA, areaPoints, snapPoint, isCropping, cropStart, cropCurrent, freehandPoints, isFreehandDrawing, circle3PtPoints, circleCenterPoint } =
        useCanvasStore.getState();
      const { measurements, referenceValue, referenceUnit } =
        useMeasurementStore.getState();
      const { selectedMeasurementId, mode, cropMode, cropBounds, gridEnabled, gridSpacing } = useUIStore.getState();

      // Render image
      if (image) {
        renderImage(imgCtx, image, transform, canvasW, canvasH);
      } else {
        imgCtx.clearRect(0, 0, canvasW, canvasH);
        imgCtx.fillStyle = '#09090b';
        imgCtx.fillRect(0, 0, canvasW, canvasH);
      }

      // Get label for a measurement
      const ref = measurements.find((m): m is Measurement => m.type === 'reference');
      const getLabel = (m: AnyMeasurement) => {
        if (m.type === 'annotation') {
          return '';
        }
        if (m.type === 'angle') {
          return `${m.angleDeg.toFixed(1)}\u00B0`;
        }
        if (m.type === 'area') {
          return calcRealArea(m.pixelArea, ref, referenceValue, referenceUnit, (m as AreaMeasurement).unitOverride) ?? `${m.pixelArea.toFixed(0)} px\u00B2`;
        }
        // Skip model-surface measurements in 2D canvas renderer
        if ((m as Measurement).surface === 'model') {
          return '';
        }
        if (m.type === 'reference') {
          return `${referenceValue} ${referenceUnit} (ref)`;
        }
        const meas = m as Measurement;
        return calcRealDistance(meas.pixelLength, ref, referenceValue, referenceUnit, meas.unitOverride) ??
          `${meas.pixelLength.toFixed(1)} px`;
      };

      // Draw state for in-progress line
      let drawState: Parameters<typeof renderOverlay>[7];
      if (isDrawing && drawStart && drawCurrent) {
        const pxDist = pixelDist(drawStart, drawCurrent);
        const realDist = calcRealDistance(pxDist, ref, referenceValue, referenceUnit);
        drawState = {
          start: drawStart,
          current: drawCurrent,
          mode,
          label: realDist ?? `${pxDist.toFixed(1)} px`,
        };
      }

      // Angle draw state for in-progress angle
      let angleDrawState: Parameters<typeof renderOverlay>[8];
      if (angleStep) {
        angleDrawState = {
          vertex: angleVertex,
          armA: angleArmA,
          cursorPos: drawCurrent,
        };
      }

      // Area draw state for in-progress polygon
      let areaDrawState: Parameters<typeof renderOverlay>[9];
      if ((mode === 'area' || mode === 'area-polygon') && areaPoints.length > 0) {
        areaDrawState = {
          points: areaPoints,
          cursorPos: drawCurrent,
        };
      }

      // Circle-3-point draw state
      let circle3PtDrawState: Parameters<typeof renderOverlay>[13];
      if (mode === 'area-circle-3pt' && circle3PtPoints.length > 0) {
        circle3PtDrawState = {
          points: circle3PtPoints,
          cursorPos: drawCurrent,
        };
      }

      // Circle-center draw state
      let circleCenterDrawState: Parameters<typeof renderOverlay>[14];
      if (mode === 'area-circle-center' && circleCenterPoint) {
        circleCenterDrawState = {
          center: circleCenterPoint,
          cursorPos: drawCurrent,
        };
      }

      // Freehand draw state
      let freehandDrawState: Parameters<typeof renderOverlay>[15];
      if (mode === 'area-freehand' && isFreehandDrawing && freehandPoints.length > 0) {
        freehandDrawState = {
          points: freehandPoints,
        };
      }

      // Render overlay
      renderOverlay(
        overlayCtx,
        canvasW,
        canvasH,
        measurements,
        selectedMeasurementId,
        transform,
        getLabel,
        drawState,
        angleDrawState,
        areaDrawState,
        snapPoint,
        labelBoundsRef?.current,
        { enabled: gridEnabled, spacing: gridSpacing, imageWidth: image?.width, imageHeight: image?.height },
        circle3PtDrawState,
        circleCenterDrawState,
        freehandDrawState
      );

      // Crop overlay (drawn on top of everything)
      if (cropMode) {
        if (cropBounds) {
          drawCropOverlay(overlayCtx, canvasW, canvasH, cropBounds, transform);
        } else if (isCropping && cropStart && cropCurrent) {
          drawInProgressCrop(overlayCtx, canvasW, canvasH, cropStart, cropCurrent, transform);
        }
      }
    };

    // Subscribe to all stores for changes
    const unsubs = [
      useCanvasStore.subscribe(render),
      useMeasurementStore.subscribe(render),
      useUIStore.subscribe(render),
    ];

    render();

    return () => {
      unsubs.forEach((u) => u());
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [imageCanvasRef, overlayCanvasRef, containerRef, labelBoundsRef]);
}
