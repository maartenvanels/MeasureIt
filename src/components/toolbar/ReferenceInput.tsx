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
import { Unit } from '@/types/measurement';

const units: { value: Unit; label: string }[] = [
  { value: 'mm', label: 'mm' },
  { value: 'cm', label: 'cm' },
  { value: 'm', label: 'm' },
  { value: 'in', label: 'inch' },
  { value: 'px', label: 'px' },
];

export function ReferenceInput() {
  const referenceValue = useMeasurementStore((s) => s.referenceValue);
  const referenceUnit = useMeasurementStore((s) => s.referenceUnit);
  const setReferenceValue = useMeasurementStore((s) => s.setReferenceValue);
  const setReferenceUnit = useMeasurementStore((s) => s.setReferenceUnit);

  return (
    <div className="flex items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900/50 px-2 py-1">
      <span className="text-xs text-zinc-500">Ref:</span>
      <Input
        type="number"
        value={referenceValue}
        onChange={(e) => setReferenceValue(parseFloat(e.target.value) || 0)}
        className="h-7 w-20 border-0 bg-transparent p-0 text-center text-sm font-semibold text-rose-500 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <Select
        value={referenceUnit}
        onValueChange={(v) => setReferenceUnit(v as Unit)}
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
