'use client';

import { Suspense, useState, useEffect } from 'react';
import { ModuleType } from '@/config/modules';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { Monitor } from 'lucide-react';
import { useI18nStore } from '@/store/i18nStore';
import { getWorkstationPage } from '@/locales/workstationPageTranslations';

// Lazy load modules - Mechanical
const ProfileWeightModule = dynamic(() => import('@/components/modules/mechanical/ProfileWeightModule').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });
const GearsModule = dynamic(() => import('@/components/modules/mechanical/GearsModule').then(mod => mod.GearsModule as any), { loading: () => <ModuleLoading /> });
const Nesting2DModule = dynamic(() => import('@/components/modules/mechanical/Nesting2DModule').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });
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
const FatigueAnalysisModule = dynamic<any>(() => import('@/components/modules/mechanical/FatigueAnalysisModule').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });
const SoundMeterModule = dynamic(() => import('@/components/modules/mechanical/SoundMeterModule').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });
const ClinometerModule = dynamic(() => import('@/components/modules/mechanical/ClinometerModule').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });
const GPSSurveyorModule = dynamic(() => import('@/components/modules/mechanical/GPSSurveyorModule').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });
const HardnessConverterModule = dynamic(() => import('@/components/modules/mechanical/HardnessConverterModule').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });



// Advanced Engineering V2 Modules
const PlanetaryCalculator = dynamic(() => import('@/components/calculators/PlanetaryCalculator').then(mod => mod.PlanetaryCalculator as any), { loading: () => <ModuleLoading /> });


import type { UniversalCalcRendererProps } from '@/components/calculators/UniversalCalcRenderer';
const UniversalCalcRenderer = dynamic<UniversalCalcRendererProps>(() => 
    import('@/components/calculators/UniversalCalcRenderer').then(mod => mod.UniversalCalcRenderer as any), 
    { loading: () => <ModuleLoading /> }
);

// V2 Schemas
const motorSelectionSchema = require('@/calculators/schemas-v2/motor-selection').default;
const fatigueLifeSnSchema = require('@/calculators/schemas-v2/fatigue-life-sn').default;
const chainDriveSchema = require('@/calculators/schemas-v2/chain-drive').default;
const beltDriveSchema = require('@/calculators/schemas-v2/belt-drive').default;
const weldingFilletSchema = require('@/calculators/schemas-v2/welding-fillet').default;
const threadGeometrySchema = require('@/calculators/schemas-v2/thread-geometry').default;

// Engineering Workstation Expansions
const PhysicsSolver = dynamic<any>(() => import('@/components/modules/PhysicsSolver').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });

// New Multi-Disciplinary Expansion
const PhysicsKinematicsModule = dynamic(() => import('@/modules/science/PhysicsKinematics').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });
const ChemistryReactionsModule = dynamic(() => import('@/modules/science/ChemistryReactions').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });
const BiologyGeneticsModule = dynamic(() => import('@/modules/science/BiologyGenetics').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });
const CSAlgorithmsModule = dynamic(() => import('@/modules/software/CSAlgorithms').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });
const AerospaceDynamicsModule = dynamic(() => import('@/modules/mechanical/AerospaceDynamics').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });
const WindTunnelModule = dynamic(() => import('@/modules/mechanical/AerospaceDynamics').then(mod => mod.default as any), { ssr: false, loading: () => <ModuleLoading /> });
const HeatSinkModule = dynamic(() => import('@/components/modules/mechanical/HeatSinkModule').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });
const PressureVesselModule = dynamic(() => import('@/components/modules/mechanical/PressureVesselModule').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });
const PipeFrictionModule = dynamic(() => import('@/modules/mechanical/FluidDynamics').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });
const ColumnBucklingModule = dynamic(() => import('@/components/modules/mechanical/ColumnBucklingModule').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });
const AdvancedSpringModule = dynamic(() => import('@/components/modules/mechanical/AdvancedSpringModule').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });
const VibrationModule = dynamic(() => import('@/components/modules/mechanical/VibrationModule').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });
const ToleranceStackupModule = dynamic(() => import('@/components/modules/mechanical/ToleranceStackupModule').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });
const HvacLoadModule = dynamic(() => import('@/components/modules/mechanical/HvacLoadModule').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });
const KeywayConnectionModule = dynamic(() => import('@/components/modules/mechanical/KeywayConnectionModule').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });
const PressFitModule = dynamic(() => import('@/components/modules/mechanical/PressFitModule').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });
const ORingModule = dynamic(() => import('@/components/modules/mechanical/ORingModule').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });
const ShaftDesignModule = dynamic(() => import('@/modules/mechanical/ShaftDesign').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });
const CylinderDesignModule = dynamic(() => import('@/modules/mechanical/CylinderDesign').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });

// Electrical
const ElectricalEngineeringSuite = dynamic<any>(() => import('@/components/modules/electrical/ElectricalEngineeringSuite').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });
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
const DragAndBuildModule = dynamic(() => import('@/modules/mechanical/DragAndBuild').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });
const FailurePredictionModule = dynamic(() => import('@/modules/mechanical/FailurePrediction').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });
const MotorSelectionModule = dynamic(() => import('@/modules/mechanical/MotorSelection').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });
const ConcreteReinforcementModule = dynamic(() => import('@/modules/civil/ConcreteReinforcement').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });

const ReducerModule = dynamic(() => import('@/components/modules/mechanical/ReducerModule').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });
const GearboxDesignModule = dynamic(() => import('@/components/modules/mechanical/GearboxDesignModule').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });

// CAD Editor & 3D Design Studio (AluCAD OS 2.0)
const CadEditorModule = dynamic(() => import('@/cad/components/AluCAD').then(mod => mod.AluCAD), { loading: () => <ModuleLoading /> });
const DesignStudioModule = dynamic(() => import('@/design-studio/DesignStudio').then(mod => (mod.DesignStudio || mod.default) as any), { ssr: false, loading: () => <ModuleLoading /> });

// Analytics & Simulation
const SimulationFEAModule = dynamic(() => import('@/components/modules/mechanical/SimulationFEAModule').then(mod => mod.SimulationFEAModule as any), { loading: () => <ModuleLoading /> });

// Creative
const SettingsModule = dynamic(() => import('@/components/modules/os/SettingsModule').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });
const ExcalidrawModule = dynamic(() => import('@/components/modules/sketch/ExcalidrawModule').then(mod => mod.default), { loading: () => <ModuleLoading /> });
const EngineeringNotesModule = dynamic(() => import('@/modules/system/EngineeringNotes').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });

// Dynamically imported OS workstation components to resolve hydration mismatch and allow standalone routing
const FileExplorerModule = dynamic(() => import('@/components/modules/os/FileExplorerModule').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });
const ProjectManagerModule = dynamic(() => import('@/components/modules/os/ProjectManagerModule').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });
const ProjectVault = dynamic(() => import('@/components/modules/ProjectVault').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });
const BrowserModule = dynamic(() => import('@/components/modules/software/BrowserModule').then(mod => mod.BrowserModule as any), { loading: () => <ModuleLoading /> });
const TerminalModule = dynamic(() => import('@/components/modules/os/TerminalModule').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });
const RealTimeCostModule = dynamic(() => import('@/modules/finance/RealTimeCost').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });
const AiCoPilotModule = dynamic(() => import('@/modules/software/AiCoPilot').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });
const HolographicViewer = dynamic(() => import('@/components/modules/presentation/HolographicViewer').then(mod => mod.HolographicViewer as any), { ssr: false, loading: () => <ModuleLoading /> });
const ParametricCadModule = dynamic(() => import('@/components/modules/parametric/ParametricCadModule').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });
const FlowCanvasModule = dynamic(() => import('@/components/flow/FlowCanvas'), { loading: () => <ModuleLoading /> });
const MatrixScreensaverModule = dynamic(() => import('@/components/modules/os/MatrixScreensaverModule').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });
const FactorySimulation = dynamic(() => import('@/components/factory/FactorySimulation').then(mod => mod.FactorySimulation as any), { ssr: false, loading: () => <ModuleLoading /> });
const ProjectSimulator = dynamic(() => import('@/components/project/ProjectSimulator').then(mod => mod.ProjectSimulator as any), { loading: () => <ModuleLoading /> });

