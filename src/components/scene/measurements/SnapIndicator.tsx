'use client';

import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Point } from '@/types/measurement';

interface SnapIndicatorProps {
  point: Point;
}

/** Cyan ring + center dot at snap point, constant screen size */
export function SnapIndicator({ point }: SnapIndicatorProps) {
  const zoom = useThree((s) => (s.camera as THREE.OrthographicCamera).zoom || 1);
  const ringOuter = 10 / zoom;
  const ringInner = 8 / zoom;
  const dotRadius = 3 / zoom;

  return (
    <group position={[point.x, -point.y, 0.025]}>
      {/* Outer ring */}
      <mesh>
        <ringGeometry args={[ringInner, ringOuter, 32]} />
        <meshBasicMaterial color="#22d3ee" />
      </mesh>
      {/* Inner dot */}
      <mesh>
        <circleGeometry args={[dotRadius, 16]} />
        <meshBasicMaterial color="#22d3ee" />
      </mesh>
    </group>
  );
}
