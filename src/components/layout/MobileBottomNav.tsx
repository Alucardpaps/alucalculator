'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutGrid,
  Calculator,
  Menu,
  X,
  Search,
  ChevronRight,
  Sparkles,
  Wrench,
  GraduationCap
} from 'lucide-react';
import { useI18nStore } from '@/store/i18nStore';
import { useCopilotStore } from '@/store/copilotStore';
import { AegisMascot } from '@/components/copilot/AegisMascot';
import { SidebarAnimatedIcon } from '@/components/ui/SidebarAnimatedIcon';
import { AluCalcLogo } from '@/components/ui/AluCalcLogo';
import { ALL_NAV_GROUPS } from './DesktopSidebar';
import { TOTAL_CALCULATORS_LABEL } from '@/config/modules';
import { getLocalizedNavTitle, getLocalizedNavItemLabel } from '@/locales/sidebarTranslations';
import { getChrome } from '@/locales/chromeTranslations';

const CATEGORY_TABS = [
  { id: 'all', labelEn: 'All', labelTr: 'Hepsi' },
  { id: 'studios', labelEn: 'CAD & 3D', labelTr: 'CAD & 3D' },
  { id: 'mechanical', labelEn: 'Mechanical', labelTr: 'Mekanik' },
  { id: 'fluids', labelEn: 'Fluids & Aero', labelTr: 'Akışkan & Termal' },
  { id: 'electrical', labelEn: 'Electrical', labelTr: 'Elektrik' },
  { id: 'civil_materials', labelEn: 'Civil & Mat', labelTr: 'İnşaat & Malzeme' },
  { id: 'science', labelEn: 'Science & CAS', labelTr: 'Bilim & Hesap' },
  { id: 'academy', labelEn: 'Academy & Apps', labelTr: 'Akademi & Saha' },
];

