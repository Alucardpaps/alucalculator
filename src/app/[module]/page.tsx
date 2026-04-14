import React from 'react';
import { notFound } from 'next/navigation';
import { WindowContent } from '@/components/os/WindowContent';
import { ModuleType } from '@/config/modules';

export async function generateStaticParams() {
  return [
    { module: 'aluminum' },
    { module: 'bearings' },
    { module: 'converter' },
    { module: 'fasteners' },
    { module: 'gears' },
    { module: 'handbook' },
    { module: 'pumps' },
    { module: 'sheet-metal' },
    { module: 'strength' },
    { module: 'welding' },
    { module: 'nesting' },
    { module: 'fits' },
    { module: 'sketch-pad' },
    { module: 'cad-editor' },
    { module: 'engineering-selection' },
    { module: 'cutting-optimizer' },
    { module: 'materials-db' },
    { module: 'simulation-fea' },
    { module: 'calculator' },
    { module: 'ai-copilot' },
    { module: 'holographic-viewer' },
    { module: 'project-manager' },
    { module: 'beam-deflection' },
    { module: 'fatigue' },
    { module: 'thermal' },
    { module: 'fluids' },
    { module: 'aerospace' },
    { module: 'kinematics' },
    { module: 'mfg-readiness' },
    { module: 'mfg-sandbox' },
    { module: 'machine-assembly' },
    { module: 'fatigue-advanced' },
    { module: 'motor-selection' },
    { module: 'gearbox-design' },
    { module: 'materials-explorer' },
    { module: 'failure-prediction' },
    { module: 'failure-diagnosis' },
    { module: 'topology-optimization' },
    { module: 'concrete-reinforcement' },
    { module: 'ohms-law' },
    { module: 'voltage-drop' },
    { module: 'periodic-table' },
    { module: 'vat-calculator' },
    { module: 'excel-helper' },
    { module: 'json-formatter' },
    { module: 'regex-tester' },
    { module: 'box-profile-detector' },
    { module: 'cost-estimator' },
    { module: 'file-explorer' },
    { module: 'media-player' },
    { module: 'browser' },
    { module: 'parametric-cad' },
    { module: 'analytics-dashboard' },
    { module: 'project-variables' },
    { module: 'terminal' },
    { module: 'engineering-notes' },
    { module: 'chemistry-reactions' },
    { module: 'biology-genetics' },
    { module: 'cs-algorithms' },
    { module: 'naval-hydrostatics' },
    { module: 'physics-solver' },
    { module: 'project-vault' },
    { module: 'settings' }
  ];
}

export default async function ModernModuleRouterPage({ params }: { params: Promise<{ module: string }> | { module: string } }) {
  const resolvedParams = await params;
  const moduleSlug = resolvedParams.module.toLowerCase();
  
  let type: ModuleType | null = null;
  
  // Mapping standard URLs to internal module IDs
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
    case 'ai-copilot': type = 'ai-copilot'; break;
    case 'holographic-viewer': type = 'holographic-viewer'; break;
    case 'project-manager': type = 'project-manager'; break;
    case 'reducer-lubrication': type = 'reducer-lubrication'; break;
    case 'concrete-reinforcement': type = 'concrete-reinforcement'; break;
    case 'ohms-law': type = 'ohms-law'; break;
    case 'voltage-drop': type = 'voltage-drop'; break;
    case 'periodic-table': type = 'periodic-table'; break;
    case 'vat-calculator': type = 'vat-calculator'; break;
    case 'excel-helper': type = 'excel-helper'; break;
    case 'json-formatter': type = 'json-formatter'; break;
    case 'regex-tester': type = 'regex-tester'; break;
    case 'box-profile-detector': type = 'box-profile-detector'; break;
    case 'cost-estimator': type = 'cost-estimator'; break;
    case 'file-explorer': type = 'file-explorer'; break;
    case 'media-player': type = 'media-player'; break;
    case 'image-viewer': type = 'image-viewer'; break;
    case 'pdf-viewer': type = 'pdf-viewer'; break;
    case 'spreadsheet-viewer': type = 'spreadsheet-viewer'; break;
    case 'browser': type = 'browser'; break;
    case 'paint': type = 'paint'; break;
    case 'flow-editor': type = 'flow-editor'; break;
    case 'parametric-cad': type = 'parametric-cad'; break;
    case 'analytics-dashboard': type = 'analytics-dashboard'; break;
    case 'project-variables': type = 'project-variables'; break;
    case 'terminal': type = 'terminal'; break;
    case 'engineering-notes': type = 'engineering-notes'; break;
    case 'chemistry-reactions': type = 'chemistry-reactions'; break;
    case 'biology-genetics': type = 'biology-genetics'; break;
    case 'cs-algorithms': type = 'cs-algorithms'; break;
    case 'naval-hydrostatics': type = 'naval-hydrostatics'; break;
    case 'physics-solver': type = 'physics-solver'; break;
    case 'project-vault': type = 'project-vault'; break;
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
