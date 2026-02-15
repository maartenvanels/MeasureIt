'use client';

import { useCallback } from 'react';
import { useCanvasStore } from '@/stores/useCanvasStore';
import { useUIStore } from '@/stores/useUIStore';

const MODEL_EXTENSIONS: Record<string, 'glb' | 'stl'> = {
  '.glb': 'glb',
  '.gltf': 'glb',
  '.stl': 'stl',
};

function getModelFileType(fileName: string): 'glb' | 'stl' | null {
  const ext = fileName.toLowerCase().slice(fileName.lastIndexOf('.'));
  return MODEL_EXTENSIONS[ext] ?? null;
}

export function isModelFile(file: File): boolean {
  return getModelFileType(file.name) !== null;
}

export function use3DModelLoader() {
  const setModel = useCanvasStore((s) => s.setModel);
  const setViewMode = useUIStore((s) => s.setViewMode);

  const loadFromFile = useCallback(
    (file: File) => {
      const fileType = getModelFileType(file.name);
      if (!fileType) return;

      const url = URL.createObjectURL(file);
      setModel(url, file.name, fileType);
      setViewMode('3d');
    },
    [setModel, setViewMode]
  );

  const loadFromDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file && isModelFile(file)) {
        loadFromFile(file);
        return true;
      }
      return false;
    },
    [loadFromFile]
  );

  return { loadFromFile, loadFromDrop };
}