export function MobileBottomNav() {
  const pathname = usePathname() ?? '/';
  const { language } = useI18nStore();
  const c = getChrome(language);
  const { setIsOpen: setCopilotOpen } = useCopilotStore();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);

  // Filter items in drawer
  const filteredGroups = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    
    let groups = ALL_NAV_GROUPS;
    if (activeCategory !== 'all') {
      groups = groups.filter(g => g.id === activeCategory);
    }

    if (!q) return groups;

    return groups.map((g) => ({
      ...g,
      items: g.items.filter((it) => {
        const text = `${it.labelEn} ${it.labelTr} ${(it.keywords || []).join(' ')}`.toLowerCase();
        return text.includes(q);
      }),
    })).filter((g) => g.items.length > 0);
  }, [searchQuery, activeCategory]);

  const totalToolCount = useMemo(() => {
    return ALL_NAV_GROUPS.reduce((acc, g) => acc + g.items.length, 0);
  }, []);

  return (
    <>
      {/* ─── FULL-SCREEN SLIDE-OUT MOBILE SIDEBAR DRAWER ─── */}
      {drawerOpen && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-[#05080e] backdrop-blur-3xl select-none">
          {/* Header */}
          <div className="flex h-14 items-center justify-between px-4 border-b border-white/10 bg-[#03060a]">
            <div className="flex items-center gap-2.5">
              <AluCalcLogo size={26} animate={false} />
              <div className="font-mono text-xs font-black tracking-wider text-white">
                ALUCALC <span className="text-cyan-400">OS MOBILE</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              className="p-2 rounded-xl bg-white/5 text-slate-300 hover:text-white"
              aria-label="Close Drawer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Search Bar & Lite Hub Shortcut */}
          <div className="p-3 border-b border-white/5 bg-black/40 space-y-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={c.searchTools.replace('{n}', String(totalToolCount))}
                className="w-full pl-9 pr-8 py-2 rounded-xl bg-black/60 border border-white/10 text-white text-xs font-mono placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Direct Lite Hub Link Card */}
            <Link
              href="/lite"
              onClick={() => setDrawerOpen(false)}
              className="w-full flex items-center justify-between p-2.5 rounded-xl border border-cyan-500/30 bg-gradient-to-r from-cyan-950/40 to-blue-950/30 text-white"
            >
              <div className="flex items-center gap-2.5">
                <LayoutGrid size={16} className="text-cyan-400" />
                <div>
                  <div className="text-xs font-mono font-bold text-cyan-300">
                    {c.liteHub.replace('{n}', TOTAL_CALCULATORS_LABEL)}
                  </div>
                  <div className="text-[9px] text-slate-400">
                    {c.liteHubSub}
                  </div>
                </div>
              </div>
              <ChevronRight size={16} className="text-cyan-400" />
            </Link>

            {/* Category Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1 pt-1">
              {CATEGORY_TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveCategory(tab.id)}
                  className={`text-[10px] font-mono whitespace-nowrap px-2.5 py-1 rounded-lg border transition-all ${
                    activeCategory === tab.id
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold'
                      : 'bg-white/5 border-white/5 text-slate-400 hover:text-white'
                  }`}
                >
                  {tab.id === 'all' ? c.catAll
                    : tab.id === 'studios' ? c.catStudios
                    : tab.id === 'mechanical' ? c.catMech
                    : tab.id === 'fluids' ? c.catFluids
                    : tab.id === 'electrical' ? c.catElec
                    : tab.id === 'civil_materials' ? c.catCivil
                    : tab.id === 'science' ? c.catScience
                    : c.catAcademy}
                </button>
              ))}
            </div>
          </div>

          {/* Categorized Nav List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-28 custom-scrollbar">
            {filteredGroups.map((group) => (
              <div key={group.id} className="space-y-2">
                <div className="flex items-center justify-between text-[10px] font-mono font-black tracking-wider text-cyan-400 uppercase">
                  <span>{getLocalizedNavTitle(group.id, language)}</span>
                  <span className="text-[9px] text-slate-500">({group.items.length})</span>
                </div>

                <div className="grid grid-cols-1 gap-1.5">
                  {group.items.map((item) => {
                    const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                    const isItemHovered = hoveredItemId === item.id;

                    return (
                      <Link
                        key={item.id}
                        href={item.href}
                        onClick={() => setDrawerOpen(false)}
                        onMouseEnter={() => setHoveredItemId(item.id)}
                        onMouseLeave={() => setHoveredItemId(null)}
                        className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                          isActive
                            ? 'bg-cyan-500/15 border-cyan-400 text-white font-bold'
                            : 'bg-white/[0.02] border-white/5 text-slate-300 hover:bg-white/[0.06]'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Frameless Bespoke Animated SVG Icon */}
                          <div className="w-7 h-7 flex items-center justify-center shrink-0">
                            <SidebarAnimatedIcon
                              id={item.id}
                              size={22}
                              isHovered={isItemHovered || isActive}
                              color={item.color}
                              fallbackIcon={item.icon}
                            />
                          </div>
                          <span className="text-xs font-medium truncate">{getLocalizedNavItemLabel(item, language)}</span>
                        </div>

                        {item.badge && (
                          <span
                            className="px-1.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase shrink-0"
                            style={{
                              backgroundColor: `${item.color || '#00e5ff'}15`,
                              color: item.color || '#00e5ff',
                              borderColor: `${item.color || '#00e5ff'}30`,
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

          {/* Bottom AeGiS Trigger in Drawer */}
          <div className="fixed bottom-0 inset-x-0 p-3 border-t border-white/10 bg-[#03060a] z-10">
            <button
              type="button"
              onClick={() => {
                setDrawerOpen(false);
                setCopilotOpen(true);
              }}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-cyan-950/60 via-[#0a1424] to-blue-950/60 border border-cyan-500/30 text-white active:scale-98 transition-transform"
            >
              <div className="flex items-center gap-3">
                <AegisMascot size={32} variant="face" pose="auto" />
                <div className="text-left">
                  <div className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                    <span>AeGiS AI Copilot</span>
                    <Sparkles size={12} className="text-cyan-400 animate-pulse" />
                  </div>
                  <div className="text-[10px] text-slate-400">{c.copilotSub}</div>
                </div>
              </div>
              <ChevronRight size={16} className="text-cyan-400" />
            </button>
          </div>
        </div>
      )}

      {/* ─── NATIVE FIXED MOBILE BOTTOM DOCK (7 ITEMS) ─── */}
      <div className="sm:hidden fixed bottom-2 inset-x-2 z-50 pointer-events-auto select-none safe-area-pb">
        <nav className="relative flex items-center justify-between rounded-2xl border border-white/15 bg-[#090c14]/95 p-1 shadow-[0_12px_40px_rgba(0,0,0,0.9)] backdrop-blur-2xl">
          {/* 1. Dashboard */}
          <Link
            href="/"
            onClick={() => setDrawerOpen(false)}
            className={`flex flex-1 flex-col items-center justify-center py-1 rounded-xl transition-all active:scale-90 ${
              pathname === '/' ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <LayoutGrid size={17} className={pathname === '/' ? 'stroke-[2.4]' : 'stroke-[1.8]'} />
            <span className="text-[8px] font-mono font-bold uppercase tracking-tight mt-1 leading-none">
              {c.dash}
            </span>
          </Link>

          {/* 2. Solvers / Lite Hub */}
          <Link
            href="/lite"
            onClick={() => setDrawerOpen(false)}
            className={`flex flex-1 flex-col items-center justify-center py-1 rounded-xl transition-all active:scale-90 ${
              pathname === '/lite' || pathname.startsWith('/calculators')
                ? 'text-cyan-400 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Calculator size={17} className={pathname === '/lite' || pathname.startsWith('/calculators') ? 'stroke-[2.4]' : 'stroke-[1.8]'} />
            <span className="text-[8px] font-mono font-bold uppercase tracking-tight mt-1 leading-none">
              {c.solvers}
            </span>
          </Link>

          {/* 3. Academy */}
          <Link
            href="/academy"
            onClick={() => setDrawerOpen(false)}
            className={`flex flex-1 flex-col items-center justify-center py-1 rounded-xl transition-all active:scale-90 ${
              pathname.startsWith('/academy') ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <GraduationCap size={17} className={pathname.startsWith('/academy') ? 'stroke-[2.4]' : 'stroke-[1.8]'} />
            <span className="text-[8px] font-mono font-bold uppercase tracking-tight mt-1 leading-none">
              {c.academy}
            </span>
          </Link>

          {/* 4. CAD (Elevated Centerpiece with Animated Logo) */}
          <Link
            href="/design-studio"
            onClick={() => setDrawerOpen(false)}
            className="relative -top-2 flex flex-1 flex-col items-center justify-center active:scale-90 transition-transform"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-slate-950 shadow-[0_0_20px_rgba(0,229,255,0.6)]">
              <AluCalcLogo size={24} animate={false} />
            </div>
            <span className="text-[8px] font-mono font-black uppercase text-cyan-300 mt-0.5 tracking-tight leading-none">
              CAD
            </span>
          </Link>

          {/* 5. Field */}
          <Link
            href="/field"
            onClick={() => setDrawerOpen(false)}
            className={`flex flex-1 flex-col items-center justify-center py-1 rounded-xl transition-all active:scale-90 ${
              pathname.startsWith('/field') ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Wrench size={17} className={pathname.startsWith('/field') ? 'stroke-[2.4]' : 'stroke-[1.8]'} />
            <span className="text-[8px] font-mono font-bold uppercase tracking-tight mt-1 leading-none">
              {c.field}
            </span>
          </Link>

          {/* 6. AeGiS AI Copilot */}
          <button
            type="button"
            onClick={() => {
              setDrawerOpen(false);
              setCopilotOpen(true);
            }}
            className="flex flex-1 flex-col items-center justify-center py-1 rounded-xl transition-all active:scale-90 text-slate-400 hover:text-white"
          >
            <AegisMascot size={20} variant="face" pose="auto" />
            <span className="text-[8px] font-mono font-bold uppercase tracking-tight mt-1 leading-none">
              AeGiS
            </span>
          </button>

          {/* 7. Settings / Sidebar Drawer (All 60+ Tools) */}
          <button
            type="button"
            onClick={() => setDrawerOpen(!drawerOpen)}
            className={`flex flex-1 flex-col items-center justify-center py-1 rounded-xl transition-all active:scale-90 ${
              drawerOpen ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Menu size={17} className={drawerOpen ? 'stroke-[2.4]' : 'stroke-[1.8]'} />
            <span className="text-[8px] font-mono font-bold uppercase tracking-tight mt-1 leading-none">
              {c.menu}
            </span>
          </button>
        </nav>
      </div>
    </>
  );
}

export default MobileBottomNav;
