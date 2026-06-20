export const revalidate = 86400;

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Redirector from './Redirector';
import calculators from '@/data/seo-calculators/calculators.json';

interface PageProps {
  params: Promise<{ slug: string }>;
}

const EXTRA_SLUGS = [
  'bolt-torque-calc',
  'bearing-life-calc',
  'gear-ratio-calc',
  'shaft-diameter-calc',
  'spring-constant-calc',
  'motor-power-calc',
  'beam-deflection-calc',
  'concrete-reinforcement',
  'simulation-fea',
  'topology-optimization',
  'machine-assembly',
  'pressure-drop-calc',
  'heat-transfer-calc',
  'pumps',
  'reducer-lubrication',
  'naval-hydrostatics',
  'power-electrical-calc',
  'ohms-law',
  'voltage-drop',
  'three-phase-power',
  'filter-design',
  'physics-solver',
  'failure-prediction',
  'failure-diagnosis',
  'biology-genetics',
  'digital-logic'
];

function getNormalizedModuleRoute(slug: string): string | null {
  const clean = slug.toLowerCase().replace(/\/$/, '').replace(/-calc$/, '');
  
  if (clean === 'three-phase-power' || clean === 'power-electrical') return 'three-phase-power';
  if (clean === 'bearing-life') return 'bearings';
  if (clean === 'vdi2230') return 'bolt-torque';
  if (clean === 'tolerance-stackup') return 'fits';
  if (clean === 'fits-tolerances') return 'fits';
  if (clean === 'spring-constant') return 'strength';
  if (clean === 'shaft-diameter') return 'strength';
  if (clean === 'heat-transfer') return 'thermal';
  if (clean === 'pressure-drop') return 'fluid-dynamics';
  if (clean === 'motor-power') return 'motor-selection-std';
  
  const validModules = [
    'profile-weight', 'gears-bearings', 'reducer-lubrication', 'nesting-2d', 'materials-db',
    'welding', 'fasteners', 'bearings', 'fits-tolerances', 'strength-analysis',
    'cutting-optimizer', 'pumps', 'sheet-metal', 'thermal-expansion', 'manufacturing',
    'handbook', 'beam-deflection', 'concrete-reinforcement', 'ohms-law', 'voltage-drop',
    'periodic-table', 'unit-converter', 'calculator', 'cad-editor', 'simulation-fea',
    'sketch-pad', 'manufacturing-sandbox', 'engineering-selection', 'manufacturing-readiness',
    'topology-optimization', 'machine-assembly', 'failure-prediction', 'fatigue-analysis',
    'fluid-dynamics', 'bolt-torque', 'physics-kinematics', 'chemistry-reactions',
    'biology-genetics', 'cs-algorithms', 'aerospace-dynamics', 'naval-hydrostatics',
    'materials-explorer', 'physics-solver', 'gearbox-design', 'motor-selection-std',
    'material-selector-ai', 'failure-diagnosis', 'fatigue-advanced', 'planetary-gearbox',
    'three-phase-power', 'digital-logic', 'filter-design', 'machining-details',
    'chain-drive', 'belt-drive', 'ai-copilot', 'holographic-viewer', 'matrix-screensaver',
    'parametric-cad', 'cost-estimator'
  ];
  
  if (validModules.includes(clean)) {
    return clean;
  }
  return null;
}

export default async function CalculatorSEOPage({ params }: PageProps) {
  const { slug } = await params;
  const allCalculators = calculators as any[];
  const calculator = allCalculators.find((c) => c.slug === slug);

  if (calculator) {
    let target = slug;
    if (slug === 'bearing-life') target = 'bearings';
    else if (slug === 'vdi2230') target = 'bolt-torque';
    else if (slug === 'tolerance-stackup') target = 'fits';
    return <Redirector target={target} />;
  }

  const targetModule = getNormalizedModuleRoute(slug);
  if (targetModule) {
    return <Redirector target={targetModule} />;
  }

  notFound();
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const calculator = (calculators as any[]).find((c) => c.slug === slug);

  if (!calculator) {
    const targetModule = getNormalizedModuleRoute(slug);
    if (targetModule) {
      return {
        title: `${targetModule.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} Calculator | AeGiS`,
        description: `Professional online engineering calculator for ${targetModule.replace(/-/g, ' ')}.`,
      };
    }
    return {
      title: 'Calculator Not Found | AeGiS',
    };
  }

  const ogImage = `/images/og/${calculator.category || 'science'}.png`;

  return {
    title: calculator.meta.title,
    description: calculator.meta.description,
    openGraph: {
      title: calculator.meta.title,
      description: calculator.meta.description,
      type: 'website',
      url: `https://www.alucalculator.com/calculators/${slug}`,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: calculator.title,
        }
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: calculator.meta.title,
      description: calculator.meta.description,
      images: [ogImage],
    },
    alternates: {
      canonical: `https://www.alucalculator.com/calculators/${slug}`,
    }
  };
}

export async function generateStaticParams() {
  const jsonSlugs = calculators.map((c) => ({
    slug: c.slug,
  }));
  const extraSlugs = EXTRA_SLUGS.map((slug) => ({
    slug,
  }));
  return [...jsonSlugs, ...extraSlugs];
}
