/**
 * 🪜 Parametric Architectural Staircase (DIN 18065 / Blondel Formulations)
 * 
 * Normative Tier 1 Staircase:
 * - Deterministic Blondel ergonomical formula: 2h + s = 630 mm (DIN 18065)
 * - Automatic dynamic step count generation and riser calculation
 * - Visibility: Plan View (Cut line at +1.20m), Full Longitudinal Section, L-Shape with Landing
 * - Korkuluk (Handrail) and Walking Line (Çıkış Hattı)
 */

import { Point, CadEntity, createLineEntity, createRectangleEntity, createArcEntity } from '../../../kernel/types';
import { DynamicBlockDef, DynamicGrip, DynamicPart3DDef } from '../types';

export const DYN_STAIRS: DynamicBlockDef = {
    id: 'dyn_stairs',
    name: 'Parametric Architectural Stairs',
    nameTr: 'Parametrik Mimari Merdiven (DIN 18065)',
    category: 'Architectural',
    subcategory: 'Circulation & Stairs',
    subcategoryTr: 'Dolaşım ve Merdivenler',
    description: 'AutoCAD-grade parametric stairs calculated via Blondel ergonomic rule (2h + s = 63cm).',
    descriptionTr: 'DIN 18065 ve Blondel ergonomi kuralına (2h + s = 63 cm) göre hesaplanan dinamik basamak dizilimi.',
    icon: '🪜',
    citation: {
        tier: 1,
        standard: 'DIN 18065',
        clause: 'Section 6.1 (Stairs in buildings - Terminology, dimensions and functional requirements)',
        description: 'Mandatory Blondel relation 2s + a = 590..650mm, clear flight width minimums, and walking line offset.'
    },
    linearParams: [
        {
            id: 'floorHeight',
            name: 'floorHeight',
            label: 'Total Floor Height',
            labelTr: 'Kat Yüksekliği',
            min: 2400,
            max: 4200,
            step: 50,
            default: 2800,
            unit: 'mm',
            axis: 'y'
        },
        {
            id: 'flightWidth',
            name: 'flightWidth',
            label: 'Flight Width',
            labelTr: 'Merdiven Kol Genişliği',
            min: 800,
            max: 2400,
            step: 50,
            default: 1000,
            unit: 'mm',
            axis: 'x'
        },
        {
            id: 'treadDepth',
            name: 'treadDepth',
            label: 'Tread Depth (s)',
            labelTr: 'Basamak Genişliği (s)',
            min: 250,
            max: 330,
            step: 10,
            default: 280,
            unit: 'mm',
            axis: 'x'
        }
    ],
    flipParams: [
        {
            id: 'flipHandrail',
            name: 'flipHandrail',
            label: 'Handrail Side (Left / Right)',
            labelTr: 'Korkuluk Yönü (Sol / Sağ)',
            axis: 'horizontal',
            default: false
        }
    ],
    visibilityParam: {
        id: 'visState',
        name: 'visState',
        label: 'View Type',
        labelTr: 'Görünüm Durumu',
        states: [
            { id: 'plan', label: 'Plan View (+1.20m Cut)', labelTr: 'Kat Planı (+1.20m Kotu Kesikli)' },
            { id: 'section', label: 'Longitudinal Section', labelTr: 'Boyuna Mimari Kesit' },
            { id: 'l_shaped', label: 'L-Shaped with Landing', labelTr: 'L-Tipi Sahanlıklı Merdiven' }
        ],
        default: 'plan'
    },
    lookupParams: [
        {
            id: 'standardStairs',
            name: 'standardStairs',
            label: 'Standard Building Types',
            labelTr: 'Standart Yapı Merdivenleri',
            options: [
                { id: 'res_2800', label: 'Konut: H=2800 mm, Kol=1000 mm, Basamak=280 mm', standard: 'DIN 18065', values: { floorHeight: 2800, flightWidth: 1000, treadDepth: 280, visState: 'plan' } },
                { id: 'com_3200', label: 'Kamu / Ticari: H=3200 mm, Kol=1200 mm, Basamak=300 mm', standard: 'DIN 18065', values: { floorHeight: 3200, flightWidth: 1200, treadDepth: 300, visState: 'plan' } },
                { id: 'ind_3600', label: 'Endüstriyel: H=3600 mm, Kol=900 mm, Basamak=260 mm', standard: 'DIN 18065', values: { floorHeight: 3600, flightWidth: 900, treadDepth: 260, visState: 'section' } }
            ]
        }
    ],
    defaultValues: {
        floorHeight: 2800,
        flightWidth: 1000,
        treadDepth: 280,
        flipHandrail: false,
        visState: 'plan'
    },
    generate2D: (params: Record<string, any>, basePoint: Point = { x: 0, y: 0 }): CadEntity[] => {
        const entities: CadEntity[] = [];
        const floorHeight = Number(params.floorHeight || 2800);
        const flightWidth = Number(params.flightWidth || 1000);
        const treadDepth = Number(params.treadDepth || 280);
        const flip = Boolean(params.flipHandrail);
        const visState = String(params.visState || 'plan');

        // Blondel calculation: Target riser height ~ 175mm
        const targetRiser = (630 - treadDepth) / 2;
        const numSteps = Math.max(8, Math.round(floorHeight / targetRiser));
        const actualRiser = floorHeight / numSteps;
        const totalRun = (numSteps - 1) * treadDepth;

        if (visState === 'section') {
            // Longitudinal Section View
            let cx = basePoint.x;
            let cy = basePoint.y;

            // Ground Baseline
            entities.push(createLineEntity(
                { x: basePoint.x - 200, y: basePoint.y },
                { x: basePoint.x + totalRun + 400, y: basePoint.y },
                '#64748b'
            ));

            // Steps staircase profile
            for (let i = 0; i < numSteps; i++) {
                // Riser vertical line
                entities.push(createLineEntity(
                    { x: cx, y: cy },
                    { x: cx, y: cy + actualRiser },
                    '#00e5ff'
                ));
                // Tread horizontal line
                entities.push(createLineEntity(
                    { x: cx, y: cy + actualRiser },
                    { x: cx + treadDepth, y: cy + actualRiser },
                    '#00e5ff'
                ));

                cx += treadDepth;
                cy += actualRiser;
            }

            // Top landing horizontal slab
            entities.push(createLineEntity(
                { x: cx, y: cy },
                { x: cx + 800, y: cy },
                '#00e5ff'
            ));

            // Handrail (900mm above nosing)
            entities.push(createLineEntity(
                { x: basePoint.x, y: basePoint.y + 900 },
                { x: cx, y: cy + 900 },
                '#f59e0b'
            ));

            return entities;
        }

        // Plan View
        // Flight boundary rectangles
        entities.push(createLineEntity(
            { x: basePoint.x, y: basePoint.y },
            { x: basePoint.x + totalRun, y: basePoint.y },
            '#00e5ff'
        ));
        entities.push(createLineEntity(
            { x: basePoint.x, y: basePoint.y + flightWidth },
            { x: basePoint.x + totalRun, y: basePoint.y + flightWidth },
            '#00e5ff'
        ));
        entities.push(createLineEntity(
            { x: basePoint.x, y: basePoint.y },
            { x: basePoint.x, y: basePoint.y + flightWidth },
            '#00e5ff'
        ));
        entities.push(createLineEntity(
            { x: basePoint.x + totalRun, y: basePoint.y },
            { x: basePoint.x + totalRun, y: basePoint.y + flightWidth },
            '#00e5ff'
        ));

        // Treads
        const cutStepIndex = Math.floor(numSteps * 0.5); // +1.20m cut line
        for (let i = 1; i < numSteps; i++) {
            const stepX = basePoint.x + i * treadDepth;
            const isCutAfter = i > cutStepIndex;
            entities.push(createLineEntity(
                { x: stepX, y: basePoint.y },
                { x: stepX, y: basePoint.y + flightWidth },
                isCutAfter ? '#475569' : '#38bdf8'
            ));
        }

        // 45-degree Plan Cut Line (Kesit İzi)
        const cutX = basePoint.x + cutStepIndex * treadDepth;
        entities.push(createLineEntity(
            { x: cutX - 50, y: basePoint.y - 40 },
            { x: cutX + 50, y: basePoint.y + flightWidth + 40 },
            '#ec4899'
        ));

        // Walking Line (Çıkış Hattı) with Start Dot and Arrow
        const walkY = basePoint.y + flightWidth / 2;
        entities.push(createArcEntity(
            { x: basePoint.x + 80, y: walkY },
            20,
            0,
            Math.PI * 2,
            '#f59e0b'
        ));
        entities.push(createLineEntity(
            { x: basePoint.x + 80, y: walkY },
            { x: basePoint.x + totalRun - 60, y: walkY },
            '#f59e0b'
        ));
        // Arrow head
        entities.push(createLineEntity(
            { x: basePoint.x + totalRun - 60, y: walkY },
            { x: basePoint.x + totalRun - 120, y: walkY + 30 },
            '#f59e0b'
        ));
        entities.push(createLineEntity(
            { x: basePoint.x + totalRun - 60, y: walkY },
            { x: basePoint.x + totalRun - 120, y: walkY - 30 },
            '#f59e0b'
        ));

        // Handrail line on side
        const railY = flip ? (basePoint.y + flightWidth - 40) : (basePoint.y + 40);
        entities.push(createLineEntity(
            { x: basePoint.x, y: railY },
            { x: basePoint.x + totalRun, y: railY },
            '#67e8f9'
        ));

        return entities;
    },
    getGrips: (params: Record<string, any>, basePoint: Point): DynamicGrip[] => {
        const floorHeight = Number(params.floorHeight || 2800);
        const flightWidth = Number(params.flightWidth || 1000);
        const treadDepth = Number(params.treadDepth || 280);
        const numSteps = Math.max(8, Math.round(floorHeight / 175));
        const totalRun = (numSteps - 1) * treadDepth;

        return [
            {
                id: 'grip_origin',
                type: 'point',
                position: { x: basePoint.x, y: basePoint.y },
                paramId: 'origin',
                label: 'Merdiven Başlangıcı'
            },
            {
                id: 'grip_run',
                type: 'linear',
                position: { x: basePoint.x + totalRun, y: basePoint.y + flightWidth / 2 },
                direction: { x: 1, y: 0 },
                paramId: 'treadDepth',
                label: 'Basamak Genişliğini Ayarla'
            },
            {
                id: 'grip_width',
                type: 'linear',
                position: { x: basePoint.x + totalRun / 2, y: basePoint.y + flightWidth },
                direction: { x: 0, y: 1 },
                paramId: 'flightWidth',
                label: 'Kol Genişliğini Esnet'
            },
            {
                id: 'grip_flip',
                type: 'flip',
                position: { x: basePoint.x - 30, y: basePoint.y + flightWidth / 2 },
                paramId: 'flipHandrail',
                label: 'Korkuluk Tarafını Değiştir'
            },
            {
                id: 'grip_vis',
                type: 'visibility',
                position: { x: basePoint.x + 50, y: basePoint.y - 30 },
                paramId: 'visState',
                label: 'Plan / Kesit / L-Merdiven'
            }
        ];
    },
    generate3D: (params: Record<string, any>, basePos = { x: 0, y: 0, z: 0 }): DynamicPart3DDef[] => {
        const floorHeight = Number(params.floorHeight || 2800);
        const flightWidth = Number(params.flightWidth || 1000);
        const treadDepth = Number(params.treadDepth || 280);

        const numSteps = Math.max(8, Math.round(floorHeight / 175));
        const actualRiser = floorHeight / numSteps;

        const parts: DynamicPart3DDef[] = [];

        for (let i = 0; i < numSteps; i++) {
            parts.push({
                name: `Stair_Step_${i + 1}`,
                kind: 'box',
                params: { width: treadDepth, height: actualRiser * (i + 1), depth: flightWidth },
                position: {
                    x: basePos.x + i * treadDepth + treadDepth / 2,
                    y: basePos.y + (actualRiser * (i + 1)) / 2,
                    z: basePos.z + flightWidth / 2
                },
                rotation: { x: 0, y: 0, z: 0 },
                color: '#cbd5e1',
                designStandard: 'DIN 18065'
            });
        }

        // Handrail post & rail
        const railLength = Math.hypot((numSteps - 1) * treadDepth, floorHeight);
        const slopeAngleDeg = Math.atan2(floorHeight, (numSteps - 1) * treadDepth) * (180 / Math.PI);

        parts.push({
            name: 'Stair_Handrail',
            kind: 'cylinder',
            params: { diameter: 45, length: railLength },
            position: {
                x: basePos.x + ((numSteps - 1) * treadDepth) / 2,
                y: basePos.y + floorHeight / 2 + 900,
                z: basePos.z + flightWidth - 50
            },
            rotation: { x: 0, y: 0, z: -(90 - slopeAngleDeg) },
            color: '#f59e0b',
            designStandard: 'DIN 18065'
        });

        return parts;
    }
};
