'use client';

import { useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { ThreeEvent } from '@react-three/fiber';

interface ImagePlaneProps {
  image: HTMLImageElement;
  onPointerDown?: (e: ThreeEvent<PointerEvent>) => void;
  onPointerMove?: (e: ThreeEvent<PointerEvent>) => void;
  onPointerUp?: (e: ThreeEvent<PointerEvent>) => void;
  onPointerLeave?: () => void;
  onDoubleClick?: (e: ThreeEvent<MouseEvent>) => void;
}

/**
 * Renders an image as a textured plane in Three.js.
 *
 * Coordinate mapping: 1 Three.js unit = 1 image pixel.
 * Image top-left (0,0) maps to world (0, 0, 0).
 * Image point (x, y) maps to world (x, -y, 0).
 *
 * The plane is positioned at [w/2, -h/2] so its top edge sits on y=0 (where
 * image y=0 maps). With Texture.flipY=true (default), UV (0,1) samples the
 * image's top-left pixel — which matches the geometry's top-left vertex
 * after the position offset. No UV remapping needed.
 */
export function ImagePlane({ image, onPointerDown, onPointerMove, onPointerUp, onPointerLeave, onDoubleClick }: ImagePlaneProps) {
  const { texture, geometry } = useMemo(() => {
    const tex = new THREE.Texture(image);
    tex.needsUpdate = true;
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;

    const geo = new THREE.PlaneGeometry(image.width, image.height);
    return { texture: tex, geometry: geo };
  }, [image]);

  // Dispose texture + geometry on unmount or image change
  useEffect(() => {
    return () => {
      texture.dispose();
      geometry.dispose();
    };
  }, [texture, geometry]);

  return (
    <mesh
      position={[image.width / 2, -image.height / 2, 0]}
      geometry={geometry}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerLeave}
      onDoubleClick={onDoubleClick}
    >
      <meshBasicMaterial map={texture} />
    </mesh>
  );
}
