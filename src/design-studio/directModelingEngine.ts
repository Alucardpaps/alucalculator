/**
 * 🚀 NEXT-GEN DIRECT 3D MODELING & AEGIS COMMAND ENGINE
 * 
 * Provides frictionless direct modeling features beyond traditional CAD:
 * 1. Direct Face Push-Pull (Extrude/Thicken along surface normal without modal dialogs)
 * 2. Smart Face Feature Stamps (1-click 4x Corner Bolts, Center Bore, CNC Pocket, Isogrid Lightweighting)
 * 3. CNC Tooling & DFM Health Checks (Minimum wall thickness, pocket aspect ratio, tool access)
 * 4. Deterministic Natural Language Engineering Command Parser (AeGiS 3D Quick Console)
 */

import { type DesignPart, type Point2D } from './designStore';
import { type SurfaceFace, type HoleItem, type SurfaceCutItem, ISO_METRIC_HOLES } from './holeStandards';
import { getPartBoundingMetrics } from './geometryFactory';

export interface PushPullResult {
  updatedParams: Record<string, any>;
  updatedName: string;
  axisKey: string;
  newVal: number;
  deltaMm: number;
}

export interface SynchronousMoveFaceResult extends PushPullResult {
  success: boolean;
  face: SurfaceFace;
  newDimensionMm: number;
  updatedHoles: HoleItem[];
  updatedCuts: SurfaceCutItem[];
}

export interface DeleteFaceHealResult {
  success: boolean;
  updatedHoles: HoleItem[];
  updatedCuts: SurfaceCutItem[];
  healedFeatureType: 'hole' | 'cut' | 'fillet' | 'none';
  messageEn: string;
  messageTr: string;
}

export interface ResizeHoleDirectResult {
  success: boolean;
  updatedHoles: HoleItem[];
  oldSize: string;
  newSize: string;
  messageEn: string;
  messageTr: string;
}

export interface DraftFaceResult {
  success: boolean;
  updatedParams: Record<string, any>;
  draftAngle: number;
  draftAngleDeg: number;
  draftDirection: 'inward' | 'outward';
  messageEn: string;
  messageTr: string;
}

export interface CoplanarFaceMatch {
  partId: string;
  partName: string;
  face: SurfaceFace;
  matchedFace: SurfaceFace;
  worldPlaneCoord: number;
  distanceDifference: number;
}

export interface DfmHealthReport {
  isMachinable: boolean;
  score: number; // 0 - 100
  minWallMm: number;
  toolingRadiusMm: number;
  warnings: string[];
  recommendations: string[];
  massKg: number;
  weightSavingsPct: number;
}

export interface AegisCommandResult {
  recognized: boolean;
  action: 'resize' | 'hole' | 'bolts' | 'lightweight' | 'slot' | 'material' | 'duplicate' | 'fillet' | 'operator' | 'unknown';
  messageEn: string;
  messageTr: string;
  details?: Record<string, any>;
}

/**
 * 1. Direct Face Push-Pull
 * Directly thickens or shrinks a part by pushing or pulling the active surface face.
 */
export function applyPushPull(
  part: DesignPart,
  face: SurfaceFace,
  deltaMm: number
): PushPullResult {
  const p = { ...(part.params || {}) };
  let axisKey = 'height';

  // Determine parameter key based on part kind and face normal
  if (part.kind === 'box' || part.kind === 'plate' || part.kind === 'pyramid' || part.kind === 'wedge' || part.kind === 'trapezoid') {
    if (face === 'top' || face === 'bottom') {
      axisKey = 'height';
    } else if (face === 'left' || face === 'right') {
      axisKey = 'width';
    } else {
      axisKey = 'depth';
    }
  } else if (part.kind === 'cylinder' || part.kind === 'tube' || part.kind === 'cone' || part.kind === 'hex-prism') {
    if (face === 'top' || face === 'bottom') {
      axisKey = 'length';
    } else {
      axisKey = 'diameter';
    }
  } else {
    // Custom extruded solid
    if (face === 'top' || face === 'bottom') {
      axisKey = p.extrudeDepth ? 'extrudeDepth' : (p.depth ? 'depth' : 'height');
    } else if (face === 'left' || face === 'right') {
      axisKey = 'width';
    } else {
      axisKey = 'depth';
    }
  }

  const currentVal = Number(p[axisKey] || 40);
  const newVal = Math.max(1, Math.round((currentVal + deltaMm) * 10) / 10);
  p[axisKey] = newVal;

  // Auto-update standard dimension callout in name (e.g. "Plate 80x40x10" -> "Plate 80x50x10")
  let updatedName = part.name;
  if (p.width && p.height && p.depth) {
    const dimRegex = /\b\d+(?:\.\d+)?\s*[xX×]\s*\d+(?:\.\d+)?\s*[xX×]\s*\d+(?:\.\d+)?\b/;
    if (dimRegex.test(updatedName)) {
      updatedName = updatedName.replace(dimRegex, `${p.width}x${p.height}x${p.depth}`);
    }
  } else if (p.diameter && p.length) {
    const diaRegex = /Ø?\d+(?:\.\d+)?\s*[xX×]\s*\d+(?:\.\d+)?/;
    if (diaRegex.test(updatedName)) {
      updatedName = updatedName.replace(diaRegex, `Ø${p.diameter}x${p.length}`);
    }
  }

  return {
    updatedParams: p,
    updatedName,
    axisKey,
    newVal,
    deltaMm,
  };
}

