import { Point, ViewTransform } from '@/types/measurement';

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
