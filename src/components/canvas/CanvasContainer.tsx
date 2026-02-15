'use client';

import { useRef, useCallback, useEffect } from 'react';
import { useCanvasStore } from '@/stores/useCanvasStore';
import { useUIStore } from '@/stores/useUIStore';
import { useImageLoader } from '@/hooks/useImageLoader';
import { useCanvasInteraction } from '@/hooks/useCanvasInteraction';
import { useCanvasRenderer } from '@/hooks/useCanvasRenderer';
import { DropZone } from './DropZone';
import { ZoomControls } from './ZoomControls';
import { AnnotationOverlay } from './AnnotationOverlay';
import { MeasurementNameOverlay } from './MeasurementNameOverlay';
import { CropConfirmOverlay } from './CropConfirmOverlay';
import { LabelBounds } from '@/types/measurement';

export function CanvasContainer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageCanvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const labelBoundsRef = useRef<LabelBounds[]>([]);

  const image = useCanvasStore((s) => s.image);
  const mode = useUIStore((s) => s.mode);
  const isPanning = useCanvasStore((s) => s.isPanning);
  const cropMode = useUIStore((s) => s.cropMode);

  const { loadFromFile, loadFromDrop, loadFromClipboard } = useImageLoader();

  // Canvas interaction (pointer events)
  useCanvasInteraction(overlayCanvasRef, labelBoundsRef);

  // Canvas rendering (subscribes to stores)
  useCanvasRenderer(imageCanvasRef, overlayCanvasRef, containerRef, labelBoundsRef);

  // Clipboard paste
  useEffect(() => {
    const handler = (e: ClipboardEvent) => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      loadFromClipboard(e, rect.width, rect.height);
    };
    document.addEventListener('paste', handler);
    return () => document.removeEventListener('paste', handler);
  }, [loadFromClipboard]);

  // Drag and drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      loadFromDrop(e, rect.width, rect.height);
    },
    [loadFromDrop]
  );

  // File input handler (called from toolbar)
  useEffect(() => {
    const handler = (e: Event) => {
      const input = e.target as HTMLInputElement;
      const file = input.files?.[0];
      if (!file) return;
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      loadFromFile(file, rect.width, rect.height);
      input.value = '';
    };

    const fileInput = document.getElementById('fileInput');
    if (fileInput) fileInput.addEventListener('change', handler);
    return () => {
      if (fileInput) fileInput.removeEventListener('change', handler);
    };
  }, [loadFromFile]);

  const cursorClass =
    isPanning ? 'cursor-grabbing' :
    cropMode ? 'cursor-crosshair' :
    mode === 'none' ? 'cursor-grab' :
    mode === 'annotation' ? 'cursor-text' : 'cursor-crosshair';

  return (
    <div
      ref={containerRef}
      className={`relative flex-1 overflow-hidden bg-zinc-950 ${cursorClass}`}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <canvas
        ref={imageCanvasRef}
        className="absolute inset-0"
      />
      <canvas
        ref={overlayCanvasRef}
        className="absolute inset-0"
      />
      <MeasurementNameOverlay />
      <AnnotationOverlay />
      <CropConfirmOverlay containerRef={containerRef} />
      {!image && <DropZone containerRef={containerRef} />}
      <ZoomControls containerRef={containerRef} />
      <input type="file" id="fileInput" accept="image/*" className="hidden" />
    </div>
  );
}
