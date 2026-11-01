/**
 * 🩺 AEGIS DESIGN DOCTOR & DFM ADVISOR ENGINE
 * 
 * Inspired by:
 * - Autodesk Inventor Design Doctor (Diagnosis of unconstrained geometry, sick mates, loop failures)
 * - CATIA DFM Advisor & Knowledgeware Rule Checker
 * - SolidWorks Check / Geometry Analysis & Interference Detection
 * 
 * Normative Tier: ISO 2768, Eurocode 3 (EN 1993-1-8), DIN 743, VDI 2230
 * Pure deterministic headless logic (no DOM, no React).
 */

import { type DesignPart } from './designStore';
import { type HoleItem, type SurfaceCutItem, ISO_METRIC_HOLES } from './holeStandards';
import { getPartBoundingMetrics } from './geometryFactory';

export type DiagnosticSeverity = 'critical' | 'warning' | 'info';

export interface DiagnosticIssue {
  id: string;
  category: 'wall' | 'hole' | 'pocket' | 'thread' | 'mate' | 'interference';
  titleEn: string;
  titleTr: string;
  descriptionEn: string;
  descriptionTr: string;
  severity: DiagnosticSeverity;
  standardCitation: string;
  partId?: string;
  featureId?: string;
  autoHealAction?: 'thicken-wall' | 'offset-hole' | 'ground-part' | 'shallow-pocket';
  autoHealLabelEn?: string;
  autoHealLabelTr?: string;
}

export interface DesignDoctorReport {
  score: number; // 0 - 100
  isCompliant: boolean;
  criticalCount: number;
  warningCount: number;
  issues: DiagnosticIssue[];
  checkedPartsCount: number;
  checkedMatesCount: number;
}

/**
 * Runs full engineering diagnostics across active part and assembly.
 */
