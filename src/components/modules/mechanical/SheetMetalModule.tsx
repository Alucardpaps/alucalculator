'use client';

/**
 * SheetMetalModule — v6.0 "Clear Vision"
 * Büyük, net, anlaşılır SVG görselleştirme.
 * Sol panel: input + sonuçlar. Sağ panel: büyük SVG çizim.
 */

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, RotateCcw, AlertTriangle, CheckCircle2, Info, ChevronRight } from 'lucide-react';
import { useSheetMetalCalculator } from '@/hooks/useSheetMetalCalculator';

/* ─── Types ─────────────────────────────────────────────────────────────── */
interface BendRow { id: string; angle: number; radius: number; flange: number; direction: 'up' | 'down'; }
interface KTableRow { rtMin: number; rtMax: number; k: number; }

/* ─── K-Factor Table (DIN 6935) ─────────────────────────────────────────── */
const DEFAULT_K_TABLE: KTableRow[] = [
  { rtMin: 0,  rtMax: 1,        k: 0.33 },
  { rtMin: 1,  rtMax: 3,        k: 0.40 },
  { rtMin: 3,  rtMax: 5,        k: 0.45 },
  { rtMin: 5,  rtMax: Infinity, k: 0.50 },
];

/* ─── Formulas ───────────────────────────────────────────────────────────── */
function getK(rt: number, table: KTableRow[]): number {
  return table.find(r => rt >= r.rtMin && rt < r.rtMax)?.k ?? 0.50;
}
function calcBA(angle: number, R: number, k: number, t: number) {
  return (Math.PI / 180) * angle * (R + k * t);
}
function calcOSSB(angle: number, R: number, t: number) {
  return (R + t) * Math.tan((angle * Math.PI / 180) / 2);
}
function calcBD(angle: number, R: number, k: number, t: number) {
  return 2 * calcOSSB(angle, R, t) - calcBA(angle, R, k, t);
}
function calcForceTon(t: number, L: number, V: number, Rm: number) {
  if (V <= 0 || L <= 0) return 0;
  return (1.42 * Rm * t * t * L) / (V * 1000) * 0.10197;
}

/* ─── Multi Bend Geometry SVG (dynamic folding profile) ─────────────────── */
interface DrawSegment {
  type: 'line' | 'arc';
  x1?: number; y1?: number;
  x2?: number; y2?: number;
  cx?: number; cy?: number;
  r?: number;
  startAngle?: number;
  endAngle?: number;
  sweepFlag?: number;
  label?: string;
  angle?: number;
  isBend?: boolean;
}

function generateProfileSegments(
  firstFlange: number,
  bends: BendRow[],
  thickness: number,
  kTable: KTableRow[],
  mode: 'midline' | 'neutral'
): DrawSegment[] {
  const segments: DrawSegment[] = [];
  let currentPos = { x: 0, y: 0 };
  let currentAngle = 0; // 0 = right, pi/2 = up, -pi/2 = down
  
  // Calculate OSSB for all bends first
  const ossbs = bends.map(b => calcOSSB(b.angle, b.radius, thickness));
  
  // 1. First Flange Flat Length
  const ossb0 = ossbs.length > 0 ? ossbs[0] : 0;
  const len0 = Math.max(0.1, firstFlange - ossb0);
  const pStart0 = { ...currentPos };
  currentPos.x += len0 * Math.cos(currentAngle);
  currentPos.y += len0 * Math.sin(currentAngle);
  const pEnd0 = { ...currentPos };
  
  segments.push({
    type: 'line',
    x1: pStart0.x, y1: pStart0.y,
    x2: pEnd0.x, y2: pEnd0.y,
    label: `F₀`,
    angle: 0,
    isBend: false
  });
  
  // 2. Bends and subsequent flanges
  bends.forEach((bend, idx) => {
    const rBend = bend.radius;
    const rt = rBend / thickness;
    const k = getK(rt, kTable);
    
    const rCurv = mode === 'neutral' 
      ? (rBend + k * thickness) 
      : (rBend + thickness / 2);
      
    const angleDeg = bend.angle;
    const devAngleRad = ((180 - angleDeg) * Math.PI) / 180;
    
    const isUp = bend.direction !== 'down';
    const sweepDir = isUp ? 1 : -1;
    
    const nx = -sweepDir * Math.sin(currentAngle);
    const ny = sweepDir * Math.cos(currentAngle);
    
    const cx = currentPos.x + rCurv * nx;
    const cy = currentPos.y + rCurv * ny;
    
    const startArcAngle = Math.atan2(currentPos.y - cy, currentPos.x - cx);
    const endArcAngle = startArcAngle + sweepDir * devAngleRad;
    
    segments.push({
      type: 'arc',
      cx, cy, r: rCurv,
      startAngle: startArcAngle,
      endAngle: endArcAngle,
      sweepFlag: isUp ? 1 : 0,
      label: `BA${idx+1}`,
      isBend: true
    });
    
    // Update position and direction angle
    currentAngle += sweepDir * devAngleRad;
    currentPos.x = cx + rCurv * Math.cos(endArcAngle);
    currentPos.y = cy + rCurv * Math.sin(endArcAngle);
    
    // Next straight flange flat length (subtract start setback and next bend's setback if it exists)
    const startOSSB = ossbs[idx];
    const endOSSB = idx + 1 < ossbs.length ? ossbs[idx + 1] : 0;
    const lenF = Math.max(0.1, bend.flange - startOSSB - endOSSB);
    
    const pStartF = { ...currentPos };
    currentPos.x += lenF * Math.cos(currentAngle);
    currentPos.y += lenF * Math.sin(currentAngle);
    const pEndF = { ...currentPos };
    
    segments.push({
      type: 'line',
      x1: pStartF.x, y1: pStartF.y,
      x2: pEndF.x, y2: pEndF.y,
      label: `F${idx+1}`,
      angle: Math.round(currentAngle * 180 / Math.PI),
      isBend: false
    });
  });
  
  return segments;
}

function getProfileBounds(segments: DrawSegment[]): { minX: number; maxX: number; minY: number; maxY: number } {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  const addPoint = (x: number, y: number) => {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  };
  segments.forEach(seg => {
    if (seg.type === 'line') {
      addPoint(seg.x1!, seg.y1!);
      addPoint(seg.x2!, seg.y2!);
    } else if (seg.type === 'arc') {
      const cx = seg.cx!, cy = seg.cy!, r = seg.r!;
      const start = seg.startAngle!, end = seg.endAngle!;
      const steps = 8;
      for (let i = 0; i <= steps; i++) {
        const theta = start + (end - start) * (i / steps);
        addPoint(cx + r * Math.cos(theta), cy + r * Math.sin(theta));
      }
    }
  });
  if (minX === Infinity) {
    return { minX: -50, maxX: 150, minY: -50, maxY: 100 };
  }
  return { minX, maxX, minY, maxY };
}

