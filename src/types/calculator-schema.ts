/**
 * AluCalculator — Calculator Schema Compatibility Layer
 * 
 * This file re-exports all types from calculator-schema-legacy.ts
 * to maintain backward compatibility with existing imports.
 * 
 * New code should import from:
 * - @/types/calculator-schema-v2 (for new V2 types)
 * - @/types/engineering (for ValidatedEngineeringValue, etc.)
 */

export * from './calculator-schema-legacy';
