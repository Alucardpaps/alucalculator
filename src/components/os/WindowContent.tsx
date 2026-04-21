'use client';

import { ModuleType } from '@/config/modules';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { Monitor } from 'lucide-react';

// Lazy load modules - Mechanical
const ProfileWeightModule = dynamic(() => import('@/components/modules/mechanical/ProfileWeightModule').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });
const GearsModule = dynamic(() => import('@/components/modules/mechanical/GearsModule').then(mod => mod.GearsModule as any), { loading: () => <ModuleLoading /> });
const Nesting2DModule = dynamic(() => import('@/components/modules/mechanical/Nesting2DModule').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });
const MaterialsDatabaseModule = dynamic(() => import('@/components/modules/mechanical/MaterialsDatabaseModule').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });
const WeldingModule = dynamic(() => import('@/components/modules/mechanical/WeldingModule').then(mod => mod.WeldingModule as any), { loading: () => <ModuleLoading /> });
const ManufacturingModule = dynamic(() => import('@/components/modules/mechanical/ManufacturingModule').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });
const ManufacturingSandbox = dynamic(() => import('@/components/modules/mechanical/ManufacturingModule').then(mod => mod.ManufacturingSandbox as any), { loading: () => <ModuleLoading /> });
const FastenersModule = dynamic(() => import('@/components/modules/mechanical/FastenersModule').then(mod => mod.FastenersModule as any), { loading: () => <ModuleLoading /> });
const BearingsModuleComponent = dynamic(() => import('@/components/modules/mechanical/BearingsModule').then(mod => mod.BearingsModule as any), { loading: () => <ModuleLoading /> });
const FitsTolerancesModule = dynamic(() => import('@/components/modules/mechanical/FitsTolerancesModule').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });
const MohrStressModule = dynamic(() => import('@/components/modules/mechanical/MohrStressModule').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });
const CuttingOptimizerModule = dynamic(() => import('@/components/modules/mechanical/CuttingOptimizerModule').then(mod => mod.CuttingOptimizerModule as any), { loading: () => <ModuleLoading /> });
const PumpsModule = dynamic(() => import('@/components/modules/mechanical/PumpsModule').then(mod => mod.PumpsModule as any), { loading: () => <ModuleLoading /> });
const SheetMetalModule = dynamic(() => import('@/components/modules/mechanical/SheetMetalModule').then(mod => mod.SheetMetalModule as any), { loading: () => <ModuleLoading /> });
const ThermalExpansionModule = dynamic(() => import('@/components/modules/mechanical/ThermalExpansionModule').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });
const HandbookModule = dynamic(() => import('@/components/modules/reference/EngineeringHandbookModule').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });
const EngineeringSelectionSystem = dynamic(() => import('@/components/modules/engineering/EngineeringSelectionSystem').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });
const MachiningDetailsModule = dynamic(() => import('@/components/modules/mechanical/MachiningDetailsModule').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });
const FluidDynamicsModule = dynamic(() => import('@/modules/mechanical/FluidDynamics').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });
const BoltTorqueModule = dynamic(() => import('@/components/modules/mechanical/FastenerAssemblyModule').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });
const BearingAnalysisModule = dynamic(() => import('@/components/modules/mechanical/BearingAnalysisModule').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });
const FatigueAnalysisModule = dynamic(() => import('@/components/modules/mechanical/FatigueAnalysisModule').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });

// Advanced Engineering V2 Modules
const MaterialAIModule = dynamic(() => import('@/components/modules/ai/MaterialAIModule').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });

import type { UniversalCalcRendererProps } from '@/components/calculators/UniversalCalcRenderer';
const UniversalCalcRenderer = dynamic<UniversalCalcRendererProps>(() => 
    import('@/components/calculators/UniversalCalcRenderer').then(mod => mod.UniversalCalcRenderer as any), 
    { loading: () => <ModuleLoading /> }
);

// V2 Schemas
const motorSelectionSchema = require('@/calculators/schemas-v2/motor-selection').default;
const failureAnalysisSchema = require('@/calculators/schemas-v2/failure-analysis').default;
const fatigueLifeSnSchema = require('@/calculators/schemas-v2/fatigue-life-sn').default;

// Engineering Workstation Expansions
const MaterialsExplorer = dynamic(() => import('@/components/modules/MaterialsExplorer').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });
const PhysicsSolver = dynamic(() => import('@/components/modules/PhysicsSolver').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });

// New Multi-Disciplinary Expansion
const PhysicsKinematicsModule = dynamic(() => import('@/modules/science/PhysicsKinematics').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });
const ChemistryReactionsModule = dynamic(() => import('@/modules/science/ChemistryReactions').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });
const BiologyGeneticsModule = dynamic(() => import('@/modules/science/BiologyGenetics').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });
const CSAlgorithmsModule = dynamic(() => import('@/modules/software/CSAlgorithms').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });
const AerospaceDynamicsModule = dynamic(() => import('@/modules/mechanical/AerospaceDynamics').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });
const NavalHydrostaticsModule = dynamic(() => import('@/modules/mechanical/NavalHydrostatics').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });

