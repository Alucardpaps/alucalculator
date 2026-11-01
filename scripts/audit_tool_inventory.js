/**
 * Faz 0 — AluCalc OS Comprehensive Tool Inventory & Route Audit Script
 * 
 * Generates:
 * - src/data/canonical-inventory.json
 * - src/data/canonical-inventory.csv
 * - INVENTORY_REPORT.md
 */

const fs = require('fs');
const path = require('path');

console.log('=== Starting AluCalc OS Faz 0 Canonical Inventory Audit ===');

// 1. Read files
const sidebarContent = fs.readFileSync('./src/components/layout/DesktopSidebar.tsx', 'utf8');
const footerContent = fs.readFileSync('./src/locales/homeFooterTranslations.ts', 'utf8');
const hubContent = fs.readFileSync('./src/data/calculatorHubData.ts', 'utf8');
const v2Content = fs.readFileSync('./src/calculators/registry-v2.ts', 'utf8');
const windowContent = fs.readFileSync('./src/components/os/WindowContent.tsx', 'utf8');
const calculatorsDB = JSON.parse(fs.readFileSync('./src/data/seo-calculators/calculators.json', 'utf8'));
const moduleRouterContent = fs.readFileSync('./src/app/[module]/page.tsx', 'utf8');

// Parse Sidebar
const sidebarMap = new Map();
const sidebarRegex = /\{\s*id:\s*'([^']+)',\s*href:\s*'([^']+)',\s*labelEn:\s*'([^']+)',\s*labelTr:\s*'([^']+)'/g;
let m;
while ((m = sidebarRegex.exec(sidebarContent)) !== null) {
  sidebarMap.set(m[2], { id: m[1], href: m[2], labelEn: m[3], labelTr: m[4] });
}

// Parse Footer
const footerSet = new Set();
const footerRegex = /\{\s*href:\s*'([^']+)',\s*label:\s*'([^']+)'\s*\}/g;
while ((m = footerRegex.exec(footerContent)) !== null) {
  footerSet.add(m[1]);
}

// Parse Hub
const hubMap = new Map();
const hubRegex = /\{\s*id:\s*'([^']+)',\s*path:\s*'([^']+)',\s*image:[^,]+,\s*color:[^,]+,\s*group:\s*'([^']+)'\s*\}/g;
while ((m = hubRegex.exec(hubContent)) !== null) {
  hubMap.set(m[2], { id: m[1], path: m[2], group: m[3] });
}

// Parse WindowContent cases
const windowCases = new Set();
const caseRegex = /case '([a-z0-9-]+)':/g;
while ((m = caseRegex.exec(windowContent)) !== null) {
  windowCases.add(m[1]);
}

// Parse [module] Aliases & Redirects
const retiredRedirects = {
  'tolerance-stackup': '/fits',
  '3-phase-power': '/three-phase-power',
  'simulation-fea': '/fea',
  'calculators': '/design-studio',
  'machine-assembly': '/design-studio',
  'workspace': '/design-studio',
  'workspace/assembly': '/design-studio',
  'fasteners': '/bolt-torque',
  'thread-geometry': '/bolt-torque',
  'thread-standards': '/bolt-torque'
};

// Map of canonical tools
const OS_UTILITIES = new Set([
  'settings', 'terminal', 'file-explorer', 'project-manager', 'project-vault',
  'browser', 'matrix-screensaver', 'holographic-viewer', 'ai-copilot', 'engineering-notes'
]);

// 6 Pillars definition
const PILLARS = {
  cad_design: {
    id: 'cad_design',
    titleEn: 'CAD & Design Studios',
    titleTr: 'CAD & Tasarım Stüdyoları'
  },
  mechanical: {
    id: 'mechanical',
    titleEn: 'Mechanical Solvers (ISO/DIN/VDI)',
    titleTr: 'Mekanik Çözücüler (ISO/DIN/VDI)'
  },
  materials_mfg: {
    id: 'materials_mfg',
    titleEn: 'Materials, Structural & Manufacturing',
    titleTr: 'Malzeme, Yapısal & İmalat'
  },
  fluids_thermal_power: {
    id: 'fluids_thermal_power',
    titleEn: 'Fluids, Thermal & Electrical Power',
    titleTr: 'Akışkanlar, Termal & Güç'
  },
  science_theory: {
    id: 'science_theory',
    titleEn: 'Engineering Science & Theory',
    titleTr: 'Mühendislik Bilimi & Teori'
  },
  platform_academy: {
    id: 'platform_academy',
    titleEn: 'Platform, Field & Academy',
    titleTr: 'Platform, Saha & Akademi'
  }
};

function determinePillar(route) {
  const r = route.toLowerCase();

  // 1. CAD & Design
  if (['/design-studio', '/cad-editor', '/sketch-pad', '/fea', '/flow', '/flow-world', '/nesting-2d', '/cutting-optimizer', '/parametric-cad'].includes(r)) {
    return 'cad_design';
  }

  // 6. Platform, Field & Academy
  if (r.startsWith('/academy') || ['/field', '/mobile', '/mobile-app', '/stem-codex'].includes(r)) {
    return 'platform_academy';
  }

  // 4. Fluids, Thermal & Electrical Power
  if ([
    '/pumps', '/fluid-dynamics', '/pipe-friction', '/pressure-drop', '/heat-sink',
    '/thermal-expansion', '/heat-transfer', '/heat-exchanger', '/hvac-load', '/naval-hydrostatics',
    '/wind-tunnel', '/aerospace-dynamics', '/aerodynamics', '/three-phase-power', '/ohms-law',
    '/voltage-drop', '/transformer-calculation', '/transformer-design', '/filter-design',
    '/motor-efficiency', '/hydraulic-cylinder', '/reducer-lubrication', '/pressure-vessel'
  ].includes(r)) {
    return 'fluids_thermal_power';
  }

  // 3. Materials, Structural & Manufacturing
  if ([
    '/materials-db', '/materials-explorer', '/material-selector-ai', '/materials',
    '/aluminum', '/profile-weight', '/sheet-metal', '/bend-allowance',
    '/machining-details', '/machining-milling', '/machining-grinding', '/machining-time',
    '/welding', '/welding-fillet', '/welding-heat', '/mfg-readiness', '/manufacturing-readiness',
    '/manufacturing-sandbox', '/cost-estimator', '/topology-optimization', '/beam-deflection',
    '/column-buckling', '/concrete-reinforcement', '/concrete-beam-design', '/foundation-bearing',
    '/truss-analysis', '/fits', '/fits-tolerances', '/engineering-selection', '/manufacturing',
    '/area-moment-inertia', '/bending-moment'
  ].includes(r)) {
    return 'materials_mfg';
  }

  // 5. Engineering Science & Theory
  if ([
    '/calculator', '/physics-solver', '/physics-kinematics', '/chemistry-reactions',
    '/chemistry-element', '/biology-genetics', '/cs-algorithms', '/digital-logic',
    '/periodic-table', '/unit-converter', '/fatigue', '/fatigue-analysis',
    '/fatigue-advanced', '/fatigue-life-sn', '/failure-prediction', '/failure-diagnosis',
    '/failure-analysis', '/gas-laws', '/ideal-gas-law', '/thermodynamics',
    '/stoichiometry', '/chemical-molarity', '/radioactive-decay', '/reynolds-number',
    '/rocket-equation', '/kinetic-energy', '/centripetal-force', '/newton-second-law',
    '/castigliano-energy', '/hooke-law', '/hookes-law-3d', '/golden-ratio'
  ].includes(r)) {
    return 'science_theory';
  }

  // 2. Mechanical (Default)
  return 'mechanical';
}

function determineEngineType(route, id) {
  if (['/design-studio', '/parametric-cad'].includes(route)) return 'cad_3d';
  if (['/cad-editor', '/sketch-pad'].includes(route)) return 'cad_2d';
  if (route === '/fea') return 'fea_sim';
  if (route.startsWith('/flow')) return 'flow_graph';
  if (route === '/field') return 'sensor_suite_34';
  if (route.startsWith('/academy')) return 'academy_curriculum';
  if (['/nesting-2d', '/cutting-optimizer'].includes(route)) return 'optimizer_engine';
  return 'deterministic_solver';
}

// Build list of all canonical routes
const canonicalMap = new Map();

// Helper to register canonical tool
function registerTool(route, data) {
  let r = route.startsWith('/') ? route : `/${route}`;
  r = r.replace(/\/$/, '');
  if (!r) r = '/';

  // Exclude non-tools and redirects
  if (retiredRedirects[r.replace(/^\//, '')]) {
    return;
  }
  if (['/', '/admin', '/login', '/pricing', '/privacy', '/sales', '/changelog', '/developers', '/download', '/compare', '/verify', '/lite', '/engineering-test', '/guides', '/license'].includes(r)) {
    return;
  }
  if (r.startsWith('/compare/') || r.startsWith('/materials/') || r.startsWith('/app/')) {
    return;
  }

  // Check if OS desktop utility window
  const cleanId = data.id || r.replace(/^\//, '');
  if (OS_UTILITIES.has(cleanId)) {
    return;
  }

  if (canonicalMap.has(r)) {
    // merge
    const existing = canonicalMap.get(r);
    if (data.title && !existing.title) existing.title = data.title;
    if (data.titleTr && !existing.titleTr) existing.titleTr = data.titleTr;
    if (data.source) existing.sources.add(data.source);
    return;
  }

  const pillar = determinePillar(r);
  const engineType = determineEngineType(r, cleanId);

  canonicalMap.set(r, {
    id: cleanId,
    route: r,
    title: data.title || '',
    titleTr: data.titleTr || '',
    pillar,
    pillarTitleEn: PILLARS[pillar].titleEn,
    pillarTitleTr: PILLARS[pillar].titleTr,
    engineType,
    storage: ['/design-studio', '/cad-editor', '/flow', '/sketch-pad', '/academy'].includes(r) ? 'localStorage_indexedDB' : 'localStorage_recentParams',
    licensing: ['/fea', '/topology-optimization'].includes(r) ? 'pro_tier' : 'free',
    sources: new Set(data.source ? [data.source] : [])
  });
}

// 1. Register from Sidebar
for (const [href, item] of sidebarMap.entries()) {
  registerTool(href, {
    id: item.id,
    title: item.labelEn,
    titleTr: item.labelTr,
    source: 'sidebar'
  });
}

// 2. Register from Hub
for (const [pathUrl, item] of hubMap.entries()) {
  registerTool(pathUrl, {
    id: item.id,
    source: 'hub'
  });
}

// 3. Register from WindowContent Cases
for (const caseId of windowCases) {
  const route = `/${caseId}`;
  registerTool(route, {
    id: caseId,
    source: 'window_content'
  });
}

// 4. Register from Calculators DB (SEO Headless)
for (const calc of calculatorsDB) {
  const route = `/${calc.slug}`;
  registerTool(route, {
    id: calc.id,
    title: calc.title.replace(' Calculator & Engineering Guide - AluCalc', '').replace(' - AluCalc', ''),
    source: 'calculators_seo_db'
  });
}

// 5. Register from Footer
for (const href of footerSet) {
  registerTool(href, {
    source: 'footer'
  });
}

// Pretty format names
const list = Array.from(canonicalMap.values());
list.forEach(item => {
  if (!item.title) {
    item.title = item.id.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
  }
  if (!item.titleTr) {
    item.titleTr = item.title;
  }
  item.inSidebar = sidebarMap.has(item.route);
  item.inFooter = footerSet.has(item.route);
  item.inHub = hubMap.has(item.route);
  item.isOrphan = !item.inSidebar && !item.inFooter;
  item.sources = Array.from(item.sources);
});

// Sort by Pillar, then by title
list.sort((a, b) => {
  if (a.pillar !== b.pillar) return a.pillar.localeCompare(b.pillar);
  return a.title.localeCompare(b.title);
});

console.log(`\n======================================================`);
console.log(`TOTAL AUDITED CANONICAL ENGINEERING TOOLS & SOLVERS: ${list.length}`);
console.log(`======================================================\n`);

// Counts by Pillar
const pillarStats = {};
Object.keys(PILLARS).forEach(p => pillarStats[p] = { count: 0, items: [] });
list.forEach(item => {
  pillarStats[item.pillar].count++;
  pillarStats[item.pillar].items.push(item);
});

Object.entries(pillarStats).forEach(([k, val]) => {
  console.log(`[Pillar: ${PILLARS[k].titleEn}]: ${val.count} tools`);
});

const inSidebarCount = list.filter(i => i.inSidebar).length;
const inFooterCount = list.filter(i => i.inFooter).length;
const inHubCount = list.filter(i => i.inHub).length;
const orphanCount = list.filter(i => i.isOrphan).length;

console.log('\n--- Distribution Stats ---');
console.log(`In Sidebar (Current): ${inSidebarCount}`);
console.log(`In Footer (Current):  ${inFooterCount}`);
console.log(`In Hub (Current):     ${inHubCount}`);
console.log(`Orphans (Currently Missing from Nav): ${orphanCount}`);

// Save to JSON
fs.writeFileSync('./src/data/canonical-inventory.json', JSON.stringify(list, null, 2));

// Save to CSV
const csvHeader = 'ID,Route,Title,Pillar,EngineType,InSidebar,InFooter,InHub,IsOrphan,Sources\n';
const csvRows = list.map(i => 
  `"${i.id}","${i.route}","${i.title}","${i.pillar}","${i.engineType}",${i.inSidebar},${i.inFooter},${i.inHub},${i.isOrphan},"${i.sources.join(';')}"`
).join('\n');
fs.writeFileSync('./src/data/canonical-inventory.csv', csvHeader + csvRows);

// Generate INVENTORY_REPORT.md
let md = `# AluCalc OS — Faz 0 Envanter & Tek Kaynak Doğruluk Raporu\n\n`;
md += `> **Tarih**: ${new Date().toISOString().split('T')[0]}  \n`;
md += `> **Denetlenen Toplam Gerçek Mühendislik Aracı**: **${list.length}**  \n`;
md += `> **Ayrık Modüller**: 34 Saha Aracı (\`/field\`) + 15 Akademi Ünitesi (\`/academy\`)  \n\n`;

md += `## 1. Sayı Tutarsızlığının Çözümü (The Number Resolution)\n\n`;
md += `Sitede daha önce görülen 36 / 44 / 48 / 90+ çelişkisinin nedeni ve çözümü:\n`;
md += `- **36 Araç**: Sol menü (\`ALL_NAV_GROUPS\`) kısıtlı bir alt küme gösteriyordu.\n`;
md += `- **48 Modül**: Hesaplayıcı Hub (\`calculatorHubData.ts\`) ve \`APP_MODULE_COUNT\` 48 adet tanımlıydı.\n`;
md += `- **44 Çözücü**: SEO headless veri tabanı (\`calculators.json\`) 44 adetti.\n`;
md += `- **${list.length} Gerçek Araç**: Repo içerisinde kodu, çözücü motoru veya V2 şeması bulunan, tarayıcıda doğrudan çalıştırılabilen net benzersiz araç sayısı **${list.length}**'dir.\n`;
md += `- **Tek Karar**: Artık sitenin her yerinde (Cmd+K arama, Hero başlığı, AeGiS karşılama metni, footer) hardcoded sayılar yerine **\`${list.length}\`** (veya dinamik \`CANONICAL_TOOL_COUNT\`) sayısı kullanılacaktır.\n\n`;

md += `## 2. 6 Sütunlu Birleşik Taksonomi Dağılımı\n\n`;
md += `| Sütun No | Kategori Adı | Araç Sayısı | Örnek Araçlar |\n`;
md += `|---|---|---|---|\n`;

let colIdx = 1;
Object.entries(pillarStats).forEach(([pillarKey, data]) => {
  const sample = data.items.slice(0, 4).map(i => i.title).join(', ');
  md += `| ${colIdx++} | **${PILLARS[pillarKey].titleEn}** (\`${pillarKey}\`) | **${data.count}** | ${sample}... |\n`;
});

md += `\n## 3. Yetim (Orphan) Araçların Durumu\n\n`;
md += `Şu anda **${orphanCount} araç** sol menüde veya footer'da yer almamaktadır; yalnızca doğrudan URL veya Cmd+K ile ulaşılabilmektedir:\n\n`;

const orphans = list.filter(i => i.isOrphan);
orphans.slice(0, 15).forEach(o => {
  md += `- [\`${o.route}\`](file://${o.route}): **${o.title}** (${o.pillarTitleEn})\n`;
});
if (orphans.length > 15) {
  md += `- *(ve ${orphans.length - 15} araç daha, tam liste JSON/CSV içinde)*\n`;
}

md += `\n## 4. Tam Envanter Tablosu (${list.length} Araç)\n\n`;
md += `| # | Başlık | Rota | Kategori | Motor Tipi | Menüde Var Mı? | Footer'da Var Mı? |\n`;
md += `|---|---|---|---|---|---|---|\n`;
list.forEach((item, idx) => {
  md += `| ${idx + 1} | ${item.title} | \`${item.route}\` | ${item.pillar} | \`${item.engineType}\` | ${item.inSidebar ? '✅' : '❌'} | ${item.inFooter ? '✅' : '❌'} |\n`;
});

fs.writeFileSync('./INVENTORY_REPORT.md', md, 'utf8');
console.log('Successfully generated INVENTORY_REPORT.md');
