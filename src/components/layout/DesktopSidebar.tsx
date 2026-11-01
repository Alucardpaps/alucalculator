'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Box,
  Pencil,
  Cog,
  CircleDot,
  Wrench,
  Layers,
  GraduationCap,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Zap,
  Flame,
  Activity,
  Scissors,
  Split,
  Compass,
  Search,
  Sliders,
  Scale,
  Atom,
  Disc,
  PenTool,
  Smartphone,
  Droplets,
  Wind,
  Waves,
  Thermometer,
  Anchor,
  Calculator,
  ArrowLeftRight,
  DollarSign,
  CircleSlash,
  Cable,
  Database,
  Workflow,
  Gauge,
  Binary,
  Radio,
  Dna,
  FlaskConical,
  Orbit,
  Boxes
} from 'lucide-react';
import { useI18nStore } from '@/store/i18nStore';
import { t12 } from '@/locales/t12';
import { solverCount } from '@/lib/registry/calculatorRegistry';
import { AegisSidebarBubble } from '@/components/copilot/AegisSidebarBubble';
import { SidebarAnimatedIcon } from '@/components/ui/SidebarAnimatedIcon';
import { getLocalizedNavTitle, getLocalizedNavItemLabel } from '@/locales/sidebarTranslations';
import { getChrome } from '@/locales/chromeTranslations';

export interface NavItem {
  id: string;
  href: string;
  labelEn: string;
  labelTr: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  badge?: string;
  color?: string;
  keywords?: string[];
}

