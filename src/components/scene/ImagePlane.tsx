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
 * UV is flipped so the image isn't mirrored vertically.
 */
export function ImagePlane({ image, onPointerDown, onPointerMove, onPointerUp, onPointerLeave, onDoubleClick }: ImagePlaneProps) {
  const { texture, geometry } = useMemo(() => {
    // Create texture from image
    const tex = new THREE.Texture(image);
    tex.needsUpdate = true;
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;

    // Create plane geometry sized to image pixels
    const geo = new THREE.PlaneGeometry(image.width, image.height);

    // Flip UV Y so image top-left = geometry top-left
    const uv = geo.getAttribute('uv');
    for (let i = 0; i < uv.count; i++) {
      uv.setY(i, 1 - uv.getY(i));
    }
    uv.needsUpdate = true;

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
