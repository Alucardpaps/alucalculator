'use client';

import { ModuleType } from '@/config/modules';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { Monitor, Hexagon, Target, Activity } from 'lucide-react';

// Lazy load modules - Mechanical
const ProfileWeightModule = dynamic(() => import('@/components/modules/mechanical/ProfileWeightModule').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });
const GearsModule = dynamic(() => import('@/components/modules/mechanical/GearsModule').then(mod => mod.GearsModule as any), { loading: () => <ModuleLoading /> });
const Nesting2DModule = dynamic(() => import('@/components/modules/mechanical/Nesting2DModule').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });
const MaterialsDatabaseModule = dynamic(() => import('@/components/modules/mechanical/MaterialsDatabaseModule').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });
const WeldingModule = dynamic(() => import('@/components/modules/mechanical/WeldingModule').then(mod => mod.WeldingModule as any), { loading: () => <ModuleLoading /> });
const ManufacturingModule = dynamic(() => import('@/components/modules/mechanical/ManufacturingModule').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });
const ManufacturingSandbox = dynamic(() => import('@/components/modules/mechanical/ManufacturingModule').then(mod => mod.ManufacturingSandbox as any), { loading: () => <ModuleLoading /> });
const FastenersModule = dynamic(() => import('@/components/modules/mechanical/FastenersModule').then(mod => mod.FastenersModule as any), { loading: () => <ModuleLoading /> });
const BearingsModule = dynamic(() => import('@/components/modules/mechanical/BearingAnalysisModule').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });
const FitsTolerancesModule = dynamic(() => import('@/components/modules/mechanical/FitsTolerancesModule').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });
const MohrStressModule = dynamic(() => import('@/components/modules/mechanical/MohrStressModule').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });
const CuttingOptimizerModule = dynamic(() => import('@/components/modules/mechanical/CuttingOptimizerModule').then(mod => mod.CuttingOptimizerModule as any), { loading: () => <ModuleLoading /> });
const PumpsModule = dynamic(() => import('@/components/modules/mechanical/PumpsModule').then(mod => mod.PumpsModule as any), { loading: () => <ModuleLoading /> });
const SheetMetalModule = dynamic(() => import('@/components/modules/mechanical/SheetMetalModule').then(mod => mod.SheetMetalModule as any), { loading: () => <ModuleLoading /> });
const ThermalExpansionModule = dynamic(() => import('@/components/modules/mechanical/ThermalExpansionModule').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });
const HandbookModule = dynamic(() => import('@/components/modules/reference/EngineeringHandbookModule').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });
const EngineeringSelectionSystem = dynamic(() => import('@/components/modules/engineering/EngineeringSelectionSystem').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });
const FluidDynamicsModule = dynamic(() => import('@/modules/mechanical/FluidDynamics').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });
const BoltTorqueModule = dynamic(() => import('@/components/modules/mechanical/FastenerAssemblyModule').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });
const FatigueAnalysisModule = dynamic(() => import('@/components/modules/mechanical/FatigueAnalysisModule').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });
const EngineeringNotesModule = dynamic(() => import('@/modules/system/EngineeringNotes').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });

// Advanced Engineering V2 Modules
const MaterialAIModule = dynamic(() => import('@/components/modules/ai/MaterialAIModule').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });

import type { UniversalCalcRendererProps } from '@/components/calculators/UniversalCalcRenderer';
const UniversalCalcRenderer = dynamic<UniversalCalcRendererProps>(() => 
    import('@/components/calculators/UniversalCalcRenderer').then(mod => mod.UniversalCalcRenderer as any), 
    { loading: () => <ModuleLoading /> }
);

const LinearEngineRenderer = dynamic<{ flowId: string; lang?: string; dict?: any }>(() => 
    import('@/components/calculators/LinearEngineRenderer').then(mod => mod.LinearEngineRenderer as any), 
    { loading: () => <ModuleLoading /> }
);

// V2 Schemas
import motorSelectionSchema from '@/calculators/schemas-v2/motor-selection';
import failureAnalysisSchema from '@/calculators/schemas-v2/failure-analysis';
import fatigueLifeSnSchema from '@/calculators/schemas-v2/fatigue-life-sn';

// Engineering Workstation Expansions
const MaterialsExplorer = dynamic(() => import('@/components/modules/MaterialsExplorer').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });
const PhysicsSolver = dynamic(() => import('@/components/modules/PhysicsSolver').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });
const ProjectVault = dynamic(() => import('@/components/modules/ProjectVault').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });

