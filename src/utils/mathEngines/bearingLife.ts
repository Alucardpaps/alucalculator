/**
 * Math Engine for ISO 281 Bearing Life
 * Based on data extracted from NotebookLM
 */

/**
 * Calculates the basic rating life in operating hours (L10h) according to ISO 281.
 * Source Formula: L10h = (10^6 / (60 * n)) * (C / P)^p
 * 
 * @param C Basic dynamic load rating (kN)
 * @param P Equivalent dynamic bearing load (kN)
 * @param n Rotational speed (rpm)
 * @param bearingType 'ball' (p=3) or 'roller' (p=10/3)
 * @returns L10h rating life in hours
 */
export function calculateBearingLifeL10h(C: number, P: number, n: number, bearingType: 'ball' | 'roller'): number {
  if (n <= 0 || P <= 0) return 0;
  const p = bearingType === 'ball' ? 3 : (10 / 3);
  const lifeRevolutions = Math.pow(C / P, p);
  const l10h = (1_000_000 / (60 * n)) * lifeRevolutions;
  return l10h;
}
