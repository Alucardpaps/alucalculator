/**
 * Seeds academy-i18n-data/*.json from English sources + translation tables.
 * Run: npx tsx scripts/seed-academy-i18n-data.ts
 */
import fs from 'fs';
import path from 'path';
import type { LocalizedLessonFields } from '../src/locales/academyLessonI18n/types';
import type { AcademyEngineWalkthrough } from '../src/data/academyEngineWalkthroughs';
import type { QuizQuestion } from '../src/data/academyQuizzes';
import { ACADEMY_ENGINE_WALKTHROUGHS } from '../src/data/academyEngineWalkthroughs';
import { ACADEMY_QUIZZES } from '../src/data/academyQuizzes';
import { getSeoGuideCourses } from '../src/data/academySeoCourses';
import calculatorsData from '../src/data/seo-calculators/calculators.json';
import type { SEOCalculatorData } from '../src/components/os/SEOPage';
import { ACADEMY_LESSON_ENRICHMENT } from '../src/data/academyLessonEnrichment';

import engineeringUnits from '../src/data/academy-articles/engineering-units-and-standards.json';
import fundamentalsStatics from '../src/data/academy-articles/fundamentals-of-statics.json';
import introMachineElements from '../src/data/academy-articles/introduction-to-machine-elements.json';
import threadGeometry from '../src/data/academy-articles/thread-geometry-standards.json';
import boltTorque from '../src/data/academy-articles/how-to-calculate-bolt-torque.json';
import bearingLife from '../src/data/academy-articles/bearing-life-calculation-explained.json';
import motorPower from '../src/data/academy-articles/motor-power-calculation.json';
import mechanicsMaterials from '../src/data/academy-articles/mechanics-of-materials-fundamentals.json';
import mohrsCircle from '../src/data/academy-articles/mohrs-circle-stress-analysis.json';
import torsionBuckling from '../src/data/academy-articles/torsion-and-buckling-mechanics.json';
import beamDeflection from '../src/data/academy-articles/beam-deflection-formula-explained.json';
import pressureDrop from '../src/data/academy-articles/pressure-drop-calculation-guide.json';
import chipBreaker from '../src/data/academy-articles/chip-breaker-logic.json';

const ARTICLES: Record<string, typeof engineeringUnits> = {
  'engineering-units-and-standards': engineeringUnits,
  'fundamentals-of-statics': fundamentalsStatics,
  'introduction-to-machine-elements': introMachineElements,
  'thread-geometry-standards': threadGeometry,
  'how-to-calculate-bolt-torque': boltTorque,
  'bearing-life-calculation-explained': bearingLife,
  'motor-power-calculation': motorPower,
  'mechanics-of-materials-fundamentals': mechanicsMaterials,
  'mohrs-circle-stress-analysis': mohrsCircle,
  'torsion-and-buckling-mechanics': torsionBuckling,
  'beam-deflection-formula-explained': beamDeflection,
  'pressure-drop-calculation-guide': pressureDrop,
  'chip-breaker-logic': chipBreaker,
};

const SLUGS = Object.keys(ARTICLES);
const LANGS = ['tr', 'de', 'es', 'fr', 'it', 'pt', 'ru', 'zh', 'ja', 'ko', 'ar'] as const;
type Lang = (typeof LANGS)[number];

const OUT_DIR = path.join('scripts', 'academy-i18n-data');
const seoBySlug = new Map(
  (calculatorsData as unknown as SEOCalculatorData[]).map((c) => [c.slug, c]),
);

// Load per-language translation tables from companion JSON files
const TABLES_DIR = path.join('scripts', 'academy-i18n-tables');

function loadTable(lang: Lang) {
  const file = path.join(TABLES_DIR, `${lang}.json`);
  return JSON.parse(fs.readFileSync(file, 'utf8')) as {
    lessons: Record<string, LocalizedLessonFields>;
    walkthroughs: Record<string, AcademyEngineWalkthrough>;
    quizzes: Record<string, QuizQuestion[]>;
    seoGuides: Record<string, Partial<LocalizedLessonFields>>;
  };
}

function buildSeoGuides(lang: Lang, table: ReturnType<typeof loadTable>) {
  const guides: Record<string, Partial<LocalizedLessonFields>> = { ...table.seoGuides };
  for (const course of getSeoGuideCourses()) {
    if (guides[course.slug]) continue;
    const seo = seoBySlug.get(course.slug);
    const steps = (seo?.seo?.step_by_step ?? '')
      .split('\n')
      .map((s) => s.replace(/^\d+\.\s*/, '').trim())
      .filter(Boolean)
      .slice(0, 3);
    guides[course.slug] = {
      title: course.title,
      hero: {
        h1: seo?.seo?.h1?.replace(/\s*&\s*Engineering Guide\s*-\s*AluCalc\s*$/i, '').trim() ?? course.title,
        intro: seo?.seo?.intro ?? course.title,
      },
      stepByStep: steps,
    };
  }
  return guides;
}

function buildLessons(lang: Lang, table: ReturnType<typeof loadTable>) {
  const lessons: Record<string, LocalizedLessonFields> = {};
  for (const slug of SLUGS) {
    const override = table.lessons[slug];
    if (!override) continue;
    const enrichment = ACADEMY_LESSON_ENRICHMENT[slug];
    lessons[slug] = {
      ...override,
      supplementalParagraph: override.supplementalParagraph ?? enrichment?.supplementalParagraph,
      learningObjectives: override.learningObjectives ?? enrichment?.learningObjectives,
      keyTakeaways: override.keyTakeaways ?? enrichment?.keyTakeaways,
    };
  }
  return lessons;
}

function buildWalkthroughs(lang: Lang, table: ReturnType<typeof loadTable>) {
  const out: Record<string, AcademyEngineWalkthrough> = {};
  for (const slug of SLUGS) {
    out[slug] = table.walkthroughs[slug] ?? ACADEMY_ENGINE_WALKTHROUGHS[slug];
  }
  return out;
}

function buildQuizzes(lang: Lang, table: ReturnType<typeof loadTable>) {
  const out: Record<string, QuizQuestion[]> = {};
  for (const slug of SLUGS) {
    out[slug] = table.quizzes[slug] ?? ACADEMY_QUIZZES[slug] ?? [];
  }
  return out;
}

fs.mkdirSync(OUT_DIR, { recursive: true });

for (const lang of LANGS) {
  const table = loadTable(lang);
  const bundle = {
    lessons: buildLessons(lang, table),
    seoGuides: buildSeoGuides(lang, table),
    walkthroughs: buildWalkthroughs(lang, table),
    quizzes: buildQuizzes(lang, table),
  };
  fs.writeFileSync(path.join(OUT_DIR, `${lang}.json`), JSON.stringify(bundle), 'utf8');
  console.log(`Seeded ${lang}.json`);
}

console.log('Seed complete.');
