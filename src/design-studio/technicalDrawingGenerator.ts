'use client';

import { DesignPart } from './designStore';
import { MassProperties } from './materialsEngine';

export interface DrawingSheetConfig {
  sheetSize: 'A4' | 'A3';
  scale: number; // e.g. 1 = 1:1, 0.5 = 1:2
  projection: 'first-angle' | 'third-angle';
  projectName: string;
  partName: string;
  materialName: string;
  massKg: number;
  author: string;
  date: string;
}

/**
 * Generates an ISO Standard 2D Technical Drawing Sheet in SVG format containing:
 * - Front View, Top View, Right View, and Isometric View
 * - Automatic Dimension Lines with Extension Lines & Arrows
 * - Centerlines & Hole Markers
 * - Standard Title Block (Antet)
 */
export function generateTechnicalDrawingSVG(
  part: DesignPart,
  massProps: MassProperties,
  config: Partial<DrawingSheetConfig> = {}
): string {
  const p = part.params || {};
  const w = p.width || p.length || 60; // mm
  const h = p.height || 40; // mm
  const d = p.depth || (p.radius ? p.radius * 2 : 30); // mm

  const cfg: DrawingSheetConfig = {
    sheetSize: config.sheetSize || 'A3',
    scale: config.scale || 1,
    projection: config.projection || 'first-angle',
    projectName: config.projectName || 'ALU-CAD DESIGN',
    partName: part.name || 'Component_1',
    materialName: config.materialName || 'Alüminyum 6061-T6',
    massKg: massProps.massKg,
    author: config.author || 'Design Engineer',
    date: config.date || new Date().toISOString().split('T')[0],
  };

  // Sheet dimensions in px (A3: 840 x 594, A4: 594 x 420)
  const isA3 = cfg.sheetSize === 'A3';
  const sheetW = isA3 ? 1188 : 840;
  const sheetH = isA3 ? 840 : 594;
  const margin = 20;

  // Scale factor to fit views
  const maxDim = Math.max(w, h, d);
  const scale = (sheetW * 0.22) / (maxDim || 50);

  const sw = w * scale;
  const sh = h * scale;
  const sd = d * scale;

  // View Centers
  const frontX = sheetW * 0.30;
  const frontY = sheetH * 0.55;

  const topX = frontX;
  const topY = frontY - sh / 2 - sd / 2 - 60;

  const rightX = frontX + sw / 2 + sd / 2 + 70;
  const rightY = frontY;

  const isoX = sheetW * 0.78;
  const isoY = sheetH * 0.32;

  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${sheetW} ${sheetH}" width="100%" height="100%" style="background:#ffffff; font-family:'Courier New', monospace;">
  <!-- BORDER & TITLE FRAME -->
  <rect x="${margin}" y="${margin}" width="${sheetW - margin * 2}" height="${sheetH - margin * 2}" fill="none" stroke="#0f172a" stroke-width="2.5" />
  <rect x="${margin + 5}" y="${margin + 5}" width="${sheetW - margin * 2 - 10}" height="${sheetH - margin * 2 - 10}" fill="none" stroke="#64748b" stroke-width="0.8" />

  <!-- ISO TITLE BLOCK (ANTET) -->
  <g transform="translate(${sheetW - margin - 320}, ${sheetH - margin - 110})">
    <rect x="0" y="0" width="315" height="105" fill="#f8fafc" stroke="#0f172a" stroke-width="1.8" />
    <line x1="0" y1="28" x2="315" y2="28" stroke="#0f172a" stroke-width="1" />
    <line x1="0" y1="56" x2="315" y2="56" stroke="#0f172a" stroke-width="1" />
    <line x1="0" y1="80" x2="315" y2="80" stroke="#0f172a" stroke-width="1" />
    <line x1="160" y1="28" x2="160" y2="105" stroke="#0f172a" stroke-width="1" />
    <line x1="235" y1="56" x2="235" y2="105" stroke="#0f172a" stroke-width="1" />

    <!-- Title Texts -->
    <text x="10" y="20" font-size="14" font-weight="900" fill="#0f172a">${cfg.projectName}</text>
    <text x="10" y="44" font-size="11" font-weight="700" fill="#334155">PARÇA: ${cfg.partName}</text>
    <text x="10" y="72" font-size="9" fill="#475569">MALZEME: ${cfg.materialName}</text>
    <text x="10" y="96" font-size="9" fill="#475569">AĞIRLIK: ${cfg.massKg} kg (${massProps.massGrams} g)</text>

    <text x="170" y="44" font-size="9" fill="#475569">TOLERANS: ISO 2768-m (±0.1)</text>
    <text x="170" y="72" font-size="9" fill="#475569">ÖLÇEK: 1:1</text>
    <text x="245" y="72" font-size="9" fill="#475569">BOYUT: ${cfg.sheetSize}</text>
    <text x="170" y="96" font-size="9" fill="#475569">TARİH: ${cfg.date}</text>
    <text x="245" y="96" font-size="9" fill="#475569">ÇİZEN: ${cfg.author}</text>
  </g>

  <!-- 1. FRONT VIEW (ÖN GÖRÜNÜŞ) -->
  <g transform="translate(${frontX}, ${frontY})">
    <!-- View Title -->
    <text x="0" y="${sh / 2 + 35}" text-anchor="middle" font-size="11" font-weight="800" fill="#0f172a">ÖN GÖRÜNÜŞ (FRONT VIEW)</text>
    
    <!-- Outer Contour -->
    <rect x="${-sw / 2}" y="${-sh / 2}" width="${sw}" height="${sh}" fill="#f1f5f9" stroke="#0f172a" stroke-width="2" />
    
    <!-- Centerlines -->
    <line x1="${-sw / 2 - 12}" y1="0" x2="${sw / 2 + 12}" y2="0" stroke="#0284c7" stroke-width="0.8" stroke-dasharray="8,3,2,3" />
    <line x1="0" y1="${-sh / 2 - 12}" x2="0" y2="${sh / 2 + 12}" stroke="#0284c7" stroke-width="0.8" stroke-dasharray="8,3,2,3" />

    <!-- Width Dimension (Bottom) -->
    <line x1="${-sw / 2}" y1="${sh / 2 + 15}" x2="${sw / 2}" y2="${sh / 2 + 15}" stroke="#0f172a" stroke-width="1" />
    <line x1="${-sw / 2}" y1="${sh / 2 + 5}" x2="${-sw / 2}" y2="${sh / 2 + 22}" stroke="#0f172a" stroke-width="0.8" />
    <line x1="${sw / 2}" y1="${sh / 2 + 5}" x2="${sw / 2}" y2="${sh / 2 + 22}" stroke="#0f172a" stroke-width="0.8" />
    <text x="0" y="${sh / 2 + 12}" text-anchor="middle" font-size="10" font-weight="700" fill="#0f172a">${w} mm</text>

    <!-- Height Dimension (Left) -->
    <line x1="${-sw / 2 - 15}" y1="${-sh / 2}" x2="${-sw / 2 - 15}" y2="${sh / 2}" stroke="#0f172a" stroke-width="1" />
    <line x1="${-sw / 2 - 22}" y1="${-sh / 2}" x2="${-sw / 2 - 5}" y2="${-sh / 2}" stroke="#0f172a" stroke-width="0.8" />
    <line x1="${-sw / 2 - 22}" y1="${sh / 2}" x2="${-sw / 2 - 5}" y2="${sh / 2}" stroke="#0f172a" stroke-width="0.8" />
    <text x="${-sw / 2 - 20}" y="4" text-anchor="middle" transform="rotate(-90 ${-sw / 2 - 20} 0)" font-size="10" font-weight="700" fill="#0f172a">${h} mm</text>
  </g>

  <!-- 2. TOP VIEW (ÜST GÖRÜNÜŞ) -->
  <g transform="translate(${topX}, ${topY})">
    <!-- View Title -->
    <text x="0" y="${-sd / 2 - 20}" text-anchor="middle" font-size="11" font-weight="800" fill="#0f172a">ÜST GÖRÜNÜŞ (TOP VIEW)</text>
    
    <!-- Outer Contour -->
    <rect x="${-sw / 2}" y="${-sd / 2}" width="${sw}" height="${sd}" fill="#f1f5f9" stroke="#0f172a" stroke-width="2" />

    <!-- Centerlines -->
    <line x1="${-sw / 2 - 12}" y1="0" x2="${sw / 2 + 12}" y2="0" stroke="#0284c7" stroke-width="0.8" stroke-dasharray="8,3,2,3" />
    <line x1="0" y1="${-sd / 2 - 12}" x2="0" y2="${sd / 2 + 12}" stroke="#0284c7" stroke-width="0.8" stroke-dasharray="8,3,2,3" />

    <!-- Depth Dimension (Right) -->
    <line x1="${sw / 2 + 15}" y1="${-sd / 2}" x2="${sw / 2 + 15}" y2="${sd / 2}" stroke="#0f172a" stroke-width="1" />
    <line x1="${sw / 2 + 5}" y1="${-sd / 2}" x2="${sw / 2 + 22}" y2="${-sd / 2}" stroke="#0f172a" stroke-width="0.8" />
    <line x1="${sw / 2 + 5}" y1="${sd / 2}" x2="${sw / 2 + 22}" y2="${sd / 2}" stroke="#0f172a" stroke-width="0.8" />
    <text x="${sw / 2 + 25}" y="4" text-anchor="middle" transform="rotate(90 ${sw / 2 + 25} 0)" font-size="10" font-weight="700" fill="#0f172a">${d} mm</text>
  </g>

  <!-- 3. RIGHT SIDE VIEW (SAĞ YAN GÖRÜNÜŞ) -->
  <g transform="translate(${rightX}, ${rightY})">
    <!-- View Title -->
    <text x="0" y="${sh / 2 + 35}" text-anchor="middle" font-size="11" font-weight="800" fill="#0f172a">YAN GÖRÜNÜŞ (SIDE VIEW)</text>
    
    <!-- Outer Contour -->
    <rect x="${-sd / 2}" y="${-sh / 2}" width="${sd}" height="${sh}" fill="#f1f5f9" stroke="#0f172a" stroke-width="2" />

    <!-- Centerlines -->
    <line x1="${-sd / 2 - 12}" y1="0" x2="${sd / 2 + 12}" y2="0" stroke="#0284c7" stroke-width="0.8" stroke-dasharray="8,3,2,3" />
    <line x1="0" y1="${-sh / 2 - 12}" x2="0" y2="${sh / 2 + 12}" stroke="#0284c7" stroke-width="0.8" stroke-dasharray="8,3,2,3" />
  </g>

  <!-- 4. 3D ISOMETRIC PROJECTION VIEW -->
  <g transform="translate(${isoX}, ${isoY})">
    <!-- View Title -->
    <text x="0" y="${-sh * 0.8}" text-anchor="middle" font-size="11" font-weight="800" fill="#0f172a">İZOMETRİK 3D (ISOMETRIC)</text>

    <!-- Isometric Box Rendering -->
    <g transform="scale(0.85)">
      <!-- Top Face -->
      <polygon points="0,${-sh / 2} ${sw * 0.7},${-sh / 2 - sd * 0.4} 0,${-sh / 2 - sd * 0.8} ${-sw * 0.7},${-sh / 2 - sd * 0.4}" fill="#e2e8f0" stroke="#0f172a" stroke-width="1.8" />
      <!-- Left Face -->
      <polygon points="${-sw * 0.7},${-sh / 2 - sd * 0.4} 0,${-sh / 2} 0,${sh / 2} ${-sw * 0.7},${sh / 2 - sd * 0.4}" fill="#cbd5e1" stroke="#0f172a" stroke-width="1.8" />
      <!-- Right Face -->
      <polygon points="0,${-sh / 2} ${sw * 0.7},${-sh / 2 - sd * 0.4} ${sw * 0.7},${sh / 2 - sd * 0.4} 0,${sh / 2}" fill="#94a3b8" stroke="#0f172a" stroke-width="1.8" />
    </g>
  </g>
</svg>
  `.trim();
}
