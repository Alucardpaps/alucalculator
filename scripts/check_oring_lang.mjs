import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9222;
const USER_DATA = "C:\\Users\\apo_q\\AppData\\Local\\Temp\\chrome_cdp_oring_profile";

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function run() {
  const chrome = spawn(CHROME_PATH, [
    `--remote-debugging-port=${PORT}`,
    '--headless=new',
    '--disable-gpu',
    `--user-data-dir=${USER_DATA}`,
    'about:blank'
  ], { stdio: 'ignore' });

  for (let i = 0; i < 20; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/version`);
      await res.json();
      break;
    } catch (e) {
      await sleep(200);
    }
  }

  async function checkOring(lang) {
    const tabRes = await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' });
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

    await send('Page.navigate', { url: 'http://localhost:3000/' });
    await sleep(800);
    await send('Runtime.evaluate', {
      expression: `
        try {
          localStorage.setItem('alu_consent_telemetry', '1');
          localStorage.setItem('alu_consent_screenshot', '1');
          localStorage.setItem('alucalc-cookie-consent', 'true');
          localStorage.setItem('alucalc-i18n-storage', JSON.stringify({ state: { language: '${lang}' }, version: 0 }));
        } catch(e) {}
      `
    });

    await send('Page.navigate', { url: 'http://localhost:3000/o-ring/?headless=1' });
    await sleep(3500);

    // Also click language toggle in navbar to be 100% sure Zustand store switched
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const btn = document.querySelector('button[aria-label^="Language"]');
          if (btn) btn.click();
        })()
      `
    });
    await sleep(400);
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const btns = Array.from(document.querySelectorAll('button'));
          const target = btns.find(b => {
            const txt = b.innerText || '';
            if ('${lang}' === 'tr') return txt.includes('Türkçe');
            if ('${lang}' === 'zh') return txt.includes('中文');
            if ('${lang}' === 'de') return txt.includes('Deutsch');
            return false;
          });
          if (target) target.click();
        })()
      `
    });
    await sleep(1000);

    const shotRes = await send('Page.captureScreenshot', { format: 'png' });
    if (shotRes?.result?.data) {
      fs.writeFileSync(`public/screenshots/verification/oring_${lang}_inspect.png`, Buffer.from(shotRes.result.data, 'base64'));
      console.log(`Saved oring_${lang}_inspect.png`);
    }

    const textSample = await send('Runtime.evaluate', {
      expression: `document.body.innerText.substring(0, 1500)`,
      returnByValue: true
    });
    console.log(`Text sample for ${lang}:\n`, textSample?.result?.value);

    ws.close();
    await fetch(`http://127.0.0.1:${PORT}/json/close/${tab.id}`);
  }

  await checkOring('zh');
  await checkOring('tr');

  chrome.kill();
}

run().catch(console.error);
