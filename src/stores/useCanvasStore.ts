import { create } from 'zustand';
import { Point, ViewTransform, AngleMeasurement, AreaMeasurement } from '@/types/measurement';
import { pixelDist, snapToAxis, calcAngleDeg, calcPolygonArea } from '@/lib/geometry';

interface CanvasState {
  image: HTMLImageElement | null;
  imageFileName: string | null;
  transform: ViewTransform;
  isDrawing: boolean;
  drawStart: Point | null;
  drawCurrent: Point | null;
  isPanning: boolean;
  panAnchor: Point | null;

  // Pinch-to-zoom state
  pinchStartDist: number | null;
  pinchStartZoom: number | null;

  // Snap state
  snapPoint: Point | null;

  // Angle drawing state
  angleStep: 'vertex' | 'armA' | 'armB' | null;
  angleVertex: Point | null;
  angleArmA: Point | null;

  // Polygon drawing state
  areaPoints: Point[];

  setImage: (img: HTMLImageElement, fileName?: string) => void;
  setSnapPoint: (p: Point | null) => void;
  setTransform: (t: Partial<ViewTransform>) => void;
  fitImageToContainer: (containerWidth: number, containerHeight: number) => void;
  zoomAtPoint: (screenX: number, screenY: number, delta: number) => void;
  startDrawing: (imagePoint: Point) => void;
  updateDrawing: (imagePoint: Point, shiftKey: boolean) => void;
  finishDrawing: () => { start: Point; end: Point; pixelLength: number } | null;
  cancelDrawing: () => void;
  startPanning: (screenPoint: Point) => void;
  updatePanning: (screenPoint: Point) => void;
  stopPanning: () => void;

  // Pinch-to-zoom actions
  startPinchZoom: (dist: number) => void;
  updatePinchZoom: (dist: number, centerX: number, centerY: number) => void;
  stopPinchZoom: () => void;

  // Zoom controls
  zoomIn: () => void;
  zoomOut: () => void;

  // Angle drawing actions
  startAngle: () => void;
  placeAnglePoint: (pt: Point) => AngleMeasurement | null;
  cancelAngle: () => void;

  // Area drawing actions
  addAreaPoint: (pt: Point) => void;
  finishArea: () => AreaMeasurement | null;
  cancelArea: () => void;

  // Crop drawing state + actions
  cropStart: Point | null;
  cropCurrent: Point | null;
  isCropping: boolean;
  startCropDraw: (pt: Point) => void;
  updateCropDraw: (pt: Point) => void;
  finishCropDraw: () => { x: number; y: number; w: number; h: number } | null;
  cancelCropDraw: () => void;
  applyCrop: (bounds: { x: number; y: number; w: number; h: number }) => void;
}

