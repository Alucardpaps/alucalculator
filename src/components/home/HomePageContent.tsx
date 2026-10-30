'use client';

/**
 * Home — a calm, mascot-centred landing page (v6).
 *
 * AeGiS hovers over a slowly turning rotary table in the middle of the page and reacts
 * to the ask box: it looks down at the box while you type, speaks when it finds matching
 * calculations and thinks when it does not (Enter then hands the question to the AeGiS
 * chat). Below it: one question, one box and a dock with the five workspaces.
 */

import React, { useId, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Box, Calculator, CornerDownLeft, GraduationCap, PenTool, Search, Workflow } from 'lucide-react';
import { useI18nStore } from '@/store/i18nStore';
import { t12 } from '@/locales/t12';
import { AegisHeroCard } from '@/components/home/AegisHeroCard';
import { AegisMascot, type AegisPose } from '@/components/copilot/AegisMascot';
import { solverCount } from '@/lib/registry/calculatorRegistry';
import { searchTools } from '@/lib/search/toolSearch';
import styles from './HomeStage.module.css';

// ─── the rotary table under AeGiS ───────────────────────────────────────────

const MINOR_TICKS = Array.from({ length: 72 }, (_, i) => i * 5).filter((a) => a % 30 !== 0);
const MAJOR_TICKS = Array.from({ length: 12 }, (_, i) => i * 30);
const T_SLOTS = [45, 135, 225, 315];

const RotaryTable = React.memo(function RotaryTable() {
  const gid = useId().replace(/[^a-zA-Z0-9]/g, '');
  return (
    <div aria-hidden className={styles.dial}>
      <svg viewBox="-200 -200 400 400" className={styles.layer}>
        <defs>
          <radialGradient id={`${gid}-glow`}>
            <stop offset="0" style={{ stopColor: 'var(--cyan)', stopOpacity: 0.2 }} />
            <stop offset="0.5" style={{ stopColor: 'var(--cyan)', stopOpacity: 0.06 }} />
            <stop offset="1" style={{ stopColor: 'var(--cyan)', stopOpacity: 0 }} />
          </radialGradient>
        </defs>
        <circle r="200" fill={`url(#${gid}-glow)`} />
        <circle r="194" fill="none" style={{ stroke: 'var(--line-strong)' }} strokeWidth="1.4" />
      </svg>
      <div className={styles.rotor}>
        <svg viewBox="-200 -200 400 400" className={styles.layer}>
          <g style={{ stroke: 'var(--line-strong)' }} strokeWidth="1.6" strokeLinecap="round">
            {MINOR_TICKS.map((a) => (
              <line key={a} x1="0" y1="-187" x2="0" y2="-178" transform={`rotate(${a})`} />
            ))}
          </g>
          <g style={{ stroke: 'var(--alu-dim)' }} strokeWidth="2.4" strokeLinecap="round">
            {MAJOR_TICKS.map((a) => (
              <line key={a} x1="0" y1="-187" x2="0" y2="-166" transform={`rotate(${a})`} />
            ))}
          </g>
          <circle r="140" fill="none" style={{ stroke: 'var(--line-strong)' }} strokeWidth="1.4" strokeDasharray="2 9" strokeLinecap="round" />
          <g fill="none" style={{ stroke: 'var(--line-strong)' }} strokeWidth="1.4">
            {T_SLOTS.map((a) => (
              <rect key={a} x="-6" y="-128" width="12" height="54" rx="6" transform={`rotate(${a})`} />
            ))}
          </g>
          <circle r="64" fill="none" style={{ stroke: 'var(--accent-line)' }} strokeWidth="1.8" />
        </svg>
      </div>
      {/* fixed index mark at the front edge */}
      <svg viewBox="-200 -200 400 400" className={styles.layer}>
        <path d="M 0 180 L -9 198 L 9 198 Z" style={{ fill: 'var(--cyan)' }} />
      </svg>
    </div>
  );
});

// ─── workspaces dock ────────────────────────────────────────────────────────

