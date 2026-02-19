'use client';

import { useRef, useEffect } from 'react';
import { ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import type { SceneObject } from '@/types/scene-object';
import { useSceneObjectStore } from '@/stores/useSceneObjectStore';
import { ImagePlane } from './ImagePlane';
import { ModelMeshWithFitter } from './ModelMesh';

interface SceneObjectRendererProps {
  object: SceneObject;
  /** Image-surface interaction handlers (for ImagePlane meshes) */
  imageHandlers?: {
    onPointerDown: (e: ThreeEvent<PointerEvent>) => void;
    onPointerMove: (e: ThreeEvent<PointerEvent>) => void;
    onDoubleClick: (e: ThreeEvent<MouseEvent>) => void;
  };
  /** Model-surface interaction handlers (for ModelMesh meshes) */
  modelHandlers?: {
    onPointerDown: (e: ThreeEvent<PointerEvent>) => void;
    onPointerMove: (e: ThreeEvent<PointerEvent>) => void;
    onPointerLeave: () => void;
    onModelScale?: (scale: number) => void;
  };
}

/**
 * Renders a single SceneObject inside a positioned <group>.
 * Registers the group ref with useSceneObjectStore for TransformControls targeting.
 */
export function SceneObjectRenderer({ object, imageHandlers, modelHandlers }: SceneObjectRendererProps) {
  const groupRef = useRef<THREE.Group>(null);
  const registerRef = useSceneObjectStore((s) => s.registerRef);
  const unregisterRef = useSceneObjectStore((s) => s.unregisterRef);

  // Register group ref for TransformControls
  useEffect(() => {
    registerRef(object.id, groupRef as React.RefObject<THREE.Group | null>);
    return () => unregisterRef(object.id);
  }, [object.id, registerRef, unregisterRef]);

  if (!object.visible) return null;

  const [px, py, pz] = object.transform.position;
  const [rx, ry, rz] = object.transform.rotation;
  const [sx, sy, sz] = object.transform.scale;

  return (
    <group
      ref={groupRef}
      position={[px, py, pz]}
      rotation={[rx, ry, rz]}
      scale={[sx, sy, sz]}
      userData={{ objectId: object.id, objectType: object.type }}
    >
      {object.type === 'image' && object.image && imageHandlers && (
        <ImagePlane
          image={object.image}
          onPointerDown={imageHandlers.onPointerDown}
          onPointerMove={imageHandlers.onPointerMove}
          onDoubleClick={imageHandlers.onDoubleClick}
        />
      )}
      {object.type === 'model' && object.modelUrl && object.modelFileType && modelHandlers && (
        <ModelMeshWithFitter
          url={object.modelUrl}
          fileType={object.modelFileType}
          onPointerDown={modelHandlers.onPointerDown}
          onPointerMove={modelHandlers.onPointerMove}
          onPointerLeave={modelHandlers.onPointerLeave}
          onModelScale={modelHandlers.onModelScale}
        />
      )}
    </group>
  );
}
