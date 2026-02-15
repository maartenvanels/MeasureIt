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

interface ModelProps {
  url: string;
  onPointerDown: (e: ThreeEvent<PointerEvent>) => void;
  onPointerMove: (e: ThreeEvent<PointerEvent>) => void;
  onPointerLeave: () => void;
}

function STLModel({ url, onPointerDown, onPointerMove, onPointerLeave }: ModelProps) {
  const geometry = useLoader(STLLoader, url);
  const material = useMemo(() => new THREE.MeshStandardMaterial({ color: '#8899aa', roughness: 0.5, metalness: 0.3 }), []);

  return (
    <Center>
      <mesh
        geometry={geometry}
        material={material}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
      />
    </Center>
  );
}

function GLBModel({ url, onPointerDown, onPointerMove, onPointerLeave }: ModelProps) {
  const gltf = useLoader(GLTFLoader, url);
  const scene = useMemo(() => gltf.scene.clone(), [gltf]);

  return (
    <Center>
      <primitive
        object={scene}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
      />
    </Center>
  );
}

// ---- Measurement markers ----

function MeasurementPoint({ position, color, scale = 0.02 }: { position: Point3D; color: string; scale?: number }) {
  return (
    <mesh position={[position.x, position.y, position.z]}>
      <sphereGeometry args={[scale, 16, 16]} />
      <meshBasicMaterial color={color} />
    </mesh>
  );
}

// ---- Measurement line with label ----

function formatAxisDistances(start: Point3D, end: Point3D): string {
  const dx = Math.abs(end.x - start.x);
  const dy = Math.abs(end.y - start.y);
  const dz = Math.abs(end.z - start.z);
  return `\u0394x:${dx.toFixed(2)} \u0394y:${dy.toFixed(2)} \u0394z:${dz.toFixed(2)}`;
}

function MeasurementLine3D({ measurement, label, selected, markerSize, showAxis }: {
  measurement: Measurement3D;
  label: string;
  selected: boolean;
  markerSize: number;
  showAxis: boolean;
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
      <MeasurementPoint position={measurement.start} color={color} scale={markerSize} />
      <MeasurementPoint position={measurement.end} color={color} scale={markerSize} />
      <Html position={midpoint} center style={{ pointerEvents: 'none' }}>
        <div
          className="flex flex-col items-center rounded px-2 py-1 font-mono"
          style={{
            backgroundColor: 'rgba(0,0,0,0.85)',
            color: color,
            border: selected ? `2px solid ${color}` : '1px solid rgba(255,255,255,0.2)',
          }}
        >
          <div className="text-xs whitespace-nowrap">
            {measurement.name && <span className="text-white mr-1">{measurement.name}</span>}
            {label}
          </div>
          {showAxis && (
            <div className="text-[10px] opacity-70 whitespace-nowrap">
              {formatAxisDistances(measurement.start, measurement.end)}
            </div>
          )}
        </div>
      </Html>
    </group>
  );
}

// ---- In-progress drawing preview ----

function DrawPreview({ start, current, markerSize, dashSize, gapSize }: {
  start: Point3D; current: Point3D; markerSize: number; dashSize: number; gapSize: number;
}) {
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
        dashSize={dashSize}
        gapSize={gapSize}
      />
      <MeasurementPoint position={start} color="#ffffff" scale={markerSize} />
      <MeasurementPoint position={current} color="#ffffff" scale={markerSize} />
      <Html position={midpoint} center style={{ pointerEvents: 'none' }}>
        <div className="flex flex-col items-center rounded px-2 py-1 font-mono bg-black/80 text-white border border-white/20">
          <div className="text-xs whitespace-nowrap">{dist.toFixed(4)}</div>
          <div className="text-[10px] opacity-70 whitespace-nowrap">
            {formatAxisDistances(start, current)}
          </div>
        </div>
      </Html>
    </group>
  );
}

// ---- Auto-fit camera on model load ----

function CameraFitter({ children, onModelScale }: { children: React.ReactNode; onModelScale?: (scale: number) => void }) {
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
    onModelScale?.(maxDim);
    setFitted(true);
  }, [camera, fitted, onModelScale]);

  return <group ref={groupRef}>{children}</group>;
}

// ---- Hover indicator ----

