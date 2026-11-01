'use client';

import React, { useState, useMemo } from 'react';
import { 
  Wind, 
  Flame, 
  Snowflake, 
  Building2, 
  Users, 
  Cpu, 
  Sun, 
  Thermometer, 
  DollarSign, 
  Layers, 
  Activity, 
  Copy, 
  Check, 
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Info,
  Fan
} from 'lucide-react';
import { useI18nStore } from '@/store/i18nStore';
import { t12 } from '@/locales/t12';
import { useGlobalPrecision, formatEngineeringValue } from '@/components/calculator-kit/precisionUtils';

interface ClimatePreset {
  id: string;
  nameEn: string;
  nameTr: string;
  tSummer: number; // Summer Design Outside Temp (°C)
  tWinter: number; // Winter Design Outside Temp (°C)
  rhSummer: number; // %
}

const CLIMATE_PRESETS: ClimatePreset[] = [
  { id: 'istanbul', nameEn: 'Istanbul / Marmara (Moderate Sea)', nameTr: 'İstanbul / Marmara (Ilıman Denizel)', tSummer: 35, tWinter: 0, rhSummer: 60 },
  { id: 'ankara', nameEn: 'Ankara / Central Anatolia (Continental)', nameTr: 'Ankara / İç Anadolu (Karasal)', tSummer: 36, tWinter: -12, rhSummer: 40 },
  { id: 'izmir', nameEn: 'Izmir / Aegean (Hot Summer)', nameTr: 'İzmir / Ege (Sıcak Akdeniz)', tSummer: 38, tWinter: 3, rhSummer: 50 },
  { id: 'antalya', nameEn: 'Antalya / Mediterranean (Very Hot & Humid)', nameTr: 'Antalya / Akdeniz (Çok Sıcak & Nemli)', tSummer: 42, tWinter: 5, rhSummer: 70 },
  { id: 'erzurum', nameEn: 'Erzurum / Eastern Highs (Cold Winter)', nameTr: 'Erzurum / Doğu Anadolu (Sert Kış)', tSummer: 32, tWinter: -25, rhSummer: 35 },
  { id: 'dubai', nameEn: 'Dubai / Middle East (Extreme Hot)', nameTr: 'Dubai / Körfez (Aşırı Çöl Sıcağı)', tSummer: 48, tWinter: 15, rhSummer: 65 },
  { id: 'frankfurt', nameEn: 'Frankfurt / Central Europe', nameTr: 'Frankfurt / Orta Avrupa', tSummer: 32, tWinter: -10, rhSummer: 50 },
];

interface SpaceUsagePreset {
  id: string;
  nameEn: string;
  nameTr: string;
  tSetSummer: number;
  tSetWinter: number;
  occupantDensity: number; // m² per person
  sensibleHeatPerson: number; // W
  latentHeatPerson: number; // W
  lightingPowerDensity: number; // W/m²
  equipmentPowerDensity: number; // W/m²
  achFreshAir: number; // Air changes per hour for ventilation
}

const SPACE_PRESETS: SpaceUsagePreset[] = [
  { id: 'office', nameEn: 'Commercial Office / Open Work', nameTr: 'Ticari Ofis / Açık Çalışma', tSetSummer: 24, tSetWinter: 21, occupantDensity: 10, sensibleHeatPerson: 75, latentHeatPerson: 55, lightingPowerDensity: 12, equipmentPowerDensity: 15, achFreshAir: 1.5 },
  { id: 'residential', nameEn: 'Residential Living Room', nameTr: 'Konut / Daire Oturma Alanı', tSetSummer: 24, tSetWinter: 22, occupantDensity: 25, sensibleHeatPerson: 70, latentHeatPerson: 45, lightingPowerDensity: 6, equipmentPowerDensity: 5, achFreshAir: 0.8 },
  { id: 'restaurant', nameEn: 'Restaurant / Cafe Dining', nameTr: 'Restoran / Kafe Yemek Salonu', tSetSummer: 23, tSetWinter: 21, occupantDensity: 2.5, sensibleHeatPerson: 85, latentHeatPerson: 75, lightingPowerDensity: 18, equipmentPowerDensity: 25, achFreshAir: 3.5 },
  { id: 'server_room', nameEn: 'Server / Data Center (24/7)', nameTr: 'Sunucu Odası / Data Center (7/24)', tSetSummer: 20, tSetWinter: 20, occupantDensity: 100, sensibleHeatPerson: 75, latentHeatPerson: 20, lightingPowerDensity: 8, equipmentPowerDensity: 350, achFreshAir: 0.5 },
  { id: 'factory', nameEn: 'Industrial Assembly Workshop', nameTr: 'Endüstriyel İmalat / Montaj Atölyesi', tSetSummer: 26, tSetWinter: 18, occupantDensity: 20, sensibleHeatPerson: 110, latentHeatPerson: 100, lightingPowerDensity: 15, equipmentPowerDensity: 40, achFreshAir: 2.0 },
];

