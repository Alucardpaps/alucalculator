import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

const artifactDir = 'C:\\Users\\apo_q\\.gemini\\antigravity\\brain\\a1a6defd-f3ed-48e2-9096-fb0c1e87e8f6';
const bundleDir = path.join(rootDir, 'alucalc_audit_bundle');
const bundleScreensDir = path.join(bundleDir, 'screenshots');

// Ensure clean bundle directory
if (fs.existsSync(bundleDir)) {
  fs.rmSync(bundleDir, { recursive: true, force: true });
}
fs.mkdirSync(bundleScreensDir, { recursive: true });

console.log('1. Copying screenshots to bundle...');
const artifactScreensDir = path.join(artifactDir, 'screenshots');
let screenCount = 0;
if (fs.existsSync(artifactScreensDir)) {
  const files = fs.readdirSync(artifactScreensDir);
  for (const f of files) {
    if (f.endsWith('.png') || f.endsWith('.jpg') || f.endsWith('.webp')) {
      fs.copyFileSync(path.join(artifactScreensDir, f), path.join(bundleScreensDir, f));
      screenCount++;
    }
  }
}
console.log(`Copied ${screenCount} screenshots into bundle.`);

console.log('2. Preparing relative-path Markdown reports...');
const fullReportPath = path.join(artifactDir, 'ALUCALC_COMPLETE_CALCULATOR_AUDIT_REPORT.md');
const execSummaryPath = path.join(artifactDir, 'ALUCALC_EXECUTIVE_AUDIT_SUMMARY.md');

let fullReportContent = fs.readFileSync(fullReportPath, 'utf8');
let execSummaryContent = fs.readFileSync(execSummaryPath, 'utf8');

// Replace absolute artifact paths with relative paths
const absRegex = new RegExp('C:/Users/apo_q/\\.gemini/antigravity/brain/a1a6defd-f3ed-48e2-9096-fb0c1e87e8f6/screenshots/', 'g');
fullReportContent = fullReportContent.replace(absRegex, './screenshots/');
execSummaryContent = execSummaryContent.replace(absRegex, './screenshots/');

fs.writeFileSync(path.join(bundleDir, 'ALUCALC_COMPLETE_CALCULATOR_AUDIT_REPORT.md'), fullReportContent, 'utf8');
fs.writeFileSync(path.join(bundleDir, 'ALUCALC_EXECUTIVE_AUDIT_SUMMARY.md'), execSummaryContent, 'utf8');

