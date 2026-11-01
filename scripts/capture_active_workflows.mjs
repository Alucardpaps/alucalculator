import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const screenshotDir = path.join(__dirname, '..', 'screenshots');
if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir, { recursive: true });

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const userDataDir = path.join(__dirname, '..', '.tmp_chrome_active_profile');

if (fs.existsSync(userDataDir)) {
  try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch (e) {}
}

const chrome = spawn(chromePath, [
  '--headless=new',
  '--remote-debugging-port=9222',
  '--window-size=1440,900',
  `--user-data-dir=${userDataDir}`,
  '--disable-gpu',
  '--no-sandbox'
]);

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function sendCDP(ws, method, params = {}) {
  const id = Math.floor(Math.random() * 1000000);
  return new Promise((resolve, reject) => {
    const handler = (msg) => {
      try {
        const data = JSON.parse(msg.data);
        if (data.id === id) {
          ws.removeEventListener('message', handler);
          if (data.error) reject(data.error);
          else resolve(data.result);
        }
      } catch (err) {}
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

async function evalInPage(ws, expression) {
  return await sendCDP(ws, 'Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true
  });
}

async function captureShot(ws, filename) {
  const screenshot = await sendCDP(ws, 'Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  const buffer = Buffer.from(screenshot.data, 'base64');
  const outPath = path.join(screenshotDir, filename);
  fs.writeFileSync(outPath, buffer);
  console.log(`  📸 Saved: ${filename} (${buffer.length} bytes)`);
}

async function dismissBanners(ws) {
  await evalInPage(ws, `
    try {
      localStorage.setItem('alu_consent_telemetry', '1');
      localStorage.setItem('alu_consent_screenshot', '1');
      localStorage.setItem('alucalc-cookie-consent', 'true');
      document.querySelectorAll('.fixed').forEach(b => {
        if (b.textContent && (b.textContent.includes('Gizlilik') || b.textContent.includes('Telemetry & KVKK') || b.textContent.includes('Cookie'))) {
          b.style.display = 'none';
        }
      });
    } catch(e) {}
  `);
}

async function run() {
  console.log('Connecting to Chrome CDP...');
  let version = null;
  for (let i = 0; i < 25; i++) {
    try {
      const res = await fetch('http://127.0.0.1:9222/json/version');
      version = await res.json();
      if (version.webSocketDebuggerUrl) break;
    } catch (e) {
      await sleep(400);
    }
  }

  if (!version || !version.webSocketDebuggerUrl) {
    console.error('Failed to connect to Chrome CDP');
    chrome.kill();
    process.exit(1);
  }

  const newTargetRes = await fetch('http://127.0.0.1:9222/json/new?about:blank', { method: 'PUT' });
  const target = await newTargetRes.json();
  const ws = new WebSocket(target.webSocketDebuggerUrl);

  await new Promise(resolve => ws.addEventListener('open', resolve));
  await sendCDP(ws, 'Page.enable');
  await sendCDP(ws, 'Runtime.enable');

  await sendCDP(ws, 'Page.addScriptToEvaluateOnNewDocument', {
    source: `
      try {
        localStorage.setItem('alu_consent_telemetry', '1');
        localStorage.setItem('alu_consent_screenshot', '1');
        localStorage.setItem('alucalc-cookie-consent', 'true');
      } catch(e) {}
    `
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 1. 3D DESIGN STUDIO (/design-studio) — Populated with parts, properties & render modes
  // ════════════════════════════════════════════════════════════════════════════
  console.log('\n--- Testing 3D Design Studio (/design-studio) ---');
  await sendCDP(ws, 'Page.navigate', { url: 'http://localhost:3000/design-studio' });
  await sleep(3500);
  await dismissBanners(ws);

  // Click Box, L-Bracket, and Tube to instantiate parts in 3D scene
  await evalInPage(ws, `
    const findBtn = (txt) => Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.trim().toLowerCase() === txt.toLowerCase());
    const boxBtn = findBtn('Box');
    if (boxBtn) boxBtn.click();
  `);
  await sleep(800);

  await evalInPage(ws, `
    const findBtn = (txt) => Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.trim().toLowerCase() === txt.toLowerCase());
    const lBracketBtn = findBtn('L-Bracket');
    if (lBracketBtn) lBracketBtn.click();
  `);
  await sleep(800);

  // Select the L-bracket and switch to Solid render mode
  await evalInPage(ws, `
    const partsList = document.querySelectorAll('[data-part-id], .part-row, li');
    if (partsList.length > 0) partsList[partsList.length - 1].click();
  `);
  await sleep(1000);
  await captureShot(ws, 'active_01a_design_studio_parts_inserted.png');

  // Switch render mode to MATCAP and click Inspect & Probe
  await evalInPage(ws, `
    const findBtn = (txt) => Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.trim().includes(txt));
    const matcapBtn = findBtn('MATCAP');
    if (matcapBtn) matcapBtn.click();
    const probeBtn = findBtn('Inspect & Probe');
    if (probeBtn) probeBtn.click();
  `);
  await sleep(1000);
  await captureShot(ws, 'active_01b_design_studio_matcap_inspection.png');

  // ════════════════════════════════════════════════════════════════════════════
  // 2. FEA SIMULATION STUDIO (/fea) — Run calculations on different templates
  // ════════════════════════════════════════════════════════════════════════════
  console.log('\n--- Testing FEA Simulation Studio (/fea) ---');
  await sendCDP(ws, 'Page.navigate', { url: 'http://localhost:3000/fea' });
  await sleep(3500);
  await dismissBanners(ws);

  // Capture default Alu 4040 Profile 3D FEA with stress map
  await captureShot(ws, 'active_02a_fea_sigma_4040_solved.png');

  // Click "Plate with Hole" template
  await evalInPage(ws, `
    const findBtn = (txt) => Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes(txt));
    const plateBtn = findBtn('Plate with Hole');
    if (plateBtn) plateBtn.click();
  `);
  await sleep(2000);
  await captureShot(ws, 'active_02b_fea_plate_with_hole_solved.png');

  // Click "Cantilever Beam" template
  await evalInPage(ws, `
    const findBtn = (txt) => Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes(txt));
    const cantBtn = findBtn('Cantilever Beam');
    if (cantBtn) cantBtn.click();
  `);
  await sleep(2000);
  await captureShot(ws, 'active_02c_fea_cantilever_beam_solved.png');

  // ════════════════════════════════════════════════════════════════════════════
  // 3. BOLT TORQUE SOLVER (/bolt-torque) — Change grade to 10.9, size to M16, inspect SVG drawing
  // ════════════════════════════════════════════════════════════════════════════
  console.log('\n--- Testing Bolt Torque Solver (/bolt-torque) ---');
  await sendCDP(ws, 'Page.navigate', { url: 'http://localhost:3000/bolt-torque' });
  await sleep(2500);
  await dismissBanners(ws);

  // Click Grade 10.9 button
  await evalInPage(ws, `
    const findBtn = (txt) => Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.trim() === txt);
    const g109 = findBtn('10.9');
    if (g109) g109.click();
  `);
  await sleep(1000);
  await captureShot(ws, 'active_03a_bolt_torque_grade109.png');

  // Scroll down inside <main> to view the SVG production drawing and dimension table
  await evalInPage(ws, `
    const m = document.querySelector('main');
    if (m) m.scrollTo(0, 650);
  `);
  await sleep(1000);
  await captureShot(ws, 'active_03b_bolt_torque_svg_production_drawing.png');

  // ════════════════════════════════════════════════════════════════════════════
  // 4. BEARING LIFE SOLVER (/bearings) — SKF selection, load calculation, 2D blueprint
  // ════════════════════════════════════════════════════════════════════════════
  console.log('\n--- Testing Bearing Life Solver (/bearings) ---');
  await sendCDP(ws, 'Page.navigate', { url: 'http://localhost:3000/bearings' });
  await sleep(2500);
  await dismissBanners(ws);

  // Select Angular Contact 7204-BEP
  await evalInPage(ws, `
    const findCard = (txt) => Array.from(document.querySelectorAll('button, div')).find(b => b.textContent && b.textContent.includes(txt));
    const c = findCard('7204-BEP');
    if (c) c.click();
  `);
  await sleep(1000);

  // Scroll to show the interactive 2D blueprint and mounting abutment
  await evalInPage(ws, `
    const m = document.querySelector('main');
    if (m) m.scrollTo(0, 450);
  `);
  await sleep(1000);
  await captureShot(ws, 'active_04_bearings_blueprint_and_mount.png');

  // ════════════════════════════════════════════════════════════════════════════
  // 5. BEAM DEFLECTION SOLVER (/beam-deflection) — Modifying span & load, checking curve
  // ════════════════════════════════════════════════════════════════════════════
  console.log('\n--- Testing Beam Deflection Solver (/beam-deflection) ---');
  await sendCDP(ws, 'Page.navigate', { url: 'http://localhost:3000/beam-deflection' });
  await sleep(2500);
  await dismissBanners(ws);

  // Change input load or click Cantilevered
  await evalInPage(ws, `
    const findBtn = (txt) => Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.trim().toLowerCase() === txt.toLowerCase());
    const cantBtn = findBtn('CANTILEVERED');
    if (cantBtn) cantBtn.click();
  `);
  await sleep(1000);
  await captureShot(ws, 'active_05_beam_deflection_cantilevered.png');

  // ════════════════════════════════════════════════════════════════════════════
  // 6. 1D CUTTING OPTIMIZER (/cutting-optimizer) — Run 1D cut algorithm and show cut bars
  // ════════════════════════════════════════════════════════════════════════════
  console.log('\n--- Testing 1D Cutting Optimizer (/cutting-optimizer) ---');
  await sendCDP(ws, 'Page.navigate', { url: 'http://localhost:3000/cutting-optimizer' });
  await sleep(2500);
  await dismissBanners(ws);

  // Click the Calculate / Run button
  await evalInPage(ws, `
    const btns = Array.from(document.querySelectorAll('button'));
    const calcBtn = btns.find(b => b.textContent && (b.textContent.includes('Calculate') || b.textContent.includes('Hesapla') || b.textContent.includes('Optimize')));
    if (calcBtn) calcBtn.click();
  `);
  await sleep(1500);
  await captureShot(ws, 'active_06_cutting_optimizer_results.png');

  // ════════════════════════════════════════════════════════════════════════════
  // 7. 2D NESTING ENGINE (/nesting-2d) — Add bracket part and run nesting solver
  // ════════════════════════════════════════════════════════════════════════════
  console.log('\n--- Testing 2D Nesting Engine (/nesting-2d) ---');
  await sendCDP(ws, 'Page.navigate', { url: 'http://localhost:3000/nesting-2d' });
  await sleep(2500);
  await dismissBanners(ws);

  // Check if we can trigger import or solver
  await evalInPage(ws, `
    // Add sample dummy parts to component state if available
    const importBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Import Brackets'));
    if (importBtn) importBtn.click();
  `);
  await sleep(1000);
  await captureShot(ws, 'active_07_nesting_2d_ready.png');

  // ════════════════════════════════════════════════════════════════════════════
  // 8. FLOW COMPUTATION GRAPH (/flow) — Execute graph and inspect node
  // ════════════════════════════════════════════════════════════════════════════
  console.log('\n--- Testing Flow Computation Graph (/flow) ---');
  await sendCDP(ws, 'Page.navigate', { url: 'http://localhost:3000/flow' });
  await sleep(3000);
  await dismissBanners(ws);

  // Click EXECUTE button
  await evalInPage(ws, `
    const execBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('EXECUTE'));
    if (execBtn) execBtn.click();
  `);
  await sleep(1500);

  // Click on a node to select it
  await evalInPage(ws, `
    const node = document.querySelector('.react-flow__node') || document.querySelector('[data-id]');
    if (node) node.click();
  `);
  await sleep(1000);
  await captureShot(ws, 'active_08_flow_engine_executed_and_inspected.png');

  // ════════════════════════════════════════════════════════════════════════════
  // 9. 2D CAD DRAFTING (/cad-editor) — Open standard mechanical blocks drawer
  // ════════════════════════════════════════════════════════════════════════════
  console.log('\n--- Testing 2D CAD Editor (/cad-editor) ---');
  await sendCDP(ws, 'Page.navigate', { url: 'http://localhost:3000/cad-editor' });
  await sleep(3000);
  await dismissBanners(ws);

  // Click BLOCKS button
  await evalInPage(ws, `
    const blocksBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('BLOCKS'));
    if (blocksBtn) blocksBtn.click();
  `);
  await sleep(1200);
  await captureShot(ws, 'active_09_cad_editor_blocks_drawer.png');

  // ════════════════════════════════════════════════════════════════════════════
  // 10. ACADEMY (/academy) — Open lesson / problem interactive screen
  // ════════════════════════════════════════════════════════════════════════════
  console.log('\n--- Testing Academy (/academy) ---');
  await sendCDP(ws, 'Page.navigate', { url: 'http://localhost:3000/academy' });
  await sleep(3000);
  await dismissBanners(ws);

  // Click START LESSON or the central node button
  await evalInPage(ws, `
    const startBtn = Array.from(document.querySelectorAll('button, a')).find(b => b.textContent && (b.textContent.includes('START LESSON') || b.textContent.includes('Başla')));
    if (startBtn) startBtn.click();
    else {
      const circleBtn = document.querySelector('[data-lesson-id]') || document.querySelector('.rounded-full');
      if (circleBtn) circleBtn.click();
    }
  `);
  await sleep(2000);
  await captureShot(ws, 'active_10_academy_lesson_screen.png');

  ws.close();
  chrome.kill();
  console.log('\n✅ All interactive active calculation workflows captured successfully!');
  process.exit(0);
}

run().catch(err => {
  console.error('Fatal error during active capture:', err);
  chrome.kill();
  process.exit(1);
});
