import { Measurement, Measurement3D, Unit } from '@/types/measurement';

const UNIT_TO_MM: Record<Unit, number> = {
  mm: 1,
  cm: 10,
  m: 1000,
  in: 25.4,
  px: 1,
};

export function convertUnit(value: number, from: Unit, to: Unit): number {
  if (from === to) return value;
  if (from === 'px' || to === 'px') return value;
  return value * (UNIT_TO_MM[from] / UNIT_TO_MM[to]);
}

export function calcRealDistance(
  pixelLength: number,
  reference: Measurement | undefined,
  refValue: number,
  refUnit: Unit,
  displayUnit?: Unit
): string | null {
  if (!reference || !refValue || refValue <= 0) return null;
  const ratio = refValue / reference.pixelLength;
  let realDist = pixelLength * ratio;
  const unit = displayUnit ?? refUnit;
  if (displayUnit && displayUnit !== refUnit) {
    realDist = convertUnit(realDist, refUnit, displayUnit);
  }
  return `${realDist.toFixed(2)} ${unit}`;
}

export function calcRealValue(
  pixelLength: number,
  reference: Measurement | undefined,
  refValue: number
): number | null {
  if (!reference || !refValue || refValue <= 0) return null;
  const ratio = refValue / reference.pixelLength;
  return pixelLength * ratio;
}

export function calcRealArea(
  pixelArea: number,
  reference: Measurement | undefined,
  refValue: number,
  refUnit: Unit,
  displayUnit?: Unit
): string | null {
  if (!reference) return null;
  const scale = refValue / reference.pixelLength;
  let realArea = pixelArea * scale * scale;
  const unit = displayUnit ?? refUnit;
  if (displayUnit && displayUnit !== refUnit) {
    const linearFactor = UNIT_TO_MM[refUnit] / UNIT_TO_MM[displayUnit];
    realArea = realArea * linearFactor * linearFactor;
  }
  return `${realArea.toFixed(2)} ${unit}\u00B2`;
}

export function calcReal3DDistance(
  distance: number,
  reference3D: Measurement3D | undefined,
  refValue: number,
  refUnit: Unit,
  displayUnit?: Unit
): string {
  if (!reference3D || !refValue || refValue <= 0 || reference3D.distance <= 0) {
    return distance.toFixed(2);
  }
  const ratio = refValue / reference3D.distance;
  let realDist = distance * ratio;
  const unit = displayUnit ?? refUnit;
  if (displayUnit && displayUnit !== refUnit) {
    realDist = convertUnit(realDist, refUnit, displayUnit);
  }
  return `${realDist.toFixed(2)} ${unit}`;
}
