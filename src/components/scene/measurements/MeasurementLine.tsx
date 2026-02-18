'use client';

import { useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import { Line, Html } from '@react-three/drei';
import * as THREE from 'three';
import { Measurement, Point } from '@/types/measurement';
import { DEFAULT_COLORS } from '@/lib/canvas-rendering';
import { DraggableLabel } from './DraggableLabel';

/** Triangular end marker for measurement lines, constant screen size */
function EndMarker({ position, angle, color, zoom }: {
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
    <mesh
      position={position}
      rotation={[0, 0, angle]}
      scale={[scale, scale, 1]}
    >
      <primitive object={geometry} attach="geometry" />
      <meshBasicMaterial color={color} />
    </mesh>
  );
}

/** Dot at measurement endpoints */
function EndDot({ position, color, zoom }: {
  position: [number, number, number];
  color: string;
  zoom: number;
}) {
  const radius = 4 / zoom;
  return (
    <mesh position={position}>
      <circleGeometry args={[radius, 16]} />
      <meshBasicMaterial color={color} />
    </mesh>
  );
}

interface MeasurementLineProps {
  measurement: Measurement;
  label: string;
  selected: boolean;
}

export function MeasurementLineComponent({ measurement, label, selected }: MeasurementLineProps) {
  const zoom = useThree((s) => (s.camera as THREE.OrthographicCamera).zoom || 1);
  const color = measurement.color ?? DEFAULT_COLORS[measurement.type] ?? '#06b6d4';

  const s = measurement.start;
  const e = measurement.end;
  const angle = Math.atan2(-(e.y - s.y), e.x - s.x); // negate Y for world space

  const startPos: [number, number, number] = [s.x, -s.y, 0.01];
  const endPos: [number, number, number] = [e.x, -e.y, 0.01];
  const midPos: [number, number, number] = [
    (s.x + e.x) / 2,
    -(s.y + e.y) / 2,
    0.02,
  ];

  return (
    <group>
      {/* Main line */}
      <Line
        points={[startPos, endPos]}
        color={color}
        lineWidth={selected ? 3 : 2}
        transparent
        opacity={selected ? 1 : 0.85}
      />

      {/* End markers */}
      <EndMarker position={startPos} angle={angle} color={color} zoom={zoom} />
      <EndMarker position={endPos} angle={angle + Math.PI} color={color} zoom={zoom} />
      <EndDot position={startPos} color={color} zoom={zoom} />
      <EndDot position={endPos} color={color} zoom={zoom} />

      {/* Value label */}
      <DraggableLabel
        measurementId={measurement.id}
        position={midPos}
        offset={measurement.labelOffset}
        labelType="value"
      >
        <div
          className="rounded px-2 py-0.5 text-xs font-semibold font-mono whitespace-nowrap"
          style={{
            backgroundColor: 'rgba(9, 9, 11, 0.9)',
            color,
            border: selected ? `2px solid ${color}` : `1px solid ${color}`,
          }}
        >
          {label}
        </div>
      </DraggableLabel>

      {/* Name label */}
      {measurement.name && (
        <DraggableLabel
          measurementId={measurement.id}
          position={midPos}
          offset={measurement.nameLabelOffset ?? { x: 0, y: 24 }}
          labelType="name"
        >
          <div
            className="rounded px-1.5 py-0.5 text-[11px] font-mono whitespace-nowrap"
            style={{
              backgroundColor: 'rgba(9, 9, 11, 0.7)',
              color: '#71717a',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            {measurement.name}
          </div>
        </DraggableLabel>
      )}
    </group>
  );
}
