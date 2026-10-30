import { Metadata } from 'next';
import { FlowClient } from './FlowClient';

export const metadata: Metadata = {
  title: 'Engineering Flow Engine (Node-RED + Siemens NX Hybrid)',
  description:
    'Visual node-based deterministic engineering calculation and parametric data-flow pipeline. Chain formulas, geometry, FEA, and DXF/STEP export.',
  alternates: {
    canonical: 'https://www.alucalculator.com/flow/',
  },
  openGraph: {
    title: 'Engineering Flow Engine',
    description:
      'Visual node-based deterministic engineering calculation and parametric data-flow pipeline.',
    url: 'https://www.alucalculator.com/flow/',
    type: 'website',
  },
};

export default function FlowPage() {
  return <FlowClient />;
}

