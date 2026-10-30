import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9222;
const USER_DATA = "C:\\Users\\apo_q\\AppData\\Local\\Temp\\chrome_cdp_lang_profile";
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

  if (!version) {
    chrome.kill();
    process.exit(1);
  }

  async function testLang(url, targetLang, shotName, scrollY = 0) {
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

    await sleep(3500);

    // Click language dropdown button
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          // Remove banners
          const banners = Array.from(document.querySelectorAll('div')).filter(el => {
            const txt = (el.innerText || '').toLowerCase();
            return (txt.includes('cookie') || txt.includes('çerez') || txt.includes('consent') || txt.includes('kvkk')) && el.className && typeof el.className === 'string' && el.className.includes('fixed');
          });
          banners.forEach(b => b.remove());

          // Click language toggle
          const btn = document.querySelector('button[aria-label^="Language"]');
          if (btn) btn.click();
        })()
      `
    });

    await sleep(500);

    // Click target language
    const switched = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const btns = Array.from(document.querySelectorAll('button'));
          const target = btns.find(b => {
            const txt = b.innerText || '';
            if ('${targetLang}' === 'tr') return txt.includes('Türkçe');
            if ('${targetLang}' === 'de') return txt.includes('Deutsch');
            if ('${targetLang}' === 'fr') return txt.includes('Français');
            return false;
          });
          if (target) {
            target.click();
            return true;
          }
          return false;
        })()
      `,
      returnByValue: true
    });
    console.log(`Switched to ${targetLang}:`, switched?.result?.value);

    await sleep(1500);

    if (scrollY > 0) {
      await send('Runtime.evaluate', { expression: `window.scrollTo(0, ${scrollY});` });
      await sleep(500);
    }

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

  // Capture Turkish Column Buckling
  await testLang('http://localhost:3000/column-buckling/?headless=1', 'tr', 'verify_01_column_buckling_tr_live.png', 180);

  // Capture German Bearings
  await testLang('http://localhost:3000/bearings/?headless=1', 'de', 'verify_04_bearings_iso281_de_live.png', 150);

  chrome.kill();
  console.log("Done language screenshots!");
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
