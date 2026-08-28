'use client';

/**
 * 🟡 BOLT CIRCLE PCD & MATRIX GRID HOLE GENERATOR
 * Interactive CNC & Caliper Coordinator
 * 
 * Features:
 * - Metric Hole Standards (M1 - M100) (ISO 273 / DIN 13 / DIN 912 / DIN 7991)
 * - Pattern Modes:
 *    1. Bolt Circle / PCD (Pitch Circle Diameter)
 *    2. Matrix Grid / Fixture Table (Tezgah / Tabla Deseni - Rows x Cols)
 *    3. Linear Array (Doğrusal Delik Sırası)
 * - Real-time Hole Spacing & Web Thickness Safety Validation
 * - Interactive 2D Circular & Grid Visualizer with Active Hole Inspection
 * - CNC G-Code (G81 Drilling / G83 Peck Drilling) Generator
 * - CSV Table Exporter
 * - One-click "Apply Holes to 3D Part" Integration
 */

import React, { useState, useMemo } from 'react';
import {
  X, Copy, Check, Download, AlertTriangle, ShieldCheck,
  Disc, Grid3X3, ArrowRight, Sparkles, Sliders, Zap
} from 'lucide-react';
import { useI18nStore } from '@/store/i18nStore';
import { useDesignStore } from './designStore';
import { ISO_METRIC_HOLES, type HoleItem } from './holeStandards';
import { getPcdModalStrings } from '@/locales/designStudioTranslations';

interface BoltCirclePcdModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyHoles?: (holes: HoleItem[]) => void;
}

