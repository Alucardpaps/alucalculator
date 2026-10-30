'use client';

import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import Link from 'next/link';
import {
  Wrench,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  RotateCcw,
  Play,
  Pause,
  Layers,
  Sparkles,
  Sliders,
  ShieldCheck,
  Cpu,
  Lock,
  Boxes,
  CircleDot,
  Check,
} from 'lucide-react';
import { useI18nStore } from '@/store/i18nStore';
import { t12 } from '@/locales/t12';
import { useDesignStore } from '@/design-studio/designStore';

// ══════════════════════════════════════════════════════════════
// 3D Assembly Components (SolidWorks-Grade Parametric Models)
// ══════════════════════════════════════════════════════════════

// 1. Structural Plate with Drilled Clearance Hole
function PlateMesh({
  width = 80,
  depth = 80,
  thickness = 15,
  holeRadius = 4.5,
  yPos = 0,
  color = '#475569',
  label = 'Plate',
  isCounterbore = false,
}: {
  width?: number;
  depth?: number;
  thickness?: number;
  holeRadius?: number;
  yPos?: number;
  color?: string;
  label?: string;
  isCounterbore?: boolean;
}) {
  const geom = useMemo(() => {
    const shape = new THREE.Shape();
    const halfW = width / 2;
    const halfD = depth / 2;

    // Outer Rectangular Contour
    shape.moveTo(-halfW, -halfD);
    shape.lineTo(halfW, -halfD);
    shape.lineTo(halfW, halfD);
    shape.lineTo(-halfW, halfD);
    shape.closePath();

    // Clearance Hole in Center
    const holePath = new THREE.Path();
    holePath.absarc(0, 0, holeRadius, 0, Math.PI * 2, true);
    shape.holes.push(holePath);

    const extrudeSettings: THREE.ExtrudeGeometryOptions = {
      depth: thickness,
      bevelEnabled: true,
      bevelThickness: 0.8,
      bevelSize: 0.8,
      bevelSegments: 2,
    };

    const g = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    g.rotateX(Math.PI / 2); // Lay horizontal on X-Z plane
    return g;
  }, [width, depth, thickness, holeRadius]);

  return (
    <group position={[0, yPos, 0]}>
      <mesh geometry={geom} castShadow receiveShadow>
        <meshStandardMaterial
          color={color}
          metalness={0.85}
          roughness={0.25}
          envMapIntensity={1.2}
        />
      </mesh>
      {/* Edge Wireframe Highlighter */}
      <lineSegments>
        <edgesGeometry args={[geom, 25]} />
        <lineBasicMaterial color="#334155" linewidth={1} />
      </lineSegments>
    </group>
  );
}

// 2. ISO 4762 / DIN 912 Hex Socket Head Cap Screw
function BoltMesh({
  nominalSize = 8,
  length = 42,
  headDia = 13,
  headHeight = 8,
  position = [0, 0, 0] as [number, number, number],
  concentricOffset = [0, 0, 0] as [number, number, number],
  highlight = false,
}: {
  nominalSize?: number;
  length?: number;
  headDia?: number;
  headHeight?: number;
  position?: [number, number, number];
  concentricOffset?: [number, number, number];
  highlight?: boolean;
}) {
  const shankRadius = nominalSize / 2;
  const headRadius = headDia / 2;

  const headGeom = useMemo(() => {
    return new THREE.CylinderGeometry(headRadius, headRadius, headHeight, 32);
  }, [headRadius, headHeight]);

  const shankGeom = useMemo(() => {
    return new THREE.CylinderGeometry(shankRadius, shankRadius, length, 24);
  }, [shankRadius, length]);

  const socketGeom = useMemo(() => {
    return new THREE.CylinderGeometry(3.2, 3.2, 3.5, 6);
  }, []);

  const totalPos: [number, number, number] = [
    position[0] + concentricOffset[0],
    position[1] + concentricOffset[1],
    position[2] + concentricOffset[2],
  ];

  return (
    <group position={totalPos}>
      {/* Head */}
      <mesh geometry={headGeom} position={[0, headHeight / 2, 0]} castShadow>
        <meshStandardMaterial
          color={highlight ? '#38bdf8' : '#cbd5e1'}
          metalness={0.92}
          roughness={0.18}
        />
      </mesh>
      {/* Hex Socket Indentation */}
      <mesh geometry={socketGeom} position={[0, headHeight - 1.5, 0]}>
        <meshBasicMaterial color="#0f172a" />
      </mesh>
      {/* Shank */}
      <mesh geometry={shankGeom} position={[0, -length / 2, 0]} castShadow>
        <meshStandardMaterial
          color={highlight ? '#7dd3fc' : '#94a3b8'}
          metalness={0.88}
          roughness={0.25}
        />
      </mesh>
    </group>
  );
}

