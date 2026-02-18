'use client';

import { useMemo } from 'react';
import * as THREE from 'three';

interface ImageGridProps {
  imageWidth: number;
  imageHeight: number;
  spacing: number;
}

/**
 * Grid overlay on the image plane.
 * Uses a single lineSegments draw call for performance.
 */
export function ImageGrid({ imageWidth, imageHeight, spacing }: ImageGridProps) {
  const geometry = useMemo(() => {
    const positions: number[] = [];

    // Vertical lines
    for (let x = 0; x <= imageWidth; x += spacing) {
      positions.push(x, 0, 0.001, x, -imageHeight, 0.001);
    }
    // Horizontal lines
    for (let y = 0; y <= imageHeight; y += spacing) {
      positions.push(0, -y, 0.001, imageWidth, -y, 0.001);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    return geo;
  }, [imageWidth, imageHeight, spacing]);

  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial color="white" transparent opacity={0.08} />
    </lineSegments>
  );
}
