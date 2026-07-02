import type { AcademyArticle } from '@/schemas/academy-article';
import calculatorsData from '@/data/seo-calculators/calculators.json';
import { SEOCalculatorData } from '@/components/os/SEOPage';
import type { AcademyCourse } from '@/locales/academyPageTranslations';

import howToCalculateBoltTorque from '@/data/academy-articles/how-to-calculate-bolt-torque.json';
import bearingLife from '@/data/academy-articles/bearing-life-calculation-explained.json';
import motorPower from '@/data/academy-articles/motor-power-calculation.json';
import mechanicsOfMaterials from '@/data/academy-articles/mechanics-of-materials-fundamentals.json';
import mohrsCircle from '@/data/academy-articles/mohrs-circle-stress-analysis.json';
import torsionBuckling from '@/data/academy-articles/torsion-and-buckling-mechanics.json';
import beamDeflection from '@/data/academy-articles/beam-deflection-formula-explained.json';
import threadGeometry from '@/data/academy-articles/thread-geometry-standards.json';
import chipBreaker from '@/data/academy-articles/chip-breaker-logic.json';
import engineeringUnits from '@/data/academy-articles/engineering-units-and-standards.json';
import fundamentalsStatics from '@/data/academy-articles/fundamentals-of-statics.json';
import introMachineElements from '@/data/academy-articles/introduction-to-machine-elements.json';
import pressureDrop from '@/data/academy-articles/pressure-drop-calculation-guide.json';
import { getAcademyCalculatorRoute } from '@/data/academyCalculatorRoutes';
import { getSeoGuideCourses } from '@/data/academySeoCourses';
import { localizeCourseTitle, getLocalizedSeoGuideSummary, localizeAcademyArticle } from '@/locales/academyLessonI18n';
import type { Language } from '@/store/i18nStore';
import { ACADEMY_PRACTICE } from '@/data/academyPractice';

/** Estimated read time for SEO engineering-guide lessons (minutes). */
export const SEO_GUIDE_READING_MINUTES = 10;

const STANDARD_PATTERN =
  /\b(ISO|VDI|DIN|ASME|ANSI|IEEE|AISC|ACI|AGMA|NFPA|IEC|ASTM|Euler|Roark)\b/gi;

export const ACADEMY_ARTICLES: AcademyArticle[] = [
  howToCalculateBoltTorque,
  bearingLife,
  motorPower,
  mechanicsOfMaterials,
  mohrsCircle,
  torsionBuckling,
  beamDeflection,
  threadGeometry,
  chipBreaker,
  engineeringUnits,
  fundamentalsStatics,
  introMachineElements,
  pressureDrop,
] as AcademyArticle[];

export const INTERACTIVE_LAB_SLUGS = new Set([
  'how-to-calculate-bolt-torque',
  'mohrs-circle-stress-analysis',
]);

export const YEAR1_PATH = [
  'engineering-units-and-standards',
  'fundamentals-of-statics',
  'introduction-to-machine-elements',
  'thread-geometry-standards',
] as const;

const articleBySlug = new Map(ACADEMY_ARTICLES.map((a) => [a.slug, a]));

const seoCalculatorBySlug = new Map(
  (calculatorsData as unknown as SEOCalculatorData[]).map((c) => [c.slug, c]),
);

export function getAcademyArticle(slug: string): AcademyArticle | undefined {
  return articleBySlug.get(slug);
}

export function getAcademyStats() {
  const seoGuides = getSeoGuideCourses();
  const articleMinutes = ACADEMY_ARTICLES.reduce(
    (sum, a) => sum + Math.max(a.readingTime, 12),
    0,
  );
  const guideMinutes = seoGuides.length * SEO_GUIDE_READING_MINUTES;
  const totalMinutes = articleMinutes + guideMinutes;

  const practiceCount = Object.keys(ACADEMY_PRACTICE).length;
  const interactiveLabCount = INTERACTIVE_LAB_SLUGS.size;

  const standards = new Set<string>();
  const collectStandards = (text: string) => {
    for (const match of text.matchAll(STANDARD_PATTERN)) {
      standards.add(match[0].toUpperCase());
    }
  };

  for (const article of ACADEMY_ARTICLES) {
    collectStandards(
      [
        article.meta.description,
        article.hero.intro,
        ...(article.stepByStep ?? []),
        ...(article.faq?.map((f) => f.answer) ?? []),
      ].join(' '),
    );
  }

  for (const guide of seoGuides) {
    const seo = seoCalculatorBySlug.get(guide.slug);
    if (!seo) continue;
    collectStandards(
      [
        seo.meta.description,
        seo.seo?.intro,
        seo.seo?.step_by_step,
        seo.seo?.practical,
        seo.title,
      ]
        .filter(Boolean)
        .join(' '),
    );
  }

  return {
    moduleCount: ACADEMY_ARTICLES.length + seoGuides.length,
    articleCount: ACADEMY_ARTICLES.length,
    guideCount: seoGuides.length,
    totalHours: Math.round((totalMinutes / 60) * 10) / 10,
    labCount: interactiveLabCount + practiceCount,
    interactiveLabCount,
    practiceCount,
    standardCount: standards.size,
  };
}

export type EnrichedCourse = {
  slug: string;
  title: string;
  year: number;
  ref: string;
  summary: string;
  difficulty: AcademyArticle['difficulty'];
  readingTime: number;
  prerequisites: string[];
  calculatorSlug: string;
  formula: string;
  hasLab: boolean;
  isSeoGuide?: boolean;
  category?: string;
};

export function enrichCourse(course: AcademyCourse, locale: Language = 'en'): EnrichedCourse {
  if (course.kind === 'guide') {
    const seo = seoCalculatorBySlug.get(course.slug);
    const enIntro = seo?.seo?.intro ?? course.title;
    const intro = getLocalizedSeoGuideSummary(course.slug, enIntro, locale);
    const title = localizeCourseTitle(course.slug, course.title, locale);
    return {
      ...course,
      title,
      summary: intro.slice(0, 160).trim() + (intro.length > 160 ? '…' : ''),
      difficulty: 'Intermediate',
      readingTime: SEO_GUIDE_READING_MINUTES,
      prerequisites: [],
      calculatorSlug: `/${course.slug}`,
      formula: seo?.seo?.formula ?? '',
      hasLab: false,
      isSeoGuide: true,
      category: course.category,
    };
  }

  const rawArticle = getAcademyArticle(course.slug);
  const article = rawArticle ? localizeAcademyArticle(rawArticle, locale) : undefined;
  const enTitle = article?.meta.title ?? course.title;
  const title = localizeCourseTitle(course.slug, enTitle, locale);
  const summarySource = article?.meta.description ?? article?.hero.intro ?? course.title;
  return {
    ...course,
    title,
    summary: summarySource.slice(0, 160).trim() + (summarySource.length > 160 ? '…' : '') || title,
    difficulty: article?.difficulty ?? 'Intermediate',
    readingTime: article?.readingTime ?? 8,
    prerequisites: article?.prerequisites ?? [],
    calculatorSlug: getAcademyCalculatorRoute(course.slug)?.href ?? article?.calculatorCta.targetSlug ?? '',
    formula: article?.formula.equation ?? '',
    hasLab: INTERACTIVE_LAB_SLUGS.has(course.slug),
  };
}
