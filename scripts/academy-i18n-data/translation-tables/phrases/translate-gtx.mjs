/**
 * Batch-translate en-keys via Google Translate gtx endpoint (unofficial).
 * Run: node scripts/academy-i18n-data/translation-tables/phrases/translate-gtx.mjs [lang]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const enKeys = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', '..', 'seed-data-sources/en-keys.json'), 'utf8'),
);

const TARGETS = {
  es: 'es',
  fr: 'fr',
  it: 'it',
  pt: 'pt',
  ru: 'ru',
  zh: 'zh-CN',
  ja: 'ja',
  ko: 'ko',
  ar: 'ar',
};

const langArg = process.argv[2];
const langs = langArg ? [langArg] : Object.keys(TARGETS);
const outDir = path.join(__dirname, 'phrase-tables');

async function translateBatch(texts, tl) {
  const q = texts.map((t) => encodeURIComponent(t)).join('&q=');
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${tl}&dt=t&q=${q}`;
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  // data[0] is array of [translated, original, ...] per segment
  const out = [];
  let idx = 0;
  for (const seg of data[0]) {
    out.push(seg[0]);
    idx++;
  }
  if (out.length !== texts.length) {
    // fallback: translate one by one
    const single = [];
    for (const t of texts) {
      const u = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${tl}&dt=t&q=${encodeURIComponent(t)}`;
      const r = await fetch(u, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      const d = await r.json();
      single.push(d[0][0][0]);
      await new Promise((x) => setTimeout(x, 200));
    }
    return single;
  }
  return out;
}

async function translateLang(code) {
  const tl = TARGETS[code];
  const outFile = path.join(outDir, `${code}.json`);
  if (fs.existsSync(outFile)) {
    const ex = JSON.parse(fs.readFileSync(outFile, 'utf8'));
    if (Object.keys(ex).length === enKeys.length) {
      console.log(`Skip ${code}`);
      return;
    }
  }
  const obj = {};
  const BATCH = 20;
  for (let i = 0; i < enKeys.length; i += BATCH) {
    const batch = enKeys.slice(i, i + BATCH);
    process.stdout.write(`\r${code} ${Math.min(i + BATCH, enKeys.length)}/${enKeys.length}`);
    const translated = await translateBatch(batch, tl);
    batch.forEach((k, j) => {
      obj[k] = translated[j];
    });
    fs.writeFileSync(outFile, JSON.stringify(obj, null, 2), 'utf8');
    await new Promise((r) => setTimeout(r, 500));
  }
  console.log(`\nWrote ${code}.json`);
}

for (const code of langs) {
  console.log(`\n=== ${code} ===`);
  await translateLang(code);
}
