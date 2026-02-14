'use client';

import { useEffect, RefObject } from 'react';
import { useCanvasStore } from '@/stores/useCanvasStore';
import { useMeasurementStore } from '@/stores/useMeasurementStore';
import { useUIStore } from '@/stores/useUIStore';
import { renderImage, renderOverlay } from '@/lib/canvas-rendering';
import { calcRealDistance, calcRealArea } from '@/lib/calculations';
import { pixelDist } from '@/lib/geometry';
import { Measurement, AnyMeasurement } from '@/types/measurement';

export function useCanvasRenderer(
  imageCanvasRef: RefObject<HTMLCanvasElement | null>,
  overlayCanvasRef: RefObject<HTMLCanvasElement | null>,
  containerRef: RefObject<HTMLDivElement | null>
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

      const { image, transform, isDrawing, drawStart, drawCurrent, angleStep, angleVertex, angleArmA, areaPoints, snapPoint } =
        useCanvasStore.getState();
      const { measurements, referenceValue, referenceUnit } =
        useMeasurementStore.getState();
      const { selectedMeasurementId, mode } = useUIStore.getState();

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
        if (m.type === 'angle') {
          return `${m.angleDeg.toFixed(1)}\u00B0`;
        }
        if (m.type === 'area') {
          return calcRealArea(m.pixelArea, ref, referenceValue, referenceUnit) ?? `${m.pixelArea.toFixed(0)} px\u00B2`;
        }
        if (m.type === 'reference') {
          return `${referenceValue} ${referenceUnit} (ref)`;
        }
        return calcRealDistance(m.pixelLength, ref, referenceValue, referenceUnit) ??
          `${m.pixelLength.toFixed(1)} px`;
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
      if (mode === 'area' && areaPoints.length > 0) {
        areaDrawState = {
          points: areaPoints,
          cursorPos: drawCurrent,
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
        snapPoint
      );
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
  }, [imageCanvasRef, overlayCanvasRef, containerRef]);
}
