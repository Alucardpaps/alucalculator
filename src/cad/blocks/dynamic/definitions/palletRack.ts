/**
 * 🏭 Dynamic Industrial Pallet Racking System (FEM 10.2.02 / EN 15512)
 * 
 * Industrial Logistics & Structural Dynamic Block:
 * - Dynamic Array Action: Automatic bay count expansion (2700mm Euro-pallet standard = 3 pallets per bay)
 * - Vertical beam tier levels (3 to 6 beam levels)
 * - Visibility: Plan View, Front Elevation (Full Bay Mesh), Side Upright Frame
 * - FEM 10.2.02 European Racking Federation structural load clearances
 */

import { Point, CadEntity, createLineEntity, createRectangleEntity } from '../../../kernel/types';
import { DynamicBlockDef, DynamicGrip, DynamicPart3DDef } from '../types';

export const DYN_PALLET_RACK: DynamicBlockDef = {
    id: 'dyn_pallet_rack',
    name: 'Dynamic Industrial Pallet Rack (FEM 10.2.02)',
    nameTr: 'Dinamik Endüstriyel Ağır Yük Rafı (EN 15512)',
    category: 'Structural',
    subcategory: 'Warehouse & Logistics',
    subcategoryTr: 'Depolama ve Lojistik',
    description: 'AutoCAD-grade parametric heavy-duty warehouse pallet rack with automatic bay & tier arraying.',
    descriptionTr: 'FEM 10.2.02 ve EN 15512 standardında otomatik modül çoğaltmalı, kat seviyeli endüstriyel depo rafı.',
    icon: '🏭',
    citation: {
        tier: 1,
        standard: 'FEM 10.2.02 / EN 15512',
        clause: 'Steel static storage systems - Adjustable pallet racking systems - Principles for structural design',
        description: 'Standard 2700mm 3-Euro-pallet beam lengths, 1100mm frame depth, and 100mm flue space clearance.'
    },
    linearParams: [
        {
            id: 'bayCount',
            name: 'bayCount',
            label: 'Number of Rack Bays',
            labelTr: 'Raf Modül Sayısı (Göz)',
            min: 1,
            max: 10,
            step: 1,
            default: 2,
            unit: 'bays',
            axis: 'x'
        },
        {
            id: 'bayWidth',
            name: 'bayWidth',
            label: 'Clear Bay Width',
            labelTr: 'Modül Açıklığı (Travers)',
            min: 1800,
            max: 3600,
            step: 100,
            default: 2700,
            unit: 'mm',
            axis: 'x'
        },
        {
            id: 'rackDepth',
            name: 'rackDepth',
            label: 'Upright Frame Depth',
            labelTr: 'Raf Ayak Derinliği',
            min: 800,
            max: 1300,
            step: 50,
            default: 1100,
            unit: 'mm',
            axis: 'y'
        },
        {
            id: 'rackHeight',
            name: 'rackHeight',
            label: 'Total Upright Height',
            labelTr: 'Raf Toplam Yüksekliği',
            min: 3000,
            max: 9000,
            step: 500,
            default: 5000,
            unit: 'mm',
            axis: 'y'
        }
    ],
    flipParams: [
        {
            id: 'showPallets',
            name: 'showPallets',
            label: 'Show Pallet Loads (Filled / Empty)',
            labelTr: 'Palet Yüklerini Göster (Dolu / Boş)',
            axis: 'horizontal',
            default: true
        }
    ],
    visibilityParam: {
        id: 'visState',
        name: 'visState',
        label: 'Representation View',
        labelTr: 'Görünüm Durumu',
        states: [
            { id: 'plan', label: 'Plan View (Uprights & Pallets)', labelTr: 'Plan Görünüşü (Ayaklar ve Paletler)' },
            { id: 'elevation_front', label: 'Front Elevation (Beams & Bracing)', labelTr: 'Ön Görünüş (Traversler ve Çaprazlar)' },
            { id: 'elevation_side', label: 'Side Elevation (Upright Frame)', labelTr: 'Yan Görünüş (Kafes Ayak)' }
        ],
        default: 'plan'
    },
    arrayActions: [
        {
            id: 'arr_bays',
            linearParamId: 'bayCount',
            spacing: 2700,
            minCount: 1,
            maxCount: 10,
            label: 'Array Bays along Length',
            labelTr: 'Modül Sayısını Uzat'
        }
    ],
    lookupParams: [
        {
            id: 'standardRacks',
            name: 'standardRacks',
            label: 'Standard Warehouse Configurations',
            labelTr: 'Standart Depo Raf Tipleri',
            options: [
                { id: 'rack_2bay_4m', label: '2 Modül × 4.5m Yükseklik (6 Palet/Göz)', standard: 'FEM 10.2.02', values: { bayCount: 2, bayWidth: 2700, rackDepth: 1100, rackHeight: 4500, visState: 'plan' } },
                { id: 'rack_3bay_6m', label: '3 Modül × 6.0m Yükseklik (Büyük Lojistik Depo)', standard: 'FEM 10.2.02', values: { bayCount: 3, bayWidth: 2700, rackDepth: 1100, rackHeight: 6000, visState: 'plan' } },
                { id: 'rack_4bay_front', label: '4 Modül Ön Görünüş (Cephe İnceleme)', standard: 'EN 15512', values: { bayCount: 4, bayWidth: 2700, rackDepth: 1100, rackHeight: 5000, visState: 'elevation_front' } }
            ]
        }
    ],
    defaultValues: {
        bayCount: 2,
        bayWidth: 2700,
        rackDepth: 1100,
        rackHeight: 5000,
        showPallets: true,
        visState: 'plan'
    },
    generate2D: (params: Record<string, any>, basePoint: Point = { x: 0, y: 0 }): CadEntity[] => {
        const entities: CadEntity[] = [];
        const bayCount = Math.max(1, Math.min(10, Math.round(Number(params.bayCount || 2))));
        const bayW = Number(params.bayWidth || 2700);
        const depth = Number(params.rackDepth || 1100);
        const height = Number(params.rackHeight || 5000);
        const showPallets = Boolean(params.showPallets);
        const visState = String(params.visState || 'plan');

        const postW = 90; // 90mm upright post width
        const totalLength = bayCount * bayW + (bayCount + 1) * postW;

        if (visState === 'elevation_side') {
            // Side Elevation: 2 Upright columns, Base plates, Horizontal and diagonal cross-bracing
            // Left Column
            entities.push(createRectangleEntity(
                { x: basePoint.x + postW / 2, y: basePoint.y + height / 2 },
                postW,
                height,
                0,
                '#38bdf8'
            ));
            // Right Column
            entities.push(createRectangleEntity(
                { x: basePoint.x + depth - postW / 2, y: basePoint.y + height / 2 },
                postW,
                height,
                0,
                '#38bdf8'
            ));

            // Bracing diagonals
            const numPanels = Math.floor(height / 800);
            const panelH = height / numPanels;
            for (let i = 0; i < numPanels; i++) {
                const y1 = basePoint.y + i * panelH;
                const y2 = y1 + panelH;
                entities.push(createLineEntity(
                    { x: basePoint.x + postW, y: y1 },
                    { x: basePoint.x + depth - postW, y: y2 },
                    '#94a3b8'
                ));
            }
            return entities;
        }

        if (visState === 'elevation_front') {
            // Front Elevation: Columns, Horizontal beam tiers (100mm box beam), Pallet footprints
            const tierHeight = 1500;
            const numTiers = Math.floor(height / tierHeight);

            // Upright Posts
            for (let b = 0; b <= bayCount; b++) {
                const colX = basePoint.x + b * (bayW + postW) + postW / 2;
                entities.push(createRectangleEntity(
                    { x: colX, y: basePoint.y + height / 2 },
                    postW,
                    height,
                    0,
                    '#38bdf8'
                ));
            }

            // Horizontal Beams
            for (let b = 0; b < bayCount; b++) {
                const bayLeftX = basePoint.x + b * (bayW + postW) + postW;
                for (let t = 1; t <= numTiers; t++) {
                    const beamY = basePoint.y + t * tierHeight;
                    entities.push(createRectangleEntity(
                        { x: bayLeftX + bayW / 2, y: beamY },
                        bayW,
                        100,
                        0,
                        '#f59e0b'
                    ));

                    // Pallet blocks on beam
                    if (showPallets) {
                        const palletW = 800;
                        const palletH = 1200;
                        for (let p = 0; p < 3; p++) {
                            const px = bayLeftX + 50 + p * (palletW + 75) + palletW / 2;
                            entities.push(createRectangleEntity(
                                { x: px, y: beamY + 50 + palletH / 2 },
                                palletW,
                                palletH,
                                0,
                                '#22c55e'
                            ));
                        }
                    }
                }
            }
            return entities;
        }

        // Plan View
        // 1. Upright Posts (4 corner posts per bay)
        for (let b = 0; b <= bayCount; b++) {
            const colX = basePoint.x + b * (bayW + postW) + postW / 2;
            // Front Post
            entities.push(createRectangleEntity(
                { x: colX, y: basePoint.y + postW / 2 },
                postW,
                postW,
                0,
                '#38bdf8'
            ));
            // Back Post
            entities.push(createRectangleEntity(
                { x: colX, y: basePoint.y + depth - postW / 2 },
                postW,
                postW,
                0,
                '#38bdf8'
            ));
            // Side brace connecting front & back post
            entities.push(createLineEntity(
                { x: colX, y: basePoint.y + postW },
                { x: colX, y: basePoint.y + depth - postW },
                '#94a3b8'
            ));
        }

        // 2. Beams (Front & Back orange load beams)
        for (let b = 0; b < bayCount; b++) {
            const bayLeftX = basePoint.x + b * (bayW + postW) + postW;
            // Front Beam
            entities.push(createRectangleEntity(
                { x: bayLeftX + bayW / 2, y: basePoint.y + postW / 2 },
                bayW,
                50,
                0,
                '#f59e0b'
            ));
            // Back Beam
            entities.push(createRectangleEntity(
                { x: bayLeftX + bayW / 2, y: basePoint.y + depth - postW / 2 },
                bayW,
                50,
                0,
                '#f59e0b'
            ));

            // Euro Pallets (800 × 1200 mm)
            if (showPallets) {
                const palletW = 800;
                const palletD = 1200;
                const spacing = (bayW - 3 * palletW) / 4;

                for (let p = 0; p < 3; p++) {
                    const px = bayLeftX + spacing + p * (palletW + spacing) + palletW / 2;
                    entities.push(createRectangleEntity(
                        { x: px, y: basePoint.y + depth / 2 },
                        palletW,
                        palletD,
                        0,
                        '#22c55e'
                    ));
                    // Inner wood deck plank lines
                    entities.push(createLineEntity(
                        { x: px - palletW / 2 + 100, y: basePoint.y + depth / 2 - palletD / 2 },
                        { x: px - palletW / 2 + 100, y: basePoint.y + depth / 2 + palletD / 2 },
                        '#16a34a'
                    ));
                    entities.push(createLineEntity(
                        { x: px + palletW / 2 - 100, y: basePoint.y + depth / 2 - palletD / 2 },
                        { x: px + palletW / 2 - 100, y: basePoint.y + depth / 2 + palletD / 2 },
                        '#16a34a'
                    ));
                }
            }
        }

        return entities;
    },
    getGrips: (params: Record<string, any>, basePoint: Point): DynamicGrip[] => {
        const bayCount = Math.max(1, Math.min(10, Math.round(Number(params.bayCount || 2))));
        const bayW = Number(params.bayWidth || 2700);
        const depth = Number(params.rackDepth || 1100);
        const postW = 90;
        const totalLength = bayCount * bayW + (bayCount + 1) * postW;

        return [
            {
                id: 'grip_origin',
                type: 'point',
                position: { x: basePoint.x, y: basePoint.y },
                paramId: 'origin',
                label: 'Raf Başlangıç Ayağı'
            },
            {
                id: 'grip_array_bays',
                type: 'linear',
                position: { x: basePoint.x + totalLength, y: basePoint.y + depth / 2 },
                direction: { x: 1, y: 0 },
                paramId: 'bayCount',
                label: 'Modül Sayısını Çoğalt (Array Bays)'
            },
            {
                id: 'grip_depth',
                type: 'linear',
                position: { x: basePoint.x + totalLength / 2, y: basePoint.y + depth },
                direction: { x: 0, y: 1 },
                paramId: 'rackDepth',
                label: 'Ayak Derinliği'
            },
            {
                id: 'grip_flip',
                type: 'flip',
                position: { x: basePoint.x - 50, y: basePoint.y + depth / 2 },
                paramId: 'showPallets',
                label: 'Palet Gösterimi (Dolu / Boş)'
            },
            {
                id: 'grip_vis',
                type: 'visibility',
                position: { x: basePoint.x + 100, y: basePoint.y - 40 },
                paramId: 'visState',
                label: 'Plan / Ön Cephe / Yan Kafes'
            }
        ];
    },
    generate3D: (params: Record<string, any>, basePos = { x: 0, y: 0, z: 0 }): DynamicPart3DDef[] => {
        const bayCount = Math.max(1, Math.min(10, Math.round(Number(params.bayCount || 2))));
        const bayW = Number(params.bayWidth || 2700) / 1000;
        const depth = Number(params.rackDepth || 1100) / 1000;
        const height = Number(params.rackHeight || 5000) / 1000;
        const postW = 0.09;

        const parts: DynamicPart3DDef[] = [];

        // Uprights
        for (let b = 0; b <= bayCount; b++) {
            const colX = basePos.x + b * (bayW + postW) + postW / 2;
            parts.push({
                name: `Rack_Upright_Front_${b + 1}`,
                shape: 'box',
                dimensions: { width: postW, height, depth: postW },
                position: { x: colX, y: basePos.y + height / 2, z: basePos.z + depth / 2 },
                color: '#0284c7',
                materialType: 'steel_structural'
            });
            parts.push({
                name: `Rack_Upright_Back_${b + 1}`,
                shape: 'box',
                dimensions: { width: postW, height, depth: postW },
                position: { x: colX, y: basePos.y + height / 2, z: basePos.z - depth / 2 },
                color: '#0284c7',
                materialType: 'steel_structural'
            });
        }

        // Beams
        const tierLevels = [1.5, 3.0, 4.5];
        for (let b = 0; b < bayCount; b++) {
            const bayCenterX = basePos.x + b * (bayW + postW) + postW + bayW / 2;
            for (const ty of tierLevels) {
                if (ty < height) {
                    parts.push({
                        name: `Rack_Beam_Front_B${b + 1}_Y${ty}`,
                        shape: 'box',
                        dimensions: { width: bayW, height: 0.1, depth: 0.05 },
                        position: { x: bayCenterX, y: basePos.y + ty, z: basePos.z + depth / 2 },
                        color: '#f59e0b',
                        materialType: 'steel_structural'
                    });
                    parts.push({
                        name: `Rack_Beam_Back_B${b + 1}_Y${ty}`,
                        shape: 'box',
                        dimensions: { width: bayW, height: 0.1, depth: 0.05 },
                        position: { x: bayCenterX, y: basePos.y + ty, z: basePos.z - depth / 2 },
                        color: '#f59e0b',
                        materialType: 'steel_structural'
                    });
                }
            }
        }

        return parts;
    }
};
