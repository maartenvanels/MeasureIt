'use client';

import { useRef, useMemo, useCallback, useState, useEffect } from 'react';
import { Canvas, useThree, useLoader, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Html, Line, Bvh, Center } from '@react-three/drei';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as THREE from 'three';
import { useCanvasStore } from '@/stores/useCanvasStore';
import { useUIStore } from '@/stores/useUIStore';
import { useMeasurementStore } from '@/stores/useMeasurementStore';
import { Point3D, Measurement3D } from '@/types/measurement';
import { DEFAULT_COLORS } from '@/lib/canvas-rendering';
import { calcReal3DDistance } from '@/lib/calculations';

// ---- Model mesh components ----

function STLModel({ url, onPointerDown }: { url: string; onPointerDown: (e: ThreeEvent<PointerEvent>) => void }) {
  const geometry = useLoader(STLLoader, url);
  const material = useMemo(() => new THREE.MeshStandardMaterial({ color: '#8899aa', roughness: 0.5, metalness: 0.3 }), []);

  return (
    <Center>
      <mesh
        geometry={geometry}
        material={material}
        onPointerDown={onPointerDown}
      />
    </Center>
  );
}

function GLBModel({ url, onPointerDown }: { url: string; onPointerDown: (e: ThreeEvent<PointerEvent>) => void }) {
  const gltf = useLoader(GLTFLoader, url);
  const scene = useMemo(() => gltf.scene.clone(), [gltf]);

  return (
    <Center>
      <primitive object={scene} onPointerDown={onPointerDown} />
    </Center>
  );
}

// ---- Measurement markers ----

function MeasurementPoint({ position, color }: { position: Point3D; color: string }) {
  return (
    <mesh position={[position.x, position.y, position.z]}>
      <sphereGeometry args={[0.02, 16, 16]} />
      <meshBasicMaterial color={color} />
    </mesh>
  );
}

// ---- Measurement line with label ----

function MeasurementLine3D({ measurement, label, selected }: {
  measurement: Measurement3D;
  label: string;
  selected: boolean;
}) {
  const color = measurement.color ?? DEFAULT_COLORS[measurement.type] ?? '#06b6d4';
  const midpoint: [number, number, number] = [
    (measurement.start.x + measurement.end.x) / 2,
    (measurement.start.y + measurement.end.y) / 2,
    (measurement.start.z + measurement.end.z) / 2,
  ];

  return (
    <group>
      <Line
        points={[
          [measurement.start.x, measurement.start.y, measurement.start.z],
          [measurement.end.x, measurement.end.y, measurement.end.z],
        ]}
        color={color}
        lineWidth={selected ? 3 : 2}
      />
      <MeasurementPoint position={measurement.start} color={color} />
      <MeasurementPoint position={measurement.end} color={color} />
      <Html position={midpoint} center style={{ pointerEvents: 'none' }}>
        <div
          className="px-2 py-0.5 rounded text-xs font-mono whitespace-nowrap"
          style={{
            backgroundColor: 'rgba(0,0,0,0.8)',
            color: color,
            border: selected ? `2px solid ${color}` : '1px solid rgba(255,255,255,0.2)',
          }}
        >
          {measurement.name && <span className="text-white mr-1">{measurement.name}</span>}
          {label}
        </div>
      </Html>
    </group>
  );
}

// ---- In-progress drawing preview ----

function DrawPreview({ start, current }: { start: Point3D; current: Point3D }) {
  const midpoint: [number, number, number] = [
    (start.x + current.x) / 2,
    (start.y + current.y) / 2,
    (start.z + current.z) / 2,
  ];
  const dx = current.x - start.x;
  const dy = current.y - start.y;
  const dz = current.z - start.z;
  const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

  return (
    <group>
      <Line
        points={[
          [start.x, start.y, start.z],
          [current.x, current.y, current.z],
        ]}
        color="#ffffff"
        lineWidth={1.5}
        dashed
        dashSize={0.05}
        gapSize={0.03}
      />
      <MeasurementPoint position={start} color="#ffffff" />
      <MeasurementPoint position={current} color="#ffffff" />
      <Html position={midpoint} center style={{ pointerEvents: 'none' }}>
        <div className="px-2 py-0.5 rounded text-xs font-mono whitespace-nowrap bg-black/80 text-white border border-white/20">
          {dist.toFixed(2)}
        </div>
      </Html>
    </group>
  );
}

// ---- Auto-fit camera on model load ----

function CameraFitter({ children }: { children: React.ReactNode }) {
  const groupRef = useRef<THREE.Group>(null);
  const { camera } = useThree();
  const [fitted, setFitted] = useState(false);

  useEffect(() => {
    if (!groupRef.current || fitted) return;
    const box = new THREE.Box3().setFromObject(groupRef.current);
    if (box.isEmpty()) return;

    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const distance = maxDim * 2;

    camera.position.set(center.x + distance * 0.5, center.y + distance * 0.3, center.z + distance * 0.5);
    camera.lookAt(center);
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.near = maxDim * 0.001;
      camera.far = maxDim * 100;
      camera.updateProjectionMatrix();
    }
    setFitted(true);
  }, [camera, fitted]);

  return <group ref={groupRef}>{children}</group>;
}

// ---- Hover indicator ----

function HoverIndicator({ point }: { point: Point3D }) {
  return (
    <mesh position={[point.x, point.y, point.z]}>
      <sphereGeometry args={[0.03, 16, 16]} />
      <meshBasicMaterial color="#00ffff" transparent opacity={0.8} />
    </mesh>
  );
}

