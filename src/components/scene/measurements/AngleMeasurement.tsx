'use client';

import { useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import * as THREE from 'three';
import { AngleMeasurement as AngleMeasurementType } from '@/types/measurement';
import { DEFAULT_COLORS } from '@/lib/canvas-rendering';
import { DraggableLabel } from './DraggableLabel';

/** Dot at vertex/arm points, constant screen size */
function Dot({ position, color, zoom }: {
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

interface AngleMeasurementProps {
  measurement: AngleMeasurementType;
  selected: boolean;
}

export function AngleMeasurementComponent({ measurement, selected }: AngleMeasurementProps) {
  const zoom = useThree((s) => (s.camera as THREE.OrthographicCamera).zoom || 1);
  const color = measurement.color ?? DEFAULT_COLORS.angle;

  const v = measurement.vertex;
  const a = measurement.armA;
  const b = measurement.armB;

  const vPos: [number, number, number] = [v.x, -v.y, 0.01];
  const aPos: [number, number, number] = [a.x, -a.y, 0.01];
  const bPos: [number, number, number] = [b.x, -b.y, 0.01];

  // Arc points in world space
  const { arcPoints, labelPos } = useMemo(() => {
    // Angles in world space (Y is flipped)
    const angleA = Math.atan2(-(a.y - v.y), a.x - v.x);
    const angleB = Math.atan2(-(b.y - v.y), b.x - v.x);

    const arcRadius = Math.min(30, Math.max(15, 20 * zoom)) / zoom;
    const segments = 32;

    // Determine shorter arc direction
    let startAngle = angleA;
    let endAngle = angleB;
    let diff = endAngle - startAngle;
    if (diff < 0) diff += Math.PI * 2;
    let counterClockwise = false;
    if (diff > Math.PI) {
      counterClockwise = true;
    }

    const pts: [number, number, number][] = [];
    const totalAngle = counterClockwise
      ? -(Math.PI * 2 - diff)
      : diff;

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const ang = startAngle + t * totalAngle;
      pts.push([
        v.x + arcRadius * Math.cos(ang),
        -v.y + arcRadius * Math.sin(ang),
        0.01,
      ]);
    }

    // Label position at the midpoint of the arc
    const midAngle = startAngle + totalAngle / 2;
    const labelDist = arcRadius + 18 / zoom;
    const lPos: [number, number, number] = [
      v.x + labelDist * Math.cos(midAngle),
      -v.y + labelDist * Math.sin(midAngle),
      0.02,
    ];

    return { arcPoints: pts, labelPos: lPos };
  }, [v, a, b, zoom]);

  return (
    <group>
      {/* Arms */}
      <Line
        points={[aPos, vPos]}
        color={color}
        lineWidth={selected ? 3 : 2}
        transparent
        opacity={selected ? 1 : 0.85}
      />
      <Line
        points={[vPos, bPos]}
        color={color}
        lineWidth={selected ? 3 : 2}
        transparent
        opacity={selected ? 1 : 0.85}
      />

      {/* Arc */}
      {arcPoints.length > 1 && (
        <Line
          points={arcPoints}
          color={color}
          lineWidth={1.5}
          transparent
          opacity={selected ? 1 : 0.85}
        />
      )}

      {/* Dots at vertex and arms */}
      <Dot position={vPos} color={color} zoom={zoom} />
      <Dot position={aPos} color={color} zoom={zoom} />
      <Dot position={bPos} color={color} zoom={zoom} />

      {/* Angle value label */}
      <DraggableLabel
        measurementId={measurement.id}
        position={labelPos}
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
          {measurement.angleDeg.toFixed(1)}&deg;
        </div>
      </DraggableLabel>

      {/* Name label */}
      {measurement.name && (
        <DraggableLabel
          measurementId={measurement.id}
          position={labelPos}
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
