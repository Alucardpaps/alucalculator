// src/lib/seo/seoOptimizer.ts
import { ClusterGraph } from './graphBuilder';

export interface OptimizedEdge {
  slug: string;
  weight: number;
  reasons: string[];
}

/**
 * Converts graph into UI-ready SEO navigation structure
 */
export const optimizeClusterGraph = (graph: ClusterGraph): Record<string, OptimizedEdge[]> => {
  const adjacencyMap: Record<string, OptimizedEdge[]> = {};

  for (const edge of graph.edges) {
    if (!adjacencyMap[edge.from]) {
      adjacencyMap[edge.from] = [];
    }

    adjacencyMap[edge.from].push({
      slug: edge.to,
      weight: edge.weight,
      reasons: edge.reasons,
    });
  }

  // Sort edges by weight (critical SEO ordering)
  for (const key in adjacencyMap) {
    adjacencyMap[key].sort((a, b) => b.weight - a.weight);
  }

  return adjacencyMap;
};
