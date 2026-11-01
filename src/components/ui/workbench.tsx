'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useI18nStore } from '@/store/i18nStore';
import { AlertTriangle, FlaskConical, ShieldCheck, ClipboardCopy, Check, RotateCcw, Zap } from 'lucide-react';
import { t12 } from '@/locales/t12';

const ACCENT: Record<string, string> = {
  cyan: 'text-[var(--std)] bg-[var(--std)]/10 border-[var(--std)]/20',
  blue: 'text-[var(--std)] bg-[var(--std)]/10 border-[var(--std)]/20',
  orange: 'text-[var(--std)] bg-[var(--std)]/10 border-[var(--std)]/20',
  emerald: 'text-[var(--std)] bg-[var(--std)]/10 border-[var(--std)]/20',
  violet: 'text-[var(--std)] bg-[var(--std)]/10 border-[var(--std)]/20',
};

export function CalculatorWorkbench({
  children, className = '', layout = 'fill', onCopy, onReset,
}: {
  children: React.ReactNode; className?: string; layout?: 'fill' | 'flow';
  onCopy?: () => void; onReset?: () => void;
}) {
  const isFlow = layout === 'flow';

  // Keyboard shortcuts: Ctrl+Shift+C = copy, Ctrl+Shift+R = reset
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'C' && onCopy) {
        e.preventDefault();
        onCopy();
      }
      if (e.ctrlKey && e.shiftKey && e.key === 'R' && onReset) {
        e.preventDefault();
        onReset();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onCopy, onReset]);

  return (
    <div
      className={`calc-workbench flex flex-col lg:flex-row w-full min-h-0 bg-[var(--color-os-canvas,#090b10)] text-[var(--ink)] ${
        isFlow ? 'h-auto overflow-visible' : 'h-full overflow-y-auto lg:overflow-hidden'
      } ${className}`}
      data-workbench="root"
      data-layout={layout}
    >
      {children}
    </div>
  );
}

export function WorkbenchField({ label, unit, children }: { label: string; unit?: string; children: React.ReactNode }) {
  return (
    <label className="block group">
      <div className="flex justify-between items-baseline mb-1">
        <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--alu-dim)] group-focus-within:text-[var(--ink)] transition-colors">{label}</span>
        {unit && <span className="text-[9px] font-mono text-[var(--cyan)]/70">{unit}</span>}
      </div>
      {children}
    </label>
  );
}

export function WorkbenchSection({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`space-y-2 ${className}`}>
      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--muted)]">{title}</h3>
      {children}
    </div>
  );
}