// 3. ISO 7089 Flat Washer
function WasherMesh({
  od = 16,
  id = 8.4,
  thickness = 1.6,
  position = [0, 0, 0] as [number, number, number],
  concentricOffset = [0, 0, 0] as [number, number, number],
}: {
  od?: number;
  id?: number;
  thickness?: number;
  position?: [number, number, number];
  concentricOffset?: [number, number, number];
}) {
  const geom = useMemo(() => {
    const shape = new THREE.Shape();
    shape.absarc(0, 0, od / 2, 0, Math.PI * 2, false);
    const hole = new THREE.Path();
    hole.absarc(0, 0, id / 2, 0, Math.PI * 2, true);
    shape.holes.push(hole);

    const g = new THREE.ExtrudeGeometry(shape, {
      depth: thickness,
      bevelEnabled: true,
      bevelThickness: 0.2,
      bevelSize: 0.2,
      bevelSegments: 2,
    });
    g.rotateX(Math.PI / 2);
    return g;
  }, [od, id, thickness]);

  return (
    <group position={[position[0] + concentricOffset[0], position[1] + concentricOffset[1], position[2] + concentricOffset[2]]}>
      <mesh geometry={geom} castShadow>
        <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.2} />
      </mesh>
    </group>
  );
}

// 4. ISO 4032 Hexagon Nut
function NutMesh({
  nominalSize = 8,
  height = 6.8,
  widthAcrossFlats = 13,
  position = [0, 0, 0] as [number, number, number],
  concentricOffset = [0, 0, 0] as [number, number, number],
}: {
  nominalSize?: number;
  height?: number;
  widthAcrossFlats?: number;
  position?: [number, number, number];
  concentricOffset?: [number, number, number];
}) {
  const outerRadius = widthAcrossFlats / Math.sqrt(3);

  const geom = useMemo(() => {
    const shape = new THREE.Shape();
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      const x = outerRadius * Math.cos(angle);
      const y = outerRadius * Math.sin(angle);
      if (i === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    }
    shape.closePath();

    const hole = new THREE.Path();
    hole.absarc(0, 0, nominalSize / 2, 0, Math.PI * 2, true);
    shape.holes.push(hole);

    const g = new THREE.ExtrudeGeometry(shape, {
      depth: height,
      bevelEnabled: true,
      bevelThickness: 0.4,
      bevelSize: 0.4,
      bevelSegments: 2,
    });
    g.rotateX(Math.PI / 2);
    return g;
  }, [outerRadius, height, nominalSize]);

  return (
    <group position={[position[0] + concentricOffset[0], position[1] + concentricOffset[1], position[2] + concentricOffset[2]]}>
      <mesh geometry={geom} castShadow>
        <meshStandardMaterial color="#64748b" metalness={0.9} roughness={0.22} />
      </mesh>
    </group>
  );
}

