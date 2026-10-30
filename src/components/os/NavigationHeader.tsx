'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3, Box, Calculator, ChevronDown, Compass, Download, Factory, GraduationCap, Menu, MessageSquare,
  Pencil, Search, Settings2, Sparkles, Upload, Workflow, X, Gamepad2,
} from 'lucide-react';
import { useI18nStore } from '@/store/i18nStore';
import { t12 } from '@/locales/t12';
import { FlagIcon } from '@/components/ui/FlagIcon';
import { getChrome } from '@/locales/chromeTranslations';
import { useOSStore } from '@/store/osStore';
import { solverCount } from '@/lib/registry/calculatorRegistry';
import { useShareUiStore } from '@/share/shareUiStore';
import { AluCalcLogo, AluWordmark } from '@/components/ui/AluCalcLogo';
import { ThemePicker, ThemeGrid } from '@/components/settings/ThemePicker';
import { useAIReady } from '@/lib/ai/aiSettingsStore';

const LANGUAGE_LIST = [
  { id: 'en', native: 'English' },
  { id: 'tr', native: 'Türkçe' },
  { id: 'de', native: 'Deutsch' },
  { id: 'fr', native: 'Français' },
  { id: 'es', native: 'Español' },
  { id: 'it', native: 'Italiano' },
  { id: 'pt', native: 'Português' },
  { id: 'ru', native: 'Русский' },
  { id: 'zh', native: '中文' },
  { id: 'ja', native: '日本語' },
  { id: 'ko', native: '한국어' },
  { id: 'ar', native: 'العربية' },
];

const FONT_STEPS = [
  { id: 'small', label: '90%' },
  { id: 'medium', label: '100%' },
  { id: 'large', label: '115%' },
  { id: 'xlarge', label: '130%' },
  { id: 'auto', label: 'Auto' },
] as const;

const PRECISION_STEPS = [2, 3, 4, 6, 8];

function openPalette() {
  if (typeof window !== 'undefined' && typeof (window as any).__openPalette === 'function') {
    (window as any).__openPalette();
  } else {
    window.dispatchEvent(new CustomEvent('alucalc:open-command-palette'));
    useOSStore.getState().openCommandPalette();
  }
}

function openCopilot() {
  window.dispatchEvent(new CustomEvent('alucalc:open-copilot'));
}

/** Click-outside + Escape for a popover. */
function usePopover() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);
  return { open, setOpen, ref };
}

const navLink =
  'h-8 items-center gap-1.5 whitespace-nowrap rounded-[var(--radius-s)] px-2.5 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:[box-shadow:var(--focus-ring)]';
const iconBtn =
  'inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius-s)] border border-[var(--line)] bg-[var(--bg-2)] text-[var(--alu)] transition-colors hover:border-[var(--line-strong)] hover:text-[var(--ink)] focus-visible:outline-none focus-visible:[box-shadow:var(--focus-ring)]';
const menuPanel =
  'absolute right-0 top-[calc(100%+6px)] z-[200] rounded-[var(--radius-m)] border border-[var(--line)] bg-[var(--bg-2)] p-1 [box-shadow:var(--shadow-2)]';
const menuItem =
  'flex w-full items-center gap-2.5 rounded-[var(--radius-s)] px-2.5 py-2 text-left text-sm text-[var(--alu)] hover:bg-[var(--hover)] hover:text-[var(--ink)]';

