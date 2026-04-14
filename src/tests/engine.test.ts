import { describe, it, expect, beforeAll } from 'vitest';
import { HeadlessEngine } from '../headless-engine/engine';
import { Evaluator } from '../headless-engine/evaluator';
import { UnitSystem } from '../headless-engine/unit-system';
import { SchemaLoader } from '../calculator-system/schema-loader';
import * as path from 'path';

describe('Evaluator', () => {
    it('safely evaluates expressions', () => {
        expect(Evaluator.evaluate('N2 / N1', { N1: 20, N2: 60 })).toBe(3);
    });
});

describe('UnitSystem', () => {
    it('supports simple engineering units', () => {
        // Testing normal scale conversions
        expect(UnitSystem.convert(1000, 'mm', 'm')).toBe(1);
    });
});

describe('Headless Engine Phase 1 & 2 Test', () => {
    
    beforeAll(() => {
        const schemasPath = path.resolve(__dirname, '../schemas');
        SchemaLoader.loadSchemas(schemasPath);
    });
    
    it('executes gear ratio calculation correctly via registry ID', () => {
        const engine = new HeadlessEngine();
        
        // Input: N1 = 20, N2 = 60, T1 = 150
        const inputs = {
            N1: 20,
            N2: 60,
            T1: 150
        };
        
        // Execute by string ID! (Dynamically loads via CalculatorRegistry mapping under-the-hood)
        const result = engine.execute('gear_ratio', inputs);
        
        expect(result.success).toBe(true);
        // Expected result: output torque = 450 Nm
        expect(result.result).toEqual({ T2: 450 });
        
        // Expected detailed format:
        expect(result.steps).toEqual([
            {
                description: "Calculate gear ratio",
                latex: "i = \\frac{60}{20} = 3"
            },
            {
                description: "Output torque",
                latex: "T_2 = 150 \\times 3 = 450 Nm"
            }
        ]);
    });
});
