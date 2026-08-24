export interface ConflictAwareObjective {
  id: string;
  priority: number;
  stability: number;
  rewardSignal: (state: any) => number;

  // NEW: conflict properties
  domain: string;
  exclusivityGroup?: string;
  suppressionWeight: number;
}

export interface ConflictState {
  objectives: ConflictAwareObjective[];
  dominanceMap: Record<string, number>;
}
