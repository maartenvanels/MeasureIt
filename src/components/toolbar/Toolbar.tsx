'use client';

import { Upload, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ModeButtons } from './ModeButtons';
import { ReferenceInput } from './ReferenceInput';
import { HistoryButtons } from './HistoryButtons';
import { ExportMenu } from './ExportMenu';
import { useUIStore } from '@/stores/useUIStore';

export function Toolbar() {
  const setHelpDialogOpen = useUIStore((s) => s.setHelpDialogOpen);

  return (
    <header className="flex items-center gap-3 border-b border-zinc-800 bg-zinc-900 px-4 py-2">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-600 text-sm font-bold text-white">
          M
        </div>
        <span className="text-base font-semibold text-zinc-100">
          MeasureIt
        </span>
      </div>

      <Separator orientation="vertical" className="mx-1 h-6" />

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            onClick={() => document.getElementById('fileInput')?.click()}
          >
            <Upload className="mr-1.5 h-4 w-4" />
            Image
          </Button>
        </TooltipTrigger>
        <TooltipContent>Load an image</TooltipContent>
      </Tooltip>

      <Separator orientation="vertical" className="mx-1 h-6" />

      <ModeButtons />

      <Separator orientation="vertical" className="mx-1 h-6" />

      <ReferenceInput />

      <Separator orientation="vertical" className="mx-1 h-6" />

      <HistoryButtons />

      <div className="flex-1" />

      <ExportMenu />

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setHelpDialogOpen(true)}
          >
            <HelpCircle className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Help</TooltipContent>
      </Tooltip>
    </header>
  );
}
