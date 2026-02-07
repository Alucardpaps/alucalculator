/**
 * AluCalculator - Unit Tests
 * Ensures engineering accuracy and input validation
 */

import { AluminumCalculator, validateInput, CalculatorUtils } from '../src/lib/calculation-engine';

describe('Input Validation', () => {
    test('rejects non-numeric input', () => {
        expect(() => validateInput('abc')).toThrow('Must be a number');
    });

    test('rejects NaN', () => {
        expect(() => validateInput(NaN)).toThrow('Must be a number');
    });

    test('rejects negative values with positive min', () => {
        expect(() => validateInput(-5, { min: 0.001 })).toThrow('Must be greater than');
    });

    test('rejects values exceeding max', () => {
        expect(() => validateInput(150000, { max: 100000 })).toThrow('Exceeds maximum limit');
    });

    test('accepts valid input', () => {
        expect(validateInput(100)).toBe(100);
    });
});

describe('AluminumCalculator - Alloy Selection', () => {
    test('defaults to 6061 when invalid alloy specified', () => {
        const calc = new AluminumCalculator('INVALID');
        expect(calc.getAlloy().id).toBe('6061');
    });

    test('correctly sets 7075 alloy', () => {
        const calc = new AluminumCalculator('7075');
        expect(calc.getAlloy().density).toBe(2.81);
    });

    test('getAlloys returns array of alloys', () => {
        const alloys = AluminumCalculator.getAlloys();
        expect(Array.isArray(alloys)).toBe(true);
        expect(alloys.length).toBeGreaterThan(0);
    });
});

describe('AluminumCalculator - Plate Calculations', () => {
    const calc = new AluminumCalculator('6061'); // Density 2.70 g/cm³

    test('standard plate calculation (100x100x10mm)', () => {
        const result = calc.calculatePlate(100, 100, 10);
        // Volume: 100*100*10 = 100,000 mm³ = 100 cm³
        // Weight: 100 * 2.70 / 1000 = 0.27 kg
        expect(result.success).toBe(true);
        expect(result.unitWeightKg).toBeCloseTo(0.27, 2);
    });

    test('returns quantity calculations', () => {
        const result = calc.calculatePlate(100, 100, 10, 5);
        expect(result.totalWeightKg).toBeCloseTo(1.35, 2);
        expect(result.quantity).toBe(5);
    });

    test('handles negative input gracefully', () => {
        const result = calc.calculatePlate(-10, 100, 10);
        expect(result.success).toBe(false);
        expect(result.error).toContain('Must be greater than');
    });
});

describe('AluminumCalculator - Aerospace Alloy Accuracy', () => {
    test('7075-T6 density calculation (100x100x10mm)', () => {
        const calc = new AluminumCalculator('7075'); // Density 2.81 g/cm³
        const result = calc.calculatePlate(100, 100, 10);
        // Weight: 100 * 2.81 / 1000 = 0.281 kg
        expect(result.unitWeightKg).toBeCloseTo(0.281, 3);
    });

    test('5083 marine alloy calculation', () => {
        const calc = new AluminumCalculator('5083'); // Density 2.65 g/cm³
        const result = calc.calculatePlate(100, 100, 10);
        expect(result.unitWeightKg).toBeCloseTo(0.265, 3);
    });

    test('density difference: 5083 vs 7075', () => {
        const calc5083 = new AluminumCalculator('5083');
        const calc7075 = new AluminumCalculator('7075');

        const result5083 = calc5083.calculatePlate(1000, 1000, 10);
        const result7075 = calc7075.calculatePlate(1000, 1000, 10);

        // 7075 should be ~6% heavier than 5083
        const difference = (result7075.unitWeightKg - result5083.unitWeightKg) / result5083.unitWeightKg * 100;
        expect(difference).toBeCloseTo(6.04, 1);
    });
});

