import calculatorsData from '@/data/seo-calculators/calculators.json';
import { SEOCalculatorData } from '@/components/os/SEOPage';
import { getSeoGuideCourses } from '@/data/academySeoCourses';
import type { QuizQuestion } from '@/data/academyQuizzes';

const GENERIC_CTA_LINKS = new Set(['/os?module=calculator', '/os', '/']);

const seoBySlug = new Map(
  (calculatorsData as unknown as SEOCalculatorData[]).map((c) => [c.slug, c]),
);

export type AcademySeoLessonViewModel = {
  slug: string;
  category: string;
  meta: { title: string; description: string };
  hero: { h1: string; intro: string };
  formula: { equation: string; variables: Record<string, string> };
  stepByStep: string[];
  technicalData: { name: string; rows: Record<string, string | number>[] }[];
  checklist: string[];
  pitfalls: string[];
  practical: string;
  example?: string;
  faq: Array<{ question: string; answer: string }>;
  calculatorHref: string;
  workspaceHref?: string;
  workspaceLabel?: string;
  relatedGuides: Array<{ slug: string; title: string }>;
  readingTime: number;
  year: number;
};

function cleanSeoTitle(title: string): string {
  return title
    .replace(/\s*&\s*Engineering Guide\s*-\s*AluCalc\s*$/i, '')
    .replace(/\s*Calculator\s*$/i, '')
    .trim();
}

function yearForCategory(category: string | undefined): number {
  switch (category?.toLowerCase()) {
    case 'science':
    case 'electrical':
      return 1;
    case 'manufacturing':
    case 'fasteners':
      return 3;
    case 'structural':
    case 'structures':
    case 'civil':
    case 'aerospace':
    case 'fluid':
    case 'fluids':
      return 2;
    default:
      return 2;
  }
}

export function findSeoCalculatorBySlug(slug: string): SEOCalculatorData | undefined {
  return seoBySlug.get(slug);
}

export function getSeoGuideSlugsExcludingArticles(articleSlugs: string[]): string[] {
  const articleSet = new Set(articleSlugs);
  return getSeoGuideCourses()
    .map((c) => c.slug)
    .filter((slug) => !articleSet.has(slug));
}

export function seoCalculatorToLessonViewModel(calc: SEOCalculatorData): AcademySeoLessonViewModel {
  const category = calc.category?.toLowerCase() ?? 'mechanical';
  const steps = (calc.seo.step_by_step ?? '')
    .split('\n')
    .map((s) => s.replace(/^\d+\.\s*/, '').trim())
    .filter(Boolean);

  const checklist = calc.seo.checklist ?? [];
  const pitfalls = calc.seo.pitfalls ?? [];
  const faqFromSeo = (calc.seo.faq ?? []).map((f) => ({
    question: f.q,
    answer: f.a,
  }));

  const faq =
    faqFromSeo.length > 0
      ? faqFromSeo
      : checklist.slice(0, 4).map((item) => ({
          question: `Why should you "${item}" in design?`,
          answer: `This post-calculation check is part of the engineering workflow for ${cleanSeoTitle(calc.title)}. Skipping it can lead to unsafe or non-compliant designs.`,
        }));

  const workspaceLink = calc.cta?.link;
  const hasWorkspace =
    workspaceLink && !GENERIC_CTA_LINKS.has(workspaceLink) && !workspaceLink.startsWith('/os?');

  return {
    slug: calc.slug,
    category,
    meta: calc.meta,
    hero: {
      h1: calc.seo.h1.replace(/\s*&\s*Engineering Guide\s*-\s*AluCalc\s*$/i, '').trim(),
      intro: calc.seo.intro,
    },
    formula: {
      equation: calc.seo.formula,
      variables: calc.seo.variables ?? {},
    },
    stepByStep: steps,
    technicalData: calc.seo.technical_data ?? [],
    checklist,
    pitfalls,
    practical: calc.seo.practical ?? '',
    example: calc.seo.example,
    faq,
    calculatorHref: `/calculators/${calc.slug}`,
    workspaceHref: hasWorkspace ? workspaceLink : undefined,
    workspaceLabel: hasWorkspace ? calc.cta.label : undefined,
    relatedGuides: getRelatedSeoGuides(calc, 3),
    readingTime: 12,
    year: yearForCategory(category),
  };
}

