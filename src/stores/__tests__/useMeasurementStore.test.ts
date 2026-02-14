import { describe, it, expect, beforeEach } from 'vitest';
import { useMeasurementStore } from '../useMeasurementStore';
import { Measurement, AngleMeasurement, AreaMeasurement, Annotation } from '@/types/measurement';

// Reset store before each test
beforeEach(() => {
  useMeasurementStore.setState({
    measurements: [],
    referenceValue: 100,
    referenceUnit: 'mm',
    past: [],
    future: [],
  });
});

const makeMeasurement = (overrides?: Partial<Measurement>): Measurement => ({
  id: crypto.randomUUID(),
  type: 'measure',
  start: { x: 0, y: 0 },
  end: { x: 100, y: 0 },
  pixelLength: 100,
  name: 'M1',
  createdAt: Date.now(),
  ...overrides,
});

const makeReference = (): Measurement => ({
  id: 'ref-1',
  type: 'reference',
  start: { x: 0, y: 0 },
  end: { x: 200, y: 0 },
  pixelLength: 200,
  name: 'Reference',
  createdAt: Date.now(),
});

const makeAngle = (): AngleMeasurement => ({
  id: crypto.randomUUID(),
  type: 'angle',
  vertex: { x: 0, y: 0 },
  armA: { x: 10, y: 0 },
  armB: { x: 0, y: 10 },
  angleDeg: 90,
  name: 'Angle 1',
  createdAt: Date.now(),
});

const makeArea = (): AreaMeasurement => ({
  id: crypto.randomUUID(),
  type: 'area',
  points: [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }, { x: 0, y: 10 }],
  pixelArea: 100,
  name: 'Area 1',
  createdAt: Date.now(),
});

const makeAnnotation = (): Annotation => ({
  id: crypto.randomUUID(),
  type: 'annotation',
  position: { x: 50, y: 50 },
  content: 'Test note',
  createdAt: Date.now(),
});

