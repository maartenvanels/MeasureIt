'use client';

import { useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import { Html, Line } from '@react-three/drei';
import * as THREE from 'three';
import { Annotation, Point } from '@/types/measurement';
import { DEFAULT_COLORS } from '@/lib/canvas-rendering';

/** Triangular arrowhead for leader lines */
function Arrowhead({ position, angle, color, zoom }: {
  position: [number, number, number];
  angle: number;
  color: string;
  zoom: number;
}) {
  const geometry = useMemo(() => {
    const len = 10;
    const spread = Math.PI / 6;
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.lineTo(len * Math.cos(spread), len * Math.sin(spread));
    shape.lineTo(len * Math.cos(-spread), len * Math.sin(-spread));
    shape.closePath();
    return new THREE.ShapeGeometry(shape);
  }, []);

  const scale = 1 / zoom;

  return (
    <mesh position={position} rotation={[0, 0, angle]} scale={[scale, scale, 1]}>
      <primitive object={geometry} attach="geometry" />
      <meshBasicMaterial color={color} />
    </mesh>
  );
}

interface AnnotationMarkerProps {
  annotation: Annotation;
  selected: boolean;
  onSelect: () => void;
  onDoubleClick: () => void;
}

export function AnnotationMarkerComponent({ annotation, selected, onSelect, onDoubleClick }: AnnotationMarkerProps) {
  const zoom = useThree((s) => (s.camera as THREE.OrthographicCamera).zoom || 1);
  const color = annotation.color ?? DEFAULT_COLORS.annotation;

  const worldPos: [number, number, number] = [annotation.position.x, -annotation.position.y, 0.02];

  // Leader line to arrow target
  const hasArrow = !!annotation.arrowTarget;
  const arrowWorldPos: [number, number, number] | null = annotation.arrowTarget
    ? [annotation.arrowTarget.x, -annotation.arrowTarget.y, 0.015]
    : null;

  const arrowAngle = hasArrow && annotation.arrowTarget
    ? Math.atan2(
        -(annotation.arrowTarget.y - annotation.position.y),
        annotation.arrowTarget.x - annotation.position.x
      ) + Math.PI // point back toward annotation
    : 0;

  return (
    <group>
      {/* Leader line */}
      {hasArrow && arrowWorldPos && (
        <>
          <Line
            points={[worldPos, arrowWorldPos]}
            color={color}
            lineWidth={selected ? 2.5 : 1.5}
            transparent
            opacity={selected ? 1 : 0.85}
          />
          <Arrowhead position={arrowWorldPos} angle={arrowAngle} color={color} zoom={zoom} />
        </>
      )}

      {/* Annotation box */}
      <Html position={worldPos} style={{ pointerEvents: 'auto' }}>
        <div
          onClick={(e) => { e.stopPropagation(); onSelect(); }}
          onDoubleClick={(e) => { e.stopPropagation(); onDoubleClick(); }}
          className="rounded-md px-3 py-2 text-sm max-w-[250px] cursor-pointer"
          style={{
            backgroundColor: 'rgba(9, 9, 11, 0.9)',
            color: '#e4e4e7',
            borderLeft: `3px solid ${color}`,
            border: selected ? `2px solid ${color}` : undefined,
            borderLeftWidth: selected ? '3px' : '3px',
            userSelect: 'none',
          }}
        >
          {annotation.content || <span className="text-zinc-500 italic">Empty annotation</span>}
        </div>
      </Html>
    </group>
  );
}
