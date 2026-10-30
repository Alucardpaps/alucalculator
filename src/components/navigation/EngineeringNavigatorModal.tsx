'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Compass,
  X,
  Search,
  Wrench,
  Layers,
  Flame,
  Box,
  Pencil,
  Activity,
  Workflow,
  HelpCircle,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Cpu,
  GraduationCap,
  Sparkles
} from 'lucide-react';
import { useI18nStore } from '@/store/i18nStore';
import { t12 } from '@/locales/t12';
import { solverCount } from '@/lib/registry/calculatorRegistry';

interface NavigatorItem {
  id: string;
  href: string;
  titleTr: string;
  titleEn: string;
  standard: string;
  descTr: string;
  descEn: string;
  category: 'mechanical' | 'fluids' | 'manufacturing' | 'cad' | 'guide';
  keywords: string[];
}

const NAVIGATOR_ITEMS: NavigatorItem[] = [
  // ─── MEKANİK & MAKİNE ELEMANLARI ───
  {
    id: 'bolt-torque',
    href: '/bolt-torque',
    titleTr: 'Cıvata Torku & Ön Yük Hesabı',
    titleEn: 'Bolt Tightening Torque & Preload',
    standard: 'VDI 2230 / ISO 898-1',
    descTr: 'Cıvata sıkma torku, elastik ön gerilme kuvveti, diş sıyrılma ve akma emniyeti hesabı.',
    descEn: 'Tightening torque, elastic clamp preload, thread stripping, and yield utilization.',
    category: 'mechanical',
    keywords: ['civata', 'tork', 'bolt', 'torque', 'preload', 'on yuk', 'vdi 2230', 'somun', 'vida', 'fastener'],
  },
  {
    id: 'bearings',
    href: '/bearings',
    titleTr: 'Rulman Ömrü & L10h Analizi',
    titleEn: 'Rolling Bearing Rating Life (L10h)',
    standard: 'ISO 281:2007',
    descTr: 'Radyal/eksenel eşdeğer yük altında dinamik rulman ömrü ve saat cinsinden çalışma süresi.',
    descEn: 'Dynamic rating life in millions of revolutions and operating hours under radial/axial loads.',
    category: 'mechanical',
    keywords: ['rulman', 'bearing', 'skf', 'l10', 'l10h', 'omur', 'bilya', 'roller', 'iso 281'],
  },
  {
    id: 'gears',
    href: '/gears',
    titleTr: 'Silindirik Dişli Çark Tasarımı',
    titleEn: 'Spur & Helical Gear Strength',
    standard: 'ISO 6336-1/2',
    descTr: 'Diş dibi kırılma mukavemeti, pitting yüzey temas gerilmesi ve modül boyutlandırma.',
    descEn: 'Tooth root bending stress, contact surface pitting limits, and module calculation.',
    category: 'mechanical',
    keywords: ['disli', 'gear', 'modul', 'pinion', 'spur', 'helical', 'iso 6336', 'pitting'],
  },
  {
    id: 'keyway-connection',
    href: '/keyway-connection',
    titleTr: 'Paralel Kama & Mil-Göbek Dayanımı',
    titleEn: 'Parallel Keyway Connection',
    standard: 'DIN 6885 / ISO 3912',
    descTr: 'Mil-göbek bağlantısında yüzey ezilme basıncı, kama kesme gerilmesi ve emniyet katsayısı.',
    descEn: 'Surface pressure on hub/shaft, key shear stress, and service safety factors.',
    category: 'mechanical',
    keywords: ['kama', 'keyway', 'din 6885', 'mil gobek', 'ezilme', 'kesme', 'parallel key'],
  },
  {
    id: 'press-fit',
    href: '/press-fit',
    titleTr: 'Sıkı Geçme (Pres & Sıcak Geçme)',
    titleEn: 'Interference / Press Fit Sizing',
    standard: 'DIN 7190 / ISO 286',
    descTr: 'Lamé kalın cidarlı silindir teorisiyle temas basıncı, iletilebilen tork ve montaj ısıtma sıcaklığı.',
    descEn: 'Lamé contact pressure, transmissible torque, von Mises yield, and heating assembly temperature.',
    category: 'mechanical',
    keywords: ['siki gecme', 'pres gecme', 'press fit', 'shrink fit', 'din 7190', 'lame', 'montaj sicakligi'],
  },
  {
    id: 'o-ring',
    href: '/o-ring',
    titleTr: 'O-Ring Sızdırmazlık & Kanal Tasarımı',
    titleEn: 'O-Ring Sealing Gland Sizing',
    standard: 'ISO 3601 / AS568',
    descTr: 'Radyal ve eksenel sızdırmazlıkta kanal derinliği, sıkışma oranı ve ekstrüzyon boşluğu hesabı.',
    descEn: 'Groove dimensions, compression ratio, gland fill percentage, and extrusion gap limit.',
    category: 'mechanical',
    keywords: ['oring', 'o-ring', 'sizdirmazlik', 'gland', 'kanal', 'conta', 'seal', 'iso 3601', 'as568'],
  },
  {
    id: 'shafts',
    href: '/shafts',
    titleTr: 'Mil Boyutlandırma & Mesnet Tepkileri',
    titleEn: 'Shaft Diameter & Bearing Reactions',
    standard: 'DIN 743 / ASME B106',
    descTr: 'Bileşik eğilme-burulma eşdeğer gerilmesi, kesme-moment diyagramları ve minimum mil çapı.',
    descEn: 'Combined bending-torsion equivalent stress, shear-moment diagrams, and minimum diameter.',
    category: 'mechanical',
    keywords: ['mil', 'shaft', 'mesnet', 'burulma', 'egilme', 'torsion', 'din 743'],
  },
  {
    id: 'cylinders',
    href: '/cylinders',
    titleTr: 'Hidrolik & Pnömatik Silindir Tasarımı',
    titleEn: 'Hydraulic & Pneumatic Cylinder Sizing',
    standard: 'ISO 6020 / DIN 2413',
    descTr: 'İtme/çekme kuvveti, et kalınlığı, mil burkulma hesabı ve Kastaş sızdırmazlık bileşenleri.',
    descEn: 'Push/pull force, tube hoop stress, Euler buckling safety, and ISO 6020 seal components.',
    category: 'mechanical',
    keywords: ['silindir', 'cylinder', 'hidrolik', 'pnomatik', 'piston', 'iso 6020', 'kastas'],
  },
  {
    id: 'advanced-spring',
    href: '/advanced-spring',
    titleTr: 'Helisel Basma/Çekme Yayı Hesabı',
    titleEn: 'Helical Compression Spring Design',
    standard: 'DIN 2089 / Wahl',
    descTr: 'Wahl gerilme katsayısı, yay rijitliği, çalışma boyu ve rezonans serbest frekans kontrolü.',
    descEn: 'Wahl stress factor, spring rate, deflection, and natural surge frequency check.',
    category: 'mechanical',
    keywords: ['yay', 'spring', 'helical', 'wahl', 'din 2089', 'yay sabiti', 'burulma gerilmesi'],
  },

  // ─── TERMAL, AKIŞKAN & BASINÇ ───
  {
    id: 'pressure-vessel',
    href: '/pressure-vessel',
    titleTr: 'Basınçlı Kap Et Kalınlığı & Bombe',
    titleEn: 'Pressure Vessel Wall & Head Design',
    standard: 'ASME Section VIII Div 1',
    descTr: 'İç basınç altında silindirik gövde, torisferik ve eliptik bombe minimum et kalınlığı ve hidrostatik test.',
    descEn: 'Minimum shell thickness, torispherical/ellipsoidal head sizing, and MAWP test pressure.',
    category: 'fluids',
    keywords: ['basincli kap', 'pressure vessel', 'asme viii', 'kazan', 'tank', 'bombe', 'et kalinligi'],
  },
  {
    id: 'fluid-dynamics',
    href: '/fluid-dynamics',
    titleTr: 'Boru Hattı Akışı & Basınç Düşümü',
    titleEn: 'Pipe Flow & Pressure Drop (Darcy)',
    standard: 'Darcy-Weisbach / Crane TP 410',
    descTr: 'Reynolds sayısı, Colebrook sürtünme faktörü, fitting yerel kayıpları ve pompa basma yüksekliği.',
    descEn: 'Reynolds number, Colebrook friction factor, minor fitting losses, and head loss.',
    category: 'fluids',
    keywords: ['boru', 'akis', 'darcy', 'reynolds', 'basinc dusumu', 'pipe', 'pressure drop', 'fitting'],
  },
  {
    id: 'heat-sink',
    href: '/heat-sink',
    titleTr: 'Alüminyum Soğutucu Profil (Termal Direnç)',
    titleEn: 'Extruded Heat Sink Thermal Sizing',
    standard: 'ISO 13732 / VDI Termal',
    descTr: 'Kanat geometrisi, doğal/zorlanmış konveksiyon ve profil termal direnci (R_th) hesabı.',
    descEn: 'Fin geometry, natural/forced convection heat transfer, and profile thermal resistance.',
    category: 'fluids',
    keywords: ['sogutucu', 'heat sink', 'termal', 'thermal resistance', 'rth', 'aluminyum profil'],
  },
  {
    id: 'pumps',
    href: '/pumps',
    titleTr: 'Santrifüj Pompa & NPSH Hesabı',
    titleEn: 'Centrifugal Pump & NPSH Sizing',
    standard: 'ISO 9906 / ANSI HI',
    descTr: 'Sistem debi-basınç eğrisi, NPSH_mevcut vs NPSH_gerekli ve kavitasyon güvenlik kontrolü.',
    descEn: 'System head curve, NPSHa vs NPSHr margin, and cavitation risk verification.',
    category: 'fluids',
    keywords: ['pompa', 'pump', 'npsh', 'kavitasyon', 'debi', 'basma yuksekligi'],
  },

  // ─── MALZEME, İMALAT & YAPISAL ───
  {
    id: 'fits',
    href: '/fits',
    titleTr: 'Toleranslar ve Geçmeler (ISO 286)',
    titleEn: 'Fits & Tolerances (ISO 286)',
    standard: 'ISO 286 / DIN 7154',
    descTr: 'Mil ve delik temel sapmaları, H7/g6, H7/p6 gibi boşluklu, sıkı ve ara geçme limit ölçüleri.',
    descEn: 'Shaft/hole fundamental deviations, clearance, interference, and transition tolerance limits.',
    category: 'manufacturing',
    keywords: ['tolerans', 'gecme', 'fits', 'iso 286', 'h7', 'h7/g6', 'h7/p6', 'bosluk'],
  },
  {
    id: 'sheet-metal',
    href: '/sheet-metal',
    titleTr: 'Sac Büküm Açınımı & K-Faktörü',
    titleEn: 'Sheet Metal Bend Allowance & K-Factor',
    standard: 'DIN 6935',
    descTr: 'Büküm payı (BA), büküm kesintisi (BD), tarafsız eksen K-faktörü ve açınım boyu hesabı.',
    descEn: 'Bend allowance, bend deduction, neutral axis K-factor, and unfolded flat sheet length.',
    category: 'manufacturing',
    keywords: ['sac', 'bukum', 'sheet metal', 'k factor', 'k-faktoru', 'acinim', 'din 6935'],
  },
  {
    id: 'beam-deflection',
    href: '/beam-deflection',
    titleTr: 'Kiriş Sehim & Gerilme Analizi',
    titleEn: 'Beam Deflection & Bending Stress',
    standard: 'EN 1993 (Eurocode 3)',
    descTr: 'Noktasal/yayılı yük altında maksimum sehim, eğilme momenti, kayma gerilmesi ve L/300 kontrolü.',
    descEn: 'Maximum deflection, bending moment, shear force, and L/300 serviceability limits.',
    category: 'manufacturing',
    keywords: ['kiris', 'sehim', 'beam', 'deflection', 'moment', 'eurocode 3', 'profil'],
  },
  {
    id: 'column-buckling',
    href: '/column-buckling',
    titleTr: 'Kolon Burkulma Analizi (Euler-Johnson)',
    titleEn: 'Column Buckling (Euler-Johnson)',
    standard: 'Euler / Johnson / AISC',
    descTr: 'Narinlik oranı, kritik burkulma yükü ve uç mesnet şartlarına göre emniyetli eksenel taşıma kapasitesi.',
    descEn: 'Slenderness ratio, critical buckling load, and safe allowable axial load.',
    category: 'manufacturing',
    keywords: ['kolon', 'burkulma', 'buckling', 'euler', 'johnson', 'narinlik'],
  },
  {
    id: 'machining-details',
    href: '/machining-details',
    titleTr: 'Talaşlı İmalat Kesme Hızları & İlerleme',
    titleEn: 'Machining Speeds & Feeds Hub',
    standard: 'ISO 513 / DIN 6580',
    descTr: 'Torna ve frezede kesme hızı (Vc), devir (RPM), tabla ilerlemesi (Vf) ve talaş debisi (Q).',
    descEn: 'Cutting speed (Vc), spindle RPM, table feed rate (Vf), and material removal rate (MRR).',
    category: 'manufacturing',
    keywords: ['talasli', 'machining', 'kesme hizi', 'ilerleme', 'devir', 'torna', 'freze', 'mrr'],
  },

  // ─── CAD & HESAPLAMA STÜDYOLARI ───
  {
    id: 'design-studio',
    href: '/design-studio',
    titleTr: '3D Parametrik Parça Konfigüratörü',
    titleEn: '3D Parametric Part Configurator',
    standard: 'OpenCascade WASM / STEP',
    descTr: 'Alüminyum profil ve mekanik montajları 3D görselleştirin, delik/havşa ekleyin, STL/STEP indirin.',
    descEn: 'Browser 3D parametric configurator with hole/countersink edits and binary STL/STEP exports.',
    category: 'cad',
    keywords: ['3d', 'cad', 'configurator', 'stl', 'step', 'montaj', 'profil'],
  },
  {
    id: 'cad-editor',
    href: '/cad-editor',
    titleTr: '2D AluCAD Teknik Çizim Motoru',
    titleEn: '2D AluCAD Drafting Engine',
    standard: 'AutoCAD DXF R12 / ISO 128',
    descTr: 'Ölçülendirme, geometrik yakalama, katman yönetimi ve doğrudan üretim odaklı DXF ihracatı.',
    descEn: '2D drafting canvas with geometric snaps, dimensions, layer manager, and clean DXF export.',
    category: 'cad',
    keywords: ['2d', 'cad', 'dxf', 'dwg', 'cizim', 'teknik resim', 'drafting'],
  },
  {
    id: 'flow',
    href: '/flow',
    titleTr: 'Görsel Mühendislik Akış Motoru (Flow)',
    titleEn: 'Engineering Flow Engine (DAG)',
    standard: 'Deterministik DAG Ağı',
    descTr: 'Mekanik formülleri ve parametreleri düğümlerle birbirine bağlayarak zincirleme hesap yapın.',
    descEn: 'Connect mechanical formulas, kinematic variables, and 3D geometry into a reactive DAG graph.',
    category: 'cad',
    keywords: ['flow', 'akis', 'dag', 'node', 'pipeline', 'workflow', 'graf'],
  },
  {
    id: 'fea',
    href: '/fea',
    titleTr: 'FEA Doğrusal Statik Sonlu Elemanlar',
    titleEn: 'FEA Linear Static Simulation',
    standard: 'Doğrulanmış WebGL FEA',
    descTr: 'Konsol kiriş, delikli plaka ve L-braket gerilme dağılımını (von Mises) tarayıcıda simüle edin.',
    descEn: 'Real-time linear-elastic FEA stress analysis for beams, plates with holes, and brackets.',
    category: 'cad',
    keywords: ['fea', 'gerilme', 'stress', 'von mises', 'simulasyon', 'statik'],
  },
];

