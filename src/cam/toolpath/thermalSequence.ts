/**
 * 🔥 AluCAD CAM Toolpath — Thermal Heat Input, Warping Risk & Cutting Sequence Optimizer
 * 
 * Standards & Physical Formulations:
 * - Rosenthal Heat Transfer Formulation: Q (kJ/mm) = η · U · I / (1000 · v)
 * - Heat Accumulation Field: θ(x,t) = ∑ Ei · exp(-(t - ti)/τ) · exp(-d² / 2σ²)
 * - ISO 9013 Thermal Cutting Sequence:
 *   1. Inner holes cut FIRST (smallest to largest)
 *   2. Thermal hopping between distant parts to dissipate heat before returning
 *   3. Outer skeleton separated LAST
 */

import { Point2D, CamPart, distance, createLineSegment } from '../core/geometry';
import { PlasmaProcessProfile } from '../core/processProfile';
import { ContourToolpath, ToolpathOperation, generateContourToolpath, LeadInOptions } from './leadInGenerator';

export type SequenceStrategyType = 
  | 'nearest-neighbor' 
  | 'heat-minimizing' 
  | 'zonal-hopping' 
  | 'center-out' 
  | 'common-line' 
  | 'true-hole-precision'
  | 'pi-cut'
  | 'anti-warp-slender'
  | 'progressive-common-line';

export interface ThermalAnalysisResult {
  heatInputQ_kJ_mm: number; // Q (kJ/mm)
  totalEnergyKj: number;
  maxTemperatureRiseTheta: number;
  averageTemperatureRiseTheta: number;
  partWarpingRiskScores: Array<{
    partId: string;
    score: number; // 0 - 100
    level: 'green' | 'yellow' | 'red';
    dominantFactor: string;
  }>;
}

export interface SequencedJobResult {
  toolpaths: ContourToolpath[];
  strategy: SequenceStrategyType;
  totalLengthMm: number;
  totalRapidLengthMm: number;
  totalCutTimeSec: number;
  totalJobTimeSec: number;
  commonLineEdgeCount: number;
  pierceCount: number;
  standardPierceCount: number;
  sigmaNestSimulatedPierces: number;
  pierceSavingsPercent: number;
  thermalAnalysis: ThermalAnalysisResult;
  anchorTabCount?: number;
  duplicateCutCount?: number;
  bridgeCount?: number;
  microjointCount?: number;
  piercesSaved?: number;
  automationPreset?: string;
}

/**
 * Calculates net linear heat input according to Rosenthal formulation:
 * Q = (η · U · I) / (1000 · v_mms)  [kJ/mm]
 */
export function calculateHeatInput(profile: PlasmaProcessProfile): number {
  const v_mms = Math.max(1, profile.cutSpeedMmMin / 60);
  const eta = profile.thermalEfficiencyEta || 0.80;
  const U = profile.arcVoltage || 130;
  const I = profile.currentAmps || 45;
  return (eta * U * I) / (1000 * v_mms); // kJ/mm
}

/**
 * Calculates part distortion / warping risk score (0-100)
 */
export function calculatePartWarpingRisk(
  part: CamPart,
  profile: PlasmaProcessProfile
): { score: number; level: 'green' | 'yellow' | 'red'; dominantFactor: string } {
  const Q = calculateHeatInput(profile);
  const outerContourLen = part.outerContour.segments.reduce((s, seg) => s + seg.length, 0);
  const areaMm2 = Math.max(1, Math.abs(part.outerContour.area));
  const t = Math.max(0.5, profile.thicknessMm);

  // Geometric slenderness (perimeter / sqrt(area))
  const slenderness = outerContourLen / Math.sqrt(areaMm2);

  // Warping index proportional to heat per unit volume: (Q * L) / (Area * t)
  const thermalIndex = (Q * outerContourLen) / (areaMm2 * t * 0.001);
  const rawScore = Math.min(100, Math.round(thermalIndex * 0.15 + slenderness * 4));

  let level: 'green' | 'yellow' | 'red' = 'green';
  let factor = 'Düşük ısı birikimi (Low heat)';
  if (rawScore > 70) {
    level = 'red';
    factor = 'İnce sac & yüksek ısı girdisi (Yüksek çarpılma riski)';
  } else if (rawScore > 35) {
    level = 'yellow';
    factor = 'Orta narinlik & yerel ısınma (Medium risk)';
  }

  return { score: rawScore, level, dominantFactor: factor };
}

export interface CuttingSequenceOptions {
  enableTrueHole?: boolean;
  enableCornerLoop?: boolean;
  cornerLoopRadiusMm?: number;
  enableMicrojoint?: boolean;
  microjointTabWidthMm?: number;
  microjointCount?: number;
  // Sabitleme Noktaları (Plazma Sabitleme & Sabit Kenar - Image 2)
  enableAnchorTabs?: boolean;
  anchorTabMode?: 'count' | 'spacing';
  anchorTabCount?: number;
  anchorTabSpacingMm?: number;
  anchorTabWidthMm?: number;
  cutAnchorEdgeLast?: boolean;
  anchorEdgePosition?: 'bottom' | 'top' | 'left' | 'right';
  cutHolesPerPart?: boolean;
  // Köprü Kesim (Bridge Cutting / Chain Cutting)
  enableBridgeCutting?: boolean;
  maxBridgeDistanceMm?: number;
  // Çarpışma Önleme (Collision Avoidance / Safe Traverse)
  enableCollisionAvoidance?: boolean;
  // Kesim Otomasyon Kuralı
  automationPreset?: 'standard' | 'min-pierce' | 'anti-warp' | 'anti-tip' | 'precision';
}

/**
 * Optimizes cutting sequence across all parts using selected strategy.
 * Rule: Inside holes are ALWAYS cut before their parent outer contours!
 */
