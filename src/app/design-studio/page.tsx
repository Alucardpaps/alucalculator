import { Metadata } from 'next';
import { DesignStudioClient } from './DesignStudioClient';

export const metadata: Metadata = {
  title: 'Parametric Part Configurator & 3D WebGL CAD Studio | AluCalc OS',
  description:
    'Browser-based 3D CAD modeling, multi-direction assembly explosion, 2D technical drawing generation with custom title blocks, section analysis, and binary STL export.',
  alternates: {
    canonical: 'https://www.alucalculator.com/design-studio/',
  },
  openGraph: {
    title: 'Parametric Part Configurator & 3D WebGL CAD Studio | AluCalc OS',
    description:
      'Browser-based 3D CAD modeling, multi-direction assembly explosion, 2D technical drawing generation, section analysis, and binary STL export.',
    url: 'https://www.alucalculator.com/design-studio/',
    type: 'website',
  },
};

export default function DesignStudioPage() {
  return <DesignStudioClient />;
}
