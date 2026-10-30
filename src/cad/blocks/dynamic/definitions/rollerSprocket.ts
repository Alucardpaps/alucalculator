/**
 * ⛓️ Dynamic Roller Chain Sprocket & Drive (Single / Pair) (ISO 606 / DIN 8187 / DIN 8188)
 * 
 * Powered by AluCalc OS Sprocket Geometry Factory:
 * - Precise ISO 606 roller seating radius (ri = 0.505*d1) and convex flank arcs
 * - Single sprocket (Tekli) & 2-sprocket chain drive pair (2'li Zincir Aktarım Çifti)
 * - Chain center distance (a), link count (Lp), and pitch path tangent lines
 * - DIN 6885-1 parallel keyway and bore inner cut for driver and driven sprockets
 * - Interactive pitch radius stretch grips to resize tooth counts (z1, z2) and center distance (a)
 * - Projections: Front Detailed (True Tooth Form & Chain Loop), Front Schematic, Side Section
 * - 3D Parametric CAD Solid generation
 */

import {
    Point,
    CadEntity,
    createLineEntity,
    createCircleEntity,
    createPolylineEntity,
    createRectangleEntity
} from '../../../kernel/types';
import { DynamicBlockDef, DynamicGrip, DynamicPart3DDef } from '../types';
import {
    calculateSprocketSpecs,
    generateSprocketContour,
    getStandardRollerDiameter
} from '../../../../engines/math/sprocket-geometry-factory';
import {
    generateBoreAndKeywayContour,
    getDin6885Keyway
} from '../../../../engines/math/gear-involute-factory';
import {
    findKtrClampexByShaft,
    calculateKtrHubSizing,
    type KtrClampexModel,
    type KtrClampexEntry
} from '../../../../data/mechanical/ktrClampexStandards';
import {
    drawHatchedRect,
    drawKtrClampex2DSection,
    drawKtrClamping2DFront,
    drawGuideFlange2DSection,
    drawShaftHubConnectionSection,
    resolveShaftConnection,
    createKtr3DParts,
    createGuideFlange3DParts
} from '../powerTransmissionUtils';

export const CHAIN_PITCHES: Record<string, { pitch: number; d1: number; label: string }> = {
    '06B': { pitch: 9.525,  d1: 6.35,  label: '06B (3/8" - 9.525 mm)' },
    '08B': { pitch: 12.700, d1: 8.51,  label: '08B (1/2" - 12.700 mm Standart)' },
    '10B': { pitch: 15.875, d1: 10.16, label: '10B (5/8" - 15.875 mm)' },
    '12B': { pitch: 19.050, d1: 12.07, label: '12B (3/4" - 19.050 mm)' },
    '16B': { pitch: 25.400, d1: 15.88, label: '16B (1" - 25.400 mm Ağır Yük)' },
    '20B': { pitch: 31.750, d1: 19.05, label: '20B (1-1/4" - 31.750 mm)' },
    '24B': { pitch: 38.100, d1: 25.40, label: '24B (1-1/2" - 38.100 mm)' }
};

