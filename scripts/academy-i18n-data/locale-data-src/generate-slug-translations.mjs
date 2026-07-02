/**
 * Generates slug-translations.mjs from EN sources + embedded per-slug locale tables.
 * Run: node scripts/academy-i18n-data/locale-data-src/generate-slug-translations.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ENRICHMENT_TABLES } from './translation-tables/enrichment.mjs';
import { BODY_TABLES } from './translation-tables/bodies.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..', '..', '..');
const ARTICLES = path.join(ROOT, 'src/data/academy-articles');

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
    out[slug] = JSON.parse(fs.readFileSync(path.join(ARTICLES, `${slug}.json`), 'utf8'));
  }
  return out;
}

const articles = loadArticles();

function mergeSlug(lang, slug, en) {
  const enrich = ENRICHMENT_TABLES[lang]?.[slug] ?? {};
  const body = BODY_TABLES[lang]?.[slug] ?? {};
  const out = {
    ...body,
    learningObjectives: enrich.learningObjectives ?? body.learningObjectives,
    keyTakeaways: enrich.keyTakeaways ?? body.keyTakeaways,
    supplementalParagraph: enrich.supplementalParagraph ?? body.supplementalParagraph,
  };
  if (!out.stepByStep && en.stepByStep) {
    throw new Error(`Missing stepByStep for ${lang}/${slug}`);
  }
  return out;
}

const SLUG_TRANSLATIONS = {};
for (const lang of LANGS) {
  SLUG_TRANSLATIONS[lang] = {};
  for (const slug of SLUGS) {
    SLUG_TRANSLATIONS[lang][slug] = mergeSlug(lang, slug, articles[slug]);
  }
}

const out = `/** Auto-generated — run: node scripts/academy-i18n-data/locale-data-src/generate-slug-translations.mjs */
export const SLUG_TRANSLATIONS = ${JSON.stringify(SLUG_TRANSLATIONS, null, 2)};
`;
fs.writeFileSync(path.join(__dirname, 'slug-translations.mjs'), out, 'utf8');
console.log('Wrote slug-translations.mjs');
