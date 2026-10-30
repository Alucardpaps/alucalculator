/**
 * 🚿 Dynamic Bathroom Vanity & Sink Unit (EN 14688 / DIN 18040)
 * 
 * Sanitary Dynamic Block:
 * - Linear stretch: Counter Width (600 - 2600 mm), Counter Depth (450 - 650 mm)
 * - Automatic dual-sink arraying when width >= 1400 mm
 * - Visibility: Plan View, Front Elevation (with mirror & drawers), Double Basin
 * - Ergonomic standard clearances and plumbing connections
 */

import { Point, CadEntity, createLineEntity, createRectangleEntity, createArcEntity } from '../../../kernel/types';
import { DynamicBlockDef, DynamicGrip, DynamicPart3DDef } from '../types';

export const DYN_VANITY_SINK: DynamicBlockDef = {
    id: 'dyn_vanity_sink',
    name: 'Dynamic Bathroom Vanity & Basin',
    nameTr: 'Dinamik Banyo Tezgahı ve Lavabo',
    category: 'Sanitary',
    subcategory: 'Plumbing & Fixtures',
    subcategoryTr: 'Sıhhi Tesisat ve Vitrifiye',
    description: 'AutoCAD-grade parametric bathroom vanity with stretchable countertop, single/double sinks, and mirror elevation.',
    descriptionTr: 'Tezgah genişliği esnetilebilir, tekli/çiftli hazne seçimi ve ayna görünüşlü dinamik lavabo ünitesi.',
    icon: '🚿',
    citation: {
        tier: 1,
        standard: 'EN 14688 / DIN 18040',
        clause: 'Clauses 5.2-5.4 (Washbasins - Functional requirements and test methods)',
        description: 'Standard basin bowl rim clearances, faucet hole centerlines (35mm), and handicap accessibility depths.'
    },
    linearParams: [
        {
            id: 'counterWidth',
            name: 'counterWidth',
            label: 'Countertop Width',
            labelTr: 'Tezgah Genişliği',
            min: 600,
            max: 2600,
            step: 50,
            default: 1200,
            unit: 'mm',
            axis: 'x'
        },
        {
            id: 'counterDepth',
            name: 'counterDepth',
            label: 'Countertop Depth',
            labelTr: 'Tezgah Derinliği',
            min: 450,
            max: 650,
            step: 10,
            default: 550,
            unit: 'mm',
            axis: 'y'
        },
        {
            id: 'basinWidth',
            name: 'basinWidth',
            label: 'Basin Bowl Width',
            labelTr: 'Lavabo Hazne Genişliği',
            min: 400,
            max: 700,
            step: 20,
            default: 500,
            unit: 'mm',
            axis: 'x'
        }
    ],
    flipParams: [
        {
            id: 'flipFaucet',
            name: 'flipFaucet',
            label: 'Faucet Position (Standard / Side)',
            labelTr: 'Batarya Konumu (Merkez / Yan)',
            axis: 'horizontal',
            default: false
        }
    ],
    visibilityParam: {
        id: 'visState',
        name: 'visState',
        label: 'Basin Layout / View',
        labelTr: 'Yerleşim ve Görünüm',
        states: [
            { id: 'plan_single', label: 'Plan: Single Basin', labelTr: 'Plan: Tek Lavabolu' },
            { id: 'plan_double', label: 'Plan: Double Basin', labelTr: 'Plan: Çift Lavabolu' },
            { id: 'elevation', label: 'Front Elevation (Mirror & Vanity)', labelTr: 'Ön Görünüş (Ayna & Dolap)' }
        ],
        default: 'plan_single'
    },
    lookupParams: [
        {
            id: 'standardVanity',
            name: 'standardVanity',
            label: 'Standard Vanity Dimensions',
            labelTr: 'Standart Tezgah Modelleri',
            options: [
                { id: 'std_600_compact', label: '600 × 480 mm (Küçük WC / Misafir)', standard: 'EN 14688', values: { counterWidth: 600, counterDepth: 480, visState: 'plan_single' } },
                { id: 'std_900_std', label: '900 × 520 mm (Standart Daire Banyosu)', standard: 'EN 14688', values: { counterWidth: 900, counterDepth: 520, visState: 'plan_single' } },
                { id: 'std_1200_large', label: '1200 × 550 mm (Geniş Çekmeceli Tezgah)', standard: 'EN 14688', values: { counterWidth: 1200, counterDepth: 550, visState: 'plan_single' } },
                { id: 'std_1600_double', label: '1600 × 580 mm (Çift Lavabolu Ebeveyn)', standard: 'EN 14688', values: { counterWidth: 1600, counterDepth: 580, visState: 'plan_double' } }
            ]
        }
    ],
    defaultValues: {
        counterWidth: 1200,
        counterDepth: 550,
        basinWidth: 500,
        flipFaucet: false,
        visState: 'plan_single'
    },
    generate2D: (params: Record<string, any>, basePoint: Point = { x: 0, y: 0 }): CadEntity[] => {
        const entities: CadEntity[] = [];
        const width = Number(params.counterWidth || 1200);
        const depth = Number(params.counterDepth || 550);
        const basinW = Math.min(width - 100, Number(params.basinWidth || 500));
        const basinD = Math.min(depth - 120, 380);
        const flip = Boolean(params.flipFaucet);
        const visState = String(params.visState || 'plan_single');

        if (visState === 'elevation') {
            // Front Elevation: Base Cabinet (850mm), Countertop (30mm), Basin under/above, Mirror (800mm)
            const vanityH = 850;
            const mirrorH = 800;

            // Base Cabinet
            entities.push(createRectangleEntity(
                { x: basePoint.x + width / 2, y: basePoint.y + vanityH / 2 },
                width,
                vanityH,
                0,
                '#38bdf8'
            ));

            // Drawer divider lines
            entities.push(createLineEntity(
                { x: basePoint.x, y: basePoint.y + vanityH * 0.5 },
                { x: basePoint.x + width, y: basePoint.y + vanityH * 0.5 },
                '#0284c7'
            ));
            entities.push(createLineEntity(
                { x: basePoint.x + width / 2, y: basePoint.y },
                { x: basePoint.x + width / 2, y: basePoint.y + vanityH },
                '#0284c7'
            ));

            // Countertop Slab
            entities.push(createRectangleEntity(
                { x: basePoint.x + width / 2, y: basePoint.y + vanityH + 15 },
                width + 20,
                30,
                0,
                '#00e5ff'
            ));

            // Mirror
            entities.push(createRectangleEntity(
                { x: basePoint.x + width / 2, y: basePoint.y + vanityH + 200 + mirrorH / 2 },
                width - 80,
                mirrorH,
                0,
                '#67e8f9'
            ));

            // Ground Line
            entities.push(createLineEntity(
                { x: basePoint.x - 100, y: basePoint.y },
                { x: basePoint.x + width + 100, y: basePoint.y },
                '#64748b'
            ));
            return entities;
        }

        // Plan View
        // Countertop Perimeter
        entities.push(createRectangleEntity(
            { x: basePoint.x + width / 2, y: basePoint.y + depth / 2 },
            width,
            depth,
            0,
            '#00e5ff'
        ));

        // Backsplash wall line
        entities.push(createLineEntity(
            { x: basePoint.x, y: basePoint.y + depth - 20 },
            { x: basePoint.x + width, y: basePoint.y + depth - 20 },
            '#334155'
        ));

        const isDouble = visState === 'plan_double' || width >= 1500;
        const basins: Point[] = [];

        if (isDouble) {
            basins.push({ x: basePoint.x + width * 0.28, y: basePoint.y + depth * 0.45 });
            basins.push({ x: basePoint.x + width * 0.72, y: basePoint.y + depth * 0.45 });
        } else {
            basins.push({ x: basePoint.x + width / 2, y: basePoint.y + depth * 0.45 });
        }

        // Render each basin bowl and faucet
        for (const center of basins) {
            // Outer Basin Rim (rounded rectangle / oval simulated)
            entities.push(createRectangleEntity(
                center,
                basinW,
                basinD,
                0,
                '#38bdf8'
            ));
            // Inner Basin Bowl
            entities.push(createRectangleEntity(
                center,
                basinW - 40,
                basinD - 40,
                0,
                '#0284c7'
            ));
            // Drain hole
            entities.push(createArcEntity(
                center,
                22,
                0,
                Math.PI * 2,
                '#94a3b8'
            ));

            // Faucet mixer tap (back or side)
            const faucetX = flip ? (center.x + basinW / 2 + 30) : center.x;
            const faucetY = flip ? center.y : (basePoint.y + depth - 50);

            entities.push(createArcEntity(
                { x: faucetX, y: faucetY },
                18,
                0,
                Math.PI * 2,
                '#f59e0b'
            ));
            // Spout
            entities.push(createLineEntity(
                { x: faucetX, y: faucetY },
                { x: faucetX, y: faucetY - 45 },
                '#f59e0b'
            ));
        }

        return entities;
    },
    getGrips: (params: Record<string, any>, basePoint: Point): DynamicGrip[] => {
        const width = Number(params.counterWidth || 1200);
        const depth = Number(params.counterDepth || 550);

        return [
            {
                id: 'grip_origin',
                type: 'point',
                position: { x: basePoint.x, y: basePoint.y },
                paramId: 'origin',
                label: 'Tezgah Başlangıcı'
            },
            {
                id: 'grip_width',
                type: 'linear',
                position: { x: basePoint.x + width, y: basePoint.y + depth / 2 },
                direction: { x: 1, y: 0 },
                paramId: 'counterWidth',
                label: 'Tezgah Genişliğini Esnet'
            },
            {
                id: 'grip_depth',
                type: 'linear',
                position: { x: basePoint.x + width / 2, y: basePoint.y + depth },
                direction: { x: 0, y: 1 },
                paramId: 'counterDepth',
                label: 'Tezgah Derinliği'
            },
            {
                id: 'grip_flip',
                type: 'flip',
                position: { x: basePoint.x + width / 2, y: basePoint.y - 25 },
                paramId: 'flipFaucet',
                label: 'Batarya Konumunu Değiştir'
            },
            {
                id: 'grip_vis',
                type: 'visibility',
                position: { x: basePoint.x + 35, y: basePoint.y - 25 },
                paramId: 'visState',
                label: 'Tekli / Çiftli / Ön Görünüş'
            }
        ];
    },
    generate3D: (params: Record<string, any>, basePos = { x: 0, y: 0, z: 0 }): DynamicPart3DDef[] => {
        const width = Number(params.counterWidth || 1200) / 1000;
        const depth = Number(params.counterDepth || 550) / 1000;
        const isDouble = width >= 1.5 || String(params.visState) === 'plan_double';

        const parts: DynamicPart3DDef[] = [
            // Vanity Base Cabinet
            {
                name: 'Vanity_Cabinet',
                shape: 'box',
                dimensions: { width, height: 0.82, depth: depth * 0.95 },
                position: { x: basePos.x + width / 2, y: basePos.y + 0.41, z: basePos.z },
                color: '#334155',
                materialType: 'structural_timber'
            },
            // Countertop Slab
            {
                name: 'Vanity_Countertop',
                shape: 'box',
                dimensions: { width: width + 0.02, height: 0.03, depth: depth + 0.02 },
                position: { x: basePos.x + width / 2, y: basePos.y + 0.835, z: basePos.z },
                color: '#f8fafc',
                materialType: 'aluminum_anodized'
            }
        ];

        // Basins
        const basinPositions = isDouble
            ? [width * 0.28, width * 0.72]
            : [width / 2];

        for (let i = 0; i < basinPositions.length; i++) {
            parts.push({
                name: `Vanity_Basin_${i + 1}`,
                shape: 'box',
                dimensions: { width: 0.48, height: 0.18, depth: 0.38 },
                position: { x: basePos.x + basinPositions[i], y: basePos.y + 0.82, z: basePos.z },
                color: '#ffffff',
                materialType: 'aluminum_anodized'
            });
            // Faucet
            parts.push({
                name: `Vanity_Faucet_${i + 1}`,
                shape: 'cylinder',
                dimensions: { radius: 0.018, height: 0.22 },
                position: { x: basePos.x + basinPositions[i], y: basePos.y + 0.96, z: basePos.z - 0.16 },
                color: '#f59e0b',
                materialType: 'stainless_316'
            });
        }

        return parts;
    }
};