function drawDimensionLine(
  x1: number, y1: number,
  x2: number, y2: number,
  angle: number,
  label: string,
  offsetDistance: number,
  projectX: (x: number) => number,
  projectY: (y: number) => number,
  thicknessPx: number
) {
  const dx = projectX(x2) - projectX(x1);
  const dy = projectY(y2) - projectY(y1);
  const len = Math.sqrt(dx*dx + dy*dy);
  if (len === 0) return null;
  
  const fillText = label;
  const ux = dx / len;
  const uy = dy / len;
  
  const nx = -uy;
  const ny = ux;
  
  const ox1 = projectX(x1) + offsetDistance * nx;
  const oy1 = projectY(y1) + offsetDistance * ny;
  const ox2 = projectX(x2) + offsetDistance * nx;
  const oy2 = projectY(y2) + offsetDistance * ny;
  
  const gap = 3;
  const ext = 4;
  const startShift = thicknessPx / 2 + gap;
  
  const ex1_start = projectX(x1) + startShift * (offsetDistance > 0 ? nx : -nx);
  const ey1_start = projectY(y1) + startShift * (offsetDistance > 0 ? ny : -ny);
  const ex1_end = ox1 + ext * (offsetDistance > 0 ? nx : -nx);
  const ey1_end = oy1 + ext * (offsetDistance > 0 ? ny : -ny);
  
  const ex2_start = projectX(x2) + startShift * (offsetDistance > 0 ? nx : -nx);
  const ey2_start = projectY(y2) + startShift * (offsetDistance > 0 ? ny : -ny);
  const ex2_end = ox2 + ext * (offsetDistance > 0 ? nx : -nx);
  const ey2_end = oy2 + ext * (offsetDistance > 0 ? ny : -ny);
  
  let textAngle = angle;
  if (textAngle > 90) textAngle -= 180;
  if (textAngle < -90) textAngle += 180;
  
  return (
    <g className="select-none font-mono">
      <line x1={ex1_start} y1={ey1_start} x2={ex1_end} y2={ey1_end} stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
      <line x1={ex2_start} y1={ey2_start} x2={ex2_end} y2={ey2_end} stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
      <line x1={ox1} y1={oy1} x2={ox2} y2={oy2} stroke="#38bdf8" strokeWidth="1" markerStart="url(#dimArrow)" markerEnd="url(#dimArrow)" />
      <g transform={`translate(${(ox1+ox2)/2}, ${(oy1+oy2)/2}) rotate(${textAngle})`}>
        <rect x={-label.length * 3.4 - 4} y="-8" width={label.length * 6.8 + 8} height="16" fill="#030710" rx="2" />
        <text x="0" y="3.5" fontSize="11" fill="#38bdf8" fontWeight="black" textAnchor="middle">{label}</text>
      </g>
    </g>
  );
}

