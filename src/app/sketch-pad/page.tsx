import { Metadata } from 'next';
import { SketchPadClient } from './SketchPadClient';

export const metadata: Metadata = {
  title: 'Technical Engineering Sketch Pad | AluCalc OS',
  description:
    'Freeform engineering sketch pad with vector shapes, dimensioning annotations, hand-drawn schematics, and SVG/PNG export.',
  alternates: {
    canonical: 'https://www.alucalculator.com/sketch-pad/',
  },
  openGraph: {
    title: 'Technical Engineering Sketch Pad | AluCalc OS',
    description:
      'Freeform engineering sketch pad with vector shapes, dimensioning annotations, and export.',
    url: 'https://www.alucalculator.com/sketch-pad/',
    type: 'website',
  },
};

export default function SketchPadPage() {
  return <SketchPadClient />;
}
