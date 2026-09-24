"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { useDevicePerformance } from "../hooks/useDevicePerformance";

interface Experience3DProps {
  children?: React.ReactNode;
}

/**
 * 3D Viewport Root Component
 *
 * Integrates dynamic device profiling, adaptive DPR, hardware shadow configuration,
 * and high-fidelity perspective camera controls.
 */
export function Experience3D({ children }: Experience3DProps) {
  const perf = useDevicePerformance();

  return (
    <div className="relative w-full h-full overflow-hidden bg-slate-950">
      <Canvas
        dpr={perf.dpr}
        shadows={perf.shadows}
        gl={{
          antialias: true,
          powerPreference: "high-performance",
          alpha: false,
        }}
      >
        <PerspectiveCamera makeDefault position={[0, 1.8, 4.2]} fov={45} />
        <ambientLight intensity={0.7} />
        
        <directionalLight
          position={[5, 10, 5]}
          intensity={1.2}
          castShadow={Boolean(perf.shadows)}
          shadow-mapSize-width={perf.shadowMapSize[0]}
          shadow-mapSize-height={perf.shadowMapSize[1]}
          shadow-bias={-0.0001}
        />

        <Suspense fallback={null}>
          {children}
        </Suspense>

        <OrbitControls
          enablePan={false}
          maxPolarAngle={Math.PI / 2 + 0.1}
          minDistance={1.8}
          maxDistance={6.5}
          dampingFactor={0.05}
          enableDamping
        />
      </Canvas>
    </div>
  );
}
