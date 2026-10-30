import fs from 'fs';

const files = [
  'src/modules/mechanical/CylinderDesign/index.tsx',
  'src/modules/mechanical/ShaftDesign/index.tsx',
  'src/components/modules/mechanical/FastenerTechnicalDrawing.tsx',
  'src/components/modules/mechanical/KeywayConnectionModule.tsx',
  'src/components/modules/mechanical/ORingModule.tsx'
];

for (const f of files) {
  const code = fs.readFileSync(f, 'utf8');
  const templateCalls = (code.match(/t12\(\s*(?:language|lang)\s*,\s*`[^`]*\$\{[^`]*`\s*,/g) || []).length;
  const staticCalls = (code.match(/t12\(\s*(?:language|lang)\s*,\s*(['"])[^'"]+\1\s*,/g) || []).length;
  console.log(`${f}: static=${staticCalls}, template=${templateCalls}`);
}
