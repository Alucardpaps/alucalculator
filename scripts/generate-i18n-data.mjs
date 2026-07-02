/**
 * Generates scripts/i18n-data/** locale .mjs files.
 * Run: node scripts/generate-i18n-data.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, 'i18n-data');
const LANGS = ['de', 'es', 'fr', 'it', 'pt', 'ru', 'ja', 'zh', 'ko', 'ar'];
const MOBILE_SHELL_LANGS = ['es', 'fr', 'it', 'pt', 'ru', 'ja', 'zh', 'ko', 'ar'];

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function serializeValue(v, indent) {
  const pad = ' '.repeat(indent);
  if (typeof v === 'string') {
    if (v.includes('\n')) return `\n${pad}  ${JSON.stringify(v)},`;
    return JSON.stringify(v);
  }
  if (Array.isArray(v)) {
    const items = v.map((item) => `${pad}  ${serializeScalar(item)},`).join('\n');
    return `[\n${items}\n${pad}]`;
  }
  if (v && typeof v === 'object') {
    const entries = Object.entries(v).map(([k, val]) => {
      const serialized = serializeValue(val, indent + 2);
      if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
        return `${pad}  ${k}: ${serialized},`;
      }
      if (Array.isArray(val)) {
        return `${pad}  ${k}: ${serialized},`;
      }
      return `${pad}  ${k}: ${serialized},`;
    });
    return `{\n${entries.join('\n')}\n${pad}}`;
  }
  return JSON.stringify(v);
}

function serializeScalar(v) {
  return JSON.stringify(v);
}

function writeLocaleFile(dir, lang, comment, data) {
  ensureDir(dir);
  const lines = [`/** ${comment} — ${langLabel(lang)} */`, 'export default {'];
  for (const [k, v] of Object.entries(data)) {
    if (typeof v === 'string') {
      if (v.includes('\n')) {
        lines.push(`  ${k}:\n    ${JSON.stringify(v)},`);
      } else {
        lines.push(`  ${k}: ${JSON.stringify(v)},`);
      }
    } else if (Array.isArray(v)) {
      lines.push(`  ${k}: [`);
      for (const item of v) {
        if (typeof item === 'string') {
          lines.push(`    ${JSON.stringify(item)},`);
        } else {
          lines.push(`    {`);
          for (const [ik, iv] of Object.entries(item)) {
            if (Array.isArray(iv)) {
              lines.push(`      ${ik}: [`);
              for (const link of iv) {
                lines.push(`        { href: ${JSON.stringify(link.href)}, label: ${JSON.stringify(link.label)} },`);
              }
              lines.push(`      ],`);
            } else {
              lines.push(`      ${ik}: ${JSON.stringify(iv)},`);
            }
          }
          lines.push(`    },`);
        }
      }
      lines.push(`  ],`);
    } else if (v && typeof v === 'object') {
      lines.push(`  ${k}: {`);
      writeNested(lines, v, 4);
      lines.push(`  },`);
    }
  }
  lines.push('};', '');
  fs.writeFileSync(path.join(dir, `${lang}.mjs`), lines.join('\n'), 'utf8');
}

function writeNested(lines, obj, indent) {
  const pad = ' '.repeat(indent);
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === 'string') {
      if (v.includes('\n')) {
        lines.push(`${pad}${k}:\n${pad}  ${JSON.stringify(v)},`);
      } else {
        lines.push(`${pad}${k}: ${JSON.stringify(v)},`);
      }
    } else {
      lines.push(`${pad}${k}: {`);
      writeNested(lines, v, indent + 2);
      lines.push(`${pad}},`);
    }
  }
}

function writeIndex(dir, exportName, langs, comment) {
  const imports = langs.map((l) => `import ${l} from './${l}.mjs';`).join('\n');
  const obj = langs.map((l) => `  ${l},`).join('\n');
  const content = `${imports}

/** ${comment} */
export const ${exportName} = {
${obj}
};
`;
  fs.writeFileSync(path.join(dir, 'index.mjs'), content, 'utf8');
}

function langLabel(lang) {
  const labels = { de: 'German', es: 'Spanish', fr: 'French', it: 'Italian', pt: 'Portuguese', ru: 'Russian', ja: 'Japanese', zh: 'Chinese', ko: 'Korean', ar: 'Arabic' };
  return labels[lang] ?? lang;
}

// Import translation data
const { KERNEL } = await import('./i18n-data-translations/kernel.mjs');
const { MOBILE_SHELL } = await import('./i18n-data-translations/mobile-shell.mjs');
const { DASHBOARD } = await import('./i18n-data-translations/dashboard.mjs');
const { DEDICATED } = await import('./i18n-data-translations/dedicated.mjs');
const { WORKSTATION } = await import('./i18n-data-translations/workstation.mjs');
const { CALC_MODULES } = await import('./i18n-data-translations/calc-modules.mjs');
const { HOME_FOOTER } = await import('./i18n-data-translations/home-footer.mjs');

// Kernel
const kernelDir = path.join(ROOT, 'kernel');
for (const lang of LANGS) {
  if (lang === 'de' && fs.existsSync(path.join(kernelDir, 'de.mjs'))) continue;
  writeLocaleFile(kernelDir, lang, 'Kernel dev panel', KERNEL[lang]);
}
writeIndex(kernelDir, 'KERNEL_FULL_LOCALES', LANGS, 'Full kernel dev panel translations for all non-EN/TR locales (23 keys each).');

// Mobile shell
const mobileDir = path.join(ROOT, 'mobile-shell');
for (const lang of MOBILE_SHELL_LANGS) {
  writeLocaleFile(mobileDir, lang, 'Mobile shell', MOBILE_SHELL[lang]);
}
writeIndex(mobileDir, 'MOBILE_SHELL_FULL', MOBILE_SHELL_LANGS, 'Full mobile shell translations (69 keys each). de/tr handled in generate-mobile-i18n.mjs.');

// Dashboard
const dashDir = path.join(ROOT, 'dashboard');
for (const lang of LANGS) {
  writeLocaleFile(dashDir, lang, 'Dashboard page', DASHBOARD[lang]);
}
writeIndex(dashDir, 'DASHBOARD_FULL', LANGS, 'Full dashboard page translations (38 keys each).');

// Dedicated
const dedDir = path.join(ROOT, 'dedicated');
for (const lang of LANGS) {
  writeLocaleFile(dedDir, lang, 'Dedicated calculator pages', DEDICATED[lang]);
}
writeIndex(dedDir, 'DEDICATED_FULL', LANGS, 'Full dedicated calculator page translations.');

// Workstation
const wsDir = path.join(ROOT, 'workstation');
for (const lang of LANGS) {
  writeLocaleFile(wsDir, lang, 'Workstation pages', WORKSTATION[lang]);
}
writeIndex(wsDir, 'WORKSTATION_FULL', LANGS, 'Full workstation page translations.');

// Calculators modules
const calcDir = path.join(ROOT, 'calculators-modules');
for (const lang of LANGS) {
  writeLocaleFile(calcDir, lang, 'Calculator module registry', CALC_MODULES[lang]);
}
writeIndex(calcDir, 'CALC_MODULES_FULL', LANGS, 'Full calculator module name/description translations.');

// Home footer
const footerDir = path.join(ROOT, 'home-footer');
for (const lang of LANGS) {
  writeLocaleFile(footerDir, lang, 'Home page footer', HOME_FOOTER[lang]);
}
writeIndex(footerDir, 'HOME_FOOTER_FULL', LANGS, 'Full home page footer translations.');

console.log('Generated i18n-data locale files in', ROOT);
