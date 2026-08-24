import { describe, it, expect, beforeAll } from 'vitest';
import { NaturalLanguageParser } from '../natural-input/parser';
import { CalculatorRegistry } from '../calculator-system/registry';
import { SchemaLoader } from '../calculator-system/schema-loader';
import * as path from 'path';

describe('Natural Language Input Parser', () => {
    
    beforeAll(() => {
        CalculatorRegistry.clear();
        const schemasPath = path.resolve(__dirname, '../schemas');
        SchemaLoader.loadSchemas(schemasPath);
    });

    it('parses natural language to exact gear ratio format', () => {
        const parser = new NaturalLanguageParser();
        const inputText = "gear ratio 20 teeth driving 60 teeth torque 150 Nm";
        
        const result = parser.parse(inputText);
        
        expect(result.calculator).toBe('gear_ratio');
        expect(result.payload).toEqual({
            N1: 20,
            N2: 60,
            T1: 150
        });
        expect(result.error).toBeUndefined();
    });
    
    it('returns null calculator if intent not found', () => {
        const parser = new NaturalLanguageParser();
        const inputText = "hello world I want to compute some random string";
        
        const result = parser.parse(inputText);
        
        expect(result.calculator).toBeNull();
        expect(result.payload).toEqual({});
        expect(result.error).toBeDefined();
    });
});
