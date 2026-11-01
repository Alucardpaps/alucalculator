'use client';

import React, { useState, useMemo } from 'react';
import { 
  Droplets, 
  Activity, 
  Zap, 
  TrendingUp, 
  ShieldAlert, 
  CheckCircle2, 
  Gauge, 
  DollarSign, 
  Sliders, 
  RotateCw, 
  Layers, 
  Flame, 
  Info,
  Sparkles,
  Copy,
  Check
} from 'lucide-react';
import { useI18nStore } from '@/store/i18nStore';
import { t12 } from '@/locales/t12';
import { useGlobalPrecision, formatEngineeringValue } from '@/components/calculator-kit/precisionUtils';

// --- Fluid Presets ---
interface FluidPreset {
  id: string;
  nameEn: string;
  nameTr: string;
  density: number; // kg/m³
  vaporPressure: number; // kPa at given temp
  viscosity: number; // cSt
  tempC: number;
}

const FLUID_PRESETS: FluidPreset[] = [
  { id: 'water-20', nameEn: 'Clean Water (20°C)', nameTr: 'Temiz Su (20°C)', density: 998, vaporPressure: 2.34, viscosity: 1.00, tempC: 20 },
  { id: 'water-60', nameEn: 'Hot Water (60°C)', nameTr: 'Sıcak Su (60°C)', density: 983, vaporPressure: 19.9, viscosity: 0.47, tempC: 60 },
  { id: 'water-90', nameEn: 'Boiling Water (90°C)', nameTr: 'Kaynar Su (90°C)', density: 965, vaporPressure: 70.1, viscosity: 0.31, tempC: 90 },
  { id: 'seawater', nameEn: 'Seawater (20°C)', nameTr: 'Deniz Suyu (20°C)', density: 1025, vaporPressure: 2.30, viscosity: 1.05, tempC: 20 },
  { id: 'diesel', nameEn: 'Diesel Fuel (20°C)', nameTr: 'Dizel Yakıt (20°C)', density: 840, vaporPressure: 0.50, viscosity: 3.50, tempC: 20 },
  { id: 'oil-vg46', nameEn: 'Hydraulic Oil (ISO VG 46)', nameTr: 'Hidrolik Yağ (ISO VG 46)', density: 875, vaporPressure: 0.01, viscosity: 46.0, tempC: 40 },
  { id: 'glycol-30', nameEn: 'Glycol-Water 30% (20°C)', nameTr: 'Glikol-Su %30 (20°C)', density: 1040, vaporPressure: 2.10, viscosity: 2.40, tempC: 20 },
];

// --- Standard IEC Motor Ratings (kW) ---
const IEC_MOTORS = [
  0.37, 0.55, 0.75, 1.1, 1.5, 2.2, 3.0, 4.0, 5.5, 7.5, 11, 15, 18.5, 22, 30, 37, 45, 55, 75, 90, 110, 132, 160, 200, 250, 315, 355, 400
];

