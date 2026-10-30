import type { LessonStep, LocalizedString, DiagramVectorOption, VisualCard } from '../DuolingoCurriculumData';
import { fillLoc12 } from '@/locales/hydrateLocalized';

export function L(tr: string, en: string): LocalizedString {
  return fillLoc12({
    tr,
    en,
    de: en,
    es: en,
    fr: en,
    it: en,
    pt: en,
    ru: en,
    zh: en,
    ja: en,
    ko: en,
    ar: en,
  });
}

export function mc(
  id: string,
  qTr: string,
  qEn: string,
  opts: [string, string][],
  correct: number,
  expTr: string,
  expEn: string,
): LessonStep {
  return {
    id,
    type: 'multiple_choice',
    questionData: {
      question: L(qTr, qEn),
      options: opts.map(([tr, en]) => L(tr, en)),
      correctIndex: correct,
      explanation: L(expTr, expEn),
    },
  };
}

export function calc(
  id: string,
  pTr: string,
  pEn: string,
  target: number,
  tol: number,
  unit: string,
  hint: string,
  solTr: string,
  solEn: string,
): LessonStep {
  return {
    id,
    type: 'calculation_input',
    calculationData: {
      prompt: L(pTr, pEn),
      targetValue: target,
      tolerance: tol,
      unit,
      formulaHint: hint,
      stepByStepSolution: L(solTr, solEn),
    },
  };
}

export function draw(
  id: string,
  pTr: string,
  pEn: string,
  vectors: { id: string; tr: string; en: string; direction: DiagramVectorOption['direction']; ok: boolean }[],
  expTr: string,
  expEn: string,
): LessonStep {
  return {
    id,
    type: 'diagram_draw',
    diagramData: {
      prompt: L(pTr, pEn),
      vectorOptions: vectors.map((v) => ({
        id: v.id,
        label: L(v.tr, v.en),
        direction: v.direction,
        isCorrect: v.ok,
      })),
      explanation: L(expTr, expEn),
    },
  };
}

export function vis(
  id: string,
  pTr: string,
  pEn: string,
  cards: { id: string; titleTr: string; titleEn: string; descTr: string; descEn: string; diagram: VisualCard['diagramSvgType']; ok: boolean }[],
  expTr: string,
  expEn: string,
): LessonStep {
  return {
    id,
    type: 'visual_select',
    visualData: {
      prompt: L(pTr, pEn),
      cards: cards.map((c) => ({
        id: c.id,
        title: L(c.titleTr, c.titleEn),
        description: L(c.descTr, c.descEn),
        diagramSvgType: c.diagram,
        isCorrect: c.ok,
      })),
      explanation: L(expTr, expEn),
    },
  };
}

export type Bank = Record<string, LessonStep[]>;