/**
 * 1b. Siemens NX Synchronous Move Face (Offset Face with attached features synchronization)
 */
export function applySynchronousMoveFace(
  part: DesignPart,
  face: SurfaceFace,
  deltaMm: number,
  synchronizeFeatures = true
): SynchronousMoveFaceResult {
  const pushRes = applyPushPull(part, face, deltaMm);
  let updatedHoles = [...(part.holes || [])];
  let updatedCuts = [...(part.cuts || [])];

  if (synchronizeFeatures && Math.abs(deltaMm) > 0.01) {
    const newDepth = pushRes.newVal;
    updatedHoles = updatedHoles.map((h) => {
      if (h.isThroughAll || face === 'top' || face === 'bottom') {
        return {
          ...h,
          depth: Math.max(h.depth ?? 10, newDepth),
        };
      }
      return h;
    });

    updatedCuts = updatedCuts.map((c) => {
      if (c.face === face) {
        return {
          ...c,
          depth: Math.min(newDepth - 1, c.depth),
        };
      }
      return c;
    });
  }

  return {
    ...pushRes,
    success: true,
    face,
    newDimensionMm: pushRes.newVal,
    updatedHoles,
    updatedCuts,
  };
}

/**
 * 1c. Siemens NX Delete Face & Auto-Heal (SolidWorks Delete & Patch)
 * Deletes selected hole or cut pocket and heals surrounding bounding face into unbroken solid.
 */
export function applyDeleteFaceAndHeal(
  part: DesignPart,
  face: SurfaceFace,
  featureId?: string
): DeleteFaceHealResult {
  const holes = [...(part.holes || [])];
  const cuts = [...(part.cuts || [])];

  // 1. Explicit feature ID
  if (featureId) {
    const holeIdx = holes.findIndex((h) => h.id === featureId);
    if (holeIdx !== -1) {
      const removed = holes.splice(holeIdx, 1)[0];
      return {
        success: true,
        updatedHoles: holes,
        updatedCuts: cuts,
        healedFeatureType: 'hole',
        messageEn: `Deleted hole ${removed.size} and healed ${face.toUpperCase()} face.`,
        messageTr: `${face.toUpperCase()} yüzeyindeki ${removed.size} deliği silindi ve yüzey onarıldı.`,
      };
    }
    const cutIdx = cuts.findIndex((c) => c.id === featureId);
    if (cutIdx !== -1) {
      const removed = cuts.splice(cutIdx, 1)[0];
      return {
        success: true,
        updatedHoles: holes,
        updatedCuts: cuts,
        healedFeatureType: 'cut',
        messageEn: `Deleted pocket ${removed.type} and healed ${face.toUpperCase()} face.`,
        messageTr: `${face.toUpperCase()} yüzeyindeki ${removed.type} cebi silindi ve yüzey onarıldı.`,
      };
    }
  }

  // 2. Most recent hole or cut on the face
  for (let i = holes.length - 1; i >= 0; i--) {
    if (holes[i].face === face) {
      const removed = holes.splice(i, 1)[0];
      return {
        success: true,
        updatedHoles: holes,
        updatedCuts: cuts,
        healedFeatureType: 'hole',
        messageEn: `Deleted hole ${removed.size} and healed ${face.toUpperCase()} face.`,
        messageTr: `${face.toUpperCase()} yüzeyindeki ${removed.size} deliği silindi ve yüzey onarıldı.`,
      };
    }
  }

  for (let i = cuts.length - 1; i >= 0; i--) {
    if (cuts[i].face === face) {
      const removed = cuts.splice(i, 1)[0];
      return {
        success: true,
        updatedHoles: holes,
        updatedCuts: cuts,
        healedFeatureType: 'cut',
        messageEn: `Deleted pocket ${removed.type} and healed ${face.toUpperCase()} face.`,
        messageTr: `${face.toUpperCase()} yüzeyindeki ${removed.type} cebi silindi ve yüzey onarıldı.`,
      };
    }
  }

  return {
    success: false,
    updatedHoles: holes,
    updatedCuts: cuts,
    healedFeatureType: 'none',
    messageEn: `No feature found on ${face.toUpperCase()} to delete. Face is continuous.`,
    messageTr: `${face.toUpperCase()} üzerinde silinecek unsur bulunamadı. Yüzey zaten sürekli.`,
  };
}

