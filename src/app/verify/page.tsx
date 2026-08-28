import { Metadata } from 'next';
import VerifyClient from './VerifyClient';

export const metadata: Metadata = {
  title: 'Certificate & Technical Report Verification Ledger | AluCalc OS',
  description:
    'Cryptographically verify official AluCalc Academy Technical Mastery Certificates and certified engineering calculation reports.',
  alternates: {
    canonical: 'https://www.alucalculator.com/verify/',
  },
  openGraph: {
    title: 'Certificate & Report Verification Ledger | AluCalc OS',
    description:
      'Verify official AluCalc Academy Technical Mastery Certificates and calculation reports.',
    url: 'https://www.alucalculator.com/verify/',
    type: 'website',
  },
};

export default function VerifyPage() {
  return <VerifyClient />;
}
