import { Measurement, AreaMeasurement, Annotation, AnyMeasurement, Unit } from '@/types/measurement';
import { calcRealValue } from './calculations';
import { drawMeasurementLine, drawAngleMeasurement, drawAreaMeasurement, drawLabel } from './canvas-rendering';
import { calcRealDistance, calcRealArea } from './calculations';

export function generateCSV(
  measurements: AnyMeasurement[],
  refValue: number,
  refUnit: Unit,
  reference?: Measurement
): string {
  let csv = `Name,Type,Value,Unit,Pixel Length,Angle (deg),Pixel Area\n`;
  for (const m of measurements) {
    if (m.type === 'annotation') {
      const content = (m as Annotation).content.replace(/"/g, '""').slice(0, 100);
      csv += `"${content}",annotation,,,,, \n`;
    } else if (m.type === 'area') {
      const area = m as AreaMeasurement;
      const unit = area.unitOverride ?? refUnit;
      const realArea = calcRealArea(area.pixelArea, reference, refValue, refUnit, area.unitOverride);
      csv += `"${m.name}",area,"${realArea ?? ''}",${unit},,,"${area.pixelArea.toFixed(2)}"\n`;
    } else if (m.type === 'angle') {
      csv += `"${m.name}",angle,"${m.angleDeg.toFixed(2)}°",deg,,,\n`;
    } else {
      const meas = m as Measurement;
      const unit = meas.unitOverride ?? refUnit;
      const real =
        m.type === 'reference'
          ? `${refValue}`
          : (calcRealDistance(meas.pixelLength, reference, refValue, refUnit, meas.unitOverride)?.replace(` ${unit}`, '') ?? '');
      csv += `"${m.name}",${m.type},"${real}",${unit},${meas.pixelLength.toFixed(2)},,\n`;
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
    if (m.type === 'annotation') {
      const ann = m as Annotation;
      return {
        type: 'annotation' as const,
        content: ann.content,
        position: { x: Math.round(ann.position.x), y: Math.round(ann.position.y) },
        color: ann.color,
      };
    }
    if (m.type === 'area') {
      const area = m as AreaMeasurement;
      const realArea = calcRealArea(area.pixelArea, reference, refValue, refUnit, area.unitOverride);
      return {
        name: m.name,
        type: 'area' as const,
        pixelArea: Math.round(area.pixelArea * 100) / 100,
        realArea: realArea ?? null,
        unit: area.unitOverride ?? refUnit,
        points: area.points.map((p) => ({ x: Math.round(p.x), y: Math.round(p.y) })),
      };
    }
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
    const meas = m as Measurement;
    const realValue =
      m.type === 'reference'
        ? refValue
        : calcRealValue(meas.pixelLength, reference, refValue);
    return {
      name: m.name,
      type: m.type,
      pixelLength: Math.round(meas.pixelLength * 100) / 100,
      realValue: realValue ? Math.round(realValue * 100) / 100 : null,
      unit: meas.unitOverride ?? refUnit,
      coordinates: {
        x1: Math.round(meas.start.x),
        y1: Math.round(meas.start.y),
        x2: Math.round(meas.end.x),
        y2: Math.round(meas.end.y),
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
    if (m.type === 'annotation') {
      const content = (m as Annotation).content.slice(0, 60).replace(/\n/g, ' ');
      text += `  [Note] ${content}\n`;
    } else if (m.type === 'area') {
      const area = m as AreaMeasurement;
      const val = calcRealArea(area.pixelArea, reference, refValue, refUnit, area.unitOverride) ?? `${area.pixelArea.toFixed(0)} px\u00B2`;
      text += `  ${m.name}: ${val}\n`;
    } else if (m.type === 'angle') {
      text += `  ${m.name}: ${m.angleDeg.toFixed(1)}\u00B0\n`;
    } else {
      const meas = m as Measurement;
      const val =
        m.type === 'reference'
          ? `${refValue} ${refUnit} (reference)`
          : (calcRealDistance(meas.pixelLength, reference, refValue, refUnit, meas.unitOverride) ??
            `${meas.pixelLength.toFixed(1)} px`);
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
    if (m.type === 'annotation') {
      const ann = m as Annotation;
      const color = ann.color ?? '#a855f7';
      const plainText = ann.content.replace(/[#*_~`$\\]/g, '').trim().slice(0, 50);
      if (plainText) {
        drawLabel(ctx, ann.position.x, ann.position.y, plainText, color, 14);
      }
    } else if (m.type === 'area') {
      const area = m as AreaMeasurement;
      const label = calcRealArea(area.pixelArea, reference, refValue, refUnit, area.unitOverride) ?? `${area.pixelArea.toFixed(0)} px\u00B2`;
      drawAreaMeasurement(ctx, area, false, transform, label);
    } else if (m.type === 'angle') {
      drawAngleMeasurement(ctx, m, false, transform);
    } else {
      const meas = m as Measurement;
      const label =
        m.type === 'reference'
          ? `${refValue} ${refUnit} (ref)`
          : (calcRealDistance(meas.pixelLength, reference, refValue, refUnit, meas.unitOverride) ??
            `${meas.pixelLength.toFixed(1)} px`);
      drawMeasurementLine(ctx, meas, false, transform, label, m.name);
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
