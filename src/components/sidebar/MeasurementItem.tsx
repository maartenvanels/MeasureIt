'use client';

import { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import { Annotation, Measurement, AreaMeasurement, AnyMeasurement } from '@/types/measurement';
import { useMeasurementStore } from '@/stores/useMeasurementStore';
import { useUIStore } from '@/stores/useUIStore';
import { calcRealDistance, calcRealArea } from '@/lib/calculations';
import { ColorPicker } from './ColorPicker';
import { getMeasurementColor } from '@/lib/canvas-rendering';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface MeasurementItemProps {
  measurement: AnyMeasurement;
}

export function MeasurementItem({ measurement: m }: MeasurementItemProps) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(m.name ?? '');
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedId = useUIStore((s) => s.selectedMeasurementId);
  const selectMeasurement = useUIStore((s) => s.selectMeasurement);
  const openAnnotationEditor = useUIStore((s) => s.openAnnotationEditor);
  const renameMeasurement = useMeasurementStore((s) => s.renameMeasurement);
  const removeMeasurement = useMeasurementStore((s) => s.removeMeasurement);
  const updateMeasurement = useMeasurementStore((s) => s.updateMeasurement);
  const referenceValue = useMeasurementStore((s) => s.referenceValue);
  const referenceUnit = useMeasurementStore((s) => s.referenceUnit);
  const reference = useMeasurementStore((s) => s.getReference());

  const isRef = m.type === 'reference';
  const isAngle = m.type === 'angle';
  const isArea = m.type === 'area';
  const isAnnotation = m.type === 'annotation';
  const isSelected = m.id === selectedId;
  const color = getMeasurementColor(m);

  const displayName = m.type === 'annotation'
    ? (m.name || m.content.replace(/[#*_~`$\\]/g, '').slice(0, 40) || 'Annotation')
    : m.name;

  const displayValue = isAnnotation
    ? (m as Annotation).content.replace(/[#*_~`$\\]/g, '').slice(0, 40) || 'Empty'
    : isArea
      ? (calcRealArea((m as AreaMeasurement).pixelArea, reference, referenceValue, referenceUnit, (m as AreaMeasurement).unitOverride) ?? `${(m as AreaMeasurement).pixelArea.toFixed(0)} px\u00B2`)
      : isAngle
        ? `${(m as any).angleDeg.toFixed(1)}\u00B0`
        : m.type === 'reference'
          ? `${referenceValue} ${referenceUnit}`
          : (calcRealDistance((m as Measurement).pixelLength, reference, referenceValue, referenceUnit, (m as Measurement).unitOverride) ?? `${(m as Measurement).pixelLength.toFixed(1)} px`);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const commitRename = () => {
    setEditing(false);
    const currentName = m.name ?? '';
    if (editValue.trim() && editValue !== currentName) {
      renameMeasurement(m.id, editValue.trim());
    } else {
      setEditValue(currentName);
    }
  };

  return (
    <div
      style={{ borderLeftColor: color }}
      className={`group flex items-center gap-2 rounded-md px-2.5 py-2 text-sm transition-colors cursor-pointer border-l-2 ${
        isSelected ? 'bg-zinc-800' : 'hover:bg-zinc-800/50'
      }`}
      onClick={() => selectMeasurement(m.id)}
    >
      <ColorPicker
        color={color}
        onChange={(newColor) => updateMeasurement(m.id, { color: newColor })}
      />

      {editing ? (
        <input
          ref={inputRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={commitRename}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commitRename();
            if (e.key === 'Escape') {
              setEditValue(m.name ?? '');
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
            if (isAnnotation) {
              openAnnotationEditor(m.id);
            } else {
              setEditValue(m.name ?? '');
              setEditing(true);
            }
          }}
        >
          {displayName}
        </span>
      )}

      <span style={{ color }} className="flex-shrink-0 font-semibold tabular-nums">
        {displayValue}
      </span>

      {(m.type === 'measure' || m.type === 'area') && (
        <Select
          value={(m as any).unitOverride ?? ''}
          onValueChange={(val: string) =>
            updateMeasurement(m.id, { unitOverride: val === '' ? undefined : val })
          }
        >
          <SelectTrigger className="h-5 w-12 border-zinc-700 bg-zinc-800/50 px-1 text-[10px]" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
            <SelectValue placeholder={referenceUnit} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Default</SelectItem>
            <SelectItem value="mm">mm</SelectItem>
            <SelectItem value="cm">cm</SelectItem>
            <SelectItem value="m">m</SelectItem>
            <SelectItem value="in">in</SelectItem>
            <SelectItem value="px">px</SelectItem>
          </SelectContent>
        </Select>
      )}

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
