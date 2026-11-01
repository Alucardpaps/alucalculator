/**
 * ⚙️ KTR CLAMPEX® Conical Clamping Sets (Konik Kilit Elemanları)
 * 
 * Standardized database and engineering sizing formulation for internal
 * clamping sets per KTR Drive Technology Catalogue (CLAMPEX® series).
 * 
 * References:
 * - KTR Drive Technology Catalogue, Section "CLAMPEX® Clamping sets", Pages 294–316:
 *   - Page 295: Calculation formulas (transmittable torque T, axial force Fax, hub sizing DN, hollow shaft diW)
 *   - Pages 298–299: CLAMPEX® KTR 100 (Non-self-centering, compact, large tolerances)
 *   - Pages 306–307: CLAMPEX® KTR 200 / 201 (Self-centering single taper, universal machine drive standard)
 *   - Pages 312–313: CLAMPEX® KTR 250 (Self-centering for thin-walled hubs and pulleys)
 *   - Pages 314–315: CLAMPEX® KTR 400 (Self-centering heavy duty double taper, maximum torque transmission)
 * - DIN EN ISO 4762 Grade 12.9 socket head cap screws (friction coefficient µ_total = 0.14)
 * - DIN 743 / FKM shaft-hub joint calculation standards
 * 
 * Normative Tier: Tier 1 (Manufacturer Certified Technical Standard / KTR Industrial Catalogue)
 */

export type KtrClampexModel = 'KTR 100' | 'KTR 200' | 'KTR 201' | 'KTR 250' | 'KTR 400';

export interface KtrClampexEntry {
  model: KtrClampexModel;
  /** Shaft internal diameter d (mm) */
  d: number;
  /** Hub bore / Clamping element external diameter D (mm) */
  D: number;
  /** Total assembled width B (mm) */
  B: number;
  /** Outer sleeve width B1 (mm) */
  B1: number;
  /** Inner sleeve width B2 (mm) */
  B2: number;
  /** Flange diameter D1 (mm) if applicable */
  D1?: number;
  /** Screw specification (e.g. 'M6') */
  screw: string;
  /** Screw length (mm) */
  screwLength: number;
  /** Number of clamping screws z */
  screwCount: number;
  /** Screw tightening torque TA (N·m) */
  TA: number;
  /** Transmittable torque T (N·m) with Fax = 0 */
  T: number;
  /** Transmittable axial force Fax (kN) with T = 0 */
  Fax: number;
  /** Shaft surface contact pressure PW (N/mm²) */
  PW: number;
  /** Hub surface contact pressure PN (N/mm²) */
  PN: number;
  /** Self-centering capability */
  selfCentering: boolean;
  /** Approximate weight (kg) */
  weightKg: number;
}

export interface KtrHubSizingResult {
  /** Required minimum hub outer diameter DN (mm) per KTR p.295 */
  minHubDiameter: number;
  /** Hub wall thickness (mm) */
  minWallThickness: number;
  /** Transmittable torque T (N·m) */
  transmittableTorque: number;
  /** Transmittable axial force Fax (kN) */
  transmittableAxialForce: number;
  /** Hub contact pressure PN (N/mm²) */
  hubPressureMpa: number;
  /** Shaft contact pressure PW (N/mm²) */
  shaftPressureMpa: number;
  /** Maximum allowable hollow shaft inner diameter diW (mm) if applicable */
  maxHollowShaftInnerDia: number;
  /** Safety factor against hub plastic deformation */
  hubYieldSafety: number;
  /** Status */
  isValid: boolean;
  /** Warning or notes */
  notes: string[];
}

/**
 * Standard KTR CLAMPEX® Catalog Database
 */
