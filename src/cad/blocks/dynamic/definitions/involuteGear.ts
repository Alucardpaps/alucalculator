/**
 * ⚙️ Dynamic Involute Gear Block (ISO 53 / DIN 867 / DIN 3960 / ISO 21771 / DIN 6885-1 / KTR CLAMPEX®)
 * 
 * Powered by AluCalc OS True Involute Math Engine:
 * - Mathematical involute curve generation: inv(α) = tan(α) - α
 * - Profile shift coefficients (x1, x2) & working center distance (a_w) integration
 * - Helix angle (β) with conjugate RH/LH external mesh mating
 * - Tip/crest shortening factor (k) per DIN 3960 / Workshop formula: da = d + 2m(1 + x + k)
 * - Single gear (Tekli) & Meshed gear pair (2'li Kavrama Çifti) variations
 * - Shaft-Hub Connections:
 *     1. DIN 6885-1 parallel keyway and true through-bore
 *     2. KTR CLAMPEX® conical clamping sets (KTR 100, KTR 200/201, KTR 250, KTR 400)
 *        per KTR Drive Technology Catalogue Pages 294–316
 * - Clean 3D parametric solid generation with genuine hollow bores (no solid cylinder plugging)
 * - Interactive pitch radius stretch grips for live tooth count adjustment
 * - Projections: Front Detailed (True Involute Cut), Front Schematic, Side Section
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
    calculateInvoluteGearSpecs,
    generateExternalGearContour,
    generateBoreAndKeywayContour,
    getDin6885Keyway
} from '../../../../engines/math/gear-involute-factory';
import { computeTipShorteningData } from '../../../../engines/math/gearSynthesisEngine';
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

export const DYN_INVOLUTE_GEAR: DynamicBlockDef = {
    id: 'dyn_involute_gear',
    name: 'Dynamic Involute Gear (Single / Meshed Pair) (ISO 53 / DIN 3960 / KTR CLAMPEX®)',
    nameTr: 'Dinamik Evolvent Dişli (Tekli / 2\'li Kavrama Çifti / KTR Konik Kilit) (ISO 53 / DIN 3960)',
    category: 'Mechanical',
    subcategory: 'Gears & Power Transmission',
    subcategoryTr: 'Dişliler ve Güç Aktarımı',
    description: 'AutoCAD-grade dynamic involute gear: x1/x2 profile shift, helix angle, crest shortening (k), DIN 6885 keyway or KTR CLAMPEX® conical locking sets (KTR 100/200/250/400).',
    descriptionTr: 'x1/x2 profil kaydırma, helis açısı, kafa kısaltma (k), DIN 6885 kamalı mil veya KTR CLAMPEX® konik kilitli (KTR 100/200/250/400) tam eksen mesafeli evolvent dişli.',
    icon: '⚙️',
    calculatorRoute: '/gears',
    calculatorModuleType: 'gears-bearings',
    calculatorLabelTr: '⚙️ Dişli Mukavemet & KTR Kilit Hesabı (ISO 6336)',
    citation: {
        tier: 1,
        standard: 'ISO 53:1998 / DIN 867 / DIN 3960 / ISO 21771 / DIN 6885-1 / KTR CLAMPEX®',
        clause: 'ISO 53 Clause 4, DIN 3960 Section 3, ISO 21771, DIN 6885-1, KTR Drive Technology Pages 294–316',
        description: 'Standard module system mn, 20° pressure angle, x1/x2 modifications, helix β, DIN 6885 keyway or KTR CLAMPEX® internal clamping sets.'
    },
    linearParams: [
        {
            id: 'teeth',
            name: 'teeth',
            label: 'Pinion Teeth (z1)',
            labelTr: 'Pinyon Diş Sayısı (z1)',
            min: 8,
            max: 150,
            step: 1,
            default: 20,
            unit: 'teeth',
            axis: 'x'
        },
        {
            id: 'teeth2',
            name: 'teeth2',
            label: 'Driven Gear Teeth (z2)',
            labelTr: 'Çark Diş Sayısı (z2)',
            min: 8,
            max: 200,
            step: 1,
            default: 60,
            unit: 'teeth',
            axis: 'x'
        },
        {
            id: 'faceWidth',
            name: 'faceWidth',
            label: 'Face Width (b)',
            labelTr: 'Diş Genişliği (b)',
            min: 5,
            max: 200,
            step: 5,
            default: 40,
            unit: 'mm',
            axis: 'x'
        },
        {
            id: 'helixAngle',
            name: 'helixAngle',
            label: 'Helix Angle (β)',
            labelTr: 'Helis Açısı (β)',
            min: 0,
            max: 45,
            step: 1,
            default: 0,
            unit: '°',
            axis: 'x'
        },
        {
            id: 'profileShift',
            name: 'profileShift',
            label: 'Pinion Shift (x1)',
            labelTr: 'Pinyon Profil Kaydırma (x1)',
            min: -0.8,
            max: 0.8,
            step: 0.05,
            default: 0,
            unit: '',
            axis: 'x'
        },
        {
            id: 'profileShift2',
            name: 'profileShift2',
            label: 'Gear Shift (x2)',
            labelTr: 'Çark Profil Kaydırma (x2)',
            min: -0.8,
            max: 0.8,
            step: 0.05,
            default: 0,
            unit: '',
            axis: 'x'
        },
        {
            id: 'kFactor',
            name: 'kFactor',
            label: 'Crest Shortening Factor (k)',
            labelTr: 'Kafa Kısaltma Faktörü (k)',
            min: -1.0,
            max: 1.0,
            step: 0.05,
            default: 0,
            unit: '',
            axis: 'x'
        },
        {
            id: 'shaftDiameter',
            name: 'shaftDiameter',
            label: 'Pinion Shaft Dia (d1)',
            labelTr: 'Pinyon Mil Çapı (d1)',
            min: 10,
            max: 120,
            step: 1,
            default: 20,
            unit: 'mm',
            axis: 'y'
        },
        {
            id: 'shaftDiameter2',
            name: 'shaftDiameter2',
            label: 'Gear Shaft Dia (d2)',
            labelTr: 'Çark Mil Çapı (d2)',
            min: 10,
            max: 160,
            step: 1,
            default: 35,
            unit: 'mm',
            axis: 'y'
        },
        {
            id: 'boreDiameter',
            name: 'boreDiameter',
            label: 'Pinion Hub Bore (D_bore1)',
            labelTr: 'Pinyon Göbek Deliği (D_delik1)',
            min: 0,
            max: 140,
            step: 1,
            default: 20,
            unit: 'mm',
            axis: 'y'
        },
        {
            id: 'boreDiameter2',
            name: 'boreDiameter2',
            label: 'Gear Hub Bore (D_bore2)',
            labelTr: 'Çark Göbek Deliği (D_delik2)',
            min: 0,
            max: 180,
            step: 1,
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
            { id: 'front_detailed', label: 'Front Detailed (Evolvent Profil & Kama/Konik Kilit Kesimi)', labelTr: 'Ön Detaylı (Gerçek Diş Profili & Bağlantı)' },
            { id: 'front_schematic', label: 'Front Schematic (ISO 2203 Teknik Resim Bölüm Daireleri)', labelTr: 'Ön Şematik (ISO 2203 Bölüm Daireleri)' },
            { id: 'side_section', label: 'Side Section (ISO 128 Gövde & Göbek Kesiti)', labelTr: 'Yan Kesit (ISO 128 Gövde & Göbek)' }
        ],
        default: 'front_detailed'
    },
    lookupParams: [
        {
            id: 'gearMode',
            name: 'gearMode',
            label: 'Mesh Connection Type',
            labelTr: 'Dişli Varyasyonu / Kavrama Tipi',
            options: [
                { id: 'pair', label: '2\'li Dişli Çifti / Kavrama (External Gear Pair)', values: { gearMode: 'pair' } },
                { id: 'single', label: 'Tekli Dişli (Single Gear)', values: { gearMode: 'single' } }
            ],
            default: 'pair'
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
                { id: 'none', label: 'Flanşsız (No Flanges)', values: { flangeOption: 'none' } },
                { id: 'both', label: 'Çift Taraflı Kılavuz Flanş (Double Flanges)', values: { flangeOption: 'both' } },
                { id: 'front', label: 'Tek Taraflı Ön Flanş (Front Flange Only)', values: { flangeOption: 'front' } },
                { id: 'back', label: 'Tek Taraflı Arka Flanş (Back Flange Only)', values: { flangeOption: 'back' } }
            ],
            default: 'none'
        },
        {
            id: 'sideSectionMode',
            name: 'sideSectionMode',
            label: 'Side Section View Mode',
            labelTr: 'Yan Kesit Görünüm Tipi',
            options: [
                { id: 'meshing', label: 'Kavramalı Montaj Kesiti (ISO 2203 Parallel Meshed Shafts)', values: { sideSectionMode: 'meshing' } },
                { id: 'separated', label: 'Ayrık Parça İmalat Kesiti (Separated Single Gears)', values: { sideSectionMode: 'separated' } }
            ],
            default: 'meshing'
        },
        {
            id: 'hubStyle',
            name: 'hubStyle',
            label: 'Hub Boss Style',
            labelTr: 'Göbek Yapısı',
            options: [
                { id: 'flush', label: 'Düz Alınlı Göbeksiz (Flush Plain Gear)', values: { hubStyle: 'flush' } },
                { id: 'boss', label: 'Faturalı Göbek Çıkıntılı (Hub Boss / Collar)', values: { hubStyle: 'boss' } },
            ],
            default: 'boss'
        },
        {
            id: 'module',
            name: 'module',
            label: 'Standard Metric Module (mn)',
            labelTr: 'Standart Metrik Modül (mn)',
            options: [
                { id: 'm1_0', label: 'Modül 1.0 mm', values: { module: 1.0 } },
                { id: 'm1_5', label: 'Modül 1.5 mm', values: { module: 1.5 } },
                { id: 'm2_0', label: 'Modül 2.0 mm (Standart)', values: { module: 2.0 } },
                { id: 'm2_5', label: 'Modül 2.5 mm', values: { module: 2.5 } },
                { id: 'm3_0', label: 'Modül 3.0 mm', values: { module: 3.0 } },
                { id: 'm4_0', label: 'Modül 4.0 mm', values: { module: 4.0 } },
                { id: 'm5_0', label: 'Modül 5.0 mm', values: { module: 5.0 } },
                { id: 'm6_0', label: 'Modül 6.0 mm', values: { module: 6.0 } },
                { id: 'm8_0', label: 'Modül 8.0 mm', values: { module: 8.0 } },
                { id: 'm10_0', label: 'Modül 10.0 mm', values: { module: 10.0 } }
            ],
            default: 'm3_0'
        },
        {
            id: 'pressureAngle',
            name: 'pressureAngle',
            label: 'Pressure Angle (αn)',
            labelTr: 'Kavrama Açısı (αn)',
            options: [
                { id: 'pa_20', label: '20° (ISO 53 Standart)', values: { pressureAngle: 20 } },
                { id: 'pa_14_5', label: '14.5° (Klasik ASME/AGMA)', values: { pressureAngle: 14.5 } },
                { id: 'pa_25', label: '25° (Ağır Yük Dişlisi)', values: { pressureAngle: 25 } }
            ],
            default: 'pa_20'
        }
    ],
    defaultValues: {
        gearMode: 'pair',
        shaftConnection: 'ktr_auto',
        lockDirection: 'front',
        flangeOption: 'none',
        sideSectionMode: 'meshing',
        hubStyle: 'boss',
        module: 3.0,
        teeth: 20,
        teeth2: 60,
        pressureAngle: 20,
        helixAngle: 0,
        profileShift: 0,
        profileShift2: 0,
        kFactor: 0,
        shaftDiameter: 20,
        shaftDiameter2: 35,
        boreDiameter: 20,
        boreDiameter2: 35,
        faceWidth: 40,
        visState: 'front_detailed'
    },
    generate2D: (params, basePoint = { x: 0, y: 0 }) => {
        const m = Number(params.module) || 3.0;
        const z1 = Math.max(6, Math.round(Number(params.teeth) || 20));
        const z2 = Math.max(6, Math.round(Number(params.teeth2) || 60));
        const alpha = Number(params.pressureAngle) || 20;
        const beta = Number(params.helixAngle) || 0;
        const x1 = Number(params.profileShift) || 0;
        const x2 = Number(params.profileShift2) || 0;
        const k = Number(params.kFactor) || 0;
        const faceW = Number(params.faceWidth) || 40;
        const state = String(params.visState || 'front_detailed');
        const mode = String(params.gearMode || 'pair');
        const connection = String(params.shaftConnection || 'keyway_din6885');

        const shaft1 = Math.max(8, Number(params.shaftDiameter || params.boreDiameter || 20));
        const shaft2 = Math.max(8, Number(params.shaftDiameter2 || params.boreDiameter2 || 35));

        const conn1 = resolveShaftConnection(connection, shaft1, 'gear');
        const conn2 = resolveShaftConnection(connection, shaft2, 'gear');

        const isKtr = conn1.isKtr;
        const ktr1 = conn1.ktrEntry;
        const ktr2 = conn2.ktrEntry;
        const bore1 = conn1.boreDiameter;
        const bore2 = conn2.boreDiameter;
        const hasKeyway = conn1.hasKeyway;

        const entities: CadEntity[] = [];
        const layer = 'layer-mech';
        const colorTeeth = '#3ad0e6';      // Cyan gear rim
        const colorPitch = '#22c55e';      // Green pitch circle (ISO standard)
        const colorCenter = '#ef4444';     // Red centerline
        const colorBore = '#38bdf8';       // Sky blue bore
        const colorRef = '#64748b';        // Muted gray reference circles
        const colorDim = '#f59e0b';        // Amber dimension callouts

        // Compute exact DIN 3960 / ISO 21771 center distance and diameters
        const tipData = computeTipShorteningData({
            mn: m,
            z1,
            z2,
            betaDeg: beta,
            alphaDeg: alpha,
            x1,
            x2,
            kMode: 'workshop',
            customK: k
        });

        const aw = tipData.a_wt;
        const cosBeta = Math.max(0.01, Math.cos((beta * Math.PI) / 180));
        const mt = m / cosBeta;

        // Pitch and tip radii
        const r1 = (z1 * mt) / 2;
        const r2 = (z2 * mt) / 2;
        const rw1 = (aw * z1) / (z1 + z2);
        const rw2 = (aw * z2) / (z1 + z2);
        const ra1 = tipData.da1 / 2;
        const ra2 = tipData.da2 / 2;
        const rf1 = (z1 * mt) / 2 - m * (1.25 - x1);
        const rf2 = (z2 * mt) / 2 - m * (1.25 - x2);

        // Center points
        const O1 = { x: basePoint.x, y: basePoint.y };
        const O2 = { x: basePoint.x + aw, y: basePoint.y };

        // Pinion specs
        const specs1 = calculateInvoluteGearSpecs({
            module: m,
            teeth: z1,
            pressureAngle: alpha,
            helixAngle: beta,
            profileShift: x1,
            kFactor: k,
            boreDiameter: bore1,
            hasKeyway: hasKeyway && bore1 > 0
        });

        // Driven gear specs
        const specs2 = calculateInvoluteGearSpecs({
            module: m,
            teeth: z2,
            pressureAngle: alpha,
            helixAngle: -beta, // Opposite hand of helix for conjugate external mesh
            profileShift: x2,
            kFactor: k,
            boreDiameter: bore2,
            hasKeyway: hasKeyway && bore2 > 0
        });

        const lockDir = (params.lockDirection || 'front') as 'front' | 'back';
        const flangeOpt = (params.flangeOption || 'none') as 'none' | 'both' | 'front' | 'back';
        const sideSecMode = (params.sideSectionMode || 'meshing') as 'meshing' | 'separated';
        const hubStyle = String(params.hubStyle || 'boss');

        // ═══════════════════════════════════════════════════════════════
        // 1. FRONT DETAILED VIEW (True Involute Cut)
        // ═══════════════════════════════════════════════════════════════
        if (state === 'front_detailed') {
            // Optional Guide Flange Circle (Pfeifer / Barbieri standard)
            if (flangeOpt !== 'none') {
                const rFlange1 = ra1 + Math.max(3.5, 1.5 * m);
                entities.push(createCircleEntity(O1, rFlange1, layer, '#f59e0b'));
            }

            // --- PINION (Gear 1) ---
            const contour1 = generateExternalGearContour({
                module: m,
                teeth: z1,
                pressureAngle: alpha,
                helixAngle: beta,
                profileShift: x1,
                kFactor: k,
                center: O1,
                rotationAngle: 0,
                pointsPerFlank: 8
            });

            if (contour1.length > 2) {
                entities.push(createPolylineEntity(contour1, true, layer, colorTeeth));
            }

            // Pinion operating pitch circle
            entities.push(createCircleEntity(O1, mode === 'pair' ? rw1 : r1, layer, colorPitch));

            // Pinion bore connection
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

            // Pinion center cross
            const cLen1 = ra1 + 8;
            entities.push(createLineEntity({ x: O1.x - cLen1, y: O1.y }, { x: O1.x + cLen1, y: O1.y }, layer, colorCenter));
            entities.push(createLineEntity({ x: O1.x, y: O1.y - cLen1 }, { x: O1.x, y: O1.y + cLen1 }, layer, colorCenter));

            // --- DRIVEN GEAR (Gear 2) in Pair Mode ---
            if (mode === 'pair') {
                if (flangeOpt !== 'none') {
                    const rFlange2 = ra2 + Math.max(3.5, 1.5 * m);
                    entities.push(createCircleEntity(O2, rFlange2, layer, '#f59e0b'));
                }

                // Conjugate mesh rotation angle: 180° + half pitch angle (180° / z2) so teeth interlock cleanly
                const rot2Deg = 180 + 180 / z2;
                const contour2 = generateExternalGearContour({
                    module: m,
                    teeth: z2,
                    pressureAngle: alpha,
                    helixAngle: -beta, // Opposite helix hand for external conjugate mesh
                    profileShift: x2,
                    kFactor: k,
                    center: O2,
                    rotationAngle: rot2Deg,
                    pointsPerFlank: 8
                });

                if (contour2.length > 2) {
                    entities.push(createPolylineEntity(contour2, true, layer, colorTeeth));
                }

                // Driven gear operating pitch circle
                entities.push(createCircleEntity(O2, rw2, layer, colorPitch));

                // Driven gear bore connection
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

                // Driven gear center cross
                const cLen2 = ra2 + 8;
                entities.push(createLineEntity({ x: O2.x - cLen2, y: O2.y }, { x: O2.x + cLen2, y: O2.y }, layer, colorCenter));
                entities.push(createLineEntity({ x: O2.x, y: O2.y - cLen2 }, { x: O2.x, y: O2.y + cLen2 }, layer, colorCenter));

                // Connecting Centerline between O1 and O2
                entities.push(createLineEntity(
                    { x: O1.x - cLen1, y: O1.y },
                    { x: O2.x + cLen2, y: O2.y },
                    layer,
                    colorCenter
                ));

                // Center Distance (aw) Technical Dimension Callout
                const dimY = O1.y - Math.max(ra1, ra2) - 18;
                entities.push(createLineEntity({ x: O1.x, y: O1.y - ra1 - 5 }, { x: O1.x, y: dimY - 4 }, layer, colorRef));
                entities.push(createLineEntity({ x: O2.x, y: O2.y - ra2 - 5 }, { x: O2.x, y: dimY - 4 }, layer, colorRef));
                entities.push(createLineEntity({ x: O1.x, y: dimY }, { x: O2.x, y: dimY }, layer, colorDim));
                entities.push(createLineEntity({ x: O1.x - 3, y: dimY - 3 }, { x: O1.x + 3, y: dimY + 3 }, layer, colorDim));
                entities.push(createLineEntity({ x: O2.x - 3, y: dimY - 3 }, { x: O2.x + 3, y: dimY + 3 }, layer, colorDim));
            }

            return entities;
        }

        // ═══════════════════════════════════════════════════════════════
        // 2. FRONT SCHEMATIC VIEW (Technical Drawing Standard Circles - ISO 2203)
        // ═══════════════════════════════════════════════════════════════
        if (state === 'front_schematic') {
            if (flangeOpt !== 'none') {
                const rFlange1 = ra1 + Math.max(3.5, 1.5 * m);
                entities.push(createCircleEntity(O1, rFlange1, layer, '#f59e0b'));
            }

            // Pinion schematic circles: Tip (solid), Pitch (dash-dot), Root (thin)
            entities.push(createCircleEntity(O1, ra1, layer, colorTeeth));
            entities.push(createCircleEntity(O1, mode === 'pair' ? rw1 : r1, layer, colorPitch));
            entities.push(createCircleEntity(O1, Math.max(bore1 / 2 + 3, rf1), layer, colorRef));

            if (isKtr && ktr1) {
                drawKtrClamping2DFront(entities, O1, ktr1, layer);
            } else if (hasKeyway && bore1 > 0) {
                const boreContour1 = generateBoreAndKeywayContour(O1, bore1, true, specs1.keyway);
                if (boreContour1.length > 2) entities.push(createPolylineEntity(boreContour1, true, layer, colorBore));
            } else if (bore1 > 0) {
                entities.push(createCircleEntity(O1, bore1 / 2, layer, colorBore));
            }

            const cLen1 = ra1 + 10;
            entities.push(createLineEntity({ x: O1.x - cLen1, y: O1.y }, { x: O1.x + cLen1, y: O1.y }, layer, colorCenter));
            entities.push(createLineEntity({ x: O1.x, y: O1.y - cLen1 }, { x: O1.x, y: O1.y + cLen1 }, layer, colorCenter));

            if (mode === 'pair') {
                if (flangeOpt !== 'none') {
                    const rFlange2 = ra2 + Math.max(3.5, 1.5 * m);
                    entities.push(createCircleEntity(O2, rFlange2, layer, '#f59e0b'));
                }

                // Driven gear schematic circles: Tip, Pitch, Root
                entities.push(createCircleEntity(O2, ra2, layer, colorTeeth));
                entities.push(createCircleEntity(O2, rw2, layer, colorPitch));
                entities.push(createCircleEntity(O2, Math.max(bore2 / 2 + 3, rf2), layer, colorRef));

                if (isKtr && ktr2) {
                    drawKtrClamping2DFront(entities, O2, ktr2, layer);
                } else if (hasKeyway && bore2 > 0) {
                    const boreContour2 = generateBoreAndKeywayContour(O2, bore2, true, specs2.keyway);
                    if (boreContour2.length > 2) entities.push(createPolylineEntity(boreContour2, true, layer, colorBore));
                } else if (bore2 > 0) {
                    entities.push(createCircleEntity(O2, bore2 / 2, layer, colorBore));
                }

                const cLen2 = ra2 + 10;
                entities.push(createLineEntity({ x: O2.x - cLen2, y: O2.y }, { x: O2.x + cLen2, y: O2.y }, layer, colorCenter));
                entities.push(createLineEntity({ x: O2.x, y: O2.y - cLen2 }, { x: O2.x, y: O2.y + cLen2 }, layer, colorCenter));

                // Connecting centerline
                entities.push(createLineEntity({ x: O1.x - cLen1, y: O1.y }, { x: O2.x + cLen2, y: O2.y }, layer, colorCenter));

                // Dimension callout for aw
                const dimY = O1.y - Math.max(ra1, ra2) - 18;
                entities.push(createLineEntity({ x: O1.x, y: O1.y - ra1 - 5 }, { x: O1.x, y: dimY - 4 }, layer, colorRef));
                entities.push(createLineEntity({ x: O2.x, y: O2.y - ra2 - 5 }, { x: O2.x, y: dimY - 4 }, layer, colorRef));
                entities.push(createLineEntity({ x: O1.x, y: dimY }, { x: O2.x, y: dimY }, layer, colorDim));
                entities.push(createLineEntity({ x: O1.x - 3, y: dimY - 3 }, { x: O1.x + 3, y: dimY + 3 }, layer, colorDim));
                entities.push(createLineEntity({ x: O2.x - 3, y: dimY - 3 }, { x: O2.x + 3, y: dimY + 3 }, layer, colorDim));
            }

            return entities;
        }

        // ═══════════════════════════════════════════════════════════════
        // 3. SIDE SECTION VIEW (ISO 128 / ISO 2203 Technical Drawing)
        // ═══════════════════════════════════════════════════════════════
        if (state === 'side_section') {
            const rFlange1 = ra1 + Math.max(3.5, 1.5 * m);
            const rFlange2 = ra2 + Math.max(3.5, 1.5 * m);

            // Helper to draw a single complete gear section
            const drawSingleGearSection = (
                center: Point,
                ra: number,
                rp: number,
                rf: number,
                rFlange: number,
                conn: ReturnType<typeof resolveShaftConnection>,
                hatchAngle: 45 | -45 = 45,
                hatchColor = '#0284c7'
            ) => {
                const rHub = Math.max(conn.minHubDiameter / 2, conn.boreDiameter * 0.75, 16);
                const bw = Math.max(8, faceW * 0.38);
                const rRim = Math.max(rf - Math.max(2.2 * m, 6), rHub + 4);

                // Hub solid, stepped counterbore, KTR sleeve / keyway, solid shaft lines & red centerline
                drawShaftHubConnectionSection({
                    entities,
                    center,
                    faceW,
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
                    drawHatchedRect(entities, center.x - bw / 2, center.x + bw / 2, center.y + rHub, center.y + rRim, hatchAngle, 3.5, colorTeeth, hatchColor, layer);
                    drawHatchedRect(entities, center.x - bw / 2, center.x + bw / 2, center.y - rRim, center.y - rHub, hatchAngle, 3.5, colorTeeth, hatchColor, layer);
                }

                // Upper & lower tooth rim solid
                drawHatchedRect(entities, center.x - faceW / 2, center.x + faceW / 2, center.y + rRim, center.y + ra, hatchAngle, 3.5, colorTeeth, hatchColor, layer);
                drawHatchedRect(entities, center.x - faceW / 2, center.x + faceW / 2, center.y - ra, center.y - rRim, hatchAngle, 3.5, colorTeeth, hatchColor, layer);

                // Root lines & Pitch centerlines
                entities.push(createLineEntity({ x: center.x - faceW / 2, y: center.y + rf }, { x: center.x + faceW / 2, y: center.y + rf }, layer, colorRef));
                entities.push(createLineEntity({ x: center.x - faceW / 2, y: center.y - rf }, { x: center.x + faceW / 2, y: center.y - rf }, layer, colorRef));
                entities.push(createLineEntity({ x: center.x - faceW / 2 - 6, y: center.y + rp }, { x: center.x + faceW / 2 + 6, y: center.y + rp }, layer, colorPitch));
                entities.push(createLineEntity({ x: center.x - faceW / 2 - 6, y: center.y - rp }, { x: center.x + faceW / 2 + 6, y: center.y - rp }, layer, colorPitch));

                // Guide Flanges (Pfeifer / Barbieri Standard)
                if (flangeOpt === 'both' || flangeOpt === 'front') {
                    drawGuideFlange2DSection(entities, center, center.x + faceW / 2, 'front', ra, rFlange, 2.0, 15, layer);
                }
                if (flangeOpt === 'both' || flangeOpt === 'back') {
                    drawGuideFlange2DSection(entities, center, center.x - faceW / 2, 'back', ra, rFlange, 2.0, 15, layer);
                }
            };

            if (mode === 'pair' && sideSecMode === 'meshing') {
                // ── MESHING PAIR (ISO 2203 / ISO 128) ──
                // Shaft 1 (Pinion) at y = O1.y; Shaft 2 (Wheel) at y = O1.y + aw
                const y1 = O1.y;
                const y2 = O1.y + aw;
                const x0 = O1.x;

                const rHub1 = Math.max(conn1.minHubDiameter / 2, conn1.boreDiameter * 0.75, 16);
                const bw1 = Math.max(8, faceW * 0.38);
                const rRim1 = Math.max(rf1 - Math.max(2.2 * m, 6), rHub1 + 4);

                const rHub2 = Math.max(conn2.minHubDiameter / 2, conn2.boreDiameter * 0.75, 18);
                const bw2 = Math.max(8, faceW * 0.38);
                const rRim2 = Math.max(rf2 - Math.max(2.2 * m, 6), rHub2 + 4);

                // --- SHAFT & HUB CONNECTION SECTIONS (PINION & WHEEL) ---
                const h1 = drawShaftHubConnectionSection({
                    entities,
                    center: { x: x0, y: y1 },
                    faceW,
                    rHub: rHub1,
                    connection: conn1,
                    lockDirection: lockDir,
                    hubStyle: hubStyle as 'boss' | 'flush',
                    hatchAngle: 45,
                    contourColor: colorTeeth,
                    hatchColor: '#0284c7',
                    layer
                });

                const h2 = drawShaftHubConnectionSection({
                    entities,
                    center: { x: x0, y: y2 },
                    faceW,
                    rHub: rHub2,
                    connection: conn2,
                    lockDirection: lockDir,
                    hubStyle: hubStyle as 'boss' | 'flush',
                    hatchAngle: -45,
                    contourColor: colorTeeth,
                    hatchColor: '#059669',
                    layer
                });

                // --- GEAR 1 (PINION) BODY ---
                // Web
                if (rRim1 > rHub1 + 2) {
                    drawHatchedRect(entities, x0 - bw1 / 2, x0 + bw1 / 2, y1 + rHub1, y1 + rRim1, 45, 3.5, colorTeeth, '#0284c7', layer);
                    drawHatchedRect(entities, x0 - bw1 / 2, x0 + bw1 / 2, y1 - rRim1, y1 - rHub1, 45, 3.5, colorTeeth, '#0284c7', layer);
                }

                // Lower rim and tooth
                drawHatchedRect(entities, x0 - faceW / 2, x0 + faceW / 2, y1 - ra1, y1 - rRim1, 45, 3.5, colorTeeth, '#0284c7', layer);
                entities.push(createLineEntity({ x: x0 - faceW / 2, y: y1 - rf1 }, { x: x0 + faceW / 2, y: y1 - rf1 }, layer, colorRef));
                entities.push(createLineEntity({ x: x0 - faceW / 2 - 6, y: y1 - rw1 }, { x: x0 + faceW / 2 + 6, y: y1 - rw1 }, layer, colorPitch));

                // Upper rim solid
                drawHatchedRect(entities, x0 - faceW / 2, x0 + faceW / 2, y1 + rRim1, y1 + rf1, 45, 3.5, colorTeeth, '#0284c7', layer);

                // --- GEAR 2 (DRIVEN WHEEL) BODY ---
                // Web
                if (rRim2 > rHub2 + 2) {
                    drawHatchedRect(entities, x0 - bw2 / 2, x0 + bw2 / 2, y2 + rHub2, y2 + rRim2, -45, 3.5, colorTeeth, '#059669', layer);
                    drawHatchedRect(entities, x0 - bw2 / 2, x0 + bw2 / 2, y2 - rRim2, y2 - rHub2, -45, 3.5, colorTeeth, '#059669', layer);
                }

                // Upper rim and tooth
                drawHatchedRect(entities, x0 - faceW / 2, x0 + faceW / 2, y2 + rRim2, y2 + ra2, -45, 3.5, colorTeeth, '#059669', layer);
                entities.push(createLineEntity({ x: x0 - faceW / 2, y: y2 + rf2 }, { x: x0 + faceW / 2, y: y2 + rf2 }, layer, colorRef));
                entities.push(createLineEntity({ x: x0 - faceW / 2 - 6, y: y2 + rw2 }, { x: x0 + faceW / 2 + 6, y: y2 + rw2 }, layer, colorPitch));

                // Lower rim solid
                drawHatchedRect(entities, x0 - faceW / 2, x0 + faceW / 2, y2 - rf2, y2 - rRim2, -45, 3.5, colorTeeth, '#059669', layer);

                // ── MESHING ZONE (ISO 2203 CONVENTIONAL REPRESENTATION) ──
                // Pinion driver tooth solid hatched up to y1 + ra1
                drawHatchedRect(entities, x0 - faceW / 2, x0 + faceW / 2, y1 + rf1, y1 + ra1, 45, 3.5, colorTeeth, '#0284c7', layer);
                // ISO 2203: Driver tooth crest is SOLID line; driven tooth crest is DASHED line
                entities.push(createLineEntity({ x: x0 - faceW / 2, y: y1 + ra1 }, { x: x0 + faceW / 2, y: y1 + ra1 }, layer, colorTeeth));

                // Driven tooth dashed tip line (4mm segments, 2mm gaps)
                const dSeg = 4;
                const dGap = 2;
                for (let sx = x0 - faceW / 2; sx < x0 + faceW / 2; sx += dSeg + dGap) {
                    const ex = Math.min(sx + dSeg, x0 + faceW / 2);
                    entities.push(createLineEntity({ x: sx, y: y2 - ra2 }, { x: ex, y: y2 - ra2 }, layer, colorRef));
                }

                // Operating Pitch Line (touches at y1 + rw1 == y2 - rw2)
                const pitchY = y1 + rw1;
                entities.push(createLineEntity({ x: x0 - faceW / 2 - 12, y: pitchY }, { x: x0 + faceW / 2 + 12, y: pitchY }, layer, colorPitch));

                // Guide Flanges if enabled (WITH EXACT CENTER OFFSETS)
                if (flangeOpt === 'both' || flangeOpt === 'front') {
                    drawGuideFlange2DSection(entities, { x: x0, y: y1 }, x0 + faceW / 2, 'front', ra1, rFlange1, 2.0, 15, layer);
                    drawGuideFlange2DSection(entities, { x: x0, y: y2 }, x0 + faceW / 2, 'front', ra2, rFlange2, 2.0, 15, layer);
                }
                if (flangeOpt === 'both' || flangeOpt === 'back') {
                    drawGuideFlange2DSection(entities, { x: x0, y: y1 }, x0 - faceW / 2, 'back', ra1, rFlange1, 2.0, 15, layer);
                    drawGuideFlange2DSection(entities, { x: x0, y: y2 }, x0 - faceW / 2, 'back', ra2, rFlange2, 2.0, 15, layer);
                }

                // Center Distance (aw) Dimension Line
                const xMinAll = Math.min(h1.xHubMin, h2.xHubMin) - 18;
                const dimX = xMinAll - 12;
                entities.push(createLineEntity({ x: xMinAll, y: y1 }, { x: dimX - 4, y: y1 }, layer, colorRef));
                entities.push(createLineEntity({ x: xMinAll, y: y2 }, { x: dimX - 4, y: y2 }, layer, colorRef));
                entities.push(createLineEntity({ x: dimX, y: y1 }, { x: dimX, y: y2 }, layer, colorDim));
                // Ticks
                entities.push(createLineEntity({ x: dimX - 3, y: y1 - 3 }, { x: dimX + 3, y: y1 + 3 }, layer, colorDim));
                entities.push(createLineEntity({ x: dimX - 3, y: y2 - 3 }, { x: dimX + 3, y: y2 + 3 }, layer, colorDim));
            } else if (mode === 'pair' && sideSecMode === 'separated') {
                // Separated side-by-side
                drawSingleGearSection(O1, ra1, mode === 'pair' ? rw1 : r1, rf1, rFlange1, conn1, 45, '#0284c7');
                const secSpacing = Math.max(ra1 + ra2 + 40, faceW + 80);
                drawSingleGearSection({ x: O1.x + secSpacing, y: O1.y }, ra2, rw2, rf2, rFlange2, conn2, -45, '#059669');
            } else {
                // Single gear mode
                drawSingleGearSection(O1, ra1, r1, rf1, rFlange1, conn1, 45, '#0284c7');
            }

            return entities;
        }

        return entities;
    },
    generate3D: (params, basePos = { x: 0, y: 0, z: 0 }) => {
        const m = Number(params.module) || 3.0;
        const z1 = Math.max(6, Math.round(Number(params.teeth) || 20));
        const z2 = Math.max(6, Math.round(Number(params.teeth2) || 60));
        const alpha = Number(params.pressureAngle) || 20;
        const beta = Number(params.helixAngle) || 0;
        const x1 = Number(params.profileShift) || 0;
        const x2 = Number(params.profileShift2) || 0;
        const k = Number(params.kFactor) || 0;
        const faceW = Number(params.faceWidth) || 40;
        const mode = String(params.gearMode || 'pair');
        const connection = String(params.shaftConnection || 'keyway_din6885');
        const hubStyle = String(params.hubStyle || 'boss');
        const lockDir = (params.lockDirection || 'front') as 'front' | 'back';
        const flangeOpt = (params.flangeOption || 'none') as 'none' | 'both' | 'front' | 'back';

        const shaft1 = Math.max(8, Number(params.shaftDiameter || params.boreDiameter || 20));
        const shaft2 = Math.max(8, Number(params.shaftDiameter2 || params.boreDiameter2 || 35));

        const conn1 = resolveShaftConnection(connection, shaft1, 'gear');
        const conn2 = resolveShaftConnection(connection, shaft2, 'gear');

        const isKtr = conn1.isKtr;
        const ktr1 = conn1.ktrEntry;
        const ktr2 = conn2.ktrEntry;
        const bore1 = conn1.boreDiameter;
        const bore2 = conn2.boreDiameter;
        const hasKeyway = conn1.hasKeyway;

        const keyway1 = hasKeyway && bore1 > 0 ? getDin6885Keyway(bore1) : undefined;
        const keyway2 = hasKeyway && bore2 > 0 ? getDin6885Keyway(bore2) : undefined;

        const tipData = computeTipShorteningData({
            mn: m,
            z1,
            z2,
            betaDeg: beta,
            alphaDeg: alpha,
            x1,
            x2,
            kMode: 'workshop',
            customK: k
        });

        const aw = tipData.a_wt;
        const hubExt1 = hubStyle === 'boss' ? (isKtr && ktr1 ? Math.max(14, (ktr1.B1 || 30) - faceW + 8) : 12) : 0;
        const hubDia1 = Math.max(conn1.minHubDiameter, bore1 * 1.5, 30);
        const hubW1 = faceW + hubExt1;
        const hubExt2 = hubStyle === 'boss' ? (isKtr && ktr2 ? Math.max(14, (ktr2.B1 || 30) - faceW + 8) : 12) : 0;
        const hubDia2 = Math.max(conn2.minHubDiameter, bore2 * 1.5, 45);
        const hubW2 = faceW + hubExt2;

        const parts: DynamicPart3DDef[] = [
            // Pinion Gear Solid (Clean True Involute with Genuine Through-Bore)
            {
                id: `gear1_body_${Date.now()}`,
                name: `ISO 53 Pinyon Dişli (mn=${m}, z1=${z1}, da1=${tipData.da1.toFixed(1)} mm, bore=Ø${bore1} mm${isKtr ? ' KTR Konik Kilit' : ' DIN 6885 Kama'})`,
                kind: 'gear-blank',
                color: '#3ad0e6',
                position: { x: basePos.x, y: basePos.y, z: basePos.z },
                rotation: { x: 90, y: 0, z: 0 },
                params: {
                    module: m,
                    teeth: z1,
                    depth: faceW,
                    bore: bore1,
                    boreDiameter: bore1,
                    pressureAngle: alpha,
                    helixAngle: beta,
                    profileShift: x1,
                    hasKeyway: hasKeyway && bore1 > 0,
                    keywayWidth: keyway1?.width,
                    keywayDepth: keyway1?.depth,
                    conicalLock: isKtr && ktr1 ? {
                        model: ktr1.model,
                        d: ktr1.d,
                        D: ktr1.D,
                        TA: ktr1.TA,
                        T: ktr1.T,
                        Fax: ktr1.Fax,
                        screw: `${ktr1.screwCount}x${ktr1.screw}x${ktr1.screwLength}`,
                    } : undefined,
                },
                designStandard: isKtr ? 'ISO 53 / DIN 3960 / KTR CLAMPEX®' : 'ISO 53 / DIN 3960 / DIN 6885-1'
            }
        ];

        // Pinion KTR or Hub Collar (strictly coaxial along Z axis)
        if (isKtr && ktr1) {
            parts.push(...createKtr3DParts(basePos, faceW, ktr1, lockDir, 'Pinyon ', hubExt1));
        } else if (hubStyle === 'boss') {
            const hubExtZ = lockDir === 'front' ? -hubW1 / 2 + faceW / 2 : hubW1 / 2 - faceW / 2;
            parts.push({
                id: `gear1_hub_boss_${Date.now()}`,
                name: `Pinyon Göbek Flanşı (Ø${hubDia1} mm, Delik Ø${bore1} mm)`,
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

        // Pinion Guide Flanges (Pfeifer / Barbieri Standard)
        if (flangeOpt !== 'none') {
            const rFlange1 = tipData.da1 / 2 + Math.max(3.5, 1.5 * m);
            parts.push(...createGuideFlange3DParts(basePos, faceW, Math.max(bore1, tipData.da1 - 4), rFlange1 * 2, flangeOpt, 2.0, 'Pinyon '));
        }

        if (mode === 'pair') {
            const pos2 = { x: basePos.x + aw, y: basePos.y, z: basePos.z };
            parts.push({
                id: `gear2_body_${Date.now()}`,
                name: `ISO 53 Çark Dişli (mn=${m}, z2=${z2}, da2=${tipData.da2.toFixed(1)} mm, aw=${aw.toFixed(1)} mm, bore=Ø${bore2} mm${isKtr ? ' KTR Konik Kilit' : ' DIN 6885 Kama'})`,
                kind: 'gear-blank',
                color: '#00e5ff',
                position: pos2,
                rotation: { x: 90, y: 0, z: 0 },
                params: {
                    module: m,
                    teeth: z2,
                    depth: faceW,
                    bore: bore2,
                    boreDiameter: bore2,
                    pressureAngle: alpha,
                    helixAngle: -beta,
                    profileShift: x2,
                    hasKeyway: hasKeyway && bore2 > 0,
                    keywayWidth: keyway2?.width,
                    keywayDepth: keyway2?.depth,
                    conicalLock: isKtr && ktr2 ? {
                        model: ktr2.model,
                        d: ktr2.d,
                        D: ktr2.D,
                        TA: ktr2.TA,
                        T: ktr2.T,
                        Fax: ktr2.Fax,
                        screw: `${ktr2.screwCount}x${ktr2.screw}x${ktr2.screwLength}`,
                    } : undefined,
                },
                designStandard: isKtr ? 'ISO 53 / DIN 3960 / KTR CLAMPEX®' : 'ISO 53 / DIN 3960 / DIN 6885-1'
            });

            if (isKtr && ktr2) {
                parts.push(...createKtr3DParts(pos2, faceW, ktr2, lockDir, 'Çark ', hubExt2));
            } else if (hubStyle === 'boss') {
                const hubExtZ2 = lockDir === 'front' ? -hubW2 / 2 + faceW / 2 : hubW2 / 2 - faceW / 2;
                parts.push({
                    id: `gear2_hub_boss_${Date.now()}`,
                    name: `Çark Göbek Flanşı (Ø${hubDia2} mm, Delik Ø${bore2} mm)`,
                    kind: 'tube',
                    color: '#64748b',
                    position: { x: pos2.x, y: pos2.y, z: pos2.z + hubExtZ2 },
                    rotation: { x: 90, y: 0, z: 0 },
                    params: {
                        innerDiameter: bore2,
                        outerDiameter: hubDia2,
                        length: hubW2
                    }
                });
            }

            if (flangeOpt !== 'none') {
                const rFlange2 = tipData.da2 / 2 + Math.max(3.5, 1.5 * m);
                parts.push(...createGuideFlange3DParts(pos2, faceW, Math.max(bore2, tipData.da2 - 4), rFlange2 * 2, flangeOpt, 2.0, 'Çark '));
            }
        }

        return parts;
    },
    getGrips: (params, basePoint = { x: 0, y: 0 }) => {
        const m = Number(params.module) || 3.0;
        const z1 = Math.max(6, Math.round(Number(params.teeth) || 20));
        const z2 = Math.max(6, Math.round(Number(params.teeth2) || 60));
        const alpha = Number(params.pressureAngle) || 20;
        const beta = Number(params.helixAngle) || 0;
        const x1 = Number(params.profileShift) || 0;
        const x2 = Number(params.profileShift2) || 0;
        const k = Number(params.kFactor) || 0;
        const faceW = Number(params.faceWidth) || 40;
        const mode = String(params.gearMode || 'pair');
        const connection = String(params.shaftConnection || 'keyway_din6885');
        const visState = String(params.visState || 'front_detailed');

        const shaft1 = Math.max(8, Number(params.shaftDiameter || params.boreDiameter || 20));
        const shaft2 = Math.max(8, Number(params.shaftDiameter2 || params.boreDiameter2 || 35));

        const conn1 = resolveShaftConnection(connection, shaft1, 'gear');
        const conn2 = resolveShaftConnection(connection, shaft2, 'gear');
        const isKtr = conn1.isKtr;
        const ktr1 = conn1.ktrEntry;
        const ktr2 = conn2.ktrEntry;
        const bore1 = conn1.boreDiameter;
        const bore2 = conn2.boreDiameter;

        const tipData = computeTipShorteningData({
            mn: m,
            z1,
            z2,
            betaDeg: beta,
            alphaDeg: alpha,
            x1,
            x2,
            kMode: 'workshop',
            customK: k
        });

        const aw = tipData.a_wt;
        const cosBeta = Math.max(0.01, Math.cos((beta * Math.PI) / 180));
        const mt = m / cosBeta;
        const r1 = (z1 * mt) / 2;
        const r2 = (z2 * mt) / 2;
        const ra1 = tipData.da1 / 2;
        const ra2 = tipData.da2 / 2;

        // Clean layout for Side Section view so arrows don't collide with the gear body
        if (visState === 'side_section') {
            const grips: DynamicGrip[] = [
                // Stretch grip for Pinion teeth: placed below bottom rim pointing down
                {
                    id: 'grip_gear_teeth1',
                    type: 'stretch',
                    paramId: 'teeth',
                    position: { x: basePoint.x, y: basePoint.y - ra1 - 10 },
                    direction: { x: 0, y: -1 },
                    tooltip: `Pinyon Diş Sayısı: z1=${z1} (da1=${(ra1 * 2).toFixed(1)} mm)`,
                    tooltipTr: `Pinyon Diş Sayısı: z1=${z1} (da1=${(ra1 * 2).toFixed(1)} mm)`
                },
                // Stretch grip for Face Width (b): placed at right face pointing right
                {
                    id: 'grip_gear_facewidth',
                    type: 'stretch',
                    paramId: 'faceWidth',
                    position: { x: basePoint.x + faceW / 2 + 10, y: basePoint.y },
                    direction: { x: 1, y: 0 },
                    tooltip: `Diş Genişliği: b=${faceW} mm`,
                    tooltipTr: `Diş Genişliği: b=${faceW} mm`
                },
                // Stretch grip for Pinion Shaft
                {
                    id: 'grip_gear_shaft1',
                    type: 'stretch',
                    paramId: 'shaftDiameter',
                    position: { x: basePoint.x - faceW / 2 - 12, y: basePoint.y + shaft1 / 2 },
                    direction: { x: 0, y: 1 },
                    tooltip: isKtr
                        ? `Pinyon Mil Çapı d=Ø${shaft1} mm -> KTR ${ktr1?.model || ''} D=Ø${bore1} mm`
                        : `Pinyon Mil Çapı: Ø${shaft1} mm`,
                    tooltipTr: isKtr
                        ? `Pinyon Mil Çapı d=Ø${shaft1} mm -> KTR ${ktr1?.model || ''} D=Ø${bore1} mm`
                        : `Pinyon Mil Çapı: Ø${shaft1} mm`
                },
                // Visibility Grip
                {
                    id: 'grip_gear_vis',
                    type: 'visibility',
                    paramId: 'visState',
                    position: { x: basePoint.x - faceW / 2 - 25, y: basePoint.y - ra1 - 15 },
                    tooltip: 'Görünüş Değiştir (Gerçek Profil / ISO 2203 Şematik / Kesit)',
                    tooltipTr: 'Görünüş Değiştir (Gerçek Profil / ISO 2203 Şematik / Kesit)'
                }
            ];

            if (mode === 'pair') {
                grips.push(
                    // Stretch grip for Driven Gear: placed above top rim pointing up
                    {
                        id: 'grip_gear_teeth2',
                        type: 'stretch',
                        paramId: 'teeth2',
                        position: { x: basePoint.x, y: basePoint.y + aw + ra2 + 10 },
                        direction: { x: 0, y: 1 },
                        tooltip: `Çark Diş Sayısı: z2=${z2} (da2=${(ra2 * 2).toFixed(1)} mm)`,
                        tooltipTr: `Çark Diş Sayısı: z2=${z2} (da2=${(ra2 * 2).toFixed(1)} mm)`
                    },
                    // Stretch grip for Driven Gear Shaft
                    {
                        id: 'grip_gear_shaft2',
                        type: 'stretch',
                        paramId: 'shaftDiameter2',
                        position: { x: basePoint.x - faceW / 2 - 12, y: basePoint.y + aw + shaft2 / 2 },
                        direction: { x: 0, y: 1 },
                        tooltip: isKtr
                            ? `Çark Mil Çapı d=Ø${shaft2} mm -> KTR ${ktr2?.model || ''} D=Ø${bore2} mm`
                            : `Çark Mil Çapı: Ø${shaft2} mm`,
                        tooltipTr: isKtr
                            ? `Çark Mil Çapı d=Ø${shaft2} mm -> KTR ${ktr2?.model || ''} D=Ø${bore2} mm`
                            : `Çark Mil Çapı: Ø${shaft2} mm`
                    }
                );
            }

            return grips;
        }

        // Standard front views grips
        const grips: DynamicGrip[] = [
            // Linear Stretch Grip on Pinion Pitch Circle (Resizes z1)
            {
                id: 'grip_gear_teeth1',
                type: 'stretch',
                paramId: 'teeth',
                position: { x: basePoint.x + r1, y: basePoint.y },
                direction: { x: 1, y: 0 },
                tooltip: `Pinyon Diş Sayısı: z1=${z1} (d1=${(r1 * 2).toFixed(1)} mm)`,
                tooltipTr: `Pinyon Diş Sayısı: z1=${z1} (Bölüm Çapı d1=${(r1 * 2).toFixed(1)} mm)`
            },
            // Linear Stretch Grip on Pinion Shaft / Bore Diameter
            {
                id: 'grip_gear_shaft1',
                type: 'stretch',
                paramId: 'shaftDiameter',
                position: { x: basePoint.x, y: basePoint.y + shaft1 / 2 },
                direction: { x: 0, y: 1 },
                tooltip: isKtr
                    ? `Pinyon Mil Çapı d=Ø${shaft1} mm -> KTR ${ktr1?.model || ''} D=Ø${bore1} mm (TA=${ktr1?.TA || ''} Nm)`
                    : `Pinyon Mil Çapı (DIN 6885 Kama): Ø${shaft1} mm`,
                tooltipTr: isKtr
                    ? `Pinyon Mil Çapı d=Ø${shaft1} mm -> KTR ${ktr1?.model || ''} D=Ø${bore1} mm (TA=${ktr1?.TA || ''} Nm)`
                    : `Pinyon Mil Çapı (DIN 6885 Kama): Ø${shaft1} mm`
            },
            // Visibility State Flip Grip
            {
                id: 'grip_gear_vis',
                type: 'visibility',
                paramId: 'visState',
                position: { x: basePoint.x - r1 - 15, y: basePoint.y - r1 - 15 },
                tooltip: 'Görünüş Değiştir (Gerçek Profil / ISO 2203 Şematik / Kesit)',
                tooltipTr: 'Görünüş Değiştir (Gerçek Profil / ISO 2203 Şematik / Kesit)'
            }
        ];

        if (mode === 'pair') {
            grips.push(
                // Linear Stretch Grip on Driven Gear Pitch Circle (Resizes z2)
                {
                    id: 'grip_gear_teeth2',
                    type: 'stretch',
                    paramId: 'teeth2',
                    position: { x: basePoint.x + aw + r2, y: basePoint.y },
                    direction: { x: 1, y: 0 },
                    tooltip: `Çark Diş Sayısı: z2=${z2} (d2=${(r2 * 2).toFixed(1)} mm)`,
                    tooltipTr: `Çark Diş Sayısı: z2=${z2} (Bölüm Çapı d2=${(r2 * 2).toFixed(1)} mm)`
                },
                // Linear Stretch Grip on Driven Gear Shaft
                {
                    id: 'grip_gear_shaft2',
                    type: 'stretch',
                    paramId: 'shaftDiameter2',
                    position: { x: basePoint.x + aw, y: basePoint.y + shaft2 / 2 },
                    direction: { x: 0, y: 1 },
                    tooltip: isKtr
                        ? `Çark Mil Çapı d=Ø${shaft2} mm -> KTR ${ktr2?.model || ''} D=Ø${bore2} mm (TA=${ktr2?.TA || ''} Nm)`
                        : `Çark Mil Çapı (DIN 6885 Kama): Ø${shaft2} mm`,
                    tooltipTr: isKtr
                        ? `Çark Mil Çapı d=Ø${shaft2} mm -> KTR ${ktr2?.model || ''} D=Ø${bore2} mm (TA=${ktr2?.TA || ''} Nm)`
                        : `Çark Mil Çapı (DIN 6885 Kama): Ø${shaft2} mm`
                },
                // Working Center Distance (aw) inspection grip
                {
                    id: 'grip_gear_center_dist',
                    type: 'point',
                    paramId: 'helixAngle',
                    position: { x: basePoint.x + aw, y: basePoint.y - Math.max(ra1, ra2) - 18 },
                    tooltip: `Kavrama Eksen Mesafesi aw = ${aw.toFixed(2)} mm (x1=${x1.toFixed(2)}, x2=${x2.toFixed(2)}, β=${beta}°)`,
                    tooltipTr: `Kavrama Eksen Mesafesi aw = ${aw.toFixed(2)} mm (x1=${x1.toFixed(2)}, x2=${x2.toFixed(2)}, β=${beta}°)`
                }
            );
        }

        return grips;
    }
};
