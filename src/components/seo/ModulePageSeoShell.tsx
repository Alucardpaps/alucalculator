'use client';

import React from 'react';
import Link from 'next/link';
import {
  ChevronRight,
  Calculator,
  ShieldCheck,
  Compass,
  ArrowLeft,
  BookOpen,
  Sparkles,
  Info,
  Cpu,
} from 'lucide-react';
import { useI18nStore } from '@/store/i18nStore';
import { t12 } from '@/locales/t12';
import { RELATED_BY_CATEGORY, getModuleMethod } from '@/data/moduleMethodology';
import type { ModuleSeoRecord } from '@/types/seo';

const ENGINEERING_WORKSTATION_SLUGS = new Set([
  'cylinders',
  'cylinder-design',
  'gears',
  'gears-bearings',
  'gearbox-design',
  'bolt-torque',
  'fasteners',
  'bearings',
  'fits',
  'fits-tolerances',
  'keyway',
  'keyway-connection',
  'press-fit',
  'beam-deflection',
  'strength',
  'strength-analysis',
  'fatigue',
  'fatigue-analysis',
  'simulation-fea',
  'fea',
  'cad-editor',
  'parametric-cad',
  'nesting',
  'nesting-2d',
  'welding',
  'pumps',
  'fluid-dynamics',
  'fluids',
  'reducer-lubrication',
]);

const CATEGORY_NAMES: Record<string, { tr: string; en: string }> = {
  mechanical: { tr: 'Mekanik & Makine Elemanları', en: 'Mechanical Elements' },
  structural: { tr: 'Yapısal & Mukavemet', en: 'Structural & Mechanics' },
  fluid: { tr: 'Akışkan & Termal', en: 'Fluids & Thermal' },
  electrical: { tr: 'Elektrik & Güç', en: 'Electrical & Power' },
  manufacturing: { tr: 'İmalat & Tolerans', en: 'Manufacturing & Fits' },
  science: { tr: 'Bilim & Matematik', en: 'Science & Math' },
};