export const KTR_CLAMPEX_CATALOG: KtrClampexEntry[] = [
  // --- KTR 200 (Self-Centering Universal Standard - Page 306-307) ---
  { model: 'KTR 200', d: 20, D: 47, B: 48, B1: 42, B2: 31, D1: 53, screw: 'M6', screwLength: 25, screwCount: 6, TA: 17, T: 530, Fax: 53, PW: 270, PN: 115, selfCentering: true, weightKg: 0.4 },
  { model: 'KTR 200', d: 22, D: 47, B: 48, B1: 42, B2: 31, D1: 53, screw: 'M6', screwLength: 25, screwCount: 6, TA: 17, T: 580, Fax: 53, PW: 245, PN: 114, selfCentering: true, weightKg: 0.4 },
  { model: 'KTR 200', d: 24, D: 50, B: 48, B1: 42, B2: 31, D1: 56, screw: 'M6', screwLength: 25, screwCount: 6, TA: 17, T: 630, Fax: 53, PW: 223, PN: 107, selfCentering: true, weightKg: 0.4 },
  { model: 'KTR 200', d: 25, D: 50, B: 48, B1: 42, B2: 31, D1: 56, screw: 'M6', screwLength: 25, screwCount: 6, TA: 17, T: 660, Fax: 53, PW: 215, PN: 108, selfCentering: true, weightKg: 0.4 },
  { model: 'KTR 200', d: 28, D: 55, B: 48, B1: 42, B2: 31, D1: 61, screw: 'M6', screwLength: 25, screwCount: 6, TA: 17, T: 740, Fax: 53, PW: 193, PN: 98, selfCentering: true, weightKg: 0.5 },
  { model: 'KTR 200', d: 30, D: 55, B: 48, B1: 42, B2: 31, D1: 61, screw: 'M6', screwLength: 25, screwCount: 6, TA: 17, T: 790, Fax: 53, PW: 179, PN: 98, selfCentering: true, weightKg: 0.5 },
  { model: 'KTR 200', d: 32, D: 60, B: 48, B1: 42, B2: 31, D1: 66, screw: 'M6', screwLength: 25, screwCount: 8, TA: 17, T: 1150, Fax: 72, PW: 229, PN: 122, selfCentering: true, weightKg: 0.6 },
  { model: 'KTR 200', d: 35, D: 60, B: 48, B1: 42, B2: 31, D1: 66, screw: 'M6', screwLength: 25, screwCount: 8, TA: 17, T: 1300, Fax: 74, PW: 217, PN: 126, selfCentering: true, weightKg: 0.5 },
  { model: 'KTR 200', d: 38, D: 65, B: 48, B1: 42, B2: 31, D1: 71, screw: 'M6', screwLength: 25, screwCount: 8, TA: 17, T: 1300, Fax: 68, PW: 184, PN: 107, selfCentering: true, weightKg: 0.6 },
  { model: 'KTR 200', d: 40, D: 65, B: 48, B1: 42, B2: 31, D1: 71, screw: 'M6', screwLength: 25, screwCount: 8, TA: 17, T: 1400, Fax: 70, PW: 179, PN: 110, selfCentering: true, weightKg: 0.6 },
  { model: 'KTR 200', d: 42, D: 75, B: 59, B1: 51, B2: 35, D1: 81, screw: 'M8', screwLength: 30, screwCount: 6, TA: 41, T: 2000, Fax: 95, PW: 200, PN: 112, selfCentering: true, weightKg: 1.0 },
  { model: 'KTR 200', d: 45, D: 75, B: 59, B1: 51, B2: 35, D1: 81, screw: 'M8', screwLength: 30, screwCount: 6, TA: 41, T: 2200, Fax: 98, PW: 192, PN: 115, selfCentering: true, weightKg: 1.0 },
  { model: 'KTR 200', d: 48, D: 80, B: 59, B1: 51, B2: 35, D1: 86, screw: 'M8', screwLength: 30, screwCount: 8, TA: 41, T: 3200, Fax: 133, PW: 246, PN: 147, selfCentering: true, weightKg: 1.1 },
  { model: 'KTR 200', d: 50, D: 80, B: 59, B1: 51, B2: 35, D1: 86, screw: 'M8', screwLength: 30, screwCount: 8, TA: 41, T: 3300, Fax: 132, PW: 233, PN: 146, selfCentering: true, weightKg: 1.1 },
  { model: 'KTR 200', d: 55, D: 85, B: 59, B1: 51, B2: 35, D1: 91, screw: 'M8', screwLength: 30, screwCount: 8, TA: 41, T: 3600, Fax: 131, PW: 210, PN: 136, selfCentering: true, weightKg: 1.2 },
  { model: 'KTR 200', d: 60, D: 90, B: 59, B1: 51, B2: 35, D1: 96, screw: 'M8', screwLength: 30, screwCount: 8, TA: 41, T: 3900, Fax: 130, PW: 192, PN: 128, selfCentering: true, weightKg: 1.2 },
  { model: 'KTR 200', d: 65, D: 95, B: 59, B1: 51, B2: 35, D1: 101, screw: 'M8', screwLength: 30, screwCount: 8, TA: 41, T: 4300, Fax: 132, PW: 180, PN: 123, selfCentering: true, weightKg: 1.3 },
  { model: 'KTR 200', d: 70, D: 110, B: 71, B1: 61, B2: 46, D1: 119, screw: 'M10', screwLength: 30, screwCount: 8, TA: 83, T: 7500, Fax: 214, PW: 203, PN: 129, selfCentering: true, weightKg: 2.2 },
  { model: 'KTR 200', d: 75, D: 115, B: 71, B1: 61, B2: 46, D1: 124, screw: 'M10', screwLength: 30, screwCount: 8, TA: 83, T: 8000, Fax: 213, PW: 189, PN: 123, selfCentering: true, weightKg: 2.3 },
  { model: 'KTR 200', d: 80, D: 120, B: 71, B1: 61, B2: 46, D1: 129, screw: 'M10', screwLength: 30, screwCount: 8, TA: 83, T: 8500, Fax: 213, PW: 176, PN: 117, selfCentering: true, weightKg: 2.4 },
  { model: 'KTR 200', d: 90, D: 130, B: 71, B1: 61, B2: 46, D1: 139, screw: 'M10', screwLength: 30, screwCount: 10, TA: 83, T: 12000, Fax: 267, PW: 196, PN: 136, selfCentering: true, weightKg: 2.7 },
  { model: 'KTR 200', d: 100, D: 145, B: 80, B1: 68, B2: 52, D1: 155, screw: 'M12', screwLength: 35, screwCount: 8, TA: 145, T: 15000, Fax: 300, PW: 177, PN: 122, selfCentering: true, weightKg: 3.9 },

  // --- KTR 100 (Non-Self-Centering Compact - Page 298-299) ---
  { model: 'KTR 100', d: 18, D: 47, B: 26, B1: 20, B2: 17, screw: 'M6', screwLength: 18, screwCount: 8, TA: 16, T: 280, Fax: 31, PW: 270, PN: 103, selfCentering: false, weightKg: 0.2 },
  { model: 'KTR 100', d: 20, D: 47, B: 26, B1: 20, B2: 17, screw: 'M6', screwLength: 18, screwCount: 8, TA: 16, T: 310, Fax: 31, PW: 242, PN: 103, selfCentering: false, weightKg: 0.2 },
  { model: 'KTR 100', d: 22, D: 47, B: 26, B1: 20, B2: 17, screw: 'M6', screwLength: 18, screwCount: 8, TA: 16, T: 340, Fax: 31, PW: 219, PN: 103, selfCentering: false, weightKg: 0.2 },
  { model: 'KTR 100', d: 24, D: 50, B: 26, B1: 20, B2: 17, screw: 'M6', screwLength: 18, screwCount: 8, TA: 16, T: 370, Fax: 31, PW: 200, PN: 96, selfCentering: false, weightKg: 0.3 },
  { model: 'KTR 100', d: 25, D: 50, B: 26, B1: 20, B2: 17, screw: 'M6', screwLength: 18, screwCount: 8, TA: 16, T: 390, Fax: 31, PW: 195, PN: 97, selfCentering: false, weightKg: 0.3 },
  { model: 'KTR 100', d: 28, D: 55, B: 26, B1: 20, B2: 17, screw: 'M6', screwLength: 18, screwCount: 12, TA: 16, T: 650, Fax: 46, PW: 259, PN: 132, selfCentering: false, weightKg: 0.3 },
  { model: 'KTR 100', d: 30, D: 55, B: 26, B1: 20, B2: 17, screw: 'M6', screwLength: 18, screwCount: 12, TA: 16, T: 700, Fax: 47, PW: 243, PN: 132, selfCentering: false, weightKg: 0.3 },
  { model: 'KTR 100', d: 35, D: 60, B: 26, B1: 20, B2: 17, screw: 'M6', screwLength: 18, screwCount: 12, TA: 16, T: 820, Fax: 47, PW: 209, PN: 122, selfCentering: false, weightKg: 0.3 },
  { model: 'KTR 100', d: 40, D: 65, B: 26, B1: 20, B2: 17, screw: 'M6', screwLength: 18, screwCount: 15, TA: 16, T: 1170, Fax: 59, PW: 228, PN: 140, selfCentering: false, weightKg: 0.3 },
  { model: 'KTR 100', d: 45, D: 75, B: 32, B1: 24, B2: 20, screw: 'M8', screwLength: 22, screwCount: 12, TA: 40, T: 1790, Fax: 80, PW: 234, PN: 141, selfCentering: false, weightKg: 0.5 },
  { model: 'KTR 100', d: 50, D: 80, B: 32, B1: 24, B2: 20, screw: 'M8', screwLength: 22, screwCount: 12, TA: 40, T: 1990, Fax: 80, PW: 211, PN: 132, selfCentering: false, weightKg: 0.6 },
  { model: 'KTR 100', d: 60, D: 90, B: 32, B1: 24, B2: 20, screw: 'M8', screwLength: 22, screwCount: 15, TA: 40, T: 2990, Fax: 100, PW: 220, PN: 147, selfCentering: false, weightKg: 0.7 },
  { model: 'KTR 100', d: 70, D: 110, B: 38, B1: 28, B2: 24, screw: 'M10', screwLength: 25, screwCount: 15, TA: 78, T: 5550, Fax: 159, PW: 250, PN: 159, selfCentering: false, weightKg: 1.3 },
  { model: 'KTR 100', d: 80, D: 120, B: 38, B1: 28, B2: 24, screw: 'M10', screwLength: 25, screwCount: 15, TA: 78, T: 6350, Fax: 159, PW: 219, PN: 146, selfCentering: false, weightKg: 1.4 },

  // --- KTR 250 (Thin-Walled Hub Series - Page 312-313) ---
  { model: 'KTR 250', d: 10, D: 16, B: 30, B1: 26, B2: 22.5, D1: 29, screw: 'M4', screwLength: 10, screwCount: 4, TA: 5.6, T: 42, Fax: 8, PW: 159, PN: 99, selfCentering: true, weightKg: 0.16 },
  { model: 'KTR 250', d: 12, D: 18, B: 30, B1: 26, B2: 22.5, D1: 32, screw: 'M4', screwLength: 10, screwCount: 4, TA: 5.6, T: 55, Fax: 9, PW: 150, PN: 100, selfCentering: true, weightKg: 0.18 },
  { model: 'KTR 250', d: 14, D: 23, B: 30, B1: 26, B2: 22.5, D1: 38, screw: 'M4', screwLength: 10, screwCount: 6, TA: 5.6, T: 100, Fax: 14, PW: 193, PN: 118, selfCentering: true, weightKg: 0.20 },
  { model: 'KTR 250', d: 15, D: 24, B: 42, B1: 36, B2: 28.5, D1: 44, screw: 'M6', screwLength: 18, screwCount: 4, TA: 15, T: 145, Fax: 19, PW: 214, PN: 134, selfCentering: true, weightKg: 0.2 },
  { model: 'KTR 250', d: 16, D: 24, B: 42, B1: 36, B2: 28.5, D1: 44, screw: 'M6', screwLength: 18, screwCount: 4, TA: 15, T: 155, Fax: 19, PW: 201, PN: 134, selfCentering: true, weightKg: 0.3 },
  { model: 'KTR 250', d: 18, D: 26, B: 44, B1: 38, B2: 31, D1: 47, screw: 'M6', screwLength: 18, screwCount: 4, TA: 17, T: 210, Fax: 23, PW: 204, PN: 141, selfCentering: true, weightKg: 0.2 },
  { model: 'KTR 250', d: 20, D: 28, B: 44, B1: 38, B2: 31, D1: 49, screw: 'M6', screwLength: 18, screwCount: 4, TA: 17, T: 230, Fax: 23, PW: 183, PN: 131, selfCentering: true, weightKg: 0.2 },
  { model: 'KTR 250', d: 25, D: 34, B: 44, B1: 38, B2: 31, D1: 56, screw: 'M6', screwLength: 18, screwCount: 6, TA: 17, T: 430, Fax: 35, PW: 215, PN: 158, selfCentering: true, weightKg: 0.3 },
  { model: 'KTR 250', d: 30, D: 41, B: 44, B1: 38, B2: 31, D1: 64, screw: 'M6', screwLength: 18, screwCount: 6, TA: 17, T: 520, Fax: 35, PW: 179, PN: 131, selfCentering: true, weightKg: 0.4 },

  // --- KTR 400 (Heavy-Duty Double Taper - Page 314-315) ---
  { model: 'KTR 400', d: 24, D: 50, B: 51, B1: 45, B2: 41, screw: 'M6', screwLength: 35, screwCount: 6, TA: 17, T: 700, Fax: 58, PW: 202, PN: 92, selfCentering: true, weightKg: 0.5 },
  { model: 'KTR 400', d: 25, D: 50, B: 51, B1: 45, B2: 41, screw: 'M6', screwLength: 35, screwCount: 6, TA: 17, T: 730, Fax: 58, PW: 194, PN: 92, selfCentering: true, weightKg: 0.5 },
  { model: 'KTR 400', d: 30, D: 60, B: 60, B1: 54, B2: 50, screw: 'M6', screwLength: 40, screwCount: 8, TA: 17, T: 1400, Fax: 93, PW: 201, PN: 101, selfCentering: true, weightKg: 0.8 },
  { model: 'KTR 400', d: 40, D: 75, B: 72, B1: 64, B2: 60, screw: 'M8', screwLength: 50, screwCount: 8, TA: 41, T: 3100, Fax: 155, PW: 205, PN: 109, selfCentering: true, weightKg: 1.5 },
  { model: 'KTR 400', d: 50, D: 90, B: 86, B1: 78, B2: 74, screw: 'M8', screwLength: 60, screwCount: 10, TA: 41, T: 5500, Fax: 220, PW: 204, PN: 113, selfCentering: true, weightKg: 2.5 },
  { model: 'KTR 400', d: 60, D: 100, B: 86, B1: 78, B2: 74, screw: 'M8', screwLength: 60, screwCount: 12, TA: 41, T: 8000, Fax: 267, PW: 206, PN: 124, selfCentering: true, weightKg: 2.9 },
  { model: 'KTR 400', d: 80, D: 130, B: 106, B1: 96, B2: 90, screw: 'M10', screwLength: 70, screwCount: 12, TA: 83, T: 19000, Fax: 475, PW: 236, PN: 145, selfCentering: true, weightKg: 6.2 },
  { model: 'KTR 400', d: 100, D: 145, B: 110, B1: 100, B2: 94, screw: 'M12', screwLength: 80, screwCount: 10, TA: 145, T: 30000, Fax: 600, PW: 202, PN: 139, selfCentering: true, weightKg: 8.5 },
];

