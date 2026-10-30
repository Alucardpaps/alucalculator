const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const repoRoot = path.resolve(__dirname, '..');

async function generateOgImage() {
  const imagesDir = path.join(repoRoot, 'public', 'images');
  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
  }

  const svg = `
  <svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <!-- Grid Pattern -->
      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#18202b" stroke-width="1.2" opacity="0.6"/>
        <path d="M 200 0 L 0 0 0 200" fill="none" stroke="#243041" stroke-width="1.8" opacity="0.4"/>
      </pattern>

      <!-- Glow filter -->
      <filter id="cyanGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="8" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>

      <!-- Gradients -->
      <radialGradient id="ambient" cx="80%" cy="20%" r="70%">
        <stop offset="0%" stop-color="#1a8fa3" stop-opacity="0.25"/>
        <stop offset="50%" stop-color="#0c1016" stop-opacity="0.8"/>
        <stop offset="100%" stop-color="#07090c" stop-opacity="1"/>
      </radialGradient>

      <linearGradient id="cyanLine" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#3ad0e6" />
        <stop offset="100%" stop-color="#3dd68c" />
      </linearGradient>
    </defs>

    <!-- Deep Chassis Background -->
    <rect width="1200" height="630" fill="#07090c"/>
    <rect width="1200" height="630" fill="url(#ambient)"/>
    <rect width="1200" height="630" fill="url(#grid)"/>

    <!-- Subtle Chassis Border Frame -->
    <rect x="24" y="24" width="1152" height="582" rx="8" fill="none" stroke="#243041" stroke-width="2"/>
    <rect x="28" y="28" width="1144" height="574" rx="6" fill="none" stroke="#121821" stroke-width="1"/>

    <!-- Corner Fiducial Marks (CNC Instrument Aesthetic) -->
    <path d="M 36 50 L 36 36 L 50 36" fill="none" stroke="#3ad0e6" stroke-width="2"/>
    <path d="M 1164 50 L 1164 36 L 1150 36" fill="none" stroke="#3ad0e6" stroke-width="2"/>
    <path d="M 36 580 L 36 594 L 50 594" fill="none" stroke="#3ad0e6" stroke-width="2"/>
    <path d="M 1164 580 L 1164 594 L 1150 594" fill="none" stroke="#3ad0e6" stroke-width="2"/>

    <!-- Top Status Badge -->
    <g transform="translate(80, 80)">
      <rect width="360" height="34" rx="4" fill="#0c1016" stroke="#243041" stroke-width="1.5"/>
      <circle cx="20" cy="17" r="4.5" fill="#3dd68c"/>
      <text x="36" y="22" font-family="monospace" font-size="12" font-weight="bold" fill="#3ad0e6" letter-spacing="1.5">
        ALUCALC OS · DETERMINISTIC KERNEL v5.2
      </text>
    </g>

    <!-- Engineering Watermark / Formula Graphic on Right -->
    <g transform="translate(740, 100)" opacity="0.35">
      <!-- 3D Isometric Cube / Engineering Topology Wireframe -->
      <polygon points="180,60 300,120 300,260 180,200" fill="none" stroke="#3ad0e6" stroke-width="2"/>
      <polygon points="60,120 180,60 180,200 60,260" fill="none" stroke="#7aa2ff" stroke-width="2"/>
      <polygon points="60,260 180,200 300,260 180,320" fill="none" stroke="#243041" stroke-width="1.5"/>
      <line x1="180" y1="60" x2="180" y2="200" stroke="#3ad0e6" stroke-width="1.5" stroke-dasharray="4,4"/>
      <circle cx="180" cy="60" r="4" fill="#3ad0e6"/>
      <circle cx="300" cy="120" r="4" fill="#3ad0e6"/>
      <circle cx="60" cy="120" r="4" fill="#7aa2ff"/>
      <circle cx="180" cy="200" r="5" fill="#3dd68c"/>
      <circle cx="300" cy="260" r="4" fill="#3ad0e6"/>
      <circle cx="60" cy="260" r="4" fill="#7aa2ff"/>
      <circle cx="180" cy="320" r="4" fill="#3ad0e6"/>
      <text x="180" y="380" text-anchor="middle" font-family="monospace" font-size="14" fill="#8a96a6" letter-spacing="2">ISO 281 / VDI 2230 / ISO 6336</text>
    </g>

    <!-- Brand Logo Icon -->
    <g transform="translate(80, 150)">
      <polygon points="36,6 66,22 66,54 36,70 6,54 6,22" fill="#121821" stroke="#3ad0e6" stroke-width="3" filter="url(#cyanGlow)"/>
      <polygon points="36,16 56,28 56,48 36,60 16,48 16,28" fill="none" stroke="#3dd68c" stroke-width="1.5"/>
      <text x="36" y="44" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="900" font-size="22" fill="#e7edf4">A</text>
    </g>

    <!-- Main Headline -->
    <text x="170" y="200" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="64" fill="#e7edf4" letter-spacing="-1.5">
      AluCalc <tspan fill="#3ad0e6">OS</tspan>
    </text>

    <!-- Subtitle / Tagline -->
    <text x="80" y="270" font-family="system-ui, -apple-system, sans-serif" font-weight="700" font-size="28" fill="#c5cdd6" letter-spacing="-0.5">
      Industrial Mechanical Engineering Operating System
    </text>

    <!-- Descriptive Bullets -->
    <text x="80" y="325" font-family="system-ui, -apple-system, sans-serif" font-weight="400" font-size="20" fill="#8b96a4">
      Deterministic ISO / DIN / VDI Solvers · 3D Parametric CAD · DAG Flow Engine
    </text>

    <!-- Badges Row -->
    <g transform="translate(80, 380)">
      <!-- Badge 1: VDI 2230 -->
      <g transform="translate(0, 0)">
        <rect width="130" height="36" rx="4" fill="#121821" stroke="#3ad0e6" stroke-width="1.2"/>
        <text x="65" y="23" text-anchor="middle" font-family="monospace" font-size="13" font-weight="bold" fill="#3ad0e6">VDI 2230</text>
      </g>
      <!-- Badge 2: ISO 281 -->
      <g transform="translate(145, 0)">
        <rect width="130" height="36" rx="4" fill="#121821" stroke="#7aa2ff" stroke-width="1.2"/>
        <text x="65" y="23" text-anchor="middle" font-family="monospace" font-size="13" font-weight="bold" fill="#7aa2ff">ISO 281</text>
      </g>
      <!-- Badge 3: ISO 6336 -->
      <g transform="translate(290, 0)">
        <rect width="130" height="36" rx="4" fill="#121821" stroke="#e6b84a" stroke-width="1.2"/>
        <text x="65" y="23" text-anchor="middle" font-family="monospace" font-size="13" font-weight="bold" fill="#e6b84a">ISO 6336</text>
      </g>
      <!-- Badge 4: DIN 743 -->
      <g transform="translate(435, 0)">
        <rect width="130" height="36" rx="4" fill="#121821" stroke="#3dd68c" stroke-width="1.2"/>
        <text x="65" y="23" text-anchor="middle" font-family="monospace" font-size="13" font-weight="bold" fill="#3dd68c">DIN 743</text>
      </g>
      <!-- Badge 5: AISC 360 -->
      <g transform="translate(580, 0)">
        <rect width="130" height="36" rx="4" fill="#121821" stroke="#243041" stroke-width="1.2"/>
        <text x="65" y="23" text-anchor="middle" font-family="monospace" font-size="13" font-weight="bold" fill="#8b96a4">AISC 360</text>
      </g>
    </g>

    <!-- Bottom Readout Bar -->
    <g transform="translate(80, 480)">
      <line x1="0" y1="0" x2="1040" y2="0" stroke="#243041" stroke-width="1.5"/>
      <text x="0" y="32" font-family="monospace" font-size="15" fill="#3ad0e6" font-weight="bold">
        89 CANONICAL TOOLS
      </text>
      <text x="210" y="32" font-family="monospace" font-size="15" fill="#8a96a6">
        | 64-BIT IEEE 754 PRECISION
      </text>
      <text x="510" y="32" font-family="monospace" font-size="15" fill="#8a96a6">
        | 0ms CLIENT-SIDE WASM
      </text>
      <text x="1040" y="32" text-anchor="end" font-family="monospace" font-size="15" font-weight="bold" fill="#e7edf4">
        alucalculator.com
      </text>
    </g>
  </svg>
  `;

  const outputPath = path.join(imagesDir, 'og-image.png');
  await sharp(Buffer.from(svg))
    .png({ quality: 95 })
    .toFile(outputPath);

  console.log(`[Success] Generated OpenGraph image: ${outputPath}`);
}

