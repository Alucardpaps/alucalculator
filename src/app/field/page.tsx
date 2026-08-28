import { Metadata } from 'next';
import FieldClient from './FieldClient';

export const metadata: Metadata = {
  title: 'Field Engineering Suite (24+ Offline Mobile Tools) | AluCalc OS',
  description:
    'Mobile and workshop engineering field tools: spirit level, vibration accelerometer, pitch gauge, tap drill charts, bolt pattern finder, and GPS surveyor.',
  alternates: {
    canonical: 'https://www.alucalculator.com/field/',
  },
  openGraph: {
    title: 'Field Engineering Suite | AluCalc OS',
    description:
      'Mobile and workshop engineering field tools for hardware technicians and mechanical engineers.',
    url: 'https://www.alucalculator.com/field/',
    type: 'website',
  },
};

export default function FieldPage() {
  return <FieldClient />;
}
