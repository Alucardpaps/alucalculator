'use client';

import dynamic from 'next/dynamic';

const PlanetaryCalculator = dynamic(
  () => import('@/components/calculators/PlanetaryCalculator').then((mod) => mod.PlanetaryCalculator),
  { ssr: false }
);

export default function PlanetaryCalculatorPage() {
  return (
    <main className="min-h-screen bg-[#0B0C10]">
      <PlanetaryCalculator />
    </main>
  );
}