'use client';

import { useCallback } from 'react';
import { toast } from 'sonner';
import { useMeasurementStore } from '@/stores/useMeasurementStore';
import { useSceneObjectStore } from '@/stores/useSceneObjectStore';
import { useCanvasStore } from '@/stores/useCanvasStore';
import type { AnyMeasurement, Measurement } from '@/types/measurement';
import type { RefResolver } from '@/lib/export-utils';
import {
  generateCSV,
  generateJSON,
  generateClipboardText,
  renderAnnotatedImage,
  downloadBlob,
  downloadText,
} from '@/lib/export-utils';

/** Build a RefResolver that uses per-object reference scales */
function buildResolver(): RefResolver {
  const { referenceValue, referenceUnit, getReference } = useMeasurementStore.getState();
  const { objects } = useSceneObjectStore.getState();

  return (m: AnyMeasurement) => {
    const surface = (m.type === 'reference' || m.type === 'measure')
      ? ((m as Measurement).surface ?? 'image')
      : 'image';
    const obj = m.surfaceId ? objects.find((o) => o.id === m.surfaceId) : undefined;
    return {
      ref: getReference(surface as 'image' | 'model', m.surfaceId),
      refValue: obj?.referenceValue ?? referenceValue,
      refUnit: obj?.referenceUnit ?? referenceUnit,
      objectName: obj?.name,
    };
  };
}

export function useExport() {
  const exportCSV = useCallback(() => {
    const { measurements } = useMeasurementStore.getState();
    const csv = generateCSV(measurements, buildResolver());
    downloadText(csv, 'measurements.csv', 'text/csv');
    toast.success('CSV exported');
  }, []);

  const exportJSON = useCallback(() => {
    const { measurements } = useMeasurementStore.getState();
    const json = generateJSON(measurements, buildResolver());
    downloadText(json, 'measurements.json', 'application/json');
    toast.success('JSON exported');
  }, []);

  const exportClipboard = useCallback(async () => {
    const { measurements } = useMeasurementStore.getState();
    const text = generateClipboardText(measurements, buildResolver());
    await navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  }, []);

  const exportImage = useCallback(async () => {
    const { image } = useCanvasStore.getState();
    if (!image) return;
    const { measurements } = useMeasurementStore.getState();
    const blob = await renderAnnotatedImage(image, measurements, buildResolver());
    downloadBlob(blob, 'measurement_image.png');
    toast.success('Image exported');
  }, []);

  return { exportCSV, exportJSON, exportClipboard, exportImage };
}
