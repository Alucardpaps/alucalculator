export interface SovereignWeights {
  reward: number;
  objective: number;
  conflict: number;
  stability: number;
  recursion: number;
  volatility: number;
}

export interface WeightMemory {
  history: SovereignWeights[];
  adaptationRate: number;
}
