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

  const finalUrl = 'http://localhost:3000/design-studio?headless=1';
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
  await send('Page.enable');
  await send('DOM.enable');
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false
  });

  await new Promise(r => setTimeout(r, 3500));

  async function snap(filepath) {
    const shotRes = await send('Page.captureScreenshot', { format: 'png' });
    if (shotRes.result && shotRes.result.data) {
      const buf = Buffer.from(shotRes.result.data, 'base64');
      fs.mkdirSync(path.dirname(filepath), { recursive: true });
      fs.writeFileSync(filepath, buf);
      console.log(`Saved screenshot to ${filepath}`);
    }
  }

  // 1. Initial State Screenshot
  await snap('screenshots/design_studio_assembled_clean.png');

  // 2. Open Mate Modal
  console.log("Opening Mate Modal...");
  const mateRes = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const mateBtn = btns.find(b => (b.innerText && (b.innerText.includes('MATE') || b.innerText.includes('MONTAJ'))) || (b.title && b.title.includes('Mate')));
        if (mateBtn) {
          mateBtn.click();
          return "clicked mate button: " + mateBtn.innerText;
        }
        return "mate button not found among: " + btns.map(b => b.innerText).filter(Boolean).join(' | ');
      })()
    `
  });
  console.log(mateRes.result?.value);
  await new Promise(r => setTimeout(r, 800));
  await snap('screenshots/design_studio_mate_modal.png');

  // Close Mate Modal
  await send('Runtime.evaluate', {
    expression: `
      const closeBtns = Array.from(document.querySelectorAll('button'));
      const cancelBtn = closeBtns.find(b => b.innerText && (b.innerText.includes('Cancel') || b.innerText.includes('İptal')));
      if (cancelBtn) cancelBtn.click();
    `
  });
  await new Promise(r => setTimeout(r, 500));

  // 3. Open Smart Fasteners Modal
  console.log("Opening Smart Fasteners Modal...");
  const fastRes = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const fastBtn = btns.find(b => (b.innerText && (b.innerText.includes('FASTENERS') || b.innerText.includes('CIVATA') || b.innerText.includes('MONTAJ'))) || (b.title && b.title.includes('Fasteners')));
        if (fastBtn) {
          fastBtn.click();
          return "clicked fastener button: " + fastBtn.innerText;
        }
        return "fastener button not found among: " + btns.map(b => b.innerText).filter(Boolean).join(' | ');
      })()
    `
  });
  console.log(fastRes.result?.value);
  await new Promise(r => setTimeout(r, 800));
  await snap('screenshots/design_studio_fasteners_modal.png');

  // 4. Click Load Demo Assembly in Fasteners Modal
  console.log("Clicking Load Demo Assembly in Fasteners Modal...");
  const demoRes = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const demoBtn = btns.find(b => b.innerText && (b.innerText.includes('Load Demo Assembly') || b.innerText.includes('Hazır Montaj')));
        if (demoBtn) {
          demoBtn.click();
          return "clicked demo button: " + demoBtn.innerText;
        }
        return "demo button not found among: " + btns.map(b => b.innerText).filter(Boolean).join(' | ');
      })()
    `
  });
  console.log(demoRes.result?.value);
  await new Promise(r => setTimeout(r, 2000));
  await snap('screenshots/design_studio_demo_fastened.png');

  ws.close();
  await fetch(`http://127.0.0.1:${PORT}/json/close/${tab.id}`);
  chrome.kill();
  console.log("Audit complete.");
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
