'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  Calculator,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Download,
  FileText,
  Clock,
  ChevronLeft,
  BookOpen,
  Target,
} from 'lucide-react';
import { AcademyArticle } from '@/schemas/academy-article';
import { InteractiveFastener } from '@/app/academy/components/InteractiveFastener';
import { MohrCircleLab } from '@/app/academy/components/MohrCircleLab';
import { useI18nStore } from '@/store/i18nStore';
import { getAcademyPage, formatAcademyTemplate, getAcademyDepartments } from '@/locales/academyPageTranslations';
import { getAcademyCalculatorRoute } from '@/data/academyCalculatorRoutes';
import { getAdjacentLessons } from '@/data/academyEngineWalkthroughs';
import { getAcademyArticle } from '@/data/academyIndex';
import {
  localizeAcademyArticle,
  localizeLessonEnrichment,
  localizeWalkthrough,
  getLocalizedQuiz,
  getLocalizedPracticeConfig,
  localizeCourseTitle,
} from '@/locales/academyLessonI18n';
import { AcademyEngineWalkthroughPanel } from '@/components/academy/AcademyEngineWalkthrough';
import { AcademyQuiz } from '@/components/academy/AcademyQuiz';
import { AcademyPracticeWidget } from '@/components/academy/AcademyPracticeWidget';
import { AcademyLessonSidebar } from '@/components/academy/AcademyLessonSidebar';
import { getLessonProgress, markLessonVisited, getVisitedLessons } from '@/lib/academyProgress';

type Props = {
  slug: string;
  data: AcademyArticle;
};