export default function HvacLoadModule({ lang: propLang }: { lang?: string }) {
  const precision = useGlobalPrecision();
  const { language: storeLang } = useI18nStore();
  const lang = propLang || storeLang || 'tr';

  // --- Active Tab ---
  const [activeTab, setActiveTab] = useState<'total' | 'envelope' | 'ventilation' | 'energy'>('total');
  const [copied, setCopied] = useState(false);

  // --- Presets ---
  const [selectedClimateId, setSelectedClimateId] = useState<string>('istanbul');
  const [selectedSpaceId, setSelectedSpaceId] = useState<string>('office');
  const [seasonMode, setSeasonMode] = useState<'cooling' | 'heating'>('cooling');

  const climate = useMemo(() => {
    return CLIMATE_PRESETS.find(c => c.id === selectedClimateId) || CLIMATE_PRESETS[0];
  }, [selectedClimateId]);

  const space = useMemo(() => {
    return SPACE_PRESETS.find(s => s.id === selectedSpaceId) || SPACE_PRESETS[0];
  }, [selectedSpaceId]);

  // --- Room & Building Dimensions ---
  const [floorArea, setFloorArea] = useState<number>(100); // m²
  const [ceilingHeight, setCeilingHeight] = useState<number>(3.0); // m
  const [windowWallRatio, setWindowWallRatio] = useState<number>(20); // % window ratio on facade

  // --- Envelope Thermal Transmittance (U-Values W/m²K) ---
  const [wallU, setWallU] = useState<number>(0.35); // Exterior wall (TS 825 insulated)
  const [windowU, setWindowU] = useState<number>(1.6); // Double glazed Low-E
  const [roofU, setRoofU] = useState<number>(0.25); // Insulated roof
  const [floorU, setFloorU] = useState<number>(0.40); // Slab on ground / floor

  // --- Temperatures ---
  const [tOutside, setTOutside] = useState<number>(climate.tSummer);
  const [tInside, setTInside] = useState<number>(space.tSetSummer);

  // --- Occupancy & Internal Loads ---
  const calculatedOccupants = Math.max(1, Math.round(floorArea / space.occupantDensity));
  const [occupants, setOccupants] = useState<number>(calculatedOccupants);
  const [customEquipmentW, setCustomEquipmentW] = useState<number>(Math.round(floorArea * space.equipmentPowerDensity));
  const [customLightingW, setCustomLightingW] = useState<number>(Math.round(floorArea * space.lightingPowerDensity));
  const [airChanges, setAirChanges] = useState<number>(space.achFreshAir);

  // --- Energy & Operating Cost Parameters ---
  const [seer, setSeer] = useState<number>(6.5); // A++ Inverter SEER
  const [scop, setScop] = useState<number>(4.2); // A+ Heat Pump SCOP
  const [operatingHoursPerDay, setOperatingHoursPerDay] = useState<number>(10);
  const [operatingDaysPerYear, setOperatingDaysPerYear] = useState<number>(250);
  const [electricityPricePerKwh, setElectricityPricePerKwh] = useState<number>(0.14); // $/kWh or TL

  // Sync climate preset changes
  const handleClimateChange = (id: string) => {
    setSelectedClimateId(id);
    const c = CLIMATE_PRESETS.find(p => p.id === id);
    if (c) {
      setTOutside(seasonMode === 'cooling' ? c.tSummer : c.tWinter);
    }
  };

  // Sync space preset changes
  const handleSpaceChange = (id: string) => {
    setSelectedSpaceId(id);
    const s = SPACE_PRESETS.find(p => p.id === id);
    if (s) {
      setTInside(seasonMode === 'cooling' ? s.tSetSummer : s.tSetWinter);
      setAirChanges(s.achFreshAir);
      setCustomEquipmentW(Math.round(floorArea * s.equipmentPowerDensity));
      setCustomLightingW(Math.round(floorArea * s.lightingPowerDensity));
      setOccupants(Math.max(1, Math.round(floorArea / s.occupantDensity)));
    }
  };

  // Sync season switch
  const handleSeasonChange = (mode: 'cooling' | 'heating') => {
    setSeasonMode(mode);
    if (mode === 'cooling') {
      setTOutside(climate.tSummer);
      setTInside(space.tSetSummer);
    } else {
      setTOutside(climate.tWinter);
      setTInside(space.tSetWinter);
    }
  };

  // --- Calculations ---
  const results = useMemo(() => {
    const roomVolume = floorArea * ceilingHeight; // m³
    const perimeter = 4 * Math.sqrt(floorArea); // approx square perimeter (m)
    const grossWallArea = perimeter * ceilingHeight; // m²
    const windowArea = grossWallArea * (windowWallRatio / 100);
    const netWallArea = Math.max(0, grossWallArea - windowArea);
    const roofArea = floorArea;
    const groundFloorArea = floorArea;

    const deltaT = tOutside - tInside;
    const absDeltaT = Math.abs(deltaT);

    // 1. Transmission Losses/Gains (Q = U * A * ΔT)
    const qWall = netWallArea * wallU * absDeltaT;
    const qWindowTransmission = windowArea * windowU * absDeltaT;
    const qRoof = roofArea * roofU * absDeltaT;
    const qFloor = groundFloorArea * floorU * (absDeltaT * 0.5); // Ground has lower delta

    // Solar Radiation Gain on Glass (in cooling mode)
    // Approx 250 W/m² avg peak solar gain through standard glazing with shading
    const solarGainGlass = seasonMode === 'cooling' ? windowArea * 220 * 0.7 : 0;

    const totalTransmissionW = qWall + qWindowTransmission + qRoof + qFloor + solarGainGlass;

    // 2. Ventilation / Fresh Air Load
    // Q_sensible = 0.34 * V_dot (m³/h) * ΔT (W)
    const freshAirFlowM3h = roomVolume * airChanges; // m³/h
    const freshAirFlowCFM = freshAirFlowM3h * 0.5886; // CFM
    const qVentSensible = 0.34 * freshAirFlowM3h * absDeltaT;

    // Ventilation Latent Load (Moisture condensation in cooling)
    // Approx 30% of sensible in summer, negligible in dry winter heating
    const qVentLatent = seasonMode === 'cooling' ? qVentSensible * 0.35 : 0;
    const totalVentilationW = qVentSensible + qVentLatent;

    // 3. Internal Heat Gains (Sensible + Latent)
    const qPeopleSensible = occupants * space.sensibleHeatPerson;
    const qPeopleLatent = occupants * space.latentHeatPerson;
    const qLighting = customLightingW;
    const qEquipment = customEquipmentW;

    const totalInternalSensibleW = qPeopleSensible + qLighting + qEquipment;
    const totalInternalLatentW = qPeopleLatent;
    const totalInternalW = totalInternalSensibleW + totalInternalLatentW;

    // 4. Net Cooling / Heating Load
    let totalLoadW = 0;
    let sensibleLoadW = 0;
    let latentLoadW = 0;

    if (seasonMode === 'cooling') {
      // In cooling: Transmission + Ventilation + Internal Loads all ADD heat
      sensibleLoadW = totalTransmissionW + qVentSensible + totalInternalSensibleW;
      latentLoadW = qVentLatent + totalInternalLatentW;
      totalLoadW = sensibleLoadW + latentLoadW;
    } else {
      // In heating: Transmission + Ventilation LOSE heat. Internal loads reduce heating demand!
      const totalHeatLoss = (qWall + qWindowTransmission + qRoof + qFloor) + qVentSensible;
      // Net heating demand (accounting for internal heat credit with 0.7 safety factor)
      sensibleLoadW = Math.max(0, totalHeatLoss - (totalInternalSensibleW * 0.7));
      latentLoadW = 0;
      totalLoadW = sensibleLoadW;
    }

    const totalLoadKW = totalLoadW / 1000;
    const totalLoadBTU = totalLoadW * 3.412142; // BTU/h
    const totalTons = totalLoadBTU / 12000; // Refrigeration Tons (TR)
    const specificLoadW_m2 = totalLoadW / Math.max(1, floorArea);

    // Sensible Heat Ratio (SHR)
    const shr = totalLoadW > 0 ? sensibleLoadW / totalLoadW : 1.0;

    // Recommended HVAC Equipment Sizing
    let recommendedAcUnits = '';
    if (totalLoadBTU <= 12000) {
      recommendedAcUnits = '1x 9,000 – 12,000 BTU/h Split AC';
    } else if (totalLoadBTU <= 18000) {
      recommendedAcUnits = '1x 18,000 BTU/h Inverter Split';
    } else if (totalLoadBTU <= 24000) {
      recommendedAcUnits = '1x 24,000 BTU/h Inverter Split';
    } else if (totalLoadBTU <= 48000) {
      recommendedAcUnits = `2x 24,000 BTU/h veya 1x 48,000 BTU/h Salon Tipi / Kaset Tipi`;
    } else {
      const countVRF =formatEngineeringValue((totalLoadBTU / 24000), precision, false);
      recommendedAcUnits = `${countVRF}x 24k BTU Multi-Split veya ${formatEngineeringValue(totalTons, precision, false)} TR VRF / Chiller Merkezi Sistem`;
    }

    // Energy & Operating Cost Estimates
    const seasonalCop = seasonMode === 'cooling' ? (seer / 3.412) : scop;
    const electricalPowerKW = totalLoadKW / Math.max(1, seasonalCop);
    const annualKWh = electricalPowerKW * operatingHoursPerDay * operatingDaysPerYear * 0.65; // 0.65 part load factor
    const annualCost = annualKWh * electricityPricePerKwh;
    const monthlyCost = annualCost / 12;

    return {
      roomVolume,
      grossWallArea,
      netWallArea,
      windowArea,
      roofArea,
      groundFloorArea,
      deltaT,
      absDeltaT,
      qWall,
      qWindowTransmission,
      solarGainGlass,
      qRoof,
      qFloor,
      totalTransmissionW,
      freshAirFlowM3h,
      freshAirFlowCFM,
      qVentSensible,
      qVentLatent,
      totalVentilationW,
      qPeopleSensible,
      qPeopleLatent,
      qLighting,
      qEquipment,
      totalInternalW,
      sensibleLoadW,
      latentLoadW,
      totalLoadW,
      totalLoadKW,
      totalLoadBTU,
      totalTons,
      specificLoadW_m2,
      shr,
      recommendedAcUnits,
      seasonalCop,
      electricalPowerKW,
      annualKWh,
      annualCost,
      monthlyCost
    };
  }, [
    floorArea, ceilingHeight, windowWallRatio, wallU, windowU, roofU, floorU,
    tOutside, tInside, airChanges, occupants, space, customEquipmentW, customLightingW,
    seasonMode, seer, scop, operatingHoursPerDay, operatingDaysPerYear, electricityPricePerKwh
  ]);

  // Copy report
  const handleCopyReport = () => {
    const report = `--- ALUCALC HVAC & BUILDING THERMAL LOAD REPORT ---
Space: ${space.nameEn} (Area: ${floorArea} m², Volume: ${results.roomVolume} m³)
Climate / Location: ${climate.nameEn} (Outside: ${tOutside}°C, Inside: ${tInside}°C, ΔT: ${results.absDeltaT}°C)
Mode: ${seasonMode.toUpperCase()}
Total Thermal Capacity: ${formatEngineeringValue(results.totalLoadKW, precision, false)} kW (${Math.round(results.totalLoadBTU).toLocaleString()} BTU/h | ${formatEngineeringValue(results.totalTons, precision, false)} TR)
Specific Load: ${formatEngineeringValue(results.specificLoadW_m2, precision, false)} W/m² (SHR: ${formatEngineeringValue((results.shr * 100), precision, false)}%)
Breakdown:
 - Transmission & Solar: ${formatEngineeringValue((results.totalTransmissionW / 1000), precision, false)} kW
 - Fresh Air Ventilation: ${formatEngineeringValue((results.totalVentilationW / 1000), precision, false)} kW (${formatEngineeringValue(results.freshAirFlowM3h, precision, false)} m³/h)
 - Internal Gains (People + Light + Eq): ${formatEngineeringValue((results.totalInternalW / 1000), precision, false)} kW
Recommended Equipment: ${results.recommendedAcUnits}
Electrical Input: ${formatEngineeringValue(results.electricalPowerKW, precision, false)} kW
Annual Energy Consumption: ${Math.round(results.annualKWh).toLocaleString()} kWh/yr (~$${formatEngineeringValue(results.annualCost, precision, false)}/yr)`;

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
            <Wind size={22} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black tracking-tight text-white uppercase">
                {t12(lang, 'HVAC & Building Thermal Load Studio', 'HVAC & Bina Isı Yükü Stüdyosu')}
              </h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                ASHRAE 90.1 / TS 825
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              {t12(lang, 'Building Thermal Loads, BTU/h Equipment Sizing, Envelope U-Values & OPEX', 'Bina İklimlendirme Kapasitesi, BTU/h Klima Seçimi, Kabuk Yalıtımı ve Enerji Tüketimi')}
            </p>
          </div>
        </div>

        {/* Global Selectors */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Season Toggle */}
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 text-xs font-bold font-mono">
            <button
              onClick={() => handleSeasonChange('cooling')}
              className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 ${seasonMode === 'cooling' ? 'bg-cyan-500 text-slate-950 shadow-md font-black' : 'text-slate-400 hover:text-white'}`}
            >
              <Snowflake size={13} /> {t12(lang, 'COOLING (SUMMER)', 'SOĞUTMA (YAZ)')}
            </button>
            <button
              onClick={() => handleSeasonChange('heating')}
              className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 ${seasonMode === 'heating' ? 'bg-orange-500 text-slate-950 shadow-md font-black' : 'text-slate-400 hover:text-white'}`}
            >
              <Flame size={13} /> {t12(lang, 'HEATING (WINTER)', 'ISITMA (KIŞ)')}
            </button>
          </div>

          {/* Climate Preset */}
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5">
            <Sun size={14} className="text-amber-400" />
            <select
              value={selectedClimateId}
              onChange={(e) => handleClimateChange(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-200 outline-none cursor-pointer"
            >
              {CLIMATE_PRESETS.map((c) => (
                <option key={c.id} value={c.id} className="bg-[var(--bg-2)] text-white">
                  {t12(lang, c.nameEn, c.nameTr)}
                </option>
              ))}
            </select>
          </div>

          {/* Space Usage Preset */}
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5">
            <Building2 size={14} className="text-emerald-400" />
            <select
              value={selectedSpaceId}
              onChange={(e) => handleSpaceChange(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-200 outline-none cursor-pointer"
            >
              {SPACE_PRESETS.map((s) => (
                <option key={s.id} value={s.id} className="bg-[var(--bg-2)] text-white">
                  {t12(lang, s.nameEn, s.nameTr)}
                </option>
              ))}
            </select>
          </div>

          {/* Copy Report */}
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
          { id: 'total', labelTr: '1. Isı Yükü & Cihaz Seçimi (BTU/kW)', labelEn: '1. Load & Equipment (BTU/kW)', icon: Activity },
          { id: 'envelope', labelTr: '2. Bina Kabuğu & Yalıtım (U Değerleri)', labelEn: '2. Building Envelope & Insulation', icon: Layers },
          { id: 'ventilation', labelTr: '3. Havalandırma & Taze Hava (ACH)', labelEn: '3. Fresh Air & Ventilation', icon: Fan },
          { id: 'energy', labelTr: '4. Yıllık Elektrik & Enerji Maliyeti', labelEn: '4. Annual Energy & OPEX', icon: DollarSign },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 py-3 px-4 text-xs font-bold transition-all border-b-2 whitespace-nowrap ${
                isActive
                  ? 'border-emerald-400 text-emerald-300 bg-emerald-500/10'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <Icon size={16} className={isActive ? 'text-emerald-400' : 'text-slate-500'} />
              <span>{t12(lang, tab.labelEn, tab.labelTr)}</span>
            </button>
          );
        })}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-[var(--bg-0)]">
        <div className="max-w-7xl mx-auto space-y-6">

          {/* TAB 1: TOTAL LOAD & HVAC EQUIPMENT SIZING */}
          {activeTab === 'total' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Geometry & Operating Inputs */}
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-[var(--bg-1)] border border-white/10 rounded-2xl p-5 space-y-4 shadow-xl">
                  <h3 className="text-xs font-black tracking-wider text-emerald-400 uppercase flex items-center gap-2">
                    <Sliders size={16} /> {t12(lang, 'SPACE DIMENSIONS & TEMPS', 'MAHAL BOYUTLARI & SICAKLIKLAR')}
                  </h3>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                        {t12(lang, 'Floor Area (m²)', 'Kullanım Alanı (m²)')}
                      </label>
                      <input
                        type="number"
                        min="10"
                        max="5000"
                        value={floorArea}
                        onChange={(e) => setFloorArea(Number(e.target.value))}
                        className="w-full bg-[var(--bg-0)] border border-white/10 rounded-xl px-3 py-2 text-sm font-mono font-bold text-white outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                        {t12(lang, 'Ceiling Height (m)', 'Tavan Yüksekliği (m)')}
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="2.2"
                        max="12"
                        value={ceilingHeight}
                        onChange={(e) => setCeilingHeight(Number(e.target.value))}
                        className="w-full bg-[var(--bg-0)] border border-white/10 rounded-xl px-3 py-2 text-sm font-mono font-bold text-white outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                        {t12(lang, 'Outside Temp (°C)', 'Dış Sıcaklık (°C)')}
                      </label>
                      <input
                        type="number"
                        value={tOutside}
                        onChange={(e) => setTOutside(Number(e.target.value))}
                        className="w-full bg-[var(--bg-0)] border border-white/10 rounded-xl px-3 py-2 text-sm font-mono font-bold text-white outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                        {t12(lang, 'Inside Setpoint (°C)', 'İç Ayar Sıcaklığı (°C)')}
                      </label>
                      <input
                        type="number"
                        value={tInside}
                        onChange={(e) => setTInside(Number(e.target.value))}
                        className="w-full bg-[var(--bg-0)] border border-white/10 rounded-xl px-3 py-2 text-sm font-mono font-bold text-white outline-none"
                      />
                    </div>
                  </div>

                  {/* Internal Gains Quick Slider */}
                  <div className="pt-2 border-t border-white/5 space-y-3">
                    <div>
                      <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                        <span>{t12(lang, 'Occupants (People Load)', 'Kişi Sayısı (İnsan Yükü)')}</span>
                        <span className="font-mono text-cyan-300 font-bold">{occupants} kişi</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="150"
                        value={occupants}
                        onChange={(e) => setOccupants(Number(e.target.value))}
                        className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[var(--cyan)]"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                        <span>{t12(lang, 'Equipment & Lighting Load', 'Cihaz & Aydınlatma Isı Yükü')}</span>
                        <span className="font-mono text-amber-300 font-bold">{(customEquipmentW + customLightingW) / 1000} kW</span>
                      </div>
                      <input
                        type="range"
                        min="100"
                        max="25000"
                        step="100"
                        value={customEquipmentW + customLightingW}
                        onChange={(e) => {
                          const total = Number(e.target.value);
                          setCustomEquipmentW(Math.round(total * 0.7));
                          setCustomLightingW(Math.round(total * 0.3));
                        }}
                        className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[var(--cyan)]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Sizing KPI Cards */}
              <div className="lg:col-span-7 space-y-4">
                {/* Hero Total Capacity Display */}
                <div className="relative overflow-hidden bg-gradient-to-br from-[var(--bg-1)] via-[var(--bg-0)] to-[var(--bg-2)] border border-emerald-500/30 rounded-3xl p-6 shadow-2xl">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <div className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-400 mb-1">
                        {seasonMode === 'cooling' ? (t12(lang, 'TOTAL REQUIRED COOLING LOAD', 'TOPLAM GEREKLİ SOĞUTMA KAPASİTESİ')) : (t12(lang, 'TOTAL REQUIRED HEATING LOAD', 'TOPLAM GEREKLİ ISITMA KAPASİTESİ'))}
                      </div>
                      <div className="text-5xl lg:text-5xl font-mono font-black tracking-tight text-white">
                        {formatEngineeringValue(results.totalLoadKW, precision, false)} <span className="text-2xl text-emerald-400 font-sans">kW</span>
                      </div>
                    </div>

                    <div className="text-right bg-white/5 px-4 py-3 rounded-2xl border border-white/10">
                      <div className="text-2xl font-mono font-black text-amber-300">
                        {Math.round(results.totalLoadBTU).toLocaleString()} <span className="text-xs font-sans text-slate-400">BTU/h</span>
                      </div>
                      <div className="text-sm font-mono font-bold text-cyan-300 mt-0.5">
                        {formatEngineeringValue(results.totalTons, precision, false)} <span className="text-xs font-sans text-slate-400">Refrigeration Tons (TR)</span>
                      </div>
                    </div>
                  </div>

                  {/* Recommended HVAC Equipment Badge */}
                  <div className="mt-5 p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-3">
                    <CheckCircle2 size={24} className="text-emerald-400 shrink-0" />
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                        {t12(lang, 'RECOMMENDED HVAC SIZING', 'ÖNERİLEN STANDART KLİMA & HVAC SEÇİMİ')}
                      </div>
                      <div className="text-sm font-bold text-white font-mono mt-0.5">
                        {results.recommendedAcUnits}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Load Breakdown Cards */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-[var(--bg-1)] p-4 rounded-2xl border border-white/10">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">{t12(lang, 'Transmission & Solar', 'Transmisyon & Güneş')}</div>
                    <div className="text-xl font-mono font-black text-cyan-300 mt-1">
                      {formatEngineeringValue((results.totalTransmissionW / 1000), precision, false)} <span className="text-xs">kW</span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono mt-1">
                      {formatEngineeringValue((results.totalTransmissionW / Math.max(1, results.totalLoadW) * 100), precision, false)}% Toplam Pay
                    </div>
                  </div>

                  <div className="bg-[var(--bg-1)] p-4 rounded-2xl border border-white/10">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">{t12(lang, 'Fresh Air / Vent', 'Taze Hava & Havalandırma')}</div>
                    <div className="text-xl font-mono font-black text-emerald-300 mt-1">
                      {formatEngineeringValue((results.totalVentilationW / 1000), precision, false)} <span className="text-xs">kW</span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono mt-1">
                      {formatEngineeringValue(results.freshAirFlowM3h, precision, false)} m³/h Debisi
                    </div>
                  </div>

                  <div className="bg-[var(--bg-1)] p-4 rounded-2xl border border-white/10">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">{t12(lang, 'Internal Heat Gains', 'İç Yükler (İnsan+Cihaz)')}</div>
                    <div className="text-xl font-mono font-black text-amber-300 mt-1">
                      {formatEngineeringValue((results.totalInternalW / 1000), precision, false)} <span className="text-xs">kW</span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono mt-1">
                      {occupants} Kişi + Cihazlar
                    </div>
                  </div>
                </div>

                {/* Specific Metrics */}
                <div className="bg-[var(--bg-1)] p-4 rounded-2xl border border-white/10 flex items-center justify-between text-xs font-mono">
                  <div>
                    <span className="text-slate-400">{t12(lang, 'Specific Load:', 'Birim Alan Isı Yükü:')} </span>
                    <span className="font-bold text-white">{formatEngineeringValue(results.specificLoadW_m2, precision, false)} W/m²</span>
                  </div>
                  <div>
                    <span className="text-slate-400">{t12(lang, 'Sensible Heat Ratio:', 'Duyulur Isı Oranı (SHR):')} </span>
                    <span className="font-bold text-cyan-300">{formatEngineeringValue((results.shr * 100), precision, false)}%</span>
                  </div>
                  <div>
                    <span className="text-slate-400">{t12(lang, 'Air Changes:', 'Hava Değişim Sayısı:')} </span>
                    <span className="font-bold text-emerald-300">{airChanges} ACH</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: BUILDING ENVELOPE & TS 825 INSULATION */}
          {activeTab === 'envelope' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-[var(--bg-1)] border border-white/10 rounded-2xl p-5 space-y-4 shadow-xl">
                  <h3 className="text-xs font-black tracking-wider text-cyan-400 uppercase flex items-center gap-2">
                    <Layers size={16} /> {t12(lang, 'ENVELOPE U-VALUES (W/m²K)', 'KABUK ISI GEÇİRGENLİK KATSAYILARI (U-DEĞERLERİ)')}
                  </h3>

                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                        <span>{t12(lang, 'Exterior Wall U-Value', 'Dış Duvar U (W/m²K)')}</span>
                        <span className="font-mono text-cyan-300 font-bold">{wallU} W/m²K</span>
                      </div>
                      <input
                        type="range"
                        min="0.15"
                        max="2.5"
                        step="0.05"
                        value={wallU}
                        onChange={(e) => setWallU(Number(e.target.value))}
                        className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[var(--cyan)]"
                      />
                      <div className="flex justify-between text-[9px] text-slate-500 font-mono mt-0.5">
                        <span>0.15 (Pasif Ev)</span>
                        <span>0.40 (TS 825 Standart)</span>
                        <span>2.0 (Yalıtımsız)</span>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                        <span>{t12(lang, 'Window / Glazing U-Value', 'Pencere / Doğrama U (W/m²K)')}</span>
                        <span className="font-mono text-cyan-300 font-bold">{windowU} W/m²K</span>
                      </div>
                      <input
                        type="range"
                        min="0.8"
                        max="5.8"
                        step="0.1"
                        value={windowU}
                        onChange={(e) => setWindowU(Number(e.target.value))}
                        className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[var(--cyan)]"
                      />
                      <div className="flex justify-between text-[9px] text-slate-500 font-mono mt-0.5">
                        <span>1.1 (3 Cam Low-E)</span>
                        <span>1.6 (Çift Cam Low-E)</span>
                        <span>5.0 (Tek Cam)</span>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                        <span>{t12(lang, 'Roof / Ceiling U-Value', 'Çatı / Tavan U (W/m²K)')}</span>
                        <span className="font-mono text-cyan-300 font-bold">{roofU} W/m²K</span>
                      </div>
                      <input
                        type="range"
                        min="0.1"
                        max="2.0"
                        step="0.05"
                        value={roofU}
                        onChange={(e) => setRoofU(Number(e.target.value))}
                        className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[var(--cyan)]"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                        <span>{t12(lang, 'Window-to-Wall Ratio (WWR %)', 'Pencere / Cephe Alan Oranı (WWR %)')}</span>
                        <span className="font-mono text-amber-300 font-bold">%{windowWallRatio}</span>
                      </div>
                      <input
                        type="range"
                        min="5"
                        max="80"
                        value={windowWallRatio}
                        onChange={(e) => setWindowWallRatio(Number(e.target.value))}
                        className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[var(--cyan)]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Envelope Heat Flux Breakdown */}
              <div className="lg:col-span-7 space-y-4">
                <div className="bg-[var(--bg-1)] border border-white/10 rounded-2xl p-5 shadow-2xl space-y-4">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <Layers size={16} className="text-cyan-400" />
                    {t12(lang, 'ENVELOPE HEAT TRANSMISSION BREAKDOWN', 'BİNA KABUĞU TRANSMİSYON DAĞILIMI')}
                  </h3>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between p-2.5 bg-[var(--bg-0)] rounded-xl border border-white/5">
                      <span className="text-slate-400">{t12(lang, 'Exterior Walls (Net ' + formatEngineeringValue(results.netWallArea, precision, false) + ' m²):', 'Dış Duvarlar (Net ' + formatEngineeringValue(results.netWallArea, precision, false) + ' m²):')}</span>
                      <span className="font-mono font-bold text-white">{formatEngineeringValue((results.qWall / 1000), precision, false)} kW</span>
                    </div>

                    <div className="flex justify-between p-2.5 bg-[var(--bg-0)] rounded-xl border border-white/5">
                      <span className="text-slate-400">{t12(lang, 'Windows / Glazing (' + formatEngineeringValue(results.windowArea, precision, false) + ' m²):', 'Pencereler / Camlar (' + formatEngineeringValue(results.windowArea, precision, false) + ' m²):')}</span>
                      <span className="font-mono font-bold text-cyan-300">{formatEngineeringValue((results.qWindowTransmission / 1000), precision, false)} kW</span>
                    </div>

                    {seasonMode === 'cooling' && (
                      <div className="flex justify-between p-2.5 bg-[var(--bg-0)] rounded-xl border border-amber-500/20">
                        <span className="text-amber-300">{t12(lang, 'Solar Radiation Gain:', 'Güneş Radyasyonu Isı Kazancı (Solar Radiation):')}</span>
                        <span className="font-mono font-bold text-amber-300">{formatEngineeringValue((results.solarGainGlass / 1000), precision, false)} kW</span>
                      </div>
                    )}

                    <div className="flex justify-between p-2.5 bg-[var(--bg-0)] rounded-xl border border-white/5">
                      <span className="text-slate-400">{t12(lang, 'Roof / Ceiling (' + formatEngineeringValue(results.roofArea, precision, false) + ' m²):', 'Çatı / Tavan (' + formatEngineeringValue(results.roofArea, precision, false) + ' m²):')}</span>
                      <span className="font-mono font-bold text-white">{formatEngineeringValue((results.qRoof / 1000), precision, false)} kW</span>
                    </div>

                    <div className="flex justify-between p-2.5 bg-[var(--bg-0)] rounded-xl border border-white/5">
                      <span className="text-slate-400">{t12(lang, 'Ground Floor (' + formatEngineeringValue(results.groundFloorArea, precision, false) + ' m²):', 'Zemin Döşemesi (' + formatEngineeringValue(results.groundFloorArea, precision, false) + ' m²):')}</span>
                      <span className="font-mono font-bold text-white">{formatEngineeringValue((results.qFloor / 1000), precision, false)} kW</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: FRESH AIR & VENTILATION (ASHRAE 62.1) */}
          {activeTab === 'ventilation' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-[var(--bg-1)] border border-white/10 rounded-2xl p-5 space-y-4 shadow-xl">
                  <h3 className="text-xs font-black tracking-wider text-emerald-400 uppercase flex items-center gap-2">
                    <Fan size={16} /> {t12(lang, 'VENTILATION & FRESH AIR FLOW', 'HAVALANDIRMA VE TAZE HAVA İHTİYACI')}
                  </h3>

                  <div>
                    <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                      <span>{t12(lang, 'Air Changes Per Hour (ACH)', 'Hava Değişim Sayısı (ACH - Air Changes/hr)')}</span>
                      <span className="font-mono text-emerald-300 font-bold">{airChanges} ACH</span>
                    </div>
                    <input
                      type="range"
                      min="0.2"
                      max="6.0"
                      step="0.1"
                      value={airChanges}
                      onChange={(e) => setAirChanges(Number(e.target.value))}
                      className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[var(--cyan)]"
                    />
                    <div className="flex justify-between text-[9px] text-slate-500 font-mono mt-0.5">
                      <span>0.5 (Konut)</span>
                      <span>1.5 (Ofis)</span>
                      <span>4.0+ (Restoran/Hastane)</span>
                    </div>
                  </div>

                  <div className="bg-[var(--bg-0)] p-3 rounded-xl border border-white/5 space-y-2 text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>{t12(lang, 'Fresh Air Flow Rate:', 'Gerekli Taze Hava Debisi:')}</span>
                      <span className="font-mono font-bold text-white">{formatEngineeringValue(results.freshAirFlowM3h, precision, false)} m³/h</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>{t12(lang, 'Flow in CFM:', 'CFM Cinsinden Debi:')}</span>
                      <span className="font-mono font-bold text-cyan-300">{formatEngineeringValue(results.freshAirFlowCFM, precision, false)} CFM</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>{t12(lang, 'Fresh Air Per Person:', 'Kişi Başı Taze Hava:')}</span>
                      <span className="font-mono font-bold text-emerald-400">{formatEngineeringValue((results.freshAirFlowM3h / occupants), precision, false)} m³/h/kişi</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-7 space-y-4">
                <div className="bg-[var(--bg-1)] border border-white/10 rounded-2xl p-5 shadow-2xl space-y-3">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <Info size={16} className="text-cyan-400" />
                    {t12(lang, 'ASHRAE 62.1 INDOOR AIR QUALITY GUIDELINES', 'ASHRAE 62.1 İÇ HAVA KALİTESİ STANDARDI')}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {t12(lang, 'ASHRAE 62.1 specifies a minimum of 25-30 m³/h per person for commercial spaces. Heat Recovery Ventilators (HRV/ERV) can recover up to 75% of ventilation thermal losses.', 'ASHRAE 62.1 standardına göre ofis ortamlarında kişi başı en az 25-30 m³/h (15-20 CFM) taze hava sağlanmalıdır. Yüksek taze hava debisi iç hava kalitesini artırırken iklimlendirme yükünü doğrudan artırır; bu nedenle Isı Geri Kazanım Cihazı (VAM / HRV) kullanımı tavsiye edilir.')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ENERGY & OPERATING COST (OPEX) */}
          {activeTab === 'energy' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-[var(--bg-1)] border border-white/10 rounded-2xl p-5 space-y-4 shadow-xl">
                  <h3 className="text-xs font-black tracking-wider text-amber-400 uppercase flex items-center gap-2">
                    <DollarSign size={16} /> {t12(lang, 'ENERGY EFFICIENCY & COST PARAMETERS', 'ENERJİ VERİMLİLİĞİ VE MALİYET GİRDİLERİ')}
                  </h3>

                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                        <span>{seasonMode === 'cooling' ? 'Mevsimsel Verim SEER' : 'Mevsimsel Verim SCOP'}</span>
                        <span className="font-mono text-amber-300 font-bold">{seasonMode === 'cooling' ? seer : scop}</span>
                      </div>
                      <input
                        type="range"
                        min="2.5"
                        max="9.0"
                        step="0.1"
                        value={seasonMode === 'cooling' ? seer : scop}
                        onChange={(e) => seasonMode === 'cooling' ? setSeer(Number(e.target.value)) : setScop(Number(e.target.value))}
                        className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[var(--cyan)]"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                        <span>{t12(lang, 'Operating Hours (hrs/day)', 'Günlük Çalışma Süresi (saat/gün)')}</span>
                        <span className="font-mono text-slate-200 font-bold">{operatingHoursPerDay} saat</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="24"
                        value={operatingHoursPerDay}
                        onChange={(e) => setOperatingHoursPerDay(Number(e.target.value))}
                        className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-slate-400"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                        {t12(lang, 'Electricity Price ($/kWh)', 'Elektrik Birim Fiyatı ($ veya TL / kWh)')}
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={electricityPricePerKwh}
                        onChange={(e) => setElectricityPricePerKwh(Number(e.target.value))}
                        className="w-full bg-[var(--bg-0)] border border-white/10 rounded-xl px-3 py-2 text-sm font-mono font-bold text-white outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-7 space-y-4">
                <div className="bg-[var(--bg-1)] border border-white/10 rounded-2xl p-5 shadow-2xl space-y-4">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <DollarSign size={16} className="text-emerald-400" />
                    {t12(lang, 'ESTIMATED ELECTRICITY & OPERATING COST', 'TAHMİNİ ELEKTRİK TÜKETİMİ & FATURA PROJEKSİYONU')}
                  </h3>

                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="bg-[var(--bg-0)] p-4 rounded-xl border border-white/5">
                      <div className="text-[10px] text-slate-400 uppercase font-bold">{t12(lang, 'Electrical Power', 'Anlık Elektrik Gücü')}</div>
                      <div className="text-2xl font-mono font-black text-white mt-1">
                        {formatEngineeringValue(results.electricalPowerKW, precision, false)} <span className="text-xs text-amber-400">kW</span>
                      </div>
                    </div>

                    <div className="bg-[var(--bg-0)] p-4 rounded-xl border border-white/5">
                      <div className="text-[10px] text-slate-400 uppercase font-bold">{t12(lang, 'Annual kWh', 'Yıllık Tüketim')}</div>
                      <div className="text-2xl font-mono font-black text-cyan-300 mt-1">
                        {Math.round(results.annualKWh).toLocaleString()} <span className="text-xs">kWh/yıl</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-emerald-300 uppercase">
                        {t12(lang, 'Estimated Annual OPEX', 'Tahmini Yıllık Enerji Gideri')}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {t12(lang, `Monthly avg ~$${formatEngineeringValue(results.monthlyCost, precision, false)} / mo`, `Aylık ortalama ~${formatEngineeringValue(results.monthlyCost, precision, false)} / ay`)}
                      </div>
                    </div>
                    <div className="text-3xl font-mono font-black text-white">
                      ${formatEngineeringValue(results.annualCost, precision, false)} <span className="text-xs font-sans text-slate-400">/ yıl</span>
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

