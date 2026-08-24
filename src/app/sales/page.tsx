import { Metadata } from 'next';
import { SalesClient } from './SalesClient';

export const metadata: Metadata = {
  title: 'Contact Sales — Enterprise & Team | AluCalc',
  description:
    'Talk to AluCalc sales for Team, Enterprise, bulk licenses, OEM white-label, university packs, and manufacturing API access.',
  alternates: { canonical: 'https://www.alucalculator.com/sales/' },
};

export default function SalesPage() {
  return <SalesClient />;
}
