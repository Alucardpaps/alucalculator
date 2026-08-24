import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import type { LocalizedLessonFields } from '../../src/locales/academyLessonI18n/types';
import type { AcademyLessonLocaleBundle } from '../../src/locales/academyLessonI18n/types';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const LANGS = ['tr', 'de', 'es', 'fr', 'it', 'pt', 'ru', 'zh', 'ja', 'ko', 'ar'] as const;
const ROOT = path.join(__dirname, '..', '..');
const LANGS_DIR = path.join(__dirname, 'langs');
const OUT_LOCALES = path.join(ROOT, 'src/locales/academyLessonI18n/locales');
const ARTICLES_DIR = path.join(ROOT, 'src/data/academy-articles');
const BODIES_DIR = path.join(__dirname, 'bodies');

type LangModule = {
  lessons?: Record<string, Partial<LocalizedLessonFields>>;
  walkthroughs?: AcademyLessonLocaleBundle['walkthroughs'];
  quizzes?: AcademyLessonLocaleBundle['quizzes'];
  practice?: AcademyLessonLocaleBundle['practice'];
  seoGuides?: Record<string, Partial<LocalizedLessonFields>>;
};

type TitleMap = Record<string, Record<string, string>>;
type StringMap = Record<string, Record<string, string>>;

function loadJson<T>(file: string): T {
  return JSON.parse(fs.readFileSync(path.join(__dirname, file), 'utf8')) as T;
}

function loadArticleSlugs(): string[] {
  return fs
    .readdirSync(ARTICLES_DIR)
    .filter((f) => f.endsWith('.json'))
    .map((f) => f.replace('.json', ''));
}

function loadBodyOverride(lang: string, slug: string): Partial<LocalizedLessonFields> | undefined {
  const file = path.join(BODIES_DIR, lang, `${slug}.json`);
  if (!fs.existsSync(file)) return undefined;
  return JSON.parse(fs.readFileSync(file, 'utf8')) as Partial<LocalizedLessonFields>;
}

function deepMergeLesson(
  base: Partial<LocalizedLessonFields>,
  ...overrides: Array<Partial<LocalizedLessonFields> | undefined>
): Partial<LocalizedLessonFields> {
  let out = { ...base };
  for (const o of overrides) {
    if (!o) continue;
    out = {
      ...out,
      ...o,
      meta: o.meta ? { ...out.meta, ...o.meta } : out.meta,
      hero: o.hero ? { ...out.hero, ...o.hero } : out.hero,
      formula: o.formula
        ? { ...out.formula, variables: { ...out.formula?.variables, ...o.formula.variables } }
        : out.formula,
      example: o.example ? { ...out.example, ...o.example } : out.example,
      calculatorCta: o.calculatorCta ? { ...out.calculatorCta, ...o.calculatorCta } : out.calculatorCta,
    };
  }
  return out;
}

async function loadLang(lang: string): Promise<LangModule> {
  const modUrl = pathToFileURL(path.join(LANGS_DIR, `${lang}.mjs`)).href;
  return import(modUrl);
}

async function buildBundle(lang: string): Promise<AcademyLessonLocaleBundle> {
  const mod = await loadLang(lang);
  const titleMap = loadJson<TitleMap>('title-map.json');
  const descMap = loadJson<StringMap>('desc-map.json');
  const introMap = loadJson<StringMap>('intro-map.json');
  const seoTitleMap = loadJson<TitleMap>('seo-title-map.json');
  const seoIntroMap = loadJson<StringMap>('seo-intro-map.json');

  const slugs = loadArticleSlugs();
  const lessons: Record<string, Partial<LocalizedLessonFields>> = { ...(mod.lessons ?? {}) };

  for (const slug of slugs) {
    const title = titleMap[lang]?.[slug];
    const description = descMap[lang]?.[slug];
    const intro = introMap[lang]?.[slug];
    const body = loadBodyOverride(lang, slug);

    const fromMaps: Partial<LocalizedLessonFields> = {};
    if (title) {
      fromMaps.meta = { title, description: description ?? titleMap[lang]?.[slug] };
      fromMaps.hero = { h1: title, intro: intro ?? '' };
    } else if (description || intro) {
      fromMaps.meta = description ? { title: '', description } : undefined;
      fromMaps.hero = intro ? { h1: '', intro } : undefined;
    }

    if (description && fromMaps.meta) fromMaps.meta.description = description;
    if (intro && fromMaps.hero) fromMaps.hero.intro = intro;

    lessons[slug] = deepMergeLesson(fromMaps, mod.lessons?.[slug], body);
    if (title || description || intro) {
      lessons[slug].meta = {
        ...lessons[slug].meta,
        title: title ?? lessons[slug].meta?.title ?? '',
        description: description ?? lessons[slug].meta?.description ?? '',
      };
      lessons[slug].hero = {
        ...lessons[slug].hero,
        h1: title ?? lessons[slug].hero?.h1 ?? '',
        intro: intro ?? lessons[slug].hero?.intro ?? '',
      };
    }
  }

  const seoGuides: Record<string, Partial<LocalizedLessonFields>> = { ...(mod.seoGuides ?? {}) };
  for (const [slug, title] of Object.entries(seoTitleMap[lang] ?? {})) {
    const intro = seoIntroMap[lang]?.[slug];
    seoGuides[slug] = deepMergeLesson(seoGuides[slug] ?? {}, {
      title,
      meta: { title, description: intro?.slice(0, 160) ?? title },
      hero: { h1: title, intro: intro ?? '' },
    });
  }

  return {
    lessons,
    seoGuides,
    walkthroughs: mod.walkthroughs ?? {},
    quizzes: mod.quizzes ?? {},
    practice: mod.practice ?? {},
  };
}

async function main() {
  for (const lang of LANGS) {
    const bundle = await buildBundle(lang);
    const constName = `${lang.toUpperCase()}_BUNDLE`;
    const ts = `import type { AcademyLessonLocaleBundle } from '../types';

export const ${constName}: AcademyLessonLocaleBundle = ${JSON.stringify(bundle)} as AcademyLessonLocaleBundle;
`;
    fs.writeFileSync(path.join(OUT_LOCALES, `${lang}.ts`), ts, 'utf8');
    console.log(`Built ${lang}.ts (${Object.keys(bundle.lessons).length} lessons, ${Object.keys(bundle.seoGuides).length} seo)`);
  }
  console.log('Complete.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
