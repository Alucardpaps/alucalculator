'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  LayoutGrid, Box, ChevronDown, Award, Menu, X, Sparkles, Smartphone, Download, Cuboid
} from 'lucide-react';
import { useI18nStore } from '@/store/i18nStore';
import { FlagIcon } from '@/components/ui/FlagIcon';
import { getChrome } from '@/locales/chromeTranslations';

const LANGUAGE_LIST = [
  { id: 'en', label: 'English', native: 'English' },
  { id: 'tr', label: 'Turkish', native: 'Türkçe' },
  { id: 'de', label: 'German', native: 'Deutsch' },
  { id: 'fr', label: 'French', native: 'Français' },
  { id: 'es', label: 'Spanish', native: 'Español' },
  { id: 'it', label: 'Italian', native: 'Italiano' },
  { id: 'pt', label: 'Portuguese', native: 'Português' },
  { id: 'ru', label: 'Russian', native: 'Русский' },
  { id: 'zh', label: 'Chinese', native: '中文' },
  { id: 'ja', label: 'Japanese', native: '日本語' },
  { id: 'ko', label: 'Korean', native: '한국어' },
  { id: 'ar', label: 'Arabic', native: 'العربية' },
];

import { useShareUiStore } from '@/share/shareUiStore';
import { Upload, MessageSquare } from 'lucide-react';

import { AluCalcLogo } from '@/components/ui/AluCalcLogo';

export function NavigationHeader() {
  const { language, setLanguage } = useI18nStore();
  const { openImportModal, openFeedbackModal } = useShareUiStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const c = getChrome(language);
  const currentLang = LANGUAGE_LIST.find((l) => l.id === language) ?? LANGUAGE_LIST[0];

  return (
    <nav className="sticky top-0 z-50 w-full shrink-0 border-b border-white/[0.07] bg-[#0a0c12]/92 backdrop-blur-xl">
      <div className="mx-auto flex h-12 max-w-[1400px] items-center justify-between gap-2 px-3 sm:px-4 md:px-6">
        {/* Brand & Left Navigation */}
        <div className="flex min-w-0 items-center gap-3 sm:gap-5">
          <Link href="/" className="flex shrink-0 items-center gap-2 group">
            <AluCalcLogo size={26} />
            <span className="text-[13px] font-bold tracking-tight text-white group-hover:text-cyan-300 transition-colors">AluCalc</span>
          </Link>

          <div className="hidden items-center gap-3 sm:flex">
            <Link
              href="/academy/"
              className="inline-flex items-center gap-1 text-[11px] font-semibold transition-colors text-white/60 hover:text-white"
            >
              <Award size={13} className="text-amber-400/90" />
              <span>{c.academy}</span>
            </Link>

            <Link
              href="/design-studio/"
              className="inline-flex items-center gap-1 text-[11px] font-semibold transition-colors text-white/60 hover:text-white"
            >
              <Cuboid size={13} className="text-cyan-400/90" />
              <span>{c.studio3d}</span>
            </Link>

            <Link
              href="/lite/"
              className="inline-flex items-center gap-1 text-[11px] font-semibold transition-colors text-white/60 hover:text-white"
            >
              <LayoutGrid size={13} className="text-purple-400/90" />
              <span>{c.lite}</span>
            </Link>

            <Link
              href="/pricing/"
              className="hidden lg:inline text-[11px] font-semibold transition-colors text-white/60 hover:text-white"
            >
              <span>{c.pricing}</span>
            </Link>
          </div>
        </div>

        {/* Right Actions (AluShare, Feedback, Language Selector & Mobile Hamburger) */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* AluShare Quick Actions */}
          <button
            type="button"
            onClick={openImportModal}
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 transition-all active:scale-95"
            title={c.importTitle}
          >
            <Upload size={12} className="text-cyan-400" />
            <span>{c.import}</span>
          </button>

          <button
            type="button"
            onClick={openFeedbackModal}
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-all active:scale-95"
            title={c.feedbackTitle}
          >
            <MessageSquare size={12} className="text-amber-400" />
            <span>{c.feedback}</span>
          </button>
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
                <div className="absolute right-0 mt-2 z-50 bg-[#0c101a] border border-white/15 rounded-xl shadow-2xl p-1.5 grid grid-cols-2 sm:grid-cols-3 gap-1 min-w-[280px] animate-in fade-in zoom-in-95 font-mono">
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
                      <FlagIcon lang={lang.id} className="h-3 w-4 rounded-sm object-cover shrink-0" />
                      <span className="truncate">{lang.native}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Mobile Menu Hamburger Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="sm:hidden p-1.5 rounded-lg border border-white/10 bg-white/[0.03] text-slate-300 hover:text-white hover:bg-white/10 transition"
            aria-label="Toggle Mobile Navigation"
          >
            {mobileMenuOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-t border-white/10 bg-[#080c14]/98 p-4 space-y-2 animate-in slide-in-from-top-2">
          <Link
            href="/academy/"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/5 text-white text-xs font-bold hover:bg-white/10 transition"
          >
            <Award size={16} className="text-amber-400" />
            <span>{c.academyLong}</span>
          </Link>

          <Link
            href="/design-studio/"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/5 text-white text-xs font-bold hover:bg-white/10 transition"
          >
            <Cuboid size={16} className="text-cyan-400" />
            <span>{c.studioLong}</span>
          </Link>

          <Link
            href="/field/"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/5 text-white text-xs font-bold hover:bg-white/10 transition"
          >
            <Smartphone size={16} className="text-emerald-400" />
            <span>{c.fieldLong}</span>
          </Link>

          <Link
            href="/lite/"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/5 text-white text-xs font-bold hover:bg-white/10 transition"
          >
            <LayoutGrid size={16} className="text-purple-400" />
            <span>{c.liteLong}</span>
          </Link>

          <Link
            href="/download/"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/5 text-white text-xs font-bold hover:bg-white/10 transition"
          >
            <Download size={16} className="text-sky-400" />
            <span>{c.downloadLong}</span>
          </Link>

          <Link
            href="/pricing/"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/5 text-white text-xs font-bold hover:bg-white/10 transition"
          >
            <Sparkles size={16} className="text-rose-400" />
            <span>{c.pricingLong}</span>
          </Link>
        </div>
      )}
    </nav>
  );
}