function MultiBendGeometrySVG({
  firstFlange,
  bends,
  thickness,
  kTable
}: {
  firstFlange: number;
  bends: BendRow[];
  thickness: number;
  kTable: KTableRow[];
}) {
  const midlineSegments = useMemo(() => {
    return generateProfileSegments(firstFlange, bends, thickness, kTable, 'midline');
  }, [firstFlange, bends, thickness, kTable]);
  
  const neutralSegments = useMemo(() => {
    return generateProfileSegments(firstFlange, bends, thickness, kTable, 'neutral');
  }, [firstFlange, bends, thickness, kTable]);
  
  const apexPoints = useMemo(() => {
    const points = [{ x: 0, y: 0 }];
    let currentAngle = 0;
    let currentPos = { x: 0, y: 0 };
    
    currentPos.x += firstFlange * Math.cos(currentAngle);
    currentPos.y += firstFlange * Math.sin(currentAngle);
    points.push({ ...currentPos });
    
    bends.forEach(b => {
      const isUp = b.direction !== 'down';
      const sweepDir = isUp ? 1 : -1;
      const devAngleRad = ((180 - b.angle) * Math.PI) / 180;
      currentAngle += sweepDir * devAngleRad;
      
      currentPos.x += b.flange * Math.cos(currentAngle);
      currentPos.y += b.flange * Math.sin(currentAngle);
      points.push({ ...currentPos });
    });
    
    return points;
  }, [firstFlange, bends]);
  
  const bounds = useMemo(() => {
    return getProfileBounds(midlineSegments);
  }, [midlineSegments]);
  
  const W = 500, H = 400;
  const padding = 50;
  
  const boundsWidth = Math.max(bounds.maxX - bounds.minX, 1);
  const boundsHeight = Math.max(bounds.maxY - bounds.minY, 1);
  
  const scale = Math.min(
    (W - 2 * padding) / boundsWidth,
    (H - 2 * padding) / boundsHeight
  );
  
  const offsetX = padding + (W - 2 * padding - boundsWidth * scale) / 2 - bounds.minX * scale;
  const offsetY = padding + (H - 2 * padding - boundsHeight * scale) / 2 + bounds.maxY * scale;
  
  const projectX = (x: number) => offsetX + x * scale;
  const projectY = (y: number) => offsetY - y * scale;
  
  let midlinePathD = '';
  midlineSegments.forEach((seg, idx) => {
    if (seg.type === 'line') {
      const sx = projectX(seg.x1!);
      const sy = projectY(seg.y1!);
      const ex = projectX(seg.x2!);
      const ey = projectY(seg.y2!);
      if (idx === 0) {
        midlinePathD += `M ${sx} ${sy} L ${ex} ${ey}`;
      } else {
        midlinePathD += ` L ${ex} ${ey}`;
      }
    } else if (seg.type === 'arc') {
      const ex = projectX(seg.cx! + seg.r! * Math.cos(seg.endAngle!));
      const ey = projectY(seg.cy! + seg.r! * Math.sin(seg.endAngle!));
      const rScreen = seg.r! * scale;
      midlinePathD += ` A ${rScreen} ${rScreen} 0 0 ${seg.sweepFlag === 1 ? 0 : 1} ${ex} ${ey}`;
    }
  });
  
  let neutralPathD = '';
  neutralSegments.forEach((seg, idx) => {
    if (seg.type === 'line') {
      const sx = projectX(seg.x1!);
      const sy = projectY(seg.y1!);
      const ex = projectX(seg.x2!);
      const ey = projectY(seg.y2!);
      if (idx === 0) {
        neutralPathD += `M ${sx} ${sy} L ${ex} ${ey}`;
      } else {
        neutralPathD += ` L ${ex} ${ey}`;
      }
    } else if (seg.type === 'arc') {
      const ex = projectX(seg.cx! + seg.r! * Math.cos(seg.endAngle!));
      const ey = projectY(seg.cy! + seg.r! * Math.sin(seg.endAngle!));
      const rScreen = seg.r! * scale;
      neutralPathD += ` A ${rScreen} ${rScreen} 0 0 ${seg.sweepFlag === 1 ? 0 : 1} ${ex} ${ey}`;
    }
  });
  
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" style={{ display: 'block' }}>
      <defs>
        <linearGradient id="multiMetalGlow" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.25" />
          <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#0284c7" stopOpacity="0.20" />
        </linearGradient>
        <filter id="dimGlow">
          <feGaussianBlur stdDeviation="3" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <marker id="dimArrow" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#38bdf8" />
        </marker>
        <marker id="dimArrowRad" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#a78bfa" />
        </marker>
      </defs>
      
      <pattern id="multiGrid" width="25" height="25" patternUnits="userSpaceOnUse">
        <path d="M 25 0 L 0 0 0 25" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="0.8" />
      </pattern>
      <rect width={W} height={H} fill="url(#multiGrid)" />
      
      <path
        d={midlinePathD}
        fill="none"
        stroke="url(#multiMetalGlow)"
        strokeWidth={thickness * scale}
        strokeLinecap="butt"
        strokeLinejoin="round"
      />
      <path
        d={midlinePathD}
        fill="none"
        stroke="#0ea5e9"
        strokeWidth="1.5"
        strokeLinecap="butt"
        strokeLinejoin="round"
        opacity="0.8"
      />
      <path
        d={neutralPathD}
        fill="none"
        stroke="#f59e0b"
        strokeWidth="1.5"
        strokeDasharray="6 4"
        opacity="0.85"
        filter="url(#dimGlow)"
      />
      
      {/* ── Dimension: thickness arrow on Multi-Bend ── */}
      {(() => {
        const txVal = Math.min(12, firstFlange / 2);
        const tyVal = 0;
        const sx = projectX(txVal);
        const sy = projectY(tyVal);
        const thicknessPx = thickness * scale;
        
        return (
          <g className="select-none font-mono">
            <line x1={sx - 8} y1={sy - thicknessPx / 2} x2={sx + 8} y2={sy - thicknessPx / 2} stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
            <line x1={sx - 8} y1={sy + thicknessPx / 2} x2={sx + 8} y2={sy + thicknessPx / 2} stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
            <line x1={sx} y1={sy - thicknessPx / 2 - 12} x2={sx} y2={sy - thicknessPx / 2} stroke="#38bdf8" strokeWidth="1" markerEnd="url(#dimArrow)" />
            <line x1={sx} y1={sy + thicknessPx / 2 + 12} x2={sx} y2={sy + thicknessPx / 2} stroke="#38bdf8" strokeWidth="1" markerEnd="url(#dimArrow)" />
            <text x={sx - 12} y={sy + 3.5} fontSize="11" fill="#38bdf8" textAnchor="end" fontFamily="monospace" fontWeight="bold">
              t = {thickness.toFixed(1)} mm
            </text>
          </g>
        );
      })()}
      
      {(() => {
        return apexPoints.slice(0, -1).map((pStart, i) => {
          const pEnd = apexPoints[i + 1];
          const label = i === 0 ? `F₀` : `F${i}`;
          const val = i === 0 ? firstFlange : bends[i - 1].flange;
          const labelText = `${label} = ${val} mm`;
          
          const dx = pEnd.x - pStart.x;
          const dy = pEnd.y - pStart.y;
          const angleRad = Math.atan2(dy, dx);
          const angleDeg = Math.round(angleRad * 180 / Math.PI);
          
          let offsetDistance = -35;
          if (i === 1) {
            offsetDistance = -40;
          } else if (i === 2) {
            offsetDistance = 35;
          }
          
          return (
            <React.Fragment key={i}>
              {drawDimensionLine(pStart.x, pStart.y, pEnd.x, pEnd.y, angleDeg, labelText, offsetDistance, projectX, projectY, thickness * scale)}
            </React.Fragment>
          );
        });
      })()}
      
      {midlineSegments.map((seg, i) => {
        if (seg.type !== 'arc') return null;
        const cx = seg.cx!;
        const cy = seg.cy!;
        const start = seg.startAngle!;
        const end = seg.endAngle!;
        const arcRadius = 25;
        const cxS = projectX(cx);
        const cyS = projectY(cy);
        const bendVal = bends[Math.floor(i / 2)]?.angle ?? 90;
        const R = bends[Math.floor(i / 2)]?.radius ?? 3;
        const Rs = R * scale;
        
        const sX = cxS + arcRadius * Math.cos(-start);
        const sY = cyS + arcRadius * Math.sin(-start);
        const eX = cxS + arcRadius * Math.cos(-end);
        const eY = cyS + arcRadius * Math.sin(-end);
        
        const midAngle = (start + end) / 2;
        const labelRadius = 38;
        const lxS = cxS + labelRadius * Math.cos(-midAngle);
        const lyS = cyS + labelRadius * Math.sin(-midAngle);
        
        // Inner arc target point for radial dimension
        const ax = cxS + Rs * Math.cos(-midAngle);
        const ay = cyS + Rs * Math.sin(-midAngle);
        
        // Text position for radius
        const tx = cxS - 14 * Math.cos(-midAngle);
        const ty = cyS - 14 * Math.sin(-midAngle);
        
        return (
          <g key={i} className="select-none font-mono">
            <circle cx={cxS} cy={cyS} r="2" fill="rgba(255,255,255,0.4)" />
            <path
              d={`M ${sX} ${sY} A ${arcRadius} ${arcRadius} 0 0 ${seg.sweepFlag === 1 ? 0 : 1} ${eX} ${eY}`}
              fill="none"
              stroke="#fbbf24"
              strokeWidth="1.2"
              strokeDasharray="3 2"
              opacity="0.8"
            />
            <rect x={lxS - 18} y={lyS - 8} width="36" height="16" fill="#030710" rx="2" />
            <text x={lxS} y={lyS + 3.5} fontSize="11" fill="#fbbf24" fontWeight="bold" textAnchor="middle">
              {bendVal}°
            </text>
            
            {/* Radial dimension line */}
            <line x1={cxS} y1={cyS} x2={ax} y2={ay} stroke="#a78bfa" strokeWidth="1" markerEnd="url(#dimArrowRad)" />
            <g transform={`translate(${tx}, ${ty})`}>
              <rect x="-18" y="-8" width="36" height="16" fill="#030710" rx="2" />
              <text x="0" y="3.5" fontSize="11" fill="#a78bfa" fontWeight="bold" textAnchor="middle">R{R}</text>
            </g>
          </g>
        );
      })}
      
      <text x="14" y="20" fontSize="11" fill="rgba(255,255,255,0.2)" fontFamily="monospace" fontWeight="bold" letterSpacing="2">
        AEGIS — MULTI-BEND PROFILE FOLDING VIEW
      </text>
    </svg>
  );
}

