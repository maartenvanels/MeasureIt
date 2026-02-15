'use client';

import { Plus, Minus, Maximize } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useCanvasStore } from '@/stores/useCanvasStore';
import { RefObject } from 'react';

interface ZoomControlsProps {
  containerRef: RefObject<HTMLDivElement | null>;
}

export function ZoomControls({ containerRef }: ZoomControlsProps) {
  const image = useCanvasStore((s) => s.image);
  const zoom = useCanvasStore((s) => s.transform.zoom);
  const zoomIn = useCanvasStore((s) => s.zoomIn);
  const zoomOut = useCanvasStore((s) => s.zoomOut);
  const fitImageToContainer = useCanvasStore((s) => s.fitImageToContainer);

  if (!image) return null;

  const handleFit = () => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    fitImageToContainer(rect.width, rect.height);
  };

  return (
    <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-lg border border-border bg-card/90 p-1 backdrop-blur-sm">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={zoomOut}
          >
            <Minus className="h-3.5 w-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">Zoom out</TooltipContent>
      </Tooltip>

      <span className="min-w-[3rem] text-center text-xs tabular-nums text-muted-foreground">
        {Math.round(zoom * 100)}%
      </span>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={zoomIn}
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">Zoom in</TooltipContent>
      </Tooltip>

      <div className="mx-0.5 h-4 w-px bg-border" />

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleFit}
          >
            <Maximize className="h-3.5 w-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">Fit to screen</TooltipContent>
      </Tooltip>
    </div>
  );
}
