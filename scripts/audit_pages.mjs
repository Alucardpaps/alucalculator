import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';
import os from 'os';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:3000';
const DEBUG_PORT = 9222;
const USER_DATA_DIR = path.join(os.tmpdir(), 'alucalc-chrome-audit-' + Date.now());

// Helper: HTTP GET as JSON
function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

// Helper: Sleep
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function runAudit() {
  console.log('--- Starting AluCalc OS Page & Feature Console Audit ---');

  // Discover routes from src/app
  const appRoutes = [];
  function scanDir(dir, base = '') {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (entry.name.startsWith('_') || entry.name.startsWith('.')) continue;
        scanDir(path.join(dir, entry.name), path.join(base, entry.name));
      } else if (entry.name === 'page.tsx' || entry.name === 'page.jsx') {
        let route = '/' + base.replace(/\\/g, '/');
        if (route.length > 1 && route.endsWith('/')) route = route.slice(0, -1);
        if (!route.includes('[')) { // only concrete routes
          appRoutes.push(route);
        }
      }
    }
  }
  scanDir('./src/app');

  // Discover calculator routes from calculatorHubData.ts
  const hubContent = fs.readFileSync('./src/data/calculatorHubData.ts', 'utf8');
  const pathMatches = [...hubContent.matchAll(/path:\s*['"]([^'"]+)['"]/g)].map(m => m[1]);
  const uniqueHubRoutes = [...new Set(pathMatches)];

  const allRoutes = [
    '/',
    ...appRoutes.filter(r => r !== '/'),
    ...uniqueHubRoutes.filter(r => !appRoutes.includes(r)),
  ];

  console.log(`Discovered ${allRoutes.length} distinct routes to audit.`);

  // Launch Chrome
  console.log('Launching headless Chrome...');
  const chromeProcess = spawn(CHROME_PATH, [
    `--remote-debugging-port=${DEBUG_PORT}`,
    `--user-data-dir=${USER_DATA_DIR}`,
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-background-networking',
    '--disable-sync',
    '--mute-audio',
    '--window-size=1440,900',
    'about:blank'
  ], { stdio: 'ignore' });

  // Wait for remote debugging to be ready
  let wsUrl = null;
  for (let i = 0; i < 30; i++) {
    try {
      const targets = await fetchJson(`http://localhost:${DEBUG_PORT}/json`);
      if (targets && targets.length > 0) {
        const pageTarget = targets.find(t => t.type === 'page');
        if (pageTarget && pageTarget.webSocketDebuggerUrl) {
          wsUrl = pageTarget.webSocketDebuggerUrl;
          break;
        }
      }
    } catch (e) {
      // not ready yet
    }
    await sleep(300);
  }

  if (!wsUrl) {
    chromeProcess.kill();
    throw new Error('Failed to connect to Chrome DevTools endpoint');
  }

  console.log('Connected to Chrome DevTools endpoint:', wsUrl);

  const ws = new WebSocket(wsUrl);
  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });

  let messageId = 1;
  const pendingRequests = new Map();

  function sendCommand(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = messageId++;
      pendingRequests.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  let currentLogs = [];
  let currentErrors = [];
  let currentWarnings = [];
  let networkErrors = [];

  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);
      if (msg.id && pendingRequests.has(msg.id)) {
        const { resolve, reject } = pendingRequests.get(msg.id);
        pendingRequests.delete(msg.id);
        if (msg.error) reject(msg.error);
        else resolve(msg.result);
        return;
      }

      // Event listener
      if (msg.method === 'Runtime.consoleAPICalled') {
        const type = msg.params.type;
        const text = (msg.params.args || []).map(a => a.value ?? a.description ?? '').join(' ');
        currentLogs.push({ type, text });
        if (type === 'error') currentErrors.push(text);
        if (type === 'warning') currentWarnings.push(text);
      } else if (msg.method === 'Runtime.exceptionThrown') {
        const desc = msg.params.exceptionDetails?.exception?.description || msg.params.exceptionDetails?.text || 'Uncaught exception';
        currentErrors.push(`[EXCEPTION] ${desc}`);
      } else if (msg.method === 'Log.entryAdded') {
        const entry = msg.params.entry;
        if (entry.level === 'error') currentErrors.push(`[LOG ERROR] ${entry.text}`);
        if (entry.level === 'warning') currentWarnings.push(`[LOG WARN] ${entry.text}`);
      } else if (msg.method === 'Network.responseReceived') {
        const status = msg.params.response.status;
        const url = msg.params.response.url;
        if (status >= 400 && !url.includes('/favicon.ico')) {
          networkErrors.push(`${status} - ${url}`);
        }
      }
    } catch (e) {
      console.error('Error handling WS message:', e);
    }
  };

  // Enable CDP domains
  await sendCommand('Page.enable');
  await sendCommand('Runtime.enable');
  await sendCommand('Log.enable');
  await sendCommand('Network.enable');

  const report = [];

  // Audit each route
  for (let i = 0; i < allRoutes.length; i++) {
    const route = allRoutes[i];
    const fullUrl = `${BASE_URL}${route}`;
    currentLogs = [];
    currentErrors = [];
    currentWarnings = [];
    networkErrors = [];

    process.stdout.write(`[${i + 1}/${allRoutes.length}] Testing ${route}... `);

    try {
      await sendCommand('Page.navigate', { url: fullUrl });
      // Wait for page load and initial hydration/renders
      await sleep(1500);

      // Filter out benign HMR/React DevTools messages
      const filteredErrors = currentErrors.filter(e => 
        !e.includes('favicon.ico')
      );
      const filteredWarnings = currentWarnings.filter(w => 
        !w.includes('React DevTools') &&
        !w.includes('[HMR]')
      );

      const hasIssues = filteredErrors.length > 0 || filteredWarnings.length > 0 || networkErrors.length > 0;

      if (hasIssues) {
        console.log(`⚠️ ISSUES FOUND (${filteredErrors.length} errors, ${filteredWarnings.length} warnings, ${networkErrors.length} net errors)`);
      } else {
        console.log('✅ CLEAN');
      }

      report.push({
        route,
        errors: filteredErrors,
        warnings: filteredWarnings,
        networkErrors: [...networkErrors]
      });
    } catch (err) {
      console.log(`❌ FAILED TO LOAD: ${err.message}`);
      report.push({
        route,
        errors: [`Page load failed: ${err.message}`],
        warnings: [],
        networkErrors: []
      });
    }
  }

  // Cleanup
  ws.close();
  chromeProcess.kill();
  try {
    fs.rmSync(USER_DATA_DIR, { recursive: true, force: true });
  } catch (e) {}

  // Write report
  fs.writeFileSync('./audit_results.json', JSON.stringify(report, null, 2), 'utf8');

  // Summary
  const withErrors = report.filter(r => r.errors.length > 0);
  const withWarnings = report.filter(r => r.warnings.length > 0);
  const withNetErrors = report.filter(r => r.networkErrors.length > 0);

  console.log('\n========================================');
  console.log('AUDIT SUMMARY');
  console.log(`Total Routes Tested: ${report.length}`);
  console.log(`Routes with Errors: ${withErrors.length}`);
  console.log(`Routes with Warnings: ${withWarnings.length}`);
  console.log(`Routes with Network Failures: ${withNetErrors.length}`);
  console.log('========================================\n');

  if (withErrors.length > 0) {
    console.log('--- ROUTES WITH ERRORS ---');
    withErrors.forEach(r => {
      console.log(`\nRoute: ${r.route}`);
      r.errors.forEach(e => console.log(`  ❌ ${e.slice(0, 160)}`));
    });
  }

  if (withWarnings.length > 0) {
    console.log('\n--- ROUTES WITH WARNINGS ---');
    withWarnings.forEach(r => {
      console.log(`\nRoute: ${r.route}`);
      r.warnings.forEach(w => console.log(`  ⚠️ ${w.slice(0, 160)}`));
    });
  }

  if (withNetErrors.length > 0) {
    console.log('\n--- ROUTES WITH NETWORK 4xx/5xx ---');
    withNetErrors.forEach(r => {
      console.log(`\nRoute: ${r.route}`);
      r.networkErrors.forEach(n => console.log(`  🌐 ${n}`));
    });
  }
}

runAudit().catch(err => {
  console.error('Audit fatal error:', err);
  process.exit(1);
});