export function optimizeCuttingSequence(
  parts: CamPart[],
  profile: PlasmaProcessProfile,
  strategy: SequenceStrategyType = 'heat-minimizing',
  customOptions?: CuttingSequenceOptions
): SequencedJobResult {
  const Q = calculateHeatInput(profile);

  // 1. Separate into toolpaths according to strategy
  const leadInOpts: LeadInOptions = {
    type: profile.leadInType,
    lengthMm: profile.leadInLengthMm,
    overcutMm: profile.overcutMm,
    leadOutLengthMm: profile.leadOutLengthMm,
    swirl: profile.swirl,
    cutSpeedMmMin: profile.cutSpeedMmMin,
    pierceDelaySec: profile.pierceDelaySec,
    enableTrueHole: customOptions?.enableTrueHole ?? (strategy === 'true-hole-precision' || true),
    enableCornerLoop: customOptions?.enableCornerLoop ?? true,
    cornerLoopRadiusMm: customOptions?.cornerLoopRadiusMm ?? 2.0,
    enableMicrojoint: customOptions?.enableMicrojoint ?? false,
    microjointTabWidthMm: customOptions?.microjointTabWidthMm ?? 2.0,
  };

  const partRiskScores: ThermalAnalysisResult['partWarpingRiskScores'] = [];
  for (const part of parts) {
    partRiskScores.push({
      partId: part.id,
      ...calculatePartWarpingRisk(part, profile),
    });
  }

  let orderedToolpaths: ContourToolpath[] = [];
  let commonLineEdgeCount = 0;
  let anchorTabCount = 0;
  let duplicateCutCount = 0;

  // 2. Strategy Execution
  if (strategy === 'progressive-common-line') {
    // Progressive Common Line & Anchor Edge (Image 2)
    // Common line cut EXACTLY ONCE (0 duplicate cuts!)
    // Holes cut per-part before outer cuts to eliminate thermal shifting ("1. sac kesilince oluşan kaymalar yüzünden delikler de kayar")
    // Bottom anchor edge (sabit kenar) cut LAST with user-specified sabitleme noktaları
    const clcRes = generateProgressiveCommonLineToolpaths(parts, profile, customOptions || {}, leadInOpts);
    orderedToolpaths = clcRes.toolpaths;
    commonLineEdgeCount = clcRes.commonEdges;
    anchorTabCount = clcRes.anchorTabs;
    duplicateCutCount = 0;
  } else if (strategy === 'common-line') {
    // Classic Collinear Common Line Cutting
    const disallowedPartIds = new Set(
      parts.filter(p => p.allowCommonLine === false || p.cuttingMode === 'standalone').map(p => p.id)
    );
    const holeToolpaths: ContourToolpath[] = [];
    const outerToolpaths: ContourToolpath[] = [];
    for (const part of parts) {
      const sortedHoles = [...part.holes].sort((a, b) => Math.abs(a.area) - Math.abs(b.area));
      for (const hole of sortedHoles) {
        const htp = generateContourToolpath(hole, leadInOpts);
        htp.partId = part.id;
        holeToolpaths.push(htp);
      }
      const otp = generateContourToolpath(part.outerContour, leadInOpts);
      otp.partId = part.id;
      outerToolpaths.push(otp);
    }
    const clc = applyCommonLineCutting(outerToolpaths, 8.0, disallowedPartIds);
    commonLineEdgeCount = clc.commonEdges;
    orderedToolpaths = [
      ...orderContoursThermalHopping(holeToolpaths, profile.heatDispersionSigmaMm),
      ...clc.toolpaths,
    ];
  } else if (strategy === 'pi-cut') {
    // Pi-Cut: holes first, shared common dividers, then outer frame
    const disallowedPartIds = new Set(
      parts.filter(p => p.allowCommonLine === false || p.cuttingMode === 'standalone').map(p => p.id)
    );
    const holeToolpaths: ContourToolpath[] = [];
    const outerToolpaths: ContourToolpath[] = [];
    for (const part of parts) {
      const sortedHoles = [...part.holes].sort((a, b) => Math.abs(a.area) - Math.abs(b.area));
      for (const hole of sortedHoles) {
        const htp = generateContourToolpath(hole, leadInOpts);
        htp.partId = part.id;
        holeToolpaths.push(htp);
      }
      const otp = generateContourToolpath(part.outerContour, leadInOpts);
      otp.partId = part.id;
      outerToolpaths.push(otp);
    }
    const piRes = applyPiCutStrategy(outerToolpaths, 8.0, disallowedPartIds);
    commonLineEdgeCount = piRes.commonEdges;
    orderedToolpaths = [
      ...orderContoursThermalHopping(holeToolpaths, profile.heatDispersionSigmaMm),
      ...piRes.toolpaths,
    ];
  } else if (customOptions?.cutHolesPerPart !== false) {
    // Parça Bazlı Delik Kesimi (Cut holes per part immediately before outer cut)
    // Eliminates plate-shift / thermal expansion misalignment
    const partBlocks: ContourToolpath[][] = [];
    for (const part of parts) {
      const block: ContourToolpath[] = [];
      const sortedHoles = [...part.holes].sort((a, b) => Math.abs(a.area) - Math.abs(b.area));
      for (const hole of sortedHoles) {
        block.push(generateContourToolpath(hole, leadInOpts));
      }
      block.push(generateContourToolpath(part.outerContour, leadInOpts));
      partBlocks.push(block);
    }

    if (strategy === 'anti-warp-slender') {
      const outerOnly = partBlocks.map(b => b[b.length - 1]);
      const orderedOuters = orderContoursAntiWarp(outerOnly);
      for (const o of orderedOuters) {
        const found = partBlocks.find(b => b[b.length - 1].contourId === o.contourId);
        if (found) orderedToolpaths.push(...found);
      }
    } else if (strategy === 'nearest-neighbor') {
      const remaining = [...partBlocks];
      let curPos: Point2D = { x: 0, y: 0 };
      while (remaining.length > 0) {
        let bestIdx = 0;
        let minDist = Infinity;
        for (let i = 0; i < remaining.length; i++) {
          const entryPt = remaining[i][0].piercePoint;
          const d = distance(curPos, entryPt);
          if (d < minDist) {
            minDist = d;
            bestIdx = i;
          }
        }
        const nextBlock = remaining.splice(bestIdx, 1)[0];
        orderedToolpaths.push(...nextBlock);
        curPos = nextBlock[nextBlock.length - 1].endPoint;
      }
    } else if (strategy === 'center-out') {
      const outerOnly = partBlocks.map(b => b[b.length - 1]);
      const orderedOuters = orderContoursCenterOut(outerOnly);
      for (const o of orderedOuters) {
        const found = partBlocks.find(b => b[b.length - 1].contourId === o.contourId);
        if (found) orderedToolpaths.push(...found);
      }
    } else {
      // heat-minimizing / zonal-hopping with hole-per-part protection
      const remaining = [...partBlocks];
      let curPos: Point2D = { x: 0, y: 0 };
      const sigma = profile.heatDispersionSigmaMm;
      while (remaining.length > 0) {
        let bestIdx = -1;
        let bestDist = Infinity;
        for (let i = 0; i < remaining.length; i++) {
          const entryPt = remaining[i][0].piercePoint;
          const d = distance(curPos, entryPt);
          if (d >= sigma && d < bestDist) {
            bestDist = d;
            bestIdx = i;
          }
        }
        if (bestIdx === -1) {
          let maxDist = -Infinity;
          for (let i = 0; i < remaining.length; i++) {
            const d = distance(curPos, remaining[i][0].piercePoint);
            if (d > maxDist) {
              maxDist = d;
              bestIdx = i;
            }
          }
        }
        const nextBlock = remaining.splice(bestIdx, 1)[0];
        orderedToolpaths.push(...nextBlock);
        curPos = nextBlock[nextBlock.length - 1].endPoint;
      }
    }
  } else {
    // Legacy global holes first, then outers
    const holeToolpaths: ContourToolpath[] = [];
    const outerToolpaths: ContourToolpath[] = [];
    for (const part of parts) {
      const sortedHoles = [...part.holes].sort((a, b) => Math.abs(a.area) - Math.abs(b.area));
      for (const hole of sortedHoles) {
        holeToolpaths.push(generateContourToolpath(hole, leadInOpts));
      }
      outerToolpaths.push(generateContourToolpath(part.outerContour, leadInOpts));
    }
    orderedToolpaths = [
      ...orderContoursThermalHopping(holeToolpaths, profile.heatDispersionSigmaMm),
      ...orderContoursThermalHopping(outerToolpaths, profile.heatDispersionSigmaMm),
    ];
  }

  // 2.5 Cutting Automations Post-Processing
  // A. Microjoints / Tutucu Sekmeler on Outer Contours
  if (customOptions?.enableMicrojoint) {
    const tabW = customOptions.microjointTabWidthMm || 2.0;
    const tabCnt = customOptions.microjointCount || 2;
    for (const tp of orderedToolpaths) {
      if (!tp.isAnchorEdge && tp.role === 'outer') {
        applyMicrojointsToToolpath(tp, tabW, tabCnt);
      }
    }
  }

  // B. Bridge Cutting (Köprü / Zincir Kesim)
  let bridgeCount = 0;
  if (customOptions?.enableBridgeCutting) {
    const maxBridgeDist = customOptions.maxBridgeDistanceMm || 35.0;
    const bridgeRes = applyBridgeCutting(orderedToolpaths, profile, maxBridgeDist);
    orderedToolpaths = bridgeRes.toolpaths;
    bridgeCount = bridgeRes.bridgeCount;
  }

  // C. Collision Avoidance (Kafa Çarpışma Önleme)
  if (customOptions?.enableCollisionAvoidance) {
    for (const tp of orderedToolpaths) {
      for (const op of tp.operations) {
        if (op.type === 'rapid') {
          op.avoidCollision = true;
        }
      }
    }
  }

  // D. Universal Shared Cut Deduplication (Sıfır Çift Kesim Motoru)
  // For standard/thermal strategies, merges any inadvertently duplicate cuts while respecting standalone parts
  if (strategy !== 'progressive-common-line' && strategy !== 'common-line' && strategy !== 'pi-cut') {
    const disallowedPartIds = new Set(
      parts.filter(p => p.allowCommonLine === false || p.cuttingMode === 'standalone').map(p => p.id)
    );
    const universalDedup = deduplicateSharedCuttingEdges(orderedToolpaths, profile.kerfMm, 4.0, disallowedPartIds);
    orderedToolpaths = universalDedup.toolpaths;
    commonLineEdgeCount += universalDedup.commonEdgesFound;
    duplicateCutCount += universalDedup.duplicateCutsRemoved;
  }

  // 3. Calculate metrics
  let totalLength = 0;
  let totalRapid = 0;
  let totalCutTime = 0;
  let currentPos: Point2D = { x: 0, y: 0 };
  let pierceCount = 0;

  for (const tp of orderedToolpaths) {
    totalLength += tp.totalLengthMm;
    const rapidDist = distance(currentPos, tp.piercePoint);
    totalRapid += rapidDist;
    totalCutTime += tp.estimatedTimeSec;
    currentPos = tp.endPoint;
    if (tp.operations.some(op => op.type === 'pierce' && op.torchOn)) {
      pierceCount++;
    }
  }

  const rapidSpeedMmMin = 12000;
  const totalRapidTimeSec = totalRapid / (rapidSpeedMmMin / 60);
  const totalJobTime = totalCutTime + totalRapidTimeSec;
  const totalEnergy = Q * totalLength; // kJ

  // Pierce Telemetry Comparison
  const tabCount = orderedToolpaths.filter(tp => tp.hasMicrojoint).length + anchorTabCount;
  const sigmaNestSimulatedPierces = pierceCount + (tabCount > 0 ? tabCount * 2 : 0);
  const standardPierceCount = pierceCount;
  const pierceSavingsPercent = sigmaNestSimulatedPierces > pierceCount 
    ? Math.round(((sigmaNestSimulatedPierces - pierceCount) / sigmaNestSimulatedPierces) * 100) 
    : 0;

  return {
    toolpaths: orderedToolpaths,
    strategy,
    totalLengthMm: totalLength,
    totalRapidLengthMm: totalRapid,
    totalCutTimeSec: totalCutTime,
    totalJobTimeSec: totalJobTime,
    commonLineEdgeCount,
    pierceCount,
    standardPierceCount,
    sigmaNestSimulatedPierces,
    pierceSavingsPercent,
    anchorTabCount,
    duplicateCutCount,
    bridgeCount,
    microjointCount: tabCount,
    piercesSaved: commonLineEdgeCount + bridgeCount,
    automationPreset: customOptions?.automationPreset || 'standard',
    thermalAnalysis: {
      heatInputQ_kJ_mm: Q,
      totalEnergyKj: totalEnergy,
      maxTemperatureRiseTheta: Math.min(180, Math.round(Q * 120 / profile.thicknessMm)),
      averageTemperatureRiseTheta: Math.min(85, Math.round(Q * 45 / profile.thicknessMm)),
      partWarpingRiskScores: partRiskScores,
    },
  };
}

