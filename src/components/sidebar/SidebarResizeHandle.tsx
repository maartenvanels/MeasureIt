'use client';

import { useCallback, useRef } from 'react';
import { useUIStore } from '@/stores/useUIStore';

export function SidebarResizeHandle() {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const setSidebarWidth = useUIStore((s) => s.setSidebarWidth);
  const dragging = useRef(false);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      dragging.current = true;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    },
    []
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging.current) return;
      const newWidth = window.innerWidth - e.clientX;
      setSidebarWidth(newWidth);
    },
    [setSidebarWidth]
  );

  const handlePointerUp = useCallback(() => {
    dragging.current = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  if (!sidebarOpen) return null;

  return (
    <div
      className="w-1 cursor-col-resize bg-border hover:bg-muted-foreground active:bg-muted-foreground/80 transition-colors flex-shrink-0"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    />
  );
}
