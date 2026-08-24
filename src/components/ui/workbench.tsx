'use client';

import Link from 'next/link';
import { AlertTriangle, FlaskConical, ShieldCheck } from 'lucide-react';

const ACCENT: Record<string, string> = {
  cyan: 'text-[#9bbdff] bg-[#6b9fff]/10 border-[#6b9fff]/20',
  blue: 'text-[#9bbdff] bg-[#6b9fff]/10 border-[#6b9fff]/20',
  orange: 'text-[#9bbdff] bg-[#6b9fff]/10 border-[#6b9fff]/20',
  emerald: 'text-[#9bbdff] bg-[#6b9fff]/10 border-[#6b9fff]/20',
  violet: 'text-[#9bbdff] bg-[#6b9fff]/10 border-[#6b9fff]/20',
};

export function CalculatorWorkbench({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`calc-workbench flex flex-col lg:flex-row w-full h-full min-h-0 bg-[var(--color-os-canvas,#090b10)] text-[#eef1f6] overflow-y-auto lg:overflow-hidden ${className}`}
      data-workbench="root"
    >
      {children}
    </div>
  );
}

export function WorkbenchField({ label, unit, children }: { label: string; unit?: string; children: React.ReactNode }) {
  return (
    <label className="block group">
      <div className="flex justify-between items-baseline mb-1">
        <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500 group-focus-within:text-white transition-colors">{label}</span>
        {unit && <span className="text-[9px] font-mono text-cyan-500/70">{unit}</span>}
      </div>
      {children}
    </label>
  );
}

export function WorkbenchSection({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`space-y-2 ${className}`}>
      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{title}</h3>
      {children}
    </div>
  );
}

export function WorkbenchInputs({
  children, title, subtitle, icon, accent = 'cyan', className = '',
}: {
  children: React.ReactNode; title: string; subtitle?: string; icon?: React.ReactNode; accent?: string; className?: string;
}) {
  const tone = ACCENT[accent] || ACCENT.cyan;
  return (
    <aside className={`w-full lg:w-[min(100%,360px)] xl:w-[380px] shrink-0 flex flex-col h-auto lg:h-full min-h-0 bg-[#0a0e14] border-b lg:border-b-0 lg:border-r border-white/[0.07] ${className}`} data-workbench="inputs">
      <header className="flex-none px-3 sm:px-4 py-2.5 border-b border-white/[0.07]">
        <div className="flex items-center gap-2.5 min-w-0">
          {icon && <div className={`p-1.5 rounded-lg border shrink-0 ${tone}`}>{icon}</div>}
          <div className="min-w-0">
            <h2 className="text-[13px] sm:text-sm font-bold tracking-tight text-white truncate">{title}</h2>
            {subtitle && <p className="text-[9px] font-medium text-white/35 truncate mt-0.5">{subtitle}</p>}
          </div>
        </div>
      </header>
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain custom-scrollbar px-3 sm:px-4 py-3 space-y-3">{children}</div>
    </aside>
  );
}

export function WorkbenchResults({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={`flex-1 h-auto lg:h-full min-h-0 min-w-0 flex flex-col overflow-y-auto lg:overflow-hidden ${className}`} data-workbench="results">
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
    <div className="flex-none border-t border-white/5 bg-black/30 px-4 sm:px-5 py-3 space-y-3" data-workbench="info">
      {formula && (
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <FlaskConical size={11} className="text-cyan-400" />
            <span className="text-[9px] font-black uppercase tracking-widest text-cyan-400/80">Formula</span>
          </div>
          <p className="font-mono text-xs sm:text-sm text-white break-words">{formula}</p>
          {formulaNote && <p className="mt-1 text-[11px] text-slate-500 leading-relaxed">{formulaNote}</p>}
        </div>
      )}
      {standards.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {standards.map((s) => (
            <span key={s} className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-emerald-500/20 text-emerald-300/90 bg-emerald-500/5">
              <ShieldCheck size={9} />{s}
            </span>
          ))}
        </div>
      )}
      {assumptions.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <AlertTriangle size={11} className="text-amber-400" />
            <span className="text-[9px] font-black uppercase tracking-widest text-amber-400/80">Assumptions</span>
          </div>
          <ul className="space-y-1">
            {assumptions.map((a) => (
              <li key={a} className="text-[11px] text-slate-400 leading-snug flex gap-1.5">
                <span className="text-amber-500/50 shrink-0">•</span><span>{a}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {links.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:text-cyan-300 border border-white/5 hover:border-cyan-500/30 rounded-full px-2.5 py-1 transition-colors">
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export const workbenchInputClass =
  'w-full bg-[#0e1622] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white font-mono font-bold outline-none transition-all focus:border-cyan-500/40 focus:shadow-[0_0_15px_rgba(6,182,212,0.08)]';

export const workbenchSelectClass =
  'w-full bg-[#0e1622] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white font-mono font-bold outline-none transition-all focus:border-cyan-500/40 appearance-none cursor-pointer';

export function WorkbenchSlider({
  label, value, min, max, step, unit, onChange,
}: {
  label: string; value: number; min: number; max: number; step: number; unit?: string; onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <div className="mb-1 flex justify-between text-[10px]">
        <span className="font-bold uppercase tracking-wider text-white/40">{label}</span>
        <span className="font-mono text-[#9bbdff]">{value}{unit ? ` ${unit}` : ''}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-[#6b9fff]" />
    </label>
  );
}
