import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

// Read canonical inventory
const canonicalPath = path.join(rootDir, 'src', 'data', 'canonicalInventory.ts');
const canonicalRaw = fs.readFileSync(canonicalPath, 'utf8');

// Read module methodology
const methodPath = path.join(rootDir, 'src', 'data', 'moduleMethodology.ts');
const methodRaw = fs.readFileSync(methodPath, 'utf8');

// Parse CANONICAL_TOOLS from the file
const toolsMatch = canonicalRaw.match(/export const CANONICAL_TOOLS: readonly CanonicalToolEntry\[\] = (\[[\s\S]*?\]);/);
if (!toolsMatch) {
  console.error("Could not parse CANONICAL_TOOLS");
  process.exit(1);
}

const canonicalTools = eval(toolsMatch[1]);
console.log(`Loaded ${canonicalTools.length} canonical tools.`);

// Scan screenshots
const screenshotDir1 = path.join(rootDir, 'site_screenshots');
const screenshotDir2 = path.join(rootDir, 'screenshots');
const screens1 = fs.existsSync(screenshotDir1) ? fs.readdirSync(screenshotDir1) : [];
const screens2 = fs.existsSync(screenshotDir2) ? fs.readdirSync(screenshotDir2) : [];

console.log(`Available screenshots: ${screens1.length} in site_screenshots, ${screens2.length} in screenshots`);

// Find matching screenshot for each tool
function findScreenshots(toolId, route) {
  const matches = [];
  const cleanId = toolId.replace(/-/g, '_');
  const cleanRoute = route.replace(/^\//, '').replace(/-/g, '_');
  
  // Direct names
  for (const s of screens1) {
    const sLower = s.toLowerCase();
    if (sLower.includes(toolId) || sLower.includes(cleanId) || (cleanRoute && sLower.includes(cleanRoute))) {
      matches.push({ dir: 'site_screenshots', file: s });
    }
  }
  for (const s of screens2) {
    const sLower = s.toLowerCase();
    if (sLower.includes(toolId) || sLower.includes(cleanId) || (cleanRoute && sLower.includes(cleanRoute))) {
      matches.push({ dir: 'screenshots', file: s });
    }
  }
  return matches;
}

const results = canonicalTools.map(t => {
  const screens = findScreenshots(t.id, t.route);
  return {
    ...t,
    screenshots: screens
  };
});

const withScreens = results.filter(r => r.screenshots.length > 0);
const withoutScreens = results.filter(r => r.screenshots.length === 0);

console.log(`Tools with existing screenshots: ${withScreens.length}`);
console.log(`Tools needing screenshots: ${withoutScreens.length}`);
console.log("Missing screenshot tool routes:", withoutScreens.map(w => w.route));
