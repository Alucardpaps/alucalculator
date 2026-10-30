import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const screenshotDir = path.join(__dirname, '..', 'screenshots');
if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir, { recursive: true });

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const userDataDir = path.join(__dirname, '..', '.tmp_chrome_cycle3');

if (fs.existsSync(userDataDir)) {
  try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch (e) {}
}

const chrome = spawn(chromePath, [
  '--headless=new',
  '--remote-debugging-port=9222',
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

const brainDir = 'C:\\Users\\apo_q\\.gemini\\antigravity\\brain\\ac396753-6ec1-4113-b763-3322c9c8fb41';

async function captureShot(ws, filename) {
  const screenshot = await sendCDP(ws, 'Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  const buffer = Buffer.from(screenshot.data, 'base64');
  const outPath = path.join(screenshotDir, filename);
  fs.writeFileSync(outPath, buffer);
  try {
    fs.writeFileSync(path.join(brainDir, filename), buffer);
  } catch (e) {}
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

async function main() {
  await sleep(2500);

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

  await new Promise(r => ws.addEventListener('open', r));
  await sendCDP(ws, 'Page.enable');
  await sendCDP(ws, 'Runtime.enable');
  await sendCDP(ws, 'Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false
  });

  // 1. Command Palette with Live Math: sqrt(144) * 25
  console.log('\n--- 1. Command Palette Live Math ---');
  await sendCDP(ws, 'Page.navigate', { url: 'http://localhost:3000/' });
  await sleep(4000);
  await dismissBanners(ws);

  // Open command palette with formula query
  const openRes = await evalInPage(ws, `(() => {
    if (typeof window.__openPalette === 'function') {
      window.__openPalette('sqrt(144) * 25');
      return 'CALLED_WINDOW_OPEN_PALETTE';
    }
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.title && b.title.includes('Global Search'));
    if (btn) {
      btn.click();
      return 'CLICKED_GLOBAL_SEARCH_BUTTON';
    }
    return 'NO_METHOD';
  })()`);
  console.log('  Open result:', openRes?.result?.value);
  await sleep(2000);

  // Type formula into cmdk input if not already set
  const typeRes = await evalInPage(ws, `(() => {
    const input = document.querySelector('input[cmdk-input]');
    if (!input) return 'NO_CMDK_INPUT';
    input.focus();
    if (!input.value) {
      const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      nativeSetter.call(input, 'sqrt(144) * 25');
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }
    return 'TYPED_FORMULA';
  })()`);
  console.log('  Type result:', typeRes?.result?.value);
  await sleep(2000);

  // Check if live math evaluated
  const mathCheck = await evalInPage(ws, `(() => {
    const text = document.body.innerText;
    return {
      has300: text.includes('300'),
      hasLiveMath: text.includes('Live Math') || text.includes('Canlı Matematik')
    };
  })()`);
  console.log('  Math evaluation:', mathCheck?.result?.value);
  await captureShot(ws, 'cycle3_01_command_palette_math.png');

  // Close command palette
  await evalInPage(ws, `(() => {
    if (typeof window.__closePalette === 'function') window.__closePalette();
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true }));
  })()`);
  await sleep(1000);

  // 2. Hero Section with Reconciled AeGiS Stage
  console.log('\n--- 2. Hero Section AeGiS Stage ---');
  await evalInPage(ws, `window.scrollTo({ top: 0, behavior: 'instant' });`);
  await sleep(1500);
  await captureShot(ws, 'cycle3_02_aegis_hero_reconciled.png');

  // 3. Press Fit Solver (DIN 7190)
  console.log('\n--- 3. Press Fit Solver (DIN 7190) ---');
  await sendCDP(ws, 'Page.navigate', { url: 'http://localhost:3000/press-fit' });
  await sleep(4000);
  await dismissBanners(ws);
  await captureShot(ws, 'cycle3_03_press_fit_solver.png');

  // 4. O-Ring Gland Design Solver (ISO 3601)
  console.log('\n--- 4. O-Ring Solver (ISO 3601) ---');
  await sendCDP(ws, 'Page.navigate', { url: 'http://localhost:3000/o-ring' });
  await sleep(4000);
  await dismissBanners(ws);
  await captureShot(ws, 'cycle3_04_oring_solver.png');

  // 5. DIN 6885 Keyway Connection Solver
  console.log('\n--- 5. DIN 6885 Keyway Solver ---');
  await sendCDP(ws, 'Page.navigate', { url: 'http://localhost:3000/keyway-connection' });
  await sleep(4000);
  await dismissBanners(ws);
  await captureShot(ws, 'cycle3_05_keyway_solver.png');

  console.log('\nAll Cycle 3 screenshots captured successfully!');
  ws.close();
  chrome.kill();
  process.exit(0);
}

main().catch(err => {
  console.error('Cycle 3 capture failed:', err);
  chrome.kill();
  process.exit(1);
});
