'use client';

import { ScrollArea } from '@/components/ui/scroll-area';
import { useMeasurementStore } from '@/stores/useMeasurementStore';
import { MeasurementItem } from './MeasurementItem';

export function MeasurementList() {
  const measurements = useMeasurementStore((s) => s.measurements);

  if (measurements.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-6 text-center text-sm text-zinc-600">
        No measurements yet.
        <br />
        Draw a reference line to get started.
      </div>
    );
  }

  const refs = measurements.filter((m) => m.type === 'reference');
  const normals = measurements.filter((m) => m.type === 'measure');
  const angles = measurements.filter((m) => m.type === 'angle');

  return (
    <ScrollArea className="flex-1">
      <div className="space-y-1 p-2">
        {refs.map((m) => (
          <MeasurementItem key={m.id} measurement={m} />
        ))}
        {normals.map((m) => (
          <MeasurementItem key={m.id} measurement={m} />
        ))}
        {angles.map((m) => (
          <MeasurementItem key={m.id} measurement={m} />
        ))}
      </div>
    </ScrollArea>
  );
}
