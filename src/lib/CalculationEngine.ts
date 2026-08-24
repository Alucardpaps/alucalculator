/**
 * AluCalculator - TypeScript Calculation Engine
 * Machine Engineer's Handbook Edition
 * 
 * Integrates with existing materialsData.ts
 */

import { MATERIALS_DB, MaterialProp, getMaterial } from '@/data/materialsData';

// ============================================
// Kerf Tables (Inline TypeScript Data)
// ============================================

interface CuttingMethod {
    name: string;
    default_kerf_mm: number;
    thickness_adjustments: Record<string, number>;
    notes: string;
}

interface NestingEfficiency {
    efficiency: number;
    scrap_factor: number;
}

interface KerfTables {
    cutting_methods: Record<string, CuttingMethod>;
    nesting_efficiency: Record<string, NestingEfficiency>;
    standard_stock_lengths_mm: number[];
}

const kerfTables: KerfTables = {
    cutting_methods: {
        laser_fiber: {
            name: "Fiber Laser",
            default_kerf_mm: 0.20,
            thickness_adjustments: { "1-3mm": 0.15, "3-6mm": 0.20, "6-12mm": 0.30, "12-25mm": 0.40 },
            notes: "Fastest for thin sheets. Limited to ~25mm aluminum."
        },
        laser_co2: {
            name: "CO2 Laser",
            default_kerf_mm: 0.35,
            thickness_adjustments: { "1-3mm": 0.25, "3-6mm": 0.35, "6-12mm": 0.50 },
            notes: "Legacy technology. Higher operating cost than fiber."
        },
        plasma_standard: {
            name: "Standard Plasma",
            default_kerf_mm: 2.50,
            thickness_adjustments: { "3-6mm": 2.00, "6-12mm": 2.50, "12-25mm": 3.00, "25-50mm": 4.00 },
            notes: "Cost-effective for thick plates. Rougher edge."
        },
        plasma_hd: {
            name: "High Definition Plasma",
            default_kerf_mm: 1.50,
            thickness_adjustments: { "3-6mm": 1.20, "6-12mm": 1.50, "12-25mm": 2.00, "25-50mm": 2.50 },
            notes: "Better edge quality than standard plasma."
        },
        waterjet: {
            name: "Waterjet",
            default_kerf_mm: 1.00,
            thickness_adjustments: { "1-6mm": 0.80, "6-25mm": 1.00, "25-100mm": 1.20, "100-200mm": 1.50 },
            notes: "No heat-affected zone. Any thickness. Slowest cutting speed."
        },
        saw_band: {
            name: "Band Saw",
            default_kerf_mm: 3.00,
            thickness_adjustments: { all: 3.00 },
            notes: "Straight cuts only. Best for bar stock."
        },
        saw_circular: {
            name: "Circular Saw",
            default_kerf_mm: 4.00,
            thickness_adjustments: { all: 4.00 },
            notes: "Fast straight cuts. Higher kerf than band saw."
        },
        shear: {
            name: "Shear (Guillotine)",
            default_kerf_mm: 0.00,
            thickness_adjustments: { all: 0.00 },
            notes: "Zero kerf. Straight cuts only. Limited to ~6mm."
        }
    },
    nesting_efficiency: {
        rectangular_simple: { efficiency: 0.90, scrap_factor: 1.11 },
        rectangular_complex: { efficiency: 0.82, scrap_factor: 1.22 },
        circular_parts: { efficiency: 0.70, scrap_factor: 1.43 },
        irregular_shapes: { efficiency: 0.65, scrap_factor: 1.54 }
    },
    standard_stock_lengths_mm: [3000, 4000, 6000, 12000]
};

// ============================================
// Input Validation
// ============================================

export interface ValidationOptions {
    min?: number;
    max?: number;
    name?: string;
}

export class ValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ValidationError';
    }
}

export function validateInput(value: number, options: ValidationOptions = {}): number {
    const { min = 0.001, max = 100000, name = 'Value' } = options;

    if (typeof value !== 'number' || isNaN(value)) {
        throw new ValidationError(`Invalid ${name}: Must be a number.`);
    }
    if (value <= 0 && min > 0) {
        throw new ValidationError(`Invalid ${name}: Must be positive.`);
    }
    if (value > max) {
        throw new ValidationError(`Invalid ${name}: Exceeds maximum limit (${max}).`);
    }
    return value;
}

// ============================================
// Types
// ============================================

export interface CalculationResult {
    success: boolean;
    unitWeightKg?: number;
    totalWeightKg?: number;
    volumeCm3?: number;
    surfaceAreaCm2?: number;
    material?: string;
    density?: number;
    dimensions?: Record<string, number>;
    quantity?: number;
    error?: string;
}

