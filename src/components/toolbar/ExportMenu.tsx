'use client';

import { Download, FileSpreadsheet, FileJson, Clipboard, ImageDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useExport } from '@/hooks/useExport';
import { useMeasurementStore } from '@/stores/useMeasurementStore';

export function ExportMenu() {
  const measurements = useMeasurementStore((s) => s.measurements);
  const { exportCSV, exportJSON, exportClipboard, exportImage } = useExport();

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              disabled={measurements.length === 0}
            >
              <Download className="mr-1.5 h-4 w-4" />
              Export
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>Export measurements</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportCSV}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Export CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportJSON}>
          <FileJson className="mr-2 h-4 w-4" />
          Export JSON
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportClipboard}>
          <Clipboard className="mr-2 h-4 w-4" />
          Copy to clipboard
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportImage}>
          <ImageDown className="mr-2 h-4 w-4" />
          Save annotated image
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
