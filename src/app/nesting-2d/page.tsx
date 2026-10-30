import { Metadata } from 'next';
import { Nesting2DClient } from './Nesting2DClient';

export const metadata: Metadata = {
  title: '2D Sheet Nesting & CNC CAM Optimizer',
  description:
    'Endüstriyel 2D sac yerleşim optimizasyonu, otomatik kalıntı sac yönetimi, ESSI (.MPG) ve G-Code takım yolu üreticisi.',
  alternates: {
    canonical: 'https://www.alucalculator.com/nesting-2d/',
  },
  openGraph: {
    title: '2D Sheet Nesting & CNC CAM Optimizer',
    description:
      'Endüstriyel 2D sac yerleşim optimizasyonu, otomatik kalıntı sac yönetimi, ESSI (.MPG) ve G-Code takım yolu üreticisi.',
    url: 'https://www.alucalculator.com/nesting-2d/',
    type: 'website',
  },
};

export default function Nesting2DPage() {
  return <Nesting2DClient />;
}
