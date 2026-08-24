import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SEOPage } from '@/components/os/SEOPage';
import Redirector from './Redirector';
import calculators from '@/data/seo-calculators/calculators.json';

interface PageProps {
  params: Promise<{ slug: string }>;
}

const CANONICAL_MODULE_ALIASES: Record<string, string> = {
  'spring-design': 'advanced-spring',
  'helical-spring': 'advanced-spring',
  'spring-constant': 'advanced-spring',
  'spring-constant-calc': 'advanced-spring',
  'mohr-stress': 'strength-analysis',
  'pressure-drop': 'pipe-friction',
  'pressure-drop-calc': 'pipe-friction',
  '3-phase-power': 'three-phase-power',
  'power-electrical': 'three-phase-power',
  'power-electrical-calc': 'three-phase-power',
  'thermal-expansion': 'thermal-expansion',
  'bearing-life': 'bearings',
  'bearing-life-calc': 'bearings',
  'vdi2230': 'bolt-torque',
  'bolt-torque-calc': 'bolt-torque',
  'tolerance-stackup': 'fits-tolerances',
  'fits-tolerances': 'fits-tolerances',
  'shaft-diameter': 'shafts',
  'shaft-diameter-calc': 'shafts',
  'heat-transfer': 'thermal-expansion',
  'heat-transfer-calc': 'thermal-expansion',
  'motor-power': 'motor-selection-std',
  'motor-power-calc': 'motor-selection-std',
  'roller-chain-drive': 'chain-drive',
  'timing-belt-design': 'belt-drive',
  'v-belt-power': 'belt-drive',
  'bend-allowance': 'sheet-metal',
  'gear-contact-stress': 'gearbox-design',
  'gear-module': 'gearbox-design',
  'gear-ratio': 'gearbox-design',
  'gear-ratio-calc': 'gearbox-design',
  'beam-deflection-calc': 'beam-deflection',
  'flow': 'fea',
  'topology-optimization': 'fea',
  'machine-assembly': 'design-studio',
};

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

const VALID_MODULES = [
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
  'parametric-cad', 'cost-estimator', 'pipe-friction', 'advanced-spring', 'column-buckling'
];

function getNormalizedModuleRoute(slug: string): string | null {
  const lower = slug.toLowerCase().replace(/\/$/, '');
  const clean = lower.replace(/-calc$/, '');
  
  if (CANONICAL_MODULE_ALIASES[lower]) return CANONICAL_MODULE_ALIASES[lower];
  if (CANONICAL_MODULE_ALIASES[clean]) return CANONICAL_MODULE_ALIASES[clean];
  if (VALID_MODULES.includes(clean)) return clean;
  if (VALID_MODULES.includes(lower)) return lower;
  return null;
}

export default async function CalculatorSEOPage({ params }: PageProps) {
  const { slug } = await params;
  const targetModule = getNormalizedModuleRoute(slug);
  if (targetModule) {
    return <Redirector target={targetModule} />;
  }

  const allCalculators = calculators as any[];
  const calculator = allCalculators.find((c) => c.slug === slug);

  if (calculator) {
    return <SEOPage data={calculator} />;
  }

  notFound();
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const targetModule = getNormalizedModuleRoute(slug);
  if (targetModule) {
    const formatted = targetModule.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    return {
      title: `${formatted} Calculator`,
      description: `Professional online engineering calculator for ${targetModule.replace(/-/g, ' ')}.`,
      alternates: {
        canonical: `https://www.alucalculator.com/${targetModule}`,
      }
    };
  }

  const calculator = (calculators as any[]).find((c) => c.slug === slug);
  if (!calculator) {
    return {
      title: 'Calculator Not Found',
    };
  }

  const ogImage = `/images/og/${calculator.category || 'science'}.png`;
  const cleanTitle = (calculator.meta?.title || calculator.title || '').replace(/\s*\|\s*AluCalc.*$/i, '');

  return {
    title: cleanTitle,
    description: calculator.meta?.description || calculator.description,
    openGraph: {
      title: cleanTitle,
      description: calculator.meta?.description || calculator.description,
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
      title: cleanTitle,
      description: calculator.meta?.description || calculator.description,
      images: [ogImage],
    },
    alternates: {
      canonical: `https://www.alucalculator.com/calculators/${slug}`,
    }
  };
}

const ALL_ADDITIONAL_SLUGS = [
  'spring-design',
  'helical-spring',
  'gear-design',
  'bolt-torque',
  'beam-deflection',
  'vdi2230',
  'bearing-life',
  'tolerance-stackup',
  'chain-drive',
  'belt-drive',
  'sheet-metal',
  'welding',
  'fits-tolerances',
  'gearbox-design',
  'motor-power',
  'heat-transfer',
  'pressure-drop',
  'three-phase-power',
  'ohms-law',
  'voltage-drop',
  'filter-design',
  'digital-logic',
  'physics-solver',
  'failure-prediction',
  'failure-diagnosis',
  'fatigue-advanced',
  'planetary-gearbox',
  'machining-details',
  'cost-estimator',
  'parametric-cad',
  'design-studio',
  'cad-editor',
  'fea',
  'nesting-2d',
  'cutting-optimizer',
  'sketch-pad',
  'flow',
  'field',
  'academy',
  'handbook',
  '3-phase-power',
  'bend-allowance',
  'bending-moment',
  'centripetal-force',
  'chemical-molarity',
  'column-buckling',
  'gear-contact-stress',
  'gear-module',
  'gear-ratio',
  'heat-transfer-conduction',
  'hooke-law',
  'ideal-gas-law',
  'kinetic-energy',
  'lift-coefficient',
  'machining-time',
  'newton-second-law',
  'radioactive-decay',
  'reynolds-number',
  'rocket-equation',
  'roller-chain-drive',
  'specific-gravity',
  'thread-stripping-area',
  'timing-belt-design',
  'transformer-calculation',
  'truss-analysis',
  'v-belt-power',
  'welding-fillet',
  'chemistry-solver',
  'pipe-friction',
  'heat-sink',
  'hvac-load',
  'pressure-vessel',
  'wind-tunnel',
  'mohr-stress',
  'advanced-spring',
];

export async function generateStaticParams() {
  const jsonSlugs = calculators.map((c) => c.slug);
  const allUnique = Array.from(
    new Set([
      ...jsonSlugs,
      ...EXTRA_SLUGS,
      ...VALID_MODULES,
      ...ALL_ADDITIONAL_SLUGS,
      ...Object.keys(CANONICAL_MODULE_ALIASES),
    ])
  );

  return allUnique.map((slug) => ({
    slug,
  }));
}