function HoverIndicator({ point, scale = 0.03 }: { point: Point3D; scale?: number }) {
  return (
    <mesh position={[point.x, point.y, point.z]}>
      <sphereGeometry args={[scale, 16, 16]} />
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
  const showAxisDistances = useUIStore((s) => s.show3DAxisDistances);

  const measurements = useMeasurementStore((s) => s.measurements);
  const addMeasurement3D = useMeasurementStore((s) => s.addMeasurement3D);
  const getMeasure3DCount = useMeasurementStore((s) => s.getMeasure3DCount);
  const referenceValue = useMeasurementStore((s) => s.referenceValue);
  const referenceUnit = useMeasurementStore((s) => s.referenceUnit);
  const getReference3D = useMeasurementStore((s) => s.getReference3D);

  const [hoverPoint, setHoverPoint] = useState<Point3D | null>(null);
  const [modelScale, setModelScale] = useState(1);
  const orbitRef = useRef<any>(null);

  const isMeasuring = mode === 'reference3d' || mode === 'measure3d';

  // Sphere size relative to model (about 0.5% of max dimension)
  const markerSize = modelScale * 0.005;
  const hoverSize = markerSize * 1.5;
  const dashSize = modelScale * 0.02;
  const gapSize = modelScale * 0.012;

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
        // Second click: update end point, then finish
        useCanvasStore.getState().updateDrawing3D(point);
        // Read fresh state after update
        const { draw3DStart, draw3DCurrent } = useCanvasStore.getState();
        if (draw3DStart && draw3DCurrent) {
          const dx = draw3DCurrent.x - draw3DStart.x;
          const dy = draw3DCurrent.y - draw3DStart.y;
          const dz = draw3DCurrent.z - draw3DStart.z;
          const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
          if (distance >= 0.0001) {
            const type = mode as 'reference3d' | 'measure3d';
            const name = type === 'reference3d'
              ? 'Reference 3D'
              : `3D Measurement ${getMeasure3DCount() + 1}`;
            const m: Measurement3D = {
              id: crypto.randomUUID(),
              type,
              start: draw3DStart,
              end: draw3DCurrent,
              distance,
              name,
              createdAt: Date.now(),
            };
            addMeasurement3D(m);
          }
        }
        useCanvasStore.getState().cancelDrawing3D();
      }
    },
    [isMeasuring, isDrawing3D, mode, startDrawing3D, addMeasurement3D]
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
        <CameraFitter onModelScale={setModelScale}>
          {modelFileType === 'stl' ? (
            <STLModel
              url={modelUrl}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerLeave={handlePointerLeave}
            />
          ) : (
            <GLBModel
              url={modelUrl}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerLeave={handlePointerLeave}
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
      {hoverPoint && isMeasuring && <HoverIndicator point={hoverPoint} scale={hoverSize} />}

      {/* In-progress drawing */}
      {isDrawing3D && draw3DStart && draw3DCurrent && (
        <DrawPreview start={draw3DStart} current={draw3DCurrent} markerSize={markerSize} dashSize={dashSize} gapSize={gapSize} />
      )}

      {/* Existing measurements */}
      {measurements3D.map((m) => (
        <MeasurementLine3D
          key={m.id}
          measurement={m}
          label={getLabel(m)}
          selected={m.id === selectedId}
          markerSize={markerSize}
          showAxis={showAxisDistances}
        />
      ))}
    </>
  );
}

// ---- Main exported component ----

function AxisDistanceToggle() {
  const show = useUIStore((s) => s.show3DAxisDistances);
  const toggle = useUIStore((s) => s.toggleShow3DAxisDistances);

  return (
    <button
      onClick={toggle}
      className={`absolute bottom-3 left-3 z-10 flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-mono transition-colors ${
        show
          ? 'bg-cyan-900/60 text-cyan-300 border border-cyan-700/50'
          : 'bg-zinc-800/80 text-zinc-500 border border-zinc-700/50 hover:text-zinc-300'
      }`}
      title="Toggle axis distances (Δx, Δy, Δz)"
    >
      Δxyz
    </button>
  );
}

export default function ModelViewer() {
  return (
    <div className="relative w-full h-full">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        style={{ background: '#1a1a2e' }}
        onPointerMissed={() => {
          const { isDrawing3D } = useCanvasStore.getState();
          if (isDrawing3D) {
            useCanvasStore.getState().cancelDrawing3D();
          }
        }}
      >
        <SceneContent />
      </Canvas>
      <AxisDistanceToggle />
    </div>
  );
}
