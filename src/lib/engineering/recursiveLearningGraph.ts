export interface RecursiveNode {
  depth: number;
  id: string;
  weight: number;
  parent?: string;
}

export interface RecursiveGraphState {
  nodes: RecursiveNode[];
  maxDepth: number;
}

/**
 * Expands learning structure recursively across abstraction layers
 */
export const expandRecursiveGraph = (
  state: RecursiveGraphState,
  branchingFactor: number
): RecursiveGraphState => {
  const newNodes: RecursiveNode[] = [...state.nodes];

  const currentDepth = Math.max(...state.nodes.map(n => n.depth));

  if (currentDepth >= state.maxDepth) {
    return state;
  }

  for (const node of state.nodes.filter(n => n.depth === currentDepth)) {
    for (let i = 0; i < branchingFactor; i++) {
      newNodes.push({
        id: `${node.id}-${i}`,
        depth: node.depth + 1,
        weight: node.weight * (1 - i * 0.1),
        parent: node.id,
      });
    }
  }

  return {
    nodes: newNodes,
    maxDepth: state.maxDepth,
  };
};
