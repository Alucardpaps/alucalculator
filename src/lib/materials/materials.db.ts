/**
 * 🏛️ ALUCALCULATOR MATERIAL SYSTEM
 * Delegates mechanical properties to the canonical catalog.
 */

import { CANONICAL_MATERIALS, resolveMaterial } from '@/materials/canonical';

export interface Material {
    id: string;
    name: string;
    density: number; // g/cm3
    yieldStrength: number; // MPa (typical)
    yieldStrengthMin?: number;
    tensileStrength: number; // MPa
    elasticModulus: number; // GPa
    standard: string;
}

const DB: Material[] = CANONICAL_MATERIALS.map((m) => ({
    id: m.id,
    name: m.name,
    density: m.density,
    yieldStrength: m.Sy_typical,
    yieldStrengthMin: m.Sy_min,
    tensileStrength: m.Su_typical,
    elasticModulus: m.E,
    standard: m.standard,
}));

export class MaterialDB {
    static get(id: string): Material | undefined {
        const direct = DB.find((m) => m.id === id || m.id === id.replace(/^alu-/, 'al-'));
        if (direct) return direct;
        const resolved = resolveMaterial(id);
        if (!resolved) return undefined;
        return {
            id: resolved.id,
            name: resolved.name,
            density: resolved.density,
            yieldStrength: resolved.Sy,
            yieldStrengthMin: resolved.Sy_min,
            tensileStrength: resolved.Su,
            elasticModulus: resolved.E,
            standard: resolved.standard,
        };
    }

    static getAll(): Material[] {
        return [...DB];
    }

    static calculateSafetyFactor(stressMPa: number, materialId: string): number {
        const mat = this.get(materialId);
        if (!mat) throw new Error("Material not found");
        if (stressMPa === 0) return 999;
        return mat.yieldStrength / stressMPa;
    }
}
