#!/usr/bin/env node
/**
 * Splits the master translation table (src/locales/t12table.json, one entry per English
 * key with all 11 translations) into one runtime chunk per language
 * (src/locales/t12/<lang>.json). The app loads only the active language's chunk, so the
 * full table never ships in page bundles.
 *
 * Run after editing t12table.json (prebuild/predev run it automatically):
 *   node scripts/build_t12_chunks.mjs          # write chunks
 *   node scripts/build_t12_chunks.mjs --check  # exit 1 when chunks are stale
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const master = join(root, 'src', 'locales', 't12table.json');
const outDir = join(root, 'src', 'locales', 't12');
const LANGS = ['tr', 'de', 'es', 'fr', 'it', 'pt', 'ru', 'zh', 'ja', 'ko', 'ar'];

const table = JSON.parse(readFileSync(master, 'utf8'));
const keys = Object.keys(table).sort();
const check = process.argv.includes('--check');
let stale = false;

if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
for (const lang of LANGS) {
  const chunk = {};
  for (const k of keys) {
    const v = table[k]?.[lang];
    if (typeof v === 'string' && v.length) chunk[k] = v;
  }
  const text = `${JSON.stringify(chunk)}\n`;
  const file = join(outDir, `${lang}.json`);
  const current = existsSync(file) ? readFileSync(file, 'utf8') : '';
  if (current === text) continue;
  stale = true;
  if (!check) writeFileSync(file, text);
}
if (check && stale) {
  console.error('t12 chunks are out of date — run: node scripts/build_t12_chunks.mjs');
  process.exit(1);
}
console.log(check ? 't12 chunks up to date' : `t12 chunks written (${keys.length} keys × ${LANGS.length} languages)`);
