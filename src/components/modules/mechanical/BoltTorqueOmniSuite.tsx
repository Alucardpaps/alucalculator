'use client';

/**
 * BoltTorqueOmniSuite.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Tier 1 Normative & Tier 2 Scientific Fastener Companion Suite for /bolt-torque/
 * - Mode A ('k_factor_chart'):
 *   1. Bidirectional Nut-Factor (K-Factor) & Reverse Torque Solver
 *      Formula: T = K · F · d · (1 - l/100) [ASME PCC-1 Appendix M / Bickford, 2007]
 *      Supports Forward (Force → Torque) and Reverse (Applied Wrench Torque → Clamping Force & Stress)
 *   2. Interactive M3–M36 ISO 898-1 / VDI 2230 Quick Reference Torque & Preload Chart
 *      with 1-Click load into the primary VDI 2230 Assembly solver.
 * - Mode B ('pcd_rivet'):
 *   1. Bolt Circle (PCD) Coordinate, Chordal Pitch, ASME PCC-1 Star Tightening Sequence & Fanuc G81 Generator
 *   2. Countersink Depth (ISO 7721 / NASM 100°) & Blind/Solid Rivet Grip Sizer (MIL-HDBK-5J / Eurocode 9)
 */

import React, { useMemo, useState } from 'react';
import {
    Wrench,
    ArrowLeftRight,
    Copy,
    Check,
    Compass,
    CircleDot,
    Table2,
    Sparkles,
    AlertTriangle,
    CheckCircle2,
} from 'lucide-react';
import { t12 } from '@/locales/t12';

export interface KFactorPreset {
    id: string;
    nameEn: string;
    nameTr: string;
    kNominal: number;
    kRange: [number, number];
    muEquiv: number;
    noteEn: string;
    noteTr: string;
}

export const K_FACTOR_PRESETS: KFactorPreset[] = [
    {
        id: 'dry_steel',
        nameEn: 'Dry Steel / Black Oxide (As-Received)',
        nameTr: 'Kuru Çelik / Siyah Oksit (Kutusundan Çıktığı Gibi)',
        kNominal: 0.20,
        kRange: [0.18, 0.24],
        muEquiv: 0.15,
        noteEn: 'Standard unlubricated carbon/alloy steel fastener on steel surface.',
        noteTr: 'Çelik yüzey üzerinde yağlanmamış standart karbon/alaşımlı çelik cıvata.',
    },
    {
        id: 'light_oil',
        nameEn: 'Light Machine Oil / Phosphate & Oil',
        nameTr: 'Hafif Makine Yağlı / Fosfat + Yağ Kaplı',
        kNominal: 0.15,
        kRange: [0.13, 0.17],
        muEquiv: 0.12,
        noteEn: 'Typical industrial assembly condition (VDI 2230 friction class B).',
        noteTr: 'Tipik endüstriyel montaj durumu (VDI 2230 sürtünme sınıfı B).',
    },
    {
        id: 'zinc_electro',
        nameEn: 'Electro-Zinc Plated (Dry)',
        nameTr: 'Elektro-Galvaniz / Çinko Kaplı (Kuru)',
        kNominal: 0.22,
        kRange: [0.18, 0.26],
        muEquiv: 0.16,
        noteEn: 'Electroplated zinc without wax topcoat; higher friction scatter.',
        noteTr: 'Mum üst kaplamasız elektro-çinko; daha yüksek sürtünme dağılımı.',
    },
    {
        id: 'hdg_dry',
        nameEn: 'Hot-Dip Galvanized (HDG Dry)',
        nameTr: 'Sıcak Daldırma Galvaniz (Kuru HDG)',
        kNominal: 0.25,
        kRange: [0.22, 0.32],
        muEquiv: 0.19,
        noteEn: 'Rough zinc coating; lubrication strongly recommended for M16+ structural bolts.',
        noteTr: 'Pürüzlü çinko kaplama; M16+ yapısal cıvatalarda yağlama şiddetle önerilir.',
    },
    {
        id: 'cadmium_plated',
        nameEn: 'Cadmium Plated / Aerospace Spec',
        nameTr: 'Kadmiyum Kaplı / Havacılık Standardı',
        kNominal: 0.16,
        kRange: [0.14, 0.18],
        muEquiv: 0.12,
        noteEn: 'Aerospace NAS/AN fasteners with consistent low-friction lubricity.',
        noteTr: 'Düşük ve kararlı sürtünmeli havacılık NAS/AN bağlantı elemanları.',
    },
    {
        id: 'copper_antiseize',
        nameEn: 'Copper / Nickel Anti-Seize Paste',
        nameTr: 'Bakır / Nikel Kaynama Önleyici Pasta',
        kNominal: 0.12,
        kRange: [0.10, 0.14],
        muEquiv: 0.09,
        noteEn: 'Reduces required torque by ~40% vs dry steel! Avoid over-torquing.',
        noteTr: 'Gerekli torku kuru çeliğe göre ~%40 düşürür! Aşırı sıkmaktan kaçının.',
    },
    {
        id: 'mos2_paste',
        nameEn: 'MoS₂ (Molykote) High-Pressure Paste',
        nameTr: 'MoS₂ (Molykote) Yüksek Basınç Pastası',
        kNominal: 0.11,
        kRange: [0.09, 0.13],
        muEquiv: 0.08,
        noteEn: 'Low scatter high-preload assembly paste (VDI 2230 class A).',
        noteTr: 'Düşük dağılımlı yüksek ön yükleme montaj pastası (VDI 2230 sınıf A).',
    },
    {
        id: 'ptfe_wax',
        nameEn: 'PTFE / Fluoropolymer / Wax Topcoat',
        nameTr: 'PTFE / Teflon / Mum Üst Kaplama',
        kNominal: 0.09,
        kRange: [0.08, 0.11],
        muEquiv: 0.07,
        noteEn: 'Ultra-low friction coating; standard dry torque charts will break the bolt!',
        noteTr: 'Ultra düşük sürtünmeli kaplama; standart kuru tork tabloları cıvatayı koparır!',
    },
    {
        id: 'stainless_dry',
        nameEn: 'Stainless Steel A2/A4 (304/316) Dry',
        nameTr: 'Paslanmaz Çelik A2/A4 (304/316) Kuru',
        kNominal: 0.30,
        kRange: [0.25, 0.38],
        muEquiv: 0.23,
        noteEn: 'High cold-welding (galling) risk! Always apply anti-seize or wax on stainless threads.',
        noteTr: 'Yüksek soğuk kaynama (sarma) riski! Paslanmaz dişlerde daima pasta veya mum kullanın.',
    },
];

interface MetricChartRow {
    size: string;
    d: number;
    pitch: number;
    As: number;
    tapDrill: number;
    wrenchHex: number;
}

