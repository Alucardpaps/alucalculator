/**
 * Builds per-language pack modules and final locale-data-src/*.mjs files.
 * Run: node scripts/academy-i18n-data/locale-data-src/packs/build-packs.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC_DIR = path.join(__dirname, '..');
const PACKS_DIR = __dirname;
const LANGS = ['de', 'es', 'fr', 'it', 'pt', 'ru', 'zh', 'ja', 'ko', 'ar'];

const { LESSONS, EXTRAS } = await import('../translation-data.mjs');
const seoAll = JSON.parse(fs.readFileSync(path.join(PACKS_DIR, 'seo-titles.json'), 'utf8'));

for (const lang of LANGS) {
  const lessons = LESSONS[lang];
  const extras = EXTRAS[lang];
  if (!lessons || !extras) throw new Error(`Missing data for ${lang}`);

  const pack = {
    lessons,
    walkthroughs: extras.walkthroughs,
    quizzes: extras.quizzes,
    practice: extras.practice,
    seoTitles: seoAll[lang],
  };

  const mjs = `/** Academy locale pack — ${lang} */
export const lessons = ${JSON.stringify(pack.lessons, null, 2)};

export const walkthroughs = ${JSON.stringify(pack.walkthroughs, null, 2)};

export const quizzes = ${JSON.stringify(pack.quizzes, null, 2)};

export const practice = ${JSON.stringify(pack.practice, null, 2)};

export const seoTitles = ${JSON.stringify(pack.seoTitles, null, 2)};
`;
  fs.writeFileSync(path.join(SRC_DIR, `${lang}.mjs`), mjs, 'utf8');
  console.log(`Wrote ${lang}.mjs`);
}
