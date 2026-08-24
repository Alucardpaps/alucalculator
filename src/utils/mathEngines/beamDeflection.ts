/**
 * Math Engine for Beam Deflection (Roark's Formulas)
 * Based on data extracted from NotebookLM
 */

/**
 * Simply Supported Beam with Uniform Load (w)
 * Max Moment: M = w * l^2 / 8
 * Max Deflection: y = -5 * w * l^4 / (384 * E * I)
 */
export function simplySupportedUniform(w: number, l: number, E: number, I: number) {
  const maxMoment = (w * Math.pow(l, 2)) / 8;
  const maxDeflection = (5 * w * Math.pow(l, 4)) / (384 * E * I); // Magnitude
  return { maxMoment, maxDeflection };
}

/**
 * Simply Supported Beam with Point Load at Center (W)
 * Max Moment: M = W * l / 4
 * Max Deflection: y = -W * l^3 / (48 * E * I)
 */
export function simplySupportedCenterPoint(W: number, l: number, E: number, I: number) {
  const maxMoment = (W * l) / 4;
  const maxDeflection = (W * Math.pow(l, 3)) / (48 * E * I); // Magnitude
  return { maxMoment, maxDeflection };
}

/**
 * Cantilever Beam with Uniform Load (w)
 * Max Moment: M = -w * l^2 / 2 (at fixed end)
 * Max Deflection: y = -w * l^4 / (8 * E * I) (at free end)
 */
export function cantileverUniform(w: number, l: number, E: number, I: number) {
  const maxMoment = (w * Math.pow(l, 2)) / 2; // Magnitude
  const maxDeflection = (w * Math.pow(l, 4)) / (8 * E * I); // Magnitude
  return { maxMoment, maxDeflection };
}
