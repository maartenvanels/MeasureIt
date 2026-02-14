'use client';

import { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import { AnyMeasurement } from '@/types/measurement';
import { useMeasurementStore } from '@/stores/useMeasurementStore';
import { useUIStore } from '@/stores/useUIStore';
import { calcRealDistance } from '@/lib/calculations';

interface MeasurementItemProps {
  measurement: AnyMeasurement;
}

export function MeasurementItem({ measurement: m }: MeasurementItemProps) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(m.name);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedId = useUIStore((s) => s.selectedMeasurementId);
  const selectMeasurement = useUIStore((s) => s.selectMeasurement);
  const renameMeasurement = useMeasurementStore((s) => s.renameMeasurement);
  const removeMeasurement = useMeasurementStore((s) => s.removeMeasurement);
  const referenceValue = useMeasurementStore((s) => s.referenceValue);
  const referenceUnit = useMeasurementStore((s) => s.referenceUnit);
  const reference = useMeasurementStore((s) => s.getReference());

  const isRef = m.type === 'reference';
  const isAngle = m.type === 'angle';
  const isSelected = m.id === selectedId;
  const color = isRef ? 'bg-rose-500' : isAngle ? 'bg-amber-500' : 'bg-cyan-500';

  const displayValue = m.type === 'angle'
    ? `${m.angleDeg.toFixed(1)}°`
    : m.type === 'reference'
      ? `${referenceValue} ${referenceUnit}`
      : (calcRealDistance(m.pixelLength, reference, referenceValue, referenceUnit) ??
        `${m.pixelLength.toFixed(1)} px`);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const commitRename = () => {
    setEditing(false);
    if (editValue.trim() && editValue !== m.name) {
      renameMeasurement(m.id, editValue.trim());
    } else {
      setEditValue(m.name);
    }
  };

  return (
    <div
      className={`group flex items-center gap-2 rounded-md px-2.5 py-2 text-sm transition-colors cursor-pointer ${
        isSelected ? 'bg-zinc-800' : 'hover:bg-zinc-800/50'
      } ${isRef ? 'border-l-2 border-rose-500' : isAngle ? 'border-l-2 border-amber-500' : 'border-l-2 border-cyan-500'}`}
      onClick={() => selectMeasurement(m.id)}
    >
      <div className={`h-2.5 w-2.5 flex-shrink-0 rounded-full ${color}`} />

      {editing ? (
        <input
          ref={inputRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={commitRename}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commitRename();
            if (e.key === 'Escape') {
              setEditValue(m.name);
              setEditing(false);
            }
          }}
          className="flex-1 bg-transparent text-sm text-zinc-200 outline-none"
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <span
          className="flex-1 truncate text-zinc-300"
          onDoubleClick={(e) => {
            e.stopPropagation();
            setEditValue(m.name);
            setEditing(true);
          }}
        >
          {m.name}
        </span>
      )}

      <span
        className={`flex-shrink-0 font-semibold tabular-nums ${
          isRef ? 'text-rose-400' : isAngle ? 'text-amber-400' : 'text-cyan-400'
        }`}
      >
        {displayValue}
      </span>

      <button
        className="flex-shrink-0 rounded p-0.5 text-zinc-600 opacity-0 transition-opacity hover:text-rose-400 group-hover:opacity-100"
        onClick={(e) => {
          e.stopPropagation();
          removeMeasurement(m.id);
        }}
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
