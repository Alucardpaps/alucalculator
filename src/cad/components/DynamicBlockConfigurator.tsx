'use client';

/**
 * ⚡ AluCAD — AutoCAD-Grade Dynamic Block Configurator & Visual Studio
 * 
 * Complies with AGENTS.md "AluCalc Instrument" design system:
 * CNC control panel / Fluke meter / Mitutoyo readout.
 * Colors: var(--bg-0...3), var(--line), var(--cyan), var(--alu), var(--ink), var(--ok), var(--warn).
 * JetBrains Mono typography, crisp borders, zero glassmorphism.
 */

import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
    Sparkles,
    Search,
    Maximize2,
    Sliders,
    Layers,
    RotateCw,
    Plus,
    Box,
    Check,
    ArrowRightLeft,
    Compass,
    Eye,
    ShieldCheck,
    HelpCircle,
    Info,
    Grid,
    CornerDownRight,
    ExternalLink,
    Workflow,
    FileCode,
    Download
} from 'lucide-react';
import { useI18nStore } from '@/store/i18nStore';
import { t12 } from '@/locales/t12';
import { FlagIcon } from '@/components/ui/FlagIcon';
import { CAD_LANGUAGES } from '@/locales/cadTranslations';
import { DynamicBlockRegistry, DYNAMIC_BLOCKS } from '../blocks/dynamic/registry';
import { DynamicBlockDef, DynamicGrip } from '../blocks/dynamic/types';
import { DynamicBlockEngine } from '../blocks/dynamic/DynamicBlockEngine';
import { DynamicBlockAnimatedIcon } from './DynamicBlockAnimatedIcon';
import { downloadDynamicBlockCad } from '../export/cadExportService';
import { useCadStore } from '../store/cadStore';
import { commandProcessor } from '../commands/CommandProcessor';
import { InsertTool } from '../commands/tools/InsertTool';
import { useDesignStore } from '@/design-studio/designStore';
import { CrossModuleBridge, commitDesignParts } from '@/system/crossModuleBridge';
import { BLOCK_ENGINEERING_MESH, getBlockMeshLink, buildCalculatorUrlWithParams } from '@/system/blockEngineeringMesh';
import { computeTipShorteningData } from '@/engines/math/gearSynthesisEngine';
import { CHAIN_PITCHES } from '../blocks/dynamic/definitions/rollerSprocket';
import { PULLEY_PROFILE_OPTIONS } from '../blocks/dynamic/definitions/timingPulley';
import { METRIC_FASTENER_SPECS } from '../blocks/dynamic/definitions/fastener';
import { getStandardPld, getStandardToothDepth } from '@/engines/math/pulley-geometry-factory';
import {
    drawPolygonHatch,
    getBrushedMetalPattern,
    getCastIronPattern,
    getGalvanizedZincPattern,
    createCylindricalMetalGradient
} from '../render/materialTextures';

export const BLOCK_CALCULATOR_SHORTCUTS: Record<string, { route: string; labelEn: string; labelTr: string; standard: string }> = {
    'dyn_involute_gear': {
        route: '/gearbox-design/',
        labelEn: 'Open Gearbox & Involute Solver (ISO 53 / DIN 3960)',
        labelTr: 'Dişli & Şanzıman Hesaplayıcısına Git (ISO 53 / DIN 3960)',
        standard: 'ISO 53 / DIN 3960'
    },
    'dyn_roller_sprocket': {
        route: '/chain-drive/',
        labelEn: 'Open Roller Chain Drive Solver (ISO 606 / DIN 8187)',
        labelTr: 'Makaralı Zincir Hesaplayıcısına Git (ISO 606 / DIN 8187)',
        standard: 'ISO 606 / DIN 8187'
    },
    'dyn_timing_pulley': {
        route: '/belt-drive/',
        labelEn: 'Open Timing Belt Drive Solver (ISO 13050 / DIN 7721)',
        labelTr: 'Triger Kayış & Kasnak Hesaplayıcısına Git (ISO 13050)',
        standard: 'ISO 13050 / DIN 7721'
    },
    'dyn_fastener': {
        route: '/bolt-torque/',
        labelEn: 'Open Bolt Torque & Clamping Solver (VDI 2230)',
        labelTr: 'Civata Tork & Ön Yük Hesaplayıcısına Git (VDI 2230)',
        standard: 'VDI 2230 / ISO 898'
    },
    'dyn_steel_beam': {
        route: '/beam-deflection/',
        labelEn: 'Open Beam Deflection & Stress Solver (Eurocode 3)',
        labelTr: 'Kiriş Sehim & Mukavemet Hesaplayıcısına Git (EN 1993)',
        standard: 'EN 1993 / AISC'
    },
    'dyn_pipe_flange': {
        route: '/pipe-friction/',
        labelEn: 'Open Pipe Flow & Flange Solver (EN 1092-1)',
        labelTr: 'Boru Basınç Kaybı & Flanş Hesaplayıcısına Git (EN 1092)',
        standard: 'EN 1092-1 / Darcy'
    },
    'dyn_skf_bearing': {
        route: '/bearings/',
        labelEn: 'Open Bearing Life & Load Solver (ISO 281 / SKF)',
        labelTr: 'Rulman Ömrü ve Yataklama Hesabına Git (ISO 281)',
        standard: 'ISO 281 / ISO 15 / DIN 625'
    },
    'dyn_v_belt_pulley': {
        route: '/belt-drive/',
        labelEn: 'Open V-Belt Power Rating Solver (DIN 2211 / ISO 4184)',
        labelTr: 'V-Kayış Güç & Kasnak Hesabına Git (DIN 2211)',
        standard: 'DIN 2211 / ISO 4183'
    },
    'dyn_electric_motor': {
        route: '/motor-selection-std/',
        labelEn: 'Open Electric Motor & Torque Solver (IEC 60034)',
        labelTr: 'Elektrik Motoru & Tork Hesabına Git (IEC 60034)',
        standard: 'IEC 60034 / DIN EN 50347'
    },
    'dyn_hydraulic_cylinder': {
        route: '/cylinders/',
        labelEn: 'Open Hydraulic Cylinder Force & Pressure Solver (ISO 6020)',
        labelTr: 'Hidrolik Silindir Kuvvet ve Basınç Hesabına Git (ISO 6020)',
        standard: 'ISO 6020-2 / ISO 15552'
    },
    'dyn_linear_guide': {
        route: '/bearings/',
        labelEn: 'Open Linear Guideway Life & Load Solver (ISO 14728)',
        labelTr: 'Lineer Kızak Ömür ve Yük Hesabına Git (ISO 14728)',
        standard: 'ISO 12090-1 / ISO 14728'
    },
    'dyn_ball_screw': {
        route: '/motor-selection-std/',
        labelEn: 'Open Ball Screw Drive & Linear Feed Solver (ISO 3408)',
        labelTr: 'Vidalı Mil Tahrik ve Lineer İlerleme Hesabına Git (ISO 3408)',
        standard: 'ISO 3408 / DIN 69051'
    },
    'dyn_pillow_block': {
        route: '/bearings/',
        labelEn: 'Open Pillow Block Bearing Life Solver (ISO 281 / ISO 3228)',
        labelTr: 'Yataklı Rulman Ömür ve Yük Hesabına Git (ISO 281)',
        standard: 'ISO 3228 / ISO 281'
    },
    'dyn_shaft_coupling': {
        route: '/shafts/',
        labelEn: 'Open Shaft Torque & Keyway Stress Solver (DIN 743 / DIN 6885)',
        labelTr: 'Mil Tork ve Kama Mukavemet Hesabına Git (DIN 743)',
        standard: 'DIN 740 / DIN 6885'
    },
    'dyn_conveyor_roller': {
        route: '/chain-drive/',
        labelEn: 'Open Chain Drive & Conveyor Roller Solver (DIN 15207 / ISO 606)',
        labelTr: 'Zincir Tahrik ve Konveyör Rulo Hesabına Git (DIN 15207)',
        standard: 'DIN 15207 / FEM 2.131'
    },
    'dyn_pneumatic_gripper': {
        route: '/cylinders/',
        labelEn: 'Open Pneumatic Gripping Force Solver (ISO 9409)',
        labelTr: 'Pnömatik Tutucu Kuvvet ve Basınç Hesabına Git',
        standard: 'ISO 9409 / PGN-plus'
    },
    'dyn_industrial_valve': {
        route: '/fluid-dynamics/',
        labelEn: 'Open Valve Kv & Pipe Pressure Drop Solver (EN 558-1)',
        labelTr: 'Vana Kv ve Boru Basınç Kaybı Hesabına Git (EN 558-1)',
        standard: 'EN 558-1 / EN 1092-1'
    },
    'dyn_cable_drag_chain': {
        route: '/motor-selection-std/',
        labelEn: 'Open Linear Axis & Stroke Kinematics Solver',
        labelTr: 'Lineer Eksen ve Hareket Hesabına Git',
        standard: 'VDI 2860 / igus E4'
    },
    'dyn_helical_spring': {
        route: '/advanced-spring/',
        labelEn: 'Open Helical Spring Force & Stress Solver (EN 13906-1)',
        labelTr: 'Helisel Yay Kuvvet ve Gerilme Hesabına Git (EN 13906-1)',
        standard: 'EN 13906-1 / ISO 10243'
    },
    'dyn_heavy_caster_wheel': {
        route: '/bearings/',
        labelEn: 'Open Wheel Bearing Load & Life Solver (EN 12532 / ISO 281)',
        labelTr: 'Tekerlek Yükü ve Rulman Ömür Hesabına Git (EN 12532)',
        standard: 'EN 12532 / ISO 22883'
    },
    'dyn_tslot_profile': {
        route: '/beam-deflection/',
        labelEn: 'Open T-Slot Deflection & Bending Stress Solver (DIN EN 12020)',
        labelTr: 'T-Slot Profil Sehim ve Mukavemet Hesabına Git (DIN EN 12020)',
        standard: 'DIN EN 12020 / EN 755'
    },
    'dyn_box_profile': {
        route: '/beam-deflection/',
        labelEn: 'Open Box Section Beam Deflection Solver (EN 10219)',
        labelTr: 'Kutu Profil Sehim ve Mukavemet Hesabına Git (EN 10219)',
        standard: 'EN 10219 / EN 10210'
    },
    'dyn_angle_profile': {
        route: '/beam-deflection/',
        labelEn: 'Open Structural Angle Deflection Solver (DIN EN 10056)',
        labelTr: 'Köşebent Profil Mukavemet Hesabına Git (DIN EN 10056)',
        standard: 'DIN EN 10056-1 / ISO 657'
    },
    'dyn_aluminum_profile': {
        route: '/beam-deflection/',
        labelEn: 'Open Structural Aluminum Beam Solver (Eurocode 9 / EN 755)',
        labelTr: 'Alüminyum Yapısal Kiriş Hesabına Git (Eurocode 9)',
        standard: 'EN 755-9 / Eurocode 9'
    },
    'dyn_sheet_metal_plate': {
        route: '/nesting-2d/',
        labelEn: 'Open 2D Sheet Metal Nesting & Cutting Solver',
        labelTr: '2B Sac Yerleşim & Kesim Optimizasyonuna Git',
        standard: 'DIN EN 10131 / ISO 9013'
    },
    'dyn_gamak_motor': {
        route: '/three-phase-power/',
        labelEn: 'Open Gamak 3-Phase Induction Motor Solver (IEC 60034)',
        labelTr: 'Gamak 3-Fazlı Motor Güç & Akım Hesabına Git (IEC 60034)',
        standard: 'IEC 60034 / Gamak Makina'
    },
    'dyn_yilmaz_gearbox': {
        route: '/gears/',
        labelEn: 'Open Yılmaz Redüktör Gear Ratio & Torque Solver (ISO 6336)',
        labelTr: 'Yılmaz Redüktör Tahvil ve Tork Hesabına Git (ISO 6336)',
        standard: 'ISO 6336 / Yılmaz Redüktör'
    }
};

interface DynamicBlockConfiguratorProps {
    onClose?: () => void;
    onInserted2D?: () => void;
    onInserted3D?: () => void;
    onStampToSketch?: (blockDef: DynamicBlockDef, params: Record<string, any>) => void;
    initialBlockId?: string;
    initialParams?: Record<string, any>;
    onSaveInstance?: (params: Record<string, any>) => void;
}

