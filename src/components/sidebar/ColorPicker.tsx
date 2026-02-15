'use client';

import { useState } from 'react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
}

const PRESET_COLORS = [
  '#e11d48', '#f59e0b', '#10b981', '#06b6d4',
  '#8b5cf6', '#ec4899', '#f97316', '#84cc16',
  '#14b8a6', '#3b82f6', '#a855f7', '#ef4444',
];

export function ColorPicker({ color, onChange }: ColorPickerProps) {
  const [open, setOpen] = useState(false);
  const [hexInput, setHexInput] = useState(color);

  const handlePresetClick = (preset: string) => {
    onChange(preset);
    setHexInput(preset);
    setOpen(false);
  };

  const handleHexSubmit = () => {
    const trimmed = hexInput.trim();
    if (/^#[0-9a-fA-F]{3,8}$/.test(trimmed)) {
      onChange(trimmed);
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={(o) => { setOpen(o); if (o) setHexInput(color); }}>
      <PopoverTrigger asChild>
        <button
          className="w-3 h-3 rounded-full flex-shrink-0 border border-border focus:outline-none"
          style={{ backgroundColor: color }}
          onClick={(e) => e.stopPropagation()}
        />
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-2 bg-popover border-border"
        align="start"
        sideOffset={6}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="grid grid-cols-4 gap-1.5 mb-2">
          {PRESET_COLORS.map((preset) => (
            <button
              key={preset}
              className={`w-6 h-6 rounded-full transition-all focus:outline-none ${
                color === preset ? 'ring-2 ring-white ring-offset-1 ring-offset-popover' : 'hover:scale-110'
              }`}
              style={{ backgroundColor: preset }}
              onClick={() => handlePresetClick(preset)}
            />
          ))}
        </div>
        <input
          type="text"
          value={hexInput}
          onChange={(e) => setHexInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleHexSubmit();
          }}
          onBlur={handleHexSubmit}
          className="w-full px-1.5 py-1 text-xs font-mono bg-accent border border-border rounded text-foreground focus:outline-none focus:border-ring"
          placeholder="#hex"
        />
      </PopoverContent>
    </Popover>
  );
}
