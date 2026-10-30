/**
 * DFM (Design for Manufacturing) Evaluator Engine
 *
 * Runs comprehensive multi-rule inspections on 3D parts and 2D profiles:
 * 1. Primitive and extruded wall thickness limits
 * 2. Hole-to-hole clearance and thread overlaps
 * 3. Analytical hole-to-edge distances using ProfileLoop
 * 4. Tap thread engagement & blind hole chip clearance
 * 5. T-Slot lip and channel integrity
 */

import { DesignPart } from '@/design-studio/designStore';
import { MateConstraint } from '@/design-studio/assembly/mateTypes';
import { ISO_METRIC_HOLES, HoleItem } from '@/design-studio/holeStandards';
import { getTSlotSpec } from '@/cad/catalog/tSlotProfiles';
import { distPointToLoop } from './geometryQueries';
import { DfmIssue, DfmReport, DfmSeverity } from './dfmTypes';
import { getMaterialDfmConfig } from './dfmRules';

/**
 * Evaluates full assembly for DFM compliance.
 */
export function evaluateAssemblyDfm(
  parts: DesignPart[],
  mates: MateConstraint[] = [],
  selectedMaterialId = 'al-6061-t6'
): DfmReport {
  const issues: DfmIssue[] = [];
  const matConfig = getMaterialDfmConfig(selectedMaterialId);

  for (const part of parts) {
    // Skip inserted hardware (bolts, nuts, washers) from DFM checks
    if (part.kind === 'hex-bolt' || part.kind === 'hex-nut' || part.kind === 'washer') {
      continue;
    }

    const p = part.params || {};

    // 1. Primitive Absolute Minimum Wall Check (WALL_MIN_ABS)
    const tubeWall = p.wall !== undefined ? p.wall : (p.diameter !== undefined && p.innerDiameter !== undefined ? (p.diameter - p.innerDiameter) / 2 : undefined);
    if (part.kind === 'tube' && tubeWall !== undefined) {
      if (tubeWall < 0.8) {
        issues.push({
          id: `${part.id}-tube-wall-crit`,
          ruleId: 'WALL_MIN_ABS',
          severity: 'CRITICAL',
          partId: part.id,
          partName: part.name,
          title: 'CRITICAL THIN WALL: Tube Shell',
          titleTr: '🔴 KRİTİK İNCE CİDAR: Boru Et Kalınlığı',
          message: `Tube wall ${tubeWall.toFixed(2)}mm is below minimum safe threshold (0.8mm). Risk of collapse under clamping/turning.`,
          messageTr: `Boru et kalınlığı ${tubeWall.toFixed(2)} mm minimum sınırın (0.8 mm) altında! Torna ve mengeneyle sıkmada ezilme riski var.`,
          measured: Number(tubeWall.toFixed(2)),
          required: 0.8,
          unit: 'mm',
          standard: 'DIN 7168',
        });
      } else if (tubeWall < matConfig.minWall) {
        issues.push({
          id: `${part.id}-tube-wall-warn`,
          ruleId: 'WALL_MIN_ABS',
          severity: 'WARNING',
          partId: part.id,
          partName: part.name,
          title: 'INSUFFICIENT WALL THICKNESS: Tube',
          titleTr: '⚠️ DÜŞÜK ET KALINLIĞI: Boru',
          message: `Tube wall ${tubeWall.toFixed(2)}mm is below recommended ${matConfig.minWall}mm.`,
          messageTr: `Boru et kalınlığı ${tubeWall.toFixed(2)} mm önerilen ${matConfig.minWall} mm sınırının altında.`,
          measured: Number(tubeWall.toFixed(2)),
          required: matConfig.minWall,
          unit: 'mm',
          standard: 'DIN 7168',
        });
      }
    }

    if (part.kind === 'plate' && p.depth !== undefined && p.depth < 0.8) {
      issues.push({
        id: `${part.id}-plate-depth-crit`,
        ruleId: 'WALL_MIN_ABS',
        severity: 'CRITICAL',
        partId: part.id,
        partName: part.name,
        title: 'CRITICAL THIN PLATE: Plate Depth',
        titleTr: '🔴 KRİTİK İNCE PLAKA',
        message: `Plate thickness ${p.depth}mm is under minimum structural limit (0.8mm).`,
        messageTr: `Plaka kalınlığı ${p.depth} mm minimum yapısal sınırın (0.8 mm) altında.`,
        measured: p.depth,
        required: 0.8,
        unit: 'mm',
        standard: 'ISO 2768-m',
      });
    }

    // 2. Surface Holes Inspection (HoleItem array)
    const holes: HoleItem[] = part.holes || [];

    for (let i = 0; i < holes.length; i++) {
      const h1 = holes[i];
      const std1 = ISO_METRIC_HOLES.find((s) => s.size === h1.size) || {
        nominalDiameter: 6,
        coarsePitch: 1.0,
        tapDrillDiameter: 5.0,
        counterboreDiameter: 10.0,
      };
      const d1 = h1.diameter || std1.nominalDiameter;
      const r1 = (h1.type === 'counterbore' ? std1.counterboreDiameter : d1) / 2;

      // 2A. Hole-to-Hole Interference & Wall
      for (let j = i + 1; j < holes.length; j++) {
        const h2 = holes[j];
        if (h1.face !== h2.face) continue; // Only check holes on the same face

        const std2 = ISO_METRIC_HOLES.find((s) => s.size === h2.size) || {
          nominalDiameter: 6,
          coarsePitch: 1.0,
          tapDrillDiameter: 5.0,
          counterboreDiameter: 10.0,
        };
        const d2 = h2.diameter || std2.nominalDiameter;
        const r2 = (h2.type === 'counterbore' ? std2.counterboreDiameter : d2) / 2;

        const centerDist = Math.hypot(h2.x - h1.x, h2.y - h1.y);
        const sumR = r1 + r2;
        const minWall = 0.5 * Math.min(d1, d2);

        if (centerDist < sumR) {
          issues.push({
            id: `${part.id}-overlap-${h1.id}-${h2.id}`,
            ruleId: 'HOLE_HOLE_OVERLAP',
            severity: 'CRITICAL',
            partId: part.id,
            partName: part.name,
            title: `CRITICAL HOLE INTERSECTION: ${h1.size} & ${h2.size}`,
            titleTr: `🔴 DELİK ÇAKIŞMASI: ${h1.size} ile ${h2.size}`,
            message: `Holes overlap by ${(sumR - centerDist).toFixed(2)}mm! Tool breakage guaranteed.`,
            messageTr: `Delikler ${(sumR - centerDist).toFixed(2)} mm çakışıyor! Takım kırılması ve hurda riski.`,
            measured: Number(centerDist.toFixed(2)),
            required: Number(sumR.toFixed(2)),
            unit: 'mm',
            standard: 'ISO 2768-m',
          });
        } else if (centerDist < sumR + minWall) {
          const remWall = centerDist - sumR;
          issues.push({
            id: `${part.id}-wall-${h1.id}-${h2.id}`,
            ruleId: 'HOLE_HOLE_WALL',
            severity: 'WARNING',
            partId: part.id,
            partName: part.name,
            title: `INSUFFICIENT WALL BETWEEN HOLES: ${h1.size} & ${h2.size}`,
            titleTr: `⚠️ DELİKLER ARASI YETERSİZ ET: ${h1.size} - ${h2.size}`,
            message: `Remaining wall between holes is only ${remWall.toFixed(2)}mm (Min safe: ${minWall.toFixed(2)}mm).`,
            messageTr: `Delikler arası kalan et sadece ${remWall.toFixed(2)} mm (Güvenli min: ${minWall.toFixed(2)} mm).`,
            measured: Number(remWall.toFixed(2)),
            required: Number(minWall.toFixed(2)),
            unit: 'mm',
            standard: 'VDI 2230',
          });
        }
      }

      // 2B. Hole-to-Edge Distance (VDI 2230)
      let distToBoundary = Infinity;
      if (part.profileRegion && part.profileRegion.outer) {
        distToBoundary = distPointToLoop({ x: h1.x, y: h1.y }, part.profileRegion.outer);
      } else {
        // Fallback to bounding box of active face
        const pw = p.width || p.diameter || 60;
        const ph = p.length || p.depth || p.height || 40;
        const halfW = pw / 2;
        const halfH = ph / 2;
        const dL = Math.abs(h1.x - -halfW);
        const dR = Math.abs(halfW - h1.x);
        const dB = Math.abs(h1.y - -halfH);
        const dT = Math.abs(halfH - h1.y);
        distToBoundary = Math.min(dL, dR, dB, dT);
      }

      // Hole edge cut (center distance < radius means hole breaches edge)
      if (distToBoundary < r1) {
        issues.push({
          id: `${part.id}-edge-cut-${h1.id}`,
          ruleId: 'HOLE_EDGE_CUT',
          severity: 'CRITICAL',
          partId: part.id,
          partName: part.name,
          title: `HOLE BREACHES EDGE: ${h1.size}`,
          titleTr: `🔴 DELİK KENARI KESİYOR: ${h1.size}`,
          message: `Hole cuts outside workpiece boundary by ${(r1 - distToBoundary).toFixed(2)}mm!`,
          messageTr: `Delik parça dışına ${(r1 - distToBoundary).toFixed(2)} mm taşıyor!`,
          measured: Number(distToBoundary.toFixed(2)),
          required: Number(r1.toFixed(2)),
          unit: 'mm',
          standard: 'ISO 2768-m',
        });
      } else {
        const remainingWall = distToBoundary - r1;
        const criticalLimit = 0.5 * d1;
        const recommendedLimit = matConfig.edgeCenterMultiplier * d1;

        if (remainingWall < criticalLimit) {
          issues.push({
            id: `${part.id}-edge-crit-${h1.id}`,
            ruleId: 'HOLE_EDGE_CLEARANCE',
            severity: 'CRITICAL',
            partId: part.id,
            partName: part.name,
            title: `CRITICAL EDGE DISTANCE: ${h1.size}`,
            titleTr: `🔴 KRİTİK KENAR YAKINLIĞI: ${h1.size}`,
            message: `Remaining edge wall ${remainingWall.toFixed(2)}mm is under critical limit (${criticalLimit.toFixed(2)}mm). Edge blowout risk.`,
            messageTr: `Kenar et kalınlığı ${remainingWall.toFixed(2)} mm kritik sınırın (${criticalLimit.toFixed(2)} mm) altında! Kenar yırtılma riski yüksek.`,
            measured: Number(remainingWall.toFixed(2)),
            required: Number(criticalLimit.toFixed(2)),
            unit: 'mm',
            standard: 'VDI 2230',
          });
        } else if (distToBoundary < recommendedLimit) {
          issues.push({
            id: `${part.id}-edge-warn-${h1.id}`,
            ruleId: 'HOLE_EDGE_CLEARANCE',
            severity: 'WARNING',
            partId: part.id,
            partName: part.name,
            title: `INSUFFICIENT EDGE CLEARANCE: ${h1.size}`,
            titleTr: `⚠️ YETERSİZ KENAR MESAFESİ: ${h1.size}`,
            message: `Center-to-edge distance ${distToBoundary.toFixed(2)}mm is below VDI 2230 standard (${recommendedLimit.toFixed(2)}mm).`,
            messageTr: `Merkez-kenar mesafesi ${distToBoundary.toFixed(2)} mm VDI 2230 standardının (${recommendedLimit.toFixed(2)} mm) altında.`,
            measured: Number(distToBoundary.toFixed(2)),
            required: Number(recommendedLimit.toFixed(2)),
            unit: 'mm',
            standard: 'VDI 2230',
          });
        }
      }

      // 2C. Tap Thread Engagement & Blind Chip Clearance
      if (h1.type === 'tap') {
        const faceThickness = p.depth || p.thickness || 15;
        const holeDepth = h1.isThroughAll ? faceThickness : (h1.depth ?? faceThickness);
        const threadLength = h1.depth ?? holeDepth;
        const requiredEngagement = matConfig.tapEngagementMultiplier * d1;
        const criticalEngagement = matConfig.tapCriticalMultiplier * d1;

        if (h1.isThroughAll) {
          if (faceThickness < criticalEngagement) {
            issues.push({
              id: `${part.id}-tap-thin-${h1.id}`,
              ruleId: 'TAP_THIN_PLATE',
              severity: 'CRITICAL',
              partId: part.id,
              partName: part.name,
              title: `CRITICAL THIN PLATE FOR TAP: ${h1.size}`,
              titleTr: `🔴 KILAVUZ İÇİN YETERSİZ KALINLIK: ${h1.size}`,
              message: `Plate thickness ${faceThickness}mm is too thin for ${h1.size} (Min critical: ${criticalEngagement.toFixed(1)}mm). Threads will strip.`,
              messageTr: `Plaka kalınlığı ${faceThickness} mm ${h1.size} için çok ince (Kritik min: ${criticalEngagement.toFixed(1)} mm). Dişler sıyırır.`,
              measured: Number(faceThickness.toFixed(1)),
              required: Number(criticalEngagement.toFixed(1)),
              unit: 'mm',
              standard: 'VDI 2230 / ISO 898',
            });
          } else if (faceThickness < requiredEngagement) {
            issues.push({
              id: `${part.id}-tap-eng-warn-${h1.id}`,
              ruleId: 'TAP_ENGAGEMENT',
              severity: 'WARNING',
              partId: part.id,
              partName: part.name,
              title: `LOW THREAD ENGAGEMENT: ${h1.size}`,
              titleTr: `⚠️ DÜŞÜK DİŞ KAVRAMA DERİNLİĞİ: ${h1.size}`,
              message: `Thread depth ${faceThickness}mm is below recommended 1.5×D (${requiredEngagement.toFixed(1)}mm) in aluminum.`,
              messageTr: `Diş boyu ${faceThickness} mm alüminyumda önerilen 1.5×D (${requiredEngagement.toFixed(1)} mm) değerinden az.`,
              measured: Number(faceThickness.toFixed(1)),
              required: Number(requiredEngagement.toFixed(1)),
              unit: 'mm',
              standard: 'VDI 2230',
            });
          }
        } else {
          // Blind Tap Hole
          if (threadLength < criticalEngagement) {
            issues.push({
              id: `${part.id}-tap-blind-crit-${h1.id}`,
              ruleId: 'TAP_ENGAGEMENT',
              severity: 'CRITICAL',
              partId: part.id,
              partName: part.name,
              title: `INSUFFICIENT THREAD ENGAGEMENT: ${h1.size}`,
              titleTr: `🔴 YETERSİZ KILAVUZ DERİNLİĞİ: ${h1.size}`,
              message: `Blind thread depth ${threadLength}mm is under 1.0×D (${criticalEngagement.toFixed(1)}mm).`,
              messageTr: `Kör delik diş boyu ${threadLength} mm 1.0×D (${criticalEngagement.toFixed(1)} mm) sınırının altında.`,
              measured: Number(threadLength.toFixed(1)),
              required: Number(criticalEngagement.toFixed(1)),
              unit: 'mm',
              standard: 'VDI 2230',
            });
          } else if (threadLength < requiredEngagement) {
            issues.push({
              id: `${part.id}-tap-blind-warn-${h1.id}`,
              ruleId: 'TAP_ENGAGEMENT',
              severity: 'WARNING',
              partId: part.id,
              partName: part.name,
              title: `RECOMMENDED THREAD ENGAGEMENT: ${h1.size}`,
              titleTr: `⚠️ TAVSİYE EDİLEN KILAVUZ BOYU: ${h1.size}`,
              message: `Thread depth ${threadLength}mm is below recommended 1.5×D (${requiredEngagement.toFixed(1)}mm).`,
              messageTr: `Diş boyu ${threadLength} mm tavsiye edilen 1.5×D (${requiredEngagement.toFixed(1)} mm) altında.`,
              measured: Number(threadLength.toFixed(1)),
              required: Number(requiredEngagement.toFixed(1)),
              unit: 'mm',
              standard: 'VDI 2230',
            });
          }

          // Blind hole chip clearance (holeDepth - threadLength >= 2 * Pitch)
          const chipSpace = holeDepth - threadLength;
          const minChip = 2.0 * std1.coarsePitch;
          if (chipSpace < minChip) {
            issues.push({
              id: `${part.id}-tap-chip-${h1.id}`,
              ruleId: 'TAP_BLIND_CHIP',
              severity: 'WARNING',
              partId: part.id,
              partName: part.name,
              title: `BLIND TAP CHIP CLEARANCE LOW: ${h1.size}`,
              titleTr: `⚠️ KÖR DELİK TALAŞ PAYI YETERSİZ: ${h1.size}`,
              message: `Chip clearance ${chipSpace.toFixed(1)}mm is less than 2×Pitch (${minChip.toFixed(1)}mm). Tap tool may bottom out.`,
              messageTr: `Dip talaş payı ${chipSpace.toFixed(1)} mm 2×Adım (${minChip.toFixed(1)} mm) altında. Kılavuz dibe vurup kırılabilir.`,
              measured: Number(chipSpace.toFixed(1)),
              required: Number(minChip.toFixed(1)),
              unit: 'mm',
              standard: 'ISO 965',
            });
          }
        }
      }
    }

    // 3. T-Slot Lip & Channel Protection
    if (part.kind === 't-slot') {
      const spec = getTSlotSpec(p.series || p.width || 40);
      const halfSize = spec.size / 2;

      for (const h of holes) {
        // Distance from face center (slot axis is along centerline x=0)
        const distFromSlotCenter = Math.abs(h.x);
        const std = ISO_METRIC_HOLES.find((s) => s.size === h.size);
        const hr = (std?.nominalDiameter || 6) / 2;

        // Check if hole breaches into the slot lip
        const lipOuterX = spec.slot / 2 + spec.lip;
        const distToLip = Math.abs(distFromSlotCenter - lipOuterX);

        if (distFromSlotCenter < spec.slot / 2 + hr) {
          // Check if this is an intentional mated bolt
          const isMated = mates.some(
            (m) => (m.partAId === part.id || m.partBId === part.id) && m.kind === 'end-to-slot'
          );

          if (isMated) {
            issues.push({
              id: `${part.id}-slot-notice-${h.id}`,
              ruleId: 'TSLOT_CHANNEL_INTERSECT',
              severity: 'NOTICE',
              partId: part.id,
              partName: part.name,
              title: `T-Slot Through-Bolt Detected: ${h.size}`,
              titleTr: `ℹ️ T-Kanal Cıvata Montajı: ${h.size}`,
              message: `Hole passes through T-slot channel as part of active assembly mate.`,
              messageTr: `Delik montaj mate'i kapsamında T-kanaldan geçiyor.`,
              measured: Number(distFromSlotCenter.toFixed(1)),
              required: 0,
              unit: 'mm',
              standard: 'EN 12020',
            });
          } else {
            issues.push({
              id: `${part.id}-slot-intersect-${h.id}`,
              ruleId: 'TSLOT_CHANNEL_INTERSECT',
              severity: 'CRITICAL',
              partId: part.id,
              partName: part.name,
              title: `HOLE BLOCKS T-SLOT CHANNEL: ${h.size}`,
              titleTr: `🔴 DELİK T-KANALINI KESİYOR: ${h.size}`,
              message: `Hole intersects T-slot channel, blocking T-nut slide without an active mate.`,
              messageTr: `Delik T-kanal boşluğuna giriyor; somun kaymasını engeller.`,
              measured: Number(distFromSlotCenter.toFixed(1)),
              required: Number((spec.slot / 2 + hr).toFixed(1)),
              unit: 'mm',
              standard: 'EN 12020',
            });
          }
        } else if (distToLip < 0.5) {
          issues.push({
            id: `${part.id}-lip-crit-${h.id}`,
            ruleId: 'TSLOT_LIP_REMAIN',
            severity: 'CRITICAL',
            partId: part.id,
            partName: part.name,
            title: `CRITICAL T-SLOT LIP DAMAGE: ${h.size}`,
            titleTr: `🔴 KRİTİK T-KANAL DUDAK HASARI: ${h.size}`,
            message: `Remaining lip thickness is under 0.5mm. Flange will crack under clamping.`,
            messageTr: `T-kanal dudak kalınlığı 0.5 mm altına indi. Sıkma kuvvetinde dudak kırılır.`,
            measured: Number(distToLip.toFixed(2)),
            required: 0.5,
            unit: 'mm',
            standard: 'EN 12020',
          });
        }
      }
    }
  }

  const criticalCount = issues.filter((i) => i.severity === 'CRITICAL').length;
  const warningCount = issues.filter((i) => i.severity === 'WARNING').length;
  const noticeCount = issues.filter((i) => i.severity === 'NOTICE').length;

  // Quality score formula: 100 - 25 * crit - 8 * warn
  const rawScore = 100 - criticalCount * 25 - warningCount * 8;
  const score = Math.max(0, Math.min(100, rawScore));

  return {
    score,
    passed: criticalCount === 0,
    criticalCount,
    warningCount,
    noticeCount,
    issues,
    timestamp: Date.now(),
  };
}
