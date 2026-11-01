/**
 * 🚰 Industrial Pipe Spool & Flange Dynamic Block (EN 1092-1 / ASME B16.5)
 * 
 * - Linear stretch: Spool Length (100 - 5000 mm)
 * - Lookup Table: Standard Nominal Diameters (DN15, DN25, DN50, DN80, DN100, DN150, DN200)
 * - Flange Ends: Both Ends, One End, With Blind Flange
 * - Visibility: Detailed Cross Section, P&ID Schematic Symbol, 3D Flanged Spool
 */

import { Point, CadEntity, createLineEntity, createRectangleEntity, createCircleEntity, createHatchEntity } from '../../../kernel/types';
import { DynamicBlockDef, DynamicGrip, DynamicPart3DDef } from '../types';

interface PipeFlangeSpec {
    dn: string;
    pipeOD: number;    // Pipe outer diameter (mm)
    pipeWall: number;  // Pipe wall thickness (mm)
    flangeD: number;   // Flange outer diameter (mm)
    flangeT: number;   // Flange thickness (mm)
    boltPCD: number;   // Bolt circle diameter (mm)
    boltHoles: number; // Number of bolt holes
    boltDia: number;   // Bolt hole diameter (mm)
}

export const PIPE_FLANGE_DB: Record<string, PipeFlangeSpec> = {
    DN15: { dn: 'DN15', pipeOD: 21.3, pipeWall: 2.0, flangeD: 95, flangeT: 16, boltPCD: 65, boltHoles: 4, boltDia: 14 },
    DN25: { dn: 'DN25', pipeOD: 33.7, pipeWall: 2.6, flangeD: 115, flangeT: 18, boltPCD: 85, boltHoles: 4, boltDia: 14 },
    DN50: { dn: 'DN50', pipeOD: 60.3, pipeWall: 2.9, flangeD: 165, flangeT: 18, boltPCD: 125, boltHoles: 4, boltDia: 18 },
    DN80: { dn: 'DN80', pipeOD: 88.9, pipeWall: 3.2, flangeD: 200, flangeT: 20, boltPCD: 160, boltHoles: 8, boltDia: 18 },
    DN100: { dn: 'DN100', pipeOD: 114.3, pipeWall: 3.6, flangeD: 220, flangeT: 20, boltPCD: 180, boltHoles: 8, boltDia: 18 },
    DN150: { dn: 'DN150', pipeOD: 168.3, pipeWall: 4.5, flangeD: 285, flangeT: 22, boltPCD: 240, boltHoles: 8, boltDia: 22 },
    DN200: { dn: 'DN200', pipeOD: 219.1, pipeWall: 5.9, flangeD: 340, flangeT: 24, boltPCD: 295, boltHoles: 12, boltDia: 22 },
    DN250: { dn: 'DN250', pipeOD: 273.0, pipeWall: 6.3, flangeD: 405, flangeT: 26, boltPCD: 355, boltHoles: 12, boltDia: 26 },
    DN300: { dn: 'DN300', pipeOD: 323.9, pipeWall: 7.1, flangeD: 460, flangeT: 28, boltPCD: 410, boltHoles: 12, boltDia: 26 }
};

