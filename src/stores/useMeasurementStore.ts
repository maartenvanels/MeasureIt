import { create } from 'zustand';
import { Measurement, AngleMeasurement, AreaMeasurement, Annotation, AnyMeasurement, Unit } from '@/types/measurement';

interface MeasurementState {
  measurements: AnyMeasurement[];
  referenceValue: number;
  referenceUnit: Unit;
  past: AnyMeasurement[][];
  future: AnyMeasurement[][];

  addMeasurement: (m: Measurement) => void;
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
  getMeasureCount: () => number;
  getAngleCount: () => number;
  getAreaCount: () => number;
  getAnnotationCount: () => number;
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
  getMeasureCount: () => get().measurements.filter((m) => m.type === 'measure').length,
  getAngleCount: () => get().measurements.filter((m) => m.type === 'angle').length,
  getAreaCount: () => get().measurements.filter((m) => m.type === 'area').length,
  getAnnotationCount: () => get().measurements.filter((m) => m.type === 'annotation').length,
}));
