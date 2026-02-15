'use client';
import { useState, useEffect, Suspense, lazy } from 'react';
import { Canvas } from '@react-three/fiber';

const MeasuredCube = lazy(() => import('./MeasuredCube'));

export default function HeroScene() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return <div className="absolute inset-0 -z-10" />;

  return (
    <div className="absolute inset-0 -z-10 opacity-60">
      <Canvas
        camera={{ position: [4, 3, 5], fov: 40 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={null}>
          <MeasuredCube />
        </Suspense>
      </Canvas>
    </div>
  );
}
