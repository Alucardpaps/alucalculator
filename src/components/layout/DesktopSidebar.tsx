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
  LayoutGrid,
  Cable,
  Database
} from 'lucide-react';
import { useI18nStore } from '@/store/i18nStore';

import { AegisSidebarBubble } from '@/components/copilot/AegisSidebarBubble';
import { SidebarAnimatedIcon } from '@/components/ui/SidebarAnimatedIcon';
import { TOTAL_CALCULATORS_LABEL } from '@/config/modules';
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
    titleTr: 'CAD & MÜHENDİSLİK STÜDYOLARI',
    items: [
      { id: 'design-studio', href: '/design-studio', labelEn: 'Parametric Part Configurator (3D Preview)', labelTr: 'Parametrik Parça Konfigüratörü (3D Önizleme)', icon: Box, color: '#00e5ff', badge: '3D', keywords: ['3d', 'stl', 'parametric', 'configurator', 'preview', 'solid'] },
      { id: 'cad-editor', href: '/cad-editor', labelEn: '2D AluCAD Drafting', labelTr: '2D AluCAD Çizim', icon: Pencil, color: '#a855f7', badge: '2D', keywords: ['2d', 'dxf', 'autocad', 'dwg', 'cizim', 'paper'] },
      { id: 'fea-studio', href: '/fea', labelEn: 'FEA Linear Static v1', labelTr: 'FEA Doğrusal Statik v1', icon: Activity, color: '#ef4444', badge: 'v1', keywords: ['fea', 'stress', 'linear', 'static', 'simulation', 'gerilme', 'von mises', 'beam', 'bracket', 'plate'] },
      { id: 'nesting', href: '/nesting-2d', labelEn: '2D Sheet Nesting', labelTr: '2D Plaka Yerleşim', icon: Scissors, color: '#f59e0b', keywords: ['nesting', 'cut', 'yerlesim', 'plaka'] },
      { id: 'cutting', href: '/cutting-optimizer', labelEn: '1D Linear Cut Optimizer', labelTr: '1D Profil Kesim Opt.', icon: Scissors, color: '#f97316', keywords: ['cutting', '1d', 'linear', 'kesim', 'profil'] },
      { id: 'sketch-pad', href: '/sketch-pad', labelEn: 'Technical Sketch Pad', labelTr: 'Mühendislik Şema Tahtası', icon: PenTool, color: '#eab308', keywords: ['sketch', 'pad', 'cizim', 'sema', 'excalidraw'] },
    ],
  },
  {
    id: 'mechanical',
    titleEn: 'MECHANICAL SOLVERS (ISO / DIN)',
    titleTr: 'MEKANİK HESAPLAYICILAR',
    items: [
      { id: 'bolt-torque', href: '/bolt-torque', labelEn: 'Bolt Torque (VDI 2230)', labelTr: 'Cıvata Torku & Ön Yük', icon: Wrench, color: '#f59e0b', keywords: ['civata', 'tork', 'bolt', 'torque', 'vdi 2230', 'iso 898'] },
      { id: 'bearings', href: '/bearings', labelEn: 'Bearing Life (ISO 281)', labelTr: 'Rulman Ömrü (ISO 281)', icon: CircleDot, color: '#3b82f6', keywords: ['rulman', 'bearing', 'skf', 'l10', 'iso 281'] },
      { id: 'gears', href: '/gears', labelEn: 'Gear Design (ISO 6336)', labelTr: 'Dişli Tasarımı (ISO 6336)', icon: Cog, color: '#00e5ff', keywords: ['disli', 'gear', 'pinion', 'spur', 'iso 6336'] },
      { id: 'planetary-gearbox', href: '/planetary-gearbox', labelEn: 'Planetary Gearbox Solver', labelTr: 'Planet Redüktör Hesabı', icon: Cog, color: '#06b6d4', badge: 'PLANET', keywords: ['planet', 'planetary', 'gearbox', 'reduktor', 'gunes', 'uydu'] },
      { id: 'gearbox-design', href: '/gearbox-design', labelEn: 'Gearbox Design Engine', labelTr: 'Redüktör Tasarım Motoru', icon: Cog, color: '#8b5cf6', keywords: ['gearbox', 'reduktor', 'tasarim', 'mil', 'shafts'] },
      { id: 'reducer-lubrication', href: '/reducer-lubrication', labelEn: 'Gearbox Thermal & Lube', labelTr: 'Redüktör Yağlama & Termal', icon: Droplets, color: '#38bdf8', keywords: ['yaglama', 'lube', 'viskozite', 'thermal', 'reducer'] },
      { id: 'chain-drive', href: '/chain-drive', labelEn: 'Roller Chain (ISO 606)', labelTr: 'Makaralı Zincir Mekanizması', icon: Activity, color: '#6366f1', keywords: ['zincir', 'chain', 'sprocket', 'iso 606'] },
      { id: 'belt-drive', href: '/belt-drive', labelEn: 'Belt Drive (ISO 5291)', labelTr: 'Kayış-Kasnak Mekanizması', icon: Sliders, color: '#f97316', keywords: ['kayis', 'kasnak', 'belt', 'pulley', 'v-belt'] },
      { id: 'sheet-metal', href: '/sheet-metal', labelEn: 'Sheet Metal & Bend', labelTr: 'Sac Büküm & Açınım', icon: Split, color: '#ec4899', keywords: ['sac', 'bukum', 'sheet metal', 'bend', 'k factor', 'din 6935'] },
      { id: 'spring-design', href: '/advanced-spring', labelEn: 'Helical Spring Design', labelTr: 'Helisel Yay Hesabı', icon: Disc, color: '#14b8a6', keywords: ['yay', 'spring', 'helical', 'wahl'] },
      { id: 'shafts', href: '/shafts', labelEn: 'Shaft Sizing & Reactions', labelTr: 'Mil Boyutlandırma & Mesnet Tepkileri', icon: Disc, color: '#06b6d4', keywords: ['mil', 'shaft', 'shafts', 'tepki', 'torsion', 'burulma'] },
      { id: 'motor-selection', href: '/motor-selection-std', labelEn: 'Motor Selection Engine', labelTr: 'Motor Seçim Motoru', icon: Zap, color: '#f59e0b', keywords: ['motor', 'motor secimi', 'kw', 'hp', 'rpm', 'tork'] },
      { id: 'beam-deflection', href: '/beam-deflection', labelEn: 'Beam Deflection Analysis', labelTr: 'Kiriş Sehim Analizi', icon: Layers, color: '#22c55e', keywords: ['kiris', 'sehim', 'beam', 'deflection', 'moment'] },
      { id: 'fits-tolerances', href: '/fits-tolerances', labelEn: 'Fits & Tolerances (ISO 286)', labelTr: 'Toleranslar & Geçmeler', icon: Compass, color: '#eab308', keywords: ['tolerans', 'gecme', 'fits', 'iso 286', 'h7'] },
      { id: 'welding', href: '/welding', labelEn: 'Welding & Joint Stress', labelTr: 'Kaynak Mukavemeti & Dikiş', icon: Flame, color: '#ef4444', keywords: ['kaynak', 'weld', 'joint', 'throat'] },
      { id: 'fasteners', href: '/fasteners', labelEn: 'Thread Geometry & Fasteners', labelTr: 'Cıvata & Diş Standartları', icon: Wrench, color: '#f59e0b', keywords: ['civata', 'vida', 'thread', 'fastener', 'somun'] },
      { id: 'machining-details', href: '/machining-details', labelEn: 'Machining Speeds & Feeds', labelTr: 'Talaşlı İmalat Kesme Hızları', icon: Scissors, color: '#a855f7', keywords: ['talasli', 'machining', 'feed', 'speed', 'torna', 'freze'] },
      { id: 'profile-weight', href: '/profile-weight', labelEn: 'Profile Weight & Mass', labelTr: 'Profil Ağırlık & Metraj', icon: Scale, color: '#8b5cf6', keywords: ['profil', 'agirlik', 'weight', 'aluminum', 'celik'] },
      { id: 'hardness-converter', href: '/hardness-converter', labelEn: 'Hardness & Tensile Converter', labelTr: 'Sertlik & Çekme Dönüştürücü', icon: Layers, color: '#10b981', keywords: ['sertlik', 'hardness', 'hrc', 'hb', 'vickers', 'tensile'] },
      { id: 'fatigue-analysis', href: '/fatigue-analysis', labelEn: 'Fatigue Life (Goodman)', labelTr: 'Yorulma Ömrü Analizi', icon: Activity, color: '#ef4444', keywords: ['yorulma', 'fatigue', 'goodman', 'sn curve', 'omur'] },
      { id: 'column-buckling', href: '/column-buckling', labelEn: 'Column Buckling (Euler)', labelTr: 'Kolon Burkulma Analizi', icon: Layers, color: '#eab308', keywords: ['burkulma', 'buckling', 'euler', 'kolon'] },
      { id: 'vibration', href: '/vibration', labelEn: 'Vibration & Isolation', labelTr: 'Titreşim & İzolasyon', icon: Waves, color: '#06b6d4', keywords: ['titresim', 'vibration', 'damping', 'frekans', 'izolasyon'] },
    ],
  },
  {
    id: 'fluids',
    titleEn: 'THERMAL, FLUID & AERO-MARINE',
    titleTr: 'TERMAL, AKIŞKAN & DENİZCİLİK',
    items: [
      { id: 'fluid-dynamics', href: '/fluid-dynamics', labelEn: 'Fluid Dynamics Suite', labelTr: 'Akışkanlar Mekaniği', icon: Droplets, color: '#00e5ff', keywords: ['akiskan', 'fluid', 'bernoulli', 'reynolds', 'debi'] },
      { id: 'pipe-friction', href: '/pipe-friction', labelEn: 'Pipe Friction (Darcy)', labelTr: 'Boru Sürtünme & Basınç Kaybı', icon: Droplets, color: '#06b6d4', keywords: ['boru', 'pipe', 'darcy', 'friction', 'surtunme', 'kayip'] },
      { id: 'pressure-vessel', href: '/pressure-vessel', labelEn: 'ASME Pressure Vessel', labelTr: 'Basınçlı Kap Mukavemeti', icon: CircleSlash, color: '#3b82f6', keywords: ['basincli kap', 'pressure vessel', 'asme', 'kazan'] },
      { id: 'pumps', href: '/pumps', labelEn: 'Pump Flow & Head', labelTr: 'Pompa Basma Yüksekliği & Debi', icon: Droplets, color: '#14b8a6', keywords: ['pompa', 'pump', 'head', 'npsh', 'debi'] },
      { id: 'heat-sink', href: '/heat-sink', labelEn: 'Heat Sink Thermal', labelTr: 'Soğutucu Termal Direnç', icon: Flame, color: '#f97316', keywords: ['sogutucu', 'heat sink', 'termal', 'thermal resistance', 'rth'] },
      { id: 'hvac-load', href: '/hvac-load', labelEn: 'HVAC Load Estimation', labelTr: 'İklimlendirme & Isı Yükü', icon: Wind, color: '#10b981', keywords: ['hvac', 'isi yuku', 'cooling', 'heating', 'klima'] },
      { id: 'naval-hydrostatics', href: '/naval-hydrostatics', labelEn: 'Naval Hydrostatics', labelTr: 'Gemi Hidrostatiği & Stabilite', icon: Anchor, color: '#0284c7', keywords: ['gemi', 'naval', 'hydrostatic', 'batma', 'stabilite', 'deniz'] },
      { id: 'thermal-expansion', href: '/thermal-expansion', labelEn: 'Thermal Expansion', labelTr: 'Termal Genleşme', icon: Thermometer, color: '#f43f5e', keywords: ['termal', 'genlesme', 'sicaklik', 'heat', 'expansion'] },
    ],
  },
  {
    id: 'electrical',
    titleEn: 'ELECTRICAL & DIGITAL ELECTRONICS',
    titleTr: 'ELEKTRİK & DİJİTAL ELEKTRONİK',
    items: [
      { id: '3-phase-power', href: '/three-phase-power', labelEn: '3-Phase Power Workstation', labelTr: '3 Faz Güç & Akım Hesabı', icon: Zap, color: '#eab308', keywords: ['elektrik', '3 faz', 'power', 'akim', 'motor', 'cos phi'] },
      { id: 'ohms-law', href: '/ohms-law', labelEn: "Ohm's Law & Power", labelTr: 'Ohm Kanunu & Güç Hesabı', icon: Zap, color: '#f59e0b', keywords: ['ohm', 'voltaj', 'akim', 'direnc', 'power'] },
      { id: 'voltage-drop', href: '/voltage-drop', labelEn: 'Voltage Drop & Cable Sizing', labelTr: 'Gerilim Düşümü & Kablo Kesiti', icon: Cable, color: '#6366f1', keywords: ['gerilim dusumu', 'voltage drop', 'kablo kesiti', 'cable'] },
      { id: 'filter-design', href: '/filter-design', labelEn: 'Filter Design Engine', labelTr: 'Elektronik Filtre Tasarımı', icon: Activity, color: '#a855f7', keywords: ['filtre', 'filter', 'low pass', 'high pass', 'rc', 'lc'] },
    ],
  },
  {
    id: 'civil_materials',
    titleEn: 'CIVIL, MATERIALS & AI',
    titleTr: 'İNŞAAT, MALZEME & YAPAY ZEKA',
    items: [
      { id: 'concrete-reinforcement', href: '/concrete-reinforcement', labelEn: 'RC Concrete Reinforcement', labelTr: 'Betonarme Donatı & Kiriş', icon: Layers, color: '#f59e0b', keywords: ['betonarme', 'concrete', 'rebar', 'donati', 'kiris'] },
      { id: 'materials-db', href: '/materials-db', labelEn: 'Materials Database', labelTr: 'Malzeme Özellikleri Veritabanı', icon: Database, color: '#38bdf8', keywords: ['malzeme', 'material', 'aluminyum', 'celik', 'titanyum'] },
      { id: 'cost-estimator', href: '/cost-estimator', labelEn: 'Manufacturing Cost Estimator', labelTr: 'İmalat Maliyet Hesaplayıcı', icon: DollarSign, color: '#22c55e', keywords: ['maliyet', 'cost', 'fiyat', 'imalat', 'iscilik'] },
    ],
  },
  {
    id: 'science',
    titleEn: 'SCIENCE, MATH & COMPUTING',
    titleTr: 'BİLİM, MATEMATİK & HESAPLAMA',
    items: [
      { id: 'periodic-table', href: '/periodic-table', labelEn: 'Interactive Periodic Table', labelTr: 'İnteraktif Periyodik Tablo', icon: Atom, color: '#00e5ff', keywords: ['periyodik tablo', 'element', 'kimya', 'periodic table'] },
      { id: 'unit-converter', href: '/unit-converter', labelEn: 'Engineering Unit Converter', labelTr: 'Mühendislik Birim Dönüştürücü', icon: ArrowLeftRight, color: '#10b981', keywords: ['birim', 'unit', 'donusturucu', 'inch', 'mm', 'bar', 'psi'] },
      { id: 'calculator', href: '/calculator', labelEn: 'Scientific CAS Calculator', labelTr: 'Bilimsel Hesap Makinesi', icon: Calculator, color: '#f59e0b', keywords: ['hesap makinesi', 'calculator', 'matematik', 'fonksiyon'] },
    ],
  },
  {
    id: 'academy',
    titleEn: 'ACADEMY, FIELD & APPS',
    titleTr: 'AKADEMİ, SAHA & UYGULAMALAR',
    items: [
      { id: 'field', href: '/field', labelEn: 'Field Engineering Suite (24 Tools)', labelTr: 'Saha Sensör Kiti (24 Araç)', icon: Smartphone, color: '#00e5ff', badge: '24 TOOL', keywords: ['saha', 'sensor', 'field', 'jiroskop', 'gps', 'desibel', 'fener', 'mobil'] },
      { id: 'download-apps', href: '/download', labelEn: 'Mobile & Watch APK', labelTr: 'Mobil & Saat APK İndir', icon: Smartphone, color: '#38bdf8', badge: 'APK', keywords: ['apk', 'android', 'wear os', 'saat', 'mobil', 'download', 'indir'] },
      { id: 'academy', href: '/academy', labelEn: 'Engineering Academy', labelTr: 'Mühendislik Akademisi', icon: GraduationCap, color: '#22c55e', badge: '15U', keywords: ['akademi', 'ders', 'academy', 'duolingo', 'quiz', 'sertifika'] },
      { id: 'handbook', href: '/handbook', labelEn: 'Standards Handbook', labelTr: 'Standartlar El Kitabı', icon: BookOpen, color: '#94a3b8', keywords: ['el kitabi', 'handbook', 'iso', 'din', 'astm'] },
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


  // Read collapsed preference from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('alucalc_sidebar_collapsed');
      if (saved !== null) {
        setCollapsed(saved === 'true');
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

  const totalToolCount = useMemo(() => {
    return ALL_NAV_GROUPS.reduce((acc, g) => acc + g.items.length, 0);
  }, []);

  return (
    <aside
      className={`hidden lg:flex flex-col border-r border-white/10 bg-[#05080e]/95 backdrop-blur-2xl transition-all duration-300 select-none z-40 shrink-0 sticky self-start overflow-hidden ${
        topOffsetClass || 'top-12 h-[calc(100vh-3rem)]'
      } ${
        collapsed ? 'w-16' : 'w-72'
      }`}
    >
      {/* ─── SIDEBAR TOP SEARCH & TOGGLE ─── */}
      <div className="flex h-11 items-center justify-between px-2.5 border-b border-white/5 bg-[#03060a]">
        {!collapsed ? (
          <div className="flex items-center justify-between w-full gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400">
                {c.workspace}
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-white/5 border border-white/10 text-cyan-400 font-bold">
                {totalToolCount}
              </span>
            </div>
            <button
              type="button"
              onClick={toggleCollapse}
              className="rounded-lg p-1 text-slate-400 hover:text-white hover:bg-white/5 transition-colors shrink-0"
              title={c.collapse}
            >
              <ChevronLeft size={14} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={toggleCollapse}
            className="mx-auto rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            title={c.expand}
          >
            <ChevronRight size={15} />
          </button>
        )}
      </div>

      {/* ─── SEARCH BAR & QUICK FILTERS (Visible when Expanded) ─── */}
      {!collapsed && (
        <div className="p-2 border-b border-white/5 bg-[#070b12]/50 space-y-2">
          <div className="relative">
            <Search size={13} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={c.searchTools.replace('{n}', String(totalToolCount))}
              className="w-full rounded-xl border border-white/10 bg-black/40 py-1.5 pl-8 pr-3 text-[11px] font-mono text-slate-200 placeholder-slate-500 outline-none focus:border-cyan-400 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

          {/* Featured / Lite Hub Direct Shortcut */}
          <Link
            href="/lite"
            className={`w-full group flex items-center justify-between px-2.5 py-1.5 rounded-xl border transition-all ${
              pathname === '/lite'
                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 font-bold shadow-[0_0_15px_rgba(0,229,255,0.15)]'
                : 'bg-gradient-to-r from-cyan-950/30 to-blue-950/20 border-cyan-500/20 text-slate-300 hover:border-cyan-400/60 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 group-hover:scale-115 group-hover:rotate-12 transition-all duration-300">
                <LayoutGrid size={13} className="transition-transform duration-300 group-hover:scale-110" />
              </div>
              <span className="text-[11px] font-mono font-bold tracking-tight">
                {c.liteHub.replace('{n}', TOTAL_CALCULATORS_LABEL)}
              </span>
            </div>
            <span className="text-[8px] font-mono font-black uppercase px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              GRID
            </span>
          </Link>
        </div>
      )}

      {/* ─── NAVIGATION SCROLL AREA ─── */}
      <div className="flex-1 overflow-y-auto overscroll-contain px-2 py-3 space-y-4 custom-scrollbar">
        {filteredGroups.map((group) => (
          <div key={group.id} className="space-y-1">
            {!collapsed && (
              <div className="px-2 py-1.5 text-[9px] font-mono font-black tracking-wider text-slate-500 uppercase flex items-center justify-between">
                <span>{getLocalizedNavTitle(group.id, language)}</span>
                <span className="text-[8px] text-slate-600 font-normal">({group.items.length})</span>
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
                    title={collapsed ? localizedLabel : undefined}
                    className={`group relative flex items-center gap-2 rounded-xl px-2 py-1.5 text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-[0_0_15px_rgba(0,229,255,0.1)] font-black'
                        : 'text-slate-400 hover:bg-white/5 hover:text-slate-200 border border-transparent'
                    }`}
                  >
                    <SidebarAnimatedIcon
                      icon={item.icon}
                      color={item.color}
                      isActive={isActive}
                      itemId={item.id}
                    />

                    {!collapsed && (
                      <span className="truncate flex-1 font-medium text-[11px] group-hover:text-white transition-colors">
                        {localizedLabel}
                      </span>
                    )}

                    {!collapsed && item.badge && (
                      <span
                        className="px-1.5 py-0.5 rounded text-[8px] font-mono font-black uppercase"
                        style={{
                          backgroundColor: `${item.color || '#00e5ff'}15`,
                          borderColor: `${item.color || '#00e5ff'}30`,
                          color: item.color || '#00e5ff',
                          borderWidth: '1px'
                        }}
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
      <div className="border-t border-white/5 p-2 bg-[#03060a]">
        <AegisSidebarBubble collapsed={collapsed} />
      </div>
    </aside>
  );
}

export default DesktopSidebar;
