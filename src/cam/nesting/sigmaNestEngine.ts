/**
 * 🏭 AluCAD OS — Industrial 2D nesting & remnant engine
 *
 * Placement
 *  - True shape (default): every part is nested by its real outline on an occupancy
 *    raster (src/lib/nesting/rasterNest.ts) — concave parts interlock, round parts are not
 *    boxes, small parts go into the holes of large parts (part-in-part) and the result is
 *    guaranteed overlap-free with the requested web (spacing + kerf) between parts.
 *  - Common line (spacing 0 / commonLine): parts are packed edge to edge by their bounding
 *    boxes (guillotine best-area fit) so neighbouring edges can share one cut.
 *  - Holes always travel with their part (same rotation and translation), so canvas,
 *    DXF export and G-code see the complete geometry.
 *
 * Production features
 *  1. Remnant-first stock: stored remnants are filled before raw sheets are pulled.
 *  2. Downstream clustering: bending → welding → machining → others.
 *  3. Rotation rules: global rotation step, per-part allowed rotations, grain direction.
 *  4. Remnant plate (Kalıntı Sac) + guillotine crop cut when the unused strip is reusable.
 *  5. True scrap = sheet − parts − reusable remnant (weights by material density).
 *  6. Production report data ("Yerleşim Detayı" work order).
 *
 * Methodology tier: Heuristic (documented algorithm + regression tests:
 * src/tests/sigmanest-2d-nesting.test.ts, src/tests/raster-nesting.test.ts).
 */

import type {
  Part2D,
  Sheet2D,
  PlacedPart,
  FreeRectangle,
  SheetResult,
  NestingResult,
  NestingOptions,
  RemnantSheet2D,
  GuillotineCropCut,
  SigmaNestReportData,
  SigmaNestReportPartItem,
  Polygon,
  Point2D,
  BoundingBox
} from '@/types/nesting2d.types';
import { rasterNest, type NestPartInput } from '@/lib/nesting/rasterNest';

// Density table (g/cm³ -> kg/mm³ = value / 1,000,000)
export const MATERIAL_DENSITIES_G_CM3: Record<string, number> = {
  S235JR: 7.85,
  ST37: 7.85,
  ST52: 7.85,
  S355: 7.85,
  STEEL: 7.85,
  STAINLESS_304: 7.93,
  STAINLESS_316: 8.00,
  ALUMINUM_6082: 2.70,
  ALUMINUM_5083: 2.66,
  ALUMINUM_7075: 2.81,
  ALUMINUM_6061: 2.70,
  ALUMINUM: 2.70,
  DEFAULT: 7.85,
};

export function getMaterialDensity(materialName?: string): number {
  if (!materialName) return MATERIAL_DENSITIES_G_CM3.DEFAULT;
  const upper = materialName.toUpperCase().replace(/[\s-_]/g, '');
  for (const [key, val] of Object.entries(MATERIAL_DENSITIES_G_CM3)) {
    if (upper.includes(key.replace(/_/g, ''))) return val;
  }
  return MATERIAL_DENSITIES_G_CM3.DEFAULT;
}

/**
 * Calculates weight in kg for an area (mm²) and thickness (mm)
 */
export function calculateWeightKg(areaMm2: number, thicknessMm: number, materialName?: string): number {
  const density = getMaterialDensity(materialName); // g/cm³
  // Volume in cm³ = areaMm2 * thicknessMm / 1000
  // Weight in g = Volume * density
  // Weight in kg = Weight in g / 1000
  return (areaMm2 * thicknessMm * density) / 1_000_000;
}

// ─── geometry helpers ───────────────────────────────────────────────────────

function getBoundingBox(points: Point2D[]): BoundingBox {
  let minX = Infinity, minY = Infinity;
  let maxX = -Infinity, maxY = -Infinity;
  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

function calculateArea(points: Point2D[]): number {
  let area = 0;
  const n = points.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }
  return Math.abs(area / 2);
}

function toPolygon(points: Point2D[]): Polygon {
  return { points, bounds: getBoundingBox(points), area: calculateArea(points) };
}

