import { describe, it, expect } from 'vitest';
import { convertUnit, calcRealDistance, calcRealValue, calcRealArea } from '../calculations';
import { Measurement } from '@/types/measurement';

const makeRef = (pixelLength: number): Measurement => ({
  id: 'ref', type: 'reference',
  start: { x: 0, y: 0 }, end: { x: pixelLength, y: 0 },
  pixelLength, name: 'Reference', createdAt: 0,
});

describe('convertUnit', () => {
  it('returns same value for identical units', () => {
    expect(convertUnit(100, 'mm', 'mm')).toBe(100);
    expect(convertUnit(50, 'cm', 'cm')).toBe(50);
  });

  it('converts mm to cm', () => {
    expect(convertUnit(100, 'mm', 'cm')).toBeCloseTo(10);
  });

  it('converts cm to mm', () => {
    expect(convertUnit(10, 'cm', 'mm')).toBeCloseTo(100);
  });

  it('converts mm to m', () => {
    expect(convertUnit(1000, 'mm', 'm')).toBeCloseTo(1);
  });

  it('converts in to mm', () => {
    expect(convertUnit(1, 'in', 'mm')).toBeCloseTo(25.4);
  });

  it('converts mm to in', () => {
    expect(convertUnit(25.4, 'mm', 'in')).toBeCloseTo(1);
  });

  it('converts cm to in', () => {
    expect(convertUnit(2.54, 'cm', 'in')).toBeCloseTo(1);
  });

  it('returns same value when px is involved', () => {
    expect(convertUnit(100, 'px', 'mm')).toBe(100);
    expect(convertUnit(100, 'mm', 'px')).toBe(100);
  });
});

describe('calcRealDistance', () => {
  it('returns null without reference', () => {
    expect(calcRealDistance(100, undefined, 100, 'mm')).toBeNull();
  });

  it('returns null when refValue is 0', () => {
    expect(calcRealDistance(100, makeRef(200), 0, 'mm')).toBeNull();
  });

  it('returns null when refValue is negative', () => {
    expect(calcRealDistance(100, makeRef(200), -10, 'mm')).toBeNull();
  });

  it('calculates distance with 1:1 ratio', () => {
    const ref = makeRef(100);
    const result = calcRealDistance(100, ref, 100, 'mm');
    expect(result).toBe('100.00 mm');
  });

  it('calculates distance with 2:1 ratio', () => {
    const ref = makeRef(100);
    const result = calcRealDistance(200, ref, 50, 'mm');
    expect(result).toBe('100.00 mm');
  });

  it('uses reference unit by default', () => {
    const ref = makeRef(100);
    const result = calcRealDistance(100, ref, 10, 'cm');
    expect(result).toBe('10.00 cm');
  });

  it('converts to display unit when specified', () => {
    const ref = makeRef(100);
    // 100 pixels = 100mm in ref unit, display in cm
    const result = calcRealDistance(100, ref, 100, 'mm', 'cm');
    expect(result).toBe('10.00 cm');
  });

  it('converts mm to in for display', () => {
    const ref = makeRef(100);
    // 100 pixels = 25.4mm, displayed in inches
    const result = calcRealDistance(100, ref, 25.4, 'mm', 'in');
    expect(result).toBe('1.00 in');
  });
});

describe('calcRealValue', () => {
  it('returns null without reference', () => {
    expect(calcRealValue(100, undefined, 100)).toBeNull();
  });

  it('returns null when refValue is 0', () => {
    expect(calcRealValue(100, makeRef(200), 0)).toBeNull();
  });

  it('calculates proportional value', () => {
    const ref = makeRef(100);
    expect(calcRealValue(200, ref, 50)).toBeCloseTo(100);
  });

  it('calculates exact ratio', () => {
    const ref = makeRef(200);
    expect(calcRealValue(100, ref, 100)).toBeCloseTo(50);
  });
});

describe('calcRealArea', () => {
  it('returns null without reference', () => {
    expect(calcRealArea(10000, undefined, 100, 'mm')).toBeNull();
  });

  it('calculates area with 1:1 scale', () => {
    const ref = makeRef(100);
    // 100px ref = 100mm, so 1px = 1mm, so 10000px² = 10000mm²
    const result = calcRealArea(10000, ref, 100, 'mm');
    expect(result).toBe('10000.00 mm²');
  });

  it('scales area quadratically', () => {
    const ref = makeRef(100);
    // 100px ref = 200mm, so 1px = 2mm, so 100px² = 400mm²
    const result = calcRealArea(100, ref, 200, 'mm');
    expect(result).toBe('400.00 mm²');
  });

  it('converts area to display unit', () => {
    const ref = makeRef(100);
    // 100px ref = 100mm, 10000px² = 10000mm² = 100cm²
    const result = calcRealArea(10000, ref, 100, 'mm', 'cm');
    expect(result).toBe('100.00 cm²');
  });

  it('converts from cm to mm', () => {
    const ref = makeRef(100);
    // 100px ref = 10cm, so 1px = 0.1cm, 10000px² = 100cm² = 10000mm²
    const result = calcRealArea(10000, ref, 10, 'cm', 'mm');
    expect(result).toBe('10000.00 mm²');
  });
});
