'use client';

import { useCallback } from 'react';
import { useCanvasStore } from '@/stores/useCanvasStore';

export function useImageLoader() {
  const setImage = useCanvasStore((s) => s.setImage);
  const fitImageToContainer = useCanvasStore((s) => s.fitImageToContainer);

  const loadFromFile = useCallback(
    (file: File, containerWidth: number, containerHeight: number) => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          setImage(img, file.name);
          fitImageToContainer(containerWidth, containerHeight);
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    },
    [setImage, fitImageToContainer]
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