export const METRIC_QUICK_CHART_ROWS: MetricChartRow[] = [
    { size: 'M3', d: 3, pitch: 0.5, As: 5.03, tapDrill: 2.5, wrenchHex: 5.5 },
    { size: 'M4', d: 4, pitch: 0.7, As: 8.78, tapDrill: 3.3, wrenchHex: 7 },
    { size: 'M5', d: 5, pitch: 0.8, As: 14.2, tapDrill: 4.2, wrenchHex: 8 },
    { size: 'M6', d: 6, pitch: 1.0, As: 20.1, tapDrill: 5.0, wrenchHex: 10 },
    { size: 'M8', d: 8, pitch: 1.25, As: 36.6, tapDrill: 6.8, wrenchHex: 13 },
    { size: 'M10', d: 10, pitch: 1.5, As: 58.0, tapDrill: 8.5, wrenchHex: 16 },
    { size: 'M12', d: 12, pitch: 1.75, As: 84.3, tapDrill: 10.2, wrenchHex: 18 },
    { size: 'M14', d: 14, pitch: 2.0, As: 115.0, tapDrill: 12.0, wrenchHex: 21 },
    { size: 'M16', d: 16, pitch: 2.0, As: 157.0, tapDrill: 14.0, wrenchHex: 24 },
    { size: 'M18', d: 18, pitch: 2.5, As: 192.0, tapDrill: 15.5, wrenchHex: 27 },
    { size: 'M20', d: 20, pitch: 2.5, As: 245.0, tapDrill: 17.5, wrenchHex: 30 },
    { size: 'M22', d: 22, pitch: 2.5, As: 303.0, tapDrill: 19.5, wrenchHex: 34 },
    { size: 'M24', d: 24, pitch: 3.0, As: 353.0, tapDrill: 21.0, wrenchHex: 36 },
    { size: 'M27', d: 27, pitch: 3.0, As: 459.0, tapDrill: 24.0, wrenchHex: 41 },
    { size: 'M30', d: 30, pitch: 3.5, As: 561.0, tapDrill: 26.5, wrenchHex: 46 },
    { size: 'M36', d: 36, pitch: 4.0, As: 817.0, tapDrill: 32.0, wrenchHex: 55 },
];

/**
 * ISO 898-1:2013 Table 3 / ISO 3506-1:2020 Table 5 values. Class 8.8 is diameter
 * dependent (d ≤ 16 mm: Sp 580 / Rp0.2 640 / Rm 800; d > 16 mm: 600 / 660 / 830),
 * so read it through chartGradeProps() instead of the raw row.
 * Stainless (A2-70) has no proof load in ISO 3506-1 — Rp0.2 is used, as VDI 2230 does.
 */
export const CHART_GRADES = [
    { grade: '4.6', Sp: 225, Sy: 240, Su: 400 },
    { grade: '5.8', Sp: 380, Sy: 420, Su: 520 },
    { grade: '8.8', Sp: 580, Sy: 640, Su: 800 },
    { grade: '10.9', Sp: 830, Sy: 940, Su: 1040 },
    { grade: '12.9', Sp: 970, Sy: 1100, Su: 1220 },
    { grade: 'A2-70', Sp: 450, Sy: 450, Su: 700 },
];

/** ISO 4014 bearing face dw,min and ISO 273 medium clearance hole for the quick-chart sizes */
const CHART_DW_DH: Record<string, [number, number]> = {
    M3: [4.57, 3.4], M4: [5.88, 4.5], M5: [6.88, 5.5], M6: [8.88, 6.6], M8: [11.63, 9], M10: [14.63, 11],
    M12: [16.63, 13.5], M14: [19.64, 15.5], M16: [22.49, 17.5], M18: [25.34, 20], M20: [28.19, 22],
    M22: [31.71, 24], M24: [33.61, 26], M27: [38.0, 30], M30: [42.75, 33], M36: [51.11, 39],
};

export function chartNutFactor(row: MetricChartRow, mu: number): number {
    const d2 = row.d - 0.649519 * row.pitch;
    const [dw, dh] = CHART_DW_DH[row.size] ?? [row.wrenchHex * 0.92, row.d * 1.1];
    const DKm = (dw + dh) / 2;
    return row.pitch / (2 * Math.PI * row.d) + 0.57735 * mu * (d2 / row.d) + mu * (DKm / (2 * row.d));
}

export function chartGradeProps(grade: string, d: number): { Sp: number; Sy: number; Su: number } {
    const g = CHART_GRADES.find((row) => row.grade === grade) ?? CHART_GRADES[2];
    if (g.grade === '8.8' && d > 16) return { Sp: 600, Sy: 660, Su: 830 };
    return { Sp: g.Sp, Sy: g.Sy, Su: g.Su };
}

/**
 * Cross-pattern tightening order (1-based hole numbers, holes numbered around the circle).
 * Even n: diametrically opposite pairs; each next pair is the one farthest from all pairs
 * already tightened (ties → farthest from the last pair). Reproduces the ASME PCC-1 legacy
 * pattern: 8 → 1-5-3-7-2-6-4-8, 12 → 1-7-4-10-2-8-5-11-3-9-6-12, 16 → 1-9-5-13-3-11-7-15-….
 * Odd n: star pattern with step ⌊n/2⌋ (5 → 1-3-5-2-4).
 */
export function generateStarTighteningOrder(n: number): number[] {
    if (n <= 3) return Array.from({ length: n }, (_, i) => i + 1);
    if (n % 2 === 1) {
        const step = Math.floor(n / 2);
        return Array.from({ length: n }, (_, k) => ((k * step) % n) + 1);
    }
    const half = n / 2;
    const ang = (i: number) => (i * 180) / half;
    const dist = (a: number, b: number) => { const x = Math.abs(a - b) % 180; return Math.min(x, 180 - x); };
    const chosen: number[] = [0];
    while (chosen.length < half) {
        let best = -1, bestMin = -1, bestLast = -1;
        for (let i = 0; i < half; i++) {
            if (chosen.includes(i)) continue;
            const mn = Math.min(...chosen.map((c) => dist(ang(i), ang(c))));
            const ls = dist(ang(i), ang(chosen[chosen.length - 1]));
            if (mn > bestMin + 1e-9 || (Math.abs(mn - bestMin) < 1e-9 && ls > bestLast + 1e-9)) {
                best = i; bestMin = mn; bestLast = ls;
            }
        }
        chosen.push(best);
    }
    return chosen.flatMap((i) => [i + 1, i + half + 1]);
}

interface BoltTorqueOmniSuiteProps {
    mode: 'k_factor_chart' | 'pcd_rivet';
    language: string;
    currentNominalDiaMm: number;
    currentPreloadKn: number;
    currentTorqueNm: number;
    onApplyBoltPreset: (size: string, grade: string, mu: number) => void;
}

