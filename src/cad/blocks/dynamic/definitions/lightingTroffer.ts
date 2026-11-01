/**
 * 💡 Dynamic Modular Ceiling Lighting Troffer (EN 12464-1 / IEC 60598)
 * 
 * Electrical & Architectural Lighting Dynamic Block:
 * - Standard T24 modular ceiling tile sizes: 600x600 mm, 300x1200 mm, 600x1200 mm
 * - Dynamic Matrix Array: Rows & Columns grid distribution
 * - Visibility: Architectural Reflected Ceiling Plan (RCP), Emergency Lighting Kit, Section View
 * - EN 12464-1 indoor workplace illumination standards
 */

import { Point, CadEntity, createLineEntity, createRectangleEntity, createArcEntity } from '../../../kernel/types';
import { DynamicBlockDef, DynamicGrip, DynamicPart3DDef } from '../types';

export const DYN_LIGHTING_TROFFER: DynamicBlockDef = {
    id: 'dyn_lighting_troffer',
    name: 'Dynamic Modular Lighting Troffer',
    nameTr: 'Dinamik Modüler Asma Tavan Armatürü',
    category: 'Electrical',
    subcategory: 'Lighting & Reflected Ceiling',
    subcategoryTr: 'Aydınlatma ve Asma Tavan Planı',
    description: 'AutoCAD-grade parametric ceiling luminaire: 600x600, 300x1200, dynamic matrix arraying, and emergency battery backup.',
    descriptionTr: '600x600, 300x1200 modüllü, acil aydınlatma kitli ve matris çoğaltmalı dinamik tavan aydınlatma armatürü.',
    icon: '💡',
    citation: {
        tier: 1,
        standard: 'EN 12464-1 / IEC 60598-2-2',
        clause: 'Light and lighting - Lighting of work places - Part 1: Indoor work places',
        description: 'Standard 600x600mm European suspended ceiling T-grid spacing, UGR < 19 glare limits, and emergency lux levels.'
    },
    linearParams: [
        {
            id: 'moduleWidth',
            name: 'moduleWidth',
            label: 'Troffer Width (X)',
            labelTr: 'Armatür Modül Genişliği',
            min: 300,
            max: 1200,
            step: 300,
            default: 600,
            unit: 'mm',
            axis: 'x'
        },
        {
            id: 'moduleLength',
            name: 'moduleLength',
            label: 'Troffer Length (Y)',
            labelTr: 'Armatür Modül Boyu',
            min: 600,
            max: 2400,
            step: 300,
            default: 600,
            unit: 'mm',
            axis: 'y'
        },
        {
            id: 'gridCols',
            name: 'gridCols',
            label: 'Array Columns (X)',
            labelTr: 'Kolon Çoğaltma Sayısı (X)',
            min: 1,
            max: 8,
            step: 1,
            default: 1,
            unit: 'cols',
            axis: 'x'
        },
        {
            id: 'gridRows',
            name: 'gridRows',
            label: 'Array Rows (Y)',
            labelTr: 'Satır Çoğaltma Sayısı (Y)',
            min: 1,
            max: 8,
            step: 1,
            default: 1,
            unit: 'rows',
            axis: 'y'
        }
    ],
    flipParams: [
        {
            id: 'emergencyKit',
            name: 'emergencyKit',
            label: 'Emergency Battery Kit (EM / Normal)',
            labelTr: 'Acil Aydınlatma Kiti (KİT / Normal)',
            axis: 'horizontal',
            default: false
        }
    ],
    visibilityParam: {
        id: 'visState',
        name: 'visState',
        label: 'Luminaire Style',
        labelTr: 'Armatür Tipi ve Gösterim',
        states: [
            { id: 'opal_diffuser', label: 'Plan: Opal Diffuser Panel', labelTr: 'Plan: Opal Difüzör LED Panel' },
            { id: 'louvre_cross', label: 'Plan: Parabolic Louvre (Anti-Glare)', labelTr: 'Plan: Parabolik Reflektör / Panjur' },
            { id: 'downlight', label: 'Plan: Circular Recessed Downlight', labelTr: 'Plan: Dairesel Spot / Downlight' },
            { id: 'section', label: 'Ceiling Cross Section (T-Bar)', labelTr: 'Asma Tavan Kesiti (T24 Taşıyıcı)' }
        ],
        default: 'opal_diffuser'
    },
    lookupParams: [
        {
            id: 'standardTroffers',
            name: 'standardTroffers',
            label: 'Standard T-Grid Sizes',
            labelTr: 'Standart Asma Tavan Modülleri',
            options: [
                { id: 'led_600x600', label: '600 × 600 mm Standart Kare LED Panel', standard: 'EN 12464-1', values: { moduleWidth: 600, moduleLength: 600, gridCols: 1, gridRows: 1, visState: 'opal_diffuser' } },
                { id: 'led_300x1200', label: '300 × 1200 mm İnce Uzun Koridor Armatürü', standard: 'EN 12464-1', values: { moduleWidth: 300, moduleLength: 1200, gridCols: 1, gridRows: 1, visState: 'opal_diffuser' } },
                { id: 'led_600x1200', label: '600 × 1200 mm Geniş Ofis Armatürü', standard: 'EN 12464-1', values: { moduleWidth: 600, moduleLength: 1200, gridCols: 1, gridRows: 1, visState: 'louvre_cross' } },
                { id: 'matrix_2x2', label: '2×2 Matris 600x600 Ofis Aydınlatması', standard: 'EN 12464-1', values: { moduleWidth: 600, moduleLength: 600, gridCols: 2, gridRows: 2, visState: 'opal_diffuser' } }
            ]
        }
    ],
    defaultValues: {
        moduleWidth: 600,
        moduleLength: 600,
        gridCols: 1,
        gridRows: 1,
        emergencyKit: false,
        visState: 'opal_diffuser'
    },
    generate2D: (params: Record<string, any>, basePoint: Point = { x: 0, y: 0 }): CadEntity[] => {
        const entities: CadEntity[] = [];
        const modW = Number(params.moduleWidth || 600);
        const modL = Number(params.moduleLength || 600);
        const cols = Math.max(1, Math.min(8, Math.round(Number(params.gridCols || 1))));
        const rows = Math.max(1, Math.min(8, Math.round(Number(params.gridRows || 1))));
        const em = Boolean(params.emergencyKit);
        const visState = String(params.visState || 'opal_diffuser');

        if (visState === 'section') {
            // Ceiling Cross Section: T24 suspension main runner, hanger wire, luminaire body (depth 45mm)
            const ceilingW = modW + 200;
            const bodyDepth = 55;

            // T-Bar grid runners
            entities.push(createLineEntity(
                { x: basePoint.x - 100, y: basePoint.y },
                { x: basePoint.x + ceilingW, y: basePoint.y },
                '#94a3b8'
            ));

            // Luminaire Housing
            entities.push(createRectangleEntity(
                { x: basePoint.x + modW / 2, y: basePoint.y + bodyDepth / 2 },
                modW - 10,
                bodyDepth,
                0,
                '#38bdf8'
            ));

            // Opal Diffuser lens (Flush with T-Bar)
            entities.push(createRectangleEntity(
                { x: basePoint.x + modW / 2, y: basePoint.y + 4 },
                modW - 4,
                8,
                0,
                '#facc15'
            ));

            // Suspension hanger wires
            entities.push(createLineEntity(
                { x: basePoint.x + modW * 0.2, y: basePoint.y + bodyDepth },
                { x: basePoint.x + modW * 0.2, y: basePoint.y + bodyDepth + 400 },
                '#64748b'
            ));
            entities.push(createLineEntity(
                { x: basePoint.x + modW * 0.8, y: basePoint.y + bodyDepth },
                { x: basePoint.x + modW * 0.8, y: basePoint.y + bodyDepth + 400 },
                '#64748b'
            ));
            return entities;
        }

        // Plan View Matrix
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const cellX = basePoint.x + c * modW;
                const cellY = basePoint.y + r * modL;
                const center = { x: cellX + modW / 2, y: cellY + modL / 2 };

                // 1. Outer T24 Grid Border
                entities.push(createRectangleEntity(
                    center,
                    modW,
                    modL,
                    0,
                    '#334155'
                ));

                // 2. Luminaire Face
                if (visState === 'downlight') {
                    // Circular Spot
                    const radius = Math.min(modW, modL) * 0.35;
                    entities.push(createArcEntity(center, radius, 0, Math.PI * 2, '#facc15'));
                    entities.push(createArcEntity(center, radius * 0.6, 0, Math.PI * 2, '#00e5ff'));
                } else if (visState === 'louvre_cross') {
                    // Parabolic cross-louvre blades
                    entities.push(createRectangleEntity(center, modW - 30, modL - 30, 0, '#00e5ff'));
                    // Cross blades
                    const numBlades = Math.floor(modL / 100);
                    for (let b = 1; b < numBlades; b++) {
                        const by = cellY + 15 + b * (modL - 30) / numBlades;
                        entities.push(createLineEntity(
                            { x: cellX + 15, y: by },
                            { x: cellX + modW - 15, y: by },
                            '#38bdf8'
                        ));
                    }
                } else {
                    // Opal Diffuser Panel (Classic European architectural RCP symbol)
                    entities.push(createRectangleEntity(center, modW - 24, modL - 24, 0, '#00e5ff'));
                    // Diagonals (X symbol for lighting troffer)
                    entities.push(createLineEntity(
                        { x: cellX + 12, y: cellY + 12 },
                        { x: cellX + modW - 12, y: cellY + modL - 12 },
                        '#38bdf8'
                    ));
                    entities.push(createLineEntity(
                        { x: cellX + 12, y: cellY + modL - 12 },
                        { x: cellX + modW - 12, y: cellY + 12 },
                        '#38bdf8'
                    ));
                }

                // Emergency battery backup green dot / indicator
                if (em) {
                    entities.push(createArcEntity(
                        { x: cellX + modW - 35, y: cellY + modL - 35 },
                        14,
                        0,
                        Math.PI * 2,
                        '#22c55e'
                    ));
                }
            }
        }

        return entities;
    },
    getGrips: (params: Record<string, any>, basePoint: Point): DynamicGrip[] => {
        const modW = Number(params.moduleWidth || 600);
        const modL = Number(params.moduleLength || 600);
        const cols = Math.max(1, Math.min(8, Math.round(Number(params.gridCols || 1))));
        const rows = Math.max(1, Math.min(8, Math.round(Number(params.gridRows || 1))));
        const totalW = cols * modW;
        const totalL = rows * modL;

        return [
            {
                id: 'grip_origin',
                type: 'point',
                position: basePoint,
                paramId: 'origin',
                label: 'T-Profil Grid Başlangıcı'
            },
            {
                id: 'grip_array_cols',
                type: 'linear',
                position: { x: basePoint.x + totalW, y: basePoint.y + totalL / 2 },
                direction: { x: 1, y: 0 },
                paramId: 'gridCols',
                label: 'Yatayda Çoğalt (Array Columns)'
            },
            {
                id: 'grip_array_rows',
                type: 'linear',
                position: { x: basePoint.x + totalW / 2, y: basePoint.y + totalL },
                direction: { x: 0, y: 1 },
                paramId: 'gridRows',
                label: 'Düşeyde Çoğalt (Array Rows)'
            },
            {
                id: 'grip_flip',
                type: 'flip',
                position: { x: basePoint.x - 30, y: basePoint.y + totalL / 2 },
                paramId: 'emergencyKit',
                label: 'Acil Aydınlatma Kiti Ekle/Çıkar'
            },
            {
                id: 'grip_vis',
                type: 'visibility',
                position: { x: basePoint.x + 40, y: basePoint.y - 30 },
                paramId: 'visState',
                label: 'Opal Panel / Panjurlu / Downlight / Kesit'
            }
        ];
    },
    generate3D: (params: Record<string, any>, basePos = { x: 0, y: 0, z: 0 }): DynamicPart3DDef[] => {
        const modW = Number(params.moduleWidth || 600) / 1000;
        const modL = Number(params.moduleLength || 600) / 1000;
        const cols = Math.max(1, Math.min(8, Math.round(Number(params.gridCols || 1))));
        const rows = Math.max(1, Math.min(8, Math.round(Number(params.gridRows || 1))));

        const parts: DynamicPart3DDef[] = [];

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const px = basePos.x + c * modW + modW / 2;
                const pz = basePos.z + r * modL + modL / 2;

                parts.push({
                    name: `Troffer_Frame_R${r}_C${c}`,
                    shape: 'box',
                    dimensions: { width: modW, height: 0.045, depth: modL },
                    position: { x: px, y: basePos.y - 0.0225, z: pz },
                    color: '#f8fafc',
                    materialType: 'aluminum_anodized'
                });

                parts.push({
                    name: `Troffer_LED_Panel_R${r}_C${c}`,
                    shape: 'box',
                    dimensions: { width: modW - 0.02, height: 0.005, depth: modL - 0.02 },
                    position: { x: px, y: basePos.y - 0.042, z: pz },
                    color: '#fef08a',
                    materialType: 'glass_clear'
                });
            }
        }

        return parts;
    }
};
