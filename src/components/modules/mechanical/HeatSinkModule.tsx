'use client';

import React, { useState, useMemo } from 'react';
import { 
  Flame, 
  Thermometer, 
  Wind, 
  Zap, 
  Sliders, 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  Layers, 
  Scale, 
  Fan, 
  Cpu, 
  Copy, 
  Check, 
  Info,
  Maximize2
} from 'lucide-react';
import { useI18nStore } from '@/store/i18nStore';
import { t12 } from '@/locales/t12';
import { useGlobalPrecision, formatEngineeringValue } from '@/components/calculator-kit/precisionUtils';

interface ThermalMaterial {
  id: string;
  nameEn: string;
  nameTr: string;
  k: number; // Thermal conductivity (W/m·K)
  density: number; // kg/m³
}

const THERMAL_MATERIALS: ThermalMaterial[] = [
  { id: 'alu_6063', nameEn: 'Extruded Aluminum 6063-T6', nameTr: 'Ekstrüzyon Alüminyum 6063-T6', k: 201, density: 2700 },
  { id: 'alu_6061', nameEn: 'Machined Aluminum 6061-T6', nameTr: 'İşlenmiş Alüminyum 6061-T6', k: 167, density: 2700 },
  { id: 'alu_1050', nameEn: 'Pure Aluminum 1050 (High K)', nameTr: 'Saf Alüminyum 1050 (Yüksek İletim)', k: 222, density: 2710 },
  { id: 'copper', nameEn: 'Pure Copper C11000', nameTr: 'Saf Bakır C11000', k: 390, density: 8940 },
];

interface DevicePreset {
  id: string;
  nameEn: string;
  nameTr: string;
  power: number; // Watts
  rJc: number; // Junction-to-case (°C/W)
  rCs: number; // Case-to-sink / TIM pad (°C/W)
  maxJunctionT: number; // °C
}

const DEVICE_PRESETS: DevicePreset[] = [
  { id: 'to220', nameEn: 'TO-220 Transistor / MOSFET', nameTr: 'TO-220 Güç Transistörü / MOSFET', power: 18, rJc: 1.2, rCs: 0.5, maxJunctionT: 150 },
  { id: 'to247', nameEn: 'TO-247 High-Power Diode/IGBT', nameTr: 'TO-247 Güç IGBT / Diyot', power: 45, rJc: 0.6, rCs: 0.3, maxJunctionT: 150 },
  { id: 'igbt_module', nameEn: 'Industrial IGBT Power Module', nameTr: 'Endüstriyel IGBT Güç Modülü', power: 180, rJc: 0.15, rCs: 0.08, maxJunctionT: 125 },
  { id: 'led_cob', nameEn: '50W High-Power LED COB', nameTr: '50W Yüksek Güçlü LED COB', power: 50, rJc: 0.8, rCs: 0.25, maxJunctionT: 110 },
  { id: 'cpu_soc', nameEn: 'Embedded CPU / SoC Processor', nameTr: 'Gömülü CPU / SoC İşlemci', power: 65, rJc: 0.3, rCs: 0.15, maxJunctionT: 100 },
];

