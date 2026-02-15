# Hooks

## useCanvasInteraction

Central event handler for all pointer/touch events on the canvas. Handles: line drawing, angle placement (3-step), area polygon, panning (middle-click), pinch zoom, label dragging, arrow target dragging, snap-to-point, crop rectangle. Routes behavior based on current `DrawMode`.

## useCanvasRenderer

Subscribes to all three Zustand stores. On any change, calls `renderImage()` + `renderOverlay()` from `canvas-rendering.ts`. Collects label bounds for hit-testing.

## useKeyboardShortcuts

Global keydown listener. Mode toggles (R/M/A/P/T/C), Escape to cancel, Ctrl+Z/Ctrl+Shift+Z for undo/redo, Delete for removing selected. Skips events in input fields.

## useImageLoader

Image loading from file input, drag-and-drop, or clipboard paste. Creates `HTMLImageElement` and calls `fitImageToContainer()`.

## useExport

Wrappers for the four export formats (CSV, JSON, clipboard, annotated PNG).

## useLocalStorage

Project save/load/list/delete via `localStorage`. Serializes measurements + reference config.
