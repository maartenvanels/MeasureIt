'use client';

import { useEffect, useCallback } from 'react';
import { TransformControls } from '@react-three/drei';
import { useSceneObjectStore } from '@/stores/useSceneObjectStore';
import type { Event as ThreeEvent } from 'three';

/**
 * Renders a TransformControls gizmo on the currently selected scene object.
 * Reads the target from the object ref registry in useSceneObjectStore.
 * Updates object transform on change. Skips locked objects.
 */
export function TransformGizmo() {
  const selectedObjectId = useSceneObjectStore((s) => s.selectedObjectId);
  const transformMode = useSceneObjectStore((s) => s.transformMode);
  const objectRefs = useSceneObjectStore((s) => s.objectRefs);
  const objects = useSceneObjectStore((s) => s.objects);
  const setTransform = useSceneObjectStore((s) => s.setTransform);

  const selectedObject = objects.find((o) => o.id === selectedObjectId);
  const isLocked = selectedObject?.locked ?? false;
  const isVisible = selectedObject?.visible ?? false;
  const targetRef = selectedObjectId ? objectRefs.get(selectedObjectId) : undefined;
  const target = targetRef?.current ?? undefined;

  // Sync transform back to store when gizmo changes
  const handleObjectChange = useCallback(
    (_e?: ThreeEvent) => {
      if (!selectedObjectId || !target) return;
      setTransform(selectedObjectId, {
        position: [target.position.x, target.position.y, target.position.z],
        rotation: [target.rotation.x, target.rotation.y, target.rotation.z],
        scale: [target.scale.x, target.scale.y, target.scale.z],
      });
    },
    [selectedObjectId, target, setTransform],
  );

  // Keyboard shortcuts for transform modes
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger in input fields
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const setMode = useSceneObjectStore.getState().setTransformMode;
      if (e.key === 't' || e.key === 'T') setMode('translate');
      else if (e.key === 'r' || e.key === 'R') setMode('rotate');
      else if (e.key === 's' || e.key === 'S') setMode('scale');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Don't render if no object selected, object is locked, or no ref available
  if (!selectedObjectId || !target || isLocked || !isVisible) return null;

  return (
    <TransformControls
      object={target}
      mode={transformMode}
      onObjectChange={handleObjectChange}
      space="local"
    />
  );
}