export const ALL_NAV_GROUPS: {
  id: string;
  titleEn: string;
  titleTr: string;
  items: NavItem[];
}[] = [
  {
    id: 'studios',
    titleEn: 'CAD & ENGINEERING STUDIOS',
    titleTr: 'CAD & İMALAT STÜDYOLARI',
    items: [
      { id: 'design-studio', href: '/design-studio', labelEn: '3D Design Studio & Assembly (V2)', labelTr: '3D Tasarım & Montaj Stüdyosu (V2)', icon: Boxes, color: '#00e5ff', badge: '3D', keywords: ['3d', 'stl', 'parametric', 'configurator', 'preview', 'solid', 'assembly', 'cad'] },
      { id: 'cad-editor', href: '/cad-editor', labelEn: '2D AluCAD Drafting', labelTr: '2D AluCAD Çizim', icon: Pencil, color: '#a855f7', badge: '2D', keywords: ['2d', 'dxf', 'autocad', 'dwg', 'cizim', 'paper'] },
      { id: 'sketch-pad', href: '/sketch-pad', labelEn: 'Technical Sketch Pad', labelTr: 'Mühendislik Şema Tahtası', icon: PenTool, color: '#ec4899', badge: 'PAD', keywords: ['sketch', 'pad', 'sema', 'cizim', 'whiteboard', 'excalidraw', 'drawing', 'diagram'] },
      { id: 'fea-studio', href: '/fea', labelEn: 'FEA Linear Static v1', labelTr: 'FEA Doğrusal Statik v1', icon: Activity, color: '#ef4444', badge: 'v1', keywords: ['fea', 'stress', 'linear', 'static', 'simulation', 'gerilme', 'von mises', 'beam', 'bracket', 'plate'] },
      { id: 'flow', href: '/flow', labelEn: 'Engineering Flow Engine (Node-RED/NX)', labelTr: 'Görsel Mühendislik Akış Motoru', icon: Workflow, color: '#06b6d4', badge: 'FLOW', keywords: ['flow', 'node-red', 'nx', 'graph', 'pipeline', 'workflow', 'akis'] },
      { id: 'nesting', href: '/nesting-2d', labelEn: '2D Sheet Nesting', labelTr: '2D Plaka Yerleşim', icon: Scissors, color: '#f59e0b', keywords: ['nesting', 'cut', 'yerlesim', 'plaka'] },
      { id: 'cutting', href: '/cutting-optimizer', labelEn: '1D Linear Cut Optimizer', labelTr: '1D Profil Kesim Opt.', icon: Scissors, color: '#f97316', keywords: ['cutting', '1d', 'linear', 'kesim', 'profil'] },
    ],
  },
  {
    id: 'mechanical',
    titleEn: 'MECHANICAL & MACHINE ELEMENTS',
    titleTr: 'MEKANİK & MAKİNE ELEMANLARI',
    items: [
      { id: 'cylinders', href: '/cylinders', labelEn: 'Hydraulic & Pneumatic Cylinders (1:1 CAD)', labelTr: 'Hidrolik & Pnömatik Silindirler (1:1 CAD)', icon: Gauge, color: '#06b6d4', badge: '1:1', keywords: ['silindir', 'cylinder', 'hidrolik', 'hydraulic', 'pnomatik', 'pneumatic', 'piston', 'iso 6020', 'kastas'] },
      { id: 'bolt-torque', href: '/bolt-torque', labelEn: 'Bolt Torque & Fasteners (VDI 2230)', labelTr: 'Cıvata Torku & Bağlantı (VDI 2230)', icon: Wrench, color: '#f59e0b', keywords: ['civata', 'tork', 'bolt', 'torque', 'fastener', 'fasteners', 'vdi 2230', 'iso 898', 'vida', 'somun', 'thread'] },
      { id: 'keyway-connection', href: '/keyway-connection', labelEn: 'Parallel Keyway (DIN 6885)', labelTr: 'Paralel Kama Dayanımı (DIN 6885)', icon: Layers, color: '#38bdf8', badge: 'DIN', keywords: ['kama', 'keyway', 'din 6885', 'mil gobek', 'parallel key', 'shear', 'surface pressure'] },
      { id: 'press-fit', href: '/press-fit', labelEn: 'Interference / Press Fit (DIN 7190)', labelTr: 'Sıkı Geçme / Pres & Sıcak (DIN 7190)', icon: Gauge, color: '#818cf8', badge: 'DIN', keywords: ['siki gecme', 'pres gecme', 'press fit', 'interference fit', 'shrink fit', 'din 7190', 'lame'] },
      { id: 'o-ring', href: '/o-ring', labelEn: 'O-Ring Sealing & Glands (ISO 3601)', labelTr: 'O-Ring Sızdırmazlık & Kanal (ISO 3601)', icon: Droplets, color: '#2dd4bf', badge: 'ISO', keywords: ['o-ring', 'oring', 'sizdirmazlik', 'iso 3601', 'as568', 'gland', 'kanal', 'conta', 'seal', 'seals'] },
      { id: 'bearings', href: '/bearings', labelEn: 'Bearing Life (ISO 281)', labelTr: 'Rulman Ömrü (ISO 281)', icon: CircleDot, color: '#3b82f6', keywords: ['rulman', 'bearing', 'skf', 'l10', 'iso 281'] },
      { id: 'gears', href: '/gears', labelEn: 'Gear Design (ISO 6336)', labelTr: 'Dişli Tasarımı (ISO 6336)', icon: Cog, color: '#00e5ff', keywords: ['disli', 'gear', 'pinion', 'spur', 'iso 6336'] },
      { id: 'planetary-gearbox', href: '/planetary-gearbox', labelEn: 'Planetary Gearbox Solver', labelTr: 'Planet Redüktör Hesabı', icon: Cog, color: '#06b6d4', badge: 'PLANET', keywords: ['planet', 'planetary', 'gearbox', 'reduktor', 'gunes', 'uydu'] },
      { id: 'gearbox-design', href: '/gearbox-design', labelEn: 'Gearbox Design Engine', labelTr: 'Redüktör Tasarım Motoru', icon: Cog, color: '#8b5cf6', keywords: ['gearbox', 'reduktor', 'tasarim', 'mil', 'shafts'] },
      { id: 'reducer-lubrication', href: '/reducer-lubrication', labelEn: 'Gearbox Thermal & Lubrication', labelTr: 'Redüktör Termal Güç & Yağlama', icon: Droplets, color: '#f59e0b', keywords: ['yaglama', 'reduktor', 'lubrication', 'thermal', 'viscosity'] },
      { id: 'shafts', href: '/shafts', labelEn: 'Shaft Sizing & Reactions', labelTr: 'Mil Boyutlandırma & Mesnet Tepkileri', icon: Disc, color: '#06b6d4', keywords: ['mil', 'shaft', 'shafts', 'tepki', 'torsion', 'burulma'] },
      { id: 'spring-design', href: '/advanced-spring', labelEn: 'Helical Spring Design', labelTr: 'Helisel Yay Hesabı', icon: Disc, color: '#14b8a6', keywords: ['yay', 'spring', 'helical', 'wahl'] },
      { id: 'beam-deflection', href: '/beam-deflection', labelEn: 'Beam Deflection Analysis', labelTr: 'Kiriş Sehim Analizi', icon: Layers, color: '#22c55e', keywords: ['kiris', 'sehim', 'beam', 'deflection', 'moment'] },
      { id: 'column-buckling', href: '/column-buckling', labelEn: 'Column Buckling (Euler-Johnson)', labelTr: 'Kolon Burkulma Analizi', icon: Layers, color: '#f97316', keywords: ['kolon', 'burkulma', 'buckling', 'euler', 'johnson'] },
      { id: 'chain-drive', href: '/chain-drive', labelEn: 'Roller Chain (ISO 606)', labelTr: 'Makaralı Zincir Mekanizması', icon: Activity, color: '#6366f1', keywords: ['zincir', 'chain', 'sprocket', 'iso 606'] },
      { id: 'belt-drive', href: '/belt-drive', labelEn: 'Belt Drive (ISO 5291)', labelTr: 'Kayış-Kasnak Mekanizması', icon: Sliders, color: '#f97316', keywords: ['kayis', 'kasnak', 'belt', 'pulley', 'v-belt'] },
      { id: 'welding', href: '/welding', labelEn: 'Welding & Joint Stress', labelTr: 'Kaynak Mukavemeti & Dikiş', icon: Flame, color: '#ef4444', keywords: ['kaynak', 'weld', 'joint', 'throat'] },
      { id: 'vibration', href: '/vibration', labelEn: 'Vibration & Natural Frequency', labelTr: 'Titreşim & Doğal Frekans', icon: Activity, color: '#a855f7', keywords: ['titresim', 'vibration', 'frekans', 'resonance', 'damping'] },
      { id: 'motor-selection', href: '/motor-selection-std', labelEn: 'Motor Selection Engine', labelTr: 'Motor Seçim Motoru', icon: Zap, color: '#f59e0b', keywords: ['motor', 'motor secimi', 'kw', 'hp', 'rpm', 'tork'] },
    ],
  },
  {
    id: 'fluids',
    titleEn: 'THERMAL, FLUID & AERO-MARINE',
    titleTr: 'TERMAL, AKIŞKAN & DENİZCİLİK',
    items: [
      { id: 'fluid-dynamics', href: '/fluid-dynamics', labelEn: 'Fluid Dynamics & Piping (Darcy / Crane)', labelTr: 'Akışkan Dinamiği & Boru Hattı (Darcy / Crane)', icon: Droplets, color: '#06b6d4', keywords: ['akiskan', 'fluid', 'darcy', 'basinc dusumu', 'pipe flow', 'reynolds', 'pipe', 'friction', 'fitting', 'loss', 'boru', 'surtunme'] },
      { id: 'pressure-vessel', href: '/pressure-vessel', labelEn: 'Pressure Vessel Design (ASME VIII)', labelTr: 'Basınçlı Kap Tasarımı (ASME VIII)', icon: Gauge, color: '#ef4444', badge: 'ASME', keywords: ['basincli kap', 'pressure vessel', 'asme', 'kazan', 'tank'] },
      { id: 'heat-sink', href: '/heat-sink', labelEn: 'Extruded Heat Sink (Thermal)', labelTr: 'Alüminyum Soğutucu Profil (Termal)', icon: Flame, color: '#f97316', keywords: ['sogutucu', 'heat sink', 'aluminyum profil', 'termal', 'thermal resistance', 'rth', 'kanatli profil', 'ekstrüzyon'] },
      { id: 'thermal-expansion', href: '/thermal-expansion', labelEn: 'Thermal Expansion & Stresses', labelTr: 'Termal Genleşme & Gerilme', icon: Thermometer, color: '#f59e0b', keywords: ['termal', 'genlesme', 'expansion', 'temperature', 'sicaklik'] },
      { id: 'pumps', href: '/pumps', labelEn: 'Centrifugal Pump & NPSH', labelTr: 'Santrifüj Pompa & NPSH', icon: Waves, color: '#00e5ff', keywords: ['pompa', 'pump', 'npsh', 'head', 'debi'] },
      { id: 'hvac-load', href: '/hvac-load', labelEn: 'HVAC Thermal Load Estimator', labelTr: 'HVAC Isı Kazancı & Termal Yük', icon: Wind, color: '#10b981', keywords: ['hvac', 'thermal load', 'iklimlendirme', 'cooling', 'heating'] },
      { id: 'aerospace-dynamics', href: '/aerospace-dynamics', labelEn: 'Aerospace & Wind Tunnel (ISA / 3D)', labelTr: 'Havacılık & Rüzgar Tüneli (ISA / 3D)', icon: Wind, color: '#a855f7', keywords: ['aerospace', 'flight', 'atmosfer', 'isa', 'thrust', 'wind tunnel', 'aerodinamik', 'drag', 'lift', 'ruzgar'] },
    ],
  },
  {
    id: 'electrical',
    titleEn: 'ELECTRICAL & DIGITAL ELECTRONICS',
    titleTr: 'ELEKTRİK & DİJİTAL ELEKTRONİK',
    items: [
      { 
        id: 'electrical-suite', 
        href: '/three-phase-power', 
        labelEn: 'Electrical & Electronics Suite (IEC / AC / DC)', 
        labelTr: 'Elektrik & Elektronik Paketi (IEC / AC / DC)', 
        icon: Zap, 
        color: '#f59e0b', 
        badge: 'IEC', 
        keywords: ['elektrik', 'elektronik', '3 faz', 'three phase', 'power', 'kwa', 'gerilim', 'voltage drop', 'kablo', 'kesit', 'iec 60287', 'ohms law', 'ohm', 'direnc', 'filter', 'rc', 'rlc', 'digital logic', 'mantik', 'boolean'] 
      },
    ],
  },
  {
    id: 'manufacturing',
    titleEn: 'MATERIALS & MANUFACTURING',
    titleTr: 'MALZEME & İMALAT REHBERİ',
    items: [
      { id: 'fits-tolerances', href: '/fits', labelEn: 'Fits & Tolerances (ISO 286)', labelTr: 'Toleranslar & Geçmeler', icon: Compass, color: '#eab308', badge: 'ISO', keywords: ['tolerans', 'gecme', 'fits', 'iso 286', 'h7'] },
      { id: 'sheet-metal', href: '/sheet-metal', labelEn: 'Sheet Metal & Bend (DIN 6935)', labelTr: 'Sac Büküm & Açınım (DIN 6935)', icon: Split, color: '#ec4899', badge: 'DIN', keywords: ['sac', 'bukum', 'sheet metal', 'bend', 'k factor', 'din 6935'] },
      { id: 'machining-details', href: '/machining-details', labelEn: 'Machining Speeds & Feeds', labelTr: 'Talaşlı İmalat Kesme Hızları', icon: Scissors, color: '#a855f7', keywords: ['talasli', 'machining', 'feed', 'speed', 'torna', 'freze'] },
      { id: 'unit-converter', href: '/unit-converter', labelEn: 'Hardness & Unit Converter', labelTr: 'Birim & Sertlik Dönüştürücü', icon: ArrowLeftRight, color: '#10b981', keywords: ['birim', 'unit', 'donusturucu', 'sertlik', 'hardness', 'hrc', 'hb', 'vickers', 'tensile', 'inch', 'mm', 'bar', 'psi'] },
      { id: 'profile-weight', href: '/profile-weight', labelEn: 'Profile Weight & Mass', labelTr: 'Profil Ağırlık & Metraj', icon: Scale, color: '#8b5cf6', keywords: ['profil', 'agirlik', 'weight', 'aluminum', 'celik'] },
      { id: 'cost-estimator', href: '/cost-estimator', labelEn: 'Manufacturing Cost & Carbon', labelTr: 'İmalat Maliyet & Karbon Ayak İzi', icon: DollarSign, color: '#22c55e', keywords: ['maliyet', 'cost', 'fiyat', 'imalat', 'iscilik', 'carbon'] },
      { id: 'fatigue-analysis', href: '/fatigue-analysis', labelEn: 'Fatigue Life & Reliability (Goodman / Weibull)', labelTr: 'Yorulma Ömrü & Güvenilirlik (Goodman / Weibull)', icon: Activity, color: '#f97316', badge: 'ISO', keywords: ['fatigue', 'yorulma', 'sn egrisi', 'goodman', 'gerilme genligi', 'weibull', 'mtbf', 'reliability', 'ariza'] },
      { id: 'concrete-reinforcement', href: '/concrete-reinforcement', labelEn: 'Reinforced Concrete (Eurocode 2)', labelTr: 'Betonarme Donatı & Kesit (Eurocode 2)', icon: Layers, color: '#64748b', keywords: ['betonarme', 'concrete', 'reinforcement', 'eurocode 2', 'donati'] },
    ],
  },
  {
    id: 'science',
    titleEn: 'SCIENCE, MATH & COMPUTING',
    titleTr: 'BİLİM, MATEMATİK & HESAPLAMA',
    items: [
      { id: 'calculator', href: '/calculator', labelEn: 'Scientific CAS Calculator', labelTr: 'Bilimsel CAS Hesap Makinesi', icon: Calculator, color: '#f59e0b', keywords: ['hesap makinesi', 'calculator', 'matematik', 'fonksiyon'] },
      { id: 'physics-solver', href: '/physics-solver', labelEn: 'Computational Physics & Kinematics', labelTr: 'Hesaplamalı Fizik & Kinematik', icon: Orbit, color: '#06b6d4', keywords: ['fizik', 'physics', 'kinematics', 'hiz', 'ivme', 'atis', 'motion', 'trajectory', 'enerji', 'newton'] },
      { id: 'periodic-table', href: '/periodic-table', labelEn: 'Periodic Table & Chemistry Lab', labelTr: 'Periyodik Tablo & Kimya Laboratuvarı', icon: Atom, color: '#8b5cf6', badge: 'IUPAC', keywords: ['periyodik', 'element', 'atom', 'periodic table', 'kimya', 'chemistry', 'mol', 'stokiyometri', 'reaksiyon', 'enthalpy'] },
    ],
  },
  {
    id: 'reference',
    titleEn: 'STANDARDS & REFERENCE',
    titleTr: 'STANDARTLAR & EL KİTABI',
    items: [
      { id: 'handbook', href: '/handbook', labelEn: 'Standards & Materials Handbook', labelTr: 'Standartlar & Malzeme El Kitabı', icon: BookOpen, color: '#38bdf8', badge: 'REF', keywords: ['el kitabi', 'handbook', 'iso', 'din', 'astm', 'malzeme', 'material', 'ashby'] },
      { id: 'academy', href: '/academy', labelEn: 'Engineering Academy', labelTr: 'Mühendislik Akademisi', icon: GraduationCap, color: '#22c55e', badge: '15U', keywords: ['akademi', 'ders', 'academy', 'quiz', 'egitim'] },
      { id: 'field', href: '/field', labelEn: 'Field Engineering Suite', labelTr: 'Saha Mühendislik Kiti (34 Sensör)', icon: Smartphone, color: '#00e5ff', badge: 'FIELD', keywords: ['saha', 'sensor', 'field', 'jiroskop', 'gps', 'desibel', 'mobil'] },
      { id: 'download-apps', href: '/download', labelEn: 'Mobile & Watch Apps', labelTr: 'Mobil & Saat Uygulamaları (APK)', icon: Smartphone, color: '#38bdf8', badge: 'APK', keywords: ['indir', 'download', 'apk', 'mobil', 'android', 'wear os'] },
    ],
  },
];

