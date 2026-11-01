import fs from 'fs';

const table = JSON.parse(fs.readFileSync('src/locales/t12table.json', 'utf8'));
const code = fs.readFileSync('src/components/modules/mechanical/ORingModule.tsx', 'utf8');

const regex = /t12\(\s*(?:language|lang)\s*,\s*(['"`])((?:\\.|[^\\])*?)\1\s*(?:,\s*(['"`])((?:\\.|[^\\])*?)\3)?\s*\)/g;
let match;
let missing = [];
let found = [];

while ((match = regex.exec(code)) !== null) {
  const en = match[2];
  const tr = match[4];
  const entry = table[en] || table[en.trim()];
  if (!entry) {
    missing.push({ en, tr });
  } else {
    found.push({ en, zh: entry.zh });
  }
}

console.log(`Found: ${found.length}, Missing: ${missing.length}`);
if (missing.length > 0) {
  console.log('Missing items:');
  console.log(JSON.stringify(missing, null, 2));
}
