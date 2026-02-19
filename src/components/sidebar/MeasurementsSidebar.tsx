'use client';

import { useUIStore } from '@/stores/useUIStore';
import { SceneBrowser } from './SceneBrowser';
import { ShortcutsFooter } from './ShortcutsFooter';

export function MeasurementsSidebar() {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const sidebarWidth = useUIStore((s) => s.sidebarWidth);

  if (!sidebarOpen) return null;

  return (
    <aside className="flex flex-col border-l border-border bg-card flex-shrink-0" style={{ width: sidebarWidth }}>
      <div className="border-b border-border px-4 py-3">
        <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Scene Browser
        </h2>
      </div>
      <SceneBrowser />
      <ShortcutsFooter />
    </aside>
  );
}
