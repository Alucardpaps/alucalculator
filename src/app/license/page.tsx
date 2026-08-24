import { Metadata } from 'next';
import { LicenseClient } from './LicenseClient';

export const metadata: Metadata = {
  title: 'Activate License | AluCalc',
  description: 'Activate your AluCalc Pro, Team, or Enterprise license key.',
  robots: { index: false, follow: true },
  alternates: { canonical: 'https://www.alucalculator.com/license/' },
};

export default function LicensePage() {
  return <LicenseClient />;
}
