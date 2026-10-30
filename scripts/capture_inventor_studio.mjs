import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9222;
const USER_DATA = "C:\\Users\\apo_q\\AppData\\Local\\Temp\\chrome_cdp_profile_inventor";

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

  async function captureScene() {
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
      height: 980,
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

    // Set state via __designStore
    await send('Runtime.evaluate', {
      expression: `
        try {
          const store = window.__designStore;
          if (store) {
            store.setState({
              projectName: 'CNC XYZ Gantry Machine.iam',
              selectedMaterialId: 'al-6061-t6',
              subAssemblies: [
                {
                  id: 'sub-carriage-01',
                  name: 'Z-Axis Carriage Sub-Assembly',
                  color: '#10b981',
                  visible: true,
                  locked: false,
                  expanded: true,
                  parentId: null
                }
              ],
              parts: [
                {
                  id: 'part-base-plate',
                  kind: 'box',
                  name: 'Gantry Base Bed (Grounded)',
                  color: '#64748b',
                  visible: true,
                  locked: false,
                  grounded: true,
                  parentId: null,
                  subAssemblyId: null,
                  position: { x: 0, y: -20, z: 0 },
                  rotation: { x: 0, y: 0, z: 0 },
                  scale: { x: 1, y: 1, z: 1 },
                  params: { width: 160, height: 16, depth: 100 },
                  holes: [
                    { id: 'h1', size: 'M10', x: 20, y: 20, face: 'top', type: 'counterbore', isThroughAll: true, depth: 16, diameter: 11 }
                  ]
                },
                {
                  id: 'part-bearing-block',
                  kind: 'L-bracket',
                  name: 'Linear Slider Bearing Block',
                  color: '#38bdf8',
                  visible: true,
                  locked: false,
                  grounded: false,
                  parentId: null,
                  subAssemblyId: 'sub-carriage-01',
                  position: { x: -25, y: 20, z: 15 },
                  rotation: { x: 0, y: 0, z: 0 },
                  scale: { x: 1, y: 1, z: 1 },
                  params: { flangeW: 45, webH: 45, flangeT: 8, webT: 8, length: 50 },
                  holes: [
                    { id: 'h2', size: 'M6', x: 22, y: 22, face: 'top', type: 'clearance', isThroughAll: true, depth: 8, diameter: 6.6 }
                  ]
                },
                {
                  id: 'part-rail-guide',
                  kind: 'cylinder',
                  name: 'Precision Linear Guide Shaft',
                  color: '#f59e0b',
                  visible: true,
                  locked: false,
                  grounded: false,
                  parentId: null,
                  subAssemblyId: 'sub-carriage-01',
                  position: { x: -25, y: 20, z: -25 },
                  rotation: { x: 1.5708, y: 0, z: 0 },
                  scale: { x: 1, y: 1, z: 1 },
                  params: { diameter: 22, length: 120 }
                },
                {
                  id: 'part-stepper-motor',
                  kind: 'box',
                  name: 'NEMA 23 Stepper Motor',
                  color: '#a855f7',
                  visible: true,
                  locked: false,
                  grounded: false,
                  parentId: null,
                  subAssemblyId: null,
                  position: { x: 50, y: 25, z: 0 },
                  rotation: { x: 0, y: 0, z: 0 },
                  scale: { x: 1, y: 1, z: 1 },
                  params: { width: 56, height: 56, depth: 56 }
                }
              ],
              selectedId: 'part-bearing-block',
              expandedPartIds: ['part-bearing-block']
            });
          }
        } catch(e) {
          console.error(e);
        }
      `
    });

    // Wait for 3D meshes to settle
    await new Promise(r => setTimeout(r, 3500));

    // Remove consent banners if any
    await send('Runtime.evaluate', {
      expression: `
        try {
          const banners = Array.from(document.querySelectorAll('div')).filter(el => el.className && typeof el.className === 'string' && el.className.includes('z-50') && el.className.includes('fixed'));
          banners.forEach(b => b.remove());
        } catch(e) {}
      `
    });

    // Capture Full Assembly View
    let shotRes = await send('Page.captureScreenshot', { format: 'png' });
    if (shotRes.result?.data) {
      const buf = Buffer.from(shotRes.result.data, 'base64');
      fs.mkdirSync('screenshots', { recursive: true });
      fs.writeFileSync('screenshots/audit_68_inventor_assembly_full_tree.png', buf);
      console.log('Saved screenshots/audit_68_inventor_assembly_full_tree.png');
    }

    // Now Activate Autodesk Inventor In-Place Edit Mode on 'part-bearing-block'
    console.log('Activating In-Place Edit Mode on Linear Slider Bearing Block...');
    await send('Runtime.evaluate', {
      expression: `
        try {
          const store = window.__designStore;
          if (store) {
            store.getState().setEditingPartId('part-bearing-block');
          }
        } catch(e) {
          console.error(e);
        }
      `
    });

    await new Promise(r => setTimeout(r, 2000));

    // Capture In-Place Part Edit Mode (Ghosted reference parts + breadcrumb banner + return button)
    shotRes = await send('Page.captureScreenshot', { format: 'png' });
    if (shotRes.result?.data) {
      const buf = Buffer.from(shotRes.result.data, 'base64');
      fs.writeFileSync('screenshots/audit_67_inventor_assembly_inplace_edit.png', buf);
      console.log('Saved screenshots/audit_67_inventor_assembly_inplace_edit.png');
    }

    ws.close();
    await fetch(`http://127.0.0.1:${PORT}/json/close/${tab.id}`);
  }

  await captureScene();
  chrome.kill();
  console.log('Done capturing Inventor assembly screenshots.');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
