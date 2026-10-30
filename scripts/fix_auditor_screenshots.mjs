import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9228;
const USER_DATA = path.join(rootDir, '.tmp_chrome_fix');

if (fs.existsSync(USER_DATA)) {
  try { fs.rmSync(USER_DATA, { recursive: true, force: true }); } catch (e) {}
}

const targets = [
  { name: '14_column_buckling.png', url: 'http://localhost:3000/column-buckling' },
  { name: '41_fluid_dynamics.png', url: 'http://localhost:3000/fluid-dynamics' }
];

async function main() {
  console.log('Starting Chrome headless for auditor patch...');
  const chrome = spawn(CHROME_PATH, [
    `--remote-debugging-port=${PORT}`,
    '--headless=new',
    '--disable-gpu',
    `--user-data-dir=${USER_DATA}`,
    '--window-size=1920,1080',
    '--hide-scrollbars',
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
    console.error('Failed to connect to Chrome');
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
      callbacks.set(msgId, resolve);
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  await new Promise(r => ws.onopen = r);
  await send('Page.enable');
  await send('Runtime.enable');

  await send('Page.addScriptToEvaluateOnNewDocument', {
    source: `
      try {
        localStorage.setItem('alu_consent_telemetry', '1');
        localStorage.setItem('alu_consent_screenshot', '1');
        localStorage.setItem('alucalc-cookie-consent', 'true');
      } catch(e) {}
    `
  });

  const artifactDir = 'C:\\Users\\apo_q\\.gemini\\antigravity\\brain\\a1a6defd-f3ed-48e2-9096-fb0c1e87e8f6';

  for (const t of targets) {
    console.log(`Navigating to ${t.url}...`);
    await send('Page.navigate', { url: t.url });
    await new Promise(r => setTimeout(r, 2500));

    await send('Runtime.evaluate', {
      expression: `
        try {
          document.querySelectorAll('.fixed').forEach(b => {
            if (b.textContent && (b.textContent.includes('Gizlilik') || b.textContent.includes('Telemetry'))) {
              b.style.display = 'none';
            }
          });
        } catch(e) {}
      `
    });

    const shot = await send('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(shot.result.data, 'base64');

    // Save in site_screenshots, artifact screenshots, and bundle screenshots
    fs.writeFileSync(path.join(rootDir, 'site_screenshots', t.name), buffer);
    fs.writeFileSync(path.join(artifactDir, 'screenshots', t.name), buffer);
    fs.writeFileSync(path.join(rootDir, 'alucalc_audit_bundle', 'screenshots', t.name), buffer);
    console.log(`Successfully updated ${t.name} (${(buffer.length / 1024).toFixed(0)} KB)`);
  }

  ws.close();
  chrome.kill();

  console.log('Re-packing ZIP archive with patched screenshots...');
  const zipPathRoot = path.join(rootDir, 'ALUCALC_AUDIT_REPORT_FULL.zip');
  const zipPathArtifact = path.join(artifactDir, 'ALUCALC_AUDIT_REPORT_FULL.zip');
  const bundleDir = path.join(rootDir, 'alucalc_audit_bundle');

  const cmd = `7z.exe a -tzip -mx5 "${zipPathRoot}" "${bundleDir}\\*"`;
  execSync(cmd, { stdio: 'inherit' });
  fs.copyFileSync(zipPathRoot, zipPathArtifact);
  console.log('Patched ZIP archive successfully updated!');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
