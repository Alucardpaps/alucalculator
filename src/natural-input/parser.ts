import { IntentDetector } from './intent-detector';
import { EntityExtractor } from './entity-extractor';
import { CalculatorRegistry } from '../calculator-system/registry';

export interface ParsedPayload {
  calculator: string | null;
  payload: Record<string, number>;
  error?: string;
}

export class NaturalLanguageParser {
  parse(text: string): ParsedPayload {
    const calculatorId = IntentDetector.detect(text);
    
    if (!calculatorId) {
      return {
        calculator: null,
        payload: {},
        error: "Could not determine which calculator you want to use."
      };
    }
    
    const schema = CalculatorRegistry.getCalculator(calculatorId);
    if (!schema) {
       return {
         calculator: calculatorId,
         payload: {},
         error: `Schema for '${calculatorId}' not found.`
       };
    }
    
    const payload = EntityExtractor.extract(text, schema.inputs);
    
    return {
      calculator: calculatorId,
      payload
    };
  }
}
