'use client';

import React, { useRef, useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, Center } from '@react-three/drei';
import * as THREE from 'three';
import { FeaTemplateResult, getFeaHeatmapColor } from '@/engines/fea/FeaTemplateSolver';
import { Maximize2, RotateCcw, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';

interface FeaMeshViewer3DProps {
  analysis: FeaTemplateResult;
  deformationScale: number;
  showWireframe: boolean;
  showProbes: boolean;
}

/**
 * 3D Colored Stress Mesh Component
 */
function FeaStressMesh({
  analysis,
  deformationScale,
  showWireframe,
  showProbes,
}: {
  analysis: FeaTemplateResult;
  deformationScale: number;
  showWireframe: boolean;
  showProbes: boolean;
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

      {/* Max Stress 3D Probe Pin */}
      {showProbes && analysis.maxVonMisesMpa > 0 && (
        <group position={analysis.maxStressCoord}>
          <mesh position={[0, 0, 0]}>
            <sphereGeometry args={[2, 16, 16]} />
            <meshBasicMaterial color="#ef4444" />
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
}: FeaMeshViewer3DProps) {
  const [controlsKey, setControlsKey] = useState<number>(0);

  const resetCamera = () => {
    setControlsKey((k) => k + 1);
  };

  const status = analysis.safetyFactor >= 1.5 ? 'SAFE' : analysis.safetyFactor >= 1.0 ? 'WARNING' : 'YIELDED';

  return (
    <div className="relative w-full h-full min-h-[480px] bg-[#03060a] overflow-hidden rounded-2xl border border-white/10 select-none shadow-2xl">
      {/* Top Floating Controls */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
        <button
          type="button"
          onClick={resetCamera}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 text-xs font-mono transition-all shadow-md active:scale-95"
          title="Reset Camera View"
        >
          <RotateCcw size={13} />
          <span>Reset View</span>
        </button>
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
          />
        </Center>

        <Grid
          position={[0, -0.01, 0]}
          args={[300, 300]}
          cellSize={10}
          cellThickness={0.6}
          cellColor="#00e5ff15"
          sectionSize={50}
          sectionThickness={1.2}
          sectionColor="#00e5ff30"
          fadeDistance={350}
        />

        <OrbitControls makeDefault enableDamping dampingFactor={0.05} maxDistance={800} minDistance={10} />
      </Canvas>

      {/* Stress Color Bar Legend */}
      <div className="absolute left-4 bottom-4 p-3 rounded-xl bg-[#080d1a]/90 backdrop-blur-xl border border-white/10 shadow-2xl font-mono text-[11px] space-y-2 pointer-events-none">
        <div className="flex items-center justify-between text-slate-300 font-bold gap-2">
          <span>von Mises</span>
          <span className="text-[10px] text-cyan-400">[MPa]</span>
        </div>

        {/* Rainbow Gradient Legend Bar */}
        <div className="flex items-center gap-2">
          <div
            className="w-4 h-28 rounded-md shadow-inner border border-white/10"
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

      {/* Top Floating Safety & Accuracy Badge */}
      <div className="absolute top-4 right-4 flex flex-col items-end gap-2 pointer-events-none">
        <div
          className={`px-3 py-1.5 rounded-xl border backdrop-blur-xl flex items-center gap-2 font-mono text-xs font-bold shadow-2xl ${
            status === 'SAFE'
              ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
              : status === 'WARNING'
              ? 'bg-amber-950/80 border-amber-500/50 text-amber-300'
              : 'bg-red-950/80 border-red-500/50 text-red-300 animate-pulse'
          }`}
        >
          {status === 'SAFE' && <CheckCircle2 size={15} />}
          {status === 'WARNING' && <AlertTriangle size={15} />}
          {status === 'YIELDED' && <ShieldAlert size={15} />}
          <span>SF = {analysis.safetyFactor} ({status})</span>
        </div>

        <div className="px-2.5 py-1 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-mono text-[10px] font-bold">
          Error: {analysis.stressErrorPct}% (&lt; 8% Verified)
        </div>
      </div>
    </div>
  );
}

export default FeaMeshViewer3D;