export function ModulePageSeoShell({ slug, seo }: { slug: string; seo: ModuleSeoRecord }) {
  const language = useI18nStore((s) => s.language);
  const category = seo.category || 'mechanical';
  const catMeta = CATEGORY_NAMES[category] || CATEGORY_NAMES.mechanical;
  
  const related = (RELATED_BY_CATEGORY[category] || RELATED_BY_CATEGORY.mechanical)
    .filter((r) => r.href !== `/${slug}/` && r.href !== `/${slug}` && r.href !== `${seo.canonicalSlug}/` && r.href !== seo.canonicalSlug)
    .slice(0, 4);

  const title = seo.title
    .replace(/\s*\|\s*AluCalc(\s*OS)?\s*$/i, '')
    .replace(/\s*—\s*AluCalc(\s*OS)?\s*$/i, '')
    .trim();

  const method = getModuleMethod(slug);
  const primaryStandards = method.standards && method.standards.length > 0
    ? method.standards.slice(0, 2)
    : [];

  const handleScrollToFormula = () => {
    if (typeof document !== 'undefined') {
      const el = document.querySelector('section[aria-label="Calculation methodology"]');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // Auto open details if closed
        const details = el.querySelector('details');
        if (details && !details.open) {
          details.open = true;
        }
      }
    }
  };

  return (
    <header className="w-full shrink-0 border-b border-[var(--line)] bg-[var(--bg-1)] select-none">
      {/* ═══ TOP BREADCRUMB & CONTEXT ROW ═══ */}
      <div className="mx-auto max-w-[1400px] px-3 sm:px-4 lg:px-6 py-2.5 flex flex-wrap items-center justify-between gap-2.5 text-xs font-mono">
        {/* Left: Breadcrumbs & Back Link */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {/* Back to All Solvers */}
          <Link
            href="/calculators"
            className="inline-flex items-center gap-1 px-2 py-1 rounded-[var(--radius-s)] bg-[var(--bg-2)] hover:bg-[var(--bg-3)] border border-[var(--line)] text-[var(--alu-dim)] hover:text-[var(--cyan)] transition-colors text-[11px] font-bold shrink-0"
            title={t12(language, 'Back to All Solvers Directory', 'Tüm Çözücüler Dizinine Dön')}
          >
            <ArrowLeft size={12} />
            <span>{t12(language, 'Solvers', 'Çözücüler')}</span>
          </Link>

          <span className="text-[var(--line-strong)] text-[11px]">/</span>

          {/* Category */}
          <span className="text-[var(--alu-dim)] text-[11px] hidden sm:inline">
            {language === 'tr' ? catMeta.tr : catMeta.en}
          </span>

          <span className="text-[var(--line-strong)] text-[11px] hidden sm:inline">/</span>

          {/* Active Tool Name */}
          <h1 className="text-[12px] sm:text-[13px] font-bold text-[var(--ink)] tracking-tight inline-flex items-center gap-1.5 font-tech">
            <span>{title}</span>
          </h1>

          {/* Taxonomy Badge: Workstation vs Formula Solver */}
          {ENGINEERING_WORKSTATION_SLUGS.has(slug) ? (
            <span
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[var(--radius-s)] bg-[var(--cyan)]/10 border border-[var(--cyan)]/30 text-[9px] font-mono font-bold text-[var(--cyan)] uppercase shrink-0"
              title={t12(language, 'Engineering Workstation: Geometry, Multi-Domain Analysis, Verification & 3D/CAD', 'Mühendislik İş İstasyonu: Geometri, Çok Disiplinli Analiz, Doğrulama & 3D/CAD')}
            >
              <Cpu size={10} />
              <span>{t12(language, 'CAE WORKSTATION', 'CAE İSTASYONU')}</span>
            </span>
          ) : (
            <span
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[var(--radius-s)] bg-[var(--bg-2)] border border-[var(--line)] text-[9px] font-mono font-bold text-[var(--alu-dim)] uppercase shrink-0"
              title={t12(language, 'Formula Solver: Direct Physical Relations & Fast Numerical Solve', 'Formül Çözücü: Doğrudan Fiziksel Bağıntılar ve Hızlı Sayısal Çözüm')}
            >
              <Calculator size={10} />
              <span>{t12(language, 'FORMULA SOLVER', 'FORMÜL ÇÖZÜCÜ')}</span>
            </span>
          )}

          {/* Standards Badges */}
          {primaryStandards.map((std) => (
            <span
              key={std}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[var(--radius-s)] bg-[var(--bg-3)] border border-[var(--cyan)]/30 text-[10px] text-[var(--cyan)] font-mono font-medium shrink-0"
            >
              <ShieldCheck size={11} className="text-[var(--ok)]" />
              <span>{std}</span>
            </span>
          ))}
        </div>

        {/* Right: Quick Jumps & Guide Triggers */}
        <div className="flex items-center gap-1.5 shrink-0 ml-auto font-mono">
          {/* Methodology & Formula Jump Button */}
          <button
            type="button"
            onClick={handleScrollToFormula}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-[var(--radius-s)] bg-[var(--bg-2)] hover:bg-[var(--bg-3)] border border-[var(--line)] text-[var(--alu-dim)] hover:text-[var(--ink)] transition-colors text-[11px]"
            title={t12(language, 'View formula, assumptions & worked example', 'Formül, kabuller ve çözümlü örneği gör')}
          >
            <Info size={12} className="text-[var(--std)]" />
            <span className="hidden md:inline">{t12(language, 'Formula & Norms', 'Formül & Norm')}</span>
          </button>

          {/* Global Navigator Modal Trigger */}
          <button
            type="button"
            onClick={() => {
              window.dispatchEvent(new CustomEvent('alucalc:open-navigator'));
            }}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-[var(--radius-s)] bg-[var(--cyan)]/10 hover:bg-[var(--cyan)]/20 border border-[var(--cyan)]/30 text-[var(--cyan)] transition-colors text-[11px] font-bold"
            title={t12(language, 'Open Engineering Navigator (Alt+M)', 'Mühendislik Rehberi (Alt+M)')}
          >
            <Compass size={12} />
            <span>{t12(language, 'Guide', 'Rehber')}</span>
          </button>
        </div>
      </div>

      {/* ═══ SUB-BAR: RELATED TOOLS DIRECT LINKS (NEVER GET LOST) ═══ */}
      {related.length > 0 && (
        <div className="border-t border-[var(--line)] bg-[var(--bg-0)]/60 px-3 sm:px-4 lg:px-6 py-1.5 flex items-center gap-2 overflow-x-auto text-[11px] font-mono scrollbar-none">
          <span className="text-[var(--alu-dim)]/70 uppercase text-[9px] tracking-wider shrink-0 font-bold">
            {t12(language, 'Related Solvers:', 'İlgili Çözücüler:')}
          </span>
          <div className="flex items-center gap-1.5">
            {related.map((r) => (
              <Link
                key={r.href}
                href={r.href}
                className="px-2 py-0.5 rounded-[var(--radius-s)] bg-[var(--bg-2)] hover:bg-[var(--bg-3)] border border-[var(--line)] text-[var(--alu-dim)] hover:text-[var(--cyan)] hover:border-[var(--cyan)]/40 transition-colors whitespace-nowrap text-[10px]"
              >
                {r.label}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Hidden Description for SEO engines */}
      <p className="sr-only">{seo.description}</p>
    </header>
  );
}

export default ModulePageSeoShell;
