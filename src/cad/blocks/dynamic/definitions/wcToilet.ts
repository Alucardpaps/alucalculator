/**
 * 🚽 Dynamic Wall-Hung Toilet & Concealed Cistern (EN 997 / DIN 18040)
 * 
 * Sanitary Dynamic Block:
 * - Linear stretch: Bowl Length (480-720mm: Compact, Standard, Barrier-Free DIN 18040)
 * - Concealed cistern frame depth (120-200mm)
 * - Visibility: Architectural Plan, Side Elevation, Barrier-Free (with support rails)
 * - Neufert & DIN 18040 ergonomic user clearance footprint
 */

import { Point, CadEntity, createLineEntity, createRectangleEntity, createArcEntity } from '../../../kernel/types';
import { DynamicBlockDef, DynamicGrip, DynamicPart3DDef } from '../types';

export const DYN_WC_TOILET: DynamicBlockDef = {
    id: 'dyn_wc_toilet',
    name: 'Dynamic Wall-Hung Toilet & Cistern',
    nameTr: 'Dinamik Asma Klozet ve Gömme Rezervuar',
    category: 'Sanitary',
    subcategory: 'Plumbing & Fixtures',
    subcategoryTr: 'Sıhhi Tesisat ve Vitrifiye',
    description: 'AutoCAD-grade parametric wall-hung toilet with concealed cistern, barrier-free grab rails, and user clearances.',
    descriptionTr: 'Gömme rezervuar, DIN 18040 engelli tutunma barları ve ergonomik kullanım çeperli asma klozet.',
    icon: '🚽',
    citation: {
        tier: 1,
        standard: 'EN 997 / DIN 18040',
        clause: 'Section 5.3 (WC pans and WC suites with integral trap & Barrier-free design)',
        description: 'Standard 400-480mm rim heights, 700mm projection for barrier-free access, and flush plate locations.'
    },
    linearParams: [
        {
            id: 'bowlLength',
            name: 'bowlLength',
            label: 'Toilet Bowl Projection (Length)',
            labelTr: 'Klozet Çanak Derinliği (Boy)',
            min: 480,
            max: 720,
            step: 20,
            default: 540,
            unit: 'mm',
            axis: 'y'
        },
        {
            id: 'bowlWidth',
            name: 'bowlWidth',
            label: 'Toilet Bowl Width',
            labelTr: 'Klozet Çanak Genişliği',
            min: 340,
            max: 420,
            step: 10,
            default: 360,
            unit: 'mm',
            axis: 'x'
        },
        {
            id: 'cisternDepth',
            name: 'cisternDepth',
            label: 'Cistern Wall Depth',
            labelTr: 'Gömme Rezervuar Derinliği',
            min: 120,
            max: 220,
            step: 10,
            default: 150,
            unit: 'mm',
            axis: 'y'
        }
    ],
    flipParams: [
        {
            id: 'flipBidet',
            name: 'flipBidet',
            label: 'Bidet Faucet Side (Left / Right)',
            labelTr: 'Taharet Musluğu Yönü (Sol / Sağ)',
            axis: 'horizontal',
            default: false
        }
    ],
    visibilityParam: {
        id: 'visState',
        name: 'visState',
        label: 'WC Type / View',
        labelTr: 'Tip ve Görünüm',
        states: [
            { id: 'plan', label: 'Plan: Standard Wall-Hung', labelTr: 'Plan: Standart Asma Klozet' },
            { id: 'plan_accessible', label: 'Plan: Accessible DIN 18040 (Grab Rails)', labelTr: 'Plan: Bedensel Engelli WC (Barlı)' },
            { id: 'elevation_side', label: 'Side Elevation (Mounting Height)', labelTr: 'Yan Görünüş (Montaj Kotu)' }
        ],
        default: 'plan'
    },
    lookupParams: [
        {
            id: 'standardWc',
            name: 'standardWc',
            label: 'Standard WC Categories',
            labelTr: 'Standart Klozet Modelleri',
            options: [
                { id: 'wc_compact', label: 'Kompakt / Dar Alan: Boy=490 mm, En=350 mm', standard: 'EN 997', values: { bowlLength: 490, bowlWidth: 350, visState: 'plan' } },
                { id: 'wc_standard', label: 'Standart Asma: Boy=540 mm, En=360 mm', standard: 'EN 997', values: { bowlLength: 540, bowlWidth: 360, visState: 'plan' } },
                { id: 'wc_accessible', label: 'Bedensel Engelli: Boy=700 mm (DIN 18040)', standard: 'DIN 18040', values: { bowlLength: 700, bowlWidth: 380, visState: 'plan_accessible' } }
            ]
        }
    ],
    defaultValues: {
        bowlLength: 540,
        bowlWidth: 360,
        cisternDepth: 150,
        flipBidet: false,
        visState: 'plan'
    },
    generate2D: (params: Record<string, any>, basePoint: Point = { x: 0, y: 0 }): CadEntity[] => {
        const entities: CadEntity[] = [];
        const length = Number(params.bowlLength || 540);
        const width = Number(params.bowlWidth || 360);
        const cisternD = Number(params.cisternDepth || 150);
        const flip = Boolean(params.flipBidet);
        const visState = String(params.visState || 'plan');

        if (visState === 'elevation_side') {
            // Side Elevation View: Finished Floor to Rim 420mm, Projection, Cistern Box
            const rimH = 420;

            // Finished Floor Line
            entities.push(createLineEntity(
                { x: basePoint.x - 200, y: basePoint.y },
                { x: basePoint.x + length + 200, y: basePoint.y },
                '#64748b'
            ));

            // Wall Vertical Line
            entities.push(createLineEntity(
                { x: basePoint.x, y: basePoint.y },
                { x: basePoint.x, y: basePoint.y + 1150 },
                '#334155'
            ));

            // Toilet Bowl Side Contour
            entities.push(createRectangleEntity(
                { x: basePoint.x + length / 2, y: basePoint.y + rimH - 120 },
                length,
                240,
                0,
                '#00e5ff'
            ));

            // Flush Plate on Wall
            entities.push(createRectangleEntity(
                { x: basePoint.x + 8, y: basePoint.y + 1000 },
                16,
                160,
                0,
                '#f59e0b'
            ));

            return entities;
        }

        // Plan View
        // 1. Concealed Cistern Wall Box (Behind Wall)
        const cisternW = Math.max(500, width + 140);
        entities.push(createRectangleEntity(
            { x: basePoint.x, y: basePoint.y - cisternD / 2 },
            cisternW,
            cisternD,
            0,
            '#334155'
        ));

        // Flush Plate Actuator
        entities.push(createRectangleEntity(
            { x: basePoint.x, y: basePoint.y - 10 },
            240,
            20,
            0,
            '#f59e0b'
        ));

        // Finished Wall Line
        entities.push(createLineEntity(
            { x: basePoint.x - cisternW / 2 - 50, y: basePoint.y },
            { x: basePoint.x + cisternW / 2 + 50, y: basePoint.y },
            '#475569'
        ));

        // 2. Toilet Bowl (Outer Rim)
        const halfW = width / 2;
        const straightL = length * 0.45;
        const frontRadius = halfW;

        // Base rectangular back portion
        entities.push(createLineEntity(
            { x: basePoint.x - halfW, y: basePoint.y },
            { x: basePoint.x - halfW, y: basePoint.y + straightL },
            '#00e5ff'
        ));
        entities.push(createLineEntity(
            { x: basePoint.x + halfW, y: basePoint.y },
            { x: basePoint.x + halfW, y: basePoint.y + straightL },
            '#00e5ff'
        ));
        entities.push(createLineEntity(
            { x: basePoint.x - halfW, y: basePoint.y },
            { x: basePoint.x + halfW, y: basePoint.y },
            '#00e5ff'
        ));

        // Front curved rim
        entities.push(createArcEntity(
            { x: basePoint.x, y: basePoint.y + straightL },
            frontRadius,
            0,
            Math.PI,
            '#00e5ff'
        ));

        // 3. Inner Bowl Ring
        entities.push(createArcEntity(
            { x: basePoint.x, y: basePoint.y + straightL },
            frontRadius - 35,
            0,
            Math.PI * 2,
            '#38bdf8'
        ));

        // Water drain hole
        entities.push(createArcEntity(
            { x: basePoint.x, y: basePoint.y + straightL - 25 },
            25,
            0,
            Math.PI * 2,
            '#0284c7'
        ));

        // Toilet Seat Hinges
        entities.push(createArcEntity(
            { x: basePoint.x - 75, y: basePoint.y + 40 },
            12,
            0,
            Math.PI * 2,
            '#94a3b8'
        ));
        entities.push(createArcEntity(
            { x: basePoint.x + 75, y: basePoint.y + 40 },
            12,
            0,
            Math.PI * 2,
            '#94a3b8'
        ));

        // Bidet Faucet / Spout
        const bidetX = flip ? (basePoint.x + halfW + 40) : (basePoint.x - halfW - 40);
        entities.push(createArcEntity(
            { x: bidetX, y: basePoint.y + 80 },
            15,
            0,
            Math.PI * 2,
            '#ec4899'
        ));

        // 4. Accessible Grab Rails (DIN 18040)
        if (visState === 'plan_accessible') {
            const railOffset = halfW + 150;
            const railLength = length + 100;

            // Left Grab Rail (Folding)
            entities.push(createRectangleEntity(
                { x: basePoint.x - railOffset, y: basePoint.y + railLength / 2 },
                40,
                railLength,
                0,
                '#f59e0b'
            ));
            // Right Grab Rail (Folding)
            entities.push(createRectangleEntity(
                { x: basePoint.x + railOffset, y: basePoint.y + railLength / 2 },
                40,
                railLength,
                0,
                '#f59e0b'
            ));
        }

        return entities;
    },
    getGrips: (params: Record<string, any>, basePoint: Point): DynamicGrip[] => {
        const length = Number(params.bowlLength || 540);
        const width = Number(params.bowlWidth || 360);

        return [
            {
                id: 'grip_origin',
                type: 'point',
                position: { x: basePoint.x, y: basePoint.y },
                paramId: 'origin',
                label: 'Duvar Montaj Noktası'
            },
            {
                id: 'grip_length',
                type: 'linear',
                position: { x: basePoint.x, y: basePoint.y + length },
                direction: { x: 0, y: 1 },
                paramId: 'bowlLength',
                label: 'Klozet Derinliğini Esnet'
            },
            {
                id: 'grip_width',
                type: 'linear',
                position: { x: basePoint.x + width / 2, y: basePoint.y + length * 0.45 },
                direction: { x: 1, y: 0 },
                paramId: 'bowlWidth',
                label: 'Genişlik'
            },
            {
                id: 'grip_flip',
                type: 'flip',
                position: { x: basePoint.x - width / 2 - 50, y: basePoint.y + 80 },
                paramId: 'flipBidet',
                label: 'Taharet Musluğu Tarafı'
            },
            {
                id: 'grip_vis',
                type: 'visibility',
                position: { x: basePoint.x + width / 2 + 50, y: basePoint.y + 80 },
                paramId: 'visState',
                label: 'Standart / Engelli / Kesit'
            }
        ];
    },
    generate3D: (params: Record<string, any>, basePos = { x: 0, y: 0, z: 0 }): DynamicPart3DDef[] => {
        const length = Number(params.bowlLength || 540) / 1000;
        const width = Number(params.bowlWidth || 360) / 1000;
        const cisternD = Number(params.cisternDepth || 150) / 1000;

        return [
            // Cistern Wall Unit
            {
                name: 'WC_Cistern_Wall',
                shape: 'box',
                dimensions: { width: 0.6, height: 1.15, depth: cisternD },
                position: { x: basePos.x, y: basePos.y + 0.575, z: basePos.z - cisternD / 2 },
                color: '#1e293b',
                materialType: 'steel_structural'
            },
            // Ceramic Bowl
            {
                name: 'WC_Bowl_Ceramic',
                shape: 'box',
                dimensions: { width, height: 0.35, depth: length },
                position: { x: basePos.x, y: basePos.y + 0.38, z: basePos.z + length / 2 },
                color: '#ffffff',
                materialType: 'aluminum_anodized'
            },
            // Seat Cover
            {
                name: 'WC_Seat_Lid',
                shape: 'box',
                dimensions: { width: width * 0.95, height: 0.03, depth: length * 0.95 },
                position: { x: basePos.x, y: basePos.y + 0.57, z: basePos.z + length / 2 },
                color: '#f8fafc',
                materialType: 'structural_timber'
            },
            // Flush Plate
            {
                name: 'WC_Flush_Plate',
                shape: 'box',
                dimensions: { width: 0.24, height: 0.16, depth: 0.015 },
                position: { x: basePos.x, y: basePos.y + 0.95, z: basePos.z + 0.01 },
                color: '#00e5ff',
                materialType: 'stainless_316'
            }
        ];
    }
};
