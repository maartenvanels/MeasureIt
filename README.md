# MeasureIt

**Measure anything from a photo.** Set one known reference dimension, then measure distances, angles, and areas — all in your browser.

> [Try it live](https://measure-it-omega.vercel.app) — no signup, no install, your data never leaves your browser.

## Features

- **Reference-based scaling** — draw a line over a known dimension, and all other measurements are calculated in real-world units
- **Distance measurements** — measure lengths with automatic unit conversion (mm, cm, m, in)
- **Angle measurements** — three-point angle calculation
- **Area measurements** — polygon-based area with quadratic unit scaling
- **Annotations** — text labels with optional leader arrows, supports Markdown and LaTeX
- **Grid overlay** — configurable grid with snap-to-grid during drawing
- **Image cropping** — crop to focus on a specific region
- **Export** — CSV, JSON, clipboard text, and annotated PNG
- **Undo/redo** — full 50-level history
- **Keyboard shortcuts** — R, M, A, P, T for modes; Shift to constrain to axis
- **Touch support** — pinch-to-zoom, tap-to-measure on mobile
- **PWA** — installable, works offline

## Quick Start

```bash
# Prerequisites: Bun 1.3.5+
bun install
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Tech Stack

- [Next.js 16](https://nextjs.org/) (App Router) + [React 19](https://react.dev/)
- [Zustand 5](https://zustand.docs.pmnd.rs/) for state management
- [Tailwind CSS 4](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
- Canvas 2D API (dual-layer rendering)
- [KaTeX](https://katex.org/) for LaTeX rendering
- [Vitest](https://vitest.dev/) for testing

## Project Structure

```
src/
├── app/            # Next.js App Router pages
├── components/     # React components (canvas, toolbar, sidebar, dialogs, ui)
├── hooks/          # Custom React hooks (canvas interaction, rendering, export)
├── lib/            # Utilities (geometry, calculations, canvas rendering, export)
├── stores/         # Zustand stores (measurements, UI, canvas)
└── types/          # TypeScript type definitions
```

Three Zustand stores manage all state:
- **useMeasurementStore** — measurements, reference value/unit, undo/redo
- **useUIStore** — drawing mode, UI state, grid settings
- **useCanvasStore** — image, canvas transform, drawing lifecycle

## Testing

```bash
bun run test          # Run all tests
bun run test:watch    # Watch mode
```

## Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

[MIT](LICENSE) — free for personal and commercial use.
