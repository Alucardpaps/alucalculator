import { Metadata } from 'next';
import { LiteClient } from './LiteClient';
import { TOTAL_CALCULATORS_LABEL } from '@/config/modules';

export const metadata: Metadata = {
  title: `${TOTAL_CALCULATORS_LABEL} Engineering Calculators`,
  description:
    `Fast, mobile-optimized engineering calculators for immediate access to bolt torque, bearing life, beam deflection, and ${TOTAL_CALCULATORS_LABEL} precision tools.`,
  alternates: {
    canonical: 'https://www.alucalculator.com/lite/',
  },
  openGraph: {
    title: `${TOTAL_CALCULATORS_LABEL} Engineering Calculators | AluCalc OS`,
    description:
      `Fast, mobile-optimized engineering calculators for immediate access to bolt torque, bearing life, and ${TOTAL_CALCULATORS_LABEL} tools.`,
    url: 'https://www.alucalculator.com/lite/',
    type: 'website',
  },
};

export default function LitePage() {
  return <LiteClient />;
}

