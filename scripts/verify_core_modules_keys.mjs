import fs from 'fs';

const table = JSON.parse(fs.readFileSync('src/locales/t12table.json', 'utf8'));

const testKeys = [
  'HYDRAULIC & PNEUMATIC CYLINDER 1:1 DESIGN',
  '1. FLUID & PRESSURE',
  '2. CYLINDER SIZING',
  '3. CONNECTIONS & MOUNTING',
  '4. SEALING & CUSHIONING',
  '1:1 Cutaway CAD',
  'Strength & Buckling',
  'Dynamics & Supports',
  'Joints (Bolts, Welds)',
  'Cushioning & Ports',
  'Seals (Detailed)',
  'Thrust Force',
  'Pressure & Tube',
  'Buckling Safety',
  'Flow Rate & Flow',
  'Mass & CoG',
  'STEPPED SHAFT CAD',
  '2D CAD Drafting',
  'Stress & Fatigue',
  'DIN 743 Detail Analysis',
  'Standards Inspection',
  'Bolt Torque & Preload',
  'Assembly & Torque (VDI 2230)',
  'Thread Geometry & ISO Standards',
  '2D Standards Guide (SepetaCAD)'
];

for (const k of testKeys) {
  const entry = table[k] || table[k.trim()];
  console.log(k, '=>', entry ? entry.zh : 'MISSING');
}
