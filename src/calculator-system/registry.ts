import { CalculatorSchema } from '../headless-engine/engine';
import { SchemaValidator } from './validator';

export class CalculatorRegistry {
  private static calculators: Map<string, CalculatorSchema> = new Map();

  static registerCalculator(schema: any): void {
      if (SchemaValidator.validate(schema)) {
          this.calculators.set(schema.id, schema);
      }
  }

  static getCalculator(id: string): CalculatorSchema | undefined {
      return this.calculators.get(id);
  }

  static listCalculators(): CalculatorSchema[] {
      return Array.from(this.calculators.values());
  }
  
  static clear(): void {
      this.calculators.clear();
  }
}
