export interface SystemObjective {
  id: string;
  description: string;
  priority: number;
  constraints: string[];
  rewardSignal: (state: any) => number;
}

export interface ObjectiveState {
  objectives: SystemObjective[];
  activeObjectiveId: string | null;
}
