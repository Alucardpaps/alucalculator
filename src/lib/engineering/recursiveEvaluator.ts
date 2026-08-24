import { RecursiveGraphState } from './recursiveLearningGraph';

export interface RecursiveScore {
  stability: number;
  adaptability: number;
  depthEfficiency: number;
}

/**
 * Evaluates structure that evaluates itself
 */
export const evaluateRecursiveSystem = (
  graph: RecursiveGraphState
): RecursiveScore => {
  const totalNodes = graph.nodes.length;
  const maxDepth = Math.max(...graph.nodes.map(n => n.depth));

  const avgWeight =
    graph.nodes.reduce((sum, n) => sum + n.weight, 0) / totalNodes;

  return {
    stability: avgWeight,
    adaptability: totalNodes / (maxDepth + 1),
    depthEfficiency: maxDepth > 0 ? totalNodes / maxDepth : 0,
  };
};