export const DYN_ROLLER_CHAIN_SPROCKET: DynamicBlockDef = {
    id: 'dyn_roller_sprocket',
    name: 'Dynamic Roller Chain Sprocket & Drive (Single / Pair) (ISO 606 / DIN 8187)',
    nameTr: 'Dinamik Makaralı Zincir Dişlisi ve Aktarımı (Tekli / 2\'li Çift) (ISO 606 / DIN 8187)',
    category: 'Mechanical',
    subcategory: 'Gears & Power Transmission',
    subcategoryTr: 'Dişliler ve Güç Aktarımı',
    description: 'AutoCAD-grade dynamic chain sprocket & drive: ISO 606 tooth seating, single or 2-sprocket pair, center distance, link count, KTR CLAMPEX® conical lock & DIN 6885 bore.',
    descriptionTr: 'ISO 606 makaralı zincir dişlisi ve 2\'li tahrik sistemi: eksen mesafesi, bakla sayısı, KTR CLAMPEX® konik kilit, yanaklar ve kamalı mil delikleri.',
    icon: '⛓️',
    calculatorRoute: '/chain-drive',
    calculatorLabelTr: '⛓️ Makaralı Zincir & Dişli Hesabı (ISO 606)',
    citation: {
        tier: 1,
        standard: 'ISO 606:2015 / DIN 8187 / DIN 8188 / DIN 6885-1 / KTR CLAMPEX®',
        clause: 'ISO 606 Clause 5.2 (Tooth forms and sprocket geometry), DIN 6885-1, KTR p.298-316',
        description: 'Standard pitches (06B to 24B), seating radius ri = 0.505*d1, KTR conical locks, link count Lp and center distance calculation.'
    },
    linearParams: [
        {
            id: 'teeth',
            name: 'teeth',
            label: 'Driver Teeth (z1)',
            labelTr: 'Tahrik Diş Sayısı (z1)',
            min: 9,
            max: 114,
            step: 1,
            default: 19,
            unit: 'teeth',
            axis: 'x'
        },
        {
            id: 'teeth2',
            name: 'teeth2',
            label: 'Driven Teeth (z2)',
            labelTr: 'Çark Diş Sayısı (z2)',
            min: 9,
            max: 150,
            step: 1,
            default: 38,
            unit: 'teeth',
            axis: 'x'
        },
        {
            id: 'centerDistance',
            name: 'centerDistance',
            label: 'Center Distance (a)',
            labelTr: 'Eksenler Arası Mesafe (a)',
            min: 80,
            max: 2500,
            step: 10,
            default: 350,
            unit: 'mm',
            axis: 'x'
        },
        {
            id: 'boreDiameter',
            name: 'boreDiameter',
            label: 'Driver Shaft/Bore (d_mil1)',
            labelTr: 'Tahrik Mil Çapı (d_mil1)',
            min: 0,
            max: 120,
            step: 2,
            default: 25,
            unit: 'mm',
            axis: 'y'
        },
        {
            id: 'boreDiameter2',
            name: 'boreDiameter2',
            label: 'Driven Shaft/Bore (d_mil2)',
            labelTr: 'Çark Mil Çapı (d_mil2)',
            min: 0,
            max: 150,
            step: 2,
            default: 35,
            unit: 'mm',
            axis: 'y'
        }
    ],
    visibilityParam: {
        id: 'visState',
        name: 'visState',
        label: 'Projection View',
        labelTr: 'Görünüş Tipi',
        states: [
            { id: 'front_detailed', label: 'Front Detailed (ISO 606 Diş, KTR/Kama & Zincir Hattı)', labelTr: 'Ön Detaylı (Makaralı Diş Profili, KTR/Kama & Zincir)' },
            { id: 'front_schematic', label: 'Front Schematic (Teknik Resim Bölüm Dairesi & Eksen)', labelTr: 'Ön Şematik (Bölüm Dairesi & Eksen)' },
            { id: 'side_section', label: 'Side Section (ISO 128 Taranmış Gövde, Yanak & KTR Kesiti)', labelTr: 'Yan Kesit (ISO 128 Taranmış Gövde, Yanak & KTR)' }
        ],
        default: 'front_detailed'
    },
    lookupParams: [
        {
            id: 'driveMode',
            name: 'driveMode',
            label: 'Drive Connection Type',
            labelTr: 'Aktarım Tipi (Tekli / 2\'li Çift)',
            options: [
                { id: 'pair', label: '2\'li Zincir Aktarım Çifti (Chain Drive Pair)', values: { driveMode: 'pair' } },
                { id: 'single', label: 'Tekli Zincir Dişlisi (Single Sprocket)', values: { driveMode: 'single' } }
            ],
            default: 'pair'
        },
        {
            id: 'chainSize',
            name: 'chainSize',
            label: 'Standard Chain Pitch (ISO / DIN)',
            labelTr: 'Standart Zincir Adımı (ISO / DIN)',
            options: Object.keys(CHAIN_PITCHES).map(key => ({
                id: key,
                label: CHAIN_PITCHES[key].label,
                values: { chainSize: key }
            })),
            default: '08B'
        },
        {
            id: 'shaftConnection',
            name: 'shaftConnection',
            label: 'Shaft-Hub Connection Type',
            labelTr: 'Mil-Göbek Bağlantı Tipi',
            options: [
                { id: 'ktr_auto', label: '⚡ KTR CLAMPEX® Otomatik Emniyetli Kilit Hesabı (Auto-Sized)', standard: 'KTR Drive Technology Sizing', values: { shaftConnection: 'ktr_auto' } },
                { id: 'ktr_200', label: 'KTR CLAMPEX® KTR 200 (Kendinden Merkezlemeli Standart Konik Kilit)', standard: 'KTR Drive Technology p.306', values: { shaftConnection: 'ktr_200' } },
                { id: 'ktr_100', label: 'KTR CLAMPEX® KTR 100 (Kompakt / Dar Alan Konik Kilit)', standard: 'KTR Drive Technology p.298', values: { shaftConnection: 'ktr_100' } },
                { id: 'ktr_250', label: 'KTR CLAMPEX® KTR 250 (İnce Etli Göbek Konik Kilit)', standard: 'KTR Drive Technology p.312', values: { shaftConnection: 'ktr_250' } },
                { id: 'ktr_400', label: 'KTR CLAMPEX® KTR 400 (Ağır Hizmet Çift Konik Kilit)', standard: 'KTR Drive Technology p.314', values: { shaftConnection: 'ktr_400' } },
                { id: 'keyway_din6885', label: 'DIN 6885-1 Kamalı Mil Bağlantısı (Standard Keyway)', standard: 'DIN 6885-1', values: { shaftConnection: 'keyway_din6885' } },
                { id: 'none', label: 'Düz Delik / Kilit Yok (Plain Bore - No Lock)', standard: 'Plain Bore', values: { shaftConnection: 'none' } },
            ],
            default: 'ktr_auto'
        },
        {
            id: 'lockDirection',
            name: 'lockDirection',
            label: 'KTR Lock Mounting Direction',
            labelTr: 'Konik Kilit Montaj Yönü',
            options: [
                { id: 'front', label: 'Ön Yüzden Montaj (+Z Face / Ön Flanş)', values: { lockDirection: 'front' } },
                { id: 'back', label: 'Arka Yüzden Montaj (-Z Face / Arka Flanş)', values: { lockDirection: 'back' } }
            ],
            default: 'front'
        },
        {
            id: 'flangeOption',
            name: 'flangeOption',
            label: 'Guide Flanges (Pfeifer / Barbieri)',
            labelTr: 'Kılavuz Yan Flanşlar (İsteğe Bağlı)',
            options: [
                { id: 'none', label: 'Flanşsız Dişli (No Flanges)', values: { flangeOption: 'none' } },
                { id: 'both', label: 'Çift Taraflı Kılavuz Flanş (Double Flanges)', values: { flangeOption: 'both' } },
                { id: 'front', label: 'Tek Taraflı Ön Flanş (Front Flange Only)', values: { flangeOption: 'front' } },
                { id: 'back', label: 'Tek Taraflı Arka Flanş (Back Flange Only)', values: { flangeOption: 'back' } }
            ],
            default: 'none'
        },
        {
            id: 'hubStyle',
            name: 'hubStyle',
            label: 'Hub Boss Style',
            labelTr: 'Göbek Yapısı',
            options: [
                { id: 'boss', label: 'Faturalı / Çıkıntılı Göbek (Hub Boss with Extension)', values: { hubStyle: 'boss' } },
                { id: 'flush', label: 'Düz / Sıfır Göbek (Flush Hub)', values: { hubStyle: 'flush' } }
            ],
            default: 'boss'
        },
        {
            id: 'sideSectionMode',
            name: 'sideSectionMode',
            label: 'Side Section View Mode',
            labelTr: 'Yan Kesit Görünüm Tipi',
            options: [
                { id: 'transmission', label: 'Çift Milli Aktarım Kesiti (Parallel Shafts Transmission)', values: { sideSectionMode: 'transmission' } },
                { id: 'separated', label: 'Ayrık Parça İmalat Kesiti (Separated Single Sprockets)', values: { sideSectionMode: 'separated' } }
            ],
            default: 'transmission'
        }
    ],
    defaultValues: {
        driveMode: 'pair',
        chainSize: '08B',
        shaftConnection: 'keyway_din6885',
        lockDirection: 'front',
        flangeOption: 'none',
        hubStyle: 'boss',
        sideSectionMode: 'transmission',
        teeth: 19,
        teeth2: 38,
        centerDistance: 350,
        boreDiameter: 25,
        boreDiameter2: 35,
        visState: 'front_detailed'
    },
    generate2D: (params, basePoint = { x: 0, y: 0 }) => {
        const chainKey = String(params.chainSize || '08B');
        const chain = CHAIN_PITCHES[chainKey] || CHAIN_PITCHES['08B'];
        const z1 = Math.max(9, Math.round(Number(params.teeth) || 19));
        const z2 = Math.max(9, Math.round(Number(params.teeth2) || 38));
        const state = String(params.visState || 'front_detailed');
        const mode = String(params.driveMode || 'pair');
        const connection = String(params.shaftConnection || 'keyway_din6885');
        const lockDir = (params.lockDirection || 'front') as 'front' | 'back';
        const hubStyle = String(params.hubStyle || 'boss');
        const sideSecMode = String(params.sideSectionMode || 'transmission') as 'transmission' | 'separated';
        const flangeOpt = (params.flangeOption || 'none') as 'none' | 'both' | 'front' | 'back';

        const shaft1 = Math.max(8, Number(params.shaftDiameter || params.boreDiameter || 25));
        const shaft2 = Math.max(8, Number(params.shaftDiameter2 || params.boreDiameter2 || 35));

        const conn1 = resolveShaftConnection(connection, shaft1, 'sprocket');
        const conn2 = resolveShaftConnection(connection, shaft2, 'sprocket');

        const isKtr = conn1.isKtr;
        const ktr1 = conn1.ktrEntry;
        const ktr2 = conn2.ktrEntry;
        const bore1 = conn1.boreDiameter;
        const bore2 = conn2.boreDiameter;
        const hasKeyway = conn1.hasKeyway;

        const p = chain.pitch;
        const d_roller = chain.d1;

        // ISO 606 pitch and tip diameters
        const r1 = p / (2 * Math.sin(Math.PI / z1));
        const r2 = p / (2 * Math.sin(Math.PI / z2));
        const ra1 = (p * (0.6 + 1 / Math.tan(Math.PI / z1))) / 2;
        const ra2 = (p * (0.6 + 1 / Math.tan(Math.PI / z2))) / 2;
        const rf1 = r1 - d_roller / 2;
        const rf2 = r2 - d_roller / 2;
        const rFlange1 = ra1 + Math.max(3.5, 0.5 * p);
        const rFlange2 = ra2 + Math.max(3.5, 0.5 * p);

        // Center distance
        const minA = ra1 + ra2 + Math.max(10, p);
        const a = Math.max(minA, Number(params.centerDistance) || 350);

        const O1 = { x: basePoint.x, y: basePoint.y };
        const O2 = { x: basePoint.x + a, y: basePoint.y };

        const entities: CadEntity[] = [];
        const layer = 'layer-mech';
        const colorTeeth = '#3ad0e6';      // Cyan outer teeth
        const colorPitch = '#22c55e';      // Green pitch circle
        const colorCenter = '#ef4444';     // Red centerline
        const colorBore = '#38bdf8';       // Sky blue bore
        const colorRef = '#64748b';        // Muted gray reference circles
        const colorChain = '#f59e0b';      // Amber chain loop lines
        const colorDim = '#f59e0b';        // Amber dimension line
        const colorFlange = '#f59e0b';     // Amber flange ring

        const specs1 = calculateSprocketSpecs({
            teeth: z1,
            pitch: p,
            rollerDiameter: d_roller,
            boreDiameter: bore1,
            hasKeyway: hasKeyway && bore1 > 0
        });

        const specs2 = calculateSprocketSpecs({
            teeth: z2,
            pitch: p,
            rollerDiameter: d_roller,
            boreDiameter: bore2,
            hasKeyway: hasKeyway && bore2 > 0
        });

        // ═══════════════════════════════════════════════════════════════
        // 1. FRONT DETAILED VIEW (True ISO 606 Tooth Form)
        // ═══════════════════════════════════════════════════════════════
        if (state === 'front_detailed') {
            // Sprocket 1 Flange if enabled
            if (flangeOpt !== 'none') {
                entities.push(createCircleEntity(O1, rFlange1, layer, colorFlange));
            }

            // Sprocket 1 Contour
            const contour1 = generateSprocketContour({
                teeth: z1,
                pitch: p,
                rollerDiameter: d_roller,
                center: O1,
                pointsPerTooth: 16
            });
            if (contour1.length > 2) {
                entities.push(createPolylineEntity(contour1, true, layer, colorTeeth));
            }

            // Sprocket 1 Pitch circle
            entities.push(createCircleEntity(O1, r1, layer, colorPitch));

            // Sprocket 1 Bore connection
            if (isKtr && ktr1) {
                drawKtrClamping2DFront(entities, O1, ktr1, layer);
            } else if (hasKeyway && bore1 > 0) {
                const boreContour1 = generateBoreAndKeywayContour(O1, bore1, true, specs1.keyway);
                if (boreContour1.length > 2) {
                    entities.push(createPolylineEntity(boreContour1, true, layer, colorBore));
                }
            } else if (bore1 > 0) {
                entities.push(createCircleEntity(O1, bore1 / 2, layer, colorBore));
            }

            // Sprocket 1 Center cross
            const cLen1 = (flangeOpt !== 'none' ? rFlange1 : ra1) + 8;
            entities.push(createLineEntity({ x: O1.x - cLen1, y: O1.y }, { x: O1.x + cLen1, y: O1.y }, layer, colorCenter));
            entities.push(createLineEntity({ x: O1.x, y: O1.y - cLen1 }, { x: O1.x, y: O1.y + cLen1 }, layer, colorCenter));

            // Sprocket 2 in Pair Mode
            if (mode === 'pair') {
                if (flangeOpt !== 'none') {
                    entities.push(createCircleEntity(O2, rFlange2, layer, colorFlange));
                }

                const contour2 = generateSprocketContour({
                    teeth: z2,
                    pitch: p,
                    rollerDiameter: d_roller,
                    center: O2,
                    rotationAngle: (180 / z2),
                    pointsPerTooth: 16
                });
                if (contour2.length > 2) {
                    entities.push(createPolylineEntity(contour2, true, layer, colorTeeth));
                }

                // Pitch circle
                entities.push(createCircleEntity(O2, r2, layer, colorPitch));

                // Bore connection
                if (isKtr && ktr2) {
                    drawKtrClamping2DFront(entities, O2, ktr2, layer);
                } else if (hasKeyway && bore2 > 0) {
                    const boreContour2 = generateBoreAndKeywayContour(O2, bore2, true, specs2.keyway);
                    if (boreContour2.length > 2) {
                        entities.push(createPolylineEntity(boreContour2, true, layer, colorBore));
                    }
                } else if (bore2 > 0) {
                    entities.push(createCircleEntity(O2, bore2 / 2, layer, colorBore));
                }

                // Center cross
                const cLen2 = (flangeOpt !== 'none' ? rFlange2 : ra2) + 8;
                entities.push(createLineEntity({ x: O2.x - cLen2, y: O2.y }, { x: O2.x + cLen2, y: O2.y }, layer, colorCenter));
                entities.push(createLineEntity({ x: O2.x, y: O2.y - cLen2 }, { x: O2.x, y: O2.y + cLen2 }, layer, colorCenter));

                // Connecting Centerline
                entities.push(createLineEntity(
                    { x: O1.x - cLen1, y: O1.y },
                    { x: O2.x + cLen2, y: O2.y },
                    layer,
                    colorCenter
                ));

                // Tangent Chain Path Lines (Top & Bottom Strands)
                const phi = Math.asin(Math.max(-0.99, Math.min(0.99, (r2 - r1) / a)));
                const cosPhi = Math.cos(phi);
                const sinPhi = Math.sin(phi);

                // Pitch line tangents
                const p1Top = { x: O1.x - r1 * sinPhi, y: O1.y + r1 * cosPhi };
                const p2Top = { x: O2.x - r2 * sinPhi, y: O2.y + r2 * cosPhi };
                const p1Bot = { x: O1.x + r1 * sinPhi, y: O1.y - r1 * cosPhi };
                const p2Bot = { x: O2.x + r2 * sinPhi, y: O2.y - r2 * cosPhi };

                entities.push(createLineEntity(p1Top, p2Top, layer, colorPitch));
                entities.push(createLineEntity(p1Bot, p2Bot, layer, colorPitch));

                // Outer and Inner chain contour lines
                const chainT = d_roller * 0.9;
                const p1TopOuter = { x: p1Top.x - chainT * sinPhi, y: p1Top.y + chainT * cosPhi };
                const p2TopOuter = { x: p2Top.x - chainT * sinPhi, y: p2Top.y + chainT * cosPhi };
                const p1BotOuter = { x: p1Bot.x + chainT * sinPhi, y: p1Bot.y - chainT * cosPhi };
                const p2BotOuter = { x: p2Bot.x + chainT * sinPhi, y: p2Bot.y - chainT * cosPhi };

                entities.push(createLineEntity(p1TopOuter, p2TopOuter, layer, colorChain));
                entities.push(createLineEntity(p1BotOuter, p2BotOuter, layer, colorChain));

                // Center Distance (a) Dimension Callout
                const dimY = O1.y - Math.max(rFlange1, rFlange2) - 18;
                entities.push(createLineEntity({ x: O1.x, y: O1.y - rFlange1 - 5 }, { x: O1.x, y: dimY - 4 }, layer, colorRef));
                entities.push(createLineEntity({ x: O2.x, y: O2.y - rFlange2 - 5 }, { x: O2.x, y: dimY - 4 }, layer, colorRef));
                entities.push(createLineEntity({ x: O1.x, y: dimY }, { x: O2.x, y: dimY }, layer, colorDim));
                entities.push(createLineEntity({ x: O1.x - 3, y: dimY - 3 }, { x: O1.x + 3, y: dimY + 3 }, layer, colorDim));
                entities.push(createLineEntity({ x: O2.x - 3, y: dimY - 3 }, { x: O2.x + 3, y: dimY + 3 }, layer, colorDim));
            }

            return entities;
        }

        // ═══════════════════════════════════════════════════════════════
        // 2. FRONT SCHEMATIC VIEW
        // ═══════════════════════════════════════════════════════════════
        if (state === 'front_schematic') {
            if (flangeOpt !== 'none') entities.push(createCircleEntity(O1, rFlange1, layer, colorFlange));
            entities.push(createCircleEntity(O1, ra1, layer, colorTeeth));
            entities.push(createCircleEntity(O1, r1, layer, colorPitch));
            entities.push(createCircleEntity(O1, rf1, layer, colorRef));

            if (isKtr && ktr1) {
                drawKtrClamping2DFront(entities, O1, ktr1, layer);
            } else if (hasKeyway && bore1 > 0) {
                const boreContour1 = generateBoreAndKeywayContour(O1, bore1, true, specs1.keyway);
                if (boreContour1.length > 2) entities.push(createPolylineEntity(boreContour1, true, layer, colorBore));
            } else if (bore1 > 0) {
                entities.push(createCircleEntity(O1, bore1 / 2, layer, colorBore));
            }

            const cLen1 = (flangeOpt !== 'none' ? rFlange1 : ra1) + 10;
            entities.push(createLineEntity({ x: O1.x - cLen1, y: O1.y }, { x: O1.x + cLen1, y: O1.y }, layer, colorCenter));
            entities.push(createLineEntity({ x: O1.x, y: O1.y - cLen1 }, { x: O1.x, y: O1.y + cLen1 }, layer, colorCenter));

            if (mode === 'pair') {
                if (flangeOpt !== 'none') entities.push(createCircleEntity(O2, rFlange2, layer, colorFlange));
                entities.push(createCircleEntity(O2, ra2, layer, colorTeeth));
                entities.push(createCircleEntity(O2, r2, layer, colorPitch));
                entities.push(createCircleEntity(O2, rf2, layer, colorRef));

                if (isKtr && ktr2) {
                    drawKtrClamping2DFront(entities, O2, ktr2, layer);
                } else if (hasKeyway && bore2 > 0) {
                    const boreContour2 = generateBoreAndKeywayContour(O2, bore2, true, specs2.keyway);
                    if (boreContour2.length > 2) entities.push(createPolylineEntity(boreContour2, true, layer, colorBore));
                } else if (bore2 > 0) {
                    entities.push(createCircleEntity(O2, bore2 / 2, layer, colorBore));
                }

                const cLen2 = (flangeOpt !== 'none' ? rFlange2 : ra2) + 10;
                entities.push(createLineEntity({ x: O2.x - cLen2, y: O2.y }, { x: O2.x + cLen2, y: O2.y }, layer, colorCenter));
                entities.push(createLineEntity({ x: O2.x, y: O2.y - cLen2 }, { x: O2.x, y: O2.y + cLen2 }, layer, colorCenter));

                // Connecting Centerline
                entities.push(createLineEntity({ x: O1.x - cLen1, y: O1.y }, { x: O2.x + cLen2, y: O2.y }, layer, colorCenter));

                // Pitch Tangents
                const phi = Math.asin(Math.max(-0.99, Math.min(0.99, (r2 - r1) / a)));
                const cosPhi = Math.cos(phi);
                const sinPhi = Math.sin(phi);

                entities.push(createLineEntity(
                    { x: O1.x - r1 * sinPhi, y: O1.y + r1 * cosPhi },
                    { x: O2.x - r2 * sinPhi, y: O2.y + r2 * cosPhi },
                    layer,
                    colorPitch
                ));
                entities.push(createLineEntity(
                    { x: O1.x + r1 * sinPhi, y: O1.y - r1 * cosPhi },
                    { x: O2.x - r2 * sinPhi, y: O2.y - r2 * cosPhi },
                    layer,
                    colorPitch
                ));

                // Dimension line for a
                const dimY = O1.y - Math.max(rFlange1, rFlange2) - 18;
                entities.push(createLineEntity({ x: O1.x, y: O1.y - rFlange1 - 5 }, { x: O1.x, y: dimY - 4 }, layer, colorRef));
                entities.push(createLineEntity({ x: O2.x, y: O2.y - rFlange2 - 5 }, { x: O2.x, y: dimY - 4 }, layer, colorRef));
                entities.push(createLineEntity({ x: O1.x, y: dimY }, { x: O2.x, y: dimY }, layer, colorDim));
                entities.push(createLineEntity({ x: O1.x - 3, y: dimY - 3 }, { x: O1.x + 3, y: dimY + 3 }, layer, colorDim));
                entities.push(createLineEntity({ x: O2.x - 3, y: dimY - 3 }, { x: O2.x + 3, y: dimY + 3 }, layer, colorDim));
            }

            return entities;
        }

        // ═══════════════════════════════════════════════════════════════
        // 3. SIDE SECTION VIEW (ISO 128 Section Hatching & KTR Mount)
        // ═══════════════════════════════════════════════════════════════
        const drawSingleSprocketSection = (
            center: Point,
            ra: number,
            rp: number,
            rf: number,
            rFlange: number,
            conn: ReturnType<typeof resolveShaftConnection>,
            hatchAngle: 45 | -45 = 45,
            hatchColor = '#0284c7'
        ) => {
            const toothT = Math.max(3, d_roller * 0.85);
            const rHub = Math.max(conn.minHubDiameter / 2, conn.boreDiameter * 0.75, 18);
            const rRim = Math.max(rf - Math.max(0.6 * p, 4), rHub + 3);

            // Hub solid, stepped counterbore, KTR sleeve / keyway, solid shaft lines & red centerline
            drawShaftHubConnectionSection({
                entities,
                center,
                faceW: toothT,
                rHub,
                connection: conn,
                lockDirection: lockDir,
                hubStyle: hubStyle as 'boss' | 'flush',
                hatchAngle,
                contourColor: colorTeeth,
                hatchColor,
                layer
            });

            // Upper & lower web solid
            if (rRim > rHub + 2) {
                drawHatchedRect(entities, center.x - toothT / 2, center.x + toothT / 2, center.y + rHub, center.y + rRim, hatchAngle, 3.5, colorTeeth, hatchColor, layer);
                drawHatchedRect(entities, center.x - toothT / 2, center.x + toothT / 2, center.y - rRim, center.y - rHub, hatchAngle, 3.5, colorTeeth, hatchColor, layer);
            }

            // Upper & lower tooth rim solid
            drawHatchedRect(entities, center.x - toothT / 2, center.x + toothT / 2, center.y + rRim, center.y + ra, hatchAngle, 3.5, colorTeeth, hatchColor, layer);
            drawHatchedRect(entities, center.x - toothT / 2, center.x + toothT / 2, center.y - ra, center.y - rRim, hatchAngle, 3.5, colorTeeth, hatchColor, layer);

            // Root lines & Pitch centerlines
            entities.push(createLineEntity({ x: center.x - toothT / 2, y: center.y + rf }, { x: center.x + toothT / 2, y: center.y + rf }, layer, colorRef));
            entities.push(createLineEntity({ x: center.x - toothT / 2, y: center.y - rf }, { x: center.x + toothT / 2, y: center.y - rf }, layer, colorRef));
            entities.push(createLineEntity({ x: center.x - toothT / 2 - 6, y: center.y + rp }, { x: center.x + toothT / 2 + 6, y: center.y + rp }, layer, colorPitch));
            entities.push(createLineEntity({ x: center.x - toothT / 2 - 6, y: center.y - rp }, { x: center.x + toothT / 2 + 6, y: center.y - rp }, layer, colorPitch));

            // Guide Retaining Flanges (if enabled)
            if (flangeOpt === 'both' || flangeOpt === 'front') {
                drawGuideFlange2DSection(entities, center, center.x + toothT / 2, 'front', ra, rFlange, 2.0, 15, layer, colorFlange);
            }
            if (flangeOpt === 'both' || flangeOpt === 'back') {
                drawGuideFlange2DSection(entities, center, center.x - toothT / 2, 'back', ra, rFlange, 2.0, 15, layer, colorFlange);
            }
        };

        if (mode === 'pair' && sideSecMode === 'transmission') {
            // Parallel shafts transmission view
            // Shaft 1 at y = O1.y, Shaft 2 at y = O1.y + a
            const y1 = O1.y;
            const y2 = O1.y + a;
            const x0 = O1.x;
            const toothT = Math.max(3, d_roller * 0.85);

            drawSingleSprocketSection({ x: x0, y: y1 }, ra1, r1, rf1, rFlange1, conn1, 45, '#0284c7');
            drawSingleSprocketSection({ x: x0, y: y2 }, ra2, r2, rf2, rFlange2, conn2, -45, '#059669');

            // Chain strands connecting between Sprocket 1 and Sprocket 2
            entities.push(createLineEntity({ x: x0 - toothT / 2, y: y1 + ra1 }, { x: x0 - toothT / 2, y: y2 - ra2 }, layer, colorChain));
            entities.push(createLineEntity({ x: x0 + toothT / 2, y: y1 + ra1 }, { x: x0 + toothT / 2, y: y2 - ra2 }, layer, colorChain));
            // Center pitch chain cord line
            entities.push(createLineEntity({ x: x0, y: y1 + r1 }, { x: x0, y: y2 - r2 }, layer, colorPitch));

            // Dimension callout for Center Distance (a)
            const hubExt = hubStyle === 'boss' ? 15 : 0;
            const xDim = x0 - toothT / 2 - hubExt - 28;
            entities.push(createLineEntity({ x: x0 - toothT / 2 - hubExt - 15, y: y1 }, { x: xDim - 4, y: y1 }, layer, colorRef));
            entities.push(createLineEntity({ x: x0 - toothT / 2 - hubExt - 15, y: y2 }, { x: xDim - 4, y: y2 }, layer, colorRef));
            entities.push(createLineEntity({ x: xDim, y: y1 }, { x: xDim, y: y2 }, layer, colorDim));
            entities.push(createLineEntity({ x: xDim - 3, y: y1 - 3 }, { x: xDim + 3, y: y1 + 3 }, layer, colorDim));
            entities.push(createLineEntity({ x: xDim - 3, y: y2 - 3 }, { x: xDim + 3, y: y2 + 3 }, layer, colorDim));
        } else if (mode === 'pair' && sideSecMode === 'separated') {
            // Separated single sprockets
            drawSingleSprocketSection(O1, ra1, r1, rf1, rFlange1, conn1, 45, '#0284c7');
            const secSpacing = Math.max(ra1 + ra2 + 40, (d_roller * 0.85) + 80);
            drawSingleSprocketSection({ x: O1.x + secSpacing, y: O1.y }, ra2, r2, rf2, rFlange2, conn2, -45, '#059669');
        } else {
            // Single sprocket
            drawSingleSprocketSection(O1, ra1, r1, rf1, rFlange1, conn1, 45, '#0284c7');
        }

        return entities;
    },
    generate3D: (params, basePos = { x: 0, y: 0, z: 0 }) => {
        const chainKey = String(params.chainSize || '08B');
        const chain = CHAIN_PITCHES[chainKey] || CHAIN_PITCHES['08B'];
        const z1 = Math.max(9, Math.round(Number(params.teeth) || 19));
        const z2 = Math.max(9, Math.round(Number(params.teeth2) || 38));
        const mode = String(params.driveMode || 'pair');
        const connection = String(params.shaftConnection || 'keyway_din6885');
        const lockDir = (params.lockDirection || 'front') as 'front' | 'back';
        const hubStyle = String(params.hubStyle || 'boss');
        const flangeOpt = (params.flangeOption || 'none') as 'none' | 'both' | 'front' | 'back';

        const shaft1 = Math.max(8, Number(params.shaftDiameter || params.boreDiameter || 25));
        const shaft2 = Math.max(8, Number(params.shaftDiameter2 || params.boreDiameter2 || 35));

        const conn1 = resolveShaftConnection(connection, shaft1, 'sprocket');
        const conn2 = resolveShaftConnection(connection, shaft2, 'sprocket');

        const isKtr = conn1.isKtr;
        const ktr1 = conn1.ktrEntry;
        const ktr2 = conn2.ktrEntry;
        const bore1 = conn1.boreDiameter;
        const bore2 = conn2.boreDiameter;
        const hasKeyway = conn1.hasKeyway;

        const p = chain.pitch;
        const d_roller = chain.d1;
        const r1 = p / (2 * Math.sin(Math.PI / z1));
        const r2 = p / (2 * Math.sin(Math.PI / z2));
        const ra1 = (p * (0.6 + 1 / Math.tan(Math.PI / z1))) / 2;
        const ra2 = (p * (0.6 + 1 / Math.tan(Math.PI / z2))) / 2;
        const rFlange1 = ra1 + Math.max(3.5, 0.5 * p);
        const rFlange2 = ra2 + Math.max(3.5, 0.5 * p);

        const minA = ra1 + ra2 + Math.max(10, p);
        const a = Math.max(minA, Number(params.centerDistance) || 350);

        const toothT = Math.max(3, d_roller * 0.85);
        const hubDia1 = Math.max(bore1 * 1.8, 35);
        const hubW1 = Math.max(25, toothT + 20);
        const hubDia2 = Math.max(bore2 * 1.8, 45);
        const hubW2 = Math.max(25, toothT + 20);

        const parts: DynamicPart3DDef[] = [
            // Driver Sprocket
            {
                id: `sprocket1_body_${Date.now()}`,
                name: `ISO 606 Tahrik Dişlisi (${chainKey}, z1=${z1}, da1=${(ra1 * 2).toFixed(1)} mm, bore=Ø${bore1} mm${isKtr ? ' KTR Konik Kilit' : ' DIN 6885 Kama'})`,
                kind: 'gear-blank',
                color: '#3ad0e6',
                position: { x: basePos.x, y: basePos.y, z: basePos.z },
                rotation: { x: 90, y: 0, z: 0 },
                params: {
                    form: 'sprocket',
                    teeth: z1,
                    sprocketPitch: p,
                    pitchMm: p,
                    depth: toothT,
                    rollerDiameter: d_roller,
                    bore: bore1,
                    hasKeyway: hasKeyway && bore1 > 0,
                    conicalLock: isKtr && ktr1 ? {
                        model: ktr1.model,
                        d: ktr1.d,
                        D: ktr1.D,
                        TA: ktr1.TA,
                        T: ktr1.T,
                        Fax: ktr1.Fax,
                        screw: `${ktr1.screwCount}x${ktr1.screw}x${ktr1.screwLength}`
                    } : undefined
                },
                designStandard: isKtr ? 'ISO 606 / KTR CLAMPEX®' : 'ISO 606 / DIN 8187 / DIN 6885-1'
            }
        ];

        // Sprocket 1 Hub or KTR Conical Lock (coaxial along Z)
        if (isKtr && ktr1) {
            parts.push(...createKtr3DParts(basePos, toothT, ktr1, lockDir, 'Tahrik ', hubStyle === 'boss' ? 15 : 0));
        } else if (hubStyle === 'boss') {
            const hubExtZ = lockDir === 'front' ? -hubW1 / 2 + toothT / 2 : hubW1 / 2 - toothT / 2;
            parts.push({
                id: `sprocket1_hub_${Date.now()}`,
                name: `Tahrik Göbeği (Ø${hubDia1} mm, Delik Ø${bore1} mm)`,
                kind: 'tube',
                color: '#64748b',
                position: { x: basePos.x, y: basePos.y, z: basePos.z + hubExtZ },
                rotation: { x: 90, y: 0, z: 0 },
                params: {
                    innerDiameter: bore1,
                    outerDiameter: hubDia1,
                    length: hubW1
                }
            });
        }

        // Sprocket 1 Guide Flanges (if enabled)
        if (flangeOpt !== 'none') {
            parts.push(...createGuideFlange3DParts(basePos, toothT, Math.max(bore1, ra1 * 2 - 4), rFlange1 * 2, flangeOpt, 2.0, 'Tahrik '));
        }

        if (mode === 'pair') {
            const pos2 = { x: basePos.x + a, y: basePos.y, z: basePos.z };
            parts.push(
                // Driven Sprocket at distance a
                {
                    id: `sprocket2_body_${Date.now()}`,
                    name: `ISO 606 Çark Dişlisi (${chainKey}, z2=${z2}, da2=${(ra2 * 2).toFixed(1)} mm, a=${a.toFixed(1)} mm, bore=Ø${bore2} mm${isKtr ? ' KTR Konik Kilit' : ' DIN 6885 Kama'})`,
                    kind: 'gear-blank',
                    color: '#00e5ff',
                    position: pos2,
                    rotation: { x: 90, y: 0, z: 0 },
                    params: {
                        form: 'sprocket',
                        teeth: z2,
                        sprocketPitch: p,
                        pitchMm: p,
                        depth: toothT,
                        rollerDiameter: d_roller,
                        bore: bore2,
                        hasKeyway: bore2 > 0,
                        conicalLock: isKtr && ktr2 ? {
                            model: ktr2.model,
                            d: ktr2.d,
                            D: ktr2.D,
                            TA: ktr2.TA,
                            T: ktr2.T,
                            Fax: ktr2.Fax,
                            screw: `${ktr2.screwCount}x${ktr2.screw}x${ktr2.screwLength}`
                        } : undefined
                    },
                    designStandard: isKtr ? 'ISO 606 / KTR CLAMPEX®' : 'ISO 606 / DIN 8187 / DIN 6885-1'
                }
            );

            // Sprocket 2 Hub or KTR Conical Lock
            if (isKtr && ktr2) {
                parts.push(...createKtr3DParts(pos2, toothT, ktr2, lockDir, 'Çark ', hubStyle === 'boss' ? 15 : 0));
            } else if (hubStyle === 'boss') {
                const hubExtZ = lockDir === 'front' ? -hubW2 / 2 + toothT / 2 : hubW2 / 2 - toothT / 2;
                parts.push({
                    id: `sprocket2_hub_${Date.now()}`,
                    name: `Çark Göbeği (Ø${hubDia2} mm, Delik Ø${bore2} mm)`,
                    kind: 'tube',
                    color: '#64748b',
                    position: { x: pos2.x, y: pos2.y, z: pos2.z + hubExtZ },
                    rotation: { x: 90, y: 0, z: 0 },
                    params: {
                        innerDiameter: bore2,
                        outerDiameter: hubDia2,
                        length: hubW2
                    }
                });
            }

            // Sprocket 2 Guide Flanges (if enabled)
            if (flangeOpt !== 'none') {
                parts.push(...createGuideFlange3DParts(pos2, toothT, Math.max(bore2, ra2 * 2 - 4), rFlange2 * 2, flangeOpt, 2.0, 'Çark '));
            }
        }

        return parts;
    },
    getGrips: (params, basePoint = { x: 0, y: 0 }) => {
        const chainKey = String(params.chainSize || '08B');
        const chain = CHAIN_PITCHES[chainKey] || CHAIN_PITCHES['08B'];
        const z1 = Math.max(9, Math.round(Number(params.teeth) || 19));
        const z2 = Math.max(9, Math.round(Number(params.teeth2) || 38));
        const mode = String(params.driveMode || 'pair');
        const visState = String(params.visState || 'front_detailed');
        const connection = String(params.shaftConnection || 'keyway_din6885');

        const shaft1 = Math.max(8, Number(params.shaftDiameter || params.boreDiameter || 25));
        const shaft2 = Math.max(8, Number(params.shaftDiameter2 || params.boreDiameter2 || 35));

        const conn1 = resolveShaftConnection(connection, shaft1, 'sprocket');
        const conn2 = resolveShaftConnection(connection, shaft2, 'sprocket');

        const isKtr = conn1.isKtr;
        const ktr1 = conn1.ktrEntry;
        const ktr2 = conn2.ktrEntry;
        const bore1 = conn1.boreDiameter;
        const bore2 = conn2.boreDiameter;

        const p = chain.pitch;
        const d_roller = chain.d1;
        const toothT = Math.max(3, d_roller * 0.85);
        const r1 = p / (2 * Math.sin(Math.PI / z1));
        const r2 = p / (2 * Math.sin(Math.PI / z2));
        const ra1 = (p * (0.6 + 1 / Math.tan(Math.PI / z1))) / 2;
        const ra2 = (p * (0.6 + 1 / Math.tan(Math.PI / z2))) / 2;

        const minA = ra1 + ra2 + Math.max(10, p);
        const a = Math.max(minA, Number(params.centerDistance) || 350);

        // Clean layout for Side Section view so arrows don't collide with the sprocket body
        if (visState === 'side_section') {
            const grips: DynamicGrip[] = [
                // Stretch grip for Driver Sprocket teeth: placed below bottom rim pointing down
                {
                    id: 'grip_sprocket_teeth1',
                    type: 'stretch',
                    paramId: 'teeth',
                    position: { x: basePoint.x, y: basePoint.y - ra1 - 10 },
                    direction: { x: 0, y: -1 },
                    tooltip: `Tahrik Diş Sayısı: z1=${z1} (d1=${(r1 * 2).toFixed(1)} mm)`,
                    tooltipTr: `Tahrik Diş Sayısı: z1=${z1} (d1=${(r1 * 2).toFixed(1)} mm)`
                },
                // Stretch grip for Driver Shaft
                {
                    id: 'grip_sprocket_shaft1',
                    type: 'stretch',
                    paramId: 'boreDiameter',
                    position: { x: basePoint.x - toothT / 2 - 12, y: basePoint.y + shaft1 / 2 },
                    direction: { x: 0, y: 1 },
                    tooltip: isKtr
                        ? `Tahrik Mil Çapı d=Ø${shaft1} mm -> KTR ${ktr1?.model || ''} D=Ø${bore1} mm`
                        : `Tahrik Mil Çapı: Ø${shaft1} mm`,
                    tooltipTr: isKtr
                        ? `Tahrik Mil Çapı d=Ø${shaft1} mm -> KTR ${ktr1?.model || ''} D=Ø${bore1} mm`
                        : `Tahrik Mil Çapı: Ø${shaft1} mm`
                },
                // Visibility Grip
                {
                    id: 'grip_sprocket_vis',
                    type: 'visibility',
                    paramId: 'visState',
                    position: { x: basePoint.x - toothT / 2 - 25, y: basePoint.y - ra1 - 15 },
                    tooltip: 'Görünüş Değiştir (Gerçek Profil / Şematik / Kesit)',
                    tooltipTr: 'Görünüş Değiştir (Gerçek Profil / Şematik / Kesit)'
                }
            ];

            if (mode === 'pair') {
                grips.push(
                    // Stretch grip for Driven Sprocket: placed above top rim pointing up
                    {
                        id: 'grip_sprocket_teeth2',
                        type: 'stretch',
                        paramId: 'teeth2',
                        position: { x: basePoint.x, y: basePoint.y + a + ra2 + 10 },
                        direction: { x: 0, y: 1 },
                        tooltip: `Çark Diş Sayısı: z2=${z2} (d2=${(r2 * 2).toFixed(1)} mm)`,
                        tooltipTr: `Çark Diş Sayısı: z2=${z2} (d2=${(r2 * 2).toFixed(1)} mm)`
                    },
                    // Stretch grip for Driven Shaft
                    {
                        id: 'grip_sprocket_shaft2',
                        type: 'stretch',
                        paramId: 'boreDiameter2',
                        position: { x: basePoint.x - toothT / 2 - 12, y: basePoint.y + a + shaft2 / 2 },
                        direction: { x: 0, y: 1 },
                        tooltip: isKtr
                            ? `Çark Mil Çapı d=Ø${shaft2} mm -> KTR ${ktr2?.model || ''} D=Ø${bore2} mm`
                            : `Çark Mil Çapı: Ø${shaft2} mm`,
                        tooltipTr: isKtr
                            ? `Çark Mil Çapı d=Ø${shaft2} mm -> KTR ${ktr2?.model || ''} D=Ø${bore2} mm`
                            : `Çark Mil Çapı: Ø${shaft2} mm`
                    },
                    // Stretch grip on Center Distance a
                    {
                        id: 'grip_sprocket_center_dist',
                        type: 'stretch',
                        paramId: 'centerDistance',
                        position: { x: basePoint.x - toothT / 2 - 40, y: basePoint.y + a / 2 },
                        direction: { x: 0, y: 1 },
                        tooltip: `Eksenler Arası Mesafe a = ${a.toFixed(1)} mm`,
                        tooltipTr: `Eksenler Arası Mesafe a = ${a.toFixed(1)} mm`
                    }
                );
            }

            return grips;
        }

        // Standard Front view grips
        const grips: DynamicGrip[] = [
            // Linear Stretch Grip on Driver Sprocket Pitch Circle (Resizes z1)
            {
                id: 'grip_sprocket_teeth',
                type: 'stretch',
                paramId: 'teeth',
                position: { x: basePoint.x + r1, y: basePoint.y },
                direction: { x: 1, y: 0 },
                tooltip: `Tahrik Diş Sayısı: z1=${z1} (d1=${(r1 * 2).toFixed(1)} mm)`,
                tooltipTr: `Tahrik Diş Sayısı: z1=${z1} (Bölüm Çapı d1=${(r1 * 2).toFixed(1)} mm)`
            },
            // Linear Stretch Grip on Driver Bore
            {
                id: 'grip_sprocket_bore',
                type: 'stretch',
                paramId: 'boreDiameter',
                position: { x: basePoint.x, y: basePoint.y + shaft1 / 2 },
                direction: { x: 0, y: 1 },
                tooltip: isKtr
                    ? `Tahrik Mil Çapı d=Ø${shaft1} mm -> KTR ${ktr1?.model || ''} D=Ø${bore1} mm (TA=${ktr1?.TA || ''} Nm)`
                    : `Tahrik Mil Deliği (Ø${shaft1} mm)`,
                tooltipTr: isKtr
                    ? `Tahrik Mil Çapı d=Ø${shaft1} mm -> KTR ${ktr1?.model || ''} D=Ø${bore1} mm (TA=${ktr1?.TA || ''} Nm)`
                    : `Tahrik Mil Deliği (Ø${shaft1} mm)`
            },
            // Visibility State Flip Grip
            {
                id: 'grip_sprocket_vis',
                type: 'visibility',
                paramId: 'visState',
                position: { x: basePoint.x - r1 - 15, y: basePoint.y - r1 - 15 },
                tooltip: 'Görünüş Değiştir (Gerçek Profil / Şematik / Kesit)',
                tooltipTr: 'Görünüş Değiştir (Gerçek Profil / Şematik / Kesit)'
            }
        ];

        if (mode === 'pair') {
            grips.push(
                // Linear Stretch Grip on Driven Sprocket Pitch Circle (Resizes z2)
                {
                    id: 'grip_sprocket_teeth2',
                    type: 'stretch',
                    paramId: 'teeth2',
                    position: { x: basePoint.x + a + r2, y: basePoint.y },
                    direction: { x: 1, y: 0 },
                    tooltip: `Çark Diş Sayısı: z2=${z2} (d2=${(r2 * 2).toFixed(1)} mm)`,
                    tooltipTr: `Çark Diş Sayısı: z2=${z2} (Bölüm Çapı d2=${(r2 * 2).toFixed(1)} mm)`
                },
                // Linear Stretch Grip on Driven Bore
                {
                    id: 'grip_sprocket_bore2',
                    type: 'stretch',
                    paramId: 'boreDiameter2',
                    position: { x: basePoint.x + a, y: basePoint.y + shaft2 / 2 },
                    direction: { x: 0, y: 1 },
                    tooltip: isKtr
                        ? `Çark Mil Çapı d=Ø${shaft2} mm -> KTR ${ktr2?.model || ''} D=Ø${bore2} mm (TA=${ktr2?.TA || ''} Nm)`
                        : `Çark Mil Deliği (Ø${shaft2} mm)`,
                    tooltipTr: isKtr
                        ? `Çark Mil Çapı d=Ø${shaft2} mm -> KTR ${ktr2?.model || ''} D=Ø${bore2} mm (TA=${ktr2?.TA || ''} Nm)`
                        : `Çark Mil Deliği (Ø${shaft2} mm)`
                },
                // Stretch Grip on Center Distance a
                {
                    id: 'grip_sprocket_center_dist',
                    type: 'stretch',
                    paramId: 'centerDistance',
                    position: { x: basePoint.x + a, y: basePoint.y - Math.max(ra1, ra2) - 18 },
                    direction: { x: 1, y: 0 },
                    tooltip: `Eksenler Arası Mesafe a = ${a.toFixed(1)} mm`,
                    tooltipTr: `Eksenler Arası Mesafe a = ${a.toFixed(1)} mm`
                }
            );
        }

        return grips;
    }
};
