export interface CognitiveRule {
  id: string;
  condition: (state: any) => boolean;
  action: (state: any) => any;
  priority: number;
}

export interface CognitiveRuleSet {
  rules: CognitiveRule[];
  version: number;
}