export function AcademyArticleView({ slug, data: rawData }: Props) {
  const { language } = useI18nStore();
  const data = useMemo(() => localizeAcademyArticle(rawData, language), [rawData, language]);
  const t = getAcademyPage(language);
  const walkthrough = localizeWalkthrough(slug, language);
  const calcRoute = getAcademyCalculatorRoute(slug);
  const adjacent = getAdjacentLessons(slug);
  const departments = getAcademyDepartments(language);
  const enrichment = localizeLessonEnrichment(slug, language);
  const learningObjectives = data.learningObjectives ?? enrichment?.learningObjectives ?? [];
  const keyTakeaways = data.keyTakeaways ?? enrichment?.keyTakeaways ?? [];
  const heroIntro = enrichment?.supplementalParagraph
    ? `${data.hero.intro}\n\n${enrichment.supplementalParagraph}`
    : data.hero.intro;
  const quizQuestions = getLocalizedQuiz(slug, language, data.faq);
  const practiceConfig = getLocalizedPracticeConfig(slug, language);
  const [progressTick, setProgressTick] = useState(0);

  const progress = useMemo(() => getLessonProgress(slug), [slug, progressTick]);

  const tocSections = useMemo(
    () =>
      [
        { id: 'overview', label: data.hero.h1.slice(0, 40) },
        learningObjectives.length ? { id: 'objectives', label: t.learningObjectivesTitle } : null,
        walkthrough ? { id: 'engine', label: t.engineWalkthroughTitle } : null,
        { id: 'formula', label: t.governingFormula },
        practiceConfig ? { id: 'practice', label: t.practiceTitle } : null,
        { id: 'steps', label: t.stepByStepTitle },
        { id: 'example', label: t.workedExampleTitle },
        keyTakeaways.length ? { id: 'takeaways', label: t.keyTakeawaysTitle } : null,
        quizQuestions.length ? { id: 'quiz', label: t.quizTitle } : null,
        data.faq?.length ? { id: 'faq', label: t.technicalQA } : null,
      ].filter(Boolean) as { id: string; label: string }[],
    [data, walkthrough, practiceConfig, quizQuestions.length, learningObjectives.length, keyTakeaways.length, t],
  );

  const prereqLinks = useMemo(() => {
    const visited = getVisitedLessons();
    return (data.prerequisites ?? []).map((ps) => ({
      slug: ps,
      title: resolveTitleStatic(departments, ps, language),
      done: visited.includes(ps),
    }));
  }, [data.prerequisites, departments, language]);

  function resolveTitleStatic(
    depts: ReturnType<typeof getAcademyDepartments>,
    lessonSlug: string,
    locale: typeof language,
  ) {
    for (const dept of depts) {
      const c = dept.courses.find((x) => x.slug === lessonSlug);
      if (c) return c.title;
    }
    const article = getAcademyArticle(lessonSlug);
    const enTitle = article?.meta.title ?? lessonSlug;
    return localizeCourseTitle(lessonSlug, enTitle, locale);
  }

  const resolveTitle = (lessonSlug: string) => resolveTitleStatic(departments, lessonSlug, language);

  const calculatorHref = calcRoute?.href ?? (
    data.calculatorCta.targetSlug.startsWith('/')
      ? data.calculatorCta.targetSlug
      : `/calculators/${data.calculatorCta.targetSlug.replace(/-calc$/, '')}`
  );

  useEffect(() => {
    markLessonVisited(slug);
    setProgressTick((n) => n + 1);
  }, [slug]);

  const bumpProgress = () => setProgressTick((n) => n + 1);

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
            <span className="text-blue-400">
              {t.year} {data.academicYear}
            </span>
            <span>•</span>
            <span>{data.department}</span>
          </nav>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-16 sm:py-24 flex gap-10">
        <AcademyLessonSidebar
          sections={tocSections}
          progress={progress}
          t={t}
          prereqLinks={prereqLinks.length ? prereqLinks : undefined}
        />

        <main className="flex-1 min-w-0 space-y-16">
        <section id="overview" className="space-y-6 scroll-mt-32">
          <div className="flex items-center gap-3">
            <span className="px-2 py-1 rounded bg-blue-600/10 border border-blue-500/20 text-[9px] font-black text-blue-400 uppercase tracking-widest">
              {formatAcademyTemplate(t.academicLevel, { year: data.academicYear })}
            </span>
            <span className="px-2 py-1 rounded bg-emerald-600/10 border border-emerald-500/20 text-[9px] font-black text-emerald-400 uppercase tracking-widest">
              {data.difficulty}
            </span>
            <span className="flex items-center gap-1 text-[9px] font-mono text-slate-500 ml-auto">
              <Clock size={12} /> {formatAcademyTemplate(t.readTime, { minutes: data.readingTime })}
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            {data.hero.h1}
          </h1>
          <p className="text-lg sm:text-xl text-slate-400 leading-relaxed whitespace-pre-line">{heroIntro}</p>
          {learningObjectives.length > 0 && (
            <section id="objectives" className="rounded-2xl border border-violet-500/20 bg-violet-500/[0.04] p-6 scroll-mt-32">
              <h2 className="text-sm font-black text-violet-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Target size={16} /> {t.learningObjectivesTitle}
              </h2>
              <ol className="space-y-2 list-decimal list-inside">
                {learningObjectives.map((obj, idx) => (
                  <li key={idx} className="text-sm text-slate-300 leading-relaxed pl-1">
                    {obj}
                  </li>
                ))}
              </ol>
            </section>
          )}
          {data.engineeringTip && (
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.06] px-5 py-4 text-sm text-amber-100/90 leading-relaxed">
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 block mb-1">
                {t.engineeringTipLabel}
              </span>
              {data.engineeringTip}
            </div>
          )}
        </section>

        {walkthrough && (
          <div id="engine" className="scroll-mt-32">
            <AcademyEngineWalkthroughPanel walkthrough={walkthrough} t={t} />
          </div>
        )}

        <section id="formula" className="rounded-2xl border border-blue-500/20 bg-blue-500/[0.02] p-8 scroll-mt-32">
          <h2 className="text-sm font-bold text-blue-400 uppercase tracking-widest mb-6 flex items-center gap-2">
            {t.governingFormula}
          </h2>
          <div className="bg-[#010204] rounded-xl p-6 border border-white/5 overflow-x-auto shadow-inner mb-6">
            <code className="text-2xl text-white font-mono block whitespace-nowrap text-center">
              {data.formula.equation}
            </code>
          </div>
          {data.formula.variables && Object.keys(data.formula.variables).length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Object.entries(data.formula.variables).map(([key, value]) => (
                <div key={key} className="flex gap-3 text-sm">
                  <span className="text-blue-400 font-mono font-bold w-6 shrink-0">{key}</span>
                  <span className="text-slate-300">{value as string}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {slug === 'how-to-calculate-bolt-torque' && (
          <section className="space-y-6">
            <div className="flex items-center gap-4 mb-2">
              <h2 className="text-xl font-bold text-white tracking-tight">{t.intelligenceLab}</h2>
              <div className="flex-1 h-[1px] bg-white/5" />
              <div className="px-2 py-1 rounded-md bg-blue-600/10 border border-blue-500/30 text-[8px] font-black text-blue-400 uppercase tracking-widest">
                {t.liveEngineBadge}
              </div>
            </div>
            <InteractiveFastener />
          </section>
        )}

        {slug === 'mohrs-circle-stress-analysis' && (
          <section className="space-y-6">
            <div className="flex items-center gap-4 mb-2">
              <h2 className="text-xl font-bold text-white tracking-tight">{t.principalStressSimulator}</h2>
              <div className="flex-1 h-[1px] bg-white/5" />
              <div className="px-2 py-1 rounded-md bg-rose-600/10 border border-rose-500/30 text-[8px] font-black text-rose-400 uppercase tracking-widest">
                {t.physicsLabBadge}
              </div>
            </div>
            <MohrCircleLab />
          </section>
        )}

        {practiceConfig && (
          <div id="practice" className="scroll-mt-32">
            <AcademyPracticeWidget slug={slug} config={practiceConfig} t={t} onDone={bumpProgress} />
          </div>
        )}

        <section id="steps" className="space-y-6 scroll-mt-32">
          <h2 className="text-2xl font-bold text-white border-b border-white/5 pb-4">{t.stepByStepTitle}</h2>
          <ol className="space-y-4">
            {data.stepByStep.map((step, idx) => (
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

        <section id="example" className="space-y-6 scroll-mt-32">
          <h2 className="text-2xl font-bold text-white border-b border-white/5 pb-4">{t.workedExampleTitle}</h2>
          <div className="bg-[#05090e] border border-white/5 rounded-2xl p-6 sm:p-8">
            <div className="mb-6">
              <h3 className="text-xs uppercase tracking-widest text-slate-500 font-bold mb-4">
                {t.inputParameters}
              </h3>
              <ul className="space-y-2">
                {data.example.inputs.map((input, idx) => (
                  <li key={idx} className="text-sm text-slate-300 font-mono bg-white/5 px-3 py-2 rounded">
                    {input}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-xs uppercase tracking-widest text-slate-500 font-bold mb-4">{t.calculation}</h3>
              <div className="text-base sm:text-lg text-emerald-400 font-mono bg-emerald-500/10 px-4 py-3 rounded-lg border border-emerald-500/20">
                {data.example.calculation}
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="text-emerald-500" size={20} /> {t.whyThisMatters}
            </h2>
            <ul className="space-y-3">
              {data.whyThisMatters.map((point, idx) => (
                <li key={idx} className="text-sm text-slate-400 leading-relaxed pl-4 border-l-2 border-white/10">
                  {point}
                </li>
              ))}
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <AlertTriangle className="text-red-500" size={20} /> {t.commonMistakes}
            </h2>
            <ul className="space-y-3">
              {data.commonMistakes.map((point, idx) => (
                <li key={idx} className="text-sm text-slate-400 leading-relaxed pl-4 border-l-2 border-white/10">
                  {point}
                </li>
              ))}
            </ul>
          </section>
        </div>

        {data.textbookInsights && data.textbookInsights.length > 0 && (
          <section className="pt-12 border-t border-white/5">
            <h2 className="text-sm font-black text-blue-400 uppercase tracking-[0.2em] mb-8">
              {t.textbookDeepDive}
            </h2>
            <div className="grid grid-cols-1 gap-4">
              {data.textbookInsights.map((insight, idx) => (
                <div
                  key={idx}
                  className="p-6 rounded-2xl bg-blue-500/[0.03] border border-blue-500/10 flex gap-6 items-start relative overflow-hidden group hover:border-blue-500/30 transition-all"
                >
                  <div className="absolute top-0 right-0 p-4 text-[40px] font-black text-blue-500/5 select-none group-hover:text-blue-500/10 transition-colors">
                    {insight.page}
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0 shadow-lg">
                    <BookOpen size={24} />
                  </div>
                  <div className="space-y-2 relative z-10">
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      {formatAcademyTemplate(t.pageSource, { page: insight.page, source: insight.source })}
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed font-medium italic">
                      &ldquo;{insight.insight}&rdquo;
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {data.downloadableResources && data.downloadableResources.length > 0 && (
          <section className="pt-12 border-t border-white/5">
            <h2 className="text-xl font-black text-white mb-6 flex items-center gap-2">
              <Download size={20} className="text-rose-500" /> {t.referenceMaterial}
            </h2>
            <div className="grid grid-cols-1 gap-3">
              {data.downloadableResources.map((res, idx) => (
                <div
                  key={idx}
                  className="group p-4 rounded-xl bg-rose-500/5 border border-rose-500/10 flex items-center justify-between hover:bg-rose-500/10 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-white/5 rounded-lg text-rose-400">
                      <FileText size={18} />
                    </div>
                    <span className="text-sm font-bold text-slate-200">{res.title}</span>
                  </div>
                  <button
                    type="button"
                    className="px-4 py-1.5 rounded-lg bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-rose-400 transition-colors"
                  >
                    {t.download}
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {data.faq && data.faq.length > 0 && (
          <section id="faq" className="space-y-6 pt-12 border-t border-white/5 scroll-mt-32">
            <h2 className="text-2xl font-bold text-white mb-6">{t.technicalQA}</h2>
            <div className="space-y-4">
              {data.faq.map((faq, idx) => (
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

        {keyTakeaways.length > 0 && (
          <section
            id="takeaways"
            className="rounded-2xl border border-amber-500/25 bg-gradient-to-br from-amber-500/[0.08] to-orange-500/[0.04] p-6 sm:p-8 scroll-mt-32"
          >
            <h2 className="text-lg font-black text-amber-300 mb-4">{t.keyTakeawaysTitle}</h2>
            <ul className="space-y-3">
              {keyTakeaways.map((point, idx) => (
                <li key={idx} className="flex gap-3 text-sm text-amber-100/90 leading-relaxed">
                  <CheckCircle2 size={16} className="text-amber-400 shrink-0 mt-0.5" />
                  {point}
                </li>
              ))}
            </ul>
          </section>
        )}

        {quizQuestions.length > 0 && (
          <div id="quiz" className="scroll-mt-32">
            <AcademyQuiz slug={slug} questions={quizQuestions} t={t} onPassed={bumpProgress} />
          </div>
        )}

        {data.relatedArticles && data.relatedArticles.length > 0 && (
          <section className="pt-8 border-t border-white/5 space-y-4">
            <h2 className="text-lg font-black text-white">{t.relatedLessons}</h2>
            <div className="flex flex-wrap gap-2">
              {data.relatedArticles.map((rs) => (
                <Link
                  key={rs}
                  href={`/academy/${rs}`}
                  className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs font-bold text-slate-300 hover:border-blue-500/30 hover:text-blue-300 transition-colors"
                >
                  {resolveTitle(rs)}
                </Link>
              ))}
            </div>
          </section>
        )}

        <section>
          <Link
            href={calculatorHref}
            className="group relative w-full flex items-center justify-between bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 p-6 sm:p-8 rounded-2xl overflow-hidden shadow-2xl transition-all hover:scale-[1.01] active:scale-[0.99]"
          >
            <div className="relative z-10">
              <h3 className="text-white font-bold text-lg sm:text-xl flex items-center gap-3">
                <Calculator className="text-white/80" />
                {t.liveSimulationEngine}
              </h3>
              <p className="text-blue-100 text-sm sm:text-base mt-2 max-w-md">{data.calculatorCta.label}</p>
              {calcRoute && (
                <p className="text-[10px] font-mono text-blue-200/70 mt-2 uppercase tracking-widest">
                  {t.openInAluCalc}: {calcRoute.workspaceLabel}
                </p>
              )}
            </div>
            <div className="relative z-10 w-12 h-12 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-1 transition-transform">
              <ArrowRight className="text-white" />
            </div>
            <div className="absolute top-0 right-0 opacity-10 pointer-events-none translate-x-1/4 -translate-y-1/4 scale-150">
              <Calculator size={200} />
            </div>
          </Link>
        </section>

        {(adjacent.prev || adjacent.next) && (
          <nav className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-white/5">
            {adjacent.prev ? (
              <Link
                href={`/academy/${adjacent.prev}`}
                className="flex-1 p-4 rounded-xl bg-white/[0.03] border border-white/5 hover:border-blue-500/30 transition-colors group"
              >
                <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{t.prevLesson}</span>
                <p className="text-sm font-bold text-white mt-1 group-hover:text-blue-300">{resolveTitle(adjacent.prev)}</p>
              </Link>
            ) : (
              <div className="flex-1" />
            )}
            {adjacent.next ? (
              <Link
                href={`/academy/${adjacent.next}`}
                className="flex-1 p-4 rounded-xl bg-white/[0.03] border border-white/5 hover:border-blue-500/30 transition-colors group text-right"
              >
                <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{t.nextLesson}</span>
                <p className="text-sm font-bold text-white mt-1 group-hover:text-blue-300">{resolveTitle(adjacent.next)}</p>
              </Link>
            ) : null}
          </nav>
        )}
      </main>
      </div>

      <footer className="border-t border-white/5 bg-transparent py-12 text-center text-xs text-slate-600">
        <p>{formatAcademyTemplate(t.articleFooter, { year: new Date().getFullYear() })}</p>
      </footer>
    </div>
  );
}
