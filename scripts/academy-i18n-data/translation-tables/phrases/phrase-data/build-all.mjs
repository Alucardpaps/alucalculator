/**
 * Assembles phrase-data parts into phrase-tables/{lang}.json
 * Run: node scripts/academy-i18n-data/translation-tables/phrases/phrase-data/build-all.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const enKeys = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', '..', '..', 'seed-data-sources/en-keys.json'), 'utf8'),
);
const LANGS = ['de', 'es', 'fr', 'it', 'pt', 'ru', 'zh', 'ja', 'ko', 'ar'];
const outDir = path.join(__dirname, '..', 'phrase-tables');
fs.mkdirSync(outDir, { recursive: true });

for (const lang of LANGS) {
  const list = [];
  let partIdx = 0;
  while (true) {
    const partPath = path.join(__dirname, `${lang}-p${partIdx}.mjs`);
    if (!fs.existsSync(partPath)) break;
    const mod = await import(`./${lang}-p${partIdx}.mjs`);
    list.push(...mod.PART);
    partIdx++;
  }
  if (!list.length) {
    console.warn(`Skip ${lang} — no parts found`);
    continue;
  }
  if (list.length !== enKeys.length) {
    throw new Error(`${lang}: expected ${enKeys.length}, got ${list.length}`);
  }
  const obj = Object.fromEntries(enKeys.map((k, i) => [k, list[i]]));
  fs.writeFileSync(path.join(outDir, `${lang}.json`), JSON.stringify(obj, null, 2), 'utf8');
  console.log(`Wrote phrase-tables/${lang}.json (${list.length})`);
}
