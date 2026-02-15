'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useUIStore } from '@/stores/useUIStore';

export function SettingsDialog() {
  const open = useUIStore((s) => s.settingsDialogOpen);
  const setOpen = useUIStore((s) => s.setSettingsDialogOpen);
  const gridEnabled = useUIStore((s) => s.gridEnabled);
  const gridSpacing = useUIStore((s) => s.gridSpacing);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between">
            <label className="text-sm text-zinc-300">Show Grid</label>
            <button
              className={`relative h-5 w-9 rounded-full transition-colors ${
                gridEnabled ? 'bg-cyan-600' : 'bg-zinc-700'
              }`}
              onClick={() => useUIStore.getState().setGridEnabled(!gridEnabled)}
            >
              <span
                className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
                  gridEnabled ? 'translate-x-4' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <label className="text-sm text-zinc-300">Grid Spacing (px)</label>
            <input
              type="number"
              value={gridSpacing}
              min={5}
              max={500}
              onChange={(e) => useUIStore.getState().setGridSpacing(Number(e.target.value))}
              className="w-20 rounded bg-zinc-800 px-2 py-1 text-sm text-zinc-300 outline-none focus:ring-1 focus:ring-zinc-600"
            />
          </div>
          <p className="text-xs text-zinc-600">
            Press G to toggle grid. Grid snaps when drawing or dragging.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
