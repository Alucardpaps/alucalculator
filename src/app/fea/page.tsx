import { Metadata } from 'next';
import { FeaClient } from './FeaClient';

export const metadata: Metadata = {
  title: 'FEA Linear Static v1 — Validated Structural Templates | AluCalc OS',
  description:
    'Validated 3-template linear-elastic FEA stress analysis in WebGL. Real-time analytical benchmarks (< 8% error) for cantilever beams, plates with holes, and L-brackets.',
  alternates: {
    canonical: 'https://www.alucalculator.com/fea/',
  },
  openGraph: {
    title: 'FEA Linear Static v1 — Validated Structural Templates | AluCalc OS',
    description:
      'Validated 3-template linear-elastic FEA stress analysis in WebGL. Real-time analytical benchmarks for cantilever beams, plates with holes, and L-brackets.',
    url: 'https://www.alucalculator.com/fea/',
    type: 'website',
  },
};

export default function FeaPage() {
  return <FeaClient />;
}
