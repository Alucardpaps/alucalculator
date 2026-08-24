/**
 * Generates locale TS bundles for academy lesson i18n.
 * Run: npx tsx scripts/generate-academy-locales.ts
 */
import fs from 'fs';
import path from 'path';
import type { AcademyLessonLocaleBundle, LocalizedLessonFields } from '../src/locales/academyLessonI18n/types';
import type { AcademyEngineWalkthrough } from '../src/data/academyEngineWalkthroughs';
import type { QuizQuestion } from '../src/data/academyQuizzes';
import { ACADEMY_ENGINE_WALKTHROUGHS } from '../src/data/academyEngineWalkthroughs';
import { ACADEMY_QUIZZES } from '../src/data/academyQuizzes';
import { getSeoGuideCourses } from '../src/data/academySeoCourses';
import calculatorsData from '../src/data/seo-calculators/calculators.json';
import type { SEOCalculatorData } from '../src/components/os/SEOPage';

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
import { ACADEMY_LESSON_ENRICHMENT } from '../src/data/academyLessonEnrichment';

const ARTICLES = [
  engineeringUnits,
  fundamentalsStatics,
  introMachineElements,
  threadGeometry,
  boltTorque,
  bearingLife,
  motorPower,
  mechanicsMaterials,
  mohrsCircle,
  torsionBuckling,
  beamDeflection,
  pressureDrop,
  chipBreaker,
] as const;

const OUT_DIR = path.join('src/locales/academyLessonI18n/locales');
const LANGS = ['tr', 'de', 'es', 'fr', 'it', 'pt', 'ru', 'zh', 'ja', 'ko', 'ar'] as const;
type Lang = (typeof LANGS)[number];

const seoBySlug = new Map(
  (calculatorsData as unknown as SEOCalculatorData[]).map((c) => [c.slug, c]),
);

// ─── Translation dictionaries loaded from JSON files ───
const DATA_DIR = path.join('scripts', 'academy-i18n-data');

function loadLangData(lang: Lang): {
  lessons: Record<string, LocalizedLessonFields>;
  seoGuides: Record<string, Partial<LocalizedLessonFields>>;
  walkthroughs: Record<string, AcademyEngineWalkthrough>;
  quizzes: Record<string, QuizQuestion[]>;
} {
  const file = path.join(DATA_DIR, `${lang}.json`);
  if (!fs.existsSync(file)) {
    throw new Error(`Missing ${file} — run scripts/seed-academy-i18n-data.ts first`);
  }
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function buildBundle(lang: Lang): AcademyLessonLocaleBundle {
  const data = loadLangData(lang);
  return {
    lessons: data.lessons,
    seoGuides: data.seoGuides,
    walkthroughs: data.walkthroughs,
    quizzes: data.quizzes,
  };
}

function writeBundle(lang: Lang, bundle: AcademyLessonLocaleBundle) {
  const constName = `${lang.toUpperCase()}_BUNDLE`;
  const content = `import type { AcademyLessonLocaleBundle } from '../types';

export const ${constName}: AcademyLessonLocaleBundle = ${JSON.stringify(bundle)} as AcademyLessonLocaleBundle;
`;
  fs.writeFileSync(path.join(OUT_DIR, `${lang}.ts`), content, 'utf8');
  console.log(`Written ${lang}.ts`);
}

for (const lang of LANGS) {
  writeBundle(lang, buildBundle(lang));
}

console.log('All locale bundles generated.');
