/**
 * Generates academy lesson locale TypeScript bundles for all supported languages.
 * Run: node scripts/build-academy-lesson-i18n.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'src/locales/academyLessonI18n/locales');

const LANGS = ['tr', 'de', 'es', 'fr', 'it', 'pt', 'ru', 'zh', 'ja', 'ko', 'ar'];

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

const SEO_GUIDES = [
  { slug: '3-phase-power', title: '3-Phase Power' },
  { slug: 'beam-deflection', title: 'Beam Deflection' },
  { slug: 'bend-allowance', title: 'Sheet Metal Bend Allowance' },
  { slug: 'bending-moment', title: 'Bending Moment' },
  { slug: 'biology-genetics', title: 'Population Genetics (Hardy-Weinberg)' },
  { slug: 'centripetal-force', title: 'Centripetal Force' },
  { slug: 'chemical-molarity', title: 'Molarity Calculation' },
  { slug: 'concrete-reinforcement', title: 'Reinforced Concrete (RC) Design' },
  { slug: 'failure-diagnosis', title: 'Engineering Failure Diagnosis' },
  { slug: 'failure-prediction', title: 'AI Failure Prediction & Reliability' },
  { slug: 'gear-contact-stress', title: 'Gear Contact Stress' },
  { slug: 'gear-module', title: 'Gear Module' },
  { slug: 'gear-ratio', title: 'Gear Ratio' },
  { slug: 'heat-transfer-conduction', title: 'Heat Conduction' },
  { slug: 'ideal-gas-law', title: 'Ideal Gas Law' },
  { slug: 'kinetic-energy', title: 'Kinetic Energy' },
  { slug: 'lift-coefficient', title: 'Lift Force' },
  { slug: 'machine-assembly', title: 'Precision Machine Assembly' },
  { slug: 'naval-hydrostatics', title: 'Naval Hydrostatics & Stability' },
  { slug: 'newton-second-law', title: 'Force Calculation (F=ma)' },
  { slug: 'ohms-law', title: "Ohm's Law (Advanced DC/AC)" },
  { slug: 'physics-solver', title: 'Computational Physics Solver' },
  { slug: 'pumps', title: 'Centrifugal Pump Performance' },
  { slug: 'radioactive-decay', title: 'Radioactive Decay (Half-Life)' },
  { slug: 'reducer-lubrication', title: 'Gearbox Lubrication & Thermal' },
  { slug: 'reynolds-number', title: 'Reynolds Number' },
  { slug: 'rocket-equation', title: 'Tsiolkovsky Rocket Equation' },
  { slug: 'simulation-fea', title: 'Finite Element Analysis (FEA)' },
  { slug: 'specific-gravity', title: 'Specific Gravity' },
  { slug: 'thermal-expansion', title: 'Linear Thermal Expansion' },
  { slug: 'timing-belt-design', title: 'Timing Belt Design' },
  { slug: 'tolerance-stackup', title: 'Tolerance Stackup' },
  { slug: 'topology-optimization', title: 'Generative Topology Optimization' },
  { slug: 'transformer-calculation', title: 'Transformer Scaling' },
  { slug: 'voltage-drop', title: 'Conductor Voltage Drop' },
];

// Load generated bundles from data directory
const DATA_DIR = path.join(__dirname, 'academy-i18n-data');

function loadBundle(lang) {
  const file = path.join(DATA_DIR, `${lang}.json`);
  if (!fs.existsSync(file)) {
    console.error(`Missing data file: ${file}`);
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function writeLocaleFile(lang, bundle) {
  const constName = `${lang.toUpperCase()}_BUNDLE`;
  const content = `import type { AcademyLessonLocaleBundle } from '../types';

export const ${constName}: AcademyLessonLocaleBundle = ${JSON.stringify(bundle, null, 2)} as AcademyLessonLocaleBundle;
`;
  fs.writeFileSync(path.join(OUT_DIR, `${lang}.ts`), content, 'utf8');
  console.log(`Written ${lang}.ts`);
}

for (const lang of LANGS) {
  const bundle = loadBundle(lang);
  writeLocaleFile(lang, bundle);
}

console.log('Done.');
