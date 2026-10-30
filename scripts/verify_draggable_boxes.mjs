import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9228;
const USER_DATA = "C:\\Users\\apo_q\\AppData\\Local\\Temp\\chrome_cdp_profile_drag_" + Date.now();
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

  console.log("Navigating to http://localhost:3000/design-studio/...");
  await send('Page.navigate', { url: 'http://localhost:3000/design-studio/' });

  // Wait for load
  await new Promise(r => setTimeout(r, 4000));

  // Click on "ASSEMBLY" workbench button
  console.log("Triggering Mate mode...");
  await send('Runtime.evaluate', {
    expression: `
      const btns = Array.from(document.querySelectorAll('button'));
      const assemblyBtn = btns.find(b => b.textContent && b.textContent.includes('ASSEMBLY'));
      if (assemblyBtn) assemblyBtn.click();
    `
  });

  await new Promise(r => setTimeout(r, 1200));

  // Find exact position of the draggable header
  const headerRes = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const header = document.getElementById('mate-modal-header') || document.querySelector('.cursor-grab');
        if (!header) return null;
        const r = header.getBoundingClientRect();
        return {
          id: header.id,
          left: r.left,
          top: r.top,
          width: r.width,
          height: r.height
        };
      })()
    `,
    returnByValue: true
  });

  const rect = headerRes?.value || headerRes?.result?.value;
  console.log("Header rect detected:", rect);

  // Capture initial screenshot
  const shot1 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'draggable_mate_box_initial.png'), Buffer.from(shot1.data, 'base64'));
  console.log("Saved draggable_mate_box_initial.png");

  if (rect) {
    const startX = Math.round(rect.left + 100);
    const startY = Math.round(rect.top + rect.height / 2);
    const targetX = startX + 350;
    const targetY = startY + 180;

    const elCheck = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const el = document.elementFromPoint(${startX}, ${startY});
          return el ? el.tagName + '.' + el.className : 'null';
        })()
      `,
      returnByValue: true
    });
    console.log("Element at drag start point:", elCheck?.value || elCheck?.result?.value);

    console.log(`Dragging from (${startX}, ${startY}) to (${targetX}, ${targetY})...`);
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: startX, y: startY, button: 'left', buttons: 1, clickCount: 1 });
    await new Promise(r => setTimeout(r, 60));

    // Multiple drag steps
    for (let step = 1; step <= 20; step++) {
      const curX = Math.round(startX + (targetX - startX) * (step / 20));
      const curY = Math.round(startY + (targetY - startY) * (step / 20));
      await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: curX, y: curY, button: 'left', buttons: 1 });
      await new Promise(r => setTimeout(r, 25));
    }

    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: targetX, y: targetY, button: 'left', buttons: 0 });
    await new Promise(r => setTimeout(r, 500));

    // Check final position of header
    const postRectRes = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const header = document.getElementById('mate-modal-header') || document.querySelector('.cursor-grab');
          if (!header) return null;
          const r = header.getBoundingClientRect();
          return { left: r.left, top: r.top };
        })()
      `,
      returnByValue: true
    });
    console.log("Post-drag header position:", postRectRes?.value || postRectRes?.result?.value);

    // Capture screenshot after drag
    const shot2 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'draggable_mate_box_dragged.png'), Buffer.from(shot2.data, 'base64'));
    console.log("Saved draggable_mate_box_dragged.png");

    // Test reset position button
    console.log("Testing reset position button...");
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const resetBtn = document.querySelector('button[title*="Reset"], button[title*="Sıfırla"]');
          if (resetBtn) resetBtn.click();
        })()
      `
    });
    await new Promise(r => setTimeout(r, 400));

    const resetRectRes = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const header = document.getElementById('mate-modal-header');
          if (!header) return null;
          const r = header.getBoundingClientRect();
          return { left: r.left, top: r.top };
        })()
      `,
      returnByValue: true
    });
    console.log("Post-reset header position:", resetRectRes?.value || resetRectRes?.result?.value);
  }

  ws.close();
  chrome.kill();
  console.log("Draggable verification finished successfully!");
}

run().catch(err => {
  console.error("Error during draggable verification:", err);
  process.exit(1);
});
