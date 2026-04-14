import aluminumDB from '../knowledge-base/aluminum.json';
import steelDB from '../knowledge-base/steel.json';
import woodDB from '../knowledge-base/wood.json';
import concreteDB from '../knowledge-base/concrete.json';
import glassDB from '../knowledge-base/glass.json';
import compositeDB from '../knowledge-base/composite.json';

// Types for parsed intent
export interface CopilotIntent {
  materialType?: 'aluminum' | 'steel' | 'wood' | 'concrete' | 'glass' | 'composite' | 'unknown';
  alloyOrGrade?: string;
  forceApplied?: number; // in Newtons
  length?: number; // in mm
  profileType?: 'rectangular' | 'circular' | 'i-beam' | 'unknown';
  dimensions?: Record<string, number>;
  assumptionsMade: string[];
}

export interface MaterialProperties {
  name: string;
  density: number;
  youngsModulus: number;
  yieldStrength: number;
  ultimateTensileStrength: number;
  poissonRatio: number;
  default?: boolean;
}

/**
 * AI Copilot for parsing user natural language queries and 
 * making smart engineering assumptions using the Knowledge Graph.
 */
export class EngineeringCopilot {
  
  /**
   * Parses natural language to extract key engineering parameters.
   * Fills in missing parameters with "Smart Assumptions" from the Knowledge Base.
   */
  public parseAndAssume(query: string): CopilotIntent {
    const q = query.toLowerCase();
    const intent: CopilotIntent = {
      assumptionsMade: [],
    };

    // 1. Detect Material Type
    if (q.includes('aluminum') || q.includes('alüminyum')) {
      intent.materialType = 'aluminum';
    } else if (q.includes('steel') || q.includes('çelik')) {
      intent.materialType = 'steel';
    } else if (q.includes('wood') || q.includes('ahşap')) {
      intent.materialType = 'wood';
    } else if (q.includes('concrete') || q.includes('beton')) {
      intent.materialType = 'concrete';
    } else if (q.includes('glass') || q.includes('cam')) {
      intent.materialType = 'glass';
    } else if (q.includes('composite') || q.includes('kompozit')) {
      intent.materialType = 'composite';
    }

    // 2. Detect Alloy/Grade explicitly if present
    if (intent.materialType === 'aluminum') {
      if (q.includes('6061')) intent.alloyOrGrade = '6061-T6';
      else if (q.includes('7075')) intent.alloyOrGrade = '7075-T6';
      else if (q.includes('6063')) intent.alloyOrGrade = '6063-T6';
    } else if (intent.materialType === 'steel') {
      if (q.includes('s355')) intent.alloyOrGrade = 'S355';
      else if (q.includes('s235')) intent.alloyOrGrade = 'S235';
    }

    // 3. Extract some basic numbers (force, length) - mock NLP regex for demonstration
    const forceMatch = q.match(/(\d+)\s*(n|newton|kn)/);
    if (forceMatch) {
      const val = parseFloat(forceMatch[1]);
      const unit = forceMatch[2];
      intent.forceApplied = unit === 'kn' ? val * 1000 : val;
    }

    const lengthMatch = q.match(/(\d+)\s*(mm|cm|m\b|metre)/);
    if (lengthMatch) {
      const val = parseFloat(lengthMatch[1]);
      const unit = lengthMatch[2];
      if (unit === 'cm') intent.length = val * 10;
      else if (unit === 'm' || unit === 'metre') intent.length = val * 1000;
      else intent.length = val;
    }

    // SMART ASSUMPTIONS (Knowledge Graph Hook)
    // If no material is specified at all, assume Aluminum.
    if (!intent.materialType) {
      intent.materialType = 'aluminum';
      intent.assumptionsMade.push('Material type not specified. Assumed Aluminum as default.');
    }

    // If material is known but grade is not, use the knowledge graph default.
    if (!intent.alloyOrGrade) {
      if (intent.materialType === 'aluminum') {
        const defaultAlloyKey = Object.keys(aluminumDB.alloys).find(
          (k) => (aluminumDB.alloys as any)[k].default
        );
        intent.alloyOrGrade = defaultAlloyKey || '6063-T6';
        intent.assumptionsMade.push(`Alloy not specified. Assumed ${intent.alloyOrGrade} (Standard architectural alloy).`);
      } else if (intent.materialType === 'steel') {
        const defaultGradeKey = Object.keys(steelDB.grades).find(
          (k) => (steelDB.grades as any)[k].default
        );
        intent.alloyOrGrade = defaultGradeKey || 'S235';
        intent.assumptionsMade.push(`Steel grade not specified. Assumed ${intent.alloyOrGrade} (Standard structural steel).`);
      } else if (intent.materialType === 'wood') {
        const defaultKey = Object.keys(woodDB.alloys).find(k => (woodDB.alloys as any)[k].default);
        intent.alloyOrGrade = defaultKey || 'Structural Pine';
        intent.assumptionsMade.push(`Wood species not specified. Assumed ${intent.alloyOrGrade}.`);
      } else if (intent.materialType === 'concrete') {
        const defaultKey = Object.keys(concreteDB.grades).find(k => (concreteDB.grades as any)[k].default);
        intent.alloyOrGrade = defaultKey || 'C25/30';
        intent.assumptionsMade.push(`Concrete grade not specified. Assumed ${intent.alloyOrGrade}.`);
      }
    }

    // Assume typical length if not provided
    if (!intent.length) {
      intent.length = 1000; // 1 meter default
      intent.assumptionsMade.push('Length not specified. Assumed 1000 mm (1 meter).');
    }

    // Assume typical force if not provided for calculation context
    if (!intent.forceApplied) {
      intent.forceApplied = 1000; // 1 kN default
      intent.assumptionsMade.push('Applied force not specified. Assumed 1000 N uniform load.');
    }

    return intent;
  }

  /**
   * Gets properties for a specific material and grade/alloy.
   */
  public getMaterialProperties(materialType: string, gradeOrAlloy: string): MaterialProperties | null {
    if (materialType === 'aluminum') {
      return (aluminumDB.alloys as any)[gradeOrAlloy] || null;
    } else if (materialType === 'steel') {
      return (steelDB.grades as any)[gradeOrAlloy] || null;
    } else if (materialType === 'wood') {
      return (woodDB.alloys as any)[gradeOrAlloy] || null;
    } else if (materialType === 'concrete') {
      return (concreteDB.grades as any)[gradeOrAlloy] || null;
    } else if (materialType === 'glass') {
      return (glassDB.types as any)[gradeOrAlloy] || null;
    } else if (materialType === 'composite') {
      return (compositeDB.types as any)[gradeOrAlloy] || null;
    }
    return null;
  }
}
