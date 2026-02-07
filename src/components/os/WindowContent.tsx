'use client';

import { ModuleType } from '@/config/modules';
import dynamic from 'next/dynamic';

// Lazy load modules - Mechanical
const ProfileWeightModule = dynamic(() => import('@/components/modules/mechanical/ProfileWeightModule').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });
const GearsModule = dynamic(() => import('@/components/modules/mechanical/GearsModule').then(mod => mod.GearsModule as any), { loading: () => <ModuleLoading /> });
const Nesting2DModule = dynamic(() => import('@/components/modules/mechanical/Nesting2DModule').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });
const MaterialsDatabaseModule = dynamic(() => import('@/components/modules/mechanical/MaterialsDatabaseModule').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });
const WeldingModule = dynamic(() => import('@/components/modules/mechanical/WeldingModule').then(mod => mod.WeldingModule as any), { loading: () => <ModuleLoading /> });
const FastenersModule = dynamic(() => import('@/components/modules/mechanical/FastenersModule').then(mod => mod.FastenersModule as any), { loading: () => <ModuleLoading /> });
const BearingsModule = dynamic(() => import('@/components/modules/mechanical/BearingsModule').then(mod => mod.BearingsModule as any), { loading: () => <ModuleLoading /> });
const FitsTolerancesModule = dynamic(() => import('@/components/modules/mechanical/FitsTolerancesModule').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });
const MohrStressModule = dynamic(() => import('@/components/modules/mechanical/MohrStressModule').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });
const CuttingOptimizerModule = dynamic(() => import('@/components/modules/mechanical/CuttingOptimizerModule').then(mod => mod.CuttingOptimizerModule as any), { loading: () => <ModuleLoading /> });
const PumpsModule = dynamic(() => import('@/components/modules/mechanical/PumpsModule').then(mod => mod.PumpsModule as any), { loading: () => <ModuleLoading /> });
const SheetMetalModule = dynamic(() => import('@/components/modules/mechanical/SheetMetalModule').then(mod => mod.SheetMetalModule as any), { loading: () => <ModuleLoading /> });
const HandbookModule = dynamic(() => import('@/components/modules/mechanical/HandbookModule').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });

// Civil
const BeamDeflectionModule = dynamic(() => import('@/components/modules/civil/BeamDeflectionModule').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });
const ConcreteReinforcementModule = dynamic(() => import('@/components/modules/civil/ConcreteReinforcementModule').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });

// Electrical
const OhmsLawModule = dynamic(() => import('@/components/modules/electrical/OhmsLawModule').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });
const VoltageDropModule = dynamic(() => import('@/components/modules/electrical/VoltageDropModule').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });

// Science
const UnitConverterModule = dynamic(() => import('@/components/modules/science/UnitConverterModule').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });
const PeriodicTableModule = dynamic(() => import('@/components/modules/science/PeriodicTableModule').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });
const CalculatorModule = dynamic(() => import('@/components/modules/science/CalculatorModule').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });

// Finance
const VatCalculatorModule = dynamic(() => import('@/components/modules/finance/VatCalculatorModule').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });
const ExcelHelperModule = dynamic(() => import('@/components/modules/finance/ExcelHelperModule').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });

// Software
const JsonFormatterModule = dynamic(() => import('@/components/modules/software/JsonFormatterModule').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });
const RegexTesterModule = dynamic(() => import('@/components/modules/software/RegexTesterModule').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });

// Other
const FeedbackModule = dynamic(() => import('@/components/modules/other/FeedbackModule').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });
const NewsModule = dynamic(() => import('@/components/modules/other/NewsModule').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });

// OS 2.0
const FileExplorerModule = dynamic(() => import('@/components/modules/os/FileExplorerModule').then(mod => mod.FileExplorerModule), { loading: () => <ModuleLoading /> });
const MediaPlayerModule = dynamic(() => import('@/components/modules/media/MediaPlayerModule').then(mod => mod.MediaPlayerModule), { loading: () => <ModuleLoading /> });
const ImageViewerModule = dynamic(() => import('@/components/modules/viewers/ImageViewerModule').then(mod => mod.ImageViewerModule), { loading: () => <ModuleLoading /> });
const PDFViewerModule = dynamic(() => import('@/components/modules/viewers/PDFViewerModule').then(mod => mod.PDFViewerModule), { loading: () => <ModuleLoading /> });
const SpreadsheetViewerModule = dynamic(() => import('@/components/modules/viewers/SpreadsheetViewerModule').then(mod => mod.SpreadsheetViewerModule), { loading: () => <ModuleLoading /> });
const BrowserModule = dynamic(() => import('@/components/modules/software/BrowserModule').then(mod => mod.BrowserModule), { loading: () => <ModuleLoading /> });
const PaintModule = dynamic(() => import('@/components/modules/creative/PaintModule').then(mod => mod.PaintModule), { loading: () => <ModuleLoading /> });
const AICopilotModule = dynamic(() => import('@/components/modules/ai/AICopilotModule').then(mod => mod.AICopilotModule), { loading: () => <ModuleLoading /> });

