/**
 * Seeds lesson i18n JSON + body override files from seed-data/*.json
 * Run: node scripts/academy-i18n-data/seed-all-lesson-i18n.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..', '..');
const ARTICLES = path.join(ROOT, 'src/data/academy-articles');
const BODIES_DIR = path.join(__dirname, 'bodies');
const LANGS = ['de', 'es', 'fr', 'it', 'pt', 'ru', 'ja', 'zh', 'ko', 'ar'];

const introDesc = JSON.parse(fs.readFileSync(path.join(__dirname, 'seed-data/intro-desc.json'), 'utf8'));
const enrichment = JSON.parse(fs.readFileSync(path.join(__dirname, 'seed-data/enrichment.json'), 'utf8'));
const bodies = JSON.parse(fs.readFileSync(path.join(__dirname, 'seed-data/bodies.json'), 'utf8'));

const slugs = fs.readdirSync(ARTICLES).filter((f) => f.endsWith('.json')).map((f) => f.replace('.json', ''));

// lesson-enrichment-i18n.json
const lessonEnrichment = {};
for (const lang of LANGS) {
  lessonEnrichment[lang] = {};
  for (const slug of slugs) {
    const e = enrichment[lang]?.[slug];
    const id = introDesc[lang]?.[slug];
    if (!e && !id) continue;
    lessonEnrichment[lang][slug] = {
      ...(id?.description ? { description: id.description } : {}),
      ...(id?.intro ? { intro: id.intro } : {}),
      ...(e?.learningObjectives ? { learningObjectives: e.learningObjectives } : {}),
      ...(e?.keyTakeaways ? { keyTakeaways: e.keyTakeaways } : {}),
      ...(e?.supplementalParagraph ? { supplementalParagraph: e.supplementalParagraph } : {}),
    };
  }
}
fs.writeFileSync(
  path.join(__dirname, 'lesson-enrichment-i18n.json'),
  JSON.stringify(lessonEnrichment, null, 2),
  'utf8',
);

// lesson-bodies-i18n.json
const lessonBodies = {};
for (const lang of LANGS) {
  lessonBodies[lang] = bodies[lang] ?? {};
}
fs.writeFileSync(
  path.join(__dirname, 'lesson-bodies-i18n.json'),
  JSON.stringify(lessonBodies, null, 2),
  'utf8',
);

// bodies/{lang}/{slug}.json
for (const lang of LANGS) {
  const langDir = path.join(BODIES_DIR, lang);
  fs.mkdirSync(langDir, { recursive: true });
  for (const slug of slugs) {
    const e = enrichment[lang]?.[slug];
    const b = bodies[lang]?.[slug];
    const id = introDesc[lang]?.[slug];
    if (!e && !b && !id) continue;
    const merged = {
      ...(e?.learningObjectives ? { learningObjectives: e.learningObjectives } : {}),
      ...(e?.keyTakeaways ? { keyTakeaways: e.keyTakeaways } : {}),
      ...(e?.supplementalParagraph ? { supplementalParagraph: e.supplementalParagraph } : {}),
      ...(b ?? {}),
    };
    if (Object.keys(merged).length) {
      fs.writeFileSync(path.join(langDir, `${slug}.json`), JSON.stringify(merged, null, 2), 'utf8');
    }
  }
}

console.log('Seeded lesson-enrichment-i18n.json, lesson-bodies-i18n.json, and body overrides for', LANGS.join(', '));
