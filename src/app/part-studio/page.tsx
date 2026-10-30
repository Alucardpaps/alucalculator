import type { Metadata } from 'next';
import PartStudioClient from './PartStudioClient';

export const metadata: Metadata = {
  title: 'Part Studio — sketch-based parametric 3D modelling',
  description: 'Sketch on Front / Top / Right planes or a face, dimension it, extrude, revolve or cut — every feature stays editable. Exports STL.',
  alternates: { canonical: 'https://www.alucalculator.com/part-studio/' },
};

export default function PartStudioPage() {
  return <PartStudioClient />;
}
