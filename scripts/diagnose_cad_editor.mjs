import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9222;
const USER_DATA = "C:\\Users\\apo_q\\AppData\\Local\\Temp\\chrome_cdp_cad_editor_error";
const ARTIFACT_DIR = "C:\\Users\\apo_q\\.gemini\\antigravity\\brain\\b3669130-500a-4a18-a7ff-80386d5c7716";

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function run() {
  const chrome = spawn(
    CHROME_PATH,
    [
      `--remote-debugging-port=${PORT}`,
      '--headless=new',
      '--disable-gpu',
      '--no-first-run',
      '--no-default-browser-check',
      `--user-data-dir=${USER_DATA}`,
      'about:blank',
    ],
    { stdio: 'ignore' }
  );

  let version = null;
  for (let i = 0; i < 20; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/version`);
      version = await res.json();
      break;
    } catch {
      await sleep(250);
    }
  }

  if (!version) {
    chrome.kill();
    process.exit(1);
  }

  const url = "http://localhost:3000/cad-editor/";
  console.log("Navigating to", url);
  const tabRes = await fetch(`http://127.0.0.1:${PORT}/json/new?${encodeURIComponent(url)}`, { method: 'PUT' });
  const tab = await tabRes.json();
  const ws = new WebSocket(tab.webSocketDebuggerUrl);

  let msgId = 1;
  const callbacks = new Map();
  const errors = [];

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.method === "Runtime.exceptionThrown") {
      console.error("PAGE EXCEPTION:", JSON.stringify(msg.params.exceptionDetails, null, 2));
      errors.push(msg.params.exceptionDetails);
    }
    if (msg.method === "Runtime.consoleAPICalled" && msg.params.type === "error") {
      console.error("CONSOLE ERROR:", JSON.stringify(msg.params.args, null, 2));
    }
    if (msg.id && callbacks.has(msg.id)) {
      callbacks.get(msg.id)(msg);
      callbacks.delete(msg.id);
    }
  };

  function send(method, params = {}) {
    return new Promise((resolve) => {
      const id = msgId++;
      callbacks.set(id, resolve);
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  await new Promise((r) => (ws.onopen = r));
  await send("Page.enable");
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });

  await sleep(4000);

  const shot = await send("Page.captureScreenshot", { format: "png" });
  const buffer = Buffer.from(shot.result.data, "base64");
  const filePath = path.join(ARTIFACT_DIR, "cad_editor_error_capture.png");
  fs.writeFileSync(filePath, buffer);
  console.log(`Saved screenshot to ${filePath}`);

  await send("Page.close");
  ws.close();
  chrome.kill();

  console.log("Error diagnosis complete. Captured", errors.length, "exceptions.");
  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
