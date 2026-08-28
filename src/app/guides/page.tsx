import { Metadata } from 'next';
import { GuidesClient } from './GuidesClient';

export const metadata: Metadata = {
  title: 'Engineering Guides | AluCalc',
  description:
    'Practical engineering guides: aluminum density myth, kerf loss, alloy selection, bolt torque, and bearing life — linked to free calculators.',
  alternates: { canonical: 'https://www.alucalculator.com/guides/' },
};

export default function GuidesPage() {
  return <GuidesClient />;
}
