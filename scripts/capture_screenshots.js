const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const screenshotDir = path.join(__dirname, '..', 'screenshots');
if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir, { recursive: true });

const pages = [
  { name: '01_homepage_top', url: 'https://www.alucalculator.com', size: '1440,900' },
  { name: '02_design_studio_3d', url: 'https://www.alucalculator.com/design-studio', size: '1440,900' },
  { name: '03_cad_editor_2d', url: 'https://www.alucalculator.com/cad-editor', size: '1440,900' },
  { name: '04_fea_studio', url: 'https://www.alucalculator.com/fea', size: '1440,900' },
  { name: '05_flow_engine', url: 'https://www.alucalculator.com/flow', size: '1440,900' },
  { name: '06_bolt_torque_solver', url: 'https://www.alucalculator.com/bolt-torque', size: '1440,900' },
  { name: '07_bearings_solver', url: 'https://www.alucalculator.com/bearings', size: '1440,900' },
  { name: '08_beam_deflection_solver', url: 'https://www.alucalculator.com/beam-deflection', size: '1440,900' },
  { name: '09_nesting_2d', url: 'https://www.alucalculator.com/nesting-2d', size: '1440,900' },
  { name: '10_field_tools', url: 'https://www.alucalculator.com/field', size: '1440,900' },
  { name: '11_academy', url: 'https://www.alucalculator.com/academy', size: '1440,900' },
  { name: '12_materials_db', url: 'https://www.alucalculator.com/materials-db', size: '1440,900' },
  { name: '13_mobile_pwa', url: 'https://www.alucalculator.com/mobile', size: '1440,900' }
];

console.log('Capturing screenshots for ' + pages.length + ' pages...');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

for (const p of pages) {
  const outFile = path.join(screenshotDir, p.name + '.png');
  console.log('Capturing ' + p.name + ' -> ' + p.url);
  try {
    const cmd = `powershell -Command "Start-Process '${chromePath}' -ArgumentList '--headless', '--screenshot=${outFile}', '--window-size=${p.size}', '${p.url}' -Wait"`;
    execSync(cmd, { stdio: 'ignore' });
    if (fs.existsSync(outFile)) {
      console.log('  Done! Size: ' + fs.statSync(outFile).size + ' bytes');
    } else {
      console.log('  Failed to create file: ' + outFile);
    }
  } catch (err) {
    console.error('  Error:', err.message);
  }
}
console.log('All screenshots captured!');