// 5. SolidWorks Mate Centerline & Coincident Visualizer
function MateGuides({
  concentricActive,
  coincidentActive,
  explodeY,
}: {
  concentricActive: boolean;
  coincidentActive: boolean;
  explodeY: number;
}) {
  const lineMesh = useMemo(() => {
    const pts = [
      new THREE.Vector3(0, 50 + explodeY, 0),
      new THREE.Vector3(0, -50 - explodeY, 0),
    ];
    const g = new THREE.BufferGeometry().setFromPoints(pts);
    const m = new THREE.LineDashedMaterial({
      color: '#38bdf8',
      dashSize: 2,
      gapSize: 1.5,
    });
    const line = new THREE.Line(g, m);
    line.computeLineDistances();
    return line;
  }, [explodeY]);

  const coincidentRingGeom = useMemo(() => {
    return new THREE.RingGeometry(5.5, 9, 32);
  }, []);

  return (
    <group>
      {/* Concentric Mating Axis Line */}
      {concentricActive && <primitive object={lineMesh} />}

      {/* Coincident Clamping Plane Ring */}
      {coincidentActive && (
        <mesh
          geometry={coincidentRingGeom}
          position={[0, 0.1, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <meshBasicMaterial
            color="#3dd68c"
            transparent
            opacity={0.65}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </group>
  );
}

// ══════════════════════════════════════════════════════════════
// Main 3D Scene Viewport
// ══════════════════════════════════════════════════════════════
function Assembly3DScene({
  isFastenerMounted,
  isConcentric,
  isCoincident,
  isNutClamped,
  explodeProgress,
}: {
  isFastenerMounted: boolean;
  isConcentric: boolean;
  isCoincident: boolean;
  isNutClamped: boolean;
  explodeProgress: number; // 0 to 1
}) {
  // Plate thickness & positions
  // Top Plate: y = 0 down to -15 (contact face at y = 0)
  // Bottom Plate: y = -15 down to -30 (bottom contact face at y = -30)
  // Total grip thickness: 30 mm

  // Explode translations along Y axis
  const boltExplode = explodeProgress * 45;
  const washerExplode = -explodeProgress * 25;
  const nutExplode = -explodeProgress * 45;

  // Unconstrained offsets when mate is toggled off
  const concentricOffsetBolt: [number, number, number] = isConcentric ? [0, 0, 0] : [14, 0, 8];
  const coincidentOffsetBolt: [number, number, number] = isCoincident ? [0, 0, 0] : [0, 16, 0];
  const nutClampedOffset: [number, number, number] = isNutClamped ? [0, 0, 0] : [0, -10, 0];

  const boltY = 0 + boltExplode + coincidentOffsetBolt[1];
  const washerY = -30.2 + washerExplode + nutClampedOffset[1];
  const nutY = -31.8 - 6.8 + nutExplode + nutClampedOffset[1];

  return (
    <>
      <PerspectiveCamera makeDefault position={[62, 34, 82]} fov={38} />
      <ambientLight intensity={0.75} color="#ffffff" />
      <directionalLight position={[60, 90, 50]} intensity={2.2} color="#f8fafc" castShadow />
      <directionalLight position={[-60, -40, -50]} intensity={1.2} color="#38bdf8" />
      <pointLight position={[0, 30, 20]} intensity={1.6} color="#38bdf8" />

      {/* Blueprint Grid */}
      <gridHelper
        args={[160, 20, '#0284c7', '#1e293b']}
        position={[0, -42, 0]}
      />

      {/* 1. Top Aluminum Plate (Al 6061-T6) */}
      <PlateMesh
        width={75}
        depth={75}
        thickness={15}
        holeRadius={4.5} // Ø9mm hole
        yPos={0}
        color="#94a3b8"
        label="Top Plate (15mm)"
      />

      {/* 2. Bottom Anodized Plate (Steel / Dark Al) */}
      <PlateMesh
        width={75}
        depth={75}
        thickness={15}
        holeRadius={4.5} // Ø9mm hole
        yPos={-15.1}
        color="#334155"
        label="Bottom Plate (15mm)"
      />

      {/* 3. Fastener Stack (Mounted via Smart Fasteners) */}
      {isFastenerMounted && (
        <group>
          {/* M8x40 Socket Head Bolt */}
          <BoltMesh
            nominalSize={8}
            length={42}
            headDia={13}
            headHeight={8}
            position={[0, boltY, 0]}
            concentricOffset={concentricOffsetBolt}
            highlight={isCoincident && isConcentric}
          />

          {/* ISO 7089 M8 Flat Washer */}
          <WasherMesh
            od={16}
            id={8.4}
            thickness={1.6}
            position={[0, washerY, 0]}
            concentricOffset={isConcentric ? [0, 0, 0] : [0, 0, 4]}
          />

          {/* ISO 4032 M8 Hex Nut */}
          <NutMesh
            nominalSize={8}
            height={6.8}
            widthAcrossFlats={13}
            position={[0, nutY, 0]}
            concentricOffset={isConcentric ? [0, 0, 0] : [0, 0, 4]}
          />

          {/* Mate Guides Visualizer (Concentric line & Coincident plane) */}
          <MateGuides
            concentricActive={isConcentric}
            coincidentActive={isCoincident}
            explodeY={boltExplode}
          />
        </group>
      )}

      <OrbitControls
        enableZoom={false}
        enablePan={false}
        rotateSpeed={0.8}
        autoRotate={false}
        maxPolarAngle={Math.PI / 2 + 0.15}
        minPolarAngle={Math.PI / 6}
      />
    </>
  );
}

// ══════════════════════════════════════════════════════════════
// Main Exported Showcase Component
// ══════════════════════════════════════════════════════════════
export function InteractiveAssemblyMatesShowcase() {
  const { language } = useI18nStore();

  // SolidWorks Mate State
  const [isFastenerMounted, setIsFastenerMounted] = useState(true);
  const [isConcentric, setIsConcentric] = useState(true);
  const [isCoincident, setIsCoincident] = useState(true);
  const [isNutClamped, setIsNutClamped] = useState(true);
  const [explodeProgress, setExplodeProgress] = useState(0); // 0 = clamped, 1 = fully exploded
  const [isAutoExploding, setIsAutoExploding] = useState(false);
  const [activeTab, setActiveTab] = useState<'mates' | 'fasteners' | 'vdi'>('fasteners');

  // Auto-explode animation loop
  useEffect(() => {
    let animId: number;
    let forward = true;
    if (isAutoExploding) {
      const step = () => {
        setExplodeProgress((prev) => {
          if (prev >= 1) forward = false;
          if (prev <= 0) forward = true;
          return forward ? Math.min(1, prev + 0.015) : Math.max(0, prev - 0.015);
        });
        animId = requestAnimationFrame(step);
      };
      animId = requestAnimationFrame(step);
    }
    return () => cancelAnimationFrame(animId);
  }, [isAutoExploding]);

  // Compute SolidWorks Degree of Freedom (DOF) Status
  const dofStatus = useMemo(() => {
    if (!isFastenerMounted) {
      return {
        label: t12(language, 'NO FASTENER MOUNTED', 'BAĞLANTI ELEMANI YOK'),
        color: 'text-slate-400 border-slate-700 bg-slate-900/40',
        dofCount: 6,
        badge: 'EMPTY',
      };
    }
    if (isConcentric && isCoincident && isNutClamped && explodeProgress === 0) {
      return {
        label: t12(language, 'FULLY DEFINED (SOLIDWORKS MATE OK)', 'TAM TANIMLI (SOLIDWORKS İLİŞKİSİ OK)'),
        color: 'text-[var(--ok)] border-[var(--ok)]/40 bg-[var(--ok)]/10',
        dofCount: 0,
        badge: 'FULLY DEFINED',
      };
    }
    if (isConcentric && !isCoincident) {
      return {
        label: t12(language, 'UNDER DEFINED (1 TRANSLATIONAL DOF FREE)', 'EKSİK TANIMLI (EKSENEL ÖTELEME SERBEST)'),
        color: 'text-[var(--warn)] border-[var(--warn)]/40 bg-[var(--warn)]/10',
        dofCount: 1,
        badge: 'UNDER DEFINED',
      };
    }
    if (!isConcentric && isCoincident) {
      return {
        label: t12(language, 'UNDER DEFINED (2 RADIAL DOFs FREE)', 'EKSİK TANIMLI (RADYAL KAYMA SERBEST)'),
        color: 'text-[var(--warn)] border-[var(--warn)]/40 bg-[var(--warn)]/10',
        dofCount: 2,
        badge: 'UNDER DEFINED',
      };
    }
    return {
      label: t12(language, 'UNCONSTRAINED (5 DOFs FREE)', 'İLİŞKİSİZ (5 SERBESTLİK DERECESİ)'),
      color: 'text-rose-400 border-rose-500/40 bg-rose-500/10',
      dofCount: 5,
      badge: 'UNCONSTRAINED',
    };
  }, [isFastenerMounted, isConcentric, isCoincident, isNutClamped, explodeProgress, language]);

  // Send to Design Studio
  const handleLaunchInStudio = () => {
    try {
      const store = useDesignStore.getState();
      // Inject the 2 plates and fastener into designStore
      store.pushHistory();
      useDesignStore.setState({
        projectName: 'Bolted_Flange_Assembly.sldasm',
        parts: [
          {
            id: 'demo-plate-top',
            kind: 'box',
            name: 'Top Flange Plate (15mm)',
            color: '#64748b',
            visible: true,
            locked: false,
            parentId: null,
            subAssemblyId: null,
            position: { x: 0, y: 7.5, z: 0 },
            rotation: { x: 0, y: 0, z: 0 },
            scale: { x: 1, y: 1, z: 1 },
            params: { width: 75, height: 15, depth: 75 },
            holes: [
              { id: 'h-top', size: 'M8', x: 37.5, y: 37.5, face: 'top', type: 'clearance', isThroughAll: true, depth: 15, diameter: 9.0 }
            ]
          },
          {
            id: 'demo-plate-bottom',
            kind: 'box',
            name: 'Bottom Base Plate (15mm Grounded)',
            color: '#334155',
            visible: true,
            locked: true,
            grounded: true,
            parentId: null,
            subAssemblyId: null,
            position: { x: 0, y: -7.5, z: 0 },
            rotation: { x: 0, y: 0, z: 0 },
            scale: { x: 1, y: 1, z: 1 },
            params: { width: 75, height: 15, depth: 75 },
            holes: [
              { id: 'h-bot', size: 'M8', x: 37.5, y: 37.5, face: 'top', type: 'clearance', isThroughAll: true, depth: 15, diameter: 9.0 }
            ]
          },
          {
            id: 'demo-bolt-m8',
            kind: 'hex-bolt',
            name: 'ISO 4762 M8×40 Hex Socket Bolt',
            color: '#cbd5e1',
            visible: true,
            locked: false,
            parentId: null,
            subAssemblyId: null,
            position: { x: 0, y: 15, z: 0 },
            rotation: { x: 0, y: 0, z: 0 },
            scale: { x: 1, y: 1, z: 1 },
            params: { diameter: 8, length: 42, headSize: 13, headHeight: 8 }
          },
          {
            id: 'demo-nut-m8',
            kind: 'hex-nut',
            name: 'ISO 4032 M8 Hex Nut',
            color: '#64748b',
            visible: true,
            locked: false,
            parentId: null,
            subAssemblyId: null,
            position: { x: 0, y: -20, z: 0 },
            rotation: { x: 0, y: 0, z: 0 },
            scale: { x: 1, y: 1, z: 1 },
            params: { innerDiameter: 8, headSize: 13, depth: 6.8 }
          }
        ],
        selectedId: 'demo-bolt-m8'
      });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <section className="relative w-full rounded-[var(--radius-l)] border border-[var(--line)] bg-[var(--bg-1)] overflow-hidden shadow-2xl font-mono select-none">
      {/* ─── SECTION TOP HEADER ─── */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-3 border-b border-[var(--line)] bg-[var(--bg-2)]">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-[var(--radius-s)] bg-[var(--cyan)]/15 border border-[var(--cyan)]/30 text-[var(--cyan)]">
            <Boxes size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[var(--ink)]">
                {t12(language, 'SolidWorks-Style 3D Assembly & Smart Fasteners', 'SolidWorks Tipi 3D Montaj İlişkileri ve Otomatik Civata Montajı')}
              </h2>
              <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[8.5px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                SOLIDWORKS 2026 MATE ENGINE
              </span>
            </div>
            <p className="text-[10px] text-[var(--alu-dim)] font-mono">
              {t12(
                language,
                'Autonomous coaxial hole detection, ISO fastener sizing, concentric & coincident constraint solver.',
                'Otonom eşmerkezli delik tespiti, ISO bağlantı elemanı boyutlandırma, çakışık ve eşmerkezli montaj ilişkisi çözücü.'
              )}
            </p>
          </div>
        </div>

        {/* Global DOF Indicator */}
        <div className={`px-2.5 py-1 rounded-[var(--radius-s)] border flex items-center gap-2 text-[10px] font-bold shadow-xs ${dofStatus.color}`}>
          <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
          <span>{dofStatus.label}</span>
          <span className="px-1 py-0.2 rounded bg-black/40 text-[9px] font-mono">
            {dofStatus.dofCount} DOF
          </span>
        </div>
      </div>

      {/* ─── WORKSPACE CONTENT: 3D VIEWPORT + SOLIDWORKS MATE CONTROLLER ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[460px]">
        {/* LEFT / CENTER: 3D WEBGL ASSEMBLY VIEWPORT (7 COLS) */}
        <div className="lg:col-span-7 relative bg-[var(--bg-0)] border-b lg:border-b-0 lg:border-r border-[var(--line)] flex flex-col justify-between overflow-hidden">
          {/* Viewport Top Bar */}
          <div className="relative z-10 p-3 flex flex-wrap items-center justify-between gap-2 bg-[var(--bg-1)]/80 border-b border-[var(--line)] text-[10px]">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-bold">ASSEMBLY:</span>
              <span className="text-cyan-300 font-bold">Bolted_Lap_Joint.sldasm</span>
              <span className="text-slate-500">|</span>
              <span className="text-slate-300">Grip: 30mm (2×15mm)</span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setIsConcentric(true);
                  setIsCoincident(true);
                  setIsNutClamped(true);
                  setExplodeProgress(0);
                  setIsFastenerMounted(true);
                }}
                className="px-2 py-0.5 rounded bg-[var(--bg-2)] hover:bg-[var(--bg-3)] border border-[var(--line)] text-slate-300 hover:text-white flex items-center gap-1 text-[9px] transition"
                title={t12(language, 'Reset Assembly Position', 'Montajı Sıfırla')}
              >
                <RotateCcw size={10} />
                <span>{t12(language, 'Reset', 'Sıfırla')}</span>
              </button>
            </div>
          </div>

          {/* Canvas 3D */}
          <div className="w-full h-[320px] sm:h-[380px] lg:h-full relative">
            <Canvas
              shadows
              dpr={[1, 2]}
              gl={{
                antialias: true,
                toneMapping: THREE.ACESFilmicToneMapping,
                toneMappingExposure: 1.15,
              }}
            >
              <Assembly3DScene
                isFastenerMounted={isFastenerMounted}
                isConcentric={isConcentric}
                isCoincident={isCoincident}
                isNutClamped={isNutClamped}
                explodeProgress={explodeProgress}
              />
            </Canvas>

            {/* Orbit Hint */}
            <div className="absolute bottom-2 left-3 pointer-events-none text-[9px] text-slate-500 font-mono">
              [ ↺ Orbit: Sol Tıkla Döndür · Scroll: Yakınlaş ]
            </div>
          </div>

          {/* Viewport Bottom Explode Slider Bar */}
          <div className="relative z-10 p-3 bg-[var(--bg-1)]/90 border-t border-[var(--line)] flex flex-wrap items-center justify-between gap-3 text-[10px]">
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <span className="text-slate-400 font-bold shrink-0 flex items-center gap-1">
                <Sliders size={11} className="text-amber-400" />
                <span>{t12(language, 'Explode View:', 'Patlatma Görünümü:')}</span>
              </span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={explodeProgress}
                onChange={(e) => {
                  setExplodeProgress(parseFloat(e.target.value));
                  if (isAutoExploding) setIsAutoExploding(false);
                }}
                className="w-full h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-[var(--cyan)]"
              />
              <span className="text-amber-300 font-bold w-10 text-right">
                {Math.round(explodeProgress * 100)}%
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsAutoExploding(!isAutoExploding)}
              className={`px-2.5 py-1 rounded-[var(--radius-s)] text-[9px] font-bold border flex items-center gap-1.5 transition ${
                isAutoExploding
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
                  : 'bg-[var(--bg-2)] text-slate-300 border-[var(--line)] hover:text-white'
              }`}
            >
              {isAutoExploding ? <Pause size={10} /> : <Play size={10} />}
              <span>{isAutoExploding ? t12(language, 'Pause', 'Durdur') : t12(language, 'Play Explode', 'Animasyon')}</span>
            </button>
          </div>
        </div>

        {/* RIGHT: SOLIDWORKS MATE CONTROLLER & SMART FASTENERS PANEL (5 COLS) */}
        <div className="lg:col-span-5 p-4 sm:p-5 flex flex-col justify-between space-y-4 bg-[var(--bg-1)]">
          {/* Sub-Tabs: Smart Fasteners | Mates | VDI 2230 */}
          <div className="space-y-3">
            <div className="flex items-center bg-[var(--bg-0)] p-0.5 rounded-[var(--radius-s)] border border-[var(--line)] text-[10px]">
              <button
                type="button"
                onClick={() => setActiveTab('fasteners')}
                className={`flex-1 py-1.5 rounded-[var(--radius-s)] font-bold transition flex items-center justify-center gap-1 ${
                  activeTab === 'fasteners'
                    ? 'bg-[var(--cyan)] text-black shadow-xs font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sparkles size={11} />
                <span>Smart Fasteners</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('mates')}
                className={`flex-1 py-1.5 rounded-[var(--radius-s)] font-bold transition flex items-center justify-center gap-1 ${
                  activeTab === 'mates'
                    ? 'bg-[var(--cyan)] text-black shadow-xs font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Layers size={11} />
                <span>{t12(language, 'Mates', 'İlişkiler')}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('vdi')}
                className={`flex-1 py-1.5 rounded-[var(--radius-s)] font-bold transition flex items-center justify-center gap-1 ${
                  activeTab === 'vdi'
                    ? 'bg-[var(--cyan)] text-black shadow-xs font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <ShieldCheck size={11} />
                <span>VDI 2230</span>
              </button>
            </div>

            {/* ─── TAB 1: SOLIDWORKS SMART FASTENERS ─── */}
            {activeTab === 'fasteners' && (
              <div className="space-y-3 animate-in fade-in">
                {/* Auto Detection Telemetry Card */}
                <div className="p-3 rounded-[var(--radius-s)] bg-[var(--bg-2)] border border-[var(--line)] space-y-2 text-[10.5px]">
                  <div className="flex items-center justify-between text-[9px] text-[var(--alu-dim)] uppercase tracking-wider">
                    <span>// HOLE WIZARD FEATURE STACK</span>
                    <span className="text-emerald-400 font-bold">MATCH FOUND</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div className="bg-[var(--bg-0)] p-2 rounded border border-[var(--line)]">
                      <div className="text-[8.5px] text-slate-400">STACK THICKNESS</div>
                      <div className="font-bold text-white text-[12px]">30.0 mm</div>
                      <div className="text-[8px] text-slate-500">2× 15mm Plates</div>
                    </div>
                    <div className="bg-[var(--bg-0)] p-2 rounded border border-[var(--line)]">
                      <div className="text-[8.5px] text-slate-400">CLEARANCE HOLE</div>
                      <div className="font-bold text-cyan-300 text-[12px]">Ø 9.0 mm</div>
                      <div className="text-[8px] text-slate-500">ISO 273 (Fine)</div>
                    </div>
                  </div>

                  {/* Standard Hardware Bill of Material */}
                  <div className="space-y-1.5 pt-1 border-t border-[var(--line)] text-[9.5px]">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300 font-bold">1. Bolt:</span>
                      <span className="text-white font-mono bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-500/30">
                        ISO 4762 M8×40 - 8.8
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300 font-bold">2. Washer:</span>
                      <span className="text-white font-mono bg-slate-800 px-1.5 py-0.5 rounded border border-white/10">
                        ISO 7089 M8 Form A (200 HV)
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300 font-bold">3. Nut:</span>
                      <span className="text-white font-mono bg-slate-800 px-1.5 py-0.5 rounded border border-white/10">
                        ISO 4032 M8 Hexagon Nut (Cl. 8)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Smart Fastener Action Button */}
                <button
                  type="button"
                  onClick={() => setIsFastenerMounted(!isFastenerMounted)}
                  className={`w-full py-2.5 px-3 rounded-[var(--radius-s)] font-bold text-xs flex items-center justify-center gap-2 transition shadow-md cursor-pointer ${
                    isFastenerMounted
                      ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40'
                      : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black '
                  }`}
                >
                  <Sparkles size={13} />
                  <span>
                    {isFastenerMounted
                      ? t12(language, 'Remove Fastener Stack (Unmount)', 'Bağlantı Elemanlarını Sök')
                      : t12(language, '⚡ Auto-Insert Smart Fastener (Mount)', '⚡ Otomatik Bağlantı Elemanı Montajla')}
                  </span>
                </button>
              </div>
            )}

            {/* ─── TAB 2: SOLIDWORKS MATE CONTROLLER ─── */}
            {activeTab === 'mates' && (
              <div className="space-y-2 animate-in fade-in text-[10.5px]">
                {/* Mate 1: Concentric (Eşmerkezli) */}
                <div
                  className={`p-2.5 rounded-[var(--radius-s)] border transition-all ${
                    isConcentric
                      ? 'bg-cyan-950/20 border-cyan-500/40 text-cyan-200'
                      : 'bg-[var(--bg-0)] border-[var(--line)] text-slate-500'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <CircleDot size={13} className={isConcentric ? 'text-cyan-400' : 'text-slate-500'} />
                      <span className="font-bold text-white text-[11px]">
                        {t12(language, 'Concentric Mate 1', 'Eşmerkezli İlişki 1')}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsConcentric(!isConcentric)}
                      className={`px-2 py-0.5 rounded text-[8.5px] font-bold border transition ${
                        isConcentric
                          ? 'bg-[var(--cyan)] text-[var(--accent-ink)] font-black'
                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                      }`}
                    >
                      {isConcentric ? t12(language, 'Active', 'Aktif') : t12(language, 'Suppressed', 'Askıda')}
                    </button>
                  </div>
                  <div className="text-[8.5px] text-slate-400 mt-1 space-y-0.5">
                    <div>• Axis A: Plate_Clearance_Hole.Axis</div>
                    <div>• Axis B: Bolt_M8_Shank.Centerline</div>
                    <div className="text-cyan-400 font-mono">
                      Δr = {isConcentric ? '0.000 mm (Aligned)' : '16.124 mm (Misaligned)'}
                    </div>
                  </div>
                </div>

                {/* Mate 2: Coincident (Çakışık) */}
                <div
                  className={`p-2.5 rounded-[var(--radius-s)] border transition-all ${
                    isCoincident
                      ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-200'
                      : 'bg-[var(--bg-0)] border-[var(--line)] text-slate-500'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Layers size={13} className={isCoincident ? 'text-emerald-400' : 'text-slate-500'} />
                      <span className="font-bold text-white text-[11px]">
                        {t12(language, 'Coincident Mate 2', 'Çakışık İlişki 2')}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsCoincident(!isCoincident)}
                      className={`px-2 py-0.5 rounded text-[8.5px] font-bold border transition ${
                        isCoincident
                          ? 'bg-[var(--cyan)] text-[var(--accent-ink)] font-black'
                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                      }`}
                    >
                      {isCoincident ? t12(language, 'Active', 'Aktif') : t12(language, 'Suppressed', 'Askıda')}
                    </button>
                  </div>
                  <div className="text-[8.5px] text-slate-400 mt-1 space-y-0.5">
                    <div>• Face A: Plate_Top.Upper_Surface (z = +15.0mm)</div>
                    <div>• Face B: Bolt_Head.Bearing_Face</div>
                    <div className="text-emerald-400 font-mono">
                      Δz = {isCoincident ? '0.000 mm (Flushed)' : '16.000 mm (Gap)'}
                    </div>
                  </div>
                </div>

                {/* Mate 3: Clamping Nut Coincident */}
                <div
                  className={`p-2.5 rounded-[var(--radius-s)] border transition-all ${
                    isNutClamped
                      ? 'bg-purple-950/20 border-purple-500/40 text-purple-200'
                      : 'bg-[var(--bg-0)] border-[var(--line)] text-slate-500'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Lock size={13} className={isNutClamped ? 'text-purple-400' : 'text-slate-500'} />
                      <span className="font-bold text-white text-[11px]">
                        {t12(language, 'Clamp Coincident Mate 3', 'Sıkma Çakışık İlişkisi 3')}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsNutClamped(!isNutClamped)}
                      className={`px-2 py-0.5 rounded text-[8.5px] font-bold border transition ${
                        isNutClamped
                          ? 'bg-[var(--cyan)] text-[var(--accent-ink)] font-black'
                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                      }`}
                    >
                      {isNutClamped ? t12(language, 'Active', 'Aktif') : t12(language, 'Suppressed', 'Askıda')}
                    </button>
                  </div>
                  <div className="text-[8.5px] text-slate-400 mt-1 space-y-0.5">
                    <div>• Face A: Plate_Bottom.Lower_Face (z = -15.0mm)</div>
                    <div>• Face B: Washer + Nut_M8.Bearing_Face</div>
                  </div>
                </div>
              </div>
            )}

            {/* ─── TAB 3: VDI 2230 TELEMETRY ─── */}
            {activeTab === 'vdi' && (
              <div className="space-y-2.5 animate-in fade-in text-[10.5px]">
                <div className="p-3 rounded-[var(--radius-s)] bg-[var(--bg-2)] border border-[var(--line)] space-y-2">
                  <div className="flex items-center justify-between text-[8.5px] text-[var(--alu-dim)] uppercase">
                    <span>VDI 2230 BLATT 1 TIGHTENING TELEMETRY</span>
                    <span className="text-emerald-400 font-bold">PASS (S_F ≥ 1.2)</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div className="bg-[var(--bg-0)] p-2 rounded border border-[var(--line)]">
                      <div className="text-[8px] text-slate-400">TIGHTENING TORQUE (M_A)</div>
                      <div className="text-[13px] font-bold text-amber-300">24.5 N·m</div>
                      <div className="text-[7.5px] text-slate-500">μ_tot = 0.12 (Zinc Flake)</div>
                    </div>
                    <div className="bg-[var(--bg-0)] p-2 rounded border border-[var(--line)]">
                      <div className="text-[8px] text-slate-400">ASSEMBLY PRELOAD (F_M)</div>
                      <div className="text-[13px] font-bold text-cyan-300">18.2 kN</div>
                      <div className="text-[7.5px] text-slate-500">90% of ReL Yield</div>
                    </div>
                  </div>

                  <div className="text-[8.5px] text-slate-400 pt-1 border-t border-[var(--line)]">
                    Joint compliance: δ_P = 0.42 μm/kN, δ_S = 1.15 μm/kN. No separation under working load.
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ─── CTA: LAUNCH FULL 3D STUDIO WITH THIS MATED ASSEMBLY ─── */}
          <div className="pt-2 border-t border-[var(--line)]">
            <Link
              href="/design-studio"
              onClick={handleLaunchInStudio}
              className="w-full h-10 px-4 rounded-[var(--radius-s)] bg-[var(--cyan)] hover:bg-[var(--cyan)] text-[var(--bg-0)] font-tech font-bold text-xs tracking-wider flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Boxes size={15} />
              <span>{t12(language, 'Open in 3D CAD Studio with Mates', 'Montaj İlişkileri ile 3D Stüdyoda Aç')}</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default InteractiveAssemblyMatesShowcase;
