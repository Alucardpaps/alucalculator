"use client";
import { useState, useMemo, useRef, useEffect, startTransition } from "react";
import { useDriveTrainCalculator } from "@/hooks/useDriveTrainCalculator";
import { IEC_MOTORS } from "@/data/motorData";
import { GEAR_MATERIALS } from "@/data/gearsData";
import { motion, AnimatePresence } from 'framer-motion';
import {
    Settings, ShieldCheck, ShieldAlert, Zap, Layers, Cog, Gauge, Wrench, ChevronDown, ChevronUp, Download, RotateCcw, Plus, Trash2, GitBranch, Cpu, Ruler, Activity, Eye, RefreshCw, Disc, FileSpreadsheet, Box, AlertTriangle, Copy, Check, MoveRight, BookOpen
} from 'lucide-react';
import { SaveButton } from "@/components/calculation/SaveButton";
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import { drawApprovalBlock, drawBrandedFooters, drawBrandedHeader, pdfSafe } from '@/lib/report/pdfBranding';
import autoTable from 'jspdf-autotable';
import { getGearsModuleStrings } from '@/locales/gearsModuleTranslations';
import { useI18nStore } from '@/store/i18nStore';
import { t12 } from '@/locales/t12';
import { AluShareButton } from '@/share/components/AluShareButton';
import { APP_RELEASE_NAME } from '@/config/app';
import { CrossModuleBridge, GearTransferItem } from '@/system/crossModuleBridge';
import { useMissionStore } from '@/store/useMissionStore';
import {
    GearTrainNode,
    GearKind,
    solveGearTrain,
    autoFixGearTrain,
    computeGearManufacturingData,
    DEFAULT_COMPOUND_PRESET,
    THREE_STAGE_HEAVY_PRESET,
    BEVEL_HELICAL_PRESET,
    PLANETARY_TRAIN_PRESET,
    INTERNAL_HYBRID_PRESET,
    DUAL_PLANETARY_CASCADE_PRESET
} from '@/data/gearTrainEngine';
import { MultiGearTrainSVG } from './MultiGearTrainSVG';
import { GearManufacturingPassport } from './GearManufacturingPassport';
import { useKineticSpin } from '@/hooks/useKineticSpin';
import {
    generateExternalGearContour,
    generateInternalGearContour,
    pointsToSvgPath,
    downloadGearProductionSvg,
    downloadGearProductionDxf,
    calculateInvoluteGearSpecs,
    helixFaceTwistDeg,
    helixHandLabel,
} from '@/engines/math/gear-involute-factory';
import {
    computeTipShorteningData,
    matchCenterDistanceForGearPair,
    searchBestGearsForCenterDistance,
    synthesizeGearAutonomous,
    ISO_STANDARD_MODULES,
    GearRecommendationCandidate,
    AutonomousSizingResult,
} from '@/engines/math/gearSynthesisEngine';
import {
    KhkRackAndPinionView,
    KhkBevelGearView,
    KhkWormGearView,
    KhkScrewGearView,
    KhkRackControls,
    KhkRackView,
    KhkBevelControls,
    KhkBevelView,
    KhkWormControls,
    KhkWormView,
    KhkScrewControls,
    KhkScrewView,
    KhkInternalInterferenceBanner,
} from './KhkGearFamilyViews';
import { GearStandardsCitationsModal } from './GearStandardsCitationsModal';
import { useGlobalPrecision, formatEngineeringValue } from '@/components/calculator-kit/precisionUtils';

export type KhkGearFamily = 'cylindrical' | 'internal' | 'rack' | 'bevel' | 'worm' | 'screw';
export type GearPairTab = 'RESULT' | 'GEOMETRY' | 'STRENGTH' | 'MANUFACTURING' | 'CAD' | 'AUDIT' | 'WORKSTATION';

