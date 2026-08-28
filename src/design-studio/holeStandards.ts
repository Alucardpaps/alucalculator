'use client';

export interface MetricHoleStandard {
  size: string; // e.g. "M6"
  nominalDiameter: number; // mm
  coarsePitch: number; // mm
  tapDrillDiameter: number; // mm (Kılavuz Matkap Çapı)
  clearanceClose: number; // mm (Hassas Geçme)
  clearanceMedium: number; // mm (Orta Standart Geçme)
  clearanceFree: number; // mm (Serbest Geçme)
  counterboreDiameter: number; // mm (DIN 912 İmbus Baş Çapı)
  counterboreDepth: number; // mm (DIN 912 İmbus Baş Derinliği)
  countersinkDiameter: number; // mm (DIN 7991 90° Havşa Çapı)
}

// ─── ISO METRIC THREAD & HOLE DATABASE (M1 to M100) ───
export const ISO_METRIC_HOLES: MetricHoleStandard[] = [
  { size: 'M1', nominalDiameter: 1.0, coarsePitch: 0.25, tapDrillDiameter: 0.75, clearanceClose: 1.1, clearanceMedium: 1.2, clearanceFree: 1.3, counterboreDiameter: 2.0, counterboreDepth: 1.0, countersinkDiameter: 2.2 },
  { size: 'M1.2', nominalDiameter: 1.2, coarsePitch: 0.25, tapDrillDiameter: 0.95, clearanceClose: 1.3, clearanceMedium: 1.4, clearanceFree: 1.5, counterboreDiameter: 2.3, counterboreDepth: 1.2, countersinkDiameter: 2.5 },
  { size: 'M1.4', nominalDiameter: 1.4, coarsePitch: 0.30, tapDrillDiameter: 1.10, clearanceClose: 1.5, clearanceMedium: 1.6, clearanceFree: 1.8, counterboreDiameter: 2.6, counterboreDepth: 1.4, countersinkDiameter: 2.9 },
  { size: 'M1.6', nominalDiameter: 1.6, coarsePitch: 0.35, tapDrillDiameter: 1.25, clearanceClose: 1.7, clearanceMedium: 1.8, clearanceFree: 2.0, counterboreDiameter: 3.0, counterboreDepth: 1.6, countersinkDiameter: 3.3 },
  { size: 'M2', nominalDiameter: 2.0, coarsePitch: 0.40, tapDrillDiameter: 1.60, clearanceClose: 2.2, clearanceMedium: 2.4, clearanceFree: 2.6, counterboreDiameter: 3.8, counterboreDepth: 2.0, countersinkDiameter: 4.4 },
  { size: 'M2.5', nominalDiameter: 2.5, coarsePitch: 0.45, tapDrillDiameter: 2.05, clearanceClose: 2.7, clearanceMedium: 2.9, clearanceFree: 3.1, counterboreDiameter: 4.5, counterboreDepth: 2.5, countersinkDiameter: 5.5 },
  { size: 'M3', nominalDiameter: 3.0, coarsePitch: 0.50, tapDrillDiameter: 2.50, clearanceClose: 3.2, clearanceMedium: 3.4, clearanceFree: 3.6, counterboreDiameter: 5.5, counterboreDepth: 3.0, countersinkDiameter: 6.5 },
  { size: 'M3.5', nominalDiameter: 3.5, coarsePitch: 0.60, tapDrillDiameter: 2.90, clearanceClose: 3.7, clearanceMedium: 3.9, clearanceFree: 4.2, counterboreDiameter: 6.0, counterboreDepth: 3.5, countersinkDiameter: 7.3 },
  { size: 'M4', nominalDiameter: 4.0, coarsePitch: 0.70, tapDrillDiameter: 3.30, clearanceClose: 4.3, clearanceMedium: 4.5, clearanceFree: 4.8, counterboreDiameter: 7.0, counterboreDepth: 4.0, countersinkDiameter: 8.6 },
  { size: 'M5', nominalDiameter: 5.0, coarsePitch: 0.80, tapDrillDiameter: 4.20, clearanceClose: 5.3, clearanceMedium: 5.5, clearanceFree: 5.8, counterboreDiameter: 8.5, counterboreDepth: 5.0, countersinkDiameter: 10.4 },
  { size: 'M6', nominalDiameter: 6.0, coarsePitch: 1.00, tapDrillDiameter: 5.00, clearanceClose: 6.4, clearanceMedium: 6.6, clearanceFree: 7.0, counterboreDiameter: 10.0, counterboreDepth: 6.0, countersinkDiameter: 12.4 },
  { size: 'M7', nominalDiameter: 7.0, coarsePitch: 1.00, tapDrillDiameter: 6.00, clearanceClose: 7.4, clearanceMedium: 7.6, clearanceFree: 8.0, counterboreDiameter: 11.0, counterboreDepth: 7.0, countersinkDiameter: 13.8 },
  { size: 'M8', nominalDiameter: 8.0, coarsePitch: 1.25, tapDrillDiameter: 6.80, clearanceClose: 8.4, clearanceMedium: 9.0, clearanceFree: 10.0, counterboreDiameter: 13.0, counterboreDepth: 8.0, countersinkDiameter: 16.4 },
  { size: 'M10', nominalDiameter: 10.0, coarsePitch: 1.50, tapDrillDiameter: 8.50, clearanceClose: 10.5, clearanceMedium: 11.0, clearanceFree: 12.0, counterboreDiameter: 16.0, counterboreDepth: 10.0, countersinkDiameter: 20.4 },
  { size: 'M12', nominalDiameter: 12.0, coarsePitch: 1.75, tapDrillDiameter: 10.20, clearanceClose: 13.0, clearanceMedium: 13.5, clearanceFree: 14.5, counterboreDiameter: 18.0, counterboreDepth: 12.0, countersinkDiameter: 24.4 },
  { size: 'M14', nominalDiameter: 14.0, coarsePitch: 2.00, tapDrillDiameter: 12.00, clearanceClose: 15.0, clearanceMedium: 15.5, clearanceFree: 16.5, counterboreDiameter: 21.0, counterboreDepth: 14.0, countersinkDiameter: 27.0 },
  { size: 'M16', nominalDiameter: 16.0, coarsePitch: 2.00, tapDrillDiameter: 14.00, clearanceClose: 17.0, clearanceMedium: 17.5, clearanceFree: 18.5, counterboreDiameter: 24.0, counterboreDepth: 16.0, countersinkDiameter: 30.0 },
  { size: 'M18', nominalDiameter: 18.0, coarsePitch: 2.50, tapDrillDiameter: 15.50, clearanceClose: 19.0, clearanceMedium: 20.0, clearanceFree: 21.0, counterboreDiameter: 27.0, counterboreDepth: 18.0, countersinkDiameter: 34.0 },
  { size: 'M20', nominalDiameter: 20.0, coarsePitch: 2.50, tapDrillDiameter: 17.50, clearanceClose: 21.0, clearanceMedium: 22.0, clearanceFree: 24.0, counterboreDiameter: 30.0, counterboreDepth: 20.0, countersinkDiameter: 38.0 },
  { size: 'M22', nominalDiameter: 22.0, coarsePitch: 2.50, tapDrillDiameter: 19.50, clearanceClose: 23.0, clearanceMedium: 24.0, clearanceFree: 26.0, counterboreDiameter: 33.0, counterboreDepth: 22.0, countersinkDiameter: 42.0 },
  { size: 'M24', nominalDiameter: 24.0, coarsePitch: 3.00, tapDrillDiameter: 21.00, clearanceClose: 25.0, clearanceMedium: 26.0, clearanceFree: 28.0, counterboreDiameter: 36.0, counterboreDepth: 24.0, countersinkDiameter: 46.0 },
  { size: 'M27', nominalDiameter: 27.0, coarsePitch: 3.00, tapDrillDiameter: 24.00, clearanceClose: 28.0, clearanceMedium: 30.0, clearanceFree: 32.0, counterboreDiameter: 40.0, counterboreDepth: 27.0, countersinkDiameter: 51.0 },
  { size: 'M30', nominalDiameter: 30.0, coarsePitch: 3.50, tapDrillDiameter: 26.50, clearanceClose: 31.0, clearanceMedium: 33.0, clearanceFree: 35.0, counterboreDiameter: 45.0, counterboreDepth: 30.0, countersinkDiameter: 56.0 },
  { size: 'M33', nominalDiameter: 33.0, coarsePitch: 3.50, tapDrillDiameter: 29.50, clearanceClose: 34.0, clearanceMedium: 36.0, clearanceFree: 38.0, counterboreDiameter: 48.0, counterboreDepth: 33.0, countersinkDiameter: 61.0 },
  { size: 'M36', nominalDiameter: 36.0, coarsePitch: 4.00, tapDrillDiameter: 32.00, clearanceClose: 37.0, clearanceMedium: 39.0, clearanceFree: 42.0, counterboreDiameter: 54.0, counterboreDepth: 36.0, countersinkDiameter: 66.0 },
  { size: 'M39', nominalDiameter: 39.0, coarsePitch: 4.00, tapDrillDiameter: 35.00, clearanceClose: 40.0, clearanceMedium: 42.0, clearanceFree: 45.0, counterboreDiameter: 58.0, counterboreDepth: 39.0, countersinkDiameter: 71.0 },
  { size: 'M42', nominalDiameter: 42.0, coarsePitch: 4.50, tapDrillDiameter: 37.50, clearanceClose: 43.0, clearanceMedium: 45.0, clearanceFree: 48.0, counterboreDiameter: 63.0, counterboreDepth: 42.0, countersinkDiameter: 76.0 },
  { size: 'M48', nominalDiameter: 48.0, coarsePitch: 5.00, tapDrillDiameter: 43.00, clearanceClose: 50.0, clearanceMedium: 52.0, clearanceFree: 56.0, counterboreDiameter: 72.0, counterboreDepth: 48.0, countersinkDiameter: 86.0 },
  { size: 'M56', nominalDiameter: 56.0, coarsePitch: 5.50, tapDrillDiameter: 50.50, clearanceClose: 58.0, clearanceMedium: 62.0, clearanceFree: 66.0, counterboreDiameter: 84.0, counterboreDepth: 56.0, countersinkDiameter: 98.0 },
  { size: 'M64', nominalDiameter: 64.0, coarsePitch: 6.00, tapDrillDiameter: 58.00, clearanceClose: 66.0, clearanceMedium: 70.0, clearanceFree: 74.0, counterboreDiameter: 95.0, counterboreDepth: 64.0, countersinkDiameter: 110.0 },
  { size: 'M72', nominalDiameter: 72.0, coarsePitch: 6.00, tapDrillDiameter: 66.00, clearanceClose: 74.0, clearanceMedium: 78.0, clearanceFree: 82.0, counterboreDiameter: 105.0, counterboreDepth: 72.0, countersinkDiameter: 122.0 },
  { size: 'M80', nominalDiameter: 80.0, coarsePitch: 6.00, tapDrillDiameter: 74.00, clearanceClose: 82.0, clearanceMedium: 86.0, clearanceFree: 91.0, counterboreDiameter: 115.0, counterboreDepth: 80.0, countersinkDiameter: 135.0 },
  { size: 'M90', nominalDiameter: 90.0, coarsePitch: 6.00, tapDrillDiameter: 84.00, clearanceClose: 93.0, clearanceMedium: 96.0, clearanceFree: 101.0, counterboreDiameter: 130.0, counterboreDepth: 90.0, countersinkDiameter: 150.0 },
  { size: 'M100', nominalDiameter: 100.0, coarsePitch: 6.00, tapDrillDiameter: 94.00, clearanceClose: 104.0, clearanceMedium: 107.0, clearanceFree: 112.0, counterboreDiameter: 145.0, counterboreDepth: 100.0, countersinkDiameter: 165.0 },
];

