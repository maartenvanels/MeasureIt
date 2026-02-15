# Lib — Pure Utility Functions

## geometry.ts

Coordinate math: `screenToImage()`/`imageToScreen()` for coordinate conversion, `snapToAxis()` (shift-constrain), `pixelDist()`, `calcAngleDeg()` (dot product), `calcPolygonArea()` (Shoelace formula), `findSnapPoint()` (nearest endpoint within 12px screen threshold).

## calculations.ts

Unit conversion through millimeter base (`mm:1, cm:10, m:1000, in:25.4`). `calcRealDistance()` converts pixel length to real-world value using reference measurement. Area scales quadratically.

## canvas-rendering.ts

All Canvas 2D draw functions: `renderImage()`, `renderOverlay()`, `drawMeasurementLine()`, `drawAngleMeasurement()`, `drawAreaMeasurement()`, `drawLabel()` (returns bounds for hit-testing). `drawInProgress*()` variants for active drawing feedback.

## export-utils.ts

Four export formats: CSV, JSON, clipboard text, annotated PNG. Image export draws measurements onto offscreen canvas and renders LaTeX names via SVG foreignObject.

## latex-export.ts

`renderNameLabelImage()` converts label text with `$...$` LaTeX to an HTMLImageElement. Embeds KaTeX CSS+fonts as base64 data URIs in SVG foreignObject. 2x upscale for quality.
