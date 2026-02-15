'use client';

import { useEffect, useState } from 'react';
import { useUIStore } from '@/stores/useUIStore';
import { useCanvasStore } from '@/stores/useCanvasStore';
import { useMeasurementStore } from '@/stores/useMeasurementStore';
import { screenToImage, pixelDist } from '@/lib/geometry';

const modeLabels: Record<string, string> = {
  none: 'Navigate',
  reference: 'Reference',
  measure: 'Measure',
  angle: 'Angle',
  area: 'Area (Polygon)',
  'area-polygon': 'Area (Polygon)',
  'area-freehand': 'Area (Freehand)',
  'area-circle-3pt': 'Area (Circle 3pt)',
  'area-circle-center': 'Area (Circle Center)',
  annotation: 'Annotate',
};

export function StatusBar() {
  const mode = useUIStore((s) => s.mode);
  const zoom = useCanvasStore((s) => s.transform.zoom);
  const drawStart = useCanvasStore((s) => s.drawStart);
  const drawCurrent = useCanvasStore((s) => s.drawCurrent);
  const measureCount = useMeasurementStore((s) => s.measurements.length);

  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const handler = (e: PointerEvent) => {
      const canvas = document.querySelector('canvas:last-of-type');
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const transform = useCanvasStore.getState().transform;
      const pt = screenToImage(mx, my, transform);
      setMousePos({ x: Math.round(pt.x), y: Math.round(pt.y) });
    };
    window.addEventListener('pointermove', handler);
    return () => window.removeEventListener('pointermove', handler);
  }, []);

  const pxDist =
    drawStart && drawCurrent ? pixelDist(drawStart, drawCurrent).toFixed(1) : null;

  return (
    <div className="flex items-center gap-6 border-t border-border bg-background px-4 py-1 text-[11px] text-muted-foreground">
      <span>
        Mode:{' '}
        <span className="text-foreground">{modeLabels[mode]}</span>
      </span>
      <span>
        Position:{' '}
        <span className="text-foreground">
          {mousePos ? `${mousePos.x}, ${mousePos.y}` : '--'}
        </span>
      </span>
      <span>
        Zoom:{' '}
        <span className="text-foreground">{Math.round(zoom * 100)}%</span>
      </span>
      {pxDist && (
        <span>
          Distance:{' '}
          <span className="text-foreground">{pxDist} px</span>
        </span>
      )}
      <span className="ml-auto">
        {measureCount} measurement{measureCount !== 1 ? 's' : ''}
      </span>
    </div>
  );
}
