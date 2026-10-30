/**
 * 🪟 Architectural Dynamic Window Block (EN 14351-1 / DIN 18055)
 * 
 * - Linear stretch: Width (600 - 3000 mm), Height (600 - 2400 mm), Wall Thickness (150 - 350 mm)
 * - Automatic sash and mullion array: 1, 2, 3, or 4 sashes based on width
 * - Visibility: Plan Cut View, Front Elevation, Window Cross Section
 * - Standard DIN window presets: 800x1200, 1200x1400, 1600x1400, 2000x2100 (French)
 */

import { Point, CadEntity, createLineEntity, createRectangleEntity } from '../../../kernel/types';
import { DynamicBlockDef, DynamicGrip, DynamicPart3DDef } from '../types';

export const DYN_WINDOW: DynamicBlockDef = {
    id: 'dyn_window',
    name: 'Architectural Dynamic Window',
    nameTr: 'Dinamik Mimari Doğrama Pencere',
    category: 'Architectural',
    subcategory: 'Windows & Facade',
    subcategoryTr: 'Pencereler ve Cephe',
    description: 'AutoCAD-grade dynamic window: stretches width/height, automatically adds vertical mullions and sashes.',
    descriptionTr: 'Genişlik ve yüksekliği esnetilebilir, otomatik kanat/kayıt dizilimli dinamik mimari pencere.',
    icon: '🪟',
    citation: {
        tier: 1,
        standard: 'EN 14351-1 / DIN 18055',
        clause: 'Windows and doors - Product standard, performance characteristics',
        description: 'Standard 70-80mm window profile depths, thermal break chambers, and standard structural mullion spacings.'
    },
    linearParams: [
        {
            id: 'width',
            name: 'width',
            label: 'Window Width',
            labelTr: 'Pencere Genişliği',
            min: 600,
            max: 3200,
            step: 50,
            default: 1200,
            unit: 'mm',
            axis: 'x'
        },
        {
            id: 'height',
            name: 'height',
            label: 'Window Height',
            labelTr: 'Pencere Yüksekliği',
            min: 600,
            max: 2400,
            step: 50,
            default: 1400,
            unit: 'mm',
            axis: 'y'
        },
        {
            id: 'wallThickness',
            name: 'wallThickness',
            label: 'Wall Thickness',
            labelTr: 'Duvar Kalınlığı',
            min: 150,
            max: 350,
            step: 10,
            default: 200,
            unit: 'mm',
            axis: 'y'
        }
    ],
    visibilityParam: {
        id: 'visState',
        name: 'visState',
        label: 'Representation View',
        labelTr: 'Görünüş Seçimi',
        states: [
            { id: 'plan', label: 'Plan View (Duvar İçi Plan Kesiti)', labelTr: 'Plan Görünüşü' },
            { id: 'elevation', label: 'Front Elevation (Kayıtlı Ön Cephe)', labelTr: 'Ön Cephe Görünüşü' },
            { id: 'section', label: 'Vertical Section (Düşey Kesit)', labelTr: 'Düşey Kesit' }
        ],
        default: 'plan'
    },
    lookupParams: [
        {
            id: 'standardPreset',
            name: 'standardPreset',
            label: 'Standard Window Size',
            labelTr: 'Standart Pencere Boyutu',
            options: [
                { id: 'w_800_1200', label: '800 × 1200 mm (Tek Kanat)', values: { width: 800, height: 1200 } },
                { id: 'w_1200_1400', label: '1200 × 1400 mm (Çift Kanat)', values: { width: 1200, height: 1400 } },
                { id: 'w_1600_1400', label: '1600 × 1400 mm (3 Kanat / Orta Sabit)', values: { width: 1600, height: 1400 } },
                { id: 'w_2000_2100', label: '2000 × 2100 mm (Fransız Balkon Doğraması)', values: { width: 2000, height: 2100 } }
            ],
            default: 'w_1200_1400'
        }
    ],
    arrayActions: [
        {
            id: 'array_sashes',
            linearParamId: 'width',
            spacing: 700,
            minCount: 1,
            maxCount: 4,
            label: 'Sash & Mullion Divisions',
            labelTr: 'Kanat ve Düşey Kayıt Bölüntüsü'
        }
    ],
    defaultValues: {
        width: 1200,
        height: 1400,
        wallThickness: 200,
        visState: 'plan'
    },
    generate2D: (params, basePoint = { x: 0, y: 0 }) => {
        const width = Number(params.width) || 1200;
        const height = Number(params.height) || 1400;
        const wallT = Number(params.wallThickness) || 200;
        const state = String(params.visState || 'plan');

        const entities: CadEntity[] = [];
        const layer = 'layer-arch';
        const colorFrame = '#3ad0e6';
        const colorGlass = '#38bdf8';
        const colorWall = '#94a3b8';
        const frameW = 60; // 60mm PVC/Alu frame width
        const frameD = 70; // 70mm profile depth

        if (state === 'plan') {
            // Plan View: Left Wall, Right Wall, Window Frame, Glass Panes, Sill (Denizlik)
            // Left & Right Wall Opening lines
            entities.push(createLineEntity({ x: basePoint.x - 200, y: basePoint.y }, { x: basePoint.x, y: basePoint.y }, layer, colorWall));
            entities.push(createLineEntity({ x: basePoint.x - 200, y: basePoint.y + wallT }, { x: basePoint.x, y: basePoint.y + wallT }, layer, colorWall));
            entities.push(createLineEntity({ x: basePoint.x + width, y: basePoint.y }, { x: basePoint.x + width + 200, y: basePoint.y }, layer, colorWall));
            entities.push(createLineEntity({ x: basePoint.x + width, y: basePoint.y + wallT }, { x: basePoint.x + width + 200, y: basePoint.y + wallT }, layer, colorWall));

            // Sill (Exterior Denizlik): extends 30mm out
            entities.push(createRectangleEntity(
                { x: basePoint.x + width / 2, y: basePoint.y - 15 },
                width + 60,
                30,
                layer,
                '#64748b'
            ));

            // Window Frame in wall opening (centered in wall thickness)
            const frameY = basePoint.y + (wallT - frameD) / 2;
            // Left jamb
            entities.push(createRectangleEntity({ x: basePoint.x + frameW / 2, y: frameY + frameD / 2 }, frameW, frameD, layer, colorFrame));
            // Right jamb
            entities.push(createRectangleEntity({ x: basePoint.x + width - frameW / 2, y: frameY + frameD / 2 }, frameW, frameD, layer, colorFrame));

            // Dynamic Mullions (Düşey Kayıtlar)
            const sashCount = Math.max(1, Math.min(4, Math.round(width / 700)));
            if (sashCount > 1) {
                const sashW = (width - frameW * 2) / sashCount;
                for (let i = 1; i < sashCount; i++) {
                    const mullionX = basePoint.x + frameW + i * sashW;
                    entities.push(createRectangleEntity({ x: mullionX, y: frameY + frameD / 2 }, frameW, frameD, layer, colorFrame));
                }
            }

            // Glass Panes (Double Glazing: 2 lines)
            entities.push(createLineEntity(
                { x: basePoint.x + frameW, y: frameY + frameD / 2 - 4 },
                { x: basePoint.x + width - frameW, y: frameY + frameD / 2 - 4 },
                layer,
                colorGlass
            ));
            entities.push(createLineEntity(
                { x: basePoint.x + frameW, y: frameY + frameD / 2 + 4 },
                { x: basePoint.x + width - frameW, y: frameY + frameD / 2 + 4 },
                layer,
                colorGlass
            ));

            return entities;
        }

        if (state === 'elevation') {
            // Front Elevation: Outer Frame + Dynamic Sashes + Opening Direction Lines
            entities.push(createRectangleEntity(
                { x: basePoint.x + width / 2, y: basePoint.y + height / 2 },
                width,
                height,
                layer,
                colorFrame
            ));
            entities.push(createRectangleEntity(
                { x: basePoint.x + width / 2, y: basePoint.y + height / 2 },
                width - frameW * 2,
                height - frameW * 2,
                layer,
                colorFrame
            ));

            const sashCount = Math.max(1, Math.min(4, Math.round(width / 700)));
            const innerW = width - frameW * 2;
            const sashW = innerW / sashCount;

            for (let i = 0; i < sashCount; i++) {
                const sashCenterX = basePoint.x + frameW + i * sashW + sashW / 2;
                // Sash profile
                entities.push(createRectangleEntity(
                    { x: sashCenterX, y: basePoint.y + height / 2 },
                    sashW - 6,
                    height - frameW * 2 - 6,
                    layer,
                    colorGlass
                ));

                // Opening Direction Diagonal Lines (Dashed / Thin)
                const sLeft = sashCenterX - sashW / 2 + 10;
                const sRight = sashCenterX + sashW / 2 - 10;
                const sTop = basePoint.y + height - frameW - 10;
                const sBottom = basePoint.y + frameW + 10;
                const sMidY = basePoint.y + height / 2;

                // Alternate swing direction
                if (i % 2 === 0) {
                    entities.push(createLineEntity({ x: sLeft, y: sTop }, { x: sRight, y: sMidY }, layer, '#64748b'));
                    entities.push(createLineEntity({ x: sLeft, y: sBottom }, { x: sRight, y: sMidY }, layer, '#64748b'));
                } else {
                    entities.push(createLineEntity({ x: sRight, y: sTop }, { x: sLeft, y: sMidY }, layer, '#64748b'));
                    entities.push(createLineEntity({ x: sRight, y: sBottom }, { x: sLeft, y: sMidY }, layer, '#64748b'));
                }
            }
            return entities;
        }

        // Section View (Düşey Kesit)
        entities.push(createRectangleEntity(
            { x: basePoint.x + frameD / 2, y: basePoint.y + height / 2 },
            frameD,
            height,
            layer,
            colorFrame
        ));
        return entities;
    },
    generate3D: (params, basePos = { x: 0, y: 0, z: 0 }) => {
        const width = Number(params.width) || 1200;
        const height = Number(params.height) || 1400;
        const frameW = 60;
        const frameD = 70;

        const parts: DynamicPart3DDef[] = [
            // Left Frame
            {
                id: `win_left_${Date.now()}`,
                name: 'Pencere Sol Kasa',
                kind: 'box',
                color: '#f8fafc',
                position: { x: basePos.x + frameW / 2, y: basePos.y + height / 2, z: basePos.z + frameD / 2 },
                rotation: { x: 0, y: 0, z: 0 },
                params: { width: frameW, height: height, depth: frameD }
            },
            // Right Frame
            {
                id: `win_right_${Date.now()}`,
                name: 'Pencere Sağ Kasa',
                kind: 'box',
                color: '#f8fafc',
                position: { x: basePos.x + width - frameW / 2, y: basePos.y + height / 2, z: basePos.z + frameD / 2 },
                rotation: { x: 0, y: 0, z: 0 },
                params: { width: frameW, height: height, depth: frameD }
            },
            // Top Frame
            {
                id: `win_top_${Date.now()}`,
                name: 'Pencere Üst Kasa',
                kind: 'box',
                color: '#f8fafc',
                position: { x: basePos.x + width / 2, y: basePos.y + height - frameW / 2, z: basePos.z + frameD / 2 },
                rotation: { x: 0, y: 0, z: 0 },
                params: { width: width - frameW * 2, height: frameW, depth: frameD }
            },
            // Bottom Frame / Sill
            {
                id: `win_bottom_${Date.now()}`,
                name: 'Pencere Alt Kasa',
                kind: 'box',
                color: '#f8fafc',
                position: { x: basePos.x + width / 2, y: basePos.y + frameW / 2, z: basePos.z + frameD / 2 },
                rotation: { x: 0, y: 0, z: 0 },
                params: { width: width - frameW * 2, height: frameW, depth: frameD }
            },
            // Glass Pane
            {
                id: `win_glass_${Date.now()}`,
                name: 'Çift Cam Yalıtım Ünitesi (4+16+4 mm)',
                kind: 'box',
                color: '#00e5ff',
                position: { x: basePos.x + width / 2, y: basePos.y + height / 2, z: basePos.z + frameD / 2 },
                rotation: { x: 0, y: 0, z: 0 },
                params: { width: width - frameW * 2, height: height - frameW * 2, depth: 24 },
                designStandard: 'EN 1279'
            }
        ];

        return parts;
    },
    getGrips: (params, basePoint = { x: 0, y: 0 }) => {
        const width = Number(params.width) || 1200;
        const height = Number(params.height) || 1400;

        const grips: DynamicGrip[] = [
            // Linear Stretch Width Grip
            {
                id: 'grip_win_width',
                type: 'stretch',
                paramId: 'width',
                position: { x: basePoint.x + width, y: basePoint.y + height / 2 },
                direction: { x: 1, y: 0 },
                tooltip: `Grip: Pencere Genişliği (${width} mm)`,
                tooltipTr: `Grip: Pencere Genişliği (${width} mm)`
            },
            // Linear Stretch Height Grip
            {
                id: 'grip_win_height',
                type: 'stretch',
                paramId: 'height',
                position: { x: basePoint.x + width / 2, y: basePoint.y + height },
                direction: { x: 0, y: 1 },
                tooltip: `Grip: Pencere Yüksekliği (${height} mm)`,
                tooltipTr: `Grip: Pencere Yüksekliği (${height} mm)`
            },
            // Visibility State
            {
                id: 'grip_win_vis',
                type: 'visibility',
                paramId: 'visState',
                position: { x: basePoint.x - 40, y: basePoint.y - 40 },
                tooltip: 'Görünüş Değiştir (Plan / Ön Cephe / Kesit)',
                tooltipTr: 'Görünüş Değiştir (Plan / Ön Cephe / Kesit)'
            }
        ];

        return grips;
    }
};
