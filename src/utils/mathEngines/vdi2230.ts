/**
 * Math Engine for VDI 2230 Fastener Calculations
 * Based on data extracted from NotebookLM
 */

/**
 * Calculates the required tightening torque.
 * Source Formula: T = K * d * F_M
 * K = K1 + K2 + K3
 * 
 * @param d Nominal bolt diameter (mm)
 * @param FM Desired initial clamping load / preload (N)
 * @param K Nut factor (typically 0.12 - 0.20 depending on friction)
 * @returns Tightening Torque T in N·m
 */
export function calculateTighteningTorque(d: number, FM: number, K: number): number {
  // Convert diameter to meters for Nm
  const d_m = d / 1000;
  return K * d_m * FM;
}

/**
 * Calculates the working load on the bolt when an external load is applied.
 * Source Formula: F_c = F_ön + F_i * (K_c / (K_c + K_B))
 * 
 * @param F_preload Initial preload (F_ön) in N
 * @param F_external Applied external load (F_i) in N
 * @param K_c Bolt stiffness (yay katsayısı) in N/mm
 * @param K_B Flange/Joint stiffness in N/mm
 * @returns Total force on bolt (F_c) in N
 */
export function calculateWorkingBoltLoad(F_preload: number, F_external: number, K_c: number, K_B: number): number {
  return F_preload + F_external * (K_c / (K_c + K_B));
}