/**
 * Map of KTR CLAMPEX® entries grouped by series
 */
export const KTR_CLAMPEX_SERIES: Record<KtrClampexModel, KtrClampexEntry[]> = {
  'KTR 100': KTR_CLAMPEX_CATALOG.filter(e => e.model === 'KTR 100'),
  'KTR 200': KTR_CLAMPEX_CATALOG.filter(e => e.model === 'KTR 200'),
  'KTR 201': KTR_CLAMPEX_CATALOG.filter(e => e.model === 'KTR 201'),
  'KTR 250': KTR_CLAMPEX_CATALOG.filter(e => e.model === 'KTR 250'),
  'KTR 400': KTR_CLAMPEX_CATALOG.filter(e => e.model === 'KTR 400'),
};

/**
 * Retrieve exact KTR CLAMPEX® specifications for a given model and shaft diameter
 */
export function getKtrClampexSpecs(
  model: KtrClampexModel,
  d: number
): KtrClampexEntry | undefined {
  return KTR_CLAMPEX_CATALOG.find(e => e.model === model && Math.abs(e.d - d) < 0.1);
}

/**
 * List all available standard shaft diameters for a model or whole catalog
 */
export function getAvailableShaftDiameters(model?: KtrClampexModel): number[] {
  const source = model ? KTR_CLAMPEX_SERIES[model] : KTR_CLAMPEX_CATALOG;
  const set = new Set(source.map(e => e.d));
  return Array.from(set).sort((a, b) => a - b);
}

