import { describe, it, expect, beforeEach } from 'vitest';
import { useCanvasStore } from '../useCanvasStore';

beforeEach(() => {
  useCanvasStore.setState({
    image: null,
    imageFileName: null,
    transform: { panX: 0, panY: 0, zoom: 1 },
    isDrawing: false,
    drawStart: null,
    drawCurrent: null,
    isPanning: false,
    panAnchor: null,
    pinchStartDist: null,
    pinchStartZoom: null,
    snapPoint: null,
    angleStep: null,
    angleVertex: null,
    angleArmA: null,
    areaPoints: [],
    cropStart: null,
    cropCurrent: null,
    isCropping: false,
  });
});

describe('useCanvasStore', () => {
  describe('transform', () => {
    it('sets partial transform', () => {
      useCanvasStore.getState().setTransform({ zoom: 2 });
      expect(useCanvasStore.getState().transform).toEqual({ panX: 0, panY: 0, zoom: 2 });
    });

    it('merges with existing transform', () => {
      useCanvasStore.getState().setTransform({ panX: 50 });
      useCanvasStore.getState().setTransform({ panY: 30 });
      expect(useCanvasStore.getState().transform).toEqual({ panX: 50, panY: 30, zoom: 1 });
    });
  });

  describe('zoom', () => {
    it('zooms in at point', () => {
      useCanvasStore.getState().zoomAtPoint(400, 300, -100); // negative delta = zoom in
      const { transform } = useCanvasStore.getState();
      expect(transform.zoom).toBeGreaterThan(1);
    });

    it('zooms out at point', () => {
      useCanvasStore.getState().zoomAtPoint(400, 300, 100); // positive delta = zoom out
      const { transform } = useCanvasStore.getState();
      expect(transform.zoom).toBeLessThan(1);
    });

    it('clamps zoom to minimum', () => {
      for (let i = 0; i < 100; i++) {
        useCanvasStore.getState().zoomAtPoint(0, 0, 1000);
      }
      expect(useCanvasStore.getState().transform.zoom).toBeGreaterThanOrEqual(0.05);
    });

    it('clamps zoom to maximum', () => {
      for (let i = 0; i < 100; i++) {
        useCanvasStore.getState().zoomAtPoint(0, 0, -1000);
      }
      expect(useCanvasStore.getState().transform.zoom).toBeLessThanOrEqual(50);
    });

    it('zoomIn increases zoom', () => {
      useCanvasStore.getState().zoomIn();
      expect(useCanvasStore.getState().transform.zoom).toBeGreaterThan(1);
    });

    it('zoomOut decreases zoom', () => {
      useCanvasStore.getState().zoomOut();
      expect(useCanvasStore.getState().transform.zoom).toBeLessThan(1);
    });
  });

  describe('drawing', () => {
    it('starts drawing', () => {
      useCanvasStore.getState().startDrawing({ x: 10, y: 20 });
      const state = useCanvasStore.getState();
      expect(state.isDrawing).toBe(true);
      expect(state.drawStart).toEqual({ x: 10, y: 20 });
      expect(state.drawCurrent).toEqual({ x: 10, y: 20 });
    });

    it('finishes drawing with sufficient distance', () => {
      useCanvasStore.getState().startDrawing({ x: 0, y: 0 });
      useCanvasStore.setState({ drawCurrent: { x: 100, y: 0 } });
      const result = useCanvasStore.getState().finishDrawing();
      expect(result).not.toBeNull();
      expect(result!.start).toEqual({ x: 0, y: 0 });
      expect(result!.end).toEqual({ x: 100, y: 0 });
      expect(result!.pixelLength).toBeCloseTo(100);
      expect(useCanvasStore.getState().isDrawing).toBe(false);
    });

    it('returns null for too-short drawing', () => {
      useCanvasStore.getState().startDrawing({ x: 0, y: 0 });
      useCanvasStore.setState({ drawCurrent: { x: 1, y: 1 } });
      const result = useCanvasStore.getState().finishDrawing();
      expect(result).toBeNull();
    });

    it('cancels drawing', () => {
      useCanvasStore.getState().startDrawing({ x: 0, y: 0 });
      useCanvasStore.getState().cancelDrawing();
      expect(useCanvasStore.getState().isDrawing).toBe(false);
      expect(useCanvasStore.getState().drawStart).toBeNull();
    });
  });

  describe('panning', () => {
    it('starts and stops panning', () => {
      useCanvasStore.getState().startPanning({ x: 100, y: 100 });
      expect(useCanvasStore.getState().isPanning).toBe(true);
      useCanvasStore.getState().stopPanning();
      expect(useCanvasStore.getState().isPanning).toBe(false);
      expect(useCanvasStore.getState().panAnchor).toBeNull();
    });

    it('updates pan position', () => {
      useCanvasStore.getState().startPanning({ x: 100, y: 100 });
      useCanvasStore.getState().updatePanning({ x: 150, y: 120 });
      const { transform } = useCanvasStore.getState();
      expect(transform.panX).toBe(50);
      expect(transform.panY).toBe(20);
    });
  });

  describe('angle drawing', () => {
    it('starts angle mode', () => {
      useCanvasStore.getState().startAngle();
      expect(useCanvasStore.getState().angleStep).toBe('vertex');
    });

    it('places vertex, then armA, then armB returning result', () => {
      useCanvasStore.getState().startAngle();

      const r1 = useCanvasStore.getState().placeAnglePoint({ x: 0, y: 0 });
      expect(r1).toBeNull();
      expect(useCanvasStore.getState().angleStep).toBe('armA');

      const r2 = useCanvasStore.getState().placeAnglePoint({ x: 10, y: 0 });
      expect(r2).toBeNull();
      expect(useCanvasStore.getState().angleStep).toBe('armB');

      const r3 = useCanvasStore.getState().placeAnglePoint({ x: 0, y: 10 });
      expect(r3).not.toBeNull();
      expect(r3!.angleDeg).toBeCloseTo(90);
      expect(r3!.type).toBe('angle');
    });

    it('cancels angle drawing', () => {
      useCanvasStore.getState().startAngle();
      useCanvasStore.getState().placeAnglePoint({ x: 0, y: 0 });
      useCanvasStore.getState().cancelAngle();
      expect(useCanvasStore.getState().angleStep).toBeNull();
    });
  });

  describe('area drawing', () => {
    it('adds area points', () => {
      useCanvasStore.getState().addAreaPoint({ x: 0, y: 0 });
      useCanvasStore.getState().addAreaPoint({ x: 10, y: 0 });
      expect(useCanvasStore.getState().areaPoints).toHaveLength(2);
    });

    it('finishes area with 3+ points', () => {
      useCanvasStore.getState().addAreaPoint({ x: 0, y: 0 });
      useCanvasStore.getState().addAreaPoint({ x: 10, y: 0 });
      useCanvasStore.getState().addAreaPoint({ x: 10, y: 10 });
      const result = useCanvasStore.getState().finishArea();
      expect(result).not.toBeNull();
      expect(result!.type).toBe('area');
      expect(result!.pixelArea).toBeCloseTo(50);
      expect(useCanvasStore.getState().areaPoints).toHaveLength(0);
    });

    it('returns null for fewer than 3 points', () => {
      useCanvasStore.getState().addAreaPoint({ x: 0, y: 0 });
      useCanvasStore.getState().addAreaPoint({ x: 10, y: 0 });
      const result = useCanvasStore.getState().finishArea();
      expect(result).toBeNull();
    });

    it('cancels area drawing', () => {
      useCanvasStore.getState().addAreaPoint({ x: 0, y: 0 });
      useCanvasStore.getState().cancelArea();
      expect(useCanvasStore.getState().areaPoints).toHaveLength(0);
    });
  });

  describe('pinch zoom', () => {
    it('starts and stops pinch zoom', () => {
      useCanvasStore.getState().startPinchZoom(100);
      expect(useCanvasStore.getState().pinchStartDist).toBe(100);
      useCanvasStore.getState().stopPinchZoom();
      expect(useCanvasStore.getState().pinchStartDist).toBeNull();
    });
  });

  describe('crop drawing', () => {
    it('starts crop drawing', () => {
      useCanvasStore.getState().startCropDraw({ x: 10, y: 20 });
      expect(useCanvasStore.getState().isCropping).toBe(true);
      expect(useCanvasStore.getState().cropStart).toEqual({ x: 10, y: 20 });
    });

    it('updates crop position', () => {
      useCanvasStore.getState().startCropDraw({ x: 10, y: 20 });
      useCanvasStore.getState().updateCropDraw({ x: 100, y: 200 });
      expect(useCanvasStore.getState().cropCurrent).toEqual({ x: 100, y: 200 });
    });

    it('cancels crop drawing', () => {
      useCanvasStore.getState().startCropDraw({ x: 10, y: 20 });
      useCanvasStore.getState().cancelCropDraw();
      expect(useCanvasStore.getState().isCropping).toBe(false);
      expect(useCanvasStore.getState().cropStart).toBeNull();
    });
  });

  describe('snap point', () => {
    it('sets and clears snap point', () => {
      useCanvasStore.getState().setSnapPoint({ x: 50, y: 50 });
      expect(useCanvasStore.getState().snapPoint).toEqual({ x: 50, y: 50 });
      useCanvasStore.getState().setSnapPoint(null);
      expect(useCanvasStore.getState().snapPoint).toBeNull();
    });
  });
});