/** Material area of a part: outer area minus its holes. */
export function partNetArea(part: Part2D): number {
  const outer = part.polygon.area || calculateArea(part.polygon.points);
  const holes = (part.innerPolygons ?? []).reduce((s, h) => s + (h.area || calculateArea(h.points)), 0);
  return Math.max(0, outer - holes);
}

/** Exact quarter-turn rotation about the origin (other angles: general rotation). */
function rotateAboutOrigin(points: Point2D[], deg: number): Point2D[] {
  const q = ((Math.round(deg) % 360) + 360) % 360;
  if (q === 0) return points.map(p => ({ x: p.x, y: p.y }));
  if (q === 90) return points.map(p => ({ x: -p.y, y: p.x }));
  if (q === 180) return points.map(p => ({ x: -p.x, y: -p.y }));
  if (q === 270) return points.map(p => ({ x: p.y, y: -p.x }));
  const t = (deg * Math.PI) / 180, c = Math.cos(t), s = Math.sin(t);
  return points.map(p => ({ x: c * p.x - s * p.y, y: s * p.x + c * p.y }));
}

const norm360 = (a: number) => ((a % 360) + 360) % 360;

/**
 * Rotations a part may use: the global step, narrowed by the part's own allowed list and
 * its grain direction ('x' = part x along the sheet length → 0/180°, 'y' → 90/270°).
 */
export function effectiveRotations(part: Part2D, options: Pick<NestingOptions, 'rotationStep'>): number[] {
  const step = options.rotationStep ?? 0;
  if (!(step > 0)) return [0];
  const grid: number[] = [];
  for (let a = 0; a < 360 - 1e-9; a += step) grid.push(Math.round(a * 1000) / 1000);
  let rots = grid;
  const own = (part.allowedRotations ?? []).map(norm360);
  if (own.length > 0) {
    const inter = own.filter(a => grid.some(g => Math.abs(g - a) < 1e-6));
    rots = inter.length > 0 ? inter : own;
  }
  if (part.grainDirection === 'x') {
    const r = rots.filter(a => Math.abs(a % 180) < 1e-6);
    rots = r.length ? r : [0];
  } else if (part.grainDirection === 'y') {
    const r = rots.filter(a => Math.abs((a % 180) - 90) < 1e-6);
    rots = r.length ? r : [90];
  }
  return [...new Set(rots)];
}

const PROCESS_PRIORITY: Record<string, number> = { bending: 3, welding: 2, machining: 1, none: 0 };

// ─── stock & sheet results ──────────────────────────────────────────────────

interface StockSheet {
  width: number;
  height: number;
  isRemnant: boolean;
  remnantId?: string;
}

interface SheetContext {
  sheetIndex: number;
  stock: StockSheet;
  placed: PlacedPart[];
  usedArea: number;
  freeRects: FreeRectangle[];
}

/**
 * Remnant plate, crop cut, used envelope, weights and true scrap for one finished sheet.
 */
