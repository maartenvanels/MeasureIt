export type MeasurementType = 'reference' | 'measure' | 'angle' | 'area' | 'annotation';
export type DrawMode = 'none' | 'reference' | 'measure' | 'angle' | 'area' | 'annotation';
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
  color?: string;
  unitOverride?: Unit;
  labelOffset?: Point;
  nameLabelOffset?: Point;
  fontSize?: number;
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
  color?: string;
  labelOffset?: Point;
  nameLabelOffset?: Point;
  fontSize?: number;
}

export interface AreaMeasurement {
  id: string;
  type: 'area';
  points: Point[];
  pixelArea: number;
  name: string;
  createdAt: number;
  color?: string;
  unitOverride?: Unit;
  labelOffset?: Point;
  nameLabelOffset?: Point;
  fontSize?: number;
}

export interface Annotation {
  id: string;
  type: 'annotation';
  position: Point;
  content: string;
  name?: string;
  color?: string;
  createdAt: number;
}

export type AnyMeasurement = Measurement | AngleMeasurement | AreaMeasurement | Annotation;

export interface LabelBounds {
  measurementId: string;
  labelType: 'value' | 'name';
  x: number;
  y: number;
  w: number;
  h: number;
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

export interface SavedProject {
  id: string;
  name: string;
  measurements: AnyMeasurement[];
  referenceValue: number;
  referenceUnit: Unit;
  updatedAt: number;
}
