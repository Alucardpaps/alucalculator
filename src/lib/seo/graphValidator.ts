// src/lib/seo/graphValidator.ts
import { ClusterGraph } from './graphBuilder';

/**
 * Ensures SEO graph has no broken or orphaned structure
 */
export const validateClusterGraph = (graph: ClusterGraph) => {
  const issues: string[] = [];

  const nodeSet = new Set(graph.nodes);

  // 1. Orphan detection
  for (const node of graph.nodes) {
    const hasOutgoing = graph.edges.some(e => e.from === node);
    const hasIncoming = graph.edges.some(e => e.to === node);

    if (!hasOutgoing && !hasIncoming) {
      issues.push(`ORPHAN_NODE: ${node}`);
    }
  }

  // 2. Broken reference detection
  for (const edge of graph.edges) {
    if (!nodeSet.has(edge.from)) {
      issues.push(`INVALID_FROM_NODE: ${edge.from}`);
    }
    if (!nodeSet.has(edge.to)) {
      issues.push(`INVALID_TO_NODE: ${edge.to}`);
    }
  }

  // 3. Weight sanity check
  for (const edge of graph.edges) {
    if (edge.weight < 0 || edge.weight > 200) {
      issues.push(`INVALID_WEIGHT: ${edge.from} -> ${edge.to}`);
    }
  }

  return {
    valid: issues.length === 0,
    issues,
  };
};
