/**
 * 🛋️ Dynamic Conference & Dining Table with Chair Array (AutoCAD Dynamic Block Pattern)
 * 
 * As showcased in dynamic block tutorials:
 * - Linear stretch: Length (1200 - 4800 mm) & Width (800 - 1600 mm)
 * - Array Action: Extending table length automatically arrays chairs along top & bottom edges!
 * - Toggle: End chairs (Head & Foot of table)
 * - Visibility: Plan View, Simplified Schematic, 3D Parametric Set
 * - Standard Lookup: 4-Person, 6-Person, 8-Person, 10-Person, 12-Person, 16-Person Boardroom
 */

import { Point, CadEntity, createLineEntity, createArcEntity, createRectangleEntity, createCircleEntity } from '../../../kernel/types';
import { DynamicBlockDef, DynamicGrip, DynamicPart3DDef } from '../types';

export const DYN_TABLE_CHAIRS: DynamicBlockDef = {
    id: 'dyn_table_chairs',
    name: 'Dynamic Table with Chair Array',
    nameTr: 'Dinamik Sandalye Dizili Toplantı Masası',
    category: 'Furniture',
    subcategory: 'Dining & Meeting',
    subcategoryTr: 'Yemek ve Toplantı Grubu',
    description: 'AutoCAD-style dynamic table: stretching table length automatically arrays chairs evenly along both sides.',
    descriptionTr: 'AutoCAD tarzı dinamik masa: Masa boyu esnetildikçe iki yana sandalyeler otomatik olarak çoğalır.',
    icon: '🪑',
    citation: {
        tier: 2,
        standard: 'DIN EN 527-1 / BIFMA X5.5',
        clause: 'Clauses 5.1-5.4 (Office furniture - Tables and desks - Dimensions)',
        description: 'Standard ergonomic table clearance, leg room, and 600mm per person chair spacing.'
    },
    linearParams: [
        {
            id: 'length',
            name: 'length',
            label: 'Table Length',
            labelTr: 'Masa Uzunluğu',
            min: 1200,
            max: 4800,
            step: 100,
            default: 2400,
            unit: 'mm',
            axis: 'x'
        },
        {
            id: 'width',
            name: 'width',
            label: 'Table Width',
            labelTr: 'Masa Genişliği',
            min: 800,
            max: 1600,
            step: 50,
            default: 1000,
            unit: 'mm',
            axis: 'y'
        }
    ],
    flipParams: [],
    visibilityParam: {
        id: 'visState',
        name: 'visState',
        label: 'Detail Level',
        labelTr: 'Detay Seviyesi',
        states: [
            { id: 'plan_detailed', label: 'Plan View — Detailed Chairs', labelTr: 'Plan — Detaylı Sandalyeli' },
            { id: 'plan_simple', label: 'Plan View — Minimal', labelTr: 'Plan — Sade Şematik' },
            { id: 'table_only', label: 'Plan View — Table Only', labelTr: 'Plan — Yalnızca Masa' }
        ],
        default: 'plan_detailed'
    },
    lookupParams: [
        {
            id: 'presetCapacity',
            name: 'presetCapacity',
            label: 'Standard Capacity Preset',
            labelTr: 'Standart Kapasite Paketi',
            options: [
                { id: 'cap_4', label: '4 Kişilik (1200 × 800 mm)', values: { length: 1200, width: 800 } },
                { id: 'cap_6', label: '6 Kişilik (1800 × 900 mm)', values: { length: 1800, width: 900 } },
                { id: 'cap_8', label: '8 Kişilik (2400 × 1000 mm)', values: { length: 2400, width: 1000 } },
                { id: 'cap_10', label: '10 Kişilik (3000 × 1100 mm)', values: { length: 3000, width: 1100 } },
                { id: 'cap_12', label: '12 Kişilik (3600 × 1200 mm)', values: { length: 3600, width: 1200 } },
                { id: 'cap_16', label: '16 Kişilik Konferans (4200 × 1400 mm)', values: { length: 4200, width: 1400 } }
            ],
            default: 'cap_8'
        }
    ],
    arrayActions: [
        {
            id: 'array_chairs',
            linearParamId: 'length',
            spacing: 600,
            minCount: 2,
            maxCount: 16,
            label: 'Chair Array along Edges',
            labelTr: 'Kenarlar Boyunca Sandalye Dizisi'
        }
    ],
    defaultValues: {
        length: 2400,
        width: 1000,
        hasEndChairs: true,
        visState: 'plan_detailed'
    },
    generate2D: (params, basePoint = { x: 0, y: 0 }) => {
        const length = Number(params.length) || 2400;
        const width = Number(params.width) || 1000;
        const state = String(params.visState || 'plan_detailed');
        const hasEndChairs = params.hasEndChairs !== false;

        const entities: CadEntity[] = [];
        const layer = 'layer-furn';
        const colorTable = '#3ad0e6';
        const colorChair = '#f8fafc';
        const colorAccent = '#64748b';

        // 1. Table Top (Centered around basePoint)
        const tableCenter = { x: basePoint.x + length / 2, y: basePoint.y + width / 2 };
        entities.push(createRectangleEntity(tableCenter, length, width, layer, colorTable));

        // Center line / cable trough for conference tables
        if (length >= 1800) {
            entities.push(createRectangleEntity(tableCenter, 400, 120, layer, colorAccent));
        }

        if (state === 'table_only') {
            return entities;
        }

        // Helper to draw a single 2D chair (seat 450x450 + backrest)
        const chairW = 450;
        const chairD = 450;
        const chairMargin = 40; // distance from table edge

        const drawChair = (cx: number, cy: number, orientation: 'top' | 'bottom' | 'left' | 'right') => {
            if (state === 'plan_simple') {
                entities.push(createRectangleEntity({ x: cx, y: cy }, chairW, chairD, layer, colorChair));
                return;
            }

            // Detailed chair with cushion and rounded backrest
            entities.push(createRectangleEntity({ x: cx, y: cy }, chairW - 40, chairD - 40, layer, colorChair));
            // Backrest line / curve
            if (orientation === 'top') {
                entities.push(createLineEntity(
                    { x: cx - chairW / 2 + 10, y: cy + chairD / 2 },
                    { x: cx + chairW / 2 - 10, y: cy + chairD / 2 },
                    layer,
                    colorAccent
                ));
            } else if (orientation === 'bottom') {
                entities.push(createLineEntity(
                    { x: cx - chairW / 2 + 10, y: cy - chairD / 2 },
                    { x: cx + chairW / 2 - 10, y: cy - chairD / 2 },
                    layer,
                    colorAccent
                ));
            } else if (orientation === 'left') {
                entities.push(createLineEntity(
                    { x: cx - chairD / 2, y: cy - chairW / 2 + 10 },
                    { x: cx - chairD / 2, y: cy + chairW / 2 - 10 },
                    layer,
                    colorAccent
                ));
            } else if (orientation === 'right') {
                entities.push(createLineEntity(
                    { x: cx + chairD / 2, y: cy - chairW / 2 + 10 },
                    { x: cx + chairD / 2, y: cy + chairW / 2 - 10 },
                    layer,
                    colorAccent
                ));
            }
        };

        // 2. Dynamic Array Calculation:
        // Spacing: ~600mm per person
        const spacing = 600;
        const marginX = 250;
        const availableLen = length - marginX * 2;
        const countPerSide = Math.max(1, Math.floor(availableLen / spacing) + 1);
        const actualStep = countPerSide > 1 ? availableLen / (countPerSide - 1) : 0;

        // Top Side Chairs
        for (let i = 0; i < countPerSide; i++) {
            const chairX = basePoint.x + marginX + (countPerSide > 1 ? i * actualStep : availableLen / 2);
            const chairY = basePoint.y + width + chairMargin + chairD / 2;
            drawChair(chairX, chairY, 'top');
        }

        // Bottom Side Chairs
        for (let i = 0; i < countPerSide; i++) {
            const chairX = basePoint.x + marginX + (countPerSide > 1 ? i * actualStep : availableLen / 2);
            const chairY = basePoint.y - chairMargin - chairD / 2;
            drawChair(chairX, chairY, 'bottom');
        }

        // End Chairs (Head & Foot of table)
        if (hasEndChairs && width >= 800) {
            // Left end
            drawChair(basePoint.x - chairMargin - chairD / 2, basePoint.y + width / 2, 'left');
            // Right end
            drawChair(basePoint.x + length + chairMargin + chairD / 2, basePoint.y + width / 2, 'right');
        }

        return entities;
    },
    generate3D: (params, basePos = { x: 0, y: 0, z: 0 }) => {
        const length = Number(params.length) || 2400;
        const width = Number(params.width) || 1000;
        const tableH = 750;
        const topThickness = 35;
        const hasEndChairs = params.hasEndChairs !== false;

        const parts: DynamicPart3DDef[] = [
            // Table Top Plate
            {
                id: `table_top_${Date.now()}`,
                name: `Toplantı Masası Tablası (${length}x${width})`,
                kind: 'box',
                color: '#d4af37', // Warm oak / walnut
                position: { x: basePos.x + length / 2, y: basePos.y + width / 2, z: basePos.z + tableH - topThickness / 2 },
                rotation: { x: 0, y: 0, z: 0 },
                params: { width: length, height: width, depth: topThickness },
                designStandard: 'DIN EN 527-1'
            },
            // Leg 1 (Front-Left)
            {
                id: `table_leg_1_${Date.now()}`,
                name: 'Masa Ayağı FL',
                kind: 'cylinder',
                color: '#334155',
                position: { x: basePos.x + 80, y: basePos.y + 80, z: basePos.z + (tableH - topThickness) / 2 },
                rotation: { x: 0, y: 0, z: 0 },
                params: { diameter: 60, length: tableH - topThickness }
            },
            // Leg 2 (Front-Right)
            {
                id: `table_leg_2_${Date.now()}`,
                name: 'Masa Ayağı FR',
                kind: 'cylinder',
                color: '#334155',
                position: { x: basePos.x + length - 80, y: basePos.y + 80, z: basePos.z + (tableH - topThickness) / 2 },
                rotation: { x: 0, y: 0, z: 0 },
                params: { diameter: 60, length: tableH - topThickness }
            },
            // Leg 3 (Back-Left)
            {
                id: `table_leg_3_${Date.now()}`,
                name: 'Masa Ayağı BL',
                kind: 'cylinder',
                color: '#334155',
                position: { x: basePos.x + 80, y: basePos.y + width - 80, z: basePos.z + (tableH - topThickness) / 2 },
                rotation: { x: 0, y: 0, z: 0 },
                params: { diameter: 60, length: tableH - topThickness }
            },
            // Leg 4 (Back-Right)
            {
                id: `table_leg_4_${Date.now()}`,
                name: 'Masa Ayağı BR',
                kind: 'cylinder',
                color: '#334155',
                position: { x: basePos.x + length - 80, y: basePos.y + width - 80, z: basePos.z + (tableH - topThickness) / 2 },
                rotation: { x: 0, y: 0, z: 0 },
                params: { diameter: 60, length: tableH - topThickness }
            }
        ];

        // Add 3D chairs dynamically along the sides
        const spacing = 600;
        const marginX = 250;
        const availableLen = length - marginX * 2;
        const countPerSide = Math.max(1, Math.floor(availableLen / spacing) + 1);
        const actualStep = countPerSide > 1 ? availableLen / (countPerSide - 1) : 0;

        let chairIdx = 1;
        const addChair3D = (cx: number, cy: number, rotZ: number) => {
            parts.push({
                id: `chair_seat_${chairIdx++}_${Date.now()}`,
                name: `Ofis Koltuğu ${chairIdx}`,
                kind: 'box',
                color: '#1e293b',
                position: { x: cx, y: cy, z: basePos.z + 450 },
                rotation: { x: 0, y: 0, z: rotZ },
                params: { width: 420, height: 420, depth: 40 }
            });
        };

        for (let i = 0; i < countPerSide; i++) {
            const chairX = basePos.x + marginX + (countPerSide > 1 ? i * actualStep : availableLen / 2);
            // Top side
            addChair3D(chairX, basePos.y + width + 250, 0);
            // Bottom side
            addChair3D(chairX, basePos.y - 250, Math.PI);
        }

        if (hasEndChairs && width >= 800) {
            addChair3D(basePos.x - 250, basePos.y + width / 2, Math.PI / 2);
            addChair3D(basePos.x + length + 250, basePos.y + width / 2, -Math.PI / 2);
        }

        return parts;
    },
    getGrips: (params, basePoint = { x: 0, y: 0 }) => {
        const length = Number(params.length) || 2400;
        const width = Number(params.width) || 1000;

        const grips: DynamicGrip[] = [
            // Linear Stretch Length Grip (Right end of table)
            {
                id: 'grip_table_length',
                type: 'stretch',
                paramId: 'length',
                position: { x: basePoint.x + length, y: basePoint.y + width / 2 },
                direction: { x: 1, y: 0 },
                tooltip: `Grip: Masa Boyu & Sandalye Dizisi (${length} mm)`,
                tooltipTr: `Grip: Masa Boyu & Sandalye Dizisi (${length} mm)`
            },
            // Linear Stretch Width Grip (Top of table)
            {
                id: 'grip_table_width',
                type: 'stretch',
                paramId: 'width',
                position: { x: basePoint.x + length / 2, y: basePoint.y + width },
                direction: { x: 0, y: 1 },
                tooltip: `Grip: Masa Genişliği (${width} mm)`,
                tooltipTr: `Grip: Masa Genişliği (${width} mm)`
            },
            // Visibility State
            {
                id: 'grip_table_vis',
                type: 'visibility',
                paramId: 'visState',
                position: { x: basePoint.x - 40, y: basePoint.y - 40 },
                tooltip: 'Görünüm Durumu (Detaylı / Şematik / Yalnız Masa)',
                tooltipTr: 'Görünüm Durumu (Detaylı / Şematik / Yalnız Masa)'
            }
        ];

        return grips;
    }
};