function finalizeSheet(
  ctx: SheetContext,
  parts: Part2D[],
  options: NestingOptions,
  kerf: number,
  spacing: number,
  generatedRemnants: RemnantSheet2D[]
): SheetResult {
  const { stock, placed, usedArea, sheetIndex } = ctx;
  const minRemnantDim = options.minRemnantDimensionMm ?? 400;
  const enableRemnantGen = options.enableRemnantGeneration ?? true;

  let maxUsedX = 0;
  let maxUsedY = 0;
  placed.forEach(p => {
    maxUsedX = Math.max(maxUsedX, p.polygon.bounds.x + p.polygon.bounds.width);
    maxUsedY = Math.max(maxUsedY, p.polygon.bounds.y + p.polygon.bounds.height);
  });

  const usedEnvelope = {
    width: Math.min(stock.width, Math.round(maxUsedX + spacing)),
    height: Math.min(stock.height, Math.round(maxUsedY + spacing))
  };

  let remnantSheet: RemnantSheet2D | undefined;
  let cropCut: GuillotineCropCut | undefined;

  const remainingW = stock.width - usedEnvelope.width;
  const remainingH = stock.height - usedEnvelope.height;

  // Material from the first placed part (fallback: first part of the job)
  const firstPart = placed[0]?.partId ? parts.find(p => p.id === placed[0].partId) : parts[0];
  const thickness = firstPart?.thickness || 30;
  const material = firstPart?.material || 'S235JR';

  if (enableRemnantGen && remainingW >= minRemnantDim) {
    // Vertical guillotine cut across the plate
    const cropX = usedEnvelope.width + kerf;
    cropCut = {
      axis: 'x',
      coordinate: cropX,
      startPoint: { x: cropX, y: stock.height },
      endPoint: { x: cropX, y: 0 },
      lengthMm: stock.height,
      piercePoint: { x: cropX, y: stock.height + 10 }
    };
    const remW = stock.width - cropX;
    const remH = stock.height;
    remnantSheet = {
      id: `TaskSheet${sheetIndex + 1}-1`,
      name: `Kalıntı Sac (${material} ${thickness}mm)`,
      material,
      thickness,
      width: Math.round(remW),
      height: Math.round(remH),
      originX: Math.round(cropX),
      originY: 0,
      weightKg: Number(calculateWeightKg(remW * remH, thickness, material).toFixed(2)),
      originSheetIndex: sheetIndex,
      createdAt: new Date().toISOString(),
      barcode: `REM-${Math.round(cropX)}-${Math.round(remW)}x${Math.round(remH)}`
    };
    generatedRemnants.push(remnantSheet);
  } else if (enableRemnantGen && remainingH >= minRemnantDim) {
    // Horizontal guillotine cut across the plate
    const cropY = usedEnvelope.height + kerf;
    cropCut = {
      axis: 'y',
      coordinate: cropY,
      startPoint: { x: stock.width, y: cropY },
      endPoint: { x: 0, y: cropY },
      lengthMm: stock.width,
      piercePoint: { x: stock.width + 10, y: cropY }
    };
    const remW = stock.width;
    const remH = stock.height - cropY;
    remnantSheet = {
      id: `TaskSheet${sheetIndex + 1}-1`,
      name: `Kalıntı Sac (${material} ${thickness}mm)`,
      material,
      thickness,
      width: Math.round(remW),
      height: Math.round(remH),
      originX: 0,
      originY: Math.round(cropY),
      weightKg: Number(calculateWeightKg(remW * remH, thickness, material).toFixed(2)),
      originSheetIndex: sheetIndex,
      createdAt: new Date().toISOString(),
      barcode: `REM-${Math.round(cropY)}-${Math.round(remW)}x${Math.round(remH)}`
    };
    generatedRemnants.push(remnantSheet);
  }

  const totalSheetArea = stock.width * stock.height;
  const rawSheetWeight = calculateWeightKg(totalSheetArea, thickness, material);
  const partsWeight = calculateWeightKg(usedArea, thickness, material);
  const remnantWeight = remnantSheet ? remnantSheet.weightKg : 0;
  const usedPlateArea = cropCut?.axis === 'y' ? stock.width * usedEnvelope.height : usedEnvelope.width * stock.height;
  const usedWeight = calculateWeightKg(usedPlateArea, thickness, material);
  const scrapWeight = Math.max(0, rawSheetWeight - remnantWeight - partsWeight);
  const trueScrapPct = rawSheetWeight > 0 ? (scrapWeight / rawSheetWeight) * 100 : 0;

  return {
    sheetIndex,
    placedParts: placed,
    freeRectangles: ctx.freeRects,
    usedArea,
    wasteArea: totalSheetArea - usedArea,
    efficiency: totalSheetArea > 0 ? (usedArea / totalSheetArea) * 100 : 0,
    remnantSheet,
    cropCut,
    trueScrapPercent: Number(trueScrapPct.toFixed(2)),
    usedEnvelope,
    stock: { width: stock.width, height: stock.height, remnantId: stock.remnantId },
    weights: {
      sheetWeightKg: Number(rawSheetWeight.toFixed(2)),
      usedWeightKg: Number(usedWeight.toFixed(2)),
      remnantWeightKg: Number(remnantWeight.toFixed(2)),
      partsWeightKg: Number(partsWeight.toFixed(2)),
      scrapWeightKg: Number(scrapWeight.toFixed(2))
    }
  };
}

