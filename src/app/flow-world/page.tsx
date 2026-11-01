import { Metadata } from 'next';
import { FlowWorldClient } from './FlowWorldClient';

export const metadata: Metadata = {
  title: '2D Physics Flow World',
  description: 'Interactive 2D physics sandbox used as a teaching world alongside the engineering flow engine.',
  alternates: {
    canonical: 'https://www.alucalculator.com/flow-world/',
  },
};

export default function FlowWorldPage() {
  return <FlowWorldClient />;
}