export const DYN_PIPE_FLANGE: DynamicBlockDef = {
    id: 'dyn_pipe_flange',
    name: 'Industrial Pipe Spool & Flange',
    nameTr: 'Dinamik Sanayi Boru ve Flanş Bağlantısı',
    category: 'Piping',
    subcategory: 'Pipes & Flanges',
    subcategoryTr: 'Borular ve Flanşlar',
    description: 'AutoCAD-grade dynamic pipe spool: select nominal DN size (EN 1092-1), stretch spool length, configure flange ends.',
    descriptionTr: 'Standart DN boru çapı seçilir, spool boyu esnetilir, flanş bağlantıları, alın görünüşü ve P&ID sembolü dinamik üretilir.',
    icon: '🚰',
    citation: {
        tier: 1,
        standard: 'EN 1092-1 / ISO 7005-1 / ASME B16.5',
        clause: 'Clauses 5-6 (Flanges and their joints - Circular steel flanges PN designated)',
        description: 'Standard steel pipe dimensions (EN 10220), PN16 weld neck flange dimensions, and bolt PCDs.'
    },
    linearParams: [
        {
            id: 'length',
            name: 'length',
            label: 'Spool Length (L)',
            labelTr: 'Boru Spool Boyu (L)',
            min: 150,
            max: 5000,
            step: 50,
            default: 1000,
            unit: 'mm',
            axis: 'x'
        }
    ],
    flipParams: [],
    visibilityParam: {
        id: 'visState',
        name: 'visState',
        label: 'Piping Representation',
        labelTr: 'Tesisat Çizim Seviyesi',
        states: [
            { id: 'detailed_section', label: 'Detailed Cross Section (Flanşlı Detay Kesit)', labelTr: 'Detaylı Boyuna Kesit' },
            { id: 'flange_face', label: 'Flange Face Bolt View (Flanş Alın Görünüşü)', labelTr: 'Flanş Alın Görünüşü (Cıvata Dairesi)' },
            { id: 'pid_symbol', label: 'P&ID Schematic (İki Hatlı Akış Şematiği)', labelTr: 'P&ID Akış Şematiği' }
        ],
        default: 'detailed_section'
    },
    lookupParams: [
        {
            id: 'dnSize',
            name: 'dnSize',
            label: 'Nominal Pipe Diameter (DN)',
            labelTr: 'Anma Boru Çapı (DN)',
            options: Object.keys(PIPE_FLANGE_DB).map((k) => {
                const s = PIPE_FLANGE_DB[k];
                return {
                    id: k,
                    label: `${k} (Dış Çap: Ø${s.pipeOD} mm — Flanş: Ø${s.flangeD} mm)`,
                    standard: 'EN 1092-1 PN16',
                    values: { dnSize: k }
                };
            }),
            default: 'DN50'
        },
        {
            id: 'flangeConfig',
            name: 'flangeConfig',
            label: 'Flange Ends',
            labelTr: 'Flanş Uçları',
            options: [
                { id: 'both', label: 'Çift Taraflı Flanş (Both Ends)', values: { flangeConfig: 'both' } },
                { id: 'one_end', label: 'Tek Taraf Flanş + Kaynak Uç', values: { flangeConfig: 'one_end' } },
                { id: 'blind', label: 'Tek Flanş + Kör Flanşlı Kapalı Uç', values: { flangeConfig: 'blind' } }
            ],
            default: 'both'
        }
    ],
    defaultValues: {
        dnSize: 'DN50',
        length: 1000,
        flangeConfig: 'both',
        visState: 'detailed_section'
    },
    generate2D: (params, basePoint = { x: 0, y: 0 }) => {
        const dn = String(params.dnSize || 'DN50');
        const spec = PIPE_FLANGE_DB[dn] || PIPE_FLANGE_DB['DN50'];
        const length = Number(params.length) || 1000;
        const config = String(params.flangeConfig || 'both');
        const state = String(params.visState || 'detailed_section');

        const entities: CadEntity[] = [];
        const layer = 'layer-pipe';
        const colorPipe = '#3ad0e6';
        const colorFlange = '#f8fafc';
        const colorCenter = '#ef4444';

        const { pipeOD, pipeWall, flangeD, flangeT, boltPCD, boltHoles, boltDia } = spec;
        const innerD = pipeOD - pipeWall * 2;

        if (state === 'flange_face') {
            // Circular Flange Face View (EN 1092-1)
            const cx = basePoint.x + flangeD / 2;
            const cy = basePoint.y;
            entities.push(createCircleEntity({ x: cx, y: cy }, flangeD / 2, layer, colorFlange));
            entities.push(createCircleEntity({ x: cx, y: cy }, boltPCD / 2, 'layer-ref', '#64748b'));
            entities.push(createCircleEntity({ x: cx, y: cy }, pipeOD / 2, layer, colorPipe));
            entities.push(createCircleEntity({ x: cx, y: cy }, innerD / 2, layer, '#94a3b8'));
            // Raised face ring
            entities.push(createCircleEntity({ x: cx, y: cy }, (pipeOD + boltPCD - boltDia) / 4, 'layer-ref', '#475569'));
            // Crosshairs
            entities.push(createLineEntity({ x: cx - flangeD * 0.58, y: cy }, { x: cx + flangeD * 0.58, y: cy }, 'layer-ref', colorCenter));
            entities.push(createLineEntity({ x: cx, y: cy - flangeD * 0.58 }, { x: cx, y: cy + flangeD * 0.58 }, 'layer-ref', colorCenter));
            // Bolt holes off-center (straddling centerlines per EN 1092-1)
            const halfStep = Math.PI / boltHoles;
            for (let i = 0; i < boltHoles; i++) {
                const ang = halfStep + (i * 2 * Math.PI) / boltHoles;
                const bx = cx + (boltPCD / 2) * Math.cos(ang);
                const by = cy + (boltPCD / 2) * Math.sin(ang);
                entities.push(createCircleEntity({ x: bx, y: by }, boltDia / 2, layer, '#f59e0b'));
            }
            return entities;
        }

        // 1. Centerline
        entities.push(createLineEntity(
            { x: basePoint.x - 30, y: basePoint.y },
            { x: basePoint.x + length + 30, y: basePoint.y },
            layer,
            colorCenter
        ));

        if (state === 'pid_symbol') {
            // Simplified P&ID 2-line symbol
            entities.push(createLineEntity({ x: basePoint.x, y: basePoint.y + pipeOD / 2 }, { x: basePoint.x + length, y: basePoint.y + pipeOD / 2 }, layer, colorPipe));
            entities.push(createLineEntity({ x: basePoint.x, y: basePoint.y - pipeOD / 2 }, { x: basePoint.x + length, y: basePoint.y - pipeOD / 2 }, layer, colorPipe));
            // Flange tick lines
            entities.push(createLineEntity({ x: basePoint.x, y: basePoint.y - flangeD / 2 }, { x: basePoint.x, y: basePoint.y + flangeD / 2 }, layer, colorFlange));
            if (config === 'both' || config === 'blind') {
                entities.push(createLineEntity({ x: basePoint.x + length, y: basePoint.y - flangeD / 2 }, { x: basePoint.x + length, y: basePoint.y + flangeD / 2 }, layer, colorFlange));
            }
            return entities;
        }

        // Detailed Section with ISO 128 Cross-Section Hatches
        // Left Flange
        entities.push(createRectangleEntity(
            { x: basePoint.x + flangeT / 2, y: basePoint.y },
            flangeT,
            flangeD,
            layer,
            colorFlange
        ));
        // Left Flange upper & lower section hatches
        entities.push(createHatchEntity([
            { x: basePoint.x, y: basePoint.y + pipeOD / 2 },
            { x: basePoint.x + flangeT, y: basePoint.y + pipeOD / 2 },
            { x: basePoint.x + flangeT, y: basePoint.y + flangeD / 2 },
            { x: basePoint.x, y: basePoint.y + flangeD / 2 }
        ], 'ANSI31', layer, '#0284c7'));
        entities.push(createHatchEntity([
            { x: basePoint.x, y: basePoint.y - flangeD / 2 },
            { x: basePoint.x + flangeT, y: basePoint.y - flangeD / 2 },
            { x: basePoint.x + flangeT, y: basePoint.y - pipeOD / 2 },
            { x: basePoint.x, y: basePoint.y - pipeOD / 2 }
        ], 'ANSI31', layer, '#0284c7'));

        // Bolt holes (dashed lines on PCD)
        entities.push(createLineEntity({ x: basePoint.x, y: basePoint.y + boltPCD / 2 }, { x: basePoint.x + flangeT, y: basePoint.y + boltPCD / 2 }, layer, '#94a3b8'));
        entities.push(createLineEntity({ x: basePoint.x, y: basePoint.y - boltPCD / 2 }, { x: basePoint.x + flangeT, y: basePoint.y - boltPCD / 2 }, layer, '#94a3b8'));

        // Pipe Body (from left flange to right end)
        const pipeStartX = basePoint.x + flangeT;
        const hasRightFlange = config === 'both' || config === 'blind';
        const pipeEndX = hasRightFlange ? basePoint.x + length - flangeT : basePoint.x + length;
        const pipeLen = Math.max(10, pipeEndX - pipeStartX);

        // Pipe outer walls
        entities.push(createRectangleEntity(
            { x: pipeStartX + pipeLen / 2, y: basePoint.y },
            pipeLen,
            pipeOD,
            layer,
            colorPipe
        ));
        // Pipe inner bore walls
        entities.push(createLineEntity({ x: pipeStartX, y: basePoint.y + innerD / 2 }, { x: pipeEndX, y: basePoint.y + innerD / 2 }, layer, '#64748b'));
        entities.push(createLineEntity({ x: pipeStartX, y: basePoint.y - innerD / 2 }, { x: pipeEndX, y: basePoint.y - innerD / 2 }, layer, '#64748b'));

        // Pipe wall section hatches (upper and lower wall thickness)
        entities.push(createHatchEntity([
            { x: pipeStartX, y: basePoint.y + innerD / 2 },
            { x: pipeEndX, y: basePoint.y + innerD / 2 },
            { x: pipeEndX, y: basePoint.y + pipeOD / 2 },
            { x: pipeStartX, y: basePoint.y + pipeOD / 2 }
        ], 'ANSI31', layer, '#0ea5e9'));
        entities.push(createHatchEntity([
            { x: pipeStartX, y: basePoint.y - pipeOD / 2 },
            { x: pipeEndX, y: basePoint.y - pipeOD / 2 },
            { x: pipeEndX, y: basePoint.y - innerD / 2 },
            { x: pipeStartX, y: basePoint.y - innerD / 2 }
        ], 'ANSI31', layer, '#0ea5e9'));

        // Right End Flange
        if (hasRightFlange) {
            entities.push(createRectangleEntity(
                { x: basePoint.x + length - flangeT / 2, y: basePoint.y },
                flangeT,
                flangeD,
                layer,
                colorFlange
            ));
            entities.push(createHatchEntity([
                { x: basePoint.x + length - flangeT, y: basePoint.y + pipeOD / 2 },
                { x: basePoint.x + length, y: basePoint.y + pipeOD / 2 },
                { x: basePoint.x + length, y: basePoint.y + flangeD / 2 },
                { x: basePoint.x + length - flangeT, y: basePoint.y + flangeD / 2 }
            ], 'ANSI31', layer, '#0284c7'));
            entities.push(createHatchEntity([
                { x: basePoint.x + length - flangeT, y: basePoint.y - flangeD / 2 },
                { x: basePoint.x + length, y: basePoint.y - flangeD / 2 },
                { x: basePoint.x + length, y: basePoint.y - pipeOD / 2 },
                { x: basePoint.x + length - flangeT, y: basePoint.y - pipeOD / 2 }
            ], 'ANSI31', layer, '#0284c7'));

            // Bolt holes
            entities.push(createLineEntity({ x: basePoint.x + length - flangeT, y: basePoint.y + boltPCD / 2 }, { x: basePoint.x + length, y: basePoint.y + boltPCD / 2 }, layer, '#94a3b8'));
            entities.push(createLineEntity({ x: basePoint.x + length - flangeT, y: basePoint.y - boltPCD / 2 }, { x: basePoint.x + length, y: basePoint.y - boltPCD / 2 }, layer, '#94a3b8'));

            if (config === 'blind') {
                // Extra blind flange plate bolted on with opposing CROSS hatch
                entities.push(createRectangleEntity(
                    { x: basePoint.x + length + flangeT / 2, y: basePoint.y },
                    flangeT,
                    flangeD,
                    layer,
                    '#f59e0b'
                ));
                entities.push(createHatchEntity([
                    { x: basePoint.x + length, y: basePoint.y - flangeD / 2 },
                    { x: basePoint.x + length + flangeT, y: basePoint.y - flangeD / 2 },
                    { x: basePoint.x + length + flangeT, y: basePoint.y + flangeD / 2 },
                    { x: basePoint.x + length, y: basePoint.y + flangeD / 2 }
                ], 'CROSS', layer, '#d97706'));
            }
        }

        return entities;
    },
    generate3D: (params, basePos = { x: 0, y: 0, z: 0 }) => {
        const dn = String(params.dnSize || 'DN50');
        const spec = PIPE_FLANGE_DB[dn] || PIPE_FLANGE_DB['DN50'];
        const length = Number(params.length) || 1000;
        const { pipeOD, pipeWall, flangeD, flangeT } = spec;

        const parts: DynamicPart3DDef[] = [
            // Left Flange Disc (Hollow Bore)
            {
                id: `flange_l_${Date.now()}`,
                name: `${dn} PN16 Kaynak Boyunlu Flanş (Sol)`,
                kind: 'tube',
                color: '#64748b',
                position: { x: basePos.x + flangeT / 2, y: basePos.y, z: basePos.z },
                rotation: { x: 0, y: 90, z: 0 },
                params: { diameter: flangeD, wall: (flangeD - pipeOD) / 2, length: flangeT },
                designStandard: 'EN 1092-1'
            },
            // Pipe Body Tube
            {
                id: `pipe_body_${Date.now()}`,
                name: `${dn} Çelik Boru Gövdesi (L=${length} mm)`,
                kind: 'tube',
                color: '#38bdf8',
                position: { x: basePos.x + length / 2, y: basePos.y, z: basePos.z },
                rotation: { x: 0, y: 90, z: 0 },
                params: { diameter: pipeOD, wall: pipeWall, length: Math.max(10, length - flangeT * 2) },
                designStandard: 'EN 10220'
            },
            // Right Flange Disc (Hollow Bore)
            {
                id: `flange_r_${Date.now()}`,
                name: `${dn} PN16 Kaynak Boyunlu Flanş (Sağ)`,
                kind: 'tube',
                color: '#64748b',
                position: { x: basePos.x + length - flangeT / 2, y: basePos.y, z: basePos.z },
                rotation: { x: 0, y: 90, z: 0 },
                params: { diameter: flangeD, wall: (flangeD - pipeOD) / 2, length: flangeT },
                designStandard: 'EN 1092-1'
            }
        ];

        return parts;
    },
    getGrips: (params, basePoint = { x: 0, y: 0 }) => {
        const length = Number(params.length) || 1000;

        const grips: DynamicGrip[] = [
            // Linear Stretch Length Grip
            {
                id: 'grip_pipe_length',
                type: 'stretch',
                paramId: 'length',
                position: { x: basePoint.x + length, y: basePoint.y },
                direction: { x: 1, y: 0 },
                tooltip: `Grip: Spool Boru Boyu (${length} mm)`,
                tooltipTr: `Grip: Spool Boru Boyu (${length} mm)`
            },
            // Visibility State
            {
                id: 'grip_pipe_vis',
                type: 'visibility',
                paramId: 'visState',
                position: { x: basePoint.x - 30, y: basePoint.y - 20 },
                tooltip: 'Görünüş Değiştir (Detay Kesit / P&ID Şematik)',
                tooltipTr: 'Görünüş Değiştir (Detay Kesit / P&ID Şematik)'
            }
        ];

        return grips;
    }
};
