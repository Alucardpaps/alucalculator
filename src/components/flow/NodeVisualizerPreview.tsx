'use client';

import React, { useMemo } from 'react';
import { BearingBlueprint } from '@/components/visualizers/BearingBlueprint';
import { BeltDriveBlueprint } from '@/components/visualizers/BeltDriveBlueprint';
import { ChainDriveBlueprint } from '@/components/visualizers/ChainDriveBlueprint';
import { dxfToSvgPreview } from '@/viewers/dxf-preview';
import {
  generateExternalGearContour,
  generateInternalGearContour,
  calculateInvoluteGearSpecs,
  type Point2D as GearPoint2D,
} from '@/engines/math/gear-involute-factory';

interface NodeVisualizerPreviewProps {
  schemaId: string;
  inputs?: Record<string, any>;
  outputs?: Record<string, any>;
  mode?: 'compact' | 'full';
  className?: string;
}

function contourToSvgPathScaled(pts: GearPoint2D[], cx: number, cy: number, scale: number): string {
  if (!pts || pts.length < 3) return '';
  let d = `M ${(cx + pts[0].x * scale).toFixed(2)} ${(cy + pts[0].y * scale).toFixed(2)}`;
  for (let i = 1; i < pts.length; i++) {
    d += ` L ${(cx + pts[i].x * scale).toFixed(2)} ${(cy + pts[i].y * scale).toFixed(2)}`;
  }
  d += ' Z';
  return d;
}

