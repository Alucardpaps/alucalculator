/**
 * ⚡ AluCAD OS — Complete 2D Nesting & Plasma CAM Engineering Pipeline
 * 
 * Complies with AGENTS.md & GEMINI.md:
 * - Deterministic ISO/DIN/EN engineering contracts
 * - 1:1 Bi-directional integration: 2D CAD ⇄ 3D Solid CAD ⇄ Dynamic Blocks ⇄ Plasma CAM
 */

export * from './core/geometry';
export * from './core/arcFitting';
export * from './core/hierarchy';
export * from './core/processProfile';
export * from './toolpath/leadInGenerator';
export * from './toolpath/thermalSequence';
export * from './post/gcodeEmitter';
export * from './post/backplotter';
export * from './nesting/hexagonalPacker';
export * from './nesting/sigmaNestEngine';

// Aliases for intuitive API usage
export { optimizeCuttingSequence as sequenceThermalJob } from './toolpath/thermalSequence';
export { emitPlasmaGcode as emitGCode, type GcodeDialect as GCodeDialect } from './post/gcodeEmitter';
export { parseAndVerifyGcode as backplotGCode } from './post/backplotter';