export function diagnosePartAndAssembly(
  selectedPart: DesignPart | null,
  allParts: DesignPart[],
  allMates: Array<{ partAId: string; partBId: string; kind: string }> = []
): DesignDoctorReport {
  const issues: DiagnosticIssue[] = [];
  let score = 100;

  // Parts to inspect: If a part is selected, prioritize it, but also scan assembly for system-level issues
  const partsToScan = selectedPart ? [selectedPart] : allParts;

  for (const part of partsToScan) {
    const p = part.params || {};
    const width = Number(p.width || p.diameter || 40);
    const height = Number(p.height || p.length || 40);
    const depth = Number(p.depth || p.length || 20);
    const minDim = Math.min(width, height, depth);

    // 1. Thin-Wall & Knife-Edge Check (ISO 2768 / DFM)
    if (minDim < 1.5) {
      issues.push({
        id: `wall-crit-${part.id}`,
        category: 'wall',
        partId: part.id,
        severity: 'critical',
        titleEn: `Critical Thin Wall (${minDim}mm < 1.5mm)`,
        titleTr: `Kritik İnce Cidar (${minDim}mm < 1.5mm)`,
        descriptionEn: `Minimum dimension is ${minDim}mm. Extreme risk of CNC chatter, warping during machining, and thermal distortion.`,
        descriptionTr: `Minimum et kalınlığı ${minDim}mm. CNC işlemede titreşim, çarpılma ve yırtılma riski son derece yüksek.`,
        standardCitation: 'ISO 2768-m / DFM Casting & Milling Handbook',
        autoHealAction: 'thicken-wall',
        autoHealLabelEn: 'Thicken Wall to 2.5mm',
        autoHealLabelTr: 'Cidarı 2.5mm Yap',
      });
      score -= 30;
    } else if (minDim < 2.5) {
      issues.push({
        id: `wall-warn-${part.id}`,
        category: 'wall',
        partId: part.id,
        severity: 'warning',
        titleEn: `Marginal Wall Thickness (${minDim}mm < 2.5mm)`,
        titleTr: `Sınırda Et Kalınlığı (${minDim}mm < 2.5mm)`,
        descriptionEn: `Wall thickness is below the recommended 2.5mm threshold for standard 6061-T6 aluminum CNC machining.`,
        descriptionTr: `Et kalınlığı standart 6061-T6 alüminyum CNC frezeleme için önerilen 2.5mm eşiğinin altında.`,
        standardCitation: 'DIN EN 1706 DFM Rules',
        autoHealAction: 'thicken-wall',
        autoHealLabelEn: 'Thicken Wall to 2.5mm',
        autoHealLabelTr: 'Cidarı 2.5mm Yap',
      });
      score -= 10;
    }

    // 2. Hole-to-Edge Tear-Out Margin Check (Eurocode 3 / DIN EN 1993-1-8)
    const holes = part.holes || [];
    for (const h of holes) {
      const dia = h.diameter || 6.6;
      const marginX = Math.abs(width / 2 - Math.abs(h.x));
      const marginY = Math.abs(height / 2 - Math.abs(h.y));
      const minMargin = Math.min(marginX, marginY);

      const requiredMargin = 1.5 * dia;
      const criticalMargin = 1.2 * dia;

      if (minMargin < criticalMargin) {
        issues.push({
          id: `hole-crit-${part.id}-${h.id}`,
          category: 'hole',
          partId: part.id,
          featureId: h.id,
          severity: 'critical',
          titleEn: `Hole ${h.size} Edge Tear-Out Violation (${minMargin.toFixed(1)}mm < ${criticalMargin.toFixed(1)}mm)`,
          titleTr: `${h.size} Deliği Kenar Yırtılma İhlali (${minMargin.toFixed(1)}mm < ${criticalMargin.toFixed(1)}mm)`,
          descriptionEn: `Hole margin is below Eurocode 3 minimum 1.2*d0. High risk of punch blowout or shear tear-out under load.`,
          descriptionTr: `Delik kenar mesafesi Eurocode 3 minimum 1.2*d0 sınırının altında. Yük altında kenar yırtılma riski yüksek.`,
          standardCitation: 'Eurocode 3 (EN 1993-1-8 Clause 3.5.1)',
          autoHealAction: 'offset-hole',
          autoHealLabelEn: 'Shift Hole to Safe 1.5d Margin',
          autoHealLabelTr: 'Deliği Güvenli 1.5d Mesafeye Kaydır',
        });
        score -= 20;
      } else if (minMargin < requiredMargin) {
        issues.push({
          id: `hole-warn-${part.id}-${h.id}`,
          category: 'hole',
          partId: part.id,
          featureId: h.id,
          severity: 'warning',
          titleEn: `Hole ${h.size} Suboptimal Edge Margin (${minMargin.toFixed(1)}mm < ${requiredMargin.toFixed(1)}mm)`,
          titleTr: `${h.size} Deliği Sınır Kenar Mesafesi (${minMargin.toFixed(1)}mm < ${requiredMargin.toFixed(1)}mm)`,
          descriptionEn: `Hole is closer than the recommended 1.5*d0 distance to part edge.`,
          descriptionTr: `Delik kenara önerilen 1.5*d0 mesafesinden daha yakın.`,
          standardCitation: 'ISO 10721 Fastener Spacing',
          autoHealAction: 'offset-hole',
          autoHealLabelEn: 'Shift Hole to Safe 1.5d Margin',
          autoHealLabelTr: 'Deliği Güvenli 1.5d Mesafeye Kaydır',
        });
        score -= 8;
      }

      // 3. Thread Engagement Depth Check (VDI 2230)
      if (h.type === 'tap') {
        const std = ISO_METRIC_HOLES.find((s) => s.size === h.size);
        const nominalDia = std?.nominalDiameter || 6;
        const tapDepth = h.depth || depth;
        // In aluminum, engagement must be >= 1.5 * nominalDia; in steel >= 1.0 * nominalDia
        const minEngage = 1.5 * nominalDia;

        if (tapDepth < minEngage) {
          issues.push({
            id: `tap-engage-${part.id}-${h.id}`,
            category: 'thread',
            partId: part.id,
            featureId: h.id,
            severity: 'warning',
            titleEn: `Insufficient Thread Engagement (${tapDepth}mm < ${minEngage}mm)`,
            titleTr: `Yetersiz Diş Kavrama Derinliği (${tapDepth}mm < ${minEngage}mm)`,
            descriptionEn: `Thread depth is below VDI 2230 recommendation (1.5*d for light alloys). Risk of thread stripping.`,
            descriptionTr: `Kılavuz diş boyu VDI 2230 hafif alaşım standardının (1.5*d) altında. Diş sıyırma riski mevcut.`,
            standardCitation: 'VDI 2230 Sheet 1 Clause 5.2.2',
          });
          score -= 10;
        }
      }
    }

    // 4. Deep Pocket Aspect Ratio & Tool Deflection Check (DFM Milling)
    const cuts = part.cuts || [];
    for (const c of cuts) {
      const pocketMinW = Math.min(c.width || 20, c.length || 20, c.diameter || 20);
      const aspect = c.depth / pocketMinW;

      if (aspect > 4.0) {
        issues.push({
          id: `cut-aspect-${part.id}-${c.id}`,
          category: 'pocket',
          partId: part.id,
          featureId: c.id,
          severity: 'warning',
          titleEn: `Deep Pocket Aspect Ratio (${aspect.toFixed(1)}x > 4.0x)`,
          titleTr: `Aşırı Derin Cep Oranı (${aspect.toFixed(1)}x > 4.0x)`,
          descriptionEn: `Pocket depth-to-width ratio exceeds 4.0. Requires long-reach endmills with severe vibration or wire EDM.`,
          descriptionTr: `Derinlik/genişlik oranı 4.0'ı aşıyor. Takım titreşimi, uç kırılması veya tel erozyon gereksinimi doğurur.`,
          standardCitation: 'ASME Y14.5 / Modern Machine Shop DFM',
          autoHealAction: 'shallow-pocket',
          autoHealLabelEn: 'Cap Pocket Depth to 3.0x',
          autoHealLabelTr: 'Cep Derinliğini 3.0x ile Sınırla',
        });
        score -= 12;
      }
    }
  }

  // 5. Inventor Design Doctor: Unconstrained Parts in Multi-Part Assembly
  if (allParts.length >= 2) {
    for (const part of allParts) {
      const hasMate = allMates.some(
        (m) => m.partAId === part.id || m.partBId === part.id
      );
      if (!hasMate) {
        issues.push({
          id: `mate-free-${part.id}`,
          category: 'mate',
          partId: part.id,
          severity: 'info',
          titleEn: `Free-Floating Part: "${part.name}" Has No Mates`,
          titleTr: `Serbest Parça: "${part.name}" Montaj İlişkisi Yok`,
          descriptionEn: `Part has 6 unconstrained degrees of freedom (DOF). In CAD assemblies, all components should be mated or grounded.`,
          descriptionTr: `Parçanın 6 serbestlik derecesi de tanımsız. CAD montajlarında bileşenler bir parçaya bağlanmalı veya sabitlenmelidir.`,
          standardCitation: 'Autodesk Inventor Assembly DOF Rules',
          autoHealAction: 'ground-part',
          autoHealLabelEn: 'Fix / Ground Part Position',
          autoHealLabelTr: 'Parçayı Sabitle (Ground)',
        });
        score -= 5;
      }
    }
  }

  const criticalCount = issues.filter((i) => i.severity === 'critical').length;
  const warningCount = issues.filter((i) => i.severity === 'warning').length;
  const finalScore = Math.max(10, Math.min(100, score));

  return {
    score: finalScore,
    isCompliant: criticalCount === 0 && finalScore >= 75,
    criticalCount,
    warningCount,
    issues,
    checkedPartsCount: partsToScan.length,
    checkedMatesCount: allMates.length,
  };
}

