export type MeasurementType = 'reference' | 'measure';
export type DrawMode = 'none' | 'reference' | 'measure';
export type Unit = 'mm' | 'cm' | 'm' | 'in' | 'px';

export interface Point {
  x: number;
  y: number;
}

export interface Measurement {
  id: string;
  type: MeasurementType;
  start: Point;
  end: Point;
  pixelLength: number;
  name: string;
  createdAt: number;
}

export interface ViewTransform {
  panX: number;
  panY: number;
  zoom: number;
}

export interface CanvasSize {
  width: number;
  height: number;
}

export interface MeasurementExport {
  name: string;
  type: MeasurementType;
  pixelLength: number;
  realValue: number | null;
  unit: Unit;
  coordinates: { x1: number; y1: number; x2: number; y2: number };
}