const DECISION_TREE = [
  {
    qTr: 'Bir cıvatanın sıkma torkunu veya güvenliğini mi hesaplayacaksınız?',
    qEn: 'Need tightening torque or yield safety for a bolt?',
    targetId: 'bolt-torque',
    targetTitle: 'Cıvata Torku (VDI 2230)',
  },
  {
    qTr: 'Dönen bir mildeki rulmanın kaç saat ömrü kaldığını mı bulacaksınız?',
    qEn: 'Need operating life in hours for a ball/roller bearing?',
    targetId: 'bearings',
    targetTitle: 'Rulman Ömrü (ISO 281)',
  },
  {
    qTr: 'Mil ile göbek arasındaki kamalı bağlantının dayanımını mı kontrol edeceksiniz?',
    qEn: 'Checking parallel key shear and surface pressure on a shaft?',
    targetId: 'keyway-connection',
    targetTitle: 'Kama Hesabı (DIN 6885)',
  },
  {
    qTr: 'Isıtarak veya presle sıkı geçme yapıp iletilecek torku mu hesaplayacaksınız?',
    qEn: 'Calculating interference fit contact pressure & heating temp?',
    targetId: 'press-fit',
    targetTitle: 'Sıkı Geçme (DIN 7190)',
  },
  {
    qTr: 'Hidrolik veya pnömatik sistem için O-Ring kanalı mı boyutlandıracaksınız?',
    qEn: 'Designing an O-Ring sealing groove and squeeze ratio?',
    targetId: 'o-ring',
    targetTitle: 'O-Ring Kanalı (ISO 3601)',
  },
  {
    qTr: 'Profil veya kiriş üzerindeki yükten kaynaklı sehim ve gerilmeyi mi arıyorsunuz?',
    qEn: 'Need maximum deflection and bending stress on a loaded beam?',
    targetId: 'beam-deflection',
    targetTitle: 'Kiriş Sehim Analizi (EN 1993)',
  },
  {
    qTr: 'İki parçanın geçme toleranslarını ve boşluk/sıkılık limitlerini mi bulacaksınız?',
    qEn: 'Checking ISO shaft/hole tolerance limits (e.g. H7/g6)?',
    targetId: 'fits',
    targetTitle: 'Tolerans & Geçmeler (ISO 286)',
  },
  {
    qTr: 'Basınçlı tank veya kazan et kalınlığını standartlara göre mi belirleyeceksiniz?',
    qEn: 'Sizing pressure vessel shell & head wall thickness per ASME?',
    targetId: 'pressure-vessel',
    targetTitle: 'Basınçlı Kap (ASME VIII)',
  },
  {
    qTr: 'Boru hattındaki sürtünme basınç düşümünü mü hesaplayacaksınız?',
    qEn: 'Calculating Darcy friction pressure drop in pipework?',
    targetId: 'fluid-dynamics',
    targetTitle: 'Boru Akışı & Basınç Düşümü',
  },
  {
    qTr: 'Sac levhanın büküm açınım boyunu ve K-faktörünü mü çıkaracaksınız?',
    qEn: 'Calculating sheet metal bend allowance and flat length?',
    targetId: 'sheet-metal',
    targetTitle: 'Sac Büküm (DIN 6935)',
  },
  {
    qTr: '2D teknik resim çizmek veya DXF oluşturmak mı istiyorsunuz?',
    qEn: 'Want to draft 2D engineering drawings or export DXF?',
    targetId: 'cad-editor',
    targetTitle: '2D AluCAD Çizim',
  },
  {
    qTr: '3D parça konfigüre edip STL/STEP olarak indirmek mi istiyorsunuz?',
    qEn: 'Want to configure 3D parts and export STL/STEP?',
    targetId: 'design-studio',
    targetTitle: '3D Tasarım Stüdyosu',
  },
];