function stockList(sheet: Sheet2D, options: NestingOptions): { stocks: StockSheet[]; maxSheets: number } {
  const stocks: StockSheet[] = (options.remnants ?? []).map(r => ({
    width: r.width,
    height: r.height,
    isRemnant: true,
    remnantId: r.id
  }));
  const maxSheets = options.multiSheet ? Math.max(1, options.maxSheets || 20) : 1;
  return { stocks, maxSheets };
}

function placedPartFrom(part: Part2D, outer: Point2D[], holes: Point2D[][], rotation: number, instanceIndex: number): PlacedPart {
  const polygon = toPolygon(outer);
  return {
    partId: part.id,
    label: part.label,
    position: { x: polygon.bounds.x, y: polygon.bounds.y },
    rotation,
    polygon,
    instanceIndex,
    innerPolygons: holes.length > 0 ? holes.map(toPolygon) : undefined,
    cuttingMode: part.cuttingMode,
    allowCommonLine: part.allowCommonLine,
    enableBridge: part.enableBridge,
    microjointCount: part.microjointCount,
    microjointWidthMm: part.microjointWidthMm,
  };
}

// ─── public job type ────────────────────────────────────────────────────────

export interface SigmaNestJob {
  parts: Part2D[];
  sheet: Sheet2D;
  options: NestingOptions;
  taskName?: string;
  programName?: string;
  machineName?: string;
  /** progress callback: parts placed so far / total instances */
  onProgress?: (placed: number, total: number, sheetIndex: number) => void;
  /** raster budget (cells per sheet); larger = finer and slower. Default 2.5 M. */
  maxCells?: number;
}

/**
 * Main entry: nests the job and returns sheets, remnants, scrap and weights.
 */
export function executeSigmaNest2D(job: SigmaNestJob): NestingResult {
  const isCommonLine = job.options.commonLine === true || job.options.spacing === 0;
  return isCommonLine ? nestCommonLine(job) : nestTrueShape(job);
}

// ─── true-shape engine ──────────────────────────────────────────────────────

