/**
 * Generates lesson-copy-i18n.mjs from title-map + TR/EN source maps.
 * Run: node scripts/academy-i18n-data/generate-lesson-copy-i18n.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..', '..');
const ARTICLES = path.join(ROOT, 'src/data/academy-articles');

const LANGS = ['de', 'es', 'fr', 'it', 'pt', 'ru', 'ja', 'zh', 'ko', 'ar'];
const descMap = JSON.parse(fs.readFileSync(path.join(__dirname, 'desc-map.json'), 'utf8'));
const introMap = JSON.parse(fs.readFileSync(path.join(__dirname, 'intro-map.json'), 'utf8'));

// Per-lang enrichment translations (objectives, takeaways, supplemental) keyed by slug
const ENRICHMENT = JSON.parse(fs.readFileSync(path.join(__dirname, 'lesson-enrichment-i18n.json'), 'utf8'));

// Per-lang body field overrides (stepByStep, whyThisMatters, commonMistakes, engineeringTip, faq)
const BODIES = JSON.parse(fs.readFileSync(path.join(__dirname, 'lesson-bodies-i18n.json'), 'utf8'));

const slugs = fs.readdirSync(ARTICLES).filter((f) => f.endsWith('.json')).map((f) => f.replace('.json', ''));

const LESSON_DESC = { tr: descMap.tr };
const LESSON_INTRO = { tr: introMap.tr };
const LESSON_BODY = { tr: {} };

for (const lang of LANGS) {
  LESSON_DESC[lang] = {};
  LESSON_INTRO[lang] = {};
  LESSON_BODY[lang] = {};
  for (const slug of slugs) {
    const en = JSON.parse(fs.readFileSync(path.join(ARTICLES, `${slug}.json`), 'utf8'));
    LESSON_DESC[lang][slug] = descMap[lang]?.[slug] ?? ENRICHMENT[lang]?.[slug]?.description ?? en.meta.description;
    LESSON_INTRO[lang][slug] = introMap[lang]?.[slug] ?? ENRICHMENT[lang]?.[slug]?.intro ?? en.hero.intro;
    const enrich = ENRICHMENT[lang]?.[slug];
    const body = BODIES[lang]?.[slug];
    if (enrich || body) {
      LESSON_BODY[lang][slug] = {
        ...(enrich?.learningObjectives ? { learningObjectives: enrich.learningObjectives } : {}),
        ...(enrich?.keyTakeaways ? { keyTakeaways: enrich.keyTakeaways } : {}),
        ...(enrich?.supplementalParagraph ? { supplementalParagraph: enrich.supplementalParagraph } : {}),
        ...(body?.engineeringTip ? { engineeringTip: body.engineeringTip } : {}),
        ...(body?.stepByStep ? { stepByStep: body.stepByStep } : {}),
        ...(body?.whyThisMatters ? { whyThisMatters: body.whyThisMatters } : {}),
        ...(body?.commonMistakes ? { commonMistakes: body.commonMistakes } : {}),
        ...(body?.faq ? { faq: body.faq } : {}),
        ...(body?.formula?.variables ? { formula: { variables: body.formula.variables } } : {}),
        ...(body?.example ? { example: body.example } : {}),
        ...(body?.calculatorCta ? { calculatorCta: body.calculatorCta } : {}),
      };
    }
  }
}

const seoTitleMap = JSON.parse(fs.readFileSync(path.join(__dirname, 'seo-title-map.json'), 'utf8'));
const SEO_TITLES = seoTitleMap;

const out = `/** Auto-generated — run: node scripts/academy-i18n-data/generate-lesson-copy-i18n.mjs */
export const LESSON_DESC = ${JSON.stringify(LESSON_DESC, null, 2)};

export const LESSON_INTRO = ${JSON.stringify(LESSON_INTRO, null, 2)};

export const LESSON_BODY = ${JSON.stringify(LESSON_BODY, null, 2)};

export const SEO_TITLES = ${JSON.stringify(SEO_TITLES, null, 2)};
`;

fs.writeFileSync(path.join(__dirname, 'lesson-copy-i18n.mjs'), out, 'utf8');
console.log('Wrote lesson-copy-i18n.mjs');
