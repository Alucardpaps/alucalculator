'use client';

import React, { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

// ══════════════════════════════════════════════════════════════
// 3D Realistic Aluminum T-Slot Profile Geometry
// ══════════════════════════════════════════════════════════════
function AluminumExtrusionMesh({ isWireframe }: { isWireframe: boolean }) {
  const meshRef = useRef<THREE.Group>(null);

  // Rotate smoothly on continuous frame
  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.4;
      meshRef.current.rotation.x = Math.sin(Date.now() * 0.0008) * 0.15 + 0.3;
    }
  });

  // Construct Extrusion Cross-Section Shape
  const extrusionGeometry = useMemo(() => {
    const shape = new THREE.Shape();
    const size = 1.4;
    const half = size / 2;
    const slotW = 0.25;
    const slotD = 0.22;

    // Outer contour with 4 standard T-slots
    shape.moveTo(-half, -half);
    // Bottom edge + slot
    shape.lineTo(-slotW / 2, -half);
    shape.lineTo(-slotW / 2, -half + slotD);
    shape.lineTo(slotW / 2, -half + slotD);
    shape.lineTo(slotW / 2, -half);
    shape.lineTo(half, -half);

    // Right edge + slot
    shape.lineTo(half, -slotW / 2);
    shape.lineTo(half - slotD, -slotW / 2);
    shape.lineTo(half - slotD, slotW / 2);
    shape.lineTo(half, slotW / 2);
    shape.lineTo(half, half);

    // Top edge + slot
    shape.lineTo(slotW / 2, half);
    shape.lineTo(slotW / 2, half - slotD);
    shape.lineTo(-slotW / 2, half - slotD);
    shape.lineTo(-slotW / 2, half);
    shape.lineTo(-half, half);

    // Left edge + slot
    shape.lineTo(-half, slotW / 2);
    shape.lineTo(-half + slotD, slotW / 2);
    shape.lineTo(-half + slotD, -slotW / 2);
    shape.lineTo(-half, -slotW / 2);
    shape.closePath();

    // Center Core Hole
    const hole = new THREE.Path();
    const holeR = 0.28;
    hole.absarc(0, 0, holeR, 0, Math.PI * 2, true);
    shape.holes.push(hole);

    const extrudeSettings: THREE.ExtrudeGeometryOptions = {
      steps: 1,
      depth: 2.8,
      bevelEnabled: true,
      bevelThickness: 0.02,
      bevelSize: 0.02,
      bevelSegments: 3,
    };

    const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geom.center();
    return geom;
  }, []);

  return (
    <group ref={meshRef}>
      <mesh geometry={extrusionGeometry}>
        <meshStandardMaterial
          color={isWireframe ? '#00e5ff' : '#94a3b8'}
          metalness={isWireframe ? 0.2 : 0.92}
          roughness={isWireframe ? 0.8 : 0.18}
          wireframe={isWireframe}
          envMapIntensity={1.5}
        />
      </mesh>
    </group>
  );
}

// ══════════════════════════════════════════════════════════════
// Main WebGL 3D CAD Hero Preview Component
// ══════════════════════════════════════════════════════════════
export function RealCadHero3D() {
  const [isWireframe, setIsWireframe] = useState(false);

  return (
    <div className="relative w-full h-[360px] sm:h-[400px] rounded-2xl bg-gradient-to-b from-[#060a14] to-[#020408] border border-white/10 overflow-hidden shadow-2xl flex flex-col justify-between group">
      
      {/* Top Controls Overlay */}
      <div className="relative z-10 flex items-center justify-between p-4 bg-black/20 backdrop-blur-xs">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="font-mono text-xs font-semibold text-slate-300">
            40x40_Extrusion_Profile.step
          </span>
        </div>

        <div className="flex items-center gap-1.5 bg-white/5 rounded-lg p-0.5 border border-white/10">
          <button
            type="button"
            onClick={() => setIsWireframe(false)}
            className={`px-2.5 py-1 rounded text-xs font-mono transition cursor-pointer ${
              !isWireframe
                ? 'bg-cyan-500 text-slate-950 font-bold shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Shaded Solid
          </button>
          <button
            type="button"
            onClick={() => setIsWireframe(true)}
            className={`px-2.5 py-1 rounded text-xs font-mono transition cursor-pointer ${
              isWireframe
                ? 'bg-cyan-500 text-slate-950 font-bold shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Wireframe Mesh
          </button>
        </div>
      </div>

      {/* 3D WebGL Canvas Viewport */}
      <div className="absolute inset-0 z-0">
        <Canvas
          dpr={[1, 2]}
          gl={{
            antialias: true,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.1,
          }}
        >
          <PerspectiveCamera makeDefault position={[0, 1.2, 4.2]} fov={45} />
          <ambientLight intensity={0.7} color="#ffffff" />
          <directionalLight position={[5, 8, 5]} intensity={2.2} color="#ecfeff" />
          <directionalLight position={[-6, -3, -4]} intensity={1.0} color="#0284c7" />
          <pointLight position={[0, 4, 2]} intensity={1.5} color="#38bdf8" />

          {/* Reference Blueprint Grid */}
          <gridHelper
            args={[12, 16, '#0284c7', '#0f2744']}
            position={[0, -1.3, 0]}
          />

          <Float speed={1.2} rotationIntensity={0.2} floatIntensity={0.3}>
            <AluminumExtrusionMesh isWireframe={isWireframe} />
          </Float>

          <OrbitControls
            enableZoom={false}
            enablePan={false}
            autoRotate={false}
            rotateSpeed={0.6}
            maxPolarAngle={Math.PI / 2 + 0.1}
            minPolarAngle={Math.PI / 6}
          />
        </Canvas>
      </div>

      {/* Bottom Specs Footer */}
      <div className="relative z-10 p-3 bg-black/40 backdrop-blur-md border-t border-white/5 flex items-center justify-between text-xs font-mono text-slate-400">
        <div className="flex items-center gap-4">
          <span>
            Alaşım: <strong className="text-white">EN AW-6063-T6</strong>
          </span>
          <span className="hidden sm:inline">
            Ağırlık: <strong className="text-cyan-400">1.75 kg/m</strong>
          </span>
          <span className="hidden sm:inline">
            Norm: <strong className="text-slate-300">DIN EN 12020-2</strong>
          </span>
        </div>
        <span className="text-[11px] text-cyan-300 font-medium">3D Fareyle Çevrilebilir ⟳</span>
      </div>
    </div>
  );
}