export type SurfaceFace = 'top' | 'bottom' | 'front' | 'back' | 'left' | 'right';

export interface HoleItem {
  id: string;
  size: string; // e.g. "M6"
  x: number; // mm in local face coordinate
  y: number; // mm in local face coordinate
  face?: SurfaceFace; // 'top' | 'bottom' | 'front' | 'back' | 'left' | 'right' (default 'top')
  type: 'tap' | 'clearance' | 'counterbore' | 'countersink';
  depth?: number; // mm
  isThroughAll?: boolean;
}

export interface SurfaceCutItem {
  id: string;
  type: 'rect' | 'circle' | 'slot';
  face: SurfaceFace;
  x: number; // mm on face
  y: number; // mm on face
  width?: number; // mm
  length?: number; // mm
  diameter?: number; // mm
  depth: number; // mm
  isThroughAll?: boolean;
  angle?: number;
}


export type HoleIssueSeverity = 'CRITICAL' | 'WARNING' | 'NOTICE';

export interface HoleIssue {
  id: string;
  holeIdA: string;
  holeIdB?: string;
  severity: HoleIssueSeverity;
  title: string;
  titleTr: string;
  message: string;
  messageTr: string;
  distance: number;
  minSafeDistance: number;
}

/**
 * Validates a pattern of holes against spatial collisions, thread overlaps, and minimum wall thickness limits.
 */
