'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Droplets, 
  Activity, 
  Gauge, 
  Zap, 
  Layers, 
  Sliders, 
  RotateCcw, 
  Check, 
  Copy, 
  Info, 
  Plus, 
  Trash2, 
  ExternalLink,
  ChevronRight,
  Shield,
  Wind
} from 'lucide-react';
import Link from 'next/link';
import { useI18nStore } from '@/store/i18nStore';
import { t12 } from '@/locales/t12';
import { useGlobalPrecision, formatEngineeringValue } from '@/components/calculator-kit/precisionUtils';

// --- Fluid Database ---
interface FluidDef {
  id: string;
  nameEn: string;
  nameTr: string;
  rho: number; // kg/m³
  mu: number;  // Dynamic viscosity Pa·s
  nu: number;  // Kinematic viscosity cSt (mm²/s)
  pv: number;  // Vapor pressure kPa at 20°C
  color: string;
}

const FLUID_PRESETS: FluidDef[] = [
  { id: 'water-20', nameEn: 'Water (20°C)', nameTr: 'Su (20°C)', rho: 998.2, mu: 0.001002, nu: 1.004, pv: 2.34, color: '#00e5ff' },
  { id: 'water-60', nameEn: 'Hot Water (60°C)', nameTr: 'Sıcak Su (60°C)', rho: 983.2, mu: 0.000467, nu: 0.475, pv: 19.9, color: '#38bdf8' },
  { id: 'oil-vg46', nameEn: 'Hydraulic Oil (ISO VG 46)', nameTr: 'Hidrolik Yağ (ISO VG 46)', rho: 875.0, mu: 0.0402, nu: 46.0, pv: 0.01, color: '#f59e0b' },
  { id: 'oil-vg68', nameEn: 'Gear / Hydraulic Oil (ISO VG 68)', nameTr: 'Dişli / Hidrolik Yağ (ISO VG 68)', rho: 885.0, mu: 0.0601, nu: 68.0, pv: 0.01, color: '#d97706' },
  { id: 'diesel', nameEn: 'Diesel Fuel (20°C)', nameTr: 'Dizel Yakıt (20°C)', rho: 840.0, mu: 0.00294, nu: 3.50, pv: 0.50, color: '#eab308' },
  { id: 'air-stp', nameEn: 'Air (STP, 20°C, 1 atm)', nameTr: 'Hava (STP, 20°C, 1 atm)', rho: 1.204, mu: 0.0000182, nu: 15.11, pv: 0, color: '#94a3b8' },
  { id: 'seawater', nameEn: 'Seawater (20°C, 35 PSU)', nameTr: 'Deniz Suyu (20°C)', rho: 1025.0, mu: 0.001077, nu: 1.05, pv: 2.30, color: '#0284c7' },
  { id: 'glycol-30', nameEn: 'Ethylene Glycol 30% (20°C)', nameTr: 'Etilen Glikol %30 (20°C)', rho: 1040.0, mu: 0.0025, nu: 2.40, pv: 2.10, color: '#10b981' },
];

// --- Pipe Roughness Database per Colebrook & Moody ---
interface RoughnessDef {
  labelEn: string;
  labelTr: string;
  e: number; // mm
}

const ROUGHNESS_PRESETS: RoughnessDef[] = [
  { labelEn: 'Drawn Copper / Brass / Glass', labelTr: 'Çekme Bakır / Pirinç / Cam', e: 0.0015 },
  { labelEn: 'Commercial Steel / Welded Steel', labelTr: 'Ticari Çelik / Kaynaklı Çelik Boru', e: 0.045 },
  { labelEn: 'Galvanized Steel / Iron', labelTr: 'Galvanizli Çelik / Döküm Boru', e: 0.15 },
  { labelEn: 'Cast Iron (Ductile)', labelTr: 'Pik Döküm / Sfero Döküm', e: 0.26 },
  { labelEn: 'Smooth Plastic (PVC / HDPE / PPRC)', labelTr: 'Plastik Boru (PVC / HDPE / PPRC)', e: 0.007 },
  { labelEn: 'Concrete (Smooth finished)', labelTr: 'Düzgün Yüzeyli Beton Boru', e: 0.50 },
];

// --- Crane TP-410 Standard Minor Loss Coefficients (K) ---
interface FittingItem {
  id: string;
  nameEn: string;
  nameTr: string;
  k: number;
}

const STANDARD_FITTINGS: FittingItem[] = [
  { id: 'elbow_90_std', nameEn: '90° Standard Elbow (R/D=1)', nameTr: '90° Standart Dirsek (R/D=1)', k: 0.75 },
  { id: 'elbow_90_long', nameEn: '90° Long Radius Elbow (R/D=1.5)', nameTr: '90° Geniş Kavisli Dirsek', k: 0.45 },
  { id: 'elbow_45_std', nameEn: '45° Standard Elbow', nameTr: '45° Standart Dirsek', k: 0.35 },
  { id: 'tee_through', nameEn: 'Tee (Through Flow)', nameTr: 'Te Bağlantı (Düz Akış)', k: 0.40 },
  { id: 'tee_branch', nameEn: 'Tee (Branch Flow)', nameTr: 'Te Bağlantı (Ayrılma / Branşman)', k: 1.50 },
  { id: 'valve_gate', nameEn: 'Gate Valve (Fully Open)', nameTr: 'Sürgülü Vana (Tam Açık)', k: 0.17 },
  { id: 'valve_globe', nameEn: 'Globe Valve (Fully Open)', nameTr: 'Glob Vana (Tam Açık)', k: 6.00 },
  { id: 'valve_ball', nameEn: 'Ball Valve (Full Bore)', nameTr: 'Küresel Vana (Tam Geçişli)', k: 0.05 },
  { id: 'valve_check', nameEn: 'Swing Check Valve', nameTr: 'Çalpara Çekvalf', k: 2.00 },
  { id: 'pipe_entrance', nameEn: 'Sharp Pipe Entrance (Square)', nameTr: 'Keskin Boru Girişi', k: 0.50 },
  { id: 'pipe_exit', nameEn: 'Pipe Exit to Reservoir', nameTr: 'Boru Çıkışı / Rezervuar Boşalması', k: 1.00 },
];

