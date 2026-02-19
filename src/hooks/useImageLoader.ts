'use client';

import { useCallback } from 'react';
import { useCanvasStore } from '@/stores/useCanvasStore';
import { useSceneObjectStore } from '@/stores/useSceneObjectStore';

export function useImageLoader() {
  const setImage = useCanvasStore((s) => s.setImage);
  const addImage = useSceneObjectStore((s) => s.addImage);

  const loadFromFile = useCallback(
    (file: File, containerWidth: number, containerHeight: number) => {
      void containerWidth; void containerHeight;
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        const img = new Image();
        img.onload = () => {
          // Bridge: populate both stores during migration
          setImage(img, file.name);
          addImage(img, file.name, dataUrl);
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
    },
    [setImage, addImage]
  );

  const loadFromDrop = useCallback(
    (e: React.DragEvent, containerWidth: number, containerHeight: number) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) loadFromFile(file, containerWidth, containerHeight);
    },
    [loadFromFile]
  );

  const loadFromClipboard = useCallback(
    (e: ClipboardEvent, containerWidth: number, containerHeight: number) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) loadFromFile(file, containerWidth, containerHeight);
          break;
        }
      }
    },
    [loadFromFile]
  );

  return { loadFromFile, loadFromDrop, loadFromClipboard };
}
