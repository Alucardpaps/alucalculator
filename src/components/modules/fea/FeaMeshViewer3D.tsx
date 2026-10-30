'use client';

import React, { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, Center, Html } from '@react-three/drei';
import * as THREE from 'three';
import '@/lib/three-cleanup';
import { FeaTemplateResult, getFeaHeatmapColor, FixationPoint, ForceVector } from '@/engines/fea/FeaTemplateSolver';
import { Maximize2, RotateCcw, AlertTriangle, CheckCircle2, ShieldAlert, Anchor, ArrowDown, Eye, EyeOff, Activity, Play, Pause } from 'lucide-react';

interface FeaMeshViewer3DProps {
  analysis: FeaTemplateResult;
  deformationScale: number;
  showWireframe: boolean;
  showProbes: boolean;
  showFixations?: boolean;
  showForceVector?: boolean;
  isHarmonicVibrating?: boolean;
}

/**
 * 3D Fixation Anchor Glyphs (Boundary Conditions)
 */
function FixationMarkers3D({ fixations }: { fixations?: FixationPoint[] }) {
  if (!fixations || fixations.length === 0) return null;

  return (
    <group>
      {fixations.map((fix, idx) => {
        const [nx, ny, nz] = fix.normal || [-1, 0, 0];
        const normalVec = new THREE.Vector3(nx, ny, nz).normalize();
        const upVec = new THREE.Vector3(0, 1, 0);
        const quaternion = new THREE.Quaternion().setFromUnitVectors(upVec, normalVec);

        return (
          <group key={idx} position={fix.position} quaternion={quaternion}>
            {/* Triangular Anchor Cone */}
            <mesh position={[0, -4, 0]}>
              <coneGeometry args={[3.5, 7, 4]} />
              <meshStandardMaterial color="#f59e0b" emissive="#d97706" emissiveIntensity={0.6} roughness={0.2} metalness={0.8} />
            </mesh>
            {/* Ground / Wall Hatch Base Plate */}
            <mesh position={[0, -8, 0]}>
              <boxGeometry args={[10, 1.5, 10]} />
              <meshStandardMaterial color="#b45309" roughness={0.4} metalness={0.9} />
            </mesh>
            {/* Hatch Wireframe */}
            <lineSegments position={[0, -8.8, 0]}>
              <edgesGeometry args={[new THREE.BoxGeometry(10, 1.5, 10)]} />
              <lineBasicMaterial color="#fef08a" />
            </lineSegments>
          </group>
        );
      })}
    </group>
  );
}

/**
 * 3D Force Direction Vector Arrow & Readout
 */
function ForceArrow3D({ force }: { force?: ForceVector }) {
  if (!force || force.magnitudeN <= 0) return null;

  const { direction, applicationPoint, magnitudeN, label } = force;
  const [dx, dy, dz] = direction;
  const dirVec = new THREE.Vector3(dx, dy, dz).normalize();
  const upVec = new THREE.Vector3(0, 1, 0);
  const quaternion = new THREE.Quaternion().setFromUnitVectors(upVec, dirVec);

  const arrowLength = Math.min(60, Math.max(25, Math.log10(magnitudeN + 10) * 12));
  const shaftLength = arrowLength * 0.75;
  const coneLength = arrowLength * 0.25;
  const shaftRadius = 1.8;
  const coneRadius = 4.2;

  // Arrow starts back along -dirVec and points into applicationPoint
  const startPos = new THREE.Vector3(...applicationPoint).clone().sub(dirVec.clone().multiplyScalar(arrowLength));

  return (
    <group position={startPos} quaternion={quaternion}>
      {/* Cylindrical Shaft */}
      <mesh position={[0, shaftLength / 2, 0]}>
        <cylinderGeometry args={[shaftRadius, shaftRadius, shaftLength, 16]} />
        <meshStandardMaterial color="#ef4444" emissive="#dc2626" emissiveIntensity={0.8} roughness={0.2} />
      </mesh>
      {/* Arrow Cone Head */}
      <mesh position={[0, shaftLength + coneLength / 2, 0]}>
        <coneGeometry args={[coneRadius, coneLength, 16]} />
        <meshStandardMaterial color="#ff2056" emissive="#e11d48" emissiveIntensity={0.9} roughness={0.2} />
      </mesh>
    </group>
  );
}