// ─── PROGRESSIVE COMMON LINE & ANCHOR EDGE STRATEGY (IMAGE 2) ───

export interface ProgressiveClcResult {
  toolpaths: ContourToolpath[];
  commonEdges: number;
  anchorTabs: number;
  duplicateCuts?: number;
}

export interface DeduplicationResult {
  toolpaths: ContourToolpath[];
  duplicateCutsRemoved: number;
  commonEdgesFound: number;
}

/**
 * Universal Shared Edge Deduplicator ("Sıfır Çift Kesim Motoru")
 * Inspects all toolpath operations across all contours.
 * If two cut operations share the same physical collinear edge (within tolerance and >50% overlap),
 * the earlier cut is marked as `isCommonLine = true` (and highlighted in green with CLC badge),
 * and the duplicate cut is completely eliminated.
 */
export function deduplicateSharedCuttingEdges(
  toolpaths: ContourToolpath[],
  kerfMm = 1.5,
  toleranceMm = 4.0,
  disallowedPartIds = new Set<string>()
): DeduplicationResult {
  let duplicateCutsRemoved = 0;
  let commonEdgesFound = 0;

  interface CutRecord {
    tp: ContourToolpath;
    op: ToolpathOperation;
    p1: Point2D;
    p2: Point2D;
    length: number;
    ux: number;
    uy: number;
  }

  const recordedCuts: CutRecord[] = [];

  for (const tp of toolpaths) {
    const isDisallowed = (tp.partId && disallowedPartIds.has(tp.partId)) || tp.allowCommonLine === false;
    if (isDisallowed) {
      // Standalone part: preserved intact without common-line merging
      continue;
    }

    const cleanedOps: ToolpathOperation[] = [];

    for (let opIdx = 0; opIdx < tp.operations.length; opIdx++) {
      const op = tp.operations[opIdx];

      if (op.type === 'cut' && op.segment && op.segment.type === 'line') {
        const seg = op.segment;
        const dx = seg.end.x - seg.start.x;
        const dy = seg.end.y - seg.start.y;
        const len = Math.hypot(dx, dy);

        if (len >= 1.0) {
          const ux = dx / len;
          const uy = dy / len;

          let isDuplicate = false;
          let matchedRecord: CutRecord | null = null;

          for (const rec of recordedCuts) {
            if ((rec.tp.partId && disallowedPartIds.has(rec.tp.partId)) || rec.tp.allowCommonLine === false) continue;

            // Check parallelism (|dot product| >= 0.98)
            const dot = ux * rec.ux + uy * rec.uy;
            if (Math.abs(dot) < 0.98) continue;

            // Check perpendicular distance
            const wx = seg.start.x - rec.p1.x;
            const wy = seg.start.y - rec.p1.y;
            const dPerp = Math.abs(wx * (-rec.uy) + wy * rec.ux);
            if (dPerp > Math.max(toleranceMm, kerfMm * 2.5)) continue;

            // Project endpoints onto rec line
            const t1 = wx * rec.ux + wy * rec.uy;
            const t2 = (seg.end.x - rec.p1.x) * rec.ux + (seg.end.y - rec.p1.y) * rec.uy;
            const minT = Math.min(t1, t2);
            const maxT = Math.max(t1, t2);

            const overlapStart = Math.max(minT, 0);
            const overlapEnd = Math.min(maxT, rec.length);
            const overlapLen = Math.max(0, overlapEnd - overlapStart);
            const minSegLen = Math.min(len, rec.length);

            if (minSegLen > 0 && (overlapLen / minSegLen >= 0.50 || (overlapLen >= 15.0 && overlapLen / minSegLen >= 0.40))) {
              isDuplicate = true;
              matchedRecord = rec;
              break;
            }
          }

          if (isDuplicate && matchedRecord) {
            // Mark earlier cut as Common Line (CLC)
            if (!matchedRecord.op.isCommonLine) {
              matchedRecord.op.isCommonLine = true;
              matchedRecord.op.sequenceLabel = matchedRecord.op.sequenceLabel || 'Ortak Çizgi (CLC - Tek Plazma Geçişi)';
              matchedRecord.tp.isCommonLine = true;
              commonEdgesFound++;
            }
            duplicateCutsRemoved++;

            // Suppress duplicate cut completely!
            continue;
          } else {
            recordedCuts.push({
              tp,
              op,
              p1: seg.start,
              p2: seg.end,
              length: len,
              ux,
              uy
            });
          }
        }
      }

      cleanedOps.push(op);
    }

    // Clean up orphan pierce / leadIn / leadOut if all cuts in this group were suppressed
    const finalOps: ToolpathOperation[] = [];
    for (let i = 0; i < cleanedOps.length; i++) {
      const cur = cleanedOps[i];
      if (cur.type === 'pierce') {
        let hasCutAhead = false;
        for (let j = i + 1; j < cleanedOps.length; j++) {
          if (cleanedOps[j].type === 'cut' || cleanedOps[j].type === 'bridgeCut') {
            hasCutAhead = true;
            break;
          }
          if (cleanedOps[j].type === 'rapid') break;
        }
        if (!hasCutAhead) continue;
      }
      if (cur.type === 'leadIn') {
        let hasCutAhead = false;
        for (let j = i + 1; j < cleanedOps.length; j++) {
          if (cleanedOps[j].type === 'cut' || cleanedOps[j].type === 'bridgeCut') {
            hasCutAhead = true;
            break;
          }
          if (cleanedOps[j].type === 'rapid') break;
        }
        if (!hasCutAhead) continue;
      }
      if (cur.type === 'leadOut') {
        let hasCutBehind = false;
        for (let j = finalOps.length - 1; j >= 0; j--) {
          if (finalOps[j].type === 'cut' || finalOps[j].type === 'bridgeCut') {
            hasCutBehind = true;
            break;
          }
          if (finalOps[j].type === 'rapid') break;
        }
        if (!hasCutBehind) continue;
      }
      finalOps.push(cur);
    }

    tp.operations = finalOps;
    tp.totalLengthMm = finalOps.reduce((sum, op) => sum + (op.segment?.length || 0), 0);
  }

  // Filter out any toolpaths that now have zero cuts and zero anchor edges
  const nonEmptyToolpaths = toolpaths.filter(tp =>
    tp.operations.some(op => op.type === 'cut' || op.type === 'bridgeCut' || op.isAnchorEdge)
  );

  return {
    toolpaths: nonEmptyToolpaths,
    duplicateCutsRemoved,
    commonEdgesFound
  };
}

/**
 * Groups adjacent stacked parts into common-line clusters.
 */
function findStackedPartClusters(parts: CamPart[], kerfMm = 1.5): { stacks: CamPart[][]; standalone: CamPart[] } {
  if (parts.length === 0) return { stacks: [], standalone: [] };

  const canUseCommonLine = (p: CamPart) => p.allowCommonLine !== false && p.cuttingMode !== 'standalone';

  // Sort parts primarily by bounds.maxY descending (Top to Bottom)
  const sorted = [...parts].sort((a, b) => b.outerContour.bounds.maxY - a.outerContour.bounds.maxY);
  const stackedIds = new Set<string>();
  const stacks: CamPart[][] = [];

  for (let i = 0; i < sorted.length; i++) {
    const root = sorted[i];
    if (stackedIds.has(root.id) || !canUseCommonLine(root)) continue;

    const cluster: CamPart[] = [root];
    const tempVisited = new Set<string>([root.id]);
    let currentBottomPart = root;

    while (true) {
      let nextBelow: CamPart | null = null;
      let minGap = Infinity;

      for (let j = 0; j < sorted.length; j++) {
        const candidate = sorted[j];
        if (stackedIds.has(candidate.id) || tempVisited.has(candidate.id) || !canUseCommonLine(candidate)) continue;

        const b1 = currentBottomPart.outerContour.bounds;
        const b2 = candidate.outerContour.bounds;

        // Check horizontal overlap (at least 60% overlap)
        const overlapX = Math.min(b1.maxX, b2.maxX) - Math.max(b1.minX, b2.minX);
        const minW = Math.min(b1.width, b2.width);

        if (minW > 0 && overlapX / minW >= 0.6) {
          // Check if candidate is directly below currentBottomPart
          const gapY = b1.minY - b2.maxY;
          if (gapY >= -2.0 && gapY <= Math.max(12, kerfMm * 4) && gapY < minGap) {
            minGap = gapY;
            nextBelow = candidate;
          }
        }
      }

      if (nextBelow) {
        cluster.push(nextBelow);
        tempVisited.add(nextBelow.id);
        currentBottomPart = nextBelow;
      } else {
        break;
      }
    }

    if (cluster.length >= 2) {
      stacks.push(cluster);
      for (const p of cluster) stackedIds.add(p.id);
    }
  }

  // Standalone parts not in any multi-part stack
  const standalone = parts.filter(p => !stackedIds.has(p.id));
  return { stacks, standalone };
}

/**
 * Groups adjacent horizontal parts into side-by-side common-line clusters ("Yan yana 2 sac").
 */