export function NavigationHeader() {
  const pathname = usePathname() ?? '/';
  const { language, setLanguage } = useI18nStore();
  const { fontSize, setFontSize, decimalPrecision, setDecimalPrecision } = useOSStore();
  const { openImportModal, openFeedbackModal } = useShareUiStore();
  const aiReady = useAIReady();
  const [mobileOpen, setMobileOpen] = useState(false);
  const more = usePopover();
  const prefs = usePopover();
  const lang = usePopover();

  const tr = (en: string, trText: string) => t12(language, en, trText);
  const c = getChrome(language);
  const currentLang = LANGUAGE_LIST.find((l) => l.id === language) ?? LANGUAGE_LIST[0];

  useEffect(() => setMobileOpen(false), [pathname]);

  const primary = [
    { href: '/calculators', label: tr('Solvers', 'Çözücüler'), icon: Calculator, badge: String(solverCount) },
    { href: '/design-studio', label: '3D CAD', icon: Box },
    { href: '/cad-editor', label: '2D CAD', icon: Pencil },
    { href: '/flow', label: 'Flow', icon: Workflow },
    { href: '/academy', label: tr('Academy', 'Akademi'), icon: GraduationCap },
  ];
  const secondary = [
    { href: '/factory', label: tr('Factory digital twin', 'Fabrika dijital ikiz'), icon: Factory },
    { href: '/project-simulation', label: tr('Project & cost simulator', 'Proje & maliyet simülatörü'), icon: BarChart3 },
    { href: '/download', label: tr('Mobile & watch apps', 'Mobil & saat uygulaması'), icon: Download },
  ];
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <nav className="sticky top-0 z-50 w-full shrink-0 border-b border-[var(--line)] bg-[var(--bg-1)]">
      <div className="mx-auto flex h-[52px] w-full max-w-[1880px] items-center gap-3 px-3 sm:px-4 lg:px-6">
        {/* Brand */}
        <Link href="/" className="flex shrink-0 items-center gap-2 rounded-[var(--radius-s)] focus-visible:outline-none focus-visible:[box-shadow:var(--focus-ring)]">
          <AluCalcLogo size={24} />
          <AluWordmark />
        </Link>

        {/* Primary navigation */}
        <div className="ml-2 hidden items-center gap-0.5 md:flex">
          {primary.map(({ href, label, icon: Icon, badge }, i) => (
            <Link
              key={href}
              href={href}
              aria-current={isActive(href) ? 'page' : undefined}
              className={`${navLink} ${i >= 3 ? 'hidden lg:inline-flex' : 'inline-flex'} ${
                isActive(href) ? 'bg-[var(--active)] text-[var(--ink)]' : 'text-[var(--alu-dim)] hover:bg-[var(--hover)] hover:text-[var(--ink)]'
              }`}
            >
              <Icon size={15} className={isActive(href) ? 'text-[var(--cyan)]' : ''} />
              {label}
              {badge && (
                <span className="rounded-[3px] bg-[var(--bg-3)] px-1.5 font-mono text-[10px] leading-[18px] text-[var(--alu-dim)]">{badge}</span>
              )}
            </Link>
          ))}
          <div ref={more.ref} className="relative">
            <button
              type="button"
              aria-expanded={more.open}
              onClick={() => more.setOpen(!more.open)}
              className={`${navLink} inline-flex text-[var(--alu-dim)] hover:bg-[var(--hover)] hover:text-[var(--ink)]`}
            >
              {tr('More', 'Daha fazla')} <ChevronDown size={14} className={`transition-transform ${more.open ? 'rotate-180' : ''}`} />
            </button>
            {more.open && (
              <div className={`${menuPanel} left-0 right-auto w-64`}>
                {primary.slice(3).map(({ href, label, icon: Icon }) => (
                  <Link key={href} href={href} onClick={() => more.setOpen(false)} className={`${menuItem} lg:hidden`}>
                    <Icon size={15} /> {label}
                  </Link>
                ))}
                {secondary.map(({ href, label, icon: Icon }) => (
                  <Link key={href} href={href} onClick={() => more.setOpen(false)} className={menuItem}>
                    <Icon size={15} /> {label}
                  </Link>
                ))}
                <div className="my-1 h-px bg-[var(--line)]" />
                <button
                  type="button"
                  className={menuItem}
                  onClick={() => {
                    more.setOpen(false);
                    window.dispatchEvent(new CustomEvent('alucalc:open-navigator'));
                  }}
                >
                  <Compass size={15} /> {tr('Engineering guide', 'Mühendislik rehberi')}
                  <kbd className="ml-auto font-mono text-[10px] text-[var(--muted)]">Alt+M</kbd>
                </button>
                <button
                  type="button"
                  className={menuItem}
                  onClick={() => {
                    more.setOpen(false);
                    window.dispatchEvent(new CustomEvent('alucalc:start-game-tour'));
                  }}
                >
                  <Gamepad2 size={15} /> {tr('Page tour', 'Sayfa turu')}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="ml-auto hidden min-w-0 flex-1 justify-center lg:flex">
          <button
            type="button"
            onClick={openPalette}
            className="flex h-8 w-full max-w-[420px] items-center gap-2 rounded-[var(--radius-s)] border border-[var(--line)] bg-[var(--bg-0)] px-3 text-left text-[13px] text-[var(--muted)] transition-colors hover:border-[var(--line-strong)] hover:text-[var(--alu)]"
          >
            <Search size={14} />
            <span className="flex-1 truncate">{tr('Search solvers, formulas, units…', 'Çözücü, formül, birim ara…')}</span>
            <kbd className="rounded-[3px] border border-[var(--line)] px-1.5 font-mono text-[10px] leading-[18px]">⌘K</kbd>
          </button>
        </div>

        {/* Actions */}
        <div className="ml-auto flex shrink-0 items-center gap-1.5 lg:ml-0">
          <button type="button" onClick={openPalette} className={`${iconBtn} lg:hidden`} title={tr('Search', 'Ara')} aria-label="Search">
            <Search size={15} />
          </button>

          <button
            type="button"
            onClick={openCopilot}
            title={aiReady ? 'AeGiS AI' : tr('Connect your AI account', 'AI hesabını bağla')}
            className="relative hidden h-8 items-center gap-1.5 rounded-[var(--radius-s)] border border-[var(--accent-line)] bg-[var(--accent-soft)] px-2.5 text-[13px] font-medium text-[var(--ink)] transition-colors hover:bg-[var(--cyan-glow)] sm:inline-flex"
          >
            <Sparkles size={14} className="text-[var(--cyan)]" />
            AeGiS
            <span className={`h-1.5 w-1.5 rounded-full ${aiReady ? 'bg-[var(--ok)]' : 'bg-[var(--muted)]'}`} aria-hidden />
          </button>

          <button type="button" onClick={openImportModal} className={`${iconBtn} hidden md:inline-flex`} title={c.importTitle} aria-label={c.import}>
            <Upload size={15} />
          </button>
          <button type="button" onClick={openFeedbackModal} className={`${iconBtn} hidden xl:inline-flex`} title={c.feedbackTitle} aria-label={c.feedback}>
            <MessageSquare size={15} />
          </button>

          <ThemePicker className="hidden sm:block" />

          {/* Display preferences: font scale + precision */}
          <div ref={prefs.ref} className="relative hidden sm:block">
            <button type="button" onClick={() => prefs.setOpen(!prefs.open)} className={iconBtn} title={tr('Display settings', 'Görünüm ayarları')} aria-expanded={prefs.open}>
              <Settings2 size={15} />
            </button>
            {prefs.open && (
              <div className={`${menuPanel} w-72 p-3`}>
                <div className="mb-1.5 text-xs font-medium text-[var(--alu-dim)]">{tr('Text size', 'Yazı boyutu')}</div>
                <div className="mb-3 grid grid-cols-5 gap-1">
                  {FONT_STEPS.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setFontSize(s.id as any)}
                      className={`h-7 rounded-[var(--radius-s)] border text-xs ${
                        fontSize === s.id
                          ? 'border-[var(--accent-line)] bg-[var(--accent-soft)] text-[var(--ink)]'
                          : 'border-[var(--line)] text-[var(--alu-dim)] hover:text-[var(--ink)]'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
                <div className="mb-1.5 text-xs font-medium text-[var(--alu-dim)]">{tr('Decimal places', 'Ondalık basamak')}</div>
                <div className="grid grid-cols-5 gap-1">
                  {PRECISION_STEPS.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDecimalPrecision(d)}
                      className={`h-7 rounded-[var(--radius-s)] border font-mono text-xs ${
                        decimalPrecision === d
                          ? 'border-[var(--accent-line)] bg-[var(--accent-soft)] text-[var(--ink)]'
                          : 'border-[var(--line)] text-[var(--alu-dim)] hover:text-[var(--ink)]'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
                <div className="mt-3 border-t border-[var(--line)] pt-2">
                  <Link href="/settings/#appearance" onClick={() => prefs.setOpen(false)} className={menuItem}>
                    <Settings2 size={15} className="text-[var(--cyan)]" /> {tr('Theme & background', 'Tema & arka plan')}
                  </Link>
                  <Link href="/settings/#reports" onClick={() => prefs.setOpen(false)} className={menuItem}>
                    <Pencil size={15} className="text-[var(--cyan)]" /> {tr('Report logo & approvals', 'Rapor amblemi & onaylar')}
                  </Link>
                  <Link href="/ai-connect" onClick={() => prefs.setOpen(false)} className={menuItem}>
                    <Sparkles size={15} className="text-[var(--cyan)]" /> {tr('AI connection', 'AI bağlantısı')}
                    <span className={`ml-auto h-1.5 w-1.5 rounded-full ${aiReady ? 'bg-[var(--ok)]' : 'bg-[var(--muted)]'}`} />
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Language */}
          <div ref={lang.ref} className="relative">
            <button
              type="button"
              onClick={() => lang.setOpen(!lang.open)}
              title={currentLang.native}
              aria-label={`Language: ${currentLang.native}`}
              aria-expanded={lang.open}
              className={`${iconBtn} w-auto gap-1 px-2`}
            >
              <FlagIcon lang={currentLang.id} className="h-3.5 w-5 rounded-[2px] object-cover" />
              <ChevronDown size={12} className="text-[var(--muted)]" />
            </button>
            {lang.open && (
              <div className={`${menuPanel} grid w-[300px] grid-cols-2 gap-0.5`}>
                {LANGUAGE_LIST.map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => {
                      setLanguage(l.id as any);
                      lang.setOpen(false);
                    }}
                    className={`${menuItem} py-1.5 ${language === l.id ? 'bg-[var(--active)] text-[var(--ink)]' : ''}`}
                  >
                    <FlagIcon lang={l.id} className="h-3 w-4 shrink-0 rounded-[2px] object-cover" />
                    <span className="truncate">{l.native}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            className={`${iconBtn} md:hidden`}
            aria-label="Menu"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="max-h-[calc(100dvh-52px)] overflow-y-auto border-t border-[var(--line)] bg-[var(--bg-1)] p-3 md:hidden">
          <button
            type="button"
            onClick={() => {
              setMobileOpen(false);
              openCopilot();
            }}
            className="mb-2 flex w-full items-center gap-2.5 rounded-[var(--radius-m)] border border-[var(--accent-line)] bg-[var(--accent-soft)] p-3 text-sm font-medium text-[var(--ink)]"
          >
            <Sparkles size={16} className="text-[var(--cyan)]" /> AeGiS AI
            <span className={`ml-auto h-2 w-2 rounded-full ${aiReady ? 'bg-[var(--ok)]' : 'bg-[var(--muted)]'}`} />
          </button>
          <div className="grid grid-cols-2 gap-1.5">
            {[...primary, ...secondary].map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-2 rounded-[var(--radius-m)] border p-3 text-sm ${
                  isActive(href)
                    ? 'border-[var(--accent-line)] bg-[var(--accent-soft)] text-[var(--ink)]'
                    : 'border-[var(--line)] bg-[var(--bg-2)] text-[var(--alu)]'
                }`}
              >
                <Icon size={16} className="shrink-0 text-[var(--alu-dim)]" />
                <span className="truncate">{label}</span>
              </Link>
            ))}
          </div>
          <div className="mt-3">
            <div className="mb-1.5 text-xs font-medium text-[var(--alu-dim)]">{tr('Theme', 'Tema')}</div>
            <ThemeGrid />
          </div>
          <div className="mt-3 grid grid-cols-5 gap-1">
            {FONT_STEPS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setFontSize(s.id as any)}
                className={`h-9 rounded-[var(--radius-s)] border text-xs ${
                  fontSize === s.id ? 'border-[var(--accent-line)] bg-[var(--accent-soft)] text-[var(--ink)]' : 'border-[var(--line)] text-[var(--alu-dim)]'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-1.5">
            <Link href="/settings/#appearance" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 rounded-[var(--radius-m)] border border-[var(--line)] bg-[var(--bg-2)] p-3 text-sm text-[var(--alu)]">
              <Settings2 size={16} className="shrink-0 text-[var(--cyan)]" /> <span className="truncate">{tr('Theme & background', 'Tema & arka plan')}</span>
            </Link>
            <Link href="/settings/#reports" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 rounded-[var(--radius-m)] border border-[var(--line)] bg-[var(--bg-2)] p-3 text-sm text-[var(--alu)]">
              <Pencil size={16} className="shrink-0 text-[var(--cyan)]" /> <span className="truncate">{tr('Report logo & approvals', 'Rapor amblemi & onaylar')}</span>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}

export default NavigationHeader;
