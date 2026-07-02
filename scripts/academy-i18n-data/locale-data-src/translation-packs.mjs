/**
 * Builds LESSON_PACKS for write-all-locales.mjs from intro-desc + per-slug translations.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { INTRO_DESC } from '../seed-data-sources/intro-desc.mjs';
import { SLUG_TRANSLATIONS } from './slug-translations.mjs';
import { walkthroughs as trWalkthroughs, quizzes as trQuizzes, practice as trPractice } from '../langs/tr-academy-extras.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..', '..', '..');
const ARTICLES_DIR = path.join(ROOT, 'src/data/academy-articles');

const SLUGS = [
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
];

const LANGS = ['de', 'es', 'fr', 'it', 'pt', 'ru', 'zh', 'ja', 'ko', 'ar'];

function loadArticles() {
  const out = {};
  for (const slug of SLUGS) {
    out[slug] = JSON.parse(fs.readFileSync(path.join(ARTICLES_DIR, `${slug}.json`), 'utf8'));
  }
  return out;
}

const articles = loadArticles();

function pickFields(en, t) {
  return {
    ...(t.formula?.variables
      ? { formula: { variables: t.formula.variables } }
      : en.formula?.variables
        ? { formula: { variables: Object.fromEntries(Object.entries(en.formula.variables).map(([k, v]) => [k, t.formula?.variables?.[k] ?? t.formula?.variables?.[v] ?? v])) } }
        : {}),
    ...(t.stepByStep ? { stepByStep: t.stepByStep } : {}),
    ...(t.example ? { example: t.example } : {}),
    ...(t.whyThisMatters ? { whyThisMatters: t.whyThisMatters } : {}),
    ...(t.commonMistakes ? { commonMistakes: t.commonMistakes } : {}),
    ...(t.engineeringTip ? { engineeringTip: t.engineeringTip } : {}),
    ...(t.calculatorCta ? { calculatorCta: t.calculatorCta } : en.calculatorCta ? { calculatorCta: { label: t.calculatorCta?.label ?? en.calculatorCta.label } } : {}),
    ...(t.faq ? { faq: t.faq } : {}),
    ...(t.learningObjectives ? { learningObjectives: t.learningObjectives } : {}),
    ...(t.keyTakeaways ? { keyTakeaways: t.keyTakeaways } : {}),
    ...(t.supplementalParagraph ? { supplementalParagraph: t.supplementalParagraph } : {}),
  };
}

export const LESSON_PACKS = {};

for (const lang of LANGS) {
  LESSON_PACKS[lang] = {};
  LESSON_PACKS[lang]._extras = {
    walkthroughs: trWalkthroughs,
    quizzes: trQuizzes,
    practice: trPractice,
  };
  for (const slug of SLUGS) {
    const id = INTRO_DESC[lang]?.[slug];
    const t = SLUG_TRANSLATIONS[lang]?.[slug];
    if (!id || !t) throw new Error(`Missing translation ${lang}/${slug}`);
    LESSON_PACKS[lang][slug] = {
      meta: { description: id.description },
      hero: { intro: id.intro },
      ...pickFields(articles[slug], t),
    };
  }
}
