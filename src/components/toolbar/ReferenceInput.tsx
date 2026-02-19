'use client';

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

  const handleValueChange = (value: number) => {
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
        value={referenceValue}
        onChange={(e) => handleValueChange(parseFloat(e.target.value) || 0)}
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