// New Multi-Disciplinary Expansion (Phase F & User Request)
const PhysicsKinematicsModule = dynamic(() => import('@/modules/science/PhysicsKinematics').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });
const ChemistryReactionsModule = dynamic(() => import('@/modules/science/ChemistryReactions').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });
const BiologyGeneticsModule = dynamic(() => import('@/modules/science/BiologyGenetics').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });
const CSAlgorithmsModule = dynamic(() => import('@/modules/software/CSAlgorithms').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });
const AerospaceDynamicsModule = dynamic(() => import('@/modules/mechanical/AerospaceDynamics').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });
const NavalHydrostaticsModule = dynamic(() => import('@/modules/mechanical/NavalHydrostatics').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });

// Electrical
const OhmsLawModule = dynamic(() => import('@/components/modules/electrical/OhmsLawModule').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });
const VoltageDropModule = dynamic(() => import('@/components/modules/electrical/VoltageDropModule').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });

// Civil
const BeamDeflectionModule = dynamic(() => import('@/components/modules/civil/BeamDeflectionModule').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });

// Finance
const VatCalculatorModule = dynamic(() => import('@/components/modules/finance/VatCalculatorModule').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });

// Science
const UnitConverterModule = dynamic(() => import('@/components/modules/science/UnitConverterModule').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });
const PeriodicTableModule = dynamic(() => import('@/components/modules/science/PeriodicTableModule').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });
const CalculatorModule = dynamic(() => import('@/components/modules/science/CalculatorModule').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });

// Software
const JsonFormatterModule = dynamic(() => import('@/components/modules/software/JsonFormatterModule').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });
const RegexTesterModule = dynamic(() => import('@/components/modules/software/RegexTesterModule').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });

// Other
const FeedbackModule = dynamic(() => import('@/components/modules/other/FeedbackModule').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });
const NewsModule = dynamic(() => import('@/components/modules/other/NewsModule').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });
const ExcelHelperModule = dynamic(() => import('@/components/modules/software/ExcelHelperModule').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });

// OS 2.0
const FileExplorerModule = dynamic(() => import('@/components/modules/os/FileExplorerModule').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });
const TerminalModule = dynamic(() => import('@/components/modules/os/TerminalModule').then(mod => mod.default), { loading: () => <ModuleLoading /> });
const MediaPlayerModule = dynamic(() => import('@/components/modules/media/MediaPlayerModule').then(mod => mod.MediaPlayerModule), { loading: () => <ModuleLoading /> });

const PDFViewerModule = dynamic(() => import('@/components/modules/viewers/PDFViewerModule').then(mod => mod.PDFViewerModule), { loading: () => <ModuleLoading /> });
const SpreadsheetViewerModule = dynamic(() => import('@/components/modules/viewers/SpreadsheetViewerModule').then(mod => mod.SpreadsheetViewerModule), { loading: () => <ModuleLoading /> });
const BrowserModule = dynamic(() => import('@/components/modules/software/BrowserModule').then(mod => mod.BrowserModule), { loading: () => <ModuleLoading /> });
const AICopilotModule = dynamic(() => import('@/components/modules/ai/AICopilotModule').then(mod => mod.AICopilotModule), { loading: () => <ModuleLoading /> });
const HolographicViewerModule = dynamic(() => import('@/components/modules/presentation/HolographicViewer').then(mod => mod.HolographicViewer), { loading: () => <ModuleLoading /> });
const MatrixScreensaverModule = dynamic(() => import('@/components/modules/presentation/MatrixScreensaverModule').then(mod => mod.MatrixScreensaverModule), { loading: () => <ModuleLoading /> });
const VariableManagerModule = dynamic(() => import('@/components/os/VariableManager').then(mod => mod.VariableManager as any), { loading: () => <ModuleLoading /> });
const SettingsModule = dynamic(() => import('@/components/modules/os/SettingsModule').then(mod => mod.default), { loading: () => <ModuleLoading /> });
const ProjectManagerModule = dynamic(() => import('@/components/modules/os/ProjectManagerModule').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });

// Elite Modules (Phase D)
const RealTimeCostModule = dynamic(() => import('@/modules/finance/RealTimeCost').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });
const MfgReadinessModule = dynamic(() => import('@/modules/mechanical/MfgReadiness').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });
const GenerativeLiteModule = dynamic(() => import('@/modules/generative/GenerativeLite').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });
const DragAndBuildModule = dynamic(() => import('@/modules/mechanical/DragAndBuild').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });
const FailurePredictionModule = dynamic(() => import('@/modules/mechanical/FailurePrediction').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });


const ReducerModule = dynamic(() => import('@/components/modules/mechanical/ReducerModule').then(mod => mod.ReducerModule as any), { loading: () => <ModuleLoading /> });
const BoxProfileDetectorModule = dynamic(() => import('@/components/modules/mechanical/BoxProfileDetectorModule').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });
const GearboxDesignModule = dynamic(() => import('@/components/modules/mechanical/GearboxDesignModule').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });

const ParametricCadModule = dynamic(() => import('@/components/modules/parametric/ParametricCadModule').then(mod => mod.default), { loading: () => <ModuleLoading /> });

