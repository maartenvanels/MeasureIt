'use client';

import { Toolbar } from '@/components/toolbar/Toolbar';
import { SelectedMeasurementBar } from '@/components/toolbar/SelectedMeasurementBar';
import { CanvasContainer } from '@/components/canvas/CanvasContainer';
import { MeasurementsSidebar } from '@/components/sidebar/MeasurementsSidebar';
import { SidebarResizeHandle } from '@/components/sidebar/SidebarResizeHandle';
import { StatusBar } from '@/components/StatusBar';
import { HelpDialog } from '@/components/dialogs/HelpDialog';
import { SettingsDialog } from '@/components/dialogs/SettingsDialog';
import { AnnotationEditorDialog } from '@/components/dialogs/AnnotationEditorDialog';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

export default function AppPage() {
  useKeyboardShortcuts();

  return (
    <div className="relative flex h-screen w-screen flex-col overflow-hidden bg-background">
      <Toolbar />
      <SelectedMeasurementBar />
      <div className="flex flex-1 overflow-hidden">
        <CanvasContainer />
        <SidebarResizeHandle />
        <MeasurementsSidebar />
      </div>
      <StatusBar />
      <HelpDialog />
      <SettingsDialog />
      <AnnotationEditorDialog />
    </div>
  );
}
