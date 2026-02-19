'use client';

import { useMemo, useRef, useState, useEffect } from 'react';
import { useLoader, useThree, ThreeEvent } from '@react-three/fiber';
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
 * Reports the bounding-box max dimension via onModelScale.
 */
export function ModelMeshWithFitter({ url, fileType, onPointerDown, onPointerMove, onPointerLeave, onModelScale }: ModelMeshProps) {
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

  const meshProps = { url, onPointerDown, onPointerMove, onPointerLeave };

  return (
    <group ref={groupRef}>
      {fileType === 'stl' ? <STLModel {...meshProps} /> : <GLBModel {...meshProps} />}
    </group>
  );
}
