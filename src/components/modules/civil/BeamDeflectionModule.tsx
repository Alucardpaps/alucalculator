'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Layers,
  AlertTriangle,
  ArrowDown,
  Ruler,
  RotateCcw,
  Target,
  ShieldAlert,
  Info,
  SlidersHorizontal,
  BookmarkCheck,
  CheckCircle2,
} from 'lucide-react';
import { useI18nStore } from '@/store/i18nStore';
import { t12 } from '@/locales/t12';
import { getDedicatedCalcPage } from '@/locales/dedicatedCalcTranslations';
import { APP_RELEASE_NAME } from '@/config/app';
import {
  getBeamDeflectionModuleStrings,
  formatBeamCriticalWarning,
} from '@/locales/beamDeflectionModuleTranslations';
import {
  SmartInputField,
  ProgressiveDisclosure,
  VerdictBadge,
  SafetyMarginBar,
  formatEngineeringValue,
  useGlobalPrecision,
  type LimitStateMetric,
  type VerdictStatus,
  type DisclosureLevelSection,
  type UnitOption,
} from '@/components/calculator-kit';

interface MaterialPreset {
  id: string;
  nameEn: string;
  nameTr: string;
  modulusGPa: number;
  yieldStrengthMPa: number;
}

const MATERIAL_PRESETS: MaterialPreset[] = [
  { id: 'al6061', nameEn: 'Aluminum 6061-T6', nameTr: 'Alüminyum 6061-T6', modulusGPa: 70, yieldStrengthMPa: 240 },
  { id: 'steel_s355', nameEn: 'Structural Steel S355', nameTr: 'Yapı Çeliği S355', modulusGPa: 210, yieldStrengthMPa: 355 },
  { id: 'steel_s275', nameEn: 'Structural Steel S275', nameTr: 'Yapı Çeliği S275', modulusGPa: 210, yieldStrengthMPa: 275 },
  { id: 'ss304', nameEn: 'Stainless Steel 304', nameTr: 'Paslanmaz Çelik 304', modulusGPa: 193, yieldStrengthMPa: 215 },
  { id: 'ti64', nameEn: 'Titanium Ti-6Al-4V', nameTr: 'Titanyum Ti-6Al-4V', modulusGPa: 110, yieldStrengthMPa: 880 },
  { id: 'custom', nameEn: 'Custom Material', nameTr: 'Özel Malzeme', modulusGPa: 70, yieldStrengthMPa: 240 },
];

interface DeflectionLimitPreset {
  id: string;
  ratio: number;
  labelEn: string;
  labelTr: string;
  standard: string;
}

const DEFLECTION_LIMITS: DeflectionLimitPreset[] = [
  { id: 'ec3_general', ratio: 300, labelEn: 'Eurocode 3 Standard (L/300)', labelTr: 'Eurocode 3 Standart (L/300)', standard: 'EN 1993-1-1' },
  { id: 'ec3_roof', ratio: 250, labelEn: 'Roof / General Floor (L/250)', labelTr: 'Çatı / Döşeme (L/250)', standard: 'EN 1993-1-1 §7.2' },
  { id: 'aisc_plaster', ratio: 360, labelEn: 'AISC 360 Plaster Ceiling (L/360)', labelTr: 'AISC 360 Sıvalı Tavan (L/360)', standard: 'AISC 360-16 §L' },
  { id: 'precision', ratio: 500, labelEn: 'Precision Equipment / Crane (L/500)', labelTr: 'Hassas Ekipman / Vinç (L/500)', standard: 'ISO 22986' },
  { id: 'custom', ratio: 300, labelEn: 'Custom Ratio (L/n)', labelTr: 'Özel Oran (L/n)', standard: 'Custom' },
];

// Unit definitions for SmartInputField
const LENGTH_UNITS: UnitOption[] = [
  { label: 'mm', symbol: 'mm', toSiRatio: 1 },
  { label: 'm', symbol: 'm', toSiRatio: 1000 },
];

const LOAD_UNITS: UnitOption[] = [
  { label: 'kN', symbol: 'kN', toSiRatio: 1 },
  { label: 'N', symbol: 'N', toSiRatio: 0.001 },
];

const MODULUS_UNITS: UnitOption[] = [
  { label: 'GPa', symbol: 'GPa', toSiRatio: 1 },
  { label: 'MPa', symbol: 'MPa', toSiRatio: 0.001 },
];

const INERTIA_UNITS: UnitOption[] = [
  { label: '10⁶ mm⁴', symbol: '10⁶ mm⁴', toSiRatio: 1 },
  { label: 'cm⁴', symbol: 'cm⁴', toSiRatio: 0.01 },
];

const HEIGHT_UNITS: UnitOption[] = [
  { label: 'mm', symbol: 'mm', toSiRatio: 1 },
  { label: 'cm', symbol: 'cm', toSiRatio: 10 },
];

const STRESS_UNITS: UnitOption[] = [
  { label: 'MPa', symbol: 'MPa', toSiRatio: 1 },
  { label: 'N/mm²', symbol: 'N/mm²', toSiRatio: 1 },
];

