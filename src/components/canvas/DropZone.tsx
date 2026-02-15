'use client';

import { useState, RefObject } from 'react';
import { Image as ImageIcon, Upload, PenLine } from 'lucide-react';
import { useCanvasStore } from '@/stores/useCanvasStore';

export function DropZone({ containerRef }: { containerRef: RefObject<HTMLDivElement | null> }) {
  const [showBlankForm, setShowBlankForm] = useState(false);
  const [width, setWidth] = useState(1920);
  const [height, setHeight] = useState(1080);

  const handleCreateBlank = () => {
    const w = Math.max(100, Math.min(8000, width));
    const h = Math.max(100, Math.min(8000, height));
    useCanvasStore.getState().createBlankCanvas(w, h);
    setTimeout(() => {
      const container = containerRef.current;
      if (container) {
        const rect = container.getBoundingClientRect();
        useCanvasStore.getState().fitImageToContainer(rect.width, rect.height);
      }
    }, 50);
  };

  return (
    <div className="absolute inset-6 flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-border transition-colors hover:border-muted-foreground">
      <div className="rounded-full bg-card p-6">
        <ImageIcon className="h-12 w-12 text-muted-foreground/50" />
      </div>
      <div className="text-center">
        <p className="text-lg font-medium text-muted-foreground">
          Drop an image or 3D model here
        </p>
        <p className="mt-1 text-sm text-muted-foreground/50">
          or click the <Upload className="inline h-3.5 w-3.5" /> button above
        </p>
        <p className="mt-2 text-xs text-muted-foreground/30">
          Images: paste from clipboard (Ctrl+V) &middot; 3D: .glb, .stl files
        </p>
      </div>

      <div className="mt-2 flex flex-col items-center gap-2">
        {!showBlankForm ? (
          <button
            className="flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent/80 hover:text-foreground"
            onClick={() => setShowBlankForm(true)}
          >
            <PenLine className="h-3.5 w-3.5" />
            Start with blank canvas
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={width}
              onChange={(e) => setWidth(Number(e.target.value))}
              min={100}
              max={8000}
              className="w-20 rounded bg-accent px-2 py-1 text-sm text-foreground outline-none focus:ring-1 focus:ring-ring"
              placeholder="Width"
            />
            <span className="text-xs text-muted-foreground/50">&times;</span>
            <input
              type="number"
              value={height}
              onChange={(e) => setHeight(Number(e.target.value))}
              min={100}
              max={8000}
              className="w-20 rounded bg-accent px-2 py-1 text-sm text-foreground outline-none focus:ring-1 focus:ring-ring"
              placeholder="Height"
            />
            <button
              className="rounded bg-muted px-3 py-1 text-sm text-foreground transition-colors hover:bg-muted/80"
              onClick={handleCreateBlank}
            >
              Create
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
