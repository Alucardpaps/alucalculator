import React from 'react';
import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { Hexagon, Calculator } from 'lucide-react';
import { WindowContent } from '@/components/os/WindowContent';
import { ModuleType } from '@/config/modules';
import { getModuleSeo } from '@/config/seo';


/**
 * Generate unique metadata for each module page.
 * Uses the Centralized SEO Registry (Master Parameter Table).
 */
export async function generateMetadata({ params }: { params: Promise<{ module: string }> | { module: string } }): Promise<Metadata> {
  const resolvedParams = await params;
  const moduleSlug = resolvedParams.module;
  const seo = getModuleSeo(moduleSlug);

  return {
    title: seo.title,
    description: seo.description,
    alternates: {
      canonical: `https://www.alucalculator.com${seo.canonicalSlug}`,
    },
    openGraph: {
      title: seo.title,
      description: seo.description,
      url: `https://www.alucalculator.com${seo.canonicalSlug}`,
      type: 'website',
    },
  };
}

// Strict Static Path Generation for 'output: export'
export async function generateStaticParams() {
  const modules = [
    'aluminum', 'profile-weight',
    'bearings',
    'converter', 'unit-converter',
    'fasteners',
    'gears', 'gears-bearings',
    'handbook',
    'pumps',
    'sheet-metal',
    'strength', 'strength-analysis',
    'welding',
    'nesting', 'nesting-2d',
    'fits', 'fits-tolerances',
    'sketch-pad',
    'cad-editor',
    'engineering-selection',
    'cutting-optimizer',
    'materials-db',
    'simulation-fea',
    'calculator',
    'beam-deflection',
    'fatigue', 'fatigue-analysis',
    'thermal', 'thermal-expansion',
    'fluids', 'fluid-dynamics',
    'aerospace', 'aerospace-dynamics',
    'kinematics', 'physics-kinematics',
    'mfg-readiness', 'manufacturing-readiness',
    'mfg-sandbox', 'manufacturing-sandbox',
    'machine-assembly',
    'fatigue-advanced',
    'motor-selection', 'motor-selection-std',
    'gearbox-design',
    'materials-explorer',
    'failure-prediction',
    'failure-diagnosis',
    'topology-optimization',
    'concrete-reinforcement',
    'ohms-law',
    'voltage-drop',
    'periodic-table',
    'chemistry-reactions',
    'biology-genetics',
    'cs-algorithms',
    'naval-hydrostatics',
    'physics-solver',
    'reducer-lubrication',
    'bolt-torque',
    'chain-drive',
    'belt-drive',
    'material-selector-ai',
    'settings',
    'digital-logic',
    'filter-design',
    'three-phase-power',
    'planetary-gearbox',
    'machining-details',
    'manufacturing',
    'cost-estimator',
    'ai-copilot',
    'engineering-notes',
    'file-explorer',
    'project-manager',
    'project-vault',
    'browser',
    'terminal',
    'holographic-viewer',
    'matrix-screensaver',
    'parametric-cad',
    // Headless calculator slugs from calculators.json
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
    'pressure-drop',
    'radioactive-decay',
    'reynolds-number',
    'rocket-equation',
    'roller-chain-drive',
    'specific-gravity',
    'thread-stripping-area',
    'timing-belt-design',
    'tolerance-stackup',
    'transformer-calculation',
    'truss-analysis',
    'v-belt-power'
  ];
  
  return modules.map((slug) => ({
    module: slug,
  }));
}

