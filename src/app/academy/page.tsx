'use client';

import React, { useEffect, useMemo, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  GraduationCap,
  ChevronRight,
  Search,
  Hexagon,
  Layers,
  ShieldCheck,
  Wrench,
  Activity,
  BookOpen,
  Microscope,
  HardHat,
  Target,
  Lightbulb,
  Calculator,
  Route,
} from 'lucide-react';
import { useI18nStore } from '@/store/i18nStore';
import {
  getAcademyPage,
  formatAcademyYear,
  formatAcademyTemplate,
  getAcademyDepartments,
  getDepartmentOutcomes,
  getAcademyCategoryLabel,
} from '@/locales/academyPageTranslations';
import {
  enrichCourse,
  getAcademyStats,
  getAcademyArticle,
  YEAR1_PATH,
} from '@/data/academyIndex';
import { ACADEMY_LESSON_ORDER } from '@/data/academyEngineWalkthroughs';
import { getCompletionPercent, getLessonProgress } from '@/lib/academyProgress';
import { AcademyCourseCard } from '@/components/academy/AcademyCourseCard';
import { AcademyCalculatorHub } from '@/components/academy/AcademyCalculatorHub';
import { mergeSeoGuidesIntoDepartments } from '@/data/academySeoCourses';
import { localizeCourseTitle } from '@/locales/academyLessonI18n';

const DEPT_ICONS: Record<string, React.ReactNode> = {
  Design: <Wrench size={24} className="text-blue-400" />,
  Structural: <Layers size={24} className="text-emerald-400" />,
  Manufacturing: <HardHat size={24} className="text-orange-400" />,
  Physics: <Microscope size={24} className="text-rose-400" />,
};

const DEPT_THEME: Record<string, { iconBg: string; headText: string }> = {
  blue: { iconBg: 'bg-blue-500/10 border-blue-500/20', headText: 'text-blue-400' },
  emerald: { iconBg: 'bg-emerald-500/10 border-emerald-500/20', headText: 'text-emerald-400' },
  orange: { iconBg: 'bg-orange-500/10 border-orange-500/20', headText: 'text-orange-400' },
  rose: { iconBg: 'bg-rose-500/10 border-rose-500/20', headText: 'text-rose-400' },
};

const VISITED_KEY = 'academy-visited';

type AcademyTab = 'curriculum' | 'calculators';

