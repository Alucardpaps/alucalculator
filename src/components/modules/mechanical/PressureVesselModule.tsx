'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Droplets, Settings, ShieldAlert, CheckCircle2, AlertTriangle, 
  Layers, Gauge, Activity, FileText, ChevronRight, Check
} from 'lucide-react';
import { useGlobalPrecision, formatEngineeringValue } from '@/components/calculator-kit/precisionUtils';
import { useI18nStore } from '@/store/i18nStore';
import { t12 } from '@/locales/t12';

// -------------------------------------------------------------
// ASME Section VIII Div 1 Steel Material Catalog (UG-23)
// -------------------------------------------------------------
interface VesselMaterial {
  id: string;
  name: string;
  spec: string;
  syMpa: number; // Yield strength (MPa)
  sMpa: number;  // ASME Max Allowable Stress (MPa) at design temp <= 40°C
  density: number; // kg/m^3
}

const ASME_MATERIALS: VesselMaterial[] = [
  { id: 'sa516_70', name: 'ASME SA-516 Gr. 70', spec: 'Carbon Steel (Moderate/Low Temp)', syMpa: 260, sMpa: 138, density: 7850 },
  { id: 'sa516_60', name: 'ASME SA-516 Gr. 60', spec: 'Carbon Steel (Low Temp Service)', syMpa: 220, sMpa: 118, density: 7850 },
  { id: 'sa240_304', name: 'ASME SA-240 Type 304', spec: 'Austenitic Stainless Steel', syMpa: 205, sMpa: 115, density: 7930 },
  { id: 'sa240_316', name: 'ASME SA-240 Type 316L', spec: 'Corrosion Resistant Stainless', syMpa: 170, sMpa: 108, density: 7980 },
  { id: 'sa387_11', name: 'ASME SA-387 Gr. 11', spec: 'Low Alloy Cr-Mo (High Temp)', syMpa: 310, sMpa: 147, density: 7850 },
];

