const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const edge = '"C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"';
const outDir = 'C:\\Users\\apo_q\\.gemini\\antigravity\\brain\\a1a6defd-f3ed-48e2-9096-fb0c1e87e8f6\\screenshots';

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const targets = [
  { name: 'verify_three_phase_suite_tr', url: 'http://localhost:3000/three-phase-power/?lang=tr' },
  { name: 'verify_voltage_drop_suite_tr', url: 'http://localhost:3000/voltage-drop/?lang=tr' },
  { name: 'verify_fatigue_suite_tr', url: 'http://localhost:3000/fatigue-analysis/?lang=tr' },
  { name: 'verify_physics_solver_tr', url: 'http://localhost:3000/physics-solver/?lang=tr' },
  { name: 'verify_cost_estimator_tr', url: 'http://localhost:3000/cost-estimator/?lang=tr' },
  { name: 'verify_concrete_reinforcement_tr', url: 'http://localhost:3000/concrete-reinforcement/?lang=tr' },
];

console.log('Starting Turkish verification captures...');

for (const t of targets) {
  const outFile = path.join(outDir, `${t.name}.png`);
  console.log(`Capturing ${t.name} from ${t.url}...`);
  try {
    execSync(`${edge} --headless --screenshot="${outFile}" --window-size=1440,920 --virtual-time-budget=4000 "${t.url}"`);
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

console.log('All Turkish captures completed!');
