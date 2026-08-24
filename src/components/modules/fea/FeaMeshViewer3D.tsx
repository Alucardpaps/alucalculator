'use client';

import React, { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, Html, Center } from '@react-three/drei';
import * as THREE from 'three';
import { FeaAnalysisResult, getStressHeatmapRgb } from '@/engines/fea/StlFeaSolver';
import { Layers, Maximize2, RotateCcw, AlertTriangle, CheckCircle2, ShieldAlert, Sparkles, Upload } from 'lucide-react';

interface FeaMeshViewer3DProps {
  analysis: FeaAnalysisResult;
  deformationScale: number;
  showWireframe: boolean;
  showProbes: boolean;
  onDropStlFile?: (buffer: ArrayBuffer, fileName: string) => void;
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
  analysis: FeaAnalysisResult;
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
      const [r, g, b] = getStressHeatmapRgb(stress, minStress, maxStress);
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
        <group position={analysis.maxStressNodeCoord}>
          <mesh position={[0, 0, 0]}>
            <sphereGeometry args={[2, 16, 16]} />
            <meshStandardMaterial color="#ef4444" emissive="#ff0000" emissiveIntensity={0.8} />
          </mesh>
          <Html position={[0, 8, 0]} center distanceFactor={150}>
            <div className="px-2 py-1 rounded-md bg-red-950/90 border border-red-500/80 text-white font-mono text-[10px] whitespace-nowrap shadow-xl flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />
              <span>MAX: {analysis.maxVonMisesMpa} MPa</span>
            </div>
          </Html>
        </group>
      )}

      {/* Min Stress 3D Probe Pin */}
      {showProbes && (
        <group position={analysis.minStressNodeCoord}>
          <mesh position={[0, 0, 0]}>
            <sphereGeometry args={[1.5, 16, 16]} />
            <meshStandardMaterial color="#3b82f6" emissive="#00e5ff" emissiveIntensity={0.5} />
          </mesh>
          <Html position={[0, 6, 0]} center distanceFactor={150}>
            <div className="px-1.5 py-0.5 rounded-md bg-blue-950/90 border border-blue-500/80 text-cyan-200 font-mono text-[9px] whitespace-nowrap shadow-lg">
              MIN: {analysis.minVonMisesMpa} MPa
            </div>
          </Html>
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
  onDropStlFile,
}: FeaMeshViewer3DProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (!onDropStlFile) return;

    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.stl') || file.name.endsWith('.STL'))) {
      const buffer = await file.arrayBuffer();
      onDropStlFile(buffer, file.name);
    }
  };

  return (
    <div
      className="relative w-full h-full min-h-[480px] bg-[#03060a] overflow-hidden select-none border border-white/5 rounded-2xl"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* 3D WebGL Canvas */}
      <Canvas
        camera={{ position: [120, 100, 150], fov: 45 }}
        shadows
        className="w-full h-full cursor-grab active:cursor-grabbing"
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[150, 200, 150]} intensity={1.2} castShadow />
        <directionalLight position={[-100, -100, -100]} intensity={0.4} />

        <Center top>
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

      {/* Drag & Drop Upload Overlay */}
      {isDragging && (
        <div className="absolute inset-0 bg-cyan-950/80 backdrop-blur-md flex flex-col items-center justify-center border-2 border-dashed border-cyan-400 z-50 animate-pulse">
          <Upload size={48} className="text-cyan-300 mb-2" />
          <p className="font-mono text-sm font-bold text-white">Drop 3D CAD STL File for FEA Stress Analysis</p>
          <p className="font-mono text-xs text-cyan-200 mt-1">Supports Binary & ASCII .stl formats</p>
        </div>
      )}

      {/* Stress Color Bar Legend */}
      <div className="absolute left-4 bottom-4 p-3 rounded-xl bg-[#080d1a]/90 backdrop-blur-xl border border-white/10 shadow-2xl font-mono text-[11px] space-y-2 pointer-events-none">
        <div className="flex items-center justify-between text-slate-300 font-bold gap-2">
          <span>von Mises (Beta)</span>
          <span className="text-[10px] text-cyan-400">[MPa]</span>
        </div>

        {/* Rainbow Gradient Legend Bar */}
        <div className="flex items-center gap-2">
          <div
            className="w-4 h-32 rounded-md shadow-inner border border-white/10"
            style={{
              background: 'linear-gradient(to bottom, #ef4444 0%, #eab308 30%, #10b981 60%, #06b6d4 80%, #3b82f6 100%)',
            }}
          />
          <div className="flex flex-col justify-between h-32 text-[10px] text-slate-300">
            <span className="text-red-400 font-bold">{analysis.maxVonMisesMpa} (Peak)</span>
            <span className="text-amber-300">{Math.round((analysis.maxVonMisesMpa * 0.75 + analysis.minVonMisesMpa * 0.25) * 10) / 10}</span>
            <span className="text-emerald-400">{Math.round(analysis.avgVonMisesMpa * 10) / 10} (Avg)</span>
            <span className="text-cyan-300">{Math.round((analysis.maxVonMisesMpa * 0.25 + analysis.minVonMisesMpa * 0.75) * 10) / 10}</span>
            <span className="text-blue-400">{analysis.minVonMisesMpa} (Min)</span>
          </div>
        </div>
      </div>

      {/* Top Floating Safety Badge */}
      <div className="absolute top-4 right-4 flex items-center gap-2 pointer-events-none">
        <div
          className={`px-3 py-1.5 rounded-xl border backdrop-blur-xl flex items-center gap-2 font-mono text-xs font-bold shadow-2xl ${
            analysis.status === 'SAFE'
              ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
              : analysis.status === 'WARNING'
              ? 'bg-amber-950/80 border-amber-500/50 text-amber-300'
              : 'bg-red-950/80 border-red-500/50 text-red-300 animate-pulse'
          }`}
        >
          {analysis.status === 'SAFE' && <CheckCircle2 size={16} />}
          {analysis.status === 'WARNING' && <AlertTriangle size={16} />}
          {analysis.status === 'CRITICAL' && <ShieldAlert size={16} />}
          <span>SF = {analysis.safetyFactor} ({analysis.status} · Beta)</span>
        </div>
      </div>
    </div>
  );
}
export default FeaMeshViewer3D;
