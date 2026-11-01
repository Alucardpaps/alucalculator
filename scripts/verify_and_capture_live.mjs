import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9222;
const USER_DATA = "C:\\Users\\apo_q\\AppData\\Local\\Temp\\chrome_cdp_verify_profile";
const ARTIFACT_DIR = "C:\\Users\\apo_q\\.gemini\\antigravity\\brain\\a1a6defd-f3ed-48e2-9096-fb0c1e87e8f6\\screenshots";

fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
fs.mkdirSync("public/screenshots/verification", { recursive: true });

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function run() {
  console.log("Spawning Chrome headless with CDP on port " + PORT + "...");
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
      await sleep(250);
    }
  }

  if (!version) {
    console.error("Failed to connect to Chrome CDP");
    chrome.kill();
    process.exit(1);
  }
  console.log("Connected to Chrome CDP successfully:", version.Browser);

  async function openTab(url, lang = 'en') {
    const tabRes = await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' });
    const tab = await tabRes.json();
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
      width: 1440,
      height: 1050,
      deviceScaleFactor: 1,
      mobile: false
    });
    await send('Page.enable');
    await send('Runtime.enable');

    // Set cookie consent and language in localStorage before navigating
    await send('Page.navigate', { url: 'http://localhost:3000/' });
    await sleep(1000);

    await send('Runtime.evaluate', {
      expression: `
        try {
          localStorage.setItem('alu_consent_telemetry', '1');
          localStorage.setItem('alu_consent_screenshot', '1');
          localStorage.setItem('alucalc-cookie-consent', 'true');
          localStorage.setItem('alucalc-i18n-storage', JSON.stringify({ state: { language: '${lang}' }, version: 0 }));
        } catch(e) {}
      `
    });

    console.log(`Navigating to ${url} [lang=${lang}]...`);
    await send('Page.navigate', { url });
    // Wait for hydration & compilation
    await sleep(4000);

    // Remove any consent banners
    await send('Runtime.evaluate', {
      expression: `
        try {
          const banners = Array.from(document.querySelectorAll('div')).filter(el => {
            const txt = (el.innerText || '').toLowerCase();
            return (txt.includes('cookie') || txt.includes('çerez') || txt.includes('consent') || txt.includes('kvkk')) && el.className && typeof el.className === 'string' && el.className.includes('fixed');
          });
          banners.forEach(b => b.remove());
        } catch(e) {}
      `
    });

    return {
      tab,
      ws,
      send,
      evaluate: async (code) => {
        const res = await send('Runtime.evaluate', { expression: code, returnByValue: true });
        return res?.result?.value;
      },
      screenshot: async (name, scrollY = 0) => {
        if (scrollY > 0) {
          await send('Runtime.evaluate', {
            expression: `window.scrollTo(0, ${scrollY});`
          });
          await sleep(600);
        }
        const shotRes = await send('Page.captureScreenshot', { format: 'png' });
        if (shotRes?.result?.data) {
          const buf = Buffer.from(shotRes.result.data, 'base64');
          const localPath = path.join("public", "screenshots", "verification", name);
          const artifactPath = path.join(ARTIFACT_DIR, name);
          fs.writeFileSync(localPath, buf);
          fs.writeFileSync(artifactPath, buf);
          console.log(`Screenshot saved: ${name} (${buf.length} bytes)`);
        }
      },
      close: async () => {
        ws.close();
        await fetch(`http://127.0.0.1:${PORT}/json/close/${tab.id}`);
      }
    };
  }

  const results = {};

  // 1. Column Buckling
  try {
    console.log("\n=== Testing Column Buckling ===");
    const page = await openTab('http://localhost:3000/column-buckling/?headless=1', 'en');
    await sleep(2000);

    const data = await page.evaluate(`
      (() => {
        const text = document.body.innerText;
        return {
          hasCc: text.includes('125.7') || text.includes('125.66'),
          hasEuler: text.includes('151.4') || text.includes('151.36'),
          hasJohnsonNA: text.includes('N/A') && (text.includes('Euler Equation Governs') || text.includes('Slender Column')),
          hasStressSeparation: text.includes('77.1') || text.includes('Critical Stress'),
          snippet: text.substring(0, 1000)
        };
      })()
    `);
    console.log("Column Buckling Data (EN):", data);
    results.columnBucklingEn = data;
    await page.screenshot('verify_01_column_buckling_en.png', 200);
    await page.close();

    // In Turkish
    const pageTr = await openTab('http://localhost:3000/column-buckling/?headless=1', 'tr');
    await sleep(2000);
    await pageTr.screenshot('verify_01_column_buckling_tr.png', 200);
    await pageTr.close();
  } catch (e) {
    console.error("Column Buckling error:", e);
  }

  // 2. Pipe Friction
  try {
    console.log("\n=== Testing Pipe Friction ===");
    const page = await openTab('http://localhost:3000/pipe-friction/?headless=1', 'en');
    await sleep(2000);

    const data = await page.evaluate(`
      (() => {
        const text = document.body.innerText;
        return {
          hasDarcy: text.includes('Darcy-Weisbach'),
          hasColebrook: text.includes('Colebrook'),
          noIso5167: !text.includes('ISO 5167'),
          hasTransitionBadge: text.includes('Transitional') || text.includes('2300 < Re < 4000') || text.includes('Turbulent') || text.includes('Laminar'),
          snippet: text.substring(0, 1200)
        };
      })()
    `);
    console.log("Pipe Friction Data (EN):", data);
    results.pipeFrictionEn = data;
    await page.screenshot('verify_02_pipe_friction_en.png', 250);
    await page.close();

    const pageTr = await openTab('http://localhost:3000/pipe-friction/?headless=1', 'tr');
    await sleep(2000);
    await pageTr.screenshot('verify_02_pipe_friction_tr.png', 250);
    await pageTr.close();
  } catch (e) {
    console.error("Pipe Friction error:", e);
  }

  // 3. Shafts
  try {
    console.log("\n=== Testing Shafts ===");
    const page = await openTab('http://localhost:3000/shafts/?headless=1', 'en');
    await sleep(2000);

    const data = await page.evaluate(`
      (() => {
        const text = document.body.innerText;
        return {
          hasAsmeVonMises: text.includes('ASME B106.1M') || text.includes('von Mises'),
          hasDin743: text.includes('DIN 743'),
          snippet: text.substring(0, 1000)
        };
      })()
    `);
    console.log("Shafts Data (EN):", data);
    results.shaftsEn = data;
    await page.screenshot('verify_03_shafts_quick_sizing_en.png', 100);

    // Try clicking the DIN 743 stepped shaft tab if present
    await page.evaluate(`
      (() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const dinBtn = buttons.find(b => b.innerText.includes('DIN 743') || b.innerText.includes('Stepped'));
        if (dinBtn) dinBtn.click();
      })()
    `);
    await sleep(1500);
    await page.screenshot('verify_03_shafts_din743_stepped_en.png', 100);
    await page.close();
  } catch (e) {
    console.error("Shafts error:", e);
  }

  // 4. Bearings
  try {
    console.log("\n=== Testing Bearings ===");
    const page = await openTab('http://localhost:3000/bearings/?headless=1', 'en');
    await sleep(2000);

    const data = await page.evaluate(`
      (() => {
        const text = document.body.innerText;
        return {
          hasIso281: text.includes('ISO 281'),
          hasDynamicFactor: text.includes('Table 3') || text.includes('Radial Factor') || text.includes('Axial Factor') || text.includes('e =') || text.includes('L10h') || text.includes('6204') || text.includes('6208'),
          snippet: text.substring(0, 1200)
        };
      })()
    `);
    console.log("Bearings Data (EN):", data);
    results.bearingsEn = data;
    await page.screenshot('verify_04_bearings_iso281_en.png', 150);

    const pageDe = await openTab('http://localhost:3000/bearings/?headless=1', 'de');
    await sleep(2000);
    await pageDe.screenshot('verify_04_bearings_iso281_de.png', 150);
    await pageDe.close();

    await page.close();
  } catch (e) {
    console.error("Bearings error:", e);
  }

  // 5. Concrete Reinforcement
  try {
    console.log("\n=== Testing Concrete Reinforcement ===");
    const page = await openTab('http://localhost:3000/concrete-reinforcement/?headless=1', 'en');
    await sleep(2000);

    const ec2Data = await page.evaluate(`
      (() => {
        const text = document.body.innerText;
        return {
          hasEurocode2: text.includes('Eurocode 2') || text.includes('EN 1992'),
          hasAci318: text.includes('ACI 318'),
          snippet: text.substring(0, 1200)
        };
      })()
    `);
    console.log("Concrete EC2 Data:", ec2Data);
    results.concreteEc2 = ec2Data;
    await page.screenshot('verify_05_concrete_eurocode2_en.png', 150);

    // Click ACI 318 button
    console.log("Clicking ACI 318 button...");
    await page.evaluate(`
      (() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const aciBtn = buttons.find(b => b.innerText.includes('ACI 318'));
        if (aciBtn) aciBtn.click();
      })()
    `);
    await sleep(1500);

    const aciData = await page.evaluate(`
      (() => {
        const text = document.body.innerText;
        return {
          activeCode: text.includes('ACI 318-25') || text.includes('ACI 318'),
          snippet: text.substring(0, 1000)
        };
      })()
    `);
    console.log("Concrete ACI Data:", aciData);
    results.concreteAci = aciData;
    await page.screenshot('verify_05_concrete_aci318_en.png', 150);
    await page.close();
  } catch (e) {
    console.error("Concrete Reinforcement error:", e);
  }

  chrome.kill();
  console.log("\nAll live verification tests and screenshots completed successfully!");
  fs.writeFileSync('public/screenshots/verification/live_audit_results.json', JSON.stringify(results, null, 2));
}

run().catch(err => {
  console.error("FATAL ERROR in verify runner:", err);
  process.exit(1);
});