export interface CostResult {
    weightKg: number;
    pricePerKg: number;
    totalCost: number;
    currency: string;
}

export interface KerfResult {
    success: boolean;
    netWeightKg?: number;
    kerfWeightKg?: number;
    grossWeightKg?: number;
    kerfMm?: number;
    cuttingMethod?: string;
    lossPercentage?: number;
    error?: string;
}

export interface NestingResult {
    success: boolean;
    partsPerStock?: number;
    wasteMm?: number;
    efficiency?: number;
    stockLengthMm?: number;
    partLengthMm?: number;
    kerfMm?: number;
    error?: string;
}

export interface ThermalResult {
    success: boolean;
    originalLengthMm?: number;
    deltaT?: number;
    thermalCoefficient?: number;
    deltaLengthMm?: number;
    finalLengthMm?: number;
    material?: string;
    error?: string;
}

// ============================================
// Calculation Engine Class
// ============================================

export class CalculationEngine {
    private material: MaterialProp;

    constructor(materialName: string = '6061-T6 (US Standard)') {
        this.material = this.findMaterial(materialName);
    }

    private findMaterial(name: string): MaterialProp {
        const found = getMaterial(name);
        if (!found) {
            const fallback = MATERIALS_DB.find(m => m.name.includes('6061'));
            if (!fallback) throw new Error('No materials in database');
            console.warn(`Material "${name}" not found. Defaulting to ${fallback.name}`);
            return fallback;
        }
        return found;
    }

    setMaterial(name: string): this {
        this.material = this.findMaterial(name);
        return this;
    }

    getMaterial(): MaterialProp {
        return this.material;
    }

    static getAluminumAlloys(): MaterialProp[] {
        return MATERIALS_DB.filter(m => m.category === 'Aluminum');
    }

    static getAllMaterials(): MaterialProp[] {
        return MATERIALS_DB;
    }

    // ----------------------------------------
    // Shape Calculations
    // ----------------------------------------

    calculatePlate(length: number, width: number, thickness: number, quantity = 1): CalculationResult {
        try {
            const L = validateInput(length, { name: 'Length', max: 20000 });
            const W = validateInput(width, { name: 'Width', max: 10000 });
            const T = validateInput(thickness, { name: 'Thickness', max: 500 });
            const Q = validateInput(quantity, { name: 'Quantity', min: 0, max: 100000 });

            const volumeMm3 = L * W * T;
            const volumeCm3 = volumeMm3 / 1000;
            const weightKg = (volumeCm3 * this.material.density) / 1000;
            const surfaceAreaCm2 = 2 * ((L * W + L * T + W * T) / 100);

            return {
                success: true,
                unitWeightKg: parseFloat(weightKg.toFixed(4)),
                totalWeightKg: parseFloat((weightKg * Q).toFixed(3)),
                volumeCm3: parseFloat(volumeCm3.toFixed(2)),
                surfaceAreaCm2: parseFloat(surfaceAreaCm2.toFixed(2)),
                material: this.material.name,
                density: this.material.density,
                dimensions: { length: L, width: W, thickness: T },
                quantity: Q
            };
        } catch (error) {
            return { success: false, error: (error as Error).message };
        }
    }

    calculateRoundBar(diameter: number, length: number, quantity = 1): CalculationResult {
        try {
            const D = validateInput(diameter, { name: 'Diameter', max: 1000 });
            const L = validateInput(length, { name: 'Length', max: 20000 });
            const Q = validateInput(quantity, { name: 'Quantity', min: 0, max: 100000 });

            const radius = D / 2;
            const volumeMm3 = Math.PI * Math.pow(radius, 2) * L;
            const volumeCm3 = volumeMm3 / 1000;
            const weightKg = (volumeCm3 * this.material.density) / 1000;
            const surfaceAreaCm2 = (Math.PI * D * L + 2 * Math.PI * Math.pow(radius, 2)) / 100;

            return {
                success: true,
                unitWeightKg: parseFloat(weightKg.toFixed(4)),
                totalWeightKg: parseFloat((weightKg * Q).toFixed(3)),
                volumeCm3: parseFloat(volumeCm3.toFixed(2)),
                surfaceAreaCm2: parseFloat(surfaceAreaCm2.toFixed(2)),
                material: this.material.name,
                density: this.material.density,
                dimensions: { diameter: D, length: L },
                quantity: Q
            };
        } catch (error) {
            return { success: false, error: (error as Error).message };
        }
    }

