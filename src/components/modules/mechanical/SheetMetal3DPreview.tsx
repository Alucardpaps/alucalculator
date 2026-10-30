'use client';

/**
 * SheetMetal3DPreview — Interactive 3D Sheet Metal Solid, Cutout Sünme (Deformation)
 * & Press Brake Bending Simulation Tool.
 *
 * Complies with AluCalc Instrument Design System & Performance Guardrails:
 *  - Three.js geometry memoized via useMemo keyed to spec + unfoldProgress01
 *  - Visual Upper Punch (Üst Bıçak) & Lower V-Die (Alt V-Kalıp) tooling
 *  - Realistic plastic strain hole deformation ("sünme" / ovalization) visualization
 *  - Press brake collision & optimal sequencing warnings
 *  - Zero external font fetches (<Html> overlays only, zero <Text>)
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import {
  Play,
  Pause,
  RotateCcw,
  Eye,
  Layers,
  Sparkles,
  Wrench,
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import {
  SheetMetalSpec,
  SheetMetalCutout,
  SheetMetalEdgeType,
  buildSheetMetal3DGeometry,
  calculateSheetMetalAnalysis,
  analyzeAllCutoutsDeformation,
  calculatePressBrakeFeasibility,
  calculateCutoutFlatCoordinates,
  computeSheetMetalContour2D,
  HoleDeformationResult,
  PressBrakeFeasibility,
} from '@/design-studio/sheetMetalEngine';

/* ─── 3D Press Brake Tooling (Upper Punch & Lower V-Die) ─────────────────── */

interface PressBrakeToolingProps {
  scaleFactor: number;
  lengthMm: number;
  dieVMm: number;
  punchStroke01: number; // 0 = fully raised, 1 = fully pressed into V-die
  hasCollision: boolean;
  visible: boolean;
}

function PressBrakeTooling({
  scaleFactor,
  lengthMm,
  dieVMm,
  punchStroke01,
  hasCollision,
  visible,
}: PressBrakeToolingProps) {
  if (!visible) return null;

  const toolLength = Math.max(lengthMm * 1.15, 60);
  const dieHeight = 45;
  const punchHeight = 65;

  // Punch stroke travel: from Y = +55 down to Y = +4 (contacting sheet)
  const punchY = 55 - punchStroke01 * 51;

  return (
    <group scale={[scaleFactor, scaleFactor, scaleFactor]}>
      {/* ─── LOWER V-DIE (Alt V-Kalıp) ─── */}
      <group position={[0, -dieHeight / 2 - 1, 0]}>
        {/* Die Body */}
        <mesh position={[0, 0, 0]} receiveShadow>
          <boxGeometry args={[dieVMm * 3.5, dieHeight, toolLength]} />
          <meshStandardMaterial
            color="#334155"
            metalness={0.75}
            roughness={0.35}
          />
        </mesh>

        {/* V-Groove chamfer visual rails */}
        <mesh position={[0, dieHeight / 2 - dieVMm * 0.35, 0]}>
          <boxGeometry args={[dieVMm, dieVMm * 0.7, toolLength + 2]} />
          <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.4} />
        </mesh>

        {/* Die Label Badge */}
        <Html position={[dieVMm * 1.9, 0, 0]} center style={{ pointerEvents: 'none' }}>
          <div className="px-1.5 py-0.5 rounded bg-[var(--bg-1)]/90 border border-slate-700 text-[9px] font-mono text-slate-300 whitespace-nowrap shadow">
            ALT V-KALIP (V{Math.round(dieVMm)})
          </div>
        </Html>
      </group>

      {/* ─── UPPER PUNCH (Üst Bıçak) ─── */}
      <group position={[0, punchY, 0]}>
        {/* Punch Blade Body */}
        <mesh position={[0, punchHeight / 2, 0]} castShadow>
          <boxGeometry args={[18, punchHeight, toolLength]} />
          <meshStandardMaterial
            color={hasCollision ? '#ef4444' : '#64748b'}
            metalness={0.85}
            roughness={0.25}
          />
        </mesh>

        {/* Hardened 88° Punch Tip Wedge */}
        <mesh position={[0, 0, 0]}>
          <coneGeometry args={[4.5, 9, 4]} />
          <meshStandardMaterial
            color={hasCollision ? '#b91c1c' : '#f59e0b'}
            metalness={0.9}
            roughness={0.2}
          />
        </mesh>

        {/* Punch Tooling Badge */}
        <Html position={[15, punchHeight / 2, 0]} center style={{ pointerEvents: 'none' }}>
          <div
            className={`px-1.5 py-0.5 rounded border text-[9px] font-mono font-bold whitespace-nowrap shadow ${
              hasCollision
                ? 'bg-red-950 border-red-500 text-red-300 animate-pulse'
                : 'bg-[var(--bg-1)]/90 border-amber-500/50 text-amber-300'
            }`}
          >
            {hasCollision ? '⚠️ ÇARPIŞMA (COLLISION)!' : 'ÜST BIÇAK (88° R1.5)'}
          </div>
        </Html>
      </group>
    </group>
  );
}

