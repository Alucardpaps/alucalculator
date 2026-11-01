'use client';

import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, Float, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { Eye, Wind, Layers, RotateCcw, Compass, Activity, ArrowRight, Gauge } from 'lucide-react';
import { useI18nStore } from '@/store/i18nStore';
import { t12 } from '@/locales/t12';

interface WindTunnel3DViewportProps {
  shapeId: string;
  velocityKmH: number;
  density: number;
  cd: number;
  area: number;
  dragForceN: number;
  powerKw: number;
  qPa: number;
}

// -------------------------------------------------------------
// 3D Test Object Geometry Sub-components
// -------------------------------------------------------------
function TestObjectMesh({ shapeId, cd, showPressureMap }: { shapeId: string; cd: number; showPressureMap: boolean }) {
  // Memoized materials to avoid recreation in render loop
  const material = useMemo(() => {
    if (showPressureMap) {
      // Pressure heatmap styling
      return new THREE.MeshStandardMaterial({
        color: '#38bdf8',
        roughness: 0.3,
        metalness: 0.7,
      });
    }
    return new THREE.MeshStandardMaterial({
      color: shapeId === 'airfoil' ? '#38bdf8' : shapeId === 'sedan' ? '#f43f5e' : shapeId === 'suv' ? '#f97316' : shapeId === 'truck' ? '#a855f7' : shapeId === 'sphere' ? '#10b981' : '#e2e8f0',
      roughness: 0.25,
      metalness: 0.8,
    });
  }, [shapeId, showPressureMap]);

  if (shapeId === 'airfoil') {
    return (
      <group rotation={[0, 0, 0]}>
        {/* Streamlined Airfoil Wing section */}
        <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <capsuleGeometry args={[0.35, 1.8, 16, 32]} />
          <primitive object={material} attach="material" />
        </mesh>
        {/* Wingtips */}
        <mesh position={[0, 0, 1.0]}>
          <boxGeometry args={[1.2, 0.05, 0.3]} />
          <meshStandardMaterial color="#0ea5e9" roughness={0.3} metalness={0.7} />
        </mesh>
        <mesh position={[0, 0, -1.0]}>
          <boxGeometry args={[1.2, 0.05, 0.3]} />
          <meshStandardMaterial color="#0ea5e9" roughness={0.3} metalness={0.7} />
        </mesh>
      </group>
    );
  }

  if (shapeId === 'sedan') {
    return (
      <group position={[0, -0.15, 0]}>
        {/* Car Main Lower Chassis */}
        <mesh position={[0, 0.15, 0]}>
          <boxGeometry args={[2.6, 0.5, 1.2]} />
          <primitive object={material} attach="material" />
        </mesh>
        {/* Car Cabin / Greenhouse */}
        <mesh position={[-0.15, 0.55, 0]}>
          <boxGeometry args={[1.3, 0.45, 1.0]} />
          <meshStandardMaterial color="#1e293b" roughness={0.1} metalness={0.9} />
        </mesh>
        {/* Hood Slope */}
        <mesh position={[0.7, 0.3, 0]} rotation={[0, 0, -0.3]}>
          <boxGeometry args={[0.7, 0.15, 1.15]} />
          <primitive object={material} attach="material" />
        </mesh>
        {/* Wheels */}
        <mesh position={[0.8, 0, 0.6]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.25, 0.25, 0.2, 16]} />
          <meshStandardMaterial color="#0f172a" roughness={0.8} />
        </mesh>
        <mesh position={[0.8, 0, -0.6]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.25, 0.25, 0.2, 16]} />
          <meshStandardMaterial color="#0f172a" roughness={0.8} />
        </mesh>
        <mesh position={[-0.8, 0, 0.6]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.25, 0.25, 0.2, 16]} />
          <meshStandardMaterial color="#0f172a" roughness={0.8} />
        </mesh>
        <mesh position={[-0.8, 0, -0.6]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.25, 0.25, 0.2, 16]} />
          <meshStandardMaterial color="#0f172a" roughness={0.8} />
        </mesh>
      </group>
    );
  }

  if (shapeId === 'suv') {
    return (
      <group position={[0, -0.05, 0]}>
        {/* SUV Lower Chassis */}
        <mesh position={[0, 0.2, 0]}>
          <boxGeometry args={[2.8, 0.6, 1.3]} />
          <primitive object={material} attach="material" />
        </mesh>
        {/* Boxy Upper Cabin */}
        <mesh position={[-0.1, 0.7, 0]}>
          <boxGeometry args={[1.7, 0.6, 1.15]} />
          <meshStandardMaterial color="#1e293b" roughness={0.1} metalness={0.9} />
        </mesh>
        {/* Wheels with higher ground clearance */}
        <mesh position={[0.9, 0, 0.65]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.3, 0.3, 0.25, 16]} />
          <meshStandardMaterial color="#0f172a" roughness={0.8} />
        </mesh>
        <mesh position={[0.9, 0, -0.65]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.3, 0.3, 0.25, 16]} />
          <meshStandardMaterial color="#0f172a" roughness={0.8} />
        </mesh>
        <mesh position={[-0.9, 0, 0.65]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.3, 0.3, 0.25, 16]} />
          <meshStandardMaterial color="#0f172a" roughness={0.8} />
        </mesh>
        <mesh position={[-0.9, 0, -0.65]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.3, 0.3, 0.25, 16]} />
          <meshStandardMaterial color="#0f172a" roughness={0.8} />
        </mesh>
      </group>
    );
  }

  if (shapeId === 'truck') {
    return (
      <group position={[0, 0.1, 0]}>
        {/* Tractor Cab */}
        <mesh position={[1.0, 0.45, 0]}>
          <boxGeometry args={[0.9, 1.3, 1.2]} />
          <primitive object={material} attach="material" />
        </mesh>
        {/* Trailer Box */}
        <mesh position={[-0.4, 0.55, 0]}>
          <boxGeometry args={[1.9, 1.5, 1.3]} />
          <meshStandardMaterial color="#cbd5e1" roughness={0.4} metalness={0.6} />
        </mesh>
      </group>
    );
  }

  if (shapeId === 'sphere') {
    return (
      <mesh position={[0, 0.2, 0]}>
        <sphereGeometry args={[0.75, 48, 48]} />
        <primitive object={material} attach="material" />
      </mesh>
    );
  }

  // Default: Cube
  return (
    <mesh position={[0, 0.2, 0]}>
      <boxGeometry args={[1.2, 1.2, 1.2]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}

// -------------------------------------------------------------
// Wind Particles & Streamlines System
// -------------------------------------------------------------
function WindStreamlines({
  velocityMs,
  shapeId,
  mode,
}: {
  velocityMs: number;
  shapeId: string;
  mode: 'streamlines' | 'vectors' | 'wake';
}) {
  const count = 420;
  const ref = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Wake severity multiplier based on shape bluffness
  const wakeWidth = useMemo(() => {
    if (shapeId === 'airfoil') return 0.25;
    if (shapeId === 'sedan') return 0.65;
    if (shapeId === 'suv') return 0.95;
    if (shapeId === 'truck') return 1.40;
    if (shapeId === 'sphere') return 0.85;
    return 1.35; // cube
  }, [shapeId]);

  // Initial particle state vectors
  const particles = useMemo(() => {
    const list = [];
    for (let i = 0; i < count; i++) {
      const t = Math.random() * 100;
      const speed = 0.015 + Math.random() * 0.025;
      const xInit = -6 + Math.random() * 12;
      const yInit = -1.2 + Math.random() * 2.6;
      const zInit = -1.8 + Math.random() * 3.6;
      list.push({ t, speed, xInit, yInit, zInit });
    }
    return list;
  }, [count]);

  useFrame((state) => {
    if (!ref.current) return;
    const speedFactor = Math.max(0.1, Math.min(3.5, velocityMs / 30));

    particles.forEach((p, i) => {
      p.t += p.speed * speedFactor;
      // Inflow flows from right (+X) to left (-X)
      let x = 6 - ((p.xInit + p.t * 8) % 12);

      let y = p.yInit;
      let z = p.zInit;

      // Obstacle deflection around center (x ~ 0, y ~ 0, z ~ 0)
      const distToBody = Math.sqrt(x * x + y * y + z * z);
      if (distToBody < 1.8) {
        const factor = (1.8 - distToBody) / 1.8;
        // Push outward
        y += Math.sign(y || 1) * factor * 0.7;
        z += Math.sign(z || 1) * factor * 0.6;
      }

      // Turbulent wake behind body (x < -0.4)
      if (x < -0.4 && x > -5.0 && Math.abs(y) < wakeWidth && Math.abs(z) < wakeWidth) {
        if (mode === 'wake' || mode === 'vectors') {
          // Vortical swirling in wake cavity
          const vortexPhase = state.clock.elapsedTime * 6 + i;
          y += Math.sin(vortexPhase) * 0.25 * wakeWidth;
          z += Math.cos(vortexPhase) * 0.25 * wakeWidth;
        }
      }

      dummy.position.set(x, y, z);
      // Elongate streak particles in direction of wind
      const stretch = mode === 'streamlines' ? 1 + speedFactor * 3.0 : 1 + speedFactor;
      dummy.scale.set(stretch, 0.06, 0.06);
      dummy.updateMatrix();
      ref.current!.setMatrixAt(i, dummy.matrix);
    });

    ref.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]}>
      <sphereGeometry args={[0.07, 8, 8]} />
      <meshBasicMaterial
        color={mode === 'wake' ? '#a855f7' : mode === 'vectors' ? '#38bdf8' : '#3ad0e6'}
        transparent
        opacity={mode === 'wake' ? 0.8 : 0.65}
      />
    </instancedMesh>
  );
}