export function WorkbenchInputs({
  children, title, subtitle, icon, accent = 'cyan', className = '', standards = [], onReset, presets,
}: {
  children: React.ReactNode; title: string; subtitle?: string; icon?: React.ReactNode; accent?: string; className?: string; standards?: string[];
  onReset?: () => void;
  presets?: { label: string; onSelect: () => void }[];
}) {
  const { language } = useI18nStore();
  const tone = ACCENT[accent] || ACCENT.cyan;
  return (
    <aside className={`w-full lg:w-[min(100%,360px)] xl:w-[380px] shrink-0 flex flex-col h-auto lg:self-stretch min-h-0 bg-[var(--bg-1)] border-b lg:border-b-0 lg:border-r border-[var(--line)] ${className}`} data-workbench="inputs">
      <header className="flex-none px-3 sm:px-4 py-2.5 border-b border-[var(--line)]">
        <div className="flex items-center gap-2.5 min-w-0">
          {icon && <div className={`p-1.5 rounded-lg border shrink-0 ${tone}`}>{icon}</div>}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-[13px] sm:text-sm font-bold tracking-tight text-[var(--ink)] truncate">{title}</h2>
              {standards && standards.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  {standards.map((std) => (
                    <span key={std} className="px-1.5 py-0.5 rounded bg-[var(--bg-2)] border border-[var(--line)] text-[var(--std)] text-[9px] font-mono font-bold">
                      {std}
                    </span>
                  ))}
                </div>
              )}
            </div>
            {subtitle && <p className="text-[9px] font-medium text-[var(--muted)] truncate mt-0.5">{subtitle}</p>}
          </div>
          {onReset && (
            <button
              type="button"
              onClick={onReset}
              className="shrink-0 p-1.5 rounded-lg border border-[var(--line)] bg-[var(--bg-2)] hover:bg-[var(--bg-3)] text-[var(--alu-dim)] hover:text-[var(--ink)] transition-all cursor-pointer"
              title="Reset all inputs (Ctrl+Shift+R)"
            >
              <RotateCcw size={13} />
            </button>
          )}
        </div>
      </header>

      {/* Quick Presets Bar */}
      {presets && presets.length > 0 && (
        <div className="flex-none px-3 sm:px-4 py-1.5 bg-[var(--bg-1)] border-b border-[var(--line)] flex items-center gap-1.5 overflow-x-auto custom-scrollbar">
          <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-[var(--cyan)] shrink-0 flex items-center gap-1">
            <Zap size={11} /> {t12(language, 'Presets:', 'Şablonlar:')}
          </span>
          {presets.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={p.onSelect}
              className="px-2 py-0.5 rounded bg-[var(--bg-2)] hover:bg-[var(--bg-3)] border border-[var(--line)] text-[10px] font-mono text-[var(--alu)] hover:text-[var(--ink)] shrink-0 transition-colors cursor-pointer"
            >
              {p.label}
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain custom-scrollbar px-3 sm:px-4 py-3 space-y-3">{children}</div>
    </aside>
  );
}

export function WorkbenchResults({ children, className = '', copyText }: { children: React.ReactNode; className?: string; copyText?: string }) {
  const { language } = useI18nStore();
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    if (!copyText) return;
    try {
      await navigator.clipboard.writeText(copyText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard API requires secure context */ }
  }, [copyText]);

  return (
    <section className={`flex-1 min-h-0 min-w-0 flex flex-col overflow-y-auto relative ${className}`} data-workbench="results">
      {copyText && (
        <button
          type="button"
          onClick={handleCopy}
          className={`absolute top-3 right-3 z-10 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[10px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
            copied
              ? 'border-[var(--ok)]/50 bg-[var(--ok)]/15 text-[var(--ok)] '
              : 'border-[var(--line)] bg-[var(--bg-1)] text-[var(--alu-dim)] hover:text-[var(--ink)] hover:border-[var(--cyan)] hover:bg-[var(--bg-2)]'
          }`}
          title="Copy results to clipboard (Ctrl+Shift+C)"
        >
          {copied ? <Check size={12} className="text-[var(--ok)]" /> : <ClipboardCopy size={12} />}
          <span>{copied ? t12(language, 'Copied', 'Kopyalandı') : t12(language, 'Copy', 'Kopyala')}</span>
        </button>
      )}
      {children}
    </section>
  );
}

export function WorkbenchInfo({
  formula, formulaNote, standards = [], assumptions = [], links = [],
}: {
  formula?: string; formulaNote?: string; standards?: string[]; assumptions?: string[]; links?: { href: string; label: string }[];
}) {
  if (!formula && !assumptions.length && !standards.length) return null;
  return (
    <div className="flex-none border-t border-[var(--line)] bg-[var(--bg-2)] px-4 sm:px-5 py-3 space-y-3" data-workbench="info">
      {formula && (
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <FlaskConical size={11} className="text-[var(--cyan)]" />
            <span className="text-[9px] font-black uppercase tracking-widest text-[var(--cyan)]/80">Formula</span>
          </div>
          <p className="font-mono text-xs sm:text-sm text-[var(--ink)] break-words">{formula}</p>
          {formulaNote && <p className="mt-1 text-[11px] text-[var(--muted)] leading-relaxed">{formulaNote}</p>}
        </div>
      )}
      {standards.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {standards.map((s) => (
            <span key={s} className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-[var(--ok)]/30 text-[var(--ok)] bg-[var(--ok)]/10">
              <ShieldCheck size={9} />{s}
            </span>
          ))}
        </div>
      )}
      {assumptions.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <AlertTriangle size={11} className="text-[var(--warn)]" />
            <span className="text-[9px] font-black uppercase tracking-widest text-[var(--warn)]/80">Assumptions</span>
          </div>
          <ul className="space-y-1">
            {assumptions.map((a) => (
              <li key={a} className="text-[11px] text-[var(--alu-dim)] leading-snug flex gap-1.5">
                <span className="text-[var(--warn)]/60 shrink-0">•</span><span>{a}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {links.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] hover:text-[var(--cyan)] border border-[var(--line)] hover:border-[var(--cyan)]/30 rounded-full px-2.5 py-1 transition-colors">
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export const workbenchInputClass =
  'w-full bg-[var(--bg-2)] border border-[var(--line)] rounded-lg px-3 py-2.5 text-sm text-[var(--ink)] font-mono font-bold outline-none transition-all focus:border-[var(--cyan)]/40 ';

export const workbenchSelectClass =
  'w-full bg-[var(--bg-2)] border border-[var(--line)] rounded-lg px-3 py-2.5 text-sm text-[var(--ink)] font-mono font-bold outline-none transition-all focus:border-[var(--cyan)]/40 appearance-none cursor-pointer';

export function WorkbenchSlider({
  label, value, min, max, step, unit, onChange,
}: {
  label: string; value: number; min: number; max: number; step: number; unit?: string; onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <div className="mb-1 flex justify-between text-[10px]">
        <span className="font-bold uppercase tracking-wider text-[var(--alu-dim)]">{label}</span>
        <span className="font-mono text-[var(--std)]">{value}{unit ? ` ${unit}` : ''}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-[var(--std)]" />
    </label>
  );
}
