import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9222;
const USER_DATA = "C:\\Users\\apo_q\\AppData\\Local\\Temp\\chrome_cdp_handbook_profile";
const ARTIFACT_DIR = "C:\\Users\\apo_q\\.gemini\\antigravity\\brain\\a1a6defd-f3ed-48e2-9096-fb0c1e87e8f6\\screenshots";

if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function run() {
  console.log("Launching headless Chrome...");
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

  if (!version) {
    chrome.kill();
    console.error("Chrome failed to start");
    process.exit(1);
  }

  async function capturePage(url, shotName, setupEval = null) {
    console.log(`Navigating to ${url}...`);
    const tabRes = await fetch(`http://127.0.0.1:${PORT}/json/new?${encodeURIComponent(url)}`, { method: 'PUT' });
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

    await sleep(2500);

    if (setupEval) {
      await send('Runtime.evaluate', { expression: setupEval });
      await sleep(1000);
    }

    const shotRes = await send('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(shotRes.result.data, 'base64');
    const outPath = path.join(ARTIFACT_DIR, `${shotName}.png`);
    fs.writeFileSync(outPath, buffer);
    console.log(`Saved screenshot to ${outPath}`);

    // Read current page URL
    const evalUrl = await send('Runtime.evaluate', { expression: 'window.location.href' });
    console.log(`Final URL: ${evalUrl.result.value}`);

    ws.close();
    await fetch(`http://127.0.0.1:${PORT}/json/close/${tab.id}`, { method: 'GET' });
  }

  try {
    // 1. Capture Handbook Standards view
    await capturePage('http://localhost:3000/handbook/', 'verify_handbook_standards_live');

    // 2. Capture Handbook Materials view
    await capturePage('http://localhost:3000/handbook/', 'verify_handbook_materials_live', `
      (() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const matBtn = btns.find(b => b.textContent && (b.textContent.includes('Materials Intelligence') || b.textContent.includes('Materials')));
        if (matBtn) matBtn.click();
      })()
    `);

    // 3. Capture Handbook Ashby view
    await capturePage('http://localhost:3000/handbook/', 'verify_handbook_ashby_live', `
      (() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const matBtn = btns.find(b => b.textContent && (b.textContent.includes('Materials Intelligence') || b.textContent.includes('Materials')));
        if (matBtn) matBtn.click();
        setTimeout(() => {
          const subBtns = Array.from(document.querySelectorAll('button'));
          const ashbyBtn = subBtns.find(b => b.textContent && b.textContent.includes('Ashby'));
          if (ashbyBtn) ashbyBtn.click();
        }, 300);
      })()
    `);

    // 4. Capture Sidebar check
    await capturePage('http://localhost:3000/bolt-torque/', 'verify_sidebar_clean_live');

    // 5. Test redirection of /material-selector-ai/
    await capturePage('http://localhost:3000/material-selector-ai/', 'verify_redirect_material_selector_ai');

  } catch (err) {
    console.error("CDP verification error:", err);
  } finally {
    chrome.kill();
    console.log("Chrome killed.");
  }
}

run();
