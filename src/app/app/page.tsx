'use client';

import { Toolbar } from '@/components/toolbar/Toolbar';
import { CanvasContainer } from '@/components/canvas/CanvasContainer';
import { MeasurementsSidebar } from '@/components/sidebar/MeasurementsSidebar';
import { StatusBar } from '@/components/StatusBar';
import { HelpDialog } from '@/components/dialogs/HelpDialog';
import { SettingsDialog } from '@/components/dialogs/SettingsDialog';
import { AnnotationEditorDialog } from '@/components/dialogs/AnnotationEditorDialog';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

export default function AppPage() {
  useKeyboardShortcuts();

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-zinc-950">
      <Toolbar />
      <div className="flex flex-1 overflow-hidden">
        <CanvasContainer />
        <MeasurementsSidebar />
      </div>
      <StatusBar />
      <HelpDialog />
      <SettingsDialog />
      <AnnotationEditorDialog />
    </div>
  );
}
