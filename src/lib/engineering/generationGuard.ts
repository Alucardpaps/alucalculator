import { validateConstraints } from './constraintEngine';

/**
 * Prevents invalid design generation at source level
 */
export const filterValidGenerations = (
  candidates: any[]
): any[] => {
  return candidates.filter((c) => {
    const check = validateConstraints(c.variables || {});
    return check.valid;
  });
};
