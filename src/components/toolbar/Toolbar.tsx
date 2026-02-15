'use client';

import { useState } from 'react';
import { Upload, HelpCircle, Save, FolderOpen, Trash2, FilePlus2, Box } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ModeButtons } from './ModeButtons';
import { ReferenceInput } from './ReferenceInput';
import { HistoryButtons } from './HistoryButtons';
import { ExportMenu } from './ExportMenu';
import { useUIStore } from '@/stores/useUIStore';
import { useCanvasStore } from '@/stores/useCanvasStore';
import { useMeasurementStore } from '@/stores/useMeasurementStore';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { SavedProject } from '@/types/measurement';

export function Toolbar() {
  const setHelpDialogOpen = useUIStore((s) => s.setHelpDialogOpen);
  const viewMode = useUIStore((s) => s.viewMode);
  const setViewMode = useUIStore((s) => s.setViewMode);
  const image = useCanvasStore((s) => s.image);
  const modelUrl = useCanvasStore((s) => s.modelUrl);
  const resetCanvas = useCanvasStore((s) => s.reset);
  const clearAll = useMeasurementStore((s) => s.clearAll);
  const { saveProject, loadProject, listProjects, deleteProject } = useLocalStorage();
  const [projects, setProjects] = useState<SavedProject[]>([]);

  const refreshProjects = () => {
    setProjects(listProjects());
  };

  const handleSave = () => {
    const name = prompt('Project name:', `Project ${new Date().toLocaleString()}`);
    if (name !== null) {
      saveProject(name || undefined);
      refreshProjects();
    }
  };

  const handleLoad = (id: string) => {
    loadProject(id);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteProject(id);
    refreshProjects();
  };

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

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            onClick={() => document.getElementById('modelFileInput')?.click()}
          >
            <Box className="mr-1.5 h-4 w-4" />
            3D Model
          </Button>
        </TooltipTrigger>
        <TooltipContent>Load a 3D model (.glb, .stl)</TooltipContent>
      </Tooltip>

      {/* View mode switcher — only show when both image and model are loaded */}
      {image && modelUrl && (
        <div className="flex items-center rounded-md border border-zinc-700">
          <Button
            variant={viewMode === '2d' ? 'default' : 'ghost'}
            size="sm"
            className={`h-7 rounded-r-none text-xs ${viewMode === '2d' ? 'bg-zinc-600' : ''}`}
            onClick={() => setViewMode('2d')}
          >
            2D
          </Button>
          <Button
            variant={viewMode === '3d' ? 'default' : 'ghost'}
            size="sm"
            className={`h-7 rounded-l-none text-xs ${viewMode === '3d' ? 'bg-zinc-600' : ''}`}
            onClick={() => setViewMode('3d')}
          >
            3D
          </Button>
        </div>
      )}

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={!image && !modelUrl}
            onClick={() => {
              if (confirm('Start over? All measurements will be removed.')) {
                clearAll();
                resetCanvas();
                setViewMode('2d');
              }
            }}
          >
            <FilePlus2 className="mr-1.5 h-4 w-4" />
            New
          </Button>
        </TooltipTrigger>
        <TooltipContent>Remove image/model and start over</TooltipContent>
      </Tooltip>

      <Separator orientation="vertical" className="mx-1 h-6" />

      <ModeButtons />

      <Separator orientation="vertical" className="mx-1 h-6" />

      <ReferenceInput />

      <Separator orientation="vertical" className="mx-1 h-6" />

      <HistoryButtons />

      <Separator orientation="vertical" className="mx-1 h-6" />

      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSave}
            >
              <Save className="mr-1.5 h-4 w-4" />
              Save
            </Button>
          </TooltipTrigger>
          <TooltipContent>Save project to browser storage</TooltipContent>
        </Tooltip>

        <DropdownMenu onOpenChange={(open) => { if (open) refreshProjects(); }}>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <FolderOpen className="mr-1.5 h-4 w-4" />
                  Load
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>Load a saved project</TooltipContent>
          </Tooltip>
          <DropdownMenuContent align="start" className="w-64">
            <DropdownMenuLabel>Saved Projects</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {projects.length === 0 ? (
              <DropdownMenuItem disabled>
                <span className="text-zinc-500">No saved projects</span>
              </DropdownMenuItem>
            ) : (
              projects.map((p) => (
                <DropdownMenuItem
                  key={p.id}
                  onClick={() => handleLoad(p.id)}
                  className="flex items-center justify-between"
                >
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="truncate text-sm">{p.name}</span>
                    <span className="text-xs text-zinc-500">
                      {p.measurements.length} items &middot;{' '}
                      {new Date(p.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <button
                    className="ml-2 flex-shrink-0 rounded p-1 text-zinc-500 hover:text-rose-400"
                    onClick={(e) => handleDelete(e, p.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

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
