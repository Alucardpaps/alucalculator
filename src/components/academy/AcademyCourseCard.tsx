'use client';

import Link from 'next/link';
import { BookOpen, Calculator, ChevronRight, Clock, FlaskConical, GitBranch } from 'lucide-react';
import type { EnrichedCourse } from '@/data/academyIndex';
import type { AcademyPageStrings } from '@/locales/academyPageTranslations';

const DIFFICULTY_STYLE: Record<string, string> = {
  Basic: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  Intermediate: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  Advanced: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  Expert: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
};

type Props = {
  course: EnrichedCourse;
  t: AcademyPageStrings;
  difficultyLabel: (d: string) => string;
  prereqTitle?: (slug: string) => string;
  visited?: boolean;
  categoryLabel?: string;
};

export function AcademyCourseCard({ course, t, difficultyLabel, prereqTitle, visited, categoryLabel }: Props) {
  const diffClass = DIFFICULTY_STYLE[course.difficulty] ?? DIFFICULTY_STYLE.Intermediate;
  const cardHref = `/academy/${course.slug}`;

  return (
    <article className="group rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-blue-500/25 transition-all overflow-hidden">
      <Link href={cardHref} className="block p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center shrink-0 group-hover:bg-blue-500/10 group-hover:text-blue-400 transition-colors">
              <BookOpen size={16} className="text-slate-500 group-hover:text-blue-400" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-black text-slate-100 group-hover:text-white leading-snug">
                {visited && <span className="text-emerald-500 mr-1.5" title={t.visitedLabel}>✓</span>}
                {course.title}
              </h3>
              <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed line-clamp-2">{course.summary}</p>
            </div>
          </div>
          <ChevronRight size={14} className="text-slate-700 group-hover:text-blue-400 shrink-0 mt-1 transition-all group-hover:translate-x-0.5" />
        </div>

        {course.formula && (
          <div className="px-3 py-2 rounded-lg bg-black/30 border border-white/5 font-mono text-[11px] text-cyan-400/90 truncate">
            {t.formulaPreview}: {course.formula}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          {course.isSeoGuide && (
            <span className="flex items-center gap-1 text-[8px] font-black uppercase tracking-widest text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded">
              {t.engineeringGuide}
              {course.category && categoryLabel && (
                <span className="text-cyan-500/70 normal-case tracking-normal font-bold">· {categoryLabel}</span>
              )}
            </span>
          )}
          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${diffClass}`}>
            {difficultyLabel(course.difficulty)}
          </span>
          <span className="flex items-center gap-1 text-[9px] font-mono text-slate-500 uppercase">
            <Clock size={10} /> {course.readingTime} {t.minutesShort}
          </span>
          <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest border border-white/5 px-1.5 py-0.5 rounded">
            {t.year} {course.year}
          </span>
          {course.hasLab && (
            <span className="flex items-center gap-1 text-[8px] font-black uppercase tracking-widest text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 rounded">
              <FlaskConical size={10} /> {t.interactiveLab}
            </span>
          )}
        </div>

        {course.prerequisites.length > 0 && (
          <div className="flex items-start gap-2 pt-1 border-t border-white/5">
            <GitBranch size={12} className="text-slate-600 shrink-0 mt-0.5" />
            <div className="flex flex-wrap gap-1.5">
              <span className="text-[8px] font-bold text-slate-600 uppercase tracking-widest">{t.prerequisitesLabel}:</span>
              {course.prerequisites.map((slug) => (
                <span key={slug} className="text-[9px] text-slate-500 bg-white/5 px-1.5 py-0.5 rounded">
                  {prereqTitle?.(slug) ?? slug}
                </span>
              ))}
            </div>
          </div>
        )}

        <p className="text-[10px] text-slate-600">
          {t.reference}: <span className="text-slate-400 italic">{course.ref}</span>
        </p>
      </Link>

      {course.calculatorSlug && !course.isSeoGuide && (
        <div className="px-5 pb-4 pt-0">
          <Link
            href={course.calculatorSlug.startsWith('/') ? course.calculatorSlug : `/calculators/${course.calculatorSlug}`}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-blue-400/80 hover:text-blue-300 transition-colors"
          >
            <Calculator size={12} />
            {t.openCalculator}
          </Link>
        </div>
      )}
    </article>
  );
}