    calculateTube(outerDiameter: number, wallThickness: number, length: number, quantity = 1): CalculationResult {
        try {
            const OD = validateInput(outerDiameter, { name: 'Outer Diameter', max: 2000 });
            const WT = validateInput(wallThickness, { name: 'Wall Thickness', max: OD / 2 });
            const L = validateInput(length, { name: 'Length', max: 20000 });
            const Q = validateInput(quantity, { name: 'Quantity', min: 0, max: 100000 });

            const ID = OD - (2 * WT);
            const outerArea = Math.PI * Math.pow(OD / 2, 2);
            const innerArea = Math.PI * Math.pow(ID / 2, 2);
            const crossSectionArea = outerArea - innerArea;
            const volumeMm3 = crossSectionArea * L;
            const volumeCm3 = volumeMm3 / 1000;
            const weightKg = (volumeCm3 * this.material.density) / 1000;
            const surfaceAreaCm2 = (Math.PI * OD * L + Math.PI * ID * L) / 100;

            return {
                success: true,
                unitWeightKg: parseFloat(weightKg.toFixed(4)),
                totalWeightKg: parseFloat((weightKg * Q).toFixed(3)),
                volumeCm3: parseFloat(volumeCm3.toFixed(2)),
                surfaceAreaCm2: parseFloat(surfaceAreaCm2.toFixed(2)),
                material: this.material.name,
                density: this.material.density,
                dimensions: { outerDiameter: OD, innerDiameter: ID, wallThickness: WT, length: L },
                quantity: Q
            };
        } catch (error) {
            return { success: false, error: (error as Error).message };
        }
    }

    calculateHollowRect(
        width: number,
        height: number,
        wallThickness: number,
        length: number,
        quantity = 1
    ): CalculationResult {
        try {
            const W = validateInput(width, { name: 'Width', max: 2000 });
            const H = validateInput(height, { name: 'Height', max: 2000 });
            const WT = validateInput(wallThickness, { name: 'Wall Thickness', max: Math.min(W, H) / 2 });
            const L = validateInput(length, { name: 'Length', max: 20000 });
            const Q = validateInput(quantity, { name: 'Quantity', min: 0, max: 100000 });

            const outerArea = W * H;
            const innerW = W - (2 * WT);
            const innerH = H - (2 * WT);
            const innerArea = innerW * innerH;
            const crossSectionArea = outerArea - innerArea;
            const volumeMm3 = crossSectionArea * L;
            const volumeCm3 = volumeMm3 / 1000;
            const weightKg = (volumeCm3 * this.material.density) / 1000;

            return {
                success: true,
                unitWeightKg: parseFloat(weightKg.toFixed(4)),
                totalWeightKg: parseFloat((weightKg * Q).toFixed(3)),
                volumeCm3: parseFloat(volumeCm3.toFixed(2)),
                material: this.material.name,
                density: this.material.density,
                dimensions: { width: W, height: H, wallThickness: WT, length: L },
                quantity: Q
            };
        } catch (error) {
            return { success: false, error: (error as Error).message };
        }
    }

    // ----------------------------------------
    // Cost Calculation
    // ----------------------------------------

    calculateCost(weightKg: number, pricePerKg: number, currency = 'USD'): CostResult {
        const totalCost = weightKg * pricePerKg;
        return {
            weightKg: parseFloat(weightKg.toFixed(3)),
            pricePerKg,
            totalCost: parseFloat(totalCost.toFixed(2)),
            currency
        };
    }

    // ----------------------------------------
    // Kerf Loss Calculation
    // ----------------------------------------

    calculateKerfLoss(
        netWeightKg: number,
        cuttingMethod: string,
        cutLengthMm: number,
        thicknessMm: number
    ): KerfResult {
        const method = kerfTables.cutting_methods[cuttingMethod];
        if (!method) {
            return { success: false, error: `Unknown cutting method: ${cuttingMethod}` };
        }

        const kerfMm = method.default_kerf_mm;
        const kerfVolumeMm3 = kerfMm * thicknessMm * cutLengthMm;
        const kerfVolumeCm3 = kerfVolumeMm3 / 1000;
        const kerfWeightKg = (kerfVolumeCm3 * this.material.density) / 1000;
        const grossWeightKg = netWeightKg + kerfWeightKg;

        return {
            success: true,
            netWeightKg: parseFloat(netWeightKg.toFixed(3)),
            kerfWeightKg: parseFloat(kerfWeightKg.toFixed(4)),
            grossWeightKg: parseFloat(grossWeightKg.toFixed(3)),
            kerfMm,
            cuttingMethod: method.name,
            lossPercentage: parseFloat(((kerfWeightKg / netWeightKg) * 100).toFixed(2))
        };
    }

    // ----------------------------------------
    // Stock Nesting
    // ----------------------------------------

