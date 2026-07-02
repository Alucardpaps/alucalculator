/**
 * Generates locale-data-src/{lang}.mjs with full academy translations.
 * Run: node scripts/academy-i18n-data/locale-data-src/write-all-locales.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..', '..', '..');
const ARTICLES_DIR = path.join(ROOT, 'src/data/academy-articles');
const LANGS_DIR = path.join(__dirname, '..', 'langs');
const OUT_DIR = __dirname;
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

const seoAll = JSON.parse(fs.readFileSync(path.join(__dirname, 'bundles/seo-titles.json'), 'utf8'));

// Import translation data
const { LESSON_PACKS } = await import('./translation-packs.mjs');
const trExtrasUrl = pathToFileURL(path.join(LANGS_DIR, 'tr-academy-extras.mjs')).href;
const trExtras = await import(trExtrasUrl);

function loadArticles() {
  const out = {};
  for (const slug of SLUGS) {
    out[slug] = JSON.parse(fs.readFileSync(path.join(ARTICLES_DIR, `${slug}.json`), 'utf8'));
  }
  return out;
}

const articles = loadArticles();

function buildLessons(lang) {
  const pack = LESSON_PACKS[lang];
  if (!pack) throw new Error(`Missing lesson pack for ${lang}`);
  const lessons = {};
  for (const slug of SLUGS) {
    const en = articles[slug];
    const t = pack[slug];
    if (!t) throw new Error(`Missing lesson translation ${lang}/${slug}`);
    lessons[slug] = {
      meta: { description: t.meta.description },
      hero: { intro: t.hero.intro },
      ...(t.formula?.variables ? { formula: { variables: t.formula.variables } } : {}),
      ...(t.stepByStep ? { stepByStep: t.stepByStep } : {}),
      ...(t.example ? { example: t.example } : {}),
      ...(t.whyThisMatters ? { whyThisMatters: t.whyThisMatters } : {}),
      ...(t.commonMistakes ? { commonMistakes: t.commonMistakes } : {}),
      ...(t.engineeringTip ? { engineeringTip: t.engineeringTip } : {}),
      ...(t.calculatorCta ? { calculatorCta: { label: t.calculatorCta.label } } : {}),
      ...(t.faq ? { faq: t.faq } : {}),
      ...(t.learningObjectives ? { learningObjectives: t.learningObjectives } : {}),
      ...(t.keyTakeaways ? { keyTakeaways: t.keyTakeaways } : {}),
      ...(t.supplementalParagraph ? { supplementalParagraph: t.supplementalParagraph } : {}),
    };
    // sanity: no English intro left for non-EN (check first paragraph differs from EN)
    if (t.hero.intro === en.hero.intro) {
      console.warn(`WARN: ${lang}/${slug} intro may still be English`);
    }
  }
  return lessons;
}

async function loadExtrasMap() {
  try {
    const mod = await import('../translation-tables/extras-map.mjs');
    return mod.EXTRAS_MAP ?? null;
  } catch {
    return null;
  }
}

const extrasMap = await loadExtrasMap();

function buildExtras(lang) {
  if (extrasMap?.[lang]) return extrasMap[lang];
  const extras = LESSON_PACKS[lang]?._extras;
  if (extras) return extras;
  console.warn(`WARN: using TR extras fallback for ${lang}`);
  return {
    walkthroughs: trExtras.walkthroughs,
    quizzes: trExtras.quizzes,
    practice: trExtras.practice,
  };
}

for (const lang of LANGS) {
  const pack = {
    lessons: buildLessons(lang),
    walkthroughs: buildExtras(lang).walkthroughs,
    quizzes: buildExtras(lang).quizzes,
    practice: buildExtras(lang).practice,
    seoTitles: seoAll[lang],
  };
  const content = `/** Academy locale pack — ${lang} */
export const lessons = ${JSON.stringify(pack.lessons, null, 2)};

export const walkthroughs = ${JSON.stringify(pack.walkthroughs, null, 2)};

export const quizzes = ${JSON.stringify(pack.quizzes, null, 2)};

export const practice = ${JSON.stringify(pack.practice, null, 2)};

export const seoTitles = ${JSON.stringify(pack.seoTitles, null, 2)};
`;
  fs.writeFileSync(path.join(OUT_DIR, `${lang}.mjs`), content, 'utf8');
  console.log(
    `Wrote ${lang}.mjs — ${Object.keys(pack.lessons).length} lessons, ${Object.keys(pack.walkthroughs).length} walkthroughs, ${Object.keys(pack.quizzes).length} quizzes`,
  );
}
