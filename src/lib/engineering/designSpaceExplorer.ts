import { generateDesigns } from './generativeDesignEngine';

export interface DesignSpaceResult {
  candidates: any[];
  spaceSize: number;
}

/**
 * Expands a single engineering template into full design space
 */
export const expandDesignSpace = (
  template: any,
  depth: number
): DesignSpaceResult => {
  const candidates = generateDesigns(template, depth);

  return {
    candidates,
    spaceSize: candidates.length,
  };
};
