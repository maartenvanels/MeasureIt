import { Measurement, AngleMeasurement, AreaMeasurement, Annotation, AnyMeasurement, ViewTransform, DrawMode, Point, LabelBounds } from '@/types/measurement';
import { imageToScreen } from './geometry';

export const DEFAULT_COLORS: Record<string, string> = {
  reference: '#e11d48',
  measure: '#06b6d4',
  angle: '#f59e0b',
  area: '#10b981',
  annotation: '#a855f7',
};

export function getMeasurementColor(m: AnyMeasurement): string {
  return m.color ?? DEFAULT_COLORS[m.type] ?? '#06b6d4';
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
}

export function drawLabel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  text: string,
  color: string,
  fontSize = 13,
  offset?: { x: number; y: number }
): { x: number; y: number; w: number; h: number } {
  const lx = x + (offset?.x ?? 0);
  const ly = y + (offset?.y ?? 0);

  ctx.save();
  ctx.font = `600 ${fontSize}px 'Inter', 'Segoe UI', system-ui, sans-serif`;
  const metrics = ctx.measureText(text);
  const w = metrics.width + 14;
  const h = fontSize + 10;

  ctx.fillStyle = 'rgba(9, 9, 11, 0.9)';
  ctx.beginPath();
  roundRect(ctx, lx - w / 2, ly - h / 2, w, h, 5);
  ctx.fill();

  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  roundRect(ctx, lx - w / 2, ly - h / 2, w, h, 5);
  ctx.stroke();

  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, lx, ly);
  ctx.restore();

  return { x: lx - w / 2, y: ly - h / 2, w, h };
}

export function drawEndMarker(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  color: string
) {
  const len = 10;
  const spread = Math.PI / 6;

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(
    x + len * Math.cos(angle + spread),
    y + len * Math.sin(angle + spread)
  );
  ctx.lineTo(
    x + len * Math.cos(angle - spread),
    y + len * Math.sin(angle - spread)
  );
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.arc(x, y, 4, 0, Math.PI * 2);
  ctx.fill();
}

export function drawAnnotationLeader(
  ctx: CanvasRenderingContext2D,
  annotation: Annotation,
  selected: boolean,
  transform: ViewTransform
) {
  if (!annotation.arrowTarget) return;
  const color = annotation.color ?? '#a855f7';
  const from = imageToScreen(annotation.position.x, annotation.position.y, transform);
  const to = imageToScreen(annotation.arrowTarget.x, annotation.arrowTarget.y, transform);

  ctx.save();
  ctx.globalAlpha = selected ? 1 : 0.85;

  // Line
  ctx.strokeStyle = color;
  ctx.lineWidth = selected ? 2.5 : 1.5;
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.stroke();

  // Arrowhead at target
  const angle = Math.atan2(from.y - to.y, from.x - to.x);
  drawEndMarker(ctx, to.x, to.y, angle, color);

  ctx.restore();
}

export function renderImage(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  transform: ViewTransform,
  canvasWidth: number,
  canvasHeight: number
) {
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  ctx.fillStyle = '#09090b';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  ctx.save();
  ctx.translate(transform.panX, transform.panY);
  ctx.scale(transform.zoom, transform.zoom);
  ctx.drawImage(image, 0, 0);
  ctx.restore();
}

export function drawMeasurementLine(
  ctx: CanvasRenderingContext2D,
  m: Measurement,
  selected: boolean,
  transform: ViewTransform,
  label: string,
  nameLabel?: string,
  labelBoundsOut?: LabelBounds[],
  skipNameLabel?: boolean
) {
  const isRef = m.type === 'reference';
  const color = m.color ?? (isRef ? '#e11d48' : '#06b6d4');
  const s = imageToScreen(m.start.x, m.start.y, transform);
  const e = imageToScreen(m.end.x, m.end.y, transform);
  const fontSize = m.fontSize ?? 13;

  ctx.save();
  ctx.globalAlpha = selected ? 1 : 0.85;

  // Line
  ctx.strokeStyle = color;
  ctx.lineWidth = selected ? 3 : 2;
  ctx.beginPath();
  ctx.moveTo(s.x, s.y);
  ctx.lineTo(e.x, e.y);
  ctx.stroke();

  // End markers
  const angle = Math.atan2(e.y - s.y, e.x - s.x);
  drawEndMarker(ctx, s.x, s.y, angle, color);
  drawEndMarker(ctx, e.x, e.y, angle + Math.PI, color);

  // Value label
  const mid = { x: (s.x + e.x) / 2, y: (s.y + e.y) / 2 };
  const screenOffset = m.labelOffset
    ? { x: m.labelOffset.x * transform.zoom, y: m.labelOffset.y * transform.zoom }
    : undefined;
  const vb = drawLabel(ctx, mid.x, mid.y - 14, label, color, fontSize, screenOffset);
  if (labelBoundsOut) {
    labelBoundsOut.push({ measurementId: m.id, labelType: 'value', ...vb });
  }

  // Name label
  if (nameLabel && !skipNameLabel) {
    const nameScreenOffset = m.nameLabelOffset
      ? { x: m.nameLabelOffset.x * transform.zoom, y: m.nameLabelOffset.y * transform.zoom }
      : undefined;
    const nb = drawLabel(ctx, mid.x, mid.y + 18, nameLabel, '#71717a', Math.max(9, fontSize - 2), nameScreenOffset);
    if (labelBoundsOut) {
      labelBoundsOut.push({ measurementId: m.id, labelType: 'name', ...nb });
    }
  }

  ctx.restore();
}

