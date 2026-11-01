import React, { Suspense } from 'react';
import { Metadata } from 'next';
import { CalculatorsDirectoryClient } from './CalculatorsDirectoryClient';
import { solverCount } from '@/lib/registry/calculatorRegistry';

export const metadata: Metadata = {
  title: `Engineering Solvers & Calculators Directory (${solverCount} Canonical Solvers)`,
  description: `Search and access ${solverCount} verified deterministic engineering solvers. ISO, DIN, VDI, and ASME standards compliant calculators for mechanical, structural, fluids, and manufacturing engineering.`,
  alternates: {
    canonical: 'https://www.alucalculator.com/calculators/',
  },
  openGraph: {
    title: `Engineering Solvers & Calculators Directory (${solverCount} Solvers)`,
    description: `Search and access ${solverCount} verified deterministic engineering solvers. ISO, DIN, VDI, and ASME standards compliant.`,
    url: 'https://www.alucalculator.com/calculators/',
    type: 'website',
  },
};

export default function CalculatorsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--bg-0)]" />}>
      <CalculatorsDirectoryClient />
    </Suspense>
  );
}
