import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Naval Hydrostatics & Ship Stability Calculator — AluCalc OS',
  description: 'Calculate ship displacement, buoyancy force, metacentric height (GM), and initial stability for naval architecture. Hull dimension analysis with block coefficient methodology.',
  alternates: {
    canonical: 'https://www.alucalculator.com/naval-hydrostatics',
  },
  openGraph: {
    title: 'Naval Hydrostatics Calculator | AluCalc OS',
    description: 'Ship stability analysis with displacement, buoyancy, and metacentric height calculations for naval engineering.',
    type: 'website',
    url: 'https://www.alucalculator.com/naval-hydrostatics',
  },
};

export default function NavalHydrostaticsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