function findHorizontalPartClusters(parts: CamPart[], kerfMm = 1.5, toleranceMm = 8.0): { rows: CamPart[][]; remaining: CamPart[] } {
  if (parts.length === 0) return { rows: [], remaining: [] };

  const canUseCommonLine = (p: CamPart) => p.allowCommonLine !== false && p.cuttingMode !== 'standalone';

  // Sort parts primarily by bounds.minX ascending (Left to Right)
  const sorted = [...parts].sort((a, b) => a.outerContour.bounds.minX - b.outerContour.bounds.minX);
  const clusteredIds = new Set<string>();
  const rows: CamPart[][] = [];

  for (let i = 0; i < sorted.length; i++) {
    const root = sorted[i];
    if (clusteredIds.has(root.id) || !canUseCommonLine(root)) continue;

    const cluster: CamPart[] = [root];
    const tempVisited = new Set<string>([root.id]);
    let currentLeftPart = root;

    while (true) {
      let nextRight: CamPart | null = null;
      let minGap = Infinity;

      for (let j = 0; j < sorted.length; j++) {
        const candidate = sorted[j];
        if (clusteredIds.has(candidate.id) || tempVisited.has(candidate.id) || !canUseCommonLine(candidate)) continue;

        const b1 = currentLeftPart.outerContour.bounds;
        const b2 = candidate.outerContour.bounds;

        // Check vertical overlap (at least 60% overlap)
        const overlapY = Math.min(b1.maxY, b2.maxY) - Math.max(b1.minY, b2.minY);
        const minH = Math.min(b1.height, b2.height);

        if (minH > 0 && overlapY / minH >= 0.6) {
          // Check if candidate is directly to the right of currentLeftPart
          const gapX = b2.minX - b1.maxX;
          if (gapX >= -2.0 && gapX <= Math.max(toleranceMm, kerfMm * 4) && gapX < minGap) {
            minGap = gapX;
            nextRight = candidate;
          }
        }
      }

      if (nextRight) {
        cluster.push(nextRight);
        tempVisited.add(nextRight.id);
        currentLeftPart = nextRight;
      } else {
        break;
      }
    }

    if (cluster.length >= 2) {
      rows.push(cluster);
      for (const p of cluster) clusteredIds.add(p.id);
    }
  }

  const remaining = parts.filter(p => !clusteredIds.has(p.id));
  return { rows, remaining };
}

/**
 * Generates Progressive Common Line & Anchor Edge toolpaths.
 * Satisfies the exact sequence in Image 2:
 * 1. Part 1: Holes first -> Left (1) -> Top (2) -> Right (3)
 * 2. Part 2: Holes first -> Left (4) -> Common Line 1-2 (5) -> Right (6) (FREES Part 1!)
 * 3. Part 3: Holes first -> Left (7) -> Common Line 2-3 (8) -> Right (9) (FREES Part 2!)
 * 4. Part 4: Holes first -> Left (10) -> Common Line 3-4 (11) -> Right (12) (FREES Part 3!)
 * 5. Sabit Kenar (Edge 13): Cut LAST with configurable Sabitleme Noktaları (anchor tabs)!
 */
