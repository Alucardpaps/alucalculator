import React from 'react';
import { notFound } from 'next/navigation';
import { WindowContent } from '@/components/os/WindowContent';
import { ModuleType } from '@/config/modules';

// Strict Static Path Generation for 'output: export'
export async function generateStaticParams() {
  const modules = [
    'aluminum', 'bearings', 'converter', 'fasteners', 'gears', 'handbook', 
    'pumps', 'sheet-metal', 'strength', 'welding', 'nesting', 'fits', 
    'sketch-pad', 'cad-editor', 'engineering-selection', 'cutting-optimizer', 
    'materials-db', 'simulation-fea', 'calculator', 'beam-deflection', 
    'fatigue', 'thermal', 'fluids', 'aerospace', 'kinematics', 
    'mfg-readiness', 'mfg-sandbox', 'machine-assembly', 'fatigue-advanced', 
    'motor-selection', 'gearbox-design', 'materials-explorer', 
    'failure-prediction', 'failure-diagnosis', 'topology-optimization', 
    'concrete-reinforcement', 'ohms-law', 'voltage-drop', 'periodic-table', 
    'chemistry-reactions', 'biology-genetics', 'cs-algorithms', 
    'naval-hydrostatics', 'physics-solver', 'reducer-lubrication', 
    'bolt-torque', 'motor-selection-std', 'material-selector-ai', 
    'settings', 'digital-logic', 'filter-design', 'three-phase-power',
    'planetary-gearbox', 'machining-details'
  ];
  
  return modules.map((slug) => ({
    module: slug,
  }));
}

export default async function ModernModuleRouterPage({ params }: { params: Promise<{ module: string }> | { module: string } }) {
  const resolvedParams = await params;
  const moduleSlug = resolvedParams.module.toLowerCase();
  
  let type: ModuleType | null = null;
  
  switch(moduleSlug) {
    case 'aluminum': type = 'profile-weight'; break;
    case 'bearings': type = 'bearings'; break;
    case 'converter': type = 'unit-converter'; break;
    case 'fasteners': type = 'fasteners'; break;
    case 'gears': type = 'gears-bearings'; break;
    case 'handbook': type = 'handbook'; break;
    case 'pumps': type = 'pumps'; break;
    case 'sheet-metal': type = 'sheet-metal'; break;
    case 'strength': type = 'strength-analysis'; break;
    case 'welding': type = 'welding'; break;
    case 'nesting': type = 'nesting-2d'; break;
    case 'fits': type = 'fits-tolerances'; break;
    case 'beam-deflection': type = 'beam-deflection'; break;
    case 'fatigue': type = 'fatigue-analysis'; break;
    case 'thermal': type = 'thermal-expansion'; break;
    case 'fluids': type = 'fluid-dynamics'; break;
    case 'aerospace': type = 'aerospace-dynamics'; break;
    case 'kinematics': type = 'physics-kinematics'; break;
    case 'sketch-pad': type = 'sketch-pad'; break;
    case 'cad-editor': type = 'cad-editor'; break;
    case 'engineering-selection': type = 'engineering-selection'; break;
    case 'mfg-readiness': type = 'manufacturing-readiness'; break;
    case 'mfg-sandbox': type = 'manufacturing-sandbox'; break;
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
    case 'motor-selection-std': type = 'motor-selection-std'; break;
    case 'material-selector-ai': type = 'material-selector-ai'; break;
    case 'three-phase-power': type = 'three-phase-power'; break;
    case 'digital-logic': type = 'digital-logic'; break;
    case 'filter-design': type = 'filter-design'; break;
    case 'planetary-gearbox': type = 'planetary-gearbox'; break;
    case 'machining-details': type = 'machining-details'; break;
    case 'settings': type = 'settings'; break;
    default:
        type = moduleSlug as ModuleType; 
        break;
  }

  if (!type) return notFound();

  return (
    <div className="w-full h-screen bg-[#03060a] overflow-hidden fixed inset-0">
      <WindowContent type={type} />
    </div>
  );
}
