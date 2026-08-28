'use client';

import React, { useState, useMemo } from 'react';
import { Wrench, CircleDot, Layers, Cog, ShieldCheck, Activity, RotateCcw } from 'lucide-react';

interface SimulatorProps {
  unitId: string;
}

export function AcademyInteractiveSimulators({ unitId }: SimulatorProps) {
  // Select which simulator to render based on unit
  switch (unitId) {
    case 'unit-1':
      return <BoltTorqueSimulator />;
    case 'unit-2':
      return <BearingLifeSimulator />;
    case 'unit-3':
      return <BeamDeflectionSimulator />;
    case 'unit-4':
      return <GearStressSimulator />;
    case 'unit-7':
      return <BucklingSimulator />;
    default:
      return <GenericEngineeringSimulator unitId={unitId} />;
  }
}

// ══════════════════════════════════════════════════════════════
// 1. BOLT TORQUE & PRELOAD SIMULATOR (VDI 2230)
// ══════════════════════════════════════════════════════════════
function BoltTorqueSimulator() {
  const [diameter, setDiameter] = useState<number>(12); // M12
  const [grade, setGrade] = useState<'8.8' | '10.9' | '12.9'>('8.8');
  const [friction, setFriction] = useState<number>(0.12); // μ = 0.12 (lubricated steel)

  // Bolt geometry table
  const boltProps: Record<number, { pitch: number; d2: number; as: number }> = {
    6: { pitch: 1.0, d2: 5.35, as: 20.1 },
    8: { pitch: 1.25, d2: 7.19, as: 36.6 },
    10: { pitch: 1.5, d2: 9.03, as: 58.0 },
    12: { pitch: 1.75, d2: 10.86, as: 84.3 },
    16: { pitch: 2.0, d2: 14.70, as: 157.0 },
    20: { pitch: 2.5, d2: 18.38, as: 245.0 },
    24: { pitch: 3.0, d2: 22.05, as: 353.0 },
  };

  const yieldStrength = grade === '8.8' ? 640 : grade === '10.9' ? 900 : 1080; // MPa

  const currentProp = boltProps[diameter] || boltProps[12];

  // Calculation per Kellermann-Klein / VDI 2230
  const results = useMemo(() => {
    const As = currentProp.as; // mm²
    const maxPreload = 0.9 * yieldStrength * As; // N (90% yield)
    const d2 = currentProp.d2;
    const P = currentProp.pitch;
    const tanPhi = P / (Math.PI * d2);
    const dHead = diameter * 1.4; // Underhead effective diameter approx

    // Torque formula: T = Fm * (0.5 * d2 * (tanPhi + 1.155*mu) + 0.5 * dHead * mu)
    const torqueNm = (maxPreload * (0.5 * d2 * (tanPhi + 1.155 * friction) + 0.5 * dHead * friction)) / 1000;
    const tensileStress = maxPreload / As;
    const yieldUtilization = (tensileStress / yieldStrength) * 100;

    return {
      preloadKN: (maxPreload / 1000).toFixed(1),
      torqueNm: torqueNm.toFixed(1),
      stressMPa: tensileStress.toFixed(0),
      utilization: yieldUtilization.toFixed(0),
    };
  }, [diameter, grade, friction, currentProp, yieldStrength]);

  return (
    <div className="p-5 rounded-2xl bg-black/40 border border-cyan-500/20 space-y-5 font-mono text-xs">
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2 text-cyan-400 font-bold">
          <Wrench size={16} />
          <span>VDI 2230 Canlı Cıvata Ön Gerilme & Tork Simülatörü</span>
        </div>
        <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-[10px] text-cyan-300 border border-cyan-500/20">
          Hassas Çözücü
        </span>
      </div>

      {/* Control Sliders */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Bolt Diameter */}
        <div className="space-y-2">
          <div className="flex justify-between text-slate-400">
            <span>Anma Çapı:</span>
            <strong className="text-white">M{diameter}</strong>
          </div>
          <select
            value={diameter}
            onChange={(e) => setDiameter(Number(e.target.value))}
            className="w-full bg-slate-900 border border-white/10 rounded-lg p-2 text-white font-bold"
          >
            <option value={6}>M6 (As = 20.1 mm²)</option>
            <option value={8}>M8 (As = 36.6 mm²)</option>
            <option value={10}>M10 (As = 58.0 mm²)</option>
            <option value={12}>M12 (As = 84.3 mm²)</option>
            <option value={16}>M16 (As = 157 mm²)</option>
            <option value={20}>M20 (As = 245 mm²)</option>
            <option value={24}>M24 (As = 353 mm²)</option>
          </select>
        </div>

        {/* Grade */}
        <div className="space-y-2">
          <div className="flex justify-between text-slate-400">
            <span>Kalite Sınıfı:</span>
            <strong className="text-cyan-400">{grade} ({yieldStrength} MPa)</strong>
          </div>
          <div className="grid grid-cols-3 gap-1 bg-slate-900 p-1 rounded-lg border border-white/10">
            {(['8.8', '10.9', '12.9'] as const).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGrade(g)}
                className={`py-1.5 rounded text-center transition cursor-pointer font-bold ${
                  grade === g ? 'bg-cyan-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* Friction */}
        <div className="space-y-2">
          <div className="flex justify-between text-slate-400">
            <span>Sürtünme Katsayısı (μ):</span>
            <strong className="text-amber-400">{friction.toFixed(2)}</strong>
          </div>
          <input
            type="range"
            min="0.08"
            max="0.25"
            step="0.01"
            value={friction}
            onChange={(e) => setFriction(Number(e.target.value))}
            className="w-full accent-cyan-400 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>Yağlı (0.08)</span>
            <span>Kuru Çelik (0.15)</span>
            <span>Paslı (0.25)</span>
          </div>
        </div>
      </div>

      {/* Live Output HUD */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
        <div className="p-3 rounded-xl bg-slate-900/90 border border-white/10 text-center">
          <span className="text-[10px] text-slate-400 uppercase">Sıkma Torku (MA)</span>
          <p className="text-lg font-black text-cyan-400 mt-1">{results.torqueNm} <span className="text-xs font-normal">Nm</span></p>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/90 border border-white/10 text-center">
          <span className="text-[10px] text-slate-400 uppercase">Ön Gerilme (FM)</span>
          <p className="text-lg font-black text-emerald-400 mt-1">{results.preloadKN} <span className="text-xs font-normal">kN</span></p>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/90 border border-white/10 text-center">
          <span className="text-[10px] text-slate-400 uppercase">Çekme Gerilmesi (σ0)</span>
          <p className="text-lg font-black text-white mt-1">{results.stressMPa} <span className="text-xs font-normal">MPa</span></p>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/90 border border-white/10 text-center">
          <span className="text-[10px] text-slate-400 uppercase">Akma Oranı (αA)</span>
          <p className="text-lg font-black text-amber-400 mt-1">%{results.utilization}</p>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 2. BEARING RATING LIFE SIMULATOR (ISO 281)
// ══════════════════════════════════════════════════════════════
function BearingLifeSimulator() {
  const [dynamicCapacity, setDynamicCapacity] = useState<number>(32); // C in kN
  const [radialLoad, setRadialLoad] = useState<number>(6.5); // Fr in kN
  const [rpm, setRpm] = useState<number>(1450);
  const [bearingType, setBearingType] = useState<'ball' | 'roller'>('ball');

  const pExponent = bearingType === 'ball' ? 3 : 10 / 3;

  const results = useMemo(() => {
    const P = radialLoad > 0 ? radialLoad : 0.1;
    const L10MillionRevs = Math.pow(dynamicCapacity / P, pExponent);
    const L10Hours = (L10MillionRevs * 1000000) / (60 * rpm);

    return {
      millionRevs: L10MillionRevs.toFixed(1),
      hours: Math.round(L10Hours).toLocaleString(),
      years247: (L10Hours / (24 * 365)).toFixed(1),
    };
  }, [dynamicCapacity, radialLoad, rpm, pExponent]);

  return (
    <div className="p-5 rounded-2xl bg-black/40 border border-cyan-500/20 space-y-5 font-mono text-xs">
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2 text-sky-400 font-bold">
          <CircleDot size={16} />
          <span>ISO 281 Rulman L10 Yorulma Ömrü Simülatörü</span>
        </div>
        <span className="px-2 py-0.5 rounded bg-sky-500/10 text-[10px] text-sky-300 border border-sky-500/20">
          L10 Hesaplayıcı
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {/* Dynamic Capacity */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-slate-400">
            <span>Dinamik Yük (C):</span>
            <strong className="text-white">{dynamicCapacity} kN</strong>
          </div>
          <input
            type="range"
            min="5"
            max="120"
            step="1"
            value={dynamicCapacity}
            onChange={(e) => setDynamicCapacity(Number(e.target.value))}
            className="w-full accent-sky-400 cursor-pointer"
          />
        </div>

        {/* Radial Load */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-slate-400">
            <span>Eşdeğer Yük (P):</span>
            <strong className="text-amber-400">{radialLoad} kN</strong>
          </div>
          <input
            type="range"
            min="0.5"
            max="40"
            step="0.5"
            value={radialLoad}
            onChange={(e) => setRadialLoad(Number(e.target.value))}
            className="w-full accent-amber-400 cursor-pointer"
          />
        </div>

        {/* RPM */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-slate-400">
            <span>Dönme Hızı (n):</span>
            <strong className="text-cyan-400">{rpm} RPM</strong>
          </div>
          <input
            type="range"
            min="100"
            max="6000"
            step="50"
            value={rpm}
            onChange={(e) => setRpm(Number(e.target.value))}
            className="w-full accent-cyan-400 cursor-pointer"
          />
        </div>

        {/* Type */}
        <div className="space-y-1.5">
          <span className="text-slate-400 block">Rulman Tipi (p üssü):</span>
          <div className="grid grid-cols-2 gap-1 bg-slate-900 p-1 rounded-lg border border-white/10">
            <button
              type="button"
              onClick={() => setBearingType('ball')}
              className={`py-1 rounded text-center transition cursor-pointer font-bold ${
                bearingType === 'ball' ? 'bg-sky-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              Bilyalı (p=3)
            </button>
            <button
              type="button"
              onClick={() => setBearingType('roller')}
              className={`py-1 rounded text-center transition cursor-pointer font-bold ${
                bearingType === 'roller' ? 'bg-sky-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              Makaralı (10/3)
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-white/10 text-center">
          <span className="text-[10px] text-slate-400 uppercase">L10 Ömrü (Milyon Devir)</span>
          <p className="text-xl font-black text-sky-400 mt-1">{results.millionRevs} <span className="text-xs font-normal">M-rev</span></p>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-white/10 text-center">
          <span className="text-[10px] text-slate-400 uppercase">Çalışma Ömrü (L10h)</span>
          <p className="text-xl font-black text-emerald-400 mt-1">{results.hours} <span className="text-xs font-normal">Saat</span></p>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-white/10 text-center">
          <span className="text-[10px] text-slate-400 uppercase">7/24 Sürekli Çalışma</span>
          <p className="text-xl font-black text-amber-400 mt-1">{results.years247} <span className="text-xs font-normal">Yıl</span></p>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 3. BEAM DEFLECTION & MOMENT SIMULATOR (EULER-BERNOULLI)
// ══════════════════════════════════════════════════════════════
function BeamDeflectionSimulator() {
  const [spanLength, setSpanLength] = useState<number>(1200); // mm
  const [pointLoad, setPointLoad] = useState<number>(2500); // N
  const [material, setMaterial] = useState<'alu' | 'steel'>('alu');

  const E = material === 'alu' ? 70000 : 210000; // MPa (N/mm²)
  const I = 250000; // mm⁴ (approx for 40x40 profile)

  const results = useMemo(() => {
    const L = spanLength;
    const F = pointLoad;
    // Simply supported beam with center point load:
    // M_max = F*L / 4 (N*mm)
    const maxMomentNm = (F * L) / (4 * 1000);
    // Deflection: w_max = (F * L³) / (48 * E * I)
    const maxDeflectionMm = (F * Math.pow(L, 3)) / (48 * E * I);
    const allowableDeflection = L / 500;
    const isSafe = maxDeflectionMm <= allowableDeflection;

    return {
      momentNm: maxMomentNm.toFixed(1),
      deflectionMm: maxDeflectionMm.toFixed(2),
      allowableMm: allowableDeflection.toFixed(2),
      isSafe,
    };
  }, [spanLength, pointLoad, E, I]);

  return (
    <div className="p-5 rounded-2xl bg-black/40 border border-cyan-500/20 space-y-5 font-mono text-xs">
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2 text-emerald-400 font-bold">
          <Layers size={16} />
          <span>Euler-Bernoulli Kiriş Sehim & Moment Simülatörü</span>
        </div>
        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-[10px] text-emerald-300 border border-emerald-500/20">
          Basit Mesnetli
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Span Length */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-slate-400">
            <span>Açıklık Boyu (L):</span>
            <strong className="text-white">{spanLength} mm</strong>
          </div>
          <input
            type="range"
            min="300"
            max="3000"
            step="50"
            value={spanLength}
            onChange={(e) => setSpanLength(Number(e.target.value))}
            className="w-full accent-emerald-400 cursor-pointer"
          />
        </div>

        {/* Load */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-slate-400">
            <span>Merkezi Noktasal Yük (F):</span>
            <strong className="text-cyan-400">{pointLoad} N ({Math.round(pointLoad / 9.81)} kg)</strong>
          </div>
          <input
            type="range"
            min="100"
            max="10000"
            step="100"
            value={pointLoad}
            onChange={(e) => setPointLoad(Number(e.target.value))}
            className="w-full accent-cyan-400 cursor-pointer"
          />
        </div>

        {/* Material */}
        <div className="space-y-1.5">
          <span className="text-slate-400 block">Malzeme (Elastisite Modülü):</span>
          <div className="grid grid-cols-2 gap-1 bg-slate-900 p-1 rounded-lg border border-white/10">
            <button
              type="button"
              onClick={() => setMaterial('alu')}
              className={`py-1 rounded text-center transition cursor-pointer font-bold ${
                material === 'alu' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              Alüminyum (70 GPa)
            </button>
            <button
              type="button"
              onClick={() => setMaterial('steel')}
              className={`py-1 rounded text-center transition cursor-pointer font-bold ${
                material === 'steel' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              Çelik (210 GPa)
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-white/10 text-center">
          <span className="text-[10px] text-slate-400 uppercase">Maksimum Eğilme Momenti</span>
          <p className="text-xl font-black text-cyan-400 mt-1">{results.momentNm} <span className="text-xs font-normal">Nm</span></p>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-white/10 text-center">
          <span className="text-[10px] text-slate-400 uppercase">Maksimum Sehim (w_max)</span>
          <p className="text-xl font-black text-emerald-400 mt-1">{results.deflectionMm} <span className="text-xs font-normal">mm</span></p>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-white/10 text-center">
          <span className="text-[10px] text-slate-400 uppercase">L/500 Sınırı ({results.allowableMm} mm)</span>
          <p className={`text-xl font-black mt-1 ${results.isSafe ? 'text-emerald-400' : 'text-rose-400'}`}>
            {results.isSafe ? 'GÜVENLİ (✓)' : 'SEHİM AŞILDI (✗)'}
          </p>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 4. GEAR STRESS SIMULATOR (ISO 6336)
// ══════════════════════════════════════════════════════════════
function GearStressSimulator() {
  const [module, setModule] = useState<number>(3); // mm
  const [teeth, setTeeth] = useState<number>(24);
  const [torque, setTorque] = useState<number>(120); // Nm

  const results = useMemo(() => {
    const dPitch = module * teeth; // mm
    const ftForce = (2 * torque * 1000) / dPitch; // N
    const faceWidth = module * 10; // mm (b = 10*m)
    // Approximate tooth root bending stress: sigma_F = (Ft * YF * YS) / (b * m)
    const YF = 2.4; // Form factor approx
    const rootStressMPa = (ftForce * YF) / (faceWidth * module);

    return {
      pitchDiameter: dPitch.toFixed(1),
      tangentialForceN: Math.round(ftForce),
      faceWidthMm: faceWidth.toFixed(0),
      rootStressMPa: rootStressMPa.toFixed(1),
    };
  }, [module, teeth, torque]);

  return (
    <div className="p-5 rounded-2xl bg-black/40 border border-cyan-500/20 space-y-5 font-mono text-xs">
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2 text-amber-400 font-bold">
          <Cog size={16} />
          <span>ISO 6336 Düz Dişli Diş Dibi Gerilme Simülatörü</span>
        </div>
        <span className="px-2 py-0.5 rounded bg-amber-500/10 text-[10px] text-amber-300 border border-amber-500/20">
          ISO 6336 Metot B
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Module */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-slate-400">
            <span>Modül (m):</span>
            <strong className="text-white">{module} mm</strong>
          </div>
          <input
            type="range"
            min="1"
            max="10"
            step="0.5"
            value={module}
            onChange={(e) => setModule(Number(e.target.value))}
            className="w-full accent-amber-400 cursor-pointer"
          />
        </div>

        {/* Teeth */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-slate-400">
            <span>Diş Sayısı (z):</span>
            <strong className="text-cyan-400">{teeth}</strong>
          </div>
          <input
            type="range"
            min="12"
            max="80"
            step="1"
            value={teeth}
            onChange={(e) => setTeeth(Number(e.target.value))}
            className="w-full accent-cyan-400 cursor-pointer"
          />
        </div>

        {/* Torque */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-slate-400">
            <span>İletilen Tork (T):</span>
            <strong className="text-emerald-400">{torque} Nm</strong>
          </div>
          <input
            type="range"
            min="10"
            max="1000"
            step="10"
            value={torque}
            onChange={(e) => setTorque(Number(e.target.value))}
            className="w-full accent-emerald-400 cursor-pointer"
          />
        </div>
      </div>

      {/* Results */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
        <div className="p-3 rounded-xl bg-slate-900/90 border border-white/10 text-center">
          <span className="text-[10px] text-slate-400 uppercase">Bölüm Dairesi Çapı (d)</span>
          <p className="text-lg font-black text-white mt-1">{results.pitchDiameter} <span className="text-xs font-normal">mm</span></p>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/90 border border-white/10 text-center">
          <span className="text-[10px] text-slate-400 uppercase">Teğetsel Kuvvet (Ft)</span>
          <p className="text-lg font-black text-cyan-400 mt-1">{results.tangentialForceN} <span className="text-xs font-normal">N</span></p>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/90 border border-white/10 text-center">
          <span className="text-[10px] text-slate-400 uppercase">Diş Genişliği (b)</span>
          <p className="text-lg font-black text-slate-300 mt-1">{results.faceWidthMm} <span className="text-xs font-normal">mm</span></p>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/90 border border-white/10 text-center">
          <span className="text-[10px] text-slate-400 uppercase">Diş Dibi Gerilmesi (σF)</span>
          <p className="text-lg font-black text-amber-400 mt-1">{results.rootStressMPa} <span className="text-xs font-normal">MPa</span></p>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 5. COLUMN BUCKLING SIMULATOR (EULER)
// ══════════════════════════════════════════════════════════════
function BucklingSimulator() {
  const [length, setLength] = useState<number>(1500); // mm
  const [endCondition, setEndCondition] = useState<number>(1.0); // K factor (pivoted-pivoted)

  const E = 70000; // MPa
  const I = 140000; // mm⁴

  const results = useMemo(() => {
    const Le = length * endCondition;
    // Euler critical load: P_cr = (pi^2 * E * I) / (Le^2)
    const PcrN = (Math.PI * Math.PI * E * I) / (Le * Le);

    return {
      effectiveLengthMm: Le.toFixed(0),
      criticalLoadKN: (PcrN / 1000).toFixed(1),
      maxSafeLoadKN: ((PcrN * 0.4) / 1000).toFixed(1), // Safety factor 2.5
    };
  }, [length, endCondition, E, I]);

  return (
    <div className="p-5 rounded-2xl bg-black/40 border border-cyan-500/20 space-y-5 font-mono text-xs">
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2 text-rose-400 font-bold">
          <Activity size={16} />
          <span>Euler Kolon Burkulma Kritik Yük Simülatörü</span>
        </div>
        <span className="px-2 py-0.5 rounded bg-rose-500/10 text-[10px] text-rose-300 border border-rose-500/20">
          Kritik Yük Hesabı
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Length */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-slate-400">
            <span>Kolon Boyu (L):</span>
            <strong className="text-white">{length} mm</strong>
          </div>
          <input
            type="range"
            min="400"
            max="4000"
            step="100"
            value={length}
            onChange={(e) => setLength(Number(e.target.value))}
            className="w-full accent-rose-400 cursor-pointer"
          />
        </div>

        {/* End Condition */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-slate-400">
            <span>Mesnet Tipi (K Katsayısı):</span>
            <strong className="text-rose-400">K = {endCondition}</strong>
          </div>
          <select
            value={endCondition}
            onChange={(e) => setEndCondition(Number(e.target.value))}
            className="w-full bg-slate-900 border border-white/10 rounded-lg p-2 text-white font-bold"
          >
            <option value={1.0}>İki Uçtan Mafsallı (K = 1.0)</option>
            <option value={0.5}>İki Uçtan Ankastre (K = 0.5)</option>
            <option value={0.7}>Bir Uç Ankastre, Bir Uç Mafsallı (K = 0.7)</option>
            <option value={2.0}>Konsol / Serbest Uç (K = 2.0)</option>
          </select>
        </div>
      </div>

      {/* Results */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-white/10 text-center">
          <span className="text-[10px] text-slate-400 uppercase">Etkin Burkulma Boyu (Le)</span>
          <p className="text-xl font-black text-white mt-1">{results.effectiveLengthMm} <span className="text-xs font-normal">mm</span></p>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-white/10 text-center">
          <span className="text-[10px] text-slate-400 uppercase">Euler Kritik Yük (Pcr)</span>
          <p className="text-xl font-black text-rose-400 mt-1">{results.criticalLoadKN} <span className="text-xs font-normal">kN</span></p>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-white/10 text-center">
          <span className="text-[10px] text-slate-400 uppercase">İzin Verilen Yük (S=2.5)</span>
          <p className="text-xl font-black text-emerald-400 mt-1">{results.maxSafeLoadKN} <span className="text-xs font-normal">kN</span></p>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 6. GENERIC INTERACTIVE WORKBENCH
// ══════════════════════════════════════════════════════════════
function GenericEngineeringSimulator({ unitId }: { unitId: string }) {
  const [loadRatio, setLoadRatio] = useState<number>(65);

  return (
    <div className="p-5 rounded-2xl bg-black/40 border border-cyan-500/20 space-y-4 font-mono text-xs">
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2 text-cyan-400 font-bold">
          <ShieldCheck size={16} />
          <span>Normatif Tasarım Parametre Analizi ({unitId})</span>
        </div>
        <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-[10px] text-cyan-300">
          Canlı Analiz
        </span>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-slate-400">
          <span>Yükleme / Kapasite Kullanım Oranı:</span>
          <strong className={loadRatio > 85 ? 'text-rose-400' : 'text-emerald-400'}>%{loadRatio}</strong>
        </div>
        <input
          type="range"
          min="10"
          max="120"
          value={loadRatio}
          onChange={(e) => setLoadRatio(Number(e.target.value))}
          className="w-full accent-cyan-400 cursor-pointer"
        />
      </div>

      <div className="p-3 rounded-xl bg-slate-900/90 border border-white/10 flex items-center justify-between">
        <span className="text-slate-400">Güvenlik Katsayısı Durumu:</span>
        <span className={`font-bold px-2 py-0.5 rounded text-xs ${
          loadRatio <= 75 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
          loadRatio <= 90 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
          'bg-rose-500/20 text-rose-300 border border-rose-500/30'
        }`}>
          {loadRatio <= 75 ? 'Optimal Güvenlik (S ≥ 1.5)' : loadRatio <= 90 ? 'Kritik Sınır (S ≈ 1.1)' : 'Aşırı Yükleme Riski (S < 1.0)'}
        </span>
      </div>
    </div>
  );
}
