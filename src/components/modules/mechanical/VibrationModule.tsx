'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Waves, Settings, Activity, ShieldAlert, CheckCircle2, 
  AlertTriangle, Gauge, Zap, Disc, ArrowRight, Info
} from 'lucide-react';
import { useGlobalPrecision, formatEngineeringValue } from '@/components/calculator-kit/precisionUtils';
import { useI18nStore } from '@/store/i18nStore';
import { t12 } from '@/locales/t12';

// -------------------------------------------------------------
// ISO 10816-1 Machinery Vibration Severity Standard Limits
// Velocity RMS (mm/s) boundaries [Zone A/B, Zone B/C, Zone C/D]
// -------------------------------------------------------------
interface MachineClassConfig {
  id: string;
  nameEn: string;
  nameTr: string;
  descEn: string;
  descTr: string;
  limits: [number, number, number]; // [A/B, B/C, C/D] in mm/s RMS
}

const ISO_10816_CLASSES: MachineClassConfig[] = [
  {
    id: 'class1',
    nameEn: 'Class I: Small Machines (≤ 15 kW)',
    nameTr: 'Sınıf I: Küçük Makineler (≤ 15 kW)',
    descEn: 'Electric motors, small pumps, and blowers up to 15 kW',
    descTr: '15 kW güce kadar küçük elektrik motorları, pompalar ve fanlar',
    limits: [0.71, 1.80, 4.50],
  },
  {
    id: 'class2',
    nameEn: 'Class II: Medium Machines (15 - 75 kW)',
    nameTr: 'Sınıf II: Orta Boy Makineler (15 - 75 kW)',
    descEn: 'Medium-sized motors, pumps & fans or engines up to 300 kW on rigid base',
    descTr: '15-75 kW motorlar, pompalar veya rijit şasede 300 kW güce kadar makineler',
    limits: [1.12, 2.80, 7.10],
  },
  {
    id: 'class3',
    nameEn: 'Class III: Large Rigid Machinery (> 75 kW)',
    nameTr: 'Sınıf III: Büyük Rijit Makineler (> 75 kW)',
    descEn: 'Heavy rotating plant on massive concrete / rigid foundations',
    descTr: 'Ağır beton/rijit temele sabitlenmiş büyük endüstriyel döner makineler',
    limits: [1.80, 4.50, 11.20],
  },
  {
    id: 'class4',
    nameEn: 'Class IV: Large Flexible Machinery (> 75 kW)',
    nameTr: 'Sınıf IV: Büyük Esnek Makineler (> 75 kW)',
    descEn: 'Gas turbines, turbogenerators, lightweight steel structures',
    descTr: 'Gaz türbinleri, turbojeneratörler, hafif çelik esnek şaseli makineler',
    limits: [2.80, 7.10, 18.00],
  },
];

// -------------------------------------------------------------
// ISO 1940-1 Rotor Balance Quality Grades
// G value represents permissible product e_per * omega (mm/s)
// -------------------------------------------------------------
interface BalanceGrade {
  grade: number;
  label: string;
  typicalAppEn: string;
  typicalAppTr: string;
}

const ISO_1940_GRADES: BalanceGrade[] = [
  { grade: 0.4, label: 'G 0.4', typicalAppEn: 'Precision spindles, gyroscopes', typicalAppTr: 'Hassas taşlama milleri, jiroskoplar' },
  { grade: 1.0, label: 'G 1.0', typicalAppEn: 'Small electric armatures, tape drives', typicalAppTr: 'Küçük elektrik armatürleri, yüksek devirli diskler' },
  { grade: 2.5, label: 'G 2.5', typicalAppEn: 'Gas & steam turbines, turbo-compressors', typicalAppTr: 'Gaz ve buhar türbinleri, turbokompresörler' },
  { grade: 6.3, label: 'G 6.3', typicalAppEn: 'General machinery, fans, pumps, process rolls', typicalAppTr: 'Genel endüstriyel makineler, fanlar, pompalar' },
  { grade: 16.0, label: 'G 16', typicalAppEn: 'Agricultural machinery, propeller shafts', typicalAppTr: 'Tarım makineleri, şaftlar, araba tekerlekleri' },
];

