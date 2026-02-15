# MeasureIt

Browser-based image measurement tool. Load image, set reference scale, draw measurements with real-world units.

## Commands

```bash
bun install && bun run dev    # Dev server → localhost:3000
bun run test                  # Vitest tests
bun run build                 # Production build
```

## Stack

Next.js 16 (App Router), React 19, Zustand 5, Tailwind 4, shadcn/ui, Canvas 2D, KaTeX, Vitest. Package manager: Bun 1.3.5.

## Architecture

Three Zustand stores: `useMeasurementStore` (measurements + undo/redo), `useUIStore` (mode, selection, dialogs), `useCanvasStore` (image, transform, drawing state).

Dual-canvas rendering: image layer + overlay layer, with HTML overlays for labels and annotations. Rendering triggered by store subscriptions in `useCanvasRenderer`.

Two coordinate spaces: **image space** (stored) and **screen space** (rendered). Convert via `screenToImage()`/`imageToScreen()` in `lib/geometry.ts`.

Discriminated union `AnyMeasurement` with `type` field: `'reference' | 'measure' | 'angle' | 'area' | 'annotation'`.

## Conventions

- `@/` path alias maps to `src/`
- Stores: `use{Name}Store`, Hooks: `use{Feature}`
- Immutable state updates, undo/redo via past/future snapshots
- Tests in `__tests__/` dirs, node environment, global imports
- One reference measurement at a time (new replaces old)
- Shift constrains to axis, snap-to-point at 12px threshold