describe('AluminumCalculator - Round Bar', () => {
    const calc = new AluminumCalculator('6061');

    test('round bar calculation (Ø50 x 1000mm)', () => {
        const result = calc.calculateRoundBar(50, 1000);
        // Volume: π * 25² * 1000 = 1,963,495 mm³ = 1963.5 cm³
        // Weight: 1963.5 * 2.70 / 1000 = 5.30 kg
        expect(result.success).toBe(true);
        expect(result.unitWeightKg).toBeCloseTo(5.30, 1);
    });
});

describe('AluminumCalculator - Tube', () => {
    const calc = new AluminumCalculator('6061');

    test('tube calculation (OD100 x WT5 x L1000mm)', () => {
        const result = calc.calculateTube(100, 5, 1000);
        expect(result.success).toBe(true);
        expect(result.dimensions.innerDiameter).toBe(90);
    });

    test('rejects wall thickness greater than radius', () => {
        const result = calc.calculateTube(100, 60, 1000);
        expect(result.success).toBe(false);
    });
});

describe('AluminumCalculator - Cost Calculation', () => {
    const calc = new AluminumCalculator('7075'); // price_index: 1.8

    test('applies price index correctly', () => {
        const result = calc.calculateCost(10, 5); // 10kg at $5/kg base
        expect(result.adjustedPricePerKg).toBe(9); // 5 * 1.8
        expect(result.totalCost).toBe(90); // 10 * 9
    });
});

describe('AluminumCalculator - Kerf Loss', () => {
    const calc = new AluminumCalculator('6061');

    test('calculates fiber laser kerf loss', () => {
        const result = calc.calculateGrossWeight(10, 'laser_fiber', 5000, 6);
        expect(result.success).toBe(true);
        expect(result.kerfMm).toBe(0.20);
        expect(result.grossWeightKg).toBeGreaterThan(result.netWeightKg);
    });

    test('rejects unknown cutting method', () => {
        const result = calc.calculateGrossWeight(10, 'unknown_method', 5000, 6);
        expect(result.success).toBe(false);
    });
});

describe('AluminumCalculator - Stock Nesting', () => {
    const calc = new AluminumCalculator();

    test('calculates parts per 6m stock', () => {
        const result = calc.estimateStockUsage(500, 6000, 3);
        // 6000 / (500 + 3) = 11.93 → 11 parts
        expect(result.partsPerStock).toBe(11);
    });

    test('calculates waste correctly', () => {
        const result = calc.estimateStockUsage(500, 6000, 3);
        // Used: 11 * 503 = 5533mm, Waste: 6000 - 5533 = 467mm
        expect(result.wasteMm).toBeCloseTo(467, 0);
    });
});

describe('AluminumCalculator - Thermal Expansion', () => {
    const calc = new AluminumCalculator('6061'); // thermal_expansion: 23.6

    test('calculates thermal expansion for 1m @ ΔT50°C', () => {
        const result = calc.calculateThermalExpansion(1000, 50);
        // ΔL = 1000 * 23.6e-6 * 50 = 1.18mm
        expect(result.deltaLengthMm).toBeCloseTo(1.18, 2);
    });

    test('handles negative temperature change (contraction)', () => {
        const result = calc.calculateThermalExpansion(1000, -50);
        expect(result.deltaLengthMm).toBeLessThan(0);
        expect(result.finalLengthMm).toBeLessThan(1000);
    });
});

describe('CalculatorUtils', () => {
    test('getCuttingMethods returns array', () => {
        const methods = CalculatorUtils.getCuttingMethods();
        expect(Array.isArray(methods)).toBe(true);
        expect(methods.find(m => m.id === 'laser_fiber')).toBeDefined();
    });

    test('getKerf returns correct value for thickness', () => {
        const kerf = CalculatorUtils.getKerf('laser_fiber', 4);
        expect(kerf).toBe(0.20); // 3-6mm range
    });

    test('getStandardStockLengths returns array', () => {
        const lengths = CalculatorUtils.getStandardStockLengths();
        expect(lengths).toContain(6000);
    });
});
