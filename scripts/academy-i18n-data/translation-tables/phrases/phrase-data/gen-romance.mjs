/**
 * Generates es/fr/it/pt phrase parts from de parts using embedded Romance translations.
 * Run: node scripts/academy-i18n-data/translation-tables/phrases/phrase-data/gen-romance.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const enKeys = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', '..', '..', 'seed-data-sources/en-keys.json'), 'utf8'),
);
const deJson = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'phrase-tables/de.json'), 'utf8'),
);
const deList = enKeys.map((k) => deJson[k]);

// Romance language translations keyed by en-keys index — generated from de semantic mapping
const { ES, FR, IT, PT } = await import('./romance-translations.mjs');

function writeParts(lang, list) {
  const chunk = 104;
  for (let i = 0; i < 4; i++) {
    const part = list.slice(i * chunk, (i + 1) * chunk);
    fs.writeFileSync(
      path.join(__dirname, `${lang}-p${i}.mjs`),
      `export const PART = ${JSON.stringify(part, null, 2)};\n`,
      'utf8',
    );
  }
  console.log(`${lang}: ${list.length} phrases in 4 parts`);
}

writeParts('es', ES);
writeParts('fr', FR);
writeParts('it', IT);
writeParts('pt', PT);
