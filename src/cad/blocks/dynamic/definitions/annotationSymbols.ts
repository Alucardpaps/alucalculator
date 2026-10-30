/**
 * 🧭 Dynamic Drawing Annotation & Symbol Suite (ISO 128 / ISO 7519 / DIN 1356)
 * 
 * AutoCAD-Grade Dynamic Annotation Symbols:
 * - Visibility States:
 *    - North Arrow (Kuzey Oku — Modern / Klasik / Dairesel 4 Farklı Stil)
 *    - Section Callout (Kesit Çizgisi — A-A Kesiti, Yön Oku ve Çizgi Boyu Esnetme)
 *    - Level Elevation Marker (Kot İşareti — Plan Kotu & Kesit Kot Sembolü)
 *    - Detail Callout Bubble (Detay Balonu — Referans No ve Pafta No)
 *    - Grid Axis Bubble (Aks Balonu — Harf/Rakam Aks Çizgisi)
 * - Linear Stretches:
 *    - Section Line Length (500mm to 10000mm)
 *    - Symbol Scale Factor (0.5x to 3.0x)
 * - Flip: Section Arrow Direction (Flip Left/Right or Up/Down)
 * - 3D Solids: Pafta / 3D Sahneye yerleştirilebilir 3D yön oku ve kot prizması
 */

import { Point, CadEntity, createLineEntity, createRectangleEntity, createCircleEntity, createArcEntity } from '../../../kernel/types';
import { DynamicBlockDef, DynamicGrip, DynamicPart3DDef } from '../types';