export function checkHoleInterferences(
  holes: HoleItem[],
  partBounds?: { width: number; height: number }
): HoleIssue[] {
  const issues: HoleIssue[] = [];

  for (let i = 0; i < holes.length; i++) {
    const h1 = holes[i];
    const std1 = ISO_METRIC_HOLES.find((s) => s.size === h1.size) || {
      size: h1.size,
      nominalDiameter: 6,
      tapDrillDiameter: 5,
      clearanceMedium: 6.6,
      counterboreDiameter: 10,
    };

    // Outer active radius of Hole 1
    const r1 = (h1.type === 'counterbore' ? std1.counterboreDiameter : std1.nominalDiameter) / 2;

    // 1. Hole-to-Hole Spacing & Overlap Check
    for (let j = i + 1; j < holes.length; j++) {
      const h2 = holes[j];
      const std2 = ISO_METRIC_HOLES.find((s) => s.size === h2.size) || {
        size: h2.size,
        nominalDiameter: 6,
        tapDrillDiameter: 5,
        clearanceMedium: 6.6,
        counterboreDiameter: 10,
      };

      const r2 = (h2.type === 'counterbore' ? std2.counterboreDiameter : std2.nominalDiameter) / 2;

      const dx = h2.x - h1.x;
      const dy = h2.y - h1.y;
      const centerDist = Math.hypot(dx, dy);

      const sumR = r1 + r2;
      const safeSpacing = sumR * 1.5; // DIN standard minimum wall thickness is 0.5 * D

      // Overlap (Çakışma)
      if (centerDist < sumR) {
        const overlapDepth = Number((sumR - centerDist).toFixed(2));
        issues.push({
          id: `overlap-${h1.id}-${h2.id}`,
          holeIdA: h1.id,
          holeIdB: h2.id,
          severity: 'CRITICAL',
          title: `CRITICAL OVERLAP: ${h1.size} & ${h2.size}`,
          titleTr: `🔴 KRİTİK DELİK ÇAKIŞMASI: ${h1.size} ile ${h2.size}`,
          message: `Holes intersect by ${overlapDepth}mm! Drilling here will destroy tool/workpiece.`,
          messageTr: `Delikler ${overlapDepth} mm çakışıyor! Bu deliği eklersen takım kırılır ve parça hurdaya çıkar.`,
          distance: Number(centerDist.toFixed(1)),
          minSafeDistance: Number(safeSpacing.toFixed(1)),
        });
      }
      // Too close / Thin wall (Çok Yakın / Yetersiz Et Kalınlığı)
      else if (centerDist < safeSpacing) {
        const wallThickness = Number((centerDist - sumR).toFixed(2));
        issues.push({
          id: `thin-wall-${h1.id}-${h2.id}`,
          holeIdA: h1.id,
          holeIdB: h2.id,
          severity: 'WARNING',
          title: `INSUFFICIENT WALL THICKNESS: ${h1.size} & ${h2.size}`,
          titleTr: `⚠️ YETERSİZ ET KALINLIĞI UYARISI: ${h1.size} - ${h2.size}`,
          message: `Wall thickness between holes is only ${wallThickness}mm (Min safe: ${(safeSpacing - sumR).toFixed(1)}mm). Risk of cracking under thread torque.`,
          messageTr: `Delikler arası et kalınlığı sadece ${wallThickness} mm kaldı! Kılavuz çekme ve cıvata sıkma torkunda yırtılma riski oluşur.`,
          distance: Number(centerDist.toFixed(1)),
          minSafeDistance: Number(safeSpacing.toFixed(1)),
        });
      }
    }

    // 2. Part Edge Distance Check (Kenara Çok Yakınlık Uyarısı)
    if (partBounds) {
      const halfW = partBounds.width / 2;
      const halfH = partBounds.height / 2;

      const distLeft = Math.abs(h1.x - (-halfW));
      const distRight = Math.abs(halfW - h1.x);
      const distBottom = Math.abs(h1.y - (-halfH));
      const distTop = Math.abs(halfH - h1.y);

      const minEdgeDist = Math.min(distLeft, distRight, distBottom, distTop);
      const requiredEdgeDist = std1.nominalDiameter * 1.25;

      if (minEdgeDist < r1) {
        issues.push({
          id: `edge-cut-${h1.id}`,
          holeIdA: h1.id,
          severity: 'CRITICAL',
          title: `HOLE OUTSIDE PART BOUNDARY (${h1.size})`,
          titleTr: `🔴 PARÇA KENARI DIŞINA TAŞMA (${h1.size})`,
          message: `Hole center is located on or outside the part boundary!`,
          messageTr: `Delik parça kenarını kesiyor veya dışarı taşıyor!`,
          distance: Number(minEdgeDist.toFixed(1)),
          minSafeDistance: Number(requiredEdgeDist.toFixed(1)),
        });
      } else if (minEdgeDist < requiredEdgeDist) {
        issues.push({
          id: `edge-thin-${h1.id}`,
          holeIdA: h1.id,
          severity: 'WARNING',
          title: `TOO CLOSE TO EDGE (${h1.size})`,
          titleTr: `⚠️ KENARA ÇOK YAKIN (${h1.size})`,
          message: `Distance to edge is ${minEdgeDist.toFixed(1)}mm (Recommend: ${requiredEdgeDist.toFixed(1)}mm). Risk of edge bulging.`,
          messageTr: `Parça kenarına mesafe sadece ${minEdgeDist.toFixed(1)} mm (Tavsiye: en az ${requiredEdgeDist.toFixed(1)} mm). Kenar patlama riski.`,
          distance: Number(minEdgeDist.toFixed(1)),
          minSafeDistance: Number(requiredEdgeDist.toFixed(1)),
        });
      }
    }
  }

  return issues;
}
