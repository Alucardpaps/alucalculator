import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');
const outDir = path.join(rootDir, 'screenshots', 'latest');

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const userDataDir = path.join(rootDir, '.tmp_chrome_latest_capture');

if (fs.existsSync(userDataDir)) {
  try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch (e) {}
}

const chrome = spawn(chromePath, [
  '--headless=new',
  '--remote-debugging-port=9223',
  '--window-size=1440,900',
  `--user-data-dir=${userDataDir}`,
  '--disable-gpu',
  '--no-sandbox'
]);

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

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
      } catch (err) {}
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

async function evalInPage(ws, expression) {
  return await sendCDP(ws, 'Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true
  });
}

async function captureShot(ws, filename) {
  const screenshot = await sendCDP(ws, 'Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  const buffer = Buffer.from(screenshot.data, 'base64');
  const outPath = path.join(outDir, filename);
  fs.writeFileSync(outPath, buffer);
  console.log(`  [OK] Saved: ${filename} (${buffer.length} bytes)`);
}

async function dismissBanners(ws) {
  await evalInPage(ws, `
    try {
      window.alert = () => {};
      window.confirm = () => true;
      localStorage.setItem('alu_consent_telemetry', '1');
      localStorage.setItem('alu_consent_screenshot', '1');
      localStorage.setItem('alucalc-cookie-consent', 'true');
      document.querySelectorAll('.fixed').forEach(b => {
        if (b.textContent && (b.textContent.includes('Gizlilik') || b.textContent.includes('Telemetry & KVKK') || b.textContent.includes('Cookie'))) {
          b.style.display = 'none';
        }
      });
    } catch(e) {}
  `);
}

const targets = [
  { name: '01_homepage_hero.png', path: '/', waitMs: 4000 },
  { 
    name: '02_homepage_catalog.png', 
    path: '/', 
    waitMs: 2000, 
    action: async (ws) => {
      await evalInPage(ws, `const m = document.querySelector('main'); if (m) m.scrollTo(0, 600); else window.scrollTo(0, 600);`);
      await sleep(1500);
    } 
  },
  { name: '03_design_studio_3d.png', path: '/design-studio', waitMs: 4500 },
  { name: '04_cad_editor_2d.png', path: '/cad-editor', waitMs: 4000 },
  { 
    name: '05_fea_studio.png', 
    path: '/fea', 
    waitMs: 4000,
    action: async (ws) => {
      await evalInPage(ws, `
        const btns = Array.from(document.querySelectorAll('button'));
        const solveBtn = btns.find(b => b.textContent && (b.textContent.includes('FEA Çözümünü Başlat') || b.textContent.includes('Solve')));
        if (solveBtn) solveBtn.click();
      `);
      await sleep(2500);
    }
  },
  { name: '06_flow_engine.png', path: '/flow', waitMs: 4500 },
  { name: '07_gears_iso6336.png', path: '/gears', waitMs: 4000 },
  { name: '08_bolt_torque.png', path: '/bolt-torque', waitMs: 4000 },
  { name: '09_bearings_solver.png', path: '/bearings', waitMs: 4000 },
  { name: '10_fits_tolerances.png', path: '/fits', waitMs: 4000 },
  { name: '11_cutting_optimizer.png', path: '/cutting-optimizer', waitMs: 4000 },
  { name: '12_academy_campus.png', path: '/academy', waitMs: 4000 },
  { name: '13_mobile_pwa.png', path: '/mobile', waitMs: 4000 }
];

async function run() {
  console.log('Connecting to Chrome CDP on port 9223...');
  let version = null;
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch('http://127.0.0.1:9223/json/version');
      version = await res.json();
      if (version.webSocketDebuggerUrl) break;
    } catch (e) {
      await sleep(300);
    }
  }

  if (!version || !version.webSocketDebuggerUrl) {
    throw new Error('Could not connect to Chrome CDP.');
  }

  const newTargetRes = await fetch('http://127.0.0.1:9223/json/new?about:blank', { method: 'PUT' });
  const target = await newTargetRes.json();
  const ws = new WebSocket(target.webSocketDebuggerUrl);

  await new Promise(resolve => ws.addEventListener('open', resolve));
  await sendCDP(ws, 'Page.enable');
  await sendCDP(ws, 'Runtime.enable');

  for (const item of targets) {
    console.log(`\nNavigating to ${item.path} -> ${item.name}...`);
    await sendCDP(ws, 'Page.navigate', { url: `http://localhost:3000${item.path}` });
    await sleep(item.waitMs);
    await dismissBanners(ws);
    if (item.action) {
      await item.action(ws);
    }
    await captureShot(ws, item.name);
  }

  // Also take a mobile viewport screenshot of homepage
  console.log('\nNavigating to mobile homepage (390x844)...');
  await sendCDP(ws, 'Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true
  });
  await sendCDP(ws, 'Page.navigate', { url: 'http://localhost:3000/' });
  await sleep(3500);
  await dismissBanners(ws);
  await captureShot(ws, '14_homepage_mobile_view.png');

  ws.close();
  chrome.kill();
  console.log('\nAll latest screenshots captured successfully in screenshots/latest/!');
  process.exit(0);
}

run().catch(err => {
  console.error('Error during screenshot capture:', err);
  if (chrome) chrome.kill();
  process.exit(1);
});
