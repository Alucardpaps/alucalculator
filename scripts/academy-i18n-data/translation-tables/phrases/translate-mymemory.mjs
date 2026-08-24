/**
 * Translates en-keys to target langs via MyMemory free API (rate-limited).
 * Run: node scripts/academy-i18n-data/translation-tables/phrases/translate-mymemory.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const enKeys = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', '..', 'seed-data-sources/en-keys.json'), 'utf8'),
);

const LANGS = [
  { code: 'es', pair: 'en|es' },
  { code: 'fr', pair: 'en|fr' },
  { code: 'it', pair: 'en|it' },
  { code: 'pt', pair: 'en|pt' },
  { code: 'ru', pair: 'en|ru' },
  { code: 'zh', pair: 'en|zh-CN' },
  { code: 'ja', pair: 'en|ja' },
  { code: 'ko', pair: 'en|ko' },
  { code: 'ar', pair: 'en|ar' },
];

const outDir = path.join(__dirname, 'phrase-tables');
fs.mkdirSync(outDir, { recursive: true });

async function translate(text, pair) {
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${pair}`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.responseStatus !== 200) {
    throw new Error(`MyMemory error: ${JSON.stringify(data).slice(0, 200)}`);
  }
  return data.responseData.translatedText;
}

async function translateLang({ code, pair }) {
  const outFile = path.join(outDir, `${code}.json`);
  if (fs.existsSync(outFile)) {
    const ex = JSON.parse(fs.readFileSync(outFile, 'utf8'));
    if (Object.keys(ex).length === enKeys.length) {
      console.log(`Skip ${code}`);
      return;
    }
  }
  const obj = {};
  for (let i = 0; i < enKeys.length; i++) {
    const key = enKeys[i];
    process.stdout.write(`\r${code} ${i + 1}/${enKeys.length}`);
    try {
      obj[key] = await translate(key, pair);
    } catch (e) {
      console.error(`\nFailed ${code} idx ${i}:`, e.message);
      await new Promise((r) => setTimeout(r, 5000));
      obj[key] = await translate(key, pair);
    }
    if ((i + 1) % 10 === 0) {
      fs.writeFileSync(outFile, JSON.stringify(obj, null, 2), 'utf8');
    }
    await new Promise((r) => setTimeout(r, 350));
  }
  fs.writeFileSync(outFile, JSON.stringify(obj, null, 2), 'utf8');
  console.log(`\nWrote ${code}.json`);
}

for (const lang of LANGS) {
  console.log(`\n=== ${lang.code} ===`);
  await translateLang(lang);
}
