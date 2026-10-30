/**
 * 🛏️ Dynamic Bed with Pillows & Nightstands (DWGShare Bedroom Collection)
 * 
 * - Standard Lookup: Single (900x2000), 1.5-Size (1200x2000), Double (1400x2000), Queen (1600x2000), King (1800x2000), Super King (2000x2000)
 * - Automatic pillow array: 1 pillow for single, 2 for double/queen, 3/4 for king
 * - Dynamic Nightstand toggles: Both, Left only, Right only, None
 * - Visibility: Plan View, Front Elevation
 */

import { Point, CadEntity, createLineEntity, createRectangleEntity, createCircleEntity } from '../../../kernel/types';
import { DynamicBlockDef, DynamicGrip, DynamicPart3DDef } from '../types';

export const DYN_BED: DynamicBlockDef = {
    id: 'dyn_bed',
    name: 'Dynamic Bed & Nightstands Set',
    nameTr: 'Dinamik Yatak ve Komodin Takımı',
    category: 'Furniture',
    subcategory: 'Bedroom',
    subcategoryTr: 'Yatak Odası',
    description: 'AutoCAD-grade dynamic bed: snaps to standard mattress sizes, automatically arrays pillows and attaches nightstands.',
    descriptionTr: 'Standart yatak ebatlarına kenetlenen, yastıkları otomatik dizen ve komodinleri ekleyen dinamik yatak takımı.',
    icon: '🛏️',
    citation: {
        tier: 2,
        standard: 'EN 1334 / ISO 19833',
        clause: 'Clauses 4-5 (Domestic furniture - Beds and mattresses - Methods of measurement and recommended tolerances)',
        description: 'Standard metric mattress sizes (900, 1400, 1600, 1800, 2000 mm x 2000 mm) and headboard ergonomic heights.'
    },
    linearParams: [
        {
            id: 'bedWidth',
            name: 'bedWidth',
            label: 'Mattress Width',
            labelTr: 'Yatak Genişliği',
            min: 900,
            max: 2200,
            step: 100,
            default: 1600,
            unit: 'mm',
            axis: 'x'
        }
    ],
    visibilityParam: {
        id: 'nightstandMode',
        name: 'nightstandMode',
        label: 'Nightstand Configuration',
        labelTr: 'Komodin Yapılandırması',
        states: [
            { id: 'both', label: 'Both Sides (İki Yanda Komodin)', labelTr: 'Çift Komodin' },
            { id: 'left_only', label: 'Left Side Only (Yalnız Sol)', labelTr: 'Sol Komodin' },
            { id: 'right_only', label: 'Right Side Only (Yalnız Sağ)', labelTr: 'Sağ Komodin' },
            { id: 'none', label: 'No Nightstands (Komodinsiz)', labelTr: 'Komodinsiz' }
        ],
        default: 'both'
    },
    lookupParams: [
        {
            id: 'mattressSize',
            name: 'mattressSize',
            label: 'Standard Mattress Size',
            labelTr: 'Standart Yatak Boyutu',
            options: [
                { id: 'size_single', label: 'Tek Kişilik (900 × 2000 mm)', values: { bedWidth: 900 } },
                { id: 'size_1_5', label: 'Bir Buçuk Kişilik (1200 × 2000 mm)', values: { bedWidth: 1200 } },
                { id: 'size_double', label: 'Standart Çift Kişilik (1400 × 2000 mm)', values: { bedWidth: 1400 } },
                { id: 'size_queen', label: 'Queen Size (1600 × 2000 mm)', values: { bedWidth: 1600 } },
                { id: 'size_king', label: 'King Size (1800 × 2000 mm)', values: { bedWidth: 1800 } },
                { id: 'size_super_king', label: 'Super King (2000 × 2000 mm)', values: { bedWidth: 2000 } }
            ],
            default: 'size_queen'
        }
    ],
    arrayActions: [
        {
            id: 'array_pillows',
            linearParamId: 'bedWidth',
            spacing: 700,
            minCount: 1,
            maxCount: 4,
            label: 'Pillow Array',
            labelTr: 'Yastık Dizilimi'
        }
    ],
    defaultValues: {
        bedWidth: 1600,
        nightstandMode: 'both'
    },
    generate2D: (params, basePoint = { x: 0, y: 0 }) => {
        const w = Number(params.bedWidth) || 1600;
        const len = 2000;
        const mode = String(params.nightstandMode || 'both');

        const entities: CadEntity[] = [];
        const layer = 'layer-furn';
        const colorBed = '#3ad0e6';
        const colorLinen = '#f8fafc';
        const colorAccent = '#64748b';

        const headboardD = 80;
        const headboardH = w + 100;
        const nsW = 500;
        const nsD = 400;

        // 1. Headboard (Top of bed)
        entities.push(createRectangleEntity(
            { x: basePoint.x + w / 2, y: basePoint.y + len + headboardD / 2 },
            w + 80,
            headboardD,
            layer,
            colorAccent
        ));

        // 2. Mattress
        entities.push(createRectangleEntity(
            { x: basePoint.x + w / 2, y: basePoint.y + len / 2 },
            w,
            len,
            layer,
            colorBed
        ));

        // 3. Duvet Cover (Yorgan katı: bottom 1400mm)
        entities.push(createRectangleEntity(
            { x: basePoint.x + w / 2, y: basePoint.y + 700 },
            w - 20,
            1400,
            layer,
            colorLinen
        ));
        entities.push(createLineEntity(
            { x: basePoint.x + 10, y: basePoint.y + 1400 },
            { x: basePoint.x + w - 10, y: basePoint.y + 1400 },
            layer,
            colorAccent
        ));

        // 4. Dynamic Pillow Array (At head of bed: 1 for single, 2 for double, 3 for king)
        const pillowW = 600;
        const pillowD = 400;
        const pillowCount = w <= 1000 ? 1 : (w <= 1600 ? 2 : (w <= 1900 ? 3 : 4));
        const pillowSpacing = (w - 100) / pillowCount;

        for (let p = 0; p < pillowCount; p++) {
            const px = basePoint.x + 50 + p * pillowSpacing + pillowSpacing / 2;
            const py = basePoint.y + len - pillowD / 2 - 40;
            entities.push(createRectangleEntity(
                { x: px, y: py },
                Math.min(pillowW, pillowSpacing - 20),
                pillowD,
                layer,
                colorLinen
            ));
        }

        // 5. Nightstands (Komodinler)
        const hasLeft = mode === 'both' || mode === 'left_only';
        const hasRight = mode === 'both' || mode === 'right_only';

        if (hasLeft) {
            const nsLeftCenter = { x: basePoint.x - nsW / 2 - 20, y: basePoint.y + len - nsD / 2 };
            entities.push(createRectangleEntity(nsLeftCenter, nsW, nsD, layer, colorAccent));
            // Bedside Lamp Circle
            entities.push(createCircleEntity(nsLeftCenter, 80, layer, '#f59e0b'));
        }

        if (hasRight) {
            const nsRightCenter = { x: basePoint.x + w + nsW / 2 + 20, y: basePoint.y + len - nsD / 2 };
            entities.push(createRectangleEntity(nsRightCenter, nsW, nsD, layer, colorAccent));
            // Bedside Lamp Circle
            entities.push(createCircleEntity(nsRightCenter, 80, layer, '#f59e0b'));
        }

        return entities;
    },
    generate3D: (params, basePos = { x: 0, y: 0, z: 0 }) => {
        const w = Number(params.bedWidth) || 1600;
        const len = 2000;
        const bedH = 500;
        const headH = 1000;

        const parts: DynamicPart3DDef[] = [
            // Mattress Box
            {
                id: `bed_mattress_${Date.now()}`,
                name: `Ortopedik Yatak (${w}x${len} mm)`,
                kind: 'box',
                color: '#f8fafc',
                position: { x: basePos.x + w / 2, y: basePos.y + len / 2, z: basePos.z + bedH / 2 },
                rotation: { x: 0, y: 0, z: 0 },
                params: { width: w, height: len, depth: bedH },
                designStandard: 'EN 1334'
            },
            // Headboard
            {
                id: `bed_headboard_${Date.now()}`,
                name: 'Döşemeli Yatak Başlığı',
                kind: 'box',
                color: '#334155',
                position: { x: basePos.x + w / 2, y: basePos.y + len + 40, z: basePos.z + headH / 2 },
                rotation: { x: 0, y: 0, z: 0 },
                params: { width: w + 100, height: 80, depth: headH }
            }
        ];

        return parts;
    },
    getGrips: (params, basePoint = { x: 0, y: 0 }) => {
        const w = Number(params.bedWidth) || 1600;

        const grips: DynamicGrip[] = [
            // Linear Stretch Width Grip
            {
                id: 'grip_bed_width',
                type: 'stretch',
                paramId: 'bedWidth',
                position: { x: basePoint.x + w, y: basePoint.y + 1000 },
                direction: { x: 1, y: 0 },
                tooltip: `Grip: Yatak Genişliği (${w} mm)`,
                tooltipTr: `Grip: Yatak Genişliği (${w} mm)`
            },
            // Visibility State (Nightstand mode)
            {
                id: 'grip_bed_vis',
                type: 'visibility',
                paramId: 'nightstandMode',
                position: { x: basePoint.x - 30, y: basePoint.y - 30 },
                tooltip: 'Komodin Yapılandırması (Çift / Sol / Sağ / Yok)',
                tooltipTr: 'Komodin Yapılandırması (Çift / Sol / Sağ / Yok)'
            }
        ];

        return grips;
    }
};
