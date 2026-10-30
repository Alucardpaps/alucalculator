/**
 * ⏱️ Dynamic Synchronous Timing Belt Pulley & Drive (Single / Pair) (ISO 13050 / DIN 7721)
 * 
 * Powered by AluCalc OS Pulley Geometry Engine:
 * - Mathematical curvilinear tooth pockets (HTD, GT) & trapezoidal pockets (T)
 * - Single pulley (Tekli) & 2-pulley timing belt drive pair (2'li Triger Aktarım Çifti)
 * - Belt pitch length (Lp), teeth count (z_belt), and teeth in mesh (z_mesh >= 6) integration
 * - Pitch line differential (PLD) & standard tooth depth (ht) integration
 * - DIN 6885-1 parallel keyway and bore inner cut for both pulleys
 * - Interactive pitch radius stretch grips to resize tooth counts (z1, z2) and center distance (a)
 * - Projections: Front Detailed (True Tooth Rim, Flanges & Belt Loop), Front Schematic, Side Section
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
    calculatePulleySpecs,
    generateTimingPulleyContour,
    PulleyProfileType,
    getStandardPld,
    getStandardToothDepth
} from '../../../../engines/math/pulley-geometry-factory';
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

export const PULLEY_PROFILE_OPTIONS: Record<string, { type: PulleyProfileType; pitch: number; label: string }> = {
    'HTD_3M':  { type: 'timing-htd', pitch: 3.0,  label: 'HTD 3M (3.0 mm Yuvarlak Diş)' },
    'HTD_5M':  { type: 'timing-htd', pitch: 5.0,  label: 'HTD 5M (5.0 mm Yuvarlak Diş Standart)' },
    'HTD_8M':  { type: 'timing-htd', pitch: 8.0,  label: 'HTD 8M (8.0 mm Güçlü Aktarım)' },
    'HTD_14M': { type: 'timing-htd', pitch: 14.0, label: 'HTD 14M (14.0 mm Ağır Sanayi)' },
    'GT2':     { type: 'timing-gt',  pitch: 2.0,  label: 'GT2 (2.0 mm 3D Yazıcı / Otomasyon)' },
    'GT3':     { type: 'timing-gt',  pitch: 3.0,  label: 'GT3 (3.0 mm Hassas Kayış)' },
    'T5':      { type: 'timing-t',   pitch: 5.0,  label: 'T5 (5.0 mm DIN 7721 Trapez Diş)' },
    'T10':     { type: 'timing-t',   pitch: 10.0, label: 'T10 (10.0 mm DIN 7721 Trapez Diş)' }
};

export const DYN_TIMING_BELT_PULLEY: DynamicBlockDef = {
    id: 'dyn_timing_pulley',
    name: 'Dynamic Timing Belt Pulley & Drive (Single / Pair) (ISO 13050 / DIN 7721)',
    nameTr: 'Dinamik Triger / Zaman Kayışı Kasnağı ve Aktarımı (Tekli / 2\'li Çift) (ISO 13050)',
    category: 'Mechanical',
    subcategory: 'Gears & Power Transmission',
    subcategoryTr: 'Dişliler ve Güç Aktarımı',
    description: 'AutoCAD-grade dynamic timing belt drive: HTD/GT/T profiles, single or 2-pulley pair, center distance, belt length, flanges, KTR CLAMPEX® conical lock & DIN 6885 bore.',
    descriptionTr: 'ISO 13050 curvilinear triger kasnak ve 2\'li aktarım çifti: eksen mesafesi, kayış boyu, KTR CLAMPEX® konik kilit, yanaklar ve kamalı mil delikleri.',
    icon: '⏱️',
    calculatorRoute: '/belt-drive',
    calculatorLabelTr: '⏱️ Triger Kayış & Kasnak Hesabı (ISO 13050)',
    citation: {
        tier: 1,
        standard: 'ISO 13050:2014 / DIN 7721 / DIN 6885-1 / KTR CLAMPEX®',
        clause: 'ISO 13050 Section 5 (Pulley groove profiles and pitch lengths), DIN 7721, DIN 6885-1, KTR p.298-316',
        description: 'Standard pitches (2mm to 14mm), PLD differential da = dp - 2*PLD, Pfeifer guide flanges, KTR conical locks and synchronous belt drive geometry.'
    },
    linearParams: [
        {
            id: 'teeth',
            name: 'teeth',
            label: 'Driver Teeth (z1)',
            labelTr: 'Tahrik Kasnak Diş (z1)',
            min: 12,
            max: 144,
            step: 1,
            default: 24,
            unit: 'teeth',
            axis: 'x'
        },
        {
            id: 'teeth2',
            name: 'teeth2',
            label: 'Driven Teeth (z2)',
            labelTr: 'Çark Kasnak Diş (z2)',
            min: 12,
            max: 160,
            step: 1,
            default: 48,
            unit: 'teeth',
            axis: 'x'
        },
        {
            id: 'centerDistance',
            name: 'centerDistance',
            label: 'Center Distance (a)',
            labelTr: 'Eksenler Arası Mesafe (a)',
            min: 80,
            max: 2000,
            step: 5,
            default: 250,
            unit: 'mm',
            axis: 'x'
        },
        {
            id: 'beltWidth',
            name: 'beltWidth',
            label: 'Belt Width (W)',
            labelTr: 'Kayış Genişliği (W)',
            min: 6,
            max: 150,
            step: 3,
            default: 15,
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
            default: 15,
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
            default: 25,
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
            { id: 'front_detailed', label: 'Front Detailed (Triger Diş Yuvaları, Flanş, KTR/Kama & Kayış Hattı)', labelTr: 'Ön Detaylı (Diş Yuvaları, Flanş, KTR/Kama & Kayış)' },
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
                { id: 'pair', label: '2\'li Triger Aktarım Çifti (Timing Belt Drive Pair)', values: { driveMode: 'pair' } },
                { id: 'single', label: 'Tekli Triger Kasnağı (Single Pulley)', values: { driveMode: 'single' } }
            ],
            default: 'pair'
        },
        {
            id: 'profileType',
            name: 'profileType',
            label: 'Belt Profile & Pitch',
            labelTr: 'Kayış Profili ve Adımı',
            options: Object.keys(PULLEY_PROFILE_OPTIONS).map(key => ({
                id: key,
                label: PULLEY_PROFILE_OPTIONS[key].label,
                values: { profileType: key }
            })),
            default: 'HTD_5M'
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
            label: 'Side Retaining Flanges (Pfeifer / Barbieri)',
            labelTr: 'Kasnak Yan Flanşları (İsteğe Bağlı)',
            options: [
                { id: 'both', label: 'Çift Taraflı Kılavuz Flanş (Double Flanges)', values: { flangeOption: 'both' } },
                { id: 'none', label: 'Flanşsız Kasnak (No Flanges)', values: { flangeOption: 'none' } },
                { id: 'front', label: 'Tek Taraflı Ön Flanş (Front Flange Only)', values: { flangeOption: 'front' } },
                { id: 'back', label: 'Tek Taraflı Arka Flanş (Back Flange Only)', values: { flangeOption: 'back' } }
            ],
            default: 'both'
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
                { id: 'separated', label: 'Ayrık Parça İmalat Kesiti (Separated Single Pulleys)', values: { sideSectionMode: 'separated' } }
            ],
            default: 'transmission'
        }
    ],
    defaultValues: {
        driveMode: 'pair',
        profileType: 'HTD_5M',
        shaftConnection: 'ktr_auto',
        lockDirection: 'front',
        flangeOption: 'both',
        hubStyle: 'boss',
        sideSectionMode: 'transmission',
        teeth: 24,
        teeth2: 48,
        centerDistance: 250,
        beltWidth: 15,
        boreDiameter: 15,
        boreDiameter2: 25,
        visState: 'front_detailed'
    },
    generate2D: (params, basePoint = { x: 0, y: 0 }) => {
        const profKey = String(params.profileType || 'HTD_5M');
        const prof = PULLEY_PROFILE_OPTIONS[profKey] || PULLEY_PROFILE_OPTIONS['HTD_5M'];
        const z1 = Math.max(12, Math.round(Number(params.teeth) || 24));
        const z2 = Math.max(12, Math.round(Number(params.teeth2) || 48));
        const beltW = Number(params.beltWidth) || 15;
        const state = String(params.visState || 'front_detailed');
        const mode = String(params.driveMode || 'pair');
        const connection = String(params.shaftConnection || 'keyway_din6885');
        const lockDir = (params.lockDirection || 'front') as 'front' | 'back';
        const hubStyle = String(params.hubStyle || 'boss');
        const sideSecMode = String(params.sideSectionMode || 'transmission') as 'transmission' | 'separated';

        const rawFlange = String(params.flangeOption || 'both');
        const flangeOpt: 'none' | 'both' | 'front' | 'back' =
            rawFlange === 'no_flange' ? 'none' : rawFlange === 'with_flange' ? 'both' : (rawFlange as any) || 'both';

        const shaft1 = Math.max(8, Number(params.shaftDiameter || params.boreDiameter || 15));
        const shaft2 = Math.max(8, Number(params.shaftDiameter2 || params.boreDiameter2 || 25));

        const conn1 = resolveShaftConnection(connection, shaft1, 'pulley');
        const conn2 = resolveShaftConnection(connection, shaft2, 'pulley');

        const isKtr = conn1.isKtr;
        const ktr1 = conn1.ktrEntry;
        const ktr2 = conn2.ktrEntry;
        const bore1 = conn1.boreDiameter;
        const bore2 = conn2.boreDiameter;
        const hasKeyway = conn1.hasKeyway;

        const p = prof.pitch;
        const pld = getStandardPld(p, prof.type);
        const toothDepth = getStandardToothDepth(p, prof.type);

        // Pulley 1 & Pulley 2 specs
        const r1 = (z1 * p) / (2 * Math.PI);
        const r2 = (z2 * p) / (2 * Math.PI);
        const ra1 = r1 - pld;
        const ra2 = r2 - pld;
        const rf1 = ra1 - toothDepth;
        const rf2 = ra2 - toothDepth;
        const rFlange1 = ra1 + Math.max(3, p * 0.7);
        const rFlange2 = ra2 + Math.max(3, p * 0.7);

        // Center distance
        const minA = ra1 + ra2 + Math.max(8, p);
        const a = Math.max(minA, Number(params.centerDistance) || 250);

        const O1 = { x: basePoint.x, y: basePoint.y };
        const O2 = { x: basePoint.x + a, y: basePoint.y };

        const entities: CadEntity[] = [];
        const layer = 'layer-mech';
        const colorRim = '#3ad0e6';        // Cyan teeth rim
        const colorPitch = '#22c55e';      // Green pitch circle
        const colorCenter = '#ef4444';     // Red centerline
        const colorBore = '#38bdf8';       // Sky blue bore
        const colorFlange = '#f59e0b';     // Amber flange ring
        const colorRef = '#64748b';        // Muted gray reference circles
        const colorBelt = '#f59e0b';       // Amber belt loop lines
        const colorDim = '#f59e0b';        // Amber dimension callout

        const specs1 = calculatePulleySpecs({
            type: prof.type,
            teeth: z1,
            pitch: p,
            boreDiameter: bore1,
            hasKeyway: hasKeyway && bore1 > 0,
            hasFlange: flangeOpt !== 'none'
        });

        const specs2 = calculatePulleySpecs({
            type: prof.type,
            teeth: z2,
            pitch: p,
            boreDiameter: bore2,
            hasKeyway: hasKeyway && bore2 > 0,
            hasFlange: flangeOpt !== 'none'
        });

        // ═══════════════════════════════════════════════════════════════
        // 1. FRONT DETAILED VIEW (True Curvilinear Pocket Rim)
        // ═══════════════════════════════════════════════════════════════
        if (state === 'front_detailed') {
            // Pulley 1 Flange
            if (flangeOpt !== 'none') {
                entities.push(createCircleEntity(O1, rFlange1, layer, colorFlange));
            }

            // Pulley 1 Contour
            const contour1 = generateTimingPulleyContour({
                type: prof.type,
                teeth: z1,
                pitch: p,
                center: O1,
                pointsPerTooth: 16
            });
            if (contour1.length > 2) {
                entities.push(createPolylineEntity(contour1, true, layer, colorRim));
            }

            // Pulley 1 Pitch Circle
            entities.push(createCircleEntity(O1, r1, layer, colorPitch));

            // Pulley 1 Bore Connection
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

            // Pulley 1 Center cross
            const cLen1 = (flangeOpt !== 'none' ? rFlange1 : ra1) + 8;
            entities.push(createLineEntity({ x: O1.x - cLen1, y: O1.y }, { x: O1.x + cLen1, y: O1.y }, layer, colorCenter));
            entities.push(createLineEntity({ x: O1.x, y: O1.y - cLen1 }, { x: O1.x, y: O1.y + cLen1 }, layer, colorCenter));

            // Pulley 2 in Pair Mode
            if (mode === 'pair') {
                if (flangeOpt !== 'none') {
                    entities.push(createCircleEntity(O2, rFlange2, layer, colorFlange));
                }

                const contour2 = generateTimingPulleyContour({
                    type: prof.type,
                    teeth: z2,
                    pitch: p,
                    center: O2,
                    rotationAngle: (180 / z2),
                    pointsPerTooth: 16
                });
                if (contour2.length > 2) {
                    entities.push(createPolylineEntity(contour2, true, layer, colorRim));
                }

                entities.push(createCircleEntity(O2, r2, layer, colorPitch));

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

                const cLen2 = (flangeOpt !== 'none' ? rFlange2 : ra2) + 8;
                entities.push(createLineEntity({ x: O2.x - cLen2, y: O2.y }, { x: O2.x + cLen2, y: O2.y }, layer, colorCenter));
                entities.push(createLineEntity({ x: O2.x, y: O2.y - cLen2 }, { x: O2.x, y: O2.y + cLen2 }, layer, colorCenter));

                // Connecting Centerline
                entities.push(createLineEntity({ x: O1.x - cLen1, y: O1.y }, { x: O2.x + cLen2, y: O2.y }, layer, colorCenter));

                // Tangent Synchronous Belt Path Lines
                const phi = Math.asin(Math.max(-0.99, Math.min(0.99, (r2 - r1) / a)));
                const cosPhi = Math.cos(phi);
                const sinPhi = Math.sin(phi);

                // Pitch line tangents (Belt pitch line / cord line)
                const p1Top = { x: O1.x - r1 * sinPhi, y: O1.y + r1 * cosPhi };
                const p2Top = { x: O2.x - r2 * sinPhi, y: O2.y + r2 * cosPhi };
                const p1Bot = { x: O1.x + r1 * sinPhi, y: O1.y - r1 * cosPhi };
                const p2Bot = { x: O2.x + r2 * sinPhi, y: O2.y - r2 * cosPhi };

                entities.push(createLineEntity(p1Top, p2Top, layer, colorPitch));
                entities.push(createLineEntity(p1Bot, p2Bot, layer, colorPitch));

                // Belt Outer Backing Line (Belt thickness approx 1.8 * toothDepth)
                const beltThick = Math.max(2.2, toothDepth * 1.8);
                const p1TopOuter = { x: p1Top.x - beltThick * sinPhi, y: p1Top.y + beltThick * cosPhi };
                const p2TopOuter = { x: p2Top.x - beltThick * sinPhi, y: p2Top.y + beltThick * cosPhi };
                const p1BotOuter = { x: p1Bot.x + beltThick * sinPhi, y: p1Bot.y - beltThick * cosPhi };
                const p2BotOuter = { x: p2Bot.x + beltThick * sinPhi, y: p2Bot.y - beltThick * cosPhi };

                entities.push(createLineEntity(p1TopOuter, p2TopOuter, layer, colorBelt));
                entities.push(createLineEntity(p1BotOuter, p2BotOuter, layer, colorBelt));

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
            entities.push(createCircleEntity(O1, ra1, layer, colorRim));
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
                entities.push(createCircleEntity(O2, ra2, layer, colorRim));
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
                    { x: O2.x + r2 * sinPhi, y: O2.y - r2 * cosPhi },
                    layer,
                    colorPitch
                ));

                // Dimension callout for a
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
        const drawSinglePulleySection = (
            center: Point,
            ra: number,
            rp: number,
            rf: number,
            rFlange: number,
            conn: ReturnType<typeof resolveShaftConnection>,
            hatchAngle: 45 | -45 = 45,
            hatchColor = '#0284c7'
        ) => {
            const faceW = beltW + 4;
            const rHub = Math.max(conn.minHubDiameter / 2, conn.boreDiameter * 0.75, 16);
            const bw = Math.max(8, faceW * 0.38);
            const rRim = Math.max(rf - Math.max(2.5, p * 0.4), rHub + 3);

            // 1. Hub solid, stepped counterbore, KTR sleeve / keyway, solid shaft lines & red centerline
            drawShaftHubConnectionSection({
                entities,
                center,
                faceW,
                rHub,
                connection: conn,
                lockDirection: lockDir,
                hubStyle: hubStyle as 'boss' | 'flush',
                hatchAngle,
                contourColor: colorRim,
                hatchColor,
                layer
            });

            // 2. Upper & lower web solid
            if (rRim > rHub + 2) {
                drawHatchedRect(entities, center.x - bw / 2, center.x + bw / 2, center.y + rHub, center.y + rRim, hatchAngle, 3.5, colorRim, hatchColor, layer);
                drawHatchedRect(entities, center.x - bw / 2, center.x + bw / 2, center.y - rRim, center.y - rHub, hatchAngle, 3.5, colorRim, hatchColor, layer);
            }

            // 3. Upper & lower tooth rim solid
            drawHatchedRect(entities, center.x - faceW / 2, center.x + faceW / 2, center.y + rRim, center.y + ra, hatchAngle, 3.5, colorRim, hatchColor, layer);
            drawHatchedRect(entities, center.x - faceW / 2, center.x + faceW / 2, center.y - ra, center.y - rRim, hatchAngle, 3.5, colorRim, hatchColor, layer);

            // 4. Root lines & Pitch centerlines
            entities.push(createLineEntity({ x: center.x - faceW / 2, y: center.y + rf }, { x: center.x + faceW / 2, y: center.y + rf }, layer, colorRef));
            entities.push(createLineEntity({ x: center.x - faceW / 2, y: center.y - rf }, { x: center.x + faceW / 2, y: center.y - rf }, layer, colorRef));
            entities.push(createLineEntity({ x: center.x - faceW / 2 - 6, y: center.y + rp }, { x: center.x + faceW / 2 + 6, y: center.y + rp }, layer, colorPitch));
            entities.push(createLineEntity({ x: center.x - faceW / 2 - 6, y: center.y - rp }, { x: center.x + faceW / 2 + 6, y: center.y - rp }, layer, colorPitch));

            // 5. Guide Retaining Flanges (Pfeifer / Barbieri Standard with 15° escape chamfer)
            // PASSING center SO Y COORDINATES MATCH THE PULLEY POSITION AT ALL TIMES!
            if (flangeOpt === 'both' || flangeOpt === 'front') {
                drawGuideFlange2DSection(entities, center, center.x + faceW / 2, 'front', ra, rFlange, 2.0, 15, layer, colorFlange);
            }
            if (flangeOpt === 'both' || flangeOpt === 'back') {
                drawGuideFlange2DSection(entities, center, center.x - faceW / 2, 'back', ra, rFlange, 2.0, 15, layer, colorFlange);
            }
        };

        if (mode === 'pair' && sideSecMode === 'transmission') {
            // Parallel shafts transmission view
            // Shaft 1 at y = O1.y, Shaft 2 at y = O1.y + a
            const y1 = O1.y;
            const y2 = O1.y + a;
            const x0 = O1.x;
            const faceW = beltW + 4;

            drawSinglePulleySection({ x: x0, y: y1 }, ra1, r1, rf1, rFlange1, conn1, 45, '#0284c7');
            drawSinglePulleySection({ x: x0, y: y2 }, ra2, r2, rf2, rFlange2, conn2, -45, '#059669');

            // Belt strands connecting between Pulley 1 and Pulley 2
            const beltThick = Math.max(2.2, toothDepth * 1.8);
            // Left & Right edges of the belt span
            entities.push(createLineEntity({ x: x0 - beltW / 2, y: y1 + ra1 }, { x: x0 - beltW / 2, y: y2 - ra2 }, layer, colorBelt));
            entities.push(createLineEntity({ x: x0 + beltW / 2, y: y1 + ra1 }, { x: x0 + beltW / 2, y: y2 - ra2 }, layer, colorBelt));
            // Outer cord line
            entities.push(createLineEntity({ x: x0 - beltW / 2, y: y1 + ra1 + beltThick }, { x: x0 - beltW / 2, y: y2 - ra2 - beltThick }, layer, colorRef));
            entities.push(createLineEntity({ x: x0 + beltW / 2, y: y1 + ra1 + beltThick }, { x: x0 + beltW / 2, y: y2 - ra2 - beltThick }, layer, colorRef));

            // Dimension callout for Center Distance (a)
            const hubExt = hubStyle === 'boss' ? (isKtr && ktr1 ? Math.max(14, (ktr1.B1 || 30) - faceW + 8) : 12) : 0;
            const xDim = x0 - faceW / 2 - hubExt - 28;
            entities.push(createLineEntity({ x: x0 - faceW / 2 - hubExt - 15, y: y1 }, { x: xDim - 4, y: y1 }, layer, colorRef));
            entities.push(createLineEntity({ x: x0 - faceW / 2 - hubExt - 15, y: y2 }, { x: xDim - 4, y: y2 }, layer, colorRef));
            entities.push(createLineEntity({ x: xDim, y: y1 }, { x: xDim, y: y2 }, layer, colorDim));
            entities.push(createLineEntity({ x: xDim - 3, y: y1 - 3 }, { x: xDim + 3, y: y1 + 3 }, layer, colorDim));
            entities.push(createLineEntity({ x: xDim - 3, y: y2 - 3 }, { x: xDim + 3, y: y2 + 3 }, layer, colorDim));
        } else if (mode === 'pair' && sideSecMode === 'separated') {
            // Separated single pulleys
            drawSinglePulleySection(O1, ra1, r1, rf1, rFlange1, conn1, 45, '#0284c7');
            const secSpacing = Math.max(ra1 + ra2 + 40, (beltW + 4) + 80);
            drawSinglePulleySection({ x: O1.x + secSpacing, y: O1.y }, ra2, r2, rf2, rFlange2, conn2, -45, '#059669');
        } else {
            // Single pulley
            drawSinglePulleySection(O1, ra1, r1, rf1, rFlange1, conn1, 45, '#0284c7');
        }

        return entities;
    },
    generate3D: (params, basePos = { x: 0, y: 0, z: 0 }) => {
        const profKey = String(params.profileType || 'HTD_5M');
        const prof = PULLEY_PROFILE_OPTIONS[profKey] || PULLEY_PROFILE_OPTIONS['HTD_5M'];
        const z1 = Math.max(12, Math.round(Number(params.teeth) || 24));
        const z2 = Math.max(12, Math.round(Number(params.teeth2) || 48));
        const beltW = Number(params.beltWidth) || 15;
        const mode = String(params.driveMode || 'pair');
        const connection = String(params.shaftConnection || 'keyway_din6885');
        const lockDir = (params.lockDirection || 'front') as 'front' | 'back';
        const hubStyle = String(params.hubStyle || 'boss');

        const rawFlange = String(params.flangeOption || 'both');
        const flangeOpt: 'none' | 'both' | 'front' | 'back' =
            rawFlange === 'no_flange' ? 'none' : rawFlange === 'with_flange' ? 'both' : (rawFlange as any) || 'both';

        const shaft1 = Math.max(8, Number(params.shaftDiameter || params.boreDiameter || 15));
        const shaft2 = Math.max(8, Number(params.shaftDiameter2 || params.boreDiameter2 || 25));

        const conn1 = resolveShaftConnection(connection, shaft1, 'pulley');
        const conn2 = resolveShaftConnection(connection, shaft2, 'pulley');

        const isKtr = conn1.isKtr;
        const ktr1 = conn1.ktrEntry;
        const ktr2 = conn2.ktrEntry;
        const bore1 = conn1.boreDiameter;
        const bore2 = conn2.boreDiameter;
        const hasKeyway = conn1.hasKeyway;

        const p = prof.pitch;
        const pld = getStandardPld(p, prof.type);
        const r1 = (z1 * p) / (2 * Math.PI);
        const r2 = (z2 * p) / (2 * Math.PI);
        const ra1 = r1 - pld;
        const ra2 = r2 - pld;
        const rFlange1 = ra1 + Math.max(3, p * 0.7);
        const rFlange2 = ra2 + Math.max(3, p * 0.7);

        const minA = ra1 + ra2 + Math.max(8, p);
        const a = Math.max(minA, Number(params.centerDistance) || 250);

        const faceW = beltW + 4;
        const hubExt1 = hubStyle === 'boss' ? (isKtr && ktr1 ? Math.max(14, (ktr1.B1 || 30) - faceW + 8) : 12) : 0;
        const hubDia1 = Math.max(conn1.minHubDiameter, bore1 * 1.5, 28);
        const hubW1 = faceW + hubExt1;
        const hubExt2 = hubStyle === 'boss' ? (isKtr && ktr2 ? Math.max(14, (ktr2.B1 || 30) - faceW + 8) : 12) : 0;
        const hubDia2 = Math.max(conn2.minHubDiameter, bore2 * 1.5, 38);
        const hubW2 = faceW + hubExt2;

        const profileType3D = profKey.startsWith('GT') ? 'timing-gt' : profKey.startsWith('T') ? 'timing-t' : 'timing-htd';

        const parts: DynamicPart3DDef[] = [
            // Driver Pulley Body (True ISO 13050 Tooth Profile & Keyway/Conical lock)
            {
                id: `pulley1_body_${Date.now()}`,
                name: `ISO 13050 Tahrik Kasnağı (${profKey}, z1=${z1}, da1=${(ra1 * 2).toFixed(1)} mm, bore=Ø${bore1} mm${isKtr ? ' KTR Konik Kilit' : ' DIN 6885 Kama'})`,
                kind: 'pulley',
                color: '#3ad0e6',
                position: { x: basePos.x, y: basePos.y, z: basePos.z },
                rotation: { x: 90, y: 0, z: 0 },
                params: {
                    form: 'timing',
                    teeth: z1,
                    pitch: p,
                    pulleyProfileType: profileType3D,
                    depth: faceW,
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
                designStandard: isKtr ? 'ISO 13050 / KTR CLAMPEX®' : 'ISO 13050 / DIN 7721 / DIN 6885-1'
            }
        ];

        // Pulley 1 Hub or KTR Conical Lock (coaxial along Z)
        if (isKtr && ktr1) {
            parts.push(...createKtr3DParts(basePos, faceW, ktr1, lockDir, 'Tahrik ', hubExt1));
        } else if (hubStyle === 'boss') {
            const hubExtZ = lockDir === 'front' ? -hubW1 / 2 + faceW / 2 : hubW1 / 2 - faceW / 2;
            parts.push({
                id: `pulley1_hub_${Date.now()}`,
                name: `Tahrik Kasnak Göbeği (Ø${hubDia1} mm, Delik Ø${bore1} mm)`,
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

        // Pulley 1 Guide Flanges (Pfeifer / Barbieri Standard)
        if (flangeOpt !== 'none') {
            parts.push(...createGuideFlange3DParts(basePos, faceW, Math.max(bore1, ra1 * 2 - 4), rFlange1 * 2, flangeOpt, 2.0, 'Tahrik '));
        }

        if (mode === 'pair') {
            const pos2 = { x: basePos.x + a, y: basePos.y, z: basePos.z };
            parts.push({
                id: `pulley2_body_${Date.now()}`,
                name: `ISO 13050 Çark Kasnağı (${profKey}, z2=${z2}, da2=${(ra2 * 2).toFixed(1)} mm, a=${a.toFixed(1)} mm, bore=Ø${bore2} mm${isKtr ? ' KTR Konik Kilit' : ' DIN 6885 Kama'})`,
                kind: 'pulley',
                color: '#00e5ff',
                position: pos2,
                rotation: { x: 90, y: 0, z: 0 },
                params: {
                    form: 'timing',
                    teeth: z2,
                    pitch: p,
                    pulleyProfileType: profileType3D,
                    depth: faceW,
                    bore: bore2,
                    hasKeyway: hasKeyway && bore2 > 0,
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
                designStandard: isKtr ? 'ISO 13050 / KTR CLAMPEX®' : 'ISO 13050 / DIN 7721 / DIN 6885-1'
            });

            // Pulley 2 Hub or KTR Conical Lock
            if (isKtr && ktr2) {
                parts.push(...createKtr3DParts(pos2, faceW, ktr2, lockDir, 'Çark ', hubExt2));
            } else if (hubStyle === 'boss') {
                const hubExtZ = lockDir === 'front' ? -hubW2 / 2 + faceW / 2 : hubW2 / 2 - faceW / 2;
                parts.push({
                    id: `pulley2_hub_${Date.now()}`,
                    name: `Çark Kasnak Göbeği (Ø${hubDia2} mm, Delik Ø${bore2} mm)`,
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

            // Pulley 2 Guide Flanges
            if (flangeOpt !== 'none') {
                parts.push(...createGuideFlange3DParts(pos2, faceW, Math.max(bore2, ra2 * 2 - 4), rFlange2 * 2, flangeOpt, 2.0, 'Çark '));
            }
        }

        return parts;
    },
    getGrips: (params, basePoint = { x: 0, y: 0 }) => {
        const profKey = String(params.profileType || 'HTD_5M');
        const prof = PULLEY_PROFILE_OPTIONS[profKey] || PULLEY_PROFILE_OPTIONS['HTD_5M'];
        const z1 = Math.max(12, Math.round(Number(params.teeth) || 24));
        const z2 = Math.max(12, Math.round(Number(params.teeth2) || 48));
        const beltW = Number(params.beltWidth) || 15;
        const mode = String(params.driveMode || 'pair');
        const visState = String(params.visState || 'front_detailed');
        const connection = String(params.shaftConnection || 'keyway_din6885');

        const shaft1 = Math.max(8, Number(params.shaftDiameter || params.boreDiameter || 15));
        const shaft2 = Math.max(8, Number(params.shaftDiameter2 || params.boreDiameter2 || 25));

        const conn1 = resolveShaftConnection(connection, shaft1, 'pulley');
        const conn2 = resolveShaftConnection(connection, shaft2, 'pulley');
        const isKtr = conn1.isKtr;
        const ktr1 = conn1.ktrEntry;
        const ktr2 = conn2.ktrEntry;
        const bore1 = conn1.boreDiameter;
        const bore2 = conn2.boreDiameter;

        const p = prof.pitch;
        const pld = getStandardPld(p, prof.type);
        const r1 = (z1 * p) / (2 * Math.PI);
        const r2 = (z2 * p) / (2 * Math.PI);
        const ra1 = r1 - pld;
        const ra2 = r2 - pld;
        const minA = ra1 + ra2 + Math.max(8, p);
        const a = Math.max(minA, Number(params.centerDistance) || 250);
        const faceW = beltW + 4;

        // Clean layout for Side Section view so arrows don't collide with the pulley body
        if (visState === 'side_section') {
            const grips: DynamicGrip[] = [
                // Stretch grip for Driver Pulley teeth: placed below bottom rim pointing down
                {
                    id: 'grip_pulley_teeth1',
                    type: 'stretch',
                    paramId: 'teeth',
                    position: { x: basePoint.x, y: basePoint.y - ra1 - 10 },
                    direction: { x: 0, y: -1 },
                    tooltip: `Tahrik Kasnak Diş: z1=${z1} (dp1=${(r1 * 2).toFixed(1)} mm)`,
                    tooltipTr: `Tahrik Kasnak Diş: z1=${z1} (dp1=${(r1 * 2).toFixed(1)} mm)`
                },
                // Stretch grip for Belt Width: placed at right face pointing right
                {
                    id: 'grip_pulley_belt_width',
                    type: 'stretch',
                    paramId: 'beltWidth',
                    position: { x: basePoint.x + faceW / 2 + 10, y: basePoint.y },
                    direction: { x: 1, y: 0 },
                    tooltip: `Kayış Genişliği: W=${beltW} mm`,
                    tooltipTr: `Kayış Genişliği: W=${beltW} mm`
                },
                // Stretch grip for Driver Shaft
                {
                    id: 'grip_pulley_shaft1',
                    type: 'stretch',
                    paramId: 'boreDiameter',
                    position: { x: basePoint.x - faceW / 2 - 12, y: basePoint.y + shaft1 / 2 },
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
                    id: 'grip_pulley_vis',
                    type: 'visibility',
                    paramId: 'visState',
                    position: { x: basePoint.x - faceW / 2 - 25, y: basePoint.y - ra1 - 15 },
                    tooltip: 'Görünüş Değiştir (Gerçek Profil / Şematik / Kesit)',
                    tooltipTr: 'Görünüş Değiştir (Gerçek Profil / Şematik / Kesit)'
                }
            ];

            if (mode === 'pair') {
                grips.push(
                    // Stretch grip for Driven Pulley: placed above top rim pointing up
                    {
                        id: 'grip_pulley_teeth2',
                        type: 'stretch',
                        paramId: 'teeth2',
                        position: { x: basePoint.x, y: basePoint.y + a + ra2 + 10 },
                        direction: { x: 0, y: 1 },
                        tooltip: `Çark Kasnak Diş: z2=${z2} (dp2=${(r2 * 2).toFixed(1)} mm)`,
                        tooltipTr: `Çark Kasnak Diş: z2=${z2} (dp2=${(r2 * 2).toFixed(1)} mm)`
                    },
                    // Stretch grip for Driven Shaft
                    {
                        id: 'grip_pulley_shaft2',
                        type: 'stretch',
                        paramId: 'boreDiameter2',
                        position: { x: basePoint.x - faceW / 2 - 12, y: basePoint.y + a + shaft2 / 2 },
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
                        id: 'grip_pulley_center_dist',
                        type: 'stretch',
                        paramId: 'centerDistance',
                        position: { x: basePoint.x - faceW / 2 - 40, y: basePoint.y + a / 2 },
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
            // Linear Stretch Grip on Driver Pulley Pitch Circle (Resizes z1)
            {
                id: 'grip_pulley_teeth',
                type: 'stretch',
                paramId: 'teeth',
                position: { x: basePoint.x + r1, y: basePoint.y },
                direction: { x: 1, y: 0 },
                tooltip: `Tahrik Kasnak Diş Sayısı: z1=${z1} (dp1=${(r1 * 2).toFixed(1)} mm)`,
                tooltipTr: `Tahrik Kasnak Diş Sayısı: z1=${z1} (Bölüm Çapı dp1=${(r1 * 2).toFixed(1)} mm)`
            },
            // Linear Stretch Grip on Driver Bore
            {
                id: 'grip_pulley_bore',
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
                id: 'grip_pulley_vis',
                type: 'visibility',
                paramId: 'visState',
                position: { x: basePoint.x - r1 - 15, y: basePoint.y - r1 - 15 },
                tooltip: 'Görünüş Değiştir (Gerçek Profil / Şematik / Kesit)',
                tooltipTr: 'Görünüş Değiştir (Gerçek Profil / Şematik / Kesit)'
            }
        ];

        if (mode === 'pair') {
            grips.push(
                // Linear Stretch Grip on Driven Pulley Pitch Circle (Resizes z2)
                {
                    id: 'grip_pulley_teeth2',
                    type: 'stretch',
                    paramId: 'teeth2',
                    position: { x: basePoint.x + a + r2, y: basePoint.y },
                    direction: { x: 1, y: 0 },
                    tooltip: `Çark Kasnak Diş Sayısı: z2=${z2} (dp2=${(r2 * 2).toFixed(1)} mm)`,
                    tooltipTr: `Çark Kasnak Diş Sayısı: z2=${z2} (Bölüm Çapı dp2=${(r2 * 2).toFixed(1)} mm)`
                },
                // Linear Stretch Grip on Driven Bore
                {
                    id: 'grip_pulley_bore2',
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
                    id: 'grip_pulley_center_dist',
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