// -------------------------------------------------------------
// Live Drag Force Arrow Vector in 3D
// -------------------------------------------------------------
function ForceVectorArrow({ dragForceN, velocityMs }: { dragForceN: number; velocityMs: number }) {
  // Arrow length scales logarithmically with drag force
  const arrowLength = Math.max(0.6, Math.min(3.2, 0.6 + Math.log10(Math.max(1, dragForceN)) * 0.75));

  return (
    <group position={[-1.2, 0.2, 0]}>
      {/* Red Force Shaft pointing downstream (-X) */}
      <mesh position={[-arrowLength / 2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.04, 0.04, arrowLength, 16]} />
        <meshStandardMaterial color="#f43f5e" emissive="#f43f5e" emissiveIntensity={0.6} />
      </mesh>
      {/* Arrowhead */}
      <mesh position={[-arrowLength, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <coneGeometry args={[0.12, 0.35, 16]} />
        <meshStandardMaterial color="#f43f5e" emissive="#f43f5e" emissiveIntensity={0.6} />
      </mesh>
      {/* In-Canvas Force Value Tag */}
      <Html position={[-arrowLength - 0.2, 0.3, 0]} center>
        <div className="px-2 py-0.5 rounded bg-rose-950/90 border border-rose-500/60 text-[10px] font-mono font-bold text-rose-300 whitespace-nowrap shadow-lg">
          FD: {dragForceN < 1000 ? `${dragForceN.toFixed(1)} N` : `${(dragForceN / 1000).toFixed(2)} kN`}
        </div>
      </Html>
    </group>
  );
}

// -------------------------------------------------------------
// Main 3D Viewport Component
// -------------------------------------------------------------
export default function WindTunnel3DViewport({
  shapeId,
  velocityKmH,
  density,
  cd,
  area,
  dragForceN,
  powerKw,
  qPa,
}: WindTunnel3DViewportProps) {
  const language = useI18nStore((s) => s.language);
  const [cameraView, setCameraView] = useState<'persp' | 'side' | 'top' | 'front'>('persp');
  const [visualMode, setVisualMode] = useState<'streamlines' | 'vectors' | 'wake'>('streamlines');
  const [showPressureMap, setShowPressureMap] = useState<boolean>(false);

  const velMs = velocityKmH / 3.6;

  // Camera angles
  const cameraPosition = useMemo((): [number, number, number] => {
    if (cameraView === 'side') return [0, 0.2, 5.5];
    if (cameraView === 'top') return [0, 6.0, 0.01];
    if (cameraView === 'front') return [5.5, 0.2, 0];
    return [4.2, 2.2, 4.5]; // Default 3D Perspective
  }, [cameraView]);

  return (
    <div className="relative w-full h-[460px] bg-[var(--bg-0)] rounded-2xl border border-[var(--line)] overflow-hidden shadow-2xl flex flex-col select-none">
      {/* Top Floating Control Bar */}
      <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        {/* Left Status Indicator */}
        <div className="flex items-center gap-2 bg-[var(--bg-1)]/90 px-3 py-1.5 rounded-lg border border-[var(--line)] pointer-events-auto shadow-md">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse " />
          <span className="text-[11px] font-mono font-bold text-white tracking-wide uppercase">
            {t12(language, 'Wind Tunnel Active Chamber', 'Rüzgar Tüneli Test Odası')}
          </span>
          <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800">
            {velocityKmH} km/h ({(velMs).toFixed(1)} m/s)
          </span>
        </div>

        {/* Right Camera & Shading Tools */}
        <div className="flex items-center gap-1.5 bg-[var(--bg-1)]/90 p-1 rounded-lg border border-[var(--line)] pointer-events-auto shadow-md">
          <button
            onClick={() => setCameraView('persp')}
            title="3D Perspective"
            className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold transition-all ${
              cameraView === 'persp' ? 'bg-[var(--cyan)] text-[var(--accent-ink)]' : 'text-slate-400 hover:text-white'
            }`}
          >
            3D ISO
          </button>
          <button
            onClick={() => setCameraView('side')}
            title="Side Profile View (X-Y)"
            className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold transition-all ${
              cameraView === 'side' ? 'bg-[var(--cyan)] text-[var(--accent-ink)]' : 'text-slate-400 hover:text-white'
            }`}
          >
            SIDE
          </button>
          <button
            onClick={() => setCameraView('top')}
            title="Top Plan View (X-Z)"
            className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold transition-all ${
              cameraView === 'top' ? 'bg-[var(--cyan)] text-[var(--accent-ink)]' : 'text-slate-400 hover:text-white'
            }`}
          >
            TOP
          </button>
          <button
            onClick={() => setCameraView('front')}
            title="Frontal Inflow View (Y-Z)"
            className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold transition-all ${
              cameraView === 'front' ? 'bg-[var(--cyan)] text-[var(--accent-ink)]' : 'text-slate-400 hover:text-white'
            }`}
          >
            FRONT
          </button>

          <div className="w-px h-4 bg-slate-700 mx-1" />

          <button
            onClick={() => setVisualMode((prev) => (prev === 'streamlines' ? 'wake' : prev === 'wake' ? 'vectors' : 'streamlines'))}
            className="px-2 py-1 rounded bg-[var(--bg-3)] text-[10px] font-mono text-cyan-400 border border-slate-700 hover:border-cyan-500 flex items-center gap-1"
          >
            <Wind className="w-3 h-3" />
            <span>{visualMode.toUpperCase()}</span>
          </button>
        </div>
      </div>

      {/* 3D Canvas */}
      <div className="flex-1 w-full h-full relative cursor-grab active:cursor-grabbing">
        <Canvas camera={{ position: cameraPosition, fov: 42 }}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[10, 10, 8]} intensity={1.2} castShadow />
          <directionalLight position={[-10, 5, -8]} intensity={0.4} />

          <Float speed={1.5} rotationIntensity={0.08} floatIntensity={0.15}>
            <TestObjectMesh shapeId={shapeId} cd={cd} showPressureMap={showPressureMap} />
          </Float>

          {/* Wind Streamlines System */}
          <WindStreamlines velocityMs={velMs} shapeId={shapeId} mode={visualMode} />

          {/* Real-time Dynamic Force Arrow Vector */}
          <ForceVectorArrow dragForceN={dragForceN} velocityMs={velMs} />

          {/* Floor ground grid representing wind tunnel boundary plate */}
          <gridHelper args={[24, 24, 0x1e293b, 0x0f172a]} position={[0, -1.2, 0]} />
          <ContactShadows position={[0, -1.19, 0]} opacity={0.5} scale={8} blur={2.5} far={3} />

          <OrbitControls
            makeDefault
            minPolarAngle={0}
            maxPolarAngle={Math.PI / 2 + 0.05}
            enableDamping
            dampingFactor={0.05}
          />
        </Canvas>
      </div>

      {/* Bottom Telemetry Overlay */}
      <div className="absolute bottom-3 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none text-[10px] font-mono text-slate-400 bg-[var(--bg-1)]/80 px-4 py-2 rounded-xl border border-[var(--line)]">
        <div className="flex items-center gap-3">
          <span>Inflow: {velocityKmH} km/h ({(velMs).toFixed(1)} m/s)</span>
          <span>•</span>
          <span>ρ = {density.toFixed(3)} kg/m³</span>
          <span>•</span>
          <span className="text-cyan-400">q = {qPa.toFixed(0)} Pa</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-rose-400 font-bold">FD = {dragForceN < 1000 ? `${dragForceN.toFixed(1)} N` : `${(dragForceN / 1000).toFixed(2)} kN`}</span>
          <span>•</span>
          <span className="text-amber-400 font-bold">P = {powerKw.toFixed(1)} kW</span>
        </div>
      </div>
    </div>
  );
}
