/**
 * AluCalculator V2 — Unified Strength Verification Service
 * 
 * Provides central strength checking for all calculators.
 * Uses material library for yield/tensile values.
 */

import { MaterialProp, MATERIALS_DB } from '@/data/materialsData';
import { BOLT_PROPERTY_CLASSES, BoltPropertyClass } from '@/data/boltNutStandards';

// ============================================
// TYPES
// ============================================

export type LoadType = 'tensile' | 'compression' | 'shear' | 'bending' | 'torsion' | 'combined';
export type DesignCode = 'DIN' | 'AISC' | 'EUROCODE' | 'AS' | 'GENERAL';

export interface StrengthCheckInput {
    loadType: LoadType;
    appliedLoad: number; // N or N·mm for moments
    sectionArea?: number; // mm² (for axial/shear)
    sectionModulus?: number; // mm³ (for bending)
    polarModulus?: number; // mm³ (for torsion)
    material?: MaterialProp;
    boltClass?: string; // ISO 898-1 class like "8.8", "10.9"
    designCode?: DesignCode;
    safetyFactor?: number;
    weldEfficiency?: number; // 0.7-1.0 for welded joints
}

export interface StrengthCheckResult {
    stress: number; // MPa
    allowableStress: number; // MPa
    safetyFactor: number;
    utilization: number; // %
    status: 'SAFE' | 'MARGINAL' | 'UNSAFE';
    statusColor: string;
    warnings: string[];
    formula: string; // LaTeX
    standard?: string;
}

// ============================================
// DESIGN SAFETY FACTORS BY CODE
// ============================================

const DESIGN_FACTORS: Record<DesignCode, Record<LoadType, number>> = {
    DIN: { tensile: 1.5, compression: 1.5, shear: 1.73, bending: 1.5, torsion: 1.73, combined: 2.0 },
    AISC: { tensile: 1.67, compression: 1.67, shear: 1.5, bending: 1.67, torsion: 1.67, combined: 2.0 },
    EUROCODE: { tensile: 1.25, compression: 1.25, shear: 1.25, bending: 1.25, torsion: 1.25, combined: 1.5 },
    AS: { tensile: 1.5, compression: 1.5, shear: 1.5, bending: 1.5, torsion: 1.5, combined: 1.8 },
    GENERAL: { tensile: 2.0, compression: 2.0, shear: 2.5, bending: 2.0, torsion: 2.5, combined: 3.0 },
};

// ============================================
// MAIN VERIFICATION FUNCTION
// ============================================

