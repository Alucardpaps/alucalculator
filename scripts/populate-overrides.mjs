import fs from 'fs';
import path from 'path';

const articlesDir = 'src/data/academy-articles';
const slugs = [
  'engineering-units-and-standards','fundamentals-of-statics','introduction-to-machine-elements',
  'thread-geometry-standards','how-to-calculate-bolt-torque','bearing-life-calculation-explained',
  'motor-power-calculation','mechanics-of-materials-fundamentals','mohrs-circle-stress-analysis',
  'torsion-and-buckling-mechanics','beam-deflection-formula-explained','pressure-drop-calculation-guide','chip-breaker-logic'
];

const articles = Object.fromEntries(slugs.map(s => [s, JSON.parse(fs.readFileSync(path.join(articlesDir, s+'.json'),'utf8'))]));

const TITLES = JSON.parse(fs.readFileSync('scripts/academy-i18n-data/title-map.json','utf8'));

function buildLesson(lang, slug) {
  const a = articles[slug];
  const title = TITLES[lang]?.[slug] ?? a.meta.title;
  return {
    meta: { title },
    hero: { h1: title },
  };
}

const langs = ['tr','de','es','fr','it','pt','ru','zh','ja','ko','ar'];
const langsDir = 'scripts/academy-i18n-data/langs';

const trBundle = JSON.parse(
  fs.readFileSync('src/locales/academyLessonI18n/locales/tr.ts','utf8')
    .replace(/^[\s\S]*?=\s*/,'').replace(/\s+as AcademyLessonLocaleBundle;\s*$/,'')
);

for (const lang of langs) {
  const lessons = {};
  for (const slug of slugs) {
    if (lang === 'tr' && trBundle.lessons[slug]) {
      lessons[slug] = trBundle.lessons[slug];
    } else {
      lessons[slug] = buildLesson(lang, slug);
    }
  }
  const content = `export const lessons = ${JSON.stringify(lessons, null, 2)};

export const walkthroughs = {};

export const quizzes = {};

export const seoGuides = {};
`;
  fs.writeFileSync(path.join(langsDir, lang+'.mjs'), content, 'utf8');
  console.log('wrote', lang);
}
