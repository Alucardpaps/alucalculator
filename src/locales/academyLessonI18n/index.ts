import type { Language } from '@/store/i18nStore';
import type { AcademyArticle } from '@/schemas/academy-article';
import type { AcademySeoLessonViewModel } from '@/lib/academySeoLesson';
import type { AcademyEngineWalkthrough } from '@/data/academyEngineWalkthroughs';
import { ACADEMY_ENGINE_WALKTHROUGHS } from '@/data/academyEngineWalkthroughs';
import { ACADEMY_QUIZZES, type QuizQuestion } from '@/data/academyQuizzes';
import { ACADEMY_LESSON_ENRICHMENT } from '@/data/academyLessonEnrichment';
import type { AcademyLessonLocaleBundle, LocalizedLessonFields } from './types';
import { mergeLessonFieldsIntoArticle, mergeLessonFieldsIntoSeoLesson } from './merge';
import { getAcademyPage } from '@/locales/academyPageTranslations';
import { getPracticeConfig, type PracticeConfig } from '@/data/academyPractice';

import { TR_BUNDLE } from './locales/tr';
import { DE_BUNDLE } from './locales/de';
import { ES_BUNDLE } from './locales/es';
import { FR_BUNDLE } from './locales/fr';
import { IT_BUNDLE } from './locales/it';
import { PT_BUNDLE } from './locales/pt';
import { RU_BUNDLE } from './locales/ru';
import { ZH_BUNDLE } from './locales/zh';
import { JA_BUNDLE } from './locales/ja';
import { KO_BUNDLE } from './locales/ko';
import { AR_BUNDLE } from './locales/ar';

const EMPTY_BUNDLE: AcademyLessonLocaleBundle = {
  lessons: {},
  seoGuides: {},
  walkthroughs: {},
  quizzes: {},
  practice: {},
};

const LOCALE_BUNDLES: Record<Language, AcademyLessonLocaleBundle> = {
  en: EMPTY_BUNDLE,
  tr: TR_BUNDLE,
  de: DE_BUNDLE,
  es: ES_BUNDLE,
  fr: FR_BUNDLE,
  it: IT_BUNDLE,
  pt: PT_BUNDLE,
  ru: RU_BUNDLE,
  zh: ZH_BUNDLE,
  ja: JA_BUNDLE,
  ko: KO_BUNDLE,
  ar: AR_BUNDLE,
};

function getBundle(locale: Language): AcademyLessonLocaleBundle {
  return LOCALE_BUNDLES[locale] ?? EMPTY_BUNDLE;
}

export function localizeAcademyArticle(article: AcademyArticle, locale: Language): AcademyArticle {
  if (locale === 'en') return article;
  const fields = getBundle(locale).lessons[article.slug];
  if (!fields) return article;
  return mergeLessonFieldsIntoArticle(article, fields);
}

export function localizeSeoLesson(
  lesson: AcademySeoLessonViewModel,
  locale: Language,
): AcademySeoLessonViewModel {
  if (locale === 'en') return lesson;
  const fields = getBundle(locale).seoGuides[lesson.slug];
  if (!fields) return lesson;
  return mergeLessonFieldsIntoSeoLesson(lesson, fields);
}

export type LessonEnrichmentView = {
  learningObjectives: string[];
  keyTakeaways: string[];
  supplementalParagraph?: string;
};

export function localizeLessonEnrichment(slug: string, locale: Language): LessonEnrichmentView | undefined {
  const bundle = getBundle(locale);
  const localized = bundle.lessons[slug];
  const enEnrichment = ACADEMY_LESSON_ENRICHMENT[slug];

  const learningObjectives =
    localized?.learningObjectives ?? enEnrichment?.learningObjectives;
  const keyTakeaways = localized?.keyTakeaways ?? enEnrichment?.keyTakeaways;
  const supplementalParagraph =
    localized?.supplementalParagraph ?? enEnrichment?.supplementalParagraph;

  if (!learningObjectives?.length && !keyTakeaways?.length && !supplementalParagraph) {
    return undefined;
  }

  return {
    learningObjectives: learningObjectives ?? [],
    keyTakeaways: keyTakeaways ?? [],
    supplementalParagraph,
  };
}

export function localizeWalkthrough(
  slug: string,
  locale: Language,
): AcademyEngineWalkthrough | undefined {
  const en = ACADEMY_ENGINE_WALKTHROUGHS[slug];
  if (!en) return undefined;
  if (locale === 'en') return en;
  const localized = getBundle(locale).walkthroughs[slug];
  if (!localized) return en;
  return {
    ...en,
    ...localized,
    inputs: localized.inputs ?? en.inputs,
    outputs: localized.outputs ?? en.outputs,
    steps: localized.steps ?? en.steps,
  };
}

export function getLocalizedQuiz(
  slug: string,
  locale: Language,
  faqFallback?: Array<{ question: string; answer: string }>,
): QuizQuestion[] {
  const bundle = getBundle(locale);
  if (locale !== 'en' && bundle.quizzes[slug]?.length) return bundle.quizzes[slug];
  if (locale === 'en' && ACADEMY_QUIZZES[slug]?.length) return ACADEMY_QUIZZES[slug];
  if (!faqFallback?.length) return [];
  const chrome = getAcademyPage(locale);
  return faqFallback.slice(0, 2).map((f, i) => ({
    id: `faq-${i}`,
    question: f.question,
    options: [f.answer.slice(0, 80), chrome.quizOptionNone, chrome.quizOptionDepends, chrome.quizOptionNA],
    correctIndex: 0,
    explanation: f.answer,
  }));
}

export function getLocalizedPracticeConfig(slug: string, locale: Language): PracticeConfig | undefined {
  const base = getPracticeConfig(slug);
  if (!base) return undefined;
  if (locale === 'en') return base;
  const labels = getBundle(locale).practice[slug];
  if (!labels) return base;
  return {
    fields: base.fields.map((field) => ({
      ...field,
      label: labels.fields[field.key]?.label ?? field.label,
      unit: labels.fields[field.key]?.unit ?? field.unit,
    })),
    compute: (values) =>
      base.compute(values).map((result) => ({
        ...result,
        label: labels.results[result.label]?.label ?? result.label,
        detail: labels.results[result.label]?.detail ?? result.detail,
      })),
  };
}

export function localizeCourseTitle(slug: string, enTitle: string, locale: Language): string {
  if (locale === 'en') return enTitle;
  const bundle = getBundle(locale);
  const lesson = bundle.lessons[slug];
  if (lesson?.meta?.title) return lesson.meta.title;
  const guide = bundle.seoGuides[slug];
  if (guide?.title) return guide.title;
  if (guide?.meta?.title) return guide.meta.title;
  if (guide?.hero?.h1) return guide.hero.h1;
  return enTitle;
}

export function getLocalizedSeoGuideSummary(
  slug: string,
  enIntro: string,
  locale: Language,
): string {
  if (locale === 'en') return enIntro;
  const guide = getBundle(locale).seoGuides[slug];
  const intro = guide?.hero?.intro;
  if (intro) return intro;
  return enIntro;
}
