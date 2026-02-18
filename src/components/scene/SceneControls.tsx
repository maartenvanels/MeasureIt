'use client';

import { useRef, useEffect, useCallback } from 'react';
import { useThree } from '@react-three/fiber';
import { MapControls, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

interface SceneControlsProps {
  /** Disable controls (e.g. during drawing) */
  disabled?: boolean;
  /** 'ortho' for 2D image viewing, 'orbit' for 3D model */
  mode: 'ortho' | 'orbit';
}

/**
 * Camera controls that switch between:
 * - MapControls (ortho/2D): left-drag=pan, scroll=zoom, no rotation
 * - OrbitControls (orbit/3D): full orbit, zoom, pan
 */
export function SceneControls({ disabled = false, mode }: SceneControlsProps) {
  if (mode === 'orbit') {
    return (
      <OrbitControls
        makeDefault
        enabled={!disabled}
        enableDamping
        dampingFactor={0.1}
      />
    );
  }

  return (
    <MapControls
      makeDefault
      enabled={!disabled}
      enableRotate={false}
      enableDamping={false}
      screenSpacePanning
      minZoom={0.05}
      maxZoom={50}
      mouseButtons={{
        LEFT: THREE.MOUSE.PAN,
        MIDDLE: THREE.MOUSE.PAN,
        RIGHT: undefined as unknown as THREE.MOUSE,
      }}
    />
  );
}

/**
 * Sets up an orthographic camera looking at the image plane.
 * Call once when image is loaded to fit the image in view.
 */
export function useImageCamera() {
  const { camera, size } = useThree();

  const fitToImage = useCallback(
    (imageWidth: number, imageHeight: number) => {
      if (!(camera instanceof THREE.OrthographicCamera)) return;

      // Calculate zoom so image fills ~90% of viewport
      const zoomX = size.width / imageWidth;
      const zoomY = size.height / imageHeight;
      const zoom = Math.min(zoomX, zoomY) * 0.9;

      camera.zoom = zoom;
      // Center camera on image center (image is at x=w/2, y=-h/2)
      camera.position.set(imageWidth / 2, -imageHeight / 2, 100);
      camera.updateProjectionMatrix();
    },
    [camera, size]
  );

  return { fitToImage };
}
