'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Wrench,
  Activity,
  Cog,
  Layers,
  ArrowRight,
  Sparkles,
  Send,
  CheckCircle2,
  AlertTriangle,
  Radio,
  ShieldCheck,
  Sliders,
  Box,
  Scissors,
  Workflow,
  Scale,
} from 'lucide-react';
import { useI18nStore } from '@/store/i18nStore';
import { t12 } from '@/locales/t12';
import { openNotebookLMStudio } from '@/components/notebooklm/NotebookLMStudioModal';

type WorkbenchTab = 'vdi2230' | 'iso281' | 'iso6336' | 'ec3beam';

interface BoltSpec {
  label: string;
  d: number;
  p: number;
  As: number;
  d2: number;
  d3: number;
  dkm: number;
}

const METRIC_BOLT_TABLE: Record<string, BoltSpec> = {
  M6: { label: 'M6 × 1.0', d: 6, p: 1.0, As: 20.1, d2: 5.35, d3: 4.77, dkm: 8.0 },
  M8: { label: 'M8 × 1.25', d: 8, p: 1.25, As: 36.6, d2: 7.19, d3: 6.47, dkm: 10.6 },
  M10: { label: 'M10 × 1.5', d: 10, p: 1.5, As: 58.0, d2: 9.03, d3: 8.16, dkm: 13.3 },
  M12: { label: 'M12 × 1.75', d: 12, p: 1.75, As: 84.3, d2: 10.86, d3: 9.85, dkm: 15.8 },
  M16: { label: 'M16 × 2.0', d: 16, p: 2.0, As: 157.0, d2: 14.7, d3: 13.55, dkm: 20.8 },
  M20: { label: 'M20 × 2.5', d: 20, p: 2.5, As: 245.0, d2: 18.38, d3: 16.93, dkm: 26.0 },
  M24: { label: 'M24 × 3.0', d: 24, p: 3.0, As: 353.0, d2: 22.05, d3: 20.32, dkm: 31.2 },
  M30: { label: 'M30 × 3.5', d: 30, p: 3.5, As: 561.0, d2: 27.73, d3: 25.71, dkm: 39.0 },
};

const BOLT_GRADES: Record<string, { Rp02: number; Rm: number }> = {
  '8.8': { Rp02: 640, Rm: 800 },
  '10.9': { Rp02: 900, Rm: 1040 },
  '12.9': { Rp02: 1080, Rm: 1220 },
};

const BEARING_SERIES: Record<string, { name: string; C_kN: number; C0_kN: number; pExp: number }> = {
  '6004': { name: 'SKF 6004 (20×42×12 Deep Groove)', C_kN: 9.95, C0_kN: 5.0, pExp: 3.0 },
  '6206': { name: 'SKF 6206 (30×62×16 Deep Groove)', C_kN: 20.3, C0_kN: 11.2, pExp: 3.0 },
  '6208': { name: 'SKF 6208 (40×80×18 Deep Groove)', C_kN: 32.5, C0_kN: 19.0, pExp: 3.0 },
  '6310': { name: 'SKF 6310 (50×110×27 Heavy Duty)', C_kN: 65.0, C0_kN: 38.0, pExp: 3.0 },
  NU208: { name: 'FAG NU208-E (40×80×18 Cylindrical)', C_kN: 53.0, C0_kN: 45.5, pExp: 10 / 3 },
  '32210': { name: 'Timken 32210 (50×90×24.75 Tapered)', C_kN: 88.0, C0_kN: 100.0, pExp: 10 / 3 },
};

const BEAM_PROFILES: Record<
  string,
  { label: string; I_cm4: number; W_cm3: number; E_GPa: number; fy_MPa: number }
> = {
  IPE120: { label: 'Steel IPE 120 (S235JR)', I_cm4: 317.8, W_cm3: 53.0, E_GPa: 210, fy_MPa: 235 },
  IPE160: { label: 'Steel IPE 160 (S355J2)', I_cm4: 869.3, W_cm3: 108.7, E_GPa: 210, fy_MPa: 355 },
  IPE200: { label: 'Steel IPE 200 (S355J2)', I_cm4: 1943.0, W_cm3: 194.3, E_GPa: 210, fy_MPa: 355 },
  ALU4080: { label: 'Sigma Alu 40×80 Heavy (6063-T6)', I_cm4: 68.4, W_cm3: 17.1, E_GPa: 69, fy_MPa: 215 },
  ALU8080: { label: 'Sigma Alu 80×80 Heavy (6061-T6)', I_cm4: 172.0, W_cm3: 43.0, E_GPa: 69, fy_MPa: 276 },
};

const ALLOY_DATASHEET: Record<
  string,
  {
    code: string;
    standard: string;
    Rp02: number;
    Rm: number;
    E_GPa: number;
    rho: number;
    alpha: number;
  }
> = {
  '6061-T6': {
    code: 'EN AW-6061-T6 (AlMg1SiCu)',
    standard: 'EN 573-3 / ASTM B209',
    Rp02: 276,
    Rm: 310,
    E_GPa: 68.9,
    rho: 2700,
    alpha: 23.1,
  },
  '7075-T6': {
    code: 'EN AW-7075-T6 (AlZn5.5MgCu)',
    standard: 'EN 485-2 / Aerospace',
    Rp02: 503,
    Rm: 572,
    E_GPa: 71.7,
    rho: 2810,
    alpha: 23.4,
  },
  S355J2: {
    code: 'S355J2+N Structural Steel',
    standard: 'EN 10025-2',
    Rp02: 355,
    Rm: 510,
    E_GPa: 210.0,
    rho: 7850,
    alpha: 12.0,
  },
  '42CrMo4': {
    code: '42CrMo4+QT (AISI 4140)',
    standard: 'EN 10083-3',
    Rp02: 750,
    Rm: 1000,
    E_GPa: 212.0,
    rho: 7850,
    alpha: 12.3,
  },
  AISI316L: {
    code: 'X2CrNiMo17-12-2 (316L)',
    standard: 'EN 10088-2',
    Rp02: 220,
    Rm: 520,
    E_GPa: 193.0,
    rho: 8000,
    alpha: 16.0,
  },
  Ti6Al4V: {
    code: 'Ti-6Al-4V (Grade 5)',
    standard: 'ISO 5832-3 / AMS 4911',
    Rp02: 880,
    Rm: 950,
    E_GPa: 113.8,
    rho: 4430,
    alpha: 8.6,
  },
};

const ISO286_FITS: Record<
  string,
  { code: string; typeTr: string; typeEn: string; minUm: number; maxUm: number; appTr: string; appEn: string }
> = {
  'H7/g6': {
    code: 'H7 / g6',
    typeTr: 'Hassas Kaygan Geçme (Clearance)',
    typeEn: 'Precision Sliding Clearance',
    minUm: +9,
    maxUm: +50,
    appTr: 'Kavrama göbekleri, hassas yataklama',
    appEn: 'Clutch hubs, precision spigots & slide bearings',
  },
  'H7/k6': {
    code: 'H7 / k6',
    typeTr: 'Ara Geçme (Transition Fit)',
    typeEn: 'True Location Transition Fit',
    minUm: -18,
    maxUm: +23,
    appTr: 'Dişli, kasnak ve rulman iç bilezik montajı',
    appEn: 'Gear hubs, pulleys & inner bearing rings',
  },
  'H7/p6': {
    code: 'H7 / p6',
    typeTr: 'Hafif Sıkı Geçme (Light Press)',
    typeEn: 'Locational Interference Fit',
    minUm: -42,
    maxUm: -1,
    appTr: 'Kamasız tork aktarımı, bronz burç presleme',
    appEn: 'Press-fit bushings, collar hubs under medium torque',
  },
  'H7/s6': {
    code: 'H7 / s6',
    typeTr: 'Ağır Sıkı / Sıcak Geçme (Shrink Fit)',
    typeEn: 'Heavy Shrink / Interference Fit',
    minUm: -59,
    maxUm: -18,
    appTr: 'Yüksek dinamik torklu mil-göbek bağlantıları',
    appEn: 'Permanent high-torque shrink-fit couplings',
  },
};