async function generateHandbookFatigueTheories() {
  const handbookDir = path.join(repoRoot, 'public', 'handbook');
  if (!fs.existsSync(handbookDir)) {
    fs.mkdirSync(handbookDir, { recursive: true });
  }

  const svg = `
  <svg width="800" height="500" viewBox="0 0 800 500" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <pattern id="diagGrid" width="20" height="20" patternUnits="userSpaceOnUse">
        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1c2533" stroke-width="0.8"/>
      </pattern>
    </defs>

    <!-- Background -->
    <rect width="800" height="500" fill="#0c1016"/>
    <rect width="800" height="500" fill="url(#diagGrid)"/>
    <rect x="10" y="10" width="780" height="480" rx="6" fill="none" stroke="#243041" stroke-width="1.5"/>

    <!-- Title -->
    <text x="400" y="40" text-anchor="middle" font-family="system-ui, sans-serif" font-size="20" font-weight="bold" fill="#e7edf4">
      HAIGH DIAGRAM — YORULMA KRİTERLERİ (FATIGUE THEORIES)
    </text>
    <text x="400" y="62" text-anchor="middle" font-family="monospace" font-size="12" fill="#8b96a4">
      Alternatif Gerilme (σ_a) vs Ortalama Gerilme (σ_m)
    </text>

    <!-- Origin (120, 420) -->
    <!-- Axes -->
    <line x1="120" y1="420" x2="720" y2="420" stroke="#c5cdd6" stroke-width="2"/>
    <polygon points="725,420 715,415 715,425" fill="#c5cdd6"/>
    <text x="730" y="425" font-family="monospace" font-size="14" font-weight="bold" fill="#c5cdd6">σ_m</text>

    <line x1="120" y1="420" x2="120" y2="90" stroke="#c5cdd6" stroke-width="2"/>
    <polygon points="120,85 115,95 125,95" fill="#c5cdd6"/>
    <text x="120" y="75" text-anchor="middle" font-family="monospace" font-size="14" font-weight="bold" fill="#c5cdd6">σ_a</text>

    <!-- Key Points Coordinates:
         Origin: (120, 420)
         Se (Endurance Limit) on y-axis: y = 140 (dy = 280)
         Sy (Yield Strength) on x-axis: x = 500 (dx = 380)
         Sy on y-axis: y = 100
         Sut (Ultimate Tensile) on x-axis: x = 680 (dx = 560)
    -->

    <!-- Soderberg Line: (120, 140) to (500, 420) -->
    <line x1="120" y1="140" x2="500" y2="420" stroke="#3dd68c" stroke-width="2.5"/>

    <!-- Goodman Line: (120, 140) to (680, 420) -->
    <line x1="120" y1="140" x2="680" y2="420" stroke="#3ad0e6" stroke-width="2.5"/>

    <!-- Gerber Parabola: y = 140 + 280 * (x - 120)^2 / 560^2 -->
    <!-- Path from (120,140) curving down to (680, 420) -->
    <path d="M 120,140 Q 400,160 680,420" fill="none" stroke="#e6b84a" stroke-width="2.5"/>

    <!-- ASME Elliptic: from (120, 140) to (500, 420) ellipse arc -->
    <path d="M 120,140 A 380 280 0 0 1 500,420" fill="none" stroke="#7aa2ff" stroke-width="2.5" stroke-dasharray="6,4"/>

    <!-- Yield line (Langer Static Yield Line): (120, 100) to (500, 420) -->
    <line x1="120" y1="100" x2="500" y2="420" stroke="#e85d5d" stroke-width="1.8" stroke-dasharray="4,4"/>

    <!-- Intercept Ticks and Labels -->
    <!-- Se on y -->
    <line x1="114" y1="140" x2="126" y2="140" stroke="#c5cdd6" stroke-width="2"/>
    <text x="105" y="145" text-anchor="end" font-family="monospace" font-size="13" font-weight="bold" fill="#3ad0e6">S_e</text>

    <!-- Sy on x -->
    <line x1="500" y1="414" x2="500" y2="426" stroke="#c5cdd6" stroke-width="2"/>
    <text x="500" y="445" text-anchor="middle" font-family="monospace" font-size="13" font-weight="bold" fill="#3dd68c">S_y</text>

    <!-- Sut on x -->
    <line x1="680" y1="414" x2="680" y2="426" stroke="#c5cdd6" stroke-width="2"/>
    <text x="680" y="445" text-anchor="middle" font-family="monospace" font-size="13" font-weight="bold" fill="#e6b84a">S_ut</text>

    <!-- Legend Box -->
    <g transform="translate(480, 90)">
      <rect width="280" height="150" rx="4" fill="#121821" stroke="#243041" stroke-width="1.2"/>
      
      <!-- Soderberg -->
      <line x1="20" y1="30" x2="50" y2="30" stroke="#3dd68c" stroke-width="3"/>
      <text x="60" y="34" font-family="monospace" font-size="12" fill="#e7edf4">Soderberg (Muhafazakar)</text>

      <!-- Goodman -->
      <line x1="20" y1="60" x2="50" y2="60" stroke="#3ad0e6" stroke-width="3"/>
      <text x="60" y="64" font-family="monospace" font-size="12" fill="#e7edf4">Goodman (Endüstriyel Standart)</text>

      <!-- Gerber -->
      <line x1="20" y1="90" x2="50" y2="90" stroke="#e6b84a" stroke-width="3"/>
      <text x="60" y="94" font-family="monospace" font-size="12" fill="#e7edf4">Gerber (Parabolik Deneysel)</text>

      <!-- ASME Elliptic -->
      <line x1="20" y1="120" x2="50" y2="120" stroke="#7aa2ff" stroke-width="3" stroke-dasharray="4,3"/>
      <text x="60" y="124" font-family="monospace" font-size="12" fill="#e7edf4">ASME Eliptik</text>
    </g>

    <!-- Safe Region Label -->
    <text x="240" y="360" font-family="monospace" font-size="14" font-weight="bold" fill="#3dd68c" opacity="0.8">
      ✓ GÜVENLİ BÖLGE (SAFE ZONE)
    </text>
  </svg>
  `;

  const outputPath = path.join(handbookDir, 'fatigue_theories.png');
  await sharp(Buffer.from(svg))
    .png({ quality: 95 })
    .toFile(outputPath);

  console.log(`[Success] Generated Handbook Fatigue Theories diagram: ${outputPath}`);
}

async function run() {
  await generateOgImage();
  await generateHandbookFatigueTheories();
  console.log('All missing image assets generated successfully.');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
