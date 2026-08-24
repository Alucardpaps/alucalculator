'use client';

import Link from 'next/link';
import { useI18nStore } from '@/store/i18nStore';
import { RELATED_BY_CATEGORY } from '@/data/moduleMethodology';
import type { ModuleSeoRecord } from '@/types/seo';

export function ModulePageSeoShell({ slug, seo }: { slug: string; seo: ModuleSeoRecord }) {
  const language = useI18nStore((s) => s.language);
  const category = seo.category || 'mechanical';
  const related = (RELATED_BY_CATEGORY[category] || RELATED_BY_CATEGORY.mechanical)
    .filter((r) => r.href !== `/${slug}/` && r.href !== `${seo.canonicalSlug}/`)
    .slice(0, 5);
  const title = seo.title.replace(/\s*\|\s*AluCalc(\s*OS)?\s*$/i, '').replace(/\s*—\s*AluCalc(\s*OS)?\s*$/i, '').trim();
  const standards: string[] = [];

  return (
    <header className="shrink-0 border-b border-white/[0.06] bg-[#0a0c12]/95">
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2 sm:px-4">
        <h1 className="text-[13px] font-bold tracking-tight text-white sm:text-sm">{title}</h1>
        {standards.map((s) => (
          <span key={s} className="hidden rounded border border-white/10 px-1.5 py-px font-mono text-[9px] text-white/40 sm:inline">{s}</span>
        ))}
        <nav className="ml-auto flex max-w-full items-center gap-1 overflow-x-auto" aria-label={language === 'tr' ? 'İlgili' : 'Related'}>
          {related.map((r) => (
            <Link key={r.href} href={r.href} className="shrink-0 rounded-md px-2 py-1 text-[11px] text-white/40 transition-colors hover:bg-white/[0.05] hover:text-white/80">
              {r.label}
            </Link>
          ))}
        </nav>
        <p className="sr-only">{seo.description}</p>
      </div>
    </header>
  );
}