// CAD Editor (AluCalc OS 2.0)
const CadEditorModule = dynamic(() => import('@/cad/components/AluCAD').then(mod => mod.AluCAD), { loading: () => <ModuleLoading /> });

// Flow Editor (DELETED)

// Analytics & Simulation
const AnalyticsDashboardModule = dynamic(() => import('@/components/modules/other/AnalyticsDashboardModule').then(mod => mod.default), { loading: () => <ModuleLoading /> });
const SimulationFEAModule = dynamic(() => import('@/components/modules/mechanical/SimulationFEAModule').then(mod => mod.SimulationFEAModule as any), { loading: () => <ModuleLoading /> });

// Creative
const DeskCanvasModule = dynamic(() => import('@/components/modules/desk/DeskCanvas').then(mod => mod.default), { loading: () => <ModuleLoading /> });
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
            {/* Background Grid Accent */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px]" />

            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative z-10 flex flex-col items-center max-w-md w-full px-8 py-12 bg-white/[0.02] border border-white/10 rounded-[32px] backdrop-blur-2xl text-center shadow-2xl"
            >
                <div className="relative w-24 h-24 mb-8">
                    <div className="absolute inset-0 bg-blue-500/20 rounded-2xl animate-pulse blur-xl" />
                    <div className="relative w-full h-full rounded-2xl bg-[#0a101f] border border-blue-500/40 flex items-center justify-center shadow-[0_0_30px_rgba(59,130,246,0.2)]">
                        <Monitor size={40} className="text-blue-400" />
                        
                        {/* Scanning Effect Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-blue-500/20 to-transparent h-1/2 w-full animate-[scan_2s_ease-in-out_infinite]" />
                    </div>
                </div>

                <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase mb-2">Module Assembly</h2>
                <div className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[9px] font-black tracking-widest uppercase mb-6">
                    {type}
                </div>

                <p className="text-slate-400 text-xs leading-relaxed mb-10 font-medium">
                    This engineering node is currently in synthesis.
                    Logic integration and CAD viewport mapping in progress.
                </p>

                <div className="flex items-center gap-2 text-cyan-500/60 text-[10px] font-bold tracking-widest uppercase animate-pulse">
                    <div className="w-2 h-2 rounded-full bg-cyan-500" />
                    Connecting to Engineering Core...
                </div>
            </motion.div>

            {/* Corner Decorative Elements */}
            <div className="absolute top-10 left-10 w-20 h-20 border-l border-t border-white/5 opacity-40" />
            <div className="absolute bottom-10 right-10 w-20 h-20 border-r border-b border-white/5 opacity-40" />
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

