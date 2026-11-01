'use client';

import React, { useId, useMemo, useState } from 'react';
import { t12 } from '@/locales/t12';
import { ISO_273_CLEARANCE } from '@/data/machiningStandards';
import { extractMetricNominal, getFastenerStandardSpecs, type FastenerStandardSpec } from '@/lib/fastener/sharedEngine';
import type { BoltTypeId, BoltHeadDimensions } from '@/data/boltHeadStandards';
import {
  bsppFemaleStations,
  bsppMaleStations,
  nptFemaleStations,
  nptMaleStations,
  nptProfile,
  whitworthProfile,
  lookupNpsm,
  npsmMaleStations,
  npsmFemaleStations,
  type NptSpec,
  type BsppSpec,
  type NpsmSpec,
  type ThreadStation,
} from '@/lib/fastener/pipeThreadStations';
import { iso965Limits, type ThreadLimits } from '@/lib/fastener/iso965';
import { iso68Profile } from '@/lib/fastener/iso68';
import { axialMalePolygon } from '@/lib/fastener/handbookProfile';
import { BoltFemaleSvg1to1, Iso68ProfileDetail } from './boltMmSvg';
import { BoltProductionDrawing } from './boltDrawing/BoltProductionDrawing';
import { PipeNippleDrawing, iso7GaugeLength, type PipeGeom, type PipeLabels } from './boltDrawing/PipeNippleDrawing';
import { ThreadDrawings } from '@/components/visualizers/ThreadDrawings';
import { useScrewMotion } from '@/hooks/useScrewMotion';
import { CrossModuleBridge } from '@/system/crossModuleBridge';
import { Box } from 'lucide-react';
import { useGlobalPrecision, formatEngineeringValue } from '@/components/calculator-kit/precisionUtils';

interface Props {
  results: any;
  size: string;
  length: number;
  lang?: string;
  highlightedField?: string | null;
}

const NPT_SPECS: Record<string, {
  tpi: number; pitch: number; od: number; e0: number; e1: number; e2: number;
  L1: number; L2: number; L4: number; tapDrill: number; handTurns: number; wrenchTurns: number;
}> = {
  '1/16 NPT': { tpi: 27, pitch: 0.941, od: 7.95, e0: 6.884, e1: 7.142, e2: 7.305, L1: 4.06, L2: 6.63, L4: 9.88, tapDrill: 6.15, handTurns: 4.3, wrenchTurns: 2.7 },
  '1/8 NPT': { tpi: 27, pitch: 0.941, od: 10.29, e0: 9.233, e1: 9.489, e2: 9.652, L1: 4.10, L2: 6.70, L4: 9.96, tapDrill: 8.43, handTurns: 4.3, wrenchTurns: 2.8 },
  '1/4 NPT': { tpi: 18, pitch: 1.411, od: 13.72, e0: 12.126, e1: 12.487, e2: 12.763, L1: 5.79, L2: 10.21, L4: 15.11, tapDrill: 11.13, handTurns: 4.1, wrenchTurns: 3.1 },
  '3/8 NPT': { tpi: 18, pitch: 1.411, od: 17.15, e0: 15.545, e1: 15.926, e2: 16.195, L1: 6.10, L2: 10.36, L4: 15.27, tapDrill: 14.27, handTurns: 4.3, wrenchTurns: 3.0 },
  '1/2 NPT': { tpi: 14, pitch: 1.814, od: 21.34, e0: 19.263, e1: 19.772, e2: 20.117, L1: 8.13, L2: 13.56, L4: 19.86, tapDrill: 17.86, handTurns: 4.5, wrenchTurns: 3.0 },
  '3/4 NPT': { tpi: 14, pitch: 1.814, od: 26.67, e0: 24.577, e1: 25.117, e2: 25.451, L1: 8.61, L2: 13.97, L4: 20.17, tapDrill: 23.01, handTurns: 4.7, wrenchTurns: 3.0 },
  '1 NPT': { tpi: 11.5, pitch: 2.209, od: 33.40, e0: 30.825, e1: 31.461, e2: 31.902, L1: 10.16, L2: 17.32, L4: 25.04, tapDrill: 28.98, handTurns: 4.6, wrenchTurns: 3.2 },
  '1-1/4 NPT': { tpi: 11.5, pitch: 2.209, od: 42.16, e0: 39.550, e1: 40.218, e2: 40.671, L1: 10.67, L2: 17.96, L4: 25.68, tapDrill: 37.69, handTurns: 4.8, wrenchTurns: 3.3 },
  '1-1/2 NPT': { tpi: 11.5, pitch: 2.209, od: 48.26, e0: 45.621, e1: 46.287, e2: 46.744, L1: 10.67, L2: 18.36, L4: 26.04, tapDrill: 43.66, handTurns: 4.8, wrenchTurns: 3.5 },
  '2 NPT': { tpi: 11.5, pitch: 2.209, od: 60.33, e0: 57.633, e1: 58.325, e2: 58.839, L1: 11.07, L2: 19.25, L4: 26.92, tapDrill: 55.58, handTurns: 5.0, wrenchTurns: 3.7 },
  '2-1/2 NPT': { tpi: 8, pitch: 3.175, od: 73.03, e0: 69.075, e1: 70.155, e2: 70.866, L1: 17.27, L2: 28.96, L4: 40.08, tapDrill: 66.68, handTurns: 5.4, wrenchTurns: 3.7 },
  '3 NPT': { tpi: 8, pitch: 3.175, od: 88.90, e0: 84.851, e1: 86.068, e2: 86.741, L1: 19.48, L2: 30.48, L4: 41.61, tapDrill: 82.55, handTurns: 6.1, wrenchTurns: 3.5 },
};

const BSPP_SPECS: Record<string, {
  tpi: number; pitch: number; majorDia: number; pitchDia: number; minorDia: number;
  threadLength: number; undercutDia: number; undercutWidth: number; spotfaceDia: number; tapDrill: number;
}> = {
  'G 1/16': { tpi: 28, pitch: 0.907, majorDia: 7.723, pitchDia: 7.142, minorDia: 6.561, threadLength: 6.5, undercutDia: 5.8, undercutWidth: 1.5, spotfaceDia: 12.0, tapDrill: 6.8 },
  'G 1/8': { tpi: 28, pitch: 0.907, majorDia: 9.728, pitchDia: 9.147, minorDia: 8.566, threadLength: 8.0, undercutDia: 7.8, undercutWidth: 2.0, spotfaceDia: 15.0, tapDrill: 8.8 },
  'G 1/4': { tpi: 19, pitch: 1.337, majorDia: 13.157, pitchDia: 12.301, minorDia: 11.445, threadLength: 12.0, undercutDia: 10.5, undercutWidth: 2.5, spotfaceDia: 19.0, tapDrill: 11.8 },
  'G 3/8': { tpi: 19, pitch: 1.337, majorDia: 16.662, pitchDia: 15.806, minorDia: 14.950, threadLength: 12.0, undercutDia: 14.0, undercutWidth: 2.5, spotfaceDia: 23.0, tapDrill: 15.25 },
  'G 1/2': { tpi: 14, pitch: 1.814, majorDia: 20.955, pitchDia: 19.793, minorDia: 18.631, threadLength: 14.0, undercutDia: 17.5, undercutWidth: 3.0, spotfaceDia: 27.0, tapDrill: 19.0 },
  'G 3/4': { tpi: 14, pitch: 1.814, majorDia: 26.441, pitchDia: 25.279, minorDia: 24.117, threadLength: 16.0, undercutDia: 23.0, undercutWidth: 3.0, spotfaceDia: 33.0, tapDrill: 24.5 },
  'G 1': { tpi: 11, pitch: 2.309, majorDia: 33.249, pitchDia: 31.770, minorDia: 30.291, threadLength: 18.0, undercutDia: 29.0, undercutWidth: 3.5, spotfaceDia: 41.0, tapDrill: 30.75 },
  'G 1-1/4': { tpi: 11, pitch: 2.309, majorDia: 41.910, pitchDia: 40.431, minorDia: 38.952, threadLength: 20.0, undercutDia: 37.5, undercutWidth: 3.5, spotfaceDia: 51.0, tapDrill: 39.5 },
  'G 1-1/2': { tpi: 11, pitch: 2.309, majorDia: 47.803, pitchDia: 46.324, minorDia: 44.845, threadLength: 22.0, undercutDia: 43.5, undercutWidth: 3.5, spotfaceDia: 56.0, tapDrill: 45.0 },
  'G 2': { tpi: 11, pitch: 2.309, majorDia: 59.614, pitchDia: 58.135, minorDia: 56.656, threadLength: 24.0, undercutDia: 55.0, undercutWidth: 4.0, spotfaceDia: 69.0, tapDrill: 57.0 },
};

function lookupNpt(size: string): NptSpec {
  const n = size.replace(/\s+/g, ' ').trim();
  if (NPT_SPECS[n]) return NPT_SPECS[n];
  const bare = n.replace(/NPT/gi, '').trim();
  if (NPT_SPECS[`${bare} NPT`]) return NPT_SPECS[`${bare} NPT`];
  const frac = n.match(/(\d+\s+\d+\/\d+|\d+\/\d+|\d+)/);
  if (frac && NPT_SPECS[`${frac[1]} NPT`]) return NPT_SPECS[`${frac[1]} NPT`];
  return NPT_SPECS['1/2 NPT'];
}

function lookupBspp(size: string): BsppSpec {
  const n = size.replace(/\s+/g, ' ').trim();
  if (BSPP_SPECS[n]) return BSPP_SPECS[n];
  const g = n.replace(/^(G|Rp|Rc|R)\s*/i, '').trim();
  if (BSPP_SPECS[`G ${g}`]) return BSPP_SPECS[`G ${g}`];
  return BSPP_SPECS['G 1/2'];
}

const WASHER_7089: Record<string, { id: number; od: number; t: number }> = {
  M3: { id: 3.2, od: 7, t: 0.5 }, M4: { id: 4.3, od: 9, t: 0.8 }, M5: { id: 5.3, od: 10, t: 1.0 },
  M6: { id: 6.4, od: 12, t: 1.6 }, M8: { id: 8.4, od: 16, t: 1.6 }, M10: { id: 10.5, od: 20, t: 2.0 },
  M12: { id: 13, od: 24, t: 2.5 }, M14: { id: 15, od: 28, t: 2.5 }, M16: { id: 17, od: 30, t: 3.0 },
  M18: { id: 19, od: 34, t: 3.0 }, M20: { id: 21, od: 37, t: 3.0 }, M22: { id: 23, od: 39, t: 3.0 },
  M24: { id: 25, od: 44, t: 4.0 }, M27: { id: 28, od: 50, t: 4.0 }, M30: { id: 31, od: 56, t: 4.0 },
  M33: { id: 34, od: 60, t: 5.0 }, M36: { id: 37, od: 66, t: 5.0 }, M42: { id: 43, od: 78, t: 7.0 },
  M48: { id: 50, od: 92, t: 8.0 },
};

function materialForGrade(grade: string, family?: string) {
  switch (grade) {
    case '4.6': return { name: 'S235 / St37 (ISO 898-1)', rm: 400, re: 240 };
    case '4.8': return { name: 'Low Carbon (ISO 898-1)', rm: 420, re: 340 };
    case '5.6': return { name: 'Medium Carbon (ISO 898-1)', rm: 500, re: 300 };
    case '5.8': return { name: 'C15 / C22 (ISO 898-1)', rm: 520, re: 420 };
    case '8.8': return { name: 'C45 QT / 35CrMo (ISO 898-1)', rm: 800, re: 640 };
    case '10.9': return { name: '42CrMo4 QT (ISO 898-1)', rm: 1040, re: 940 };
    case '12.9': return { name: '34CrNiMo6 QT (ISO 898-1)', rm: 1220, re: 1100 };
    case 'Grade 2': return { name: 'SAE J429 Grade 2 (Low/Med Carbon)', rm: 517, re: 393 };
    case 'Grade 5': return { name: 'SAE J429 Grade 5 (Medium Carbon Q&T)', rm: 827, re: 634 };
    case 'Grade 8': return { name: 'SAE J429 Grade 8 (Alloy Steel Q&T)', rm: 1034, re: 896 };
    case 'A325': return { name: 'ASTM A325 (Structural Steel Q&T)', rm: 830, re: 660 };
    case 'A490': return { name: 'ASTM A490 (High Strength Alloy Q&T)', rm: 1035, re: 895 };
    case 'A307': return { name: 'ASTM A307 (Low Carbon Bolting)', rm: 414, re: 240 };
    case 'A193 B7': return { name: 'ASTM A193 B7 (AISI 4140 Q&T)', rm: 860, re: 725 };
    case 'ASTM A105': return { name: 'ASTM A105 (Forged Carbon Steel)', rm: 485, re: 250 };
    case 'A182 F316': return { name: 'ASTM A182 F316 (Forged Stainless Steel)', rm: 515, re: 205 };
    case 'A350 LF2': return { name: 'ASTM A350 LF2 (Low Temp Carbon Steel)', rm: 485, re: 250 };
    case 'Grade B': return { name: 'ASTM A106/A53 Grade B Pipe', rm: 415, re: 240 };
    case 'Grade A': return { name: 'BS 1083 Grade A Mild Steel', rm: 430, re: 250 };
    case 'Grade R': return { name: 'BS 1083 Grade R Medium Carbon Q&T', rm: 700, re: 500 };
    case 'Grade T': return { name: 'BS 1083 Grade T Alloy Steel Q&T', rm: 850, re: 650 };
    case 'Grade V': return { name: 'BS 1083 Grade V High Tensile', rm: 1000, re: 800 };
    case 'A2-70': return { name: 'A2-70 Stainless Steel 304', rm: 700, re: 450 };
    case 'CuSn7': return { name: 'CuSn7Zn4Pb7-C (RG7 Lead Screw Bronze)', rm: 260, re: 120 };
    case 'CuSn12': return { name: 'CuSn12-C (High Load Bronze)', rm: 300, re: 150 };
    default:
      if (family === 'inch') return { name: 'SAE J429 / ASTM A193', rm: 827, re: 634 };
      if (family === 'npt' || family === 'pipe') return { name: 'ASTM A105 / A182', rm: 485, re: 250 };
      if (family === 'bsw') return { name: 'BS 1083 Whitworth Steel', rm: 700, re: 500 };
      return { name: 'ISO 898-1', rm: 800, re: 640 };
  }
}

