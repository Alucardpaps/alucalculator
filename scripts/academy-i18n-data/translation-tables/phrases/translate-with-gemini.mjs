/**
 * Translates en-keys.json phrases to target languages via Gemini API.
 * Run: node scripts/academy-i18n-data/translation-tables/phrases/translate-with-gemini.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI } from '@google/generative-ai';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..', '..', '..', '..');
const enKeys = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', '..', 'seed-data-sources/en-keys.json'), 'utf8'),
);

const LANGS = [
  { code: 'de', name: 'German', note: 'Use German engineering terminology (DIN/VDI style).' },
  { code: 'es', name: 'Spanish', note: 'Latin American / international Spanish engineering terms.' },
  { code: 'fr', name: 'French', note: 'French engineering terminology.' },
  { code: 'it', name: 'Italian', note: 'Italian engineering terminology.' },
  { code: 'pt', name: 'Portuguese', note: 'Brazilian/international Portuguese engineering terms.' },
  { code: 'ru', name: 'Russian', note: 'Russian engineering terminology.' },
  { code: 'zh', name: 'Simplified Chinese', note: 'Simplified Chinese engineering terms.' },
  { code: 'ja', name: 'Japanese', note: 'Japanese engineering terminology (katakana for loanwords).' },
  { code: 'ko', name: 'Korean', note: 'Korean engineering terminology.' },
  { code: 'ar', name: 'Arabic', note: 'Modern Standard Arabic engineering terms, RTL.' },
];

function loadApiKey() {
  const envPath = path.join(ROOT, '.env.local');
  const raw = fs.readFileSync(envPath, 'utf8');
  const m = raw.match(/GEMINI_API_KEY=["']?([^"'\n]+)/);
  if (!m) throw new Error('GEMINI_API_KEY not found in .env.local');
  return m[1];
}

const genAI = new GoogleGenerativeAI(loadApiKey());
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

const BATCH = 40;
const cacheDir = path.join(__dirname, 'gemini-cache');
fs.mkdirSync(cacheDir, { recursive: true });

async function translateBatch(lang, batch, batchIdx) {
  const cacheFile = path.join(cacheDir, `${lang.code}-batch-${batchIdx}.json`);
  if (fs.existsSync(cacheFile)) {
    return JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
  }

  const prompt = `You are a professional technical translator for mechanical engineering academy content.

Translate the following English strings to ${lang.name}. ${lang.note}

Rules:
- Preserve ALL formulas, symbols, Greek letters (σ, τ, ε, δ, ΔP, etc.), units (mm, N, Pa, kW, rpm), and math notation exactly.
- Preserve variable labels like "L10", "Pcr", "ΣF", "ΣM", "K factor", ISO/DIN/VDI references.
- Do NOT leave any string in English.
- Return ONLY valid JSON: an array of ${batch.length} translated strings in the same order.
- Each array element is the translation of the corresponding English string.

English strings:
${JSON.stringify(batch, null, 2)}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error(`No JSON array in response for ${lang.code} batch ${batchIdx}: ${text.slice(0, 200)}`);
  const translated = JSON.parse(jsonMatch[0]);
  if (translated.length !== batch.length) {
    throw new Error(`${lang.code} batch ${batchIdx}: expected ${batch.length}, got ${translated.length}`);
  }
  fs.writeFileSync(cacheFile, JSON.stringify(translated, null, 2), 'utf8');
  console.log(`  Cached ${lang.code} batch ${batchIdx} (${translated.length} strings)`);
  await new Promise((r) => setTimeout(r, 5000));
  return translated;
}

async function translateLang(lang) {
  const outFile = path.join(__dirname, 'phrase-lists', `${lang.code}.mjs`);
  if (fs.existsSync(outFile)) {
    const mod = await import(`./phrase-lists/${lang.code}.mjs`);
    if (mod.PHRASE_LIST?.length === enKeys.length) {
      console.log(`Skip ${lang.code} — phrase-lists/${lang.code}.mjs already complete`);
      return;
    }
  }

  const all = [];
  for (let i = 0; i < enKeys.length; i += BATCH) {
    const batch = enKeys.slice(i, i + BATCH);
    const batchIdx = Math.floor(i / BATCH);
    console.log(`Translating ${lang.code} batch ${batchIdx + 1}/${Math.ceil(enKeys.length / BATCH)}...`);
    const translated = await translateBatch(lang, batch, batchIdx);
    all.push(...translated);
  }

  fs.mkdirSync(path.join(__dirname, 'phrase-lists'), { recursive: true });
  fs.writeFileSync(
    outFile,
    `export const PHRASE_LIST = ${JSON.stringify(all, null, 2)};\n`,
    'utf8',
  );
  console.log(`Wrote phrase-lists/${lang.code}.mjs (${all.length} phrases)`);
}

async function main() {
  for (const lang of LANGS) {
    console.log(`\n=== ${lang.code.toUpperCase()} ===`);
    await translateLang(lang);
  }

  // Build .mjs phrase maps
  const { execSync } = await import('child_process');
  execSync('node scripts/academy-i18n-data/translation-tables/phrases/build-from-lists.mjs', {
    cwd: ROOT,
    stdio: 'inherit',
  });
  console.log('\nPhrase maps complete.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
