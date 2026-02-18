'use client';

import { useCallback } from 'react';
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
 * Call fitToImage once when image is loaded to center and fit the image in view.
 *
 * Key detail: MapControls has its own `target` that determines where the camera
 * looks. We must sync it with the camera position so the camera looks straight
 * down -Z at the image plane (not towards the default origin).
 */
export function useImageCamera() {
  // gl and camera are stable references. controls changes once (null → MapControls).
  // We read gl.domElement dimensions at call time to avoid re-fitting on resize.
  const { camera, gl, controls } = useThree();

  const fitToImage = useCallback(
    (imageWidth: number, imageHeight: number) => {
      if (!(camera instanceof THREE.OrthographicCamera)) return;

      // Read actual canvas dimensions at call time (not reactive)
      const rect = gl.domElement.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      // Calculate zoom so image fills ~90% of viewport
      const zoomX = rect.width / imageWidth;
      const zoomY = rect.height / imageHeight;
      const zoom = Math.min(zoomX, zoomY) * 0.9;

      const cx = imageWidth / 2;
      const cy = -imageHeight / 2;

      camera.zoom = zoom;
      camera.position.set(cx, cy, 100);
      camera.lookAt(cx, cy, 0);
      camera.updateProjectionMatrix();

      // Sync MapControls target so the camera looks straight down at the image
      if (controls && 'target' in controls) {
        (controls.target as THREE.Vector3).set(cx, cy, 0);
        (controls as unknown as { update: () => void }).update();
      }
    },
    [camera, gl, controls]
  );

  return { fitToImage };
}