/**
 * 1d. Siemens NX Resize Hole / Instant3D Direct Diameter Modification
 */
export function applyResizeHoleDirect(
  part: DesignPart,
  face: SurfaceFace,
  newSize: string,
  holeId?: string
): ResizeHoleDirectResult {
  const holes = [...(part.holes || [])];

  let targetIndex = -1;
  if (holeId) {
    targetIndex = holes.findIndex((h) => h.id === holeId);
  } else {
    for (let i = holes.length - 1; i >= 0; i--) {
      if (holes[i].face === face) {
        targetIndex = i;
        break;
      }
    }
  }

  if (targetIndex === -1) {
    return {
      success: false,
      updatedHoles: holes,
      oldSize: '',
      newSize,
      messageEn: `No hole found on ${face.toUpperCase()} face to resize.`,
      messageTr: `${face.toUpperCase()} yüzeyinde boyutlandırılacak delik bulunamadı.`,
    };
  }

  const oldHole = holes[targetIndex];
  const oldSize = oldHole.size;
  const targetStandard = ISO_METRIC_HOLES.find((h) => h.size === newSize);
  let newDia = 10;
  if (targetStandard) {
    if (oldHole.type === 'clearance') {
      newDia = targetStandard.clearanceMedium;
    } else if (oldHole.type === 'tap') {
      newDia = targetStandard.tapDrillDiameter;
    } else {
      newDia = targetStandard.nominalDiameter;
    }
  } else {
    newDia = parseFloat(newSize.replace(/[^\d.]/g, '')) || 10;
  }

  holes[targetIndex] = {
    ...oldHole,
    size: newSize as any,
    diameter: newDia,
  };

  return {
    success: true,
    updatedHoles: holes,
    oldSize,
    newSize,
    messageEn: `Directly resized hole from ${oldSize} to ${newSize} (Ø${newDia}mm).`,
    messageTr: `Delik boyutu ${oldSize}'den ${newSize}'ye (Ø${newDia}mm) güncellendi.`,
  };
}

/**
 * 1e. Siemens NX Draft Angle / Mold Release Taper
 */
export function applyDraftAngleToPart(
  part: DesignPart,
  draftAngleDeg: number,
  draftDirection: 'inward' | 'outward' = 'inward'
): DraftFaceResult {
  const p = { ...(part.params || {}) };
  const safeAngle = Math.max(0, Math.min(15, draftAngleDeg));
  p.draftAngle = safeAngle;
  p.draftDirection = draftDirection;

  return {
    success: true,
    updatedParams: p,
    draftAngle: safeAngle,
    draftAngleDeg: safeAngle,
    draftDirection,
    messageEn: `Applied ${safeAngle}° ${draftDirection} draft angle (mold release taper).`,
    messageTr: `%${safeAngle}° ${draftDirection === 'inward' ? 'içe' : 'dışa'} doğru kalıp çıkma açısı (draft) uygulandı.`,
  };
}

/**
 * 1f. Siemens NX Live Rules: Detect Coplanar Faces across Multi-Part Assembly
 */
export function detectSynchronousCoplanarFaces(
  targetPart: DesignPart,
  targetFace: SurfaceFace,
  allParts: DesignPart[],
  toleranceMm = 0.5
): CoplanarFaceMatch[] {
  const matches: CoplanarFaceMatch[] = [];
  const targetMetrics = getPartBoundingMetrics(targetPart);
  const targetTransform = targetMetrics.getFaceTransform(targetFace);
  const targetWorldPos = {
    x: (targetPart.position?.x || 0) + targetTransform.pos[0] * 10,
    y: (targetPart.position?.y || 0) + targetTransform.pos[1] * 10,
    z: (targetPart.position?.z || 0) + targetTransform.pos[2] * 10,
  };
  const targetNormal = targetTransform.normal;

  for (const p of allParts) {
    if (p.id === targetPart.id || p.visible === false) continue;
    const pMetrics = getPartBoundingMetrics(p);
    const faces: SurfaceFace[] = ['top', 'bottom', 'front', 'back', 'left', 'right'];

    for (const f of faces) {
      const fTransform = pMetrics.getFaceTransform(f);
      const fNormal = fTransform.normal;
      const dotNormal =
        targetNormal[0] * fNormal[0] +
        targetNormal[1] * fNormal[1] +
        targetNormal[2] * fNormal[2];

      if (dotNormal > 0.95) {
        const faceWorldPos = {
          x: (p.position?.x || 0) + fTransform.pos[0] * 10,
          y: (p.position?.y || 0) + fTransform.pos[1] * 10,
          z: (p.position?.z || 0) + fTransform.pos[2] * 10,
        };

        const distDiff = Math.abs(
          (faceWorldPos.x - targetWorldPos.x) * targetNormal[0] +
          (faceWorldPos.y - targetWorldPos.y) * targetNormal[1] +
          (faceWorldPos.z - targetWorldPos.z) * targetNormal[2]
        );

        if (distDiff <= toleranceMm) {
          const worldCoord =
            targetNormal[1] !== 0
              ? faceWorldPos.y
              : targetNormal[0] !== 0
              ? faceWorldPos.x
              : faceWorldPos.z;

          matches.push({
            partId: p.id,
            partName: p.name,
            face: f,
            matchedFace: f,
            worldPlaneCoord: Number(worldCoord.toFixed(2)),
            distanceDifference: Number(distDiff.toFixed(3)),
          });
        }
      }
    }
  }

  return matches;
}

