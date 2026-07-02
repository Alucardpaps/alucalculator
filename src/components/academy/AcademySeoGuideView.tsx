'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  Calculator,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ChevronLeft,
  Target,
} from 'lucide-react';
import { useI18nStore } from '@/store/i18nStore';
import { getAcademyPage, formatAcademyTemplate } from '@/locales/academyPageTranslations';
import type { AcademySeoLessonViewModel } from '@/lib/academySeoLesson';
import { generateSeoGuideQuiz } from '@/lib/academySeoLesson';
import { localizeSeoLesson } from '@/locales/academyLessonI18n';
import { AcademyQuiz } from '@/components/academy/AcademyQuiz';
import { AcademyLessonSidebar } from '@/components/academy/AcademyLessonSidebar';
import { getLessonProgress, markLessonVisited } from '@/lib/academyProgress';

type Props = {
  slug: string;
  lesson: AcademySeoLessonViewModel;
};

export function AcademySeoGuideView({ slug, lesson: rawLesson }: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const { language } = useI18nStore();


  const lesson = useMemo(() => localizeSeoLesson(rawLesson, language), [rawLesson, language]);
  const t = getAcademyPage(language);
  const quizQuestions = useMemo(
    () => generateSeoGuideQuiz(lesson.pitfalls, lesson.checklist),
    [lesson.pitfalls, lesson.checklist],
  );
  const [progressTick, setProgressTick] = useState(0);
  const progress = useMemo(() => getLessonProgress(slug), [slug, progressTick]);

  const tocSections = useMemo(
    () =>
      [
        { id: 'overview', label: lesson.hero.h1.slice(0, 40) },
        { id: 'formula', label: t.governingFormula },
        { id: 'steps', label: t.stepByStepTitle },
        lesson.technicalData.length ? { id: 'technical', label: t.technicalDataTitle } : null,
        lesson.checklist.length ? { id: 'checklist', label: t.designChecklistTitle } : null,
        lesson.pitfalls.length ? { id: 'pitfalls', label: t.commonMistakes } : null,
        lesson.practical ? { id: 'practical', label: t.practicalApplicationTitle } : null,
        lesson.example ? { id: 'example', label: t.workedExampleTitle } : null,
        quizQuestions.length ? { id: 'quiz', label: t.quizTitle } : null,
        lesson.faq.length ? { id: 'faq', label: t.technicalQA } : null,
      ].filter(Boolean) as { id: string; label: string }[],
    [lesson, quizQuestions.length, t],
  );

  useEffect(() => {
    markLessonVisited(slug);
    setProgressTick((n) => n + 1);
  }, [slug]);

  const bumpProgress = () => setProgressTick((n) => n + 1);

  if (!mounted) {
    return <div className="min-h-screen bg-[#020408]" />;
  }

  return (
    <div className="relative z-10 min-h-screen bg-[#020408]/80 text-slate-200 font-sans selection:bg-blue-500/30">
      <header className="border-b border-white/5 bg-[#020408]/40 backdrop-blur-xl sticky top-20 z-40">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link
            href="/academy"
            className="text-sm font-bold tracking-tight text-white flex items-center gap-2 hover:text-blue-400 transition-colors"
          >
            <ChevronLeft size={16} />
            AluCalc <span className="font-light text-slate-400">{t.facultySubtitle}</span>
          </Link>
          <nav className="hidden sm:flex gap-6 text-[10px] font-black uppercase tracking-widest text-slate-500">
            <span className="text-cyan-400">{t.engineeringGuide}</span>
            <span>•</span>
            <span className="capitalize">{lesson.category}</span>
          </nav>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-16 sm:py-24 flex gap-10">
        <AcademyLessonSidebar sections={tocSections} progress={progress} t={t} />

        <main className="flex-1 min-w-0 space-y-16">
          <section id="overview" className="space-y-6 scroll-mt-32">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="px-2 py-1 rounded bg-cyan-600/10 border border-cyan-500/20 text-[9px] font-black text-cyan-400 uppercase tracking-widest">
                {t.engineeringGuide}
              </span>
              <span className="px-2 py-1 rounded bg-blue-600/10 border border-blue-500/20 text-[9px] font-black text-blue-400 uppercase tracking-widest capitalize">
                {lesson.category}
              </span>
              <span className="flex items-center gap-1 text-[9px] font-mono text-slate-500 ml-auto">
                <Clock size={12} /> {formatAcademyTemplate(t.readTime, { minutes: lesson.readingTime })}
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
              {lesson.hero.h1}
            </h1>
            <p className="text-lg sm:text-xl text-slate-400 leading-relaxed whitespace-pre-line">
              {lesson.hero.intro}
            </p>
          </section>

          <section id="formula" className="rounded-2xl border border-blue-500/20 bg-blue-500/[0.02] p-8 scroll-mt-32">
            <h2 className="text-sm font-bold text-blue-400 uppercase tracking-widest mb-6 flex items-center gap-2">
              {t.governingFormula}
            </h2>
            <div className="bg-[#010204] rounded-xl p-6 border border-white/5 overflow-x-auto shadow-inner mb-6">
              <code className="text-2xl text-white font-mono block whitespace-nowrap text-center">
                {lesson.formula.equation}
              </code>
            </div>
            {Object.keys(lesson.formula.variables).length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Object.entries(lesson.formula.variables).map(([key, value]) => (
                  <div key={key} className="flex gap-3 text-sm">
                    <span className="text-blue-400 font-mono font-bold w-6 shrink-0">{key}</span>
                    <span className="text-slate-300">{value}</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {lesson.stepByStep.length > 0 && (
            <section id="steps" className="space-y-6 scroll-mt-32">
              <h2 className="text-2xl font-bold text-white border-b border-white/5 pb-4">{t.stepByStepTitle}</h2>
              <ol className="space-y-4">
                {lesson.stepByStep.map((step, idx) => (
                  <li
                    key={idx}
                    className="flex gap-4 items-start bg-white/[0.02] p-4 rounded-xl border border-white/5"
                  >
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 font-mono text-sm shrink-0">
                      {idx + 1}
                    </span>
                    <span className="text-slate-300 leading-relaxed text-sm">{step}</span>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {lesson.technicalData.length > 0 && (
            <section id="technical" className="space-y-6 scroll-mt-32">
              <h2 className="text-2xl font-bold text-white border-b border-white/5 pb-4">{t.technicalDataTitle}</h2>
              {lesson.technicalData.map((table, ti) => (
                <div key={ti} className="rounded-2xl border border-white/5 overflow-hidden">
                  <div className="px-4 py-3 bg-white/[0.03] text-xs font-black uppercase tracking-widest text-slate-400">
                    {table.name}
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/5 text-left text-[10px] uppercase tracking-widest text-slate-500">
                          {Object.keys(table.rows[0] ?? {}).map((col) => (
                            <th key={col} className="px-4 py-2 font-bold">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {table.rows.map((row, ri) => (
                          <tr key={ri} className="border-b border-white/5 last:border-0">
                            {Object.values(row).map((val, ci) => (
                              <td key={ci} className="px-4 py-2 text-slate-300 font-mono text-xs">
                                {String(val)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </section>
          )}

          {lesson.checklist.length > 0 && (
            <section id="checklist" className="space-y-4 scroll-mt-32">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Target className="text-emerald-500" size={20} /> {t.designChecklistTitle}
              </h2>
              <ul className="space-y-3">
                {lesson.checklist.map((item, idx) => (
                  <li
                    key={idx}
                    className="flex gap-3 text-sm text-slate-400 leading-relaxed pl-4 border-l-2 border-emerald-500/30"
                  >
                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {lesson.pitfalls.length > 0 && (
            <section id="pitfalls" className="space-y-4 scroll-mt-32">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <AlertTriangle className="text-red-500" size={20} /> {t.commonMistakes}
              </h2>
              <ul className="space-y-3">
                {lesson.pitfalls.map((item, idx) => (
                  <li key={idx} className="text-sm text-slate-400 leading-relaxed pl-4 border-l-2 border-red-500/30">
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {lesson.practical && (
            <section id="practical" className="rounded-xl border border-amber-500/20 bg-amber-500/[0.06] px-5 py-4 scroll-mt-32">
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 block mb-2">
                {t.practicalApplicationTitle}
              </span>
              <p className="text-sm text-amber-100/90 leading-relaxed">{lesson.practical}</p>
            </section>
          )}

          {lesson.example && (
            <section id="example" className="space-y-6 scroll-mt-32">
              <h2 className="text-2xl font-bold text-white border-b border-white/5 pb-4">{t.workedExampleTitle}</h2>
              <div className="bg-[#05090e] border border-white/5 rounded-2xl p-6 sm:p-8">
                <p className="text-base text-emerald-400 font-mono bg-emerald-500/10 px-4 py-3 rounded-lg border border-emerald-500/20 leading-relaxed whitespace-pre-line">
                  {lesson.example}
                </p>
              </div>
            </section>
          )}

          {lesson.faq.length > 0 && (
            <section id="faq" className="space-y-6 pt-12 border-t border-white/5 scroll-mt-32">
              <h2 className="text-2xl font-bold text-white mb-6">{t.technicalQA}</h2>
              <div className="space-y-4">
                {lesson.faq.map((faq, idx) => (
                  <details
                    key={idx}
                    className="group bg-white/[0.02] border border-white/5 rounded-xl [&_summary::-webkit-details-marker]:hidden"
                  >
                    <summary className="flex cursor-pointer items-center justify-between gap-1.5 p-4 text-white font-medium">
                      <h3 className="text-sm sm:text-base">{faq.question}</h3>
                      <span className="shrink-0 rounded-full bg-white/5 p-1.5 text-slate-400 group-open:-rotate-180 transition-transform">
                        <svg xmlns="http://www.w3.org/2000/svg" className="size-4" viewBox="0 0 20 20" fill="currentColor">
                          <path
                            fillRule="evenodd"
                            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </span>
                    </summary>
                    <p className="p-4 pt-0 text-sm text-slate-400 leading-relaxed border-t border-white/5 mt-2">
                      {faq.answer}
                    </p>
                  </details>
                ))}
              </div>
            </section>
          )}

          {quizQuestions.length > 0 && (
            <div id="quiz" className="scroll-mt-32">
              <AcademyQuiz slug={slug} questions={quizQuestions} t={t} onPassed={bumpProgress} />
            </div>
          )}

          {lesson.relatedGuides.length > 0 && (
            <section className="pt-8 border-t border-white/5 space-y-4">
              <h2 className="text-lg font-black text-white">{t.relatedGuidesTitle}</h2>
              <div className="flex flex-wrap gap-2">
                {lesson.relatedGuides.map((g) => (
                  <Link
                    key={g.slug}
                    href={`/academy/${g.slug}`}
                    className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs font-bold text-slate-300 hover:border-cyan-500/30 hover:text-cyan-300 transition-colors"
                  >
                    {g.title}
                  </Link>
                ))}
              </div>
            </section>
          )}

          <section className="space-y-4">
            <Link
              href={lesson.calculatorHref}
              className="group relative w-full flex items-center justify-between bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 p-6 sm:p-8 rounded-2xl overflow-hidden shadow-2xl transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              <div className="relative z-10">
                <h3 className="text-white font-bold text-lg sm:text-xl flex items-center gap-3">
                  <Calculator className="text-white/80" />
                  {t.openLiveCalculator}
                </h3>
                <p className="text-blue-100 text-sm sm:text-base mt-2 max-w-md">
                  {t.openLiveCalculatorDesc}
                </p>
              </div>
              <div className="relative z-10 w-12 h-12 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-1 transition-transform">
                <ArrowRight className="text-white" />
              </div>
              <div className="absolute top-0 right-0 opacity-10 pointer-events-none translate-x-1/4 -translate-y-1/4 scale-150">
                <Calculator size={200} />
              </div>
            </Link>

            {lesson.workspaceHref && (
              <Link
                href={lesson.workspaceHref}
                className="flex items-center justify-between w-full p-5 rounded-xl bg-white/[0.03] border border-white/10 hover:border-cyan-500/30 transition-colors group"
              >
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{t.openInAluCalc}</p>
                  <p className="text-sm font-bold text-white mt-1 group-hover:text-cyan-300">
                    {lesson.workspaceLabel ?? lesson.workspaceHref}
                  </p>
                </div>
                <ArrowRight size={18} className="text-slate-500 group-hover:text-cyan-400" />
              </Link>
            )}
          </section>
        </main>
      </div>

      <footer className="border-t border-white/5 bg-transparent py-12 text-center text-xs text-slate-600">
        <p>{formatAcademyTemplate(t.articleFooter, { year: new Date().getFullYear() })}</p>
      </footer>
    </div>
  );
}