// Electrical
const OhmsLawModule = dynamic(() => import('@/components/modules/electrical/OhmsLawModule').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });
const VoltageDropModule = dynamic(() => import('@/components/modules/electrical/VoltageDropModule').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });
const ThreePhasePowerModule = dynamic(() => import('@/components/modules/electrical/ThreePhasePowerModule').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });
const DigitalLogicModule = dynamic(() => import('@/modules/automation/DigitalLogic').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });
const FilterDesignModule = dynamic(() => import('@/components/modules/electronics/FilterDesignModule').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });

// Civil
const BeamDeflectionModule = dynamic(() => import('@/components/modules/civil/BeamDeflectionModule').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });

// Science
const UnitConverterModule = dynamic(() => import('@/components/modules/science/UnitConverterModule').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });
const PeriodicTableModule = dynamic(() => import('@/components/modules/science/PeriodicTableModule').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });
const CalculatorModule = dynamic(() => import('@/components/modules/science/CalculatorModule').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });

// Elite Phase D Wiring
const MfgReadinessModule = dynamic(() => import('@/modules/mechanical/MfgReadiness').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });
const GenerativeLiteModule = dynamic(() => import('@/modules/generative/GenerativeLite').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });
const DragAndBuildModule = dynamic(() => import('@/modules/mechanical/DragAndBuild').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });
const FailurePredictionModule = dynamic(() => import('@/modules/mechanical/FailurePrediction').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });
const FailureDiagnosisModule = dynamic(() => import('@/modules/mechanical/FailureDiagnosis').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });
const MotorSelectionModule = dynamic(() => import('@/modules/mechanical/MotorSelection').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });
const ConcreteReinforcementModule = dynamic(() => import('@/modules/civil/ConcreteReinforcement').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });

const ReducerModule = dynamic(() => import('@/components/modules/mechanical/ReducerModule').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });
const GearboxDesignModule = dynamic(() => import('@/components/modules/mechanical/GearboxDesignModule').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });

// CAD Editor (AluCalc OS 2.0)
const CadEditorModule = dynamic(() => import('@/cad/components/AluCAD').then(mod => mod.AluCAD), { loading: () => <ModuleLoading /> });

// Analytics & Simulation
const SimulationFEAModule = dynamic(() => import('@/components/modules/mechanical/SimulationFEAModule').then(mod => mod.SimulationFEAModule as any), { loading: () => <ModuleLoading /> });

// Creative
const SettingsModule = dynamic(() => import('@/components/modules/os/SettingsModule').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });
const ExcalidrawModule = dynamic(() => import('@/components/modules/sketch/ExcalidrawModule').then(mod => mod.default), { loading: () => <ModuleLoading /> });

function ModuleLoading() {
    return (
        <div className="flex items-center justify-center h-full" style={{ color: 'var(--color-os-text-secondary)' }}>
            <div className="animate-pulse">Loading...</div>
        </div>
    );
}

function PlaceholderModule({ type }: { type: ModuleType }) {
    return (
        <div className="flex flex-col items-center justify-center w-full h-full bg-[#05060a] relative overflow-hidden">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative z-10 flex flex-col items-center max-w-md w-full px-8 py-12 bg-white/[0.02] border border-white/10 rounded-[32px] backdrop-blur-2xl text-center shadow-2xl"
            >
                <div className="relative w-24 h-24 mb-8">
                    <div className="relative w-full h-full rounded-2xl bg-[#0a101f] border border-blue-500/40 flex items-center justify-center">
                        <Monitor size={40} className="text-blue-400" />
                    </div>
                </div>
                <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase mb-2">Module Assembly</h2>
                <div className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[9px] font-black tracking-widest uppercase mb-6">{type}</div>
                <p className="text-slate-400 text-xs leading-relaxed mb-10 font-medium">Node synthesis in progress.</p>
            </motion.div>
        </div>
    );
}

interface WindowContentProps {
    type: ModuleType;
}

import { useOSStore } from '@/store/osStore';
import { ModuleRegistry } from '@/engine/module/ModuleRegistry';
import calculatorsDB from '@/data/seo-calculators/calculators.json';
import { HeadlessCalculatorWindow } from './HeadlessCalculatorWindow';
const FastenersModuleComponent = dynamic(() => import('@/components/modules/mechanical/FastenersModule').then(mod => mod.FastenersModule as any), { loading: () => <ModuleLoading /> });