export function drawInProgressLine(
  ctx: CanvasRenderingContext2D,
  start: Point,
  end: Point,
  mode: DrawMode,
  transform: ViewTransform,
  label: string
) {
  const color = mode === 'reference' ? '#e11d48' : '#06b6d4';
  const s = imageToScreen(start.x, start.y, transform);
  const e = imageToScreen(end.x, end.y, transform);

  ctx.save();
  ctx.setLineDash([6, 4]);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(s.x, s.y);
  ctx.lineTo(e.x, e.y);
  ctx.stroke();

  const mid = { x: (s.x + e.x) / 2, y: (s.y + e.y) / 2 };
  drawLabel(ctx, mid.x, mid.y - 14, label, color);

  ctx.restore();
}

export function drawAngleMeasurement(
  ctx: CanvasRenderingContext2D,
  angle: AngleMeasurement,
  selected: boolean,
  transform: ViewTransform,
  labelBoundsOut?: LabelBounds[],
  skipNameLabel?: boolean
) {
  const color = angle.color ?? '#f59e0b';
  const v = imageToScreen(angle.vertex.x, angle.vertex.y, transform);
  const a = imageToScreen(angle.armA.x, angle.armA.y, transform);
  const b = imageToScreen(angle.armB.x, angle.armB.y, transform);

  ctx.save();
  ctx.globalAlpha = selected ? 1 : 0.85;

  // Draw arms
  ctx.strokeStyle = color;
  ctx.lineWidth = selected ? 3 : 2;
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(v.x, v.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();

  // Draw arc at vertex
  const angleA = Math.atan2(a.y - v.y, a.x - v.x);
  const angleB = Math.atan2(b.y - v.y, b.x - v.x);
  const arcRadius = Math.min(30, Math.max(15, 20 * transform.zoom));
  ctx.beginPath();
  ctx.arc(v.x, v.y, arcRadius, angleA, angleB, false);
  // Check if we need to draw the shorter arc
  let diff = angleB - angleA;
  if (diff < 0) diff += Math.PI * 2;
  if (diff > Math.PI) {
    ctx.beginPath();
    ctx.arc(v.x, v.y, arcRadius, angleA, angleB, true);
  }
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Draw dots at vertex, armA, armB
  for (const pt of [v, a, b]) {
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }

  // Draw angle label
  const labelAngle = (angleA + angleB) / 2;
  // Adjust for the shorter arc
  let labelAngleAdj = labelAngle;
  if (diff > Math.PI) {
    labelAngleAdj = labelAngle + Math.PI;
  }
  const fontSize = angle.fontSize ?? 13;
  const labelDist = arcRadius + 18;
  const lx = v.x + labelDist * Math.cos(labelAngleAdj);
  const ly = v.y + labelDist * Math.sin(labelAngleAdj);
  const screenOffset = angle.labelOffset
    ? { x: angle.labelOffset.x * transform.zoom, y: angle.labelOffset.y * transform.zoom }
    : undefined;
  const vb = drawLabel(ctx, lx, ly, `${angle.angleDeg.toFixed(1)}°`, color, fontSize, screenOffset);
  if (labelBoundsOut) {
    labelBoundsOut.push({ measurementId: angle.id, labelType: 'value', ...vb });
  }

  // Name label
  if (angle.name && !skipNameLabel) {
    const nameScreenOffset = angle.nameLabelOffset
      ? { x: angle.nameLabelOffset.x * transform.zoom, y: angle.nameLabelOffset.y * transform.zoom }
      : undefined;
    const nb = drawLabel(ctx, lx, ly + 22, angle.name, '#71717a', Math.max(9, fontSize - 2), nameScreenOffset);
    if (labelBoundsOut) {
      labelBoundsOut.push({ measurementId: angle.id, labelType: 'name', ...nb });
    }
  }

  ctx.restore();
}

export function drawInProgressAngle(
  ctx: CanvasRenderingContext2D,
  vertex: Point | null,
  armA: Point | null,
  cursorPos: Point | null,
  transform: ViewTransform
) {
  const color = '#f59e0b';
  ctx.save();
  ctx.setLineDash([6, 4]);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;

  if (vertex) {
    const v = imageToScreen(vertex.x, vertex.y, transform);

    // Draw dot at vertex
    ctx.beginPath();
    ctx.arc(v.x, v.y, 5, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();

    if (armA) {
      const a = imageToScreen(armA.x, armA.y, transform);

      // Draw first arm
      ctx.beginPath();
      ctx.moveTo(v.x, v.y);
      ctx.lineTo(a.x, a.y);
      ctx.stroke();

      // Draw dot at armA
      ctx.beginPath();
      ctx.arc(a.x, a.y, 4, 0, Math.PI * 2);
      ctx.fill();

      // Draw line to cursor for second arm
      if (cursorPos) {
        const c = imageToScreen(cursorPos.x, cursorPos.y, transform);
        ctx.beginPath();
        ctx.moveTo(v.x, v.y);
        ctx.lineTo(c.x, c.y);
        ctx.stroke();
      }
    } else if (cursorPos) {
      // Draw line from vertex to cursor for first arm
      const c = imageToScreen(cursorPos.x, cursorPos.y, transform);
      ctx.beginPath();
      ctx.moveTo(v.x, v.y);
      ctx.lineTo(c.x, c.y);
      ctx.stroke();
    }
  }

  ctx.restore();
}

export function drawAreaMeasurement(
  ctx: CanvasRenderingContext2D,
  area: AreaMeasurement,
  selected: boolean,
  transform: ViewTransform,
  label: string,
  labelBoundsOut?: LabelBounds[],
  skipNameLabel?: boolean
) {
  const color = area.color ?? '#10b981';
  const screenPts = area.points.map((p) => imageToScreen(p.x, p.y, transform));

  ctx.save();
  ctx.globalAlpha = selected ? 1 : 0.85;

  // Fill polygon
  ctx.fillStyle = hexToRgba(color, selected ? 0.15 : 0.08);
  ctx.beginPath();
  screenPts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
  ctx.closePath();
  ctx.fill();

  // Stroke polygon
  ctx.strokeStyle = color;
  ctx.lineWidth = selected ? 3 : 2;
  ctx.beginPath();
  screenPts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
  ctx.closePath();
  ctx.stroke();

  // Draw dots at vertices
  for (const p of screenPts) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }

  // Label at centroid
  const fontSize = area.fontSize ?? 13;
  const cx = screenPts.reduce((s, p) => s + p.x, 0) / screenPts.length;
  const cy = screenPts.reduce((s, p) => s + p.y, 0) / screenPts.length;
  const screenOffset = area.labelOffset
    ? { x: area.labelOffset.x * transform.zoom, y: area.labelOffset.y * transform.zoom }
    : undefined;
  const vb = drawLabel(ctx, cx, cy, label, color, fontSize, screenOffset);
  if (labelBoundsOut) {
    labelBoundsOut.push({ measurementId: area.id, labelType: 'value', ...vb });
  }

  if (area.name && !skipNameLabel) {
    const nameScreenOffset = area.nameLabelOffset
      ? { x: area.nameLabelOffset.x * transform.zoom, y: area.nameLabelOffset.y * transform.zoom }
      : undefined;
    const nb = drawLabel(ctx, cx, cy + 22, area.name, '#71717a', Math.max(9, fontSize - 2), nameScreenOffset);
    if (labelBoundsOut) {
      labelBoundsOut.push({ measurementId: area.id, labelType: 'name', ...nb });
    }
  }

  ctx.restore();
}

export function drawInProgressArea(
  ctx: CanvasRenderingContext2D,
  points: Point[],
  cursorPos: Point | null,
  transform: ViewTransform
) {
  if (points.length === 0) return;
  const color = '#10b981';
  const screenPts = points.map((p) => imageToScreen(p.x, p.y, transform));

  ctx.save();

  // Fill preview
  if (screenPts.length >= 2) {
    ctx.fillStyle = 'rgba(16, 185, 129, 0.06)';
    ctx.beginPath();
    screenPts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
    if (cursorPos) {
      const c = imageToScreen(cursorPos.x, cursorPos.y, transform);
      ctx.lineTo(c.x, c.y);
    }
    ctx.closePath();
    ctx.fill();
  }

  // Draw lines between placed points
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 4]);
  ctx.beginPath();
  screenPts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
  // Line to cursor
  if (cursorPos) {
    const c = imageToScreen(cursorPos.x, cursorPos.y, transform);
    ctx.lineTo(c.x, c.y);
  }
  ctx.stroke();

  // Draw dots
  for (const p of screenPts) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }

  // Highlight first point for closing
  if (screenPts.length >= 3) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.arc(screenPts[0].x, screenPts[0].y, 8, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
}

