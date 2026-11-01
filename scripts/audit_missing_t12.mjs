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

const report = [];

for (const f of allFiles) {
  const code = fs.readFileSync(f, 'utf8');
  const regex = /t12\(\s*(?:language|lang)\s*,\s*(['"`])((?:\\.|[^\\])*?)\1\s*(?:,\s*(['"`])((?:\\.|[^\\])*?)\3)?\s*\)/g;
  let match;
  const calls = [];
  while ((match = regex.exec(code)) !== null) {
    calls.push({ en: match[2], tr: match[4] });
  }

  if (calls.length > 0) {
    const missing = calls.filter(c => !table[c.en] && !table[c.en.trim()]);
    report.push({
      file: f,
      total: calls.length,
      missing: missing.length,
      missingList: missing
    });
  }
}

report.sort((a, b) => b.missing - a.missing);

console.log("Top files with missing t12 keys:");
for (const r of report.slice(0, 15)) {
  console.log(`${r.file}: total=${r.total}, missing=${r.missing} (${Math.round((r.missing/r.total)*100)}%)`);
}

const totalMissingUnique = new Set();
for (const r of report) {
  for (const m of r.missingList) {
    totalMissingUnique.add(JSON.stringify({ en: m.en, tr: m.tr }));
  }
}
console.log(`\nTotal unique missing t12 keys across modules: ${totalMissingUnique.size}`);
fs.writeFileSync('scripts/missing_t12_keys.json', JSON.stringify(Array.from(totalMissingUnique).map(s => JSON.parse(s)), null, 2));
