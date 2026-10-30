'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Thermometer, FlaskConical, MoveVertical, ShieldAlert, CheckCircle2, 
  AlertTriangle, Gauge, Layers, Activity, Sliders, Maximize2, Sparkles, Anchor
} from 'lucide-react';
import { getMaterialCategories, getMaterialsByCategory, MaterialProp } from '@/data/materialsData';
import { useGlobalPrecision, formatEngineeringValue } from '@/components/calculator-kit/precisionUtils';
import { useI18nStore } from '@/store/i18nStore';
import { t12 } from '@/locales/t12';

// -------------------------------------------------------------
// Standard Metric Fastener Dimensions for Slotted Holes (ISO 4014)
// -------------------------------------------------------------
interface BoltSize {
  name: string;
  nominalDiaMm: number;
  holeDiaMm: number; // Standard clearance hole
  washerOdMm: number; // DIN 9021 large washer OD
}

const METRIC_BOLTS: BoltSize[] = [
  { name: 'M6', nominalDiaMm: 6, holeDiaMm: 6.6, washerOdMm: 18 },
  { name: 'M8', nominalDiaMm: 8, holeDiaMm: 9.0, washerOdMm: 24 },
  { name: 'M10', nominalDiaMm: 10, holeDiaMm: 11.0, washerOdMm: 30 },
  { name: 'M12', nominalDiaMm: 12, holeDiaMm: 13.5, washerOdMm: 37 },
  { name: 'M16', nominalDiaMm: 16, holeDiaMm: 17.5, washerOdMm: 50 },
  { name: 'M20', nominalDiaMm: 20, holeDiaMm: 22.0, washerOdMm: 60 },
];