export function DynamicBlockConfigurator({
    onClose,
    onInserted2D,
    onInserted3D,
    onStampToSketch,
    initialBlockId,
    initialParams,
    onSaveInstance
}: DynamicBlockConfiguratorProps) {
    const { language, setLanguage } = useI18nStore();
    const isTr = language === 'tr';
    const [showLangMenu, setShowLangMenu] = useState(false);

    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedBlockId, setSelectedBlockId] = useState<string>(() => {
        return initialBlockId || DYNAMIC_BLOCKS[0].id;
    });

    // Current parameter values map
    const [paramValues, setParamValues] = useState<Record<string, any>>(() => {
        const initBlock = initialBlockId ? DynamicBlockRegistry.getById(initialBlockId) : DYNAMIC_BLOCKS[0];
        return {
            ...(initBlock ? initBlock.defaultValues : DYNAMIC_BLOCKS[0].defaultValues),
            ...(initialParams || {})
        };
    });

    // Synchronize if initialBlockId or initialParams change
    useEffect(() => {
        if (initialBlockId) {
            setSelectedBlockId(initialBlockId);
            const block = DynamicBlockRegistry.getById(initialBlockId);
            if (block) {
                setParamValues({
                    ...block.defaultValues,
                    ...(initialParams || {})
                });
            }
        }
    }, [initialBlockId, initialParams]);

    // 2D Canvas Preview ref
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [hoveredGrip, setHoveredGrip] = useState<DynamicGrip | null>(null);

    // Insertion scale & rotation
    const [insertScale, setInsertScale] = useState<number>(1.0);
    const [insertRotationDeg, setInsertRotationDeg] = useState<number>(0);

    // Realistic procedural textures & material shading toggle
    const [realisticTextures, setRealisticTextures] = useState<boolean>(true);

    const activeBlock = useMemo(() => {
        return DynamicBlockRegistry.getById(selectedBlockId) || DYNAMIC_BLOCKS[0];
    }, [selectedBlockId]);

    // Live engineering calculation for gear blocks (ISO 53 / DIN 3960 / ISO 21771)
    const gearLiveInspection = useMemo(() => {
        if (activeBlock.id !== 'dyn_involute_gear') return null;
        const mn = Number(paramValues.module) || 3.0;
        const z1 = Math.max(6, Math.round(Number(paramValues.teeth) || 20));
        const z2 = Math.max(6, Math.round(Number(paramValues.teeth2) || 60));
        const alphaDeg = Number(paramValues.pressureAngle) || 20;
        const betaDeg = Number(paramValues.helixAngle) || 0;
        const x1 = Number(paramValues.profileShift) || 0;
        const x2 = Number(paramValues.profileShift2) || 0;
        const k = Number(paramValues.kFactor) || 0;
        const kMode = String(paramValues.kMode || 'workshop') as 'workshop' | 'auto' | 'custom';
        const isPair = (paramValues.gearMode || 'pair') === 'pair';

        const tipData = computeTipShorteningData({
            mn,
            z1,
            z2,
            betaDeg,
            alphaDeg,
            x1,
            x2,
            kMode,
            customK: k
        });

        const cosBeta = Math.max(0.01, Math.cos((betaDeg * Math.PI) / 180));
        const mt = mn / cosBeta;
        const d1 = z1 * mt;
        const d2 = z2 * mt;

        return {
            mn,
            z1,
            z2,
            x1,
            x2,
            betaDeg,
            k,
            kMode,
            isPair,
            d1,
            d2,
            tipData,
            aw: tipData.a_wt,
            a_standard: tipData.a_standard,
            da1: tipData.da1,
            da2: tipData.da2,
            y: tipData.y,
            k_din: tipData.k_din
        };
    }, [activeBlock.id, paramValues]);

    // Live engineering calculation for roller chain drives (ISO 606 / DIN 8187)
    const chainLiveInspection = useMemo(() => {
        if (activeBlock.id !== 'dyn_roller_sprocket') return null;
        const chainKey = String(paramValues.chainSize || '08B');
        const chainInfo = CHAIN_PITCHES[chainKey] || CHAIN_PITCHES['08B'];
        const p = chainInfo.pitch;
        const d_roller = chainInfo.d1;

        const z1 = Math.max(9, Math.round(Number(paramValues.teeth) || 19));
        const z2 = Math.max(9, Math.round(Number(paramValues.teeth2) || 38));
        const isPair = (paramValues.driveMode || 'pair') === 'pair';
        const bore1 = Math.max(0, Number(paramValues.boreDiameter) || 25);
        const bore2 = Math.max(0, Number(paramValues.boreDiameter2) || 35);

        const d1 = p / Math.sin(Math.PI / z1);
        const d2 = p / Math.sin(Math.PI / z2);
        const da1 = p * (0.6 + 1 / Math.tan(Math.PI / z1));
        const da2 = p * (0.6 + 1 / Math.tan(Math.PI / z2));
        const df1 = d1 - d_roller;
        const df2 = d2 - d_roller;

        const ratio = z2 / z1;
        const minA = (da1 + da2) / 2 + Math.max(10, p);
        const a = Math.max(minA, Number(paramValues.centerDistance) || 350);

        // ISO 606 / DIN 8187 link count
        const Lp_exact = (2 * a) / p + (z1 + z2) / 2 + Math.pow((z2 - z1) / (2 * Math.PI), 2) * (p / a);
        const Lp_even = Math.ceil(Lp_exact / 2) * 2;
        const chainLengthMm = Lp_even * p;

        // Small sprocket wrap angle & teeth in mesh
        const sinPhi = Math.min(0.99, Math.abs(d2 - d1) / (2 * a));
        const phiRad = Math.asin(sinPhi);
        const wrapAngleDeg = 180 - (2 * phiRad * 180) / Math.PI;
        const teethInMesh = (z1 * wrapAngleDeg) / 360;

        return {
            chainKey,
            chainLabel: chainInfo.label,
            p,
            d_roller,
            z1,
            z2,
            isPair,
            d1,
            d2,
            da1,
            da2,
            df1,
            df2,
            bore1,
            bore2,
            ratio,
            minA,
            a,
            Lp_exact,
            Lp_even,
            chainLengthMm,
            wrapAngleDeg,
            teethInMesh
        };
    }, [activeBlock.id, paramValues]);

    // Live engineering calculation for timing belt drives (ISO 13050 / DIN 7721)
    const pulleyLiveInspection = useMemo(() => {
        if (activeBlock.id !== 'dyn_timing_pulley') return null;
        const profileKey = String(paramValues.profileType || 'HTD_5M');
        const opt = PULLEY_PROFILE_OPTIONS[profileKey] || PULLEY_PROFILE_OPTIONS['HTD_5M'];
        const p = opt.pitch;
        const profileType = opt.type;

        const z1 = Math.max(12, Math.round(Number(paramValues.teeth) || 24));
        const z2 = Math.max(12, Math.round(Number(paramValues.teeth2) || 48));
        const isPair = (paramValues.driveMode || 'pair') === 'pair';
        const beltW = Math.max(6, Number(paramValues.beltWidth) || 15);
        const bore1 = Math.max(0, Number(paramValues.boreDiameter) || 15);
        const bore2 = Math.max(0, Number(paramValues.boreDiameter2) || 25);

        const pld = getStandardPld(p, profileType);
        const toothDepth = getStandardToothDepth(p, profileType);

        const dp1 = (z1 * p) / Math.PI;
        const dp2 = (z2 * p) / Math.PI;
        const da1 = dp1 - 2 * pld;
        const da2 = dp2 - 2 * pld;
        const dFlange1 = da1 + 2 * toothDepth;
        const dFlange2 = da2 + 2 * toothDepth;

        const ratio = z2 / z1;
        const minA = (da1 + da2) / 2 + Math.max(10, p);
        const a = Math.max(minA, Number(paramValues.centerDistance) || 250);

        // ISO 13050 belt pitch length
        const Lp_exact = 2 * a + (Math.PI / 2) * (dp1 + dp2) + Math.pow(dp2 - dp1, 2) / (4 * a);
        const zBelt = Math.round(Lp_exact / p);
        const beltLengthStd = zBelt * p;

        // Small pulley wrap angle & teeth in mesh
        const sinPhi = Math.min(0.99, Math.abs(dp2 - dp1) / (2 * a));
        const phiRad = Math.asin(sinPhi);
        const wrapAngleDeg = 180 - (2 * phiRad * 180) / Math.PI;
        const teethInMesh = (z1 * wrapAngleDeg) / 360;

        return {
            profileKey,
            profileLabel: opt.label,
            p,
            pld,
            toothDepth,
            z1,
            z2,
            isPair,
            beltW,
            dp1,
            dp2,
            da1,
            da2,
            dFlange1,
            dFlange2,
            bore1,
            bore2,
            ratio,
            minA,
            a,
            Lp_exact,
            zBelt,
            beltLengthStd,
            wrapAngleDeg,
            teethInMesh
        };
    }, [activeBlock.id, paramValues]);

    // Live engineering calculation for fasteners and holes (VDI 2230 / ISO 898 / ISO 273)
    const fastenerLiveInspection = useMemo(() => {
        if (activeBlock.id !== 'dyn_fastener') return null;
        const size = String(paramValues.size || 'M12');
        const spec = METRIC_FASTENER_SPECS[size] || METRIC_FASTENER_SPECS['M12'];
        const d = parseFloat(size.replace('M', '')) || 12;

        const pitchMode = String(paramValues.pitchMode || 'coarse');
        let pitch = spec.pitch;
        if (pitchMode === 'fine') {
            pitch = spec.finePitches[0] || spec.pitch;
        } else if (pitchMode === 'custom') {
            pitch = Math.max(0.2, Number(paramValues.customPitch) || spec.pitch);
        }

        const length = Math.max(10, Number(paramValues.length) || 60);
        const thMode = String(paramValues.threadLengthMode || 'standard');
        let bStd = length <= 125 ? 2 * d + 6 : length <= 200 ? 2 * d + 12 : 2 * d + 25;
        if (thMode === 'full') bStd = length;
        else if (thMode === 'custom') bStd = Math.min(length, Math.max(5, Number(paramValues.threadLength) || bStd));
        const threadLen = Math.min(length, bStd);

        // Minor diameter d1 & pitch diameter d2
        const d1 = d - 1.0825 * pitch;
        const d2 = d - 0.6495 * pitch;
        // Tensile stress area As per ISO 898-1: As = (pi / 4) * (d - 0.9382 * P)^2
        const As = (Math.PI / 4) * Math.pow(d - 0.9382 * pitch, 2);

        // Tap drill diameter
        const dTap = d - pitch;

        // Clearance hole diameter
        const fit = String(paramValues.clearanceFit || 'medium');
        const dh = fit === 'close' ? spec.dhClose : fit === 'free' ? spec.dhFree : spec.dhMed;

        // Property Class & Yield Strength
        const propClass = String(paramValues.propertyClass || '8.8');
        let Rp02 = 640;
        let Rm = 800;
        if (propClass === '10.9') { Rp02 = 940; Rm = 1000; }
        else if (propClass === '12.9') { Rp02 = 1080; Rm = 1200; }
        else if (propClass === 'A2_70') { Rp02 = 450; Rm = 700; }
        else if (propClass === 'A4_80') { Rp02 = 600; Rm = 800; }

        // VDI 2230 Preload & Tightening torque approximation (mu_total = 0.14)
        const FM_N = 0.9 * Rp02 * As;
        const FM_kN = FM_N / 1000;
        const dwBearing = (spec.sHex + dh) / 4;
        const MA_Nm = (FM_N * (0.161 * pitch + 0.58 * d2 * 0.14 + 0.14 * dwBearing)) / 1000;

        // Min thread engagement length
        const LeSteel = 0.8 * d;
        const LeAlu = 1.5 * d;

        const compMode = String(paramValues.componentMode || (paramValues.nutOption === 'nut_only' ? 'nut_only' : 'assembly'));

        return {
            size,
            d,
            pitch,
            pitchMode,
            length,
            threadLen,
            d1,
            d2,
            As,
            dTap,
            dh,
            fit,
            cbDia: spec.cbDia,
            cbDepth: spec.cbDepth,
            csDia: spec.csDia,
            propClass,
            Rp02,
            Rm,
            FM_kN,
            MA_Nm,
            LeSteel,
            LeAlu,
            compMode,
            mNut: spec.mNut,
            sHex: spec.sHex
        };
    }, [activeBlock.id, paramValues]);

    // Universal Live Engineering Inspection from BlockEngineeringMesh
    const meshLiveInspection = useMemo(() => {
        const legacyCardBlockIds = ['dyn_involute_gear', 'dyn_roller_sprocket', 'dyn_timing_pulley', 'dyn_fastener'];
        if (legacyCardBlockIds.includes(activeBlock.id)) return null;
        const mesh = getBlockMeshLink(activeBlock.id);
        if (!mesh) return null;
        return {
            mesh,
            metrics: mesh.computeLiveMetrics(paramValues),
        };
    }, [activeBlock.id, paramValues]);

    // When active block changes, reset parameters to its default values
    useEffect(() => {
        setParamValues({ ...activeBlock.defaultValues });
    }, [activeBlock]);

    // Categories
    const categories = [
        { id: 'All', labelEn: 'All Blocks', labelTr: 'Tüm Bloklar', count: DYNAMIC_BLOCKS.length },
        { id: 'Mechanical', labelEn: 'Mechanical & Power', labelTr: 'Makine & Güç Aktarımı', count: DYNAMIC_BLOCKS.filter(b => b.category === 'Mechanical').length },
        { id: 'Fasteners', labelEn: 'Fasteners', labelTr: 'Bağlantı Elemanları', count: DYNAMIC_BLOCKS.filter(b => b.category === 'Fasteners').length },
        { id: 'Architectural', labelEn: 'Architectural', labelTr: 'Mimari', count: DYNAMIC_BLOCKS.filter(b => b.category === 'Architectural').length },
        { id: 'Furniture', labelEn: 'Furniture', labelTr: 'Mobilya & İç Mekan', count: DYNAMIC_BLOCKS.filter(b => b.category === 'Furniture').length },
        { id: 'Structural', labelEn: 'Structural', labelTr: 'Yapısal Çelik & Çatı', count: DYNAMIC_BLOCKS.filter(b => b.category === 'Structural').length },
        { id: 'Piping', labelEn: 'Piping', labelTr: 'Tesisat & Flanş', count: DYNAMIC_BLOCKS.filter(b => b.category === 'Piping').length },
        { id: 'Sanitary', labelEn: 'Sanitary', labelTr: 'Islak Hacim & Vitrifiye', count: DYNAMIC_BLOCKS.filter(b => b.category === 'Sanitary').length },
        { id: 'Civil', labelEn: 'Site & Civil', labelTr: 'Vaziyet & Çevre', count: DYNAMIC_BLOCKS.filter(b => b.category === 'Civil').length },
    ];

    // Filtered blocks
    const filteredBlocks = useMemo(() => {
        return DYNAMIC_BLOCKS.filter(b => {
            if (selectedCategory !== 'All' && b.category !== selectedCategory) return false;
            if (!searchQuery.trim()) return true;
            const q = searchQuery.toLowerCase();
            return (
                b.name.toLowerCase().includes(q) ||
                b.nameTr.toLowerCase().includes(q) ||
                b.description.toLowerCase().includes(q) ||
                b.descriptionTr.toLowerCase().includes(q)
            );
        });
    }, [selectedCategory, searchQuery]);

    // Helper to update a parameter
    const handleParamChange = (key: string, value: any) => {
        setParamValues(prev => ({
            ...prev,
            [key]: value
        }));
    };

    // Apply lookup preset
    const handleApplyLookup = (paramId: string, optionId: string) => {
        const lookup = activeBlock.lookupParams?.find(l => l.id === paramId);
        if (!lookup) return;
        const opt = lookup.options.find(o => o.id === optionId);
        if (!opt) return;

        setParamValues(prev => ({
            ...prev,
            [paramId]: optionId,
            ...opt.values
        }));
    };

    // Render Preview on HTML5 Canvas
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const width = canvas.width;
        const height = canvas.height;

        // Clear canvas with dark background
        ctx.fillStyle = '#07090c';
        ctx.fillRect(0, 0, width, height);

        // Draw fine blueprint grid
        ctx.strokeStyle = '#121821';
        ctx.lineWidth = 1;
        const gridStep = 20;
        for (let x = 0; x < width; x += gridStep) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }
        for (let y = 0; y < height; y += gridStep) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }

        // Generate 2D CAD entities
        const entities = activeBlock.generate2D(paramValues, { x: 0, y: 0 });
        const grips = activeBlock.getGrips(paramValues, { x: 0, y: 0 });

        // Calculate bounding box of entities to auto-fit
        let minX = -100, maxX = 100, minY = -100, maxY = 100;
        let hasPoints = false;

        const expandBbox = (x: number, y: number) => {
            if (!hasPoints) {
                minX = maxX = x;
                minY = maxY = y;
                hasPoints = true;
            } else {
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
            }
        };

        for (const e of entities) {
            const g = e.geometry;
            if (g.type === 'LINE') {
                expandBbox(g.start.x, g.start.y);
                expandBbox(g.end.x, g.end.y);
            } else if (g.type === 'CIRCLE' || g.type === 'ARC') {
                expandBbox(g.center.x - g.radius, g.center.y - g.radius);
                expandBbox(g.center.x + g.radius, g.center.y + g.radius);
            } else if (g.type === 'RECTANGLE') {
                expandBbox(g.center.x - g.width / 2, g.center.y - g.height / 2);
                expandBbox(g.center.x + g.width / 2, g.center.y + g.height / 2);
            } else if (g.type === 'POLYLINE') {
                for (const v of g.vertices) expandBbox(v.x, v.y);
            } else if (g.type === 'HATCH') {
                const gHatch = g as any;
                if (gHatch.boundaryVertices) {
                    for (const v of gHatch.boundaryVertices) expandBbox(v.x, v.y);
                }
            }
        }

        for (const gr of grips) {
            expandBbox(gr.position.x, gr.position.y);
        }

        // Compute fit scale and center
        const bboxW = Math.max(10, maxX - minX);
        const bboxH = Math.max(10, maxY - minY);
        const padding = 60;
        const scaleX = (width - padding * 2) / bboxW;
        const scaleY = (height - padding * 2) / bboxH;
        const fitScale = Math.min(scaleX, scaleY);

        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;

        const toScreen = (p: { x: number; y: number }) => ({
            x: width / 2 + (p.x - centerX) * fitScale,
            y: height / 2 - (p.y - centerY) * fitScale // Invert Y for CAD coordinates
        });

        // ── 1. REALISTIC TEXTURE & MATERIAL UNDERLAY PASS (If realisticTextures enabled) ──
        if (realisticTextures) {
            const blockId = activeBlock.id;

            // Gamak Electric Motor / Industrial Induction Motor
            if (blockId === 'dyn_gamak_motor' || blockId === 'dyn_electric_motor') {
                for (const e of entities) {
                    const g = e.geometry;
                    if (e.layerId === 'layer-accent') {
                        // Turned polished steel shaft & keyway
                        if (g.type === 'RECTANGLE') {
                            const c = toScreen(g.center);
                            const rw = g.width * fitScale;
                            const rh = g.height * fitScale;
                            ctx.fillStyle = createCylindricalMetalGradient(ctx, c.x - rw / 2, c.y - rh / 2, c.x - rw / 2, c.y + rh / 2, '#cbd5e1', '#ffffff');
                            ctx.fillRect(c.x - rw / 2, c.y - rh / 2, rw, rh);
                        } else if (g.type === 'CIRCLE') {
                            const c = toScreen(g.center);
                            const r = g.radius * fitScale;
                            ctx.fillStyle = createCylindricalMetalGradient(ctx, c.x - r, c.y - r, c.x + r, c.y + r, '#cbd5e1', '#ffffff');
                            ctx.beginPath();
                            ctx.arc(c.x, c.y, Math.max(1, r), 0, Math.PI * 2);
                            ctx.fill();
                        }
                    } else if (e.layerId === 'layer-mech') {
                        // Stator carcass & fan cowl: Gamak RAL 5010 Blue sand-cast enamel
                        if (g.type === 'RECTANGLE') {
                            const c = toScreen(g.center);
                            const rw = g.width * fitScale;
                            const rh = g.height * fitScale;
                            ctx.fillStyle = getCastIronPattern(ctx, '#1d4ed8');
                            ctx.fillRect(c.x - rw / 2, c.y - rh / 2, rw, rh);
                        } else if (g.type === 'CIRCLE') {
                            const c = toScreen(g.center);
                            const r = g.radius * fitScale;
                            ctx.fillStyle = getCastIronPattern(ctx, '#1d4ed8');
                            ctx.beginPath();
                            ctx.arc(c.x, c.y, Math.max(1, r), 0, Math.PI * 2);
                            ctx.fill();
                        }
                    } else if (e.layerId === 'layer-furn') {
                        // Terminal box & mounting foot: Dark cast enamel & brass terminal gland
                        if (g.type === 'RECTANGLE') {
                            const c = toScreen(g.center);
                            const rw = g.width * fitScale;
                            const rh = g.height * fitScale;
                            ctx.fillStyle = getCastIronPattern(ctx, '#1e293b');
                            ctx.fillRect(c.x - rw / 2, c.y - rh / 2, rw, rh);
                        }
                    }
                }
            } else if (blockId === 'dyn_yilmaz_gearbox') {
                for (const e of entities) {
                    const g = e.geometry;
                    if (e.layerId === 'layer-casing') {
                        // Yılmaz nodular cast iron GGG-40 hammer-tone enamel (petrol blue / graphite)
                        if (g.type === 'RECTANGLE') {
                            const c = toScreen(g.center);
                            const rw = g.width * fitScale;
                            const rh = g.height * fitScale;
                            ctx.fillStyle = getCastIronPattern(ctx, '#0f766e');
                            ctx.fillRect(c.x - rw / 2, c.y - rh / 2, rw, rh);
                        }
                    } else if (e.layerId === 'layer-shaft') {
                        // Turned polished steel output shaft
                        if (g.type === 'RECTANGLE') {
                            const c = toScreen(g.center);
                            const rw = g.width * fitScale;
                            const rh = g.height * fitScale;
                            ctx.fillStyle = createCylindricalMetalGradient(ctx, c.x - rw / 2, c.y - rh / 2, c.x - rw / 2, c.y + rh / 2, '#cbd5e1', '#ffffff');
                            ctx.fillRect(c.x - rw / 2, c.y - rh / 2, rw, rh);
                        } else if (g.type === 'CIRCLE') {
                            const c = toScreen(g.center);
                            const r = g.radius * fitScale;
                            ctx.fillStyle = createCylindricalMetalGradient(ctx, c.x - r, c.y - r, c.x + r, c.y + r, '#cbd5e1', '#ffffff');
                            ctx.beginPath();
                            ctx.arc(c.x, c.y, Math.max(1, r), 0, Math.PI * 2);
                            ctx.fill();
                        }
                    } else if (e.layerId === 'layer-furn') {
                        // Brass oil sight glass / drain plugs
                        if (g.type === 'CIRCLE') {
                            const c = toScreen(g.center);
                            const r = g.radius * fitScale;
                            ctx.fillStyle = '#d97706';
                            ctx.beginPath();
                            ctx.arc(c.x, c.y, Math.max(1, r), 0, Math.PI * 2);
                            ctx.fill();
                        }
                    }
                }
            } else if (blockId === 'dyn_sheet_metal_plate') {
                // First pass: Fill outer plate rectangle with Galvanized Zinc Spangle pattern
                for (const e of entities) {
                    const g = e.geometry;
                    if (g.type === 'RECTANGLE' && e.layerId === 'layer-plate') {
                        const c = toScreen(g.center);
                        const rw = g.width * fitScale;
                        const rh = g.height * fitScale;
                        ctx.fillStyle = getGalvanizedZincPattern(ctx, '#94a3b8');
                        ctx.fillRect(c.x - rw / 2, c.y - rh / 2, rw, rh);
                    }
                }
                // Second pass: Cut out laser/plasma holes with dark canvas color (#07090c)
                for (const e of entities) {
                    const g = e.geometry;
                    if (g.type === 'CIRCLE' && (e.layerId === 'layer-holes' || e.layerId === 'layer-slots')) {
                        const c = toScreen(g.center);
                        const r = g.radius * fitScale;
                        ctx.fillStyle = '#07090c';
                        ctx.beginPath();
                        ctx.arc(c.x, c.y, Math.max(1, r), 0, Math.PI * 2);
                        ctx.fill();
                    } else if (g.type === 'RECTANGLE' && (e.layerId === 'layer-slots' || e.layerId === 'layer-holes')) {
                        const c = toScreen(g.center);
                        const rw = g.width * fitScale;
                        const rh = g.height * fitScale;
                        ctx.fillStyle = '#07090c';
                        ctx.fillRect(c.x - rw / 2, c.y - rh / 2, rw, rh);
                    }
                }
            } else if (blockId === 'dyn_aluminum_profile' || blockId === 'dyn_t_slot_profile' || blockId === 'dyn_angle_profile') {
                // Brushed aluminum finish on solid profiles
                for (const e of entities) {
                    const g = e.geometry;
                    if (g.type === 'POLYLINE' && g.closed && g.vertices.length > 2) {
                        ctx.fillStyle = getBrushedMetalPattern(ctx, '#94a3b8');
                        ctx.beginPath();
                        const p0 = toScreen(g.vertices[0]);
                        ctx.moveTo(p0.x, p0.y);
                        for (let i = 1; i < g.vertices.length; i++) {
                            const pi = toScreen(g.vertices[i]);
                            ctx.lineTo(pi.x, pi.y);
                        }
                        ctx.closePath();
                        ctx.fill();
                    } else if (g.type === 'RECTANGLE' && e.layerId !== 'layer-ref') {
                        const c = toScreen(g.center);
                        const rw = g.width * fitScale;
                        const rh = g.height * fitScale;
                        ctx.fillStyle = getBrushedMetalPattern(ctx, '#94a3b8');
                        ctx.fillRect(c.x - rw / 2, c.y - rh / 2, rw, rh);
                    }
                }
            } else if (blockId === 'dyn_steel_beam' || blockId === 'dyn_box_profile') {
                // Hot-rolled structural steel finish
                for (const e of entities) {
                    const g = e.geometry;
                    if (g.type === 'POLYLINE' && g.closed && g.vertices.length > 2) {
                        ctx.fillStyle = getBrushedMetalPattern(ctx, '#475569');
                        ctx.beginPath();
                        const p0 = toScreen(g.vertices[0]);
                        ctx.moveTo(p0.x, p0.y);
                        for (let i = 1; i < g.vertices.length; i++) {
                            const pi = toScreen(g.vertices[i]);
                            ctx.lineTo(pi.x, pi.y);
                        }
                        ctx.closePath();
                        ctx.fill();
                    } else if (g.type === 'RECTANGLE' && e.layerId !== 'layer-ref') {
                        const c = toScreen(g.center);
                        const rw = g.width * fitScale;
                        const rh = g.height * fitScale;
                        ctx.fillStyle = getBrushedMetalPattern(ctx, '#475569');
                        ctx.fillRect(c.x - rw / 2, c.y - rh / 2, rw, rh);
                    }
                }
            } else if (blockId === 'dyn_skf_bearing') {
                // Chrome polished bearing steel
                for (const e of entities) {
                    const g = e.geometry;
                    if (g.type === 'CIRCLE') {
                        const c = toScreen(g.center);
                        const r = g.radius * fitScale;
                        ctx.fillStyle = createCylindricalMetalGradient(ctx, c.x - r, c.y - r, c.x + r, c.y + r, '#cbd5e1', '#ffffff');
                        ctx.beginPath();
                        ctx.arc(c.x, c.y, Math.max(1, r), 0, Math.PI * 2);
                        ctx.fill();
                    }
                }
            } else if (blockId === 'dyn_fastener') {
                // Turned steel fastener
                for (const e of entities) {
                    const g = e.geometry;
                    if (g.type === 'RECTANGLE' && e.layerId !== 'layer-ref') {
                        const c = toScreen(g.center);
                        const rw = g.width * fitScale;
                        const rh = g.height * fitScale;
                        ctx.fillStyle = createCylindricalMetalGradient(ctx, c.x - rw / 2, c.y - rh / 2, c.x - rw / 2, c.y + rh / 2, '#94a3b8', '#f1f5f9');
                        ctx.fillRect(c.x - rw / 2, c.y - rh / 2, rw, rh);
                    }
                }
            } else if (blockId === 'dyn_hydraulic_cylinder' || blockId === 'dyn_ball_screw' || blockId === 'dyn_pipe_flange') {
                // Cylindrical hydraulic barrel, honed chrome rod, ball screw & flanged steel spool
                for (const e of entities) {
                    const g = e.geometry;
                    if (g.type === 'RECTANGLE' && e.layerId !== 'layer-ref') {
                        const c = toScreen(g.center);
                        const rw = g.width * fitScale;
                        const rh = g.height * fitScale;
                        const isRodOrHighlight = e.color === '#f8fafc' || e.color === '#cbd5e1';
                        const isAmberNut = e.color === '#f59e0b';
                        ctx.fillStyle = isRodOrHighlight
                            ? createCylindricalMetalGradient(ctx, c.x, c.y - rh / 2, c.x, c.y + rh / 2, '#cbd5e1', '#ffffff')
                            : isAmberNut
                                ? createCylindricalMetalGradient(ctx, c.x, c.y - rh / 2, c.x, c.y + rh / 2, '#b45309', '#fbbf24')
                                : createCylindricalMetalGradient(ctx, c.x, c.y - rh / 2, c.x, c.y + rh / 2, '#1e3a5f', '#38bdf8');
                        ctx.fillRect(c.x - rw / 2, c.y - rh / 2, rw, rh);
                    } else if (g.type === 'CIRCLE' && e.layerId !== 'layer-ref') {
                        const c = toScreen(g.center);
                        const r = g.radius * fitScale;
                        ctx.fillStyle = createCylindricalMetalGradient(ctx, c.x - r, c.y - r, c.x + r, c.y + r, '#475569', '#e2e8f0');
                        ctx.beginPath();
                        ctx.arc(c.x, c.y, Math.max(1, r), 0, Math.PI * 2);
                        ctx.fill();
                    }
                }
            } else if (blockId === 'dyn_linear_guide') {
                // Ground steel rail + green/red HIWIN carriage block
                for (const e of entities) {
                    const g = e.geometry;
                    if (g.type === 'RECTANGLE' && e.layerId !== 'layer-ref') {
                        const c = toScreen(g.center);
                        const rw = g.width * fitScale;
                        const rh = g.height * fitScale;
                        if (e.color === '#ef4444') {
                            ctx.fillStyle = 'rgba(220, 38, 38, 0.75)';
                        } else if (e.color === '#22c55e') {
                            ctx.fillStyle = getCastIronPattern(ctx, '#15803d');
                        } else {
                            ctx.fillStyle = getBrushedMetalPattern(ctx, '#94a3b8');
                        }
                        ctx.fillRect(c.x - rw / 2, c.y - rh / 2, rw, rh);
                    }
                }
            } else if (blockId === 'dyn_pillow_block') {
                // Cast iron blue-slate housing + chrome bearing insert
                for (const e of entities) {
                    const g = e.geometry;
                    if (g.type === 'RECTANGLE' && e.layerId !== 'layer-ref') {
                        const c = toScreen(g.center);
                        const rw = g.width * fitScale;
                        const rh = g.height * fitScale;
                        ctx.fillStyle = e.layerId === 'layer-accent'
                            ? getBrushedMetalPattern(ctx, '#cbd5e1')
                            : getCastIronPattern(ctx, '#1e3a5f');
                        ctx.fillRect(c.x - rw / 2, c.y - rh / 2, rw, rh);
                    } else if (g.type === 'CIRCLE' && e.layerId !== 'layer-ref') {
                        const c = toScreen(g.center);
                        const r = g.radius * fitScale;
                        ctx.fillStyle = e.color === '#38bdf8'
                            ? getCastIronPattern(ctx, '#1e3a5f')
                            : createCylindricalMetalGradient(ctx, c.x - r, c.y - r, c.x + r, c.y + r, '#94a3b8', '#f8fafc');
                        ctx.beginPath();
                        ctx.arc(c.x, c.y, Math.max(1, r), 0, Math.PI * 2);
                        ctx.fill();
                    }
                }
            } else if (blockId === 'dyn_shaft_coupling' || blockId === 'dyn_involute_gear' || blockId === 'dyn_v_belt_pulley' || blockId === 'dyn_timing_pulley' || blockId === 'dyn_roller_sprocket') {
                // Turned steel hubs/gears/pulleys + polyurethane spider highlight
                for (const e of entities) {
                    const g = e.geometry;
                    if (g.type === 'RECTANGLE' && e.layerId !== 'layer-ref') {
                        const c = toScreen(g.center);
                        const rw = g.width * fitScale;
                        const rh = g.height * fitScale;
                        ctx.fillStyle = e.color === '#ec4899'
                            ? 'rgba(219, 39, 119, 0.72)'
                            : createCylindricalMetalGradient(ctx, c.x, c.y - rh / 2, c.x, c.y + rh / 2, '#475569', '#cbd5e1');
                        ctx.fillRect(c.x - rw / 2, c.y - rh / 2, rw, rh);
                    } else if (g.type === 'CIRCLE' && e.layerId !== 'layer-ref') {
                        const c = toScreen(g.center);
                        const r = g.radius * fitScale;
                        ctx.fillStyle = e.color === '#ec4899'
                            ? 'rgba(219, 39, 119, 0.75)'
                            : createCylindricalMetalGradient(ctx, c.x - r, c.y - r, c.x + r, c.y + r, '#334155', '#cbd5e1');
                        ctx.beginPath();
                        ctx.arc(c.x, c.y, Math.max(1, r), 0, Math.PI * 2);
                        ctx.fill();
                    }
                }
            } else if (
                blockId === 'dyn_conveyor_roller' ||
                blockId === 'dyn_pneumatic_gripper' ||
                blockId === 'dyn_industrial_valve' ||
                blockId === 'dyn_cable_drag_chain' ||
                blockId === 'dyn_helical_spring' ||
                blockId === 'dyn_heavy_caster_wheel'
            ) {
                for (const e of entities) {
                    const g = e.geometry;
                    if (g.type === 'RECTANGLE' && e.layerId !== 'layer-ref') {
                        const c = toScreen(g.center);
                        const rw = g.width * fitScale;
                        const rh = g.height * fitScale;
                        if (blockId === 'dyn_cable_drag_chain') {
                            ctx.fillStyle = e.layerId === 'layer-accent' ? 'rgba(245, 158, 11, 0.55)' : 'rgba(30, 41, 59, 0.85)';
                        } else if (blockId === 'dyn_pneumatic_gripper') {
                            ctx.fillStyle = e.layerId === 'layer-accent'
                                ? getBrushedMetalPattern(ctx, '#cbd5e1')
                                : getCastIronPattern(ctx, '#1e293b');
                        } else if (blockId === 'dyn_industrial_valve') {
                            ctx.fillStyle = e.color === '#22c55e'
                                ? 'rgba(34, 197, 94, 0.75)'
                                : getCastIronPattern(ctx, '#0f3f66');
                        } else {
                            ctx.fillStyle = createCylindricalMetalGradient(ctx, c.x, c.y - rh / 2, c.x, c.y + rh / 2, '#334155', '#cbd5e1');
                        }
                        ctx.fillRect(c.x - rw / 2, c.y - rh / 2, rw, rh);
                    } else if (g.type === 'CIRCLE' && e.layerId !== 'layer-ref') {
                        const c = toScreen(g.center);
                        const r = g.radius * fitScale;
                        if (blockId === 'dyn_heavy_caster_wheel' && e.layerId === 'layer-accent') {
                            ctx.fillStyle = 'rgba(234, 88, 12, 0.68)';
                        } else if (blockId === 'dyn_industrial_valve' && e.layerId === 'layer-accent') {
                            ctx.fillStyle = createCylindricalMetalGradient(ctx, c.x - r, c.y - r, c.x + r, c.y + r, '#94a3b8', '#ffffff');
                        } else {
                            ctx.fillStyle = createCylindricalMetalGradient(ctx, c.x - r, c.y - r, c.x + r, c.y + r, '#334155', '#e2e8f0');
                        }
                        ctx.beginPath();
                        ctx.arc(c.x, c.y, Math.max(1, r), 0, Math.PI * 2);
                        ctx.fill();
                    }
                }
            }
        }

        // ── 2. CAD OUTLINE & SECTION HATCH DRAWING PASS ──
        for (const e of entities) {
            const g = e.geometry;
            ctx.strokeStyle = e.color || '#3ad0e6';
            ctx.fillStyle = e.color || '#3ad0e6';
            ctx.lineWidth = 1.5;

            // Centerline styling (ISO 128 long-dash short-dash in red)
            if (e.layerId === 'layer-ref') {
                ctx.setLineDash([8, 4]);
            } else {
                ctx.setLineDash([]);
            }

            if (g.type === 'LINE') {
                const p1 = toScreen(g.start);
                const p2 = toScreen(g.end);
                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.stroke();
            } else if (g.type === 'CIRCLE') {
                const c = toScreen(g.center);
                const r = g.radius * fitScale;
                ctx.beginPath();
                ctx.arc(c.x, c.y, Math.max(1, r), 0, Math.PI * 2);
                ctx.stroke();
            } else if (g.type === 'ARC') {
                const c = toScreen(g.center);
                const r = g.radius * fitScale;
                ctx.beginPath();
                // Invert angles for inverted Y
                ctx.arc(c.x, c.y, Math.max(1, r), -g.endAngle, -g.startAngle);
                ctx.stroke();
            } else if (g.type === 'RECTANGLE') {
                const c = toScreen(g.center);
                const rw = g.width * fitScale;
                const rh = g.height * fitScale;
                ctx.strokeRect(c.x - rw / 2, c.y - rh / 2, rw, rh);
            } else if (g.type === 'POLYLINE') {
                if (g.vertices.length > 0) {
                    ctx.beginPath();
                    const p0 = toScreen(g.vertices[0]);
                    ctx.moveTo(p0.x, p0.y);
                    for (let i = 1; i < g.vertices.length; i++) {
                        const pi = toScreen(g.vertices[i]);
                        ctx.lineTo(pi.x, pi.y);
                    }
                    if (g.closed) ctx.closePath();
                    ctx.stroke();
                }
            } else if (g.type === 'HEXAGON') {
                const c = toScreen(g.center);
                const r = g.radius * fitScale;
                ctx.beginPath();
                for (let i = 0; i < 6; i++) {
                    const ang = (i * Math.PI) / 3;
                    const hx = c.x + r * Math.cos(ang);
                    const hy = c.y + r * Math.sin(ang);
                    if (i === 0) ctx.moveTo(hx, hy);
                    else ctx.lineTo(hx, hy);
                }
                ctx.closePath();
                ctx.stroke();
            } else if (g.type === 'HATCH') {
                const gHatch = g as any;
                if (gHatch.boundaryVertices && gHatch.boundaryVertices.length >= 3) {
                    const bPts = gHatch.boundaryVertices.map(toScreen);
                    const scale = (gHatch.scale || 6) * fitScale;
                    drawPolygonHatch(
                        ctx,
                        bPts,
                        gHatch.pattern || 'ANSI31',
                        scale,
                        gHatch.angle || 45,
                        e.color || '#38bdf8',
                        false
                    );
                }
            }
        }
        ctx.setLineDash([]);

        // Render AutoCAD Dynamic Grips
        for (const grip of grips) {
            const p = toScreen(grip.position);

            if (grip.type === 'stretch') {
                // Cyan triangle arrow
                ctx.fillStyle = '#00e5ff';
                ctx.strokeStyle = '#07090c';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                const arrowSize = 9;
                const dirX = grip.direction?.x || 1;
                const dirY = -(grip.direction?.y || 0); // Invert Y
                const len = Math.hypot(dirX, dirY) || 1;
                const nx = dirX / len;
                const ny = dirY / len;
                const px = -ny;
                const py = nx;

                const tipX = p.x + nx * arrowSize * 1.5;
                const tipY = p.y + ny * arrowSize * 1.5;
                const b1X = p.x - nx * arrowSize * 0.5 + px * arrowSize;
                const b1Y = p.y - ny * arrowSize * 0.5 + py * arrowSize;
                const b2X = p.x - nx * arrowSize * 0.5 - px * arrowSize;
                const b2Y = p.y - ny * arrowSize * 0.5 - py * arrowSize;

                ctx.moveTo(tipX, tipY);
                ctx.lineTo(b1X, b1Y);
                ctx.lineTo(b2X, b2Y);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
            } else if (grip.type === 'flip') {
                // Amber dual-arrow flip grip
                ctx.fillStyle = '#f59e0b';
                ctx.strokeStyle = '#07090c';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.arc(p.x, p.y, 7, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
                // Inner swap arrows
                ctx.fillStyle = '#07090c';
                ctx.font = '10px sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('⇄', p.x, p.y);
            } else if (grip.type === 'visibility') {
                // Magenta cycle/eye grip
                ctx.fillStyle = '#c084fc';
                ctx.strokeStyle = '#07090c';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
            }
        }
    }, [activeBlock, paramValues, realisticTextures]);

    // Handle 2D CAD Insertion
    const handleInsert2D = () => {
        if (onStampToSketch) {
            onStampToSketch(activeBlock, paramValues);
            onClose?.();
            return;
        }
        try {
            const stdBlockDef = DynamicBlockEngine.toStandardBlockDefinition(activeBlock, paramValues);
            const tool = new InsertTool(stdBlockDef);
            tool.setScale(insertScale);
            tool.setRotation((insertRotationDeg * Math.PI) / 180);
            commandProcessor.setActiveTool(tool);
            tool.setBlock(stdBlockDef);
        } catch (e) {
            console.warn('[handleInsert2D CAD tool not mounted]:', e);
        }
        onInserted2D?.();
        onClose?.();
    };

    // Handle 3D DesignStudio Insertion / Update
    const handleInsert3D = () => {
        if (onSaveInstance) {
            onSaveInstance(paramValues);
            onClose?.();
            return;
        }
        const parts3D = DynamicBlockEngine.generate3D(activeBlock, paramValues, { x: 0, y: 0, z: 0 });
        const annotatedParts = parts3D.map((p) => ({
            ...p,
            dynamicBlockId: activeBlock.id,
            dynamicParams: { ...paramValues },
            dimensions: {
                ...(p.dimensions || {}),
                dynamicBlockId: activeBlock.id,
                dynamicParams: { ...paramValues },
            },
        }));
        const store = useDesignStore.getState();
        const blockLabel = isTr ? activeBlock.nameTr : activeBlock.name;
        store.addDynamicBlock3D(annotatedParts, `${blockLabel} (Dinamik)`);
        const updated = useDesignStore.getState();
        commitDesignParts(updated.parts, updated.selectedId, updated.subAssemblies);
        if (onInserted3D) {
            onInserted3D();
        } else if (typeof window !== 'undefined' && !window.location.pathname.includes('/design-studio')) {
            window.location.href = '/design-studio/';
        }
        onClose?.();
    };

    return (
        <div className="flex flex-col h-full bg-[var(--bg-0)] text-[var(--ink)] font-sans select-none overflow-hidden">
            {/* Top Bar / Category Tabs */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-[var(--bg-1)] border-b border-[var(--line)]">
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                    {categories.map((cat) => {
                        const isSelected = selectedCategory === cat.id;
                        return (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.id)}
                                className={`px-3 py-1 rounded text-xs font-mono transition-all flex items-center gap-1.5 whitespace-nowrap border ${
                                    isSelected
                                        ? 'bg-[var(--cyan)]/10 text-[var(--cyan)] border-[var(--cyan)]/40 shadow-sm'
                                        : 'bg-[var(--bg-2)] text-[var(--alu-dim)] border-[var(--line)] hover:text-[var(--ink)] hover:border-[var(--line-strong)]'
                                }`}
                            >
                                <span>{t12(language, cat.labelEn, cat.labelTr)}</span>
                                <span className={`text-[10px] px-1 rounded ${isSelected ? 'bg-[var(--cyan)]/20 text-[var(--cyan)]' : 'bg-[var(--bg-3)] text-[var(--muted)]'}`}>
                                    {cat.count}
                                </span>
                            </button>
                        );
                    })}
                </div>

                <div className="flex items-center gap-2 shrink-0 ml-3">
                    {/* Search */}
                    <div className="relative w-52">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--muted)]" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={t12(language, 'Search dynamic blocks...', 'Dinamik blok ara...')}
                            className="w-full pl-8 pr-2 py-1 text-xs bg-[var(--bg-2)] border border-[var(--line)] rounded text-[var(--ink)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--cyan)] font-mono"
                        />
                    </div>

                    {/* 12-Language Selector */}
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => setShowLangMenu((v) => !v)}
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[var(--bg-2)] border border-[var(--line)] hover:border-[var(--cyan)]/50 text-[var(--ink)] text-xs font-mono transition-all cursor-pointer shadow-sm"
                            title={t12(language, 'Select Language (12 Industrial Locales)', 'Dil Seçimi (12 Endüstriyel Dil)')}
                        >
                            <FlagIcon lang={language} className="w-3.5 h-2.5 rounded-xs shrink-0" />
                            <span className="uppercase font-bold tracking-wider text-[11px]">{language}</span>
                            <span className="text-[10px] text-[var(--muted)]">{showLangMenu ? '▲' : '▼'}</span>
                        </button>

                        {showLangMenu && (
                            <div className="absolute right-0 top-full mt-1.5 z-50 w-52 rounded-xl border border-[var(--cyan)]/30 bg-[var(--bg-1)]/98 p-1.5 shadow-2xl text-[11px] font-mono space-y-0.5 animate-in fade-in slide-in-from-top-1 max-h-72 overflow-y-auto">
                                <div className="px-2 py-1 text-[9px] uppercase font-bold text-[var(--cyan)] tracking-wider border-b border-[var(--line)] flex items-center justify-between">
                                    <span>{t12(language, 'Language', 'Dil')}</span>
                                    <span className="text-[8px] text-[var(--muted)] font-normal">12 Locales</span>
                                </div>
                                {CAD_LANGUAGES.map((lang) => {
                                    const isCurrent = language === lang.id;
                                    return (
                                        <button
                                            key={lang.id}
                                            type="button"
                                            onClick={() => {
                                                setLanguage(lang.id);
                                                setShowLangMenu(false);
                                            }}
                                            className={`w-full text-left px-2 py-1.5 rounded-lg flex items-center justify-between transition-colors ${
                                                isCurrent
                                                    ? 'bg-[var(--cyan)]/20 text-[var(--cyan)] font-bold border border-[var(--cyan)]/30'
                                                    : 'text-[var(--alu-dim)] hover:bg-white/5 hover:text-[var(--ink)]'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <FlagIcon lang={lang.id} className="w-4 h-3 rounded-xs shrink-0" />
                                                <span className="text-[11px]">{lang.native}</span>
                                            </div>
                                            <span className="text-[9px] uppercase text-[var(--muted)]">{lang.id}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Content: Split into Left Block Selector, Center Visual Canvas, and Right Parametric Inspector */}
            <div className="flex-1 grid grid-cols-12 min-h-0 divide-x divide-[var(--line)]">
                {/* 1. LEFT COLUMN: Block Selection List (3 cols) */}
                <div className="col-span-3 flex flex-col min-h-0 bg-[var(--bg-1)]">
                    <div className="p-2 border-b border-[var(--line)] bg-[var(--bg-1)]">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--alu-dim)]">
                            {isTr ? 'Dinamik Blok Kütüphanesi' : 'Dynamic Block Library'} ({filteredBlocks.length})
                        </span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1.5 custom-scrollbar">
                        {filteredBlocks.map((block) => {
                            const isSelected = block.id === selectedBlockId;
                            return (
                                <div
                                    key={block.id}
                                    onClick={() => setSelectedBlockId(block.id)}
                                    className={`p-2.5 rounded border cursor-pointer transition-all ${
                                        isSelected
                                            ? 'bg-[var(--cyan)]/10 border-[var(--cyan)] text-[var(--ink)] shadow-md shadow-[#00e5ff]/5'
                                            : 'bg-[var(--bg-2)] border-[var(--line)] text-[var(--alu-dim)] hover:border-[var(--line-strong)] hover:bg-[var(--bg-2)]'
                                    }`}
                                >
                                    <div className="flex items-start gap-2">
                                        <div className="shrink-0 p-1 bg-[var(--bg-3)]/50 rounded flex items-center justify-center">
                                            <DynamicBlockAnimatedIcon blockId={block.id} isSelected={isSelected} size={26} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-1">
                                                <h4 className={`text-xs font-semibold truncate ${isSelected ? 'text-[var(--cyan)]' : 'text-[var(--ink)]'}`}>
                                                    {isTr ? block.nameTr : block.name}
                                                </h4>
                                                <span className="text-[9px] font-mono bg-[var(--cyan)]/20 text-[var(--cyan)] px-1 py-0.5 rounded shrink-0">
                                                    ⚡ DYN
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-[var(--alu-dim)] line-clamp-1 mt-0.5">
                                                {isTr ? block.subcategoryTr : block.subcategory}
                                            </p>
                                            <div className="mt-1.5 flex items-center gap-1.5 text-[9px] font-mono text-[var(--muted)]">
                                                <span className="bg-[var(--bg-3)] px-1 rounded text-[var(--alu)]">{block.citation.standard.split('/')[0]}</span>
                                                <span>•</span>
                                                <span>{block.linearParams.length} Boyut</span>
                                                {block.arrayActions && <span>• Dizi</span>}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* 2. CENTER COLUMN: Interactive 2D Dynamic Canvas Preview (5 cols) */}
                <div className="col-span-5 flex flex-col min-h-0 bg-[var(--bg-0)] relative">
                    {/* Header info */}
                    <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--line)] bg-[var(--bg-1)]">
                        <div className="flex items-center gap-2 min-w-0">
                            <div className="shrink-0 p-1 bg-[var(--bg-3)]/50 rounded flex items-center justify-center">
                                <DynamicBlockAnimatedIcon blockId={activeBlock.id} isSelected={true} size={22} />
                            </div>
                            <div className="min-w-0">
                                <h3 className="text-xs font-semibold text-[var(--ink)] truncate">
                                    {isTr ? activeBlock.nameTr : activeBlock.name}
                                </h3>
                                <span className="text-[10px] font-mono text-[var(--cyan)] truncate block">
                                    {activeBlock.citation.standard}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                            {/* Realistic Procedural Textures & Shading Toggle */}
                            <button
                                type="button"
                                onClick={() => setRealisticTextures(!realisticTextures)}
                                title={realisticTextures ? t12(language, 'Switch to Wireframe Mode', 'Tel Çerçeve Moduna Geç') : t12(language, 'Switch to Realistic Material Textures', 'Gerçekçi Malzeme Dokularına Geç')}
                                className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono font-bold transition-all shadow-sm hover:scale-[1.02] active:scale-[0.98] cursor-pointer border ${
                                    realisticTextures
                                        ? 'bg-[var(--cyan)]/20 text-[var(--cyan)] border-[var(--cyan)]/50'
                                        : 'bg-[var(--bg-3)] text-[var(--alu-dim)] border-[var(--line-strong)]'
                                }`}
                            >
                                <span>🎨</span>
                                <span className="hidden sm:inline">{realisticTextures ? t12(language, 'Textured', 'Gerçekçi Doku') : t12(language, 'Wireframe', 'Tel Çerçeve')}</span>
                            </button>

                            {/* 2D DXF Download */}
                            <button
                                type="button"
                                onClick={() => downloadDynamicBlockCad('dxf', activeBlock, paramValues)}
                                title={t12(language, 'Download 2D DXF', '2D AutoCAD DXF olarak indir')}
                                className="flex items-center gap-1 px-2 py-1 bg-[var(--cyan)]/15 hover:bg-[var(--cyan)]/25 text-[var(--cyan)] border border-[var(--cyan)]/40 rounded text-[10px] font-mono font-bold transition-all shadow-sm hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                            >
                                <FileCode className="w-3 h-3" />
                                <span>DXF</span>
                            </button>
                            {/* 3D Parasolid X_T Download */}
                            <button
                                type="button"
                                onClick={() => downloadDynamicBlockCad('xt', activeBlock, paramValues)}
                                title={t12(language, 'Download 3D Parasolid (.x_t)', '3D Siemens Parasolid (.x_t) olarak indir (SolidWorks/NX)')}
                                className="flex items-center gap-1 px-2 py-1 bg-[var(--warn)]/15 hover:bg-[var(--warn)]/25 text-[var(--warn)] border border-[var(--warn)]/40 rounded text-[10px] font-mono font-bold transition-all shadow-sm hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                            >
                                <Download className="w-3 h-3" />
                                <span>X_T</span>
                            </button>
                            {/* 3D STEP Download */}
                            <button
                                type="button"
                                onClick={() => downloadDynamicBlockCad('step', activeBlock, paramValues)}
                                title={t12(language, 'Download 3D STEP Solid', '3D ISO 10303-21 STEP Solid olarak indir')}
                                className="flex items-center gap-1 px-2 py-1 bg-[var(--cyan)]/15 hover:bg-[var(--cyan)]/25 text-[var(--cyan)] border border-[var(--cyan)]/40 rounded text-[10px] font-mono font-bold transition-all shadow-sm hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                            >
                                <Box className="w-3 h-3" />
                                <span>STEP</span>
                            </button>
                            <span className="text-[10px] font-mono text-[var(--ok)] bg-[var(--ok)]/10 border border-[var(--ok)]/30 px-1.5 py-0.5 rounded flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-[var(--ok)] animate-pulse" />
                                <span className="hidden sm:inline">{t12(language, 'Live', 'Canlı')}</span>
                            </span>
                        </div>
                    </div>

                    {/* Canvas area */}
                    <div className="flex-1 relative overflow-hidden flex items-center justify-center p-2">
                        <canvas
                            ref={canvasRef}
                            width={500}
                            height={400}
                            className="w-full h-full object-contain border border-[var(--line)] rounded bg-[var(--bg-0)]"
                        />

                        {/* On-canvas Grips Legend Overlay */}
                        <div className="absolute bottom-4 left-4 bg-[var(--bg-1)]/90 border border-[var(--line)] rounded p-2 text-[10px] font-mono space-y-1 shadow-lg pointer-events-none">
                            <div className="text-[9px] uppercase tracking-wider text-[var(--muted)] font-bold">
                                {t12(language, 'Dynamic Grips', 'AutoCAD Dinamik Tutamaklar')}
                            </div>
                            <div className="flex items-center gap-1.5 text-[var(--cyan)]">
                                <span>▲</span>
                                <span>{t12(language, 'Linear Stretch', 'Doğrusal Esnetme (Stretch)')}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[var(--warn)]">
                                <span>⇄</span>
                                <span>{t12(language, 'Axis Flip', 'Aynalama / Çevirme (Flip)')}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[#c084fc]">
                                <span>●</span>
                                <span>{t12(language, 'Visibility State', 'Görünüş / Durum Seçici (Visibility)')}</span>
                            </div>
                        </div>
                    </div>

                    {/* Citation & Methodology Banner */}
                    <div className="px-3 py-2 bg-[var(--bg-1)] border-t border-[var(--line)] text-[10px] text-[var(--alu-dim)] flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-[var(--ok)] shrink-0" />
                        <div className="truncate">
                            <span className="font-mono text-[var(--ink)] font-semibold">{activeBlock.citation.standard}: </span>
                            <span>{activeBlock.citation.description}</span>
                        </div>
                    </div>
                </div>

                {/* 3. RIGHT COLUMN: Interactive Parametric Controllers & Insertion Actions (4 cols) */}
                <div className="col-span-4 flex flex-col min-h-0 bg-[var(--bg-1)] divide-y divide-[var(--line)]">
                    {/* Header */}
                    <div className="p-3 bg-[var(--bg-1)]">
                        <div className="flex items-center justify-between gap-2">
                            <h4 className="text-xs font-semibold text-[var(--ink)] flex items-center gap-1.5 truncate">
                                <Sliders className="w-3.5 h-3.5 text-[var(--cyan)] shrink-0" />
                                <span>{isTr ? 'Dinamik Parametreler & Standartlar' : 'Dynamic Parameters'}</span>
                            </h4>
                            <div className="flex items-center gap-1.5 shrink-0">
                                {BLOCK_ENGINEERING_MESH[activeBlock.id] && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const res = CrossModuleBridge.exportBlockToFlow(activeBlock.id, paramValues, { switchWindow: true });
                                            if (res?.message) alert(res.message);
                                        }}
                                        title={isTr ? 'Bu bloku hesaplama parametreleriyle Flow Engine grafiğine ekle' : 'Add block to Flow Engine graph'}
                                        className="flex items-center gap-1 px-2 py-1 bg-[#8b5cf6]/15 hover:bg-[#8b5cf6]/25 text-[#a78bfa] border border-[#8b5cf6]/40 rounded text-[10px] font-mono font-bold transition-all shadow-sm hover:scale-[1.02] active:scale-[0.98]"
                                    >
                                        <Workflow className="w-3 h-3" />
                                        <span>Flow</span>
                                    </button>
                                )}
                                {(BLOCK_ENGINEERING_MESH[activeBlock.id] || BLOCK_CALCULATOR_SHORTCUTS[activeBlock.id]) && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const url = buildCalculatorUrlWithParams(activeBlock.id, paramValues) || BLOCK_CALCULATOR_SHORTCUTS[activeBlock.id]?.route;
                                            window.open(url, '_blank');
                                        }}
                                        title={isTr ? 'Bu bloku hesaplama parametreleriyle tam ekran hesaplayıcıda aç' : 'Open in dedicated solver'}
                                        className="flex items-center gap-1 px-2 py-1 bg-[var(--cyan)]/15 hover:bg-[var(--cyan)]/25 text-[var(--cyan)] border border-[var(--cyan)]/40 rounded text-[10px] font-mono font-bold transition-all shadow-sm hover:scale-[1.02] active:scale-[0.98]"
                                    >
                                        <ExternalLink className="w-3 h-3" />
                                        <span>{isTr ? 'Hesapla' : 'Solver'}</span>
                                    </button>
                                )}
                            </div>
                        </div>
                        <p className="text-[10px] text-[var(--alu-dim)] mt-0.5 truncate">
                            {isTr ? activeBlock.descriptionTr : activeBlock.description}
                        </p>
                    </div>

                    {/* Parameter Controls Scroll Area */}
                    <div className="flex-1 overflow-y-auto p-3 space-y-4 custom-scrollbar">
                        {/* A. Standard Lookup Presets */}
                        {activeBlock.lookupParams && activeBlock.lookupParams.length > 0 && (
                            <div className="space-y-2">
                                {activeBlock.lookupParams
                                    .filter(lookup => {
                                        if (activeBlock.id === 'dyn_fastener') {
                                            if (lookup.id === 'nutOption') return false;
                                            const mode = String(paramValues.componentMode || 'assembly');
                                            if (mode === 'nut_only') {
                                                return ['size', 'componentMode', 'nutType', 'pitchMode'].includes(lookup.id);
                                            }
                                            if (mode === 'washer_only') {
                                                return ['size', 'componentMode', 'washerType', 'clearanceFit'].includes(lookup.id);
                                            }
                                            if (mode === 'hole_clearance') {
                                                return ['size', 'componentMode', 'holeType', 'clearanceFit'].includes(lookup.id);
                                            }
                                            if (mode === 'hole_tapped') {
                                                return ['size', 'componentMode', 'holeType', 'pitchMode'].includes(lookup.id);
                                            }
                                            if (mode === 'bolt_only') {
                                                return ['size', 'componentMode', 'headType', 'pitchMode', 'threadLengthMode', 'propertyClass'].includes(lookup.id);
                                            }
                                        }
                                        return true;
                                    })
                                    .map((lookup) => {
                                        // Custom tab buttons for gear, drive, or fastener component mode
                                        if (lookup.id === 'gearMode' || lookup.id === 'driveMode' || lookup.id === 'componentMode') {
                                            const currentVal = paramValues[lookup.id] || lookup.default;
                                            const isFastenerMode = lookup.id === 'componentMode';
                                            return (
                                                <div key={lookup.id} className="space-y-1.5">
                                                    <label className="text-[10px] font-mono uppercase tracking-wider text-[var(--alu-dim)] flex items-center gap-1">
                                                        <span>{isFastenerMode ? '🔩' : '⚙️'}</span>
                                                        <span>{isTr ? lookup.labelTr : lookup.label}</span>
                                                    </label>
                                                    <div className={`grid ${isFastenerMode ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-2'} gap-1.5`}>
                                                        {lookup.options.map((opt) => {
                                                            const isAct = currentVal === opt.id;
                                                            return (
                                                                <button
                                                                    key={opt.id}
                                                                    type="button"
                                                                    onClick={() => handleApplyLookup(lookup.id, opt.id)}
                                                                    className={`px-2 py-1.5 rounded text-[10px] font-mono text-center transition-all border flex items-center justify-center gap-1.5 truncate ${
                                                                        isAct
                                                                            ? 'bg-[var(--cyan)]/20 text-[var(--cyan)] border-[var(--cyan)] font-bold shadow-sm'
                                                                            : 'bg-[var(--bg-2)] text-[var(--alu-dim)] border-[var(--line)] hover:text-[var(--ink)] hover:border-[var(--line-strong)]'
                                                                    }`}
                                                                >
                                                                    <span className="truncate">{opt.label.split('(')[0].trim()}</span>
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        }

                                        return (
                                            <div key={lookup.id} className="space-y-1">
                                                <label className="text-[10px] font-mono uppercase tracking-wider text-[var(--alu-dim)]">
                                                    {isTr ? lookup.labelTr : lookup.label}
                                                </label>
                                                <select
                                                    value={paramValues[lookup.id] || lookup.default}
                                                    onChange={(e) => handleApplyLookup(lookup.id, e.target.value)}
                                                    className="w-full bg-[var(--bg-2)] border border-[var(--line)] rounded px-2.5 py-1.5 text-xs text-[var(--cyan)] font-mono focus:outline-none focus:border-[var(--cyan)]"
                                                >
                                                    {lookup.options.map((opt) => (
                                                        <option key={opt.id} value={opt.id}>
                                                            {opt.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        );
                                    })}
                            </div>
                        )}

                        {/* B. Visibility State Selector */}
                        {activeBlock.visibilityParam && (
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-mono uppercase tracking-wider text-[var(--alu-dim)] flex items-center gap-1">
                                    <Eye className="w-3 h-3 text-[#c084fc]" />
                                    {isTr ? activeBlock.visibilityParam.labelTr : activeBlock.visibilityParam.label}
                                </label>
                                <div className="grid grid-cols-1 gap-1">
                                    {activeBlock.visibilityParam.states.map((st) => {
                                        const isAct = (paramValues[activeBlock.visibilityParam!.id] || activeBlock.visibilityParam!.default) === st.id;
                                        return (
                                            <button
                                                key={st.id}
                                                onClick={() => handleParamChange(activeBlock.visibilityParam!.id, st.id)}
                                                className={`px-2.5 py-1.5 rounded text-[11px] font-mono text-left transition-all border flex items-center justify-between ${
                                                    isAct
                                                        ? 'bg-[#c084fc]/15 text-[var(--ink)] border-[#c084fc]/50 font-semibold shadow-sm'
                                                        : 'bg-[var(--bg-2)] text-[var(--alu-dim)] border-[var(--line)] hover:text-[var(--ink)] hover:border-[var(--line-strong)]'
                                                }`}
                                            >
                                                <span>{isTr ? st.labelTr : st.label}</span>
                                                {isAct && <Check className="w-3.5 h-3.5 text-[#c084fc]" />}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* C. Linear Stretch Sliders & Direct Numeric Inputs */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-mono uppercase tracking-wider text-[var(--alu-dim)]">
                                {isTr ? 'Doğrusal Esnetme Boyutları (Grips & Parametreler)' : 'Linear Stretch Dimensions'}
                            </label>
                            {activeBlock.linearParams
                                .filter(lp => {
                                    // In single gear mode, hide gear 2 specific params for clean UI
                                    if (activeBlock.id === 'dyn_involute_gear' && paramValues.gearMode === 'single') {
                                        return !['teeth2', 'profileShift2', 'boreDiameter2'].includes(lp.id);
                                    }
                                    // In single sprocket or single pulley mode, hide secondary wheel & center distance params
                                    if ((activeBlock.id === 'dyn_roller_sprocket' || activeBlock.id === 'dyn_timing_pulley') && paramValues.driveMode === 'single') {
                                        return !['teeth2', 'boreDiameter2', 'centerDistance'].includes(lp.id);
                                    }
                                    // Fastener dynamic parameters filtering per active component mode
                                    if (activeBlock.id === 'dyn_fastener') {
                                        const mode = String(paramValues.componentMode || (paramValues.nutOption === 'nut_only' ? 'nut_only' : 'assembly'));
                                        const pitchMode = String(paramValues.pitchMode || 'coarse');
                                        const thMode = String(paramValues.threadLengthMode || 'standard');

                                        if (mode === 'nut_only' || mode === 'washer_only') {
                                            if (mode === 'nut_only' && pitchMode === 'custom' && lp.id === 'customPitch') return true;
                                            return false;
                                        }
                                        if (mode === 'hole_clearance') {
                                            return ['holeDepth', 'plateThickness'].includes(lp.id);
                                        }
                                        if (mode === 'hole_tapped') {
                                            if (lp.id === 'customPitch') return pitchMode === 'custom';
                                            return ['holeDepth', 'tapDepth', 'plateThickness'].includes(lp.id);
                                        }
                                        // bolt_only, assembly, tapped_joint
                                        if (lp.id === 'length') return true;
                                        if (lp.id === 'threadLength') return thMode === 'custom';
                                        if (lp.id === 'customPitch') return pitchMode === 'custom';
                                        if (mode === 'tapped_joint' && lp.id === 'plateThickness') return true;
                                        return false;
                                    }
                                    return true;
                                })
                                .map((lp) => {
                                    const currentVal = Number(paramValues[lp.id] ?? lp.default);
                                    const stepVal = lp.step !== undefined ? lp.step : 1;
                                    return (
                                        <div key={lp.id} className="bg-[var(--bg-2)] p-2.5 rounded border border-[var(--line)] space-y-1.5">
                                            <div className="flex items-center justify-between text-xs font-mono">
                                                <span className="text-[var(--alu-dim)]">{isTr ? lp.labelTr : lp.label}</span>
                                                <div className="flex items-center gap-1.5">
                                                    <input
                                                        type="number"
                                                        min={lp.min}
                                                        max={lp.max}
                                                        step={stepVal}
                                                        value={currentVal}
                                                        onChange={(e) => handleParamChange(lp.id, Number(e.target.value))}
                                                        className="w-20 bg-[var(--bg-0)] border border-[var(--line)] rounded px-1.5 py-0.5 text-right text-xs text-[var(--cyan)] font-bold font-mono focus:outline-none focus:border-[var(--cyan)]"
                                                    />
                                                    {lp.unit && (
                                                        <span className="text-[var(--muted)] text-[10px] w-8 shrink-0">{lp.unit}</span>
                                                    )}
                                                </div>
                                            </div>
                                            <input
                                                type="range"
                                                min={lp.min}
                                                max={lp.max}
                                                step={stepVal}
                                                value={currentVal}
                                                onChange={(e) => handleParamChange(lp.id, Number(e.target.value))}
                                                className="w-full accent-[var(--cyan)] h-1.5 bg-[var(--bg-3)] rounded appearance-none cursor-pointer"
                                            />
                                            <div className="flex justify-between text-[9px] font-mono text-[var(--muted)]">
                                                <span>Min: {lp.min}{lp.unit}</span>
                                                <span>Max: {lp.max}{lp.unit}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>

                        {/* D. Specialized Profile Shift & Inspection Card (ISO 53 / DIN 3960) */}
                        {gearLiveInspection && (
                            <div className="bg-[var(--bg-1)] p-3 rounded border border-[var(--cyan)]/30 space-y-3 font-mono shadow-lg">
                                {/* Header */}
                                <div className="flex items-center justify-between border-b border-[var(--line)] pb-2">
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--cyan)]">
                                        <span>🔗</span>
                                        <span>{isTr ? 'PROFİL KAYDIRMA & MUAYENE (X1, X2)' : 'PROFILE SHIFT & INSPECTION (X1, X2)'}</span>
                                    </div>
                                    <span className="text-[10px] text-[var(--ok)] bg-[var(--ok)]/15 border border-[var(--ok)]/30 px-1.5 py-0.5 rounded">
                                        ✓ {isTr ? 'DIN 3960 Nominal' : 'Nominal'}
                                    </span>
                                </div>

                                {/* Tip Shortening Mode Buttons */}
                                <div className="space-y-1.5">
                                    <div className="text-[10px] uppercase text-[var(--alu-dim)] flex items-center justify-between">
                                        <span>{isTr ? 'Kafa Kısaltma (+/- k)' : 'Tip Shortening (+/- k)'}</span>
                                        <span className="text-[9px] text-[var(--muted)]">da = d + 2m(1 + x + k)</span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-1">
                                        {[
                                            { id: 'workshop', label: isTr ? 'Atölye (+k)' : 'Workshop (+k)' },
                                            { id: 'auto', label: 'Auto (DIN 3960)' },
                                            { id: 'custom', label: 'DIN Manuel (-k)' }
                                        ].map((m) => (
                                            <button
                                                key={m.id}
                                                type="button"
                                                onClick={() => handleParamChange('kMode', m.id)}
                                                className={`px-1.5 py-1 text-[10px] rounded border transition-colors ${
                                                    (paramValues.kMode || 'workshop') === m.id
                                                        ? 'bg-[var(--cyan)]/20 border-[var(--cyan)] text-[var(--cyan)] font-bold'
                                                        : 'bg-[var(--bg-2)] border-[var(--line)] text-[var(--alu-dim)] hover:text-[var(--ink)]'
                                                }`}
                                            >
                                                {m.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Calculated Readouts Box */}
                                <div className="bg-[var(--bg-0)] p-2.5 rounded border border-[var(--line)] space-y-1.5 text-[11px]">
                                    <div className="flex justify-between items-center text-[var(--alu-dim)]">
                                        <span>{isTr ? 'Bölüm Çapları (d1 / d2):' : 'Pitch Diameters (d1/d2):'}</span>
                                        <span className="text-[var(--ink)] font-bold">
                                            {gearLiveInspection.d1.toFixed(2)} mm
                                            {gearLiveInspection.isPair && ` · ${gearLiveInspection.d2.toFixed(2)} mm`}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center text-[var(--alu-dim)]">
                                        <span>{isTr ? 'Diş Üstü Çapları (da1 / da2):' : 'Effective Tip (da1/da2):'}</span>
                                        <span className="text-[var(--cyan)] font-bold">
                                            {gearLiveInspection.da1.toFixed(2)} mm
                                            {gearLiveInspection.isPair && ` · ${gearLiveInspection.da2.toFixed(2)} mm`}
                                        </span>
                                    </div>
                                    {gearLiveInspection.isPair && (
                                        <>
                                            <div className="flex justify-between items-center text-[var(--alu-dim)] border-t border-[var(--line)]/60 pt-1.5">
                                                <span>{isTr ? 'Standart Eksen (a0):' : 'Standard Center (a0):'}</span>
                                                <span className="text-[var(--alu-dim)]">{gearLiveInspection.a_standard.toFixed(2)} mm</span>
                                            </div>
                                            <div className="flex justify-between items-center text-[var(--alu-dim)]">
                                                <span className="text-[var(--cyan)] font-bold">{isTr ? 'Kavrama Eksen Mesafesi (aw):' : 'Working Center Dist (aw):'}</span>
                                                <span className="text-[var(--ok)] font-extrabold text-xs">
                                                    {gearLiveInspection.aw.toFixed(2)} mm
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center text-[var(--muted)] text-[10px]">
                                                <span>{isTr ? 'Eksen Değişim Katsayısı (y):' : 'Center Alteration (y):'}</span>
                                                <span>{gearLiveInspection.y.toFixed(4)} (k_din: {gearLiveInspection.k_din.toFixed(4)})</span>
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Shortcut Button to Full Gearbox Calculator */}
                                <button
                                    type="button"
                                    onClick={() => window.open('/gearbox-design/', '_blank')}
                                    className="w-full py-1.5 px-2 bg-[var(--cyan)]/15 hover:bg-[var(--cyan)]/25 text-[var(--cyan)] border border-[var(--cyan)]/40 rounded text-[11px] font-mono font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm"
                                >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                    <span>{isTr ? 'Sayfaya Uğra (Dişli & Şanzıman) ↗' : 'Visit Solver (Gearbox Design) ↗'}</span>
                                </button>
                            </div>
                        )}

                        {/* Specialized Roller Chain Drive Inspection Card (ISO 606 / DIN 8187) */}
                        {chainLiveInspection && (
                            <div className="bg-[var(--bg-1)] p-3 rounded border border-[var(--warn)]/40 space-y-3 font-mono shadow-lg">
                                {/* Header */}
                                <div className="flex items-center justify-between border-b border-[var(--line)] pb-2">
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--warn)]">
                                        <span>⛓️</span>
                                        <span>{isTr ? 'ZİNCİR AKTARIM & MUAYENE (ISO 606)' : 'ROLLER CHAIN INSPECTION (ISO 606)'}</span>
                                    </div>
                                    <span className="text-[10px] text-[var(--ok)] bg-[var(--ok)]/15 border border-[var(--ok)]/30 px-1.5 py-0.5 rounded">
                                        ✓ {chainLiveInspection.chainKey} ({chainLiveInspection.p} mm)
                                    </span>
                                </div>

                                {/* Calculated Readouts Box */}
                                <div className="bg-[var(--bg-0)] p-2.5 rounded border border-[var(--line)] space-y-1.5 text-[11px]">
                                    <div className="flex justify-between items-center text-[var(--alu-dim)]">
                                        <span>{isTr ? 'Bölüm Çapları (d1 / d2):' : 'Pitch Diameters (d1/d2):'}</span>
                                        <span className="text-[var(--ink)] font-bold">
                                            {chainLiveInspection.d1.toFixed(2)} mm
                                            {chainLiveInspection.isPair && ` · ${chainLiveInspection.d2.toFixed(2)} mm`}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center text-[var(--alu-dim)]">
                                        <span>{isTr ? 'Diş Dışı Çapları (da1 / da2):' : 'Tip Diameters (da1/da2):'}</span>
                                        <span className="text-[var(--cyan)] font-bold">
                                            {chainLiveInspection.da1.toFixed(2)} mm
                                            {chainLiveInspection.isPair && ` · ${chainLiveInspection.da2.toFixed(2)} mm`}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center text-[var(--alu-dim)]">
                                        <span>{isTr ? 'Diş Dibi Çapları (df1 / df2):' : 'Root Diameters (df1/df2):'}</span>
                                        <span className="text-[var(--alu-dim)]">
                                            {chainLiveInspection.df1.toFixed(2)} mm
                                            {chainLiveInspection.isPair && ` · ${chainLiveInspection.df2.toFixed(2)} mm`}
                                        </span>
                                    </div>
                                    {chainLiveInspection.isPair && (
                                        <>
                                            <div className="flex justify-between items-center text-[var(--alu-dim)] border-t border-[var(--line)]/60 pt-1.5">
                                                <span>{isTr ? 'Çevrim Oranı (i = z2/z1):' : 'Speed Ratio (i):'}</span>
                                                <span className="text-[var(--ink)] font-bold">{chainLiveInspection.ratio.toFixed(2)}:1</span>
                                            </div>
                                            <div className="flex justify-between items-center text-[var(--alu-dim)]">
                                                <span className="text-[var(--cyan)] font-bold">{isTr ? 'Eksen Mesafesi (a):' : 'Center Distance (a):'}</span>
                                                <span className="text-[var(--ok)] font-extrabold text-xs">
                                                    {chainLiveInspection.a.toFixed(1)} mm
                                                    <span className="text-[var(--muted)] text-[9px] font-normal ml-1">
                                                        (min: {chainLiveInspection.minA.toFixed(0)})
                                                    </span>
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center text-[var(--alu-dim)]">
                                                <span>{isTr ? 'Gerekli Bakla Sayısı (Lp):' : 'Chain Links (Lp):'}</span>
                                                <span className="text-[var(--warn)] font-bold">
                                                    {chainLiveInspection.Lp_even} bakla ({chainLiveInspection.Lp_exact.toFixed(2)})
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center text-[var(--alu-dim)]">
                                                <span>{isTr ? 'Toplam Zincir Boyu (L):' : 'Chain Length (L):'}</span>
                                                <span className="text-[var(--ink)] font-bold">{chainLiveInspection.chainLengthMm.toFixed(1)} mm</span>
                                            </div>
                                            <div className="flex justify-between items-center text-[var(--alu-dim)]">
                                                <span>{isTr ? 'Küçük Dişli Sarım Açısı (θ1):' : 'Wrap Angle (θ1):'}</span>
                                                <span className="text-[var(--cyan)]">{chainLiveInspection.wrapAngleDeg.toFixed(1)}°</span>
                                            </div>
                                            <div className="flex justify-between items-center text-[var(--muted)] text-[10px]">
                                                <span>{isTr ? 'Kavramadaki Diş (z_mesh):' : 'Teeth in Mesh:'}</span>
                                                <span className={chainLiveInspection.teethInMesh >= 6 ? 'text-[var(--ok)] font-bold' : 'text-[var(--bad)] font-bold'}>
                                                    {chainLiveInspection.teethInMesh.toFixed(1)} {chainLiveInspection.teethInMesh >= 6 ? '✓ (>=6)' : '⚠️ (<6)'}
                                                </span>
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Shortcut Button to Full Chain Drive Calculator */}
                                <button
                                    type="button"
                                    onClick={() => window.open('/chain-drive/', '_blank')}
                                    className="w-full py-1.5 px-2 bg-[var(--warn)]/15 hover:bg-[var(--warn)]/25 text-[var(--warn)] border border-[var(--warn)]/40 rounded text-[11px] font-mono font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm"
                                >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                    <span>{isTr ? 'Sayfaya Uğra (Zincir Hesaplayıcısı) ↗' : 'Visit Solver (Chain Drive Module) ↗'}</span>
                                </button>
                            </div>
                        )}

                        {/* Specialized Timing Belt Drive Inspection Card (ISO 13050 / DIN 7721) */}
                        {pulleyLiveInspection && (
                            <div className="bg-[var(--bg-1)] p-3 rounded border border-[var(--cyan)]/40 space-y-3 font-mono shadow-lg">
                                {/* Header */}
                                <div className="flex items-center justify-between border-b border-[var(--line)] pb-2">
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--cyan)]">
                                        <span>⏱️</span>
                                        <span>{isTr ? 'TRİGER AKTARIM & MUAYENE (ISO 13050)' : 'TIMING BELT INSPECTION (ISO 13050)'}</span>
                                    </div>
                                    <span className="text-[10px] text-[var(--ok)] bg-[var(--ok)]/15 border border-[var(--ok)]/30 px-1.5 py-0.5 rounded">
                                        ✓ {pulleyLiveInspection.profileKey} ({pulleyLiveInspection.p} mm)
                                    </span>
                                </div>

                                {/* Calculated Readouts Box */}
                                <div className="bg-[var(--bg-0)] p-2.5 rounded border border-[var(--line)] space-y-1.5 text-[11px]">
                                    <div className="flex justify-between items-center text-[var(--alu-dim)]">
                                        <span>{isTr ? 'Bölüm Çapları (dp1 / dp2):' : 'Pitch Diameters (dp1/dp2):'}</span>
                                        <span className="text-[var(--ink)] font-bold">
                                            {pulleyLiveInspection.dp1.toFixed(2)} mm
                                            {pulleyLiveInspection.isPair && ` · ${pulleyLiveInspection.dp2.toFixed(2)} mm`}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center text-[var(--alu-dim)]">
                                        <span>{isTr ? 'Dış Çaplar (da1 / da2):' : 'Outer Diameters (da1/da2):'}</span>
                                        <span className="text-[var(--cyan)] font-bold">
                                            {pulleyLiveInspection.da1.toFixed(2)} mm
                                            {pulleyLiveInspection.isPair && ` · ${pulleyLiveInspection.da2.toFixed(2)} mm`}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center text-[var(--muted)] text-[10px]">
                                        <span>{isTr ? 'PLD / Diş Derinliği (ht):' : 'PLD / Tooth Depth (ht):'}</span>
                                        <span>{pulleyLiveInspection.pld.toFixed(2)} mm / {pulleyLiveInspection.toothDepth.toFixed(2)} mm</span>
                                    </div>
                                    <div className="flex justify-between items-center text-[var(--alu-dim)]">
                                        <span>{isTr ? 'Yanak Çapları (d_flange):' : 'Flange Diameters:'}</span>
                                        <span className="text-[var(--ink)]">
                                            ~{pulleyLiveInspection.dFlange1.toFixed(1)} mm
                                            {pulleyLiveInspection.isPair && ` · ~${pulleyLiveInspection.dFlange2.toFixed(1)} mm`}
                                        </span>
                                    </div>
                                    {pulleyLiveInspection.isPair && (
                                        <>
                                            <div className="flex justify-between items-center text-[var(--alu-dim)] border-t border-[var(--line)]/60 pt-1.5">
                                                <span>{isTr ? 'Çevrim Oranı (i = z2/z1):' : 'Speed Ratio (i):'}</span>
                                                <span className="text-[var(--ink)] font-bold">{pulleyLiveInspection.ratio.toFixed(2)}:1</span>
                                            </div>
                                            <div className="flex justify-between items-center text-[var(--alu-dim)]">
                                                <span className="text-[var(--cyan)] font-bold">{isTr ? 'Eksen Mesafesi (a):' : 'Center Distance (a):'}</span>
                                                <span className="text-[var(--ok)] font-extrabold text-xs">
                                                    {pulleyLiveInspection.a.toFixed(1)} mm
                                                    <span className="text-[var(--muted)] text-[9px] font-normal ml-1">
                                                        (min: {pulleyLiveInspection.minA.toFixed(0)})
                                                    </span>
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center text-[var(--alu-dim)]">
                                                <span>{isTr ? 'Kayış Diş Sayısı (z_belt):' : 'Belt Teeth (z_belt):'}</span>
                                                <span className="text-[var(--cyan)] font-bold">
                                                    {pulleyLiveInspection.zBelt} diş
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center text-[var(--alu-dim)]">
                                                <span>{isTr ? 'Kayış Hat Boyu (Lp):' : 'Belt Pitch Length (Lp):'}</span>
                                                <span className="text-[var(--ink)] font-bold">
                                                    {pulleyLiveInspection.beltLengthStd.toFixed(1)} mm
                                                    <span className="text-[var(--muted)] text-[9px] font-normal ml-1">
                                                        ({pulleyLiveInspection.Lp_exact.toFixed(1)})
                                                    </span>
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center text-[var(--alu-dim)]">
                                                <span>{isTr ? 'Küçük Kasnak Sarım Açısı (θ1):' : 'Wrap Angle (θ1):'}</span>
                                                <span className="text-[var(--cyan)]">{pulleyLiveInspection.wrapAngleDeg.toFixed(1)}°</span>
                                            </div>
                                            <div className="flex justify-between items-center text-[var(--muted)] text-[10px]">
                                                <span>{isTr ? 'Kavramadaki Diş (z_mesh >= 6):' : 'Teeth in Mesh:'}</span>
                                                <span className={pulleyLiveInspection.teethInMesh >= 6 ? 'text-[var(--ok)] font-bold' : 'text-[var(--bad)] font-bold'}>
                                                    {pulleyLiveInspection.teethInMesh.toFixed(1)} {pulleyLiveInspection.teethInMesh >= 6 ? '✓ (>=6)' : '⚠️ (<6 güç katsayısı)'}
                                                </span>
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Shortcut Button to Full Belt Drive Calculator */}
                                <button
                                    type="button"
                                    onClick={() => window.open('/belt-drive/', '_blank')}
                                    className="w-full py-1.5 px-2 bg-[var(--cyan)]/15 hover:bg-[var(--cyan)]/25 text-[var(--cyan)] border border-[var(--cyan)]/40 rounded text-[11px] font-mono font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm"
                                >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                    <span>{isTr ? 'Sayfaya Uğra (Triger Kayış Hesaplayıcısı) ↗' : 'Visit Solver (Timing Belt Module) ↗'}</span>
                                </button>
                            </div>
                        )}

                        {/* Specialized Universal Fastener & Hole Inspection Card (VDI 2230 / ISO 898 / ISO 273) */}
                        {fastenerLiveInspection && (
                            <div className="bg-[var(--bg-1)] p-3 rounded border border-[var(--cyan)]/40 space-y-3 font-mono shadow-lg">
                                {/* Header */}
                                <div className="flex items-center justify-between border-b border-[var(--line)] pb-2">
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--cyan)]">
                                        <span>🔩</span>
                                        <span>{isTr ? 'CİVATA, SOMUN & DELİK ANALİZİ (VDI 2230)' : 'FASTENER & HOLE INSPECTION (VDI 2230)'}</span>
                                    </div>
                                    <span className="text-[10px] text-[var(--ok)] bg-[var(--ok)]/15 border border-[var(--ok)]/30 px-1.5 py-0.5 rounded font-bold">
                                        ✓ {fastenerLiveInspection.size}×{fastenerLiveInspection.pitch.toFixed(2)} · {fastenerLiveInspection.propClass}
                                    </span>
                                </div>

                                {/* Calculated Readouts Box */}
                                <div className="bg-[var(--bg-0)] p-2.5 rounded border border-[var(--line)] space-y-1.5 text-[11px]">
                                    <div className="flex justify-between items-center text-[var(--alu-dim)]">
                                        <span>{isTr ? 'Nominal Çap & Adım:' : 'Size & Pitch:'}</span>
                                        <span className="text-[var(--ink)] font-bold">
                                            {fastenerLiveInspection.size} × {fastenerLiveInspection.pitch.toFixed(2)} mm
                                            <span className="text-[var(--muted)] text-[10px] font-normal ml-1">
                                                ({fastenerLiveInspection.pitchMode === 'coarse' ? (isTr ? 'Kaba' : 'Coarse') : fastenerLiveInspection.pitchMode === 'fine' ? (isTr ? 'İnce' : 'Fine') : (isTr ? 'Özel' : 'Custom')})
                                            </span>
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center text-[var(--alu-dim)]">
                                        <span>{isTr ? 'Gerilme Kesit Alanı (As):' : 'Stress Area (As):'}</span>
                                        <span className="text-[var(--cyan)] font-bold">{fastenerLiveInspection.As.toFixed(1)} mm²</span>
                                    </div>
                                    <div className="flex justify-between items-center text-[var(--alu-dim)]">
                                        <span>{isTr ? 'Kılavuz Matkap Çapı (d_tap):' : 'Tap Drill Diameter (d_tap):'}</span>
                                        <span className="text-[var(--ok)] font-extrabold">{fastenerLiveInspection.dTap.toFixed(2)} mm</span>
                                    </div>
                                    <div className="flex justify-between items-center text-[var(--alu-dim)]">
                                        <span>{isTr ? 'Standart Geçiş Deliği (dh):' : 'Clearance Hole (dh):'}</span>
                                        <span className="text-[var(--ink)] font-bold">
                                            Ø{fastenerLiveInspection.dh.toFixed(1)} mm
                                            <span className="text-[var(--muted)] text-[10px] font-normal ml-1">
                                                (ISO 273 {fastenerLiveInspection.fit})
                                            </span>
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center text-[var(--alu-dim)] border-t border-[var(--line)]/60 pt-1.5">
                                        <span>{isTr ? 'İmbus Havşa (DIN 974):' : 'Counterbore (DIN 974):'}</span>
                                        <span className="text-[var(--alu-dim)]">
                                            Ø{fastenerLiveInspection.cbDia.toFixed(1)} × {fastenerLiveInspection.cbDepth.toFixed(1)} mm
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center text-[var(--alu-dim)]">
                                        <span className="text-[var(--cyan)] font-bold">{isTr ? 'Önerilen Sıkma Torku (MA):' : 'Tightening Torque (MA):'}</span>
                                        <span className="text-[var(--cyan)] font-extrabold text-xs">
                                            {fastenerLiveInspection.MA_Nm.toFixed(1)} N·m
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center text-[var(--alu-dim)]">
                                        <span>{isTr ? 'Montaj Ön Yükü (FM):' : 'Preload (FM):'}</span>
                                        <span className="text-[var(--warn)] font-bold">{fastenerLiveInspection.FM_kN.toFixed(1)} kN</span>
                                    </div>
                                    <div className="flex justify-between items-center text-[var(--muted)] text-[10px] border-t border-[var(--line)]/60 pt-1.5">
                                        <span>{isTr ? 'Min. Tutunma Boyu (Çelik/Alu):' : 'Min. Thread Engagement:'}</span>
                                        <span>{fastenerLiveInspection.LeSteel.toFixed(1)} mm / {fastenerLiveInspection.LeAlu.toFixed(1)} mm</span>
                                    </div>
                                </div>

                                {/* Shortcut Button to Bolt Torque & Clamping Calculator */}
                                <button
                                    type="button"
                                    onClick={() => window.open('/bolt-torque/', '_blank')}
                                    className="w-full py-1.5 px-2 bg-[var(--cyan)]/15 hover:bg-[var(--cyan)]/25 text-[var(--cyan)] border border-[var(--cyan)]/40 rounded text-[11px] font-mono font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm"
                                >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                    <span>{isTr ? 'Sayfaya Uğra (Cıvata & Tork Hesaplayıcısı) ↗' : 'Visit Solver (Bolt Torque Calculator) ↗'}</span>
                                </button>
                            </div>
                        )}

                        {/* Universal Live Engineering Inspection from BlockEngineeringMesh */}
                        {meshLiveInspection && (
                            <div className="bg-[var(--bg-1)] p-3 rounded border border-[var(--cyan)]/40 space-y-3 font-mono shadow-lg">
                                {/* Header */}
                                <div className="flex items-center justify-between border-b border-[var(--line)] pb-2">
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--cyan)]">
                                        <span>📐</span>
                                        <span>{isTr ? `${meshLiveInspection.mesh.nameTr.toUpperCase()} HESAPLARI` : `${meshLiveInspection.mesh.name.toUpperCase()} METRICS`}</span>
                                    </div>
                                    <span className="text-[10px] text-[var(--ok)] bg-[var(--ok)]/15 border border-[var(--ok)]/30 px-1.5 py-0.5 rounded font-bold">
                                        ✓ {meshLiveInspection.mesh.standard}
                                    </span>
                                </div>

                                {/* Readouts Box */}
                                <div className="bg-[var(--bg-0)] p-2.5 rounded border border-[var(--line)] space-y-1.5 text-[11px]">
                                    {meshLiveInspection.metrics.map((m) => (
                                        <div key={m.id} className="flex justify-between items-center text-[var(--alu-dim)]">
                                            <span>{isTr ? m.labelTr : m.label}:</span>
                                            <span className="text-[var(--ink)] font-bold">
                                                {m.value} {m.unit || ''}
                                                {m.formula && <span className="text-[var(--muted)] text-[9px] font-normal ml-1">({m.formula})</span>}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                {/* Dual Actions Row */}
                                <div className="grid grid-cols-2 gap-2 pt-1">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const res = CrossModuleBridge.exportBlockToFlow(activeBlock.id, paramValues, { switchWindow: true });
                                            if (res?.message) alert(res.message);
                                        }}
                                        className="w-full py-1.5 px-2 bg-[#8b5cf6]/15 hover:bg-[#8b5cf6]/25 text-[#a78bfa] border border-[#8b5cf6]/40 rounded text-[11px] font-mono font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm"
                                    >
                                        <Workflow className="w-3.5 h-3.5" />
                                        <span>Flow Engine ↗</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const url = buildCalculatorUrlWithParams(activeBlock.id, paramValues);
                                            window.open(url, '_blank');
                                        }}
                                        className="w-full py-1.5 px-2 bg-[var(--cyan)]/15 hover:bg-[var(--cyan)]/25 text-[var(--cyan)] border border-[var(--cyan)]/40 rounded text-[11px] font-mono font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm"
                                    >
                                        <ExternalLink className="w-3.5 h-3.5" />
                                        <span>{isTr ? 'Hesap Modülü ↗' : 'Solver ↗'}</span>
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* D. Flip Actions */}
                        {activeBlock.flipParams && activeBlock.flipParams.length > 0 && (
                            <div className="space-y-2">
                                <label className="text-[10px] font-mono uppercase tracking-wider text-[var(--alu-dim)] flex items-center gap-1">
                                    <ArrowRightLeft className="w-3 h-3 text-[var(--warn)]" />
                                    {isTr ? 'Aynalama / Yön Değişimi (Flip)' : 'Flip Actions'}
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {activeBlock.flipParams.map((fp) => {
                                        const isFlipped = Boolean(paramValues[fp.id]);
                                        return (
                                            <button
                                                key={fp.id}
                                                onClick={() => handleParamChange(fp.id, !isFlipped)}
                                                className={`px-2 py-2 rounded text-[11px] font-mono border flex items-center justify-center gap-1.5 transition-all ${
                                                    isFlipped
                                                        ? 'bg-[var(--warn)]/15 text-[var(--warn)] border-[var(--warn)]/50'
                                                        : 'bg-[var(--bg-2)] text-[var(--alu-dim)] border-[var(--line)] hover:text-[var(--ink)]'
                                                }`}
                                            >
                                                <ArrowRightLeft className="w-3 h-3" />
                                                <span>{isTr ? fp.labelTr : fp.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* E. Dynamic Array Action Info */}
                        {activeBlock.arrayActions && activeBlock.arrayActions.length > 0 && (
                            <div className="p-2.5 bg-[var(--cyan)]/5 border border-[var(--cyan)]/20 rounded text-[11px] text-[var(--alu-dim)] space-y-1">
                                <div className="flex items-center gap-1.5 text-[var(--cyan)] font-mono text-[10px] font-bold uppercase">
                                    <Sparkles className="w-3.5 h-3.5" />
                                    {isTr ? 'Otomatik Çoğaltma (Dynamic Array)' : 'Dynamic Array Action'}
                                </div>
                                <p className="text-[10px] leading-relaxed">
                                    {isTr
                                        ? 'Boyutlar esnetildikçe bileşenler (sandalyeler, raflar, kapaklar, aşıklar) standart aralıklara göre anlık olarak çoğalır ve dizilir.'
                                        : 'Extending dimensions automatically computes and arrays elements according to industrial spacing standards.'}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Bottom Action Section: Scale, Rotate, 2D & 3D Insertion */}
                    <div className="p-3 bg-[var(--bg-1)] space-y-2.5">
                        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                            <div>
                                <span className="text-[10px] text-[var(--muted)] block mb-1">
                                    {t12(language, 'Scale', 'Ölçek (Scale)')}
                                </span>
                                <input
                                    type="number"
                                    step="0.1"
                                    min="0.1"
                                    max="10"
                                    value={insertScale}
                                    onChange={(e) => setInsertScale(Number(e.target.value) || 1)}
                                    className="w-full bg-[var(--bg-2)] border border-[var(--line)] rounded px-2 py-1 text-xs text-[var(--ink)] font-mono focus:outline-none focus:border-[var(--cyan)]"
                                />
                            </div>
                            <div>
                                <span className="text-[10px] text-[var(--muted)] block mb-1">
                                    {t12(language, 'Rotation (°)', 'Açı (°)')}
                                </span>
                                <input
                                    type="number"
                                    step="15"
                                    value={insertRotationDeg}
                                    onChange={(e) => setInsertRotationDeg(Number(e.target.value) || 0)}
                                    className="w-full bg-[var(--bg-2)] border border-[var(--line)] rounded px-2 py-1 text-xs text-[var(--ink)] font-mono focus:outline-none focus:border-[var(--cyan)]"
                                />
                            </div>
                        </div>

                        {/* Dual Insertion Buttons or Instance Update */}
                        {onSaveInstance ? (
                            <button
                                onClick={() => {
                                    onSaveInstance(paramValues);
                                    onClose?.();
                                }}
                                className="w-full bg-[var(--cyan)] text-[var(--bg-0)] hover:bg-[var(--cyan)] font-mono text-xs font-bold py-2.5 px-3 rounded flex items-center justify-center gap-1.5 transition-colors shadow-lg shadow-[#00e5ff]/20 cursor-pointer"
                            >
                                <Check className="w-4 h-4" />
                                {t12(language, 'Apply Changes to Placed Block', 'Değişiklikleri Çizimdeki Bloka Uygula')}
                            </button>
                        ) : (
                            <div className="grid grid-cols-2 gap-2 pt-1">
                                <button
                                    onClick={handleInsert2D}
                                    className="w-full bg-[var(--cyan)] text-[var(--bg-0)] hover:bg-[var(--cyan)] font-mono text-xs font-bold py-2 px-3 rounded flex items-center justify-center gap-1.5 transition-colors shadow-lg shadow-[#00e5ff]/10 cursor-pointer"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    {onStampToSketch
                                        ? t12(language, 'Stamp onto Sketch', 'Aktif Eskize Ekle')
                                        : t12(language, 'Insert 2D CAD', '2D Çizime Ekle')}
                                </button>

                                <button
                                    onClick={handleInsert3D}
                                    className="w-full bg-[var(--cyan)]/15 border border-[var(--cyan)]/50 text-[var(--cyan)] hover:bg-[var(--cyan)]/25 font-mono text-xs font-bold py-2 px-3 rounded flex items-center justify-center gap-1.5 transition-colors"
                                >
                                    <Box className="w-3.5 h-3.5" />
                                    {t12(language, 'Add to 3D Scene', '3D Sahneye Ekle')}
                                </button>
                            </div>
                        )}

                        {/* Quick CAD Export Row (AutoCAD DXF, Parasolid X_T, ISO STEP) */}
                        <div className="grid grid-cols-3 gap-1.5 pt-1.5 border-t border-[var(--line)]/80">
                            <button
                                type="button"
                                onClick={() => downloadDynamicBlockCad('dxf', activeBlock, paramValues)}
                                className="bg-[var(--bg-2)] hover:bg-[var(--bg-3)] text-[var(--cyan)] border border-[var(--cyan)]/30 font-mono text-[10px] py-1.5 px-1.5 rounded flex items-center justify-center gap-1 transition-colors cursor-pointer"
                                title={t12(language, 'Download AutoCAD 2D DXF', 'AutoCAD 2D DXF Dosyası İndir')}
                            >
                                <FileCode className="w-3 h-3 shrink-0" />
                                <span>DXF</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => downloadDynamicBlockCad('xt', activeBlock, paramValues)}
                                className="bg-[var(--bg-2)] hover:bg-[var(--bg-3)] text-[var(--warn)] border border-[var(--warn)]/30 font-mono text-[10px] py-1.5 px-1.5 rounded flex items-center justify-center gap-1 transition-colors cursor-pointer"
                                title={t12(language, 'Download Parasolid X_T 3D Solid', 'Siemens Parasolid (.x_t) 3D Katı Model İndir (SolidWorks / NX)')}
                            >
                                <Download className="w-3 h-3 shrink-0" />
                                <span>{t12(language, 'X_T Solid', 'X_T Katı')}</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => downloadDynamicBlockCad('step', activeBlock, paramValues)}
                                className="bg-[var(--bg-2)] hover:bg-[var(--bg-3)] text-[var(--cyan)] border border-[var(--cyan)]/30 font-mono text-[10px] py-1.5 px-1.5 rounded flex items-center justify-center gap-1 transition-colors cursor-pointer"
                                title={t12(language, 'Download ISO STEP 3D Solid', 'ISO 10303-21 STEP 3D B-Rep Katı Model İndir')}
                            >
                                <Box className="w-3 h-3 shrink-0" />
                                <span>{t12(language, 'STEP 3D', 'STEP 3D')}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
