export interface KnowledgeNode {
  id: string;
  type: 'concept' | 'property' | 'calculator';
  label: string;
  relatedIds: string[];
}

export class EngineeringKnowledgeGraph {
  private static nodes: Map<string, KnowledgeNode> = new Map();

  static initializeDefaults() {
    this.addNode('beam', 'concept', 'Structural Beam', ['load', 'moment', 'stress', 'deflection', 'beam_deflection']);
    this.addNode('load', 'property', 'Applied Force', ['stress', 'deflection']);
    this.addNode('moment', 'property', 'Bending Moment', ['stress', 'beam']);
    this.addNode('stress', 'property', 'Internal Force Intensity', ['shaft_stress', 'beam']);
    this.addNode('deflection', 'property', 'Displacement', ['beam_deflection', 'beam']);
    
    // Abstract calculator bindings (maps to registry IDs)
    this.addNode('beam_deflection', 'calculator', 'Beam Deflection Calc', ['beam', 'deflection']);
    this.addNode('shaft_stress', 'calculator', 'Shaft Stress Calc', ['stress', 'shaft']);
    this.addNode('bearing_life', 'calculator', 'Bearing L10 Life', ['bearing', 'load', 'life']);
  }

  static addNode(id: string, type: 'concept' | 'property' | 'calculator', label: string, relatedIds: string[]) {
    this.nodes.set(id, { id, type, label, relatedIds });
  }

  static getRelatedCalculators(conceptId: string): string[] {
    const node = this.nodes.get(conceptId);
    if (!node) return [];

    const calculators: Set<string> = new Set();
    
    // Direct relation
    for(const relId of node.relatedIds) {
       const relNode = this.nodes.get(relId);
       if (relNode?.type === 'calculator') calculators.add(relNode.id);
    }
    
    // 1-step depth search
    for(const relId of node.relatedIds) {
        const relNode = this.nodes.get(relId);
        if (relNode) {
            for(const deepId of relNode.relatedIds) {
               const deepNode = this.nodes.get(deepId);
               if (deepNode?.type === 'calculator') calculators.add(deepNode.id);
            }
        }
    }

    return Array.from(calculators);
  }

  static getConceptGraph(): KnowledgeNode[] {
    return Array.from(this.nodes.values());
  }
}

// Auto-init
EngineeringKnowledgeGraph.initializeDefaults();
