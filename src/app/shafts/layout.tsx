import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shaft Analysis & Bearing Reaction Calculator — AluCalc OS',
  description: 'Calculate shaft bearing reactions, bending moments, and support forces for simply supported shafts under point loads. Includes assembly data-bus linking for multi-module projects.',
  alternates: {
    canonical: 'https://www.alucalculator.com/shafts',
  },
  openGraph: {
    title: 'Shaft Analysis Workstation | AluCalc OS',
    description: 'Shaft statics analysis with bearing reaction forces, bending moment diagrams, and assembly data-bus integration.',
    type: 'website',
    url: 'https://www.alucalculator.com/shafts',
  },
};

export default function ShaftsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