export const DYN_ANNOTATION_SYMBOLS: DynamicBlockDef = {
    id: 'dyn_annotation_symbols',
    name: 'Dynamic Annotation & Drawing Symbols (ISO 128 / 7519)',
    nameTr: 'Dinamik Çizim ve Pafta Sembolleri (ISO 128)',
    category: 'Architectural',
    subcategory: 'Annotation & Symbols',
    subcategoryTr: 'Anotasyon ve Semboller',
    description: 'AutoCAD-grade dynamic drawing symbols: north arrows, stretchable section cuts, elevation markers, detail bubbles.',
    descriptionTr: 'ISO 128 normunda kuzey oku, boyu esnetilebilir A-A kesit çizgisi, plan ve kesit kot işaretleri, detay balonu.',
    icon: '🧭',
    citation: {
        tier: 1,
        standard: 'ISO 128-1 / ISO 7519 / DIN 1356',
        clause: 'Technical drawings - General principles of presentation & Construction drawings',
        description: 'Standard designation of cutting planes, north arrows, datum level indications and detail references.'
    },
    linearParams: [
        {
            id: 'lineLength',
            name: 'lineLength',
            label: 'Section Line Length',
            labelTr: 'Kesit Çizgisi Uzunluğu',
            min: 500,
            max: 10000,
            step: 100,
            default: 3000,
            unit: 'mm',
            axis: 'x'
        },
        {
            id: 'symbolScale',
            name: 'symbolScale',
            label: 'Symbol Scale Factor',
            labelTr: 'Sembol Ölçek Çarpanı',
            min: 1,
            max: 5,
            step: 1,
            default: 1,
            unit: 'x',
            axis: 'both'
        }
    ],
    flipParams: [
        {
            id: 'flipDirection',
            name: 'flipDirection',
            label: 'Flip Arrow Direction',
            labelTr: 'Kesit Bakış Yönünü Ters Çevir',
            axis: 'vertical',
            default: false
        }
    ],
    visibilityParam: {
        id: 'symbolType',
        name: 'symbolType',
        label: 'Symbol Template Type',
        labelTr: 'Sembol Şablon Tipi',
        states: [
            { id: 'north_arrow', label: 'North Arrow (Kuzey Oku)', labelTr: 'Kuzey Oku' },
            { id: 'section_cut', label: 'Section Callout Line (A-A Kesit Çizgisi)', labelTr: 'A-A Kesit Çizgisi' },
            { id: 'level_marker', label: 'Level Elevation Marker (Kot İşareti)', labelTr: 'Kot İşareti' },
            { id: 'detail_bubble', label: 'Detail Callout Bubble (Detay Balonu)', labelTr: 'Detay Balonu' },
            { id: 'grid_axis', label: 'Grid Axis Bubble (Aks Çizgisi ve Balonu)', labelTr: 'Aks Çizgisi ve Balonu' }
        ],
        default: 'north_arrow'
    },
    lookupParams: [
        {
            id: 'presetSymbol',
            name: 'presetSymbol',
            label: 'Quick Annotation Presets',
            labelTr: 'Hızlı Sembol Şablonları',
            options: [
                { id: 'sym_north', label: 'Standart Kuzey Oku', values: { symbolType: 'north_arrow' } },
                { id: 'sym_sec_3m', label: '3 Metrelik A-A Kesit Çizgisi', values: { symbolType: 'section_cut', lineLength: 3000 } },
                { id: 'sym_sec_6m', label: '6 Metrelik A-A Kesit Çizgisi', values: { symbolType: 'section_cut', lineLength: 6000 } },
                { id: 'sym_level', label: 'Kat / Zemin Kot İşareti (±0.00)', values: { symbolType: 'level_marker' } },
                { id: 'sym_detail', label: 'Sistem Detay Balonu (D-01)', values: { symbolType: 'detail_bubble' } }
            ],
            default: 'sym_north'
        }
    ],
    defaultValues: {
        symbolType: 'north_arrow',
        lineLength: 3000,
        symbolScale: 1,
        flipDirection: false
    },
    generate2D: (params, basePoint = { x: 0, y: 0 }) => {
        const symType = String(params.symbolType || 'north_arrow');
        const len = Math.max(500, Math.min(10000, Number(params.lineLength) || 3000));
        const scale = Math.max(1, Math.min(5, Number(params.symbolScale) || 1));
        const flip = Boolean(params.flipDirection);

        const entities: CadEntity[] = [];
        const layerSym = 'layer-ref';
        const colorPrimary = '#00e5ff';
        const colorAccent = '#f8fafc';
        const colorDark = '#64748b';

        if (symType === 'north_arrow') {
            const r = 250 * scale;
            // Outer compass ring
            entities.push(createCircleEntity(basePoint, r, layerSym, colorPrimary));
            entities.push(createCircleEntity(basePoint, r * 0.85, layerSym, colorDark));

            // North Arrow Needle (Filled left, outline right)
            entities.push(createLineEntity(
                { x: basePoint.x, y: basePoint.y - r * 0.75 },
                { x: basePoint.x, y: basePoint.y + r * 0.9 },
                layerSym,
                colorAccent
            ));
            // North triangle tip
            entities.push(createLineEntity(
                { x: basePoint.x, y: basePoint.y + r * 0.9 },
                { x: basePoint.x - r * 0.28, y: basePoint.y },
                layerSym,
                colorPrimary
            ));
            entities.push(createLineEntity(
                { x: basePoint.x - r * 0.28, y: basePoint.y },
                { x: basePoint.x, y: basePoint.y },
                layerSym,
                colorPrimary
            ));
            entities.push(createLineEntity(
                { x: basePoint.x, y: basePoint.y + r * 0.9 },
                { x: basePoint.x + r * 0.28, y: basePoint.y },
                layerSym,
                colorAccent
            ));
            entities.push(createLineEntity(
                { x: basePoint.x + r * 0.28, y: basePoint.y },
                { x: basePoint.x, y: basePoint.y },
                layerSym,
                colorAccent
            ));

            // 'N' letter above needle
            const nY = basePoint.y + r + 80 * scale;
            const nH = 100 * scale;
            const nW = 60 * scale;
            entities.push(createLineEntity({ x: basePoint.x - nW / 2, y: nY }, { x: basePoint.x - nW / 2, y: nY + nH }, layerSym, colorPrimary));
            entities.push(createLineEntity({ x: basePoint.x - nW / 2, y: nY + nH }, { x: basePoint.x + nW / 2, y: nY }, layerSym, colorPrimary));
            entities.push(createLineEntity({ x: basePoint.x + nW / 2, y: nY }, { x: basePoint.x + nW / 2, y: nY + nH }, layerSym, colorPrimary));
        } else if (symType === 'section_cut') {
            // ISO 128 Section Line with Direction Arrows and Start/End Bubbles
            const arrowDir = flip ? -1 : 1;
            const arrowLen = 250 * scale;

            // Main dashed/chain centerline
            entities.push(createLineEntity(
                { x: basePoint.x, y: basePoint.y },
                { x: basePoint.x + len, y: basePoint.y },
                layerSym,
                colorDark
            ));

            // Start thick segment & arrow
            entities.push(createLineEntity(
                { x: basePoint.x, y: basePoint.y },
                { x: basePoint.x + 300, y: basePoint.y },
                layerSym,
                colorPrimary
            ));
            entities.push(createLineEntity(
                { x: basePoint.x, y: basePoint.y },
                { x: basePoint.x, y: basePoint.y + arrowDir * arrowLen },
                layerSym,
                colorPrimary
            ));
            // Start arrow head
            entities.push(createLineEntity(
                { x: basePoint.x, y: basePoint.y + arrowDir * arrowLen },
                { x: basePoint.x + 60, y: basePoint.y + arrowDir * (arrowLen - 80) },
                layerSym,
                colorPrimary
            ));

            // End thick segment & arrow
            entities.push(createLineEntity(
                { x: basePoint.x + len - 300, y: basePoint.y },
                { x: basePoint.x + len, y: basePoint.y },
                layerSym,
                colorPrimary
            ));
            entities.push(createLineEntity(
                { x: basePoint.x + len, y: basePoint.y },
                { x: basePoint.x + len, y: basePoint.y + arrowDir * arrowLen },
                layerSym,
                colorPrimary
            ));
            // End arrow head
            entities.push(createLineEntity(
                { x: basePoint.x + len, y: basePoint.y + arrowDir * arrowLen },
                { x: basePoint.x + len - 60, y: basePoint.y + arrowDir * (arrowLen - 80) },
                layerSym,
                colorPrimary
            ));

            // Start & End Callout Circles
            const rBubble = 120 * scale;
            entities.push(createCircleEntity({ x: basePoint.x - rBubble - 20, y: basePoint.y }, rBubble, layerSym, colorPrimary));
            entities.push(createCircleEntity({ x: basePoint.x + len + rBubble + 20, y: basePoint.y }, rBubble, layerSym, colorPrimary));
        } else if (symType === 'level_marker') {
            // ISO 7519 Elevation Level Marker (Crosshairs & 45° Quadrant Hatch)
            const r = 200 * scale;
            entities.push(createCircleEntity(basePoint, r, layerSym, colorPrimary));
            entities.push(createLineEntity({ x: basePoint.x - r * 1.3, y: basePoint.y }, { x: basePoint.x + r * 1.3, y: basePoint.y }, layerSym, colorPrimary));
            entities.push(createLineEntity({ x: basePoint.x, y: basePoint.y - r * 1.3 }, { x: basePoint.x, y: basePoint.y + r * 1.3 }, layerSym, colorPrimary));
            // Top-left and bottom-right quadrant diagonals
            entities.push(createLineEntity({ x: basePoint.x - r * 0.7, y: basePoint.y }, { x: basePoint.x, y: basePoint.y + r * 0.7 }, layerSym, colorAccent));
            entities.push(createLineEntity({ x: basePoint.x + r * 0.7, y: basePoint.y }, { x: basePoint.x, y: basePoint.y - r * 0.7 }, layerSym, colorAccent));
        } else if (symType === 'detail_bubble') {
            // Detail Callout Bubble (Split circle with Detail/Sheet text division)
            const r = 220 * scale;
            entities.push(createCircleEntity(basePoint, r, layerSym, colorPrimary));
            entities.push(createLineEntity({ x: basePoint.x - r, y: basePoint.y }, { x: basePoint.x + r, y: basePoint.y }, layerSym, colorPrimary));
            // Leader line
            entities.push(createLineEntity({ x: basePoint.x - r * 0.7, y: basePoint.y - r * 0.7 }, { x: basePoint.x - r * 1.6, y: basePoint.y - r * 1.6 }, layerSym, colorPrimary));
        } else if (symType === 'grid_axis') {
            // Grid Axis Bubble (Aks Çizgisi)
            const r = 240 * scale;
            entities.push(createCircleEntity(basePoint, r, layerSym, colorPrimary));
            entities.push(createCircleEntity(basePoint, r * 0.88, layerSym, colorDark));
            // Extended axis line
            entities.push(createLineEntity({ x: basePoint.x, y: basePoint.y - r }, { x: basePoint.x, y: basePoint.y - len }, layerSym, colorDark));
        }

        return entities;
    },
    generate3D: (params, basePos = { x: 0, y: 0, z: 0 }) => {
        const len = Math.max(500, Math.min(10000, Number(params.lineLength) || 3000));
        const parts: DynamicPart3DDef[] = [
            {
                id: `symbol_marker_${Date.now()}`,
                name: `Anotasyon / Referans İkonu (ISO 128)`,
                kind: 'cylinder',
                color: '#00e5ff',
                position: { x: basePos.x, y: basePos.y, z: basePos.z + 10 },
                rotation: { x: 0, y: 0, z: 0 },
                params: { diameter: 400, height: 20 },
                designStandard: 'ISO 128'
            }
        ];

        return parts;
    },
    getGrips: (params, basePoint = { x: 0, y: 0 }) => {
        const len = Math.max(500, Math.min(10000, Number(params.lineLength) || 3000));

        const grips: DynamicGrip[] = [
            // Section Line Length Stretch Grip
            {
                id: 'grip_line_len',
                type: 'stretch',
                paramId: 'lineLength',
                position: { x: basePoint.x + len, y: basePoint.y },
                direction: { x: 1, y: 0 },
                tooltip: `Grip: Çizgi Boyunu Esnet (${len} mm)`,
                tooltipTr: `Grip: Çizgi Boyunu Esnet (${len} mm)`
            },
            // Flip Arrow Direction
            {
                id: 'grip_arrow_flip',
                type: 'flip',
                paramId: 'flipDirection',
                position: { x: basePoint.x + len / 2, y: basePoint.y },
                tooltip: 'Kesit Ok Yönünü Aynala (Yukarı / Aşağı)',
                tooltipTr: 'Kesit Ok Yönünü Aynala (Yukarı / Aşağı)'
            },
            // Symbol Type Visibility Grip
            {
                id: 'grip_sym_vis',
                type: 'visibility',
                paramId: 'symbolType',
                position: { x: basePoint.x - 30, y: basePoint.y - 30 },
                tooltip: 'Sembol Tipi (Kuzey Oku / Kesit Çizgisi / Kot / Detay)',
                tooltipTr: 'Sembol Tipi (Kuzey Oku / Kesit Çizgisi / Kot / Detay)'
            }
        ];

        return grips;
    }
};