export interface FluidDynamicsSuiteProps {
  initialTab?: 'pipe-friction' | 'flow-sim' | 'fluid-props' | 'bernoulli' | 'pump-sizing';
}

export default function FluidDynamicsSuite({ initialTab = 'pipe-friction' }: FluidDynamicsSuiteProps) {
  const precision = useGlobalPrecision();
  const { language } = useI18nStore();
  const [activeTab, setActiveTab] = useState<'pipe-friction' | 'flow-sim' | 'fluid-props' | 'bernoulli' | 'pump-sizing'>(initialTab);
  const [copied, setCopied] = useState(false);

  // 1. Fluid & Operating Conditions
  const [selectedFluidId, setSelectedFluidId] = useState<string>('water-20');
  const [customRho, setCustomRho] = useState<number>(1000);
  const [customMu, setCustomMu] = useState<number>(0.001);

  const activeFluid = useMemo(() => {
    return FLUID_PRESETS.find(f => f.id === selectedFluidId) || FLUID_PRESETS[0];
  }, [selectedFluidId]);

  const rho = selectedFluidId === 'custom' ? customRho : activeFluid.rho;
  const mu = selectedFluidId === 'custom' ? customMu : activeFluid.mu;

  // 2. Pipe Geometry
  const [diameterMm, setDiameterMm] = useState<number>(50); // Inside diameter mm
  const [lengthM, setLengthM] = useState<number>(100);       // Length m
  const [flowRateM3h, setFlowRateM3h] = useState<number>(15); // Flow rate m³/h
  const [roughnessIdx, setRoughnessIdx] = useState<number>(1); // Commercial steel
  const [elevationM, setElevationM] = useState<number>(10);   // Static elevation gain m

  // 3. Crane TP-410 Fittings Bucket
  const [addedFittings, setAddedFittings] = useState<{ id: string; nameEn: string; nameTr: string; k: number; count: number }[]>([
    { id: 'elbow_90_std', nameEn: '90° Standard Elbow (R/D=1)', nameTr: '90° Standart Dirsek (R/D=1)', k: 0.75, count: 4 },
    { id: 'valve_gate', nameEn: 'Gate Valve (Fully Open)', nameTr: 'Sürgülü Vana (Tam Açık)', k: 0.17, count: 2 },
    { id: 'pipe_entrance', nameEn: 'Sharp Pipe Entrance (Square)', nameTr: 'Keskin Boru Girişi', k: 0.50, count: 1 },
    { id: 'pipe_exit', nameEn: 'Pipe Exit to Reservoir', nameTr: 'Boru Çıkışı / Rezervuar Boşalması', k: 1.00, count: 1 },
  ]);

  const totalMinorK = useMemo(() => {
    return Number(addedFittings.reduce((acc, f) => acc + f.k * f.count, 0).toFixed(2));
  }, [addedFittings]);

  // 4. Flow Meter (Venturi / Orifice) inputs
  const [meterType, setMeterType] = useState<'venturi' | 'orifice'>('venturi');
  const [throatDiaMm, setThroatDiaMm] = useState<number>(30); // Throat / Orifice diameter
  const [deltaPKPa, setDeltaPKPa] = useState<number>(25);      // Differential pressure kPa

  // 5. Pump Efficiency
  const [pumpEfficiency, setPumpEfficiency] = useState<number>(75); // %
  const [motorEfficiency, setMotorEfficiency] = useState<number>(90); // %

  // --- CORE HYDRODYNAMICS SOLVER (Darcy-Weisbach & Colebrook-White) ---
  const hydroResults = useMemo(() => {
    const d = Math.max(1, diameterMm) / 1000; // m
    const l = Math.max(0.1, lengthM);          // m
    const q_m3s = Math.max(0.0001, flowRateM3h) / 3600; // m³/s
    const eps = ROUGHNESS_PRESETS[roughnessIdx].e / 1000; // m
    const relRoughness = eps / d;

    const area = (Math.PI * Math.pow(d, 2)) / 4;
    const velocity = q_m3s / area; // m/s
    const reynolds = (rho * velocity * d) / (mu || 1e-6);

    let f = 0;
    let regime: 'Laminar' | 'Transitional' | 'Turbulent' = 'Turbulent';

    if (reynolds < 2300) {
      regime = 'Laminar';
      f = reynolds > 0 ? 64 / reynolds : 0.064;
    } else if (reynolds <= 4000) {
      regime = 'Transitional';
      const f_lam = 64 / 2300;
      const f_turb = 0.25 / Math.pow(Math.log10(relRoughness / 3.7 + 5.74 / Math.pow(4000, 0.9)), 2);
      f = f_lam + ((reynolds - 2300) / 1700) * (f_turb - f_lam);
    } else {
      regime = 'Turbulent';
      // Swamee-Jain approximation of Colebrook-White
      f = 0.25 / Math.pow(Math.log10(relRoughness / 3.7 + 5.74 / Math.pow(reynolds, 0.9)), 2);
    }

    const g = 9.80665; // m/s²
    const velocityHead = Math.pow(velocity, 2) / (2 * g); // m

    // Major friction head loss (Darcy-Weisbach): hf = f * (L/D) * (v² / 2g)
    const headLossMajor = f * (l / d) * velocityHead;

    // Minor fitting head loss: hm = ΣK * (v² / 2g)
    const headLossMinor = totalMinorK * velocityHead;

    // Total Dynamic Head (TDH) = Elevation + h_major + h_minor
    const totalFrictionHead = headLossMajor + headLossMinor;
    const totalDynamicHead = elevationM + totalFrictionHead;

    // Pressure drop across pipe network: ΔP = ρ * g * h
    const pressureDropMajorPa = rho * g * headLossMajor;
    const pressureDropMinorPa = rho * g * headLossMinor;
    const totalFrictionPressureDropPa = rho * g * totalFrictionHead;

    const pressureDropMajorBar = pressureDropMajorPa / 100000;
    const pressureDropMinorBar = pressureDropMinorPa / 100000;
    const totalFrictionPressureDropBar = totalFrictionPressureDropPa / 100000;

    // Hydraulic Power: P_hyd = ρ * g * Q * H / 1000 (kW)
    const pumpHydraulicPowerKw = (rho * g * q_m3s * totalDynamicHead) / 1000;
    const pumpShaftPowerKw = pumpHydraulicPowerKw / (pumpEfficiency / 100);
    const motorElectricPowerKw = pumpShaftPowerKw / (motorEfficiency / 100);

    return {
      velocity,
      velocityHead,
      reynolds,
      regime,
      frictionFactor: f,
      relRoughness,
      headLossMajor,
      headLossMinor,
      totalFrictionHead,
      totalDynamicHead,
      pressureDropMajorBar,
      pressureDropMinorBar,
      totalFrictionPressureDropBar,
      totalFrictionPressureDropKPa: totalFrictionPressureDropPa / 1000,
      pumpHydraulicPowerKw,
      pumpShaftPowerKw,
      motorElectricPowerKw,
    };
  }, [diameterMm, lengthM, flowRateM3h, roughnessIdx, elevationM, totalMinorK, rho, mu, pumpEfficiency, motorEfficiency]);

  // --- ISO 5167 FLOW METER CALCULATION (Venturi / Orifice) ---
  const meterResults = useMemo(() => {
    const D = diameterMm / 1000;
    const d = Math.min(diameterMm - 1, Math.max(1, throatDiaMm)) / 1000;
    const beta = d / D;
    const areaThroat = (Math.PI * Math.pow(d, 2)) / 4;
    const deltaPPa = deltaPKPa * 1000;

    // Discharge coefficient Cd: Venturi ~0.985, Orifice ~0.61
    const Cd = meterType === 'venturi' ? 0.985 : 0.61;
    const E = 1 / Math.sqrt(1 - Math.pow(beta, 4)); // velocity approach factor

    // Q = Cd * E * A2 * sqrt(2 * ΔP / ρ)
    const q_m3s = Cd * E * areaThroat * Math.sqrt((2 * deltaPPa) / Math.max(0.1, rho));
    const q_m3h = q_m3s * 3600;
    const q_Lmin = q_m3h * (1000 / 60);

    return {
      beta,
      Cd,
      q_m3s,
      q_m3h,
      q_Lmin,
    };
  }, [diameterMm, throatDiaMm, deltaPKPa, meterType, rho]);

  const handleCopySummary = () => {
    const text = `AluCalc OS Fluid Mechanics & Piping Suite:
Fluid: ${activeFluid.nameEn} (ρ = ${rho} kg/m³, μ = ${mu} Pa·s)
Pipe: Ø${diameterMm} mm, Length = ${lengthM} m, Flow = ${flowRateM3h} m³/h
Velocity = ${hydroResults.velocity.toFixed(2)} m/s (Re = ${Math.round(hydroResults.reynolds)}, ${hydroResults.regime})
Friction factor f = ${hydroResults.frictionFactor.toFixed(5)}
Head Loss: Major = ${hydroResults.headLossMajor.toFixed(2)} m, Minor (ΣK=${totalMinorK}) = ${hydroResults.headLossMinor.toFixed(2)} m
Total Pressure Drop = ${hydroResults.totalFrictionPressureDropBar.toFixed(3)} bar (${hydroResults.totalFrictionPressureDropKPa.toFixed(1)} kPa)
Total Dynamic Head (TDH) = ${hydroResults.totalDynamicHead.toFixed(2)} m
Pump Shaft Power Required = ${hydroResults.pumpShaftPowerKw.toFixed(2)} kW per Darcy-Weisbach & Crane TP-410`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full w-full bg-[var(--bg-0)] text-slate-100 font-sans overflow-hidden">
      {/* ─── SUITE HEADER ─── */}
      <div className="shrink-0 px-4 py-3 bg-[var(--bg-0)] border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--cyan-glow)] border border-[var(--cyan)]/40 flex items-center justify-center text-[var(--cyan)] ">
            <Droplets size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black tracking-tight text-white uppercase">
                {t12(language, 'Fluid Dynamics & Piping Suite', 'Akışkanlar Mekaniği & Boru Hattı Paketi')}
              </h1>
              <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 uppercase">
                ISO 5167 · Crane TP-410
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              {t12(
                language,
                'Darcy-Weisbach head loss, Colebrook-White friction, fittings ΣK, and pump power sizing',
                'Darcy-Weisbach sürtünme kaybı, Colebrook-White faktörü, ek parça kayıpları ve pompa güç hesabı'
              )}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopySummary}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono transition border border-slate-700 active:scale-95"
          >
            {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            <span>{copied ? t12(language, 'Copied!', 'Kopyalandı!') : t12(language, 'Copy Summary', 'Özeti Kopyala')}</span>
          </button>
          <Link
            href="/pumps"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-mono font-bold transition active:scale-95"
          >
            <span>{t12(language, 'Open Pump Suite', 'Pompa Paketine Git')}</span>
            <ExternalLink size={12} />
          </Link>
        </div>
      </div>

      {/* ─── NAVIGATION TABS ─── */}
      <div className="shrink-0 px-4 bg-[var(--bg-1)] border-b border-slate-800 flex items-center gap-1 overflow-x-auto no-scrollbar">
        {[
          { id: 'pipe-friction', labelEn: 'Pipe Friction & Fittings (Crane TP-410)', labelTr: 'Boru Sürtünmesi & Ek Parçalar' },
          { id: 'flow-sim', labelEn: 'Flow X-Ray & Velocity Profile', labelTr: 'Akış Röntgeni & Hız Profili' },
          { id: 'fluid-props', labelEn: 'Fluid Properties & Rheology', labelTr: 'Akışkan Özellikleri & Reoloji' },
          { id: 'bernoulli', labelEn: 'Venturi & Orifice Meter (ISO 5167)', labelTr: 'Venturi & Orifis Debimetre' },
          { id: 'pump-sizing', labelEn: 'Pump Power & TDH Sizing', labelTr: 'Pompa TDH & Güç Boyutlandırma' },
        ].map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2.5 px-3 text-xs font-mono font-bold border-b-2 transition whitespace-nowrap ${
                active
                  ? 'border-cyan-400 text-cyan-300 bg-cyan-500/10'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              {t12(language, tab.labelEn, tab.labelTr)}
            </button>
          );
        })}
      </div>

      {/* ─── SUITE BODY ─── */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6">
        {/* KPI SUMMARY TILES (Always Visible) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-3 rounded-xl bg-[var(--bg-1)] border border-slate-800">
            <span className="text-[10px] font-mono text-slate-400 uppercase block">{t12(language, 'Flow Velocity', 'Akış Hızı (v)')}</span>
            <span className="text-xl font-black font-mono text-cyan-400">{hydroResults.velocity.toFixed(2)}</span>
            <span className="text-xs text-slate-500 ml-1">m/s</span>
          </div>

          <div className="p-3 rounded-xl bg-[var(--bg-1)] border border-slate-800">
            <span className="text-[10px] font-mono text-slate-400 uppercase block">{t12(language, 'Reynolds Number', 'Reynolds Sayısı')}</span>
            <span className="text-xl font-black font-mono text-white">{Math.round(hydroResults.reynolds).toLocaleString()}</span>
            <span className={`text-[10px] font-bold block uppercase mt-0.5 ${
              hydroResults.regime === 'Laminar' ? 'text-emerald-400' : hydroResults.regime === 'Transitional' ? 'text-amber-400' : 'text-cyan-400'
            }`}>
              {t12(language, hydroResults.regime, hydroResults.regime === 'Laminar' ? 'Laminer' : hydroResults.regime === 'Transitional' ? 'Geçiş Bölgesi' : 'Türbülans')}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[var(--bg-1)] border border-slate-800">
            <span className="text-[10px] font-mono text-slate-400 uppercase block">{t12(language, 'Friction Factor (f)', 'Sürtünme Faktörü (f)')}</span>
            <span className="text-xl font-black font-mono text-amber-300">{hydroResults.frictionFactor.toFixed(4)}</span>
            <span className="text-[10px] text-slate-500 block">Colebrook / Swamee</span>
          </div>

          <div className="p-3 rounded-xl bg-[var(--bg-1)] border border-slate-800">
            <span className="text-[10px] font-mono text-slate-400 uppercase block">{t12(language, 'Friction Head Loss', 'Sürtünme Kaybı (hf)')}</span>
            <span className="text-xl font-black font-mono text-rose-400">{hydroResults.totalFrictionHead.toFixed(2)}</span>
            <span className="text-xs text-slate-500 ml-1">mSS</span>
          </div>

          <div className="p-3 rounded-xl bg-[var(--bg-1)] border border-slate-800">
            <span className="text-[10px] font-mono text-slate-400 uppercase block">{t12(language, 'Total Pressure Drop', 'Toplam Basınç Düşümü')}</span>
            <span className="text-xl font-black font-mono text-purple-400">{hydroResults.totalFrictionPressureDropBar.toFixed(3)}</span>
            <span className="text-xs text-slate-500 ml-1">bar ({hydroResults.totalFrictionPressureDropKPa.toFixed(1)} kPa)</span>
          </div>

          <div className="p-3 rounded-xl bg-[var(--bg-1)] border border-slate-800">
            <span className="text-[10px] font-mono text-slate-400 uppercase block">{t12(language, 'Required Shaft Power', 'Mil Güç İhtiyacı')}</span>
            <span className="text-xl font-black font-mono text-emerald-400">{hydroResults.pumpShaftPowerKw.toFixed(2)}</span>
            <span className="text-xs text-slate-500 ml-1">kW ({(hydroResults.pumpShaftPowerKw * 1.341).toFixed(1)} HP)</span>
          </div>
        </div>

        {/* ─── TAB 1: PIPE FRICTION & CRANE TP-410 FITTINGS ─── */}
        {activeTab === 'pipe-friction' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Pipe Parameters (5 cols) */}
            <div className="lg:col-span-5 space-y-4 p-5 rounded-2xl bg-[var(--bg-0)] border border-slate-800">
              <h2 className="text-sm font-bold text-cyan-400 font-mono uppercase flex items-center gap-2">
                <Sliders size={16} />
                <span>{t12(language, 'Pipeline Geometry & Flow Rate', 'Boru Hattı Geometrisi & Debi')}</span>
              </h2>

              {/* Diameter Slider */}
              <div className="space-y-1 font-mono text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">{t12(language, 'Inside Diameter (D):', 'Boru İç Çapı (D):')}</span>
                  <span className="text-cyan-300 font-bold">Ø{diameterMm} mm ({((diameterMm) / 25.4).toFixed(2)}″)</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={600}
                  step={1}
                  value={diameterMm}
                  onChange={(e) => setDiameterMm(Number(e.target.value))}
                  className="w-full accent-[var(--cyan)]"
                />
                <div className="flex gap-1 overflow-x-auto pt-1 no-scrollbar">
                  {[25, 32, 40, 50, 65, 80, 100, 150, 200, 250, 300].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDiameterMm(d)}
                      className={`px-2 py-0.5 rounded text-[10px] border ${
                        diameterMm === d ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400' : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                      }`}
                    >
                      DN{d}
                    </button>
                  ))}
                </div>
              </div>

              {/* Length Slider */}
              <div className="space-y-1 font-mono text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">{t12(language, 'Total Pipe Length (L):', 'Toplam Boru Uzunluğu (L):')}</span>
                  <span className="text-cyan-300 font-bold">{lengthM} m</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={1000}
                  step={5}
                  value={lengthM}
                  onChange={(e) => setLengthM(Number(e.target.value))}
                  className="w-full accent-[var(--cyan)]"
                />
              </div>

              {/* Flow Rate */}
              <div className="space-y-1 font-mono text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">{t12(language, 'Volumetric Flow Rate (Q):', 'Hacimsel Debi (Q):')}</span>
                  <span className="text-cyan-300 font-bold">{flowRateM3h} m³/h ({((flowRateM3h * 1000) / 3600).toFixed(2)} L/s)</span>
                </div>
                <input
                  type="range"
                  min={0.5}
                  max={300}
                  step={0.5}
                  value={flowRateM3h}
                  onChange={(e) => setFlowRateM3h(Number(e.target.value))}
                  className="w-full accent-[var(--cyan)]"
                />
              </div>

              {/* Pipe Material Roughness */}
              <div className="space-y-1 font-mono text-xs">
                <label className="text-slate-400 block">{t12(language, 'Pipe Wall Roughness (ε):', 'Boru Cidar Pürüzlülüğü (ε):')}</label>
                <select
                  value={roughnessIdx}
                  onChange={(e) => setRoughnessIdx(Number(e.target.value))}
                  className="w-full p-2 rounded-lg bg-slate-900 border border-slate-700 text-white outline-none focus:border-cyan-400"
                >
                  {ROUGHNESS_PRESETS.map((r, i) => (
                    <option key={i} value={i}>
                      {t12(language, r.labelEn, r.labelTr)} (ε = {r.e} mm)
                    </option>
                  ))}
                </select>
              </div>

              {/* Static Elevation */}
              <div className="space-y-1 font-mono text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">{t12(language, 'Static Elevation Gain (H_static):', 'Statik Kot Farkı (H_statik):')}</span>
                  <span className="text-amber-300 font-bold">{elevationM} m</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={150}
                  step={1}
                  value={elevationM}
                  onChange={(e) => setElevationM(Number(e.target.value))}
                  className="w-full accent-[var(--cyan)]"
                />
              </div>
            </div>

            {/* Right Fittings Bucket (Crane TP-410) (7 cols) */}
            <div className="lg:col-span-7 space-y-4 p-5 rounded-2xl bg-[var(--bg-0)] border border-slate-800">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-amber-400 font-mono uppercase flex items-center gap-2">
                  <Layers size={16} />
                  <span>{t12(language, 'Minor Loss Fittings (Crane TP-410)', 'Ek Parça & Vana Kayıpları (Crane TP-410)')}</span>
                </h2>
                <span className="text-xs font-mono text-cyan-300 font-bold">
                  {t12(language, `Total ΣK = ${totalMinorK}`, `Toplam ΣK = ${totalMinorK}`)}
                </span>
              </div>

              {/* Quick Fitting Adder Grid */}
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-slate-400 uppercase block">
                  {t12(language, 'Tap to add standard fitting:', 'Bileşen eklemek için tıklayın:')}
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {STANDARD_FITTINGS.slice(0, 6).map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => {
                        setAddedFittings((prev) => {
                          const existing = prev.find((item) => item.id === f.id);
                          if (existing) {
                            return prev.map((item) => item.id === f.id ? { ...item, count: item.count + 1 } : item);
                          }
                          return [...prev, { ...f, count: 1 }];
                        });
                      }}
                      className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-cyan-500/50 text-left text-xs font-mono transition flex flex-col justify-between"
                    >
                      <span className="font-bold text-slate-200 truncate">{t12(language, f.nameEn, f.nameTr)}</span>
                      <span className="text-[10px] text-cyan-400 mt-1">K = {f.k} (+1)</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Active Fittings List */}
              <div className="space-y-2 pt-2">
                <div className="text-[11px] font-mono font-bold text-slate-400 uppercase">
                  {t12(language, 'Active Fittings in Circuit:', 'Hatta Ekli Parçalar & Katsayılar:')}
                </div>
                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
                  {addedFittings.map((fit) => (
                    <div
                      key={fit.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-slate-900/80 border border-slate-800 text-xs font-mono"
                    >
                      <div className="min-w-0 pr-2">
                        <span className="font-bold text-slate-200 block truncate">{t12(language, fit.nameEn, fit.nameTr)}</span>
                        <span className="text-[10px] text-slate-400">
                          K = {fit.k} × {fit.count} = <strong className="text-cyan-400">{(fit.k * fit.count).toFixed(2)}</strong>
                        </span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setAddedFittings((prev) =>
                              prev
                                .map((item) => item.id === fit.id ? { ...item, count: item.count - 1 } : item)
                                .filter((item) => item.count > 0)
                            );
                          }}
                          className="w-6 h-6 rounded bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center font-bold"
                        >
                          -
                        </button>
                        <span className="w-6 text-center font-bold text-white">{fit.count}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setAddedFittings((prev) =>
                              prev.map((item) => item.id === fit.id ? { ...item, count: item.count + 1 } : item)
                            );
                          }}
                          className="w-6 h-6 rounded bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center font-bold"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 2: FLOW SIMULATION & REYNOLDS PROFILE ─── */}
        {activeTab === 'flow-sim' && (
          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-black/40 border border-slate-800 relative overflow-hidden">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
                <div>
                  <h3 className="text-sm font-bold text-cyan-400 font-mono uppercase flex items-center gap-2">
                    <Activity size={18} />
                    <span>{t12(language, 'Cross-Section Fluid Velocity Profile (X-Ray)', 'Boru İçi Akış Röntgeni & Hız Profili')}</span>
                  </h3>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    {hydroResults.regime === 'Laminar'
                      ? t12(language, 'Parabolic Poiseuille velocity profile (v_max = 2 · v_avg)', 'Parabolik Poiseuille hız dağılımı (v_max = 2 · v_ort)')
                      : t12(language, 'Power-law turbulent plug velocity profile (v_max ≈ 1.2 · v_avg)', 'Türbülanslı düzleştirilmiş hız profili (v_max ≈ 1.2 · v_ort)')}
                  </p>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-xs font-mono text-cyan-300">
                  {t12(language, 'Reynolds Number:', 'Reynolds Sayısı:')} <strong className="text-white">{Math.round(hydroResults.reynolds).toLocaleString()}</strong>
                </div>
              </div>

              {/* Animated Streamline Pipe Cross-Section */}
              <div className="relative w-full h-44 rounded-2xl border-y-2 border-slate-700 bg-gradient-to-b from-slate-900/60 to-black overflow-hidden flex items-center justify-center">
                {/* Turbulence grid noise */}
                <div
                  className={`absolute inset-0 transition-opacity duration-500 ${hydroResults.regime === 'Laminar' ? 'opacity-0' : 'opacity-20'}`}
                  style={{
                    backgroundImage: 'radial-gradient(circle at 50% 50%, #38bdf8 1px, transparent 1px)',
                    backgroundSize: '12px 12px',
                  }}
                />

                {/* Animated Particles */}
                {[...Array(24)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute h-1 rounded-full"
                    style={{
                      width: hydroResults.regime === 'Laminar' ? '90px' : '35px',
                      backgroundColor: activeFluid.color,
                      opacity: 0.7,
                      top: `${8 + (i * 3.6)}%`,
                      left: '-20%',
                    }}
                    animate={{
                      x: ['0%', '160%'],
                      y: hydroResults.regime === 'Laminar' ? 0 : [0, Math.sin(i) * 5, 0],
                    }}
                    transition={{
                      duration: Math.max(0.4, 3.5 / Math.max(0.2, hydroResults.velocity)),
                      repeat: Infinity,
                      ease: 'linear',
                      delay: (i * 0.15) % 1.5,
                    }}
                  />
                ))}

                {/* Centerline */}
                <div className="absolute inset-x-0 h-[1px] bg-cyan-400/40 border-dashed" />
                <div className="absolute right-4 text-[10px] font-mono text-slate-400 uppercase bg-black/60 px-2 py-0.5 rounded border border-slate-800">
                  v_avg = {hydroResults.velocity.toFixed(2)} m/s
                </div>
              </div>

              {/* Flow Regime Explanation Card */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 font-mono text-xs">
                <div className={`p-3 rounded-xl border ${hydroResults.regime === 'Laminar' ? 'bg-emerald-950/30 border-emerald-500/40' : 'bg-slate-900 border-slate-800'}`}>
                  <span className="font-bold text-emerald-400 block">Re &lt; 2,300 ({t12(language, 'Laminar Flow', 'Laminer Akış')})</span>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {t12(language, 'Smooth parallel stream layers. Hagen-Poiseuille law governs: f = 64/Re.', 'Düzgün paralel katmanlar. Hagen-Poiseuille yasası: f = 64/Re.')}
                  </p>
                </div>

                <div className={`p-3 rounded-xl border ${hydroResults.regime === 'Transitional' ? 'bg-amber-950/30 border-amber-500/40' : 'bg-slate-900 border-slate-800'}`}>
                  <span className="font-bold text-amber-400 block">2,300 ≤ Re ≤ 4,000 ({t12(language, 'Transitional Flow', 'Geçiş Rejimi')})</span>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {t12(language, 'Intermittent eddies and vortices appear. Pressure fluctuations occur.', 'Düzensiz girdaplar ve çalkantılar başlar. Basınç dalgalanmaları görülür.')}
                  </p>
                </div>

                <div className={`p-3 rounded-xl border ${hydroResults.regime === 'Turbulent' ? 'bg-cyan-950/30 border-cyan-500/40' : 'bg-slate-900 border-slate-800'}`}>
                  <span className="font-bold text-cyan-400 block">Re &gt; 4,000 ({t12(language, 'Turbulent Flow', 'Türbülanslı Akış')})</span>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {t12(language, 'Full turbulent mixing. Colebrook-White / Swamee-Jain equation governs friction.', 'Tam karışımlı akış. Colebrook-White / Swamee-Jain formülü geçerlidir.')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 3: FLUID PROPERTIES & RHEOLOGY ─── */}
        {activeTab === 'fluid-props' && (
          <div className="space-y-4 p-5 rounded-2xl bg-[var(--bg-0)] border border-slate-800">
            <h2 className="text-sm font-bold text-cyan-400 font-mono uppercase flex items-center gap-2">
              <Droplets size={16} />
              <span>{t12(language, 'Fluid Database & Thermal Physical Constants', 'Akışkan Veritabanı & Termo-Fiziksel Sabitler')}</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {FLUID_PRESETS.map((f) => {
                const isSel = selectedFluidId === f.id;
                return (
                  <div
                    key={f.id}
                    onClick={() => setSelectedFluidId(f.id)}
                    className={`p-3.5 rounded-xl border cursor-pointer font-mono transition ${
                      isSel ? 'bg-cyan-500/15 border-cyan-400 text-white shadow-lg' : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-sm text-cyan-300">{t12(language, f.nameEn, f.nameTr)}</span>
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: f.color }} />
                    </div>
                    <div className="space-y-1 text-xs text-slate-400">
                      <div>{t12(language, 'Density (ρ):', 'Yoğunluk (ρ):')} <strong className="text-white">{f.rho} kg/m³</strong></div>
                      <div>{t12(language, 'Dyn Viscosity (μ):', 'Dinamik Viskozite (μ):')} <strong className="text-white">{f.mu} Pa·s</strong></div>
                      <div>{t12(language, 'Kin Viscosity (ν):', 'Kinematik Viskozite (ν):')} <strong className="text-white">{f.nu} cSt</strong></div>
                      <div>{t12(language, 'Vapor Press (Pv):', 'Buharlaşma Basıncı (Pv):')} <strong className="text-white">{f.pv} kPa</strong></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ─── TAB 4: VENTURI & ORIFICE METER (ISO 5167) ─── */}
        {activeTab === 'bernoulli' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 space-y-4 p-5 rounded-2xl bg-[var(--bg-0)] border border-slate-800">
              <h2 className="text-sm font-bold text-cyan-400 font-mono uppercase flex items-center gap-2">
                <Gauge size={16} />
                <span>{t12(language, 'Differential Pressure Flow Meter (ISO 5167)', 'Fark Basınçlı Debi Ölçer (ISO 5167)')}</span>
              </h2>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMeterType('venturi')}
                  className={`py-2 rounded-lg font-mono text-xs font-bold border transition ${
                    meterType === 'venturi' ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400' : 'bg-slate-900 border-slate-700 text-slate-400'
                  }`}
                >
                  {t12(language, 'Venturi Tube (Cd ≈ 0.985)', 'Venturi Tüpü (Cd ≈ 0.985)')}
                </button>
                <button
                  type="button"
                  onClick={() => setMeterType('orifice')}
                  className={`py-2 rounded-lg font-mono text-xs font-bold border transition ${
                    meterType === 'orifice' ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400' : 'bg-slate-900 border-slate-700 text-slate-400'
                  }`}
                >
                  {t12(language, 'Orifice Plate (Cd ≈ 0.61)', 'Orifis Plakası (Cd ≈ 0.61)')}
                </button>
              </div>

              <div className="space-y-1 font-mono text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">{t12(language, 'Throat / Orifice Diameter (d):', 'Boğaz / Orifis Delik Çapı (d):')}</span>
                  <span className="text-cyan-300 font-bold">Ø{throatDiaMm} mm</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={diameterMm - 1}
                  step={1}
                  value={throatDiaMm}
                  onChange={(e) => setThroatDiaMm(Number(e.target.value))}
                  className="w-full accent-[var(--cyan)]"
                />
                <span className="text-[10px] text-slate-500 block">
                  β = d/D = {meterResults.beta.toFixed(3)} (ISO 5167 standard: 0.2 ≤ β ≤ 0.75)
                </span>
              </div>

              <div className="space-y-1 font-mono text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">{t12(language, 'Measured Differential Pressure (ΔP):', 'Ölçülen Fark Basınç (ΔP):')}</span>
                  <span className="text-amber-300 font-bold">{deltaPKPa} kPa ({deltaPKPa * 10} mbar)</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={200}
                  step={1}
                  value={deltaPKPa}
                  onChange={(e) => setDeltaPKPa(Number(e.target.value))}
                  className="w-full accent-[var(--cyan)]"
                />
              </div>
            </div>

            <div className="lg:col-span-7 space-y-4 p-5 rounded-2xl bg-[var(--bg-0)] border border-slate-800 font-mono">
              <h2 className="text-sm font-bold text-emerald-400 uppercase">
                {t12(language, 'Calculated Flow Rate Results', 'Hesaplanan Debi Sonuçları')}
              </h2>

              <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-center space-y-2">
                <span className="text-xs text-slate-400 uppercase block">{t12(language, 'Volumetric Flow Rate (Q)', 'Hacimsel Akış Debisi (Q)')}</span>
                <div className="text-3xl font-black text-emerald-400">
                  {meterResults.q_m3h.toFixed(2)} <span className="text-base font-normal">m³/h</span>
                </div>
                <div className="text-sm text-slate-300">
                  = <strong>{meterResults.q_Lmin.toFixed(1)} L/min</strong> ({((meterResults.q_m3s) * 1000).toFixed(2)} L/s)
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 space-y-1">
                <div className="font-bold text-cyan-400">ISO 5167 Bernoulli Equation:</div>
                <div className="font-mono text-slate-400">
                  Q = C_d · E · A_throat · √(2 · ΔP / ρ)
                </div>
                <div className="text-[11px] text-slate-500 pt-1">
                  C_d = {meterResults.Cd}, Approach Factor E = (1 - β⁴)^(-0.5) = {(1 / Math.sqrt(1 - Math.pow(meterResults.beta, 4))).toFixed(4)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 5: PUMP POWER & TDH SIZING ─── */}
        {activeTab === 'pump-sizing' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 font-mono text-xs">
            <div className="lg:col-span-5 space-y-4 p-5 rounded-2xl bg-[var(--bg-0)] border border-slate-800">
              <h2 className="text-sm font-bold text-cyan-400 uppercase flex items-center gap-2">
                <Zap size={16} />
                <span>{t12(language, 'Hydraulic & Motor Efficiencies', 'Pompa & Motor Verimleri')}</span>
              </h2>

              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">{t12(language, 'Pump Hydraulic Efficiency (η_p):', 'Pompa Hidrolik Verimi (η_p):')}</span>
                  <span className="text-cyan-300 font-bold">%{pumpEfficiency}</span>
                </div>
                <input
                  type="range"
                  min={40}
                  max={90}
                  step={1}
                  value={pumpEfficiency}
                  onChange={(e) => setPumpEfficiency(Number(e.target.value))}
                  className="w-full accent-[var(--cyan)]"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">{t12(language, 'Electric Motor Efficiency (η_m):', 'Elektrik Motor Verimi (η_m):')}</span>
                  <span className="text-cyan-300 font-bold">%{motorEfficiency} (IE3/IE4)</span>
                </div>
                <input
                  type="range"
                  min={70}
                  max={98}
                  step={1}
                  value={motorEfficiency}
                  onChange={(e) => setMotorEfficiency(Number(e.target.value))}
                  className="w-full accent-[var(--cyan)]"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1 text-slate-300">
                <span className="font-bold text-white block">{t12(language, 'Total Dynamic Head Breakdown:', 'Toplam Dinamik Yük Kırılımı:')}</span>
                <div>{t12(language, 'Static Elevation Gain:', 'Statik Yükseklik Farkı:')} <strong>{elevationM} m</strong></div>
                <div>{t12(language, 'Major Pipe Friction Loss:', 'Boru Hattı Sürtünme Kaybı:')} <strong>{hydroResults.headLossMajor.toFixed(2)} m</strong></div>
                <div>{t12(language, 'Minor Fittings Loss (ΣK):', 'Ek Parça & Vana Kaybı:')} <strong>{hydroResults.headLossMinor.toFixed(2)} m</strong></div>
                <div className="text-cyan-400 font-bold pt-1 border-t border-slate-800">
                  TDH = {hydroResults.totalDynamicHead.toFixed(2)} mSS
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 space-y-4 p-5 rounded-2xl bg-[var(--bg-0)] border border-slate-800">
              <h2 className="text-sm font-bold text-emerald-400 uppercase">
                {t12(language, 'Pump Sizing Recommendations', 'Pompa Boyutlandırma Önerileri')}
              </h2>

              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase block">{t12(language, 'Hydraulic Fluid Power', 'Net Hidrolik Akış Gücü')}</span>
                  <span className="text-2xl font-black text-cyan-400">{hydroResults.pumpHydraulicPowerKw.toFixed(2)} kW</span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase block">{t12(language, 'Required Shaft Brake Power', 'Gerekli Pompa Mil Gücü')}</span>
                  <span className="text-2xl font-black text-amber-300">{hydroResults.pumpShaftPowerKw.toFixed(2)} kW</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-emerald-950/25 border border-emerald-500/40 text-center">
                <span className="text-[10px] text-slate-400 uppercase block">
                  {t12(language, 'Recommended Standard Electric Motor (IEC 60034-30):', 'Önerilen Standart Elektrik Motoru (IEC 60034-30):')}
                </span>
                <div className="text-2xl font-black text-emerald-400 mt-1">
                  {hydroResults.motorElectricPowerKw <= 0.75
                    ? '0.75 kW (1.0 HP)'
                    : hydroResults.motorElectricPowerKw <= 1.5
                    ? '1.5 kW (2.0 HP)'
                    : hydroResults.motorElectricPowerKw <= 2.2
                    ? '2.2 kW (3.0 HP)'
                    : hydroResults.motorElectricPowerKw <= 4.0
                    ? '4.0 kW (5.5 HP)'
                    : hydroResults.motorElectricPowerKw <= 5.5
                    ? '5.5 kW (7.5 HP)'
                    : hydroResults.motorElectricPowerKw <= 7.5
                    ? '7.5 kW (10.0 HP)'
                    : hydroResults.motorElectricPowerKw <= 11
                    ? '11.0 kW (15.0 HP)'
                    : hydroResults.motorElectricPowerKw <= 15
                    ? '15.0 kW (20.0 HP)'
                    : hydroResults.motorElectricPowerKw <= 22
                    ? '22.0 kW (30.0 HP)'
                    : `${(Math.ceil(hydroResults.motorElectricPowerKw / 5) * 5)} kW`}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  {t12(
                    language,
                    `Includes motor efficiency of %${motorEfficiency} and hydraulic duty safety margin.`,
                    `%${motorEfficiency} motor verimi ve hidrolik emniyet payı dahil edilmiştir.`
                  )}
                </div>
              </div>

              <Link
                href="/pumps"
                className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition active:scale-98 shadow-lg "
              >
                <span>{t12(language, 'Explore Dedicated Pumps Suite (NPSH & Curves)', 'Gelişmiş Pompa Paketine Geç (NPSH & Eğriler)')}</span>
                <ChevronRight size={16} />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
