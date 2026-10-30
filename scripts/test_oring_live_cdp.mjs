import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9222;
const USER_DATA = "C:\\Users\\apo_q\\AppData\\Local\\Temp\\chrome_cdp_oring_profile";
const ARTIFACT_DIR = "C:\\Users\\apo_q\\.gemini\\antigravity\\brain\\a1a6defd-f3ed-48e2-9096-fb0c1e87e8f6\\screenshots";

if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

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

  if (!version) {
    chrome.kill();
    console.error("Chrome failed to start");
    process.exit(1);
  }

  async function capturePage(url, lang, shotName) {
    console.log(`Testing ${url} in ${lang}...`);
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
    await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1050, deviceScaleFactor: 1, mobile: false });
    await send('Page.enable');
    await send('Runtime.enable');

    await sleep(3000);

    // Switch language via store & DOM
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          try {
            // Remove banners
            const banners = Array.from(document.querySelectorAll('div')).filter(el => {
              const txt = (el.innerText || '').toLowerCase();
              return (txt.includes('cookie') || txt.includes('çerez') || txt.includes('consent') || txt.includes('kvkk')) && el.className && typeof el.className === 'string' && el.className.includes('fixed');
            });
            banners.forEach(b => b.remove());

            // Set localStorage
            localStorage.setItem('alucalc-i18n-storage', JSON.stringify({ state: { language: '${lang}' }, version: 0 }));

            // Try clicking language selector if present
            const btn = document.querySelector('button[aria-label^="Language"]');
            if (btn) {
              btn.click();
              setTimeout(() => {
                const targetBtn = Array.from(document.querySelectorAll('button')).find(b => {
                  const t = (b.innerText || '').toLowerCase();
                  if ('${lang}' === 'zh') return b.innerText.includes('中文') || t.includes('chinese');
                  if ('${lang}' === 'de') return b.innerText.includes('Deutsch') || t.includes('german');
                  if ('${lang}' === 'tr') return b.innerText.includes('Türkçe') || t.includes('turkish');
                  return false;
                });
                if (targetBtn) targetBtn.click();
              }, 200);
            }
            return true;
          } catch(e) {
            return e.message;
          }
        })()
      `
    });

    await sleep(2000);

    const shotRes = await send('Page.captureScreenshot', { format: 'png' });
    if (shotRes?.result?.data) {
      const buf = Buffer.from(shotRes.result.data, 'base64');
      fs.writeFileSync(path.join("public", "screenshots", "verification", shotName), buf);
      fs.writeFileSync(path.join(ARTIFACT_DIR, shotName), buf);
      console.log(`Saved screenshot ${shotName} (${buf.length} bytes)`);
    }

    ws.close();
    await fetch(`http://127.0.0.1:${PORT}/json/close/${tab.id}`);
  }

  // Capture O-Ring in Chinese
  await capturePage('http://localhost:3000/o-ring/?headless=1', 'zh', 'verify_oring_zh_live.png');

  // Capture Keyway in Chinese
  await capturePage('http://localhost:3000/keyway-connection/?headless=1', 'zh', 'verify_keyway_zh_live.png');

  chrome.kill();
  console.log("Done CDP live tests!");
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
