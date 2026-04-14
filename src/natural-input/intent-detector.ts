import { CalculatorSchema } from '../headless-engine/engine';
import { CalculatorRegistry } from '../calculator-system/registry';

export class IntentDetector {
  /**
   * Simple deterministic keyword matching to find the calculator.
   * Future implementation can add vector embeddings or LLM logic here.
   */
  static detect(text: string): string | null {
    const normalizedText = text.toLowerCase();
    const calculators = CalculatorRegistry.listCalculators();
    
    // First pass: look for exact name match
    for (const calc of calculators) {
      if (normalizedText.includes(calc.name.toLowerCase())) {
        return calc.id;
      }
    }
    
    // Second pass: look for calculator ID match (e.g. gear_ratio -> "gear ratio")
    for (const calc of calculators) {
      const keywordFromId = calc.id.replace(/_/g, ' ').toLowerCase();
      if (normalizedText.includes(keywordFromId)) {
        return calc.id;
      }
    }

    return null;
  }
}
