/** Maps academy lesson slugs to working AluCalc calculator routes. */
export type AcademyCalculatorRoute = {
  href: string;
  engineId: string;
  workspaceLabel: string;
};

export const ACADEMY_CALCULATOR_ROUTES: Record<string, AcademyCalculatorRoute> = {
  'engineering-units-and-standards': {
    href: '/unit-converter',
    engineId: 'unit-converter',
    workspaceLabel: 'Unit Converter',
  },
  'fundamentals-of-statics': {
    href: '/simulation-fea',
    engineId: 'simulation-fea',
    workspaceLabel: 'FEA Simulation Engine',
  },
  'introduction-to-machine-elements': {
    href: '/bolt-torque',
    engineId: 'bolt-torque',
    workspaceLabel: 'Fastener Preload Engine',
  },
  'thread-geometry-standards': {
    href: '/fasteners',
    engineId: 'fasteners',
    workspaceLabel: 'Thread & Fastener Engine',
  },
  'how-to-calculate-bolt-torque': {
    href: '/bolt-torque',
    engineId: 'bolt-torque',
    workspaceLabel: 'VDI 2230 Fastener Engine',
  },
  'bearing-life-calculation-explained': {
    href: '/bearings',
    engineId: 'bearings',
    workspaceLabel: 'ISO 281 Bearing Engine',
  },
  'motor-power-calculation': {
    href: '/belt-drive',
    engineId: 'belt-drive',
    workspaceLabel: 'Belt Drive Engine',
  },
  'mechanics-of-materials-fundamentals': {
    href: '/strength',
    engineId: 'strength-analysis',
    workspaceLabel: 'Stress–Strain Engine',
  },
  'mohrs-circle-stress-analysis': {
    href: '/strength',
    engineId: 'strength-analysis',
    workspaceLabel: 'Mohr Stress Lab',
  },
  'torsion-and-buckling-mechanics': {
    href: '/column-buckling',
    engineId: 'column-buckling',
    workspaceLabel: 'Column Buckling Engine',
  },
  'beam-deflection-formula-explained': {
    href: '/beam-deflection',
    engineId: 'beam-deflection',
    workspaceLabel: 'Beam Deflection Engine',
  },
  'pressure-drop-calculation-guide': {
    href: '/fluid-dynamics',
    engineId: 'fluid-dynamics',
    workspaceLabel: 'Darcy-Weisbach Flow Engine',
  },
  'chip-breaker-logic': {
    href: '/machining-details',
    engineId: 'machining-details',
    workspaceLabel: 'Machining Parameter Engine',
  },
};

export function getAcademyCalculatorRoute(slug: string): AcademyCalculatorRoute | undefined {
  return ACADEMY_CALCULATOR_ROUTES[slug];
}
