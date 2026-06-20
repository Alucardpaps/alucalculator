import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Failure Diagnosis Workstation | Fatigue & Fracture Analysis — AluCalc OS',
  description: 'Diagnose mechanical failure modes with fatigue safety factor analysis, stress concentration evaluation, and structural integrity assessment using Goodman criteria.',
  alternates: {
    canonical: 'https://www.alucalculator.com/failure-diagnosis',
  },
  openGraph: {
    title: 'Failure Diagnosis Workstation | AluCalc OS',
    description: 'Mechanical failure diagnosis with fatigue safety factors, stress concentration analysis, and S-N curve evaluation.',
    type: 'website',
    url: 'https://www.alucalculator.com/failure-diagnosis',
  },
};

export default function FailureDiagnosisLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
