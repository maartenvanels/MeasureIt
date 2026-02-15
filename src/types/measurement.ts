export type MeasurementType = 'reference' | 'measure' | 'angle' | 'area' | 'annotation' | 'reference3d' | 'measure3d';
export type DrawMode =
  | 'none'
  | 'reference' | 'measure' | 'angle'
  | 'area' | 'area-polygon' | 'area-freehand' | 'area-circle-3pt' | 'area-circle-center'
  | 'annotation'
  | 'reference3d' | 'measure3d';
export type ViewMode = '2d' | '3d';
export type Unit = 'mm' | 'cm' | 'm' | 'in' | 'px';

export type AreaKind = 'polygon' | 'freehand' | 'circle-3pt' | 'circle-center';

/** Check if a DrawMode is any area sub-mode */
export function isAreaMode(mode: DrawMode): boolean {
  return mode === 'area' || mode.startsWith('area-');
}

/** Get the category of a DrawMode */
export function modeCategory(mode: DrawMode): string {
  if (mode === 'none') return 'none';
  if (isAreaMode(mode)) return 'area';
  if (mode === 'reference' || mode === 'measure' || mode === 'angle') return 'measure';
  if (mode === 'annotation') return 'annotate';
  if (mode.endsWith('3d')) return '3d';
  return 'other';
}

export interface Point {
  x: number;
  y: number;
}

export interface Point3D {
  x: number;
  y: number;
  z: number;
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
  areaKind: AreaKind;
  points: Point[];
  pixelArea: number;
  name: string;
  createdAt: number;
  color?: string;
  unitOverride?: Unit;
  labelOffset?: Point;
  nameLabelOffset?: Point;
  fontSize?: number;
  // Circle-specific fields (only for circle-3pt and circle-center)
  center?: Point;
  radius?: number;
}

export interface Annotation {
  id: string;
  type: 'annotation';
  position: Point;
  content: string;
  name?: string;
  color?: string;
  createdAt: number;
  fontSize?: number;
  arrowTarget?: Point;
}

export interface Measurement3D {
  id: string;
  type: 'reference3d' | 'measure3d';
  start: Point3D;
  end: Point3D;
  distance: number;
  name: string;
  createdAt: number;
  color?: string;
  unitOverride?: Unit;
  fontSize?: number;
  labelOffset?: Point;
  nameLabelOffset?: Point;
}

export type AnyMeasurement = Measurement | AngleMeasurement | AreaMeasurement | Annotation | Measurement3D;

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
