/**
 * Composes phrase maps from engineering-units lesson + authored phrase tables.
 * Run: node scripts/academy-i18n-data/translation-tables/phrases/compose-phrases.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const enKeys = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', '..', 'seed-data-sources/en-keys.json'), 'utf8'),
);
const LANGS = ['de', 'es', 'fr', 'it', 'pt', 'ru', 'zh', 'ja', 'ko', 'ar'];

const PHRASE_TABLES = {};
for (const lang of LANGS) {
  const jsonPath = path.join(__dirname, 'phrase-tables', `${lang}.json`);
  if (fs.existsSync(jsonPath)) {
    PHRASE_TABLES[lang] = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  }
}
const unitsLesson = (await import('../../locale-data-src/lessons/engineering-units-and-standards.mjs')).default;

function extractFromUnits(lang) {
  const u = unitsLesson[lang];
  const map = {};
  if (!u) return map;
  const pairs = [
    [u.stepByStep, [
      'Identify the source unit (e.g., mm).',
      'Identify the target unit (e.g., inch).',
      'Apply the conversion factor.',
      'Verify the magnitude of the result.',
      'Round to the appropriate significant figures.',
      'Document the unit system on the calculation worksheet header.',
      'Convert temperature to kelvin when using gas laws or thermal expansion.',
    ]],
    [u.whyThisMatters, [
      'Incorrect unit conversion led to the loss of the Mars Climate Orbiter.',
      'Manufacturing tolerances are often specified in microns (μm), requiring high precision.',
    ]],
    [u.commonMistakes, [
      'Using decimal points incorrectly in different locales (comma vs point).',
      'Mixing mass (kg) and force (N) units in calculations.',
      'Neglecting temperature unit shifts (Celsius to Kelvin).',
    ]],
    [u.engineeringTip, 'Always use SI units for internal calculations and only convert to Imperial for final presentation if required.'],
    [u.faq?.map((f) => f.question), [
      'What is the base unit of length in SI?',
      'Why is 25.4 mm/in exact?',
      'Can I use kg and N interchangeably?',
      'When should I convert to Imperial?',
    ]],
    [u.faq?.map((f) => f.answer), [
      'The meter (m).',
      'The inch was redefined in 1959 so that 1 in = 25.4 mm exactly — use this value, not 25.0, for precision fits.',
      'No. kg is mass; N is force (kg·m/s²). Weight in newtons equals mass times local gravity.',
      'Convert only at presentation boundaries — carry SI internally through all calculation steps.',
    ]],
    [u.formula?.variables ? Object.values(u.formula.variables) : [], ['mm: Millimeters', 'inch: Inches (Imperial)'].map((s) => s.split(': ')[1] ?? s)],
    [u.learningObjectives, [
      'Convert between SI and Imperial length, mass, and force units without ambiguity',
      'Identify when mass (kg) must not be substituted for force (N) in equilibrium equations',
      'Apply ISO/DIN rounding rules for manufacturing tolerances expressed in microns',
    ]],
    [u.keyTakeaways, [
      'Always carry SI internally; convert only at presentation boundaries',
      '1 in = 25.4 mm exactly — never approximate for precision fits',
      'Unit errors propagate silently until they cause field failures',
    ]],
    [u.supplementalParagraph ? [u.supplementalParagraph] : [], [
      'Every AluCalc kernel assumes SI internally. This lesson trains you to spot mixed-unit traps before they reach a drawing or BOM — the same discipline NASA mandates after the Mars Orbiter loss.',
    ]],
    [u.calculatorCta ? [u.calculatorCta.label] : [], [
      'Use the Unit Converter for professional-grade transformations instantly',
    ]],
  ];
  for (const [translated, english] of pairs) {
    if (!translated || !english) continue;
    const translatedArr = Array.isArray(translated) ? translated : [translated];
    const englishArr = Array.isArray(english) ? english : [english];
    englishArr.forEach((en, i) => {
      if (translatedArr[i] && en) map[en] = translatedArr[i];
    });
  }
  return map;
}

for (const lang of LANGS) {
  const table = PHRASE_TABLES[lang] ?? {};
  const fromUnits = extractFromUnits(lang);
  const merged = { ...fromUnits, ...table };
  const missing = enKeys.filter((k) => !merged[k]);
  if (missing.length) {
    console.error(`${lang}: missing ${missing.length} phrases`);
    fs.writeFileSync(
      path.join(__dirname, `missing-${lang}.txt`),
      missing.join('\n'),
      'utf8',
    );
    process.exitCode = 1;
    continue;
  }
  const PHRASES = Object.fromEntries(enKeys.map((k) => [k, merged[k]]));
  fs.writeFileSync(
    path.join(__dirname, `${lang}.mjs`),
    `export const PHRASES = ${JSON.stringify(PHRASES, null, 2)};\n`,
    'utf8',
  );
  console.log(`Wrote phrases/${lang}.mjs (${Object.keys(PHRASES).length} entries, ${Object.keys(fromUnits).length} from units lesson)`);
}
