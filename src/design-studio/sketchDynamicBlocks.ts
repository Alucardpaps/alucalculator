/**
 * 📐 SKETCH DYNAMIC BLOCKS ENGINE
 * Parametric 2D block stamps for 3D CAD sketch planes (Engineering + Automotive/Mould/Sculpt).
 * Generates closed 2D loop contours and construction reference lines.
 */

import { Point2D } from './designStore';

export interface SketchDynamicBlockDef {
  id: string;
  nameTr: string;
  nameEn: string;
  category: 'mechanical' | 'automotive_mould' | 'artistic';
  descriptionTr: string;
  descriptionEn: string;
  icon: string;
  params: Record<string, { labelTr: string; labelEn: string; default: number; min: number; max: number; step?: number }>;
  generate: (center: Point2D, params: Record<string, number>) => {
    solidLoops: Point2D[][];
    constructionLoops?: Point2D[][];
  };
}

export const SKETCH_DYNAMIC_BLOCKS: SketchDynamicBlockDef[] = [
  // ─── 1. DAİRESEL DELİK DİZİSİ (PCD BOLT CIRCLE) ───
  {
    id: 'bolt_circle',
    nameTr: 'Cıvata Çemberi (PCD Delik Dizisi)',
    nameEn: 'Bolt Circle (PCD Hole Pattern)',
    category: 'mechanical',
    descriptionTr: 'Flanş ve kapak bağlantıları için dairesel cıvata delik dizisi',
    descriptionEn: 'Circular bolt pattern for flanges and pipe end caps',
    icon: '⭕',
    params: {
      pcdDia: { labelTr: 'PCD Çapı (mm)', labelEn: 'PCD Diameter (mm)', default: 60, min: 10, max: 500, step: 1 },
      holeCount: { labelTr: 'Delik Adedi', labelEn: 'Hole Count', default: 4, min: 2, max: 24, step: 1 },
      holeDia: { labelTr: 'Delik Çapı (mm)', labelEn: 'Hole Diameter (mm)', default: 6.5, min: 1, max: 50, step: 0.5 },
      startAngle: { labelTr: 'Başlangıç Açısı (°)', labelEn: 'Start Angle (°)', default: 45, min: 0, max: 360, step: 5 },
    },
    generate: (center, p) => {
      const pcdR = (p.pcdDia || 60) / 2;
      const count = Math.max(2, Math.round(p.holeCount || 4));
      const holeR = Math.max(0.5, (p.holeDia || 6.5) / 2);
      const startRad = (((p.startAngle ?? 45) * Math.PI) / 180);

      const solidLoops: Point2D[][] = [];

      // Generate each hole as a closed 24-point circle
      for (let i = 0; i < count; i++) {
        const theta = startRad + (i * 2 * Math.PI) / count;
        const hx = center.x + Math.cos(theta) * pcdR;
        const hy = center.y + Math.sin(theta) * pcdR;
        const holePts: Point2D[] = [];
        const segs = 20;
        for (let s = 0; s < segs; s++) {
          const a = (s / segs) * Math.PI * 2;
          holePts.push({
            x: Math.round((hx + Math.cos(a) * holeR) * 10) / 10,
            y: Math.round((hy + Math.sin(a) * holeR) * 10) / 10,
          });
        }
        solidLoops.push(holePts);
      }

      // Construction PCD circle
      const pcdCircle: Point2D[] = [];
      const pcdSegs = 36;
      for (let s = 0; s < pcdSegs; s++) {
        const a = (s / pcdSegs) * Math.PI * 2;
        pcdCircle.push({
          x: Math.round((center.x + Math.cos(a) * pcdR) * 10) / 10,
          y: Math.round((center.y + Math.sin(a) * pcdR) * 10) / 10,
        });
      }

      return { solidLoops, constructionLoops: [pcdCircle] };
    },
  },

  // ─── 2. STANDART MONTAJ SLOTU (OBLONG MOUNTING SLOT) ───
  {
    id: 'mounting_slot',
    nameTr: 'Montaj Slotu (Oval Ayar Kanalı)',
    nameEn: 'Mounting Slot (Oval Slider Slot)',
    category: 'mechanical',
    descriptionTr: 'Ayarlanabilir cıvata bağlantısı için radyal kavisli montaj yuvası',
    descriptionEn: 'Elongated slot with rounded semicircular ends for bolt position adjustment',
    icon: '💊',
    params: {
      length: { labelTr: 'Slot Boyu (mm)', labelEn: 'Slot Length (mm)', default: 40, min: 5, max: 300, step: 1 },
      width: { labelTr: 'Slot Genişliği (mm)', labelEn: 'Slot Width (mm)', default: 12, min: 2, max: 100, step: 1 },
      angleDeg: { labelTr: 'Dönme Açısı (°)', labelEn: 'Rotation Angle (°)', default: 0, min: 0, max: 360, step: 15 },
    },
    generate: (center, p) => {
      const L = Math.max(4, p.length || 40);
      const W = Math.max(2, p.width || 12);
      const r = W / 2;
      const straightL = Math.max(0.1, L - W);
      const halfStraight = straightL / 2;
      const ang = (((p.angleDeg || 0) * Math.PI) / 180);

      const localPts: Point2D[] = [];
      const arcSegs = 10;

      // Right semicircular cap (from -90 to +90 deg)
      for (let i = 0; i <= arcSegs; i++) {
        const a = -Math.PI / 2 + (i / arcSegs) * Math.PI;
        localPts.push({ x: halfStraight + Math.cos(a) * r, y: Math.sin(a) * r });
      }

      // Left semicircular cap (from +90 to +270 deg)
      for (let i = 0; i <= arcSegs; i++) {
        const a = Math.PI / 2 + (i / arcSegs) * Math.PI;
        localPts.push({ x: -halfStraight + Math.cos(a) * r, y: Math.sin(a) * r });
      }

      // Rotate and translate to center
      const rotatedPts: Point2D[] = localPts.map((pt) => {
        const rx = pt.x * Math.cos(ang) - pt.y * Math.sin(ang);
        const ry = pt.x * Math.sin(ang) + pt.y * Math.cos(ang);
        return {
          x: Math.round((center.x + rx) * 10) / 10,
          y: Math.round((center.y + ry) * 10) / 10,
        };
      });

      return { solidLoops: [rotatedPts] };
    },
  },

  // ─── 3. HAVALANDIRMA PANJURU / IZGARA (VENTILATION GRILL) ───
  {
    id: 'vent_louver',
    nameTr: 'Havalandırma Izgarası / Panjur',
    nameEn: 'Ventilation Grill (Louver Slits)',
    category: 'mechanical',
    descriptionTr: 'Sac pano, elektronik kutu ve motor gövdesi soğutma yarıkları',
    descriptionEn: 'Parallel cooling slits for chassis enclosures and heat dissipation',
    icon: '≡',
    params: {
      slitCount: { labelTr: 'Yarık Adedi', labelEn: 'Slit Count', default: 4, min: 2, max: 12, step: 1 },
      slitLength: { labelTr: 'Yarık Boyu (mm)', labelEn: 'Slit Length (mm)', default: 50, min: 10, max: 300, step: 5 },
      slitWidth: { labelTr: 'Yarık Genişliği (mm)', labelEn: 'Slit Width (mm)', default: 6, min: 2, max: 30, step: 1 },
      pitch: { labelTr: 'Adım Aralığı (mm)', labelEn: 'Pitch Spacing (mm)', default: 12, min: 4, max: 50, step: 1 },
    },
    generate: (center, p) => {
      const count = Math.max(1, Math.round(p.slitCount || 4));
      const L = Math.max(10, p.slitLength || 50);
      const W = Math.max(2, p.slitWidth || 6);
      const pitch = Math.max(W + 1, p.pitch || 12);
      const totalH = (count - 1) * pitch;
      const startY = center.y - totalH / 2;

      const solidLoops: Point2D[][] = [];
      const r = W / 2;
      const halfStraight = Math.max(1, (L - W) / 2);

      for (let c = 0; c < count; c++) {
        const curY = startY + c * pitch;
        const pts: Point2D[] = [];
        const arcSegs = 8;
        // Right cap
        for (let i = 0; i <= arcSegs; i++) {
          const a = -Math.PI / 2 + (i / arcSegs) * Math.PI;
          pts.push({
            x: Math.round((center.x + halfStraight + Math.cos(a) * r) * 10) / 10,
            y: Math.round((curY + Math.sin(a) * r) * 10) / 10,
          });
        }
        // Left cap
        for (let i = 0; i <= arcSegs; i++) {
          const a = Math.PI / 2 + (i / arcSegs) * Math.PI;
          pts.push({
            x: Math.round((center.x - halfStraight + Math.cos(a) * r) * 10) / 10,
            y: Math.round((curY + Math.sin(a) * r) * 10) / 10,
          });
        }
        solidLoops.push(pts);
      }

      return { solidLoops };
    },
  },

  // ─── 4. NEMA STEP MOTOR MONTAJ FLANŞI (NEMA MOTOR MOUNT) ───
  {
    id: 'nema_mount',
    nameTr: 'NEMA Step Motor Montaj Kesiti',
    nameEn: 'NEMA Stepper Motor Mount Cutout',
    category: 'mechanical',
    descriptionTr: 'NEMA 17/23/34 göbek deliği ve 4 köşe montaj cıvata delikleri',
    descriptionEn: 'Center pilot bore with 4-corner mounting screw clearance holes',
    icon: '⚙️',
    params: {
      frameSize: { labelTr: 'NEMA Tipi (17, 23, 34)', labelEn: 'NEMA Size (17, 23, 34)', default: 17, min: 17, max: 34, step: 6 },
    },
    generate: (center, p) => {
      const isN23 = p.frameSize >= 23 && p.frameSize < 34;
      const isN34 = p.frameSize >= 34;

      // Pilot bore diameter and hole center-to-center square
      const pilotR = isN34 ? 73 / 2 : isN23 ? 38.1 / 2 : 22 / 2;
      const holeSpacing = isN34 ? 69.6 : isN23 ? 47.1 : 31.0;
      const holeR = isN34 ? 5.5 / 2 : isN23 ? 5.2 / 2 : 3.5 / 2;

      const solidLoops: Point2D[][] = [];

      // Center pilot bore
      const centerCircle: Point2D[] = [];
      const segs = 28;
      for (let i = 0; i < segs; i++) {
        const a = (i / segs) * Math.PI * 2;
        centerCircle.push({
          x: Math.round((center.x + Math.cos(a) * pilotR) * 10) / 10,
          y: Math.round((center.y + Math.sin(a) * pilotR) * 10) / 10,
        });
      }
      solidLoops.push(centerCircle);

      // 4 Corner holes
      const halfS = holeSpacing / 2;
      const corners: [number, number][] = [
        [-halfS, -halfS],
        [halfS, -halfS],
        [halfS, halfS],
        [-halfS, halfS],
      ];

      corners.forEach(([dx, dy]) => {
        const holePts: Point2D[] = [];
        const hSegs = 16;
        for (let i = 0; i < hSegs; i++) {
          const a = (i / hSegs) * Math.PI * 2;
          holePts.push({
            x: Math.round((center.x + dx + Math.cos(a) * holeR) * 10) / 10,
            y: Math.round((center.y + dy + Math.sin(a) * holeR) * 10) / 10,
          });
        }
        solidLoops.push(holePts);
      });

      return { solidLoops };
    },
  },

  // ─── 5. DIN 6885 ŞAFT KAMA YUVASI (KEYWAY BORE) ───
  {
    id: 'din_keyway',
    nameTr: 'DIN 6885 Şaft Kama Kanalı',
    nameEn: 'DIN 6885 Shaft Keyway Bore',
    category: 'mechanical',
    descriptionTr: 'Döner mil kasnak/dişli kilitleme kaması ve dairesel delik',
    descriptionEn: 'Shaft bore profile with standard rectangular keyway slot for mechanical torque transfer',
    icon: '🔑',
    params: {
      boreDia: { labelTr: 'Mil Çapı (d mm)', labelEn: 'Shaft Diameter (mm)', default: 25, min: 8, max: 120, step: 1 },
      keyWidth: { labelTr: 'Kama Genişliği (b mm)', labelEn: 'Key Width (mm)', default: 8, min: 2, max: 32, step: 0.5 },
      keyDepth: { labelTr: 'Kama Derinliği (t mm)', labelEn: 'Key Depth (mm)', default: 3.3, min: 1, max: 20, step: 0.1 },
    },
    generate: (center, p) => {
      const R = (p.boreDia || 25) / 2;
      const b = p.keyWidth || 8;
      const t = p.keyDepth || 3.3;
      const halfB = b / 2;

      const pts: Point2D[] = [];
      const segs = 32;

      // Calculate intersection angle of keyway slot edges with circle
      const keyHalfAngle = Math.asin(Math.min(0.95, halfB / R));
      const topAngle = Math.PI / 2;

      // Circle arc outside keyway notch
      const startAngle = topAngle + keyHalfAngle;
      const endAngle = topAngle - keyHalfAngle + Math.PI * 2;

      for (let i = 0; i <= segs; i++) {
        const a = startAngle + (i / segs) * (endAngle - startAngle);
        pts.push({
          x: Math.round((center.x + Math.cos(a) * R) * 10) / 10,
          y: Math.round((center.y + Math.sin(a) * R) * 10) / 10,
        });
      }

      // Add rectangular key notch at top
      const keyTopY = R + t;
      pts.push({ x: Math.round((center.x + halfB) * 10) / 10, y: Math.round((center.y + keyTopY) * 10) / 10 });
      pts.push({ x: Math.round((center.x - halfB) * 10) / 10, y: Math.round((center.y + keyTopY) * 10) / 10 });

      return { solidLoops: [pts] };
    },
  },

  // ─── 6. ALTIGEN SOMUN CEBİ (HEX NUT POCKET) ───
  {
    id: 'hex_pocket',
    nameTr: 'Altıgen Somun Cebi (DIN 934)',
    nameEn: 'Hex Nut Pocket (DIN 934)',
    category: 'mechanical',
    descriptionTr: 'Parça yüzeyine gömülebilen altıgen somun veya cıvata başı yuvası',
    descriptionEn: 'Recessed hexagon socket for flush nut or bolt head embedding',
    icon: '🛑',
    params: {
      acrossFlats: { labelTr: 'Anahtar Ağzı s (mm)', labelEn: 'Across Flats (mm)', default: 13, min: 4, max: 80, step: 0.5 },
    },
    generate: (center, p) => {
      const s = p.acrossFlats || 13;
      // In a regular hexagon, distance across flats s = 2 * r_in = sqrt(3) * R
      const R = s / Math.sqrt(3);
      const pts: Point2D[] = [];

      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3 + Math.PI / 6;
        pts.push({
          x: Math.round((center.x + Math.cos(a) * R) * 10) / 10,
          y: Math.round((center.y + Math.sin(a) * R) * 10) / 10,
        });
      }

      return { solidLoops: [pts] };
    },
  },

  // ─── 7. AERODİNAMİK KANAT / ARABA KAPORTA KAVİSİ (NACA 0012 AIRFOIL) ───
  {
    id: 'aero_wing',
    nameTr: 'Aerodinamik Kanat & Kaporta Kavis Profili',
    nameEn: 'Aero Airfoil & Car Body Curve (NACA 0012)',
    category: 'automotive_mould',
    descriptionTr: 'Araba tasarımı, rüzgarlık, difüzör ve kalıp yüzeyi için aerodinamik akış eğrisi',
    descriptionEn: 'NACA symmetrical 4-digit airfoil streamline curve for automotive spoilers, diffusers & moulds',
    icon: '🏎️',
    params: {
      chordLength: { labelTr: 'Kord Uzunluğu (mm)', labelEn: 'Chord Length (mm)', default: 90, min: 20, max: 600, step: 5 },
      thicknessPct: { labelTr: 'Kalınlık Oranı (%)', labelEn: 'Thickness (%)', default: 12, min: 4, max: 30, step: 1 },
      angleDeg: { labelTr: 'Hücum Açısı (°)', labelEn: 'Angle of Attack (°)', default: 0, min: -45, max: 45, step: 1 },
    },
    generate: (center, p) => {
      const c = Math.max(20, p.chordLength || 90);
      const t = Math.max(0.04, (p.thicknessPct || 12) / 100);
      const ang = (((p.angleDeg || 0) * Math.PI) / 180);

      const upperPts: Point2D[] = [];
      const lowerPts: Point2D[] = [];
      const samples = 24;

      // NACA 4-digit thickness distribution equation
      for (let i = 0; i <= samples; i++) {
        // Cosine spacing for denser points at leading edge
        const beta = (i / samples) * Math.PI;
        const xNorm = (1 - Math.cos(beta)) / 2; // 0 to 1
        const x = xNorm * c;

        const yt =
          5 *
          t *
          c *
          (0.2969 * Math.sqrt(Math.max(0, xNorm)) -
            0.126 * xNorm -
            0.3516 * Math.pow(xNorm, 2) +
            0.2843 * Math.pow(xNorm, 3) -
            0.1015 * Math.pow(xNorm, 4));

        upperPts.push({ x: x - c / 2, y: yt });
        if (i > 0 && i < samples) {
          lowerPts.push({ x: x - c / 2, y: -yt });
        }
      }

      // Combine upper from 0..samples, then lower from samples-1 down to 1
      const fullContour = [...upperPts, ...lowerPts.reverse()];

      // Apply rotation and center offset
      const pts: Point2D[] = fullContour.map((pt) => {
        const rx = pt.x * Math.cos(ang) - pt.y * Math.sin(ang);
        const ry = pt.x * Math.sin(ang) + pt.y * Math.cos(ang);
        return {
          x: Math.round((center.x + rx) * 10) / 10,
          y: Math.round((center.y + ry) * 10) / 10,
        };
      });

      return { solidLoops: [pts] };
    },
  },

  // ─── 8. ERGONOMİK KULP & TUTAMAK YUVASI (ERGONOMIC HANDLE PROFILE) ───
  {
    id: 'ergonomic_handle',
    nameTr: 'Ergonomik Kulp & Tutamak Formu',
    nameEn: 'Ergonomic Handle & Grip Profile',
    category: 'artistic',
    descriptionTr: 'Parmak yuvalı ergonomik el tutamağı ve endüstriyel ürün gövde boşluğu',
    descriptionEn: 'Finger-contoured ergonomic handle and industrial product grip cavity',
    icon: '🖐️',
    params: {
      length: { labelTr: 'Tutamak Boyu (mm)', labelEn: 'Grip Length (mm)', default: 95, min: 40, max: 250, step: 5 },
      width: { labelTr: 'Genişlik (mm)', labelEn: 'Grip Width (mm)', default: 28, min: 10, max: 80, step: 1 },
      fingerGrooves: { labelTr: 'Parmak Yarığı Adedi', labelEn: 'Finger Grooves', default: 4, min: 2, max: 5, step: 1 },
    },
    generate: (center, p) => {
      const L = Math.max(40, p.length || 95);
      const W = Math.max(10, p.width || 28);
      const grooves = Math.max(2, Math.round(p.fingerGrooves || 4));
      const halfL = L / 2;
      const halfW = W / 2;

      const pts: Point2D[] = [];

      // Top smooth contour
      const topSegs = 16;
      for (let i = 0; i <= topSegs; i++) {
        const t = i / topSegs;
        const x = -halfL + t * L;
        const arch = Math.sin(t * Math.PI) * 4;
        pts.push({
          x: Math.round((center.x + x) * 10) / 10,
          y: Math.round((center.y + halfW + arch) * 10) / 10,
        });
      }

      // Bottom scalloped finger indentations
      const bottomSegs = 24;
      for (let i = bottomSegs; i >= 0; i--) {
        const t = i / bottomSegs;
        const x = -halfL + t * L;
        const grooveWiggle = Math.sin(t * Math.PI * grooves) * 3;
        pts.push({
          x: Math.round((center.x + x) * 10) / 10,
          y: Math.round((center.y - halfW + grooveWiggle) * 10) / 10,
        });
      }

      return { solidLoops: [pts] };
    },
  },

  // ─── 9. KALIP AYRIM HATTI & RADYUSLU BOŞLUK (MOULD CAVITY) ───
  {
    id: 'mould_cavity',
    nameTr: 'Kalıp Boşluğu & Ayrım Hattı Yuvası',
    nameEn: 'Mould Cavity & Parting Pocket',
    category: 'automotive_mould',
    descriptionTr: 'Enjeksiyon kalıp dişi/erkek yuva ve yuvarlatılmış talaşlı imalat cebi',
    descriptionEn: 'Injection moulding core/cavity relief and rounded CNC machining pocket',
    icon: '🧊',
    params: {
      width: { labelTr: 'Kalıp Eni (mm)', labelEn: 'Cavity Width (mm)', default: 70, min: 10, max: 400, step: 5 },
      height: { labelTr: 'Kalıp Boyu (mm)', labelEn: 'Cavity Height (mm)', default: 50, min: 10, max: 400, step: 5 },
      cornerR: { labelTr: 'Köşe Radius R (mm)', labelEn: 'Corner Radius (mm)', default: 8, min: 1, max: 40, step: 1 },
    },
    generate: (center, p) => {
      const W = Math.max(10, p.width || 70);
      const H = Math.max(10, p.height || 50);
      const maxR = Math.min(W, H) / 2 - 1;
      const R = Math.max(1, Math.min(maxR, p.cornerR || 8));
      const hw = W / 2;
      const hh = H / 2;

      const pts: Point2D[] = [];
      const arcSegs = 6;

      // Top-Right corner
      for (let i = 0; i <= arcSegs; i++) {
        const a = (i / arcSegs) * (Math.PI / 2);
        pts.push({
          x: Math.round((center.x + (hw - R) + Math.cos(a) * R) * 10) / 10,
          y: Math.round((center.y + (hh - R) + Math.sin(a) * R) * 10) / 10,
        });
      }

      // Top-Left corner
      for (let i = 0; i <= arcSegs; i++) {
        const a = Math.PI / 2 + (i / arcSegs) * (Math.PI / 2);
        pts.push({
          x: Math.round((center.x - (hw - R) + Math.cos(a) * R) * 10) / 10,
          y: Math.round((center.y + (hh - R) + Math.sin(a) * R) * 10) / 10,
        });
      }

      // Bottom-Left corner
      for (let i = 0; i <= arcSegs; i++) {
        const a = Math.PI + (i / arcSegs) * (Math.PI / 2);
        pts.push({
          x: Math.round((center.x - (hw - R) + Math.cos(a) * R) * 10) / 10,
          y: Math.round((center.y - (hh - R) + Math.sin(a) * R) * 10) / 10,
        });
      }

      // Bottom-Right corner
      for (let i = 0; i <= arcSegs; i++) {
        const a = (3 * Math.PI) / 2 + (i / arcSegs) * (Math.PI / 2);
        pts.push({
          x: Math.round((center.x + (hw - R) + Math.cos(a) * R) * 10) / 10,
          y: Math.round((center.y - (hh - R) + Math.sin(a) * R) * 10) / 10,
        });
      }

      return { solidLoops: [pts] };
    },
  },

  // ─── 10. FİGÜR / KARAKTER & HEYKEL KAİDESİ (ORGANIC PEDESTAL / STATUE BASE) ───
  {
    id: 'organic_pedestal',
    nameTr: 'Figür & Heykel Kaidesi (Taban Formu)',
    nameEn: 'Figurine / Statue Pedestal Base',
    category: 'artistic',
    descriptionTr: '3B baskı heykelcikler, figürler ve organik model kaideleri için basamaklı taban profili',
    descriptionEn: 'Stepped organic base contour for 3D printed figurines, tabletop miniatures & statues',
    icon: '🗿',
    params: {
      diameter: { labelTr: 'Taban Çapı (mm)', labelEn: 'Base Diameter (mm)', default: 60, min: 20, max: 200, step: 5 },
      facets: { labelTr: 'Köşe / Dilim Sayısı', labelEn: 'Facets / Segments', default: 8, min: 4, max: 24, step: 1 },
      flutingDepth: { labelTr: 'Kavis Derinliği (mm)', labelEn: 'Fluting Depth (mm)', default: 3, min: 0, max: 15, step: 0.5 },
    },
    generate: (center, p) => {
      const R = (p.diameter || 60) / 2;
      const facets = Math.max(4, Math.round(p.facets || 8));
      const fluting = p.flutingDepth ?? 3;

      const pts: Point2D[] = [];
      const totalPoints = facets * 6;

      for (let i = 0; i < totalPoints; i++) {
        const theta = (i / totalPoints) * Math.PI * 2;
        const wave = Math.sin(theta * facets) * fluting;
        const curR = R + wave;
        pts.push({
          x: Math.round((center.x + Math.cos(theta) * curR) * 10) / 10,
          y: Math.round((center.y + Math.sin(theta) * curR) * 10) / 10,
        });
      }

      return { solidLoops: [pts] };
    },
  },

  // ─── 11. DIN 471 / DIN 472 SEGMAN KANALI (CIRCLIP / RETAINING RING GROOVE) ───
  {
    id: 'din_circlip_groove',
    nameTr: 'DIN 471 / DIN 472 Segman Kanalı (Eksenel Halka)',
    nameEn: 'DIN 471 / DIN 472 Circlip Retaining Groove',
    category: 'mechanical',
    descriptionTr: 'Miller (DIN 471 dış segman) ve yuvalar (DIN 472 iç segman) için standart eksenel tutma kanalı',
    descriptionEn: 'Normative retaining ring / circlip groove for external shafts (DIN 471) or internal bores (DIN 472)',
    icon: '⭕',
    params: {
      dia: { labelTr: 'Mil / Yuva Anma Çapı d1 (mm)', labelEn: 'Shaft / Bore Nominal Dia (mm)', default: 25, min: 4, max: 200, step: 1 },
      width: { labelTr: 'Kanal Genişliği m (mm)', labelEn: 'Groove Width m (mm)', default: 1.3, min: 0.5, max: 10, step: 0.1 },
      depth: { labelTr: 'Kanal Derinliği t (mm)', labelEn: 'Groove Depth t (mm)', default: 0.9, min: 0.2, max: 10, step: 0.1 },
      isInternal: { labelTr: 'Kanal Tipi (0=Mil DIN 471, 1=Kovan DIN 472)', labelEn: 'Type (0=Shaft DIN 471, 1=Bore DIN 472)', default: 0, min: 0, max: 1, step: 1 },
    },
    generate: (center, p) => {
      const d1 = Math.max(4, p.dia || 25);
      const t = Math.max(0.1, p.depth || 0.9);
      const isInternal = Math.round(p.isInternal || 0) === 1;

      // Groove diameter d2 (external) or d3 (internal)
      const grooveDia = isInternal ? d1 + 2 * t : Math.max(1, d1 - 2 * t);
      const grooveR = grooveDia / 2;
      const refR = d1 / 2;

      const solidPts: Point2D[] = [];
      const segs = 32;
      for (let i = 0; i < segs; i++) {
        const a = (i / segs) * Math.PI * 2;
        solidPts.push({
          x: Math.round((center.x + Math.cos(a) * grooveR) * 10) / 10,
          y: Math.round((center.y + Math.sin(a) * grooveR) * 10) / 10,
        });
      }

      const constrPts: Point2D[] = [];
      for (let i = 0; i < segs; i++) {
        const a = (i / segs) * Math.PI * 2;
        constrPts.push({
          x: Math.round((center.x + Math.cos(a) * refR) * 10) / 10,
          y: Math.round((center.y + Math.sin(a) * refR) * 10) / 10,
        });
      }

      return { solidLoops: [solidPts], constructionLoops: [constrPts] };
    },
  },

  // ─── 12. DIN 3760 DÖNER MİL YAĞ KEÇESİ YUVASI (RADIAL SHAFT SEAL BORE) ───
  {
    id: 'din_radial_seal',
    nameTr: 'DIN 3760 Döner Mil Yağ Keçesi Yuvası',
    nameEn: 'DIN 3760 Radial Shaft Seal Bore (Oil Seal)',
    category: 'mechanical',
    descriptionTr: 'DIN 3760 Form A/AS döner mil keçeleri için 20° pahlı kovan delik ve dayama faturası profili',
    descriptionEn: 'DIN 3760 Form A/AS rotary oil seal counterbore with 20° lead-in chamfer and retaining shoulder',
    icon: '🎯',
    params: {
      shaftDia: { labelTr: 'Mil Çapı d (mm)', labelEn: 'Shaft Diameter d (mm)', default: 25, min: 6, max: 150, step: 1 },
      sealOD: { labelTr: 'Keçe Dış Çapı D (mm)', labelEn: 'Seal Outer Diameter D (mm)', default: 42, min: 12, max: 200, step: 1 },
      sealWidth: { labelTr: 'Keçe Genişliği b (mm)', labelEn: 'Seal Width b (mm)', default: 7, min: 3, max: 25, step: 0.5 },
    },
    generate: (center, p) => {
      const d = Math.max(4, p.shaftDia || 25);
      const D = Math.max(d + 4, p.sealOD || 42);
      const sealR = D / 2;
      const clearanceR = (d + 2) / 2;
      const shaftR = d / 2;
      const chamferR = sealR + 1.0;

      const segs = 32;
      // Outer seal counterbore
      const outerBore: Point2D[] = [];
      for (let i = 0; i < segs; i++) {
        const a = (i / segs) * Math.PI * 2;
        outerBore.push({
          x: Math.round((center.x + Math.cos(a) * sealR) * 10) / 10,
          y: Math.round((center.y + Math.sin(a) * sealR) * 10) / 10,
        });
      }

      // Inner shaft clearance through-bore
      const innerClearance: Point2D[] = [];
      for (let i = 0; i < segs; i++) {
        const a = (i / segs) * Math.PI * 2;
        innerClearance.push({
          x: Math.round((center.x + Math.cos(a) * clearanceR) * 10) / 10,
          y: Math.round((center.y + Math.sin(a) * clearanceR) * 10) / 10,
        });
      }

      // Construction: Shaft reference circle & lead-in chamfer circle
      const shaftRef: Point2D[] = [];
      const chamferRef: Point2D[] = [];
      for (let i = 0; i < segs; i++) {
        const a = (i / segs) * Math.PI * 2;
        shaftRef.push({
          x: Math.round((center.x + Math.cos(a) * shaftR) * 10) / 10,
          y: Math.round((center.y + Math.sin(a) * shaftR) * 10) / 10,
        });
        chamferRef.push({
          x: Math.round((center.x + Math.cos(a) * chamferR) * 10) / 10,
          y: Math.round((center.y + Math.sin(a) * chamferR) * 10) / 10,
        });
      }

      return {
        solidLoops: [outerBore, innerClearance],
        constructionLoops: [shaftRef, chamferRef],
      };
    },
  },

  // ─── 13. ISO 3601 / AS568 O-RING SIZDIRMAZLIK KANALI (O-RING GLAND) ───
  {
    id: 'iso_oring_gland',
    nameTr: 'ISO 3601 / AS568 O-Ring Sızdırmazlık Kanalı',
    nameEn: 'ISO 3601 / AS568 O-Ring Sealing Gland',
    category: 'mechanical',
    descriptionTr: 'Alın veya radyal sızdırmazlık için ISO 3601 standartlarında O-ring yuvası konsantrik profili',
    descriptionEn: 'Concentric O-ring face or radial gland sealing track complying with ISO 3601-2 and AS568',
    icon: '🍩',
    params: {
      innerDia: { labelTr: 'Kanal İç Çapı d1 (mm)', labelEn: 'Groove Inner Diameter (mm)', default: 32, min: 4, max: 250, step: 1 },
      grooveWidth: { labelTr: 'Kanal Genişliği b (mm)', labelEn: 'Groove Width b (mm)', default: 3.6, min: 1.0, max: 15, step: 0.2 },
      grooveDepth: { labelTr: 'Kanal Derinliği h (mm)', labelEn: 'Groove Depth h (mm)', default: 2.4, min: 0.5, max: 12, step: 0.1 },
    },
    generate: (center, p) => {
      const d1 = Math.max(4, p.innerDia || 32);
      const b = Math.max(1, p.grooveWidth || 3.6);
      const d2 = d1 + 2 * b;

      const rInner = d1 / 2;
      const rOuter = d2 / 2;
      const rMean = (rInner + rOuter) / 2;

      const segs = 32;
      const innerLoop: Point2D[] = [];
      const outerLoop: Point2D[] = [];
      const meanLoop: Point2D[] = [];

      for (let i = 0; i < segs; i++) {
        const a = (i / segs) * Math.PI * 2;
        innerLoop.push({
          x: Math.round((center.x + Math.cos(a) * rInner) * 10) / 10,
          y: Math.round((center.y + Math.sin(a) * rInner) * 10) / 10,
        });
        outerLoop.push({
          x: Math.round((center.x + Math.cos(a) * rOuter) * 10) / 10,
          y: Math.round((center.y + Math.sin(a) * rOuter) * 10) / 10,
        });
        meanLoop.push({
          x: Math.round((center.x + Math.cos(a) * rMean) * 10) / 10,
          y: Math.round((center.y + Math.sin(a) * rMean) * 10) / 10,
        });
      }

      return {
        solidLoops: [outerLoop, innerLoop],
        constructionLoops: [meanLoop],
      };
    },
  },

  // ─── 14. DIN EN 12020 ALÜMİNYUM T-SLOT (SİGMA) PROFİL KESİTİ ───
  {
    id: 'tslot_extrusion_contour',
    nameTr: 'DIN EN 12020 Alüminyum T-Slot (Sigma) Profil Kesiti',
    nameEn: 'DIN EN 12020 Aluminum T-Slot (Sigma) Profile Contour',
    category: 'mechanical',
    descriptionTr: '2020 / 3030 / 4040 modüler şasi profillerinin doğrudan 3B katıya yükseltilebilen 4 kanallı tam 2B kesit çizimi',
    descriptionEn: 'Parametric 2020/3030/4040 modular aluminum extrusion cross-section with 4 standard T-slots and central core bore',
    icon: '🏗️',
    params: {
      profileSize: { labelTr: 'Profil Kesit Boyutu (mm)', labelEn: 'Profile Size (mm)', default: 40, min: 20, max: 80, step: 10 },
      slotWidth: { labelTr: 'Kanal Ağız Genişliği (mm)', labelEn: 'Slot Width (mm)', default: 8, min: 5, max: 12, step: 1 },
      coreDia: { labelTr: 'Göbek Delik Çapı (mm)', labelEn: 'Center Core Dia (mm)', default: 6.8, min: 3, max: 16, step: 0.2 },
    },
    generate: (center, p) => {
      const S = Math.max(20, p.profileSize || 40);
      const H = S / 2;
      const sw = Math.max(4, Math.min(S / 2 - 2, p.slotWidth || (S <= 20 ? 6 : 8)));
      const sb = Math.min(S - 4, sw * 1.75); // Slot cavity base width
      const sd = S * 0.22; // Slot depth
      const lt = Math.max(1.5, S * 0.05); // Lip thickness
      const c = Math.max(1.0, S * 0.04); // Corner chamfer
      const coreR = Math.max(1.5, (p.coreDia || (S <= 20 ? 4.2 : S <= 30 ? 5.0 : 6.8)) / 2);

      // Generate 1 quadrant (Top-Right to Bottom-Right etc) by rotating single side
      // Single side geometry along Top Face (centered at y = +H, from x = -H+c to x = H-c):
      const sideTemplate: Point2D[] = [
        { x: -H + c, y: H },
        { x: -sw / 2, y: H },
        { x: -sw / 2, y: H - lt },
        { x: -sb / 2, y: H - lt },
        { x: -sb / 2, y: H - sd },
        { x: sb / 2, y: H - sd },
        { x: sb / 2, y: H - lt },
        { x: sw / 2, y: H - lt },
        { x: sw / 2, y: H },
        { x: H - c, y: H },
        { x: H, y: H - c }, // Corner chamfer to next side
      ];

      // Rotate by 0, 90, 180, 270 degrees
      const outerLoop: Point2D[] = [];
      const angles = [0, -Math.PI / 2, -Math.PI, (-3 * Math.PI) / 2];

      angles.forEach((ang) => {
        const cosA = Math.cos(ang);
        const sinA = Math.sin(ang);
        sideTemplate.forEach((pt) => {
          const rx = pt.x * cosA - pt.y * sinA;
          const ry = pt.x * sinA + pt.y * cosA;
          outerLoop.push({
            x: Math.round((center.x + rx) * 10) / 10,
            y: Math.round((center.y + ry) * 10) / 10,
          });
        });
      });

      // Central circular core hole (for M5/M6/M8 thread tapping)
      const coreLoop: Point2D[] = [];
      const coreSegs = 24;
      for (let i = 0; i < coreSegs; i++) {
        const a = (i / coreSegs) * Math.PI * 2;
        coreLoop.push({
          x: Math.round((center.x + Math.cos(a) * coreR) * 10) / 10,
          y: Math.round((center.y + Math.sin(a) * coreR) * 10) / 10,
        });
      }

      return {
        solidLoops: [outerLoop, coreLoop],
      };
    },
  },
];