export const useCanvasStore = create<CanvasState>((set, get) => ({
  image: null,
  imageFileName: null,
  transform: { panX: 0, panY: 0, zoom: 1 },
  isDrawing: false,
  drawStart: null,
  drawCurrent: null,
  isPanning: false,
  panAnchor: null,

  // Pinch-to-zoom
  pinchStartDist: null,
  pinchStartZoom: null,

  // Snap
  snapPoint: null,

  // Angle drawing
  angleStep: null,
  angleVertex: null,
  angleArmA: null,

  // Polygon drawing
  areaPoints: [],

  // Crop drawing
  cropStart: null,
  cropCurrent: null,
  isCropping: false,

  setImage: (img, fileName) => set({ image: img, imageFileName: fileName ?? null }),
  setSnapPoint: (p) => set({ snapPoint: p }),

  setTransform: (t) =>
    set({ transform: { ...get().transform, ...t } }),

  fitImageToContainer: (containerWidth, containerHeight) => {
    const { image } = get();
    if (!image) return;
    const scaleX = containerWidth / image.width;
    const scaleY = containerHeight / image.height;
    const zoom = Math.min(scaleX, scaleY) * 0.9;
    set({
      transform: {
        panX: (containerWidth - image.width * zoom) / 2,
        panY: (containerHeight - image.height * zoom) / 2,
        zoom,
      },
    });
  },

  zoomAtPoint: (screenX, screenY, delta) => {
    const { transform } = get();
    const zoomFactor = delta < 0 ? 1.1 : 0.9;
    const newZoom = Math.max(0.05, Math.min(transform.zoom * zoomFactor, 50));
    set({
      transform: {
        panX: screenX - (screenX - transform.panX) * (newZoom / transform.zoom),
        panY: screenY - (screenY - transform.panY) * (newZoom / transform.zoom),
        zoom: newZoom,
      },
    });
  },

  startDrawing: (imagePoint) =>
    set({ isDrawing: true, drawStart: imagePoint, drawCurrent: imagePoint }),

  updateDrawing: (imagePoint, shiftKey) => {
    const { drawStart } = get();
    if (!drawStart) return;
    const snapped = shiftKey ? snapToAxis(drawStart, imagePoint) : imagePoint;
    set({ drawCurrent: snapped });
  },

  finishDrawing: () => {
    const { drawStart, drawCurrent } = get();
    if (!drawStart || !drawCurrent) {
      set({ isDrawing: false, drawStart: null, drawCurrent: null });
      return null;
    }
    const dist = pixelDist(drawStart, drawCurrent);
    set({ isDrawing: false, drawStart: null, drawCurrent: null });
    if (dist <= 3) return null;
    return { start: drawStart, end: drawCurrent, pixelLength: dist };
  },

  cancelDrawing: () =>
    set({ isDrawing: false, drawStart: null, drawCurrent: null }),

  startPanning: (screenPoint) => {
    const { transform } = get();
    set({
      isPanning: true,
      panAnchor: {
        x: screenPoint.x - transform.panX,
        y: screenPoint.y - transform.panY,
      },
    });
  },

  updatePanning: (screenPoint) => {
    const { panAnchor, transform } = get();
    if (!panAnchor) return;
    set({
      transform: {
        ...transform,
        panX: screenPoint.x - panAnchor.x,
        panY: screenPoint.y - panAnchor.y,
      },
    });
  },

  stopPanning: () => set({ isPanning: false, panAnchor: null }),

  // Pinch-to-zoom
  startPinchZoom: (dist) => {
    const { transform } = get();
    set({ pinchStartDist: dist, pinchStartZoom: transform.zoom });
  },

  updatePinchZoom: (dist, centerX, centerY) => {
    const { pinchStartDist, pinchStartZoom, transform } = get();
    if (pinchStartDist === null || pinchStartZoom === null) return;
    const ratio = dist / pinchStartDist;
    const newZoom = Math.max(0.05, Math.min(pinchStartZoom * ratio, 50));
    set({
      transform: {
        panX: centerX - (centerX - transform.panX) * (newZoom / transform.zoom),
        panY: centerY - (centerY - transform.panY) * (newZoom / transform.zoom),
        zoom: newZoom,
      },
    });
  },

  stopPinchZoom: () => set({ pinchStartDist: null, pinchStartZoom: null }),

  // Zoom controls (zoom toward center of canvas)
  zoomIn: () => {
    const { transform } = get();
    const newZoom = Math.min(transform.zoom * 1.3, 50);
    set({ transform: { ...transform, zoom: newZoom } });
  },
  zoomOut: () => {
    const { transform } = get();
    const newZoom = Math.max(transform.zoom / 1.3, 0.05);
    set({ transform: { ...transform, zoom: newZoom } });
  },

  // Angle drawing
  startAngle: () => set({ angleStep: 'vertex', angleVertex: null, angleArmA: null }),

  placeAnglePoint: (pt) => {
    const { angleStep, angleVertex, angleArmA } = get();
    if (angleStep === 'vertex') {
      set({ angleVertex: pt, angleStep: 'armA' });
      return null;
    }
    if (angleStep === 'armA') {
      set({ angleArmA: pt, angleStep: 'armB' });
      return null;
    }
    if (angleStep === 'armB' && angleVertex && angleArmA) {
      const angleDeg = calcAngleDeg(angleVertex, angleArmA, pt);
      const result: AngleMeasurement = {
        id: crypto.randomUUID(),
        type: 'angle',
        vertex: angleVertex,
        armA: angleArmA,
        armB: pt,
        angleDeg,
        name: '',
        createdAt: Date.now(),
      };
      set({ angleStep: null, angleVertex: null, angleArmA: null });
      return result;
    }
    return null;
  },

  cancelAngle: () => set({ angleStep: null, angleVertex: null, angleArmA: null }),

  // Area drawing
  addAreaPoint: (pt) => {
    set({ areaPoints: [...get().areaPoints, pt] });
  },
  finishArea: () => {
    const { areaPoints } = get();
    if (areaPoints.length < 3) {
      set({ areaPoints: [] });
      return null;
    }
    const pixelArea = calcPolygonArea(areaPoints);
    const result: AreaMeasurement = {
      id: crypto.randomUUID(),
      type: 'area',
      points: [...areaPoints],
      pixelArea,
      name: '',
      createdAt: Date.now(),
    };
    set({ areaPoints: [] });
    return result;
  },
  cancelArea: () => set({ areaPoints: [] }),

  // Crop drawing
  startCropDraw: (pt) => set({ isCropping: true, cropStart: pt, cropCurrent: pt }),
  updateCropDraw: (pt) => set({ cropCurrent: pt }),
  finishCropDraw: () => {
    const { cropStart, cropCurrent, image } = get();
    set({ isCropping: false, cropStart: null, cropCurrent: null });
    if (!cropStart || !cropCurrent || !image) return null;

    const x = Math.max(0, Math.min(cropStart.x, cropCurrent.x));
    const y = Math.max(0, Math.min(cropStart.y, cropCurrent.y));
    const x2 = Math.min(image.width, Math.max(cropStart.x, cropCurrent.x));
    const y2 = Math.min(image.height, Math.max(cropStart.y, cropCurrent.y));
    const w = x2 - x;
    const h = y2 - y;

    if (w < 10 || h < 10) return null;
    return { x, y, w, h };
  },
  cancelCropDraw: () => set({ isCropping: false, cropStart: null, cropCurrent: null }),
  applyCrop: (bounds) => {
    const { image } = get();
    if (!image) return;

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = bounds.w;
    tempCanvas.height = bounds.h;
    const ctx = tempCanvas.getContext('2d')!;
    ctx.drawImage(image, bounds.x, bounds.y, bounds.w, bounds.h, 0, 0, bounds.w, bounds.h);

    const newImg = new window.Image();
    newImg.onload = () => {
      set({ image: newImg });
    };
    newImg.src = tempCanvas.toDataURL('image/png');
  },
}));
