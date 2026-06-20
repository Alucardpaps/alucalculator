import type { CalcGroupKey, CalcModuleId } from '@/locales/calculatorsPageTranslations';

export const CALC_HUB_VISUALS = {
  GEARS: '/assets/dashboard/gears.png',
  TRUSS: '/assets/dashboard/truss.png',
  FLUIDS: '/assets/dashboard/fluids.png',
  PUMP: '/assets/dashboard/pump.png',
  WING: '/assets/dashboard/wing.png',
  FASTENER: '/assets/dashboard/fasteners.png',
  CIRCUIT: '/assets/dashboard/circuit.png',
  ELECTRONICS: '/assets/dashboard/electronics.png',
  MATERIALS: '/assets/dashboard/materials.png',
  CHEMISTRY: '/assets/dashboard/chemistry.png',
  BEARINGS: '/assets/dashboard/bearings.png',
  LASER: '/assets/dashboard/laser.png',
  AUTOMATION: '/assets/dashboard/automation.png',
  MFG: '/assets/dashboard/manufacturing.png',
  ROBOTICS: '/assets/dashboard/robotics.png',
  STRUCTURAL: '/assets/dashboard/structural.png',
} as const;

export type CalculatorHubModule = {
  id: CalcModuleId;
  path: string;
  image: string;
  color: string;
  group: CalcGroupKey;
};

export const CALCULATOR_HUB_MODULES: CalculatorHubModule[] = [
  { id: 'profileWeight', path: '/aluminum', image: CALC_HUB_VISUALS.STRUCTURAL, color: '#00e5ff', group: 'mechanicalStructural' },
  { id: 'gearDesign', path: '/gears', image: CALC_HUB_VISUALS.GEARS, color: '#00e5ff', group: 'mechanicalStructural' },
  { id: 'planetaryGear', path: '/planetary-gearbox', image: CALC_HUB_VISUALS.ROBOTICS, color: '#00e5ff', group: 'mechanicalStructural' },
  { id: 'iso281Bearings', path: '/bearings', image: CALC_HUB_VISUALS.BEARINGS, color: '#00e5ff', group: 'mechanicalStructural' },
  { id: 'fastenerEngineering', path: '/bolt-torque', image: CALC_HUB_VISUALS.FASTENER, color: '#FFA500', group: 'mechanicalStructural' },
  { id: 'strengthAnalysis', path: '/strength', image: CALC_HUB_VISUALS.TRUSS, color: '#0891b2', group: 'mechanicalStructural' },
  { id: 'beamDeflection', path: '/beam-deflection', image: CALC_HUB_VISUALS.STRUCTURAL, color: '#0891b2', group: 'mechanicalStructural' },
  { id: 'concreteReinf', path: '/concrete-reinforcement', image: CALC_HUB_VISUALS.TRUSS, color: '#0891b2', group: 'mechanicalStructural' },
  { id: 'fatigueLife', path: '/fatigue', image: CALC_HUB_VISUALS.GEARS, color: '#00e5ff', group: 'mechanicalStructural' },
  { id: 'advFatigue', path: '/fatigue-advanced', image: CALC_HUB_VISUALS.BEARINGS, color: '#00e5ff', group: 'mechanicalStructural' },
  { id: 'fitsTolerances', path: '/fits', image: CALC_HUB_VISUALS.MFG, color: '#00e5ff', group: 'mechanicalStructural' },
  { id: 'reducerLube', path: '/reducer-lubrication', image: CALC_HUB_VISUALS.FLUIDS, color: '#00e5ff', group: 'mechanicalStructural' },
  { id: 'gearboxEngine', path: '/gearbox-design', image: CALC_HUB_VISUALS.ROBOTICS, color: '#00e5ff', group: 'mechanicalStructural' },
  { id: 'rollerChainDrive', path: '/chain-drive', image: CALC_HUB_VISUALS.GEARS, color: '#00e5ff', group: 'mechanicalStructural' },
  { id: 'beltDrive', path: '/belt-drive', image: CALC_HUB_VISUALS.GEARS, color: '#00e5ff', group: 'mechanicalStructural' },
  { id: 'machiningDetails', path: '/machining-details', image: CALC_HUB_VISUALS.MFG, color: '#a78bfa', group: 'manufacturingProduction' },
  { id: 'weldCalculator', path: '/welding', image: CALC_HUB_VISUALS.LASER, color: '#a78bfa', group: 'manufacturingProduction' },
  { id: 'mfgReadiness', path: '/mfg-readiness', image: CALC_HUB_VISUALS.AUTOMATION, color: '#a78bfa', group: 'manufacturingProduction' },
  { id: 'mfgSandbox', path: '/manufacturing-sandbox', image: CALC_HUB_VISUALS.ROBOTICS, color: '#a78bfa', group: 'manufacturingProduction' },
  { id: 'topologyOpt', path: '/topology-optimization', image: CALC_HUB_VISUALS.STRUCTURAL, color: '#a78bfa', group: 'manufacturingProduction' },
  { id: 'engSelection', path: '/engineering-selection', image: CALC_HUB_VISUALS.MFG, color: '#a78bfa', group: 'manufacturingProduction' },
  { id: 'sheetMetalBending', path: '/sheet-metal', image: CALC_HUB_VISUALS.STRUCTURAL, color: '#a78bfa', group: 'manufacturingProduction' },
  { id: 'costEstimator', path: '/cost-estimator', image: CALC_HUB_VISUALS.AUTOMATION, color: '#4ade80', group: 'manufacturingProduction' },
  { id: 'pumpSuite', path: '/pumps', image: CALC_HUB_VISUALS.PUMP, color: '#00d2ff', group: 'fluidAerospace' },
  { id: 'fluidDynamics', path: '/fluid-dynamics', image: CALC_HUB_VISUALS.FLUIDS, color: '#00d2ff', group: 'fluidAerospace' },
  { id: 'aerospaceDynamics', path: '/aerospace-dynamics', image: CALC_HUB_VISUALS.WING, color: '#38bdf8', group: 'fluidAerospace' },
  { id: 'navalHydro', path: '/naval-hydrostatics', image: CALC_HUB_VISUALS.PUMP, color: '#38bdf8', group: 'fluidAerospace' },
  { id: 'kinematics', path: '/physics-kinematics', image: CALC_HUB_VISUALS.ROBOTICS, color: '#38bdf8', group: 'fluidAerospace' },
  { id: 'thermalExpansion', path: '/thermal-expansion', image: CALC_HUB_VISUALS.CHEMISTRY, color: '#f472b6', group: 'fluidAerospace' },
  { id: 'physicsSolver', path: '/physics-solver', image: CALC_HUB_VISUALS.MATERIALS, color: '#38bdf8', group: 'fluidAerospace' },
  { id: 'materialsDB', path: '/materials-db', image: CALC_HUB_VISUALS.MATERIALS, color: '#f472b6', group: 'intelligenceScience' },
  { id: 'materialsIntelligence', path: '/materials-explorer', image: CALC_HUB_VISUALS.CHEMISTRY, color: '#f472b6', group: 'intelligenceScience' },
  { id: 'materialSelectorAI', path: '/material-selector-ai', image: CALC_HUB_VISUALS.MATERIALS, color: '#f472b6', group: 'intelligenceScience' },
  { id: 'failurePrediction', path: '/failure-prediction', image: CALC_HUB_VISUALS.TRUSS, color: '#f472b6', group: 'intelligenceScience' },
  { id: 'failureAnalysis', path: '/failure-diagnosis', image: CALC_HUB_VISUALS.LASER, color: '#f472b6', group: 'intelligenceScience' },
  { id: 'chemistryLab', path: '/chemistry-reactions', image: CALC_HUB_VISUALS.CHEMISTRY, color: '#f472b6', group: 'intelligenceScience' },
  { id: 'biologyGenetics', path: '/biology-genetics', image: CALC_HUB_VISUALS.MATERIALS, color: '#f472b6', group: 'intelligenceScience' },
  { id: 'unitConverter', path: '/unit-converter', image: CALC_HUB_VISUALS.CIRCUIT, color: '#4ade80', group: 'intelligenceScience' },
  { id: 'periodicTable', path: '/periodic-table', image: CALC_HUB_VISUALS.CHEMISTRY, color: '#f472b6', group: 'intelligenceScience' },
  { id: 'algorithms', path: '/cs-algorithms', image: CALC_HUB_VISUALS.AUTOMATION, color: '#4ade80', group: 'intelligenceScience' },
  { id: 'digitalLogicLab', path: '/digital-logic', image: CALC_HUB_VISUALS.AUTOMATION, color: '#4ade80', group: 'intelligenceScience' },
  { id: 'engineeringNotes', path: '/engineering-notes', image: CALC_HUB_VISUALS.MATERIALS, color: '#f472b6', group: 'intelligenceScience' },
  { id: 'motorSelect', path: '/motor-selection-std', image: CALC_HUB_VISUALS.ELECTRONICS, color: '#FFD700', group: 'electricalPower' },
  { id: 'ohmsLaw', path: '/ohms-law', image: CALC_HUB_VISUALS.CIRCUIT, color: '#FFD700', group: 'electricalPower' },
  { id: 'voltageDrop', path: '/voltage-drop', image: CALC_HUB_VISUALS.ELECTRONICS, color: '#FFD700', group: 'electricalPower' },
  { id: 'threePhasePower', path: '/three-phase-power', image: CALC_HUB_VISUALS.CIRCUIT, color: '#FFD700', group: 'electricalPower' },
  { id: 'filterDesign', path: '/filter-design', image: CALC_HUB_VISUALS.ELECTRONICS, color: '#FFD700', group: 'electricalPower' },
  { id: 'scientificCalc', path: '/calculator', image: CALC_HUB_VISUALS.CIRCUIT, color: '#4ade80', group: 'electricalPower' },
];