export default async function ModernModuleRouterPage({ params }: { params: Promise<{ module: string }> | { module: string } }) {
  const resolvedParams = await params;
  const moduleSlug = resolvedParams.module.toLowerCase();
  
  if (moduleSlug === 'tolerance-stackup') {
    redirect('/fits');
  }
  
  let type: ModuleType | null = null;
  
  switch(moduleSlug) {
    case 'aluminum':
    case 'profile-weight': type = 'profile-weight'; break;
    case 'bearings': type = 'bearings'; break;
    case 'converter':
    case 'unit-converter': type = 'unit-converter'; break;
    case 'fasteners': type = 'fasteners'; break;
    case 'gears':
    case 'gears-bearings': type = 'gears-bearings'; break;
    case 'handbook': type = 'handbook'; break;
    case 'pumps': type = 'pumps'; break;
    case 'sheet-metal': type = 'sheet-metal'; break;
    case 'strength':
    case 'strength-analysis': type = 'strength-analysis'; break;
    case 'welding': type = 'welding'; break;
    case 'nesting':
    case 'nesting-2d': type = 'nesting-2d'; break;
    case 'fits':
    case 'fits-tolerances': type = 'fits-tolerances'; break;
    case 'beam-deflection': type = 'beam-deflection'; break;
    case 'fatigue':
    case 'fatigue-analysis': type = 'fatigue-analysis'; break;
    case 'thermal':
    case 'thermal-expansion': type = 'thermal-expansion'; break;
    case 'fluids':
    case 'fluid-dynamics': type = 'fluid-dynamics'; break;
    case 'aerospace':
    case 'aerospace-dynamics': type = 'aerospace-dynamics'; break;
    case 'kinematics':
    case 'physics-kinematics': type = 'physics-kinematics'; break;
    case 'sketch-pad': type = 'sketch-pad'; break;
    case 'cad-editor': type = 'cad-editor'; break;
    case 'engineering-selection': type = 'engineering-selection'; break;
    case 'mfg-readiness':
    case 'manufacturing-readiness': type = 'manufacturing-readiness'; break;
    case 'mfg-sandbox':
    case 'manufacturing-sandbox': type = 'manufacturing-sandbox'; break;
    case 'cutting-optimizer': type = 'cutting-optimizer'; break;
    case 'materials-db': type = 'materials-db'; break;
    case 'machine-assembly': type = 'machine-assembly'; break;
    case 'fatigue-advanced': type = 'fatigue-advanced'; break;
    case 'motor-selection': type = 'motor-selection-std'; break;
    case 'gearbox-design': type = 'gearbox-design'; break;
    case 'materials-explorer': type = 'materials-explorer'; break;
    case 'failure-prediction': type = 'failure-prediction'; break;
    case 'failure-diagnosis': type = 'failure-diagnosis'; break;
    case 'simulation-fea': type = 'simulation-fea'; break;
    case 'topology-optimization': type = 'topology-optimization'; break;
    case 'calculator': type = 'calculator'; break;
    case 'reducer-lubrication': type = 'reducer-lubrication'; break;
    case 'concrete-reinforcement': type = 'concrete-reinforcement'; break;
    case 'ohms-law': type = 'ohms-law'; break;
    case 'voltage-drop': type = 'voltage-drop'; break;
    case 'periodic-table': type = 'periodic-table'; break;
    case 'chemistry-reactions': type = 'chemistry-reactions'; break;
    case 'biology-genetics': type = 'biology-genetics'; break;
    case 'cs-algorithms': type = 'cs-algorithms'; break;
    case 'naval-hydrostatics': type = 'naval-hydrostatics'; break;
    case 'physics-solver': type = 'physics-solver'; break;
    case 'bolt-torque': type = 'bolt-torque'; break;
    case 'chain-drive': type = 'chain-drive'; break;
    case 'belt-drive': type = 'belt-drive'; break;
    case 'motor-selection-std': type = 'motor-selection-std'; break;
    case 'material-selector-ai': type = 'material-selector-ai'; break;
    case 'three-phase-power': type = 'three-phase-power'; break;
    case 'digital-logic': type = 'digital-logic'; break;
    case 'filter-design': type = 'filter-design'; break;
    case 'planetary-gearbox': type = 'planetary-gearbox'; break;
    case 'machining-details': type = 'machining-details'; break;
    case 'manufacturing': type = 'manufacturing'; break;
    case 'cost-estimator': type = 'cost-estimator'; break;
    case 'ai-copilot': type = 'ai-copilot'; break;
    case 'engineering-notes': type = 'engineering-notes'; break;
    case 'settings': type = 'settings'; break;
    case 'file-explorer': type = 'file-explorer'; break;
    case 'project-manager': type = 'project-manager'; break;
    case 'project-vault': type = 'project-vault'; break;
    case 'browser': type = 'browser'; break;
    case 'terminal': type = 'terminal'; break;
    case 'holographic-viewer': type = 'holographic-viewer'; break;
    case 'matrix-screensaver': type = 'matrix-screensaver'; break;
    case 'parametric-cad': type = 'parametric-cad'; break;
    default:
        type = moduleSlug as ModuleType; 
        break;
  }

  if (!type) return notFound();

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      <div className="flex-1 overflow-hidden relative workstation-container-bg-cleanse">
        <WindowContent type={type} />
      </div>
    </div>
  );
}
