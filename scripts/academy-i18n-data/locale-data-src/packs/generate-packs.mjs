/**
 * Generates translation-packs.mjs from per-language pack modules.
 * Run: node scripts/academy-i18n-data/locale-data-src/packs/generate-packs.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LANGS = ['de', 'es', 'fr', 'it', 'pt', 'ru', 'zh', 'ja', 'ko', 'ar'];

const packs = {};
for (const lang of LANGS) {
  const mod = await import(`./${lang}.mjs`);
  packs[lang] = { ...mod.lessons, _extras: mod.extras };
}

const out = `/** Auto-generated — run packs/generate-packs.mjs */
export const LESSON_PACKS = ${JSON.stringify(packs, null, 2)};
`;

fs.writeFileSync(path.join(__dirname, '..', 'translation-packs.mjs'), out, 'utf8');
console.log('Wrote translation-packs.mjs for', LANGS.join(', '));
