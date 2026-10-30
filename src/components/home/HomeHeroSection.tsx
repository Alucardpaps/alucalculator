'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Box,
  Pencil,
  ArrowRight,
  Calculator,
  Search,
  Sparkles,
} from 'lucide-react';
import { useI18nStore } from '@/store/i18nStore';
import { t12 } from '@/locales/t12';
import { AegisHeroCard } from '@/components/home/AegisHeroCard';
import { solverCount } from '@/lib/registry/calculatorRegistry';

export interface QuickSolverItem {
  id: string;
  labelTr: string;
  labelEn: string;
  std: string;
  href: string;
  keys: string[];
}

export const POPULAR_QUICK_SOLVERS: QuickSolverItem[] = [
  { id: 'welding', labelTr: '🔥 Kaynak Mukavemet, CEV & Maliyet', labelEn: '🔥 Welding Strength, CEV & Cost', std: 'EN 1993 / EC9 / AWS', href: '/welding/', keys: ['kaynak', 'welding', 'weld', 'fillet', 'butt', 'cev', 'aws d1.1', 'eurocode 9'] },
  { id: 'bolt-torque', labelTr: '🔩 Cıvata Torku, K-Faktörü & PCD', labelEn: '🔩 Bolt Torque, K-Factor & PCD', std: 'VDI 2230 / ISO 898', href: '/bolt-torque/', keys: ['civata', 'tork', 'bolt', 'torque', 'vdi 2230', 'm12', 'm16', 'pcd'] },
  { id: 'alloy-2024-t3', labelTr: '✈️ 2024-T3 Alüminyum & Ağırlık', labelEn: '✈️ 2024-T3 Aluminum & Weight', std: 'ASTM B209 (ρ=2.78)', href: '/materials/2024-t3/', keys: ['2024', '2024-t3', 'aluminyum', 'aluminum', 'ucak', 'aerospace', 'density'] },
  { id: 'materials-hub', labelTr: '🧪 Malzeme & Alaşım Seçici (1xxx–7xxx)', labelEn: '🧪 Materials & Alloy Hub (1xxx–7xxx)', std: 'EN 573 / 15 Alloys', href: '/materials/', keys: ['malzeme', 'alasim', 'materials', '6061', '7075', '5083', 'agirlik'] },
  { id: 'bearings', labelTr: 'Rulman Ömrü (L10h)', labelEn: 'Bearing Life (L10h)', std: 'ISO 281', href: '/bearings', keys: ['rulman', 'bearing', 'skf', 'l10', 'iso 281'] },
  { id: 'gears', labelTr: 'Dişli Mukavemeti', labelEn: 'Gear Strength Rating', std: 'ISO 6336', href: '/gears', keys: ['disli', 'gear', 'modul', 'iso 6336'] },
  { id: 'shaft-design', labelTr: 'Mil Yorulma Analizi', labelEn: 'Shaft Fatigue Sizing', std: 'DIN 743', href: '/shafts/', keys: ['mil', 'shaft', 'din 743', 'burulma'] },
  { id: 'beam', labelTr: 'Kiriş Sehim & Moment', labelEn: 'Beam Deflection & Stress', std: 'EN 1993', href: '/beam-deflection', keys: ['kiris', 'sehim', 'beam', 'eurocode'] },
  { id: 'fits', labelTr: 'ISO Tolerans & Geçmeler', labelEn: 'ISO Limits & Fits (H7/g6)', std: 'ISO 286', href: '/fits', keys: ['tolerans', 'gecme', 'fits', 'h7', 'iso 286'] },
  { id: 'sheet-metal', labelTr: 'Sac Büküm & K-Faktörü', labelEn: 'Sheet Metal Bend & K-Factor', std: 'DIN 6935', href: '/sheet-metal', keys: ['sac', 'bukum', 'sheet', 'bend', 'din 6935'] },
  { id: 'fluid-dynamics', labelTr: 'Boru Basınç Kaybı', labelEn: 'Pipe Pressure Drop', std: 'ISO 80000', href: '/fluid-dynamics', keys: ['boru', 'pipe', 'akiskan', 'darcy', 'reynolds'] },
];

