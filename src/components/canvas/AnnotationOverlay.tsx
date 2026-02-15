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
    (m): m is Annotation => m.type === 'annotation'
  );

  const dragRef = useRef<{
    id: string;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  } | null>(null);

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

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {annotations.map((m) => {
        const screen = imageToScreen(m.position.x, m.position.y, transform);
        const isSelected = m.id === selectedId;
        const annotationColor = m.color ?? '#a855f7';

        return (
          <div
            key={m.id}
            className="pointer-events-auto absolute"
            style={{
              left: screen.x,
              top: screen.y,
              transform: `scale(${Math.min(1, transform.zoom)})`,
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
              className={`max-w-xs rounded-md px-3 py-2 shadow-lg cursor-move ${
                isSelected ? 'ring-2 ring-white/30' : ''
              }`}
              style={{
                backgroundColor: 'rgba(9,9,11,0.9)',
                borderLeft: `3px solid ${annotationColor}`,
                fontSize: `${m.fontSize ?? 14}px`,
              }}
            >
              {m.content ? (
                <div className="annotation-content text-zinc-200 leading-relaxed">
                  <Markdown
                    remarkPlugins={[remarkMath]}
                    rehypePlugins={[rehypeKatex]}
                  >
                    {m.content}
                  </Markdown>
                </div>
              ) : (
                <span className="text-zinc-500 italic">Click to edit...</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