describe('useMeasurementStore', () => {
  describe('addMeasurement', () => {
    it('adds a measurement to the list', () => {
      const m = makeMeasurement();
      useMeasurementStore.getState().addMeasurement(m);
      expect(useMeasurementStore.getState().measurements).toHaveLength(1);
      expect(useMeasurementStore.getState().measurements[0]).toEqual(m);
    });

    it('places reference at the beginning', () => {
      const m = makeMeasurement();
      useMeasurementStore.getState().addMeasurement(m);
      const ref = makeReference();
      useMeasurementStore.getState().addMeasurement(ref);
      const measurements = useMeasurementStore.getState().measurements;
      expect(measurements[0].type).toBe('reference');
      expect(measurements[1].type).toBe('measure');
    });

    it('replaces existing reference', () => {
      const ref1 = makeReference();
      useMeasurementStore.getState().addMeasurement(ref1);
      const ref2: Measurement = { ...makeReference(), id: 'ref-2' };
      useMeasurementStore.getState().addMeasurement(ref2);
      const refs = useMeasurementStore.getState().measurements.filter(m => m.type === 'reference');
      expect(refs).toHaveLength(1);
      expect(refs[0].id).toBe('ref-2');
    });

    it('pushes to undo history', () => {
      useMeasurementStore.getState().addMeasurement(makeMeasurement());
      expect(useMeasurementStore.getState().past).toHaveLength(1);
    });

    it('clears redo future', () => {
      useMeasurementStore.getState().addMeasurement(makeMeasurement());
      useMeasurementStore.getState().undo();
      expect(useMeasurementStore.getState().future).toHaveLength(1);
      useMeasurementStore.getState().addMeasurement(makeMeasurement());
      expect(useMeasurementStore.getState().future).toHaveLength(0);
    });
  });

  describe('addAngle', () => {
    it('adds an angle measurement', () => {
      const a = makeAngle();
      useMeasurementStore.getState().addAngle(a);
      expect(useMeasurementStore.getState().measurements).toHaveLength(1);
      expect(useMeasurementStore.getState().measurements[0].type).toBe('angle');
    });
  });

  describe('addArea', () => {
    it('adds an area measurement', () => {
      const area = makeArea();
      useMeasurementStore.getState().addArea(area);
      expect(useMeasurementStore.getState().measurements).toHaveLength(1);
      expect(useMeasurementStore.getState().measurements[0].type).toBe('area');
    });
  });

  describe('addAnnotation', () => {
    it('adds an annotation', () => {
      const ann = makeAnnotation();
      useMeasurementStore.getState().addAnnotation(ann);
      expect(useMeasurementStore.getState().measurements).toHaveLength(1);
      expect(useMeasurementStore.getState().measurements[0].type).toBe('annotation');
    });
  });

  describe('updateMeasurement', () => {
    it('patches a measurement by id', () => {
      const m = makeMeasurement({ name: 'Old' });
      useMeasurementStore.getState().addMeasurement(m);
      useMeasurementStore.getState().updateMeasurement(m.id, { name: 'New' });
      expect(useMeasurementStore.getState().measurements[0].name).toBe('New');
    });

    it('does not affect other measurements', () => {
      const m1 = makeMeasurement({ name: 'First' });
      const m2 = makeMeasurement({ name: 'Second' });
      useMeasurementStore.getState().addMeasurement(m1);
      useMeasurementStore.getState().addMeasurement(m2);
      useMeasurementStore.getState().updateMeasurement(m1.id, { name: 'Updated' });
      expect(useMeasurementStore.getState().measurements[1].name).toBe('Second');
    });
  });

  describe('removeMeasurement', () => {
    it('removes a measurement by id', () => {
      const m = makeMeasurement();
      useMeasurementStore.getState().addMeasurement(m);
      useMeasurementStore.getState().removeMeasurement(m.id);
      expect(useMeasurementStore.getState().measurements).toHaveLength(0);
    });

    it('pushes to undo history', () => {
      const m = makeMeasurement();
      useMeasurementStore.getState().addMeasurement(m);
      const pastBefore = useMeasurementStore.getState().past.length;
      useMeasurementStore.getState().removeMeasurement(m.id);
      expect(useMeasurementStore.getState().past.length).toBe(pastBefore + 1);
    });
  });

  describe('renameMeasurement', () => {
    it('renames a measurement', () => {
      const m = makeMeasurement({ name: 'Old' });
      useMeasurementStore.getState().addMeasurement(m);
      useMeasurementStore.getState().renameMeasurement(m.id, 'New Name');
      expect(useMeasurementStore.getState().measurements[0].name).toBe('New Name');
    });
  });

  describe('undo / redo', () => {
    it('undoes the last action', () => {
      const m = makeMeasurement();
      useMeasurementStore.getState().addMeasurement(m);
      expect(useMeasurementStore.getState().measurements).toHaveLength(1);
      useMeasurementStore.getState().undo();
      expect(useMeasurementStore.getState().measurements).toHaveLength(0);
    });

    it('redoes after undo', () => {
      const m = makeMeasurement();
      useMeasurementStore.getState().addMeasurement(m);
      useMeasurementStore.getState().undo();
      useMeasurementStore.getState().redo();
      expect(useMeasurementStore.getState().measurements).toHaveLength(1);
    });

    it('does nothing when undo stack is empty', () => {
      useMeasurementStore.getState().undo();
      expect(useMeasurementStore.getState().measurements).toHaveLength(0);
    });

    it('does nothing when redo stack is empty', () => {
      useMeasurementStore.getState().redo();
      expect(useMeasurementStore.getState().measurements).toHaveLength(0);
    });

    it('supports multiple undos', () => {
      useMeasurementStore.getState().addMeasurement(makeMeasurement({ name: 'M1' }));
      useMeasurementStore.getState().addMeasurement(makeMeasurement({ name: 'M2' }));
      useMeasurementStore.getState().addMeasurement(makeMeasurement({ name: 'M3' }));
      expect(useMeasurementStore.getState().measurements).toHaveLength(3);
      useMeasurementStore.getState().undo();
      expect(useMeasurementStore.getState().measurements).toHaveLength(2);
      useMeasurementStore.getState().undo();
      expect(useMeasurementStore.getState().measurements).toHaveLength(1);
    });
  });

  describe('clearAll', () => {
    it('removes all measurements', () => {
      useMeasurementStore.getState().addMeasurement(makeMeasurement());
      useMeasurementStore.getState().addAngle(makeAngle());
      useMeasurementStore.getState().clearAll();
      expect(useMeasurementStore.getState().measurements).toHaveLength(0);
    });

    it('does nothing when already empty', () => {
      const pastBefore = useMeasurementStore.getState().past.length;
      useMeasurementStore.getState().clearAll();
      expect(useMeasurementStore.getState().past.length).toBe(pastBefore);
    });

    it('is undoable', () => {
      useMeasurementStore.getState().addMeasurement(makeMeasurement());
      useMeasurementStore.getState().addAngle(makeAngle());
      useMeasurementStore.getState().clearAll();
      useMeasurementStore.getState().undo();
      expect(useMeasurementStore.getState().measurements).toHaveLength(2);
    });
  });

  describe('count helpers', () => {
    it('getMeasureCount counts measure type only', () => {
      useMeasurementStore.getState().addMeasurement(makeMeasurement());
      useMeasurementStore.getState().addMeasurement(makeReference());
      useMeasurementStore.getState().addAngle(makeAngle());
      expect(useMeasurementStore.getState().getMeasureCount()).toBe(1);
    });

    it('getAngleCount counts angles', () => {
      useMeasurementStore.getState().addAngle(makeAngle());
      useMeasurementStore.getState().addAngle(makeAngle());
      expect(useMeasurementStore.getState().getAngleCount()).toBe(2);
    });

    it('getAreaCount counts areas', () => {
      useMeasurementStore.getState().addArea(makeArea());
      expect(useMeasurementStore.getState().getAreaCount()).toBe(1);
    });

    it('getAnnotationCount counts annotations', () => {
      useMeasurementStore.getState().addAnnotation(makeAnnotation());
      useMeasurementStore.getState().addAnnotation(makeAnnotation());
      expect(useMeasurementStore.getState().getAnnotationCount()).toBe(2);
    });

    it('getReference returns the reference measurement', () => {
      useMeasurementStore.getState().addMeasurement(makeReference());
      const ref = useMeasurementStore.getState().getReference();
      expect(ref).toBeDefined();
      expect(ref?.type).toBe('reference');
    });

    it('getReference returns undefined when no reference', () => {
      useMeasurementStore.getState().addMeasurement(makeMeasurement());
      expect(useMeasurementStore.getState().getReference()).toBeUndefined();
    });
  });

  describe('adjustAllCoordinates', () => {
    it('shifts line measurement coordinates', () => {
      const m = makeMeasurement({ start: { x: 10, y: 20 }, end: { x: 30, y: 40 } });
      useMeasurementStore.getState().addMeasurement(m);
      useMeasurementStore.getState().adjustAllCoordinates(-5, -10);
      const updated = useMeasurementStore.getState().measurements[0] as Measurement;
      expect(updated.start).toEqual({ x: 5, y: 10 });
      expect(updated.end).toEqual({ x: 25, y: 30 });
    });

    it('shifts angle measurement coordinates', () => {
      const a: AngleMeasurement = {
        ...makeAngle(),
        vertex: { x: 10, y: 10 }, armA: { x: 20, y: 10 }, armB: { x: 10, y: 20 },
      };
      useMeasurementStore.getState().addAngle(a);
      useMeasurementStore.getState().adjustAllCoordinates(-5, -5);
      const updated = useMeasurementStore.getState().measurements[0] as AngleMeasurement;
      expect(updated.vertex).toEqual({ x: 5, y: 5 });
      expect(updated.armA).toEqual({ x: 15, y: 5 });
      expect(updated.armB).toEqual({ x: 5, y: 15 });
    });

    it('shifts area measurement coordinates', () => {
      const area: AreaMeasurement = {
        ...makeArea(),
        points: [{ x: 10, y: 10 }, { x: 20, y: 10 }, { x: 20, y: 20 }],
      };
      useMeasurementStore.getState().addArea(area);
      useMeasurementStore.getState().adjustAllCoordinates(-10, -10);
      const updated = useMeasurementStore.getState().measurements[0] as AreaMeasurement;
      expect(updated.points).toEqual([
        { x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 },
      ]);
    });

    it('shifts annotation position', () => {
      const ann: Annotation = { ...makeAnnotation(), position: { x: 30, y: 40 } };
      useMeasurementStore.getState().addAnnotation(ann);
      useMeasurementStore.getState().adjustAllCoordinates(-10, -20);
      const updated = useMeasurementStore.getState().measurements[0] as Annotation;
      expect(updated.position).toEqual({ x: 20, y: 20 });
    });

    it('is undoable', () => {
      const m = makeMeasurement({ start: { x: 10, y: 20 }, end: { x: 30, y: 40 } });
      useMeasurementStore.getState().addMeasurement(m);
      useMeasurementStore.getState().adjustAllCoordinates(-5, -10);
      useMeasurementStore.getState().undo();
      const restored = useMeasurementStore.getState().measurements[0] as Measurement;
      expect(restored.start).toEqual({ x: 10, y: 20 });
    });
  });

  describe('setReferenceValue / setReferenceUnit', () => {
    it('updates reference value', () => {
      useMeasurementStore.getState().setReferenceValue(250);
      expect(useMeasurementStore.getState().referenceValue).toBe(250);
    });

    it('updates reference unit', () => {
      useMeasurementStore.getState().setReferenceUnit('cm');
      expect(useMeasurementStore.getState().referenceUnit).toBe('cm');
    });
  });
});