console.log('3. Generating standalone HTML report (ALUCALC_AUDIT_REPORT.html)...');
// Quick markdown to HTML converter for offline viewing
function simpleMarkdownToHtml(md) {
  let html = md
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^#### (.*$)/gim, '<h4>$1</h4>')
    .replace(/^\> (.*$)/gim, '<blockquote>$1</blockquote>')
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/gim, '<em>$1</em>')
    .replace(/\`([^`]+)\`/gim, '<code>$1</code>')
    .replace(/!\[(.*?)\]\((.*?)\)/gim, '<div class="img-box"><img src="$2" alt="$1" /><div class="img-caption">$1</div></div>')
    .replace(/\[(.*?)\]\((.*?)\)/gim, '<a href="$2" target="_blank">$1</a>')
    .replace(/\n\n/gim, '</p><p>');

  return html;
}

const htmlDoc = `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AluCalc OS — Kapsamlı Hesaplayıcı & Mühendislik Denetim Raporu</title>
  <style>
    :root {
      --bg-0: #07090c;
      --bg-1: #0c1016;
      --bg-2: #121821;
      --bg-3: #18202b;
      --line: #243041;
      --line-strong: #334155;
      --alu: #c5cdd6;
      --alu-dim: #8b96a4;
      --ink: #e7edf4;
      --muted: #8a96a6;
      --cyan: #3ad0e6;
      --cyan-dim: #1a8fa3;
      --ok: #3dd68c;
      --warn: #e6b84a;
      --bad: #e85d5d;
      --std: #7aa2ff;
      --font-ui: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      --font-mono: "JetBrains Mono", "Courier New", monospace;
    }
    body {
      background-color: var(--bg-0);
      color: var(--ink);
      font-family: var(--font-ui);
      line-height: 1.6;
      margin: 0;
      padding: 40px 20px;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: var(--bg-1);
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 40px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.5);
    }
    h1 {
      color: var(--cyan);
      font-size: 2.2rem;
      border-bottom: 2px solid var(--line-strong);
      padding-bottom: 16px;
      margin-top: 0;
      letter-spacing: -0.5px;
    }
    h2 {
      color: var(--alu);
      font-size: 1.5rem;
      border-bottom: 1px solid var(--line);
      padding-bottom: 10px;
      margin-top: 40px;
    }
    h3 {
      color: var(--cyan);
      font-size: 1.25rem;
      margin-top: 30px;
    }
    h4 {
      color: var(--alu-dim);
      font-size: 1.05rem;
      margin-top: 20px;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    blockquote {
      background: var(--bg-2);
      border-left: 4px solid var(--cyan);
      margin: 20px 0;
      padding: 12px 20px;
      color: var(--alu);
    }
    code {
      background: var(--bg-3);
      color: var(--cyan);
      font-family: var(--font-mono);
      padding: 2px 6px;
      border-radius: 4px;
      border: 1px solid var(--line);
      font-size: 0.9em;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 25px 0;
      background: var(--bg-2);
      border: 1px solid var(--line);
      font-size: 0.92rem;
    }
    th, td {
      padding: 12px 14px;
      text-align: left;
      border: 1px solid var(--line);
    }
    th {
      background: var(--bg-3);
      color: var(--cyan);
      font-weight: 600;
    }
    tr:nth-child(even) {
      background: rgba(255,255,255,0.02);
    }
    a {
      color: var(--std);
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
    .img-box {
      margin: 24px 0;
      background: var(--bg-2);
      border: 1px solid var(--line);
      border-radius: 6px;
      padding: 12px;
      text-align: center;
    }
    .img-box img {
      max-width: 100%;
      height: auto;
      border-radius: 4px;
      border: 1px solid var(--line);
    }
    .img-caption {
      margin-top: 8px;
      font-size: 0.85rem;
      color: var(--muted);
      font-family: var(--font-mono);
    }
    hr {
      border: none;
      border-top: 1px solid var(--line);
      margin: 40px 0;
    }
    .badge-pass {
      color: var(--ok);
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="container">
    ${simpleMarkdownToHtml(fullReportContent)}
  </div>
</body>
</html>`;

fs.writeFileSync(path.join(bundleDir, 'ALUCALC_AUDIT_REPORT.html'), htmlDoc, 'utf8');

console.log('4. Creating README.txt...');
const readmeContent = `================================================================================
ALUCALC OS — KAPSAMLI HESAPLAYICI VE MÜHENDİSLİK ÇÖZÜCÜ DENETİM PAKETİ
================================================================================

Platform: AluCalc OS (https://alucalculator.com)
Tarih: 2 Ekim 2026
Doğrulama Statüsü: %100 Deterministik Çözücü Mimarisi (PASS)

BU PAKETİN İÇERİĞİ:
-------------------
1. ALUCALC_AUDIT_REPORT.html
   - Çift tıklayarak herhangi bir tarayıcıda (Chrome, Edge, Safari, Firefox)
     doğrudan açabileceğiniz, tüm tabloları, formülleri ve 296 ekran görüntüsünü
     içeren eksiksiz ve görselleştirilmiş ana denetim raporudur.

2. ALUCALC_COMPLETE_CALCULATOR_AUDIT_REPORT.md
   - 2.370 satırlık eksiksiz teknik Markdown raporu.
   - 86 kanonik hesaplayıcının tüm formülleri, ISO/DIN/VDI standart maddeleri,
     giriş ve çıkış parametreleri ve test statüleri.

3. ALUCALC_EXECUTIVE_AUDIT_SUMMARY.md
   - Yönetici ve denetim kurulu için hazırlanmış yüksek seviyeli özet matrisi.

4. screenshots/
   - 296 adet yüksek çözünürlüklü (1920x1080 ve 1440x900) PNG ekran görüntüsü.
   - Her çözücünün gerçek çalışma ekranı, 3D CAD montaj görünümü, FEA stres
     ağı ve hesaplama sonuçları yer alır.

DENETİM KAPSAMI:
----------------
* Sütun 1: CAD, 3D Geometri & Tasarım Stüdyoları (8 Araç)
* Sütun 2: Mekanik Çözücüler (16 Araç — ISO 281, ISO 6336, VDI 2230, DIN 743, DIN 6885, DIN 7190, vb.)
* Sütun 3: Malzeme Bilimi, Yapısal Mukavemet & İmalat (21 Araç — Eurocode 2/3, ISO 286, DIN 6935, AISC)
* Sütun 4: Akışkanlar Mekaniği, Termal & Güç (16 Araç — Darcy-Weisbach, ASME VIII, IEEE 141, IEC 60287)
* Sütun 5: Mühendislik Bilimi, Fizik & Teori (22 Araç — ASTM E140, ASTM E466, MIL-HDBK-217F, Weibull)
* Sütun 6: Platform, Saha Sensörleri (34 Sensör) & Akademi (15 Ünite)

Telif Hakkı (C) 2026 AluCalc OS. Tüm Hakları Saklıdır.
`;
fs.writeFileSync(path.join(bundleDir, 'README.txt'), readmeContent, 'utf8');

console.log('5. Compressing into ALUCALC_AUDIT_REPORT_FULL.zip with NanaZip/7z...');
const zipName = 'ALUCALC_AUDIT_REPORT_FULL.zip';
const zipPathRoot = path.join(rootDir, zipName);
const zipPathArtifact = path.join(artifactDir, zipName);

// Remove existing zips if any
if (fs.existsSync(zipPathRoot)) fs.unlinkSync(zipPathRoot);
if (fs.existsSync(zipPathArtifact)) fs.unlinkSync(zipPathArtifact);

// Use 7z to create zip
const cmd = `7z.exe a -tzip -mx5 "${zipPathRoot}" "${bundleDir}\\*"`;
console.log(`Executing: ${cmd}`);
execSync(cmd, { stdio: 'inherit' });

console.log('6. Copying ZIP to artifact directory...');
fs.copyFileSync(zipPathRoot, zipPathArtifact);

const stat = fs.statSync(zipPathRoot);
console.log(`ZIP created successfully! Size: ${(stat.size / (1024 * 1024)).toFixed(2)} MB`);
console.log(`Root: ${zipPathRoot}`);
console.log(`Artifact: ${zipPathArtifact}`);