/**
 * 2. Smart Corner Bolt Pattern Stamp
 * Generates 4 standard fastener holes spaced evenly with ISO 1.5d edge clearance.
 */
export function applyCornerBoltPattern(
  part: DesignPart,
  face: SurfaceFace = 'top',
  boltSize: 'M3' | 'M4' | 'M5' | 'M6' | 'M8' | 'M10' | 'M12' | 'M14' | 'M16' | 'M20' | 'M24' | (string & {}) = 'M6'
): HoleItem[] {
  const metrics = getPartBoundingMetrics(part);
  const { planeW, planeH } = metrics.getFaceTransform(face);

  const faceW = planeW * 10;
  const faceH = planeH * 10;

  const standard = ISO_METRIC_HOLES.find((h) => h.size === boltSize) || ISO_METRIC_HOLES[10]; // Default M6
  const minRequired = (standard?.nominalDiameter || 6) * 2.2;
  if (faceW < minRequired || faceH < minRequired) return [];

  const nominalMargin = Math.max(3, Math.round(standard.nominalDiameter * 1.5));
  const maxMargin = Math.min(faceW, faceH) * 0.25;
  const margin = Math.min(nominalMargin, maxMargin);

  const halfW = faceW / 2 - margin;
  const halfH = faceH / 2 - margin;

  if (halfW <= 0 || halfH <= 0) return [];

  const time = Date.now().toString().slice(-4);
  const corners = [
    { x: -halfW, y: -halfH },
    { x: halfW, y: -halfH },
    { x: halfW, y: halfH },
    { x: -halfW, y: halfH },
  ];

  return corners.map((pos, idx) => ({
    id: `bolt-${boltSize.toLowerCase()}-${time}-${idx + 1}`,
    size: boltSize,
    face,
    x: Math.round(pos.x * 10) / 10,
    y: Math.round(pos.y * 10) / 10,
    type: 'counterbore',
    depth: standard.counterboreDepth + 12,
    isThroughAll: true,
  }));
}

/**
 * 3. Smart Center Bore / Through-Hole Stamp
 */
export function applyCenterBore(
  part: DesignPart,
  face: SurfaceFace = 'top',
  diaMm = 20,
  type: 'clearance' | 'tap' | 'counterbore' = 'clearance'
): HoleItem {
  const time = Date.now().toString().slice(-4);
  return {
    id: `bore-${diaMm}-${time}`,
    size: `Ø${diaMm}`,
    face,
    x: 0,
    y: 0,
    type,
    diameter: diaMm,
    isThroughAll: true,
  };
}

/**
 * 4. Generative Isogrid / Lightweighting Pockets
 * Cuts stiffening ribs and pocket recesses, saving ~35% part mass for aerospace/machining.
 */
export function applyLightweightIsogrid(
  part: DesignPart,
  face: SurfaceFace = 'top',
  ribThicknessMm = 4,
  pocketDepthMm = 5
): SurfaceCutItem[] {
  const metrics = getPartBoundingMetrics(part);
  const { planeW, planeH } = metrics.getFaceTransform(face);

  const faceW = planeW * 10;
  const faceH = planeH * 10;

  const margin = Math.max(2, ribThicknessMm * 1.0);
  const usableW = faceW - 2 * margin;
  const usableH = faceH - 2 * margin;

  if (usableW < 8 || usableH < 8) return [];

  const cols = usableW > 60 ? 3 : 2;
  const rows = usableH > 60 ? 3 : 2;

  const pocketW = (usableW - (cols - 1) * ribThicknessMm) / cols;
  const pocketH = (usableH - (rows - 1) * ribThicknessMm) / rows;

  const cuts: SurfaceCutItem[] = [];
  const time = Date.now().toString().slice(-4);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = -usableW / 2 + pocketW / 2 + c * (pocketW + ribThicknessMm);
      const y = -usableH / 2 + pocketH / 2 + r * (pocketH + ribThicknessMm);

      cuts.push({
        id: `isogrid-${time}-${r}-${c}`,
        type: 'rect',
        face,
        x: Math.round(x * 10) / 10,
        y: Math.round(y * 10) / 10,
        width: Math.round(pocketW * 10) / 10,
        length: Math.round(pocketH * 10) / 10,
        depth: pocketDepthMm,
      });
    }
  }

  return cuts;
}

