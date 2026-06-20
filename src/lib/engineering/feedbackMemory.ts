export interface FeedbackEntry {
  designId: string;
  score: number;
  success: boolean;
  notes?: string;
}

export interface LearningState {
  weightAdjustments: Record<string, number>;
  history: FeedbackEntry[];
}

/**
 * Stores engineering outcome feedback for system self-improvement
 */
export const createLearningState = (): LearningState => ({
  weightAdjustments: {
    stress: 1,
    weight: 1,
    safety: 1,
  },
  history: [],
});

/**
 * Updates internal weighting logic based on observed performance
 */
export const updateLearningState = (
  state: LearningState,
  feedback: FeedbackEntry[]
): LearningState => {
  const updated = { ...state };

  updated.history.push(...feedback);

  let stressBias = 0;
  let weightBias = 0;
  let safetyBias = 0;

  for (const entry of feedback) {
    if (!entry.success) {
      stressBias += 0.1;
      safetyBias += 0.2;
    } else {
      weightBias += 0.05;
    }
  }

  updated.weightAdjustments.stress += stressBias;
  updated.weightAdjustments.weight += weightBias;
  updated.weightAdjustments.safety += safetyBias;

  return updated;
};
