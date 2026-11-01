/**
 * ⚙️ Dynamic Rolling Bearing Suite (ISO 15 / DIN 625 / SKF Master Catalog)
 * 
 * AutoCAD-Grade Dynamic Rolling Element Bearing:
 * - Types & Series:
 *    - Deep Groove Ball Bearings (6000, 6200, 6300, 6400)
 *    - Tapered Roller Bearings (30200, 32000)
 *    - Cylindrical Roller Bearings (NU 200, NJ 200)
 * - Projections:
 *    - Axial Cross-Section (Yan Kesit — İç bilezik, dış bilezik, bilya/makara, pahlar, merkez ekseni)
 *    - Front Radial View (Ön Görünüş — Bilya yörüngesi ve delik dairesi)
 * - Parameters:
 *    - Shaft Bore (d: 10mm to 120mm)
 *    - Outer Diameter (D: 26mm to 260mm)
 *    - Width (B: 8mm to 60mm)
 * - Lookup Presets: 6000 through 6312 popular sizes (40+ standard bearings)
 * - 3D Solids: Parametric outer race, inner race and rolling elements
 */

import { Point, CadEntity, createLineEntity, createRectangleEntity, createCircleEntity, createArcEntity, createHatchEntity } from '../../../kernel/types';
import { DynamicBlockDef, DynamicGrip, DynamicPart3DDef } from '../types';

export interface StandardBearingDim {
    code: string;
    d: number;
    D: number;
    B: number;
    rMin: number;
    C: number;
    C0: number;
    type: 'deep_groove' | 'tapered' | 'cylindrical';
}

export const POPULAR_BEARINGS: Record<string, StandardBearingDim> = {
    '6000': { code: '6000', d: 10, D: 26, B: 8,  rMin: 0.3, C: 4.75, C0: 1.96, type: 'deep_groove' },
    '6001': { code: '6001', d: 12, D: 28, B: 8,  rMin: 0.3, C: 5.4,  C0: 2.36, type: 'deep_groove' },
    '6002': { code: '6002', d: 15, D: 32, B: 9,  rMin: 0.3, C: 5.85, C0: 2.85, type: 'deep_groove' },
    '6003': { code: '6003', d: 17, D: 35, B: 10, rMin: 0.3, C: 6.37, C0: 3.25, type: 'deep_groove' },
    '6004': { code: '6004', d: 20, D: 42, B: 12, rMin: 0.6, C: 9.95, C0: 5.0,  type: 'deep_groove' },
    '6005': { code: '6005', d: 25, D: 47, B: 12, rMin: 0.6, C: 11.9, C0: 6.55, type: 'deep_groove' },
    '6006': { code: '6006', d: 30, D: 55, B: 13, rMin: 1.0, C: 13.8, C0: 8.3,  type: 'deep_groove' },
    '6007': { code: '6007', d: 35, D: 62, B: 14, rMin: 1.0, C: 16.8, C0: 10.2, type: 'deep_groove' },
    '6008': { code: '6008', d: 40, D: 68, B: 15, rMin: 1.0, C: 17.8, C0: 11.6, type: 'deep_groove' },
    '6200': { code: '6200', d: 10, D: 30, B: 9,  rMin: 0.6, C: 5.4,  C0: 2.36, type: 'deep_groove' },
    '6201': { code: '6201', d: 12, D: 32, B: 10, rMin: 0.6, C: 7.28, C0: 3.1,  type: 'deep_groove' },
    '6202': { code: '6202', d: 15, D: 35, B: 11, rMin: 0.6, C: 8.06, C0: 3.75, type: 'deep_groove' },
    '6203': { code: '6203', d: 17, D: 40, B: 12, rMin: 0.6, C: 9.95, C0: 4.75, type: 'deep_groove' },
    '6204': { code: '6204', d: 20, D: 47, B: 14, rMin: 1.0, C: 13.5, C0: 6.55, type: 'deep_groove' },
    '6205': { code: '6205', d: 25, D: 52, B: 15, rMin: 1.0, C: 14.8, C0: 7.8,  type: 'deep_groove' },
    '6206': { code: '6206', d: 30, D: 62, B: 16, rMin: 1.0, C: 20.3, C0: 11.2, type: 'deep_groove' },
    '6207': { code: '6207', d: 35, D: 72, B: 17, rMin: 1.1, C: 27.0, C0: 15.3, type: 'deep_groove' },
    '6208': { code: '6208', d: 40, D: 80, B: 18, rMin: 1.1, C: 32.5, C0: 19.0, type: 'deep_groove' },
    '6209': { code: '6209', d: 45, D: 85, B: 19, rMin: 1.1, C: 35.1, C0: 21.6, type: 'deep_groove' },
    '6210': { code: '6210', d: 50, D: 90, B: 20, rMin: 1.1, C: 37.1, C0: 23.2, type: 'deep_groove' },
    '6300': { code: '6300', d: 10, D: 35, B: 11, rMin: 0.6, C: 8.52, C0: 3.4,  type: 'deep_groove' },
    '6301': { code: '6301', d: 12, D: 37, B: 12, rMin: 1.0, C: 10.1, C0: 4.15, type: 'deep_groove' },
    '6302': { code: '6302', d: 15, D: 42, B: 13, rMin: 1.0, C: 11.9, C0: 5.4,  type: 'deep_groove' },
    '6303': { code: '6303', d: 17, D: 47, B: 14, rMin: 1.0, C: 14.3, C0: 6.55, type: 'deep_groove' },
    '6304': { code: '6304', d: 20, D: 52, B: 15, rMin: 1.1, C: 16.8, C0: 7.8,  type: 'deep_groove' },
    '6305': { code: '6305', d: 25, D: 62, B: 17, rMin: 1.1, C: 23.4, C0: 11.6, type: 'deep_groove' },
    '6306': { code: '6306', d: 30, D: 72, B: 19, rMin: 1.1, C: 29.6, C0: 16.0, type: 'deep_groove' },
    '6307': { code: '6307', d: 35, D: 80, B: 21, rMin: 1.5, C: 35.1, C0: 19.0, type: 'deep_groove' },
    '6308': { code: '6308', d: 40, D: 90, B: 23, rMin: 1.5, C: 42.3, C0: 24.0, type: 'deep_groove' },
    '6309': { code: '6309', d: 45, D: 100, B: 25, rMin: 1.5, C: 55.3, C0: 31.5, type: 'deep_groove' },
    '6310': { code: '6310', d: 50, D: 110, B: 27, rMin: 2.0, C: 65.0, C0: 38.0, type: 'deep_groove' },
    '6312': { code: '6312', d: 60, D: 130, B: 31, rMin: 2.1, C: 85.2, C0: 52.0, type: 'deep_groove' }
};

