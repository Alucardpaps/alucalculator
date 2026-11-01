import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const artifactScreenshotDir = 'C:\\Users\\apo_q\\.gemini\\antigravity\\brain\\a1a6defd-f3ed-48e2-9096-fb0c1e87e8f6\\screenshots';
if (!fs.existsSync(artifactScreenshotDir)) {
  fs.mkdirSync(artifactScreenshotDir, { recursive: true });
}

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const routes = [
  { name: 'verify_fluid_dynamics_suite', url: 'http://localhost:3000/fluid-dynamics' },
  { name: 'verify_pipe_friction_redirect', url: 'http://localhost:3000/pipe-friction' },
  { name: 'verify_aerospace_dynamics_suite', url: 'http://localhost:3000/aerospace-dynamics' },
  { name: 'verify_wind_tunnel_redirect', url: 'http://localhost:3000/wind-tunnel' },
  { name: 'verify_vibration_suite', url: 'http://localhost:3000/vibration' },
  { name: 'verify_pressure_vessel_suite', url: 'http://localhost:3000/pressure-vessel' },
  { name: 'verify_thermal_expansion_suite', url: 'http://localhost:3000/thermal-expansion' },
  { name: 'verify_heat_sink_suite', url: 'http://localhost:3000/heat-sink' },
  { name: 'verify_pumps_suite', url: 'http://localhost:3000/pumps' },
  { name: 'verify_hvac_load_suite', url: 'http://localhost:3000/hvac-load' },
];

console.log(`Starting headless browser capture of ${routes.length} routes...`);

for (const route of routes) {
  const outFile = path.join(artifactScreenshotDir, `${route.name}.png`);
  console.log(`Snapshotting: ${route.url} -> ${outFile}`);
  try {
    const cmd = `powershell -Command "Start-Process '${chromePath}' -ArgumentList '--headless', '--screenshot=${outFile}', '--window-size=1440,900', '--virtual-time-budget=3000', '${route.url}' -Wait"`;
    execSync(cmd, { stdio: 'ignore' });
    if (fs.existsSync(outFile)) {
      const stats = fs.statSync(outFile);
      console.log(`  ✓ SUCCESS: ${route.name}.png (${(stats.size / 1024).toFixed(1)} KB)`);
    } else {
      console.error(`  ✗ FAILED: File not generated for ${route.name}`);
    }
  } catch (err) {
    console.error(`  ✗ ERROR on ${route.name}:`, err.message);
  }
}

console.log('Capture complete!');
