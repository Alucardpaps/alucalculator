/**
 * Generates locale-data/{lang}.json from locale-data-src modules.
 * Run: node scripts/academy-i18n-data/generate-locale-data.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, 'locale-data');
const SRC = path.join(__dirname, 'locale-data-src');

const LANGS = ['de', 'es', 'fr', 'it', 'pt', 'ru', 'zh', 'ja', 'ko', 'ar'];

fs.mkdirSync(OUT, { recursive: true });

for (const lang of LANGS) {
  const modUrl = pathToFileURL(path.join(SRC, `${lang}.mjs`)).href;
  const mod = await import(modUrl);
  const pack = {
    lessons: mod.lessons ?? {},
    walkthroughs: mod.walkthroughs ?? {},
    quizzes: mod.quizzes ?? {},
    practice: mod.practice ?? {},
    seoTitles: mod.seoTitles ?? {},
    seoGuides: mod.seoGuides ?? {},
  };
  fs.writeFileSync(path.join(OUT, `${lang}.json`), JSON.stringify(pack, null, 2), 'utf8');
  console.log(`Wrote locale-data/${lang}.json (${Object.keys(pack.lessons).length} lessons)`);
}