export function generateProgressiveCommonLineToolpaths(
  parts: CamPart[],
  profile: PlasmaProcessProfile,
  options: CuttingSequenceOptions,
  leadInOpts: LeadInOptions
): ProgressiveClcResult {
  const { stacks, standalone: afterStacks } = findStackedPartClusters(parts, profile.kerfMm);
  const { rows, remaining } = findHorizontalPartClusters(afterStacks, profile.kerfMm, 8.0);
  const toolpaths: ContourToolpath[] = [];
  let totalCommonEdges = 0;
  let totalAnchorTabs = 0;

  const leadLen = Math.max(3.0, profile.leadInLengthMm);
  const leadOutLen = profile.leadOutLengthMm;
  const cutSpeed = profile.cutSpeedMmMin;
  const rapidSpeed = 12000;

  // 1. Sort stacks from Left to Right (ascending minX) for consistent left-to-right progression
  stacks.sort((s1, s2) => {
    const minX1 = Math.min(...s1.map(p => p.outerContour.bounds.minX));
    const minX2 = Math.min(...s2.map(p => p.outerContour.bounds.minX));
    return minX1 - minX2;
  });

  const allProcessedStackParts: CamPart[] = [];
  let stepCounter = 1;

  // Process stacks (columns of stacked parts)
  for (let sIdx = 0; sIdx < stacks.length; sIdx++) {
    const stack = stacks[sIdx];
    const N = stack.length;

    const stackMinX = Math.min(...stack.map(p => p.outerContour.bounds.minX));
    const stackMaxX = Math.max(...stack.map(p => p.outerContour.bounds.maxX));
    const stackMinY = Math.min(...stack.map(p => p.outerContour.bounds.minY));
    const stackMaxY = Math.max(...stack.map(p => p.outerContour.bounds.maxY));

    // Check if an adjacent column was already processed to our left (shares vertical seam at stackMinX)
    const hasLeftNeighborStack = stacks.some((other, idx) => {
      if (idx >= sIdx) return false;
      const oMaxX = Math.max(...other.map(p => p.outerContour.bounds.maxX));
      const oMinY = Math.min(...other.map(p => p.outerContour.bounds.minY));
      const oMaxY = Math.max(...other.map(p => p.outerContour.bounds.maxY));
      const overlapY = Math.min(stackMaxY, oMaxY) - Math.max(stackMinY, oMinY);
      return Math.abs(oMaxX - stackMinX) <= Math.max(8.0, profile.kerfMm * 4) && overlapY > 10;
    });

    // Check if an adjacent column exists to our right (will share vertical seam at stackMaxX)
    const hasRightNeighborStack = stacks.some((other, idx) => {
      if (idx <= sIdx) return false;
      const oMinX = Math.min(...other.map(p => p.outerContour.bounds.minX));
      const oMinY = Math.min(...other.map(p => p.outerContour.bounds.minY));
      const oMaxY = Math.max(...other.map(p => p.outerContour.bounds.maxY));
      const overlapY = Math.min(stackMaxY, oMaxY) - Math.max(stackMinY, oMinY);
      return Math.abs(oMinX - stackMaxX) <= Math.max(8.0, profile.kerfMm * 4) && overlapY > 10;
    });

    for (let k = 0; k < N; k++) {
      const part = stack[k];
      const b = part.outerContour.bounds;
      const xMin = b.minX;
      const xMax = b.maxX;
      const yMin = b.minY;
      const yMax = b.maxY;

      // 1. Cut internal holes of THIS PART first!
      // This eliminates thermal drifting and table shifting
      const sortedHoles = [...part.holes].sort((a, b) => Math.abs(a.area) - Math.abs(b.area));
      for (let h = 0; h < sortedHoles.length; h++) {
        const hole = sortedHoles[h];
        const htp = generateContourToolpath(hole, leadInOpts);
        htp.partId = part.id;
        for (const op of htp.operations) {
          if (op.type === 'cut') {
            op.sequenceLabel = `${part.label} Delik ${h + 1}`;
          }
        }
        toolpaths.push(htp);
      }

      // Check if this specific part shares its left or right boundary with adjacent parts
      const hasLeftNeighbor = hasLeftNeighborStack || allProcessedStackParts.some(prev => {
        const pb = prev.outerContour.bounds;
        const isRightSeam = Math.abs(pb.maxX - xMin) <= Math.max(8.0, profile.kerfMm * 4);
        const overlapY = Math.min(pb.maxY, yMax) - Math.max(pb.minY, yMin);
        return isRightSeam && overlapY >= 0.4 * Math.min(pb.height, b.height);
      });

      const hasRightNeighbor = hasRightNeighborStack || parts.some(other => {
        if (other.id === part.id) return false;
        if (other.allowCommonLine === false || other.cuttingMode === 'standalone') return false;
        const ob = other.outerContour.bounds;
        const isLeftSeam = Math.abs(ob.minX - xMax) <= Math.max(8.0, profile.kerfMm * 4);
        const overlapY = Math.min(ob.maxY, yMax) - Math.max(ob.minY, yMin);
        return isLeftSeam && overlapY >= 0.4 * Math.min(ob.height, b.height);
      });

      // 2. Cut outer edges according to Single-Pass Progressive Common-Line rules:
      if (!hasLeftNeighbor) {
        // --- CASE A: Leftmost Column (Cuts Left, Top/Common, Right) ---
        if (k === 0) {
          // Part 0 (Top-Left): Left -> Top -> Right (marked CLC if has right neighbor)
          const piercePt: Point2D = { x: xMin - leadLen, y: yMin };
          const startPt: Point2D = { x: xMin, y: yMin };
          const topPt: Point2D = { x: xMin, y: yMax };
          const rightTopPt: Point2D = { x: xMax, y: yMax };
          const rightBotPt: Point2D = { x: xMax, y: yMin };
          const leadOutPt: Point2D = { x: xMax + leadOutLen, y: yMin };

          const stepLeft = stepCounter++;
          const stepTop = stepCounter++;
          const stepRight = stepCounter++;

          const ops: ToolpathOperation[] = [
            { type: 'rapid', point: piercePt, feedRateMmMin: rapidSpeed, torchOn: false },
            { type: 'pierce', point: piercePt, feedRateMmMin: 0, dwellSec: profile.pierceDelaySec, torchOn: true },
            { type: 'leadIn', segment: createLineSegment(piercePt, startPt), feedRateMmMin: cutSpeed * 0.75, torchOn: true },
            {
              type: 'cut',
              segment: createLineSegment(startPt, topPt),
              feedRateMmMin: cutSpeed,
              torchOn: true,
              sequenceStep: stepLeft,
              sequenceLabel: `${stepLeft} (Sol Kenar / Left)`
            },
            {
              type: 'cut',
              segment: createLineSegment(topPt, rightTopPt),
              feedRateMmMin: cutSpeed,
              torchOn: true,
              sequenceStep: stepTop,
              sequenceLabel: `${stepTop} (Üst Kenar / Top)`
            },
            {
              type: 'cut',
              segment: createLineSegment(rightTopPt, rightBotPt),
              feedRateMmMin: cutSpeed,
              torchOn: true,
              isCommonLine: hasRightNeighbor,
              sequenceStep: stepRight,
              sequenceLabel: hasRightNeighbor 
                ? `${stepRight} (Ortak Dikey Çizgi / CLC - Tek Geçiş)` 
                : `${stepRight} (Sağ Kenar / Right)`
            },
            { type: 'leadOut', segment: createLineSegment(rightBotPt, leadOutPt), feedRateMmMin: cutSpeed, torchOn: true }
          ];

          if (hasRightNeighbor) totalCommonEdges++;
          const totalLen = ops.reduce((s, op) => s + (op.segment?.length || 0), 0);
          toolpaths.push({
            contourId: `${part.id}-part1-u`,
            partId: part.id,
            role: 'outer',
            enableBridge: part.enableBridge !== false,
            allowCommonLine: part.allowCommonLine !== false && part.cuttingMode !== 'standalone',
            operations: ops,
            piercePoint: piercePt,
            startPoint: startPt,
            endPoint: leadOutPt,
            totalLengthMm: totalLen,
            estimatedTimeSec: (totalLen / (cutSpeed / 60)) + profile.pierceDelaySec,
            isCommonLine: hasRightNeighbor,
            sequenceStep: stepLeft,
            sequenceLabel: `${stepLeft}-${stepTop}-${stepRight} (${part.label} U-Cut)`
          });
        } else {
          // Subsequent parts in Leftmost Column:
          // Left -> Horizontal Common Line (FREES Part k-1) -> Right (marked CLC if has right neighbor)
          const stepLeft = stepCounter++;
          const stepCommon = stepCounter++;
          const stepRight = stepCounter++;

          const piercePt: Point2D = { x: xMin - leadLen, y: yMin };
          const startPt: Point2D = { x: xMin, y: yMin };
          const topPt: Point2D = { x: xMin, y: yMax };
          const rightTopPt: Point2D = { x: xMax, y: yMax };
          const rightBotPt: Point2D = { x: xMax, y: yMin };
          const leadOutPt: Point2D = { x: xMax + leadOutLen, y: yMin };

          const ops: ToolpathOperation[] = [
            { type: 'rapid', point: piercePt, feedRateMmMin: rapidSpeed, torchOn: false },
            { type: 'pierce', point: piercePt, feedRateMmMin: 0, dwellSec: profile.pierceDelaySec, torchOn: true },
            { type: 'leadIn', segment: createLineSegment(piercePt, startPt), feedRateMmMin: cutSpeed * 0.75, torchOn: true },
            {
              type: 'cut',
              segment: createLineSegment(startPt, topPt),
              feedRateMmMin: cutSpeed,
              torchOn: true,
              sequenceStep: stepLeft,
              sequenceLabel: `${stepLeft} (Sol Kenar / Left)`
            },
            {
              type: 'cut',
              segment: createLineSegment(topPt, rightTopPt),
              feedRateMmMin: cutSpeed,
              torchOn: true,
              isCommonLine: true,
              sequenceStep: stepCommon,
              sequenceLabel: `${stepCommon} (Ortak Çizgi / Common Line - Parça ${k} Serbest)`
            },
            {
              type: 'cut',
              segment: createLineSegment(rightTopPt, rightBotPt),
              feedRateMmMin: cutSpeed,
              torchOn: true,
              isCommonLine: hasRightNeighbor,
              sequenceStep: stepRight,
              sequenceLabel: hasRightNeighbor 
                ? `${stepRight} (Ortak Dikey Çizgi / CLC - Tek Geçiş)` 
                : `${stepRight} (Sağ Kenar / Right)`
            },
            { type: 'leadOut', segment: createLineSegment(rightBotPt, leadOutPt), feedRateMmMin: cutSpeed, torchOn: true }
          ];

          totalCommonEdges++; // horizontal common line
          if (hasRightNeighbor) totalCommonEdges++;
          const totalLen = ops.reduce((s, op) => s + (op.segment?.length || 0), 0);
          toolpaths.push({
            contourId: `${part.id}-common-u`,
            partId: part.id,
            role: 'outer',
            enableBridge: part.enableBridge !== false,
            allowCommonLine: part.allowCommonLine !== false && part.cuttingMode !== 'standalone',
            operations: ops,
            piercePoint: piercePt,
            startPoint: startPt,
            endPoint: leadOutPt,
            totalLengthMm: totalLen,
            estimatedTimeSec: (totalLen / (cutSpeed / 60)) + profile.pierceDelaySec,
            isCommonLine: true,
            sequenceStep: stepCommon,
            sequenceLabel: `${stepLeft}-${stepCommon}-${stepRight} (${part.label} Ortak Kesim)`
          });
        }
      } else {
        // --- CASE B: Right / Adjacent Column (Left Edge ALREADY CUT by Left Stack!) ---
        // ZERO double cuts: The torch completely skips the shared vertical seam at xMin!
        if (k === 0) {
          // Top Part: Pierce in scrap above -> Top -> Right (marked CLC if has another right neighbor)
          const piercePt: Point2D = { x: xMin, y: yMax + leadLen };
          const startPt: Point2D = { x: xMin, y: yMax };
          const rightTopPt: Point2D = { x: xMax, y: yMax };
          const rightBotPt: Point2D = { x: xMax, y: yMin };
          const leadOutPt: Point2D = { x: xMax + leadOutLen, y: yMin };

          const stepTop = stepCounter++;
          const stepRight = stepCounter++;

          const ops: ToolpathOperation[] = [
            { type: 'rapid', point: piercePt, feedRateMmMin: rapidSpeed, torchOn: false },
            { type: 'pierce', point: piercePt, feedRateMmMin: 0, dwellSec: profile.pierceDelaySec, torchOn: true },
            { type: 'leadIn', segment: createLineSegment(piercePt, startPt), feedRateMmMin: cutSpeed * 0.75, torchOn: true },
            {
              type: 'cut',
              segment: createLineSegment(startPt, rightTopPt),
              feedRateMmMin: cutSpeed,
              torchOn: true,
              sequenceStep: stepTop,
              sequenceLabel: `${stepTop} (Üst Kenar / Top)`
            },
            {
              type: 'cut',
              segment: createLineSegment(rightTopPt, rightBotPt),
              feedRateMmMin: cutSpeed,
              torchOn: true,
              isCommonLine: hasRightNeighbor,
              sequenceStep: stepRight,
              sequenceLabel: hasRightNeighbor 
                ? `${stepRight} (Ortak Dikey Çizgi / CLC - Tek Geçiş)` 
                : `${stepRight} (Sağ Kenar / Right)`
            },
            { type: 'leadOut', segment: createLineSegment(rightBotPt, leadOutPt), feedRateMmMin: cutSpeed, torchOn: true }
          ];

          if (hasRightNeighbor) totalCommonEdges++;
          const totalLen = ops.reduce((s, op) => s + (op.segment?.length || 0), 0);
          toolpaths.push({
            contourId: `${part.id}-part1-u`,
            partId: part.id,
            role: 'outer',
            enableBridge: part.enableBridge !== false,
            allowCommonLine: part.allowCommonLine !== false && part.cuttingMode !== 'standalone',
            operations: ops,
            piercePoint: piercePt,
            startPoint: startPt,
            endPoint: leadOutPt,
            totalLengthMm: totalLen,
            estimatedTimeSec: (totalLen / (cutSpeed / 60)) + profile.pierceDelaySec,
            isCommonLine: hasRightNeighbor,
            sequenceStep: stepTop,
            sequenceLabel: `${stepTop}-${stepRight} (${part.label} L-Cut)`
          });
        } else {
          // Subsequent parts in Adjacent Column:
          // Pierce at seam -> Horizontal Common Line -> Right (marked CLC if has right neighbor)
          const stepCommon = stepCounter++;
          const stepRight = stepCounter++;

          const piercePt: Point2D = { x: xMin - leadLen * 0.5, y: yMax };
          const startPt: Point2D = { x: xMin, y: yMax };
          const rightTopPt: Point2D = { x: xMax, y: yMax };
          const rightBotPt: Point2D = { x: xMax, y: yMin };
          const leadOutPt: Point2D = { x: xMax + leadOutLen, y: yMin };

          const ops: ToolpathOperation[] = [
            { type: 'rapid', point: piercePt, feedRateMmMin: rapidSpeed, torchOn: false },
            { type: 'pierce', point: piercePt, feedRateMmMin: 0, dwellSec: 0, torchOn: true },
            { type: 'leadIn', segment: createLineSegment(piercePt, startPt), feedRateMmMin: cutSpeed * 0.75, torchOn: true },
            {
              type: 'cut',
              segment: createLineSegment(startPt, rightTopPt),
              feedRateMmMin: cutSpeed,
              torchOn: true,
              isCommonLine: true,
              sequenceStep: stepCommon,
              sequenceLabel: `${stepCommon} (Ortak Çizgi / Common Line - Parça ${k} Serbest)`
            },
            {
              type: 'cut',
              segment: createLineSegment(rightTopPt, rightBotPt),
              feedRateMmMin: cutSpeed,
              torchOn: true,
              isCommonLine: hasRightNeighbor,
              sequenceStep: stepRight,
              sequenceLabel: hasRightNeighbor 
                ? `${stepRight} (Ortak Dikey Çizgi / CLC - Tek Geçiş)` 
                : `${stepRight} (Sağ Kenar / Right)`
            },
            { type: 'leadOut', segment: createLineSegment(rightBotPt, leadOutPt), feedRateMmMin: cutSpeed, torchOn: true }
          ];

          totalCommonEdges++; // horizontal common line
          if (hasRightNeighbor) totalCommonEdges++;
          const totalLen = ops.reduce((s, op) => s + (op.segment?.length || 0), 0);
          toolpaths.push({
            contourId: `${part.id}-common-u`,
            partId: part.id,
            role: 'outer',
            enableBridge: part.enableBridge !== false,
            allowCommonLine: part.allowCommonLine !== false && part.cuttingMode !== 'standalone',
            operations: ops,
            piercePoint: piercePt,
            startPoint: startPt,
            endPoint: leadOutPt,
            totalLengthMm: totalLen,
            estimatedTimeSec: (totalLen / (cutSpeed / 60)) + profile.pierceDelaySec,
            isCommonLine: true,
            sequenceStep: stepCommon,
            sequenceLabel: `${stepCommon}-${stepRight} (${part.label} Ortak Kesim)`
          });
        }
      }
    }

    // 3. Sabit Kenar (Anchor Edge): Cut LAST for each stack at its bottom boundary
    const lastPart = stack[N - 1];
    const bLast = lastPart.outerContour.bounds;
    const anchorY = bLast.minY;
    const xStart = bLast.minX;
    const xEnd = bLast.maxX;
    const edgeLen = xEnd - xStart;
    const anchorStep = stepCounter++;

    const piercePt: Point2D = { x: xStart - leadLen, y: anchorY };
    const leadOutPt: Point2D = { x: xEnd + leadOutLen, y: anchorY };

    const anchorOps: ToolpathOperation[] = [
      { type: 'rapid', point: piercePt, feedRateMmMin: rapidSpeed, torchOn: false },
      { type: 'pierce', point: piercePt, feedRateMmMin: 0, dwellSec: profile.pierceDelaySec, torchOn: true },
      { type: 'leadIn', segment: createLineSegment(piercePt, { x: xStart, y: anchorY }), feedRateMmMin: cutSpeed * 0.75, torchOn: true },
    ];

    const enableTabs = options.enableAnchorTabs ?? true;
    if (enableTabs && edgeLen > 50) {
      let tabCount = 4;
      if (options.anchorTabMode === 'spacing') {
        const sp = Math.max(50, options.anchorTabSpacingMm || 500);
        tabCount = Math.max(1, Math.floor(edgeLen / sp));
      } else {
        tabCount = Math.max(1, options.anchorTabCount ?? 4);
      }
      totalAnchorTabs += tabCount;

      const tabWidth = Math.max(1.0, Math.min(10.0, options.anchorTabWidthMm || 3.0));
      let curX = xStart;

      for (let t = 1; t <= tabCount; t++) {
        const tabCenter = xStart + (t / (tabCount + 1)) * edgeLen;
        const tabStart = Math.max(curX, tabCenter - tabWidth / 2);
        const tabEnd = Math.min(xEnd, tabCenter + tabWidth / 2);

        if (tabStart > curX) {
          anchorOps.push({
            type: 'cut',
            segment: createLineSegment({ x: curX, y: anchorY }, { x: tabStart, y: anchorY }),
            feedRateMmMin: cutSpeed,
            torchOn: true,
            isAnchorEdge: true,
            sequenceStep: anchorStep,
            sequenceLabel: `${anchorStep} (Sabit Kenar Kesimi)`
          });
        }

        // Uncut microjoint tab gap (keeps sheet anchored)
        anchorOps.push({
          type: 'rapid',
          segment: createLineSegment({ x: tabStart, y: anchorY }, { x: tabEnd, y: anchorY }),
          feedRateMmMin: rapidSpeed,
          torchOn: false,
          isAnchorTab: true,
          isAnchorEdge: true,
          isMicrojoint: true,
          sequenceStep: anchorStep,
          sequenceLabel: `${anchorStep} (Sabitleme Tab ${t})`
        });

        curX = tabEnd;
      }

      if (curX < xEnd) {
        anchorOps.push({
          type: 'cut',
          segment: createLineSegment({ x: curX, y: anchorY }, { x: xEnd, y: anchorY }),
          feedRateMmMin: cutSpeed,
          torchOn: true,
          isAnchorEdge: true,
          sequenceStep: anchorStep,
          sequenceLabel: `${anchorStep} (Sabit Kenar Sonu)`
        });
      }
    } else {
      // Cut clean across anchor edge without tabs
      anchorOps.push({
        type: 'cut',
        segment: createLineSegment({ x: xStart, y: anchorY }, { x: xEnd, y: anchorY }),
        feedRateMmMin: cutSpeed,
        torchOn: true,
        isAnchorEdge: true,
        sequenceStep: anchorStep,
        sequenceLabel: `${anchorStep} (Sabit Kenar - Tek Hat)`
      });
    }

    anchorOps.push({
      type: 'leadOut',
      segment: createLineSegment({ x: xEnd, y: anchorY }, leadOutPt),
      feedRateMmMin: cutSpeed,
      torchOn: true
    });

    const anchorTotalLen = anchorOps.reduce((s, op) => s + (op.segment?.length || 0), 0);
    toolpaths.push({
      contourId: `${lastPart.id}-sabit-kenar`,
      partId: lastPart.id,
      role: 'outer',
      enableBridge: false,
      allowCommonLine: false,
      operations: anchorOps,
      piercePoint: piercePt,
      startPoint: { x: xStart, y: anchorY },
      endPoint: leadOutPt,
      totalLengthMm: anchorTotalLen,
      estimatedTimeSec: (anchorTotalLen / (cutSpeed / 60)) + profile.pierceDelaySec,
      isAnchorEdge: true,
      hasMicrojoint: enableTabs,
      tabWidthMm: enableTabs ? (options.anchorTabWidthMm || 3.0) : undefined,
      sequenceStep: anchorStep,
      sequenceLabel: `${anchorStep} (Sabit Kenar - Son Kesim)`
    });

    allProcessedStackParts.push(...stack);
  }

  // Process horizontal side-by-side part rows ("Yan yana 2 sac")
  // Rule: Shared seam between Part k-1 and Part k is cut EXACTLY ONCE!
  // Part k skips its left edge so the torch never double-cuts the seam.
  for (const row of rows) {
    const M = row.length;
    for (let k = 0; k < M; k++) {
      const part = row[k];
      const b = part.outerContour.bounds;
      const xMin = b.minX;
      const xMax = b.maxX;
      const yMin = b.minY;
      const yMax = b.maxY;

      // 1. Cut internal holes of THIS PART first!
      const sortedHoles = [...part.holes].sort((a, b) => Math.abs(a.area) - Math.abs(b.area));
      for (let h = 0; h < sortedHoles.length; h++) {
        const hole = sortedHoles[h];
        const htp = generateContourToolpath(hole, leadInOpts);
        htp.partId = part.id;
        for (const op of htp.operations) {
          if (op.type === 'cut') {
            op.sequenceLabel = `${part.label} Delik ${h + 1}`;
          }
        }
        toolpaths.push(htp);
      }

      // 2. Cut outer edges:
      if (k === 0) {
        // Part 0 (Leftmost):
        // Sol -> Üst -> Ortak Dikey Kenar (Common Line) -> Alt
        const piercePt: Point2D = { x: xMin - leadLen, y: yMin };
        const startPt: Point2D = { x: xMin, y: yMin };
        const topLeftPt: Point2D = { x: xMin, y: yMax };
        const topRightPt: Point2D = { x: xMax, y: yMax };
        const botRightPt: Point2D = { x: xMax, y: yMin };
        const leadOutPt: Point2D = { x: xMin - leadOutLen, y: yMin };

        const stepLeft = stepCounter++;
        const stepTop = stepCounter++;
        const stepRight = stepCounter++;
        const stepBottom = stepCounter++;

        const ops: ToolpathOperation[] = [
          { type: 'rapid', point: piercePt, feedRateMmMin: rapidSpeed, torchOn: false },
          { type: 'pierce', point: piercePt, feedRateMmMin: 0, dwellSec: profile.pierceDelaySec, torchOn: true },
          { type: 'leadIn', segment: createLineSegment(piercePt, startPt), feedRateMmMin: cutSpeed * 0.75, torchOn: true },
          {
            type: 'cut',
            segment: createLineSegment(startPt, topLeftPt),
            feedRateMmMin: cutSpeed,
            torchOn: true,
            sequenceStep: stepLeft,
            sequenceLabel: `${stepLeft} (Sol Kenar / Left)`
          },
          {
            type: 'cut',
            segment: createLineSegment(topLeftPt, topRightPt),
            feedRateMmMin: cutSpeed,
            torchOn: true,
            sequenceStep: stepTop,
            sequenceLabel: `${stepTop} (Üst Kenar / Top)`
          },
          {
            type: 'cut',
            segment: createLineSegment(topRightPt, botRightPt),
            feedRateMmMin: cutSpeed,
            torchOn: true,
            isCommonLine: true,
            sequenceStep: stepRight,
            sequenceLabel: `${stepRight} (Ortak Çizgi / Common Line - Tek Plazma Geçişi)`
          },
          {
            type: 'cut',
            segment: createLineSegment(botRightPt, startPt),
            feedRateMmMin: cutSpeed,
            torchOn: true,
            sequenceStep: stepBottom,
            sequenceLabel: `${stepBottom} (Alt Kenar - Parça 1 Serbest)`
          },
          { type: 'leadOut', segment: createLineSegment(startPt, leadOutPt), feedRateMmMin: cutSpeed, torchOn: true }
        ];

        totalCommonEdges++;
        const totalLen = ops.reduce((s, op) => s + (op.segment?.length || 0), 0);
        toolpaths.push({
          contourId: `${part.id}-row-part0`,
          role: 'outer',
          partId: part.id,
          enableBridge: part.enableBridge !== false,
          allowCommonLine: part.allowCommonLine !== false && part.cuttingMode !== 'standalone',
          operations: ops,
          piercePoint: piercePt,
          startPoint: startPt,
          endPoint: leadOutPt,
          totalLengthMm: totalLen,
          estimatedTimeSec: (totalLen / (cutSpeed / 60)) + profile.pierceDelaySec,
          isCommonLine: true,
          sequenceStep: stepRight,
          sequenceLabel: `${stepLeft}-${stepTop}-${stepRight}-${stepBottom} (Parça 1 Ortak Kesim)`
        });
      } else {
        // Subsequent parts (k >= 1):
        // Sol kenar ZATEN kesildi (Part k-1 tarafından ortak hat olarak kesildi!)
        // Sıfır mükerrer kesim: Kesim sırası: Üst -> Sağ (varsa sonraki ortak çizgi) -> Alt
        const stepTop = stepCounter++;
        const stepRight = stepCounter++;
        const stepBottom = stepCounter++;

        const isNextCommon = k < M - 1;
        const piercePt: Point2D = { x: xMin, y: yMax + leadLen };
        const topLeftPt: Point2D = { x: xMin, y: yMax };
        const topRightPt: Point2D = { x: xMax, y: yMax };
        const botRightPt: Point2D = { x: xMax, y: yMin };
        const botLeftPt: Point2D = { x: xMin, y: yMin };
        const leadOutPt: Point2D = { x: xMin - leadOutLen, y: yMin };

        const ops: ToolpathOperation[] = [
          { type: 'rapid', point: piercePt, feedRateMmMin: rapidSpeed, torchOn: false },
          { type: 'pierce', point: piercePt, feedRateMmMin: 0, dwellSec: profile.pierceDelaySec, torchOn: true },
          { type: 'leadIn', segment: createLineSegment(piercePt, topLeftPt), feedRateMmMin: cutSpeed * 0.75, torchOn: true },
          {
            type: 'cut',
            segment: createLineSegment(topLeftPt, topRightPt),
            feedRateMmMin: cutSpeed,
            torchOn: true,
            sequenceStep: stepTop,
            sequenceLabel: `${stepTop} (Üst Kenar / Top)`
          },
          {
            type: 'cut',
            segment: createLineSegment(topRightPt, botRightPt),
            feedRateMmMin: cutSpeed,
            torchOn: true,
            isCommonLine: isNextCommon,
            sequenceStep: stepRight,
            sequenceLabel: isNextCommon 
              ? `${stepRight} (Ortak Çizgi / Common Line)` 
              : `${stepRight} (Sağ Kenar / Right)`
          },
          {
            type: 'cut',
            segment: createLineSegment(botRightPt, botLeftPt),
            feedRateMmMin: cutSpeed,
            torchOn: true,
            sequenceStep: stepBottom,
            sequenceLabel: `${stepBottom} (Alt Kenar - Parça ${k + 1} Serbest)`
          },
          { type: 'leadOut', segment: createLineSegment(botLeftPt, leadOutPt), feedRateMmMin: cutSpeed, torchOn: true }
        ];

        if (isNextCommon) totalCommonEdges++;
        const totalLen = ops.reduce((s, op) => s + (op.segment?.length || 0), 0);
        toolpaths.push({
          contourId: `${part.id}-row-part${k}`,
          role: 'outer',
          partId: part.id,
          enableBridge: part.enableBridge !== false,
          allowCommonLine: part.allowCommonLine !== false && part.cuttingMode !== 'standalone',
          operations: ops,
          piercePoint: piercePt,
          startPoint: topLeftPt,
          endPoint: leadOutPt,
          totalLengthMm: totalLen,
          estimatedTimeSec: (totalLen / (cutSpeed / 60)) + profile.pierceDelaySec,
          isCommonLine: isNextCommon,
          sequenceStep: stepTop,
          sequenceLabel: `${stepTop}-${stepRight}-${stepBottom} (Parça ${k + 1} Ortak Kesim)`
        });
      }
    }
  }

  // Process remaining standalone parts with Hole-per-part protection and applyCommonLineCutting
  const disallowedPartIds = new Set(
    parts.filter(p => p.allowCommonLine === false || p.cuttingMode === 'standalone').map(p => p.id)
  );
  const remainingOuterToolpaths: ContourToolpath[] = [];
  for (const part of remaining) {
    const sortedHoles = [...part.holes].sort((a, b) => Math.abs(a.area) - Math.abs(b.area));
    for (const hole of sortedHoles) {
      const htp = generateContourToolpath(hole, leadInOpts);
      htp.partId = part.id;
      toolpaths.push(htp);
    }
    const otp = generateContourToolpath(part.outerContour, leadInOpts);
    otp.partId = part.id;
    otp.enableBridge = part.enableBridge !== false;
    otp.allowCommonLine = part.allowCommonLine !== false && part.cuttingMode !== 'standalone';
    remainingOuterToolpaths.push(otp);
  }

  if (remainingOuterToolpaths.length > 0) {
    const clcRemaining = applyCommonLineCutting(remainingOuterToolpaths, 8.0, disallowedPartIds);
    totalCommonEdges += clcRemaining.commonEdges;
    toolpaths.push(...clcRemaining.toolpaths);
  }

  // Final Universal Deduplication pass ensuring 100% zero duplicate cuts across all stacks/rows
  const dedup = deduplicateSharedCuttingEdges(toolpaths, profile.kerfMm, 4.0, disallowedPartIds);

  return {
    toolpaths: dedup.toolpaths,
    commonEdges: totalCommonEdges + dedup.commonEdgesFound,
    anchorTabs: totalAnchorTabs,
    duplicateCuts: dedup.duplicateCutsRemoved,
  };
}

