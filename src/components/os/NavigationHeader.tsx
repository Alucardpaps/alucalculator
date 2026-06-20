'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Hexagon, Calculator, ChevronDown } from 'lucide-react';
import { useI18nStore } from '@/store/i18nStore';
import { getSiteNav, LANGUAGE_OPTIONS } from '@/locales/siteNav';
import { FlagIcon } from '@/components/ui/FlagIcon';

export function NavigationHeader() {
  const { language, setLanguage } = useI18nStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const nav = getSiteNav(language);
  const currentLang = LANGUAGE_OPTIONS.find((l) => l.id === language) ?? LANGUAGE_OPTIONS[0];

  return (
    <nav className="sticky top-0 z-50 border-b border-white/5 backdrop-blur-3xl bg-[#010204]/80 w-full shrink-0">
      <div className="max-w-7xl mx-auto px-6 md:px-8 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-4 group">
          <div className="w-10 h-10 flex items-center justify-center rounded-2xl bg-[#0a0f18] border border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.1)] group-hover:scale-105 transition-all">
            <Hexagon size={22} className="text-blue-400 group-hover:text-blue-300 group-hover:rotate-[60deg] transition-all duration-700" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-lg font-black tracking-tighter text-white uppercase">AluCalc OS</span>
            <span className="text-[7px] font-black tracking-[0.5em] uppercase text-blue-500/40 mt-1">{nav.tagline}</span>
          </div>
        </Link>

        <div className="flex items-center gap-6 md:gap-10">
          <Link href="/academy" className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors">
            {nav.academy}
          </Link>

          <div className="relative">
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              title={currentLang.native}
              aria-label={`Language: ${currentLang.native}`}
              className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
            >
              <FlagIcon lang={currentLang.id} className="w-5 h-3.5 object-cover rounded-sm" />
              <ChevronDown size={12} className={`text-slate-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            {dropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
                <div className="absolute right-0 mt-2 z-50 bg-[#0a0f18] border border-white/10 rounded-xl shadow-2xl p-2 grid grid-cols-4 gap-1.5 min-w-[168px]">
                  {LANGUAGE_OPTIONS.map((lang) => (
                    <button
                      key={lang.id}
                      type="button"
                      title={lang.native}
                      aria-label={lang.native}
                      onClick={() => {
                        setLanguage(lang.id);
                        setDropdownOpen(false);
                      }}
                      className={`flex items-center justify-center p-2 rounded-lg transition-all ${
                        language === lang.id
                          ? 'bg-[#00e5ff]/15 ring-1 ring-[#00e5ff]/40 scale-105'
                          : 'hover:bg-white/5 opacity-80 hover:opacity-100'
                      }`}
                    >
                      <FlagIcon lang={lang.id} className="w-5 h-3.5 object-cover rounded-sm" />
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <Link
            href="/workspace"
            className="px-6 py-2.5 rounded-xl bg-blue-700 text-white text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 shadow-xl shadow-blue-500/10 transition-all flex items-center gap-3"
          >
            <Calculator size={14} /> {nav.launchWorkspace}
          </Link>
        </div>
      </div>
    </nav>
  );
}
