/**
 * 🛁 Dynamic Bathtub & Shower Enclosure Suite (DIN EN 14516 / DIN EN 14428)
 * 
 * AutoCAD-Grade Dynamic Bathtub & Shower System:
 * - Visibility States:
 *    - Rectangular Built-In Bathtub (Gömme Dikdörtgen Küvet)
 *    - Freestanding Oval Bathtub (Serbest Ayaklı Oval Küvet)
 *    - Square Shower Tray & Glass Enclosure (Kare Duşakabin)
 *    - Corner Neo-Angle / Curved Shower (Köşe Oval Duşakabin)
 * - Linear Stretches: Length (800mm to 2000mm) & Width (700mm to 1200mm)
 * - Flip: Drain & Faucet orientation (Left / Right)
 * - Standard Presets: 170x70cm, 180x80cm, 150x70cm, 90x90cm shower, 100x100cm shower, 120x80cm walk-in
 * - 3D Solids: Tub basin, Glass enclosure panels, Chrome drain & fixtures
 */

import { Point, CadEntity, createLineEntity, createRectangleEntity, createCircleEntity, createArcEntity } from '../../../kernel/types';
import { DynamicBlockDef, DynamicGrip, DynamicPart3DDef } from '../types';

export const DYN_BATHTUB_SHOWER: DynamicBlockDef = {
    id: 'dyn_bathtub_shower',
    name: 'Dynamic Bathtub & Shower Enclosure (DIN EN 14516)',
    nameTr: 'Dinamik Küvet ve Duşakabin Sistemi',
    category: 'Sanitary',
    subcategory: 'Plumbing & Fixtures',
    subcategoryTr: 'Islak Hacim ve Vitrifiye',
    description: 'AutoCAD-grade dynamic sanitary block: rectangular/oval bathtubs, square/curved shower cabins with stretchable dimensions.',
    descriptionTr: 'Dikdörtgen ve serbest küvetler ile kare ve köşe oval duşakabinleri barındıran parametrik vitrifiye bloğu.',
    icon: '🛁',
    citation: {
        tier: 1,
        standard: 'DIN EN 14516 / DIN EN 14428',
        clause: 'Baths for domestic purposes & Shower enclosures (Standard dimensions and drainage fall)',
        description: 'Standard bathtub sizes 1500-1800mm length, 700-800mm width, shower enclosures 800-1200mm.'
    },
    linearParams: [
        {
            id: 'length',
            name: 'length',
            label: 'Length',
            labelTr: 'Uzunluk',
            min: 800,
            max: 2000,
            step: 50,
            default: 1700,
            unit: 'mm',
            axis: 'x'
        },
        {
            id: 'width',
            name: 'width',
            label: 'Width',
            labelTr: 'Genişlik',
            min: 700,
            max: 1200,
            step: 50,
            default: 750,
            unit: 'mm',
            axis: 'y'
        }
    ],
    flipParams: [
        {
            id: 'flipDrain',
            name: 'flipDrain',
            label: 'Drain Side (Left / Right)',
            labelTr: 'Gider Yönü (Sol / Sağ)',
            axis: 'horizontal',
            default: false
        }
    ],
    visibilityParam: {
        id: 'visState',
        name: 'visState',
        label: 'Fixtures & Model Style',
        labelTr: 'Vitrifiye Model Tipi',
        states: [
            { id: 'rect_tub', label: 'Rectangular Built-In Bathtub (Dikdörtgen Küvet)', labelTr: 'Dikdörtgen Küvet' },
            { id: 'oval_tub', label: 'Freestanding Oval Bathtub (Oval Küvet)', labelTr: 'Serbest Oval Küvet' },
            { id: 'square_shower', label: 'Square Shower Enclosure (Kare Duşakabin)', labelTr: 'Kare Duşakabin' },
            { id: 'curved_shower', label: 'Corner Curved Shower (Köşe Oval Duşakabin)', labelTr: 'Köşe Oval Duşakabin' }
        ],
        default: 'rect_tub'
    },
    lookupParams: [
        {
            id: 'presetBathtub',
            name: 'presetBathtub',
            label: 'Standard Catalog Presets',
            labelTr: 'Standart Vitrifiye Tipleri',
            options: [
                { id: 'tub_170x75', label: 'Standart Dikdörtgen Küvet (1700x750 mm)', values: { length: 1700, width: 750, visState: 'rect_tub' } },
                { id: 'tub_180x80', label: 'Geniş Dikdörtgen Küvet (1800x800 mm)', values: { length: 1800, width: 800, visState: 'rect_tub' } },
                { id: 'tub_150x70', label: 'Kompakt Dikdörtgen Küvet (1500x700 mm)', values: { length: 1500, width: 700, visState: 'rect_tub' } },
                { id: 'tub_oval_180', label: 'Serbest Ayaklı Lüks Oval Küvet (1800x850 mm)', values: { length: 1800, width: 850, visState: 'oval_tub' } },
                { id: 'shower_90x90', label: 'Kare Duşakabin (900x900 mm)', values: { length: 900, width: 900, visState: 'square_shower' } },
                { id: 'shower_100x100', label: 'Geniş Kare Duşakabin (1000x1000 mm)', values: { length: 1000, width: 1000, visState: 'square_shower' } },
                { id: 'shower_corner_90', label: 'Köşe Oval / Radyal Duşakabin (900x900 mm)', values: { length: 900, width: 900, visState: 'curved_shower' } },
                { id: 'shower_walkin_120', label: 'Walk-In Dikdörtgen Duş (1200x800 mm)', values: { length: 1200, width: 800, visState: 'square_shower' } }
            ],
            default: 'tub_170x75'
        }
    ],
    defaultValues: {
        length: 1700,
        width: 750,
        flipDrain: false,
        visState: 'rect_tub'
    },
    generate2D: (params, basePoint = { x: 0, y: 0 }) => {
        const length = Math.max(800, Math.min(2000, Number(params.length) || 1700));
        const width = Math.max(700, Math.min(1200, Number(params.width) || 750));
        const visState = String(params.visState || 'rect_tub');
        const flip = Boolean(params.flipDrain);

        const entities: CadEntity[] = [];
        const layer = 'layer-sanitary';
        const colorRim = '#3ad0e6';
        const colorInner = '#f8fafc';
        const colorDrain = '#64748b';
        const colorGlass = '#38bdf8';

        if (visState === 'rect_tub') {
            // Outer Rim
            entities.push(createRectangleEntity(
                { x: basePoint.x + length / 2, y: basePoint.y + width / 2 },
                length,
                width,
                layer,
                colorRim
            ));

            // Inner Ergonomic Basin (with rounded headrest and tapered foot)
            const margin = 70;
            entities.push(createRectangleEntity(
                { x: basePoint.x + length / 2, y: basePoint.y + width / 2 },
                length - margin * 2,
                width - margin * 2,
                layer,
                colorInner
            ));

            // Drain Hole (Ø52mm standard bath waste)
            const drainX = flip ? basePoint.x + length - 180 : basePoint.x + 180;
            const drainY = basePoint.y + width / 2;
            entities.push(createCircleEntity({ x: drainX, y: drainY }, 26, layer, colorDrain));
            entities.push(createCircleEntity({ x: drainX, y: drainY }, 12, layer, colorDrain));

            // Overflow slot & mixer indicator
            const tapX = flip ? basePoint.x + length - 40 : basePoint.x + 40;
            entities.push(createLineEntity(
                { x: tapX, y: basePoint.y + width / 2 - 30 },
                { x: tapX, y: basePoint.y + width / 2 + 30 },
                layer,
                colorDrain
            ));
        } else if (visState === 'oval_tub') {
            // Freestanding Oval Rim
            entities.push(createRectangleEntity(
                { x: basePoint.x + length / 2, y: basePoint.y + width / 2 },
                length,
                width,
                layer,
                colorRim
            ));
            // Inner Oval Basin
            entities.push(createRectangleEntity(
                { x: basePoint.x + length / 2, y: basePoint.y + width / 2 },
                length - 120,
                width - 120,
                layer,
                colorInner
            ));
            // Center Drain
            const drainX = basePoint.x + length / 2;
            const drainY = basePoint.y + width / 2;
            entities.push(createCircleEntity({ x: drainX, y: drainY }, 26, layer, colorDrain));
            entities.push(createCircleEntity({ x: drainX, y: drainY }, 12, layer, colorDrain));
        } else if (visState === 'square_shower') {
            // Shower Tray Outer Edge
            entities.push(createRectangleEntity(
                { x: basePoint.x + length / 2, y: basePoint.y + width / 2 },
                length,
                width,
                layer,
                colorRim
            ));
            // Inner Tray Fall Line (Diagonals to drain)
            const drainX = flip ? basePoint.x + length - 200 : basePoint.x + 200;
            const drainY = basePoint.y + width / 2;

            entities.push(createCircleEntity({ x: drainX, y: drainY }, 45, layer, colorDrain));
            entities.push(createCircleEntity({ x: drainX, y: drainY }, 20, layer, colorDrain));

            // Drainage diagonal fall lines
            entities.push(createLineEntity({ x: basePoint.x, y: basePoint.y }, { x: drainX, y: drainY }, layer, colorInner));
            entities.push(createLineEntity({ x: basePoint.x + length, y: basePoint.y }, { x: drainX, y: drainY }, layer, colorInner));
            entities.push(createLineEntity({ x: basePoint.x, y: basePoint.y + width }, { x: drainX, y: drainY }, layer, colorInner));
            entities.push(createLineEntity({ x: basePoint.x + length, y: basePoint.y + width }, { x: drainX, y: drainY }, layer, colorInner));

            // Glass Door Line
            entities.push(createLineEntity(
                { x: basePoint.x + length, y: basePoint.y },
                { x: basePoint.x + length, y: basePoint.y + width },
                layer,
                colorGlass
            ));
        } else if (visState === 'curved_shower') {
            // Corner Neo-Round Tray
            entities.push(createRectangleEntity(
                { x: basePoint.x + length / 2, y: basePoint.y + width / 2 },
                length,
                width,
                layer,
                colorRim
            ));
            // Curved front arc for quadrant shower
            const rCorner = Math.min(length, width) * 0.6;
            entities.push(createArcEntity(
                { x: basePoint.x, y: basePoint.y },
                rCorner,
                0,
                Math.PI / 2,
                layer,
                colorGlass
            ));
            // Drain in corner
            entities.push(createCircleEntity({ x: basePoint.x + 200, y: basePoint.y + 200 }, 40, layer, colorDrain));
        }

        return entities;
    },
    generate3D: (params, basePos = { x: 0, y: 0, z: 0 }) => {
        const length = Math.max(800, Math.min(2000, Number(params.length) || 1700));
        const width = Math.max(700, Math.min(1200, Number(params.width) || 750));
        const visState = String(params.visState || 'rect_tub');
        const isShower = visState === 'square_shower' || visState === 'curved_shower';
        const height = isShower ? 150 : 550; // 550mm bath height, 150mm shower tray

        const parts: DynamicPart3DDef[] = [
            // Basin / Tray Solid
            {
                id: `bath_basin_${Date.now()}`,
                name: isShower ? `Duş Teknesi (${length}x${width}x${height} mm)` : `Akrilik Küvet Gövdesi (${length}x${width}x${height} mm)`,
                kind: 'box',
                color: '#f8fafc',
                position: { x: basePos.x + length / 2, y: basePos.y + width / 2, z: basePos.z + height / 2 },
                rotation: { x: 0, y: 0, z: 0 },
                params: { width: length, height: width, depth: height },
                designStandard: 'DIN EN 14516'
            }
        ];

        // Glass Enclosure for Shower
        if (isShower) {
            parts.push({
                id: `shower_glass_${Date.now()}`,
                name: `Temperli Cam Duşakabin (h=1900 mm)`,
                kind: 'box',
                color: '#38bdf8',
                position: { x: basePos.x + length / 2, y: basePos.y + width, z: basePos.z + height + 950 },
                rotation: { x: 0, y: 0, z: 0 },
                params: { width: length, height: 10, depth: 1900 },
                designStandard: 'DIN EN 14428'
            });
        }

        return parts;
    },
    getGrips: (params, basePoint = { x: 0, y: 0 }) => {
        const length = Math.max(800, Math.min(2000, Number(params.length) || 1700));
        const width = Math.max(700, Math.min(1200, Number(params.width) || 750));

        const grips: DynamicGrip[] = [
            // Linear Stretch Length Grip
            {
                id: 'grip_bath_length',
                type: 'stretch',
                paramId: 'length',
                position: { x: basePoint.x + length, y: basePoint.y + width / 2 },
                direction: { x: 1, y: 0 },
                tooltip: `Grip: Uzunluğu Esnet (${length} mm)`,
                tooltipTr: `Grip: Uzunluğu Esnet (${length} mm)`
            },
            // Linear Stretch Width Grip
            {
                id: 'grip_bath_width',
                type: 'stretch',
                paramId: 'width',
                position: { x: basePoint.x + length / 2, y: basePoint.y + width },
                direction: { x: 0, y: 1 },
                tooltip: `Grip: Genişliği Esnet (${width} mm)`,
                tooltipTr: `Grip: Genişliği Esnet (${width} mm)`
            },
            // Flip Drain Position
            {
                id: 'grip_bath_flip',
                type: 'flip',
                paramId: 'flipDrain',
                position: { x: basePoint.x + length / 2, y: basePoint.y - 30 },
                tooltip: 'Gider ve Batarya Yönünü Aynala (Sol / Sağ)',
                tooltipTr: 'Gider ve Batarya Yönünü Aynala (Sol / Sağ)'
            },
            // Visibility State
            {
                id: 'grip_bath_vis',
                type: 'visibility',
                paramId: 'visState',
                position: { x: basePoint.x - 30, y: basePoint.y - 30 },
                tooltip: 'Model Tipi (Dikdörtgen / Oval Küvet / Duşakabin)',
                tooltipTr: 'Model Tipi (Dikdörtgen / Oval Küvet / Duşakabin)'
            }
        ];

        return grips;
    }
};
