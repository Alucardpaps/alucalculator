/**
 * AluCalculator - Modular Calculation Engine
 * Machine Engineer's Handbook Edition
 * 
 * Features:
 * - Alloy-specific density calculations
 * - Input validation and sanitization
 * - Cost estimation with price index
 * - Kerf loss calculation
 * - Stock nesting optimization
 * - Thermal expansion calculation
 */

import alloys from '../../data/aluminum_alloys.json';
import kerfTables from '../../data/kerf_tables.json';

/**
 * Input validation with engineering limits
 */
export function validateInput(value, options = {}) {
    const { min = 0.001, max = 100000, name = 'Value' } = options;

    if (typeof value !== 'number' || isNaN(value)) {
        throw new Error(`Invalid ${name}: Must be a number.`);
    }
    if (value <= min && min > 0) {
        throw new Error(`Invalid ${name}: Must be greater than ${min}.`);
    }
    if (value > max) {
        throw new Error(`Invalid ${name}: Exceeds maximum limit (${max}).`);
    }
    return value;
}

/**
 * Main Calculator Class
 */
export class AluminumCalculator {
    constructor(alloyId = '6061') {
        this.setAlloy(alloyId);
    }

    /**
     * Set active alloy by ID
     */
    setAlloy(alloyId) {
        const found = alloys.find(a => a.id === alloyId);
        if (!found) {
            console.warn(`Alloy ${alloyId} not found. Defaulting to 6061.`);
            this.selectedAlloy = alloys.find(a => a.id === '6061');
        } else {
            this.selectedAlloy = found;
        }
        return this;
    }

    /**
     * Get current alloy data
     */
    getAlloy() {
        return this.selectedAlloy;
    }

    /**
     * Get all available alloys
     */
    static getAlloys() {
        return alloys;
    }

