import fs from 'fs';

const oringFiles = [
  'src/components/modules/mechanical/ORingModule.tsx',
  'src/components/visualizers/SealVisualizers.tsx'
];

const table = JSON.parse(fs.readFileSync('src/locales/t12table.json', 'utf8'));
const oringMap = new Map();

for (const f of oringFiles) {
  const code = fs.readFileSync(f, 'utf8');
  const regex = /t12\(\s*(?:language|lang)\s*,\s*(['"`])((?:\\.|[^\\])*?)\1\s*(?:,\s*(['"`])((?:\\.|[^\\])*?)\3)?\s*\)/g;
  let match;
  while ((match = regex.exec(code)) !== null) {
    const en = match[2];
    const tr = match[4];
    if (!table[en] && !table[en.trim()]) {
      oringMap.set(en, tr || en);
    }
  }
}

console.log('Unique missing O-Ring keys:', oringMap.size);
fs.writeFileSync('scripts/oring_missing_keys.json', JSON.stringify(Array.from(oringMap.entries()).map(([en, tr]) => ({ en, tr })), null, 2));
