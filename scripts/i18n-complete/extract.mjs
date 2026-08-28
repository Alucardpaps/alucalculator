import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();

const dict = fs.readFileSync(path.join(ROOT, 'src/locales/dictionary.ts'), 'utf8');
const tCalls = [...dict.matchAll(/t\(\{([\s\S]*?)\}\)/g)];
const ens = [];
for (const m of tCalls) {
  const body = m[1];
  const en = body.match(/en:\s*"((?:\\.|[^"])*)"/);
  const langs = [...body.matchAll(/\b(en|tr|de|fr|es|it|pt|ru|ja|zh|ko|ar)\s*:/g)].map((x) => x[1]);
  if (en && (!langs.includes('ko') || !langs.includes('ar'))) ens.push(en[1]);
}
const unique = [...new Set(ens)];
fs.writeFileSync(path.join(ROOT, 'scripts/i18n-complete/_en_need_koar.json'), JSON.stringify(unique, null, 2));
console.log('unique en needing ko/ar', unique.length);

function get(obj, p) {
  return p.split('.').reduce((o, k) => o && o[k], obj);
}
const enjson = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/dictionaries/en.json'), 'utf8'));
const trjson = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/dictionaries/tr.json'), 'utf8'));
const missing = [
  'nav.mechanical', 'nav.civil', 'nav.electrical', 'nav.science', 'nav.finance', 'nav.software', 'nav.other',
  'modules.thermalExpansion.title', 'modules.thermalExpansion.desc',
  'modules.manufacturingSandbox.title', 'modules.manufacturingSandbox.desc',
  'modules.simulationFea.title', 'modules.simulationFea.desc',
  'modules.analytics.title', 'modules.analytics.desc',
  'modules.fileExplorer.title', 'modules.fileExplorer.desc',
  'modules.terminal.title', 'modules.terminal.desc',
  'modules.settings.title', 'modules.settings.desc',
  'gear.outputs.tipDia', 'gear.outputs.rootDia',
  'beam-deflection.title', 'beam-deflection.desc',
  'concrete-reinforcement.title', 'concrete-reinforcement.desc',
  'ohms-law.title', 'ohms-law.desc',
  'voltage-drop.title', 'voltage-drop.desc',
  'periodic-table.title', 'periodic-table.desc',
  'calculator.title', 'calculator.desc',
  'vat-calculator.title', 'vat-calculator.desc',
  'excel-helper.title', 'excel-helper.desc',
  'json-formatter.title', 'json-formatter.desc',
  'regex-tester.title', 'regex-tester.desc',
  'feedback.title', 'feedback.desc',
  'thermal.initialLength', 'thermal.tempDelta', 'thermal.finalLength', 'thermal.expansion', 'thermal.strain',
];
const out = {};
for (const k of missing) out[k] = { en: get(enjson, k), tr: get(trjson, k) };
fs.writeFileSync(path.join(ROOT, 'scripts/i18n-complete/_json_missing.json'), JSON.stringify(out, null, 2));
console.log('json missing', Object.keys(out).length);

function loadLocaleTs(src) {
  let s = src
    .replace(/^\uFEFF/, '')
    .replace(/\/\/.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/as Record<[^>]+>/g, '')
    .replace(/\bas const\b/g, '');
  s = s.replace(/export default \w+\s*;?\s*$/m, '');
  if (/^export default\s*\{/m.test(s)) {
    s = s.replace(/^export default\s*/, 'const __loc = ');
  } else {
    s = s.replace(/^const \w+\s*=\s*/, 'const __loc = ');
  }
  try {
    return new Function(`${s}\n; return __loc;`)();
  } catch (e) {
    console.error('parse fail', e.message);
    return null;
  }
}

function flatKeys(obj, prefix = '') {
  const keys = {};
  if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
    keys[prefix] = obj;
    return keys;
  }
  for (const k of Object.keys(obj)) {
    const p = prefix ? prefix + '.' + k : k;
    if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
      Object.assign(keys, flatKeys(obj[k], p));
    } else keys[p] = obj[k];
  }
  return keys;
}

const enTs = loadLocaleTs(fs.readFileSync(path.join(ROOT, 'src/locales/en.ts'), 'utf8'));
if (!enTs) process.exit(1);
const enFlat = flatKeys(enTs);
const missingByLang = {};
for (const l of ['tr', 'de', 'es', 'fr', 'it', 'pt', 'ru', 'zh', 'ja', 'ko', 'ar']) {
  const loc = loadLocaleTs(fs.readFileSync(path.join(ROOT, `src/locales/${l}.ts`), 'utf8'));
  if (!loc) {
    console.log('FAILED parse', l);
    continue;
  }
  const flat = flatKeys(loc);
  const miss = {};
  for (const k of Object.keys(enFlat)) {
    if (!(k in flat)) miss[k] = enFlat[k];
  }
  missingByLang[l] = miss;
  console.log(l, 'parsed keys', Object.keys(flat).length, 'missing', Object.keys(miss).length);
}
fs.writeFileSync(path.join(ROOT, 'scripts/i18n-complete/_locale_ts_missing.json'), JSON.stringify(missingByLang, null, 2));

const sidebar = fs.readFileSync(path.join(ROOT, 'src/locales/sidebarTranslations.ts'), 'utf8');
console.log('sidebar item blocks', (sidebar.match(/'[\w-]+':\s*\{/g) || []).length);

const enDict = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/locales/en_dict.json'), 'utf8'));
const lens = Object.values(enDict).map((v) => String(v).length);
console.log('handbook en entries', Object.keys(enDict).length, 'avg len', (lens.reduce((a, b) => a + b, 0) / lens.length).toFixed(1));