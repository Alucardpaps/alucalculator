import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9222;
const USER_DATA = "C:\\Users\\apo_q\\AppData\\Local\\Temp\\chrome_cdp_profile";

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
    console.error("Failed to connect to Chrome CDP");
    chrome.kill();
    process.exit(1);
  }

  async function takeScreenshot(url, outputPath, width = 1440, height = 900) {
    const finalUrl = url.includes('headless=1') ? url : (url.includes('?') ? `${url}&headless=1` : `${url}?headless=1`);
    console.log(`Navigating to ${finalUrl}...`);
    const newTabRes = await fetch(`http://127.0.0.1:${PORT}/json/new?${encodeURIComponent(finalUrl)}`, { method: 'PUT' });
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

    await send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: false
    });
    await send('Page.enable');
    await send('Runtime.enable');

    await send('Runtime.evaluate', {
      expression: `
        try {
          localStorage.setItem('alu_consent_telemetry', '1');
          localStorage.setItem('alu_consent_screenshot', '1');
          localStorage.setItem('alucalc-cookie-consent', 'true');
        } catch(e) {}
      `
    });

    await send('Page.navigate', { url: finalUrl });

    await new Promise((resolve) => {
      let resolved = false;
      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          resolve();
        }
      }, 7000);

      const checkHandler = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.method === 'Page.loadEventFired') {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeout);
            resolve();
          }
        }
      };
      ws.addEventListener('message', checkHandler);
    });

    // Wait for client hydrations & canvas rendering
    await new Promise(r => setTimeout(r, 4500));

    const shotRes = await send('Page.captureScreenshot', { format: 'png' });
    if (shotRes.result && shotRes.result.data) {
      const buf = Buffer.from(shotRes.result.data, 'base64');
      fs.mkdirSync(path.dirname(outputPath), { recursive: true });
      fs.writeFileSync(outputPath, buf);
      console.log(`Saved screenshot to ${outputPath} (${buf.length} bytes)`);
    } else {
      console.error("Screenshot failed:", shotRes);
    }

    ws.close();
    await fetch(`http://127.0.0.1:${PORT}/json/close/${tab.id}`);
  }

  const targets = [
    { url: 'http://localhost:3000/bolt-torque', file: 'screenshots/audit_50_bolt_torque.png' },
    { url: 'http://localhost:3000/press-fit', file: 'screenshots/audit_51_press_fit.png' },
    { url: 'http://localhost:3000/o-ring', file: 'screenshots/audit_52_o_ring.png' },
    { url: 'http://localhost:3000/gears', file: 'screenshots/audit_53_gears.png' },
    { url: 'http://localhost:3000/column-buckling', file: 'screenshots/audit_54_column_buckling.png' },
    { url: 'http://localhost:3000/cutting-optimizer', file: 'screenshots/audit_55_cutting_optimizer.png' }
  ];

  for (const t of targets) {
    try {
      await takeScreenshot(t.url, path.resolve(t.file), 1440, 900);
    } catch (e) {
      console.error(`Error capturing ${t.url}:`, e);
    }
  }

  chrome.kill();
  console.log("Done taking Batch 4 screenshots.");
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