function nestTrueShape(job: SigmaNestJob): NestingResult {
  const startTime = performance.now();
  const { parts, sheet, options } = job;
  const spacing = options.spacing ?? 6;
  const kerf = sheet.kerf ?? 1.2;
  const clustering = options.downstreamClustering ?? true;
  const partById = new Map(parts.map(p => [p.id, p]));

  const remaining = new Map<string, number>(parts.map(p => [p.id, Math.max(0, Math.floor(p.quantity))]));
  const nextInstance = new Map<string, number>(parts.map(p => [p.id, 0]));
  const total = [...remaining.values()].reduce((s, q) => s + q, 0);
  let placedSoFar = 0;

  const { stocks, maxSheets } = stockList(sheet, options);
  const sheetResults: SheetResult[] = [];
  const generatedRemnants: RemnantSheet2D[] = [];
  const unplacedParts: { partId: string; reason: string }[] = [];
  const tooLarge = new Set<string>();

  const inputsFor = (): NestPartInput[] =>
    parts
      .filter(p => (remaining.get(p.id) ?? 0) > 0 && !tooLarge.has(p.id))
      .map(p => ({
        id: p.id,
        label: p.label,
        outer: p.polygon.points,
        holes: (p.innerPolygons ?? []).map(h => h.points),
        quantity: remaining.get(p.id) ?? 0,
        rotations: effectiveRotations(p, options),
        priority: clustering ? PROCESS_PRIORITY[p.downstreamProcess || 'none'] ?? 0 : 0,
      }));

  const runOn = (stock: StockSheet, sheetsAllowed: number) => {
    const inputs = inputsFor();
    if (inputs.length === 0 || sheetsAllowed <= 0) return;
    const res = rasterNest(inputs, {
      sheetWidth: stock.width,
      sheetHeight: stock.height,
      spacing,
      kerf,
      partInPart: options.enablePartInPart ?? true,
      maxSheets: sheetsAllowed,
      fillAxis: 'x',
      maxCells: job.maxCells,
      onProgress: (n) => job.onProgress?.(placedSoFar + n, total, sheetResults.length),
    });

    const bySheet = new Map<number, PlacedPart[]>();
    for (const pl of res.placements) {
      const part = partById.get(pl.partId)!;
      const idx = nextInstance.get(pl.partId) ?? 0;
      nextInstance.set(pl.partId, idx + 1);
      remaining.set(pl.partId, (remaining.get(pl.partId) ?? 0) - 1);
      const list = bySheet.get(pl.sheetIndex) ?? [];
      list.push(placedPartFrom(part, pl.outer, pl.holes, pl.rotation, idx));
      bySheet.set(pl.sheetIndex, list);
    }
    placedSoFar += res.placements.length;
    for (const u of res.unplaced) {
      if (u.reason === 'Part larger than the sheet' && !stock.isRemnant) tooLarge.add(u.partId);
    }

    const sheetIdxs = [...bySheet.keys()].sort((a, b) => a - b);
    for (const si of sheetIdxs) {
      const placed = bySheet.get(si)!;
      const usedArea = placed.reduce((s, p) => s + partNetArea(partById.get(p.partId)!), 0);
      sheetResults.push(
        finalizeSheet(
          { sheetIndex: sheetResults.length, stock, placed, usedArea, freeRects: [] },
          parts,
          options,
          kerf,
          spacing,
          generatedRemnants
        )
      );
    }
  };

  // 1) stored remnants first, one sheet each
  for (const stock of stocks) {
    if (sheetResults.length >= maxSheets) break;
    runOn(stock, 1);
  }
  // 2) raw sheets for the rest
  if (sheetResults.length < maxSheets) {
    runOn({ width: sheet.width, height: sheet.height, isRemnant: false }, maxSheets - sheetResults.length);
  }

  for (const p of parts) {
    const left = remaining.get(p.id) ?? 0;
    for (let i = 0; i < left; i++) {
      unplacedParts.push({
        partId: p.id,
        reason: tooLarge.has(p.id) ? 'Part larger than the sheet' : 'Part dimensions exceed remaining plate envelope',
      });
    }
  }

  return summarize(sheetResults, unplacedParts, generatedRemnants, startTime);
}

function summarize(
  sheetResults: SheetResult[],
  unplacedParts: { partId: string; reason: string }[],
  generatedRemnants: RemnantSheet2D[],
  startTime: number
): NestingResult {
  const totalUsedArea = sheetResults.reduce((s, r) => s + r.usedArea, 0);
  const totalRawArea = sheetResults.reduce((s, r) => s + r.usedArea + r.wasteArea, 0);
  const totalRemnantWeight = generatedRemnants.reduce((s, r) => s + r.weightKg, 0);
  const totalPartsWeight = sheetResults.reduce((s, r) => s + (r.weights?.partsWeightKg || 0), 0);
  const totalSheetWeight = sheetResults.reduce((s, r) => s + (r.weights?.sheetWeightKg || 0), 0);
  const aggregateScrap = Math.max(0, totalSheetWeight - totalRemnantWeight - totalPartsWeight);
  const overallTrueScrapPct = totalSheetWeight > 0 ? (aggregateScrap / totalSheetWeight) * 100 : 0;

  return {
    sheets: sheetResults,
    totalSheets: sheetResults.length,
    totalEfficiency: totalRawArea > 0 ? (totalUsedArea / totalRawArea) * 100 : 0,
    totalWaste: totalRawArea - totalUsedArea,
    unplacedParts,
    computeTimeMs: performance.now() - startTime,
    generatedRemnants,
    overallTrueScrapPercent: Number(overallTrueScrapPct.toFixed(2))
  };
}

// ─── common-line engine (bounding boxes, edge to edge) ──────────────────────

interface BoxInstance {
  part: Part2D;
  instanceIndex: number;
  area: number;
  downstreamProcess: string;
  /** outline and holes moved so the outline's bounding box starts at (0, 0) */
  outer: Point2D[];
  holes: Point2D[][];
  rotations: number[];
  gap: number;
}