export function EngineeringNavigatorModal() {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'guide' | 'mechanical' | 'fluids' | 'manufacturing' | 'cad'>('guide');
  const { language } = useI18nStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.key === 'm' || e.key === 'M') &&
        e.altKey &&
        !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)
      ) {
        e.preventDefault();
        setOpen((prev) => !prev);
      } else if (e.key === 'Escape' && open) {
        setOpen(false);
      }
    };

    const handleCustomOpen = () => setOpen(true);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('alucalc:open-navigator', handleCustomOpen);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('alucalc:open-navigator', handleCustomOpen);
    };
  }, [open]);

  // Filtered items based on search query or tab
  const filteredItems = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) {
      if (activeTab === 'all' || activeTab === 'guide') return NAVIGATOR_ITEMS;
      return NAVIGATOR_ITEMS.filter((i) => i.category === activeTab);
    }
    return NAVIGATOR_ITEMS.filter((item) => {
      const text = `${item.titleTr} ${item.titleEn} ${item.standard} ${item.descTr} ${item.descEn} ${item.keywords.join(' ')}`.toLowerCase();
      return text.includes(q);
    });
  }, [searchQuery, activeTab]);

  const filteredDecisions = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return DECISION_TREE;
    return DECISION_TREE.filter((d) => {
      const text = `${d.qTr} ${d.qEn} ${d.targetTitle}`.toLowerCase();
      return text.includes(q);
    });
  }, [searchQuery]);

  if (!open) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80"
          onClick={() => setOpen(false)}
        />

        {/* Modal Window: CNC / Mitutoyo Instrument Panel Style */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.16 }}
          className="relative w-full max-w-4xl max-h-[88vh] rounded-[var(--radius-m)] border border-[var(--line-strong)] bg-[var(--bg-1)] shadow-2xl flex flex-col overflow-hidden text-[var(--ink)] font-sans"
        >
          {/* Header Bar */}
          <div className="px-5 py-4 border-b border-[var(--line)] bg-[var(--bg-0)] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-[var(--radius-s)] bg-[var(--cyan)]/15 border border-[var(--cyan)]/30 text-[var(--cyan)]">
                <Compass size={20} />
              </div>
              <div>
                <h2 className="text-base font-bold font-tech text-[var(--ink)] flex items-center gap-2">
                  <span>{t12(language, 'Engineering Navigator & Module Guide', 'Mühendislik Rehberi & Modül Haritası')}</span>
                  <span className="px-2 py-0.5 rounded-[var(--radius-s)] bg-[var(--bg-2)] border border-[var(--line)] text-[10px] font-mono text-[var(--cyan)]">
                    {solverCount} Solvers
                  </span>
                </h2>
                <p className="text-xs text-[var(--alu-dim)] font-mono">
                  {t12(language, 'Find the right calculation, standard & tool in seconds without getting lost.', 'Sitede kaybolmadan ihtiyacınız olan hesaplayıcıyı ve standardı hemen bulun.')}
                </p>
              </div>
            </div>

            <button
              onClick={() => setOpen(false)}
              className="p-1.5 rounded-[var(--radius-s)] text-[var(--alu-dim)] hover:text-white hover:bg-[var(--bg-2)] transition-colors"
              title="Close (Esc)"
            >
              <X size={18} />
            </button>
          </div>

          {/* Search Input Bar */}
          <div className="p-4 border-b border-[var(--line)] bg-[var(--bg-1)] shrink-0 space-y-3">
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--alu-dim)]" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t12(
                  language,
                  "Search by calculation (e.g. 'bolt torque', 'bearing life', 'beam', 'gear', 'VDI 2230', 'ISO 281')...",
                  "Aramak istediğiniz hesabı veya standardı yazın (örn: 'cıvata torku', 'rulman', 'dişli', 'kiriş', 'kama', 'VDI 2230')..."
                )}
                className="w-full h-11 pl-10 pr-10 rounded-[var(--radius-s)] bg-[var(--bg-2)] border border-[var(--line)] text-sm font-mono text-[var(--ink)] placeholder:text-[var(--alu-dim)]/60 focus:outline-none focus:border-[var(--cyan)] transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-[var(--alu-dim)] hover:text-white px-1.5 py-0.5 rounded bg-[var(--bg-3)]"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Quick Filter Tabs */}
            {!searchQuery && (
              <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-mono pb-1">
                <button
                  onClick={() => setActiveTab('guide')}
                  className={`px-3 py-1.5 rounded-[var(--radius-s)] border transition-all flex items-center gap-1.5 shrink-0 ${
                    activeTab === 'guide'
                      ? 'border-[var(--cyan)] bg-[var(--cyan)]/15 text-[var(--cyan)] font-bold'
                      : 'border-[var(--line)] bg-[var(--bg-2)] text-[var(--alu-dim)] hover:text-white'
                  }`}
                >
                  <Sparkles size={13} />
                  <span>{t12(language, 'Decision Guide (What do you need?)', 'Hızlı Karar Ağacı (Ne Yapmak İstiyorsunuz?)')}</span>
                </button>

                <button
                  onClick={() => setActiveTab('mechanical')}
                  className={`px-3 py-1.5 rounded-[var(--radius-s)] border transition-all flex items-center gap-1.5 shrink-0 ${
                    activeTab === 'mechanical'
                      ? 'border-[var(--cyan)] bg-[var(--cyan)]/15 text-[var(--cyan)] font-bold'
                      : 'border-[var(--line)] bg-[var(--bg-2)] text-[var(--alu-dim)] hover:text-white'
                  }`}
                >
                  <Wrench size={13} />
                  <span>{t12(language, 'Mechanical Elements', 'Mekanik & Makine Elemanları')}</span>
                </button>

                <button
                  onClick={() => setActiveTab('fluids')}
                  className={`px-3 py-1.5 rounded-[var(--radius-s)] border transition-all flex items-center gap-1.5 shrink-0 ${
                    activeTab === 'fluids'
                      ? 'border-[var(--cyan)] bg-[var(--cyan)]/15 text-[var(--cyan)] font-bold'
                      : 'border-[var(--line)] bg-[var(--bg-2)] text-[var(--alu-dim)] hover:text-white'
                  }`}
                >
                  <Flame size={13} />
                  <span>{t12(language, 'Fluids & Pressure', 'Akışkan & Basınç')}</span>
                </button>

                <button
                  onClick={() => setActiveTab('manufacturing')}
                  className={`px-3 py-1.5 rounded-[var(--radius-s)] border transition-all flex items-center gap-1.5 shrink-0 ${
                    activeTab === 'manufacturing'
                      ? 'border-[var(--cyan)] bg-[var(--cyan)]/15 text-[var(--cyan)] font-bold'
                      : 'border-[var(--line)] bg-[var(--bg-2)] text-[var(--alu-dim)] hover:text-white'
                  }`}
                >
                  <Layers size={13} />
                  <span>{t12(language, 'Manufacturing & Structural', 'İmalat & Yapısal')}</span>
                </button>

                <button
                  onClick={() => setActiveTab('cad')}
                  className={`px-3 py-1.5 rounded-[var(--radius-s)] border transition-all flex items-center gap-1.5 shrink-0 ${
                    activeTab === 'cad'
                      ? 'border-[var(--cyan)] bg-[var(--cyan)]/15 text-[var(--cyan)] font-bold'
                      : 'border-[var(--line)] bg-[var(--bg-2)] text-[var(--alu-dim)] hover:text-white'
                  }`}
                >
                  <Box size={13} />
                  <span>{t12(language, 'CAD & Studios', 'CAD & Stüdyolar')}</span>
                </button>

                <button
                  onClick={() => setActiveTab('all')}
                  className={`px-3 py-1.5 rounded-[var(--radius-s)] border transition-all shrink-0 ${
                    activeTab === 'all'
                      ? 'border-[var(--cyan)] bg-[var(--cyan)]/15 text-[var(--cyan)] font-bold'
                      : 'border-[var(--line)] bg-[var(--bg-2)] text-[var(--alu-dim)] hover:text-white'
                  }`}
                >
                  <span>{t12(language, 'All Tools', 'Tümü')}</span>
                </button>
              </div>
            )}
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 custom-scrollbar">
            {/* ═══ DECISION TREE VIEW (Active when Guide tab selected and no search) ═══ */}
            {activeTab === 'guide' && !searchQuery ? (
              <div className="space-y-4">
                <div className="p-3.5 rounded-[var(--radius-s)] bg-[var(--bg-2)] border border-[var(--cyan)]/25 flex items-start gap-3">
                  <ShieldCheck size={18} className="text-[var(--cyan)] shrink-0 mt-0.5" />
                  <div className="text-xs space-y-1 font-mono">
                    <p className="font-bold text-[var(--ink)]">
                      {t12(language, 'AluCAD OS 3-Step Engineering Workflow', 'AluCAD OS 3 Adımlı Mühendislik Akışı')}
                    </p>
                    <p className="text-[var(--alu-dim)] leading-relaxed font-sans">
                      {t12(
                        language,
                        '1. Calculate your machine element using ISO/DIN/VDI verified solvers → 2. Model or draft in 3D/2D CAD → 3. Export auditable PDF/DXF/STEP engineering reports.',
                        '1. ISO/DIN/VDI onaylı çözücülerle makine elemanını boyutlandırın → 2. 3D/2D CAD ile üretilebilir geometriye dökün → 3. Doğrulanmış PDF/DXF/STEP raporu alın.'
                      )}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {filteredDecisions.map((dec, idx) => {
                    const targetTool = NAVIGATOR_ITEMS.find((t) => t.id === dec.targetId);
                    return (
                      <Link
                        key={idx}
                        href={targetTool ? targetTool.href : '/calculators'}
                        onClick={() => setOpen(false)}
                        className="group p-3.5 rounded-[var(--radius-s)] bg-[var(--bg-2)] border border-[var(--line)] hover:border-[var(--cyan)] transition-all flex flex-col justify-between space-y-2.5 shadow-xs"
                      >
                        <p className="text-xs font-sans text-[var(--ink)] leading-snug group-hover:text-[var(--cyan)] transition-colors">
                          {language === 'tr' ? dec.qTr : dec.qEn}
                        </p>
                        <div className="flex items-center justify-between pt-2 border-t border-[var(--line)] text-[11px] font-mono">
                          <span className="font-bold text-[var(--cyan)] flex items-center gap-1.5">
                            <ArrowRight size={12} />
                            {dec.targetTitle}
                          </span>
                          {targetTool && (
                            <span className="text-[9px] text-[var(--std)] px-1.5 py-0.5 rounded bg-[var(--bg-3)] border border-[var(--line)]">
                              {targetTool.standard.split('/')[0].trim()}
                            </span>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* ═══ MODULE CARDS GRID (When filtering by tab or search) ═══ */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredItems.map((item) => (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="group p-4 rounded-[var(--radius-s)] bg-[var(--bg-2)] border border-[var(--line)] hover:border-[var(--cyan)] transition-all flex flex-col justify-between space-y-3"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-mono text-[var(--std)] px-2 py-0.5 rounded bg-[var(--bg-3)] border border-[var(--line)] font-bold">
                          {item.standard}
                        </span>
                        <span className="text-[10px] font-mono text-[var(--alu-dim)] uppercase">
                          {item.category}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold font-tech text-[var(--ink)] group-hover:text-[var(--cyan)] transition-colors">
                        {language === 'tr' ? item.titleTr : item.titleEn}
                      </h3>
                      <p className="text-xs text-[var(--alu-dim)] font-sans leading-relaxed line-clamp-2">
                        {language === 'tr' ? item.descTr : item.descEn}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-[var(--line)] text-[11px] font-mono text-[var(--cyan)]">
                      <span>{t12(language, 'Open Calculation', 'Hesaplayıcıyı Aç')}</span>
                      <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Footer Bar */}
          <div className="px-5 py-3 border-t border-[var(--line)] bg-[var(--bg-0)] flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-[var(--alu-dim)] shrink-0">
            <div className="flex items-center gap-3">
              <Link
                href="/calculators"
                onClick={() => setOpen(false)}
                className="text-[var(--cyan)] hover:underline flex items-center gap-1 font-bold"
              >
                <span>{t12(language, 'View Full 86 Solvers Directory →', '86 Modüllü Tam Çözücüler Dizinini Gör →')}</span>
              </Link>
            </div>
            <div className="flex items-center gap-2 text-[10px]">
              <kbd className="px-1.5 py-0.5 rounded bg-[var(--bg-2)] border border-[var(--line)]">Alt + M</kbd>
              <span>{t12(language, 'Toggle Navigator', 'Rehberi Aç/Kapat')}</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default EngineeringNavigatorModal;
