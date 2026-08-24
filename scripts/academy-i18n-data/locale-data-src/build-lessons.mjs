/**
 * Builds lang-lessons.mjs and lang-extras.mjs from EN articles + translation patches.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..', '..', '..');
const ARTICLES_DIR = path.join(ROOT, 'src/data/academy-articles');
const LANGS = ['de', 'es', 'fr', 'it', 'pt', 'ru', 'zh', 'ja', 'ko', 'ar'];

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

const { PATCHES } = await import('./lesson-patches.mjs');
const engineeringUnits = (await import('./lessons/engineering-units-and-standards.mjs')).default;

function loadEn(slug) {
  return JSON.parse(fs.readFileSync(path.join(ARTICLES_DIR, `${slug}.json`), 'utf8'));
}

function buildLesson(lang, slug, en) {
  if (slug === 'engineering-units-and-standards') return engineeringUnits[lang];
  const p = PATCHES[lang]?.[slug];
  if (!p) throw new Error(`Missing patch ${lang}/${slug}`);
  return {
    meta: { description: p.meta.description },
    hero: { intro: p.hero.intro },
    ...(en.formula?.variables && p.formula?.variables ? { formula: { variables: p.formula.variables } } : {}),
    stepByStep: p.stepByStep,
    example: p.example,
    whyThisMatters: p.whyThisMatters,
    commonMistakes: p.commonMistakes,
    engineeringTip: p.engineeringTip,
    calculatorCta: { label: p.calculatorCta.label },
    faq: p.faq,
    learningObjectives: p.learningObjectives,
    keyTakeaways: p.keyTakeaways,
    ...(p.supplementalParagraph ? { supplementalParagraph: p.supplementalParagraph } : {}),
  };
}

const LANG_LESSONS = {};
for (const lang of LANGS) {
  LANG_LESSONS[lang] = {};
  for (const slug of SLUGS) {
    LANG_LESSONS[lang][slug] = buildLesson(lang, slug, loadEn(slug));
  }
}

fs.writeFileSync(
  path.join(__dirname, 'lang-lessons.mjs'),
  `export const LANG_LESSONS = ${JSON.stringify(LANG_LESSONS, null, 2)};\n`,
  'utf8',
);
console.log('Wrote lang-lessons.mjs');
