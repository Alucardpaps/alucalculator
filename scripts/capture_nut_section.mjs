import { spawn } from 'child_process';
import fs from 'fs';

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9222;
const USER_DATA = "C:\\Users\\apo_q\\AppData\\Local\\Temp\\chrome_cdp_profile_nut_section";

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
      width: 1400,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    });
    await send('Page.enable');
    await send('Runtime.enable');

    console.log('Waiting for Design Studio hydration...');
    for (let i = 0; i < 60; i++) {
      const evalRes = await send('Runtime.evaluate', {
        expression: `typeof window.__designStore !== 'undefined'`
      });
      if (evalRes.result?.value === true) break;
      await new Promise(r => setTimeout(r, 500));
    }

    // Set nut in designStore and activate Section View
    await send('Runtime.evaluate', {
      expression: `
        try {
          const nut = {
            id: 'nut-test',
            kind: 'hex-nut',
            name: 'M10 Altıgen Somun (ISO 4032)',
            color: '#94a3b8',
            visible: true,
            locked: false,
            parentId: null,
            position: { x: 0, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0 },
            scale: { x: 1, y: 1, z: 1 },
            params: { headSize: 17, innerDiameter: 10, depth: 8, pitch: 1.5 },
            holes: []
          };
          window.__designStore.setState({
            parts: [nut],
            selectedId: 'nut-test',
            sectionAxis: 'Z',
            sectionOffset: 0,
            sectionInvert: false,
            sectionSolidCap: true
          });
          window.dispatchEvent(new CustomEvent('cad-camera-action', { detail: 'fit' }));
        } catch(e) { console.error(e); }
      `
    });

    // Position camera close up to nut
    await send('Runtime.evaluate', {
      expression: `
        if (window.__cadThree && window.__cadThree.camera && window.__cadThree.controls) {
          const { camera, controls } = window.__cadThree;
          camera.position.set(1.4, 1.2, 2.0);
          controls.target.set(0, 0, 0);
          controls.update();
        }
      `
    });
    await new Promise(r => setTimeout(r, 1200));

    const shot1 = await send('Page.captureScreenshot', { format: 'png' });
    if (!fs.existsSync('screenshots')) fs.mkdirSync('screenshots');
    fs.writeFileSync('screenshots/nut_section_fixed.png', Buffer.from(shot1.result.data, 'base64'));
    console.log('Saved screenshots/nut_section_fixed.png');

    // Turn off section view for normal 3D view
    await send('Runtime.evaluate', {
      expression: `
        window.__designStore.setState({ sectionAxis: 'NONE' });
        if (window.__cadThree && window.__cadThree.camera && window.__cadThree.controls) {
          const { camera, controls } = window.__cadThree;
          camera.position.set(1.6, 1.8, 2.0);
          controls.target.set(0, 0, 0);
          controls.update();
        }
      `
    });
    await new Promise(r => setTimeout(r, 1200));

    const shot2 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('screenshots/nut_3d_fixed.png', Buffer.from(shot2.result.data, 'base64'));
    console.log('Saved screenshots/nut_3d_fixed.png');

    ws.close();
    chrome.kill();
  }

  await capture();
}

run().catch(console.error);