export const NodeVisualizerPreview: React.FC<NodeVisualizerPreviewProps> = ({
  schemaId,
  inputs = {},
  outputs = {},
  mode = 'compact',
  className = '',
}) => {
  const isCompact = mode === 'compact';
  const width = isCompact ? 280 : 340;
  const height = isCompact ? 130 : 200;

  // 1. SPUR & HELICAL GEAR (True Involute DIN 3960 / ISO 6336)
  if (schemaId === 'mech-gear-spur' || schemaId === 'mech-gear-helical') {
    const isHelical = schemaId === 'mech-gear-helical';
    const m = Number(inputs.module_mm ?? inputs.normalModule ?? inputs.module ?? 3);
    const z1 = Number(inputs.pinion_teeth ?? inputs.teethPinion ?? 20);
    const z2 = Number(inputs.gear_teeth ?? inputs.teethGear ?? 40);
    const beta = isHelical ? Number(inputs.helix_angle_deg ?? inputs.helixAngle ?? 15) : 0;
    const alpha = Number(inputs.pressure_angle_deg ?? inputs.pressureAngle ?? 20);

    const d1 = Number(outputs.pitch_diameter_mm ?? outputs.pinion_pitch_diameter_mm ?? outputs.pitchDiaPinion ?? (m * z1));
    const d2 = Number(outputs.gear_pitch_diameter_mm ?? outputs.pitchDiaGear ?? (m * z2));
    const a = Number(outputs.center_distance_mm ?? outputs.centerDistance ?? ((d1 + d2) / 2));
    const ratio = (z2 / Math.max(1, z1)).toFixed(2);

    // Scale to fit viewport
    const totalSpan = d1 + d2;
    const scale = Math.min((width - 40) / Math.max(totalSpan, 80), (height - 30) / Math.max(d2, 80));
    const r1 = Math.max(12, (d1 / 2) * scale);
    const r2 = Math.max(18, (d2 / 2) * scale);
    const cDist = (d1 / 2 + d2 / 2) * scale;

    const cx1 = (width - cDist) / 2;
    const cy1 = height / 2;
    const cx2 = cx1 + cDist;
    const cy2 = cy1;

    // True involute tooth contours
    let pinionContour: GearPoint2D[] = [];
    let gearContour: GearPoint2D[] = [];
    try {
      pinionContour = generateExternalGearContour({
        module: m,
        teeth: z1,
        pressureAngle: alpha,
        helixAngle: beta,
        pointsPerFlank: 6,
        rotationAngle: 0,
      });
      gearContour = generateExternalGearContour({
        module: m,
        teeth: z2,
        pressureAngle: alpha,
        helixAngle: -beta,
        pointsPerFlank: 6,
        rotationAngle: (z2 % 2 === 0 ? 180 : 0) / Math.max(1, z2),
      });
    } catch {
      pinionContour = [];
      gearContour = [];
    }

    return (
      <div className={`relative bg-[var(--bg-0)] border border-cyan-950/60 rounded-lg overflow-hidden flex flex-col items-center justify-center p-1.5 ${className}`}>
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full select-none font-mono">
          <defs>
            <radialGradient id="gearGrad1" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#0284c7" stopOpacity="0.4" />
              <stop offset="85%" stopColor="#0369a1" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#082f49" stopOpacity="0.5" />
            </radialGradient>
            <radialGradient id="gearGrad2" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#0d9488" stopOpacity="0.4" />
              <stop offset="85%" stopColor="#0f766e" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#134e4a" stopOpacity="0.5" />
            </radialGradient>
          </defs>

          {/* Center line */}
          <line x1={cx1} y1={cy1} x2={cx2} y2={cy2} stroke="#38bdf8" strokeWidth="0.8" strokeDasharray="3 2" />

          {/* Pinion Teeth (True Involute) & Pitch circle */}
          <path d={contourToSvgPathScaled(pinionContour, cx1, cy1, scale)} fill="url(#gearGrad1)" stroke="#38bdf8" strokeWidth="1" />
          <circle cx={cx1} cy={cy1} r={r1} fill="none" stroke="#38bdf8" strokeWidth="0.8" strokeDasharray="2 2" />
          <circle cx={cx1} cy={cy1} r={Math.max(4, r1 * 0.3)} fill="#070d18" stroke="#38bdf8" strokeWidth="0.8" />

          {/* Driven Gear Teeth (True Involute) & Pitch circle */}
          <path d={contourToSvgPathScaled(gearContour, cx2, cy2, scale)} fill="url(#gearGrad2)" stroke="#2dd4bf" strokeWidth="1" />
          <circle cx={cx2} cy={cy2} r={r2} fill="none" stroke="#2dd4bf" strokeWidth="0.8" strokeDasharray="2 2" />
          <circle cx={cx2} cy={cy2} r={Math.max(5, r2 * 0.25)} fill="#070d18" stroke="#2dd4bf" strokeWidth="0.8" />

          {/* Center distance dimension */}
          <line x1={cx1} y1={height - 14} x2={cx2} y2={height - 14} stroke="#94a3b8" strokeWidth="0.8" />
          <line x1={cx1} y1={cy1 + r1 + 3} x2={cx1} y2={height - 10} stroke="#475569" strokeWidth="0.5" strokeDasharray="2 2" />
          <line x1={cx2} y1={cy2 + r2 + 3} x2={cx2} y2={height - 10} stroke="#475569" strokeWidth="0.5" strokeDasharray="2 2" />
          <text x={(cx1 + cx2) / 2} y={height - 5} fill="#cbd5e1" fontSize={isCompact ? 8 : 9} textAnchor="middle">
            a = {a.toFixed(1)} mm
          </text>
        </svg>

        {/* Telemetry pill */}
        <div className="absolute top-1.5 left-2 flex items-center gap-1.5 text-[8px] font-mono">
          <span className="px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-bold">
            z₁={z1} / z₂={z2} (i = {ratio})
          </span>
          <span className="px-1.5 py-0.5 rounded bg-slate-900/80 border border-slate-700 text-slate-300">
            m = {m} mm {beta !== 0 ? `· β=${beta}°` : ''}
          </span>
        </div>
      </div>
    );
  }

  // 1b. PLANETARY GEARBOX (Epicyclic Sun, Planets & Internal Ring Gear)
  if (schemaId === 'mech-planetary-gear' || schemaId === 'planetary-gearbox') {
    const m = Number(inputs.module_mm ?? inputs.module ?? inputs.m ?? 3);
    const zs = Number(inputs.sun_teeth ?? inputs.sunTeeth ?? inputs.zs ?? 18);
    const zp = Number(inputs.planet_teeth ?? inputs.planetTeeth ?? inputs.zp ?? 18);
    const zr = Number(inputs.ring_teeth ?? inputs.ringTeeth ?? inputs.zr ?? 54);
    const N = Number(inputs.planet_count ?? inputs.planetCount ?? inputs.N ?? 3);
    const beta = Number(inputs.helix_angle_deg ?? inputs.helixAngle ?? 0);

    const ds = m * zs;
    const dp = m * zp;
    const dr = m * zr;
    const rC = (ds + dp) / 2;
    const outerRingDia = dr + 7 * m;

    const scale = Math.min((width - 40) / Math.max(outerRingDia, 60), (height - 20) / Math.max(outerRingDia, 60));
    const cx = width / 2;
    const cy = height / 2;

    let sunContour: GearPoint2D[] = [];
    let planetContour: GearPoint2D[] = [];
    let ringInner: GearPoint2D[] = [];
    let ringOuter: GearPoint2D[] = [];
    try {
      sunContour = generateExternalGearContour({ module: m, teeth: zs, helixAngle: beta, pointsPerFlank: 5 });
      planetContour = generateExternalGearContour({ module: m, teeth: zp, helixAngle: -beta, pointsPerFlank: 5, rotationAngle: (zp % 2 === 0 ? 180 : 0) / Math.max(1, zp) });
      const ring = generateInternalGearContour({ module: m, teeth: zr, helixAngle: -beta, pointsPerFlank: 5, rimThickness: 3.5 * m });
      ringInner = ring.innerTeethContour;
      ringOuter = ring.outerRimContour;
    } catch {
      sunContour = [];
      planetContour = [];
      ringInner = [];
      ringOuter = [];
    }

    const planets = [];
    for (let k = 0; k < N; k++) {
      const angle = (k * 2 * Math.PI) / N - Math.PI / 2;
      planets.push({
        x: cx + rC * Math.cos(angle) * scale,
        y: cy + rC * Math.sin(angle) * scale,
      });
    }

    return (
      <div className={`relative bg-[var(--bg-0)] border border-cyan-950/60 rounded-lg overflow-hidden flex flex-col items-center justify-center p-1.5 ${className}`}>
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full select-none font-mono">
          <defs>
            <radialGradient id="sunGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#b45309" stopOpacity="0.5" />
            </radialGradient>
            <radialGradient id="planetGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#0e7490" stopOpacity="0.5" />
            </radialGradient>
          </defs>

          {/* Carrier Orbit Circle */}
          <circle cx={cx} cy={cy} r={rC * scale} fill="none" stroke="#64748b" strokeWidth="0.8" strokeDasharray="3 3" />

          {/* Internal Ring Gear Outer Rim & Inner Teeth */}
          {ringOuter.length > 0 && (
            <path
              d={`${contourToSvgPathScaled(ringOuter, cx, cy, scale)} ${contourToSvgPathScaled(ringInner, cx, cy, scale)}`}
              fill="#581c87"
              fillOpacity="0.25"
              fillRule="evenodd"
              stroke="#c084fc"
              strokeWidth="0.9"
            />
          )}

          {/* Sun Gear */}
          <path d={contourToSvgPathScaled(sunContour, cx, cy, scale)} fill="url(#sunGrad)" stroke="#f59e0b" strokeWidth="0.9" />
          <circle cx={cx} cy={cy} r={Math.max(3, (ds / 2) * scale * 0.35)} fill="#040812" stroke="#f59e0b" strokeWidth="0.8" />

          {/* Planet Gears */}
          {planets.map((pt, idx) => (
            <g key={idx}>
              <path d={contourToSvgPathScaled(planetContour, pt.x, pt.y, scale)} fill="url(#planetGrad)" stroke="#06b6d4" strokeWidth="0.9" />
              <circle cx={pt.x} cy={pt.y} r={Math.max(2.5, (dp / 2) * scale * 0.35)} fill="#040812" stroke="#06b6d4" strokeWidth="0.8" />
            </g>
          ))}
        </svg>

        {/* Telemetry pill */}
        <div className="absolute top-1.5 left-2 flex items-center gap-1.5 text-[8px] font-mono">
          <span className="px-1.5 py-0.5 rounded bg-purple-950/80 border border-purple-500/40 text-purple-300 font-bold">
            zs={zs} / zp={zp} / zr={zr} (N={N})
          </span>
          <span className="px-1.5 py-0.5 rounded bg-slate-900/80 border border-slate-700 text-slate-300">
            m = {m} mm · i = {(1 + zr / zs).toFixed(2)}
          </span>
        </div>
      </div>
    );
  }

  // 2. BEARING LIFE ISO 281
  if (schemaId === 'mech-bearing-life') {
    const d = Number(inputs.innerDia || 30);
    const D = Number(inputs.outerDia || 62);
    const B = Number(inputs.width || 16);
    const rpm = Number(inputs.speedRpm || 1450);
    const fr = Number(inputs.radialLoad || 5000);
    const fa = Number(inputs.axialLoad || 1500);
    const l10h = outputs.lifeHoursL10h !== undefined ? Number(outputs.lifeHoursL10h) : undefined;

    return (
      <div className={`relative bg-[var(--bg-0)] border border-cyan-950/60 rounded-lg overflow-hidden flex flex-col items-center justify-center p-1.5 ${className}`}>
        <div className="w-full h-full max-h-[190px]">
          <BearingBlueprint
            type="deep-groove-ball"
            code={`SKF 6${Math.round(d / 5)}`}
            d={d}
            D={D}
            B={B}
            rpm={rpm}
            fr={fr}
            fa={fa}
          />
        </div>
        <div className="absolute bottom-1.5 right-2 flex items-center gap-1.5 text-[8px] font-mono">
          <span className="px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-bold">
            {l10h ? `L₁₀ₕ: ${Math.round(l10h).toLocaleString()} h` : `Ø${d} x Ø${D} B=${B}`}
          </span>
        </div>
      </div>
    );
  }

  // 3. BELT DRIVE ISO 4184
  if (schemaId === 'mech-belt-drive') {
    const d1 = Number(inputs.d1 ?? inputs.driverDia ?? 100);
    const d2 = Number(inputs.d2 ?? inputs.drivenDia ?? 250);
    const centerDist = Number(inputs.C ?? inputs.centerDistance ?? 500);
    const rpm1 = Number(inputs.rpm ?? inputs.driverSpeed ?? inputs.rpm1 ?? 1450);
    const rpm2 = outputs.drivenSpeed ? Number(outputs.drivenSpeed) : (outputs.n2 ? Number(outputs.n2) : Math.round(rpm1 * (d1 / d2)));
    const beltVelocity = outputs.beltSpeed ? Number(outputs.beltSpeed) : (outputs.v ? Number(outputs.v) : undefined);
    const beltLength = outputs.beltLength ? Number(outputs.beltLength) : (outputs.belt_length_mm || outputs.Ld_mm ? Number(outputs.belt_length_mm || outputs.Ld_mm) : undefined);

    return (
      <div className={`relative bg-[var(--bg-0)] border border-cyan-950/60 rounded-lg overflow-hidden flex flex-col items-center justify-center p-1.5 ${className}`}>
        <div className="w-full h-full max-h-[190px]">
          <BeltDriveBlueprint
            d1={d1}
            d2={d2}
            centerDist={centerDist}
            rpm1={rpm1}
            rpm2={rpm2}
            beltVelocity={beltVelocity}
            beltLength={beltLength}
            showLegend={!isCompact}
          />
        </div>
        <div className="absolute top-1.5 left-2 flex items-center gap-1.5 text-[8px] font-mono">
          <span className="px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-bold">
            Ø{d1} → Ø{d2} mm (C={centerDist}mm)
          </span>
        </div>
      </div>
    );
  }

  // 4. CHAIN DRIVE ISO 606
  if (schemaId === 'mech-chain-drive') {
    const z1 = Number(inputs.z1 ?? inputs.teethDriver ?? 19);
    const z2 = Number(inputs.z2 ?? inputs.teethDriven ?? 38);
    const pitch = Number(inputs.p ?? inputs.chainPitch ?? 15.875);
    const centerDist = Number(inputs.C ?? inputs.centerDistance ?? 450);
    const rpm1 = Number(inputs.rpm ?? inputs.speedDriver ?? inputs.rpm1 ?? 1450);
    const rpm2 = outputs.speedDriven ? Number(outputs.speedDriven) : (outputs.n2 ? Number(outputs.n2) : Math.round(rpm1 * (z1 / z2)));

    return (
      <div className={`relative bg-[var(--bg-0)] border border-cyan-950/60 rounded-lg overflow-hidden flex flex-col items-center justify-center p-1.5 ${className}`}>
        <div className="w-full h-full max-h-[190px]">
          <ChainDriveBlueprint
            z1={z1}
            z2={z2}
            pitch={pitch}
            centerDist={centerDist}
            rpm1={rpm1}
            rpm2={rpm2}
            showLegend={!isCompact}
          />
        </div>
        <div className="absolute top-1.5 left-2 flex items-center gap-1.5 text-[8px] font-mono">
          <span className="px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-bold">
            z₁={z1} / z₂={z2} · p={pitch.toFixed(1)}mm
          </span>
        </div>
      </div>
    );
  }

  // 5. COLUMN BUCKLING (Euler / Tetmajer)
  if (schemaId === 'mech-column-buckling') {
    const L = Number(inputs.lengthMm || 1500);
    const P = Number(inputs.axialLoadN || 25000);
    const Pcr = outputs.criticalLoadN ? Number(outputs.criticalLoadN) : 48500;
    const sf = outputs.safetyFactor ? Number(outputs.safetyFactor) : (Pcr / Math.max(1, P));
    const regime = outputs.regime ? String(outputs.regime) : 'Euler';

    const isSafe = sf >= 2.0;
    const strokeColor = isSafe ? '#22d3ee' : '#f87171';

    // Buckled column sinusoidal curve
    const cy = height / 2;
    const xLeft = 30;
    const xRight = width - 30;
    const colLen = xRight - xLeft;
    const maxDelta = isCompact ? 14 : 22;

    const pts: string[] = [];
    for (let i = 0; i <= 30; i++) {
      const frac = i / 30;
      const x = xLeft + frac * colLen;
      const y = cy + Math.sin(frac * Math.PI) * maxDelta;
      pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    }

    return (
      <div className={`relative bg-[var(--bg-0)] border border-cyan-950/60 rounded-lg overflow-hidden flex flex-col items-center justify-center p-1.5 ${className}`}>
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full select-none font-mono">
          {/* Neutral centerline */}
          <line x1={xLeft} y1={cy} x2={xRight} y2={cy} stroke="#334155" strokeWidth="1" strokeDasharray="3 3" />

          {/* Buckled sine curve */}
          <polyline points={pts.join(' ')} fill="none" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" />

          {/* Supports */}
          {/* Left pinned support */}
          <polygon points={`${xLeft-8},${cy+8} ${xLeft+8},${cy+8} ${xLeft},${cy}`} fill="#1e293b" stroke="#64748b" strokeWidth="1.2" />
          <line x1={xLeft-10} y1={cy+9} x2={xLeft+10} y2={cy+9} stroke="#475569" strokeWidth="1.5" />

          {/* Right roller support */}
          <polygon points={`${xRight-8},${cy+8} ${xRight+8},${cy+8} ${xRight},${cy}`} fill="#1e293b" stroke="#64748b" strokeWidth="1.2" />
          <circle cx={xRight-4} cy={cy+12} r="2" fill="#64748b" />
          <circle cx={xRight+4} cy={cy+12} r="2" fill="#64748b" />
          <line x1={xRight-10} y1={cy+15} x2={xRight+10} y2={cy+15} stroke="#475569" strokeWidth="1.5" />

          {/* Axial load arrows */}
          <line x1={xLeft - 22} y1={cy} x2={xLeft - 2} y2={cy} stroke="#f59e0b" strokeWidth="2" markerEnd="url(#arrowAmber)" />
          <polygon points={`${xLeft-3},${cy} ${xLeft-9},${cy-3} ${xLeft-9},${cy+3}`} fill="#f59e0b" />
          <text x={xLeft - 12} y={cy - 6} fill="#fbbf24" fontSize="8" textAnchor="middle">P</text>

          <line x1={xRight + 22} y1={cy} x2={xRight + 2} y2={cy} stroke="#f59e0b" strokeWidth="2" />
          <polygon points={`${xRight+3},${cy} ${xRight+9},${cy-3} ${xRight+9},${cy+3}`} fill="#f59e0b" />
          <text x={xRight + 12} y={cy - 6} fill="#fbbf24" fontSize="8" textAnchor="middle">P</text>

          {/* Amplitude label */}
          <text x={(xLeft + xRight) / 2} y={cy + maxDelta + 12} fill="#94a3b8" fontSize="8" textAnchor="middle">
            L = {L} mm · {regime} Rejimi
          </text>
        </svg>

        <div className="absolute top-1.5 left-2 flex items-center gap-1.5 text-[8px] font-mono">
          <span className="px-1.5 py-0.5 rounded bg-amber-950/80 border border-amber-500/40 text-amber-300 font-bold">
            P = {(P / 1000).toFixed(1)} kN
          </span>
          <span className={`px-1.5 py-0.5 rounded border font-bold ${isSafe ? 'bg-cyan-950/80 border-cyan-500/40 text-cyan-300' : 'bg-red-950/80 border-red-500/40 text-red-300'}`}>
            P_cr = {(Pcr / 1000).toFixed(1)} kN (SF = {sf.toFixed(2)})
          </span>
        </div>
      </div>
    );
  }

  // 6. BEAM DEFLECTION
  if (schemaId === 'mech-beam-deflection') {
    const L = Number(inputs.length || 2000);
    const F = Number(inputs.force || 5000);
    const fMax = outputs.deflection ? Number(outputs.deflection) : 4.2;
    const mMax = outputs.maxBendingMoment ? Number(outputs.maxBendingMoment) : ((F * (L / 1000)) / 4);

    const cy = height * 0.45;
    const xLeft = 35;
    const xRight = width - 35;
    const span = xRight - xLeft;
    const maxDeflPx = isCompact ? 16 : 24;

    const pts: string[] = [];
    for (let i = 0; i <= 30; i++) {
      const frac = i / 30;
      const x = xLeft + frac * span;
      // Simply supported point load curve
      const y = cy + 4 * maxDeflPx * frac * (1 - frac);
      pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    }

    const xMid = (xLeft + xRight) / 2;

    return (
      <div className={`relative bg-[var(--bg-0)] border border-cyan-950/60 rounded-lg overflow-hidden flex flex-col items-center justify-center p-1.5 ${className}`}>
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full select-none font-mono">
          {/* Undeformed neutral axis */}
          <line x1={xLeft} y1={cy} x2={xRight} y2={cy} stroke="#334155" strokeWidth="1" strokeDasharray="3 3" />

          {/* Deflection curve */}
          <polyline points={pts.join(' ')} fill="none" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" />

          {/* Supports */}
          <polygon points={`${xLeft-8},${cy+10} ${xLeft+8},${cy+10} ${xLeft},${cy}`} fill="#1e293b" stroke="#64748b" strokeWidth="1" />
          <polygon points={`${xRight-8},${cy+10} ${xRight+8},${cy+10} ${xRight},${cy}`} fill="#1e293b" stroke="#64748b" strokeWidth="1" />

          {/* Load Arrow F */}
          <line x1={xMid} y1={cy - 26} x2={xMid} y2={cy - 4} stroke="#f43f5e" strokeWidth="2.5" />
          <polygon points={`${xMid},${cy - 2} ${xMid - 4},${cy - 8} ${xMid + 4},${cy - 8}`} fill="#f43f5e" />
          <text x={xMid} y={cy - 30} fill="#f43f5e" fontSize="9" fontWeight="bold" textAnchor="middle">
            F = {(F / 1000).toFixed(1)} kN
          </text>

          {/* Max deflection badge */}
          <text x={xMid} y={cy + maxDeflPx + 14} fill="#38bdf8" fontSize="8" textAnchor="middle">
            f_max = {fMax.toFixed(2)} mm (M_max = {mMax.toFixed(0)} N·m)
          </text>
        </svg>

        <div className="absolute top-1.5 left-2 flex items-center gap-1.5 text-[8px] font-mono">
          <span className="px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-bold">
            Kiriş L = {L} mm
          </span>
        </div>
      </div>
    );
  }

  // 7. HYDRAULIC CYLINDER
  if (schemaId === 'mech-hydraulic-cylinder') {
    const D = Number(inputs.boreDiameter || 80);
    const d = Number(inputs.rodDiameter || 45);
    const p = Number(inputs.pressureBar || 160);
    const pushF = outputs.pushForceKn ? Number(outputs.pushForceKn) : ((Math.PI * (D/2)**2 * p * 0.1) / 1000);
    const pullF = outputs.pullForceKn ? Number(outputs.pullForceKn) : (((Math.PI * (D/2)**2 - Math.PI * (d/2)**2) * p * 0.1) / 1000);

    const cy = height / 2;
    const barrelX = 35;
    const barrelW = width * 0.52;
    const barrelH = isCompact ? 36 : 48;
    const rodH = Math.max(12, barrelH * (d / D));
    const rodLen = width * 0.35;

    return (
      <div className={`relative bg-[var(--bg-0)] border border-cyan-950/60 rounded-lg overflow-hidden flex flex-col items-center justify-center p-1.5 ${className}`}>
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full select-none font-mono">
          {/* Cylinder Barrel */}
          <rect x={barrelX} y={cy - barrelH / 2} width={barrelW} height={barrelH} rx="2" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.5" />

          {/* Fluid chamber (hydraulic blue) */}
          <rect x={barrelX + 4} y={cy - barrelH / 2 + 4} width={barrelW * 0.6} height={barrelH - 8} fill="#0284c7" fillOpacity="0.25" />

          {/* Piston head */}
          <rect x={barrelX + barrelW * 0.6} y={cy - barrelH / 2 + 2} width="10" height={barrelH - 4} fill="#64748b" stroke="#94a3b8" strokeWidth="1" />

          {/* Piston Rod */}
          <rect x={barrelX + barrelW * 0.6 + 10} y={cy - rodH / 2} width={rodLen} height={rodH} fill="#94a3b8" stroke="#cbd5e1" strokeWidth="1" />

          {/* Fluid Ports */}
          <rect x={barrelX + 10} y={cy - barrelH / 2 - 6} width="8" height="6" fill="#38bdf8" />
          <rect x={barrelX + barrelW - 18} y={cy - barrelH / 2 - 6} width="8" height="6" fill="#38bdf8" />

          {/* Dimension Labels */}
          <text x={barrelX + barrelW / 2} y={cy + barrelH / 2 + 12} fill="#94a3b8" fontSize="8" textAnchor="middle">
            Gövde Ø{D} mm · Mil Ø{d} mm ({p} bar)
          </text>
        </svg>

        <div className="absolute top-1.5 left-2 flex items-center gap-1.5 text-[8px] font-mono">
          <span className="px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-bold">
            İtme: {pushF.toFixed(1)} kN
          </span>
          <span className="px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-bold">
            Çekme: {pullF.toFixed(1)} kN
          </span>
        </div>
      </div>
    );
  }

  // 8. WELD JOINT EN 1993-1-8
  if (schemaId === 'mech-weld-joint') {
    const a = Number(inputs.throatThickness || 5);
    const L = Number(inputs.weldLength || 100);
    const F = Number(inputs.forceN || 30000);
    const sf = outputs.safetyFactor ? Number(outputs.safetyFactor) : 1.45;
    const isSafe = sf >= 1.0;

    const cx = width / 2;
    const cy = height / 2 + 5;

    return (
      <div className={`relative bg-[var(--bg-0)] border border-cyan-950/60 rounded-lg overflow-hidden flex flex-col items-center justify-center p-1.5 ${className}`}>
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full select-none font-mono">
          {/* Base plate (horizontal) */}
          <rect x={cx - 70} y={cy} width="140" height="20" fill="#1e293b" stroke="#475569" strokeWidth="1" />

          {/* Attached plate (vertical T) */}
          <rect x={cx - 10} y={cy - 60} width="20" height="60" fill="#1e293b" stroke="#475569" strokeWidth="1" />

          {/* Fillet weld right triangle (throat a) */}
          <path d={`M ${cx + 10} ${cy} L ${cx + 30} ${cy} L ${cx + 10} ${cy - 20} Z`} fill="#f59e0b" fillOpacity="0.4" stroke="#f59e0b" strokeWidth="1.2" />

          {/* Fillet weld left triangle */}
          <path d={`M ${cx - 10} ${cy} L ${cx - 30} ${cy} L ${cx - 10} ${cy - 20} Z`} fill="#f59e0b" fillOpacity="0.4" stroke="#f59e0b" strokeWidth="1.2" />

          {/* Throat dimension line 'a' */}
          <line x1={cx + 10} y1={cy} x2={cx + 20} y2={cy - 10} stroke="#38bdf8" strokeWidth="1" strokeDasharray="2 1" />
          <text x={cx + 34} y={cy - 10} fill="#38bdf8" fontSize="8">a={a}mm</text>

          {/* Force arrow F */}
          <line x1={cx} y1={cy - 75} x2={cx} y2={cy - 62} stroke="#f43f5e" strokeWidth="2.5" />
          <polygon points={`${cx},${cy - 60} ${cx - 4},${cy - 67} ${cx + 4},${cy - 67}`} fill="#f43f5e" />
          <text x={cx + 8} y={cy - 70} fill="#f43f5e" fontSize="8" fontWeight="bold">F={(F/1000).toFixed(1)}kN</text>
        </svg>

        <div className="absolute top-1.5 left-2 flex items-center gap-1.5 text-[8px] font-mono">
          <span className="px-1.5 py-0.5 rounded bg-amber-950/80 border border-amber-500/40 text-amber-300 font-bold">
            Köşe Kaynak a={a}mm · L={L}mm
          </span>
          <span className={`px-1.5 py-0.5 rounded border font-bold ${isSafe ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300' : 'bg-red-950/80 border-red-500/40 text-red-300'}`}>
            SF = {sf.toFixed(2)}
          </span>
        </div>
      </div>
    );
  }

  // 9. BOLT STRESS VDI 2230
  if (schemaId === 'mech-bolt-stress') {
    const dia = Number(inputs.diameter || 12);
    const pitch = Number(inputs.pitch || 1.75);
    const force = Number(inputs.clampingForce || 25000);
    const torque = outputs.tighteningTorque ? Number(outputs.tighteningTorque) : 85;

    const cx = width / 2;
    const cy = height / 2;
    const headW = dia * 2.2;
    const headH = dia * 1.0;
    const shankW = dia * 1.3;
    const shankL = 60;

    return (
      <div className={`relative bg-[var(--bg-0)] border border-cyan-950/60 rounded-lg overflow-hidden flex flex-col items-center justify-center p-1.5 ${className}`}>
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full select-none font-mono">
          {/* Clamped joint plates */}
          <rect x={cx - 50} y={cy - 12} width="100" height="12" fill="#1e293b" stroke="#475569" strokeWidth="0.8" />
          <rect x={cx - 50} y={cy} width="100" height="12" fill="#0f172a" stroke="#475569" strokeWidth="0.8" />

          {/* Bolt Shank */}
          <rect x={cx - shankW / 2} y={cy - 20} width={shankW} height={shankL} fill="#334155" stroke="#94a3b8" strokeWidth="1" />

          {/* Threads */}
          {Array.from({ length: 8 }).map((_, idx) => (
            <line key={idx} x1={cx - shankW / 2} y1={cy + idx * 4} x2={cx + shankW / 2} y2={cy + idx * 4 + 2} stroke="#64748b" strokeWidth="1" />
          ))}

          {/* Bolt Head */}
          <polygon points={`${cx - headW / 2},${cy - 20} ${cx + headW / 2},${cy - 20} ${cx + headW / 2 - 3},${cy - 20 - headH} ${cx - headW / 2 + 3},${cy - 20 - headH}`} fill="#475569" stroke="#94a3b8" strokeWidth="1" />

          {/* Nut at bottom */}
          <polygon points={`${cx - headW / 2 + 2},${cy + 16} ${cx + headW / 2 - 2},${cy + 16} ${cx + headW / 2},${cy + 28} ${cx - headW / 2},${cy + 28}`} fill="#475569" stroke="#94a3b8" strokeWidth="1" />

          {/* Preload force arrows */}
          <line x1={cx - 30} y1={cy - 16} x2={cx - 30} y2={cy - 4} stroke="#38bdf8" strokeWidth="1.5" />
          <line x1={cx + 30} y1={cy - 16} x2={cx + 30} y2={cy - 4} stroke="#38bdf8" strokeWidth="1.5" />
        </svg>

        <div className="absolute top-1.5 left-2 flex items-center gap-1.5 text-[8px] font-mono">
          <span className="px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-bold">
            M{Math.round(dia)}x{pitch}
          </span>
          <span className="px-1.5 py-0.5 rounded bg-amber-950/80 border border-amber-500/40 text-amber-300 font-bold">
            M_A = {torque.toFixed(1)} N·m (F_M = {(force/1000).toFixed(1)} kN)
          </span>
        </div>
      </div>
    );
  }

  // 10. COMPRESSION SPRING
  if (schemaId === 'mech-spring') {
    const d = Number(inputs.wireDiameter || 4);
    const D = Number(inputs.outerDiameter || 32);
    const n = Number(inputs.activeCoils || 8);
    const L0 = Number(inputs.freeLength || 80);
    const kRate = outputs.springRate ? Number(outputs.springRate) : 18.5;

    const cx = width / 2;
    const cy = height / 2;
    const rMean = 18;
    const coilH = 70;
    const numCoils = Math.min(Math.max(n, 4), 12);
    const stepY = coilH / numCoils;

    // Helical spring zigzag path
    let path = `M ${cx - rMean} ${cy - coilH / 2} `;
    for (let i = 0; i < numCoils; i++) {
      const y1 = cy - coilH / 2 + i * stepY;
      const y2 = y1 + stepY / 2;
      const y3 = y1 + stepY;
      path += `L ${cx + rMean} ${y2.toFixed(1)} L ${cx - rMean} ${y3.toFixed(1)} `;
    }

    return (
      <div className={`relative bg-[var(--bg-0)] border border-cyan-950/60 rounded-lg overflow-hidden flex flex-col items-center justify-center p-1.5 ${className}`}>
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full select-none font-mono">
          {/* Spring coil path */}
          <path d={path} fill="none" stroke="#38bdf8" strokeWidth={Math.max(2, d * 0.8)} strokeLinecap="round" strokeLinejoin="round" />

          {/* Centerline */}
          <line x1={cx} y1={cy - coilH / 2 - 10} x2={cx} y2={cy + coilH / 2 + 10} stroke="#334155" strokeWidth="0.8" strokeDasharray="3 2" />

          {/* End caps */}
          <line x1={cx - rMean - 4} y1={cy - coilH / 2} x2={cx + rMean + 4} y2={cy - coilH / 2} stroke="#94a3b8" strokeWidth="2" />
          <line x1={cx - rMean - 4} y1={cy + coilH / 2} x2={cx + rMean + 4} y2={cy + coilH / 2} stroke="#94a3b8" strokeWidth="2" />

          {/* Free length label */}
          <line x1={cx + rMean + 12} y1={cy - coilH / 2} x2={cx + rMean + 12} y2={cy + coilH / 2} stroke="#64748b" strokeWidth="0.8" />
          <text x={cx + rMean + 16} y={cy + 3} fill="#94a3b8" fontSize="8" textAnchor="start">
            L₀ = {L0} mm
          </text>
        </svg>

        <div className="absolute top-1.5 left-2 flex items-center gap-1.5 text-[8px] font-mono">
          <span className="px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-bold">
            d={d}mm · D_dış={D}mm (n={n})
          </span>
          <span className="px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-bold">
            k = {kRate.toFixed(2)} N/mm
          </span>
        </div>
      </div>
    );
  }

  // 11. PRESSURE VESSEL
  if (schemaId === 'mech-pressure-vessel' || schemaId === 'mech-pressure-vessel-code') {
    const D = Number(inputs.innerDiameter || 1000);
    const P = Number(inputs.designPressureMpa || inputs.internalPressure || 1.6);
    const t = outputs.minWallThickness ? Number(outputs.minWallThickness) : Number(inputs.wallThickness || 12);
    const hoop = outputs.hoopStress ? Number(outputs.hoopStress) : ((P * D) / (2 * Math.max(1, t)));

    const cx = width / 2;
    const cy = height / 2;
    const rInner = isCompact ? 34 : 45;
    const rOuter = rInner + Math.max(4, t * 0.6);

    return (
      <div className={`relative bg-[var(--bg-0)] border border-cyan-950/60 rounded-lg overflow-hidden flex flex-col items-center justify-center p-1.5 ${className}`}>
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full select-none font-mono">
          {/* Vessel Wall */}
          <circle cx={cx} cy={cy} r={rOuter} fill="#1e293b" stroke="#38bdf8" strokeWidth="1.2" />
          <circle cx={cx} cy={cy} r={rInner} fill="#061222" stroke="#0284c7" strokeWidth="1" />

          {/* Internal Pressure radial arrows */}
          {Array.from({ length: 8 }).map((_, i) => {
            const angle = (i * Math.PI) / 4;
            const x1 = cx + Math.cos(angle) * (rInner * 0.3);
            const y1 = cy + Math.sin(angle) * (rInner * 0.3);
            const x2 = cx + Math.cos(angle) * (rInner * 0.85);
            const y2 = cy + Math.sin(angle) * (rInner * 0.85);
            return (
              <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#38bdf8" strokeWidth="1.2" markerEnd="url(#arrowCyan)" />
            );
          })}

          <text x={cx} y={cy + 3} fill="#38bdf8" fontSize="9" fontWeight="bold" textAnchor="middle">
            P = {P} MPa
          </text>
        </svg>

        <div className="absolute top-1.5 left-2 flex items-center gap-1.5 text-[8px] font-mono">
          <span className="px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-bold">
            Ø{D} mm · t = {t.toFixed(1)} mm
          </span>
          <span className="px-1.5 py-0.5 rounded bg-amber-950/80 border border-amber-500/40 text-amber-300 font-bold">
            σ_θ = {hoop.toFixed(1)} MPa
          </span>
        </div>
      </div>
    );
  }

  // 12. SHAFT DESIGN & TORSION
  if (schemaId === 'mech-shaft' || schemaId === 'mech-torsion') {
    const d = Number(inputs.diameter || 40);
    const T = Number(inputs.torque || 350);
    const L = Number(inputs.length || 600);
    const tau = outputs.shearStressMpa ? Number(outputs.shearStressMpa) : ((16 * T * 1000) / (Math.PI * d**3));

    const cx = width / 2;
    const cy = height / 2;
    const shaftW = width * 0.65;
    const shaftH = isCompact ? 28 : 36;

    return (
      <div className={`relative bg-[var(--bg-0)] border border-cyan-950/60 rounded-lg overflow-hidden flex flex-col items-center justify-center p-1.5 ${className}`}>
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full select-none font-mono">
          {/* Stepped Shaft */}
          <rect x={cx - shaftW / 2} y={cy - shaftH / 2} width={shaftW} height={shaftH} rx="1" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.2" />

          {/* Keyway DIN 6885 */}
          <rect x={cx - shaftW * 0.25} y={cy - shaftH / 2 + 2} width={shaftW * 0.5} height={shaftH * 0.25} fill="#090d16" stroke="#64748b" strokeWidth="0.8" />

          {/* Centerline */}
          <line x1={cx - shaftW / 2 - 12} y1={cy} x2={cx + shaftW / 2 + 12} y2={cy} stroke="#38bdf8" strokeWidth="0.8" strokeDasharray="3 2" />

          {/* Torsion curl indicator */}
          <path d={`M ${cx + shaftW / 2 + 6} ${cy - 12} A 12 12 0 1 1 ${cx + shaftW / 2 + 6} ${cy + 12}`} fill="none" stroke="#f59e0b" strokeWidth="2" />
          <polygon points={`${cx + shaftW / 2 + 4},${cy + 14} ${cx + shaftW / 2 + 10},${cy + 8} ${cx + shaftW / 2 + 8},${cy + 15}`} fill="#f59e0b" />
        </svg>

        <div className="absolute top-1.5 left-2 flex items-center gap-1.5 text-[8px] font-mono">
          <span className="px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-bold">
            Ø{d} mm · L={L} mm
          </span>
          <span className="px-1.5 py-0.5 rounded bg-amber-950/80 border border-amber-500/40 text-amber-300 font-bold">
            T = {T} N·m (τ = {tau.toFixed(1)} MPa)
          </span>
        </div>
      </div>
    );
  }

  // 13. SHEET METAL BENDING
  if (schemaId === 'mech-sheet-metal') {
    const t = Number(inputs.thickness || 2.5);
    const r = Number(inputs.innerRadius || 3.0);
    const angle = Number(inputs.bendAngle || 90);
    const ba = outputs.bendAllowance ? Number(outputs.bendAllowance) : 5.8;

    const cx = width / 2;
    const cy = height / 2 + 10;

    return (
      <div className={`relative bg-[var(--bg-0)] border border-cyan-950/60 rounded-lg overflow-hidden flex flex-col items-center justify-center p-1.5 ${className}`}>
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full select-none font-mono">
          {/* L-flange sheet metal cross section */}
          <path
            d={`M ${cx - 50} ${cy} L ${cx - 5} ${cy} A ${r + t * 4} ${r + t * 4} 0 0 0 ${cx + 15} ${cy - 20} L ${cx + 15} ${cy - 55}`}
            fill="none"
            stroke="#38bdf8"
            strokeWidth={Math.max(3, t * 2)}
            strokeLinecap="round"
          />

          <text x={cx} y={cy + 16} fill="#94a3b8" fontSize="8" textAnchor="middle">
            t = {t} mm · r = {r} mm ({angle}°)
          </text>
        </svg>

        <div className="absolute top-1.5 left-2 flex items-center gap-1.5 text-[8px] font-mono">
          <span className="px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-bold">
            Büküm Payı (BA) = {ba.toFixed(2)} mm
          </span>
        </div>
      </div>
    );
  }

  // 14. CAD DXF OUTPUT PREVIEW
  const dxfContent = outputs.dxfFile || outputs.dxf || outputs.dxf_out;
  if (typeof dxfContent === 'string' && dxfContent.includes('SECTION')) {
    const dxfSvg = dxfToSvgPreview(dxfContent, width - 10, height - 10);
    return (
      <div className={`relative bg-[var(--bg-0)] border border-cyan-950/60 rounded-lg overflow-hidden flex flex-col items-center justify-center p-1.5 ${className}`}>
        <div dangerouslySetInnerHTML={{ __html: dxfSvg }} className="w-full h-full" />
        <div className="absolute top-1.5 left-2 text-[8px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-bold">
          CAD R12 Çıktı
        </div>
      </div>
    );
  }

  // 15. GEOMETRIC CROSS-SECTIONS (EN 10034, EN 10219, EN 10210, EN 10056, EN 10279)
  if (
    schemaId === 'geom-i-beam' ||
    schemaId === 'geom-rhs-tube' ||
    schemaId === 'geom-chs-pipe' ||
    schemaId === 'geom-l-angle' ||
    schemaId === 'geom-c-channel' ||
    schemaId === 'geom-solid-section' ||
    Boolean(outputs.profile && outputs.svg)
  ) {
    const svgPath = String(outputs.svg || outputs.profile?.svgPath || '');
    const area = Number(outputs.area ?? outputs.profile?.area ?? 0);
    const ix = Number(outputs.ix ?? outputs.profile?.ix ?? 0);
    const wx = Number(outputs.wx ?? outputs.profile?.wx ?? 0);
    const mass = Number(outputs.profile?.massPerMeterKg ?? ((area * 7850) / 1e6));

    const dimH = Number(inputs.h || inputs.H || inputs.a || inputs.d_ext || inputs.height || inputs.diameter || 120);
    const dimW = Number(inputs.b || inputs.B || inputs.d_ext || inputs.width || inputs.diameter || 80);
    const maxDim = Math.max(dimH, dimW, 20);
    const scale = Math.min((width - 60) / maxDim, (height - 35) / maxDim);

    // Centroid offsets for asymmetric profiles
    const offX = schemaId === 'geom-l-angle' || schemaId === 'geom-c-channel'
      ? -(Number(outputs.centroid_x || dimW / 3)) * scale
      : 0;
    const offY = schemaId === 'geom-l-angle'
      ? (Number(outputs.centroid_y || dimH / 3)) * scale
      : 0;

    const cx = width / 2 + offX;
    const cy = height / 2 + offY;

    return (
      <div className={`relative bg-[var(--bg-0)] border border-cyan-950/60 rounded-lg overflow-hidden flex flex-col items-center justify-center p-1.5 ${className}`}>
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full select-none font-mono">
          <defs>
            <radialGradient id="profileGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#082f49" stopOpacity="0.05" />
            </radialGradient>
          </defs>

          {/* Coordinate Center Crosshairs */}
          <line x1={cx - 70} y1={cy} x2={cx + 70} y2={cy} stroke="#1e293b" strokeDasharray="3 2" strokeWidth="0.8" />
          <line x1={cx} y1={cy - 45} x2={cx} y2={cy + 45} stroke="#1e293b" strokeDasharray="3 2" strokeWidth="0.8" />

          {/* Render Profile SVG Path */}
          {svgPath ? (
            <path
              d={svgPath}
              transform={`translate(${cx}, ${cy}) scale(${scale})`}
              fill="url(#profileGlow)"
              fillRule="evenodd"
              stroke="#22d3ee"
              strokeWidth={Math.max(1, 1.6 / Math.max(0.2, scale))}
              strokeLinejoin="round"
            />
          ) : (
            <rect
              x={cx - (dimW * scale) / 2}
              y={cy - (dimH * scale) / 2}
              width={dimW * scale}
              height={dimH * scale}
              fill="url(#profileGlow)"
              stroke="#22d3ee"
              strokeWidth="1.5"
            />
          )}

          {/* Centroid Red Dot */}
          <circle cx={cx} cy={cy} r="2.5" fill="#f43f5e" />
          <circle cx={cx} cy={cy} r="5" fill="none" stroke="#f43f5e" strokeWidth="0.8" strokeDasharray="2 1" />

          {/* Dimensions label */}
          <text x={cx} y={height - 6} fill="#94a3b8" fontSize="8" textAnchor="middle">
            {dimW.toFixed(0)} × {dimH.toFixed(0)} mm {mass > 0 ? `· ${mass.toFixed(1)} kg/m` : ''}
          </text>
        </svg>

        {/* Telemetry pill */}
        <div className="absolute top-1.5 left-2 flex items-center gap-1.5 text-[8px] font-mono">
          <span className="px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-bold">
            A = {area > 0 ? (area / 100).toFixed(1) : '—'} cm²
          </span>
          <span className="px-1.5 py-0.5 rounded bg-slate-900/80 border border-slate-700 text-slate-300">
            Ix = {(ix / 1e4).toFixed(1)} cm⁴ · Wx = {(wx / 1e3).toFixed(1)} cm³
          </span>
        </div>
      </div>
    );
  }

  // 16. METALLURGY & HEAT TREATMENT (ISO 4957 / DIN 17014 / Hollomon-Jaffe)
  if (schemaId === 'mat-heat-treatment') {
    const hrc = Number(outputs.final_hardness_hrc ?? inputs.base_hardness_hrc ?? 36);
    const sy = Number(outputs.final_yield ?? inputs.base_yield ?? 650);
    const su = Number(outputs.final_tensile ?? inputs.base_tensile ?? 850);
    const a5 = Number(outputs.elongation_pct ?? 14);
    const chd = Number(outputs.case_depth_mm ?? 0);
    const temp = Number(inputs.treatment_temp_c ?? 500);
    const processId = Number(inputs.process_type ?? 0);
    const processNames = ['Islah (Q&T)', 'Sementasyon (Case)', 'Nitrürleme', 'Tavlama (Anneal)', 'Yaşlandırma (Aging)'];
    const procName = processNames[processId] || 'Isıl İşlem';

    // Dial gauge angle: 15 HRC -> -120deg, 65 HRC -> 120deg
    const hrcFrac = Math.max(0, Math.min(1, (hrc - 15) / (65 - 15)));
    const angleDeg = -120 + hrcFrac * 240;
    const rad = (angleDeg * Math.PI) / 180;
    const cx = width / 2;
    const cy = height / 2 + 10;
    const dialR = isCompact ? 38 : 50;

    return (
      <div className={`relative bg-[var(--bg-0)] border border-cyan-950/60 rounded-lg overflow-hidden flex flex-col items-center justify-center p-1.5 ${className}`}>
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full select-none font-mono">
          {/* Gauge background arc */}
          <path
            d={`M ${cx - dialR * 0.866} ${cy + dialR * 0.5} A ${dialR} ${dialR} 0 1 1 ${cx + dialR * 0.866} ${cy + dialR * 0.5}`}
            fill="none"
            stroke="#1e293b"
            strokeWidth="7"
            strokeLinecap="round"
          />
          {/* Active color arc */}
          <path
            d={`M ${cx - dialR * 0.866} ${cy + dialR * 0.5} A ${dialR} ${dialR} 0 1 1 ${cx + dialR * 0.866} ${cy + dialR * 0.5}`}
            fill="none"
            stroke="url(#hrcGradient)"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <defs>
            <linearGradient id="hrcGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="60%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#ef4444" />
            </linearGradient>
          </defs>

          {/* Needle */}
          <line
            x1={cx}
            y1={cy}
            x2={cx + Math.cos(rad - Math.PI / 2) * (dialR - 6)}
            y2={cy + Math.sin(rad - Math.PI / 2) * (dialR - 6)}
            stroke="#f43f5e"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle cx={cx} cy={cy} r="4" fill="#f43f5e" />

          {/* Central HRC readout */}
          <text x={cx} y={cy - 8} fill="#22d3ee" fontSize="15" fontWeight="bold" textAnchor="middle">
            {hrc} HRC
          </text>
          <text x={cx} y={cy + 18} fill="#94a3b8" fontSize="8" textAnchor="middle">
            {procName} ({temp}°C)
          </text>
        </svg>

        <div className="absolute top-1.5 left-2 flex items-center gap-1.5 text-[8px] font-mono">
          <span className="px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-bold">
            Sy = {sy} MPa · Su = {su} MPa
          </span>
          <span className="px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-bold">
            A5 = {a5}% {chd > 0 ? `· CHD = ${chd.toFixed(2)}mm` : ''}
          </span>
        </div>
      </div>
    );
  }

  // 17. SDOF HARMONIC VIBRATION & RESONANCE (ISO 10816)
  if (schemaId === 'phys-vibration-sdof') {
    const fn = Number(outputs.fn_hz ?? 12.5);
    const zeta = Number(outputs.damping_ratio ?? 0.05);
    const q = outputs.q_factor !== undefined ? Number(outputs.q_factor) : (1 / (2 * Math.max(0.01, zeta)));

    // Generate resonance response curve
    const x0 = 35;
    const y0 = height - 20;
    const plotW = width - 50;
    const plotH = height - 40;

    const pts: string[] = [];
    for (let i = 0; i <= 50; i++) {
      const r = (i / 50) * 2.5; // frequency ratio r = omega / omega_n
      const denom = Math.sqrt(Math.pow(1 - r * r, 2) + Math.pow(2 * zeta * r, 2));
      const amp = Math.min(6, 1 / Math.max(0.05, denom));
      const px = x0 + (r / 2.5) * plotW;
      const py = y0 - (amp / 6) * plotH;
      pts.push(`${px.toFixed(1)},${py.toFixed(1)}`);
    }

    const peakX = x0 + (1.0 / 2.5) * plotW;

    return (
      <div className={`relative bg-[var(--bg-0)] border border-cyan-950/60 rounded-lg overflow-hidden flex flex-col items-center justify-center p-1.5 ${className}`}>
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full select-none font-mono">
          {/* Coordinate axes */}
          <line x1={x0} y1={y0} x2={x0 + plotW} y2={y0} stroke="#334155" strokeWidth="1" />
          <line x1={x0} y1={y0} x2={x0} y2={y0 - plotH} stroke="#334155" strokeWidth="1" />

          {/* Resonance Peak vertical marker at r = 1.0 */}
          <line x1={peakX} y1={y0} x2={peakX} y2={y0 - plotH} stroke="#f43f5e" strokeWidth="1" strokeDasharray="3 2" />
          <circle cx={peakX} cy={y0 - plotH + 5} r="3" fill="#f43f5e" />

          {/* Amplification Curve */}
          <polyline points={pts.join(' ')} fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />

          {/* Callouts */}
          <text x={peakX + 4} y={y0 - plotH + 10} fill="#f43f5e" fontSize="8" fontWeight="bold">
            Rezonans (r=1.0)
          </text>
          <text x={x0 + plotW} y={y0 + 12} fill="#64748b" fontSize="7" textAnchor="end">
            Frekans Oranı (ω/ωn)
          </text>
        </svg>

        <div className="absolute top-1.5 left-2 flex items-center gap-1.5 text-[8px] font-mono">
          <span className="px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-bold">
            fn = {fn.toFixed(2)} Hz
          </span>
          <span className="px-1.5 py-0.5 rounded bg-amber-950/80 border border-amber-500/40 text-amber-300 font-bold">
            ζ = {zeta.toFixed(3)} · Q = {q.toFixed(1)}
          </span>
        </div>
      </div>
    );
  }

  // 18. IUPAC PERIODIC TABLE ELEMENT
  if (schemaId === 'chem-element') {
    const symbol = String(outputs.symbol || inputs.element || 'Fe');
    const z = Number(outputs.atomic_number || 26);
    const name = String(outputs.name || 'Demir');
    const mass = Number(outputs.mass || 55.845);
    const en = Number(outputs.electronegativity || 1.83);
    const phase = String(outputs.phase || 'Solid');

    return (
      <div className={`relative bg-[var(--bg-0)] border border-cyan-950/60 rounded-lg overflow-hidden flex flex-col items-center justify-center p-2 ${className}`}>
        <div className="w-28 h-28 rounded-lg bg-gradient-to-br from-[var(--bg-2)] to-[var(--bg-0)] border-2 border-cyan-400/50 flex flex-col justify-between p-2 font-mono">
          <div className="flex items-center justify-between text-[10px] text-cyan-400">
            <span className="font-bold">{z}</span>
            <span className="text-[8px] text-slate-400">{mass.toFixed(2)}</span>
          </div>
          <div className="text-center font-bold text-3xl text-cyan-200 tracking-wider">
            {symbol}
          </div>
          <div className="flex items-center justify-between text-[8px] text-slate-400">
            <span className="truncate max-w-[55px]">{name}</span>
            <span className="text-emerald-400">χ={en}</span>
          </div>
        </div>

        <div className="absolute top-1.5 left-2 text-[8px] font-mono px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-bold">
          IUPAC Element · Faz: {phase}
        </div>
      </div>
    );
  }

  // 19. REAL GAS LAWS & COMPRESSIBILITY Z
  if (schemaId === 'chem-gas-laws') {
    const rawZ = Number(outputs.Z_compressibility);
    const z = Number.isFinite(rawZ) ? rawZ : 0.985;
    const pIdeal = Number.isFinite(Number(outputs.P_ideal_bar ?? outputs.pressure_ideal_kpa))
      ? Number(outputs.P_ideal_bar ?? outputs.pressure_ideal_kpa)
      : 101.3;
    const pVdw = Number.isFinite(Number(outputs.P_vdw_bar ?? outputs.pressure_vdw_kpa))
      ? Number(outputs.P_vdw_bar ?? outputs.pressure_vdw_kpa)
      : 100.8;
    const deviation = ((z - 1.0) * 100).toFixed(2);

    const cx = width / 2;
    const cy = height / 2 + 5;
    const barW = width * 0.65;
    // Z from 0.7 to 1.3 mapped across barW
    const zFrac = Math.max(0, Math.min(1, (z - 0.7) / (1.3 - 0.7)));
    const needleX = cx - barW / 2 + zFrac * barW;

    return (
      <div className={`relative bg-[var(--bg-0)] border border-cyan-950/60 rounded-lg overflow-hidden flex flex-col items-center justify-center p-1.5 ${className}`}>
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full select-none font-mono">
          {/* Base gauge bar */}
          <rect x={cx - barW / 2} y={cy - 6} width={barW} height="12" rx="3" fill="#0f172a" stroke="#334155" />

          {/* Ideal center line (Z = 1.0) */}
          <line x1={cx} y1={cy - 12} x2={cx} y2={cy + 12} stroke="#38bdf8" strokeWidth="1.5" />
          <text x={cx} y={cy - 15} fill="#38bdf8" fontSize="8" textAnchor="middle">İdeal (Z=1.0)</text>

          {/* Current Z Needle */}
          <polygon
            points={`${needleX},${cy - 8} ${needleX - 4},${cy - 16} ${needleX + 4},${cy - 16}`}
            fill="#f59e0b"
          />
          <line x1={needleX} y1={cy - 8} x2={needleX} y2={cy + 8} stroke="#f59e0b" strokeWidth="2" />

          {/* Readout */}
          <text x={cx} y={cy + 25} fill="#cbd5e1" fontSize="9" fontWeight="bold" textAnchor="middle">
            Sıkıştırılabilirlik Z = {z.toFixed(4)} ({Number(deviation) >= 0 ? `+${deviation}` : deviation}%)
          </text>
        </svg>

        <div className="absolute top-1.5 left-2 flex items-center gap-1.5 text-[8px] font-mono">
          <span className="px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-bold">
            P_ideal: {pIdeal.toFixed(1)} kPa
          </span>
          <span className="px-1.5 py-0.5 rounded bg-amber-950/80 border border-amber-500/40 text-amber-300 font-bold">
            P_vdw: {pVdw.toFixed(1)} kPa
          </span>
        </div>
      </div>
    );
  }

  // 20. CHEMICAL SOLUTION & pH METER
  if (schemaId === 'chem-solution-ph' || schemaId === 'chem-concentration-ph') {
    const ph = Number(outputs.ph ?? inputs.ph ?? 7.0);
    const poh = Number(outputs.poh ?? (14 - ph));
    const hConc = outputs.h_conc_molar !== undefined ? Number(outputs.h_conc_molar) : Math.pow(10, -ph);

    const cx = width / 2;
    const cy = height / 2 + 5;
    const barW = width * 0.72;
    const phFrac = Math.max(0, Math.min(1, ph / 14));
    const needleX = cx - barW / 2 + phFrac * barW;

    const regimeLabel = ph < 6.5 ? 'Asidik Çözelti' : ph > 7.5 ? 'Bazik Çözelti' : 'Nötr pH';

    return (
      <div className={`relative bg-[var(--bg-0)] border border-cyan-950/60 rounded-lg overflow-hidden flex flex-col items-center justify-center p-1.5 ${className}`}>
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full select-none font-mono">
          <defs>
            <linearGradient id="phSpectrum" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="35%" stopColor="#f59e0b" />
              <stop offset="50%" stopColor="#10b981" />
              <stop offset="65%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>

          {/* pH rainbow bar */}
          <rect x={cx - barW / 2} y={cy - 6} width={barW} height="12" rx="3" fill="url(#phSpectrum)" stroke="#334155" />

          {/* 0, 7, 14 marks */}
          <text x={cx - barW / 2} y={cy + 16} fill="#ef4444" fontSize="7">0 (Asit)</text>
          <text x={cx} y={cy + 16} fill="#10b981" fontSize="7" textAnchor="middle">7 (Nötr)</text>
          <text x={cx + barW / 2} y={cy + 16} fill="#8b5cf6" fontSize="7" textAnchor="end">14 (Baz)</text>

          {/* Needle Indicator */}
          <polygon
            points={`${needleX},${cy - 8} ${needleX - 4},${cy - 16} ${needleX + 4},${cy - 16}`}
            fill="#ffffff"
          />
          <line x1={needleX} y1={cy - 8} x2={needleX} y2={cy + 8} stroke="#ffffff" strokeWidth="2" />

          {/* Central digital value */}
          <text x={cx} y={cy - 20} fill="#ffffff" fontSize="12" fontWeight="bold" textAnchor="middle">
            pH = {ph.toFixed(2)} ({regimeLabel})
          </text>
        </svg>

        <div className="absolute top-1.5 left-2 flex items-center gap-1.5 text-[8px] font-mono">
          <span className="px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-bold">
            pOH = {poh.toFixed(2)}
          </span>
          <span className="px-1.5 py-0.5 rounded bg-slate-900/80 border border-slate-700 text-slate-300">
            [H⁺] = {hConc < 0.001 ? hConc.toExponential(2) : hConc.toFixed(4)} M
          </span>
        </div>
      </div>
    );
  }

  // 21. KINEMATICS & TRAJECTORY (ISO 80000-3)
  if (schemaId === 'phys-kinematics') {
    const v0 = Number(inputs.v0 || 20);
    const theta = Number(inputs.angle_deg || 45);
    const hMax = Number(outputs.apex_height || 10.2);
    const range = Number(outputs.range_2d || 40.8);
    const vFinal = Number(outputs.v_final || v0);

    const x0 = 35;
    const y0 = height - 20;
    const trajW = width - 70;
    const trajH = height - 40;

    // Parabolic arc path
    const pts: string[] = [];
    for (let i = 0; i <= 30; i++) {
      const frac = i / 30;
      const px = x0 + frac * trajW;
      const py = y0 - 4 * frac * (1 - frac) * trajH;
      pts.push(`${px.toFixed(1)},${py.toFixed(1)}`);
    }

    return (
      <div className={`relative bg-[var(--bg-0)] border border-cyan-950/60 rounded-lg overflow-hidden flex flex-col items-center justify-center p-1.5 ${className}`}>
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full select-none font-mono">
          {/* Ground level */}
          <line x1={x0 - 10} y1={y0} x2={x0 + trajW + 15} y2={y0} stroke="#334155" strokeWidth="1" />

          {/* Trajectory Parabola */}
          <polyline points={pts.join(' ')} fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />

          {/* Velocity Vector Arrow */}
          <line x1={x0} y1={y0} x2={x0 + 20} y2={y0 - 20} stroke="#f59e0b" strokeWidth="2" />
          <polygon points={`${x0 + 20},${y0 - 20} ${x0 + 13},${y0 - 18} ${x0 + 18},${y0 - 13}`} fill="#f59e0b" />
          <text x={x0 + 24} y={y0 - 18} fill="#f59e0b" fontSize="8">v₀={v0}m/s ({theta}°)</text>

          {/* Apex marker */}
          <line x1={x0 + trajW / 2} y1={y0} x2={x0 + trajW / 2} y2={y0 - trajH} stroke="#f43f5e" strokeWidth="0.8" strokeDasharray="2 2" />
          <circle cx={x0 + trajW / 2} cy={y0 - trajH} r="2.5" fill="#f43f5e" />
          <text x={x0 + trajW / 2} y={y0 - trajH - 4} fill="#f43f5e" fontSize="7" textAnchor="middle">
            H_max={hMax.toFixed(1)}m
          </text>

          {/* Range marker */}
          <text x={x0 + trajW / 2} y={y0 + 12} fill="#94a3b8" fontSize="8" textAnchor="middle">
            Menzil R = {range.toFixed(1)} m
          </text>
        </svg>

        <div className="absolute top-1.5 left-2 flex items-center gap-1.5 text-[8px] font-mono">
          <span className="px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-bold">
            v_son = {vFinal.toFixed(1)} m/s
          </span>
        </div>
      </div>
    );
  }

  // 22. DYNAMICS & INCLINED PLANE (ISO 80000-4)
  if (schemaId === 'phys-dynamics-friction') {
    const m = Number(inputs.mass || 50);
    const theta = Number(inputs.angle_deg || 15);
    const a = Number(outputs.accel_net || outputs.acceleration || 0);
    const nForce = Number(outputs.normal_force || (m * 9.80665 * Math.cos((theta * Math.PI) / 180)));
    const fApplied = Number(inputs.force_applied || 300);

    const xLeft = 30;
    const yBot = height - 20;
    const wedgeW = width - 70;
    const wedgeH = isCompact ? 40 : 55;

    return (
      <div className={`relative bg-[var(--bg-0)] border border-cyan-950/60 rounded-lg overflow-hidden flex flex-col items-center justify-center p-1.5 ${className}`}>
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full select-none font-mono">
          {/* Inclined Wedge */}
          <polygon
            points={`${xLeft},${yBot} ${xLeft + wedgeW},${yBot} ${xLeft + wedgeW},${yBot - wedgeH}`}
            fill="#1e293b"
            stroke="#475569"
            strokeWidth="1.2"
          />

          {/* Angle theta */}
          <text x={xLeft + 20} y={yBot - 4} fill="#cbd5e1" fontSize="8">θ={theta}°</text>

          {/* Sliding Block */}
          <g transform={`translate(${xLeft + wedgeW * 0.5}, ${yBot - wedgeH * 0.5}) rotate(${-Math.atan2(wedgeH, wedgeW) * 180 / Math.PI})`}>
            <rect x="-15" y="-18" width="30" height="18" fill="#0284c7" stroke="#38bdf8" strokeWidth="1" />
            <text x="0" y="-7" fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle">{m}kg</text>

            {/* Normal Force N */}
            <line x1="0" y1="-18" x2="0" y2="-32" stroke="#38bdf8" strokeWidth="1.5" />
            <polygon points="0,-34 -3,-28 3,-28" fill="#38bdf8" />

            {/* Applied Force F */}
            <line x1="15" y1="-9" x2="35" y2="-9" stroke="#f59e0b" strokeWidth="1.5" />
            <polygon points="37,-9 31,-12 31,-6" fill="#f59e0b" />
          </g>

          {/* Telemetry bottom text */}
          <text x={width / 2} y={height - 6} fill="#94a3b8" fontSize="8" textAnchor="middle">
            Normal Kuvvet N = {nForce.toFixed(0)} N · İtme F = {fApplied} N
          </text>
        </svg>

        <div className="absolute top-1.5 left-2 flex items-center gap-1.5 text-[8px] font-mono">
          <span className="px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-bold">
            İvme a = {a.toFixed(2)} m/s²
          </span>
        </div>
      </div>
    );
  }

  // Default fallback: Clean industrial telemetry grid
  return (
    <div className={`relative bg-[var(--bg-0)] border border-slate-800 rounded-lg flex items-center justify-center p-2 text-slate-500 font-mono text-[9px] ${className}`}>
      <div className="text-center space-y-1">
        <div className="text-cyan-400 font-bold uppercase">{schemaId}</div>
        <div>Mühendislik Çözümleyicisi Aktif</div>
      </div>
    </div>
  );
};

