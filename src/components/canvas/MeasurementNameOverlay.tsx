'use client';

import { useRef, useCallback } from 'react';
import Markdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { useMeasurementStore } from '@/stores/useMeasurementStore';
import { useCanvasStore } from '@/stores/useCanvasStore';
import { useUIStore } from '@/stores/useUIStore';
import { imageToScreen, pixelDist } from '@/lib/geometry';
import {
  Measurement,
  AngleMeasurement,
  AreaMeasurement,
  AnyMeasurement,
  ViewTransform,
  Point,
} from '@/types/measurement';

/** Compute screen-space position for a measurement's name label */
function getNameLabelPos(
  m: AnyMeasurement,
  transform: ViewTransform
): { x: number; y: number } | null {
  if (m.type === 'annotation') return null;
  // Skip model-surface measurements (rendered in 3D scene)
  if ((m.type === 'reference' || m.type === 'measure') && (m as Measurement).surface === 'model') return null;
  if (!m.name) return null;

  let baseX: number;
  let baseY: number;

  if (m.type === 'angle') {
    const v = imageToScreen(m.vertex.x, m.vertex.y, transform);
    const a = imageToScreen(m.armA.x, m.armA.y, transform);
    const b = imageToScreen(m.armB.x, m.armB.y, transform);
    const angleA = Math.atan2(a.y - v.y, a.x - v.x);
    const angleB = Math.atan2(b.y - v.y, b.x - v.x);
    let labelAngle = (angleA + angleB) / 2;
    let diff = angleB - angleA;
    if (diff < 0) diff += Math.PI * 2;
    if (diff > Math.PI) labelAngle += Math.PI;
    const armLen = Math.max(pixelDist(v, a), pixelDist(v, b));
    const arcRadius = Math.min(40, armLen * 0.3);
    const labelDist = arcRadius + 18;
    baseX = v.x + labelDist * Math.cos(labelAngle);
    baseY = v.y + labelDist * Math.sin(labelAngle) + 22;
  } else if (m.type === 'area') {
    const screenPts = m.points.map((p) => imageToScreen(p.x, p.y, transform));
    baseX = screenPts.reduce((s, p) => s + p.x, 0) / screenPts.length;
    baseY = screenPts.reduce((s, p) => s + p.y, 0) / screenPts.length + 22;
  } else {
    // reference or measure (2D only — 3D types returned null above)
    const meas = m as Measurement;
    const mid = imageToScreen(
      (meas.start.x + meas.end.x) / 2,
      (meas.start.y + meas.end.y) / 2,
      transform
    );
    baseX = mid.x;
    baseY = mid.y + 18;
  }

  // Apply nameLabelOffset (image-space → screen-space)
  const offset = (m as Measurement).nameLabelOffset;
  if (offset) {
    baseX += offset.x * transform.zoom;
    baseY += offset.y * transform.zoom;
  }

  return { x: baseX, y: baseY };
}

export function MeasurementNameOverlay() {
  const measurements = useMeasurementStore((s) => s.measurements);
  const updateMeasurement = useMeasurementStore((s) => s.updateMeasurement);
  const transform = useCanvasStore((s) => s.transform);

  const dragRef = useRef<{
    id: string;
    startX: number;
    startY: number;
    origOffset: Point;
  } | null>(null);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent, m: AnyMeasurement) => {
      e.stopPropagation();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      const currentOffset = (m as unknown as Record<string, unknown>)
        .nameLabelOffset as Point | undefined;
      dragRef.current = {
        id: m.id,
        startX: e.clientX,
        startY: e.clientY,
        origOffset: currentOffset ? { ...currentOffset } : { x: 0, y: 0 },
      };
    },
    []
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragRef.current) return;
      const dx = (e.clientX - dragRef.current.startX) / transform.zoom;
      const dy = (e.clientY - dragRef.current.startY) / transform.zoom;
      const newOffset = {
        x: dragRef.current.origOffset.x + dx,
        y: dragRef.current.origOffset.y + dy,
      };
      updateMeasurement(dragRef.current.id, { nameLabelOffset: newOffset });
    },
    [transform.zoom, updateMeasurement]
  );

  const handlePointerUp = useCallback(() => {
    dragRef.current = null;
  }, []);

  // Filter measurements that have names (skip annotations)
  const namedMeasurements = measurements.filter(
    (m) => m.type !== 'annotation' && m.name
  );

  if (namedMeasurements.length === 0) return null;

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {namedMeasurements.map((m) => {
        const pos = getNameLabelPos(m, transform);
        if (!pos) return null;

        const fontSize = Math.max(9, (m.type !== 'annotation' ? ((m as any).fontSize ?? 13) : 13) - 2);

        return (
          <div
            key={`name-${m.id}`}
            className="pointer-events-auto absolute cursor-move"
            style={{
              left: pos.x,
              top: pos.y,
              transform: 'translate(-50%, -50%)',
            }}
            onPointerDown={(e) => handlePointerDown(e, m)}
          >
            <div
              className="rounded px-1.5 py-0.5 text-center whitespace-nowrap name-label-content"
              style={{
                backgroundColor: 'rgba(9, 9, 11, 0.9)',
                border: '1px solid #71717a',
                fontSize: `${fontSize}px`,
                color: '#71717a',
                fontWeight: 600,
                fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
                lineHeight: 1.4,
              }}
            >
              <Markdown
                remarkPlugins={[remarkMath]}
                rehypePlugins={[rehypeKatex]}
                components={{
                  p: ({ children }) => <span>{children}</span>,
                }}
              >
                {m.name ?? ''}
              </Markdown>
            </div>
          </div>
        );
      })}
    </div>
  );
}
