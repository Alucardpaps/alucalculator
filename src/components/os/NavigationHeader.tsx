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
    <nav className="sticky top-0 z-50 w-full shrink-0 border-b border-[var(--line)] bg-[var(--bg-1)]/95 backdrop-blur-md">
      <div className="mx-auto flex h-[52px] max-w-[1400px] items-center justify-between gap-2 px-3 sm:px-4 md:px-6">
        {/* Brand & Left Navigation */}
        <div className="flex min-w-0 items-center gap-3 sm:gap-6">
          <Link href="/" className="flex shrink-0 items-center gap-2.5 group">
            <AluCalcLogo size={24} />
            <span className="text-[13px] font-mono font-bold tracking-tight text-[var(--ink)] group-hover:text-[var(--cyan)] transition-colors uppercase">AluCalc</span>
          </Link>

          <div className="hidden items-center gap-3 sm:flex font-mono text-[11px]">
            <Link
              href="/academy/"
              className="inline-flex items-center gap-1.5 font-medium transition-colors text-[var(--alu-dim)] hover:text-[var(--ink)]"
            >
              <Award size={13} className="text-[var(--warn)]" />
              <span>{c.academy}</span>
            </Link>

            <Link
              href="/design-studio/"
              className="inline-flex items-center gap-1.5 font-medium transition-colors text-[var(--alu-dim)] hover:text-[var(--ink)]"
            >
              <Cuboid size={13} className="text-[var(--cyan)]" />
              <span>{c.studio3d}</span>
            </Link>

            <Link
              href="/lite/"
              className="inline-flex items-center gap-1.5 font-medium transition-colors text-[var(--alu-dim)] hover:text-[var(--ink)]"
            >
              <LayoutGrid size={13} className="text-[var(--std)]" />
              <span>{c.lite}</span>
            </Link>

            <Link
              href="/pricing/"
              className="hidden lg:inline font-medium transition-colors text-[var(--alu-dim)] hover:text-[var(--ink)]"
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
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--radius-s)] text-[11px] font-mono font-bold bg-[var(--cyan)]/10 hover:bg-[var(--cyan)]/20 text-[var(--cyan)] border border-[var(--cyan)]/30 transition-colors"
            title={c.importTitle}
          >
            <Upload size={12} className="text-[var(--cyan)]" />
            <span>{c.import}</span>
          </button>

          <button
            type="button"
            onClick={openFeedbackModal}
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--radius-s)] text-[11px] font-mono font-bold bg-[var(--bg-2)] hover:bg-[var(--bg-3)] text-[var(--alu)] hover:text-white border border-[var(--line)] transition-colors"
            title={c.feedbackTitle}
          >
            <MessageSquare size={12} className="text-[var(--warn)]" />
            <span>{c.feedback}</span>
          </button>
          {/* Language Selector Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              title={currentLang.native}
              aria-label={`Language: ${currentLang.native}`}
              className="flex items-center gap-1.5 rounded-[var(--radius-s)] border border-[var(--line)] bg-[var(--bg-2)] px-2 py-1 hover:border-[var(--line-strong)] transition-colors"
            >
              <FlagIcon lang={currentLang.id} className="h-3.5 w-5 rounded-[2px] object-cover" />
              <ChevronDown
                size={11}
                className={`text-[var(--alu-dim)] transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {dropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
                <div className="absolute right-0 mt-1.5 z-50 bg-[var(--bg-1)] border border-[var(--line)] rounded-[var(--radius-m)] shadow-2xl p-1.5 grid grid-cols-2 sm:grid-cols-3 gap-1 min-w-[280px] font-mono">
                  {LANGUAGE_LIST.map((lang) => (
                    <button
                      key={lang.id}
                      type="button"
                      onClick={() => {
                        setLanguage(lang.id as any);
                        setDropdownOpen(false);
                      }}
                      className={`flex items-center gap-2 px-2.5 py-1.5 rounded-[var(--radius-s)] text-xs transition-colors ${
                        language === lang.id
                          ? 'bg-[var(--cyan)]/15 text-[var(--cyan)] font-bold border border-[var(--cyan)]/30'
                          : 'text-[var(--alu-dim)] hover:bg-[var(--bg-3)] hover:text-[var(--ink)]'
                      }`}
                    >
                      <FlagIcon lang={lang.id} className="h-3 w-4 rounded-[2px] object-cover shrink-0" />
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
            className="sm:hidden p-1.5 rounded-[var(--radius-s)] border border-[var(--line)] bg-[var(--bg-2)] text-[var(--alu)] hover:text-white transition-colors"
            aria-label="Toggle Mobile Navigation"
          >
            {mobileMenuOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-t border-[var(--line)] bg-[var(--bg-1)] p-4 space-y-2">
          <Link
            href="/academy/"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2.5 p-2.5 rounded-[var(--radius-s)] bg-[var(--bg-2)] border border-[var(--line)] text-[var(--ink)] text-xs font-mono font-bold hover:bg-[var(--bg-3)] transition-colors"
          >
            <Award size={16} className="text-[var(--warn)]" />
            <span>{c.academyLong}</span>
          </Link>

          <Link
            href="/design-studio/"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2.5 p-2.5 rounded-[var(--radius-s)] bg-[var(--bg-2)] border border-[var(--line)] text-[var(--ink)] text-xs font-mono font-bold hover:bg-[var(--bg-3)] transition-colors"
          >
            <Cuboid size={16} className="text-[var(--cyan)]" />
            <span>{c.studioLong}</span>
          </Link>

          <Link
            href="/field/"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2.5 p-2.5 rounded-[var(--radius-s)] bg-[var(--bg-2)] border border-[var(--line)] text-[var(--ink)] text-xs font-mono font-bold hover:bg-[var(--bg-3)] transition-colors"
          >
            <Smartphone size={16} className="text-[var(--ok)]" />
            <span>{c.fieldLong}</span>
          </Link>

          <Link
            href="/lite/"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2.5 p-2.5 rounded-[var(--radius-s)] bg-[var(--bg-2)] border border-[var(--line)] text-[var(--ink)] text-xs font-mono font-bold hover:bg-[var(--bg-3)] transition-colors"
          >
            <LayoutGrid size={16} className="text-[var(--std)]" />
            <span>{c.liteLong}</span>
          </Link>

          <Link
            href="/download/"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2.5 p-2.5 rounded-[var(--radius-s)] bg-[var(--bg-2)] border border-[var(--line)] text-[var(--ink)] text-xs font-mono font-bold hover:bg-[var(--bg-3)] transition-colors"
          >
            <Download size={16} className="text-[var(--cyan)]" />
            <span>{c.downloadLong}</span>
          </Link>

          <Link
            href="/pricing/"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2.5 p-2.5 rounded-[var(--radius-s)] bg-[var(--bg-2)] border border-[var(--line)] text-[var(--ink)] text-xs font-mono font-bold hover:bg-[var(--bg-3)] transition-colors"
          >
            <Sparkles size={16} className="text-[var(--warn)]" />
            <span>{c.pricingLong}</span>
          </Link>
        </div>
      )}
    </nav>
  );
}