export function WindowContent({ type }: WindowContentProps) {
    const { currentLanguage, dictionary } = useOSStore();

    // 1. Check if this is a dynamically registered UDA Module
    const DynamicComponent = ModuleRegistry.getComponentByType(type);
    if (DynamicComponent) {
        return <DynamicComponent lang={currentLanguage} dict={dictionary} />;
    }

    switch (type) {
        // Mechanical
        case 'profile-weight':
            return <ProfileWeightModule {...({ lang: currentLanguage, dict: dictionary } as any)} />;
        case 'gears-bearings':
            return <GearsModule {...({ lang: currentLanguage, dict: dictionary } as any)} />;
        case 'nesting-2d':
            return <Nesting2DModule {...({ lang: currentLanguage, dict: dictionary } as any)} />;
        case 'materials-db':
            return <MaterialsDatabaseModule {...({ lang: currentLanguage, dict: dictionary } as any)} />;
        case 'welding':
            return <WeldingModule {...({ lang: currentLanguage, dict: dictionary } as any)} />;
        case 'manufacturing':
            return <ManufacturingModule />;
        case 'manufacturing-sandbox':
            return <ManufacturingSandbox />;
        case 'fasteners':
            return <BoltTorqueModule {...({ lang: currentLanguage, dict: dictionary } as any)} />;
        case 'bearings':
            return <BearingsModule {...({ lang: currentLanguage, dict: dictionary } as any)} />;
        case 'fits-tolerances':
            return <FitsTolerancesModule {...({ lang: currentLanguage, dict: dictionary } as any)} />;
        case 'strength-analysis':
            return <MohrStressModule {...({ lang: currentLanguage, dict: dictionary } as any)} />;
        case 'cutting-optimizer':
            return <CuttingOptimizerModule {...({ lang: currentLanguage, dict: dictionary } as any)} />;
        case 'pumps':
            return <PumpsModule {...({ lang: currentLanguage, dict: dictionary } as any)} />;
        case 'sheet-metal':
            return <SheetMetalModule {...({ lang: currentLanguage, dict: dictionary } as any)} />;
        case 'thermal-expansion':
            return <ThermalExpansionModule />;
        case 'handbook':
            return <HandbookModule {...({ lang: currentLanguage, dict: dictionary } as any)} />;
        case 'engineering-selection':
            return <EngineeringSelectionSystem />;
        case 'fluid-dynamics':
            return <FluidDynamicsModule />;
        case 'bolt-torque':
            return <BoltTorqueModule />;
        case 'fatigue-analysis':
            return <FatigueAnalysisModule />;
        case 'fatigue-advanced':
            return <UniversalCalcRenderer schema={fatigueLifeSnSchema} />;
        case 'motor-selection-std':
            return <UniversalCalcRenderer schema={motorSelectionSchema} />;
        case 'failure-diagnosis':
            return <UniversalCalcRenderer schema={failureAnalysisSchema} />;
        case 'material-selector-ai':
            return <MaterialAIModule />;
        case 'gearbox-design':
            return <GearboxDesignModule />;
        case 'engineering-notes':
            return <EngineeringNotesModule />;

        // Multi-Disciplinary Science & Aerospace
        case 'physics-kinematics':
            return <PhysicsKinematicsModule />;
        case 'chemistry-reactions':
            return <ChemistryReactionsModule />;
        case 'biology-genetics':
            return <BiologyGeneticsModule />;
        case 'cs-algorithms':
            return <CSAlgorithmsModule />;
        case 'aerospace-dynamics':
            return <AerospaceDynamicsModule />;
        case 'naval-hydrostatics':
            return <NavalHydrostaticsModule />;

        // Electrical
        case 'ohms-law':
            return <OhmsLawModule />;
        case 'voltage-drop':
            return <VoltageDropModule />;

        // Civil
        case 'beam-deflection':
            return <BeamDeflectionModule />;

        // Finance
        case 'vat-calculator':
            return <VatCalculatorModule />;

        // Science
        case 'periodic-table':
            return <PeriodicTableModule {...({ lang: currentLanguage, dict: dictionary } as any)} />;
        case 'unit-converter':
            return <UnitConverterModule />;
        case 'calculator':
            return <CalculatorModule />;

        // Software
        case 'json-formatter':
            return <JsonFormatterModule />;
        case 'regex-tester':
            return <RegexTesterModule />;
        case 'excel-helper':
            return <ExcelHelperModule />;

        // Other
        case 'feedback':
            return <FeedbackModule />;
        case 'news':
            return <NewsModule />;

        // OS 2.0
        case 'ai-copilot':
            return <AICopilotModule />;
        case 'holographic-viewer':
            return <HolographicViewerModule />;
        case 'matrix-screensaver':
            return <MatrixScreensaverModule />;
        case 'file-explorer':
            return <FileExplorerModule />;
        case 'media-player':
            return <MediaPlayerModule />;
        case 'pdf-viewer':
            return <PDFViewerModule />;
        case 'spreadsheet-viewer':
            return <SpreadsheetViewerModule />;
        case 'browser':
            return <BrowserModule />;

        // ... Mechanical
        case 'reducer-lubrication':
            return <ReducerModule {...({ lang: currentLanguage, dict: dictionary } as any)} />;

        // Box Profile (AI/Mech)
        case 'box-profile-detector':
            return <BoxProfileDetectorModule />;

        // Parametric CAD
        case 'parametric-cad':
            return <ParametricCadModule />;

        // CAD Editor (AluCalc OS 2.0)
        case 'cad-editor':
            return <CadEditorModule className="w-full h-full" />;

        // Analytics & Simulation
        case 'analytics-dashboard':
            return <AnalyticsDashboardModule />;
        case 'simulation-fea':
            return <SimulationFEAModule />;

        // Creative
        case 'sketch-pad':
            return <ExcalidrawModule />;

        case 'project-variables':
            return <VariableManagerModule />;

        case 'project-manager':
            return <ProjectManagerModule />;

        // Elite Phase D Wiring
        case 'cost-estimator':
            return <RealTimeCostModule />;
        case 'manufacturing-readiness':
            return <MfgReadinessModule />;
        case 'topology-optimization':
            return <GenerativeLiteModule />;
        case 'machine-assembly':
            return <DragAndBuildModule />;
        case 'failure-prediction':
            return <FailurePredictionModule />;

        case 'settings':
            return <SettingsModule />;

        // Terminal CLI
        case 'terminal':
            return <TerminalModule />;

        // Engineering Workstation Expansions
        case 'materials-explorer':
            return <MaterialsExplorer />;
        case 'physics-solver':
            return <PhysicsSolver />;
        case 'project-vault':
            return <ProjectVault />;

        default:
            const isHeadless = calculatorsDB.find(c => c.slug === type);
            if (isHeadless) {
                return <HeadlessCalculatorWindow calculatorConfig={isHeadless as any} />;
            }
            return <PlaceholderModule type={type} />;
    }
}
