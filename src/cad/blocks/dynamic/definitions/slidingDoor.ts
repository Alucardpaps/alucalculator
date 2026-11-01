/**
 * 🚪 Dynamic Sliding Glass Door / Hebeschiebe (EN 14351-1 / DIN 18055)
 * 
 * Architectural Dynamic Sliding Door:
 * - Linear stretch: Width (1400-4800 mm), Height (2000-3000 mm)
 * - Interactive panel opening slider (0% to 100%)
 * - Flip sliding direction (Left / Right)
 * - Visibility: 2-Panel (1 Fixed + 1 Slide), 3-Panel, 4-Panel (Center Open), Front Elevation
 * - Standard architectural presets (DIN 18055)
 */

import { Point, CadEntity, createLineEntity, createRectangleEntity } from '../../../kernel/types';
import { DynamicBlockDef, DynamicGrip, DynamicPart3DDef } from '../types';

export const DYN_SLIDING_DOOR: DynamicBlockDef = {
    id: 'dyn_sliding_door',
    name: 'Dynamic Sliding Glass Door',
    nameTr: 'Dinamik Sürme Cam Kapı (Hebeschiebe)',
    category: 'Architectural',
    subcategory: 'Doors & Openings',
    subcategoryTr: 'Kapılar ve Boşluklar',
    description: 'Parametric sliding patio door with adjustable panel count, opening percentage, and frame profiles.',
    descriptionTr: 'Kanat sayısı, açılma yüzdesi ve profil detayları ayarlanabilir dinamik sürme cam kapı.',
    icon: '🪟',
    citation: {
        tier: 1,
        standard: 'EN 14351-1 / DIN 18055',
        clause: 'Clauses 5.1-5.3 (Sliding door sets and weather tightness)',
        description: 'Standard multi-track sliding door profiles, interlocking stiles, and glazing pocket depths.'
    },
    linearParams: [
        {
            id: 'width',
            name: 'width',
            label: 'Total Opening Width',
            labelTr: 'Toplam Açıklık Genişliği',
            min: 1400,
            max: 5000,
            step: 50,
            default: 2400,
            unit: 'mm',
            axis: 'x'
        },
        {
            id: 'height',
            name: 'height',
            label: 'Door Height',
            labelTr: 'Kapı Yüksekliği',
            min: 2000,
            max: 3200,
            step: 50,
            default: 2200,
            unit: 'mm',
            axis: 'y'
        },
        {
            id: 'wallThickness',
            name: 'wallThickness',
            label: 'Wall / Track Depth',
            labelTr: 'Kasa / Ray Derinliği',
            min: 120,
            max: 260,
            step: 10,
            default: 160,
            unit: 'mm',
            axis: 'y'
        },
        {
            id: 'openPercent',
            name: 'openPercent',
            label: 'Opening Percentage',
            labelTr: 'Açılma Yüzdesi',
            min: 0,
            max: 100,
            step: 5,
            default: 30,
            unit: '%',
            axis: 'x'
        }
    ],
    flipParams: [
        {
            id: 'flipDirection',
            name: 'flipDirection',
            label: 'Slide Direction (Left / Right)',
            labelTr: 'Sürme Yönü (Sol / Sağ)',
            axis: 'horizontal',
            default: false
        }
    ],
    visibilityParam: {
        id: 'visState',
        name: 'visState',
        label: 'Panel Configuration',
        labelTr: 'Kanat Tipi / Görünüm',
        states: [
            { id: 'plan_2panel', label: 'Plan: 2 Panels (1 Fixed, 1 Slide)', labelTr: 'Plan: 2 Kanat (1 Sabit, 1 Sürme)' },
            { id: 'plan_3panel', label: 'Plan: 3 Panels (3 Tracks)', labelTr: 'Plan: 3 Kanat (3 Raylı)' },
            { id: 'plan_4panel', label: 'Plan: 4 Panels (Center Opening)', labelTr: 'Plan: 4 Kanat (Ortadan Açılır)' },
            { id: 'elevation', label: 'Front Elevation', labelTr: 'Ön Görünüş (Cephe)' }
        ],
        default: 'plan_2panel'
    },
    lookupParams: [
        {
            id: 'standardSize',
            name: 'standardSize',
            label: 'Standard Sliding Door Size',
            labelTr: 'Standart Sürme Kapı Boyutları',
            options: [
                { id: 'std_1800_2', label: '1800 × 2100 mm (2 Kanat Balkon)', standard: 'DIN 18055', values: { width: 1800, height: 2100, wallThickness: 140, visState: 'plan_2panel' } },
                { id: 'std_2400_2', label: '2400 × 2200 mm (2 Kanat Teras)', standard: 'DIN 18055', values: { width: 2400, height: 2200, wallThickness: 160, visState: 'plan_2panel' } },
                { id: 'std_3000_3', label: '3000 × 2400 mm (3 Kanat Geniş Teras)', standard: 'DIN 18055', values: { width: 3000, height: 2400, wallThickness: 200, visState: 'plan_3panel' } },
                { id: 'std_4000_4', label: '4000 × 2600 mm (4 Kanat Hebeschiebe Villa)', standard: 'DIN 18055', values: { width: 4000, height: 2600, wallThickness: 220, visState: 'plan_4panel' } }
            ]
        }
    ],
    defaultValues: {
        width: 2400,
        height: 2200,
        wallThickness: 160,
        openPercent: 30,
        flipDirection: false,
        visState: 'plan_2panel'
    },
    generate2D: (params: Record<string, any>, basePoint: Point = { x: 0, y: 0 }): CadEntity[] => {
        const entities: CadEntity[] = [];
        const width = Number(params.width || 2400);
        const height = Number(params.height || 2200);
        const wallThickness = Number(params.wallThickness || 160);
        const openPercent = Math.max(0, Math.min(100, Number(params.openPercent ?? 30))) / 100;
        const flip = Boolean(params.flipDirection);
        const visState = String(params.visState || 'plan_2panel');

        const frameProfileW = 60; // 60mm outer jamb
        const sashProfileW = 70;  // 70mm sash frame
        const glassThickness = 8;
        const trackGap = 16;
        const sashDepth = 55;

        if (visState === 'elevation') {
            // Elevation View: Outer frame + Panels + Handles + Glass
            const numPanels = width >= 3600 ? 4 : (width >= 2800 ? 3 : 2);
            const panelW = (width - frameProfileW * 2) / numPanels;

            // Outer Frame
            entities.push(createRectangleEntity(
                { x: basePoint.x + width / 2, y: basePoint.y + height / 2 },
                width,
                height,
                0,
                '#38bdf8'
            ));
            // Inner Clear Opening
            entities.push(createRectangleEntity(
                { x: basePoint.x + width / 2, y: basePoint.y + height / 2 },
                width - frameProfileW * 2,
                height - frameProfileW * 2,
                0,
                '#0284c7'
            ));

            // Sashes
            for (let i = 0; i < numPanels; i++) {
                const px = basePoint.x + frameProfileW + i * panelW + panelW / 2;
                const py = basePoint.y + height / 2;
                entities.push(createRectangleEntity(
                    { x: px, y: py },
                    panelW - 6,
                    height - frameProfileW * 2 - 8,
                    0,
                    '#67e8f9'
                ));
                // Glass pane
                entities.push(createRectangleEntity(
                    { x: px, y: py },
                    panelW - sashProfileW * 2,
                    height - frameProfileW * 2 - sashProfileW * 2,
                    0,
                    '#06b6d4'
                ));
            }

            // Ground Line
            entities.push(createLineEntity(
                { x: basePoint.x - 100, y: basePoint.y },
                { x: basePoint.x + width + 100, y: basePoint.y },
                '#64748b'
            ));
            return entities;
        }

        // Plan View
        // Left & Right Outer Jambs
        entities.push(createRectangleEntity(
            { x: basePoint.x + frameProfileW / 2, y: basePoint.y + wallThickness / 2 },
            frameProfileW,
            wallThickness,
            0,
            '#00e5ff'
        ));
        entities.push(createRectangleEntity(
            { x: basePoint.x + width - frameProfileW / 2, y: basePoint.y + wallThickness / 2 },
            frameProfileW,
            wallThickness,
            0,
            '#00e5ff'
        ));

        // Tracks / threshold lines
        entities.push(createLineEntity(
            { x: basePoint.x + frameProfileW, y: basePoint.y + 10 },
            { x: basePoint.x + width - frameProfileW, y: basePoint.y + 10 },
            '#334155'
        ));
        entities.push(createLineEntity(
            { x: basePoint.x + frameProfileW, y: basePoint.y + wallThickness - 10 },
            { x: basePoint.x + width - frameProfileW, y: basePoint.y + wallThickness - 10 },
            '#334155'
        ));

        const clearW = width - frameProfileW * 2;

        if (visState === 'plan_2panel') {
            const overlap = 60;
            const panelLength = (clearW + overlap) / 2;
            const openTravel = (panelLength - overlap) * openPercent;

            // Fixed Panel (Outer track)
            const fixedStartX = flip ? (basePoint.x + width - frameProfileW - panelLength) : (basePoint.x + frameProfileW);
            const fixedY = basePoint.y + wallThickness / 2 + (sashDepth / 2 + trackGap / 2);
            entities.push(createRectangleEntity(
                { x: fixedStartX + panelLength / 2, y: fixedY },
                panelLength,
                sashDepth,
                0,
                '#38bdf8'
            ));

            // Sliding Panel (Inner track)
            const slideBaseX = flip ? (basePoint.x + frameProfileW) : (basePoint.x + width - frameProfileW - panelLength);
            const slideActualX = flip ? (slideBaseX + openTravel) : (slideBaseX - openTravel);
            const slideY = basePoint.y + wallThickness / 2 - (sashDepth / 2 + trackGap / 2);
            entities.push(createRectangleEntity(
                { x: slideActualX + panelLength / 2, y: slideY },
                panelLength,
                sashDepth,
                0,
                '#00e5ff'
            ));

            // Motion Arrow on sliding panel
            const arrowDir = flip ? 1 : -1;
            const arrowStartX = slideActualX + panelLength / 2 - arrowDir * 80;
            const arrowEndX = slideActualX + panelLength / 2 + arrowDir * 80;
            entities.push(createLineEntity(
                { x: arrowStartX, y: slideY },
                { x: arrowEndX, y: slideY },
                '#f59e0b'
            ));
        } else if (visState === 'plan_4panel') {
            // 4 Panels: 2 Fixed on sides, 2 Sliding from center outwards
            const panelLength = (clearW + 100) / 4;
            const openTravel = (panelLength - 50) * openPercent;

            // Left Fixed
            entities.push(createRectangleEntity(
                { x: basePoint.x + frameProfileW + panelLength / 2, y: basePoint.y + wallThickness / 2 + 25 },
                panelLength,
                sashDepth,
                0,
                '#38bdf8'
            ));
            // Right Fixed
            entities.push(createRectangleEntity(
                { x: basePoint.x + width - frameProfileW - panelLength / 2, y: basePoint.y + wallThickness / 2 + 25 },
                panelLength,
                sashDepth,
                0,
                '#38bdf8'
            ));
            // Left Slide
            entities.push(createRectangleEntity(
                { x: basePoint.x + frameProfileW + panelLength + panelLength / 2 - openTravel, y: basePoint.y + wallThickness / 2 - 25 },
                panelLength,
                sashDepth,
                0,
                '#00e5ff'
            ));
            // Right Slide
            entities.push(createRectangleEntity(
                { x: basePoint.x + width - frameProfileW - panelLength - panelLength / 2 + openTravel, y: basePoint.y + wallThickness / 2 - 25 },
                panelLength,
                sashDepth,
                0,
                '#00e5ff'
            ));
        } else {
            // 3-panel
            const panelLength = (clearW + 80) / 3;
            for (let i = 0; i < 3; i++) {
                const trackY = basePoint.y + 35 + i * 45;
                entities.push(createRectangleEntity(
                    { x: basePoint.x + frameProfileW + i * (panelLength - 40) + panelLength / 2, y: trackY },
                    panelLength,
                    40,
                    0,
                    i === 0 ? '#38bdf8' : '#00e5ff'
                ));
            }
        }

        return entities;
    },
    getGrips: (params: Record<string, any>, basePoint: Point): DynamicGrip[] => {
        const width = Number(params.width || 2400);
        const wallThickness = Number(params.wallThickness || 160);

        return [
            // Base grip
            {
                id: 'grip_origin',
                type: 'point',
                position: { x: basePoint.x, y: basePoint.y },
                paramId: 'origin',
                label: 'Yerleşim Başlangıcı'
            },
            // Width stretch
            {
                id: 'grip_width',
                type: 'linear',
                position: { x: basePoint.x + width, y: basePoint.y + wallThickness / 2 },
                direction: { x: 1, y: 0 },
                paramId: 'width',
                label: 'Açıklık Genişliği Esnet'
            },
            // Wall thickness stretch
            {
                id: 'grip_wall',
                type: 'linear',
                position: { x: basePoint.x + width / 2, y: basePoint.y + wallThickness },
                direction: { x: 0, y: 1 },
                paramId: 'wallThickness',
                label: 'Duvar/Kasa Derinliği'
            },
            // Flip direction grip
            {
                id: 'grip_flip',
                type: 'flip',
                position: { x: basePoint.x + width / 2, y: basePoint.y - 30 },
                paramId: 'flipDirection',
                label: 'Sürme Yönünü Değiştir'
            },
            // Visibility state / lookup
            {
                id: 'grip_vis',
                type: 'visibility',
                position: { x: basePoint.x + 30, y: basePoint.y - 30 },
                paramId: 'visState',
                label: 'Kanat Konfigürasyonu'
            }
        ];
    },
    generate3D: (params: Record<string, any>, basePos = { x: 0, y: 0, z: 0 }): DynamicPart3DDef[] => {
        const width = Number(params.width || 2400) / 1000;
        const height = Number(params.height || 2200) / 1000;
        const depth = Number(params.wallThickness || 160) / 1000;

        return [
            // Outer Frame Left
            {
                name: 'Sliding_Frame_L',
                shape: 'box',
                dimensions: { width: 0.07, height, depth },
                position: { x: basePos.x + 0.035, y: basePos.y + height / 2, z: basePos.z },
                color: '#1e293b',
                materialType: 'aluminum_anodized'
            },
            // Outer Frame Right
            {
                name: 'Sliding_Frame_R',
                shape: 'box',
                dimensions: { width: 0.07, height, depth },
                position: { x: basePos.x + width - 0.035, y: basePos.y + height / 2, z: basePos.z },
                color: '#1e293b',
                materialType: 'aluminum_anodized'
            },
            // Top Header Track
            {
                name: 'Sliding_TopTrack',
                shape: 'box',
                dimensions: { width, height: 0.07, depth },
                position: { x: basePos.x + width / 2, y: basePos.y + height - 0.035, z: basePos.z },
                color: '#1e293b',
                materialType: 'aluminum_anodized'
            },
            // Bottom Sill Track
            {
                name: 'Sliding_BottomTrack',
                shape: 'box',
                dimensions: { width, height: 0.05, depth },
                position: { x: basePos.x + width / 2, y: basePos.y + 0.025, z: basePos.z },
                color: '#0f172a',
                materialType: 'steel_structural'
            },
            // Fixed Glass Panel
            {
                name: 'Sliding_Glass_Fixed',
                shape: 'box',
                dimensions: { width: width * 0.49, height: height * 0.9, depth: 0.02 },
                position: { x: basePos.x + width * 0.25, y: basePos.y + height / 2, z: basePos.z + 0.025 },
                color: '#38bdf8',
                materialType: 'glass_clear'
            },
            // Sliding Glass Panel
            {
                name: 'Sliding_Glass_Active',
                shape: 'box',
                dimensions: { width: width * 0.49, height: height * 0.9, depth: 0.02 },
                position: { x: basePos.x + width * 0.65, y: basePos.y + height / 2, z: basePos.z - 0.025 },
                color: '#00e5ff',
                materialType: 'glass_clear'
            }
        ];
    }
};
