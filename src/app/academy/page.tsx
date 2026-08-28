import { Metadata } from 'next';
import { AcademyClient } from './AcademyClient';

export const metadata: Metadata = {
  title: 'Engineering Academy & Technical Certification (15 Verified Units) | AluCalc OS',
  description:
    'Master mechanical, structural, and manufacturing engineering principles with 15 verified interactive units, normative theory (ISO/DIN/VDI), and certified PDF certificates.',
  alternates: {
    canonical: 'https://www.alucalculator.com/academy/',
  },
  openGraph: {
    title: 'Engineering Academy & Technical Certification | AluCalc OS',
    description:
      'Master engineering principles with 15 verified units, normative theory, and certified PDF certificates.',
    url: 'https://www.alucalculator.com/academy/',
    type: 'website',
  },
};

export default function AcademyPage() {
  return <AcademyClient />;
}