export function WindowContent({ type }: WindowContentProps) {
    const { currentLanguage, dictionary } = useOSStore();

    // 1. Check if this is a dynamically registered UDA Module
    const DynamicComponent = ModuleRegistry.getComponentByType(type);
    if (DynamicComponent) {
        return <DynamicComponent lang={currentLanguage} dict={dictionary} />;
    }

    switch (type) {
        // Mechanical
        case 'profile-weight': return <ProfileWeightModule {...({ lang: currentLanguage, dict: dictionary } as any)} />;
        case 'gears-bearings': return <GearsModule {...({ lang: currentLanguage, dict: dictionary } as any)} />;
        case 'nesting-2d': return <Nesting2DModule {...({ lang: currentLanguage, dict: dictionary } as any)} />;
        case 'materials-db': return <MaterialsDatabaseModule {...({ lang: currentLanguage, dict: dictionary } as any)} />;
        case 'welding': return <WeldingModule {...({ lang: currentLanguage, dict: dictionary } as any)} />;
        case 'manufacturing': return <ManufacturingModule />;
        case 'manufacturing-sandbox': return <ManufacturingSandbox />;
        case 'fasteners': return <BoltTorqueModule {...({ lang: currentLanguage, dict: dictionary } as any)} />;
        case 'bolt-torque': return <BoltTorqueModule {...({ lang: currentLanguage, dict: dictionary } as any)} />;
        case 'bearings': return <BearingAnalysisModule {...({ lang: currentLanguage, dict: dictionary } as any)} />;
        case 'fits-tolerances': return <FitsTolerancesModule {...({ lang: currentLanguage, dict: dictionary } as any)} />;
        case 'strength-analysis': return <MohrStressModule {...({ lang: currentLanguage, dict: dictionary } as any)} />;
        case 'cutting-optimizer': return <CuttingOptimizerModule {...({ lang: currentLanguage, dict: dictionary } as any)} />;
        case 'pumps': return <PumpsModule {...({ lang: currentLanguage, dict: dictionary } as any)} />;
        case 'sheet-metal': return <SheetMetalModule {...({ lang: currentLanguage, dict: dictionary } as any)} />;
        case 'thermal-expansion': return <ThermalExpansionModule />;
        case 'handbook': return <HandbookModule {...({ lang: currentLanguage, dict: dictionary } as any)} />;
        case 'engineering-selection': return <EngineeringSelectionSystem />;
        case 'fluid-dynamics': return <FluidDynamicsModule />;
        case 'machining-details': return <MachiningDetailsModule />;
        case 'fatigue-analysis': return <FatigueAnalysisModule />;
        case 'fatigue-advanced': return <UniversalCalcRenderer schema={fatigueLifeSnSchema} />;
        case 'motor-selection-std': return <MotorSelectionModule />;
        case 'failure-diagnosis': return <FailureDiagnosisModule />;
        case 'gearbox-design': return <GearboxDesignModule />;
        case 'physics-kinematics': return <PhysicsKinematicsModule />;
        case 'chemistry-reactions': return <ChemistryReactionsModule />;
        case 'biology-genetics': return <BiologyGeneticsModule />;
        case 'cs-algorithms': return <CSAlgorithmsModule />;
        case 'aerospace-dynamics': return <AerospaceDynamicsModule />;
        case 'naval-hydrostatics': return <NavalHydrostaticsModule />;
        case 'ohms-law': return <OhmsLawModule />;
        case 'voltage-drop': return <VoltageDropModule />;
        case 'three-phase-power': return <ThreePhasePowerModule />;
        case 'digital-logic': return <DigitalLogicModule />;
        case 'filter-design': return <FilterDesignModule />;
        case 'beam-deflection': return <BeamDeflectionModule />;
        case 'periodic-table': return <PeriodicTableModule {...({ lang: currentLanguage, dict: dictionary } as any)} />;
        case 'unit-converter': return <UnitConverterModule />;
        case 'calculator': return <CalculatorModule />;
        case 'reducer-lubrication': return <ReducerModule {...({ lang: currentLanguage, dict: dictionary } as any)} />;
        case 'cad-editor': return <CadEditorModule className="w-full h-full" />;
        case 'simulation-fea': return <SimulationFEAModule />;
        case 'sketch-pad': return <ExcalidrawModule />;
        case 'manufacturing-readiness': return <MfgReadinessModule />;
        case 'topology-optimization': return <GenerativeLiteModule />;
        case 'machine-assembly': return <DragAndBuildModule />;
        case 'failure-prediction': return <FailurePredictionModule />;
        case 'materials-explorer': return <MaterialsExplorer />;
        case 'physics-solver': return <PhysicsSolver />;
        case 'concrete-reinforcement': return <ConcreteReinforcementModule />;
        case 'material-selector-ai': return <MaterialAIModule />;
        case 'settings': return <SettingsModule />;
        default:
            const isHeadless = (calculatorsDB as any[]).find(c => c.slug === type);
            if (isHeadless) {
                return <HeadlessCalculatorWindow calculatorConfig={isHeadless as any} />;
            }
            return <PlaceholderModule type={type} />;
    }
}