/**
 * 5. Smart Center Slot / Keyway Stamp
 */
export function applyCenterSlot(
  part: DesignPart,
  face: SurfaceFace = 'top',
  slotWidthMm = 14,
  slotLengthMm = 45,
  depthMm = 6
): SurfaceCutItem {
  const time = Date.now().toString().slice(-4);
  return {
    id: `slot-${time}`,
    type: 'slot',
    face,
    x: 0,
    y: 0,
    width: slotWidthMm,
    length: slotLengthMm,
    depth: depthMm,
  };
}

/**
 * 6. Live Design for Manufacturing (DFM) & Machinability Health Evaluator
 */
export function evaluateDfmHealth(part: DesignPart): DfmHealthReport {
  const metrics = getPartBoundingMetrics(part);
  const p = part.params || {};

  const width = (p.width || p.diameter || 40);
  const height = (p.height || p.length || 40);
  const depth = (p.depth || p.length || 20);

  const minDimension = Math.min(width, height, depth);
  const holes = part.holes || [];
  const cuts = part.cuts || [];

  const warnings: string[] = [];
  const recommendations: string[] = [];
  let score = 96;

  // 1. Min Wall Thickness Check
  if (minDimension < 2.0) {
    warnings.push(`Et kalınlığı (Cidar) kritik (${minDimension}mm < 2.0mm). Frezelemede titreşim ve bükülme riski.`);
    recommendations.push('Et kalınlığını en az 2.5 mm yapın.');
    score -= 25;
  }

  // 2. Deep pocket aspect ratio check
  cuts.forEach((c) => {
    const minW = Math.min(c.width || 20, c.length || 20, c.diameter || 20);
    if (c.depth / minW > 3.5) {
      warnings.push(`Derin havuz oranı (${(c.depth / minW).toFixed(1)}x). Standart freze boyu aşılıyor.`);
      recommendations.push('Havuz derinliğini azaltın veya köşe yarıçapını R4+ büyütün.');
      score -= 15;
    }
  });

  // 3. Hole-to-Edge margin check
  holes.forEach((h) => {
    const dia = h.diameter || 6;
    const margin = Math.min(Math.abs(width / 2 - Math.abs(h.x)), Math.abs(height / 2 - Math.abs(h.y)));
    if (margin < dia * 1.2) {
      warnings.push(`${h.size} deliği kenara çok yakın (${margin.toFixed(1)}mm < 1.2d). Yırtılma riski.`);
      recommendations.push('Deliği kenardan en az 1.5d (9mm+) içeri kaydırın.');
      score -= 12;
    }
  });

  // Mass estimation (6061-T6 Aluminum: 2.70 g/cm3)
  const grossVolumeCm3 = (width * height * depth) / 1000;
  let pocketVolumeCm3 = 0;
  cuts.forEach((c) => {
    pocketVolumeCm3 += ((c.width || 20) * (c.length || 20) * c.depth) / 1000;
  });
  holes.forEach((h) => {
    const r = (h.diameter || 6) / 2;
    pocketVolumeCm3 += (Math.PI * r * r * (h.depth || depth)) / 1000;
  });

  const netVolumeCm3 = Math.max(1, grossVolumeCm3 - pocketVolumeCm3);
  const massKg = Number(((netVolumeCm3 * 2.70) / 1000).toFixed(3));
  const grossMassKg = (grossVolumeCm3 * 2.70) / 1000;
  const weightSavingsPct = grossMassKg > 0 ? Math.round(((grossMassKg - massKg) / grossMassKg) * 100) : 0;

  return {
    isMachinable: score >= 70,
    score: Math.max(10, Math.min(100, score)),
    minWallMm: Number(minDimension.toFixed(1)),
    toolingRadiusMm: 3.0, // Standard R3 for Ø6mm endmill
    warnings,
    recommendations,
    massKg,
    weightSavingsPct,
  };
}

/**
 * 7. Deterministic Natural Language Command Parser for AeGiS 3D Console
 */
