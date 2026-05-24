'use client';

import { useMemo } from 'react';
import { Combine, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUIStore } from '@/stores/useUIStore';
import { useMeasurementStore } from '@/stores/useMeasurementStore';
import type { Measurement } from '@/types/measurement';

export function CombineSelectionBar() {
  const selectedIds = useUIStore((s) => s.selectedMeasurementIds);
  const selectMeasurement = useUIStore((s) => s.selectMeasurement);
  const measurements = useMeasurementStore((s) => s.measurements);
  const combineMeasurements = useMeasurementStore((s) => s.combineMeasurements);

  const eligibleIds = useMemo(() => {
    const items = selectedIds
      .map((id) => measurements.find((m) => m.id === id))
      .filter((m): m is Measurement => !!m && m.type === 'measure' && !(m as Measurement).combinedFrom);
    return items.length >= 2 ? items.map((m) => m.id) : null;
  }, [selectedIds, measurements]);
  const skipped = selectedIds.length - (eligibleIds?.length ?? 0);

  if (selectedIds.length === 0) return null;

  const handleCombine = () => {
    if (!eligibleIds) return;
    const result = combineMeasurements(eligibleIds);
    if (!result.ok) {
      alert(result.reason);
      return;
    }
    selectMeasurement(result.id);
  };

  return (
    <div className="flex items-center gap-2 border-b border-border bg-accent/30 px-3 py-2 text-xs">
      <span className="text-muted-foreground">
        {selectedIds.length} selected
        {selectedIds.length === 1 && (
          <span className="ml-1 text-amber-500">— Ctrl+click another to combine</span>
        )}
        {skipped > 0 && eligibleIds && (
          <span className="ml-1 text-amber-500">({skipped} not combinable)</span>
        )}
      </span>
      <div className="flex-1" />
      <Button
        size="sm"
        variant="outline"
        className="h-7 gap-1.5 text-xs"
        disabled={!eligibleIds}
        onClick={handleCombine}
        title={eligibleIds ? `Combine ${eligibleIds.length} into total` : 'Select 2+ measure-type lines (Ctrl+click in sidebar)'}
      >
        <Combine className="h-3.5 w-3.5" />
        Combine{eligibleIds && eligibleIds.length !== selectedIds.length ? ` (${eligibleIds.length})` : ''}
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className="h-7 w-7 p-0"
        onClick={() => selectMeasurement(null)}
        title="Clear selection"
      >
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