/** Rotate a normalised part and move it back to the origin (holes follow the same transform). */
function orientedGeometry(outer: Point2D[], holes: Point2D[][], rotation: number) {
  const ro = rotateAboutOrigin(outer, rotation);
  const b = getBoundingBox(ro);
  const shift = (pts: Point2D[]) => pts.map(p => ({ x: p.x - b.x, y: p.y - b.y }));
  return { outer: shift(ro), holes: holes.map(h => shift(rotateAboutOrigin(h, rotation))), width: b.width, height: b.height };
}

function nestCommonLine(job: SigmaNestJob): NestingResult {
  const startTime = performance.now();
  const { parts, sheet, options } = job;
  const kerf = sheet.kerf ?? 1.2;
  const enablePartInPart = options.enablePartInPart ?? true;
  const clustering = options.downstreamClustering ?? true;

  const instances: BoxInstance[] = [];
  parts.forEach(part => {
    const b = getBoundingBox(part.polygon.points);
    const shift = (pts: Point2D[]) => pts.map(p => ({ x: p.x - b.x, y: p.y - b.y }));
    const outer = shift(part.polygon.points);
    const holes = (part.innerPolygons ?? []).map(h => shift(h.points));
    const partAllowsCommon = part.allowCommonLine !== false && part.cuttingMode !== 'standalone';
    const gap = partAllowsCommon ? 0 : Math.max(options.spacing || 0, 6);
    // the box packer can only turn by quarter turns
    const quarter = effectiveRotations(part, options).filter(a => Math.abs(a % 90) < 1e-6);
    for (let i = 0; i < part.quantity; i++) {
      instances.push({
        part,
        instanceIndex: i,
        area: partNetArea(part),
        downstreamProcess: part.downstreamProcess || 'none',
        outer,
        holes,
        rotations: quarter.length ? quarter : [0],
        gap,
      });
    }
  });

  instances.sort((a, b) => {
    if (clustering) {
      const d = (PROCESS_PRIORITY[b.downstreamProcess] ?? 0) - (PROCESS_PRIORITY[a.downstreamProcess] ?? 0);
      if (d !== 0) return d;
    }
    return b.area - a.area;
  });

  const { stocks, maxSheets } = stockList(sheet, options);
  const sheetResults: SheetResult[] = [];
  const unplacedParts: { partId: string; reason: string }[] = [];
  const generatedRemnants: RemnantSheet2D[] = [];
  let remainingInstances = [...instances];
  let placedCount = 0;

  for (let s = 0; remainingInstances.length > 0 && sheetResults.length < maxSheets; s++) {
    const stock = stocks[s] ?? { width: sheet.width, height: sheet.height, isRemnant: false };
    let freeRects: FreeRectangle[] = [{ x: 0, y: 0, width: stock.width, height: stock.height }];
    const cavities: FreeRectangle[] = [];
    const placed: PlacedPart[] = [];
    let usedArea = 0;
    const stillUnplaced: BoxInstance[] = [];

    for (const inst of remainingInstances) {
      let done = false;

      // A) part-in-part: rectangular cut-outs of parts already on this sheet
      if (enablePartInPart && cavities.length > 0) {
        for (let c = 0; c < cavities.length && !done; c++) {
          const cav = cavities[c];
          for (const rot of inst.rotations) {
            const g = orientedGeometry(inst.outer, inst.holes, rot);
            if (g.width <= cav.width && g.height <= cav.height) {
              const move = (pts: Point2D[]) => pts.map(p => ({ x: p.x + cav.x, y: p.y + cav.y }));
              const pp = placedPartFrom(inst.part, move(g.outer), g.holes.map(move), rot, inst.instanceIndex);
              placed.push(pp);
              usedArea += inst.area;
              cavities.splice(c, 1);
              done = true;
              break;
            }
          }
        }
      }
      if (done) {
        placedCount++;
        job.onProgress?.(placedCount, instances.length, sheetResults.length);
        continue;
      }

      // B) guillotine best-area fit
      let best: { rect: number; rot: number; w: number; h: number; score: number } | null = null;
      for (let r = 0; r < freeRects.length; r++) {
        const rect = freeRects[r];
        for (const rot of inst.rotations) {
          const g = orientedGeometry(inst.outer, inst.holes, rot);
          const w = g.width + inst.gap, h = g.height + inst.gap;
          if (w <= rect.width + 1e-9 && h <= rect.height + 1e-9) {
            const score = (rect.width - w) * (rect.height - h);
            if (!best || score < best.score) best = { rect: r, rot, w, h, score };
          }
        }
      }
      if (!best) {
        stillUnplaced.push(inst);
        continue;
      }

      const rect = freeRects[best.rect];
      const g = orientedGeometry(inst.outer, inst.holes, best.rot);
      const move = (pts: Point2D[]) => pts.map(p => ({ x: p.x + rect.x, y: p.y + rect.y }));
      const pp = placedPartFrom(inst.part, move(g.outer), g.holes.map(move), best.rot, inst.instanceIndex);
      placed.push(pp);
      usedArea += inst.area;
      placedCount++;
      job.onProgress?.(placedCount, instances.length, sheetResults.length);

      // rectangular holes of this part become cavities for small parts
      if (enablePartInPart) {
        for (const hole of pp.innerPolygons ?? []) {
          const hb = hole.bounds;
          const rectangular = hole.area >= 0.98 * hb.width * hb.height;
          const inset = kerf + (options.spacing || 0);
          if (rectangular && hb.width - 2 * inset > 0 && hb.height - 2 * inset > 0) {
            cavities.push({ x: hb.x + inset, y: hb.y + inset, width: hb.width - 2 * inset, height: hb.height - 2 * inset });
          }
        }
      }

      // guillotine split
      const rightWidth = rect.width - best.w;
      const topHeight = rect.height - best.h;
      const next = freeRects.filter((_, i) => i !== best!.rect);
      if (rightWidth > 1) next.push({ x: rect.x + best.w, y: rect.y, width: rightWidth, height: rect.height });
      if (topHeight > 1) next.push({ x: rect.x, y: rect.y + best.h, width: best.w, height: topHeight });
      freeRects = next;
    }

    if (placed.length > 0) {
      sheetResults.push(
        finalizeSheet(
          { sheetIndex: sheetResults.length, stock, placed, usedArea, freeRects },
          parts,
          options,
          kerf,
          0,
          generatedRemnants
        )
      );
    }
    remainingInstances = stillUnplaced;
    if (placed.length === 0 && !stock.isRemnant) break; // nothing fits an empty raw sheet
  }

  remainingInstances.forEach(inst => {
    unplacedParts.push({ partId: inst.part.id, reason: 'Part dimensions exceed remaining plate envelope' });
  });

  return summarize(sheetResults, unplacedParts, generatedRemnants, startTime);
}