export function GearsModule({ lang, dict: dictProp }: { lang?: string, dict?: any } = {}) {
  const precision = useGlobalPrecision();
    const dict = dictProp ?? {};
    const { language } = useI18nStore();
    const currentLang = lang || language;
    const s = getGearsModuleStrings(currentLang);
    const [khkFamily, setKhkFamily] = useState<KhkGearFamily>('cylindrical');
    const [pairViewTab, setPairViewTab] = useState<GearPairTab>('RESULT');
    const [isStandardsModalOpen, setIsStandardsModalOpen] = useState<boolean>(false);
    const {
        selectedPower, setSelectedPower,
        selectedPoles, setSelectedPoles,
        motor,
        gearModule, setGearModule,
        meshType, setMeshType,
        z1, setZ1,
        z2, setZ2,
        helixAngle, setHelixAngle,
        pressureAngle, setPressureAngle,
        faceWidth, setFaceWidth,
        materialName, setMaterialName,
        results,
        x1, setX1, x2, setX2,
        pinDia1, setPinDia1, pinDia2, setPinDia2,
        loadClass, setLoadClass,
        dailyHours, setDailyHours,
        startsPerHour, setStartsPerHour,
        connectionType, setConnectionType,
        kFactorMode, setKFactorMode,
        customK, setCustomK,
        customK1, setCustomK1,
        customK2, setCustomK2,
        linkK, setLinkK,
    } = useDriveTrainCalculator();

    const material = useMemo(() => GEAR_MATERIALS.find(m => m.name === materialName) || GEAR_MATERIALS[0], [materialName]);

    // ═══ WORKFLOW MODE: PAIR vs MULTI-GEAR TRAIN ═══
    const [workflowMode, setWorkflowMode] = useState<'pair' | 'train'>('pair');
    const [trainViewMode, setTrainViewMode] = useState<'both' | 'front' | 'top_section'>('both');
    const [selectedDim, setSelectedDim] = useState<string | null>(null);

    // ═══ 3-SYSTEM CALCULATION MODE FOR PAIR ═══
    // 1: Standard Direct Solver (with Kafa Kısaltma +/- k)
    // 2: Center Distance & Tooth/Module Matcher (Recommends "En Makul Dişli")
    // 3: Autonomous AI Sizing Engine (Calculates Module & Teeth Automatically from Power/Torque & RPM)
    const [pairSystemMode, setPairSystemMode] = useState<'standard' | 'center_match' | 'autonomous'>('standard');

    // --- Sistem 2: Center Distance Matching State ---
    const [centerMatchTargetA, setCenterMatchTargetA] = useState<number>(120);
    const [centerMatchPreferredType, setCenterMatchPreferredType] = useState<'any' | 'spur' | 'helical'>('any');

    useEffect(() => {
        if (results.a > 0 && centerMatchTargetA === 120) {
            setCenterMatchTargetA(Number(results.a.toFixed(2)));
        }
    }, [results.a]);

    const centerMatchResult = useMemo(() => {
        return matchCenterDistanceForGearPair({
            mn: gearModule,
            z1,
            z2,
            targetA: centerMatchTargetA || 120,
            alphaDeg: pressureAngle,
        });
    }, [gearModule, z1, z2, centerMatchTargetA, pressureAngle]);

    const centerMatchCandidates = useMemo(() => {
        return searchBestGearsForCenterDistance({
            mn: gearModule,
            targetA: centerMatchTargetA || 120,
            targetRatio: z2 / z1,
            ratioTolerancePct: 35,
            preferredType: centerMatchPreferredType,
        });
    }, [gearModule, centerMatchTargetA, z1, z2, centerMatchPreferredType]);

    // --- Sistem 3: Autonomous Sizing State ---
    const [autoPowerKw, setAutoPowerKw] = useState<number>(selectedPower || 4.0);
    const [autoInputRpm, setAutoInputRpm] = useState<number>(1450);
    const [autoTargetRpm, setAutoTargetRpm] = useState<number>(290);
    const [autoGearType, setAutoGearType] = useState<'spur' | 'helical'>('helical');
    const [autoTargetCenterA, setAutoTargetCenterA] = useState<string>('');
    const [autoLoadType, setAutoLoadType] = useState<'uniform' | 'moderate' | 'heavy'>('moderate');

    const autoSizingResult = useMemo(() => {
        const targetA_num = parseFloat(autoTargetCenterA);
        return synthesizeGearAutonomous({
            powerKw: autoPowerKw,
            inputRpm: autoInputRpm,
            targetOutputRpm: autoTargetRpm,
            materialName,
            gearType: autoGearType,
            targetCenterDistance: !isNaN(targetA_num) && targetA_num > 10 ? targetA_num : undefined,
            loadType: autoLoadType,
        });
    }, [autoPowerKw, autoInputRpm, autoTargetRpm, materialName, autoGearType, autoTargetCenterA, autoLoadType]);

    const handleApplyCenterMatch = (candidate: GearRecommendationCandidate) => {
        setZ1(candidate.z1);
        setZ2(candidate.z2);
        setHelixAngle(Number(candidate.betaDeg.toFixed(2)));
        setX1(candidate.x1);
        setX2(candidate.x2);
        if (candidate.k !== 0) {
            setKFactorMode('custom');
            setCustomK(candidate.k);
        } else {
            setKFactorMode('auto');
        }
        setPairSystemMode('standard');
    };

    const handleApplyAutonomous = (sizing: AutonomousSizingResult) => {
        setSelectedPower(autoPowerKw);
        setGearModule(sizing.recommendedModule);
        setZ1(sizing.z1);
        setZ2(sizing.z2);
        setHelixAngle(Number(sizing.helixAngleDeg.toFixed(2)));
        setFaceWidth(sizing.faceWidthMm);
        setX1(sizing.x1);
        setX2(sizing.x2);
        if (sizing.k !== 0) {
            setKFactorMode('custom');
            setCustomK(sizing.k);
        } else {
            setKFactorMode('auto');
        }
        setPairSystemMode('standard');
    };

    // ═══ MULTI-GEAR / COMPOUND TRAIN STATE ═══
    const [trainNodes, setTrainNodes] = useState<GearTrainNode[]>(DEFAULT_COMPOUND_PRESET);
    const [selectedTrainGearId, setSelectedTrainGearId] = useState<string>('g1');

    // Solve Gear Train
    const motorSpeed = selectedPoles === 2 ? motor.speed_2p : selectedPoles === 4 ? motor.speed_4p : motor.speed_6p;
    const trainResults = useMemo(() => {
        return solveGearTrain(trainNodes, motorSpeed || 1450, selectedPower);
    }, [trainNodes, motorSpeed, selectedPower]);

    const selectedGear = useMemo(() => {
        return trainResults.gears.find(g => g.id === selectedTrainGearId) || trainResults.gears[0];
    }, [trainResults, selectedTrainGearId]);

    // Train Node Mutators
    const updateActiveTrainGear = (updates: Partial<GearTrainNode>) => {
        setTrainNodes(prev => prev.map(g => g.id === selectedTrainGearId ? { ...g, ...updates } : g));
    };

    // Reset Function for All 6 Presets
    const resetTrainToDefault = (preset: 'compound' | 'three_stage' | 'bevel_helical' | 'planetary' | 'hybrid' | 'dual_planetary' = 'compound') => {
        if (preset === 'three_stage') {
            setTrainNodes(THREE_STAGE_HEAVY_PRESET);
            setSelectedTrainGearId('g1');
        } else if (preset === 'bevel_helical') {
            setTrainNodes(BEVEL_HELICAL_PRESET);
            setSelectedTrainGearId('g1');
        } else if (preset === 'planetary') {
            setTrainNodes(PLANETARY_TRAIN_PRESET);
            setSelectedTrainGearId('g2');
        } else if (preset === 'hybrid') {
            setTrainNodes(INTERNAL_HYBRID_PRESET);
            setSelectedTrainGearId('g2');
        } else if (preset === 'dual_planetary') {
            setTrainNodes(DUAL_PLANETARY_CASCADE_PRESET);
            setSelectedTrainGearId('g2');
        } else {
            setTrainNodes(DEFAULT_COMPOUND_PRESET);
            setSelectedTrainGearId('g1');
        }
    };

    const addMeshGearToTrain = (kind: GearKind = 'external') => {
        const lastGear = trainNodes[trainNodes.length - 1];
        const nextId = 'g' + (trainNodes.length + 1);
        const nextShaft = lastGear.shaftId + 1;
        const newGear: GearTrainNode = {
            id: nextId,
            name: kind === 'planetary_stage'
                ? 'G' + (trainNodes.length + 1) + (t12(currentLang, ' (Planetary Stage)', ' (Planet Kademesi)'))
                : kind === 'internal'
                ? 'G' + (trainNodes.length + 1) + (t12(currentLang, ' (Internal Ring)', ' (İç Çember Ring)'))
                : 'G' + (trainNodes.length + 1) + (t12(currentLang, ' (External Gear)', ' (Dış Çark)')),
            shaftId: nextShaft,
            isCoaxial: false,
            gearType: kind,
            teeth: kind === 'planetary_stage' ? 20 : 40,
            planetTeeth: kind === 'planetary_stage' ? 25 : undefined,
            ringTeeth: kind === 'planetary_stage' ? 70 : undefined,
            module: lastGear.module,
            helixAngle: lastGear.helixAngle,
            pressureAngle: 20,
            faceWidth: lastGear.faceWidth,
            profileShift: 0,
            material: lastGear.material,
        };
        setTrainNodes(prev => [...prev, newGear]);
        setSelectedTrainGearId(nextId);
    };

    const addCoaxialGearToTrain = () => {
        const active = trainNodes.find(g => g.id === selectedTrainGearId) || trainNodes[trainNodes.length - 1];
        const nextId = 'g' + (trainNodes.length + 1);
        const newGear: GearTrainNode = {
            id: nextId,
            name: 'G' + (trainNodes.length + 1) + (t12(currentLang, ' (Coaxial Shaft ', ' (Koaksiyel Mil ')) + active.shaftId + ')',
            shaftId: active.shaftId,
            isCoaxial: true,
            gearType: 'external',
            teeth: 20,
            module: active.module,
            helixAngle: active.helixAngle,
            pressureAngle: 20,
            faceWidth: active.faceWidth,
            profileShift: 0,
            material: active.material,
        };
        setTrainNodes(prev => [...prev, newGear]);
        setSelectedTrainGearId(nextId);
    };

    const removeTrainGear = (id: string) => {
        if (trainNodes.length <= 2) return;
        const remaining = trainNodes.filter(g => g.id !== id);
        setTrainNodes(remaining);
        if (selectedTrainGearId === id) {
            setSelectedTrainGearId(remaining[0].id);
        }
    };

    const [expandedSection, setExpandedSection] = useState<string | null>('geometry');
    const [isExporting, setIsExporting] = useState(false);
    
    const printRef = useRef<HTMLDivElement>(null);

    const isSafe = results.SF_bending >= 1.4 && results.SF_contact >= 1.2;
    const activeColor = isSafe ? '#00e5ff' : '#ef4444';

    const toggleSection = (id: string) => {
        setExpandedSection(expandedSection === id ? null : id);
    };

    const exportTrainToCSV = () => {
        const headers = [
            t12(currentLang, "Gear Name", "Dişli Adı"),
            t12(currentLang, "Shaft No", "Mil No"),
            t12(currentLang, "Coaxial", "Koaksiyel"),
            t12(currentLang, "Gear Type", "Dişli Türü"),
            t12(currentLang, "Teeth (z)", "Diş Sayısı (z)"),
            t12(currentLang, "Module (m mm)", "Modül (m mm)"),
            t12(currentLang, "Helix Angle (deg)", "Helis Açısı (deg)"),
            t12(currentLang, "Face Width (b mm)", "Diş Genişliği (b mm)"),
            t12(currentLang, "Speed (RPM)", "Devir (RPM)"),
            t12(currentLang, "Torque (Nm)", "Tork (Nm)"),
            t12(currentLang, "Pitch Dia (d mm)", "Bölüm Çapı (d mm)"),
            t12(currentLang, "Tip Dia (da mm)", "Tepe Çapı (da mm)"),
            t12(currentLang, "Root Dia (df mm)", "Kök Çapı (df mm)"),
            t12(currentLang, "Wildhaber Span (Wk mm)", "Wildhaber (Wk mm)"),
            t12(currentLang, "Dimension Over Pins (Md mm)", "Pim Ölçüsü (Md mm)"),
            t12(currentLang, "Tangential Force (Ft N)", "Teğetsel Kuvvet (Ft N)"),
            t12(currentLang, "Bending Stress (sigma_F MPa)", "Eğilme Gerilmesi (sigma_F MPa)"),
            t12(currentLang, "Bending Safety (SF)", "Eğilme Emniyeti (SF)"),
            t12(currentLang, "Contact Stress (sigma_H MPa)", "Ezilme Gerilmesi (sigma_H MPa)"),
            t12(currentLang, "Contact Safety (SH)", "Ezilme Emniyeti (SH)"),
            t12(currentLang, "Min Shaft Dia (mm)", "Min Mil Çapı (mm)"),
            t12(currentLang, "Material", "Malzeme"),
            t12(currentLang, "Manufacturing Process", "İmalat Yöntemi")
        ];
        const rows = trainResults.gears.map(g => [
            `"${g.name}"`, g.shaftId, g.isCoaxial ? (t12(currentLang, 'Yes', 'Evet')) : (t12(currentLang, 'No', 'Hayır')), g.gearType, g.teeth, g.module, g.helixAngle,
            g.faceWidth, formatEngineeringValue(g.rpm, precision, false), formatEngineeringValue(g.torque, precision, false), formatEngineeringValue(g.d, precision, false), formatEngineeringValue(g.da, precision, false),
            formatEngineeringValue(g.df, precision, false), formatEngineeringValue(g.wildhaberW || 0, precision, false), formatEngineeringValue(g.dimensionOverPins || 0, precision, false), g.Ft || 0,
            g.sigma_F || 0, formatEngineeringValue(g.SF_bending || 0, precision, false), g.sigma_H || 0, formatEngineeringValue(g.SF_contact || 0, precision, false),
            g.minShaftDiameter || 20, `"${g.material}"`, `"${g.recMachining}"`
        ]);
        const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(";"), ...rows.map(e => e.join(";"))].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `AluCAD_Gear_Train_Report_i${trainResults.totalRatio.toFixed(2)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const exportToPDF = async () => {
        if (!printRef.current) return;
        try {
            setIsExporting(true);
            
            printRef.current.style.display = 'block';
            printRef.current.style.position = 'absolute';
            printRef.current.style.top = '-9999px';
            printRef.current.style.left = '-9999px';
            
            const dataUrl = await toPng(printRef.current, { 
                quality: 1, 
                pixelRatio: 2,
                backgroundColor: '#ffffff'
            });
            
            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: 'a4'
            });
            
            pdf.addImage(dataUrl, 'PNG', 0, 0, 297, 210);
            const fileName = workflowMode === 'train'
                ? `AluCAD_Gear_Train_i${formatEngineeringValue(trainResults.totalRatio, precision, false)}_${trainResults.gears.length}gears.pdf`
                : `Gear_Production_Drawing_m${gearModule}_z${z1}_z${z2}_${meshType}.pdf`;
            pdf.save(fileName);
            
        } catch (err) {
            console.error('PDF export failed', err);
        } finally {
            if (printRef.current) {
                printRef.current.style.display = 'none';
            }
            setIsExporting(false);
        }
    };

    // External mesh: mating gear helix is opposite hand. Internal mesh: same hand.
    const drivenHelixAngle = meshType === 'internal' ? helixAngle : -helixAngle;

    const handleDownload1to1Svg = (target: 'pinion' | 'gear') => {
        if (target === 'pinion') {
            downloadGearProductionSvg({
                module: gearModule,
                teeth: z1,
                pressureAngle,
                helixAngle,
                profileShift: x1,
                tipShortening: results.k,
                faceWidth,
                boreDiameter: pinDia1 > 0 ? pinDia1 : undefined,
                hasKeyway: true,
            }, `pinion_z${z1}_mn${gearModule}_b${helixAngle}${helixHandLabel(helixAngle)}_1to1_CAM.svg`, {
                customTitle: `Pinion z1=${z1} mn=${gearModule}mm β=${helixAngle}° ${helixHandLabel(helixAngle)}`,
                material: material.name,
            });
        } else {
            downloadGearProductionSvg({
                module: gearModule,
                teeth: z2,
                pressureAngle,
                helixAngle: drivenHelixAngle,
                profileShift: x2,
                tipShortening: results.k,
                faceWidth,
                boreDiameter: pinDia2 > 0 ? pinDia2 : undefined,
                isInternal: meshType === 'internal',
                hasKeyway: meshType !== 'internal',
            }, `gear_z${z2}_mn${gearModule}_b${drivenHelixAngle}${helixHandLabel(drivenHelixAngle)}_1to1_CAM.svg`, {
                customTitle: meshType === 'internal'
                    ? `Internal Ring z2=${z2} mn=${gearModule}mm β=${drivenHelixAngle}° ${helixHandLabel(drivenHelixAngle)}`
                    : `Driven Gear z2=${z2} mn=${gearModule}mm β=${drivenHelixAngle}° ${helixHandLabel(drivenHelixAngle)}`,
                material: material.name,
            });
        }
    };

    const handleDownload1to1Dxf = (target: 'pinion' | 'gear') => {
        if (target === 'pinion') {
            downloadGearProductionDxf({
                module: gearModule,
                teeth: z1,
                pressureAngle,
                helixAngle,
                profileShift: x1,
                tipShortening: results.k,
                faceWidth,
                boreDiameter: pinDia1 > 0 ? pinDia1 : undefined,
                hasKeyway: true,
            }, `pinion_z${z1}_mn${gearModule}_b${helixAngle}${helixHandLabel(helixAngle)}_1to1.dxf`);
        } else {
            downloadGearProductionDxf({
                module: gearModule,
                teeth: z2,
                pressureAngle,
                helixAngle: drivenHelixAngle,
                profileShift: x2,
                tipShortening: results.k,
                faceWidth,
                boreDiameter: pinDia2 > 0 ? pinDia2 : undefined,
                isInternal: meshType === 'internal',
                hasKeyway: meshType !== 'internal',
            }, `gear_z${z2}_mn${gearModule}_b${drivenHelixAngle}${helixHandLabel(drivenHelixAngle)}_1to1.dxf`);
        }
    };

    // Live Mission Progress Reporting
    useEffect(() => {
        useMissionStore.getState().reportModuleState('gears', {
            module: gearModule,
            z1,
            z2,
            helixAngle,
            meshType,
            centerDistance: results.a,
            ratio: results.ratio
        });
    }, [gearModule, z1, z2, helixAngle, meshType, results.a, results.ratio]);

    const handleExportTo3DAssembly = () => {
        if (workflowMode === 'train') {
            const items: GearTransferItem[] = trainResults.gears.map(g => ({
                name: g.name,
                teeth: g.teeth,
                module: g.module,
                faceWidth: g.faceWidth,
                helixAngle: g.helixAngle,
                pressureAngle: g.pressureAngle,
                profileShift: g.profileShift,
                material: g.material,
                shaftId: g.shaftId,
                isCoaxial: g.isCoaxial,
                gearType: g.gearType,
                isInternal: g.gearType === 'internal',
                hasKeyway: g.gearType !== 'internal',
                ringOuterDia: g.gearType === 'internal' ? g.module * (g.teeth + 6) : undefined,
            }));
            const res = CrossModuleBridge.exportGearsTo3D(items, { clearExisting: false, switchWindow: true });
            useMissionStore.getState().reportModuleAction('gears', 'exportedTo3D', { count: res.totalGears });
            if (typeof window !== 'undefined') {
                window.location.href = '/design-studio/';
            }
        } else {
            const isInternalMesh = meshType === 'internal';
            const items: GearTransferItem[] = [
                {
                    name: `${t12(currentLang, 'Pinion', 'Pinyon')} (z=${z1})`,
                    teeth: z1,
                    module: gearModule,
                    faceWidth: faceWidth,
                    helixAngle: helixAngle,
                    pressureAngle: pressureAngle,
                    profileShift: x1,
                    boreDiameter: pinDia1 > 0 ? pinDia1 : undefined,
                    hasKeyway: true,
                    material: materialName,
                    gearType: 'external',
                    isInternal: false,
                },
                {
                    name: isInternalMesh 
                        ? (t12(currentLang, `Internal Ring Gear (z=${z2})`, `İç Çember Dişli (Ring z=${z2})`))
                        : `${t12(currentLang, 'Gear', 'Çark')} (z=${z2})`,
                    teeth: z2,
                    module: gearModule,
                    faceWidth: z2 > 0 ? faceWidth : 20,
                    helixAngle: drivenHelixAngle,
                    pressureAngle: pressureAngle,
                    profileShift: x2,
                    boreDiameter: isInternalMesh ? 0 : (pinDia2 > 0 ? pinDia2 : undefined),
                    hasKeyway: !isInternalMesh,
                    material: materialName,
                    gearType: isInternalMesh ? 'internal' : 'external',
                    isInternal: isInternalMesh,
                    ringOuterDia: isInternalMesh ? results.D_ring : undefined,
                }
            ];
            const res = CrossModuleBridge.exportGearsTo3D(items, { 
                centerDistance: results.a, 
                meshType: meshType, 
                clearExisting: false, 
                switchWindow: true 
            });
            useMissionStore.getState().reportModuleAction('gears', 'exportedTo3D', { count: res.totalGears });
            if (typeof window !== 'undefined') {
                window.location.href = '/design-studio/';
            }
        }
    };

    const handleExportTo2DCad = () => {
        if (workflowMode === 'train') {
            if (!trainResults || trainResults.gears.length < 2) return;
            const g1 = trainResults.gears[0];
            const g2 = trainResults.gears[1];
            CrossModuleBridge.exportGearPairTo2DCad({
                title: `Gear Train (${trainNodes.length} Gears) Stage 1`,
                d1: g1.d,
                d2: g2.d,
                da1: g1.da,
                da2: g2.da,
                centerDistance: Math.abs(g1.d + (g2.gearType === 'internal' ? -g2.d : g2.d)) / 2,
                teeth1: g1.teeth,
                teeth2: g2.teeth,
                module: g1.module,
                switchWindow: true,
            });
        } else {
            CrossModuleBridge.exportGearPairTo2DCad({
                title: `Gear Pair m=${gearModule} z1=${z1} z2=${z2} (${meshType})`,
                d1: results.d1,
                d2: results.d2,
                da1: results.da1,
                da2: results.da2,
                centerDistance: results.a,
                teeth1: z1,
                teeth2: z2,
                module: gearModule,
                switchWindow: true,
            });
        }
    };

    const exportTrainPDF = () => {
        if (!trainResults || trainResults.gears.length === 0) return;
        const doc = new jsPDF();

        // Title & Header — company logo/name from Settings → Reports
        const y0 = drawBrandedHeader(doc, 'Gear Train Report', `ISO 6336 · DIN 3960 · ISO 1328 | ${new Date().toLocaleString()}`);

        // Overall Drive Metrics
        const overallData = [
            ['Input Motor Power (kW)', `${selectedPower} kW`],
            ['Input Speed (RPM)', `${trainResults.inputRpm} RPM`],
            ['Input Torque (Nm)', `${trainResults.inputTorqueNm} Nm`],
            ['Overall Gear Ratio (i)', `${trainResults.totalRatio}:1`],
            ['Output Speed (RPM)', `${trainResults.outputRpm} RPM`],
            ['Output Torque (Nm)', `${trainResults.outputTorqueNm} Nm`],
            ['Total Train Efficiency', `${formatEngineeringValue((trainResults.overallEfficiency * 100), precision, false)}%`],
            ['Total Power Loss (kW)', `${trainResults.totalPowerLossKW} kW`],
            ['Heat Dissipation Req. (kW)', `${trainResults.heatDissipationReqKW} kW`],
            ['Recommended Lubricant', trainResults.lubrication]
        ];

        autoTable(doc, {
            startY: y0,
            margin: { bottom: 18 },
            head: [['Drive Train System Parameter', 'Calculated CAE Value']],
            body: overallData,
            theme: 'striped',
            headStyles: { fillColor: [60, 64, 72], fontSize: 8.5 },
            styles: { fontSize: 8, cellPadding: 2 }
        });

        // Stage by Stage Gear Geometry & Tooth Strengths
        const gearTableData = trainResults.gears.map((g) => [
            pdfSafe(String(g.name)),
            `Shaft ${g.shaftId}`,
            g.gearType,
            `z=${g.teeth}`,
            `m=${g.module}`,
            `d=${formatEngineeringValue(g.d, precision, false)}mm`,
            `${formatEngineeringValue(g.rpm, precision, false)} RPM`,
            `${formatEngineeringValue(g.torque, precision, false)} Nm`,
            `Ft=${formatEngineeringValue(g.Ft, precision, false)}N`,
            `SF_F=${formatEngineeringValue(g.SF_bending, precision, false)}`,
            `SF_H=${formatEngineeringValue(g.SF_contact, precision, false)}`,
            `Wk=${formatEngineeringValue(g.wildhaberW, precision, false)}mm`
        ]);

        const nextY = (doc as any).lastAutoTable.finalY + 10;
        doc.setFontSize(11);
        doc.setTextColor(25, 25, 25);
        doc.text('STAGE-BY-STAGE GEAR GEOMETRY, KINEMATICS & INSPECTION DATA', 14, nextY);

        autoTable(doc, {
            startY: nextY + 4,
            margin: { bottom: 18 },
            head: [['Gear', 'Shaft', 'Type', 'Teeth', 'Module', 'Pitch Dia', 'RPM', 'Torque', 'Tang. Ft', 'SF_bend', 'SF_cont', 'Wildhaber Wk']],
            body: gearTableData,
            theme: 'grid',
            headStyles: { fillColor: [24, 110, 140], fontSize: 7.5 },
            styles: { fontSize: 7, cellPadding: 1.8 }
        });

        drawApprovalBlock(doc, (doc as any).lastAutoTable.finalY + 8, document.documentElement.lang);
        drawBrandedFooters(doc, 'ISO 6336 / DIN 3960 - verify before manufacturing');
        doc.save(`AluCAD_OS_GearTrain_${Date.now()}.pdf`);
    };

    const exportTrainCSV = () => {
        if (!trainResults || trainResults.gears.length === 0) return;
        const rows = [
            ['Gear ID', 'Gear Name', 'Shaft #', 'Is Coaxial', 'Gear Type', 'Teeth (z)', 'Module (mn)', 'Helix Angle (deg)', 'Pressure Angle', 'Profile Shift (x)', 'Face Width (mm)', 'Material', 'Speed (RPM)', 'Torque (Nm)', 'Pitch Dia d (mm)', 'Tip Dia da (mm)', 'Root Dia df (mm)', 'Base Dia db (mm)', 'Tangential Ft (N)', 'Radial Fr (N)', 'Axial Fa (N)', 'Bending Stress (MPa)', 'Safety Bending', 'Contact Stress (MPa)', 'Safety Contact', 'Wildhaber Wk (mm)', 'Span Teeth k', 'Dimension Over Pins (mm)', 'Recommended Machining']
        ];

        trainResults.gears.forEach(g => {
            rows.push([
                g.id,
                g.name,
                String(g.shaftId),
                g.isCoaxial ? 'YES' : 'NO',
                g.gearType,
                String(g.teeth),
                String(g.module),
                String(g.helixAngle),
                String(g.pressureAngle),
                String(g.profileShift),
                String(g.faceWidth),
                g.material,
                formatEngineeringValue(g.rpm, precision, false),
                formatEngineeringValue(g.torque, precision, false),
                formatEngineeringValue(g.d, precision, false),
                formatEngineeringValue(g.da, precision, false),
                formatEngineeringValue(g.df, precision, false),
                formatEngineeringValue(g.db, precision, false),
                formatEngineeringValue(g.Ft, precision, false),
                formatEngineeringValue(g.Fr, precision, false),
                formatEngineeringValue(g.Fa, precision, false),
                formatEngineeringValue(g.sigma_F, precision, false),
                formatEngineeringValue(g.SF_bending, precision, false),
                formatEngineeringValue(g.sigma_H, precision, false),
                formatEngineeringValue(g.SF_contact, precision, false),
                formatEngineeringValue(g.wildhaberW, precision, false),
                String(g.wildhaberK),
                formatEngineeringValue(g.dimensionOverPins, precision, false),
                g.recMachining
            ]);
        });

        const csvContent = '\uFEFF' + rows.map(e => e.map(cell => `"${cell}"`).join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `AluCAD_GearTrain_BOM_${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="flex flex-col lg:flex-row h-full w-full bg-[var(--bg-0)] text-white overflow-y-auto lg:overflow-hidden font-sans">
            {/* ═══ LEFT PANEL — Control Center (38%) ═══ */}
            <div className="w-full lg:w-[390px] xl:w-[420px] shrink-0 flex flex-col h-auto lg:h-full bg-[var(--bg-1)]/80 border-b lg:border-b-0 lg:border-r border-white/5 overflow-hidden">
                
                {/* Header */}
                <div className="flex-none px-5 pt-5 pb-3 border-b border-white/5 flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-cyan-500/10 rounded-xl border border-cyan-500/20 text-cyan-400 shrink-0">
                            <Cog size={20} strokeWidth={2} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h2 className="text-base font-black uppercase tracking-wider text-cyan-400 truncate">{dict.gear?.title || s.title}</h2>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="px-1.5 py-0.5 rounded bg-[var(--bg-2)] border border-[var(--line)] text-[var(--std)] text-[9px] font-mono font-bold">ISO 6336</span>
                                    <span className="px-1.5 py-0.5 rounded bg-[var(--bg-2)] border border-[var(--line)] text-[var(--ok)] text-[9px] font-mono font-bold">DIN 3960</span>
                                    <span className="px-1.5 py-0.5 rounded bg-[var(--bg-2)] border border-[var(--line)] text-[var(--cyan)] text-[9px] font-mono font-bold">JIS B 1702</span>
                                </div>
                            </div>
                            <p className="text-[9.5px] text-gray-400 font-bold uppercase tracking-widest mt-0.5 truncate">{dict.gear?.subtitle || s.subtitle}</p>
                        </div>
                    </div>
                    <div className={`grid ${workflowMode === 'train' ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-2 sm:grid-cols-3'} gap-1.5 w-full`}>
                        <button
                            type="button"
                            onClick={() => setIsStandardsModalOpen(true)}
                            className="px-2 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/40 rounded-xl text-[9px] font-black uppercase transition-all flex items-center justify-center gap-1 cursor-pointer w-full text-center"
                            title={t12(currentLang, "ISO / DIN / KHK Standards & Citations", "ISO / DIN / KHK Standartları ve Kaynakça")}
                        >
                            <BookOpen size={13} className="shrink-0" />
                            <span className="truncate">{t12(currentLang, "Standards", "Standartlar")}</span>
                        </button>
                        <AluShareButton
                            module="gear"
                            moduleTitle={workflowMode === 'train' ? "AluCalc Multi-Gear Train Kinematics" : "ISO 6336 Gear Design & Strength"}
                            className="w-full justify-center text-[9px] font-black uppercase px-2 py-1.5"
                            getPackageData={() => {
                                const inputs: Record<string, number> = workflowMode === 'train' ? {
                                    gearsCount: trainNodes.length,
                                    power: selectedPower,
                                    motorSpeed: motorSpeed || 1450,
                                } : {
                                    module: gearModule,
                                    teethPinion: z1,
                                    teethGear: z2,
                                    faceWidth,
                                    helixAngle,
                                    pressureAngle,
                                    power: selectedPower,
                                };

                                const outputs: Record<string, number> = workflowMode === 'train' ? {
                                    totalRatio: trainResults.totalRatio,
                                    outputRpm: trainResults.outputRpm,
                                    outputTorque: trainResults.outputTorqueNm,
                                    overallEfficiency: trainResults.overallEfficiency,
                                } : {
                                    pitchDiameterPinion: results.d1,
                                    pitchDiameterGear: results.d2,
                                    centerDistance: results.a,
                                    transmissionRatio: results.ratio,
                                    safetyBendingPinion: results.SF_bending || 1,
                                    safetyContact: results.SF_contact || 1,
                                };

                                return {
                                    inputs,
                                    outputs,
                                    name: workflowMode === 'train'
                                        ? `Gear Train (${trainNodes.length} Gears, i=${formatEngineeringValue(trainResults.totalRatio, precision, false)}:1)`
                                        : `Gear Stage m=${gearModule} z1=${z1} z2=${z2} (${meshType})`,
                                    unit_system: 'metric',
                                };
                            }}
                        />
                        {workflowMode === 'train' && (
                            <button 
                                onClick={exportTrainToCSV}
                                className="px-2 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 rounded-xl text-[9px] font-black uppercase transition-all flex items-center justify-center gap-1 cursor-pointer w-full text-center"
                                title={s.exportCSVTooltip}
                            >
                                <FileSpreadsheet size={12} className="shrink-0" />
                                <span className="truncate">{s.exportCSV}</span>
                            </button>
                        )}
                        <button 
                            onClick={exportToPDF}
                            disabled={isExporting}
                            className={`px-2 py-1.5 bg-cyan-500 hover:bg-cyan-600 text-black border border-cyan-500/20 rounded-xl text-[9px] font-black uppercase transition-all flex items-center justify-center gap-1 cursor-pointer w-full text-center ${isExporting ? 'opacity-50 cursor-not-allowed' : ''}`}
                            title={s.exportPDFTooltip}
                        >
                            {isExporting ? <RotateCcw size={13} className="animate-spin shrink-0" /> : <Download size={13} className="shrink-0" />} 
                            <span className="truncate">{s.exportPDF}</span>
                        </button>
                    </div>

                    {/* Workflow Mode Switcher: Single Pair vs Multi-Gear Train */}
                    <div className="grid grid-cols-2 gap-1.5 bg-[var(--bg-0)] p-1 rounded-xl border border-white/10 font-mono text-[10px]">
                        <button
                            type="button"
                            onClick={() => setWorkflowMode('pair')}
                            className={`py-1.5 px-2 rounded-lg font-bold uppercase transition-all flex items-center justify-center gap-1.5 ${
                                workflowMode === 'pair'
                                    ? 'bg-[var(--cyan)] text-[var(--accent-ink)] '
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            <Cog size={13} />
                            {s.pairMode}
                        </button>
                        <button
                            type="button"
                            onClick={() => setWorkflowMode('train')}
                            className={`py-1.5 px-2 rounded-lg font-bold uppercase transition-all flex items-center justify-center gap-1.5 ${
                                workflowMode === 'train'
                                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white '
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            <GitBranch size={13} />
                            {s.trainMode}
                        </button>
                    </div>

                    {/* KHK Gear Architecture & Calculation Mode Selector (for Pair Mode) */}
                    {workflowMode === 'pair' && (
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 px-1 uppercase tracking-wider">
                                <span>{t12(currentLang, 'KHK Gear Family', 'KHK Dişli Mimarisi')}</span>
                                <button
                                    type="button"
                                    onClick={() => setIsStandardsModalOpen(true)}
                                    className="text-[var(--cyan)] hover:text-white font-bold flex items-center gap-1 cursor-pointer hover:underline"
                                    title={t12(currentLang, "View Cited Standards & References", "Kullanılan Standartları ve Kaynakları Görüntüle")}
                                >
                                    <BookOpen size={10} />
                                    <span>{t12(currentLang, "Standards & Citations", "Standartlar & Kaynakça")}</span>
                                </button>
                            </div>
                            <div className="grid grid-cols-3 gap-1 bg-[var(--bg-0)] p-1 rounded-xl border border-white/10 text-[8.5px] font-mono">
                                <button
                                    type="button"
                                    onClick={() => { setKhkFamily('cylindrical'); setMeshType('external'); }}
                                    className={`py-1 px-1 rounded-lg font-bold uppercase transition-all flex flex-col items-center gap-0.5 cursor-pointer ${
                                        khkFamily === 'cylindrical'
                                            ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-500/40 '
                                            : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                                    }`}
                                    title={t12(currentLang, "External Cylindrical Gears (Spur & Helical)", "Dış Silindirik Dişli Çifti (Düz & Helis) - KHK 4.1 & 4.3")}
                                >
                                    <Cog size={11} />
                                    <span>{t12(currentLang, 'Cylindrical', 'Silindirik')}</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setKhkFamily('internal'); setMeshType('internal'); }}
                                    className={`py-1 px-1 rounded-lg font-bold uppercase transition-all flex flex-col items-center gap-0.5 cursor-pointer ${
                                        khkFamily === 'internal'
                                            ? 'bg-purple-500/25 text-purple-300 border border-purple-500/40 '
                                            : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                                    }`}
                                    title={t12(currentLang, "Internal Ring Gear & Interference", "İç Dişli & Girişim Denetimi - KHK Tablo 4.4 & 4.5")}
                                >
                                    <Disc size={11} />
                                    <span>{t12(currentLang, 'Internal', 'İç Dişli')}</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setKhkFamily('rack')}
                                    className={`py-1 px-1 rounded-lg font-bold uppercase transition-all flex flex-col items-center gap-0.5 cursor-pointer ${
                                        khkFamily === 'rack'
                                            ? 'bg-amber-500/25 text-amber-300 border border-amber-500/40 '
                                            : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                                    }`}
                                    title={t12(currentLang, "Rack & Pinion", "Kremayer & Pinyon Sürücüsü - KHK Tablo 4.6 & 4.10")}
                                >
                                    <MoveRight size={11} />
                                    <span>{t12(currentLang, 'Rack', 'Kremayer')}</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setKhkFamily('bevel')}
                                    className={`py-1 px-1 rounded-lg font-bold uppercase transition-all flex flex-col items-center gap-0.5 cursor-pointer ${
                                        khkFamily === 'bevel'
                                            ? 'bg-indigo-500/25 text-indigo-300 border border-indigo-500/40 '
                                            : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                                    }`}
                                    title={t12(currentLang, "Bevel Gears", "Konik Dişliler (Gleason & Standart Düz Konik) - KHK Tablo 4.16 & 4.17")}
                                >
                                    <Activity size={11} />
                                    <span>{t12(currentLang, 'Bevel', 'Konik')}</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setKhkFamily('worm')}
                                    className={`py-1 px-1 rounded-lg font-bold uppercase transition-all flex flex-col items-center gap-0.5 cursor-pointer ${
                                        khkFamily === 'worm'
                                            ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 '
                                            : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                                    }`}
                                    title={t12(currentLang, "Worm Gear", "Sonsuz Vida & Çark Dişli (Verim & Kilitleme) - KHK Tablo 4.22")}
                                >
                                    <RefreshCw size={11} />
                                    <span>{t12(currentLang, 'Worm', 'Sonsuz Vida')}</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setKhkFamily('screw')}
                                    className={`py-1 px-1 rounded-lg font-bold uppercase transition-all flex flex-col items-center gap-0.5 cursor-pointer ${
                                        khkFamily === 'screw'
                                            ? 'bg-sky-500/25 text-sky-300 border border-sky-500/40 '
                                            : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                                    }`}
                                    title={t12(currentLang, "Screw Gears", "Çapraz Helis / Vidalı Dişliler - KHK Tablo 4.24")}
                                >
                                    <RotateCcw size={11} />
                                    <span>{t12(currentLang, 'Screw', 'Çapraz Helis')}</span>
                                </button>
                            </div>

                            {/* 3-System Calculation Mode Selector (for Cylindrical & Internal Pair Modes) */}
                            {(khkFamily === 'cylindrical' || khkFamily === 'internal') && (
                                <div className="grid grid-cols-3 gap-1 bg-[var(--bg-0)] p-1 rounded-xl border border-white/10 text-[9px] font-mono">
                                    <button
                                        type="button"
                                        onClick={() => setPairSystemMode('standard')}
                                        className={`py-1.5 px-1 rounded-lg font-bold uppercase transition-all flex flex-col items-center gap-0.5 cursor-pointer ${
                                            pairSystemMode === 'standard'
                                                ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-500/40 '
                                                : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                                        }`}
                                        title={t12(currentLang, "Standard Direct Solver", "Standart Çözücü: Manuel Parametreler + Kafa Kısaltma (+/- k)")}
                                    >
                                        <Cog size={12} />
                                        <span>1. {t12(currentLang, 'Direct', 'Standart')}</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPairSystemMode('center_match')}
                                        className={`py-1.5 px-1 rounded-lg font-bold uppercase transition-all flex flex-col items-center gap-0.5 cursor-pointer ${
                                            pairSystemMode === 'center_match'
                                                ? 'bg-amber-500/25 text-amber-300 border border-amber-500/40 '
                                                : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                                        }`}
                                        title={t12(currentLang, "System 2: Center Distance & Best Gear Match", "Sistem 2: Merkez Arası Mesafe, Diş Sayısı ve Modül ile En Makul Dişliyi Bul")}
                                    >
                                        <Ruler size={12} />
                                        <span>2. {t12(currentLang, 'Center Match', 'Eksen & Makul')}</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPairSystemMode('autonomous')}
                                        className={`py-1.5 px-1 rounded-lg font-bold uppercase transition-all flex flex-col items-center gap-0.5 cursor-pointer ${
                                            pairSystemMode === 'autonomous'
                                                ? 'bg-purple-500/25 text-purple-300 border border-purple-500/40 '
                                                : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                                        }`}
                                        title={t12(currentLang, "System 3: Autonomous Sizing Engine", "Sistem 3: Modül ve Diş Sayısını Kendisi Hesaplayan Otonom Sentez Motoru")}
                                    >
                                        <Cpu size={12} />
                                        <span>3. {t12(currentLang, 'Auto Sizing', 'Otonom Sentez')}</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Scrollable Sections */}
                <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-3 space-y-3">
                    
                    {/* ═══ MULTI-GEAR TRAIN CONTROLS ═══ */}
                    {workflowMode === 'train' ? (
                        <div className="space-y-4">
                            {/* Action Toolbar & Preset Bar */}
                            <div className="p-3 rounded-2xl border border-white/10 bg-[var(--bg-1)]/80 space-y-2 font-mono">
                                <div className="flex items-center justify-between text-[10px] font-bold uppercase text-white/50 pb-1 border-b border-white/5">
                                    <span>{s.quickAddPresets}</span>
                                    <button
                                        type="button"
                                        onClick={() => resetTrainToDefault('compound')}
                                        className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 text-[9px] cursor-pointer"
                                        title={s.reset}
                                    >
                                        <RefreshCw size={10} />
                                        {s.reset}
                                    </button>
                                </div>

                                {/* Direct Stage Addition Buttons */}
                                <div className="grid grid-cols-2 gap-1.5 text-[9px]">
                                    <button
                                        type="button"
                                        onClick={() => addMeshGearToTrain('planetary_stage')}
                                        className="px-2 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-bold flex items-center justify-center gap-1 transition-all"
                                    >
                                        <Disc size={12} />
                                        {s.addPlanetary}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => addMeshGearToTrain('internal')}
                                        className="px-2 py-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 font-bold flex items-center justify-center gap-1 transition-all"
                                    >
                                        <Layers size={12} />
                                        {s.addInternal}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => addMeshGearToTrain('external')}
                                        className="px-2 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 font-bold flex items-center justify-center gap-1 transition-all"
                                    >
                                        <Plus size={12} />
                                        {s.addExternal}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={addCoaxialGearToTrain}
                                        className="px-2 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold flex items-center justify-center gap-1 transition-all"
                                    >
                                        <GitBranch size={12} />
                                        {s.addCoaxial}
                                    </button>
                                </div>

                                {/* Preset Switcher Quick Buttons */}
                                <div className="space-y-1.5 pt-1">
                                    <div className="text-[8.5px] font-bold text-white/40 uppercase tracking-wider">{s.presetLabel}:</div>
                                    <div className="grid grid-cols-3 gap-1 text-[8px] font-mono">
                                        <button
                                            type="button"
                                            onClick={() => resetTrainToDefault('compound')}
                                            className="px-1.5 py-1 rounded bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 text-center font-bold"
                                        >
                                            {t12(currentLang, '2-Stage Helical', '2-Kademe Helisel')}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => resetTrainToDefault('three_stage')}
                                            className="px-1.5 py-1 rounded bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 text-center font-bold"
                                        >
                                            {t12(currentLang, '3-Stage Heavy', '3-Kademe Ağır')}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => resetTrainToDefault('bevel_helical')}
                                            className="px-1.5 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 text-center font-bold"
                                        >
                                            {t12(currentLang, '90° Bevel-Helical', '90° Konik-Helis')}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => resetTrainToDefault('planetary')}
                                            className="px-1.5 py-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-center font-bold"
                                        >
                                            {t12(currentLang, 'Planetary Stage', 'Planet Kademesi')}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => resetTrainToDefault('hybrid')}
                                            className="px-1.5 py-1 rounded bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 text-center font-bold"
                                        >
                                            {t12(currentLang, 'Internal Hybrid', 'İç Dişli Hibrit')}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => resetTrainToDefault('dual_planetary')}
                                            className="px-1.5 py-1 rounded bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 text-center font-bold"
                                        >
                                            {t12(currentLang, 'Dual Planetary', 'Çift Planet')}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Gear Nodes Navigator Strip */}
                            <div className="p-3.5 rounded-2xl border border-white/10 bg-[var(--bg-1)]/60 space-y-2.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                                        <Layers size={13} />
                                        {s.trainGearsTitle} ({trainNodes.length})
                                    </span>
                                </div>

                                <div className="space-y-1.5 max-h-52 overflow-y-auto custom-scrollbar pr-1">
                                    {trainNodes.map((gn, idx) => {
                                        const isSel = selectedTrainGearId === gn.id;
                                        const calc = trainResults.gears.find(g => g.id === gn.id);
                                        const isPlanetary = gn.gearType === 'planetary_stage';
                                        const isInternal = gn.gearType === 'internal';

                                        return (
                                            <div
                                                key={gn.id}
                                                onClick={() => setSelectedTrainGearId(gn.id)}
                                                className={`p-2.5 rounded-xl border text-xs font-mono transition-all cursor-pointer flex items-center justify-between ${
                                                    isSel
                                                        ? 'bg-cyan-500/15 border-cyan-500/60 text-white'
                                                        : 'bg-black/40 border-white/5 hover:border-white/20 text-white/70'
                                                }`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <span className={`w-2 h-2 rounded-full ${isSel ? 'bg-cyan-400 animate-pulse' : 'bg-white/20'}`} />
                                                    <div>
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="font-bold">{gn.name}</span>
                                                            {isPlanetary ? (
                                                                <span className="px-1.5 py-0.2 rounded bg-emerald-500/30 text-emerald-300 text-[8px] font-bold">
                                                                    {s.planetaryTag}
                                                                </span>
                                                            ) : isInternal ? (
                                                                <span className="px-1.5 py-0.2 rounded bg-purple-500/30 text-purple-300 text-[8px] font-bold">
                                                                    {s.internalTag}
                                                                </span>
                                                            ) : gn.isCoaxial ? (
                                                                <span className="px-1.5 py-0.2 rounded bg-amber-500/30 text-amber-300 text-[8px] font-bold">
                                                                    {t12(currentLang, `COAXIAL (SHAFT ${gn.shaftId})`, `KOAKSİYEL (MİL ${gn.shaftId})`)}
                                                                </span>
                                                            ) : null}
                                                        </div>
                                                        <div className="text-[9px] text-white/40">
                                                            {isPlanetary ? `${s.sunTeeth}=${gn.teeth} · ${s.ringOuterDia || 'Ring'}=${gn.ringTeeth || 70}` : `z=${gn.teeth} · m=${gn.module}`} · {calc ? formatEngineeringValue(calc.rpm, precision, false) : '-'} RPM
                                                        </div>
                                                    </div>
                                                </div>

                                                {trainNodes.length > 2 && (
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            removeTrainGear(gn.id);
                                                        }}
                                                        className="p-1 text-white/30 hover:text-red-400 transition-colors"
                                                        title={s.deleteGear}
                                                    >
                                                        <Trash2 size={13} />
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Active Gear Parameter Editor */}
                            {selectedGear && (
                                <div className="p-4 rounded-2xl border border-cyan-500/20 bg-[var(--bg-1)]/80 space-y-3 font-mono">
                                    <div className="flex items-center justify-between pb-2 border-b border-white/5">
                                        <span className="text-[10px] font-bold uppercase text-cyan-300">
                                            {selectedGear.name} {s.gearParamsTitle}
                                        </span>
                                        <span className="text-[9px] text-white/40">{s.shaftLabel} #{selectedGear.shaftId}</span>
                                    </div>

                                    {/* Gear Kind Selector */}
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-bold uppercase text-white/40">{s.gearTypeLabel}</label>
                                        <div className="grid grid-cols-3 gap-1 bg-[var(--bg-0)] p-1 rounded-xl border border-white/10 text-[9px]">
                                            <button
                                                type="button"
                                                onClick={() => updateActiveTrainGear({ gearType: 'external' })}
                                                className={`py-1 rounded font-bold transition-all ${
                                                    (selectedGear.gearType === 'external' || !selectedGear.gearType)
                                                        ? 'bg-[var(--cyan)] text-[var(--accent-ink)]'
                                                        : 'text-white/40 hover:text-white'
                                                }`}
                                            >
                                                {s.externalType}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => updateActiveTrainGear({ gearType: 'internal' })}
                                                className={`py-1 rounded font-bold transition-all ${
                                                    selectedGear.gearType === 'internal'
                                                        ? 'bg-[var(--cyan)] text-[var(--accent-ink)]'
                                                        : 'text-white/40 hover:text-white'
                                                }`}
                                            >
                                                {s.internalType}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => updateActiveTrainGear({ gearType: 'planetary_stage', teeth: 20, planetTeeth: 25, ringTeeth: 70 })}
                                                className={`py-1 rounded font-bold transition-all ${
                                                    selectedGear.gearType === 'planetary_stage'
                                                        ? 'bg-[var(--cyan)] text-[var(--accent-ink)]'
                                                        : 'text-white/40 hover:text-white'
                                                }`}
                                            >
                                                {s.planetaryType}
                                            </button>
                                        </div>
                                    </div>

                                    {selectedGear.gearType === 'planetary_stage' ? (
                                        <div className="space-y-3">
                                            {/* Planetary Kinematic Operating Mode Selector */}
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-mono text-white/50 block font-bold uppercase tracking-wider">
                                                    {t12(currentLang, 'Fixed Element & Kinematic Mode', 'Sabit Eleman & Tahvil Modu')}
                                                </label>
                                                <select
                                                    value={selectedGear.planetaryMode || 'fixed_ring_carrier_out'}
                                                    onChange={(e) => updateActiveTrainGear({ planetaryMode: e.target.value as any })}
                                                    className="w-full bg-[var(--bg-0)] border border-white/10 rounded-xl px-3 py-2 text-[11px] font-mono text-cyan-300 focus:outline-none focus:border-cyan-500 transition-all cursor-pointer"
                                                >
                                                    <option value="fixed_ring_carrier_out">
                                                        {t12(currentLang, 'Fixed Ring (Sun In → Carrier Out, Reducer)', 'Halka Sabit (Güneş Giriş → Taşıyıcı Çıkış, Redüksiyon)')}
                                                    </option>
                                                    <option value="fixed_sun_carrier_out">
                                                        {t12(currentLang, 'Fixed Sun (Ring In → Carrier Out, Reducer)', 'Güneş Sabit (Halka Giriş → Taşıyıcı Çıkış, Redüksiyon)')}
                                                    </option>
                                                    <option value="fixed_carrier_ring_out">
                                                        {t12(currentLang, 'Fixed Carrier (Sun In → Ring Out, Reverse Reducer)', 'Taşıyıcı Sabit (Güneş Giriş → Halka Çıkış, Ters Yön Redüktör)')}
                                                    </option>
                                                    <option value="fixed_carrier_sun_out">
                                                        {t12(currentLang, 'Fixed Carrier (Ring In → Sun Out, Reverse Multiplier)', 'Taşıyıcı Sabit (Halka Giriş → Güneş Çıkış, Ters Yön Hız Artırıcı)')}
                                                    </option>
                                                    <option value="fixed_ring_sun_out">
                                                        {t12(currentLang, 'Fixed Ring (Carrier In → Sun Out, Multiplier)', 'Halka Sabit (Taşıyıcı Giriş → Güneş Çıkış, Hız Artırıcı)')}
                                                    </option>
                                                    <option value="fixed_sun_ring_out">
                                                        {t12(currentLang, 'Fixed Sun (Carrier In → Ring Out, Multiplier)', 'Güneş Sabit (Taşıyıcı Giriş → Halka Çıkış, Hız Artırıcı)')}
                                                    </option>
                                                </select>
                                            </div>

                                            {/* Planet Count Selector */}
                                            <div className="flex items-center justify-between p-2 rounded-xl bg-black/40 border border-white/5 text-[11px] font-mono">
                                                <span className="text-white/60 font-bold">{t12(currentLang, 'Planet Count (Np):', 'Planet Sayısı (Np):')}</span>
                                                <div className="flex items-center gap-1">
                                                    {[3, 4].map((np) => (
                                                        <button
                                                            key={'np-btn-' + np}
                                                            type="button"
                                                            onClick={() => updateActiveTrainGear({ numPlanets: np })}
                                                            className={`px-3 py-1 rounded-lg font-bold transition-all ${
                                                                (selectedGear.numPlanets || 3) === np
                                                                    ? 'bg-[var(--cyan)] text-[var(--accent-ink)] '
                                                                    : 'bg-white/5 text-white/50 hover:text-white'
                                                            }`}
                                                        >
                                                            {np}x Planet
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                <GearInput
                                                    label={s.sunTeeth}
                                                    unit=""
                                                    value={selectedGear.teeth}
                                                    min={10}
                                                    max={100}
                                                    step={1}
                                                    onChange={(v: number) => {
                                                        const zp = selectedGear.planetTeeth || 25;
                                                        updateActiveTrainGear({ teeth: v, ringTeeth: v + 2 * zp });
                                                    }}
                                                    color="#00e5ff"
                                                />
                                                <GearInput
                                                    label={s.planetTeeth}
                                                    unit=""
                                                    value={selectedGear.planetTeeth || 25}
                                                    min={10}
                                                    max={100}
                                                    step={1}
                                                    onChange={(v: number) => {
                                                        const zs = selectedGear.teeth;
                                                        updateActiveTrainGear({ planetTeeth: v, ringTeeth: zs + 2 * v });
                                                    }}
                                                    color="#10b981"
                                                />
                                            </div>
                                            
                                            {/* Computed Ring and Assembly Status Badge */}
                                            <div className="p-3 rounded-xl bg-black/50 border border-white/10 space-y-1.5 text-[10px] font-mono">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-white/50">{s.computedRing}:</span>
                                                    <span className="text-purple-300 font-bold">
                                                        zr = {selectedGear.ringTeeth || (selectedGear.teeth + 2 * (selectedGear.planetTeeth || 25))} (zr = zs + 2·zp)
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-white/50">{t12(currentLang, 'Assembly Check (zs+zr)/Np:', 'Montaj Şartı (zs+zr)/Np:')}</span>
                                                    {((selectedGear.teeth + (selectedGear.ringTeeth || (selectedGear.teeth + 2 * (selectedGear.planetTeeth || 25)))) % (selectedGear.numPlanets || 3) === 0) ? (
                                                        <span className="text-emerald-400 font-bold">✓ {t12(currentLang, 'OK (Symmetric)', 'UYGUN (Simetrik)')}</span>
                                                    ) : (
                                                        <span className="text-amber-400 font-bold">⚠ {t12(currentLang, 'Remainder (Index shifted)', 'Kalan Var (Açı Kaydırmalı)')}</span>
                                                    )}
                                                </div>
                                                <div className="flex justify-between items-center pt-1 border-t border-white/5">
                                                    <span className="text-white/50">{t12(currentLang, 'Effective Ratio:', 'Efektif Kademe Tahvili:')}</span>
                                                    <span className="text-cyan-300 font-bold">
                                                        i = {formatEngineeringValue((selectedGear.stageRatio || 4.5), precision, false)}:1
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-3">
                                            <GearInput
                                                label={s.teethCount}
                                                unit=""
                                                value={selectedGear.teeth}
                                                min={8}
                                                max={400}
                                                step={1}
                                                onChange={(v: number) => updateActiveTrainGear({ teeth: v })}
                                                color="#00e5ff"
                                            />
                                            <GearInput
                                                label={s.gearModule}
                                                unit="mm"
                                                value={selectedGear.module}
                                                min={0.5}
                                                max={20}
                                                step={0.5}
                                                onChange={(v: number) => updateActiveTrainGear({ module: v })}
                                                color="#8b5cf6"
                                            />
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-3">
                                        <GearInput
                                            label={s.helixAngle}
                                            unit="°"
                                            value={selectedGear.helixAngle}
                                            min={0}
                                            max={45}
                                            step={1}
                                            onChange={(v: number) => updateActiveTrainGear({ helixAngle: v })}
                                            color="#f59e0b"
                                        />
                                        <GearInput
                                            label={s.profileShift}
                                            unit=""
                                            value={selectedGear.profileShift}
                                            min={-1.5}
                                            max={1.5}
                                            step="any"
                                            onChange={(v: number) => updateActiveTrainGear({ profileShift: v })}
                                            color="#10b981"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <GearInput
                                            label={s.faceWidth}
                                            unit="mm"
                                            value={selectedGear.faceWidth}
                                            min={5}
                                            max={300}
                                            step={1}
                                            onChange={(v: number) => updateActiveTrainGear({ faceWidth: v })}
                                            color="#38bdf8"
                                        />
                                        <GearSelect
                                            label={s.materialType}
                                            value={selectedGear.material}
                                            onChange={(v: string) => updateActiveTrainGear({ material: v })}
                                            options={GEAR_MATERIALS.map(m => ({ value: m.name, label: m.name }))}
                                            color="#c084fc"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* System Motor & Drive Inputs */}
                            <CollapsibleSection
                                id="trainMotor"
                                title={s.trainMotorDrive}
                                icon={<Zap size={14} />}
                                isOpen={expandedSection === 'trainMotor'}
                                onToggle={() => toggleSection('trainMotor')}
                            >
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <GearSelect
                                            label={s.motorPower}
                                            value={String(selectedPower)}
                                            onChange={(v: string) => setSelectedPower(Number(v))}
                                            options={IEC_MOTORS.map(m => ({ value: String(m.power), label: `${m.power} kW` }))}
                                            color="#00e5ff"
                                        />
                                        <GearSelect
                                            label={s.motorPoles}
                                            value={String(selectedPoles)}
                                            onChange={(v: string) => setSelectedPoles(Number(v) as any)}
                                            options={[
                                                { value: '2', label: s.poles2 },
                                                { value: '4', label: s.poles4 },
                                                { value: '6', label: s.poles6 }
                                            ]}
                                            color="#8b5cf6"
                                        />
                                    </div>
                                    <div className="p-3 rounded-xl bg-black/40 border border-white/5 flex justify-between text-xs font-mono">
                                        <span className="text-white/40">{s.motorSpeedTorque}:</span>
                                        <span className="text-cyan-400 font-bold">{motorSpeed} RPM · {trainResults.inputTorqueNm} Nm</span>
                                    </div>
                                </div>
                            </CollapsibleSection>
                        </div>
                    ) : (khkFamily !== 'cylindrical' && khkFamily !== 'internal') ? (
                        /* ═══ KHK GEAR FAMILY SIDEBAR CONTROLLER ═══ */
                        <div className="space-y-3 font-mono">
                            {khkFamily === 'rack' && <KhkRackControls currentLang={currentLang} />}
                            {khkFamily === 'bevel' && <KhkBevelControls currentLang={currentLang} />}
                            {khkFamily === 'worm' && <KhkWormControls currentLang={currentLang} />}
                            {khkFamily === 'screw' && <KhkScrewControls currentLang={currentLang} />}
                        </div>
                    ) : pairSystemMode === 'center_match' ? (
                        /* ═══ SİSTEM 2: MERKEZ ARASI MESAFE & EN MAKUL DİŞLİ ═══ */
                        <div className="space-y-3 font-sans">
                            {/* Header Card */}
                            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-950/40 via-yellow-950/20 to-black/60 border border-amber-500/30 space-y-1.5">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                        <Ruler size={14} />
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-black uppercase text-amber-300 font-mono tracking-wider">
                                            {t12(currentLang, 'SYSTEM 2: CENTER DISTANCE & BEST GEAR FINDER', 'SİSTEM 2: MERKEZ MESAFESİ EŞLEME & EN MAKUL DİŞLİ')}
                                        </h4>
                                        <p className="text-[10px] text-white/50 font-mono">
                                            {t12(currentLang, 'Calculates helix angle or profile shift/shortening to hit target center distance (a).', 'Sabit eksen mesafesi (a) için helis açısı veya profil kaydırma/kafa kısaltmayı hesaplar; en ideal dişliyi seçer.')}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Primary Inputs */}
                            <div className="p-3 rounded-2xl bg-[var(--bg-1)]/80 border border-white/10 space-y-3 font-mono">
                                <div className="grid grid-cols-2 gap-3">
                                    <GearInput
                                        label={t12(currentLang, "Module (mn)", "Modül (mn)")}
                                        unit="mm"
                                        value={gearModule}
                                        min={0.5}
                                        max={20}
                                        step="any"
                                        onChange={(v: number) => setGearModule(v)}
                                        color="#00e5ff"
                                        desc={t12(currentLang, "Normal module", "Normal modül")}
                                    />
                                    <GearInput
                                        label={t12(currentLang, "Target Center Dist. (a)", "Hedef Eksen Mesafesi (a)")}
                                        unit="mm"
                                        value={centerMatchTargetA}
                                        min={10}
                                        max={2000}
                                        step="any"
                                        onChange={(v: number) => setCenterMatchTargetA(v)}
                                        color="#f59e0b"
                                        desc={t12(currentLang, "Fixed gearbox center distance", "Mevcut gövde veya istenen eksen mesafesi")}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <GearInput
                                        label={t12(currentLang, "Pinion Teeth (z₁)", "Pinyon Diş (z₁)")}
                                        unit=""
                                        value={z1}
                                        min={10}
                                        max={150}
                                        step={1}
                                        onChange={(v: number) => setZ1(v)}
                                        color="#6366f1"
                                        desc={t12(currentLang, "Pinion teeth", "Pinyon diş sayısı")}
                                    />
                                    <GearInput
                                        label={t12(currentLang, "Gear Teeth (z₂)", "Çark Diş (z₂)")}
                                        unit=""
                                        value={z2}
                                        min={10}
                                        max={400}
                                        step={1}
                                        onChange={(v: number) => setZ2(v)}
                                        color="#818cf8"
                                        desc={t12(currentLang, "Gear teeth", "Çark diş sayısı")}
                                    />
                                </div>

                                {/* Dişli Tipi Tercihi */}
                                <div className="space-y-1">
                                    <span className="text-[10px] text-white/50 block uppercase font-bold">{t12(currentLang, 'Search Preference:', 'Arama Tercihi:')}</span>
                                    <div className="grid grid-cols-3 gap-1 bg-black/40 p-1 rounded-xl border border-white/10 text-[9.5px]">
                                        <button
                                            type="button"
                                            onClick={() => setCenterMatchPreferredType('any')}
                                            className={`py-1 rounded-lg font-bold transition-all cursor-pointer ${centerMatchPreferredType === 'any' ? 'bg-[var(--cyan)] text-[var(--accent-ink)]' : 'text-slate-400 hover:text-white'}`}
                                        >
                                            {t12(currentLang, 'All', 'Tümü')}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setCenterMatchPreferredType('helical')}
                                            className={`py-1 rounded-lg font-bold transition-all cursor-pointer ${centerMatchPreferredType === 'helical' ? 'bg-[var(--cyan)] text-[var(--accent-ink)]' : 'text-slate-400 hover:text-white'}`}
                                        >
                                            {t12(currentLang, 'Helical', 'Helis Dişli')}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setCenterMatchPreferredType('spur')}
                                            className={`py-1 rounded-lg font-bold transition-all cursor-pointer ${centerMatchPreferredType === 'spur' ? 'bg-[var(--cyan)] text-[var(--accent-ink)]' : 'text-slate-400 hover:text-white'}`}
                                        >
                                            {t12(currentLang, 'Spur', 'Düz Dişli')}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Exact Match Solutions for current (z1, z2, mn, a) */}
                            <div className="p-3 rounded-2xl bg-[var(--bg-1)]/80 border border-white/10 space-y-2.5 font-mono text-[10px]">
                                <div className="text-[11px] font-bold text-white uppercase tracking-wider pb-1 border-b border-white/10 flex justify-between items-center">
                                    <span>{t12(currentLang, 'Solutions for Current Teeth', 'Mevcut Diş Sayıları ile Çözümler')} (z₁={z1}, z₂={z2})</span>
                                    <span className="text-white/40 text-[9px]">a₀ = {formatEngineeringValue(centerMatchResult.a_standard_spur, precision, false)} mm</span>
                                </div>

                                {/* Helical Solution */}
                                <div className="p-2.5 rounded-xl bg-cyan-950/20 border border-cyan-500/20 space-y-1">
                                    <div className="flex justify-between items-center font-bold">
                                        <span className="text-cyan-300">1. {t12(currentLang, 'Helical Angle Solution (Zero Shift)', 'Helis Açısı ile Sıfır Kaydırmalı Çözüm (x=0)')}</span>
                                        {centerMatchResult.helicalSolution.isPossible ? (
                                            <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono text-[9px] border border-cyan-500/40">
                                                β = {formatEngineeringValue(centerMatchResult.helicalSolution.betaDeg, precision, false)}°
                                            </span>
                                        ) : (
                                            <span className="text-rose-400 text-[9px] font-mono">{t12(currentLang, 'Not possible', 'Geometrik Olarak İmkansız')}</span>
                                        )}
                                    </div>
                                    <p className="text-[9.5px] text-slate-300 leading-relaxed">{centerMatchResult.helicalSolution.description}</p>
                                    {centerMatchResult.helicalSolution.isPossible && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setHelixAngle(Number(centerMatchResult.helicalSolution.betaDeg.toFixed(2)));
                                                setX1(0);
                                                setX2(0);
                                                setKFactorMode('auto');
                                                setPairSystemMode('standard');
                                            }}
                                            className="mt-1 w-full py-1 rounded bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 font-bold uppercase text-[9px] transition-all cursor-pointer"
                                        >
                                            {t12(currentLang, 'Apply Helical Angle (β = ', 'Bu Helis Açısını Uygula (β = ')}{formatEngineeringValue(centerMatchResult.helicalSolution.betaDeg, precision, false)}°)
                                        </button>
                                    )}
                                </div>

                                {/* Profile Shift & Kafa Kısaltma Solution */}
                                <div className="p-2.5 rounded-xl bg-purple-950/20 border border-purple-500/20 space-y-1">
                                    <div className="flex justify-between items-center font-bold">
                                        <span className="text-purple-300">2. {t12(currentLang, 'Spur Profile Shift & Crest Shortening', 'Düz Dişli Profil Kaydırma & Kafa Kısaltma')}</span>
                                        <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono text-[9px] border border-purple-500/40">
                                            k = {formatEngineeringValue(centerMatchResult.profileShiftSolution.k, precision, false)}
                                        </span>
                                    </div>
                                    <p className="text-[9.5px] text-slate-300 leading-relaxed">{centerMatchResult.profileShiftSolution.description}</p>
                                    {centerMatchResult.profileShiftSolution.isFeasible && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setHelixAngle(0);
                                                setX1(Number(centerMatchResult.profileShiftSolution.x1.toFixed(3)));
                                                setX2(Number(centerMatchResult.profileShiftSolution.x2.toFixed(3)));
                                                setKFactorMode('custom');
                                                setCustomK(Number(centerMatchResult.profileShiftSolution.k.toFixed(3)));
                                                setPairSystemMode('standard');
                                            }}
                                            className="mt-1 w-full py-1 rounded bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 font-bold uppercase text-[9px] transition-all cursor-pointer"
                                        >
                                            {t12(currentLang, 'Apply Shift & Shortening (k=', 'Bu Profil Kaydırma ve Kısaltmayı Uygula (k=')}{formatEngineeringValue(centerMatchResult.profileShiftSolution.k, precision, false)})
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Section: Recommended Best Gear Candidates */}
                            <div className="space-y-2 font-mono">
                                <div className="flex justify-between items-center px-1">
                                    <span className="text-[11px] font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                                        <ShieldCheck size={13} />
                                        {t12(currentLang, 'RECOMMENDED BEST GEAR MATCHES', 'EN MAKUL DİŞLİ ADAYLARI')}
                                    </span>
                                    <span className="text-[9px] text-white/40 font-mono">{centerMatchCandidates.length} {t12(currentLang, 'candidates', 'alternatif')}</span>
                                </div>

                                {centerMatchCandidates.length === 0 ? (
                                    <div className="p-4 rounded-xl bg-black/40 border border-white/5 text-center text-white/40 text-[10px]">
                                        {t12(currentLang, 'No candidates found.', 'Bu modül ve eksen mesafesi için uygun dişli kombinasyonu bulunamadı. Lütfen modülü veya eksen mesafesini ayarlayın.')}
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {centerMatchCandidates.map((cand, idx) => (
                                            <div
                                                key={`${cand.gearType}-${cand.z1}-${cand.z2}-${idx}`}
                                                className={`p-3 rounded-xl border transition-all ${
                                                    cand.isBestChoice
                                                        ? 'bg-gradient-to-r from-amber-950/30 to-yellow-950/20 border-amber-500/50 '
                                                        : 'bg-[var(--bg-1)]/80 border-white/10 hover:border-white/20'
                                                }`}
                                            >
                                                <div className="flex justify-between items-center pb-1 border-b border-white/5">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                                            cand.isBestChoice ? 'bg-amber-500 text-black' : 'bg-white/10 text-slate-300'
                                                        }`}>
                                                            {cand.badge}
                                                        </span>
                                                        <span className="text-[11px] font-bold text-white">
                                                            z₁={cand.z1} × z₂={cand.z2}
                                                        </span>
                                                        <span className="text-[10px] text-cyan-300 font-bold">
                                                            (i = {formatEngineeringValue(cand.ratio, precision, false)})
                                                        </span>
                                                    </div>
                                                    <span className="text-[10px] font-black text-emerald-400">
                                                        {t12(currentLang, 'Score:', 'Skor:')} %{cand.score}
                                                    </span>
                                                </div>

                                                <div className="grid grid-cols-2 gap-2 text-[9.5px] py-1.5 text-slate-300 border-b border-white/5">
                                                    <div>
                                                        <span className="text-white/40 block">{t12(currentLang, 'Type / Helix:', 'Tür / Helis Açısı:')}</span>
                                                        <span className="font-bold text-white">
                                                            {cand.gearType === 'helical' ? t12(currentLang, `Helical (β = ${formatEngineeringValue(cand.betaDeg, precision, false)}°)`, `Helis (β = ${formatEngineeringValue(cand.betaDeg, precision, false)}°)`) : (t12(currentLang, 'Spur', 'Düz (Spur)'))}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <span className="text-white/40 block">{t12(currentLang, 'Shift & Shortening:', 'Profil Kaydırma & Kısaltma:')}</span>
                                                        <span className="font-bold text-white">
                                                            {cand.k !== 0 ? `k = ${formatEngineeringValue(cand.k, precision, false)} (${formatEngineeringValue(cand.k_mm, precision, false)}mm)` : (t12(currentLang, 'x=0, k=0 (Zero Shift)', 'x=0, k=0 (Sıfır Kaydırma)'))}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <span className="text-white/40 block">{t12(currentLang, 'Contact Ratio:', 'Kavrama Oranı:')}</span>
                                                        <span className="font-bold text-cyan-300">εγ = {formatEngineeringValue(cand.contactRatio, precision, false)}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-white/40 block">{t12(currentLang, 'Tip Diameters:', 'Tepe Çapları:')}</span>
                                                        <span className="font-bold text-white">da₁={formatEngineeringValue(cand.da1, precision, false)}, da₂={formatEngineeringValue(cand.da2, precision, false)}</span>
                                                    </div>
                                                </div>

                                                <ul className="py-1 space-y-0.5 text-[9px] text-slate-400">
                                                    {cand.pros.map((pro, pIdx) => (
                                                        <li key={pIdx} className="flex items-center gap-1">
                                                            <span className="text-emerald-400">✓</span> {pro}
                                                        </li>
                                                    ))}
                                                </ul>

                                                <button
                                                    type="button"
                                                    onClick={() => handleApplyCenterMatch(cand)}
                                                    className={`mt-2 w-full py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                                                        cand.isBestChoice
                                                            ? 'bg-amber-500 hover:bg-amber-400 text-black '
                                                            : 'bg-white/10 hover:bg-white/20 text-white'
                                                    }`}
                                                >
                                                    <Check size={12} />
                                                    <span>{t12(currentLang, 'Apply this Gear Pair', 'Bu Dişliyi Uygula (Modele Aktar)')}</span>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : pairSystemMode === 'autonomous' ? (
                        /* ═══ SİSTEM 3: OTONOM DİŞ SAYISI VE MODÜL SENTEZ MOTORU ═══ */
                        <div className="space-y-3 font-sans">
                            {/* Header Card */}
                            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-950/40 via-indigo-950/20 to-black/60 border border-purple-500/30 space-y-1.5">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/40">
                                        <Cpu size={14} />
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-black uppercase text-purple-300 font-mono tracking-wider">
                                            {t12(currentLang, 'SYSTEM 3: AUTONOMOUS GEAR & MODULE SIZING', 'SİSTEM 3: OTONOM DİŞ & MODÜL SENTEZ MOTORU')}
                                        </h4>
                                        <p className="text-[10px] text-white/50 font-mono">
                                            {t12(currentLang, 'Automatically computes required module, tooth counts, and geometry from load & speed.', 'Modülü ve diş sayılarını kendisi hesaplar. Sadece operasyonel güç, devir ve hedefleri girmeniz yeterlidir.')}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Operational Inputs Card */}
                            <div className="p-3 rounded-2xl bg-[var(--bg-1)]/80 border border-white/10 space-y-3 font-mono">
                                <div className="grid grid-cols-2 gap-3">
                                    <GearInput
                                        label={t12(currentLang, "Motor Power (P)", "Motor Gücü (P)")}
                                        unit="kW"
                                        value={autoPowerKw}
                                        min={0.1}
                                        max={500}
                                        step="any"
                                        onChange={(v: number) => setAutoPowerKw(v)}
                                        color="#00e5ff"
                                        desc={t12(currentLang, "Nominal motor power", "Nominal mekanik güç")}
                                    />
                                    <GearInput
                                        label={t12(currentLang, "Input Speed (n₁)", "Giriş Devri (n₁)")}
                                        unit="RPM"
                                        value={autoInputRpm}
                                        min={10}
                                        max={15000}
                                        step={1}
                                        onChange={(v: number) => setAutoInputRpm(v)}
                                        color="#8b5cf6"
                                        desc={t12(currentLang, "Input motor speed", "Giriş motor devri")}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <GearInput
                                        label={t12(currentLang, "Target Output Speed (n₂)", "Hedef Çıkış Devri (n₂)")}
                                        unit="RPM"
                                        value={autoTargetRpm}
                                        min={1}
                                        max={10000}
                                        step="any"
                                        onChange={(v: number) => setAutoTargetRpm(v)}
                                        color="#10b981"
                                        desc={t12(currentLang, "Desired output rpm", "İstenen çıkış devri")}
                                    />
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                                            {t12(currentLang, "Target Center (a)", "Hedef Eksen Mesafesi (a)")}
                                        </label>
                                        <input
                                            type="number"
                                            placeholder={t12(currentLang, "Free (Optional)", "Serbest (Opsiyonel)")}
                                            value={autoTargetCenterA}
                                            onChange={(e) => setAutoTargetCenterA(e.target.value)}
                                            className="w-full bg-black/60 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-amber-300 font-mono focus:border-amber-500/50 outline-none"
                                        />
                                        <span className="text-[9px] text-slate-500 mt-0.5 block">{t12(currentLang, "Fixed casing distance", "Varsa kasa eksen mesafesi")}</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">{t12(currentLang, "Gear Type", "Dişli Türü")}</label>
                                        <select
                                            value={autoGearType}
                                            onChange={(e) => setAutoGearType(e.target.value as any)}
                                            className="w-full bg-black/60 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white font-mono outline-none"
                                        >
                                            <option value="helical">{t12(currentLang, "Helical Gear", "Helis Dişli (Sessiz / Güçlü)")}</option>
                                            <option value="spur">{t12(currentLang, "Spur Gear", "Düz Dişli (Sıfır Eksenel Kuvvet)")}</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">{t12(currentLang, "Load Class", "Yük Karakteristiği")}</label>
                                        <select
                                            value={autoLoadType}
                                            onChange={(e) => setAutoLoadType(e.target.value as any)}
                                            className="w-full bg-black/60 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white font-mono outline-none"
                                        >
                                            <option value="uniform">{t12(currentLang, "Uniform", "Düzgün Yük (KA = 1.0)")}</option>
                                            <option value="moderate">{t12(currentLang, "Moderate Shock", "Orta Darbeli (KA = 1.25)")}</option>
                                            <option value="heavy">{t12(currentLang, "Heavy Shock", "Ağır Darbeli (KA = 1.5)")}</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Synthesis Output Report Card */}
                            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-950/30 to-indigo-950/20 border border-purple-500/30 space-y-3 font-mono">
                                <div className="flex justify-between items-center pb-1.5 border-b border-white/10">
                                    <span className="text-[11px] font-black uppercase tracking-wider text-purple-300">
                                        {t12(currentLang, 'AUTONOMOUS SYNTHESIS REPORT', 'OTONOM SENTEZ RAPORU (ISO 6336)')}
                                    </span>
                                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                        autoSizingResult.isSafe ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                    }`}>
                                        {autoSizingResult.isSafe ? (t12(currentLang, '✓ FULLY SAFE', '✓ MUKAVEMET TAM UYGUN')) : (t12(currentLang, '⚠ CHECK LOADS', '⚠ DİKKAT GEREKTİRİR'))}
                                    </span>
                                </div>

                                {/* Primary Synthesized Values Grid */}
                                <div className="grid grid-cols-2 gap-2 text-[10.5px]">
                                    <div className="p-2 rounded-xl bg-black/40 border border-white/5">
                                        <span className="text-white/40 block text-[9px]">{t12(currentLang, 'RECOMMENDED MODULE:', 'ÖNERİLEN MODÜL (mn):')}</span>
                                        <span className="text-cyan-300 font-black text-sm">{formatEngineeringValue(autoSizingResult.recommendedModule, precision, false)} mm</span>
                                        <span className="text-[8.5px] text-slate-500 block">DIN 780 R20 ISO Serisi</span>
                                    </div>

                                    <div className="p-2 rounded-xl bg-black/40 border border-white/5">
                                        <span className="text-white/40 block text-[9px]">{t12(currentLang, 'TEETH COUNTS:', 'DİŞ SAYILARI (z₁ × z₂):')}</span>
                                        <span className="text-emerald-400 font-black text-sm">{autoSizingResult.z1} × {autoSizingResult.z2}</span>
                                        <span className="text-[8.5px] text-cyan-400 block">Tahvil i = {formatEngineeringValue(autoSizingResult.actualRatio, precision, false)}</span>
                                    </div>

                                    <div className="p-2 rounded-xl bg-black/40 border border-white/5">
                                        <span className="text-white/40 block text-[9px]">{t12(currentLang, 'CENTER DISTANCE (a):', 'EKSENLER ARASI (a):')}</span>
                                        <span className="text-amber-300 font-bold">{formatEngineeringValue(autoSizingResult.centerDistanceMm, precision, false)} mm</span>
                                    </div>

                                    <div className="p-2 rounded-xl bg-black/40 border border-white/5">
                                        <span className="text-white/40 block text-[9px]">{t12(currentLang, 'FACE WIDTH (b):', 'DİŞ GENİŞLİĞİ (b):')}</span>
                                        <span className="text-white font-bold">{autoSizingResult.faceWidthMm} mm</span>
                                    </div>

                                    <div className="p-2 rounded-xl bg-black/40 border border-white/5">
                                        <span className="text-white/40 block text-[9px]">{t12(currentLang, 'HELIX ANGLE (β):', 'HELİS AÇISI (β):')}</span>
                                        <span className="text-purple-300 font-bold">{formatEngineeringValue(autoSizingResult.helixAngleDeg, precision, false)}°</span>
                                    </div>

                                    <div className="p-2 rounded-xl bg-black/40 border border-white/5">
                                        <span className="text-white/40 block text-[9px]">{t12(currentLang, 'CREST SHORTENING (k):', 'KAFA KISALTMA (k):')}</span>
                                        <span className="text-white font-bold">{formatEngineeringValue(autoSizingResult.k, precision, false)} ({formatEngineeringValue(autoSizingResult.k_mm, precision, false)} mm)</span>
                                    </div>

                                    <div className="p-2 rounded-xl bg-black/40 border border-white/5">
                                        <span className="text-white/40 block text-[9px]">{t12(currentLang, 'BENDING SAFETY (SF):', 'EĞİLME EMNİYETİ (SF):')}</span>
                                        <span className="text-emerald-400 font-black">{formatEngineeringValue(autoSizingResult.SF_bending, precision, false)} (≥ 1.4)</span>
                                    </div>

                                    <div className="p-2 rounded-xl bg-black/40 border border-white/5">
                                        <span className="text-white/40 block text-[9px]">{t12(currentLang, 'CONTACT SAFETY (SH):', 'EZİLME EMNİYETİ (SH):')}</span>
                                        <span className="text-emerald-400 font-black">{formatEngineeringValue(autoSizingResult.SF_contact, precision, false)} (≥ 1.20)</span>
                                    </div>
                                </div>

                                {/* Synthesis Notes */}
                                <div className="p-2 rounded-xl bg-black/40 border border-white/5 space-y-1 text-[9px] text-slate-300">
                                    {autoSizingResult.designNotes.map((note, nIdx) => (
                                        <div key={nIdx} className="flex items-start gap-1">
                                            <span className="text-cyan-400 shrink-0">▸</span>
                                            <span>{note}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* 1-Click Apply Button */}
                                <button
                                    type="button"
                                    onClick={() => handleApplyAutonomous(autoSizingResult)}
                                    className="w-full py-2 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-black uppercase text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    <Check size={14} />
                                    <span>{t12(currentLang, '★ Apply Sizing to Active Model', '★ Sentezlenen Dişliyi Modele Uygula')}</span>
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* ═══ SİSTEM 1: STANDART 2-GEAR PAIR CONTROLS ═══ */
                        <div className="space-y-3">
                            {/* Section: Geometry */}
                            <CollapsibleSection 
                                id="geometry" title={s.toothGeometry || "Dişli Geometrisi"} icon={<Settings size={14} />} 
                                isOpen={expandedSection === 'geometry'} onToggle={() => toggleSection('geometry')}
                            >
                                <div className="space-y-4">
                                    {/* Mesh Type Selector: External vs Internal Ring Gear */}
                                    <div className="space-y-1.5 pb-1">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center justify-between">
                                            <span>{s.meshTypeLabel || "Bağlantı Türü / Mesh Type"}</span>
                                            <span className={`font-mono text-[9px] font-bold ${meshType === 'internal' ? 'text-purple-400' : 'text-cyan-400'}`}>
                                                {meshType === 'internal' ? (s.internalRing || 'İÇ DİŞLİ (RING GEAR)') : (s.externalPair || 'DIŞ DİŞLİ (EXTERNAL)')}
                                            </span>
                                        </label>
                                        <div className="grid grid-cols-2 gap-2 bg-[var(--bg-0)] p-1 rounded-xl border border-white/10">
                                            <button
                                                type="button"
                                                onClick={() => setMeshType('external')}
                                                className={`py-2 px-2.5 rounded-lg text-[9.5px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                                                    meshType === 'external'
                                                        ? 'bg-[var(--cyan)] text-[var(--accent-ink)] '
                                                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                                                }`}
                                            >
                                                <Cog size={13} />
                                                {s.externalPair}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setMeshType('internal');
                                                    if (z2 <= z1) setZ2(Math.max(48, z1 + 12));
                                                }}
                                                className={`py-2 px-2.5 rounded-lg text-[9.5px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                                                    meshType === 'internal'
                                                        ? 'bg-[var(--cyan)] text-[var(--accent-ink)] '
                                                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                                                }`}
                                            >
                                                <Layers size={13} />
                                                {s.internalRing}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <GearInput label={s.gearModule || "Modül (m)"} unit="mm" value={gearModule} min={0.5} max={20} step="any" onChange={(v: number) => setGearModule(v)} color="#00e5ff" desc={s.descModule} />
                                        <GearInput label={s.faceWidth || "Diş Genişliği (b)"} unit="mm" value={faceWidth} min={5} max={500} step="any" onChange={(v: number) => setFaceWidth(v)} color="#8b5cf6" desc={s.descFaceWidth} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <GearInput label={s.pinionTeeth || "Pinyon Diş Sayısı (z₁)"} unit="" value={z1} min={8} max={200} step={1} onChange={(v: number) => setZ1(v)} color="#6366f1" desc={s.descPinionTeeth} />
                                        <GearInput label={meshType === 'internal' ? (s.internalRingTeeth || "İç Dişli Sayısı (z₂)") : (s.gearTeeth || "Çark Diş Sayısı (z₂)")} unit="" value={z2} min={meshType === 'internal' ? 10 : 8} max={500} step={1} onChange={(v: number) => setZ2(v)} color="#818cf8" desc={meshType === 'internal' ? t12(currentLang, "Internal ring teeth (must be z₂ > z₁ + 7)", "İç çember diş sayısı (z₂ > z₁ + 7 olmalıdır)") : s.descGearTeeth} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <GearInput label={s.pressureAngle || "Kavrama Açısı (αn)"} unit="°" value={pressureAngle} min={10} max={35} step="any" onChange={(v: number) => setPressureAngle(v)} color="#f59e0b" desc={s.descPressureAngle || t12(currentLang, "Pressure angle (Std: 20°, Opt: 14.5°, 25°)", "Değme açısı (Standart: 20°, Ops: 14.5°, 25°)")} />
                                        <GearInput label={s.helixAngle || "Helis Açısı (β)"} unit="°" value={helixAngle} min={0} max={45} step="any" onChange={(v: number) => setHelixAngle(v)} color="#10b981" desc={s.descHelixAngle || t12(currentLang, "0° = Spur Gear, >0° = Helical Gear", "0° = Düz Dişli, >0° = Helis Dişli")} />
                                    </div>
                                </div>
                            </CollapsibleSection>

                            {/* Section: Profile Shift & Inspection (x1, x2, dp1, dp2) */}
                            <CollapsibleSection 
                                id="profileShift" title={s.profileShiftSection || "Profil Kaydırma & Kontrol (x₁, x₂)"} icon={<Ruler size={14} />} 
                                isOpen={expandedSection === 'profileShift'} onToggle={() => toggleSection('profileShift')}
                            >
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <GearInput label={s.shiftX1 || "Pinyon Kaydırma (x₁)"} unit="" value={x1} min={-1.5} max={1.5} step="any" onChange={(v: number) => setX1(v)} color="#00e5ff" desc={s.descShiftX1 || "Pinyon profil kaydırma katsayısı"} />
                                        <GearInput label={s.shiftX2 || "Çark Kaydırma (x₂)"} unit="" value={x2} min={-1.5} max={1.5} step="any" onChange={(v: number) => setX2(v)} color="#8b5cf6" desc={s.descShiftX2 || "Çark profil kaydırma katsayısı"} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <GearInput label={s.pinionPinDia || "Pinyon Pim Çapı (dp₁)"} unit="mm" value={pinDia1} min={0.5} max={50} step="any" onChange={(v: number) => setPinDia1(v)} color="#6366f1" desc={t12(currentLang, "Pin measurement diameter (~1.7 · m)", "Pim ölçüm çapı (~1.7 · m)")} />
                                        <GearInput label={s.gearPinDia || "Çark Pim Çapı (dp₂)"} unit="mm" value={pinDia2} min={0.5} max={50} step="any" onChange={(v: number) => setPinDia2(v)} color="#a855f7" desc={t12(currentLang, "Pin measurement diameter (~1.7 · m)", "Pim ölçüm çapı (~1.7 · m)")} />
                                    </div>

                                    {/* Kafa Kısaltma (+/- k) — DIN 3960 / Yavuzlar Dişli Standardı */}
                                    <div className="p-3 rounded-xl bg-[var(--bg-1)] border border-[var(--line)] space-y-2.5">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-[11px] font-bold text-white flex items-center gap-1.5 font-mono">
                                                <Wrench size={12} className="text-[var(--cyan)]" />
                                                {t12(currentLang, 'Tip Shortening (+/- k)', 'Kafa Kısaltma (+/- k)')}
                                            </span>
                                            <div className="flex items-center gap-1 bg-[var(--bg-0)] p-0.5 rounded-lg border border-[var(--line)] text-[9px] font-mono">
                                                <button
                                                    type="button"
                                                    onClick={() => setKFactorMode('workshop')}
                                                    className={`px-2 py-0.5 rounded transition-all cursor-pointer ${kFactorMode === 'workshop' ? 'bg-[var(--cyan)] text-black font-bold shadow-sm' : 'text-slate-400 hover:text-white'}`}
                                                    title={t12(currentLang, "Workshop / Yavuzlar: da = d + 2m(1 + x + k)", "Atölye & Yavuzlar Dişli Formülü: da = d + 2m(1 + x + k). Eksi (-) k diş başını kısaltır.")}
                                                >
                                                    {t12(currentLang, 'Workshop (+k)', 'Atölye (+k)')}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setKFactorMode('auto')}
                                                    className={`px-2 py-0.5 rounded transition-all cursor-pointer ${kFactorMode === 'auto' ? 'bg-[var(--cyan)] text-black font-bold shadow-sm' : 'text-slate-400 hover:text-white'}`}
                                                    title={t12(currentLang, "Auto (KHK / DIN 3960)", "KHK Gears & DIN 3960 Teorik Otomatik: ha = (1 + y - x_diğer)·m")}
                                                >
                                                    {t12(currentLang, 'Auto (KHK / DIN 3960)', 'Oto (KHK/DIN)')}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setKFactorMode('custom')}
                                                    className={`px-2 py-0.5 rounded transition-all cursor-pointer ${kFactorMode === 'custom' ? 'bg-[var(--cyan)] text-black font-bold shadow-sm' : 'text-slate-400 hover:text-white'}`}
                                                    title={t12(currentLang, "DIN Manual: da = d + 2m(1 + x - k)", "DIN 3960 Manuel: da = d + 2m(1 + x - k). Artı (+) k diş başını kısaltır.")}
                                                >
                                                    {t12(currentLang, 'DIN Manual (-k)', 'DIN Manuel (-k)')}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Input Mode Controls */}
                                        {kFactorMode !== 'auto' ? (
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                                                    <span className="text-[9.5px]">
                                                        {kFactorMode === 'workshop' 
                                                            ? (t12(currentLang, 'Formula: da = d + 2m(1 + x + k) [Negative shortens]', 'Formül: da = d + 2m(1 + x + k) [Eksi değer başı kısaltır]'))
                                                            : (t12(currentLang, 'Formula: da = d + 2m(1 + x - k) [Positive shortens]', 'Formül: da = d + 2m(1 + x - k) [Artı değer başı kısaltır]'))}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => setLinkK(!linkK)}
                                                        className={`px-1.5 py-0.5 rounded border text-[9px] flex items-center gap-1 transition-all ${
                                                            linkK 
                                                                ? 'bg-[var(--cyan)]/10 text-[var(--cyan)] border-[var(--cyan)]/30 font-bold' 
                                                                : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'
                                                        }`}
                                                        title={t12(currentLang, "Link/unlink pinion & gear k", "Pinyon ve çark kısaltma katsayılarını birbirine bağla / ayır")}
                                                    >
                                                        {linkK ? (t12(currentLang, '🔗 Linked', '🔗 Bağlı (k₁=k₂)')) : (t12(currentLang, '⛓️ Independent', '⛓️ Ayrı (k₁≠k₂)'))}
                                                    </button>
                                                </div>

                                                {linkK ? (
                                                    <GearInput
                                                        label={t12(currentLang, "Crest Shortening Factor (k)", "Kafa Kısaltma Katsayısı (+/- k)")}
                                                        unit=""
                                                        value={customK1}
                                                        min={-2.5}
                                                        max={2.5}
                                                        step="any"
                                                        onChange={(v: number) => setCustomK1(v)}
                                                        color="#3ad0e6"
                                                        desc={kFactorMode === 'workshop' 
                                                            ? (t12(currentLang, "Workshop standard: negative k reduces tip diameter", "Atölye/Yavuzlar standardı: -0.107 girildiğinde diş başını 0.535 mm kısaltır"))
                                                            : (t12(currentLang, "DIN 3960 standard", "DIN 3960 standardı: da = d + 2m(1 + x - k)"))}
                                                    />
                                                ) : (
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <GearInput
                                                            label={t12(currentLang, "Pinion k₁", "Pinyon Kısaltma (k₁)")}
                                                            unit=""
                                                            value={customK1}
                                                            min={-2.5}
                                                            max={2.5}
                                                            step="any"
                                                            onChange={(v: number) => setCustomK1(v)}
                                                            color="#3ad0e6"
                                                        />
                                                        <GearInput
                                                            label={t12(currentLang, "Gear k₂", "Çark Kısaltma (k₂)")}
                                                            unit=""
                                                            value={customK2}
                                                            min={-2.5}
                                                            max={2.5}
                                                            step="any"
                                                            onChange={(v: number) => setCustomK2(v)}
                                                            color="#c084fc"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="flex justify-between items-center text-[10px] font-mono bg-[var(--bg-0)] p-2 rounded-lg border border-[var(--line)]">
                                                <span className="text-slate-400">
                                                    {t12(currentLang, 'KHK / DIN Theoretical k:', 'KHK / DIN 3960 Teorik Kısaltma:')}
                                                </span>
                                                <span className="text-[var(--cyan)] font-bold">
                                                    k = Σx - y = {formatEngineeringValue(results.k_din, precision, false)} ({formatEngineeringValue(results.k_mm, precision, false)} mm)
                                                </span>
                                            </div>
                                        )}

                                        {/* Dynamic Live Status Readout */}
                                        <div className="space-y-1.5 pt-1.5 border-t border-[var(--line)] text-[10px] font-mono">
                                            <div className="flex justify-between items-center">
                                                <span className="text-slate-400">{t12(currentLang, 'Tip Diameter Status:', 'Diş Başı Çapı Durumu:')}</span>
                                                {kFactorMode === 'workshop' ? (
                                                    results.k1 < -1e-5 ? (
                                                        <span className="text-[var(--warn)] font-bold flex items-center gap-1">
                                                            <span>🔻 {t12(currentLang, 'Shortened', 'Kısaltıldı')}:</span>
                                                            <span>Δda₁ = {formatEngineeringValue((2 * gearModule * results.k1), precision, false)} mm</span>
                                                        </span>
                                                    ) : results.k1 > 1e-5 ? (
                                                        <span className="text-[var(--cyan)] font-bold flex items-center gap-1">
                                                            <span>🔺 {t12(currentLang, 'Enlarged', 'Büyütüldü')}:</span>
                                                            <span>Δda₁ = +{formatEngineeringValue((2 * gearModule * results.k1), precision, false)} mm</span>
                                                        </span>
                                                    ) : (
                                                        <span className="text-[var(--ok)] font-bold">✓ {t12(currentLang, 'Nominal', 'Düzeltme Yok')}</span>
                                                    )
                                                ) : kFactorMode === 'custom' ? (
                                                    results.k1 > 1e-5 ? (
                                                        <span className="text-[var(--warn)] font-bold flex items-center gap-1">
                                                            <span>🔻 {t12(currentLang, 'Shortened', 'Kısaltıldı')}:</span>
                                                            <span>Δda₁ = -{formatEngineeringValue((2 * gearModule * results.k1), precision, false)} mm</span>
                                                        </span>
                                                    ) : results.k1 < -1e-5 ? (
                                                        <span className="text-[var(--cyan)] font-bold flex items-center gap-1">
                                                            <span>🔺 {t12(currentLang, 'Enlarged', 'Büyütüldü')}:</span>
                                                            <span>Δda₁ = +{formatEngineeringValue((2 * gearModule * Math.abs(results.k1)), precision, false)} mm</span>
                                                        </span>
                                                    ) : (
                                                        <span className="text-[var(--ok)] font-bold">✓ {t12(currentLang, 'Nominal', 'Düzeltme Yok')}</span>
                                                    )
                                                ) : (
                                                    <span className="text-[var(--ok)] font-bold">✓ {t12(currentLang, 'KHK Table 4.9 Match', 'KHK Tablo 4.9 Uyumlu')}</span>
                                                )}
                                            </div>

                                            <div className="flex justify-between items-center text-slate-300">
                                                <span>{t12(currentLang, 'Effective Diameters:', 'Aktif Çaplar:')}</span>
                                                <span className="text-white font-bold">
                                                    da₁ = {formatEngineeringValue(results.da1, precision, false)} mm · da₂ = {formatEngineeringValue(results.da2, precision, false)} mm
                                                </span>
                                            </div>

                                            <div className="flex justify-between items-center text-slate-500 text-[9px]">
                                                <span>{t12(currentLang, 'KHK Reference Tip:', 'KHK Gears Referans Tepe:')}</span>
                                                <span className="text-slate-400">
                                                    da₁ = {formatEngineeringValue(results.da1_khk, precision, false)} mm · da₂ = {formatEngineeringValue(results.da2_khk, precision, false)} mm
                                                </span>
                                            </div>
                                        </div>

                                        {(results.isCrestSharp1 || results.isCrestSharp2) && (
                                            <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-mono">
                                                <AlertTriangle size={12} className="shrink-0" />
                                                <span>
                                                    {t12(
                                                        currentLang,
                                                        `Warning: Knife-edge crest risk (sa < 0.25·m)! sa1=${formatEngineeringValue(results.sa1 || 0, precision, false)}mm`,
                                                        `Dikkat: Diş tepesi sivrilme riski (sa < 0.25·m)! sa₁=${formatEngineeringValue(results.sa1 || 0, precision, false)}mm, sa₂=${formatEngineeringValue(results.sa2 || 0, precision, false)}mm`
                                                    )}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Inspection Summary Stats Card */}
                                    <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-2 text-[10px] font-mono">
                                        <div className="flex justify-between text-white/60">
                                            <span>{s.workingPressureAngle || "İşletme Kavrama Açısı (α_wt):"}</span>
                                            <span className="text-cyan-400 font-bold">{((results.alpha_wt_deg ||formatEngineeringValue(20)), precision, false)}°</span>
                                        </div>
                                        <div className="flex justify-between text-white/60">
                                            <span>{s.workingCenterDistance || "İşletme Eksen Mesafesi (a_wt):"}</span>
                                            <span className="text-emerald-400 font-bold">{formatEngineeringValue(results.a, precision, false)} mm</span>
                                        </div>
                                        <div className="flex justify-between text-white/60">
                                            <span>{s.wildhaberSpan || "Wildhaber Kiriş Ölçüsü (W_k):"}</span>
                                            <span className="text-purple-300 font-bold">W₁={formatEngineeringValue(results.Wk1.W, precision, false)}mm (k={results.Wk1.k}) · W₂={formatEngineeringValue(results.Wk2.W, precision, false)}mm</span>
                                        </div>
                                        <div className="flex justify-between text-white/60">
                                            <span>{s.overPinsMeasure || "Pimler Üzeri Ölçü (M_d):"}</span>
                                            <span className="text-amber-300 font-bold">M₁={formatEngineeringValue(results.M1, precision, false)}mm · M₂={formatEngineeringValue(results.M2, precision, false)}mm</span>
                                        </div>
                                    </div>
                                </div>
                            </CollapsibleSection>

                            {/* Section: Material */}
                            <CollapsibleSection 
                                id="material" title={s.materialSection || "Malzeme & Mukavemet"} icon={<Layers size={14} />}
                                isOpen={expandedSection === 'material'} onToggle={() => toggleSection('material')}
                            >
                                <div className="space-y-4">
                                    <GearSelect label={s.materialSelect || "Dişli Malzemesi"} value={materialName} onChange={(v: string) => setMaterialName(v)} options={GEAR_MATERIALS.map(m => ({ value: m.name, label: m.name }))} color="#10b981" desc={s.descMaterial} />
                                    <div className="grid grid-cols-2 gap-3 text-[10px] font-mono bg-black/40 p-3 rounded-xl border border-white/5">
                                        <div><span className="text-gray-500 block">σ_Flim ({t12(currentLang, 'Bending', 'Eğilme')}):</span><span className="text-emerald-400 font-bold">{material.sigma_Flim} MPa</span></div>
                                        <div><span className="text-gray-500 block">σ_Hlim ({t12(currentLang, 'Contact', 'Ezilme')}):</span><span className="text-emerald-400 font-bold">{material.sigma_Hlim} MPa</span></div>
                                        <div><span className="text-gray-500 block">σF / SF:</span><span className="text-white font-bold">{formatEngineeringValue(results.estBendingStress, precision, false)} MPa · {formatEngineeringValue(results.SF_bending, precision, false)}</span></div>
                                        <div><span className="text-gray-500 block">σH / SH:</span><span className="text-white font-bold">{formatEngineeringValue(results.estContactStress, precision, false)} MPa · {formatEngineeringValue(results.SF_contact, precision, false)}</span></div>
                                        <div><span className="text-gray-500 block">YF · YS · Yβ:</span><span className="text-cyan-300 font-bold">{(results.YF1 ??formatEngineeringValue(0), precision, false)} · — · {(results.Ybeta ??formatEngineeringValue(1), precision, false)}</span></div>
                                        <div><span className="text-gray-500 block">Kv · ZH · KHβ:</span><span className="text-cyan-300 font-bold">{formatEngineeringValue(results.Kv, precision, false)} · {(results.ZH ??formatEngineeringValue(0), precision, false)} · {(results.KHbeta ??formatEngineeringValue(0), precision, false)}</span></div>
                                    </div>
                                    <p className="text-[9px] font-mono text-white/40">
                                        ISO 6336 Method B · {results.isoStatus ?? '—'} · {results.isoCritical ?? ''} · εα={formatEngineeringValue(results.epsilonAlpha, precision, false)}{results.epsilonBeta > 0.05 ? ` · εβ=${formatEngineeringValue(results.epsilonBeta, precision, false)}` : ''}
                                    </p>
                                </div>
                            </CollapsibleSection>

                            {/* Section: Service Conditions & Yılmaz Standards */}
                            <CollapsibleSection 
                                id="service" title={s.serviceConditions || "İşletme Şartları & Servis Faktörü"} icon={<Activity size={14} />}
                                isOpen={expandedSection === 'service'} onToggle={() => toggleSection('service')}
                            >
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <GearSelect
                                            label={s.loadClass || "Yük Karakteristiği"}
                                            value={loadClass}
                                            onChange={(v: any) => setLoadClass(v)}
                                            options={[
                                                { value: 'U', label: s.loadUniform || "Düzgün Yük (U)" },
                                                { value: 'M', label: s.loadModerate || "Orta Darbeli (M)" },
                                                { value: 'H', label: s.loadHeavy || "Ağır Darbeli (H)" },
                                            ]}
                                            color="#00e5ff"
                                            desc={s.descLoadClass}
                                        />
                                        <GearSelect
                                            label={s.dailyHours || "Günlük Çalışma"}
                                            value={String(dailyHours)}
                                            onChange={(v: string) => setDailyHours(Number(v))}
                                            options={[
                                                { value: '2', label: s.hoursLess3 || "< 3 Saat/Gün" },
                                                { value: '8', label: s.hours3to10 || "3 – 10 Saat/Gün" },
                                                { value: '16', label: s.hoursMore10 || "> 10 Saat/Gün" },
                                            ]}
                                            color="#8b5cf6"
                                            desc={s.descDailyHours}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <GearInput
                                            label={s.startsPerHour || "Başlatma / Saat"}
                                            unit="1/saat"
                                            value={startsPerHour}
                                            min={1}
                                            max={500}
                                            step={1}
                                            onChange={(v: number) => setStartsPerHour(v)}
                                            color="#f59e0b"
                                            desc={s.descStartsPerHour}
                                        />
                                        <GearSelect
                                            label={s.outputConnect || "Çıkış Bağlantı Türü"}
                                            value={connectionType}
                                            onChange={(v: any) => setConnectionType(v)}
                                            options={[
                                                { value: 'coupling', label: s.connDirect || "Kaplin / Direkt (fz=1.0)" },
                                                { value: 'sprocket', label: s.connChain || "Zincir Dişli (fz=1.25)" },
                                                { value: 'v_belt', label: s.connVBelt || "V-Kayış (fz=1.5)" },
                                                { value: 'flat_belt', label: s.connFlatBelt || "Düz Kayış (fz=2.5)" },
                                            ]}
                                            color="#10b981"
                                            desc={s.descConnection}
                                        />
                                    </div>
                                    <div className="p-3 rounded-xl bg-black/40 border border-white/5 flex justify-between text-xs font-mono">
                                        <span className="text-white/40">{s.reqFs || "Gerekli Servis Faktörü (fs_req):"}</span>
                                        <span className="text-cyan-400 font-bold">{results.requiredFs ?formatEngineeringValue(results.requiredFs, precision, false) : '1.20'}</span>
                                    </div>
                                </div>
                            </CollapsibleSection>

                            {/* Section: Motor */}
                            <CollapsibleSection 
                                id="motor" title={s.motorLoad || "Tahrik & Motor"} icon={<Zap size={14} />}
                                isOpen={expandedSection === 'motor'} onToggle={() => toggleSection('motor')}
                            >
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <GearSelect label={s.motorPower || "Motor Gücü (kW)"} value={String(selectedPower)} onChange={(v: string) => setSelectedPower(Number(v))} options={IEC_MOTORS.map(m => ({ value: String(m.power), label: `${m.power} kW` }))} color="#00e5ff" desc={s.descMotorPower} />
                                        <GearSelect label={s.motorPoles || "Kutup Sayısı"} value={String(selectedPoles)} onChange={(v: string) => setSelectedPoles(Number(v) as any)} options={[
                                            { value: '2', label: s.poles2 },
                                            { value: '4', label: s.poles4 },
                                            { value: '6', label: s.poles6 }
                                        ]} color="#8b5cf6" desc={s.descPoles} />
                                    </div>
                                    <div className="p-3 rounded-xl bg-black/40 border border-white/5 flex justify-between text-xs font-mono">
                                        <span className="text-white/40">{s.motorSpeedTorque || "Giriş Devri / Torku:"}:</span>
                                        <span className="text-cyan-400 font-bold">{motorSpeed} RPM · {formatEngineeringValue((results.motorTorque || ((9550 * selectedPower) / (motorSpeed || 1450))), precision, false)} Nm</span>
                                    </div>
                                </div>
                            </CollapsibleSection>
                        </div>
                    )}
                </div>
            </div>

            {/* ═══ RIGHT PANEL — Live Visualization & Results (62%) ═══ */}
            <div className="flex-1 h-auto lg:h-full flex flex-col overflow-hidden min-w-0">
                
                {/* ═══ TRAIN MODE VIEW ═══ */}
                {workflowMode === 'train' ? (
                    <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar p-5 space-y-5">
                        
                        {/* Top Action & Export Bar */}
                        <div className="p-3.5 rounded-2xl bg-[var(--bg-1)]/90 border border-white/10 flex flex-wrap items-center justify-between gap-3 shadow-lg">
                            <div className="flex items-center gap-2">
                                <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                                    <Cpu size={16} />
                                </div>
                                <div>
                                    <h3 className="text-xs font-mono font-bold text-white">
                                        {t12(currentLang, 'MULTI-STAGE GEAR TRAIN CAE SYSTEM', 'ÇOK KADEMELİ DİŞLİ TRENİ CAE HESAPLAMA SİSTEMİ')}
                                    </h3>
                                    <p className="text-[10px] text-white/40">
                                        {t12(currentLang, `${trainNodes.length} Gears · ${trainResults.shafts.length} Shafts · Total Ratio i = ${trainResults.totalRatio}:1`, `${trainNodes.length} Dişli · ${trainResults.shafts.length} Mil · Toplam Oran i = ${trainResults.totalRatio}:1`)}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={exportTrainPDF}
                                    className="px-3 py-1.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/40 text-purple-300 text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer "
                                    title={t12(currentLang, 'Export PDF Technical Report', 'ISO 6336 Dişli Treni Teknik Raporu (PDF)')}
                                >
                                    <Download size={13} />
                                    <span>{t12(currentLang, 'PDF Report', 'PDF Raporu')}</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={exportTrainCSV}
                                    className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer "
                                    title={t12(currentLang, 'Export CSV Manufacturing Schedule', 'Talaşlı İmalat Dişli Çizelgesi (CSV)')}
                                >
                                    <FileSpreadsheet size={13} />
                                    <span>{t12(currentLang, 'CSV BOM', 'CSV Çizelge')}</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={handleExportTo2DCad}
                                    className="px-3 py-1.5 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/40 text-sky-300 text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer "
                                    title={t12(currentLang, 'Export Gear Train to 2D Drafting (AluCAD)', 'Dişli Trenini 2D Teknik Çizime (AluCAD) Aktar')}
                                >
                                    <Layers size={13} />
                                    <span>2D CAD</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={handleExportTo3DAssembly}
                                    className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black text-xs font-mono font-black flex items-center gap-1.5 transition-all cursor-pointer "
                                    title={t12(currentLang, 'Send All Gears to 3D Design Studio', 'Tüm Dişlileri 3D Tasarım Stüdyosu\'na Aktar')}
                                >
                                    <Box size={13} />
                                    <span>{t12(currentLang, 'Send to 3D CAD', '3D CAD\'e Aktar')}</span>
                                </button>
                            </div>
                        </div>

                        {/* Top KPI Header for Gear Train */}
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                            <div className="p-3.5 rounded-2xl bg-[var(--bg-1)]/80 border border-cyan-500/30">
                                <span className="text-[9px] font-mono uppercase text-white/40 block">{s.kpiTotalRatio || "Toplam Çevrim Oranı"}</span>
                                <span className="text-xl font-mono font-black text-cyan-400">{formatEngineeringValue(trainResults.totalRatio, precision, false)}:1</span>
                            </div>
                            <div className="p-3.5 rounded-2xl bg-[var(--bg-1)]/80 border border-white/10">
                                <span className="text-[9px] font-mono uppercase text-white/40 block">{s.kpiInputRpm || "Giriş Devri"}</span>
                                <span className="text-xl font-mono font-black text-white">{trainResults.inputRpm} RPM</span>
                            </div>
                            <div className="p-3.5 rounded-2xl bg-[var(--bg-1)]/80 border border-white/10">
                                <span className="text-[9px] font-mono uppercase text-white/40 block">{s.kpiOutputRpm || "Çıkış Devri"}</span>
                                <span className="text-xl font-mono font-black text-purple-400">{formatEngineeringValue(trainResults.outputRpm, precision, false)} RPM</span>
                            </div>
                            <div className="p-3.5 rounded-2xl bg-[var(--bg-1)]/80 border border-white/10">
                                <span className="text-[9px] font-mono uppercase text-white/40 block">{s.kpiOutputTorque || "Çıkış Torku"}</span>
                                <span className="text-xl font-mono font-black text-amber-400">{formatEngineeringValue(trainResults.outputTorqueNm, precision, false)} Nm</span>
                            </div>
                            <div className="p-3.5 rounded-2xl bg-[var(--bg-1)]/80 border border-white/10">
                                <span className="text-[9px] font-mono uppercase text-white/40 block">{s.kpiTotalEfficiency || "Toplam Verim"}</span>
                                <span className="text-xl font-mono font-black text-emerald-400">%{formatEngineeringValue((trainResults.overallEfficiency * 100), precision, false)}</span>
                            </div>
                        </div>

                        {/* Thermal Loss, Heat Dissipation & Lubrication Specs */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="p-3.5 rounded-2xl bg-[var(--bg-1)]/80 border border-white/10 space-y-1">
                                <span className="text-[9px] font-mono uppercase text-white/40 block flex items-center gap-1.5">
                                    <Activity size={12} className="text-red-400" />
                                    {t12(currentLang, 'Friction Power Loss (Ploss)', 'Sürtünme & Güç Kaybı (Ploss)')}
                                </span>
                                <div className="text-base font-mono font-bold text-red-400">
                                    {trainResults.totalPowerLossKW} kW
                                    <span className="text-[10px] text-white/40 font-normal ml-2">
                                        (%{formatEngineeringValue(((1 - trainResults.overallEfficiency) * 100), precision, false)})
                                    </span>
                                </div>
                            </div>

                            <div className="p-3.5 rounded-2xl bg-[var(--bg-1)]/80 border border-white/10 space-y-1">
                                <span className="text-[9px] font-mono uppercase text-white/40 block flex items-center gap-1.5">
                                    <Zap size={12} className="text-amber-400" />
                                    {t12(currentLang, 'Heat Dissipation Req. (Q)', 'Gerekli Isı Atım Kapasitesi (Q)')}
                                </span>
                                <div className="text-base font-mono font-bold text-amber-400">
                                    {trainResults.heatDissipationReqKW} kW
                                    <span className="text-[10px] text-white/40 font-normal ml-2">
                                        ({t12(currentLang, 'Casing Cooling', 'Gövde Soğutması')})
                                    </span>
                                </div>
                            </div>

                            <div className="p-3.5 rounded-2xl bg-[var(--bg-1)]/80 border border-white/10 space-y-1">
                                <span className="text-[9px] font-mono uppercase text-white/40 block flex items-center gap-1.5">
                                    <Wrench size={12} className="text-cyan-400" />
                                    {t12(currentLang, 'Recommended Lubricant', 'Önerilen Yağlama Standardı')}
                                </span>
                                <div className="text-[11px] font-mono font-bold text-cyan-300 leading-tight">
                                    {trainResults.lubrication}
                                </div>
                            </div>
                        </div>

                        {/* IMPOSSIBLE DESIGN WARNING CARD */}
                        {trainResults.isImpossible && (
                            <div className="p-4 rounded-2xl bg-red-950/40 border-2 border-red-500/60 space-y-3 font-mono">
                                <div className="flex items-center justify-between flex-wrap gap-2">
                                    <div className="flex items-center gap-2.5 text-red-400">
                                        <AlertTriangle size={22} className="shrink-0 text-red-400 animate-pulse" />
                                        <div>
                                            <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider text-red-300">
                                                {t12(currentLang, '🚨 IMPOSSIBLE DESIGN (CANNOT BE ASSEMBLED OR MANUFACTURED)', '🚨 BU TASARIM İMKANSIZDIR (İMAL EDİLEMEZ / TOPLANAMAZ)')}
                                            </h4>
                                            <p className="text-[10px] text-red-200/60">
                                                {t12(currentLang, `${trainResults.validationErrors.length} critical geometric/physical clashes detected.`, `${trainResults.validationErrors.length} adet kritik geometrik/fiziksel uyuşmazlık tespit edildi.`)}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const fixed = autoFixGearTrain(trainNodes);
                                            setTrainNodes(fixed);
                                        }}
                                        className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-black text-xs uppercase flex items-center gap-1.5 transition-all cursor-pointer"
                                    >
                                        <Zap size={14} />
                                        <span>{t12(currentLang, '⚡ Auto-Fix Design', '⚡ Tasarımı Otomatik Düzelt (Auto-Fix)')}</span>
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                                    {trainResults.validationErrors.map((err, errIdx) => (
                                        <div key={'val-err-' + errIdx} className="p-3 rounded-xl bg-black/60 border border-red-500/30 space-y-1">
                                            <div className="flex items-center justify-between text-red-400 font-bold text-[11px]">
                                                <span>{t12(language, err.titleEn, err.titleTr)}</span>
                                                <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-[9px] uppercase">{err.gearName}</span>
                                            </div>
                                            <p className="text-[10px] text-white/80 leading-relaxed">
                                                {t12(language, err.messageEn, err.messageTr)}
                                            </p>
                                            <p className="text-[10px] text-emerald-400/90 font-bold pt-1 border-t border-white/5">
                                                💡 {t12(currentLang, `Fix: ${err.remedyEn}`, `Çözüm: ${err.remedyTr}`)}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 2D Interactive Multi-Gear Train Unified Drafting Board */}
                        <div className="flex flex-col space-y-3">
                            {/* View Switcher Bar */}
                            <div className="px-5 py-3 rounded-2xl border border-white/10 bg-[var(--bg-1)]/80 flex items-center justify-between z-20">
                                <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-400">
                                    <Eye size={14} />
                                    <span>{s.canvasTitle || "2D TEKNİK RESİM KANVASI:"}</span>
                                </div>
                                <div className="flex items-center gap-1.5 bg-[var(--bg-0)] p-1 rounded-xl border border-white/10 text-[10px] font-mono">
                                    <button
                                        type="button"
                                        onClick={() => setTrainViewMode('both')}
                                        className={`px-3 py-1 rounded-lg font-bold transition-all ${
                                            trainViewMode === 'both'
                                                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-black '
                                                : 'text-white/40 hover:text-white'
                                        }`}
                                    >
                                        {s.viewBoth || "Tam Levha (Önden + Kesit)"}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setTrainViewMode('front')}
                                        className={`px-3 py-1 rounded-lg font-bold transition-all ${
                                            trainViewMode === 'front'
                                                ? 'bg-[var(--cyan)] text-[var(--accent-ink)] '
                                                : 'text-white/40 hover:text-white'
                                        }`}
                                    >
                                        {s.viewFront || "Önden Kinematik"}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setTrainViewMode('top_section')}
                                        className={`px-3 py-1 rounded-lg font-bold transition-all ${
                                            trainViewMode === 'top_section'
                                                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white '
                                                : 'text-white/40 hover:text-white'
                                        }`}
                                    >
                                        {s.viewSection || "Üstten Kesit"}
                                    </button>
                                </div>
                            </div>

                            {/* Single Unified Drawing Canvas */}
                            <div className="relative rounded-xl overflow-hidden border border-cyan-500/25 bg-[var(--bg-0)] shadow-2xl min-h-[540px]">
                                <MultiGearTrainSVG
                                    gears={trainResults.gears}
                                    shafts={trainResults.shafts}
                                    selectedGearId={selectedTrainGearId}
                                    onSelectGear={setSelectedTrainGearId}
                                    viewMode={trainViewMode}
                                />
                            </div>
                        </div>

                        {/* Stage-by-Stage Kinematic & Strength Matrix Table */}
                        <div className="p-4 rounded-2xl bg-[var(--bg-1)]/80 border border-white/10 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-mono font-bold uppercase text-cyan-400 flex items-center gap-2">
                                    <Layers size={14} />
                                    {t12(currentLang, 'STAGE-BY-STAGE KINEMATICS & STRENGTH MATRIX', 'KADEME KADEME DİŞLİ KİNEMATİK & MUKAVEMET MATRİSİ')}
                                </span>
                            </div>

                            <div className="overflow-x-auto custom-scrollbar">
                                <table className="w-full text-[10px] font-mono text-left">
                                    <thead className="text-white/40 border-b border-white/10 bg-black/30">
                                        <tr>
                                            <th className="p-2">{t12(currentLang, 'Gear', 'Dişli')}</th>
                                            <th className="p-2">{t12(currentLang, 'Shaft', 'Mil')}</th>
                                            <th className="p-2">z / m</th>
                                            <th className="p-2">{t12(currentLang, 'Pitch Dia (d)', 'Çap (d)')}</th>
                                            <th className="p-2">{t12(currentLang, 'Speed (RPM)', 'Devir')}</th>
                                            <th className="p-2">{t12(currentLang, 'Torque (Nm)', 'Tork')}</th>
                                            <th className="p-2">{t12(currentLang, 'Ft (Tangential)', 'Ft (Teğetsel)')}</th>
                                            <th className="p-2">{t12(currentLang, 'SF Bending', 'SF Eğilme')}</th>
                                            <th className="p-2">{t12(currentLang, 'SH Contact', 'SF Ezilme')}</th>
                                            <th className="p-2">{t12(currentLang, 'Contact Ratio (εα)', 'Kavrama (εα)')}</th>
                                            <th className="p-2">Wildhaber Wk</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {trainResults.gears.map((g) => {
                                            const isSel = selectedTrainGearId === g.id;
                                            return (
                                                <tr
                                                    key={'matrix-' + g.id}
                                                    onClick={() => setSelectedTrainGearId(g.id)}
                                                    className={`cursor-pointer transition-colors ${
                                                        isSel ? 'bg-cyan-500/15 text-white font-bold' : 'hover:bg-white/5 text-white/70'
                                                    }`}
                                                >
                                                    <td className="p-2 flex items-center gap-1.5">
                                                        <span className={`w-1.5 h-1.5 rounded-full ${isSel ? 'bg-cyan-400' : 'bg-white/30'}`} />
                                                        {g.name}
                                                    </td>
                                                    <td className="p-2">#{g.shaftId}</td>
                                                    <td className="p-2">z={g.teeth} / m={g.module}</td>
                                                    <td className="p-2">{formatEngineeringValue(g.d, precision, false)} mm</td>
                                                    <td className="p-2">{formatEngineeringValue(g.rpm, precision, false)} RPM</td>
                                                    <td className="p-2">{formatEngineeringValue(g.torque, precision, false)} Nm</td>
                                                    <td className="p-2">{formatEngineeringValue(g.Ft, precision, false)} N</td>
                                                    <td className={`p-2 ${g.SF_bending >= 1.4 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                        {formatEngineeringValue(g.SF_bending, precision, false)}
                                                    </td>
                                                    <td className={`p-2 ${g.SF_contact >= 1.0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                        {formatEngineeringValue(g.SF_contact, precision, false)}
                                                    </td>
                                                    <td className="p-2 text-cyan-300">{(g.transverseContactRatio ||formatEngineeringValue(1.6), precision, false)}</td>
                                                    <td className="p-2 text-purple-300">{formatEngineeringValue(g.wildhaberW, precision, false)} mm (k={g.wildhaberK})</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Interactive Clicked Gear Manufacturing Passport */}
                        <GearManufacturingPassport gear={selectedGear} />

                    </div>
                ) : khkFamily === 'rack' ? (
                    <KhkRackView currentLang={currentLang} />
                ) : khkFamily === 'bevel' ? (
                    <KhkBevelView currentLang={currentLang} />
                ) : khkFamily === 'worm' ? (
                    <KhkWormView currentLang={currentLang} />
                ) : khkFamily === 'screw' ? (
                    <KhkScrewView currentLang={currentLang} />
                ) : (
                    /* ═══ STANDARD PAIR VIEW (CYLINDRICAL & INTERNAL) ═══ */
                    <div className="flex-1 flex flex-col h-full overflow-hidden min-h-0 bg-[var(--bg-0)]">
                        {/* ═══ TOP TAB NAVIGATION BAR ═══ */}
                        <div className="flex-none px-3 py-2 border-b border-white/5 bg-[var(--bg-0)] flex items-center justify-between gap-2 overflow-x-auto scrollbar-none z-20">
                            <div className="flex items-center gap-1 font-mono text-[10px]">
                                {([
                                    { id: 'RESULT', en: 'RESULT', tr: 'SONUÇ' },
                                    { id: 'GEOMETRY', en: 'GEOMETRY', tr: 'GEOMETRİ' },
                                    { id: 'STRENGTH', en: 'STRENGTH (ISO 6336)', tr: 'MUKAVEMET (ISO 6336)' },
                                    { id: 'MANUFACTURING', en: 'MANUFACTURING', tr: 'İMALAT' },
                                    { id: 'CAD', en: '2D/3D CAD', tr: '2D/3D CAD' },
                                    { id: 'AUDIT', en: 'STANDARDS AUDIT', tr: 'STANDART & DENETİM' },
                                    { id: 'WORKSTATION', en: 'SPLIT DESK', tr: 'BÖLÜNMÜŞ MASA' },
                                ] as const).map((tab) => {
                                    const isActive = pairViewTab === tab.id;
                                    return (
                                        <button
                                            key={tab.id}
                                            type="button"
                                            onClick={() => setPairViewTab(tab.id)}
                                            className={`px-2.5 py-1 rounded-lg font-bold uppercase transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                                                isActive
                                                    ? 'bg-[var(--cyan)] text-[var(--accent-ink)] '
                                                    : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/5'
                                            }`}
                                        >
                                            {tab.id === 'RESULT' && <Activity size={12} />}
                                            {tab.id === 'GEOMETRY' && <Ruler size={12} />}
                                            {tab.id === 'STRENGTH' && <ShieldCheck size={12} />}
                                            {tab.id === 'MANUFACTURING' && <Wrench size={12} />}
                                            {tab.id === 'CAD' && <Box size={12} />}
                                            {tab.id === 'AUDIT' && <BookOpen size={12} />}
                                            {tab.id === 'WORKSTATION' && <Layers size={12} />}
                                            <span>{t12(currentLang, tab.en, tab.tr)}</span>
                                        </button>
                                    );
                                })}
                            </div>
                            <div className="hidden sm:flex items-center gap-1.5 font-mono text-[9px] text-gray-400 shrink-0">
                                <span className={`w-1.5 h-1.5 rounded-full ${isSafe ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                                <span className="font-bold text-white">SF,b: {formatEngineeringValue(results.SF_bending, precision, false)}</span>
                                <span className="text-gray-500">·</span>
                                <span className="font-bold text-cyan-300">SH: {formatEngineeringValue(results.SF_contact, precision, false)}</span>
                            </div>
                        </div>

                        {/* ═══ TAB 1: RESULT (DEFAULT — RESULT-FIRST WORKSTATION) ═══ */}
                        {pairViewTab === 'RESULT' && (
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4 max-w-5xl mx-auto w-full">
                                {/* KHK Internal Gear Interference Diagnostics Banner */}
                                {meshType === 'internal' && (
                                    <KhkInternalInterferenceBanner
                                        moduleVal={gearModule}
                                        pinionTeeth={z1}
                                        ringTeeth={z2}
                                        currentLang={currentLang}
                                    />
                                )}

                                {/* Primary Safety Factor HUD */}
                                <div className="p-4 rounded-2xl border border-[var(--line)] bg-[var(--bg-1)] shadow-lg">
                                    <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className={`w-2.5 h-2.5 rounded-full ${isSafe ? 'bg-[var(--ok)]' : 'bg-[var(--bad)]'} animate-pulse`} />
                                            <span className="text-sm font-bold text-white">{isSafe ? s.designSafe : s.designWarning}</span>
                                        </div>
                                        <span className="px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[10px] font-bold">
                                            ISO 6336 Method B Screening
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-2 border-y border-white/5">
                                        <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col items-center justify-center">
                                            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">{s.bendingSafety} (SF,b)</span>
                                            <span className={`text-3xl sm:text-4xl font-mono font-black my-1 ${results.SF_bending >= 1.4 ? 'text-[var(--ok)]' : results.SF_bending >= 1.0 ? 'text-[var(--warn)]' : 'text-[var(--bad)]'}`}>
                                                {formatEngineeringValue(results.SF_bending, precision, false)}
                                            </span>
                                            <span className="text-[9px] font-mono text-slate-500">{t12(currentLang, 'Target: ≥ 1.40', 'Hedef: ≥ 1.40')}</span>
                                        </div>
                                        <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col items-center justify-center">
                                            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">{s.contactSafety} (SH)</span>
                                            <span className={`text-3xl sm:text-4xl font-mono font-black my-1 ${results.SF_contact >= 1.2 ? 'text-[var(--cyan)]' : results.SF_contact >= 1.0 ? 'text-[var(--warn)]' : 'text-[var(--bad)]'}`}>
                                                {formatEngineeringValue(results.SF_contact, precision, false)}
                                            </span>
                                            <span className="text-[9px] font-mono text-slate-500">{t12(currentLang, 'Target: ≥ 1.20', 'Hedef: ≥ 1.20')}</span>
                                        </div>
                                        <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col items-center justify-center">
                                            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">{t12(currentLang, 'Bending Stress σF', 'Eğilme Gerilmesi σF')}</span>
                                            <span className="text-xl sm:text-2xl font-mono font-black my-1 text-white">
                                                {formatEngineeringValue(results.estBendingStress, precision, false)} <span className="text-xs text-slate-400 font-normal">MPa</span>
                                            </span>
                                            <span className="text-[9px] font-mono text-slate-500">{t12(currentLang, 'Nominal Tooth Root', 'Nominal Diş Dibi')}</span>
                                        </div>
                                        <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col items-center justify-center">
                                            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">{t12(currentLang, 'Hertzian Stress σH', 'Hertz Basıncı σH')}</span>
                                            <span className="text-xl sm:text-2xl font-mono font-black my-1 text-cyan-300">
                                                {formatEngineeringValue(results.estContactStress, precision, false)} <span className="text-xs text-slate-400 font-normal">MPa</span>
                                            </span>
                                            <span className="text-[9px] font-mono text-slate-500">{t12(currentLang, 'Flank Contact Zone', 'Yanak Temas Bölgesi')}</span>
                                        </div>
                                    </div>

                                    {/* Governing Limiting Factor Badge */}
                                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                                        <span className="text-slate-400 uppercase tracking-wider">
                                            {t12(currentLang, 'Governing Bottleneck / Failure Mode:', 'Sınırlandırıcı Kritik Yorulma Modu:')}
                                        </span>
                                        <span className={`px-2.5 py-1 rounded-lg font-bold border ${
                                            results.isoCritical?.includes('Pitting')
                                                ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300'
                                                : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                                        }`}>
                                            {results.isoCritical?.includes('Pitting')
                                                ? t12(currentLang, 'Surface Pitting (Flank Contact Fatigue)', 'Yüzey Ezilmesi / Çukurlaşma (Yanak Temas Yorulması)')
                                                : t12(currentLang, 'Tooth Root Bending Fatigue (SF,b)', 'Diş Dibi Kırılması / Eğilme Yorulması (SF,b)')}
                                        </span>
                                    </div>
                                </div>

                                {/* Primary Kinematics & Dimensions Grid */}
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 font-mono text-xs">
                                    <div className="p-3 rounded-xl bg-[var(--bg-2)] border border-[var(--line)]">
                                        <span className="text-slate-400 block text-[9px] uppercase">{s.ratio || "Ratio"} (i)</span>
                                        <span className="text-cyan-400 font-black text-base">{formatEngineeringValue(results.ratio, precision, true)}:1</span>
                                    </div>
                                    <div className="p-3 rounded-xl bg-[var(--bg-2)] border border-[var(--line)]">
                                        <span className="text-slate-400 block text-[9px] uppercase">{s.centerDist || "Center Dist"} (aw)</span>
                                        <span className="text-emerald-400 font-black text-base">{formatEngineeringValue(results.a, precision, true)} mm</span>
                                    </div>
                                    <div className="p-3 rounded-xl bg-[var(--bg-2)] border border-[var(--line)]">
                                        <span className="text-slate-400 block text-[9px] uppercase">{t12(currentLang, 'Operating Angle (αwt)', 'Kavrama Açısı (αwt)')}</span>
                                        <span className="text-purple-400 font-black text-base">{formatEngineeringValue(results.alpha_wt_deg, precision, true)}°</span>
                                    </div>
                                    <div className="p-3 rounded-xl bg-[var(--bg-2)] border border-[var(--line)]">
                                        <span className="text-slate-400 block text-[9px] uppercase">{s.pitchVelocity || "v"}</span>
                                        <span className="text-amber-400 font-black text-base">{formatEngineeringValue(results.pitchVelocity, precision, true)} m/s</span>
                                    </div>
                                    <div className="p-3 rounded-xl bg-[var(--bg-2)] border border-[var(--line)]">
                                        <span className="text-slate-400 block text-[9px] uppercase">{s.contactRatio || "εα"}</span>
                                        <span className={`font-black text-base ${results.epsilonAlpha >= 1.2 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                            {formatEngineeringValue(results.epsilonAlpha, precision, true)}
                                        </span>
                                    </div>
                                    <div className="p-3 rounded-xl bg-[var(--bg-2)] border border-[var(--line)]">
                                        <span className="text-slate-400 block text-[9px] uppercase">{s.circPitch || "Circ. Pitch"} (p)</span>
                                        <span className="text-white font-black text-base">{formatEngineeringValue((Math.PI * gearModule), precision, true)} mm</span>
                                    </div>
                                </div>

                                {/* Tooth Mesh Force Decomposition */}
                                <div className="p-4 rounded-2xl bg-[var(--bg-1)] border border-[var(--line)] space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-mono font-bold text-white uppercase flex items-center gap-2">
                                            <Gauge size={14} className="text-cyan-400" />
                                            {t12(currentLang, 'Tooth Mesh Force Decomposition (ISO 6336)', 'Diş Kavrama Kuvvet Bileşenleri (ISO 6336)')}
                                        </span>
                                        <span className="text-[10px] font-mono text-slate-400">
                                            {t12(currentLang, `Pinion Pitch d1 = ${results.d1?.toFixed(2)} mm`, `Pinyon Bölüm Çapı d1 = ${results.d1?.toFixed(2)} mm`)}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs">
                                        <div className="p-2.5 rounded-lg bg-[var(--bg-2)] border border-white/5">
                                            <span className="text-[9px] text-slate-400 block uppercase">{t12(currentLang, 'Tangential Force (Ft)', 'Teğetsel Kuvvet (Ft)')}</span>
                                            <span className="text-base font-bold text-cyan-300">{formatEngineeringValue(results.Ft || 0, precision, false)} N</span>
                                        </div>
                                        <div className="p-2.5 rounded-lg bg-[var(--bg-2)] border border-white/5">
                                            <span className="text-[9px] text-slate-400 block uppercase">{t12(currentLang, 'Radial Force (Fr)', 'Radyal Kuvvet (Fr)')}</span>
                                            <span className="text-base font-bold text-amber-300">{formatEngineeringValue(results.Fr || 0, precision, false)} N</span>
                                        </div>
                                        <div className="p-2.5 rounded-lg bg-[var(--bg-2)] border border-white/5">
                                            <span className="text-[9px] text-slate-400 block uppercase">{t12(currentLang, 'Axial Force (Fa)', 'Eksenel Kuvvet (Fa)')}</span>
                                            <span className="text-base font-bold text-purple-300">{formatEngineeringValue(results.Fa || 0, precision, false)} N</span>
                                        </div>
                                        <div className="p-2.5 rounded-lg bg-[var(--bg-2)] border border-white/5">
                                            <span className="text-[9px] text-slate-400 block uppercase">{t12(currentLang, 'Normal Force (Fn)', 'Normal Diş Kuvveti (Fn)')}</span>
                                            <span className="text-base font-bold text-emerald-300">
                                                {formatEngineeringValue(Math.sqrt(Math.pow(results.Ft || 0, 2) + Math.pow(results.Fr || 0, 2) + Math.pow(results.Fa || 0, 2)), precision, false)} N
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Quick Jump Workflow Cards */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                                    <button
                                        type="button"
                                        onClick={() => setPairViewTab('CAD')}
                                        className="p-3 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-left transition-all cursor-pointer group"
                                    >
                                        <div className="flex items-center justify-between text-cyan-400 mb-1">
                                            <span className="text-xs font-mono font-bold">{t12(currentLang, '2D / 3D CAD Blueprint', '2D / 3D CAD ve İmalat Çizimi')}</span>
                                            <MoveRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                        </div>
                                        <p className="text-[10px] text-slate-400">{t12(currentLang, 'View full involute tooth profile, 1:1 DXF/SVG laser export & 3D assembly.', 'Tam evolvent diş formu, 1:1 DXF/SVG lazer aktarımı ve 3D montajı incele.')}</p>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPairViewTab('GEOMETRY')}
                                        className="p-3 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-left transition-all cursor-pointer group"
                                    >
                                        <div className="flex items-center justify-between text-purple-300 mb-1">
                                            <span className="text-xs font-mono font-bold">{t12(currentLang, 'Detailed Tooth Geometry', 'Detaylı Diş Geometrisi')}</span>
                                            <MoveRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                        </div>
                                        <p className="text-[10px] text-slate-400">{t12(currentLang, 'Inspect pitch, tip, root, base diameters, addendum/dedendum and profile shifts.', 'Bölüm, tepe, kök, temel çapları, baş/taban yükseklikleri ve profil kaydırmaları gör.')}</p>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPairViewTab('MANUFACTURING')}
                                        className="p-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-left transition-all cursor-pointer group"
                                    >
                                        <div className="flex items-center justify-between text-emerald-300 mb-1">
                                            <span className="text-xs font-mono font-bold">{t12(currentLang, 'Manufacturing & Inspection', 'İmalat & Ölçüm Pasaportu')}</span>
                                            <MoveRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                        </div>
                                        <p className="text-[10px] text-slate-400">{t12(currentLang, 'Wildhaber base tangent span (Wk), pin dimension (Md), and ISO 1328-1 quality tolerances.', 'Wildhaber kiriş ölçüsü (Wk), pimler üstü ölçü (Md) ve ISO 1328-1 toleransları.')}</p>
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* ═══ TAB 2: GEOMETRY ═══ */}
                        {pairViewTab === 'GEOMETRY' && (
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4 max-w-5xl mx-auto w-full">
                                <div className="p-4 rounded-2xl bg-[var(--bg-1)] border border-[var(--line)] space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-mono font-bold text-white uppercase flex items-center gap-2">
                                            <Ruler size={14} className="text-purple-400" />
                                            {t12(currentLang, 'Cylindrical Involute Gear Geometry (DIN 3960 / ISO 21771)', 'Silindirik Evolvent Dişli Geometrisi (DIN 3960 / ISO 21771)')}
                                        </span>
                                        <span className="text-[10px] font-mono text-cyan-400">
                                            mn = {gearModule} mm · β = {helixAngle}° · αn = {pressureAngle}°
                                        </span>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-xs font-mono text-left border-collapse">
                                            <thead>
                                                <tr className="border-b border-white/10 text-slate-400 text-[10px] uppercase">
                                                    <th className="py-2 px-3">{t12(currentLang, 'Geometric Parameter', 'Geometrik Parametre')}</th>
                                                    <th className="py-2 px-3">{t12(currentLang, 'Symbol', 'Sembol')}</th>
                                                    <th className="py-2 px-3 text-cyan-300">{t12(currentLang, `Pinion (z1=${z1})`, `Pinyon (z1=${z1})`)}</th>
                                                    <th className="py-2 px-3 text-purple-300">{t12(currentLang, `Gear (z2=${z2})`, `Çark (z2=${z2})`)}</th>
                                                    <th className="py-2 px-3">{t12(currentLang, 'Unit', 'Birim')}</th>
                                                    <th className="py-2 px-3">{t12(currentLang, 'Standard', 'Standart')}</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5">
                                                <tr>
                                                    <td className="py-2 px-3 text-white">{t12(currentLang, 'Reference Pitch Diameter', 'Bölüm Dairesi Çapı')}</td>
                                                    <td className="py-2 px-3 text-slate-400">d</td>
                                                    <td className="py-2 px-3 font-bold text-cyan-300">{formatEngineeringValue(results.d1, precision, true)}</td>
                                                    <td className="py-2 px-3 font-bold text-purple-300">{formatEngineeringValue(results.d2, precision, true)}</td>
                                                    <td className="py-2 px-3 text-slate-400">mm</td>
                                                    <td className="py-2 px-3 text-slate-500">DIN 3960</td>
                                                </tr>
                                                <tr>
                                                    <td className="py-2 px-3 text-white">{t12(currentLang, 'Working Pitch Diameter', 'İşletme Yuvarlanma Çapı')}</td>
                                                    <td className="py-2 px-3 text-slate-400">dw</td>
                                                    <td className="py-2 px-3 font-bold text-cyan-300">{formatEngineeringValue(results.dw1, precision, true)}</td>
                                                    <td className="py-2 px-3 font-bold text-purple-300">{formatEngineeringValue(results.dw2, precision, true)}</td>
                                                    <td className="py-2 px-3 text-slate-400">mm</td>
                                                    <td className="py-2 px-3 text-slate-500">ISO 21771</td>
                                                </tr>
                                                <tr>
                                                    <td className="py-2 px-3 text-white">{t12(currentLang, 'Base Diameter', 'Temel Daire Çapı')}</td>
                                                    <td className="py-2 px-3 text-slate-400">db</td>
                                                    <td className="py-2 px-3 font-bold text-cyan-300">{formatEngineeringValue(results.db1, precision, true)}</td>
                                                    <td className="py-2 px-3 font-bold text-purple-300">{formatEngineeringValue(results.db2, precision, true)}</td>
                                                    <td className="py-2 px-3 text-slate-400">mm</td>
                                                    <td className="py-2 px-3 text-slate-500">DIN 3960</td>
                                                </tr>
                                                <tr>
                                                    <td className="py-2 px-3 text-white">{t12(currentLang, 'Tip (Addendum) Diameter', 'Diş Başı (Tepe) Çapı')}</td>
                                                    <td className="py-2 px-3 text-slate-400">da</td>
                                                    <td className="py-2 px-3 font-bold text-cyan-300">{formatEngineeringValue(results.da1, precision, true)}</td>
                                                    <td className="py-2 px-3 font-bold text-purple-300">{formatEngineeringValue(results.da2, precision, true)}</td>
                                                    <td className="py-2 px-3 text-slate-400">mm</td>
                                                    <td className="py-2 px-3 text-slate-500">DIN 3960</td>
                                                </tr>
                                                <tr>
                                                    <td className="py-2 px-3 text-white">{t12(currentLang, 'Root (Dedendum) Diameter', 'Diş Dibi (Kök) Çapı')}</td>
                                                    <td className="py-2 px-3 text-slate-400">df</td>
                                                    <td className="py-2 px-3 font-bold text-cyan-300">{formatEngineeringValue(results.df1, precision, true)}</td>
                                                    <td className="py-2 px-3 font-bold text-purple-300">{formatEngineeringValue(results.df2, precision, true)}</td>
                                                    <td className="py-2 px-3 text-slate-400">mm</td>
                                                    <td className="py-2 px-3 text-slate-500">DIN 3960</td>
                                                </tr>
                                                <tr>
                                                    <td className="py-2 px-3 text-white">{t12(currentLang, 'Profile Shift Coefficient', 'Profil Kaydırma Katsayısı')}</td>
                                                    <td className="py-2 px-3 text-slate-400">x</td>
                                                    <td className="py-2 px-3 font-bold text-cyan-300">{x1 > 0 ? `+${x1.toFixed(3)}` : x1.toFixed(3)}</td>
                                                    <td className="py-2 px-3 font-bold text-purple-300">{x2 > 0 ? `+${x2.toFixed(3)}` : x2.toFixed(3)}</td>
                                                    <td className="py-2 px-3 text-slate-400">-</td>
                                                    <td className="py-2 px-3 text-slate-500">DIN 3960</td>
                                                </tr>
                                                <tr>
                                                    <td className="py-2 px-3 text-white">{t12(currentLang, 'Tip Shortening (+/- k)', 'Kafa Kısaltma (+/- k)')}</td>
                                                    <td className="py-2 px-3 text-slate-400">k</td>
                                                    <td className="py-2 px-3 font-bold text-cyan-300">{formatEngineeringValue(results.k1 || 0, precision, true)}</td>
                                                    <td className="py-2 px-3 font-bold text-purple-300">{formatEngineeringValue(results.k2 || 0, precision, true)}</td>
                                                    <td className="py-2 px-3 text-slate-400">-</td>
                                                    <td className="py-2 px-3 text-slate-500">DIN 3960</td>
                                                </tr>
                                                <tr>
                                                    <td className="py-2 px-3 text-white">{t12(currentLang, 'Face Width', 'Diş Genişliği')}</td>
                                                    <td className="py-2 px-3 text-slate-400">b</td>
                                                    <td className="py-2 px-3 font-bold text-cyan-300">{faceWidth}</td>
                                                    <td className="py-2 px-3 font-bold text-purple-300">{faceWidth}</td>
                                                    <td className="py-2 px-3 text-slate-400">mm</td>
                                                    <td className="py-2 px-3 text-slate-500">ISO 6336</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ═══ TAB 3: STRENGTH (ISO 6336) ═══ */}
                        {pairViewTab === 'STRENGTH' && (
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4 max-w-5xl mx-auto w-full">
                                <div className="p-4 rounded-2xl bg-[var(--bg-1)] border border-[var(--line)] space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-mono font-bold text-white uppercase flex items-center gap-2">
                                            <ShieldCheck size={14} className="text-emerald-400" />
                                            {t12(currentLang, 'ISO 6336:2019 Gear Strength & Durability Rating', 'ISO 6336:2019 Dişli Mukavemet ve Ömür Analizi')}
                                        </span>
                                        <span className="text-[10px] font-mono text-emerald-400">
                                            {t12(currentLang, `Material: ${materialName}`, `Malzeme: ${materialName}`)}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Tooth Root Bending Analysis */}
                                        <div className="p-3.5 rounded-xl bg-[var(--bg-2)] border border-white/5 space-y-2">
                                            <div className="flex items-center justify-between text-xs font-mono font-bold text-cyan-300 border-b border-white/5 pb-2">
                                                <span>{t12(currentLang, 'Tooth Root Bending (ISO 6336-3)', 'Diş Dibi Eğilme Mukavemeti (ISO 6336-3)')}</span>
                                                <span className={`px-2 py-0.5 rounded text-[10px] ${results.SF_bending >= 1.4 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
                                                    SF,b = {formatEngineeringValue(results.SF_bending, precision, false)}
                                                </span>
                                            </div>
                                            <div className="space-y-1.5 text-xs font-mono">
                                                <div className="flex justify-between text-slate-300">
                                                    <span>{t12(currentLang, 'Root Stress σF:', 'Diş Dibi Gerilmesi σF:')}</span>
                                                    <span className="font-bold text-white">{formatEngineeringValue(results.estBendingStress, precision, false)} MPa</span>
                                                </div>
                                                <div className="flex justify-between text-slate-400 text-[11px]">
                                                    <span>{t12(currentLang, 'Allowable Bending σFP:', 'İzin Verilen Eğilme σFP:')}</span>
                                                    <span>{formatEngineeringValue((results.estBendingStress * results.SF_bending), precision, false)} MPa</span>
                                                </div>
                                                <div className="flex justify-between text-slate-400 text-[11px]">
                                                    <span>{t12(currentLang, 'Form Factor YF · Stress Correction YS:', 'Form Faktörü YF · Gerilme Düzeltme YS:')}</span>
                                                    <span>ISO 6336 Tab. 1</span>
                                                </div>
                                                <div className="flex justify-between text-slate-400 text-[11px]">
                                                    <span>{t12(currentLang, 'Safety Threshold:', 'Emniyet Eşiği:')}</span>
                                                    <span className="text-emerald-400 font-bold">≥ 1.40 (PASS)</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Flank Contact Surface Durability */}
                                        <div className="p-3.5 rounded-xl bg-[var(--bg-2)] border border-white/5 space-y-2">
                                            <div className="flex items-center justify-between text-xs font-mono font-bold text-purple-300 border-b border-white/5 pb-2">
                                                <span>{t12(currentLang, 'Flank Surface Durability (ISO 6336-2)', 'Yanak Yüzey Ezilmesi / Pitting (ISO 6336-2)')}</span>
                                                <span className={`px-2 py-0.5 rounded text-[10px] ${results.SF_contact >= 1.2 ? 'bg-emerald-500/20 text-emerald-300' : results.SF_contact >= 1.0 ? 'bg-amber-500/20 text-amber-300' : 'bg-rose-500/20 text-rose-300'}`}>
                                                    SH = {formatEngineeringValue(results.SF_contact, precision, false)}
                                                </span>
                                            </div>
                                            <div className="space-y-1.5 text-xs font-mono">
                                                <div className="flex justify-between text-slate-300">
                                                    <span>{t12(currentLang, 'Contact Stress σH:', 'Temas Gerilmesi σH:')}</span>
                                                    <span className="font-bold text-white">{formatEngineeringValue(results.estContactStress, precision, false)} MPa</span>
                                                </div>
                                                <div className="flex justify-between text-slate-400 text-[11px]">
                                                    <span>{t12(currentLang, 'Allowable Contact σHP:', 'İzin Verilen Hertzian σHP:')}</span>
                                                    <span>{formatEngineeringValue((results.estContactStress * results.SF_contact), precision, false)} MPa</span>
                                                </div>
                                                <div className="flex justify-between text-slate-400 text-[11px]">
                                                    <span>{t12(currentLang, 'Zone Factor ZH · Elasticity ZE:', 'Bölge Faktörü ZH · Elastisite ZE:')}</span>
                                                    <span>ISO 6336 Part 2</span>
                                                </div>
                                                <div className="flex justify-between text-slate-400 text-[11px]">
                                                    <span>{t12(currentLang, 'Safety Threshold:', 'Emniyet Eşiği:')}</span>
                                                    <span className="text-cyan-300 font-bold">≥ 1.20 ({t12(currentLang, 'Target Met', 'Hedef Sağlandı')})</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ═══ TAB 4: MANUFACTURING ═══ */}
                        {pairViewTab === 'MANUFACTURING' && (
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4 max-w-5xl mx-auto w-full">
                                <GearManufacturingDataTable
                                    results={results}
                                    gearModule={gearModule}
                                    z1={z1}
                                    z2={z2}
                                    pressureAngle={pressureAngle}
                                    helixAngle={helixAngle}
                                    x1={x1}
                                    x2={x2}
                                    selectedDim={selectedDim}
                                    onSelectDim={setSelectedDim}
                                    currentLang={currentLang}
                                    meshType={meshType}
                                    materialName={materialName}
                                />
                            </div>
                        )}

                        {/* ═══ TAB 5: CAD ═══ */}
                        {pairViewTab === 'CAD' && (
                            <div className="flex-1 relative flex flex-col h-full bg-[var(--bg-0)] overflow-hidden min-h-0">
                                {/* Undercut Alert */}
                                {results.undercut && (
                                    <div className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-lg border border-amber-500/40 bg-amber-500/10 text-[10px] font-mono text-amber-300">
                                        {s.alertTitle ? `${s.alertTitle} · z₁ < ${results.zMinUndercut}` : `Undercut risk · z₁ < ${results.zMinUndercut}`}
                                    </div>
                                )}

                                {/* Internal Gear Tooth Interference Warning Badge */}
                                {results.internalWarning?.type === 'interference' && (
                                    <div className="absolute top-3 right-3 z-20 px-3 py-1.5 rounded-xl border border-amber-500/50 bg-amber-500/15 text-amber-300 text-[10px] font-mono font-bold flex items-center gap-1.5 ">
                                        <ShieldAlert size={14} className="text-amber-400" />
                                        <span>{t12(currentLang, `TIP INTERFERENCE (DIN 3960: Δz = ${results.deltaZ} < 8)`, `DİŞ TEPE GİRİŞİMİ (DIN 3960: Δz = ${results.deltaZ} < 8)`)}</span>
                                    </div>
                                )}

                                <div className="flex-none px-3 py-2 border-b border-white/5 flex items-center justify-between gap-2 z-20 bg-[var(--bg-0)]/90">
                                    <div className="text-[10px] font-mono font-bold text-[var(--cyan)] uppercase tracking-wider flex items-center gap-2">
                                        <Cog size={13} className="animate-spin-slow shrink-0" /> 
                                        <span className="truncate">{meshType === 'internal' ? (t12(currentLang, 'INTERNAL RING GEAR MESH BLUEPRINT', 'İÇ DİŞLİ VE PİNYON KAVRAMA ŞEMASI')) : s.dynamicBlueprint}</span>
                                    </div>

                                    {/* 1:1 Production CAM Export Action Buttons */}
                                    <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                                        <button
                                            type="button"
                                            onClick={handleExportTo3DAssembly}
                                            className="px-2 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 text-[10px] font-mono font-bold flex items-center gap-1 shadow-sm transition-all cursor-pointer"
                                            title={s.export3DTooltip}
                                        >
                                            <Box size={11} />
                                            <span>3D CAD</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleExportTo2DCad}
                                            className="px-2 py-1 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/40 text-sky-300 text-[10px] font-mono font-bold flex items-center gap-1 shadow-sm transition-all cursor-pointer"
                                            title={t12(currentLang, "Export 1:1 to 2D Drafting (AluCAD)", "1:1 Ölçekli 2D Teknik Çizim Modülüne (AluCAD) Aktar")}
                                        >
                                            <Layers size={11} />
                                            <span>2D CAD</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleDownload1to1Svg('pinion')}
                                            className="px-2 py-1 rounded-lg bg-[var(--cyan)]/15 hover:bg-[var(--cyan)]/25 border border-[var(--cyan)]/40 text-[var(--cyan)] text-[10px] font-mono font-bold flex items-center gap-1 shadow-sm transition-all cursor-pointer"
                                            title={t12(currentLang, "Download 1:1 Scale Pinion SVG for Laser/CNC Cutting", "Lazer / CNC için 1:1 Ölçekli Pinyon Dişli SVG İndir")}
                                        >
                                            <Download size={11} />
                                            <span>1:1 SVG (z₁={z1})</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleDownload1to1Svg('gear')}
                                            className="px-2 py-1 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-300 text-[10px] font-mono font-bold flex items-center gap-1 shadow-sm transition-all cursor-pointer"
                                            title={t12(currentLang, "Download 1:1 Scale Gear SVG for Laser/CNC Cutting", "Lazer / CNC için 1:1 Ölçekli Çark Dişli SVG İndir")}
                                        >
                                            <Download size={11} />
                                            <span>1:1 SVG (z₂={z2})</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleDownload1to1Dxf('pinion')}
                                            className="px-2 py-1 rounded-lg bg-black/60 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white text-[10px] font-mono font-bold flex items-center gap-1 transition-all cursor-pointer"
                                            title={t12(currentLang, "AutoCAD R12/R14 DXF — pinion", "AutoCAD DXF İndir — pinyon")}
                                        >
                                            <span>DXF</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleDownload1to1Dxf('gear')}
                                            className="px-2 py-1 rounded-lg bg-black/60 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white text-[10px] font-mono font-bold flex items-center gap-1 transition-all cursor-pointer"
                                            title={t12(currentLang, "AutoCAD R12/R14 DXF — driven gear", "AutoCAD DXF İndir — çark")}
                                        >
                                            <span>DXF 2</span>
                                        </button>
                                    </div>
                                </div>

                                <div className="flex-1 w-full h-full min-h-[380px] relative">
                                    <GearSVG2D 
                                        z1={z1} 
                                        z2={z2} 
                                        m={gearModule}
                                        mt={results.mt}
                                        beta={helixAngle}
                                        pressureAngle={pressureAngle}
                                        a={results.a} 
                                        rpm={results.motorSpeed || 1500} 
                                        isInternal={meshType === 'internal'} 
                                        isPrint={false}
                                        x1={x1}
                                        x2={x2}
                                        faceWidth={faceWidth}
                                        selectedDim={selectedDim}
                                        onSelectDim={setSelectedDim}
                                        results={results}
                                        currentLang={currentLang}
                                    />
                                </div>
                            </div>
                        )}

                        {/* ═══ TAB 6: AUDIT ═══ */}
                        {pairViewTab === 'AUDIT' && (
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4 max-w-5xl mx-auto w-full">
                                <div className="p-4 rounded-2xl bg-[var(--bg-1)] border border-[var(--line)] space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-mono font-bold text-white uppercase flex items-center gap-2">
                                            <BookOpen size={14} className="text-cyan-400" />
                                            {t12(currentLang, 'Normative Standards & Calculation Traceability', 'Resmi Standartlar ve Hesaplama İzlenebilirliği')}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => setIsStandardsModalOpen(true)}
                                            className="px-3 py-1 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/40 text-xs font-mono font-bold flex items-center gap-1 cursor-pointer"
                                        >
                                            <BookOpen size={12} />
                                            <span>{t12(currentLang, 'Open Full Citations & Benchmark Modal', 'Tam Kaynakça ve Doğrulama Penceresi')}</span>
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
                                        <div className="p-3 rounded-xl bg-[var(--bg-2)] border border-white/5 space-y-1.5">
                                            <span className="font-bold text-cyan-300 block">ISO 6336:2019 Parts 1, 2, 3</span>
                                            <p className="text-[11px] text-slate-400">
                                                {t12(currentLang, 'Calculation of load capacity of spur and helical gears. Governs tooth root stress, contact Hertzian stress, dynamic factor Kv, and face load distribution.', 'Düz ve helis alın dişlilerinin yük taşıma kapasitesi hesabı. Diş dibi gerilmesini, temas basıncını, dinamik faktörü ve yük dağılımını belirler.')}
                                            </p>
                                        </div>
                                        <div className="p-3 rounded-xl bg-[var(--bg-2)] border border-white/5 space-y-1.5">
                                            <span className="font-bold text-emerald-300 block">DIN 3960 / DIN 3967</span>
                                            <p className="text-[11px] text-slate-400">
                                                {t12(currentLang, 'Definitions and parameters for cylindrical involute gears and gear pairs. Defines operating pressure angle αwt, center distance aw, and tip shortening k.', 'Silindirik evolvent dişliler ve dişli çiftleri için tanımlar ve parametreler. Çalışma kavrama açısı, eksen mesafesi ve kafa kısaltmayı belirler.')}
                                            </p>
                                        </div>
                                        <div className="p-3 rounded-xl bg-[var(--bg-2)] border border-white/5 space-y-1.5">
                                            <span className="font-bold text-purple-300 block">ISO 21771 / ISO 53</span>
                                            <p className="text-[11px] text-slate-400">
                                                {t12(currentLang, 'Standard reference rack profile with 20° normal pressure angle, 1.0 addendum coefficient and 1.25 dedendum coefficient.', '20° normal kavrama açısı, 1.0 diş başı ve 1.25 diş dibi katsayısına sahip temel kremayer profili.')}
                                            </p>
                                        </div>
                                        <div className="p-3 rounded-xl bg-[var(--bg-2)] border border-white/5 space-y-1.5">
                                            <span className="font-bold text-amber-300 block">ISO 1328-1 / JIS B 1702</span>
                                            <p className="text-[11px] text-slate-400">
                                                {t12(currentLang, 'Cylindrical gears — ISO system of flank tolerance classification and precision manufacturing grades (Grade 6 default).', 'Silindirik dişliler — Yanak tolerans sınıflandırma sistemi ve imalat hassasiyet sınıfları (Varsayılan Kalite 6).')}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="p-3 rounded-xl bg-[var(--bg-1)] border border-white/5 text-[11px] font-mono text-slate-400 space-y-1">
                                        <span className="font-bold text-white uppercase text-[10px] block">{t12(currentLang, 'Governing Assumptions Ledger:', 'Bağlayıcı Hesaplama Kabulleri:')}</span>
                                        <div>· {t12(currentLang, 'Steady-state nominal load with ISO application factor KA based on operating class.', 'Çalışma sınıfına dayalı ISO işletme faktörü KA ile sürekli rejim nominal yükü.')}</div>
                                        <div>· {t12(currentLang, 'Hertzian surface contact evaluated under elastohydrodynamic lubrication assumption.', 'Elastohidrodinamik yağlama kabulu altında Hertzian yüzey temas hesabı.')}</div>
                                        <div>· {t12(currentLang, 'Deterministic 64-bit IEEE 754 floating-point evaluation without heuristic bias.', 'Sezgisel sapma içermeyen deterministik 64-bit IEEE 754 kayan nokta hesabı.')}</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ═══ TAB 7: WORKSTATION (SPLIT DESK MODE FOR DUAL/WIDE MONITORS) ═══ */}
                        {pairViewTab === 'WORKSTATION' && (
                            <div className="flex-1 flex flex-col lg:flex-row h-full overflow-y-auto lg:overflow-hidden min-h-0">
                                {/* CENTER: VISUALIZATION BLUEPRINT */}
                                <div className="flex-1 relative flex flex-col min-h-[420px] lg:min-h-0 bg-[var(--bg-0)] overflow-hidden border-b lg:border-b-0 lg:border-r border-white/5">
                                    {/* Undercut Alert */}
                                    {results.undercut && (
                                        <div className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-lg border border-amber-500/40 bg-amber-500/10 text-[10px] font-mono text-amber-300">
                                            {s.alertTitle ? `${s.alertTitle} · z₁ < ${results.zMinUndercut}` : `Undercut risk · z₁ < ${results.zMinUndercut}`}
                                        </div>
                                    )}

                                    {/* Internal Gear Tooth Interference Warning Badge */}
                                    {results.internalWarning?.type === 'interference' && (
                                        <div className="absolute top-3 right-3 z-20 px-3 py-1.5 rounded-xl border border-amber-500/50 bg-amber-500/15 text-amber-300 text-[10px] font-mono font-bold flex items-center gap-1.5 ">
                                            <ShieldAlert size={14} className="text-amber-400" />
                                            <span>{t12(currentLang, `TIP INTERFERENCE (DIN 3960: Δz = ${results.deltaZ} < 8)`, `DİŞ TEPE GİRİŞİMİ (DIN 3960: Δz = ${results.deltaZ} < 8)`)}</span>
                                        </div>
                                    )}

                                    <div className="flex-none px-3 py-2 border-b border-white/5 flex items-center justify-between gap-2 z-20 bg-[var(--bg-0)]/90">
                                        <div className="text-[10px] font-mono font-bold text-[var(--cyan)] uppercase tracking-wider flex items-center gap-2">
                                            <Cog size={13} className="animate-spin-slow shrink-0" /> 
                                            <span className="truncate">{meshType === 'internal' ? (t12(currentLang, 'INTERNAL RING GEAR MESH BLUEPRINT', 'İÇ DİŞLİ VE PİNYON KAVRAMA ŞEMASI')) : s.dynamicBlueprint}</span>
                                        </div>

                                        {/* CAM Export Buttons */}
                                        <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                                            <button
                                                type="button"
                                                onClick={handleExportTo3DAssembly}
                                                className="px-2 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 text-[10px] font-mono font-bold flex items-center gap-1 shadow-sm transition-all cursor-pointer"
                                                title={s.export3DTooltip}
                                            >
                                                <Box size={11} />
                                                <span>3D CAD</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleExportTo2DCad}
                                                className="px-2 py-1 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/40 text-sky-300 text-[10px] font-mono font-bold flex items-center gap-1 shadow-sm transition-all cursor-pointer"
                                                title={t12(currentLang, "Export 1:1 to 2D Drafting (AluCAD)", "1:1 Ölçekli 2D Teknik Çizim Modülüne (AluCAD) Aktar")}
                                            >
                                                <Layers size={11} />
                                                <span>2D CAD</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDownload1to1Svg('pinion')}
                                                className="px-2 py-1 rounded-lg bg-[var(--cyan)]/15 hover:bg-[var(--cyan)]/25 border border-[var(--cyan)]/40 text-[var(--cyan)] text-[10px] font-mono font-bold flex items-center gap-1 shadow-sm transition-all cursor-pointer"
                                                title={t12(currentLang, "Download 1:1 Scale Pinion SVG for Laser/CNC Cutting", "Lazer / CNC için 1:1 Ölçekli Pinyon Dişli SVG İndir")}
                                            >
                                                <Download size={11} />
                                                <span>1:1 SVG</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDownload1to1Dxf('pinion')}
                                                className="px-2 py-1 rounded-lg bg-black/60 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white text-[10px] font-mono font-bold flex items-center gap-1 transition-all cursor-pointer"
                                                title={t12(currentLang, "AutoCAD R12/R14 DXF — pinion", "AutoCAD DXF İndir — pinyon")}
                                            >
                                                <span>DXF</span>
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex-1 w-full h-full min-h-[360px] relative">
                                        <GearSVG2D 
                                            z1={z1} 
                                            z2={z2} 
                                            m={gearModule}
                                            mt={results.mt}
                                            beta={helixAngle}
                                            pressureAngle={pressureAngle}
                                            a={results.a} 
                                            rpm={results.motorSpeed || 1500} 
                                            isInternal={meshType === 'internal'} 
                                            isPrint={false}
                                            x1={x1}
                                            x2={x2}
                                            faceWidth={faceWidth}
                                            selectedDim={selectedDim}
                                            onSelectDim={setSelectedDim}
                                            results={results}
                                            currentLang={currentLang}
                                        />
                                    </div>
                                </div>

                                {/* RIGHT: OUTPUTS & TELEMETRY */}
                                <div className="w-full lg:w-[410px] xl:w-[450px] 2xl:w-[480px] shrink-0 flex flex-col h-auto lg:h-full bg-[var(--bg-1)]/90 overflow-y-auto custom-scrollbar p-3 space-y-3">
                                    {/* Safety Factor & Kinematic HUD */}
                                    <div className="p-3.5 rounded-xl border border-[var(--line)] bg-[var(--bg-1)]">
                                        <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center justify-between">
                                            <div className="flex items-center gap-1.5">
                                                <span className={`w-2 h-2 rounded-full ${isSafe ? 'bg-[var(--ok)]' : 'bg-[var(--bad)]'} animate-pulse`} />
                                                <span>{isSafe ? s.designSafe : s.designWarning}</span>
                                            </div>
                                            <span className="text-[var(--cyan)] text-[9px] font-bold">ISO 6336 Method B Screening</span>
                                        </div>
                                        <div className="flex items-baseline justify-around gap-4 pb-1">
                                            <div className="flex flex-col items-center">
                                                <div className="flex items-baseline gap-1">
                                                    <span className={`text-3xl sm:text-4xl font-mono font-black ${results.SF_bending >= 1.4 ? 'text-[var(--ok)]' : results.SF_bending >= 1.0 ? 'text-[var(--warn)]' : 'text-[var(--bad)]'}`}>
                                                        {formatEngineeringValue(results.SF_bending, precision, false)}
                                                    </span>
                                                    <span className="text-[10px] font-mono text-slate-400">SF,b</span>
                                                </div>
                                                <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider mt-0.5">{s.bendingSafety} (≥1.4)</span>
                                            </div>
                                            <div className="text-xl text-slate-700 font-thin self-center">/</div>
                                            <div className="flex flex-col items-center">
                                                <div className="flex items-baseline gap-1">
                                                    <span className={`text-3xl sm:text-4xl font-mono font-black ${results.SF_contact >= 1.2 ? 'text-[var(--cyan)]' : results.SF_contact >= 1.0 ? 'text-[var(--warn)]' : 'text-[var(--bad)]'}`}>
                                                        {formatEngineeringValue(results.SF_contact, precision, false)}
                                                    </span>
                                                    <span className="text-[10px] font-mono text-slate-400">SH</span>
                                                </div>
                                                <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider mt-0.5">{s.contactSafety} (≥1.20)</span>
                                            </div>
                                        </div>
                                        <div className="mt-2.5 pt-2.5 border-t border-white/5 flex items-center justify-between text-[10px] font-mono">
                                            <span className="text-slate-400 uppercase tracking-wider">
                                                {t12(currentLang, 'Governing Bottleneck:', 'Sınırlandırıcı Kritik Faktör:')}
                                            </span>
                                            <span className={`px-2 py-0.5 rounded font-bold border ${
                                                results.isoCritical?.includes('Pitting')
                                                    ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300'
                                                    : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                                            }`}>
                                                {results.isoCritical?.includes('Pitting')
                                                    ? t12(currentLang, 'Surface Pitting (SH Contact)', 'Yüzey Ezilmesi / Çukurlaşma (SH Temas)')
                                                    : t12(currentLang, 'Tooth Bending Fatigue (SF,b)', 'Diş Dibi Kırılması / Yorulma (SF,b)')}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Quick Stats Telemetry Cluster */}
                                    <div className="grid grid-cols-2 gap-1.5 font-mono text-[10px]">
                                        <div className="px-2.5 py-1.5 rounded-lg bg-[var(--bg-2)] border border-[var(--line)]">
                                            <span className="text-slate-400 block text-[8.5px] uppercase">{s.ratio || "Ratio"}</span>
                                            <span className="text-[var(--cyan)] font-bold text-[11px]">{formatEngineeringValue(results.ratio, precision, true)}:1</span>
                                        </div>
                                        <div className="px-2.5 py-1.5 rounded-lg bg-[var(--bg-2)] border border-[var(--line)]">
                                            <span className="text-slate-400 block text-[8.5px] uppercase">{s.centerDist || "Center Dist"} (aw)</span>
                                            <span className="text-[var(--ok)] font-bold text-[11px]">{formatEngineeringValue(results.a, precision, true)} mm</span>
                                        </div>
                                        <div className="px-2.5 py-1.5 rounded-lg bg-[var(--bg-2)] border border-[var(--line)]">
                                            <span className="text-slate-400 block text-[8.5px] uppercase">{t12(currentLang, "Op. Angle (αwt)", "Kavrama (αwt)")}</span>
                                            <span className="text-[#c084fc] font-bold text-[11px]">{formatEngineeringValue(results.alpha_wt_deg, precision, true)}°</span>
                                        </div>
                                        <div className="px-2.5 py-1.5 rounded-lg bg-[var(--bg-2)] border border-[var(--line)]">
                                            <span className="text-slate-400 block text-[8.5px] uppercase">{s.pitchVelocity || "v"}</span>
                                            <span className="text-[var(--warn)] font-bold text-[11px]">{formatEngineeringValue(results.pitchVelocity, precision, true)} m/s</span>
                                        </div>
                                        <div className="px-2.5 py-1.5 rounded-lg bg-[var(--bg-2)] border border-[var(--line)]">
                                            <span className="text-slate-400 block text-[8.5px] uppercase">{s.contactRatio || "εα"}</span>
                                            <span className={`font-bold text-[11px] ${results.epsilonAlpha >= 1.2 ? 'text-[var(--ok)]' : 'text-[var(--bad)]'}`}>{formatEngineeringValue(results.epsilonAlpha, precision, true)}</span>
                                        </div>
                                        <div className="px-2.5 py-1.5 rounded-lg bg-[var(--bg-2)] border border-[var(--line)]">
                                            <span className="text-slate-400 block text-[8.5px] uppercase">{s.circPitch || "Circ. Pitch"}</span>
                                            <span className="text-slate-200 font-bold text-[11px]">{formatEngineeringValue((Math.PI * gearModule), precision, true)} mm</span>
                                        </div>
                                    </div>

                                    {/* Consolidated Precision Manufacturing Dimensions HUD Table */}
                                    <div className="flex-1 min-h-0">
                                        <GearManufacturingDataTable
                                            results={results}
                                            gearModule={gearModule}
                                            z1={z1}
                                            z2={z2}
                                            pressureAngle={pressureAngle}
                                            helixAngle={helixAngle}
                                            x1={x1}
                                            x2={x2}
                                            selectedDim={selectedDim}
                                            onSelectDim={setSelectedDim}
                                            currentLang={currentLang}
                                            meshType={meshType}
                                            materialName={materialName}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* HIDDEN PRINT CONTAINER (A4 Landscape PDF Export) */}
            <div ref={printRef} style={{ display: 'none', width: '297mm', minHeight: '210mm', backgroundColor: 'white', padding: '12mm', color: 'var(--bg-0)', fontFamily: 'Arial, sans-serif' }}>
                <div style={{ border: '2px solid #000', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', padding: '8mm', boxSizing: 'border-box' }}>
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #000', paddingBottom: '8px', marginBottom: '12px' }}>
                        <div>
                            <h1 style={{ fontSize: '18pt', fontWeight: 900, margin: 0, textTransform: 'uppercase', color: '#0284c7' }}>
                                ALUCAD OS · {workflowMode === 'train' ? (t12(currentLang, 'MULTI-GEAR TRAIN KINEMATIC & STRENGTH REPORT', 'ÇOKLU DİŞLİ TRENİ İMALAT & MUKAVEMET RAPORU')) : (t12(currentLang, 'GEAR PAIR MANUFACTURING PASSPORT', 'DİŞLİ ÇİFTİ İMALAT PASAPORTU'))}
                            </h1>
                            <h2 style={{ fontSize: '11pt', margin: '4px 0 0', color: '#444' }}>
                                {workflowMode === 'train'
                                    ? (t12(currentLang, `Stages: ${trainResults.gears.length} Gears | Total Ratio i=${formatEngineeringValue(trainResults.totalRatio, precision, false)}:1 | Motor Power: ${selectedPower} kW`, `Kademe Sayısı: ${trainResults.gears.length} Dişli | Toplam Çevrim i=${formatEngineeringValue(trainResults.totalRatio, precision, false)}:1 | Motor Gücü: ${selectedPower} kW`))
                                    : (t12(currentLang, `Gear Pair (${meshType === 'internal' ? 'Internal Ring' : 'External'}): m=${gearModule} mm | z₁=${z1} | z₂=${z2} | a=${formatEngineeringValue(results.a, precision, false)} mm`, `Dişli Çifti (${meshType === 'internal' ? 'İç Çember Ring' : 'Dış Dişli'}): m=${gearModule} mm | z₁=${z1} | z₂=${z2} | a=${formatEngineeringValue(results.a, precision, false)} mm`))
                                }
                            </h2>
                        </div>
                        <div style={{ textAlign: 'right', fontSize: '9pt', color: 'var(--muted)' }}>
                            <div><strong>{t12(currentLang, 'Standard:', 'Standart:')}</strong> ISO 6336:2019 / DIN 3960</div>
                            <div><strong>{t12(currentLang, 'Date:', 'Tarih:')}</strong> {new Date().toLocaleDateString(t12(currentLang, 'en-US', 'tr-TR'))}</div>
                        </div>
                    </div>

                    {/* KPI / System Summary Grid */}
                    {workflowMode === 'train' ? (
                        <div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', marginBottom: '12px', background: '#f8fafc', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '4px' }}>
                                <div><span style={{ fontSize: '8pt', color: 'var(--muted)', display: 'block' }}>{t12(currentLang, 'INPUT SPEED / TORQUE', 'GİRİŞ DEVİR / TORK')}</span><strong style={{ fontSize: '11pt' }}>{trainResults.inputRpm} RPM / {trainResults.inputTorqueNm} Nm</strong></div>
                                <div><span style={{ fontSize: '8pt', color: 'var(--muted)', display: 'block' }}>{t12(currentLang, 'OUTPUT SPEED / TORQUE', 'ÇIKIŞ DEVİR / TORK')}</span><strong style={{ fontSize: '11pt', color: '#0284c7' }}>{trainResults.outputRpm.toFixed(1)} RPM / {trainResults.outputTorqueNm.toFixed(1)} Nm</strong></div>
                                <div><span style={{ fontSize: '8pt', color: 'var(--muted)', display: 'block' }}>{t12(currentLang, 'TOTAL RATIO (i)', 'TOPLAM ORAN (i)')}</span><strong style={{ fontSize: '11pt' }}>{trainResults.totalRatio.toFixed(2)}:1</strong></div>
                                <div><span style={{ fontSize: '8pt', color: 'var(--muted)', display: 'block' }}>{t12(currentLang, 'SYSTEM EFFICIENCY', 'SİSTEM VERİMİ')}</span><strong style={{ fontSize: '11pt', color: 'var(--ok)' }}>%{(trainResults.overallEfficiency * 100).toFixed(1)}</strong></div>
                                <div><span style={{ fontSize: '8pt', color: 'var(--muted)', display: 'block' }}>{t12(currentLang, 'SHAFTS COUNT', 'MİL SAYISI')}</span><strong style={{ fontSize: '11pt' }}>{trainResults.shafts.length} {t12(currentLang, 'Shafts', 'Mil')}</strong></div>
                            </div>

                            {/* Multi-Gear Dimension & Strength Table */}
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '7.5pt', marginBottom: '12px' }}>
                                <thead>
                                    <tr style={{ background: 'var(--bg-2)', color: 'var(--ink)' }}>
                                        <th style={{ padding: '4px 6px', textAlign: 'left', border: '1px solid #334155' }}>{t12(currentLang, 'Gear Name', 'Dişli Adı')}</th>
                                        <th style={{ padding: '4px', textAlign: 'center', border: '1px solid #334155' }}>{t12(currentLang, 'Shaft', 'Mil')}</th>
                                        <th style={{ padding: '4px', textAlign: 'center', border: '1px solid #334155' }}>z</th>
                                        <th style={{ padding: '4px', textAlign: 'center', border: '1px solid #334155' }}>m (mm)</th>
                                        <th style={{ padding: '4px', textAlign: 'center', border: '1px solid #334155' }}>b (mm)</th>
                                        <th style={{ padding: '4px', textAlign: 'center', border: '1px solid #334155' }}>RPM</th>
                                        <th style={{ padding: '4px', textAlign: 'center', border: '1px solid #334155' }}>{t12(currentLang, 'Torque (Nm)', 'Tork (Nm)')}</th>
                                        <th style={{ padding: '4px', textAlign: 'center', border: '1px solid #334155' }}>d (mm)</th>
                                        <th style={{ padding: '4px', textAlign: 'center', border: '1px solid #334155' }}>da (mm)</th>
                                        <th style={{ padding: '4px', textAlign: 'center', border: '1px solid #334155' }}>df (mm)</th>
                                        <th style={{ padding: '4px', textAlign: 'center', border: '1px solid #334155' }}>Wk (mm)</th>
                                        <th style={{ padding: '4px', textAlign: 'center', border: '1px solid #334155' }}>Md (mm)</th>
                                        <th style={{ padding: '4px', textAlign: 'center', border: '1px solid #334155' }}>Ft (N)</th>
                                        <th style={{ padding: '4px', textAlign: 'center', border: '1px solid #334155' }}>{t12(currentLang, 'SF (Bending)', 'SF (Eğilme)')}</th>
                                        <th style={{ padding: '4px', textAlign: 'center', border: '1px solid #334155' }}>{t12(currentLang, 'SH (Contact)', 'SH (Ezilme)')}</th>
                                        <th style={{ padding: '4px', textAlign: 'left', border: '1px solid #334155' }}>{t12(currentLang, 'Material', 'Malzeme')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {trainResults.gears.map((g, idx) => (
                                        <tr key={'print-g-' + idx} style={{ background: idx % 2 === 0 ? '#fff' : '#f8fafc' }}>
                                            <td style={{ padding: '3px 6px', border: '1px solid #cbd5e1', fontWeight: 'bold' }}>{g.name}</td>
                                            <td style={{ padding: '3px', textAlign: 'center', border: '1px solid #cbd5e1' }}>{g.shaftId}</td>
                                            <td style={{ padding: '3px', textAlign: 'center', border: '1px solid #cbd5e1', fontWeight: 'bold' }}>{g.teeth}</td>
                                            <td style={{ padding: '3px', textAlign: 'center', border: '1px solid #cbd5e1' }}>{g.module}</td>
                                            <td style={{ padding: '3px', textAlign: 'center', border: '1px solid #cbd5e1' }}>{g.faceWidth}</td>
                                            <td style={{ padding: '3px', textAlign: 'center', border: '1px solid #cbd5e1' }}>{g.rpm.toFixed(0)}</td>
                                            <td style={{ padding: '3px', textAlign: 'center', border: '1px solid #cbd5e1', fontWeight: 'bold' }}>{g.torque.toFixed(1)}</td>
                                            <td style={{ padding: '3px', textAlign: 'center', border: '1px solid #cbd5e1' }}>{g.d.toFixed(2)}</td>
                                            <td style={{ padding: '3px', textAlign: 'center', border: '1px solid #cbd5e1' }}>{g.da.toFixed(2)}</td>
                                            <td style={{ padding: '3px', textAlign: 'center', border: '1px solid #cbd5e1' }}>{g.df.toFixed(2)}</td>
                                            <td style={{ padding: '3px', textAlign: 'center', border: '1px solid #cbd5e1' }}>{(g.wildhaberW || 0).toFixed(2)}</td>
                                            <td style={{ padding: '3px', textAlign: 'center', border: '1px solid #cbd5e1' }}>{(g.dimensionOverPins || 0).toFixed(2)}</td>
                                            <td style={{ padding: '3px', textAlign: 'center', border: '1px solid #cbd5e1' }}>{g.Ft || 0}</td>
                                            <td style={{ padding: '3px', textAlign: 'center', border: '1px solid #cbd5e1', fontWeight: 'bold', color: (g.SF_bending || 0) >= 1.4 ? '#16a34a' : '#dc2626' }}>{(g.SF_bending || 0).toFixed(2)}</td>
                                            <td style={{ padding: '3px', textAlign: 'center', border: '1px solid #cbd5e1', fontWeight: 'bold', color: (g.SF_contact || 0) >= 1.2 ? '#16a34a' : (g.SF_contact || 0) >= 1.0 ? '#d97706' : '#dc2626' }}>{(g.SF_contact || 0).toFixed(2)}</td>
                                            <td style={{ padding: '3px 6px', border: '1px solid #cbd5e1' }}>{g.material}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9pt', marginBottom: '12px' }}>
                                <thead>
                                    <tr style={{ background: 'var(--bg-2)', color: 'var(--ink)' }}>
                                        <th style={{ padding: '6px', textAlign: 'left', border: '1px solid #334155' }}>{t12(currentLang, 'Parameter', 'Parametre')}</th>
                                        <th style={{ padding: '6px', textAlign: 'center', border: '1px solid #334155' }}>{t12(currentLang, 'Pinion', 'Pinyon')} (z₁={z1})</th>
                                        <th style={{ padding: '6px', textAlign: 'center', border: '1px solid #334155' }}>{meshType === 'internal' ? (t12(currentLang, 'Internal Ring', 'İç Dişli')) : (t12(currentLang, 'Gear', 'Çark'))} (z₂={z2})</th>
                                    </tr>
                                </thead>
                                <tbody>
                                     <tr><td style={{ padding: '5px', border: '1px solid #cbd5e1' }}>{t12(currentLang, 'Pitch Diameter (d)', 'Bölüm Çapı (d)')}</td><td style={{ padding: '5px', textAlign: 'center', border: '1px solid #cbd5e1' }}>{results.d1.toFixed(5)} mm</td><td style={{ padding: '5px', textAlign: 'center', border: '1px solid #cbd5e1' }}>{results.d2.toFixed(5)} mm</td></tr>
                                     <tr><td style={{ padding: '5px', border: '1px solid #cbd5e1', fontWeight: 'bold' }}>{t12(currentLang, 'Working Pitch Dia (dw / rw)', 'Yuvarlanma Çapı (dw / rw)')}</td><td style={{ padding: '5px', textAlign: 'center', border: '1px solid #cbd5e1', fontWeight: 'bold' }}>{results.dw1.toFixed(5)} mm (rw={results.rw1.toFixed(5)})</td><td style={{ padding: '5px', textAlign: 'center', border: '1px solid #cbd5e1', fontWeight: 'bold' }}>{results.dw2.toFixed(5)} mm (rw={results.rw2.toFixed(5)})</td></tr>
                                     <tr><td style={{ padding: '5px', border: '1px solid #cbd5e1' }}>{t12(currentLang, 'Base Diameter (db)', 'Temel Daire Çapı (db)')}</td><td style={{ padding: '5px', textAlign: 'center', border: '1px solid #cbd5e1' }}>{results.db1.toFixed(5)} mm</td><td style={{ padding: '5px', textAlign: 'center', border: '1px solid #cbd5e1' }}>{results.db2.toFixed(5)} mm</td></tr>
                                     <tr><td style={{ padding: '5px', border: '1px solid #cbd5e1' }}>{t12(currentLang, 'Tip Diameter (da)', 'Tepe Çapı (da)')}</td><td style={{ padding: '5px', textAlign: 'center', border: '1px solid #cbd5e1' }}>{results.da1.toFixed(5)} mm</td><td style={{ padding: '5px', textAlign: 'center', border: '1px solid #cbd5e1' }}>{results.da2.toFixed(5)} mm</td></tr>
                                     <tr><td style={{ padding: '5px', border: '1px solid #cbd5e1' }}>{t12(currentLang, 'Root Diameter (df)', 'Kök Çapı (df)')}</td><td style={{ padding: '5px', textAlign: 'center', border: '1px solid #cbd5e1' }}>{results.df1.toFixed(5)} mm</td><td style={{ padding: '5px', textAlign: 'center', border: '1px solid #cbd5e1' }}>{results.df2.toFixed(5)} mm</td></tr>
                                     <tr><td style={{ padding: '5px', border: '1px solid #cbd5e1' }}>{t12(currentLang, 'Center Distance (a / aw)', 'Eksenler Arası Mesafe (a / aw)')}</td><td colSpan={2} style={{ padding: '5px', textAlign: 'center', border: '1px solid #cbd5e1', fontWeight: 'bold' }}>{results.a.toFixed(5)} mm</td></tr>
                                    <tr><td style={{ padding: '5px', border: '1px solid #cbd5e1' }}>{t12(currentLang, 'Root Stress σF (ISO 6336-3)', 'Diş Dibi σF (ISO 6336-3)')}</td><td style={{ padding: '5px', textAlign: 'center', border: '1px solid #cbd5e1' }}>{results.estBendingStress.toFixed(1)} MPa</td><td style={{ padding: '5px', textAlign: 'center', border: '1px solid #cbd5e1' }}>—</td></tr>
                                    <tr><td style={{ padding: '5px', border: '1px solid #cbd5e1' }}>{t12(currentLang, 'Contact Stress σH (ISO 6336-2)', 'Ezilme σH (ISO 6336-2)')}</td><td style={{ padding: '5px', textAlign: 'center', border: '1px solid #cbd5e1' }}>{results.estContactStress.toFixed(1)} MPa</td><td style={{ padding: '5px', textAlign: 'center', border: '1px solid #cbd5e1' }}>—</td></tr>
                                    <tr><td style={{ padding: '5px', border: '1px solid #cbd5e1' }}>{t12(currentLang, 'Bending Safety (SF)', 'Eğilme Emniyeti (SF)')}</td><td style={{ padding: '5px', textAlign: 'center', border: '1px solid #cbd5e1', fontWeight: 'bold', color: results.SF_bending >= 1.4 ? '#16a34a' : '#dc2626' }}>{results.SF_bending.toFixed(2)}</td><td style={{ padding: '5px', textAlign: 'center', border: '1px solid #cbd5e1', fontWeight: 'bold', color: (results.SF_bending_gear ?? 0) >= 1.4 ? '#16a34a' : '#dc2626' }}>{(results.SF_bending_gear ?? 0).toFixed(2)}</td></tr>
                                    <tr><td style={{ padding: '5px', border: '1px solid #cbd5e1' }}>{t12(currentLang, 'Contact Safety (SH)', 'Yüzey Ezilme Emniyeti (SH)')}</td><td colSpan={2} style={{ padding: '5px', textAlign: 'center', border: '1px solid #cbd5e1', fontWeight: 'bold', color: results.SF_contact >= 1.2 ? '#16a34a' : results.SF_contact >= 1.0 ? '#d97706' : '#dc2626' }}>{results.SF_contact.toFixed(2)}</td></tr>
                                    <tr><td style={{ padding: '5px', border: '1px solid #cbd5e1' }}>εα / εβ / εγ</td><td colSpan={2} style={{ padding: '5px', textAlign: 'center', border: '1px solid #cbd5e1' }}>{results.epsilonAlpha.toFixed(2)} / {(results.epsilonBeta ?? 0).toFixed(2)} / {(results.epsilonGamma ?? results.epsilonAlpha).toFixed(2)}</td></tr>
                                    <tr><td style={{ padding: '5px', border: '1px solid #cbd5e1' }}>Ft / Fr / Fa</td><td colSpan={2} style={{ padding: '5px', textAlign: 'center', border: '1px solid #cbd5e1' }}>{results.Ft.toFixed(0)} / {results.Fr.toFixed(0)} / {results.Fa.toFixed(0)} N</td></tr>
                                </tbody>
                            </table>
                        </div>
                    )}

                    <div style={{ marginTop: 'auto', borderTop: '1px solid #cbd5e1', paddingTop: '6px', display: 'flex', justifyContent: 'space-between', fontSize: '8pt', color: 'var(--muted)' }}>
                        <span>AluCAD OS Engineering & Drive Train Studio</span>
                        <span>{t12(currentLang, 'Page 1 / 1', 'Sayfa 1 / 1')}</span>
                    </div>
                </div>
            </div>

            {/* Gear Engineering Standards & Citations Modal */}
            <GearStandardsCitationsModal
                isOpen={isStandardsModalOpen}
                onClose={() => setIsStandardsModalOpen(false)}
                currentLang={currentLang}
            />
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
// SUB-COMPONENTS & HELPERS
// ═══════════════════════════════════════════════════════════════

function QuickStat({ label, value, color }: { label: string; value: string; color: string }) {
    return (
        <div>
            <div className="text-[9px] font-black text-gray-600 uppercase tracking-widest">{label}</div>
            <div className="text-xl font-mono font-black" style={{ color }}>{value}</div>
        </div>
    );
}

function DimRow({ 
    label, 
    v1, 
    v2, 
    highlight, 
    precision = 5,
    dimKey,
    selectedDim,
    onSelectDim,
    badge,
}: { 
    label: string; 
    v1: number | string; 
    v2: number | string; 
    highlight?: boolean; 
    precision?: number;
    dimKey?: string;
    selectedDim?: string | null;
    onSelectDim?: (key: string | null) => void;
    badge?: string;
}) {
    const isSelected = !!(dimKey && selectedDim === dimKey);
    const isClickable = !!(dimKey && onSelectDim);
    const val1 = typeof v1 === 'number' ? v1.toFixed(precision) : v1;
    const val2 = typeof v2 === 'number' ? v2.toFixed(precision) : v2;

    const handleClick = () => {
        if (!isClickable) return;
        onSelectDim(isSelected ? null : dimKey);
    };

    return (
        <div 
            onClick={handleClick}
            className={`grid grid-cols-3 text-xs font-mono transition-all duration-200 ${
                isClickable ? 'cursor-pointer select-none group' : ''
            } ${
                isSelected 
                    ? 'bg-cyan-500/20 border-y border-cyan-400/50 shadow-[inset_0_0_15px_rgba(58,208,230,0.25)]' 
                    : highlight 
                    ? 'bg-cyan-500/5 hover:bg-white/[0.04]' 
                    : 'hover:bg-white/[0.03]'
            }`}
            title={isClickable ? (isSelected ? "Vurgulamayı kapatmak için tıkla" : "SVG çiziminde parlatmak için tıkla") : undefined}
        >
            <div className={`px-5 py-2.5 flex items-center gap-1.5 ${
                isSelected ? 'text-cyan-300 font-bold' : highlight ? 'text-white font-bold' : 'text-gray-400'
            }`}>
                {isSelected ? (
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping shrink-0" />
                ) : isClickable ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-white/20 group-hover:bg-cyan-400 shrink-0 transition-colors" />
                ) : null}
                <span>{label}</span>
                {badge && (
                    <span className="text-[9px] px-1 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                        {badge}
                    </span>
                )}
            </div>
            <div className={`px-5 py-2.5 text-center ${
                isSelected ? 'text-cyan-200 font-black' : highlight ? 'text-cyan-400 font-bold' : 'text-gray-300'
            }`}>
                {val1}
            </div>
            <div className={`px-5 py-2.5 text-center ${
                isSelected ? 'text-cyan-200 font-black' : highlight ? 'text-cyan-400 font-bold' : 'text-gray-300'
            }`}>
                {val2}
            </div>
        </div>
    );
}

function CollapsibleSection({ id, title, icon, isOpen, onToggle, children }: { id: string; title: string; icon: React.ReactNode; isOpen: boolean; onToggle: () => void; children: React.ReactNode }) {
    return (
        <div className="rounded-xl border border-white/5 bg-[var(--bg-1)]/60 overflow-hidden">
            <button
                type="button"
                onClick={onToggle}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
            >
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-cyan-400">
                    {icon}
                    <span>{title}</span>
                </div>
                <ChevronDown size={14} className={`text-gray-500 transition-transform duration-300 ${isOpen ? 'rotate-180 text-cyan-400' : ''}`} />
            </button>
            <AnimatePresence initial={false}>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <div className="p-4 border-t border-white/5 bg-black/20">
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function GearInput({ label, unit, value, min, max, step = "any", onChange, color = "#00e5ff", desc }: any) {
    const [localValue, setLocalValue] = useState<string>(
        value !== undefined && value !== null ? String(value) : ''
    );

    useEffect(() => {
        const parsed = parseFloat(localValue);
        const propNum = typeof value === 'number' ? value : parseFloat(value);
        if (isNaN(propNum)) {
            if (localValue !== '') setLocalValue('');
        } else if (isNaN(parsed) || Math.abs(parsed - propNum) > 1e-9) {
            setLocalValue(String(value));
        }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value;
        setLocalValue(raw);

        if (raw === '' || raw === '-' || raw === '.' || raw === '-.') {
            return;
        }

        let num = parseFloat(raw);
        if (isNaN(num)) return;

        if (max !== undefined && num > max) {
            num = max;
        }

        onChange(num);
    };

    const handleBlur = () => {
        if (localValue === '' || localValue === '-' || isNaN(parseFloat(localValue))) {
            const fallback = min !== undefined ? min : 0;
            setLocalValue(String(fallback));
            onChange(fallback);
            return;
        }
        let num = parseFloat(localValue);
        if (min !== undefined && num < min) num = min;
        if (max !== undefined && num > max) num = max;

        // Round to up to 5 decimal places max
        const rounded = Number(num.toFixed(5));
        setLocalValue(String(rounded));
        onChange(rounded);
    };

    return (
        <div className="flex flex-col gap-1 group">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1 group-focus-within:text-white transition-colors flex justify-between">
                <span>{label}</span>
                {unit && <span className="font-mono text-gray-600">{unit}</span>}
            </label>
            <div className="relative flex items-center bg-[var(--bg-0)] border border-white/10 rounded-xl overflow-hidden group-focus-within:border-cyan-500/50 transition-all">
                <input 
                    type="number" 
                    value={localValue} 
                    min={min} 
                    max={max} 
                    step={step}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className="w-full bg-transparent text-sm font-black font-mono px-3 py-2 text-white outline-none"
                />
            </div>
            {desc && <span className="text-[9px] text-gray-500 px-1">{desc}</span>}
        </div>
    );
}

function GearSelect({ label, value, onChange, options, color = "#00e5ff", desc }: any) {
    return (
        <div className="flex flex-col gap-1 group">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1 group-focus-within:text-white transition-colors">
                {label}
            </label>
            <div className="relative flex items-center bg-[var(--bg-0)] border border-white/10 rounded-xl overflow-hidden group-focus-within:border-cyan-500/50 transition-all">
                <select
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full bg-transparent text-xs font-black font-mono px-3 py-2 text-white outline-none"
                >
                    {options.map((opt: any) => (
                        <option key={opt.value} value={opt.value} className="bg-[var(--bg-1)] text-white">
                            {opt.label}
                        </option>
                    ))}
                </select>
            </div>
            {desc && <span className="text-[9px] text-gray-500 px-1">{desc}</span>}
        </div>
    );
}

// 2D SVG Pair Renderers — True Involute Engine (ISO 53 / DIN 3960)
function GearShape2D({ 
    cx, 
    cy, 
    rRef, 
    teeth, 
    m, 
    isPinion, 
    isPrint, 
    rotationAngle = 0, 
    initialAngle, 
    profileShift = 0,
    helixAngle = 0,
    pressureAngle = 20,
    faceWidth = 0,
    outsideDiameter,
    kFactor = 0,
}: any) {
    const z = Math.max(4, Math.round(teeth));
    const specs = useMemo(() => calculateInvoluteGearSpecs({
        module: m,
        teeth: z,
        profileShift,
        helixAngle,
        pressureAngle,
        outsideDiameter,
        kFactor,
    }), [m, z, profileShift, helixAngle, pressureAngle, outsideDiameter, kFactor]);

    const twistDeg = helixFaceTwistDeg(helixAngle, faceWidth > 0 ? faceWidth : 10 * m, specs.pitchRadius);

    const gearPath = useMemo(() => {
        const pts = generateExternalGearContour({
            module: m,
            teeth: z,
            profileShift,
            helixAngle,
            pressureAngle,
            outsideDiameter,
            kFactor,
            center: { x: cx, y: cy },
            pointsPerFlank: 12,
        });
        return pointsToSvgPath(pts);
    }, [cx, cy, z, m, profileShift, helixAngle, pressureAngle, outsideDiameter, kFactor]);

    const backPath = useMemo(() => {
        if (Math.abs(twistDeg) < 0.05) return null;
        const pts = generateExternalGearContour({
            module: m,
            teeth: z,
            profileShift,
            helixAngle,
            pressureAngle,
            outsideDiameter,
            kFactor,
            rotationAngle: twistDeg,
            center: { x: cx, y: cy },
            pointsPerFlank: 8,
        });
        return pointsToSvgPath(pts);
    }, [cx, cy, z, m, profileShift, helixAngle, pressureAngle, twistDeg, outsideDiameter, kFactor]);

    const initRot = initialAngle !== undefined ? initialAngle : (!isPinion ? (180 / z) : 0);
    const totalAngle = initRot + rotationAngle;

    const animStyle = !isPrint
        ? {
            transformOrigin: `${cx}px ${cy}px`,
            transformBox: 'view-box' as const,
            transform: `rotate(${totalAngle.toFixed(2)}deg)`,
        }
        : {};

    const fillGrad = isPrint ? 'none' : isPinion ? 'url(#metalPinionGrad)' : 'url(#metalGearGrad)';
    const strokeCol = isPrint ? '#000000' : isPinion ? '#38bdf8' : '#c084fc';
    const hasHelix = Math.abs(helixAngle) > 0.05;
    const rPitch = specs.pitchRadius;
    const leadCount = Math.min(10, Math.max(6, Math.round(z / 3)));

    return (
        <g style={animStyle}>
            {backPath && (
                <path
                    d={backPath}
                    fill="none"
                    stroke={strokeCol}
                    strokeWidth={isPrint ? 0.7 : 0.9}
                    strokeDasharray="2 2"
                    opacity={0.45}
                    strokeLinejoin="round"
                />
            )}
            <path
                d={gearPath}
                fill={fillGrad}
                stroke={strokeCol}
                strokeWidth={isPrint ? 1.2 : 1.5}
                strokeLinejoin="round"
                filter={isPrint ? undefined : 'url(#gearShadow)'}
            />
            <circle cx={cx} cy={cy} r={Math.max(6, rRef * 0.25)} fill="#03060a" stroke={strokeCol} strokeWidth="1.5" />
            <circle cx={cx} cy={cy} r={rRef} fill="none" stroke="#38bdf8" strokeWidth="0.8" strokeDasharray="5,4" opacity={0.45} />
            <path d={`M ${cx - 6} ${cy} L ${cx + 6} ${cy} M ${cx} ${cy - 6} L ${cx} ${cy + 6}`} stroke="#38bdf8" strokeWidth="1.2" opacity={0.7} />

            {hasHelix && (
                <g stroke={strokeCol} strokeWidth="1.15" opacity={0.85}>
                    {Array.from({ length: leadCount }, (_, i) => {
                        const a0 = (i / leadCount) * 2 * Math.PI;
                        const a1 = a0 + (twistDeg * Math.PI) / 180;
                        return (
                            <line
                                key={i}
                                x1={cx + rPitch * Math.cos(a0)}
                                y1={cy + rPitch * Math.sin(a0)}
                                x2={cx + rPitch * Math.cos(a1)}
                                y2={cy + rPitch * Math.sin(a1)}
                            />
                        );
                    })}
                    <text
                        x={cx}
                        y={cy + rRef + 14}
                        textAnchor="middle"
                        fill={strokeCol}
                        fontSize="9"
                        fontFamily="ui-monospace, monospace"
                        fontWeight="bold"
                    >
                        β={helixAngle}° {helixHandLabel(helixAngle)}
                    </text>
                </g>
            )}
        </g>
    );
}

function InternalRingGearShape2D({ 
    cx, 
    cy, 
    rRef, 
    teeth, 
    m, 
    isPrint, 
    rotationAngle = 0, 
    initialAngle, 
    profileShift = 0,
    helixAngle = 0,
    pressureAngle = 20,
    faceWidth = 0,
    outsideDiameter,
    kFactor = 0,
}: any) {
    const precision = useGlobalPrecision();
    const z = Math.max(8, Math.round(teeth));
    const specs = useMemo(() => calculateInvoluteGearSpecs({
        module: m,
        teeth: z,
        profileShift,
        helixAngle,
        pressureAngle,
        isInternal: true,
        rimThickness: m * 3.5,
        outsideDiameter,
        kFactor,
    }), [m, z, profileShift, helixAngle, pressureAngle, outsideDiameter, kFactor]);
    const twistDeg = helixFaceTwistDeg(helixAngle, faceWidth > 0 ? faceWidth : 10 * m, specs.pitchRadius);

    const ringPath = useMemo(() => {
        const { innerTeethContour, outerRimContour } = generateInternalGearContour({
            module: m,
            teeth: z,
            profileShift,
            helixAngle,
            pressureAngle,
            outsideDiameter,
            kFactor,
            center: { x: cx, y: cy },
            isInternal: true,
            rimThickness: m * 3.5,
            pointsPerFlank: 8,
        });
        return pointsToSvgPath(innerTeethContour) + ' ' + pointsToSvgPath(outerRimContour);
    }, [cx, cy, z, m, profileShift, helixAngle, pressureAngle, outsideDiameter, kFactor]);

    const initRot = initialAngle !== undefined ? initialAngle : (180 / teeth);
    const totalAngle = initRot + rotationAngle;

    const animStyle = !isPrint
        ? {
            transformOrigin: `${cx}px ${cy}px`,
            transformBox: 'view-box' as const,
            transform: `rotate(${totalAngle.toFixed(2)}deg)`,
        }
        : {};

    const fillGrad = isPrint ? 'none' : 'url(#metalGearGrad)';
    const strokeCol = isPrint ? '#000000' : '#c084fc';

    return (
        <g style={animStyle}>
            <path
                d={ringPath}
                fill={fillGrad}
                fillRule="evenodd"
                stroke={strokeCol}
                strokeWidth={isPrint ? 1.2 : 1.5}
                strokeLinejoin="round"
                filter={isPrint ? undefined : 'url(#gearShadow)'}
            />
            <circle cx={cx} cy={cy} r={rRef} fill="none" stroke="#38bdf8" strokeWidth="0.8" strokeDasharray="5,4" opacity={0.45} />
            <path d={`M ${cx - 6} ${cy} L ${cx + 6} ${cy} M ${cx} ${cy - 6} L ${cx} ${cy + 6}`} stroke="#38bdf8" strokeWidth="1.2" opacity={0.7} />
            {Math.abs(helixAngle) > 0.05 && (
                <text
                    x={cx}
                    y={cy + rRef + 16}
                    textAnchor="middle"
                    fill={strokeCol}
                    fontSize="9"
                    fontFamily="ui-monospace, monospace"
                    fontWeight="bold"
                >
                    β={helixAngle}° {helixHandLabel(helixAngle)}  twist={formatEngineeringValue(twistDeg, precision, false)}°
                </text>
            )}
        </g>
    );
}

function getDimName(key: string, lang?: string) {
    switch (key) {
        case 'dw':
            return t12(lang, 'Working Pitch Dia (dw)', 'Yuvarlanma Çapı (dw)');
        case 'rw':
            return t12(lang, 'Working Pitch Radius (rw)', 'Yuvarlanma Yarıçapı (rw)');
        case 'da':
            return t12(lang, 'Tip Diameter (da)', 'Tepe / Diş Üstü Çapı (da)');
        case 'd':
            return t12(lang, 'Ref Pitch Dia (d)', 'Taksimat / Bölüm Çapı (d)');
        case 'db':
            return t12(lang, 'Base Diameter (db)', 'Temel Daire Çapı (db)');
        case 'df':
            return t12(lang, 'Root Diameter (df)', 'Kök / Diş Dibi Çapı (df)');
        case 'a':
            return t12(lang, 'Center Distance (a)', 'Çalışma Eksen Mesafesi (a / aw)');
        case 'pressureAngle':
            return t12(lang, 'Line of Action (αwt)', 'Kavrama Doğrusu & Açısı (αwt)');
        case 'helixAngle':
            return t12(lang, 'Helix Angle (β)', 'Helis Açısı (β)');
        case 'x':
            return t12(lang, 'Profile Shift (x)', 'Profil Kaydırma (x)');
        case 'wildhaber':
            return t12(lang, 'Wildhaber Span (Wk)', 'Wildhaber Kiriş Ölçüsü (Wk)');
        case 'overPins':
            return t12(lang, 'Dimension Over Pins (M)', 'Pimler Üzeri Ölçü (M)');
        default:
            return key;
    }
}

function LaserDimensionOverlay({
    selectedDim,
    cx1,
    cx2,
    cyCenter,
    scale,
    results,
    isInternal,
    z1,
    z2,
    pressureAngle,
    helixAngle,
    x1,
    x2,
    a,
    m,
    currentLang,
}: {
    selectedDim: string | null;
    cx1: number;
    cx2: number;
    cyCenter: number;
    scale: number;
    results: any;
    isInternal: boolean;
    z1: number;
    z2: number;
    pressureAngle: number;
    helixAngle: number;
    x1: number;
    x2: number;
    a: number;
    m: number;
    currentLang?: string;
}) {
    const precision = useGlobalPrecision();
    if (!selectedDim || !results) return null;

    // Scaled radii from results
    const rW1 = (results.rw1 || (results.dw1 / 2) || (results.d1 / 2)) * scale;
    const rW2 = (results.rw2 || (results.dw2 / 2) || (results.d2 / 2)) * scale;
    const rD1 = (results.d1 / 2) * scale;
    const rD2 = (results.d2 / 2) * scale;
    const rA1 = (results.da1 / 2) * scale;
    const rA2 = (results.da2 / 2) * scale;
    const rF1 = (results.df1 / 2) * scale;
    const rF2 = (results.df2 / 2) * scale;
    const rB1 = (results.db1 / 2) * scale;
    const rB2 = (results.db2 / 2) * scale;

    // Pitch point C
    const pitchPointX = isInternal ? (cx2 - rW2) : (cx1 + rW1);
    const pitchPointY = cyCenter;

    // Line of action angle
    const alpha_wt_rad = (results.alpha_wt_deg || pressureAngle) * (Math.PI / 180);

    return (
        <g className="laser-dimension-overlay pointer-events-none select-none">
            {/* 1. WORKING PITCH DIAMETER & RADIUS (dw / rw) */}
            {(selectedDim === 'dw' || selectedDim === 'rw') && (
                <g>
                    {/* Pinion Working Pitch Circle (dw1) */}
                    <circle
                        cx={cx1}
                        cy={cyCenter}
                        r={rW1}
                        fill="none"
                        stroke="#00e5ff"
                        strokeWidth="2.5"
                        strokeDasharray="6 3"
                        filter="url(#neonLaserGlow)"
                    />
                    <circle
                        cx={cx1}
                        cy={cyCenter}
                        r={rW1}
                        fill="#00e5ff"
                        fillOpacity="0.04"
                    />

                    {/* Gear Working Pitch Circle (dw2) */}
                    <circle
                        cx={cx2}
                        cy={cyCenter}
                        r={rW2}
                        fill="none"
                        stroke="#38bdf8"
                        strokeWidth="2.5"
                        strokeDasharray="6 3"
                        filter="url(#neonLaserGlow)"
                    />
                    <circle
                        cx={cx2}
                        cy={cyCenter}
                        r={rW2}
                        fill="#38bdf8"
                        fillOpacity="0.03"
                    />

                    {/* Common Tangent Line at Pitch Point */}
                    <line
                        x1={pitchPointX}
                        y1={pitchPointY - 60}
                        x2={pitchPointX}
                        y2={pitchPointY + 60}
                        stroke="#00e5ff"
                        strokeWidth="1.2"
                        strokeDasharray="3 3"
                        opacity="0.8"
                    />

                    {/* Pitch Point C (Kinematic Rolling Contact) */}
                    <circle
                        cx={pitchPointX}
                        cy={pitchPointY}
                        r="8"
                        fill="#00e5ff"
                        opacity="0.4"
                    />
                    <circle
                        cx={pitchPointX}
                        cy={pitchPointY}
                        r="4"
                        fill="#ffffff"
                        stroke="#00e5ff"
                        strokeWidth="2"
                    />
                    <line
                        x1={pitchPointX - 9}
                        y1={pitchPointY}
                        x2={pitchPointX + 9}
                        y2={pitchPointY}
                        stroke="#ffffff"
                        strokeWidth="1.5"
                    />
                    <line
                        x1={pitchPointX}
                        y1={pitchPointY - 9}
                        x2={pitchPointX}
                        y2={pitchPointY + 9}
                        stroke="#ffffff"
                        strokeWidth="1.5"
                    />

                    {/* Radius rw1 indicator line & label */}
                    <line
                        x1={cx1}
                        y1={cyCenter}
                        x2={pitchPointX}
                        y2={cyCenter}
                        stroke="#00e5ff"
                        strokeWidth="2"
                    />
                    <rect
                        x={cx1 + (rW1 / 2) - 55}
                        y={cyCenter + 8}
                        width="110"
                        height="18"
                        rx="4"
                        fill="#030712"
                        stroke="#00e5ff"
                        strokeWidth="1"
                        fillOpacity="0.9"
                    />
                    <text
                        x={cx1 + (rW1 / 2)}
                        y={cyCenter + 20}
                        textAnchor="middle"
                        fill="#00e5ff"
                        fontSize="9"
                        fontFamily="ui-monospace, monospace"
                        fontWeight="bold"
                    >
                        rw₁={formatEngineeringValue(results.rw1, precision, false)} mm
                    </text>

                    {/* Radius rw2 indicator line & label (external) */}
                    {!isInternal && (
                        <>
                            <line
                                x1={pitchPointX}
                                y1={cyCenter}
                                x2={cx2}
                                y2={cyCenter}
                                stroke="#38bdf8"
                                strokeWidth="2"
                            />
                            <rect
                                x={pitchPointX + (rW2 / 2) - 55}
                                y={cyCenter + 8}
                                width="110"
                                height="18"
                                rx="4"
                                fill="#030712"
                                stroke="#38bdf8"
                                strokeWidth="1"
                                fillOpacity="0.9"
                            />
                            <text
                                x={pitchPointX + (rW2 / 2)}
                                y={cyCenter + 20}
                                textAnchor="middle"
                                fill="#38bdf8"
                                fontSize="9"
                                fontFamily="ui-monospace, monospace"
                                fontWeight="bold"
                            >
                                rw₂={formatEngineeringValue(results.rw2, precision, false)} mm
                            </text>
                        </>
                    )}

                    {/* Floating Pitch Point Callout Banner */}
                    <g transform={`translate(${pitchPointX}, ${pitchPointY - 45})`}>
                        <rect
                            x="-135"
                            y="-12"
                            width="270"
                            height="24"
                            rx="5"
                            fill="#040812"
                            stroke="#00e5ff"
                            strokeWidth="1.2"
                            filter="url(#neonLaserGlow)"
                            fillOpacity="0.95"
                        />
                        <text
                            x="0"
                            y="4"
                            textAnchor="middle"
                            fill="#ffffff"
                            fontSize="9"
                            fontFamily="ui-monospace, monospace"
                            fontWeight="bold"
                        >
                            C · {t12(currentLang, 'Pitch Point', 'Yuvarlanma Noktası')} (dw₁={formatEngineeringValue(results.dw1, precision, false)}, dw₂={formatEngineeringValue(results.dw2, precision, false)})
                        </text>
                        <line x1="0" y1="12" x2="0" y2="35" stroke="#00e5ff" strokeWidth="1.2" strokeDasharray="2 2" />
                    </g>
                </g>
            )}

            {/* 2. TIP DIAMETER (da) */}
            {selectedDim === 'da' && (
                <g>
                    <circle
                        cx={cx1}
                        cy={cyCenter}
                        r={rA1}
                        fill="none"
                        stroke="#f43f5e"
                        strokeWidth="2.5"
                        strokeDasharray="5 3"
                        filter="url(#neonLaserGlow)"
                    />
                    <circle
                        cx={cx2}
                        cy={cyCenter}
                        r={rA2}
                        fill="none"
                        stroke="#ec4899"
                        strokeWidth="2.5"
                        strokeDasharray="5 3"
                        filter="url(#neonLaserGlow)"
                    />
                    <rect x={cx1 - 60} y={cyCenter - rA1 - 22} width="120" height="18" rx="4" fill="#040812" stroke="#f43f5e" strokeWidth="1" fillOpacity="0.9" />
                    <text x={cx1} y={cyCenter - rA1 - 10} textAnchor="middle" fill="#f43f5e" fontSize="9" fontFamily="ui-monospace, monospace" fontWeight="bold">
                        da₁ = {formatEngineeringValue(results.da1, precision, false)} mm
                    </text>
                    <rect x={cx2 - 60} y={cyCenter - rA2 - 22} width="120" height="18" rx="4" fill="#040812" stroke="#ec4899" strokeWidth="1" fillOpacity="0.9" />
                    <text x={cx2} y={cyCenter - rA2 - 10} textAnchor="middle" fill="#ec4899" fontSize="9" fontFamily="ui-monospace, monospace" fontWeight="bold">
                        da₂ = {formatEngineeringValue(results.da2, precision, false)} mm
                    </text>
                </g>
            )}

            {/* 3. REFERENCE PITCH DIAMETER (d) */}
            {selectedDim === 'd' && (
                <g>
                    <circle
                        cx={cx1}
                        cy={cyCenter}
                        r={rD1}
                        fill="none"
                        stroke="#38bdf8"
                        strokeWidth="2.5"
                        strokeDasharray="5 3"
                        filter="url(#neonLaserGlow)"
                    />
                    <circle
                        cx={cx2}
                        cy={cyCenter}
                        r={rD2}
                        fill="none"
                        stroke="#38bdf8"
                        strokeWidth="2.5"
                        strokeDasharray="5 3"
                        filter="url(#neonLaserGlow)"
                    />
                    <rect x={cx1 - 65} y={cyCenter - rD1 - 22} width="130" height="18" rx="4" fill="#040812" stroke="#38bdf8" strokeWidth="1" fillOpacity="0.9" />
                    <text x={cx1} y={cyCenter - rD1 - 10} textAnchor="middle" fill="#38bdf8" fontSize="9" fontFamily="ui-monospace, monospace" fontWeight="bold">
                        d₁ = {formatEngineeringValue(results.d1, precision, false)} mm (Ref)
                    </text>
                    <rect x={cx2 - 65} y={cyCenter - rD2 - 22} width="130" height="18" rx="4" fill="#040812" stroke="#38bdf8" strokeWidth="1" fillOpacity="0.9" />
                    <text x={cx2} y={cyCenter - rD2 - 10} textAnchor="middle" fill="#38bdf8" fontSize="9" fontFamily="ui-monospace, monospace" fontWeight="bold">
                        d₂ = {formatEngineeringValue(results.d2, precision, false)} mm (Ref)
                    </text>
                </g>
            )}

            {/* 4. BASE DIAMETER (db) */}
            {selectedDim === 'db' && (
                <g>
                    <circle
                        cx={cx1}
                        cy={cyCenter}
                        r={rB1}
                        fill="none"
                        stroke="#a855f7"
                        strokeWidth="2.5"
                        strokeDasharray="4 2"
                        filter="url(#purpleLaserGlow)"
                    />
                    <circle
                        cx={cx2}
                        cy={cyCenter}
                        r={rB2}
                        fill="none"
                        stroke="#a855f7"
                        strokeWidth="2.5"
                        strokeDasharray="4 2"
                        filter="url(#purpleLaserGlow)"
                    />
                    <rect x={cx1 - 70} y={cyCenter + rB1 + 6} width="140" height="18" rx="4" fill="#040812" stroke="#a855f7" strokeWidth="1" fillOpacity="0.9" />
                    <text x={cx1} y={cyCenter + rB1 + 18} textAnchor="middle" fill="#c084fc" fontSize="8.5" fontFamily="ui-monospace, monospace" fontWeight="bold">
                        db₁={formatEngineeringValue(results.db1, precision, false)} mm (Temel)
                    </text>
                    <rect x={cx2 - 70} y={cyCenter + rB2 + 6} width="140" height="18" rx="4" fill="#040812" stroke="#a855f7" strokeWidth="1" fillOpacity="0.9" />
                    <text x={cx2} y={cyCenter + rB2 + 18} textAnchor="middle" fill="#c084fc" fontSize="8.5" fontFamily="ui-monospace, monospace" fontWeight="bold">
                        db₂={formatEngineeringValue(results.db2, precision, false)} mm (Temel)
                    </text>
                </g>
            )}

            {/* 5. ROOT DIAMETER (df) */}
            {selectedDim === 'df' && (
                <g>
                    <circle
                        cx={cx1}
                        cy={cyCenter}
                        r={rF1}
                        fill="none"
                        stroke="#fb923c"
                        strokeWidth="2.5"
                        strokeDasharray="4 3"
                        filter="url(#amberLaserGlow)"
                    />
                    <circle
                        cx={cx2}
                        cy={cyCenter}
                        r={rF2}
                        fill="none"
                        stroke="#fb923c"
                        strokeWidth="2.5"
                        strokeDasharray="4 3"
                        filter="url(#amberLaserGlow)"
                    />
                    <rect x={cx1 - 60} y={cyCenter - rF1 - 22} width="120" height="18" rx="4" fill="#040812" stroke="#fb923c" strokeWidth="1" fillOpacity="0.9" />
                    <text x={cx1} y={cyCenter - rF1 - 10} textAnchor="middle" fill="#fb923c" fontSize="9" fontFamily="ui-monospace, monospace" fontWeight="bold">
                        df₁ = {formatEngineeringValue(results.df1, precision, false)} mm
                    </text>
                    <rect x={cx2 - 60} y={cyCenter - rF2 - 22} width="120" height="18" rx="4" fill="#040812" stroke="#fb923c" strokeWidth="1" fillOpacity="0.9" />
                    <text x={cx2} y={cyCenter - rF2 - 10} textAnchor="middle" fill="#fb923c" fontSize="9" fontFamily="ui-monospace, monospace" fontWeight="bold">
                        df₂ = {formatEngineeringValue(results.df2, precision, false)} mm
                    </text>
                </g>
            )}

            {/* 6. CENTER DISTANCE (a) */}
            {selectedDim === 'a' && (
                <g>
                    <line
                        x1={cx1}
                        y1={cyCenter}
                        x2={cx2}
                        y2={cyCenter}
                        stroke="#00e5ff"
                        strokeWidth="3"
                        filter="url(#neonLaserGlow)"
                    />
                    <circle cx={cx1} cy={cyCenter} r="6" fill="#00e5ff" opacity="0.6" />
                    <circle cx={cx2} cy={cyCenter} r="6" fill="#00e5ff" opacity="0.6" />
                    <rect
                        x={((cx1 + cx2) / 2) - 95}
                        y={cyCenter - 28}
                        width="190"
                        height="22"
                        rx="5"
                        fill="#030712"
                        stroke="#00e5ff"
                        strokeWidth="1.5"
                        filter="url(#neonLaserGlow)"
                        fillOpacity="0.95"
                    />
                    <text
                        x={(cx1 + cx2) / 2}
                        y={cyCenter - 14}
                        textAnchor="middle"
                        fill="#00e5ff"
                        fontSize="9.5"
                        fontFamily="ui-monospace, monospace"
                        fontWeight="bold"
                    >
                        a = aw = {formatEngineeringValue(results.a, precision, false)} mm
                    </text>
                </g>
            )}

            {/* 7. PRESSURE ANGLE & LINE OF ACTION */}
            {selectedDim === 'pressureAngle' && (
                <g>
                    {(() => {
                        const len = 90;
                        const dx = Math.sin(alpha_wt_rad) * len;
                        const dy = Math.cos(alpha_wt_rad) * len;
                        return (
                            <>
                                <line
                                    x1={pitchPointX - dx}
                                    y1={pitchPointY - dy}
                                    x2={pitchPointX + dx}
                                    y2={pitchPointY + dy}
                                    stroke="#34d399"
                                    strokeWidth="2.5"
                                    filter="url(#neonLaserGlow)"
                                    />
                                <rect
                                    x={pitchPointX - 110}
                                    y={pitchPointY - dy - 24}
                                    width="220"
                                    height="20"
                                    rx="4"
                                    fill="#040812"
                                    stroke="#34d399"
                                    strokeWidth="1.2"
                                    fillOpacity="0.95"
                                />
                                <text
                                    x={pitchPointX}
                                    y={pitchPointY - dy - 10}
                                    textAnchor="middle"
                                    fill="#34d399"
                                    fontSize="8.5"
                                    fontFamily="ui-monospace, monospace"
                                    fontWeight="bold"
                                >
                                    {t12(currentLang, 'Line of Action', 'Kavrama Doğrusu')} · αwt={formatEngineeringValue(results.alpha_wt_deg, precision, false)}°
                                </text>
                            </>
                        );
                    })()}
                </g>
            )}

            {/* 8. PROFILE SHIFT (x) */}
            {selectedDim === 'x' && (
                <g>
                    <circle
                        cx={cx1}
                        cy={cyCenter}
                        r={Math.abs(rW1 - rD1) > 1 ? (rW1 + rD1) / 2 : rW1}
                        fill="none"
                        stroke="#f59e0b"
                        strokeWidth={Math.max(4, Math.abs(rW1 - rD1) * 2)}
                        opacity="0.35"
                        filter="url(#amberLaserGlow)"
                    />
                    <rect x={cx1 - 65} y={cyCenter - rA1 - 22} width="130" height="18" rx="4" fill="#040812" stroke="#f59e0b" strokeWidth="1" fillOpacity="0.9" />
                    <text x={cx1} y={cyCenter - rA1 - 10} textAnchor="middle" fill="#f59e0b" fontSize="9" fontFamily="ui-monospace, monospace" fontWeight="bold">
                        x₁ = {x1 >= 0 ? `+${x1.toFixed(5)}` : x1.toFixed(5)}
                    </text>
                    <rect x={cx2 - 65} y={cyCenter - rA2 - 22} width="130" height="18" rx="4" fill="#040812" stroke="#f59e0b" strokeWidth="1" fillOpacity="0.9" />
                    <text x={cx2} y={cyCenter - rA2 - 10} textAnchor="middle" fill="#f59e0b" fontSize="9" fontFamily="ui-monospace, monospace" fontWeight="bold">
                        x₂ = {x2 >= 0 ? `+${x2.toFixed(5)}` : x2.toFixed(5)}
                    </text>
                </g>
            )}

            {/* 9. WILDHABER SPAN (Wk) */}
            {selectedDim === 'wildhaber' && results.Wk1 && (
                <g>
                    <rect x={cx1 - 75} y={cyCenter + 15} width="150" height="22" rx="4" fill="#040812" stroke="#a855f7" strokeWidth="1.2" filter="url(#purpleLaserGlow)" fillOpacity="0.95" />
                    <text x={cx1} y={cyCenter + 30} textAnchor="middle" fill="#c084fc" fontSize="8.5" fontFamily="ui-monospace, monospace" fontWeight="bold">
                        Wk₁ = {formatEngineeringValue(results.Wk1.W, precision, false)} mm (k={results.Wk1.k})
                    </text>
                    {results.Wk2 && (
                        <>
                            <rect x={cx2 - 75} y={cyCenter + 15} width="150" height="22" rx="4" fill="#040812" stroke="#a855f7" strokeWidth="1.2" filter="url(#purpleLaserGlow)" fillOpacity="0.95" />
                            <text x={cx2} y={cyCenter + 30} textAnchor="middle" fill="#c084fc" fontSize="8.5" fontFamily="ui-monospace, monospace" fontWeight="bold">
                                Wk₂ = {formatEngineeringValue(results.Wk2.W, precision, false)} mm (k={results.Wk2.k})
                            </text>
                        </>
                    )}
                </g>
            )}

            {/* 10. OVER PINS (M) */}
            {selectedDim === 'overPins' && results.M1 && (
                <g>
                    <rect x={cx1 - 70} y={cyCenter - 30} width="140" height="20" rx="4" fill="#040812" stroke="#00e5ff" strokeWidth="1.2" filter="url(#neonLaserGlow)" fillOpacity="0.95" />
                    <text x={cx1} y={cyCenter - 16} textAnchor="middle" fill="#00e5ff" fontSize="8.5" fontFamily="ui-monospace, monospace" fontWeight="bold">
                        M₁ = {formatEngineeringValue(results.M1, precision, false)} mm (Pim)
                    </text>
                    {results.M2 && (
                        <>
                            <rect x={cx2 - 70} y={cyCenter - 30} width="140" height="20" rx="4" fill="#040812" stroke="#00e5ff" strokeWidth="1.2" filter="url(#neonLaserGlow)" fillOpacity="0.95" />
                            <text x={cx2} y={cyCenter - 16} textAnchor="middle" fill="#00e5ff" fontSize="8.5" fontFamily="ui-monospace, monospace" fontWeight="bold">
                                M₂ = {formatEngineeringValue(results.M2, precision, false)} mm (Pim)
                            </text>
                        </>
                    )}
                </g>
            )}
        </g>
    );
}

function GearManufacturingDataTable({
    results,
    gearModule,
    z1,
    z2,
    pressureAngle,
    helixAngle,
    x1,
    x2,
    selectedDim,
    onSelectDim,
    currentLang,
    meshType,
    materialName,
}: {
    results: any;
    gearModule: number;
    z1: number;
    z2: number;
    pressureAngle: number;
    helixAngle: number;
    x1: number;
    x2: number;
    selectedDim: string | null;
    onSelectDim: (key: string | null) => void;
    currentLang?: string;
    meshType: 'external' | 'internal';
    materialName: string;
}) {
    const precision = useGlobalPrecision();
    const [isExpanded, setIsExpanded] = useState<boolean>(true);
    const [copied, setCopied] = useState<boolean>(false);

    const effZ2 = meshType === 'internal' ? (results.effZ2 || z2) : z2;

    const dataRows = [
        { label: t12(currentLang, 'Normal Module', 'Normal Modül'), symbol: 'mn', v1: `${formatEngineeringValue(gearModule, precision, true)}`, v2: `${formatEngineeringValue(gearModule, precision, true)}`, unit: 'mm', std: 'DIN 867' },
        { label: t12(currentLang, 'Transverse Module', 'Alın Modülü'), symbol: 'mt', v1: `${formatEngineeringValue(results.mt, precision, true)}`, v2: `${formatEngineeringValue(results.mt, precision, true)}`, unit: 'mm', std: 'DIN 3960' },
        { label: t12(currentLang, 'Number of Teeth', 'Diş Sayısı'), symbol: 'z', v1: `${z1}`, v2: `${effZ2}`, unit: '-', std: 'ISO 21771' },
        { label: t12(currentLang, 'Normal Pressure Angle', 'Temel Kavrama Açısı'), symbol: 'αn', v1: `${pressureAngle}°`, v2: `${pressureAngle}°`, unit: 'deg', std: 'ISO 53' },
        { label: t12(currentLang, 'Working Pressure Angle', 'Çalışma Kavrama Açısı'), symbol: 'αwt', v1: `${formatEngineeringValue(results.alpha_wt_deg, precision, true)}°`, v2: `${formatEngineeringValue(results.alpha_wt_deg, precision, true)}°`, unit: 'deg', dimKey: 'pressureAngle', std: 'DIN 3960' },
        { label: t12(currentLang, 'Helix Angle & Hand', 'Helis Açısı & Yönü'), symbol: 'β', v1: helixAngle === 0 ? '0° (spur)' : `${helixAngle}° ${helixHandLabel(helixAngle)}`, v2: helixAngle === 0 ? '0° (spur)' : `${-helixAngle}° ${helixHandLabel(-helixAngle)}`, unit: 'deg', dimKey: 'helixAngle', std: 'DIN 3960' },
        { label: t12(currentLang, 'Profile Shift', 'Profil Kaydırma Katsayısı'), symbol: 'x', v1: Math.abs(x1) < 1e-6 ? '0' : (x1 > 0 ? `+${formatEngineeringValue(x1, Math.min(precision, 4), true)}` : formatEngineeringValue(x1, Math.min(precision, 4), true)), v2: Math.abs(x2) < 1e-6 ? '0' : (x2 > 0 ? `+${formatEngineeringValue(x2, Math.min(precision, 4), true)}` : formatEngineeringValue(x2, Math.min(precision, 4), true)), unit: '-', dimKey: 'x', std: 'DIN 3960' },
        { label: t12(currentLang, 'Tip Shortening (+/- k)', 'Kafa Kısaltma (+/- k)'), symbol: 'k', v1: Math.abs(results.k1) < 1e-6 ? '0' : (results.k1 > 0 ? `+${formatEngineeringValue(results.k1, precision, true)}` : formatEngineeringValue(results.k1, precision, true)), v2: Math.abs(results.k2) < 1e-6 ? '0' : (results.k2 > 0 ? `+${formatEngineeringValue(results.k2, precision, true)}` : formatEngineeringValue(results.k2, precision, true)), unit: '-', dimKey: 'k', std: 'DIN 3960', highlight: true },
        { label: t12(currentLang, 'Crest Shortening Amount', 'Kafa Kısaltma Miktarı'), symbol: 'k·mn', v1: `${formatEngineeringValue(results.k1_mm, precision, true)}`, v2: `${formatEngineeringValue(results.k2_mm, precision, true)}`, unit: 'mm', std: 'DIN 3960' },
        { label: t12(currentLang, 'Crest Tooth Thickness', 'Diş Başı Tepe Kalınlığı'), symbol: 'sa', v1: `${formatEngineeringValue((results.sa1 || 0), precision, true)}`, v2: `${formatEngineeringValue((results.sa2 || 0), precision, true)}`, unit: 'mm', std: 'DIN 3960' },
        { label: t12(currentLang, 'Working Pitch Diameter', 'Yuvarlanma Dairesi Çapı'), symbol: 'dw', v1: `${formatEngineeringValue(results.dw1, precision, true)}`, v2: `${formatEngineeringValue(results.dw2, precision, true)}`, unit: 'mm', dimKey: 'dw', std: 'ISO 21771', highlight: true },
        { label: t12(currentLang, 'Working Pitch Radius', 'Yuvarlanma Yarıçapı'), symbol: 'rw', v1: `${formatEngineeringValue(results.rw1, precision, true)}`, v2: `${formatEngineeringValue(results.rw2, precision, true)}`, unit: 'mm', dimKey: 'rw', std: 'ISO 21771', highlight: true },
        { label: t12(currentLang, 'Ref Pitch Diameter', 'Referans / Bölüm Çapı'), symbol: 'd', v1: `${formatEngineeringValue(results.d1, precision, true)}`, v2: `${formatEngineeringValue(results.d2, precision, true)}`, unit: 'mm', dimKey: 'd', std: 'DIN 3960' },
        { label: t12(currentLang, 'Base Diameter', 'Temel Daire Çapı'), symbol: 'db', v1: `${formatEngineeringValue(results.db1, precision, true)}`, v2: `${formatEngineeringValue(results.db2, precision, true)}`, unit: 'mm', dimKey: 'db', std: 'DIN 3960' },
        { label: t12(currentLang, 'Tip Diameter', 'Diş Başı (Tepe) Çapı'), symbol: 'da', v1: `${formatEngineeringValue(results.da1, precision, true)}`, v2: `${formatEngineeringValue(results.da2, precision, true)}`, unit: 'mm', dimKey: 'da', std: 'DIN 3960' },
        { label: t12(currentLang, 'Root Diameter', 'Diş Dibi (Kök) Çapı'), symbol: 'df', v1: `${formatEngineeringValue(results.df1, precision, true)}`, v2: `${formatEngineeringValue(results.df2, precision, true)}`, unit: 'mm', dimKey: 'df', std: 'DIN 3960' },
        { label: t12(currentLang, 'Operating Center Dist.', 'Çalışma Eksen Mesafesi'), symbol: 'aw', v1: `${formatEngineeringValue(results.a, precision, true)}`, v2: `${formatEngineeringValue(results.a, precision, true)}`, unit: 'mm', dimKey: 'a', std: 'ISO 21771', highlight: true },
        { label: t12(currentLang, 'Tooth Thickness', 'Normal Diş Kalınlığı'), symbol: 'sn', v1: `${formatEngineeringValue(results.sn1, precision, true)}`, v2: `${formatEngineeringValue(results.sn2, precision, true)}`, unit: 'mm', std: 'DIN 3960' },
        { label: t12(currentLang, 'Whole Depth', 'Tam Diş Yüksekliği'), symbol: 'h', v1: `${formatEngineeringValue(results.h1, precision, true)}`, v2: `${formatEngineeringValue(results.h2, precision, true)}`, unit: 'mm', std: 'ISO 53' },
        { label: t12(currentLang, 'Addendum', 'Diş Başı Yüksekliği'), symbol: 'ha', v1: `${formatEngineeringValue(results.ha1, precision, true)}`, v2: `${formatEngineeringValue(results.ha2, precision, true)}`, unit: 'mm', std: 'DIN 3960' },
        { label: t12(currentLang, 'Dedendum', 'Diş Dibi Yüksekliği'), symbol: 'hf', v1: `${formatEngineeringValue(results.hf1, precision, true)}`, v2: `${formatEngineeringValue(results.hf2, precision, true)}`, unit: 'mm', std: 'DIN 3960' },
        { label: t12(currentLang, 'Wildhaber Base Tangent', 'Wildhaber Kiriş Ölçüsü'), symbol: 'Wk', v1: results.Wk1 ? `${formatEngineeringValue(results.Wk1.W, precision, true)} (k=${results.Wk1.k})` : '-', v2: results.Wk2 ? `${formatEngineeringValue(results.Wk2.W, precision, true)} (k=${results.Wk2.k})` : '-', unit: 'mm', dimKey: 'wildhaber', std: 'DIN 3960' },
        { label: t12(currentLang, 'Dimension Over Pins', 'Pimler / Bilyalar Üstü'), symbol: 'M', v1: results.M1 ? `${formatEngineeringValue(results.M1, precision, true)}` : '-', v2: results.M2 ? `${formatEngineeringValue(results.M2, precision, true)}` : '-', unit: 'mm', dimKey: 'overPins', std: 'DIN 3960' },
        { label: t12(currentLang, 'Quality Grade', 'İmalat Kalite Sınıfı'), symbol: 'Q', v1: 'Grade 6', v2: 'Grade 6', unit: '-', std: 'ISO 1328-1' },
    ];

    const handleCopyTsv = () => {
        const header = [
            t12(currentLang, 'Parameter Description', 'Parametre Tanımı'),
            t12(currentLang, 'Symbol', 'Sembol'),
            `${t12(currentLang, 'Pinion', 'Pinyon')} (z1=${z1})`,
            `${meshType === 'internal' ? (t12(currentLang, 'Ring', 'İç Çark')) : (t12(currentLang, 'Gear', 'Çark'))} (z2=${effZ2})`,
            t12(currentLang, 'Unit', 'Birim'),
            t12(currentLang, 'Standard', 'Standart')
        ].join('\t');
        const lines = dataRows.map(r => [r.label, r.symbol, r.v1, r.v2, r.unit, r.std].join('\t'));
        const text = [header, ...lines].join('\n');
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownloadCsv = () => {
        const header = [
            t12(currentLang, 'Parameter Description', 'Parametre Tanimi'),
            t12(currentLang, 'Symbol', 'Sembol'),
            `Pinyon (z1=${z1})`,
            `Cark (z2=${effZ2})`,
            'Birim',
            'Standart'
        ].join(';');
        const lines = dataRows.map(r => `"${r.label}";"${r.symbol}";"${r.v1}";"${r.v2}";"${r.unit}";"${r.std}"`);
        const csvContent = '\uFEFF' + [header, ...lines].join('\r\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `disli_imalat_tablosu_m${gearModule}_z${z1}_z${effZ2}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-1)] overflow-hidden shadow-xl">
            {/* Header */}
            <div className="px-5 py-3 border-b border-[var(--line)] bg-[var(--bg-2)] flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-[var(--cyan)]/10 border border-[var(--cyan)]/30 text-[var(--cyan)]">
                        <FileSpreadsheet size={15} />
                    </div>
                    <div>
                        <h4 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
                            <span>{t12(currentLang, 'GEAR MANUFACTURING DATA SHEET', 'DİŞLİ İMALAT TABLOSU')}</span>
                            <span className="px-1.5 py-0.5 rounded bg-[var(--cyan)]/20 text-[var(--cyan)] text-[9px] font-mono font-bold">
                                DIN 3960 · ISO 1328
                            </span>
                        </h4>
                        <p className="text-[9px] font-mono text-[var(--alu-dim)]">
                            {t12(currentLang, 'Technical Drawing & Inspection Data', 'Teknik Resim & İmalat Kontrol Çizelgesi')}
                        </p>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5">
                    <button
                        type="button"
                        onClick={handleCopyTsv}
                        className="px-2.5 py-1 rounded-lg bg-[var(--bg-3)] hover:bg-[var(--cyan)]/20 border border-[var(--line)] hover:border-[var(--cyan)]/40 text-[var(--alu)] hover:text-[var(--cyan)] text-[10px] font-mono font-bold flex items-center gap-1 transition-all"
                        title={t12(currentLang, "Copy as TSV for Excel", "Excel / TSV olarak panoya kopyala")}
                    >
                        {copied ? <Check size={11} className="text-[var(--ok)]" /> : <Copy size={11} />}
                        <span>{copied ? (t12(currentLang, 'Copied!', 'Kopyalandı!')) : (t12(currentLang, 'Copy', 'Kopyala'))}</span>
                    </button>
                    <button
                        type="button"
                        onClick={handleDownloadCsv}
                        className="p-1.5 rounded-lg bg-[var(--bg-3)] hover:bg-[var(--line-strong)] border border-[var(--line)] text-[var(--alu-dim)] hover:text-white transition-all"
                        title={t12(currentLang, "Download CSV", "CSV Olarak İndir")}
                    >
                        <Download size={12} />
                    </button>
                    <button
                        type="button"
                        onClick={() => setIsExpanded(prev => !prev)}
                        className="p-1.5 rounded-lg bg-[var(--bg-3)] hover:bg-[var(--line-strong)] border border-[var(--line)] text-[var(--alu-dim)] hover:text-white transition-all"
                        title={isExpanded ? "Daralt" : "Genişlet"}
                    >
                        <ChevronDown size={14} className={`transition-transform duration-200 ${isExpanded ? 'rotate-180 text-[var(--cyan)]' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Table Content */}
            {isExpanded && (
                <div className="overflow-x-auto max-h-[380px] overflow-y-auto scrollbar-thin">
                    <table className="w-full text-left border-collapse text-[11px] font-mono">
                        <thead className="bg-[var(--bg-2)] sticky top-0 z-10 border-b border-[var(--line)] text-[9.5px] uppercase tracking-wider text-[var(--alu-dim)]">
                            <tr>
                                <th className="px-3 py-2 font-bold">{t12(currentLang, 'Parameter', 'Parametre')}</th>
                                <th className="px-2 py-2 font-bold text-center">{t12(currentLang, 'Sym', 'Sembol')}</th>
                                <th className="px-3 py-2 font-bold text-center text-[var(--cyan)]">{t12(currentLang, 'Pinion', 'Pinyon')} (z₁)</th>
                                <th className="px-3 py-2 font-bold text-center text-[var(--warn)]">{t12(currentLang, 'Gear', 'Çark')} (z₂)</th>
                                <th className="px-2 py-2 font-bold text-center text-[var(--alu-dim)]">{t12(currentLang, 'Unit', 'Birim')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--line)]/40">
                            {dataRows.map((row, idx) => {
                                const isClickable = !!row.dimKey;
                                const isSelected = row.dimKey && selectedDim === row.dimKey;

                                return (
                                    <tr
                                        key={idx}
                                        onClick={() => isClickable && onSelectDim(isSelected ? null : (row.dimKey || null))}
                                        className={`transition-all duration-150 ${
                                            isClickable ? 'cursor-pointer select-none group' : ''
                                        } ${
                                            isSelected 
                                                ? 'bg-[var(--cyan)]/20 text-cyan-100 font-bold shadow-[inset_0_0_12px_rgba(58,208,230,0.2)]' 
                                                : row.highlight
                                                ? 'bg-[var(--cyan)]/5 hover:bg-white/[0.04]'
                                                : 'hover:bg-white/[0.03]'
                                        }`}
                                        title={isClickable ? (isSelected ? (t12(currentLang, "Deselect", "Vurguyu kapat")) : (t12(currentLang, "Click to glow in SVG", "SVG'de parlatmak için tıkla"))) : undefined}
                                    >
                                        <td className="px-3 py-1.5 flex items-center gap-1.5">
                                            {isSelected ? (
                                                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping shrink-0" />
                                            ) : isClickable ? (
                                                <span className="w-1.5 h-1.5 rounded-full bg-white/20 group-hover:bg-cyan-400 shrink-0 transition-colors" />
                                            ) : null}
                                            <span className={isSelected ? 'text-cyan-300' : row.highlight ? 'text-white' : 'text-gray-300'}>
                                                {row.label}
                                            </span>
                                        </td>
                                        <td className="px-2 py-1.5 text-center text-cyan-400/70 font-bold">{row.symbol}</td>
                                        <td className={`px-3 py-1.5 text-center ${isSelected ? 'text-cyan-200 font-black' : 'text-gray-200'}`}>
                                            {row.v1}
                                        </td>
                                        <td className={`px-3 py-1.5 text-center ${isSelected ? 'text-cyan-200 font-black' : 'text-gray-200'}`}>
                                            {row.v2}
                                        </td>
                                        <td className="px-2 py-1.5 text-center text-gray-500 text-[10px]">{row.unit}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

function GearSVG2D({ 
    z1, 
    z2, 
    m, 
    mt, 
    beta = 0, 
    pressureAngle = 20, 
    a, 
    rpm, 
    isInternal = false, 
    isPrint = false, 
    x1 = 0, 
    x2 = 0,
    faceWidth = 20,
    selectedDim = null,
    onSelectDim,
    results,
    currentLang = 'tr',
}: any) {
    const precision = useGlobalPrecision();
    const effModule = mt && mt > 0 ? mt : (beta > 0 ? m / Math.cos(beta * (Math.PI / 180)) : m);
    const r1 = (effModule * z1) / 2;
    const r2 = (effModule * z2) / 2;

    const ratio = z2 / z1;
    const pinionRpm = rpm || 1450;

    // Interactive Kinetic Spin Engine: Drag to rotate, wheel to speed/reverse, fling coasting
    const speedFactor = pinionRpm > 0 ? Math.max(0.2, Math.min(2.5, pinionRpm / 1450)) : 1.0;
    const kinetic = useKineticSpin({
        mode: 'circular',
        nominalSpeedDegPerSec: 36 * speedFactor,
        autoPlay: !isPrint && pinionRpm > 0,
        dragSensitivity: 1.15,
        wheelSensitivity: 0.0035,
    });

    const angle1 = kinetic.angle % 360;
    // Exactly z1 * theta1 = z2 * theta2 for zero tooth drift
    // External mesh: opposing rotation direction (-angle1)
    // Internal ring gear: same rotation direction (+angle1)
    const angle2 = isInternal ? (angle1 * (z1 / z2)) % 360 : (-(angle1) * (z1 / z2)) % 360;

    if (isInternal) {
        const rOuter = r2 + effModule * 3.5;
        const scale = Math.min(120 / rOuter, 0.90);
        const scaledA = a * scale;
        const cx2 = 280;
        const cyCenter = 162;
        const cx1 = cx2 - scaledA;

        return (
            <div
                {...kinetic.containerProps}
                className="w-full h-full relative select-none"
                title={t12(currentLang, "🖱️ Drag / spin gears • Wheel to accelerate & reverse • Double-click to reset", "🖱️ Dişlileri elinle ittir / çevir • Fare tekerleğiyle hızlandır & yön değiştir • Çift tıkla sıfırla")}
            >
                {/* Tactile Motion Indicator HUD Badge */}
                {!isPrint && (
                    <div className="absolute top-3 right-3 z-30 flex items-center gap-1.5 bg-[var(--bg-1)] px-2.5 py-1.5 rounded-xl border border-[var(--line)] text-[10px] font-mono shadow-xl pointer-events-none">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                        <span className="text-cyan-300 font-bold">{formatEngineeringValue(Math.abs(kinetic.speedMultiplier), precision, false)}x {kinetic.direction === 1 ? 'CW' : 'CCW'}</span>
                    </div>
                )}

                {/* Laser Glowing Measurement Indicator HUD Badge */}
                {!isPrint && selectedDim && onSelectDim && (
                    <div className="absolute top-3 left-3 z-30 flex items-center gap-2 bg-[var(--bg-1)] px-3 py-1.5 rounded-xl border border-cyan-400/50 text-[11px] font-mono ">
                        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping shrink-0" />
                        <span className="text-cyan-300 font-bold">
                            {t12(currentLang, 'ACTIVE MEASURE: ', 'VURGULANAN ÖLÇÜ: ')}
                            <span className="text-white underline decoration-cyan-400 decoration-2">
                                {getDimName(selectedDim, currentLang)}
                            </span>
                        </span>
                        <button
                            type="button"
                            onClick={() => onSelectDim(null)}
                            className="ml-1 text-gray-400 hover:text-white p-0.5 rounded hover:bg-white/10 text-xs font-bold leading-none"
                            title={t12(currentLang, 'Clear', 'Vurgulamayı Kapat')}
                        >
                            ✕
                        </button>
                    </div>
                )}

                <svg viewBox="0 0 520 320" className="w-full h-full select-none" preserveAspectRatio="xMidYMid meet">
                    <defs>
                        <linearGradient id="metalPinionGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#818cf8" />
                            <stop offset="35%" stopColor="#4f46e5" />
                            <stop offset="70%" stopColor="#312e81" />
                            <stop offset="100%" stopColor="#1e1b4b" />
                        </linearGradient>
                        <linearGradient id="metalGearGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#c084fc" />
                            <stop offset="35%" stopColor="#9333ea" />
                            <stop offset="70%" stopColor="#6b21a8" />
                            <stop offset="100%" stopColor="#3b0764" />
                        </linearGradient>
                        <filter id="gearShadow" x="-20%" y="-20%" width="140%" height="140%">
                            <feDropShadow dx="2" dy="4" stdDeviation="5" floodColor="#000000" floodOpacity="0.75" />
                        </filter>
                        <filter id="meshGlow">
                            <feGaussianBlur stdDeviation="3" result="glow" />
                            <feMerge>
                                <feMergeNode in="glow" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                        <filter id="neonLaserGlow" x="-50%" y="-50%" width="200%" height="200%">
                            <feGaussianBlur stdDeviation="2.5" result="glow1" />
                            <feGaussianBlur stdDeviation="6" result="glow2" />
                            <feMerge>
                                <feMergeNode in="glow2" />
                                <feMergeNode in="glow1" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                        <filter id="amberLaserGlow" x="-50%" y="-50%" width="200%" height="200%">
                            <feGaussianBlur stdDeviation="2" result="glow1" />
                            <feGaussianBlur stdDeviation="5" result="glow2" />
                            <feMerge>
                                <feMergeNode in="glow2" />
                                <feMergeNode in="glow1" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                        <filter id="purpleLaserGlow" x="-50%" y="-50%" width="200%" height="200%">
                            <feGaussianBlur stdDeviation="2" result="glow1" />
                            <feGaussianBlur stdDeviation="5.5" result="glow2" />
                            <feMerge>
                                <feMergeNode in="glow2" />
                                <feMergeNode in="glow1" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>

                    {/* Dimension Line */}
                    <g opacity={isPrint ? 1 : 0.9}>
                        <line x1={cx1} y1={cyCenter - (r1 * scale) - 8} x2={cx1} y2={26} stroke="#38bdf8" strokeWidth="0.8" strokeDasharray="3 3" opacity={0.5} />
                        <line x1={cx2} y1={cyCenter - (r2 * scale) - 8} x2={cx2} y2={26} stroke="#38bdf8" strokeWidth="0.8" strokeDasharray="3 3" opacity={0.5} />
                        <line x1={cx1 + 4} y1={30} x2={cx2 - 4} y2={30} stroke="#38bdf8" strokeWidth="1.2" />
                        <rect x={((cx1 + cx2) / 2) - 120} y={20} width={240} height={20} rx="4" fill="#07090c" stroke="#243041" strokeWidth="0.8" opacity={0.95} />
                        <text x={(cx1 + cx2) / 2} y={34} textAnchor="middle" fill="#3ad0e6" fontSize="11" fontFamily="var(--font-mono), monospace" fontWeight="bold">
                            a = {formatEngineeringValue(a, precision, true)} mm ({t12(currentLang, 'Internal', 'İç Dişli')} / i = {formatEngineeringValue(ratio, precision, true)}:1)
                        </text>
                    </g>

                    <InternalRingGearShape2D 
                        cx={cx2} 
                        cy={cyCenter} 
                        rRef={r2 * scale} 
                        teeth={z2} 
                        m={m * scale} 
                        isPrint={isPrint} 
                        rotationAngle={angle2} 
                        initialAngle={180 / z2} 
                        profileShift={x2} 
                        helixAngle={beta} 
                        pressureAngle={pressureAngle}
                        faceWidth={faceWidth * scale}
                        outsideDiameter={results.da2 * scale}
                        kFactor={results.k2}
                    />
                    <GearShape2D 
                        cx={cx1} 
                        cy={cyCenter} 
                        rRef={r1 * scale} 
                        teeth={z1} 
                        m={m * scale} 
                        isPinion={true} 
                        isPrint={isPrint} 
                        rotationAngle={angle1} 
                        initialAngle={0} 
                        profileShift={x1} 
                        helixAngle={beta} 
                        pressureAngle={pressureAngle}
                        faceWidth={faceWidth * scale}
                        outsideDiameter={results.da1 * scale}
                        kFactor={results.k1}
                    />

                    {/* Glowing Measurement Overlay for Internal Mesh */}
                    <LaserDimensionOverlay
                        selectedDim={selectedDim}
                        cx1={cx1}
                        cx2={cx2}
                        cyCenter={cyCenter}
                        scale={scale}
                        results={results}
                        isInternal={true}
                        z1={z1}
                        z2={z2}
                        pressureAngle={pressureAngle}
                        helixAngle={beta}
                        x1={x1}
                        x2={x2}
                        a={a}
                        m={m}
                        currentLang={currentLang}
                    />
                </svg>
            </div>
        );
    }

    const scale = Math.min(200 / (r1 + r2), 1.15);
    const scaledA = a * scale;
    const cx1 = 260 - scaledA / 2;
    const cx2 = 260 + scaledA / 2;
    const cyCenter = 168;

    return (
        <div
            {...kinetic.containerProps}
            className="w-full h-full relative select-none"
            title={t12(currentLang, "🖱️ Drag / spin gears • Wheel to accelerate & reverse • Double-click to reset", "🖱️ Dişlileri elinle ittir / çevir • Fare tekerleğiyle hızlandır & yön değiştir • Çift tıkla sıfırla")}
        >
            {/* Tactile Motion Indicator HUD Badge */}
            {!isPrint && (
                <div className="absolute top-3 right-3 z-30 flex items-center gap-1.5 bg-[var(--bg-1)] px-2.5 py-1.5 rounded-xl border border-[var(--line)] text-[10px] font-mono shadow-xl pointer-events-none">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                    <span className="text-cyan-300 font-bold">{formatEngineeringValue(Math.abs(kinetic.speedMultiplier), precision, false)}x {kinetic.direction === 1 ? 'CW' : 'CCW'}</span>
                </div>
            )}

            {/* Laser Glowing Measurement Indicator HUD Badge */}
            {!isPrint && selectedDim && onSelectDim && (
                <div className="absolute top-3 left-3 z-30 flex items-center gap-2 bg-[var(--bg-1)] px-3 py-1.5 rounded-xl border border-cyan-400/50 text-[11px] font-mono ">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping shrink-0" />
                    <span className="text-cyan-300 font-bold">
                        {t12(currentLang, 'ACTIVE MEASURE: ', 'VURGULANAN ÖLÇÜ: ')}
                        <span className="text-white underline decoration-cyan-400 decoration-2">
                            {getDimName(selectedDim, currentLang)}
                        </span>
                    </span>
                    <button
                        type="button"
                        onClick={() => onSelectDim(null)}
                        className="ml-1 text-gray-400 hover:text-white p-0.5 rounded hover:bg-white/10 text-xs font-bold leading-none"
                        title={t12(currentLang, 'Clear', 'Vurgulamayı Kapat')}
                    >
                        ✕
                    </button>
                </div>
            )}

            {/* Helical Specification HUD Badge */}
            {!isPrint && (!selectedDim || !onSelectDim) && Math.abs(beta) > 0.05 && (
                <div className="absolute top-3 left-3 z-30 flex items-center gap-1.5 bg-[var(--bg-1)] px-2.5 py-1.5 rounded-xl border border-emerald-500/30 text-[10px] font-mono shadow-xl pointer-events-none text-emerald-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="font-bold">{t12(currentLang, 'HELICAL', 'HELİS')} β={beta}° • {t12(currentLang, 'Pinion', 'Pinyon')} {helixHandLabel(beta)} / {t12(currentLang, 'Gear', 'Çark')} {helixHandLabel(-beta)} • mt={formatEngineeringValue(effModule, precision, false)} mm • b={faceWidth} mm</span>
                </div>
            )}

            <svg viewBox="0 0 520 320" className="w-full h-full select-none" preserveAspectRatio="xMidYMid meet">
                <defs>
                    <linearGradient id="metalPinionGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#818cf8" />
                        <stop offset="35%" stopColor="#4f46e5" />
                        <stop offset="70%" stopColor="#312e81" />
                        <stop offset="100%" stopColor="#1e1b4b" />
                    </linearGradient>
                    <linearGradient id="metalGearGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#00e5ff" />
                        <stop offset="35%" stopColor="#0891b2" />
                        <stop offset="70%" stopColor="#0e7490" />
                        <stop offset="100%" stopColor="#164e63" />
                    </linearGradient>
                    <filter id="gearShadow" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="2" dy="4" stdDeviation="5" floodColor="#000000" floodOpacity="0.75" />
                    </filter>
                    <filter id="neonLaserGlow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="2.5" result="glow1" />
                        <feGaussianBlur stdDeviation="6" result="glow2" />
                        <feMerge>
                            <feMergeNode in="glow2" />
                            <feMergeNode in="glow1" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                    <filter id="amberLaserGlow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="2" result="glow1" />
                        <feGaussianBlur stdDeviation="5" result="glow2" />
                        <feMerge>
                            <feMergeNode in="glow2" />
                            <feMergeNode in="glow1" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                    <filter id="purpleLaserGlow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="2" result="glow1" />
                        <feGaussianBlur stdDeviation="5.5" result="glow2" />
                        <feMerge>
                            <feMergeNode in="glow2" />
                            <feMergeNode in="glow1" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                <g opacity={isPrint ? 1 : 0.9}>
                    <line x1={cx1} y1={cyCenter - (r1 * scale) - 8} x2={cx1} y2={50} stroke="#38bdf8" strokeWidth="0.8" strokeDasharray="3 3" opacity={0.5} />
                    <line x1={cx2} y1={cyCenter - (r2 * scale) - 8} x2={cx2} y2={50} stroke="#38bdf8" strokeWidth="0.8" strokeDasharray="3 3" opacity={0.5} />
                    <line x1={cx1 + 4} y1={54} x2={cx2 - 4} y2={54} stroke="#38bdf8" strokeWidth="1.2" />
                    <rect x={((cx1 + cx2) / 2) - 105} y={44} width={210} height={20} rx="4" fill="#07090c" stroke="#243041" strokeWidth="0.8" opacity={0.95} />
                    <text x={(cx1 + cx2) / 2} y={58} textAnchor="middle" fill="#3ad0e6" fontSize="11" fontFamily="var(--font-mono), monospace" fontWeight="bold">
                        a = {formatEngineeringValue(a, precision, true)} mm (i = {formatEngineeringValue(ratio, precision, true)}:1)
                    </text>
                </g>

                <GearShape2D 
                    cx={cx1} 
                    cy={cyCenter} 
                    rRef={r1 * scale} 
                    teeth={z1} 
                    m={m * scale} 
                    isPinion={true} 
                    isPrint={isPrint} 
                    rotationAngle={angle1} 
                    initialAngle={0} 
                    profileShift={x1} 
                    helixAngle={beta} 
                    pressureAngle={pressureAngle}
                    faceWidth={faceWidth * scale}
                    outsideDiameter={results.da1 * scale}
                    kFactor={results.k1}
                />
                <GearShape2D 
                    cx={cx2} 
                    cy={cyCenter} 
                    rRef={r2 * scale} 
                    teeth={z2} 
                    m={m * scale} 
                    isPinion={false} 
                    isPrint={isPrint} 
                    rotationAngle={angle2} 
                    initialAngle={180 / z2} 
                    profileShift={x2} 
                    helixAngle={-beta} 
                    pressureAngle={pressureAngle}
                    faceWidth={faceWidth * scale}
                    outsideDiameter={results.da2 * scale}
                    kFactor={results.k2}
                />

                {/* Glowing Measurement Overlay for External Mesh */}
                <LaserDimensionOverlay
                    selectedDim={selectedDim}
                    cx1={cx1}
                    cx2={cx2}
                    cyCenter={cyCenter}
                    scale={scale}
                    results={results}
                    isInternal={false}
                    z1={z1}
                    z2={z2}
                    pressureAngle={pressureAngle}
                    helixAngle={beta}
                    x1={x1}
                    x2={x2}
                    a={a}
                    m={m}
                    currentLang={currentLang}
                />
            </svg>
        </div>
    );
}
