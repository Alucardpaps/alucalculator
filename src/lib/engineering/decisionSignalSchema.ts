export interface DecisionSignal {
  rewardSignal: number;
  objectiveScore: number;
  conflictPenalty: number;
  metaStability: number;
  recursionDepth: number;
}

export interface FusedDecision {
  score: number;
  confidence: number;
  selectedAction: string;
}
