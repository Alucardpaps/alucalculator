const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const edge = '"C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"';
const outDir = 'C:\\Users\\apo_q\\.gemini\\antigravity\\brain\\a1a6defd-f3ed-48e2-9096-fb0c1e87e8f6\\screenshots';

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const targets = [
  { name: 'verify_field_desktop', url: 'http://localhost:3000/field/', size: '1440,920' },
  { name: 'verify_field_mobile', url: 'http://localhost:3000/field/', size: '390,844' },
  { name: 'verify_field_mobile_tr', url: 'http://localhost:3000/field/?lang=tr', size: '390,844' },
  { name: 'verify_field_widget', url: 'http://localhost:3000/field/widget/', size: '420,740' },
  { name: 'verify_field_widget_tr', url: 'http://localhost:3000/field/widget/?lang=tr', size: '420,740' },
];

console.log('Starting Field Tools & Widget verification captures...');

for (const t of targets) {
  const outFile = path.join(outDir, `${t.name}.png`);
  console.log(`Capturing ${t.name} from ${t.url} [size: ${t.size}]...`);
  try {
    execSync(`${edge} --headless --screenshot="${outFile}" --window-size=${t.size} --virtual-time-budget=4500 "${t.url}"`);
    if (fs.existsSync(outFile)) {
      const sz = fs.statSync(outFile).size;
      console.log(`[OK] Saved ${outFile} (${(sz / 1024).toFixed(1)} KB)`);
    } else {
      console.error(`[WARN] File not created for ${t.name}`);
    }
  } catch (err) {
    console.error(`[FAIL] ${t.name}:`, err.message);
  }
}

console.log('All Field & Widget captures completed successfully!');
