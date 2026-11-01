import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9222;
const USER_DATA = "C:\\Users\\apo_q\\AppData\\Local\\Temp\\chrome_cdp_handbook_i18n_profile";
const ARTIFACT_DIR = "C:\\Users\\apo_q\\.gemini\\antigravity\\brain\\a1a6defd-f3ed-48e2-9096-fb0c1e87e8f6\\screenshots";

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function run() {
  console.log("Launching headless Chrome for Handbook i18n & features...");
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
      await sleep(1200);
    }

    const shotRes = await send('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(shotRes.result.data, 'base64');
    const outPath = path.join(ARTIFACT_DIR, `${shotName}.png`);
    fs.writeFileSync(outPath, buffer);
    console.log(`Saved screenshot to ${outPath}`);

    ws.close();
    await fetch(`http://127.0.0.1:${PORT}/json/close/${tab.id}`, { method: 'GET' });
  }

  try {
    // 1. Turkish (tr) Standards & Hero
    await capturePage('http://localhost:3000/handbook/', 'verify_handbook_tr_hero', `
      (() => {
        // Set language to TR via store
        const store = window.__ALUCALC_I18N_STORE__ || localStorage.getItem('alucalc-i18n-storage');
        localStorage.setItem('alucalc_language', 'tr');
        window.dispatchEvent(new Event('storage'));
        // Click language selector if present or reload with tr
        const trBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('TR'));
        if (trBtn) trBtn.click();
      })()
    `);

    // 2. Interactive ISO 286 Fit Tool in Handbook
    await capturePage('http://localhost:3000/handbook/', 'verify_handbook_tool_iso286', `
      (() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const isoBtn = btns.find(b => b.textContent && b.textContent.includes('ISO 286 Fit'));
        if (isoBtn) isoBtn.click();
      })()
    `);

    // 3. Interactive Hardness ASTM E140 Tool in Handbook
    await capturePage('http://localhost:3000/handbook/', 'verify_handbook_tool_hardness', `
      (() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const hBtn = btns.find(b => b.textContent && b.textContent.includes('ASTM E140'));
        if (hBtn) hBtn.click();
      })()
    `);

    // 4. 2D Ashby Scatter Chart in Materials Tab
    await capturePage('http://localhost:3000/handbook/', 'verify_handbook_ashby_scatter', `
      (() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const matBtn = btns.find(b => b.textContent && (b.textContent.includes('Materials') || b.textContent.includes('Malzeme')));
        if (matBtn) matBtn.click();
        setTimeout(() => {
          const subBtns = Array.from(document.querySelectorAll('button'));
          const scatterBtn = subBtns.find(b => b.textContent && (b.textContent.includes('Scatter') || b.textContent.includes('Dağılım')));
          if (scatterBtn) scatterBtn.click();
        }, 400);
      })()
    `);

    // 5. 16 Governing Formulas in Formula Codex
    await capturePage('http://localhost:3000/handbook/', 'verify_handbook_formula_codex_16', `
      (() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const fBtn = btns.find(b => b.textContent && (b.textContent.includes('Formula Codex') || b.textContent.includes('Formül Kodeksi') || b.textContent.includes('Codex')));
        if (fBtn) fBtn.click();
      })()
    `);

  } catch (err) {
    console.error('Error during CDP verification:', err);
  } finally {
    chrome.kill();
    console.log('Chrome killed.');
  }
}

run();