/* ─── Cutout & Sünme (Ovalization) 3D Perforations ────────────────────────── */

interface CutoutsOverlayProps {
  spec: SheetMetalSpec;
  deformations: HoleDeformationResult[];
  scaleFactor: number;
  unfoldProgress01: number;
  onApplyRemedy?: (remedyType: 'relief_slit' | 'offset_safe' | 'pre_compensate' | 'post_bend', cutoutId: string) => void;
  isTr?: boolean;
}

function CutoutsOverlay({
  spec,
  deformations,
  scaleFactor,
  unfoldProgress01,
  onApplyRemedy,
  isTr = true,
}: CutoutsOverlayProps) {
  const [expandedCutoutId, setExpandedCutoutId] = useState<string | null>(null);

  const contour = useMemo(() => computeSheetMetalContour2D(spec, unfoldProgress01, 14), [spec, unfoldProgress01]);
  const cx = (contour.bounds.minX + contour.bounds.maxX) / 2;
  const cy = (contour.bounds.minY + contour.bounds.maxY) / 2;
  const analysis = useMemo(() => calculateSheetMetalAnalysis(spec), [spec]);

  if (!spec.cutouts || spec.cutouts.length === 0) return null;

  return (
    <group scale={[scaleFactor, scaleFactor, scaleFactor]}>
      {spec.cutouts.map((cutout, idx) => {
        const def = deformations[idx];
        const isDeformed = def && def.riskLevel !== 'SAFE';
        const isSevere = def && def.riskLevel === 'SEVERE_TEARING';
        const hasReliefSlit = cutout.reliefSlit?.enabled;

        // Approximate position on folded or unfolded mesh
        const { flatX, flatY } = calculateCutoutFlatCoordinates(spec, cutout);
        // Interpolate along the 2D contour at normalized progress
        const contourIdx = Math.min(
          contour.midlinePoints.length - 1,
          Math.max(0, Math.round((flatX / Math.max(1, analysis.totalFlatLengthMm)) * (contour.midlinePoints.length - 1)))
        );
        const midPt = contour.midlinePoints[contourIdx] || { x: flatX, y: 0 };
        const posX = midPt.x - cx;
        const posY = midPt.y - cy + (spec.thickness / 2) * 1.05;
        const posZ = flatY - spec.length / 2;

        const dia = cutout.diameter || cutout.width || 8;
        const majorDia = isDeformed ? def.deformedMajorMm : dia;
        const minorDia = isDeformed ? def.deformedMinorMm : dia;

        return (
          <group key={cutout.id || idx} position={[posX, posY, posZ]}>
            {/* Visual Perforation Rim Wireframe */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <ringGeometry args={[Math.max(0.1, minorDia / 2 - 0.35), majorDia / 2 + 0.35, 24]} />
              <meshBasicMaterial
                color={hasReliefSlit ? '#22c55e' : isSevere ? '#ef4444' : isDeformed ? '#f59e0b' : '#38bdf8'}
                side={THREE.DoubleSide}
              />
            </mesh>

            {/* Visual Laser Relief Slit Preview if Active */}
            {hasReliefSlit && (
              <mesh position={[-((dia / 2) + 2), 0, 0]}>
                <boxGeometry args={[1, spec.thickness * 1.2, dia + 4]} />
                <meshBasicMaterial color="#22c55e" />
              </mesh>
            )}

            {/* Sünme Warning Callout in 3D: Compact Pin by Default, Expands on Click */}
            {isDeformed && (
              <Html position={[0, spec.thickness + 5, 0]} center style={{ pointerEvents: 'auto' }}>
                {expandedCutoutId === cutout.id ? (
                  <div
                    className={`p-2 rounded-lg text-[9.5px] font-mono border whitespace-nowrap shadow-2xl flex flex-col gap-1.5 animate-in fade-in zoom-in-95 ${
                      isSevere
                        ? 'bg-[var(--bg-1)]/98 border-red-500 text-red-200'
                        : 'bg-[var(--bg-1)]/98 border-amber-500 text-amber-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 font-bold">
                      <div className="flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                        <span>Sünme: +%{def.elongationPercent} ({majorDia}x{minorDia}mm)</span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedCutoutId(null);
                        }}
                        className="text-slate-400 hover:text-white px-1 text-xs cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>

                    {onApplyRemedy && (
                      <div className="flex items-center gap-1 pt-1 border-t border-slate-700/60">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onApplyRemedy('relief_slit', cutout.id);
                            setExpandedCutoutId(null);
                          }}
                          className="px-1.5 py-0.5 rounded bg-emerald-950 hover:bg-emerald-800 border border-emerald-500/80 text-[8.5px] font-bold text-emerald-200 cursor-pointer shadow"
                          title={isTr ? 'Lazer Rahatlatma Yarığı Ekle' : 'Add Laser Relief Slit'}
                        >
                          ⚡ {isTr ? 'Yarık Aç' : 'Add Slit'}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onApplyRemedy('offset_safe', cutout.id);
                            setExpandedCutoutId(null);
                          }}
                          className="px-1.5 py-0.5 rounded bg-cyan-950 hover:bg-cyan-800 border border-cyan-500/80 text-[8.5px] font-bold text-cyan-200 cursor-pointer shadow"
                          title={isTr ? 'Güvenli Mesafeye Ötele' : 'Shift to Safe Distance'}
                        >
                          📐 {isTr ? 'Ötele' : 'Shift'}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onApplyRemedy('pre_compensate', cutout.id);
                            setExpandedCutoutId(null);
                          }}
                          className="px-1.5 py-0.5 rounded bg-violet-950 hover:bg-violet-800 border border-violet-500/80 text-[8.5px] font-bold text-violet-200 cursor-pointer shadow"
                          title={isTr ? 'Açınımda Ters Kompanzasyon Uygula' : 'Apply Inverted Pre-compensation'}
                        >
                          🔄 {isTr ? 'Ters Komp.' : 'Pre-Comp'}
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedCutoutId(cutout.id);
                    }}
                    className={`px-1.5 py-0.5 rounded-full border text-[8.5px] font-mono font-bold flex items-center gap-1 shadow-lg hover:scale-105 transition-all cursor-pointer whitespace-nowrap ${
                      isSevere
                        ? 'bg-red-950/90 border-red-500 text-red-200 animate-pulse'
                        : 'bg-amber-950/90 border-amber-500 text-amber-200'
                    }`}
                    title={isTr ? 'Sünme detaylarını ve çözüm önerilerini aç' : 'Click to view deformation remedies'}
                  >
                    <AlertTriangle className="w-3 h-3 text-amber-400" />
                    <span>▲ %{def.elongationPercent}</span>
                  </button>
                )}
              </Html>
            )}
          </group>
        );
      })}
    </group>
  );
}

/* ─── Main Sheet Metal Mesh ──────────────────────────────────────────────── */

interface SheetMetalMeshProps {
  spec: SheetMetalSpec;
  unfoldProgress01: number;
  wireframe: boolean;
  showDimensions: boolean;
  showEdgeHandles?: boolean;
  deformations: HoleDeformationResult[];
  onSelectEdge?: (flangeIndex: number, edge: SheetMetalEdgeType) => void;
  onApplyRemedy?: (remedyType: 'relief_slit' | 'offset_safe' | 'pre_compensate' | 'post_bend', cutoutId: string) => void;
  isTr?: boolean;
}

function SheetMetalMesh({
  spec,
  unfoldProgress01,
  wireframe,
  showDimensions,
  showEdgeHandles = true,
  deformations,
  onSelectEdge,
  onApplyRemedy,
  isTr = true,
}: SheetMetalMeshProps) {
  const { solidGeo, edgesGeo, bboxSize } = useMemo(() => {
    const geom = buildSheetMetal3DGeometry(spec, unfoldProgress01);
    const edges = new THREE.EdgesGeometry(geom, 18);
    geom.computeBoundingBox();
    const box = geom.boundingBox || new THREE.Box3();
    const size = new THREE.Vector3();
    box.getSize(size);
    return { solidGeo: geom, edgesGeo: edges, bboxSize: size };
  }, [spec, unfoldProgress01]);

  useEffect(() => {
    return () => {
      solidGeo.dispose();
      edgesGeo.dispose();
    };
  }, [solidGeo, edgesGeo]);

  const maxDim = Math.max(bboxSize.x, bboxSize.y, bboxSize.z, 50);
  const scaleFactor = 5.2 / maxDim;

  return (
    <>
      <group scale={[scaleFactor, scaleFactor, scaleFactor]}>
        <mesh geometry={solidGeo} castShadow receiveShadow>
          <meshStandardMaterial
            color={spec.color || '#38bdf8'}
            metalness={0.62}
            roughness={0.28}
            wireframe={wireframe}
            side={THREE.DoubleSide}
          />
        </mesh>
        <lineSegments geometry={edgesGeo}>
          <lineBasicMaterial color="#e2e8f0" transparent opacity={0.75} />
        </lineSegments>

        {showDimensions && (
          <>
            <Html
              position={[0, bboxSize.y / 2 + maxDim * 0.08, 0]}
              center
              style={{ pointerEvents: 'none' }}
            >
              <div className="px-2 py-0.5 rounded bg-[var(--bg-0)]/95 border border-cyan-500/40 text-[10px] font-mono font-bold text-cyan-300 whitespace-nowrap shadow">
                X: {bboxSize.x.toFixed(1)} mm
              </div>
            </Html>

            <Html
              position={[bboxSize.x / 2 + maxDim * 0.08, 0, 0]}
              center
              style={{ pointerEvents: 'none' }}
            >
              <div className="px-2 py-0.5 rounded bg-[var(--bg-0)]/95 border border-violet-500/40 text-[10px] font-mono font-bold text-violet-300 whitespace-nowrap shadow">
                Y: {bboxSize.y.toFixed(1)} mm
              </div>
            </Html>

            <Html
              position={[0, -bboxSize.y / 2 - maxDim * 0.08, bboxSize.z / 2]}
              center
              style={{ pointerEvents: 'none' }}
            >
              <div className="px-2 py-0.5 rounded bg-[var(--bg-0)]/95 border border-amber-500/40 text-[10px] font-mono font-bold text-amber-300 whitespace-nowrap shadow">
                L: {spec.length.toFixed(0)} mm (t={spec.thickness}mm)
              </div>
            </Html>
          </>
        )}

        {/* Free Edge Selection 3D Interactive Handles & Curved Mould Warning */}
        {onSelectEdge && showEdgeHandles && (
          <group>
            {/* Base Flange F0: Front (side_a, 1. Resimdeki Beyaz Ok!) */}
            <Html
              position={[0, bboxSize.y / 2 + maxDim * 0.05, -bboxSize.z / 2]}
              center
              style={{ pointerEvents: 'auto' }}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectEdge(0, 'side_a');
                }}
                className="group px-2 py-0.5 rounded bg-[var(--bg-0)]/95 hover:bg-cyan-950 border border-cyan-400 hover:border-cyan-300 text-[9px] font-mono font-bold text-cyan-300 flex items-center gap-1 shadow-2xl transition-all cursor-pointer whitespace-nowrap active:scale-95"
                title={isTr ? 'F0 Ön Yan Kenardan Büküm Ekle' : 'Add Bend on F0 Front Edge'}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                <span>📐 {isTr ? 'F0: Ön Kenar +' : 'F0: Front +'}</span>
              </button>
            </Html>

            {/* Base Flange F0: Rear (side_b) */}
            <Html
              position={[0, bboxSize.y / 2 + maxDim * 0.05, bboxSize.z / 2]}
              center
              style={{ pointerEvents: 'auto' }}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectEdge(0, 'side_b');
                }}
                className="group px-2 py-0.5 rounded bg-[var(--bg-0)]/90 hover:bg-slate-800 border border-slate-600 hover:border-cyan-400 text-[9px] font-mono text-slate-200 flex items-center gap-1 shadow-lg transition-all cursor-pointer whitespace-nowrap active:scale-95"
                title={isTr ? 'F0 Arka Yan Kenardan Büküm Ekle' : 'Add Bend on F0 Rear Edge'}
              >
                <span>➕ {isTr ? 'F0: Arka Kenar' : 'F0: Rear'}</span>
              </button>
            </Html>

            {/* Base Flange F0: Start (start) */}
            <Html
              position={[-bboxSize.x / 2 - maxDim * 0.05, 0, 0]}
              center
              style={{ pointerEvents: 'auto' }}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectEdge(0, 'start');
                }}
                className="group px-2 py-0.5 rounded bg-[var(--bg-0)]/90 hover:bg-slate-800 border border-slate-600 hover:border-cyan-400 text-[9px] font-mono text-slate-200 flex items-center gap-1 shadow-lg transition-all cursor-pointer whitespace-nowrap active:scale-95"
                title={isTr ? 'Taban Sacı Başlangıç Kenarından Büküm Ekle' : 'Add Bend on Base Start Edge'}
              >
                <span>➕ {isTr ? 'F0: Başlangıç' : 'F0: Start'}</span>
              </button>
            </Html>

            {/* Active Flanges Tip Edges */}
            <Html
              position={[bboxSize.x / 2 + maxDim * 0.05, bboxSize.y / 2, 0]}
              center
              style={{ pointerEvents: 'auto' }}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  const targetIdx = spec.bends.length > 0 ? spec.bends.length : 0;
                  onSelectEdge(targetIdx, 'end');
                }}
                className="group px-2 py-0.5 rounded bg-[var(--bg-0)]/90 hover:bg-slate-800 border border-slate-600 hover:border-cyan-400 text-[9px] font-mono text-slate-200 flex items-center gap-1 shadow-lg transition-all cursor-pointer whitespace-nowrap active:scale-95"
                title={isTr ? 'Uç Kenardan Büküm Ekle' : 'Add Bend on Tip Edge'}
              >
                <span>➕ {isTr ? `F${spec.bends.length}: Uç Kenar` : `F${spec.bends.length}: Tip Edge`}</span>
              </button>
            </Html>

            {/* Radius / Curved Edge Bend (Derin Çekme / Pres Kalıbı Uyarılı Kase Bükümü) */}
            <Html
              position={[bboxSize.x / 4, bboxSize.y / 2 + maxDim * 0.1, -bboxSize.z / 2]}
              center
              style={{ pointerEvents: 'auto' }}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  const targetIdx = spec.bends.length > 0 ? spec.bends.length : 0;
                  onSelectEdge(targetIdx, 'radius_curved');
                }}
                className="group px-2.5 py-1 rounded bg-[var(--bg-2)]/95 hover:bg-amber-950 border border-amber-500/80 hover:border-amber-400 text-[9.5px] font-mono font-bold text-amber-300 flex items-center gap-1.5 shadow-2xl transition-all cursor-pointer whitespace-nowrap active:scale-95"
                title={isTr ? 'Kavisli / Radius Kenar Bükümü Ekle (Derin Çekme Pres Kalıbı Gerektirir)' : 'Add Curved / Radius Edge Bend (Requires Stamping Die)'}
              >
                <span>🌟 🥣 {isTr ? 'Radius/Kase Bükümü' : 'Curved/Bowl Bend'}</span>
                <span className="text-[8px] px-1 rounded bg-amber-500/20 text-amber-200 border border-amber-500/40">
                  {isTr ? '⚠️ Kalıp Şart' : '⚠️ Mould Req'}
                </span>
              </button>
            </Html>
          </group>
        )}

        {/* 2. Resim: Kısmi Büküm (y, z, x) 3B Ölçülendirme Etiketleri */}
        {showDimensions &&
          spec.bends.map((bend, bIdx) => {
            if (bend.widthMode !== 'partial') return null;
            const availLen = spec.length;
            const y = bend.offsetStart ?? 0;
            const z = bend.flangeWidth ?? Math.round(availLen * 0.7);
            const x = bend.offsetEnd ?? Math.max(0, availLen - y - z);

            const zY = -availLen / 2 + y / 2;
            const zZ = -availLen / 2 + y + z / 2;
            const zX = -availLen / 2 + y + z + x / 2;
            const badgeY = bboxSize.y / 2 + maxDim * 0.12 + bIdx * (maxDim * 0.08);

            return (
              <group key={`partial-annot-${bIdx}`}>
                {/* y: Sol Boşluk */}
                {y > 0.5 && (
                  <Html position={[0, badgeY, zY]} center style={{ pointerEvents: 'none' }}>
                    <div className="px-1.5 py-0.5 rounded bg-amber-950/95 border border-amber-500/70 text-[9px] font-mono font-bold text-amber-300 whitespace-nowrap shadow-lg">
                      y: {y.toFixed(0)}mm ({isTr ? 'sol' : 'left'})
                    </div>
                  </Html>
                )}

                {/* z: Büküm Genişliği (2. Resim) */}
                <Html position={[0, badgeY, zZ]} center style={{ pointerEvents: 'none' }}>
                  <div className="px-2 py-0.5 rounded bg-cyan-950/95 border-2 border-cyan-400 text-[10px] font-mono font-black text-cyan-200 whitespace-nowrap shadow-2xl flex items-center gap-1">
                    <span>✂️ z: {z.toFixed(0)}mm</span>
                    <span className="text-[8.5px] font-normal text-cyan-300">
                      ({isTr ? 'Büküm Genişliği' : 'Flange Width'})
                    </span>
                  </div>
                </Html>

                {/* x: Sağ Boşluk */}
                {x > 0.5 && (
                  <Html position={[0, badgeY, zX]} center style={{ pointerEvents: 'none' }}>
                    <div className="px-1.5 py-0.5 rounded bg-emerald-950/95 border border-emerald-500/70 text-[9px] font-mono font-bold text-emerald-300 whitespace-nowrap shadow-lg">
                      x: {x.toFixed(0)}mm ({isTr ? 'sağ' : 'right'})
                    </div>
                  </Html>
                )}
              </group>
            );
          })}
      </group>

      {/* Stamped Holes & Plastic Sünme Overlays */}
      <CutoutsOverlay
        spec={spec}
        deformations={deformations}
        scaleFactor={scaleFactor}
        unfoldProgress01={unfoldProgress01}
        onApplyRemedy={onApplyRemedy}
        isTr={isTr}
      />
    </>
  );
}

/* ─── Main Preview Viewport Component ────────────────────────────────────── */

export interface SheetMetal3DPreviewProps {
  spec: SheetMetalSpec;
  lang?: string;
  compact?: boolean;
  onSendToStudio?: () => void;
  onDownloadDXF?: () => void;
  onSelectEdge?: (flangeIndex: number, edge: SheetMetalEdgeType) => void;
  onApplyRemedy?: (remedyType: 'relief_slit' | 'offset_safe' | 'pre_compensate' | 'post_bend', cutoutId: string) => void;
}

export function SheetMetal3DPreview({
  spec,
  lang = 'tr',
  compact = false,
  onSendToStudio,
  onDownloadDXF,
  onSelectEdge,
  onApplyRemedy,
}: SheetMetal3DPreviewProps) {
  const isTr = lang === 'tr';
  const [viewMode, setViewMode] = useState<'free_part' | 'press_brake'>('free_part');
  const [unfoldPct, setUnfoldPct] = useState<number>(0); // 0 = Folded, 100 = Flat
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playDirection, setPlayDirection] = useState<1 | -1>(1);
  const [wireframe, setWireframe] = useState<boolean>(false);
  const [showDimensions, setShowDimensions] = useState<boolean>(true);
  const [showEdgeHandles, setShowEdgeHandles] = useState<boolean>(true);

  // Press Brake Simulation state
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(0);
  const [isPressBrakeSimulating, setIsPressBrakeSimulating] = useState<boolean>(false);
  const [punchStroke01, setPunchStroke01] = useState<number>(0);

  const analysis = useMemo(() => calculateSheetMetalAnalysis(spec), [spec]);
  const deformations = useMemo(() => analyzeAllCutoutsDeformation(spec), [spec]);
  const feasibility = useMemo(() => calculatePressBrakeFeasibility(spec), [spec]);

  const activeStep = feasibility.steps[currentStepIdx] || feasibility.steps[0];
  const stepCollision = activeStep?.collisionWarning;

  // Unfolding animation loop
  useEffect(() => {
    if (!isPlaying || viewMode === 'press_brake') return;
    let rafId: number;
    let lastTime = performance.now();

    const step = (now: number) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;
      setUnfoldPct((prev) => {
        const next = prev + playDirection * dt * 45;
        if (next >= 100) {
          setPlayDirection(-1);
          return 100;
        }
        if (next <= 0) {
          setPlayDirection(1);
          return 0;
        }
        return next;
      });
      rafId = requestAnimationFrame(step);
    };

    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [isPlaying, playDirection, viewMode]);

  // Press Brake Stroke & Sequence Simulation Loop
  useEffect(() => {
    if (!isPressBrakeSimulating || viewMode !== 'press_brake') return;

    let rafId: number;
    let phase: 'down' | 'hold' | 'up' | 'advance' = 'down';
    let progress = 0;
    let lastTime = performance.now();

    const strokeLoop = (now: number) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      if (phase === 'down') {
        progress += dt * 1.4; // punch descending
        setPunchStroke01(Math.min(1, progress));
        if (progress >= 1) {
          progress = 0;
          phase = 'hold';
        }
      } else if (phase === 'hold') {
        progress += dt * 2.0; // clamp & dwell
        if (progress >= 1) {
          progress = 0;
          phase = 'up';
        }
      } else if (phase === 'up') {
        progress += dt * 1.4; // punch retracting
        setPunchStroke01(Math.max(0, 1 - progress));
        if (progress >= 1) {
          progress = 0;
          phase = 'advance';
        }
      } else if (phase === 'advance') {
        progress += dt * 1.5; // sheet repositioning to next step
        if (progress >= 1) {
          progress = 0;
          phase = 'down';
          setCurrentStepIdx((prev) => (prev + 1) % Math.max(1, feasibility.steps.length));
        }
      }

      rafId = requestAnimationFrame(strokeLoop);
    };

    rafId = requestAnimationFrame(strokeLoop);
    return () => cancelAnimationFrame(rafId);
  }, [isPressBrakeSimulating, viewMode, feasibility.steps.length]);

  return (
    <div className="relative w-full h-full flex flex-col bg-[var(--bg-0)] rounded-lg border border-slate-800 overflow-hidden select-none">
      {/* Top Instrument Bar */}
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-slate-800/90 bg-[var(--bg-0)] flex-wrap z-10">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-[11px] font-mono font-black uppercase tracking-wider text-slate-200">
            {isTr ? '3B SAC LEVHA & ABKANT SİMÜLATÖRÜ' : '3D SHEET METAL & PRESS BRAKE SIMULATOR'}
          </span>

          {/* Mode Switcher */}
          <div className="flex items-center gap-1 bg-[var(--bg-1)] p-0.5 rounded border border-slate-800">
            <button
              type="button"
              onClick={() => {
                setViewMode('free_part');
                setIsPressBrakeSimulating(false);
              }}
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-colors ${
                viewMode === 'free_part'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {isTr ? '🧊 Serbest Katı' : '🧊 Free Solid'}
            </button>
            <button
              type="button"
              onClick={() => {
                setViewMode('press_brake');
                setIsPlaying(false);
              }}
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold flex items-center gap-1 transition-colors ${
                viewMode === 'press_brake'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Wrench className="w-3 h-3 text-amber-400" />
              {isTr ? '🚜 Abkant Pres Büküm' : '🚜 Press Brake Tool'}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowDimensions((v) => !v)}
            className={`px-2 py-1 rounded text-[10px] font-mono font-bold border transition-colors flex items-center gap-1 ${
              showDimensions
                ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Eye className="w-3 h-3" />
            {isTr ? 'Ölçüler' : 'Dims'}
          </button>

          <button
            type="button"
            onClick={() => setWireframe((v) => !v)}
            className={`px-2 py-1 rounded text-[10px] font-mono font-bold border transition-colors flex items-center gap-1 ${
              wireframe
                ? 'bg-violet-500/15 border-violet-500/40 text-violet-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3 h-3" />
            {isTr ? 'Tel Kafes' : 'Wire'}
          </button>

          {onSelectEdge && (
            <button
              type="button"
              onClick={() => setShowEdgeHandles((v) => !v)}
              className={`px-2 py-1 rounded text-[10px] font-mono font-bold border transition-colors flex items-center gap-1 cursor-pointer ${
                showEdgeHandles
                  ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
              title={isTr ? '3D Kenar Büküm Butonlarını Göster / Gizle' : 'Toggle 3D Edge Selection Buttons'}
            >
              <span>📐</span>
              {isTr ? 'Kenar Butonları' : 'Edge Pins'}
            </button>
          )}

          {onDownloadDXF && (
            <button
              type="button"
              onClick={onDownloadDXF}
              className="px-2.5 py-1 rounded text-[10px] font-mono font-black border bg-emerald-500/15 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25 transition-colors"
            >
              {isTr ? '📐 Düz DXF' : '📐 Flat DXF'}
            </button>
          )}

          {onSendToStudio && (
            <button
              type="button"
              onClick={onSendToStudio}
              className="px-2.5 py-1 rounded text-[10px] font-mono font-black border bg-cyan-500/20 border-cyan-400/50 text-cyan-200 hover:bg-cyan-500/30 transition-colors flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3 text-cyan-300" />
              {isTr ? "3B Stüdyo'da Aç" : 'Studio'}
            </button>
          )}
        </div>
      </div>

      {/* 3D Canvas Viewport */}
      <div className="relative flex-1 min-h-[260px] w-full">
        <Canvas
          camera={{ position: [4.8, 3.8, 6.2], fov: 38 }}
          gl={{ antialias: true, preserveDrawingBuffer: true }}
        >
          <color attach="background" args={['#05080d']} />
          <ambientLight intensity={0.75} />
          <directionalLight position={[8, 14, 8]} intensity={1.35} />
          <directionalLight position={[-8, -6, -5]} intensity={0.45} color="#38bdf8" />
          <gridHelper args={[16, 16, '#1e293b', '#0f172a']} position={[0, -2.4, 0]} />

          <SheetMetalMesh
            spec={spec}
            unfoldProgress01={unfoldPct / 100}
            wireframe={wireframe}
            showDimensions={showDimensions}
            showEdgeHandles={showEdgeHandles}
            deformations={deformations}
            onSelectEdge={onSelectEdge}
            onApplyRemedy={onApplyRemedy}
            isTr={isTr}
          />

          <PressBrakeTooling
            scaleFactor={5.2 / Math.max(spec.length, 60)}
            lengthMm={spec.length}
            dieVMm={feasibility.recommendedDieV}
            punchStroke01={punchStroke01}
            hasCollision={Boolean(stepCollision)}
            visible={viewMode === 'press_brake'}
          />

          <OrbitControls
            makeDefault
            enableDamping
            dampingFactor={0.08}
            minDistance={2}
            maxDistance={22}
          />
        </Canvas>

        {/* Press Brake Collision Hazard Banner */}
        {viewMode === 'press_brake' && stepCollision && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 max-w-lg px-3 py-1.5 rounded-lg bg-red-950/95 border-2 border-red-500 text-red-200 font-mono text-[10.5px] font-bold shadow-2xl flex items-center gap-2 animate-bounce">
            <ShieldAlert className="w-5 h-5 text-red-400 shrink-0" />
            <div>
              <div className="uppercase tracking-wider font-black text-red-300">
                ⚠️ ABKANT ÇARPIŞMASI / BÜKÜLEMEZ UYARISI!
              </div>
              <div className="text-[10px] text-red-200 font-normal">{stepCollision}</div>
            </div>
          </div>
        )}

        {/* Live Telemetry Overlay (Top Left) */}
        {!compact && (
          <div className="absolute top-2.5 left-2.5 pointer-events-none bg-[var(--bg-0)]/90 border border-slate-800 rounded px-2.5 py-1.5 space-y-0.5 text-[10px] font-mono z-10">
            <div className="text-slate-400">
              {isTr ? 'Açınım Boyu (L_flat):' : 'Flat Blank:'}{' '}
              <span className="text-cyan-300 font-bold">{analysis.totalFlatLengthMm.toFixed(2)} mm</span>
            </div>
            <div className="text-slate-400">
              {isTr ? 'Sac Ağırlığı:' : 'Part Mass:'}{' '}
              <span className="text-emerald-300 font-bold">{analysis.massKg.toFixed(3)} kg</span>
            </div>
            <div className="text-slate-400">
              {isTr ? 'Abkant Tonajı:' : 'Press Force:'}{' '}
              <span className="text-amber-300 font-bold">{analysis.maxTonnage.toFixed(2)} ton</span>
            </div>
            {deformations.some((d) => d.riskLevel !== 'SAFE') && (
              <div className="text-amber-400 font-bold pt-0.5">
                {isTr ? '⚠️ Delik Sünmesi Tespit Edildi!' : '⚠️ Hole Distortion Detected!'}
              </div>
            )}
          </div>
        )}

        {/* State Badge (Top Right) */}
        <div className="absolute top-2.5 right-2.5 pointer-events-none z-10">
          <span
            className={`px-2 py-0.5 rounded border text-[10px] font-mono font-bold ${
              viewMode === 'press_brake'
                ? 'bg-amber-950/90 border-amber-500/50 text-amber-300'
                : unfoldPct < 5
                ? 'bg-cyan-950/80 border-cyan-500/40 text-cyan-300'
                : unfoldPct > 95
                ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300'
                : 'bg-violet-950/80 border-violet-500/40 text-violet-300'
            }`}
          >
            {viewMode === 'press_brake'
              ? isTr
                ? `ABKANT PRES: ADIM ${currentStepIdx + 1}/${feasibility.steps.length}`
                : `PRESS BRAKE: STEP ${currentStepIdx + 1}/${feasibility.steps.length}`
              : unfoldPct < 5
              ? isTr
                ? 'BÜKÜLMÜŞ 3B KATI (%0)'
                : 'FOLDED 3D SOLID (0%)'
              : unfoldPct > 95
              ? isTr
                ? 'DÜZ SAC AÇINIMI (%100)'
                : 'FLAT BLANK PATTERN (100%)'
              : isTr
              ? `AÇINIM SİMÜLASYONU (%${Math.round(unfoldPct)})`
              : `UNFOLDING (${Math.round(unfoldPct)}%)`}
          </span>
        </div>
      </div>

      {/* Bottom Controls Bar */}
      {viewMode === 'free_part' ? (
        /* Standard 0-100% Unfold Scrubber */
        <div className="flex items-center gap-3 px-3 py-2 border-t border-slate-800 bg-[var(--bg-0)]">
          <button
            type="button"
            onClick={() => setIsPlaying((p) => !p)}
            className={`px-2.5 py-1 rounded text-[10px] font-mono font-black uppercase border flex items-center gap-1 transition-colors shrink-0 ${
              isPlaying
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                : 'bg-cyan-500/15 border-cyan-500/35 text-cyan-300 hover:bg-cyan-500/25'
            }`}
          >
            {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            {isPlaying ? (isTr ? 'Durdur' : 'Pause') : isTr ? 'Katla / Aç Simüle Et' : 'Animate'}
          </button>

          <button
            type="button"
            onClick={() => {
              setIsPlaying(false);
              setUnfoldPct(0);
            }}
            className="px-2 py-1 rounded text-[10px] font-mono font-bold bg-slate-900 border border-slate-800 text-slate-400 hover:text-white shrink-0"
          >
            {isTr ? '3B Katlı' : 'Folded'}
          </button>

          <div className="flex-1 flex items-center gap-2">
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={unfoldPct}
              onChange={(e) => {
                setIsPlaying(false);
                setUnfoldPct(Number(e.target.value));
              }}
              className="w-full accent-[var(--cyan)] cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
            <span className="text-[11px] font-mono font-bold text-cyan-300 w-10 text-right">
              {Math.round(unfoldPct)}%
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              setIsPlaying(false);
              setUnfoldPct(100);
            }}
            className="px-2 py-1 rounded text-[10px] font-mono font-bold bg-slate-900 border border-slate-800 text-slate-400 hover:text-white shrink-0"
          >
            {isTr ? 'Düz Açınım' : 'Flat'}
          </button>

          <button
            type="button"
            onClick={() => {
              setIsPlaying(false);
              setUnfoldPct(0);
            }}
            className="p-1 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-white shrink-0"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
      ) : (
        /* Dedicated Press Brake Step-by-Step Bending Sequence Player */
        <div className="flex items-center justify-between gap-3 px-3 py-2 border-t border-slate-800 bg-[var(--bg-0)] flex-wrap">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setCurrentStepIdx((p) =>
                  p === 0 ? Math.max(0, feasibility.steps.length - 1) : p - 1
                );
              }}
              className="p-1 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
              title={isTr ? 'Önceki Büküm Adımı' : 'Previous Bend'}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="text-[11px] font-mono font-bold text-amber-300 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30">
              {isTr
                ? `BÜKÜM #${activeStep?.bendIndex} (${activeStep?.angleDeg}° ${
                    activeStep?.direction === 'up' ? 'YUKARI' : 'AŞAĞI'
                  })`
                : `BEND #${activeStep?.bendIndex} (${activeStep?.angleDeg}° ${activeStep?.direction})`}
            </span>

            <button
              type="button"
              onClick={() => {
                setCurrentStepIdx((p) => (p + 1) % Math.max(1, feasibility.steps.length));
              }}
              className="p-1 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
              title={isTr ? 'Sonraki Büküm Adımı' : 'Next Bend'}
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setIsPressBrakeSimulating((s) => !s)}
              className={`px-2.5 py-1 rounded text-[10px] font-mono font-black uppercase border flex items-center gap-1 transition-colors ${
                isPressBrakeSimulating
                  ? 'bg-amber-500/25 border-amber-500/50 text-amber-300'
                  : 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/30'
              }`}
            >
              {isPressBrakeSimulating ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              {isPressBrakeSimulating
                ? isTr
                  ? 'Bükümü Durdur'
                  : 'Pause'
                : isTr
                ? 'Abkant Büküm Simüle Et'
                : 'Simulate Press'}
            </button>
          </div>

          {/* Optimal Sequence Pill Bar */}
          <div className="flex items-center gap-1.5 text-[10px] font-mono">
            <span className="text-slate-500">{isTr ? 'En Mantıklı Sıra:' : 'Optimal Order:'}</span>
            <div className="flex items-center gap-1">
              {feasibility.optimalSequence.map((bIdx, sIdx) => (
                <button
                  key={sIdx}
                  type="button"
                  onClick={() => setCurrentStepIdx(sIdx)}
                  className={`px-1.5 py-0.5 rounded text-[9.5px] font-bold border transition-colors ${
                    sIdx === currentStepIdx
                      ? 'bg-amber-500/25 border-amber-500 text-amber-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  B{bIdx}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SheetMetal3DPreview;