function ModuleLoading() {
    const { language } = useI18nStore();
    const t = getWorkstationPage(language).layout;
    return (
        <div className="flex items-center justify-center h-full" style={{ color: 'var(--color-os-text-secondary)' }}>
            <div className="animate-pulse">{t.moduleLoading}</div>
        </div>
    );
}

function PlaceholderModule({ type }: { type: ModuleType }) {
    return (
        <div className="flex flex-col items-center justify-center w-full h-full bg-[var(--bg-0)] relative overflow-hidden">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative z-10 flex flex-col items-center max-w-md w-full px-8 py-12 bg-white/[0.02] border border-white/10 rounded-xl text-center shadow-2xl"
            >
                <div className="relative w-24 h-24 mb-8">
                    <div className="relative w-full h-full rounded-2xl bg-[var(--bg-1)] border border-blue-500/40 flex items-center justify-center">
                        <Monitor size={40} className="text-blue-400" />
                    </div>
                </div>
                <h2 className="text-2xl font-black text-white tracking-tighter uppercase mb-2">Module Assembly</h2>
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
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);

    const { currentLanguage, dictionary } = useOSStore();

    if (!mounted) {
        return <ModuleLoading />;
    }

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
        case 'materials-db':
        case 'materials-explorer':
        case 'material-selector-ai': return <HandbookModule defaultTab="materials" {...({ lang: currentLanguage, dict: dictionary } as any)} />;
        case 'welding': return <WeldingModule {...({ lang: currentLanguage, dict: dictionary } as any)} />;
        case 'manufacturing': return <ManufacturingModule />;
        case 'manufacturing-sandbox': return <ManufacturingSandbox />;
        case 'fasteners':
        case 'bolt-torque': return (
            <Suspense fallback={<ModuleLoading />}>
                <BoltTorqueModule {...({ lang: currentLanguage, dict: dictionary } as any)} />
            </Suspense>
        );
        case 'bearings': return <BearingsModuleComponent {...({ lang: currentLanguage, dict: dictionary } as any)} />;
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
        case 'fatigue-analysis': return <FatigueAnalysisModule initialTab="sn-curve" />;
        case 'failure-prediction': return <FatigueAnalysisModule initialTab="weibull" />;
        case 'sound-meter': return <SoundMeterModule />;
        case 'clinometer': return <ClinometerModule />;
        case 'gps-surveyor': return <GPSSurveyorModule />;
        case 'hardness-converter': return <HardnessConverterModule />;
        case 'fatigue-advanced': return <UniversalCalcRenderer schema={fatigueLifeSnSchema} />;
        case 'chain-drive': return <UniversalCalcRenderer schema={chainDriveSchema} />;
        case 'belt-drive': return <UniversalCalcRenderer schema={beltDriveSchema} />;
        case 'welding-fillet': return <UniversalCalcRenderer schema={weldingFilletSchema} />;
        case 'thread-geometry': return <UniversalCalcRenderer schema={threadGeometrySchema} />;
        case 'motor-selection-std': return <MotorSelectionModule />;
        case 'gearbox-design': return <GearboxDesignModule />;
        case 'physics-kinematics': return <PhysicsSolver initialTab="kinematics" />;
        case 'physics-solver': return <PhysicsSolver initialTab="kinematics" />;
        case 'chemistry-reactions': return <PeriodicTableModule initialMode="Reactions" {...({ lang: currentLanguage, dict: dictionary } as any)} />;
        case 'biology-genetics': return <HandbookModule defaultTab="materials" {...({ lang: currentLanguage, dict: dictionary } as any)} />;
        case 'cs-algorithms': return <CalculatorModule />;
        case 'aerospace-dynamics': return <AerospaceDynamicsModule />;
        case 'wind-tunnel': return <WindTunnelModule />;
        case 'heat-sink': return <HeatSinkModule />;
        case 'pressure-vessel': return <PressureVesselModule />;
        case 'pipe-friction': return <PipeFrictionModule />;
        case 'column-buckling': return <ColumnBucklingModule />;
        case 'advanced-spring': return <AdvancedSpringModule />;
        case 'vibration': return <VibrationModule />;
        case 'tolerance-stackup': return <ToleranceStackupModule />;
        case 'hvac-load': return <HvacLoadModule />;
        case 'keyway-connection': return <KeywayConnectionModule />;
        case 'press-fit': return <PressFitModule />;
        case 'o-ring': return <ORingModule />;
        case 'shaft-design': return <ShaftDesignModule />;
        case 'cylinder-design': return <CylinderDesignModule />;
        case 'ohms-law': return <ElectricalEngineeringSuite initialTab="ohms-law" />;
        case 'voltage-drop': return <ElectricalEngineeringSuite initialTab="voltage-drop" />;
        case 'three-phase-power': return <ElectricalEngineeringSuite initialTab="three-phase" />;
        case 'digital-logic': return <ElectricalEngineeringSuite initialTab="digital-logic" />;
        case 'filter-design': return <ElectricalEngineeringSuite initialTab="filter-design" />;
        case 'beam-deflection': return <BeamDeflectionModule />;
        case 'periodic-table': return <PeriodicTableModule initialMode="Elements" {...({ lang: currentLanguage, dict: dictionary } as any)} />;
        case 'unit-converter': return <UnitConverterModule />;
        case 'calculator': return <CalculatorModule />;
        case 'reducer-lubrication': return <ReducerModule {...({ lang: currentLanguage, dict: dictionary } as any)} />;
        case 'cad-editor': return <CadEditorModule className="w-full h-full" />;
        case 'design-studio': return <DesignStudioModule />;
        case 'simulation-fea': return <SimulationFEAModule />;
        case 'sketch-pad': return <ExcalidrawModule />;
        case 'manufacturing-readiness': return <MfgReadinessModule />;
        case 'concrete-reinforcement': return <ConcreteReinforcementModule />;
        case 'planetary-gearbox': return <PlanetaryCalculator />;
        case 'settings': return <SettingsModule />;
        case 'engineering-notes': return <EngineeringNotesModule />;
        case 'file-explorer': return <FileExplorerModule />;
        case 'project-manager': return <ProjectManagerModule />;
        case 'project-vault': return <ProjectVault />;
        case 'browser': return <BrowserModule />;
        case 'terminal': return <TerminalModule />;
        case 'cost-estimator': return <RealTimeCostModule />;
        case 'ai-copilot': return <AiCoPilotModule />;
        case 'holographic-viewer': return <HolographicViewer />;
        case 'parametric-cad': return <ParametricCadModule />;
        case 'flow': return <FlowCanvasModule className="w-full h-full" />;
        case 'matrix-screensaver': return <MatrixScreensaverModule />;
        case 'factory-sim': return <FactorySimulation />;
        case 'project-sim': return <ProjectSimulator />;
        default:
            const isHeadless = (calculatorsDB as any[]).find(c => c.slug === type);
            if (isHeadless) {
                return <HeadlessCalculatorWindow calculatorConfig={isHeadless as any} />;
            }
            return <PlaceholderModule type={type} />;
    }
}
