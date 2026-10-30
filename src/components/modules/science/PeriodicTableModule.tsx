'use client';

import React, { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { PERIODIC_TABLE_DATA, ElementData } from '@/data/periodicTableData';
import { CHEMICAL_COMPOUNDS, ChemicalCompound } from '@/data/chemicalCompounds';

const ChemistryReactionsModule = dynamic(() => import('@/modules/science/ChemistryReactions'), {
  loading: () => <div className="p-12 text-center text-slate-400 font-mono text-xs">Loading Chemistry Reaction Synthesizer...</div>
});
import { 
  Search, 
  Info, 
  Beaker, 
  Thermometer, 
  Box, 
  Layers, 
  Atom, 
  Zap, 
  Database, 
  TestTube2, 
  FlaskConical,
  Scale,
  Sparkles,
  Sliders,
  CheckCircle2,
  Copy,
  Check,
  RefreshCw,
  Flame,
  Snowflake,
  Activity,
  Maximize2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useI18nStore } from '@/store/i18nStore';
import { t12 } from '@/locales/t12';
import { useGlobalPrecision, formatEngineeringValue } from '@/components/calculator-kit/precisionUtils';

// Pauling Electronegativity Lookup
const ELECTRONEGATIVITY: Record<number, number> = {
  1: 2.20, 2: 0, 3: 0.98, 4: 1.57, 5: 2.04, 6: 2.55, 7: 3.04, 8: 3.44, 9: 3.98, 10: 0,
  11: 0.93, 12: 1.31, 13: 1.61, 14: 1.90, 15: 2.19, 16: 2.58, 17: 3.16, 18: 0,
  19: 0.82, 20: 1.00, 21: 1.36, 22: 1.54, 23: 1.63, 24: 1.66, 25: 1.55, 26: 1.83, 27: 1.88, 28: 1.91, 29: 1.90, 30: 1.65,
  31: 1.81, 32: 2.01, 33: 2.18, 34: 2.55, 35: 2.96, 36: 3.00,
  37: 0.82, 38: 0.95, 39: 1.22, 40: 1.33, 41: 1.60, 42: 2.16, 43: 1.90, 44: 2.20, 45: 2.28, 46: 2.20, 47: 1.93, 48: 1.69,
  49: 1.78, 50: 1.96, 51: 2.05, 52: 2.10, 53: 2.66, 54: 2.60,
  55: 0.79, 56: 0.89, 57: 1.10, 58: 1.12, 59: 1.13, 60: 1.14, 61: 1.13, 62: 1.17, 63: 1.20, 64: 1.20, 65: 1.10, 66: 1.22, 67: 1.23, 68: 1.24, 69: 1.25, 70: 1.10, 71: 1.27,
  72: 1.30, 73: 1.50, 74: 2.36, 75: 1.90, 76: 2.20, 77: 2.20, 78: 2.28, 79: 2.54, 80: 2.00, 81: 1.62, 82: 2.33, 83: 2.02, 84: 2.00, 85: 2.20, 86: 2.20,
  87: 0.70, 88: 0.90, 89: 1.10, 90: 1.30, 91: 1.50, 92: 1.38, 93: 1.36, 94: 1.28, 95: 1.13, 96: 1.28, 97: 1.30, 98: 1.30, 99: 1.30, 100: 1.30, 101: 1.30, 102: 1.30, 103: 1.30
};

// Common Oxidation States / Valencies for Simple Reaction Prediction
const TYPICAL_VALENCIES: Record<number, number> = {
  1: 1, 2: 0, 3: 1, 4: 2, 5: 3, 6: 4, 7: -3, 8: -2, 9: -1, 10: 0,
  11: 1, 12: 2, 13: 3, 14: 4, 15: -3, 16: -2, 17: -1, 18: 0,
  19: 1, 20: 2, 21: 3, 22: 4, 23: 5, 24: 3, 25: 2, 26: 3, 27: 2, 28: 2, 29: 2, 30: 2,
  31: 3, 32: 4, 33: -3, 34: -2, 35: -1, 36: 0,
  37: 1, 38: 2, 47: 1, 48: 2, 50: 4, 53: -1, 56: 2, 79: 3, 80: 2, 82: 2
};

const CATEGORY_COLORS: Record<string, string> = {
  "alkali metal": "#ff3838",
  "alkaline earth metal": "#ffb8b8",
  "transition metal": "#c56cf0",
  "post-transition metal": "#17c0eb",
  "metalloid": "#32ff7e",
  "diatomic nonmetal": "#3ae374",
  "polyatomic nonmetal": "#67e6dc",
  "noble gas": "#7efff5",
  "lanthanide": "#ff9f1a",
  "actinide": "#ffaf40",
  "unknown": "#4b4b4b"
};

const CATEGORY_LABELS: Record<string, { en: string, tr: string }> = {
  "alkali metal": { en: "Alkali Metal", tr: "Alkali Metal" },
  "alkaline earth metal": { en: "Alkaline Earth", tr: "Toprak Alkali" },
  "transition metal": { en: "Transition Metal", tr: "Geçiş Metali" },
  "post-transition metal": { en: "Post-Transition", tr: "Zayıf Metal" },
  "metalloid": { en: "Metalloid", tr: "Yarı Metal" },
  "diatomic nonmetal": { en: "Nonmetal", tr: "Ametal" },
  "polyatomic nonmetal": { en: "Nonmetal", tr: "Ametal" },
  "noble gas": { en: "Noble Gas", tr: "Soygaz" },
  "lanthanide": { en: "Lanthanide", tr: "Lantanit" },
  "actinide": { en: "Actinide", tr: "Aktinit" },
  "unknown": { en: "Unknown", tr: "Bilinmeyen" }
};

const COMPOUND_COLORS: Record<string, string> = {
  "Acid": "#ff3f34",
  "Base": "#0fbcf9",
  "Salt": "#ffc048",
  "Oxide": "#808e9b",
  "Organic": "#05c46b",
  "Mineral": "#b71540",
  "Alloy": "#d2dae2",
  "Gas": "#00d8d6",
  "Other": "#808e9b"
};

// Metallurgy Engineering Presets
const METALLURGY_PRESETS = [
  { id: 'all', nameEn: 'All Elements', nameTr: 'Tüm Elementler', elements: [] },
  { id: 'alu_alloys', nameEn: 'Aluminum Alloying (Mg, Si, Cu, Zn, Mn, Ti, Zr, Sc)', nameTr: 'Alüminyum Alaşım Katkıları (Mg, Si, Cu, Zn, Mn, Ti, Zr)', elements: [13, 12, 14, 29, 30, 25, 24, 22, 40, 21] },
  { id: 'steel_alloys', nameEn: 'Steel & Stainless (Fe, C, Cr, Ni, Mo, V, W, Nb)', nameTr: 'Çelik & Paslanmaz Katkıları (Fe, C, Cr, Ni, Mo, V, W, Nb)', elements: [26, 6, 24, 28, 42, 23, 74, 41, 25] },
  { id: 'semiconductors', nameEn: 'Semiconductors & Electronics (Si, Ge, Ga, As, In, P)', nameTr: 'Yarıiletkenler & Elektronik (Si, Ge, Ga, As, In, P, Sb)', elements: [14, 32, 31, 33, 49, 15, 51] },
  { id: 'precious', nameEn: 'Precious Metals (Au, Ag, Pt, Pd, Rh, Ir)', nameTr: 'Değerli & Asil Metaller (Au, Ag, Pt, Pd, Rh, Ir)', elements: [79, 47, 78, 46, 45, 77] },
  { id: 'light_metals', nameEn: 'Lightweight Aerospace (Li, Be, Mg, Al, Ti)', nameTr: 'Hafif Havacılık Metalleri (Li, Be, Mg, Al, Ti)', elements: [3, 4, 12, 13, 22] },
];

// Helper: Chemical Formula Parser
function parseFormula(rawFormula: string): { counts: Record<string, number>, error?: string } {
  try {
    const clean = rawFormula.trim().replace(/\s+/g, '');
    if (!clean) return { counts: {} };

    // Handle hydrate asterisk like CuSO4*5H2O or FeSO4.7H2O
    const parts = clean.split(/[*·.]/);
    const mainFormula = parts[0];
    const hydratePart = parts[1] || '';

    const parseSection = (formula: string, multiplier: number = 1): Record<string, number> => {
      const counts: Record<string, number> = {};
      const stack: Record<string, number>[] = [{}];
      let i = 0;

      while (i < formula.length) {
        const char = formula[i];

        if (char === '(' || char === '[' || char === '{') {
          stack.push({});
          i++;
        } else if (char === ')' || char === ']' || char === '}') {
          i++;
          let numStr = '';
          while (i < formula.length && /[0-9]/.test(formula[i])) {
            numStr += formula[i];
            i++;
          }
          const groupMult = numStr ? parseInt(numStr, 10) : 1;
          const popped = stack.pop() || {};
          const current = stack[stack.length - 1];

          for (const [el, cnt] of Object.entries(popped)) {
            current[el] = (current[el] || 0) + cnt * groupMult;
          }
        } else if (/[A-Z]/.test(char)) {
          let sym = char;
          i++;
          if (i < formula.length && /[a-z]/.test(formula[i])) {
            sym += formula[i];
            i++;
          }
          let numStr = '';
          while (i < formula.length && /[0-9]/.test(formula[i])) {
            numStr += formula[i];
            i++;
          }
          const elCount = numStr ? parseInt(numStr, 10) : 1;
          const current = stack[stack.length - 1];
          current[sym] = (current[sym] || 0) + elCount;
        } else {
          i++;
        }
      }

      const res = stack[0];
      for (const el in res) {
        res[el] *= multiplier;
      }
      return res;
    };

    const mainCounts = parseSection(mainFormula, 1);

    if (hydratePart) {
      const match = hydratePart.match(/^([0-9]*)(.*)$/);
      const hydrateMult = match && match[1] ? parseInt(match[1], 10) : 1;
      const hydrateSubFormula = match ? match[2] : hydratePart;
      const hydrateCounts = parseSection(hydrateSubFormula, hydrateMult);

      for (const [el, cnt] of Object.entries(hydrateCounts)) {
        mainCounts[el] = (mainCounts[el] || 0) + cnt;
      }
    }

    return { counts: mainCounts };
  } catch (e: any) {
    return { counts: {}, error: e.message };
  }
}

export default function PeriodicTableModule({ lang: propLang, initialMode = 'Elements' }: { lang?: string, dict?: any, initialMode?: 'Elements' | 'MolarCalc' | 'BondPredictor' | 'Materials' | 'Reactions' }) {
  const precision = useGlobalPrecision();
  const { language: storeLang } = useI18nStore();
  const lang = propLang || storeLang || 'tr';

  const [viewMode, setViewMode] = useState<'Elements' | 'MolarCalc' | 'BondPredictor' | 'Materials' | 'Reactions'>(initialMode);
  const [selectedElement, setSelectedElement] = useState<ElementData | null>(null);
  const [selectedCompound, setSelectedCompound] = useState<ChemicalCompound | null>(null);

  // Heatmap mode
  const [heatmapMetric, setHeatmapMetric] = useState<'category' | 'electronegativity' | 'density' | 'melt' | 'mass'>('category');

  // Temperature Simulation (Kelvin: 0 K to 6000 K)
  const [currentTempK, setCurrentTempK] = useState<number>(298.15); // 25°C STP default

  // Metallurgy filter
  const [selectedMetallurgy, setSelectedMetallurgy] = useState<string>('all');

  // Element Search / Filter
  const [elementFilter, setElementFilter] = useState('');
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  // Compound Filters
  const [compoundFilter, setCompoundFilter] = useState('');
  const [compoundCategoryMode, setCompoundCategoryMode] = useState<string | null>(null);

  // Molar Mass Calculator State
  const [molarFormula, setMolarFormula] = useState<string>('Al2O3');
  const [inputGrams, setInputGrams] = useState<number>(100);

  // Reaction / Bond Predictor State
  const [bondEl1, setBondEl1] = useState<ElementData>(PERIODIC_TABLE_DATA.find(e => e.symbol === 'Al') || PERIODIC_TABLE_DATA[12]);
  const [bondEl2, setBondEl2] = useState<ElementData>(PERIODIC_TABLE_DATA.find(e => e.symbol === 'O') || PERIODIC_TABLE_DATA[7]);

  // Filtered elements
  const activeMetallurgyPreset = useMemo(() => {
    return METALLURGY_PRESETS.find(p => p.id === selectedMetallurgy) || METALLURGY_PRESETS[0];
  }, [selectedMetallurgy]);

  const filteredElements = useMemo(() => {
    let list = PERIODIC_TABLE_DATA;

    if (activeMetallurgyPreset.elements.length > 0) {
      list = list.filter(e => activeMetallurgyPreset.elements.includes(e.number));
    }

    if (elementFilter) {
      const q = elementFilter.toLowerCase();
      list = list.filter(e =>
        e.name.toLowerCase().includes(q) ||
        e.symbol.toLowerCase().includes(q) ||
        e.number.toString() === q
      );
    }
    return list;
  }, [elementFilter, activeMetallurgyPreset]);

  // Phase statistics at current temperature
  const phaseStats = useMemo(() => {
    let solid = 0;
    let liquid = 0;
    let gas = 0;
    let unknown = 0;

    PERIODIC_TABLE_DATA.forEach(el => {
      if (!el.melt || !el.boil) {
        unknown++;
      } else if (currentTempK < el.melt) {
        solid++;
      } else if (currentTempK <= el.boil) {
        liquid++;
      } else {
        gas++;
      }
    });

    return { solid, liquid, gas, unknown };
  }, [currentTempK]);

  // Molar Mass Calculator calculation
  const molarResults = useMemo(() => {
    const { counts, error } = parseFormula(molarFormula);
    if (error || Object.keys(counts).length === 0) {
      return { totalMolarMass: 0, elementsList: [], moles: 0, particles: 0, error: true };
    }

    let totalMolarMass = 0;
    const elementsList: { symbol: string, name: string, count: number, atomicMass: number, totalMass: number, percentage: number }[] = [];

    for (const [sym, count] of Object.entries(counts)) {
      const el = PERIODIC_TABLE_DATA.find(e => e.symbol.toLowerCase() === sym.toLowerCase());
      const atomicMass = el ? el.mass : 0;
      const elTotalMass = atomicMass * count;
      totalMolarMass += elTotalMass;
      elementsList.push({
        symbol: el ? el.symbol : sym,
        name: el ? el.name : sym,
        count,
        atomicMass,
        totalMass: elTotalMass,
        percentage: 0
      });
    }

    elementsList.forEach(item => {
      item.percentage = totalMolarMass > 0 ? (item.totalMass / totalMolarMass) * 100 : 0;
    });

    const moles = totalMolarMass > 0 ? inputGrams / totalMolarMass : 0;
    const particles = moles * 6.02214076e23;

    return { totalMolarMass, elementsList, moles, particles, error: false };
  }, [molarFormula, inputGrams]);

  // Reaction / Bond Predictor calculation
  const reactionResults = useMemo(() => {
    const en1 = ELECTRONEGATIVITY[bondEl1.number] || 0;
    const en2 = ELECTRONEGATIVITY[bondEl2.number] || 0;
    const deltaEN = Math.abs(en1 - en2);

    const ionicPercent = (1 - Math.exp(-0.25 * Math.pow(deltaEN, 2))) * 100;
    const covalentPercent = 100 - ionicPercent;

    let bondType = 'Covalent';
    let bondTypeTr = 'Kovalent Bağ';
    let badgeColor = '#3ae374';

    if (deltaEN > 2.0) {
      bondType = 'Predominantly Ionic';
      bondTypeTr = 'Belirgin İyonik Bağ';
      badgeColor = '#ff3838';
    } else if (deltaEN > 0.5) {
      bondType = 'Polar Covalent';
      bondTypeTr = 'Polar Kovalent Bağ';
      badgeColor = '#00e5ff';
    } else {
      bondType = 'Non-polar Covalent / Metallic';
      bondTypeTr = 'Apolar Kovalent / Metalik';
      badgeColor = '#a29bfe';
    }

    const v1 = Math.abs(TYPICAL_VALENCIES[bondEl1.number] || 1);
    const v2 = Math.abs(TYPICAL_VALENCIES[bondEl2.number] || 1);

    const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
    const common = gcd(v1, v2);
    const n1 = v2 / common;
    const n2 = v1 / common;

    const predictedFormula = `${bondEl1.symbol}${n1 > 1 ? n1 : ''}${bondEl2.symbol}${n2 > 1 ? n2 : ''}`;

    return {
      en1,
      en2,
      deltaEN,
      ionicPercent,
      covalentPercent,
      bondType,
      bondTypeTr,
      badgeColor,
      predictedFormula
    };
  }, [bondEl1, bondEl2]);

  // Compounds filter
  const filteredCompounds = useMemo(() => {
    let list = CHEMICAL_COMPOUNDS;
    if (compoundCategoryMode) {
      list = list.filter(c => c.category === compoundCategoryMode);
    }
    if (compoundFilter) {
      const q = compoundFilter.toLowerCase();
      list = list.filter(c => c.name.toLowerCase().includes(q) || c.formula.toLowerCase().includes(q));
    }
    return list;
  }, [compoundFilter, compoundCategoryMode]);

  // Grid placement
  const getGridPos = (el: ElementData) => {
    if (el.number >= 57 && el.number <= 71) return { row: 9, col: el.number - 57 + 3 };
    if (el.number >= 89 && el.number <= 103) return { row: 10, col: el.number - 89 + 3 };
    return { row: el.period, col: el.group };
  };

  // Phase detector
  const getElementPhase = (el: ElementData, tempK: number) => {
    if (!el.melt || !el.boil) return 'unknown';
    if (tempK < el.melt) return 'solid';
    if (tempK <= el.boil) return 'liquid';
    return 'gas';
  };

  // Element Heatmap Color
  const getHeatmapColor = (el: ElementData) => {
    if (heatmapMetric === 'electronegativity') {
      const en = ELECTRONEGATIVITY[el.number];
      if (!en) return '#334155';
      const ratio = Math.max(0, Math.min(1, (en - 0.7) / 3.3));
      return ratio > 0.6 ? '#f43f5e' : ratio > 0.35 ? '#fbbf24' : '#06b6d4';
    }
    if (heatmapMetric === 'density') {
      const d = el.density || 0;
      const ratio = Math.max(0, Math.min(1, d / 22.5));
      return ratio > 0.6 ? '#8b5cf6' : ratio > 0.25 ? '#3b82f6' : '#10b981';
    }
    if (heatmapMetric === 'melt') {
      const m = el.melt || 0;
      const ratio = Math.max(0, Math.min(1, m / 3700));
      return ratio > 0.6 ? '#f97316' : ratio > 0.25 ? '#eab308' : '#06b6d4';
    }
    if (heatmapMetric === 'mass') {
      const ratio = Math.max(0, Math.min(1, el.mass / 294));
      return ratio > 0.6 ? '#ec4899' : ratio > 0.3 ? '#8b5cf6' : '#38bdf8';
    }
    return CATEGORY_COLORS[el.category] || '#64748b';
  };

  const isDimmed = (el: ElementData) => {
    if (viewMode === 'Materials') {
      if (selectedCompound) {
        return !selectedCompound.elements.includes(el.number);
      }
      return false;
    }
    if (hoveredCategory && el.category !== hoveredCategory) return true;
    if (activeMetallurgyPreset.elements.length > 0 && !activeMetallurgyPreset.elements.includes(el.number)) return true;
    if (elementFilter && !filteredElements.includes(el)) return true;
    return false;
  };

  const isActive = (el: ElementData) => {
    if (viewMode === 'Materials') {
      if (selectedCompound) {
        return selectedCompound.elements.includes(el.number);
      }
      return false;
    }
    return selectedElement?.number === el.number;
  };

  return (
    <div className="flex flex-col h-full bg-[var(--bg-0)] text-slate-100 font-sans select-none overflow-hidden">
      
      {/* Top Header */}
      <div className="border-b border-white/10 bg-[var(--bg-1)]/90 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 z-20 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--cyan-glow)] border border-[var(--cyan)]/40 flex items-center justify-center text-[var(--cyan)] shadow-lg ">
            <Atom size={22} className="animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black tracking-tight text-white uppercase">
                {t12(lang, 'Interactive Periodic Table & Chemical Intelligence', 'İnteraktif Periyodik Tablo & Malzeme Zekası')}
              </h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                IUPAC 118 Elements
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              {t12(lang, 'Thermal Phase Simulator, Pauling Electronegativity, Molar Mass & Metallurgy', 'Termal Faz Simülatörü, Pauling Elektronegatifliği, Mol Kütlesi & Metalurji Analizi')}
            </p>
          </div>
        </div>

        {/* Global Controls & Mode Switcher */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 text-xs font-bold font-mono">
            {[
              { id: 'Elements', labelTr: 'TABLO', labelEn: 'TABLE', icon: Atom },
              { id: 'MolarCalc', labelTr: 'MOL KÜTLESİ', labelEn: 'MOLAR MASS', icon: Scale },
              { id: 'BondPredictor', labelTr: 'BAĞ TAHMİNİ', labelEn: 'BONDING', icon: Zap },
              { id: 'Reactions', labelTr: 'REAKSİYONLAR', labelEn: 'REACTIONS', icon: Beaker },
              { id: 'Materials', labelTr: 'BİLEŞİKLER', labelEn: 'MATERIALS', icon: FlaskConical },
            ].map(m => {
              const Icon = m.icon;
              const isSel = viewMode === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => {
                    setViewMode(m.id as any);
                    if (m.id !== 'Elements') setSelectedElement(null);
                  }}
                  className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 ${isSel ? 'bg-[var(--cyan)] text-[var(--accent-ink)] shadow-md font-black' : 'text-slate-400 hover:text-white'}`}
                >
                  <Icon size={13} /> {t12(lang, m.labelEn, m.labelTr)}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex flex-1 overflow-hidden relative">

        {/* TAB 1: PERIODIC TABLE VIEW WITH TEMPERATURE SLIDER & HEATMAPS */}
        {viewMode === 'Elements' && (
          <div className="flex-1 flex flex-col overflow-hidden relative">
            
            {/* Table Action Bar */}
            <div className="px-6 py-2.5 bg-[var(--bg-0)] border-b border-white/5 flex flex-wrap items-center justify-between gap-4 text-xs">
              
              {/* Search Bar */}
              <div className="relative w-64">
                <Search className="absolute left-3 top-2.5 text-slate-500" size={14} />
                <input
                  type="text"
                  placeholder={t12(lang, 'Search (Name, Symbol, No)...', 'Element ara (Ad, Simge, No)...')}
                  value={elementFilter}
                  onChange={e => setElementFilter(e.target.value)}
                  className="w-full bg-[var(--bg-1)] border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-500/50"
                />
              </div>

              {/* Metallurgy Preset Selector */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase">{t12(lang, 'Metallurgy:', 'Alaşım Filtresi:')}</span>
                <select
                  value={selectedMetallurgy}
                  onChange={e => setSelectedMetallurgy(e.target.value)}
                  className="bg-[var(--bg-1)] border border-white/10 rounded-xl px-2.5 py-1 text-xs text-slate-200 font-semibold outline-none cursor-pointer"
                >
                  {METALLURGY_PRESETS.map(p => (
                    <option key={p.id} value={p.id} className="bg-[var(--bg-2)]">
                      {t12(lang, p.nameEn, p.nameTr)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Heatmap Overlay Selector */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase">{t12(lang, 'Heatmap:', 'Isı Haritası:')}</span>
                <select
                  value={heatmapMetric}
                  onChange={e => setHeatmapMetric(e.target.value as any)}
                  className="bg-[var(--bg-1)] border border-white/10 rounded-xl px-2.5 py-1 text-xs text-cyan-300 font-bold outline-none cursor-pointer"
                >
                  <option value="category" className="bg-[var(--bg-2)]">{t12(lang, 'Category / Type', 'Standart Sınıflandırma')}</option>
                  <option value="electronegativity" className="bg-[var(--bg-2)]">{t12(lang, 'Electronegativity (Pauling)', 'Elektronegatiflik (Pauling)')}</option>
                  <option value="density" className="bg-[var(--bg-2)]">{t12(lang, 'Density (g/cm³)', 'Yoğunluk (Density g/cm³)')}</option>
                  <option value="melt" className="bg-[var(--bg-2)]">{t12(lang, 'Melting Point (K)', 'Erime Noktası (Melting K)')}</option>
                  <option value="mass" className="bg-[var(--bg-2)]">{t12(lang, 'Atomic Mass', 'Atom Kütlesi (Mass u)')}</option>
                </select>
              </div>

              {/* Temperature & Phase Simulator Slider */}
              <div className="flex items-center gap-3 bg-[var(--bg-1)] px-3 py-1 rounded-xl border border-white/10">
                <Thermometer size={14} className="text-amber-400" />
                <div className="text-[11px] font-mono font-bold text-slate-300">
                  <span>{formatEngineeringValue(currentTempK, precision, false)} K</span>
                  <span className="text-slate-500 ml-1">({formatEngineeringValue((currentTempK - 273.15), precision, false)}°C)</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="6000"
                  step="25"
                  value={currentTempK}
                  onChange={e => setCurrentTempK(Number(e.target.value))}
                  className="w-24 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[var(--cyan)]"
                />
                <button
                  onClick={() => setCurrentTempK(298.15)}
                  title="STP (25°C)"
                  className="text-[10px] text-cyan-400 hover:text-cyan-200 font-mono font-bold"
                >
                  STP
                </button>
              </div>

            </div>

            {/* Live Phase Counter Badge Bar */}
            <div className="px-6 py-1.5 bg-[var(--bg-0)] border-b border-white/5 flex items-center justify-between text-[11px] font-mono text-slate-400">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-cyan-400" /> {t12(lang, 'Solid:', 'Katı:')} <strong className="text-white">{phaseStats.solid}</strong></span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400" /> {t12(lang, 'Liquid:', 'Sıvı:')} <strong className="text-white">{phaseStats.liquid}</strong></span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-400" /> {t12(lang, 'Gas:', 'Gaz:')} <strong className="text-white">{phaseStats.gas}</strong></span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-slate-600" /> {t12(lang, 'Synthetic:', 'Sentetik:')} <strong className="text-slate-400">{phaseStats.unknown}</strong></span>
              </div>
              <div className="text-[10px] text-slate-500">
                {t12(lang, 'Click any element to inspect Bohr shells & physical properties.', 'Elemente tıklayarak detaylı spektroskopi ve kristal yapısını inceleyebilirsiniz.')}
              </div>
            </div>

            {/* Periodic Table Grid Canvas */}
            <div className="flex-1 overflow-auto p-4 flex items-center justify-start lg:justify-center relative custom-scrollbar z-10 w-full" style={{ minWidth: 0 }}>
              <div
                className="grid gap-1.5 relative shrink-0"
                style={{
                  gridTemplateColumns: 'repeat(18, minmax(32px, 1fr))',
                  gridTemplateRows: 'repeat(10, minmax(32px, 1fr))',
                  width: '1080px',
                  height: '600px'
                }}
              >
                {PERIODIC_TABLE_DATA.map(el => {
                  const pos = getGridPos(el);
                  const active = isActive(el);
                  const dimmed = isDimmed(el);
                  const color = getHeatmapColor(el);
                  const phase = getElementPhase(el, currentTempK);

                  let bgColor = `${color}18`;
                  let borderColor = `${color}40`;
                  if (active) {
                    bgColor = `${color}ee`;
                    borderColor = '#ffffff';
                  }

                  return (
                    <motion.button
                      key={el.number}
                      onClick={() => setSelectedElement(el)}
                      layoutId={`el-${el.number}`}
                      className={`relative flex flex-col items-center justify-center transition-all duration-200 border
                        ${active ? 'z-30 rounded-lg scale-125 shadow-[0_10px_30px_rgba(0,0,0,0.9)]' : 'rounded-md hover:scale-110 hover:z-20 hover:rounded-lg'}`}
                      style={{
                        gridColumn: pos.col,
                        gridRow: pos.row,
                        backgroundColor: dimmed ? '#ffffff02' : bgColor,
                        borderColor: dimmed ? '#ffffff05' : borderColor,
                        boxShadow: active ? `0 0 30px ${color}60, inset 0 0 10px ${color}40` : (dimmed ? 'none' : 'inherit'),
                        opacity: dimmed ? 0.25 : (active ? 1 : 0.9),
                        filter: dimmed ? 'grayscale(100%)' : 'none',
                        cursor: 'pointer',
                      }}
                    >
                      {/* Atomic Number */}
                      <span className={`text-[8px] absolute top-0.5 left-1 font-mono font-bold ${active ? 'text-black/70' : 'text-white/40'}`}>
                        {el.number}
                      </span>

                      {/* Phase Dot at Current Temperature */}
                      <div
                        className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full"
                        style={{
                          backgroundColor: phase === 'solid' ? '#00e5ff' : phase === 'liquid' ? '#fbbf24' : phase === 'gas' ? '#f43f5e' : '#475569'
                        }}
                        title={`Phase @ ${formatEngineeringValue(currentTempK, precision, false)}K: ${phase.toUpperCase()}`}
                      />

                      {/* Symbol */}
                      <span className={`text-base font-black tracking-tighter ${active ? 'text-white font-black' : 'text-slate-100'}`}>
                        {el.symbol}
                      </span>

                      {/* Metric Display Subtext (e.g. EN, Density, Melt, Mass) */}
                      <span className={`text-[6px] truncate leading-none max-w-[90%] font-mono font-bold uppercase ${active ? 'text-black/80' : 'text-white/50'}`}>
                        {heatmapMetric === 'electronegativity' ? (ELECTRONEGATIVITY[el.number] ? `EN ${ELECTRONEGATIVITY[el.number]}` : el.name) :
                         heatmapMetric === 'density' ? (el.density ? `${el.density} g/c` : el.name) :
                         heatmapMetric === 'melt' ? (el.melt ? `${el.melt} K` : el.name) :
                         heatmapMetric === 'mass' ? `${formatEngineeringValue(el.mass, precision, false)}` : el.name}
                      </span>
                    </motion.button>
                  );
                })}

                {/* Lanthanide & Actinide Series Spacers */}
                <div className="flex items-center justify-center text-[7px] font-mono tracking-widest text-slate-500 uppercase font-bold" style={{ gridColumn: 3, gridRow: 6 }}>57-71</div>
                <div className="flex items-center justify-center text-[7px] font-mono tracking-widest text-slate-500 uppercase font-bold" style={{ gridColumn: 3, gridRow: 7 }}>89-103</div>
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: MOLAR MASS & STOICHIOMETRY CALCULATOR */}
        {viewMode === 'MolarCalc' && (
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-[var(--bg-0)]">
            <div className="max-w-4xl mx-auto space-y-6">
              
              <div className="bg-[var(--bg-1)] border border-white/10 rounded-2xl p-6 shadow-2xl space-y-4">
                <h3 className="text-sm font-black tracking-wider text-cyan-400 uppercase flex items-center gap-2">
                  <Scale size={18} /> {t12(lang, 'CHEMICAL FORMULA & MOLAR MASS CALCULATOR', 'KİMYASAL FORMÜL & MOL KÜTLESİ HESAPLAYICI')}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {t12(lang, 'Type any compound formula with brackets or hydrates (e.g. Al2O3, CuSO4*5H2O, Fe2(SO4)3, C6H12O6, CaCO3).', 'Herhangi bir kimyasal bileşik formülü yazın (parantez ve hidrat hidratları desteklenir: örn. Al2O3, CuSO4*5H2O, Fe2(SO4)3, C6H12O6, CaCO3).')}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="text-[11px] font-bold text-slate-300 block mb-1 uppercase">
                      {t12(lang, 'Chemical Formula', 'Bileşik Formülü')}
                    </label>
                    <input
                      type="text"
                      value={molarFormula}
                      onChange={e => setMolarFormula(e.target.value)}
                      placeholder="e.g. Al2O3 or CuSO4*5H2O"
                      className="w-full bg-[var(--bg-0)] border border-cyan-500/40 rounded-xl px-4 py-2.5 text-base font-mono font-bold text-white outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1 uppercase">
                      {t12(lang, 'Sample Mass (Grams)', 'Numune Kütlesi (Gram)')}
                    </label>
                    <input
                      type="number"
                      value={inputGrams}
                      onChange={e => setInputGrams(Number(e.target.value))}
                      className="w-full bg-[var(--bg-0)] border border-white/10 rounded-xl px-4 py-2.5 text-base font-mono font-bold text-white outline-none"
                    />
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="flex items-center gap-2 flex-wrap pt-2">
                  <span className="text-[10px] text-slate-500 font-bold uppercase">{t12(lang, 'Quick Presets:', 'Hızlı Örnekler:')}</span>
                  {['Al2O3', 'Fe2O3', 'TiO2', 'SiO2', 'CuSO4*5H2O', 'CaCO3', 'C6H12O6', 'H2SO4', 'NaCl'].map(f => (
                    <button
                      key={f}
                      onClick={() => setMolarFormula(f)}
                      className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-mono text-cyan-300 font-bold transition-colors"
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {/* Molar Results Display */}
              {!molarResults.error && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-[var(--bg-1)] p-5 rounded-2xl border border-cyan-500/30 text-center">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">{t12(lang, 'Molar Mass (M)', 'Toplam Mol Kütlesi (M)')}</div>
                    <div className="text-3xl font-mono font-black text-cyan-300 mt-1">
                      {formatEngineeringValue(molarResults.totalMolarMass, precision, false)} <span className="text-xs text-slate-400">g/mol</span>
                    </div>
                  </div>

                  <div className="bg-[var(--bg-1)] p-5 rounded-2xl border border-white/10 text-center">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">{t12(lang, 'Mole Quantity (n)', 'Mol Miktarı (n)')}</div>
                    <div className="text-3xl font-mono font-black text-amber-300 mt-1">
                      {formatEngineeringValue(molarResults.moles, precision, false)} <span className="text-xs text-slate-400">mol</span>
                    </div>
                  </div>

                  <div className="bg-[var(--bg-1)] p-5 rounded-2xl border border-white/10 text-center">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">{t12(lang, 'Particle Count (N)', 'Molekül Sayısı (N)')}</div>
                    <div className="text-2xl font-mono font-black text-emerald-400 mt-1">
                      {molarResults.particles.toExponential(3)}
                    </div>
                  </div>
                </div>
              )}

              {/* Elemental Percentage Breakdown Table */}
              {!molarResults.error && molarResults.elementsList.length > 0 && (
                <div className="bg-[var(--bg-1)] border border-white/10 rounded-2xl p-5 shadow-2xl space-y-4">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <Layers size={16} className="text-cyan-400" />
                    {t12(lang, 'ELEMENTAL MASS PERCENTAGE BREAKDOWN (w/w %)', 'ELEMENTEL KÜTLE VE YÜZDE DAĞILIMI (w/w %)')}
                  </h4>

                  <div className="space-y-3">
                    {molarResults.elementsList.map(el => (
                      <div key={el.symbol} className="bg-[var(--bg-0)] p-3 rounded-xl border border-white/5 space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-mono">
                          <div className="flex items-center gap-2 font-bold text-white">
                            <span className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-sm font-black border border-cyan-500/40">
                              {el.symbol}
                            </span>
                            <span>{el.name} ({el.count} atom)</span>
                          </div>
                          <div className="text-right">
                            <span className="text-cyan-300 font-bold">{formatEngineeringValue(el.percentage, precision, false)}%</span>
                            <span className="text-slate-500 ml-2">({formatEngineeringValue(el.totalMass, precision, false)} g/mol)</span>
                          </div>
                        </div>
                        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full"
                            style={{ width: `${el.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

        {/* TAB 3: 2-ELEMENT REACTION & BOND CHARACTER PREDICTOR */}
        {viewMode === 'BondPredictor' && (
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-[var(--bg-0)]">
            <div className="max-w-4xl mx-auto space-y-6">
              
              <div className="bg-[var(--bg-1)] border border-white/10 rounded-2xl p-6 shadow-2xl space-y-4">
                <h3 className="text-sm font-black tracking-wider text-purple-400 uppercase flex items-center gap-2">
                  <Zap size={18} /> {t12(lang, '2-ELEMENT CHEMICAL BOND & REACTION PREDICTOR', 'KİMYASAL BAĞ & REAKSİYON KARAKTERİ TAHMİNCİSİ')}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {t12(lang, 'Select two elements to compute Pauling electronegativity delta (ΔEN), ionic character %, and predicted compound formula.', 'İki element seçin; Pauling elektronegatiflik farkı (ΔEN), İyonik/Kovalent bağ oranı ve stokiyometrik bileşik formülü hesaplanır.')}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Element 1 Picker */}
                  <div className="bg-[var(--bg-0)] p-4 rounded-xl border border-white/5 space-y-2">
                    <label className="text-xs font-bold text-cyan-400 uppercase block">1. Element (Katyon / A)</label>
                    <select
                      value={bondEl1.number}
                      onChange={e => {
                        const el = PERIODIC_TABLE_DATA.find(p => p.number === Number(e.target.value));
                        if (el) setBondEl1(el);
                      }}
                      className="w-full bg-[var(--bg-1)] border border-white/10 rounded-xl px-3 py-2 text-sm font-bold text-white outline-none cursor-pointer"
                    >
                      {PERIODIC_TABLE_DATA.map(el => (
                        <option key={el.number} value={el.number} className="bg-[var(--bg-2)]">
                          {el.number}. {el.symbol} - {el.name} (EN: {ELECTRONEGATIVITY[el.number] || 'N/A'})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Element 2 Picker */}
                  <div className="bg-[var(--bg-0)] p-4 rounded-xl border border-white/5 space-y-2">
                    <label className="text-xs font-bold text-rose-400 uppercase block">2. Element (Anyon / B)</label>
                    <select
                      value={bondEl2.number}
                      onChange={e => {
                        const el = PERIODIC_TABLE_DATA.find(p => p.number === Number(e.target.value));
                        if (el) setBondEl2(el);
                      }}
                      className="w-full bg-[var(--bg-1)] border border-white/10 rounded-xl px-3 py-2 text-sm font-bold text-white outline-none cursor-pointer"
                    >
                      {PERIODIC_TABLE_DATA.map(el => (
                        <option key={el.number} value={el.number} className="bg-[var(--bg-2)]">
                          {el.number}. {el.symbol} - {el.name} (EN: {ELECTRONEGATIVITY[el.number] || 'N/A'})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Reaction Prediction Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[var(--bg-1)] p-5 rounded-2xl border border-white/10 text-center">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">{t12(lang, 'Electronegativity Delta (ΔEN)', 'Elektronegatiflik Farkı (ΔEN)')}</div>
                  <div className="text-3xl font-mono font-black text-purple-300 mt-1">
                    {formatEngineeringValue(reactionResults.deltaEN, precision, false)}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    EN₁: {reactionResults.en1} | EN₂: {reactionResults.en2}
                  </div>
                </div>

                <div className="bg-[var(--bg-1)] p-5 rounded-2xl border border-white/10 text-center">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">{t12(lang, 'Bond Classification', 'Bağ Karakteri')}</div>
                  <div className="text-xl font-mono font-black mt-1" style={{ color: reactionResults.badgeColor }}>
                    {t12(lang, reactionResults.bondType, reactionResults.bondTypeTr)}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    %{formatEngineeringValue(reactionResults.ionicPercent, precision, false)} İyonik / %{formatEngineeringValue(reactionResults.covalentPercent, precision, false)} Kovalent
                  </div>
                </div>

                <div className="bg-[var(--bg-1)] p-5 rounded-2xl border border-white/10 text-center">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">{t12(lang, 'Predicted Formula', 'Tahmini Stokiyometrik Formül')}</div>
                  <div className="text-3xl font-mono font-black text-emerald-400 mt-1">
                    {reactionResults.predictedFormula}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    {bondEl1.symbol} + {bondEl2.symbol}
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 4: MATERIALS / CHEMICAL COMPOUNDS DATABASE */}
        {viewMode === 'Materials' && (
          <div className="flex flex-1 overflow-hidden relative">
            {/* Materials List Left Sidebar */}
            <div className="w-80 bg-[var(--bg-0)]/95 border-r border-[var(--bad)]/20 flex flex-col shrink-0">
              <div className="p-4 border-b border-white/5 bg-black/40">
                <h2 className="text-[10px] font-bold text-[var(--bad)] uppercase tracking-widest flex items-center gap-2">
                  <Database size={14} /> Material Database
                </h2>
                <div className="mt-2">
                  <input
                    type="text"
                    placeholder="Search compound (e.g. H2O, Al2O3)..."
                    value={compoundFilter}
                    onChange={e => setCompoundFilter(e.target.value)}
                    className="w-full bg-[var(--bg-1)] border border-[var(--bad)]/30 rounded-xl px-3 py-1.5 text-xs text-white outline-none"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
                {filteredCompounds.map(compound => {
                  const isSel = selectedCompound?.id === compound.id;
                  const cColor = COMPOUND_COLORS[compound.category] || '#808e9b';
                  return (
                    <button
                      key={compound.id}
                      onClick={() => setSelectedCompound(compound)}
                      className={`w-full text-left p-3 rounded-xl border transition-all ${isSel ? 'bg-white/[0.08] shadow-lg' : 'bg-transparent border-transparent hover:bg-white/[0.04]'}`}
                      style={{ borderColor: isSel ? `${cColor}60` : 'transparent' }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">{compound.name}</span>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded font-bold" style={{ backgroundColor: `${cColor}20`, color: cColor }}>
                          {compound.category}
                        </span>
                      </div>
                      <div className="text-[11px] font-mono text-cyan-400 font-bold mt-1">{compound.formula}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Materials Details View */}
            <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
              {selectedCompound ? (
                <div className="max-w-2xl mx-auto space-y-6">
                  <div className="bg-[var(--bg-1)] border border-white/10 rounded-2xl p-6 shadow-2xl text-center relative overflow-hidden">
                    <span className="text-4xl font-mono font-black text-cyan-300">{selectedCompound.formula}</span>
                    <h2 className="text-2xl font-black text-white mt-1">{selectedCompound.name}</h2>
                    <p className="text-xs text-slate-400 mt-2 leading-relaxed">{selectedCompound.description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <PropCard icon={<Atom />} label="Molar Mass" value={selectedCompound.properties.molarMass ? `${selectedCompound.properties.molarMass} g/mol` : 'Unknown'} color="#a29bfe" />
                    <PropCard icon={<Box />} label="Density" value={selectedCompound.properties.density ? `${selectedCompound.properties.density} g/cm³` : 'Unknown'} color="#74b9ff" />
                    <PropCard icon={<Thermometer />} label="Melting Point" value={selectedCompound.properties.meltPoint ? `${selectedCompound.properties.meltPoint} K` : 'N/A'} color="#ff7675" />
                    <PropCard icon={<Beaker />} label="State at STP" value={selectedCompound.properties.stateAtSTP || 'Solid'} color="#55efc4" />
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-500 font-mono text-xs uppercase tracking-widest">
                  {t12(lang, 'Select a compound from the list to view structural properties.', 'Bileşik detaylarını görmek için soldaki listeden seçim yapın.')}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: CHEMICAL REACTION SYNTHESIZER & ENTHALPY */}
        {viewMode === 'Reactions' && (
          <div className="flex flex-1 overflow-hidden relative w-full h-full">
            <ChemistryReactionsModule />
          </div>
        )}

        {/* RIGHT SIDEBAR: ELEMENT DETAILS DRAWER */}
        <AnimatePresence>
          {viewMode === 'Elements' && selectedElement && (
            <motion.div
              key="element-details"
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-[380px] sm:w-[420px] bg-[var(--bg-1)]/95 border-l border-white/10 overflow-y-auto custom-scrollbar relative z-30 shadow-[-20px_0_50px_rgba(0,0,0,0.8)] shrink-0"
            >
              <div className="h-1.5 w-full" style={{ backgroundColor: CATEGORY_COLORS[selectedElement.category] }}></div>
              <div className="p-6 pt-8">
                <button onClick={() => setSelectedElement(null)} className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors bg-black/40 p-1.5 rounded-full z-50">
                  <XIcon />
                </button>

                <div className="flex flex-col items-center mb-6 text-center">
                  <motion.div layoutId={`el-${selectedElement.number}`} className="w-28 h-28 rounded-2xl flex flex-col items-center justify-center mb-4 border shadow-2xl relative"
                    style={{ backgroundColor: CATEGORY_COLORS[selectedElement.category], borderColor: 'rgba(255,255,255,0.4)', color: 'var(--bg-0)' }}
                  >
                    <div className="text-xs font-mono font-black opacity-70 absolute top-2 left-2.5">{selectedElement.number}</div>
                    <div className="text-5xl font-black tracking-tighter">{selectedElement.symbol}</div>
                    <div className="text-[11px] font-bold opacity-80 absolute bottom-2">{formatEngineeringValue(selectedElement.mass, precision, false)} u</div>
                  </motion.div>
                  <h2 className="text-2xl font-black text-white">{selectedElement.name}</h2>
                  <div className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border mt-2"
                    style={{ backgroundColor: `${CATEGORY_COLORS[selectedElement.category]}20`, color: CATEGORY_COLORS[selectedElement.category], borderColor: `${CATEGORY_COLORS[selectedElement.category]}40` }}
                  >
                    {CATEGORY_LABELS[selectedElement.category] ? t12(lang, CATEGORY_LABELS[selectedElement.category].en, CATEGORY_LABELS[selectedElement.category].tr) : selectedElement.category}
                  </div>
                  <p className="text-xs text-slate-300 mt-3 leading-relaxed">
                    {selectedElement.summary}
                  </p>
                </div>

                {/* Atomic Structure Bohr Model */}
                <div className="mb-6 p-4 rounded-2xl border border-white/5 bg-black/40 text-center">
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center justify-center gap-1.5">
                    <Atom size={14} className="text-cyan-400" /> {t12(lang, 'Atomic Structure', 'Bohr Atomik Katman Yapısı')}
                  </h3>
                  <div className="flex justify-center my-3">
                    <BohrModel element={selectedElement} color={CATEGORY_COLORS[selectedElement.category]} />
                  </div>
                  <div className="p-2.5 bg-[var(--bg-0)] rounded-xl border border-white/5 font-mono text-xs text-cyan-200 tracking-widest">
                    {selectedElement.electron_configuration}
                  </div>
                </div>

                {/* Physical & Chemical Properties Grid */}
                <div className="grid grid-cols-2 gap-2.5 mb-6">
                  <PropCard icon={<Thermometer />} label={t12(lang, 'Melting Point', 'Erime Noktası')} value={selectedElement.melt ? `${selectedElement.melt} K` : 'N/A'} sub={selectedElement.melt ? `${formatEngineeringValue((selectedElement.melt - 273.15), precision, false)}°C` : ''} color="#ff7675" />
                  <PropCard icon={<Thermometer />} label={t12(lang, 'Boiling Point', 'Kaynama Noktası')} value={selectedElement.boil ? `${selectedElement.boil} K` : 'N/A'} sub={selectedElement.boil ? `${formatEngineeringValue((selectedElement.boil - 273.15), precision, false)}°C` : ''} color="#fdcb6e" />
                  <PropCard icon={<Zap />} label={t12(lang, 'Electronegativity', 'Elektronegatiflik')} value={ELECTRONEGATIVITY[selectedElement.number] ? `${ELECTRONEGATIVITY[selectedElement.number]}` : 'N/A'} color="#00e5ff" />
                  <PropCard icon={<Box />} label={t12(lang, 'Density', 'Yoğunluk')} value={selectedElement.density ? `${selectedElement.density} g/cm³` : 'N/A'} color="#74b9ff" />
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}

// Property Card
function PropCard({ icon, label, value, sub, color }: { icon: any, label: string, value: string, sub?: string, color: string }) {
  return (
    <div className="p-3.5 bg-white/[0.02] border border-white/5 rounded-xl flex flex-col items-center justify-center text-center relative overflow-hidden group shadow-inner">
      <div className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-1 z-10">{label}</div>
      <div className="text-sm font-black text-white font-mono z-10">{value}</div>
      {sub && <div className="text-[10px] text-slate-400 font-mono mt-0.5 z-10">{sub}</div>}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] opacity-40" style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />
    </div>
  );
}

// Mini X Icon
function XIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
  );
}

function BohrModel({ element, color }: { element: ElementData, color: string }) {
  const shells = element.period;
  const baseRadius = 22;
  const spacing = 15;
  const svgSize = (baseRadius + (shells * spacing)) * 2 + 16;
  const center = svgSize / 2;

  const electronCounts = getElectronCounts(element.number);

  return (
    <svg width={svgSize} height={svgSize} viewBox={`0 0 ${svgSize} ${svgSize}`} className="overflow-visible">
      <circle cx={center} cy={center} r={10} fill={color} stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" />
      <text x={center} y={center} dy=".3em" textAnchor="middle" fontSize="9" fontFamily="monospace" fontWeight="900" fill="#000">{element.symbol}</text>

      <g className="animate-spin-slow" style={{ animationDuration: '40s', transformOrigin: `${center}px ${center}px` }}>
        {electronCounts.map((count, i) => {
          const r = baseRadius + (i * spacing);
          return (
            <g key={i}>
              <circle cx={center} cy={center} r={r} fill="none" stroke={color} strokeOpacity="0.25" strokeWidth="1" strokeDasharray="3 2" />
              {Array.from({ length: count }).map((_, j) => {
                const angle = (j / count) * Math.PI * 2;
                const x = center + r * Math.cos(angle);
                const y = center + r * Math.sin(angle);
                return (
                  <circle key={j} cx={x} cy={y} r={2} fill="#fff" stroke={color} strokeWidth="1" />
                );
              })}
            </g>
          );
        })}
      </g>
    </svg>
  );
}

function getElectronCounts(atomicNumber: number): number[] {
  let remaining = atomicNumber;
  const shells = [];
  let n = 1;
  while (remaining > 0) {
    const capacity = 2 * n * n;
    const take = Math.min(remaining, capacity);
    shells.push(take);
    remaining -= take;
    n++;
    if (n > 7) break;
  }
  return shells.map(c => Math.min(c, 32));
}