export function BoltTorqueOmniSuite({
    mode,
    language,
    currentNominalDiaMm,
    currentPreloadKn,
    currentTorqueNm,
    onApplyBoltPreset,
}: BoltTorqueOmniSuiteProps) {
    // ─── State for K-Factor & Reverse Torque Calculator ──────────────────────
    const [kSolveDirection, setKSolveDirection] = useState<'forward_torque' | 'reverse_force'>('forward_torque');
    const [kPresetId, setKPresetId] = useState<string>('dry_steel');
    const [kValue, setKValue] = useState<number>(0.20);
    const [lubeReductionPct, setLubeReductionPct] = useState<number>(0);
    const [boltDiaMm, setBoltDiaMm] = useState<number>(currentNominalDiaMm || 12);
    const [stressAreaMm2, setStressAreaMm2] = useState<number>(84.3);
    const [yieldStrengthMpa, setYieldStrengthMpa] = useState<number>(640);
    const [targetClampKn, setTargetClampKn] = useState<number>(Number((currentPreloadKn || 38.5).toFixed(1)));
    const [appliedWrenchTorqueNm, setAppliedWrenchTorqueNm] = useState<number>(Number((currentTorqueNm || 85).toFixed(1)));

    // ─── State for Quick Torque Reference Table ──────────────────────────────
    const [chartMu, setChartMu] = useState<number>(0.14);
    const [chartUtilPct, setChartUtilPct] = useState<number>(70);
    const [chartUnit, setChartUnit] = useState<'Nm' | 'ftlb'>('Nm');

    // ─── State for Bolt Circle (PCD) & Tightening Sequence ───────────────────
    const [pcdMm, setPcdMm] = useState<number>(160);
    const [holeCount, setHoleCount] = useState<number>(8);
    const [startAngleDeg, setStartAngleDeg] = useState<number>(0);
    const [centerX, setCenterX] = useState<number>(0);
    const [centerY, setCenterY] = useState<number>(0);
    const [holeDiaMm, setHoleDiaMm] = useState<number>(13.5);
    const [copiedGcode, setCopiedGcode] = useState<boolean>(false);

    // ─── State for Countersink & Rivet Sizer ─────────────────────────────────
    const [csHoleDiaMm, setCsHoleDiaMm] = useState<number>(6.6);
    const [csOuterDiaMm, setCsOuterDiaMm] = useState<number>(13.4);
    const [csAngleDeg, setCsAngleDeg] = useState<number>(90);
    const [rivetSheet1Mm, setRivetSheet1Mm] = useState<number>(2.0);
    const [rivetSheet2Mm, setRivetSheet2Mm] = useState<number>(2.0);
    const [rivetMat, setRivetMat] = useState<'alu_5052' | 'alu_2117_ad' | 'steel' | 'monel'>('alu_2117_ad');

    // ─── K-Factor Bidirectional Calculation ──────────────────────────────────
    const kCalc = useMemo(() => {
        const dMeters = Math.max(0.001, boltDiaMm / 1000);
        const kEffective = Math.max(0.03, kValue * (1 - Math.max(0, Math.min(70, lubeReductionPct)) / 100));

        if (kSolveDirection === 'forward_torque') {
            const forceN = Math.max(0, targetClampKn * 1000);
            const torqueNm = kEffective * forceN * dMeters;
            const tensileStressMpa = stressAreaMm2 > 0 ? forceN / stressAreaMm2 : 0;
            const utilizationPct = yieldStrengthMpa > 0 ? (tensileStressMpa / yieldStrengthMpa) * 100 : 0;
            return {
                kEffective,
                torqueNm,
                torqueFtLb: torqueNm * 0.737562,
                torqueInLb: torqueNm * 8.85075,
                torqueKgfM: torqueNm * 0.101972,
                forceKn: targetClampKn,
                forceLbf: targetClampKn * 224.809,
                tensileStressMpa,
                utilizationPct,
            };
        } else {
            const torqueNm = Math.max(0, appliedWrenchTorqueNm);
            const forceN = torqueNm / (kEffective * dMeters);
            const forceKn = forceN / 1000;
            const tensileStressMpa = stressAreaMm2 > 0 ? forceN / stressAreaMm2 : 0;
            const utilizationPct = yieldStrengthMpa > 0 ? (tensileStressMpa / yieldStrengthMpa) * 100 : 0;
            return {
                kEffective,
                torqueNm,
                torqueFtLb: torqueNm * 0.737562,
                torqueInLb: torqueNm * 8.85075,
                torqueKgfM: torqueNm * 0.101972,
                forceKn,
                forceLbf: forceKn * 224.809,
                tensileStressMpa,
                utilizationPct,
            };
        }
    }, [kSolveDirection, kValue, lubeReductionPct, boltDiaMm, stressAreaMm2, yieldStrengthMpa, targetClampKn, appliedWrenchTorqueNm]);

    // ─── Bolt Circle (PCD) Calculation ───────────────────────────────────────
    const pcdData = useMemo(() => {
        const n = Math.max(3, Math.min(36, Math.round(holeCount)));
        const r = Math.max(5, pcdMm / 2);
        const stepDeg = 360 / n;
        const chordPitchMm = pcdMm * Math.sin(Math.PI / n);
        const arcPitchMm = (Math.PI * pcdMm) / n;
        const starSeq = generateStarTighteningOrder(n);

        const holes = Array.from({ length: n }, (_, idx) => {
            const angleDeg = startAngleDeg + idx * stepDeg;
            const rad = (angleDeg * Math.PI) / 180;
            const x = centerX + r * Math.cos(rad);
            const y = centerY + r * Math.sin(rad);
            const seqStep = starSeq.indexOf(idx + 1) + 1;
            return {
                holeNo: idx + 1,
                angleDeg: ((angleDeg % 360) + 360) % 360,
                x,
                y,
                tightenOrder: seqStep,
            };
        });

        const gcodeLines = [
            `% (ALUCAD OS - PCD BOLT CIRCLE G81 DRILLING CYCLE)`,
            `(PCD = ${pcdMm.toFixed(2)} MM | N = ${n} HOLES | HOLE DIA = ${holeDiaMm.toFixed(2)} MM)`,
            `G90 G21 G17 G40 G80`,
            `T01 M06 (DRILL DIA ${holeDiaMm.toFixed(2)} MM)`,
            `S1800 M03`,
            `G00 X${holes[0].x.toFixed(3)} Y${holes[0].y.toFixed(3)}`,
            `G43 H01 Z15.0 M08`,
            `G81 Z-22.0 R2.0 F160`,
            ...holes.slice(1).map((h) => `X${h.x.toFixed(3)} Y${h.y.toFixed(3)} (HOLE #${h.holeNo})`),
            `G80`,
            `G00 Z50.0 M09`,
            `M30`,
            `%`,
        ].join('\n');

        return { n, r, stepDeg, chordPitchMm, arcPitchMm, holes, gcodeLines };
    }, [pcdMm, holeCount, startAngleDeg, centerX, centerY, holeDiaMm]);

    // ─── Countersink & Rivet Calculation ─────────────────────────────────────
    const csAndRivet = useMemo(() => {
        const halfAngleRad = ((csAngleDeg / 2) * Math.PI) / 180;
        const tanHalf = Math.max(0.1, Math.tan(halfAngleRad));
        const csDepthMm = Math.max(0, (csOuterDiaMm - csHoleDiaMm) / (2 * tanHalf));
        const tipOffsetMm = csHoleDiaMm / (2 * tanHalf);
        const totalPlungeMm = csDepthMm + tipOffsetMm;

        // Rivet Sizer (MIL-HDBK-5J / Aircraft Sheet Metal Rule)
        const tMax = Math.max(rivetSheet1Mm, rivetSheet2Mm);
        const tTotal = rivetSheet1Mm + rivetSheet2Mm;
        const idealRivetDiaMm = Math.max(2.4, 2.85 * Math.sqrt(tMax));
        const standardRivetSizes = [2.4, 3.0, 3.2, 4.0, 4.8, 5.0, 6.0, 6.4, 8.0];
        const recommendedRivetDia = standardRivetSizes.find((s) => s >= idealRivetDiaMm) || 6.4;
        const drillHoleMm = Number((recommendedRivetDia + 0.1).toFixed(2));
        const unclinchedLengthMm = Number((tTotal + 1.5 * recommendedRivetDia).toFixed(1));
        const bucktailDiaMm = Number((1.5 * recommendedRivetDia).toFixed(1));
        const bucktailHeightMm = Number((0.5 * recommendedRivetDia).toFixed(1));

        const shearMpaMap: Record<typeof rivetMat, number> = {
            alu_5052: 115,
            alu_2117_ad: 207, // Aerospace AD universal rivet (2117-T4)
            steel: 260,
            monel: 340,
        };
        const rivetShearMpa = shearMpaMap[rivetMat];
        const rivetAreaMm2 = (Math.PI * recommendedRivetDia * recommendedRivetDia) / 4;
        const singleShearKn = (rivetAreaMm2 * rivetShearMpa) / 1000;

        return {
            csDepthMm,
            tipOffsetMm,
            totalPlungeMm,
            tMax,
            tTotal,
            recommendedRivetDia,
            drillHoleMm,
            unclinchedLengthMm,
            bucktailDiaMm,
            bucktailHeightMm,
            singleShearKn,
            rivetShearMpa,
        };
    }, [csHoleDiaMm, csOuterDiaMm, csAngleDeg, rivetSheet1Mm, rivetSheet2Mm, rivetMat]);

    if (mode === 'k_factor_chart') {
        return (
            <div className="space-y-4">
                {/* ═══ PART 1: BIDIRECTIONAL K-FACTOR & REVERSE TORQUE CALCULATOR ═══ */}
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
                    {/* Left Inputs */}
                    <div className="xl:col-span-5 rounded-xl border border-white/10 bg-[var(--bg-1)] p-4 space-y-3.5">
                        <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                            <div>
                                <div className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-bold">
                                    ASME PCC-1 App. M / Omni K-Factor Engine
                                </div>
                                <h3 className="text-sm font-bold text-white mt-0.5">
                                    {t12(language, 'Bidirectional K-Factor & Reverse Torque Solver', 'Çift Yönlü K-Faktörü & Ters Tork Çözücü')}
                                </h3>
                            </div>
                            <ArrowLeftRight size={16} className="text-cyan-400" />
                        </div>

                        {/* Direction Switch */}
                        <div className="grid grid-cols-2 gap-1.5 rounded-lg border border-white/10 bg-[var(--bg-0)] p-1">
                            <button
                                type="button"
                                onClick={() => setKSolveDirection('forward_torque')}
                                className={`py-2 px-2 rounded text-[11px] font-bold transition-all cursor-pointer ${
                                    kSolveDirection === 'forward_torque'
                                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                                        : 'text-slate-400 hover:text-white'
                                }`}
                            >
                                {t12(language, '1. Force (F) → Torque (T)', '1. Ön Yük (F) → Tork (T)')}
                            </button>
                            <button
                                type="button"
                                onClick={() => setKSolveDirection('reverse_force')}
                                className={`py-2 px-2 rounded text-[11px] font-bold transition-all cursor-pointer ${
                                    kSolveDirection === 'reverse_force'
                                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                        : 'text-slate-400 hover:text-white'
                                }`}
                            >
                                {t12(language, '2. Wrench Torque (T) → Force (F)', '2. Anahtar Torku (T) → Yük (F)')}
                            </button>
                        </div>

                        {/* Surface & Lubrication Preset */}
                        <div>
                            <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                                {t12(language, 'Surface Coating & Lubrication Preset (Nut Factor K)', 'Yüzey Kaplama & Yağlama Ön Ayarı (Somun Faktörü K)')}
                            </label>
                            <select
                                value={kPresetId}
                                onChange={(e) => {
                                    const id = e.target.value;
                                    setKPresetId(id);
                                    const found = K_FACTOR_PRESETS.find((p) => p.id === id);
                                    if (found) {
                                        setKValue(found.kNominal);
                                        setLubeReductionPct(0);
                                    }
                                }}
                                className="w-full rounded-lg border border-white/10 bg-[var(--bg-0)] px-3 py-2 text-xs text-white font-mono"
                            >
                                {K_FACTOR_PRESETS.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        K = {p.kNominal.toFixed(2)} ({p.kRange[0]}–{p.kRange[1]}) · {t12(language, p.nameEn, p.nameTr)}
                                    </option>
                                ))}
                            </select>
                            <div className="mt-1 text-[10px] text-slate-400 font-mono">
                                {t12(
                                    language,
                                    K_FACTOR_PRESETS.find((p) => p.id === kPresetId)?.noteEn || '',
                                    K_FACTOR_PRESETS.find((p) => p.id === kPresetId)?.noteTr || ''
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2.5">
                            <div>
                                <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                                    {t12(language, 'Nut Factor (K)', 'Somun Faktörü (K)')}
                                </label>
                                <input
                                    type="number"
                                    step={0.01}
                                    min={0.05}
                                    max={0.5}
                                    value={kValue}
                                    onChange={(e) => setKValue(Math.max(0.05, Number(e.target.value)))}
                                    className="w-full rounded-lg border border-white/10 bg-[var(--bg-0)] px-2.5 py-1.5 text-xs font-mono font-bold text-cyan-300"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                                    {t12(language, 'Lube Reduction l (%)', 'Yağlama İndirimi l (%)')}
                                </label>
                                <input
                                    type="number"
                                    step={5}
                                    min={0}
                                    max={60}
                                    value={lubeReductionPct}
                                    onChange={(e) => setLubeReductionPct(Math.max(0, Math.min(60, Number(e.target.value))))}
                                    className="w-full rounded-lg border border-white/10 bg-[var(--bg-0)] px-2.5 py-1.5 text-xs font-mono font-bold text-white"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                            <div>
                                <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                                    {t12(language, 'Bolt Ø d (mm)', 'Çap d (mm)')}
                                </label>
                                <input
                                    type="number"
                                    step={1}
                                    min={2}
                                    max={100}
                                    value={boltDiaMm}
                                    onChange={(e) => {
                                        const dVal = Math.max(2, Number(e.target.value));
                                        setBoltDiaMm(dVal);
                                        const match = METRIC_QUICK_CHART_ROWS.find((r) => r.d === dVal);
                                        if (match) setStressAreaMm2(match.As);
                                    }}
                                    className="w-full rounded-lg border border-white/10 bg-[var(--bg-0)] px-2.5 py-1.5 text-xs font-mono font-bold text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                                    {t12(language, 'Area As (mm²)', 'Kesit As (mm²)')}
                                </label>
                                <input
                                    type="number"
                                    step={1}
                                    min={1}
                                    value={stressAreaMm2}
                                    onChange={(e) => setStressAreaMm2(Math.max(1, Number(e.target.value)))}
                                    className="w-full rounded-lg border border-white/10 bg-[var(--bg-0)] px-2.5 py-1.5 text-xs font-mono font-bold text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                                    {t12(language, 'Yield Sy (MPa)', 'Akma Sy (MPa)')}
                                </label>
                                <input
                                    type="number"
                                    step={20}
                                    min={100}
                                    value={yieldStrengthMpa}
                                    onChange={(e) => setYieldStrengthMpa(Math.max(100, Number(e.target.value)))}
                                    className="w-full rounded-lg border border-white/10 bg-[var(--bg-0)] px-2.5 py-1.5 text-xs font-mono font-bold text-white"
                                />
                            </div>
                        </div>

                        {kSolveDirection === 'forward_torque' ? (
                            <div className="rounded-lg border border-cyan-500/30 bg-cyan-950/20 p-3">
                                <label className="block text-[10px] font-mono uppercase text-cyan-300 font-bold mb-1">
                                    {t12(language, 'Target Clamping Preload Force F (kN)', 'Hedef Ön Gerilme / Sıkma Kuvveti F (kN)')}
                                </label>
                                <input
                                    type="number"
                                    step={1}
                                    min={0.1}
                                    value={targetClampKn}
                                    onChange={(e) => setTargetClampKn(Math.max(0.1, Number(e.target.value)))}
                                    className="w-full rounded-lg border border-cyan-500/40 bg-[var(--bg-0)] px-3 py-2 text-sm font-mono font-bold text-white"
                                />
                            </div>
                        ) : (
                            <div className="rounded-lg border border-amber-500/30 bg-amber-950/20 p-3">
                                <label className="block text-[10px] font-mono uppercase text-amber-300 font-bold mb-1">
                                    {t12(language, 'Applied Wrench Tightening Torque T (N·m)', 'Tork Anahtarı ile Uygulanan Tork T (N·m)')}
                                </label>
                                <input
                                    type="number"
                                    step={1}
                                    min={0.5}
                                    value={appliedWrenchTorqueNm}
                                    onChange={(e) => setAppliedWrenchTorqueNm(Math.max(0.1, Number(e.target.value)))}
                                    className="w-full rounded-lg border border-amber-500/40 bg-[var(--bg-0)] px-3 py-2 text-sm font-mono font-bold text-white"
                                />
                            </div>
                        )}
                    </div>

                    {/* Right Outputs */}
                    <div className="xl:col-span-7 rounded-xl border border-white/10 bg-[var(--bg-1)] p-4 flex flex-col justify-between space-y-4">
                        <div>
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2.5">
                                <div className="font-mono text-xs text-slate-300">
                                    Formula: <strong className="text-cyan-300">T = K · F · d · (1 − l/100)</strong> · K<sub>eff</sub> = {kCalc.kEffective.toFixed(3)}
                                </div>
                                <span className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                                    kCalc.utilizationPct > 100
                                        ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                                        : kCalc.utilizationPct > 85
                                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                }`}>
                                    {kCalc.utilizationPct > 100
                                        ? t12(language, 'YIELD EXCEEDED (OVER-TORQUED)', 'AKMA SINIRI AŞILDI (AŞIRI TORK)')
                                        : t12(language, `ELASTIC SAFE (${kCalc.utilizationPct.toFixed(0)}% Sy)`, `ELASTİK GÜVENLİ (%${kCalc.utilizationPct.toFixed(0)} Sy)`)}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-3">
                                <div className="rounded-lg border border-cyan-500/30 bg-cyan-950/15 p-3">
                                    <div className="text-[9px] font-mono uppercase text-cyan-300">Torque (SI)</div>
                                    <div className="text-xl font-bold font-mono text-white mt-1">{kCalc.torqueNm.toFixed(1)}</div>
                                    <div className="text-[10px] font-mono text-cyan-400">N·m</div>
                                </div>
                                <div className="rounded-lg border border-white/10 bg-[var(--bg-0)] p-3">
                                    <div className="text-[9px] font-mono uppercase text-slate-400">Torque (Imperial ft-lb)</div>
                                    <div className="text-xl font-bold font-mono text-white mt-1">{kCalc.torqueFtLb.toFixed(1)}</div>
                                    <div className="text-[10px] font-mono text-slate-400">lbf·ft ({kCalc.torqueInLb.toFixed(0)} lbf·in)</div>
                                </div>
                                <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/15 p-3">
                                    <div className="text-[9px] font-mono uppercase text-emerald-300">Clamping Force (F)</div>
                                    <div className="text-xl font-bold font-mono text-white mt-1">{kCalc.forceKn.toFixed(2)}</div>
                                    <div className="text-[10px] font-mono text-emerald-400">kN ({kCalc.forceLbf.toFixed(0)} lbf)</div>
                                </div>
                                <div className="rounded-lg border border-white/10 bg-[var(--bg-0)] p-3">
                                    <div className="text-[9px] font-mono uppercase text-slate-400">Tensile Stress (σt)</div>
                                    <div className="text-xl font-bold font-mono text-white mt-1">{kCalc.tensileStressMpa.toFixed(0)}</div>
                                    <div className="text-[10px] font-mono text-slate-400">MPa ({kCalc.utilizationPct.toFixed(1)}% Sy)</div>
                                </div>
                            </div>
                        </div>

                        {/* Lubrication Warning Box */}
                        <div className="rounded-lg border border-white/10 bg-[var(--bg-0)] p-3 text-xs space-y-1.5">
                            <div className="font-mono text-[10px] uppercase tracking-wider text-amber-300 font-bold flex items-center gap-1.5">
                                <AlertTriangle size={13} />
                                {t12(language, 'Why Dry vs Lubricated Torque Matters (Omni / Bickford Rule)', 'Kuru ve Yağlı Tork Farkı Neden Hayati Önem Taşır?')}
                            </div>
                            <p className="text-slate-300 text-[11px] leading-relaxed">
                                {t12(
                                    language,
                                    `Approximately 85%–90% of tightening torque goes into overcoming thread and underhead friction; only 10%–15% stretches the bolt. Applying a dry-steel torque spec (K=0.20) to an anti-seize or MoS₂ lubricated bolt (K=0.11) increases preload by +82% and frequently snaps the fastener during installation.`,
                                    `Uygulanan sıkma torkunun %85–90'ı diş ve kafa altı sürtünmesini yenmeye harcanır; yalnızca %10–15'i cıvatayı uzatır. Kuru çelik için verilen tork değerini (K=0.20) MoS₂ veya bakır pastalı bir cıvataya (K=0.11) uygularsanız, ön gerilme kuvveti +%82 artar ve cıvata montaj sırasında akmaya uğrar veya kopar.`
                                )}
                            </p>
                        </div>
                    </div>
                </div>

                {/* ═══ PART 2: INTERACTIVE M3–M36 ISO 898-1 QUICK TORQUE & PRELOAD CHART ═══ */}
                <div className="rounded-xl border border-white/10 bg-[var(--bg-1)] p-4 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
                        <div>
                            <div className="flex items-center gap-2">
                                <Table2 size={15} className="text-cyan-400" />
                                <h3 className="text-sm font-bold text-white">
                                    {t12(
                                        language,
                                        'Interactive ISO 898-1 / VDI 2230 Metric Bolt Torque Chart (M3 – M36)',
                                        'İnteraktif ISO 898-1 / VDI 2230 Metrik Cıvata Tork ve Ön Yük Tablosu (M3 – M36)'
                                    )}
                                </h3>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                                {t12(
                                    language,
                                    'Click any torque cell to load that bolt size, grade, and friction directly into the full VDI 2230 Assembly Solver.',
                                    'Herhangi bir tork hücresine tıklayarak ilgili cıvata çapı, kalitesi ve sürtünme katsayısını doğrudan ana VDI 2230 çözücüsüne yükleyin.'
                                )}
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-[var(--bg-0)] p-1 text-[10px] font-mono">
                                {[
                                    { mu: 0.10, label: 'μ=0.10 (MoS₂/Oil)' },
                                    { mu: 0.12, label: 'μ=0.12 (Light Oil)' },
                                    { mu: 0.14, label: 'μ=0.14 (Dry Std)' },
                                    { mu: 0.20, label: 'μ=0.20 (Inox/Galv)' },
                                ].map((m) => (
                                    <button
                                        key={m.mu}
                                        type="button"
                                        onClick={() => setChartMu(m.mu)}
                                        className={`px-2 py-1 rounded font-bold cursor-pointer ${
                                            Math.abs(chartMu - m.mu) < 0.005
                                                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                                                : 'text-slate-400 hover:text-white'
                                        }`}
                                    >
                                        {m.label}
                                    </button>
                                ))}
                            </div>

                            <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-[var(--bg-0)] p-1 text-[10px] font-mono">
                                <button
                                    type="button"
                                    onClick={() => setChartUnit('Nm')}
                                    className={`px-2 py-1 rounded font-bold cursor-pointer ${
                                        chartUnit === 'Nm' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400'
                                    }`}
                                >
                                    N·m
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setChartUnit('ftlb')}
                                    className={`px-2 py-1 rounded font-bold cursor-pointer ${
                                        chartUnit === 'ftlb' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400'
                                    }`}
                                >
                                    lbf·ft
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse font-mono text-xs">
                            <thead>
                                <tr className="border-b border-white/10 text-[10px] uppercase text-slate-400 bg-[var(--bg-0)]">
                                    <th className="py-2 px-2.5">Size</th>
                                    <th className="py-2 px-2">Pitch</th>
                                    <th className="py-2 px-2">Tap Drill</th>
                                    <th className="py-2 px-2">Hex (s)</th>
                                    <th className="py-2 px-2">As (mm²)</th>
                                    {CHART_GRADES.map((g) => (
                                        <th key={g.grade} className="py-2 px-2.5 text-right text-cyan-300">
                                            Class {g.grade} ({chartUnit === 'Nm' ? 'N·m' : 'ft·lb'})
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.06]">
                                {METRIC_QUICK_CHART_ROWS.map((row) => {
                                    // VDI 2230 nut factor, same expression as the assembly tab:
                                    // K = P/(2π d) + 0.577 μG d2/d + μK DKm/(2d), DKm = (dw + dh)/2
                                    const kVdi = chartNutFactor(row, chartMu);
                                    return (
                                        <tr key={row.size} className="hover:bg-white/[0.03] transition-colors">
                                            <td className="py-2 px-2.5 font-bold text-white">{row.size}</td>
                                            <td className="py-2 px-2 text-slate-400">{row.pitch} mm</td>
                                            <td className="py-2 px-2 text-emerald-300">Ø{row.tapDrill}</td>
                                            <td className="py-2 px-2 text-slate-300">{row.wrenchHex} mm</td>
                                            <td className="py-2 px-2 text-slate-400">{row.As}</td>
                                            {CHART_GRADES.map((g) => {
                                                const fmKn = (row.As * chartGradeProps(g.grade, row.d).Sp * (chartUtilPct / 100)) / 1000;
                                                const maNm = kVdi * fmKn * row.d;
                                                const displayTorque = chartUnit === 'Nm' ? maNm : maNm * 0.737562;
                                                return (
                                                    <td key={g.grade} className="py-1.5 px-2 text-right">
                                                        <button
                                                            type="button"
                                                            onClick={() => onApplyBoltPreset(row.size, g.grade, chartMu)}
                                                            className="w-full text-right rounded px-1.5 py-1 hover:bg-cyan-500/20 hover:text-cyan-200 transition-colors cursor-pointer group"
                                                            title={`Click to load ${row.size} Class ${g.grade} (Preload Fm = ${fmKn.toFixed(1)} kN)`}
                                                        >
                                                            <span className="font-bold text-white group-hover:text-cyan-300">
                                                                {displayTorque < 10 ? displayTorque.toFixed(1) : Math.round(displayTorque)}
                                                            </span>
                                                            <span className="block text-[9px] text-slate-500 group-hover:text-cyan-400">
                                                                {fmKn.toFixed(1)} kN
                                                            </span>
                                                        </button>
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    }

    // ─── MODE B: BOLT CIRCLE (PCD), COUNTERSINK & RIVET SIZER ────────────────
    return (
        <div className="space-y-4">
            {/* ═══ PART 1: BOLT CIRCLE (PCD) & STAR TIGHTENING SEQUENCE ═══ */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
                <div className="xl:col-span-5 rounded-xl border border-white/10 bg-[var(--bg-1)] p-4 space-y-3.5">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                        <div>
                            <div className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-bold">
                                ASME PCC-1 / ISO 7005 Flange Pattern
                            </div>
                            <h3 className="text-sm font-bold text-white mt-0.5">
                                {t12(language, 'Bolt Circle (PCD) & Star Sequence Generator', 'Delik Dairesi (PCD) & Yıldız Sıkma Sırası Üretici')}
                            </h3>
                        </div>
                        <Compass size={16} className="text-cyan-400" />
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                        <div>
                            <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                                {t12(language, 'Bolt Circle Ø PCD (mm)', 'Bölüm Dairesi Ø PCD (mm)')}
                            </label>
                            <input
                                type="number"
                                step={5}
                                min={10}
                                max={5000}
                                value={pcdMm}
                                onChange={(e) => setPcdMm(Math.max(10, Number(e.target.value)))}
                                className="w-full rounded-lg border border-white/10 bg-[var(--bg-0)] px-2.5 py-1.5 text-xs font-mono font-bold text-cyan-300"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                                {t12(language, 'Number of Bolts (N)', 'Cıvata / Delik Sayısı (N)')}
                            </label>
                            <input
                                type="number"
                                step={1}
                                min={3}
                                max={36}
                                value={holeCount}
                                onChange={(e) => setHoleCount(Math.max(3, Math.min(36, Number(e.target.value))))}
                                className="w-full rounded-lg border border-white/10 bg-[var(--bg-0)] px-2.5 py-1.5 text-xs font-mono font-bold text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                                {t12(language, 'First Hole Angle θ₀ (°)', 'İlk Delik Açısı θ₀ (°)')}
                            </label>
                            <input
                                type="number"
                                step={5}
                                value={startAngleDeg}
                                onChange={(e) => setStartAngleDeg(Number(e.target.value))}
                                className="w-full rounded-lg border border-white/10 bg-[var(--bg-0)] px-2.5 py-1.5 text-xs font-mono font-bold text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                                {t12(language, 'Clearance Hole Ø dh (mm)', 'Delik Çapı Ø dh (mm)')}
                            </label>
                            <input
                                type="number"
                                step={0.5}
                                min={2}
                                value={holeDiaMm}
                                onChange={(e) => setHoleDiaMm(Math.max(2, Number(e.target.value)))}
                                className="w-full rounded-lg border border-white/10 bg-[var(--bg-0)] px-2.5 py-1.5 text-xs font-mono font-bold text-white"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                        <div className="rounded-lg border border-white/10 bg-[var(--bg-0)] p-2.5">
                            <div className="text-[9px] font-mono uppercase text-slate-400">
                                {t12(language, 'Chordal Pitch (Hole-to-Hole)', 'Kiriş Mesafesi (Komşu İki Delik)')}
                            </div>
                            <div className="text-lg font-bold font-mono text-cyan-300 mt-0.5">
                                {pcdData.chordPitchMm.toFixed(2)} mm
                            </div>
                        </div>
                        <div className="rounded-lg border border-white/10 bg-[var(--bg-0)] p-2.5">
                            <div className="text-[9px] font-mono uppercase text-slate-400">
                                {t12(language, 'Angular Step / Arc Pitch', 'Açısal Adım / Yay Boyu')}
                            </div>
                            <div className="text-lg font-bold font-mono text-white mt-0.5">
                                {pcdData.stepDeg.toFixed(1)}° · {pcdData.arcPitchMm.toFixed(1)} mm
                            </div>
                        </div>
                    </div>

                    {/* Interactive SVG Flange Diagram */}
                    <div className="rounded-lg border border-white/10 bg-[var(--bg-0)] p-3 flex flex-col items-center">
                        <svg viewBox="-120 -120 240 240" className="w-full max-w-[230px] h-auto">
                            {/* Outer Flange Circle */}
                            <circle cx={0} cy={0} r={105} fill="var(--bg-2, #0c121d)" stroke="var(--line-strong, #334155)" strokeWidth={2} />
                            {/* Inner Bore Circle */}
                            <circle cx={0} cy={0} r={42} fill="var(--bg-2, #06090e)" stroke="var(--line-strong, #334155)" strokeWidth={1.5} />
                            {/* PCD Dashed Circle */}
                            <circle cx={0} cy={0} r={76} fill="none" stroke="var(--cyan, #00e5ff)" strokeWidth={1.2} strokeDasharray="4 3" />
                            {/* Center Crosshair */}
                            <line x1={-12} y1={0} x2={12} y2={0} stroke="var(--muted, #64748b)" strokeWidth={1} />
                            <line x1={0} y1={-12} x2={0} y2={12} stroke="var(--muted, #64748b)" strokeWidth={1} />
                            {/* Bolt Holes */}
                            {pcdData.holes.map((h) => {
                                const rad = (h.angleDeg * Math.PI) / 180;
                                const cx = 76 * Math.cos(rad);
                                const cy = -76 * Math.sin(rad);
                                return (
                                    <g key={h.holeNo}>
                                        <circle cx={cx} cy={cy} r={8.5} fill="var(--bg-2, #071521)" stroke="var(--ok, #22c55e)" strokeWidth={1.5} />
                                        <text
                                            x={cx}
                                            y={cy + 3}
                                            textAnchor="middle"
                                            className="fill-white font-mono text-[7px] font-bold"
                                        >
                                            {h.tightenOrder}
                                        </text>
                                    </g>
                                );
                            })}
                        </svg>
                        <div className="text-[10px] font-mono text-emerald-400 text-center mt-1">
                            {t12(
                                language,
                                'Numbers inside holes show ASME PCC-1 Star Tightening Sequence (Pass 1: 30% → Pass 2: 70% → Pass 3: 100%)',
                                'Delik içindeki numaralar ASME PCC-1 Yıldız (Çapraz) Sıkma Sırasını gösterir (1. Tur: %30 → 2. Tur: %70 → 3. Tur: %100)'
                            )}
                        </div>
                    </div>
                </div>

                {/* Coordinate Table + Fanuc G81 Output */}
                <div className="xl:col-span-7 rounded-xl border border-white/10 bg-[var(--bg-1)] p-4 flex flex-col justify-between space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2.5">
                        <div className="text-xs font-bold text-white font-mono">
                            {t12(language, 'XY CNC Hole Coordinates & Tightening Pass Order', 'XY CNC Delik Koordinatları & Çapraz Sıkma Sırası')}
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                navigator.clipboard.writeText(pcdData.gcodeLines);
                                setCopiedGcode(true);
                                setTimeout(() => setCopiedGcode(false), 2000);
                            }}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-500/40 bg-cyan-500/15 px-3 py-1.5 text-[10px] font-mono font-bold text-cyan-300 hover:bg-cyan-500/25 cursor-pointer"
                        >
                            {copiedGcode ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                            {copiedGcode
                                ? t12(language, 'G81 CNC Code Copied!', 'G81 CNC Kodu Kopyalandı!')
                                : t12(language, 'Copy Fanuc G81 Drilling Cycle', 'Fanuc G81 Delme Kodunu Kopyala')}
                        </button>
                    </div>

                    <div className="max-h-[260px] overflow-y-auto border border-white/10 rounded-lg">
                        <table className="w-full text-left border-collapse font-mono text-xs">
                            <thead className="sticky top-0 bg-[var(--bg-0)] text-[10px] uppercase text-slate-400 border-b border-white/10">
                                <tr>
                                    <th className="py-2 px-3">Hole #</th>
                                    <th className="py-2 px-3">Angle (°)</th>
                                    <th className="py-2 px-3">X Coord (mm)</th>
                                    <th className="py-2 px-3">Y Coord (mm)</th>
                                    <th className="py-2 px-3 text-right text-emerald-400">Star Tighten Step</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.06]">
                                {pcdData.holes.map((h) => (
                                    <tr key={h.holeNo} className="hover:bg-white/[0.03]">
                                        <td className="py-1.5 px-3 font-bold text-white">#{h.holeNo}</td>
                                        <td className="py-1.5 px-3 text-slate-300">{h.angleDeg.toFixed(1)}°</td>
                                        <td className="py-1.5 px-3 text-cyan-300">{h.x.toFixed(3)}</td>
                                        <td className="py-1.5 px-3 text-cyan-300">{h.y.toFixed(3)}</td>
                                        <td className="py-1.5 px-3 text-right font-bold text-emerald-400">
                                            Step {h.tightenOrder}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <pre className="rounded-lg border border-white/10 bg-[var(--bg-0)] p-2.5 text-[10px] font-mono text-emerald-300 overflow-x-auto max-h-[120px]">
                        {pcdData.gcodeLines}
                    </pre>
                </div>
            </div>

            {/* ═══ PART 2: COUNTERSINK DEPTH & AEROSPACE / BLIND RIVET SIZER ═══ */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {/* Countersink Depth Solver */}
                <div className="rounded-xl border border-white/10 bg-[var(--bg-1)] p-4 space-y-3">
                    <div className="border-b border-white/10 pb-2">
                        <div className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-bold">
                            ISO 7721 / DIN 74 / NASM 100° Countersink
                        </div>
                        <h3 className="text-sm font-bold text-white mt-0.5">
                            {t12(language, 'Countersink Plunge Depth Calculator', 'Havşa Derinliği (Countersink) Hesaplayıcı')}
                        </h3>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                        <div>
                            <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                                {t12(language, 'Hole Ø dh (mm)', 'Delik Ø dh (mm)')}
                            </label>
                            <input
                                type="number"
                                step={0.2}
                                value={csHoleDiaMm}
                                onChange={(e) => setCsHoleDiaMm(Math.max(1, Number(e.target.value)))}
                                className="w-full rounded-lg border border-white/10 bg-[var(--bg-0)] px-2.5 py-1.5 text-xs font-mono font-bold text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                                {t12(language, 'CS Outer Ø D (mm)', 'Havşa Çapı D (mm)')}
                            </label>
                            <input
                                type="number"
                                step={0.2}
                                value={csOuterDiaMm}
                                onChange={(e) => setCsOuterDiaMm(Math.max(csHoleDiaMm + 0.5, Number(e.target.value)))}
                                className="w-full rounded-lg border border-white/10 bg-[var(--bg-0)] px-2.5 py-1.5 text-xs font-mono font-bold text-cyan-300"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                                {t12(language, 'CS Angle α (°)', 'Havşa Açısı α (°)')}
                            </label>
                            <select
                                value={csAngleDeg}
                                onChange={(e) => setCsAngleDeg(Number(e.target.value))}
                                className="w-full rounded-lg border border-white/10 bg-[var(--bg-0)] px-2 py-1.5 text-xs font-mono font-bold text-white"
                            >
                                <option value={60}>60° (Center)</option>
                                <option value={82}>82° (UNC/Imperial)</option>
                                <option value={90}>90° (ISO Metric)</option>
                                <option value={100}>100° (Aerospace)</option>
                                <option value={120}>120° (Sheet Rivet)</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                        <div className="rounded-lg border border-cyan-500/30 bg-cyan-950/15 p-2.5">
                            <div className="text-[9px] font-mono uppercase text-cyan-300">Flush Depth (h)</div>
                            <div className="text-lg font-bold font-mono text-white mt-0.5">{csAndRivet.csDepthMm.toFixed(2)} mm</div>
                            <div className="text-[9px] font-mono text-slate-400">From edge contact</div>
                        </div>
                        <div className="rounded-lg border border-white/10 bg-[var(--bg-0)] p-2.5">
                            <div className="text-[9px] font-mono uppercase text-slate-400">Cone Tip Offset</div>
                            <div className="text-lg font-bold font-mono text-white mt-0.5">{csAndRivet.tipOffsetMm.toFixed(2)} mm</div>
                            <div className="text-[9px] font-mono text-slate-400">Sharp point inside hole</div>
                        </div>
                        <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/15 p-2.5">
                            <div className="text-[9px] font-mono uppercase text-emerald-300">Total CNC Z-Depth</div>
                            <div className="text-lg font-bold font-mono text-white mt-0.5">{csAndRivet.totalPlungeMm.toFixed(2)} mm</div>
                            <div className="text-[9px] font-mono text-emerald-400">Zeroed at sharp tip</div>
                        </div>
                    </div>
                </div>

                {/* Rivet Diameter & Grip Length Sizer */}
                <div className="rounded-xl border border-white/10 bg-[var(--bg-1)] p-4 space-y-3">
                    <div className="border-b border-white/10 pb-2">
                        <div className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold">
                            MIL-HDBK-5J / Aircraft & Sheet Metal Rivet Sizer
                        </div>
                        <h3 className="text-sm font-bold text-white mt-0.5">
                            {t12(language, 'Solid & Blind Rivet Diameter / Grip Sizer', 'Perçin Çapı, Boyu ve Kesme Kapasitesi Hesaplayıcı')}
                        </h3>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                        <div>
                            <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                                {t12(language, 'Plate 1 t₁ (mm)', 'Sac 1 t₁ (mm)')}
                            </label>
                            <input
                                type="number"
                                step={0.5}
                                min={0.5}
                                value={rivetSheet1Mm}
                                onChange={(e) => setRivetSheet1Mm(Math.max(0.4, Number(e.target.value)))}
                                className="w-full rounded-lg border border-white/10 bg-[var(--bg-0)] px-2.5 py-1.5 text-xs font-mono font-bold text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                                {t12(language, 'Plate 2 t₂ (mm)', 'Sac 2 t₂ (mm)')}
                            </label>
                            <input
                                type="number"
                                step={0.5}
                                min={0.5}
                                value={rivetSheet2Mm}
                                onChange={(e) => setRivetSheet2Mm(Math.max(0.4, Number(e.target.value)))}
                                className="w-full rounded-lg border border-white/10 bg-[var(--bg-0)] px-2.5 py-1.5 text-xs font-mono font-bold text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                                {t12(language, 'Rivet Alloy', 'Perçin Malzemesi')}
                            </label>
                            <select
                                value={rivetMat}
                                onChange={(e) => setRivetMat(e.target.value as typeof rivetMat)}
                                className="w-full rounded-lg border border-white/10 bg-[var(--bg-0)] px-2 py-1.5 text-xs font-mono font-bold text-amber-300"
                            >
                                <option value="alu_2117_ad">2117-T4 (AD Aerospace)</option>
                                <option value="alu_5052">5052 Aluminum</option>
                                <option value="steel">Carbon Steel</option>
                                <option value="monel">Monel 400</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                        <div className="rounded-lg border border-amber-500/30 bg-amber-950/15 p-2.5">
                            <div className="text-[9px] font-mono uppercase text-amber-300">Rec. Rivet Ø / Drill</div>
                            <div className="text-lg font-bold font-mono text-white mt-0.5">
                                Ø{csAndRivet.recommendedRivetDia} mm
                            </div>
                            <div className="text-[9px] font-mono text-amber-400">Drill: Ø{csAndRivet.drillHoleMm} mm</div>
                        </div>
                        <div className="rounded-lg border border-white/10 bg-[var(--bg-0)] p-2.5">
                            <div className="text-[9px] font-mono uppercase text-slate-400">Rivet Length (L)</div>
                            <div className="text-lg font-bold font-mono text-white mt-0.5">
                                {csAndRivet.unclinchedLengthMm} mm
                            </div>
                            <div className="text-[9px] font-mono text-slate-400">Grip: {csAndRivet.tTotal.toFixed(1)} mm + 1.5d</div>
                        </div>
                        <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/15 p-2.5">
                            <div className="text-[9px] font-mono uppercase text-emerald-300">Single Shear Cap.</div>
                            <div className="text-lg font-bold font-mono text-white mt-0.5">
                                {csAndRivet.singleShearKn.toFixed(2)} kN
                            </div>
                            <div className="text-[9px] font-mono text-emerald-400">τu = {csAndRivet.rivetShearMpa} MPa</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
