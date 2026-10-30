/**
 * 🧱 Dynamic Flanged Ball & Process Valve (EN 558-1 / ISO 5211 / EN 1092-1 PN16)
 *
 * - Lookup Catalog: DN25, DN40, DN50, DN65, DN80, DN100, DN150, DN200 Flanged Process Valves
 * - Linear Params: Valve Opening Angle (0° Closed – 90° Fully Open)
 * - Visibility States:
 *    - Axial Cross-Section (Boyuna Kesit — Flanşlı Gövde, Paslanmaz Küre, PTFE Ringler ve ISO 128 HATCH)
 *    - Exterior Front View (Dış Görünüş — ISO 5211 Tepe Flanşı ve Kumanda Kolu)
 *    - ISO 10628 P&ID Process Schematic Symbol (Akış Şeması Sembolü)
 * - 3D Solids: Flanged valve housing + spherical core + valve stem + lever handle
 */

import {
    CadEntity,
    createLineEntity,
    createRectangleEntity,
    createCircleEntity,
    createHatchEntity
} from '../../../kernel/types';
import { DynamicBlockDef, DynamicGrip, DynamicPart3DDef } from '../types';

export interface IndustrialValveSpec {
    code: string;
    DN: number;        // Nominal bore diameter (mm)
    L: number;         // Face-to-face length EN 558-1 Series 1 (mm)
    flangeD: number;   // Flange outer diameter EN 1092-1 PN16 (mm)
    flangeB: number;   // Flange thickness (mm)
    ballD: number;     // Stainless ball outer diameter (mm)
    stemH: number;     // Top stem center height (mm)
    leverL: number;    // Manual lever length (mm)
    iso5211: string;   // Top mounting pad (F04–F12)
    kvValue: number;   // Flow coefficient Kv (m³/h)
}

export const INDUSTRIAL_VALVE_CATALOG: Record<string, IndustrialValveSpec> = {
    DN25:  { code: 'DN25',  DN: 25,  L: 160, flangeD: 115, flangeB: 18, ballD: 42,  stemH: 72,  leverL: 145, iso5211: 'F04', kvValue: 48 },
    DN40:  { code: 'DN40',  DN: 40,  L: 200, flangeD: 150, flangeB: 18, ballD: 64,  stemH: 92,  leverL: 185, iso5211: 'F05', kvValue: 125 },
    DN50:  { code: 'DN50',  DN: 50,  L: 230, flangeD: 165, flangeB: 20, ballD: 78,  stemH: 108, leverL: 210, iso5211: 'F07', kvValue: 210 },
    DN65:  { code: 'DN65',  DN: 65,  L: 290, flangeD: 185, flangeB: 22, ballD: 100, stemH: 128, leverL: 260, iso5211: 'F07', kvValue: 350 },
    DN80:  { code: 'DN80',  DN: 80,  L: 310, flangeD: 200, flangeB: 24, ballD: 120, stemH: 145, leverL: 300, iso5211: 'F10', kvValue: 540 },
    DN100: { code: 'DN100', DN: 100, L: 350, flangeD: 220, flangeB: 24, ballD: 152, stemH: 172, leverL: 360, iso5211: 'F10', kvValue: 920 },
    DN150: { code: 'DN150', DN: 150, L: 480, flangeD: 285, flangeB: 26, ballD: 220, stemH: 230, leverL: 480, iso5211: 'F12', kvValue: 2150 },
    DN200: { code: 'DN200', DN: 200, L: 600, flangeD: 340, flangeB: 30, ballD: 290, stemH: 285, leverL: 600, iso5211: 'F14', kvValue: 3900 }
};

