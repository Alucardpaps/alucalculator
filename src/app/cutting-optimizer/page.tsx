import { Metadata } from 'next';
import { CuttingOptimizerClient } from './CuttingOptimizerClient';

export const metadata: Metadata = {
  title: '1D Linear Cutting Optimizer (Stock Length Minimizer) | AluCalc OS',
  description:
    'Optimize 1D profile, pipe, and bar cutting layouts. Minimize scrap waste, generate cutting patterns, and export cut lists for fabrication.',
  alternates: {
    canonical: 'https://www.alucalculator.com/cutting-optimizer/',
  },
  openGraph: {
    title: '1D Linear Cutting Optimizer (Stock Length Minimizer) | AluCalc OS',
    description:
      'Optimize 1D profile and bar cutting layouts. Minimize scrap waste and generate cut lists.',
    url: 'https://www.alucalculator.com/cutting-optimizer/',
    type: 'website',
  },
};

export default function CuttingOptimizerPage() {
  return <CuttingOptimizerClient />;
}