function filletR(d: number) {
  if (d <= 6) return 0.25;
  if (d <= 10) return 0.4;
  if (d <= 16) return 0.6;
  if (d <= 24) return 0.8;
  return 1.0;
}

type Shop = {
  d: number; p: number; d1: number; d2: number; d3: number; as: number;
  s: number; e: number; k: number; m: number; dh: number; dw: number; tap: number;
  grade: string; L: number; b: number; ls: number; lK: number;
  vanish: number; usefulB: number; chamfer: number; r: number;
  /** VDI 2230 results carried into the joint-section drawing */
  pM: number; pG: number; FM_kN: number;
  H: number; crest: number; rootFlat: number; crestFlat: number;
  nTurn: number; nThread: number; mat: ReturnType<typeof materialForGrade>;
  iso273?: { fine: number; normal: number; coarse: number };
  washer: { id: number; od: number; t: number };
  metricKey: string;
  threadCallout: string;
  tapCallout: string;
  fullyThreaded: boolean;
  lim: ThreadLimits;
  spec: FastenerStandardSpec;
  boltType?: BoltTypeId;
  headDim?: BoltHeadDimensions;
  counterbore?: { dk: number; t: number; da: number };
};

function DimLabel({ x, y, text, color = '#38bdf8', uid }: { x: number; y: number; text: string; color?: string; uid: string }) {
  const w = Math.max(64, text.length * 8.6 + 22);
  return (
    <g>
      <rect x={x - w / 2} y={y - 13} width={w} height={26} rx={5} fill="var(--bg-1)" stroke={color} strokeWidth="1.3" />
      <text
        x={x}
        y={y}
        dominantBaseline="central"
        textAnchor="middle"
        fill="var(--ink, #f8fafc)"
        fontSize="13.5"
        fontWeight="800"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
      >
        {text}
      </text>
    </g>
  );
}

function HDim({ x1, x2, y, label, color = '#38bdf8', uid }: { x1: number; x2: number; y: number; label: string; color?: string; uid: string }) {
  const a = Math.min(x1, x2);
  const b = Math.max(x1, x2);
  return (
    <g>
      <line x1={a} y1={y} x2={b} y2={y} stroke={color} strokeWidth="1.4" markerStart={`url(#${uid}-rev)`} markerEnd={`url(#${uid}-arr)`} />
      <DimLabel x={(a + b) / 2} y={y} text={label} color={color} uid={uid} />
    </g>
  );
}

function VDim({ x, y1, y2, label, color = '#38bdf8', uid }: { x: number; y1: number; y2: number; label: string; color?: string; uid: string }) {
  const a = Math.min(y1, y2);
  const b = Math.max(y1, y2);
  return (
    <g>
      <line x1={x} y1={a} x2={x} y2={b} stroke={color} strokeWidth="1.4" markerStart={`url(#${uid}-rev)`} markerEnd={`url(#${uid}-arr)`} />
      <DimLabel x={x} y={(a + b) / 2} text={label} color={color} uid={uid} />
    </g>
  );
}

function Ext({ x1, y1, x2, y2 }: { x1: number; y1: number; x2: number; y2: number }) {
  return <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--line-strong)" strokeWidth="1.0" />;
}

