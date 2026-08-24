import type { AcademyEngineWalkthrough } from '@/data/academyEngineWalkthroughs';
import type { QuizQuestion } from '@/data/academyQuizzes';

export type LocalizedPracticeLabels = {
  fields: Record<string, { label?: string; unit?: string }>;
  results: Record<string, { label?: string; detail?: string }>;
};

export type LocalizedLessonFields = {
  meta?: Partial<{ title: string; description: string }>;
  hero?: Partial<{ h1: string; intro: string }>;
  formula?: Partial<{ variables: Record<string, string> }>;
  stepByStep?: string[];
  example?: Partial<{ inputs: string[]; calculation: string }>;
  whyThisMatters?: string[];
  commonMistakes?: string[];
  engineeringTip?: string;
  faq?: Array<{ question: string; answer: string }>;
  learningObjectives?: string[];
  keyTakeaways?: string[];
  calculatorCta?: Partial<{ label: string }>;
  supplementalParagraph?: string;
  /** SEO guide card title override */
  title?: string;
  checklist?: string[];
  pitfalls?: string[];
  practical?: string;
};

export type AcademyLessonLocaleBundle = {
  lessons: Record<string, LocalizedLessonFields>;
  seoGuides: Record<string, Partial<LocalizedLessonFields>>;
  walkthroughs: Record<string, Partial<AcademyEngineWalkthrough>>;
  quizzes: Record<string, QuizQuestion[]>;
  practice: Record<string, LocalizedPracticeLabels>;
};

export const CORE_LESSON_SLUGS = [
  'engineering-units-and-standards',
  'fundamentals-of-statics',
  'introduction-to-machine-elements',
  'thread-geometry-standards',
  'how-to-calculate-bolt-torque',
  'bearing-life-calculation-explained',
  'motor-power-calculation',
  'mechanics-of-materials-fundamentals',
  'mohrs-circle-stress-analysis',
  'torsion-and-buckling-mechanics',
  'beam-deflection-formula-explained',
  'pressure-drop-calculation-guide',
  'chip-breaker-logic',
] as const;

export type CoreLessonSlug = (typeof CORE_LESSON_SLUGS)[number];