/**
 * ⚡ Auto-Heal: Thicken wall of part to safe minimum 2.5mm
 */
export function executeAutoHealThickenWall(part: DesignPart, targetThicknessMm = 2.5): Partial<DesignPart> {
  const p = { ...(part.params || {}) };
  const width = Number(p.width || p.diameter || 40);
  const height = Number(p.height || p.length || 40);
  const depth = Number(p.depth || p.length || 20);

  if (p.height && height < targetThicknessMm) {
    p.height = targetThicknessMm;
  } else if (p.depth && depth < targetThicknessMm) {
    p.depth = targetThicknessMm;
  } else if (p.width && width < targetThicknessMm) {
    p.width = targetThicknessMm;
  }

  return { params: p };
}

/**
 * ⚡ Auto-Heal: Shift hole to safe 1.5d margin from plate boundary
 */
export function executeAutoHealOffsetHole(
  part: DesignPart,
  holeId: string,
  safeMarginFactor = 1.5
): Partial<DesignPart> {
  const p = part.params || {};
  const width = Number(p.width || 40);
  const height = Number(p.height || 40);

  const updatedHoles = (part.holes || []).map((h) => {
    if (h.id !== holeId) return h;
    const dia = h.diameter || 6.6;
    const requiredMargin = safeMarginFactor * dia;

    const maxSafeX = width / 2 - requiredMargin;
    const maxSafeY = height / 2 - requiredMargin;

    let newX = h.x;
    let newY = h.y;

    if (Math.abs(newX) > maxSafeX) {
      newX = Math.sign(newX) * maxSafeX;
    }
    if (Math.abs(newY) > maxSafeY) {
      newY = Math.sign(newY) * maxSafeY;
    }

    return {
      ...h,
      x: Number(newX.toFixed(1)),
      y: Number(newY.toFixed(1)),
    };
  });

  return { holes: updatedHoles };
}

/**
 * ⚡ Auto-Heal: Cap pocket depth to 3.0x width to eliminate tool deflection
 */
export function executeAutoHealShallowPocket(
  part: DesignPart,
  cutId: string
): Partial<DesignPart> {
  const updatedCuts = (part.cuts || []).map((c) => {
    if (c.id !== cutId) return c;
    const minW = Math.min(c.width || 20, c.length || 20, c.diameter || 20);
    const maxSafeDepth = Number((minW * 3.0).toFixed(1));
    return {
      ...c,
      depth: Math.min(c.depth, maxSafeDepth),
    };
  });

  return { cuts: updatedCuts };
}
