// src/lib/seo/graphBuilder.ts
import rawCalculators from '@/data/seo-calculators/calculators.json';
import { SEOCalculatorData } from '@/components/os/SEOPage';
import { computeSemanticScore } from './semanticScore';

export interface GraphEdge {
  from: string;
  to: string;
  weight: number;
  reasons: string[];
}

export interface ClusterGraph {
  nodes: string[];
  edges: GraphEdge[];
}

/**
 * Builds full weighted semantic graph
 */
export const buildClusterGraph = (): ClusterGraph => {
  const data = rawCalculators as unknown as SEOCalculatorData[];

  const edges: GraphEdge[] = [];

  for (const current of data) {
    const candidates = data.filter(c => c.slug !== current.slug);

    const scored = candidates.map(c =>
      computeSemanticScore(current, c)
    );

    const top = scored
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    for (const t of top) {
      edges.push({
        from: current.slug,
        to: t.slug,
        weight: t.score,
        reasons: t.reasons,
      });
    }
  }

  return {
    nodes: data.map(d => d.slug),
    edges,
  };
};