    /**
     * Calculate Plate/Sheet Weight
     * @param {number} length - Length in mm
     * @param {number} width - Width in mm
     * @param {number} thickness - Thickness in mm
     * @param {number} quantity - Number of pieces
     * @returns {object} Calculation result
     */
    calculatePlate(length, width, thickness, quantity = 1) {
        try {
            const L = validateInput(length, { name: 'Length', max: 20000 });
            const W = validateInput(width, { name: 'Width', max: 10000 });
            const T = validateInput(thickness, { name: 'Thickness', max: 500 });
            const Q = validateInput(quantity, { name: 'Quantity', min: 0, max: 100000 });

            const volumeMm3 = L * W * T;
            const volumeCm3 = volumeMm3 / 1000;
            const weightKg = (volumeCm3 * this.selectedAlloy.density) / 1000;
            const totalWeightKg = weightKg * Q;

            return {
                success: true,
                unitWeightKg: parseFloat(weightKg.toFixed(4)),
                totalWeightKg: parseFloat(totalWeightKg.toFixed(3)),
                volumeCm3: parseFloat(volumeCm3.toFixed(2)),
                alloy: this.selectedAlloy.name,
                density: this.selectedAlloy.density,
                dimensions: { length: L, width: W, thickness: T },
                quantity: Q
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Calculate Round Bar Weight
     * @param {number} diameter - Diameter in mm
     * @param {number} length - Length in mm
     * @param {number} quantity - Number of pieces
     */
    calculateRoundBar(diameter, length, quantity = 1) {
        try {
            const D = validateInput(diameter, { name: 'Diameter', max: 1000 });
            const L = validateInput(length, { name: 'Length', max: 20000 });
            const Q = validateInput(quantity, { name: 'Quantity', min: 0, max: 100000 });

            const radius = D / 2;
            const volumeMm3 = Math.PI * Math.pow(radius, 2) * L;
            const volumeCm3 = volumeMm3 / 1000;
            const weightKg = (volumeCm3 * this.selectedAlloy.density) / 1000;
            const totalWeightKg = weightKg * Q;

            return {
                success: true,
                unitWeightKg: parseFloat(weightKg.toFixed(4)),
                totalWeightKg: parseFloat(totalWeightKg.toFixed(3)),
                volumeCm3: parseFloat(volumeCm3.toFixed(2)),
                alloy: this.selectedAlloy.name,
                density: this.selectedAlloy.density,
                dimensions: { diameter: D, length: L },
                quantity: Q
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Calculate Tube/Pipe Weight
     * @param {number} outerDiameter - OD in mm
     * @param {number} wallThickness - Wall thickness in mm
     * @param {number} length - Length in mm
     * @param {number} quantity - Number of pieces
     */
    calculateTube(outerDiameter, wallThickness, length, quantity = 1) {
        try {
            const OD = validateInput(outerDiameter, { name: 'Outer Diameter', max: 2000 });
            const WT = validateInput(wallThickness, { name: 'Wall Thickness', max: OD / 2 });
            const L = validateInput(length, { name: 'Length', max: 20000 });
            const Q = validateInput(quantity, { name: 'Quantity', min: 0, max: 100000 });

            const innerDiameter = OD - (2 * WT);
            const outerArea = Math.PI * Math.pow(OD / 2, 2);
            const innerArea = Math.PI * Math.pow(innerDiameter / 2, 2);
            const crossSectionArea = outerArea - innerArea;
            const volumeMm3 = crossSectionArea * L;
            const volumeCm3 = volumeMm3 / 1000;
            const weightKg = (volumeCm3 * this.selectedAlloy.density) / 1000;
            const totalWeightKg = weightKg * Q;

            return {
                success: true,
                unitWeightKg: parseFloat(weightKg.toFixed(4)),
                totalWeightKg: parseFloat(totalWeightKg.toFixed(3)),
                volumeCm3: parseFloat(volumeCm3.toFixed(2)),
                alloy: this.selectedAlloy.name,
                density: this.selectedAlloy.density,
                dimensions: { outerDiameter: OD, innerDiameter: innerDiameter, wallThickness: WT, length: L },
                quantity: Q
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Calculate cost based on weight and unit price
     * @param {number} weightKg - Weight in kg
     * @param {number} basePricePerKg - Base price per kg
     */
    calculateCost(weightKg, basePricePerKg) {
        const adjustedPrice = basePricePerKg * this.selectedAlloy.price_index;
        const totalCost = weightKg * adjustedPrice;

        return {
            weightKg: parseFloat(weightKg.toFixed(3)),
            basePricePerKg: basePricePerKg,
            priceIndex: this.selectedAlloy.price_index,
            adjustedPricePerKg: parseFloat(adjustedPrice.toFixed(2)),
            totalCost: parseFloat(totalCost.toFixed(2)),
            alloy: this.selectedAlloy.name
        };
    }

    /**
     * Calculate gross weight with kerf loss
     * @param {number} netWeightKg - Net weight in kg
     * @param {string} cuttingMethod - Cutting method ID
     * @param {number} cutLengthMm - Total cut length in mm
     * @param {number} thicknessMm - Material thickness in mm
     */
    calculateGrossWeight(netWeightKg, cuttingMethod, cutLengthMm, thicknessMm) {
        const method = kerfTables.cutting_methods[cuttingMethod];
        if (!method) {
            return { success: false, error: `Unknown cutting method: ${cuttingMethod}` };
        }

        const kerfMm = method.default_kerf_mm;
        const kerfVolumeMm3 = kerfMm * thicknessMm * cutLengthMm;
        const kerfVolumeCm3 = kerfVolumeMm3 / 1000;
        const kerfWeightKg = (kerfVolumeCm3 * this.selectedAlloy.density) / 1000;
        const grossWeightKg = netWeightKg + kerfWeightKg;

        return {
            success: true,
            netWeightKg: parseFloat(netWeightKg.toFixed(3)),
            kerfWeightKg: parseFloat(kerfWeightKg.toFixed(4)),
            grossWeightKg: parseFloat(grossWeightKg.toFixed(3)),
            kerfMm: kerfMm,
            cuttingMethod: method.name,
            lossPercentage: parseFloat(((kerfWeightKg / netWeightKg) * 100).toFixed(2))
        };
    }

    /**
     * Stock usage estimator (simple nesting for linear parts)
     * @param {number} partLengthMm - Part length in mm
     * @param {number} stockLengthMm - Stock length in mm (default 6000)
     * @param {number} kerfMm - Kerf width in mm
     */
    estimateStockUsage(partLengthMm, stockLengthMm = 6000, kerfMm = 3) {
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
            return { success: false, error: error.message };
        }
    }

    /**
     * Calculate thermal expansion
     * @param {number} originalLengthMm - Original length in mm
     * @param {number} deltaT - Temperature change in °C
     */
    calculateThermalExpansion(originalLengthMm, deltaT) {
        const alpha = this.selectedAlloy.thermal_expansion * 1e-6; // Convert from ×10⁻⁶
        const deltaL = originalLengthMm * alpha * deltaT;

        return {
            success: true,
            originalLengthMm,
            deltaT,
            thermalCoefficient: this.selectedAlloy.thermal_expansion,
            deltaLengthMm: parseFloat(deltaL.toFixed(4)),
            finalLengthMm: parseFloat((originalLengthMm + deltaL).toFixed(4)),
            alloy: this.selectedAlloy.name
        };
    }
}

/**
 * Static utility functions
 */
export const CalculatorUtils = {
    /**
     * Get kerf value for a cutting method and thickness
     */
    getKerf(methodId, thicknessMm) {
        const method = kerfTables.cutting_methods[methodId];
        if (!method) return null;

        // Find appropriate kerf for thickness
        const adjustments = method.thickness_adjustments;
        for (const [range, kerf] of Object.entries(adjustments)) {
            if (range === 'all') return kerf;
            const [min, max] = range.split('-').map(s => parseFloat(s.replace('mm', '')));
            if (thicknessMm >= min && thicknessMm <= max) return kerf;
        }
        return method.default_kerf_mm;
    },

    /**
     * Get all cutting methods
     */
    getCuttingMethods() {
        return Object.entries(kerfTables.cutting_methods).map(([id, data]) => ({
            id,
            name: data.name,
            defaultKerf: data.default_kerf_mm,
            notes: data.notes
        }));
    },

    /**
     * Get nesting efficiency factors
     */
    getNestingFactors() {
        return kerfTables.nesting_efficiency;
    },

    /**
     * Get standard stock lengths
     */
    getStandardStockLengths() {
        return kerfTables.standard_stock_lengths_mm;
    }
};

export default AluminumCalculator;
