import type { AcademyArticle } from '@/schemas/academy-article';
import type { AcademySeoLessonViewModel } from '@/lib/academySeoLesson';
import type { LocalizedLessonFields } from './types';

function mergePartial<T extends object>(base: T, override?: any): T {
  if (!override) return base;
  const out = { ...base };
  for (const key of Object.keys(override) as (keyof T)[]) {
    const val = override[key];
    if (val !== undefined) {
      out[key] = val as T[keyof T];
    }
  }
  return out;
}

export function mergeLessonFieldsIntoArticle(
  article: AcademyArticle,
  fields: LocalizedLessonFields,
): AcademyArticle {
  const merged: AcademyArticle = {
    ...article,
    meta: mergePartial(article.meta, fields.meta),
    hero: mergePartial(article.hero, fields.hero),
    formula: {
      equation: article.formula.equation,
      variables: fields.formula?.variables
        ? { ...article.formula.variables, ...fields.formula.variables }
        : article.formula.variables,
    },
    stepByStep: fields.stepByStep ?? article.stepByStep,
    example: mergePartial(article.example, fields.example),
    whyThisMatters: fields.whyThisMatters ?? article.whyThisMatters,
    commonMistakes: fields.commonMistakes ?? article.commonMistakes,
    engineeringTip: fields.engineeringTip ?? article.engineeringTip,
    faq: fields.faq ?? article.faq,
    learningObjectives: fields.learningObjectives ?? article.learningObjectives,
    keyTakeaways: fields.keyTakeaways ?? article.keyTakeaways,
    calculatorCta: mergePartial(article.calculatorCta, fields.calculatorCta),
  };
  return merged;
}

export function mergeLessonFieldsIntoSeoLesson(
  lesson: AcademySeoLessonViewModel,
  fields: Partial<LocalizedLessonFields>,
): AcademySeoLessonViewModel {
  const title = fields.title ?? fields.meta?.title ?? fields.hero?.h1;
  return {
    ...lesson,
    meta: mergePartial(lesson.meta, fields.meta),
    hero: mergePartial(lesson.hero, fields.hero),
    formula: {
      equation: lesson.formula.equation,
      variables: fields.formula?.variables
        ? { ...lesson.formula.variables, ...fields.formula.variables }
        : lesson.formula.variables,
    },
    stepByStep: fields.stepByStep ?? lesson.stepByStep,
    checklist: fields.checklist ?? lesson.checklist,
    pitfalls: fields.pitfalls ?? lesson.pitfalls,
    practical: fields.practical ?? lesson.practical,
    example: fields.example?.calculation ?? lesson.example,
    faq: fields.faq ?? lesson.faq,
    relatedGuides: title
      ? lesson.relatedGuides.map((g) =>
          g.slug === lesson.slug ? g : { ...g, title: fields.title ?? g.title },
        )
      : lesson.relatedGuides,
  };
}
