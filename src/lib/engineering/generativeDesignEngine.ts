export interface DesignTemplate {
  name: string;
  baseVariables: Record<string, number>;
}

export interface GeneratedDesign {
  name: string;
  variables: Record<string, number>;
  mutationPath: string[];
}

/**
 * Deterministic design generator (no randomness)
 * Expands design space systematically using rule-based mutations
 */
export const generateDesigns = (
  template: DesignTemplate,
  variations: number
): GeneratedDesign[] => {
  const designs: GeneratedDesign[] = [];

  for (let i = 0; i < variations; i++) {
    const mutationFactor = 1 + i * 0.1;

    const variables: Record<string, number> = {};

    const mutationPath: string[] = [];

    for (const [key, value] of Object.entries(template.baseVariables)) {
      const mutatedValue = value * mutationFactor;

      variables[key] = mutatedValue;

      mutationPath.push(`${key}*${mutationFactor.toFixed(2)}`);
    }

    designs.push({
      name: `${template.name}_v${i}`,
      variables,
      mutationPath,
    });
  }

  return designs;
};
