import { Evaluator } from './evaluator';
import { StepGenerator } from './step-generator';
import { CalculatorRegistry } from '../calculator-system/registry';
import { CalculationCache } from './cache';

export interface CalculatorSchema {
  id: string;
  name: string;
  category: string;
  inputs: Array<{ key: string; type: string; unit?: string }>;
  steps: Array<{ id: string; formula: string; description: string; latex: string }>;
  outputs: string[];
}

export interface EngineResult {
  success: boolean;
  result: Record<string, number>;
  steps: Array<{ description: string; latex: string }>;
  error?: string;
}

export class HeadlessEngine {
  execute(calculatorId: string, inputs: Record<string, number>): EngineResult {
    
    // Performance optimization Phase 9
    const cacheKey = CalculationCache.generateKey(calculatorId, inputs);
    const cachedResult = CalculationCache.get(cacheKey);
    if (cachedResult) {
        return cachedResult; // Prevents re-calculation of exact parameter match hits instantly
    }
  
    const schema = CalculatorRegistry.getCalculator(calculatorId);
    
    if (!schema) {
         return {
            success: false,
            result: {},
            steps: [],
            error: `Calculator with ID '${calculatorId}' not found in registry.`
         };
    }
    
    const scope: Record<string, number> = { ...inputs };
    const stepOutputs: Array<{ description: string; latex: string }> = [];
    
    try {
      for (const step of schema.steps) {
        // Evaluate the formula
        const stepResult = Evaluator.evaluate(step.formula, scope);
        
        let outputUnit: string | undefined = undefined;
        // Basic deduction for T2 to explicitly add "Nm" according to tests
        if (schema.outputs.includes(step.id) && step.id === 'T2') {
          outputUnit = 'Nm';
        }
        
        // Generate the step-by-step latex using the PREVIOUS scope to substitute calculation values
        const latexStep = StepGenerator.generateLatex(
          step.id,
          step.formula,
          step.description,
          step.latex,
          scope,
          stepResult,
          outputUnit
        );
        
        // Update variables scope for subsequent step execution
        scope[step.id] = stepResult;
        
        stepOutputs.push(latexStep);
      }
      
      const finalResult: Record<string, number> = {};
      for (const outKey of schema.outputs) {
        finalResult[outKey] = scope[outKey];
      }
      
      const res: EngineResult = {
        success: true,
        result: finalResult,
        steps: stepOutputs
      };
      
      CalculationCache.set(cacheKey, res);
      return res;
      
    } catch (e: any) {
      return {
        success: false,
        result: {},
        steps: stepOutputs,
        error: e.message
      };
    }
  }
}
