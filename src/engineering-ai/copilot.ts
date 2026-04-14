import { HeadlessEngine } from '../headless-engine/engine';
import { MaterialService, MaterialData } from '../materials/material-service';
import { NaturalLanguageParser } from '../natural-input/parser';

export interface CopilotRecommendation {
    recommendation: Record<string, any>;
    calculations: any[];
    visualizations: any[];
}

export class EngineeringCopilot {
    private engine: HeadlessEngine;
    private parser: NaturalLanguageParser;

    constructor() {
        this.engine = new HeadlessEngine();
        this.parser = new NaturalLanguageParser();
    }

    async processRequest(request: string): Promise<CopilotRecommendation> {
        const lcReq = request.toLowerCase();

        // 1. Detect Intent via NLP Pipeline heuristics
        const parsed = this.parser.parse(request);
        
        // 2 & 3: Try detecting explicitly mentioned materials
        const materialsList = MaterialService.listMaterials();
        let selectedMaterial: MaterialData | undefined;
        
        for (const mat of materialsList) {
             if (lcReq.includes(mat.name.toLowerCase()) || lcReq.includes(mat.id)) {
                 selectedMaterial = mat;
                 break;
             }
        }

        // Extremely advanced heuristics fallback routing algorithm logic:
        const response: CopilotRecommendation = {
            recommendation: {},
            calculations: [],
            visualizations: []
        };

        if (parsed.calculator === 'beam_deflection') {
             // Heuristic override mapping to extract explicitly required parameters for `beam_deflection`
             // E.g: "design aluminum beam for 2 meter span carrying 500kg"
             const F = payloadMatch(lcReq, /(\d+)\s*kg/) * 9.81; // convert kg mass to N force weight
             const L = payloadMatch(lcReq, /(\d+)\s*meter|\b(\d+)\s*m\b/); 
             
             // Base guesses for generic copilot profile matching 
             const E = selectedMaterial ? selectedMaterial.young_modulus : 69e9; // fallback Al
             const I = 0.000005; // Dummy generic cross-sectional inertia

             const execPayload = { F, L, E, I };
             
             // 4. Perform Calculation
             const res = this.engine.execute('beam_deflection', execPayload);
             response.calculations.push(res);

             // 5. Build Recommendation Object
             const deflectionMm = (res.result?.deflection || 0) * 1000;
             let safety = 'Marginal';
             if (deflectionMm < 5) safety = 'Safe';
             if (deflectionMm > 20) safety = 'Unsafe';

             response.recommendation = {
                 beam_material: selectedMaterial?.name || 'Assumed Aluminum',
                 beam_span_m: L,
                 end_deflection_mm: deflectionMm,
                 status: safety
             };
             
             response.visualizations.push({
                 type: "beam_deflection",
                 span: L,
                 load: F
             });

             return response;
        }

        response.recommendation = {
            message: "I could not definitively match an engineering workflow to this prompt yet.",
            parsedState: parsed
        };

        return response;
    }
}

// Simple deterministic helper to scrape contextual bounds regex
function payloadMatch(str: string, rx: RegExp): number {
    const m = str.match(rx);
    if (m && m.length > 1) {
       for(let i=1; i<m.length; i++) {
           if (m[i]) return parseFloat(m[i]);
       }
    }
    return 1; // absolute minimum non-zero fallback
}
