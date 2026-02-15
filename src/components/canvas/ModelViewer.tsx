'use client';

import { useRef, useMemo, useCallback, useState, useEffect } from 'react';
import { Canvas, useThree, useLoader, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Html, Line, Bvh, Center, GizmoHelper, GizmoViewcube } from '@react-three/drei';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as THREE from 'three';
import { useCanvasStore } from '@/stores/useCanvasStore';
import { useUIStore } from '@/stores/useUIStore';
import { useMeasurementStore } from '@/stores/useMeasurementStore';
import { Point, Point3D, Measurement3D } from '@/types/measurement';
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

// ---- Origin axes ----

function OriginAxes({ size }: { size: number }) {
  return (
    <group>
      <Line points={[[0, 0, 0], [size, 0, 0]]} color="#ef4444" lineWidth={2} />
      <Line points={[[0, 0, 0], [0, size, 0]]} color="#22c55e" lineWidth={2} />
      <Line points={[[0, 0, 0], [0, 0, size]]} color="#3b82f6" lineWidth={2} />
      <Html position={[size * 1.12, 0, 0]} center style={{ pointerEvents: 'none' }}>
        <span className="text-[10px] font-bold text-red-400">X</span>
      </Html>
      <Html position={[0, size * 1.12, 0]} center style={{ pointerEvents: 'none' }}>
        <span className="text-[10px] font-bold text-green-400">Y</span>
      </Html>
      <Html position={[0, 0, size * 1.12]} center style={{ pointerEvents: 'none' }}>
        <span className="text-[10px] font-bold text-blue-400">Z</span>
      </Html>
    </group>
  );
}

// ---- Cartesian decomposition lines ----

function CartesianLines({ start, end, dashSize, gapSize }: {
  start: Point3D; end: Point3D; dashSize: number; gapSize: number;
}) {
  const dx = Math.abs(end.x - start.x);
  const dy = Math.abs(end.y - start.y);
  const dz = Math.abs(end.z - start.z);

  const p0: [number, number, number] = [start.x, start.y, start.z];
  const p1: [number, number, number] = [end.x, start.y, start.z];
  const p2: [number, number, number] = [end.x, end.y, start.z];
  const p3: [number, number, number] = [end.x, end.y, end.z];

  const midX: [number, number, number] = [(start.x + end.x) / 2, start.y, start.z];
  const midY: [number, number, number] = [end.x, (start.y + end.y) / 2, start.z];
  const midZ: [number, number, number] = [end.x, end.y, (start.z + end.z) / 2];

  return (
    <group>
      {dx > 0.0001 && (
        <>
          <Line points={[p0, p1]} color="#ef4444" lineWidth={1} dashed dashSize={dashSize} gapSize={gapSize} />
          <Html position={midX} center style={{ pointerEvents: 'none' }}>
            <span className="text-[9px] text-red-400 font-mono bg-black/70 px-1 rounded">{dx.toFixed(2)}</span>
          </Html>
        </>
      )}
      {dy > 0.0001 && (
        <>
          <Line points={[p1, p2]} color="#22c55e" lineWidth={1} dashed dashSize={dashSize} gapSize={gapSize} />
          <Html position={midY} center style={{ pointerEvents: 'none' }}>
            <span className="text-[9px] text-green-400 font-mono bg-black/70 px-1 rounded">{dy.toFixed(2)}</span>
          </Html>
        </>
      )}
      {dz > 0.0001 && (
        <>
          <Line points={[p2, p3]} color="#3b82f6" lineWidth={1} dashed dashSize={dashSize} gapSize={gapSize} />
          <Html position={midZ} center style={{ pointerEvents: 'none' }}>
            <span className="text-[9px] text-blue-400 font-mono bg-black/70 px-1 rounded">{dz.toFixed(2)}</span>
          </Html>
        </>
      )}
    </group>
  );
}

// ---- Draggable 3D label ----

function DraggableLabel({ measurementId, position, offset, labelType, children, style }: {
  measurementId: string;
  position: [number, number, number];
  offset?: Point;
  labelType: 'value' | 'name';
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  const dragRef = useRef<{ startX: number; startY: number; origOffset: Point } | null>(null);
  const updateMeasurement = useMeasurementStore((s) => s.updateMeasurement);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origOffset: offset ?? { x: 0, y: 0 },
    };
  }, [offset]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    const newOffset = { x: dragRef.current.origOffset.x + dx, y: dragRef.current.origOffset.y + dy };
    const field = labelType === 'value' ? 'labelOffset' : 'nameLabelOffset';
    updateMeasurement(measurementId, { [field]: newOffset });
  }, [measurementId, labelType, updateMeasurement]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    dragRef.current = null;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  }, []);

  const ox = offset?.x ?? 0;
  const oy = offset?.y ?? 0;

  return (
    <Html position={position} center style={{ pointerEvents: 'auto' }}>
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{
          transform: `translate(${ox}px, ${oy}px)`,
          cursor: 'grab',
          userSelect: 'none',
          ...style,
        }}
      >
        {children}
      </div>
    </Html>
  );
}

