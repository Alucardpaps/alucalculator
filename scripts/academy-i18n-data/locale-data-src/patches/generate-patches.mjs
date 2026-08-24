/**
 * Generates lesson-patches.mjs from per-language patch modules.
 * Run: node scripts/academy-i18n-data/locale-data-src/patches/generate-patches.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LANGS = ['de', 'es', 'fr', 'it', 'pt', 'ru', 'zh', 'ja', 'ko', 'ar'];

const PATCHES = {};
for (const lang of LANGS) {
  const mod = await import(`./${lang}.mjs`);
  PATCHES[lang] = mod.default;
}

fs.writeFileSync(
  path.join(__dirname, '..', 'lesson-patches.mjs'),
  `export const PATCHES = ${JSON.stringify(PATCHES, null, 2)};\n`,
  'utf8',
);
console.log('Wrote lesson-patches.mjs');