export function HomeBentoMatrix() {
  const { language } = useI18nStore();
  const [activeTab, setActiveTab] = useState<WorkbenchTab>('vdi2230');

  // --- Mode 1: VDI 2230 State ---
  const [boltSize, setBoltSize] = useState<string>('M12');
  const [boltGrade, setBoltGrade] = useState<string>('10.9');
  const [frictionMu, setFrictionMu] = useState<number>(0.12);
  const [axialLoadFa, setAxialLoadFa] = useState<number>(18); // kN

  // --- Mode 2: ISO 281 Bearing State ---
  const [bearingId, setBearingId] = useState<string>('6208');
  const [radialLoadFr, setRadialLoadFr] = useState<number>(4.8); // kN
  const [axialLoadBearingFa, setAxialLoadBearingFa] = useState<number>(1.2); // kN
  const [bearingRpm, setBearingRpm] = useState<number>(1450);

  // --- Mode 3: ISO 6336 Gear State ---
  const [gearModule, setGearModule] = useState<number>(3.0);
  const [pinionTeeth, setPinionTeeth] = useState<number>(21);
  const [wheelTeeth, setWheelTeeth] = useState<number>(65);
  const [gearPowerKw, setGearPowerKw] = useState<number>(15);

  // --- Mode 4: Eurocode 3 Beam State ---
  const [beamProfileKey, setBeamProfileKey] = useState<string>('IPE160');
  const [beamSpanMm, setBeamSpanMm] = useState<number>(2800);
  const [beamLoadKn, setBeamLoadKn] = useState<number>(22);

  // --- Right Column: AeGiS Deterministic Terminal ---
  const [aegisQuery, setAegisQuery] = useState<string>('M16 10.9 μ=0.12');
  const [selectedAlloyKey, setSelectedAlloyKey] = useState<string>('6061-T6');
  const [selectedFitKey, setSelectedFitKey] = useState<string>('H7/k6');

  // 1. VDI 2230 Live Calculation
  const vdiResult = useMemo(() => {
    const spec = METRIC_BOLT_TABLE[boltSize] || METRIC_BOLT_TABLE.M12;
    const grade = BOLT_GRADES[boltGrade] || BOLT_GRADES['10.9'];
    // Exact VDI 2230 thread + torsional combined stress formulation (nu = 0.90 assembly utilization)
    const nu = 0.9;
    const tanP = spec.p / (Math.PI * spec.d2);
    const tanRho = frictionMu / Math.cos((30 * Math.PI) / 180);
    const kTau = 16 / (Math.PI * Math.pow(spec.d3, 3));
    const torsionTerm = 3 * Math.pow((0.5 * spec.d2 * (tanP + tanRho) * spec.As * kTau), 2);
    const sigmaM = (nu * grade.Rp02) / Math.sqrt(1 + torsionTerm);
    const FM_kN = (sigmaM * spec.As) / 1000;
    const MA_Nm = FM_kN * (0.159 * spec.p + 0.577 * frictionMu * spec.d2 + 0.5 * frictionMu * spec.dkm);
    // Load introduction factor Phi_n ≈ 0.28 for steel flange
    const phiN = 0.28;
    const FSA_kN = phiN * axialLoadFa;
    const FKR_kN = FM_kN - (1 - phiN) * axialLoadFa - 3.2; // 3.2 kN embedding loss F_Z
    const totalBoltForce = FM_kN + FSA_kN;
    const sigmaWork = (totalBoltForce * 1000) / spec.As;
    const SF_yield = grade.Rp02 / Math.max(sigmaWork, 1);
    return {
      spec,
      grade,
      FM_kN,
      MA_Nm,
      FKR_kN,
      sigmaWork,
      SF_yield,
      isSafe: SF_yield >= 1.1 && FKR_kN > 2.0,
    };
  }, [boltSize, boltGrade, frictionMu, axialLoadFa]);

  // 2. ISO 281 Bearing Live Calculation
  const bearingResult = useMemo(() => {
    const brg = BEARING_SERIES[bearingId] || BEARING_SERIES['6208'];
    const ratio = axialLoadBearingFa / Math.max(radialLoadFr, 0.1);
    const P_kN = ratio > 0.25 ? 0.56 * radialLoadFr + 1.45 * axialLoadBearingFa : radialLoadFr;
    const L10_mrev = Math.pow(brg.C_kN / Math.max(P_kN, 0.05), brg.pExp);
    const L10h = (L10_mrev * 1e6) / (60 * Math.max(bearingRpm, 10));
    const years24_7 = L10h / 8760;
    return {
      brg,
      P_kN,
      L10_mrev,
      L10h,
      years24_7,
      isSafe: L10h >= 15000,
    };
  }, [bearingId, radialLoadFr, axialLoadBearingFa, bearingRpm]);

  // 3. ISO 6336 Gear Live Calculation
  const gearResult = useMemo(() => {
    const ratio = wheelTeeth / Math.max(pinionTeeth, 1);
    const d1 = gearModule * pinionTeeth;
    const d2 = gearModule * wheelTeeth;
    const centerDist = 0.5 * (d1 + d2);
    const b_mm = 10 * gearModule; // Standard facewidth b = 10*m
    const n1 = 1450;
    const T1_Nm = (9549.3 * gearPowerKw) / n1;
    const T2_Nm = T1_Nm * ratio * 0.98;
    const Ft_N = (2000 * T1_Nm) / Math.max(d1, 1);
    const ZE = 189.8;
    const ZH = 2.495;
    const KA = 1.25;
    const sigmaH =
      ZE * ZH * Math.sqrt(((Ft_N * KA) / (b_mm * d1)) * ((ratio + 1) / ratio));
    const SH = 1280 / Math.max(sigmaH, 1);
    return {
      ratio,
      d1,
      d2,
      centerDist,
      b_mm,
      T1_Nm,
      T2_Nm,
      Ft_N,
      sigmaH,
      SH,
      isSafe: SH >= 1.15,
    };
  }, [gearModule, pinionTeeth, wheelTeeth, gearPowerKw]);

  // 4. Eurocode 3 Beam Live Calculation
  const beamResult = useMemo(() => {
    const prof = BEAM_PROFILES[beamProfileKey] || BEAM_PROFILES.IPE160;
    const L_m = beamSpanMm / 1000;
    const M_kNm = (beamLoadKn * L_m) / 4; // Simply supported center point load
    const sigmaB_MPa = (M_kNm * 1e6) / (prof.W_cm3 * 1e3);
    // delta = (F * L^3) / (48 * E * I)
    const F_N = beamLoadKn * 1000;
    const E_MPa = prof.E_GPa * 1000;
    const I_mm4 = prof.I_cm4 * 1e4;
    const delta_mm = (F_N * Math.pow(beamSpanMm, 3)) / (48 * E_MPa * I_mm4);
    const limitL300 = beamSpanMm / 300;
    const SF = prof.fy_MPa / Math.max(sigmaB_MPa, 0.1);
    return {
      prof,
      M_kNm,
      sigmaB_MPa,
      delta_mm,
      limitL300,
      SF,
      isSafe: SF >= 1.35 && delta_mm <= limitL300,
    };
  }, [beamProfileKey, beamSpanMm, beamLoadKn]);

  // AeGiS Deterministic Command Evaluator
  const aegisOutput = useMemo(() => {
    const q = aegisQuery.trim().toLowerCase();
    // 1. Check bolt pattern (e.g. M8..M30)
    const boltMatch = q.match(/m(6|8|10|12|16|20|24|30)/i);
    if (boltMatch) {
      const mKey = `M${boltMatch[1]}`;
      const spec = METRIC_BOLT_TABLE[mKey] || METRIC_BOLT_TABLE.M12;
      const gradeKey = q.includes('12.9') ? '12.9' : q.includes('8.8') ? '8.8' : '10.9';
      const grade = BOLT_GRADES[gradeKey];
      const muMatch = q.match(/0\.\d+/);
      const mu = muMatch ? parseFloat(muMatch[0]) : 0.12;
      const fm = (0.72 * grade.Rp02 * spec.As) / 1000;
      const ma = fm * (0.159 * spec.p + 0.577 * mu * spec.d2 + 0.5 * mu * spec.dkm);
      return {
        badge: 'VDI 2230 BLATT 1',
        title: `${spec.label} · Grade ${gradeKey} (μ = ${mu})`,
        metrics: [
          { k: 'Tightening Torque M_A', v: `${ma.toFixed(1)} N·m` },
          { k: 'Assembly Preload F_M', v: `${fm.toFixed(1)} kN` },
          { k: 'Stress Area A_s', v: `${spec.As} mm²` },
          { k: 'Yield Strength R_p0.2', v: `${grade.Rp02} MPa` },
        ],
        href: '/bolt-torque',
      };
    }

    // 2. Check power & rpm torque pattern (e.g. "15 kw 1450 rpm")
    const kwMatch = q.match(/(\d+(?:\.\d+)?)\s*kw/i);
    if (kwMatch) {
      const kw = parseFloat(kwMatch[1]);
      const rpmMatch = q.match(/(\d+)\s*rpm/i);
      const rpm = rpmMatch ? parseInt(rpmMatch[1], 10) : 1450;
      const torque = (9549.3 * kw) / Math.max(rpm, 1);
      // Estimate minimum shaft diameter per DIN 743 (tau_zul = 45 MPa)
      const dShaft = Math.cbrt((16 * torque * 1000) / (Math.PI * 45));
      return {
        badge: 'DIN 743 / IEC 60034',
        title: `Drive Shaft Sizing (${kw} kW @ ${rpm} RPM)`,
        metrics: [
          { k: 'Nominal Shaft Torque T', v: `${torque.toFixed(1)} N·m` },
          { k: 'Min Shaft Dia d_min', v: `Ø ${Math.ceil(dShaft)} mm` },
          { k: 'Angular Speed ω', v: `${((2 * Math.PI * rpm) / 60).toFixed(1)} rad/s` },
          { k: 'Recommended Key', v: dShaft > 30 ? '10×8 DIN 6885' : '8×7 DIN 6885' },
        ],
        href: '/shaft-design',
      };
    }

    // 3. Check pressure / stress conversion (MPa to psi / bar)
    const mpaMatch = q.match(/(\d+(?:\.\d+)?)\s*mpa/i);
    if (mpaMatch) {
      const mpa = parseFloat(mpaMatch[1]);
      return {
        badge: 'ISO 80000-4 CONVERSION',
        title: `Stress / Pressure Scaling (${mpa} MPa)`,
        metrics: [
          { k: 'Imperial Pressure', v: `${(mpa * 145.0377).toFixed(0)} psi` },
          { k: 'Imperial Ksi', v: `${(mpa * 0.145038).toFixed(2)} ksi` },
          { k: 'Metric Bar', v: `${(mpa * 10).toFixed(0)} bar` },
          { k: 'N/mm² Equivalent', v: `${mpa.toFixed(1)} N/mm²` },
        ],
        href: '/unit-converter',
      };
    }

    // Default: Bearing lookup
    return {
      badge: 'ISO 281:2007',
      title: 'SKF 6208 Deep Groove (F_r = 4.8 kN @ 1450 RPM)',
      metrics: [
        { k: 'Fatigue Life L_10h', v: '26,420 hrs' },
        { k: 'Dynamic Rating C', v: '32.5 kN' },
        { k: 'Static Safety S_0', v: '3.96' },
        { k: 'Recommended Fit', v: 'Shaft k5 / Housing H7' },
      ],
      href: '/bearings',
    };
  }, [aegisQuery]);

  const activeAlloy = ALLOY_DATASHEET[selectedAlloyKey] || ALLOY_DATASHEET['6061-T6'];
  const activeFit = ISO286_FITS[selectedFitKey] || ISO286_FITS['H7/k6'];

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-4">
      {/* ═══════════════════════════════════════════════════════════════════
          LEFT 7 COLUMNS: LIVE MULTI-PHYSICS INTERACTIVE WORKBENCH CONSOLE
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="lg:col-span-7 flex flex-col justify-between rounded-[var(--radius-m)] border border-[var(--line-strong)] bg-[var(--bg-1)] overflow-hidden shadow-xl">
        {/* Top CNC Instrument Selector Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 bg-[var(--bg-0)] border-b border-[var(--line)]">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[var(--ok)]" />
            <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--ink)]">
              {t12(language, 'LIVE INTERACTIVE SOLVER DECK', 'CANLI İNTERAKTİF HESAPLAMA KONSOLU')}
            </span>
          </div>

          {/* 4 Live Solver Mode Tabs */}
          <div className="flex flex-wrap items-center gap-1 bg-[var(--bg-2)] p-0.5 rounded-[var(--radius-s)] border border-[var(--line)]">
            <button
              type="button"
              onClick={() => setActiveTab('vdi2230')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[2px] font-mono text-[10px] font-bold uppercase transition-colors cursor-pointer ${
                activeTab === 'vdi2230'
                  ? 'bg-[var(--cyan)] text-[var(--bg-0)]'
                  : 'text-[var(--alu-dim)] hover:text-[var(--ink)]'
              }`}
            >
              <Wrench size={11} />
              <span>VDI 2230 Bolt</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('iso281')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[2px] font-mono text-[10px] font-bold uppercase transition-colors cursor-pointer ${
                activeTab === 'iso281'
                  ? 'bg-[var(--cyan)] text-[var(--bg-0)]'
                  : 'text-[var(--alu-dim)] hover:text-[var(--ink)]'
              }`}
            >
              <Activity size={11} />
              <span>ISO 281 Bearing</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('iso6336')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[2px] font-mono text-[10px] font-bold uppercase transition-colors cursor-pointer ${
                activeTab === 'iso6336'
                  ? 'bg-[var(--cyan)] text-[var(--bg-0)]'
                  : 'text-[var(--alu-dim)] hover:text-[var(--ink)]'
              }`}
            >
              <Cog size={11} />
              <span>ISO 6336 Gear</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('ec3beam')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[2px] font-mono text-[10px] font-bold uppercase transition-colors cursor-pointer ${
                activeTab === 'ec3beam'
                  ? 'bg-[var(--cyan)] text-[var(--bg-0)]'
                  : 'text-[var(--alu-dim)] hover:text-[var(--ink)]'
              }`}
            >
              <Layers size={11} />
              <span>EC3 / Beam</span>
            </button>
          </div>
        </div>

        {/* ─── TAB 1: VDI 2230 BOLTED JOINT LIVE WORKBENCH ─── */}
        {activeTab === 'vdi2230' && (
          <div className="p-4 sm:p-5 space-y-4 flex-1 flex flex-col justify-between">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* Left Controls (6 cols) */}
              <div className="md:col-span-6 space-y-3 bg-[var(--bg-0)] p-3.5 rounded-[var(--radius-s)] border border-[var(--line)]">
                <div className="flex items-center justify-between border-b border-[var(--line)] pb-2">
                  <span className="font-mono text-[10px] font-bold uppercase text-[var(--cyan)]">
                    VDI 2230 BLATT 1 PARAMETERS
                  </span>
                  <span className="font-mono text-[10px] text-[var(--std)]">A_s = {vdiResult.spec.As} mm²</span>
                </div>

                {/* Thread Size Pills */}
                <div>
                  <label className="block font-mono text-[10px] text-[var(--alu-dim)] uppercase mb-1">
                    {t12(language, 'ISO Metric Thread Size', 'Metrik Cıvata Çapı')}
                  </label>
                  <div className="grid grid-cols-4 gap-1">
                    {Object.keys(METRIC_BOLT_TABLE).map((sz) => (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => setBoltSize(sz)}
                        className={`py-1 rounded-[2px] font-mono text-[11px] font-bold border transition-colors cursor-pointer ${
                          boltSize === sz
                            ? 'bg-[var(--cyan)]/20 border-[var(--cyan)] text-[var(--cyan)]'
                            : 'bg-[var(--bg-1)] border-[var(--line)] text-[var(--alu-dim)] hover:text-[var(--ink)]'
                        }`}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Grade Selector */}
                <div>
                  <label className="block font-mono text-[10px] text-[var(--alu-dim)] uppercase mb-1">
                    {t12(language, 'ISO 898-1 Property Class', 'Mukavemet Sınıfı (ISO 898-1)')}
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {Object.keys(BOLT_GRADES).map((gr) => (
                      <button
                        key={gr}
                        type="button"
                        onClick={() => setBoltGrade(gr)}
                        className={`py-1 rounded-[2px] font-mono text-[11px] font-bold border transition-colors cursor-pointer ${
                          boltGrade === gr
                            ? 'bg-[var(--std)]/20 border-[var(--std)] text-[var(--ink)]'
                            : 'bg-[var(--bg-1)] border-[var(--line)] text-[var(--alu-dim)] hover:text-[var(--ink)]'
                        }`}
                      >
                        Class {gr}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Friction Slider */}
                <div>
                  <div className="flex justify-between font-mono text-[10px] mb-1">
                    <span className="text-[var(--alu-dim)]">Friction Coeff (μ_G = μ_K):</span>
                    <span className="font-bold text-[var(--cyan)]">{frictionMu.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min={0.08}
                    max={0.24}
                    step={0.01}
                    value={frictionMu}
                    onChange={(e) => setFrictionMu(parseFloat(e.target.value))}
                    className="w-full accent-[var(--cyan)] h-1.5 bg-[var(--bg-2)] cursor-pointer"
                  />
                </div>

                {/* External Axial Load F_A Slider */}
                <div>
                  <div className="flex justify-between font-mono text-[10px] mb-1">
                    <span className="text-[var(--alu-dim)]">External Axial Load (F_A):</span>
                    <span className="font-bold text-[var(--warn)]">{axialLoadFa} kN</span>
                  </div>
                  <input
                    type="range"
                    min={2}
                    max={120}
                    step={1}
                    value={axialLoadFa}
                    onChange={(e) => setAxialLoadFa(parseFloat(e.target.value))}
                    className="w-full accent-[var(--cyan)] h-1.5 bg-[var(--bg-2)] cursor-pointer"
                  />
                </div>
              </div>

              {/* Right Live Readouts & Joint Diagram (6 cols) */}
              <div className="md:col-span-6 flex flex-col justify-between space-y-3">
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="p-3 bg-[var(--bg-0)] border border-[var(--line)] rounded-[var(--radius-s)]">
                    <div className="font-mono text-[9px] text-[var(--muted)] uppercase">
                      TIGHTENING TORQUE (M_A)
                    </div>
                    <div className="font-mono text-2xl font-black text-[var(--cyan)] tabular-nums mt-0.5">
                      {vdiResult.MA_Nm.toFixed(1)} <span className="text-xs font-bold">N·m</span>
                    </div>
                  </div>

                  <div className="p-3 bg-[var(--bg-0)] border border-[var(--line)] rounded-[var(--radius-s)]">
                    <div className="font-mono text-[9px] text-[var(--muted)] uppercase">
                      ASSEMBLY PRELOAD (F_M)
                    </div>
                    <div className="font-mono text-2xl font-black text-[var(--ink)] tabular-nums mt-0.5">
                      {vdiResult.FM_kN.toFixed(1)} <span className="text-xs font-bold text-[var(--alu-dim)]">kN</span>
                    </div>
                  </div>

                  <div className="p-3 bg-[var(--bg-0)] border border-[var(--line)] rounded-[var(--radius-s)]">
                    <div className="font-mono text-[9px] text-[var(--muted)] uppercase">
                      RESIDUAL CLAMP (F_KR)
                    </div>
                    <div
                      className={`font-mono text-base font-bold tabular-nums mt-0.5 ${
                        vdiResult.FKR_kN > 5 ? 'text-[var(--ok)]' : 'text-[var(--bad)]'
                      }`}
                    >
                      {vdiResult.FKR_kN.toFixed(1)} kN
                    </div>
                  </div>

                  <div className="p-3 bg-[var(--bg-0)] border border-[var(--line)] rounded-[var(--radius-s)]">
                    <div className="font-mono text-[9px] text-[var(--muted)] uppercase">
                      YIELD SAFETY (S_F)
                    </div>
                    <div
                      className={`font-mono text-base font-bold tabular-nums mt-0.5 ${
                        vdiResult.SF_yield >= 1.1 ? 'text-[var(--ok)]' : 'text-[var(--warn)]'
                      }`}
                    >
                      S_F = {vdiResult.SF_yield.toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Live VDI 2230 Force-Deformation Joint Triangle SVG */}
                <div className="p-3 bg-[var(--bg-0)] border border-[var(--line)] rounded-[var(--radius-s)]">
                  <div className="flex items-center justify-between font-mono text-[9px] text-[var(--alu-dim)] mb-1">
                    <span>VDI 2230 JOINT RESILIENCE DIAGRAM (F vs Δl)</span>
                    <span className={vdiResult.isSafe ? 'text-[var(--ok)] font-bold' : 'text-[var(--bad)] font-bold'}>
                      {vdiResult.isSafe ? 'PASS · CLAMP SECURE' : 'CHECK GASKET SEPARATION'}
                    </span>
                  </div>
                  <svg viewBox="0 0 260 88" className="w-full h-20">
                    {/* Axes */}
                    <line x1="20" y1="76" x2="245" y2="76" stroke="#334155" strokeWidth="1" />
                    <line x1="20" y1="8" x2="20" y2="76" stroke="#334155" strokeWidth="1" />
                    {/* Bolt Elastic Line k_s (Rising left to apex) */}
                    <line x1="20" y1="76" x2="135" y2="22" stroke="#00e5ff" strokeWidth="2" />
                    {/* Clamped Parts Compression Line k_p (Falling from apex to right) */}
                    <line x1="135" y1="22" x2="225" y2="76" stroke="#10b981" strokeWidth="2" />
                    {/* Preload F_M Horizontal Marker */}
                    <line x1="20" y1="22" x2="135" y2="22" stroke="#60a5fa" strokeWidth="1" strokeDasharray="3 2" />
                    {/* External Axial Load F_A extension */}
                    <line x1="135" y1="22" x2="160" y2="10" stroke="#f59e0b" strokeWidth="2" />
                    <line x1="160" y1="10" x2="160" y2="76" stroke="#f59e0b" strokeWidth="1" strokeDasharray="2 2" />
                    <circle cx="135" cy="22" r="3.5" fill="#00e5ff" />
                    <circle cx="160" cy="10" r="3.5" fill="#f59e0b" />
                    <text x="26" y="19" fill="#00e5ff" fontSize="8" fontFamily="monospace">
                      F_M = {vdiResult.FM_kN.toFixed(0)} kN
                    </text>
                    <text x="166" y="16" fill="#f59e0b" fontSize="8" fontFamily="monospace">
                      +F_A ({axialLoadFa} kN)
                    </text>
                    <text x="170" y="68" fill="#10b981" fontSize="8" fontFamily="monospace">
                      F_KR = {Math.max(0, vdiResult.FKR_kN).toFixed(0)} kN
                    </text>
                  </svg>
                </div>
              </div>
            </div>

            {/* Bottom Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[var(--line)]">
              <button
                type="button"
                onClick={() =>
                  openNotebookLMStudio({
                    moduleSlug: 'bolt-torque',
                    moduleTitle: `VDI 2230 Bolted Joint (${vdiResult.spec.label} Grade ${boltGrade})`,
                    standard: 'VDI 2230 Blatt 1:2015',
                    formula: 'M_A = F_M · (0.159·P + 0.577·μ_G·d_2 + 0.5·μ_K·D_Km)',
                    inputs: { boltSize, boltGrade, frictionMu, axialLoadFa_kN: axialLoadFa },
                    outputs: {
                      TighteningTorque_Nm: vdiResult.MA_Nm,
                      Preload_kN: vdiResult.FM_kN,
                      ResidualClamp_kN: vdiResult.FKR_kN,
                      YieldSafetyFactor: vdiResult.SF_yield,
                    },
                  })
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-s)] bg-[var(--bg-2)] border border-[var(--cyan)]/40 text-[var(--cyan)] font-mono text-[11px] font-bold hover:bg-[var(--cyan)] hover:text-[var(--bg-0)] transition-colors cursor-pointer"
              >
                <Radio size={13} />
                <span>{t12(language, 'NotebookLM Audio Briefing', 'NotebookLM Sesli Analiz')}</span>
              </button>

              <Link
                href="/bolt-torque"
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-[var(--radius-s)] bg-[var(--cyan)] text-[var(--bg-0)] font-mono text-xs font-bold hover:brightness-110 transition-all"
              >
                <span>{t12(language, 'Open Full VDI 2230 Workstation', 'Tam VDI 2230 İş İstasyonunu Aç')}</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        )}

        {/* ─── TAB 2: ISO 281 ROLLING BEARING LIFE WORKBENCH ─── */}
        {activeTab === 'iso281' && (
          <div className="p-4 sm:p-5 space-y-4 flex-1 flex flex-col justify-between">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-6 space-y-3 bg-[var(--bg-0)] p-3.5 rounded-[var(--radius-s)] border border-[var(--line)]">
                <div className="flex items-center justify-between border-b border-[var(--line)] pb-2">
                  <span className="font-mono text-[10px] font-bold uppercase text-[var(--cyan)]">
                    ISO 281:2007 BEARING INPUTS
                  </span>
                  <span className="font-mono text-[10px] text-[var(--std)]">C = {bearingResult.brg.C_kN} kN</span>
                </div>

                <div>
                  <label className="block font-mono text-[10px] text-[var(--alu-dim)] uppercase mb-1">
                    Bearing Designation (SKF / FAG / Timken)
                  </label>
                  <select
                    value={bearingId}
                    onChange={(e) => setBearingId(e.target.value)}
                    className="w-full bg-[var(--bg-1)] border border-[var(--line)] rounded-[var(--radius-s)] px-2.5 py-1.5 font-mono text-xs text-[var(--ink)] font-bold"
                  >
                    {Object.entries(BEARING_SERIES).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex justify-between font-mono text-[10px] mb-1">
                    <span className="text-[var(--alu-dim)]">Radial Load (F_r):</span>
                    <span className="font-bold text-[var(--cyan)]">{radialLoadFr.toFixed(1)} kN</span>
                  </div>
                  <input
                    type="range"
                    min={0.5}
                    max={30}
                    step={0.5}
                    value={radialLoadFr}
                    onChange={(e) => setRadialLoadFr(parseFloat(e.target.value))}
                    className="w-full accent-[var(--cyan)] h-1.5 bg-[var(--bg-2)] cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between font-mono text-[10px] mb-1">
                    <span className="text-[var(--alu-dim)]">Axial Thrust Load (F_a):</span>
                    <span className="font-bold text-[var(--warn)]">{axialLoadBearingFa.toFixed(1)} kN</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={15}
                    step={0.2}
                    value={axialLoadBearingFa}
                    onChange={(e) => setAxialLoadBearingFa(parseFloat(e.target.value))}
                    className="w-full accent-[var(--cyan)] h-1.5 bg-[var(--bg-2)] cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between font-mono text-[10px] mb-1">
                    <span className="text-[var(--alu-dim)]">Rotational Speed (n):</span>
                    <span className="font-bold text-[var(--ink)]">{bearingRpm} RPM</span>
                  </div>
                  <input
                    type="range"
                    min={100}
                    max={6000}
                    step={50}
                    value={bearingRpm}
                    onChange={(e) => setBearingRpm(parseInt(e.target.value, 10))}
                    className="w-full accent-[var(--cyan)] h-1.5 bg-[var(--bg-2)] cursor-pointer"
                  />
                </div>
              </div>

              <div className="md:col-span-6 flex flex-col justify-between space-y-3">
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="p-3 bg-[var(--bg-0)] border border-[var(--line)] rounded-[var(--radius-s)]">
                    <div className="font-mono text-[9px] text-[var(--muted)] uppercase">
                      FATIGUE LIFE (L_10h)
                    </div>
                    <div className="font-mono text-2xl font-black text-[var(--cyan)] tabular-nums mt-0.5">
                      {Math.round(bearingResult.L10h).toLocaleString()}{' '}
                      <span className="text-xs font-bold">hrs</span>
                    </div>
                  </div>

                  <div className="p-3 bg-[var(--bg-0)] border border-[var(--line)] rounded-[var(--radius-s)]">
                    <div className="font-mono text-[9px] text-[var(--muted)] uppercase">
                      REVOLUTIONS (L_10)
                    </div>
                    <div className="font-mono text-2xl font-black text-[var(--ink)] tabular-nums mt-0.5">
                      {bearingResult.L10_mrev.toFixed(1)}{' '}
                      <span className="text-xs font-bold text-[var(--alu-dim)]">10⁶ rev</span>
                    </div>
                  </div>

                  <div className="p-3 bg-[var(--bg-0)] border border-[var(--line)] rounded-[var(--radius-s)]">
                    <div className="font-mono text-[9px] text-[var(--muted)] uppercase">
                      EQUIVALENT LOAD (P)
                    </div>
                    <div className="font-mono text-base font-bold text-[var(--ink)] tabular-nums mt-0.5">
                      {bearingResult.P_kN.toFixed(2)} kN
                    </div>
                  </div>

                  <div className="p-3 bg-[var(--bg-0)] border border-[var(--line)] rounded-[var(--radius-s)]">
                    <div className="font-mono text-[9px] text-[var(--muted)] uppercase">
                      24/7 CONTINUOUS DUTY
                    </div>
                    <div className="font-mono text-base font-bold text-[var(--ok)] tabular-nums mt-0.5">
                      {bearingResult.years24_7.toFixed(1)} years
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-[var(--bg-0)] border border-[var(--line)] rounded-[var(--radius-s)]">
                  <div className="flex items-center justify-between font-mono text-[9px] text-[var(--alu-dim)] mb-1">
                    <span>WEIBULL RELIABILITY SURVIVAL CURVE (R90 → R99)</span>
                    <span className="text-[var(--ok)] font-bold">ISO 281 EXPONENT p = {bearingResult.brg.pExp.toFixed(2)}</span>
                  </div>
                  <div className="grid grid-cols-5 gap-1.5 pt-1">
                    {[
                      { rel: 'R90 (L10h)', factor: 1.0 },
                      { rel: 'R95 (a1=0.64)', factor: 0.64 },
                      { rel: 'R96 (a1=0.55)', factor: 0.55 },
                      { rel: 'R98 (a1=0.37)', factor: 0.37 },
                      { rel: 'R99 (a1=0.25)', factor: 0.25 },
                    ].map((r) => (
                      <div
                        key={r.rel}
                        className="p-1.5 bg-[var(--bg-1)] border border-[var(--line)] rounded-[2px] text-center font-mono"
                      >
                        <div className="text-[8px] text-[var(--muted)]">{r.rel.split(' ')[0]}</div>
                        <div className="text-[10px] font-bold text-[var(--cyan)] tabular-nums">
                          {Math.round(bearingResult.L10h * r.factor).toLocaleString()}h
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[var(--line)]">
              <button
                type="button"
                onClick={() =>
                  openNotebookLMStudio({
                    moduleSlug: 'bearings',
                    moduleTitle: `ISO 281 Bearing Life (${bearingResult.brg.name})`,
                    standard: 'ISO 281:2007',
                    formula: 'L_10h = (10⁶ / (60·n)) · (C / P)^p',
                    inputs: { bearingId, radialLoadFr, axialLoadBearingFa, bearingRpm },
                    outputs: { L10h_hours: bearingResult.L10h, EquivalentLoad_kN: bearingResult.P_kN },
                  })
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-s)] bg-[var(--bg-2)] border border-[var(--cyan)]/40 text-[var(--cyan)] font-mono text-[11px] font-bold hover:bg-[var(--cyan)] hover:text-[var(--bg-0)] transition-colors cursor-pointer"
              >
                <Radio size={13} />
                <span>{t12(language, 'NotebookLM Audio Briefing', 'NotebookLM Sesli Analiz')}</span>
              </button>

              <Link
                href="/bearings"
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-[var(--radius-s)] bg-[var(--cyan)] text-[var(--bg-0)] font-mono text-xs font-bold hover:brightness-110 transition-all"
              >
                <span>{t12(language, 'Open Full ISO 281 Bearing Studio', 'Tam Rulman İş İstasyonunu Aç')}</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        )}

        {/* ─── TAB 3: ISO 6336 SPUR/HELICAL GEAR LIVE WORKBENCH ─── */}
        {activeTab === 'iso6336' && (
          <div className="p-4 sm:p-5 space-y-4 flex-1 flex flex-col justify-between">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-6 space-y-3 bg-[var(--bg-0)] p-3.5 rounded-[var(--radius-s)] border border-[var(--line)]">
                <div className="flex items-center justify-between border-b border-[var(--line)] pb-2">
                  <span className="font-mono text-[10px] font-bold uppercase text-[var(--cyan)]">
                    ISO 6336 GEAR PAIR SIZING
                  </span>
                  <span className="font-mono text-[10px] text-[var(--std)]">α = 20° · 16MnCr5</span>
                </div>

                <div>
                  <label className="block font-mono text-[10px] text-[var(--alu-dim)] uppercase mb-1">
                    Normal Module m_n (DIN 780 Series 1)
                  </label>
                  <div className="grid grid-cols-6 gap-1">
                    {[1.5, 2.0, 2.5, 3.0, 4.0, 5.0].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setGearModule(m)}
                        className={`py-1 rounded-[2px] font-mono text-[11px] font-bold border cursor-pointer ${
                          gearModule === m
                            ? 'bg-[var(--cyan)]/20 border-[var(--cyan)] text-[var(--cyan)]'
                            : 'bg-[var(--bg-1)] border-[var(--line)] text-[var(--alu-dim)]'
                        }`}
                      >
                        m{m}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="flex justify-between font-mono text-[10px] mb-1">
                      <span className="text-[var(--alu-dim)]">Pinion z_1:</span>
                      <span className="font-bold text-[var(--cyan)]">{pinionTeeth}</span>
                    </div>
                    <input
                      type="range"
                      min={14}
                      max={45}
                      step={1}
                      value={pinionTeeth}
                      onChange={(e) => setPinionTeeth(parseInt(e.target.value, 10))}
                      className="w-full accent-[var(--cyan)] h-1.5 bg-[var(--bg-2)] cursor-pointer"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between font-mono text-[10px] mb-1">
                      <span className="text-[var(--alu-dim)]">Wheel z_2:</span>
                      <span className="font-bold text-[var(--ink)]">{wheelTeeth}</span>
                    </div>
                    <input
                      type="range"
                      min={25}
                      max={140}
                      step={1}
                      value={wheelTeeth}
                      onChange={(e) => setWheelTeeth(parseInt(e.target.value, 10))}
                      className="w-full accent-[var(--cyan)] h-1.5 bg-[var(--bg-2)] cursor-pointer"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between font-mono text-[10px] mb-1">
                    <span className="text-[var(--alu-dim)]">Transmitted Power (P @ 1450 RPM):</span>
                    <span className="font-bold text-[var(--ok)]">{gearPowerKw} kW</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={110}
                    step={1}
                    value={gearPowerKw}
                    onChange={(e) => setGearPowerKw(parseFloat(e.target.value))}
                    className="w-full accent-[var(--cyan)] h-1.5 bg-[var(--bg-2)] cursor-pointer"
                  />
                </div>
              </div>

              <div className="md:col-span-6 flex flex-col justify-between space-y-3">
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="p-3 bg-[var(--bg-0)] border border-[var(--line)] rounded-[var(--radius-s)]">
                    <div className="font-mono text-[9px] text-[var(--muted)] uppercase">
                      FLANK CONTACT STRESS (σ_H)
                    </div>
                    <div className="font-mono text-2xl font-black text-[var(--cyan)] tabular-nums mt-0.5">
                      {gearResult.sigmaH.toFixed(0)} <span className="text-xs font-bold">MPa</span>
                    </div>
                  </div>

                  <div className="p-3 bg-[var(--bg-0)] border border-[var(--line)] rounded-[var(--radius-s)]">
                    <div className="font-mono text-[9px] text-[var(--muted)] uppercase">
                      CENTER DISTANCE (a)
                    </div>
                    <div className="font-mono text-2xl font-black text-[var(--ink)] tabular-nums mt-0.5">
                      {gearResult.centerDist.toFixed(1)} <span className="text-xs font-bold text-[var(--alu-dim)]">mm</span>
                    </div>
                  </div>

                  <div className="p-3 bg-[var(--bg-0)] border border-[var(--line)] rounded-[var(--radius-s)]">
                    <div className="font-mono text-[9px] text-[var(--muted)] uppercase">
                      OUTPUT TORQUE (T_2)
                    </div>
                    <div className="font-mono text-base font-bold text-[var(--ink)] tabular-nums mt-0.5">
                      {gearResult.T2_Nm.toFixed(1)} N·m (i={gearResult.ratio.toFixed(2)})
                    </div>
                  </div>

                  <div className="p-3 bg-[var(--bg-0)] border border-[var(--line)] rounded-[var(--radius-s)]">
                    <div className="font-mono text-[9px] text-[var(--muted)] uppercase">
                      PITTING SAFETY (S_H)
                    </div>
                    <div
                      className={`font-mono text-base font-bold tabular-nums mt-0.5 ${
                        gearResult.SH >= 1.15 ? 'text-[var(--ok)]' : 'text-[var(--warn)]'
                      }`}
                    >
                      S_H = {gearResult.SH.toFixed(2)}
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-[var(--bg-0)] border border-[var(--line)] rounded-[var(--radius-s)] flex items-center justify-between">
                  <div className="font-mono text-[10px] space-y-1">
                    <div className="text-[var(--alu)]">
                      Pinion Ød₁ = <strong className="text-[var(--cyan)]">{gearResult.d1.toFixed(1)} mm</strong>
                    </div>
                    <div className="text-[var(--alu)]">
                      Wheel Ød₂ = <strong className="text-[var(--ink)]">{gearResult.d2.toFixed(1)} mm</strong>
                    </div>
                    <div className="text-[var(--muted)]">
                      Tangential Force F_t = {gearResult.Ft_N.toFixed(0)} N
                    </div>
                  </div>
                  <svg viewBox="0 0 130 70" className="w-32 h-16">
                    <circle cx="40" cy="35" r="18" fill="none" stroke="#00e5ff" strokeWidth="2" strokeDasharray="3 2" />
                    <circle cx="40" cy="35" r="4" fill="#00e5ff" />
                    <circle cx="88" cy="35" r="30" fill="none" stroke="#10b981" strokeWidth="2" strokeDasharray="4 2" />
                    <circle cx="88" cy="35" r="5" fill="#10b981" />
                    <line x1="40" y1="35" x2="88" y2="35" stroke="#60a5fa" strokeWidth="1" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[var(--line)]">
              <button
                type="button"
                onClick={() =>
                  openNotebookLMStudio({
                    moduleSlug: 'gears',
                    moduleTitle: `ISO 6336 Gear Pair (m=${gearModule}, z1=${pinionTeeth}, z2=${wheelTeeth})`,
                    standard: 'ISO 6336-2:2019',
                    inputs: { gearModule, pinionTeeth, wheelTeeth, gearPowerKw },
                    outputs: { ContactStress_MPa: gearResult.sigmaH, PittingSafety_SH: gearResult.SH },
                  })
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-s)] bg-[var(--bg-2)] border border-[var(--cyan)]/40 text-[var(--cyan)] font-mono text-[11px] font-bold hover:bg-[var(--cyan)] hover:text-[var(--bg-0)] transition-colors cursor-pointer"
              >
                <Radio size={13} />
                <span>{t12(language, 'NotebookLM Audio Briefing', 'NotebookLM Sesli Analiz')}</span>
              </button>

              <Link
                href="/gears"
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-[var(--radius-s)] bg-[var(--cyan)] text-[var(--bg-0)] font-mono text-xs font-bold hover:brightness-110 transition-all"
              >
                <span>{t12(language, 'Open Full ISO 6336 Gear Workstation', 'Tam Dişli İş İstasyonunu Aç')}</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        )}

        {/* ─── TAB 4: EUROCODE 3 / EN 1999 STRUCTURAL BEAM WORKBENCH ─── */}
        {activeTab === 'ec3beam' && (
          <div className="p-4 sm:p-5 space-y-4 flex-1 flex flex-col justify-between">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-6 space-y-3 bg-[var(--bg-0)] p-3.5 rounded-[var(--radius-s)] border border-[var(--line)]">
                <div className="flex items-center justify-between border-b border-[var(--line)] pb-2">
                  <span className="font-mono text-[10px] font-bold uppercase text-[var(--cyan)]">
                    EN 1993 / EN 1999 BEAM SOLVER
                  </span>
                  <span className="font-mono text-[10px] text-[var(--std)]">
                    I_x = {beamResult.prof.I_cm4} cm⁴
                  </span>
                </div>

                <div>
                  <label className="block font-mono text-[10px] text-[var(--alu-dim)] uppercase mb-1">
                    Structural Section Profile
                  </label>
                  <select
                    value={beamProfileKey}
                    onChange={(e) => setBeamProfileKey(e.target.value)}
                    className="w-full bg-[var(--bg-1)] border border-[var(--line)] rounded-[var(--radius-s)] px-2.5 py-1.5 font-mono text-xs text-[var(--ink)] font-bold"
                  >
                    {Object.entries(BEAM_PROFILES).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex justify-between font-mono text-[10px] mb-1">
                    <span className="text-[var(--alu-dim)]">Support Span Length (L):</span>
                    <span className="font-bold text-[var(--cyan)]">{beamSpanMm} mm</span>
                  </div>
                  <input
                    type="range"
                    min={500}
                    max={8000}
                    step={100}
                    value={beamSpanMm}
                    onChange={(e) => setBeamSpanMm(parseInt(e.target.value, 10))}
                    className="w-full accent-[var(--cyan)] h-1.5 bg-[var(--bg-2)] cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between font-mono text-[10px] mb-1">
                    <span className="text-[var(--alu-dim)]">Mid-Span Point Load (F):</span>
                    <span className="font-bold text-[var(--warn)]">{beamLoadKn} kN</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={150}
                    step={1}
                    value={beamLoadKn}
                    onChange={(e) => setBeamLoadKn(parseFloat(e.target.value))}
                    className="w-full accent-[var(--cyan)] h-1.5 bg-[var(--bg-2)] cursor-pointer"
                  />
                </div>
              </div>

              <div className="md:col-span-6 flex flex-col justify-between space-y-3">
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="p-3 bg-[var(--bg-0)] border border-[var(--line)] rounded-[var(--radius-s)]">
                    <div className="font-mono text-[9px] text-[var(--muted)] uppercase">
                      MAX DEFLECTION (δ_max)
                    </div>
                    <div className="font-mono text-2xl font-black text-[var(--cyan)] tabular-nums mt-0.5">
                      {beamResult.delta_mm.toFixed(2)} <span className="text-xs font-bold">mm</span>
                    </div>
                  </div>

                  <div className="p-3 bg-[var(--bg-0)] border border-[var(--line)] rounded-[var(--radius-s)]">
                    <div className="font-mono text-[9px] text-[var(--muted)] uppercase">
                      BENDING STRESS (σ_b)
                    </div>
                    <div className="font-mono text-2xl font-black text-[var(--ink)] tabular-nums mt-0.5">
                      {beamResult.sigmaB_MPa.toFixed(1)}{' '}
                      <span className="text-xs font-bold text-[var(--alu-dim)]">MPa</span>
                    </div>
                  </div>

                  <div className="p-3 bg-[var(--bg-0)] border border-[var(--line)] rounded-[var(--radius-s)]">
                    <div className="font-mono text-[9px] text-[var(--muted)] uppercase">
                      PEAK MOMENT (M_max)
                    </div>
                    <div className="font-mono text-base font-bold text-[var(--ink)] tabular-nums mt-0.5">
                      {beamResult.M_kNm.toFixed(2)} kN·m
                    </div>
                  </div>

                  <div className="p-3 bg-[var(--bg-0)] border border-[var(--line)] rounded-[var(--radius-s)]">
                    <div className="font-mono text-[9px] text-[var(--muted)] uppercase">
                      YIELD SAFETY (S_F)
                    </div>
                    <div
                      className={`font-mono text-base font-bold tabular-nums mt-0.5 ${
                        beamResult.isSafe ? 'text-[var(--ok)]' : 'text-[var(--warn)]'
                      }`}
                    >
                      S_F = {beamResult.SF.toFixed(2)}
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-[var(--bg-0)] border border-[var(--line)] rounded-[var(--radius-s)] font-mono text-[10px] flex items-center justify-between">
                  <span>
                    L/300 Serviceability Limit: <strong>{beamResult.limitL300.toFixed(2)} mm</strong>
                  </span>
                  <span className={beamResult.isSafe ? 'text-[var(--ok)] font-bold' : 'text-[var(--warn)] font-bold'}>
                    {beamResult.isSafe ? 'EUROCODE PASS' : 'EXCEEDS L/300'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[var(--line)]">
              <Link
                href="/design-studio"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-s)] bg-[var(--bg-2)] border border-[var(--line)] text-[var(--alu)] font-mono text-[11px] font-bold hover:text-[var(--ink)]"
              >
                <Box size={13} className="text-[var(--cyan)]" />
                <span>3D CAD &amp; FEA Studio</span>
              </Link>

              <Link
                href="/beam-deflection"
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-[var(--radius-s)] bg-[var(--cyan)] text-[var(--bg-0)] font-mono text-xs font-bold hover:brightness-110 transition-all"
              >
                <span>{t12(language, 'Open Full Beam Deflection Solver', 'Tam Kiriş Sehim Çözücüsünü Aç')}</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          RIGHT 5 COLUMNS: AEGIS DETERMINISTIC TERMINAL + MATERIAL & FIT LAB
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="lg:col-span-5 flex flex-col gap-4">
        {/* MODULE A: AeGiS Deterministic Command Terminal */}
        <div className="rounded-[var(--radius-m)] border border-[var(--line-strong)] bg-[var(--bg-1)] p-4 flex flex-col justify-between space-y-3 shadow-lg">
          <div className="flex items-center justify-between border-b border-[var(--line)] pb-2">
            <div className="flex items-center gap-2 font-mono text-[11px] font-bold text-[var(--cyan)]">
              <Sparkles size={13} />
              <span>AEGIS DETERMINISTIC FORMULA TERMINAL</span>
            </div>
            <span className="px-1.5 py-0.5 rounded-[2px] bg-[var(--ok)]/15 border border-[var(--ok)]/40 font-mono text-[9px] font-bold text-[var(--ok)]">
              IEEE 754 LIVE
            </span>
          </div>

          {/* Quick Command Presets */}
          <div className="flex flex-wrap items-center gap-1">
            {[
              'M12 10.9 μ=0.12',
              'M16 10.9 μ=0.14',
              'M20 8.8 μ=0.12',
              '15 kW 1450 rpm',
              '355 MPa to psi',
            ].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setAegisQuery(preset)}
                className={`px-2 py-0.5 rounded-[2px] font-mono text-[9px] border transition-colors cursor-pointer ${
                  aegisQuery === preset
                    ? 'bg-[var(--cyan)]/20 border-[var(--cyan)] text-[var(--cyan)] font-bold'
                    : 'bg-[var(--bg-0)] border-[var(--line)] text-[var(--muted)] hover:text-[var(--ink)]'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <div className="relative flex items-center">
            <input
              type="text"
              value={aegisQuery}
              onChange={(e) => setAegisQuery(e.target.value)}
              placeholder="Type e.g. 'M16 10.9', '22 kW 1450 rpm', or '276 MPa'..."
              className="w-full h-9 pl-3 pr-9 rounded-[var(--radius-s)] bg-[var(--bg-0)] border border-[var(--line)] font-mono text-xs text-[var(--ink)] focus:outline-none focus:border-[var(--cyan)]"
            />
            <Send size={13} className="absolute right-3 text-[var(--cyan)] pointer-events-none" />
          </div>

          {/* Instant Deterministic Output Card */}
          <div className="p-3 bg-[var(--bg-0)] border border-[var(--line)] rounded-[var(--radius-s)] space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-[var(--ink)]">{aegisOutput.title}</span>
              <span className="px-1.5 py-0.5 rounded-[2px] bg-[var(--std)]/15 border border-[var(--std)]/30 font-mono text-[9px] font-bold text-[var(--std)]">
                {aegisOutput.badge}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {aegisOutput.metrics.map((m) => (
                <div
                  key={m.k}
                  className="px-2.5 py-1.5 bg-[var(--bg-1)] border border-[var(--line)] rounded-[2px] flex items-center justify-between font-mono text-[10px]"
                >
                  <span className="text-[var(--muted)] truncate mr-1">{m.k}</span>
                  <span className="font-bold text-[var(--cyan)] shrink-0">{m.v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* MODULE B: Quick Material & ISO 286 Fit Reference Deck */}
        <div className="rounded-[var(--radius-m)] border border-[var(--line-strong)] bg-[var(--bg-1)] p-4 flex-1 flex flex-col justify-between space-y-3 shadow-lg">
          <div className="flex items-center justify-between border-b border-[var(--line)] pb-2">
            <span className="font-mono text-[11px] font-bold uppercase text-[var(--ink)] flex items-center gap-1.5">
              <Scale size={13} className="text-[var(--std)]" />
              <span>MATERIAL DB &amp; ISO 286 FIT INSPECTOR</span>
            </span>
            <Link
              href="/handbook"
              className="font-mono text-[10px] font-bold text-[var(--cyan)] hover:underline"
            >
              Handbook →
            </Link>
          </div>

          {/* Alloy Selector Pills */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1">
            {Object.keys(ALLOY_DATASHEET).map((al) => (
              <button
                key={al}
                type="button"
                onClick={() => setSelectedAlloyKey(al)}
                className={`py-1 rounded-[2px] font-mono text-[9px] font-bold border transition-colors cursor-pointer ${
                  selectedAlloyKey === al
                    ? 'bg-[var(--std)]/20 border-[var(--std)] text-[var(--ink)]'
                    : 'bg-[var(--bg-0)] border-[var(--line)] text-[var(--muted)] hover:text-[var(--ink)]'
                }`}
              >
                {al}
              </button>
            ))}
          </div>

          {/* Alloy Telemetry Strip */}
          <div className="p-2.5 bg-[var(--bg-0)] border border-[var(--line)] rounded-[var(--radius-s)] space-y-1.5">
            <div className="flex items-center justify-between font-mono text-[10px]">
              <span className="font-bold text-[var(--ink)]">{activeAlloy.code}</span>
              <span className="text-[var(--std)]">{activeAlloy.standard}</span>
            </div>
            <div className="grid grid-cols-4 gap-1.5 font-mono text-[10px] text-center">
              <div className="p-1.5 bg-[var(--bg-1)] border border-[var(--line)] rounded-[2px]">
                <div className="text-[8px] text-[var(--muted)]">R_p0.2</div>
                <div className="font-bold text-[var(--cyan)]">{activeAlloy.Rp02} MPa</div>
              </div>
              <div className="p-1.5 bg-[var(--bg-1)] border border-[var(--line)] rounded-[2px]">
                <div className="text-[8px] text-[var(--muted)]">UTS R_m</div>
                <div className="font-bold text-[var(--ink)]">{activeAlloy.Rm} MPa</div>
              </div>
              <div className="p-1.5 bg-[var(--bg-1)] border border-[var(--line)] rounded-[2px]">
                <div className="text-[8px] text-[var(--muted)]">Modulus E</div>
                <div className="font-bold text-[var(--ink)]">{activeAlloy.E_GPa} GPa</div>
              </div>
              <div className="p-1.5 bg-[var(--bg-1)] border border-[var(--line)] rounded-[2px]">
                <div className="text-[8px] text-[var(--muted)]">Density ρ</div>
                <div className="font-bold text-[var(--alu)]">{activeAlloy.rho} kg/m³</div>
              </div>
            </div>
          </div>

          {/* ISO 286 Fit Quick Selector (Ø40 mm Reference) */}
          <div className="p-2.5 bg-[var(--bg-0)] border border-[var(--line)] rounded-[var(--radius-s)] flex flex-wrap items-center justify-between gap-2 font-mono text-[10px]">
            <div className="flex items-center gap-1.5">
              <span className="text-[var(--muted)]">ISO 286 (Ø40):</span>
              {Object.keys(ISO286_FITS).map((fKey) => (
                <button
                  key={fKey}
                  type="button"
                  onClick={() => setSelectedFitKey(fKey)}
                  className={`px-1.5 py-0.5 rounded-[2px] border font-bold cursor-pointer ${
                    selectedFitKey === fKey
                      ? 'bg-[var(--cyan)] text-[var(--bg-0)] border-[var(--cyan)]'
                      : 'bg-[var(--bg-1)] text-[var(--alu-dim)] border-[var(--line)]'
                  }`}
                >
                  {fKey}
                </button>
              ))}
            </div>
            <div className="text-[var(--cyan)] font-bold">
              {activeFit.minUm > 0 ? `+${activeFit.minUm}` : activeFit.minUm} to{' '}
              {activeFit.maxUm > 0 ? `+${activeFit.maxUm}` : activeFit.maxUm} μm
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomeBentoMatrix;
