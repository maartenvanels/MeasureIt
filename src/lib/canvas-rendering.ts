import { Measurement, ViewTransform, DrawMode, Point } from '@/types/measurement';
import { imageToScreen } from './geometry';

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
  fontSize = 13
) {
  ctx.save();
  ctx.font = `600 ${fontSize}px 'Inter', 'Segoe UI', system-ui, sans-serif`;
  const metrics = ctx.measureText(text);
  const w = metrics.width + 14;
  const h = fontSize + 10;

  ctx.fillStyle = 'rgba(9, 9, 11, 0.9)';
  ctx.beginPath();
  roundRect(ctx, x - w / 2, y - h / 2, w, h, 5);
  ctx.fill();

  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  roundRect(ctx, x - w / 2, y - h / 2, w, h, 5);
  ctx.stroke();

  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
  ctx.restore();
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
  nameLabel?: string
) {
  const isRef = m.type === 'reference';
  const color = isRef ? '#e11d48' : '#06b6d4';
  const s = imageToScreen(m.start.x, m.start.y, transform);
  const e = imageToScreen(m.end.x, m.end.y, transform);

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
  drawLabel(ctx, mid.x, mid.y - 14, label, color);

  // Name label
  if (nameLabel) {
    drawLabel(ctx, mid.x, mid.y + 18, nameLabel, '#71717a', 11);
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

export function renderOverlay(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  measurements: Measurement[],
  selectedId: string | null,
  transform: ViewTransform,
  getLabel: (m: Measurement) => string,
  drawState?: {
    start: Point;
    current: Point;
    mode: DrawMode;
    label: string;
  }
) {
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  for (const m of measurements) {
    drawMeasurementLine(
      ctx,
      m,
      m.id === selectedId,
      transform,
      getLabel(m),
      m.name
    );
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
}