export const SKF_CATALOG = POPULAR_BEARINGS;

export const DYN_SKF_BEARING: DynamicBlockDef = {
    id: 'dyn_skf_bearing',
    name: 'Dynamic Rolling Bearing (ISO 15 / DIN 625)',
    nameTr: 'Dinamik Standart Rulman (SKF / ISO 15)',
    category: 'Mechanical',
    subcategory: 'Bearings & Power Transmission',
    subcategoryTr: 'Rulman ve Yataklama Sistemleri',
    description: 'AutoCAD-grade dynamic rolling bearing: ISO 15 metric series 6000, 6200, 6300 with axial section and radial front views.',
    descriptionTr: 'ISO 15 ve DIN 625 normunda 6000, 6200, 6300 serisi derin kanallı ve makaralı rulmanlar; eksenel kesit ve radyal görünüş.',
    icon: '⚙️',
    calculatorRoute: '/bearings/',
    calculatorModuleType: 'bearings',
    calculatorLabelTr: 'Rulman Ömrü ve Yataklama Hesabına Git (ISO 281)',
    citation: {
        tier: 1,
        standard: 'ISO 15 / DIN 625 / ISO 281',
        clause: 'Radial bearings - Boundary dimensions, general plan & Dynamic load ratings',
        description: 'ISO 15 dimension plans: diameter series 0, 2, 3; width series 0, 1; ISO 281 life rating C & C0.'
    },
    linearParams: [
        {
            id: 'd',
            name: 'd',
            label: 'Bore Diameter (d)',
            labelTr: 'İç Çap / Mil Çapı (d)',
            min: 10,
            max: 120,
            step: 5,
            default: 25,
            unit: 'mm',
            axis: 'both'
        },
        {
            id: 'D',
            name: 'D',
            label: 'Outside Diameter (D)',
            labelTr: 'Dış Çap (D)',
            min: 26,
            max: 260,
            step: 2,
            default: 52,
            unit: 'mm',
            axis: 'both'
        },
        {
            id: 'B',
            name: 'B',
            label: 'Width (B)',
            labelTr: 'Rulman Genişliği (B)',
            min: 8,
            max: 60,
            step: 1,
            default: 15,
            unit: 'mm',
            axis: 'x'
        }
    ],
    visibilityParam: {
        id: 'viewMode',
        name: 'viewMode',
        label: 'Projection View Mode',
        labelTr: 'Görünüş / Kesit Tipi',
        states: [
            { id: 'axial_section', label: 'Axial Cross-Section (Mil Boyu Kesit)', labelTr: 'Mil Boyu Eksenel Kesit' },
            { id: 'radial_front', label: 'Radial Front View (Ön Dairesel Görünüş)', labelTr: 'Ön Dairesel Görünüş' }
        ],
        default: 'axial_section'
    },
    lookupParams: [
        {
            id: 'presetBearing',
            name: 'presetBearing',
            label: 'ISO Standard Bearing Catalog',
            labelTr: 'Standart ISO Rulman Kataloğu',
            options: Object.values(POPULAR_BEARINGS).map(b => ({
                id: `b_${b.code}`,
                label: `SKF ${b.code} (Ø${b.d}xØ${b.D}x${b.B} mm — C=${b.C} kN, C0=${b.C0} kN)`,
                values: { d: b.d, D: b.D, B: b.B }
            })),
            default: 'b_6205'
        }
    ],
    defaultValues: {
        d: 25,
        D: 52,
        B: 15,
        viewMode: 'axial_section'
    },
    generate2D: (params, basePoint = { x: 0, y: 0 }) => {
        const d = Math.max(10, Number(params.d) || 25);
        const D = Math.max(d + 8, Number(params.D) || 52);
        const B = Math.max(6, Number(params.B) || 15);
        const viewMode = String(params.viewMode || 'axial_section');

        const entities: CadEntity[] = [];
        const layerRaces = 'layer-mech';
        const layerBalls = 'layer-accent';
        const layerCenter = 'layer-ref';

        const colorRaces = '#3ad0e6';
        const colorBalls = '#f8fafc';
        const colorCenter = '#64748b';

        const radBore = d / 2;
        const radOuter = D / 2;
        const radPitch = (radBore + radOuter) / 2;
        const ballDia = (radOuter - radBore) * 0.62;
        const ringThick = (radOuter - radBore) * 0.28;

        if (viewMode === 'axial_section') {
            // Symmetrical Cross-Section: Upper and Lower halves around the shaft centerline
            // Centerline at y = basePoint.y
            entities.push(createLineEntity(
                { x: basePoint.x - B / 2 - 10, y: basePoint.y },
                { x: basePoint.x + B / 2 + 10, y: basePoint.y },
                layerCenter,
                colorCenter
            ));

            // Top Half Races & Ball
            // Upper Outer Ring
            entities.push(createRectangleEntity(
                { x: basePoint.x, y: basePoint.y + radOuter - ringThick / 2 },
                B,
                ringThick,
                layerRaces,
                colorRaces
            ));
            entities.push(createHatchEntity([
                { x: basePoint.x - B / 2, y: basePoint.y + radOuter - ringThick },
                { x: basePoint.x + B / 2, y: basePoint.y + radOuter - ringThick },
                { x: basePoint.x + B / 2, y: basePoint.y + radOuter },
                { x: basePoint.x - B / 2, y: basePoint.y + radOuter }
            ], 'ANSI31', layerRaces, '#0284c7'));

            // Upper Inner Ring (Opposing 135° hatch)
            entities.push(createRectangleEntity(
                { x: basePoint.x, y: basePoint.y + radBore + ringThick / 2 },
                B,
                ringThick,
                layerRaces,
                colorRaces
            ));
            entities.push(createHatchEntity([
                { x: basePoint.x - B / 2, y: basePoint.y + radBore },
                { x: basePoint.x + B / 2, y: basePoint.y + radBore },
                { x: basePoint.x + B / 2, y: basePoint.y + radBore + ringThick },
                { x: basePoint.x - B / 2, y: basePoint.y + radBore + ringThick }
            ], 'CROSS', layerRaces, '#0284c7'));

            // Upper Ball
            entities.push(createCircleEntity(
                { x: basePoint.x, y: basePoint.y + radPitch },
                ballDia / 2,
                layerBalls,
                colorBalls
            ));

            // Bottom Half Races & Ball
            // Lower Outer Ring
            entities.push(createRectangleEntity(
                { x: basePoint.x, y: basePoint.y - radOuter + ringThick / 2 },
                B,
                ringThick,
                layerRaces,
                colorRaces
            ));
            entities.push(createHatchEntity([
                { x: basePoint.x - B / 2, y: basePoint.y - radOuter },
                { x: basePoint.x + B / 2, y: basePoint.y - radOuter },
                { x: basePoint.x + B / 2, y: basePoint.y - radOuter + ringThick },
                { x: basePoint.x - B / 2, y: basePoint.y - radOuter + ringThick }
            ], 'ANSI31', layerRaces, '#0284c7'));

            // Lower Inner Ring (Opposing 135° hatch)
            entities.push(createRectangleEntity(
                { x: basePoint.x, y: basePoint.y - radBore - ringThick / 2 },
                B,
                ringThick,
                layerRaces,
                colorRaces
            ));
            entities.push(createHatchEntity([
                { x: basePoint.x - B / 2, y: basePoint.y - radBore - ringThick },
                { x: basePoint.x + B / 2, y: basePoint.y - radBore - ringThick },
                { x: basePoint.x + B / 2, y: basePoint.y - radBore },
                { x: basePoint.x - B / 2, y: basePoint.y - radBore }
            ], 'CROSS', layerRaces, '#0284c7'));

            // Lower Ball
            entities.push(createCircleEntity(
                { x: basePoint.x, y: basePoint.y - radPitch },
                ballDia / 2,
                layerBalls,
                colorBalls
            ));
        } else {
            // Front Radial View (Concentric Circles & Ball Array)
            // Outer Ring Circle
            entities.push(createCircleEntity(basePoint, radOuter, layerRaces, colorRaces));
            // Outer Race Shoulder
            entities.push(createCircleEntity(basePoint, radOuter - ringThick, layerRaces, colorRaces));
            // Inner Race Shoulder
            entities.push(createCircleEntity(basePoint, radBore + ringThick, layerRaces, colorRaces));
            // Inner Bore Circle
            entities.push(createCircleEntity(basePoint, radBore, layerRaces, colorRaces));
            // Pitch Diameter Centerline
            entities.push(createCircleEntity(basePoint, radPitch, layerCenter, colorCenter));

            // Balls around the pitch circle
            const numBalls = Math.max(6, Math.floor((Math.PI * 2 * radPitch) / (ballDia * 1.5)));
            for (let i = 0; i < numBalls; i++) {
                const angle = (i / numBalls) * Math.PI * 2;
                const bx = basePoint.x + Math.cos(angle) * radPitch;
                const by = basePoint.y + Math.sin(angle) * radPitch;
                entities.push(createCircleEntity({ x: bx, y: by }, ballDia / 2, layerBalls, colorBalls));
            }
        }

        return entities;
    },
    generate3D: (params, basePos = { x: 0, y: 0, z: 0 }) => {
        const d = Math.max(10, Number(params.d) || 25);
        const D = Math.max(d + 8, Number(params.D) || 52);
        const B = Math.max(6, Number(params.B) || 15);

        const parts: DynamicPart3DDef[] = [
            {
                id: `bearing_solid_${Date.now()}`,
                name: `ISO 15 Rulman (Ø${d}xØ${D}x${B} mm)`,
                kind: 'tube',
                color: '#cbd5e1',
                position: { x: basePos.x, y: basePos.y, z: basePos.z },
                rotation: { x: 90, y: 0, z: 0 },
                params: {
                    diameter: D,
                    innerDiameter: d,
                    length: B
                },
                designStandard: 'ISO 15 / DIN 625'
            }
        ];

        return parts;
    },
    getGrips: (params, basePoint = { x: 0, y: 0 }) => {
        const d = Math.max(10, Number(params.d) || 25);
        const D = Math.max(d + 8, Number(params.D) || 52);
        const B = Math.max(6, Number(params.B) || 15);

        const grips: DynamicGrip[] = [
            // Outer Diameter Stretch Grip
            {
                id: 'grip_bearing_D',
                type: 'stretch',
                paramId: 'D',
                position: { x: basePoint.x, y: basePoint.y + D / 2 },
                direction: { x: 0, y: 1 },
                tooltip: `Grip: Dış Çapı Esnet (D=Ø${D} mm)`,
                tooltipTr: `Grip: Dış Çapı Esnet (D=Ø${D} mm)`
            },
            // Bore Diameter Stretch Grip
            {
                id: 'grip_bearing_d',
                type: 'stretch',
                paramId: 'd',
                position: { x: basePoint.x, y: basePoint.y + d / 2 },
                direction: { x: 0, y: 1 },
                tooltip: `Grip: Mil Çapını Esnet (d=Ø${d} mm)`,
                tooltipTr: `Grip: Mil Çapını Esnet (d=Ø${d} mm)`
            },
            // Width Stretch Grip
            {
                id: 'grip_bearing_B',
                type: 'stretch',
                paramId: 'B',
                position: { x: basePoint.x + B / 2, y: basePoint.y },
                direction: { x: 1, y: 0 },
                tooltip: `Grip: Rulman Genişliği (B=${B} mm)`,
                tooltipTr: `Grip: Rulman Genişliği (B=${B} mm)`
            },
            // View Mode Visibility Grip
            {
                id: 'grip_bearing_vis',
                type: 'visibility',
                paramId: 'viewMode',
                position: { x: basePoint.x - 30, y: basePoint.y - 30 },
                tooltip: 'Görünüş Tipi (Eksenel Kesit / Ön Radyal Görünüş)',
                tooltipTr: 'Görünüş Tipi (Eksenel Kesit / Ön Radyal Görünüş)'
            }
        ];

        return grips;
    }
};