export function drawSnapIndicator(
  ctx: CanvasRenderingContext2D,
  point: Point,
  transform: ViewTransform
) {
  const s = imageToScreen(point.x, point.y, transform);
  ctx.save();

  // Outer ring
  ctx.strokeStyle = '#22d3ee';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(s.x, s.y, 10, 0, Math.PI * 2);
  ctx.stroke();

  // Inner dot
  ctx.fillStyle = '#22d3ee';
  ctx.beginPath();
  ctx.arc(s.x, s.y, 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

export function renderOverlay(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  measurements: AnyMeasurement[],
  selectedId: string | null,
  transform: ViewTransform,
  getLabel: (m: AnyMeasurement) => string,
  drawState?: {
    start: Point;
    current: Point;
    mode: DrawMode;
    label: string;
  },
  angleDrawState?: {
    vertex: Point | null;
    armA: Point | null;
    cursorPos: Point | null;
  },
  areaDrawState?: {
    points: Point[];
    cursorPos: Point | null;
  },
  snapPoint?: Point | null,
  labelBoundsOut?: LabelBounds[]
) {
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  if (labelBoundsOut) labelBoundsOut.length = 0;

  for (const m of measurements) {
    if (m.type === 'annotation') {
      if ((m as Annotation).arrowTarget) {
        drawAnnotationLeader(ctx, m as Annotation, m.id === selectedId, transform);
      }
      continue; // text rendered as HTML overlay
    }
    if (m.type === 'angle') {
      drawAngleMeasurement(ctx, m, m.id === selectedId, transform, labelBoundsOut, true);
    } else if (m.type === 'area') {
      drawAreaMeasurement(ctx, m, m.id === selectedId, transform, getLabel(m), labelBoundsOut, true);
    } else {
      drawMeasurementLine(
        ctx,
        m,
        m.id === selectedId,
        transform,
        getLabel(m),
        m.name,
        labelBoundsOut,
        true
      );
    }
  }

  if (drawState) {
    drawInProgressLine(
      ctx,
      drawState.start,
      drawState.current,
      drawState.mode,
      transform,
      drawState.label
    );
  }

  if (angleDrawState) {
    drawInProgressAngle(
      ctx,
      angleDrawState.vertex,
      angleDrawState.armA,
      angleDrawState.cursorPos,
      transform
    );
  }

  if (areaDrawState && areaDrawState.points.length > 0) {
    drawInProgressArea(ctx, areaDrawState.points, areaDrawState.cursorPos, transform);
  }

  // Draw snap indicator last (on top of everything)
  if (snapPoint) {
    drawSnapIndicator(ctx, snapPoint, transform);
  }
}

export function drawInProgressCrop(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  start: Point,
  current: Point,
  transform: ViewTransform
) {
  const s = imageToScreen(start.x, start.y, transform);
  const e = imageToScreen(current.x, current.y, transform);

  const x = Math.min(s.x, e.x);
  const y = Math.min(s.y, e.y);
  const w = Math.abs(e.x - s.x);
  const h = Math.abs(e.y - s.y);

  // Dim outside
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  ctx.clearRect(x, y, w, h);

  // Border
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 4]);
  ctx.strokeRect(x, y, w, h);
  ctx.setLineDash([]);

  // Dimension label
  const cropW = Math.abs(current.x - start.x).toFixed(0);
  const cropH = Math.abs(current.y - start.y).toFixed(0);
  drawLabel(ctx, x + w / 2, y + h + 20, `${cropW} × ${cropH} px`, '#ffffff');
}

export function drawCropOverlay(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  cropBounds: { x: number; y: number; w: number; h: number },
  transform: ViewTransform
) {
  const topLeft = imageToScreen(cropBounds.x, cropBounds.y, transform);
  const bottomRight = imageToScreen(
    cropBounds.x + cropBounds.w,
    cropBounds.y + cropBounds.h,
    transform
  );
  const rx = topLeft.x;
  const ry = topLeft.y;
  const rw = bottomRight.x - topLeft.x;
  const rh = bottomRight.y - topLeft.y;

  // Dim the entire canvas
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // Clear the crop region
  ctx.clearRect(rx, ry, rw, rh);

  // Selection border
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 4]);
  ctx.strokeRect(rx, ry, rw, rh);
  ctx.setLineDash([]);

  // Corner handles
  const hs = 8;
  ctx.fillStyle = '#ffffff';
  for (const [hx, hy] of [[rx, ry], [rx + rw, ry], [rx, ry + rh], [rx + rw, ry + rh]]) {
    ctx.fillRect(hx - hs / 2, hy - hs / 2, hs, hs);
  }
}