/**
 * 3D Colored Stress Mesh Component
 */
function FeaStressMesh({
  analysis,
  deformationScale,
  showWireframe,
  showProbes,
  showFixations = true,
  showForceVector = true,
  isHarmonicVibrating = false,
}: {
  analysis: FeaTemplateResult;
  deformationScale: number;
  showWireframe: boolean;
  showProbes: boolean;
  showFixations?: boolean;
  showForceVector?: boolean;
  isHarmonicVibrating?: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const wireMeshRef = useRef<THREE.Mesh>(null);

  // Compute dynamic deformed geometry with per-vertex RGB colors
  const coloredGeometry = useMemo(() => {
    const origGeom = analysis.deformedGeometry;
    const posAttr = origGeom.getAttribute('position') as THREE.BufferAttribute;
    const count = posAttr.count;

    const newGeom = origGeom.clone();
    const newPos = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    const minStress = analysis.minVonMisesMpa;
    const maxStress = analysis.maxVonMisesMpa;

    for (let i = 0; i < count; i++) {
      const ox = posAttr.getX(i);
      const oy = posAttr.getY(i);
      const oz = posAttr.getZ(i);

      const dx = analysis.displacements[i * 3] || 0;
      const dy = analysis.displacements[i * 3 + 1] || 0;
      const dz = analysis.displacements[i * 3 + 2] || 0;

      // Apply scaled deformation
      newPos[i * 3] = ox + dx * deformationScale;
      newPos[i * 3 + 1] = oy + dy * deformationScale;
      newPos[i * 3 + 2] = oz + dz * deformationScale;

      // Stress Heatmap Color
      const stress = analysis.vonMisesStress[i] || 0;
      const [r, g, b] = getFeaHeatmapColor(stress, minStress, maxStress);
      colors[i * 3] = r;
      colors[i * 3 + 1] = g;
      colors[i * 3 + 2] = b;
    }

    newGeom.setAttribute('position', new THREE.BufferAttribute(newPos, 3));
    newGeom.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    newGeom.computeVertexNormals();
    return newGeom;
  }, [analysis, deformationScale]);

  // Harmonic dynamic oscillation animation
  useFrame(({ clock }) => {
    if (!isHarmonicVibrating || !meshRef.current) return;
    const geom = meshRef.current.geometry;
    const posAttr = geom.getAttribute('position') as THREE.BufferAttribute;
    const origPosAttr = analysis.deformedGeometry.getAttribute('position') as THREE.BufferAttribute;
    const count = origPosAttr.count;
    const t = Math.sin(clock.elapsedTime * 8);

    for (let i = 0; i < count; i++) {
      const ox = origPosAttr.getX(i);
      const oy = origPosAttr.getY(i);
      const oz = origPosAttr.getZ(i);

      const dx = analysis.displacements[i * 3] || 0;
      const dy = analysis.displacements[i * 3 + 1] || 0;
      const dz = analysis.displacements[i * 3 + 2] || 0;

      posAttr.setXYZ(
        i,
        ox + dx * deformationScale * t,
        oy + dy * deformationScale * t,
        oz + dz * deformationScale * t
      );
    }
    posAttr.needsUpdate = true;
    geom.computeVertexNormals();
  });

  return (
    <group>
      {/* Shaded Colored Stress Mesh */}
      <mesh ref={meshRef} geometry={coloredGeometry} castShadow receiveShadow>
        <meshStandardMaterial
          vertexColors
          roughness={0.35}
          metalness={0.25}
          side={THREE.DoubleSide}
          wireframe={showWireframe}
        />
      </mesh>

      {/* Wireframe Overlay for element mesh inspection */}
      {showWireframe && (
        <mesh ref={wireMeshRef} geometry={coloredGeometry}>
          <meshBasicMaterial color="#ffffff" wireframe transparent opacity={0.3} />
        </mesh>
      )}

      {/* Fixation Boundary Support Glyphs */}
      {showFixations && <FixationMarkers3D fixations={analysis.fixations} />}

      {/* 3D Force Direction Vector Arrow */}
      {showForceVector && <ForceArrow3D force={analysis.forceVector} />}

      {/* Max Stress 3D Probe Pin */}
      {showProbes && analysis.maxVonMisesMpa > 0 && (
        <group position={analysis.maxStressCoord}>
          <mesh position={[0, 0, 0]}>
            <sphereGeometry args={[2.5, 16, 16]} />
            <meshBasicMaterial color="#ef4444" />
          </mesh>
          <mesh position={[0, 0, 0]}>
            <sphereGeometry args={[4, 16, 16]} />
            <meshBasicMaterial color="#ef4444" transparent opacity={0.3} />
          </mesh>
        </group>
      )}
    </group>
  );
}

export function FeaMeshViewer3D({
  analysis,
  deformationScale,
  showWireframe,
  showProbes,
  showFixations: initialShowFixations = true,
  showForceVector: initialShowForce = true,
  isHarmonicVibrating: initialVibrate = false,
}: FeaMeshViewer3DProps) {
  const [controlsKey, setControlsKey] = useState<number>(0);
  const [showFixations, setShowFixations] = useState<boolean>(initialShowFixations);
  const [showForceVector, setShowForceVector] = useState<boolean>(initialShowForce);
  const [isVibrating, setIsVibrating] = useState<boolean>(initialVibrate);

  const resetCamera = () => {
    setControlsKey((k) => k + 1);
  };

  const status = analysis.safetyFactor >= 1.5 ? 'SAFE' : analysis.safetyFactor >= 1.0 ? 'WARNING' : 'YIELDED';

  return (
    <div className="relative w-full h-full min-h-[480px] bg-[var(--bg-0)] overflow-hidden rounded-2xl border border-white/10 select-none shadow-2xl">
      {/* Top Floating Controls Bar */}
      <div className="absolute top-3 left-3 right-3 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <div className="flex flex-wrap items-center gap-1.5 pointer-events-auto">
          <button
            type="button"
            onClick={resetCamera}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-[var(--bg-1)]/90 border border-[var(--line)] text-[var(--alu)] hover:text-white hover:border-[var(--cyan)] text-xs font-mono transition-all shadow-sm active:scale-95"
            title="Reset Camera View"
          >
            <RotateCcw size={13} />
            <span>Reset View</span>
          </button>

          {/* Fixation Toggle */}
          <button
            type="button"
            onClick={() => setShowFixations((v) => !v)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded border text-xs font-mono transition-all shadow-sm ${
              showFixations
                ? 'bg-amber-500/20 border-amber-500/60 text-amber-300'
                : 'bg-[var(--bg-1)]/90 border-[var(--line)] text-[var(--alu-dim)] hover:text-white'
            }`}
            title="Toggle Boundary Support Anchors"
          >
            <Anchor size={13} className={showFixations ? 'text-amber-400' : 'text-[var(--alu-dim)]'} />
            <span>Boundary Support {showFixations ? 'ON' : 'OFF'}</span>
          </button>

          {/* Force Vector Toggle */}
          <button
            type="button"
            onClick={() => setShowForceVector((v) => !v)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded border text-xs font-mono transition-all shadow-sm ${
              showForceVector
                ? 'bg-rose-500/20 border-rose-500/60 text-rose-300'
                : 'bg-[var(--bg-1)]/90 border-[var(--line)] text-[var(--alu-dim)] hover:text-white'
            }`}
            title="Toggle Force Vector Arrow"
          >
            <ArrowDown size={13} className={showForceVector ? 'text-rose-400' : 'text-[var(--alu-dim)]'} />
            <span>Force Vector {showForceVector ? 'ON' : 'OFF'}</span>
          </button>

          {/* Dynamic Harmonic Vibration Simulation Toggle */}
          <button
            type="button"
            onClick={() => setIsVibrating((v) => !v)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded border text-xs font-mono transition-all shadow-sm ${
              isVibrating
                ? 'bg-[var(--cyan)]/20 border-[var(--cyan)] text-[var(--cyan)] animate-pulse'
                : 'bg-[var(--bg-1)]/90 border-[var(--line)] text-[var(--alu-dim)] hover:text-white'
            }`}
            title="Harmonic Vibration Oscillation"
          >
            <Activity size={13} className={isVibrating ? 'text-[var(--cyan)]' : 'text-[var(--alu-dim)]'} />
            <span>{isVibrating ? 'Vibration: Active' : 'Harmonic Motion'}</span>
            {analysis.modal && (
              <span className="text-[10px] bg-[var(--cyan)]/20 text-[var(--cyan)] px-1.5 py-0.5 rounded font-bold">
                {analysis.modal.f1_hz} Hz
              </span>
            )}
          </button>
        </div>

        {/* Top Floating Safety & Accuracy Badge */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <div
            className={`px-3 py-1.5 rounded border flex items-center gap-2 font-mono text-xs font-bold shadow-md ${
              status === 'SAFE'
                ? 'bg-[var(--bg-2)] border-[var(--ok)]/60 text-[var(--ok)]'
                : status === 'WARNING'
                ? 'bg-[var(--bg-3)] border-[var(--warn)]/60 text-[var(--warn)]'
                : 'bg-[var(--bg-2)] border-[var(--bad)]/60 text-[var(--bad)] animate-pulse'
            }`}
          >
            {status === 'SAFE' && <CheckCircle2 size={14} />}
            {status === 'WARNING' && <AlertTriangle size={14} />}
            {status === 'YIELDED' && <ShieldAlert size={14} />}
            <span>SF = {analysis.safetyFactor} ({status})</span>
          </div>

          <div className="px-2.5 py-1 rounded bg-[var(--bg-1)]/90 border border-[var(--line)] text-[var(--cyan)] font-mono text-[10px] font-bold">
            Err: {analysis.stressErrorPct}% (&lt; 8%)
          </div>
        </div>
      </div>

      {/* 3D WebGL Canvas */}
      <Canvas
        key={controlsKey}
        camera={{ position: [160, 120, 160], fov: 45 }}
        gl={{ antialias: true, alpha: false }}
        className="w-full h-full cursor-grab active:cursor-grabbing"
      >
        <color attach="background" args={['#05080f']} />
        <ambientLight intensity={0.7} />
        <directionalLight position={[150, 200, 100]} intensity={1.2} castShadow />
        <directionalLight position={[-150, -100, -100]} intensity={0.4} />

        <Center>
          <FeaStressMesh
            analysis={analysis}
            deformationScale={deformationScale}
            showWireframe={showWireframe}
            showProbes={showProbes}
            showFixations={showFixations}
            showForceVector={showForceVector}
            isHarmonicVibrating={isVibrating}
          />
        </Center>

        <Grid
          position={[0, -0.01, 0]}
          args={[300, 300]}
          cellSize={10}
          cellThickness={0.6}
          cellColor="#0c2b36"
          sectionSize={50}
          sectionThickness={1.2}
          sectionColor="#1a5b6e"
          fadeDistance={350}
        />

        <OrbitControls makeDefault enableDamping dampingFactor={0.05} maxDistance={800} minDistance={10} />
      </Canvas>

      {/* Stress Color Bar Legend */}
      <div className="absolute left-4 bottom-4 p-3 rounded bg-[var(--bg-1)]/95 border border-[var(--line)] shadow-2xl font-mono text-[11px] space-y-2 pointer-events-none">
        <div className="flex items-center justify-between text-slate-300 font-bold gap-2">
          <span>von Mises</span>
          <span className="text-[10px] text-cyan-400">[MPa]</span>
        </div>

        {/* Rainbow Gradient Legend Bar */}
        <div className="flex items-center gap-2">
          <div
            className="w-4 h-28 rounded-sm shadow-inner border border-white/10"
            style={{
              background: 'linear-gradient(to bottom, #ef4444 0%, #eab308 30%, #10b981 60%, #06b6d4 80%, #3b82f6 100%)',
            }}
          />
          <div className="flex flex-col justify-between h-28 text-[10px] text-slate-300">
            <span className="text-red-400 font-bold">{analysis.maxVonMisesMpa} (Peak)</span>
            <span className="text-amber-300">{Math.round((analysis.maxVonMisesMpa * 0.75 + analysis.minVonMisesMpa * 0.25) * 10) / 10}</span>
            <span className="text-emerald-400">{Math.round((analysis.maxVonMisesMpa + analysis.minVonMisesMpa) * 0.5 * 10) / 10}</span>
            <span className="text-cyan-300">{Math.round((analysis.maxVonMisesMpa * 0.25 + analysis.minVonMisesMpa * 0.75) * 10) / 10}</span>
            <span className="text-blue-400">{analysis.minVonMisesMpa} (Min)</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FeaMeshViewer3D;
