import { Measurement, AnyMeasurement, Unit } from '@/types/measurement';
import { calcRealValue } from './calculations';
import { drawMeasurementLine, drawAngleMeasurement } from './canvas-rendering';
import { calcRealDistance } from './calculations';

export function generateCSV(
  measurements: AnyMeasurement[],
  refValue: number,
  refUnit: Unit,
  reference?: Measurement
): string {
  let csv = `Name,Type,Pixel Length,Real Value (${refUnit}),Angle (deg)\n`;
  for (const m of measurements) {
    if (m.type === 'angle') {
      csv += `"${m.name}",angle,,,"${m.angleDeg.toFixed(2)}"\n`;
    } else {
      const real =
        m.type === 'reference'
          ? refValue
          : calcRealValue(m.pixelLength, reference, refValue);
      csv += `"${m.name}",${m.type},${m.pixelLength.toFixed(2)},${real?.toFixed(2) ?? ''},\n`;
    }
  }
  return csv;
}

export function generateJSON(
  measurements: AnyMeasurement[],
  refValue: number,
  refUnit: Unit,
  reference?: Measurement
): string {
  const data = measurements.map((m) => {
    if (m.type === 'angle') {
      return {
        name: m.name,
        type: 'angle' as const,
        angleDeg: Math.round(m.angleDeg * 100) / 100,
        coordinates: {
          vertex: { x: Math.round(m.vertex.x), y: Math.round(m.vertex.y) },
          armA: { x: Math.round(m.armA.x), y: Math.round(m.armA.y) },
          armB: { x: Math.round(m.armB.x), y: Math.round(m.armB.y) },
        },
      };
    }
    const realValue =
      m.type === 'reference'
        ? refValue
        : calcRealValue(m.pixelLength, reference, refValue);
    return {
      name: m.name,
      type: m.type,
      pixelLength: Math.round(m.pixelLength * 100) / 100,
      realValue: realValue ? Math.round(realValue * 100) / 100 : null,
      unit: refUnit,
      coordinates: {
        x1: Math.round(m.start.x),
        y1: Math.round(m.start.y),
        x2: Math.round(m.end.x),
        y2: Math.round(m.end.y),
      },
    };
  });
  return JSON.stringify(data, null, 2);
}

export function generateClipboardText(
  measurements: AnyMeasurement[],
  refValue: number,
  refUnit: Unit,
  reference?: Measurement
): string {
  let text = 'Measurements:\n';
  for (const m of measurements) {
    if (m.type === 'angle') {
      text += `  ${m.name}: ${m.angleDeg.toFixed(1)}°\n`;
    } else {
      const val =
        m.type === 'reference'
          ? `${refValue} ${refUnit} (reference)`
          : (calcRealDistance(m.pixelLength, reference, refValue, refUnit) ??
            `${m.pixelLength.toFixed(1)} px`);
      text += `  ${m.name}: ${val}\n`;
    }
  }
  return text;
}

export async function renderAnnotatedImage(
  image: HTMLImageElement,
  measurements: AnyMeasurement[],
  refValue: number,
  refUnit: Unit,
  reference?: Measurement
): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext('2d')!;

  ctx.drawImage(image, 0, 0);

  const transform = { panX: 0, panY: 0, zoom: 1 };

  for (const m of measurements) {
    if (m.type === 'angle') {
      drawAngleMeasurement(ctx, m, false, transform);
    } else {
      const label =
        m.type === 'reference'
          ? `${refValue} ${refUnit} (ref)`
          : (calcRealDistance(m.pixelLength, reference, refValue, refUnit) ??
            `${m.pixelLength.toFixed(1)} px`);
      drawMeasurementLine(ctx, m, false, transform, label, m.name);
    }
  }

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), 'image/png');
  });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadText(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  downloadBlob(blob, filename);
}
