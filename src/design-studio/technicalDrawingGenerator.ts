'use client';

import * as THREE from 'three';
import { DesignPart, customCADGeometries } from './designStore';
import { MassProperties } from './materialsEngine';
import { createCustomGeometry } from './geometryFactory';

export type DrawingTemplateStyle = 'iso7200' | 'din' | 'blueprint' | 'minimal' | 'modern';
export type DrawingColorTheme = 'classic' | 'blueprint' | 'dark';

export interface DrawingSheetConfig {
  sheetSize: 'A4' | 'A3' | 'A2';
  scale: number; // e.g. 1 = 1:1, 0.5 = 1:2
  projection: 'first-angle' | 'third-angle';
  projectName: string;
  partName: string;
  materialName: string;
  massKg: number;
  author: string;
  approver?: string;
  date: string;
  companyName?: string;
  companySubtext?: string;
  drawingNumber?: string;
  revision?: string;
  tolerance?: string;
  surfaceFinish?: string;
  notes?: string[];
  templateStyle?: DrawingTemplateStyle;
  colorTheme?: DrawingColorTheme;
}

import { ISO_METRIC_HOLES, type HoleItem, type SurfaceCutItem, type SurfaceFace } from './holeStandards';


export interface FeatureScheduleItem {
  tag: string; // "H1", "H2", "C1", etc.
  partName: string;
  kind: 'hole' | 'cut' | 'bore';
  face: SurfaceFace;
  x: number; // mm
  y: number; // mm
  size: string; // "M6", "Ø12", "25x35"
  type: string; // "İmbus Havşalı", "Kılavuz", "Dikdörtgen Cep"
  spec: string; // "DIN 912 · Ø6.6 / Baş Ø10x6mm"
  depth: string; // "Boydan Boya (Through)" or "15.0 mm"
  diameter?: number; // mm
  radius?: number; // mm
}

export function extractFeatureSchedule(parts: DesignPart[]): FeatureScheduleItem[] {
  const items: FeatureScheduleItem[] = [];
  let holeIdx = 1;
  let cutIdx = 1;

  for (const part of parts) {
    if (!part.visible) continue;
    const p = part.params || {};

    // 1. User-defined Holes (part.holes)
    if (part.holes && part.holes.length > 0) {
      for (const h of part.holes) {
        const std = ISO_METRIC_HOLES.find((s) => s.size === h.size);
        const nomDia = std ? std.nominalDiameter : (parseFloat(h.size.replace(/[^\d.]/g, '')) || 6);
        const pitch = std ? std.coarsePitch : 1.0;
        const tapDia = std ? std.tapDrillDiameter : (nomDia - pitch);
        const cbDia = std ? std.counterboreDiameter : (nomDia * 1.8);
        const cbDepth = std ? std.counterboreDepth : (nomDia);
        const csDia = std ? std.countersinkDiameter : (nomDia * 2.0);

        let typeLabel = 'Düz Geçme (Clearance)';
        let specStr = `Ø${std ? std.clearanceMedium : nomDia} mm (H11)`;

        if (h.type === 'counterbore') {
          typeLabel = 'İmbus Havşa (DIN 912)';
          specStr = `Ø${std ? std.clearanceMedium : (nomDia + 0.6)} / Baş Ø${cbDia}x${cbDepth}mm`;
        } else if (h.type === 'tap') {
          typeLabel = 'Dişli / Kılavuz (Tap)';
          specStr = `M${nomDia}x${pitch} (Kılavuz Ø${tapDia}mm)`;
        } else if (h.type === 'countersink') {
          typeLabel = '90° Konik Havşa (DIN 7991)';
          specStr = `Ø${std ? std.clearanceMedium : nomDia} / Havşa Ø${csDia}x90°`;
        }

        const depthStr = h.isThroughAll !== false
          ? 'Boydan Boya (Through)'
          : `${h.depth || 15} mm (Kör Delik)`;

        items.push({
          tag: `H${holeIdx++}`,
          partName: part.name,
          kind: 'hole',
          face: h.face || 'top',
          x: Math.round(h.x * 10) / 10,
          y: Math.round(h.y * 10) / 10,
          size: h.size,
          type: typeLabel,
          spec: specStr,
          depth: depthStr,
          diameter: nomDia,
          radius: Math.sqrt(h.x * h.x + h.y * h.y),
        });
      }
    }

    // 2. User-defined Surface Cuts / Pockets (part.cuts)
    if (part.cuts && part.cuts.length > 0) {
      for (const c of part.cuts) {
        let typeLabel = 'Dikdörtgen Havuz (Pocket)';
        let sizeStr = `${c.width || 30}x${c.length || 40} mm`;
        let specStr = `Freze Havuzu (${c.width || 30}x${c.length || 40}mm)`;

        if (c.type === 'circle') {
          typeLabel = 'Dairesel Boşaltma';
          sizeStr = `Ø${c.diameter || 25} mm`;
          specStr = `Silindirik Havuz (Ø${c.diameter || 25}mm)`;
        } else if (c.type === 'slot') {
          typeLabel = 'Freze Slot Kanalı';
          sizeStr = `${c.width || 10}x${c.length || 30} mm`;
          specStr = `Radyuslu Slot (${c.width || 10}x${c.length || 30}mm)`;
        }

        const depthStr = c.isThroughAll
          ? 'Boydan Boya (Through-Cut)'
          : `${c.depth || 8} mm (Havuz Derinliği)`;

        items.push({
          tag: `C${cutIdx++}`,
          partName: part.name,
          kind: 'cut',
          face: c.face || 'top',
          x: Math.round(c.x * 10) / 10,
          y: Math.round(c.y * 10) / 10,
          size: sizeStr,
          type: typeLabel,
          spec: specStr,
          depth: depthStr,
          radius: Math.sqrt(c.x * c.x + c.y * c.y),
        });
      }
    }

    // 3. Built-in holes, bores, and cuts from library shapes (Hazır Çizimler)
    if (part.kind === 'tube') {
      const innerD = p.innerDiameter || 20;
      items.push({
        tag: `H${holeIdx++}`,
        partName: part.name,
        kind: 'bore',
        face: 'top',
        x: 0,
        y: 0,
        size: `Ø${innerD}`,
        type: 'İç Çap Deliği (Bore)',
        spec: `Ø${innerD} mm Boydan Boya İç Delik`,
        depth: 'Boydan Boya (Through)',
        diameter: innerD,
        radius: 0,
      });
    } else if (part.kind === 'gear-blank') {
      const boreD = p.bore || 12;
      items.push({
        tag: `H${holeIdx++}`,
        partName: part.name,
        kind: 'bore',
        face: 'top',
        x: 0,
        y: 0,
        size: `Ø${boreD}`,
        type: 'Mil Göbek Deliği',
        spec: `Ø${boreD} mm Mil Geçme Deliği (H7)`,
        depth: 'Boydan Boya (Through)',
        diameter: boreD,
        radius: 0,
      });
    } else if (part.kind === 'pulley') {
      const boreD = p.innerDiameter || p.bore || 12;
      const grvD = p.grooveDepth || 4;
      items.push({
        tag: `H${holeIdx++}`,
        partName: part.name,
        kind: 'bore',
        face: 'top',
        x: 0,
        y: 0,
        size: `Ø${boreD}`,
        type: 'Kasnak Göbek Deliği',
        spec: `Ø${boreD} mm Kasnak Mil Deliği (H7)`,
        depth: 'Boydan Boya (Through)',
        diameter: boreD,
        radius: 0,
      });
      items.push({
        tag: `C${cutIdx++}`,
        partName: part.name,
        kind: 'cut',
        face: 'top',
        x: 0,
        y: 0,
        size: `V-${grvD}mm`,
        type: 'V-Kayış Kanalı (Groove)',
        spec: `V-Kayış Profili (Derinlik: ${grvD}mm)`,
        depth: `${grvD} mm`,
      });
    } else if (part.kind === 'hex-nut') {
      const nutM = p.innerDiameter || 10;
      items.push({
        tag: `H${holeIdx++}`,
        partName: part.name,
        kind: 'hole',
        face: 'top',
        x: 0,
        y: 0,
        size: `M${nutM}`,
        type: 'Metrik Somun Dişi (Tap)',
        spec: `M${nutM} Metrik İç Diş (ISO 4032 · 6H)`,
        depth: 'Boydan Boya (Through)',
        diameter: nutM,
        radius: 0,
      });
    } else if (part.kind === 'bearing-race') {
      const innerD = p.innerDiameter || 20;
      items.push({
        tag: `H${holeIdx++}`,
        partName: part.name,
        kind: 'bore',
        face: 'top',
        x: 0,
        y: 0,
        size: `Ø${innerD}`,
        type: 'Rulman İç Bilezik Deliği',
        spec: `Ø${innerD} mm Rulman Mil Oturma Yuvası (H6)`,
        depth: 'Boydan Boya (Through)',
        diameter: innerD,
        radius: 0,
      });
    } else if (part.kind === 'slot-plate') {
      const sw = p.slotWidth || 10;
      const sl = p.slotLength || 30;
      items.push({
        tag: `C${cutIdx++}`,
        partName: part.name,
        kind: 'cut',
        face: 'top',
        x: 0,
        y: 0,
        size: `${sw}x${sl}`,
        type: 'Freze Slot Kanalı (Slot)',
        spec: `${sw}x${sl} mm Boydan Boya Freze Kanalı`,
        depth: 'Boydan Boya (Through)',
      });
    } else if (part.kind === 'keyway-shaft') {
      const kw = p.keyWidth || 6;
      const kd = p.keyDepth || 3.5;
      const kl = p.length || 60;
      items.push({
        tag: `C${cutIdx++}`,
        partName: part.name,
        kind: 'cut',
        face: 'top',
        x: 0,
        y: 0,
        size: `${kw}x${kd}x${kl}`,
        type: 'DIN 6885 Kama Kanalı',
        spec: `${kw}x${kd}x${kl} mm Standart Kama Kanalı`,
        depth: `${kd} mm`,
      });
    } else if (part.kind === 'd-shaft') {
      const flatOff = p.flatOffset || 7;
      items.push({
        tag: `C${cutIdx++}`,
        partName: part.name,
        kind: 'cut',
        face: 'top',
        x: 0,
        y: 0,
        size: `Ofset: ${flatOff}mm`,
        type: 'D-Mil Düz Kesim',
        spec: `D-Mil Düzlüğü (Ofset: ${flatOff}mm)`,
        depth: `${flatOff} mm`,
      });
    }
  }

  return items;
}

