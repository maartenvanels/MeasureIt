'use client';

import { Image as ImageIcon, Upload } from 'lucide-react';

export function DropZone() {
  return (
    <div className="absolute inset-6 flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-zinc-800 transition-colors hover:border-zinc-600">
      <div className="rounded-full bg-zinc-900 p-6">
        <ImageIcon className="h-12 w-12 text-zinc-600" />
      </div>
      <div className="text-center">
        <p className="text-lg font-medium text-zinc-400">
          Drop an image here
        </p>
        <p className="mt-1 text-sm text-zinc-600">
          or click the <Upload className="inline h-3.5 w-3.5" /> button above
        </p>
        <p className="mt-2 text-xs text-zinc-700">
          Supports paste from clipboard (Ctrl+V)
        </p>
      </div>
    </div>
  );
}
