import { Point, ViewTransform, AnyMeasurement } from '@/types/measurement';

export function pixelDist(a: Point, b: Point): number {
  return Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2);
}

export function screenToImage(screenX: number, screenY: number, transform: ViewTransform): Point {
  return {
    x: (screenX - transform.panX) / transform.zoom,
    y: (screenY - transform.panY) / transform.zoom,
  };
}

export function imageToScreen(imageX: number, imageY: number, transform: ViewTransform): Point {
  return {
    x: imageX * transform.zoom + transform.panX,
    y: imageY * transform.zoom + transform.panY,
  };
}

export function snapToAxis(start: Point, current: Point): Point {
  const dx = Math.abs(current.x - start.x);
  const dy = Math.abs(current.y - start.y);
  if (dx > dy) {
    return { x: current.x, y: start.y };
  }
  return { x: start.x, y: current.y };
}

export function lineAngle(a: Point, b: Point): number {
  return Math.atan2(b.y - a.y, b.x - a.x);
}

export function calcAngleDeg(vertex: Point, armA: Point, armB: Point): number {
  const ax = armA.x - vertex.x;
  const ay = armA.y - vertex.y;
  const bx = armB.x - vertex.x;
  const by = armB.y - vertex.y;
  const dot = ax * bx + ay * by;
  const magA = Math.sqrt(ax * ax + ay * ay);
  const magB = Math.sqrt(bx * bx + by * by);
  if (magA === 0 || magB === 0) return 0;
  const cosAngle = Math.max(-1, Math.min(1, dot / (magA * magB)));
  return (Math.acos(cosAngle) * 180) / Math.PI;
}

/** Collect all unique endpoints from all measurements (in image space) */
export function getAllEndpoints(measurements: AnyMeasurement[]): Point[] {
  const points: Point[] = [];
  for (const m of measurements) {
    if (m.type === 'area') {
      points.push(...m.points);
    } else if (m.type === 'angle') {
      points.push(m.vertex, m.armA, m.armB);
    } else if (m.type === 'annotation') {
      points.push(m.position);
    } else {
      points.push(m.start, m.end);
    }
  }
  return points;
}

/**
 * Find the nearest snap point within a screen-space threshold.
 * Returns the image-space point if found, or null.
 */
export function findSnapPoint(
  imgPoint: Point,
  measurements: AnyMeasurement[],
  transform: ViewTransform,
  screenThreshold = 12
): Point | null {
  const endpoints = getAllEndpoints(measurements);
  const screenPt = imageToScreen(imgPoint.x, imgPoint.y, transform);

  let nearest: Point | null = null;
  let nearestDist = Infinity;

  for (const ep of endpoints) {
    const epScreen = imageToScreen(ep.x, ep.y, transform);
    const d = pixelDist(screenPt, epScreen);
    if (d < screenThreshold && d < nearestDist) {
      nearestDist = d;
      nearest = ep;
    }
  }

  return nearest;
}

/** Calculate polygon area using the Shoelace formula (in pixel² units) */
export function calcPolygonArea(points: Point[]): number {
  if (points.length < 3) return 0;
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }
  return Math.abs(area) / 2;
}
