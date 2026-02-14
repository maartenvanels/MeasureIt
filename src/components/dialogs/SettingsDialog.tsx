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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        <div className="py-4 text-sm text-zinc-400">
          More settings coming soon: decimal precision, language, theme, and
          cloud storage.
        </div>
      </DialogContent>
    </Dialog>
  );
}
