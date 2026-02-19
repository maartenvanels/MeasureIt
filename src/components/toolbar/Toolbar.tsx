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
import { ThemeToggle } from '@/components/ThemeToggle';
import { useUIStore } from '@/stores/useUIStore';
import { useCanvasStore } from '@/stores/useCanvasStore';
import { useMeasurementStore } from '@/stores/useMeasurementStore';
import { useSceneObjectStore } from '@/stores/useSceneObjectStore';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { SavedProject, SavedProjectV2 } from '@/types/measurement';

export function Toolbar() {
  const setHelpDialogOpen = useUIStore((s) => s.setHelpDialogOpen);
  const image = useCanvasStore((s) => s.image);
  const modelUrl = useCanvasStore((s) => s.modelUrl);
  const resetCanvas = useCanvasStore((s) => s.reset);
  const clearAll = useMeasurementStore((s) => s.clearAll);
  const sceneObjectCount = useSceneObjectStore((s) => s.objects.length);
  const resetSceneObjects = useSceneObjectStore((s) => s.reset);
  const { saveProject, loadProject, listProjects, deleteProject } = useLocalStorage();
  const [projects, setProjects] = useState<(SavedProject | SavedProjectV2)[]>([]);

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
    <header className="flex items-center gap-3 border-b border-border bg-card px-4 py-2">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-600 text-sm font-bold text-white">
          M
        </div>
        <span className="text-base font-semibold text-foreground">
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

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={!image && !modelUrl && sceneObjectCount === 0}
            onClick={() => {
              if (confirm('Start over? All objects and measurements will be removed.')) {
                clearAll();
                resetCanvas();
                resetSceneObjects();
              }
            }}
          >
            <FilePlus2 className="mr-1.5 h-4 w-4" />
            New
          </Button>
        </TooltipTrigger>
        <TooltipContent>Remove all objects and start over</TooltipContent>
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
                <span className="text-muted-foreground">No saved projects</span>
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
                    <span className="text-xs text-muted-foreground">
                      {p.measurements.length} items &middot;{' '}
                      {new Date(p.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <button
                    className="ml-2 flex-shrink-0 rounded p-1 text-muted-foreground hover:text-rose-400"
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

      <ThemeToggle />

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
