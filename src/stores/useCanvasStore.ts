import { create } from 'zustand';
import { Point, ViewTransform } from '@/types/measurement';
import { pixelDist, snapToAxis } from '@/lib/geometry';

interface CanvasState {
  image: HTMLImageElement | null;
  imageFileName: string | null;
  transform: ViewTransform;
  isDrawing: boolean;
  drawStart: Point | null;
  drawCurrent: Point | null;
  isPanning: boolean;
  panAnchor: Point | null;

  setImage: (img: HTMLImageElement, fileName?: string) => void;
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

  setImage: (img, fileName) => set({ image: img, imageFileName: fileName ?? null }),

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
}));
