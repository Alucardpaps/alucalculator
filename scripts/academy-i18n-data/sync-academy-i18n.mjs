/**
 * Master academy i18n sync: phrase maps → slug translations → locale packs → maps → bundles.
 * Run: node scripts/academy-i18n-data/sync-academy-i18n.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { INTRO_DESC } from './seed-data-sources/intro-desc.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..', '..');
const ARTICLES = path.join(ROOT, 'src/data/academy-articles');
const LOCALE_SRC = path.join(__dirname, 'locale-data-src');

const SLUGS = [
  'engineering-units-and-standards',
  'fundamentals-of-statics',
  'introduction-to-machine-elements',
  'thread-geometry-standards',
  'how-to-calculate-bolt-torque',
  'bearing-life-calculation-explained',
  'motor-power-calculation',
  'mechanics-of-materials-fundamentals',
  'mohrs-circle-stress-analysis',
  'torsion-and-buckling-mechanics',
  'beam-deflection-formula-explained',
  'pressure-drop-calculation-guide',
  'chip-breaker-logic',
];

const LANGS = ['de', 'es', 'fr', 'it', 'pt', 'ru', 'zh', 'ja', 'ko', 'ar'];

function getSyncLangs() {
  const phraseDir = path.join(__dirname, 'translation-tables', 'phrases');
  return LANGS.filter((lang) => fs.existsSync(path.join(phraseDir, `${lang}.mjs`)));
}

async function resolveSyncLangs() {
  const enKeyList = loadJson(path.join(__dirname, 'seed-data-sources/en-keys.json'));
  const candidates = getSyncLangs();
  const ready = [];
  for (const lang of candidates) {
    const mod = await import(`./translation-tables/phrases/${lang}.mjs`);
    const missing = enKeyList.filter((k) => !mod.PHRASES[k]);
    if (missing.length === 0) {
      ready.push(lang);
    } else {
      console.warn(`Skipping ${lang}: ${missing.length} incomplete phrase entries`);
    }
  }
  return ready;
}

function loadJson(f) {
  return JSON.parse(fs.readFileSync(f, 'utf8'));
}

function loadArticles() {
  const out = {};
  for (const slug of SLUGS) {
    out[slug] = loadJson(path.join(ARTICLES, `${slug}.json`));
  }
  return out;
}

const articles = loadArticles();
const enEnrich = loadJson(path.join(__dirname, 'seed-data-sources/en-enrichment.json'));
const enKeys = loadJson(path.join(__dirname, 'seed-data-sources/en-keys.json'));

async function loadPhraseMaps(langs) {
  const maps = {};
  for (const lang of langs) {
    const mod = await import(`./translation-tables/phrases/${lang}.mjs`);
    maps[lang] = mod.PHRASES;
  }
  return maps;
}

function tr(map, s, altKeys = []) {
  if (!s) return s;
  const candidates = [s, ...altKeys];
  for (const key of candidates) {
    if (map[key]) return map[key];
  }
  return s;
}

function translateArticleBody(en, map) {
  return {
    ...(en.formula?.variables
      ? {
          formula: {
            variables: Object.fromEntries(
              Object.entries(en.formula.variables).map(([k, v]) => [k, tr(map, v, [`${k}: ${v}`])]),
            ),
          },
        }
      : {}),
    ...(en.stepByStep ? { stepByStep: en.stepByStep.map((s) => tr(map, s)) } : {}),
    ...(en.example
      ? {
          example: {
            inputs: en.example.inputs?.map((s) => tr(map, s)),
            calculation: tr(map, en.example.calculation),
          },
        }
      : {}),
    ...(en.whyThisMatters ? { whyThisMatters: en.whyThisMatters.map((s) => tr(map, s)) } : {}),
    ...(en.commonMistakes ? { commonMistakes: en.commonMistakes.map((s) => tr(map, s)) } : {}),
    ...(en.engineeringTip ? { engineeringTip: tr(map, en.engineeringTip) } : {}),
    ...(en.calculatorCta ? { calculatorCta: { label: tr(map, en.calculatorCta.label) } } : {}),
    ...(en.faq
      ? {
          faq: en.faq.map((q) => ({
            question: tr(map, q.question),
            answer: tr(map, q.answer),
          })),
        }
      : {}),
  };
}

function translateEnrichment(slug, map) {
  const e = enEnrich[slug];
  if (!e) return {};
  return {
    learningObjectives: e.learningObjectives.map((s) => tr(map, s)),
    keyTakeaways: e.keyTakeaways.map((s) => tr(map, s)),
    ...(e.supplementalParagraph ? { supplementalParagraph: tr(map, e.supplementalParagraph) } : {}),
  };
}

function buildSlugTranslations(phraseMaps, langs) {
  const out = {};
  for (const lang of langs) {
    out[lang] = {};
    const map = phraseMaps[lang];
    for (const slug of SLUGS) {
      const en = articles[slug];
      const id = INTRO_DESC[lang][slug];
      out[lang][slug] = {
        meta: { description: id.description },
        hero: { intro: id.intro },
        ...translateEnrichment(slug, map),
        ...translateArticleBody(en, map),
      };
    }
  }
  return out;
}

function updateMaps(slugTranslations, langs) {
  const titleMap = loadJson(path.join(__dirname, 'title-map.json'));
  const descMap = loadJson(path.join(__dirname, 'desc-map.json'));
  const introMap = loadJson(path.join(__dirname, 'intro-map.json'));

  for (const lang of langs) {
    descMap[lang] = descMap[lang] ?? {};
    introMap[lang] = introMap[lang] ?? {};
    for (const slug of SLUGS) {
      const t = slugTranslations[lang][slug];
      descMap[lang][slug] = t.meta.description;
      introMap[lang][slug] = t.hero.intro;
    }
  }

  fs.writeFileSync(path.join(__dirname, 'desc-map.json'), JSON.stringify(descMap, null, 2), 'utf8');
  fs.writeFileSync(path.join(__dirname, 'intro-map.json'), JSON.stringify(introMap, null, 2), 'utf8');
  console.log('Updated intro-map.json and desc-map.json');
}

function writeBodies(slugTranslations, langs) {
  for (const lang of langs) {
    const dir = path.join(__dirname, 'bodies', lang);
    fs.mkdirSync(dir, { recursive: true });
    for (const slug of SLUGS) {
      const t = slugTranslations[lang][slug];
      const body = { ...t };
      delete body.meta;
      delete body.hero;
      fs.writeFileSync(path.join(dir, `${slug}.json`), JSON.stringify(body, null, 2), 'utf8');
    }
    console.log(`Wrote bodies/${lang}/*.json`);
  }
}

function writeSlugTranslationsModule(slugTranslations, langs) {
  const content = `/** Auto-generated by sync-academy-i18n.mjs */