/**
 * Finds matching KTR CLAMPEX® clamping set based on shaft diameter (d) and optional model
 * Supports both signatures: (dShaft, model) and (model, dShaft)
 */
export function findKtrClampexByShaft(
  a: number | KtrClampexModel,
  b?: number | KtrClampexModel
): KtrClampexEntry | undefined {
  const dShaft = typeof a === 'number' ? a : (typeof b === 'number' ? b : 30);
  const preferredModel: KtrClampexModel = typeof a === 'string' ? (a as KtrClampexModel) : (typeof b === 'string' ? (b as KtrClampexModel) : 'KTR 200');

  // First attempt: exact model and shaft match
  const match = KTR_CLAMPEX_CATALOG.find(e => e.model === preferredModel && Math.abs(e.d - dShaft) < 0.1);
  if (match) return match;

  // Second attempt: closest shaft diameter in preferred model
  const modelEntries = KTR_CLAMPEX_CATALOG.filter(e => e.model === preferredModel);
  if (modelEntries.length > 0) {
    let closest = modelEntries[0];
    let minDiff = Math.abs(closest.d - dShaft);
    for (const e of modelEntries) {
      const diff = Math.abs(e.d - dShaft);
      if (diff < minDiff) {
        minDiff = diff;
        closest = e;
      }
    }
    return closest;
  }

  // Fallback: any model with closest shaft
  let closest = KTR_CLAMPEX_CATALOG[0];
  let minDiff = Math.abs(closest.d - dShaft);
  for (const e of KTR_CLAMPEX_CATALOG) {
    const diff = Math.abs(e.d - dShaft);
    if (diff < minDiff) {
      minDiff = diff;
      closest = e;
    }
  }
  return closest;
}

