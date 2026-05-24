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
import { useSceneObjectStore } from '@/stores/useSceneObjectStore';
import { Unit } from '@/types/measurement';

const units: { value: Unit; label: string }[] = [
  { value: 'mm', label: 'mm' },
  { value: 'cm', label: 'cm' },
  { value: 'm', label: 'm' },
  { value: 'in', label: 'inch' },
  { value: 'px', label: 'px' },
];

export function ReferenceInput() {
  const activeObject = useSceneObjectStore((s) => {
    const { objects, activeObjectId } = s;
    return activeObjectId ? objects.find((o) => o.id === activeObjectId) : undefined;
  });

  // Per-object reference scale when an object is active, otherwise global
  const globalRefValue = useMeasurementStore((s) => s.referenceValue);
  const globalRefUnit = useMeasurementStore((s) => s.referenceUnit);
  const setGlobalRefValue = useMeasurementStore((s) => s.setReferenceValue);
  const setGlobalRefUnit = useMeasurementStore((s) => s.setReferenceUnit);
  const setObjectRefValue = useSceneObjectStore((s) => s.setObjectReferenceValue);
  const setObjectRefUnit = useSceneObjectStore((s) => s.setObjectReferenceUnit);

  const referenceValue = activeObject?.referenceValue ?? globalRefValue;
  const referenceUnit = activeObject?.referenceUnit ?? globalRefUnit;

  // Local draft buffer so the user can clear the field while editing.
  // Sync from store when not focused (e.g. activeObject changes).
  const [draft, setDraft] = useState<string>(String(referenceValue));
  const [focused, setFocused] = useState(false);
  useEffect(() => {
    if (!focused) setDraft(String(referenceValue));
  }, [referenceValue, focused]);

  const commitValue = (value: number) => {
    if (activeObject) {
      setObjectRefValue(activeObject.id, value);
    }
    // Always sync global too (used as fallback for legacy measurements)
    setGlobalRefValue(value);
  };

  const handleUnitChange = (unit: Unit) => {
    if (activeObject) {
      setObjectRefUnit(activeObject.id, unit);
    }
    setGlobalRefUnit(unit);
  };

  return (
    <div className="flex items-center gap-1.5 rounded-md border border-border bg-card/50 px-2 py-1">
      <span className="text-xs text-muted-foreground">Ref:</span>
      <Input
        type="number"
        value={draft}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false);
          const parsed = parseFloat(draft);
          if (Number.isFinite(parsed) && parsed > 0) {
            commitValue(parsed);
            setDraft(String(parsed));
          } else {
            // Restore last valid value on empty/invalid blur
            setDraft(String(referenceValue));
          }
        }}
        onChange={(e) => {
          const next = e.target.value;
          setDraft(next);
          const parsed = parseFloat(next);
          if (Number.isFinite(parsed) && parsed > 0) {
            commitValue(parsed);
          }
        }}
        className="h-7 w-20 border-0 bg-transparent p-0 text-center text-sm font-semibold text-rose-500 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <Select
        value={referenceUnit}
        onValueChange={(v) => handleUnitChange(v as Unit)}
      >
        <SelectTrigger className="h-7 w-16 border-0 bg-transparent text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {units.map((u) => (
            <SelectItem key={u.value} value={u.value}>
              {u.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
