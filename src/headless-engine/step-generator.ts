import * as math from 'mathjs';

export class StepGenerator {
  static generateLatex(
    stepId: string,
    formula: string,
    description: string,
    latexTemplate: string,
    scope: Record<string, number>,
    result: number,
    outputUnit?: string
  ): { description: string, latex: string } {
    let substituted = latexTemplate;
    
    try {
      const parts = latexTemplate.split('=');
      if (parts.length >= 2) {
        const lhs = parts[0].trim();
        const node = math.parse(formula);
        const texWithVals = node.transform(function (n: any) {
          if (n.isSymbolNode && scope[n.name] !== undefined) {
             return math.parse(scope[n.name].toString());
          }
          return n;
        }).toTex();
        
        substituted = `${lhs} = ${texWithVals} = ${result}`;
      } else {
        substituted = `${latexTemplate} = ${result}`;
      }
    } catch (e) {
      substituted = `${latexTemplate} = ${result}`;
    }
    
    // Replace standard mathjs multiplication dot with times for formatting
    substituted = substituted.replace(/\\cdot/g, ' \\times ');
    
    // Cleanup any excessive spaces
    substituted = substituted.replace(/\s+/g, ' ');

    if (outputUnit) {
      substituted += ` ${outputUnit}`;
    }
    
    return {
      description,
      latex: substituted
    };
  }
}