function getGeometryForPart(part: DesignPart): THREE.BufferGeometry {
  return createCustomGeometry(part);
}



/**
 * Generates an ISO Standard 2D Technical Drawing Sheet in SVG format containing:
 * - True 3D Polygon Projections for Front, Top, Right Side, and Isometric Views
 * - CAD Cel-Shaded Surfaces with Crisp Technical Linework
 * - Automatic Dimension Lines with Extension Witness Lines & Arrowheads
 * - Centerlines & Hole Markers
 * - Standard ISO 7200 Title Block (Antet)
 */
export function generateTechnicalDrawingSVG(
  target: DesignPart | DesignPart[],
  massProps: MassProperties,
  config: Partial<DrawingSheetConfig> = {}
): string {
  const partsToDraw: DesignPart[] = Array.isArray(target) ? target : [target];
  const isAssembly = partsToDraw.length > 1;

  // Extract all 3D triangles from all parts in world / assembly coordinates
  interface Triangle3D {
    p0: [number, number, number];
    p1: [number, number, number];
    p2: [number, number, number];
    normal: [number, number, number];
    color: string;
  }

  const triangles: Triangle3D[] = [];
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  let minZ = Infinity, maxZ = -Infinity;

  for (const part of partsToDraw) {
    if (!part.visible) continue;
    const geom = getGeometryForPart(part);
    const posAttr = geom.attributes.position;
    if (!posAttr) continue;

    const index = geom.index;
    const partPos = [part.position.x / 10, part.position.y / 10, part.position.z / 10];
    const partRot = [
      (part.rotation.x * Math.PI) / 180,
      (part.rotation.y * Math.PI) / 180,
      (part.rotation.z * Math.PI) / 180,
    ];
    const sx = part.scale?.x ?? 1;
    const sy = part.scale?.y ?? 1;
    const sz = part.scale?.z ?? 1;
    const euler = new THREE.Euler(partRot[0], partRot[1], partRot[2], 'XYZ');
    const matrix = new THREE.Matrix4().compose(
      new THREE.Vector3(partPos[0], partPos[1], partPos[2]),
      new THREE.Quaternion().setFromEuler(euler),
      new THREE.Vector3(sx, sy, sz)
    );

    const v0 = new THREE.Vector3();
    const v1 = new THREE.Vector3();
    const v2 = new THREE.Vector3();

    const getVertex = (idx: number, dest: THREE.Vector3) => {
      dest.fromBufferAttribute(posAttr, idx);
      dest.applyMatrix4(matrix);
      // Viewport units to mm (1 unit = 10mm)
      dest.multiplyScalar(10);

      if (dest.x < minX) minX = dest.x;
      if (dest.x > maxX) maxX = dest.x;
      if (dest.y < minY) minY = dest.y;
      if (dest.y > maxY) maxY = dest.y;
      if (dest.z < minZ) minZ = dest.z;
      if (dest.z > maxZ) maxZ = dest.z;
    };

    const count = index ? index.count : posAttr.count;
    for (let i = 0; i < count; i += 3) {
      const i0 = index ? index.getX(i) : i;
      const i1 = index ? index.getX(i + 1) : i + 1;
      const i2 = index ? index.getX(i + 2) : i + 2;

      getVertex(i0, v0);
      getVertex(i1, v1);
      getVertex(i2, v2);

      const edge1 = new THREE.Vector3().subVectors(v1, v0);
      const edge2 = new THREE.Vector3().subVectors(v2, v0);
      const normal = new THREE.Vector3().crossVectors(edge1, edge2).normalize();

      triangles.push({
        p0: [v0.x, v0.y, v0.z],
        p1: [v1.x, v1.y, v1.z],
        p2: [v2.x, v2.y, v2.z],
        normal: [normal.x, normal.y, normal.z],
        color: part.color || '#94a3b8',
      });
    }
  }

  // Handle fallback if no vertices found
  if (minX === Infinity) {
    minX = -30; maxX = 30;
    minY = -20; maxY = 20;
    minZ = -15; maxZ = 15;
  }

  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  const centerZ = (minZ + maxZ) / 2;

  const dimW = Math.round(Math.max(0.1, maxX - minX) * 10) / 10;
  const dimH = Math.round(Math.max(0.1, maxY - minY) * 10) / 10;
  const dimD = Math.round(Math.max(0.1, maxZ - minZ) * 10) / 10;

  const cfg: DrawingSheetConfig = {
    sheetSize: config.sheetSize || 'A3',
    scale: config.scale || 1,
    projection: config.projection || 'first-angle',
    projectName: config.projectName || 'ALU-CAD DESIGN',
    partName: isAssembly ? `Montaj: ${partsToDraw.length} Parça` : partsToDraw[0]?.name || 'Parça',
    materialName: config.materialName || 'Alüminyum 6061-T6',
    massKg: massProps.massKg,
    author: config.author || 'Design Engineer',
    approver: config.approver || 'Quality Assurance',
    date: config.date || new Date().toISOString().split('T')[0],
    companyName: config.companyName || 'ALUCALCULATOR CAD SYSTEMS',
    companySubtext: config.companySubtext || 'Precision Engineering & Manufacturing',
    drawingNumber: config.drawingNumber || `DWG-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    revision: config.revision || '01',
    tolerance: config.tolerance || 'ISO 2768-m',
    surfaceFinish: config.surfaceFinish || 'Ra 1.6 μm',
    notes: config.notes && config.notes.length > 0 ? config.notes : [
      '1. Tüm ölçüler milimetre (mm) cinsindendir.',
      '2. Belirtilmeyen pahlar 0.5x45°, radyuslar R1.0 mm.',
      '3. Tüm keskin çapaklar temizlenecektir.',
    ],
    templateStyle: config.templateStyle || 'iso7200',
    colorTheme: config.colorTheme || 'classic',
  };

  const isA3 = cfg.sheetSize === 'A3';
  const isA2 = cfg.sheetSize === 'A2';
  const sheetW = isA2 ? 1680 : isA3 ? 1188 : 840;
  const sheetH = isA2 ? 1188 : isA3 ? 840 : 594;
  const margin = 20;

  // Theme colors
  const isThemeBlueprint = cfg.colorTheme === 'blueprint';
  const isThemeDark = cfg.colorTheme === 'dark';

  const bgColor = isThemeBlueprint ? '#091833' : isThemeDark ? '#080c14' : '#ffffff';
  const primaryStroke = isThemeBlueprint ? '#38bdf8' : isThemeDark ? '#cbd5e1' : '#0f172a';
  const secondaryStroke = isThemeBlueprint ? '#0284c7' : isThemeDark ? '#64748b' : '#64748b';
  const textPrimary = isThemeBlueprint ? '#f0f9ff' : isThemeDark ? '#f8fafc' : '#0f172a';
  const textSecondary = isThemeBlueprint ? '#7dd3fc' : isThemeDark ? '#94a3b8' : '#334155';
  const antetBg = isThemeBlueprint ? '#0b2144' : isThemeDark ? '#0f172a' : '#f8fafc';
  const centerlineColor = isThemeBlueprint ? '#38bdf8' : isThemeDark ? '#38bdf8' : '#0284c7';

  // Compute view bounding scale
  const maxDim = Math.max(dimW, dimH, dimD);
  const viewScale = (sheetW * 0.18) / (maxDim || 50);

  const sw = dimW * viewScale;
  const sh = dimH * viewScale;
  const sd = dimD * viewScale;

  // View Centers
  const frontX = sheetW * 0.28;
  const frontY = sheetH * 0.56;

  const topX = frontX;
  const topY = frontY - sh / 2 - sd / 2 - 65;

  const rightX = frontX + sw / 2 + sd / 2 + 75;
  const rightY = frontY;

  const isoX = sheetW * 0.76;
  const isoY = sheetH * 0.33;

  // Project and render views
  const light = new THREE.Vector3(0.5, 0.8, 1.0).normalize();

  function projectViewPolygons(viewType: 'front' | 'top' | 'right' | 'isometric'): string {
    interface ProjTri {
      pts: [number, number][];
      depth: number;
      fill: string;
      viewDot: number;
      origIdx: number;
    }
    const list: ProjTri[] = [];

    const cos30 = Math.cos(Math.PI / 6);
    const sin30 = Math.sin(Math.PI / 6);

    // Helper: project a 3D point to 2D for the given view
    const projectPoint = (p: number[]): [number, number, number] => {
      if (viewType === 'front') return [p[0] * viewScale, -p[1] * viewScale, p[2]];
      if (viewType === 'top') return [p[0] * viewScale, p[2] * viewScale, p[1]];
      if (viewType === 'right') return [p[2] * viewScale, -p[1] * viewScale, p[0]];
      // isometric
      const isoXv = (p[0] - p[2]) * cos30;
      const isoYv = -p[1] + (p[0] + p[2]) * sin30 * 0.7;
      const isoZv = p[0] + p[1] + p[2];
      return [isoXv * viewScale, isoYv * viewScale, isoZv];
    };

    // Helper: compute view-facing dot product for backface culling
    const getViewDot = (norm: THREE.Vector3): number => {
      if (viewType === 'front') return norm.z;
      if (viewType === 'top') return norm.y;
      if (viewType === 'right') return norm.x;
      return (norm.x + norm.y + norm.z) / Math.sqrt(3);
    };

    // 1. Project all triangles with fill but NO individual stroke
    for (let ti = 0; ti < triangles.length; ti++) {
      const tri = triangles[ti];
      const p0 = [tri.p0[0] - centerX, tri.p0[1] - centerY, tri.p0[2] - centerZ];
      const p1 = [tri.p1[0] - centerX, tri.p1[1] - centerY, tri.p1[2] - centerZ];
      const p2 = [tri.p2[0] - centerX, tri.p2[1] - centerY, tri.p2[2] - centerZ];
      const norm = new THREE.Vector3(tri.normal[0], tri.normal[1], tri.normal[2]);

      const viewDot = getViewDot(norm);

      if (viewDot <= -0.05 && viewType !== 'isometric') {
        continue; // Backface culling
      }

      const pr0 = projectPoint(p0);
      const pr1 = projectPoint(p1);
      const pr2 = projectPoint(p2);

      let fill = '';
      if (isThemeBlueprint) {
        const intensity = Math.max(0.25, Math.min(1.0, 0.45 + norm.dot(light) * 0.55));
        const alpha = (0.15 + intensity * 0.35).toFixed(2);
        fill = `rgba(56, 189, 248, ${alpha})`;
      } else if (isThemeDark) {
        const intensity = Math.max(0.35, Math.min(1.0, 0.55 + norm.dot(light) * 0.45));
        const val = Math.round(30 + intensity * 35);
        fill = `rgb(${val},${val + 4},${val + 10})`;
      } else {
        const intensity = Math.max(0.35, Math.min(1.0, 0.55 + norm.dot(light) * 0.45));
        const rgb = Math.round(230 + intensity * 25);
        fill = `rgb(${rgb},${rgb + 2},${rgb + 5})`;
      }

      list.push({
        pts: [[pr0[0], pr0[1]], [pr1[0], pr1[1]], [pr2[0], pr2[1]]],
        depth: (pr0[2] + pr1[2] + pr2[2]) / 3,
        fill,
        viewDot,
        origIdx: ti,
      });
    }

    list.sort((a, b) => a.depth - b.depth);

    // Render filled polygons WITHOUT stroke (clean solid surfaces)
    let svg = list
      .map((t) => {
        const s = `${t.pts[0][0].toFixed(1)},${t.pts[0][1].toFixed(1)} ${t.pts[1][0].toFixed(1)},${t.pts[1][1].toFixed(1)} ${t.pts[2][0].toFixed(1)},${t.pts[2][1].toFixed(1)}`;
        return `<polygon points="${s}" fill="${t.fill}" stroke="none" />`;
      })
      .join('\n');

    // 2. Build edge adjacency map for crease/silhouette detection
    const CREASE_THRESHOLD = Math.cos(30 * Math.PI / 180); // ~0.866
    interface EdgeInfo {
      triIndices: number[];
      v0: number[]; v1: number[];
    }
    const edgeMap = new Map<string, EdgeInfo>();

    const makeEdgeKey = (a: number[], b: number[]): string => {
      const ka = `${a[0].toFixed(2)},${a[1].toFixed(2)},${a[2].toFixed(2)}`;
      const kb = `${b[0].toFixed(2)},${b[1].toFixed(2)},${b[2].toFixed(2)}`;
      return ka < kb ? `${ka}|${kb}` : `${kb}|${ka}`;
    };

    // Register all edges from projected (visible) triangles
    for (const item of list) {
      const ti = item.origIdx;
      const tri = triangles[ti];
      const verts = [
        [tri.p0[0] - centerX, tri.p0[1] - centerY, tri.p0[2] - centerZ],
        [tri.p1[0] - centerX, tri.p1[1] - centerY, tri.p1[2] - centerZ],
        [tri.p2[0] - centerX, tri.p2[1] - centerY, tri.p2[2] - centerZ],
      ];
      const edges: [number[], number[]][] = [[verts[0], verts[1]], [verts[1], verts[2]], [verts[2], verts[0]]];
      for (const [ev0, ev1] of edges) {
        const key = makeEdgeKey(ev0, ev1);
        const existing = edgeMap.get(key);
        if (existing) {
          existing.triIndices.push(ti);
        } else {
          edgeMap.set(key, { triIndices: [ti], v0: ev0, v1: ev1 });
        }
      }
    }

    // 3. Identify and draw only significant edges
    const edgeLines: string[] = [];
    for (const [, edge] of edgeMap) {
      let shouldDraw = false;

      if (edge.triIndices.length === 1) {
        shouldDraw = true;
      } else if (edge.triIndices.length >= 2) {
        const n0 = triangles[edge.triIndices[0]].normal;
        const n1 = triangles[edge.triIndices[1]].normal;
        const norm0 = new THREE.Vector3(n0[0], n0[1], n0[2]);
        const norm1 = new THREE.Vector3(n1[0], n1[1], n1[2]);

        const dot = norm0.dot(norm1);
        if (dot < CREASE_THRESHOLD) {
          shouldDraw = true;
        }

        const vd0 = getViewDot(norm0);
        const vd1 = getViewDot(norm1);
        if ((vd0 > 0 && vd1 <= 0) || (vd0 <= 0 && vd1 > 0)) {
          shouldDraw = true;
        }
      }

      if (shouldDraw) {
        const pr0 = projectPoint(edge.v0);
        const pr1 = projectPoint(edge.v1);
        edgeLines.push(
          `<line x1="${pr0[0].toFixed(1)}" y1="${pr0[1].toFixed(1)}" x2="${pr1[0].toFixed(1)}" y2="${pr1[1].toFixed(1)}" stroke="${primaryStroke}" stroke-width="1.0" stroke-linecap="round" />`
        );
      }
    }

    svg += '\n' + edgeLines.join('\n');
    return svg;
  }

  const frontSvg = projectViewPolygons('front');
  const topSvg = projectViewPolygons('top');
  const rightSvg = projectViewPolygons('right');
  const isoSvg = projectViewPolygons('isometric');

  // Projection Cone Symbol
  const isFirstAngle = cfg.projection === 'first-angle';
  const projectionSymbolSvg = isFirstAngle
    ? `
      <g transform="translate(0, 0)">
        <line x1="0" y1="10" x2="36" y2="10" stroke="${secondaryStroke}" stroke-width="0.6" stroke-dasharray="4,2" />
        <polygon points="6,4 6,16 18,13 18,7" fill="none" stroke="${primaryStroke}" stroke-width="0.8" />
        <circle cx="27" cy="10" r="3" fill="none" stroke="${primaryStroke}" stroke-width="0.8" />
        <circle cx="27" cy="10" r="6" fill="none" stroke="${primaryStroke}" stroke-width="0.8" />
      </g>`
    : `
      <g transform="translate(0, 0)">
        <line x1="0" y1="10" x2="36" y2="10" stroke="${secondaryStroke}" stroke-width="0.6" stroke-dasharray="4,2" />
        <circle cx="9" cy="10" r="3" fill="none" stroke="${primaryStroke}" stroke-width="0.8" />
        <circle cx="9" cy="10" r="6" fill="none" stroke="${primaryStroke}" stroke-width="0.8" />
        <polygon points="18,7 18,13 30,16 30,4" fill="none" stroke="${primaryStroke}" stroke-width="0.8" />
      </g>`;

  // Title block renderers for each style
  const renderTitleBlock = () => {
    const bw = 380;
    const bh = 120;
    const bx = sheetW - margin - bw;
    const by = sheetH - margin - bh;

    if (cfg.templateStyle === 'modern') {
      return `
      <!-- MODERN CORPORATE TITLE BLOCK -->
      <g transform="translate(${bx}, ${by})">
        <rect x="0" y="0" width="${bw}" height="${bh}" fill="${antetBg}" stroke="${primaryStroke}" stroke-width="1.8" rx="6" />
        <!-- Header Banner -->
        <path d="M 0 6 Q 0 0 6 0 L ${bw - 6} 0 Q ${bw} 0 ${bw} 6 L ${bw} 30 L 0 30 Z" fill="${isThemeBlueprint ? '#0284c7' : '#0f172a'}" />
        <text x="14" y="20" font-size="12" font-weight="900" fill="#ffffff" letter-spacing="1">${cfg.companyName}</text>
        <text x="${bw - 14}" y="20" text-anchor="end" font-size="10" font-weight="700" fill="#93c5fd">${cfg.drawingNumber} · Rev ${cfg.revision}</text>

        <!-- Main fields -->
        <line x1="0" y1="60" x2="${bw}" y2="60" stroke="${secondaryStroke}" stroke-width="0.8" />
        <line x1="0" y1="90" x2="${bw}" y2="90" stroke="${secondaryStroke}" stroke-width="0.8" />
        <line x1="220" y1="30" x2="220" y2="120" stroke="${secondaryStroke}" stroke-width="0.8" />

        <text x="12" y="46" font-size="10" font-weight="800" fill="${textPrimary}">${cfg.partName}</text>
        <text x="12" y="56" font-size="8" fill="${textSecondary}">${cfg.projectName}</text>

        <text x="12" y="74" font-size="8" fill="${textSecondary}">MALZEME: <tspan font-weight="700" fill="${textPrimary}">${cfg.materialName}</tspan></text>
        <text x="12" y="84" font-size="8" fill="${textSecondary}">AĞIRLIK: <tspan font-weight="700" fill="${textPrimary}">${cfg.massKg} kg (${massProps.massGrams} g)</tspan></text>

        <text x="12" y="104" font-size="8" fill="${textSecondary}">TOLERANS: <tspan font-weight="700" fill="${textPrimary}">${cfg.tolerance}</tspan></text>
        <text x="110" y="104" font-size="8" fill="${textSecondary}">YÜZEY: <tspan font-weight="700" fill="${textPrimary}">${cfg.surfaceFinish}</tspan></text>

        <!-- Right info box -->
        <text x="230" y="46" font-size="8" fill="${textSecondary}">ÇİZEN: <tspan font-weight="700" fill="${textPrimary}">${cfg.author}</tspan></text>
        <text x="230" y="56" font-size="8" fill="${textSecondary}">ONAY: <tspan font-weight="700" fill="${textPrimary}">${cfg.approver || '-'}</tspan></text>
        <text x="230" y="76" font-size="8" fill="${textSecondary}">TARİH: <tspan font-weight="700" fill="${textPrimary}">${cfg.date}</tspan></text>
        <text x="230" y="86" font-size="8" fill="${textSecondary}">BOYUT: <tspan font-weight="700" fill="${textPrimary}">${cfg.sheetSize}</tspan> · ÖLÇEK: 1:1</text>

        <!-- Projection symbol -->
        <g transform="translate(325, 95)">
          ${projectionSymbolSvg}
        </g>
      </g>`;
    }

    if (cfg.templateStyle === 'din') {
      return `
      <!-- DIN STANDARD TITLE BLOCK -->
      <g transform="translate(${bx}, ${by})">
        <rect x="0" y="0" width="${bw}" height="${bh}" fill="${antetBg}" stroke="${primaryStroke}" stroke-width="1.8" />
        <line x1="0" y1="28" x2="${bw}" y2="28" stroke="${primaryStroke}" stroke-width="1" />
        <line x1="0" y1="56" x2="${bw}" y2="56" stroke="${primaryStroke}" stroke-width="1" />
        <line x1="0" y1="88" x2="${bw}" y2="88" stroke="${primaryStroke}" stroke-width="1" />
        <line x1="190" y1="0" x2="190" y2="120" stroke="${primaryStroke}" stroke-width="1" />
        <line x1="285" y1="56" x2="285" y2="120" stroke="${primaryStroke}" stroke-width="1" />

        <text x="10" y="18" font-size="11" font-weight="900" fill="${textPrimary}">${cfg.companyName}</text>
        <text x="10" y="44" font-size="10" font-weight="700" fill="${textPrimary}">${cfg.partName}</text>
        <text x="10" y="74" font-size="8" fill="${textSecondary}">WERKSTOFF: ${cfg.materialName}</text>
        <text x="10" y="104" font-size="8" fill="${textSecondary}">GEWICHT: ${cfg.massKg} kg | OBERFLÄCHE: ${cfg.surfaceFinish}</text>

        <text x="200" y="18" font-size="9" font-weight="700" fill="${textPrimary}">DIN ISO 2768-m</text>
        <text x="200" y="44" font-size="9" fill="${textSecondary}">ZEICHNUNG-NR: ${cfg.drawingNumber}</text>
        <text x="200" y="74" font-size="8" fill="${textSecondary}">DATUM: ${cfg.date}</text>
        <text x="200" y="104" font-size="8" fill="${textSecondary}">GEZ.: ${cfg.author}</text>
        <text x="295" y="74" font-size="8" fill="${textSecondary}">BLATT: ${cfg.sheetSize}</text>
        <text x="295" y="104" font-size="8" fill="${textSecondary}">REV: ${cfg.revision}</text>
      </g>`;
    }

    if (cfg.templateStyle === 'minimal') {
      return `
      <!-- MINIMAL TITLE BLOCK -->
      <g transform="translate(${bx + 60}, ${by + 30})">
        <rect x="0" y="0" width="${bw - 60}" height="${bh - 30}" fill="${antetBg}" stroke="${primaryStroke}" stroke-width="1.2" rx="4" />
        <line x1="0" y1="30" x2="${bw - 60}" y2="30" stroke="${secondaryStroke}" stroke-width="0.8" />
        <line x1="170" y1="30" x2="170" y2="${bh - 30}" stroke="${secondaryStroke}" stroke-width="0.8" />

        <text x="10" y="20" font-size="11" font-weight="900" fill="${textPrimary}">${cfg.partName} <tspan font-size="9" font-weight="400" fill="${textSecondary}">(${cfg.projectName})</tspan></text>
        <text x="10" y="50" font-size="8" fill="${textSecondary}">MALZEME: ${cfg.materialName}</text>
        <text x="10" y="70" font-size="8" fill="${textSecondary}">AĞIRLIK: ${cfg.massKg} kg</text>

        <text x="180" y="50" font-size="8" fill="${textSecondary}">TOLERANS: ${cfg.tolerance}</text>
        <text x="180" y="70" font-size="8" fill="${textSecondary}">${cfg.date} · ${cfg.author}</text>
      </g>`;
    }

    // Default ISO 7200 Title Block
    return `
    <!-- ISO 7200 TITLE BLOCK (ANTET) -->
    <g transform="translate(${bx}, ${by})">
      <rect x="0" y="0" width="${bw}" height="${bh}" fill="${antetBg}" stroke="${primaryStroke}" stroke-width="1.8" />
      <line x1="0" y1="30" x2="${bw}" y2="30" stroke="${primaryStroke}" stroke-width="1" />
      <line x1="0" y1="60" x2="${bw}" y2="60" stroke="${primaryStroke}" stroke-width="1" />
      <line x1="0" y1="90" x2="${bw}" y2="90" stroke="${primaryStroke}" stroke-width="1" />
      <line x1="190" y1="30" x2="190" y2="${bh}" stroke="${primaryStroke}" stroke-width="1" />
      <line x1="280" y1="60" x2="280" y2="${bh}" stroke="${primaryStroke}" stroke-width="1" />

      <!-- Title Texts -->
      <text x="12" y="20" font-size="12" font-weight="900" fill="${textPrimary}">${cfg.companyName}</text>
      <text x="${bw - 12}" y="20" text-anchor="end" font-size="9" font-weight="700" fill="${textSecondary}">${cfg.drawingNumber}</text>

      <text x="12" y="48" font-size="11" font-weight="700" fill="${textPrimary}">${cfg.partName}</text>
      <text x="12" y="76" font-size="8.5" fill="${textSecondary}">MALZEME: <tspan font-weight="700" fill="${textPrimary}">${cfg.materialName}</tspan></text>
      <text x="12" y="104" font-size="8.5" fill="${textSecondary}">AĞIRLIK: <tspan font-weight="700" fill="${textPrimary}">${cfg.massKg} kg (${massProps.massGrams} g)</tspan></text>

      <text x="200" y="48" font-size="8.5" fill="${textSecondary}">TOLERANS: ${cfg.tolerance}</text>
      <text x="200" y="76" font-size="8.5" fill="${textSecondary}">ÖLÇEK: 1:1</text>
      <text x="290" y="76" font-size="8.5" fill="${textSecondary}">BOYUT: ${cfg.sheetSize}</text>
      <text x="200" y="104" font-size="8.5" fill="${textSecondary}">TARİH: ${cfg.date}</text>
      <text x="290" y="104" font-size="8.5" fill="${textSecondary}">REV: ${cfg.revision}</text>
    </g>`;
  };

  // ─── 2D HOLE & FEATURE ANNOTATION GENERATOR ───
  const featureSchedule = extractFeatureSchedule(partsToDraw);

  function generateViewHoleAnnotations(viewType: 'top' | 'front' | 'right'): string {
    const svgElements: string[] = [];
    const relevantFeatures = featureSchedule.filter((f) => {
      if (viewType === 'top') return f.face === 'top' || f.face === 'bottom';
      if (viewType === 'front') return f.face === 'front' || f.face === 'back';
      if (viewType === 'right') return f.face === 'right' || f.face === 'left';
      return false;
    });

    if (relevantFeatures.length === 0) return '';

    // 1. Detect PCD Pitch Circle (if 3 or more holes share the same pitch circle radius)
    const radiusGroups = new Map<number, FeatureScheduleItem[]>();
    for (const f of relevantFeatures) {
      if (f.kind === 'hole' && f.radius && f.radius > 2.0) {
        const roundedR = Math.round(f.radius);
        const group = radiusGroups.get(roundedR) || [];
        group.push(f);
        radiusGroups.set(roundedR, group);
      }
    }

    for (const [rMm, group] of radiusGroups) {
      if (group.length >= 3) {
        const rPx = rMm * viewScale;
        svgElements.push(`
          <!-- PCD PITCH CIRCLE -->
          <circle cx="0" cy="0" r="${rPx.toFixed(1)}" fill="none" stroke="${centerlineColor}" stroke-width="0.8" stroke-dasharray="8,3,2,3" />
          <text x="0" y="${(-rPx - 6).toFixed(1)}" text-anchor="middle" font-size="8" font-weight="800" fill="${centerlineColor}">
            PCD Ø${(rMm * 2).toFixed(1)} mm (${group.length}x)
          </text>
        `);
      }
    }

    // 2. Draw each individual hole / cut marker & tag badge
    for (const f of relevantFeatures) {
      let px = 0;
      let py = 0;
      if (viewType === 'top') {
        px = f.x * viewScale;
        py = f.y * viewScale;
      } else if (viewType === 'front') {
        px = f.x * viewScale;
        py = -f.y * viewScale;
      } else if (viewType === 'right') {
        px = f.x * viewScale;
        py = -f.y * viewScale;
      }

      const nomDia = f.diameter || 6;
      const rPx = Math.max(2.5, (nomDia / 2) * viewScale);
      const tagColor = f.kind === 'cut' ? '#fb7185' : '#38bdf8';

      svgElements.push(`
        <!-- Feature ${f.tag} -->
        <g transform="translate(${px.toFixed(1)}, ${py.toFixed(1)})">
          <!-- Crosshair -->
          <line x1="${(-rPx - 3).toFixed(1)}" y1="0" x2="${(rPx + 3).toFixed(1)}" y2="0" stroke="${centerlineColor}" stroke-width="0.7" />
          <line x1="0" y1="${(-rPx - 3).toFixed(1)}" x2="0" y2="${(rPx + 3).toFixed(1)}" stroke="${centerlineColor}" stroke-width="0.7" />

          <!-- Hole Bore Circle -->
          <circle cx="0" cy="0" r="${rPx.toFixed(1)}" fill="none" stroke="${tagColor}" stroke-width="1.1" />

          <!-- Leader line & Tag Badge -->
          <line x1="${(rPx * 0.7).toFixed(1)}" y1="${(-rPx * 0.7).toFixed(1)}" x2="${(rPx + 10).toFixed(1)}" y2="${(-rPx - 10).toFixed(1)}" stroke="${secondaryStroke}" stroke-width="0.7" />
          <rect x="${(rPx + 10).toFixed(1)}" y="${(-rPx - 17).toFixed(1)}" width="18" height="12" rx="3" fill="${antetBg}" stroke="${tagColor}" stroke-width="0.9" />
          <text x="${(rPx + 19).toFixed(1)}" y="${(-rPx - 8).toFixed(1)}" text-anchor="middle" font-size="7.5" font-weight="900" fill="${tagColor}">${f.tag}</text>
        </g>
      `);
    }

    return svgElements.join('\n');
  }

  const topViewHolesSvg = generateViewHoleAnnotations('top');
  const frontViewHolesSvg = generateViewHoleAnnotations('front');
  const rightViewHolesSvg = generateViewHoleAnnotations('right');

  // ─── DELİK & KESİM ÇİZELGESİ (HOLE & CUT SCHEDULE TABLE) ───
  function renderHoleScheduleTableSvg(): string {
    if (featureSchedule.length === 0) return '';

    const tblW = 460;
    const rowH = 15;
    const headerH = 22;
    const totalRows = Math.min(featureSchedule.length, 14);
    const tblH = headerH + totalRows * rowH;
    const tblX = sheetW - margin - tblW;
    const tblY = sheetH - margin - 120 - tblH - 12;

    const colX = [0, 32, 86, 136, 186, 350, tblW];

    const headerBg = isThemeBlueprint ? '#0284c7' : isThemeDark ? '#1e293b' : '#0f172a';
    const rowBgEven = isThemeBlueprint ? 'rgba(11, 33, 68, 0.95)' : isThemeDark ? 'rgba(15, 23, 42, 0.95)' : '#ffffff';
    const rowBgOdd = isThemeBlueprint ? 'rgba(14, 43, 85, 0.85)' : isThemeDark ? 'rgba(30, 41, 59, 0.7)' : '#f8fafc';

    let rowsSvg = '';
    for (let i = 0; i < totalRows; i++) {
      const f = featureSchedule[i];
      const ry = headerH + i * rowH;
      const bg = i % 2 === 0 ? rowBgEven : rowBgOdd;
      const tagColor = f.kind === 'cut' ? '#fb7185' : '#38bdf8';

      const faceLabel = f.face === 'top' ? 'Üst (+Y)' :
                        f.face === 'bottom' ? 'Alt (-Y)' :
                        f.face === 'front' ? 'Ön (+Z)' :
                        f.face === 'back' ? 'Arka (-Z)' :
                        f.face === 'right' ? 'Sağ (+X)' : 'Sol (-X)';

      rowsSvg += `
        <rect x="0" y="${ry}" width="${tblW}" height="${rowH}" fill="${bg}" />
        <line x1="0" y1="${ry + rowH}" x2="${tblW}" y2="${ry + rowH}" stroke="${secondaryStroke}" stroke-width="0.5" />
        
        <!-- Tag Badge -->
        <rect x="3" y="${ry + 2}" width="25" height="${rowH - 4}" rx="3" fill="${tagColor}" fill-opacity="0.18" stroke="${tagColor}" stroke-width="0.7" />
        <text x="15.5" y="${ry + 10.5}" text-anchor="middle" font-size="8" font-weight="900" fill="${tagColor}">${f.tag}</text>

        <!-- Face -->
        <text x="${colX[1] + 4}" y="${ry + 10.5}" font-size="7.5" font-weight="700" fill="${textSecondary}">${faceLabel}</text>

        <!-- X mm -->
        <text x="${colX[2] + 24}" y="${ry + 10.5}" text-anchor="middle" font-size="8" font-family="monospace" font-weight="700" fill="${textPrimary}">${f.x > 0 ? '+' + f.x : f.x}</text>

        <!-- Y mm -->
        <text x="${colX[3] + 24}" y="${ry + 10.5}" text-anchor="middle" font-size="8" font-family="monospace" font-weight="700" fill="${textPrimary}">${f.y > 0 ? '+' + f.y : f.y}</text>

        <!-- Spec -->
        <text x="${colX[4] + 4}" y="${ry + 10.5}" font-size="7.5" font-weight="600" fill="${textPrimary}">${f.spec}</text>

        <!-- Depth -->
        <text x="${colX[5] + 4}" y="${ry + 10.5}" font-size="7.5" font-weight="700" fill="${textSecondary}">${f.depth}</text>
      `;
    }

    let colLines = '';
    for (let c = 1; c < colX.length - 1; c++) {
      colLines += `<line x1="${colX[c]}" y1="0" x2="${colX[c]}" y2="${tblH}" stroke="${secondaryStroke}" stroke-width="0.6" />`;
    }

    return `
      <!-- DELİK & KESİM ÇİZELGESİ (HOLE & CUT SCHEDULE TABLE - ISO 7200 / DIN) -->
      <g transform="translate(${tblX}, ${tblY})">
        <!-- Outer Border -->
        <rect x="0" y="0" width="${tblW}" height="${tblH}" fill="${antetBg}" stroke="${primaryStroke}" stroke-width="1.4" rx="4" />

        <!-- Table Header -->
        <rect x="0" y="0" width="${tblW}" height="${headerH}" fill="${headerBg}" />
        <text x="15.5" y="14" text-anchor="middle" font-size="8" font-weight="900" fill="#ffffff">NO</text>
        <text x="${colX[1] + 4}" y="14" font-size="8" font-weight="800" fill="#ffffff">YÜZEY</text>
        <text x="${colX[2] + 24}" y="14" text-anchor="middle" font-size="8" font-weight="800" fill="#ffffff">X (mm)</text>
        <text x="${colX[3] + 24}" y="14" text-anchor="middle" font-size="8" font-weight="800" fill="#ffffff">Y (mm)</text>
        <text x="${colX[4] + 4}" y="14" font-size="8" font-weight="800" fill="#ffffff">DELİK / KESİM ÖZELLİĞİ (SPEC)</text>
        <text x="${colX[5] + 4}" y="14" font-size="8" font-weight="800" fill="#ffffff">DERİNLİK</text>

        ${rowsSvg}
        ${colLines}

        <!-- Table Title Banner -->
        <text x="0" y="-6" font-size="9" font-weight="900" fill="${primaryStroke}" letter-spacing="0.5">
          🕳️ DELİK & KESİM KORDİNAT ÇİZELGESİ (${featureSchedule.length} Adet Özellik / ISO 7200)
        </text>
      </g>
    `;
  }

  const holeScheduleTableSvg = renderHoleScheduleTableSvg();

  // Notes box in bottom-left
  const notesSvg = cfg.notes && cfg.notes.length > 0 ? `
    <g transform="translate(${margin + 15}, ${sheetH - margin - 85})">
      <text x="0" y="0" font-size="9" font-weight="800" fill="${textPrimary}">ÖZEL NOTLAR (NOTES):</text>
      ${cfg.notes.map((n, idx) => `<text x="5" y="${14 + idx * 12}" font-size="8" fill="${textSecondary}">${n}</text>`).join('\n')}
    </g>` : '';

  // Drawing coordinate margins (A-D, 1-8)
  const gridCoordsSvg = `
    <g fill="${secondaryStroke}" font-size="8" font-weight="700">
      <text x="${sheetW / 4}" y="${margin - 5}" text-anchor="middle">1</text>
      <text x="${sheetW / 2}" y="${margin - 5}" text-anchor="middle">2</text>
      <text x="${(sheetW * 3) / 4}" y="${margin - 5}" text-anchor="middle">3</text>
      <text x="${margin - 8}" y="${sheetH / 3}" text-anchor="middle">A</text>
      <text x="${margin - 8}" y="${(sheetH * 2) / 3}" text-anchor="middle">B</text>
    </g>`;

  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${sheetW} ${sheetH}" width="100%" height="100%" style="background:${bgColor}; font-family:'Segoe UI', -apple-system, monospace;">
  <!-- BACKGROUND CANVAS RECT (Guarantees Dark / Blueprint background in all printers & PDF generators) -->
  <rect x="0" y="0" width="${sheetW}" height="${sheetH}" fill="${bgColor}" />

  <!-- ARROWHEAD MARKER -->
  <defs>
    <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="${primaryStroke}" />
    </marker>
  </defs>

  <!-- BORDER & TITLE FRAME -->
  <rect x="${margin}" y="${margin}" width="${sheetW - margin * 2}" height="${sheetH - margin * 2}" fill="none" stroke="${primaryStroke}" stroke-width="2.2" />
  <rect x="${margin + 5}" y="${margin + 5}" width="${sheetW - margin * 2 - 10}" height="${sheetH - margin * 2 - 10}" fill="none" stroke="${secondaryStroke}" stroke-width="0.8" />

  ${gridCoordsSvg}
  ${renderTitleBlock()}
  ${holeScheduleTableSvg}
  ${notesSvg}

  <!-- 1. FRONT VIEW (ÖN GÖRÜNÜŞ) -->
  <g transform="translate(${frontX}, ${frontY})">
    <text x="0" y="${sh / 2 + 42}" text-anchor="middle" font-size="11" font-weight="800" fill="${textPrimary}">ÖN GÖRÜNÜŞ (FRONT VIEW)</text>
    
    <!-- 3D Vector Projected Polygons -->
    ${frontSvg}

    <!-- Centerlines -->
    <line x1="${-sw / 2 - 15}" y1="0" x2="${sw / 2 + 15}" y2="0" stroke="${centerlineColor}" stroke-width="0.8" stroke-dasharray="10,3,2,3" />
    <line x1="0" y1="${-sh / 2 - 15}" x2="0" y2="${sh / 2 + 15}" stroke="${centerlineColor}" stroke-width="0.8" stroke-dasharray="10,3,2,3" />

    <!-- Hole & Feature Annotations -->
    ${frontViewHolesSvg}

    <!-- Width Dimension (Bottom) -->
    <line x1="${-sw / 2}" y1="${sh / 2 + 18}" x2="${sw / 2}" y2="${sh / 2 + 18}" stroke="${primaryStroke}" stroke-width="1.2" marker-start="url(#arrow)" marker-end="url(#arrow)" />
    <line x1="${-sw / 2}" y1="${sh / 2 + 6}" x2="${-sw / 2}" y2="${sh / 2 + 25}" stroke="${primaryStroke}" stroke-width="0.8" />
    <line x1="${sw / 2}" y1="${sh / 2 + 6}" x2="${sw / 2}" y2="${sh / 2 + 25}" stroke="${primaryStroke}" stroke-width="0.8" />
    <text x="0" y="${sh / 2 + 14}" text-anchor="middle" font-size="10" font-weight="700" fill="${textPrimary}">${dimW} mm</text>

    <!-- Height Dimension (Left) -->
    <line x1="${-sw / 2 - 18}" y1="${-sh / 2}" x2="${-sw / 2 - 18}" y2="${sh / 2}" stroke="${primaryStroke}" stroke-width="1.2" marker-start="url(#arrow)" marker-end="url(#arrow)" />
    <line x1="${-sw / 2 - 25}" y1="${-sh / 2}" x2="${-sw / 2 - 6}" y2="${-sh / 2}" stroke="${primaryStroke}" stroke-width="0.8" />
    <line x1="${-sw / 2 - 25}" y1="${sh / 2}" x2="${-sw / 2 - 6}" y2="${sh / 2}" stroke="${primaryStroke}" stroke-width="0.8" />
    <text x="${-sw / 2 - 23}" y="4" text-anchor="middle" transform="rotate(-90 ${-sw / 2 - 23} 0)" font-size="10" font-weight="700" fill="${textPrimary}">${dimH} mm</text>
  </g>

  <!-- 2. TOP VIEW (ÜST GÖRÜNÜŞ) -->
  <g transform="translate(${topX}, ${topY})">
    <text x="0" y="${-sd / 2 - 25}" text-anchor="middle" font-size="11" font-weight="800" fill="${textPrimary}">ÜST GÖRÜNÜŞ (TOP VIEW)</text>
    
    <!-- 3D Vector Projected Polygons -->
    ${topSvg}

    <!-- Centerlines -->
    <line x1="${-sw / 2 - 15}" y1="0" x2="${sw / 2 + 15}" y2="0" stroke="${centerlineColor}" stroke-width="0.8" stroke-dasharray="10,3,2,3" />
    <line x1="0" y1="${-sd / 2 - 15}" x2="0" y2="${sd / 2 + 15}" stroke="${centerlineColor}" stroke-width="0.8" stroke-dasharray="10,3,2,3" />

    <!-- Hole & Feature Annotations (incl. PCD Circle) -->
    ${topViewHolesSvg}

    <!-- Depth Dimension (Right) -->
    <line x1="${sw / 2 + 18}" y1="${-sd / 2}" x2="${sw / 2 + 18}" y2="${sd / 2}" stroke="${primaryStroke}" stroke-width="1.2" marker-start="url(#arrow)" marker-end="url(#arrow)" />
    <line x1="${sw / 2 + 6}" y1="${-sd / 2}" x2="${sw / 2 + 25}" y2="${-sd / 2}" stroke="${primaryStroke}" stroke-width="0.8" />
    <line x1="${sw / 2 + 6}" y1="${sd / 2}" x2="${sw / 2 + 25}" y2="${sd / 2}" stroke="${primaryStroke}" stroke-width="0.8" />
    <text x="${sw / 2 + 28}" y="4" text-anchor="middle" transform="rotate(90 ${sw / 2 + 28} 0)" font-size="10" font-weight="700" fill="${textPrimary}">${dimD} mm</text>
  </g>

  <!-- 3. RIGHT SIDE VIEW (SAĞ YAN GÖRÜNÜŞ) -->
  <g transform="translate(${rightX}, ${rightY})">
    <text x="0" y="${sh / 2 + 42}" text-anchor="middle" font-size="11" font-weight="800" fill="${textPrimary}">YAN GÖRÜNÜŞ (SIDE VIEW)</text>
    
    <!-- 3D Vector Projected Polygons -->
    ${rightSvg}

    <!-- Centerlines -->
    <line x1="${-sd / 2 - 15}" y1="0" x2="${sd / 2 + 15}" y2="0" stroke="${centerlineColor}" stroke-width="0.8" stroke-dasharray="10,3,2,3" />
    <line x1="0" y1="${-sh / 2 - 15}" x2="0" y2="${sh / 2 + 15}" stroke="${centerlineColor}" stroke-width="0.8" stroke-dasharray="10,3,2,3" />

    <!-- Hole & Feature Annotations -->
    ${rightViewHolesSvg}
  </g>

  <!-- 4. 3D ISOMETRIC PROJECTION VIEW -->
  <g transform="translate(${isoX}, ${isoY})">
    <text x="0" y="${-sh * 0.9 - 15}" text-anchor="middle" font-size="11" font-weight="800" fill="${textPrimary}">İZOMETRİK 3D (ISOMETRIC)</text>

    <!-- 3D Vector Projected Axonometric Geometry -->
    ${isoSvg}
  </g>
</svg>
  `.trim();
}

/**
 * Generates a clean, multi-page printable HTML document containing technical drawings
 * for all parts in the assembly + overview, complete with page break CSS for direct PDF export.
 */
export function generateBatchDrawingsHTML(
  sheets: Array<{ target: DesignPart | DesignPart[]; massProps: MassProperties; config: Partial<DrawingSheetConfig> }>,
  globalTitle: string = 'ALUCALCULATOR CAD Portfolio'
): string {
  const theme = sheets[0]?.config?.colorTheme || 'classic';
  const isThemeBlueprint = theme === 'blueprint';
  const isThemeDark = theme === 'dark';
  const pageBg = isThemeBlueprint ? '#091833' : isThemeDark ? '#080c14' : '#ffffff';
  const bodyBg = isThemeBlueprint ? '#040b17' : isThemeDark ? '#030712' : '#0f172a';
  const textColor = isThemeBlueprint ? '#f0f9ff' : isThemeDark ? '#f8fafc' : '#f8fafc';

  const svgPages = sheets.map((item, idx) => {
    const svg = generateTechnicalDrawingSVG(item.target, item.massProps, item.config);
    return `
    <div class="drawing-page" id="page-${idx + 1}">
      ${svg}
    </div>`;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <title>${globalTitle}</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }
    html {
      background: ${bodyBg};
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      background: ${bodyBg};
      color: ${textColor};
      font-family: 'Segoe UI', -apple-system, sans-serif;
      padding: 24px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 32px;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .toolbar {
      position: sticky;
      top: 12px;
      z-index: 100;
      background: rgba(15, 23, 42, 0.95);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 16px;
      padding: 10px 24px;
      display: flex;
      align-items: center;
      gap: 16px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
    }
    .toolbar button {
      background: linear-gradient(135deg, #0284c7, #38bdf8);
      color: #040812;
      border: none;
      font-weight: 800;
      font-size: 13px;
      padding: 8px 18px;
      border-radius: 10px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s;
    }
    .toolbar button:hover {
      filter: brightness(1.15);
      transform: translateY(-1px);
    }
    .toolbar span {
      font-size: 13px;
      color: #94a3b8;
      font-weight: 600;
    }
    .drawing-page {
      width: 100%;
      max-width: 1188px;
      background: ${pageBg} !important;
      border-radius: 12px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
      overflow: hidden;
      page-break-after: always;
      page-break-inside: avoid;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .drawing-page svg {
      width: 100%;
      height: auto;
      display: block;
      background: ${pageBg} !important;
    }

    @media print {
      @page {
        size: A3 landscape;
        margin: 0;
      }
      html, body {
        background: ${pageBg} !important;
        padding: 0 !important;
        margin: 0 !important;
        gap: 0 !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      .toolbar {
        display: none !important;
      }
      .drawing-page {
        border-radius: 0 !important;
        box-shadow: none !important;
        max-width: none !important;
        width: 100vw !important;
        height: 100vh !important;
        background: ${pageBg} !important;
        page-break-after: always !important;
        page-break-inside: avoid !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      .drawing-page svg {
        width: 100vw !important;
        height: 100vh !important;
        background: ${pageBg} !important;
      }
    }
  </style>
</head>
<body>
  <div class="toolbar">
    <span>📑 Toplu Teknik Resim Portföyü (${sheets.length} Sayfa)</span>
    <button onclick="window.print()">🖨️ Tümünü PDF Olarak Kaydet / Yazdır</button>
  </div>
  ${svgPages}
</body>
</html>`;
}