const ReducerModule = dynamic(() => import('@/components/modules/mechanical/ReducerModule').then(mod => mod.ReducerModule as any), { loading: () => <ModuleLoading /> });
const BoxProfileDetectorModule = dynamic(() => import('@/components/modules/mechanical/BoxProfileDetectorModule').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });
const CostEstimatorModule = dynamic(() => import('@/components/modules/finance/CostEstimatorModule').then(mod => mod.default as any), { loading: () => <ModuleLoading /> });

// Flow Editor (AluCalc OS 2.0)
const FlowEditorModule = dynamic(() => import('@/components/flow/FlowCanvas').then(mod => mod.default), { loading: () => <ModuleLoading /> });

function ModuleLoading() {
    return (
        <div className="flex items-center justify-center h-full" style={{ color: 'var(--color-os-text-secondary)' }}>
            <div className="animate-pulse">Loading...</div>
        </div>
    );
}

function PlaceholderModule({ type }: { type: ModuleType }) {
    return (
        <div className="flex flex-col items-center justify-center h-full gap-4" style={{ color: 'var(--color-os-text-secondary)' }}>
            <div className="text-4xl">🚧</div>
            <div className="text-sm text-center">
                <div className="font-medium mb-1">{type}</div>
                <div className="text-xs opacity-60">Module coming soon</div>
            </div>
        </div>
    );
}

interface WindowContentProps {
    type: ModuleType;
}

// ... imports
import { useOSStore } from '@/store/osStore';

// ... dynamic imports

export function WindowContent({ type }: WindowContentProps) {
    const { currentLanguage, dictionary } = useOSStore();

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
        case 'fasteners':
            return <FastenersModule {...({ lang: currentLanguage, dict: dictionary } as any)} />;
        case 'bearings':
            return <BearingsModule {...({ lang: currentLanguage, dict: dictionary } as any)} />;
        case 'fits-tolerances':
            return <FitsTolerancesModule {...({ lang: currentLanguage, dict: dictionary } as any)} />;
        case 'strength-analysis':
            // Ensure MohrStressModule handles "strength-analysis" or map it
            return <MohrStressModule {...({ lang: currentLanguage, dict: dictionary } as any)} />;
        case 'cutting-optimizer':
            return <CuttingOptimizerModule {...({ lang: currentLanguage, dict: dictionary } as any)} />;
        case 'pumps':
            return <PumpsModule {...({ lang: currentLanguage, dict: dictionary } as any)} />;
        case 'sheet-metal':
            return <SheetMetalModule {...({ lang: currentLanguage, dict: dictionary } as any)} />;
        case 'handbook':
            return <HandbookModule {...({ lang: currentLanguage, dict: dictionary } as any)} />;

        // Civil
        case 'beam-deflection':
            return <BeamDeflectionModule />;
        case 'concrete-reinforcement':
            return <ConcreteReinforcementModule />;

        // Electrical
        case 'ohms-law':
            return <OhmsLawModule />;
        case 'voltage-drop':
            return <VoltageDropModule />;

        // Science
        case 'periodic-table':
            return <PeriodicTableModule {...({ lang: currentLanguage, dict: dictionary } as any)} />;
        case 'unit-converter':
            return <UnitConverterModule />;
        case 'calculator':
            return <CalculatorModule />;

        // Finance
        case 'vat-calculator':
            return <VatCalculatorModule />;
        case 'excel-helper':
            return <ExcelHelperModule />;

        // Software
        case 'json-formatter':
            return <JsonFormatterModule />;
        case 'regex-tester':
            return <RegexTesterModule />;

        // Other
        case 'feedback':
            return <FeedbackModule />;
        case 'news':
            return <NewsModule />;



        // ... existing code ...

        // OS 2.0
        case 'ai-copilot':
            return <AICopilotModule />;
        case 'file-explorer':
            return <FileExplorerModule />;
        case 'media-player':
            return <MediaPlayerModule />;
        case 'image-viewer':
            return <ImageViewerModule />;
        case 'pdf-viewer':
            return <PDFViewerModule />;
        case 'spreadsheet-viewer':
            return <SpreadsheetViewerModule />;
        case 'browser':
            return <BrowserModule />;
        case 'paint':
            return <PaintModule />;

        // ... Mechanical
        case 'reducer-lubrication':
            return <ReducerModule {...({ lang: currentLanguage, dict: dictionary } as any)} />;

        // Finance
        case 'cost-estimator':
            return <CostEstimatorModule />;

        // Box Profile (AI/Mech)
        case 'box-profile-detector':
            return <BoxProfileDetectorModule />;

        // Flow Editor (AluCalc OS 2.0)
        case 'flow-editor':
            return <FlowEditorModule className="w-full h-full" />;

        default:
            return <PlaceholderModule type={type} />;
    }
}

