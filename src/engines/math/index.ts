/**
 * AluCalculator Engineering Kernel — Math Engines Index
 * 
 * Central export point for all mathematical engines.
 */

// Primitives
export * from './primitives';

// Involute Core
export {
    type Point2D,
    type GearParameters,
    type GearGeometry,
    type ValidationResult,
    involuteFunction,
    inverseInvolute,
    involutePoint,
    generateInvoluteCurve,
    calculateGearGeometry,
    validateGearParameters,
    simplifyPolyline,
    distance,
    DEFAULT_GEAR_PARAMS,
} from './involute';

// Gear Mesh
export {
    type GearPairInput,
    type GearMeshResult,
    type VelocityResult,
    type GearStrengthInput,
    type GearStrengthResult,
    analyzeGearPair,
    calculateVelocities,
    calculateBendingStrength,
    minTeethNoUndercut,
    requiredProfileShift,
    createStandardGearPair,
} from './gear.geometry';
