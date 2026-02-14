'use client';

import { useUIStore } from '@/stores/useUIStore';
import { MeasurementList } from './MeasurementList';
import { ShortcutsFooter } from './ShortcutsFooter';

export function MeasurementsSidebar() {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);

  if (!sidebarOpen) return null;

  return (
    <aside className="flex w-72 flex-col border-l border-zinc-800 bg-zinc-900">
      <div className="border-b border-zinc-800 px-4 py-3">
        <h2 className="text-xs font-medium uppercase tracking-wider text-zinc-500">
          Measurements
        </h2>
      </div>
      <MeasurementList />
      <ShortcutsFooter />
    </aside>
  );
}
