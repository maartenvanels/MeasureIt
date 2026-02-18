'use client';

import { Ruler, PenLine, TriangleRight, Hexagon, StickyNote, Crop, Grid3x3, ChevronDown, Box, Pencil, Circle, CircleDot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useUIStore } from '@/stores/useUIStore';
import { useCanvasStore } from '@/stores/useCanvasStore';
import { ToolGroupButton, type ToolOption } from './ToolGroupButton';
import { DrawMode } from '@/types/measurement';

const AREA_TOOLS: ToolOption[] = [
  { mode: 'area-polygon', label: 'Polygon', icon: Hexagon, shortcut: 'P' },
  { mode: 'area-freehand', label: 'Freehand', icon: Pencil },
  { mode: 'area-circle-3pt', label: 'Circle (3pt)', icon: Circle },
  { mode: 'area-circle-center', label: 'Circle (center)', icon: CircleDot },
];

const GRID_PRESETS = [10, 25, 50, 100, 200, 500];

export function ModeButtons() {
  const mode = useUIStore((s) => s.mode);
  const viewMode = useUIStore((s) => s.viewMode);
  const toggleMode = useUIStore((s) => s.toggleMode);
  const setMode = useUIStore((s) => s.setMode);
  const lastAreaTool = useUIStore((s) => s.lastAreaTool);
  const cropMode = useUIStore((s) => s.cropMode);
  const setCropMode = useUIStore((s) => s.setCropMode);
  const image = useCanvasStore((s) => s.image);
  const modelUrl = useCanvasStore((s) => s.modelUrl);
  const gridEnabled = useUIStore((s) => s.gridEnabled);
  const gridSpacing = useUIStore((s) => s.gridSpacing);
  const toggleGrid = useUIStore((s) => s.toggleGrid);
  const setGridSpacing = useUIStore((s) => s.setGridSpacing);

  const is3D = viewMode === '3d';
  const hasTarget = is3D ? !!modelUrl : !!image;

  return (
    <div className="flex items-center gap-1">
      {/* Reference & Measure (unified for 2D and 3D) */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={mode === 'reference' ? 'default' : 'outline'}
            size="sm"
            onClick={() => toggleMode('reference')}
            disabled={!hasTarget}
            className={mode === 'reference' ? 'bg-rose-600 hover:bg-rose-700 text-white' : ''}
          >
            {is3D ? <Box className="mr-1.5 h-4 w-4" /> : <Ruler className="mr-1.5 h-4 w-4" />}
            Reference
          </Button>
        </TooltipTrigger>
        <TooltipContent>{is3D ? 'Set reference on 3D model' : 'Draw a reference line (R)'}</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={mode === 'measure' ? 'default' : 'outline'}
            size="sm"
            onClick={() => toggleMode('measure')}
            disabled={!hasTarget}
            className={mode === 'measure' ? 'bg-cyan-600 hover:bg-cyan-700 text-white' : ''}
          >
            {is3D ? <Ruler className="mr-1.5 h-4 w-4" /> : <PenLine className="mr-1.5 h-4 w-4" />}
            Measure
          </Button>
        </TooltipTrigger>
        <TooltipContent>{is3D ? 'Measure distance on 3D model' : 'Draw a measurement line (M)'}</TooltipContent>
      </Tooltip>

      {/* 2D-only tools */}
      {!is3D && (
        <>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={mode === 'angle' ? 'default' : 'outline'}
                size="sm"
                onClick={() => toggleMode('angle')}
                disabled={!image}
                className={mode === 'angle' ? 'bg-amber-600 hover:bg-amber-700 text-white' : ''}
              >
                <TriangleRight className="mr-1.5 h-4 w-4" />
                Angle
              </Button>
            </TooltipTrigger>
            <TooltipContent>Measure an angle (A)</TooltipContent>
          </Tooltip>
          <ToolGroupButton
            tools={AREA_TOOLS}
            activeMode={mode}
            lastUsedMode={lastAreaTool}
            onSelect={(m: DrawMode) => {
              if (m === 'none') {
                setMode('none');
              } else {
                toggleMode(m);
              }
            }}
            disabled={!image}
            activeClassName="bg-emerald-600 hover:bg-emerald-700 text-white"
            tooltip="Measure an area (P)"
          />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={mode === 'annotation' ? 'default' : 'outline'}
                size="sm"
                onClick={() => toggleMode('annotation')}
                disabled={!image}
                className={mode === 'annotation' ? 'bg-violet-600 hover:bg-violet-700 text-white' : ''}
              >
                <StickyNote className="mr-1.5 h-4 w-4" />
                Annotate
              </Button>
            </TooltipTrigger>
            <TooltipContent>Place a text annotation (T)</TooltipContent>
          </Tooltip>
        </>
      )}
      {!is3D && (
        <>
          <div className="mx-1 h-6 w-px bg-border" />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={cropMode ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCropMode(!cropMode)}
                disabled={!image}
                className={cropMode ? 'bg-orange-600 hover:bg-orange-700 text-white' : ''}
              >
                <Crop className="mr-1.5 h-4 w-4" />
                Crop
              </Button>
            </TooltipTrigger>
            <TooltipContent>Crop the image (C)</TooltipContent>
          </Tooltip>
        </>
      )}
      {!is3D && (
        <>
          <div className="mx-1 h-6 w-px bg-border" />
          <div className="flex items-center">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={gridEnabled ? 'default' : 'outline'}
              size="sm"
              onClick={toggleGrid}
              disabled={!image}
              className={`rounded-r-none ${gridEnabled ? 'bg-muted hover:bg-accent text-white' : ''}`}
            >
              <Grid3x3 className="mr-1.5 h-4 w-4" />
              Grid
            </Button>
          </TooltipTrigger>
          <TooltipContent>Toggle grid overlay (G)</TooltipContent>
        </Tooltip>
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button
                  variant={gridEnabled ? 'default' : 'outline'}
                  size="sm"
                  disabled={!image}
                  className={`rounded-l-none border-l-0 px-1.5 ${gridEnabled ? 'bg-muted hover:bg-accent text-white' : ''}`}
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>Grid spacing</TooltipContent>
          </Tooltip>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Grid spacing (px)</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup
              value={String(gridSpacing)}
              onValueChange={(v) => setGridSpacing(Number(v))}
            >
              {GRID_PRESETS.map((size) => (
                <DropdownMenuRadioItem key={size} value={String(size)}>
                  {size}px
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
        </>
      )}
    </div>
  );
}
