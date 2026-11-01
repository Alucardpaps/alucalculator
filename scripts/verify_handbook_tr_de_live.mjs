import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9222;
const USER_DATA = "C:\\Users\\apo_q\\AppData\\Local\\Temp\\chrome_cdp_handbook_tr_de_profile";
const ARTIFACT_DIR = "C:\\Users\\apo_q\\.gemini\\antigravity\\brain\\a1a6defd-f3ed-48e2-9096-fb0c1e87e8f6\\screenshots";

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function run() {
  console.log("Launching headless Chrome for Handbook TR & DE check...");
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

    await sleep(2000);

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
    // 1. Switch to Turkish via UI dropdown and capture Handbook in pure Turkish
    await capturePage('http://localhost:3000/handbook/', 'verify_handbook_tr_verified', `
      (() => {
        // Find flag/language dropdown button
        const btns = Array.from(document.querySelectorAll('button'));
        const langDropdown = btns.find(b => b.getAttribute('aria-label')?.includes('Language'));
        if (langDropdown) {
          langDropdown.click();
          setTimeout(() => {
            const options = Array.from(document.querySelectorAll('button'));
            const trOption = options.find(o => o.textContent && (o.textContent.includes('Türkçe') || o.textContent.includes('TR')));
            if (trOption) trOption.click();
          }, 200);
        }
      })()
    `);

    // 2. Capture Turkish Formula Codex
    await capturePage('http://localhost:3000/handbook/', 'verify_handbook_tr_formulas_verified', `
      (() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const langDropdown = btns.find(b => b.getAttribute('aria-label')?.includes('Language'));
        if (langDropdown) {
          langDropdown.click();
          setTimeout(() => {
            const options = Array.from(document.querySelectorAll('button'));
            const trOption = options.find(o => o.textContent && (o.textContent.includes('Türkçe') || o.textContent.includes('TR')));
            if (trOption) trOption.click();
            setTimeout(() => {
              const allBtns = Array.from(document.querySelectorAll('button'));
              const fBtn = allBtns.find(b => b.textContent && (b.textContent.includes('Formül') || b.textContent.includes('Formula')));
              if (fBtn) fBtn.click();
            }, 300);
          }, 200);
        }
      })()
    `);

    // 3. Switch to German via UI dropdown and capture Handbook in pure German
    await capturePage('http://localhost:3000/handbook/', 'verify_handbook_de_verified', `
      (() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const langDropdown = btns.find(b => b.getAttribute('aria-label')?.includes('Language'));
        if (langDropdown) {
          langDropdown.click();
          setTimeout(() => {
            const options = Array.from(document.querySelectorAll('button'));
            const deOption = options.find(o => o.textContent && (o.textContent.includes('Deutsch') || o.textContent.includes('DE')));
            if (deOption) deOption.click();
          }, 200);
        }
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
