import { Metadata } from 'next';
import { PricingClient } from './PricingClient';

export const metadata: Metadata = {
  title: 'Pricing — Free, Pro, Team, Enterprise | AluCalc',
  description:
    'AluCalc pricing: free engineering calculators, Pro for unlimited DXF/STEP/PDF, Team for offices, Enterprise for factories and universities.',
  alternates: { canonical: 'https://www.alucalculator.com/pricing/' },
};

export default function PricingPage() {
  return <PricingClient />;
}
