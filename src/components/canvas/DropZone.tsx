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
    <div className="absolute inset-6 flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-zinc-800 transition-colors hover:border-zinc-600">
      <div className="rounded-full bg-zinc-900 p-6">
        <ImageIcon className="h-12 w-12 text-zinc-600" />
      </div>
      <div className="text-center">
        <p className="text-lg font-medium text-zinc-400">
          Drop an image or 3D model here
        </p>
        <p className="mt-1 text-sm text-zinc-600">
          or click the <Upload className="inline h-3.5 w-3.5" /> button above
        </p>
        <p className="mt-2 text-xs text-zinc-700">
          Images: paste from clipboard (Ctrl+V) &middot; 3D: .glb, .stl files
        </p>
      </div>

      <div className="mt-2 flex flex-col items-center gap-2">
        {!showBlankForm ? (
          <button
            className="flex items-center gap-1.5 rounded-md bg-zinc-800 px-3 py-1.5 text-sm text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-zinc-200"
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
              className="w-20 rounded bg-zinc-800 px-2 py-1 text-sm text-zinc-300 outline-none focus:ring-1 focus:ring-zinc-600"
              placeholder="Width"
            />
            <span className="text-xs text-zinc-600">&times;</span>
            <input
              type="number"
              value={height}
              onChange={(e) => setHeight(Number(e.target.value))}
              min={100}
              max={8000}
              className="w-20 rounded bg-zinc-800 px-2 py-1 text-sm text-zinc-300 outline-none focus:ring-1 focus:ring-zinc-600"
              placeholder="Height"
            />
            <button
              className="rounded bg-zinc-700 px-3 py-1 text-sm text-zinc-200 transition-colors hover:bg-zinc-600"
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
