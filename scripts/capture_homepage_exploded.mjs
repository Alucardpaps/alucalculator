import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9222;
const USER_DATA = "C:\\Users\\apo_q\\AppData\\Local\\Temp\\chrome_cdp_profile_exploded";

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
      await new Promise(r => setTimeout(r, 200));
    }
  }

  if (!version) {
    chrome.kill();
    process.exit(1);
  }

  const url = 'http://localhost:3000/?headless=1';
  const newTabRes = await fetch(`http://127.0.0.1:${PORT}/json/new?${encodeURIComponent(url)}`, { method: 'PUT' });
  const tab = await newTabRes.json();
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
  await send('Emulation.setDeviceMetricsOverride', { width: 1560, height: 980, deviceScaleFactor: 1, mobile: false });
  await send('Page.enable');
  await send('Runtime.enable');

  // Dismiss consent
  await send('Runtime.evaluate', {
    expression: `
      localStorage.setItem('alu_consent_telemetry', '1');
      localStorage.setItem('alu_consent_screenshot', '1');
      localStorage.setItem('alucalc-cookie-consent', 'true');
    `
  });

  await new Promise(r => setTimeout(r, 4500));

  // Scroll to assembly showcase
  await send('Runtime.evaluate', {
    expression: `
      const m = document.querySelector('main') || window;
      m.scrollTo(0, 520);
      try {
        const banners = Array.from(document.querySelectorAll('div')).filter(el => el.className && typeof el.className === 'string' && el.className.includes('z-50') && el.className.includes('fixed'));
        banners.forEach(b => b.remove());
      } catch(e) {}

      // Click the Play Explode animation button
      const playBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Play Explode') || b.textContent.includes('Animasyon'));
      if (playBtn) {
        playBtn.click();
      }
    `
  });

  await new Promise(r => setTimeout(r, 1200));

  const shotRes = await send('Page.captureScreenshot', { format: 'png' });
  if (shotRes.result?.data) {
    const buf = Buffer.from(shotRes.result.data, 'base64');
    fs.writeFileSync('screenshots/audit_71_homepage_assembly_mates_exploded.png', buf);
    console.log('Saved screenshots/audit_71_homepage_assembly_mates_exploded.png');
  }

  ws.close();
  await fetch(`http://127.0.0.1:${PORT}/json/close/${tab.id}`);
  chrome.kill();
}

run().catch(e => { console.error(e); process.exit(1); });