const WORKSPACES = [
  { href: '/calculators/', icon: Calculator, en: 'Solvers', tr: 'Çözücüler', hintEn: `${solverCount} calculations`, hintTr: `${solverCount} hesap` },
  { href: '/design-studio/', icon: Box, en: '3D CAD', tr: '3D CAD', hintEn: 'Parametric parts', hintTr: 'Parametrik parça' },
  { href: '/cad-editor/', icon: PenTool, en: '2D CAD', tr: '2D CAD', hintEn: 'Technical drawing', hintTr: 'Teknik çizim' },
  { href: '/flow/', icon: Workflow, en: 'Flow', tr: 'Flow', hintEn: 'Calculation graphs', hintTr: 'Hesap akışları' },
  { href: '/academy/', icon: GraduationCap, en: 'Academy', tr: 'Akademi', hintEn: 'Learn and practise', hintTr: 'Öğren, pratik yap' },
] as const;

const LOOK_AT_BOX = { x: 0, y: 0.9 } as const;

type StageState = 'idle' | 'listening' | 'found' | 'unknown';

const POSE: Record<StageState, AegisPose | null> = {
  idle: null,
  listening: 'listening',
  found: 'speaking',
  unknown: 'thinking',
};

// ─── page ───────────────────────────────────────────────────────────────────

