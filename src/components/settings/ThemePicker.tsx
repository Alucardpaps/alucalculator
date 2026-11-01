'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Monitor, Palette } from 'lucide-react';
import { THEMES, type ThemePreference } from '@/lib/theme/themes';
import { useTheme } from '@/lib/theme/themeStore';

type Lang = 'tr' | 'en';

function useLang(): Lang {
  const [lang, setLang] = useState<Lang>('en');
  useEffect(() => {
    const l = (document.documentElement.lang || navigator.language || 'en').toLowerCase();
    setLang(l.startsWith('tr') ? 'tr' : 'en');
  }, []);
  return lang;
}

function Swatch({ colors, size = 28 }: { colors: [string, string, string, string]; size?: number }) {
  const [page, card, text, accent] = colors;
  return (
    <span
      aria-hidden
      className="relative inline-block shrink-0 overflow-hidden rounded-[var(--radius-s)] border border-[var(--line)]"
      style={{ width: size, height: size, background: page }}
    >
      <span className="absolute left-[18%] top-[22%] h-[56%] w-[64%] rounded-[2px]" style={{ background: card }} />
      <span className="absolute left-[28%] top-[36%] h-[8%] w-[34%] rounded-full" style={{ background: text }} />
      <span className="absolute left-[28%] top-[56%] h-[8%] w-[22%] rounded-full" style={{ background: accent }} />
    </span>
  );
}

/** Full grid — used in Settings and the onboarding. */
export function ThemeGrid({ onPicked }: { onPicked?: () => void }) {
  const { preference, setPreference } = useTheme();
  const lang = useLang();
  const options: { id: ThemePreference; label: string; desc: string; swatch?: [string, string, string, string] }[] = [
    ...THEMES.map((t) => ({ id: t.id as ThemePreference, label: t.name[lang], desc: t.description[lang], swatch: t.swatch })),
    {
      id: 'system',
      label: lang === 'tr' ? 'Sistem' : 'System',
      desc: lang === 'tr' ? 'Cihazının açık/koyu ayarını takip eder.' : 'Follows your device light/dark setting.',
    },
  ];
  return (
    <div role="radiogroup" aria-label={lang === 'tr' ? 'Tema' : 'Theme'} className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {options.map((o) => {
        const active = preference === o.id;
        return (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => {
              setPreference(o.id);
              onPicked?.();
            }}
            className={`flex items-center gap-3 rounded-[var(--radius-m)] border p-3 text-left transition-colors focus-visible:outline-none focus-visible:[box-shadow:var(--focus-ring)] ${
              active
                ? 'border-[var(--accent-line)] bg-[var(--accent-soft)]'
                : 'border-[var(--line)] bg-[var(--bg-2)] hover:border-[var(--line-strong)] hover:bg-[var(--hover)]'
            }`}
          >
            {o.swatch ? (
              <Swatch colors={o.swatch} size={36} />
            ) : (
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[var(--radius-s)] border border-[var(--line)] bg-[var(--bg-3)] text-[var(--alu-dim)]">
                <Monitor size={16} />
              </span>
            )}
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-[var(--ink)]">{o.label}</span>
              <span className="block truncate text-xs text-[var(--alu-dim)]">{o.desc}</span>
            </span>
            {active && <Check size={16} className="shrink-0 text-[var(--cyan)]" />}
          </button>
        );
      })}
    </div>
  );
}

/** Compact header button with a popover menu. */
export function ThemePicker({ className = '' }: { className?: string }) {
  const { preference, theme, setPreference } = useTheme();
  const lang = useLang();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const current = THEMES.find((t) => t.id === theme)!;

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        title={lang === 'tr' ? 'Tema' : 'Theme'}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-8 items-center gap-2 rounded-[var(--radius-s)] border border-[var(--line)] bg-[var(--bg-2)] px-2 text-xs text-[var(--alu)] transition-colors hover:border-[var(--line-strong)] hover:text-[var(--ink)] focus-visible:outline-none focus-visible:[box-shadow:var(--focus-ring)]"
      >
        <Swatch colors={current.swatch} size={16} />
        <span className="hidden xl:inline">{current.name[lang]}</span>
        <Palette size={14} className="xl:hidden" />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+6px)] z-[200] w-64 rounded-[var(--radius-m)] border border-[var(--line)] bg-[var(--bg-2)] p-1 [box-shadow:var(--shadow-2)]"
        >
          <div className="px-2 pb-1 pt-1.5 text-[11px] font-medium text-[var(--muted)]">{lang === 'tr' ? 'Tema' : 'Theme'}</div>
          {[...THEMES.map((t) => ({ id: t.id as ThemePreference, label: t.name[lang], swatch: t.swatch as [string, string, string, string] | undefined })),
            { id: 'system' as ThemePreference, label: lang === 'tr' ? 'Sistem ayarı' : 'System', swatch: undefined }].map((o) => (
            <button
              key={o.id}
              role="menuitemradio"
              aria-checked={preference === o.id}
              type="button"
              onClick={() => {
                setPreference(o.id);
                setOpen(false);
              }}
              className="flex w-full items-center gap-2.5 rounded-[var(--radius-s)] px-2 py-1.5 text-left text-sm text-[var(--alu)] hover:bg-[var(--hover)] hover:text-[var(--ink)]"
            >
              {o.swatch ? <Swatch colors={o.swatch} size={18} /> : <Monitor size={16} className="text-[var(--alu-dim)]" />}
              <span className="flex-1">{o.label}</span>
              {preference === o.id && <Check size={14} className="text-[var(--cyan)]" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default ThemePicker;
