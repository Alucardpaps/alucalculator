import type { CurriculumLesson, CurriculumUnit, LessonStep } from './DuolingoCurriculumData';
import { QUESTION_BANK } from './academyQuestions';

/**
 * Her derse, o dersin slug’ına özel soru bankasını ekler.
 * Orijinal konsept + 1 müfredat sorusu korunur; banka ~6 özgün soru daha katar
 * (başlık başına ortalama ~7 soru). Ünite havuzundan rotasyon / tekrar yok.
 */
export function enrichCurriculum(units: CurriculumUnit[]): CurriculumUnit[] {
  return units.map((unit) => ({
    ...unit,
    lessons: unit.lessons.map((lesson) => {
      const extras: LessonStep[] = (QUESTION_BANK[lesson.slug] ?? []).map((step, i) => ({
        ...step,
        id: `${lesson.id}-x${i + 1}`,
      }));
      return { ...lesson, steps: [...lesson.steps, ...extras] } satisfies CurriculumLesson;
    }),
  }));
}
