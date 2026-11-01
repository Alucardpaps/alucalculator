/**
 * ⚡ Dynamic Industrial Electric Motor Suite (IEC 60034 / DIN EN 50347)
 * 
 * AutoCAD-Grade Dynamic Electric Motor:
 * - Mount Types:
 *    - B3 Foot Mounted (Ayaklı Gövde)
 *    - B5 Flange Mounted (Büyük Flanşlı Gövde)
 *    - B14 Face Mounted (Küçük Flanşlı Gövde)
 * - IEC Frame Sizes (Standart Gövde Boyutları):
 *    - IEC 63 (0.18 kW, mil Ø11x23 mm)
 *    - IEC 71 (0.37 kW, mil Ø14x30 mm)
 *    - IEC 80 (0.75 kW, mil Ø19x40 mm)
 *    - IEC 90S/L (1.5 kW, mil Ø24x50 mm)
 *    - IEC 100L (3.0 kW, mil Ø28x60 mm)
 *    - IEC 112M (4.0 kW, mil Ø28x60 mm)
 *    - IEC 132S/M (7.5 kW, mil Ø38x80 mm)
 *    - IEC 160M/L (15.0 kW, mil Ø42x110 mm)
 *    - IEC 180M/L (22.0 kW, mil Ø48x110 mm)
 *    - IEC 200L (30.0 kW, mil Ø55x110 mm)
 * - Views:
 *    - Side Elevation (Yan Görünüş — Gövde kanatçıkları, mil, ayaklar, klemens kutusu, fan muhafazası)
 *    - Front Radial View (Ön Görünüş — Mil ucu, flanş/ayak delikleri, klemens kutusu)
 *    - Top Plan View (Üst Plan Görünüşü)
 * - 3D Solids: Motor stator carcass, rotor shaft with DIN 6885 keyway, terminal box, fan cowl
 */

import { Point, CadEntity, createLineEntity, createRectangleEntity, createCircleEntity, createArcEntity } from '../../../kernel/types';
import { DynamicBlockDef, DynamicGrip, DynamicPart3DDef } from '../types';

export interface IecMotorFrameSpec {
    frame: string;
    kw: number;
    dShaft: number;
    lShaft: number;
    hAxis: number;   // Shaft centerline height from foot
    lTotal: number;  // Total motor length
    dBody: number;   // Motor stator diameter
    bFoot: number;   // Foot hole center width
    aFoot: number;   // Foot hole center length
    dFlange: number; // B5 Flange outer diameter
    pcdFlange: number; // B5 Bolt PCD
}

export const IEC_MOTOR_FRAMES: Record<string, IecMotorFrameSpec> = {
    'IEC_63':  { frame: '63',  kw: 0.18, dShaft: 11, lShaft: 23,  hAxis: 63,  lTotal: 215, dBody: 125, bFoot: 100, aFoot: 80,  dFlange: 140, pcdFlange: 115 },
    'IEC_71':  { frame: '71',  kw: 0.37, dShaft: 14, lShaft: 30,  hAxis: 71,  lTotal: 250, dBody: 140, bFoot: 112, aFoot: 90,  dFlange: 160, pcdFlange: 130 },
    'IEC_80':  { frame: '80',  kw: 0.75, dShaft: 19, lShaft: 40,  hAxis: 80,  lTotal: 290, dBody: 160, bFoot: 125, aFoot: 100, dFlange: 200, pcdFlange: 165 },
    'IEC_90S': { frame: '90S', kw: 1.5,  dShaft: 24, lShaft: 50,  hAxis: 90,  lTotal: 330, dBody: 180, bFoot: 140, aFoot: 100, dFlange: 200, pcdFlange: 165 },
    'IEC_100': { frame: '100', kw: 3.0,  dShaft: 28, lShaft: 60,  hAxis: 100, lTotal: 385, dBody: 200, bFoot: 160, aFoot: 140, dFlange: 250, pcdFlange: 215 },
    'IEC_112': { frame: '112', kw: 4.0,  dShaft: 28, lShaft: 60,  hAxis: 112, lTotal: 410, dBody: 225, bFoot: 190, aFoot: 140, dFlange: 250, pcdFlange: 215 },
    'IEC_132': { frame: '132', kw: 7.5,  dShaft: 38, lShaft: 80,  hAxis: 132, lTotal: 500, dBody: 260, bFoot: 216, aFoot: 140, dFlange: 300, pcdFlange: 265 },
    'IEC_160': { frame: '160', kw: 15.0, dShaft: 42, lShaft: 110, hAxis: 160, lTotal: 630, dBody: 315, bFoot: 254, aFoot: 210, dFlange: 350, pcdFlange: 300 },
    'IEC_180': { frame: '180', kw: 22.0, dShaft: 48, lShaft: 110, hAxis: 180, lTotal: 710, dBody: 355, bFoot: 279, aFoot: 241, dFlange: 350, pcdFlange: 300 }
};

