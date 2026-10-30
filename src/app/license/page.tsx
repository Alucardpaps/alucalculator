import { Metadata } from 'next';
import { LicenseClient } from './LicenseClient';

export const metadata: Metadata = {
  title: 'Activate License',
  description: 'Activate your AluCAD Pro, Team, or Enterprise license key.',
  robots: { index: false, follow: true },
  alternates: { canonical: 'https://www.alucalculator.com/license/' },
};

export default function LicensePage() {
  return <LicenseClient />;
}
