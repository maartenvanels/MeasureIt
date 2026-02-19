'use client';

import { ChevronDown, ChevronRight, Eye, EyeOff, Lock, Unlock, ImageIcon, Box, Grid3X3 } from 'lucide-react';
import { useUIStore } from '@/stores/useUIStore';
import { useSceneObjectStore } from '@/stores/useSceneObjectStore';

interface Props {
  label: string;
  type: 'image' | 'model' | 'grid';
  /** Scene object ID — when provided, visibility/lock toggles control the scene object */
  objectId?: string;
  children?: React.ReactNode;
}

const ICONS = { image: ImageIcon, model: Box, grid: Grid3X3 };

export function SceneTreeTopLevel({ label, type, objectId, children }: Props) {
  const gridEnabled = useUIStore((s) => s.gridEnabled);
  const collapsed = useUIStore((s) => s.collapsedGroups[objectId ?? type] ?? false);
  const toggleCollapse = useUIStore((s) => s.toggleGroupCollapsed);

  const sceneObject = useSceneObjectStore((s) =>
    objectId ? s.objects.find((o) => o.id === objectId) : undefined
  );
  const selectedObjectId = useSceneObjectStore((s) => s.selectedObjectId);
  const selectObject = useSceneObjectStore((s) => s.selectObject);
  const setActiveObject = useSceneObjectStore((s) => s.setActiveObject);
  const toggleObjectVisibility = useSceneObjectStore((s) => s.toggleObjectVisibility);
  const toggleObjectLocked = useSceneObjectStore((s) => s.toggleObjectLocked);

  const visible = objectId && sceneObject
    ? sceneObject.visible
    : type === 'grid'
      ? gridEnabled
      : true;

  const locked = sceneObject?.locked ?? false;
  const isSelected = objectId ? selectedObjectId === objectId : false;

  const toggleVisible = () => {
    if (objectId) {
      toggleObjectVisibility(objectId);
    } else if (type === 'grid') {
      useUIStore.getState().toggleGrid();
    }
  };

  const toggleLock = () => {
    if (objectId) toggleObjectLocked(objectId);
  };

  const handleClick = () => {
    if (objectId) {
      selectObject(objectId);
      setActiveObject(objectId);
    }
  };

  const Icon = ICONS[type];
  const isLeaf = type === 'grid';

  return (
    <div>
      <div
        className={`flex items-center gap-1 py-1 px-1 rounded text-xs font-medium select-none cursor-pointer group ${
          isSelected ? 'bg-accent' : 'hover:bg-accent/50'
        }`}
        onClick={handleClick}
      >
        {!isLeaf ? (
          <button
            onClick={(e) => { e.stopPropagation(); toggleCollapse(objectId ?? type); }}
            className="p-0.5"
          >
            {collapsed ? (
              <ChevronRight className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </button>
        ) : (
          <span className="w-4" />
        )}
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="flex-1 truncate">{label}</span>

        {/* Lock toggle (for scene objects) */}
        {objectId && (
          <button
            onClick={(e) => { e.stopPropagation(); toggleLock(); }}
            className={`p-0.5 rounded opacity-0 group-hover:opacity-100 ${locked ? '!opacity-100' : ''} text-muted-foreground`}
            title={locked ? 'Unlock' : 'Lock'}
          >
            {locked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
          </button>
        )}

        {/* Visibility toggle */}
        <button
          onClick={(e) => { e.stopPropagation(); toggleVisible(); }}
          className={`p-0.5 rounded ${visible ? 'text-muted-foreground' : 'text-muted-foreground/30'}`}
          title={visible ? 'Hide' : 'Show'}
        >
          {visible ? (
            <Eye className="h-3.5 w-3.5" />
          ) : (
            <EyeOff className="h-3.5 w-3.5" />
          )}
        </button>
      </div>
      {!isLeaf && !collapsed && (
        <div className="ml-3 border-l border-border/50 pl-1">
          {children}
        </div>
      )}
    </div>
  );
}
