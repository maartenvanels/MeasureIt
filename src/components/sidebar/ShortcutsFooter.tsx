export function ShortcutsFooter() {
  return (
    <div className="border-t border-zinc-800 px-4 py-3 text-xs leading-relaxed text-zinc-600">
      <span className="font-medium text-zinc-500">Shortcuts</span>
      <div className="mt-1.5 grid grid-cols-2 gap-x-4 gap-y-0.5">
        <span>
          <kbd className="rounded bg-zinc-800 px-1 py-0.5 text-zinc-400">R</kbd>{' '}
          Reference
        </span>
        <span>
          <kbd className="rounded bg-zinc-800 px-1 py-0.5 text-zinc-400">M</kbd>{' '}
          Measure
        </span>
        <span>
          <kbd className="rounded bg-zinc-800 px-1 py-0.5 text-zinc-400">A</kbd>{' '}
          Angle
        </span>
        <span>
          <kbd className="rounded bg-zinc-800 px-1 py-0.5 text-zinc-400">P</kbd>{' '}
          Area
        </span>
        <span>
          <kbd className="rounded bg-zinc-800 px-1 py-0.5 text-zinc-400">Scroll</kbd>{' '}
          Zoom
        </span>
        <span>
          <kbd className="rounded bg-zinc-800 px-1 py-0.5 text-zinc-400">MMB</kbd>{' '}
          Pan
        </span>
        <span>
          <kbd className="rounded bg-zinc-800 px-1 py-0.5 text-zinc-400">Shift</kbd>{' '}
          Snap H/V
        </span>
        <span>
          <kbd className="rounded bg-zinc-800 px-1 py-0.5 text-zinc-400">Del</kbd>{' '}
          Delete
        </span>
        <span>
          <kbd className="rounded bg-zinc-800 px-1 py-0.5 text-zinc-400">^Z</kbd>{' '}
          Undo
        </span>
        <span>
          <kbd className="rounded bg-zinc-800 px-1 py-0.5 text-zinc-400">^⇧Z</kbd>{' '}
          Redo
        </span>
      </div>
    </div>
  );
}
