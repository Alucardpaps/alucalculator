/**
 * Math Engine for Column Buckling (Euler Critical Load)
 * Based on data extracted from NotebookLM
 */

export type EndCondition = 'pinned-pinned' | 'fixed-fixed' | 'fixed-pinned' | 'fixed-free';

/**
 * Returns the theoretical end condition constant (C)
 * Pinned-Pinned: 1
 * Fixed-Fixed: 4
 * Fixed-Pinned: 2
 * Fixed-Free: 0.25
 */
export function getEndConditionConstant(condition: EndCondition): number {
  switch (condition) {
    case 'pinned-pinned': return 1;
    case 'fixed-fixed': return 4;
    case 'fixed-pinned': return 2;
    case 'fixed-free': return 0.25;
    default: return 1;
  }
}

/**
 * Calculates the Euler Critical Load for long, slender columns.
 * Source Formula: P_cr = (C * pi^2 * E * I) / l^2
 * 
 * @param C End-condition constant
 * @param E Modulus of Elasticity (MPa or N/mm²)
 * @param I Minimum moment of inertia (mm^4)
 * @param l Unsupported length (mm)
 * @returns Critical buckling load P_cr in Newtons (N)
 */
export function calculateEulerCriticalLoad(C: number, E: number, I: number, l: number): number {
  if (l <= 0) return 0;
  return (C * Math.pow(Math.PI, 2) * E * I) / Math.pow(l, 2);
}
