import { Measurement, Unit } from '@/types/measurement';

export function calcRealDistance(
  pixelLength: number,
  reference: Measurement | undefined,
  refValue: number,
  refUnit: Unit
): string | null {
  if (!reference || !refValue || refValue <= 0) return null;
  const ratio = refValue / reference.pixelLength;
  const realDist = pixelLength * ratio;
  return `${realDist.toFixed(2)} ${refUnit}`;
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
