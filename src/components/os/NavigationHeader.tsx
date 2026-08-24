'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  LayoutGrid, Box, ChevronDown, Award
} from 'lucide-react';
import { useI18nStore } from '@/store/i18nStore';
import { FlagIcon } from '@/components/ui/FlagIcon';

const LANGUAGE_LIST = [
  { id: 'en', label: 'English', native: 'English' },
  { id: 'tr', label: 'Turkish', native: 'Türkçe' },
  { id: 'de', label: 'German', native: 'Deutsch' },
  { id: 'fr', label: 'French', native: 'Français' },
  { id: 'es', label: 'Spanish', native: 'Español' },
  { id: 'it', label: 'Italian', native: 'Italiano' },
  { id: 'ja', label: 'Japanese', native: '日本語' },
  { id: 'zh', label: 'Chinese', native: '中文' },
];

export function NavigationHeader() {
  const { language, setLanguage } = useI18nStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const isTr = language === 'tr';
  const currentLang = LANGUAGE_LIST.find((l) => l.id === language) ?? LANGUAGE_LIST[0];

  return (
    <nav className="sticky top-0 z-50 w-full shrink-0 border-b border-white/[0.07] bg-[#0a0c12]/92 backdrop-blur-xl">
      <div className="mx-auto flex h-12 max-w-[1400px] items-center justify-between gap-2 px-3 sm:px-4 md:px-6">
        {/* Brand & Left Navigation */}
        <div className="flex min-w-0 items-center gap-3 sm:gap-5">
          <Link href="/" className="flex shrink-0 items-center gap-2">
            <div className="h-7 w-7 rounded-md border border-white/10 bg-[#6b9fff]/10 flex items-center justify-center">
              <Box size={16} className="text-[#6b9fff]" />
            </div>
            <span className="text-[13px] font-bold tracking-tight text-white">AluCalc</span>
          </Link>

          <div className="hidden items-center gap-3 sm:flex">
            <Link
              href="/academy/"
              className="inline-flex items-center gap-1 text-[11px] font-semibold transition-colors text-white/60 hover:text-white"
            >
              <Award size={13} className="text-amber-400/90" />
              <span>{isTr ? 'Akademi' : 'Academy'}</span>
            </Link>

            <Link
              href="/lite/"
              className="inline-flex items-center gap-1 text-[11px] font-semibold transition-colors text-white/60 hover:text-white"
            >
              <LayoutGrid size={13} className="text-purple-400/90" />
              <span>Lite</span>
            </Link>

            <Link
              href="/pricing/"
              className="hidden lg:inline text-[11px] font-semibold transition-colors text-white/60 hover:text-white"
            >
              <span>{isTr ? 'Fiyatlandırma' : 'Pricing'}</span>
            </Link>
          </div>
        </div>

        {/* Right Actions (Clean Language Selector) */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Language Selector Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              title={currentLang.native}
              aria-label={`Language: ${currentLang.native}`}
              className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1.5 hover:bg-white/[0.06] transition-colors"
            >
              <FlagIcon lang={currentLang.id} className="h-3.5 w-5 rounded-sm object-cover" />
              <ChevronDown
                size={11}
                className={`text-white/35 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {dropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
                <div className="absolute right-0 mt-2 z-50 bg-[#0c101a] border border-white/15 rounded-xl shadow-2xl p-1.5 grid grid-cols-2 gap-1 min-w-[190px]">
                  {LANGUAGE_LIST.map((lang) => (
                    <button
                      key={lang.id}
                      type="button"
                      onClick={() => {
                        setLanguage(lang.id as any);
                        setDropdownOpen(false);
                      }}
                      className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-all ${
                        language === lang.id
                          ? 'bg-[#6b9fff]/20 text-[#6b9fff] font-bold border border-[#6b9fff]/30'
                          : 'text-slate-300 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <FlagIcon lang={lang.id} className="h-3 w-4 rounded-sm object-cover" />
                      <span>{lang.native}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