export function HomePageContent() {
  const { language } = useI18nStore();
  const router = useRouter();
  const listId = useId();
  const headingId = useId();

  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);

  const results = useMemo(() => searchTools(query), [query]);
  const text = query.trim();
  const state: StageState = !focused ? 'idle' : !text ? 'listening' : results.length ? 'found' : 'unknown';
  const showList = state === 'found';

  const message = {
    idle: t12(language, 'Hi, I’m AeGiS.', 'Merhaba, ben AeGiS.'),
    listening: t12(language, 'Type it and I’ll find it.', 'Yaz, hemen bulayım.'),
    found: t12(language, 'Found these. Pick one.', 'Bunları buldum, birini seç.'),
    unknown: t12(
      language,
      'No ready-made calculation for that. Ask me and we’ll work it out in the chat.',
      'Bunun için hazır bir hesap yok. Bana sor, sohbette birlikte çözelim.'
    ),
  }[state];

  const askAegis = (prompt?: string) => {
    window.dispatchEvent(
      new CustomEvent('alucalc:open-copilot', prompt ? { detail: { prompt, send: true } } : undefined)
    );
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.nativeEvent.isComposing) return;
    if (e.key === 'ArrowDown' && results.length) {
      e.preventDefault();
      setActiveIdx((i) => (i + 1) % results.length);
    } else if (e.key === 'ArrowUp' && results.length) {
      e.preventDefault();
      setActiveIdx((i) => (i - 1 + results.length) % results.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const hit = results[activeIdx];
      if (hit) router.push(hit.route);
      else if (text) askAegis(text);
    } else if (e.key === 'Escape' && query) {
      e.preventDefault();
      setQuery('');
      setActiveIdx(0);
    }
  };

  return (
    <div
      className={`relative isolate flex min-h-[calc(100svh-53px-80px)] shrink-0 flex-col items-center justify-center overflow-x-clip px-4 text-center sm:min-h-[calc(100svh-53px)] ${styles.page}`}
    >
      <div className={styles.stage}>
        <RotaryTable />
        <AegisHeroCard
          size={styles.mascot}
          greet
          forcedPose={POSE[state]}
          lookAt={state === 'listening' || state === 'found' ? LOOK_AT_BOX : null}
          message={message}
          className="max-w-[420px]"
        />
      </div>

      <h1
        id={headingId}
        className={`font-tech font-semibold leading-[1.1] tracking-[-0.02em] text-[var(--ink)] ${styles.title}`}
      >
        {t12(language, 'What do you want to calculate?', 'Ne hesaplamak istersin?')}
      </h1>
      <p className={`max-w-[34rem] text-[15px] leading-relaxed text-[var(--alu-dim)] sm:text-base ${styles.lede}`}>
        {t12(
          language,
          `${solverCount} ISO, DIN and VDI calculations, 3D CAD and 2D drawing in one place.`,
          `${solverCount} ISO, DIN ve VDI hesabı, 3D CAD ve 2D çizim tek yerde.`
        )}
      </p>

      {/* ask box */}
      <div data-tour="home-search" className={`relative w-full max-w-[560px] text-left ${styles.ask}`}>
        <div
          className={`flex h-14 items-center gap-3 rounded-[var(--radius-l)] border bg-[var(--bg-1)] pl-4 pr-1.5 transition-[border-color,box-shadow] ${
            focused
              ? 'border-[var(--cyan)] shadow-[0_0_0_3px_var(--accent-soft)]'
              : 'border-[var(--line-strong)] shadow-[var(--shadow-1)]'
          }`}
        >
          <Search size={18} className="shrink-0 text-[var(--alu-dim)]" aria-hidden />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIdx(0);
            }}
            onFocus={() => setFocused(true)}
            onBlur={() => window.setTimeout(() => setFocused(false), 120)}
            onKeyDown={onKeyDown}
            placeholder={t12(language, 'e.g. M12 bolt torque, 6205 bearing life, H7/g6', 'Örn. M12 cıvata torku, 6205 rulman ömrü, H7/g6')}
            aria-labelledby={headingId}
            role="combobox"
            aria-expanded={showList}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={showList ? `${listId}-${activeIdx}` : undefined}
            enterKeyHint="search"
            autoComplete="off"
            spellCheck={false}
            // the box itself shows focus (border + ring); the global :focus-visible outline is unlayered
            style={{ outline: 'none' }}
            className="h-full min-w-0 flex-1 bg-transparent text-[15px] text-[var(--ink)] placeholder:text-[var(--muted)]"
          />
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => askAegis(text || undefined)}
            className="inline-flex h-11 shrink-0 items-center gap-2 rounded-[var(--radius-m)] bg-[var(--cyan)] pl-2 pr-3.5 text-sm font-semibold text-[var(--accent-ink)] transition-[filter] hover:brightness-110"
          >
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[color-mix(in_oklab,var(--accent-ink)_14%,transparent)]">
              <AegisMascot size={24} variant="face" interactive={false} />
            </span>
            <span className="hidden sm:inline">{t12(language, 'Ask AeGiS', 'AeGiS’e sor')}</span>
            <span className="sr-only sm:hidden">{t12(language, 'Ask AeGiS', 'AeGiS’e sor')}</span>
          </button>
        </div>

        <ul
          id={listId}
          role="listbox"
          hidden={!showList}
          className="absolute left-0 right-0 top-[62px] z-30 overflow-hidden rounded-[var(--radius-l)] border border-[var(--line-strong)] bg-[var(--bg-1)] py-1 shadow-[var(--shadow-2)]"
        >
          {results.map((r, i) => (
            <li key={r.route} id={`${listId}-${i}`} role="option" aria-selected={i === activeIdx}>
              <Link
                href={r.route}
                tabIndex={-1}
                onMouseDown={(e) => e.preventDefault()}
                onMouseEnter={() => setActiveIdx(i)}
                className={`flex items-center justify-between gap-3 px-4 py-2.5 text-sm transition-colors ${
                  i === activeIdx ? 'bg-[var(--hover)] text-[var(--ink)]' : 'text-[var(--alu)]'
                }`}
              >
                <span className="truncate">{language === 'tr' ? r.titleTr : r.titleEn}</span>
                <span className="flex shrink-0 items-center gap-2 text-[12px] text-[var(--alu-dim)]">
                  {r.standard && <span className="hidden sm:inline">{r.standard}</span>}
                  <CornerDownLeft size={13} aria-hidden className={i === activeIdx ? 'opacity-100' : 'opacity-0'} />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* workspaces */}
      <nav
        data-tour="home-cta-bar"
        aria-label={t12(language, 'Workspaces', 'Çalışma alanları')}
        className={`grid w-full max-w-[520px] grid-cols-5 gap-1 rounded-[var(--radius-l)] border border-[var(--line)] bg-[var(--bg-1)] p-1 ${styles.dock}`}
      >
        {WORKSPACES.map((w) => {
          const Icon = w.icon;
          return (
            <Link
              key={w.href}
              href={w.href}
              title={language === 'tr' ? w.hintTr : w.hintEn}
              className="group flex flex-col items-center gap-1.5 rounded-[var(--radius-m)] px-1 py-2.5 text-[var(--alu)] transition-colors hover:bg-[var(--hover)] hover:text-[var(--ink)]"
            >
              <Icon size={19} aria-hidden className="text-[var(--alu-dim)] transition-colors group-hover:text-[var(--cyan)]" />
              <span className="text-[12px] font-medium leading-none sm:text-[13px]">{language === 'tr' ? w.tr : w.en}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export default HomePageContent;
