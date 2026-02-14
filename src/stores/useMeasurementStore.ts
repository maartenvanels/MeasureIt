import { create } from 'zustand';
import { Measurement, Unit } from '@/types/measurement';

interface MeasurementState {
  measurements: Measurement[];
  referenceValue: number;
  referenceUnit: Unit;
  past: Measurement[][];
  future: Measurement[][];

  addMeasurement: (m: Measurement) => void;
  removeMeasurement: (id: string) => void;
  renameMeasurement: (id: string, name: string) => void;
  setReferenceValue: (value: number) => void;
  setReferenceUnit: (unit: Unit) => void;
  clearAll: () => void;
  undo: () => void;
  redo: () => void;
  getReference: () => Measurement | undefined;
  getMeasureCount: () => number;
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

  getReference: () => get().measurements.find((m) => m.type === 'reference'),
  getMeasureCount: () => get().measurements.filter((m) => m.type === 'measure').length,
}));