// ---- Main scene content ----

function SceneContent() {
  const modelUrl = useCanvasStore((s) => s.modelUrl);
  const modelFileType = useCanvasStore((s) => s.modelFileType);
  const draw3DStart = useCanvasStore((s) => s.draw3DStart);
  const draw3DCurrent = useCanvasStore((s) => s.draw3DCurrent);
  const isDrawing3D = useCanvasStore((s) => s.isDrawing3D);
  const startDrawing3D = useCanvasStore((s) => s.startDrawing3D);
  const finishDrawing3D = useCanvasStore((s) => s.finishDrawing3D);

  const mode = useUIStore((s) => s.mode);
  const selectedId = useUIStore((s) => s.selectedMeasurementId);
  const selectMeasurement = useUIStore((s) => s.selectMeasurement);

  const measurements = useMeasurementStore((s) => s.measurements);
  const addMeasurement3D = useMeasurementStore((s) => s.addMeasurement3D);
  const referenceValue = useMeasurementStore((s) => s.referenceValue);
  const referenceUnit = useMeasurementStore((s) => s.referenceUnit);
  const getReference3D = useMeasurementStore((s) => s.getReference3D);

  const [hoverPoint, setHoverPoint] = useState<Point3D | null>(null);
  const orbitRef = useRef<any>(null);

  const isMeasuring = mode === 'reference3d' || mode === 'measure3d';

  // Filter 3D measurements
  const measurements3D = useMemo(
    () => measurements.filter((m): m is Measurement3D => m.type === 'reference3d' || m.type === 'measure3d'),
    [measurements]
  );

  const handlePointerDown = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      if (!isMeasuring) return;
      e.stopPropagation();

      const point: Point3D = { x: e.point.x, y: e.point.y, z: e.point.z };

      if (!isDrawing3D) {
        // First click: start
        startDrawing3D(point);
      } else {
        // Second click: finish
        const result = finishDrawing3D();
        if (result) {
          const m: Measurement3D = {
            id: crypto.randomUUID(),
            type: mode as 'reference3d' | 'measure3d',
            start: result.start,
            end: result.end,
            distance: result.distance,
            name: '',
            createdAt: Date.now(),
          };
          addMeasurement3D(m);
        }
      }
    },
    [isMeasuring, isDrawing3D, mode, startDrawing3D, finishDrawing3D, addMeasurement3D]
  );

  const handlePointerMove = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      if (!isMeasuring) {
        setHoverPoint(null);
        return;
      }
      const point: Point3D = { x: e.point.x, y: e.point.y, z: e.point.z };
      setHoverPoint(point);

      if (isDrawing3D) {
        useCanvasStore.getState().updateDrawing3D(point);
      }
    },
    [isMeasuring, isDrawing3D]
  );

  const handlePointerLeave = useCallback(() => {
    setHoverPoint(null);
  }, []);

  const handleCanvasClick = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      // Clicked on empty space (not on model)
      if (!isMeasuring) {
        selectMeasurement(null);
      }
    },
    [isMeasuring, selectMeasurement]
  );

  const getLabel = useCallback(
    (m: Measurement3D) => {
      const ref3d = getReference3D();
      if (ref3d && referenceValue > 0) {
        return calcReal3DDistance(m.distance, ref3d, referenceValue, referenceUnit, m.unitOverride);
      }
      return m.distance.toFixed(2);
    },
    [getReference3D, referenceValue, referenceUnit]
  );

  if (!modelUrl || !modelFileType) return null;

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 10, 5]} intensity={0.8} />
      <directionalLight position={[-5, -5, -5]} intensity={0.3} />

      <OrbitControls
        ref={orbitRef}
        enabled={!isMeasuring}
        enableDamping
        dampingFactor={0.1}
      />

      <Bvh firstHitOnly>
        <CameraFitter>
          {modelFileType === 'stl' ? (
            <STLModel
              url={modelUrl}
              onPointerDown={handlePointerDown}
            />
          ) : (
            <GLBModel
              url={modelUrl}
              onPointerDown={handlePointerDown}
            />
          )}
        </CameraFitter>
      </Bvh>

      {/* Pointer move handler on a background plane — use the mesh itself via events */}
      <mesh
        visible={false}
        onPointerDown={handleCanvasClick}
      >
        <sphereGeometry args={[1000]} />
      </mesh>

      {/* Hover indicator */}
      {hoverPoint && isMeasuring && <HoverIndicator point={hoverPoint} />}

      {/* In-progress drawing */}
      {isDrawing3D && draw3DStart && draw3DCurrent && (
        <DrawPreview start={draw3DStart} current={draw3DCurrent} />
      )}

      {/* Existing measurements */}
      {measurements3D.map((m) => (
        <MeasurementLine3D
          key={m.id}
          measurement={m}
          label={getLabel(m)}
          selected={m.id === selectedId}
        />
      ))}
    </>
  );
}

// ---- Main exported component ----

export default function ModelViewer() {
  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        style={{ background: '#1a1a2e' }}
        onPointerMissed={() => {
          // Cancel drawing if clicking outside model
          const { isDrawing3D } = useCanvasStore.getState();
          if (isDrawing3D) {
            useCanvasStore.getState().cancelDrawing3D();
          }
        }}
      >
        <SceneContent />
      </Canvas>
    </div>
  );
}
