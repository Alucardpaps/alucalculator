import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9222;
const USER_DATA = "C:\\Users\\apo_q\\AppData\\Local\\Temp\\chrome_cdp_handbook_formula_tr";
const ARTIFACT_DIR = "C:\\Users\\apo_q\\.gemini\\antigravity\\brain\\a1a6defd-f3ed-48e2-9096-fb0c1e87e8f6\\screenshots";

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function run() {
  const chrome = spawn(CHROME_PATH, [
    `--remote-debugging-port=${PORT}`,
    '--headless=new',
    '--disable-gpu',
    `--user-data-dir=${USER_DATA}`,
    'about:blank'
  ], { stdio: 'ignore' });

  let version = null;
  for (let i = 0; i < 20; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/version`);
      version = await res.json();
      break;
    } catch (e) {
      await sleep(200);
    }
  }

  const tabRes = await fetch(`http://127.0.0.1:${PORT}/json/new?${encodeURIComponent('http://localhost:3000/handbook/')}`, { method: 'PUT' });
  const tab = await tabRes.json();
  const ws = new WebSocket(tab.webSocketDebuggerUrl);

  let id = 1;
  const callbacks = new Map();
  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && callbacks.has(msg.id)) {
      callbacks.get(msg.id)(msg);
      callbacks.delete(msg.id);
    }
  };

  function send(method, params = {}) {
    return new Promise((resolve) => {
      const msgId = id++;
      callbacks.set(msgId, resolve);
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  await new Promise(r => ws.onopen = r);
  await send('Page.enable');
  await send('DOM.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false
  });

  await sleep(2000);

  // Switch to TR and click tab 3 (Formula Codex)
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const langDropdown = document.querySelector('button[aria-label*="Language"]');
        if (langDropdown) {
          langDropdown.click();
          setTimeout(() => {
            const trOption = Array.from(document.querySelectorAll('button')).find(o => o.textContent && o.textContent.includes('Türkçe'));
            if (trOption) trOption.click();
            setTimeout(() => {
              // Target the third tab in the header
              const headerTabs = document.querySelectorAll('.h-13 button');
              if (headerTabs && headerTabs[2]) {
                headerTabs[2].click();
              }
            }, 300);
          }, 200);
        }
      })()
    `
  });

  await sleep(1500);

  const shotRes = await send('Page.captureScreenshot', { format: 'png' });
  const buffer = Buffer.from(shotRes.result.data, 'base64');
  const outPath = path.join(ARTIFACT_DIR, 'verify_handbook_tr_formulas_clean.png');
  fs.writeFileSync(outPath, buffer);
  console.log(`Saved screenshot to ${outPath}`);

  ws.close();
  await fetch(`http://127.0.0.1:${PORT}/json/close/${tab.id}`, { method: 'GET' });
  chrome.kill();
}

run();
