import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const screenshotDir = path.join(__dirname, '..', 'screenshots');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const userDataDir = path.join(__dirname, '..', '.tmp_chrome_verify');

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
  const outPath = path.join(screenshotDir, filename);
  fs.writeFileSync(outPath, buffer);
  console.log(`  📸 Saved: ${filename} (${buffer.length} bytes)`);
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

async function run() {
  console.log('Connecting to Chrome CDP for verification pass...');
  let version = null;
  for (let i = 0; i < 25; i++) {
    try {
      const res = await fetch('http://127.0.0.1:9222/json/version');
      version = await res.json();
      if (version.webSocketDebuggerUrl) break;
    } catch (e) {
      await sleep(400);
    }
  }

  const newTargetRes = await fetch('http://127.0.0.1:9222/json/new?about:blank', { method: 'PUT' });
  const target = await newTargetRes.json();
  const ws = new WebSocket(target.webSocketDebuggerUrl);

  await new Promise(resolve => ws.addEventListener('open', resolve));
  await sendCDP(ws, 'Page.enable');
  await sendCDP(ws, 'Runtime.enable');

  // 1. Gears ISO 6336 Verification (No SVG overlap)
  console.log('\n--- 1. Testing Gears ISO 6336 Overlap Fix ---');
  await sendCDP(ws, 'Page.navigate', { url: 'http://localhost:3000/gears' });
  await sleep(3500);
  await dismissBanners(ws);
  await captureShot(ws, 'verified_01_gears_no_overlap.png');

  // 2. FEA Unified Header Bar Verification
  console.log('\n--- 2. Testing FEA Unified Header Bar ---');
  await sendCDP(ws, 'Page.navigate', { url: 'http://localhost:3000/fea' });
  await sleep(3500);
  await dismissBanners(ws);
  // Trigger solve on current model to see von Mises and top controls
  await evalInPage(ws, `
    const btns = Array.from(document.querySelectorAll('button'));
    const solveBtn = btns.find(b => b.textContent && (b.textContent.includes('FEA Çözümünü Başlat') || b.textContent.includes('Solve')));
    if (solveBtn) solveBtn.click();
  `);
  await sleep(2500);
  await captureShot(ws, 'verified_02_fea_unified_bar.png');

  // 3. Fits & Tolerances English UI Verification
  console.log('\n--- 3. Testing Fits & Tolerances English UI ---');
  await sendCDP(ws, 'Page.navigate', { url: 'http://localhost:3000/fits' });
  await sleep(3500);
  await dismissBanners(ws);
  await captureShot(ws, 'verified_03_fits_tolerances_english.png');

  // 4. Homepage Header Instrument Cluster & 34 Field Sensors
  console.log('\n--- 4. Testing Homepage Instrument Cluster & 34 Field Sensors ---');
  await sendCDP(ws, 'Page.navigate', { url: 'http://localhost:3000/' });
  await sleep(3000);
  await dismissBanners(ws);
  await evalInPage(ws, `
    const m = document.querySelector('main');
    if (m) m.scrollTo(0, 350);
  `);
  await sleep(1000);
  await captureShot(ws, 'verified_04_homepage_header_and_sensors.png');

  // 5. Studio Auto-collapse Sidebar
  console.log('\n--- 5. Testing Studio Sidebar Auto-Collapse ---');
  await sendCDP(ws, 'Page.navigate', { url: 'http://localhost:3000/design-studio' });
  await sleep(3500);
  await dismissBanners(ws);
  await captureShot(ws, 'verified_05_design_studio_autocollapsed.png');

  ws.close();
  chrome.kill();
  console.log('✅ All verification captures completed successfully!');
  process.exit(0);
}

run().catch(err => {
  console.error('Error during verification pass:', err);
  process.exit(1);
});
