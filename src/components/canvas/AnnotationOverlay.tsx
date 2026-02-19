'use client';

import { useRef, useCallback } from 'react';
import Markdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Annotation } from '@/types/measurement';
import { useMeasurementStore } from '@/stores/useMeasurementStore';
import { useCanvasStore } from '@/stores/useCanvasStore';
import { useUIStore } from '@/stores/useUIStore';
import { imageToScreen } from '@/lib/geometry';

export function AnnotationOverlay() {
  const measurements = useMeasurementStore((s) => s.measurements);
  const updateMeasurement = useMeasurementStore((s) => s.updateMeasurement);
  const transform = useCanvasStore((s) => s.transform);
  const selectedId = useUIStore((s) => s.selectedMeasurementId);
  const selectMeasurement = useUIStore((s) => s.selectMeasurement);
  const openAnnotationEditor = useUIStore((s) => s.openAnnotationEditor);

  const annotations = measurements.filter(
    (m): m is Annotation => m.type === 'annotation' && m.visible !== false
  );

  const dragRef = useRef<{
    id: string;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  } | null>(null);

  // Refs for measuring annotation box dimensions
  const boxRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const handlePointerDown = useCallback(
    (e: React.PointerEvent, annotation: Annotation) => {
      e.stopPropagation();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      dragRef.current = {
        id: annotation.id,
        startX: e.clientX,
        startY: e.clientY,
        origX: annotation.position.x,
        origY: annotation.position.y,
      };
    },
    []
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragRef.current) return;
      const dx = (e.clientX - dragRef.current.startX) / transform.zoom;
      const dy = (e.clientY - dragRef.current.startY) / transform.zoom;
      const newPos = {
        x: dragRef.current.origX + dx,
        y: dragRef.current.origY + dy,
      };
      updateMeasurement(dragRef.current.id, { position: newPos });
    },
    [transform.zoom, updateMeasurement]
  );

  const handlePointerUp = useCallback(() => {
    dragRef.current = null;
  }, []);

  if (annotations.length === 0) return null;

  const scale = Math.min(1, transform.zoom);

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* SVG layer for leader lines — rendered before boxes so boxes appear on top */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        {annotations.filter(m => m.arrowTarget).map(m => {
          const from = imageToScreen(m.position.x, m.position.y, transform);
          const to = imageToScreen(m.arrowTarget!.x, m.arrowTarget!.y, transform);
          const color = m.color ?? '#a855f7';
          const isSelected = m.id === selectedId;

          // Get measured box dimensions (available after first render)
          const boxEl = boxRefs.current.get(m.id);
          const boxW = (boxEl?.offsetWidth ?? 0) * scale;
          const boxH = (boxEl?.offsetHeight ?? 0) * scale;

          // Determine if target is to the right of the annotation box center
          const boxCenterX = from.x + boxW / 2;
          const arrowGoesRight = to.x > boxCenterX;

          // Connection point: center of the color bar side
          const anchorX = arrowGoesRight ? from.x + boxW : from.x;
          const anchorY = from.y + boxH / 2;

          // Arrowhead at target
          const angle = Math.atan2(anchorY - to.y, anchorX - to.x);
          const arrowLen = 10;
          const arrowSpread = Math.PI / 6;
          const p1x = to.x + arrowLen * Math.cos(angle + arrowSpread);
          const p1y = to.y + arrowLen * Math.sin(angle + arrowSpread);
          const p2x = to.x + arrowLen * Math.cos(angle - arrowSpread);
          const p2y = to.y + arrowLen * Math.sin(angle - arrowSpread);

          return (
            <g key={`leader-${m.id}`} opacity={isSelected ? 1 : 0.85}>
              <line
                x1={anchorX} y1={anchorY}
                x2={to.x} y2={to.y}
                stroke={color}
                strokeWidth={isSelected ? 2.5 : 1.5}
              />
              <polygon
                points={`${to.x},${to.y} ${p1x},${p1y} ${p2x},${p2y}`}
                fill={color}
              />
              <circle cx={to.x} cy={to.y} r={4} fill={color} />
            </g>
          );
        })}
      </svg>

      {/* Annotation boxes */}
      {annotations.map((m) => {
        const screen = imageToScreen(m.position.x, m.position.y, transform);
        const isSelected = m.id === selectedId;
        const annotationColor = m.color ?? '#a855f7';

        // Determine color bar side based on arrow direction
        const arrowGoesRight = m.arrowTarget
          ? (() => {
              const boxEl = boxRefs.current.get(m.id);
              const boxW = (boxEl?.offsetWidth ?? 0) * scale;
              const to = imageToScreen(m.arrowTarget!.x, m.arrowTarget!.y, transform);
              return to.x > screen.x + boxW / 2;
            })()
          : false;

        return (
          <div
            key={m.id}
            className="pointer-events-auto absolute"
            style={{
              left: screen.x,
              top: screen.y,
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
            }}
            onClick={(e) => {
              e.stopPropagation();
              selectMeasurement(m.id);
            }}
            onDoubleClick={(e) => {
              e.stopPropagation();
              openAnnotationEditor(m.id);
            }}
            onPointerDown={(e) => handlePointerDown(e, m)}
          >
            <div
              ref={(el) => {
                if (el) boxRefs.current.set(m.id, el);
                else boxRefs.current.delete(m.id);
              }}
              className={`max-w-xs rounded-md px-3 py-2 shadow-lg cursor-move bg-popover/90 ${
                isSelected ? 'ring-2 ring-white/30' : ''
              }`}
              style={{
                borderLeft: !arrowGoesRight ? `3px solid ${annotationColor}` : undefined,
                borderRight: arrowGoesRight ? `3px solid ${annotationColor}` : undefined,
                fontSize: `${m.fontSize ?? 14}px`,
              }}
            >
              {m.content ? (
                <div className="annotation-content text-popover-foreground leading-relaxed" style={{ fontSize: 'inherit' }}>
                  <Markdown
                    remarkPlugins={[remarkMath]}
                    rehypePlugins={[rehypeKatex]}
                  >
                    {m.content}
                  </Markdown>
                </div>
              ) : (
                <span className="text-muted-foreground italic">Click to edit...</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
