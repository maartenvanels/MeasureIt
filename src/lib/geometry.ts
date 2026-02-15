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
      if (m.center) points.push(m.center);
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
  screenThreshold = 12,
  excludeId?: string
): Point | null {
  const filtered = excludeId ? measurements.filter(m => m.id !== excludeId) : measurements;
  const endpoints = getAllEndpoints(filtered);
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

/** Snap a point to the nearest grid intersection */
export function snapToGrid(point: Point, gridSpacing: number): Point {
  return {
    x: Math.round(point.x / gridSpacing) * gridSpacing,
    y: Math.round(point.y / gridSpacing) * gridSpacing,
  };
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

/** Circle area from radius */
export function circleArea(radius: number): number {
  return Math.PI * radius * radius;
}

/** Compute circumscribed circle from 3 points. Returns null if collinear. */
export function circumscribedCircle(
  p1: Point, p2: Point, p3: Point
): { center: Point; radius: number } | null {
  const ax = p1.x, ay = p1.y;
  const bx = p2.x, by = p2.y;
  const cx = p3.x, cy = p3.y;
  const D = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by));
  if (Math.abs(D) < 1e-10) return null; // collinear
  const ux = ((ax * ax + ay * ay) * (by - cy) + (bx * bx + by * by) * (cy - ay) + (cx * cx + cy * cy) * (ay - by)) / D;
  const uy = ((ax * ax + ay * ay) * (cx - bx) + (bx * bx + by * by) * (ax - cx) + (cx * cx + cy * cy) * (bx - ax)) / D;
  const center = { x: ux, y: uy };
  const radius = pixelDist(center, p1);
  return { center, radius };
}

/** Hit test: is point inside circle? */
export function pointInCircle(point: Point, center: Point, radius: number): boolean {
  return pixelDist(point, center) <= radius;
}

/** Perpendicular distance from a point to a line segment */
function perpendicularDistance(point: Point, lineStart: Point, lineEnd: Point): number {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return pixelDist(point, lineStart);
  const num = Math.abs(dy * point.x - dx * point.y + lineEnd.x * lineStart.y - lineEnd.y * lineStart.x);
  return num / Math.sqrt(lenSq);
}

/** Douglas-Peucker line simplification for freehand paths */
export function simplifyPath(points: Point[], epsilon: number): Point[] {
  if (points.length <= 2) return points;
  let maxDist = 0;
  let maxIdx = 0;
  const first = points[0];
  const last = points[points.length - 1];
  for (let i = 1; i < points.length - 1; i++) {
    const d = perpendicularDistance(points[i], first, last);
    if (d > maxDist) { maxDist = d; maxIdx = i; }
  }
  if (maxDist > epsilon) {
    const left = simplifyPath(points.slice(0, maxIdx + 1), epsilon);
    const right = simplifyPath(points.slice(maxIdx), epsilon);
    return [...left.slice(0, -1), ...right];
  }
  return [first, last];
}