export function getRelatedSeoGuides(
  calc: SEOCalculatorData,
  limit = 3,
): Array<{ slug: string; title: string }> {
  const category = calc.category?.toLowerCase() ?? 'mechanical';
  const guides = getSeoGuideCourses().filter(
    (c) => c.slug !== calc.slug && (c.category ?? '').toLowerCase() === category,
  );
  const pool = guides.length >= limit ? guides : getSeoGuideCourses().filter((c) => c.slug !== calc.slug);
  return pool.slice(0, limit).map((c) => ({ slug: c.slug, title: c.title }));
}

/** Build a 3-question quiz from pitfalls and checklist items. */
export function generateSeoGuideQuiz(pitfalls: string[], checklist: string[]): QuizQuestion[] {
  const items: { text: string; type: 'pitfall' | 'check' }[] = [
    ...pitfalls.slice(0, 2).map((text) => ({ text, type: 'pitfall' as const })),
    ...checklist.slice(0, 2).map((text) => ({ text, type: 'check' as const })),
  ];

  if (items.length === 0) {
    return [
      {
        id: 'seo-default-1',
        question: 'When should you run post-calculation design checks?',
        options: [
          'After applying the governing formula',
          'Only at project completion',
          'Never — formulas are sufficient',
          'Before defining inputs',
        ],
        correctIndex: 0,
        explanation: 'Design checks validate assumptions and catch unit or regime errors before release.',
      },
      {
        id: 'seo-default-2',
        question: 'What is the primary purpose of an engineering guide lesson?',
        options: [
          'Link theory to a live calculator',
          'Replace standards documents',
          'Skip hand calculations entirely',
          'Archive obsolete methods',
        ],
        correctIndex: 0,
        explanation: 'Guides connect handbook formulas with interactive verification in AluCalc.',
      },
      {
        id: 'seo-default-3',
        question: 'Technical reference tables in a guide typically provide:',
        options: [
          'Material constants and limits',
          'Marketing copy',
          'User interface themes',
          'Random sample data',
        ],
        correctIndex: 0,
        explanation: 'Tables supply coefficients, moduli, and limits used in the calculation steps.',
      },
    ];
  }

  const questions: QuizQuestion[] = [];
  const used = new Set<string>();

  for (let i = 0; i < Math.min(3, items.length); i++) {
    const item = items[i];
    const short = item.text.length > 90 ? `${item.text.slice(0, 87)}…` : item.text;
    const id = `seo-${item.type}-${i}`;

    if (item.type === 'pitfall') {
      questions.push({
        id,
        question: `Which practice should you AVOID?`,
        options: [
          item.text,
          'Verify units before calculation',
          'Document assumptions in the worksheet',
          'Cross-check against a second method',
        ],
        correctIndex: 0,
        explanation: `"${short}" is a documented pitfall — avoiding it prevents common design errors.`,
      });
    } else {
      questions.push({
        id,
        question: `Which design check is recommended?`,
        options: [
          'Skip validation to save time',
          item.text,
          'Ignore boundary conditions',
          'Use inconsistent units',
        ],
        correctIndex: 1,
        explanation: `"${short}" is listed in the design checklist for this calculation.`,
      });
    }
    used.add(id);
  }

  while (questions.length < 3) {
    const filler = pitfalls[questions.length] ?? checklist[questions.length] ?? 'Verify all inputs';
    questions.push({
      id: `seo-fill-${questions.length}`,
      question: `Best practice #${questions.length + 1} for this calculation:`,
      options: [filler, 'Ignore safety factors', 'Mix SI and Imperial silently', 'Skip documentation'],
      correctIndex: 0,
      explanation: `Engineering guides emphasize: ${filler}`,
    });
  }

  return questions.slice(0, 3);
}