/**
 * Finds exact KTR CLAMPEX® entry by model and dimensions (d x D)
 */
export function findKtrClampexBySize(
  model: KtrClampexModel,
  d: number,
  D: number
): KtrClampexEntry | undefined {
  return KTR_CLAMPEX_CATALOG.find(e => e.model === model && Math.abs(e.d - d) < 0.1 && Math.abs(e.D - D) < 0.1);
}

/**
 * Sizing of Hub External Diameter (DN) and Hollow Shaft (diW)
 * Citing KTR Drive Technology Catalogue, Page 295 Section 4:
 * 
 * Formula:
 *   DN >= D * sqrt((sigma_02 + PN * C) / (sigma_02 - PN * C))
 * 
 * Where:
 *   - DN: Required minimum external hub diameter [mm]
 *   - D: Clamping element external diameter [mm]
 *   - PN: Hub surface contact pressure [N/mm²]
 *   - sigma_02: Material yield strength Rp0.2 (Yield point) [N/mm²]
 *   - C: Hub shape correction factor:
 *        C = 1.0 for cylindrical hubs with uniform outer diameter
 *        C = 0.8 for asymmetrical stepped or flanged hubs
 *        C = 0.6 for webbed or rimmed gear bodies
 */
export function calculateKtrHubSizing(
  entryOrParams: KtrClampexEntry | {
    entry: KtrClampexEntry;
    hubYieldMpa: number;
    safetyFactor?: number;
    shapeFactorC?: number;
    shaftYieldMpa?: number;
  },
  optionalOpts?: {
    hubYieldMpa?: number;
    safetyFactor?: number;
    shapeFactorC?: number;
    shaftYieldMpa?: number;
  }
): KtrHubSizingResult {
  const isPositional = 'model' in entryOrParams && 'd' in entryOrParams;
  const entry: KtrClampexEntry = isPositional ? (entryOrParams as KtrClampexEntry) : (entryOrParams as any).entry;
  const hubYieldMpa: number = isPositional ? (optionalOpts?.hubYieldMpa ?? 350) : (entryOrParams as any).hubYieldMpa;
  const safetyFactor: number = isPositional ? (optionalOpts?.safetyFactor ?? 1.25) : ((entryOrParams as any).safetyFactor ?? 1.25);
  const shapeFactorC: number = isPositional ? (optionalOpts?.shapeFactorC ?? 0.8) : ((entryOrParams as any).shapeFactorC ?? 0.8);
  const shaftYieldMpa: number = isPositional ? (optionalOpts?.shaftYieldMpa ?? 350) : ((entryOrParams as any).shaftYieldMpa ?? 350);

  const notes: string[] = [];

  const effectiveYield = hubYieldMpa / safetyFactor;
  const pEff = entry.PN * shapeFactorC;

  let minHubDiameter: number;
  let hubYieldSafety = effectiveYield / Math.max(1, entry.PN);
  let isValid = true;

  if (pEff >= effectiveYield) {
    // Plastic deformation risk: hub pressure exceeds effective material yield strength
    isValid = false;
    notes.push(
      `Warning: Hub pressure (PN=${entry.PN} MPa * C=${shapeFactorC} = ${pEff.toFixed(1)} MPa) exceeds allowable yield (${effectiveYield.toFixed(1)} MPa). Select higher strength hub material or lower PN clamping set.`
    );
    // Theoretical limit fallback
    minHubDiameter = entry.D * 2.2;
  } else {
    // KTR Catalog Page 295 formula:
    const radicand = (effectiveYield + pEff) / (effectiveYield - pEff);
    minHubDiameter = entry.D * Math.sqrt(radicand);
  }

  // Hollow shaft maximum inner diameter per KTR p.295:
  // diW <= d * sqrt((sigma_W02 - 2 * PW * 0.8) / sigma_W02)
  let maxHollowShaftInnerDia = 0;
  const shaftRadicand = (shaftYieldMpa - 2 * entry.PW * 0.8) / shaftYieldMpa;
  if (shaftRadicand > 0) {
    maxHollowShaftInnerDia = entry.d * Math.sqrt(shaftRadicand);
  } else {
    maxHollowShaftInnerDia = 0; // Solid shaft required
    notes.push(`Shaft contact pressure (PW=${entry.PW} MPa) requires a solid shaft (no hollow core allowable).`);
  }

  const minWallThickness = (minHubDiameter - entry.D) / 2;

  return {
    minHubDiameter: Math.ceil(minHubDiameter * 10) / 10,
    minWallThickness: Math.ceil(minWallThickness * 10) / 10,
    transmittableTorque: entry.T,
    transmittableAxialForce: entry.Fax,
    hubPressureMpa: entry.PN,
    shaftPressureMpa: entry.PW,
    maxHollowShaftInnerDia: Math.floor(maxHollowShaftInnerDia * 10) / 10,
    hubYieldSafety: Math.round(hubYieldSafety * 100) / 100,
    isValid,
    notes,
  };
}

