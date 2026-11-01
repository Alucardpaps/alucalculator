import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');
const screenshotDir = path.join(rootDir, 'site_screenshots');

// Ensure clean screenshots directory
if (fs.existsSync(screenshotDir)) {
  fs.rmSync(screenshotDir, { recursive: true, force: true });
}
fs.mkdirSync(screenshotDir, { recursive: true });

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const userDataDir = path.join(rootDir, '.tmp_chrome_screens');

if (fs.existsSync(userDataDir)) {
  try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch (e) {}
}

const chrome = spawn(chromePath, [
  '--headless=new',
  '--remote-debugging-port=9222',
  '--window-size=1920,1080',
  `--user-data-dir=${userDataDir}`,
  '--disable-gpu',
  '--no-sandbox',
  '--hide-scrollbars'
]);

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function sendCDP(ws, method, params = {}) {
  const id = Math.floor(Math.random() * 1000000);
  return new Promise((resolve, reject) => {
    const handler = (msg) => {
      try {
        const data = JSON.parse(msg.data);
        if (data.id === id) {
          ws.removeEventListener('message', handler);
          if (data.error) reject(data.error);
          else resolve(data.result);
        }
      } catch (err) {
        // ignore
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

const pagesToCapture = [
  // --- Core Landing & Studios ---
  { name: '01_homepage_hero', url: 'http://localhost:3000/', scroll: 0 },
  { name: '02_homepage_bento_grid', url: 'http://localhost:3000/', scroll: 900 },
  { name: '03_homepage_footer', url: 'http://localhost:3000/', scroll: 1800 },
  { name: '04_design_studio_3d', url: 'http://localhost:3000/design-studio', wait: 3500 },
  { name: '05_cad_editor_2d', url: 'http://localhost:3000/cad-editor', wait: 3000 },
  { name: '06_flow_engine', url: 'http://localhost:3000/flow', wait: 3000 },
  { name: '07_flow_world_sandbox', url: 'http://localhost:3000/flow-world', wait: 3000 },
  { name: '08_fea_studio', url: 'http://localhost:3000/fea', wait: 3000 },
  { name: '09_calculators_catalog', url: 'http://localhost:3000/calculators', wait: 2000 },

  // --- Mechanical Solvers (ISO/DIN) ---
  { name: '10_bolt_torque_vdi2230', url: 'http://localhost:3000/bolt-torque', wait: 2500 },
  { name: '11_bearings_iso281', url: 'http://localhost:3000/bearings', wait: 2500 },
  { name: '12_gears_iso6336', url: 'http://localhost:3000/gears', wait: 2500 },
  { name: '13_beam_deflection', url: 'http://localhost:3000/beam-deflection', wait: 2500 },
  { name: '14_column_buckling', url: 'http://localhost:3000/column-buckling', wait: 2500 },
  { name: '15_cutting_optimizer', url: 'http://localhost:3000/cutting-optimizer', wait: 2500 },
  { name: '16_cylinders', url: 'http://localhost:3000/cylinders', wait: 2500 },
  { name: '17_o_ring_seals', url: 'http://localhost:3000/o-ring', wait: 2500 },
  { name: '18_press_fit', url: 'http://localhost:3000/press-fit', wait: 2500 },
  { name: '19_keyway_connection', url: 'http://localhost:3000/keyway-connection', wait: 2500 },
  { name: '20_shafts_din743', url: 'http://localhost:3000/shafts', wait: 2500 },
  { name: '21_sheet_metal_din6935', url: 'http://localhost:3000/sheet-metal', wait: 2500 },
  { name: '22_fits_and_tolerances', url: 'http://localhost:3000/fits', wait: 2500 },

  // --- Academy & Portals ---
  { name: '23_academy_campus', url: 'http://localhost:3000/academy', wait: 2500 },
  { name: '24_academy_quest_interactive', url: 'http://localhost:3000/academy/beam-deflection-formula-explained', wait: 2500 },
  { name: '25_field_sensor_suite', url: 'http://localhost:3000/field', wait: 2500 },
  { name: '26_materials_database', url: 'http://localhost:3000/materials', wait: 2500 },
  { name: '27_sketch_pad', url: 'http://localhost:3000/sketch-pad', wait: 2500 },
  { name: '28_mobile_pwa_terminal', url: 'http://localhost:3000/mobile', wait: 2500 },
  { name: '29_pricing', url: 'http://localhost:3000/pricing', wait: 2000 },
  { name: '30_changelog', url: 'http://localhost:3000/changelog', wait: 2000 },
  { name: '31_download_center', url: 'http://localhost:3000/download', wait: 2000 },
  { name: '32_lite_deterministic_solvers', url: 'http://localhost:3000/lite', wait: 2500 },

  // --- Deep Mechanical, Power & Thermal Engines (New) ---
  { name: '33_planetary_gearbox', url: 'http://localhost:3000/planetary-gearbox', wait: 2500 },
  { name: '34_belt_drive', url: 'http://localhost:3000/belt-drive', wait: 2500 },
  { name: '35_chain_drive', url: 'http://localhost:3000/chain-drive', wait: 2500 },
  { name: '36_welding_joint_analysis', url: 'http://localhost:3000/welding', wait: 2500 },
  { name: '37_thermal_expansion', url: 'http://localhost:3000/thermal-expansion', wait: 2500 },
  { name: '38_unit_converter', url: 'http://localhost:3000/unit-converter', wait: 2000 },
  { name: '39_concrete_reinforcement', url: 'http://localhost:3000/concrete-reinforcement', wait: 2500 },
  { name: '40_three_phase_power', url: 'http://localhost:3000/three-phase-power', wait: 2500 },
  { name: '41_fluid_dynamics', url: 'http://localhost:3000/fluid-dynamics', wait: 2500 },
  { name: '42_helical_spring', url: 'http://localhost:3000/spring-design', wait: 2500 },
  { name: '43_advanced_spring_din2089', url: 'http://localhost:3000/advanced-spring', wait: 2500 },
  { name: '44_naval_hydrostatics', url: 'http://localhost:3000/naval-hydrostatics', wait: 2500 },
  { name: '45_topology_optimization', url: 'http://localhost:3000/topology-optimization', wait: 3000 },
  { name: '46_failure_diagnosis', url: 'http://localhost:3000/failure-diagnosis', wait: 2500 },
  { name: '47_materials_alloy_detail', url: 'http://localhost:3000/materials/6061-t6', wait: 2500 },
  { name: '48_materials_alloy_comparison', url: 'http://localhost:3000/compare/6061-t6-vs-7075-t6', wait: 2500 },
  { name: '49_academy_dynamics', url: 'http://localhost:3000/academy/dynamics', wait: 2500 },
  { name: '50_academy_additive_mfg', url: 'http://localhost:3000/academy/additive-manufacturing', wait: 2500 },
  { name: '51_academy_sandbox', url: 'http://localhost:3000/academy/sandbox', wait: 2500 },
  { name: '52_split_cad_editor', url: 'http://localhost:3000/split-cad', wait: 3000 },
  { name: '53_parametric_cad', url: 'http://localhost:3000/parametric-cad', wait: 3000 },
  { name: '54_workspace_assembly', url: 'http://localhost:3000/workspace/assembly', wait: 3000 },
  { name: '55_desktop_dashboard', url: 'http://localhost:3000/dashboard', wait: 2500 },

  // --- Mobile Viewports (iPhone 14 / 390x844 @ 2x) ---
  { name: 'm01_mobile_homepage', url: 'http://localhost:3000/', isMobile: true, wait: 2500 },
  { name: 'm02_mobile_bolt_torque', url: 'http://localhost:3000/bolt-torque', isMobile: true, wait: 2500 },
  { name: 'm03_mobile_beam_deflection', url: 'http://localhost:3000/beam-deflection', isMobile: true, wait: 2500 },
  { name: 'm04_mobile_fits_tolerances', url: 'http://localhost:3000/fits', isMobile: true, wait: 2500 },
  { name: 'm05_mobile_cutting_optimizer', url: 'http://localhost:3000/cutting-optimizer', isMobile: true, wait: 2500 },
  { name: 'm06_mobile_cylinders', url: 'http://localhost:3000/cylinders', isMobile: true, wait: 2500 },
  { name: 'm07_mobile_bearings', url: 'http://localhost:3000/bearings', isMobile: true, wait: 2500 },
  { name: 'm08_mobile_calculators_catalog', url: 'http://localhost:3000/calculators', isMobile: true, wait: 2500 }
];

async function main() {
  console.log('Connecting to Chrome CDP...');
  let version = null;
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch('http://127.0.0.1:9222/json/version');
      version = await res.json();
      if (version.webSocketDebuggerUrl) break;
    } catch (e) {
      await sleep(500);
    }
  }

  if (!version || !version.webSocketDebuggerUrl) {
    console.error('Failed to connect to Chrome CDP');
    chrome.kill();
    process.exit(1);
  }

  console.log('Connected to Chrome:', version.Browser);

  const newTargetRes = await fetch('http://127.0.0.1:9222/json/new?about:blank', { method: 'PUT' });
  const target = await newTargetRes.json();
  const ws = new WebSocket(target.webSocketDebuggerUrl);

  await new Promise((resolve) => ws.addEventListener('open', resolve));
  console.log('CDP WebSocket opened');

  await sendCDP(ws, 'Page.enable');
  await sendCDP(ws, 'Runtime.enable');

  await sendCDP(ws, 'Page.addScriptToEvaluateOnNewDocument', {
    source: `
      try {
        localStorage.setItem('alu_consent_telemetry', '1');
        localStorage.setItem('alu_consent_screenshot', '1');
        localStorage.setItem('alucalc-cookie-consent', 'true');
      } catch (e) {}
    `
  });

  let capturedCount = 0;
  for (const page of pagesToCapture) {
    try {
      console.log(`[${++capturedCount}/${pagesToCapture.length}] Navigating to ${page.name} (${page.url})${page.isMobile ? ' [MOBILE]' : ''}...`);

      if (page.isMobile) {
        await sendCDP(ws, 'Emulation.setDeviceMetricsOverride', {
          width: 390,
          height: 844,
          deviceScaleFactor: 2,
          mobile: true
        });
        await sendCDP(ws, 'Emulation.setUserAgentOverride', {
          userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
        });
      } else {
        await sendCDP(ws, 'Emulation.setDeviceMetricsOverride', {
          width: 1920,
          height: 1080,
          deviceScaleFactor: 1,
          mobile: false
        });
        await sendCDP(ws, 'Emulation.setUserAgentOverride', {
          userAgent: ''
        });
      }

      await sendCDP(ws, 'Page.navigate', { url: page.url });
      
      const waitTime = page.wait || 2500;
      await sleep(waitTime);

      // Clean cookie modals or telemetry banners
      await sendCDP(ws, 'Runtime.evaluate', {
        expression: `
          try {
            localStorage.setItem('alu_consent_telemetry', '1');
            localStorage.setItem('alu_consent_screenshot', '1');
            localStorage.setItem('alucalc-cookie-consent', 'true');
            const banners = document.querySelectorAll('.fixed');
            banners.forEach(b => {
              if (b.textContent && (b.textContent.includes('Gizlilik') || b.textContent.includes('Telemetry & KVKK') || b.textContent.includes('Cookie'))) {
                b.style.display = 'none';
              }
            });
          } catch(e) {}
        `
      });

      if (page.scroll) {
        await sendCDP(ws, 'Runtime.evaluate', {
          expression: `window.scrollTo({ top: ${page.scroll}, behavior: 'instant' });`
        });
        await sleep(600);
      }

      const screenshot = await sendCDP(ws, 'Page.captureScreenshot', {
        format: 'png',
        captureBeyondViewport: false
      });

      const buffer = Buffer.from(screenshot.data, 'base64');
      const filename = `${page.name}.png`;
      const outPath = path.join(screenshotDir, filename);
      fs.writeFileSync(outPath, buffer);
      console.log(`  ✓ Saved: ${filename} (${(buffer.length / 1024).toFixed(1)} KB)`);
    } catch (err) {
      console.error(`  ✗ Error capturing ${page.name}:`, err.message);
    }
  }

  ws.close();
  chrome.kill();
  try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch (e) {}
  console.log(`\n🎉 Successfully captured ${capturedCount} screenshots into: ${screenshotDir}`);
  process.exit(0);
}

main().catch(err => {
  console.error('Fatal execution error:', err);
  chrome.kill();
  process.exit(1);
});
