'use client';

import { ChevronDown, ChevronRight, Eye, EyeOff } from 'lucide-react';
import type { AnyMeasurement } from '@/types/measurement';
import { useUIStore } from '@/stores/useUIStore';
import { useMeasurementStore } from '@/stores/useMeasurementStore';
import { SceneTreeNode } from './SceneTreeNode';

interface Props {
  groupKey: string;
  label: string;
  items: AnyMeasurement[];
}

export function SceneTreeGroup({ groupKey, label, items }: Props) {
  const collapsed = useUIStore((s) => s.collapsedGroups[groupKey] ?? false);
  const toggleCollapse = useUIStore((s) => s.toggleGroupCollapsed);
  const setGroupVisibility = useMeasurementStore((s) => s.setGroupVisibility);

  if (items.length === 0) return null;

  const allVisible = items.every((m) => m.visible !== false);
  const noneVisible = items.every((m) => m.visible === false);

  const handleToggleVisibility = (e: React.MouseEvent) => {
    e.stopPropagation();
    const ids = items.map((m) => m.id);
    setGroupVisibility(ids, noneVisible); // if none visible, show all; otherwise hide all
  };

  return (
    <div>
      <div
        className="flex items-center gap-1 py-0.5 px-1 rounded hover:bg-accent/50 text-xs cursor-pointer select-none"
        onClick={() => toggleCollapse(groupKey)}
      >
        <span className="p-0.5">
          {collapsed ? (
            <ChevronRight className="h-3 w-3 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          )}
        </span>
        <span className="flex-1 truncate text-muted-foreground">
          {label} ({items.length})
        </span>
        <button
          onClick={handleToggleVisibility}
          className={`p-0.5 rounded ${noneVisible ? 'opacity-40' : allVisible ? 'opacity-60 hover:opacity-100' : 'opacity-60 hover:opacity-100'}`}
          title={noneVisible ? 'Show all' : 'Hide all'}
        >
          {noneVisible ? (
            <EyeOff className="h-3 w-3 text-muted-foreground" />
          ) : (
            <Eye className={`h-3 w-3 text-muted-foreground ${!allVisible ? 'opacity-50' : ''}`} />
          )}
        </button>
      </div>
      {!collapsed && (
        <div className="ml-3">
          {items.map((m) => (
            <SceneTreeNode key={m.id} measurement={m} />
          ))}
        </div>
      )}
    </div>
  );
}