export function parseAegis3DCommand(
  rawInput: string,
  activePart: DesignPart | null
): AegisCommandResult {
  const text = rawInput.trim().toLowerCase();
  if (!text) {
    return {
      recognized: false,
      action: 'unknown',
      messageEn: 'Please enter an engineering command.',
      messageTr: 'Lütfen bir mühendislik komutu girin.',
    };
  }

  // 1. Slot / Keyway: e.g. "kanal", "slot", "oyuk", "kanal 10x35"
  if (/kanal|slot|oyuk|keyway/.test(text)) {
    const slotDimMatch = text.match(/(\d+(?:\.\d+)?)\s*[xX×]\s*(\d+(?:\.\d+)?)/);
    const w = slotDimMatch ? parseFloat(slotDimMatch[1]) : 12;
    const l = slotDimMatch ? parseFloat(slotDimMatch[2]) : 40;
    return {
      recognized: true,
      action: 'slot',
      messageEn: `Create center sliding slot pocket (${w} × ${l} mm)`,
      messageTr: `Yüzey merkezine kızaklı montaj kanalı aç (${w} × ${l} mm)`,
      details: { width: w, length: l, widthMm: w, lengthMm: l, depth: 5, depthMm: 5 },
    };
  }

  // 2. Material assignment: e.g. "alüminyum 7075-t6", "6061", "çelik 304", "titanyum"
  if (/7075/.test(text)) {
    return {
      recognized: true,
      action: 'material',
      messageEn: 'Set material to EN AW-7075-T6 High-Strength Aluminum (Density: 2.81 g/cm³)',
      messageTr: 'Malzemeyi EN AW-7075-T6 Yüksek Mukavemetli Alüminyum olarak ata (Yoğunluk: 2.81 g/cm³)',
      details: { materialId: 'al-7075-t6', color: '#7dd3fc' },
    };
  } else if (/al[uü]min|6061/.test(text)) {
    return {
      recognized: true,
      action: 'material',
      messageEn: 'Set material to EN AW-6061-T6 Aluminum (Density: 2.70 g/cm³)',
      messageTr: 'Malzemeyi EN AW-6061-T6 Alüminyum olarak ata (Yoğunluk: 2.70 g/cm³)',
      details: { materialId: 'al-6061-t6', color: '#6b9fff' },
    };
  } else if (/çelik|steel|aisi|304/.test(text)) {
    return {
      recognized: true,
      action: 'material',
      messageEn: 'Set material to AISI 304 Stainless Steel (Density: 7.93 g/cm³)',
      messageTr: 'Malzemeyi AISI 304 Paslanmaz Çelik olarak ata (Yoğunluk: 7.93 g/cm³)',
      details: { materialId: 'steel-304', color: '#94a3b8' },
    };
  } else if (/titan|titanyum|ti-6al/.test(text)) {
    return {
      recognized: true,
      action: 'material',
      messageEn: 'Set material to Titanium Grade 5 Ti-6Al-4V (Density: 4.43 g/cm³)',
      messageTr: 'Malzemeyi Titanyum Ti-6Al-4V olarak ata (Yoğunluk: 4.43 g/cm³)',
      details: { materialId: 'ti-6al-4v', color: '#cbd5e1' },
    };
  }

  // 3. 4 Corner Bolts Match: e.g. "4 cıvata", "4 civata", "4 köşe delik", "bolt pattern"
  if (/4\s*(?:c[ıi]vata|k[oö][sş]e|delik|bolt)|bolt\s*pattern/.test(text)) {
    const sizeMatch = text.match(/\bm(4|5|6|8|10|12)\b/);
    const boltSize = (sizeMatch ? `M${sizeMatch[1]}` : 'M6') as any;
    return {
      recognized: true,
      action: 'bolts',
      messageEn: `Place 4x ${boltSize} counterbore bolt holes on corners with standard 1.5d margin`,
      messageTr: `4 köşeye standart 1.5d kenar payıyla 4x ${boltSize} imbus cıvata deliği yerleştir`,
      details: { boltSize },
    };
  }

  // 4. Center Hole / Bore Match: e.g. "delik 25", "m8 delik", "merkeze m8 delik aç", "center hole 16mm"
  if (/delik|hole|bore|\bm[3-9]\b|\bm1[0-6]\b/.test(text)) {
    const mMatch = text.match(/\bm(\d+)\b/);
    const diaMatch = text.match(/(\d+(?:\.\d+)?)\s*mm\s*delik|delik\s*(\d+(?:\.\d+)?)|(?:bore|hole)\s*(\d+(?:\.\d+)?)/);
    let dia = 10;
    let size = 'M10';
    if (mMatch) {
      dia = parseInt(mMatch[1], 10);
      size = `M${dia}`;
    } else if (diaMatch) {
      const val = diaMatch[1] || diaMatch[2] || diaMatch[3];
      dia = parseFloat(val);
      size = `Ø${dia}`;
    }
    return {
      recognized: true,
      action: 'hole',
      messageEn: `Create centered ${size} through-hole (Ø${dia}mm)`,
      messageTr: `Yüzey merkezine ${size} boydan boya delik aç (Ø${dia}mm)`,
      details: { diameter: dia, diameterMm: dia, size },
    };
  }

  // 5. Lightweighting / Isogrid: e.g. "hafiflet", "petek", "isogrid", "pocket"
  if (/hafiflet|petek|isogrid|cepler|pocket|weight/.test(text)) {
    return {
      recognized: true,
      action: 'lightweight',
      messageEn: 'Generate isogrid lightweighting pockets (saves ~35% mass with rigid ribs)',
      messageTr: 'Ağırlık tasarrufu sağlayan petek (isogrid) cepleri aç (~%35 hafifletme)',
      details: { ribThickness: 4, depth: 5 },
    };
  }

  // 6. Duplicate / Clone
  if (/çoğalt|kopyala|duplicate|clone/.test(text)) {
    return {
      recognized: true,
      action: 'duplicate',
      messageEn: 'Duplicate selected part with 50mm offset',
      messageTr: 'Seçili parçayı 50mm öteleyerek çoğalt',
    };
  }

  // 6b. Blender / SolidWorks Operators & Shortcuts: grab, rotate, scale, s-bar, mates, pcd, clash, bom
  if (/^(?:s[- ]?bar|shortcut|k[ıi]sayol|s men[uü])$/.test(text) || text === 's') {
    return {
      recognized: true,
      action: 'operator',
      messageEn: 'Open SolidWorks Context Shortcut Bar [S]',
      messageTr: "SolidWorks Bağlamsal Kısayol Menüsünü Aç [S]",
      details: { operator: 's-bar' },
    };
  }

  if (/^(?:grab|ta[sş][ıi]|move|modal grab|modal move)$/.test(text) || text === 'g') {
    return {
      recognized: true,
      action: 'operator',
      messageEn: 'Start Blender Modal Grab / Translate [G]',
      messageTr: 'Blender Modal Taşıma Modunu Başlat [G]',
      details: { operator: 'grab' },
    };
  }

  if (/^(?:rotate|d[oö]nd[uü]r|modal rotate)$/.test(text) || text === 'r') {
    return {
      recognized: true,
      action: 'operator',
      messageEn: 'Start Blender Modal Rotate [R]',
      messageTr: 'Blender Modal Döndürme Modunu Başlat [R]',
      details: { operator: 'rotate' },
    };
  }

  if (/^(?:scale|[oö]l[cç]ekle|modal scale)$/.test(text)) {
    return {
      recognized: true,
      action: 'operator',
      messageEn: 'Start Blender Modal Scale [Alt+S]',
      messageTr: 'Blender Modal Ölçekleme Modunu Başlat [Alt+S]',
      details: { operator: 'scale' },
    };
  }

  if (/^(?:mate|joint|ili[sş]ki|montaj ili[sş]kisi|ba[gğ]lant[ıi])$/.test(text) || text === 'j') {
    return {
      recognized: true,
      action: 'operator',
      messageEn: 'Open Assembly Mates / Kinematic Joints [J]',
      messageTr: 'Montaj İlişkileri & Kinematik Bağlantılarını Aç [J]',
      details: { operator: 'mate' },
    };
  }

  if (/^(?:pcd|bolt circle|flan[sş] delik|c[ıi]vata dairesi)$/.test(text)) {
    return {
      recognized: true,
      action: 'operator',
      messageEn: 'Open Bolt Circle PCD Flange Holes Wizard',
      messageTr: 'Flanş Cıvata Dairesi (PCD) Sihirbazını Aç',
      details: { operator: 'pcd' },
    };
  }

  if (/^(?:bom|bill of materials|par[cç]a listesi|malzeme listesi)$/.test(text)) {
    return {
      recognized: true,
      action: 'operator',
      messageEn: 'Open Industrial Assembly Bill of Materials (BOM)',
      messageTr: 'Endüstriyel Montaj Malzeme Listesini (BOM) Aç',
      details: { operator: 'bom' },
    };
  }

  if (/^(?:doctor|doktor|dfm|sa[gğ]l[ıi]k|check)$/.test(text)) {
    return {
      recognized: true,
      action: 'operator',
      messageEn: 'Open AeGiS Design Doctor & DFM Advisor HUD',
      messageTr: 'AeGiS Tasarım Doktoru & DFM Denetçisini Aç',
      details: { operator: 'doctor' },
    };
  }

  if (/^(?:academy|akademi|tutor|kurs|rehber|e[gğ]itim|learn)$/.test(text)) {
    return {
      recognized: true,
      action: 'operator',
      messageEn: 'Open AeGiS CAD Academy Interactive Masterclasses',
      messageTr: 'AeGiS CAD Akademisi İnteraktif Eğitimlerini Aç',
      details: { operator: 'academy' },
    };
  }

  if (/^(?:clash|[cç]ak[ıi][sş]ma|interference|interfere)$/.test(text)) {
    return {
      recognized: true,
      action: 'operator',
      messageEn: 'Run CATIA/NX Style Assembly Interference & Clash Check',
      messageTr: 'CATIA/NX Tarzı Montaj Çakışma Kontrolünü Çalıştır',
      details: { operator: 'clash' },
    };
  }

  if (/^(?:kesit|section|slicer|dilim)$/.test(text)) {
    return {
      recognized: true,
      action: 'operator',
      messageEn: 'Toggle Precision Cross-Section Slicer (X/Y/Z)',
      messageTr: 'Hassas Kesit Düzlemini Aç/Kapat (X/Y/Z)',
      details: { operator: 'section' },
    };
  }

  // Siemens NX Synchronous Operators
  if (/^(?:delete face|y[uü]zey sil|del and heal|onar|heal)$/.test(text)) {
    return {
      recognized: true,
      action: 'operator',
      messageEn: 'Siemens NX Delete Face & Auto-Heal Feature',
      messageTr: 'Siemens NX Yüzey Sil ve Otomatik Onar',
      details: { operator: 'delete-face' },
    };
  }

  if (/^(?:draft|kal[ıi]p a[cç][ıi]s[ıi]|draft a[cç][ıi]s[ıi]|taper)$/.test(text)) {
    return {
      recognized: true,
      action: 'operator',
      messageEn: 'Apply Siemens NX 3° Mold Release Draft Angle',
      messageTr: 'Siemens NX 3° Kalıp Çıkma Açısı (Draft) Uygula',
      details: { operator: 'draft' },
    };
  }

  if (/^(?:coplanar|e[sş] d[uü]zlem|live rules)$/.test(text)) {
    return {
      recognized: true,
      action: 'operator',
      messageEn: 'Run Siemens NX Live Rules Coplanar Detector',
      messageTr: 'Siemens NX Canlı Kurallar: Eş Düzlemli Yüzeyleri Algıla',
      details: { operator: 'coplanar' },
    };
  }

  // 7. Direct Dimensions Match: e.g. "120x60x15" or "100 x 50 x 20 mm"
  const dimMatch = text.match(/\b(\d+(?:\.\d+)?)\s*[xX×]\s*(\d+(?:\.\d+)?)(?:\s*[xX×]\s*(\d+(?:\.\d+)?))?\b/);
  if (dimMatch) {
    const w = parseFloat(dimMatch[1]);
    const h = parseFloat(dimMatch[2]);
    const d = dimMatch[3] ? parseFloat(dimMatch[3]) : undefined;

    return {
      recognized: true,
      action: 'resize',
      messageEn: `Resize part dimensions to ${w} × ${h}${d ? ` × ${d}` : ''} mm`,
      messageTr: `Parça ölçülerini ${w} × ${h}${d ? ` × ${d}` : ''} mm olarak güncelle`,
      details: { width: w, height: h, depth: d },
    };
  }

  // 8. Single Axis Adjustments: e.g. "genişlik 100", "w: 120", "kalınlık 15", "t=12"
  const wMatch = text.match(/(?:geni[sş]lik|width|w)\s*[:=]?\s*(\d+(?:\.\d+)?)/);
  if (wMatch) {
    const val = parseFloat(wMatch[1]);
    return {
      recognized: true,
      action: 'resize',
      messageEn: `Set width to ${val} mm`,
      messageTr: `Genişliği ${val} mm yap`,
      details: { width: val },
    };
  }

  const hMatch = text.match(/(?:y[uü]kseklik|height|h)\s*[:=]?\s*(\d+(?:\.\d+)?)/);
  if (hMatch) {
    const val = parseFloat(hMatch[1]);
    return {
      recognized: true,
      action: 'resize',
      messageEn: `Set height to ${val} mm`,
      messageTr: `Yüksekliği ${val} mm yap`,
      details: { height: val },
    };
  }

  const dMatch = text.match(/(?:kal[ıi]nl[ıi]k|derinlik|depth|thickness|t|d)\s*[:=]?\s*(\d+(?:\.\d+)?)/);
  if (dMatch) {
    const val = parseFloat(dMatch[1]);
    return {
      recognized: true,
      action: 'resize',
      messageEn: `Set thickness/depth to ${val} mm`,
      messageTr: `Kalınlığı/derinliği ${val} mm yap`,
      details: { depth: val },
    };
  }

  return {
    recognized: false,
    action: 'unknown',
    messageEn: `Command '${rawInput}' not recognized. Try: '120x80x20', 'delik M8', '4 cıvata', 'hafiflet', 'alüminyum'`,
    messageTr: `'${rawInput}' komutu tanınamadı. Deneyin: '120x80x20', 'delik M8', '4 cıvata', 'hafiflet', 'alüminyum'`,
  };
}