export const DYN_INDUSTRIAL_VALVE: DynamicBlockDef = {
    id: 'dyn_industrial_valve',
    name: 'Flanged Ball Valve & ISO 5211 Actuator Pad (EN 558-1 / PN16)',
    nameTr: 'Dinamik Flanşlı Küresel Vana & Proses Valfi (EN 558-1 / PN16)',
    category: 'Piping',
    subcategory: 'Valves & Flow Control',
    subcategoryTr: 'Vana ve Akışkan Kontrol Elemanları',
    description: 'EN 558-1 / EN 1092-1 PN16 flanged full-bore ball valve (DN25–DN200) with ISO 5211 actuator pad, adjustable opening angle (0°–90°), ISO 128 cross-section hatch, and ISO 10628 P&ID symbol.',
    descriptionTr: 'EN 558-1 / PN16 normunda tam geçişli flanşlı küresel vana (DN25–DN200); ayarlanabilir açılma açısı (0°–90°), boyuna kesit (ISO 128 HATCH), dış görünüş ve P&ID şema sembolü.',
    icon: '🚰',
    calculatorRoute: '/fluid-dynamics/',
    calculatorModuleType: 'fluid-dynamics',
    calculatorLabelTr: 'Boru Hattı ve Vana Basınç Kaybı Hesabına Git',
    citation: {
        tier: 1,
        standard: 'EN 558-1:2017 / EN 1092-1 PN16 / ISO 5211 / ISO 10628',
        clause: 'Industrial valves — Face-to-face dimensions and top flange attachment',
        description: 'Standard Series 1 face-to-face lengths L, PN16 flange diameters, and Kv flow coefficients.'
    },
    linearParams: [
        {
            id: 'openAngle',
            name: 'openAngle',
            label: 'Valve Opening Angle (0°–90°)',
            labelTr: 'Vana Açıklık Açısı (0°–90°)',
            min: 0,
            max: 90,
            step: 15,
            default: 90,
            unit: '°',
            axis: 'x'
        }
    ],
    flipParams: [
        {
            id: 'flipLever',
            name: 'flipLever',
            label: 'Flip Lever Direction',
            labelTr: 'Kol Yönünü Çevir',
            axis: 'horizontal',
            default: false
        }
    ],
    visibilityParam: {
        id: 'viewMode',
        name: 'viewMode',
        label: 'View / Section Mode',
        labelTr: 'Görünüş / Kesit Modu',
        states: [
            { id: 'axial_section', label: 'Axial Cross-Section (Boyuna Kesit — Küre & PTFE Keçe HATCH)', labelTr: 'Boyuna Kesit (Paslanmaz Küre, PTFE Yatak & Flanş — HATCH)' },
            { id: 'exterior_front', label: 'Exterior Elevation View (Dış Görünüş — Flanşlı Gövde & Kol)', labelTr: 'Dış Ön Görünüş (Flanşlı Gövde & Kumanda Kolu)' },
            { id: 'pid_symbol', label: 'ISO 10628 P&ID Schematic Symbol (Akış Şeması Sembolü)', labelTr: 'ISO 10628 P&ID Proses Akış Şeması Sembolü' }
        ],
        default: 'axial_section'
    },
    lookupParams: [
        {
            id: 'valveSize',
            name: 'valveSize',
            label: 'Nominal Valve Size (DN — PN16)',
            labelTr: 'Anma Çapı (DN25 – DN200 PN16)',
            options: Object.values(INDUSTRIAL_VALVE_CATALOG).map((v) => ({
                id: v.code,
                label: `${v.code} (L=${v.L}mm, Flanş Ø${v.flangeD}mm, Tepe ${v.iso5211}, Kv=${v.kvValue} m³/h)`,
                standard: 'EN 558-1 / PN16',
                values: { valveSize: v.code }
            })),
            default: 'DN80'
        }
    ],
    defaultValues: {
        valveSize: 'DN80',
        openAngle: 90,
        flipLever: false,
        viewMode: 'axial_section'
    },
    generate2D: (params, basePoint = { x: 0, y: 0 }) => {
        const sizeKey = String(params.valveSize || 'DN80');
        const spec = INDUSTRIAL_VALVE_CATALOG[sizeKey] || INDUSTRIAL_VALVE_CATALOG.DN80;
        const openAngle = Math.max(0, Math.min(90, Number(params.openAngle) ?? 90));
        const flip = Boolean(params.flipLever);
        const viewMode = String(params.viewMode || 'axial_section');

        const { DN, L, flangeD, flangeB, ballD, stemH, leverL } = spec;
        const entities: CadEntity[] = [];
        const layerBody = 'layer-mech';
        const layerTrim = 'layer-accent';
        const layerRef = 'layer-ref';

        const cx = basePoint.x;
        const cy = basePoint.y;
        const dir = flip ? -1 : 1;

        if (viewMode === 'pid_symbol') {
            // ISO 10628 P&ID Flanged Ball Valve Symbol
            const symW = L * 0.75;
            const symH = flangeD * 0.55;
            entities.push(
                createLineEntity({ x: cx - L / 2 - 20, y: cy }, { x: cx + L / 2 + 20, y: cy }, layerRef, '#ef4444'),
                // Bowtie triangles
                createLineEntity({ x: cx - symW / 2, y: cy - symH / 2 }, { x: cx - symW / 2, y: cy + symH / 2 }, layerBody, '#38bdf8'),
                createLineEntity({ x: cx - symW / 2, y: cy - symH / 2 }, { x: cx, y: cy }, layerBody, '#38bdf8'),
                createLineEntity({ x: cx - symW / 2, y: cy + symH / 2 }, { x: cx, y: cy }, layerBody, '#38bdf8'),
                createLineEntity({ x: cx + symW / 2, y: cy - symH / 2 }, { x: cx + symW / 2, y: cy + symH / 2 }, layerBody, '#38bdf8'),
                createLineEntity({ x: cx + symW / 2, y: cy - symH / 2 }, { x: cx, y: cy }, layerBody, '#38bdf8'),
                createLineEntity({ x: cx + symW / 2, y: cy + symH / 2 }, { x: cx, y: cy }, layerBody, '#38bdf8'),
                // Central Ball Circle & Stem T-Handle
                createCircleEntity({ x: cx, y: cy }, symH * 0.28, layerTrim, '#f59e0b'),
                createLineEntity({ x: cx, y: cy + symH * 0.28 }, { x: cx, y: cy + symH * 0.85 }, layerTrim, '#f59e0b'),
                createLineEntity({ x: cx - symH * 0.3, y: cy + symH * 0.85 }, { x: cx + symH * 0.65 * dir, y: cy + symH * 0.85 }, layerTrim, '#22c55e')
            );
            return entities;
        }

        // Flow Axis & Vertical Stem Axis
        entities.push(
            createLineEntity({ x: cx - L / 2 - 18, y: cy }, { x: cx + L / 2 + 18, y: cy }, layerRef, '#ef4444'),
            createLineEntity({ x: cx, y: cy - flangeD / 2 - 12 }, { x: cx, y: cy + stemH + 30 }, layerRef, '#ef4444')
        );

        // Left & Right PN16 Flanges
        const leftFlangeX = cx - L / 2 + flangeB / 2;
        const rightFlangeX = cx + L / 2 - flangeB / 2;
        entities.push(
            createRectangleEntity({ x: leftFlangeX, y: cy }, flangeB, flangeD, layerBody, '#38bdf8'),
            createRectangleEntity({ x: rightFlangeX, y: cy }, flangeB, flangeD, layerBody, '#38bdf8')
        );

        // Central Bolted Split Body
        const bodyMidD = ballD * 1.32;
        const innerSpan = L - flangeB * 2;
        entities.push(
            createRectangleEntity({ x: cx, y: cy }, innerSpan, DN * 1.42, layerBody, '#38bdf8'),
            createCircleEntity({ x: cx, y: cy }, bodyMidD / 2, layerBody, '#38bdf8')
        );

        // Top Stem Bonnet, ISO 5211 Mounting Pad & Manual Lever Handle
        const stemW = Math.max(14, DN * 0.24);
        entities.push(
            createRectangleEntity({ x: cx, y: cy + (bodyMidD / 2 + stemH) / 2 }, stemW * 1.8, stemH - bodyMidD / 2, layerBody, '#94a3b8'),
            createRectangleEntity({ x: cx, y: cy + stemH }, stemW * 3.2, 10, layerTrim, '#f59e0b'),
            // Manual Lever Handle
            createRectangleEntity({ x: cx + dir * (leverL * 0.42), y: cy + stemH + 12 }, leverL * 0.88, 12, layerTrim, '#22c55e')
        );

        if (viewMode === 'exterior_front') {
            // Exterior body bolt circle studs
            entities.push(
                createCircleEntity({ x: cx, y: cy }, DN * 0.35, layerRef, '#64748b')
            );
            return entities;
        }

        // Axial Cross-Section Mode (ISO 128 HATCH)
        const rBore = DN / 2;
        const rFlange = flangeD / 2;
        const rBall = ballD / 2;

        // Top & Bottom Flange Section Hatches
        for (const fx of [leftFlangeX, rightFlangeX]) {
            entities.push(
                createHatchEntity([
                    { x: fx - flangeB / 2, y: cy + rBore },
                    { x: fx + flangeB / 2, y: cy + rBore },
                    { x: fx + flangeB / 2, y: cy + rFlange },
                    { x: fx - flangeB / 2, y: cy + rFlange }
                ], 'ANSI31', layerBody, '#0284c7'),
                createHatchEntity([
                    { x: fx - flangeB / 2, y: cy - rFlange },
                    { x: fx + flangeB / 2, y: cy - rFlange },
                    { x: fx + flangeB / 2, y: cy - rBore },
                    { x: fx - flangeB / 2, y: cy - rBore }
                ], 'ANSI31', layerBody, '#0284c7')
            );
        }

        // Stainless Steel Ball Core & Bore Channel rotated by openAngle
        entities.push(
            createCircleEntity({ x: cx, y: cy }, rBall, layerTrim, '#f59e0b')
        );

        // Effective bore opening projection based on openAngle (90° = full open, 0° = closed wall)
        const openRatio = Math.sin((openAngle * Math.PI) / 180);
        const effBoreHalf = rBore * openRatio;

        // Hatched Stainless Ball Hemispheres above and below the open bore
        if (rBall > effBoreHalf + 2) {
            const chordW = Math.sqrt(Math.max(16, rBall * rBall - effBoreHalf * effBoreHalf)) * 1.65;
            entities.push(
                createHatchEntity([
                    { x: cx - chordW / 2, y: cy + effBoreHalf },
                    { x: cx + chordW / 2, y: cy + effBoreHalf },
                    { x: cx + chordW * 0.35, y: cy + rBall * 0.92 },
                    { x: cx - chordW * 0.35, y: cy + rBall * 0.92 }
                ], 'ANSI31', layerTrim, '#d97706'),
                createHatchEntity([
                    { x: cx - chordW * 0.35, y: cy - rBall * 0.92 },
                    { x: cx + chordW * 0.35, y: cy - rBall * 0.92 },
                    { x: cx + chordW / 2, y: cy - effBoreHalf },
                    { x: cx - chordW / 2, y: cy - effBoreHalf }
                ], 'ANSI31', layerTrim, '#d97706')
            );
        }

        // Flow Bore Lines
        entities.push(
            createLineEntity({ x: cx - L / 2, y: cy + rBore }, { x: cx + L / 2, y: cy + rBore }, layerTrim, '#f8fafc'),
            createLineEntity({ x: cx - L / 2, y: cy - rBore }, { x: cx + L / 2, y: cy - rBore }, layerTrim, '#f8fafc')
        );

        return entities;
    },
    generate3D: (params, basePos = { x: 0, y: 0, z: 0 }) => {
        const sizeKey = String(params.valveSize || 'DN80');
        const spec = INDUSTRIAL_VALVE_CATALOG[sizeKey] || INDUSTRIAL_VALVE_CATALOG.DN80;
        const { L, flangeD, flangeB, ballD, stemH, leverL } = spec;

        return [
            {
                id: 'valve-body',
                name: `${spec.code} Flanged Valve Body`,
                kind: 'cylinder',
                color: '#0284c7',
                position: { x: basePos.x, y: basePos.y + flangeD / 2, z: basePos.z },
                rotation: { x: 0, y: 0, z: Math.PI / 2 },
                params: { diameter: ballD * 1.28, length: L }
            },
            {
                id: 'valve-flange-left',
                name: 'Left PN16 Flange',
                kind: 'cylinder',
                color: '#38bdf8',
                position: { x: basePos.x - L / 2 + flangeB / 2, y: basePos.y + flangeD / 2, z: basePos.z },
                rotation: { x: 0, y: 0, z: Math.PI / 2 },
                params: { diameter: flangeD, length: flangeB }
            },
            {
                id: 'valve-flange-right',
                name: 'Right PN16 Flange',
                kind: 'cylinder',
                color: '#38bdf8',
                position: { x: basePos.x + L / 2 - flangeB / 2, y: basePos.y + flangeD / 2, z: basePos.z },
                rotation: { x: 0, y: 0, z: Math.PI / 2 },
                params: { diameter: flangeD, length: flangeB }
            },
            {
                id: 'valve-lever',
                name: 'Quarter-Turn Valve Handle',
                kind: 'box',
                color: '#22c55e',
                position: { x: basePos.x + leverL * 0.35, y: basePos.y + flangeD / 2 + stemH, z: basePos.z },
                params: { width: leverL * 0.8, height: 12, depth: 22 }
            }
        ];
    },
    getGrips: (params, basePoint = { x: 0, y: 0 }): DynamicGrip[] => {
        const sizeKey = String(params.valveSize || 'DN80');
        const spec = INDUSTRIAL_VALVE_CATALOG[sizeKey] || INDUSTRIAL_VALVE_CATALOG.DN80;
        const openAngle = Math.max(0, Math.min(90, Number(params.openAngle) ?? 90));

        return [
            {
                id: 'grip-origin',
                type: 'point',
                paramId: 'basePoint',
                position: { x: basePoint.x, y: basePoint.y },
                tooltip: 'Move Flanged Ball Valve',
                tooltipTr: 'Flanşlı Küresel Vanayı Taşı'
            },
            {
                id: 'grip-open-angle',
                type: 'linear',
                paramId: 'openAngle',
                position: { x: basePoint.x + spec.L / 2, y: basePoint.y + spec.stemH },
                direction: { x: 1, y: 0 },
                label: `Open=${openAngle}°`,
                labelTr: `Vana Açıklığı=${openAngle}°`
            }
        ];
    }
};