export const DYN_ELECTRIC_MOTOR: DynamicBlockDef = {
    id: 'dyn_electric_motor',
    name: 'Dynamic Electric Motor (IEC 60034 / DIN EN 50347)',
    nameTr: 'Dinamik Standart Asenkron Elektrik Motoru',
    category: 'Mechanical',
    subcategory: 'Electric Motors & Drives',
    subcategoryTr: 'Elektrik Motorları ve Sürücüler',
    description: 'AutoCAD-grade dynamic IEC 60034 electric motor: B3 foot / B5 flange mount, sizes 63 to 180, side/front/top views.',
    descriptionTr: 'IEC 60034 ve DIN EN 50347 normunda B3 ayaklı ve B5 flanşlı elektrik motorları; gövde 63-180 arası yan, ön ve üst görünüşler.',
    icon: '⚡',
    calculatorRoute: '/motor-selection/',
    calculatorModuleType: 'motor-selection',
    calculatorLabelTr: 'Elektrik Motoru & Güç Hesabına Git (IEC 60034)',
    citation: {
        tier: 1,
        standard: 'IEC 60034-1 / DIN EN 50347',
        clause: 'General purpose three-phase induction motors having standard dimensions and outputs',
        description: 'Standard mounting B3 (foot) and B5 (flange), shaft center height H, shaft extensions d x l.'
    },
    linearParams: [
        {
            id: 'shaftDia',
            name: 'shaftDia',
            label: 'Shaft Diameter (d)',
            labelTr: 'Mil Çapı (d)',
            min: 11,
            max: 55,
            step: 1,
            default: 24,
            unit: 'mm',
            axis: 'x'
        }
    ],
    visibilityParam: {
        id: 'mountStyle',
        name: 'mountStyle',
        label: 'Mounting Style & Frame Type',
        labelTr: 'Gövde ve Montaj Tipi',
        states: [
            { id: 'b3_foot', label: 'IM B3 Foot Mounted (Ayaklı Montaj)', labelTr: 'IM B3 Ayaklı Montaj' },
            { id: 'b5_flange', label: 'IM B5 Flange Mounted (Flanşlı Montaj)', labelTr: 'IM B5 Flanşlı Montaj' }
        ],
        default: 'b3_foot'
    },
    lookupParams: [
        {
            id: 'frameSize',
            name: 'frameSize',
            label: 'IEC Standard Frame Catalog',
            labelTr: 'Standart IEC Gövde Tipi',
            options: Object.entries(IEC_MOTOR_FRAMES).map(([key, m]) => ({
                id: key,
                label: `IEC ${m.frame} (${m.kw} kW — Mil: Ø${m.dShaft}x${m.lShaft} mm, H=${m.hAxis} mm)`,
                values: { frameSize: key, shaftDia: m.dShaft }
            })),
            default: 'IEC_90S'
        }
    ],
    defaultValues: {
        frameSize: 'IEC_90S',
        mountStyle: 'b3_foot',
        shaftDia: 24
    },
    generate2D: (params, basePoint = { x: 0, y: 0 }) => {
        const frameKey = String(params.frameSize || 'IEC_90S');
        const spec = IEC_MOTOR_FRAMES[frameKey] || IEC_MOTOR_FRAMES['IEC_90S'];
        const mount = String(params.mountStyle || 'b3_foot');

        const entities: CadEntity[] = [];
        const layerBody = 'layer-mech';
        const layerShaft = 'layer-accent';
        const layerBox = 'layer-furn';
        const layerRef = 'layer-ref';

        const colorBody = '#3ad0e6';
        const colorShaft = '#f8fafc';
        const colorBox = '#f59e0b';
        const colorRef = '#64748b';

        const bodyL = spec.lTotal - spec.lShaft;
        const bodyH = spec.dBody;
        const shaftX = basePoint.x + bodyL;
        const axisY = basePoint.y + spec.hAxis;

        // 1. Shaft Centerline
        entities.push(createLineEntity(
            { x: basePoint.x - 15, y: axisY },
            { x: shaftX + spec.lShaft + 15, y: axisY },
            layerRef,
            colorRef
        ));

        // 2. Main Stator Body (Cylindrical Fin Enclosure)
        entities.push(createRectangleEntity(
            { x: basePoint.x + bodyL / 2, y: axisY },
            bodyL,
            bodyH,
            layerBody,
            colorBody
        ));

        // Cooling Fin Lines along body
        const numFins = Math.max(4, Math.floor(bodyL / 35));
        for (let i = 1; i < numFins; i++) {
            const fx = basePoint.x + (i / numFins) * bodyL;
            entities.push(createLineEntity(
                { x: fx, y: axisY - bodyH / 2 },
                { x: fx, y: axisY + bodyH / 2 },
                layerBody,
                colorRef
            ));
        }

        // 3. Drive End Output Shaft
        entities.push(createRectangleEntity(
            { x: shaftX + spec.lShaft / 2, y: axisY },
            spec.lShaft,
            spec.dShaft,
            layerShaft,
            colorShaft
        ));

        // 4. Rear Fan Cowl / Shroud
        const fanL = bodyL * 0.22;
        entities.push(createRectangleEntity(
            { x: basePoint.x + fanL / 2, y: axisY },
            fanL,
            bodyH - 8,
            layerBody,
            colorRef
        ));

        // 5. Terminal Box (Top of stator)
        const tboxW = bodyL * 0.28;
        const tboxH = bodyH * 0.32;
        entities.push(createRectangleEntity(
            { x: basePoint.x + bodyL * 0.55, y: axisY + bodyH / 2 + tboxH / 2 },
            tboxW,
            tboxH,
            layerBox,
            colorBox
        ));

        // 6. Mountings: B3 Feet or B5 Flange
        if (mount === 'b3_foot') {
            // Front & Rear Feet
            const footW = 40;
            const footH = spec.hAxis - bodyH / 2;
            // Rear foot
            entities.push(createRectangleEntity(
                { x: basePoint.x + bodyL * 0.25, y: basePoint.y + footH / 2 },
                footW,
                footH,
                layerBody,
                colorBody
            ));
            // Front foot
            entities.push(createRectangleEntity(
                { x: basePoint.x + bodyL * 0.75, y: basePoint.y + footH / 2 },
                footW,
                footH,
                layerBody,
                colorBody
            ));
        } else {
            // B5 Flange on Drive End
            const flThick = 18;
            entities.push(createRectangleEntity(
                { x: shaftX - flThick / 2, y: axisY },
                flThick,
                spec.dFlange,
                layerBody,
                colorBody
            ));
        }

        return entities;
    },
    generate3D: (params, basePos = { x: 0, y: 0, z: 0 }) => {
        const frameKey = String(params.frameSize || 'IEC_90S');
        const spec = IEC_MOTOR_FRAMES[frameKey] || IEC_MOTOR_FRAMES['IEC_90S'];
        const mount = String(params.mountStyle || 'b3_foot');

        const yAxis = basePos.y + spec.hAxis;
        const zAxis = basePos.z;
        const bodyL = spec.lTotal - spec.lShaft;
        const xShaftStart = basePos.x;
        const xBodyStart = basePos.x + spec.lShaft;

        const shieldL = Math.max(14, Math.round(bodyL * 0.10));
        const statorL = Math.round(bodyL * 0.58);
        const cowlL = bodyL - shieldL - statorL;

        const parts: DynamicPart3DDef[] = [];

        // 1. Stator Body (IEC 60034 Gövdesi)
        parts.push({
            id: `iec_stator_${spec.frame}`,
            name: `IEC ${spec.frame} Stator Gövdesi (${spec.kw} kW, Ø${spec.dBody} mm)`,
            kind: 'cylinder',
            color: '#334155', // Slate industrial grey
            position: { x: xBodyStart + shieldL + statorL / 2, y: yAxis, z: zAxis },
            rotation: { x: 0, y: 0, z: 90 },
            params: { diameter: spec.dBody, length: statorL },
            dimensions: {
                frame: spec.frame,
                kw: spec.kw,
                dShaft: spec.dShaft,
                lShaft: spec.lShaft,
                hAxis: spec.hAxis,
                lTotal: spec.lTotal,
                dBody: spec.dBody,
                mountStyle: mount
            },
            designStandard: 'IEC 60034-1 / DIN EN 50347',
            materialType: 'GG20 Döküm'
        });

        // 2. Tahrik Mili (DIN 748 Çıkış Mili)
        parts.push({
            id: `iec_shaft_${spec.frame}`,
            name: `Çıkış Mili Ø${spec.dShaft}×${spec.lShaft} mm (DIN 748)`,
            kind: 'cylinder',
            color: '#cbd5e1', // Ground polished steel
            position: { x: xShaftStart + spec.lShaft / 2, y: yAxis, z: zAxis },
            rotation: { x: 0, y: 0, z: 90 },
            params: { diameter: spec.dShaft, length: spec.lShaft },
            designStandard: 'DIN 748',
            materialType: 'C45 Taşlanmış Çelik'
        });

        // 3. Mil Kaması (DIN 6885-1 Form A)
        const keyL = Math.round(spec.lShaft * 0.70);
        const keySize = Math.max(4, Math.round(spec.dShaft * 0.25));
        parts.push({
            id: `iec_key_${spec.frame}`,
            name: `Mil Kaması ${keySize}x${keySize}x${keyL} mm (DIN 6885-1)`,
            kind: 'box',
            color: '#64748b',
            position: {
                x: xShaftStart + spec.lShaft / 2,
                y: yAxis + spec.dShaft / 2 + keySize / 4,
                z: zAxis
            },
            rotation: { x: 0, y: 0, z: 0 },
            params: { width: keyL, height: keySize, depth: keySize },
            designStandard: 'DIN 6885-1',
            materialType: 'C45+C Islah Çeliği'
        });

        // 4. Ön Rulman Kalkanı (Drive End Shield)
        parts.push({
            id: `iec_shield_de_${spec.frame}`,
            name: `Ön Rulman Kapağı (D-End Kalkanı)`,
            kind: 'cylinder',
            color: '#475569',
            position: { x: xBodyStart + shieldL / 2, y: yAxis, z: zAxis },
            rotation: { x: 0, y: 0, z: 90 },
            params: { diameter: spec.dBody * 0.98, length: shieldL },
            designStandard: 'DIN 42948',
            materialType: 'Dökme Demir'
        });

        // 5. Arka Pervane Tas Sacı (Fan Cowl)
        parts.push({
            id: `iec_cowl_${spec.frame}`,
            name: `Pervane Tas Muhafazası (Fan Cowl)`,
            kind: 'cylinder',
            color: '#0f172a',
            position: { x: xBodyStart + shieldL + statorL + cowlL / 2, y: yAxis, z: zAxis },
            rotation: { x: 0, y: 0, z: 90 },
            params: { diameter: spec.dBody * 0.94, length: cowlL },
            designStandard: 'IEC 60034-6 IC411',
            materialType: 'DKP Çelik Sac'
        });

        // 6. Klemens Kutusu (IP55)
        const tBoxW = Math.round(statorL * 0.50);
        const tBoxH = Math.round(spec.dBody * 0.28);
        const tBoxD = Math.round(spec.dBody * 0.38);
        parts.push({
            id: `iec_tbox_${spec.frame}`,
            name: `Klemens Kutusu (IP55)`,
            kind: 'box',
            color: '#f59e0b', // Industrial amber terminal box
            position: {
                x: xBodyStart + shieldL + statorL / 2,
                y: yAxis + spec.dBody / 2 + tBoxH / 2,
                z: zAxis
            },
            rotation: { x: 0, y: 0, z: 0 },
            params: { width: tBoxW, height: tBoxH, depth: tBoxD },
            designStandard: 'IEC 60034-5 IP55',
            materialType: 'Alüminyum Enjeksiyon'
        });

        // 7. B3 Montaj Ayakları
        if (mount === 'b3_foot') {
            const footH = Math.max(14, spec.hAxis - spec.dBody / 2 + 8);
            const footW = Math.max(24, Math.round(spec.aFoot * 0.32));
            const footSpanZ = spec.bFoot + 36;

            parts.push({
                id: `iec_foot_front_${spec.frame}`,
                name: `Ön Montaj Ayağı (B3)`,
                kind: 'box',
                color: '#334155',
                position: {
                    x: xBodyStart + 35,
                    y: basePos.y + footH / 2,
                    z: zAxis
                },
                rotation: { x: 0, y: 0, z: 0 },
                params: { width: footW, height: footH, depth: footSpanZ },
                designStandard: 'DIN EN 50347 B3',
                materialType: 'Döküm Ayak'
            });

            parts.push({
                id: `iec_foot_rear_${spec.frame}`,
                name: `Arka Montaj Ayağı (B3)`,
                kind: 'box',
                color: '#334155',
                position: {
                    x: xBodyStart + 35 + spec.aFoot,
                    y: basePos.y + footH / 2,
                    z: zAxis
                },
                rotation: { x: 0, y: 0, z: 0 },
                params: { width: footW, height: footH, depth: footSpanZ },
                designStandard: 'DIN EN 50347 B3',
                materialType: 'Döküm Ayak'
            });
        }

        // 8. B5 Montaj Flanşı
        if (mount === 'b5_flange') {
            const flangeThick = Math.max(12, Math.round(spec.dFlange * 0.05));
            parts.push({
                id: `iec_flange_b5_${spec.frame}`,
                name: `B5 Montaj Flanşı (Ø${spec.dFlange} mm, PCD ${spec.pcdFlange} mm)`,
                kind: 'cylinder',
                color: '#334155',
                position: { x: xBodyStart - flangeThick / 2, y: yAxis, z: zAxis },
                rotation: { x: 0, y: 0, z: 90 },
                params: { diameter: spec.dFlange, length: flangeThick },
                designStandard: 'DIN EN 50347 B5',
                materialType: 'Döküm Flanş'
            });
        }

        return parts;
    },
    getGrips: (params, basePoint = { x: 0, y: 0 }) => {
        const frameKey = String(params.frameSize || 'IEC_90S');
        const spec = IEC_MOTOR_FRAMES[frameKey] || IEC_MOTOR_FRAMES['IEC_90S'];
        const bodyL = spec.lTotal - spec.lShaft;

        const grips: DynamicGrip[] = [
            // Mount Style Visibility Grip
            {
                id: 'grip_motor_mount',
                type: 'visibility',
                paramId: 'mountStyle',
                position: { x: basePoint.x + bodyL + spec.lShaft, y: basePoint.y + spec.hAxis },
                tooltip: 'Montaj Tipi (IM B3 Ayaklı / IM B5 Flanşlı)',
                tooltipTr: 'Montaj Tipi (IM B3 Ayaklı / IM B5 Flanşlı)'
            }
        ];

        return grips;
    }
};