export function verifyStrength(input: StrengthCheckInput): StrengthCheckResult {
    const warnings: string[] = [];
    let yieldStrength = 0;
    let sourceStandard = '';

    // Get yield strength from material or bolt class
    if (input.boltClass) {
        const boltData = BOLT_PROPERTY_CLASSES.find(b => b.class === input.boltClass);
        if (boltData) {
            yieldStrength = boltData.yieldStrengthMin;
            sourceStandard = `ISO 898-1 Class ${input.boltClass}`;
        } else {
            warnings.push(`Unknown bolt class: ${input.boltClass}`);
        }
    } else if (input.material) {
        yieldStrength = input.material.yield;
        sourceStandard = `${input.material.category}: ${input.material.name}`;
    } else {
        warnings.push('No material or bolt class specified. Using default 250 MPa yield.');
        yieldStrength = 250;
    }

    // Calculate stress based on load type
    let stress = 0;
    let formula = '';

    switch (input.loadType) {
        case 'tensile':
        case 'compression':
            if (!input.sectionArea) {
                warnings.push('Section area not specified');
                stress = 0;
            } else {
                stress = input.appliedLoad / input.sectionArea;
                formula = `\\sigma = \\frac{F}{A} = \\frac{${input.appliedLoad.toFixed(0)}}{${input.sectionArea.toFixed(1)}}`;
            }
            break;

        case 'shear':
            if (!input.sectionArea) {
                warnings.push('Section area not specified');
            } else {
                stress = input.appliedLoad / input.sectionArea;
                // Shear allowable is typically 0.577 * yield (von Mises)
                yieldStrength = yieldStrength * 0.577;
                formula = `\\tau = \\frac{V}{A} = \\frac{${input.appliedLoad.toFixed(0)}}{${input.sectionArea.toFixed(1)}}`;
            }
            break;

        case 'bending':
            if (!input.sectionModulus) {
                warnings.push('Section modulus not specified');
            } else {
                stress = input.appliedLoad / input.sectionModulus;
                formula = `\\sigma_b = \\frac{M}{W} = \\frac{${input.appliedLoad.toFixed(0)}}{${input.sectionModulus.toFixed(1)}}`;
            }
            break;

        case 'torsion':
            if (!input.polarModulus) {
                warnings.push('Polar modulus not specified');
            } else {
                stress = input.appliedLoad / input.polarModulus;
                yieldStrength = yieldStrength * 0.577;
                formula = `\\tau_t = \\frac{T}{W_p} = \\frac{${input.appliedLoad.toFixed(0)}}{${input.polarModulus.toFixed(1)}}`;
            }
            break;

        case 'combined':
            warnings.push('Combined stress requires von Mises calculation - use dedicated calculator');
            break;
    }

    // Get safety factor
    const designCode = input.designCode || 'GENERAL';
    const requiredSF = input.safetyFactor || DESIGN_FACTORS[designCode][input.loadType];

    // Apply weld efficiency if specified
    if (input.weldEfficiency && input.weldEfficiency < 1.0) {
        yieldStrength = yieldStrength * input.weldEfficiency;
        warnings.push(`Weld efficiency factor ${input.weldEfficiency} applied`);
    }

    // Calculate results
    const allowable = yieldStrength / requiredSF;
    const actualSF = stress > 0 ? yieldStrength / stress : Infinity;
    const utilization = (stress / allowable) * 100;

    // Determine status
    let status: StrengthCheckResult['status'];
    let statusColor: string;

    if (actualSF >= requiredSF * 1.25) {
        status = 'SAFE';
        statusColor = '#4caf50';
    } else if (actualSF >= requiredSF) {
        status = 'MARGINAL';
        statusColor = '#ff9800';
        warnings.push('Design meets minimum requirements but has limited margin');
    } else {
        status = 'UNSAFE';
        statusColor = '#f44336';
        warnings.push(`Safety factor ${actualSF.toFixed(2)} < required ${requiredSF.toFixed(2)}`);
    }

    return {
        stress: Math.round(stress * 100) / 100,
        allowableStress: Math.round(allowable * 100) / 100,
        safetyFactor: Math.round(actualSF * 100) / 100,
        utilization: Math.round(utilization * 10) / 10,
        status,
        statusColor,
        warnings,
        formula,
        standard: sourceStandard,
    };
}

// ============================================
// QUICK CHECK FUNCTIONS
// ============================================

export function quickBoltCheck(
    boltClass: string,
    axialLoad: number, // N
    stressArea: number // mm²
): StrengthCheckResult {
    return verifyStrength({
        loadType: 'tensile',
        appliedLoad: axialLoad,
        sectionArea: stressArea,
        boltClass,
        safetyFactor: 2.5,
    });
}

export function quickBeamCheck(
    materialName: string,
    bendingMoment: number, // N·mm
    sectionModulus: number // mm³
): StrengthCheckResult {
    const material = MATERIALS_DB.find(m => m.name === materialName);
    return verifyStrength({
        loadType: 'bending',
        appliedLoad: bendingMoment,
        sectionModulus,
        material,
        designCode: 'EUROCODE',
    });
}

export function quickWeldCheck(
    materialName: string,
    force: number, // N
    throatArea: number, // mm²
    efficiency: number = 0.7
): StrengthCheckResult {
    const material = MATERIALS_DB.find(m => m.name === materialName);
    return verifyStrength({
        loadType: 'shear',
        appliedLoad: force,
        sectionArea: throatArea,
        material,
        weldEfficiency: efficiency,
        safetyFactor: 3.0,
    });
}

// ============================================
// MATERIAL LOOKUP HELPERS
// ============================================

export function getMaterialYield(name: string): number {
    const mat = MATERIALS_DB.find(m => m.name === name);
    return mat?.yield || 0;
}

export function getBoltYield(boltClass: string): number {
    const bolt = BOLT_PROPERTY_CLASSES.find(b => b.class === boltClass);
    return bolt?.yieldStrengthMin || 0;
}

export function recommendSafetyFactor(application: string): number {
    const factors: Record<string, number> = {
        'static-known': 1.5,
        'static-estimated': 2.0,
        'dynamic-known': 2.5,
        'dynamic-estimated': 3.0,
        'impact': 4.0,
        'human-safety': 5.0,
    };
    return factors[application] || 2.0;
}
