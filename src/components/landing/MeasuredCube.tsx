'use client';
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, RoundedBox, Edges, Line, Text, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';

// Engineering-style dimension annotation line
function DimensionLine({
  start,
  end,
  label,
  color,
}: {
  start: [number, number, number];
  end: [number, number, number];
  label: string;
  color: string;
}) {
  const capSize = 0.12;

  // Direction vector and perpendicular for end-caps
  const dir = new THREE.Vector3(...end).sub(new THREE.Vector3(...start)).normalize();
  // Find a perpendicular direction (for end-caps)
  const up = new THREE.Vector3(0, 1, 0);
  let perp = new THREE.Vector3().crossVectors(dir, up).normalize();
  if (perp.length() < 0.01) {
    perp = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(1, 0, 0)).normalize();
  }

  const capDir: [number, number, number] = [perp.x * capSize, perp.y * capSize, perp.z * capSize];

  const startCap1: [number, number, number] = [start[0] + capDir[0], start[1] + capDir[1], start[2] + capDir[2]];
  const startCap2: [number, number, number] = [start[0] - capDir[0], start[1] - capDir[1], start[2] - capDir[2]];
  const endCap1: [number, number, number] = [end[0] + capDir[0], end[1] + capDir[1], end[2] + capDir[2]];
  const endCap2: [number, number, number] = [end[0] - capDir[0], end[1] - capDir[1], end[2] - capDir[2]];

  const midpoint: [number, number, number] = [
    (start[0] + end[0]) / 2,
    (start[1] + end[1]) / 2,
    (start[2] + end[2]) / 2,
  ];

  // Offset label slightly perpendicular to the line
  const labelOffset: [number, number, number] = [
    midpoint[0] + perp.x * 0.2,
    midpoint[1] + perp.y * 0.2,
    midpoint[2] + perp.z * 0.2,
  ];

  return (
    <group>
      {/* Main dimension line */}
      <Line points={[start, end]} color={color} lineWidth={1.5} />
      {/* Start end-cap */}
      <Line points={[startCap1, startCap2]} color={color} lineWidth={1.5} />
      {/* End end-cap */}
      <Line points={[endCap1, endCap2]} color={color} lineWidth={1.5} />
      {/* Label */}
      <Text
        position={labelOffset}
        fontSize={0.16}
        color={color}
        anchorX="center"
        anchorY="middle"
        font={undefined}
      >
        {label}
      </Text>
    </group>
  );
}

export default function MeasuredCube() {
  const groupRef = useRef<THREE.Group>(null);

  // Cube dimensions
  const w = 2;
  const h = 1.4;
  const d = 1.2;

  // Animate: gentle auto-rotation + mouse parallax
  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    groupRef.current.rotation.y = THREE.MathUtils.lerp(
      groupRef.current.rotation.y,
      state.pointer.x * 0.2 + t * 0.08,
      0.05
    );
    groupRef.current.rotation.x = THREE.MathUtils.lerp(
      groupRef.current.rotation.x,
      state.pointer.y * 0.12 + Math.sin(t * 0.5) * 0.05,
      0.05
    );
  });

  // Dimension line positions (offset from cube edges)
  const offset = 0.35;

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 5, 5]} intensity={0.6} />
      <directionalLight position={[-3, 2, -5]} intensity={0.3} color="#fda4af" />

      <Float speed={1.5} rotationIntensity={0} floatIntensity={0.4}>
        <group ref={groupRef}>
          {/* The cube */}
          <RoundedBox args={[w, h, d]} radius={0.08} smoothness={4}>
            <meshStandardMaterial
              color="#e11d48"
              transparent
              opacity={0.06}
              roughness={0.3}
              metalness={0.8}
            />
            <Edges color="#e11d48" threshold={15} />
          </RoundedBox>

          {/* Width dimension (X-axis) — rose/reference color */}
          <DimensionLine
            start={[-w / 2, -h / 2 - offset, d / 2]}
            end={[w / 2, -h / 2 - offset, d / 2]}
            label="24.5 cm"
            color="#e11d48"
          />

          {/* Height dimension (Y-axis) — cyan/measure color */}
          <DimensionLine
            start={[w / 2 + offset, -h / 2, d / 2]}
            end={[w / 2 + offset, h / 2, d / 2]}
            label="18.0 cm"
            color="#06b6d4"
          />

          {/* Depth dimension (Z-axis) — cyan/measure color */}
          <DimensionLine
            start={[w / 2 + offset, -h / 2 - offset, -d / 2]}
            end={[w / 2 + offset, -h / 2 - offset, d / 2]}
            label="12.0 cm"
            color="#06b6d4"
          />
        </group>
      </Float>

      <ContactShadows
        position={[0, -1.5, 0]}
        opacity={0.3}
        scale={8}
        blur={2}
        far={4}
        color="#e11d48"
      />
    </>
  );
}
