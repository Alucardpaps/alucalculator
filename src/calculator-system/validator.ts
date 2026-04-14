import { CalculatorSchema } from '../headless-engine/engine';

export class SchemaValidator {
  static validate(schema: any): schema is CalculatorSchema {
    if (!schema || typeof schema !== 'object') {
      throw new Error('Schema is not a valid object.');
    }

    if (typeof schema.id !== 'string' || schema.id.trim() === '') {
      throw new Error('Schema is missing a valid "id".');
    }

    if (typeof schema.name !== 'string' || schema.name.trim() === '') {
      throw new Error(`Schema ${schema.id} is missing a valid "name".`);
    }

    if (!Array.isArray(schema.inputs)) {
       throw new Error(`Schema ${schema.id} must define an "inputs" array.`);
    }

    if (!Array.isArray(schema.steps)) {
        throw new Error(`Schema ${schema.id} must define a "steps" array.`);
    }

    if (!Array.isArray(schema.outputs)) {
        throw new Error(`Schema ${schema.id} must define an "outputs" array.`);
    }
    
    // Check steps and inputs basic structure briefly
    for (const input of schema.inputs) {
        if (typeof input.key !== 'string') {
            throw new Error(`Schema ${schema.id} has invalid input format.`);
        }
    }
    
    for (const step of schema.steps) {
         if (typeof step.id !== 'string' || typeof step.formula !== 'string') {
             throw new Error(`Schema ${schema.id} has invalid step format.`);
         }
    }

    return true;
  }
}
