import fs from 'fs';
import path from 'path';

const table = JSON.parse(fs.readFileSync('src/locales/t12table.json', 'utf8'));

function scanDir(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const item of list) {
    const full = path.join(dir, item);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      results = results.concat(scanDir(full));
    } else if (full.endsWith('.tsx') || full.endsWith('.ts')) {
      results.push(full);
    }
  }
  return results;
}

const allFiles = scanDir('src/components/modules').concat(scanDir('src/modules'));
const fileStats = [];

for (const f of allFiles) {
  const code = fs.readFileSync(f, 'utf8');
  const regex = /t12\(\s*(?:language|lang)\s*,\s*(['"`])((?:\\.|[^\\])*?)\1\s*(?:,\s*(['"`])((?:\\.|[^\\])*?)\3)?\s*\)/g;
  let match;
  let missing = 0;
  let total = 0;
  const missingItems = [];
  while ((match = regex.exec(code)) !== null) {
    total++;
    const en = match[2];
    if (!table[en] && !table[en.trim()]) {
      missing++;
      missingItems.push({ en, tr: match[4] || en });
    }
  }
  if (missing > 0) {
    fileStats.push({ file: f, missing, total, missingItems });
  }
}

fileStats.sort((a, b) => b.missing - a.missing);
console.log('Files with missing keys:');
fileStats.forEach(s => console.log(`${s.file} : ${s.missing} / ${s.total}`));

fs.writeFileSync('scripts/missing_by_file.json', JSON.stringify(fileStats, null, 2));
