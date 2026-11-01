import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const screenshotDir = path.join(__dirname, '..', 'screenshots');
if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir, { recursive: true });

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const userDataDir = path.join(__dirname, '..', '.tmp_chrome_profile');

// Clean profile
if (fs.existsSync(userDataDir)) {
  try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch (e) {}
}

const chrome = spawn(chromePath, [
  '--headless=new',
  '--remote-debugging-port=9222',
  '--window-size=1440,900',
  `--user-data-dir=${userDataDir}`,
  '--disable-gpu',
  '--no-sandbox'
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

async function run() {
  console.log('Waiting for Chrome CDP to be ready...');
  let version = null;
  for (let i = 0; i < 20; i++) {
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

  console.log('Connected to CDP:', version.Browser);

  // Get pages or create a target
  const newTargetRes = await fetch('http://127.0.0.1:9222/json/new?about:blank', { method: 'PUT' });
  const target = await newTargetRes.json();
  const ws = new WebSocket(target.webSocketDebuggerUrl);

  await new Promise((resolve) => ws.addEventListener('open', resolve));
  console.log('WebSocket connected to page target');

  await sendCDP(ws, 'Page.enable');
  await sendCDP(ws, 'Runtime.enable');

  // Pre-accept cookies and telemetry in localStorage before scripts run
  await sendCDP(ws, 'Page.addScriptToEvaluateOnNewDocument', {
    source: `
      try {
        localStorage.setItem('alu_consent_telemetry', '1');
        localStorage.setItem('alu_consent_screenshot', '1');
        localStorage.setItem('alucalc-cookie-consent', 'true');
      } catch (e) {}
    `
  });

  const pagesToCapture = [
    { name: '01_homepage_clean', url: 'http://localhost:3000/' },
    { name: '02_design_studio_3d', url: 'http://localhost:3000/design-studio' },
    { name: '03_cad_editor_2d', url: 'http://localhost:3000/cad-editor' },
    { name: '04_fea_studio', url: 'http://localhost:3000/fea' },
    { name: '05_flow_engine', url: 'http://localhost:3000/flow' },
    { name: '06_bolt_torque', url: 'http://localhost:3000/bolt-torque' },
    { name: '07_bearings', url: 'http://localhost:3000/bearings' },
    { name: '08_beam_deflection', url: 'http://localhost:3000/beam-deflection' },
    { name: '09_nesting_2d', url: 'http://localhost:3000/nesting-2d' },
    { name: '10_field_tools', url: 'http://localhost:3000/field' },
    { name: '11_academy', url: 'http://localhost:3000/academy' },
    { name: '12_materials_db', url: 'http://localhost:3000/materials-db' },
    { name: '13_mobile_pwa', url: 'http://localhost:3000/mobile' }
  ];

  for (const page of pagesToCapture) {
    console.log(`Navigating to ${page.name} (${page.url})...`);
    await sendCDP(ws, 'Page.navigate', { url: page.url });

    // Wait for load and rendering
    await sleep(2500);

    // Also run consent setting in case domain/origin wasn't set yet on blank
    await sendCDP(ws, 'Runtime.evaluate', {
      expression: `
        try {
          localStorage.setItem('alu_consent_telemetry', '1');
          localStorage.setItem('alu_consent_screenshot', '1');
          localStorage.setItem('alucalc-cookie-consent', 'true');
          const banners = document.querySelectorAll('.fixed');
          banners.forEach(b => {
            if (b.textContent && (b.textContent.includes('Gizlilik') || b.textContent.includes('Telemetry & KVKK'))) {
              b.style.display = 'none';
            }
          });
        } catch(e) {}
      `
    });
    await sleep(500);

    console.log(`Capturing screenshot for ${page.name}...`);
    const screenshot = await sendCDP(ws, 'Page.captureScreenshot', {
      format: 'png',
      captureBeyondViewport: false
    });

    const buffer = Buffer.from(screenshot.data, 'base64');
    const outPath = path.join(screenshotDir, `${page.name}.png`);
    fs.writeFileSync(outPath, buffer);
    console.log(`Saved: ${outPath} (${buffer.length} bytes)`);

    // Also take a scrolled screenshot for homepage to see catalog/index
    if (page.name === '01_homepage_clean') {
      await sendCDP(ws, 'Runtime.evaluate', {
        expression: 'window.scrollTo(0, 1000);'
      });
      await sleep(1000);
      const scrolled = await sendCDP(ws, 'Page.captureScreenshot', {
        format: 'png',
        captureBeyondViewport: false
      });
      fs.writeFileSync(path.join(screenshotDir, '01_homepage_scrolled_1000.png'), Buffer.from(scrolled.data, 'base64'));

      await sendCDP(ws, 'Runtime.evaluate', {
        expression: 'window.scrollTo(0, 2200);'
      });
      await sleep(1000);
      const scrolled2 = await sendCDP(ws, 'Page.captureScreenshot', {
        format: 'png',
        captureBeyondViewport: false
      });
      fs.writeFileSync(path.join(screenshotDir, '01_homepage_scrolled_footer.png'), Buffer.from(scrolled2.data, 'base64'));
    }
  }

  ws.close();
  chrome.kill();
  console.log('All screenshots finished successfully!');
  process.exit(0);
}

run().catch(err => {
  console.error('Fatal error:', err);
  chrome.kill();
  process.exit(1);
});
