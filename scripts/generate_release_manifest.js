const fs = require('fs');
const path = require('path');
const child_process = require('child_process');
const pkg = require('../package.json');

const rootDir = path.join(__dirname, '..');
const invFile = path.join(rootDir, 'src', 'data', 'canonicalInventory.ts');

if (!fs.existsSync(invFile)) {
  console.error('[Release Manifest ERROR] Canonical inventory file missing at:', invFile);
  process.exit(1);
}

const content = fs.readFileSync(invFile, 'utf8');
const match = content.match(/CANONICAL_TOOL_COUNT\s*=\s*(\d+)/);
if (!match || !match[1]) {
  console.error('[Release Manifest ERROR] Could not extract CANONICAL_TOOL_COUNT from canonicalInventory.ts');
  process.exit(1);
}

const toolCount = parseInt(match[1], 10);
if (!Number.isInteger(toolCount) || toolCount <= 0) {
  console.error('[Release Manifest ERROR] Invalid CANONICAL_TOOL_COUNT parsed:', toolCount);
  process.exit(1);
}

let gitSha = 'local';
let gitCommit = 'local';
try {
  gitSha = child_process.execSync('git rev-parse --short HEAD').toString().trim();
  gitCommit = child_process.execSync('git rev-parse HEAD').toString().trim();
} catch {
  gitSha = process.env.GITHUB_SHA ? process.env.GITHUB_SHA.substring(0, 7) : 'prod';
  gitCommit = process.env.GITHUB_SHA || 'production';
}

const manifest = {
  appName: 'AluCalc OS',
  appVersion: pkg.version,
  buildId: gitSha,
  commitSha: gitCommit,
  builtAt: new Date().toISOString(),
  toolCount: toolCount,
  distribution: {
    web: {
      status: 'production_ready',
      architecture: 'static_export',
      runtime: 'client_side_wasm_worker',
      canonicalUrl: 'https://www.alucalculator.com/'
    },
    android: {
      status: 'pending_device_testing',
      packageGenerator: '@bubblewrap/cli',
      version: '6.0'
    },
    wearOs: {
      status: 'pending_device_testing',
      packageGenerator: '@bubblewrap/cli',
      version: '6.0'
    }
  },
  platforms: ['web', 'android', 'wear'],
  standards: ['ISO 281', 'ISO 6336', 'VDI 2230', 'DIN 743', 'DIN 6885', 'DIN 7190', 'ISO 286', 'EN 1993']
};

const outFile = path.join(rootDir, 'public', 'release-manifest.json');
fs.writeFileSync(outFile, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
console.log('[Release Manifest] Successfully generated SSOT manifest at public/release-manifest.json with toolCount:', toolCount);
