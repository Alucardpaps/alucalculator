import { useMemo } from 'react';

interface BucklingInput {
  length: number; // L (mm)
  area: number; // A (mm^2)
  inertia: number; // I (mm^4)
  elasticModulus: number; // E (MPa)
  yieldStrength: number; // Sy (MPa)
}

export const useBucklingAnalysis = ({ length, area, inertia, elasticModulus, yieldStrength }: BucklingInput) => {
  return useMemo(() => {
    // Prevent divide by zero
    if (area <= 0 || inertia <= 0 || length <= 0) {
      return {
        radiusOfGyration: 0,
        slendernessRatio: 0,
        criticalSlenderness: 0,
        criticalLoad: 0,
        criticalLoadKg: 0,
        mode: 'Invalid'
      };
    }

    // 1. Radius of Gyration (r = sqrt(I/A))
    const radiusOfGyration = Math.sqrt(inertia / area);

    // 2. Slenderness Ratio (lambda = L / r)
    // Assuming pinned-pinned column (K = 1)
    const slendernessRatio = length / radiusOfGyration;

    // 3. Critical Slenderness Ratio (lambda_c = sqrt((2 * pi^2 * E) / Sy))
    const criticalSlenderness = Math.sqrt((2 * Math.pow(Math.PI, 2) * elasticModulus) / yieldStrength);

    let criticalLoad = 0;
    let mode = '';

    if (slendernessRatio > criticalSlenderness) {
      // Euler Formula (Elastic Buckling)
      // Pcr = (pi^2 * E * I) / L^2
      criticalLoad = (Math.pow(Math.PI, 2) * elasticModulus * inertia) / Math.pow(length, 2);
      mode = 'Euler (Elastic)';
    } else {
      // J.B. Johnson / Engesser Formula (Inelastic Buckling)
      // Pcr = A * [Sy - (1/E) * (Sy * lambda / (2 * pi))^2]
      const term = (yieldStrength * slendernessRatio) / (2 * Math.PI);
      criticalLoad = area * (yieldStrength - (1 / elasticModulus) * Math.pow(term, 2));
      mode = 'J.B. Johnson (Inelastic)';
    }

    return {
      radiusOfGyration,
      slendernessRatio,
      criticalSlenderness,
      criticalLoad, // Newtons
      criticalLoadKg: criticalLoad / 9.81, // kg
      mode
    };
  }, [length, area, inertia, elasticModulus, yieldStrength]);
};
