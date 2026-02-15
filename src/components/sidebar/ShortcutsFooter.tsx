export function ShortcutsFooter() {
  return (
    <div className="border-t border-border px-4 py-3 text-xs leading-relaxed text-muted-foreground/50">
      <span className="font-medium text-muted-foreground">Shortcuts</span>
      <div className="mt-1.5 grid grid-cols-2 gap-x-4 gap-y-0.5">
        <span>
          <kbd className="rounded bg-accent px-1 py-0.5 text-muted-foreground">R</kbd>{' '}
          Reference
        </span>
        <span>
          <kbd className="rounded bg-accent px-1 py-0.5 text-muted-foreground">M</kbd>{' '}
          Measure
        </span>
        <span>
          <kbd className="rounded bg-accent px-1 py-0.5 text-muted-foreground">A</kbd>{' '}
          Angle
        </span>
        <span>
          <kbd className="rounded bg-accent px-1 py-0.5 text-muted-foreground">P</kbd>{' '}
          Area
        </span>
        <span>
          <kbd className="rounded bg-accent px-1 py-0.5 text-muted-foreground">Scroll</kbd>{' '}
          Zoom
        </span>
        <span>
          <kbd className="rounded bg-accent px-1 py-0.5 text-muted-foreground">MMB</kbd>{' '}
          Pan
        </span>
        <span>
          <kbd className="rounded bg-accent px-1 py-0.5 text-muted-foreground">Shift</kbd>{' '}
          Snap H/V
        </span>
        <span>
          <kbd className="rounded bg-accent px-1 py-0.5 text-muted-foreground">Del</kbd>{' '}
          Delete
        </span>
        <span>
          <kbd className="rounded bg-accent px-1 py-0.5 text-muted-foreground">^Z</kbd>{' '}
          Undo
        </span>
        <span>
          <kbd className="rounded bg-accent px-1 py-0.5 text-muted-foreground">^⇧Z</kbd>{' '}
          Redo
        </span>
      </div>
    </div>
  );
}
