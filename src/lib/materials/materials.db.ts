/**
 * 🏛️ ALUCALCULATOR MATERIAL SYSTEM
 * "The Periodic Table"
 */

export interface Material {
    id: string;
    name: string;
    density: number; // g/cm3
    yieldStrength: number; // MPa
    tensileStrength: number; // MPa
    elasticModulus: number; // GPa
    standard: string;
}

const DB: Material[] = [
    {
        id: "alu-6061-t6",
        name: "Aluminum 6061-T6",
        density: 2.7,
        yieldStrength: 276,
        tensileStrength: 310,
        elasticModulus: 68.9,
        standard: "ASTM B209"
    },
    {
        id: "steel-1045",
        name: "AISI 1045 Steel",
        density: 7.85,
        yieldStrength: 310,
        tensileStrength: 565,
        elasticModulus: 200,
        standard: "AISI 1045"
    },
    {
        id: "ss-304",
        name: "Stainless Steel 304",
        density: 8.0,
        yieldStrength: 215,
        tensileStrength: 505,
        elasticModulus: 193,
        standard: "ASTM A240"
    }
];

export class MaterialDB {
    static get(id: string): Material | undefined {
        return DB.find(m => m.id === id);
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
