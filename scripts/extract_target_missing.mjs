import fs from 'fs';

const targetFiles = [
  'src/components/modules/mechanical/ORingModule.tsx',
  'src/components/visualizers/SealVisualizers.tsx',
  'src/components/modules/mechanical/KeywayConnectionModule.tsx',
  'src/modules/mechanical/CylinderDesign/index.tsx',
  'src/components/modules/mechanical/CylindersModule.tsx',
  'src/components/modules/mechanical/FastenerTechnicalDrawing.tsx',
  'src/components/modules/mechanical/FastenerAssemblyModule.tsx',
  'src/modules/mechanical/ShaftDesign/index.tsx',
  'src/components/modules/mechanical/ShaftsModule.tsx'
];

const table = JSON.parse(fs.readFileSync('src/locales/t12table.json', 'utf8'));
const map = new Map();

for (const f of targetFiles) {
  if (!fs.existsSync(f)) continue;
  const code = fs.readFileSync(f, 'utf8');
  const regex = /t12\(\s*(?:language|lang)\s*,\s*(['"`])((?:\\.|[^\\])*?)\1\s*(?:,\s*(['"`])((?:\\.|[^\\])*?)\3)?\s*\)/g;
  let match;
  while ((match = regex.exec(code)) !== null) {
    const en = match[2];
    const tr = match[4];
    if (!table[en] && !table[en.trim()]) {
      map.set(en, tr || en);
    }
  }
}

console.log('Total missing keys for these target modules:', map.size);
fs.writeFileSync('scripts/target_missing_keys.json', JSON.stringify(Array.from(map.entries()).map(([en, tr]) => ({ en, tr })), null, 2));
