/**
 * ISO 898-1 & ISO 262 FASTENER STANDARDS REGISTRY
 * CORE OS DATA LAYER - PHASE 3A
 */

export interface MetricThreadData {
  size: string;
  pitch: number;           // P [mm]
  minorDiameter: number;   // d1 [mm]
  stressArea: number;      // As [mm^2]
}

export interface BoltGradeData {
  grade: string;
  yieldStrength: number;   // Sy [MPa]
  proofStrength: number;   // Sp [MPa]
  tensileStrength: number; // Sut [MPa]
}

export const METRIC_COARSE_THREADS: Record<string, MetricThreadData> = {
  'M2': { size: 'M2', pitch: 0.4, minorDiameter: 1.509, stressArea: 2.07 },
  'M3': { size: 'M3', pitch: 0.5, minorDiameter: 2.387, stressArea: 5.03 },
  'M4': { size: 'M4', pitch: 0.7, minorDiameter: 3.141, stressArea: 8.78 },
  'M5': { size: 'M5', pitch: 0.8, minorDiameter: 4.019, stressArea: 14.2 },
  'M6': { size: 'M6', pitch: 1.0, minorDiameter: 4.773, stressArea: 20.1 },
  'M8': { size: 'M8', pitch: 1.25, minorDiameter: 6.466, stressArea: 36.6 },
  'M10': { size: 'M10', pitch: 1.5, minorDiameter: 8.160, stressArea: 58.0 },
  'M12': { size: 'M12', pitch: 1.75, minorDiameter: 9.853, stressArea: 84.3 },
  'M14': { size: 'M14', pitch: 2.0, minorDiameter: 11.546, stressArea: 115 },
  'M16': { size: 'M16', pitch: 2.0, minorDiameter: 13.546, stressArea: 157 },
  'M20': { size: 'M20', pitch: 2.5, minorDiameter: 16.933, stressArea: 245 },
};

export const BOLT_GRADES_ISO_898_1: Record<string, BoltGradeData> = {
  '8.8': { grade: '8.8', yieldStrength: 640, proofStrength: 580, tensileStrength: 800 },
  '10.9': { grade: '10.9', yieldStrength: 940, proofStrength: 830, tensileStrength: 1040 },
  '12.9': { grade: '12.9', yieldStrength: 1100, proofStrength: 970, tensileStrength: 1220 },
};

/**
 * UTILITY: Retrieves exact engineering defaults for a given fastener configuration.
 * Returns null if the combination is not found in the verified registry.
 */
export function getFastenerDefaults(size: string, grade: string) {
  const thread = METRIC_COARSE_THREADS[size];
  const material = BOLT_GRADES_ISO_898_1[grade];

  if (!thread || !material) return null;

  return {
    ...thread,
    ...material,
    verificationStandard: 'ISO 898-1 / ISO 262',
    timestamp: new Date().toISOString()
  };
}
