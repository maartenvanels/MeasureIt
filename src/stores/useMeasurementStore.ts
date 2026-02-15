import { create } from 'zustand';
import { Measurement, Measurement3D, AngleMeasurement, AreaMeasurement, Annotation, AnyMeasurement, Unit } from '@/types/measurement';

interface MeasurementState {
  measurements: AnyMeasurement[];
  referenceValue: number;
  referenceUnit: Unit;
  past: AnyMeasurement[][];
  future: AnyMeasurement[][];

  addMeasurement: (m: Measurement) => void;
  addMeasurement3D: (m: Measurement3D) => void;
  addAngle: (a: AngleMeasurement) => void;
  addArea: (a: AreaMeasurement) => void;
  addAnnotation: (a: Annotation) => void;
  updateMeasurement: (id: string, patch: Record<string, unknown>) => void;
  removeMeasurement: (id: string) => void;
  renameMeasurement: (id: string, name: string) => void;
  setReferenceValue: (value: number) => void;
  setReferenceUnit: (unit: Unit) => void;
  clearAll: () => void;
  undo: () => void;
  redo: () => void;
  getReference: () => Measurement | undefined;
  getReference3D: () => Measurement3D | undefined;
  getMeasureCount: () => number;
  getMeasure3DCount: () => number;
  getAngleCount: () => number;
  getAreaCount: () => number;
  getAnnotationCount: () => number;
  adjustAllCoordinates: (dx: number, dy: number) => void;
}

export const useMeasurementStore = create<MeasurementState>((set, get) => ({
  measurements: [],
  referenceValue: 100,
  referenceUnit: 'mm',
  past: [],
  future: [],

  addMeasurement: (m) => {
    const { measurements } = get();
    const past = [...get().past, [...measurements]].slice(-50);

    if (m.type === 'reference') {
      set({
        measurements: [m, ...measurements.filter((x) => x.type !== 'reference')],
        past,
        future: [],
      });
    } else {
      set({
        measurements: [...measurements, m],
        past,
        future: [],
      });
    }
  },

  addMeasurement3D: (m) => {
    const { measurements } = get();
    const past = [...get().past, [...measurements]].slice(-50);

    if (m.type === 'reference3d') {
      set({
        measurements: [m, ...measurements.filter((x) => x.type !== 'reference3d')],
        past,
        future: [],
      });
    } else {
      set({
        measurements: [...measurements, m],
        past,
        future: [],
      });
    }
  },

  addAngle: (a) => {
    const { measurements } = get();
    const past = [...get().past, [...measurements]].slice(-50);
    set({
      measurements: [...measurements, a],
      past,
      future: [],
    });
  },

  addArea: (a) => {
    const { measurements } = get();
    const past = [...get().past, [...measurements]].slice(-50);
    set({ measurements: [...measurements, a], past, future: [] });
  },

  addAnnotation: (a) => {
    const { measurements } = get();
    const past = [...get().past, [...measurements]].slice(-50);
    set({ measurements: [...measurements, a], past, future: [] });
  },

  updateMeasurement: (id, patch) => {
    const { measurements } = get();
    const past = [...get().past, [...measurements]].slice(-50);
    set({
      measurements: measurements.map((m) =>
        m.id === id ? { ...m, ...patch } as AnyMeasurement : m
      ),
      past,
      future: [],
    });
  },

  removeMeasurement: (id) => {
    const { measurements } = get();
    const past = [...get().past, [...measurements]].slice(-50);
    set({
      measurements: measurements.filter((m) => m.id !== id),
      past,
      future: [],
    });
  },

  renameMeasurement: (id, name) => {
    set({
      measurements: get().measurements.map((m) =>
        m.id === id ? { ...m, name } : m
      ),
    });
  },

  setReferenceValue: (value) => set({ referenceValue: value }),
  setReferenceUnit: (unit) => set({ referenceUnit: unit }),

  clearAll: () => {
    const { measurements } = get();
    if (measurements.length === 0) return;
    const past = [...get().past, [...measurements]].slice(-50);
    set({ measurements: [], past, future: [] });
  },

  undo: () => {
    const { past, measurements, future } = get();
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    set({
      measurements: previous,
      past: past.slice(0, -1),
      future: [measurements, ...future].slice(0, 50),
    });
  },

  redo: () => {
    const { past, measurements, future } = get();
    if (future.length === 0) return;
    const next = future[0];
    set({
      measurements: next,
      past: [...past, measurements].slice(-50),
      future: future.slice(1),
    });
  },

  getReference: () => get().measurements.find((m): m is Measurement => m.type === 'reference'),
  getReference3D: () => get().measurements.find((m): m is Measurement3D => m.type === 'reference3d'),
  getMeasureCount: () => get().measurements.filter((m) => m.type === 'measure').length,
  getMeasure3DCount: () => get().measurements.filter((m) => m.type === 'measure3d').length,
  getAngleCount: () => get().measurements.filter((m) => m.type === 'angle').length,
  getAreaCount: () => get().measurements.filter((m) => m.type === 'area').length,
  getAnnotationCount: () => get().measurements.filter((m) => m.type === 'annotation').length,

  adjustAllCoordinates: (dx, dy) => {
    const { measurements } = get();
    const past = [...get().past, [...measurements]].slice(-50);
    const adjusted = measurements.map((m) => {
      if (m.type === 'annotation') {
        return {
          ...m,
          position: { x: m.position.x + dx, y: m.position.y + dy },
          ...(m.arrowTarget ? { arrowTarget: { x: m.arrowTarget.x + dx, y: m.arrowTarget.y + dy } } : {}),
        };
      }
      if (m.type === 'angle') {
        return {
          ...m,
          vertex: { x: m.vertex.x + dx, y: m.vertex.y + dy },
          armA: { x: m.armA.x + dx, y: m.armA.y + dy },
          armB: { x: m.armB.x + dx, y: m.armB.y + dy },
        };
      }
      if (m.type === 'area') {
        return {
          ...m,
          points: m.points.map((p) => ({ x: p.x + dx, y: p.y + dy })),
        };
      }
      // 3D measurements are not affected by 2D coordinate adjustments
      if (m.type === 'reference3d' || m.type === 'measure3d') {
        return m;
      }
      return {
        ...m,
        start: { x: m.start.x + dx, y: m.start.y + dy },
        end: { x: m.end.x + dx, y: m.end.y + dy },
      };
    }) as AnyMeasurement[];
    set({ measurements: adjusted, past, future: [] });
  },
}));
