import { create } from 'zustand';
import { Point, ViewTransform, AngleMeasurement } from '@/types/measurement';
import { pixelDist, snapToAxis, calcAngleDeg } from '@/lib/geometry';

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
}));
