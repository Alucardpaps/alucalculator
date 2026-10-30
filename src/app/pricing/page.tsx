import { Metadata } from 'next';
import { PricingClient } from './PricingClient';

export const metadata: Metadata = {
  title: 'Pricing — Free, Pro, Team, Enterprise',
  description:
    'AluCAD OS pricing: free engineering calculators, Pro for unlimited DXF/STL/PDF, Team for offices, Enterprise for factories and universities.',
  alternates: { canonical: 'https://www.alucalculator.com/pricing/' },
};

export default function PricingPage() {
  return <PricingClient />;
}