// ---- Measurement line with separate labels ----

function MeasurementLine3D({ measurement, label, selected, markerSize, showAxis, dashSize, gapSize }: {
  measurement: Measurement3D;
  label: string;
  selected: boolean;
  markerSize: number;
  showAxis: boolean;
  dashSize: number;
  gapSize: number;
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

      {/* Value label (draggable) */}
      <DraggableLabel
        measurementId={measurement.id}
        position={midpoint}
        offset={measurement.labelOffset}
        labelType="value"
      >
        <div
          className="rounded px-2 py-0.5 text-xs font-mono whitespace-nowrap"
          style={{
            backgroundColor: 'rgba(0,0,0,0.85)',
            color: color,
            border: selected ? `2px solid ${color}` : '1px solid rgba(255,255,255,0.2)',
          }}
        >
          {label}
        </div>
      </DraggableLabel>

      {/* Name label (draggable, separate) */}
      {measurement.name && (
        <DraggableLabel
          measurementId={measurement.id}
          position={midpoint}
          offset={measurement.nameLabelOffset ?? { x: 0, y: 24 }}
          labelType="name"
        >
          <div
            className="rounded px-1.5 py-0.5 text-[11px] font-mono whitespace-nowrap"
            style={{
              backgroundColor: 'rgba(0,0,0,0.7)',
              color: '#a1a1aa',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            {measurement.name}
          </div>
        </DraggableLabel>
      )}

      {/* Cartesian decomposition */}
      {showAxis && (
        <CartesianLines start={measurement.start} end={measurement.end} dashSize={dashSize} gapSize={gapSize} />
      )}
    </group>
  );
}

// ---- In-progress drawing preview ----

function DrawPreview({ start, current, markerSize, dashSize, gapSize, showAxis }: {
  start: Point3D; current: Point3D; markerSize: number; dashSize: number; gapSize: number; showAxis: boolean;
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
        <div className="rounded px-2 py-0.5 text-xs font-mono whitespace-nowrap bg-black/80 text-white border border-white/20">
          {dist.toFixed(4)}
        </div>
      </Html>
      {showAxis && <CartesianLines start={start} end={current} dashSize={dashSize} gapSize={gapSize} />}
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

function HoverIndicator({ point, scale = 0.03, snapped = false }: { point: Point3D; scale?: number; snapped?: boolean }) {
  return (
    <mesh position={[point.x, point.y, point.z]}>
      <sphereGeometry args={[scale, 16, 16]} />
      <meshBasicMaterial color={snapped ? '#facc15' : '#00ffff'} transparent opacity={0.8} />
    </mesh>
  );
}

// ---- Snap helper ----

function findSnap3D(
  mouseNDC: { x: number; y: number },
  measurements3D: Measurement3D[],
  camera: THREE.Camera,
  gl: THREE.WebGLRenderer,
  threshold = 16
): Point3D | null {
  const endpoints: Point3D[] = [];
  for (const m of measurements3D) {
    endpoints.push(m.start, m.end);
  }
  if (endpoints.length === 0) return null;

  const canvasRect = gl.domElement.getBoundingClientRect();
  const mouseScreenX = ((mouseNDC.x + 1) / 2) * canvasRect.width;
  const mouseScreenY = ((1 - mouseNDC.y) / 2) * canvasRect.height;

  let nearest: Point3D | null = null;
  let nearestDist = Infinity;

  const v = new THREE.Vector3();
  for (const ep of endpoints) {
    v.set(ep.x, ep.y, ep.z);
    v.project(camera);
    const sx = ((v.x + 1) / 2) * canvasRect.width;
    const sy = ((1 - v.y) / 2) * canvasRect.height;
    const d = Math.sqrt((sx - mouseScreenX) ** 2 + (sy - mouseScreenY) ** 2);
    if (d < threshold && d < nearestDist) {
      nearestDist = d;
      nearest = ep;
    }
  }
  return nearest;
}

// ---- Main scene content ----

function SceneContent() {
  const modelUrl = useCanvasStore((s) => s.modelUrl);
  const modelFileType = useCanvasStore((s) => s.modelFileType);
  const draw3DStart = useCanvasStore((s) => s.draw3DStart);
  const draw3DCurrent = useCanvasStore((s) => s.draw3DCurrent);
  const isDrawing3D = useCanvasStore((s) => s.isDrawing3D);
  const startDrawing3D = useCanvasStore((s) => s.startDrawing3D);

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
  const [isSnapped, setIsSnapped] = useState(false);
  const [modelScale, setModelScale] = useState(1);
  const orbitRef = useRef<any>(null);
  const { camera, gl } = useThree();

  const isMeasuring = mode === 'reference3d' || mode === 'measure3d';

  // Sphere size relative to model (about 0.5% of max dimension)
  const markerSize = modelScale * 0.005;
  const hoverSize = markerSize * 1.5;
  const dashSize = modelScale * 0.02;
  const gapSize = modelScale * 0.012;
  const axisSize = modelScale * 0.15;

  // Filter 3D measurements
  const measurements3D = useMemo(
    () => measurements.filter((m): m is Measurement3D => m.type === 'reference3d' || m.type === 'measure3d'),
    [measurements]
  );

  // Try to snap a 3D point to an existing endpoint
  const trySnap = useCallback(
    (surfacePoint: Point3D, e: ThreeEvent<PointerEvent>): Point3D => {
      const canvasRect = gl.domElement.getBoundingClientRect();
      const mouseNDC = {
        x: ((e.clientX - canvasRect.left) / canvasRect.width) * 2 - 1,
        y: -((e.clientY - canvasRect.top) / canvasRect.height) * 2 + 1,
      };
      const snapped = findSnap3D(mouseNDC, measurements3D, camera, gl);
      if (snapped) {
        setIsSnapped(true);
        return snapped;
      }
      setIsSnapped(false);
      return surfacePoint;
    },
    [measurements3D, camera, gl]
  );

  const handlePointerDown = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      if (!isMeasuring) return;
      e.stopPropagation();

      const surfacePoint: Point3D = { x: e.point.x, y: e.point.y, z: e.point.z };
      const point = trySnap(surfacePoint, e);

      if (!isDrawing3D) {
        startDrawing3D(point);
      } else {
        useCanvasStore.getState().updateDrawing3D(point);
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
    [isMeasuring, isDrawing3D, mode, startDrawing3D, addMeasurement3D, getMeasure3DCount, trySnap]
  );

  const handlePointerMove = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      if (!isMeasuring) {
        setHoverPoint(null);
        setIsSnapped(false);
        return;
      }
      const surfacePoint: Point3D = { x: e.point.x, y: e.point.y, z: e.point.z };
      const point = trySnap(surfacePoint, e);
      setHoverPoint(point);

      if (isDrawing3D) {
        useCanvasStore.getState().updateDrawing3D(point);
      }
    },
    [isMeasuring, isDrawing3D, trySnap]
  );

  const handlePointerLeave = useCallback(() => {
    setHoverPoint(null);
    setIsSnapped(false);
  }, []);

  const handleCanvasClick = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      if (!isMeasuring) {
        selectMeasurement(null);
      }
    },
    [isMeasuring, selectMeasurement]
  );

  const getLabel = useCallback(
    (m: Measurement3D) => {
      if (m.type === 'reference3d') {
        return referenceValue > 0 ? `${referenceValue} ${referenceUnit} (ref)` : m.distance.toFixed(4);
      }
      const ref3d = getReference3D();
      if (ref3d && referenceValue > 0) {
        return calcReal3DDistance(m.distance, ref3d, referenceValue, referenceUnit, m.unitOverride);
      }
      return m.distance.toFixed(4);
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
        makeDefault
        enabled={!isMeasuring}
        enableDamping
        dampingFactor={0.1}
      />

      <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
        <GizmoViewcube />
      </GizmoHelper>

      <OriginAxes size={axisSize} />

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

      <mesh visible={false} onPointerDown={handleCanvasClick}>
        <sphereGeometry args={[1000]} />
      </mesh>

      {/* Hover indicator */}
      {hoverPoint && isMeasuring && <HoverIndicator point={hoverPoint} scale={hoverSize} snapped={isSnapped} />}

      {/* In-progress drawing */}
      {isDrawing3D && draw3DStart && draw3DCurrent && (
        <DrawPreview
          start={draw3DStart}
          current={draw3DCurrent}
          markerSize={markerSize}
          dashSize={dashSize}
          gapSize={gapSize}
          showAxis={showAxisDistances}
        />
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
          dashSize={dashSize}
          gapSize={gapSize}
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
      title="Toggle cartesian decomposition (Δx, Δy, Δz)"
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
