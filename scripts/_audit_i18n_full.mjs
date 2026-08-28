import fs from 'fs';
import path from 'path';

const LANGS = ['en', 'tr', 'de', 'es', 'fr', 'it', 'pt', 'ru', 'zh', 'ja', 'ko', 'ar'];
const ROOT = path.resolve('src');

function extractTopKeys(src) {
  const keys = new Set();
  const re = /(?:^|\n)\s{4}([A-Za-z_][A-Za-z0-9_]*)\s*:/g;
  let m;
  while ((m = re.exec(src))) keys.add(m[1]);
  return keys;
}

function extractNestedKeys(src) {
  const keys = new Set();
  const re = /(?:^|\n)(\s{4,12})([A-Za-z_][A-Za-z0-9_]*)\s*:/g;
  let m;
  while ((m = re.exec(src))) keys.add(`${m[1].length}:${m[2]}`);
  return keys;
}

console.log('=== 1. Locale TS key coverage vs en.ts ===');
const enSrc = fs.readFileSync('src/locales/en.ts', 'utf8');
const enKeys = extractNestedKeys(enSrc);
console.log('en.ts nested keys', enKeys.size, 'bytes', enSrc.length);
for (const l of LANGS) {
  if (l === 'en') continue;
  const s = fs.readFileSync(`src/locales/${l}.ts`, 'utf8');
  const k = extractNestedKeys(s);
  const missing = [...enKeys].filter((x) => !k.has(x));
  console.log(
    `${l}.ts bytes=${s.length} keys=${k.size} missing=${missing.length}`,
    missing.slice(0, 15).join(', '),
  );
}

console.log('\n=== 2. dictionary.ts t() locale coverage ===');
const dict = fs.readFileSync('src/locales/dictionary.ts', 'utf8');
const tCalls = [...dict.matchAll(/t\(\{([\s\S]*?)\}\)/g)];
console.log('t() calls', tCalls.length);
const missingByLang = Object.fromEntries(LANGS.map((l) => [l, 0]));
const samples = [];
for (const m of tCalls) {
  const body = m[1];
  const langs = [...body.matchAll(/\b(en|tr|de|fr|es|it|pt|ru|ja|zh|ko|ar)\s*:/g)].map((x) => x[1]);
  const set = new Set(langs);
  for (const l of LANGS) if (!set.has(l)) missingByLang[l]++;
  if (!set.has('ko') || !set.has('ar')) {
    if (samples.length < 6) samples.push(body.replace(/\s+/g, ' ').slice(0, 140));
  }
}
console.log('t() missing locale counts', missingByLang);
console.log('samples missing ko/ar:\n', samples.join('\n---\n'));

console.log('\n=== 3. Record<Language> files missing lang keys ===');
const locFiles = fs.readdirSync('src/locales').filter((f) => f.endsWith('.ts'));
for (const f of locFiles) {
  const s = fs.readFileSync('src/locales/' + f, 'utf8');
  if (!s.includes('Record<Language')) continue;
  const found = new Set();
  for (const l of LANGS) {
    const re = new RegExp(`(?:^|[\\s{(,])${l}\\s*:`, 'm');
    const re2 = new RegExp(`['\"]${l}['\"]\\s*:`);
    if (re.test(s) || re2.test(s)) found.add(l);
  }
  if (found.size < 12) {
    const miss = LANGS.filter((l) => !found.has(l));
    console.log(f, 'found', found.size, 'missing', miss.join(','));
  } else {
    console.log(f, 'OK 12 langs');
  }
}

console.log('\n=== 4. JSON dictionaries missing keys ===');
function getFlatKeys(obj, prefix = '') {
  const keys = {};
  if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
    keys[prefix] = obj;
    return keys;
  }
  for (const k of Object.keys(obj)) {
    const p = prefix ? prefix + '.' + k : k;
    if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
      Object.assign(keys, getFlatKeys(obj[k], p));
    } else keys[p] = obj[k];
  }
  return keys;
}
const enJson = JSON.parse(fs.readFileSync('src/dictionaries/en.json', 'utf8'));
const enFlat = getFlatKeys(enJson);
for (const l of LANGS) {
  if (l === 'en') continue;
  const data = JSON.parse(fs.readFileSync(`src/dictionaries/${l}.json`, 'utf8'));
  const flat = getFlatKeys(data);
  const missing = Object.keys(enFlat).filter((k) => !(k in flat));
  console.log(l, 'missing', missing.length, missing.join(', '));
}

console.log('\n=== 5. handbook data locales ===');
const dataLoc = fs.readdirSync('src/data/locales');
console.log(dataLoc.join(', '));

console.log('\n=== 6. Pages using i18n vs not ===');
function walk(dir, acc = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, acc);
    else if (/\.(tsx|ts)$/.test(ent.name)) acc.push(p);
  }
  return acc;
}
const appFiles = walk('src/app');
const i18nRe = /useI18nStore|getDictionary|getSiteNav|getHomeStrings|get[A-Z][A-Za-z]+Strings|language/;
for (const f of appFiles) {
  if (f.includes(`${path.sep}api${path.sep}`)) continue;
  const s = fs.readFileSync(f, 'utf8');
  if (!/\.tsx$/.test(f)) continue;
  const uses = i18nRe.test(s);
  const hasHardcoded = /['"][A-Z][a-z]+ [a-z]+/.test(s);
  if (!uses) console.log('NO-I18N', f.replace(/\\/g, '/'));
}

console.log('\n=== 7. academyPageUiChrome langs ===');
const chrome = fs.readFileSync('src/locales/academyPageUiChrome.ts', 'utf8');
for (const l of LANGS) {
  const has = new RegExp(`['\"]${l}['\"]\\s*:`).test(chrome) || new RegExp(`(?:^|[\\s{(,])${l}\\s*:`).test(chrome);
  console.log('chrome', l, has);
}

console.log('\n=== 8. dictionary.ts encoding issues (mojibake-like missing accents) ===');
const bad = [...dict.matchAll(/[A-Za-z]{2,}(tres|metre|cul|sult|ncia|eset|aram|nit|ong|arge)[^a-z]/g)].slice(0, 20);
console.log('possible truncated FR/PT samples', bad.slice(0, 10).map((m) => m[0]));
const accentMissing = [
  'Paramtres',
  'Rsultats',
  'Rinitialiser',
  'Matriau',
  'Incio',
  'Mdulos',
  'Configuraes',
  'Tolerncias',
  'Rsistance',
  'Dure de Vie',
  'Tlerie',
  'Potncia',
  'Filetage Mtrique',
  'Units &',
  'Gnr par',
  'Dimenses',
  'Preo unitrio',
  'produo',
  'Peso unitrio',
  'Alsage',
  'Diamtre',
  'Explicao',
  'Tolrance',
  'Mtrique',
  'Imprial',
  'Frmula',
  'Tenso',
  'Scurit',
  'Segurana',
  'Distncia',
  'Sada',
  'Flche',
  'paisseur',
  'Cornire',
  'Barra slida',
];
let hits = 0;
for (const w of accentMissing) if (dict.includes(w)) hits++;
console.log('known truncated words present:', hits, '/', accentMissing.length);