/* ─── Flat Pattern SVG (big & readable) ─────────────────────────────────── */
function FlatPatternSVG({
  bends,
  thickness,
  kTable,
  firstFlange,
  unit
}: {
  bends: BendRow[];
  thickness: number;
  kTable: KTableRow[];
  firstFlange: number;
  unit: 'metric' | 'imperial';
}) {
  if (bends.length === 0) return null;

  const isImp = unit === 'imperial';
  const toImp = (mm: number) => +(mm / 25.4).toFixed(4);
  const fmtVal = (mm: number) => isImp ? toImp(mm).toFixed(3) : mm.toFixed(2);

  // Build segments
  interface FlatSegment {
    label: string;
    width: number;
    start: number;
    end: number;
    isBend: boolean;
    color: string;
    direction?: 'up' | 'down';
    angle?: number;
    idx?: number;
    bendLine?: number;
  }

  const segs: FlatSegment[] = [];
  let currentDist = 0;

  // F0 segment
  segs.push({
    label: 'F₀',
    width: firstFlange,
    start: 0,
    end: firstFlange,
    isBend: false,
    color: '#38bdf8'
  });
  currentDist = firstFlange;

  bends.forEach((b, i) => {
    const rt = b.radius / thickness;
    const k = getK(rt, kTable);
    const ba = calcBA(b.angle, b.radius, k, thickness);

    // Bend segment
    segs.push({
      label: `BA${i + 1}`,
      width: ba,
      start: currentDist,
      end: currentDist + ba,
      isBend: true,
      color: b.direction === 'up' ? '#10b981' : '#f59e0b',
      direction: b.direction,
      angle: b.angle,
      idx: i + 1,
      bendLine: currentDist + ba / 2
    });
    currentDist += ba;

    // Flange segment
    segs.push({
      label: `F${i + 1}`,
      width: b.flange,
      start: currentDist,
      end: currentDist + b.flange,
      isBend: false,
      color: '#38bdf8'
    });
    currentDist += b.flange;
  });

  const totalFlat = currentDist;
  const canvasW = 600;
  const canvasH = 160;
  const paddingX = 40;
  const drawW = canvasW - 2 * paddingX;
  const scale = drawW / totalFlat;

  return (
    <svg viewBox={`0 0 ${canvasW} ${canvasH}`} width="100%" style={{ display: 'block' }}>
      <defs>
        <linearGradient id="sheetMetalGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1e293b" />
          <stop offset="50%" stopColor="#334155" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>
        <filter id="lineGlow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Sheet metal blank body (Sleek thin strip) */}
      <rect
        x={paddingX}
        y={70}
        width={totalFlat * scale}
        height={14}
        rx={3}
        fill="url(#sheetMetalGrad)"
        stroke="rgba(255,255,255,0.22)"
        strokeWidth="1.5"
      />

      {segs.map((seg, i) => {
        const sx = paddingX + seg.start * scale;
        const ex = paddingX + seg.end * scale;
        const cx = (sx + ex) / 2;

        if (seg.isBend) {
          return (
            <g key={i}>
              {/* Shaded bend allowance area */}
              <rect
                x={sx}
                y={70.5}
                width={ex - sx}
                height={13}
                fill={seg.color}
                opacity="0.15"
              />
              {/* Bend axis dashed line */}
              <line
                x1={cx}
                y1={70}
                x2={cx}
                y2={84}
                stroke={seg.color}
                strokeWidth="1.5"
                strokeDasharray="4 3"
                filter="url(#lineGlow)"
              />
              {/* Vertical extension lines for baseline dimensioning */}
              <line
                x1={cx}
                y1={84}
                x2={cx}
                y2={115}
                stroke="rgba(255,255,255,0.18)"
                strokeWidth="0.8"
                strokeDasharray="2 2"
              />
              {/* Bend axis label above the sheet */}
              <text
                x={cx}
                y={56}
                fontSize="11"
                fill={seg.color}
                fontWeight="black"
                fontFamily="monospace"
                textAnchor="middle"
              >
                {`B${seg.idx} (${seg.angle}° ${seg.direction === 'up' ? '↑' : '↓'})`}
              </text>
            </g>
          );
        } else {
          return (
            <g key={i}>
              {/* Thin boundary line at flange edges */}
              {i > 0 && (
                <line
                  x1={sx}
                  y1={70}
                  x2={sx}
                  y2={84}
                  stroke="rgba(255,255,255,0.12)"
                  strokeWidth="1"
                />
              )}
            </g>
          );
        }
      })}

      {/* Top dimension chain */}
      {segs.map((seg, i) => {
        const sx = paddingX + seg.start * scale;
        const ex = paddingX + seg.end * scale;
        const cx = (sx + ex) / 2;

        return (
          <g key={`dim-${i}`} className="select-none font-mono">
            {/* Dimension line segment */}
            <line
              x1={sx}
              y1={32}
              x2={ex}
              y2={32}
              stroke={seg.isBend ? 'rgba(245,158,11,0.45)' : 'rgba(56,189,248,0.45)'}
              strokeWidth="1"
            />
            {/* Slash tick at start */}
            <line
              x1={sx - 3}
              y1={35}
              x2={sx + 3}
              y2={29}
              stroke="rgba(255,255,255,0.45)"
              strokeWidth="1"
            />
            {/* Slash tick at end (draw for the last segment) */}
            {i === segs.length - 1 && (
              <line
                x1={ex - 3}
                y1={35}
                x2={ex + 3}
                y2={29}
                stroke="rgba(255,255,255,0.45)"
                strokeWidth="1"
              />
            )}
            {/* Label */}
            <text
              x={cx}
              y={22}
              fontSize="11"
              fill={seg.isBend ? '#fbbf24' : '#38bdf8'}
              fontWeight="black"
              textAnchor="middle"
            >
              {`${seg.label}:${fmtVal(seg.width)}`}
            </text>
          </g>
        );
      })}

      {/* Bottom baseline dimensioning */}
      <g className="select-none font-mono">
        {/* Baseline line */}
        <line
          x1={paddingX}
          y1={115}
          x2={paddingX + totalFlat * scale}
          y2={115}
          stroke="rgba(255,255,255,0.3)"
          strokeWidth="1"
        />
        {/* Origin tick (0) */}
        <line
          x1={paddingX - 3}
          y1={118}
          x2={paddingX + 3}
          y2={112}
          stroke="rgba(255,255,255,0.5)"
          strokeWidth="1.2"
        />
        <text
          x={paddingX}
          y={128}
          fontSize="11"
          fill="rgba(255,255,255,0.6)"
          fontWeight="bold"
          textAnchor="middle"
        >
          0.00
        </text>
        {/* Left edge extension line down to baseline */}
        <line
          x1={paddingX}
          y1={84}
          x2={paddingX}
          y2={115}
          stroke="rgba(255,255,255,0.18)"
          strokeWidth="0.8"
          strokeDasharray="2 2"
        />

        {/* Right edge tick (Total Blank) */}
        <line
          x1={paddingX + totalFlat * scale - 3}
          y1={118}
          x2={paddingX + totalFlat * scale + 3}
          y2={112}
          stroke="rgba(56,189,248,0.6)"
          strokeWidth="1.2"
        />
        <text
          x={paddingX + totalFlat * scale}
          y={128}
          fontSize="11"
          fill="#38bdf8"
          fontWeight="black"
          textAnchor="middle"
        >
          {fmtVal(totalFlat)}
        </text>
        {/* Right edge extension line down to baseline */}
        <line
          x1={paddingX + totalFlat * scale}
          y1={84}
          x2={paddingX + totalFlat * scale}
          y2={115}
          stroke="rgba(255,255,255,0.18)"
          strokeWidth="0.8"
          strokeDasharray="2 2"
        />

        {/* Bend lines baseline ticks and values */}
        {segs
          .filter((seg) => seg.isBend)
          .map((seg, idx) => {
            const cx = paddingX + (seg.bendLine || 0) * scale;
            return (
              <g key={`baseline-tick-${idx}`}>
                <line
                  x1={cx - 3}
                  y1={118}
                  x2={cx + 3}
                  y2={112}
                  stroke={seg.color}
                  strokeWidth="1.2"
                />
                <text
                  x={cx}
                  y={128}
                  fontSize="11"
                  fill={seg.color}
                  fontWeight="black"
                  textAnchor="middle"
                >
                  {fmtVal(seg.bendLine || 0)}
                </text>
              </g>
            );
          })}

        {/* Caption */}
        <text
          x={paddingX}
          y={150}
          fontSize="11"
          fill="rgba(255,255,255,0.35)"
          fontFamily="sans-serif"
        >
          * Alt çizgideki ölçüler, sol kenardan büküm ekseni çizgilerine olan mesafeyi belirtir (büküm çizgileri).
        </text>
      </g>
    </svg>
  );
}

