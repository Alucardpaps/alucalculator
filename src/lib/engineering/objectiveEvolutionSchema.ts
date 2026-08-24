export interface EvolvingObjective {
  id: string;
  parentId?: string | null;
  generation: number;
  stability: number;
  priority: number;
  mutationHistory: string[];
}
