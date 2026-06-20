// src/lib/seo/clusterMap.ts
import rawCalculators from '@/data/seo-calculators/calculators.json';
import { SEOCalculatorData } from '@/components/os/SEOPage';

export const calculators = rawCalculators as unknown as SEOCalculatorData[];

export type ClusterCategory = 
  | 'mechanical' 
  | 'civil' 
  | 'manufacturing' 
  | 'electrical' 
  | 'science' 
  | 'software' 
  | 'structural' 
  | 'fluid';

export interface SemanticLink {
  href: string;
  anchor: string;
  intent: string;
}

/**
 * Generates semantic anchor links to eliminate orphan routes and build the spoke network.
 */
export const resolveSemanticLinks = (category: ClusterCategory, currentSlug: string, limit = 5): SemanticLink[] => {
  return calculators
    .filter((calc) => calc.category === category && calc.slug !== currentSlug)
    .slice(0, limit)
    .map((calc) => ({
      href: `/calculators/${calc.slug}`,
      anchor: `${calc.title} Tool`,
      intent: calc.intent || `Calculate ${calc.title.toLowerCase()}`,
    }));
};
