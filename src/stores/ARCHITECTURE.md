# Stores

Three Zustand stores, each with a single responsibility.

## useMeasurementStore

All measurement data + undo/redo. `past[]`/`future[]` arrays (max 50 snapshots). Adding a reference replaces any existing one. `adjustAllCoordinates()` shifts all points after crop.

## useUIStore

UI mode (`DrawMode`), selection, sidebar width, dialog visibility, crop/annotation editing state. No history tracking.

## useCanvasStore

Canvas-level state: loaded image, `ViewTransform` (panX/panY/zoom), in-progress drawing for lines/angles/areas/crop, snap point, pinch zoom tracking. `finishDrawing()` returns completed line data. `placeAnglePoint()` walks through vertex→armA→armB steps.

## Access Pattern

Components use hooks. Imperative code (event handlers, render loop) uses `store.getState()`.
