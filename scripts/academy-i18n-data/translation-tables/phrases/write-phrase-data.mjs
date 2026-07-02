/**
 * Writes phrase-tables/{lang}.json from embedded PHRASE_DATA arrays (416 strings each, en-keys order).
 * Run: node scripts/academy-i18n-data/translation-tables/phrases/write-phrase-data.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PHRASE_DATA } from './phrase-data.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const enKeys = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', '..', 'seed-data-sources/en-keys.json'), 'utf8'),
);
const outDir = path.join(__dirname, 'phrase-tables');
fs.mkdirSync(outDir, { recursive: true });

for (const [lang, list] of Object.entries(PHRASE_DATA)) {
  if (list.length !== enKeys.length) {
    throw new Error(`${lang}: expected ${enKeys.length}, got ${list.length}`);
  }
  const obj = Object.fromEntries(enKeys.map((k, i) => [k, list[i]]));
  fs.writeFileSync(path.join(outDir, `${lang}.json`), JSON.stringify(obj, null, 2), 'utf8');
  console.log(`Wrote phrase-tables/${lang}.json`);
}
