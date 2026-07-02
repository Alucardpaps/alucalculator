/**
 * Patches page-level locale TS files with full 12-language support.
 * Run: node scripts/build-page-i18n.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { DASHBOARD_FULL } from './i18n-data/dashboard/index.mjs';
import { DEDICATED_FULL } from './i18n-data/dedicated/index.mjs';
import { WORKSTATION_FULL } from './i18n-data/workstation/index.mjs';
import { CALC_MODULES_FULL } from './i18n-data/calculators-modules/index.mjs';
import { HOME_FOOTER_FULL } from './i18n-data/home-footer/index.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const LOCALES = path.join(ROOT, 'src/locales');
const LANGS = ['de', 'es', 'fr', 'it', 'pt', 'ru', 'ja', 'zh', 'ko', 'ar'];

function serializeValue(v, indent) {
  const pad = ' '.repeat(indent);
  if (typeof v === 'string') return JSON.stringify(v);
  if (Array.isArray(v)) {
    if (v.every((x) => typeof x === 'string')) {
      return `[\n${v.map((s) => `${pad}    ${JSON.stringify(s)},`).join('\n')}\n${pad}]`;
    }
    return JSON.stringify(v);
  }
  if (v && typeof v === 'object') {
    const lines = Object.entries(v).map(([k, val]) => {
      const ser = serializeValue(val, indent + 4);
      if (ser.includes('\n')) return `${pad}    ${k}: ${ser},`;
      return `${pad}    ${k}: ${ser},`;
    });
    return `{\n${lines.join('\n')}\n${pad}}`;
  }
  return JSON.stringify(v);
}

function serializeObject(obj, indent = 4) {
  const pad = ' '.repeat(indent);
  const lines = Object.entries(obj).map(([k, v]) => {
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      return `${pad}${k}: ${serializeValue(v, indent)},`;
    }
    if (Array.isArray(v)) {
      return `${pad}${k}: ${serializeValue(v, indent)},`;
    }
    return `${pad}${k}: ${JSON.stringify(v)},`;
  });
  return `{\n${lines.join('\n')}\n${' '.repeat(Math.max(0, indent - 4))}}`;
}

function patchDashboard() {
  const constBlocks = LANGS.map(
    (lang) => `const ${lang.toUpperCase()}: DashboardPageStrings = ${serializeObject(DASHBOARD_FULL[lang])};`,
  ).join('\n\n');
  const map = `const MAP: Record<Language, DashboardPageStrings> = {
  en: EN,
  tr: TR,
${LANGS.map((l) => `  ${l}: ${l.toUpperCase()},`).join('\n')}
};`;
  const file = path.join(LOCALES, 'dashboardTranslations.ts');
  let src = fs.readFileSync(file, 'utf8');
  src = src.replace(/const MAP: Record<Language, DashboardPageStrings> = \{[\s\S]*?\};/, map);
  if (!src.includes('const DE: DashboardPageStrings')) {
    src = src.replace(/(const TR: DashboardPageStrings[\s\S]*?\n\};)\n\nconst MAP/, `$1\n\n${constBlocks}\n\nconst MAP`);
  } else {
    src = src.replace(/const DE: DashboardPageStrings[\s\S]*?(?=const MAP)/, `${constBlocks}\n\n`);
  }
  fs.writeFileSync(file, src, 'utf8');
  console.log('Patched dashboardTranslations.ts');
}

function patchDedicated() {
  const constBlocks = LANGS.map(
    (lang) => `const ${lang.toUpperCase()}: DedicatedCalcPageStrings = ${serializeObject(DEDICATED_FULL[lang])};`,
  ).join('\n\n');
  const map = `const MAP: Record<Language, DedicatedCalcPageStrings> = {
  en: EN,
  tr: TR,
${LANGS.map((l) => `  ${l}: ${l.toUpperCase()},`).join('\n')}
};`;
  const file = path.join(LOCALES, 'dedicatedCalcTranslations.ts');
  let src = fs.readFileSync(file, 'utf8');
  src = src.replace(/const (DE|de): DedicatedCalcPageStrings[\s\S]*?(?=const MAP)/, `${constBlocks}\n\n`);
  if (!src.includes('const DE: DedicatedCalcPageStrings')) {
    src = src.replace(/(const TR: DedicatedCalcPageStrings[\s\S]*?\n\};)\n\nconst MAP/, `$1\n\n${constBlocks}\n\nconst MAP`);
  }
  src = src.replace(/const MAP: Record<Language, DedicatedCalcPageStrings> = \{[\s\S]*?\};/, map);
  fs.writeFileSync(file, src, 'utf8');
  console.log('Patched dedicatedCalcTranslations.ts');
}

function patchWorkstation() {
  const constBlocks = LANGS.map(
    (lang) => `const ${lang.toUpperCase()}: WorkstationPageStrings = ${serializeObject(WORKSTATION_FULL[lang])};`,
  ).join('\n\n');
  const map = `const MAP: Record<Language, WorkstationPageStrings> = {
  en: EN,
  tr: TR,
${LANGS.map((l) => `  ${l}: ${l.toUpperCase()},`).join('\n')}
};`;
  const file = path.join(LOCALES, 'workstationPageTranslations.ts');
  let src = fs.readFileSync(file, 'utf8');
  src = src.replace(/const (DE|de): WorkstationPageStrings[\s\S]*?(?=const MAP)/, `${constBlocks}\n\n`);
  if (!src.includes('const DE: WorkstationPageStrings')) {
    src = src.replace(/(const TR: WorkstationPageStrings[\s\S]*?\n\};)\n\nconst MAP/, `$1\n\n${constBlocks}\n\nconst MAP`);
  }
  src = src.replace(/const MAP: Record<Language, WorkstationPageStrings> = \{[\s\S]*?\};/, map);
  fs.writeFileSync(file, src, 'utf8');
  console.log('Patched workstationPageTranslations.ts');
}

function patchCalculatorsModules() {
  const file = path.join(LOCALES, 'calculatorsPageTranslations.ts');
  let src = fs.readFileSync(file, 'utf8');
  const blocks = LANGS.map((lang) => {
    const name = `${lang.toUpperCase()}_MODULES`;
    return `const ${name}: Record<CalcModuleId, ModuleEntry> = ${serializeObject(CALC_MODULES_FULL[lang])};`;
  }).join('\n\n');
  if (!src.includes('const DE_MODULES')) {
    src = src.replace(/(const TR_MODULES[\s\S]*?\n\};)\n\nconst TR_PAGE/, `$1\n\n${blocks}\n\nconst TR_PAGE`);
  } else {
    src = src.replace(/const DE_MODULES[\s\S]*?(?=const TR_PAGE)/, `${blocks}\n\n`);
  }
  src = src.replace(
    /const modules = locale === 'tr' \? TR_MODULES : EN_MODULES;/,
    `const modules = locale === 'tr' ? TR_MODULES : locale === 'en' ? EN_MODULES : ${LANGS.map((l) => `locale === '${l}' ? ${l.toUpperCase()}_MODULES`).join(' : ')} : EN_MODULES;`,
  );
  fs.writeFileSync(file, src, 'utf8');
  console.log('Patched calculatorsPageTranslations.ts modules');
}

function patchHomeFooter() {
  const file = path.join(LOCALES, 'homeFooterTranslations.ts');
  let src = fs.readFileSync(file, 'utf8');
  const blocks = LANGS.map(
    (lang) => `const ${lang.toUpperCase()}: HomeFooterStrings = ${serializeObject(HOME_FOOTER_FULL[lang])};`,
  ).join('\n\n');
  const map = `const MAP: Record<Language, HomeFooterStrings> = {
  en: EN,
  tr: TR,
${LANGS.map((l) => `  ${l}: ${l.toUpperCase()},`).join('\n')}
};`;
  src = src.replace(/const MAP: Record<Language, HomeFooterStrings> = \{[\s\S]*?\};/, map);
  if (!src.includes('const DE: HomeFooterStrings')) {
    src = src.replace(/(const TR: HomeFooterStrings[\s\S]*?\n\};)\n\nconst MAP/, `$1\n\n${blocks}\n\nconst MAP`);
  } else {
    src = src.replace(/const DE: HomeFooterStrings[\s\S]*?(?=const MAP)/, `${blocks}\n\n`);
  }
  fs.writeFileSync(file, src, 'utf8');
  console.log('Patched homeFooterTranslations.ts');
}

patchDashboard();
patchDedicated();
patchWorkstation();
patchCalculatorsModules();
patchHomeFooter();
console.log('Done.');