export function DesktopSidebar({ topOffsetClass }: { topOffsetClass?: string }) {
  const pathname = usePathname() ?? '';
  const { language } = useI18nStore();
  const c = getChrome(language);

  const [collapsed, setCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');


  const isStudioRoute = useMemo(() => {
    return ['/design-studio', '/cad-editor', '/fea', '/flow', '/sketch-pad', '/nesting-2d'].some(
      (path) => pathname === path || pathname.startsWith(path + '/')
    );
  }, [pathname]);

  // Read collapsed preference from localStorage (never force-collapse behind user's back)
  useEffect(() => {
    try {
      const saved = localStorage.getItem('alucalc_sidebar_collapsed');
      if (saved !== null) {
        setCollapsed(saved === 'true');
      } else {
        setCollapsed(false);
      }
    } catch {}
  }, []);

  const toggleCollapse = () => {
    const next = !collapsed;
    setCollapsed(next);
    try {
      localStorage.setItem('alucalc_sidebar_collapsed', String(next));
    } catch {}
  };

  // Filter items by search query and category
  const filteredGroups = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    
    let groups = ALL_NAV_GROUPS;
    if (selectedCategory !== 'all') {
      groups = groups.filter(g => g.id === selectedCategory);
    }

    if (!q) return groups;

    return groups.map((g) => ({
      ...g,
      items: g.items.filter((it) => {
        const text = `${it.labelEn} ${it.labelTr} ${(it.keywords || []).join(' ')}`.toLowerCase();
        return text.includes(q);
      }),
    })).filter((g) => g.items.length > 0);
  }, [searchQuery, selectedCategory]);

  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!scrollContainerRef.current) return;
    const timer = setTimeout(() => {
      const activeEl = scrollContainerRef.current?.querySelector<HTMLElement>('[data-active="true"]');
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'center', behavior: 'auto' });
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [pathname]);

  return (
    <aside
      className={`hidden md:flex flex-col border-r border-[var(--line)] bg-[var(--bg-1)] transition-all duration-200 select-none z-40 shrink-0 sticky self-start overflow-hidden ${
        topOffsetClass || 'top-0 h-full'
      } ${
        collapsed ? 'w-16' : 'w-[272px]'
      }`}
    >
      {/* ─── SIDEBAR TOP SEARCH & TOGGLE ─── */}
      <div className="flex h-10 items-center justify-between px-3 border-b border-[var(--line)] bg-[var(--bg-0)]">
        {!collapsed ? (
          <div className="flex items-center justify-between w-full gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--alu-dim)]">
                {c.workspace}
              </span>
            </div>
            <button
              type="button"
              onClick={toggleCollapse}
              className="rounded-[var(--radius-s)] p-1 text-[var(--alu-dim)] hover:text-[var(--ink)] hover:bg-[var(--bg-2)] transition-colors shrink-0"
              title={c.collapse}
            >
              <ChevronLeft size={14} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={toggleCollapse}
            className="mx-auto rounded-[var(--radius-s)] p-1 text-[var(--alu-dim)] hover:text-[var(--ink)] hover:bg-[var(--bg-2)] transition-colors"
            title={c.expand}
          >
            <ChevronRight size={15} />
          </button>
        )}
      </div>

      {/* ─── SEARCH BAR & QUICK FILTERS (Visible when Expanded) ─── */}
      {!collapsed && (
        <div className="p-2 border-b border-[var(--line)] bg-[var(--bg-0)] space-y-2">
          {/* Search Input */}
          <div className="relative">
            <Search size={12} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--alu-dim)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={c.searchTools}
              className="w-full rounded-[var(--radius-s)] border border-[var(--line)] bg-[var(--bg-2)] py-1.5 pl-7 pr-3 text-[11px] font-mono text-[var(--ink)] placeholder-[var(--alu-dim)]/60 outline-none focus:border-[var(--cyan)] transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-[var(--alu-dim)] hover:text-[var(--ink)]"
              >
                ✕
              </button>
            )}
          </div>

          {/* Quick Direct Link to All Solvers Catalog */}
          <Link
            href="/calculators"
            className="flex items-center justify-between px-2.5 py-1.5 rounded-[var(--radius-s)] bg-[var(--cyan)]/10 hover:bg-[var(--cyan)]/20 border border-[var(--cyan)]/30 text-[var(--cyan)] text-[11px] font-mono font-bold transition-all group"
          >
            <span className="flex items-center gap-1.5">
              <Calculator size={13} />
              <span>{t12(language, 'Solvers Directory', 'Çözücüler Kataloğu')}</span>
            </span>
            <span className="px-1.5 py-0.2 rounded bg-[var(--bg-3)] border border-[var(--cyan)]/40 text-[9px]">
              {solverCount}
            </span>
          </Link>

          {/* Category Filter Chips */}
          <div className="flex items-center gap-1 overflow-x-auto text-[10px] font-mono scrollbar-none pb-0.5">
            {[
              { id: 'all', labelTr: 'Hepsi', labelEn: 'All' },
              { id: 'mechanical', labelTr: 'Mekanik', labelEn: 'Mech' },
              { id: 'fluids', labelTr: 'Akışkan', labelEn: 'Fluids' },
              { id: 'manufacturing', labelTr: 'İmalat', labelEn: 'Mfg' },
              { id: 'studios', labelTr: 'CAD', labelEn: 'CAD' },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-2 py-0.5 rounded-[var(--radius-s)] border transition-all whitespace-nowrap ${
                  selectedCategory === cat.id
                    ? 'border-[var(--cyan)] bg-[var(--cyan)]/20 text-[var(--cyan)] font-bold'
                    : 'border-[var(--line)] bg-[var(--bg-2)] text-[var(--alu-dim)] hover:text-white'
                }`}
              >
                {language === 'tr' ? cat.labelTr : cat.labelEn}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ─── NAVIGATION SCROLL AREA ─── */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto overscroll-contain px-1.5 py-2 space-y-3 custom-scrollbar">
        {filteredGroups.map((group) => (
          <div key={group.id} className="space-y-0.5">
            {!collapsed && (
              <div className="px-2 py-1 text-[10px] font-mono font-bold tracking-wider text-[var(--alu-dim)] uppercase flex items-center justify-between">
                <span>{getLocalizedNavTitle(group.id, language)}</span>
                <span className="text-[9px] text-[var(--alu-dim)]/60 font-normal">({group.items.length})</span>
              </div>
            )}

            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                const localizedLabel = getLocalizedNavItemLabel(item, language);

                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    data-active={isActive ? 'true' : undefined}
                    title={collapsed ? localizedLabel : undefined}
                    className={`group relative flex items-center gap-2 rounded-[var(--radius-s)] px-2 py-1.5 text-xs transition-colors ${
                      isActive
                        ? 'bg-[var(--bg-3)] text-[var(--cyan)] border-l-2 border-[var(--cyan)] font-bold pl-2.5'
                        : 'text-[var(--alu-dim)] hover:bg-[var(--bg-2)] hover:text-[var(--ink)] border-l-2 border-transparent'
                    }`}
                  >
                    <SidebarAnimatedIcon
                      icon={item.icon}
                      color={isActive ? 'var(--cyan)' : 'var(--alu-dim)'}
                      isActive={isActive}
                      itemId={item.id}
                    />

                    {!collapsed && (
                      <span className="truncate flex-1 font-medium text-[11px] group-hover:text-[var(--ink)] transition-colors">
                        {localizedLabel}
                      </span>
                    )}

                    {!collapsed && item.badge && (
                      <span
                        className={`px-1.5 py-0.5 rounded-[var(--radius-s)] text-[8px] font-mono font-bold uppercase border transition-colors ${
                          isActive
                            ? 'bg-[var(--cyan)]/15 border-[var(--cyan)]/40 text-[var(--cyan)]'
                            : 'bg-[var(--bg-2)] border-[var(--line)] text-[var(--alu-dim)]'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* ─── BOTTOM AEGIS COPILOT & UPWARD EXPANDING BUBBLE ─── */}
      <div className="border-t border-[var(--line)] p-1.5 bg-[var(--bg-0)]">
        <AegisSidebarBubble collapsed={collapsed} />
      </div>
    </aside>
  );
}

export default DesktopSidebar;
