import { spawn } from 'child_process';
import fs from 'fs';

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9222;
const USER_DATA = "C:\\Users\\apo_q\\AppData\\Local\\Temp\\chrome_cdp_profile_context";

async function run() {
  const chrome = spawn(CHROME_PATH, [
    `--remote-debugging-port=${PORT}`,
    '--headless=new',
    '--disable-gpu',
    `--user-data-dir=${USER_DATA}`,
    'about:blank'
  ], { stdio: 'ignore' });

  let version = null;
  for (let i = 0; i < 30; i++) {
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

    console.log('Waiting for Design Studio hydration...');
    await new Promise(r => setTimeout(r, 4000));

    // Clean cookie consent banners
    await send('Runtime.evaluate', {
      expression: `
        try {
          const banners = Array.from(document.querySelectorAll('div')).filter(el => el.className && typeof el.className === 'string' && el.className.includes('z-50') && el.className.includes('fixed'));
          banners.forEach(b => b.remove());
        } catch(e) {}
      `
    });

    // Setup 2 parts with holes for mating
    await send('Runtime.evaluate', {
      expression: `
        try {
          const store = window.__designStore.getState();
          const p1 = {
            id: 'plate-1',
            kind: 'box',
            name: 'Taban Plakası',
            color: '#3b82f6',
            visible: true,
            locked: true,
            parentId: null,
            position: { x: -30, y: 10, z: 0 },
            rotation: { x: 0, y: 0, z: 0 },
            scale: { x: 1, y: 1, z: 1 },
            params: { width: 100, height: 20, depth: 80 },
            holes: [{ id: 'h1', type: 'clearance', size: 'M6', face: 'top', x: 20, y: 0, depth: 20, isThroughAll: true }]
          };
          const p2 = {
            id: 'plate-2',
            kind: 'box',
            name: 'Üst Braket',
            color: '#10b981',
            visible: true,
            locked: false,
            parentId: null,
            position: { x: 50, y: 40, z: 20 },
            rotation: { x: 0, y: 0, z: 0 },
            scale: { x: 1, y: 1, z: 1 },
            params: { width: 80, height: 20, depth: 60 },
            holes: [{ id: 'h1', type: 'clearance', size: 'M6', face: 'bottom', x: 0, y: 0, depth: 20, isThroughAll: true }]
          };
          window.__designStore.setState({ parts: [p1, p2], selectedId: 'plate-1', mates: [], selectedMateId: null });
        } catch(e) { console.error(e); }
      `
    });

    await new Promise(r => setTimeout(r, 2000));

    // 1. Right click context menu on plate-1
    console.log('Dispatching contextmenu on plate-1...');
    await send('Runtime.evaluate', {
      expression: `
        try {
          const canvas = document.querySelector('canvas');
          if (canvas) {
            const rect = canvas.getBoundingClientRect();
            const clientX = rect.left + rect.width * 0.45;
            const clientY = rect.top + rect.height * 0.52;
            canvas.dispatchEvent(new MouseEvent('contextmenu', {
              bubbles: true,
              cancelable: true,
              clientX,
              clientY
            }));
          }
        } catch(e) { console.error(e); }
      `
    });

    await new Promise(r => setTimeout(r, 1200));

    let shotRes = await send('Page.captureScreenshot', { format: 'png' });
    if (shotRes.result?.data) {
      const buf = Buffer.from(shotRes.result.data, 'base64');
      fs.mkdirSync('screenshots', { recursive: true });
      fs.writeFileSync('screenshots/right_click_context_menu.png', buf);
      console.log('Saved screenshots/right_click_context_menu.png');
    }

    // 2. Perform Concentric Hole Mate + Coincident Face Mate
    console.log('Solving Concentric + Coincident assembly...');
    await send('Runtime.evaluate', {
      expression: `
        try {
          const store = window.__designStore.getState();
          // Concentric Mate on Holes
          store.openMateModal({
            partAId: 'plate-1',
            featureAId: 'plate-1-hole-h1',
            kind: 'concentric'
          });
          store.updateMateDraft({
            partBId: 'plate-2',
            featureBId: 'plate-2-hole-h1',
            kind: 'concentric'
          });
          store.commitMateDraft();

          // Coincident Mate on Faces
          store.openMateModal({
            partAId: 'plate-1',
            featureAId: 'plate-1-face-top',
            kind: 'coincident'
          });
          store.updateMateDraft({
            partBId: 'plate-2',
            featureBId: 'plate-2-face-bottom',
            kind: 'coincident'
          });
          store.commitMateDraft();
        } catch(e) { console.error(e); }
      `
    });

    await new Promise(r => setTimeout(r, 1800));

    shotRes = await send('Page.captureScreenshot', { format: 'png' });
    if (shotRes.result?.data) {
      const buf = Buffer.from(shotRes.result.data, 'base64');
      fs.writeFileSync('screenshots/concentric_and_coincident_assembled.png', buf);
      console.log('Saved screenshots/concentric_and_coincident_assembled.png');
    }

    // 3. Test 2D Sketch Mode on Part Face
    console.log('Activating 2D Sketch Mode on plate-1 top face...');
    await send('Runtime.evaluate', {
      expression: `
        try {
          const store = window.__designStore.getState();
          store.select('plate-1');
          store.setActiveFace('top');
          store.setTool('sketch-add');
        } catch(e) { console.error(e); }
      `
    });

    await new Promise(r => setTimeout(r, 1800));

    shotRes = await send('Page.captureScreenshot', { format: 'png' });
    if (shotRes.result?.data) {
      const buf = Buffer.from(shotRes.result.data, 'base64');
      fs.writeFileSync('screenshots/sketch_mode_on_part_face.png', buf);
      console.log('Saved screenshots/sketch_mode_on_part_face.png');
    }

    ws.close();
    await fetch(`http://127.0.0.1:${PORT}/json/close/${tab.id}`);
  }

  await capture();
  chrome.kill();
  console.log('Done capturing context and assembly screenshots.');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
