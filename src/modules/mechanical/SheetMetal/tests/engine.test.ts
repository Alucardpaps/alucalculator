/**
 * modules/mechanical/SheetMetal/tests/engine.test.ts
 * 
 * Unit tests for the Sheet Metal Engine calculations and Metadata contracts.
 */

import { SheetMetalEngine, SheetMetalInput } from '../engine';

describe('SheetMetalEngine', () => {
    const defaultInput: SheetMetalInput = {
        thickness: 2.0,
        bendAngle: 90,
        innerRadius: 2.0,
        kFactor: 0.33,
        material: 'Aluminum 6061-T6'
    };

    it('calculates Bend Allowance correctly', () => {
        const { result } = SheetMetalEngine.calculate(defaultInput);

        // BA = (PI/180) * 90 * (2.0 + (0.33 * 2.0)) 
        // BA = 1.57079 * (2.0 + 0.66) 
        // BA = 1.57079 * 2.66 = 4.178
        expect(result.bendAllowance).toBeCloseTo(4.178, 3);
    });

    it('calculates Bend Deduction correctly', () => {
        const { result } = SheetMetalEngine.calculate(defaultInput);

        // OSSB = Math.tan(45 deg = 0.785 rad) * (2.0 + 2.0) = 1 * 4 = 4.0
        // BD = (2 * 4.0) - 4.178 = 8.0 - 4.178 = 3.822
        expect(result.outsideSetback).toBe(4.0);
        expect(result.bendDeduction).toBeCloseTo(3.822, 3);
    });

    it('generates standard Engine Metadata', () => {
        const { metadata } = SheetMetalEngine.calculate(defaultInput);

        expect(metadata).toBeDefined();
        expect(metadata.moduleName).toBe('SheetMetal');
        expect(metadata.engineVersion).toBe(SheetMetalEngine.VERSION);
        expect(metadata.calculationId).toMatch(/^SM-\d+$/);
        expect(metadata.validationStatus).toBe('success');
        expect(metadata.calculationHash).toBeDefined();
        expect(metadata.timestamp).toBeLessThanOrEqual(Date.now());
    });

    it('flags warnings on extreme bend angles', () => {
        const extremeInput = { ...defaultInput, bendAngle: 185 };
        const { metadata } = SheetMetalEngine.calculate(extremeInput);

        expect(metadata.validationStatus).toBe('warning');
        expect(metadata.warnings?.length).toBeGreaterThan(0);
    });
});
