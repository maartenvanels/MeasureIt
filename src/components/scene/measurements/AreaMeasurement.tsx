'use client';

import { useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import * as THREE from 'three';
import { AreaMeasurement as AreaMeasurementType, Point } from '@/types/measurement';
import { DEFAULT_COLORS } from '@/lib/canvas-rendering';
import { DraggableLabel } from './DraggableLabel';

/** Small dot at vertices, constant screen size */
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

/** Filled polygon shape at z=0.005 */
function PolygonFill({ points, color, selected }: {
  points: Point[];
  color: string;
  selected: boolean;
}) {
  const geometry = useMemo(() => {
    if (points.length < 3) return null;
    const shape = new THREE.Shape();
    shape.moveTo(points[0].x, -points[0].y);
    for (let i = 1; i < points.length; i++) {
      shape.lineTo(points[i].x, -points[i].y);
    }
    shape.closePath();
    return new THREE.ShapeGeometry(shape);
  }, [points]);

  if (!geometry) return null;

  return (
    <mesh geometry={geometry} position={[0, 0, 0.005]}>
      <meshBasicMaterial
        color={color}
        transparent
        opacity={selected ? 0.15 : 0.08}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}

/** Filled circle shape */
function CircleFill({ center, radius, color, selected }: {
  center: Point;
  radius: number;
  color: string;
  selected: boolean;
}) {
  const geometry = useMemo(() => {
    const shape = new THREE.Shape();
    shape.absarc(center.x, -center.y, radius, 0, Math.PI * 2, false);
    return new THREE.ShapeGeometry(shape, 64);
  }, [center, radius]);

  return (
    <mesh geometry={geometry} position={[0, 0, 0.005]}>
      <meshBasicMaterial
        color={color}
        transparent
        opacity={selected ? 0.15 : 0.08}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}

/** Circle outline */
function CircleOutline({ center, radius, color, selected }: {
  center: Point;
  radius: number;
  color: string;
  selected: boolean;
}) {
  const points = useMemo(() => {
    const pts: [number, number, number][] = [];
    const segments = 64;
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      pts.push([
        center.x + radius * Math.cos(angle),
        -center.y + radius * Math.sin(angle),
        0.01,
      ]);
    }
    return pts;
  }, [center, radius]);

  return (
    <Line
      points={points}
      color={color}
      lineWidth={selected ? 3 : 2}
      transparent
      opacity={selected ? 1 : 0.85}
    />
  );
}

interface AreaMeasurementProps {
  measurement: AreaMeasurementType;
  label: string;
  selected: boolean;
}

export function AreaMeasurementComponent({ measurement, label, selected }: AreaMeasurementProps) {
  const zoom = useThree((s) => (s.camera as THREE.OrthographicCamera).zoom || 1);
  const color = measurement.color ?? DEFAULT_COLORS.area;
  const isCircle = measurement.areaKind === 'circle-3pt' || measurement.areaKind === 'circle-center';

  // Polygon/freehand outline points
  const outlinePoints = useMemo(() => {
    if (isCircle) return [];
    const pts: [number, number, number][] = measurement.points.map(
      (p) => [p.x, -p.y, 0.01] as [number, number, number]
    );
    // Close the polygon
    if (pts.length > 0) pts.push(pts[0]);
    return pts;
  }, [measurement.points, isCircle]);

  // Centroid/center for label positioning
  const labelPos: [number, number, number] = useMemo(() => {
    if (isCircle && measurement.center) {
      return [measurement.center.x, -measurement.center.y, 0.02];
    }
    const pts = measurement.points;
    const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length;
    const cy = pts.reduce((s, p) => s + p.y, 0) / pts.length;
    return [cx, -cy, 0.02];
  }, [measurement.points, measurement.center, isCircle]);

  return (
    <group>
      {/* Fill */}
      {isCircle && measurement.center && measurement.radius ? (
        <>
          <CircleFill center={measurement.center} radius={measurement.radius} color={color} selected={selected} />
          <CircleOutline center={measurement.center} radius={measurement.radius} color={color} selected={selected} />
          {/* Center dot */}
          <Dot position={[measurement.center.x, -measurement.center.y, 0.015]} color={color} zoom={zoom} />
        </>
      ) : (
        <>
          <PolygonFill points={measurement.points} color={color} selected={selected} />
          {outlinePoints.length > 1 && (
            <Line
              points={outlinePoints}
              color={color}
              lineWidth={selected ? 3 : 2}
              transparent
              opacity={selected ? 1 : 0.85}
            />
          )}
        </>
      )}

      {/* Vertex dots */}
      {measurement.points.map((p, i) => (
        <Dot key={i} position={[p.x, -p.y, 0.015]} color={color} zoom={zoom} />
      ))}

      {/* Value label */}
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
          {label}
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
