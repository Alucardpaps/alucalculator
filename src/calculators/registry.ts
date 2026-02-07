/**
 * AluCalc OS — Calculator Registry
 * 
 * Central registry for all schema-driven calculators.
 * This is the SINGLE SOURCE OF TRUTH for available calculators.
 */

import type { CalculatorSchema, CalculatorRegistry } from '@/types/calculator-schema';

// Import individual schemas
import { boltStressSchema } from './schemas/bolt-stress';
import { beamDeflectionSchema } from './schemas/beam-deflection';
import { fluidFlowSchema } from './schemas/fluid-flow';

// ============================================
// Registry
// ============================================

export const CALCULATOR_REGISTRY: CalculatorRegistry = {
    'bolt-stress-v1': boltStressSchema,
    'beam-deflection-v1': beamDeflectionSchema,
    'fluid-flow-v1': fluidFlowSchema,
};

// ============================================
// Registry Utilities
// ============================================

/**
 * Get all available calculators
 */
export function getAllCalculators(): CalculatorSchema[] {
    return Object.values(CALCULATOR_REGISTRY);
}

/**
 * Get calculator by ID
 */
export function getCalculatorById(id: string): CalculatorSchema | undefined {
    return CALCULATOR_REGISTRY[id];
}

/**
 * Get calculators by domain
 */
export function getCalculatorsByDomain(domain: CalculatorSchema['domain']): CalculatorSchema[] {
    return Object.values(CALCULATOR_REGISTRY).filter(calc => calc.domain === domain);
}

/**
 * Get calculators by tier
 */
export function getCalculatorsByTier(tier: 'free' | 'pro' | 'enterprise'): CalculatorSchema[] {
    return Object.values(CALCULATOR_REGISTRY).filter(calc => calc.tier === tier);
}

/**
 * Search calculators by tag
 */
export function searchCalculators(query: string): CalculatorSchema[] {
    const lowerQuery = query.toLowerCase();
    return Object.values(CALCULATOR_REGISTRY).filter(calc => {
        // Search in title
        if (calc.metadata.title.toLowerCase().includes(lowerQuery)) return true;
        // Search in description
        if (calc.metadata.description.toLowerCase().includes(lowerQuery)) return true;
        // Search in tags
        if (calc.metadata.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))) return true;
        return false;
    });
}

/**
 * Get domain display info
 */
export const DOMAIN_INFO: Record<CalculatorSchema['domain'], { label: string; color: string; icon: string }> = {
    mechanical: { label: 'Mechanical', color: '#00e5ff', icon: 'Wrench' },
    civil: { label: 'Civil / Structural', color: '#ff9800', icon: 'Building' },
    fluid: { label: 'Fluid Mechanics', color: '#2196f3', icon: 'Droplets' },
    electrical: { label: 'Electrical', color: '#ffeb3b', icon: 'Zap' },
    thermal: { label: 'Thermal', color: '#f44336', icon: 'Flame' },
};

// ============================================
// Type Exports
// ============================================

export type { CalculatorSchema, CalculatorRegistry };
export { boltStressSchema, beamDeflectionSchema, fluidFlowSchema };
