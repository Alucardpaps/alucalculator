/**
 * Builds locale-data-src/{lang}.mjs for de, es, fr, it, pt, ru, zh, ja, ko, ar.
 * Run: node scripts/academy-i18n-data/locale-data-src/build-all-src.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..', '..', '..');
const ARTICLES_DIR = path.join(ROOT, 'src/data/academy-articles');
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

function loadArticles() {
  const out = {};
  for (const slug of SLUGS) {
    out[slug] = JSON.parse(fs.readFileSync(path.join(ARTICLES_DIR, `${slug}.json`), 'utf8'));
  }
  return out;
}

// Import per-language bundles (lessons, walkthroughs, quizzes, practice, seoTitles)
const bundles = {};
for (const lang of LANGS) {
  const mod = await import(`./bundles/${lang}.mjs`);
  bundles[lang] = mod.default;
}

function serialize(obj) {
  return JSON.stringify(obj, null, 2);
}

for (const lang of LANGS) {
  const b = bundles[lang];
  const content = `/** Academy locale pack — ${lang} */
export const lessons = ${serialize(b.lessons)};

export const walkthroughs = ${serialize(b.walkthroughs)};

export const quizzes = ${serialize(b.quizzes)};

export const practice = ${serialize(b.practice)};

export const seoTitles = ${serialize(b.seoTitles)};
`;
  fs.writeFileSync(path.join(OUT_DIR, `${lang}.mjs`), content, 'utf8');
  console.log(`Wrote ${lang}.mjs (${Object.keys(b.lessons).length} lessons, ${Object.keys(b.seoTitles).length} seo titles)`);
}