export default function ThermalExpansionModule() {
  const precision = useGlobalPrecision();
  const language = useI18nStore((s) => s.language);
  const [activeTab, setActiveTab] = useState<'linear-volumetric' | 'constrained-stress' | 'slotted-hole'>('linear-volumetric');

  // Material selection
  const [category, setCategory] = useState<string>('Aluminum');
  const [materialName, setMaterialName] = useState<string>('Alu 6082-T6 (Structural)');

  const categories = useMemo(() => getMaterialCategories(), []);
  const availableMaterials = useMemo(() => getMaterialsByCategory(category), [category]);

  // Keep material in sync when category changes
  useEffect(() => {
    if (availableMaterials.length > 0 && !availableMaterials.find((m) => m.name === materialName)) {
      setMaterialName(availableMaterials[0].name);
    }
  }, [category, availableMaterials, materialName]);

  const activeMaterial = useMemo(
    () => availableMaterials.find((m) => m.name === materialName) || availableMaterials[0] || {
      name: 'Alu 6082-T6',
      density: 2.70,
      yield: 260,
      tensile: 310,
      youngsModulus: 70,
      thermalExp: 23.1,
      meltingPoint: 585,
    },
    [availableMaterials, materialName]
  );

  // Tab 1: Temperatures & Dimensions
  const [initialLengthMm, setInitialLengthMm] = useState<number>(1000); // mm
  const [initialTempC, setInitialTempC] = useState<number>(20); // °C
  const [targetTempC, setTargetTempC] = useState<number>(120); // °C

  // Tab 2: Constrained Stress Parameters
  const [constraintRatio, setConstraintRatio] = useState<number>(1.0); // 1.0 = fully rigid, 0.7 = partial
  const [crossSectionAreaMm2, setCrossSectionAreaMm2] = useState<number>(400); // mm^2 (e.g. 20x20mm bar)
  const [radiusOfGyrationMm, setRadiusOfGyrationMm] = useState<number>(5.8); // mm (for buckling r = h / sqrt(12))

  // Tab 3: Slotted Hole & Expansion Joint
  const [selectedBoltName, setSelectedBoltName] = useState<string>('M10');
  const [pipeDiameterMm, setPipeDiameterMm] = useState<number>(114.3); // DN100 / 4" pipe OD

  // -------------------------------------------------------------
  // Tab 1: Linear & Volumetric Calculations
  // -------------------------------------------------------------
  const expansionResults = useMemo(() => {
    const alpha = activeMaterial.thermalExp || 23.0; // μm/(m·K) = 1e-6 / °C
    const L0 = Math.max(1, initialLengthMm);
    const deltaT = targetTempC - initialTempC;

    // Linear expansion: ΔL = α * L0 * ΔT (mm)
    const deltaLMm = L0 * alpha * deltaT * 1e-6;
    const finalLengthMm = L0 + deltaLMm;
    const thermalStrainPct = (deltaLMm / L0) * 100;

    // Volumetric expansion: ΔV/V0 = 3 * α * ΔT
    const volumetricStrainPct = 3 * alpha * deltaT * 1e-4; // in %
    const initialDensity = activeMaterial.density || 2.7; // g/cm^3
    const finalDensity = initialDensity / (1 + (3 * alpha * deltaT * 1e-6));

    // Temperature safety status
    const meltingPoint = activeMaterial.meltingPoint || 600;
    let tempAlert: 'safe' | 'caution' | 'critical' = 'safe';
    let tempAlertMsgEn = '';
    let tempAlertMsgTr = '';

    if (targetTempC >= meltingPoint) {
      tempAlert = 'critical';
      tempAlertMsgEn = `Target temperature (${targetTempC}°C) exceeds material melting point (${meltingPoint}°C). Catastrophic liquid failure.`;
      tempAlertMsgTr = `Hedef sıcaklık (${targetTempC}°C), erime noktasını (${meltingPoint}°C) aştı. Malzeme tamamen erir.`;
    } else if (category === 'Aluminum' && targetTempC > 180) {
      tempAlert = 'caution';
      tempAlertMsgEn = `Caution: Over-aging / temper loss risk (>180°C). T6 precipitate over-aging reduces yield strength by up to 50%.`;
      tempAlertMsgTr = `Dikkat: Meneviş kaybı riski (>180°C). T6 çökelti fazları çözünür, akma mukavemeti %50'ye varan oranda düşebilir.`;
    } else if (Math.abs(deltaT) > 300) {
      tempAlert = 'caution';
      tempAlertMsgEn = `Severe thermal gradient (ΔT = ${deltaT}°C). High micro-stress and thermal shock cracking hazard.`;
      tempAlertMsgTr = `Şiddetli termal gradyan (ΔT = ${deltaT}°C). Termal şok çatlağı ve mikro deformasyon riski.`;
    }

    return {
      alpha,
      deltaT,
      deltaLMm,
      finalLengthMm,
      thermalStrainPct,
      volumetricStrainPct,
      finalDensity,
      tempAlert,
      tempAlertMsg: language === 'tr' ? tempAlertMsgTr : tempAlertMsgEn,
    };
  }, [activeMaterial, initialLengthMm, initialTempC, targetTempC, category, language]);

  // -------------------------------------------------------------
  // Tab 2: Constrained Stress & Buckling Calculations
  // -------------------------------------------------------------
  const stressResults = useMemo(() => {
    const alpha = activeMaterial.thermalExp || 23.0; // 1e-6 / °C
    const E_Mpa = (activeMaterial.youngsModulus || 70) * 1000; // GPa to MPa
    const Sy = activeMaterial.yield || 250; // MPa
    const deltaT = targetTempC - initialTempC;
    const eta = constraintRatio; // 0 to 1.0

    // Constrained thermal stress: σ_th = η * E * α * ΔT (MPa)
    const thermalStressMpa = eta * E_Mpa * alpha * deltaT * 1e-6;
    const isCompressive = thermalStressMpa > 0;
    const absStressMpa = Math.abs(thermalStressMpa);

    // Compressive thrust force developed on end anchors: F = σ * A (kN)
    const thrustForceKn = (absStressMpa * crossSectionAreaMm2) / 1000;

    // Stress vs Yield comparison
    const stressRatioPct = (absStressMpa / Sy) * 100;
    const isYielded = absStressMpa >= Sy;

    // Euler Thermal Buckling of slender pinned column:
    // P_cr = (pi^2 * E * I) / L^2, where I = A * r_gyr^2
    // sigma_cr = pi^2 * E / (L / r_gyr)^2
    const L0 = Math.max(10, initialLengthMm);
    const r_gyr = Math.max(0.5, radiusOfGyrationMm);
    const slenderness = L0 / r_gyr;
    const eulerCritStressMpa = (Math.PI * Math.PI * E_Mpa) / Math.pow(slenderness, 2);

    // Critical temperature rise causing Euler thermal buckling:
    // deltaT_cr = (pi^2 * r_gyr^2) / (alpha * L0^2)
    const critDeltaT = (Math.PI * Math.PI * Math.pow(r_gyr, 2)) / (alpha * 1e-6 * Math.pow(L0, 2));
    const isBuckled = isCompressive && deltaT >= critDeltaT && eta > 0.5;

    return {
      E_Mpa,
      Sy,
      thermalStressMpa,
      absStressMpa,
      thrustForceKn,
      isCompressive,
      stressRatioPct,
      isYielded,
      slenderness,
      eulerCritStressMpa,
      critDeltaT,
      isBuckled,
    };
  }, [activeMaterial, targetTempC, initialTempC, constraintRatio, crossSectionAreaMm2, radiusOfGyrationMm, initialLengthMm]);

  // -------------------------------------------------------------
  // Tab 3: Slotted Hole & Piping Joint Calculations
  // -------------------------------------------------------------
  const slottedHoleResults = useMemo(() => {
    const selectedBolt = METRIC_BOLTS.find((b) => b.name === selectedBoltName) || METRIC_BOLTS[2];
    const expansionMm = Math.abs(expansionResults.deltaLMm);

    // Thermal clearance required: delta_th = |deltaL| + tolerance buffer (1.5 mm)
    const toleranceBufferMm = 1.5;
    const totalTravelMm = expansionMm + toleranceBufferMm;

    // Slotted hole dimensions:
    // Width W = holeDiaMm (standard hole clearance)
    // Length L_slot = nominalDiaMm + totalTravelMm
    const slotWidthMm = selectedBolt.holeDiaMm;
    const slotLengthMm = selectedBolt.nominalDiaMm + totalTravelMm;

    // Washer bearing check: Washer outer diameter must span beyond the slot length
    const isWasherSufficient = selectedBolt.washerOdMm >= slotLengthMm * 0.9;

    // ASME B31.3 Piping Expansion Loop Leg Length:
    // L_loop = C * sqrt(D_o * deltaL), where C = 0.043 for steel
    const C_loop = 0.045;
    const loopLegLengthM = C_loop * Math.sqrt(pipeDiameterMm * Math.max(0.1, expansionMm));

    return {
      selectedBolt,
      expansionMm,
      totalTravelMm,
      slotWidthMm,
      slotLengthMm,
      isWasherSufficient,
      loopLegLengthM,
    };
  }, [selectedBoltName, expansionResults.deltaLMm, pipeDiameterMm]);

  return (
    <div className="flex flex-col h-full w-full bg-[var(--bg-0)] text-slate-100 overflow-hidden select-none">
      {/* Top Banner / Suite Navigation */}
      <div className="shrink-0 border-b border-[var(--line)] bg-[var(--bg-1)] px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-amber-950/40 border border-amber-500/40 text-amber-400">
            <Thermometer className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black tracking-wide text-white uppercase">
                {t12(language, 'Thermal Expansion & Stress Suite', 'Termal Genleşme & Gerilme Paketi')}
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-950/60 text-amber-400 border border-amber-800">
                EN 1993-1-2 / AISC 360-16 / ASME B31.3
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              {t12(
                language,
                'Linear & volumetric expansion, constrained thermal stresses, Euler buckling & slotted hole sizing',
                'Doğrusal & hacimsel genleşme, kısıtlanmış termal gerilmeler, burkulma ve oval delik hesabı'
              )}
            </p>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex bg-[var(--bg-2)] p-1 rounded-lg border border-[var(--line)] gap-1">
          <button
            onClick={() => setActiveTab('linear-volumetric')}
            className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'linear-volumetric'
                ? 'bg-[var(--cyan)] text-[var(--accent-ink)] shadow-md font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <MoveVertical className="w-3.5 h-3.5" />
            {t12(language, 'Linear & Volumetric', 'Doğrusal & Hacimsel')}
          </button>
          <button
            onClick={() => setActiveTab('constrained-stress')}
            className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'constrained-stress'
                ? 'bg-[var(--cyan)] text-[var(--accent-ink)] shadow-md font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            {t12(language, 'Constrained Stress & Buckling', 'Termal Gerilme & Burkulma')}
          </button>
          <button
            onClick={() => setActiveTab('slotted-hole')}
            className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'slotted-hole'
                ? 'bg-[var(--cyan)] text-[var(--accent-ink)] shadow-md font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Maximize2 className="w-3.5 h-3.5" />
            {t12(language, 'Slotted Hole & Joint Clearance', 'Oval Delik & Genleşme Eki')}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
        {/* ========================================================= */}
        {/* TAB 1: LINEAR & VOLUMETRIC EXPANSION                     */}
        {/* ========================================================= */}
        {activeTab === 'linear-volumetric' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl mx-auto">
            {/* Left Controls */}
            <div className="lg:col-span-4 space-y-5">
              <div className="bg-[var(--bg-1)] border border-[var(--line)] rounded-xl p-5 shadow-lg">
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-[var(--line)] text-amber-400">
                  <FlaskConical className="w-4 h-4" />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider">
                    {t12(language, 'Material & Temperature Vectors', 'Malzeme & Sıcaklık Vektörleri')}
                  </span>
                </div>

                <div className="space-y-4">
                  {/* Category */}
                  <div>
                    <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">
                      {t12(language, 'Material Category', 'Malzeme Kategorisi')}
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-[var(--bg-2)] border border-[var(--line)] rounded px-3 py-1.5 text-xs font-mono text-white outline-none focus:border-amber-500"
                    >
                      {categories.map((c) => (
                        <option key={c} value={c} className="bg-[var(--bg-1)]">
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Material */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[10px] font-mono text-slate-400 uppercase">
                        {t12(language, 'Alloy / Grade', 'Alaşım / Kalite')}
                      </label>
                      <span className="text-[10px] font-mono text-amber-400 font-bold">
                        α = {activeMaterial.thermalExp} μm/(m·K)
                      </span>
                    </div>
                    <select
                      value={materialName}
                      onChange={(e) => setMaterialName(e.target.value)}
                      className="w-full bg-[var(--bg-2)] border border-[var(--line)] rounded px-3 py-1.5 text-xs font-mono text-white outline-none focus:border-amber-500"
                    >
                      {availableMaterials.map((m) => (
                        <option key={m.name} value={m.name} className="bg-[var(--bg-1)]">
                          {m.name} (α = {m.thermalExp || 23})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400">{t12(language, 'Initial Length (L0)', 'Başlangıç Boyu (L0)')}</span>
                      <span className="font-mono text-amber-400 font-bold">{initialLengthMm} mm ({(initialLengthMm / 1000).toFixed(2)} m)</span>
                    </div>
                    <input
                      type="range"
                      min={50}
                      max={6000}
                      step={50}
                      value={initialLengthMm}
                      onChange={(e) => setInitialLengthMm(Number(e.target.value))}
                      className="w-full accent-[var(--cyan)] bg-[var(--bg-3)]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="text-[10px] font-mono text-slate-400 uppercase">{t12(language, 'Initial Temp (T0, °C)', 'İlk Sıcaklık (T0, °C)')}</label>
                      <input
                        type="number"
                        step={5}
                        value={initialTempC}
                        onChange={(e) => setInitialTempC(Number(e.target.value))}
                        className="w-full mt-1 bg-[var(--bg-2)] border border-[var(--line)] rounded px-3 py-1.5 text-xs font-mono text-white outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono text-slate-400 uppercase">{t12(language, 'Target Temp (T1, °C)', 'Hedef Sıcaklık (T1, °C)')}</label>
                      <input
                        type="number"
                        step={5}
                        value={targetTempC}
                        onChange={(e) => setTargetTempC(Number(e.target.value))}
                        className="w-full mt-1 bg-[var(--bg-2)] border border-[var(--line)] rounded px-3 py-1.5 text-xs font-mono text-white outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Telemetry */}
            <div className="lg:col-span-8 space-y-5">
              {/* Primary KPI Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-[var(--bg-1)] border border-[var(--line)]">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">{t12(language, 'Linear Expansion (ΔL)', 'Doğrusal Genleşme (ΔL)')}</div>
                  <div className={`text-2xl font-mono font-black mt-1 ${expansionResults.deltaLMm >= 0 ? 'text-amber-400' : 'text-blue-400'}`}>
                    {expansionResults.deltaLMm >= 0 ? `+${expansionResults.deltaLMm.toFixed(2)}` : expansionResults.deltaLMm.toFixed(2)}{' '}
                    <span className="text-xs font-sans text-slate-400">mm</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">ΔT = {expansionResults.deltaT > 0 ? `+${expansionResults.deltaT}` : expansionResults.deltaT} °C</div>
                </div>

                <div className="p-4 rounded-xl bg-[var(--bg-1)] border border-[var(--line)]">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">{t12(language, 'Final Hot Length (L1)', 'Son Boy (L1)')}</div>
                  <div className="text-2xl font-mono font-black text-white mt-1">
                    {expansionResults.finalLengthMm.toFixed(2)} <span className="text-xs font-sans text-slate-400">mm</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">L0 = {initialLengthMm} mm</div>
                </div>

                <div className="p-4 rounded-xl bg-[var(--bg-1)] border border-[var(--line)]">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">{t12(language, 'Thermal Strain (εth)', 'Termal Birim Şekil Değişimi')}</div>
                  <div className="text-2xl font-mono font-black text-cyan-400 mt-1">
                    {expansionResults.thermalStrainPct >= 0 ? `+${expansionResults.thermalStrainPct.toFixed(3)}` : expansionResults.thermalStrainPct.toFixed(3)}%
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">ε = α · ΔT</div>
                </div>

                <div className="p-4 rounded-xl bg-[var(--bg-1)] border border-[var(--line)]">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">{t12(language, 'Hot Alloy Density (ρ1)', 'Sıcak Malzeme Yoğunluğu')}</div>
                  <div className="text-2xl font-mono font-black text-emerald-400 mt-1">
                    {expansionResults.finalDensity.toFixed(3)} <span className="text-xs font-sans text-slate-400">g/cm³</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">Volumetric ΔV: {expansionResults.volumetricStrainPct.toFixed(2)}%</div>
                </div>
              </div>

              {/* Warning Alert if any */}
              {expansionResults.tempAlert !== 'safe' && (
                <div
                  className={`p-4 rounded-xl border flex items-center gap-3 ${
                    expansionResults.tempAlert === 'critical'
                      ? 'bg-rose-950/40 border-rose-500/50 text-rose-300'
                      : 'bg-amber-950/40 border-amber-500/50 text-amber-300'
                  }`}
                >
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider">
                      {expansionResults.tempAlert === 'critical'
                        ? t12(language, 'MATERIAL OVERHEATING RISK', 'MALZEME AŞIRI ISINMA RİSKİ')
                        : t12(language, 'THERMODYNAMIC CAUTION', 'TERMODİNAMİK DİKKAT')}
                    </div>
                    <div className="text-[11px] opacity-80">{expansionResults.tempAlertMsg}</div>
                  </div>
                </div>
              )}

              {/* Visual Thermal Expansion Bar */}
              <div className="p-6 rounded-xl bg-[var(--bg-1)] border border-[var(--line)] relative flex flex-col">
                <div className="flex justify-between items-center mb-6 pb-2 border-b border-[var(--line)] text-xs font-mono text-slate-400">
                  <span>{t12(language, 'Thermal Expansion Profile (Exaggerated 25X)', 'Termal Boy Değişim Profili (25X Büyütülmüş)')}</span>
                  <span className="text-amber-400">
                    {expansionResults.deltaLMm >= 0 ? `+${expansionResults.deltaLMm.toFixed(2)} mm` : `${expansionResults.deltaLMm.toFixed(2)} mm`}
                  </span>
                </div>

                <div className="h-10 w-full bg-[var(--bg-2)] rounded-lg border border-[var(--line)] flex items-center overflow-hidden relative">
                  {/* Base Bar */}
                  <div
                    className="h-full bg-slate-700 flex items-center justify-center text-xs font-mono font-bold text-white transition-all"
                    style={{ width: '85%' }}
                  >
                    L0 = {initialLengthMm} mm
                  </div>

                  {/* Expansion Segment */}
                  {expansionResults.deltaLMm !== 0 && (
                    <motion.div
                      className={`h-full flex items-center justify-center text-xs font-mono font-bold ${
                        expansionResults.deltaLMm > 0
                          ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-slate-950'
                          : 'bg-gradient-to-r from-blue-500 to-cyan-400 text-slate-950'
                      }`}
                      style={{ width: `${Math.min(15, Math.max(3, Math.abs(expansionResults.deltaLMm) * 2))}%` }}
                      animate={{ opacity: [0.7, 1, 0.7] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                    >
                      ΔL
                    </motion.div>
                  )}
                </div>

                <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-3">
                  <span>T0 = {initialTempC}°C</span>
                  <span>ΔT = {expansionResults.deltaT}°C</span>
                  <span>T1 = {targetTempC}°C</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: CONSTRAINED THERMAL STRESS & BUCKLING             */}
        {/* ========================================================= */}
        {activeTab === 'constrained-stress' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl mx-auto">
            {/* Left Inputs */}
            <div className="lg:col-span-4 space-y-5">
              <div className="bg-[var(--bg-1)] border border-[var(--line)] rounded-xl p-5 shadow-lg">
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-[var(--line)] text-amber-400">
                  <Anchor className="w-4 h-4" />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider">
                    {t12(language, 'Boundary & Section Constraints', 'Sınır Şartları & Kesit')}
                  </span>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400">{t12(language, 'Constraint Degree (η)', 'Rijit Sınır Kısıt Oranı (η)')}</span>
                      <span className="font-mono text-amber-400 font-bold">{(constraintRatio * 100).toFixed(0)}%</span>
                    </div>
                    <input
                      type="range"
                      min={0.1}
                      max={1.0}
                      step={0.05}
                      value={constraintRatio}
                      onChange={(e) => setConstraintRatio(Number(e.target.value))}
                      className="w-full accent-[var(--cyan)] bg-[var(--bg-3)]"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-0.5">
                      <span>0.1 (Free to expand)</span>
                      <span>0.5 (Elastic)</span>
                      <span>1.0 (Rigid Wall)</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">
                      {t12(language, 'Cross-Section Area (A, mm²)', 'Enkesit Alanı (A, mm²)')}
                    </label>
                    <input
                      type="number"
                      step={50}
                      min={10}
                      value={crossSectionAreaMm2}
                      onChange={(e) => setCrossSectionAreaMm2(Number(e.target.value))}
                      className="w-full bg-[var(--bg-2)] border border-[var(--line)] rounded px-3 py-1.5 text-xs font-mono text-white outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">
                      {t12(language, 'Radius of Gyration (r_gyr, mm)', 'Atalet Yarıçapı (r_gyr, mm)')}
                    </label>
                    <input
                      type="number"
                      step={0.5}
                      min={1}
                      value={radiusOfGyrationMm}
                      onChange={(e) => setRadiusOfGyrationMm(Number(e.target.value))}
                      className="w-full bg-[var(--bg-2)] border border-[var(--line)] rounded px-3 py-1.5 text-xs font-mono text-white outline-none focus:border-amber-500"
                    />
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                      Slenderness λ = {stressResults.slenderness.toFixed(1)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Results */}
            <div className="lg:col-span-8 space-y-5">
              {/* Stress Telemetry */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-[var(--bg-1)] border border-[var(--line)]">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">{t12(language, 'Thermal Stress (σth)', 'Termal Gerilme (σth)')}</div>
                  <div className={`text-2xl font-mono font-black mt-1 ${stressResults.isYielded ? 'text-rose-400' : 'text-amber-400'}`}>
                    {stressResults.absStressMpa.toFixed(1)} <span className="text-xs font-sans text-slate-400">MPa</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    {stressResults.isCompressive ? t12(language, 'Compression', 'Basma Gerilmesi') : t12(language, 'Tension', 'Çekme Gerilmesi')}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[var(--bg-1)] border border-[var(--line)]">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">{t12(language, 'Thrust Force on Anchors', 'Mesnete İletilen İtki')}</div>
                  <div className="text-2xl font-mono font-black text-rose-400 mt-1">
                    {stressResults.thrustForceKn.toFixed(1)} <span className="text-xs font-sans text-rose-500/70">kN</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">F = σth · A</div>
                </div>

                <div className="p-4 rounded-xl bg-[var(--bg-1)] border border-[var(--line)]">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">{t12(language, 'Stress / Yield (Sy)', 'Gerilme / Akma Oranı')}</div>
                  <div className={`text-2xl font-mono font-black mt-1 ${stressResults.isYielded ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {stressResults.stressRatioPct.toFixed(0)}%
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">Sy = {stressResults.Sy} MPa</div>
                </div>

                <div className="p-4 rounded-xl bg-[var(--bg-1)] border border-[var(--line)]">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">{t12(language, 'Crit. Buckling ΔT', 'Kritik Burkulma ΔT')}</div>
                  <div className="text-2xl font-mono font-black text-cyan-400 mt-1">
                    {stressResults.critDeltaT.toFixed(1)} <span className="text-xs font-sans text-cyan-500/70">°C</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">Euler Column Theory</div>
                </div>
              </div>

              {/* Yielding / Buckling Warning */}
              {stressResults.isYielded ? (
                <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/50 flex items-center gap-3 text-rose-300">
                  <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider">
                      {t12(language, 'PLASTIC YIELDING DETECTED (σth ≥ Sy)', 'PLASTİK AKMA TEHLİKESİ (σth ≥ Sy)')}
                    </div>
                    <div className="text-[11px] text-rose-400/80">
                      {t12(
                        language,
                        `Thermal stress (${stressResults.absStressMpa.toFixed(1)} MPa) exceeds material yield point (${stressResults.Sy} MPa). The constrained component will permanently warp, yield, or rupture upon cooling. Install expansion joints immediately.`,
                        `Termal gerilme (${stressResults.absStressMpa.toFixed(1)} MPa), malzemenin akma sınırını (${stressResults.Sy} MPa) aştı. Parça kalıcı olarak eğrilecek veya soğuma sırasında kopacaktır. Araya genleşme ek yeri koyun.`
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/40 flex items-center gap-3 text-emerald-300">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider">
                      {t12(language, 'ELASTIC STRUCTURAL MARGIN VERIFIED', 'ELASTİK EMNİYET SINIRLARI DAHİLİNDE')}
                    </div>
                    <div className="text-[11px] opacity-80">
                      {t12(
                        language,
                        `Stress ratio is at ${stressResults.stressRatioPct.toFixed(0)}% of yield strength. Material returns to its original dimensions without permanent plastic distortion.`,
                        `Gerilme, akma dayanımının %${stressResults.stressRatioPct.toFixed(0)} seviyesindedir. Malzeme kalıcı deformasyona uğramadan elastik bölgede kalır.`
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: SLOTTED HOLE & EXPANSION JOINT SIZING             */}
        {/* ========================================================= */}
        {activeTab === 'slotted-hole' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl mx-auto">
            {/* Left Controls */}
            <div className="lg:col-span-4 space-y-5">
              <div className="bg-[var(--bg-1)] border border-[var(--line)] rounded-xl p-5 shadow-lg">
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-[var(--line)] text-amber-400">
                  <Maximize2 className="w-4 h-4" />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider">
                    {t12(language, 'Fastener & Joint Sizing', 'Bağlantı & Ek Yeri Boyutlandırma')}
                  </span>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-slate-400 font-mono block mb-1">
                      {t12(language, 'Bolt Metric Size (ISO 4014)', 'Metrik Cıvata Çapı (ISO 4014)')}
                    </label>
                    <select
                      value={selectedBoltName}
                      onChange={(e) => setSelectedBoltName(e.target.value)}
                      className="w-full bg-[var(--bg-2)] border border-[var(--line)] rounded px-3 py-2 text-xs font-mono text-white outline-none focus:border-amber-500"
                    >
                      {METRIC_BOLTS.map((b) => (
                        <option key={b.name} value={b.name} className="bg-[var(--bg-1)]">
                          {b.name} (Clearance Hole: ⌀{b.holeDiaMm} mm | Washer OD: ⌀{b.washerOdMm} mm)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 font-mono block mb-1">
                      {t12(language, 'Piping Outer Diameter (Do, mm)', 'Boru Dış Çapı (Do, mm)')}
                    </label>
                    <input
                      type="number"
                      step={10}
                      min={20}
                      value={pipeDiameterMm}
                      onChange={(e) => setPipeDiameterMm(Number(e.target.value))}
                      className="w-full bg-[var(--bg-2)] border border-[var(--line)] rounded px-3 py-1.5 text-xs font-mono text-white outline-none focus:border-amber-500"
                    />
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                      For ASME B31.3 Expansion U-Loop Calculation
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Slotted Hole Sizing & Diagram */}
            <div className="lg:col-span-8 space-y-5">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-[var(--bg-1)] border border-[var(--line)]">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">{t12(language, 'Required Slot Length (Lslot)', 'Gereken Oval Delik Boyu')}</div>
                  <div className="text-2xl font-mono font-black text-cyan-400 mt-1">
                    {slottedHoleResults.slotLengthMm.toFixed(1)} <span className="text-xs font-sans text-slate-400">mm</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    {t12(language, 'Includes 1.5mm tolerance buffer', '1.5mm imalat toleransı dahildir')}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[var(--bg-1)] border border-[var(--line)]">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">{t12(language, 'Slot Width (Wslot)', 'Oval Delik Genişliği')}</div>
                  <div className="text-2xl font-mono font-black text-white mt-1">
                    {slottedHoleResults.slotWidthMm.toFixed(1)} <span className="text-xs font-sans text-slate-400">mm</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">ISO Medium Hole Fit</div>
                </div>

                <div className="p-4 rounded-xl bg-[var(--bg-1)] border border-[var(--line)]">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">{t12(language, 'ASME B31.3 Loop Leg', 'ASME B31.3 U-Lup Bacak Boyu')}</div>
                  <div className="text-2xl font-mono font-black text-amber-400 mt-1">
                    {slottedHoleResults.loopLegLengthM.toFixed(2)} <span className="text-xs font-sans text-slate-400">m</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">Flexible U-bend piping loop</div>
                </div>
              </div>

              {/* Slotted Hole SVG Visualization */}
              <div className="p-6 rounded-xl bg-[var(--bg-1)] border border-[var(--line)] relative flex flex-col items-center">
                <div className="w-full flex justify-between items-center mb-6 pb-2 border-b border-[var(--line)] text-xs font-mono text-slate-400">
                  <span>{t12(language, 'DIN / ISO Slotted Hole & Fastener Travel', 'DIN / ISO Oval Delik & Cıvata Hareketi')}</span>
                  <span className="text-amber-400">Washer DIN 9021 ⌀{slottedHoleResults.selectedBolt.washerOdMm} mm</span>
                </div>

                <div className="relative w-full max-w-md h-36 bg-[var(--bg-0)] rounded-lg border border-[var(--line)] flex items-center justify-center p-4">
                  {/* Slotted Hole Contour */}
                  <div
                    className="h-16 rounded-full border-2 border-dashed border-cyan-400 flex items-center justify-between px-3 relative"
                    style={{ width: `${Math.min(280, Math.max(120, slottedHoleResults.slotLengthMm * 4))}px` }}
                  >
                    {/* Washer Outline */}
                    <div className="w-12 h-12 rounded-full border border-slate-600 absolute left-2 pointer-events-none" />

                    {/* Bolt Shank (Cold State) */}
                    <div className="w-8 h-8 rounded-full bg-cyan-950 border-2 border-cyan-400 flex items-center justify-center text-[9px] font-mono text-cyan-300">
                      Cold
                    </div>

                    {/* Arrow showing expansion travel */}
                    <div className="flex-1 h-0.5 bg-amber-500 mx-2 relative">
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0 h-0 border-t-4 border-t-transparent border-b-4 border-b-transparent border-l-6 border-l-amber-500" />
                    </div>

                    {/* Bolt Shank (Hot State) */}
                    <div className="w-8 h-8 rounded-full bg-amber-950 border-2 border-amber-400 flex items-center justify-center text-[9px] font-mono text-amber-300">
                      Hot
                    </div>
                  </div>
                </div>

                <div className="text-[10px] font-mono text-slate-500 mt-3">
                  Travel ΔL = {slottedHoleResults.expansionMm.toFixed(2)} mm | Required Free Slot Length = {slottedHoleResults.slotLengthMm.toFixed(1)} mm
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
