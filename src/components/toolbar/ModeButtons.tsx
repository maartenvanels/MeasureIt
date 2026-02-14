'use client';

import { Ruler, PenLine, TriangleRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useUIStore } from '@/stores/useUIStore';
import { useCanvasStore } from '@/stores/useCanvasStore';

export function ModeButtons() {
  const mode = useUIStore((s) => s.mode);
  const toggleMode = useUIStore((s) => s.toggleMode);
  const image = useCanvasStore((s) => s.image);

  return (
    <div className="flex items-center gap-1">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={mode === 'reference' ? 'default' : 'outline'}
            size="sm"
            onClick={() => toggleMode('reference')}
            disabled={!image}
            className={mode === 'reference' ? 'bg-rose-600 hover:bg-rose-700 text-white' : ''}
          >
            <Ruler className="mr-1.5 h-4 w-4" />
            Reference
          </Button>
        </TooltipTrigger>
        <TooltipContent>Draw a reference line (R)</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={mode === 'measure' ? 'default' : 'outline'}
            size="sm"
            onClick={() => toggleMode('measure')}
            disabled={!image}
            className={mode === 'measure' ? 'bg-cyan-600 hover:bg-cyan-700 text-white' : ''}
          >
            <PenLine className="mr-1.5 h-4 w-4" />
            Measure
          </Button>
        </TooltipTrigger>
        <TooltipContent>Draw a measurement line (M)</TooltipContent>
      </Tooltip>
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
    </div>
  );
}
