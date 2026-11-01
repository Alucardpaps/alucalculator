/**
 * modules/mechanical/CylinderDesign/index.tsx
 * 
 * 1:1 Complete Component Hydraulic & Pneumatic Cylinder Design View
 * Conforms to Unified Desk Architecture (UDA) and AluCalc Instrument Design System.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { 
    useCylinderDesignStore, 
    CYLINDER_PRESETS,
    cylinderUnitConverters,
    CylinderPressureUnit,
    CylinderLinearUnit,
    CylinderForceUnit,
    CylinderFlowUnit
} from './store';
import { useI18nStore } from '@/store/i18nStore';
import { useGlobalPrecision, formatEngineeringValue } from '@/components/calculator-kit/precisionUtils';
import { 
    ISO_3320_BORES, 
    CylinderFluidMedium, 
    CylinderMountingStyle,
    BarrelConnectionStyle,
    RodEndType,
    CylinderConstruction,
    CylinderCatalogSeries,
    CylinderComponentDimension
} from './engine';
import { CylinderSectionSVG } from '@/components/visualizers/CylinderSectionSVG';
import { BucklingCurveSVG } from './BucklingCurveSVG';
import { MountingMatrixGrid } from './MountingMatrixGrid';
import { CushioningProfileSVG } from './CushioningProfileSVG';
import { SealEnvelopeSVG } from './SealEnvelopeSVG';
import { ManufacturingPassportCard } from './ManufacturingPassportCard';
import { CylinderReportModal } from './CylinderReportModal';
import { CrossModuleBridge } from '@/system/crossModuleBridge';
import { 
    Box, 
    ShieldCheck, 
    AlertTriangle, 
    Sliders, 
    Activity, 
    Layers, 
    FileText, 
    Check, 
    Copy, 
    Droplets, 
    Wind, 
    CheckCircle2, 
    Info, 
    Gauge, 
    Wrench,
    ArrowRight,
    Play,
    Pause,
    Compass,
    Zap,
    Scale,
    Thermometer,
    Sparkles,
    Settings2,
    Anchor,
    Link2,
    Disc,
    ChevronDown,
    ChevronUp,
    PanelLeftClose,
    PanelLeftOpen,
    Columns,
    Search,
    Download,
    Filter,
    ChevronLeft,
    ChevronRight,
    Cpu,
    Maximize2
} from 'lucide-react';
import { t12 } from '@/locales/t12';

function getLocalizedPart(item: CylinderComponentDimension, language: string): {
    name: string;
    description: string;
    material: string;
    notes?: string;
} {
    if (language === 'tr') {
        return {
            name: item.name,
            description: item.description,
            material: item.material,
            notes: item.notes,
        };
    }

    switch (item.partNumber) {
        case 1:
            return {
                name: 'Cylinder Barrel (Honed Tube)',
                description: 'H8 precision honed cylinder tube, Ra <= 0.4 µm',
                material: item.material.includes('6063') ? 'AlMgSi0.5 (Al 6063-T6)' : 'St 52-3 BK+S (E355)',
                notes: item.notes
                    ? item.notes.replace('Et kalınlığı', 'Wall thickness').replace('Emniyet', 'Safety')
                    : undefined,
            };
        case 2:
            return {
                name: 'Piston Rod (Chrome Plated)',
                description: '25 µm hard chrome plated rod, f7 tolerance',
                material: item.material.includes('20mnv6') || item.material.includes('20MnV6')
                    ? '20MnV6 Chrome'
                    : item.material.includes('42crmo4') || item.material.includes('42CrMo4')
                    ? '42CrMo4+QT Chrome'
                    : 'C45E Hard Chrome Plated',
                notes: item.notes
                    ? item.notes.replace('Burkulma Güvenliği', 'Buckling Safety')
                    : undefined,
            };
        case 3:
            return {
                name: 'Piston Head Body',
                description: 'Double-acting piston body with seal & guide grooves',
                material: 'GGG-40 Ductile Iron / C45',
                notes: item.notes
                    ? item.notes.replace('POM Yataklama Bandı Kanallı', 'POM Guide Band Grooves')
                    : undefined,
            };
        case 4:
            return {
                name: 'Front Rod Gland (Head)',
                description: 'Rod seal, wiper scraper & guide bushing housing',
                material: 'GGG-40 Ductile Iron / C45 Steel',
                notes: item.notes
                    ? item.notes.replace('Boruya vidalı veya flanş montajlı', 'Threaded or flanged tube mount')
                    : undefined,
            };
        case 5:
            return {
                name: 'Rear End Cap / Base',
                description: 'Welded or flanged base with rear clevis mount',
                material: 'St 52-3 (E355) / Forged Steel',
                notes: item.notes
                    ? item.notes.replace('Tam penetrasyonlu kaynak ağızlı', 'Full-penetration weld prep')
                    : undefined,
            };
        case 6:
            return {
                name: 'Piston Sealing Set',
                description: item.description
                    .replace('Kompakt Çift Etkili Piston', 'Compact Double-Acting Piston')
                    .replace('Kompakt 3 Parça Piston Seti', 'Compact 3-Piece Piston Set'),
                material: item.material
                    .replace('NBR Sızdırmazlık', 'NBR Seal')
                    .replace('Termoplastik Destek', 'Thermoplastic Anti-Extrusion')
                    .replace('POM Yataklama', 'POM Guide Rings'),
                notes: item.notes
                    ? item.notes.replace('ISO 7425/1 uyumlu kanal montajı', 'ISO 7425/1 groove installation')
                    : undefined,
            };
        case 7:
            return {
                name: 'Rod Seal (U-Cup)',
                description: item.description,
                material: item.material,
                notes: item.notes
                    ? item.notes.replace('Maksimum sızıntısız basınç', 'Max leak-free pressure')
                    : undefined,
            };
        case 8:
            return {
                name: 'Wiper Seal (Scraper)',
                description: item.description,
                material: item.material,
                notes: item.notes
                    ? item.notes.replace('Metal kafesli / pres geçme kanal', 'Metal-cased / press-fit snap-in')
                    : undefined,
            };
        case 9:
            return {
                name: 'Internal Rod O-Ring (Static)',
                description: item.description,
                material: item.material,
                notes: item.notes
                    ? item.notes.replace('Piston-mil geçiş sızıntı önleme', 'Piston-rod joint leak prevention')
                    : undefined,
            };
        case 10:
            return {
                name: 'Tube-to-Gland O-Ring (Static)',
                description: item.description,
                material: item.material,
                notes: item.notes
                    ? item.notes.replace('Gövde statik sızdırmazlık contası', 'Tube static sealing gasket')
                    : undefined,
            };
        case 11:
            return {
                name: 'Piston Lock Nut',
                description: 'Metric fine thread self-locking fastener',
                material: 'Grade 8.8 / 10.9 Heat Treated Steel',
                notes: item.notes
                    ? item.notes.replace('Sıkma torku kontrollü', 'Controlled torque tightening')
                    : undefined,
            };
        default:
            return {
                name: item.name,
                description: item.description,
                material: item.material,
                notes: item.notes,
            };
    }
}

export default function CylinderDesignModule() {
    const { language } = useI18nStore();
    const precision = useGlobalPrecision();
    const {
        fluidMedium,
        operatingPressureBar,
        peakPressureBar,
        boreDiameterD,
        rodDiameterD,
        strokeS,
        mountingStyle,
        barrelConnectionStyle,
        flangeBoltGrade,
        trunnionPositionMm,
        footMountOffsetMm,
        pumpFlowRateLMin,
        mechanicalEfficiency,
        pistonSealType,
        rodSealType,
        wiperType,
        hasCushioningFront,
        hasCushioningRear,
        rodMaterialId,
        tubeMaterialId,
        movingMassKg,
        rodEndType,
        cylinderConstruction,
        horizontalMounting,
        catalogSeries,
        pressureUnit,
        linearUnit,
        forceUnit,
        flowUnit,
        strokeProgress,
        isPlaying,
        playbackSpeed,
        selectedPartNumber,
        activeTab,
        presetId,
        result,
        metadata,
        setPressureUnit,
        setLinearUnit,
        setForceUnit,
        setFlowUnit,
        setUnitSystem,
        setCatalogSeries,
        setFluidMedium,
        setOperatingPressure,
        setPeakPressure,
        setBoreDiameter,
        setRodDiameter,
        setStroke,
        setMountingStyle,
        setBarrelConnectionStyle,
        setFlangeBoltGrade,
        setTrunnionPosition,
        setFootMountOffset,
        setPumpFlowRate,
        setMechanicalEfficiency,
        setPistonSealType,
        setRodSealType,
        setWiperType,
        setCushioning,
        setRodMaterial,
        setTubeMaterial,
        setMovingMass,
        setRodEndType,
        setCylinderConstruction,
        setHorizontalMounting,
        setStrokeProgress,
        setIsPlaying,
        togglePlay,
        setPlaybackSpeed,
        stepAnimation,
        setSelectedPartNumber,
        setActiveTab,
        loadPreset
    } = useCylinderDesignStore();

    const [copied, setCopied] = useState(false);
    const [exportSuccess, setExportSuccess] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [viewMode, setViewMode] = useState<'split' | 'cad'>('split');
    const [openSections, setOpenSections] = useState({
        fluid: true,
        sizing: true,
        mounting: false,
        sealing: false
    });

    const toggleSection = (key: keyof typeof openSections) => {
        setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const isPneumatic = fluidMedium === 'pneumatic_air';
    const currentBoreOption = ISO_3320_BORES.find(b => b.boreD === boreDiameterD) ?? ISO_3320_BORES[5];
    const selectedPart = result?.billOfMaterials.find(p => p.partNumber === selectedPartNumber) ?? null;

    // BOM search & category state
    const [bomSearch, setBomSearch] = useState('');
    const [bomCategory, setBomCategory] = useState<'all' | 'structure' | 'seals' | 'hardware'>('all');
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);

    // Tab scrolling reference
    const tabScrollRef = React.useRef<HTMLDivElement>(null);
    const scrollTabs = (direction: 'left' | 'right') => {
        if (tabScrollRef.current) {
            tabScrollRef.current.scrollBy({ left: direction === 'left' ? -220 : 220, behavior: 'smooth' });
        }
    };

    // ISO 3320 / DIN 24338 Area Ratio phi = A1 / A2 = D^2 / (D^2 - d^2)
    const areaRatioPhi = (boreDiameterD * boreDiameterD) / Math.max(1, (boreDiameterD * boreDiameterD - rodDiameterD * rodDiameterD));

    // Export BOM to CSV (UTF-8 BOM encoded for Excel compatibility)
    const exportBOMToCSV = () => {
        if (!result) return;
        const headers = [
            t12(language, 'No', 'No'),
            t12(language, 'Component Name', 'Bilesen Adi'),
            t12(language, 'Standard / Code', 'Standart / Kod'),
            t12(language, 'Material', 'Malzeme'),
            t12(language, 'Dimensions (mm)', 'Boyutlar (mm)'),
            t12(language, 'Mass (kg)', 'Kutle (kg)'),
            t12(language, 'Engineering Note', 'Muhendislik Notu')
        ];
        const rows = result.billOfMaterials.map(item => {
            const loc = getLocalizedPart(item, language);
            return [
                item.partNumber,
                `"${loc.name.replace(/"/g, '""')}"`,
                `"${item.standard.replace(/"/g, '""')}"`,
                `"${loc.material.replace(/"/g, '""')}"`,
                `"Ø${item.outerDiaMm} x ${item.lengthMm}"`,
                item.weightKg.toFixed(2),
                `"${(loc.notes || '').replace(/"/g, '""')}"`
            ];
        });
        const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `alucalc_cylinder_bom_D${boreDiameterD}_d${rodDiameterD}_S${strokeS}mm.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Check URL preset param
    useEffect(() => {
        if (typeof window !== 'undefined') {
            (window as any).__cylinderStore = useCylinderDesignStore;
            const urlParams = new URLSearchParams(window.location.search);
            const p = urlParams.get('preset');
            if (p) {
                loadPreset(p);
            }
        }
    }, [loadPreset]);

    // Animation frame loop
    useEffect(() => {
        if (!isPlaying) return;
        let lastTime = performance.now();
        let frameId: number;

        const loop = (currentTime: number) => {
            const deltaSec = Math.min(0.1, (currentTime - lastTime) / 1000);
            lastTime = currentTime;
            stepAnimation(deltaSec);
            frameId = requestAnimationFrame(loop);
        };

        frameId = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(frameId);
    }, [isPlaying, stepAnimation]);

    // Handle 3D CAD export
    const handleExportTo3D = () => {
        if (!result) return;
        const mMatch = result.tieRodSize ? result.tieRodSize.match(/M(\d+)/i) : null;
        const tieDia = mMatch 
            ? parseInt(mMatch[1], 10)
            : (boreDiameterD >= 100 ? 20 : boreDiameterD >= 80 ? 16 : 12);

        const iso6020SquareE = boreDiameterD <= 25 ? 40
            : boreDiameterD <= 32 ? 45
            : boreDiameterD <= 40 ? 65
            : boreDiameterD <= 50 ? 75
            : boreDiameterD <= 63 ? 90
            : boreDiameterD <= 80 ? 115
            : boreDiameterD <= 100 ? 130
            : boreDiameterD <= 125 ? 165
            : boreDiameterD <= 160 ? 205
            : 245;

        const squareE = Math.max(iso6020SquareE, Math.round(result.tubeOuterDiaDo + tieDia * 2 + 18));

        CrossModuleBridge.exportCylinderTo3D({
            boreD: boreDiameterD,
            rodD: rodDiameterD,
            strokeS: strokeS,
            tubeOD: result.tubeOuterDiaDo,
            tubeWallT: result.tubeWallThicknessT,
            closedLengthMm: result.closedLengthMm,
            stopTubeLengthMm: result.stopTubeRecommendedLengthMm,
            needsStopTube: result.needsStopTube,
            hasTieRods: barrelConnectionStyle === 'tie_rod_studs' || cylinderConstruction === 'tie_rod_iso6020_2' || mountingStyle.startsWith('extended_tie_rods_mx'),
            tieRodDiaMm: tieDia,
            tieRodCount: result.tieRodCount || 4,
            tieRodTorqueNm: result.tieRodTighteningTorqueNm,
            squareE,
            pistonLengthMm: result.pistonLengthMm,
            glandLengthMm: result.glandLengthMm,
            rearCapLengthMm: result.rearCapLengthMm,
            cushionLengthMm: result.cushionLengthMm,
            cushionSpearDiaMm: result.cushionSpearDiaMm,
            portSize: result.recommendedPortSize,
            portInnerDiaMm: result.portInnerDiaMm,
            portThreadStandard: result.portThreadStandard,
            operatingPressureBar: operatingPressureBar,
            pushForceKN: result.pushForceKN,
            pullForceKN: result.pullForceKN,
            barrelConnectionStyle,
            mountingStyle,
            rodEndType,
            rodEndThread: result.rodEndThread,
            clevisPinDiaMm: result.clevisPinDiaMm,
            sphericalBearingDesignation: result.sphericalBearingDesignation,
            trunnionPositionMm,
            hasTrunnion: result.hasTrunnion,
            trunnionPinDiaMm: result.trunnionPinDiaMm,
            trunnionPinLengthMm: result.trunnionPinLengthMm,
            flangeBoltCount: result.flangeBoltCount,
            flangeBoltSize: result.flangeBoltSize,
            flangeBoltTorqueNm: result.flangeBoltTorqueNm,
            flangeThicknessMm: result.flangeThicknessMm,
            footOffsetMm: result.footOffsetMm,
            pistonSealType,
            rodSealType,
            wiperType,
            hasCushioningFront,
            hasCushioningRear,
            fluidMedium,
            cylinderConstruction,
            flangeBoltGrade,
            switchWindow: true
        });
        setExportSuccess(true);
        setTimeout(() => setExportSuccess(false), 3000);
    };

    // Copy full engineering report
    const copyReport = () => {
        if (!result) return;
        const text = `=== ${t12(language, 'ALUCALC 1:1 HYDRAULIC & PNEUMATIC CYLINDER DESIGN REPORT', 'ALUCALC 1:1 HİDROLİK & PNÖMATİK SİLİNDİR MÜHENDİSLİK RAPORU')} ===
${t12(language, 'Calculation Code', 'Hesap Kodu')}: ${metadata?.calculationId ?? 'CYL-DESIGN'}
${t12(language, 'Standards Cited', 'Referans Standartlar')}: ISO 6020-2, ISO 6022, ISO 3320, ISO 12240-1, DIN 2413, DIN 24338, ISO 6982, ISO 8132, VDI 2230
${t12(language, 'Fluid Type', 'Akışkan Tipi')}: ${isPneumatic ? t12(language, 'Pneumatic (Air)', 'Pnömatik (Basınçlı Hava)') : t12(language, 'Hydraulic (Mineral Oil)', 'Hidrolik (Mineral Yağ)')}
${t12(language, 'Operating Pressure', 'Çalışma Basıncı')}: ${operatingPressureBar} bar (${t12(language, 'Peak:', 'Pik:')} ${peakPressureBar} bar) | ${t12(language, 'Flow Rate', 'Debi')}: ${pumpFlowRateLMin} L/dak
${t12(language, 'Geometry', 'Geometri')}: ${t12(language, 'Tube', 'Boru')} Ø${result.tubeInnerDiaD} mm (H8) / ${t12(language, 'Outer', 'Dış')} Ø${result.tubeOuterDiaDo} mm (t=${result.tubeWallThicknessT} mm) | ${t12(language, 'Rod', 'Mil')} Ø${rodDiameterD} mm (f7) | ${t12(language, 'Stroke', 'Strok')}: ${strokeS} mm
${t12(language, 'Mounting', 'Bağlantı Şekli')}: ${mountingStyle} (${t12(language, 'Buckling Factor', 'Burkulma Faktörü')} nu=${result.effectiveBucklingFactorNu}, Lk=${result.bucklingLengthLkMm} mm)
${t12(language, 'Barrel Connection', 'Gövde Bağlantısı')}: ${barrelConnectionStyle} (${t12(language, 'Construction', 'Konstrüksiyon')}: ${cylinderConstruction})
${t12(language, 'Moving Mass', 'Hareketli Kütle')}: ${movingMassKg} kg | ${t12(language, 'Rod End', 'Mil Ucu')}: ${rodEndType} (${result.rodEndThread})
-----------------------------------------------------------
${t12(language, 'KINEMATICS & FORCES:', 'KİNEMATİK VE KUVVETLER:')}
· ${t12(language, 'Push Area A1:', 'İtme Alanı A1:')} ${result.pushAreaCm2} cm² | ${t12(language, 'Push Force F_push:', 'İtme Kuvveti F_push:')} ${result.pushForceKN} kN (${Math.round(result.pushForceKN * 101.97)} kgf)
· ${t12(language, 'Pull Area A2:', 'Çekme Alanı A2:')} ${result.pullAreaCm2} cm² | ${t12(language, 'Pull Force F_pull:', 'Çekme Kuvveti F_pull:')} ${result.pullForceKN} kN (${Math.round(result.pullForceKN * 101.97)} kgf)
· ${t12(language, 'Extension Speed:', 'İlerleme Hızı:')} ${result.pushSpeedMPerSec} m/s (${result.pushStrokeTimeSec.toFixed(2)} s) | ${t12(language, 'Retraction Speed:', 'Çekilme Hızı:')} ${result.pullSpeedMPerSec} m/s (${result.pullStrokeTimeSec.toFixed(2)} s)
· ${t12(language, 'Hydraulic Power Required:', 'Gerekli Hidrolik Güç:')} ${result.hydraulicPowerKW} kW | ${t12(language, 'Heat Dissipation:', 'Sürekli Isı Kaybı:')} ${result.heatGenerationKW} kW
-----------------------------------------------------------
${t12(language, 'STRENGTH & BUCKLING (ISO/TR 10461 & DIN 2413):', 'MUKAVEMET VE BURKULMA (ISO/TR 10461 & DIN 2413):')}
· ${t12(language, 'Tube Hoop Stress:', 'Boru Teğetsel Gerilmesi:')} ${result.tubeHoopStressMPa} MPa | ${t12(language, 'Tube Yield SF:', 'Boru Akma SF:')} ${result.tubeYieldSafetyFactor} (Min: 1.50)
· ${t12(language, 'Tube Burst Pressure:', 'Boru Patlama Basıncı:')} ${result.tubeBurstPressureBar} bar (${t12(language, 'Burst SF:', 'Patlama SF:')} ${result.tubeBurstSafetyFactor})
· ${t12(language, 'Slenderness Ratio λ:', 'Narinlik Oranı λ:')} ${result.rodSlendernessRatio} (${t12(language, 'Transition λ_g:', 'Geçiş Narinliği λ_g:')} ${result.transitionSlendernessLambdaG})
· ${t12(language, 'Buckling Regime:', 'Burkulma Rejimi:')} ${result.bucklingRegime === 'euler_elastic' ? t12(language, 'Euler Elastic (λ >= λ_g)', 'Euler Elastik (λ >= λ_g)') : t12(language, 'Tetmajer / Rankine Inelastic (λ < λ_g)', 'Tetmajer / Rankine İnelastik (λ < λ_g)')}
· ${t12(language, 'Critical Buckling Load F_k:', 'Kritik Burkulma Yükü F_k:')} ${result.criticalBucklingForceKN} kN | ${t12(language, 'Buckling Safety Factor:', 'Burkulma Güvenlik Katsayısı:')} ${result.bucklingSafetyFactor} (Min: 3.50)
· ${t12(language, 'Max Permissible Stroke:', 'İzin Verilen Maksimum Strok:')} ${result.maxPermissibleStrokeMm} mm
· Stop Tube: ${result.needsStopTube ? `${t12(language, 'REQUIRED', 'GEREKLİ')} (L_stop = ${result.stopTubeRecommendedLengthMm} mm)` : t12(language, 'Not Required', 'Gereksiz')}
· ${t12(language, 'Horizontal Rod Sag:', 'Yatay Mil Sehimi (Self-weight Sag):')} ${result.maxHorizontalDeflectionMm} mm (${result.isDeflectionAcceptable ? t12(language, 'ACCEPTABLE', 'UYGUN') : t12(language, 'WARNING: Guide Gland Must Be Supported', 'UYARI: Destek Bileziği Gerekli')})
-----------------------------------------------------------
${t12(language, 'BARREL & MOUNTING VERIFICATION (ISO 6020-2 / ISO 6022 / VDI 2230):', 'GÖVDE VE MONTAJ TAHKİKLERİ (ISO 6020-2 / ISO 6022 / VDI 2230):')}
${result.flangeBoltCount > 0 ? `· ${t12(language, 'Flange Bolts:', 'Flanş Cıvataları:')} ${result.flangeBoltCount}x ${result.flangeBoltSize} (${t12(language, 'Grade', 'Kalite')} ${flangeBoltGrade}) | ${t12(language, 'Tension:', 'Çekme:')} ${result.flangeBoltTensileStressMPa} MPa | ${t12(language, 'Torque:', 'Tork:')} ${result.flangeBoltTorqueNm} Nm | SF: ${result.flangeBoltSafetyFactor} | ${t12(language, 'Flange t:', 'Flanş t:')} ${result.flangeThicknessMm} mm\n` : ''}${result.tieRodCount > 0 ? `· ${t12(language, 'Tie-Rods:', 'Gergi Saplamaları:')} ${result.tieRodCount}x ${result.tieRodSize} | ${t12(language, 'Tension:', 'Çekme:')} ${result.tieRodTensileStressMPa} MPa | ${t12(language, 'Torque:', 'Tork:')} ${result.tieRodTighteningTorqueNm} Nm | SF: ${result.tieRodSafetyFactor}\n` : ''}${result.isThreadedGland ? `· ${t12(language, 'Threaded Gland:', 'Vidalı Boğaz:')} ${result.glandThreadSize} | ${t12(language, 'Thread Shear Stress:', 'Diş Kayma Gerilmesi:')} ${result.glandThreadShearStressMPa} MPa | SF: ${result.glandThreadSafetyFactor}\n` : ''}${result.hasTrunnion ? `· ${t12(language, 'Trunnion Pin:', 'Muylu Pimi:')} Ø${result.trunnionPinDiaMm} x ${result.trunnionPinLengthMm} mm | ${t12(language, 'Shear:', 'Kayma:')} ${result.trunnionShearStressMPa} MPa | ${t12(language, 'Bending:', 'Eğilme:')} ${result.trunnionBendingStressMPa} MPa | ${t12(language, 'Bearing Pressure:', 'Yatak Basıncı:')} ${result.trunnionBearingPressureMPa} MPa | SF: ${result.trunnionSafetyFactor}\n` : ''}${result.hasSphericalBearing ? `· ${t12(language, 'Spherical Bearing:', 'Oynak Rulman:')} ${result.sphericalBearingDesignation} | ${t12(language, 'Static C0:', 'Statik C0:')} ${result.sphericalBearingStaticCapacityKN} kN | SF: ${result.sphericalBearingSafetyFactor} | ${t12(language, 'Tilt Angle:', 'Salınım Açısı:')} ±${result.sphericalBearingTiltAngleDeg}°\n` : ''}${mountingStyle === 'side_lugs_ms2' || mountingStyle === 'foot_mount' ? `· ${t12(language, 'Foot Overturn Moment:', 'Ayak Devirme Momenti:')} ${result.footOverturnMomentNm} Nm (h=${result.footOffsetMm} mm) | ${t12(language, 'Rear Bolt Tension:', 'Arka Cıvata Çekme:')} ${(result.footBoltTensileForceN / 1000).toFixed(2)} kN | ${t12(language, 'Base Shear:', 'Taban Kesme:')} ${(result.footBoltShearForceN / 1000).toFixed(2)} kN\n` : ''}· ${t12(language, 'Clevis Pin Dia:', 'Mafsal Pimi Çapı:')} Ø${result.clevisPinDiaMm} mm | ${t12(language, 'Shear Stress:', 'Kayma Gerilmesi:')} ${result.clevisPinShearStressMPa} MPa | ${t12(language, 'Bearing Pressure:', 'Yatak Basıncı:')} ${result.clevisPinBearingPressureMPa} MPa
-----------------------------------------------------------
${t12(language, 'END CUSHIONING & PORT HYDRAULICS (ISO 6020-2 / ISO 6149):', 'YASTIKLAMA VE PORT HİDROLİĞİ (ISO 6020-2 / ISO 6149):')}
· ${t12(language, 'Kinetic Energy E_k:', 'Kinetik Enerji E_k:')} ${result.kineticEnergyJoules} Joules | ${t12(language, 'Deceleration:', 'Yastıklama Yavaşlama İvmesi:')} ${result.cushioningDecelerationMPerSec2} m/s²
· ${t12(language, 'Peak Cushioning Pressure:', 'Tepe Yastıklama Basıncı:')} ${result.peakCushioningPressureBar} bar (${result.isCushioningPressureSafe ? t12(language, 'SAFE (<= 1.5 p_n)', 'GÜVENLİ (<= 1.5 p_n)') : t12(language, 'EXCESS PRESSURE!', 'AŞIRI BASINÇ!')})
· ${t12(language, 'Recommended Port:', 'Önerilen Port Ölçüsü:')} ${result.recommendedPortSize} (${result.portThreadStandard}) | ${t12(language, 'Port Velocity:', 'Port Akış Hızı:')} ${result.portFluidVelocityMPerSec} m/s (${result.portVelocityRating})
· ${t12(language, 'Port Pressure Drop:', 'Port Basınç Düşüşü:')} ${result.portPressureDropBar} bar | ${t12(language, 'Reynolds Number:', 'Reynolds Sayısı:')} ${result.reynoldsNumber}
· ${t12(language, 'Oil Volume:', 'Yağ Hacmi:')} ${t12(language, 'Extended', 'Açık')} ${result.oilVolumeExtendedLiters} L / ${t12(language, 'Retracted', 'Kapalı')} ${result.oilVolumeRetractedLiters} L / ${t12(language, 'Delta', 'Fark')}: ${result.oilDifferentialLiters} L | ${t12(language, 'Min Tank:', 'Min Depo:')} ${result.minTankVolumeLiters} L
-----------------------------------------------------------
${t12(language, 'SEALING & PROCUREMENT BOM:', 'SIZDIRMAZLIK VE PARÇA LİSTESİ:')}
· ${t12(language, 'Piston Seal:', 'Piston Keçesi:')} ${result.sealingBOM.pistonSeal}
· ${t12(language, 'Rod Seal:', 'Boğaz Keçesi:')} ${result.sealingBOM.rodSeal}
· ${t12(language, 'Wiper Scraper:', 'Toz Sıyırıcı:')} ${result.sealingBOM.wiperSeal}
· ${t12(language, 'Guide Bands:', 'Kılavuz Yataklama:')} ${result.sealingBOM.pistonGuideRings}
· ${t12(language, 'Internal Static O-Ring:', 'Mil İçi Statik O-Ring:')} ${result.sealingBOM.internalRodORing}
· ${t12(language, 'Tube/Gland O-Ring:', 'Boru/Boğaz O-Ringi:')} ${result.sealingBOM.tubeGlandORing}
· ${t12(language, 'Total Mass:', 'Toplam Kütle:')} ${result.totalCylinderMassKg} kg
===========================================================`;
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="w-full h-full min-h-0 flex flex-col bg-[var(--bg-0)] text-[var(--ink)] font-sans select-none overflow-hidden">
            {/* Top Bar Readout */}
            <div className="flex flex-wrap items-center justify-between px-4 py-2 bg-[var(--bg-1)] border-b border-[var(--line)] gap-2 shrink-0">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded bg-[var(--cyan)]/10 border border-[var(--cyan)]/30 flex items-center justify-center text-[var(--cyan)]">
                        <Box size={18} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xs font-bold text-white tracking-wide uppercase font-mono">
                                {t12(language, 'Hydraulic & Pneumatic Cylinder 1:1 Design', 'Hidrolik & Pnömatik Silindir 1:1 Tasarımı')}
                            </h1>
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--cyan)]/20 text-[var(--cyan)] font-mono">
                                ISO 6020-2
                            </span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--std)]/20 text-[var(--std)] font-mono">
                                DIN 2413
                            </span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--ok)]/20 text-[var(--ok)] font-mono">
                                ISO/TR 10461
                            </span>
                        </div>
                        <p className="text-[10px] text-[var(--alu-dim)] font-mono">
                            {t12(language, 'Honed Tube · Chrome Rod · Piston · Front Cover · Kastaş Sealing · Euler/Tetmajer Buckling · 3D Export', 'Honed Boru · Kromlu Mil · Piston · Ön Kapak · Kastaş Sızdırmazlık · Euler/Tetmajer Burkulma · 3D CAD')}
                        </p>
                    </div>
                </div>

                {/* Status metrics pill & Action buttons */}
                {result && (
                    <div className="flex items-center gap-2">
                        {/* Overall Safety Tag */}
                        <div className={`px-2 py-1 rounded border flex items-center gap-1.5 text-xs font-mono font-bold ${
                            result.isDesignSafeOverall 
                                ? 'bg-[var(--ok)]/10 border-[var(--ok)]/40 text-[var(--ok)]' 
                                : 'bg-[var(--bad)]/10 border-[var(--bad)]/40 text-[var(--bad)]'
                        }`}>
                            {result.isDesignSafeOverall ? <ShieldCheck size={14} /> : <AlertTriangle size={14} />}
                            <span>SF = {formatEngineeringValue(result.bucklingSafetyFactor, precision, true)}</span>
                        </div>

                        {/* Force & Velocity Readouts with Unit Badges */}
                        <div className="hidden xl:flex items-center gap-3 px-2.5 py-1 rounded bg-[var(--bg-2)] border border-[var(--line)] text-[11px] font-mono">
                            <div>
                                <span className="text-[var(--alu-dim)]">{t12(language, 'Push:', 'İtme:')} </span>
                                <span className="text-[var(--cyan)] font-bold">
                                    {formatEngineeringValue(cylinderUnitConverters.force.fromBase(result.pushForceKN, forceUnit), precision, true)} {forceUnit}
                                </span>
                            </div>
                            <div className="w-[1px] h-3 bg-[var(--line)]" />
                            <div>
                                <span className="text-[var(--alu-dim)]">{t12(language, 'Pull:', 'Çekme:')} </span>
                                <span className="text-[var(--warn)] font-bold">
                                    {formatEngineeringValue(cylinderUnitConverters.force.fromBase(result.pullForceKN, forceUnit), precision, true)} {forceUnit}
                                </span>
                            </div>
                            <div className="w-[1px] h-3 bg-[var(--line)]" />
                            <div>
                                <span className="text-[var(--alu-dim)]">{t12(language, 'Tube t:', 'Boru t:')} </span>
                                <span className="text-white font-bold">
                                    {formatEngineeringValue(cylinderUnitConverters.linear.fromBase(result.tubeWallThicknessT, linearUnit), precision, true)} {linearUnit}
                                </span>
                            </div>
                        </div>

                        {/* Global Unit System Switcher */}
                        <div className="flex items-center rounded border border-[var(--line)] overflow-hidden bg-[var(--bg-2)] p-0.5 text-[10px] font-mono">
                            {(['metric', 'si', 'imperial'] as const).map((sys) => (
                                <button
                                    key={sys}
                                    type="button"
                                    onClick={() => setUnitSystem(sys)}
                                    className={`px-2 py-0.5 rounded transition-all font-bold cursor-pointer ${
                                        (sys === 'metric' && pressureUnit === 'bar' && linearUnit === 'mm' && forceUnit === 'kN') ||
                                        (sys === 'si' && pressureUnit === 'MPa' && linearUnit === 'mm') ||
                                        (sys === 'imperial' && pressureUnit === 'psi' && linearUnit === 'in')
                                            ? 'bg-[var(--cyan)]/25 text-[var(--cyan)] '
                                            : 'text-[var(--alu-dim)] hover:text-white'
                                    }`}
                                    title={sys === 'metric' ? 'Metric System (bar, mm, kN, L/min)' : sys === 'si' ? 'SI Units (MPa, mm, kN, L/min)' : 'US Customary / Imperial (psi, in, lbf, gpm)'}
                                >
                                    {sys === 'metric' ? 'bar' : sys === 'si' ? 'MPa' : 'psi/in'}
                                </button>
                            ))}
                        </div>

                        {/* Clean View Mode Switcher: Split vs Full View */}
                        <div className="flex items-center rounded border border-[var(--line)] overflow-hidden bg-[var(--bg-2)] p-0.5 text-[10px] font-mono">
                            <button
                                type="button"
                                onClick={() => { setSidebarOpen(true); setViewMode('split'); }}
                                className={`px-2 py-0.5 rounded transition-colors flex items-center gap-1 font-bold cursor-pointer ${
                                    sidebarOpen && viewMode === 'split'
                                        ? 'bg-[var(--cyan)]/20 text-[var(--cyan)] '
                                        : 'text-[var(--alu-dim)] hover:text-white'
                                }`}
                                title={t12(language, 'Split View (Inputs + Workspace)', 'Bölünmüş Görünüm (Parametreler + Çalışma Alanı)')}
                            >
                                <Columns size={11} />
                                <span className="hidden sm:inline">{t12(language, 'Split', 'Bölünmüş')}</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => { setSidebarOpen(false); setViewMode('cad'); setActiveTab('cutaway'); }}
                                className={`px-2 py-0.5 rounded transition-colors flex items-center gap-1 font-bold cursor-pointer ${
                                    !sidebarOpen && activeTab === 'cutaway'
                                        ? 'bg-[var(--cyan)]/20 text-[var(--cyan)] '
                                        : 'text-[var(--alu-dim)] hover:text-white'
                                }`}
                                title={t12(language, 'Full Screen 1:1 CAD Technical Drawing', 'Tam Ekran 1:1 CAD Çizimi')}
                            >
                                <Maximize2 size={11} />
                                <span>{t12(language, 'Full CAD', 'Tam CAD')}</span>
                            </button>
                        </div>

                        {/* Sidebar Collapse Toggle Button */}
                        <button
                            type="button"
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className={`p-1.5 rounded border text-xs font-mono flex items-center gap-1 transition-colors cursor-pointer ${
                                sidebarOpen 
                                    ? 'bg-[var(--cyan)]/15 border-[var(--cyan)]/40 text-[var(--cyan)]' 
                                    : 'bg-[var(--bg-2)] border-[var(--line)] text-[var(--alu-dim)] hover:text-white'
                            }`}
                            title={sidebarOpen ? t12(language, 'Collapse Parameters Panel', 'Parametre Panelini Gizle') : t12(language, 'Expand Parameters Panel', 'Parametre Panelini Göster')}
                        >
                            {sidebarOpen ? <PanelLeftClose size={13} /> : <PanelLeftOpen size={13} />}
                        </button>

                        {/* 3D CAD Studio Export Button */}
                        <button
                            onClick={handleExportTo3D}
                            className="px-2.5 py-1 rounded bg-[var(--cyan)] text-black hover:bg-[var(--cyan)]/90 font-mono font-bold text-xs flex items-center gap-1.5 transition-all "
                        >
                            <Sparkles size={13} />
                            <span className="hidden md:inline">{exportSuccess ? t12(language, 'Exported!', '3D CAD Açıldı!') : t12(language, '3D CAD Studio', '3D CAD Studio')}</span>
                        </button>

                        {/* Technical Report & Datasheet Modal Button */}
                        <button
                            onClick={() => setIsReportModalOpen(true)}
                            className="px-2 py-1 rounded bg-[var(--bg-2)] hover:bg-[var(--bg-3)] border border-[var(--line)] text-xs font-mono text-[var(--cyan)] hover:text-white flex items-center gap-1.5 transition-colors"
                            title={t12(language, 'Open Engineering Calculation Passport & Datasheet', 'Mühendislik Hesaplama Pasaportu & Teknik Veri Sayfası')}
                        >
                            <FileText size={13} className="text-[var(--cyan)]" />
                            <span className="hidden md:inline font-bold">{t12(language, 'Report & Passport', 'Teknik Pasaport')}</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Main Split Body */}
            <div className="flex-1 min-h-0 flex flex-row overflow-hidden relative">
                {/* LEFT: COMPONENT SIZING & INPUT CONFIGURATOR */}
                {sidebarOpen && (
                    <div className="w-[390px] xl:w-[420px] 2xl:w-[460px] shrink-0 h-full flex flex-col bg-[var(--bg-1)] border-r border-[var(--line)] overflow-y-auto p-2.5 space-y-2 custom-scrollbar transition-all">
                        
                        {/* 0. Preset Selector Card (at the very top of Sidebar) */}
                        <div className="rounded-[var(--radius-s)] bg-[var(--bg-2)] border border-[var(--cyan)]/30 p-2 space-y-1.5 shrink-0">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] uppercase font-bold text-[var(--cyan)] flex items-center gap-1.5 font-mono">
                                    <Compass size={13} className="text-[var(--cyan)]" />
                                    {t12(language, 'Design Preset / Series', 'Tasarım Şablonu / Standart Seri')}
                                </span>
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-[var(--cyan)]/15 text-[var(--cyan)] font-mono font-bold">
                                    ISO / DIN
                                </span>
                            </div>
                            <select
                                value={presetId ?? ''}
                                onChange={(e) => loadPreset(e.target.value)}
                                className="w-full h-8 px-2.5 py-0 rounded bg-[var(--bg-0)] border border-[var(--line)] text-xs text-white font-mono font-bold cursor-pointer hover:border-[var(--cyan)]/60 transition-colors"
                            >
                                {CYLINDER_PRESETS.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {t12(language, p.titleEn, p.titleTr)}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* 1. Akışkan Tipi & Basınç */}
                        <div className="rounded-[var(--radius-s)] bg-[var(--bg-2)] border border-[var(--line)] overflow-hidden">
                            <button
                                type="button"
                                onClick={() => toggleSection('fluid')}
                                className="w-full px-3 py-2 flex items-center justify-between bg-[var(--bg-2)] hover:bg-[var(--bg-3)] border-b border-[var(--line)]/60 transition-colors cursor-pointer text-left"
                            >
                                <div className="flex items-center gap-2">
                                    <Gauge size={13} className="text-[var(--cyan)]" />
                                    <span className="text-xs font-bold uppercase tracking-wider text-[var(--cyan)] font-mono">
                                        {t12(language, '1. Fluid & Pressure', '1. Akışkan & Basınç')}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--bg-0)] text-[var(--alu-dim)] font-mono border border-[var(--line)]">
                                        {formatEngineeringValue(cylinderUnitConverters.pressure.fromBase(operatingPressureBar, pressureUnit), precision, true)} {pressureUnit} · {formatEngineeringValue(cylinderUnitConverters.flow.fromBase(pumpFlowRateLMin, flowUnit), precision, true)} {flowUnit}
                                    </span>
                                    {openSections.fluid ? <ChevronUp size={13} className="text-[var(--alu-dim)]" /> : <ChevronDown size={13} className="text-[var(--alu-dim)]" />}
                                </div>
                            </button>

                            {openSections.fluid && (
                                <div className="p-2.5 space-y-2">
                                    {/* Medium Buttons */}
                                    <div className="grid grid-cols-2 gap-1.5">
                                        <button
                                            onClick={() => setFluidMedium('hydraulic_mineral_oil')}
                                            className={`py-1.5 px-2 rounded text-[11px] font-mono font-bold flex items-center justify-center gap-1.5 border transition-all ${
                                                !isPneumatic 
                                                    ? 'bg-[var(--cyan)]/20 border-[var(--cyan)] text-white' 
                                                    : 'bg-[var(--bg-0)] border-[var(--line)] text-[var(--alu-dim)] hover:text-white'
                                            }`}
                                        >
                                            <Droplets size={12} className="text-[var(--cyan)]" />
                                            <span>{t12(language, 'Hydraulic (Oil)', 'Hidrolik (Yağ)')}</span>
                                        </button>
                                        <button
                                            onClick={() => setFluidMedium('pneumatic_air')}
                                            className={`py-1.5 px-2 rounded text-[11px] font-mono font-bold flex items-center justify-center gap-1.5 border transition-all ${
                                                isPneumatic 
                                                    ? 'bg-[var(--cyan)]/20 border-[var(--cyan)] text-white' 
                                                    : 'bg-[var(--bg-0)] border-[var(--line)] text-[var(--alu-dim)] hover:text-white'
                                            }`}
                                        >
                                            <Wind size={12} className="text-[var(--cyan)]" />
                                            <span>{t12(language, 'Pneumatic (Air 6 bar)', 'Pnömatik (6 bar)')}</span>
                                        </button>
                                    </div>

                                    {/* Pressure & Flow Inputs: Clean 2-column layout */}
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <div className="flex items-center justify-between mb-1 font-mono">
                                                <label className="text-[10px] text-[var(--alu-dim)]">
                                                    {t12(language, 'Operating Pressure', 'Çalışma Basıncı')}
                                                </label>
                                                <div className="flex items-center gap-0.5 bg-[var(--bg-0)] p-0.5 rounded border border-[var(--line)]">
                                                    {(['bar', 'MPa', 'psi'] as const).map((u) => (
                                                        <button
                                                            key={u}
                                                            type="button"
                                                            onClick={() => setPressureUnit(u)}
                                                            className={`px-1 py-0.2 text-[8px] font-mono rounded font-bold transition-all cursor-pointer ${
                                                                pressureUnit === u 
                                                                    ? 'bg-[var(--cyan)]/30 text-[var(--cyan)] ' 
                                                                    : 'text-[var(--alu-dim)] hover:text-white'
                                                            }`}
                                                        >
                                                            {u}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="relative flex items-center">
                                                <input
                                                    type="number"
                                                    min={1}
                                                    step={pressureUnit === 'psi' ? 10 : pressureUnit === 'MPa' ? 0.5 : 1}
                                                    value={Number(cylinderUnitConverters.pressure.fromBase(operatingPressureBar, pressureUnit).toFixed(pressureUnit === 'psi' ? 0 : pressureUnit === 'MPa' ? 2 : 1))}
                                                    onChange={(e) => {
                                                        const baseBar = cylinderUnitConverters.pressure.toBase(Number(e.target.value), pressureUnit);
                                                        setOperatingPressure(Math.max(1, Math.round(baseBar * 10) / 10));
                                                    }}
                                                    className="w-full h-8 px-2.5 rounded bg-[var(--bg-0)] border border-[var(--line)] text-xs text-[var(--cyan)] font-mono font-bold"
                                                />
                                                <span className="absolute right-2 text-[10px] text-[var(--alu-dim)] font-mono pointer-events-none">{pressureUnit}</span>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex items-center justify-between mb-1 font-mono">
                                                <label className="text-[10px] text-[var(--alu-dim)]">
                                                    {t12(language, 'Peak / Shock Pressure', 'Pik / Şok Basınç')}
                                                </label>
                                                <span className="text-[9px] text-[var(--warn)] font-bold">{pressureUnit}</span>
                                            </div>
                                            <div className="relative flex items-center">
                                                <input
                                                    type="number"
                                                    min={operatingPressureBar}
                                                    step={pressureUnit === 'psi' ? 10 : pressureUnit === 'MPa' ? 0.5 : 1}
                                                    value={Number(cylinderUnitConverters.pressure.fromBase(peakPressureBar, pressureUnit).toFixed(pressureUnit === 'psi' ? 0 : pressureUnit === 'MPa' ? 2 : 1))}
                                                    onChange={(e) => {
                                                        const baseBar = cylinderUnitConverters.pressure.toBase(Number(e.target.value), pressureUnit);
                                                        setPeakPressure(Math.max(operatingPressureBar, Math.round(baseBar * 10) / 10));
                                                    }}
                                                    className="w-full h-8 px-2.5 rounded bg-[var(--bg-0)] border border-[var(--line)] text-xs text-[var(--warn)] font-mono font-bold"
                                                />
                                                <span className="absolute right-2 text-[10px] text-[var(--alu-dim)] font-mono pointer-events-none">{pressureUnit}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Flow Rate & Hydraulic Power Preview */}
                                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[var(--line)]/40">
                                        <div>
                                            <div className="flex items-center justify-between mb-1 font-mono">
                                                <label className="text-[10px] text-[var(--alu-dim)]">
                                                    {t12(language, 'Pump Flow Q', 'Pompa Debisi Q')}
                                                </label>
                                                <div className="flex items-center gap-0.5 bg-[var(--bg-0)] p-0.5 rounded border border-[var(--line)]">
                                                    {(['L/min', 'gpm'] as const).map((u) => (
                                                        <button
                                                            key={u}
                                                            type="button"
                                                            onClick={() => setFlowUnit(u)}
                                                            className={`px-1 py-0.2 text-[8px] font-mono rounded font-bold transition-all cursor-pointer ${
                                                                flowUnit === u 
                                                                    ? 'bg-[var(--cyan)]/30 text-[var(--cyan)] ' 
                                                                    : 'text-[var(--alu-dim)] hover:text-white'
                                                            }`}
                                                        >
                                                            {u}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="relative flex items-center">
                                                <input
                                                    type="number"
                                                    min={0.1}
                                                    step={flowUnit === 'gpm' ? 0.1 : 0.5}
                                                    value={Number(cylinderUnitConverters.flow.fromBase(pumpFlowRateLMin, flowUnit).toFixed(flowUnit === 'gpm' ? 1 : 1))}
                                                    onChange={(e) => {
                                                        const baseLpm = cylinderUnitConverters.flow.toBase(Number(e.target.value), flowUnit);
                                                        setPumpFlowRate(Math.max(0.1, Math.round(baseLpm * 10) / 10));
                                                    }}
                                                    className="w-full h-8 px-2.5 rounded bg-[var(--bg-0)] border border-[var(--line)] text-xs text-white font-mono font-bold"
                                                />
                                                <span className="absolute right-2 text-[10px] text-[var(--alu-dim)] font-mono pointer-events-none">{flowUnit}</span>
                                            </div>
                                        </div>
                                        <div className="p-1.5 rounded bg-[var(--bg-0)] border border-[var(--line)]/50 flex flex-col justify-center">
                                            <span className="text-[9px] text-[var(--alu-dim)] font-mono">{t12(language, 'Hydraulic Power', 'Hidrolik Güç')}</span>
                                            <span className="text-xs font-bold text-[var(--cyan)] font-mono">
                                                {((operatingPressureBar * pumpFlowRateLMin) / 600).toFixed(2)} kW
                                            </span>
                                            <span className="text-[9px] text-[var(--alu-dim)] font-mono">
                                                {(((operatingPressureBar * pumpFlowRateLMin) / 600) * 1.341).toFixed(2)} HP
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 2. Standart Geometri (Bore, Rod, Stroke, Mass) */}
                        <div className="rounded-[var(--radius-s)] bg-[var(--bg-2)] border border-[var(--line)] overflow-hidden">
                            <button
                                type="button"
                                onClick={() => toggleSection('sizing')}
                                className="w-full px-3 py-2 flex items-center justify-between bg-[var(--bg-2)] hover:bg-[var(--bg-3)] border-b border-[var(--line)]/60 transition-colors cursor-pointer text-left"
                            >
                                <div className="flex items-center gap-2">
                                    <Sliders size={13} className="text-[var(--cyan)]" />
                                    <span className="text-xs font-bold uppercase tracking-wider text-[var(--cyan)] font-mono">
                                        {t12(language, '2. Cylinder Sizing', '2. Silindir Geometrisi')}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--bg-0)] text-[var(--alu-dim)] font-mono border border-[var(--line)]">
                                        Ø{boreDiameterD} / Ø{rodDiameterD} · {formatEngineeringValue(cylinderUnitConverters.linear.fromBase(strokeS, linearUnit), precision, true)} {linearUnit}
                                    </span>
                                    {openSections.sizing ? <ChevronUp size={13} className="text-[var(--alu-dim)]" /> : <ChevronDown size={13} className="text-[var(--alu-dim)]" />}
                                </div>
                            </button>

                            {openSections.sizing && (
                                <div className="p-2.5 space-y-2">
                                    {/* Bore & Rod selection */}
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="text-[10px] text-[var(--alu-dim)] block mb-1 font-mono flex items-center justify-between">
                                                <span>{t12(language, 'Bore Dia D', 'Boru İç Çapı D')}</span>
                                                <span className="text-[9px] text-[var(--cyan)] font-bold">H8</span>
                                            </label>
                                            <select
                                                value={boreDiameterD}
                                                onChange={(e) => setBoreDiameter(Number(e.target.value))}
                                                className="w-full h-8 px-2 py-0 rounded bg-[var(--bg-0)] border border-[var(--line)] text-xs text-white font-mono font-bold"
                                            >
                                                {ISO_3320_BORES.map((b) => (
                                                    <option key={b.boreD} value={b.boreD}>
                                                        Ø{b.boreD} mm (OD: {b.recommendedTubeOD})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="text-[10px] text-[var(--alu-dim)] block mb-1 font-mono flex items-center justify-between">
                                                <span>{t12(language, 'Rod Dia d', 'Mil Çapı d')}</span>
                                                <span className="text-[9px] text-[var(--cyan)] font-bold">f7</span>
                                            </label>
                                            <select
                                                value={rodDiameterD}
                                                onChange={(e) => setRodDiameter(Number(e.target.value))}
                                                className="w-full h-8 px-2 py-0 rounded bg-[var(--bg-0)] border border-[var(--line)] text-xs text-[var(--cyan)] font-mono font-bold"
                                            >
                                                {currentBoreOption.standardRods.map((rd) => (
                                                    <option key={rd} value={rd}>
                                                        Ø{rd} mm (DIN 24338)
                                                    </option>
                                                ))}
                                                {!currentBoreOption.standardRods.includes(rodDiameterD) && (
                                                    <option value={rodDiameterD}>Ø{rodDiameterD} mm (Özel)</option>
                                                )}
                                            </select>
                                        </div>
                                    </div>

                                    {/* ISO 3320 / DIN 24338 Area Ratio & Speed Multiplier */}
                                    <div className="flex items-center justify-between px-2.5 py-1.5 rounded bg-[var(--bg-0)] border border-[var(--line)]/60 text-[10px] font-mono">
                                        <span className="text-[var(--alu-dim)]">{t12(language, 'ISO Area Ratio (φ = A1/A2):', 'ISO Alan Oranı (φ = A1/A2):')}</span>
                                        <span className="text-[var(--cyan)] font-bold">
                                            φ = {areaRatioPhi.toFixed(2)} {areaRatioPhi >= 1.95 && areaRatioPhi <= 2.05 ? '(2:1 Diferansiyel)' : areaRatioPhi >= 1.4 && areaRatioPhi <= 1.5 ? '(1.46 Std)' : ''}
                                        </span>
                                    </div>

                                    {/* Stroke S Input Row */}
                                    <div className="space-y-1">
                                        <div className="flex items-center justify-between font-mono">
                                            <label className="text-[10px] text-[var(--alu-dim)] font-bold">
                                                {t12(language, 'Stroke S', 'Çalışma Stroku S')}
                                            </label>
                                            <div className="flex items-center gap-0.5 bg-[var(--bg-0)] p-0.5 rounded border border-[var(--line)]">
                                                {(['mm', 'in'] as const).map((u) => (
                                                    <button
                                                        key={u}
                                                        type="button"
                                                        onClick={() => setLinearUnit(u)}
                                                        className={`px-1.5 py-0.5 text-[8.5px] font-mono rounded font-bold transition-all cursor-pointer ${
                                                            linearUnit === u 
                                                                ? 'bg-[var(--cyan)]/30 text-[var(--cyan)] ' 
                                                                : 'text-[var(--alu-dim)] hover:text-white'
                                                        }`}
                                                    >
                                                        {u}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const delta = linearUnit === 'in' ? 25.4 : 50;
                                                    setStroke(Math.max(10, Math.round(strokeS - delta)));
                                                }}
                                                className="w-8 h-8 rounded bg-[var(--bg-0)] hover:bg-[var(--bg-3)] border border-[var(--line)] text-xs text-[var(--alu-dim)] hover:text-white flex items-center justify-center font-bold cursor-pointer shrink-0"
                                                title={linearUnit === 'in' ? '-1 in' : '-50 mm'}
                                            >
                                                -
                                            </button>
                                            <input
                                                type="number"
                                                min={linearUnit === 'in' ? 0.5 : 10}
                                                step={linearUnit === 'in' ? 0.5 : 10}
                                                value={Number(cylinderUnitConverters.linear.fromBase(strokeS, linearUnit).toFixed(linearUnit === 'in' ? 1 : 0))}
                                                onChange={(e) => {
                                                    const baseMm = cylinderUnitConverters.linear.toBase(Number(e.target.value), linearUnit);
                                                    setStroke(Math.max(10, Math.round(baseMm)));
                                                }}
                                                className="flex-1 min-w-0 h-8 px-2 rounded bg-[var(--bg-0)] border border-[var(--line)] text-xs text-white font-mono font-bold text-center"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const delta = linearUnit === 'in' ? 25.4 : 50;
                                                    setStroke(Math.min(4000, Math.round(strokeS + delta)));
                                                }}
                                                className="w-8 h-8 rounded bg-[var(--bg-0)] hover:bg-[var(--bg-3)] border border-[var(--line)] text-xs text-[var(--alu-dim)] hover:text-white flex items-center justify-center font-bold cursor-pointer shrink-0"
                                                title={linearUnit === 'in' ? '+1 in' : '+50 mm'}
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>

                                    {/* Moving Mass Input Row */}
                                    <div className="space-y-1">
                                        <div className="flex items-center justify-between font-mono">
                                            <label className="text-[10px] text-[var(--alu-dim)] font-bold">
                                                {t12(language, 'Moving Mass', 'Yük Kütlesi')}
                                            </label>
                                            <span className="text-[9px] text-[var(--alu-dim)]">Euler / Tetmajer / Sag</span>
                                        </div>
                                        <div className="relative flex items-center">
                                            <input
                                                type="number"
                                                min={0}
                                                max={50000}
                                                value={movingMassKg}
                                                onChange={(e) => setMovingMass(Math.max(0, Number(e.target.value)))}
                                                className="w-full h-8 px-3 pr-10 rounded bg-[var(--bg-0)] border border-[var(--line)] text-xs text-white font-mono font-bold"
                                            />
                                            <span className="absolute right-3 text-[10px] text-[var(--alu-dim)] font-mono pointer-events-none font-bold">kg</span>
                                        </div>
                                    </div>

                                    {/* Orientation: Clean Single Row Toggle */}
                                    <div className="pt-1 border-t border-[var(--line)]/50">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] text-[var(--alu-dim)] font-mono">
                                                {t12(language, 'Mounting Orientation', 'Çalışma Pozisyonu')}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => setHorizontalMounting(!horizontalMounting)}
                                                className={`py-1 px-3 rounded text-[11px] font-mono font-bold border transition-colors flex items-center gap-1.5 cursor-pointer ${
                                                    horizontalMounting 
                                                        ? 'bg-[var(--warn)]/20 border-[var(--warn)] text-[var(--warn)] ' 
                                                        : 'bg-[var(--cyan)]/20 border-[var(--cyan)] text-[var(--cyan)] '
                                                }`}
                                            >
                                                <span>{horizontalMounting ? t12(language, 'Horizontal (Sag Analyzed)', 'Yatay (Sehim Tahkikli)') : t12(language, 'Vertical (Zero Sag)', 'Dikey (Sıfır Sehim)')}</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 3. Gövde Bağlantıları & Mesnetleme (Field Connections & Mountings) */}
                        <div className="rounded-[var(--radius-s)] bg-[var(--bg-2)] border border-[var(--line)] overflow-hidden">
                            <button
                                type="button"
                                onClick={() => toggleSection('mounting')}
                                className="w-full px-3 py-2 flex items-center justify-between bg-[var(--bg-2)] hover:bg-[var(--bg-3)] border-b border-[var(--line)]/60 transition-colors cursor-pointer text-left"
                            >
                                <div className="flex items-center gap-2">
                                    <Anchor size={13} className="text-[var(--cyan)]" />
                                    <span className="text-xs font-bold uppercase tracking-wider text-[var(--cyan)] font-mono">
                                        {t12(language, '3. Connections & Mounting', '3. Gövde & Mesnetleme')}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--bg-0)] text-[var(--alu-dim)] font-mono border border-[var(--line)]">
                                        {barrelConnectionStyle === 'bolted_flange' ? t12(language, 'Flange', 'Flanş') : barrelConnectionStyle === 'tie_rod_studs' ? 'Tie-Rod' : barrelConnectionStyle === 'welded_cap_threaded_gland' ? t12(language, 'Threaded', 'Vidalı') : t12(language, 'Welded', 'Kaynaklı')}
                                    </span>
                                    {openSections.mounting ? <ChevronUp size={13} className="text-[var(--alu-dim)]" /> : <ChevronDown size={13} className="text-[var(--alu-dim)]" />}
                                </div>
                            </button>

                            {openSections.mounting && (
                                <div className="p-2.5 space-y-2">
                                    {/* Honlu Boru & Gövde Konstrüksiyonu (Unified Barrel Joint Style) */}
                                    <div>
                                        <label className="text-[9px] text-[var(--cyan)] block mb-0.5 font-mono font-bold">
                                            {t12(language, 'Barrel Construction & Joint Style', 'Gövde Konstrüksiyonu & Uç Bağlantısı')}
                                        </label>
                                        <select
                                            value={barrelConnectionStyle}
                                            onChange={(e) => setBarrelConnectionStyle(e.target.value as BarrelConnectionStyle)}
                                            className="w-full px-2 py-1.5 rounded bg-[var(--bg-0)] border border-[var(--cyan)]/40 text-[11px] text-[var(--cyan)] font-mono font-bold cursor-pointer"
                                        >
                                            <option value="tie_rod_studs">{t12(language, 'Tie-Rod Stud Cylinders (ISO 6020-2 / 160 bar)', 'Saplamalı Tie-Rod Milleri (ISO 6020-2 / 160 bar)')}</option>
                                            <option value="bolted_flange">{t12(language, 'Bolted Flange (ISO 6022 Mill Duty / 250 bar)', 'Cıvatalı Flanşlı (ISO 6022 Mill Duty / 250 bar)')}</option>
                                            <option value="welded_cap_threaded_gland">{t12(language, 'Welded Cap + Threaded Gland (KHS / 160-250 bar)', 'Kaynaklı Taban + Vidalı Boğaz Kapağı (KHS / 160-250 bar)')}</option>
                                            <option value="welded_cap_bolted_gland">{t12(language, 'Welded Cap + Bolted Gland (CD210)', 'Kaynaklı Taban + Cıvatalı Boğaz Kapağı (CD210)')}</option>
                                            <option value="welded_monolithic">{t12(language, 'Monolithic Fully Welded Heavy Duty', 'Monoblok Tam Kaynaklı Ağır Tip')}</option>
                                            <option value="internal_retaining_ring">{t12(language, 'Internal Snap Ring Retained', 'İç Segmanlı / Emniyet Segmanlı')}</option>
                                        </select>
                                    </div>

                                    {/* Bolt Grade for Flange */}
                                    {barrelConnectionStyle === 'bolted_flange' && (
                                        <div className="p-1.5 rounded bg-[var(--bg-0)] border border-[var(--cyan)]/20">
                                            <label className="text-[9px] text-[var(--alu-dim)] block mb-0.5 font-mono">
                                                {t12(language, 'Flange Bolt Grade (DIN 912)', 'Flanş Cıvata Kalitesi (DIN 912)')}
                                            </label>
                                            <select
                                                value={flangeBoltGrade}
                                                onChange={(e) => setFlangeBoltGrade(e.target.value as '8.8' | '10.9' | '12.9')}
                                                className="w-full px-1.5 py-1 rounded bg-[var(--bg-1)] border border-[var(--line)] text-xs text-white font-mono"
                                            >
                                                <option value="8.8">{t12(language, 'DIN 912 Grade 8.8 (Sp = 640 MPa)', 'DIN 912 Kalite 8.8 (Sp = 640 MPa)')}</option>
                                                <option value="10.9">{t12(language, 'DIN 912 Grade 10.9 (Sp = 900 MPa - Standard)', 'DIN 912 Kalite 10.9 (Sp = 900 MPa - Standart)')}</option>
                                                <option value="12.9">{t12(language, 'DIN 912 Grade 12.9 (Sp = 1080 MPa - High Load)', 'DIN 912 Kalite 12.9 (Sp = 1080 MPa - Yüksek Yük)')}</option>
                                            </select>
                                        </div>
                                    )}

                                    {/* Silindir Mesnetleme Şekli (Mounting Style) */}
                                    <div>
                                        <label className="text-[9px] text-[var(--alu-dim)] block mb-0.5 font-mono">
                                            {t12(language, 'Cylinder Mounting Style (ISO)', 'Mesnetleme & Montaj Şekli (ISO)')}
                                        </label>
                                        <select
                                            value={mountingStyle}
                                            onChange={(e) => setMountingStyle(e.target.value as CylinderMountingStyle)}
                                            className="w-full px-2 py-1 rounded bg-[var(--bg-0)] border border-[var(--line)] text-[11px] text-white font-mono"
                                        >
                                            <option value="cap_spherical_eye_mp5">{t12(language, 'ISO MP5 - Cap Spherical Eye (GE..ES, nu=1.0)', 'ISO MP5 - Arka Oynak Rulmanlı Göz (GE..ES, nu=1.0)')}</option>
                                            <option value="cap_clevis_mp1">{t12(language, 'ISO MP1 - Cap Clevis / Pin (nu=1.0)', 'ISO MP1 - Arka Dişi Çatal / Pim (nu=1.0)')}</option>
                                            <option value="cap_plain_eye_mp3">{t12(language, 'ISO MP3 - Cap Plain Eye (nu=1.0)', 'ISO MP3 - Arka Düz Sabit Göz (nu=1.0)')}</option>
                                            <option value="cap_male_eye_mp4">{t12(language, 'ISO MP4 - Cap Male Eye (nu=1.0)', 'ISO MP4 - Arka Erkek Mafsal (nu=1.0)')}</option>
                                            <option value="head_flange_mf3">{t12(language, 'ISO MF3 - Head Rectangular/Round Flange (nu=0.7)', 'ISO MF3 - Ön Kare/Yuvarlak Flanş (nu=0.7)')}</option>
                                            <option value="cap_flange_mf4">{t12(language, 'ISO MF4 - Cap Flange Mount (nu=1.0)', 'ISO MF4 - Arka Flanş Bağlantı (nu=1.0)')}</option>
                                            <option value="intermediate_trunnion_mt4">{t12(language, 'ISO MT4 - Intermediate Trunnion (nu=1.0, shorter Lk)', 'ISO MT4 - Orta Muylu Pivot (nu=1.0, Lk kısalır)')}</option>
                                            <option value="head_trunnion_mt1">{t12(language, 'ISO MT1 - Head Trunnion Pivot (nu=0.7)', 'ISO MT1 - Ön Boğaz Muylu Mafsal (nu=0.7)')}</option>
                                            <option value="side_lugs_ms2">{t12(language, 'ISO MS2 - Side Lugs / Foot Mount (nu=0.7)', 'ISO MS2 - Gövde Yan Ayak Bağlantı (nu=0.7)')}</option>
                                            <option value="extended_tie_rods_mx1">{t12(language, 'ISO MX1 - Head Extended Tie-Rods (nu=0.7)', 'ISO MX1 - Ön Uzatılmış Saplamalar (nu=0.7)')}</option>
                                            <option value="extended_tie_rods_mx2">{t12(language, 'ISO MX2 - Cap Extended Tie-Rods (nu=1.0)', 'ISO MX2 - Arka Uzatılmış Saplamalar (nu=1.0)')}</option>
                                            <option value="extended_tie_rods_mx3">{t12(language, 'ISO MX3 - Both Ends Extended Tie-Rods (nu=0.7)', 'ISO MX3 - İki Uç Uzatılmış Saplamalar (nu=0.7)')}</option>
                                            <option value="fixed_guided">{t12(language, 'Both Ends Rigidly Guided (nu=0.5)', 'İki Ucu Rijit Kılavuzlu (nu=0.5)')}</option>
                                        </select>
                                    </div>

                                    {/* Trunnion Position Input */}
                                    {(mountingStyle === 'intermediate_trunnion_mt4' || mountingStyle === 'trunnion_mid' || mountingStyle === 'head_trunnion_mt1') && (
                                        <div className="p-2 rounded bg-[var(--bg-0)] border border-[var(--cyan)]/30 space-y-1">
                                            <label className="text-[9px] text-[var(--cyan)] block font-mono font-bold">
                                                {t12(language, 'Trunnion Pivot X_trun (mm from rear cap)', 'Muylu Pivot Konumu (mm - Arka Kapaktan)')}
                                            </label>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="number"
                                                    min={20}
                                                    max={strokeS + 200}
                                                    value={trunnionPositionMm || Math.round((strokeS + 100) / 2)}
                                                    onChange={(e) => setTrunnionPosition(Math.max(20, Number(e.target.value)))}
                                                    className="w-full px-2 py-1 rounded bg-[var(--bg-1)] border border-[var(--line)] text-xs text-white font-mono font-bold"
                                                />
                                                <span className="text-[10px] text-[var(--alu-dim)] font-mono shrink-0">
                                                    Lk: {result?.bucklingLengthLkMm ?? 0}mm
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Foot Mount Offset Input */}
                                    {(mountingStyle === 'side_lugs_ms2' || mountingStyle === 'foot_mount') && (
                                        <div className="p-2 rounded bg-[var(--bg-0)] border border-[var(--warn)]/30 space-y-1">
                                            <label className="text-[9px] text-[var(--warn)] block font-mono font-bold">
                                                {t12(language, 'Centerline to Foot Offset h (mm)', 'Eksen-Taban Kaçıklığı h (mm - Devirme Kolu)')}
                                            </label>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="number"
                                                    min={10}
                                                    max={300}
                                                    value={footMountOffsetMm || Math.round((boreDiameterD + 40) / 2 + 15)}
                                                    onChange={(e) => setFootMountOffset(Math.max(10, Number(e.target.value)))}
                                                    className="w-full px-2 py-1 rounded bg-[var(--bg-1)] border border-[var(--line)] text-xs text-[var(--warn)] font-mono font-bold"
                                                />
                                                <span className="text-[10px] text-[var(--alu-dim)] font-mono shrink-0">
                                                    M: {result?.footOverturnMomentNm ?? 0}Nm
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Rod End & Material */}
                                    <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-[var(--line)]/50">
                                        <div>
                                            <label className="text-[9px] text-[var(--alu-dim)] block mb-0.5 font-mono">
                                                {t12(language, 'Rod End Connection', 'Mil Ucu')}
                                            </label>
                                            <select
                                                value={rodEndType}
                                                onChange={(e) => setRodEndType(e.target.value as RodEndType)}
                                                className="w-full px-1.5 py-1 rounded bg-[var(--bg-0)] border border-[var(--line)] text-[10px] text-white font-mono"
                                            >
                                                <option value="spherical_rod_eye_ap4">{t12(language, 'ISO AP4 Spherical Rod Eye', 'ISO AP4 Oynak Mafsal')}</option>
                                                <option value="rod_clevis_ap2">{t12(language, 'ISO AP2 Rod Clevis', 'ISO AP2 Çatal Uç')}</option>
                                                <option value="male_thread">{t12(language, 'ISO 6020 Male Thread', 'ISO 6020 Erkek Diş')}</option>
                                                <option value="female_thread">{t12(language, 'Female Metric Thread', 'Dişi Metrik Diş')}</option>
                                                <option value="flanged_rod_end">{t12(language, 'Flanged Rod End', 'Flanşlı Uç')}</option>
                                                <option value="plain_welded_eye">{t12(language, 'Plain Welded Eye', 'Kaynaklı Göz')}</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[9px] text-[var(--alu-dim)] block mb-0.5 font-mono">
                                                {t12(language, 'Rod Steel Material', 'Mil Çeliği')}
                                            </label>
                                            <select
                                                value={rodMaterialId}
                                                onChange={(e) => setRodMaterial(e.target.value as any)}
                                                className="w-full px-1.5 py-1 rounded bg-[var(--bg-0)] border border-[var(--line)] text-[10px] text-white font-mono"
                                            >
                                                <option value="20mnv6_chrome">20MnV6 (460 MPa)</option>
                                                <option value="c45_chrome">C45 {t12(language, 'Chrome Plated', 'Kromlu')} (340 MPa)</option>
                                                <option value="42crmo4_chrome">42CrMo4 (650 MPa)</option>
                                                <option value="aisi431_stainless">AISI 431 {t12(language, 'Stainless', 'Paslanmaz')}</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 4. Sızdırmazlık & Yastıklama (Sealing & Cushioning) */}
                        <div className="rounded-[var(--radius-s)] bg-[var(--bg-2)] border border-[var(--line)] overflow-hidden">
                            <button
                                type="button"
                                onClick={() => toggleSection('sealing')}
                                className="w-full px-3 py-2 flex items-center justify-between bg-[var(--bg-2)] hover:bg-[var(--bg-3)] border-b border-[var(--line)]/60 transition-colors cursor-pointer text-left"
                            >
                                <div className="flex items-center gap-2">
                                    <Droplets size={13} className="text-[var(--cyan)]" />
                                    <span className="text-xs font-bold uppercase tracking-wider text-[var(--cyan)] font-mono">
                                        {t12(language, '4. Sealing & Cushioning', '4. Sızdırmazlık & Yastıklama')}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--bg-0)] text-[var(--alu-dim)] font-mono border border-[var(--line)]">
                                        {pistonSealType} · {rodSealType} · {wiperType}
                                    </span>
                                    {openSections.sealing ? <ChevronUp size={13} className="text-[var(--alu-dim)]" /> : <ChevronDown size={13} className="text-[var(--alu-dim)]" />}
                                </div>
                            </button>

                            {openSections.sealing && (
                                <div className="p-2.5 space-y-2">
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                                        <div>
                                            <label className="text-[9px] text-[var(--alu-dim)] block mb-0.5 font-mono">
                                                {t12(language, 'Piston Seal', 'Piston Keçesi')}
                                            </label>
                                            <select
                                                value={pistonSealType}
                                                onChange={(e) => setPistonSealType(e.target.value as any)}
                                                className="w-full px-1.5 py-1 rounded bg-[var(--bg-0)] border border-[var(--line)] text-[10px] text-white font-mono"
                                            >
                                                <option value="K16">K16 {t12(language, 'Compact (PU/NBR)', 'Kompakt (PU/NBR)')}</option>
                                                <option value="K21">K21 {t12(language, 'U-Cup Hydraulic', 'U-Cup Hidrolik')}</option>
                                                <option value="K40">K40 {t12(language, 'PTFE/Bronze', 'PTFE/Bronz')}</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[9px] text-[var(--alu-dim)] block mb-0.5 font-mono">
                                                {t12(language, 'Rod Seal', 'Boğaz Keçesi')}
                                            </label>
                                            <select
                                                value={rodSealType}
                                                onChange={(e) => setRodSealType(e.target.value as any)}
                                                className="w-full px-1.5 py-1 rounded bg-[var(--bg-0)] border border-[var(--line)] text-[10px] text-white font-mono"
                                            >
                                                <option value="K33">K33 {t12(language, 'PU Rod Seal', 'PU Boğaz Keçesi')}</option>
                                                <option value="K35">K35 {t12(language, 'Double Lip', 'Çift Dudaklı')}</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[9px] text-[var(--alu-dim)] block mb-0.5 font-mono">
                                                {t12(language, 'Wiper Scraper', 'Toz Keçesi')}
                                            </label>
                                            <select
                                                value={wiperType}
                                                onChange={(e) => setWiperType(e.target.value as any)}
                                                className="w-full px-1.5 py-1 rounded bg-[var(--bg-0)] border border-[var(--line)] text-[10px] text-white font-mono"
                                            >
                                                <option value="K01">K01 {t12(language, 'PU Snap-In', 'PU Geçmeli (Snap-In)')}</option>
                                                <option value="K03">K03 {t12(language, 'Metal Caged', 'Sac Gövdeli (Metal Caged)')}</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Cushioning Toggles */}
                                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[var(--line)]/50">
                                        <label className="flex items-center gap-1.5 text-[11px] font-mono text-[var(--alu)] cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={hasCushioningFront}
                                                onChange={(e) => setCushioning(e.target.checked, hasCushioningRear)}
                                                className="accent-[var(--cyan)] rounded"
                                            />
                                            <span>{t12(language, 'Front Cushioning', 'Ön Yastıklama')}</span>
                                        </label>
                                        <label className="flex items-center gap-1.5 text-[11px] font-mono text-[var(--alu)] cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={hasCushioningRear}
                                                onChange={(e) => setCushioning(hasCushioningFront, e.target.checked)}
                                                className="accent-[var(--cyan)] rounded"
                                            />
                                            <span>{t12(language, 'Rear Cushioning', 'Arka Yastıklama')}</span>
                                        </label>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Part Quick Inspector Card */}
                        {selectedPart && (() => {
                            const locPart = getLocalizedPart(selectedPart, language);
                            return (
                                <div className="p-2.5 rounded-[var(--radius-s)] bg-[var(--bg-3)] border border-[var(--cyan)]/40 space-y-1 font-mono">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-[var(--cyan)] flex items-center gap-1.5">
                                            <Wrench size={12} /> {t12(language, 'Part #', 'Parça No ')}{selectedPart.partNumber}: {locPart.name}
                                        </span>
                                        <span className="text-[9px] text-[var(--alu-dim)]">{selectedPart.standard}</span>
                                    </div>
                                    <p className="text-[10px] text-[var(--alu)] leading-snug">
                                        {locPart.description}
                                    </p>
                                    <div className="grid grid-cols-3 gap-1 text-[9px] text-[var(--alu-dim)] pt-1">
                                        <div><strong className="text-white">{t12(language, 'Mat:', 'Malz:')}</strong> {locPart.material}</div>
                                        <div><strong className="text-white">{t12(language, 'Size:', 'Ölçü:')}</strong> Ø{selectedPart.outerDiaMm}x{selectedPart.lengthMm}</div>
                                        <div><strong className="text-white">{t12(language, 'Mass:', 'Kütle:')}</strong> {formatEngineeringValue(selectedPart.weightKg, precision, true)} kg</div>
                                    </div>
                                    {locPart.notes && (
                                        <div className="text-[9px] text-[var(--warn)] pt-0.5 border-t border-[var(--line)]">
                                            {locPart.notes}
                                        </div>
                                    )}
                                </div>
                            );
                        })()}
                    </div>
                )}

                {/* RIGHT: INTERACTIVE WORKSPACE */}
                {(viewMode === 'split' || viewMode === 'cad') && (
                    <div className="flex-1 min-w-0 h-full flex flex-col bg-[var(--bg-0)] overflow-hidden">
                    {/* View Tabs Bar with Scroll Controls */}
                    <div className="flex items-center px-2 py-1 bg-[var(--bg-1)] border-b border-[var(--line)] gap-1 text-xs font-mono relative shrink-0">
                        <button
                            type="button"
                            onClick={() => scrollTabs('left')}
                            className="p-1 rounded bg-[var(--bg-2)] hover:bg-[var(--bg-3)] border border-[var(--line)] text-[var(--alu-dim)] hover:text-white shrink-0 sm:flex hidden cursor-pointer"
                            title={t12(language, 'Scroll Left', 'Sola Kaydır')}
                        >
                            <ChevronLeft size={13} />
                        </button>

                        <div ref={tabScrollRef} className="flex-1 min-w-0 flex items-center gap-1.5 overflow-x-auto custom-scrollbar py-0.5 scroll-smooth">
                            <button
                                type="button"
                                onClick={() => setActiveTab('cutaway')}
                                className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer ${
                                    activeTab === 'cutaway' 
                                        ? 'bg-[var(--cyan)]/20 border border-[var(--cyan)]/50 text-[var(--cyan)] font-bold' 
                                        : 'text-[var(--alu-dim)] hover:text-white'
                                }`}
                            >
                                <Layers size={13} />
                                <span>{t12(language, '1:1 Cutaway CAD', '1:1 Kesit CAD')}</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setActiveTab('calculations')}
                                className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer ${
                                    activeTab === 'calculations' 
                                        ? 'bg-[var(--cyan)]/20 border border-[var(--cyan)]/50 text-[var(--cyan)] font-bold' 
                                        : 'text-[var(--alu-dim)] hover:text-white'
                                }`}
                            >
                                <Activity size={13} />
                                <span>{t12(language, 'Strength & Buckling', 'Mukavemet & Burkulma')}</span>
                                {result && (
                                    <span className={`text-[9px] px-1 py-0.2 rounded font-bold ${
                                        result.isBucklingSafe 
                                            ? 'bg-[var(--ok)]/15 text-[var(--ok)] border border-[var(--ok)]/30' 
                                            : 'bg-[var(--bad)]/15 text-[var(--bad)] border border-[var(--bad)]/30'
                                    }`}>
                                        SF {result.bucklingSafetyFactor.toFixed(1)}
                                    </span>
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={() => setActiveTab('mountings')}
                                className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer ${
                                    activeTab === 'mountings' 
                                        ? 'bg-[var(--cyan)]/20 border border-[var(--cyan)]/50 text-[var(--cyan)] font-bold' 
                                        : 'text-[var(--alu-dim)] hover:text-white'
                                }`}
                            >
                                <Anchor size={13} />
                                <span>{t12(language, 'Mountings & Supports', 'Mesnet & Mafsallar')}</span>
                                <span className="text-[9px] px-1 py-0.2 rounded bg-[var(--bg-2)] text-[var(--alu-dim)] border border-[var(--line)]">
                                    ISO 6020
                                </span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setActiveTab('connections')}
                                className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer ${
                                    activeTab === 'connections' 
                                        ? 'bg-[var(--warn)]/20 border border-[var(--warn)]/50 text-[var(--warn)] font-bold ' 
                                        : 'text-[var(--alu-dim)] hover:text-white'
                                }`}
                            >
                                <Wrench size={13} className="text-[var(--warn)]" />
                                <span>{t12(language, 'Joints (Welded, Bolted)', 'Gövde & Bağlantılar')}</span>
                                <span className="text-[9px] px-1 py-0.2 rounded bg-[var(--bg-2)] text-[var(--warn)] border border-[var(--warn)]/30">
                                    VDI 2230
                                </span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setActiveTab('cushioning')}
                                className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer ${
                                    activeTab === 'cushioning' 
                                        ? 'bg-[var(--cyan)]/20 border border-[var(--cyan)]/50 text-[var(--cyan)] font-bold' 
                                        : 'text-[var(--alu-dim)] hover:text-white'
                                }`}
                            >
                                <Zap size={13} />
                                <span>{t12(language, 'Cushioning & Ports', 'Yastıklama & Portlar')}</span>
                                <span className="text-[9px] px-1 py-0.2 rounded bg-[var(--bg-2)] text-[var(--alu-dim)] border border-[var(--line)]">
                                    ISO 6149
                                </span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setActiveTab('seals')}
                                className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer ${
                                    activeTab === 'seals' 
                                        ? 'bg-[var(--cyan)]/20 border border-[var(--cyan)]/50 text-[var(--cyan)] font-bold' 
                                        : 'text-[var(--alu-dim)] hover:text-white'
                                }`}
                            >
                                <Droplets size={13} />
                                <span>{t12(language, 'Seals (Kastaş)', 'Sızdırmazlık Paketi')}</span>
                                <span className="text-[9px] px-1 py-0.2 rounded bg-[var(--bg-2)] text-[var(--alu-dim)] border border-[var(--line)]">
                                    K16/K33
                                </span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setActiveTab('bom')}
                                className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer ${
                                    activeTab === 'bom' 
                                        ? 'bg-[var(--cyan)]/20 border border-[var(--cyan)]/50 text-[var(--cyan)] font-bold' 
                                        : 'text-[var(--alu-dim)] hover:text-white'
                                }`}
                            >
                                <FileText size={13} />
                                <span>{t12(language, 'BOM', 'Parça Listesi (BOM)')}</span>
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-[var(--cyan)]/15 text-[var(--cyan)] font-bold border border-[var(--cyan)]/30">
                                    {result?.billOfMaterials.length ?? 0}
                                </span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setActiveTab('manufacturing')}
                                className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer ${
                                    activeTab === 'manufacturing' 
                                        ? 'bg-[var(--cyan)]/20 border border-[var(--cyan)]/50 text-[var(--cyan)] font-bold' 
                                        : 'text-[var(--alu-dim)] hover:text-white'
                                }`}
                            >
                                <Settings2 size={13} />
                                <span>{t12(language, 'Manufacturing', 'İmalat & Toleranslar')}</span>
                                <span className="text-[9px] px-1 py-0.2 rounded bg-[var(--bg-2)] text-[var(--alu-dim)] border border-[var(--line)]">
                                    H8/f7
                                </span>
                            </button>
                        </div>

                        <button
                            type="button"
                            onClick={() => scrollTabs('right')}
                            className="p-1 rounded bg-[var(--bg-2)] hover:bg-[var(--bg-3)] border border-[var(--line)] text-[var(--alu-dim)] hover:text-white shrink-0 sm:flex hidden cursor-pointer"
                            title={t12(language, 'Scroll Right', 'Sağa Kaydır')}
                        >
                            <ChevronRight size={13} />
                        </button>
                    </div>

                    {/* Content Container */}
                    <div className="flex-1 min-h-0 p-3 overflow-y-auto custom-scrollbar">
                        {activeTab === 'cutaway' && (
                            <div className="w-full h-full flex flex-col space-y-2">
                                <div className="flex-1 min-h-[440px] w-full">
                                    <CylinderSectionSVG
                                        boreD={boreDiameterD}
                                        rodD={rodDiameterD}
                                        strokeS={strokeS}
                                        strokeProgress={strokeProgress}
                                        selectedPartNumber={selectedPartNumber}
                                        result={result}
                                        isPlaying={isPlaying}
                                        playbackSpeed={playbackSpeed}
                                        cylinderConstruction={cylinderConstruction}
                                        mountingStyle={mountingStyle}
                                        barrelConnectionStyle={barrelConnectionStyle}
                                        rodEndType={rodEndType}
                                        pistonSealType={pistonSealType}
                                        rodSealType={rodSealType}
                                        wiperType={wiperType}
                                        hasCushioningFront={hasCushioningFront}
                                        hasCushioningRear={hasCushioningRear}
                                        fluidMedium={fluidMedium}
                                        operatingPressureBar={operatingPressureBar}
                                        onStrokeProgressChange={setStrokeProgress}
                                        onSelectPart={setSelectedPartNumber}
                                        onTogglePlay={togglePlay}
                                        onPlaybackSpeedChange={setPlaybackSpeed}
                                    />
                                </div>

                                {/* Bottom Modular Precision Telemetry Panel */}
                                {result && (
                                    <div className="p-2 rounded-[var(--radius-s)] bg-[var(--bg-1)] border border-[var(--line)] grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 text-xs font-mono shrink-0">
                                        {/* Module 1: Thrust & Forces */}
                                        <div className="p-2 rounded bg-[var(--bg-2)] border border-[var(--line)] flex flex-col justify-between">
                                            <div className="flex items-center justify-between text-[10px] text-[var(--alu-dim)] mb-1">
                                                <span className="flex items-center gap-1 font-bold text-[var(--cyan)]">
                                                    <Activity size={12} /> {t12(language, 'Thrust Force', 'İtme / Çekme')}
                                                </span>
                                                <span className="text-[9px] px-1 rounded bg-[var(--bg-0)] text-[var(--alu-dim)]">ISO 6020</span>
                                            </div>
                                            <div className="flex items-baseline justify-between">
                                                <span className="text-sm font-bold text-[var(--cyan)]">
                                                    {formatEngineeringValue(cylinderUnitConverters.force.fromBase(result.pushForceKN, forceUnit), precision, true)} <span className="text-[10px] font-normal text-[var(--alu-dim)]">{forceUnit}</span>
                                                </span>
                                                <span className="text-[11px] font-bold text-[var(--warn)]">
                                                    {formatEngineeringValue(cylinderUnitConverters.force.fromBase(result.pullForceKN, forceUnit), precision, true)} <span className="text-[9px] font-normal text-[var(--alu-dim)]">{forceUnit}</span>
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between text-[10px] text-[var(--alu-dim)] mt-1 pt-1 border-t border-[var(--line)]/50">
                                                <span>
                                                    {forceUnit === 'kN' 
                                                        ? `${Math.round(result.pushForceKN * 101.97)} kgf (${((result.pushForceKN * 101.97)/1000).toFixed(2)} t)`
                                                        : `${formatEngineeringValue(result.pushForceKN, precision, true)} kN (${Math.round(result.pushForceKN * 101.97)} kgf)`}
                                                </span>
                                                <span className="text-[var(--cyan)] font-bold">φ = {areaRatioPhi.toFixed(2)}</span>
                                            </div>
                                        </div>

                                        {/* Module 2: Operating Pressure & Tube Stress */}
                                        <div className="p-2 rounded bg-[var(--bg-2)] border border-[var(--line)] flex flex-col justify-between">
                                            <div className="flex items-center justify-between text-[10px] text-[var(--alu-dim)] mb-1">
                                                <span className="flex items-center gap-1 font-bold text-white">
                                                    <Gauge size={12} className="text-[var(--cyan)]" /> {t12(language, 'Pressure & Tube', 'Basınç & Boru')}
                                                </span>
                                                <span className="text-[9px] px-1 rounded bg-[var(--bg-0)] text-[var(--alu-dim)]">DIN 2413</span>
                                            </div>
                                            <div className="flex items-baseline justify-between">
                                                <span className="text-sm font-bold text-white font-mono">
                                                    {formatEngineeringValue(cylinderUnitConverters.pressure.fromBase(operatingPressureBar, pressureUnit), precision, true)} <span className="text-[10px] font-normal text-[var(--alu-dim)]">{pressureUnit}</span>
                                                </span>
                                                <span className="text-[11px] font-bold text-[var(--ok)]">
                                                    SF = {result.tubeYieldSafetyFactor}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between text-[10px] text-[var(--alu-dim)] mt-1 pt-1 border-t border-[var(--line)]/50">
                                                <span>t = {formatEngineeringValue(cylinderUnitConverters.linear.fromBase(result.tubeWallThicknessT, linearUnit), precision, true)} {linearUnit}</span>
                                                <span className="text-[var(--warn)]">{t12(language, 'Peak:', 'Pik:')} {formatEngineeringValue(cylinderUnitConverters.pressure.fromBase(peakPressureBar, pressureUnit), precision, true)} {pressureUnit}</span>
                                            </div>
                                        </div>

                                        {/* Module 3: Buckling Safety (Euler / Tetmajer) */}
                                        <div className={`p-2 rounded bg-[var(--bg-2)] border flex flex-col justify-between ${
                                            result.isBucklingSafe ? 'border-[var(--line)]' : 'border-[var(--bad)]/50 bg-[var(--bad)]/5'
                                        }`}>
                                            <div className="flex items-center justify-between text-[10px] text-[var(--alu-dim)] mb-1">
                                                <span className="flex items-center gap-1 font-bold text-[var(--cyan)]">
                                                    <ShieldCheck size={12} className={result.isBucklingSafe ? 'text-[var(--ok)]' : 'text-[var(--bad)]'} />
                                                    {t12(language, 'Buckling Safety', 'Burkulma')}
                                                </span>
                                                <span className={`text-[9px] px-1 rounded font-bold ${
                                                    result.isBucklingSafe ? 'bg-[var(--ok)]/15 text-[var(--ok)]' : 'bg-[var(--bad)]/15 text-[var(--bad)]'
                                                }`}>
                                                    {result.isBucklingSafe ? 'SAFE' : 'CRITICAL'}
                                                </span>
                                            </div>
                                            <div className="flex items-baseline justify-between">
                                                <span className={`text-sm font-bold ${result.isBucklingSafe ? 'text-[var(--ok)]' : 'text-[var(--bad)]'}`}>
                                                    SF = {formatEngineeringValue(result.bucklingSafetyFactor, precision, true)}
                                                </span>
                                                <span className="text-[10px] text-[var(--alu-dim)] font-mono">
                                                    λ = {result.rodSlendernessRatio.toFixed(1)}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between text-[10px] text-[var(--alu-dim)] mt-1 pt-1 border-t border-[var(--line)]/50">
                                                <span>Lk = {formatEngineeringValue(cylinderUnitConverters.linear.fromBase(result.bucklingLengthLkMm, linearUnit), precision, true)} {linearUnit}</span>
                                                {result.needsStopTube ? (
                                                    <span className="text-[var(--warn)] font-bold">Stop: {formatEngineeringValue(cylinderUnitConverters.linear.fromBase(result.stopTubeRecommendedLengthMm, linearUnit), precision, true)}{linearUnit}</span>
                                                ) : (
                                                    <span className="text-[var(--alu-dim)]">{result.bucklingRegime}</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Module 4: Velocity, Time & Flow */}
                                        <div className="p-2 rounded bg-[var(--bg-2)] border border-[var(--line)] flex flex-col justify-between">
                                            <div className="flex items-center justify-between text-[10px] text-[var(--alu-dim)] mb-1">
                                                <span className="flex items-center gap-1 font-bold text-[var(--cyan)]">
                                                    <Zap size={12} /> {t12(language, 'Kinematics & Flow', 'Hız & Güç')}
                                                </span>
                                                <span className="text-[9px] px-1 rounded bg-[var(--bg-0)] text-[var(--alu-dim)]">Q: {formatEngineeringValue(cylinderUnitConverters.flow.fromBase(pumpFlowRateLMin, flowUnit), precision, true)} {flowUnit}</span>
                                            </div>
                                            <div className="flex items-baseline justify-between">
                                                <span className="text-sm font-bold text-white">
                                                    {formatEngineeringValue(result.pushSpeedMPerSec, precision, true)} <span className="text-[10px] font-normal text-[var(--alu-dim)]">m/s</span>
                                                </span>
                                                <span className="text-[11px] font-bold text-[var(--cyan)]">
                                                    {formatEngineeringValue(result.hydraulicPowerKW, precision, true)} kW
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between text-[10px] text-[var(--alu-dim)] mt-1 pt-1 border-t border-[var(--line)]/50">
                                                <span>{t12(language, 't_push: ', 't_itme: ')}{formatEngineeringValue(result.pushStrokeTimeSec, precision, true)} s</span>
                                                <span className="text-[var(--alu-dim)]">{t12(language, 't_pull: ', 't_çekme: ')}{formatEngineeringValue(result.pullStrokeTimeSec, precision, true)} s</span>
                                            </div>
                                        </div>

                                        {/* Module 5: Dimensions & BOM Assembly Mass */}
                                        <div className="p-2 rounded bg-[var(--bg-2)] border border-[var(--line)] flex flex-col justify-between col-span-2 md:col-span-3 lg:col-span-1">
                                            <div className="flex items-center justify-between text-[10px] text-[var(--alu-dim)] mb-1">
                                                <span className="flex items-center gap-1 font-bold text-[var(--alu)]">
                                                    <Compass size={12} className="text-[var(--cyan)]" /> {t12(language, 'Assembly & Mass', 'Boyut & Kütle')}
                                                </span>
                                                <span className="text-[9px] px-1 rounded bg-[var(--bg-0)] text-[var(--alu-dim)]">{result.billOfMaterials.length} {t12(language, 'Parts', 'Parça')}</span>
                                            </div>
                                            <div className="flex items-baseline justify-between">
                                                <span className="text-sm font-bold text-white font-mono">
                                                    L = {formatEngineeringValue(cylinderUnitConverters.linear.fromBase(result.closedLengthMm, linearUnit), precision, true)} <span className="text-[10px] font-normal text-[var(--alu-dim)]">{linearUnit}</span>
                                                </span>
                                                <span className="text-[11px] font-bold text-[var(--warn)]">
                                                    {result.totalCylinderMassKg.toFixed(1)} kg
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between text-[10px] text-[var(--alu-dim)] mt-1 pt-1 border-t border-[var(--line)]/50">
                                                <span className="truncate max-w-[120px]" title={mountingStyle}>{mountingStyle.replace(/_/g, ' ').toUpperCase()}</span>
                                                <button type="button" onClick={() => setActiveTab('bom')} className="text-[var(--cyan)] hover:underline cursor-pointer">
                                                    BOM →
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'bom' && result && (() => {
                            const filteredBOM = result.billOfMaterials.filter(item => {
                                const matchesSearch = !bomSearch || 
                                    item.name.toLowerCase().includes(bomSearch.toLowerCase()) ||
                                    item.standard.toLowerCase().includes(bomSearch.toLowerCase()) ||
                                    item.material.toLowerCase().includes(bomSearch.toLowerCase()) ||
                                    (item.notes && item.notes.toLowerCase().includes(bomSearch.toLowerCase()));
                                
                                if (!matchesSearch) return false;
                                if (bomCategory === 'all') return true;
                                if (bomCategory === 'structure') return item.partNumber <= 5;
                                if (bomCategory === 'seals') return item.partNumber >= 6 && item.partNumber <= 10;
                                if (bomCategory === 'hardware') return item.partNumber >= 11;
                                return true;
                            });

                            const steelMass = result.billOfMaterials.filter(p => p.partNumber <= 5).reduce((acc, p) => acc + p.weightKg, 0);
                            const sealMass = result.billOfMaterials.filter(p => p.partNumber >= 6 && p.partNumber <= 10).reduce((acc, p) => acc + p.weightKg, 0);
                            const hardwareMass = result.billOfMaterials.filter(p => p.partNumber >= 11).reduce((acc, p) => acc + p.weightKg, 0);

                            return (
                                <div className="w-full space-y-3 font-mono">
                                    <div className="p-3 rounded-[var(--radius-s)] bg-[var(--bg-1)] border border-[var(--line)] space-y-3">
                                        {/* Header & CSV Export */}
                                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--line)] pb-2.5">
                                            <div className="flex items-center gap-2">
                                                <FileText size={15} className="text-[var(--cyan)]" />
                                                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--cyan)]">
                                                    {t12(language, '1:1 Complete Cylinder Bill of Materials (BOM)', '1:1 Komple Silindir Parça Listesi (Bill of Materials)')}
                                                </h3>
                                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-[var(--cyan)]/15 text-[var(--cyan)] font-bold border border-[var(--cyan)]/30">
                                                    {filteredBOM.length} / {result.billOfMaterials.length} {t12(language, 'Items', 'Kalem')}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={exportBOMToCSV}
                                                    className="px-2.5 py-1 rounded bg-[var(--bg-2)] hover:bg-[var(--bg-3)] border border-[var(--line)] text-xs text-[var(--ok)] hover:text-white font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                                                    title={t12(language, 'Download CSV', 'CSV Olarak İndir')}
                                                >
                                                    <Download size={13} />
                                                    <span>{t12(language, 'Export CSV', 'CSV İndir')}</span>
                                                </button>
                                                <span className="text-xs text-[var(--alu-dim)] pl-1">
                                                    {t12(language, 'Total Assembly Mass:', 'Toplam Montaj:')} <strong className="text-white">{result.totalCylinderMassKg.toFixed(2)} kg</strong>
                                                </span>
                                            </div>
                                        </div>

                                        {/* Mass Distribution Bar */}
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                                            <div className="p-2 rounded bg-[var(--bg-2)] border border-[var(--line)] flex items-center justify-between">
                                                <span className="text-[var(--alu-dim)]">{t12(language, 'Steel & Rod (St 52 / 20MnV6):', 'Gövde & Mil (St 52 / Krom):')}</span>
                                                <span className="text-white font-bold">{steelMass.toFixed(2)} kg ({((steelMass / result.totalCylinderMassKg) * 100).toFixed(0)}%)</span>
                                            </div>
                                            <div className="p-2 rounded bg-[var(--bg-2)] border border-[var(--line)] flex items-center justify-between">
                                                <span className="text-[var(--warn)]">{t12(language, 'Seals (PU/NBR/POM):', 'Sızdırmazlık Paketi:')}</span>
                                                <span className="text-[var(--warn)] font-bold">{sealMass.toFixed(2)} kg</span>
                                            </div>
                                            <div className="p-2 rounded bg-[var(--bg-2)] border border-[var(--line)] flex items-center justify-between">
                                                <span className="text-[var(--cyan)]">{t12(language, 'Hardware & Fasteners:', 'Bağlantı & Cıvatalar:')}</span>
                                                <span className="text-[var(--cyan)] font-bold">{hardwareMass.toFixed(2)} kg</span>
                                            </div>
                                        </div>

                                        {/* Filter Bar */}
                                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                                            <div className="flex items-center gap-1.5">
                                                <Filter size={13} className="text-[var(--alu-dim)]" />
                                                {(['all', 'structure', 'seals', 'hardware'] as const).map((cat) => (
                                                    <button
                                                        key={cat}
                                                        type="button"
                                                        onClick={() => setBomCategory(cat)}
                                                        className={`px-2 py-0.5 rounded text-[11px] font-bold border transition-colors cursor-pointer ${
                                                            bomCategory === cat
                                                                ? 'bg-[var(--cyan)]/20 border-[var(--cyan)] text-white'
                                                                : 'bg-[var(--bg-2)] border-[var(--line)] text-[var(--alu-dim)] hover:text-white'
                                                        }`}
                                                    >
                                                        {cat === 'all' && t12(language, 'All Items', 'Tümü')}
                                                        {cat === 'structure' && t12(language, 'Body & Rod', 'Kovan & Mil')}
                                                        {cat === 'seals' && t12(language, 'Seals (Kastaş)', 'Sızdırmazlık')}
                                                        {cat === 'hardware' && t12(language, 'Fasteners & Ports', 'Bağlantı Elemanları')}
                                                    </button>
                                                ))}
                                            </div>

                                            <div className="relative">
                                                <Search size={13} className="absolute left-2.5 top-2 text-[var(--alu-dim)]" />
                                                <input
                                                    type="text"
                                                    value={bomSearch}
                                                    onChange={(e) => setBomSearch(e.target.value)}
                                                    placeholder={t12(language, 'Search components, materials...', 'Bileşen veya malzeme ara...')}
                                                    className="w-56 h-7 pl-7 pr-2.5 rounded bg-[var(--bg-0)] border border-[var(--line)] text-xs text-white font-mono placeholder:text-[var(--alu-dim)]/60"
                                                />
                                            </div>
                                        </div>

                                        {/* Table */}
                                        <div className="overflow-x-auto rounded border border-[var(--line)]">
                                            <table className="w-full text-left text-xs font-mono border-collapse">
                                                <thead>
                                                    <tr className="border-b border-[var(--line)] bg-[var(--bg-2)] text-[var(--alu-dim)]">
                                                        <th className="p-2 w-12 text-center">No</th>
                                                        <th className="p-2">{t12(language, 'Component Name', 'Bileşen Adı')}</th>
                                                        <th className="p-2">{t12(language, 'Standard / Code', 'Standart / Kod')}</th>
                                                        <th className="p-2">{t12(language, 'Material', 'Malzeme')}</th>
                                                        <th className="p-2">{t12(language, 'Dimensions (mm)', 'Boyutlar (mm)')}</th>
                                                        <th className="p-2">{t12(language, 'Mass', 'Kütle')}</th>
                                                        <th className="p-2">{t12(language, 'Engineering Note', 'Mühendislik Notu')}</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-[var(--line)]">
                                                    {filteredBOM.map(item => {
                                                        const locItem = getLocalizedPart(item, language);
                                                        return (
                                                            <tr 
                                                                key={item.partNumber} 
                                                                onClick={() => setSelectedPartNumber(item.partNumber)}
                                                                className={`cursor-pointer transition-colors ${
                                                                    selectedPartNumber === item.partNumber 
                                                                        ? 'bg-[var(--cyan)]/15 font-bold' 
                                                                        : 'hover:bg-[var(--bg-2)]'
                                                                }`}
                                                            >
                                                                <td className="p-2 text-center text-[var(--cyan)] font-bold">{item.partNumber}</td>
                                                                <td className="p-2 text-white font-semibold">{locItem.name}</td>
                                                                <td className="p-2 text-[var(--std)]">{item.standard}</td>
                                                                <td className="p-2 text-[var(--alu)]">{locItem.material}</td>
                                                                <td className="p-2 text-[var(--warn)]">Ø{item.outerDiaMm} x {item.lengthMm}</td>
                                                                <td className="p-2 text-[var(--alu)]">{item.weightKg.toFixed(2)} kg</td>
                                                                <td className="p-2 text-[10px] text-[var(--alu-dim)]">{locItem.notes ?? '—'}</td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}

                        {activeTab === 'calculations' && result && (
                            <div className="w-full space-y-3 font-mono">
                                {/* Interactive Euler & Tetmajer Buckling Curve Diagram */}
                                <BucklingCurveSVG
                                    slendernessRatio={result.rodSlendernessRatio}
                                    transitionSlenderness={result.transitionSlendernessLambdaG}
                                    criticalForceKN={result.criticalBucklingForceKN}
                                    appliedForceKN={result.pushForceKN}
                                    safetyFactor={result.bucklingSafetyFactor}
                                    rodDiameterD={rodDiameterD}
                                    bucklingLengthLk={result.bucklingLengthLkMm}
                                    bucklingRegime={result.bucklingRegime}
                                    language={language}
                                />

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {/* Forces & Velocities */}
                                    <div className="p-3 rounded-[var(--radius-s)] bg-[var(--bg-1)] border border-[var(--line)] space-y-2">
                                        <h4 className="text-xs font-bold uppercase text-[var(--cyan)] flex items-center gap-1.5">
                                            <Gauge size={13} /> {t12(language, 'Kinematic & Force Balance', 'Kinematik & Kuvvet Dengesi')}
                                        </h4>
                                        <div className="space-y-1.5 text-xs">
                                            <div className="flex justify-between py-0.5 border-b border-[var(--line)]">
                                                <span className="text-[var(--alu-dim)]">{t12(language, 'Push Area (A1):', 'İtme Alanı (A1):')}</span>
                                                <span className="text-white font-bold">{formatEngineeringValue(result.pushAreaCm2, precision, true)} cm²</span>
                                            </div>
                                            <div className="flex justify-between py-0.5 border-b border-[var(--line)]">
                                                <span className="text-[var(--alu-dim)]">{t12(language, 'Pull Area (A2):', 'Çekme Alanı (A2):')}</span>
                                                <span className="text-white font-bold">{formatEngineeringValue(result.pullAreaCm2, precision, true)} cm²</span>
                                            </div>
                                            <div className="flex justify-between py-0.5 border-b border-[var(--line)]">
                                                <span className="text-[var(--alu-dim)]">{t12(language, 'Theoretical Push Force F_push:', 'Teorik İtme Kuvveti F_push:')}</span>
                                                <span className="text-[var(--cyan)] font-bold">{formatEngineeringValue(result.pushForceKN, precision, true)} kN ({Math.round(result.pushForceKN * 101.97)} kgf)</span>
                                            </div>
                                            <div className="flex justify-between py-0.5 border-b border-[var(--line)]">
                                                <span className="text-[var(--alu-dim)]">{t12(language, 'Theoretical Pull Force F_pull:', 'Teorik Çekme Kuvveti F_pull:')}</span>
                                                <span className="text-[var(--warn)] font-bold">{formatEngineeringValue(result.pullForceKN, precision, true)} kN ({Math.round(result.pullForceKN * 101.97)} kgf)</span>
                                            </div>
                                            <div className="flex justify-between py-0.5 border-b border-[var(--line)]">
                                                <span className="text-[var(--alu-dim)]">{t12(language, 'Advance Velocity (v1):', 'İlerleme Hızı (v1):')}</span>
                                                <span className="text-white font-bold">{formatEngineeringValue(result.pushSpeedMPerSec, precision, true)} m/s ({formatEngineeringValue(result.pushStrokeTimeSec, precision, true)} s)</span>
                                            </div>
                                            <div className="flex justify-between py-0.5">
                                                <span className="text-[var(--alu-dim)]">{t12(language, 'Required Hydraulic Power:', 'Gerekli Hidrolik Güç:')}</span>
                                                <span className="text-[var(--ok)] font-bold">{formatEngineeringValue(result.hydraulicPowerKW, precision, true)} kW</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Buckling: Euler & Tetmajer Analysis */}
                                    <div className="p-3 rounded-[var(--radius-s)] bg-[var(--bg-1)] border border-[var(--line)] space-y-2">
                                        <h4 className="text-xs font-bold uppercase text-[var(--warn)] flex items-center gap-1.5">
                                            <ShieldCheck size={13} /> {t12(language, 'Euler & Tetmajer Buckling (ISO/TR 10461)', 'Euler & Tetmajer Burkulma (ISO/TR 10461)')}
                                        </h4>
                                        <div className="space-y-1.5 text-xs">
                                            <div className="flex justify-between py-0.5 border-b border-[var(--line)]">
                                                <span className="text-[var(--alu-dim)]">{t12(language, 'Effective Length Factor (nu):', 'Burkulma Boyu Çarpanı (nu):')}</span>
                                                <span className="text-white font-bold">{result.effectiveBucklingFactorNu} (Lk = {result.bucklingLengthLkMm} mm)</span>
                                            </div>
                                            <div className="flex justify-between py-0.5 border-b border-[var(--line)]">
                                                <span className="text-[var(--alu-dim)]">{t12(language, 'Rod Slenderness Ratio (λ):', 'Mil Narinlik Oranı (λ):')}</span>
                                                <span className="text-white font-bold">{formatEngineeringValue(result.rodSlendernessRatio, precision, true)} (λ_g = {result.transitionSlendernessLambdaG})</span>
                                            </div>
                                            <div className="flex justify-between py-0.5 border-b border-[var(--line)]">
                                                <span className="text-[var(--alu-dim)]">{t12(language, 'Buckling Regime:', 'Aktif Burkulma Rejimi:')}</span>
                                                <span className="text-[var(--cyan)] font-bold">
                                                    {result.bucklingRegime === 'euler_elastic' ? t12(language, 'Euler Elastic (λ >= λ_g)', 'Euler Elastik (λ >= λ_g)') : t12(language, 'Tetmajer / Rankine Inelastic (λ < λ_g)', 'Tetmajer / Rankine İnelastik (λ < λ_g)')}
                                                </span>
                                            </div>
                                            <div className="flex justify-between py-0.5 border-b border-[var(--line)]">
                                                <span className="text-[var(--alu-dim)]">{t12(language, 'Critical Buckling Load F_k:', 'Kritik Burkulma Yükü F_k:')}</span>
                                                <span className="text-[var(--cyan)] font-bold">{formatEngineeringValue(result.criticalBucklingForceKN, precision, true)} kN</span>
                                            </div>
                                            <div className="flex justify-between py-0.5 border-b border-[var(--line)]">
                                                <span className="text-[var(--alu-dim)]">{t12(language, 'Buckling Safety Factor SF:', 'Burkulma Güvenlik Katsayısı SF:')}</span>
                                                <span className="font-bold" style={{ color: result.isBucklingSafe ? 'var(--ok)' : 'var(--bad)' }}>
                                                    {formatEngineeringValue(result.bucklingSafetyFactor, precision, true)} (Min: 3.50)
                                                </span>
                                            </div>
                                            <div className="flex justify-between py-0.5">
                                                <span className="text-[var(--alu-dim)]">{t12(language, 'Max Permissible Stroke:', 'İzin Verilen Azami Strok:')}</span>
                                                <span className="text-white font-bold">{result.maxPermissibleStrokeMm} mm</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Additional Tube Strength & Deflection */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div className="p-3 rounded-[var(--radius-s)] bg-[var(--bg-1)] border border-[var(--line)] space-y-2">
                                        <h4 className="text-xs font-bold uppercase text-[var(--std)] flex items-center gap-1.5">
                                            <Activity size={13} /> {t12(language, 'Tube Pressure Stress (DIN 2413)', 'Boru Mukavemet & Patlama (DIN 2413)')}
                                        </h4>
                                        <div className="space-y-1.5 text-xs">
                                            <div className="flex justify-between py-0.5 border-b border-[var(--line)]">
                                                <span className="text-[var(--alu-dim)]">{t12(language, 'Tube Wall Thickness (t):', 'Boru Et Kalınlığı (t):')}</span>
                                                <span className="text-white font-bold">{result.tubeWallThicknessT} mm ({t12(language, 'Min:', 'Min:')} {result.minRequiredWallThicknessT} mm)</span>
                                            </div>
                                            <div className="flex justify-between py-0.5 border-b border-[var(--line)]">
                                                <span className="text-[var(--alu-dim)]">{t12(language, 'Hoop Stress:', 'Teğetsel Çeper Gerilmesi (Hoop):')}</span>
                                                <span className="text-white font-bold">{result.tubeHoopStressMPa} MPa</span>
                                            </div>
                                            <div className="flex justify-between py-0.5 border-b border-[var(--line)]">
                                                <span className="text-[var(--alu-dim)]">{t12(language, 'Yield Safety Factor:', 'Akma Emniyet Katsayısı:')}</span>
                                                <span className="text-[var(--ok)] font-bold">{result.tubeYieldSafetyFactor} ({t12(language, 'Limit: 1.50', 'Limit: 1.50')})</span>
                                            </div>
                                            <div className="flex justify-between py-0.5">
                                                <span className="text-[var(--alu-dim)]">{t12(language, 'Burst Pressure (DIN 2413):', 'Patlama Basıncı (DIN 2413):')}</span>
                                                <span className="text-[var(--ok)] font-bold">{result.tubeBurstPressureBar} bar (SF: {result.tubeBurstSafetyFactor})</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-3 rounded-[var(--radius-s)] bg-[var(--bg-1)] border border-[var(--line)] space-y-2">
                                        <h4 className="text-xs font-bold uppercase text-[var(--alu)] flex items-center gap-1.5">
                                            <Scale size={13} /> {t12(language, 'Horizontal Rod Sag (Deflection)', 'Yatay Mil Kendi Ağırlığı Sehim Kontrolü')}
                                        </h4>
                                        <div className="space-y-1.5 text-xs">
                                            <div className="flex justify-between py-0.5 border-b border-[var(--line)]">
                                                <span className="text-[var(--alu-dim)]">{t12(language, 'Rod Self Weight:', 'Mil Kütlesi (Rod Weight):')}</span>
                                                <span className="text-white font-bold">{formatEngineeringValue(result.rodSelfWeightKg, precision, true)} kg</span>
                                            </div>
                                            <div className="flex justify-between py-0.5 border-b border-[var(--line)]">
                                                <span className="text-[var(--alu-dim)]">{t12(language, 'Max Horizontal Deflection δ_max:', 'Maksimum Yatay Sehim δ_max:')}</span>
                                                <span className="text-white font-bold">{result.maxHorizontalDeflectionMm} mm</span>
                                            </div>
                                            <div className="flex justify-between py-0.5 border-b border-[var(--line)]">
                                                <span className="text-[var(--alu-dim)]">{t12(language, 'Stop Tube (Spacer Ring):', 'Stop Tube (Mesafe Bileziği):')}</span>
                                                <span className={result.needsStopTube ? 'text-[var(--warn)] font-bold' : 'text-[var(--ok)] font-bold'}>
                                                    {result.needsStopTube ? `${t12(language, 'REQUIRED', 'GEREKLİ')} (${result.stopTubeRecommendedLengthMm} mm)` : t12(language, 'Not Required', 'Gerek Yok')}
                                                </span>
                                            </div>
                                            <div className="flex justify-between py-0.5">
                                                <span className="text-[var(--alu-dim)]">{t12(language, 'Deflection Assessment:', 'Sehim Uygunluğu:')}</span>
                                                <span className={result.isDeflectionAcceptable ? 'text-[var(--ok)] font-bold' : 'text-[var(--warn)] font-bold'}>
                                                    {result.isDeflectionAcceptable ? t12(language, 'ACCEPTABLE (<= 1.0 mm)', 'UYGUN (<= 1.0 mm)') : t12(language, 'CAUTION: Guide Gland Must Be Supported', 'DİKKAT: Yataklama Boğazı Desteklenmeli')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Engineering Formula Verification & Deterministic Traceability */}
                                <div className="p-3 rounded-[var(--radius-s)] bg-[var(--bg-1)] border border-[var(--line)] space-y-2">
                                    <div className="flex items-center justify-between border-b border-[var(--line)] pb-1.5">
                                        <h4 className="text-xs font-bold uppercase text-[var(--std)] flex items-center gap-1.5">
                                            <Cpu size={13} /> {t12(language, 'Formula Verification & Standards Traceability', 'Formül Doğrulama & Standart İzlenebilirliği')}
                                        </h4>
                                        <span className="text-[10px] text-[var(--alu-dim)] font-mono">ISO 6020-2 / DIN 2413 / ISO/TR 10461</span>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
                                        <div className="p-2 rounded bg-[var(--bg-2)] border border-[var(--line)] space-y-1">
                                            <div className="font-bold text-[var(--cyan)]">{t12(language, 'DIN 2413 Hoop Stress:', 'DIN 2413 Çeper Gerilmesi (Hoop Stress):')}</div>
                                            <div className="text-[var(--alu-dim)] font-mono">σ_t = (p · d_i) / (2 · t)</div>
                                            <div className="text-white font-mono text-[10px]">
                                                = ({operatingPressureBar} bar · 0.1 · {boreDiameterD} mm) / (2 · {result.tubeWallThicknessT} mm)
                                                = <span className="font-bold text-[var(--ok)]">{result.tubeHoopStressMPa} MPa</span>
                                            </div>
                                            <div className="text-[10px] text-[var(--alu-dim)]">{t12(language, 'Safety Ratio: S_yield = R_e / σ_t = ', 'Emniyet Oranı: S_akma = R_e / σ_t = ')}{result.tubeYieldSafetyFactor} {result.tubeYieldSafetyFactor >= 1.5 ? `(${t12(language, 'Safe', 'Emniyetli')})` : `(${t12(language, 'Unsafe', 'Emniyetsiz')})`}</div>
                                        </div>
                                        <div className="p-2 rounded bg-[var(--bg-2)] border border-[var(--line)] space-y-1">
                                            <div className="font-bold text-[var(--warn)]">{t12(language, 'Euler / Tetmajer Critical Buckling Load:', 'Euler / Tetmajer Kritik Yük (Buckling):')}</div>
                                            <div className="text-[var(--alu-dim)] font-mono">
                                                {result.bucklingRegime === 'euler_elastic' ? 'F_k = (π² · E · I) / L_k²' : 'σ_k = a - b · λ (Tetmajer)'}
                                            </div>
                                            <div className="text-white font-mono text-[10px]">
                                                L_k = {result.effectiveBucklingFactorNu} · L = {result.bucklingLengthLkMm} mm | λ = {result.rodSlendernessRatio}
                                                {' → '}F_k = <span className="font-bold text-[var(--cyan)]">{formatEngineeringValue(result.criticalBucklingForceKN, precision, true)} kN</span>
                                            </div>
                                            <div className="text-[10px] text-[var(--alu-dim)]">{t12(language, 'Safety: SF = F_k / F_push = ', 'Güvenlik: SF = F_k / F_push = ')}{formatEngineeringValue(result.bucklingSafetyFactor, precision, true)} (Min: 3.50)</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Summary Warnings */}
                                {result.summaryWarnings.length > 0 && (
                                    <div className="p-3 rounded-[var(--radius-s)] bg-[var(--bad)]/10 border border-[var(--bad)]/30 space-y-1.5 text-xs">
                                        <div className="flex items-center gap-1.5 text-[var(--bad)] font-bold">
                                            <AlertTriangle size={14} /> {t12(language, 'Engineering Limit Warnings:', 'Mühendislik Limit Uyarıları:')}
                                        </div>
                                        {result.summaryWarnings.map((w, idx) => (
                                            <p key={idx} className="text-[var(--bad)] leading-snug">
                                                · {w}
                                            </p>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'mountings' && result && (
                            <div className="w-full space-y-3 font-mono">
                                {/* Interactive ISO 6020-2 / ISO 6022 Mounting Selection Matrix */}
                                <MountingMatrixGrid
                                    currentMounting={mountingStyle}
                                    onSelectMounting={setMountingStyle}
                                    language={language}
                                />

                                {/* Grid with 2 primary cards: Barrel Connection & Mounting Points */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    
                                    {/* 1. Montaj Kinematiği & Mesnet Tepki Kuvvetleri */}
                                    <div className="p-3 rounded-[var(--radius-s)] bg-[var(--bg-1)] border border-[var(--line)] space-y-2.5">
                                        <div className="flex items-center justify-between border-b border-[var(--line)] pb-1.5">
                                            <h4 className="text-xs font-bold uppercase text-[var(--cyan)] flex items-center gap-1.5">
                                                <Compass size={13} /> {t12(language, 'Mounting Kinematics & Reaction Forces', 'Montaj Kinematiği & Tepki Kuvvetleri')}
                                            </h4>
                                            <span className="text-[10px] text-[var(--alu-dim)] font-bold">
                                                ISO 6020-2 / ISO/TR 10461
                                            </span>
                                        </div>

                                        <div className="space-y-1.5 text-xs">
                                            <div className="flex justify-between py-0.5 border-b border-[var(--line)]">
                                                <span className="text-[var(--alu-dim)]">{t12(language, 'Mounting Center Distance (Closed / Open Length):', 'Montaj Eksen Mesafesi (Kapalı / Açık Boy):')}</span>
                                                <span className="text-white font-bold">
                                                    {formatEngineeringValue(cylinderUnitConverters.linear.fromBase(result.closedLengthMm, linearUnit), precision, true)} {linearUnit} / {formatEngineeringValue(cylinderUnitConverters.linear.fromBase(result.extendedLengthMm, linearUnit), precision, true)} {linearUnit}
                                                </span>
                                            </div>
                                            <div className="flex justify-between py-0.5 border-b border-[var(--line)]">
                                                <span className="text-[var(--alu-dim)]">{t12(language, 'Buckling Factor (ν) / Effective Length (Lk):', 'Burkulma Katsayısı (ν) / Efektif Boy (Lk):')}</span>
                                                <span className="text-[var(--cyan)] font-bold">
                                                    ν = {result.effectiveBucklingFactorNu} → Lk = {formatEngineeringValue(cylinderUnitConverters.linear.fromBase(result.bucklingLengthLkMm, linearUnit), precision, true)} {linearUnit}
                                                </span>
                                            </div>
                                            <div className="flex justify-between py-0.5 border-b border-[var(--line)]">
                                                <span className="text-[var(--alu-dim)]">{t12(language, 'Support Reaction Force (F_push / F_pull):', 'Mesnet Tepki Kuvveti (F_push / F_pull):')}</span>
                                                <span className="text-white font-bold">
                                                    {formatEngineeringValue(cylinderUnitConverters.force.fromBase(result.pushForceKN, forceUnit), precision, true)} {forceUnit} / {formatEngineeringValue(cylinderUnitConverters.force.fromBase(result.pullForceKN, forceUnit), precision, true)} {forceUnit}
                                                </span>
                                            </div>
                                            <div className="flex justify-between py-0.5 border-b border-[var(--line)]">
                                                <span className="text-[var(--alu-dim)]">{t12(language, 'Max Permissible Stroke:', 'İzin Verilen Maksimum Strok:')}</span>
                                                <span className="text-white font-bold">
                                                    {formatEngineeringValue(cylinderUnitConverters.linear.fromBase(result.maxPermissibleStrokeMm, linearUnit), precision, true)} {linearUnit} ({t12(language, 'Current:', 'Mevcut:')} {formatEngineeringValue(cylinderUnitConverters.linear.fromBase(strokeS, linearUnit), precision, true)} {linearUnit})
                                                </span>
                                            </div>
                                            <div className="flex justify-between py-0.5 border-b border-[var(--line)]">
                                                <span className="text-[var(--alu-dim)]">{t12(language, 'Horizontal Sag δ_max (Rod Weight):', 'Yatay Sehim δ_max (Mil Ağırlığı):')}</span>
                                                <span className={result.isDeflectionAcceptable ? 'text-[var(--ok)] font-bold' : 'text-[var(--warn)] font-bold'}>
                                                    {result.maxHorizontalDeflectionMm} mm ({result.rodSelfWeightKg.toFixed(1)} kg)
                                                </span>
                                            </div>
                                            <div className="flex justify-between py-0.5 border-b border-[var(--line)]">
                                                <span className="text-[var(--alu-dim)]">{t12(language, 'Stop Tube (Spacer Ring):', 'Mesafe Bileziği (Stop Tube):')}</span>
                                                <span className={result.needsStopTube ? 'text-[var(--warn)] font-bold' : 'text-[var(--ok)] font-bold'}>
                                                    {result.needsStopTube ? `${t12(language, 'REQUIRED', 'GEREKLİ')} (${result.stopTubeRecommendedLengthMm} mm)` : t12(language, 'Not Required (Stroke < 1000 mm)', 'Gerek Yok (Strok < 1000 mm)')}
                                                </span>
                                            </div>
                                            <div className="flex justify-between py-0.5">
                                                <span className="text-[var(--alu-dim)]">{t12(language, 'Mounting Stability Status:', 'Mesnetleme Durumu:')}</span>
                                                <span className={`font-bold ${result.isBucklingSafe ? 'text-[var(--ok)]' : 'text-[var(--bad)]'}`}>
                                                    {result.isBucklingSafe ? t12(language, 'SAFE & STABLE (SF >= 3.50)', 'GÜVENLİ VE STABİL (SF ≥ 3.50)') : t12(language, 'CAUTION: Buckling Risk Present!', 'DİKKAT: Burkulma Riski Mevcut!')}
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-[var(--alu-dim)] leading-tight pt-1">
                                                {t12(language, 'According to ISO/TR 10461 buckling standard, the cylinder mounting type determines the piston rod Euler free length. For detailed flange/tie-rod bolt strength, see the "Body & Joints" tab.', 'ISO/TR 10461 burkulma standardına göre silindir mesnet tipi, piston milinin Euler serbest boyunu belirler. Ayrıntılı flanş/tie-rod cıvata mukavemetleri için "Gövde & Bağlantılar" sekmesini inceleyiniz.')}
                                            </p>
                                        </div>
                                    </div>

                                    {/* 2. Gövde Mesnetleme & Mafsal Tahkiki */}
                                    <div className="p-3 rounded-[var(--radius-s)] bg-[var(--bg-1)] border border-[var(--line)] space-y-2.5">
                                        <div className="flex items-center justify-between border-b border-[var(--line)] pb-1.5">
                                            <h4 className="text-xs font-bold uppercase text-[var(--warn)] flex items-center gap-1.5">
                                                <Anchor size={13} /> {t12(language, 'Mounting & Pin Articulation Stress', 'Mesnetleme & Pim Gerilme Tahkiki')}
                                            </h4>
                                            <span className="text-[10px] text-[var(--alu-dim)] font-bold">ISO 6020-2 / ISO 12240-1</span>
                                        </div>

                                        {result.hasTrunnion ? (
                                            <div className="space-y-1.5 text-xs">
                                                <div className="flex justify-between py-0.5 border-b border-[var(--line)]">
                                                    <span className="text-[var(--alu-dim)]">{t12(language, 'Trunnion Type & Position:', 'Muylu Tipi & Konumu:')}</span>
                                                    <span className="text-white font-bold">{mountingStyle === 'head_trunnion_mt1' ? t12(language, 'ISO MT1 Head Trunnion', 'ISO MT1 Ön Muylu') : t12(language, 'ISO MT4 Intermediate Trunnion', 'ISO MT4 Orta Muylu')} (X = {trunnionPositionMm || Math.round(strokeS / 2)} mm)</span>
                                                </div>
                                                <div className="flex justify-between py-0.5 border-b border-[var(--line)]">
                                                    <span className="text-[var(--alu-dim)]">{t12(language, 'Trunnion Pin Dia / Length:', 'Muylu Pimi Çapı / Boyu:')}</span>
                                                    <span className="text-[var(--cyan)] font-bold">Ø{result.trunnionPinDiaMm} mm x {result.trunnionPinLengthMm} mm (h8/f8)</span>
                                                </div>
                                                <div className="flex justify-between py-0.5 border-b border-[var(--line)]">
                                                    <span className="text-[var(--alu-dim)]">{t12(language, 'Trunnion Pin Shear Stress (τ):', 'Muylu Pimi Kayma Gerilmesi (τ):')}</span>
                                                    <span className="text-white font-bold">{formatEngineeringValue(result.trunnionShearStressMPa, precision, true)} MPa</span>
                                                </div>
                                                <div className="flex justify-between py-0.5 border-b border-[var(--line)]">
                                                    <span className="text-[var(--alu-dim)]">{t12(language, 'Trunnion Pin Bending Stress (σ_b):', 'Muylu Pimi Eğilme Gerilmesi (σ_b):')}</span>
                                                    <span className="text-white font-bold">{formatEngineeringValue(result.trunnionBendingStressMPa, precision, true)} MPa</span>
                                                </div>
                                                <div className="flex justify-between py-0.5 border-b border-[var(--line)]">
                                                    <span className="text-[var(--alu-dim)]">{t12(language, 'Bearing Contact Pressure (p_bearing):', 'Yatak Temas Basıncı (p_bearing):')}</span>
                                                    <span className="text-white font-bold">{formatEngineeringValue(result.trunnionBearingPressureMPa, precision, true)} MPa</span>
                                                </div>
                                                <div className="flex justify-between py-0.5 border-b border-[var(--line)]">
                                                    <span className="text-[var(--alu-dim)]">{t12(language, 'Trunnion Pin Safety Factor:', 'Muylu Pimi Emniyet Katsayısı:')}</span>
                                                    <span className={`font-bold ${result.trunnionSafetyFactor >= 2.5 ? 'text-[var(--ok)]' : 'text-[var(--bad)]'}`}>
                                                        {formatEngineeringValue(result.trunnionSafetyFactor, precision, true)} (Min: 2.50)
                                                    </span>
                                                </div>
                                                <div className="p-1.5 rounded bg-[var(--ok)]/10 border border-[var(--ok)]/20 text-[10px] text-[var(--ok)]">
                                                    {t12(language, 'Buckling Length Advantage: By trunnion mounting, effective buckling length is reduced to ', 'Burkulma Boyu Avantajı: Muyludan mesnetlendiği için burkulma boyu ')}{result.bucklingLengthLkMm}{t12(language, ' mm, significantly increasing buckling safety.', ' mm seviyesine düşürülmüş, burkulma emniyeti katlanmıştır.')}
                                                </div>
                                            </div>
                                        ) : result.hasSphericalBearing ? (
                                            <div className="space-y-1.5 text-xs">
                                                <div className="flex justify-between py-0.5 border-b border-[var(--line)]">
                                                    <span className="text-[var(--alu-dim)]">{t12(language, 'Spherical Plain Bearing Standard:', 'Oynak Rulman Standardı:')}</span>
                                                    <span className="text-white font-bold">{result.sphericalBearingDesignation} (ISO 12240-1 DIN 648)</span>
                                                </div>
                                                <div className="flex justify-between py-0.5 border-b border-[var(--line)]">
                                                    <span className="text-[var(--alu-dim)]">{t12(language, 'Static Load Capacity C_0:', 'Statik Yük Kapasitesi C_0:')}</span>
                                                    <span className="text-[var(--cyan)] font-bold">{result.sphericalBearingStaticCapacityKN} kN ({Math.round(result.sphericalBearingStaticCapacityKN * 101.97)} kgf)</span>
                                                </div>
                                                <div className="flex justify-between py-0.5 border-b border-[var(--line)]">
                                                    <span className="text-[var(--alu-dim)]">{t12(language, 'Applied Max Push F_push:', 'Uygulanan Maksimum İtme F_push:')}</span>
                                                    <span className="text-white font-bold">{formatEngineeringValue(result.pushForceKN, precision, true)} kN</span>
                                                </div>
                                                <div className="flex justify-between py-0.5 border-b border-[var(--line)]">
                                                    <span className="text-[var(--alu-dim)]">{t12(language, 'Bearing Static Safety Factor:', 'Rulman Statik Emniyet Katsayısı:')}</span>
                                                    <span className={`font-bold ${result.sphericalBearingSafetyFactor >= 1.5 ? 'text-[var(--ok)]' : 'text-[var(--bad)]'}`}>
                                                        {formatEngineeringValue(result.sphericalBearingSafetyFactor, precision, true)} (Min: 1.50)
                                                    </span>
                                                </div>
                                                <div className="flex justify-between py-0.5 border-b border-[var(--line)]">
                                                    <span className="text-[var(--alu-dim)]">{t12(language, 'Permissible Tilt Angle:', 'İzin Verilen Açısal Kaçıklık:')}</span>
                                                    <span className="text-[var(--ok)] font-bold">±{result.sphericalBearingTiltAngleDeg}° ({t12(language, 'Spherical Bearing Oscillation', 'Oynak Mafsal Salınımı')})</span>
                                                </div>
                                                <p className="text-[10px] text-[var(--alu-dim)] leading-tight pt-1">
                                                    {t12(language, 'ISO MP5 rear cap and AP4 rod eye spherical plain bearings absorb angular misalignments in the stroke path, preventing buckling and seal wear.', 'ISO MP5 arka kapak ve AP4 mil ucu oynak mafsal rulmanları, silindir hareket eksenindeki açısal kasılmaları emerek burkulma ve keçe aşınmasını önler.')}
                                                </p>
                                            </div>
                                        ) : mountingStyle === 'side_lugs_ms2' || mountingStyle === 'foot_mount' ? (
                                            <div className="space-y-1.5 text-xs">
                                                <div className="flex justify-between py-0.5 border-b border-[var(--line)]">
                                                    <span className="text-[var(--alu-dim)]">{t12(language, 'Offset Distance (h_offset):', 'Eksen Kaçıklık Mesafesi (h_offset):')}</span>
                                                    <span className="text-white font-bold">{result.footOffsetMm} mm ({t12(language, 'Tube Centerline to Base', 'Boru Ekseni - Taban')})</span>
                                                </div>
                                                <div className="flex justify-between py-0.5 border-b border-[var(--line)]">
                                                    <span className="text-[var(--alu-dim)]">{t12(language, 'Overturning Moment M_overturn:', 'Devirme Momenti M_overturn:')}</span>
                                                    <span className="text-[var(--warn)] font-bold">{formatEngineeringValue(result.footOverturnMomentNm, precision, true)} N·m</span>
                                                </div>
                                                <div className="flex justify-between py-0.5 border-b border-[var(--line)]">
                                                    <span className="text-[var(--alu-dim)]">{t12(language, 'Rear Anchor Bolt Tension:', 'Arka Ankraj Cıvata Çekme Kuvveti:')}</span>
                                                    <span className="text-white font-bold">{formatEngineeringValue(result.footBoltTensileForceN / 1000, precision, true)} kN</span>
                                                </div>
                                                <div className="flex justify-between py-0.5 border-b border-[var(--line)]">
                                                    <span className="text-[var(--alu-dim)]">{t12(language, 'Base Shear Load (Shear):', 'Taban Kesme Yükü (Shear):')}</span>
                                                    <span className="text-white font-bold">{formatEngineeringValue(result.footBoltShearForceN / 1000, precision, true)} kN</span>
                                                </div>
                                                <div className="p-1.5 rounded bg-[var(--warn)]/10 border border-[var(--warn)]/20 text-[10px] text-[var(--warn)]">
                                                    {t12(language, 'Field Warning: To prevent foot bolts from taking pure shear, a 10-15 mm high thrust key should be welded to the chassis behind the base flange.', 'Saha Uyarısı: Ayak cıvatalarının kesmeye çalışmasını önlemek için taban flanşı arkasına şasiye 10-15 mm yüksekliğinde kama (thrust key) kaynatılmalıdır.')}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-1.5 text-xs">
                                                <div className="flex justify-between py-0.5 border-b border-[var(--line)]">
                                                    <span className="text-[var(--alu-dim)]">{t12(language, 'Clevis Pin Diameter:', 'Mafsal Pimi Çapı:')}</span>
                                                    <span className="text-white font-bold">Ø{result.clevisPinDiaMm} mm (h8/f8)</span>
                                                </div>
                                                <div className="flex justify-between py-0.5 border-b border-[var(--line)]">
                                                    <span className="text-[var(--alu-dim)]">{t12(language, 'Double Shear Stress (τ_pin):', 'Çift Kesme Gerilmesi (τ_pin):')}</span>
                                                    <span className="text-white font-bold">{formatEngineeringValue(result.clevisPinShearStressMPa, precision, true)} MPa</span>
                                                </div>
                                                <div className="flex justify-between py-0.5 border-b border-[var(--line)]">
                                                    <span className="text-[var(--alu-dim)]">{t12(language, 'Clevis Eye Bearing Pressure:', 'Çatal Gözü Yatak Basıncı:')}</span>
                                                    <span className="text-white font-bold">{formatEngineeringValue(result.clevisPinBearingPressureMPa, precision, true)} MPa</span>
                                                </div>
                                                <div className="flex justify-between py-0.5 border-b border-[var(--line)]">
                                                    <span className="text-[var(--alu-dim)]">{t12(language, 'Rear Mounting Style:', 'Arka Mesnetleme Tipi:')}</span>
                                                    <span className="text-[var(--cyan)] font-bold">{mountingStyle}</span>
                                                </div>
                                                <p className="text-[10px] text-[var(--alu-dim)] leading-tight pt-1">
                                                    {t12(language, 'Pin and clevis eye must be mated with induction-hardened pins according to ISO 8132 / ISO 6020-2 tolerances.', 'Pim ve çatal gözü ISO 8132 / ISO 6020-2 toleranslarına göre indüksiyonla sertleştirilmiş pim ile eşleştirilmelidir.')}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Bottom Strip: Rod End Articulation & Workshop Guidelines */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {/* Rod End Connection Card */}
                                    <div className="p-3 rounded-[var(--radius-s)] bg-[var(--bg-1)] border border-[var(--line)] space-y-2">
                                        <h4 className="text-xs font-bold uppercase text-[var(--cyan)] flex items-center gap-1.5">
                                            <Link2 size={13} /> {t12(language, 'Piston Rod End Connection (ISO 6982 / ISO 8132)', 'Mil Ucu Bağlantı Tahkiki (ISO 6982 / ISO 8132)')}
                                        </h4>
                                        <div className="space-y-1.5 text-xs">
                                            <div className="flex justify-between py-0.5 border-b border-[var(--line)]">
                                                <span className="text-[var(--alu-dim)]">{t12(language, 'Selected Rod End Type:', 'Seçilen Mil Ucu Tipi:')}</span>
                                                <span className="text-white font-bold">{rodEndType}</span>
                                            </div>
                                            <div className="flex justify-between py-0.5 border-b border-[var(--line)]">
                                                <span className="text-[var(--alu-dim)]">{t12(language, 'Rod Thread Size (ISO 6020-2):', 'Mil Diş Ölçüsü (ISO 6020-2):')}</span>
                                                <span className="text-[var(--cyan)] font-bold">{result.rodEndThread}</span>
                                            </div>
                                            <div className="flex justify-between py-0.5 border-b border-[var(--line)]">
                                                <span className="text-[var(--alu-dim)]">{t12(language, 'Guide Gland Material:', 'Kılavuzlama Boğaz Malzemesi:')}</span>
                                                <span className="text-white font-bold">{t12(language, 'Bronze / Cast Iron Guide (H9/f7)', 'Bronz / Döküm Kılavuz (H9/f7)')}</span>
                                            </div>
                                            <div className="flex justify-between py-0.5">
                                                <span className="text-[var(--alu-dim)]">{t12(language, 'Guide Wear Bands:', 'Yataklama Bantları:')}</span>
                                                <span className="text-[var(--ok)] font-bold">{result.sealingBOM.pistonGuideRings}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Workshop / Field Directives Card */}
                                    <div className="p-3 rounded-[var(--radius-s)] bg-[var(--bg-1)] border border-[var(--line)] space-y-2">
                                        <h4 className="text-xs font-bold uppercase text-[var(--ok)] flex items-center gap-1.5">
                                            <CheckCircle2 size={13} /> {t12(language, 'Field Assembly & Manufacturing Directives', 'Saha Montaj & İmalat Direktifleri')}
                                        </h4>
                                        <div className="space-y-1 text-[11px] text-[var(--alu)]">
                                            <p className="leading-snug">
                                                <strong className="text-white">· {t12(language, 'VDI 2230 Torque Tightening:', 'VDI 2230 Tork Sıkma:')}</strong> {t12(language, 'All flange bolts and tie-rod studs must be tightened using a torque wrench in a crosswise pattern in 3 stages.', 'Bütün flanş cıvataları ve tie-rod saplamaları tork anahtarı ile çapraz düzende 3 kademede sıkılmalıdır.')}
                                            </p>
                                            <p className="leading-snug">
                                                <strong className="text-white">· {t12(language, 'ISO 12240-1 Lubrication:', 'ISO 12240-1 Gresleme:')}</strong> {t12(language, 'Spherical plain bearings (GE..ES) must be saturated with high-pressure lithium-based grease prior to assembly.', 'Oynak mafsal rulmanları (GE..ES) montaj öncesi lityum bazlı yüksek basınç gresi ile doyurulmalıdır.')}
                                            </p>
                                            <p className="leading-snug">
                                                <strong className="text-white">· {t12(language, 'DIN 2413 Barrel Welding:', 'DIN 2413 Kovan Kaynağı:')}</strong> {t12(language, 'In barrel end butt welds, there must be no root protrusion or thermal distortion on the inner surface of the honed tube.', 'Kovan alın kaynaklarında honlu boru iç yüzeyinde kök taşması veya ısıl deformasyon olmamalıdır.')}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'connections' && result && (
                            <div className="w-full space-y-3 font-mono">
                                {/* Top Banner: Standards & Overall Verification Status */}
                                <div className="p-3 rounded-[var(--radius-s)] bg-[var(--bg-1)] border border-[var(--line)] flex flex-wrap items-center justify-between gap-2">
                                    <div className="space-y-0.5">
                                        <div className="flex items-center gap-2">
                                            <Wrench size={15} className="text-[var(--warn)]" />
                                            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                                                {t12(language, 'Manufacturing & Joint Verification Core (ISO / DIN / VDI)', 'İmalat & Bağlantı Tahkikleri Merkezi (ISO / DIN / VDI)')}
                                            </h3>
                                        </div>
                                        <p className="text-[10px] text-[var(--alu-dim)]">
                                            {t12(
                                                language,
                                                'DIN EN ISO 5817 Level B Welds · VDI 2230 High-Tensile 10.9/12.9 Flange Bolts · DIN 76-A Relief Undercut · DIN 3116 Spanner Face Holes',
                                                'DIN EN ISO 5817 Seviye B Kaynaklar · VDI 2230 10.9/12.9 Yüksek Mukavemetli Cıvatalar · DIN 76-A Gerilim Kanalı · DIN 3116 Vidalı Boğaz Pim Delikleri'
                                            )}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2.5 py-1 rounded text-xs font-bold border flex items-center gap-1.5 ${
                                            result.weldedJoints.overallWeldsSafe && result.boltedJoints.overallBoltsSafe && result.threadedJoints.overallThreadsSafe
                                                ? 'bg-[var(--ok)]/10 border-[var(--ok)]/40 text-[var(--ok)]'
                                                : 'bg-[var(--bad)]/10 border-[var(--bad)]/40 text-[var(--bad)]'
                                        }`}>
                                            {result.weldedJoints.overallWeldsSafe && result.boltedJoints.overallBoltsSafe && result.threadedJoints.overallThreadsSafe ? (
                                                <>
                                                    <ShieldCheck size={14} />
                                                    <span>{t12(language, 'ALL JOINTS VERIFIED SAFE', 'TÜM BAĞLANTILAR EMNİYETLİ')}</span>
                                                </>
                                            ) : (
                                                <>
                                                    <AlertTriangle size={14} />
                                                    <span>{t12(language, 'CHECK JOINT CAPACITY', 'BAĞLANTI KAPASİTESİNİ İNCELEYİN')}</span>
                                                </>
                                            )}
                                        </span>
                                    </div>
                                </div>

                                {/* Catalog Match Banner if present */}
                                {result.matchedCatalog && (
                                    <div className="p-2.5 rounded-[var(--radius-s)] bg-[var(--bg-1)] border border-[var(--cyan-dim)]/40 flex flex-wrap items-center justify-between text-xs gap-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--cyan)]/20 text-[var(--cyan)] font-bold uppercase">
                                                {result.matchedCatalog.manufacturer}
                                            </span>
                                            <span className="text-white font-bold">{result.matchedCatalog.seriesName}</span>
                                            {result.matchedCatalog.exactMatchedCode && (
                                                <span className="text-[10px] text-[var(--warn)] font-mono">({result.matchedCatalog.exactMatchedCode})</span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3 text-[10px] text-[var(--alu-dim)]">
                                            <span>{t12(language, 'Test Pressure:', 'Test Basıncı:')} <strong className="text-white">{result.matchedCatalog.peakPressureBar} bar</strong></span>
                                            <span>{t12(language, 'Reference:', 'Referans:')} <strong className="text-[var(--cyan)]">{result.matchedCatalog.catalogPageReference}</strong></span>
                                        </div>
                                    </div>
                                )}

                                {/* 3 Column Engineering Grid */}
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                                    {/* 1. Kaynaklı Birleşimler */}
                                    <div className="p-3 rounded-[var(--radius-s)] bg-[var(--bg-1)] border border-[var(--line)] space-y-2.5">
                                        <div className="flex items-center justify-between border-b border-[var(--line)] pb-1.5">
                                            <h4 className="text-xs font-bold uppercase text-[var(--warn)] flex items-center gap-1.5">
                                                <Layers size={13} /> {t12(language, '1. Welded Joints (ISO 5817)', '1. Kaynaklı Birleşimler')}
                                            </h4>
                                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--warn)]/15 text-[var(--warn)] border border-[var(--warn)]/30">
                                                Level B (Eurocode 3)
                                            </span>
                                        </div>

                                        <div className="space-y-1.5 text-xs">
                                            <div className="text-[10px] font-bold text-[var(--cyan)] uppercase pt-0.5">
                                                {t12(language, 'Rear Cap Circumferential Weld', 'Arka Kapak Çevresel Alın/Köşe Kaynağı')}
                                            </div>
                                            <div className="flex justify-between py-0.5 border-b border-[var(--line)]">
                                                <span className="text-[var(--alu-dim)]">{t12(language, 'Weld Throat Thickness (a_w):', 'Dikiş Kalınlığı (a_w):')}</span>
                                                <span className="text-white font-bold">{formatEngineeringValue(result.weldedJoints.tubeRearCapWeld.throatAwMm, precision, true)} mm</span>
                                            </div>
                                            <div className="flex justify-between py-0.5 border-b border-[var(--line)]">
                                                <span className="text-[var(--alu-dim)]">{t12(language, 'Weld Length (L_w):', 'Dikiş Boyu (L_w):')}</span>
                                                <span className="text-white font-bold">{formatEngineeringValue(result.weldedJoints.tubeRearCapWeld.lengthMm, precision, true)} mm</span>
                                            </div>
                                            <div className="flex justify-between py-0.5 border-b border-[var(--line)]">
                                                <span className="text-[var(--alu-dim)]">{t12(language, 'Weld Stress (σ_w):', 'Kaynak Gerilmesi (σ_w):')}</span>
                                                <span className="text-white font-bold">{formatEngineeringValue(result.weldedJoints.tubeRearCapWeld.stressMPa, precision, true)} MPa</span>
                                            </div>
                                            <div className="flex justify-between py-0.5 border-b border-[var(--line)]">
                                                <span className="text-[var(--alu-dim)]">{t12(language, 'Allowable Stress (S355):', 'İzin Verilen Gerilme (S355):')}</span>
                                                <span className="text-[var(--alu-dim)] font-bold">{formatEngineeringValue(result.weldedJoints.tubeRearCapWeld.allowableStressMPa, precision, true)} MPa</span>
                                            </div>
                                            <div className="flex justify-between py-0.5 border-b border-[var(--line)]">
                                                <span className="text-[var(--alu-dim)]">{t12(language, 'Weld Safety Factor:', 'Kaynak Emniyet Katsayısı:')}</span>
                                                <span className={`font-bold ${result.weldedJoints.tubeRearCapWeld.safetyFactor >= 1.5 ? 'text-[var(--ok)]' : 'text-[var(--bad)]'}`}>
                                                    {formatEngineeringValue(result.weldedJoints.tubeRearCapWeld.safetyFactor, precision, true)} (Min: 1.50)
                                                </span>
                                            </div>

                                            <div className="text-[10px] font-bold text-[var(--cyan)] uppercase pt-1.5">
                                                {t12(language, 'Port Bosses & Attachments', 'Port ve Mesnet Köşe Kaynakları')}
                                            </div>
                                            <div className="flex justify-between py-0.5 border-b border-[var(--line)]">
                                                <span className="text-[var(--alu-dim)]">{t12(language, 'Port Boss Welds (a_w):', 'Port Rekor Kaynakları (a_w):')}</span>
                                                <span className="text-white font-bold">{formatEngineeringValue(result.weldedJoints.portBossWelds.throatAwMm, precision, true)} mm ({result.weldedJoints.portBossWelds.isSafe ? t12(language, 'SAFE', 'UYGUN') : t12(language, 'EXCESSIVE', 'AŞIRI')})</span>
                                            </div>
                                            {result.weldedJoints.trunnionWelds && (
                                                <div className="flex justify-between py-0.5 border-b border-[var(--line)]">
                                                    <span className="text-[var(--alu-dim)]">{t12(language, 'Trunnion Collar Welds:', 'Muylu Bilezik Kaynakları:')}</span>
                                                    <span className="text-white font-bold">2x a={result.weldedJoints.trunnionWelds.throatAwMm} mm ({t12(language, 'SAFE', 'UYGUN')})</span>
                                                </div>
                                            )}
                                            {result.weldedJoints.weldEyeShank && (
                                                <div className="flex justify-between py-0.5 border-b border-[var(--line)]">
                                                    <span className="text-[var(--alu-dim)]">{t12(language, 'Rod End Welded Lug:', 'Mil Ucu Kaynaklı Kulak:')}</span>
                                                    <span className="text-white font-bold">a={result.weldedJoints.weldEyeShank.throatAwMm} mm ({t12(language, 'SAFE', 'UYGUN')})</span>
                                                </div>
                                            )}
                                            <p className="text-[10px] text-[var(--alu-dim)] leading-tight pt-1">
                                                {t12(language, 'DIN EN ISO 5817 Level B requires that tubes operating under hydrostatic pressure have zero porosity, zero incomplete penetration, and zero cracks.', 'DIN EN ISO 5817 Seviye B standardı, hidrostatik basınç altında çalışan kovanlarda gözenek, kök noksanlığı ve çatlak olmamasını şart koşar.')}
                                            </p>
                                        </div>
                                    </div>

                                    {/* 2. Cıvatalı Bağlantılar */}
                                    <div className="p-3 rounded-[var(--radius-s)] bg-[var(--bg-1)] border border-[var(--line)] space-y-2.5">
                                        <div className="flex items-center justify-between border-b border-[var(--line)] pb-1.5">
                                            <h4 className="text-xs font-bold uppercase text-[var(--cyan)] flex items-center gap-1.5">
                                                <Anchor size={13} /> {t12(language, '2. Bolted Joints (VDI 2230)', '2. Cıvatalı Bağlantılar')}
                                            </h4>
                                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--cyan)]/15 text-[var(--cyan)] border border-[var(--cyan)]/30">
                                                ISO 4762 Grade 10.9
                                            </span>
                                        </div>

                                        <div className="space-y-1.5 text-xs">
                                            {result.boltedJoints.flangeBolts ? (
                                                <>
                                                    <div className="text-[10px] font-bold text-[var(--cyan)] uppercase pt-0.5">
                                                        {t12(language, 'Front / Rear Flange Bolts', 'Ön / Arka Flanş Cıvataları')}
                                                    </div>
                                                    <div className="flex justify-between py-0.5 border-b border-[var(--line)]">
                                                        <span className="text-[var(--alu-dim)]">{t12(language, 'Bolt Type & Qty:', 'Cıvata Tipi & Adedi:')}</span>
                                                        <span className="text-white font-bold">{result.boltedJoints.flangeBolts.count}x {result.boltedJoints.flangeBolts.size} ({result.boltedJoints.flangeBolts.standard})</span>
                                                    </div>
                                                    <div className="flex justify-between py-0.5 border-b border-[var(--line)]">
                                                        <span className="text-[var(--alu-dim)]">{t12(language, 'Strength Class:', 'Mukavemet Sınıfı:')}</span>
                                                        <span className="text-[var(--cyan)] font-bold">Grade {result.boltedJoints.flangeBolts.grade}</span>
                                                    </div>
                                                    <div className="flex justify-between py-0.5 border-b border-[var(--line)]">
                                                        <span className="text-[var(--alu-dim)]">{t12(language, 'Pitch Circle Diameter (PCD):', 'Hatve Dairesi Çapı (PCD):')}</span>
                                                        <span className="text-white font-bold">{result.boltedJoints.flangeBolts.pcdMm} mm</span>
                                                    </div>
                                                    <div className="flex justify-between py-0.5 border-b border-[var(--line)]">
                                                        <span className="text-[var(--alu-dim)]">{t12(language, 'Preload Force F_M:', 'Ön Gerilme Kuvveti F_M:')}</span>
                                                        <span className="text-white font-bold">{(result.boltedJoints.flangeBolts.preloadForcePerBoltN / 1000).toFixed(2)} {t12(language, 'kN/bolt', 'kN/cıvata')}</span>
                                                    </div>
                                                    <div className="flex justify-between py-0.5 border-b border-[var(--line)]">
                                                        <span className="text-[var(--alu-dim)]">{t12(language, 'Tightening Torque M_A (VDI 2230):', 'Sıkma Torku M_A (VDI 2230):')}</span>
                                                        <span className="text-[var(--warn)] font-bold">{formatEngineeringValue(result.boltedJoints.flangeBolts.tighteningTorqueNm, precision, true)} N·m</span>
                                                    </div>
                                                    <div className="flex justify-between py-0.5 border-b border-[var(--line)]">
                                                        <span className="text-[var(--alu-dim)]">{t12(language, 'Bolt Safety Factor:', 'Cıvata Güvenlik Katsayısı:')}</span>
                                                        <span className={`font-bold ${result.boltedJoints.flangeBolts.safetyFactor >= 2.0 ? 'text-[var(--ok)]' : 'text-[var(--bad)]'}`}>
                                                            {formatEngineeringValue(result.boltedJoints.flangeBolts.safetyFactor, precision, true)} (Min: 2.00)
                                                        </span>
                                                    </div>
                                                </>
                                            ) : result.boltedJoints.tieRodStuds ? (
                                                <>
                                                    <div className="text-[10px] font-bold text-[var(--cyan)] uppercase pt-0.5">
                                                        {t12(language, 'Tie-Rod Through Studs', 'Gergi Saplamaları (Tie-Rods)')}
                                                    </div>
                                                    <div className="flex justify-between py-0.5 border-b border-[var(--line)]">
                                                        <span className="text-[var(--alu-dim)]">{t12(language, 'Stud Count & Diameter:', 'Saplama Sayısı & Çapı:')}</span>
                                                        <span className="text-white font-bold">{result.boltedJoints.tieRodStuds.count}x {result.boltedJoints.tieRodStuds.size} (DIN 939)</span>
                                                    </div>
                                                    <div className="flex justify-between py-0.5 border-b border-[var(--line)]">
                                                        <span className="text-[var(--alu-dim)]">{t12(language, 'Stud Tightening Torque M_A:', 'Saplama Sıkma Torku M_A:')}</span>
                                                        <span className="text-[var(--warn)] font-bold">{formatEngineeringValue(result.boltedJoints.tieRodStuds.tighteningTorqueNm, precision, true)} N·m</span>
                                                    </div>
                                                    <div className="flex justify-between py-0.5 border-b border-[var(--line)]">
                                                        <span className="text-[var(--alu-dim)]">{t12(language, 'Stud Safety Factor:', 'Saplama Emniyet Katsayısı:')}</span>
                                                        <span className={`font-bold ${result.boltedJoints.tieRodStuds.safetyFactor >= 2.0 ? 'text-[var(--ok)]' : 'text-[var(--bad)]'}`}>
                                                            {formatEngineeringValue(result.boltedJoints.tieRodStuds.safetyFactor, precision, true)} (Min: 2.00)
                                                        </span>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="space-y-2 py-1 text-xs">
                                                    <div className="text-[10px] font-bold text-[var(--cyan)] uppercase pt-0.5">
                                                        {t12(language, 'Welded Body Advantage (Zero Flange Bolts)', 'Kaynaklı Kovan Avantajı (Cıvatasız)')}
                                                    </div>
                                                    <div className="p-2 rounded bg-[var(--bg-2)] border border-[var(--line)] space-y-1 text-[11px]">
                                                        <div className="text-white font-bold">{t12(language, '100% Sealing Reliability:', '100% Sızdırmazlık Emniyeti:')}</div>
                                                        <div className="text-[var(--alu-dim)]">
                                                            {t12(language, 'In heavy mobile and agricultural cylinders, full penetration butt welding is used instead of body flange bolts. This eliminates VDI 2230 bolt fatigue or vibration loosening risks completely.', 'Ağır mobil ve tarım silindirlerinde gövde flanş cıvataları yerine tam nüfuziyetli alın kaynağı kullanılır. Bu sayede VDI 2230 cıvata yorulması veya titreşimle gevşeme riski sıfırlanır.')}
                                                        </div>
                                                    </div>
                                                    <div className="flex justify-between py-0.5 border-b border-[var(--line)]">
                                                        <span className="text-[var(--alu-dim)]">{t12(language, 'Front Gland Retention:', 'Ön Boğaz Sabitleme:')}</span>
                                                        <span className="text-white font-bold">{t12(language, 'M90x2 Threaded Gland / Retaining Ring', 'M90x2 Vidalı Boğaz / Hilal Pim')}</span>
                                                    </div>
                                                    <div className="flex justify-between py-0.5 border-b border-[var(--line)]">
                                                        <span className="text-[var(--alu-dim)]">{t12(language, 'Dynamic Pressure Rating:', 'Dinamik Basınç Dayanımı:')}</span>
                                                        <span className="text-[var(--ok)] font-bold">250 bar ({t12(language, 'Peak 320 bar', 'Pik 320 bar')})</span>
                                                    </div>
                                                </div>
                                            )}

                                            {result.boltedJoints.clampableEyePinchBolts && (
                                                <>
                                                    <div className="text-[10px] font-bold text-[var(--warn)] uppercase pt-1.5">
                                                        {t12(language, 'Rexroth CGKD Clampable Swivel Head', 'Bosch Rexroth CGKD Yarıklı Klemens Cıvatası')}
                                                    </div>
                                                    <div className="flex justify-between py-0.5 border-b border-[var(--line)]">
                                                        <span className="text-[var(--alu-dim)]">{t12(language, 'Clamp Bolt Size:', 'Klemens Cıvata Ölçüsü:')}</span>
                                                        <span className="text-white font-bold">{result.boltedJoints.clampableEyePinchBolts.count}x {result.boltedJoints.clampableEyePinchBolts.screwSize} ({result.boltedJoints.clampableEyePinchBolts.standard})</span>
                                                    </div>
                                                    <div className="flex justify-between py-0.5 border-b border-[var(--line)]">
                                                        <span className="text-[var(--alu-dim)]">{t12(language, 'Catalog Tightening Torque M_A:', 'Katalog Sıkma Torku M_A:')}</span>
                                                        <span className="text-[var(--warn)] font-bold">{result.boltedJoints.clampableEyePinchBolts.tighteningTorqueNm} N·m (Rexroth RE 17042)</span>
                                                    </div>
                                                    <div className="flex justify-between py-0.5 border-b border-[var(--line)]">
                                                        <span className="text-[var(--alu-dim)]">{t12(language, 'Admissible Load (F_adm):', 'İzin Verilen Yük (F_adm):')}</span>
                                                        <span className="text-white font-bold">{result.boltedJoints.clampableEyePinchBolts.admissibleLoadKN} kN</span>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* 3. Dişli Bağlantılar */}
                                    <div className="p-3 rounded-[var(--radius-s)] bg-[var(--bg-1)] border border-[var(--line)] space-y-2.5">
                                        <div className="flex items-center justify-between border-b border-[var(--line)] pb-1.5">
                                            <h4 className="text-xs font-bold uppercase text-[var(--ok)] flex items-center gap-1.5">
                                                <Settings2 size={13} /> {t12(language, '3. Threaded Joints (DIN 13 / 76-A)', '3. Dişli Bağlantılar')}
                                            </h4>
                                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--ok)]/15 text-[var(--ok)] border border-[var(--ok)]/30">
                                                DIN 3116 Spanner
                                            </span>
                                        </div>

                                        <div className="space-y-1.5 text-xs">
                                            <div className="text-[10px] font-bold text-[var(--cyan)] uppercase pt-0.5">
                                                {t12(language, 'Front Gland Thread (MAG KHS Style)', 'Ön Boğaz Vidalı Kovan Dişi (MAG KHS)')}
                                            </div>
                                            <div className="flex justify-between py-0.5 border-b border-[var(--line)]">
                                                <span className="text-[var(--alu-dim)]">{t12(language, 'Gland Thread Size (D_3):', 'Boğaz Diş Ölçüsü (D_3):')}</span>
                                                <span className="text-white font-bold">{result.threadedJoints.glandThread.size}</span>
                                            </div>
                                            <div className="flex justify-between py-0.5 border-b border-[var(--line)]">
                                                <span className="text-[var(--alu-dim)]">{t12(language, 'Thread Engagement Length:', 'Vidalı Kavrama Boyu:')}</span>
                                                <span className="text-white font-bold">{result.threadedJoints.glandThread.engagementLengthMm} mm</span>
                                            </div>
                                            <div className="flex justify-between py-0.5 border-b border-[var(--line)]">
                                                <span className="text-[var(--alu-dim)]">{t12(language, 'Stripping Shear Stress:', 'Sıyırma Kayma Gerilmesi:')}</span>
                                                <span className="text-white font-bold">{formatEngineeringValue(result.threadedJoints.glandThread.shearStressMPa, precision, true)} MPa</span>
                                            </div>
                                            <div className="flex justify-between py-0.5 border-b border-[var(--line)]">
                                                <span className="text-[var(--alu-dim)]">{t12(language, 'Thread Stripping Safety:', 'Diş Sıyırma Emniyeti:')}</span>
                                                <span className={`font-bold ${result.threadedJoints.glandThread.safetyFactor >= 2.5 ? 'text-[var(--ok)]' : 'text-[var(--bad)]'}`}>
                                                    {formatEngineeringValue(result.threadedJoints.glandThread.safetyFactor, precision, true)} (Min: 2.50)
                                                </span>
                                            </div>
                                            <div className="flex justify-between py-0.5 border-b border-[var(--line)]">
                                                <span className="text-[var(--alu-dim)]">{t12(language, 'Tightening Torque:', 'Sıkma Torku:')}</span>
                                                <span className="text-[var(--warn)] font-bold">{result.threadedJoints.glandThread.recommendedTorqueNm} N·m</span>
                                            </div>
                                            <div className="flex justify-between py-0.5 border-b border-[var(--line)]">
                                                <span className="text-[var(--alu-dim)]">{t12(language, 'Pin Holes (DIN 3116):', 'Pim Delikleri (DIN 3116):')}</span>
                                                <span className="text-[var(--alu-dim)] font-bold">{result.threadedJoints.glandThread.spannerHoles}</span>
                                            </div>

                                            <div className="text-[10px] font-bold text-[var(--cyan)] uppercase pt-1.5">
                                                {t12(language, 'Rod End Thread & Piston Nut', 'Mil Ucu & Piston Emniyet Somunu')}
                                            </div>
                                            <div className="flex justify-between py-0.5 border-b border-[var(--line)]">
                                                <span className="text-[var(--alu-dim)]">{t12(language, 'Rod End Thread Size:', 'Mil Ucu Diş Ölçüsü:')}</span>
                                                <span className="text-white font-bold">{result.threadedJoints.rodEndThread.size} (SF: {formatEngineeringValue(result.threadedJoints.rodEndThread.safetyFactor, precision, true)})</span>
                                            </div>
                                            <div className="flex justify-between py-0.5 border-b border-[var(--line)]">
                                                <span className="text-[var(--alu-dim)]">{t12(language, 'Stress Relief Undercut:', 'Gerilim Boşaltma Kanalı:')}</span>
                                                <span className="text-white font-bold">{result.threadedJoints.rodEndThread.undercutStandard} (R={result.threadedJoints.rodEndThread.undercutRadiusMm}mm)</span>
                                            </div>
                                            <div className="flex justify-between py-0.5 border-b border-[var(--line)]">
                                                <span className="text-[var(--alu-dim)]">{t12(language, 'Jam Nut Tightening Torque:', 'Kontra Somun Sıkma Torku:')}</span>
                                                <span className="text-[var(--warn)] font-bold">{result.threadedJoints.rodEndThread.counterNutTorqueNm} N·m ({result.threadedJoints.rodEndThread.counterNutStandard})</span>
                                            </div>
                                            <div className="flex justify-between py-0.5 border-b border-[var(--line)]">
                                                <span className="text-[var(--alu-dim)]">{t12(language, 'Piston Locking Nut:', 'Piston Kilitleme Somunu:')}</span>
                                                <span className="text-white font-bold">{result.threadedJoints.pistonLockNut.standard} {result.threadedJoints.pistonLockNut.threadSize} ({result.threadedJoints.pistonLockNut.lockTorqueNm} N·m)</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'cushioning' && result && (
                            <div className="w-full space-y-3 font-mono">
                                {/* Interactive End-of-Stroke Cushioning Deceleration Profile & Pressure Spike Graph */}
                                <CushioningProfileSVG
                                    cushionSpearDiaMm={result.cushionSpearDiaMm}
                                    cushionLengthMm={result.cushionLengthMm}
                                    approachSpeedMPerSec={result.pushSpeedMPerSec}
                                    movingMassKg={movingMassKg}
                                    operatingPressureBar={operatingPressureBar}
                                    peakPressureBar={peakPressureBar}
                                    kineticEnergyJoules={result.kineticEnergyJoules}
                                    baseDecelerationMPerSec2={result.cushioningDecelerationMPerSec2}
                                    basePeakPressureBar={result.peakCushioningPressureBar}
                                    portSize={result.recommendedPortSize}
                                    portFluidVelocityMPerSec={result.portFluidVelocityMPerSec}
                                    portVelocityRating={result.portVelocityRating}
                                    reynoldsNumber={result.reynoldsNumber}
                                    hasCushioningFront={hasCushioningFront}
                                    hasCushioningRear={hasCushioningRear}
                                    language={language}
                                />

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {/* Cushioning Dynamics */}
                                    <div className="p-3 rounded-[var(--radius-s)] bg-[var(--bg-1)] border border-[var(--line)] space-y-2">
                                        <h4 className="text-xs font-bold uppercase text-[var(--cyan)] flex items-center gap-1.5">
                                            <Zap size={13} /> {t12(language, 'End-of-Stroke Cushioning Dynamics (ISO 6020-2)', 'Uç Nokta Yastıklama Dinamiği (ISO 6020-2)')}
                                        </h4>
                                        <div className="space-y-1.5 text-xs">
                                            <div className="flex justify-between py-0.5 border-b border-[var(--line)]">
                                                <span className="text-[var(--alu-dim)]">{t12(language, 'Cushion Spear Dia / Length:', 'Yastıklama Mızrağı Çapı / Boyu:')}</span>
                                                <span className="text-white font-bold">Ø{result.cushionSpearDiaMm} mm / {result.cushionLengthMm} mm</span>
                                            </div>
                                            <div className="flex justify-between py-0.5 border-b border-[var(--line)]">
                                                <span className="text-[var(--alu-dim)]">{t12(language, 'Cushion Annular Throat Area:', 'Yastıklama Boğaz Kesit Alanı:')}</span>
                                                <span className="text-white font-bold">{result.cushionAnnularAreaCm2} cm²</span>
                                            </div>
                                            <div className="flex justify-between py-0.5 border-b border-[var(--line)]">
                                                <span className="text-[var(--alu-dim)]">{t12(language, 'Kinetic Energy to Absorb E_k:', 'Sönümlenecek Kinetik Enerji E_k:')}</span>
                                                <span className="text-[var(--warn)] font-bold">{result.kineticEnergyJoules} Joules</span>
                                            </div>
                                            <div className="flex justify-between py-0.5 border-b border-[var(--line)]">
                                                <span className="text-[var(--alu-dim)]">{t12(language, 'Deceleration Rate:', 'Yastıklama Yavaşlama İvmesi:')}</span>
                                                <span className="text-white font-bold">{result.cushioningDecelerationMPerSec2} m/s²</span>
                                            </div>
                                            <div className="flex justify-between py-0.5">
                                                <span className="text-[var(--alu-dim)]">{t12(language, 'Peak Cushioning Pressure p_cushion:', 'Tepe Yastıklama Basıncı p_cushion:')}</span>
                                                <span className="font-bold" style={{ color: result.isCushioningPressureSafe ? 'var(--ok)' : 'var(--bad)' }}>
                                                    {result.peakCushioningPressureBar} bar ({result.isCushioningPressureSafe ? t12(language, 'SAFE <= 1.5 p_n', 'GÜVENLİ <= 1.5 p_n') : t12(language, 'EXCESS PRESSURE!', 'AŞIRI BASINÇ!')})
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Ports & Fluid Velocity */}
                                    <div className="p-3 rounded-[var(--radius-s)] bg-[var(--bg-1)] border border-[var(--line)] space-y-2">
                                        <h4 className="text-xs font-bold uppercase text-[var(--std)] flex items-center gap-1.5">
                                            <Gauge size={13} /> {t12(language, 'Port Sizing & Fluid Velocity (ISO 6149 / ISO 228)', 'Port Boyutlandırma & Akış Hızı (ISO 6149 / ISO 228)')}
                                        </h4>
                                        <div className="space-y-1.5 text-xs">
                                            <div className="flex justify-between py-0.5 border-b border-[var(--line)]">
                                                <span className="text-[var(--alu-dim)]">{t12(language, 'Recommended Port Size:', 'Önerilen Port Ölçüsü:')}</span>
                                                <span className="text-[var(--cyan)] font-bold">{result.recommendedPortSize}</span>
                                            </div>
                                            <div className="flex justify-between py-0.5 border-b border-[var(--line)]">
                                                <span className="text-[var(--alu-dim)]">{t12(language, 'Port Thread Standard:', 'Port Diş Standardı:')}</span>
                                                <span className="text-white font-bold">{result.portThreadStandard}</span>
                                            </div>
                                            <div className="flex justify-between py-0.5 border-b border-[var(--line)]">
                                                <span className="text-[var(--alu-dim)]">{t12(language, 'Port Fluid Velocity v_port:', 'Port Akışkan Hızı v_port:')}</span>
                                                <span className="text-white font-bold">{result.portFluidVelocityMPerSec} m/s</span>
                                            </div>
                                            <div className="flex justify-between py-0.5 border-b border-[var(--line)]">
                                                <span className="text-[var(--alu-dim)]">{t12(language, 'Velocity Assessment:', 'Hız Değerlendirmesi:')}</span>
                                                <span className="font-bold" style={{ color: result.portVelocityRating === 'optimal' ? 'var(--ok)' : (result.portVelocityRating === 'moderate' ? 'var(--warn)' : 'var(--bad)') }}>
                                                    {result.portVelocityRating === 'optimal' ? t12(language, 'OPTIMAL (< 4 m/s)', 'OPTİMAL (< 4 m/s)') : (result.portVelocityRating === 'moderate' ? t12(language, 'ACCEPTABLE (4-6 m/s)', 'KABUL EDİLEBİLİR (4-6 m/s)') : t12(language, 'HIGH PRESSURE DROP (> 6 m/s)', 'YÜKSEK BASINÇ KAYBI (> 6 m/s)'))}
                                                </span>
                                            </div>
                                            <div className="flex justify-between py-0.5">
                                                <span className="text-[var(--alu-dim)]">{t12(language, 'Port Pressure Drop / Reynolds:', 'Port Basınç Kaybı / Reynolds:')}</span>
                                                <span className="text-white font-bold">{result.portPressureDropBar} bar / Re={result.reynoldsNumber}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Throttle Needle Valve & Reverse Free-Flow Check Valve Hydraulics */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div className="p-3 rounded-[var(--radius-s)] bg-[var(--bg-1)] border border-[var(--line)] space-y-2">
                                        <h4 className="text-xs font-bold uppercase text-[var(--cyan)] flex items-center gap-1.5">
                                            <Gauge size={13} /> {t12(language, 'Throttle Needle & Reverse Check Valve (ISO/TR 10461)', 'Ayarlı Kısma İğnesi & Geri Dönüş Çekvalfi (ISO/TR 10461)')}
                                        </h4>
                                        <div className="space-y-1.5 text-xs">
                                            <div className="flex justify-between py-0.5 border-b border-[var(--line)]">
                                                <span className="text-[var(--alu-dim)]">{t12(language, 'Needle Orifice Dia / Taper:', 'Kısma İğnesi Çapı / Konikliği:')}</span>
                                                <span className="text-white font-bold">Ø4.0 mm / 15° Konik İğne</span>
                                            </div>
                                            <div className="flex justify-between py-0.5 border-b border-[var(--line)]">
                                                <span className="text-[var(--alu-dim)]">{t12(language, 'Flow Metering Coefficient Cd:', 'Debi Kısma Katsayısı Cd:')}</span>
                                                <span className="text-[var(--cyan)] font-bold">Cd = 0.62 (Keskin Kenarlı Orifis)</span>
                                            </div>
                                            <div className="flex justify-between py-0.5 border-b border-[var(--line)]">
                                                <span className="text-[var(--alu-dim)]">{t12(language, 'Reverse Ball Check Valve Seat:', 'Ters Akış Bilyalı Çekvalf Yuvası:')}</span>
                                                <span className="text-white font-bold">Ø6.0 mm (A_akış = 28.3 mm²)</span>
                                            </div>
                                            <div className="flex justify-between py-0.5 border-b border-[var(--line)]">
                                                <span className="text-[var(--alu-dim)]">{t12(language, 'Check Valve Cracking Pressure:', 'Çekvalf Açılma Basıncı (Yaylı):')}</span>
                                                <span className="text-[var(--ok)] font-bold">Δp_crack = 0.5 bar</span>
                                            </div>
                                            <div className="flex justify-between py-0.5">
                                                <span className="text-[var(--alu-dim)]">{t12(language, 'Reverse Return Resistance:', 'Geri Dönüş Direnci / Hızlı Kalkış:')}</span>
                                                <span className="text-[var(--ok)] font-bold">&lt; 0.8 bar (Sıfır Kavitasyon / Anında Hızlanma)</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-3 rounded-[var(--radius-s)] bg-[var(--bg-1)] border border-[var(--line)] space-y-2">
                                        <h4 className="text-xs font-bold uppercase text-[var(--alu)] flex items-center gap-1.5">
                                            <Thermometer size={13} /> {t12(language, 'Oil Volumes & Heat Dissipation', 'Yağ Hacimleri & Isı Kaybı')}
                                        </h4>
                                        <div className="space-y-1.5 text-xs">
                                            <div className="flex justify-between py-0.5 border-b border-[var(--line)]">
                                                <span className="text-[var(--alu-dim)]">{t12(language, 'Extended / Retracted Oil Volume:', 'Açık / Kapalı Yağ Hacmi:')}</span>
                                                <span className="text-white font-bold">{result.oilVolumeExtendedLiters} L / {result.oilVolumeRetractedLiters} L</span>
                                            </div>
                                            <div className="flex justify-between py-0.5 border-b border-[var(--line)]">
                                                <span className="text-[var(--alu-dim)]">{t12(language, 'Differential Oil Displacement ΔV:', 'Diferansiyel Yağ Değişimi ΔV:')}</span>
                                                <span className="text-[var(--cyan)] font-bold">{result.oilDifferentialLiters} {t12(language, 'Liters', 'Litre')}</span>
                                            </div>
                                            <div className="flex justify-between py-0.5 border-b border-[var(--line)]">
                                                <span className="text-[var(--alu-dim)]">{t12(language, 'Continuous Heat Dissipation (Loss):', 'Sürekli Isı Üretimi (Kayıp):')}</span>
                                                <span className="text-[var(--warn)] font-bold">{result.heatGenerationKW} kW</span>
                                            </div>
                                            <div className="flex justify-between py-0.5">
                                                <span className="text-[var(--alu-dim)]">{t12(language, 'Minimum Reservoir Volume Required:', 'Gerekli Minimum Depo Hacmi:')}</span>
                                                <span className="text-[var(--ok)] font-bold">{result.minTankVolumeLiters} {t12(language, 'Liters (3x Flow)', 'Litre (3x Debi)')}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'seals' && result && (
                            <div className="w-full space-y-3 font-mono">
                                {/* Interactive Sealing Architecture & PV Operating Envelope Visualizer */}
                                <SealEnvelopeSVG
                                    pistonSealType={pistonSealType}
                                    rodSealType={rodSealType}
                                    wiperType={wiperType}
                                    operatingPressureBar={operatingPressureBar}
                                    rodSpeedMPerSec={result.pushSpeedMPerSec}
                                    boreD={boreDiameterD}
                                    rodD={rodDiameterD}
                                    sealingBOM={result.sealingBOM}
                                    language={language}
                                />
                                <div className="p-3 rounded-[var(--radius-s)] bg-[var(--bg-1)] border border-[var(--line)]">
                                    <h3 className="text-xs font-bold uppercase text-[var(--cyan)] mb-2 flex items-center gap-1.5">
                                        <Droplets size={14} /> {t12(language, 'Kastaş & ISO 3601 Sealing Pack Details', 'Kastaş & ISO 3601 Sızdırmazlık Paketi Detayları')}
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                                        <div className="p-2.5 rounded bg-[var(--bg-2)] border border-[var(--line)] space-y-1 text-xs">
                                            <span className="text-[var(--warn)] font-bold block">{t12(language, '1. Dynamic Rod Seal & Wiper', '1. Dinamik Boğaz Keçesi & Sıyırıcı')}</span>
                                            <p className="text-white font-semibold">{result.sealingBOM.rodSeal}</p>
                                            <p className="text-[var(--alu-dim)] text-[11px]">{result.sealingBOM.wiperSeal}</p>
                                        </div>
                                        <div className="p-2.5 rounded bg-[var(--bg-2)] border border-[var(--line)] space-y-1 text-xs">
                                            <span className="text-[var(--warn)] font-bold block">{t12(language, '2. Dynamic Piston Seal & Guides', '2. Dinamik Piston Keçesi & Kılavuzlar')}</span>
                                            <p className="text-white font-semibold">{result.sealingBOM.pistonSeal}</p>
                                            <p className="text-[var(--alu-dim)] text-[11px]">{result.sealingBOM.pistonGuideRings}</p>
                                        </div>
                                        <div className="p-2.5 rounded bg-[var(--bg-2)] border border-[var(--line)] space-y-1 text-xs">
                                            <span className="text-[var(--std)] font-bold block">{t12(language, '3. Internal Rod Static O-Ring (ISO 3601)', '3. Mil İçi Statik O-Ring (ISO 3601)')}</span>
                                            <p className="text-white font-semibold">{result.sealingBOM.internalRodORing}</p>
                                        </div>
                                        <div className="p-2.5 rounded bg-[var(--bg-2)] border border-[var(--line)] space-y-1 text-xs">
                                            <span className="text-[var(--std)] font-bold block">{t12(language, '4. Tube / Gland Static O-Ring', '4. Boğaz / Boru Statik O-Ringi')}</span>
                                            <p className="text-white font-semibold">{result.sealingBOM.tubeGlandORing}</p>
                                            <p className="text-[10px] text-[var(--alu-dim)]">{result.sealingBOM.backupRing}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* ISO 7425 Groove Machining Dimensions & Surface Finishes */}
                                <div className="p-3 rounded-[var(--radius-s)] bg-[var(--bg-1)] border border-[var(--line)] space-y-2">
                                    <h4 className="text-xs font-bold uppercase text-[var(--cyan)] flex items-center gap-1.5">
                                        <Wrench size={13} /> {t12(language, 'ISO 7425 Groove Machining Dimensions & Tolerances', 'ISO 7425 Keçe Yuvaları Talaşlı İmalat Ölçüleri & Toleransları')}
                                    </h4>
                                    <div className="overflow-x-auto custom-scrollbar">
                                        <table className="w-full text-left text-xs border-collapse">
                                            <thead>
                                                <tr className="border-b border-[var(--line)] text-[10px] text-[var(--alu-dim)] uppercase">
                                                    <th className="py-1 px-2">{t12(language, 'Housing / Groove', 'Sızdırmazlık Yuvası')}</th>
                                                    <th className="py-1 px-2">{t12(language, 'Standard', 'Standart')}</th>
                                                    <th className="py-1 px-2">{t12(language, 'Housing Dia (mm)', 'Kanal Çapı (mm)')}</th>
                                                    <th className="py-1 px-2">{t12(language, 'Groove Width Lg', 'Kanal Genişliği Lg')}</th>
                                                    <th className="py-1 px-2">{t12(language, 'Lead Chamfer', 'Giriş Pahı')}</th>
                                                    <th className="py-1 px-2">{t12(language, 'Surface Finish', 'Yüzey Pürüzlülüğü')}</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-[var(--line)]/50 text-[11px]">
                                                <tr>
                                                    <td className="py-1.5 px-2 text-white font-bold">{t12(language, 'Piston Seal Groove', 'Piston Keçesi Kanalı')} ({pistonSealType})</td>
                                                    <td className="py-1.5 px-2 text-[var(--std)]">ISO 7425-1</td>
                                                    <td className="py-1.5 px-2 font-mono text-[var(--cyan)]">Ø{boreDiameterD - (pistonSealType === 'K16' ? 12 : 10)} mm (h9)</td>
                                                    <td className="py-1.5 px-2 font-mono">{pistonSealType === 'K16' ? '14.0 mm (+0.2)' : pistonSealType === 'K21' ? '10.0 mm (+0.2)' : '6.5 mm (+0.2)'}</td>
                                                    <td className="py-1.5 px-2 font-mono">20° x 2.5 mm</td>
                                                    <td className="py-1.5 px-2 text-[var(--ok)] font-mono">Ra ≤ 0.20 µm / Rz ≤ 1.0 µm</td>
                                                </tr>
                                                <tr>
                                                    <td className="py-1.5 px-2 text-white font-bold">{t12(language, 'Rod Seal Groove', 'Boğaz Keçesi Yuvası')} ({rodSealType})</td>
                                                    <td className="py-1.5 px-2 text-[var(--std)]">ISO 7425-2</td>
                                                    <td className="py-1.5 px-2 font-mono text-[var(--cyan)]">Ø{rodDiameterD + 12} mm (H9)</td>
                                                    <td className="py-1.5 px-2 font-mono">{rodSealType === 'K35' ? '11.0 mm (+0.2)' : '9.5 mm (+0.2)'}</td>
                                                    <td className="py-1.5 px-2 font-mono">20° x 2.0 mm</td>
                                                    <td className="py-1.5 px-2 text-[var(--ok)] font-mono">Ra ≤ 0.15 µm / Rz ≤ 0.8 µm</td>
                                                </tr>
                                                <tr>
                                                    <td className="py-1.5 px-2 text-white font-bold">{t12(language, 'Wiper Scraper Cavity', 'Sıyırıcı Toz Keçesi Yuvası')} ({wiperType})</td>
                                                    <td className="py-1.5 px-2 text-[var(--std)]">{wiperType === 'K01' ? 'ISO 6195-A' : 'ISO 6195-B'}</td>
                                                    <td className="py-1.5 px-2 font-mono text-[var(--cyan)]">Ø{rodDiameterD + (wiperType === 'K03' ? 14 : 10)} mm ({wiperType === 'K03' ? 'H8' : 'H10'})</td>
                                                    <td className="py-1.5 px-2 font-mono">{wiperType === 'K03' ? '7.0 mm (+0.2)' : '5.0 mm (+0.2)'}</td>
                                                    <td className="py-1.5 px-2 font-mono">15° x 1.5 mm</td>
                                                    <td className="py-1.5 px-2 text-[var(--alu-dim)] font-mono">Ra ≤ 0.80 µm / Rz ≤ 3.2 µm</td>
                                                </tr>
                                                <tr>
                                                    <td className="py-1.5 px-2 text-white font-bold">{t12(language, 'POM Wear Rings (2x)', 'Piston Kılavuz Bantları (2x K73)')}</td>
                                                    <td className="py-1.5 px-2 text-[var(--std)]">ISO 10766</td>
                                                    <td className="py-1.5 px-2 font-mono text-[var(--cyan)]">Ø{boreDiameterD - 6} mm (h9)</td>
                                                    <td className="py-1.5 px-2 font-mono">9.5 mm (+0.2)</td>
                                                    <td className="py-1.5 px-2 font-mono">15° x 1.0 mm</td>
                                                    <td className="py-1.5 px-2 text-[var(--alu-dim)] font-mono">Ra ≤ 0.80 µm / Rz ≤ 3.2 µm</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Extrusion Gap Safety & Fluid Compatibility Matrix */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div className="p-3 rounded-[var(--radius-s)] bg-[var(--bg-1)] border border-[var(--line)] space-y-2">
                                        <h4 className="text-xs font-bold uppercase text-[var(--warn)] flex items-center gap-1.5">
                                            <ShieldCheck size={13} /> {t12(language, 'Extrusion Gap Safety (g_max)', 'Maksimum İzin Verilen Ekstrüzyon Boşluğu')}
                                        </h4>
                                        <div className="space-y-1.5 text-xs">
                                            <div className="flex justify-between py-0.5 border-b border-[var(--line)]">
                                                <span className="text-[var(--alu-dim)]">{t12(language, 'Operating Pressure:', 'Çalışma Basıncı:')}</span>
                                                <span className="text-white font-bold">{operatingPressureBar} bar ({t12(language, 'Peak:', 'Pik:')} {peakPressureBar} bar)</span>
                                            </div>
                                            <div className="flex justify-between py-0.5 border-b border-[var(--line)]">
                                                <span className="text-[var(--alu-dim)]">{t12(language, 'Radial Clearance Gap (g):', 'Mevcut Radyal Boşluk (g):')}</span>
                                                <span className="text-[var(--cyan)] font-bold">g = 0.25 - 0.30 mm</span>
                                            </div>
                                            <div className="flex justify-between py-0.5 border-b border-[var(--line)]">
                                                <span className="text-[var(--alu-dim)]">{t12(language, 'Max Gap without Backup Ring:', 'Destek Ringsiz Limit (70 ShA):')}</span>
                                                <span className="text-[var(--bad)] font-bold">g_max ≤ 0.15 mm ({t12(language, 'Insufficient', 'Yetmez')})</span>
                                            </div>
                                            <div className="flex justify-between py-0.5 border-b border-[var(--line)]">
                                                <span className="text-[var(--alu-dim)]">{t12(language, 'Max Gap with POM Backup Ring:', 'POM Destek Ringli Limit:')}</span>
                                                <span className="text-[var(--ok)] font-bold">g_max ≤ 0.40 mm ({t12(language, 'Safe', 'Güvenli')})</span>
                                            </div>
                                            <div className="flex justify-between py-0.5">
                                                <span className="text-[var(--alu-dim)]">{t12(language, 'Anti-Extrusion Protection:', 'Ekstrüzyon Dayanımı:')}</span>
                                                <span className="text-[var(--ok)] font-bold">{t12(language, 'FULLY PROTECTED (K16/K35 Supported)', 'TAM KORUMALI (K16/K35 Destekli)')}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-3 rounded-[var(--radius-s)] bg-[var(--bg-1)] border border-[var(--line)] space-y-2">
                                        <h4 className="text-xs font-bold uppercase text-[var(--alu)] flex items-center gap-1.5">
                                            <Thermometer size={13} /> {t12(language, 'Elastomer & Fluid Compatibility', 'Akışkan & Elastomer Uyumluluk Matrisi')}
                                        </h4>
                                        <div className="space-y-1.5 text-xs">
                                            <div className="flex justify-between py-0.5 border-b border-[var(--line)]">
                                                <span className="text-[var(--alu-dim)]">{t12(language, 'PU 95 Shore A (Polyurethane):', 'PU 95 Shore A (Poliüretan):')}</span>
                                                <span className="text-[var(--ok)] font-bold">{t12(language, 'Mineral Oil (Excellent, -35°C..+100°C)', 'Mineral Yağ (Mükemmel, -35°C..+100°C)')}</span>
                                            </div>
                                            <div className="flex justify-between py-0.5 border-b border-[var(--line)]">
                                                <span className="text-[var(--alu-dim)]">{t12(language, 'NBR 85 (Nitrile Rubber):', 'NBR 85 (Nitril Kauçuk):')}</span>
                                                <span className="text-[var(--ok)] font-bold">{t12(language, 'Standard Oils (-30°C..+105°C)', 'Standart Yağlar (-30°C..+105°C)')}</span>
                                            </div>
                                            <div className="flex justify-between py-0.5 border-b border-[var(--line)]">
                                                <span className="text-[var(--alu-dim)]">{t12(language, 'FKM Viton (Fluorocarbon):', 'FKM Viton (Florokarbon):')}</span>
                                                <span className="text-[var(--cyan)] font-bold">{t12(language, 'Synthetic Ester / High Temp (+200°C)', 'Sentetik Ester / Yüksek Isı (+200°C)')}</span>
                                            </div>
                                            <div className="flex justify-between py-0.5 border-b border-[var(--line)]">
                                                <span className="text-[var(--alu-dim)]">{t12(language, 'Bronze-Filled PTFE:', 'Bronz Dolgulu PTFE:')}</span>
                                                <span className="text-[var(--ok)] font-bold">{t12(language, 'Universal Low Friction (-60°C..+220°C)', 'Evrensel Düşük Sürtünme (-60°C..+220°C)')}</span>
                                            </div>
                                            <div className="flex justify-between py-0.5">
                                                <span className="text-[var(--alu-dim)]">{t12(language, 'Selected Fluid Assessment:', 'Seçili Akışkan Değerlendirmesi:')}</span>
                                                <span className="text-[var(--ok)] font-bold">
                                                    {isPneumatic ? t12(language, 'Pneumatic Dry Air Compatible', 'Pnömatik Kuru Hava Uygun') : t12(language, 'HLP/HVLP Mineral Oil Fully Compatible', 'HLP/HVLP Mineral Yağ Tam Uyumlu')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'manufacturing' && result && (
                            <div className="w-full space-y-3 font-mono">
                                {/* Interactive Manufacturing Quality Passport, ISO 286 Fit Gauge Bars & FAT Protocol */}
                                <ManufacturingPassportCard
                                    boreD={boreDiameterD}
                                    rodD={rodDiameterD}
                                    tubeBoreTolerance={result.tubeBoreTolerance}
                                    rodTolerance={result.rodTolerance}
                                    pistonTolerance={result.pistonTolerance}
                                    glandTolerance={result.glandTolerance}
                                    operatingPressureBar={operatingPressureBar}
                                    peakPressureBar={peakPressureBar}
                                    language={language}
                                />

                                {/* EN 10305-1 Straightness & ISO 4406 FAT Acceptance Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div className="p-3 rounded-[var(--radius-s)] bg-[var(--bg-1)] border border-[var(--line)] space-y-2">
                                        <h4 className="text-xs font-bold uppercase text-[var(--cyan)] flex items-center gap-1.5">
                                            <Scale size={13} /> {t12(language, 'EN 10305-1 / DIN 2391 Tube Geometry', 'Boru Geometrisi & Doğrusallık Toleransları (EN 10305-1)')}
                                        </h4>
                                        <div className="space-y-1.5 text-xs">
                                            <div className="flex justify-between py-0.5 border-b border-[var(--line)]">
                                                <span className="text-[var(--alu-dim)]">{t12(language, 'Tube Straightness Limit:', 'Doğrusallık Sapma Sınırı:')}</span>
                                                <span className="text-white font-bold">≤ 0.5 mm / 1000 mm (DIN 2391-C)</span>
                                            </div>
                                            <div className="flex justify-between py-0.5 border-b border-[var(--line)]">
                                                <span className="text-[var(--alu-dim)]">{t12(language, 'Max Deflection on Stroke:', 'Toplam Strok Boyunca Maks Sehim:')}</span>
                                                <span className="text-[var(--cyan)] font-bold">≤ {(0.5 * Math.max(100, strokeS) / 1000).toFixed(2)} mm</span>
                                            </div>
                                            <div className="flex justify-between py-0.5 border-b border-[var(--line)]">
                                                <span className="text-[var(--alu-dim)]">{t12(language, 'Honed Bore Out-of-Roundness:', 'Honlanmış Delik Ovallik Sınırı:')}</span>
                                                <span className="text-white font-bold">≤ 50% {t12(language, 'IT8 Tolerance', 'IT8 Toleransı')} (≤ 0.023 mm)</span>
                                            </div>
                                            <div className="flex justify-between py-0.5 border-b border-[var(--line)]">
                                                <span className="text-[var(--alu-dim)]">{t12(language, 'Hone Crosshatch Angle:', 'Honlama Çapraz Açı Aralığı:')}</span>
                                                <span className="text-[var(--ok)] font-bold">45° - 55° ({t12(language, 'Micro Oil Pockets', 'Mikro Yağ Yuvaları')})</span>
                                            </div>
                                            <div className="flex justify-between py-0.5">
                                                <span className="text-[var(--alu-dim)]">{t12(language, 'Surface Plateau Rpk / Rvk:', 'Plato Karakteristiği:')}</span>
                                                <span className="text-[var(--ok)] font-bold">Rpk ≤ 0.15 µm / Rvk = 0.4-0.8 µm</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-3 rounded-[var(--radius-s)] bg-[var(--bg-1)] border border-[var(--line)] space-y-2">
                                        <h4 className="text-xs font-bold uppercase text-[var(--ok)] flex items-center gap-1.5">
                                            <ShieldCheck size={13} /> {t12(language, 'ISO 4406 Cleanliness & FAT Pressure Hold', 'ISO 4406 Temizlik & FAT Basınç Testi')}
                                        </h4>
                                        <div className="space-y-1.5 text-xs">
                                            <div className="flex justify-between py-0.5 border-b border-[var(--line)]">
                                                <span className="text-[var(--alu-dim)]">{t12(language, 'Target Cleanliness Class:', 'Hedef Akışkan Temizlik Kodu:')}</span>
                                                <span className="text-[var(--cyan)] font-bold">ISO 4406 17/15/12 (NAS 1638 Sınıf 6/7)</span>
                                            </div>
                                            <div className="flex justify-between py-0.5 border-b border-[var(--line)]">
                                                <span className="text-[var(--alu-dim)]">{t12(language, 'Hydrostatic Proof Test Pressure:', 'Hidrostatik Mukavemet Test Basıncı:')}</span>
                                                <span className="text-[var(--warn)] font-bold">{Math.round(operatingPressureBar * 1.5)} bar (1.5 x p_n)</span>
                                            </div>
                                            <div className="flex justify-between py-0.5 border-b border-[var(--line)]">
                                                <span className="text-[var(--alu-dim)]">{t12(language, 'Test Holding Duration:', 'Basınç Tutma Süresi:')}</span>
                                                <span className="text-white font-bold">180 {t12(language, 'seconds (ISO 10100)', 'saniye (ISO 10100)')}</span>
                                            </div>
                                            <div className="flex justify-between py-0.5 border-b border-[var(--line)]">
                                                <span className="text-[var(--alu-dim)]">{t12(language, 'Permissible Pressure Drop:', 'İzin Verilen Basınç Düşüşü:')}</span>
                                                <span className="text-[var(--ok)] font-bold">≤ 1.0 bar / 180 s ({t12(language, 'Zero External Leakage', 'Sıfır Dış Kaçak')})</span>
                                            </div>
                                            <div className="flex justify-between py-0.5">
                                                <span className="text-[var(--alu-dim)]">{t12(language, 'Internal Piston Bypass Leakage:', 'İç Kaçak (Bypass Sızıntısı):')}</span>
                                                <span className="text-[var(--ok)] font-bold">&lt; 0.05 cm³/dak ({t12(language, 'Zero Bypass Leakage', 'Tam Sızdırmazlık')})</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                )}
            </div>

            {/* Certified Engineering Calculation Passport & Technical Datasheet Modal */}
            {result && (
                <CylinderReportModal
                    isOpen={isReportModalOpen}
                    onClose={() => setIsReportModalOpen(false)}
                    result={result}
                    precision={precision}
                    language={language}
                    onCopyReport={copyReport}
                    copied={copied}
                    onExportCSV={exportBOMToCSV}
                />
            )}
        </div>
    );
}