/**
 * Common Line Cutting (CLC / Ortak Çizgi Kesimi)
 * Merges adjacent collinear boundary edges between nested parts to cut them in a single pass.
 */
function applyCommonLineCutting(
  outerToolpaths: ContourToolpath[], 
  toleranceMm = 8.0,
  disallowedPartIds = new Set<string>()
): { toolpaths: ContourToolpath[]; commonEdges: number } {
  let commonEdges = 0;
  const processed = [...outerToolpaths];

  for (let i = 0; i < processed.length; i++) {
    const tp1 = processed[i];
    if (tp1.partId && disallowedPartIds.has(tp1.partId)) continue;

    for (let j = i + 1; j < processed.length; j++) {
      const tp2 = processed[j];
      if (tp2.partId && disallowedPartIds.has(tp2.partId)) continue;

      for (const op1 of tp1.operations) {
        if (op1.type !== 'cut' || !op1.segment || op1.segment.type !== 'line') continue;
        const seg1 = op1.segment;

        for (const op2 of tp2.operations) {
          if (op2.type !== 'cut' || !op2.segment || op2.segment.type !== 'line' || op2.isCommonLine) continue;
          const seg2 = op2.segment;

          const mid1 = { x: (seg1.start.x + seg1.end.x) / 2, y: (seg1.start.y + seg1.end.y) / 2 };
          const mid2 = { x: (seg2.start.x + seg2.end.x) / 2, y: (seg2.start.y + seg2.end.y) / 2 };
          const dMid = distance(mid1, mid2);

          if (dMid <= toleranceMm) {
            const d1x = seg1.end.x - seg1.start.x;
            const d1y = seg1.end.y - seg1.start.y;
            const d2x = seg2.end.x - seg2.start.x;
            const d2y = seg2.end.y - seg2.start.y;
            const cross = Math.abs(d1x * d2y - d1y * d2x);
            const lenProduct = Math.sqrt(d1x * d1x + d1y * d1y) * Math.sqrt(d2x * d2x + d2y * d2y);

            if (lenProduct > 1 && cross / lenProduct < 0.05) {
              op1.isCommonLine = true;
              op1.sequenceLabel = 'Ortak Kesim (Common Line - Tek Geçiş)';
              tp1.isCommonLine = true;
              tp2.isCommonLine = true;
              // Suppress duplicate cut completely so NO duplicate cut is performed or drawn!
              op2.type = 'rapid';
              op2.torchOn = false;
              op2.isCommonLine = false;
              op2.segment = undefined;
              commonEdges++;
            }
          }
        }
      }
    }
  }

  return { toolpaths: processed, commonEdges };
}