export default function PressureVesselModule() {
  const precision = useGlobalPrecision();
  const language = useI18nStore((s) => s.language);
  const [activeTab, setActiveTab] = useState<'shell' | 'heads' | 'mawp-hydro'>('shell');

  // Design Parameters
  const [materialId, setMaterialId] = useState<string>('sa516_70');
  const [designPressureMpa, setDesignPressureMpa] = useState<number>(2.5); // MPa (25 bar)
  const [innerRadiusMm, setInnerRadiusMm] = useState<number>(600); // mm
  const [nominalThicknessMm, setNominalThicknessMm] = useState<number>(14); // mm
  const [corrosionAllowanceMm, setCorrosionAllowanceMm] = useState<number>(2.0); // mm
  const [jointEfficiency, setJointEfficiency] = useState<number>(0.85); // E: 1.0, 0.85, 0.70
  const [vesselType, setVesselType] = useState<'cylinder' | 'sphere'>('cylinder');

  // Head Selection for Tab 2
  const [selectedHeadType, setSelectedHeadType] = useState<'ellipsoidal' | 'torispherical' | 'hemispherical' | 'flat'>('ellipsoidal');

  // Active Material
  const activeMaterial = useMemo(
    () => ASME_MATERIALS.find((m) => m.id === materialId) || ASME_MATERIALS[0],
    [materialId]
  );

  // -------------------------------------------------------------
  // Tab 1: Shell Stress & Thickness Calculations (UG-27)
  // -------------------------------------------------------------
  const shellResults = useMemo(() => {
    const P = Math.max(0.01, designPressureMpa);
    const R = Math.max(10, innerRadiusMm);
    const t = Math.max(0.5, nominalThicknessMm);
    const CA = Math.max(0, corrosionAllowanceMm);
    const E = jointEfficiency;
    const S = activeMaterial.sMpa;
    const Sy = activeMaterial.syMpa;

    const tCorroded = Math.max(0.1, t - CA);
    const isThinWalled = R / t >= 10;
    const thickWallRatio = t / R;

    let reqThicknessMm = 0;
    let hoopStressMpa = 0;
    let longStressMpa = 0;
    let maxStressMpa = 0;
    let codeLimitExceeded = false;

    if (vesselType === 'cylinder') {
      // ASME UG-27(c)(1) Circumferential (Hoop) Required Thickness:
      // t_req = (P * R) / (S * E - 0.6 * P) + CA
      const denomHoop = S * E - 0.6 * P;
      if (denomHoop > 0) {
        reqThicknessMm = (P * R) / denomHoop + CA;
      } else {
        codeLimitExceeded = true;
      }

      if (isThinWalled) {
        hoopStressMpa = (P * (R + 0.6 * tCorroded)) / tCorroded;
        longStressMpa = (P * R) / (2 * tCorroded);
      } else {
        // Thick cylinder Lamé equations at inner surface
        const Ro = R + tCorroded;
        hoopStressMpa = P * ((Ro * Ro + R * R) / (Ro * Ro - R * R));
        longStressMpa = P * ((R * R) / (Ro * Ro - R * R));
      }
      maxStressMpa = hoopStressMpa;
    } else {
      // ASME UG-27(d) Spherical Shell:
      // t_req = (P * R) / (2 * S * E - 0.2 * P) + CA
      const denomSphere = 2 * S * E - 0.2 * P;
      if (denomSphere > 0) {
        reqThicknessMm = (P * R) / denomSphere + CA;
      } else {
        codeLimitExceeded = true;
      }

      if (isThinWalled) {
        hoopStressMpa = (P * (R + 0.2 * tCorroded)) / (2 * tCorroded);
        longStressMpa = hoopStressMpa;
      } else {
        const Ro = R + tCorroded;
        hoopStressMpa = P * ((Ro * Ro * Ro + 2 * R * R * R) / (2 * (Ro * Ro * Ro - R * R * R)));
        longStressMpa = hoopStressMpa;
      }
      maxStressMpa = hoopStressMpa;
    }

    const safetyFactor = maxStressMpa > 0 ? Sy / maxStressMpa : 999;
    const isThicknessAdequate = t >= reqThicknessMm && !codeLimitExceeded;
    const allowableStressMarginPct = ((S * E - (maxStressMpa * (isThinWalled ? 1 : 0.85))) / (S * E)) * 100;

    return {
      tCorroded,
      isThinWalled,
      thickWallRatio,
      reqThicknessMm,
      hoopStressMpa,
      longStressMpa,
      maxStressMpa,
      safetyFactor,
      isThicknessAdequate,
      codeLimitExceeded,
      allowableStressMarginPct,
    };
  }, [designPressureMpa, innerRadiusMm, nominalThicknessMm, corrosionAllowanceMm, jointEfficiency, activeMaterial, vesselType]);

  // -------------------------------------------------------------
  // Tab 2: Formed Heads Calculation (UG-32 & UG-34)
  // -------------------------------------------------------------
  const headResults = useMemo(() => {
    const P = Math.max(0.01, designPressureMpa);
    const R = Math.max(10, innerRadiusMm);
    const D = 2 * R; // Inside diameter
    const CA = Math.max(0, corrosionAllowanceMm);
    const E = jointEfficiency;
    const S = activeMaterial.sMpa;

    // 1. 2:1 Semi-Ellipsoidal Head (ASME UG-32(d))
    // t = (P * D) / (2 * S * E - 0.2 * P) + CA
    const tEllip = (P * D) / Math.max(1, 2 * S * E - 0.2 * P) + CA;

    // 2. ASME Torispherical (Flanged & Dished) Head (UG-32(e))
    // Crown radius L = D, Knuckle r = 0.06D, M = 0.25 * (3 + sqrt(L/r)) = 1.54
    // t = (0.885 * P * L) / (S * E - 0.1 * P) + CA
    const L = D;
    const tTori = (0.885 * P * L) / Math.max(1, S * E - 0.1 * P) + CA;

    // 3. Hemispherical Head (UG-32(f))
    // t = (P * R) / (2 * S * E - 0.2 * P) + CA
    const tHemi = (P * R) / Math.max(1, 2 * S * E - 0.2 * P) + CA;

    // 4. Flat Unstayed Head (UG-34(c)(2))
    // t = d * sqrt(C * P / (S * E)) + CA, C = 0.33 for welded flat plate
    const C = 0.33;
    const tFlat = D * Math.sqrt((C * P) / Math.max(1, S * E)) + CA;

    return [
      {
        type: 'ellipsoidal',
        nameEn: '2:1 Semi-Ellipsoidal Head',
        nameTr: '2:1 Yarı Eliptik Bombe',
        standard: 'ASME UG-32(d)',
        thicknessMm: tEllip,
        volumeEconomyEn: 'Standard industrial economy (Best balance of depth & cost)',
        volumeEconomyTr: 'Standart endüstriyel optimum (Derinlik ve maliyet dengesi)',
        depthMm: D / 4,
      },
      {
        type: 'torispherical',
        nameEn: 'ASME Torispherical (Klöpper)',
        nameTr: 'Torisferik Bombe (Flanşlı & Bombeli)',
        standard: 'ASME UG-32(e)',
        thicknessMm: tTori,
        volumeEconomyEn: 'Shallower depth, but requires ~77% greater thickness than ellipsoidal',
        volumeEconomyTr: 'Daha az derinlik, ancak eliptiğe göre ~%77 daha fazla et kalınlığı ister',
        depthMm: 0.194 * D,
      },
      {
        type: 'hemispherical',
        nameEn: 'Hemispherical Head',
        nameTr: 'Yarım Küre (Hemisferik) Bombe',
        standard: 'ASME UG-32(f)',
        thicknessMm: tHemi,
        volumeEconomyEn: 'Thinnest required wall (50% of cylinder shell), highest fabrication depth',
        volumeEconomyTr: 'En ince et kalınlığı (gövdenin yarısı), en yüksek imalat derinliği',
        depthMm: R,
      },
      {
        type: 'flat',
        nameEn: 'Welded Flat Head',
        nameTr: 'Düz Kaynaklı Bombe / Kapak',
        standard: 'ASME UG-34',
        thicknessMm: tFlat,
        volumeEconomyEn: 'Very thick plate needed due to pure bending stress; low-pressure only',
        volumeEconomyTr: 'Salt eğilme gerilmesi nedeniyle çok kalın plaka gerektirir; düşük basınç içindir',
        depthMm: 0,
      },
    ];
  }, [designPressureMpa, innerRadiusMm, corrosionAllowanceMm, jointEfficiency, activeMaterial]);

  // -------------------------------------------------------------
  // Tab 3: MAWP & Hydrostatic Test (UG-99)
  // -------------------------------------------------------------
  const mawpResults = useMemo(() => {
    const R = Math.max(10, innerRadiusMm);
    const t = Math.max(0.5, nominalThicknessMm);
    const CA = Math.max(0, corrosionAllowanceMm);
    const E = jointEfficiency;
    const S = activeMaterial.sMpa;
    const tCorroded = Math.max(0.1, t - CA);

    // Maximum Allowable Working Pressure (MAWP) in corroded condition:
    // Cylinder: MAWP = (S * E * t_c) / (R + 0.6 * t_c)
    let mawpMpa = 0;
    if (vesselType === 'cylinder') {
      mawpMpa = (S * E * tCorroded) / (R + 0.6 * tCorroded);
    } else {
      mawpMpa = (2 * S * E * tCorroded) / (R + 0.2 * tCorroded);
    }

    // ASME Section VIII Div 1 UG-99(b) Hydrostatic Test Pressure:
    // P_test = 1.3 * MAWP * (S_test / S_design)
    // At ambient temperature test, S_test / S_design >= 1.0
    const hydroTestMpa = 1.3 * mawpMpa * 1.0;
    const hydroTestBar = hydroTestMpa * 10;

    // ASME UG-100 Pneumatic Test (1.1 * MAWP):
    const pneuTestMpa = 1.1 * mawpMpa;

    return {
      mawpMpa,
      mawpBar: mawpMpa * 10,
      hydroTestMpa,
      hydroTestBar,
      pneuTestMpa,
      pneuTestBar: pneuTestMpa * 10,
      designPressureRatio: mawpMpa / Math.max(0.01, designPressureMpa),
    };
  }, [innerRadiusMm, nominalThicknessMm, corrosionAllowanceMm, jointEfficiency, activeMaterial, vesselType, designPressureMpa]);

  return (
    <div className="flex flex-col h-full w-full bg-[var(--bg-0)] text-slate-100 overflow-hidden select-none">
      {/* Top Banner / Suite Navigation */}
      <div className="shrink-0 border-b border-[var(--line)] bg-[var(--bg-1)] px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-red-950/40 border border-red-500/40 text-red-400">
            <Droplets className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black tracking-wide text-white uppercase">
                {t12(language, 'Pressure Vessel Design Suite', 'Basınçlı Kap Tasarımı Paketi')}
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-red-950/60 text-red-400 border border-red-800">
                ASME BPVC Sec VIII Div 1 / EN 13445
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              {t12(
                language,
                'UG-27 cylindrical & spherical shells, UG-32 formed heads & UG-99 hydrostatic test pressure',
                'UG-27 silindirik & küresel gövde, UG-32 bombeler ve UG-99 hidrostatik test basıncı'
              )}
            </p>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex bg-[var(--bg-2)] p-1 rounded-lg border border-[var(--line)] gap-1">
          <button
            onClick={() => setActiveTab('shell')}
            className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'shell'
                ? 'bg-[var(--cyan)] text-[var(--accent-ink)] shadow-md font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Gauge className="w-3.5 h-3.5" />
            {t12(language, 'Shell Stress (UG-27)', 'Gövde Gerilmesi (UG-27)')}
          </button>
          <button
            onClick={() => setActiveTab('heads')}
            className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'heads'
                ? 'bg-[var(--cyan)] text-[var(--accent-ink)] shadow-md font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            {t12(language, 'Formed Heads (UG-32)', 'Bombeler (UG-32)')}
          </button>
          <button
            onClick={() => setActiveTab('mawp-hydro')}
            className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'mawp-hydro'
                ? 'bg-[var(--cyan)] text-[var(--accent-ink)] shadow-md font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            {t12(language, 'MAWP & Hydro Test (UG-99)', 'MAWP & Hidro Test (UG-99)')}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
        {/* ========================================================= */}
        {/* TAB 1: SHELL STRESS & THICKNESS (ASME UG-27)              */}
        {/* ========================================================= */}
        {activeTab === 'shell' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl mx-auto">
            {/* Left Inputs */}
            <div className="lg:col-span-4 space-y-5">
              <div className="bg-[var(--bg-1)] border border-[var(--line)] rounded-xl p-5 shadow-lg">
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-[var(--line)] text-red-400">
                  <Settings className="w-4 h-4" />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider">
                    {t12(language, 'Vessel Parameters', 'Kap Tasarım Parametreleri')}
                  </span>
                </div>

                <div className="space-y-4">
                  {/* Geometry Toggle */}
                  <div className="flex gap-2 p-1 bg-[var(--bg-2)] rounded-lg border border-[var(--line)]">
                    <button
                      onClick={() => setVesselType('cylinder')}
                      className={`flex-1 py-1.5 text-xs font-bold rounded transition-all ${
                        vesselType === 'cylinder' ? 'bg-[var(--cyan)] text-[var(--accent-ink)]' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {t12(language, 'Cylindrical Shell', 'Silindirik Gövde')}
                    </button>
                    <button
                      onClick={() => setVesselType('sphere')}
                      className={`flex-1 py-1.5 text-xs font-bold rounded transition-all ${
                        vesselType === 'sphere' ? 'bg-[var(--cyan)] text-[var(--accent-ink)]' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {t12(language, 'Spherical Vessel', 'Küresel Kap')}
                    </button>
                  </div>

                  {/* Material Catalog */}
                  <div>
                    <label className="text-xs text-slate-400 font-mono block mb-1">
                      {t12(language, 'ASME Plate Material', 'ASME Levha Malzemesi')}
                    </label>
                    <select
                      value={materialId}
                      onChange={(e) => setMaterialId(e.target.value)}
                      className="w-full bg-[var(--bg-2)] border border-[var(--line)] rounded px-3 py-2 text-xs font-mono text-white outline-none focus:border-red-500"
                    >
                      {ASME_MATERIALS.map((m) => (
                        <option key={m.id} value={m.id} className="bg-[var(--bg-1)]">
                          {m.name} (S = {m.sMpa} MPa | Sy = {m.syMpa} MPa)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400">{t12(language, 'Internal Design Pressure (P)', 'İç Tasarım Basıncı (P)')}</span>
                      <span className="font-mono text-red-400 font-bold">{designPressureMpa.toFixed(2)} MPa ({(designPressureMpa * 10).toFixed(1)} bar)</span>
                    </div>
                    <input
                      type="range"
                      min={0.2}
                      max={20.0}
                      step={0.1}
                      value={designPressureMpa}
                      onChange={(e) => setDesignPressureMpa(Number(e.target.value))}
                      className="w-full accent-[var(--cyan)] bg-[var(--bg-3)]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-mono text-slate-400 uppercase">{t12(language, 'Inner Radius (R, mm)', 'İç Yarıçap (R, mm)')}</label>
                      <input
                        type="number"
                        step={25}
                        min={50}
                        value={innerRadiusMm}
                        onChange={(e) => setInnerRadiusMm(Number(e.target.value))}
                        className="w-full mt-1 bg-[var(--bg-2)] border border-[var(--line)] rounded px-3 py-1.5 text-xs font-mono text-white outline-none focus:border-red-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono text-slate-400 uppercase">{t12(language, 'Nominal Wall (t, mm)', 'Et Kalınlığı (t, mm)')}</label>
                      <input
                        type="number"
                        step={1}
                        min={1}
                        value={nominalThicknessMm}
                        onChange={(e) => setNominalThicknessMm(Number(e.target.value))}
                        className="w-full mt-1 bg-[var(--bg-2)] border border-[var(--line)] rounded px-3 py-1.5 text-xs font-mono text-white outline-none focus:border-red-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-mono text-slate-400 uppercase">{t12(language, 'Corrosion Allow. (CA)', 'Korozyon Payı (CA)')}</label>
                      <input
                        type="number"
                        step={0.5}
                        min={0}
                        value={corrosionAllowanceMm}
                        onChange={(e) => setCorrosionAllowanceMm(Number(e.target.value))}
                        className="w-full mt-1 bg-[var(--bg-2)] border border-[var(--line)] rounded px-3 py-1.5 text-xs font-mono text-white outline-none focus:border-red-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono text-slate-400 uppercase">{t12(language, 'Joint Efficiency (E)', 'Kaynak Faktörü (E)')}</label>
                      <select
                        value={jointEfficiency}
                        onChange={(e) => setJointEfficiency(Number(e.target.value))}
                        className="w-full mt-1 bg-[var(--bg-2)] border border-[var(--line)] rounded px-3 py-1.5 text-xs font-mono text-white outline-none focus:border-red-500"
                      >
                        <option value={1.0}>1.00 (100% Full RT)</option>
                        <option value={0.85}>0.85 (Spot RT Examination)</option>
                        <option value={0.70}>0.70 (Visual Inspection only)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Results & Stress Readout */}
            <div className="lg:col-span-8 space-y-5">
              {/* Primary KPI Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-[var(--bg-1)] border border-[var(--line)]">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">{t12(language, 'Required Wall t_req', 'Gereken Et Kalınlığı t_req')}</div>
                  <div className={`text-2xl font-mono font-black mt-1 ${shellResults.isThicknessAdequate ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {shellResults.reqThicknessMm.toFixed(2)} <span className="text-xs font-sans text-slate-400">mm</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    {shellResults.isThicknessAdequate ? `✓ t ≥ t_req (+${(nominalThicknessMm - shellResults.reqThicknessMm).toFixed(1)}mm margin)` : '✗ UNDERSIZED (t < t_req)'}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[var(--bg-1)] border border-[var(--line)]">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">{t12(language, 'Max Hoop Stress (σh)', 'Çevresel Gerilme (σh)')}</div>
                  <div className="text-2xl font-mono font-black text-white mt-1">
                    {shellResults.hoopStressMpa.toFixed(1)} <span className="text-xs font-sans text-slate-400">MPa</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    Allowable S·E = {(activeMaterial.sMpa * jointEfficiency).toFixed(1)} MPa
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[var(--bg-1)] border border-[var(--line)]">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">{t12(language, 'Longitudinal Stress', 'Eksenel Gerilme (σL)')}</div>
                  <div className="text-2xl font-mono font-black text-cyan-400 mt-1">
                    {shellResults.longStressMpa.toFixed(1)} <span className="text-xs font-sans text-slate-400">MPa</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">σL = 0.5 · σh (Cylinder)</div>
                </div>

                <div className="p-4 rounded-xl bg-[var(--bg-1)] border border-[var(--line)]">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">{t12(language, 'Safety Factor (vs Sy)', 'Emniyet Katsayısı')}</div>
                  <div className={`text-2xl font-mono font-black mt-1 ${shellResults.safetyFactor >= 1.5 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {shellResults.safetyFactor.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">Sy = {activeMaterial.syMpa} MPa</div>
                </div>
              </div>

              {/* Status Banner */}
              <div
                className={`p-4 rounded-xl border flex items-center gap-3 ${
                  shellResults.isThicknessAdequate
                    ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                    : 'bg-rose-950/30 border-rose-500/40 text-rose-300'
                }`}
              >
                {shellResults.isThicknessAdequate ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                )}
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider">
                    {shellResults.isThicknessAdequate
                      ? t12(language, 'ASME SECTION VIII DIV 1 COMPLIANCE VERIFIED', 'ASME SECTION VIII DIV 1 UYGUNLUĞU DOĞRULANDI')
                      : t12(language, 'WALL THICKNESS INSUFFICIENT — ASME LIMIT EXCEEDED', 'ET KALINLIĞI YETERSİZ — ASME SINIRI AŞILDI')}
                  </div>
                  <div className="text-[11px] opacity-80">
                    {shellResults.isThicknessAdequate
                      ? t12(
                          language,
                          `Nominal thickness ${nominalThicknessMm} mm satisfies minimum requirement of ${shellResults.reqThicknessMm.toFixed(2)} mm (including ${corrosionAllowanceMm} mm corrosion allowance). Operating within allowable stress limits.`,
                          `Nominal et kalınlığı ${nominalThicknessMm} mm, ${corrosionAllowanceMm} mm korozyon payı dahil gereken ${shellResults.reqThicknessMm.toFixed(2)} mm değerini karşılamaktadır.`
                        )
                      : t12(
                          language,
                          `Nominal thickness ${nominalThicknessMm} mm is less than required ${shellResults.reqThicknessMm.toFixed(2)} mm. Increase wall thickness or reduce operating pressure to ensure containment integrity.`,
                          `Nominal et kalınlığı ${nominalThicknessMm} mm, gereken ${shellResults.reqThicknessMm.toFixed(2)} mm değerinden düşüktür. Et kalınlığını artırın veya basıncı düşürün.`
                        )}
                  </div>
                </div>
              </div>

              {/* Vessel Cross Section Visualizer */}
              <div className="p-6 rounded-xl bg-[var(--bg-1)] border border-[var(--line)] relative flex flex-col items-center">
                <div className="w-full flex justify-between items-center mb-6 pb-2 border-b border-[var(--line)] text-xs font-mono text-slate-400">
                  <span>{t12(language, 'Shell Geometry & Wall Stress Profile', 'Gövde Geometrisi & Gerilme Profili')}</span>
                  <span className="text-red-400">
                    {shellResults.isThinWalled ? 'Thin Wall (R/t ≥ 10)' : 'Thick Wall Lamé (R/t < 10)'}
                  </span>
                </div>

                <div className="relative w-full max-w-md h-40 flex items-center justify-center">
                  {/* Concentric rings representing inner radius and wall thickness */}
                  <div
                    className="rounded-full border-4 border-dashed border-red-500/80 flex items-center justify-center relative"
                    style={{
                      width: '160px',
                      height: '160px',
                      backgroundColor: 'rgba(239, 68, 68, 0.08)',
                    }}
                  >
                    <div className="text-center font-mono">
                      <div className="text-xs font-bold text-white">P = {(designPressureMpa * 10).toFixed(0)} bar</div>
                      <div className="text-[10px] text-red-400">Ri = {innerRadiusMm} mm</div>
                    </div>
                  </div>
                </div>

                <div className="text-[10px] font-mono text-slate-500 mt-2">
                  Corroded Wall tc = {shellResults.tCorroded.toFixed(1)} mm | Outer Diameter Do = {((innerRadiusMm + nominalThicknessMm) * 2).toFixed(0)} mm
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: FORMED HEADS (ASME UG-32 & UG-34)                 */}
        {/* ========================================================= */}
        {activeTab === 'heads' && (
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="p-5 rounded-xl bg-[var(--bg-1)] border border-[var(--line)]">
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[var(--line)] text-red-400">
                <Layers className="w-4 h-4" />
                <span className="text-xs font-mono font-bold uppercase tracking-wider">
                  {t12(language, 'Formed Head Thickness Comparison (P = ' + (designPressureMpa * 10).toFixed(1) + ' bar, ID = ' + (innerRadiusMm * 2) + ' mm)', 'Bombe Kalınlık Karşılaştırması (P = ' + (designPressureMpa * 10).toFixed(1) + ' bar, İç Çap = ' + (innerRadiusMm * 2) + ' mm)')}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {headResults.map((head) => (
                  <div
                    key={head.type}
                    className="p-4 rounded-xl bg-[var(--bg-2)] border border-[var(--line)] flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">{language === 'tr' ? head.nameTr : head.nameEn}</span>
                        <span className="text-[9px] font-mono text-red-400 bg-red-950/60 px-1.5 py-0.5 rounded border border-red-900">{head.standard}</span>
                      </div>
                      <div className="text-2xl font-mono font-black text-cyan-400 mt-3">
                        {head.thicknessMm.toFixed(2)} <span className="text-xs font-sans text-slate-400">mm</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-2 leading-relaxed">
                        {language === 'tr' ? head.volumeEconomyTr : head.volumeEconomyEn}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[var(--line)] flex justify-between text-[10px] font-mono text-slate-500">
                      <span>{t12(language, 'Dish Depth', 'Bombe Derinliği')}:</span>
                      <span className="text-slate-300">{head.depthMm.toFixed(0)} mm</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Engineering Recommendation Note */}
            <div className="p-4 rounded-xl bg-[var(--bg-2)] border border-[var(--line)] flex items-start gap-3 text-xs text-slate-300">
              <FileText className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-white">
                  {t12(language, 'ASME Engineering Design Rule-of-Thumb:', 'ASME Mühendislik Tasarım Kriteri:')}
                </span>{' '}
                {t12(
                  language,
                  'For pressures up to 15-20 bar, the 2:1 Semi-Ellipsoidal head provides the optimum balance between plate forming manufacturing costs and structural thickness economy. For severe high pressures (>30 bar), Hemispherical heads dramatically save wall thickness, offsetting their deeper tooling expense.',
                  '15-20 bar basınca kadar olan kazanlarda 2:1 Yarı Eliptik bombeler, presleme imalat maliyeti ile malzeme kalınlığı tasarrufu arasında en ideal dengeyi sağlar. Yüksek basınçlarda (>30 bar) ise yarım küre (hemisferik) bombeler et kalınlığını yarıya indirerek ağırlık avantajı sunar.'
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: MAWP & HYDROSTATIC TEST PRESSURE (UG-99)          */}
        {/* ========================================================= */}
        {activeTab === 'mawp-hydro' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl mx-auto">
            {/* MAWP Telemetry Cards */}
            <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 rounded-xl bg-[var(--bg-1)] border border-[var(--line)]">
                <div className="text-[10px] font-mono text-slate-400 uppercase">{t12(language, 'Max Allowable Working Pressure (MAWP)', 'İzin Verilen Azami Çalışma Basıncı (MAWP)')}</div>
                <div className="text-3xl font-mono font-black text-emerald-400 mt-2">
                  {mawpResults.mawpMpa.toFixed(2)} <span className="text-sm font-sans text-slate-400">MPa</span>
                </div>
                <div className="text-xs font-mono text-slate-400 mt-1">{mawpResults.mawpBar.toFixed(1)} bar (gauge)</div>
                <div className="text-[10px] text-slate-500 mt-2">
                  {t12(language, 'Calculated for corroded wall condition', 'Aşınmış/korozyonlu cidar durumu için hesaplanmıştır')}
                </div>
              </div>

              <div className="p-5 rounded-xl bg-[var(--bg-1)] border border-[var(--line)]">
                <div className="text-[10px] font-mono text-slate-400 uppercase">{t12(language, 'ASME UG-99 Hydrostatic Test Pressure', 'ASME UG-99 Hidrostatik Test Basıncı')}</div>
                <div className="text-3xl font-mono font-black text-cyan-400 mt-2">
                  {mawpResults.hydroTestMpa.toFixed(2)} <span className="text-sm font-sans text-slate-400">MPa</span>
                </div>
                <div className="text-xs font-mono text-slate-400 mt-1">{mawpResults.hydroTestBar.toFixed(1)} bar (Ptest = 1.30 × MAWP)</div>
                <div className="text-[10px] text-slate-500 mt-2">
                  {t12(language, 'Mandatory hydro test prior to code stamping', 'Damga öncesi zorunlu su sızdırmazlık ve mukavemet testi')}
                </div>
              </div>

              <div className="p-5 rounded-xl bg-[var(--bg-1)] border border-[var(--line)]">
                <div className="text-[10px] font-mono text-slate-400 uppercase">{t12(language, 'ASME UG-100 Pneumatic Test Pressure', 'ASME UG-100 Pnömatik Test Basıncı')}</div>
                <div className="text-3xl font-mono font-black text-amber-400 mt-2">
                  {mawpResults.pneuTestMpa.toFixed(2)} <span className="text-sm font-sans text-slate-400">MPa</span>
                </div>
                <div className="text-xs font-mono text-slate-400 mt-1">{mawpResults.pneuTestBar.toFixed(1)} bar (Ppneu = 1.10 × MAWP)</div>
                <div className="text-[10px] text-slate-500 mt-2">
                  {t12(language, 'Gas test only permitted when hydro is impractical', 'Sadece su testi uygulanamadığında hava/gaz testi izni')}
                </div>
              </div>
            </div>

            {/* Test Safety Protocol Notice */}
            <div className="lg:col-span-12 p-5 rounded-xl bg-[var(--bg-1)] border border-[var(--line)]">
              <div className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-400" />
                <span>{t12(language, 'ASME UG-99 Hydrostatic Inspection Safety Protocol', 'ASME UG-99 Hidrostatik Muayene Güvenlik Protokolü')}</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-400 leading-relaxed font-sans">
                <li>• {t12(language, '1. Liquid temperature during hydro test shall be at least 17°C (30°F) above the Minimum Design Metal Temperature (MDMT) to eliminate brittle fracture risk.', '1. Hidrostatik test sıvısı sıcaklığı, gevrek kırılma riskini önlemek için Minimum Tasarım Metal Sıcaklığından (MDMT) en az 17°C yüksek olmalıdır.')}</li>
                <li>• {t12(language, '2. All air must be completely vented through high-point vent valves prior to applying test pressure to prevent compressed gas explosion hazard.', '2. Test basıncı uygulanmadan önce havanın tamamı üst hava tahliye vanalarından boşaltılmalı; sıkıştırılmış hava patlama tehlikesi engellenmelidir.')}</li>
                <li>• {t12(language, '3. The test pressure shall be held for a minimum of 10 to 30 minutes, followed by reducing pressure to MAWP for detailed close-visual weld joint inspection.', '3. Test basıncı en az 10-30 dakika tutulmalı, ardından detaylı kaynak dikiş muayenesi için basınç MAWP seviyesine indirilmelidir.')}</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