function AcademyPageContent() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const searchParams = useSearchParams();
  const router = useRouter();
  const initialTab = searchParams.get('tab') === 'calculators' ? 'calculators' : 'curriculum';
  const [activeTab, setActiveTab] = useState<AcademyTab>(initialTab);
  const { language } = useI18nStore();
  const t = getAcademyPage(language);


  const departments = useMemo(
    () => mergeSeoGuidesIntoDepartments(getAcademyDepartments(language), language),
    [language],
  );
  const stats = getAcademyStats();
  const [activeYear, setActiveYear] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [visited, setVisited] = useState<string[]>([]);
  const [masteryPct, setMasteryPct] = useState(0);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(VISITED_KEY);
      setVisited(raw ? JSON.parse(raw) : []);
      setMasteryPct(getCompletionPercent(stats.moduleCount));
    } catch {
      setVisited([]);
    }
  }, [stats.moduleCount]);

  useEffect(() => {
    const tab = searchParams.get('tab') === 'calculators' ? 'calculators' : 'curriculum';
    setActiveTab(tab);
  }, [searchParams]);

  const switchTab = (tab: AcademyTab) => {
    setActiveTab(tab);
    const url = tab === 'calculators' ? '/academy?tab=calculators' : '/academy';
    router.replace(url, { scroll: false });
    if (tab === 'calculators') {
      requestAnimationFrame(() => document.getElementById('calculators')?.scrollIntoView({ behavior: 'smooth' }));
    }
  };

  const resolvePrereqTitle = (slug: string) => {
    for (const dept of departments) {
      const c = dept.courses.find((x) => x.slug === slug);
      if (c) return c.title;
    }
    const enTitle = getAcademyArticle(slug)?.meta.title ?? slug;
    return localizeCourseTitle(slug, enTitle, language);
  };

  const resumeSlug = useMemo(() => {
    for (const slug of ACADEMY_LESSON_ORDER) {
      const p = getLessonProgress(slug);
      if (!p.complete) return slug;
    }
    return ACADEMY_LESSON_ORDER[0];
  }, [visited, masteryPct]);

  const resumeTitle = resumeSlug ? resolvePrereqTitle(resumeSlug) : '';

  const difficultyLabel = (d: string) => {
    const map: Record<string, string> = {
      Basic: t.difficultyBasic,
      Intermediate: t.difficultyIntermediate,
      Advanced: t.difficultyAdvanced,
      Expert: t.difficultyExpert,
    };
    return map[d] ?? d;
  };

  const allCourses = useMemo(
    () => departments.flatMap((d) => d.courses.map((c) => enrichCourse(c, language))),
    [departments, language],
  );

  const filteredDepartments = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return departments;
    return departments
      .map((dept) => ({
        ...dept,
        courses: dept.courses.filter((c) => {
          const enriched = enrichCourse(c, language);
          return (
            c.title.toLowerCase().includes(q) ||
            c.ref.toLowerCase().includes(q) ||
            enriched.summary.toLowerCase().includes(q) ||
            enriched.formula.toLowerCase().includes(q)
          );
        }),
      }))
      .filter((d) => d.courses.length > 0);
  }, [departments, search, language]);

  const year1Courses = useMemo(
    () =>
      YEAR1_PATH.map((slug) => allCourses.find((c) => c.slug === slug)).filter(Boolean) as ReturnType<
        typeof enrichCourse
      >[],
    [allCourses],
  );

  if (!mounted) {
    return <div className="min-h-screen bg-[#020408]" />;
  }

  return (
    <div className="relative z-10 min-h-screen bg-transparent text-white selection:bg-blue-500/30 font-sans pb-32">
      {/* Toolbar: tabs + search + year filter */}
      <div className="sticky top-20 z-40 border-b border-white/5 backdrop-blur-3xl bg-black/45">
        <div className="max-w-7xl mx-auto px-6 py-3 space-y-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => switchTab('curriculum')}
              className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${
                activeTab === 'curriculum'
                  ? 'bg-blue-600 border-blue-500 text-white'
                  : 'bg-white/5 border-white/10 text-slate-500 hover:text-slate-300'
              }`}
            >
              <GraduationCap size={12} className="inline mr-1.5 -mt-0.5" />
              {t.tabCurriculum}
            </button>
            <button
              type="button"
              onClick={() => switchTab('calculators')}
              className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${
                activeTab === 'calculators'
                  ? 'bg-cyan-600 border-cyan-500 text-white'
                  : 'bg-white/5 border-white/10 text-slate-500 hover:text-slate-300'
              }`}
            >
              <Calculator size={12} className="inline mr-1.5 -mt-0.5" />
              {t.tabCalculators}
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={activeTab === 'calculators' ? t.calculatorsTabDesc : t.searchPlaceholder}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/40"
            />
          </div>
          {activeTab === 'curriculum' && (
          <div className="flex items-center gap-2 justify-end flex-wrap">
            <button
              type="button"
              onClick={() => setActiveYear(null)}
              className={`px-3 py-1 rounded-md text-[9px] font-black uppercase transition-all ${
                activeYear === null ? 'bg-blue-500 text-white' : 'bg-white/5 text-slate-500 hover:text-slate-300'
              }`}
            >
              {t.allYears}
            </button>
            {[1, 2, 3, 4].map((y) => (
              <button
                key={y}
                type="button"
                onClick={() => setActiveYear(activeYear === y ? null : y)}
                className={`px-3 py-1 rounded-md text-[9px] font-black uppercase transition-all ${
                  activeYear === y ? 'bg-blue-500 text-white' : 'bg-white/5 text-slate-500 hover:text-slate-300'
                }`}
              >
                {t.year} {y}
              </button>
            ))}
          </div>
          )}
          </div>
        </div>
      </div>

      <main className={`mx-auto px-6 pt-12 space-y-20 ${activeTab === 'calculators' ? 'max-w-[1900px]' : 'max-w-7xl'}`}>
        {activeTab === 'calculators' ? (
          <AcademyCalculatorHub externalSearch={search} />
        ) : (
          <>
        {/* Hero + stats */}
        <header className="relative">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-3 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[9px] font-mono font-bold text-blue-400 uppercase tracking-widest">
              <GraduationCap size={12} /> {t.badge}
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-none">
              {t.heroTitle1} <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-cyan-300">
                {t.heroTitle2}
              </span>
            </h1>
            <p className="text-lg text-slate-400 leading-relaxed max-w-2xl font-medium">{t.heroDesc}</p>
            <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest">
              {formatAcademyTemplate(t.progressLabel, { done: visited.length, total: stats.moduleCount })}
              {' · '}
              {formatAcademyTemplate(t.completionPercent, { pct: masteryPct })}
            </p>
            <div className="flex flex-wrap gap-3">
            <Link
              href={`/academy/${YEAR1_PATH[0]}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-[10px] font-black uppercase tracking-widest transition-colors"
            >
              <Route size={14} /> {t.startYear1Cta}
            </Link>
            {resumeSlug && (
              <Link
                href={`/academy/${resumeSlug}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-emerald-500/30 text-[10px] font-black uppercase tracking-widest text-slate-300 hover:text-emerald-300 transition-colors"
              >
                <ChevronRight size={14} /> {t.resumeLesson}: {resumeTitle}
              </Link>
            )}
            </div>
          </div>

          <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl">
            {[
              { label: t.statsModules, value: String(stats.moduleCount), icon: BookOpen },
              { label: t.statsHours, value: `${stats.totalHours}h`, icon: Activity },
              { label: t.statsLabs, value: String(stats.labCount), icon: Target },
              { label: t.statsStandards, value: String(stats.standardCount), icon: ShieldCheck },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                <Icon size={16} className="text-blue-400 mb-2" />
                <div className="text-2xl font-black text-white">{value}</div>
                <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">{label}</div>
              </div>
            ))}
          </div>
        </header>

        {/* How to learn */}
        <section className="p-8 md:p-10 rounded-[2rem] border border-white/5 bg-gradient-to-br from-indigo-950/20 to-transparent">
          <h2 className="text-xl font-black mb-6 flex items-center gap-2">
            <Lightbulb size={20} className="text-amber-400" /> {t.howToLearnTitle}
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { title: t.howToLearnStep1Title, desc: t.howToLearnStep1Desc, icon: BookOpen },
              { title: t.howToLearnStep2Title, desc: t.howToLearnStep2Desc, icon: Lightbulb },
              { title: t.howToLearnStep3Title, desc: t.howToLearnStep3Desc, icon: Calculator },
            ].map(({ title, desc, icon: Icon }) => (
              <div key={title} className="p-5 rounded-2xl bg-black/20 border border-white/5 space-y-2">
                <Icon size={18} className="text-blue-400" />
                <h3 className="text-sm font-black text-white">{title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Year 1 learning path */}
        {!search && (
          <section>
            <div className="mb-6">
              <h2 className="text-2xl font-black">{t.learningPathTitle}</h2>
              <p className="text-sm text-slate-500 mt-2 max-w-2xl">{t.learningPathDesc}</p>
            </div>
            <div className="relative">
              <div className="hidden md:block absolute top-8 left-8 right-8 h-px bg-gradient-to-r from-blue-500/40 via-emerald-500/30 to-transparent" />
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {year1Courses.map((course, i) => (
                  <Link
                    key={course.slug}
                    href={`/academy/${course.slug}`}
                    className="relative p-5 rounded-2xl bg-[#0a0e14] border border-white/5 hover:border-blue-500/30 transition-all group"
                  >
                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white text-xs font-black flex items-center justify-center mb-4">
                      {i + 1}
                    </div>
                    <h3 className="text-xs font-black text-white group-hover:text-blue-300 leading-snug">{course.title}</h3>
                    <p className="text-[10px] font-mono text-cyan-500/80 mt-2 line-clamp-2 leading-relaxed">
                      {course.summary.split('\n')[0]?.trim() || course.formula}
                    </p>
                    <p className="text-[9px] text-slate-600 mt-2">{course.readingTime} {t.minutesShort}</p>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Departments */}
        {filteredDepartments.length === 0 ? (
          <p className="text-center text-slate-500 py-16 text-sm">{t.noSearchResults}</p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {filteredDepartments.map((dept) => {
              const theme = DEPT_THEME[dept.color] ?? DEPT_THEME.blue;
              const outcomes = getDepartmentOutcomes(language, dept.id);
              const visibleCourses = dept.courses
                .filter((c) => activeYear === null || c.year === activeYear)
                .map((c) => enrichCourse(c, language));

              return (
                <section
                  key={dept.id}
                  className="p-1 rounded-[2.5rem] bg-gradient-to-br from-white/10 to-transparent border border-white/5"
                >
                  <div className="bg-[#0a0e14] rounded-[2.4rem] p-8 h-full flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <div className={`p-4 rounded-2xl border shadow-lg ${theme.iconBg}`}>{DEPT_ICONS[dept.id]}</div>
                        <div>
                          <h2 className="text-xl font-black text-white">{dept.title}</h2>
                          <p className={`text-[9px] font-bold uppercase tracking-[0.2em] mt-1 ${theme.headText}`}>
                            {dept.head}
                          </p>
                        </div>
                      </div>
                      <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[9px] font-mono text-slate-500 uppercase">
                        {dept.courses.length} {t.modules}
                      </div>
                    </div>

                    {outcomes.length > 0 && (
                      <div className="mb-6 p-4 rounded-xl bg-white/[0.02] border border-white/5">
                        <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">
                          {t.learningOutcomes}
                        </h3>
                        <ul className="space-y-1.5">
                          {outcomes.map((item) => (
                            <li key={item} className="text-[11px] text-slate-400 flex gap-2">
                              <span className="text-emerald-500 shrink-0">•</span>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="space-y-3 flex-1">
                      {visibleCourses.length === 0 ? (
                        <div className="py-10 text-center text-slate-600 text-xs font-bold uppercase italic opacity-50">
                          {activeYear !== null ? formatAcademyYear(t.noModules, activeYear) : t.noModules.replace(' {year}', '')}
                        </div>
                      ) : (
                        visibleCourses.map((course) => (
                          <AcademyCourseCard
                            key={course.slug}
                            course={course}
                            t={t}
                            difficultyLabel={difficultyLabel}
                            prereqTitle={resolvePrereqTitle}
                            visited={visited.includes(course.slug)}
                            categoryLabel={getAcademyCategoryLabel(course.category, language)}
                          />
                        ))
                      )}
                    </div>
                  </div>
                </section>
              );
            })}
          </div>
        )}

        {/* Databank */}
        <section className="p-12 rounded-[3rem] bg-blue-600/5 border border-blue-500/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-500/5 blur-[80px] pointer-events-none" />
          <div className="grid lg:grid-cols-3 gap-12 items-center relative z-10">
            <div className="lg:col-span-2">
              <h3 className="text-3xl font-black mb-4">{t.databankTitle}</h3>
              <p className="text-slate-400 text-sm leading-relaxed max-w-xl">{t.databankDesc}</p>
            </div>
            <div className="flex flex-col gap-4">
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 shadow-lg shadow-blue-500/10">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <div className="text-xs font-black uppercase">{t.standardVerified}</div>
                  <div className="text-[10px] text-slate-500 font-mono">{t.standardVerifiedDesc}</div>
                </div>
              </div>
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10">
                  <Activity size={24} />
                </div>
                <div>
                  <div className="text-xs font-black uppercase">{t.realTimeData}</div>
                  <div className="text-[10px] text-slate-500 font-mono">{t.realTimeDataDesc}</div>
                </div>
              </div>
            </div>
          </div>
        </section>
          </>
        )}
      </main>

      <footer className="mt-20 border-t border-white/5 py-12 px-6 bg-transparent">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <Hexagon size={18} className="text-blue-500" />
            <span className="text-sm font-black tracking-widest uppercase">{t.footerTitle}</span>
          </div>
          <div className="text-[10px] font-mono text-slate-600 uppercase tracking-widest">{t.footerSubtitle}</div>
        </div>
      </footer>
    </div>
  );
}

export default function FacultyPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-transparent" />}>
      <AcademyPageContent />
    </Suspense>
  );
}
