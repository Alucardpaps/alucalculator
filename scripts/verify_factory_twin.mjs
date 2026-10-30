import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9229;
const USER_DATA = "C:\\Users\\apo_q\\AppData\\Local\\Temp\\chrome_cdp_factory_" + Date.now();
const ARTIFACT_DIR = "C:/Users/apo_q/.gemini/antigravity/brain/b3669130-500a-4a18-a7ff-80386d5c7716";

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

  const newTabRes = await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' });
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
      callbacks.set(msgId, (res) => resolve(res.result));
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  await new Promise((resolve) => ws.onopen = resolve);

  await send('Page.enable');
  await send('DOM.enable');
  await send('Network.enable');
  await send('Network.clearBrowserCache');
  await send('Network.setBypassServiceWorker', { bypass: true });

  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false
  });

  console.log("Navigating to http://localhost:3000/factory/...");
  await send('Page.navigate', { url: 'http://localhost:3000/factory/' });

  // Wait for 3D load
  await new Promise(r => setTimeout(r, 4500));

  // 1. Capture 3D view with Sims Inspector & Random Sim active
  const shot1 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'factory_3d_sims_view.png'), Buffer.from(shot1.data, 'base64'));
  console.log("Saved factory_3d_sims_view.png");

  // 2. Switch to Live IoT Stream Mode
  console.log("Switching to Live IoT Sensor Stream mode...");
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const iotBtn = btns.find(b => b.textContent && b.textContent.includes('Canlı Sensör') || b.textContent.includes('Live IoT'));
        if (iotBtn) iotBtn.click();
      })()
    `
  });
  await new Promise(r => setTimeout(r, 1000));

  const shot2 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'factory_live_iot_mode.png'), Buffer.from(shot2.data, 'base64'));
  console.log("Saved factory_live_iot_mode.png");

  // 3. Switch to 2D Layout (Blueprint) Tab
  console.log("Switching to 2D Layout Blueprint tab...");
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const tab2d = btns.find(b => b.textContent && (b.textContent.includes('2D Kat Planı') || b.textContent.includes('2D Layout')));
        if (tab2d) tab2d.click();
      })()
    `
  });
  await new Promise(r => setTimeout(r, 1200));

  const shot3 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'factory_2d_blueprint_view.png'), Buffer.from(shot3.data, 'base64'));
  console.log("Saved factory_2d_blueprint_view.png");

  // 4. Test Opening 3D Asset Swap Modal
  console.log("Opening 3D Asset Swap Modal...");
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const swapBtn = btns.find(b => b.textContent && (b.textContent.includes('Swap with Real 3D') || b.textContent.includes('Gerçek 3D CAD Modeli')));
        if (swapBtn) swapBtn.click();
      })()
    `
  });
  await new Promise(r => setTimeout(r, 600));

  const shot4 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'factory_asset_swap_modal.png'), Buffer.from(shot4.data, 'base64'));
  console.log("Saved factory_asset_swap_modal.png");

  ws.close();
  chrome.kill();
  console.log("All factory captures verified successfully!");
}

run().catch(err => {
  console.error("Error during factory verification:", err);
  process.exit(1);
});
