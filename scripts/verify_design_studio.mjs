import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9222;
const USER_DATA = "C:\\Users\\apo_q\\AppData\\Local\\Temp\\chrome_cdp_profile_ds2";
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

  async function takeScreenshot(url, outputPath, width = 1440, height = 900) {
    console.log(`Setting up ${width}x${height} and navigating to ${url}...`);
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
        callbacks.set(msgId, resolve);
        ws.send(JSON.stringify({ id: msgId, method, params }));
      });
    }

    await new Promise((resolve) => ws.onopen = resolve);
    await send('Page.enable');
    await send('DOM.enable');
    await send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: width < 768,
    });

    await send('Page.navigate', { url });
    await new Promise((r) => setTimeout(r, 4500));

    const shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(outputPath, Buffer.from(shot.result.data, 'base64'));
    console.log(`Saved screenshot to ${outputPath}`);

    await send('Page.close');
    ws.close();
  }

  try {
    await takeScreenshot(
      'http://localhost:3000/design-studio/',
      path.join(ARTIFACT_DIR, 'design_studio_desktop_v2.png'),
      1440,
      900
    );

    await takeScreenshot(
      'http://localhost:3000/design-studio/',
      path.join(ARTIFACT_DIR, 'design_studio_mobile_v2.png'),
      390,
      844
    );
  } catch (err) {
    console.error('Error during capture:', err);
  } finally {
    chrome.kill();
  }
}

run();