function DrawingDefs({ uid }: { uid: string }) {
  return (
    <defs>
      <marker id={`${uid}-arr`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto">
        <path d="M 0 1.5 L 9 5 L 0 8.5 Z" fill="var(--cyan)" />
      </marker>
      <marker id={`${uid}-rev`} viewBox="0 0 10 10" refX="1" refY="5" markerWidth="8" markerHeight="8" orient="auto">
        <path d="M 9 1.5 L 1 5 L 9 8.5 Z" fill="var(--cyan)" />
      </marker>
      <linearGradient id={`${uid}-steel`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#334155" />
        <stop offset="25%" stopColor="#475569" />
        <stop offset="60%" stopColor="#1e293b" />
        <stop offset="100%" stopColor="var(--ink)" />
      </linearGradient>
      <linearGradient id={`${uid}-steel-light`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#475569" />
        <stop offset="30%" stopColor="var(--line-strong)" />
        <stop offset="70%" stopColor="#334155" />
        <stop offset="100%" stopColor="#1e293b" />
      </linearGradient>
      <pattern id={`${uid}-hatch`} patternUnits="userSpaceOnUse" width="8" height="8" patternTransform="rotate(45)">
        <line x1="0" y1="0" x2="0" y2="8" stroke="var(--cyan)" strokeWidth="1" opacity="0.3" />
      </pattern>
      <pattern id={`${uid}-hatch2`} patternUnits="userSpaceOnUse" width="8" height="8" patternTransform="rotate(-45)">
        <line x1="0" y1="0" x2="0" y2="8" stroke="var(--warn)" strokeWidth="1" opacity="0.28" />
      </pattern>
      <linearGradient id={`${uid}-flank-lit`} x1="0" y1="1" x2="0" y2="0">
        <stop offset="0%" stopColor="#475569" />
        <stop offset="45%" stopColor="#94a3b8" />
        <stop offset="85%" stopColor="#e2e8f0" />
        <stop offset="100%" stopColor="#ffffff" />
      </linearGradient>
      <linearGradient id={`${uid}-flank-shad`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="var(--ink)" />
        <stop offset="40%" stopColor="#1e293b" />
        <stop offset="80%" stopColor="#334155" />
        <stop offset="100%" stopColor="#475569" />
      </linearGradient>
      <linearGradient id={`${uid}-gold-tooth`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="var(--warn)" />
        <stop offset="50%" stopColor="var(--warn)" />
        <stop offset="100%" stopColor="#b45309" />
      </linearGradient>
    </defs>
  );
}

export function FastenerTechnicalDrawing({ results, size, length, lang = 'en', highlightedField }: Props) {
  const precision = useGlobalPrecision();
  const uid = useId().replace(/:/g, '');
  const [copied, setCopied] = useState(false);
  const screw = useScrewMotion();
  const motion = {
    onPointerDown: screw.onPointerDown,
    onPointerUp: screw.onPointerUp,
    onPointerCancel: screw.onPointerCancel,
    onContextMenu: screw.onContextMenu,
  };

  const shop = useMemo<Shop>(() => {
    const d = Number(results?.d_nom ?? 12);
    const p = Number(results?.pitchVal ?? 1.75);
    const d2 = Number(results?.d2 ?? (d - 0.64952 * p));
    const d1 = Number(results?.d1 ?? (d - 1.08253 * p));
    const d3 = Number(results?.d3 ?? (d - 1.22687 * p));
    const as = Number(results?.As ?? 84.3);
    const s = Number(results?.boltDim?.s ?? (d * 1.5));
    const e = Number(results?.boltDim?.e ?? (s * 1.1547));
    const k = Number(results?.boltDim?.k ?? (d * 0.7));
    const m = Number(results?.nutDim?.height ?? (d * 0.85));
    const dh = Number(results?.dh ?? (d + 1.5));
    const dw = Number(results?.dw ?? (s * 0.95));
    const tap = Number(results?.tapDrill ?? results?.geometry?.tapDrill ?? Math.max(0, d - p));
    const grade = String(results?.grade || '8.8');
    const L = length;
    const b = Number(results?.threadLengthB ?? Math.min(L, 2 * d + 6));
    const ls = Math.max(0, L - b);
    const vanish = 2 * p;
    const usefulB = Math.max(0, b - vanish);
    const H = 0.866025404 * p;
    const metricKey = extractMetricNominal(size) || size;
    const iso273 = ISO_273_CLEARANCE.find((r) => r.size === metricKey);
    const washer = WASHER_7089[metricKey] || { id: d + 1, od: Math.round(d * 2), t: Math.max(1.6, d * 0.16) };
    const imperial = p > 0 && (size.includes('-') || size.includes('NPT') || size.startsWith('G'));
    const fullyThreaded = ls < p;
    const boltType: BoltTypeId = results?.boltType || 'hex_bolt';
    const headDim = results?.headDim;
    const counterbore = results?.counterbore;
    const pitchStr = Number.isInteger(p) ? String(p) :formatEngineeringValue(p, precision, false);
    const threadCallout = imperial ? `${size} - 2A` : `${metricKey} × ${pitchStr} - 6g`;
    const tapCallout = imperial ? `${size} - 2B` : `${metricKey} × ${pitchStr} - 6H`;
    const spec = results?.spec || getFastenerStandardSpecs(
      results?.geometry?.standard || results?.threadStandard || (imperial ? 'UNC' : 'Metric Coarse'),
      size,
      fullyThreaded,
      boltType,
    );
    // ISO 4753 chamfered end: 45° down to just below the minor diameter d3
    const tipChamfer = Math.max(0.1, (d - d3) / 2 + 0.1 * p);
    return {
      d, p, d1, d2, d3, as, s, e, k, m, dh, dw, tap, grade, L, b, ls,
      lK: Number(results?.gripLength ?? Math.max(0, L - m - washer.t * 2)),
      vanish, usefulB, chamfer: tipChamfer, r: Number(results?.headDim?.r ?? filletR(d)),
      pM: Number(results?.pM ?? NaN), pG: Number(results?.pG_zul ?? NaN), FM_kN: Number(results?.Fm_max ?? NaN),
      H, crest: H / 8, rootFlat: H / 4, crestFlat: p / 8,
      nTurn: Math.round((1000 * 90) / (Math.PI * d)),
      nThread: Math.round((1000 * 40) / (Math.PI * d)),
      mat: materialForGrade(grade, spec.family),
      iso273,
      washer,
      metricKey,
      threadCallout,
      tapCallout,
      fullyThreaded,
      lim: iso965Limits(d, d2, d3, d1, p),
      spec,
      boltType,
      headDim,
      counterbore,
    };
  }, [results, size, length]);

  const standard = results?.geometry?.standard || results?.threadStandard || '';
  const isNPSM = standard === 'NPSM' || /NPSM/i.test(size);
  const isNPT = (standard === 'NPT' || /NPT/i.test(size)) && !isNPSM;
  const isBSPT = standard === 'BSPT (R)' || size.startsWith('R');
  const isBSPP = standard === 'BSPP (G)' || (!isNPT && !isBSPT && !isNPSM && (size.startsWith('G') || String(standard).includes('BSPP')));
  const isPipe = isNPT || isBSPT || isBSPP || isNPSM;
  const npt = lookupNpt(size);
  const bspp = lookupBspp(size);
  const npsm = lookupNpsm(size);
  const spec = shop.spec;

  const stdName = isNPSM
    ? 'ANSI/ASME B1.20.1 (NPSM 60° Straight)'
    : isNPT
    ? 'ASME B1.20.1'
    : isBSPP
    ? 'ISO 228-1 / DIN 3852-2'
    : isBSPT
    ? 'ISO 7-1'
    : spec.family === 'inch'
    ? `${spec.boltCurrent} / ${spec.threadProfile} / ${spec.toleranceClass}`
    : spec.family === 'trapezoidal'
    ? `${spec.boltCurrent} / ${spec.threadProfile}`
    : spec.family === 'acme'
    ? `${spec.boltCurrent} / ${spec.threadProfile}`
    : `${spec.boltCurrent} / ${spec.threadProfile} / ${spec.toleranceClass}`;
  const partName = isPipe
    ? (isNPSM ? `${size} ASME B1.20.1 NPSM 2A` : isNPT ? `${size} ASME B1.20.1 NPT` : `${size} ${spec.boltCurrent}`)
    : spec.family === 'inch'
    ? `${size} × ${shop.L} mm (${formatEngineeringValue((shop.L / 25.4), precision, false)}") ${spec.boltCurrent} Grade ${shop.grade}`
    : `${shop.metricKey} × ${shop.L} ${shop.fullyThreaded ? spec.boltFull : spec.boltPartial} ${shop.grade}`;

  const copyShop = () => {
    const lim = shop.lim;
    const text = isNPSM
      ? [
          `${size} ANSI/ASME B1.20.1 NPSM 2A (Straight Mechanical Pipe)`,
          `Ød=${formatEngineeringValue(shop.d, precision, false)} mm (Major Dia Max 2A)`,
          `Ød2=${formatEngineeringValue(shop.d2, precision, false)} mm (Pitch Dia Max)`,
          `Ød1=${formatEngineeringValue(shop.d1, precision, false)} mm (Minor Dia)`,
          `P=${formatEngineeringValue(shop.p, precision, false)} mm  60° cylindrical pipe thread`,
          `tap Ø${formatEngineeringValue(shop.tap, precision, false)} mm`,
          `hex s=${formatEngineeringValue(shop.s, precision, false)}`,
        ].join('\n')
      : isNPT
      ? [
          `${size} ASME B1.20.1 NPT`,
          `P=${formatEngineeringValue(npt.pitch, precision, false)} mm  ${npt.tpi} TPI  60°  taper 1:16`,
          `E0=${formatEngineeringValue(npt.e0, precision, false)}  E1=${formatEngineeringValue(npt.e1, precision, false)}  E2=${formatEngineeringValue(npt.e2, precision, false)}`,
          `L1=${formatEngineeringValue(npt.L1, precision, false)}  L2=${formatEngineeringValue(npt.L2, precision, false)}  L4=${formatEngineeringValue(npt.L4, precision, false)}`,
          `OD=${formatEngineeringValue(npt.od, precision, false)}  tap Ø${formatEngineeringValue(npt.tapDrill, precision, false)}  hand ${npt.handTurns}  wrench ${npt.wrenchTurns}`,
          `hex s=${formatEngineeringValue(shop.s, precision, false)}`,
        ].join('\n')
      : isPipe
      ? [
          `${size} ISO 228-1 BSPP G`,
          `Ød=${formatEngineeringValue(bspp.majorDia, precision, false)}  Ød2=${formatEngineeringValue(bspp.pitchDia, precision, false)}  Ød1=${formatEngineeringValue(bspp.minorDia, precision, false)}`,
          `P=${formatEngineeringValue(bspp.pitch, precision, false)}  ${bspp.tpi} TPI  55°`,
          `L=${formatEngineeringValue(bspp.threadLength, precision, false)}  tap Ø${formatEngineeringValue(bspp.tapDrill, precision, false)}  spotface Ø${bspp.spotfaceDia}`,
          `undercut Ø${bspp.undercutDia} × ${bspp.undercutWidth}  hex s=${formatEngineeringValue(shop.s, precision, false)}`,
        ].join('\n')
      : [
          partName,
          `Thread ${shop.threadCallout}`,
          `${spec.threadProfile}  ${spec.family === 'inch' ? '60° Unified' : spec.family === 'trapezoidal' ? '30° Tr' : '60° Metric'}  H=${formatEngineeringValue((0.866025404 * shop.p), precision, false)}  d2=${formatEngineeringValue(shop.d2, precision, false)}  d3=${formatEngineeringValue(shop.d3, precision, false)}  D1=${formatEngineeringValue(shop.d1, precision, false)}`,
          `Male crest ${spec.family === 'inch' ? '0.125P' : 'H/8'}  flat ${spec.family === 'inch' ? '0.125P' : 'P/8'}  root R=${spec.family === 'inch' ? '0.144P' : 'H/6'} · Female crest H/4  flat P/4`,
          `Material ${shop.mat.name}  Rm ${shop.mat.rm}  Re ${shop.mat.re} MPa`,
          `Stock hex bar s=${formatEngineeringValue(shop.s, precision, false)}  e=${formatEngineeringValue(shop.e, precision, false)}`,
          `Turn Ød ${formatEngineeringValue(shop.d, precision, false)} h9  shank ls=${formatEngineeringValue(shop.ls, precision, false)}`,
          `Thread length b=${formatEngineeringValue(shop.b, precision, false)}  incomplete 2P=${formatEngineeringValue(shop.vanish, precision, false)}  chamfer 45°×${formatEngineeringValue(shop.chamfer, precision, false)}`,
          `Head k=${formatEngineeringValue(shop.k, precision, false)}  r≥${formatEngineeringValue(shop.r, precision, false)}  L=${shop.L}`,
          `${spec.toleranceClass}  Ød ${formatEngineeringValue(lim.dMin, precision, false)}…${formatEngineeringValue(lim.dMax, precision, false)}  Ød2 ${formatEngineeringValue(lim.d2Min, precision, false)}…${formatEngineeringValue(lim.d2Max, precision, false)}`,
          `Mate ${shop.tapCallout}  ${spec.clearanceHole} dh=${formatEngineeringValue(shop.dh, precision, false)} (N)`,
          `Nut ${spec.nutStandard} m=${formatEngineeringValue(shop.m, precision, false)}`,
        ].join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const ops = isPipe
    ? [
        { n: '10', op: t12(lang, 'Stock: hex bar', 'Hammadde: altı köşe çubuk'), tool: `s = ${formatEngineeringValue(shop.s, precision, false)}`, note: size },
        { n: '20', op: t12(lang, 'Face', 'Alın düzeltme'), tool: t12(lang, 'Carbide insert', 'Karbür uç'), note: 'Vc 90' },
        { n: '30', op: isNPT ? t12(lang, 'Taper turn 1:16', 'Konik torna 1:16') : t12(lang, 'Straight turn', 'Silindirik torna'), tool: isNPT ? `Ø${formatEngineeringValue(npt.od, precision, false)}` : `Ø${formatEngineeringValue(bspp.majorDia, precision, false)}`, note: isNPT ? `L₂ ${npt.L2}` : `L ${bspp.threadLength}` },
        { n: '40', op: t12(lang, 'Thread', 'Diş açma'), tool: isNPT ? `${npt.tpi} TPI 60°` : `${bspp.tpi} TPI 55°`, note: isNPT ? 'NPT' : 'G / BSPP' },
        { n: '50', op: t12(lang, 'Tap drill', 'Kılavuz deliği'), tool: `Ø${formatEngineeringValue(isNPT ? npt.tapDrill : bspp.tapDrill, precision, false)}`, note: t12(lang, '118° point', '118° uç') },
      ]
    : [
        { n: '10', op: t12(lang, 'Stock: hex bar', 'Hammadde: altı köşe çubuk'), tool: `${shop.mat.name}`, note: `s = ${formatEngineeringValue(shop.s, precision, false)}  e = ${formatEngineeringValue(shop.e, precision, false)}` },
        { n: '20', op: t12(lang, 'Face (head side)', 'Alın düzeltme (kafa tarafı)'), tool: t12(lang, 'Carbide DNMG', 'Karbür DNMG'), note: `n ≈ ${shop.nTurn} rpm` },
        { n: '30', op: t12(lang, 'Turn shank Ød', 'Gövde torna Ød'), tool: `Ø${formatEngineeringValue(shop.d, precision, false)}`, note: t12(lang, `length ls = ${formatEngineeringValue(shop.ls, precision, false)} mm`, `boy ls = ${formatEngineeringValue(shop.ls, precision, false)} mm`) },
        { n: '40', op: t12(lang, 'Underhead fillet', 'Kafa altı radyüs'), tool: `r = ${formatEngineeringValue(shop.r, precision, false)}`, note: spec.underheadFillet },
        { n: '50', op: t12(lang, `Thread ${spec.toleranceClass}`, `Diş açma ${spec.toleranceClass}`), tool: shop.threadCallout, note: t12(lang, `b = ${formatEngineeringValue(shop.b, precision, false)} · vanish 2P = ${formatEngineeringValue(shop.vanish, precision, false)}`, `boy b = ${formatEngineeringValue(shop.b, precision, false)} · eksik diş 2P = ${formatEngineeringValue(shop.vanish, precision, false)}`) },
        { n: '60', op: t12(lang, 'End chamfer 45°', 'Uç pah 45°'), tool: `c ≈ ${formatEngineeringValue(shop.chamfer, 2)} (≤ d3)`, note: spec.chamferStandard },
        { n: '70', op: t12(lang, 'Part-off to L', 'Kesme, toplam boy L'), tool: `L = ${shop.L}`, note: `n ≈ ${shop.nThread} rpm ${t12(lang, 'thread', 'diş')}` },
        { n: '80', op: t12(lang, 'Gauge / deburr', 'Mastar / çapak'), tool: `${spec.toleranceClass} GO / NO-GO`, note: spec.gaugeStandard },
      ];

  const holeOps = [
    { n: '10', op: t12(lang, `Clearance ${spec.clearanceHole}`, `Geçme deliği ${spec.clearanceHole}`), tool: `Ø${formatEngineeringValue(shop.dh, precision, false)} ${t12(lang, 'medium', 'orta')}`, note: shop.iso273 ? `F ${shop.iso273.fine} / N ${shop.iso273.normal} / C ${shop.iso273.coarse}` : '—' },
    { n: '20', op: t12(lang, 'Tap drill', 'Kılavuz matkap'), tool: `Ø${formatEngineeringValue(shop.tap, precision, false)}`, note: t12(lang, '118° point', '118° uç açısı') },
    { n: '30', op: t12(lang, 'Entry chamfer 90°', 'Giriş pahı 90°'), tool: '0.5–1.0 × 45°', note: t12(lang, 'tap lead-in', 'kılavuz kılavuzu') },
    { n: '40', op: t12(lang, `Tap (${spec.toleranceClass})`, `Kılavuz (${spec.toleranceClass})`), tool: shop.tapCallout, note: t12(lang, `nut ${spec.nutStandard} m = ${formatEngineeringValue(shop.m, precision, false)} · depth m+2P = ${formatEngineeringValue((shop.m + 2 * shop.p), precision, false)}`, `somun ${spec.nutStandard} m = ${formatEngineeringValue(shop.m, precision, false)} · derinlik m+2P = ${formatEngineeringValue((shop.m + 2 * shop.p), precision, false)}`) },
  ];

  const pipeTapOps = isNPT
    ? [
        { n: '60', op: t12(lang, 'Tap drill (taper port)', 'Kılavuz matkap (konik port)'), tool: `Ø${formatEngineeringValue(npt.tapDrill, precision, false)}`, note: t12(lang, '118° point', '118° uç') },
        { n: '70', op: t12(lang, 'NPT taper tap', 'Konik kılavuz NPT'), tool: `${npt.tpi} TPI · 60° · 1:16`, note: t12(lang, `hand ${npt.handTurns} + wrench ${npt.wrenchTurns}`, `el ${npt.handTurns} + anahtar ${npt.wrenchTurns}`) },
      ]
    : isBSPT
    ? [
        { n: '60', op: t12(lang, 'Tap drill (taper port)', 'Kılavuz matkap (konik port)'), tool: `Ø${formatEngineeringValue(bspp.tapDrill, precision, false)}`, note: t12(lang, '118° point', '118° uç') },
        { n: '70', op: t12(lang, 'BSPT / Rc taper tap', 'Konik kılavuz BSPT / Rc'), tool: `${bspp.tpi} TPI · 55° · 1:16`, note: 'ISO 7-1' },
      ]
    : [
        { n: '60', op: t12(lang, 'Tap drill (parallel port)', 'Kılavuz matkap (paralel port)'), tool: `Ø${formatEngineeringValue(bspp.tapDrill, precision, false)}`, note: t12(lang, '118° point', '118° uç') },
        { n: '70', op: t12(lang, 'Parallel G / BSPP tap', 'Paralel kılavuz G / BSPP'), tool: `${bspp.tpi} TPI · 55°`, note: 'ISO 228-1' },
        { n: '80', op: t12(lang, 'Spotface', 'Spotface / alın'), tool: `Ø${formatEngineeringValue(bspp.spotfaceDia, precision, false)}`, note: 'DIN 3852-2' },
      ];

  return (
    <div className="space-y-5 p-3 sm:p-4 text-[var(--ink)]">
      <div className={`flex flex-col md:flex-row flex-wrap items-start md:items-center justify-between gap-3 rounded-xl border p-3 sm:p-4 transition-all duration-300 ${
        highlightedField
          ? 'border-[var(--cyan)]/60 bg-[var(--bg-1)] ring-1 ring-[var(--cyan)]/40'
          : 'border-[var(--line)] bg-[var(--bg-1)]'
      }`}>
        <div className="flex flex-wrap items-start gap-4 sm:gap-6 min-w-0">
          <div className="min-w-[130px]">
            <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] uppercase tracking-wider text-[var(--muted)] font-mono">
              <span>{t12(lang, 'Production drawing', 'Üretim resmi')}</span>
              {highlightedField && (
                <span className="text-[9px] px-1 py-0.2 rounded bg-[var(--cyan)]/20 text-[var(--cyan)] border border-[var(--cyan)]/40 animate-pulse">
                  {highlightedField}
                </span>
              )}
            </div>
            <div className="mt-0.5 text-base sm:text-lg font-bold text-[var(--ink)] tracking-tight">{partName}</div>
            <div className="mt-0.5 font-mono text-[12px] sm:text-[13px] text-[var(--cyan)]">{isPipe ? stdName : shop.threadCallout}</div>
          </div>
          <div className="min-w-[120px] font-mono text-[12px] sm:text-[13px]">
            <div className="text-[10px] sm:text-[11px] uppercase tracking-wider text-[var(--muted)]">{t12(lang, 'Material', 'Malzeme')}</div>
            <div className="mt-0.5 font-semibold text-[var(--ink)]">{shop.mat.name}</div>
            <div className="text-[var(--muted)] text-[11px]">Rm {shop.mat.rm} · Re {shop.mat.re} MPa</div>
          </div>
          <div className="min-w-[110px] font-mono text-[12px] sm:text-[13px]">
            <div className="text-[10px] sm:text-[11px] uppercase tracking-wider text-[var(--muted)]">{t12(lang, 'Standard', 'Standart')}</div>
            <div className="mt-0.5 font-semibold text-[var(--ink)]">{stdName}</div>
            <div className="text-[var(--muted)] text-[11px]">mm · ISO 128</div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap shrink-0 mt-1 md:mt-0">
          <button
            type="button"
            onClick={copyShop}
            className="rounded-lg border border-[var(--cyan)]/30 bg-[var(--cyan)]/10 px-3 py-1.5 text-[11px] sm:text-[12px] font-semibold text-[var(--cyan)] hover:bg-[var(--cyan)]/20 cursor-pointer transition-colors"
          >
            {copied ? t12(lang, 'Copied', 'Kopyalandı') : t12(lang, 'Copy shop data', 'Üretim verisini kopyala')}
          </button>
          {isPipe && (
            <button
              type="button"
              onClick={() => {
                const threadType = isNPT
                  ? (size.includes('NPTF') ? 'NPTF' : 'NPT')
                  : isBSPT
                  ? 'BSPT'
                  : isBSPP
                  ? 'BSPP'
                  : (standard === 'Gas Cylinder (W)' || size.startsWith('W '))
                  ? 'W'
                  : (shop.metricKey.startsWith('M') ? 'M' : (shop.threadCallout.includes('UNC') ? 'UNC' : (shop.threadCallout.includes('UNF') ? 'UNF' : 'M')));
                const nomDia = isNPT ? npt.od : (isBSPT || isBSPP ? bspp.majorDia : shop.d);
                const pitchVal = isNPT ? npt.pitch : (isBSPT || isBSPP ? bspp.pitch : shop.p);
                const lenVal = isNPT ? npt.L4 : (isBSPT || isBSPP ? bspp.threadLength : shop.L);
                CrossModuleBridge.exportThreadTo3D({
                  type: threadType,
                  nominalDia: nomDia,
                  pitch: pitchVal,
                  lengthMm: lenVal,
                  threadLength: lenVal,
                  shankLength: 0,
                  role: 'assembly',
                  switchWindow: true,
                });
              }}
              className="rounded-lg border border-[var(--warn)]/40 bg-[var(--warn)]/10 px-3 py-1.5 text-[11px] sm:text-[12px] font-semibold text-[var(--warn)] hover:bg-[var(--warn)]/20 flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              title={t12(lang, "Export to 3D Design Studio (Pipe Nipple + Port)", "3D Design Studio'ya Aktar (Boru Nipeli + Manşon)")}
            >
              <Box size={14} />
              <span>{t12(lang, '3D Export', "3D'ye Aktar")}</span>
            </button>
          )}
        </div>
      </div>

      {/* 1. Turning side view */}
      <section className="space-y-2">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-[14px] font-bold text-[var(--ink)]">
            {t12(lang, 'Turning Drawing (1:1 CAD SVG)', 'Torna Resmi (1:1 CAD SVG)')}
          </h3>
          {!isPipe && (
            <span className="font-mono text-[10.5px] text-[var(--muted)]">
              {t12(lang, 'Part drawing · joint section (VDI 2230)', 'Parça resmi · bağlantı kesiti (VDI 2230)')}
            </span>
          )}
        </div>
        {isPipe ? (
          <PipeTurning
            uid={uid}
            isNPT={isNPT}
            isBSPT={isBSPT}
            isBSPP={isBSPP}
            isNPSM={isNPSM}
            npt={npt}
            bspp={bspp}
            npsm={npsm}
            s={shop.s}
            size={size}
            lang={lang}
            turns={screw.turns}
            motion={motion}
          />
        ) : (
          <BoltProductionDrawing
            shop={{
              ...shop,
              pM: Number.isFinite(shop.pM) ? shop.pM : undefined,
              pG: Number.isFinite(shop.pG) ? shop.pG : undefined,
              FM_kN: Number.isFinite(shop.FM_kN) ? shop.FM_kN : undefined,
            }}
            lang={lang}
            turns={screw.turns}
            motion={motion}
            screw={screw}
            highlightedField={highlightedField}
          />
        )}
      </section>

      {/* Optional Workshop & CNC Machining Details (Collapsed by default) */}
      <details className="rounded-xl border border-[var(--line)] bg-[var(--bg-1)] overflow-hidden group">
        <summary className="px-4 py-3 cursor-pointer text-xs font-mono font-bold text-[var(--alu-dim)] hover:text-[var(--ink)] flex items-center justify-between transition-colors select-none">
          <span className="flex items-center gap-2">
            <span className="text-[var(--cyan)] group-open:rotate-90 transition-transform">▸</span>
            <span>{t12(lang, 'Workshop & CNC Machining Operations (Tool Sequence)', 'Atölye & CNC Talaşlı İmalat Operasyonları (G-Code & Takım Sırası)')}</span>
          </span>
          <span className="text-[10px] text-[var(--muted)] font-normal">{t12(lang, 'Click to expand', 'Genişletmek için tıklayın')}</span>
        </summary>
        <div className="p-4 pt-2 space-y-4 border-t border-[var(--line)]">
          {isPipe && (
            <PipeCoordinateSection
              isNPT={isNPT || isBSPT}
              isBSPP={isBSPP}
              isNPSM={isNPSM}
              npt={npt}
              bspp={bspp}
              npsm={npsm}
              size={size}
              lang={lang}
            />
          )}

          <section className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <NumTable
              title={t12(lang, 'Turning sizes', 'Torna ölçüleri')}
              rows={
                isNPT
                  ? [
                      ['s', t12(lang, 'Hex bar stock', 'Altı köşe çubuk'), `${formatEngineeringValue(shop.s, precision, false)} mm`],
                      ['OD', t12(lang, 'Pipe OD', 'Boru dış çap'), `${formatEngineeringValue(npt.od, precision, false)} mm`],
                      ['1:16', t12(lang, 'Taper on dia.', 'Koniklik (çap)'), '0.0625 mm/mm'],
                      ['L₁', t12(lang, 'Hand-tight', 'El sıkma'), `${formatEngineeringValue(npt.L1, precision, false)} mm`],
                      ['L₂', t12(lang, 'Effective', 'Etkin diş'), `${formatEngineeringValue(npt.L2, precision, false)} mm`],
                      ['L₄', t12(lang, 'Thread + vanish', 'Toplam diş + vanish'), `${formatEngineeringValue(npt.L4, precision, false)} mm`],
                      ['E₀ / E₁ / E₂', 'Ød₂', `${formatEngineeringValue(npt.e0, precision, false)} / ${formatEngineeringValue(npt.e1, precision, false)} / ${formatEngineeringValue(npt.e2, precision, false)}`],
                      ['P / TPI', t12(lang, 'Pitch', 'Hatve'), `${formatEngineeringValue(npt.pitch, precision, false)} mm · ${npt.tpi}`],
                    ]
                  : isNPSM && npsm
                  ? [
                      ['s', t12(lang, 'Hex bar stock', 'Altı köşe çubuk'), `${formatEngineeringValue(npsm.hex, precision, false)} mm`],
                      ['Ød (2A)', t12(lang, 'Major min…max', 'Dış çap min…max'), `${formatEngineeringValue(npsm.majorMin, precision, false)} … ${formatEngineeringValue(npsm.majorDia, precision, false)} mm`],
                      ['Ød₂ (2A)', t12(lang, 'Pitch min…max', 'Hatve çapı min…max'), `${formatEngineeringValue(npsm.pitchMin, precision, false)} … ${formatEngineeringValue(npsm.pitchDia, precision, false)} mm`],
                      ['Ød₁', t12(lang, 'Minor', 'İç çap'), `${formatEngineeringValue(npsm.minorDia, precision, false)} mm`],
                      ['L', t12(lang, 'Thread length', 'Diş boyu'), `${formatEngineeringValue(npsm.threadLength, precision, false)} mm`],
                      ['30°', t12(lang, 'Swivel Cone', 'Konik Yuva'), '30° ASME B1.20.1'],
                      ['P / TPI', t12(lang, 'Pitch 60°', 'Hatve 60°'), `${formatEngineeringValue(npsm.pitch, precision, false)} mm · ${npsm.tpi} TPI`],
                    ]
                  : isPipe
                  ? [
                      ['s', t12(lang, 'Hex bar stock', 'Altı köşe çubuk'), `${formatEngineeringValue(shop.s, precision, false)} mm`],
                      ['Ød', t12(lang, 'Major', 'Dış çap'), `${formatEngineeringValue(bspp.majorDia, precision, false)} mm`],
                      ['Ød₂', t12(lang, 'Pitch dia.', 'Hatve çapı'), `${formatEngineeringValue(bspp.pitchDia, precision, false)} mm`],
                      ['Ød₁', t12(lang, 'Minor', 'İç çap'), `${formatEngineeringValue(bspp.minorDia, precision, false)} mm`],
                      ['L', t12(lang, 'Thread length', 'Diş boyu'), `${formatEngineeringValue(bspp.threadLength, precision, false)} mm`],
                      ['g', t12(lang, 'Undercut', 'Kanal'), `Ø${bspp.undercutDia} × ${bspp.undercutWidth}`],
                      ['P / TPI', t12(lang, 'Pitch 55°', 'Hatve 55°'), `${formatEngineeringValue(bspp.pitch, precision, false)} mm · ${bspp.tpi}`],
                    ]
                  : [
                      ['stok', t12(lang, 'Hex bar', 'Altı köşe çubuk'), `s = ${formatEngineeringValue(shop.s, precision, false)}  e = ${formatEngineeringValue(shop.e, precision, false)}`],
                      ['Ød', t12(lang, 'Shank h9', 'Gövde h9'), `${formatEngineeringValue(shop.d, precision, false)} mm`],
                      ['ls', t12(lang, 'Unthreaded shank', 'Dişsiz gövde'), `${formatEngineeringValue(shop.ls, precision, false)} mm`],
                      ['b', spec.family === 'inch' ? t12(lang, 'Thread length ASME B18.2.1', 'Diş boyu ASME B18.2.1') : t12(lang, 'Thread length ISO 888', 'Diş boyu ISO 888'), `${formatEngineeringValue(shop.b, precision, false)} mm`],
                      ['2P', t12(lang, 'Incomplete thread', 'Eksik diş'), `${formatEngineeringValue(shop.vanish, precision, false)} mm`],
                      ['c', t12(lang, 'End chamfer 45°', 'Uç pah 45°'), `${formatEngineeringValue(shop.chamfer, precision, false)} mm`],
                      ['k / r', t12(lang, 'Head / fillet', 'Kafa / radyüs'), `${formatEngineeringValue(shop.k, precision, false)} / ≥${formatEngineeringValue(shop.r, precision, false)} mm`],
                      ['L', t12(lang, 'Length under head', 'Kafa altı boy'), `${shop.L} mm`],
                    ]
              }
            />
            <NumTable
              title={isPipe ? t12(lang, 'Female port / tap', 'Dişi port / kılavuz') : `${spec.toleranceClass} (mm)`}
              rows={
                isNPT
                  ? [
                      ['tap', t12(lang, 'Tap drill 118°', 'Kılavuz matkap 118°'), `Ø${formatEngineeringValue(npt.tapDrill, precision, false)} mm`],
                      ['L₁', t12(lang, 'Female gauge depth', 'Dişi mastar derinliği'), `${formatEngineeringValue(npt.L1, precision, false)} mm`],
                      ['N1', t12(lang, 'Hand turns', 'El turu'), `${npt.handTurns}`],
                      ['N2', t12(lang, 'Wrench turns', 'Anahtar turu'), `${npt.wrenchTurns}`],
                      ['ağız Ød₂', t12(lang, 'Female mouth pitch', 'Dişi ağız hatve Ø'), `${formatEngineeringValue(npt.e1, precision, false)} mm`],
                      ['dip Ød₂', t12(lang, 'Female at L₂', 'Dişi L₂ hatve Ø'), `${formatEngineeringValue((npt.e1 - npt.L2 / 16), precision, false)} mm`],
                      ['form', t12(lang, 'Form', 'Diş formu'), '60° · 0.033P kesme · 1:16'],
                    ]
                  : isNPSM && npsm
                  ? [
                      ['tap', t12(lang, 'Tap drill', 'Kılavuz matkap'), `Ø${formatEngineeringValue(npsm.tapDrill, precision, false)} mm`],
                      ['yuva', t12(lang, 'Swivel cone seat', 'Dahili konik yuva'), '30° ASME B1.20.1'],
                      ['sınıf', t12(lang, 'Internal thread', 'İç diş sınıfı'), `${size} 2B (ANSI/ASME B1.20.1)`],
                      ['form', t12(lang, 'Form', 'Diş formu'), '60° UN · 0.866P'],
                    ]
                  : isPipe
                  ? [
                      ['tap', t12(lang, 'Tap drill', 'Kılavuz matkap'), `Ø${formatEngineeringValue(bspp.tapDrill, precision, false)} mm`],
                      ['spot', t12(lang, 'Spotface Ø', 'Alın Ø'), `${formatEngineeringValue(bspp.spotfaceDia, precision, false)} mm`],
                      [spec.family === 'bspp' ? 'Class A' : (spec.family === 'inch' ? '2B' : '6H'), t12(lang, 'Internal', 'İç diş'), `${size} parallel`],
                      ['form', t12(lang, 'Form', 'Diş formu'), '55° Whitworth · r=0.137P'],
                    ]
                  : [
                      [`Ød ${spec.toleranceClass.split('/')[0]?.trim() || ''}`, t12(lang, 'Major min…max', 'Dış çap min…max'), `${formatEngineeringValue(shop.lim.dMin, precision, false)} … ${formatEngineeringValue(shop.lim.dMax, precision, false)}`],
                      [`Ød₂ ${spec.toleranceClass.split('/')[0]?.trim() || ''}`, t12(lang, 'Pitch min…max', 'Hatve min…max'), `${formatEngineeringValue(shop.lim.d2Min, precision, false)} … ${formatEngineeringValue(shop.lim.d2Max, precision, false)}`],
                      ['Ød₃', t12(lang, 'Root (ref)', 'Diş dibi (ref)'), `${formatEngineeringValue(shop.d3, precision, false)}`],
                      [`ØD₂ ${spec.toleranceClass.split('/')[1]?.trim() || ''}`, t12(lang, 'Internal pitch', 'İç hatve min…max'), `${formatEngineeringValue(shop.lim.D2Min, precision, false)} … ${formatEngineeringValue(shop.lim.D2Max, precision, false)}`],
                      [`ØD₁ ${spec.toleranceClass.split('/')[1]?.trim() || ''}`, t12(lang, 'Internal minor', 'İç dip min…max'), `${formatEngineeringValue(shop.lim.D1Min, precision, false)} … ${formatEngineeringValue(shop.lim.D1Max, precision, false)}`],
                      ['tap', t12(lang, 'Tap drill', 'Kılavuz matkap'), `Ø${formatEngineeringValue(shop.tap, precision, false)} mm`],
                      ['dh N', spec.clearanceHole, shop.iso273 ? `F ${shop.iso273.fine} / N ${formatEngineeringValue(shop.dh, precision, false)} / C ${shop.iso273.coarse}` : `Ø${formatEngineeringValue(shop.dh, precision, false)} mm`],
                      ['m', t12(lang, `Nut ${spec.nutStandard}`, `Somun ${spec.nutStandard}`), `${formatEngineeringValue(shop.m, precision, false)} mm`],
                    ]
              }
            />
          </section>

          <section className="overflow-x-auto rounded-xl border border-[var(--line)]">
            <div className="bg-[var(--bg-2)] px-3 py-2 text-[13px] font-bold text-[var(--cyan)]">
              {t12(lang, 'CNC sequence', 'Üretim sırası (CNC)')}
            </div>
            <table className="w-full min-w-[640px] text-left text-[13px]">
              <thead className="font-mono text-[11px] uppercase text-[var(--muted)]">
                <tr>
                  <th className="px-3 py-2 w-14">Op</th>
                  <th className="px-3 py-2">{t12(lang, 'Operation', 'İşlem')}</th>
                  <th className="px-3 py-2">{t12(lang, 'Size', 'Ölçü')}</th>
                  <th className="px-3 py-2">{t12(lang, 'Note', 'Not')}</th>
                </tr>
              </thead>
              <tbody>
                {ops.map((row) => (
                  <tr key={row.n} className="border-t border-[var(--line)] even:bg-[var(--line)]/5">
                    <td className="px-3 py-2 font-mono font-bold text-[var(--cyan)]">{row.n}</td>
                    <td className="px-3 py-2 text-[var(--ink)]">{row.op}</td>
                    <td className="px-3 py-2 font-mono text-[var(--ink)]">{row.tool}</td>
                    <td className="px-3 py-2 font-mono text-[var(--muted)]">{row.note}</td>
                  </tr>
                ))}
                {(isPipe ? pipeTapOps : holeOps).map((row) => (
                  <tr key={`h${row.n}`} className="border-t border-[var(--line)] even:bg-[var(--line)]/5">
                    <td className="px-3 py-2 font-mono font-bold text-[var(--warn)]">{row.n}</td>
                    <td className="px-3 py-2 text-[var(--ink)]">{row.op}</td>
                    <td className="px-3 py-2 font-mono text-[var(--ink)]">{row.tool}</td>
                    <td className="px-3 py-2 font-mono text-[var(--muted)]">{row.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
      </details>
    </div>
  );
}

function FemaleAxialSection({
  uid, shop, lang, isNPT, npt, isPipe, bspp,
}: {
  uid: string; shop: Shop; lang: string; isNPT: boolean; npt: NptSpec; isPipe: boolean; bspp: BsppSpec;
}) {
  const precision = useGlobalPrecision();
  const pr = iso68Profile(shop.d, shop.p);
  const P = isNPT ? npt.pitch : isPipe ? bspp.pitch : shop.p;
  const angle = isNPT ? 60 : isPipe ? 55 : 60;
  const half = (angle / 2) * (Math.PI / 180);
  const tHalf = Math.tan(half);

  const D = isNPT ? npt.e1 + 0.8 * P : isPipe ? bspp.majorDia : pr.D;
  const D2 = isNPT ? npt.e1 : isPipe ? bspp.pitchDia : pr.D2;
  const D1 = isNPT ? npt.e1 - 0.8 * P : isPipe ? bspp.minorDia : pr.D1;
  const tap = isNPT ? npt.tapDrill : isPipe ? bspp.tapDrill : shop.tap;
  const toothMm = (D - D1) / 2;
  const n = 6;
  const sc = Math.min(36 / Math.max(0.28, toothMm), 165 / Math.max(4, D / 2), 390 / (n * P + 6));
  const Ppx = P * sc;
  const wall = 48;
  const x0 = 64;
  const cham = Math.min(18, Ppx * 0.5);
  const x1 = x0 + cham + n * Ppx;
  const cy = 300;
  const rD = (D / 2) * sc;
  const rD1 = (D1 / 2) * sc;
  const rD2 = (D2 / 2) * sc;
  const rTap = (tap / 2) * sc;
  const yRt = cy - rD;
  const yCt = cy - rD1;
  const yRb = cy + rD;
  const yCb = cy + rD1;
  const dx = (yCt - yRt) * tHalf;
  const flat = isPipe && !isNPT ? 0 : (P / 4) * sc;

  const topInner = (() => {
    let d = `M ${x0} ${yRt} L ${x0 + cham} ${yCt}`;
    for (let i = 0; i < n; i++) {
      const c = x0 + cham + (i + 0.5) * Ppx;
      d += ` L ${c + flat / 2} ${yCt}`;
      if (i < n - 1) d += ` L ${c + flat / 2 + dx} ${yRt} L ${c + Ppx - flat / 2} ${yCt}`;
      else d += ` L ${c + flat / 2 + dx} ${yRt}`;
    }
    d += ` L ${x1 + 36} ${yRt} L ${x1 + 36} ${yRt - wall} L ${x0} ${yRt - wall} Z`;
    return d;
  })();

  const botInner = (() => {
    let d = `M ${x0} ${yRb} L ${x0 + cham} ${yCb}`;
    for (let i = 0; i < n; i++) {
      const c = x0 + cham + (i + 0.5) * Ppx;
      d += ` L ${c + flat / 2} ${yCb}`;
      if (i < n - 1) d += ` L ${c + flat / 2 + dx} ${yRb} L ${c + Ppx - flat / 2} ${yCb}`;
      else d += ` L ${c + flat / 2 + dx} ${yRb}`;
    }
    d += ` L ${x1 + 36} ${yRb} L ${x1 + 36} ${yRb + wall} L ${x0} ${yRb + wall} Z`;
    return d;
  })();

  const detX = 700;
  const detY = 270;
  const dsc = 90 / Math.max(0.35, toothMm);
  const dP = P * dsc;
  const dH = toothMm * dsc;
  const dFlat = (P / 4) * dsc;
  const dDx = dH * tHalf;

  return (
    <g>
      <text x="24" y="36" fill="var(--cyan)" fontSize="17" fontWeight="800">
        {t12(lang, 'FEMALE THREAD (INTERNAL)  —  tapped hole section', 'DİŞİ DİŞ (İÇ)  —  kılavuz deliği kesiti')}
      </text>
      <text x="24" y="58" fill="var(--alu-dim)" fontSize="13" fontFamily="ui-monospace, monospace">
        {shop.tapCallout} ·  ØD₁ {formatEngineeringValue(D1, precision, false)}  ØD₂ {formatEngineeringValue(D2, precision, false)}  ØD {formatEngineeringValue(D, precision, false)}  ·  tap Ø{formatEngineeringValue(tap, precision, false)}  ·  {angle}°
      </text>

      <line x1={x0 - 20} y1={cy} x2={x1 + 50} y2={cy} stroke="var(--cyan)" strokeWidth="1.25" strokeDasharray="14 5 3 5" />

      <path d={topInner} fill={`url(#${uid}-hatch)`} stroke="var(--cyan)" strokeWidth="1.8" strokeLinejoin="round" />
      <path d={botInner} fill={`url(#${uid}-hatch)`} stroke="var(--cyan)" strokeWidth="1.8" strokeLinejoin="round" />

      <line x1={x0} y1={cy - rTap} x2={x1 + 28} y2={cy - rTap} stroke="var(--warn)" strokeWidth="1.4" strokeDasharray="7 4" />
      <line x1={x0} y1={cy + rTap} x2={x1 + 28} y2={cy + rTap} stroke="var(--warn)" strokeWidth="1.4" strokeDasharray="7 4" />
      <line x1={x0 + cham} y1={cy - rD2} x2={x1} y2={cy - rD2} stroke="var(--alu-dim)" strokeWidth="1" strokeDasharray="6 3" />

      <line x1={x0} y1={yRt - wall} x2={x0} y2={yRb + wall} stroke="var(--line)" strokeWidth="1.6" />
      <text x={x0 + 4} y={yRt - wall + 16} fill="var(--ok)" fontSize="13" fontWeight="800" fontFamily="ui-monospace, monospace">
        {t12(lang, 'FACE', 'AĞIZ')} 45°
      </text>

      <Ext x1={x1} y1={yCt} x2={x1 + 70} y2={yCt} />
      <Ext x1={x1} y1={yCb} x2={x1 + 70} y2={yCb} />
      <Ext x1={x1} y1={yRt} x2={x1 + 108} y2={yRt} />
      <Ext x1={x1} y1={yRb} x2={x1 + 108} y2={yRb} />
      <VDim uid={uid} x={x1 + 64} y1={yCt} y2={yCb} label={`ØD₁ ${D1.toFixed(2)}`} />
      <VDim uid={uid} x={x1 + 102} y1={yRt} y2={yRb} label={`ØD ${D.toFixed(2)}`} color="#67e8f9" />
      <HDim uid={uid} x1={x0} x2={x1} y={yRb + wall + 28} label={`${t12(lang, 'length', 'diş boyu')} ${(n * P).toFixed(1)} mm  ·  m=${shop.m.toFixed(1)}`} />

      <text x={x0 + 10} y={cy - 6} fill="var(--warn)" fontSize="13" fontWeight="800" fontFamily="ui-monospace, monospace">Øtap {formatEngineeringValue(tap, precision, false)}</text>
      <text x={x0 + cham + Ppx} y={cy - rD2 - 10} fill="var(--ink)" fontSize="13" fontWeight="800" fontFamily="ui-monospace, monospace">ØD₂ {formatEngineeringValue(D2, precision, false)}</text>

      {/* Detay: tek dişi diş, büyük */}
      <rect x={detX - 10} y="70" width="290" height="400" rx="8" fill="var(--bg-1)" stroke="var(--cyan, #67e8f9)" strokeWidth="1.2" />
      <text x={detX + 8} y="94" fill="var(--cyan)" fontSize="13" fontWeight="800">
        {t12(lang, 'DETAIL — 1 female tooth', 'DETAY — 1 dişi diş')}
      </text>
      <text x={detX + 8} y="114" fill="var(--alu-dim)" fontSize="12" fontFamily="ui-monospace, monospace">
        {angle}° · {isPipe ? (isNPT ? 'NPT (ASME B1.20.1)' : 'Whitworth (ISO 228-1)') : (shop.spec.family === 'inch' ? 'ASME B1.1' : shop.spec.family === 'trapezoidal' ? 'DIN 103' : shop.spec.family === 'acme' ? 'ASME B1.5' : 'ISO 68-1')}
      </text>

      <line x1={detX + 20} y1={detY} x2={detX + 260} y2={detY} stroke="var(--line)" strokeWidth="1.1" strokeDasharray="8 4" />
      <text x={detX + 24} y={detY - 8} fill="var(--ink)" fontSize="12">D₂</text>

      {/* female tooth pointing toward axis (down toward D2 line from above) */}
      <path
        d={`M ${detX + 40} ${detY - dH - 20}
            L ${detX + 40} ${detY - dH}
            L ${detX + 40 + dDx} ${detY}
            L ${detX + 40 + dDx + dFlat} ${detY}
            L ${detX + 40 + 2 * dDx + dFlat} ${detY - dH}
            L ${detX + 40 + 2 * dDx + dFlat} ${detY - dH - 20} Z`}
        fill={`url(#${uid}-hatch)`}
        stroke="var(--cyan)"
        strokeWidth="1.8"
      />
      <g transform={`translate(${detX + 40 + dDx + dFlat / 2}, ${detY})`}>
        <line x1={0} y1={0} x2={-Math.sin(half) * 54} y2={-Math.cos(half) * 54} stroke="var(--warn)" strokeWidth="1.4" />
        <line x1={0} y1={0} x2={Math.sin(half) * 54} y2={-Math.cos(half) * 54} stroke="var(--warn)" strokeWidth="1.4" />
        <text x="0" y="-62" textAnchor="middle" fill="var(--warn)" fontSize="18" fontWeight="800">{angle}°</text>
      </g>
      <HDim uid={uid} x1={detX + 40 + dDx} x2={detX + 40 + dDx + dFlat} y={detY + 36} label={isNPT ? '0.033P' : 'P/4'} />
      <text x={detX + 8} y="420" fill="var(--cyan)" fontSize="13" fontFamily="ui-monospace, monospace">ØD₁ {formatEngineeringValue(D1, precision, false)}</text>
      <text x={detX + 8} y="442" fill="var(--ink)" fontSize="13" fontFamily="ui-monospace, monospace">ØD₂ {formatEngineeringValue(D2, precision, false)}</text>
      <text x={detX + 8} y="464" fill="var(--cyan)" fontSize="13" fontFamily="ui-monospace, monospace">ØD  {formatEngineeringValue(D, precision, false)}</text>
      <text x={detX + 150} y="442" fill="var(--alu-dim)" fontSize="12" fontFamily="ui-monospace, monospace">
        {t12(lang, 'crest H/4', 'tepe H/4')}
      </text>
      <text x={detX + 150} y="464" fill="var(--alu-dim)" fontSize="12" fontFamily="ui-monospace, monospace">P={formatEngineeringValue(P, precision, false)}</text>
    </g>
  );
}

function ThreadProfileSheet({
  uid, shop, isNPT, isPipe, npt, bspp, lang, turns = 0, motion,
}: {
  uid: string; shop: Shop; isNPT: boolean; isPipe: boolean; npt: NptSpec; bspp: BsppSpec; lang: string;
  turns?: number; motion?: React.ComponentProps<typeof BoltFemaleSvg1to1>['motion'];
}) {
  const precision = useGlobalPrecision();
  const pr = iso68Profile(shop.d, shop.p);
  const nptP = nptProfile(npt.pitch);
  const wh = whitworthProfile(bspp.pitch);
  const P = isNPT ? npt.pitch : isPipe ? bspp.pitch : shop.p;
  const rows: [string, string, string][] = isNPT
    ? [
        [t12(lang, 'Angle', 'Açı'), '60°', '60°'],
        ['P', `${formatEngineeringValue(P, precision, false)} mm`, `${formatEngineeringValue(P, precision, false)} mm`],
        ['H sharp', `${formatEngineeringValue(nptP.H, precision, false)} mm`, `${formatEngineeringValue(nptP.H, precision, false)} mm`],
        ['h (0.8P)', `${formatEngineeringValue(nptP.h, precision, false)} mm`, `${formatEngineeringValue(nptP.h, precision, false)} mm`],
        [t12(lang, 'Crest trunc.', 'Tepe kesme'), `0.033P = ${formatEngineeringValue(nptP.trunc, precision, false)}`, `0.033P = ${formatEngineeringValue(nptP.trunc, precision, false)}`],
        [t12(lang, 'Crest flat', 'Tepe düzü'), `${formatEngineeringValue(nptP.crestFlat, precision, false)} mm`, `${formatEngineeringValue(nptP.crestFlat, precision, false)} mm`],
        [t12(lang, 'Taper', 'Koniklik'), '1:16', '1:16'],
        ['Ø major', `E+0.8P  (uç ${formatEngineeringValue((npt.e0 + 0.8 * P), precision, false) })`, `E+0.8P  (ağız ${formatEngineeringValue((npt.e1 + 0.8 * P), precision, false)})`],
        ['Ød₂', `E₀ ${formatEngineeringValue(npt.e0, precision, false)} → E₁ ${formatEngineeringValue(npt.e1, precision, false)}`, `ağız E₁ ${formatEngineeringValue(npt.e1, precision, false)} → L₂ ${formatEngineeringValue((npt.e1 - npt.L2 / 16), precision, false)}`],
        ['Ø minor', `E−0.8P  (uç ${formatEngineeringValue((npt.e0 - 0.8 * P), precision, false)})`, `E−0.8P  (ağız ${formatEngineeringValue((npt.e1 - 0.8 * P), precision, false)})`],
      ]
    : isPipe
    ? [
        [t12(lang, 'Angle', 'Açı'), '55°', '55°'],
        ['P', `${formatEngineeringValue(P, precision, false)} mm`, `${formatEngineeringValue(P, precision, false)} mm`],
        ['h', `${formatEngineeringValue(wh.h, precision, false)} mm`, `${formatEngineeringValue(wh.h, precision, false)} mm`],
        ['r', `${formatEngineeringValue(wh.r, precision, false)} mm`, `${formatEngineeringValue(wh.r, precision, false)} mm`],
        ['Ød / ØD', `${formatEngineeringValue(bspp.majorDia, precision, false)}`, `${formatEngineeringValue(bspp.majorDia, precision, false)}`],
        ['Ød₂ / ØD₂', `${formatEngineeringValue(bspp.pitchDia, precision, false)}`, `${formatEngineeringValue(bspp.pitchDia, precision, false)}`],
        ['Ød₁ / ØD₁', `${formatEngineeringValue(bspp.minorDia, precision, false)}`, `${formatEngineeringValue(bspp.minorDia, precision, false)}`],
      ]
    : [
        [t12(lang, 'Angle', 'Açı'), '60°', '60°'],
        ['P', `${formatEngineeringValue(pr.P, precision, false)} mm`, `${formatEngineeringValue(pr.P, precision, false)} mm`],
        ['H = √3/2·P', `${formatEngineeringValue(pr.H, precision, false)} mm`, `${formatEngineeringValue(pr.H, precision, false)} mm`],
        [t12(lang, 'Crest trunc.', 'Tepe kesme'), `H/8 = ${formatEngineeringValue(pr.crestMale, precision, false)}`, `H/4 = ${formatEngineeringValue(pr.crestFemale, precision, false)}`],
        [t12(lang, 'Crest flat', 'Tepe düzü'), `P/8 = ${formatEngineeringValue(pr.crestFlatMale, precision, false)}`, `P/4 = ${formatEngineeringValue(pr.crestFlatFemale, precision, false)}`],
        [t12(lang, 'Root', 'Kök'), `R = H/6 = ${formatEngineeringValue(pr.rootR, precision, false)}`, `H/8 = ${formatEngineeringValue(pr.truncMajorFemale, precision, false)}`],
        [t12(lang, 'Engagement', 'Kavrama yüksekliği'), `5H/8 = ${formatEngineeringValue(pr.engagement, precision, false)}`, `5H/8 = ${formatEngineeringValue(pr.engagement, precision, false)}`],
        ['Ø major', `d = ${formatEngineeringValue(pr.d, precision, false)}  (${shop.spec.toleranceClass.split('/')[0]?.trim() || '6g'} ${formatEngineeringValue(shop.lim.dMin, precision, false)}…${formatEngineeringValue(shop.lim.dMax, precision, false)})`, `D = ${formatEngineeringValue(pr.D, precision, false)}`],
        ['Ø pitch', `d₂ = ${formatEngineeringValue(pr.d2, precision, false)}  (${shop.spec.toleranceClass.split('/')[0]?.trim() || '6g'} ${formatEngineeringValue(shop.lim.d2Min, precision, false)}…${formatEngineeringValue(shop.lim.d2Max, precision, false)})`, `D₂ = ${formatEngineeringValue(pr.D2, precision, false)}  (${shop.spec.toleranceClass.split('/')[1]?.trim() || '6H'} …${formatEngineeringValue(shop.lim.D2Max, precision, false)})`],
        ['Ø minor', `d₃ = ${formatEngineeringValue(pr.d3, precision, false)}`, `D₁ = ${formatEngineeringValue(pr.D1, precision, false)}  (${shop.spec.toleranceClass.split('/')[1]?.trim() || '6H'} …${formatEngineeringValue(shop.lim.D1Max, precision, false)})`],
      ];

  return (
    <section className="space-y-2">
      <h3 className="text-[15px] font-bold text-[var(--ink)]">
        {isPipe
          ? (isNPT
            ? t12(lang, 'NPT Pipe thread (ASME B1.20.1) — female port section', 'NPT Boru dişi (ASME B1.20.1) — dişi port kesiti ve kılavuz')
            : t12(lang, 'BSPP Pipe thread (ISO 228-1) — female port section', 'BSPP Boru dişi (ISO 228-1) — dişi port kesiti ve kılavuz'))
          : shop.spec.family === 'inch'
          ? t12(lang, `ASME B1.1 (${shop.spec.threadProfile}) thread profile and ${shop.spec.nutStandard} nut`, `ASME B1.1 (${shop.spec.threadProfile}) diş profili ve ${shop.spec.nutStandard} somun`)
          : shop.spec.family === 'trapezoidal'
          ? t12(lang, `DIN 103 (${shop.spec.threadProfile}) lead screw profile and nut`, `DIN 103 (${shop.spec.threadProfile}) diş profili ve somun`)
          : shop.spec.family === 'acme'
          ? t12(lang, `ASME B1.5 (${shop.spec.threadProfile}) Acme thread profile and nut`, `ASME B1.5 (${shop.spec.threadProfile}) Acme profili ve somun`)
          : t12(lang, 'ISO 68-1 thread profile (enlarged) and female nut', 'ISO 68-1 diş profili (büyütülmüş) ve dişi somun')}
      </h3>
      {isPipe ? (
        <div className="overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--bg-1)]">
          <svg viewBox="0 0 1000 580" className="w-full h-auto" role="img">
            <DrawingDefs uid={uid} />
            <rect width="1000" height="580" fill="var(--bg-2)" stroke="var(--line)" />
            <rect x="12" y="12" width="976" height="556" fill="none" stroke="var(--line, #475569)" strokeWidth="2" />
            <FemaleAxialSection uid={uid} shop={shop} lang={lang} isNPT={isNPT} npt={npt} isPipe={isPipe} bspp={bspp} />
          </svg>
        </div>
      ) : (
        <>
          <Iso68ProfileDetail shop={shop} lang={lang} />
          <BoltFemaleSvg1to1 shop={shop} lang={lang} turns={turns} motion={motion} />
        </>
      )}

      <div className="overflow-x-auto rounded-xl border border-[var(--line)]">
        <table className="w-full min-w-[700px] text-left text-[13px]">
          <thead className="bg-[var(--bg-2)] font-mono text-[12px] uppercase text-[var(--alu-dim)]">
            <tr>
              <th className="px-3 py-2">{t12(lang, 'Profile', 'Profil')}</th>
              <th className="px-3 py-2 text-[var(--warn)]">{t12(lang, 'Male (external)', 'Erkek (dış diş)')}</th>
              <th className="px-3 py-2 text-[var(--cyan)]">{t12(lang, 'Female (internal)', 'Dişi (iç diş)')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([k, m, f]) => (
              <tr key={k} className="border-t border-[var(--line)] even:bg-[var(--bg-2)]/40">
                <td className="px-3 py-1.5 font-mono text-[var(--alu-dim)]">{k}</td>
                <td className="px-3 py-1.5 font-mono font-bold tabular-nums text-[var(--warn)]">{m}</td>
                <td className="px-3 py-1.5 font-mono font-bold tabular-nums text-[var(--cyan)]">{f}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function NumTable({ title, rows }: { title: string; rows: [string, string, string][] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-[var(--line)]">
      <div className="bg-[var(--bg-2)] px-3 py-2 text-[13px] font-bold text-[var(--cyan)]">{title}</div>
      <table className="w-full text-[13px]">
        <tbody>
          {rows.map(([k, lab, val]) => (
            <tr key={k + lab} className="border-t border-[var(--line)] even:bg-[var(--bg-2)]/40">
              <td className="px-3 py-1.5 w-16 font-mono font-bold text-[var(--cyan)]">{k}</td>
              <td className="px-3 py-1.5 text-[var(--alu-dim)]">{lab}</td>
              <td className="px-3 py-1.5 text-right font-mono font-bold tabular-nums text-[var(--ink)]">{val}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Front-only RH helical band with axial width on a 1:16 taper cone.
 * Evaluates conical radius at each angle: R(x) = rTip + max(0, xTip - x) / 32.
 */
const PIPE_BTN =
  'rounded-[var(--radius-s)] border border-[var(--line)] bg-[var(--bg-2)] px-2.5 py-1 text-[11px] font-semibold text-[var(--alu-dim)] hover:text-[var(--ink)] cursor-pointer transition-colors';
const PIPE_BTN_ON =
  'rounded-[var(--radius-s)] border border-[var(--accent-line)] bg-[var(--accent-soft)] px-2.5 py-1 text-[11px] font-semibold text-[var(--accent-ink)] cursor-pointer';

function PipeTurning({
  isNPT, isBSPT, isBSPP, isNPSM = false, npt, bspp, npsm, s, size, lang, turns = 0, motion,
}: {
  uid?: string; isNPT: boolean; isBSPT: boolean; isBSPP: boolean; isNPSM?: boolean;
  npt: (typeof NPT_SPECS)[string]; bspp: (typeof BSPP_SPECS)[string]; npsm?: NpsmSpec;
  s: number; size: string; lang: string;
  turns?: number;
  motion?: {
    onPointerDown: (e: React.PointerEvent) => void;
    onPointerUp: () => void;
    onPointerCancel: () => void;
    onContextMenu: (e: React.MouseEvent) => void;
  };
}) {
  const svgRef = React.useRef<SVGSVGElement>(null);
  const [nptfMode, setNptfMode] = useState(() => /NPTF/i.test(size));
  React.useEffect(() => { setNptfMode(/NPTF/i.test(size)); }, [size]);
  const [showPort, setShowPort] = useState(true);
  const [extraTurns, setExtraTurns] = useState(0);
  const totalTurns = (turns ?? 0) + extraTurns;

  const geom: PipeGeom = useMemo(() => {
    if (isNPSM && npsm) {
      return {
        kind: 'npsm', size, P: npsm.pitch, tpi: npsm.tpi, Lt: npsm.threadLength, h: 0.6134 * npsm.pitch,
        dTip: npsm.majorDia, od: npsm.majorDia, s: npsm.hex || s, tapDrill: npsm.tapDrill,
        undercut: { d: npsm.minorDia - 0.2 * npsm.pitch, w: Math.max(1.5 * npsm.pitch, 2) }, taper: 0,
      };
    }
    if (isNPT) {
      return {
        kind: nptfMode ? 'nptf' : 'npt', size, P: npt.pitch, tpi: npt.tpi, Lt: npt.L4, L1: npt.L1, L2: npt.L2,
        E0: npt.e0, E1: npt.e1, h: 0.8 * npt.pitch, dTip: npt.e0 + 0.8 * npt.pitch, od: npt.od, s,
        tapDrill: npt.tapDrill, taper: 1 / 16,
      };
    }
    const h = 0.640327 * bspp.pitch;
    if (isBSPT) {
      const a = iso7GaugeLength(size, bspp.threadLength);
      const Lt = Math.max(a + 2.5 * bspp.pitch, Math.min(bspp.threadLength, a * 1.7));
      return {
        kind: 'bspt', size, P: bspp.pitch, tpi: bspp.tpi, Lt, L1: a, h,
        E1: bspp.pitchDia, dTip: bspp.majorDia - a / 16, od: bspp.majorDia + (Lt - a) / 16 + 0.2, s,
        tapDrill: bspp.tapDrill, taper: 1 / 16,
      };
    }
    return {
      kind: 'bspp', size, P: bspp.pitch, tpi: bspp.tpi, Lt: bspp.threadLength, h, dTip: bspp.majorDia, od: bspp.majorDia,
      s, tapDrill: bspp.tapDrill, undercut: { d: bspp.undercutDia, w: bspp.undercutWidth }, spotface: bspp.spotfaceDia, taper: 0,
    };
  }, [isNPSM, npsm, isNPT, nptfMode, npt, isBSPT, bspp, size, s]);

  const isTaper = geom.taper > 0;
  const stdLabel = isNPSM
    ? 'ASME B1.20.1 NPSM'
    : isNPT
    ? (nptfMode ? 'ASME B1.20.3 NPTF Dryseal' : 'ASME B1.20.1 NPT')
    : isBSPT
    ? 'ISO 7-1 (R)'
    : 'ISO 228-1 (G) · DIN 3852-2';
  const sizeCore = size.replace(/\s*(NPTF|NPT|NPSM)\s*/gi, '').trim();
  const callout = isNPT
    ? `${sizeCore}-${geom.tpi} ${nptfMode ? 'NPTF' : 'NPT'}`
    : isNPSM
    ? `${sizeCore}-${geom.tpi} NPSM`
    : size;

  // make-up state for taper threads (hand-tight L1 → wrench L2)
  const wrenchTurns = isNPT ? npt.wrenchTurns : isTaper ? 2.5 : 0;
  const state = !showPort
    ? null
    : !isTaper
    ? { text: t12(lang, 'Face-sealed — make-up turns do not seal the thread', 'Alın sızdırmazlığı — diş sızdırmazlık yapmaz'), color: 'var(--std)' }
    : totalTurns < -0.25
    ? { text: t12(lang, 'Loose — below hand-tight', 'Gevşek — el sıkılığının altında'), color: 'var(--warn)' }
    : totalTurns < 0.5
    ? { text: t12(lang, 'Hand-tight at gauge plane L₁', 'L₁ mastar düzleminde el sıkı'), color: 'var(--ok)' }
    : totalTurns <= wrenchTurns + 0.25
    ? { text: t12(lang, `Wrench make-up ${totalTurns.toFixed(1)} / ${wrenchTurns} turns`, `Anahtarla sıkma ${totalTurns.toFixed(1)} / ${wrenchTurns} tur`), color: 'var(--cyan)' }
    : { text: t12(lang, 'Over make-up — risk of splitting the port', 'Aşırı sıkma — port çatlama riski'), color: 'var(--bad)' };

  const labels: PipeLabels = {
    section: t12(lang, 'section', 'kesit'),
    view: t12(lang, 'view', 'görünüş'),
    coupling: t12(lang, 'female port (section)', 'dişi port (kesit)'),
    gauge: t12(lang, 'gauge plane', 'mastar düzlemi'),
    wrench: t12(lang, 'wrench', 'anahtar'),
    thread: t12(lang, 'thread', 'diş'),
    taper: t12(lang, 'taper', 'koniklik'),
    bore: t12(lang, 'bore', 'iç çap'),
    hex: t12(lang, 'hex', 'altıgen'),
    undercut: t12(lang, 'undercut', 'kanal'),
    seal: t12(lang, 'seal face', 'sızdırmazlık yüzeyi'),
    title: t12(lang, 'hex nipple', 'altıgen nipel'),
    handTight: t12(lang, 'hand-tight', 'el sıkı'),
  };

  const download = () => {
    const el = svgRef.current;
    if (!el) return;
    const clone = el.cloneNode(true) as SVGSVGElement;
    const vb = (el.getAttribute('viewBox') || '0 0 100 100').split(/\s+/).map(Number);
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    clone.setAttribute('width', `${vb[2].toFixed(2)}mm`);
    clone.setAttribute('height', `${vb[3].toFixed(2)}mm`);
    clone.removeAttribute('style');
    const cs = getComputedStyle(el);
    const markup = clone.outerHTML.replace(/var\((--[\w-]+)(?:,\s*([^)]+))?\)/g, (_m, name: string, fb?: string) => {
      const v = cs.getPropertyValue(name).trim();
      return v || (fb ? fb.trim() : '#000');
    });
    const blob = new Blob(['<?xml version="1.0" encoding="UTF-8"?>\n<!-- AluCAD OS · 1 user unit = 1 mm · ISO 128 / ISO 6410 -->\n', markup], { type: 'image/svg+xml;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${callout.replace(/[^\w.-]+/g, '_')}_nipple.svg`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  const fitKind = isNPT ? 'npt' : isNPSM ? 'iso60' : 'whitworth';
  const fitD = isNPT ? npt.e1 + 0.8 * npt.pitch : geom.od;

  return (
    <div className="rounded-[var(--radius-l)] border border-[var(--line)] bg-[var(--bg-1)]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--line)] px-2.5 py-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="font-mono text-[11.5px] font-bold text-[var(--cyan)]">{stdLabel}</span>
          {isNPT && (
            <div className="flex items-center gap-1" role="group" aria-label="NPT / NPTF">
              <button type="button" aria-pressed={!nptfMode} className={!nptfMode ? PIPE_BTN_ON : PIPE_BTN} onClick={() => setNptfMode(false)}
                title={t12(lang, 'ASME B1.20.1 – crest/root clearance, needs sealant', 'ASME B1.20.1 – tepe/kök boşluklu, sızdırmazlık maddesi gerekir')}>NPT</button>
              <button type="button" aria-pressed={nptfMode} className={nptfMode ? PIPE_BTN_ON : PIPE_BTN} onClick={() => setNptfMode(true)}
                title={t12(lang, 'ASME B1.20.3 – crest/root interference, dry seal', 'ASME B1.20.3 – tepe/kök girişimli, kuru sızdırmazlık')}>NPTF</button>
            </div>
          )}
          <span className="hidden sm:inline font-mono text-[11px] text-[var(--muted)]">
            {isTaper ? t12(lang, `taper 1:16 on Ø · ${isNPT ? 60 : 55}°`, `Ø üzerinde 1:16 koniklik · ${isNPT ? 60 : 55}°`) : t12(lang, `parallel · ${isNPSM ? 60 : 55}°`, `paralel · ${isNPSM ? 60 : 55}°`)}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-1">
          <button type="button" aria-pressed={showPort} className={showPort ? PIPE_BTN_ON : PIPE_BTN} onClick={() => setShowPort((v) => !v)}>
            {t12(lang, 'Female port', 'Dişi port')}
          </button>
          {showPort && isTaper && (
            <div className="flex items-center rounded-[var(--radius-s)] border border-[var(--line)] bg-[var(--bg-2)] font-mono text-[11px]">
              <button type="button" className="px-2 py-1 text-[var(--alu-dim)] hover:text-[var(--ink)] cursor-pointer" onClick={() => setExtraTurns((v) => v - 0.5)} title={t12(lang, 'Loosen ½ turn', '½ tur gevşet')}>−½</button>
              <button type="button" className="border-x border-[var(--line)] px-2 py-1 font-bold text-[var(--cyan)] cursor-pointer" onClick={() => setExtraTurns(-(turns ?? 0))} title={t12(lang, 'Back to hand-tight L₁', 'El sıkı L₁ konumuna dön')}>L₁</button>
              <button type="button" className="px-2 py-1 text-[var(--alu-dim)] hover:text-[var(--ink)] cursor-pointer" onClick={() => setExtraTurns((v) => v + 0.5)} title={t12(lang, 'Tighten ½ turn', '½ tur sık')}>+½</button>
            </div>
          )}
          <button type="button" className={PIPE_BTN} onClick={download}>SVG 1:1</button>
        </div>
      </div>
      <div
        className="p-2 select-none"
        onPointerDown={motion?.onPointerDown}
        onPointerUp={motion?.onPointerUp}
        onPointerCancel={motion?.onPointerCancel}
        onContextMenu={motion?.onContextMenu}
      >
        <PipeNippleDrawing
          g={geom}
          callout={callout}
          standard={stdLabel}
          showPort={showPort}
          turns={isTaper ? totalTurns : 0}
          labels={labels}
          svgRef={svgRef}
        />
      </div>
      {state && (
        <div className="flex flex-wrap items-center gap-2 border-t border-[var(--line)] px-3 py-1.5 font-mono text-[11px]">
          <span className="inline-block h-2 w-2 rounded-full" style={{ background: state.color }} />
          <span style={{ color: state.color }}>{state.text}</span>
          {isNPT && (
            <span className="text-[var(--muted)]">
              · {t12(lang, 'hand', 'el')} {npt.handTurns} + {t12(lang, 'wrench', 'anahtar')} {npt.wrenchTurns} {t12(lang, 'turns', 'tur')}
            </span>
          )}
        </div>
      )}
      <details className="border-t border-[var(--line)]">
        <summary className="cursor-pointer select-none px-3 py-2 font-mono text-[11px] text-[var(--alu-dim)] hover:text-[var(--ink)]">
          {t12(lang, 'Detail Z — thread form, external + internal', 'Detay Z — diş formu, erkek + dişi')}
        </summary>
        <div className="p-2">
          <ThreadDrawings
            view="fit"
            kind={fitKind}
            d={fitD}
            P={geom.P}
            callout={callout}
            standard={stdLabel}
            labels={{
              male: t12(lang, 'External (nipple)', 'Erkek (nipel)'),
              female: t12(lang, 'Internal (port)', 'Dişi (port)'),
              contact: t12(lang, 'flank contact', 'yanak teması'),
              play: t12(lang, nptfMode ? 'crush' : 'play', nptfMode ? 'ezilme' : 'boşluk'),
            }}
          />
        </div>
      </details>
    </div>
  );
}

function planeLabel(plane: ThreadStation['plane'], lang: string) {
  const map: Record<ThreadStation['plane'], [string, string]> = {
    E0: ['E₀ small end', 'E₀ uç'],
    L1: ['L₁ gauge / hand-tight', 'L₁ mastar / el sıkma'],
    L2: ['L₂ effective', 'L₂ etkin diş'],
    L4: ['L₄ vanish', 'L₄ vanish'],
    face: ['Face (mouth)', 'Alın (ağız)'],
    undercut: ['Undercut', 'Kanal (undercut)'],
    spotface: ['Spotface', 'Spotface / alın'],
    end: ['Thread end', 'Diş sonu'],
    turn: ['Turn', 'Hatve'],
  };
  return t12(lang, map[plane][0], map[plane][1]);
}

function StationTable({
  title, rows, lang, male,
}: { title: string; rows: ThreadStation[]; lang: string; male: boolean }) {
  const precision = useGlobalPrecision();
  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--line)]">
      <div className="bg-[var(--bg-2)] px-3 py-2 text-[13px] font-bold text-[var(--cyan)]">{title}</div>
      <table className="w-full min-w-[720px] text-left text-[13px]">
        <thead className="font-mono text-[11px] uppercase tracking-wide text-[var(--alu-dim)]">
          <tr>
            <th className="px-3 py-2">{t12(lang, 'Turn', 'Tur')}</th>
            <th className="px-3 py-2">x mm</th>
            <th className="px-3 py-2">{t12(lang, 'Plane', 'Düzlem')}</th>
            <th className="px-3 py-2">{male ? 'Ød major' : 'ØD major'}</th>
            <th className="px-3 py-2">{male ? 'Ød₂ pitch' : 'ØD₂ pitch'}</th>
            <th className="px-3 py-2">{male ? 'Ød₃ minor' : 'ØD₁ minor'}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, idx) => {
            const keyPlane = r.plane !== 'turn';
            return (
              <tr
                key={`${r.plane}-${r.x}-${idx}`}
                className={`border-t border-[var(--line)] ${keyPlane ? 'bg-[var(--cyan)]/10' : 'even:bg-[var(--line)]/5'}`}
              >
                <td className="px-3 py-1.5 font-mono text-[var(--alu-dim)]">{formatEngineeringValue(r.turn, precision, false)}</td>
                <td className="px-3 py-1.5 font-mono font-bold tabular-nums text-[var(--ink)]">{formatEngineeringValue(r.x, precision, false)}</td>
                <td className={`px-3 py-1.5 ${keyPlane ? 'font-bold text-[var(--cyan)]' : 'text-[var(--muted)]'}`}>
                  {r.plane === 'turn' ? `n = ${r.i}` : planeLabel(r.plane, lang)}
                </td>
                <td className="px-3 py-1.5 font-mono tabular-nums text-[var(--ink)]">{formatEngineeringValue(r.major, precision, false)}</td>
                <td className="px-3 py-1.5 font-mono tabular-nums text-[var(--cyan)]">{formatEngineeringValue(r.pitchDia, precision, false)}</td>
                <td className="px-3 py-1.5 font-mono tabular-nums text-[var(--ink)]">{formatEngineeringValue(r.minor, precision, false)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function PipeCoordinateSection({
  isNPT, isBSPP, isNPSM = false, npt, bspp, npsm, size, lang,
}: {
  isNPT: boolean; isBSPP: boolean; isNPSM?: boolean;
  npt: NptSpec; bspp: BsppSpec; npsm?: NpsmSpec;
  size: string; lang: string;
}) {
  const precision = useGlobalPrecision();
  const uid = useId().replace(/:/g, '');
  const male = (isNPSM && npsm ? npsmMaleStations(npsm) : isNPT ? nptMaleStations(npt) : bsppMaleStations(bspp)).filter((r) => r.plane !== 'turn');
  const female = (isNPSM && npsm ? npsmFemaleStations(npsm) : isNPT ? nptFemaleStations(npt) : bsppFemaleStations(bspp)).filter((r) => r.plane !== 'turn');
  const prof = (isNPT || isNPSM) ? nptProfile(isNPSM && npsm ? npsm.pitch : npt.pitch) : whitworthProfile(bspp.pitch);
  const P = isNPSM && npsm ? npsm.pitch : isNPT ? npt.pitch : bspp.pitch;
  const tpi = isNPSM && npsm ? npsm.tpi : isNPT ? npt.tpi : bspp.tpi;

  return (
    <section className="space-y-3">
      <h3 className="text-[15px] font-bold text-[var(--ink)]">
        {t12(lang, `Pipe thread — male + female, every turn / station (${size})`, `Boru dişi — erkek + dişi, her hatve / her koordinat (${size})`)}
      </h3>
      <p className="text-[13px] text-[var(--alu-dim)]">
        {isNPSM
          ? t12(lang, 'ANSI/ASME B1.20.1 NPSM 2A/2B straight mechanical pipe thread. Cylindrical profile with internal 30° cone swivel seat.', 'ANSI/ASME B1.20.1 NPSM 2A/2B düz mekanik boru dişi. 60° silindirik profil ve 30° konik sızdırmazlık yuvası.')
          : isNPT
          ? t12(lang, 'ASME B1.20.1 · taper 1:16 on diameter. Male x=0 at small end. Female x=0 at the mouth; mouth pitch = male L₁ (E₁). Each turn Ø = E(x) ± 0.8P.', 'ASME B1.20.1 · koniklik 1:16 çapta (1°47′ eksene). x=0 erkek uçta. Dişi x=0 ağızda; ağızda ØD₂ = erkek L₁ (E₁). Her turda Ød / Ød₂ / Ød₃ = E(x) ± 0.8P.')
          : t12(lang, 'ISO 228-1 parallel G. Diameters constant with x. Female: spotface + parallel thread. Male: DIN 3852-2 undercut + thread length.', 'ISO 228-1 paralel G. Çaplar her x’te sabit. Dişi: spotface + silindirik diş. Erkek: DIN 3852-2 kanal + diş boyu.')}
      </p>

      <div className="overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--bg-1)]">
        <svg viewBox="0 0 1000 460" className="w-full h-auto" role="img">
          <DrawingDefs uid={uid} />
          <rect width="1000" height="460" fill="var(--bg-2)" stroke="var(--line)" />
          <rect x="12" y="12" width="976" height="436" fill="none" stroke="var(--line, #475569)" strokeWidth="2" />
          {isNPT ? (
            <NptMaleFemaleView uid={uid} npt={npt} lang={lang} />
          ) : (
            <BsppMaleFemaleView uid={uid} bspp={bspp} lang={lang} />
          )}
        </svg>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <StationTable
          title={t12(lang, `Male — every turn (P = ${formatEngineeringValue(P, precision, false)} mm, ${tpi} TPI)`, `Erkek diş — her hatve (P = ${formatEngineeringValue(P, precision, false)} mm, ${tpi} TPI)`)}
          rows={male}
          lang={lang}
          male
        />
        <StationTable
          title={t12(lang, `Female — every turn (from face inward)`, `Dişi diş — her hatve (alından içeri)`)}
          rows={female}
          lang={lang}
          male={false}
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
        {[
          ['P', `${formatEngineeringValue(P, precision, false)} mm`],
          ['TPI', `${tpi}`],
          [t12(lang, 'Angle', 'Açı'), isNPT ? '60°' : '55°'],
          [isNPT ? 'h = 0.8P' : 'h = 0.640P', `${formatEngineeringValue(('h' in prof ? prof.h : 0), precision, false)} mm`],
          [isNPT ? 'Kesme 0.033P' : 'r = 0.137P', isNPT ? `${formatEngineeringValue(nptProfile(P).trunc, precision, false)} mm` : `${formatEngineeringValue(whitworthProfile(P).r, precision, false)} mm`],
          [t12(lang, 'Taper', 'Koniklik'), isNPT ? '1:16' : t12(lang, 'none (parallel)', 'yok (paralel)')],
        ].map(([k, v]) => (
          <div key={k} className="rounded-lg border border-[var(--line)] bg-[var(--bg-1)] px-3 py-2">
            <div className="text-[11px] text-[var(--muted)]">{k}</div>
            <div className="font-mono text-[14px] font-bold text-[var(--ink)]">{v}</div>
          </div>
        ))}
      </div>
      {isNPT && (
        <p className="font-mono text-[12px] text-[var(--muted)]">
          E(x)_erkek = E₀ + x/16 · E(x)_dişi = E₁ − x/16 · Ømajor = E + 0.8P · Øminor = E − 0.8P · x erkek: uçtan, x dişi: ağızdan.
        </p>
      )}
    </section>
  );
}

function maleTaperBody(x0: number, x1: number, cy: number, r0: number, r1: number, p: number, depth: number) {
  const n = Math.max(6, Math.round((x1 - x0) / p));
  const top: string[] = [`${x0},${cy - r0}`];
  const bot: string[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const x = x0 + t * (x1 - x0);
    const r = r0 + (r1 - r0) * t;
    const dip = i % 2 === 1 ? depth : 0;
    top.push(`${x.toFixed(1)},${(cy - r + dip).toFixed(1)}`);
    bot.push(`${x.toFixed(1)},${(cy + r - dip).toFixed(1)}`);
  }
  bot.reverse();
  return `${top.join(' ')} ${x1},${cy + r1} ${bot.join(' ')}`;
}

function femaleTaperHole(x0: number, x1: number, cy: number, rMin0: number, rMin1: number, rMaj0: number, rMaj1: number, p: number) {
  const n = Math.max(6, Math.round((x1 - x0) / p));
  const wall = 48;
  const top: string[] = [`M ${x0} ${cy - rMaj0 - wall} L ${x0} ${cy - rMaj0}`];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const x = x0 + t * (x1 - x0);
    const rMin = rMin0 + (rMin1 - rMin0) * t;
    const rMaj = rMaj0 + (rMaj1 - rMaj0) * t;
    const r = i % 2 === 0 ? rMin : rMaj;
    top.push(`L ${x.toFixed(1)} ${(cy - r).toFixed(1)}`);
  }
  top.push(`L ${x1} ${cy - rMaj1 - wall} Z`);
  const bot: string[] = [`M ${x0} ${cy + rMaj0 + wall} L ${x0} ${cy + rMaj0}`];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const x = x0 + t * (x1 - x0);
    const rMin = rMin0 + (rMin1 - rMin0) * t;
    const rMaj = rMaj0 + (rMaj1 - rMaj0) * t;
    const r = i % 2 === 0 ? rMin : rMaj;
    bot.push(`L ${x.toFixed(1)} ${(cy + r).toFixed(1)}`);
  }
  bot.push(`L ${x1} ${cy + rMaj1 + wall} Z`);
  return { top: top.join(' '), bot: bot.join(' ') };
}

function NptMaleFemaleView({ uid, npt, lang }: { uid: string; npt: NptSpec; lang: string }) {
  const precision = useGlobalPrecision();
  const sc = 400 / npt.L4;
  const x0 = 70;
  const cyM = 118;
  const cyF = 318;
  const half0 = nptProfile(npt.pitch).halfH;
  const r0 = (npt.e0 + 2 * half0) / 2 * (sc * 0.38);
  const rL4 = (npt.e0 + npt.L4 / 16 + 2 * half0) / 2 * (sc * 0.38);
  const xL1 = x0 + npt.L1 * sc;
  const xL2 = x0 + npt.L2 * sc;
  const xL4 = x0 + npt.L4 * sc;
  const pPx = Math.max(10, npt.pitch * sc);
  const depth = Math.max(4, half0 * sc * 0.7);
  const rFaceMin = (npt.e1 - 2 * half0) / 2 * (sc * 0.38);
  const rFaceMaj = (npt.e1 + 2 * half0) / 2 * (sc * 0.38);
  const rBotMin = (npt.e1 - npt.L2 / 16 - 2 * half0) / 2 * (sc * 0.38);
  const rBotMaj = (npt.e1 - npt.L2 / 16 + 2 * half0) / 2 * (sc * 0.38);
  const xBot = x0 + npt.L2 * sc;
  const hole = femaleTaperHole(x0, xBot, cyF, rFaceMin, rBotMin, rFaceMaj, rBotMaj, pPx);
  const rTap0 = (npt.tapDrill / 2) * (sc * 0.38);
  const rTap1 = rTap0 - (npt.L2 / 16) * (sc * 0.38);

  return (
    <g>
      <text x="24" y="32" fill="var(--ink)" fontSize="14" fontWeight="800">
        {t12(lang, 'Male NPT + female port + taper tap (1:16)', 'Erkek NPT + dişi port + konik kılavuz (1:16)')}
      </text>

      <line x1={x0 - 16} y1={cyM} x2={xL4 + 36} y2={cyM} stroke="var(--cyan)" strokeWidth="1.1" strokeDasharray="12 4 3 4" opacity="0.6" />
      <polygon
        points={axialMalePolygon('npt', npt.pitch, x0, xL4, cyM, r0 * 0.92, rL4 * 0.92)}
        fill={`url(#${uid}-steel)`} stroke="var(--ink)" strokeWidth="1.4"
      />
      {[0, npt.L1, npt.L2, npt.L4].map((L, i) => {
        const x = x0 + L * sc;
        const E = npt.e0 + L / 16;
        return (
          <g key={i}>
            <line x1={x} y1={cyM - 72} x2={x} y2={cyM + 72} stroke={i === 1 ? 'var(--std)' : 'var(--line-strong)'} strokeWidth={i === 1 ? 1.4 : 0.9} strokeDasharray="4 3" />
            <text x={x} y={cyM - 78} textAnchor="middle" fill={i === 1 ? 'var(--std)' : 'var(--cyan)'} fontSize="11" fontWeight="700" fontFamily="ui-monospace, monospace">
              {['E₀', 'L₁', 'L₂', 'L₄'][i]}
            </text>
            <text x={x} y={cyM + 88} textAnchor="middle" fill="var(--alu-dim)" fontSize="11" fontFamily="ui-monospace, monospace">
              Ød₂ {formatEngineeringValue(E, precision, false)}
            </text>
          </g>
        );
      })}

      <text x="24" y="214" fill="var(--ink)" fontSize="13" fontWeight="800">{t12(lang, 'Female NPT port + tap', 'Dişi NPT port + kılavuz')}</text>
      <rect x={x0} y={cyF - 92} width={xL4 - x0 + 70} height={184} fill="var(--bg-1)" stroke="var(--line)" strokeWidth="1.2" />
      <path d={hole.top} fill={`url(#${uid}-hatch)`} stroke="var(--cyan)" strokeWidth="1.5" />
      <path d={hole.bot} fill={`url(#${uid}-hatch)`} stroke="var(--cyan)" strokeWidth="1.5" />
      <line x1={x0} y1={cyF - rTap0} x2={xBot} y2={cyF - rTap1} stroke="var(--warn)" strokeWidth="1.4" strokeDasharray="6 4" />
      <line x1={x0} y1={cyF + rTap0} x2={xBot} y2={cyF + rTap1} stroke="var(--warn)" strokeWidth="1.4" strokeDasharray="6 4" />
      <text x={x0 + 10} y={cyF - 4} fill="var(--warn)" fontSize="12" fontWeight="700" fontFamily="ui-monospace, monospace">
        Øtap {formatEngineeringValue(npt.tapDrill, precision, false)}
      </text>
      <line x1={x0} y1={cyF - 100} x2={x0} y2={cyF + 100} stroke="var(--ok)" strokeWidth="1.5" />
      <text x={x0} y={cyF - 108} textAnchor="middle" fill="var(--ok)" fontSize="11" fontWeight="700" fontFamily="ui-monospace, monospace">
        {t12(lang, 'FACE', 'AĞIZ')} Ød₂={formatEngineeringValue(npt.e1, precision, false)}
      </text>
      <line x1={xL1} y1={cyF - 70} x2={xL1} y2={cyF + 70} stroke="var(--std)" strokeWidth="1.3" strokeDasharray="4 3" />
    </g>
  );
}

function BsppMaleFemaleView({ uid, bspp, lang }: { uid: string; bspp: BsppSpec; lang: string }) {
  const precision = useGlobalPrecision();
  const cyM = 150;
  const xM = 70;
  const L = 340;
  const rMaj = 36;
  const rMin = 26;
  const pPx = Math.max(10, bspp.pitch * 8);
  const male = axialMalePolygon('whitworth', bspp.pitch, xM, xM + L, cyM, rMaj * 0.92, rMaj * 0.92);
  const hole = femaleTaperHole(520, 520 + 250, 220, rMin, rMin, rMaj, rMaj, pPx);
  const rTap = (bspp.tapDrill / bspp.majorDia) * rMaj;

  return (
    <g>
      <text x="24" y="36" fill="var(--ink)" fontSize="14" fontWeight="800">
        {t12(lang, 'BSPP (G) parallel — male + female port + parallel tap', 'BSPP (G) paralel — erkek + dişi port + paralel kılavuz')}
      </text>
      <text x="24" y="58" fill="var(--cyan)" fontSize="13" fontWeight="700" fontFamily="ui-monospace, monospace">
        Ød {formatEngineeringValue(bspp.majorDia, precision, false)} · Ød₂ {formatEngineeringValue(bspp.pitchDia, precision, false)} · Ød₁ {formatEngineeringValue(bspp.minorDia, precision, false)} · L {formatEngineeringValue(bspp.threadLength, precision, false)} · tap Ø{formatEngineeringValue(bspp.tapDrill, precision, false)}
      </text>

      <line x1="50" y1={cyM} x2="430" y2={cyM} stroke="var(--cyan)" strokeWidth="1" strokeDasharray="10 4 2 4" opacity="0.5" />
      <polygon points={male} fill={`url(#${uid}-steel)`} stroke="var(--ink)" strokeWidth="1.4" />
      <rect x={xM - 28} y={cyM - 18} width={24} height={36} fill="var(--bg-1)" stroke="var(--warn)" strokeWidth="1.2" />
      <text x={xM + L / 2} y={cyM + 5} textAnchor="middle" fill="var(--ink)" fontSize="13" fontWeight="800" fontFamily="ui-monospace, monospace">G MALE</text>

      <rect x="500" y="88" width="460" height="300" fill="var(--bg-1)" stroke="var(--line)" strokeWidth="1.2" />
      <path d={hole.top} fill={`url(#${uid}-hatch)`} stroke="var(--cyan)" strokeWidth="1.5" />
      <path d={hole.bot} fill={`url(#${uid}-hatch)`} stroke="var(--cyan)" strokeWidth="1.5" />
      <rect x="520" y="88" width="22" height="300" fill="var(--bg-2)" stroke="var(--cyan)" strokeWidth="1.3" />
      <line x1="542" y1={220 - rTap} x2="770" y2={220 - rTap} stroke="var(--warn)" strokeWidth="1.4" strokeDasharray="6 4" />
      <line x1="542" y1={220 + rTap} x2="770" y2={220 + rTap} stroke="var(--warn)" strokeWidth="1.4" strokeDasharray="6 4" />
      <text x="560" y="216" fill="var(--warn)" fontSize="12" fontWeight="700" fontFamily="ui-monospace, monospace">
        Øtap {formatEngineeringValue(bspp.tapDrill, precision, false)}
      </text>
      <text x="680" y="108" textAnchor="middle" fill="var(--cyan)" fontSize="12" fontWeight="800" fontFamily="ui-monospace, monospace">
        {t12(lang, 'FEMALE PORT + TAP', 'DİŞİ PORT + KILAVUZ')}
      </text>
      <text x="24" y="430" fill="var(--alu-dim)" fontSize="12">
        {t12(lang, '55° Whitworth · r=0.137P · Dowty face seal · parallel tap', '55° Whitworth · r=0.137P · Dowty / O-ring alın sızdırmazlığı · kılavuz silindirik')}
      </text>
    </g>
  );
}

export default FastenerTechnicalDrawing;
