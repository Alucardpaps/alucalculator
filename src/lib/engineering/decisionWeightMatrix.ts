export interface DecisionWeights {
  reward: number;
  objective: number;
  conflict: number;
  stability: number;
  recursion: number;
}

export const defaultWeights: DecisionWeights = {
  reward: 0.3,
  objective: 0.25,
  conflict: 0.2,
  stability: 0.15,
  recursion: 0.1,
};
