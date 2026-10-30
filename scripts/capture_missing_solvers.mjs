import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');
const outDir = path.join(rootDir, 'screenshots', 'calc_audit');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9225;
const USER_DATA = path.join(rootDir, '.tmp_chrome_audit');

if (fs.existsSync(USER_DATA)) {
  try { fs.rmSync(USER_DATA, { recursive: true, force: true }); } catch (e) {}
}

const routesToCapture = [
  { id: 'profile-weight', route: '/profile-weight' },
  { id: 'machining-details', route: '/machining-details' },
  { id: 'machining-time', route: '/machining-time' },
  { id: 'welding-fillet', route: '/welding-fillet' },
  { id: 'cost-estimator', route: '/cost-estimator' },
  { id: 'strength-analysis', route: '/strength-analysis' },
  { id: 'manufacturing-readiness', route: '/manufacturing-readiness' },
  { id: 'manufacturing-sandbox', route: '/manufacturing-sandbox' },
  { id: 'engineering-selection', route: '/engineering-selection' },
  { id: 'manufacturing', route: '/manufacturing' },
  { id: 'truss-analysis', route: '/truss-analysis' },
  { id: 'bending-moment', route: '/bending-moment' },
  { id: 'heat-sink', route: '/heat-sink' },
  { id: 'pumps', route: '/pumps' },
  { id: 'pipe-friction', route: '/pipe-friction' },
  { id: 'pressure-vessel', route: '/pressure-vessel' },
  { id: 'hvac-load', route: '/hvac-load' },
  { id: 'reducer-lubrication', route: '/reducer-lubrication' },
  { id: 'wind-tunnel', route: '/wind-tunnel' },
  { id: 'aerospace-dynamics', route: '/aerospace-dynamics' },
  { id: 'gearbox-design', route: '/gearbox-design' },
  { id: 'motor-selection-std', route: '/motor-selection-std' },
  { id: 'handbook', route: '/handbook' },
  { id: 'thread-stripping-area', route: '/thread-stripping-area' },
  { id: 'materials-explorer', route: '/materials-explorer' },
  { id: 'material-selector-ai', route: '/material-selector-ai' },
  { id: 'ohms-law', route: '/ohms-law' },
  { id: 'voltage-drop', route: '/voltage-drop' },
  { id: 'transformer-calculation', route: '/transformer-calculation' },
  { id: 'filter-design', route: '/filter-design' },
  { id: 'lift-coefficient', route: '/lift-coefficient' },
  { id: 'physics-solver', route: '/physics-solver' },
  { id: 'physics-kinematics', route: '/physics-kinematics' },
  { id: 'fatigue-analysis', route: '/fatigue-analysis' },
  { id: 'fatigue-advanced', route: '/fatigue-advanced' },
  { id: 'failure-prediction', route: '/failure-prediction' },
  { id: 'chemistry-reactions', route: '/chemistry-reactions' },
  { id: 'periodic-table', route: '/periodic-table' },
  { id: 'biology-genetics', route: '/biology-genetics' },
  { id: 'cs-algorithms', route: '/cs-algorithms' },
  { id: 'digital-logic', route: '/digital-logic' },
  { id: 'hooke-law', route: '/hooke-law' },
  { id: 'ideal-gas-law', route: '/ideal-gas-law' },
  { id: 'chemical-molarity', route: '/chemical-molarity' },
  { id: 'radioactive-decay', route: '/radioactive-decay' },
  { id: 'reynolds-number', route: '/reynolds-number' },
  { id: 'rocket-equation', route: '/rocket-equation' },
  { id: 'centripetal-force', route: '/centripetal-force' },
  { id: 'kinetic-energy', route: '/kinetic-energy' },
  { id: 'newton-second-law', route: '/newton-second-law' },
  { id: 'specific-gravity', route: '/specific-gravity' }
];

async function main() {
  console.log(`Starting headless Chrome on port ${PORT}...`);
  const chrome = spawn(CHROME_PATH, [
    `--remote-debugging-port=${PORT}`,
    '--headless=new',
    '--disable-gpu',
    `--user-data-dir=${USER_DATA}`,
    '--window-size=1440,900',
    '--hide-scrollbars',
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
    console.error("Failed to start Chrome CDP");
    chrome.kill();
    process.exit(1);
  }
  console.log("Chrome connected. Capturing", routesToCapture.length, "routes...");

  // Open single target tab and navigate sequentially
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

  let count = 0;
  for (const item of routesToCapture) {
    count++;
    const url = `http://localhost:3000${item.route}`;
    process.stdout.write(`[${count}/${routesToCapture.length}] ${item.id} (${url})... `);
    try {
      await send('Page.navigate', { url });
      await new Promise(r => setTimeout(r, 1800));

      // Dismiss any overlay banners
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
      if (shot && shot.result && shot.result.data) {
        const outPath = path.join(outDir, `${item.id}.png`);
        fs.writeFileSync(outPath, Buffer.from(shot.result.data, 'base64'));
        console.log(`OK (${(shot.result.data.length / 1024).toFixed(0)} KB)`);
      } else {
        console.log(`FAILED (no data)`);
      }
    } catch (err) {
      console.log(`ERROR: ${err.message}`);
    }
  }

  ws.close();
  chrome.kill();
  console.log("All missing routes captured successfully!");
  process.exit(0);
}

main().catch(err => {
  console.error("Fatal:", err);
  process.exit(1);
});
