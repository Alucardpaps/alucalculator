import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Engineering Academy | Master Technical Engineering — AluCAD OS',
  description: 'Master core engineering principles with data-integrated learning modules. Bolt torque theory, bearing life derivations, beam deflection formulas, and fluid dynamics — referencing recognized ISO/DIN standards.',
  alternates: {
    canonical: 'https://www.alucalculator.com/academy',
  },
  openGraph: {
    title: 'Engineering Academy',
    description: 'Master technical engineering with standard-referenced learning modules, worked examples, and step-by-step calculation guides.',
    type: 'website',
    url: 'https://www.alucalculator.com/academy',
  },
};

export default function AcademyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