export const SLUG_TRANSLATIONS = ${JSON.stringify(
    Object.fromEntries(
      langs.map((lang) => [
        lang,
        Object.fromEntries(
          SLUGS.map((slug) => {
            const t = slugTranslations[lang][slug];
            const { meta, hero, ...rest } = t;
            return [slug, rest];
          }),
        ),
      ]),
    ),
    null,
    2,
  )};
`;
  fs.writeFileSync(path.join(LOCALE_SRC, 'slug-translations.mjs'), content, 'utf8');
}

async function main() {
  const syncLangs = await resolveSyncLangs();
  if (!syncLangs.length) {
    throw new Error('No complete phrase maps found. Run compose-phrases.mjs first for de/es/fr.');
  }
  console.log(`Syncing academy i18n for: ${syncLangs.join(', ')}`);
  const phraseMaps = await loadPhraseMaps(syncLangs);
  const enKeyList = loadJson(path.join(__dirname, 'seed-data-sources/en-keys.json'));
  for (const lang of syncLangs) {
    const missing = enKeyList.filter((k) => !phraseMaps[lang][k]);
    if (missing.length) {
      throw new Error(`${lang} missing ${missing.length} phrases, e.g. ${missing[0].slice(0, 50)}`);
    }
  }
  const slugTranslations = buildSlugTranslations(phraseMaps, syncLangs);
  writeSlugTranslationsModule(slugTranslations, syncLangs);
  updateMaps(slugTranslations, syncLangs);
  writeBodies(slugTranslations, syncLangs);

  execSync('npx tsx scripts/academy-i18n-data/build-all.ts', { cwd: ROOT, stdio: 'inherit' });
  console.log('Academy i18n sync complete.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