/**
 * Pi-Cut (n-biçimli ortak kesim) Strategy
 * Solves SigmaNEST C-cut slippage: cuts internal shared boundary lines FIRST while both parts
 * remain locked to the heavy stock sheet skeleton, then executes outer perimeter cuts.
 */
function applyPiCutStrategy(
  outerToolpaths: ContourToolpath[], 
  toleranceMm = 8.0,
  disallowedPartIds = new Set<string>()
): { toolpaths: ContourToolpath[]; commonEdges: number } {
  const clc = applyCommonLineCutting(outerToolpaths, toleranceMm, disallowedPartIds);
  // Reorder so that common-line anchored toolpaths are prioritized first
  const commonLineParts = clc.toolpaths.filter((tp: ContourToolpath) => tp.isCommonLine);
  const remainingParts = clc.toolpaths.filter((tp: ContourToolpath) => !tp.isCommonLine);
  return {
    toolpaths: [...commonLineParts, ...remainingParts],
    commonEdges: clc.commonEdges,
  };
}

/**
 * 🌉 Bridge Cutting / Chain Cutting (Köprü Kesim)
 * Connects adjacent outer contours across scrap skeleton so the plasma torch stays fired,
 * eliminating unnecessary pierces, nozzle wear, and pierce dwell delays.
 */
