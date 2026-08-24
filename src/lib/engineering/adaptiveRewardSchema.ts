export interface RewardCoefficient {
  weight: number;
}

export interface PlasticReward {
  id?: string;
  coefficients: RewardCoefficient[];
}
