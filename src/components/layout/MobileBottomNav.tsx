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
        <div className="fixed inset-0 z-[100] flex flex-col bg-[var(--bg-0)] backdrop-blur-3xl select-none font-mono">
          {/* Header */}
          <div className="flex h-14 items-center justify-between px-4 border-b border-[var(--line)] bg-[var(--bg-1)]">
            <div className="flex items-center gap-2.5">
              <AluCalcLogo size={24} animate={false} />
              <div className="font-mono text-xs font-bold tracking-wider text-[var(--ink)] uppercase">
                ALUCALC <span className="text-[var(--cyan)]">WORKSPACE</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              className="p-1.5 rounded-[var(--radius-s)] bg-[var(--bg-2)] border border-[var(--line)] text-[var(--alu-dim)] hover:text-white"
              aria-label="Close Drawer"
            >
              <X size={16} />
            </button>
          </div>

          {/* Search Bar & Lite Hub Shortcut */}
          <div className="p-3 border-b border-[var(--line)] bg-[var(--bg-1)] space-y-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--alu-dim)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={c.searchTools.replace('{n}', String(totalToolCount))}
                className="w-full pl-9 pr-8 py-2 rounded-[var(--radius-s)] bg-[var(--bg-2)] border border-[var(--line)] text-[var(--ink)] text-xs font-mono placeholder-[var(--alu-dim)]/50 focus:outline-none focus:border-[var(--cyan)]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-[var(--alu-dim)] hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Direct Lite Hub Link Card */}
            <Link
              href="/lite"
              onClick={() => setDrawerOpen(false)}
              className="w-full flex items-center justify-between p-2.5 rounded-[var(--radius-s)] border border-[var(--line)] bg-[var(--bg-2)] text-[var(--ink)] hover:border-[var(--cyan)] transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <LayoutGrid size={16} className="text-[var(--cyan)]" />
                <div>
                  <div className="text-xs font-mono font-bold text-[var(--cyan)]">
                    {c.liteHub.replace('{n}', TOTAL_CALCULATORS_LABEL)}
                  </div>
                  <div className="text-[9px] text-[var(--alu-dim)]">
                    {c.liteHubSub}
                  </div>
                </div>
              </div>
              <ChevronRight size={15} className="text-[var(--cyan)]" />
            </Link>

            {/* Category Filter Chips */}
            <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar pb-0.5 pt-0.5">
              {CATEGORY_TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveCategory(tab.id)}
                  className={`text-[10px] font-mono whitespace-nowrap px-2.5 py-1 rounded-[var(--radius-s)] border transition-colors ${
                    activeCategory === tab.id
                      ? 'bg-[var(--cyan)]/15 border-[var(--cyan)]/40 text-[var(--cyan)] font-bold'
                      : 'bg-[var(--bg-2)] border-[var(--line)] text-[var(--alu-dim)] hover:text-white'
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
          <div className="flex-1 overflow-y-auto p-3 space-y-4 pb-28 custom-scrollbar">
            {filteredGroups.map((group) => (
              <div key={group.id} className="space-y-1">
                <div className="flex items-center justify-between text-[10px] font-mono font-bold tracking-wider text-[var(--alu-dim)] uppercase px-1">
                  <span>{getLocalizedNavTitle(group.id, language)}</span>
                  <span className="text-[9px] text-[var(--alu-dim)]/50">({group.items.length})</span>
                </div>

                <div className="grid grid-cols-1 gap-1">
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
                        className={`flex items-center justify-between p-2 rounded-[var(--radius-s)] border transition-colors ${
                          isActive
                            ? 'bg-[var(--bg-3)] border-[var(--cyan)] text-[var(--cyan)] font-bold'
                            : 'bg-[var(--bg-1)] border-[var(--line)] text-[var(--alu)] hover:bg-[var(--bg-2)]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-6 h-6 flex items-center justify-center shrink-0">
                            <SidebarAnimatedIcon
                              itemId={item.id}
                              color={item.color}
                              isActive={isActive || isItemHovered}
                              icon={item.icon}
                            />
                          </div>
                          <span className="text-xs font-mono font-medium truncate">{getLocalizedNavItemLabel(item, language)}</span>
                        </div>

                        {item.badge && (
                          <span
                            className="px-1.5 py-0.5 rounded-[var(--radius-s)] text-[8px] font-mono font-bold uppercase shrink-0"
                            style={{
                              backgroundColor: `${item.color || 'var(--cyan)'}15`,
                              color: item.color || 'var(--cyan)',
                              borderColor: `${item.color || 'var(--cyan)'}30`,
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
          <div className="fixed bottom-0 inset-x-0 p-3 border-t border-[var(--line)] bg-[var(--bg-1)] z-10 font-mono">
            <button
              type="button"
              onClick={() => {
                setDrawerOpen(false);
                setCopilotOpen(true);
              }}
              className="w-full flex items-center justify-between p-2.5 rounded-[var(--radius-s)] bg-[var(--bg-2)] border border-[var(--line)] text-[var(--ink)] hover:border-[var(--cyan)] transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <AegisMascot size={28} variant="face" pose="auto" />
                <div className="text-left">
                  <div className="text-xs font-bold text-[var(--cyan)] flex items-center gap-1.5">
                    <span>AeGiS AI Copilot</span>
                    <Sparkles size={11} className="text-[var(--cyan)]" />
                  </div>
                  <div className="text-[10px] text-[var(--alu-dim)]">{c.copilotSub}</div>
                </div>
              </div>
              <ChevronRight size={15} className="text-[var(--cyan)]" />
            </button>
          </div>
        </div>
      )}

      {/* ─── NATIVE FIXED MOBILE BOTTOM DOCK (7 ITEMS) ─── */}
      <div className="sm:hidden fixed bottom-2 inset-x-2 z-50 pointer-events-auto select-none safe-area-pb">
        <nav className="relative flex items-center justify-between rounded-[var(--radius-m)] border border-[var(--line)] bg-[var(--bg-1)]/95 p-1 shadow-2xl backdrop-blur-xl">
          {/* 1. Dashboard */}
          <Link
            href="/"
            onClick={() => setDrawerOpen(false)}
            className={`flex flex-1 flex-col items-center justify-center py-1 rounded-[var(--radius-s)] transition-colors ${
              pathname === '/' ? 'text-[var(--cyan)] font-bold' : 'text-[var(--alu-dim)] hover:text-white'
            }`}
          >
            <LayoutGrid size={16} className={pathname === '/' ? 'stroke-[2.4]' : 'stroke-[1.8]'} />
            <span className="text-[8px] font-mono font-bold uppercase tracking-tight mt-1 leading-none">
              {c.dash}
            </span>
          </Link>

          {/* 2. Solvers / Lite Hub */}
          <Link
            href="/lite"
            onClick={() => setDrawerOpen(false)}
            className={`flex flex-1 flex-col items-center justify-center py-1 rounded-[var(--radius-s)] transition-colors ${
              pathname === '/lite' || pathname.startsWith('/calculators')
                ? 'text-[var(--cyan)] font-bold'
                : 'text-[var(--alu-dim)] hover:text-white'
            }`}
          >
            <Calculator size={16} className={pathname === '/lite' || pathname.startsWith('/calculators') ? 'stroke-[2.4]' : 'stroke-[1.8]'} />
            <span className="text-[8px] font-mono font-bold uppercase tracking-tight mt-1 leading-none">
              {c.solvers}
            </span>
          </Link>

          {/* 3. Academy */}
          <Link
            href="/academy"
            onClick={() => setDrawerOpen(false)}
            className={`flex flex-1 flex-col items-center justify-center py-1 rounded-[var(--radius-s)] transition-colors ${
              pathname.startsWith('/academy') ? 'text-[var(--cyan)] font-bold' : 'text-[var(--alu-dim)] hover:text-white'
            }`}
          >
            <GraduationCap size={16} className={pathname.startsWith('/academy') ? 'stroke-[2.4]' : 'stroke-[1.8]'} />
            <span className="text-[8px] font-mono font-bold uppercase tracking-tight mt-1 leading-none">
              {c.academy}
            </span>
          </Link>

          {/* 4. CAD / Workspace */}
          <Link
            href="/design-studio"
            onClick={() => setDrawerOpen(false)}
            className="flex flex-1 flex-col items-center justify-center py-1 rounded-[var(--radius-s)] transition-colors text-[var(--cyan)]"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-s)] bg-[var(--cyan)] text-[var(--bg-0)]">
              <AluCalcLogo size={16} animate={false} />
            </div>
            <span className="text-[8px] font-mono font-bold uppercase text-[var(--cyan)] mt-0.5 tracking-tight leading-none">
              CAD
            </span>
          </Link>

          {/* 5. Field */}
          <Link
            href="/field"
            onClick={() => setDrawerOpen(false)}
            className={`flex flex-1 flex-col items-center justify-center py-1 rounded-[var(--radius-s)] transition-colors ${
              pathname.startsWith('/field') ? 'text-[var(--cyan)] font-bold' : 'text-[var(--alu-dim)] hover:text-white'
            }`}
          >
            <Wrench size={16} className={pathname.startsWith('/field') ? 'stroke-[2.4]' : 'stroke-[1.8]'} />
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
            className="flex flex-1 flex-col items-center justify-center py-1 rounded-[var(--radius-s)] transition-colors text-[var(--alu-dim)] hover:text-white"
          >
            <AegisMascot size={18} variant="face" pose="auto" />
            <span className="text-[8px] font-mono font-bold uppercase tracking-tight mt-1 leading-none">
              AeGiS
            </span>
          </button>

          {/* 7. Settings / Sidebar Drawer */}
          <button
            type="button"
            onClick={() => setDrawerOpen(!drawerOpen)}
            className={`flex flex-1 flex-col items-center justify-center py-1 rounded-[var(--radius-s)] transition-colors ${
              drawerOpen ? 'text-[var(--cyan)] font-bold' : 'text-[var(--alu-dim)] hover:text-white'
            }`}
          >
            <Menu size={16} className={drawerOpen ? 'stroke-[2.4]' : 'stroke-[1.8]'} />
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