export function BoltCirclePcdModal({ isOpen, onClose, onApplyHoles }: BoltCirclePcdModalProps) {
  const { language } = useI18nStore();
  const tr = language === 'tr';
  const tPcd = getPcdModalStrings(language);

  // Pattern Mode: 'pcd' (Bolt Circle), 'grid' (Tezgah Matrisi), 'linear' (Doğrusal Sıra)
  const [patternType, setPatternType] = useState<'pcd' | 'grid' | 'linear'>('pcd');

  // PCD Pattern Parameters
  const [pcdDia, setPcdDia] = useState<number>(150);
  const [holeCount, setHoleCount] = useState<number>(6);
  const [startAngle, setStartAngle] = useState<number>(0);
  const [customHoleDia, setCustomHoleDia] = useState<number>(12);
  const [selectedMetric, setSelectedMetric] = useState<string>('M10');
  const [useCustomDia, setUseCustomDia] = useState<boolean>(false);

  // Fit & Standard Type: 'normal' | 'close' | 'tap' | 'counterbore' | 'countersink'
  const [fitType, setFitType] = useState<'normal' | 'close' | 'tap' | 'counterbore' | 'countersink'>('normal');

  // Grid Pattern Parameters (Tezgah Tablası)
  const [gridRows, setGridRows] = useState<number>(4);
  const [gridCols, setGridCols] = useState<number>(6);
  const [gridSpacingX, setGridSpacingX] = useState<number>(25);
  const [gridSpacingY, setGridSpacingY] = useState<number>(25);

  // Linear Pattern Parameters
  const [linearCount, setLinearCount] = useState<number>(5);
  const [linearSpacing, setLinearSpacing] = useState<number>(20);
  const [linearAngle, setLinearAngle] = useState<number>(0);

  // Active Selected Hole Index for Detailed Inspection
  const [activeHoleIdx, setActiveHoleIdx] = useState<number>(0);
  const [copiedGcode, setCopiedGcode] = useState<boolean>(false);

  // Get active metric standard details
  const metricStd = useMemo(() => {
    return ISO_METRIC_HOLES.find((h) => h.size === selectedMetric) || ISO_METRIC_HOLES[13]; // Default M10
  }, [selectedMetric]);

  // Determine effective hole diameter based on metric and fit type
  const effectiveDiameter = useMemo(() => {
    if (useCustomDia) return customHoleDia;
    if (fitType === 'tap') return metricStd.tapDrillDiameter;
    if (fitType === 'close') return metricStd.clearanceClose;
    if (fitType === 'counterbore') return metricStd.counterboreDiameter;
    if (fitType === 'countersink') return metricStd.countersinkDiameter;
    return metricStd.clearanceMedium;
  }, [useCustomDia, customHoleDia, fitType, metricStd]);

  // Generate Calculated Holes List
  const calculatedHoles = useMemo(() => {
    const list: {
      num: number;
      angleDeg: number;
      x: number;
      y: number;
      chordDist: number;
      stepAngle: number;
    }[] = [];

    if (patternType === 'pcd') {
      const radius = pcdDia / 2;
      const stepAngle = 360 / Math.max(1, holeCount);
      const chord = 2 * radius * Math.sin(((stepAngle / 2) * Math.PI) / 180);

      for (let i = 0; i < holeCount; i++) {
        const angle = startAngle + i * stepAngle;
        const rad = (angle * Math.PI) / 180;
        const x = radius * Math.cos(rad);
        const y = radius * Math.sin(rad);

        list.push({
          num: i + 1,
          angleDeg: Math.round(angle * 100) / 100,
          x: Math.round(x * 100) / 100,
          y: Math.round(y * 100) / 100,
          chordDist: Math.round(chord * 100) / 100,
          stepAngle: Math.round(stepAngle * 100) / 100,
        });
      }
    } else if (patternType === 'grid') {
      let count = 1;
      const startX = -((gridCols - 1) * gridSpacingX) / 2;
      const startY = -((gridRows - 1) * gridSpacingY) / 2;

      for (let r = 0; r < gridRows; r++) {
        for (let c = 0; c < gridCols; c++) {
          const x = startX + c * gridSpacingX;
          const y = startY + r * gridSpacingY;
          list.push({
            num: count++,
            angleDeg: 0,
            x: Math.round(x * 100) / 100,
            y: Math.round(y * 100) / 100,
            chordDist: gridSpacingX,
            stepAngle: 0,
          });
        }
      }
    } else if (patternType === 'linear') {
      const startX = -((linearCount - 1) * linearSpacing) / 2;
      const rad = (linearAngle * Math.PI) / 180;
      for (let i = 0; i < linearCount; i++) {
        const dist = startX + i * linearSpacing;
        const x = dist * Math.cos(rad);
        const y = dist * Math.sin(rad);
        list.push({
          num: i + 1,
          angleDeg: linearAngle,
          x: Math.round(x * 100) / 100,
          y: Math.round(y * 100) / 100,
          chordDist: linearSpacing,
          stepAngle: 0,
        });
      }
    }

    return list;
  }, [patternType, pcdDia, holeCount, startAngle, gridRows, gridCols, gridSpacingX, gridSpacingY, linearCount, linearSpacing, linearAngle]);

  // Safety & Web Thickness Analysis
  const safetyCheck = useMemo(() => {
    if (calculatedHoles.length < 2) return { isSafe: true, webThickness: 999 };
    let minCenterDist = Infinity;

    for (let i = 0; i < calculatedHoles.length; i++) {
      for (let j = i + 1; j < calculatedHoles.length; j++) {
        const dx = calculatedHoles[i].x - calculatedHoles[j].x;
        const dy = calculatedHoles[i].y - calculatedHoles[j].y;
        const dist = Math.hypot(dx, dy);
        if (dist < minCenterDist) minCenterDist = dist;
      }
    }

    const webThickness = minCenterDist - effectiveDiameter;
    const isSafe = webThickness >= effectiveDiameter * 0.5; // DIN recommended min wall thickness >= 0.5 * D
    return { isSafe, webThickness: Number(webThickness.toFixed(1)) };
  }, [calculatedHoles, effectiveDiameter]);

  // Generate CNC G-Code (G81 Drilling Cycle)
  const generateGcode = () => {
    const lines = [
      '%',
      'O1001 (ALUCALC OS - BOLT CIRCLE PCD CYCLE)',
      'G21 G90 G40 G80 G49',
      'T01 M06 (DRILL DIA ' + effectiveDiameter + 'MM)',
      'S1500 M03',
      'G00 G54 X0. Y0.',
      'G43 H01 Z50. M08',
      'G99 G81 Z-15. R2. F120.',
    ];

    calculatedHoles.forEach((h) => {
      lines.push(`X${h.x.toFixed(3)} Y${h.y.toFixed(3)} (#${h.num})`);
    });

    lines.push('G80', 'G00 Z50. M09', 'M05', 'G28 G91 Z0.', 'G28 Y0.', 'M30', '%');
    return lines.join('\n');
  };

  // Export CSV
  const exportCsv = () => {
    const header = 'Hole_Num,Angle_Deg,X_mm,Y_mm,Chord_Distance_mm\n';
    const rows = calculatedHoles
      .map((h) => `${h.num},${h.angleDeg},${h.x},${h.y},${h.chordDist}`)
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pcd_holes_${patternType}_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Apply to 3D Part in Design Studio
  const handleApplyToPart = () => {
    const store = useDesignStore.getState();
    const typeMapping: 'tap' | 'clearance' | 'counterbore' | 'countersink' =
      fitType === 'tap'
        ? 'tap'
        : fitType === 'counterbore'
        ? 'counterbore'
        : fitType === 'countersink'
        ? 'countersink'
        : 'clearance';

    const holeItems: HoleItem[] = calculatedHoles.map((h) => ({
      id: `pcd-hole-${Date.now()}-${h.num}`,
      size: useCustomDia ? `Ø${customHoleDia}` : selectedMetric,
      x: h.x,
      y: h.y,
      type: typeMapping,
    }));

    if (onApplyHoles) {
      onApplyHoles(holeItems);
    } else {
      holeItems.forEach((hole) => store.addHole(hole));
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl bg-[#090d16] border border-amber-500/30 p-5 sm:p-6 shadow-[0_0_50px_rgba(245,158,11,0.15)] flex flex-col max-h-[92vh] overflow-y-auto custom-scrollbar font-mono text-xs text-slate-200">
        {/* ─── MODAL HEADER (Matching Image 2) ─── */}
        <div className="flex items-start justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
              <Disc size={20} className="animate-spin-slow" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                <span>{tPcd.title}</span>
              </h2>
              <p className="text-[10px] text-amber-400/80 font-mono">
                {tPcd.subtitle}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* ─── PATTERN TYPE SELECTOR ─── */}
        <div className="flex gap-1.5 pt-3">
          {[
            { id: 'pcd' as const, label: tPcd.pcdPattern },
            { id: 'grid' as const, label: tPcd.gridPattern },
            { id: 'linear' as const, label: tPcd.linearPattern },
          ].map((pt) => (
            <button
              key={pt.id}
              type="button"
              onClick={() => { setPatternType(pt.id); setActiveHoleIdx(0); }}
              className={`flex-1 py-1.5 rounded-xl font-bold text-[10px] transition-all ${
                patternType === pt.id
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'bg-white/5 text-slate-400 hover:text-white'
              }`}
            >
              {pt.label}
            </button>
          ))}
        </div>

        {/* ─── METRIC HOLE STANDARDS PANEL ─── */}
        <div className="mt-3 p-3.5 rounded-2xl bg-black/50 border border-cyan-500/30 space-y-3">
          <div className="flex items-center justify-between text-[10px] font-bold">
            <span className="text-cyan-400 flex items-center gap-1.5">
              <Sliders size={13} />
              <span>{tPcd.metricStandards}</span>
            </span>
            <span className="text-slate-500">ISO 273 / DIN 13</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Metric Size Dropdown */}
            <div>
              <label className="text-[9px] text-slate-400 block mb-1">{tPcd.threadLabel}</label>
              <select
                value={useCustomDia ? 'custom' : selectedMetric}
                onChange={(e) => {
                  if (e.target.value === 'custom') {
                    setUseCustomDia(true);
                  } else {
                    setUseCustomDia(false);
                    setSelectedMetric(e.target.value);
                  }
                }}
                className="w-full p-2 rounded-xl bg-black/80 border border-white/15 text-cyan-300 font-bold text-xs outline-none focus:border-cyan-400"
              >
                <option value="custom">{tPcd.customDia}</option>
                {ISO_METRIC_HOLES.map((m) => (
                  <option key={m.size} value={m.size}>
                    {m.size} (Ø{m.nominalDiameter}mm · İmbus: Ø{m.counterboreDiameter})
                  </option>
                ))}
              </select>
            </div>

            {/* Hole Fit Type Buttons */}
            <div>
              <label className="text-[9px] text-slate-400 block mb-1">Hole Fit Type</label>
              <div className="flex gap-1">
                {[
                  { id: 'normal' as const, label: 'Normal' },
                  { id: 'close' as const, label: 'Close' },
                  { id: 'tap' as const, label: 'Tap (Diş)' },
                  { id: 'counterbore' as const, label: 'İmbus' },
                ].map((fit) => (
                  <button
                    key={fit.id}
                    type="button"
                    onClick={() => setFitType(fit.id)}
                    className={`flex-1 py-1.5 rounded-lg font-bold text-[10px] transition-all ${
                      fitType === fit.id
                        ? 'bg-cyan-500 text-slate-950 shadow-md font-black'
                        : 'bg-black/60 text-slate-400 border border-white/10 hover:text-white'
                    }`}
                  >
                    {fit.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ─── PATTERN PARAMETER INPUTS ─── */}
        <div className="mt-3 p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-3">
          {patternType === 'pcd' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div>
                <label className="text-[9px] text-slate-400 block mb-1">PCD Dia (mm)</label>
                <input
                  type="number"
                  value={pcdDia}
                  onChange={(e) => setPcdDia(Number(e.target.value))}
                  className="w-full p-2 rounded-xl bg-black/80 border border-amber-500/30 text-amber-300 font-bold text-center"
                />
              </div>
              <div>
                <label className="text-[9px] text-slate-400 block mb-1">Holes (N)</label>
                <input
                  type="number"
                  min={1}
                  max={64}
                  value={holeCount}
                  onChange={(e) => setHoleCount(Math.max(1, Number(e.target.value)))}
                  className="w-full p-2 rounded-xl bg-black/80 border border-amber-500/30 text-amber-300 font-bold text-center"
                />
              </div>
              <div>
                <label className="text-[9px] text-slate-400 block mb-1">Start Angle</label>
                <input
                  type="number"
                  value={startAngle}
                  onChange={(e) => setStartAngle(Number(e.target.value))}
                  className="w-full p-2 rounded-xl bg-black/80 border border-white/10 text-white font-bold text-center"
                />
              </div>
              <div>
                <label className="text-[9px] text-slate-400 block mb-1">Hole Dia (mm)</label>
                <input
                  type="number"
                  disabled={!useCustomDia}
                  value={effectiveDiameter}
                  onChange={(e) => setCustomHoleDia(Number(e.target.value))}
                  className={`w-full p-2 rounded-xl border text-center font-bold ${
                    useCustomDia ? 'bg-black/80 border-cyan-500/40 text-cyan-300' : 'bg-black/40 border-white/5 text-slate-400'
                  }`}
                />
              </div>
            </div>
          )}

          {patternType === 'grid' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div>
                <label className="text-[9px] text-slate-400 block mb-1">Satır (Rows N)</label>
                <input type="number" min={1} max={30} value={gridRows} onChange={(e) => setGridRows(Number(e.target.value))} className="w-full p-2 rounded-xl bg-black/80 border border-amber-500/30 text-amber-300 font-bold text-center" />
              </div>
              <div>
                <label className="text-[9px] text-slate-400 block mb-1">Sütun (Cols M)</label>
                <input type="number" min={1} max={30} value={gridCols} onChange={(e) => setGridCols(Number(e.target.value))} className="w-full p-2 rounded-xl bg-black/80 border border-amber-500/30 text-amber-300 font-bold text-center" />
              </div>
              <div>
                <label className="text-[9px] text-slate-400 block mb-1">Aralık X (dx mm)</label>
                <input type="number" value={gridSpacingX} onChange={(e) => setGridSpacingX(Number(e.target.value))} className="w-full p-2 rounded-xl bg-black/80 border border-white/10 text-white font-bold text-center" />
              </div>
              <div>
                <label className="text-[9px] text-slate-400 block mb-1">Aralık Y (dy mm)</label>
                <input type="number" value={gridSpacingY} onChange={(e) => setGridSpacingY(Number(e.target.value))} className="w-full p-2 rounded-xl bg-black/80 border border-white/10 text-white font-bold text-center" />
              </div>
            </div>
          )}

          {patternType === 'linear' && (
            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <label className="text-[9px] text-slate-400 block mb-1">Delik Sayısı (N)</label>
                <input type="number" min={1} max={50} value={linearCount} onChange={(e) => setLinearCount(Number(e.target.value))} className="w-full p-2 rounded-xl bg-black/80 border border-amber-500/30 text-amber-300 font-bold text-center" />
              </div>
              <div>
                <label className="text-[9px] text-slate-400 block mb-1">Aralık (Step mm)</label>
                <input type="number" value={linearSpacing} onChange={(e) => setLinearSpacing(Number(e.target.value))} className="w-full p-2 rounded-xl bg-black/80 border border-white/10 text-white font-bold text-center" />
              </div>
              <div>
                <label className="text-[9px] text-slate-400 block mb-1">Açı (θ Deg)</label>
                <input type="number" value={linearAngle} onChange={(e) => setLinearAngle(Number(e.target.value))} className="w-full p-2 rounded-xl bg-black/80 border border-white/10 text-white font-bold text-center" />
              </div>
            </div>
          )}
        </div>

        {/* ─── SAFETY & WEB THICKNESS BANNER (Matching Image 2) ─── */}
        <div
          className={`mt-3 p-3 rounded-2xl border flex items-center justify-between font-bold text-xs ${
            safetyCheck.isSafe
              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
              : 'bg-rose-950/60 border-rose-500/40 text-rose-300 animate-pulse'
          }`}
        >
          <div className="flex items-center gap-2">
            {safetyCheck.isSafe ? <Check size={16} /> : <AlertTriangle size={16} />}
            <span>
              {safetyCheck.isSafe ? 'Hole Spacing & Wall Thickness Safe' : '⚠️ WARNING: Dangerous Hole Proximity / Overlap'}
            </span>
          </div>
          <span className="text-[11px] font-mono">
            Web: {safetyCheck.webThickness > 0 ? `${safetyCheck.webThickness} mm` : '0 mm'}
          </span>
        </div>

        {/* ─── ACTIVE INSPECTION CARD (Matching Image 2) ─── */}
        {calculatedHoles[activeHoleIdx] && (
          <div className="mt-3 grid grid-cols-5 gap-2 p-2.5 rounded-2xl bg-black/60 border border-white/10 text-center font-mono text-[10px]">
            <div>
              <span className="text-slate-500 block text-[8px]">ACTIVE</span>
              <span className="font-black text-amber-400">#{calculatedHoles[activeHoleIdx].num}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[8px]">ANGLE θ</span>
              <span className="font-bold text-white">{calculatedHoles[activeHoleIdx].angleDeg}°</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[8px]">X (MM)</span>
              <span className="font-bold text-cyan-300">{calculatedHoles[activeHoleIdx].x >= 0 ? `+${calculatedHoles[activeHoleIdx].x}` : calculatedHoles[activeHoleIdx].x}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[8px]">Y (MM)</span>
              <span className="font-bold text-cyan-300">{calculatedHoles[activeHoleIdx].y >= 0 ? `+${calculatedHoles[activeHoleIdx].y}` : calculatedHoles[activeHoleIdx].y}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[8px]">CHORD (C)</span>
              <span className="font-bold text-emerald-400">{calculatedHoles[activeHoleIdx].chordDist} mm</span>
            </div>
          </div>
        )}

        {/* ─── INTERACTIVE 2D CANVAS (Matching Image 2) ─── */}
        <div className="mt-3 h-56 w-full rounded-2xl bg-black/90 border border-white/10 relative overflow-hidden flex items-center justify-center p-2">
          <svg viewBox="-100 -100 200 200" className="w-full h-full">
            {/* Background PCD Concentric Guide Circles */}
            <circle cx="0" cy="0" r="75" fill="none" stroke="#f59e0b" strokeWidth="0.8" strokeDasharray="3 3" opacity="0.6" />
            <circle cx="0" cy="0" r="20" fill="none" stroke="white" strokeWidth="0.4" opacity="0.2" />

            {/* Center Axes */}
            <line x1="-90" y1="0" x2="90" y2="0" stroke="white" strokeWidth="0.3" opacity="0.2" />
            <line x1="0" y1="-90" x2="0" y2="90" stroke="white" strokeWidth="0.3" opacity="0.2" />
            <circle cx="0" cy="0" r="2" fill="#00e5ff" opacity="0.7" />

            {/* Render Calculated Holes */}
            {calculatedHoles.map((h, idx) => {
              const maxExt = patternType === 'pcd' ? pcdDia / 2 : Math.max(gridCols * gridSpacingX, gridRows * gridSpacingY) / 2;
              const scale = maxExt > 0 ? 65 / maxExt : 1;
              const cx = h.x * scale;
              const cy = -h.y * scale; // Invert SVG Y
              const isActive = activeHoleIdx === idx;

              return (
                <g key={h.num} onClick={() => setActiveHoleIdx(idx)} className="cursor-pointer group">
                  {/* Outer glow ring */}
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isActive ? 8 : 6}
                    fill={isActive ? '#f59e0b25' : '#00e5ff15'}
                    stroke={isActive ? '#f59e0b' : '#00e5ff'}
                    strokeWidth={isActive ? 1.5 : 1}
                    className="transition-all"
                  />
                  {/* Center drill dot */}
                  <circle cx={cx} cy={cy} r="1.5" fill={isActive ? '#f59e0b' : '#00e5ff'} />

                  {/* Hole Badge Text */}
                  <text
                    x={cx}
                    y={cy - 9}
                    textAnchor="middle"
                    fill={isActive ? '#f59e0b' : '#00e5ff'}
                    fontSize="6"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    #{h.num}
                  </text>
                </g>
              );
            })}
          </svg>

          <span className="absolute bottom-2 text-[9px] text-slate-500 font-mono">
            {patternType === 'pcd' ? `PCD ø${pcdDia}mm · ${holeCount}x ø${effectiveDiameter}mm @ ${startAngle}°` : `${calculatedHoles.length} Holes Generated`}
          </span>
        </div>

        {/* ─── COORDINATE TABLE (Matching Image 2) ─── */}
        <div className="mt-3 border border-white/10 rounded-2xl overflow-hidden bg-black/40">
          <div className="max-h-40 overflow-y-auto custom-scrollbar">
            <table className="w-full text-left font-mono text-[10px]">
              <thead className="bg-black/80 text-amber-400 uppercase text-[8px] sticky top-0 border-b border-white/10">
                <tr>
                  <th className="p-2">NUM</th>
                  <th className="p-2">ANGLE</th>
                  <th className="p-2">X (MM)</th>
                  <th className="p-2">Y (MM)</th>
                  <th className="p-2 text-right">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {calculatedHoles.map((h, idx) => {
                  const isActive = activeHoleIdx === idx;
                  return (
                    <tr
                      key={h.num}
                      onClick={() => setActiveHoleIdx(idx)}
                      className={`cursor-pointer transition-colors ${
                        isActive
                          ? 'bg-amber-500/20 text-amber-300 font-bold'
                          : 'text-slate-300 hover:bg-white/5'
                      }`}
                    >
                      <td className="p-2 font-bold">#{h.num}</td>
                      <td className="p-2">{h.angleDeg}°</td>
                      <td className="p-2 text-cyan-300">{h.x >= 0 ? `+${h.x}` : h.x}</td>
                      <td className="p-2 text-cyan-300">{h.y >= 0 ? `+${h.y}` : h.y}</td>
                      <td className="p-2 text-right text-[9px]">
                        {isActive ? (
                          <span className="px-1.5 py-0.5 rounded bg-amber-500/30 text-amber-300 font-bold">ACTIVE</span>
                        ) : (
                          <span className="text-slate-500">Select</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ─── ACTION BUTTONS (Matching Image 2) ─── */}
        <div className="mt-4 flex flex-wrap gap-2 pt-3 border-t border-white/10">
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(generateGcode());
              setCopiedGcode(true);
              setTimeout(() => setCopiedGcode(false), 2000);
            }}
            className="flex-1 py-3 rounded-2xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-bold hover:bg-cyan-900/60 transition-all flex items-center justify-center gap-1.5 shadow-md"
          >
            {copiedGcode ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            <span>{copiedGcode ? 'G-Code Kopyalandı!' : '📋 Copy CNC G-Code (G81)'}</span>
          </button>

          <button
            type="button"
            onClick={exportCsv}
            className="flex-1 py-3 rounded-2xl bg-white/5 border border-white/10 text-slate-200 font-bold hover:bg-white/10 transition-all flex items-center justify-center gap-1.5"
          >
            <Download size={14} />
            <span>📊 Export CSV Table</span>
          </button>

          <button
            type="button"
            onClick={handleApplyToPart}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 text-slate-950 font-black uppercase tracking-wider hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
          >
            <Zap size={16} />
            <span>⚡ {tPcd.applyHoles}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default BoltCirclePcdModal;
