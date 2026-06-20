/**
 * Populates lang modules with full lesson/walkthrough/quiz translations.
 * Run: node scripts/fill-all-lesson-translations.mjs && npx tsx scripts/academy-i18n-data/build-all.ts
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LANGS_DIR = path.join(__dirname, 'academy-i18n-data', 'langs');

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

// Load pre-built translation bundles (UTF-8 JSON)
const DATA_DIR = path.join(__dirname, 'academy-i18n-data', 'bundles');
if (!fs.existsSync(DATA_DIR)) {
  console.error('Missing bundles dir. Run: node scripts/generate-translation-bundles.mjs');
  process.exit(1);
}

const LANGS = ['tr', 'de', 'es', 'fr', 'it', 'pt', 'ru', 'zh', 'ja', 'ko', 'ar'];

for (const lang of LANGS) {
  const bundlePath = path.join(DATA_DIR, `${lang}.json`);
  if (!fs.existsSync(bundlePath)) {
    console.error(`Missing ${bundlePath}`);
    process.exit(1);
  }
  const bundle = JSON.parse(fs.readFileSync(bundlePath, 'utf8'));
  const content = `export const lessons = ${JSON.stringify(bundle.lessons, null, 2)};

export const walkthroughs = ${JSON.stringify(bundle.walkthroughs, null, 2)};

export const quizzes = ${JSON.stringify(bundle.quizzes, null, 2)};

export const seoGuides = ${JSON.stringify(bundle.seoGuides, null, 2)};
`;
  fs.writeFileSync(path.join(LANGS_DIR, `${lang}.mjs`), content, 'utf8');
  console.log(`Filled ${lang}.mjs`);
}

console.log('Fill complete. Run build-all.ts next.');
