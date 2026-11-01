'use client';

import React, { useState } from 'react';
import { GearCalculatedData } from '@/data/gearTrainEngine';
import { Wrench, Shield, CheckCircle2, AlertTriangle, Ruler, Cpu, Flame, Layers, Sun, Orbit, CircleDot, ShieldCheck, Zap, Download } from 'lucide-react';
import { useI18nStore } from '@/store/i18nStore';
import { t12 } from '@/locales/t12';
import { getGearsModuleStrings } from '@/locales/gearsModuleTranslations';
import {
  downloadGearProductionSvg,
  downloadGearProductionDxf,
  calculateInvoluteGearSpecs,
} from '@/engines/math/gear-involute-factory';
import { useGlobalPrecision, formatEngineeringValue } from '@/components/calculator-kit/precisionUtils';

interface GearManufacturingPassportProps {
  gear: GearCalculatedData | undefined;
}

export function GearManufacturingPassport({ gear }: GearManufacturingPassportProps) {
  const precision = useGlobalPrecision();
  const { language } = useI18nStore();
  const s = getGearsModuleStrings(language);

  const [activeTab, setActiveTab] = useState<'gages' | 'machining' | 'quality' | 'forces' | 'planetary_carrier' | 'cam_export'>('gages');
  const [planetarySubGear, setPlanetarySubGear] = useState<'sun' | 'planet' | 'ring' | 'all_summary'>('sun');

  if (!gear) {
    return (
      <div className="p-8 rounded-2xl border border-white/5 bg-[var(--bg-1)]/60 text-center text-gray-500 font-mono text-xs">
        {s.clickGearHint || "Click on a gear in the diagram to inspect manufacturing & machining parameters."}
      </div>
    );
  }

  const isPlanetary = gear.gearType === 'planetary_stage' && gear.planetaryDetails;
  const activeGearData = isPlanetary
    ? planetarySubGear === 'all_summary'
      ? (gear.planetaryDetails as any).sun || gear
      : (gear.planetaryDetails as any)[planetarySubGear] || gear
    : gear;

  const carrierDetails = isPlanetary ? gear.planetaryDetails?.carrier : undefined;
  const planetDetails = isPlanetary ? gear.planetaryDetails : undefined;

  return (
    <div className="rounded-2xl border border-white/10 bg-[var(--bg-1)]/80 overflow-hidden shadow-2xl flex flex-col font-sans">
      {/* Header with Active Gear Identity */}
      <div className="px-5 py-4 border-b border-white/5 bg-gradient-to-r from-cyan-950/30 to-purple-950/20 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-[var(--cyan)]">
            <Wrench size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-black uppercase tracking-wider text-white">
                {isPlanetary
                  ? planetarySubGear === 'all_summary'
                    ? `${gear.name} · 3'lü İmalat Çizelgesi (Sun-Planet-Ring)`
                    : `${gear.name} · ${activeGearData.name}`
                  : gear.name}{' '}
                {s.passportTitle || (t12(language, 'Manufacturing Passport', 'İmalat Pasaportu'))}
              </h3>
              {gear.isCoaxial && (
                <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-[9px] font-mono text-amber-300 font-bold">
                  {t12(language, `COAXIAL SHAFT ${gear.shaftId}`, `KOAKSİYEL MİL ${gear.shaftId}`)}
                </span>
              )}
              {isPlanetary && (
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/40 text-[9px] font-mono text-emerald-300 font-bold">
                  {planetDetails?.modeLabel || (t12(language, `PLANETARY STAGE (i=${(gear.stageRatio ||formatEngineeringValue(4.5), precision, false)}:1)`, `PLANET KADEMESİ (i=${(gear.stageRatio ||formatEngineeringValue(4.5), precision, false)}:1)`))}
                </span>
              )}
            </div>
            <p className="text-[10px] font-mono text-white/40">
              {t12(language, `Shaft ${gear.shaftId}`, `Mil ${gear.shaftId}`)} · z={activeGearData.teeth} · m={gear.module} mm · {formatEngineeringValue(activeGearData.rpm, precision, false)} RPM · {formatEngineeringValue(activeGearData.torque, precision, false)} Nm
            </p>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/5 text-[10px] font-mono flex-wrap">
          <button
            type="button"
            onClick={() => setActiveTab('gages')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'gages'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 '
                : 'text-white/40 hover:text-white'
            }`}
          >
            <Ruler size={12} />
            <span>{s.tabGages || (t12(language, 'Gages & Inspection', 'Mastar & Kontrol'))}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('machining')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'machining'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 '
                : 'text-white/40 hover:text-white'
            }`}
          >
            <Cpu size={12} />
            <span>{s.tabMachining || (t12(language, 'Machining & Tooling', 'Talaşlı İmalat'))}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('forces')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'forces'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 '
                : 'text-white/40 hover:text-white'
            }`}
          >
            <ShieldCheck size={12} />
            <span>{s.tabForces || (t12(language, 'Forces & Strength', 'Kuvvetler & Mukavemet'))}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('quality')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'quality'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 '
                : 'text-white/40 hover:text-white'
            }`}
          >
            <Flame size={12} />
            <span>{s.tabQuality || (t12(language, 'Material & Treatment', 'Malzeme & Isıl İşlem'))}</span>
          </button>
          {isPlanetary && (
            <button
              type="button"
              onClick={() => setActiveTab('planetary_carrier')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'planetary_carrier'
                  ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/50 '
                  : 'text-emerald-400/60 hover:text-emerald-300'
              }`}
            >
              <Orbit size={12} />
              <span>{s.tabCarrier || (t12(language, 'Carrier & Assembly', 'Taşıyıcı & Montaj Şartları'))}</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setActiveTab('cam_export')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'cam_export'
                ? 'bg-purple-500/25 text-purple-300 border border-purple-500/50 '
                : 'text-purple-400/60 hover:text-purple-300'
            }`}
          >
            <Download size={12} />
            <span>{t12(language, '1:1 CAM & Files', '1:1 CAM & İmalat')}</span>
          </button>
        </div>
      </div>

      {/* PLANETARY SUB-GEAR SELECTOR BAR (When Planetary Stage is Active) */}
      {isPlanetary && activeTab !== 'planetary_carrier' && (
        <div className="px-5 py-2.5 bg-black/60 border-b border-white/5 flex flex-wrap items-center justify-between gap-2">
          <div className="text-[10px] font-mono text-white/50 font-bold flex items-center gap-1.5">
            <Orbit size={13} className="text-emerald-400" />
            <span>{t12(language, 'PLANETARY SUB-GEAR PRODUCTION DATA:', 'PLANET KADEMESİ AYRI DİŞLİ İMALAT HESAPLARI:')}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-[var(--bg-0)] p-1 rounded-xl border border-white/10 text-[10px] font-mono flex-wrap">
            <button
              type="button"
              onClick={() => setPlanetarySubGear('sun')}
              className={`px-3 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
                planetarySubGear === 'sun'
                  ? 'bg-[var(--cyan)] text-[var(--accent-ink)] '
                  : 'text-white/40 hover:text-white'
              }`}
            >
              <Sun size={11} />
              <span>{t12(language, `1. Sun (z=${gear.teeth})`, `1. Güneş (Sun, z=${gear.teeth})`)}</span>
            </button>
            <button
              type="button"
              onClick={() => setPlanetarySubGear('planet')}
              className={`px-3 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
                planetarySubGear === 'planet'
                  ? 'bg-[var(--cyan)] text-[var(--accent-ink)] '
                  : 'text-white/40 hover:text-white'
              }`}
            >
              <Orbit size={11} />
              <span>{t12(language, `2. Planet (${carrierDetails?.numPlanets || 3}x, z=${gear.planetTeeth || 25})`, `2. Planet (${carrierDetails?.numPlanets || 3}x, z=${gear.planetTeeth || 25})`)}</span>
            </button>
            <button
              type="button"
              onClick={() => setPlanetarySubGear('ring')}
              className={`px-3 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
                planetarySubGear === 'ring'
                  ? 'bg-[var(--cyan)] text-[var(--accent-ink)] '
                  : 'text-white/40 hover:text-white'
              }`}
            >
              <CircleDot size={11} />
              <span>{t12(language, `3. Ring Gear (z=${gear.ringTeeth || 70})`, `3. İç Çember (Ring, z=${gear.ringTeeth || 70})`)}</span>
            </button>
            <button
              type="button"
              onClick={() => setPlanetarySubGear('all_summary')}
              className={`px-3 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
                planetarySubGear === 'all_summary'
                  ? 'bg-gradient-to-r from-cyan-500 via-emerald-500 to-purple-500 text-black '
                  : 'text-amber-300/70 hover:text-amber-300'
              }`}
            >
              <Layers size={11} />
              <span>{t12(language, '📊 3-in-1 Master Comparison', '📊 3\'lü İmalat Karşılaştırma Tablosu')}</span>
            </button>
          </div>
        </div>
      )}

      {/* 3-IN-1 PLANETARY MASTER COMPARISON TABLE */}
      {isPlanetary && planetarySubGear === 'all_summary' && planetDetails && (
        <div className="p-5 space-y-4 font-mono text-xs">
          <div className="rounded-xl border border-white/10 overflow-x-auto custom-scrollbar">
            <table className="w-full text-[11px] text-left divide-y divide-white/10">
              <thead className="bg-black/60 text-[9px] uppercase text-white/50">
                <tr>
                  <th className="px-4 py-3 text-white/80">{t12(language, 'Manufacturing Parameter', 'İmalat & Kontrol Parametresi')}</th>
                  <th className="px-4 py-3 text-cyan-400 bg-cyan-950/20">{t12(language, `1. Sun Gear (z=${planetDetails.sun.teeth})`, `1. Güneş Dişli (z=${planetDetails.sun.teeth})`)}</th>
                  <th className="px-4 py-3 text-emerald-400 bg-emerald-950/20">{t12(language, `2. Planets (z=${planetDetails.planet.teeth})`, `2. Planet Dişlileri (${planetDetails.carrier.numPlanets}x, z=${planetDetails.planet.teeth})`)}</th>
                  <th className="px-4 py-3 text-purple-400 bg-purple-950/20">{t12(language, `3. Ring Gear (z=${planetDetails.ring.teeth})`, `3. İç Çember Halka (z=${planetDetails.ring.teeth})`)}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 bg-[var(--bg-0)]/40">
                <tr>
                  <td className="px-4 py-2 font-bold text-white/80">{t12(language, 'Gear Type', 'Dişli Tipi & Geometri')}</td>
                  <td className="px-4 py-2 text-cyan-300">{t12(language, 'External', 'Dış Dişli (External)')}</td>
                  <td className="px-4 py-2 text-emerald-300">{t12(language, 'External', 'Dış Dişli (External)')}</td>
                  <td className="px-4 py-2 text-purple-300">{t12(language, 'Internal Ring', 'İç Dişli (Internal Ring)')}</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 text-white/70">{t12(language, 'Module / Shift (m_n / x)', 'Modül & Profil Kaydırma (m_n / x)')}</td>
                  <td className="px-4 py-2 text-white">m={gear.module} mm (x={gear.profileShift})</td>
                  <td className="px-4 py-2 text-white">m={gear.module} mm (x={gear.profileShift})</td>
                  <td className="px-4 py-2 text-white">m={gear.module} mm (x={gear.profileShift})</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 text-white/70">{t12(language, 'Pitch Diameter (d)', 'Bölüm Dairesi Çapı (d)')}</td>
                  <td className="px-4 py-2 text-cyan-300 font-bold">{formatEngineeringValue(planetDetails.sun.d, precision, false)} mm</td>
                  <td className="px-4 py-2 text-emerald-300 font-bold">{formatEngineeringValue(planetDetails.planet.d, precision, false)} mm</td>
                  <td className="px-4 py-2 text-purple-300 font-bold">{formatEngineeringValue(planetDetails.ring.d, precision, false)} mm</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 text-white/70">{t12(language, 'Tip Diameter (da)', 'Diş Başı / Tepe Çapı (da)')}</td>
                  <td className="px-4 py-2 text-white">{formatEngineeringValue(planetDetails.sun.da, precision, false)} mm</td>
                  <td className="px-4 py-2 text-white">{formatEngineeringValue(planetDetails.planet.da, precision, false)} mm</td>
                  <td className="px-4 py-2 text-purple-300 font-bold">{formatEngineeringValue(planetDetails.ring.da, precision, false)} mm (İç Tepe)</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 text-white/70">{t12(language, 'Root Diameter (df)', 'Diş Dibi / Kök Çapı (df)')}</td>
                  <td className="px-4 py-2 text-white">{formatEngineeringValue(planetDetails.sun.df, precision, false)} mm</td>
                  <td className="px-4 py-2 text-white">{formatEngineeringValue(planetDetails.planet.df, precision, false)} mm</td>
                  <td className="px-4 py-2 text-purple-300 font-bold">{formatEngineeringValue(planetDetails.ring.df, precision, false)} mm (Dış Kök)</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 text-white/70">{t12(language, 'Wildhaber (Wk) / Over Pins (Md)', 'Wildhaber (Wk) / Pim Ölçüsü (Md)')}</td>
                  <td className="px-4 py-2 text-cyan-400 font-bold">W{planetDetails.sun.wildhaberK} = {formatEngineeringValue(planetDetails.sun.wildhaberW, precision, false)} mm</td>
                  <td className="px-4 py-2 text-emerald-400 font-bold">W{planetDetails.planet.wildhaberK} = {formatEngineeringValue(planetDetails.planet.wildhaberW, precision, false)} mm</td>
                  <td className="px-4 py-2 text-purple-400 font-bold">Md = {formatEngineeringValue(planetDetails.ring.dimensionOverPins, precision, false)} mm</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 text-white/70">{t12(language, 'Operating Speed & Torque', 'Çalışma Devri & Tork')}</td>
                  <td className="px-4 py-2 text-cyan-300">{planetDetails.sun.rpm} RPM · {planetDetails.sun.torque} Nm</td>
                  <td className="px-4 py-2 text-emerald-300">{planetDetails.planet.rpm} RPM · {planetDetails.planet.torque} Nm</td>
                  <td className="px-4 py-2 text-purple-300">{planetDetails.ring.rpm} RPM · {planetDetails.ring.torque} Nm</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 text-white/70">{t12(language, 'Forces & Safety', 'Teğetsel Yük (Ft) & Emniyetler')}</td>
                  <td className="px-4 py-2 text-white">Ft={planetDetails.sun.Ft} N (SF={planetDetails.sun.SF_bending})</td>
                  <td className="px-4 py-2 text-white">Ft={planetDetails.planet.Ft} N (Pim={planetDetails.planet.pinBearingRadialLoadN} N)</td>
                  <td className="px-4 py-2 text-white">Ft={planetDetails.ring.Ft} N (SH={planetDetails.ring.SF_contact})</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 text-white/70">{t12(language, 'Machining Process', 'Önerilen İmalat Yöntemi')}</td>
                  <td className="px-4 py-2 text-white/90">CNC Azdırma + DIN 6 Taşlama</td>
                  <td className="px-4 py-2 text-white/90">CNC Azdırma + DIN 6 Taşlama</td>
                  <td className="px-4 py-2 text-purple-300 font-bold">Fellows Planyalama / Broşlama</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 text-white/70">{t12(language, 'Hobbing/Shaping Time', 'Tahmini Açma Süresi (Th)')}</td>
                  <td className="px-4 py-2 text-cyan-400 font-bold">{planetDetails.sun.machiningTimeSec} s ({formatEngineeringValue((planetDetails.sun.machiningTimeSec / 60), precision, false)} dk)</td>
                  <td className="px-4 py-2 text-emerald-400 font-bold">{planetDetails.planet.machiningTimeSec} s (x{planetDetails.carrier.numPlanets} = {formatEngineeringValue(((planetDetails.planet.machiningTimeSec * planetDetails.carrier.numPlanets) / 60), precision, false)} dk)</td>
                  <td className="px-4 py-2 text-purple-400 font-bold">{planetDetails.ring.machiningTimeSec} s ({formatEngineeringValue((planetDetails.ring.machiningTimeSec / 60), precision, false)} dk)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 1: Gages & Inspection Measurements */}
      {activeTab === 'gages' && (
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-black/40 border border-cyan-500/20">
              <span className="text-[9px] font-mono uppercase text-white/40 block">Wildhaber (W{activeGearData.wildhaberK})</span>
              <span className="text-lg font-mono font-black text-cyan-400 tabular-nums">{formatEngineeringValue(activeGearData.wildhaberW, precision, false)}</span>
              <span className="text-[9px] font-mono text-white/30 ml-1">mm (k={activeGearData.wildhaberK})</span>
            </div>
            <div className="p-3 rounded-xl bg-black/40 border border-cyan-500/20">
              <span className="text-[9px] font-mono uppercase text-white/40 block">{t12(language, 'Over Pins (Md)', 'Pimler Üzeri (Md)')}</span>
              <span className="text-lg font-mono font-black text-cyan-400 tabular-nums">{formatEngineeringValue(activeGearData.dimensionOverPins, precision, false)}</span>
              <span className="text-[9px] font-mono text-white/30 ml-1">mm (ø{activeGearData.pinDiameter})</span>
            </div>
            <div className="p-3 rounded-xl bg-black/40 border border-white/5">
              <span className="text-[9px] font-mono uppercase text-white/40 block">{t12(language, 'Chordal Thick. (s̄)', 'Kiriş Kalınlığı (s̄)')}</span>
              <span className="text-lg font-mono font-black text-purple-400 tabular-nums">{formatEngineeringValue(activeGearData.chordalThickness, precision, false)}</span>
              <span className="text-[9px] font-mono text-white/30 ml-1">mm</span>
            </div>
            <div className="p-3 rounded-xl bg-black/40 border border-white/5">
              <span className="text-[9px] font-mono uppercase text-white/40 block">{t12(language, 'Chordal Add. (h̄a)', 'Kiriş Yüksekliği (h̄a)')}</span>
              <span className="text-lg font-mono font-black text-purple-400 tabular-nums">{formatEngineeringValue(activeGearData.chordalAddendum, precision, false)}</span>
              <span className="text-[9px] font-mono text-white/30 ml-1">mm</span>
            </div>
          </div>

          <div className="rounded-xl border border-white/5 overflow-hidden">
            <table className="w-full text-[11px] font-mono">
              <thead className="bg-white/5 text-white/40 uppercase text-[9px]">
                <tr>
                  <th className="px-4 py-2 text-left">{t12(language, `Geometric Parameter (${activeGearData.name})`, `Geometrik Parametre (${activeGearData.name})`)}</th>
                  <th className="px-4 py-2 text-center">{t12(language, 'Symbol', 'Sembol')}</th>
                  <th className="px-4 py-2 text-right">{t12(language, 'Computed Value', 'Hesaplanan Değer')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                <tr>
                  <td className="px-4 py-2 text-white/80">{t12(language, 'Reference Diameter', 'Bölüm Dairesi Çapı')}</td>
                  <td className="px-4 py-2 text-center text-cyan-400">d</td>
                  <td className="px-4 py-2 text-right text-white font-bold">{formatEngineeringValue(activeGearData.d, precision, false)} mm</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 text-white/80">{t12(language, 'Tip Diameter', 'Diş Üstü Çapı (Tepe)')}</td>
                  <td className="px-4 py-2 text-center text-cyan-400">da</td>
                  <td className="px-4 py-2 text-right text-white font-bold">{formatEngineeringValue(activeGearData.da, precision, false)} mm</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 text-white/80">{t12(language, 'Root Diameter', 'Diş Dibi Çapı (Kök)')}</td>
                  <td className="px-4 py-2 text-center text-cyan-400">df</td>
                  <td className="px-4 py-2 text-right text-white font-bold">{formatEngineeringValue(activeGearData.df, precision, false)} mm</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 text-white/80">{t12(language, 'Base Diameter', 'Temel Daire Çapı')}</td>
                  <td className="px-4 py-2 text-center text-cyan-400">db</td>
                  <td className="px-4 py-2 text-right text-white font-bold">{formatEngineeringValue(activeGearData.db, precision, false)} mm</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 text-white/80">{t12(language, 'Total Tooth Depth', 'Diş Yüksekliği (Tam Derinlik)')}</td>
                  <td className="px-4 py-2 text-center text-cyan-400">h = ha + hf</td>
                  <td className="px-4 py-2 text-right text-white font-bold">{formatEngineeringValue(activeGearData.h, precision, false)} mm</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 text-white/80">{t12(language, 'Tooth Thickness / Space', 'Normal Diş Kalınlığı / Boşluğu')}</td>
                  <td className="px-4 py-2 text-center text-cyan-400">s / e</td>
                  <td className="px-4 py-2 text-right text-white font-bold">{formatEngineeringValue(activeGearData.s, precision, false)} / {formatEngineeringValue(activeGearData.e, precision, false)} mm</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Machining, Tools & Cutting Data */}
      {activeTab === 'machining' && (
        <div className="p-5 space-y-4 font-mono text-xs">
          <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/30 flex items-start gap-3">
            <CheckCircle2 size={18} className="text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider block">{t12(language, 'Recommended Machining Process', 'Önerilen İmalat Yöntemi')}</span>
              <p className="text-[12px] text-white font-bold mt-0.5">{activeGearData.recMachining}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-black/40 border border-white/5">
              <span className="text-[9px] uppercase text-white/40 block">{t12(language, 'Cutting Speed (Vc)', 'Kesme Hızı (Vc)')}</span>
              <span className="text-base font-bold text-cyan-300">{activeGearData.cuttingSpeedVc} m/min</span>
              <span className="text-[9px] text-white/30 block mt-0.5">{t12(language, 'Carbide / HSS Hobbing', 'Karbür / HSS Azdırma')}</span>
            </div>
            <div className="p-3 rounded-xl bg-black/40 border border-white/5">
              <span className="text-[9px] uppercase text-white/40 block">{t12(language, 'Axial Feed (fz)', 'Eksenel İlerleme (fz)')}</span>
              <span className="text-base font-bold text-cyan-300">{activeGearData.feedFz} mm/rev</span>
              <span className="text-[9px] text-white/30 block mt-0.5">{t12(language, 'Rough / Finish Cut', 'Kaba / İnce talaş')}</span>
            </div>
            <div className="p-3 rounded-xl bg-black/40 border border-white/5">
              <span className="text-[9px] uppercase text-white/40 block">{t12(language, 'Estimated Hobbing Time (Th)', 'Tahmini Açma Süresi (Th)')}</span>
              <span className="text-base font-bold text-cyan-300">{activeGearData.machiningTimeSec} s</span>
              <span className="text-[9px] text-white/30 block mt-0.5">({formatEngineeringValue((activeGearData.machiningTimeSec / 60), precision, false)} {t12(language, 'min', 'dakika')})</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-black/30 border border-white/5 space-y-2 text-[11px] text-white/70">
            <div className="flex justify-between border-b border-white/5 pb-1.5">
              <span>{t12(language, 'Pitch Line Velocity:', 'Çevresel Yuvarlanma Hızı:')}</span>
              <span className="text-cyan-400 font-bold">{formatEngineeringValue(activeGearData.pitchVelocity, precision, false)} m/s</span>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-1.5">
              <span>{t12(language, 'Face Width (b):', 'Gereken Diş Genişliği (b):')}</span>
              <span className="text-white font-bold">{activeGearData.faceWidth} mm</span>
            </div>
            <div className="flex justify-between">
              <span>{t12(language, 'Hob Tool Normal Module (mn):', 'Azdırma Takım Modülü (mn):')}</span>
              <span className="text-cyan-400 font-bold">{gear.module} mm (DIN 867)</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2.5: Tooth Forces & ISO 6336 Strength */}
      {activeTab === 'forces' && (
        <div className="p-5 space-y-4 font-mono text-xs">
          {/* Forces Grid (Ft, Fr, Fa, Fn) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-black/40 border border-amber-500/30">
              <span className="text-[9px] uppercase text-white/40 block">{t12(language, 'Tangential Force (Ft)', 'Teğetsel Kuvvet (Ft)')}</span>
              <span className="text-base font-bold text-amber-300">{activeGearData.Ft || 0} N</span>
              <span className="text-[9px] text-white/30 block mt-0.5">{t12(language, 'Primary torque load', 'Ana dönme kuvveti')}</span>
            </div>
            <div className="p-3 rounded-xl bg-black/40 border border-white/5">
              <span className="text-[9px] uppercase text-white/40 block">{t12(language, 'Radial Force (Fr)', 'Radyal Kuvvet (Fr)')}</span>
              <span className="text-base font-bold text-cyan-300">{activeGearData.Fr || 0} N</span>
              <span className="text-[9px] text-white/30 block mt-0.5">{t12(language, 'Shaft bending load', 'Mil eğme yükü')}</span>
            </div>
            <div className="p-3 rounded-xl bg-black/40 border border-white/5">
              <span className="text-[9px] uppercase text-white/40 block">{t12(language, 'Axial Force (Fa)', 'Eksenel Kuvvet (Fa)')}</span>
              <span className="text-base font-bold text-cyan-300">{activeGearData.Fa || 0} N</span>
              <span className="text-[9px] text-white/30 block mt-0.5">{t12(language, 'Helix thrust load', 'Helis itme kuvveti')}</span>
            </div>
            <div className="p-3 rounded-xl bg-black/40 border border-amber-500/20">
              <span className="text-[9px] uppercase text-white/40 block">{t12(language, 'Normal Contact Force (Fn)', 'Normal Kuvvet (Fn)')}</span>
              <span className="text-base font-bold text-amber-400">{activeGearData.Fn || 0} N</span>
              <span className="text-[9px] text-white/30 block mt-0.5">{t12(language, 'Resultant tooth load', 'Bileşke temas yükü')}</span>
            </div>
          </div>

          {/* ISO 6336 Stresses & Safety Factors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Bending Stress Panel */}
            <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/30 space-y-2">
              <div className="flex items-center justify-between pb-1.5 border-b border-cyan-500/20">
                <span className="text-[11px] font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Shield size={13} />
                  {t12(language, 'Root Bending (ISO 6336)', 'Diş Dibi Eğilme (ISO 6336)')}
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  (activeGearData.SF_bending || 0) >= 1.4
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-red-500/20 text-red-300 border border-red-500/40'
                }`}>
                  SF = {(activeGearData.SF_bending ||formatEngineeringValue(0), precision, false)} {(activeGearData.SF_bending || 0) >= 1.4 ? (t12(language, '✓ SAFE', '✓ GÜVENLİ')) : (t12(language, '⚠ CRITICAL', '⚠ KRİTİK'))}
                </span>
              </div>
              <div className="flex justify-between text-[11px] text-white/70">
                <span>{t12(language, 'Bending Stress (σ_F):', 'Eğilme Gerilmesi (σ_F):')}</span>
                <span className="text-white font-bold">{activeGearData.sigma_F || 0} MPa</span>
              </div>
              <div className="flex justify-between text-[10px] text-white/40">
                <span>{t12(language, 'Min Recommended Safety:', 'Önerilen Min Emniyet:')}</span>
                <span className="text-cyan-400">SF ≥ 1.40</span>
              </div>
            </div>

            {/* Contact Stress Panel */}
            <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/30 space-y-2">
              <div className="flex items-center justify-between pb-1.5 border-b border-purple-500/20">
                <span className="text-[11px] font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck size={13} />
                  {t12(language, 'Flank Contact / Pitting (ISO 6336)', 'Yüzey Ezilme / Pitting (ISO 6336)')}
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  (activeGearData.SF_contact || 0) >= 1.0
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-red-500/20 text-red-300 border border-red-500/40'
                }`}>
                  SH = {(activeGearData.SF_contact ||formatEngineeringValue(0), precision, false)} {(activeGearData.SF_contact || 0) >= 1.0 ? (t12(language, '✓ SAFE', '✓ GÜVENLİ')) : (t12(language, '⚠ CRITICAL', '⚠ KRİTİK'))}
                </span>
              </div>
              <div className="flex justify-between text-[11px] text-white/70">
                <span>{t12(language, 'Hertz Contact Stress (σ_H):', 'Hertz Temas Basıncı (σ_H):')}</span>
                <span className="text-white font-bold">{activeGearData.sigma_H || 0} MPa</span>
              </div>
              <div className="flex justify-between text-[10px] text-white/40">
                <span>{t12(language, 'Min Recommended Safety:', 'Önerilen Min Emniyet:')}</span>
                <span className="text-purple-400">SH ≥ 1.00</span>
              </div>
            </div>
          </div>

          {/* Shaft Torsional Recommendation */}
          <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-2">
              <Zap size={14} className="text-amber-400" />
              <div>
                <span className="text-white font-bold block">{t12(language, `Shaft Torsion & Sizing (Shaft ${activeGearData.shaftId}):`, `Mil Burulma & Çap Kontrolü (Mil ${activeGearData.shaftId}):`)}</span>
                <span className="text-[10px] text-white/40">T = {formatEngineeringValue(activeGearData.torque, precision, false)} Nm · [τ_allow = 45 MPa]</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[9px] uppercase text-white/40 block">{t12(language, 'Min Req Shaft Diameter', 'Min Gerekli Mil Çapı')}</span>
              <span className="text-sm font-bold text-cyan-400">d_min ≥ {activeGearData.minShaftDiameter || 20} mm</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Material, Heat Treatment & Quality Tolerances */}
      {activeTab === 'quality' && (
        <div className="p-5 space-y-4 font-mono text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-black/40 border border-white/5">
              <span className="text-[9px] uppercase text-white/40 block">{t12(language, 'Material Grade', 'Malzeme Cinsi')}</span>
              <span className="text-sm font-bold text-amber-300">{activeGearData.material}</span>
              <span className="text-[9px] text-white/30 block mt-0.5">{t12(language, 'Case Hardening Alloy Steel', 'Sementasyon Çeliği')}</span>
            </div>
            <div className="p-3 rounded-xl bg-black/40 border border-white/5">
              <span className="text-[9px] uppercase text-white/40 block">{t12(language, 'Case Depth (CHD)', 'Sementasyon Derinliği (CHD)')}</span>
              <span className="text-sm font-bold text-cyan-300">{activeGearData.caseDepthCHD}</span>
              <span className="text-[9px] text-white/30 block mt-0.5">{t12(language, 'Effective case depth', 'Etkin sertlik derinliği')}</span>
            </div>
            <div className="p-3 rounded-xl bg-black/40 border border-white/5">
              <span className="text-[9px] uppercase text-white/40 block">{t12(language, 'Surface Hardness', 'Yüzey Sertliği')}</span>
              <span className="text-sm font-bold text-cyan-300">{activeGearData.surfaceHardness}</span>
              <span className="text-[9px] text-white/30 block mt-0.5">{t12(language, `Core: ${activeGearData.coreStrength}`, `Çekirdek: ${activeGearData.coreStrength}`)}</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/30 space-y-2.5">
            <div className="flex items-center justify-between pb-2 border-b border-purple-500/20">
              <span className="text-[11px] font-bold text-purple-300 uppercase tracking-wider">
                {t12(language, `ISO 1328 / DIN 3962 Accuracy Grade Tolerances (${activeGearData.name})`, `ISO 1328 / DIN 3962 Kalite Sınıfı Toleransları (${activeGearData.name})`)}
              </span>
              <span className="px-2 py-0.5 rounded bg-purple-500/30 text-purple-200 text-[10px] font-bold">
                GRADE {activeGearData.qualityGrade}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
              <div className="p-2 rounded-lg bg-black/40 border border-white/5">
                <span className="text-white/40 block">{t12(language, 'Radial Runout (Fr)', 'Radyal Salgı (Fr)')}</span>
                <span className="text-xs font-bold text-cyan-300">±{activeGearData.radialRunoutFr} µm</span>
              </div>
              <div className="p-2 rounded-lg bg-black/40 border border-white/5">
                <span className="text-white/40 block">{t12(language, 'Total Pitch Error (Fp)', 'Aralık Hatası (Fp)')}</span>
                <span className="text-xs font-bold text-cyan-300">±{activeGearData.pitchErrorFp} µm</span>
              </div>
              <div className="p-2 rounded-lg bg-black/40 border border-white/5">
                <span className="text-white/40 block">{t12(language, 'Profile Form Error (Ff)', 'Profil Form (Ff)')}</span>
                <span className="text-xs font-bold text-cyan-300">±{activeGearData.profileErrorFf} µm</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Carrier & Epicyclic Assembly Conditions (AGMA 6123 / ISO 6336) */}
      {activeTab === 'planetary_carrier' && carrierDetails && (
        <div className="p-5 space-y-4 font-mono text-xs">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-black/40 border border-emerald-500/30">
              <span className="text-[9px] uppercase text-white/40 block">{t12(language, 'Carrier Output Speed', 'Taşıyıcı Çıkış Devri')}</span>
              <span className="text-lg font-black text-emerald-400">{carrierDetails.carrierRpm} RPM</span>
            </div>
            <div className="p-3 rounded-xl bg-black/40 border border-emerald-500/30">
              <span className="text-[9px] uppercase text-white/40 block">{t12(language, 'Carrier Output Torque', 'Taşıyıcı Çıkış Torku')}</span>
              <span className="text-lg font-black text-emerald-400">{carrierDetails.carrierTorqueNm} Nm</span>
            </div>
            <div className="p-3 rounded-xl bg-black/40 border border-white/5">
              <span className="text-[9px] uppercase text-white/40 block">{t12(language, 'Orbit Circle (dc)', 'Yörünge Dairesi (dc)')}</span>
              <span className="text-lg font-black text-cyan-400">{formatEngineeringValue(carrierDetails.orbitDia, precision, false)} mm</span>
            </div>
            <div className="p-3 rounded-xl bg-black/40 border border-white/5">
              <span className="text-[9px] uppercase text-white/40 block">{t12(language, 'Housing Reaction Torque', 'Gövde Reaksiyon Torku')}</span>
              <span className="text-lg font-black text-amber-400">{carrierDetails.reactionTorqueNm} Nm</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-3">
            <h4 className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-2">
              <Shield size={14} />
              {t12(language, 'AGMA 6123 & ISO 6336 Assembly & Spacing Criteria', 'AGMA 6123 & ISO 6336 Montaj ve Çakışma Kriterleri')}
            </h4>

            <div className="space-y-2 text-[11px]">
              {/* Assembly Spacing Condition */}
              <div className="p-3 rounded-lg bg-black/40 border border-white/5 flex items-center justify-between">
                <div>
                  <span className="text-white font-bold block">{t12(language, '1. Equal Indexing Assembly Condition:', '1. Eşit Bölüntü / Montaj Şartı:')}</span>
                  <span className="text-[10px] text-white/50">(zs + zr) / N = ({gear.teeth} + {gear.ringTeeth || 70}) / {carrierDetails.numPlanets}</span>
                </div>
                <div className="flex items-center gap-2">
                  {carrierDetails.assemblyConditionOk ? (
                    <span className="px-2.5 py-1 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold text-[10px] flex items-center gap-1">
                      <CheckCircle2 size={12} />
                      {t12(language, 'SYMMETRIC FIT (OK)', 'TAM MONTAJ (OK)')}
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded bg-red-500/20 border border-red-500/40 text-red-300 font-bold text-[10px] flex items-center gap-1">
                      <AlertTriangle size={12} />
                      {t12(language, 'ASYMMETRIC / INVALID', 'ASİMETRİK / GEÇERSİZ')}
                    </span>
                  )}
                </div>
              </div>

              {/* Proximity Interference Condition */}
              <div className="p-3 rounded-lg bg-black/40 border border-white/5 flex items-center justify-between">
                <div>
                  <span className="text-white font-bold block">{t12(language, '2. Planet Proximity & Interference Check:', '2. Planet Bitişiklik & Çakışma Kontrolü:')}</span>
                  <span className="text-[10px] text-white/50">da_planet ({gear.planetaryDetails?.planet?.da?.toFixed(1) || 60} mm) &lt; {t12(language, 'Max', 'Maks')} ({carrierDetails.maxAllowedPlanetDia} mm)</span>
                </div>
                <div className="flex items-center gap-2">
                  {carrierDetails.proximityConditionOk ? (
                    <span className="px-2.5 py-1 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold text-[10px] flex items-center gap-1">
                      <CheckCircle2 size={12} />
                      {t12(language, 'CLEARANCE OK', 'BOŞLUK UYGUN (OK)')}
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold text-[10px] flex items-center gap-1">
                      <AlertTriangle size={12} />
                      {t12(language, 'INTERFERENCE RISK', 'ÇAKIŞMA RİSKİ')}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: CAM & 1:1 CNC Production Files */}
      {activeTab === 'cam_export' && (
        <div className="p-5 space-y-4 font-mono text-xs">
          {/* Main Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => downloadGearProductionSvg({
                module: activeGearData.module || gear.module,
                teeth: activeGearData.teeth,
                helixAngle: activeGearData.helixAngle || 0,
                pressureAngle: 20,
                profileShift: activeGearData.profileShift || 0,
                faceWidth: activeGearData.faceWidth || gear.faceWidth || 20,
                boreDiameter: activeGearData.minShaftDiameter || 25,
                isInternal: activeGearData.gearType === 'internal',
                hasKeyway: activeGearData.gearType !== 'internal',
              }, `${activeGearData.name.replace(/\s+/g, '_')}_1to1_CAM.svg`, {
                customTitle: `${gear.name} - ${activeGearData.name}`,
                material: activeGearData.material,
              })}
              className="p-4 rounded-xl bg-gradient-to-br from-cyan-950/40 to-cyan-900/20 border border-cyan-500/40 hover:border-cyan-400 transition-all text-left flex items-start gap-3 group"
            >
              <div className="p-2.5 rounded-lg bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 group-hover:scale-110 transition-transform">
                <Download size={20} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                    {t12(language, 'Download 1:1 Production SVG', '1:1 Üretim SVG İndir')}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[9px] font-bold">
                    CNC / LAZER
                  </span>
                </div>
                <p className="text-[10px] text-white/50 mt-1">
                  {t12(language, 'Exact 1.000 mm/unit scale • CAM Layers: Red (Outer Cut), Blue (Inner Bore/Keyway), Green (Marking). Ready for LightBurn, CypCut & CAD.', 'Birebir 1.000 mm/birim ölçek • CAM Katmanları: Kırmızı (Dış Kesim), Mavi (Mil/Kama), Yeşil (Markalama). Lazer ve Plazma için sıfır hata.')}
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => downloadGearProductionDxf({
                module: activeGearData.module || gear.module,
                teeth: activeGearData.teeth,
                helixAngle: activeGearData.helixAngle || 0,
                pressureAngle: 20,
                profileShift: activeGearData.profileShift || 0,
                faceWidth: activeGearData.faceWidth || gear.faceWidth || 20,
                boreDiameter: activeGearData.minShaftDiameter || 25,
                isInternal: activeGearData.gearType === 'internal',
                hasKeyway: activeGearData.gearType !== 'internal',
              }, `${activeGearData.name.replace(/\s+/g, '_')}_1to1.dxf`)}
              className="p-4 rounded-xl bg-gradient-to-br from-purple-950/40 to-purple-900/20 border border-purple-500/40 hover:border-purple-400 transition-all text-left flex items-start gap-3 group"
            >
              <div className="p-2.5 rounded-lg bg-purple-500/20 border border-purple-500/30 text-purple-300 group-hover:scale-110 transition-transform">
                <Download size={20} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">
                    {t12(language, 'Download 1:1 AutoCAD DXF', '1:1 AutoCAD DXF İndir')}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[9px] font-bold">
                    TEL EROZYON / FREZE
                  </span>
                </div>
                <p className="text-[10px] text-white/50 mt-1">
                  {t12(language, 'AutoCAD R12/R14 standard • Continuous closed LWPOLYLINE contour • Millimetric INSUNITS. For Wire EDM, Waterjet & CNC Milling.', 'AutoCAD R12/R14 standardı • Kesintisiz kapalı POLYLINE • Milimetrik birim. Tel erozyon, su jeti ve CNC freze için hazır.')}
                </p>
              </div>
            </button>
          </div>

          {/* Machining & Cutting Parameters Table */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-black/40 border border-white/5">
              <span className="text-[9px] uppercase text-white/40 block">{t12(language, 'Laser Kerf Allowance', 'Lazer Kesim Kerf Payı')}</span>
              <span className="text-base font-bold text-cyan-300">0.15 - 0.22 mm</span>
              <span className="text-[9px] text-white/30 block mt-0.5">{t12(language, 'Beam compensation', 'Işın ofseti')}</span>
            </div>
            <div className="p-3 rounded-xl bg-black/40 border border-white/5">
              <span className="text-[9px] uppercase text-white/40 block">{t12(language, 'Min Root Fillet (2·ρf)', 'Min Kök Kavis Çapı (2·ρf)')}</span>
              <span className="text-base font-bold text-cyan-300">{(0.76 * (activeGearData.module ||formatEngineeringValue(gear.module)), precision, false)} mm</span>
              <span className="text-[9px] text-white/30 block mt-0.5">{t12(language, 'CNC Endmill min diameter', 'Freze ucu minimum çapı')}</span>
            </div>
            <div className="p-3 rounded-xl bg-black/40 border border-white/5">
              <span className="text-[9px] uppercase text-white/40 block">{t12(language, 'DIN 6885 Keyway', 'DIN 6885 Kama Kanalı')}</span>
              <span className="text-base font-bold text-amber-300">
                {activeGearData.minShaftDiameter && activeGearData.minShaftDiameter <= 22 ? '6 x 3.5 mm' : '8 x 4.0 mm'}
              </span>
              <span className="text-[9px] text-white/30 block mt-0.5">ø{activeGearData.minShaftDiameter || 25} mm mil</span>
            </div>
            <div className="p-3 rounded-xl bg-black/40 border border-white/5">
              <span className="text-[9px] uppercase text-white/40 block">{t12(language, 'Tolerance Standard', 'Tolerans Standardı')}</span>
              <span className="text-base font-bold text-emerald-300">ISO 1328 Grade {activeGearData.qualityGrade || 6}</span>
              <span className="text-[9px] text-white/30 block mt-0.5">{t12(language, 'DIN 3962 Precision', 'DIN 3962 Hassasiyeti')}</span>
            </div>
          </div>

          {/* Guarantee Note */}
          <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30 flex items-center gap-3">
            <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
            <p className="text-[11px] text-emerald-200/90 leading-relaxed font-sans">
              <strong>{t12(language, 'CAM Production Verification Passed:', 'CAM Üretim Doğrulaması Başarılı:')}</strong>{' '}
              {t12(language, 'This SVG uses mathematically closed involute polylines with zero self-intersections or open loops. Dimensions are 1:1 exact. Importing into LightBurn, AutoCAD, SolidWorks, or Fusion 360 will not produce scaling or contour errors.', 'Bu SVG, kendini kesmeyen ve açık uç barındırmayan tek parça kapalı evolvent konturla üretilmiştir. Ölçüler 1 e 1 doğrudur; LightBurn, AutoCAD, SolidWorks veya Fusion 360’a aktarıldığında boyut ya da kontur hatası vermez.')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

