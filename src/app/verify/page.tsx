import { Metadata } from 'next';
import VerifyClient from './VerifyClient';

export const metadata: Metadata = {
  title: 'Certificate & Technical Report Verification Ledger',
  description:
    'Cryptographically verify official AluCAD Academy Technical Mastery Certificates and certified engineering calculation reports.',
  alternates: {
    canonical: 'https://www.alucalculator.com/verify/',
  },
  openGraph: {
    title: 'Certificate & Report Verification Ledger',
    description:
      'Verify official AluCAD Academy Technical Mastery Certificates and calculation reports.',
    url: 'https://www.alucalculator.com/verify/',
    type: 'website',
  },
};

export default function VerifyPage() {
  return <VerifyClient />;
}
