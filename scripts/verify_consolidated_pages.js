const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const edge = '"C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"';
const outDir = 'C:\\Users\\apo_q\\.gemini\\antigravity\\brain\\a1a6defd-f3ed-48e2-9096-fb0c1e87e8f6\\screenshots';

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const targets = [
  { name: 'verify_cost_estimator', url: 'http://localhost:3000/cost-estimator/' },
  { name: 'verify_concrete_reinforcement', url: 'http://localhost:3000/concrete-reinforcement/' },
  { name: 'verify_fatigue_sn', url: 'http://localhost:3000/fatigue-analysis/' },
  { name: 'verify_failure_prediction_redirect', url: 'http://localhost:3000/failure-prediction/' },
  { name: 'verify_physics_solver', url: 'http://localhost:3000/physics-solver/' },
  { name: 'verify_physics_kinematics_redirect', url: 'http://localhost:3000/physics-kinematics/' },
  { name: 'verify_periodic_table', url: 'http://localhost:3000/periodic-table/' },
  { name: 'verify_chemistry_reactions_redirect', url: 'http://localhost:3000/chemistry-reactions/' },
  { name: 'verify_three_phase_suite', url: 'http://localhost:3000/three-phase-power/' },
  { name: 'verify_voltage_drop_suite', url: 'http://localhost:3000/voltage-drop/' },
  { name: 'verify_ohms_law_suite', url: 'http://localhost:3000/ohms-law/' },
  { name: 'verify_filter_design_suite', url: 'http://localhost:3000/filter-design/' },
  { name: 'verify_digital_logic_suite', url: 'http://localhost:3000/digital-logic/' }
];

console.log('Starting verification captures for consolidated engineering pages...');

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

console.log('All verification captures completed!');
