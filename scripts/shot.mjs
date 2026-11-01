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

  async function takeScreenshot(url, outputPath, width = 1440, height = 900, scrollY = 0, clearConsent = false) {
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
      mobile: width < 768
    });
    await send('Page.enable');
    await send('Runtime.enable');

    if (clearConsent) {
      await send('Runtime.evaluate', {
        expression: `
          try {
            localStorage.removeItem('alu_consent_telemetry');
            localStorage.removeItem('alu_consent_screenshot');
            localStorage.removeItem('alucalc-cookie-consent');
          } catch(e) {}
        `
      });
    } else {
      await send('Runtime.evaluate', {
        expression: `
          try {
            localStorage.setItem('alu_consent_telemetry', '1');
            localStorage.setItem('alu_consent_screenshot', '1');
            localStorage.setItem('alucalc-cookie-consent', 'true');
          } catch(e) {}
        `
      });
    }

    // Wait 4 seconds for compilation & full hydration
    await new Promise(r => setTimeout(r, 4500));

    if (scrollY > 0) {
      await send('Runtime.evaluate', {
        expression: `
          const m = document.querySelector('main');
          if (m) { m.scrollTop = ${scrollY}; }
          window.scrollTo(0, ${scrollY});
        `
      });
      await new Promise(r => setTimeout(r, 1200));
    }

    // Ensure any consent overlay is dismissed for screenshot audits
    await send('Runtime.evaluate', {
      expression: `
        try {
          const banners = Array.from(document.querySelectorAll('div')).filter(el => {
            const txt = (el.innerText || '').toLowerCase();
            return (txt.includes('cookie') || txt.includes('çerez') || txt.includes('consent') || txt.includes('kvkk')) && el.className && typeof el.className === 'string' && el.className.includes('fixed');
          });
          banners.forEach(b => b.remove());
        } catch(e) {}
      `
    });

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

  let targets = [];
  if (process.argv[2] && process.argv[3]) {
    targets.push({
      url: process.argv[2],
      file: process.argv[3],
      w: process.argv[4] ? parseInt(process.argv[4], 10) : 1440,
      h: process.argv[5] ? parseInt(process.argv[5], 10) : 900,
      scroll: process.argv[6] ? parseInt(process.argv[6], 10) : 0
    });
  } else {
    // Default targets
    targets = [
      { url: 'http://localhost:3000/cylinders?headless=1', file: 'screenshots/audit_41_cylinders_fixed2.png', w: 1440, h: 900, scroll: 0 },
      { url: 'http://localhost:3000/beam-deflection?headless=1', file: 'screenshots/audit_44_beam_deflection.png', w: 1440, h: 900, scroll: 0 },
      { url: 'http://localhost:3000/sheet-metal?headless=1', file: 'screenshots/audit_45_sheet_metal.png', w: 1440, h: 900, scroll: 0 },
      { url: 'http://localhost:3000/calculators/belt-drive?headless=1', file: 'screenshots/audit_46_belt_drive_fixed.png', w: 1440, h: 900, scroll: 0 }
    ];
  }

  for (const t of targets) {
    try {
      await takeScreenshot(t.url, path.resolve(t.file), t.w, t.h, t.scroll || 0, t.clearConsent || false);
    } catch (e) {
      console.error(`Error capturing ${t.url}:`, e);
    }
  }

  chrome.kill();
  console.log("Done taking screenshots.");
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