export function PumpsModule({ lang: propLang }: { lang?: string, dict?: any }) {
  const precision = useGlobalPrecision();
  const { language: storeLang } = useI18nStore();
  const lang = propLang || storeLang || 'en';

  // --- Active Tab ---
  const [activeTab, setActiveTab] = useState<'duty' | 'curve' | 'npsh' | 'affinity' | 'energy'>('duty');
  const [unit, setUnit] = useState<'metric' | 'imperial'>('metric');
  const [selectedFluidId, setSelectedFluidId] = useState<string>('water-20');
  const [copied, setCopied] = useState(false);

  // --- Core Inputs ---
  const [flow, setFlow] = useState(120); // m³/h
  const [head, setHead] = useState(45); // m
  const [rpm, setRpm] = useState(1450); // RPM
  const [pumpEff, setPumpEff] = useState(78); // %
  const [motorEff, setMotorEff] = useState(92); // %

  // Custom Fluid Properties (overridden if preset chosen)
  const currentFluid = useMemo(() => {
    return FLUID_PRESETS.find(f => f.id === selectedFluidId) || FLUID_PRESETS[0];
  }, [selectedFluidId]);

  const [density, setDensity] = useState(currentFluid.density);
  const [vaporPressure, setVaporPressure] = useState(currentFluid.vaporPressure);

  // When fluid changes, update density & vapor pressure
  const handleFluidChange = (fluidId: string) => {
    setSelectedFluidId(fluidId);
    const fl = FLUID_PRESETS.find(f => f.id === fluidId);
    if (fl) {
      setDensity(fl.density);
      setVaporPressure(fl.vaporPressure);
    }
  };

  // --- NPSH Inputs ---
  const [patm, setPatm] = useState(101.3); // kPa
  const [suctionLift, setSuctionLift] = useState(2.0); // m (+ = flooded, - = lift)
  const [suctionLoss, setSuctionLoss] = useState(0.6); // m (friction)
  const [npshRequired, setNpshRequired] = useState(3.2); // m

  // --- System Curve Inputs ---
  const [staticElevation, setStaticElevation] = useState(20); // m
  const [pipeLossK, setPipeLossK] = useState(0.00174); // H_f = k * Q^2

  // --- Affinity Law Inputs ---
  const [targetRpm, setTargetRpm] = useState(1750);
  const [baseImpellerD, setBaseImpellerD] = useState(210); // mm
  const [targetImpellerD, setTargetImpellerD] = useState(195); // mm

  // --- Energy & OPEX Inputs ---
  const [operatingHours, setOperatingHours] = useState(6000); // hrs/year
  const [kwhCost, setKwhCost] = useState(0.14); // $/kWh or TL/kWh
  const [carbonFactor, setCarbonFactor] = useState(0.45); // kg CO2 / kWh

  // --- Calculations ---
  const results = useMemo(() => {
    const g = 9.80665;
    const Q_m3s = flow / 3600; // m³/s
    const eta_p = Math.max(0.01, Math.min(1.0, pumpEff / 100));
    const eta_m = Math.max(0.01, Math.min(1.0, motorEff / 100));

    // Hydraulic Power: P_hyd = rho * g * Q * H (Watts)
    const hydPowerW = density * g * Q_m3s * head;
    const hydPowerKW = hydPowerW / 1000;

    // Shaft Power: P_shaft = P_hyd / eta_p
    const shaftPowerKW = hydPowerKW / eta_p;

    // Electric Input Power: P_elec = P_shaft / eta_m
    const electricPowerKW = shaftPowerKW / eta_m;

    // Shaft Torque: T = (P_shaft * 1000) / (2 * pi * n / 60)
    const omega = (2 * Math.PI * rpm) / 60;
    const torqueNm = omega > 0 ? (shaftPowerKW * 1000) / omega : 0;

    // Specific Speed Ns (Metric): Ns = n * sqrt(Q_m3s) / (H^(3/4))
    const nsMetric = head > 0 ? (rpm * Math.sqrt(Q_m3s)) / Math.pow(head, 0.75) : 0;
    // Specific Speed Ns (US): Ns_us = rpm * sqrt(GPM) / H_ft^(3/4)
    const flowGPM = flow * 4.40287;
    const headFt = head * 3.28084;
    const nsUS = headFt > 0 ? (rpm * Math.sqrt(flowGPM)) / Math.pow(headFt, 0.75) : 0;

    // Impeller Type Classification
    let impellerTypeEn = 'Radial Vane (Centrifugal)';
    let impellerTypeTr = 'Radyal Çark (Santrifüj)';
    if (nsMetric < 30) {
      impellerTypeEn = 'Radial Flow Impeller (High Head, Low Flow)';
      impellerTypeTr = 'Radyal Akışlı Çark (Yüksek Basma, Düşük Debi)';
    } else if (nsMetric < 75) {
      impellerTypeEn = 'Francis Vane / Mixed Flow (Medium Head)';
      impellerTypeTr = 'Francis Kanatlı / Karışık Akışlı (Orta Basma)';
    } else if (nsMetric < 160) {
      impellerTypeEn = 'Mixed Flow Impeller (Diagonal)';
      impellerTypeTr = 'Diyagonal Karışık Akışlı Çark';
    } else {
      impellerTypeEn = 'Axial Flow Propeller (High Flow, Low Head)';
      impellerTypeTr = 'Eksenel Pervane (Yüksek Debi, Düşük Basma)';
    }

    // Recommended Standard IEC Motor Size
    // Include 15% safety margin on shaft power to avoid overload at runout
    const powerWithMargin = shaftPowerKW * 1.15;
    const recommendedMotorKW = IEC_MOTORS.find(m => m >= powerWithMargin) || IEC_MOTORS[IEC_MOTORS.length - 1];

    // --- NPSH Calculations ---
    const headAtm = (patm * 1000) / (density * g);
    const headVap = (vaporPressure * 1000) / (density * g);
    const npshAvailable = headAtm - headVap + suctionLift - suctionLoss;
    const npshMargin = npshAvailable - npshRequired;
    const npshRatio = npshRequired > 0 ? npshAvailable / npshRequired : 999;

    let cavitationStatus: 'safe' | 'warning' | 'danger' = 'safe';
    let cavitationTextTr = 'GÜVENLİ — Kavitasyon Riski Yok';
    let cavitationTextEn = 'SAFE — No Cavitation Risk';
    if (npshAvailable < npshRequired) {
      cavitationStatus = 'danger';
      cavitationTextTr = 'KRİTİK KAVİTASYON TEHLİKESİ (NPSHa < NPSHr)';
      cavitationTextEn = 'CRITICAL CAVITATION RISK (NPSHa < NPSHr)';
    } else if (npshMargin < 0.8) {
      cavitationStatus = 'warning';
      cavitationTextTr = 'SINIRDA / DÜŞÜK GÜVENLİK MARJI (Margin < 0.8m)';
      cavitationTextEn = 'MARGINAL / LOW SAFETY MARGIN (Margin < 0.8m)';
    }

    // --- Affinity Laws (Speed & Trimming) ---
    const speedRatio = rpm > 0 ? targetRpm / rpm : 1;
    const trimRatio = baseImpellerD > 0 ? targetImpellerD / baseImpellerD : 1;

    const affFlow = flow * speedRatio * trimRatio;
    const affHead = head * Math.pow(speedRatio, 2) * Math.pow(trimRatio, 2);
    const affPower = shaftPowerKW * Math.pow(speedRatio, 3) * Math.pow(trimRatio, 3);

    // --- Energy & Lifecycle Calculations ---
    const annualKWh = electricPowerKW * operatingHours;
    const annualEnergyCost = annualKWh * kwhCost;
    const tenYearOpex = annualEnergyCost * 10;
    const annualCarbonTons = (annualKWh * carbonFactor) / 1000;

    return {
      hydPowerKW,
      shaftPowerKW,
      electricPowerKW,
      torqueNm,
      nsMetric,
      nsUS,
      impellerTypeEn,
      impellerTypeTr,
      recommendedMotorKW,
      powerWithMargin,
      headAtm,
      headVap,
      npshAvailable,
      npshMargin,
      npshRatio,
      cavitationStatus,
      cavitationTextTr,
      cavitationTextEn,
      speedRatio,
      trimRatio,
      affFlow,
      affHead,
      affPower,
      annualKWh,
      annualEnergyCost,
      tenYearOpex,
      annualCarbonTons
    };
  }, [
    flow, head, rpm, pumpEff, motorEff, density, vaporPressure,
    patm, suctionLift, suctionLoss, npshRequired,
    targetRpm, baseImpellerD, targetImpellerD,
    operatingHours, kwhCost, carbonFactor
  ]);

  // Copy results summary
  const handleCopySummary = () => {
    const summary = `--- ALUCALC INDUSTRIAL PUMP ANALYSIS ---
Fluid: ${currentFluid.nameEn} (ρ = ${density} kg/m³)
Operating Duty: Q = ${flow} m³/h | H = ${head} m @ ${rpm} RPM
Hydraulic Output: ${formatEngineeringValue(results.hydPowerKW, precision, false)} kW
Shaft Power (BHP): ${formatEngineeringValue(results.shaftPowerKW, precision, false)} kW (η_p = ${pumpEff}%)
Motor Required: ${results.recommendedMotorKW} kW IEC (Electric Input: ${formatEngineeringValue(results.electricPowerKW, precision, false)} kW)
Torque: ${formatEngineeringValue(results.torqueNm, precision, false)} N·m
Specific Speed: Ns = ${formatEngineeringValue(results.nsMetric, precision, false)} metric (${results.impellerTypeEn})
NPSHa: ${formatEngineeringValue(results.npshAvailable, precision, false)} m vs NPSHr: ${formatEngineeringValue(npshRequired, precision, false)} m (Margin: +${formatEngineeringValue(results.npshMargin, precision, false)} m - ${results.cavitationTextEn})
Annual Energy: ${Math.round(results.annualKWh).toLocaleString()} kWh/yr (~$${Math.round(results.annualEnergyCost).toLocaleString()}/yr)
Standard: ISO 9906 / HI 14.3`;

    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Convert to imperial helper
  const toGPM = (m3h: number) => m3h * 4.40287;
  const toFT = (m: number) => m * 3.28084;
  const toHP = (kw: number) => kw * 1.34102;

  return (
    <div className="flex flex-col h-full bg-[var(--bg-0)] text-slate-100 select-none font-sans overflow-hidden">
      
      {/* Top Header Bar */}
      <div className="border-b border-white/10 bg-[var(--bg-1)]/80 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--cyan-glow)] border border-[var(--cyan)]/40 flex items-center justify-center text-[var(--cyan)] shadow-lg ">
            <Droplets size={22} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black tracking-tight text-white uppercase">
                {t12(lang, 'Industrial Pump Engineering Studio', 'Endüstriyel Pompa Mühendisliği')}
              </h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                HI 14.3 / ISO 9906
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              {t12(lang, 'Duty Point, H-Q Curves, Cavitation (NPSH), Affinity Laws & Energy LCC Engine', 'Görev Noktası, H-Q Eğrileri, Kavitasyon (NPSH), Benzetim Kanunları ve Enerji LCC Analizi')}
            </p>
          </div>
        </div>

        {/* Global Controls: Fluid & Unit & Copy */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Fluid Selector */}
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5">
            <Flame size={14} className="text-amber-400" />
            <select
              value={selectedFluidId}
              onChange={(e) => handleFluidChange(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-200 outline-none cursor-pointer"
            >
              {FLUID_PRESETS.map((f) => (
                <option key={f.id} value={f.id} className="bg-[var(--bg-2)] text-white">
                  {t12(lang, f.nameEn, f.nameTr)}
                </option>
              ))}
            </select>
          </div>

          {/* Unit Toggle */}
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 text-xs font-bold font-mono">
            <button
              onClick={() => setUnit('metric')}
              className={`px-3 py-1 rounded-lg transition-all ${unit === 'metric' ? 'bg-[var(--cyan)] text-[var(--accent-ink)] shadow-md font-black' : 'text-slate-400 hover:text-white'}`}
            >
              METRIC (m³/h, m, kW)
            </button>
            <button
              onClick={() => setUnit('imperial')}
              className={`px-3 py-1 rounded-lg transition-all ${unit === 'imperial' ? 'bg-[var(--cyan)] text-[var(--accent-ink)] shadow-md font-black' : 'text-slate-400 hover:text-white'}`}
            >
              IMPERIAL (GPM, ft, HP)
            </button>
          </div>

          {/* Copy Button */}
          <button
            onClick={handleCopySummary}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-slate-300 transition-all"
            title="Copy Report"
          >
            {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            <span>{copied ? (t12(lang, 'Copied', 'Kopyalandı')) : (t12(lang, 'Copy Summary', 'Özet Kopyala'))}</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-white/10 bg-[var(--bg-1)] px-6 gap-2 overflow-x-auto custom-scrollbar">
        {[
          { id: 'duty', labelTr: '1. Görev Noktası & Güç', labelEn: '1. Duty Point & Power', icon: Activity },
          { id: 'curve', labelTr: '2. H-Q & Sistem Eğrisi (BEP)', labelEn: '2. H-Q & System Curve (BEP)', icon: TrendingUp },
          { id: 'npsh', labelTr: '3. NPSH & Kavitasyon Kontrolü', labelEn: '3. NPSH & Cavitation Risk', icon: ShieldAlert },
          { id: 'affinity', labelTr: '4. Benzetim & Çark Kırpma', labelEn: '4. Affinity Laws & Trimming', icon: RotateCw },
          { id: 'energy', labelTr: '5. Enerji & İşletme Maliyeti', labelEn: '5. Energy & Lifecycle Cost', icon: DollarSign },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 py-3 px-4 text-xs font-bold transition-all border-b-2 whitespace-nowrap ${
                isActive
                  ? 'border-cyan-400 text-cyan-300 bg-cyan-500/10'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <Icon size={16} className={isActive ? 'text-cyan-400' : 'text-slate-500'} />
              <span>{t12(lang, tab.labelEn, tab.labelTr)}</span>
            </button>
          );
        })}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-[var(--bg-0)]">
        <div className="max-w-7xl mx-auto space-y-6">

          {/* TAB 1: DUTY POINT & POWER & MOTOR SELECTION */}
          {activeTab === 'duty' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Inputs Column */}
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-[var(--bg-1)] border border-white/10 rounded-2xl p-5 space-y-4 shadow-xl">
                  <h3 className="text-xs font-black tracking-wider text-cyan-400 uppercase flex items-center gap-2">
                    <Sliders size={16} /> {t12(lang, 'OPERATING PARAMETERS', 'GİRİŞ PARAMETRELERİ')}
                  </h3>

                  {/* Flow Rate Input */}
                  <div>
                    <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1.5">
                      <span>{t12(lang, 'Flow Rate (Q)', 'Debi (Q)')}</span>
                      <span className="font-mono text-cyan-300 font-bold">
                        {flow} {unit === 'metric' ? 'm³/h' : `m³/h (${formatEngineeringValue(toGPM(flow), precision, false)} GPM)`}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="1000"
                      step="1"
                      value={flow}
                      onChange={(e) => setFlow(Number(e.target.value))}
                      className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[var(--cyan)]"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                      <span>1 m³/h</span>
                      <span>500 m³/h</span>
                      <span>1000 m³/h</span>
                    </div>
                  </div>

                  {/* Head Input */}
                  <div>
                    <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1.5">
                      <span>{t12(lang, 'Total Dynamic Head (H)', 'Toplam Basma Yüksekliği (H)')}</span>
                      <span className="font-mono text-cyan-300 font-bold">
                        {head} {unit === 'metric' ? 'm' : `m (${formatEngineeringValue(toFT(head), precision, false)} ft)`}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="2"
                      max="300"
                      step="1"
                      value={head}
                      onChange={(e) => setHead(Number(e.target.value))}
                      className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[var(--cyan)]"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                      <span>2 m</span>
                      <span>150 m</span>
                      <span>300 m</span>
                    </div>
                  </div>

                  {/* Rotational Speed */}
                  <div>
                    <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1.5">
                      <span>{t12(lang, 'Rotational Speed (n)', 'Dönüş Hızı (n)')}</span>
                      <span className="font-mono text-cyan-300 font-bold">{rpm} RPM</span>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[960, 1450, 2900, 3500].map((speed) => (
                        <button
                          key={speed}
                          onClick={() => setRpm(speed)}
                          className={`py-1.5 text-xs font-mono font-bold rounded-lg border transition-all ${
                            rpm === speed
                              ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                              : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'
                          }`}
                        >
                          {speed}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Efficiencies */}
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/5">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                        {t12(lang, 'Pump Eff. (η_p)', 'Pompa Verimi (η_p)')}
                      </label>
                      <div className="flex items-center gap-2 bg-[var(--bg-0)] border border-white/10 rounded-xl px-3 py-2">
                        <input
                          type="number"
                          min="10"
                          max="95"
                          value={pumpEff}
                          onChange={(e) => setPumpEff(Number(e.target.value))}
                          className="w-full bg-transparent text-sm font-mono font-bold text-white outline-none"
                        />
                        <span className="text-xs text-slate-500 font-bold">%</span>
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                        {t12(lang, 'Motor Eff. (η_m)', 'Motor Verimi (η_m)')}
                      </label>
                      <div className="flex items-center gap-2 bg-[var(--bg-0)] border border-white/10 rounded-xl px-3 py-2">
                        <input
                          type="number"
                          min="50"
                          max="98"
                          value={motorEff}
                          onChange={(e) => setMotorEff(Number(e.target.value))}
                          className="w-full bg-transparent text-sm font-mono font-bold text-white outline-none"
                        />
                        <span className="text-xs text-slate-500 font-bold">%</span>
                      </div>
                    </div>
                  </div>

                  {/* Fluid Properties Display */}
                  <div className="bg-[var(--bg-1)] border border-cyan-500/20 rounded-xl p-3 text-xs space-y-1">
                    <div className="flex justify-between text-slate-400">
                      <span>{t12(lang, 'Fluid Density (ρ):', 'Akışkan Yoğunluğu (ρ):')}</span>
                      <span className="font-mono font-bold text-slate-200">{density} kg/m³</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>{t12(lang, 'Vapor Pressure (P_vap):', 'Buhar Basıncı (P_vap):')}</span>
                      <span className="font-mono font-bold text-slate-200">{vaporPressure} kPa</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Center & Right: CAD Visualizer & KPI Output Cards */}
              <div className="lg:col-span-7 space-y-6">
                {/* 2D Animated Pump Volute CAD Cross-section */}
                <div className="bg-[var(--bg-1)] border border-white/10 rounded-2xl p-5 shadow-2xl relative overflow-hidden">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-slate-400 tracking-wider uppercase">
                      {t12(lang, 'HYDRAULIC VOLUTE & IMPELLER VIEW', 'HİDROLİK ÇARK & SALYANGOZ KESİTİ')}
                    </span>
                    <span className="text-xs font-mono font-bold text-cyan-400">
                      Ns = {formatEngineeringValue(results.nsMetric, precision, false)} (Metric)
                    </span>
                  </div>

                  <div className="h-56 w-full flex items-center justify-center relative bg-[var(--bg-0)] rounded-xl border border-white/5">
                    <svg viewBox="0 0 400 240" className="w-full h-full max-h-[220px]">
                      <defs>
                        <linearGradient id="voluteMetal" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#334155" />
                          <stop offset="50%" stopColor="#1e293b" />
                          <stop offset="100%" stopColor="#0f172a" />
                        </linearGradient>
                        <linearGradient id="fluidFlowGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.8" />
                        </linearGradient>
                      </defs>

                      {/* Volute Spiral Casing */}
                      <path
                        d="M 230,30 L 270,30 L 270,95 C 285,140 260,195 190,205 C 120,215 75,160 85,100 C 95,45 155,45 190,45 L 230,45 Z"
                        fill="url(#voluteMetal)"
                        stroke="#475569"
                        strokeWidth="2"
                      />
                      {/* Fluid Flow inside Volute */}
                      <path
                        d="M 235,32 L 265,32 L 265,95 C 275,130 250,185 190,195 C 130,205 90,155 98,105 C 105,55 155,55 190,55 L 235,55 Z"
                        fill="url(#fluidFlowGrad)"
                        stroke="#00e5ff"
                        strokeWidth="1"
                        opacity="0.8"
                      />

                      {/* Rotating Impeller */}
                      {(() => {
                        const cx = 180;
                        const cy = 125;
                        const rImp = 46;
                        const nBlades = 6;
                        const dur = rpm > 0 ? Math.max((60 / rpm) * 6, 0.4) : 0;

                        return (
                          <g>
                            {/* Suction Eye Ring */}
                            <circle cx={cx} cy={cy} r={rImp + 4} fill="none" stroke="#38bdf8" strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />

                            {/* Spinning Assembly */}
                            <g
                              style={dur > 0 ? {
                                transformOrigin: `${cx}px ${cy}px`,
                                animation: `spin ${formatEngineeringValue(dur, precision, false)}s linear infinite`
                              } : undefined}
                            >
                              <circle cx={cx} cy={cy} r={rImp} fill="#0f172a" stroke="#0284c7" strokeWidth="1.5" />
                              {Array.from({ length: nBlades }).map((_, i) => {
                                const a = (i * 360) / nBlades;
                                return (
                                  <g key={i} transform={`rotate(${a} ${cx} ${cy})`}>
                                    <path
                                      d={`M ${cx + 10},${cy} Q ${cx + 25},${cy - 10} ${cx + rImp * 0.95},${cy - 6}`}
                                      fill="none"
                                      stroke="#38bdf8"
                                      strokeWidth="3.5"
                                      strokeLinecap="round"
                                    />
                                  </g>
                                );
                              })}
                              {/* Impeller Hub */}
                              <circle cx={cx} cy={cy} r="12" fill="#334155" stroke="#38bdf8" strokeWidth="1.5" />
                            </g>

                            {/* Discharge Flow Arrow */}
                            <g transform="translate(250, 42)">
                              <line x1="0" y1="20" x2="0" y2="-12" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" />
                              <polygon points="0,-18 -4,-8 4,-8" fill="#38bdf8" />
                              <text x="10" y="-2" fill="#38bdf8" fontSize="10" fontWeight="bold" fontFamily="monospace">
                                {flow} m³/h
                              </text>
                            </g>
                          </g>
                        );
                      })()}
                    </svg>

                    <style>{`
                      @keyframes spin { 100% { transform: rotate(360deg); } }
                    `}</style>
                  </div>

                  {/* Impeller Classification Badge */}
                  <div className="mt-3 flex items-center justify-between text-xs bg-[var(--bg-0)] p-2.5 rounded-xl border border-white/5">
                    <span className="text-slate-400 font-medium">{t12(lang, 'Impeller Classification:', 'Çark Tipi Sınıflandırması:')}</span>
                    <span className="font-bold text-cyan-300">
                      {t12(lang, results.impellerTypeEn, results.impellerTypeTr)}
                    </span>
                  </div>
                </div>

                {/* Primary Output Cards Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {/* Hydraulic Power */}
                  <div className="bg-[var(--bg-1)] border border-cyan-500/30 p-4 rounded-2xl shadow-lg">
                    <div className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1.5 mb-2">
                      <Activity size={14} className="text-cyan-400" />
                      {t12(lang, 'Hydraulic Power', 'Hidrolik Güç (P_hyd)')}
                    </div>
                    <div className="text-2xl font-black font-mono text-cyan-300">
                      {unit === 'metric' ?formatEngineeringValue(results.hydPowerKW, precision, false) :formatEngineeringValue(toHP(results.hydPowerKW), precision, false)}
                      <span className="text-xs text-slate-400 font-normal ml-1">{unit === 'metric' ? 'kW' : 'HP'}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono mt-1">P = ρ·g·Q·H</div>
                  </div>

                  {/* Shaft Power */}
                  <div className="bg-[var(--bg-1)] border border-blue-500/30 p-4 rounded-2xl shadow-lg">
                    <div className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1.5 mb-2">
                      <Zap size={14} className="text-blue-400" />
                      {t12(lang, 'Shaft Power (BHP)', 'Mil Gücü (BHP)')}
                    </div>
                    <div className="text-2xl font-black font-mono text-white">
                      {unit === 'metric' ?formatEngineeringValue(results.shaftPowerKW, precision, false) :formatEngineeringValue(toHP(results.shaftPowerKW), precision, false)}
                      <span className="text-xs text-slate-400 font-normal ml-1">{unit === 'metric' ? 'kW' : 'HP'}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono mt-1">P_shaft = P_hyd / η_p</div>
                  </div>

                  {/* Recommended IEC Motor */}
                  <div className="bg-gradient-to-br from-[var(--bg-2)] to-[var(--bg-3)] border border-emerald-500/40 p-4 rounded-2xl shadow-lg">
                    <div className="text-[10px] font-bold text-emerald-300 uppercase flex items-center gap-1.5 mb-2">
                      <CheckCircle2 size={14} className="text-emerald-400" />
                      {t12(lang, 'Rec. IEC Motor', 'Önerilen IEC Motor')}
                    </div>
                    <div className="text-2xl font-black font-mono text-emerald-300">
                      {results.recommendedMotorKW}
                      <span className="text-xs text-slate-300 font-normal ml-1">kW</span>
                    </div>
                    <div className="text-[10px] text-emerald-400/80 font-mono mt-1">
                      {t12(lang, 'Incl. +15% Safety Margin', '%15 Emniyet Marjı Dahil')}
                    </div>
                  </div>

                  {/* Shaft Torque */}
                  <div className="bg-[var(--bg-1)] border border-white/10 p-4 rounded-2xl shadow-lg">
                    <div className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1.5 mb-2">
                      <Gauge size={14} className="text-amber-400" />
                      {t12(lang, 'Shaft Torque (T)', 'Mil Torku (T)')}
                    </div>
                    <div className="text-xl font-black font-mono text-amber-300">
                      {formatEngineeringValue(results.torqueNm, precision, false)}
                      <span className="text-xs text-slate-400 font-normal ml-1">N·m</span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono mt-1">@ {rpm} RPM</div>
                  </div>

                  {/* Electric Power Consumption */}
                  <div className="bg-[var(--bg-1)] border border-white/10 p-4 rounded-2xl shadow-lg">
                    <div className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1.5 mb-2">
                      <Zap size={14} className="text-purple-400" />
                      {t12(lang, 'Grid Electric Input', 'Şebeke Elektrik Gücü')}
                    </div>
                    <div className="text-xl font-black font-mono text-purple-300">
                      {formatEngineeringValue(results.electricPowerKW, precision, false)}
                      <span className="text-xs text-slate-400 font-normal ml-1">kW</span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono mt-1">η_m = {motorEff}%</div>
                  </div>

                  {/* Specific Speed US */}
                  <div className="bg-[var(--bg-1)] border border-white/10 p-4 rounded-2xl shadow-lg">
                    <div className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1.5 mb-2">
                      <RotateCw size={14} className="text-teal-400" />
                      {t12(lang, 'Specific Speed (US)', 'Özgül Hız (US)')}
                    </div>
                    <div className="text-xl font-black font-mono text-teal-300">
                      {Math.round(results.nsUS)}
                      <span className="text-xs text-slate-400 font-normal ml-1">US</span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono mt-1">Ns(Metric) = {formatEngineeringValue(results.nsMetric, precision, false)}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: H-Q PERFORMANCE CURVE & SYSTEM OPERATING POINT (BEP) */}
          {activeTab === 'curve' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Curve Controls */}
              <div className="lg:col-span-4 space-y-4">
                <div className="bg-[var(--bg-1)] border border-white/10 rounded-2xl p-5 space-y-4 shadow-xl">
                  <h3 className="text-xs font-black tracking-wider text-cyan-400 uppercase flex items-center gap-2">
                    <Sliders size={16} /> {t12(lang, 'SYSTEM PIPING LOSSES', 'BORU SİSTEMİ & BASINÇ KAYBI')}
                  </h3>

                  {/* Static Lift Elevation */}
                  <div>
                    <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                      <span>{t12(lang, 'Static Head Lift (H_static)', 'Statik Yükseklik Farkı (H_statik)')}</span>
                      <span className="font-mono text-cyan-300 font-bold">{staticElevation} m</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max={head * 1.5}
                      step="1"
                      value={staticElevation}
                      onChange={(e) => setStaticElevation(Number(e.target.value))}
                      className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[var(--cyan)]"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      {t12(lang, 'Geometric elevation difference between tanks.', 'Emme ve basma rezervuarı arasındaki net dikey kot farkı.')}
                    </p>
                  </div>

                  {/* Friction Loss Factor k */}
                  <div>
                    <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                      <span>{t12(lang, 'Pipe Loss Factor (k)', 'Boru Sürtünme Katsayısı (k)')}</span>
                      <span className="font-mono text-cyan-300 font-bold">{formatEngineeringValue(pipeLossK, precision, false)}</span>
                    </div>
                    <input
                      type="range"
                      min="0.0005"
                      max="0.005"
                      step="0.0001"
                      value={pipeLossK}
                      onChange={(e) => setPipeLossK(Number(e.target.value))}
                      className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[var(--cyan)]"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      {t12(lang, 'Dynamic friction formula: H_f = k · Q²', 'Dinamik sürtünme kaybı formülü: H_kayıp = k · Q²')}
                    </p>
                  </div>

                  {/* Curve Explanation */}
                  <div className="bg-[var(--bg-0)] border border-white/5 rounded-xl p-3 text-xs space-y-2 text-slate-300">
                    <div className="flex items-center gap-2 text-cyan-300 font-bold">
                      <Info size={14} /> {t12(lang, 'Operating Duty Point', 'Çalışma Noktası (Duty Point)')}
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {t12(lang, 'The intersection between pump head curve and system curve represents the actual working condition.', 'Pompanın H-Q eğrisi ile tesisatın Sistem Eğrisinin kesiştiği nokta gerçek debi ve basma yüksekliğidir.')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Interactive Dynamic SVG Curve Chart */}
              <div className="lg:col-span-8 space-y-4">
                <div className="bg-[var(--bg-1)] border border-white/10 rounded-2xl p-5 shadow-2xl">
                  <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                    <h3 className="text-xs font-bold text-slate-300 tracking-wider uppercase flex items-center gap-2">
                      <TrendingUp size={16} className="text-cyan-400" />
                      {t12(lang, 'PUMP HEAD & SYSTEM CHARACTERISTIC CURVE', 'H-Q VE SİSTEM EĞRİSİ GRAFİĞİ')}
                    </h3>
                    <div className="flex items-center gap-4 text-xs font-mono">
                      <span className="flex items-center gap-1.5 text-cyan-400">
                        <span className="w-3 h-0.5 bg-cyan-400 inline-block" /> Pompa H-Q
                      </span>
                      <span className="flex items-center gap-1.5 text-amber-400">
                        <span className="w-3 h-0.5 bg-amber-400 inline-block" /> Sistem Eğrisi
                      </span>
                    </div>
                  </div>

                  {/* SVG Chart Plot */}
                  <div className="h-80 w-full bg-[var(--bg-0)] rounded-xl border border-white/5 p-4 flex items-center justify-center">
                    {(() => {
                      const maxQ = Math.max(200, flow * 1.8);
                      const shutOffH = head * 1.35;
                      const maxH = Math.max(100, shutOffH * 1.2);

                      // Coordinate mapper
                      const chartW = 500;
                      const chartH = 240;
                      const padL = 50;
                      const padB = 40;
                      const padT = 20;
                      const padR = 20;

                      const mapX = (qVal: number) => padL + (qVal / maxQ) * (chartW - padL - padR);
                      const mapY = (hVal: number) => chartH - padB - (hVal / maxH) * (chartH - padT - padB);

                      // Generate Pump Curve Path: H(q) = shutOffH - a * q^2
                      const aPump = (shutOffH - head) / (flow * flow);
                      let pumpPath = '';
                      for (let q = 0; q <= maxQ; q += 5) {
                        const hVal = Math.max(0, shutOffH - aPump * q * q);
                        const x = mapX(q);
                        const y = mapY(hVal);
                        pumpPath += `${q === 0 ? 'M' : 'L'} ${x.toFixed(1)},${y.toFixed(1)} `;
                      }

                      // Generate System Curve Path: H_sys(q) = staticElevation + pipeLossK * q^2
                      let sysPath = '';
                      for (let q = 0; q <= maxQ; q += 5) {
                        const hVal = staticElevation + pipeLossK * q * q;
                        const x = mapX(q);
                        const y = mapY(hVal);
                        sysPath += `${q === 0 ? 'M' : 'L'} ${x.toFixed(1)},${y.toFixed(1)} `;
                      }

                      // Operating point
                      const opX = mapX(flow);
                      const opY = mapY(head);

                      return (
                        <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-full">
                          {/* Grid Lines */}
                          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                            const y = chartH - padB - ratio * (chartH - padT - padB);
                            const hVal = Math.round(ratio * maxH);
                            return (
                              <g key={i}>
                                <line x1={padL} y1={y} x2={chartW - padR} y2={y} stroke="#1e293b" strokeWidth="1" strokeDasharray="2 2" />
                                <text x={padL - 8} y={y + 4} fill="#64748b" fontSize="9" textAnchor="end" fontFamily="monospace">{hVal}m</text>
                              </g>
                            );
                          })}

                          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                            const x = padL + ratio * (chartW - padL - padR);
                            const qVal = Math.round(ratio * maxQ);
                            return (
                              <g key={i}>
                                <line x1={x} y1={padT} x2={x} y2={chartH - padB} stroke="#1e293b" strokeWidth="1" strokeDasharray="2 2" />
                                <text x={x} y={chartH - padB + 16} fill="#64748b" fontSize="9" textAnchor="middle" fontFamily="monospace">{qVal}</text>
                              </g>
                            );
                          })}

                          {/* Axes */}
                          <line x1={padL} y1={padT} x2={padL} y2={chartH - padB} stroke="#475569" strokeWidth="1.5" />
                          <line x1={padL} y1={chartH - padB} x2={chartW - padR} y2={chartH - padB} stroke="#475569" strokeWidth="1.5" />

                          {/* Curves */}
                          <path d={pumpPath} fill="none" stroke="#06b6d4" strokeWidth="2.5" />
                          <path d={sysPath} fill="none" stroke="#f59e0b" strokeWidth="2.5" />

                          {/* Operating Duty Point Marker */}
                          <circle cx={opX} cy={opY} r="6" fill="#00e5ff" stroke="#fff" strokeWidth="2" />

                          {/* Labels */}
                          <text x={opX + 10} y={opY - 10} fill="#fff" fontSize="10" fontWeight="bold" fontFamily="monospace">
                            BEP: ({flow} m³/h, {head} m)
                          </text>
                          <text x={chartW / 2} y={chartH - 8} fill="#94a3b8" fontSize="10" textAnchor="middle">
                            {t12(lang, 'Flow Rate Q (m³/h)', 'Debi Q (m³/h)')}
                          </text>
                          <text x={14} y={chartH / 2} fill="#94a3b8" fontSize="10" transform={`rotate(-90 14 ${chartH / 2})`} textAnchor="middle">
                            {t12(lang, 'Head H (m)', 'Basma Yüksekliği H (m)')}
                          </text>
                        </svg>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: NPSH & CAVITATION RISK ANALYZER */}
          {activeTab === 'npsh' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* NPSH Controls */}
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-[var(--bg-1)] border border-white/10 rounded-2xl p-5 space-y-4 shadow-xl">
                  <h3 className="text-xs font-black tracking-wider text-cyan-400 uppercase flex items-center gap-2">
                    <ShieldAlert size={16} /> {t12(lang, 'SUCTION LINE & NPSH INPUTS', 'EMME HATTI & NPSH PARAMETRELERİ')}
                  </h3>

                  {/* Atmospheric Pressure */}
                  <div>
                    <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                      <span>{t12(lang, 'Atmospheric Pressure (P_atm)', 'Atmosfer Basıncı (P_atm)')}</span>
                      <span className="font-mono text-cyan-300 font-bold">{patm} kPa</span>
                    </div>
                    <input
                      type="range"
                      min="70"
                      max="105"
                      step="0.5"
                      value={patm}
                      onChange={(e) => setPatm(Number(e.target.value))}
                      className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[var(--cyan)]"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                      <span>70 kPa (3000m)</span>
                      <span>101.3 kPa (Deniz Seviyesi)</span>
                    </div>
                  </div>

                  {/* Suction Static Head / Lift */}
                  <div>
                    <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                      <span>{t12(lang, 'Suction Static Level (Z_suction)', 'Emme Seviyesi (Z_emme)')}</span>
                      <span className={`font-mono font-bold ${suctionLift >= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {suctionLift >= 0 ? `+${suctionLift} m (Basınçlı Emme)` : `${suctionLift} m (Emişli)`}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="-6"
                      max="6"
                      step="0.2"
                      value={suctionLift}
                      onChange={(e) => setSuctionLift(Number(e.target.value))}
                      className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[var(--cyan)]"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      {t12(lang, '+ for flooded suction, - for suction lift.', 'Pozitif = Pompa altında su seviyesi yüksek; Negatif = Pompa sudan yukarıda (emiş yapıyor).')}
                    </p>
                  </div>

                  {/* Suction Pipe Friction Loss */}
                  <div>
                    <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                      <span>{t12(lang, 'Suction Pipe Loss (h_f)', 'Emme Borusu Sürtünme Kaybı (h_f)')}</span>
                      <span className="font-mono text-cyan-300 font-bold">{suctionLoss} m</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="3.0"
                      step="0.1"
                      value={suctionLoss}
                      onChange={(e) => setSuctionLoss(Number(e.target.value))}
                      className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[var(--cyan)]"
                    />
                  </div>

                  {/* NPSH Required by Pump */}
                  <div>
                    <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                      <span>{t12(lang, 'Required NPSH (NPSH_r)', 'Gerekli NPSH (NPSH_r)')}</span>
                      <span className="font-mono text-amber-300 font-bold">{npshRequired} m</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="8.0"
                      step="0.1"
                      value={npshRequired}
                      onChange={(e) => setNpshRequired(Number(e.target.value))}
                      className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[var(--cyan)]"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      {t12(lang, 'NPSHr value from manufacturer pump curve.', 'Pompa üretici katalog eğrisinden okunan NPSH değeri.')}
                    </p>
                  </div>
                </div>
              </div>

              {/* NPSH Analysis Output & Cavitation Status */}
              <div className="lg:col-span-7 space-y-6">
                {/* Cavitation Status Banner */}
                <div className={`p-6 rounded-2xl border shadow-2xl transition-all ${
                  results.cavitationStatus === 'safe'
                    ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                    : results.cavitationStatus === 'warning'
                    ? 'bg-amber-950/40 border-amber-500/50 text-amber-200'
                    : 'bg-rose-950/50 border-rose-500/60 text-rose-200'
                }`}>
                  <div className="flex items-center gap-3">
                    {results.cavitationStatus === 'safe' ? (
                      <CheckCircle2 size={32} className="text-emerald-400 shrink-0" />
                    ) : (
                      <ShieldAlert size={32} className={results.cavitationStatus === 'warning' ? 'text-amber-400 shrink-0' : 'text-rose-400 shrink-0'} />
                    )}
                    <div>
                      <h4 className="text-sm font-black tracking-wide uppercase">
                        {t12(lang, results.cavitationTextEn, results.cavitationTextTr)}
                      </h4>
                      <p className="text-xs mt-1 text-slate-300">
                        {t12(
                          lang,
                          `Available NPSH (${formatEngineeringValue(results.npshAvailable, precision, false)} m) is ${results.npshMargin >= 0 ? `+${formatEngineeringValue(results.npshMargin, precision, false)} m above` : `${formatEngineeringValue(results.npshMargin, precision, false)} m BELOW`} NPSHr.`,
                          `Mevcut NPSH (${formatEngineeringValue(results.npshAvailable, precision, false)} m) ${results.npshMargin >= 0 ? `Gereken NPSH'tan ${formatEngineeringValue(results.npshMargin, precision, false)} m daha yüksek.` : `Gereken NPSH'tan ${formatEngineeringValue(Math.abs(results.npshMargin), precision, false)} m DAHA DÜŞÜK!`}`
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Detailed NPSH Breakdown Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div className="bg-[var(--bg-1)] border border-white/10 p-4 rounded-2xl">
                    <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">
                      {t12(lang, 'Available NPSHa', 'Mevcut NPSH (NPSHa)')}
                    </div>
                    <div className="text-2xl font-black font-mono text-cyan-300">
                      {formatEngineeringValue(results.npshAvailable, precision, false)} <span className="text-xs text-slate-400">m</span>
                    </div>
                  </div>

                  <div className="bg-[var(--bg-1)] border border-white/10 p-4 rounded-2xl">
                    <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">
                      {t12(lang, 'Required NPSHr', 'Gerekli NPSH (NPSHr)')}
                    </div>
                    <div className="text-2xl font-black font-mono text-amber-300">
                      {formatEngineeringValue(npshRequired, precision, false)} <span className="text-xs text-slate-400">m</span>
                    </div>
                  </div>

                  <div className="bg-[var(--bg-1)] border border-white/10 p-4 rounded-2xl">
                    <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">
                      {t12(lang, 'Safety Ratio (NPSHa/r)', 'Güvenlik Oranı (NPSHa/NPSHr)')}
                    </div>
                    <div className={`text-2xl font-black font-mono ${results.npshRatio >= 1.2 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {formatEngineeringValue(results.npshRatio, precision, false)}x
                    </div>
                  </div>

                  <div className="bg-[var(--bg-1)] border border-white/10 p-4 rounded-2xl">
                    <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">
                      {t12(lang, 'Atmospheric Head (H_atm)', 'Atmosferik Yükseklik (H_atm)')}
                    </div>
                    <div className="text-lg font-mono font-bold text-slate-200">
                      {formatEngineeringValue(results.headAtm, precision, false)} m
                    </div>
                  </div>

                  <div className="bg-[var(--bg-1)] border border-white/10 p-4 rounded-2xl">
                    <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">
                      {t12(lang, 'Vapor Head (H_vap)', 'Buharlaşma Yüksekliği (H_vap)')}
                    </div>
                    <div className="text-lg font-mono font-bold text-rose-300">
                      {formatEngineeringValue(results.headVap, precision, false)} m
                    </div>
                  </div>

                  <div className="bg-[var(--bg-1)] border border-white/10 p-4 rounded-2xl">
                    <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">
                      {t12(lang, 'Safety Margin (ΔNPSH)', 'Emniyet Marjı (ΔNPSH)')}
                    </div>
                    <div className={`text-lg font-mono font-bold ${results.npshMargin >= 0.5 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {results.npshMargin >= 0 ? `+${formatEngineeringValue(results.npshMargin, precision, false)}` :formatEngineeringValue(results.npshMargin, precision, false)} m
                    </div>
                  </div>
                </div>

                {/* Anti-Cavitation Engineering Recommendations */}
                <div className="bg-[var(--bg-1)] border border-white/5 rounded-2xl p-4 text-xs space-y-2 text-slate-300">
                  <h5 className="font-bold text-cyan-300 flex items-center gap-1.5">
                    <Info size={14} /> {t12(lang, 'Cavitation Prevention Guidelines:', 'Kavitasyonu Önleme Tavsiyeleri:')}
                  </h5>
                  <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-400 leading-relaxed">
                    <li>{t12(lang, 'Increase suction pipe diameter to lower velocity and friction.', 'Emme boru çapını artırarak sürtünme kaybını (h_f) azaltın.')}</li>
                    <li>{t12(lang, 'Mount pump closer to or below liquid level (flooded suction).', 'Pompayı sıvı seviyesine daha yakın veya altına monte edin (Z_emme artışı).')}</li>
                    <li>{t12(lang, 'Higher temperature increases vapor pressure drastically, reducing NPSHa.', 'Sıvı sıcaklığı yükseldiğinde buhar basıncı (P_vap) katlanarak artar, NPSHa düşer.')}</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: AFFINITY LAWS (VFD SPEED & IMPELLER TRIMMING) */}
          {activeTab === 'affinity' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Affinity Controls */}
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-[var(--bg-1)] border border-white/10 rounded-2xl p-5 space-y-4 shadow-xl">
                  <h3 className="text-xs font-black tracking-wider text-cyan-400 uppercase flex items-center gap-2">
                    <RotateCw size={16} /> {t12(lang, 'AFFINITY LAWS (VFD & TRIMMING)', 'BENZETİM (AFFINITY) KANUNLARI')}
                  </h3>

                  {/* VFD Speed Variation */}
                  <div className="p-3 bg-[var(--bg-0)] rounded-xl border border-white/5 space-y-3">
                    <span className="text-xs font-bold text-cyan-300 block">
                      {t12(lang, '1. Speed Variation (VFD)', '1. Hız Değişimi (Frekans Sürücü / VFD)')}
                    </span>
                    <div className="flex justify-between text-xs font-semibold text-slate-300">
                      <span>{t12(lang, 'Target Speed (n_2)', 'Hedef Hız (n_2)')}</span>
                      <span className="font-mono text-cyan-300 font-bold">{targetRpm} RPM</span>
                    </div>
                    <input
                      type="range"
                      min="500"
                      max="3600"
                      step="50"
                      value={targetRpm}
                      onChange={(e) => setTargetRpm(Number(e.target.value))}
                      className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[var(--cyan)]"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                      <span>500 RPM</span>
                      <span>Temel: {rpm} RPM</span>
                      <span>3600 RPM</span>
                    </div>
                  </div>

                  {/* Impeller Diameter Trimming */}
                  <div className="p-3 bg-[var(--bg-0)] rounded-xl border border-white/5 space-y-3">
                    <span className="text-xs font-bold text-amber-300 block">
                      {t12(lang, '2. Impeller Trimming', '2. Çark Tornalama / Kırpma (Trimming)')}
                    </span>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">
                          {t12(lang, 'Original Dia (D_1)', 'Orijinal Çap (D_1)')}
                        </label>
                        <input
                          type="number"
                          value={baseImpellerD}
                          onChange={(e) => setBaseImpellerD(Number(e.target.value))}
                          className="w-full bg-[var(--bg-0)] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-white outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">
                          {t12(lang, 'Trimmed Dia (D_2)', 'Yeni Çap (D_2)')}
                        </label>
                        <input
                          type="number"
                          value={targetImpellerD}
                          onChange={(e) => setTargetImpellerD(Number(e.target.value))}
                          className="w-full bg-[var(--bg-0)] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-white outline-none"
                        />
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      {t12(lang, 'Trimming ratio: ', 'Çark kırpma oranı: %')}{lang === 'tr' ? formatEngineeringValue(((targetImpellerD / baseImpellerD) * 100), precision, false) : `${formatEngineeringValue(((targetImpellerD / baseImpellerD) * 100), precision, false)}%`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Affinity Law Comparison Table */}
              <div className="lg:col-span-7 space-y-4">
                <div className="bg-[var(--bg-1)] border border-white/10 rounded-2xl p-5 shadow-2xl">
                  <h3 className="text-xs font-bold text-slate-300 tracking-wider uppercase mb-4 flex items-center gap-2">
                    <Activity size={16} className="text-cyan-400" />
                    {t12(lang, 'ORIGINAL VS NEW OPERATING POINT COMPARISON', 'ORİJİNAL VS YENİ ÇALIŞMA NOKTASI KARŞILAŞTIRMASI')}
                  </h3>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="border-b border-white/10 text-slate-400 font-bold uppercase tracking-wider">
                          <th className="pb-3">{t12(lang, 'Parameter', 'Parametre')}</th>
                          <th className="pb-3">{t12(lang, 'Base Value', 'Orijinal Değer')}</th>
                          <th className="pb-3 text-cyan-400">{t12(lang, 'New Value', 'Yeni Değer (Affinity)')}</th>
                          <th className="pb-3 text-right">{t12(lang, 'Change (Δ)', 'Fark (Δ)')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 font-mono">
                        <tr>
                          <td className="py-3 font-sans text-slate-300 font-semibold">{t12(lang, 'Flow Rate (Q)', 'Debi (Q)')}</td>
                          <td className="py-3 text-slate-400">{flow} m³/h</td>
                          <td className="py-3 text-cyan-300 font-bold">{formatEngineeringValue(results.affFlow, precision, false)} m³/h</td>
                          <td className={`py-3 text-right font-bold ${results.affFlow >= flow ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {results.affFlow >= flow ? '+' : ''}{formatEngineeringValue((((results.affFlow - flow) / flow) * 100), precision, false)}%
                          </td>
                        </tr>
                        <tr>
                          <td className="py-3 font-sans text-slate-300 font-semibold">{t12(lang, 'Total Head (H)', 'Basma Yüksekliği (H)')}</td>
                          <td className="py-3 text-slate-400">{head} m</td>
                          <td className="py-3 text-cyan-300 font-bold">{formatEngineeringValue(results.affHead, precision, false)} m</td>
                          <td className={`py-3 text-right font-bold ${results.affHead >= head ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {results.affHead >= head ? '+' : ''}{formatEngineeringValue((((results.affHead - head) / head) * 100), precision, false)}%
                          </td>
                        </tr>
                        <tr>
                          <td className="py-3 font-sans text-slate-300 font-semibold">{t12(lang, 'Shaft Power (BHP)', 'Mil Gücü (P_shaft)')}</td>
                          <td className="py-3 text-slate-400">{formatEngineeringValue(results.shaftPowerKW, precision, false)} kW</td>
                          <td className="py-3 text-cyan-300 font-bold">{formatEngineeringValue(results.affPower, precision, false)} kW</td>
                          <td className={`py-3 text-right font-bold ${results.affPower >= results.shaftPowerKW ? 'text-rose-400' : 'text-emerald-400'}`}>
                            {results.affPower >= results.shaftPowerKW ? '+' : ''}{formatEngineeringValue((((results.affPower - results.shaftPowerKW) / results.shaftPowerKW) * 100), precision, false)}%
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Affinity Law Mathematical Formula Box */}
                  <div className="mt-6 p-4 bg-[var(--bg-0)] rounded-xl border border-white/5 font-mono text-[11px] text-slate-300 space-y-1.5">
                    <div className="text-cyan-400 font-bold font-sans text-xs mb-1">
                      {t12(lang, 'Affinity Relationships:', 'Benzetim Formülleri:')}
                    </div>
                    <div>Q₂ = Q₁ · (n₂/n₁) · (D₂/D₁)</div>
                    <div>H₂ = H₁ · (n₂/n₁)² · (D₂/D₁)²</div>
                    <div>P₂ = P₁ · (n₂/n₁)³ · (D₂/D₁)³  <span className="text-emerald-400 font-sans">({t12(lang, 'Cubic power drop = huge energy saving!', 'Hız düşünce güç kübik olarak düşer - büyük enerji tasarrufu!')})</span></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: ENERGY & LIFECYCLE COST (LCC / OPEX) */}
          {activeTab === 'energy' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Cost Inputs */}
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-[var(--bg-1)] border border-white/10 rounded-2xl p-5 space-y-4 shadow-xl">
                  <h3 className="text-xs font-black tracking-wider text-cyan-400 uppercase flex items-center gap-2">
                    <DollarSign size={16} /> {t12(lang, 'OPEX & ENERGY COST INPUTS', 'İŞLETME & ENERJİ MALİYET GİRİŞLERİ')}
                  </h3>

                  {/* Operating Hours per Year */}
                  <div>
                    <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                      <span>{t12(lang, 'Annual Operating Hours', 'Yıllık Çalışma Süresi')}</span>
                      <span className="font-mono text-cyan-300 font-bold">{operatingHours} {t12(lang, 'hrs/yr', 'saat/yıl')}</span>
                    </div>
                    <input
                      type="range"
                      min="1000"
                      max="8760"
                      step="250"
                      value={operatingHours}
                      onChange={(e) => setOperatingHours(Number(e.target.value))}
                      className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[var(--cyan)]"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                      <span>2000 h (Tek Vardiya)</span>
                      <span>8760 h (7/24 Kesintisiz)</span>
                    </div>
                  </div>

                  {/* Electricity Unit Cost */}
                  <div>
                    <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                      <span>{t12(lang, 'Electricity Unit Price ($/kWh)', 'Elektrik Birim Fiyatı ($/kWh veya TL/kWh)')}</span>
                      <span className="font-mono text-cyan-300 font-bold">${formatEngineeringValue(kwhCost, precision, false)}</span>
                    </div>
                    <input
                      type="range"
                      min="0.05"
                      max="0.40"
                      step="0.01"
                      value={kwhCost}
                      onChange={(e) => setKwhCost(Number(e.target.value))}
                      className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[var(--cyan)]"
                    />
                  </div>

                  {/* Carbon Factor */}
                  <div>
                    <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                      <span>{t12(lang, 'Grid Carbon Factor', 'Şebeke Karbon Emisyon Faktörü')}</span>
                      <span className="font-mono text-cyan-300 font-bold">{carbonFactor} kg CO₂/kWh</span>
                    </div>
                    <input
                      type="range"
                      min="0.2"
                      max="0.9"
                      step="0.05"
                      value={carbonFactor}
                      onChange={(e) => setCarbonFactor(Number(e.target.value))}
                      className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[var(--cyan)]"
                    />
                  </div>
                </div>
              </div>

              {/* Cost & Carbon Output Cards */}
              <div className="lg:col-span-7 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Annual Electricity Cost */}
                  <div className="bg-gradient-to-br from-[var(--bg-3)] to-[#123163] border border-cyan-500/40 p-5 rounded-2xl shadow-xl">
                    <div className="text-xs font-bold text-cyan-300 uppercase mb-2 flex items-center gap-2">
                      <DollarSign size={16} /> {t12(lang, 'ANNUAL ELECTRICITY COST', 'YILLIK ENERJİ MALİYETİ')}
                    </div>
                    <div className="text-3xl font-black font-mono text-white">
                      ${Math.round(results.annualEnergyCost).toLocaleString()}
                      <span className="text-xs text-slate-300 font-normal ml-1">/ {t12(lang, 'yr', 'yıl')}</span>
                    </div>
                    <p className="text-[11px] text-cyan-300/80 font-mono mt-2">
                      {Math.round(results.annualKWh).toLocaleString()} kWh / {t12(lang, 'year', 'yıl elektrik tüketimi')}
                    </p>
                  </div>

                  {/* 10-Year Lifecycle OPEX */}
                  <div className="bg-[var(--bg-1)] border border-white/10 p-5 rounded-2xl shadow-xl">
                    <div className="text-xs font-bold text-slate-400 uppercase mb-2 flex items-center gap-2">
                      <Layers size={16} className="text-blue-400" /> {t12(lang, '10-YEAR LIFECYCLE OPEX', '10 YILLIK İŞLETME GİDERİ (LCC)')}
                    </div>
                    <div className="text-3xl font-black font-mono text-cyan-300">
                      ${Math.round(results.tenYearOpex).toLocaleString()}
                    </div>
                    <p className="text-[11px] text-slate-500 font-mono mt-2">
                      {t12(lang, 'Electricity represents ~85% of total life cost.', 'Pompa satın alma bedelinin ~%85’i elektriğe harcanır.')}
                    </p>
                  </div>

                  {/* Annual Carbon Footprint */}
                  <div className="bg-[var(--bg-1)] border border-white/10 p-5 rounded-2xl shadow-xl">
                    <div className="text-xs font-bold text-slate-400 uppercase mb-2 flex items-center gap-2">
                      <Flame size={16} className="text-amber-400" /> {t12(lang, 'ANNUAL CO₂ EMISSIONS', 'YILLIK KARBON AYAK İZİ')}
                    </div>
                    <div className="text-3xl font-black font-mono text-amber-300">
                      {formatEngineeringValue(results.annualCarbonTons, precision, false)}
                      <span className="text-xs text-slate-400 font-normal ml-1">ton CO₂/yıl</span>
                    </div>
                  </div>

                  {/* Efficiency Savings Potential */}
                  <div className="bg-[var(--bg-1)] border border-white/10 p-5 rounded-2xl shadow-xl">
                    <div className="text-xs font-bold text-slate-400 uppercase mb-2 flex items-center gap-2">
                      <Sparkles size={16} className="text-emerald-400" /> {t12(lang, '+5% EFFICIENCY SAVINGS', '%5 VERİM ARTIŞININ KAZANCI')}
                    </div>
                    <div className="text-3xl font-black font-mono text-emerald-400">
                      +${Math.round(results.annualEnergyCost * 0.05).toLocaleString()}
                      <span className="text-xs text-slate-400 font-normal ml-1">/ {t12(lang, 'yr', 'yıl tasarruf')}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default PumpsModule;
