'use client';

import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useMeasurementStore } from '@/stores/useMeasurementStore';
import { useUIStore } from '@/stores/useUIStore';
import { DEFAULT_COLORS, getMeasurementColor } from '@/lib/canvas-rendering';
import type { AnyMeasurement, Measurement, Unit } from '@/types/measurement';

const UNITS: { value: Unit | '__inherit__'; label: string }[] = [
  { value: '__inherit__', label: 'Inherit' },
  { value: 'mm', label: 'mm' },
  { value: 'cm', label: 'cm' },
  { value: 'm', label: 'm' },
  { value: 'in', label: 'inch' },
  { value: 'px', label: 'px' },
];

function supportsUnitOverride(m: AnyMeasurement): m is Measurement {
  return m.type === 'reference' || m.type === 'measure' || m.type === 'area';
}

export function SelectedMeasurementBar() {
  const selectedIds = useUIStore((s) => s.selectedMeasurementIds);
  const measurements = useMeasurementStore((s) => s.measurements);
  const updateMeasurement = useMeasurementStore((s) => s.updateMeasurement);

  // Only render when exactly one is selected; multi-select uses CombineSelectionBar.
  const measurement = selectedIds.length === 1
    ? measurements.find((m) => m.id === selectedIds[0])
    : undefined;

  const [nameDraft, setNameDraft] = useState('');
  const [nameFocused, setNameFocused] = useState(false);
  const [fontDraft, setFontDraft] = useState('');
  const [fontFocused, setFontFocused] = useState(false);

  useEffect(() => {
    if (!nameFocused) setNameDraft(measurement?.name ?? '');
  }, [measurement?.name, nameFocused]);
  useEffect(() => {
    if (!fontFocused) {
      const fs = measurement && measurement.type !== 'annotation'
        ? ((measurement as Measurement).fontSize ?? 13)
        : 13;
      setFontDraft(String(fs));
    }
  }, [measurement, fontFocused]);

  if (!measurement) return null;
  if (measurement.locked) {
    return (
      <div className="flex items-center gap-2 border-b border-border bg-card/60 px-4 py-1.5 text-xs text-muted-foreground">
        <span>{measurement.name || measurement.type}</span>
        <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-amber-500">locked</span>
      </div>
    );
  }

  const color = getMeasurementColor(measurement);
  const defaultColor = DEFAULT_COLORS[measurement.type] ?? '#06b6d4';
  const unitOverride = supportsUnitOverride(measurement)
    ? (measurement as Measurement).unitOverride
    : undefined;

  const commitName = () => {
    setNameFocused(false);
    const trimmed = nameDraft.trim();
    if (trimmed !== (measurement.name ?? '')) {
      updateMeasurement(measurement.id, { name: trimmed });
    }
  };

  const commitFontSize = () => {
    setFontFocused(false);
    const parsed = parseFloat(fontDraft);
    if (Number.isFinite(parsed) && parsed >= 6 && parsed <= 96) {
      updateMeasurement(measurement.id, { fontSize: Math.round(parsed) });
    } else {
      const fs = measurement.type !== 'annotation'
        ? ((measurement as Measurement).fontSize ?? 13)
        : 13;
      setFontDraft(String(fs));
    }
  };

  return (
    <div className="flex items-center gap-3 border-b border-border bg-card/60 px-4 py-1.5">
      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {measurement.type}
      </span>

      <div className="flex items-center gap-1.5">
        <label className="text-xs text-muted-foreground">Name:</label>
        <Input
          value={nameDraft}
          onFocus={() => setNameFocused(true)}
          onBlur={commitName}
          onChange={(e) => setNameDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') (e.currentTarget as HTMLInputElement).blur();
            if (e.key === 'Escape') {
              setNameDraft(measurement.name ?? '');
              (e.currentTarget as HTMLInputElement).blur();
            }
          }}
          className="h-7 w-40 text-xs"
          placeholder={measurement.type}
        />
      </div>

      <div className="flex items-center gap-1.5">
        <label className="text-xs text-muted-foreground">Color:</label>
        <input
          type="color"
          value={color}
          onChange={(e) => updateMeasurement(measurement.id, { color: e.target.value })}
          className="h-7 w-9 cursor-pointer rounded border border-border bg-transparent p-0"
          title="Click to change color"
        />
        {measurement.color && measurement.color !== defaultColor && (
          <button
            type="button"
            className="text-xs text-muted-foreground hover:text-foreground"
            onClick={() => updateMeasurement(measurement.id, { color: undefined })}
            title="Reset to default color"
          >
            reset
          </button>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <label className="text-xs text-muted-foreground">Size:</label>
        <Input
          type="number"
          min={6}
          max={96}
          value={fontDraft}
          onFocus={() => setFontFocused(true)}
          onBlur={commitFontSize}
          onChange={(e) => setFontDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') (e.currentTarget as HTMLInputElement).blur();
          }}
          className="h-7 w-14 text-xs"
        />
      </div>

      {supportsUnitOverride(measurement) && (
        <div className="flex items-center gap-1.5">
          <label className="text-xs text-muted-foreground">Unit:</label>
          <Select
            value={unitOverride ?? '__inherit__'}
            onValueChange={(v) => {
              const next = v === '__inherit__' ? undefined : (v as Unit);
              updateMeasurement(measurement.id, { unitOverride: next });
            }}
          >
            <SelectTrigger className="h-7 w-24 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {UNITS.map((u) => (
                <SelectItem key={u.value} value={u.value}>
                  {u.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
