# Canvas Components

## Dual-Canvas Pattern

`CanvasContainer` renders two stacked `<canvas>` elements:
1. **Image canvas** — background image with pan/zoom
2. **Overlay canvas** — measurements, in-progress drawings, snap indicators

All drawing functions live in `lib/canvas-rendering.ts`. Rendering is subscription-based via `useCanvasRenderer` hook.

## HTML Overlays (on top of canvas)

- **MeasurementNameOverlay** — name labels rendered as HTML (supports Markdown/LaTeX via KaTeX)
- **AnnotationOverlay** — text boxes with optional arrow to target point
- **CropConfirmOverlay** — accept/cancel buttons during crop
- **DropZone** — "drop image here" when no image loaded
- **ZoomControls** — +/- buttons

## Why HTML overlays?

Canvas text can't do Markdown/LaTeX. HTML overlays allow rich text rendering while canvas handles geometric drawing.
