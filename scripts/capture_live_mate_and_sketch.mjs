import { spawn } from 'child_process';
import fs from 'fs';

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9222;
const USER_DATA = "C:\\Users\\apo_q\\AppData\\Local\\Temp\\chrome_cdp_profile_live_mate";

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
            position: { x: -60, y: 10, z: 0 },
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
            position: { x: 80, y: 35, z: 20 },
            rotation: { x: 0, y: 0, z: 0 },
            scale: { x: 1, y: 1, z: 1 },
            params: { width: 80, height: 20, depth: 60 },
            holes: [{ id: 'h1', type: 'clearance', size: 'M6', face: 'bottom', x: 0, y: 0, depth: 20, isThroughAll: true }]
          };
          window.__designStore.setState({ parts: [p1, p2], selectedId: 'plate-1', mates: [], selectedMateId: null });
        } catch(e) { console.error(e); }
      `
    });

    await new Promise(r => setTimeout(r, 2500));

    // 1. Right Click Context Menu with Mate & Sketch
    console.log('Activating Right-Click Context Menu on plate-1...');
    await send('Runtime.evaluate', {
      expression: `
        try {
          const store = window.__designStore.getState();
          const p1 = store.parts.find(p => p.id === 'plate-1');
          const feat = { kind: 'planar-face', id: 'plate-1-face-top', name: 'Taban Plakası Üst Yüzey (+Y)', origin: { x: -60, y: 20, z: 0 }, normal: { x: 0, y: 1, z: 0 } };
          // Trigger context menu event on viewport
          window.dispatchEvent(new CustomEvent('cad-contextmenu-demo', { detail: { partId: 'plate-1', feature: feat } }));
        } catch(e) { console.error(e); }
      `
    });

    // 2. Open Mate mode with Entity 1 selected
    console.log('Activating Mate Mode with Entity 1...');
    await send('Runtime.evaluate', {
      expression: `
        try {
          const store = window.__designStore.getState();
          store.openMateModal({
            partAId: 'plate-1',
            featureAId: 'plate-1-face-top',
            featureAName: 'Taban Plakası ▸ Üst Yüzey (+Y)',
            kind: 'coincident'
          });
          store.setTool('mate');
        } catch(e) { console.error(e); }
      `
    });

    await new Promise(r => setTimeout(r, 1500));

    let shotRes = await send('Page.captureScreenshot', { format: 'png' });
    if (shotRes.result?.data) {
      const buf = Buffer.from(shotRes.result.data, 'base64');
      fs.mkdirSync('screenshots', { recursive: true });
      fs.writeFileSync('screenshots/mate_mode_entity1_selected.png', buf);
      console.log('Saved screenshots/mate_mode_entity1_selected.png');
    }

    // 2B. Select Entity 2 -> Shows Surface-Adaptive Mate Selector and live 3D snap!
    console.log('Selecting Entity 2 (Adaptive Mate Selector preview)...');
    await send('Runtime.evaluate', {
      expression: `
        try {
          const store = window.__designStore.getState();
          store.updateMateDraft({
            partBId: 'plate-2',
            featureBId: 'plate-2-face-bottom',
            featureBName: 'Üst Braket ▸ Alt Yüzey (-Y)',
            kind: 'coincident'
          });
        } catch(e) { console.error(e); }
      `
    });

    await new Promise(r => setTimeout(r, 1800));

    shotRes = await send('Page.captureScreenshot', { format: 'png' });
    if (shotRes.result?.data) {
      const buf = Buffer.from(shotRes.result.data, 'base64');
      fs.writeFileSync('screenshots/mate_mode_both_entities_adaptive_selector.png', buf);
      console.log('Saved screenshots/mate_mode_both_entities_adaptive_selector.png');
    }

    // 2C. Concentric Hole Pair Test -> Shows Hole Axis capture & concentric mate
    console.log('Testing Concentric Hole-to-Hole Mate Selection...');
    await send('Runtime.evaluate', {
      expression: `
        try {
          const store = window.__designStore.getState();
          store.updateMateDraft({
            partAId: 'plate-1',
            featureAId: 'plate-1-hole-h1',
            featureAName: 'Taban Plakası ▸ M6 Geçme Deliği (Üst)',
            partBId: 'plate-2',
            featureBId: 'plate-2-hole-h1',
            featureBName: 'Üst Braket ▸ M6 Geçme Deliği (Alt)',
            kind: 'concentric'
          });
        } catch(e) { console.error(e); }
      `
    });

    await new Promise(r => setTimeout(r, 1800));

    shotRes = await send('Page.captureScreenshot', { format: 'png' });
    if (shotRes.result?.data) {
      const buf = Buffer.from(shotRes.result.data, 'base64');
      fs.writeFileSync('screenshots/mate_mode_concentric_hole_pair.png', buf);
      console.log('Saved screenshots/mate_mode_concentric_hole_pair.png');
    }

    // 3. Commit Mate!
    console.log('Committing Mate...');
    await send('Runtime.evaluate', {
      expression: `
        try {
          const store = window.__designStore.getState();
          store.commitMateDraft();
        } catch(e) { console.error(e); }
      `
    });

    await new Promise(r => setTimeout(r, 1500));

    shotRes = await send('Page.captureScreenshot', { format: 'png' });
    if (shotRes.result?.data) {
      const buf = Buffer.from(shotRes.result.data, 'base64');
      fs.writeFileSync('screenshots/mate_committed_quickbar.png', buf);
      console.log('Saved screenshots/mate_committed_quickbar.png');
    }

    ws.close();
    await fetch(`http://127.0.0.1:${PORT}/json/close/${tab.id}`);
  }

  await capture();
  chrome.kill();
  console.log('Done capturing live mate screenshots.');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
