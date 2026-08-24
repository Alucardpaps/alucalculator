import { describe, it, expect, beforeEach } from 'vitest';
import { CalculatorRegistry } from '../calculator-system/registry';
import { SchemaLoader } from '../calculator-system/schema-loader';
import { SchemaValidator } from '../calculator-system/validator';
import * as path from 'path';

describe('Calculator System (Registry, Loader, Validator)', () => {
    
  beforeEach(() => {
     CalculatorRegistry.clear();
  });

  it('validates correct schemas', () => {
     const validSchema = {
         id: 'test_calc',
         name: 'Test Calc',
         category: 'test',
         inputs: [{key: 'a', type: 'number'}],
         steps: [{id: 'res', formula: 'a*2', description: 'test', latex: 'a \\times 2'}],
         outputs: ['res']
     };
     expect(SchemaValidator.validate(validSchema)).toBe(true);
  });

  it('throws on invalid schemas missing name', () => {
     const invalidSchema = { id: 'test_calc' }; // missing name
     expect(() => SchemaValidator.validate(invalidSchema)).toThrowError(/name/);
  });
  
  it('throws on invalid schemas missing outputs', () => {
     const invalidSchema = { id: 'test_calc', name: 'Test' }; // missing inputs array
     expect(() => SchemaValidator.validate(invalidSchema)).toThrowError(/inputs/);
  });

  it('loads schemas from disk dynamically and registry retrieves them', () => {
     const schemasPath = path.resolve(__dirname, '../schemas');
     
     // The loader should read gear_ratio.json recursively from /mechanical/
     SchemaLoader.loadSchemas(schemasPath);
     
     const calc = CalculatorRegistry.getCalculator('gear_ratio');
     expect(calc).toBeDefined();
     expect(calc?.name).toBe('Gear Ratio Calculation');
     
     const list = CalculatorRegistry.listCalculators();
     expect(list.length).toBeGreaterThanOrEqual(1);
     expect(list.some(c => c.id === 'gear_ratio')).toBe(true);
  });
});
