/**
 * Writes phrase-tables/{lang}.json from full/{lang}.mjs LIST arrays (416 items).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const enKeys = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', '..', 'seed-data-sources/en-keys.json'), 'utf8'),
);
const LANGS = ['es', 'fr', 'it', 'pt', 'ru', 'zh', 'ja', 'ko', 'ar'];
const outDir = path.join(__dirname, 'phrase-tables');

for (const lang of LANGS) {
  const mod = await import(`./full/${lang}.mjs`);
  const list = mod.LIST;
  if (list.length !== enKeys.length) throw new Error(`${lang}: ${list.length} vs ${enKeys.length}`);
  const obj = Object.fromEntries(enKeys.map((k, i) => [k, list[i]]));
  fs.writeFileSync(path.join(outDir, `${lang}.json`), JSON.stringify(obj, null, 2), 'utf8');
  console.log(`Wrote ${lang}.json`);
}