export function applyBridgeCutting(
  toolpaths: ContourToolpath[],
  profile: PlasmaProcessProfile,
  maxBridgeDistMm = 40.0
): { toolpaths: ContourToolpath[]; bridgeCount: number } {
  if (toolpaths.length < 2) return { toolpaths, bridgeCount: 0 };

  const result: ContourToolpath[] = [];
  let bridgeCount = 0;

  for (let i = 0; i < toolpaths.length; i++) {
    const current = toolpaths[i];

    // Only bridge outer contours (never inside closed holes or anchor edges)
    if (i < toolpaths.length - 1 && current.role === 'outer' && !current.isAnchorEdge) {
      const next = toolpaths[i + 1];

      if (next.role === 'outer' && !next.isAnchorEdge && current.enableBridge !== false && next.enableBridge !== false) {
        const exitPt = current.endPoint;
        const entryPt = next.startPoint;
        const dist = distance(exitPt, entryPt);

        // Check bridge distance (between 0.5mm and maxBridgeDistMm)
        if (dist > 0.5 && dist <= maxBridgeDistMm) {
          const bridgeSeg = createLineSegment(exitPt, entryPt);
          current.operations.push({
            type: 'bridgeCut',
            segment: bridgeSeg,
            feedRateMmMin: profile.cutSpeedMmMin,
            torchOn: true,
            isBridge: true,
            sequenceLabel: `Köprü Kesim ${bridgeCount + 1} (Bridge)`
          });
          current.endPoint = entryPt;
          current.hasBridge = true;
          current.totalLengthMm += dist;

          // Remove the initial rapid & pierce from next toolpath because torch stays lit!
          const cleanedNextOps: ToolpathOperation[] = [];
          let skippedPierce = false;
          for (const op of next.operations) {
            if (!skippedPierce && (op.type === 'rapid' || op.type === 'pierce')) {
              if (op.type === 'pierce') skippedPierce = true;
              continue;
            }
            cleanedNextOps.push(op);
          }
          next.operations = cleanedNextOps;
          next.piercePoint = entryPt;
          bridgeCount++;
        }
      }
    }

    result.push(current);
  }

  return { toolpaths: result, bridgeCount };
}

/**
 * 📍 Inserts microjoints (Köprü Sekmeler / Tutucular) along an outer toolpath cut
 */
export function applyMicrojointsToToolpath(
  tp: ContourToolpath,
  tabWidthMm = 2.0,
  desiredCount = 2
): void {
  if (tp.role !== 'outer' || tp.operations.length === 0 || tp.isAnchorEdge) return;

  const cutOps = tp.operations.filter(op => op.type === 'cut' && op.segment && op.segment.type === 'line' && !op.isCommonLine);
  if (cutOps.length === 0) return;

  const tabsToPlace = Math.min(cutOps.length, Math.max(1, desiredCount));
  const newOps: ToolpathOperation[] = [];
  let tabsPlaced = 0;

  for (const op of tp.operations) {
    if (op.type === 'cut' && op.segment && op.segment.type === 'line' && !op.isCommonLine && tabsPlaced < tabsToPlace && op.segment.length > tabWidthMm * 4) {
      const seg = op.segment;
      const mid = { x: (seg.start.x + seg.end.x) / 2, y: (seg.start.y + seg.end.y) / 2 };
      const len = seg.length;
      const dirX = (seg.end.x - seg.start.x) / len;
      const dirY = (seg.end.y - seg.start.y) / len;

      const tabStart = { x: mid.x - dirX * (tabWidthMm / 2), y: mid.y - dirY * (tabWidthMm / 2) };
      const tabEnd = { x: mid.x + dirX * (tabWidthMm / 2), y: mid.y + dirY * (tabWidthMm / 2) };

      newOps.push({
        ...op,
        segment: createLineSegment(seg.start, tabStart)
      });
      newOps.push({
        type: 'rapid',
        segment: createLineSegment(tabStart, tabEnd),
        feedRateMmMin: 12000,
        torchOn: false,
        isMicrojoint: true,
        sequenceLabel: `Mikrojoint ${tabsPlaced + 1} (Sekme)`
      });
      newOps.push({
        ...op,
        segment: createLineSegment(tabEnd, seg.end)
      });

      tabsPlaced++;
      tp.hasMicrojoint = true;
      tp.tabWidthMm = tabWidthMm;
    } else {
      newOps.push(op);
    }
  }

  tp.operations = newOps;
}

/**
 * Anti-Warping Slender Sequencing Strategy
 * For long/narrow parts, sequences cuts alternately across the sheet to balance thermal gradients.
 */
function orderContoursAntiWarp(contours: ContourToolpath[]): ContourToolpath[] {
  if (contours.length <= 1) return contours;
  // Sort by Y first, then alternate cutting left-to-right and right-to-left
  const sorted = [...contours].sort((a, b) => a.piercePoint.y - b.piercePoint.y);
  const result: ContourToolpath[] = [];
  let leftToRight = true;

  for (let i = 0; i < sorted.length; i += 2) {
    const pair = sorted.slice(i, i + 2);
    if (leftToRight) {
      pair.sort((a, b) => a.piercePoint.x - b.piercePoint.x);
    } else {
      pair.sort((a, b) => b.piercePoint.x - a.piercePoint.x);
    }
    result.push(...pair);
    leftToRight = !leftToRight;
  }

  return result;
}

// ─── ORDERING ALGORITHMS ───

function orderContoursByNearest(contours: ContourToolpath[], start: Point2D): ContourToolpath[] {
  const remaining = [...contours];
  const ordered: ContourToolpath[] = [];
  let current = start;

  while (remaining.length > 0) {
    let bestIdx = 0;
    let minDist = Infinity;
    for (let i = 0; i < remaining.length; i++) {
      const d = distance(current, remaining[i].piercePoint);
      if (d < minDist) {
        minDist = d;
        bestIdx = i;
      }
    }
    const next = remaining.splice(bestIdx, 1)[0];
    ordered.push(next);
    current = next.endPoint;
  }
  return ordered;
}

function orderContoursThermalHopping(contours: ContourToolpath[], minSpacingSigma: number): ContourToolpath[] {
  const remaining = [...contours];
  const ordered: ContourToolpath[] = [];
  let current: Point2D = { x: 0, y: 0 };

  while (remaining.length > 0) {
    // Look for next contour that is at least minSpacingSigma away from recently cut point,
    // to allow cooling, but choose nearest among those that satisfy spacing
    let bestIdx = -1;
    let bestDist = Infinity;

    for (let i = 0; i < remaining.length; i++) {
      const d = distance(current, remaining[i].piercePoint);
      if (d >= minSpacingSigma && d < bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    }

    // If all remaining contours are closer than sigma, pick the furthest one to maximize cooling
    if (bestIdx === -1) {
      let maxDist = -Infinity;
      for (let i = 0; i < remaining.length; i++) {
        const d = distance(current, remaining[i].piercePoint);
        if (d > maxDist) {
          maxDist = d;
          bestIdx = i;
        }
      }
    }

    const next = remaining.splice(bestIdx, 1)[0];
    ordered.push(next);
    current = next.endPoint;
  }
  return ordered;
}

function orderContoursCenterOut(contours: ContourToolpath[]): ContourToolpath[] {
  if (contours.length === 0) return [];
  // Find geometric centroid of all pierce points
  let cx = 0, cy = 0;
  for (const c of contours) {
    cx += c.piercePoint.x;
    cy += c.piercePoint.y;
  }
  cx /= contours.length;
  cy /= contours.length;
  const center: Point2D = { x: cx, y: cy };

  return [...contours].sort((a, b) => distance(center, a.piercePoint) - distance(center, b.piercePoint));
}
