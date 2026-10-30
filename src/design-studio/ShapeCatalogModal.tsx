'use client';

/**
 * 📦 SHAPE & PROFILE INVENTOR CATALOG MODAL
 * Industrial CAD Modal Window for 3D Primitives and T-Slot Extrusions
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  Boxes,
  Search,
  X,
  Plus,
  Layers,
  Ruler,
  Check,
  ChevronRight,
  Sparkles,
  Settings,
  ArrowLeft,
  GripHorizontal,
  RotateCcw,
} from 'lucide-react';
import { useI18nStore } from '@/store/i18nStore';
import { t12 } from '@/locales/t12';
import { getDesignKindLabel } from '@/locales/designStudioTranslations';
import { useDesignStore, type DesignKind, type GearPairConfig } from './designStore';
import { useDraggableDialog } from './useDraggableDialog';
import { triggerCameraView } from './cadCameraDispatcher';
import { TSLOT_CATALOG, type TSlotSpec } from '@/cad/catalog/tSlotProfiles';

export const STANDARD_BEARINGS = [
  { designation: '6000', type: 'deep-groove-ball', d: 10, D: 26, B: 8, Cr: 4.75, C0: 1.96, desc: 'Sabit Bilyalı Rulman (ISO 15)' },
  { designation: '6004', type: 'deep-groove-ball', d: 20, D: 42, B: 12, Cr: 9.95, C0: 5.0, desc: 'Sabit Bilyalı Rulman (ISO 15)' },
  { designation: '6205', type: 'deep-groove-ball', d: 25, D: 52, B: 15, Cr: 14.8, C0: 7.8, desc: 'Standart Şaft Rulmanı (ISO 15)' },
  { designation: '6306', type: 'deep-groove-ball', d: 30, D: 72, B: 19, Cr: 28.1, C0: 16.0, desc: 'Ağır Hizmet Bilyalı Rulman' },
  { designation: 'NU 205 ECP', type: 'cylindrical-roller', d: 25, D: 52, B: 15, Cr: 28.6, C0: 27.0, desc: 'Silindirik Makaralı Rulman (DIN 5412)' },
  { designation: '30205', type: 'tapered-roller', d: 25, D: 52, B: 16.25, Cr: 32.5, C0: 33.5, desc: 'Konik Makaralı Rulman (ISO 355)' },
  { designation: '51105', type: 'thrust-ball', d: 25, D: 42, B: 11, Cr: 18.2, C0: 39.0, desc: 'Eksenel Bilyalı Rulman (DIN 711)' },
  { designation: '22205 E', type: 'spherical-roller', d: 25, D: 52, B: 18, Cr: 49.0, C0: 44.0, desc: 'Oynak Makaralı Rulman (ISO 15)' },
];

export const STANDARD_STRUCTURAL_PROFILES = [
  { standard: 'IPE', designation: 'IPE 80', type: 'I-beam' as const, h: 80, b: 46, tw: 3.8, tf: 5.2, massPerM: 6.0 },
  { standard: 'IPE', designation: 'IPE 100', type: 'I-beam' as const, h: 100, b: 55, tw: 4.1, tf: 5.7, massPerM: 8.1 },
  { standard: 'IPE', designation: 'IPE 140', type: 'I-beam' as const, h: 140, b: 73, tw: 4.7, tf: 6.9, massPerM: 12.9 },
  { standard: 'HEA', designation: 'HEA 100', type: 'I-beam' as const, h: 96, b: 100, tw: 5.0, tf: 8.0, massPerM: 16.7 },
  { standard: 'HEA', designation: 'HEA 120', type: 'I-beam' as const, h: 114, b: 120, tw: 5.0, tf: 8.0, massPerM: 19.9 },
  { standard: 'UPN', designation: 'UPN 80', type: 'U-channel' as const, h: 80, b: 45, tw: 6.0, tf: 8.0, massPerM: 8.6 },
  { standard: 'UPN', designation: 'UPN 100', type: 'U-channel' as const, h: 100, b: 50, tw: 6.0, tf: 8.5, massPerM: 10.6 },
  { standard: 'L-ANGLE', designation: 'L 50x50x5', type: 'L-bracket' as const, h: 50, b: 50, tw: 5.0, tf: 5.0, massPerM: 3.77 },
  { standard: 'L-ANGLE', designation: 'L 60x60x6', type: 'L-bracket' as const, h: 60, b: 60, tw: 6.0, tf: 6.0, massPerM: 5.42 },
  { standard: 'SHS', designation: 'Kutu Profil 50x50x3', type: 'tube' as const, h: 50, b: 50, tw: 3.0, tf: 3.0, massPerM: 4.28 },
];

export const STANDARD_PARALLEL_KEYS = [
  { designation: 'DIN 6885-A 6x6x20', shaft: 'Ø17 - Ø22 mm', b: 6, h: 6, L: 20 },
  { designation: 'DIN 6885-A 8x7x28', shaft: 'Ø22 - Ø30 mm', b: 8, h: 7, L: 28 },
  { designation: 'DIN 6885-A 8x7x36', shaft: 'Ø22 - Ø30 mm', b: 8, h: 7, L: 36 },
  { designation: 'DIN 6885-A 10x8x40', shaft: 'Ø30 - Ø38 mm', b: 10, h: 8, L: 40 },
  { designation: 'DIN 6885-A 12x8x50', shaft: 'Ø38 - Ø44 mm', b: 12, h: 8, L: 50 },
];

export const SHAPE_LIBRARY_GROUPS: {
  id: 'basic' | 'structural' | 'machine';
  en: string;
  tr: string;
  icon: string;
  kinds: DesignKind[];
}[] = [
  {
    id: 'basic',
    en: 'BASIC',
    tr: 'TEMEL',
    icon: '📐',
    kinds: [
      'box',
      'cylinder',
      'tube',
      'cone',
      'sphere',
      'torus',
      'pyramid',
      'wedge',
      'plate',
      'hex-prism',
      'trapezoid',
    ],
  },
  {
    id: 'structural',
    en: 'STRUCTURAL',
    tr: 'YAPISAL',
    icon: '🏗️',
    kinds: ['L-bracket', 'U-channel', 'I-beam', 'T-beam', 'cross-prism'],
  },
  {
    id: 'machine',
    en: 'MACHINE',
    tr: 'MAKİNE',
    icon: '⚙️',
    kinds: [
      'gear-blank',
      'pulley',
      'washer',
      'hex-bolt',
      'hex-nut',
      'bearing-race',
      'keyway-shaft',
      'd-shaft',
      'slot-plate',
      'star-prism',
    ],
  },
];

interface ShapeCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectKind: (kind: DesignKind) => void;
  onSelectTSlot: (specId: string, lengthMm: number) => void;
  onSelectGearPair?: (config: GearPairConfig) => void;
}

export function ShapeCatalogModal({
  isOpen,
  onClose,
  onSelectKind,
  onSelectTSlot,
  onSelectGearPair,
}: ShapeCatalogModalProps) {
  const { language } = useI18nStore();

  const [activeTab, setActiveTab] = useState<'basic' | 'structural' | 'machine' | 'tslot'>('basic');
  const [searchQuery, setSearchQuery] = useState('');
  const [tSlotSeriesFilter, setTSlotSeriesFilter] = useState<number | 'ALL'>('ALL');
  const [tSlotLengthMm, setTSlotLengthMm] = useState<number>(100);

  // Mating Gear Pair (Eşleşen Dişli Çifti - Pinyon + Çark) State
  const [showGearPairConfigurator, setShowGearPairConfigurator] = useState(false);
  const [gearModule, setGearModule] = useState<number>(2.0);
  const [gearZ1, setGearZ1] = useState<number>(18);
  const [gearZ2, setGearZ2] = useState<number>(36);
  const [gearFaceWidth, setGearFaceWidth] = useState<number>(20);
  const [gearPressureAngle, setGearPressureAngle] = useState<number>(20);
  const [gearBore1, setGearBore1] = useState<number>(12);
  const [gearBore2, setGearBore2] = useState<number>(18);
  const [gearHasKeyway, setGearHasKeyway] = useState<boolean>(true);

  // Bearing Configurator State (ISO 15 / ISO 281)
  const [showBearingConfigurator, setShowBearingConfigurator] = useState(false);
  const [selectedBearingIdx, setSelectedBearingIdx] = useState(2); // 6205

  // Structural Profile Configurator State (EN 10025 / EN 10034)
  const [showStructuralConfigurator, setShowStructuralConfigurator] = useState(false);
  const [selectedStructuralIdx, setSelectedStructuralIdx] = useState(1); // IPE 100
  const [structuralLengthMm, setStructuralLengthMm] = useState(500);
  const [structuralMaterial, setStructuralMaterial] = useState<'S235JR' | 'S355JR' | '6060-T6' | '6082-T6'>('S235JR');

  // Keyway Pin Selection State
  const [selectedKeyIdx, setSelectedKeyIdx] = useState(1); // 8x7x28

  // Reset configurators view when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setShowGearPairConfigurator(false);
      setShowBearingConfigurator(false);
      setShowStructuralConfigurator(false);
    }
  }, [isOpen]);

  const handleInsertBearing = () => {
    const b = STANDARD_BEARINGS[selectedBearingIdx];
    useDesignStore.getState().addStandardBearing({
      designation: b.designation,
      d: b.d,
      D: b.D,
      B: b.B,
      type: b.type,
      Cr: b.Cr,
      C0: b.C0,
    });
    triggerCameraView('fit');
    onClose();
  };

  const handleInsertStructural = () => {
    const s = STANDARD_STRUCTURAL_PROFILES[selectedStructuralIdx];
    useDesignStore.getState().addStructuralProfile({
      type: s.type,
      designation: s.designation,
      lengthMm: structuralLengthMm,
      params: {
        webH: s.h,
        flangeW: s.b,
        webT: s.tw,
        flangeT: s.tf,
        height: s.h,
        width: s.b,
        thickness: s.tw,
        depth: structuralLengthMm,
      },
      standard: s.standard === 'SHS' ? 'EN 10210 / EN 10219' : 'EN 10025 / EN 10034',
      notes: [
        `Yapısal Profil: ${s.designation} (Boy L = ${structuralLengthMm} mm)`,
        `Birim Kütle: ~${s.massPerM} kg/m · Toplam: ~${((s.massPerM * structuralLengthMm) / 1000).toFixed(2)} kg`,
        `Malzeme: ${structuralMaterial}`,
      ],
    });
    triggerCameraView('fit');
    onClose();
  };

  const handleInsertKey = (keyIdx: number) => {
    const k = STANDARD_PARALLEL_KEYS[keyIdx];
    useDesignStore.getState().addKeywayPin({
      width: k.b,
      height: k.h,
      length: k.L,
      designation: k.designation,
    });
    triggerCameraView('fit');
    onClose();
  };

  // Real-time Involute Gear Kinematics (ISO 6336 / DIN 867 / DIN 3960)
  const gearCalc = useMemo(() => {
    const m = Math.max(0.5, Number(gearModule) || 2.0);
    const z1 = Math.max(6, Math.round(Number(gearZ1) || 18));
    const z2 = Math.max(6, Math.round(Number(gearZ2) || 36));
    const d1 = m * z1; // Pitch diameter pinion
    const d2 = m * z2; // Pitch diameter gear
    const da1 = d1 + 2 * m; // Tip diameter
    const da2 = d2 + 2 * m;
    const df1 = d1 - 2.5 * m; // Root diameter
    const df2 = d2 - 2.5 * m;
    const a = (m * (z1 + z2)) / 2; // Center distance
    const ratio = (z2 / z1).toFixed(2);
    const pitch = (Math.PI * m).toFixed(2);
    const toothThick = ((Math.PI * m) / 2).toFixed(2);
    return { m, z1, z2, d1, d2, da1, da2, df1, df2, a, ratio, pitch, toothThick };
  }, [gearModule, gearZ1, gearZ2]);

  const handleInsertGearPair = () => {
    const config: GearPairConfig = {
      module: gearCalc.m,
      z1: gearCalc.z1,
      z2: gearCalc.z2,
      faceWidth: gearFaceWidth,
      pressureAngle: gearPressureAngle,
      bore1: gearBore1,
      bore2: gearBore2,
      hasKeyway: gearHasKeyway,
    };
    if (onSelectGearPair) {
      onSelectGearPair(config);
    } else {
      useDesignStore.getState().addGearPair(config);
      triggerCameraView('fit');
    }
    onClose();
  };

  const handleInsertSingleGear = () => {
    const id = useDesignStore.getState().addPart('gear-blank');
    useDesignStore.getState().updatePart(id, {
      name: `Spur Gear m=${gearCalc.m} z=${gearCalc.z1} (d=${gearCalc.d1.toFixed(1)}mm)`,
      params: {
        module: gearCalc.m,
        teeth: gearCalc.z1,
        depth: gearFaceWidth,
        faceWidth: gearFaceWidth,
        bore: gearBore1,
        pressureAngle: gearPressureAngle,
        hasKeyway: gearHasKeyway,
        pitchDiameter: gearCalc.d1,
      },
    });
    triggerCameraView('fit');
    onClose();
  };

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Filter shapes based on search
  const filteredKinds = useMemo(() => {
    if (activeTab === 'tslot') return [];
    const group = SHAPE_LIBRARY_GROUPS.find((g) => g.id === activeTab);
    if (!group) return [];
    if (!searchQuery.trim()) return group.kinds;
    const q = searchQuery.toLowerCase();
    return group.kinds.filter((k) => {
      const label = getDesignKindLabel(k, language).toLowerCase();
      return k.toLowerCase().includes(q) || label.includes(q);
    });
  }, [activeTab, searchQuery, language]);

  // Filter T-Slot profiles
  const filteredTSlots = useMemo(() => {
    let list = TSLOT_CATALOG;
    if (tSlotSeriesFilter !== 'ALL') {
      list = list.filter((s) => s.series === tSlotSeriesFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          `${s.width}x${s.height}`.includes(q) ||
          s.alloy.toLowerCase().includes(q)
      );
    }
    return list;
  }, [tSlotSeriesFilter, searchQuery]);

  const { position, resetPosition, isDragging, elementRef, dragHandleProps } = useDraggableDialog({
    initialPosition: () => {
      if (typeof window === 'undefined') return { x: 100, y: 40 };
      const isDesktop = window.innerWidth >= 768;
      const modalWidth = Math.min(896, window.innerWidth - 32);
      return {
        x: isDesktop ? Math.max(16, (window.innerWidth - modalWidth) / 2) : 16,
        y: 40,
      };
    },
  });

  if (!isOpen) return null;

  return (
    <>
      {/* Click outside backdrop to close */}
      <div className="fixed inset-0 z-40 bg-black/70 select-none" onClick={onClose} />

      {/* Main Window Box */}
      <div
        ref={elementRef}
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
        }}
        className={`fixed z-50 w-[calc(100vw-2rem)] max-w-4xl max-h-[90vh] bg-[var(--bg-0)] border border-[var(--line-strong)] rounded-[var(--radius-l)] shadow-2xl flex flex-col overflow-hidden font-mono text-[11px] text-[var(--ink)] select-none transition-shadow ${
          isDragging ? 'ring-2 ring-[var(--cyan)] shadow-[0_25px_70px_rgba(58,208,230,0.4)]' : ''
        }`}
      >
        {/* ─── WINDOW HEADER (TITLEBAR) ─── */}
        <div
          {...dragHandleProps}
          onDoubleClick={resetPosition}
          title={t12(language, 'Drag to Move · Double Click to Reset', 'Sürükleyip Taşı · Sıfırlamak İçin Çift Tıkla')}
          className="group flex items-center justify-between px-4 py-3 border-b border-[var(--line)] bg-[var(--bg-1)] shrink-0 cursor-grab active:cursor-grabbing hover:bg-[var(--bg-1)]/80 transition-colors"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-1.5 rounded-[var(--radius-s)] bg-[var(--cyan)]/15 border border-[var(--cyan)]/40 text-[var(--cyan)] shrink-0">
              <Boxes size={18} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-xs sm:text-[13px] font-black uppercase tracking-wider text-white truncate">
                  {t12(language, '3D GEOMETRIC SHAPES & EXTRUSION PROFILES', '3D GEOMETRİK ŞEKİL & PROFİL KATALOĞU')}
                </h2>
                <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-[var(--bg-2)] border border-[var(--line)] text-[var(--cyan)] font-bold shrink-0">
                  ISO 10303
                </span>
              </div>
              <p className="text-[9px] text-[var(--alu-dim)] flex items-center gap-1">
                <GripHorizontal size={11} className="text-slate-500 group-hover:text-cyan-400 shrink-0" />
                <span className="truncate">
                  {t12(
                    language,
                    'Select parametric solid or extrusion (Drag to reposition)',
                    'Parametrik katı veya profil seçin (Taşımak için sürükleyin)'
                  )}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={resetPosition}
              className="p-1.5 rounded-[var(--radius-s)] text-slate-400 hover:text-cyan-400 hover:bg-white/10 transition-colors"
              title={t12(language, 'Reset Position', 'Konumu Sıfırla')}
            >
              <RotateCcw size={14} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-[var(--radius-s)] text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              title={t12(language, 'Close [Esc]', 'Kapat [Esc]')}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* ─── SUB-HEADER: CATEGORY TABS & SEARCH BAR ─── */}
        <div className="px-4 py-2.5 border-b border-[var(--line)] bg-[var(--bg-1)]/60 flex flex-wrap items-center justify-between gap-2 shrink-0">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
            {SHAPE_LIBRARY_GROUPS.map((group) => {
              const isActive = activeTab === group.id;
              const count = group.kinds.length;
              return (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(group.id);
                    setShowGearPairConfigurator(false);
                    setShowBearingConfigurator(false);
                    setShowStructuralConfigurator(false);
                  }}
                  className={`px-3 py-1.5 rounded-[var(--radius-s)] font-bold text-[10px] flex items-center gap-1.5 transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[var(--cyan)] text-black font-extrabold '
                      : 'bg-[var(--bg-2)] border border-[var(--line)] text-[var(--alu-dim)] hover:text-white hover:bg-[var(--bg-3)]'
                  }`}
                >
                  <span>{group.icon}</span>
                  <span>{t12(language, group.en, group.tr)}</span>
                  <span
                    className={`text-[8px] px-1 py-0.2 rounded font-mono ${
                      isActive ? 'bg-black/20 text-black' : 'bg-black/40 text-[var(--alu-dim)]'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}

            {/* T-Slot Extrusions Tab */}
            <button
              type="button"
              onClick={() => {
                setActiveTab('tslot');
                setShowGearPairConfigurator(false);
                setShowBearingConfigurator(false);
                setShowStructuralConfigurator(false);
              }}
              className={`px-3 py-1.5 rounded-[var(--radius-s)] font-bold text-[10px] flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'tslot'
                  ? 'bg-[var(--cyan)] text-[var(--accent-ink)] font-extrabold '
                  : 'bg-[var(--bg-2)] border border-[var(--line)] text-[var(--alu-dim)] hover:text-white hover:bg-[var(--bg-3)]'
              }`}
            >
              <span>📏</span>
              <span>{t12(language, 'T-SLOT PROFILES', 'T-KANAL PROFİLLER')}</span>
              <span
                className={`text-[8px] px-1 py-0.2 rounded font-mono ${
                  activeTab === 'tslot' ? 'bg-black/20 text-black' : 'bg-black/40 text-amber-400/80'
                }`}
              >
                {TSLOT_CATALOG.length}
              </span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-56">
            <Search
              size={12}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--alu-dim)]"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t12(language, 'Filter shapes...', 'Şekil veya profil ara...')}
              className="w-full rounded-[var(--radius-s)] border border-[var(--line)] bg-[var(--bg-0)] pl-7 pr-2.5 py-1 text-[10px] text-white outline-none focus:border-[var(--cyan)] transition-colors placeholder:text-slate-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-[9px]"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* ─── WINDOW BODY (CONTENT AREA) ─── */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar min-h-[320px]">
          {activeTab !== 'tslot' ? (
            showGearPairConfigurator ? (
              /* ─── DEDICATED INVOLUTE GEAR PAIR ENGINEERING CONFIGURATOR (ISO 6336 / DIN 867) ─── */
              <div className="space-y-4 animate-in fade-in duration-150">
              {/* Navigation & Header */}
              <div className="flex items-center justify-between pb-2 border-b border-[var(--line)]">
                <button
                  type="button"
                  onClick={() => setShowGearPairConfigurator(false)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--radius-s)] bg-[var(--bg-2)] hover:bg-[var(--bg-3)] border border-[var(--line)] text-white text-[10px] font-bold transition-colors cursor-pointer"
                >
                  <ArrowLeft size={13} />
                  <span>{t12(language, 'Back to Shapes Catalog', 'Katalog Şekillerine Dön')}</span>
                </button>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-black uppercase text-emerald-400 flex items-center gap-1.5">
                    <Settings size={14} className="animate-spin-slow" />
                    <span>{t12(language, 'INVOLUTE GEAR PAIR SOLVER', 'EVOLVENT DİŞLİ ÇİFTİ HESAPLAYICI')}</span>
                  </span>
                  <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                    ISO 6336 · DIN 867 · DIN 3960
                  </span>
                </div>
              </div>

              {/* Main Grid: Inputs vs Live Engineering HUD */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* ─── LEFT COLUMN: PARAMETER INPUTS (7 cols) ─── */}
                <div className="lg:col-span-7 space-y-3 bg-[var(--bg-1)] p-3.5 rounded-[var(--radius-m)] border border-[var(--line)]">
                  <div className="text-[10px] font-bold text-white uppercase tracking-wider flex items-center justify-between border-b border-white/5 pb-1">
                    <span>// {t12(language, 'GEAR TRAIN PARAMETERS', 'DİŞLİ ÇARKLAR PARAMETRELERİ')}</span>
                    <span className="text-[8px] text-[var(--alu-dim)] font-normal">DIN 867 Standart Diş Formu</span>
                  </div>

                  {/* 1. Module Selector */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-white font-bold">{t12(language, 'Normal Module (m):', 'Standart Modül (m):')}</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min={0.5}
                          max={20}
                          step={0.5}
                          value={gearModule}
                          onChange={(e) => setGearModule(Math.max(0.5, Number(e.target.value) || 1))}
                          className="w-16 rounded-[var(--radius-s)] border border-emerald-500/50 bg-[var(--bg-0)] px-2 py-0.5 text-center text-[11px] font-bold text-emerald-300 outline-none focus:border-emerald-400"
                        />
                        <span className="text-[9px] text-[var(--alu-dim)]">mm</span>
                      </div>
                    </div>
                    {/* Quick Module Presets */}
                    <div className="flex items-center gap-1 overflow-x-auto pb-0.5 no-scrollbar">
                      {[1.0, 1.25, 1.5, 2.0, 2.5, 3.0, 4.0, 5.0].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setGearModule(preset)}
                          className={`px-2 py-0.5 rounded text-[8.5px] font-mono font-bold border transition cursor-pointer ${
                            gearModule === preset
                              ? 'bg-[var(--cyan)] text-[var(--accent-ink)] border-emerald-400 font-extrabold shadow-sm'
                              : 'bg-[var(--bg-0)] text-slate-300 border-[var(--line)] hover:text-white hover:bg-[var(--bg-2)]'
                          }`}
                        >
                          m{preset}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 2. Tooth Counts z1 (Pinion) & z2 (Mating Gear) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {/* Pinion z1 */}
                    <div className="p-2.5 rounded-[var(--radius-s)] bg-[var(--bg-0)] border border-sky-500/30 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-sky-400">1. {t12(language, 'Pinion Teeth (z1):', 'Pinyon Diş (z₁):')}</span>
                        <input
                          type="number"
                          min={8}
                          max={150}
                          value={gearZ1}
                          onChange={(e) => setGearZ1(Math.max(8, Math.round(Number(e.target.value)) || 18))}
                          className="w-14 rounded-[var(--radius-s)] border border-sky-500/50 bg-[var(--bg-1)] px-2 py-0.5 text-center text-[11px] font-bold text-sky-300 outline-none focus:border-sky-400"
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        {[14, 16, 18, 20, 24].map((z) => (
                          <button
                            key={z}
                            type="button"
                            onClick={() => setGearZ1(z)}
                            className={`flex-1 py-0.5 rounded text-[8px] font-mono font-bold border transition cursor-pointer ${
                              gearZ1 === z
                                ? 'bg-[var(--cyan)] text-[var(--accent-ink)] border-sky-400'
                                : 'bg-[var(--bg-1)] text-slate-300 border-[var(--line)] hover:text-white'
                            }`}
                          >
                            z{z}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Mating Gear z2 */}
                    <div className="p-2.5 rounded-[var(--radius-s)] bg-[var(--bg-0)] border border-emerald-500/30 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-emerald-400">2. {t12(language, 'Twin Gear (z2):', 'İkiz Çark (z₂):')}</span>
                        <input
                          type="number"
                          min={8}
                          max={250}
                          value={gearZ2}
                          onChange={(e) => setGearZ2(Math.max(8, Math.round(Number(e.target.value)) || 36))}
                          className="w-14 rounded-[var(--radius-s)] border border-emerald-500/50 bg-[var(--bg-1)] px-2 py-0.5 text-center text-[11px] font-bold text-emerald-300 outline-none focus:border-emerald-400"
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        {[28, 36, 48, 60, 72].map((z) => (
                          <button
                            key={z}
                            type="button"
                            onClick={() => setGearZ2(z)}
                            className={`flex-1 py-0.5 rounded text-[8px] font-mono font-bold border transition cursor-pointer ${
                              gearZ2 === z
                                ? 'bg-[var(--cyan)] text-[var(--accent-ink)] border-emerald-400'
                                : 'bg-[var(--bg-1)] text-slate-300 border-[var(--line)] hover:text-white'
                            }`}
                          >
                            z{z}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 3. Face Width & Pressure Angle */}
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-[var(--alu-dim)]">{t12(language, 'Face Width (b):', 'Diş Genişliği (b):')}</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min={5}
                          max={150}
                          value={gearFaceWidth}
                          onChange={(e) => setGearFaceWidth(Math.max(5, Number(e.target.value) || 20))}
                          className="w-14 rounded-[var(--radius-s)] border border-[var(--line)] bg-[var(--bg-0)] px-2 py-0.5 text-center text-[10px] text-white"
                        />
                        <span className="text-[9px] text-[var(--alu-dim)]">mm</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-[var(--alu-dim)]">{t12(language, 'Pressure Angle (α):', 'Kavrama Açısı (α):')}</span>
                      <span className="text-[10px] font-bold text-white font-mono px-2 py-0.5 rounded bg-[var(--bg-0)] border border-[var(--line)]">
                        20.0° (DIN 867)
                      </span>
                    </div>
                  </div>

                  {/* 4. Shaft Bores & DIN 6885 Keyway */}
                  <div className="p-2.5 rounded-[var(--radius-s)] bg-[var(--bg-0)] border border-[var(--line)] space-y-2">
                    <div className="flex items-center justify-between text-[9.5px]">
                      <span className="font-bold text-slate-300">{t12(language, 'Shaft Bores & Keyways:', 'Mil Yuvaları & DIN 6885 Kamaları:')}</span>
                      <label className="flex items-center gap-1.5 cursor-pointer text-[9px] text-emerald-400 font-bold">
                        <input
                          type="checkbox"
                          checked={gearHasKeyway}
                          onChange={(e) => setGearHasKeyway(e.target.checked)}
                          className="rounded accent-[var(--cyan)]"
                        />
                        <span>DIN 6885-1 Kama Kanalı</span>
                      </label>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-[9.5px]">
                      <div className="flex items-center justify-between">
                        <span className="text-[var(--alu-dim)]">Pinyon Mili:</span>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min={6}
                            max={80}
                            value={gearBore1}
                            onChange={(e) => setGearBore1(Math.max(6, Number(e.target.value) || 12))}
                            className="w-12 rounded-[var(--radius-s)] border border-[var(--line)] bg-[var(--bg-1)] px-1.5 py-0.5 text-center text-[10px] text-white"
                          />
                          <span className="text-[8.5px] text-[var(--alu-dim)]">mm</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[var(--alu-dim)]">Çark Mili:</span>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min={8}
                            max={120}
                            value={gearBore2}
                            onChange={(e) => setGearBore2(Math.max(8, Number(e.target.value) || 18))}
                            className="w-12 rounded-[var(--radius-s)] border border-[var(--line)] bg-[var(--bg-1)] px-1.5 py-0.5 text-center text-[10px] text-white"
                          />
                          <span className="text-[8.5px] text-[var(--alu-dim)]">mm</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ─── RIGHT COLUMN: LIVE ENGINEERING HUD (5 cols) ─── */}
                <div className="lg:col-span-5 space-y-3 flex flex-col justify-between">
                  <div className="space-y-3">
                    {/* Big Center Distance Banner */}
                    <div className="p-3.5 rounded-[var(--radius-m)] bg-gradient-to-br from-emerald-950/60 to-[var(--bg-1)] border border-emerald-500/40 shadow-md">
                      <div className="flex items-center justify-between text-[9px] text-emerald-300 font-bold uppercase tracking-wider mb-1">
                        <span>{t12(language, 'CENTER DISTANCE (a)', 'EKSENLER ARASI MESAFE (a)')}</span>
                        <span className="font-mono text-[8px] bg-black/40 px-1.5 py-0.5 rounded text-emerald-400">a = m·(z₁+z₂)/2</span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-emerald-400 font-mono tracking-tight">
                          {gearCalc.a.toFixed(2)}
                        </span>
                        <span className="text-sm font-bold text-emerald-500 font-mono">mm</span>
                      </div>
                      <div className="mt-2 pt-2 border-t border-emerald-500/20 flex items-center justify-between text-[9px] font-mono">
                        <span className="text-[var(--alu-dim)]">{t12(language, 'Gear Ratio (i):', 'Çevrim Oranı (i):')}</span>
                        <strong className="text-white text-[11px] font-bold">{gearCalc.ratio} : 1</strong>
                      </div>
                    </div>

                    {/* Detailed Pitch & Tip Comparison Card */}
                    <div className="p-3 rounded-[var(--radius-m)] bg-[var(--bg-1)] border border-[var(--line)] space-y-2 font-mono text-[9px]">
                      <div className="text-[9.5px] font-bold text-white uppercase border-b border-white/5 pb-1 flex justify-between">
                        <span>// {t12(language, 'CALCULATED DIMENSIONS', 'HESAPLANAN BOYUTLAR')}</span>
                        <span className="text-emerald-400">DIN 3960</span>
                      </div>

                      {/* Pinion Specs */}
                      <div className="p-2 rounded bg-[var(--bg-0)] border border-sky-500/20 space-y-1">
                        <div className="flex justify-between font-bold text-sky-400">
                          <span>Pinyon (z₁={gearCalc.z1})</span>
                          <span>Ø{gearBore1}mm Mil</span>
                        </div>
                        <div className="flex justify-between text-[var(--alu-dim)]">
                          <span>Bölüm Çapı (d₁):</span>
                          <strong className="text-white">{gearCalc.d1.toFixed(1)} mm</strong>
                        </div>
                        <div className="flex justify-between text-[var(--alu-dim)]">
                          <span>Diş Üstü / Dibi (da₁ / df₁):</span>
                          <strong className="text-slate-300">{gearCalc.da1.toFixed(1)} / {gearCalc.df1.toFixed(1)} mm</strong>
                        </div>
                      </div>

                      {/* Mating Gear Specs */}
                      <div className="p-2 rounded bg-[var(--bg-0)] border border-emerald-500/20 space-y-1">
                        <div className="flex justify-between font-bold text-emerald-400">
                          <span>İkiz Çark (z₂={gearCalc.z2})</span>
                          <span>Ø{gearBore2}mm Mil</span>
                        </div>
                        <div className="flex justify-between text-[var(--alu-dim)]">
                          <span>Bölüm Çapı (d₂):</span>
                          <strong className="text-white">{gearCalc.d2.toFixed(1)} mm</strong>
                        </div>
                        <div className="flex justify-between text-[var(--alu-dim)]">
                          <span>Diş Üstü / Dibi (da₂ / df₂):</span>
                          <strong className="text-slate-300">{gearCalc.da2.toFixed(1)} / {gearCalc.df2.toFixed(1)} mm</strong>
                        </div>
                      </div>

                      <div className="flex justify-between text-[8.5px] text-[var(--alu-dim)] pt-0.5">
                        <span>Adım p = π·m = {gearCalc.pitch} mm</span>
                        <span>Diş Kalınlığı s = {gearCalc.toothThick} mm</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2 pt-2">
                    <button
                      type="button"
                      onClick={handleInsertGearPair}
                      className="w-full py-2.5 px-3 rounded-[var(--radius-s)] bg-emerald-400 hover:bg-emerald-300 text-black font-extrabold text-[11px] flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <span>⚙️⚙️</span>
                      <span>{t12(language, 'INSERT GEAR PAIR (PINION + TWIN) TO 3D', 'İKİZİ İLE BERABER EKLE (PİNYON + ÇARK MONTAJI)')}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleInsertSingleGear}
                      className="w-full py-1.5 px-3 rounded-[var(--radius-s)] bg-[var(--bg-2)] hover:bg-[var(--bg-3)] border border-[var(--line)] text-slate-300 hover:text-white font-bold text-[9.5px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <span>⚙️</span>
                      <span>{t12(language, `Insert Single Gear Only (Pinion z₁=${gearCalc.z1})`, `Sadece Tek Dişli Ekle (Pinyon z₁=${gearCalc.z1})`)}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : showBearingConfigurator ? (
            /* ─── DEDICATED BEARING CONFIGURATOR (ISO 15 / ISO 281) ─── */
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-[var(--line)]">
                <button
                  type="button"
                  onClick={() => setShowBearingConfigurator(false)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--radius-s)] bg-[var(--bg-2)] hover:bg-[var(--bg-3)] border border-[var(--line)] text-white text-[10px] font-bold transition-colors cursor-pointer"
                >
                  <ArrowLeft size={13} />
                  <span>{t12(language, 'Back to Shapes Catalog', 'Katalog Şekillerine Dön')}</span>
                </button>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-black uppercase text-amber-400 flex items-center gap-1.5">
                    <span>🔘</span>
                    <span>{t12(language, 'SKF / ISO 15 ROLLING BEARING CATALOG', 'SKF / ISO 15 STANDART RULMAN KATALOĞU')}</span>
                  </span>
                  <span className="text-[8.5px] px-2 py-0.5 rounded bg-[var(--bg-3)] border border-[var(--line)] text-amber-300 font-mono">
                    ISO 15 / ISO 281
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                {STANDARD_BEARINGS.map((b, idx) => (
                  <button
                    key={b.designation}
                    type="button"
                    onClick={() => setSelectedBearingIdx(idx)}
                    className={`p-2.5 rounded-[var(--radius-m)] border text-left transition-all cursor-pointer ${
                      selectedBearingIdx === idx
                        ? 'bg-amber-500/20 border-amber-400 '
                        : 'bg-[var(--bg-1)] border-[var(--line)] hover:bg-[var(--bg-2)]'
                    }`}
                  >
                    <div className="font-extrabold text-white text-[11px] flex items-center justify-between">
                      <span>{b.designation}</span>
                      <span className="text-[9px] text-amber-400 font-mono">Ø{b.d}×Ø{b.D}×{b.B}</span>
                    </div>
                    <div className="text-[9px] text-[var(--alu-dim)] truncate mt-0.5">{b.desc}</div>
                    <div className="text-[8.5px] text-emerald-400 font-mono mt-1">Cr={b.Cr} kN | C₀={b.C0} kN</div>
                  </button>
                ))}
              </div>

              {(() => {
                const curr = STANDARD_BEARINGS[selectedBearingIdx];
                return (
                  <div className="p-3 rounded-[var(--radius-m)] bg-[var(--bg-0)] border border-[var(--line)] space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-black text-white">{curr.designation} - {curr.desc}</div>
                        <div className="text-[10px] text-[var(--alu-dim)] font-mono">
                          Mil Çapı (d): {curr.d} mm · Dış Çap (D): {curr.D} mm · Genişlik (B): {curr.B} mm
                        </div>
                      </div>
                      <span className="px-2 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold text-[10px]">
                        100Cr6 Rulman Çeliği
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[10.5px]">
                      <div className="p-2 rounded bg-[var(--bg-1)] border border-[var(--line)]">
                        <span className="text-[9px] text-[var(--alu-dim)] block">İç Delik d</span>
                        <span className="text-white font-bold">{curr.d} mm</span>
                      </div>
                      <div className="p-2 rounded bg-[var(--bg-1)] border border-[var(--line)]">
                        <span className="text-[9px] text-[var(--alu-dim)] block">Dış Çap D</span>
                        <span className="text-white font-bold">{curr.D} mm</span>
                      </div>
                      <div className="p-2 rounded bg-[var(--bg-1)] border border-[var(--line)]">
                        <span className="text-[9px] text-[var(--alu-dim)] block">Genişlik B</span>
                        <span className="text-white font-bold">{curr.B} mm</span>
                      </div>
                      <div className="p-2 rounded bg-[var(--bg-1)] border border-[var(--line)]">
                        <span className="text-[9px] text-[var(--alu-dim)] block">Dinamik Yük Cr</span>
                        <span className="text-emerald-400 font-bold">{curr.Cr} kN</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleInsertBearing}
                      className="w-full py-2.5 px-3 rounded-[var(--radius-s)] bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-[11px] flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <span>🔘</span>
                      <span>{t12(language, `INSERT ${curr.designation} BEARING TO 3D`, `${curr.designation} RULMANINI 3D SAHNEYE EKLE`)}</span>
                    </button>
                  </div>
                );
              })()}
            </div>
          ) : showStructuralConfigurator ? (
            /* ─── DEDICATED STRUCTURAL PROFILES CONFIGURATOR (EN 10025 / EN 10034) ─── */
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-[var(--line)]">
                <button
                  type="button"
                  onClick={() => setShowStructuralConfigurator(false)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--radius-s)] bg-[var(--bg-2)] hover:bg-[var(--bg-3)] border border-[var(--line)] text-white text-[10px] font-bold transition-colors cursor-pointer"
                >
                  <ArrowLeft size={13} />
                  <span>{t12(language, 'Back to Shapes Catalog', 'Katalog Şekillerine Dön')}</span>
                </button>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-black uppercase text-blue-400 flex items-center gap-1.5">
                    <span>🏗️</span>
                    <span>{t12(language, 'EN 10025 / EN 10034 STRUCTURAL BEAM CONFIGURATOR', 'EN 10025 / EN 10034 YAPISAL PROFİL YAPILANDIRICI')}</span>
                  </span>
                  <span className="text-[8.5px] px-2 py-0.5 rounded bg-[var(--bg-3)] border border-[var(--line)] text-blue-300 font-mono">
                    AISC / Eurocode 3
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {STANDARD_STRUCTURAL_PROFILES.map((s, idx) => (
                  <button
                    key={s.designation}
                    type="button"
                    onClick={() => setSelectedStructuralIdx(idx)}
                    className={`p-2 rounded-[var(--radius-m)] border text-left transition-all cursor-pointer ${
                      selectedStructuralIdx === idx
                        ? 'bg-blue-500/20 border-blue-400 '
                        : 'bg-[var(--bg-1)] border-[var(--line)] hover:bg-[var(--bg-2)]'
                    }`}
                  >
                    <div className="font-extrabold text-white text-[10.5px]">{s.designation}</div>
                    <div className="text-[8.5px] text-[var(--alu-dim)] font-mono">{s.standard} · h={s.h} b={s.b}</div>
                    <div className="text-[8.5px] text-cyan-400 font-mono mt-0.5">~{s.massPerM} kg/m</div>
                  </button>
                ))}
              </div>

              {(() => {
                const curr = STANDARD_STRUCTURAL_PROFILES[selectedStructuralIdx];
                const totalMassKg = ((curr.massPerM * structuralLengthMm) / 1000).toFixed(2);
                return (
                  <div className="p-3 rounded-[var(--radius-m)] bg-[var(--bg-0)] border border-[var(--line)] space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-[var(--alu-dim)]">Profil Boyu (Length L):</span>
                          <span className="text-white font-bold font-mono">{structuralLengthMm} mm</span>
                        </div>
                        <input
                          type="range"
                          min="100"
                          max="3000"
                          step="50"
                          value={structuralLengthMm}
                          onChange={(e) => setStructuralLengthMm(Number(e.target.value))}
                          className="w-full accent-[var(--cyan)]"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <span className="text-[10px] text-[var(--alu-dim)] block">Malzeme / Standart Kalite:</span>
                        <div className="grid grid-cols-2 gap-1.5">
                          {(['S235JR', 'S355JR', '6060-T6', '6082-T6'] as const).map((m) => (
                            <button
                              key={m}
                              type="button"
                              onClick={() => setStructuralMaterial(m)}
                              className={`px-2 py-1 rounded text-[9.5px] font-bold border transition-colors cursor-pointer ${
                                structuralMaterial === m
                                  ? 'bg-[var(--cyan)] text-[var(--accent-ink)] border-blue-400 font-extrabold'
                                  : 'bg-[var(--bg-1)] border-[var(--line)] text-slate-300 hover:text-white'
                              }`}
                            >
                              {m}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="p-2 rounded bg-[var(--bg-1)] border border-[var(--line)] flex items-center justify-between text-[10px] font-mono">
                      <span className="text-[var(--alu-dim)]">Özet Kütle Projeksiyonu:</span>
                      <span className="text-blue-300 font-bold">{curr.designation} (L={structuralLengthMm} mm) ≈ {totalMassKg} kg</span>
                    </div>

                    <button
                      type="button"
                      onClick={handleInsertStructural}
                      className="w-full py-2.5 px-3 rounded-[var(--radius-s)] bg-blue-500 hover:bg-blue-400 text-black font-extrabold text-[11px] flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <span>🏗️</span>
                      <span>{t12(language, `INSERT ${curr.designation} (L=${structuralLengthMm}mm) TO 3D`, `${curr.designation} (L=${structuralLengthMm}mm) 3D SAHNEYE EKLE`)}</span>
                    </button>
                  </div>
                );
              })()}
            </div>
          ) : (
            /* PRIMITIVES & MACHINE PARTS GRID */
            <div className="space-y-3">
              {/* MACHINE TAB HERO BANNERS */}
              {activeTab === 'machine' && (
                <div className="space-y-2">
                  <div className="p-3 rounded-[var(--radius-m)] bg-gradient-to-r from-emerald-950/50 via-cyan-950/40 to-[var(--bg-1)] border border-emerald-500/40 flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 ">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-[var(--radius-s)] bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shrink-0">
                        <Settings size={20} className="animate-spin-slow" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[12px] font-black text-white uppercase tracking-wider">
                            {t12(language, 'MATING GEAR PAIR (PINION + TWIN GEAR)', 'EŞLEŞEN DİŞLİ ÇİFTİ (PİNYON + İKİZ ÇARK)')}
                          </span>
                          <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                            ISO 6336 · DIN 867
                          </span>
                        </div>
                        <p className="text-[9px] text-[var(--alu-dim)] mt-0.5">
                          {t12(
                            language,
                            'Calculate tooth parameters (m, z1, z2) & center distance (a) to insert engaged gear twins directly into 3D assembly.',
                            'Diş hesabı yaparak pinyon ve ikiz çarkı eksenler arası mesafe (a) ile montajlanmış olarak 3D sahneye ekleyin.'
                          )}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowGearPairConfigurator(true)}
                      className="w-full sm:w-auto px-3.5 py-2 rounded-[var(--radius-s)] bg-emerald-400 hover:bg-emerald-300 text-black font-extrabold text-[10.5px] flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0"
                    >
                      <span>⚙️⚙️</span>
                      <span>{t12(language, 'CONFIGURE GEAR PAIR', 'DİŞLİ ÇİFTİ HESAPLA & EKLE')}</span>
                      <ChevronRight size={13} />
                    </button>
                  </div>

                  {/* Standard Bearings & DIN 6885 Keys Quick Bar */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="p-2.5 rounded-[var(--radius-m)] bg-[var(--bg-1)] border border-amber-500/40 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-base">🔘</span>
                        <div>
                          <div className="text-[11px] font-bold text-white">SKF / ISO 15 Standart Rulmanlar</div>
                          <div className="text-[8.5px] text-[var(--alu-dim)] font-mono">6000, 6205, NU, 30200, 51100</div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowBearingConfigurator(true)}
                        className="px-2.5 py-1 rounded bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-[10px] cursor-pointer"
                      >
                        Rulman Seç
                      </button>
                    </div>

                    <div className="p-2.5 rounded-[var(--radius-m)] bg-[var(--bg-1)] border border-purple-500/40 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-base">🪛</span>
                        <div>
                          <div className="text-[11px] font-bold text-white">DIN 6885-A Paralel Kama</div>
                          <div className="text-[8.5px] text-[var(--alu-dim)] font-mono">6x6x20 ... 12x8x50 C45+C</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleInsertKey(1)}
                          className="px-2 py-1 rounded bg-purple-500/20 hover:bg-purple-500/40 text-purple-300 border border-purple-500/50 font-bold text-[9.5px] cursor-pointer"
                        >
                          + 8x7x28
                        </button>
                        <button
                          type="button"
                          onClick={() => handleInsertKey(3)}
                          className="px-2 py-1 rounded bg-purple-500/20 hover:bg-purple-500/40 text-purple-300 border border-purple-500/50 font-bold text-[9.5px] cursor-pointer"
                        >
                          + 10x8x40
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STRUCTURAL TAB HERO BANNER */}
              {activeTab === 'structural' && (
                <div className="p-3 rounded-[var(--radius-m)] bg-gradient-to-r from-blue-950/50 via-slate-900 to-[var(--bg-1)] border border-blue-500/40 flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 ">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-[var(--radius-s)] bg-blue-500/20 text-blue-400 border border-blue-500/40 shrink-0">
                      <span>🏗️</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] font-black text-white uppercase tracking-wider">
                          EN 10025 / EN 10034 YAPISAL ÇELİK VE ALÜMİNYUM PROFİLLER
                        </span>
                        <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 font-bold">
                          AISC / Eurocode 3
                        </span>
                      </div>
                      <p className="text-[9px] text-[var(--alu-dim)] mt-0.5">
                        IPE 80-140, HEA 100-120, UPN 80-100 ve L-Köşebent profillerini boy ve malzeme seçerek doğrudan 3D sahneye ekleyin.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowStructuralConfigurator(true)}
                    className="w-full sm:w-auto px-3.5 py-2 rounded-[var(--radius-s)] bg-blue-500 hover:bg-blue-400 text-black font-extrabold text-[10.5px] flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0"
                  >
                    <span>🏗️</span>
                    <span>PROFİL YAPILANDIR & EKLE</span>
                    <ChevronRight size={13} />
                  </button>
                </div>
              )}

              <div className="flex items-center justify-between text-[9px] text-[var(--alu-dim)] border-b border-[var(--line)] pb-1.5">
                <span className="font-bold uppercase tracking-wider">
                  // {activeTab.toUpperCase()} {t12(language, 'SOLID PRIMITIVES', 'KATI GEOMETRİLERİ')} ({filteredKinds.length})
                </span>
                <span className="text-[8px] text-[var(--cyan)]">B-Rep 3D Solid Mesh</span>
              </div>

              {filteredKinds.length === 0 ? (
                <div className="p-8 text-center text-slate-500 italic">
                  {t12(language, 'No shapes match your search.', 'Aramanıza uygun şekil bulunamadı.')}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {filteredKinds.map((kind) => {
                    const label = getDesignKindLabel(kind, language);
                    const isGear = kind === 'gear-blank';
                    const isBearing = kind === 'bearing-race';
                    const isStructural = kind === 'I-beam' || kind === 'U-channel' || kind === 'L-bracket';
                    return (
                      <button
                        key={kind}
                        type="button"
                        onClick={() => {
                          if (isGear) {
                            setShowGearPairConfigurator(true);
                          } else if (isBearing) {
                            setShowBearingConfigurator(true);
                          } else if (isStructural) {
                            setShowStructuralConfigurator(true);
                          } else {
                            onSelectKind(kind);
                            onClose();
                          }
                        }}
                        className={`group relative p-3 rounded-[var(--radius-m)] border text-left transition-all duration-150 flex flex-col justify-between h-[84px] shadow-sm cursor-pointer ${
                          isGear
                            ? 'bg-gradient-to-br from-emerald-950/30 to-[var(--bg-1)] border-emerald-500/50 hover:border-emerald-400 '
                            : isBearing
                            ? 'bg-gradient-to-br from-amber-950/30 to-[var(--bg-1)] border-amber-500/50 hover:border-amber-400 '
                            : isStructural
                            ? 'bg-gradient-to-br from-blue-950/30 to-[var(--bg-1)] border-blue-500/50 hover:border-blue-400 '
                            : 'bg-[var(--bg-1)] border-[var(--line)] hover:bg-[var(--bg-2)] hover:border-[var(--cyan)] '
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className={`font-bold text-[11.5px] transition-colors ${
                                isGear ? 'text-white group-hover:text-emerald-300' : 'text-white group-hover:text-[var(--cyan)]'
                              }`}>
                                {label}
                              </span>
                              {isGear && (
                                <span className="text-[7.5px] font-mono px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                                  İKİZ ÇİFT
                                </span>
                              )}
                            </div>
                            <span className="block text-[8.5px] font-mono text-[var(--alu-dim)] capitalize">
                              {kind}
                            </span>
                          </div>
                          <span className={`p-1 rounded bg-[var(--bg-0)] border transition-all ${
                            isGear
                              ? 'border-emerald-500/40 text-emerald-400 opacity-90 group-hover:opacity-100 group-hover:scale-110'
                              : 'border-[var(--line)] text-[var(--cyan)] opacity-70 group-hover:opacity-100 group-hover:scale-110'
                          }`}>
                            {isGear ? <Settings size={12} /> : <Plus size={12} />}
                          </span>
                        </div>

                        <div className="flex items-center justify-between pt-1.5 border-t border-white/5 text-[8px] font-mono text-[var(--alu-dim)]">
                          <span>{isGear ? 'ISO 6336 / DIN 867' : '1:1 Parametric'}</span>
                          <span className={`font-bold uppercase opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 ${
                            isGear ? 'text-emerald-400' : 'text-[var(--cyan)]'
                          }`}>
                            <span>{isGear ? t12(language, '⚙️ DİŞ HESAPLA & EKLE', '⚙️ DİŞ HESAPLA & EKLE') : t12(language, '+ ADD TO SCENE', '+ SAHNEYE EKLE')}</span>
                            <ChevronRight size={10} />
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )
        ) : (
            /* T-SLOT ALUMİNİUM PROFILES CATALOG */
            <div className="space-y-4">
              {/* T-Slot Header Controls */}
              <div className="p-3 rounded-[var(--radius-m)] bg-[var(--bg-1)] border border-[var(--line)] flex flex-wrap items-center justify-between gap-3">
                {/* Series Tabs */}
                <div className="flex items-center gap-1 overflow-x-auto pb-0.5 no-scrollbar">
                  <span className="text-[8.5px] font-bold text-[var(--alu-dim)] uppercase mr-1">
                    {t12(language, 'SERIES:', 'SERİ:')}
                  </span>
                  {(['ALL', 20, 30, 40, 45, 50, 60, 80] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setTSlotSeriesFilter(s)}
                      className={`px-2 py-0.5 rounded text-[8.5px] font-mono font-bold uppercase transition-all cursor-pointer ${
                        tSlotSeriesFilter === s
                          ? 'bg-[var(--cyan)] text-[var(--accent-ink)] font-extrabold shadow-sm'
                          : 'bg-[var(--bg-0)] border border-[var(--line)] text-[var(--alu-dim)] hover:text-white'
                      }`}
                    >
                      {s === 'ALL' ? t12(language, 'ALL', 'TÜMÜ') : `${s}s`}
                    </button>
                  ))}
                </div>

                {/* Length Setter */}
                <div className="flex items-center gap-2">
                  <span className="text-[8.5px] font-bold text-[var(--alu-dim)] uppercase">
                    {t12(language, 'CUT LENGTH:', 'KESİM BOYU:')}
                  </span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={10}
                      max={6000}
                      step={50}
                      value={tSlotLengthMm}
                      onChange={(e) => setTSlotLengthMm(Math.max(10, Number(e.target.value) || 500))}
                      className="w-20 rounded-[var(--radius-s)] border border-[var(--line)] bg-[var(--bg-0)] px-2 py-0.5 text-center text-[10px] font-mono font-bold text-amber-300 outline-none focus:border-amber-400"
                    />
                    <span className="text-[9px] font-mono text-[var(--alu-dim)]">mm</span>
                  </div>
                  {/* Quick Length Presets */}
                  <div className="hidden sm:flex items-center gap-1">
                    {[50, 100, 200, 500, 1000].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setTSlotLengthMm(preset)}
                        className={`px-1.5 py-0.5 rounded text-[7.5px] font-mono font-bold border transition cursor-pointer ${
                          tSlotLengthMm === preset
                            ? 'bg-amber-400/20 text-amber-300 border-amber-400/50'
                            : 'bg-[var(--bg-0)] text-slate-400 border-[var(--line)] hover:text-white'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Profiles Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {filteredTSlots.map((spec) => (
                  <button
                    key={spec.id}
                    type="button"
                    onClick={() => {
                      onSelectTSlot(spec.id, tSlotLengthMm);
                      onClose();
                    }}
                    className="group relative p-3 rounded-[var(--radius-m)] border border-[var(--line)] bg-[var(--bg-1)] hover:bg-[var(--bg-2)] hover:border-amber-400 text-left transition-all duration-150 flex flex-col justify-between h-[96px] shadow-sm cursor-pointer"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="font-bold text-[12px] text-white group-hover:text-amber-300 transition-colors font-mono">
                          {spec.width} × {spec.height} mm
                        </span>
                        <span className="text-[8px] font-mono px-1 py-0.2 rounded bg-black/40 border border-white/5 text-amber-300 font-bold">
                          {spec.series}s
                        </span>
                      </div>
                      <p className="text-[9px] font-mono text-[var(--alu-dim)] truncate">
                        {spec.name} · Slot {spec.slot} mm
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-1.5 border-t border-white/5 text-[8px] font-mono text-[var(--alu-dim)]">
                      <span>{spec.massKgPerM} kg/m</span>
                      <span className="text-amber-400 font-bold uppercase opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                        <span>+ {tSlotLengthMm} mm EKLE</span>
                        <ChevronRight size={10} />
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ─── WINDOW FOOTER ─── */}
        <div className="px-4 py-2.5 border-t border-[var(--line)] bg-[var(--bg-1)] flex items-center justify-between text-[9px] text-[var(--alu-dim)] shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--ok)] " />
            <span>
              {t12(
                language,
                'Selected component is placed at WCS origin datum and can be visually edited on the right panel.',
                'Eklenen parça WCS orijinine yerleştirilir ve özellikleri sağ panelden düzenlenebilir.'
              )}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 rounded-[var(--radius-s)] bg-[var(--bg-2)] hover:bg-[var(--bg-3)] border border-[var(--line)] text-white font-bold transition-colors cursor-pointer"
          >
            {t12(language, 'Close', 'Kapat')}
          </button>
        </div>
      </div>
    </>
  );
}

export default ShapeCatalogModal;
