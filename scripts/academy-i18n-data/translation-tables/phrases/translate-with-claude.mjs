/**
 * Batch-translate en-keys.json to phrase-tables/{lang}.json via Anthropic API.
 * Run: node scripts/academy-i18n-data/translation-tables/phrases/translate-with-claude.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..', '..', '..', '..');
const enKeys = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', '..', 'seed-data-sources/en-keys.json'), 'utf8'),
);

const LANGS = [
  { code: 'de', name: 'German' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
  { code: 'zh', name: 'Simplified Chinese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'ar', name: 'Arabic' },
];

function loadApiKey() {
  const raw = fs.readFileSync(path.join(ROOT, '.env.local'), 'utf8');
  const m = raw.match(/ANTHROPIC_API_KEY=["']?([^"'\n]+)/);
  if (!m) throw new Error('ANTHROPIC_API_KEY not found');
  return m[1];
}

const apiKey = loadApiKey();
const outDir = path.join(__dirname, 'phrase-tables');
fs.mkdirSync(outDir, { recursive: true });

const BATCH = 80;

async function callClaude(prompt) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 16000,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Claude API ${res.status}: ${err.slice(0, 500)}`);
  }
  const data = await res.json();
  return data.content[0].text;
}

async function translateLang(lang) {
  const outFile = path.join(outDir, `${lang.code}.json`);
  if (fs.existsSync(outFile)) {
    const existing = JSON.parse(fs.readFileSync(outFile, 'utf8'));
    if (Object.keys(existing).length === enKeys.length) {
      console.log(`Skip ${lang.code} — already complete`);
      return;
    }
  }

  const all = {};
  for (let i = 0; i < enKeys.length; i += BATCH) {
    const batch = enKeys.slice(i, i + BATCH);
    const batchIdx = Math.floor(i / BATCH) + 1;
    const total = Math.ceil(enKeys.length / BATCH);
    console.log(`${lang.code} batch ${batchIdx}/${total}...`);

    const prompt = `Translate these ${batch.length} mechanical engineering academy strings from English to ${lang.name}.

Rules:
- Preserve formulas, Greek symbols (σ, τ, ε, δ, ΔP), units (mm, N, Pa, kW), math notation, ISO/DIN/VDI refs.
- Do NOT leave English text.
- Return ONLY a JSON object mapping each EXACT English string to its translation (same keys as input).

Input strings:
${JSON.stringify(batch, null, 2)}`;

    const text = await callClaude(prompt);
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error(`No JSON for ${lang.code} batch ${batchIdx}`);
    const parsed = JSON.parse(jsonMatch[0]);
    Object.assign(all, parsed);
    await new Promise((r) => setTimeout(r, 1000));
  }

  const missing = enKeys.filter((k) => !all[k]);
  if (missing.length) {
    console.warn(`${lang.code}: ${missing.length} missing after batch — filling individually`);
    for (const key of missing) {
      const text = await callClaude(
        `Translate to ${lang.name} (engineering context). Return ONLY the translated string, no quotes:\n\n${key}`,
      );
      all[key] = text.trim().replace(/^["']|["']$/g, '');
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  fs.writeFileSync(outFile, JSON.stringify(all, null, 2), 'utf8');
  console.log(`Wrote phrase-tables/${lang.code}.json (${Object.keys(all).length} entries)`);
}

async function main() {
  for (const lang of LANGS) {
    console.log(`\n=== ${lang.code.toUpperCase()} ===`);
    await translateLang(lang);
  }
  console.log('\nDone. Run compose-phrases.mjs next.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
