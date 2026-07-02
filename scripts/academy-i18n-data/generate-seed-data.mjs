/**
 * Generates seed-data/*.json from embedded translation packs.
 * Run: node scripts/academy-i18n-data/generate-seed-data.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { INTRO_DESC } from './seed-data-sources/intro-desc.mjs';
import { ENRICHMENT } from './seed-data-sources/enrichment.mjs';
import { BODIES } from './seed-data-sources/bodies.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, 'seed-data');

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'intro-desc.json'), JSON.stringify(INTRO_DESC, null, 2), 'utf8');
fs.writeFileSync(path.join(OUT, 'enrichment.json'), JSON.stringify(ENRICHMENT, null, 2), 'utf8');
fs.writeFileSync(path.join(OUT, 'bodies.json'), JSON.stringify(BODIES, null, 2), 'utf8');
console.log('Generated seed-data JSON files');