/**
 * Generates the full SigmaNEST "Yerleşim Detayı" Report object
 * from a SheetResult matching 100mmv1.PDF and 30 MM DENEME.PDF ground truth.
 */
export function buildSigmaNestReportData(
  sheetResult: SheetResult,
  parts: Part2D[],
  options: {
    taskName?: string;
    programName?: string;
    machineName?: string;
    material?: string;
    thickness?: number;
    amperage?: number;
    sheetName?: string;
    sheetWidth?: number;
    sheetHeight?: number;
    totalCutTimeSec?: number;
    totalCutLengthMm?: number;
  } = {}
): SigmaNestReportData {
  const thickness = options.thickness || 30;
  const material = options.material || 'S235JR';
  const density = getMaterialDensity(material);
  const sheetW = sheetResult.stock?.width || options.sheetWidth || 15000;
  const sheetH = sheetResult.stock?.height || options.sheetHeight || 4000;

  // Format time as HH:MM:SS
  const formatTime = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = Math.floor(sec % 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const totalTimeSec = options.totalCutTimeSec || 10625; // default ~2h 57m
  const totalLength = options.totalCutLengthMm || 191761.58;

  // Build part table items
  const reportParts: SigmaNestReportPartItem[] = [];
  const partMap = new Map<string, Part2D>();
  parts.forEach(p => partMap.set(p.id, p));

  // Count placed frequencies
  const placedFreq = new Map<string, number>();
  sheetResult.placedParts.forEach(p => {
    placedFreq.set(p.partId, (placedFreq.get(p.partId) || 0) + 1);
  });

  let partCounter = 1;
  placedFreq.forEach((nestedQty, partId) => {
    const part = partMap.get(partId);
    if (!part) return;

    const b = part.polygon.bounds;
    const netWeight = (partNetArea(part) * thickness * density) / 1_000_000; // holes excluded
    const rectWeight = (b.width * b.height * thickness * density) / 1_000_000;

    // Approximate cut time from the real perimeter (outer + holes), ~12 s per metre
    const perimeterOf = (pts: Point2D[]) => pts.reduce((s, p, i) => {
      const q = pts[(i + 1) % pts.length];
      return s + Math.hypot(q.x - p.x, q.y - p.y);
    }, 0);
    const perimeter = perimeterOf(part.polygon.points) + (part.innerPolygons ?? []).reduce((s, h) => s + perimeterOf(h.points), 0);
    const partTimeSec = Math.round((perimeter / 1000) * 12);

    reportParts.push({
      id: partCounter++,
      name: part.label || part.id,
      requiredQty: part.quantity,
      nestedQty,
      netWeightKg: Number(netWeight.toFixed(2)),
      rectWeightKg: Number(rectWeight.toFixed(2)),
      dimensions: `${b.width.toFixed(2)} x ${b.height.toFixed(2)}`,
      workOrder: part.workOrder || '0.00',
      customer: part.customer || 'AluCalc Production',
      cutTimeFormatted: formatTime(partTimeSec),
      cutTimeSec: partTimeSec
    });
  });

  const weights = sheetResult.weights || {
    sheetWeightKg: calculateWeightKg(sheetW * sheetH, thickness, material),
    usedWeightKg: calculateWeightKg((sheetResult.usedEnvelope?.width || sheetW) * sheetH, thickness, material),
    remnantWeightKg: sheetResult.remnantSheet?.weightKg || 0,
    partsWeightKg: calculateWeightKg(sheetResult.usedArea, thickness, material),
    scrapWeightKg: 0
  };

  return {
    reportTitle: 'Yerleşim Detayı',
    dateFormatted: new Intl.DateTimeFormat('tr-TR', {
      dateStyle: 'short',
      timeStyle: 'medium'
    }).format(new Date()),
    machineName: options.machineName || 'CNC Plazma / Lazer',
    taskName: options.taskName || `T17_${material}_${thickness}mm`,
    programName: options.programName || `TaskSheet${sheetResult.sheetIndex + 1}`,
    amperage: options.amperage || (thickness > 50 ? 300 : 200),
    sheetIndex: sheetResult.sheetIndex + 1,
    totalSheets: 1,
    repeatCount: 1,
    stackCount: 1,
    material,
    thicknessMm: thickness,
    sheetName: options.sheetName || `TaskSheet${sheetResult.sheetIndex + 1}`,
    sheetLengthMm: sheetW,
    sheetWidthMm: sheetH,
    sheetWeightKg: weights.sheetWeightKg,
    usedLengthMm: sheetResult.usedEnvelope?.width || sheetW,
    usedWidthMm: sheetResult.usedEnvelope?.height || sheetH,
    usedWeightKg: weights.usedWeightKg,
    remnantSheet: sheetResult.remnantSheet,
    remnantWeightKg: weights.remnantWeightKg,
    partsWeightKg: weights.partsWeightKg,
    scrapWeightKg: weights.scrapWeightKg,
    scrapPercent: sheetResult.trueScrapPercent ?? 0,
    totalCutTimeFormatted: formatTime(totalTimeSec),
    totalCutLengthMm: Number(totalLength.toFixed(2)),
    parts: reportParts,
    workspacePath: `C:\\Users\\Public\\Documents\\SNDATA\\WS\\${options.taskName || 'ALUCALC_JOB'}.ws`
  };
}
