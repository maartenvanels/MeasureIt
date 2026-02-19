'use client';

import { useMemo, useRef, useState } from 'react';
import { useLoader, useThree, useFrame, ThreeEvent } from '@react-three/fiber';
import { Center } from '@react-three/drei';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as THREE from 'three';

export interface ModelMeshProps {
  url: string;
  fileType: 'glb' | 'stl';
  onPointerDown?: (e: ThreeEvent<PointerEvent>) => void;
  onPointerMove?: (e: ThreeEvent<PointerEvent>) => void;
  onPointerLeave?: () => void;
  /** Called once after first render with the bounding-box max dimension */
  onModelScale?: (scale: number) => void;
}

function STLModel({ url, onPointerDown, onPointerMove, onPointerLeave }: Omit<ModelMeshProps, 'fileType' | 'onModelScale'>) {
  const geometry = useLoader(STLLoader, url);
  const material = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#8899aa', roughness: 0.5, metalness: 0.3 }),
    [],
  );

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

function GLBModel({ url, onPointerDown, onPointerMove, onPointerLeave }: Omit<ModelMeshProps, 'fileType' | 'onModelScale'>) {
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

/**
 * Wraps a model mesh with auto-fit-to-camera on first render.
 * Uses useFrame to wait until geometry is actually available (after Suspense + Center),
 * then positions the camera and syncs OrbitControls.
 */
export function ModelMeshWithFitter({ url, fileType, onPointerDown, onPointerMove, onPointerLeave, onModelScale }: ModelMeshProps) {
  const groupRef = useRef<THREE.Group>(null);
  const { camera, controls } = useThree();
  const [fitted, setFitted] = useState(false);

  // Use useFrame to reliably detect when model geometry is available.
  // useEffect fires too early — before useLoader resolves or Center processes.
  useFrame(() => {
    if (fitted || !groupRef.current) return;
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

    // Sync OrbitControls target so it orbits around the model center
    if (controls && 'target' in controls) {
      (controls.target as THREE.Vector3).copy(center);
      (controls as unknown as { update: () => void }).update();
    }

    onModelScale?.(maxDim);
    setFitted(true);
  });

  const meshProps = { url, onPointerDown, onPointerMove, onPointerLeave };

  return (
    <group ref={groupRef}>
      {fileType === 'stl' ? <STLModel {...meshProps} /> : <GLBModel {...meshProps} />}
    </group>
  );
}
