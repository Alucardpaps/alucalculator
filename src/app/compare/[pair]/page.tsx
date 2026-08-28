import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  COMPARE_PAIRS,
  getAlloy,
} from '@/data/alloyDatasheets';
import { CompareClient } from './CompareClient';

interface PageProps {
  params: Promise<{ pair: string }>;
}

function parsePair(pair: string): [string, string] | null {
  const found = COMPARE_PAIRS.find(([a, b]) => `${a}-vs-${b}` === pair);
  return found ? [...found] : null;
}

export function generateStaticParams() {
  return COMPARE_PAIRS.map(([a, b]) => ({ pair: `${a}-vs-${b}` }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { pair } = await params;
  const slugs = parsePair(pair);
  if (!slugs) return { title: 'Compare not found' };
  const left = getAlloy(slugs[0]);
  const right = getAlloy(slugs[1]);
  if (!left || !right) return { title: 'Compare not found' };
  return {
    title: `${left.name} vs ${right.name} — Density, Strength & Weldability | AluCalc`,
    description: `Compare ${left.name} and ${right.name}: density, yield, weldability, and plate mass.`,
    alternates: { canonical: `https://www.alucalculator.com/compare/${pair}/` },
  };
}

export default async function ComparePage({ params }: PageProps) {
  const { pair } = await params;
  const slugs = parsePair(pair);
  if (!slugs) notFound();
  const left = getAlloy(slugs[0]);
  const right = getAlloy(slugs[1]);
  if (!left || !right) notFound();

  return <CompareClient left={left} right={right} />;
}