export interface KtrRecommendation {
  recommendedEntry: KtrClampexEntry;
  requiredTorqueNm: number;
  safetyFactor: number;
  hubSizing: KtrHubSizingResult;
  model: KtrClampexModel;
  explanation: string;
  explanationTr: string;
  alternatives: KtrClampexEntry[];
}

/**
 * Recommends optimal KTR CLAMPEX® conical lock set based on shaft diameter, load, and component type.
 * References: KTR Drive Technology Catalogue Pages 295–315.
 */
export function recommendKtrClampex(params: {
  shaftDiameter: number;
  powerKw?: number;
  speedRpm?: number;
  torqueNm?: number;
  preferredModel?: KtrClampexModel | 'auto';
  componentType?: 'pulley' | 'gear' | 'sprocket';
  hubMaterialYieldMpa?: number;
  maxAllowableOuterDia?: number;
}): KtrRecommendation {
  const d = Math.max(8, params.shaftDiameter);
  const compType = params.componentType || 'pulley';
  const hubYield = params.hubMaterialYieldMpa || 350; // EN AW-6061-T6 is ~240, C45 steel is ~350-400

  // 1. Calculate required torque
  let tReq = params.torqueNm;
  if (!tReq && params.powerKw && params.speedRpm && params.speedRpm > 0) {
    const nominalT = 9550 * (params.powerKw / params.speedRpm);
    const serviceFactorKA = 1.5; // DIN 3990 / ISO 5296
    tReq = nominalT * serviceFactorKA;
  }
  if (!tReq || tReq <= 0) {
    // Nominal shaft shear capacity based on tau_perm = 45 MPa
    const wp = (Math.PI * Math.pow(d, 3)) / 16;
    tReq = Math.round(wp * 45 * 1e-3);
  }
  tReq = Math.max(10, Math.round(tReq));

  // 2. Candidate search
  let candidates = KTR_CLAMPEX_CATALOG.filter(e => Math.abs(e.d - d) < 0.2);
  if (candidates.length === 0) {
    // Find closest shaft diameter
    let closestD = KTR_CLAMPEX_CATALOG[0].d;
    let minDiff = Math.abs(closestD - d);
    for (const e of KTR_CLAMPEX_CATALOG) {
      const diff = Math.abs(e.d - d);
      if (diff < minDiff) {
        minDiff = diff;
        closestD = e.d;
      }
    }
    candidates = KTR_CLAMPEX_CATALOG.filter(e => Math.abs(e.d - closestD) < 0.2);
  }

  // 3. Selection heuristic based on component type and preferred model
  let selected: KtrClampexEntry = candidates[0];

  if (params.preferredModel && params.preferredModel !== 'auto') {
    const modelMatch = candidates.find(e => e.model === params.preferredModel);
    if (modelMatch) selected = modelMatch;
  } else {
    // Auto recommendation heuristic:
    // Pulleys: KTR 250 (thin-walled, low PN) or KTR 200
    // Gears / Sprockets: KTR 200 (universal self-centering) or KTR 100
    if (compType === 'pulley') {
      const ktr250 = candidates.find(e => e.model === 'KTR 250');
      const ktr200 = candidates.find(e => e.model === 'KTR 200');
      if (ktr250 && ktr250.T >= tReq * 1.1) {
        selected = ktr250;
      } else if (ktr200) {
        selected = ktr200;
      }
    } else {
      const ktr200 = candidates.find(e => e.model === 'KTR 200');
      if (ktr200 && ktr200.T >= tReq * 1.1) {
        selected = ktr200;
      } else {
        const ktr400 = candidates.find(e => e.model === 'KTR 400');
        if (ktr400) selected = ktr400;
      }
    }
  }

  // 4. Calculate Hub Sizing
  let hubSizing = calculateKtrHubSizing(selected, { hubYieldMpa: hubYield });

  // If hub outer diameter exceeds allowable space, try lower PN series (KTR 250 or KTR 100)
  if (params.maxAllowableOuterDia && hubSizing.minHubDiameter > params.maxAllowableOuterDia) {
    const alternative = candidates.find(e => e.model === 'KTR 250' || e.model === 'KTR 100');
    if (alternative) {
      const altSizing = calculateKtrHubSizing(alternative, { hubYieldMpa: hubYield });
      if (altSizing.minHubDiameter < hubSizing.minHubDiameter) {
        selected = alternative;
        hubSizing = altSizing;
      }
    }
  }

  const safetyFactor = Math.round((selected.T / tReq) * 100) / 100;
  const alternatives = candidates.filter(e => e !== selected);

  const explanation = `Recommended ${selected.model} (Ø${selected.d}xØ${selected.D} mm): Transmits ${selected.T} N·m (Safety S=${safetyFactor}). Minimum hub diameter DN=${hubSizing.minHubDiameter} mm per KTR p.295. Screws: ${selected.screwCount}x${selected.screw} (TA=${selected.TA} N·m).`;
  const explanationTr = `Önerilen: ${selected.model} (Ø${selected.d}xØ${selected.D} mm): Aktarılabilir Tork: ${selected.T} N·m (Emniyet S=${safetyFactor}). KTR s.295 formülüne göre min. göbek dış çapı DN=${hubSizing.minHubDiameter} mm. Civatalar: ${selected.screwCount}x${selected.screw} (Sıkma Torku TA=${selected.TA} N·m).`;

  return {
    recommendedEntry: selected,
    requiredTorqueNm: tReq,
    safetyFactor,
    hubSizing,
    model: selected.model,
    explanation,
    explanationTr,
    alternatives,
  };
}

