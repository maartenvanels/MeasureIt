export type MeasurementType = 'reference' | 'measure' | 'angle';
export type DrawMode = 'none' | 'reference' | 'measure' | 'angle';
export type Unit = 'mm' | 'cm' | 'm' | 'in' | 'px';

export interface Point {
  x: number;
  y: number;
}

export interface Measurement {
  id: string;
  type: 'reference' | 'measure';
  start: Point;
  end: Point;
  pixelLength: number;
  name: string;
  createdAt: number;
}

export interface AngleMeasurement {
  id: string;
  type: 'angle';
  vertex: Point;
  armA: Point;
  armB: Point;
  angleDeg: number;
  name: string;
  createdAt: number;
}

export type AnyMeasurement = Measurement | AngleMeasurement;

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

export interface SavedProject {
  id: string;
  name: string;
  measurements: AnyMeasurement[];
  referenceValue: number;
  referenceUnit: Unit;
  updatedAt: number;
}
