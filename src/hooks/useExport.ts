'use client';

import { useCallback } from 'react';
import { toast } from 'sonner';
import { useMeasurementStore } from '@/stores/useMeasurementStore';
import { useCanvasStore } from '@/stores/useCanvasStore';
import {
  generateCSV,
  generateJSON,
  generateClipboardText,
  renderAnnotatedImage,
  downloadBlob,
  downloadText,
} from '@/lib/export-utils';

export function useExport() {
  const exportCSV = useCallback(() => {
    const { measurements, referenceValue, referenceUnit, getReference } =
      useMeasurementStore.getState();
    const csv = generateCSV(measurements, referenceValue, referenceUnit, getReference());
    downloadText(csv, 'measurements.csv', 'text/csv');
    toast.success('CSV exported');
  }, []);

  const exportJSON = useCallback(() => {
    const { measurements, referenceValue, referenceUnit, getReference } =
      useMeasurementStore.getState();
    const json = generateJSON(measurements, referenceValue, referenceUnit, getReference());
    downloadText(json, 'measurements.json', 'application/json');
    toast.success('JSON exported');
  }, []);

  const exportClipboard = useCallback(async () => {
    const { measurements, referenceValue, referenceUnit, getReference } =
      useMeasurementStore.getState();
    const text = generateClipboardText(
      measurements, referenceValue, referenceUnit, getReference()
    );
    await navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  }, []);

  const exportImage = useCallback(async () => {
    const { image } = useCanvasStore.getState();
    if (!image) return;
    const { measurements, referenceValue, referenceUnit, getReference } =
      useMeasurementStore.getState();
    const blob = await renderAnnotatedImage(
      image, measurements, referenceValue, referenceUnit, getReference()
    );
    downloadBlob(blob, 'measurement_image.png');
    toast.success('Image exported');
  }, []);

  return { exportCSV, exportJSON, exportClipboard, exportImage };
}
