/**
 * Builds phrases/{lang}.mjs from phrase-lists/{lang}.mjs arrays aligned to en-keys.json.
 * Run: node scripts/academy-i18n-data/translation-tables/phrases/build-from-lists.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const enKeys = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', '..', 'seed-data-sources/en-keys.json'), 'utf8'),
);
const LANGS = ['de', 'es', 'fr', 'it', 'pt', 'ru', 'zh', 'ja', 'ko', 'ar'];

for (const lang of LANGS) {
  const mod = await import(`./phrase-lists/${lang}.mjs`);
  const list = mod.PHRASE_LIST;
  if (list.length !== enKeys.length) {
    throw new Error(`${lang}: expected ${enKeys.length} phrases, got ${list.length}`);
  }
  const PHRASES = Object.fromEntries(enKeys.map((k, i) => [k, list[i]]));
  fs.writeFileSync(
    path.join(__dirname, `${lang}.mjs`),
    `export const PHRASES = ${JSON.stringify(PHRASES, null, 2)};\n`,
    'utf8',
  );
  console.log(`Wrote phrases/${lang}.mjs (${Object.keys(PHRASES).length} entries)`);
}
