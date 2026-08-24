import { Metadata } from 'next';
import { DevelopersClient } from './DevelopersClient';

export const metadata: Metadata = {
  title: 'Developers — Bulk Calculation API | AluCalc',
  description:
    'AluCalc Bulk Calculation API for engineering teams. Batch beam, gear, mass, and natural-language calculations. Team and Enterprise plans.',
  alternates: { canonical: 'https://www.alucalculator.com/developers/' },
};

export default function DevelopersPage() {
  return <DevelopersClient />;
}