export default function VibrationModule() {
  const precision = useGlobalPrecision();
  const language = useI18nStore((s) => s.language);
  const [activeTab, setActiveTab] = useState<'sdof' | 'iso10816' | 'rotor'>('sdof');

  // -------------------------------------------------------------
  // Tab 1: SDOF Inputs
  // -------------------------------------------------------------
  const [mass, setMass] = useState<number>(120); // kg
  const [stiffness, setStiffness] = useState<number>(65000); // N/m
  const [dampingRatio, setDampingRatio] = useState<number>(0.06); // zeta
  const [excitationFreq, setExcitationFreq] = useState<number>(15); // Hz
  const [excitationForce, setExcitationForce] = useState<number>(500); // N

  // -------------------------------------------------------------
  // Tab 2: ISO 10816 Inputs
  // -------------------------------------------------------------
  const [machineClassId, setMachineClassId] = useState<string>('class2');
  const [vibrationRms, setVibrationRms] = useState<number>(2.4); // mm/s RMS

  // -------------------------------------------------------------
  // Tab 3: Jeffcott Rotor Inputs
  // -------------------------------------------------------------
  const [rotorMass, setRotorMass] = useState<number>(45); // kg
  const [shaftStiffness, setShaftStiffness] = useState<number>(180000); // N/m
  const [operatingRpm, setOperatingRpm] = useState<number>(3000); // RPM
  const [balanceGrade, setBalanceGrade] = useState<number>(2.5); // G 2.5

  // -------------------------------------------------------------
  // Calculations: SDOF Damped Vibration
  // -------------------------------------------------------------
  const sdofResults = useMemo(() => {
    const m = Math.max(0.1, mass);
    const k = Math.max(1, stiffness);
    const zeta = Math.max(0.001, dampingRatio);
    const f = Math.max(0.1, excitationFreq);

    // Natural circular frequency & cyclic frequency
    const omega_n = Math.sqrt(k / m); // rad/s
    const fn = omega_n / (2 * Math.PI); // Hz
    const criticalDampingCc = 2 * Math.sqrt(k * m); // N·s/m
    const dampingCoeffC = zeta * criticalDampingCc; // N·s/m

    // Frequency ratio r = f / fn
    const r = f / fn;

    // Transmissibility: Tr = sqrt( (1 + (2*zeta*r)^2) / ((1 - r^2)^2 + (2*zeta*r)^2) )
    const num = 1 + Math.pow(2 * zeta * r, 2);
    const den = Math.pow(1 - Math.pow(r, 2), 2) + Math.pow(2 * zeta * r, 2);
    const transmissibility = Math.sqrt(num / den);

    // Dynamic Transmitted Force to foundation
    const transmittedForceN = excitationForce * transmissibility;

    // Phase angle phi (radians to deg)
    const phiRad = Math.atan2(2 * zeta * r, 1 - Math.pow(r, 2));
    const phiDeg = (phiRad * 180) / Math.PI;

    // Isolation Efficiency
    const isIsolated = r > Math.SQRT2; // r > 1.414
    const isolationEfficiency = isIsolated ? Math.max(0, (1 - transmissibility) * 100) : 0;
    const isResonance = r >= 0.8 && r <= 1.2;

    // Generate response curve data
    const curvePoints: { rVal: number; trVal: number }[] = [];
    for (let rVal = 0.1; rVal <= 3.5; rVal += 0.1) {
      const n = 1 + Math.pow(2 * zeta * rVal, 2);
      const d = Math.pow(1 - Math.pow(rVal, 2), 2) + Math.pow(2 * zeta * rVal, 2);
      const trVal = Math.min(8, Math.sqrt(n / d));
      curvePoints.push({ rVal, trVal });
    }

    return {
      omega_n,
      fn,
      criticalDampingCc,
      dampingCoeffC,
      r,
      transmissibility,
      transmittedForceN,
      phiDeg,
      isIsolated,
      isolationEfficiency,
      isResonance,
      curvePoints,
    };
  }, [mass, stiffness, dampingRatio, excitationFreq, excitationForce]);

  // -------------------------------------------------------------
  // Calculations: ISO 10816 Severity Classification
  // -------------------------------------------------------------
  const isoSeverity = useMemo(() => {
    const selectedClass = ISO_10816_CLASSES.find((c) => c.id === machineClassId) || ISO_10816_CLASSES[1];
    const [limAB, limBC, limCD] = selectedClass.limits;
    const v = vibrationRms;

    let zone: 'A' | 'B' | 'C' | 'D';
    let zoneTitleEn: string;
    let zoneTitleTr: string;
    let zoneDescEn: string;
    let zoneDescTr: string;
    let zoneColor: string;

    if (v <= limAB) {
      zone = 'A';
      zoneTitleEn = 'Zone A — Good (New Commissioning)';
      zoneTitleTr = 'Bölge A — İyi (Yeni Devreye Alınmış)';
      zoneDescEn = 'Vibration within this zone is typical for newly commissioned machinery in optimal alignment and balance.';
      zoneDescTr = 'Bu bölgedeki titreşim, ideal balans ve ayardaki yeni devreye alınan makineler için geçerlidir.';
      zoneColor = '#10b981';
    } else if (v <= limBC) {
      zone = 'B';
      zoneTitleEn = 'Zone B — Acceptable (Unrestricted Operation)';
      zoneTitleTr = 'Bölge B — Kabul Edilebilir (Kısıtlamasız Çalışma)';
      zoneDescEn = 'Machines with vibration in this zone are normally considered acceptable for unrestricted long-term operation.';
      zoneDescTr = 'Makineler bu bölgede kısıtlama olmaksızın uzun süreli güvenle çalıştırılabilir.';
      zoneColor = '#3b82f6';
    } else if (v <= limCD) {
      zone = 'C';
      zoneTitleEn = 'Zone C — Unsatisfactory (Alert / Caution)';
      zoneTitleTr = 'Bölge C — Yetersiz (İkaz / Bakım Gerekli)';
      zoneDescEn = 'Vibration is unsatisfactory for continuous operation. Machine may operate for limited period until remedial action.';
      zoneDescTr = 'Sürekli çalışma için yetersizdir. Düzeltici bakım yapılana kadar yalnızca sınırlı süre çalıştırılabilir.';
      zoneColor = '#f59e0b';
    } else {
      zone = 'D';
      zoneTitleEn = 'Zone D — Dangerous (Shutdown / Trip Limit)';
      zoneTitleTr = 'Bölge D — Tehlikeli (Acil Duruş / Hasar Riski)';
      zoneDescEn = 'Vibration values in this zone are considered of sufficient severity to cause structural damage. Immediate shutdown required.';
      zoneDescTr = 'Titreşim seviyesi yapısal hasara yol açacak boyuttadır. Acil duruş ve müdahale zorunludur.';
      zoneColor = '#ef4444';
    }

    return {
      selectedClass,
      zone,
      zoneTitle: language === 'tr' ? zoneTitleTr : zoneTitleEn,
      zoneDesc: language === 'tr' ? zoneDescTr : zoneDescEn,
      zoneColor,
      limAB,
      limBC,
      limCD,
    };
  }, [machineClassId, vibrationRms, language]);

  // -------------------------------------------------------------
  // Calculations: Jeffcott Rotor Balancing (ISO 1940-1)
  // -------------------------------------------------------------
  const rotorResults = useMemo(() => {
    const M = Math.max(0.1, rotorMass);
    const K = Math.max(1, shaftStiffness);
    const rpm = Math.max(1, operatingRpm);
    const G = balanceGrade;

    // Critical speed: omega_cr = sqrt(K/M), Nc = (60 / 2pi) * omega_cr
    const omega_cr = Math.sqrt(K / M); // rad/s
    const criticalSpeedRpm = (omega_cr * 60) / (2 * Math.PI); // RPM
    const operatingOmega = (rpm * 2 * Math.PI) / 60; // rad/s

    // Speed ratio: Omega / Omega_cr
    const speedRatio = rpm / criticalSpeedRpm;
    const isSubcritical = speedRatio < 0.85;
    const isResonantCritical = speedRatio >= 0.85 && speedRatio <= 1.15;
    const isSupercritical = speedRatio > 1.15;

    // ISO 1940-1 Permissible Specific Residual Unbalance: e_per = (1000 * G) / operatingOmega (in micrometers or g*mm/kg)
    const e_per_um = (1000 * G) / operatingOmega;
    // Permissible residual unbalance U_per = e_per * M (g*mm)
    const u_per_g_mm = e_per_um * M;

    // Dynamic unbalance centrifugal force at operating speed: F_unb = M * (e_per in meters) * omega^2
    const unbalanceForceN = M * (e_per_um * 1e-6) * Math.pow(operatingOmega, 2);

    return {
      omega_cr,
      criticalSpeedRpm,
      operatingOmega,
      speedRatio,
      isSubcritical,
      isResonantCritical,
      isSupercritical,
      e_per_um,
      u_per_g_mm,
      unbalanceForceN,
    };
  }, [rotorMass, shaftStiffness, operatingRpm, balanceGrade]);

  return (
    <div className="flex flex-col h-full w-full bg-[var(--bg-0)] text-slate-100 overflow-hidden select-none">
      {/* Top Banner / Suite Navigation */}
      <div className="shrink-0 border-b border-[var(--line)] bg-[var(--bg-1)] px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-purple-950/40 border border-purple-500/40 text-purple-400">
            <Waves className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black tracking-wide text-white uppercase">
                {t12(language, 'Vibration & Dynamics Suite', 'Titreşim & Dinamik Analiz Paketi')}
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-950/60 text-purple-400 border border-purple-800">
                ISO 10816 / ISO 1940-1 / DIN 45672
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              {t12(
                language,
                'SDOF isolation transmissibility, machinery vibration severity standards & Jeffcott rotor unbalance',
                'SDOF izolasyon geçirgenliği, makine titreşim şiddeti standartları ve Jeffcott rotor balansı'
              )}
            </p>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex bg-[var(--bg-2)] p-1 rounded-lg border border-[var(--line)] gap-1">
          <button
            onClick={() => setActiveTab('sdof')}
            className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'sdof'
                ? 'bg-[var(--cyan)] text-[var(--accent-ink)] shadow-md font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            {t12(language, 'SDOF Isolation (Tr)', 'SDOF İzolasyon (Tr)')}
          </button>
          <button
            onClick={() => setActiveTab('iso10816')}
            className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'iso10816'
                ? 'bg-[var(--cyan)] text-[var(--accent-ink)] shadow-md font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Gauge className="w-3.5 h-3.5" />
            {t12(language, 'ISO 10816 Severity', 'ISO 10816 Şiddet')}
          </button>
          <button
            onClick={() => setActiveTab('rotor')}
            className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'rotor'
                ? 'bg-[var(--cyan)] text-[var(--accent-ink)] shadow-md font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Disc className="w-3.5 h-3.5" />
            {t12(language, 'Rotor Unbalance & Critical Speed', 'Rotor Balansı & Kritik Hız')}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
        {/* ========================================================= */}
        {/* TAB 1: SDOF DAMPED VIBRATION & ISOLATION                 */}
        {/* ========================================================= */}
        {activeTab === 'sdof' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl mx-auto">
            {/* Left Inputs */}
            <div className="lg:col-span-4 space-y-5">
              <div className="bg-[var(--bg-1)] border border-[var(--line)] rounded-xl p-5 shadow-lg">
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-[var(--line)] text-purple-400">
                  <Settings className="w-4 h-4" />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider">
                    {t12(language, 'SDOF Mechanical Parameters', 'Tek Serbestlik Derecesi Parametreleri')}
                  </span>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-slate-400 font-mono block mb-1">
                      {t12(language, 'System Mass (m, kg)', 'Sistem Kütlesi (m, kg)')}
                    </label>
                    <input
                      type="number"
                      step={5}
                      min={1}
                      value={mass}
                      onChange={(e) => setMass(Number(e.target.value))}
                      className="w-full bg-[var(--bg-2)] border border-[var(--line)] rounded px-3 py-1.5 text-xs font-mono text-white outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 font-mono block mb-1">
                      {t12(language, 'Total Isolator Stiffness (k, N/m)', 'Toplam İzolasyon Yay Rijitliği (k, N/m)')}
                    </label>
                    <input
                      type="number"
                      step={5000}
                      min={100}
                      value={stiffness}
                      onChange={(e) => setStiffness(Number(e.target.value))}
                      className="w-full bg-[var(--bg-2)] border border-[var(--line)] rounded px-3 py-1.5 text-xs font-mono text-white outline-none focus:border-purple-500"
                    />
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                      {(stiffness / 1000).toFixed(2)} N/mm ({(stiffness / 9806.65).toFixed(2)} kgf/mm)
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400">{t12(language, 'Damping Ratio (ζ = c/cc)', 'Sönüm Oranı (ζ = c/cc)')}</span>
                      <span className="font-mono text-purple-400 font-bold">{dampingRatio.toFixed(3)}</span>
                    </div>
                    <input
                      type="range"
                      min={0.01}
                      max={0.5}
                      step={0.01}
                      value={dampingRatio}
                      onChange={(e) => setDampingRatio(Number(e.target.value))}
                      className="w-full accent-[var(--cyan)] bg-[var(--bg-3)]"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-0.5">
                      <span>0.01 (Steel spring)</span>
                      <span>0.05-0.10 (Rubber pad)</span>
                      <span>0.50 (Hydraulic)</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 font-mono block mb-1">
                      {t12(language, 'Excitation Frequency (f, Hz)', 'Tahrik Frekansı (f, Hz)')}
                    </label>
                    <input
                      type="number"
                      step={1}
                      min={1}
                      value={excitationFreq}
                      onChange={(e) => setExcitationFreq(Number(e.target.value))}
                      className="w-full bg-[var(--bg-2)] border border-[var(--line)] rounded px-3 py-1.5 text-xs font-mono text-white outline-none focus:border-purple-500"
                    />
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                      Equivalent Speed: {(excitationFreq * 60).toLocaleString()} RPM
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 font-mono block mb-1">
                      {t12(language, 'Dynamic Excitation Force (F0, N)', 'Dinamik Tahrik Kuvveti (F0, N)')}
                    </label>
                    <input
                      type="number"
                      step={50}
                      min={1}
                      value={excitationForce}
                      onChange={(e) => setExcitationForce(Number(e.target.value))}
                      className="w-full bg-[var(--bg-2)] border border-[var(--line)] rounded px-3 py-1.5 text-xs font-mono text-white outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Telemetry */}
            <div className="lg:col-span-8 space-y-5">
              {/* SDOF Primary KPI Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-[var(--bg-1)] border border-[var(--line)]">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">{t12(language, 'Natural Frequency (fn)', 'Doğal Frekans (fn)')}</div>
                  <div className="text-2xl font-mono font-black text-cyan-400 mt-1">
                    {sdofResults.fn.toFixed(2)} <span className="text-xs font-sans text-cyan-500/70">Hz</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">{sdofResults.omega_n.toFixed(1)} rad/s ({(sdofResults.fn * 60).toFixed(0)} RPM)</div>
                </div>

                <div className="p-4 rounded-xl bg-[var(--bg-1)] border border-[var(--line)]">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">{t12(language, 'Frequency Ratio (r = f/fn)', 'Frekans Oranı (r = f/fn)')}</div>
                  <div className={`text-2xl font-mono font-black mt-1 ${sdofResults.isResonance ? 'text-rose-400' : 'text-purple-400'}`}>
                    r = {sdofResults.r.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    {sdofResults.r > Math.SQRT2
                      ? t12(language, 'Isolation Zone (r > √2)', 'İzolasyon Bölgesi (r > √2)')
                      : sdofResults.isResonance
                      ? t12(language, 'Resonant Hazard (r ≈ 1)', 'Rezonans Tehlikesi (r ≈ 1)')
                      : t12(language, 'Rigid Sub-Resonant', 'Rijit Bölge (r < 1)')}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[var(--bg-1)] border border-[var(--line)]">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">{t12(language, 'Transmissibility (Tr)', 'Geçirgenlik Oranı (Tr)')}</div>
                  <div className={`text-2xl font-mono font-black mt-1 ${sdofResults.transmissibility > 1 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {sdofResults.transmissibility.toFixed(3)}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    {sdofResults.isIsolated ? t12(language, 'Attenuated (Tr < 1)', 'Sönümlendi (Tr < 1)') : t12(language, 'Amplified (Tr > 1)', 'Büyütüldü (Tr > 1)')}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[var(--bg-1)] border border-[var(--line)]">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">{t12(language, 'Isolation Efficiency', 'İzolasyon Verimi')}</div>
                  <div className="text-2xl font-mono font-black text-emerald-400 mt-1">
                    {sdofResults.isolationEfficiency.toFixed(1)}%
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    FT = {sdofResults.transmittedForceN.toFixed(1)} N ({t12(language, 'to foundation', 'temele iletilen')})
                  </div>
                </div>
              </div>

              {/* Resonance Warning Box */}
              {sdofResults.isResonance && (
                <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/50 flex items-center gap-3 text-rose-300">
                  <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider">
                      {t12(language, 'RESONANCE HAZARD DETECTED (0.80 ≤ r ≤ 1.20)', 'REZONANS TEHLİKESİ ALGILANDI (0.80 ≤ r ≤ 1.20)')}
                    </div>
                    <div className="text-[11px] text-rose-400/80">
                      {t12(
                        language,
                        `Operating frequency (${excitationFreq} Hz) is within resonance band of natural frequency (${sdofResults.fn.toFixed(1)} Hz). Massive force amplification occurs (Tr = ${sdofResults.transmissibility.toFixed(2)}). Modify spring stiffness or install heavy viscous dampers immediately.`,
                        `Çalışma frekansı (${excitationFreq} Hz), doğal frekansın (${sdofResults.fn.toFixed(1)} Hz) rezonans bandında yer almaktadır. Şiddetli kuvvet büyütmesi oluşur (Tr = ${sdofResults.transmissibility.toFixed(2)}). Yay rijitliğini değiştirin veya viskoz sönümleyici ekleyin.`
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Dynamic Transmissibility Curve Visualization */}
              <div className="p-5 rounded-xl bg-[var(--bg-1)] border border-[var(--line)]">
                <div className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider mb-4 flex justify-between items-center">
                  <span>{t12(language, 'Transmissibility Resonance Curve [Tr vs Frequency Ratio r]', 'Geçirgenlik Rezonans Eğrisi [Tr - Frekans Oranı r]')}</span>
                  <span className="text-[10px] text-purple-400 font-mono">DIN 45672 Standard Solution</span>
                </div>

                <div className="relative h-60 w-full bg-[var(--bg-0)] rounded-lg border border-[var(--line)] p-4 flex items-center justify-center">
                  <svg className="w-full h-full" viewBox="0 0 500 200" preserveAspectRatio="none">
                    {/* Horizontal Tr=1.0 line */}
                    <line x1="50" y1="130" x2="480" y2="130" stroke="#374151" strokeDasharray="3 3" />
                    <text x="15" y="134" fill="#9ca3af" fontSize="10" fontFamily="monospace">Tr = 1</text>

                    {/* Vertical r = sqrt(2) line (Isolation Threshold) */}
                    {(() => {
                      const xIso = 50 + (Math.SQRT2 / 3.5) * 430;
                      return (
                        <g>
                          <line x1={xIso} y1="20" x2={xIso} y2="180" stroke="#10b981" strokeDasharray="4 4" opacity="0.6" />
                          <text x={xIso - 15} y="195" fill="#10b981" fontSize="10" fontFamily="monospace">r = √2</text>
                        </g>
                      );
                    })()}

                    {/* Resonance Curve polyline */}
                    {(() => {
                      const pts = sdofResults.curvePoints.map((pt) => {
                        const x = 50 + (pt.rVal / 3.5) * 430;
                        const y = 180 - (Math.min(pt.trVal, 6) / 6) * 160;
                        return `${x},${y}`;
                      });
                      return (
                        <polyline
                          fill="none"
                          stroke="#a855f7"
                          strokeWidth="2.5"
                          points={pts.join(' ')}
                        />
                      );
                    })()}

                    {/* Current Operating Point Marker */}
                    {(() => {
                      const curX = 50 + (Math.min(sdofResults.r, 3.5) / 3.5) * 430;
                      const curY = 180 - (Math.min(sdofResults.transmissibility, 6) / 6) * 160;
                      return (
                        <g>
                          <circle cx={curX} cy={curY} r="6" fill={sdofResults.isResonance ? '#ef4444' : sdofResults.isIsolated ? '#10b981' : '#f59e0b'} stroke="#fff" strokeWidth="2" />
                          <line x1={curX} y1={curY} x2={curX} y2="180" stroke="#fff" strokeDasharray="2 2" opacity="0.4" />
                        </g>
                      );
                    })()}
                  </svg>

                  <div className="absolute top-2 right-4 text-[10px] font-mono text-purple-400">
                    ζ = {dampingRatio.toFixed(2)} | Tr(peak) ≈ {(1 / (2 * dampingRatio)).toFixed(1)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: ISO 10816 MACHINERY VIBRATION SEVERITY            */}
        {/* ========================================================= */}
        {activeTab === 'iso10816' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl mx-auto">
            {/* Left Inputs */}
            <div className="lg:col-span-4 space-y-5">
              <div className="bg-[var(--bg-1)] border border-[var(--line)] rounded-xl p-5 shadow-lg">
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-[var(--line)] text-purple-400">
                  <Gauge className="w-4 h-4" />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider">
                    {t12(language, 'Machine Class Selection', 'Makine Sınıfı Seçimi')}
                  </span>
                </div>

                <div className="space-y-3">
                  {ISO_10816_CLASSES.map((cls) => (
                    <button
                      key={cls.id}
                      onClick={() => setMachineClassId(cls.id)}
                      className={`w-full p-3 rounded-lg border text-left transition-all ${
                        machineClassId === cls.id
                          ? 'bg-purple-950/40 border-purple-500/60 text-white'
                          : 'bg-[var(--bg-2)] border-[var(--line)] text-slate-400 hover:text-white hover:border-slate-600'
                      }`}
                    >
                      <div className="text-xs font-bold">{language === 'tr' ? cls.nameTr : cls.nameEn}</div>
                      <div className="text-[10px] text-slate-500 mt-1">{language === 'tr' ? cls.descTr : cls.descEn}</div>
                      <div className="flex gap-2 text-[10px] font-mono text-purple-400 mt-2">
                        <span>A ≤ {cls.limits[0]}</span>
                        <span>B ≤ {cls.limits[1]}</span>
                        <span>C ≤ {cls.limits[2]}</span>
                        <span>D &gt; {cls.limits[2]} mm/s</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Vibration Meter Input */}
              <div className="bg-[var(--bg-1)] border border-[var(--line)] rounded-xl p-5 shadow-lg">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[var(--line)] text-slate-300">
                  <Activity className="w-4 h-4 text-purple-400" />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider">
                    {t12(language, 'Measured Vibration (RMS)', 'Ölçülen Titreşim Şiddeti (RMS)')}
                  </span>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400">{t12(language, 'Vibration Velocity Vrms (mm/s)', 'Titreşim Hızı Vrms (mm/s)')}</span>
                      <span className="font-mono text-xl font-bold" style={{ color: isoSeverity.zoneColor }}>
                        {vibrationRms.toFixed(2)} mm/s
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0.1}
                      max={25.0}
                      step={0.1}
                      value={vibrationRms}
                      onChange={(e) => setVibrationRms(Number(e.target.value))}
                      className="w-full accent-[var(--cyan)] bg-[var(--bg-3)]"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-0.5">
                      <span>0.1 mm/s</span>
                      <span>10.0 mm/s</span>
                      <span>25.0 mm/s (Severe)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Severity Status & Action Recommendation */}
            <div className="lg:col-span-8 space-y-5">
              {/* Severity Status Card */}
              <div
                className="p-6 rounded-xl border shadow-xl flex flex-col justify-between"
                style={{
                  backgroundColor: 'var(--bg-1)',
                  borderColor: isoSeverity.zoneColor,
                }}
              >
                <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3.5 h-3.5 rounded-full inline-block animate-pulse"
                      style={{ backgroundColor: isoSeverity.zoneColor }}
                    />
                    <span className="text-sm font-bold uppercase font-mono tracking-wider text-white">
                      {isoSeverity.zoneTitle}
                    </span>
                  </div>
                  <span
                    className="px-2.5 py-1 rounded text-xs font-mono font-bold"
                    style={{
                      backgroundColor: `${isoSeverity.zoneColor}22`,
                      color: isoSeverity.zoneColor,
                      border: `1px solid ${isoSeverity.zoneColor}66`,
                    }}
                  >
                    ZONE {isoSeverity.zone}
                  </span>
                </div>

                <p className="text-xs text-slate-300 mt-4 leading-relaxed font-sans">
                  {isoSeverity.zoneDesc}
                </p>

                {/* ISO 10816 Zone Bar Spectrum */}
                <div className="mt-6">
                  <div className="text-[10px] font-mono text-slate-400 uppercase mb-2">
                    {t12(language, 'ISO 10816-1 Severity Scale Progression', 'ISO 10816-1 Şiddet Skalası İlerlemesi')}
                  </div>
                  <div className="h-6 w-full rounded-lg bg-[var(--bg-3)] flex overflow-hidden border border-[var(--line)] relative">
                    <div className="h-full bg-emerald-600/70 flex items-center justify-center text-[10px] font-bold text-white" style={{ width: '20%' }}>A</div>
                    <div className="h-full bg-blue-600/70 flex items-center justify-center text-[10px] font-bold text-white" style={{ width: '25%' }}>B</div>
                    <div className="h-full bg-amber-600/70 flex items-center justify-center text-[10px] font-bold text-white" style={{ width: '25%' }}>C</div>
                    <div className="h-full bg-rose-600/70 flex items-center justify-center text-[10px] font-bold text-white" style={{ width: '30%' }}>D (Danger)</div>

                    {/* Cursor Marker */}
                    {(() => {
                      const posPct = Math.min(100, (vibrationRms / 25) * 100);
                      return (
                        <div
                          className="absolute top-0 bottom-0 w-1 bg-white "
                          style={{ left: `${posPct}%` }}
                        />
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* Maintenance Recommended Action Table */}
              <div className="p-5 rounded-xl bg-[var(--bg-1)] border border-[var(--line)]">
                <div className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider mb-4">
                  {t12(language, 'Predictive Maintenance Guidance (ISO 10816 / ISO 20816)', 'Kestirimci Bakım Rehberi (ISO 10816 / ISO 20816)')}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-3 rounded bg-[var(--bg-2)] border border-[var(--line)]">
                    <div className="font-bold text-cyan-400 mb-1 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {t12(language, 'Zones A & B: Normal Condition', 'Bölge A & B: Normal Durum')}
                    </div>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      {t12(
                        language,
                        'Continue routine periodic vibration logging (e.g. monthly FFT spectrum inspection). Bearings, misalignment, and balancing are within design tolerances.',
                        'Rutin periyodik titreşim kaydına devam edin (örneğin aylık FFT spektrum analizi). Rulmanlar, kaplin ayarı ve balans tasarım toleransları dahilindedir.'
                      )}
                    </p>
                  </div>

                  <div className="p-3 rounded bg-[var(--bg-2)] border border-[var(--line)]">
                    <div className="font-bold text-rose-400 mb-1 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {t12(language, 'Zones C & D: Remedial Action', 'Bölge C & D: Düzeltici Müdahale')}
                    </div>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      {t12(
                        language,
                        'Conduct immediate FFT spectral demodulation: check for 1X unbalance, 2X shaft misalignment, vane pass pump cavitation, or inner/outer bearing race ball defect frequencies (BPFO/BPFI).',
                        'Acil FFT spektral demodülasyon yapın: 1X balanssızlık, 2X kaplin kaçıklığı, pompa kavitasyonu veya rulman yuvarlanma yolu arıza frekanslarını (BPFO/BPFI) kontrol edin.'
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: ROTOR UNBALANCE & CRITICAL SPEED (ISO 1940-1)     */}
        {/* ========================================================= */}
        {activeTab === 'rotor' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl mx-auto">
            {/* Left Inputs */}
            <div className="lg:col-span-4 space-y-5">
              <div className="bg-[var(--bg-1)] border border-[var(--line)] rounded-xl p-5 shadow-lg">
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-[var(--line)] text-purple-400">
                  <Disc className="w-4 h-4" />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider">
                    {t12(language, 'Rotor Dynamics Configuration', 'Rotor Dinamiği Yapılandırması')}
                  </span>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-slate-400 font-mono block mb-1">
                      {t12(language, 'Rotor Body Mass (M, kg)', 'Rotor Gövde Kütlesi (M, kg)')}
                    </label>
                    <input
                      type="number"
                      step={5}
                      min={1}
                      value={rotorMass}
                      onChange={(e) => setRotorMass(Number(e.target.value))}
                      className="w-full bg-[var(--bg-2)] border border-[var(--line)] rounded px-3 py-1.5 text-xs font-mono text-white outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 font-mono block mb-1">
                      {t12(language, 'Effective Shaft Stiffness (K, N/m)', 'Efektif Mil Eğilme Rijitliği (K, N/m)')}
                    </label>
                    <input
                      type="number"
                      step={10000}
                      min={1000}
                      value={shaftStiffness}
                      onChange={(e) => setShaftStiffness(Number(e.target.value))}
                      className="w-full bg-[var(--bg-2)] border border-[var(--line)] rounded px-3 py-1.5 text-xs font-mono text-white outline-none focus:border-purple-500"
                    />
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                      {(shaftStiffness / 1000).toFixed(1)} N/mm
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 font-mono block mb-1">
                      {t12(language, 'Operating Rotational Speed (RPM)', 'Çalışma Devir Sayısı (RPM)')}
                    </label>
                    <input
                      type="number"
                      step={100}
                      min={100}
                      value={operatingRpm}
                      onChange={(e) => setOperatingRpm(Number(e.target.value))}
                      className="w-full bg-[var(--bg-2)] border border-[var(--line)] rounded px-3 py-1.5 text-xs font-mono text-white outline-none focus:border-purple-500"
                    />
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                      Angular Velocity: {rotorResults.operatingOmega.toFixed(1)} rad/s ({(operatingRpm / 60).toFixed(1)} Hz)
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 font-mono block mb-1">
                      {t12(language, 'ISO 1940-1 Balance Quality Grade', 'ISO 1940-1 Balans Kalite Sınıfı')}
                    </label>
                    <select
                      value={balanceGrade}
                      onChange={(e) => setBalanceGrade(Number(e.target.value))}
                      className="w-full bg-[var(--bg-2)] border border-[var(--line)] rounded px-3 py-2 text-xs font-mono text-white outline-none focus:border-purple-500"
                    >
                      {ISO_1940_GRADES.map((g) => (
                        <option key={g.grade} value={g.grade} className="bg-[var(--bg-1)]">
                          {g.label} — {language === 'tr' ? g.typicalAppTr : g.typicalAppEn}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Telemetry */}
            <div className="lg:col-span-8 space-y-5">
              {/* Rotor KPI Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-[var(--bg-1)] border border-[var(--line)]">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">{t12(language, 'Critical Speed (Nc)', 'Kritik Devir Hızı (Nc)')}</div>
                  <div className="text-2xl font-mono font-black text-cyan-400 mt-1">
                    {rotorResults.criticalSpeedRpm.toFixed(0)} <span className="text-xs font-sans text-cyan-500/70">RPM</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">{rotorResults.omega_cr.toFixed(1)} rad/s ({(rotorResults.criticalSpeedRpm / 60).toFixed(1)} Hz)</div>
                </div>

                <div className="p-4 rounded-xl bg-[var(--bg-1)] border border-[var(--line)]">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">{t12(language, 'Speed Ratio (Ω / Ωcr)', 'Hız Oranı (Ω / Ωcr)')}</div>
                  <div className={`text-2xl font-mono font-black mt-1 ${rotorResults.isResonantCritical ? 'text-rose-400' : 'text-purple-400'}`}>
                    {rotorResults.speedRatio.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    {rotorResults.isSubcritical
                      ? t12(language, 'Subcritical Operation', 'Kritik Altı Çalışma')
                      : rotorResults.isResonantCritical
                      ? t12(language, 'CRITICAL RESONANCE', 'KRİTİK REZONANS')
                      : t12(language, 'Supercritical (Self-centering)', 'Kritik Üstü (Kendiliğinden Merkezleme)')}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[var(--bg-1)] border border-[var(--line)]">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">{t12(language, 'Permissible Residual e_per', 'İzin Verilen Eksantriklik e_per')}</div>
                  <div className="text-2xl font-mono font-black text-emerald-400 mt-1">
                    {rotorResults.e_per_um.toFixed(1)} <span className="text-xs font-sans text-emerald-500/70">μm</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">g·mm/kg (ISO 1940 G {balanceGrade})</div>
                </div>

                <div className="p-4 rounded-xl bg-[var(--bg-1)] border border-[var(--line)]">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">{t12(language, 'Dynamic Unbalance Force', 'Dinamik Balanssızlık Kuvveti')}</div>
                  <div className="text-2xl font-mono font-black text-amber-400 mt-1">
                    {rotorResults.unbalanceForceN.toFixed(1)} <span className="text-xs font-sans text-amber-500/70">N</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">Funb = M · e · Ω²</div>
                </div>
              </div>

              {/* Critical Speed Zone Alert */}
              {rotorResults.isResonantCritical && (
                <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/50 flex items-center gap-3 text-rose-300">
                  <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider">
                      {t12(language, 'ROTOR DYNAMICS CRITICAL SPEED DANGER', 'ROTOR DİNAMİĞİ KRİTİK DEVİR TEHLİKESİ')}
                    </div>
                    <div className="text-[11px] text-rose-400/80">
                      {t12(
                        language,
                        `Operating speed (${operatingRpm} RPM) is within ±15% of shaft critical whipping speed (${rotorResults.criticalSpeedRpm.toFixed(0)} RPM). Severe shaft deflection and catastrophic bearing destruction risk. Shift operating speed or adjust bearing span immediately.`,
                        `Çalışma devri (${operatingRpm} RPM), milin rezonans kritik devrinin (${rotorResults.criticalSpeedRpm.toFixed(0)} RPM) ±%15 bandındadır. Aşırı mil sehim oluşumu ve rulman hasarı riski. Çalışma devrini kaydırın veya rulman açıklığını değiştirin.`
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Jeffcott Rotor Schematic Diagram */}
              <div className="p-6 rounded-xl bg-[var(--bg-1)] border border-[var(--line)] relative flex flex-col items-center">
                <div className="w-full flex justify-between items-center mb-6 pb-2 border-b border-[var(--line)] text-xs font-mono text-slate-400">
                  <span>{t12(language, 'Jeffcott Rotor Shaft Model', 'Jeffcott Rotor Mil Modeli')}</span>
                  <span className="text-cyan-400">Uper = {rotorResults.u_per_g_mm.toFixed(1)} g·mm</span>
                </div>

                <div className="relative w-full max-w-lg h-32 flex items-center justify-between px-8">
                  {/* Left Bearing */}
                  <div className="flex flex-col items-center">
                    <div className="w-5 h-8 rounded bg-[var(--bg-3)] border border-cyan-500/60 flex items-center justify-center text-[9px] font-mono text-cyan-400">B1</div>
                    <div className="w-8 h-2 bg-slate-700 mt-1 rounded" />
                  </div>

                  {/* Shaft Line */}
                  <div className="flex-1 h-2 bg-gradient-to-r from-slate-600 via-cyan-400 to-slate-600 relative flex items-center justify-center">
                    {/* Central Rotor Disc */}
                    <div className="w-20 h-20 rounded-full bg-[var(--bg-2)] border-2 border-purple-500 flex flex-col items-center justify-center relative">
                      <Disc className="w-10 h-10 text-purple-400 animate-spin" style={{ animationDuration: `${Math.max(0.5, 3000 / operatingRpm)}s` }} />
                      <div className="absolute top-1 right-2 w-2 h-2 rounded-full bg-rose-500 " />
                    </div>
                  </div>

                  {/* Right Bearing */}
                  <div className="flex flex-col items-center">
                    <div className="w-5 h-8 rounded bg-[var(--bg-3)] border border-cyan-500/60 flex items-center justify-center text-[9px] font-mono text-cyan-400">B2</div>
                    <div className="w-8 h-2 bg-slate-700 mt-1 rounded" />
                  </div>
                </div>

                <div className="text-[10px] font-mono text-slate-500 mt-4">
                  Bearing Span: Rigid Pedestals | Permissible Unbalance Mass at r=100mm: {(rotorResults.u_per_g_mm / 100).toFixed(2)} grams
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