/* ─── Detailed Bend Table Component ──────────────────────────────────────── */
function BendTable({
  bends,
  thickness,
  kTable,
  firstFlange,
  unit,
  dict
}: {
  bends: BendRow[];
  thickness: number;
  kTable: KTableRow[];
  firstFlange: number;
  unit: 'metric' | 'imperial';
  dict: any;
}) {
  const isImp = unit === 'imperial';
  const toImp = (mm: number) => +(mm / 25.4).toFixed(4);
  const fmt = (mm: number, dec = 2) => isImp ? `${toImp(mm).toFixed(dec+1)} in` : `${mm.toFixed(dec)} mm`;
  
  let accum = firstFlange;
  const rows = bends.map((b, i) => {
    const rt = b.radius / thickness;
    const k = getK(rt, kTable);
    const ba = calcBA(b.angle, b.radius, k, thickness);
    const bd = calcBD(b.angle, b.radius, k, thickness);
    const ossb = calcOSSB(b.angle, b.radius, thickness);
    const bendLine = accum + ba / 2;
    accum += ba + b.flange;
    return {
      ...b,
      ba,
      bd,
      ossb,
      k,
      rt,
      bendLine,
      isCracking: b.radius < thickness
    };
  });

  return (
    <div className="w-full mt-4 rounded-xl border border-white/5 bg-[#05090f]/80 overflow-hidden backdrop-blur-sm">
      <div className="px-4 py-2.5 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
          <span className="text-[12px] font-black uppercase tracking-wider text-slate-300">AEGIS — DETAYLI BÜKÜM TABLOSU (BEND TABLE)</span>
        </div>
        <span className="text-[10px] font-mono text-slate-500">DIN 6935 Standardı</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse font-mono text-[11px]">
          <thead>
            <tr className="border-b border-white/5 bg-[#080c14] text-slate-400 font-sans text-[10px] uppercase tracking-wider">
              <th className="py-2.5 px-3">No</th>
              <th className="py-2.5 px-2">Yön</th>
              <th className="py-2.5 px-2 text-right">Açı</th>
              <th className="py-2.5 px-2 text-right">Yarıçap (R)</th>
              <th className="py-2.5 px-2 text-right">Kanat (F)</th>
              <th className="py-2.5 px-2 text-right">R/t</th>
              <th className="py-2.5 px-2 text-right">K-Faktörü</th>
              <th className="py-2.5 px-2 text-right text-violet-400">BA (Büküm Payı)</th>
              <th className="py-2.5 px-2 text-right text-sky-400">BD (Büküm Kaybı)</th>
              <th className="py-2.5 px-2 text-right text-amber-400">Setback (OSSB)</th>
              <th className="py-2.5 px-3 text-right text-emerald-400">Büküm Çizgisi (x_c)</th>
              <th className="py-2.5 px-3 text-center">Durum</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.03]">
            {rows.map((row, i) => (
              <tr key={row.id} className="hover:bg-white/[0.02] transition-colors">
                <td className="py-2 px-3 font-sans font-bold text-slate-500">#{i + 1}</td>
                <td className="py-2 px-2">
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold font-sans uppercase ${
                    row.direction === 'up' 
                      ? 'bg-emerald-500/10 text-emerald-400' 
                      : 'bg-amber-500/10 text-amber-400'
                  }`}>
                    {row.direction === 'up' ? 'UP (↑)' : 'DOWN (↓)'}
                  </span>
                </td>
                <td className="py-2 px-2 text-right font-black text-white">{row.angle}°</td>
                <td className="py-2 px-2 text-right text-slate-300">{fmt(row.radius, 1)}</td>
                <td className="py-2 px-2 text-right text-slate-300">{fmt(row.flange, 1)}</td>
                <td className="py-2 px-2 text-right text-slate-400">{row.rt.toFixed(2)}</td>
                <td className="py-2 px-2 text-right text-slate-300 font-bold">{row.k.toFixed(3)}</td>
                <td className="py-2 px-2 text-right text-violet-300 font-black">{fmt(row.ba, 2)}</td>
                <td className="py-2 px-2 text-right text-sky-300 font-black">{fmt(row.bd, 2)}</td>
                <td className="py-2 px-2 text-right text-amber-300">{fmt(row.ossb, 2)}</td>
                <td className="py-2 px-3 text-right text-emerald-300 font-black">{fmt(row.bendLine, 2)}</td>
                <td className="py-2 px-3 text-center">
                  {row.isCracking ? (
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_6px_#ef4444]" title="Çatlama Riski var" />
                  ) : (
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981]" title="Güvenli büküm yarıçapı" />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-4 py-2 border-t border-white/5 bg-[#030609]/60 text-[10px] text-slate-600 font-sans flex flex-wrap justify-between gap-2">
        <span>* BA: Büküm payı. Düz plaka boyuna eklenir.</span>
        <span>* BD: Büküm kaybı. L1 + L2 dış ölçü toplamından çıkarılır.</span>
        <span>* x_c (Büküm Çizgisi): Plakanın sol kenarından büküm ekseni çizgisine olan mesafe.</span>
      </div>
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────────────────── */
export function SheetMetalModule({ lang, dict }: { lang: string; dict: any }) {
  const { materialIdx, setMaterialIdx, thickness, setThickness, length, setLength, materials } = useSheetMetalCalculator();

  const [unit, setUnit] = useState<'metric' | 'imperial'>('metric');
  const [activeTab, setActiveTab] = useState<'multi' | 'ktable'>('multi');
  const [firstFlange, setFirstFlange] = useState(40);
  const [kTable, setKTable] = useState<KTableRow[]>(DEFAULT_K_TABLE);
  const [bends, setBends] = useState<BendRow[]>([
    { id: 'b1', angle: 90, radius: 3, flange: 50, direction: 'down' },
    { id: 'b2', angle: 90, radius: 3, flange: 30, direction: 'up' },
  ]);

  const isImp = unit === 'imperial';
  const toImp = (mm: number) => +(mm / 25.4).toFixed(4);
  const toMet = (inch: number) => inch * 25.4;
  const dp = (mm: number, dec = 3) => isImp ? `${toImp(mm).toFixed(dec)} in` : `${mm.toFixed(dec)} mm`;

  const mat = materials[materialIdx];
  const Rm = Math.round((mat?.yield ?? 250) * 1.35);

  // Multi bend
  const multiBends = useMemo(() => {
    let totalBD = 0;
    const rows = bends.map(b => {
      const rt = b.radius / thickness;
      const k  = getK(rt, kTable);
      const ba = calcBA(b.angle, b.radius, k, thickness);
      const bd = calcBD(b.angle, b.radius, k, thickness);
      totalBD += bd;
      return { ba, bd, k, rt };
    });
    const sumOutside = firstFlange + bends.reduce((acc, b) => acc + b.flange, 0);
    const total = sumOutside - totalBD;
    return { rows, total };
  }, [bends, thickness, kTable, firstFlange]);

  const totalBD = useMemo(() => multiBends.rows.reduce((acc, r) => acc + r.bd, 0), [multiBends]);

  const maxTon = useMemo(() => {
    if (bends.length === 0) return 0;
    return Math.max(...bends.map(b => {
      const vOpening = b.radius * 6;
      return calcForceTon(thickness, length, vOpening, Rm);
    }));
  }, [bends, thickness, length, Rm]);

  const hasCrackingRisk = useMemo(() => {
    return bends.some(b => b.radius < thickness);
  }, [bends, thickness]);

  const addBend = () => setBends(p => [...p, { id: `b${Date.now()}`, angle: 90, radius: thickness || 3, flange: 40, direction: 'up' }]);
  const removeBend = (id: string) => setBends(p => p.filter(b => b.id !== id));
  const updateBend = (id: string, patch: Partial<BendRow>) => setBends(p => p.map(b => b.id === id ? { ...b, ...patch } : b));
  const updateK = (i: number, k: number) => setKTable(p => p.map((r, idx) => idx === i ? { ...r, k } : r));

  return (
    <div className="flex flex-col lg:flex-row h-full w-full bg-[#020609] text-white font-sans overflow-y-auto lg:overflow-hidden">

      {/* ══════════════ LEFT PANEL ══════════════ */}
      <div className="w-full lg:w-[320px] shrink-0 flex flex-col h-auto lg:h-full bg-[#05090f]/95 border-b lg:border-b-0 lg:border-r border-white/5 overflow-hidden">

        {/* Header */}
        <div className="flex-none px-4 pt-4 pb-3 border-b border-white/5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[12px] font-black uppercase tracking-[0.25em] text-violet-400">{dict.sheetMetal?.title || 'Sheet Metal'}</p>
              <p className="text-[10px] font-mono text-slate-600 mt-0.5">{lang === 'tr' ? 'DIN 6935 / ASME Y14.5 Standartları' : 'DIN 6935 / ASME Y14.5 Standards'}</p>
            </div>
            <div className="flex bg-[#080c14] p-0.5 rounded-lg border border-white/5">
              {(['metric','imperial'] as const).map(u => (
                <button key={u} onClick={() => setUnit(u)}
                  className={`px-2 py-1 text-[10px] font-black uppercase rounded-md transition-all ${unit===u ? 'bg-violet-500/25 text-violet-400' : 'text-slate-700'}`}>
                  {u === 'metric' ? 'MM' : 'IN'}
                </button>
              ))}
            </div>
          </div>

          {/* Tab switcher */}
          <div className="grid grid-cols-2 gap-0.5 bg-[#060a12] rounded-xl p-0.5 border border-white/5">
            {([['multi', lang === 'tr' ? 'Büküm Profili' : 'Bending Profile'], ['ktable', lang === 'tr' ? 'K Tablosu' : 'K Table']] as const).map(([t, label]) => (
              <button key={t} onClick={() => setActiveTab(t)}
                className={`py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${activeTab===t ? 'bg-violet-500/25 text-violet-300' : 'text-slate-600 hover:text-slate-400'}`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">

          {/* Global params */}
          <Section title={lang === 'tr' ? 'Malzeme & Genel' : 'Material & General'}>
            <Field label={dict.sheetMetal?.inputs?.material || 'Material'}>
              <select value={materialIdx} onChange={e => setMaterialIdx(+e.target.value)}
                className="w-full bg-[#080c14] border border-white/8 rounded-lg px-3 py-2 text-[11px] text-white font-mono outline-none focus:border-violet-500/40 appearance-none">
                {materials.map((m, i) => <option key={i} value={i} className="bg-[#060a12]">{m.name}</option>)}
              </select>
            </Field>
            <div className="flex gap-2 text-[11px] font-mono bg-violet-950/10 border border-violet-500/10 rounded-lg px-3 py-2">
              <span className="text-slate-600">Ry = {mat?.yield ?? 0} MPa</span>
              <span className="text-slate-700 mx-1">|</span>
              <span className="text-slate-600">Rm ≈ {Rm} MPa</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <NumInput label={dict.sheetMetal?.inputs?.thickness || 'Thickness (t)'} unit={isImp?'in':'mm'} value={isImp?toImp(thickness):thickness} onChange={v=>setThickness(isImp?toMet(v):v)} />
              <NumInput label={dict.sheetMetal?.inputs?.length || 'Bend Length (L)'} unit={isImp?'in':'mm'} value={isImp?toImp(length):length} onChange={v=>setLength(isImp?toMet(v):v)} />
            </div>
          </Section>

          {/* MULTI TAB */}
          {activeTab === 'multi' && (<>
            <Section title={lang === 'tr' ? 'İlk Kanat' : 'First Flange'}>
              <NumInput label={lang === 'tr' ? 'F₀ — ilk kanat uzunluğu' : 'F₀ — first flange length'} unit="mm" value={firstFlange} onChange={setFirstFlange} />
            </Section>

            <div className="flex items-center justify-between px-1">
              <p className="text-[11px] font-black uppercase tracking-widest text-slate-500">{lang === 'tr' ? 'Büküm Sırası' : 'Bend Sequence'}</p>
              <button onClick={addBend}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-violet-500/15 border border-violet-500/25 text-violet-400 text-[10px] font-black uppercase hover:bg-violet-500/25 transition-all">
                <Plus size={9} /> {lang === 'tr' ? 'Ekle' : 'Add'}
              </button>
            </div>

            {bends.map((b, i) => {
              const r = multiBends.rows[i];
              return (
                <div key={b.id} className="rounded-xl border border-white/5 bg-[#080c14]/60 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-black text-violet-400 uppercase tracking-widest">{lang === 'tr' ? 'Büküm' : 'Bend'} {i + 1}</span>
                    <button onClick={() => removeBend(b.id)} className="text-slate-700 hover:text-red-400 transition-colors p-0.5">
                      <Trash2 size={10} />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <NumInput label={lang === 'tr' ? 'Açı θ' : 'Angle θ'} unit="°" value={b.angle} onChange={v=>updateBend(b.id,{angle:v})} min={1} max={179} />
                    <NumInput label={lang === 'tr' ? 'Yarıçap R' : 'Radius R'} unit="mm" value={b.radius} onChange={v=>updateBend(b.id,{radius:v})} />
                    <NumInput label={lang === 'tr' ? 'Kanat Boyu' : 'Flange Length'} unit="mm" value={b.flange} onChange={v=>updateBend(b.id,{flange:v})} />
                    <div className="group">
                      <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1 truncate">{lang === 'tr' ? 'Yön' : 'Direction'}</p>
                      <button
                        onClick={() => updateBend(b.id, { direction: b.direction === 'up' ? 'down' : 'up' })}
                        className={`w-full py-2 text-[11px] font-black uppercase rounded-lg border transition-all ${
                          b.direction === 'up'
                            ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
                            : 'bg-amber-500/10 border-amber-500/25 text-amber-400'
                        }`}
                      >
                        {b.direction === 'up' ? 'UP' : 'DOWN'}
                      </button>
                    </div>
                  </div>
                  {r && (
                    <div className="grid grid-cols-3 gap-1 bg-black/20 rounded-lg p-2">
                      <MiniKV label="BA" value={`${r.ba.toFixed(2)}mm`} color="#a78bfa" />
                      <MiniKV label="BD" value={`${r.bd.toFixed(2)}mm`} color="#38bdf8" />
                      <MiniKV label={`K=${r.k.toFixed(3)}`} value={`R/t=${r.rt.toFixed(1)}`} color="#f59e0b" />
                    </div>
                  )}
                </div>
              );
            })}

            <div className="rounded-xl border border-violet-500/20 bg-gradient-to-r from-violet-950/20 to-transparent p-4">
              <p className="text-[11.5px] font-black uppercase tracking-widest text-violet-400/50 mb-1">{lang === 'tr' ? 'Toplam Açılım (Flat Pattern)' : 'Total Flat Length (Flat Pattern)'}</p>
              <motion.p key={multiBends.total} initial={{opacity:0.5}} animate={{opacity:1}}
                className="text-3xl font-black font-mono text-white">
                {multiBends.total.toFixed(2)} <span className="text-sm text-slate-500">mm</span>
              </motion.p>
              <p className="text-[10px] font-mono text-slate-700 mt-1">F₀ + Σ(BAᵢ + Fᵢ) — {lang === 'tr' ? 'DIN 6935 Standardı' : 'DIN 6935 Standard'}</p>
            </div>
          </>)}

          {/* K-TABLE TAB */}
          {activeTab === 'ktable' && (<>
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-amber-950/20 border border-amber-500/20">
              <Info size={11} className="text-amber-400 shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-400/80 font-mono">{lang === 'tr' ? 'K değerlerini malzeme/proses\'e göre düzenleyin. R/t oranına göre otomatik seçilir.' : 'Adjust K-factor values based on material/process. Automatically chosen based on R/t ratio.'}</p>
            </div>

            <div className="rounded-xl border border-white/5 overflow-hidden bg-[#080c14]/60">
              <div className="grid grid-cols-3 px-3 py-2 border-b border-white/5">
                {[(lang === 'tr' ? 'R/t Min' : 'R/t Min'), (lang === 'tr' ? 'R/t Max' : 'R/t Max'), 'K'].map(h => (
                  <span key={h} className="text-[10px] font-black uppercase tracking-widest text-slate-600">{h}</span>
                ))}
              </div>
              {kTable.map((row, i) => (
                <div key={i} className="grid grid-cols-3 px-3 py-2 border-b border-white/[0.03] items-center hover:bg-white/[0.01]">
                  <span className="text-[11.5px] font-mono text-slate-500">{row.rtMin}</span>
                  <span className="text-[11.5px] font-mono text-slate-500">{row.rtMax === Infinity ? '∞' : row.rtMax}</span>
                  <input type="number" value={row.k} step="0.01" min="0.01" max="0.99"
                    onChange={e => updateK(i, +e.target.value)}
                    className="bg-transparent text-[12px] font-black font-mono text-violet-400 outline-none w-16 focus:text-violet-200" />
                </div>
              ))}
            </div>

            <button onClick={() => setKTable(DEFAULT_K_TABLE)}
              className="flex items-center gap-1.5 px-3 py-1.5 w-full justify-center rounded-lg border border-white/8 text-slate-600 text-[10px] font-black uppercase hover:text-slate-300 transition-all">
              <RotateCcw size={9} /> {lang === 'tr' ? 'Varsayılana Dön (DIN 6935)' : 'Reset to Default (DIN 6935)'}
            </button>

            <Section title={lang === 'tr' ? 'R/t → K Önizleme' : 'R/t → K Preview'}>
              <div className="grid grid-cols-3 gap-2">
                {[0.5, 1, 2, 3, 5, 8].map(rt => (
                  <div key={rt} className="text-center bg-[#080c14] rounded-lg p-2 border border-white/5">
                    <div className="text-[10px] text-slate-600 font-mono mb-0.5">R/t = {rt}</div>
                    <div className="text-[14px] font-black font-mono text-violet-400">{getK(rt, kTable).toFixed(3)}</div>
                  </div>
                ))}
              </div>
            </Section>
          </>)}
        </div>
      </div>

      {/* ══════════════ RIGHT PANEL ══════════════ */}
      <div className="flex-1 flex flex-col h-auto lg:h-full overflow-hidden">

        {/* KPI Strip */}
        <div className="flex-none flex items-center gap-6 px-6 py-3 border-b border-white/5 bg-[#030609]/80 flex-wrap">
          <KPI label={lang === 'tr' ? 'Toplam Açınım' : 'Total Flat Length'} value={dp(multiBends.total, 3)} color="#a78bfa" />
          <KPI label={lang === 'tr' ? 'Toplam Düşüm' : 'Total Deduction'} value={dp(totalBD, 3)} color="#38bdf8" />
          <KPI label={lang === 'tr' ? 'Büküm Sayısı' : 'Bend Count'} value={bends.length.toString()} color="#f59e0b" />
          <KPI label={lang === 'tr' ? 'Maks. Tonnaj' : 'Max Tonnage'} value={`${maxTon.toFixed(2)} ton`} color="#fb7185" />
          <div className="ml-auto">
            {hasCrackingRisk
              ? <Badge color="red" text={lang === 'tr' ? '⚠ Çatlama Riski' : '⚠ Cracking Risk'} />
              : <Badge color="green" text={lang === 'tr' ? '✓ Güvenli' : '✓ Safe'} />}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto 2xl:overflow-hidden bg-[#030710] flex flex-col 2xl:flex-row min-h-0">

          {/* ─── BIG SVG VIEW ─── */}
          <div className="relative h-[380px] 2xl:h-full flex-1 shrink-0 bg-[#030710] flex items-center justify-center border-b 2xl:border-b-0 2xl:border-r border-white/5 overflow-hidden p-4">
            {/* subtle grid */}
            <div className="absolute inset-0 pointer-events-none"
              style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

            <div className="relative w-full h-full max-w-2xl flex items-center justify-center">
              <MultiBendGeometrySVG
                firstFlange={firstFlange}
                bends={bends}
                thickness={thickness}
                kTable={kTable}
              />
            </div>
          </div>

          {/* ─── Right column (Flat Pattern, Bend Table, Formulas) ─── */}
          <div className="flex-1 flex flex-col 2xl:w-[650px] 2xl:shrink-0 2xl:h-full 2xl:overflow-y-auto">
            {/* ─── Flat Pattern strip (multi tab only) ─── */}
            {activeTab === 'multi' && bends.length > 0 && (
              <div className="flex-none border-t border-white/5 bg-[#030609]/90 px-6 py-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">Açılım (Flat Pattern Layout)</span>
                  <div className="flex-1 h-px bg-white/5" />
                  <span className="text-[11.5px] font-mono text-violet-400 font-black">{dp(multiBends.total, 2)} toplam</span>
                </div>
                <div className="w-full overflow-x-auto custom-scrollbar">
                  <div className="min-w-[600px]">
                    <FlatPatternSVG bends={bends} thickness={thickness} kTable={kTable} firstFlange={firstFlange} unit={unit} />
                  </div>
                </div>
              </div>
            )}

            {/* ─── Bend Table (multi tab only) ─── */}
            {activeTab === 'multi' && bends.length > 0 && (
              <div className="flex-none border-t border-white/5 bg-[#030609]/40 px-6 pb-6">
                <BendTable bends={bends} thickness={thickness} kTable={kTable} firstFlange={firstFlange} unit={unit} dict={dict} />
              </div>
            )}

            {/* ─── Formula reference bar ─── */}
            <div className="mt-auto flex-none border-t border-white/5 bg-[#020609]/95 px-6 py-3 flex gap-6 overflow-x-auto">
              {[
                { f: 'BA = (π·θ/180) × (R + K·t)', c: '#a78bfa' },
                { f: 'BD = 2·OSSB − BA', c: '#38bdf8' },
                { f: 'OSSB = (R+t)·tan(θ/2)', c: '#f59e0b' },
                { f: 'F = 1.42·Rm·t²·L / V', c: '#fb7185' },
              ].map((item, i) => (
                <div key={i} className="shrink-0 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: item.c }} />
                  <code className="text-[10px] font-mono whitespace-nowrap" style={{ color: item.c }}>{item.f}</code>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Micro-components ───────────────────────────────────────────────────── */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/5 bg-[#07090f]/60 p-3 space-y-2">
      <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-600 mb-2">{title}</p>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-700 mb-1">{label}</p>
      {children}
    </div>
  );
}

function NumInput({ label, unit, value, onChange, min, max }: {
  label: string; unit: string; value: number; onChange: (v: number) => void; min?: number; max?: number;
}) {
  return (
    <div className="group">
      <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1 truncate">{label}</p>
      <div className="flex items-center bg-[#07090f] border border-white/8 rounded-lg overflow-hidden focus-within:border-violet-500/40 transition-colors">
        <input type="number" value={value} step="any" min={min} max={max}
          onChange={e => onChange(+e.target.value)}
          className="w-full bg-transparent text-[13px] font-black font-mono px-2.5 py-2 text-white outline-none appearance-none" />
        <span className="px-2 text-[9.5px] font-bold text-violet-500 border-l border-white/5 bg-white/[0.01] shrink-0">{unit}</span>
      </div>
    </div>
  );
}

function ResultItem({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-white/[0.04] last:border-0">
      <div className="min-w-0">
        <p className="text-[11px] font-black text-slate-400 uppercase tracking-wide truncate">{label}</p>
        <p className="text-[9.5px] font-mono text-slate-700 truncate">{sub}</p>
      </div>
      <motion.p key={value} initial={{ opacity: 0.4, x: 4 }} animate={{ opacity: 1, x: 0 }}
        className="font-mono font-black text-[14px] ml-3 shrink-0" style={{ color }}>
        {value}
      </motion.p>
    </div>
  );
}

function MiniKV({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="text-center">
      <p className="text-[9px] font-mono shrink-0 font-bold" style={{ color }}>{label}</p>
      <p className="text-[10px] font-mono text-slate-500">{value}</p>
    </div>
  );
}

function KPI({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">{label}</p>
      <motion.p key={value} initial={{ opacity: 0.5, y: -3 }} animate={{ opacity: 1, y: 0 }}
        className="text-[18px] font-black font-mono" style={{ color }}>
        {value}
      </motion.p>
    </div>
  );
}

function Badge({ color, text }: { color: 'red' | 'green'; text: string }) {
  const styles = {
    red: 'bg-red-950/40 border-red-500/30 text-red-400',
    green: 'bg-emerald-950/30 border-emerald-500/25 text-emerald-400',
  };
  return (
    <span className={`px-3 py-1.5 rounded-full border text-[10px] font-black uppercase ${styles[color]}`}>
      {text}
    </span>
  );
}

export default SheetMetalModule;