export default function HeatSinkModule({ lang: propLang }: { lang?: string }) {
  const precision = useGlobalPrecision();
  const { language: storeLang } = useI18nStore();
  const lang = propLang || storeLang || 'tr';

  // --- Active Tab ---
  const [activeTab, setActiveTab] = useState<'thermal' | 'geometry' | 'airflow' | 'extrusion'>('thermal');
  const [selectedPresetId, setSelectedPresetId] = useState<string>('to247');
  const [copied, setCopied] = useState(false);

  // --- Power & Operating Conditions ---
  const currentPreset = useMemo(() => {
    return DEVICE_PRESETS.find(p => p.id === selectedPresetId) || DEVICE_PRESETS[1];
  }, [selectedPresetId]);

  const [power, setPower] = useState(currentPreset.power);
  const [ambientTemp, setAmbientTemp] = useState(35); // °C (industrial enclosure ambient)
  const [rJc, setRJc] = useState(currentPreset.rJc); // Junction-to-case
  const [rCs, setRCs] = useState(currentPreset.rCs); // Case-to-sink (TIM)
  const [maxJunctionT, setMaxJunctionT] = useState(currentPreset.maxJunctionT);

  // Sync preset changes
  const handlePresetChange = (presetId: string) => {
    setSelectedPresetId(presetId);
    const p = DEVICE_PRESETS.find(pr => pr.id === presetId);
    if (p) {
      setPower(p.power);
      setRJc(p.rJc);
      setRCs(p.rCs);
      setMaxJunctionT(p.maxJunctionT);
    }
  };

  // --- Cooling Mode (Natural vs Forced) ---
  const [coolingMode, setCoolingMode] = useState<'natural' | 'forced'>('natural');
  const [airVelocity, setAirVelocity] = useState(2.0); // m/s (forced)

  // --- Material ---
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>('alu_6063');
  const material = useMemo(() => {
    return THERMAL_MATERIALS.find(m => m.id === selectedMaterialId) || THERMAL_MATERIALS[0];
  }, [selectedMaterialId]);

  // --- Geometry Inputs (mm) ---
  const [baseWidth, setBaseWidth] = useState(80); // W (mm)
  const [baseLength, setBaseLength] = useState(100); // L (mm)
  const [baseThickness, setBaseThickness] = useState(6); // t_b (mm)
  const [finHeight, setFinHeight] = useState(35); // H (mm)
  const [finThickness, setFinThickness] = useState(1.8); // t_f (mm)
  const [finCount, setFinCount] = useState(14); // N

  // --- Calculations ---
  const results = useMemo(() => {
    const W_m = baseWidth / 1000;
    const L_m = baseLength / 1000;
    const tb_m = baseThickness / 1000;
    const H_m = finHeight / 1000;
    const tf_m = finThickness / 1000;
    const k = material.k;

    // Convective Heat Transfer Coefficient h (W/m²·K)
    let h = 10;
    if (coolingMode === 'natural') {
      // Natural convection in air (approx 8-15 W/m²K depending on geometry)
      h = 9.5;
    } else {
      // Forced convection: h ≈ 10.45 * v^0.8 + 6
      h = 10.45 * Math.pow(Math.max(0.1, airVelocity), 0.8) + 6.0;
    }

    // Fin Spacing s (clearance between fins)
    const totalFinThick = finCount * tf_m;
    const finSpacing_m = finCount > 1 ? Math.max(0.0005, (W_m - totalFinThick) / (finCount - 1)) : W_m;
    const finSpacing_mm = finSpacing_m * 1000;

    // Exposed Base Area
    const aBase = Math.max(0, (W_m * L_m) - totalFinThick * L_m);

    // Single fin surface area (2 vertical sides + tip)
    const aSingleFin = 2 * H_m * L_m + tf_m * L_m;
    const aTotalFins = finCount * aSingleFin;
    const aTotalSurface = aBase + aTotalFins; // m²

    // Fin Parameter m = sqrt(2 * h / (k * t_f))
    const m = Math.sqrt((2 * h) / (k * tf_m));
    const mH = m * H_m;

    // Fin Efficiency (Rectangular fin adiabatic tip: eta_f = tanh(mH) / mH)
    const finEfficiency = mH > 0 ? Math.tanh(mH) / mH : 1.0;

    // Effective Surface Area: A_eff = A_base + eta_f * A_fins
    const aEff = aBase + finEfficiency * aTotalFins;

    // Heat Sink to Ambient Thermal Resistance (R_th,sa) in °C/W
    const rSa = 1 / (h * Math.max(0.0001, aEff));

    // Base Conduction Spreading Resistance (approx)
    const rBaseSpread = tb_m / (k * W_m * L_m);
    const rTotalSink = rSa + rBaseSpread;

    // Total System Thermal Resistance: R_total = R_jc + R_cs + R_sa
    const rTotal = rJc + rCs + rTotalSink;

    // Temperatures
    const tSink = ambientTemp + power * rTotalSink;
    const tCase = tSink + power * rCs;
    const tJunction = tCase + power * rJc;

    // Thermal Margin & Safety Check
    const tempMargin = maxJunctionT - tJunction;
    let thermalStatus: 'safe' | 'warning' | 'danger' = 'safe';
    if (tJunction > maxJunctionT) {
      thermalStatus = 'danger';
    } else if (tempMargin < 15) {
      thermalStatus = 'warning';
    }

    // Extrusion Mass & Metraj Stats
    // Base cross section: W * t_b (mm²)
    // Fins cross section: N * H * t_f (mm²)
    const crossSectionArea_mm2 = (baseWidth * baseThickness) + (finCount * finHeight * finThickness);
    const crossSectionArea_m2 = crossSectionArea_mm2 / 1e6;
    const massPerMeter = crossSectionArea_m2 * material.density; // kg/m
    const heatsinkPieceWeight_g = massPerMeter * L_m * 1000; // grams

    return {
      h,
      finSpacing_mm,
      aTotalSurface_cm2: aTotalSurface * 10000,
      aEff_cm2: aEff * 10000,
      finEfficiency,
      rSa,
      rTotalSink,
      rTotal,
      tSink,
      tCase,
      tJunction,
      tempMargin,
      thermalStatus,
      crossSectionArea_mm2,
      massPerMeter,
      heatsinkPieceWeight_g
    };
  }, [
    baseWidth, baseLength, baseThickness, finHeight, finThickness, finCount,
    material, coolingMode, airVelocity, power, ambientTemp, rJc, rCs, maxJunctionT
  ]);

  // Copy report
  const handleCopyReport = () => {
    const report = `--- ALUCALC HEAT SINK THERMAL ANALYSIS ---
Component: ${currentPreset.nameEn} (Dissipation: ${power} W)
Ambient: ${ambientTemp}°C | Cooling: ${coolingMode === 'natural' ? 'Natural Convection' : `Forced Air (${airVelocity} m/s)`}
Material: ${material.nameEn} (k = ${material.k} W/m·K)
Heatsink Dimensions: ${baseWidth} x ${baseLength} x ${finHeight + baseThickness} mm (${finCount} fins, t = ${finThickness} mm)
Thermal Resistance (R_sa): ${formatEngineeringValue(results.rSa, precision, false)} °C/W (Total System: ${formatEngineeringValue(results.rTotal, precision, false)} °C/W)
Temperatures:
 - Heat Sink Base: ${formatEngineeringValue(results.tSink, precision, false)}°C
 - Device Case: ${formatEngineeringValue(results.tCase, precision, false)}°C
 - Silicon Junction: ${formatEngineeringValue(results.tJunction, precision, false)}°C (Max Limit: ${maxJunctionT}°C, Margin: ${formatEngineeringValue(results.tempMargin, precision, false)}°C)
Status: ${results.thermalStatus.toUpperCase()}
Extrusion Weight: ${formatEngineeringValue(results.massPerMeter, precision, false)} kg/m (${formatEngineeringValue(results.heatsinkPieceWeight_g, precision, false)} g/piece)`;

    navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-[var(--bg-0)] text-slate-100 select-none font-sans overflow-hidden">
      
      {/* Header Bar */}
      <div className="border-b border-white/10 bg-[var(--bg-1)]/90 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--cyan-glow)] border border-[var(--cyan)]/40 flex items-center justify-center text-[var(--cyan)] shadow-lg ">
            <Flame size={22} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black tracking-tight text-white uppercase">
                {t12(lang, 'Aluminum Heat Sink & Thermal Management Studio', 'Alüminyum Soğutucu & Termal Yönetim')}
              </h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-orange-500/20 text-orange-300 border border-orange-500/30">
                Junction-to-Ambient RC Model
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              {t12(lang, 'Extruded Fin Geometry, Thermal Resistance (R_th), Junction Temp (T_j) & Forced Air Flow', 'Ekstrüzyon Kanat Geometrisi, Termal Direnç (R_th), Çip Sıcaklığı (T_j) ve Fanlı Soğutma')}
            </p>
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Preset Selector */}
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5">
            <Cpu size={14} className="text-cyan-400" />
            <select
              value={selectedPresetId}
              onChange={(e) => handlePresetChange(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-200 outline-none cursor-pointer"
            >
              {DEVICE_PRESETS.map((p) => (
                <option key={p.id} value={p.id} className="bg-[var(--bg-2)] text-white">
                  {t12(lang, p.nameEn, p.nameTr)}
                </option>
              ))}
            </select>
          </div>

          {/* Cooling Mode Toggle */}
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 text-xs font-bold font-mono">
            <button
              onClick={() => setCoolingMode('natural')}
              className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 ${coolingMode === 'natural' ? 'bg-orange-500 text-slate-950 shadow-md font-black' : 'text-slate-400 hover:text-white'}`}
            >
              <Wind size={13} /> {t12(lang, 'NATURAL AIR', 'DOĞAL TAŞINIM')}
            </button>
            <button
              onClick={() => setCoolingMode('forced')}
              className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 ${coolingMode === 'forced' ? 'bg-orange-500 text-slate-950 shadow-md font-black' : 'text-slate-400 hover:text-white'}`}
            >
              <Fan size={13} /> {t12(lang, 'FORCED FAN', 'CEBRİ / FANLI')}
            </button>
          </div>

          {/* Copy Button */}
          <button
            onClick={handleCopyReport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-slate-300 transition-all"
          >
            {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            <span>{copied ? (t12(lang, 'Copied', 'Kopyalandı')) : (t12(lang, 'Copy Report', 'Rapor Kopyala'))}</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-white/10 bg-[var(--bg-0)] px-6 gap-2 overflow-x-auto custom-scrollbar">
        {[
          { id: 'thermal', labelTr: '1. Termal Devre & Çip Sıcaklığı (T_j)', labelEn: '1. Thermal Circuit & Junction (T_j)', icon: Thermometer },
          { id: 'geometry', labelTr: '2. Fin Geometrisi & Isı Haritası', labelEn: '2. Fin Geometry & Heatmap', icon: Sliders },
          { id: 'airflow', labelTr: '3. Fan & Hava Hızı Analizi', labelEn: '3. Fan & Airflow Analysis', icon: Fan },
          { id: 'extrusion', labelTr: '4. Ekstrüzyon Ağırlık & Metraj', labelEn: '4. Extrusion Mass & Metraj', icon: Scale },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 py-3 px-4 text-xs font-bold transition-all border-b-2 whitespace-nowrap ${
                isActive
                  ? 'border-orange-400 text-orange-300 bg-orange-500/10'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <Icon size={16} className={isActive ? 'text-orange-400' : 'text-slate-500'} />
              <span>{t12(lang, tab.labelEn, tab.labelTr)}</span>
            </button>
          );
        })}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-[var(--bg-0)]">
        <div className="max-w-7xl mx-auto space-y-6">

          {/* TAB 1: THERMAL CIRCUIT & JUNCTION TEMPERATURE */}
          {activeTab === 'thermal' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Inputs */}
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-[var(--bg-1)] border border-white/10 rounded-2xl p-5 space-y-4 shadow-xl">
                  <h3 className="text-xs font-black tracking-wider text-orange-400 uppercase flex items-center gap-2">
                    <Zap size={16} /> {t12(lang, 'HEAT SOURCE & AMBIENT', 'ISI KAYNAĞI VE ORTAM PARAMETRELERİ')}
                  </h3>

                  {/* Power Dissipation */}
                  <div>
                    <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1.5">
                      <span>{t12(lang, 'Heat Power (P)', 'Harcanan Isı Gücü (P)')}</span>
                      <span className="font-mono text-orange-300 font-bold">{power} W</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="500"
                      step="1"
                      value={power}
                      onChange={(e) => setPower(Number(e.target.value))}
                      className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[var(--cyan)]"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                      <span>1 W</span>
                      <span>250 W</span>
                      <span>500 W</span>
                    </div>
                  </div>

                  {/* Ambient Temperature */}
                  <div>
                    <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1.5">
                      <span>{t12(lang, 'Ambient Temperature (T_amb)', 'Ortam / Kutu İçi Sıcaklığı (T_amb)')}</span>
                      <span className="font-mono text-cyan-300 font-bold">{ambientTemp} °C</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="75"
                      step="1"
                      value={ambientTemp}
                      onChange={(e) => setAmbientTemp(Number(e.target.value))}
                      className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[var(--cyan)]"
                    />
                  </div>

                  {/* Thermal Resistance Breakdown Inputs */}
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/5">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                        {t12(lang, 'Junction-Case (R_jc)', 'Çip-Kılıf Direnci (R_jc)')}
                      </label>
                      <div className="flex items-center gap-2 bg-[var(--bg-0)] border border-white/10 rounded-xl px-3 py-2">
                        <input
                          type="number"
                          step="0.05"
                          min="0.01"
                          max="10"
                          value={rJc}
                          onChange={(e) => setRJc(Number(e.target.value))}
                          className="w-full bg-transparent text-sm font-mono font-bold text-white outline-none"
                        />
                        <span className="text-xs text-slate-500 font-bold">°C/W</span>
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                        {t12(lang, 'TIM Pad / Paste (R_cs)', 'Termal Ped / Macun (R_cs)')}
                      </label>
                      <div className="flex items-center gap-2 bg-[var(--bg-0)] border border-white/10 rounded-xl px-3 py-2">
                        <input
                          type="number"
                          step="0.05"
                          min="0.01"
                          max="5"
                          value={rCs}
                          onChange={(e) => setRCs(Number(e.target.value))}
                          className="w-full bg-transparent text-sm font-mono font-bold text-white outline-none"
                        />
                        <span className="text-xs text-slate-500 font-bold">°C/W</span>
                      </div>
                    </div>
                  </div>

                  {/* Max Junction Temperature Limit */}
                  <div>
                    <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1.5">
                      <span>{t12(lang, 'Max Allowed Junction Temp (T_j,max)', 'Maksimum İzin Verilen Çip Sıcaklığı (T_j,max)')}</span>
                      <span className="font-mono text-rose-400 font-bold">{maxJunctionT} °C</span>
                    </div>
                    <input
                      type="range"
                      min="75"
                      max="175"
                      step="5"
                      value={maxJunctionT}
                      onChange={(e) => setMaxJunctionT(Number(e.target.value))}
                      className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[var(--cyan)]"
                    />
                  </div>

                  {/* Material Selector */}
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                      {t12(lang, 'Heatsink Material', 'Soğutucu Malzemesi')}
                    </label>
                    <select
                      value={selectedMaterialId}
                      onChange={(e) => setSelectedMaterialId(e.target.value)}
                      className="w-full bg-[var(--bg-0)] border border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-white outline-none cursor-pointer"
                    >
                      {THERMAL_MATERIALS.map((m) => (
                        <option key={m.id} value={m.id} className="bg-[var(--bg-2)]">
                          {t12(lang, m.nameEn, m.nameTr)} (k = {m.k} W/m·K)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Outputs Column: Thermal Cascade & Status */}
              <div className="lg:col-span-7 space-y-4">
                {/* Critical Thermal Status Banner */}
                <div className={`p-5 rounded-2xl border shadow-xl transition-all ${
                  results.thermalStatus === 'safe'
                    ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                    : results.thermalStatus === 'warning'
                    ? 'bg-amber-950/40 border-amber-500/50 text-amber-200'
                    : 'bg-rose-950/60 border-rose-500/70 text-rose-100 animate-pulse'
                }`}>
                  <div className="flex items-center gap-3">
                    {results.thermalStatus === 'safe' ? (
                      <CheckCircle2 size={32} className="text-emerald-400 shrink-0" />
                    ) : (
                      <AlertTriangle size={32} className={results.thermalStatus === 'warning' ? 'text-amber-400 shrink-0' : 'text-rose-400 shrink-0'} />
                    )}
                    <div>
                      <h4 className="text-sm font-black tracking-wide uppercase">
                        {results.thermalStatus === 'safe' 
                          ? (t12(lang, 'THERMAL SAFE — Junction Within Spec', 'TERMAL GÜVENLİ — Çip İzin Verilen Sınırların Altında'))
                          : results.thermalStatus === 'warning'
                          ? (t12(lang, 'THERMAL WARNING — Low Safety Margin (<15°C)', 'TERMAL UYARI — Emniyet Marjı Düşük (<15°C)'))
                          : (t12(lang, 'CRITICAL THERMAL OVERHEAT! (T_j > T_j,max)', 'KRİTİK TERMAL AŞIRI ISINMA! (T_j > T_j,max)'))}
                      </h4>
                      <p className="text-xs mt-1 text-slate-300">
                        {t12(lang, `Silicon junction: ${formatEngineeringValue(results.tJunction, precision, false)}°C (Max limit ${maxJunctionT}°C, Headroom: ${formatEngineeringValue(results.tempMargin, precision, false)}°C)`, `Silikon çip sıcaklığı: ${formatEngineeringValue(results.tJunction, precision, false)}°C (Maksimum sınır ${maxJunctionT}°C, Kalan marj: ${formatEngineeringValue(results.tempMargin, precision, false)}°C)`)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Thermal Cascade (Junction -> Case -> Sink -> Ambient) */}
                <div className="bg-[var(--bg-1)] border border-white/10 rounded-2xl p-5 shadow-2xl">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Activity size={16} className="text-orange-400" />
                    {t12(lang, 'THERMAL RESISTANCE & TEMPERATURE CASCADE', 'TERMAL DİRENÇ VE SICAKLIK KADEMESİ')}
                  </h3>

                  <div className="grid grid-cols-4 gap-2 text-center">
                    {/* Junction */}
                    <div className="bg-[var(--bg-0)] p-3 rounded-xl border border-rose-500/30">
                      <div className="text-[10px] font-bold text-rose-400 uppercase">{t12(lang, 'Junction (T_j)', 'Çip (T_j)')}</div>
                      <div className="text-2xl font-black font-mono text-white mt-1">{formatEngineeringValue(results.tJunction, precision, false)}°C</div>
                      <div className="text-[9px] text-slate-500 font-mono mt-1">R_jc: {rJc} °C/W</div>
                    </div>

                    {/* Case */}
                    <div className="bg-[var(--bg-0)] p-3 rounded-xl border border-orange-500/30">
                      <div className="text-[10px] font-bold text-orange-400 uppercase">{t12(lang, 'Case (T_case)', 'Kılıf (T_case)')}</div>
                      <div className="text-2xl font-black font-mono text-orange-300 mt-1">{formatEngineeringValue(results.tCase, precision, false)}°C</div>
                      <div className="text-[9px] text-slate-500 font-mono mt-1">R_cs: {rCs} °C/W</div>
                    </div>

                    {/* Heat Sink */}
                    <div className="bg-[var(--bg-0)] p-3 rounded-xl border border-amber-500/30">
                      <div className="text-[10px] font-bold text-amber-400 uppercase">{t12(lang, 'Sink (T_sink)', 'Soğutucu (T_sink)')}</div>
                      <div className="text-2xl font-black font-mono text-amber-300 mt-1">{formatEngineeringValue(results.tSink, precision, false)}°C</div>
                      <div className="text-[9px] text-slate-500 font-mono mt-1">R_sa: {formatEngineeringValue(results.rSa, precision, false)}</div>
                    </div>

                    {/* Ambient */}
                    <div className="bg-[var(--bg-0)] p-3 rounded-xl border border-cyan-500/30">
                      <div className="text-[10px] font-bold text-cyan-400 uppercase">{t12(lang, 'Ambient (T_amb)', 'Ortam (T_amb)')}</div>
                      <div className="text-2xl font-black font-mono text-cyan-300 mt-1">{ambientTemp}°C</div>
                      <div className="text-[9px] text-slate-500 font-mono mt-1">Ref. Base</div>
                    </div>
                  </div>

                  {/* Summary KPI Cards */}
                  <div className="grid grid-cols-3 gap-3 mt-4">
                    <div className="bg-[var(--bg-0)] p-3 rounded-xl border border-white/5">
                      <div className="text-[10px] text-slate-400 uppercase font-bold">{t12(lang, 'Heatsink R_sa', 'Soğutucu R_th (R_sa)')}</div>
                      <div className="text-xl font-bold font-mono text-orange-300 mt-1">{formatEngineeringValue(results.rSa, precision, false)} <span className="text-xs">°C/W</span></div>
                    </div>

                    <div className="bg-[var(--bg-0)] p-3 rounded-xl border border-white/5">
                      <div className="text-[10px] text-slate-400 uppercase font-bold">{t12(lang, 'Total System R_th', 'Toplam R_th (Sistem)')}</div>
                      <div className="text-xl font-bold font-mono text-white mt-1">{formatEngineeringValue(results.rTotal, precision, false)} <span className="text-xs">°C/W</span></div>
                    </div>

                    <div className="bg-[var(--bg-0)] p-3 rounded-xl border border-white/5">
                      <div className="text-[10px] text-slate-400 uppercase font-bold">{t12(lang, 'Fin Efficiency (η)', 'Kanat Verimi (η_fin)')}</div>
                      <div className="text-xl font-bold font-mono text-emerald-400 mt-1">{formatEngineeringValue((results.finEfficiency * 100), precision, false)}%</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: FIN GEOMETRY & 2D CAD THERMAL HEATMAP */}
          {activeTab === 'geometry' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Geometry Dimensions Input */}
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-[var(--bg-1)] border border-white/10 rounded-2xl p-5 space-y-4 shadow-xl">
                  <h3 className="text-xs font-black tracking-wider text-orange-400 uppercase flex items-center gap-2">
                    <Sliders size={16} /> {t12(lang, 'FIN & BASE GEOMETRY (MM)', 'KANAT & TABAN GEOMETRİSİ (MM)')}
                  </h3>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                        {t12(lang, 'Base Width (W)', 'Taban Genişliği (W)')}
                      </label>
                      <input
                        type="number"
                        min="20"
                        max="500"
                        value={baseWidth}
                        onChange={(e) => setBaseWidth(Number(e.target.value))}
                        className="w-full bg-[var(--bg-0)] border border-white/10 rounded-xl px-3 py-2 text-sm font-mono font-bold text-white outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                        {t12(lang, 'Profile Length (L)', 'Profil Boyu (L)')}
                      </label>
                      <input
                        type="number"
                        min="20"
                        max="1000"
                        value={baseLength}
                        onChange={(e) => setBaseLength(Number(e.target.value))}
                        className="w-full bg-[var(--bg-0)] border border-white/10 rounded-xl px-3 py-2 text-sm font-mono font-bold text-white outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                        {t12(lang, 'Base Thickness (t_b)', 'Taban Et Kalınlığı (t_b)')}
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        min="2"
                        max="30"
                        value={baseThickness}
                        onChange={(e) => setBaseThickness(Number(e.target.value))}
                        className="w-full bg-[var(--bg-0)] border border-white/10 rounded-xl px-3 py-2 text-sm font-mono font-bold text-white outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                        {t12(lang, 'Fin Height (H)', 'Kanat Yüksekliği (H)')}
                      </label>
                      <input
                        type="number"
                        min="5"
                        max="120"
                        value={finHeight}
                        onChange={(e) => setFinHeight(Number(e.target.value))}
                        className="w-full bg-[var(--bg-0)] border border-white/10 rounded-xl px-3 py-2 text-sm font-mono font-bold text-white outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                        {t12(lang, 'Fin Thickness (t_f)', 'Kanat Kalınlığı (t_f)')}
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0.5"
                        max="10"
                        value={finThickness}
                        onChange={(e) => setFinThickness(Number(e.target.value))}
                        className="w-full bg-[var(--bg-0)] border border-white/10 rounded-xl px-3 py-2 text-sm font-mono font-bold text-white outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                        {t12(lang, 'Number of Fins (N)', 'Kanat Sayısı (N)')}
                      </label>
                      <input
                        type="number"
                        min="2"
                        max="60"
                        value={finCount}
                        onChange={(e) => setFinCount(Number(e.target.value))}
                        className="w-full bg-[var(--bg-0)] border border-white/10 rounded-xl px-3 py-2 text-sm font-mono font-bold text-white outline-none"
                      />
                    </div>
                  </div>

                  <div className="bg-[var(--bg-0)] p-3 rounded-xl border border-white/5 text-xs space-y-1">
                    <div className="flex justify-between text-slate-400">
                      <span>{t12(lang, 'Fin Air Gap Spacing:', 'Kanatlar Arası Boşluk (Pitch/Space):')}</span>
                      <span className="font-mono font-bold text-cyan-300">{formatEngineeringValue(results.finSpacing_mm, precision, false)} mm</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>{t12(lang, 'Total Surface Area:', 'Toplam Yüzey Alanı:')}</span>
                      <span className="font-mono font-bold text-slate-200">{formatEngineeringValue(results.aTotalSurface_cm2, precision, false)} cm²</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>{t12(lang, 'Effective Cooling Area:', 'Efektif Soğutma Alanı:')}</span>
                      <span className="font-mono font-bold text-orange-300">{formatEngineeringValue(results.aEff_cm2, precision, false)} cm²</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Interactive 2D Vector CAD View with Thermal Gradient */}
              <div className="lg:col-span-7 space-y-4">
                <div className="bg-[var(--bg-1)] border border-white/10 rounded-2xl p-5 shadow-2xl">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      {t12(lang, '2D FIN CROSS-SECTION & THERMAL GRADIENT', '2D KANAT KESİTİ & TERMAL ISI DAĞILIMI')}
                    </span>
                    <span className="text-xs font-mono font-bold text-orange-400">
                      T_sink: {formatEngineeringValue(results.tSink, precision, false)}°C
                    </span>
                  </div>

                  {/* CAD SVG Canvas */}
                  <div className="h-72 w-full bg-[var(--bg-0)] rounded-xl border border-white/5 flex items-center justify-center p-4">
                    {(() => {
                      const svgW = 440;
                      const svgH = 220;
                      const totalH_mm = baseThickness + finHeight;
                      const scale = Math.min((svgW - 60) / baseWidth, (svgH - 60) / totalH_mm);

                      const renderW = baseWidth * scale;
                      const renderH = totalH_mm * scale;
                      const renderTb = baseThickness * scale;
                      const renderFh = finHeight * scale;
                      const renderTf = Math.max(2, finThickness * scale);

                      const startX = (svgW - renderW) / 2;
                      const startY = (svgH - renderH) / 2;
                      const baseTopY = startY + renderH - renderTb;

                      return (
                        <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-full">
                          <defs>
                            {/* Thermal Heatmap Gradient: Red/Orange at base to Cyan/Blue at fin tip */}
                            <linearGradient id="finThermalGrad" x1="0%" y1="100%" x2="0%" y2="0%">
                              <stop offset="0%" stopColor="#ef4444" />
                              <stop offset="35%" stopColor="#f97316" />
                              <stop offset="70%" stopColor="#eab308" />
                              <stop offset="100%" stopColor="#06b6d4" />
                            </linearGradient>
                            <linearGradient id="baseHeatGrad" x1="0%" y1="100%" x2="0%" y2="0%">
                              <stop offset="0%" stopColor="#dc2626" />
                              <stop offset="100%" stopColor="#ef4444" />
                            </linearGradient>
                          </defs>

                          {/* Base Plate */}
                          <rect
                            x={startX}
                            y={baseTopY}
                            width={renderW}
                            height={renderTb}
                            fill="url(#baseHeatGrad)"
                            stroke="#fca5a5"
                            strokeWidth="1"
                            rx="1"
                          />

                          {/* Fins Array */}
                          {Array.from({ length: finCount }).map((_, i) => {
                            const finX = finCount > 1 
                              ? startX + (i * (renderW - renderTf)) / (finCount - 1)
                              : startX + (renderW - renderTf) / 2;
                            const finY = baseTopY - renderFh;

                            return (
                              <rect
                                key={i}
                                x={finX}
                                y={finY}
                                width={renderTf}
                                height={renderFh}
                                fill="url(#finThermalGrad)"
                                stroke="#fde047"
                                strokeWidth="0.8"
                                rx="1"
                              />
                            );
                          })}

                          {/* Heat Source (Chip/Transistor) Below Base */}
                          <rect
                            x={startX + renderW / 2 - 25}
                            y={baseTopY + renderTb + 2}
                            width="50"
                            height="8"
                            fill="#b91c1c"
                            stroke="#f87171"
                            strokeWidth="1"
                            rx="2"
                          />
                          <text
                            x={startX + renderW / 2}
                            y={baseTopY + renderTb + 8}
                            fill="#fff"
                            fontSize="6"
                            fontWeight="bold"
                            textAnchor="middle"
                            fontFamily="monospace"
                          >
                            HEAT SOURCE ({power}W)
                          </text>

                          {/* Dimension Annotations */}
                          {/* Width Dimension */}
                          <line x1={startX} y1={baseTopY + renderTb + 18} x2={startX + renderW} y2={baseTopY + renderTb + 18} stroke="#64748b" strokeWidth="1" />
                          <text x={startX + renderW / 2} y={baseTopY + renderTb + 26} fill="#94a3b8" fontSize="8" textAnchor="middle" fontFamily="monospace">
                            W = {baseWidth} mm
                          </text>

                          {/* Height Dimension */}
                          <line x1={startX - 10} y1={baseTopY - renderFh} x2={startX - 10} y2={baseTopY + renderTb} stroke="#64748b" strokeWidth="1" />
                          <text x={startX - 14} y={baseTopY - renderFh / 2} fill="#94a3b8" fontSize="8" textAnchor="end" fontFamily="monospace">
                            H = {finHeight + baseThickness} mm
                          </text>
                        </svg>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: FAN & AIRFLOW ANALYSIS (FORCED CONVECTION) */}
          {activeTab === 'airflow' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-[var(--bg-1)] border border-white/10 rounded-2xl p-5 space-y-4 shadow-xl">
                  <h3 className="text-xs font-black tracking-wider text-cyan-400 uppercase flex items-center gap-2">
                    <Fan size={16} /> {t12(lang, 'FAN & AIR VELOCITY', 'FAN VE HAVA AKIŞ PARAMETRELERİ')}
                  </h3>

                  {/* Air Velocity Slider */}
                  <div>
                    <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1.5">
                      <span>{t12(lang, 'Air Velocity (v)', 'Kanatlar Arası Hava Hızı (v)')}</span>
                      <span className="font-mono text-cyan-300 font-bold">{formatEngineeringValue(airVelocity, precision, false)} m/s</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="10.0"
                      step="0.1"
                      value={airVelocity}
                      onChange={(e) => {
                        setAirVelocity(Number(e.target.value));
                        setCoolingMode('forced');
                      }}
                      className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[var(--cyan)]"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                      <span>0.5 m/s (Sessiz Fan)</span>
                      <span>5 m/s (Endüstriyel)</span>
                      <span>10 m/s (Blower)</span>
                    </div>
                  </div>

                  {/* Convection Coefficient h Output */}
                  <div className="bg-[var(--bg-0)] p-3 rounded-xl border border-white/5 space-y-2 text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>{t12(lang, 'Heat Transfer Coeff (h):', 'Taşınım Katsayısı (h):')}</span>
                      <span className="font-mono font-bold text-cyan-300">{formatEngineeringValue(results.h, precision, false)} W/m²·K</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>{t12(lang, 'Boost vs Natural Air:', 'Doğal Taşınıma Göre Kazanç:')}</span>
                      <span className="font-mono font-bold text-emerald-400">{formatEngineeringValue((results.h / 9.5), precision, false)}x Daha Hızlı</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Fan Performance Curve & Headroom */}
              <div className="lg:col-span-7 space-y-4">
                <div className="bg-[var(--bg-1)] border border-white/10 rounded-2xl p-5 shadow-2xl">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Wind size={16} className="text-cyan-400" />
                    {t12(lang, 'AIR VELOCITY VS THERMAL RESISTANCE CURVE', 'HAVA HIZI VS TERMAL DİRENÇ (R_sa) EĞRİSİ')}
                  </h3>

                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="bg-[var(--bg-0)] p-3 rounded-xl border border-white/5">
                      <div className="text-[10px] text-slate-400 uppercase font-bold">{t12(lang, '1.0 m/s Fan R_sa', '1.0 m/s Fanlı R_sa')}</div>
                      <div className="text-lg font-bold font-mono text-cyan-300 mt-1">
                        {formatEngineeringValue((1 / ((10.45 * Math.pow(1.0, 0.8) + 6) * (results.aEff_cm2 / 10000))), precision, false)} °C/W
                      </div>
                    </div>
                    <div className="bg-[var(--bg-0)] p-3 rounded-xl border border-cyan-500/30">
                      <div className="text-[10px] text-cyan-400 uppercase font-bold">{formatEngineeringValue(airVelocity, precision, false)} m/s (Seçili)</div>
                      <div className="text-lg font-bold font-mono text-white mt-1">
                        {formatEngineeringValue(results.rSa, precision, false)} °C/W
                      </div>
                    </div>
                    <div className="bg-[var(--bg-0)] p-3 rounded-xl border border-white/5">
                      <div className="text-[10px] text-slate-400 uppercase font-bold">{t12(lang, '5.0 m/s Fan R_sa', '5.0 m/s Fanlı R_sa')}</div>
                      <div className="text-lg font-bold font-mono text-emerald-400 mt-1">
                        {formatEngineeringValue((1 / ((10.45 * Math.pow(5.0, 0.8) + 6) * (results.aEff_cm2 / 10000))), precision, false)} °C/W
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: EXTRUSION MASS & METRAJ */}
          {activeTab === 'extrusion' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-6 space-y-4">
                <div className="bg-[var(--bg-1)] border border-white/10 rounded-2xl p-5 shadow-xl space-y-4">
                  <h3 className="text-xs font-black tracking-wider text-purple-400 uppercase flex items-center gap-2">
                    <Scale size={16} /> {t12(lang, 'EXTRUSION PROFILE PROPERTIES', 'ALÜMİNYUM EKSTRÜZYON PROFİL ÖZELLİKLERİ')}
                  </h3>

                  <div className="space-y-3">
                    <div className="flex justify-between p-3 bg-[var(--bg-0)] rounded-xl border border-white/5 text-xs">
                      <span className="text-slate-400">{t12(lang, 'Cross-Section Area (A):', 'Profil Kesit Alanı (A):')}</span>
                      <span className="font-mono font-bold text-white">{formatEngineeringValue(results.crossSectionArea_mm2, precision, false)} mm²</span>
                    </div>

                    <div className="flex justify-between p-3 bg-[var(--bg-0)] rounded-xl border border-white/5 text-xs">
                      <span className="text-slate-400">{t12(lang, 'Linear Mass per Meter (m\\\'):', 'Metre Ağırlığı (m\\\'):')}</span>
                      <span className="font-mono font-bold text-cyan-300">{formatEngineeringValue(results.massPerMeter, precision, false)} kg/m</span>
                    </div>

                    <div className="flex justify-between p-3 bg-[var(--bg-0)] rounded-xl border border-purple-500/30 text-xs">
                      <span className="text-slate-300 font-semibold">{t12(lang, 'Piece Mass (L=' + baseLength + 'mm):', 'Soğutucu Parça Ağırlığı (L=' + baseLength + 'mm):')}</span>
                      <span className="font-mono font-bold text-purple-300 text-sm">{formatEngineeringValue(results.heatsinkPieceWeight_g, precision, false)} gram</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-6 space-y-4">
                <div className="bg-[var(--bg-1)] border border-white/10 rounded-2xl p-5 shadow-2xl space-y-3">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <Info size={16} className="text-cyan-400" />
                    {t12(lang, 'ALUMINUM EXTRUSION DESIGN RULES', 'ALÜMİNYUM EKSTRÜZYON TASARIM KURALLARI')}
                  </h3>
                  <ul className="list-disc list-inside space-y-1.5 text-xs text-slate-400 leading-relaxed">
                    <li>{t12(lang, 'Fin aspect ratio (thickness to height) should generally remain under 1:12 for die tool life.', 'Kanat kalınlığı / yükseklik oranı (Aspect Ratio) ekstrüzyon kalıp ömrü için genelde 1:10 ile 1:15 arasında tutulmalıdır.')}</li>
                    <li>{t12(lang, 'Base thickness should be substantial to avoid spreading bottleneck under concentrated die.', 'Taban et kalınlığı (t_b), ısının tüm kanatlara homojen yayılması için çipin en az 1/3 kalınlığında olmalıdır.')}</li>
                    <li>{t12(lang, 'Natural convection needs 8-12 mm air gaps; forced fan allows 2-5 mm tight fin spacing.', 'Doğal taşınımda kanat aralığı 8-12 mm; fanlı soğutmada 2-5 mm idealdir.')}</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