export default function BeamDeflectionModule() {
  const { language, t } = useI18nStore();
  const d = getDedicatedCalcPage(language).beamDeflection;
  const b = getBeamDeflectionModuleStrings(language);
  const precision = useGlobalPrecision();

  const [inputs, setInputs] = useState({
    type: 'simple' as 'simple' | 'cantilever',
    length: 3000, // mm
    load: 10,     // kN
    materialId: 'al6061',
    modulus: 70,  // GPa (Aluminum 6061-T6)
    inertia: 15.5,// 10^6 mm^4
    height: 160,  // mm
    yieldStrength: 240, // MPa
    limitRatioPreset: 'ec3_general',
    customLimitRatio: 300,
  });

  const [focusedFieldId, setFocusedFieldId] = useState<string | null>(null);

  // Mechanical Physics Solver (Euler-Bernoulli Beam Theory & Eurocode 3 / AISC 360-16)
  const results = useMemo(() => {
    const L = Math.max(inputs.length, 1);
    const F = Math.max(inputs.load, 0) * 1000; // N
    const E = Math.max(inputs.modulus, 1) * 1000; // MPa = N/mm^2
    const I = Math.max(inputs.inertia, 0.001) * 1000000; // mm^4
    const h = Math.max(inputs.height, 1); // mm
    const fy = Math.max(inputs.yieldStrength, 1); // MPa

    let delta = 0;
    let maxMomentNmm = 0;

    if (inputs.type === 'simple') {
      // Simply supported with midspan point load: delta = (F * L^3) / (48 * E * I)
      delta = (F * Math.pow(L, 3)) / (48 * E * I);
      maxMomentNmm = (F * L) / 4;
    } else {
      // Cantilever with end point load: delta = (F * L^3) / (3 * E * I)
      delta = (F * Math.pow(L, 3)) / (3 * E * I);
      maxMomentNmm = F * L;
    }

    // Stress analysis: extreme fiber distance c = h / 2, section modulus Wx = I / c, sigma_b = M / Wx
    const c = h / 2;
    const sectionModulusMm3 = I / c;
    const sectionModulusCm3 = sectionModulusMm3 / 1000;
    const sigmaB = sectionModulusMm3 > 0 ? maxMomentNmm / sectionModulusMm3 : 0;

    // Allowable limit
    const activeLimitRatio = inputs.limitRatioPreset === 'custom'
      ? Math.max(inputs.customLimitRatio, 10)
      : (DEFLECTION_LIMITS.find(l => l.id === inputs.limitRatioPreset)?.ratio ?? 300);

    const limit = L / activeLimitRatio;

    // Capacity utilization ratios (Eurocode 3 & FEA Standard)
    const etaDelta = limit > 0 ? delta / limit : 0;
    const etaStress = fy > 0 ? sigmaB / fy : 0;
    const etaMax = Math.max(etaDelta, etaStress);

    // Limit state verdict determination
    let verdict: VerdictStatus = 'PASS';
    let weakestLink = '';

    if (isNaN(delta) || !isFinite(delta) || L <= 0) {
      verdict = 'INCOMPLETE';
      weakestLink = t12(language, 'Incomplete or invalid inputs', 'Geçersiz veya eksik girdiler');
    } else if (etaMax > 1.0) {
      verdict = 'FAIL';
      if (etaDelta > 1.0 && etaStress > 1.0) {
        weakestLink = t12(
          language,
          `Both deflection (f = ${formatEngineeringValue(delta, precision)} mm > ${formatEngineeringValue(limit, precision)} mm) and yield stress (σ = ${formatEngineeringValue(sigmaB, precision)} MPa > ${fy} MPa) exceed limits.`,
          `Hem sehim sınırı (f = ${formatEngineeringValue(delta, precision)} mm > ${formatEngineeringValue(limit, precision)} mm) hem de akma gerilmesi (σ = ${formatEngineeringValue(sigmaB, precision)} MPa > ${fy} MPa) aşıldı.`
        );
      } else if (etaDelta > 1.0) {
        weakestLink = t12(
          language,
          `Deflection limit exceeded: f = ${formatEngineeringValue(delta, precision)} mm (Allowable: ${formatEngineeringValue(limit, precision)} mm, η = ${(etaDelta * 100).toFixed(1)}%).`,
          `Sehim sınırı aşıldı: f = ${formatEngineeringValue(delta, precision)} mm (İzin verilen: ${formatEngineeringValue(limit, precision)} mm, η = %${(etaDelta * 100).toFixed(1)}).`
        );
      } else {
        weakestLink = t12(
          language,
          `Bending stress exceeds yield strength: σ_b = ${formatEngineeringValue(sigmaB, precision)} MPa (f_y = ${fy} MPa, η = ${(etaStress * 100).toFixed(1)}%).`,
          `Eğilme gerilmesi akma dayanımını aştı: σ_b = ${formatEngineeringValue(sigmaB, precision)} MPa (f_y = ${fy} MPa, η = %${(etaStress * 100).toFixed(1)}).`
        );
      }
    } else if (etaMax >= 0.8) {
      verdict = 'WARN';
      weakestLink = t12(
        language,
        `Capacity utilization approaching limit: ${(etaMax * 100).toFixed(1)}% (${etaDelta >= etaStress ? 'Deflection' : 'Bending'} governing). Consider dynamic allowance.`,
        `Kapasite kullanımı sınırda: %${(etaMax * 100).toFixed(1)} (${etaDelta >= etaStress ? 'Sehim' : 'Eğilme'} kritik). Dinamik darbe katsayısını değerlendirin.`
      );
    } else {
      verdict = 'PASS';
      weakestLink = t12(
        language,
        `Eurocode 3 & AISC 360 limit state criteria fully satisfied with adequate safety margin (${(etaMax * 100).toFixed(1)}%).`,
        `Eurocode 3 & AISC 360 sınır durum kriterleri tam güvenlik marjıyla (%${(etaMax * 100).toFixed(1)}) karşılandı.`
      );
    }

    const safetyFactor = sigmaB > 0 ? fy / sigmaB : 999;

    return {
      delta,
      maxMomentNmm,
      maxMomentKNm: maxMomentNmm / 1e6,
      sigmaB,
      sectionModulusCm3,
      limit,
      activeLimitRatio,
      etaDelta,
      etaStress,
      etaMax,
      verdict,
      weakestLink,
      safetyFactor,
    };
  }, [inputs, precision, language]);

  const activeColor = results.verdict === 'PASS'
    ? 'var(--ok)'
    : results.verdict === 'WARN'
    ? 'var(--warn)'
    : 'var(--bad)';

  // Limit state metrics for SafetyMarginBar
  const deflectionMetric: LimitStateMetric = {
    id: 'deflection',
    name: t12(language, 'Deflection Capacity Utilization', 'Sehim Kapasite Kullanımı'),
    symbol: 'δ',
    demand: results.delta,
    capacity: results.limit,
    unit: 'mm',
    utilization: results.etaDelta,
    standardCitation: `EN 1993-1-1 §7.2 (L/${results.activeLimitRatio})`,
    isCritical: results.etaDelta > 1.0,
  };

  const stressMetric: LimitStateMetric = {
    id: 'bending_stress',
    name: t12(language, 'Bending Stress Utilization', 'Eğilme Gerilmesi Kullanımı'),
    symbol: 'σ_b',
    demand: results.sigmaB,
    capacity: inputs.yieldStrength,
    unit: 'MPa',
    utilization: results.etaStress,
    standardCitation: 'EN 1993-1-1 §6.2.5 (f_y)',
    isCritical: results.etaStress > 1.0,
  };

  // Progressive Disclosure Sections
  const disclosureSections: DisclosureLevelSection[] = [
    {
      id: 'basic',
      title: t12(language, '1. Boundary, Load & Span', '1. Sınır Koşulları, Yük & Açıklık'),
      kicker: t12(language, 'CORE MECHANICAL PARAMETERS', 'TEMEL MEKANİK PARAMETRELER'),
      badge: 'ISO / DIN',
      activeSummary: [
        `${inputs.length} mm`,
        `${inputs.load} kN`,
        inputs.type === 'simple' ? t12(language, 'Simple', 'Basit Mesnet') : t12(language, 'Cantilever', 'Konsol'),
        `${inputs.modulus} GPa`,
      ],
      children: (
        <div className="space-y-4">
          {/* Support Type Toggle */}
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-[var(--alu-dim)] mb-1.5">
              {b.kinematicSetup || t12(language, 'Support Condition', 'Mesnet Koşulu')}
            </label>
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-[var(--bg-0)] rounded-[var(--radius-s)] border border-[var(--line)]">
              {(['simple', 'cantilever'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setInputs(prev => ({ ...prev, type }))}
                  className={`py-2 px-3 rounded-[var(--radius-s)] text-[11px] font-mono uppercase font-bold tracking-wider transition-all ${
                    inputs.type === type
                      ? 'bg-[var(--cyan)]/15 text-[var(--cyan)] border border-[var(--cyan)]/40 shadow-sm'
                      : 'text-[var(--alu-dim)] hover:text-[var(--ink)] hover:bg-[var(--bg-2)] border border-transparent'
                  }`}
                >
                  {type === 'simple' ? (b.simplySupported || 'Basit Mesnet') : (b.cantilever || 'Konsol')}
                </button>
              ))}
            </div>
          </div>

          {/* Span Length */}
          <SmartInputField
            id="length"
            label={d.spanLength || t12(language, 'Span Length (L)', 'Açıklık Boyu (L)')}
            sublabel={t12(language, 'Clear distance between supports', 'Mesnetler arası net açıklık mesafesi')}
            valueSi={inputs.length}
            onChangeSi={(v) => setInputs(prev => ({ ...prev, length: v }))}
            units={LENGTH_UNITS}
            min={100}
            max={50000}
            onFocusFieldId={setFocusedFieldId}
            onBlurFieldId={() => setFocusedFieldId(null)}
          />

          {/* Applied Load */}
          <SmartInputField
            id="load"
            label={b.appliedLoad || t12(language, 'Applied Point Load (F)', 'Uygulanan Noktasal Yük (F)')}
            sublabel={inputs.type === 'simple' ? t12(language, 'Midspan point load', 'Kiriş ortasında tekil yük') : t12(language, 'End point load', 'Serbest uçta tekil yük')}
            valueSi={inputs.load}
            onChangeSi={(v) => setInputs(prev => ({ ...prev, load: v }))}
            units={LOAD_UNITS}
            min={0.01}
            max={5000}
            onFocusFieldId={setFocusedFieldId}
            onBlurFieldId={() => setFocusedFieldId(null)}
          />

          {/* Material Preset Selector */}
          <div>
            <div className="flex justify-between items-baseline mb-1.5">
              <label className="text-[10px] font-mono uppercase tracking-wider text-[var(--alu-dim)]">
                {t12(language, 'Material Selection', 'Malzeme Seçimi')}
              </label>
              <span className="text-[10px] font-mono text-[var(--alu-dim)]">
                E = {inputs.modulus} GPa
              </span>
            </div>
            <select
              value={inputs.materialId}
              onChange={(e) => {
                const matId = e.target.value;
                const mat = MATERIAL_PRESETS.find(m => m.id === matId);
                if (mat) {
                  setInputs(prev => ({
                    ...prev,
                    materialId: matId,
                    modulus: mat.modulusGPa,
                    yieldStrength: mat.yieldStrengthMPa,
                  }));
                } else {
                  setInputs(prev => ({ ...prev, materialId: 'custom' }));
                }
              }}
              className="w-full bg-[var(--bg-0)] text-[var(--ink)] border border-[var(--line)] rounded-[var(--radius-s)] px-3 py-2 text-xs font-mono focus:border-[var(--cyan)] focus:outline-none transition-colors"
            >
              {MATERIAL_PRESETS.map((m) => (
                <option key={m.id} value={m.id}>
                  {t12(language, m.nameEn, m.nameTr)} ({m.modulusGPa} GPa · {m.yieldStrengthMPa} MPa)
                </option>
              ))}
            </select>
          </div>

          {/* Elastic Modulus */}
          <SmartInputField
            id="modulus"
            label={d.modulusOfElasticity || t12(language, 'Elastic Modulus (E)', 'Elastisite Modülü (E)')}
            sublabel={t12(language, "Young's modulus of elasticity", 'Young elastisite katsayısı')}
            valueSi={inputs.modulus}
            onChangeSi={(v) => setInputs(prev => ({ ...prev, modulus: v, materialId: 'custom' }))}
            units={MODULUS_UNITS}
            min={1}
            max={1000}
            onFocusFieldId={setFocusedFieldId}
            onBlurFieldId={() => setFocusedFieldId(null)}
          />

          {/* Area Moment of Inertia */}
          <SmartInputField
            id="inertia"
            label={d.inertiaMoment || t12(language, 'Area Moment of Inertia (Ix)', 'Atalet Momenti (Ix)')}
            sublabel={t12(language, 'Cross-sectional moment of inertia', 'Eğilme eksenine göre kesit ataleti')}
            valueSi={inputs.inertia}
            onChangeSi={(v) => setInputs(prev => ({ ...prev, inertia: v }))}
            units={INERTIA_UNITS}
            min={0.01}
            max={10000}
            onFocusFieldId={setFocusedFieldId}
            onBlurFieldId={() => setFocusedFieldId(null)}
          />
        </div>
      ),
    },
    {
      id: 'assembly',
      title: t12(language, '2. Section Geometry & Stress', '2. Kesit Geometrisi & Gerilme'),
      kicker: t12(language, 'MODULUS & STRESS CHECK', 'MUKAVEMET & GERİLME KONTROLÜ'),
      isDirty: inputs.height !== 160 || inputs.yieldStrength !== (MATERIAL_PRESETS.find(m => m.id === inputs.materialId)?.yieldStrengthMPa ?? 240),
      activeSummary: [
        `h = ${inputs.height} mm`,
        `fy = ${inputs.yieldStrength} MPa`,
        `Wx = ${formatEngineeringValue(results.sectionModulusCm3, precision)} cm³`,
      ],
      onResetToDefaults: () => {
        const mat = MATERIAL_PRESETS.find(m => m.id === inputs.materialId);
        setInputs(prev => ({
          ...prev,
          height: 160,
          yieldStrength: mat?.yieldStrengthMPa ?? 240,
        }));
      },
      children: (
        <div className="space-y-4">
          <p className="text-[11px] font-mono text-[var(--alu-dim)] leading-relaxed">
            {t12(language, 'Specify section height to determine extreme fiber bending stress (σ_b = M / Wx) and yield safety.', 'Kesit yüksekliği girilerek en dış lifteki maksimum eğilme gerilmesi (σ_b = M / Wx) ve akma emniyeti hesaplanır.')}
          </p>

          {/* Section Height */}
          <SmartInputField
            id="height"
            label={t12(language, 'Beam Section Height (h)', 'Kesit Yüksekliği (h)')}
            sublabel={t12(language, 'Overall cross-section depth', 'Düşey yöndeki profil toplam yüksekliği')}
            valueSi={inputs.height}
            onChangeSi={(v) => setInputs(prev => ({ ...prev, height: v }))}
            units={HEIGHT_UNITS}
            min={10}
            max={3000}
            onFocusFieldId={setFocusedFieldId}
            onBlurFieldId={() => setFocusedFieldId(null)}
          />

          {/* Yield Strength */}
          <SmartInputField
            id="yieldStrength"
            label={t12(language, 'Material Yield Strength (fy)', 'Akma Dayanımı (fy)')}
            sublabel={t12(language, 'Characteristic yield strength limit', 'Karakteristik akma gerilme sınırı')}
            valueSi={inputs.yieldStrength}
            onChangeSi={(v) => setInputs(prev => ({ ...prev, yieldStrength: v, materialId: 'custom' }))}
            units={STRESS_UNITS}
            min={10}
            max={2000}
            onFocusFieldId={setFocusedFieldId}
            onBlurFieldId={() => setFocusedFieldId(null)}
          />

          {/* Derived Section Modulus Readout */}
          <div className="p-3 bg-[var(--bg-0)] rounded-[var(--radius-s)] border border-[var(--line)]">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-[var(--alu-dim)]">{t12(language, 'Section Modulus (Wx = 2·I/h):', 'Mukavemet Momenti (Wx = 2·I/h):')}</span>
              <span className="text-[var(--cyan)] font-bold">{formatEngineeringValue(results.sectionModulusCm3, precision)} cm³</span>
            </div>
            <div className="flex justify-between items-center text-xs font-mono mt-1.5 pt-1.5 border-t border-[var(--line)]">
              <span className="text-[var(--alu-dim)]">{t12(language, 'Max Bending Moment (M_max):', 'Maksimum Bükme Momenti (M_max):')}</span>
              <span className="text-[var(--ink)] font-bold">{formatEngineeringValue(results.maxMomentKNm, precision)} kN·m</span>
            </div>
            <div className="flex justify-between items-center text-xs font-mono mt-1.5 pt-1.5 border-t border-[var(--line)]">
              <span className="text-[var(--alu-dim)]">{t12(language, 'Max Bending Stress (σ_b):', 'Maks. Eğilme Gerilmesi (σ_b):')}</span>
              <span className={`font-bold ${results.sigmaB > inputs.yieldStrength ? 'text-[var(--bad)]' : 'text-[var(--ok)]'}`}>
                {formatEngineeringValue(results.sigmaB, precision)} MPa
              </span>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'advanced',
      title: t12(language, '3. Deflection Standards & Limits', '3. Sehim Standartları & Limitler'),
      kicker: t12(language, 'EUROCODE 3 / AISC LIMIT STATES', 'EUROCODE 3 / AISC LİMİT DURUMLAR'),
      isDirty: inputs.limitRatioPreset !== 'ec3_general',
      activeSummary: [
        `L / ${results.activeLimitRatio}`,
        `Limit = ${formatEngineeringValue(results.limit, precision)} mm`,
      ],
      onResetToDefaults: () => {
        setInputs(prev => ({
          ...prev,
          limitRatioPreset: 'ec3_general',
          customLimitRatio: 300,
        }));
      },
      children: (
        <div className="space-y-4">
          <p className="text-[11px] font-mono text-[var(--alu-dim)] leading-relaxed">
            {t12(language, 'Permissible deflection limits based on engineering specifications and building codes (Eurocode 3 / AISC 360).', 'Mühendislik şartnameleri ve yapı standartlarına (Eurocode 3 EN 1993-1-1 / AISC 360) göre izin verilen sehim sınır oranı.')}
          </p>

          <div className="space-y-2">
            {DEFLECTION_LIMITS.map((lim) => (
              <label
                key={lim.id}
                className={`flex items-center justify-between p-2.5 rounded-[var(--radius-s)] border cursor-pointer transition-all ${
                  inputs.limitRatioPreset === lim.id
                    ? 'bg-[var(--cyan)]/10 border-[var(--cyan)]/40 text-[var(--ink)]'
                    : 'bg-[var(--bg-0)] border-[var(--line)] text-[var(--alu-dim)] hover:border-[var(--line-strong)]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="deflectionLimit"
                    value={lim.id}
                    checked={inputs.limitRatioPreset === lim.id}
                    onChange={() => setInputs(prev => ({ ...prev, limitRatioPreset: lim.id }))}
                    className="accent-[var(--cyan)]"
                  />
                  <span className="text-xs font-mono font-medium">{t12(language, lim.labelEn, lim.labelTr)}</span>
                </div>
                <span className="text-[10px] font-mono text-[var(--std)] border border-[var(--std)]/30 rounded px-1.5 py-0.5">
                  {lim.standard}
                </span>
              </label>
            ))}
          </div>

          {inputs.limitRatioPreset === 'custom' && (
            <div className="pt-2">
              <label className="block text-[10px] font-mono uppercase tracking-wider text-[var(--alu-dim)] mb-1">
                {t12(language, 'Custom Limit Denominator (L / n)', 'Özel Sınır Oranı (L / n)')}
              </label>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-[var(--alu-dim)]">L /</span>
                <input
                  type="number"
                  min={10}
                  max={2000}
                  value={inputs.customLimitRatio}
                  onChange={(e) => setInputs(prev => ({ ...prev, customLimitRatio: Number(e.target.value) || 300 }))}
                  className="w-full bg-[var(--bg-0)] text-[var(--ink)] border border-[var(--line)] rounded-[var(--radius-s)] px-3 py-1.5 text-xs font-mono focus:border-[var(--cyan)] focus:outline-none"
                />
              </div>
            </div>
          )}

          <div className="p-3 bg-[var(--bg-0)] rounded-[var(--radius-s)] border border-[var(--line)] flex justify-between items-center text-xs font-mono">
            <span className="text-[var(--alu-dim)]">{t12(language, 'Calculated Limit (δ_allow):', 'Hesaplanan Sınır Değeri (δ_izin):')}</span>
            <span className="text-[var(--cyan)] font-bold">{formatEngineeringValue(results.limit, precision)} mm</span>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col lg:flex-row h-full w-full bg-[var(--bg-0)] text-[var(--ink)] overflow-y-auto lg:overflow-hidden select-none">
      {/* LEFT CONTROL PANEL (Instrument Chassis) */}
      <div className="w-full lg:w-[420px] shrink-0 flex flex-col h-auto lg:h-full bg-[var(--bg-1)] border-r border-[var(--line)] p-4 overflow-y-auto custom-scrollbar">
        {/* Header Instrument Badge */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-[var(--line)]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[var(--cyan)]/10 rounded-[var(--radius-s)] border border-[var(--cyan)]/30 text-[var(--cyan)]">
              <Layers size={18} strokeWidth={2} />
            </div>
            <div>
              <h2 className="text-base font-mono font-bold tracking-tight text-[var(--ink)]">
                {t.modules?.beamDeflection?.title || t12(language, 'Beam Deflection Analysis', 'Kiriş Sehim Analizi')}
              </h2>
              <p className="text-[10px] text-[var(--alu-dim)] font-mono uppercase tracking-wider mt-0.5">
                Eurocode 3 · AISC 360-16 · ISO 22986
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setInputs({
                type: 'simple',
                length: 3000,
                load: 10,
                materialId: 'al6061',
                modulus: 70,
                inertia: 15.5,
                height: 160,
                yieldStrength: 240,
                limitRatioPreset: 'ec3_general',
                customLimitRatio: 300,
              });
            }}
            title={t12(language, 'Reset All Parameters', 'Tüm Parametreleri Sıfırla')}
            className="p-1.5 rounded-[var(--radius-s)] border border-[var(--line)] text-[var(--alu-dim)] hover:text-[var(--ink)] hover:bg-[var(--bg-2)] transition-colors"
          >
            <RotateCcw size={14} />
          </button>
        </div>

        {/* 3-Tier Progressive Disclosure Accordion */}
        <div className="flex-1 pb-4">
          <ProgressiveDisclosure sections={disclosureSections} />
        </div>
      </div>

      {/* RIGHT DISPLAY PANEL (Visual Kinematics & Limit State Telemetry) */}
      <div className="flex-1 h-auto lg:h-full flex flex-col p-4 lg:p-6 overflow-y-auto custom-scrollbar gap-4 min-w-0">
        {/* Top Limit State Verdict Banner */}
        <VerdictBadge
          status={results.verdict}
          primaryMetricLabel={t12(language, 'Max Capacity Utilization', 'Maksimum Kapasite Kullanımı')}
          maxUtilization={results.etaMax}
          weakestLinkText={results.weakestLink}
          standardCitation="Eurocode 3 (EN 1993-1-1) & AISC 360-16"
        />

        {/* Primary Digital Readout & HUD */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Main Deflection Display */}
          <div className="p-4 rounded-[var(--radius-m)] bg-[var(--bg-1)] border border-[var(--line)]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--alu-dim)] flex items-center gap-1.5">
                <Ruler size={13} className="text-[var(--cyan)]" />
                {d.maxDeflection || t12(language, 'Maximum Deflection (δ_max)', 'Maksimum Sehim (δ_max)')}
              </span>
              <span
                className="text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase"
                style={{
                  color: activeColor,
                  backgroundColor: `color-mix(in srgb, ${activeColor} 12%, transparent)`,
                  border: `1px solid color-mix(in srgb, ${activeColor} 30%, transparent)`,
                }}
              >
                {results.verdict === 'PASS' ? (b.integrityNormal || 'NORMAL') : (b.limitExceeded || 'LİMİT AŞILDI')}
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <span
                className="text-5xl lg:text-5xl font-mono font-black tracking-tight"
                style={{
                  color: activeColor,
                  textShadow: `0 0 20px color-mix(in srgb, ${activeColor} 35%, transparent)`,
                }}
              >
                {formatEngineeringValue(results.delta, precision)}
              </span>
              <span className="text-xl font-mono text-[var(--alu-dim)]">mm</span>
            </div>

            <div className="mt-3 pt-2.5 border-t border-[var(--line)] flex items-center justify-between text-xs font-mono text-[var(--alu-dim)]">
              <span>{t12(language, 'Allowable Deflection Limit:', 'İzin Verilen Sehim Sınırı:')}</span>
              <span className="text-[var(--ink)] font-bold">{formatEngineeringValue(results.limit, precision)} mm</span>
            </div>
          </div>

          {/* Stress & Moment HUD Card */}
          <div className="p-4 rounded-[var(--radius-m)] bg-[var(--bg-1)] border border-[var(--line)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--alu-dim)] flex items-center gap-1.5">
                  <Target size={13} className="text-[var(--warn)]" />
                  {t12(language, 'Max Bending Stress (σ_b)', 'Maksimum Eğilme Gerilmesi (σ_b)')}
                </span>
                <span className="text-[10px] font-mono text-[var(--alu-dim)]">
                  f_y = {inputs.yieldStrength} MPa
                </span>
              </div>

              <div className="flex items-baseline gap-2">
                <span
                  className="text-4xl font-mono font-bold tracking-tight"
                  style={{
                    color: results.sigmaB > inputs.yieldStrength ? 'var(--bad)' : 'var(--ink)',
                  }}
                >
                  {formatEngineeringValue(results.sigmaB, precision)}
                </span>
                <span className="text-lg font-mono text-[var(--alu-dim)]">MPa</span>
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-[var(--line)] grid grid-cols-2 gap-2 text-xs font-mono">
              <div>
                <span className="text-[var(--alu-dim)] block text-[10px] uppercase">M_max</span>
                <span className="text-[var(--ink)] font-bold">{formatEngineeringValue(results.maxMomentKNm, precision)} kN·m</span>
              </div>
              <div>
                <span className="text-[var(--alu-dim)] block text-[10px] uppercase">{t12(language, 'Safety Factor', 'Emniyet Faktörü')}</span>
                <span className={`font-bold ${results.safetyFactor < 1.0 ? 'text-[var(--bad)]' : results.safetyFactor < 1.25 ? 'text-[var(--warn)]' : 'text-[var(--ok)]'}`}>
                  {results.safetyFactor > 50 ? '> 50' : formatEngineeringValue(results.safetyFactor, 2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Dual Eurocode/FEA Safety Margin Bars */}
        <div className="p-4 rounded-[var(--radius-m)] bg-[var(--bg-1)] border border-[var(--line)] space-y-4">
          <SafetyMarginBar metric={deflectionMetric} showDetails />
          <SafetyMarginBar metric={stressMetric} showDetails />
        </div>

        {/* Interactive 2D Vector Drawing (Deformation & Kinematics) */}
        <div className="flex-1 min-h-[300px] rounded-[var(--radius-m)] bg-[var(--bg-1)] border border-[var(--line)] relative overflow-hidden flex flex-col justify-between p-4">
          {/* Subtle Grid Background */}
          <div
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{
              backgroundImage: 'linear-gradient(to right, var(--line) 1px, transparent 1px), linear-gradient(to bottom, var(--line) 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />

          {/* Diagram Header / HUD Tags */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-[var(--alu-dim)]">
              <Ruler size={13} className="text-[var(--cyan)]" />
              <span>{b.liveDeformation || t12(language, 'LIVE DEFORMATION KINEMATICS', 'ANLIK SEHİM KİNEMATİĞİ')}</span>
              <span className="text-[var(--cyan)]">({inputs.type === 'simple' ? 'Simple Support' : 'Cantilever'})</span>
            </div>

            {focusedFieldId && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--cyan)]/15 border border-[var(--cyan)]/40 text-[var(--cyan)] animate-pulse">
                {t12(language, 'Active Input:', 'Vurgulanan Parametre:')} {focusedFieldId}
              </span>
            )}
          </div>

          {/* SVG Vector Canvas */}
          <div className="w-full h-[220px] relative z-10 flex items-center justify-center my-auto">
            <motion.svg
              className="w-full h-full overflow-visible"
              viewBox="0 0 1000 260"
              preserveAspectRatio="xMidYMid meet"
            >
              <defs>
                <linearGradient id="beamSteelGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#475569" />
                  <stop offset="50%" stopColor="#334155" />
                  <stop offset="100%" stopColor="#1e293b" />
                </linearGradient>

                <linearGradient id="beamStressGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#0ea5e9" />
                  <stop offset="50%" stopColor={results.verdict === 'PASS' ? '#10b981' : results.verdict === 'WARN' ? '#f59e0b' : '#ef4444'} />
                  <stop offset="100%" stopColor="#0ea5e9" />
                </linearGradient>

                <pattern id="wallCrossHatch" width="10" height="10" patternUnits="userSpaceOnUse">
                  <path d="M 0 10 L 10 0 M -2 2 L 2 -2 M 8 12 L 12 8" stroke="#475569" strokeWidth="1.2" opacity="0.6" />
                </pattern>

                <filter id="beamActiveGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow
                    dx="0"
                    dy="4"
                    stdDeviation="6"
                    floodColor={results.verdict === 'PASS' ? '#10b981' : results.verdict === 'WARN' ? '#f59e0b' : '#ef4444'}
                    floodOpacity="0.3"
                  />
                </filter>
              </defs>

              {/* Undeformed Neutral Reference Line */}
              <line
                x1="100"
                y1="100"
                x2="900"
                y2="100"
                stroke="rgba(255,255,255,0.18)"
                strokeWidth="1.5"
                strokeDasharray="6, 5"
              />

              {/* Simple Supports (Left Pin + Right Roller) */}
              {inputs.type === 'simple' && (
                <>
                  {/* Left Pin Support */}
                  <g transform="translate(100, 100)" className={focusedFieldId === 'type' ? 'filter drop-' : ''}>
                    <path d="M -20,40 L -20,32 L -6,10 L 0,0 L 6,10 L 20,32 L 20,40 Z" fill="url(#beamSteelGrad)" stroke="#64748b" strokeWidth="1.5" />
                    <circle cx="0" cy="0" r="5" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" />
                    <rect x="-24" y="40" width="48" height="6" rx="1.5" fill="#1e293b" stroke="#475569" strokeWidth="1.2" />
                  </g>

                  {/* Right Roller Support */}
                  <g transform="translate(900, 100)" className={focusedFieldId === 'type' ? 'filter drop-' : ''}>
                    <path d="M -16,26 L -6,10 L 0,0 L 6,10 L 16,26 Z" fill="url(#beamSteelGrad)" stroke="#64748b" strokeWidth="1.5" />
                    <circle cx="0" cy="0" r="5" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" />
                    <circle cx="-9" cy="34" r="5" fill="#334155" stroke="#94a3b8" strokeWidth="1.2" />
                    <circle cx="9" cy="34" r="5" fill="#334155" stroke="#94a3b8" strokeWidth="1.2" />
                    <rect x="-24" y="40" width="48" height="6" rx="1.5" fill="#1e293b" stroke="#475569" strokeWidth="1.2" />
                  </g>
                </>
              )}

              {/* Cantilever Support (Fixed Wall on Left) */}
              {inputs.type === 'cantilever' && (
                <g transform="translate(60, 40)" className={focusedFieldId === 'type' ? 'filter drop-' : ''}>
                  <rect x="0" y="0" width="40" height="120" rx="3" fill="url(#wallCrossHatch)" stroke="#475569" strokeWidth="2" />
                  <line x1="40" y1="0" x2="40" y2="120" stroke="var(--cyan)" strokeWidth="3" opacity="0.8" />
                  <rect x="34" y="38" width="12" height="44" rx="2" fill="url(#beamSteelGrad)" stroke="#64748b" strokeWidth="1.5" />
                  <circle cx="38" cy="46" r="2.5" fill="#f59e0b" />
                  <circle cx="38" cy="74" r="2.5" fill="#f59e0b" />
                </g>
              )}

              {/* Deformed Beam Solid Body */}
              {(() => {
                const dVal = Math.min(Math.max(results.delta * 3.5, 0), 120);
                const hBeam = Math.min(Math.max(inputs.height / 8, 12), 28);

                let pathWeb = '';
                let pathTopFlange = '';
                let pathBotFlange = '';

                if (inputs.type === 'simple') {
                  pathWeb = `M 100,${100 - hBeam / 2} Q 500,${100 + dVal - hBeam / 2} 900,${100 - hBeam / 2} L 900,${100 + hBeam / 2} Q 500,${100 + dVal + hBeam / 2} 100,${100 + hBeam / 2} Z`;
                  pathTopFlange = `M 100,${100 - hBeam / 2} Q 500,${100 + dVal - hBeam / 2} 900,${100 - hBeam / 2}`;
                  pathBotFlange = `M 100,${100 + hBeam / 2} Q 500,${100 + dVal + hBeam / 2} 900,${100 + hBeam / 2}`;
                } else {
                  pathWeb = `M 100,${100 - hBeam / 2} C 450,${100 - hBeam / 2} 700,${100 + dVal - hBeam / 2} 900,${100 + dVal - hBeam / 2} L 900,${100 + dVal + hBeam / 2} C 700,${100 + dVal + hBeam / 2} 450,${100 + hBeam / 2} 100,${100 + hBeam / 2} Z`;
                  pathTopFlange = `M 100,${100 - hBeam / 2} C 450,${100 - hBeam / 2} 700,${100 + dVal - hBeam / 2} 900,${100 + dVal - hBeam / 2}`;
                  pathBotFlange = `M 100,${100 + hBeam / 2} C 450,${100 + hBeam / 2} 700,${100 + dVal + hBeam / 2} 900,${100 + dVal + hBeam / 2}`;
                }

                return (
                  <g
                    filter="url(#beamActiveGlow)"
                    className={
                      focusedFieldId === 'inertia' || focusedFieldId === 'modulus' || focusedFieldId === 'height'
                        ? 'filter drop-'
                        : ''
                    }
                  >
                    <path d={pathWeb} fill="url(#beamStressGrad)" stroke="#475569" strokeWidth="1.2" opacity="0.85" />
                    <path d={pathTopFlange} fill="none" stroke="#e2e8f0" strokeWidth="3.5" strokeLinecap="round" />
                    <path d={pathBotFlange} fill="none" stroke="#0f172a" strokeWidth="3.5" strokeLinecap="round" />
                  </g>
                );
              })()}

              {/* Animated Load Vector Arrow */}
              {(() => {
                const dVal = Math.min(Math.max(results.delta * 3.5, 0), 120);
                const arrowX = inputs.type === 'simple' ? 500 : 900;
                const arrowY = 100 + dVal;

                return (
                  <motion.g
                    animate={{ x: arrowX, y: arrowY }}
                    transition={{ type: 'spring', stiffness: 80, damping: 18 }}
                    className={focusedFieldId === 'load' ? 'filter drop-' : ''}
                  >
                    <line x1="0" y1="-60" x2="0" y2="-8" stroke="#f59e0b" strokeWidth="5" strokeLinecap="round" />
                    <polygon points="-8,-16 8,-16 0,-2" fill="#f59e0b" />
                    <rect
                      x="-35"
                      y="-82"
                      width="70"
                      height="20"
                      rx="3"
                      fill="var(--bg-0)"
                      stroke="#f59e0b"
                      strokeWidth="1.2"
                    />
                    <text
                      x="0"
                      y="-68"
                      textAnchor="middle"
                      fill="#f59e0b"
                      fontSize="11"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      {inputs.load} kN
                    </text>
                  </motion.g>
                );
              })()}

              {/* Span Length Dimension Line */}
              <g
                transform="translate(0, 180)"
                className={focusedFieldId === 'length' ? 'text-[var(--cyan)] font-bold' : 'text-[var(--alu-dim)]'}
              >
                <line x1="100" y1="0" x2="900" y2="0" stroke="currentColor" strokeWidth="1.2" />
                <line x1="100" y1="-6" x2="100" y2="6" stroke="currentColor" strokeWidth="1.2" />
                <line x1="900" y1="-6" x2="900" y2="6" stroke="currentColor" strokeWidth="1.2" />
                <rect x="440" y="-10" width="120" height="20" rx="3" fill="var(--bg-1)" />
                <text
                  x="500"
                  y="4"
                  textAnchor="middle"
                  fill="currentColor"
                  fontSize="11"
                  fontFamily="monospace"
                >
                  L = {inputs.length} mm
                </text>
              </g>

              {/* Deflection Dimension Callout */}
              {results.delta > 0.01 && (
                (() => {
                  const dVal = Math.min(Math.max(results.delta * 3.5, 0), 120);
                  const xPos = inputs.type === 'simple' ? 520 : 920;

                  return (
                    <g transform={`translate(${xPos}, 100)`}>
                      <line x1="0" y1="0" x2="0" y2={dVal} stroke={activeColor} strokeWidth="1.5" strokeDasharray="3, 3" />
                      <line x1="-4" y1={dVal} x2="4" y2={dVal} stroke={activeColor} strokeWidth="2" />
                      <text
                        x="8"
                        y={dVal / 2 + 4}
                        fill={activeColor}
                        fontSize="10"
                        fontFamily="monospace"
                        fontWeight="bold"
                      >
                        δ = {formatEngineeringValue(results.delta, precision)} mm
                      </text>
                    </g>
                  );
                })()
              )}
            </motion.svg>
          </div>

          {/* Footer Metadata & Standard Citations */}
          <div className="relative z-10 flex flex-wrap items-center justify-between pt-3 border-t border-[var(--line)] text-[10px] font-mono text-[var(--alu-dim)]">
            <div className="flex items-center gap-3">
              <span>{t12(language, 'Theory:', 'Analiz Modeli:')} Euler-Bernoulli (EN 1993-1-1)</span>
              <span>·</span>
              <span>{t12(language, 'Limit State:', 'Sınır Durum:')} SLS ({t12(language, 'Deflection', 'Sehim')}) & ULS ({t12(language, 'Bending', 'Eğilme')})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[var(--cyan)]">{APP_RELEASE_NAME}</span>
              <span>·</span>
              <span>{t12(language, 'Precision:', 'Hassasiyet:')} {precision} dec</span>
            </div>
          </div>
        </div>

        {/* Warning Alert Banner (if limit exceeded) */}
        <AnimatePresence>
          {results.verdict === 'FAIL' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="bg-[var(--bad)]/10 border border-[var(--bad)]/40 rounded-[var(--radius-m)] p-3.5 flex items-start gap-3 text-[var(--bad)]"
            >
              <AlertTriangle className="shrink-0 mt-0.5" size={20} />
              <div>
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider">
                  {b.criticalWarning || t12(language, 'CRITICAL STRUCTURAL DEFLECTION WARNING', 'KRİTİK YAPISAL SEHİM UYARISI')}
                </h4>
                <p className="text-[11px] font-mono opacity-90 mt-1 leading-relaxed">
                  {formatBeamCriticalWarning(b, inputs.inertia, Math.ceil(inputs.inertia * 1.5)) ||
                    t12(
                      language,
                      `Deflection or stress exceeds permissible limit. Increase beam inertia (${inputs.inertia} → ${Math.ceil(inputs.inertia * 1.5)} 10⁶ mm⁴) or choose stiffer material.`,
                      `Mevcut sehim veya gerilme limit değerleri aşıyor. Kiriş atalet momentini artırın (${inputs.inertia} → ${Math.ceil(inputs.inertia * 1.5)} 10⁶ mm⁴) veya daha rijit malzeme seçin.`
                    )}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
