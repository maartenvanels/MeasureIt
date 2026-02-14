import { describe, it, expect } from 'vitest';
import {
  pixelDist,
  screenToImage,
  imageToScreen,
  snapToAxis,
  lineAngle,
  calcAngleDeg,
  getAllEndpoints,
  findSnapPoint,
  calcPolygonArea,
} from '../geometry';
import { Point, ViewTransform, Measurement, AngleMeasurement, AreaMeasurement, Annotation } from '@/types/measurement';

describe('pixelDist', () => {
  it('returns 0 for same point', () => {
    expect(pixelDist({ x: 5, y: 5 }, { x: 5, y: 5 })).toBe(0);
  });

  it('calculates horizontal distance', () => {
    expect(pixelDist({ x: 0, y: 0 }, { x: 3, y: 0 })).toBe(3);
  });

  it('calculates vertical distance', () => {
    expect(pixelDist({ x: 0, y: 0 }, { x: 0, y: 4 })).toBe(4);
  });

  it('calculates diagonal distance (3-4-5 triangle)', () => {
    expect(pixelDist({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
  });

  it('works with negative coordinates', () => {
    expect(pixelDist({ x: -1, y: -1 }, { x: 2, y: 3 })).toBe(5);
  });
});

describe('screenToImage', () => {
  it('converts with identity transform', () => {
    const transform: ViewTransform = { panX: 0, panY: 0, zoom: 1 };
    const pt = screenToImage(100, 200, transform);
    expect(pt).toEqual({ x: 100, y: 200 });
  });

  it('accounts for pan offset', () => {
    const transform: ViewTransform = { panX: 50, panY: 30, zoom: 1 };
    const pt = screenToImage(100, 200, transform);
    expect(pt).toEqual({ x: 50, y: 170 });
  });

  it('accounts for zoom', () => {
    const transform: ViewTransform = { panX: 0, panY: 0, zoom: 2 };
    const pt = screenToImage(100, 200, transform);
    expect(pt).toEqual({ x: 50, y: 100 });
  });

  it('accounts for pan and zoom', () => {
    const transform: ViewTransform = { panX: 20, panY: 10, zoom: 2 };
    const pt = screenToImage(100, 200, transform);
    expect(pt).toEqual({ x: 40, y: 95 });
  });
});

describe('imageToScreen', () => {
  it('converts with identity transform', () => {
    const transform: ViewTransform = { panX: 0, panY: 0, zoom: 1 };
    const pt = imageToScreen(100, 200, transform);
    expect(pt).toEqual({ x: 100, y: 200 });
  });

  it('accounts for pan offset', () => {
    const transform: ViewTransform = { panX: 50, panY: 30, zoom: 1 };
    const pt = imageToScreen(100, 200, transform);
    expect(pt).toEqual({ x: 150, y: 230 });
  });

  it('accounts for zoom', () => {
    const transform: ViewTransform = { panX: 0, panY: 0, zoom: 2 };
    const pt = imageToScreen(100, 200, transform);
    expect(pt).toEqual({ x: 200, y: 400 });
  });

  it('is the inverse of screenToImage', () => {
    const transform: ViewTransform = { panX: 35, panY: -12, zoom: 1.5 };
    const original = { x: 80, y: 120 };
    const screen = imageToScreen(original.x, original.y, transform);
    const back = screenToImage(screen.x, screen.y, transform);
    expect(back.x).toBeCloseTo(original.x);
    expect(back.y).toBeCloseTo(original.y);
  });
});

describe('snapToAxis', () => {
  it('snaps to horizontal when dx > dy', () => {
    const result = snapToAxis({ x: 0, y: 0 }, { x: 10, y: 3 });
    expect(result).toEqual({ x: 10, y: 0 });
  });

  it('snaps to vertical when dy > dx', () => {
    const result = snapToAxis({ x: 0, y: 0 }, { x: 3, y: 10 });
    expect(result).toEqual({ x: 0, y: 10 });
  });

  it('snaps to vertical when dx === dy', () => {
    const result = snapToAxis({ x: 0, y: 0 }, { x: 5, y: 5 });
    expect(result).toEqual({ x: 0, y: 5 });
  });

  it('handles negative directions', () => {
    const result = snapToAxis({ x: 10, y: 10 }, { x: 2, y: 9 });
    expect(result).toEqual({ x: 2, y: 10 }); // dx=8 > dy=1
  });
});

describe('lineAngle', () => {
  it('returns 0 for horizontal right', () => {
    expect(lineAngle({ x: 0, y: 0 }, { x: 10, y: 0 })).toBe(0);
  });

  it('returns PI/2 for vertical down', () => {
    expect(lineAngle({ x: 0, y: 0 }, { x: 0, y: 10 })).toBeCloseTo(Math.PI / 2);
  });

  it('returns PI for horizontal left', () => {
    expect(lineAngle({ x: 0, y: 0 }, { x: -10, y: 0 })).toBeCloseTo(Math.PI);
  });

  it('returns -PI/2 for vertical up', () => {
    expect(lineAngle({ x: 0, y: 0 }, { x: 0, y: -10 })).toBeCloseTo(-Math.PI / 2);
  });
});

describe('calcAngleDeg', () => {
  it('calculates 90 degrees for perpendicular arms', () => {
    const vertex = { x: 0, y: 0 };
    const armA = { x: 10, y: 0 };
    const armB = { x: 0, y: 10 };
    expect(calcAngleDeg(vertex, armA, armB)).toBeCloseTo(90);
  });

  it('calculates 180 degrees for opposite arms', () => {
    const vertex = { x: 0, y: 0 };
    const armA = { x: 10, y: 0 };
    const armB = { x: -10, y: 0 };
    expect(calcAngleDeg(vertex, armA, armB)).toBeCloseTo(180);
  });

  it('calculates 45 degrees', () => {
    const vertex = { x: 0, y: 0 };
    const armA = { x: 10, y: 0 };
    const armB = { x: 10, y: 10 };
    expect(calcAngleDeg(vertex, armA, armB)).toBeCloseTo(45);
  });

  it('calculates 60 degrees', () => {
    const vertex = { x: 0, y: 0 };
    const armA = { x: 10, y: 0 };
    const armB = { x: 5, y: 5 * Math.sqrt(3) };
    expect(calcAngleDeg(vertex, armA, armB)).toBeCloseTo(60);
  });

  it('returns 0 when an arm has zero length', () => {
    const vertex = { x: 5, y: 5 };
    expect(calcAngleDeg(vertex, vertex, { x: 10, y: 5 })).toBe(0);
  });
});

describe('getAllEndpoints', () => {
  it('returns empty for no measurements', () => {
    expect(getAllEndpoints([])).toEqual([]);
  });

  it('extracts start/end from line measurements', () => {
    const m: Measurement = {
      id: '1', type: 'measure',
      start: { x: 0, y: 0 }, end: { x: 10, y: 10 },
      pixelLength: 14.14, name: 'M1', createdAt: 0,
    };
    const pts = getAllEndpoints([m]);
    expect(pts).toHaveLength(2);
    expect(pts[0]).toEqual({ x: 0, y: 0 });
    expect(pts[1]).toEqual({ x: 10, y: 10 });
  });

  it('extracts vertex and arms from angle measurements', () => {
    const a: AngleMeasurement = {
      id: '2', type: 'angle',
      vertex: { x: 0, y: 0 }, armA: { x: 5, y: 0 }, armB: { x: 0, y: 5 },
      angleDeg: 90, name: 'A1', createdAt: 0,
    };
    const pts = getAllEndpoints([a]);
    expect(pts).toHaveLength(3);
  });

  it('extracts points from area measurements', () => {
    const area: AreaMeasurement = {
      id: '3', type: 'area',
      points: [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }],
      pixelArea: 50, name: 'P1', createdAt: 0,
    };
    const pts = getAllEndpoints([area]);
    expect(pts).toHaveLength(3);
  });

  it('extracts position from annotations', () => {
    const ann: Annotation = {
      id: '4', type: 'annotation',
      position: { x: 5, y: 5 }, content: 'Hello', createdAt: 0,
    };
    const pts = getAllEndpoints([ann]);
    expect(pts).toHaveLength(1);
    expect(pts[0]).toEqual({ x: 5, y: 5 });
  });

  it('combines all measurement types', () => {
    const m: Measurement = {
      id: '1', type: 'measure',
      start: { x: 0, y: 0 }, end: { x: 10, y: 10 },
      pixelLength: 14.14, name: 'M1', createdAt: 0,
    };
    const a: AngleMeasurement = {
      id: '2', type: 'angle',
      vertex: { x: 0, y: 0 }, armA: { x: 5, y: 0 }, armB: { x: 0, y: 5 },
      angleDeg: 90, name: 'A1', createdAt: 0,
    };
    const pts = getAllEndpoints([m, a]);
    expect(pts).toHaveLength(5); // 2 from line + 3 from angle
  });
});

describe('findSnapPoint', () => {
  const transform: ViewTransform = { panX: 0, panY: 0, zoom: 1 };
  const m: Measurement = {
    id: '1', type: 'measure',
    start: { x: 100, y: 100 }, end: { x: 200, y: 200 },
    pixelLength: 141.42, name: 'M1', createdAt: 0,
  };

  it('returns null when no measurements', () => {
    expect(findSnapPoint({ x: 50, y: 50 }, [], transform)).toBeNull();
  });

  it('returns null when point is far from endpoints', () => {
    expect(findSnapPoint({ x: 50, y: 50 }, [m], transform)).toBeNull();
  });

  it('snaps to a nearby endpoint', () => {
    const result = findSnapPoint({ x: 103, y: 103 }, [m], transform);
    expect(result).toEqual({ x: 100, y: 100 });
  });

  it('snaps to the nearest of multiple endpoints', () => {
    const result = findSnapPoint({ x: 198, y: 198 }, [m], transform);
    expect(result).toEqual({ x: 200, y: 200 });
  });

  it('respects custom threshold', () => {
    // Within default (12) but outside custom threshold (2)
    const result = findSnapPoint({ x: 105, y: 105 }, [m], transform, 2);
    expect(result).toBeNull();
  });
});

describe('calcPolygonArea', () => {
  it('returns 0 for fewer than 3 points', () => {
    expect(calcPolygonArea([])).toBe(0);
    expect(calcPolygonArea([{ x: 0, y: 0 }])).toBe(0);
    expect(calcPolygonArea([{ x: 0, y: 0 }, { x: 1, y: 0 }])).toBe(0);
  });

  it('calculates area of a unit square', () => {
    const square = [
      { x: 0, y: 0 }, { x: 1, y: 0 },
      { x: 1, y: 1 }, { x: 0, y: 1 },
    ];
    expect(calcPolygonArea(square)).toBeCloseTo(1);
  });

  it('calculates area of a right triangle', () => {
    const triangle = [
      { x: 0, y: 0 }, { x: 10, y: 0 }, { x: 0, y: 10 },
    ];
    expect(calcPolygonArea(triangle)).toBeCloseTo(50);
  });

  it('calculates area of a 10x20 rectangle', () => {
    const rect = [
      { x: 0, y: 0 }, { x: 10, y: 0 },
      { x: 10, y: 20 }, { x: 0, y: 20 },
    ];
    expect(calcPolygonArea(rect)).toBeCloseTo(200);
  });

  it('handles counter-clockwise winding', () => {
    const ccw = [
      { x: 0, y: 0 }, { x: 0, y: 1 },
      { x: 1, y: 1 }, { x: 1, y: 0 },
    ];
    expect(calcPolygonArea(ccw)).toBeCloseTo(1);
  });
});
