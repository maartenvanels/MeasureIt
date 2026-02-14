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

export function calcRealArea(
  pixelArea: number,
  reference: Measurement | undefined,
  refValue: number,
  refUnit: Unit
): string | null {
  if (!reference) return null;
  const scale = refValue / reference.pixelLength;
  const realArea = pixelArea * scale * scale;
  return `${realArea.toFixed(2)} ${refUnit}\u00B2`;
}
