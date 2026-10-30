import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const screenshotDir = path.join(__dirname, '..', 'screenshots');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const userDataDir = path.join(__dirname, '..', '.tmp_chrome_batch2');

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
      window.alert = () => {};
      window.confirm = () => true;
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
        window.alert = () => {};
        window.confirm = () => true;
        localStorage.setItem('alu_consent_telemetry', '1');
        localStorage.setItem('alu_consent_screenshot', '1');
        localStorage.setItem('alucalc-cookie-consent', 'true');
      } catch(e) {}
    `
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 1. 1D CUTTING OPTIMIZER (/cutting-optimizer) — Click "Generate Plan & Toolpath"
  // ════════════════════════════════════════════════════════════════════════════
  console.log('\n--- Testing 1D Cutting Optimizer Active Calculation ---');
  await sendCDP(ws, 'Page.navigate', { url: 'http://localhost:3000/cutting-optimizer' });
  await sleep(3000);
  await dismissBanners(ws);

  await evalInPage(ws, `
    const btns = Array.from(document.querySelectorAll('button'));
    const genBtn = btns.find(b => b.textContent && (b.textContent.includes('Generate Plan') || b.textContent.includes('Plan & Takım Yolu')));
    if (genBtn) genBtn.click();
  `);
  await sleep(1500);
  await captureShot(ws, 'active_06_cutting_optimizer_solved.png');

  // Also switch to Checklist tab and G-Code tab
  await evalInPage(ws, `
    const btns = Array.from(document.querySelectorAll('button'));
    const gcodeBtn = btns.find(b => b.textContent && b.textContent.includes('G-Code'));
    if (gcodeBtn) gcodeBtn.click();
  `);
  await sleep(800);
  await captureShot(ws, 'active_06b_cutting_optimizer_gcode.png');

  // ════════════════════════════════════════════════════════════════════════════
  // 2. 2D CAD DRAFTING (/cad-editor) — Open Standard Blocks Library Drawer
  // ════════════════════════════════════════════════════════════════════════════
  console.log('\n--- Testing 2D CAD Drafting Standard Blocks Drawer ---');
  await sendCDP(ws, 'Page.navigate', { url: 'http://localhost:3000/cad-editor' });
  await sleep(3500);
  await dismissBanners(ws);

  await evalInPage(ws, `
    const btns = Array.from(document.querySelectorAll('button'));
    const blocksBtn = btns.find(b => b.textContent && b.textContent.includes('BLOCKS'));
    if (blocksBtn) blocksBtn.click();
  `);
  await sleep(1500);
  await captureShot(ws, 'active_09_cad_editor_blocks_drawer.png');

  // ════════════════════════════════════════════════════════════════════════════
  // 3. FLOW COMPUTATION GRAPH (/flow) — Execute graph & inspect active node
  // ════════════════════════════════════════════════════════════════════════════
  console.log('\n--- Testing Flow Computation Graph Execution ---');
  await sendCDP(ws, 'Page.navigate', { url: 'http://localhost:3000/flow' });
  await sleep(3500);
  await dismissBanners(ws);

  await evalInPage(ws, `
    const execBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('EXECUTE'));
    if (execBtn) execBtn.click();
  `);
  await sleep(1500);

  await evalInPage(ws, `
    const nodes = document.querySelectorAll('.react-flow__node');
    if (nodes.length > 2) {
      nodes[1].click();
    }
  `);
  await sleep(1000);
  await captureShot(ws, 'active_08_flow_engine_executed.png');

  // ════════════════════════════════════════════════════════════════════════════
  // 4. ACADEMY (/academy) — Interactive Lesson / Problem Screen
  // ════════════════════════════════════════════════════════════════════════════
  console.log('\n--- Testing Academy Active Lesson Screen ---');
  await sendCDP(ws, 'Page.navigate', { url: 'http://localhost:3000/academy' });
  await sleep(3500);
  await dismissBanners(ws);

  await evalInPage(ws, `
    // Click the start lesson button
    const btns = Array.from(document.querySelectorAll('button, a'));
    const startBtn = btns.find(b => b.textContent && (b.textContent.includes('START LESSON') || b.textContent.includes('Başla')));
    if (startBtn) startBtn.click();
    else {
      const node = document.querySelector('[data-lesson-id]') || document.querySelector('.cursor-pointer');
      if (node) node.click();
    }
  `);
  await sleep(2000);
  await captureShot(ws, 'active_10_academy_lesson_screen.png');

  // ════════════════════════════════════════════════════════════════════════════
  // 5. 2D NESTING ENGINE (/nesting-2d) with injected assembly brackets
  // ════════════════════════════════════════════════════════════════════════════
  console.log('\n--- Testing 2D Nesting Engine with Brackets ---');
  await sendCDP(ws, 'Page.navigate', { url: 'http://localhost:3000/nesting-2d' });
  await sleep(3000);
  await dismissBanners(ws);

  // Pre-seed brackets in assemblyStore via window/store or add part
  await evalInPage(ws, `
    try {
      window.alert = () => {};
      // Check if useAssemblyStore is accessible or click Import Brackets
      const importBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Import Brackets'));
      if (importBtn) importBtn.click();
    } catch(e) {}
  `);
  await sleep(1000);

  // Click Run Solver
  await evalInPage(ws, `
    const solveBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && (b.textContent.includes('Run Solver') || b.textContent.includes('Solving')));
    if (solveBtn) solveBtn.click();
  `);
  await sleep(2000);
  await captureShot(ws, 'active_07_nesting_2d_solver_results.png');

  ws.close();
  chrome.kill();
  console.log('\n✅ Batch 2 interactive screenshots captured successfully!');
  process.exit(0);
}

run().catch(err => {
  console.error('Fatal error during batch 2 capture:', err);
  chrome.kill();
  process.exit(1);
});
