export interface RewardDriftMetrics {
  variance: number;
  entropy: number;
  instabilityIndex: number;
}

export interface GovernanceLimits {
  maxWeight: number;
  minWeight: number;
  maxDrift: number;
}

export interface RewardGovernanceState {
  limits: GovernanceLimits;
  driftHistory: RewardDriftMetrics[];
  stabilizationStrength: number;
}
