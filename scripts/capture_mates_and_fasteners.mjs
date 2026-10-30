import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9222;
const USER_DATA = "C:\\Users\\apo_q\\AppData\\Local\\Temp\\chrome_cdp_profile_mates";

async function run() {
  const chrome = spawn(CHROME_PATH, [
    `--remote-debugging-port=${PORT}`,
    '--headless=new',
    '--disable-gpu',
    `--user-data-dir=${USER_DATA}`,
    'about:blank'
  ], { stdio: 'ignore' });

  let version = null;
  for (let i = 0; i < 25; i++) {
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

  async function capture() {
    const url = 'http://localhost:3000/design-studio/?headless=1';
    console.log(`Navigating to ${url}...`);
    const newTabRes = await fetch(`http://127.0.0.1:${PORT}/json/new?${encodeURIComponent(url)}`, { method: 'PUT' });
    const tab = await newTabRes.json();
    const ws = new WebSocket(tab.webSocketDebuggerUrl);

    let id = 1;
    const callbacks = new Map();

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.method === 'Runtime.consoleAPICalled') {
        const text = msg.params.args.map(a => a.value || a.description || '').join(' ');
        if (text.includes('Error') || text.includes('error')) {
          console.log('[Browser Console]', text);
        }
      }
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
      width: 1560,
      height: 960,
      deviceScaleFactor: 1,
      mobile: false
    });
    await send('Page.enable');
    await send('Runtime.enable');

    console.log('Waiting for Design Studio and __designStore hydration...');
    let hydrated = false;
    for (let i = 0; i < 60; i++) {
      const evalRes = await send('Runtime.evaluate', {
        expression: `typeof window.__designStore !== 'undefined'`
      });
      if (evalRes.result?.value === true) {
        hydrated = true;
        break;
      }
      await new Promise(r => setTimeout(r, 600));
    }
    console.log(`__designStore hydrated: ${hydrated}`);

    // Clean cookie consent banners
    await send('Runtime.evaluate', {
      expression: `
        try {
          const banners = Array.from(document.querySelectorAll('div')).filter(el => el.className && typeof el.className === 'string' && el.className.includes('z-50') && el.className.includes('fixed'));
          banners.forEach(b => b.remove());
        } catch(e) {}
      `
    });

    // 1. Load Demo Assembly With Fasteners (2 Mated Plates + M6 Fasteners + Solved Mates)
    console.log('Calling loadDemoAssemblyWithFasteners()...');
    await send('Runtime.evaluate', {
      expression: `
        try {
          if (window.__designStore) {
            window.__designStore.getState().loadDemoAssemblyWithFasteners();
          }
        } catch(e) {
          console.error(e);
        }
      `
    });

    await new Promise(r => setTimeout(r, 3500));

    // Capture Viewport with Demo Assembly and Mates Tree
    let shotRes = await send('Page.captureScreenshot', { format: 'png' });
    if (shotRes.result?.data) {
      const buf = Buffer.from(shotRes.result.data, 'base64');
      fs.mkdirSync('screenshots', { recursive: true });
      fs.writeFileSync('screenshots/design_studio_demo_fastened.png', buf);
      console.log('Saved screenshots/design_studio_demo_fastened.png');
    }

    // 2. Open SolidWorks Mate PropertyManager Modal
    console.log('Opening AssemblyMateModal...');
    await send('Runtime.evaluate', {
      expression: `
        try {
          if (window.__designStore) {
            window.__designStore.getState().openMateModal();
          }
        } catch(e) {
          console.error(e);
        }
      `
    });
    await new Promise(r => setTimeout(r, 1200));

    shotRes = await send('Page.captureScreenshot', { format: 'png' });
    if (shotRes.result?.data) {
      const buf = Buffer.from(shotRes.result.data, 'base64');
      fs.writeFileSync('screenshots/design_studio_mate_modal.png', buf);
      console.log('Saved screenshots/design_studio_mate_modal.png');
    }

    // Close Mate Modal
    await send('Runtime.evaluate', {
      expression: `
        try {
          if (window.__designStore) {
            window.__designStore.getState().closeMateModal();
          }
        } catch(e) {
          console.error(e);
        }
      `
    });
    await new Promise(r => setTimeout(r, 600));

    // 3. Open Smart Fasteners & Toolbox Modal
    console.log('Opening SmartFastenersModal...');
    await send('Runtime.evaluate', {
      expression: `
        try {
          if (window.__designStore) {
            window.__designStore.getState().openFastenersModal();
          }
        } catch(e) {
          console.error(e);
        }
      `
    });
    await new Promise(r => setTimeout(r, 1200));

    shotRes = await send('Page.captureScreenshot', { format: 'png' });
    if (shotRes.result?.data) {
      const buf = Buffer.from(shotRes.result.data, 'base64');
      fs.writeFileSync('screenshots/design_studio_fasteners_modal.png', buf);
      console.log('Saved screenshots/design_studio_fasteners_modal.png');
    }

    ws.close();
    await fetch(`http://127.0.0.1:${PORT}/json/close/${tab.id}`);
  }

  await capture();
  chrome.kill();
  console.log('Done capturing mate and fastener screenshots.');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