export const CALC_HUB_GROUP_ORDER: CalcGroupKey[] = [
  'mechanicalStructural',
  'manufacturingProduction',
  'fluidAerospace',
  'intelligenceScience',
  'electricalPower',
];

export const CALC_HUB_FILTER_CATEGORIES = [
  { key: 'mechanical', labelKey: 'filterMechanical' as const },
  { key: 'structural', labelKey: 'filterStructural' as const },
  { key: 'fluid', labelKey: 'filterFluid' as const },
  { key: 'manufacturing', labelKey: 'filterManufacturing' as const },
  { key: 'electrical', labelKey: 'filterElectrical' as const },
  { key: 'science', labelKey: 'filterScience' as const },
];

export function getCalcHubCardStyle(seed: string, baseImage: string) {
  const hash = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const hue = hash % 360;
  const brightness = 0.5 + (hash % 50) / 100;
  const scale = 2 + (hash % 15) / 5;
  const posX = hash % 100;
  const posY = (hash * 37) % 100;
  const tints = ['#00e5ff', '#0891b2', '#00d2ff', '#a78bfa', '#FFA500', '#f472b6', '#38bdf8', '#4ade80'];
  const tint = tints[hash % tints.length];

  return {
    style: {
      backgroundImage: `url(${baseImage})`,
      filter: `hue-rotate(${hue}deg) brightness(${brightness}) saturate(1.8) contrast(1.2)`,
      backgroundPosition: `${posX}% ${posY}%`,
      backgroundSize: `${scale * 100}%`,
    },
    tint,
  };
}