export function HomeHeroSection() {
  const { language } = useI18nStore();
  const [heroSearch, setHeroSearch] = useState('');

  const searchResults = useMemo(() => {
    const q = heroSearch.toLowerCase().trim();
    if (!q) return [];
    return POPULAR_QUICK_SOLVERS.filter((item) => {
      const matchText = `${item.labelTr} ${item.labelEn} ${item.std} ${item.keys.join(' ')}`.toLowerCase();
      return matchText.includes(q);
    });
  }, [heroSearch]);

  return (
    <section className="relative w-full pt-4 sm:pt-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* LEFT 7 COLUMNS: SERENE ARTISTIC WELCOME & CLEAR ENTRY */}
        <div className="lg:col-span-7 p-6 sm:p-8 xl:p-9 rounded-[var(--radius-m)] bg-[var(--bg-1)] border border-[var(--line-strong)] shadow-2xl flex flex-col justify-between space-y-5 xl:space-y-6 relative overflow-hidden">
          {/* Subtle Architectural Drafting Lines (Vitruvian Golden Proportion) */}
          <svg
            className="pointer-events-none absolute right-0 top-0 h-full w-1/2 opacity-[0.07]"
            viewBox="0 0 400 400"
            fill="none"
          >
            <circle cx="320" cy="200" r="180" stroke="#00e5ff" strokeWidth="1" />
            <circle cx="320" cy="200" r="111" stroke="#f59e0b" strokeWidth="1" strokeDasharray="4 4" />
            <line x1="140" y1="200" x2="400" y2="200" stroke="#00e5ff" strokeWidth="1" />
            <line x1="320" y1="20" x2="320" y2="380" stroke="#00e5ff" strokeWidth="1" />
          </svg>

          <div className="relative z-10 space-y-4">
            {/* Calm Overline Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-[var(--radius-s)] bg-[var(--bg-0)] border border-[var(--line)] text-[10.5px] font-mono font-bold uppercase tracking-[0.16em] text-[var(--cyan)]">
              <Sparkles size={12} className="text-[var(--warn)]" />
              <span>
                {t12(
                  language,
                  'PRECISION CAD & ENGINEERING ATELIER',
                  'HASSAS MÜHENDİSLİK VE 3B TASARIM ATÖLYESİ'
                )}
              </span>
            </div>

            {/* Artistic High-Contrast Headline */}
            <h1 className="text-2xl sm:text-3xl xl:text-[38px] 2xl:text-[42px] font-bold font-tech tracking-tight text-[var(--ink)] leading-[1.14]">
              {t12(
                language,
                'The Art of Deterministic ',
                'Mühendislik Hesabının ve '
              )}
              <span className="text-[var(--cyan)]">
                {t12(
                  language,
                  '3D CAD & Engineering.',
                  '3B Tasarımın Sanatsal Hali.'
                )}
              </span>
            </h1>

            {/* Calm, Concise Description */}
            <p className="text-xs sm:text-sm text-[var(--alu)] leading-relaxed max-w-2xl">
              {t12(
                language,
                `Model parametric 3D assemblies, draft 2D technical drawings, and run ${solverCount} normative ISO, DIN, and VDI engineering calculations in a single, distraction-free workspace.`,
                `Karmaşadan uzak, sade bir çalışma alanında 3B parametrik montajlar tasarlayın, 2B teknik çizim yapın ve ${solverCount} adet standart ISO, DIN ve VDI mühendislik hesabını anında doğrulayın.`
              )}
            </p>

            {/* 3 Unmistakable Primary Action Buttons */}
            <div data-tour="home-cta-bar" className="flex flex-wrap items-center gap-3 pt-1">
              <Link
                href="/design-studio"
                className="inline-flex items-center justify-center gap-2.5 h-11 px-5 rounded-[var(--radius-s)] bg-[var(--cyan)] text-[var(--bg-0)] font-mono text-xs sm:text-sm font-bold uppercase tracking-wider hover:brightness-110 transition-all shadow-lg"
              >
                <Box size={15} />
                <span>{t12(language, 'Open 3D CAD Studio', '3B Tasarım Stüdyosunu Aç')}</span>
                <ArrowRight size={14} />
              </Link>

              <Link
                href="/calculators"
                className="inline-flex items-center justify-center gap-2 h-11 px-4.5 rounded-[var(--radius-s)] bg-[var(--bg-2)] hover:bg-[var(--bg-3)] border border-[var(--line-strong)] hover:border-[var(--cyan)] text-[var(--ink)] font-mono text-xs sm:text-sm font-bold uppercase transition-colors"
              >
                <Calculator size={15} className="text-[var(--cyan)]" />
                <span>{t12(language, `${solverCount} Engineering Solvers`, `${solverCount} Mühendislik Çözücüsü`)}</span>
              </Link>

              <Link
                href="/cad-editor"
                className="inline-flex items-center justify-center gap-2 h-11 px-4.5 rounded-[var(--radius-s)] bg-[var(--bg-0)] hover:bg-[var(--bg-2)] border border-[var(--line)] hover:border-[var(--ok)] text-[var(--alu)] hover:text-[var(--ink)] font-mono text-xs sm:text-sm font-bold uppercase transition-colors"
              >
                <Pencil size={14} className="text-[var(--ok)]" />
                <span>{t12(language, '2D AluCAD', '2B Çizim')}</span>
              </Link>
            </div>
          </div>

          {/* Clean Search Bar & 5 Essential Shortcuts */}
          <div data-tour="home-search" className="relative z-10 pt-5 border-t border-[var(--line)] space-y-3">
            <div className="relative">
              <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--cyan)]" />
              <input
                type="text"
                value={heroSearch}
                onChange={(e) => setHeroSearch(e.target.value)}
                placeholder={t12(
                  language,
                  'What would you like to calculate? (e.g. M12 bolt, 6205 bearing, gear, beam)...',
                  'Ne hesaplamak istiyorsunuz? (Örn: M12 cıvata, rulman, dişli, kiriş, tolerans)...'
                )}
                className="w-full h-11 pl-11 pr-9 rounded-[var(--radius-s)] bg-[var(--bg-0)] border border-[var(--line-strong)] text-xs sm:text-sm font-mono text-[var(--ink)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--cyan)] transition-colors"
              />
              {heroSearch && (
                <button
                  type="button"
                  onClick={() => setHeroSearch('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer"
                >
                  ✕
                </button>
              )}

              {/* Instant Search Dropdown */}
              {heroSearch && searchResults.length > 0 && (
                <div className="absolute top-12 left-0 right-0 z-30 rounded-[var(--radius-s)] bg-[var(--bg-1)] border border-[var(--cyan)] p-2 shadow-2xl space-y-1 font-mono text-xs">
                  {searchResults.map((item) => (
                    <Link
                      key={item.id}
                      href={item.href}
                      onClick={() => setHeroSearch('')}
                      className="flex items-center justify-between p-2.5 rounded-[2px] hover:bg-[var(--bg-2)] text-[var(--ink)] hover:text-[var(--cyan)] transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Calculator size={14} className="text-[var(--cyan)]" />
                        <span className="font-bold">{language === 'tr' ? item.labelTr : item.labelEn}</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-[2px] bg-[var(--bg-3)] border border-[var(--line)] text-[var(--std)]">
                        {item.std}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* 5 Calm Quick-Start Chips */}
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
              <span className="text-[10px] uppercase tracking-wider text-[var(--muted)] font-bold">
                {t12(language, 'Quick Start:', 'Hızlı Başlangıç:')}
              </span>
              {POPULAR_QUICK_SOLVERS.slice(0, 5).map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className="px-2.5 py-1 rounded-[var(--radius-s)] bg-[var(--bg-0)] hover:bg-[var(--bg-2)] border border-[var(--line)] hover:border-[var(--cyan)] text-[var(--alu)] hover:text-[var(--ink)] transition-colors text-[11px]"
                >
                  {language === 'tr' ? item.labelTr : item.labelEn}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT 5 COLUMNS: THE ARTISTIC AEGIS AUTOMATON STAGE */}
        <div className="lg:col-span-5 flex">
          <AegisHeroCard />
        </div>
      </div>
    </section>
  );
}

export default HomeHeroSection;