    estimateStockUsage(partLengthMm: number, stockLengthMm = 6000, kerfMm = 3): NestingResult {
        try {
            const partTotal = partLengthMm + kerfMm;
            const partsPerStock = Math.floor(stockLengthMm / partTotal);
            const usedLength = partsPerStock * partTotal;
            const wasteMm = stockLengthMm - usedLength;
            const efficiency = (partsPerStock * partLengthMm) / stockLengthMm * 100;

            return {
                success: true,
                partsPerStock,
                wasteMm: parseFloat(wasteMm.toFixed(1)),
                efficiency: parseFloat(efficiency.toFixed(1)),
                stockLengthMm,
                partLengthMm,
                kerfMm
            };
        } catch (error) {
            return { success: false, error: (error as Error).message };
        }
    }

    // ----------------------------------------
    // ----------------------------------------
    // Thermal Expansion
    // ----------------------------------------

    calculateThermalExpansion(length: number, deltaT: number): ThermalResult {
        try {
            const L = validateInput(length, { name: 'Length', max: 100000 });
            const dT = validateInput(deltaT, { name: 'Delta T', min: -500, max: 2000 });

            // Alpha (thermal expansion coefficient) in microstrain/C (1e-6)
            // materialsDB has thermalExp prop
            const alpha = this.material.thermalExp || 12; // Default to steel if missing
            const deltaL = (alpha * 1e-6) * L * dT;
            const finalL = L + deltaL;

            return {
                success: true,
                originalLengthMm: L,
                deltaT: dT,
                thermalCoefficient: alpha,
                deltaLengthMm: parseFloat(deltaL.toFixed(4)),
                finalLengthMm: parseFloat(finalL.toFixed(4)),
                material: this.material.name
            };
        } catch (error) {
            return { success: false, error: (error as Error).message };
        }
    }
    // Sheet Metal Bending (Deterministic)
    // ----------------------------------------

    calculateSheetMetalBend(
        thickness: number,
        radius: number,
        angleDeg: number,
        customKFactor?: number
    ): {
        success: boolean;
        bendAllowance: number;
        bendDeduction: number;
        outsideSetback: number;
        kFactor: number;
        warnings: string[];
        error?: string;
    } {
        try {
            const t = validateInput(thickness, { name: 'Thickness', max: 50 });
            const R = validateInput(radius, { name: 'Radius', max: 500 });
            const A = validateInput(angleDeg, { name: 'Angle', min: 0, max: 180 });

            // Dynamic K-Factor calculation if not provided
            // Based on R/t ratio as per B-Model directives
            let K = customKFactor;
            if (K === undefined) {
                const ratio = R / t;
                if (ratio < 1) K = 0.33;
                else if (ratio < 1.5) K = 0.40;
                else K = 0.50;
            }

            const rads = (A * Math.PI) / 180;
            const BA = rads * (R + (K * t));
            const OSSB = (R + t) * Math.tan(rads / 2);
            const BD = (2 * OSSB) - BA;

            const warnings: string[] = [];
            if (R < t) {
                warnings.push("CRR_RISK: Inner radius is less than thickness. Cracking risk detected.");
            }

            return {
                success: true,
                bendAllowance: parseFloat(BA.toFixed(4)),
                bendDeduction: parseFloat(BD.toFixed(4)),
                outsideSetback: parseFloat(OSSB.toFixed(4)),
                kFactor: K,
                warnings
            };
        } catch (error) {
            return {
                success: false,
                bendAllowance: 0,
                bendDeduction: 0,
                outsideSetback: 0,
                kFactor: 0,
                warnings: [],
                error: (error as Error).message
            };
        }
    }
}

// ============================================
// Utility Functions
// ============================================

export const CalculatorUtils = {
    getCuttingMethods(): Array<{ id: string; name: string; defaultKerf: number; notes: string }> {
        return Object.entries(kerfTables.cutting_methods).map(([id, data]) => ({
            id,
            name: data.name,
            defaultKerf: data.default_kerf_mm,
            notes: data.notes
        }));
    },

    getStandardStockLengths(): number[] {
        return kerfTables.standard_stock_lengths_mm;
    },

    getNestingFactors(): typeof kerfTables.nesting_efficiency {
        return kerfTables.nesting_efficiency;
    },

    getKerf(methodId: string, thicknessMm: number): number | null {
        const method = kerfTables.cutting_methods[methodId];
        if (!method) return null;

        const adjustments = method.thickness_adjustments;
        for (const [range, kerf] of Object.entries(adjustments)) {
            if (range === 'all') return kerf;
            const match = range.match(/(\d+)-(\d+)/);
            if (match) {
                const min = parseInt(match[1], 10);
                const max = parseInt(match[2], 10);
                if (thicknessMm >= min && thicknessMm <= max) return kerf;
            }
        }
        return method.default_kerf_mm;
    }
};

export default CalculationEngine;
