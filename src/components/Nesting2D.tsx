"use client";

import { useState, useCallback, useMemo, useEffect } from 'react';
import { 
    Settings, Play, Download, AlertCircle, CheckCircle2, 
    Loader2, Grid2x2, Layers, Cpu, Maximize2, RotateCcw, Activity, FileText,
    Flame, Compass, ArrowRight, ShieldCheck, Zap,
    PanelLeftClose, PanelLeftOpen, FileSpreadsheet
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { NestingCanvas } from './NestingCanvas';
import { PartUploader } from './DxfUploader';
import { DynamicBlockNestingModal } from './DynamicBlockNestingModal';
import { ExcelBomImportModal } from './ExcelBomImportModal';
import { SigmaNestReportModal } from './SigmaNestReportModal';
import { useNestingWorker } from '@/hooks/useNestingWorker';
import { exportToDXF, downloadDXF } from '@/utils/dxfExporter';
import { useAssemblyStore } from '@/lib/store/assemblyStore';
import type { 
    Part2D, Sheet2D, NestingOptions, NestingResult, PlacedPart, FreeRectangle, 
    RemnantSheet2D, SigmaNestReportData 
} from '@/types/nesting2d.types';
import { 
    DEFAULT_PLASMA_PROFILES, 
    type PlasmaProcessProfile,
    sequenceThermalJob, 
    type SequencedJobResult,
    type SequenceStrategyType,
    type CuttingSequenceOptions,
    emitGCode, 
    type GCodeDialect,
    backplotGCode,
    packPartsHexagonal,
    type CamPart,
    buildSigmaNestReportData
} from '@/cam';
import { consumeNestingImport, CrossModuleBridge } from '@/system/crossModuleBridge';

interface Nesting2DProps {
    dict?: Record<string, unknown>;
    lang?: string;
}

const SHEET_PRESETS = [
    { label: '2500 × 1250', width: 2500, height: 1250 },
    { label: '3000 × 1500', width: 3000, height: 1500 },
    { label: '6000 × 2000', width: 6000, height: 2000 },
    { label: '8000 × 2500', width: 8000, height: 2500 },
    { label: '12000 × 3000', width: 12000, height: 3000 },
    { label: '16000 × 3000 (16m)', width: 16000, height: 3000 },
];

export function Nesting2D({ dict = {}, lang = 'en' }: Nesting2DProps) {
    // Sidebar collapse state (to allow 100% full-screen canvas)
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    // State
    const [parts, setParts] = useState<Part2D[]>([]);
    const [sheet, setSheet] = useState<Sheet2D>({ width: 2500, height: 1250, kerf: 1.2 });
    const [options, setOptions] = useState<NestingOptions>({
        rotationStep: 90,
        spacing: 6,
        algorithm: 'sigmanest',
        heuristic: 'best-area-fit',
        multiSheet: true,
        maxSheets: 10,
        enablePartInPart: true,
        enableRemnantGeneration: true,
        minRemnantDimensionMm: 400,
        downstreamClustering: true,
    });
    const [currentSheetIndex, setCurrentSheetIndex] = useState(0);
    const [materialCostPerM2, setMaterialCostPerM2] = useState(12);

    // Dynamic Block Modal state
    const [isDynamicBlockModalOpen, setIsDynamicBlockModalOpen] = useState(false);
    const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [inventoryRemnants, setInventoryRemnants] = useState<RemnantSheet2D[]>([]);
    const [useRemnantsFirst, setUseRemnantsFirst] = useState(true);

    // Active Navigation Tab: 'nesting' vs 'plasma_cam'
    const [activeTab, setActiveTab] = useState<'nesting' | 'plasma_cam'>('nesting');

    // Plasma CAM State
    const [selectedProfileId, setSelectedProfileId] = useState<string>('mild_steel_3mm_45A');
    const [selectedDialect, setSelectedDialect] = useState<GCodeDialect>('mach3_plasma');
    const [selectedStrategy, setSelectedStrategy] = useState<SequenceStrategyType>('progressive-common-line');
    const [enableTrueHole, setEnableTrueHole] = useState<boolean>(true);
    const [enableCornerLoop, setEnableCornerLoop] = useState<boolean>(true);
    const [enableMicrojoint, setEnableMicrojoint] = useState<boolean>(true);
    const [microjointTabWidth, setMicrojointTabWidth] = useState<number>(2.0);
    const [microjointCount, setMicrojointCount] = useState<number>(2);

    // Kesim Otomasyonları & Köprüleme (Bridge Cutting & Collision Avoidance)
    const [enableBridgeCutting, setEnableBridgeCutting] = useState<boolean>(true);
    const [maxBridgeDistanceMm, setMaxBridgeDistanceMm] = useState<number>(35);
    const [enableCollisionAvoidance, setEnableCollisionAvoidance] = useState<boolean>(true);
    const [automationPreset, setAutomationPreset] = useState<'standard' | 'min-pierce' | 'anti-warp' | 'anti-tip' | 'precision'>('min-pierce');

    // Sabitleme Noktaları (Plazma Sabit Kenar & Anchor Tabs - Image 2)
    const [enableAnchorTabs, setEnableAnchorTabs] = useState<boolean>(true);
    const [anchorTabMode, setAnchorTabMode] = useState<'count' | 'spacing'>('count');
    const [anchorTabCount, setAnchorTabCount] = useState<number>(4);
    const [anchorTabSpacingMm, setAnchorTabSpacingMm] = useState<number>(500);
    const [anchorTabWidthMm, setAnchorTabWidthMm] = useState<number>(3.0);
    const [cutAnchorEdgeLast, setCutAnchorEdgeLast] = useState<boolean>(true);

    const [toolpathJob, setToolpathJob] = useState<SequencedJobResult | null>(null);
    const [hexResult, setHexResult] = useState<NestingResult | null>(null);
    const [sigmaResult, setSigmaResult] = useState<NestingResult | null>(null);

    // 1-Click Automation Preset Applicator
    const applyAutomationPreset = useCallback((preset: 'min-pierce' | 'anti-warp' | 'anti-tip' | 'precision') => {
        setAutomationPreset(preset);
        if (preset === 'min-pierce') {
            setSelectedStrategy('progressive-common-line');
            setEnableBridgeCutting(true);
            setMaxBridgeDistanceMm(40);
            setEnableMicrojoint(true);
            setMicrojointTabWidth(2.0);
            setMicrojointCount(2);
            setEnableCollisionAvoidance(true);
            setOptions(o => ({ ...o, commonLine: true, spacing: 0 }));
        } else if (preset === 'anti-warp') {
            setSelectedStrategy('heat-minimizing');
            setEnableBridgeCutting(false);
            setEnableMicrojoint(true);
            setMicrojointTabWidth(2.5);
            setMicrojointCount(2);
            setEnableCollisionAvoidance(true);
            setOptions(o => ({ ...o, commonLine: false, spacing: 6 }));
        } else if (preset === 'anti-tip') {
            setSelectedStrategy('progressive-common-line');
            setEnableBridgeCutting(true);
            setEnableMicrojoint(true);
            setMicrojointTabWidth(3.0);
            setMicrojointCount(4);
            setEnableCollisionAvoidance(true);
        } else if (preset === 'precision') {
            setSelectedStrategy('true-hole-precision');
            setEnableBridgeCutting(false);
            setEnableMicrojoint(false);
            setEnableTrueHole(true);
            setEnableCornerLoop(true);
            setEnableCollisionAvoidance(true);
            setOptions(o => ({ ...o, commonLine: false, spacing: 8 }));
        }
    }, []);

    // Worker hook for Guillotine/MaxRects
    const { run, progress, result: workerResult, error, isRunning, reset } = useNestingWorker();

    // The active result is SigmaNEST synchronous result, hexagonal, or worker result
    const result = sigmaResult || hexResult || workerResult;

    // Current Plasma Process Profile
    const currentProfile: PlasmaProcessProfile = useMemo(() => {
        return DEFAULT_PLASMA_PROFILES[selectedProfileId] || DEFAULT_PLASMA_PROFILES['mild_steel_3mm_45A'];
    }, [selectedProfileId]);

    // Handle process profile selection
    const handleProfileSelect = (id: string) => {
        setSelectedProfileId(id);
        const p = DEFAULT_PLASMA_PROFILES[id];
        if (p) {
            setSheet(s => ({ ...s, kerf: p.kerfMm }));
        }
    };

    // Ingest pending imports from 2D CAD, 3D Studio, or Dynamic Blocks on mount
    useEffect(() => {
        const imported = consumeNestingImport();
        if (imported && imported.length > 0) {
            setParts(prev => [...prev, ...imported]);
        }
    }, []);

    // Helper: Convert Part2D to CamPart for toolpath generator
    const part2DToCamPart = useCallback((p: Part2D): CamPart => {
        return {
            id: p.id,
            label: p.label,
            outerContour: {
                id: `${p.id}-outer`,
                segments: [],
                points: p.polygon.points,
                isClosed: true,
                role: 'outer',
                area: p.polygon.area,
                bounds: {
                    minX: p.polygon.bounds.x,
                    minY: p.polygon.bounds.y,
                    maxX: p.polygon.bounds.x + p.polygon.bounds.width,
                    maxY: p.polygon.bounds.y + p.polygon.bounds.height,
                    width: p.polygon.bounds.width,
                    height: p.polygon.bounds.height,
                },
                isClockwise: false,
            },
            holes: (p.innerPolygons || []).map((h, i) => ({
                id: `${p.id}-hole-${i}`,
                segments: [],
                points: h.points,
                isClosed: true,
                role: 'hole',
                area: h.area,
                bounds: {
                    minX: h.bounds.x,
                    minY: h.bounds.y,
                    maxX: h.bounds.x + h.bounds.width,
                    maxY: h.bounds.y + h.bounds.height,
                    width: h.bounds.width,
                    height: h.bounds.height,
                },
                isClockwise: true,
            })),
            quantity: p.quantity,
            allowedRotations: p.allowedRotations,
            cuttingMode: p.cuttingMode,
            allowCommonLine: p.allowCommonLine,
            enableBridge: p.enableBridge,
            microjointCount: p.microjointCount,
            microjointWidthMm: p.microjointWidthMm,
        };
    }, []);

    // Handle BOM parts import
    const handleImportBomParts = useCallback((newParts: Part2D[], updatedExisting?: Part2D[]) => {
        setParts(prev => {
            const base = updatedExisting || prev;
            return [...base, ...newParts];
        });
        if (result) {
            reset();
            setHexResult(null);
            setSigmaResult(null);
        }
    }, [result, reset]);

    // Compute thermal sequence and toolpaths whenever placed parts change
    const computeCamToolpaths = useCallback((
        placedParts: PlacedPart[], 
        profile: PlasmaProcessProfile, 
        strategy: SequenceStrategyType = selectedStrategy,
        opts?: CuttingSequenceOptions
    ) => {
        if (placedParts.length === 0) {
            setToolpathJob(null);
            return;
        }

        const effectiveOpts: CuttingSequenceOptions = opts || { 
            enableTrueHole, 
            enableCornerLoop,
            enableMicrojoint,
            microjointTabWidthMm: microjointTabWidth,
            microjointCount,
            enableAnchorTabs,
            anchorTabMode,
            anchorTabCount,
            anchorTabSpacingMm,
            anchorTabWidthMm,
            cutAnchorEdgeLast,
            cutHolesPerPart: true,
            enableBridgeCutting,
            maxBridgeDistanceMm,
            enableCollisionAvoidance,
            automationPreset,
        };

        const camParts: CamPart[] = placedParts.map((p, idx) => {
            const orig = parts.find(pt => pt.id === p.partId);
            const cuttingMode = p.cuttingMode ?? orig?.cuttingMode ?? (options.commonLine ? 'common' : 'auto');
            const allowCommonLine = p.allowCommonLine ?? orig?.allowCommonLine ?? (cuttingMode !== 'standalone');
            const enableBridge = p.enableBridge ?? orig?.enableBridge ?? true;
            const mjCount = p.microjointCount ?? orig?.microjointCount ?? (enableMicrojoint ? microjointCount : 0);
            const mjWidth = p.microjointWidthMm ?? orig?.microjointWidthMm ?? microjointTabWidth;

            return {
                id: `${p.partId}-${p.instanceIndex}`,
                label: p.label,
                outerContour: {
                    id: `outer-${idx}`,
                    segments: [],
                    points: p.polygon.points,
                    isClosed: true,
                    role: 'outer',
                    area: p.polygon.area,
                    bounds: {
                        minX: p.polygon.bounds.x,
                        minY: p.polygon.bounds.y,
                        maxX: p.polygon.bounds.x + p.polygon.bounds.width,
                        maxY: p.polygon.bounds.y + p.polygon.bounds.height,
                        width: p.polygon.bounds.width,
                        height: p.polygon.bounds.height,
                    },
                    isClockwise: false,
                },
                holes: (p.innerPolygons || []).map((h, hIdx) => ({
                    id: `hole-${idx}-${hIdx}`,
                    segments: [],
                    points: h.points,
                    isClosed: true,
                    role: 'hole',
                    area: h.area,
                    bounds: {
                        minX: h.bounds.x,
                        minY: h.bounds.y,
                        maxX: h.bounds.x + h.bounds.width,
                        maxY: h.bounds.y + h.bounds.height,
                        width: h.bounds.width,
                        height: h.bounds.height,
                    },
                    isClockwise: true,
                })),
                quantity: 1,
                allowedRotations: [0],
                cuttingMode,
                allowCommonLine,
                enableBridge,
                microjointCount: mjCount,
                microjointWidthMm: mjWidth,
            };
        });

        try {
            const job = sequenceThermalJob(camParts, profile, strategy, effectiveOpts);
            setToolpathJob(job);
        } catch (e) {
            console.error('[Nesting2D] Error generating thermal toolpath:', e);
        }
    }, [
        parts,
        options.commonLine,
        selectedStrategy, 
        enableTrueHole, 
        enableCornerLoop, 
        enableMicrojoint, 
        microjointTabWidth,
        microjointCount,
        enableBridgeCutting,
        maxBridgeDistanceMm,
        enableCollisionAvoidance,
        automationPreset,
        enableAnchorTabs,
        anchorTabMode,
        anchorTabCount,
        anchorTabSpacingMm,
        anchorTabWidthMm,
        cutAnchorEdgeLast
    ]);

    // Watch for result completion and re-compute toolpaths on profile/strategy change
    useEffect(() => {
        const activeResult = sigmaResult || hexResult || workerResult;
        if (activeResult && activeResult.sheets.length > 0) {
            const currentSheetParts = activeResult.sheets[currentSheetIndex]?.placedParts || [];
            computeCamToolpaths(currentSheetParts, currentProfile, selectedStrategy, { 
                enableTrueHole, 
                enableCornerLoop,
                enableMicrojoint,
                microjointTabWidthMm: microjointTabWidth,
                microjointCount,
                enableAnchorTabs,
                anchorTabMode,
                anchorTabCount,
                anchorTabSpacingMm,
                anchorTabWidthMm,
                cutAnchorEdgeLast,
                cutHolesPerPart: true,
                enableBridgeCutting,
                maxBridgeDistanceMm,
                enableCollisionAvoidance,
                automationPreset,
            });
        }
    }, [
        sigmaResult,
        workerResult, 
        hexResult, 
        currentSheetIndex, 
        currentProfile, 
        selectedStrategy, 
        enableTrueHole, 
        enableCornerLoop, 
        enableMicrojoint, 
        microjointTabWidth,
        microjointCount,
        enableAnchorTabs,
        anchorTabMode,
        anchorTabCount,
        anchorTabSpacingMm,
        anchorTabWidthMm,
        cutAnchorEdgeLast,
        enableBridgeCutting,
        maxBridgeDistanceMm,
        enableCollisionAvoidance,
        automationPreset,
        computeCamToolpaths
    ]);

    // Backplot verification of generated G-Code against toolpaths
    const backplotVerification = useMemo(() => {
        if (!toolpathJob) return null;
        try {
            const gcode = emitGCode(toolpathJob, currentProfile, { dialect: selectedDialect, sheetWidth: sheet.width, sheetHeight: sheet.height });
            return backplotGCode(gcode, toolpathJob, sheet);
        } catch {
            return null;
        }
    }, [toolpathJob, currentProfile, sheet, selectedDialect]);

    // 1-Click Bridge Handlers
    const handleImportFromAssembly = useCallback(() => {
        const res = CrossModuleBridge.export3DPlatesToNesting({ switchWindow: false });
        if (res.parts.length === 0) {
            alert('3D Montaj veya Tasarım Stüdyosunda plaka/braket bulunamadı.');
            return;
        }
        setParts(prev => [...prev, ...res.parts]);
        if (result) {
            reset();
            setHexResult(null);
        }
    }, [result, reset]);

    const handleImportFromCad = useCallback(() => {
        const res = CrossModuleBridge.exportCadToNesting(undefined, { switchWindow: false });
        if (res.parts.length === 0) {
            alert('2D CAD çiziminde geçerli kapalı parça bulunamadı.');
            return;
        }
        setParts(prev => [...prev, ...res.parts]);
        if (result) {
            reset();
            setHexResult(null);
        }
    }, [result, reset]);

    const handleAddDynamicSheetPlate = useCallback(() => {
        const res = CrossModuleBridge.exportDynamicBlockToNesting('dyn_sheet_metal_plate', {
            width: 400,
            length: 500,
            thickness: 3.0,
            holePattern: '4_corners',
            holeBoltSize: 'M10',
            cornerFinish: 'fillet',
            cornerFinishRadius: 15,
            centerCutout: 'rect',
            cutoutWidth: 120,
            cutoutHeight: 120,
        }, { switchWindow: false });

        if (res.part) {
            setParts(prev => [...prev, res.part!]);
            if (result) {
                reset();
                setHexResult(null);
            }
        }
    }, [result, reset]);

    const handleExportToolpathsToCad = useCallback(() => {
        if (!toolpathJob) {
            alert('Önce yerleşimi çözün ve takım yolunu hesaplayın.');
            return;
        }
        CrossModuleBridge.exportNestingToolpathsToCad(toolpathJob, { switchWindow: true });
    }, [toolpathJob]);

    // Solver Runner
    const handleOptimize = useCallback(() => {
        if (parts.length === 0) return;
        reset();
        setHexResult(null);
        setCurrentSheetIndex(0);

        if (options.algorithm === 'hexagonal') {
            const startT = performance.now();
            const camParts = parts.map(part2DToCamPart);
            const hexSolution = packPartsHexagonal(camParts, sheet.width, sheet.height, options.spacing, sheet.kerf * 2);
            const endT = performance.now();

            const placedParts: PlacedPart[] = hexSolution.placedParts.map((inst, idx) => {
                const orig = parts.find(pt => pt.id === inst.partId) || parts[0];
                const points = orig.polygon.points.map(pt => ({
                    x: pt.x + inst.position.x,
                    y: pt.y + inst.position.y,
                }));
                const innerPolygons = orig.innerPolygons?.map(ip => ({
                    points: ip.points.map(pt => ({ x: pt.x + inst.position.x, y: pt.y + inst.position.y })),
                    bounds: {
                        x: ip.bounds.x + inst.position.x,
                        y: ip.bounds.y + inst.position.y,
                        width: ip.bounds.width,
                        height: ip.bounds.height,
                    },
                    area: ip.area,
                }));

                return {
                    partId: inst.partId,
                    label: inst.label,
                    position: inst.position,
                    rotation: inst.rotationDeg,
                    polygon: {
                        points,
                        bounds: {
                            x: inst.position.x,
                            y: inst.position.y,
                            width: orig.polygon.bounds.width,
                            height: orig.polygon.bounds.height,
                        },
                        area: orig.polygon.area,
                    },
                    instanceIndex: idx,
                    innerPolygons,
                };
            });

            const customResult: NestingResult = {
                sheets: [{
                    sheetIndex: 0,
                    placedParts,
                    freeRectangles: [{
                        x: hexSolution.remnantRectangle.x,
                        y: hexSolution.remnantRectangle.y,
                        width: hexSolution.remnantRectangle.width,
                        height: hexSolution.remnantRectangle.height,
                    }],
                    usedArea: hexSolution.partsAreaM2 * 1_000_000,
                    wasteArea: (sheet.width * sheet.height) - (hexSolution.partsAreaM2 * 1_000_000),
                    efficiency: hexSolution.realSheetEfficiencyPct,
                }],
                totalSheets: 1,
                totalEfficiency: hexSolution.realSheetEfficiencyPct,
                totalWaste: (sheet.width * sheet.height) - (hexSolution.partsAreaM2 * 1_000_000),
                unplacedParts: [],
                computeTimeMs: endT - startT,
            };

            setHexResult(customResult);
            computeCamToolpaths(placedParts, currentProfile);
            return;
        }

        if (options.algorithm === 'sigmanest') {
            // true-shape nesting runs in the worker (no UI freeze, live progress);
            // the toolpath effect picks up the result
            setSigmaResult(null);
            run({
                parts,
                sheet,
                options: { ...options, remnants: useRemnantsFirst ? inventoryRemnants : [] },
            });
            return;
        }

        // Guillotine / MaxRects / Shelf via Worker
        run({ parts, sheet, options });
    }, [parts, sheet, options, useRemnantsFirst, inventoryRemnants, part2DToCamPart, computeCamToolpaths, currentProfile, run, reset]);

    const handleExportDXF = useCallback(() => {
        if (!result || result.sheets.length === 0) return;
        result.sheets.forEach((sheetResult, index) => {
            const dxfContent = exportToDXF(sheetResult, sheet);
            const filename = result.sheets.length > 1 ? `nested_sheet_${index + 1}.dxf` : 'nested_parts.dxf';
            downloadDXF(dxfContent, filename);
        });
    }, [result, sheet]);

    const handleDownloadGCode = useCallback(() => {
        if (!toolpathJob) return;
        const gcode = emitGCode(toolpathJob, currentProfile, { dialect: selectedDialect, sheetWidth: sheet.width, sheetHeight: sheet.height });
        const ext = selectedDialect === 'mach3_plasma' ? 'tap' : selectedDialect === 'linuxcnc_plasmac' ? 'ngc' : 'nc';
        const blob = new Blob([gcode], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `alucalc_plasma_${selectedProfileId}_${Date.now()}.${ext}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }, [toolpathJob, currentProfile, sheet, selectedDialect, selectedProfileId]);

    const handleDownloadMpg = useCallback(() => {
        if (!toolpathJob) return;
        const activeSheet = result?.sheets[currentSheetIndex];
        const mpgCode = emitGCode(toolpathJob, currentProfile, {
            dialect: 'essi_experimental',
            sheetWidth: sheet.width,
            sheetHeight: sheet.height,
            cropCut: activeSheet?.cropCut
        });
        const blob = new Blob([mpgCode], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `TaskSheet_${Date.now().toString().slice(-6)}.mpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }, [toolpathJob, currentProfile, sheet, result, currentSheetIndex]);

    const handleSaveRemnant = useCallback((rem: RemnantSheet2D) => {
        setInventoryRemnants(prev => {
            if (prev.some(p => p.id === rem.id)) return prev;
            return [...prev, rem];
        });
    }, []);

    const reportData = useMemo(() => {
        const activeSheet = result?.sheets[currentSheetIndex];
        if (!activeSheet) return null;
        return buildSigmaNestReportData(activeSheet, parts, {
            taskName: `T_${currentProfile.material}_${currentProfile.thicknessMm}mm`,
            programName: activeSheet.remnantSheet ? activeSheet.remnantSheet.id : `Program_${currentSheetIndex + 1}`,
            machineName: 'CNC Plazma / Lazer',
            material: currentProfile.material,
            thickness: currentProfile.thicknessMm,
            amperage: currentProfile.currentAmps,
            sheetName: activeSheet.remnantSheet ? `Sheet_${currentSheetIndex + 1}` : `Sheet_${currentSheetIndex + 1}`,
            sheetWidth: sheet.width,
            sheetHeight: sheet.height,
            totalCutTimeSec: toolpathJob?.totalJobTimeSec,
            totalCutLengthMm: toolpathJob?.totalLengthMm
        });
    }, [result, currentSheetIndex, parts, currentProfile, sheet, toolpathJob]);

    const handleReset = useCallback(() => {
        setParts([]);
        reset();
        setHexResult(null);
        setSigmaResult(null);
        setToolpathJob(null);
        setCurrentSheetIndex(0);
    }, [reset]);

    const handlePartsChange = useCallback((newParts: Part2D[]) => {
        setParts(newParts);
        if (result) {
            reset();
            setHexResult(null);
            setSigmaResult(null);
        }
    }, [result, reset]);

    const totalPartsCount = parts.reduce((sum, p) => sum + p.quantity, 0);
    const sheetAreaM2 = (sheet.width * sheet.height) / 1_000_000;
    const estimatedMaterialCost = result
        ? result.totalSheets * sheetAreaM2 * materialCostPerM2
        : 0;

    return (
        <div className="flex flex-col lg:flex-row w-full h-full max-h-full bg-[var(--bg-0)] text-white overflow-hidden relative ">
            {/* Visual Grid Layer */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(0,229,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,229,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />

            {/* LEFT PANEL: Controls */}
            <div className={`${isSidebarCollapsed ? 'hidden' : 'w-full lg:w-[420px]'} h-full max-h-full min-h-0 bg-[var(--bg-0)]/95 border-r border-white/10 flex flex-col z-20 shadow-[20px_0_50px_rgba(0,0,0,0.5)] overflow-hidden transition-all duration-200`}>
                
                {/* Header */}
                <div className="shrink-0 p-4 border-b border-white/10 ">
                    <div className="flex items-center justify-between gap-3 mb-2.5">
                        <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-[var(--cyan-glow)] border border-[var(--cyan)]/40 flex items-center justify-center text-[var(--cyan)] ">
                                <Grid2x2 size={18} />
                            </div>
                            <div>
                                <h1 className="text-lg font-black tracking-tighter uppercase leading-none">Nesting & CAM</h1>
                                <p className="text-[9px] text-cyan-500/70 font-mono tracking-widest uppercase mt-0.5">2D Yerleşim & Plazma CNC G-Code</p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsSidebarCollapsed(true)}
                            title="Paneli Gizle (Tam Ekran Tuval)"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 border border-white/5 transition-all cursor-pointer"
                        >
                            <PanelLeftClose size={16} />
                        </button>
                    </div>

                    {/* Mode Navigation Tabs */}
                    <div className="flex bg-black/40 p-1 rounded-xl border border-white/10 gap-1">
                        <button
                            type="button"
                            onClick={() => setActiveTab('nesting')}
                            className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                                activeTab === 'nesting' ? 'bg-[var(--cyan)] text-[var(--accent-ink)] shadow-md' : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            <Layers size={13} /> Yerleşim (Nesting)
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('plasma_cam')}
                            className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                                activeTab === 'plasma_cam' ? 'bg-[var(--cyan)] text-[var(--accent-ink)] shadow-md' : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            <Flame size={13} /> Plazma CAM & CNC
                        </button>
                    </div>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 custom-scrollbar overscroll-contain">
                    {activeTab === 'nesting' ? (
                        <>
                            {/* Resource Loading & Universal Bridge */}
                            <div className="space-y-3">
                                <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                                    <Layers size={12} /> Parça Yükleme & Entegrasyon
                                </h2>
                                <div className="bg-black/40 border border-white/5 rounded-2xl overflow-hidden p-1">
                                    <PartUploader parts={parts} onPartsChange={handlePartsChange} />
                                </div>

                                {/* Cross-Module 1-Click Import Actions */}
                                <div className="grid grid-cols-2 gap-2 pt-1">
                                    <button
                                        type="button"
                                        onClick={handleImportFromCad}
                                        className="py-2 px-2.5 rounded-xl text-[9px] font-black uppercase tracking-wider bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/20 transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                                    >
                                        📥 2D CAD&apos;den Aktar
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleImportFromAssembly}
                                        className="py-2 px-2.5 rounded-xl text-[9px] font-black uppercase tracking-wider bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/20 transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                                    >
                                        📥 3D Montaj&apos;dan Aktar
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsExcelModalOpen(true)}
                                        className="py-2.5 px-3 rounded-xl text-[10px] font-black uppercase tracking-wider bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                                    >
                                        <FileSpreadsheet size={13} className="text-amber-400" />
                                        <span>Excel / CSV BOM İçe Aktar</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsDynamicBlockModalOpen(true)}
                                        className="py-2.5 px-3 rounded-xl text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                                    >
                                        <Zap size={13} className="text-emerald-400" />
                                        <span>Dinamik Bloklar (38+ Tür)</span>
                                    </button>
                                </div>
                            </div>

                            <div className="w-full h-px bg-white/5" />

                            {/* Stock & Algorithm Settings */}
                            <div className="space-y-5">
                                <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                                    <Settings size={12} /> Sac & Çözücü Parametreleri
                                </h2>
                                
                                <div className="grid grid-cols-2 gap-3">
                                    <ParameterInput label="Sac Eni" unit="mm" value={sheet.width} onChange={(v: number) => setSheet(s => ({ ...s, width: v }))} icon={<Maximize2 size={12}/>} />
                                    <ParameterInput label="Sac Boyu" unit="mm" value={sheet.height} onChange={(v: number) => setSheet(s => ({ ...s, height: v }))} icon={<Maximize2 size={12}/>} />
                                </div>

                                <div className="flex flex-wrap gap-1.5">
                                    {SHEET_PRESETS.map(p => (
                                        <button key={p.label} type="button"
                                            onClick={() => setSheet(s => ({ ...s, width: p.width, height: p.height }))}
                                            className="px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider border border-white/10 bg-white/[0.03] hover:border-cyan-500/40 hover:text-cyan-400 text-slate-400 transition-all">
                                            {p.label}
                                        </button>
                                    ))}
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <ParameterInput label="Kerf (Yarık)" unit="mm" min={0.5} max={10} value={sheet.kerf} onChange={(v: number) => setSheet(s => ({ ...s, kerf: v }))} icon={<Cpu size={12}/>} />
                                    <ParameterInput label="Min Aralık" unit="mm" min={0} max={50} value={options.spacing} onChange={(v: number) => setOptions(o => ({ ...o, spacing: v, commonLine: v === 0 }))} icon={<Layers size={12}/>} />
                                </div>

                                {/* Common Line Cutting (CLC / Ortak Kesim) Direct Toggle */}
                                <div className="p-2.5 bg-emerald-950/25 border border-emerald-500/30 rounded-xl space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                                                <Zap size={13} />
                                            </div>
                                            <div>
                                                <div className="text-[11px] font-bold text-emerald-300">Ortak Kesim (Common Line / CLC)</div>
                                                <div className="text-[9px] text-slate-400 font-mono">0 mm aralık, yan yana sacların ortak kenarı tek plazma geçişiyle kesilir</div>
                                            </div>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={options.commonLine === true || options.spacing === 0}
                                            onChange={e => {
                                                const isClc = e.target.checked;
                                                setOptions(o => ({ ...o, commonLine: isClc, spacing: isClc ? 0 : 6 }));
                                            }}
                                            className="w-4 h-4 accent-[var(--cyan)] cursor-pointer"
                                        />
                                    </div>
                                    {(options.commonLine === true || options.spacing === 0) && (
                                        <div className="pt-1.5 border-t border-emerald-500/20 flex items-center gap-1.5 text-[10px] text-emerald-300 font-mono">
                                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                                            <span>⚡ 1 KESİM = 2 PARÇA (Bitişik hatta mükerrer kesim yok, tek yeşil CLC çizgisi)</span>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-1.5">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Yerleşim Algoritması</div>
                                    <select
                                        value={options.algorithm}
                                        onChange={(e) => setOptions(o => ({ ...o, algorithm: e.target.value as NestingOptions['algorithm'] }))}
                                        className="w-full bg-[var(--bg-1)] border border-white/10 rounded-xl px-3 py-2.5 text-xs font-bold text-white outline-none focus:border-cyan-500/50"
                                    >
                                        <option value="sigmanest">⚡ Endüstriyel Akıllı Yerleşim (Kalıntı Sac & İç İçe Nesting)</option>
                                        <option value="guillotine">Guillotine (Giyotin Sac Kesimi)</option>
                                        <option value="maxrects">MaxRects (Yüksek Yoğunluklu Kutu)</option>
                                        <option value="hexagonal">Hexagonal (Dairesel / Kasnak Sıkı Paketleme - %90.7 Verim)</option>
                                        <option value="shelf">Shelf (Şerit Paketleme)</option>
                                    </select>
                                </div>

                                {options.algorithm === 'sigmanest' && (
                                    <div className="p-3 bg-cyan-950/30 border border-cyan-500/20 rounded-xl space-y-2 text-[11px] font-mono">
                                        <div className="flex items-center justify-between">
                                            <span className="text-slate-300">Kalıntı Sac Önceliği</span>
                                            <input
                                                type="checkbox"
                                                checked={useRemnantsFirst}
                                                onChange={e => setUseRemnantsFirst(e.target.checked)}
                                                className="accent-[var(--cyan)] cursor-pointer"
                                            />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-slate-300">İç İçe Yerleşim (Donut)</span>
                                            <input
                                                type="checkbox"
                                                checked={options.enablePartInPart ?? true}
                                                onChange={e => setOptions(o => ({ ...o, enablePartInPart: e.target.checked }))}
                                                className="accent-[var(--cyan)] cursor-pointer"
                                            />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-slate-300">İşlem Kümeleme (Downstream)</span>
                                            <input
                                                type="checkbox"
                                                checked={options.downstreamClustering ?? true}
                                                onChange={e => setOptions(o => ({ ...o, downstreamClustering: e.target.checked }))}
                                                className="accent-[var(--cyan)] cursor-pointer"
                                            />
                                        </div>
                                        {inventoryRemnants.length > 0 && (
                                            <div className="text-[10px] text-emerald-400 pt-1 border-t border-cyan-500/20">
                                                ✓ {inventoryRemnants.length} adet kayıtlı kalıntı sac mevcut
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="space-y-1.5">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Dönüş Adımı</div>
                                    <select
                                        value={options.rotationStep}
                                        onChange={(e) => setOptions(o => ({ ...o, rotationStep: parseInt(e.target.value) }))}
                                        className="w-full bg-[var(--bg-1)] border border-white/10 rounded-xl px-3 py-2.5 text-xs font-bold text-white outline-none focus:border-cyan-500/50"
                                    >
                                        <option value={0}>Sabit (0° Serbest Değil)</option>
                                        <option value={90}>Orto (90° Adım)</option>
                                        <option value={45}>Hassas (45° Adım)</option>
                                        <option value={15}>Hiper (15° Adım)</option>
                                    </select>
                                </div>

                                <ParameterInput label="Malzeme Fiyatı" unit="€/m²" value={materialCostPerM2} onChange={setMaterialCostPerM2} icon={<FileText size={12}/>} max={500} />
                            </div>
                        </>
                    ) : (
                        /* Plazma CAM & CNC Tab */
                        <div className="space-y-6">
                            {/* Process Profile Selector */}
                            <div className="space-y-2">
                                <div className="text-[10px] font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
                                    <Flame size={12} /> Plazma Kesim Proses Profili (ISO 9013)
                                </div>
                                <select
                                    value={selectedProfileId}
                                    onChange={(e) => handleProfileSelect(e.target.value)}
                                    className="w-full bg-[var(--bg-1)] border border-amber-500/30 rounded-xl px-3 py-2.5 text-xs font-bold text-amber-200 outline-none focus:border-amber-400"
                                >
                                    {Object.values(DEFAULT_PLASMA_PROFILES).map(p => (
                                        <option key={p.id} value={p.id}>
                                            {p.name} ({p.currentAmps}A - {p.thicknessMm}mm)
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* 1-Click Cutting Automations Hub */}
                            <div className="space-y-2.5 p-3 rounded-2xl border border-cyan-500/25">
                                <div className="flex items-center justify-between">
                                    <div className="text-[10px] font-black text-cyan-300 uppercase tracking-widest flex items-center gap-1.5">
                                        <Zap size={13} className="text-cyan-400" /> Kesim Otomasyonları (1-Click Presets)
                                    </div>
                                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold uppercase">
                                        {automationPreset}
                                    </span>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-2">
                                    {/* Preset 1: Sıfır Patlatma */}
                                    <button
                                        type="button"
                                        onClick={() => applyAutomationPreset('min-pierce')}
                                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                                            automationPreset === 'min-pierce'
                                                ? 'bg-emerald-950/40 border-emerald-500 text-white '
                                                : 'bg-black/40 border-white/10 text-slate-400 hover:border-emerald-500/40 hover:text-white'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-[10px] font-black text-emerald-400 flex items-center gap-1">
                                                <Zap size={12} /> Sıfır Patlatma
                                            </span>
                                            <span className="text-[7px] font-mono text-emerald-300 bg-emerald-500/20 px-1 py-0.2 rounded font-bold">CLC + KÖPRÜ</span>
                                        </div>
                                        <p className="text-[8px] text-slate-400 leading-tight">
                                            Ortak çizgi ve kesintisiz köprü kesim ile delme sayısını ve torç aşınmasını %60+ azaltır.
                                        </p>
                                    </button>

                                    {/* Preset 2: Termal Koruma */}
                                    <button
                                        type="button"
                                        onClick={() => applyAutomationPreset('anti-warp')}
                                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                                            automationPreset === 'anti-warp'
                                                ? 'bg-amber-950/40 border-amber-500 text-white '
                                                : 'bg-black/40 border-white/10 text-slate-400 hover:border-amber-500/40 hover:text-white'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-[10px] font-black text-amber-400 flex items-center gap-1">
                                                <Flame size={12} /> Termal Koruma
                                            </span>
                                            <span className="text-[7px] font-mono text-amber-300 bg-amber-500/20 px-1 py-0.2 rounded font-bold">ANTI-WARP</span>
                                        </div>
                                        <p className="text-[8px] text-slate-400 leading-tight">
                                            Rosenthal ısı atlama dizisi ile sacın lokal ısınmasını ve termal bükülmesini önler.
                                        </p>
                                    </button>

                                    {/* Preset 3: Devrilme Koruması */}
                                    <button
                                        type="button"
                                        onClick={() => applyAutomationPreset('anti-tip')}
                                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                                            automationPreset === 'anti-tip'
                                                ? 'bg-blue-950/40 border-blue-500 text-white '
                                                : 'bg-black/40 border-white/10 text-slate-400 hover:border-blue-500/40 hover:text-white'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-[10px] font-black text-blue-400 flex items-center gap-1">
                                                <ShieldCheck size={12} /> Devrilme Koruması
                                            </span>
                                            <span className="text-[7px] font-mono text-blue-300 bg-blue-500/20 px-1 py-0.2 rounded font-bold">SEKME + ÇARPIŞMA</span>
                                        </div>
                                        <p className="text-[8px] text-slate-400 leading-tight">
                                            Küçük parçalara mikro sekme bırakır ve kesilmiş deliklerden torç kafasını güvenle kaçırır.
                                        </p>
                                    </button>

                                    {/* Preset 4: Hassas Kesim */}
                                    <button
                                        type="button"
                                        onClick={() => applyAutomationPreset('precision')}
                                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                                            automationPreset === 'precision'
                                                ? 'bg-purple-950/40 border-purple-500 text-white '
                                                : 'bg-black/40 border-white/10 text-slate-400 hover:border-purple-500/40 hover:text-white'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-[10px] font-black text-purple-400 flex items-center gap-1">
                                                <Compass size={12} /> Hassas Kesim
                                            </span>
                                            <span className="text-[7px] font-mono text-purple-300 bg-purple-500/20 px-1 py-0.2 rounded font-bold">TRUE HOLE™</span>
                                        </div>
                                        <p className="text-[8px] text-slate-400 leading-tight">
                                            Sıfır koniklikli delikler, dros yanmasız 90° köşe döngüleri ve bağımsız hassas konturlar.
                                        </p>
                                    </button>
                                </div>
                            </div>

                            {/* Cutting Strategy Selector & Precision Options */}
                            <div className="space-y-3 p-3.5 rounded-2xl border border-amber-500/20">
                                <div className="text-[10px] font-black text-amber-300 uppercase tracking-widest flex items-center gap-1.5">
                                    <Zap size={12} className="text-amber-400" /> Plazma Kesim & Ortak Çizgi Stratejisi
                                </div>
                                
                                <div className="space-y-1">
                                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Kesim Yolu Stratejisi</label>
                                    <select
                                        value={selectedStrategy}
                                        onChange={(e) => setSelectedStrategy(e.target.value as SequenceStrategyType)}
                                        className="w-full bg-[var(--bg-1)] border border-amber-500/30 rounded-xl px-2.5 py-2 text-xs font-bold text-amber-100 outline-none focus:border-amber-400"
                                    >
                                        <option value="progressive-common-line">Progresif Ortak Kesim & Sabit Kenar (2. Resim / 1 Geçiş & Delik Koruma)</option>
                                        <option value="heat-minimizing">Rosenthal Anti-Warp (Termal Atlama - Çarpılma Önleyici)</option>
                                        <option value="pi-cut">π-Biçimli Ortak Kesim (Pi-Cut / C-Cut Kayma Önleyici)</option>
                                        <option value="common-line">Ortak Çizgi Kesimi (Common Line - CLC / Delme & Çift Isı Tasarrufu)</option>
                                        <option value="anti-warp-slender">Zıt Kenar Simetrik (Uzun Parçalarda Kılıçlaşma Önleyici)</option>
                                        <option value="true-hole-precision">True Hole™ Hassasiyeti (Dairesel Delik Koniklik Giderici)</option>
                                        <option value="center-out">Merkezden Dışa (Center-Out / İskelet Rijitliği)</option>
                                        <option value="nearest-neighbor">En Yakın Komşu (Hızlı / Min. Boşta Gezinme)</option>
                                    </select>
                                </div>

                                <div className="space-y-2 pt-1 border-t border-white/5">
                                    {/* True Hole Toggle */}
                                    <label className="flex items-start gap-2.5 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={enableTrueHole}
                                            onChange={(e) => setEnableTrueHole(e.target.checked)}
                                            className="mt-0.5 rounded accent-[var(--cyan)]"
                                        />
                                        <div className="text-[10px]">
                                            <div className="font-bold text-cyan-300 flex items-center gap-1">
                                                True Hole™ Hassas Delik Teknolojisi
                                            </div>
                                            <div className="text-[8px] text-slate-400 leading-tight">
                                                D ≤ 30mm deliklerde %65 hız azaltma + negatif radyal çıkış ile silindirik (sıfır konik) delik keser.
                                            </div>
                                        </div>
                                    </label>

                                    {/* Corner Loop Toggle */}
                                    <label className="flex items-start gap-2.5 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={enableCornerLoop}
                                            onChange={(e) => setEnableCornerLoop(e.target.checked)}
                                            className="mt-0.5 rounded accent-[var(--cyan)]"
                                        />
                                        <div className="text-[10px]">
                                            <div className="font-bold text-emerald-300 flex items-center gap-1">
                                                Köşe Döngüsü (Corner Loop)
                                            </div>
                                            <div className="text-[8px] text-slate-400 leading-tight">
                                                90° keskin dış köşelerde torç yavaşlaması kaynaklı dros yanmasını önlemek için artık saca overtravel döngüsü yapar.
                                            </div>
                                        </div>
                                    </label>

                                    {/* Bridge Cutting Toggle & Distance Slider */}
                                    <div className="pt-2 border-t border-white/5 space-y-2">
                                        <label className="flex items-start gap-2.5 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={enableBridgeCutting}
                                                onChange={(e) => setEnableBridgeCutting(e.target.checked)}
                                                className="mt-0.5 rounded accent-[var(--cyan)]"
                                            />
                                            <div className="text-[10px]">
                                                <div className="font-bold text-purple-300 flex items-center gap-1.5">
                                                    Köprü / Zincir Kesim (Continuous Bridge)
                                                    <span className="px-1.5 py-0.2 rounded text-[8px] bg-purple-500/20 text-purple-300 font-mono font-black">TORCH-ON</span>
                                                </div>
                                                <div className="text-[8px] text-slate-400 leading-tight">
                                                    İskelet artığı üzerinden torç kapatılmadan komşu parçaya geçiş yapılır; ekstra delme ve ön ısıtma gecikmesini yok eder.
                                                </div>
                                            </div>
                                        </label>
                                        {enableBridgeCutting && (
                                            <div className="flex items-center justify-between text-[10px] pl-6 font-mono text-slate-400">
                                                <span>Maks. Köprü Mesafesi:</span>
                                                <div className="flex items-center gap-1.5">
                                                    <input
                                                        type="range"
                                                        min="10"
                                                        max="80"
                                                        step="5"
                                                        value={maxBridgeDistanceMm}
                                                        onChange={(e) => setMaxBridgeDistanceMm(parseInt(e.target.value))}
                                                        className="w-20 accent-[var(--cyan)]"
                                                    />
                                                    <span className="text-purple-300 font-bold w-12 text-right">{maxBridgeDistanceMm} mm</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Collision Avoidance Toggle */}
                                    <div className="pt-2 border-t border-white/5">
                                        <label className="flex items-start gap-2.5 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={enableCollisionAvoidance}
                                                onChange={(e) => setEnableCollisionAvoidance(e.target.checked)}
                                                className="mt-0.5 rounded accent-[var(--cyan)]"
                                            />
                                            <div className="text-[10px]">
                                                <div className="font-bold text-cyan-300 flex items-center gap-1">
                                                    Kafa Çarpışma Önleme (Collision Avoidance)
                                                </div>
                                                <div className="text-[8px] text-slate-400 leading-tight">
                                                    Hızlı gezinme yollarında (G0) kesilmiş iç deliklerin ve serbest kalan küçük parçaların üzerinden güvenli atlama yapar.
                                                </div>
                                            </div>
                                        </label>
                                    </div>

                                    {/* No-Pierce Microjoint (Uncut Tab) Toggle */}
                                    <div className="pt-2 border-t border-white/5 space-y-2">
                                        <label className="flex items-start gap-2.5 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={enableMicrojoint}
                                                onChange={(e) => setEnableMicrojoint(e.target.checked)}
                                                className="mt-0.5 rounded accent-[var(--cyan)]"
                                            />
                                            <div className="text-[10px]">
                                                <div className="font-bold text-amber-300 flex items-center gap-1.5">
                                                    No-Pierce Mikro Tutucu (Uncut Tab)
                                                    <span className="px-1.5 py-0.2 rounded text-[8px] bg-emerald-500/20 text-emerald-400 font-mono font-black">0 EK DELME</span>
                                                </div>
                                                <div className="text-[8px] text-slate-400 leading-tight">
                                                    Gereksiz delme patlamalarını (59 → 160 delme) önler: Kontur sonunu kesmeden bırakır, torcu kapatıp yeni patlatma açmaz.
                                                </div>
                                            </div>
                                        </label>
                                        {enableMicrojoint && (
                                            <div className="space-y-1.5 pl-6 font-mono text-[10px] text-slate-400">
                                                <div className="flex items-center justify-between">
                                                    <span>Tab Genişliği:</span>
                                                    <div className="flex items-center gap-1.5">
                                                        <input
                                                            type="range"
                                                            min="1"
                                                            max="5"
                                                            step="0.5"
                                                            value={microjointTabWidth}
                                                            onChange={(e) => setMicrojointTabWidth(parseFloat(e.target.value))}
                                                            className="w-20 accent-[var(--cyan)]"
                                                        />
                                                        <span className="text-amber-300 font-bold w-12 text-right">{microjointTabWidth} mm</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span>Varsayılan Sekme Adedi:</span>
                                                    <div className="flex items-center gap-1.5">
                                                        <input
                                                            type="range"
                                                            min="1"
                                                            max="6"
                                                            step="1"
                                                            value={microjointCount}
                                                            onChange={(e) => setMicrojointCount(parseInt(e.target.value))}
                                                            className="w-20 accent-[var(--cyan)]"
                                                        />
                                                        <span className="text-amber-300 font-bold w-12 text-right">{microjointCount} adet</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Plazma Sabitleme Noktaları (Sabit Kenar & İskelet Tutucu - Image 2) */}
                                    <div className="pt-2 border-t border-white/5 space-y-2">
                                        <label className="flex items-start gap-2.5 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={enableAnchorTabs}
                                                onChange={(e) => setEnableAnchorTabs(e.target.checked)}
                                                className="mt-0.5 rounded accent-[var(--cyan)]"
                                            />
                                            <div className="text-[10px]">
                                                <div className="font-bold text-cyan-300 flex items-center gap-1.5">
                                                    Plazma Sabitleme Noktaları (Anchor Tabs)
                                                    <span className="px-1.5 py-0.2 rounded text-[8px] bg-cyan-500/20 text-cyan-400 font-mono font-black">
                                                        {anchorTabMode === 'count' ? `${anchorTabCount} ADET` : `${anchorTabSpacingMm} mm`}
                                                    </span>
                                                </div>
                                                <div className="text-[8px] text-slate-400 leading-tight">
                                                    2. Resimdeki // // sabit kenar: Plazma ısınmasında sacın kaymasını önlemek için sabit kenarda mikro tutucu bırakır ve en son keser.
                                                </div>
                                            </div>
                                        </label>

                                        {enableAnchorTabs && (
                                            <div className="bg-black/40 p-2.5 rounded-xl border border-cyan-500/20 space-y-2 pl-4 text-[10px]">
                                                <div className="flex items-center justify-between text-slate-400">
                                                    <span className="font-bold">Belirleme Modu:</span>
                                                    <div className="flex bg-black/60 p-0.5 rounded border border-white/10 gap-1 font-mono text-[9px]">
                                                        <button
                                                            type="button"
                                                            onClick={() => setAnchorTabMode('count')}
                                                            className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                                                                anchorTabMode === 'count' ? 'bg-[var(--cyan)] text-[var(--accent-ink)] font-bold' : 'text-slate-400 hover:text-white'
                                                            }`}
                                                        >
                                                            Adet
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setAnchorTabMode('spacing')}
                                                            className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                                                                anchorTabMode === 'spacing' ? 'bg-[var(--cyan)] text-[var(--accent-ink)] font-bold' : 'text-slate-400 hover:text-white'
                                                            }`}
                                                        >
                                                            Aralık (mm)
                                                        </button>
                                                    </div>
                                                </div>

                                                {anchorTabMode === 'count' ? (
                                                    <div className="flex items-center justify-between font-mono text-slate-400">
                                                        <span>Sabitleme Adedi:</span>
                                                        <div className="flex items-center gap-1.5">
                                                            <input
                                                                type="range"
                                                                min="1"
                                                                max="16"
                                                                step="1"
                                                                value={anchorTabCount}
                                                                onChange={(e) => setAnchorTabCount(parseInt(e.target.value))}
                                                                className="w-20 accent-[var(--cyan)]"
                                                            />
                                                            <input
                                                                type="number"
                                                                min="1"
                                                                max="50"
                                                                value={anchorTabCount}
                                                                onChange={(e) => setAnchorTabCount(Math.max(1, parseInt(e.target.value) || 1))}
                                                                className="w-12 bg-black/50 border border-white/10 rounded px-1.5 py-0.5 text-cyan-300 font-bold text-right text-xs"
                                                            />
                                                            <span className="text-[9px] text-slate-500">adet</span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center justify-between font-mono text-slate-400">
                                                        <span>Sabitleme Aralığı:</span>
                                                        <div className="flex items-center gap-1.5">
                                                            <input
                                                                type="range"
                                                                min="100"
                                                                max="2000"
                                                                step="50"
                                                                value={anchorTabSpacingMm}
                                                                onChange={(e) => setAnchorTabSpacingMm(parseInt(e.target.value))}
                                                                className="w-20 accent-[var(--cyan)]"
                                                            />
                                                            <input
                                                                type="number"
                                                                min="50"
                                                                max="5000"
                                                                value={anchorTabSpacingMm}
                                                                onChange={(e) => setAnchorTabSpacingMm(Math.max(50, parseInt(e.target.value) || 500))}
                                                                className="w-14 bg-black/50 border border-white/10 rounded px-1.5 py-0.5 text-cyan-300 font-bold text-right text-xs"
                                                            />
                                                            <span className="text-[9px] text-slate-500">mm</span>
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="flex items-center justify-between font-mono text-slate-400">
                                                    <span>Tab Genişliği:</span>
                                                    <div className="flex items-center gap-1.5">
                                                        <input
                                                            type="range"
                                                            min="1"
                                                            max="8"
                                                            step="0.5"
                                                            value={anchorTabWidthMm}
                                                            onChange={(e) => setAnchorTabWidthMm(parseFloat(e.target.value))}
                                                            className="w-20 accent-[var(--cyan)]"
                                                        />
                                                        <span className="text-cyan-300 font-bold w-12 text-right">{anchorTabWidthMm} mm</span>
                                                    </div>
                                                </div>

                                                <label className="flex items-center gap-2 text-slate-400 cursor-pointer pt-1">
                                                    <input
                                                        type="checkbox"
                                                        checked={cutAnchorEdgeLast}
                                                        onChange={(e) => setCutAnchorEdgeLast(e.target.checked)}
                                                        className="rounded accent-[var(--cyan)]"
                                                    />
                                                    <span className="text-[9px] font-bold text-cyan-200">En son sabit kenar kesilsin (Edge 13 Sırası)</span>
                                                </label>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Telemetry Badge & CLC Metrics */}
                            <div className="bg-black/50 border border-amber-500/20 rounded-2xl p-4 space-y-2.5 text-xs">
                                <div className="flex justify-between items-center text-slate-400">
                                    <span>Akım / Gerilim:</span>
                                    <span className="font-mono font-bold text-amber-300">{currentProfile.currentAmps} A / {currentProfile.arcVoltage} V</span>
                                </div>
                                <div className="flex justify-between items-center text-slate-400">
                                    <span>Kesim Hızı:</span>
                                    <span className="font-mono font-bold text-cyan-300">{currentProfile.cutSpeedMmMin} mm/dak</span>
                                </div>
                                <div className="flex justify-between items-center text-slate-400">
                                    <span>Delme Gecikmesi:</span>
                                    <span className="font-mono font-bold text-white">{currentProfile.pierceDelaySec} sn</span>
                                </div>
                                <div className="flex justify-between items-center text-slate-400">
                                    <span>Giriş Yayı (Lead-In):</span>
                                    <span className="font-mono font-bold text-amber-300">{currentProfile.leadInLengthMm} mm (90° Radyal)</span>
                                </div>
                                <div className="flex justify-between items-center text-slate-400">
                                    <span>Torç Girdap Yönü (Swirl):</span>
                                    <span className="font-mono font-bold text-emerald-400">{currentProfile.swirl} (Dış CW, Delik CCW)</span>
                                </div>
                                {toolpathJob && (
                                    <>
                                        <div className="w-full h-px bg-white/10 my-1" />
                                        <div className="flex justify-between items-center text-slate-300 font-bold">
                                            <span>Toplam Delme (Pierces):</span>
                                            <span className="font-mono text-cyan-300">{toolpathJob.pierceCount} adet</span>
                                        </div>
                                        <div className="flex justify-between items-center text-slate-300 font-bold">
                                            <span>Ortak Kesim (CLC) Kenarı:</span>
                                            <span className={`font-mono px-1.5 py-0.5 rounded text-[10px] ${
                                                toolpathJob.commonLineEdgeCount > 0 
                                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                                                    : 'text-slate-500'
                                            }`}>
                                                {toolpathJob.commonLineEdgeCount} kenar (Tek Geçiş / 0 Çift Kesim)
                                            </span>
                                        </div>
                                        {toolpathJob.bridgeCount !== undefined && toolpathJob.bridgeCount > 0 && (
                                            <div className="flex justify-between items-center text-slate-300 font-bold">
                                                <span>Köprü Kesim (Continuous):</span>
                                                <span className="font-mono px-1.5 py-0.5 rounded text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                                    {toolpathJob.bridgeCount} köprü (Sıfır Torç Sönmesi)
                                                </span>
                                            </div>
                                        )}
                                        {toolpathJob.microjointCount !== undefined && toolpathJob.microjointCount > 0 && (
                                            <div className="flex justify-between items-center text-slate-300 font-bold">
                                                <span>Mikro Tutucular (Tabs):</span>
                                                <span className="font-mono px-1.5 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                                    {toolpathJob.microjointCount} sekme (Devrilme Emniyeti)
                                                </span>
                                            </div>
                                        )}
                                        {toolpathJob.anchorTabCount !== undefined && toolpathJob.anchorTabCount > 0 && (
                                            <div className="flex justify-between items-center text-slate-300 font-bold">
                                                <span>Sabitleme Noktaları:</span>
                                                <span className="font-mono px-1.5 py-0.5 rounded text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                                                    {toolpathJob.anchorTabCount} adet (Sabit Kenar // //)
                                                </span>
                                            </div>
                                        )}
                                        <div className="flex justify-between items-center text-slate-300 font-bold">
                                            <span>Delik Koruma:</span>
                                            <span className="font-mono px-1.5 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                                Eşzamanlı Parça Bazlı (0 Kayma)
                                            </span>
                                        </div>

                                        {/* Comparative Pierce Telemetry */}
                                        <div className="p-2.5 border border-emerald-500/30 rounded-xl space-y-1.5 mt-2">
                                            <div className="flex justify-between items-center text-[10px] font-bold">
                                                <span className="text-emerald-400 flex items-center gap-1">
                                                    <Zap size={11} /> Patlatma Tasarrufu (Pierce Telemetry)
                                                </span>
                                                <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[9px] font-black">
                                                    %{toolpathJob.pierceSavingsPercent} KAZANÇ
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 text-[9px] font-mono">
                                                <div className="bg-black/40 p-1.5 rounded border border-white/5">
                                                    <div className="text-slate-400">AluCAD OS (Uçan Tab):</div>
                                                    <div className="text-emerald-300 font-bold text-xs">{toolpathJob.pierceCount} Delme</div>
                                                    <div className="text-[8px] text-slate-500">(0 ek patlatma)</div>
                                                </div>
                                                <div className="bg-black/40 p-1.5 rounded border border-white/5">
                                                    <div className="text-slate-400">Standart CAM Delme:</div>
                                                    <div className="text-rose-400 font-bold text-xs">{toolpathJob.sigmaNestSimulatedPierces} Delme</div>
                                                    <div className="text-[8px] text-slate-500">(Her tabta yeni pierce)</div>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Rosenthal Thermal Metric */}
                            {toolpathJob && (
                                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 space-y-2">
                                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center justify-between">
                                        <span>Rosenthal Isı Girdisi</span>
                                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                                            toolpathJob.thermalAnalysis.partWarpingRiskScores[0]?.level === 'green'
                                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                                : toolpathJob.thermalAnalysis.partWarpingRiskScores[0]?.level === 'yellow'
                                                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                                    : 'bg-red-500/10 text-red-400 border border-red-500/20'
                                        }`}>
                                            Risk: {toolpathJob.thermalAnalysis.partWarpingRiskScores[0]?.level || 'green'}
                                        </span>
                                    </div>
                                    <div className="flex items-baseline gap-2">
                                        <div className="text-2xl font-black font-mono text-amber-400">
                                            {toolpathJob.thermalAnalysis.heatInputQ_kJ_mm.toFixed(3)}
                                        </div>
                                        <span className="text-xs text-slate-500 font-mono">kJ/mm</span>
                                    </div>
                                    <p className="text-[9px] text-slate-500 leading-relaxed">
                                        Q = (η · U · I) / (1000 · v). Sıralama: İç delikler önce kesilir, parçalar arası termal atlama ile lokal ısınma minimize edilir.
                                    </p>
                                </div>
                            )}

                            {/* CNC Post-Processor Dialect */}
                            <div className="space-y-2">
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    CNC Post-Processor Lehçesi
                                </div>
                                <select
                                    value={selectedDialect}
                                    onChange={(e) => setSelectedDialect(e.target.value as GCodeDialect)}
                                    className="w-full bg-[var(--bg-1)] border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none focus:border-cyan-500"
                                >
                                    <option value="mach3_plasma">Mach3 / Mach4 Plasma (.tap)</option>
                                    <option value="essi_experimental">ESSI CNC Formatı (.mpg)</option>
                                    <option value="linuxcnc_plasmac">LinuxCNC PlasmaC (.ngc)</option>
                                    <option value="generic_iso">Generic ISO G-Code (G21/G90 .nc)</option>
                                </select>
                            </div>

                            {/* Backplot Verification Report */}
                            {backplotVerification && (
                                <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl flex items-center gap-3">
                                    <ShieldCheck size={18} className="text-emerald-400 shrink-0" />
                                    <div className="text-[10px]">
                                        <div className="font-bold text-emerald-300">G-Code Doğrulandı (Backplot Pass)</div>
                                        <div className="text-slate-400 font-mono">
                                            Sapma: {backplotVerification.maxCoordinateDeviationMm.toFixed(4)} mm (&lt;0.01 mm) | Zarf Uygun
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Export to CAD and G-Code Download buttons */}
                            <div className="space-y-2 pt-2">
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={handleDownloadGCode}
                                        disabled={!toolpathJob}
                                        className={`py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-lg cursor-pointer ${
                                            toolpathJob ? 'bg-amber-600 hover:bg-amber-500 text-white ' : 'bg-white/5 text-slate-600 cursor-not-allowed'
                                        }`}
                                    >
                                        <Download size={14} /> G-Code (.TAP)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleDownloadMpg}
                                        disabled={!toolpathJob}
                                        className={`py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-lg cursor-pointer ${
                                            toolpathJob ? 'bg-cyan-600 hover:bg-cyan-500 text-white ' : 'bg-white/5 text-slate-600 cursor-not-allowed'
                                        }`}
                                        title="ESSI CNC Hareket Programı (.MPG) İndir"
                                    >
                                        <Download size={14} /> ESSI (.MPG)
                                    </button>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleExportToolpathsToCad}
                                    disabled={!toolpathJob}
                                    className={`w-full py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 border cursor-pointer ${
                                        toolpathJob ? 'bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border-cyan-500/30' : 'bg-white/5 text-slate-600 border-white/5 cursor-not-allowed'
                                    }`}
                                >
                                    <Compass size={14} /> Takım Yolunu 2D CAD&apos;e Gönder
                                </button>
                            </div>
                        </div>
                    )}

                </div>

                {/* 3. STICKY BOTTOM ACTION FOOTER (ALWAYS PINNED TO BOTTOM, NEVER OFF-SCREEN) */}
                <div className="shrink-0 p-3 bg-[var(--bg-0)] border-t border-white/10 shadow-[0_-8px_20px_rgba(0,0,0,0.6)] z-30 space-y-2">
                    {/* Status telemetry row */}
                    <div className="flex items-center justify-between text-[10px] font-mono px-1">
                        <div className="flex items-center gap-1.5 text-slate-400">
                            <span className={`w-2 h-2 rounded-full ${isRunning ? 'bg-amber-400 animate-ping' : result ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                            <span className="font-bold text-slate-300">
                                {isRunning ? `Hesaplanıyor (%${progress?.percent || 0})` : result ? `${result.totalSheets} Sac Plaka • %${result.totalEfficiency.toFixed(1)} Verim` : `${totalPartsCount} Parça Hazır`}
                            </span>
                        </div>
                        <span className="text-[9px] text-slate-500 uppercase tracking-wider">
                            {options.algorithm === 'sigmanest' ? 'Endüstriyel Akıllı' : options.algorithm.toUpperCase()}
                        </span>
                    </div>

                    {/* Solve & Reset Bar */}
                    <div className="flex gap-2">
                        <button 
                            type="button"
                            onClick={handleOptimize} 
                            disabled={parts.length === 0 || isRunning}
                            className={`flex-1 py-3 px-3 rounded-xl font-black uppercase text-[11px] tracking-wider transition-all flex items-center justify-center gap-2 shadow-xl cursor-pointer ${
                                parts.length === 0 || isRunning ? 'bg-white/5 text-slate-600 cursor-not-allowed' : 'bg-cyan-600 hover:bg-cyan-500 text-white active:scale-[0.98]'
                            }`}
                        >
                            {isRunning ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} fill="currentColor" />}
                            <span>{isRunning ? `Hesaplanıyor: ${progress?.percent || 0}%` : `Yerleşimi Çöz (${totalPartsCount})`}</span>
                        </button>
                        <button 
                            type="button"
                            onClick={handleReset} 
                            title="Tümünü Sıfırla" 
                            className="w-10 h-11 bg-white/5 border border-white/10 text-slate-400 rounded-xl flex items-center justify-center hover:bg-white/10 hover:text-white transition-all cursor-pointer shrink-0"
                        >
                            <RotateCcw size={16} />
                        </button>
                        {result && (
                            <>
                                <button 
                                    type="button"
                                    onClick={() => setIsReportModalOpen(true)}
                                    title="Üretim İş Emri & Kalıntı Raporu (PDF)"
                                    className="w-10 h-11 bg-[var(--cyan-glow)] border border-[var(--cyan)]/40 text-[var(--cyan)] rounded-xl flex items-center justify-center hover:bg-cyan-600 hover:text-white transition-all cursor-pointer shrink-0"
                                >
                                    <FileText size={16} />
                                </button>
                                <button 
                                    type="button"
                                    onClick={handleExportDXF} 
                                    title="Yerleşim DXF İndir"
                                    className="w-10 h-11 bg-[var(--cyan-glow)] border border-[var(--cyan)]/40 text-[var(--cyan)] rounded-xl flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all cursor-pointer shrink-0"
                                >
                                    <Download size={16} />
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* MAIN AREA - Edge-to-edge full workspace window */}
            <div className="flex-1 flex flex-col h-full w-full overflow-hidden z-10 relative bg-[var(--bg-0)]">
                {/* Floating Expand Sidebar Button when collapsed */}
                {isSidebarCollapsed && (
                    <button
                        type="button"
                        onClick={() => setIsSidebarCollapsed(false)}
                        title="Parametre Panelini Aç"
                        className="absolute top-2.5 left-3 z-30 px-3 py-1.5 rounded-xl bg-cyan-600/90 hover:bg-cyan-500 text-white shadow-xl transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                    >
                        <PanelLeftOpen size={16} />
                        <span>Panel</span>
                    </button>
                )}

                {/* Subtle Radial Glow */}

                {/* Results Widget (Collapsible / Sleek HUD Bar) */}
                <AnimatePresence>
                    {result && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="px-4 py-2 bg-[var(--bg-0)] border-b border-white/10 grid grid-cols-2 md:grid-cols-5 gap-2 shrink-0 z-20 shadow-md"
                        >
                            <ValueCard label="Sac Adedi" value={String(result.totalSheets)} unit="PLAKA" color="#00e5ff" />
                            <ValueCard label="Sac Doluluğu" value={result.totalEfficiency.toFixed(1)} unit="%" sub="TÜM ALAN" color="#10b981" />
                            <ValueCard label="Fire Alanı" value={(result.totalWaste / 1000000).toFixed(3)} unit="m²" color="#f59e0b" />
                            <ValueCard label="Malzeme Tutarı" value={estimatedMaterialCost.toFixed(0)} unit="€" sub={`@ ${materialCostPerM2} €/m²`} color="#3b82f6" />
                            <ValueCard label="Hesap Süresi" value={String(result.computeTimeMs.toFixed(0))} unit="ms" sub={options.algorithm.toUpperCase()} color="#94a3b8" />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Simulation Canvas Viewport - Edge-to-edge 100% full screen coverage */}
                <div className="flex-1 w-full h-full min-h-0 relative flex flex-col overflow-hidden">
                    <NestingCanvas
                        sheet={sheet}
                        result={result?.sheets[currentSheetIndex] || null}
                        currentSheetIndex={currentSheetIndex}
                        sheetCount={result?.sheets.length || 1}
                        onSelectSheet={setCurrentSheetIndex}
                        toolpathJob={toolpathJob}
                        className="w-full h-full"
                    />

                    {result?.unplacedParts?.length ? (
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-red-500/20 border border-red-500/40 rounded-full text-[10px] font-bold text-red-300 uppercase tracking-widest flex items-center gap-2 shadow-lg z-30">
                            <AlertCircle size={13} className="text-red-400" /> {result.unplacedParts.length} Sığmayan Parça Tespit Edildi
                        </div>
                    ) : null}
                </div>
            </div>

            {/* Dynamic Blocks Library to Nesting Modal (38+ Types) */}
            <DynamicBlockNestingModal
                isOpen={isDynamicBlockModalOpen}
                onClose={() => setIsDynamicBlockModalOpen(false)}
                onAddPart={(part) => {
                    setParts(prev => [...prev, part]);
                    if (result) {
                        reset();
                        setHexResult(null);
                    }
                }}
            />

            {/* Excel / CSV BOM Import Modal (Endüstriyel CAM Uyumlu) */}
            <ExcelBomImportModal
                isOpen={isExcelModalOpen}
                onClose={() => setIsExcelModalOpen(false)}
                onImportParts={handleImportBomParts}
                existingParts={parts}
            />

            {/* Endüstriyel Üretim Yerleşim Raporu Modal ("Yerleşim Detayı") */}
            <SigmaNestReportModal
                isOpen={isReportModalOpen}
                onClose={() => setIsReportModalOpen(false)}
                reportData={reportData}
                onSaveRemnant={handleSaveRemnant}
                onDownloadMpg={handleDownloadMpg}
            />
        </div>
    );
}

function ParameterInput({ label, unit, value, onChange, icon, min, max = 1000 }: {
    label: string;
    unit: string;
    value: number;
    onChange: (val: number) => void;
    icon?: React.ReactNode;
    min?: number;
    max?: number;
}) {
    const isDimension = label.includes('Eni') || label.includes('Boyu');
    const sliderMax = isDimension ? 16000 : label.includes('Fiyat') ? (max || 500) : (max || 1000);
    const sliderMin = min !== undefined ? min : (isDimension ? 100 : 1);
    const step = isDimension ? 10 : (min !== undefined && min < 1 ? 0.5 : 1);

    return (
        <div className="space-y-1.5 group">
            <div className="flex justify-between items-center px-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    {icon} {label}
                </span>
                <div className="flex items-center gap-1">
                    <input
                        type="number"
                        min={sliderMin}
                        max={sliderMax}
                        step={step}
                        value={value}
                        onChange={(e) => {
                            const val = Number(e.target.value);
                            if (!isNaN(val)) onChange(Math.max(sliderMin, Math.min(sliderMax, val)));
                        }}
                        className="w-16 bg-[var(--bg-0)] border border-white/10 rounded px-1.5 py-0.5 text-[10px] font-mono text-cyan-400 text-right font-bold focus:outline-none focus:border-cyan-400"
                    />
                    <span className="text-[10px] font-mono text-slate-400">{unit}</span>
                    {isDimension && value >= 1000 && (
                        <span className="text-[9px] font-mono text-emerald-400 font-bold ml-1">
                            ({(value / 1000).toFixed(value % 1000 === 0 ? 0 : 2)}m)
                        </span>
                    )}
                </div>
            </div>
            <input 
                type="range" 
                min={sliderMin} 
                max={sliderMax} 
                step={step} 
                value={value} 
                onChange={(e) => onChange(Number(e.target.value))} 
                className="w-full accent-[var(--cyan)] cursor-pointer" 
            />
        </div>
    );
}

function ValueCard({ label, value, unit, sub, color }: {
    label: string;
    value: string;
    unit?: string;
    sub?: string;
    color?: string;
}) {
    return (
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-3 opacity-[0.03] group-hover:opacity-10 transition-opacity"><Layers size={48}/></div>
            <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">{label}</div>
            <div className="flex items-baseline gap-2">
                <div className="text-2xl font-black font-mono text-white leading-none tracking-tighter" style={{ color: color }}>{value}</div>
                {unit && <span className="text-xs font-bold text-slate-600 uppercase italic">{unit}</span>}
            </div>
            {sub && <div className="text-[8px] font-bold mt-1 uppercase tracking-widest text-slate-600">{sub}</div>}
        </div>
    );
}
