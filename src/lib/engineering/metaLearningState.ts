export interface MetaLearningState {
  learningRate: number;
  explorationBias: number;
  stabilityBias: number;
  history: {
    iteration: number;
    avgScore: number;
  }[];
}

export const createMetaLearningState = (): MetaLearningState => ({
  learningRate: 1.0,
  explorationBias: 0.5,
  stabilityBias: 0.5,
  history: [],
});
