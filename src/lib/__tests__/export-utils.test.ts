import { describe, it, expect } from 'vitest';
import { generateCSV, generateJSON, generateClipboardText, buildSimpleResolver } from '../export-utils';
import { Measurement, AngleMeasurement, AreaMeasurement, Annotation, AnyMeasurement } from '@/types/measurement';

const ref: Measurement = {
  id: 'ref', type: 'reference',
  start: { x: 0, y: 0 }, end: { x: 100, y: 0 },
  pixelLength: 100, name: 'Reference', createdAt: 0,
};

const measure: Measurement = {
  id: 'm1', type: 'measure',
  start: { x: 0, y: 0 }, end: { x: 200, y: 0 },
  pixelLength: 200, name: 'Wall', createdAt: 0,
};

const angle: AngleMeasurement = {
  id: 'a1', type: 'angle',
  vertex: { x: 0, y: 0 }, armA: { x: 10, y: 0 }, armB: { x: 0, y: 10 },
  angleDeg: 90, name: 'Corner', createdAt: 0,
};

const area: AreaMeasurement = {
  id: 'ar1', type: 'area',
  points: [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }, { x: 0, y: 10 }],
  pixelArea: 100, name: 'Floor', createdAt: 0,
};

const annotation: Annotation = {
  id: 'ann1', type: 'annotation',
  position: { x: 50, y: 50 }, content: 'Note: check this', createdAt: 0,
};

const resolve = buildSimpleResolver(100, 'mm', ref);
const resolveNoRef = buildSimpleResolver(100, 'mm');

describe('generateCSV', () => {
  it('generates header row', () => {
    const csv = generateCSV([], resolveNoRef);
    expect(csv).toContain('Name,Type,Object,Surface,Value,Unit');
  });

  it('includes reference measurement', () => {
    const csv = generateCSV([ref], resolve);
    expect(csv).toContain('"Reference"');
    expect(csv).toContain('reference');
  });

  it('includes regular measurement with real value', () => {
    const csv = generateCSV([ref, measure], resolve);
    expect(csv).toContain('"Wall"');
    expect(csv).toContain('measure');
    expect(csv).toContain('"200.00"');
    expect(csv).toContain(',mm,');
  });

  it('includes angle measurement', () => {
    const csv = generateCSV([angle], resolveNoRef);
    expect(csv).toContain('"Corner"');
    expect(csv).toContain('angle');
    expect(csv).toContain('90.00');
  });

  it('includes area measurement', () => {
    const csv = generateCSV([ref, area], resolve);
    expect(csv).toContain('"Floor"');
    expect(csv).toContain('area');
  });

  it('includes annotation content', () => {
    const csv = generateCSV([annotation], resolveNoRef);
    expect(csv).toContain('annotation');
    expect(csv).toContain('Note: check this');
  });
});

describe('generateJSON', () => {
  it('generates valid JSON', () => {
    const json = generateJSON([ref, measure], resolve);
    const parsed = JSON.parse(json);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed).toHaveLength(2);
  });

  it('includes measurement coordinates', () => {
    const json = generateJSON([measure], resolve);
    const parsed = JSON.parse(json);
    expect(parsed[0].coordinates).toBeDefined();
    expect(parsed[0].coordinates.x1).toBe(0);
    expect(parsed[0].coordinates.x2).toBe(200);
  });

  it('includes angle data', () => {
    const json = generateJSON([angle], resolveNoRef);
    const parsed = JSON.parse(json);
    expect(parsed[0].angleDeg).toBeCloseTo(90);
    expect(parsed[0].coordinates.vertex).toBeDefined();
  });

  it('includes area data', () => {
    const json = generateJSON([area], resolve);
    const parsed = JSON.parse(json);
    expect(parsed[0].points).toHaveLength(4);
    expect(parsed[0].pixelArea).toBe(100);
  });

  it('includes annotation data', () => {
    const json = generateJSON([annotation], resolveNoRef);
    const parsed = JSON.parse(json);
    expect(parsed[0].type).toBe('annotation');
    expect(parsed[0].content).toBe('Note: check this');
  });

  it('calculates real values when reference is available', () => {
    const json = generateJSON([measure], resolve);
    const parsed = JSON.parse(json);
    expect(parsed[0].realValue).toBeCloseTo(200);
  });

  it('returns null realValue without reference', () => {
    const json = generateJSON([measure], resolveNoRef);
    const parsed = JSON.parse(json);
    expect(parsed[0].realValue).toBeNull();
  });
});

describe('generateClipboardText', () => {
  it('starts with header', () => {
    const text = generateClipboardText([], resolveNoRef);
    expect(text).toContain('Measurements:');
  });

  it('includes measurement with value', () => {
    const text = generateClipboardText([ref, measure], resolve);
    expect(text).toContain('Wall');
    expect(text).toContain('200.00 mm');
  });

  it('includes angle', () => {
    const text = generateClipboardText([angle], resolveNoRef);
    expect(text).toContain('Corner');
    expect(text).toContain('90.0°');
  });

  it('includes annotation', () => {
    const text = generateClipboardText([annotation], resolveNoRef);
    expect(text).toContain('[Note]');
    expect(text).toContain('Note: check this');
  });

  it('shows pixel value when no reference', () => {
    const text = generateClipboardText([measure], resolveNoRef);
    expect(text).toContain('200.0 px');
  });
});
