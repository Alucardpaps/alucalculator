// src/components/seo/ClusterNav.tsx
import Link from 'next/link';
import { Network } from 'lucide-react';
import { buildClusterGraph } from '@/lib/seo/graphBuilder';
import { optimizeClusterGraph } from '@/lib/seo/seoOptimizer';
import rawCalculators from '@/data/seo-calculators/calculators.json';
import { SEOCalculatorData } from '@/components/os/SEOPage';

interface ClusterNavProps {
  category: string;
  currentSlug: string;
}

export function ClusterNav({ category, currentSlug }: ClusterNavProps) {
  // SSR Build the graph deterministically
  const graph = buildClusterGraph();
  const optimized = optimizeClusterGraph(graph);
  
  const edges = optimized[currentSlug] || [];

  if (!edges.length) return null;

  const allCalcs = rawCalculators as unknown as SEOCalculatorData[];

  return (
    <nav 
      aria-label="Related Engineering Tools" 
      className="mt-16 pt-8 border-t border-slate-800 bg-slate-900/50 rounded-2xl p-6"
    >
      <div className="flex items-center gap-3 mb-6">
        <Network className="text-blue-400" size={20} />
        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-widest">
          {category} Engineering Cluster
        </h3>
      </div>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {edges.map((edge) => {
          const targetNode = allCalcs.find(c => c.slug === edge.slug);
          if (!targetNode) return null;

          return (
            <li key={edge.slug}>
              <Link 
                href={`/calculators/${edge.slug}`}
                className="group block p-4 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 hover:border-blue-500/30 transition-all"
              >
                <span className="block text-sm font-semibold text-blue-400 group-hover:text-blue-300 mb-1">
                  {targetNode.title} Tool
                </span>
                <span className="block text-xs text-slate-500">
                  {targetNode.intent || `Calculate ${targetNode.title.toLowerCase()}`}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
