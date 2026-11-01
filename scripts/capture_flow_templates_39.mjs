import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const screenshotDir = path.join(__dirname, '..', 'screenshots');
if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir, { recursive: true });

const brainDir = 'C:\\Users\\apo_q\\.gemini\\antigravity\\brain\\999e2a65-14f5-4b7a-8e38-3a0ed1312bfd';
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const userDataDir = path.join(__dirname, '..', '.tmp_chrome_flow39');

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

async function captureShot(ws, filename) {
  const screenshot = await sendCDP(ws, 'Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  const buffer = Buffer.from(screenshot.data, 'base64');
  const outPath = path.join(screenshotDir, filename);
  fs.writeFileSync(outPath, buffer);
  if (fs.existsSync(brainDir)) {
    fs.writeFileSync(path.join(brainDir, filename), buffer);
  }
  console.log(`Saved screenshot to ${filename}`);
}

async function main() {
  await sleep(2500);

  let targets = [];
  for (let i = 0; i < 10; i++) {
    try {
      const res = await fetch('http://127.0.0.1:9222/json');
      targets = await res.json();
      if (targets.length > 0) break;
    } catch (e) {}
    await sleep(500);
  }

  const pageTarget = targets.find(t => t.type === 'page') || targets[0];
  if (!pageTarget || !pageTarget.webSocketDebuggerUrl) {
    console.error('No page target available.');
    chrome.kill();
    process.exit(1);
  }

  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);

  await new Promise(resolve => ws.addEventListener('open', resolve));

  await sendCDP(ws, 'Page.enable');
  await sendCDP(ws, 'DOM.enable');
  await sendCDP(ws, 'Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false
  });

  console.log('Navigating to http://localhost:3000/flow...');
  await sendCDP(ws, 'Page.navigate', { url: 'http://localhost:3000/flow' });
  await sleep(4000);

  // 1. Capture Flow Canvas with 39 Template badge
  await captureShot(ws, 'flow_toolbar_39_templates.png');

  // 2. Open Template Gallery Modal
  console.log('Opening Template Gallery Modal...');
  await evalInPage(ws, `
    (() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const tplBtn = btns.find(b => b.textContent && (b.textContent.includes('Templates') || b.textContent.includes('Şablonlar')));
      if (tplBtn) tplBtn.click();
    })()
  `);
  await sleep(1500);
  await captureShot(ws, 'flow_template_gallery_all_39.png');

  // 3. Switch to Fasteners category tab
  console.log('Switching to Fasteners tab...');
  await evalInPage(ws, `
    (() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const fastTab = btns.find(b => b.textContent && (b.textContent.includes('Fasteners') || b.textContent.includes('Bağlantı')));
      if (fastTab) fastTab.click();
    })()
  `);
  await sleep(1000);
  await captureShot(ws, 'flow_template_gallery_fasteners.png');

  // 4. Switch to Metallurgy & Materials tab
  console.log('Switching to Metallurgy tab...');
  await evalInPage(ws, `
    (() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const matTab = btns.find(b => b.textContent && (b.textContent.includes('Metallurgy') || b.textContent.includes('Metalurji')));
      if (matTab) matTab.click();
    })()
  `);
  await sleep(1000);
  await captureShot(ws, 'flow_template_gallery_metallurgy.png');

  // 5. Select a new precision template: template-roller-chain-conveyor
  console.log('Selecting Semente Edilmiş Pinion template...');
  await evalInPage(ws, `
    (() => {
      const cards = Array.from(document.querySelectorAll('div[role="button"]'));
      const card = cards.find(el => el.textContent && el.textContent.includes('Semente'));
      if (card) card.click();
    })()
  `);
  await sleep(2000);
  await captureShot(ws, 'flow_semente_pinion_loaded.png');

  ws.close();
  chrome.kill();
  console.log('Done!');
}

main().catch(err => {
  console.error(err);
  chrome.kill();
  process.exit(1);
});
