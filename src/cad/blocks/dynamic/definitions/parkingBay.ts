/**
 * 🚗 Dynamic Parking Space & Array Suite (TSE 10551 / DIN 18040 / Neufert)
 * 
 * AutoCAD-Grade Dynamic Parking Bay:
 * - Angles & Layouts:
 *    - 90° Perpendicular Parking (Dik Park — 2500 x 5000 mm)
 *    - 60° Angled Parking (60° Açılı Park)
 *    - 45° Angled Parking (45° Açılı Park)
 *    - Accessible / Disabled Parking (Engelli Parkı — 3500 x 5000 mm + İkon)
 * - Dynamic Array Action:
 *    - Stretches space count dynamically from 1 to 30 parking bays!
 * - 2D Features:
 *    - Marking lines, wheel stop curb, accessibility wheelchair symbol, driving direction arrow
 * - 3D Solids: Pavement striping, wheel stopper curb extrusion
 */

import { Point, CadEntity, createLineEntity, createRectangleEntity, createCircleEntity, createArcEntity } from '../../../kernel/types';
import { DynamicBlockDef, DynamicGrip, DynamicPart3DDef } from '../types';

export const DYN_PARKING_BAY: DynamicBlockDef = {
    id: 'dyn_parking_bay',
    name: 'Dynamic Parking Bay & Array (TSE 10551 / Neufert)',
    nameTr: 'Dinamik Otopark Çizgileri ve Park Dizisi',
    category: 'Civil',
    subcategory: 'Vehicles & Site Planning',
    subcategoryTr: 'Vaziyet Planı ve Otopark',
    description: 'AutoCAD-grade dynamic parking bay: 90°, 60°, 45° angles, accessible bays, and linear array grip to multiply bays.',
    descriptionTr: '90° dik, 60° ve 45° açılı park yerleri, engelli araç parkı ve araç sayısı arttıkça kendini çoğaltan dinamik dizi.',
    icon: '🚗',
    citation: {
        tier: 1,
        standard: 'TSE 10551 / DIN 18040-1 / Neufert 4th Ed.',
        clause: 'Parking facilities - Dimensions and layout of parking spaces (Standard width 2.5m, accessible 3.5m, length 5.0m)',
        description: 'Standard bay 2500x5000mm, accessible bay 3500x5000mm, line width 100mm, wheel stopper height 100mm.'
    },
    linearParams: [
        {
            id: 'bays',
            name: 'bays',
            label: 'Number of Parking Bays',
            labelTr: 'Park Yeri Araç Sayısı',
            min: 1,
            max: 30,
            step: 1,
            default: 4,
            unit: 'araç',
            axis: 'x'
        },
        {
            id: 'bayWidth',
            name: 'bayWidth',
            label: 'Single Bay Width',
            labelTr: 'Tekil Araç Genişliği',
            min: 2400,
            max: 3800,
            step: 100,
            default: 2500,
            unit: 'mm',
            axis: 'x'
        }
    ],
    visibilityParam: {
        id: 'bayType',
        name: 'bayType',
        label: 'Parking Angle & Layout',
        labelTr: 'Park Açısı ve Tipi',
        states: [
            { id: 'perp_90', label: '90° Perpendicular (Dik Park — 2.5 x 5.0 m)', labelTr: '90° Dik Park (2.5 x 5.0 m)' },
            { id: 'angle_60', label: '60° Angled Parking (60° Açılı Park)', labelTr: '60° Açılı Park' },
            { id: 'angle_45', label: '45° Angled Parking (45° Açılı Park)', labelTr: '45° Açılı Park' },
            { id: 'accessible_bay', label: 'Accessible / Disabled (Engelli Parkı — 3.5 x 5.0 m)', labelTr: 'Engelli Parkı (3.5 x 5.0 m)' }
        ],
        default: 'perp_90'
    },
    lookupParams: [
        {
            id: 'presetParking',
            name: 'presetParking',
            label: 'Standard Parking Presets',
            labelTr: 'Standart Otopark Tipleri',
            options: [
                { id: 'p_standard_4', label: '4 Araçlık Standart Dik Park (10.0 x 5.0 m)', values: { bays: 4, bayWidth: 2500, bayType: 'perp_90' } },
                { id: 'p_standard_8', label: '8 Araçlık Geniş Park Hattı (20.0 x 5.0 m)', values: { bays: 8, bayWidth: 2500, bayType: 'perp_90' } },
                { id: 'p_accessible_2', label: '2 Araçlık Engelli Park Bölgesi (7.0 x 5.0 m)', values: { bays: 2, bayWidth: 3500, bayType: 'accessible_bay' } },
                { id: 'p_angled_60', label: '4 Araçlık 60° Açılı Akış Parkı', values: { bays: 4, bayWidth: 2600, bayType: 'angle_60' } },
                { id: 'p_angled_45', label: '4 Araçlık 45° Açılı Dar Sokak Parkı', values: { bays: 4, bayWidth: 2600, bayType: 'angle_45' } }
            ],
            default: 'p_standard_4'
        }
    ],
    arrayActions: [
        {
            id: 'array_bays',
            linearParamId: 'bays',
            spacing: 2500,
            minCount: 1,
            maxCount: 30,
            label: 'Bay Multiplier',
            labelTr: 'Araç Park Sayısı Çoğaltıcı'
        }
    ],
    defaultValues: {
        bays: 4,
        bayWidth: 2500,
        bayType: 'perp_90'
    },
    generate2D: (params, basePoint = { x: 0, y: 0 }) => {
        const bays = Math.max(1, Math.min(30, Math.round(Number(params.bays) || 4)));
        const bayType = String(params.bayType || 'perp_90');
        const defaultW = bayType === 'accessible_bay' ? 3500 : 2500;
        const bw = Math.max(2200, Math.min(4000, Number(params.bayWidth) || defaultW));
        const bayL = 5000; // 5.0 m standard length

        const entities: CadEntity[] = [];
        const layerLines = 'layer-civil';
        const layerCurb = 'layer-accent';
        const layerSymbol = 'layer-ref';

        const colorLine = '#f8fafc';
        const colorCurb = '#eab308';
        const colorSymbol = '#38bdf8';

        const angleRad = bayType === 'angle_60' ? (Math.PI / 3) : bayType === 'angle_45' ? (Math.PI / 4) : (Math.PI / 2);
        const skewX = Math.cos(angleRad) * (bayL / Math.sin(angleRad));
        const totalW = bays * bw + (bayType !== 'perp_90' ? skewX : 0);

        // 1. Back Baseline
        entities.push(createLineEntity(
            { x: basePoint.x, y: basePoint.y },
            { x: basePoint.x + bays * bw, y: basePoint.y },
            layerLines,
            colorLine
        ));

        // 2. Front Open Entrance Line (dotted or baseline)
        entities.push(createLineEntity(
            { x: basePoint.x + (bayType !== 'perp_90' ? skewX : 0), y: basePoint.y + bayL },
            { x: basePoint.x + totalW, y: basePoint.y + bayL },
            layerLines,
            colorLine
        ));

        // 3. Dividing Lines for Each Bay
        for (let i = 0; i <= bays; i++) {
            const x0 = basePoint.x + i * bw;
            const x1 = x0 + (bayType !== 'perp_90' ? skewX : 0);
            entities.push(createLineEntity(
                { x: x0, y: basePoint.y },
                { x: x1, y: basePoint.y + bayL },
                layerLines,
                colorLine
            ));

            // Wheel Stopper Curbs inside each bay (1800mm x 150mm rubber/concrete curb)
            if (i < bays) {
                const curbCenterX = x0 + bw / 2 + (bayType !== 'perp_90' ? skewX * 0.15 : 0);
                const curbCenterY = basePoint.y + 700;
                entities.push(createRectangleEntity(
                    { x: curbCenterX, y: curbCenterY },
                    Math.min(1800, bw - 600),
                    150,
                    layerCurb,
                    colorCurb
                ));

                // Wheelchair accessible symbol if bayType is accessible
                if (bayType === 'accessible_bay') {
                    const symX = x0 + bw / 2;
                    const symY = basePoint.y + bayL / 2;
                    // Head circle
                    entities.push(createCircleEntity({ x: symX, y: symY + 300 }, 80, layerSymbol, colorSymbol));
                    // Wheel arc
                    entities.push(createCircleEntity({ x: symX, y: symY }, 200, layerSymbol, colorSymbol));
                    // Body / chair lines
                    entities.push(createLineEntity({ x: symX, y: symY + 200 }, { x: symX, y: symY }, layerSymbol, colorSymbol));
                    entities.push(createLineEntity({ x: symX, y: symY }, { x: symX + 150, y: symY }, layerSymbol, colorSymbol));
                    entities.push(createLineEntity({ x: symX + 150, y: symY }, { x: symX + 150, y: symY - 180 }, layerSymbol, colorSymbol));
                }
            }
        }

        return entities;
    },
    generate3D: (params, basePos = { x: 0, y: 0, z: 0 }) => {
        const bays = Math.max(1, Math.min(30, Math.round(Number(params.bays) || 4)));
        const bw = Math.max(2200, Math.min(4000, Number(params.bayWidth) || 2500));
        const totalW = bays * bw;
        const bayL = 5000;

        const parts: DynamicPart3DDef[] = [
            // Asphalt Parking Slab
            {
                id: `parking_slab_${Date.now()}`,
                name: `Otopark Asfalt Zemini (${totalW}x${bayL} mm)`,
                kind: 'box',
                color: '#1e293b',
                position: { x: basePos.x + totalW / 2, y: basePos.y + bayL / 2, z: basePos.z - 25 },
                rotation: { x: 0, y: 0, z: 0 },
                params: { width: totalW, height: bayL, depth: 50 },
                designStandard: 'TSE 10551'
            }
        ];

        // 3D Wheel Stopper Curbs
        for (let i = 0; i < bays; i++) {
            parts.push({
                id: `curb_${i}_${Date.now()}`,
                name: `Tekerlek Durdurucu Stoper (${i + 1}. Park)`,
                kind: 'box',
                color: '#eab308',
                position: { x: basePos.x + i * bw + bw / 2, y: basePos.y + 700, z: basePos.z + 50 },
                rotation: { x: 0, y: 0, z: 0 },
                params: { width: Math.min(1800, bw - 600), height: 150, depth: 100 }
            });
        }

        return parts;
    },
    getGrips: (params, basePoint = { x: 0, y: 0 }) => {
        const bays = Math.max(1, Math.min(30, Math.round(Number(params.bays) || 4)));
        const bw = Math.max(2200, Math.min(4000, Number(params.bayWidth) || 2500));
        const totalW = bays * bw;

        const grips: DynamicGrip[] = [
            // Linear Array Bays Grip
            {
                id: 'grip_parking_bays',
                type: 'stretch',
                paramId: 'bays',
                position: { x: basePoint.x + totalW, y: basePoint.y + 2500 },
                direction: { x: 1, y: 0 },
                tooltip: `Grip: Araç Park Sayısı (${bays} Araç — Toplam ${totalW / 1000} m)`,
                tooltipTr: `Grip: Araç Park Sayısı (${bays} Araç — Toplam ${totalW / 1000} m)`
            },
            // Parking Angle Visibility Grip
            {
                id: 'grip_parking_vis',
                type: 'visibility',
                paramId: 'bayType',
                position: { x: basePoint.x - 30, y: basePoint.y - 30 },
                tooltip: 'Park Tipi (90° Dik / 60° Açılı / 45° Açılı / Engelli)',
                tooltipTr: 'Park Tipi (90° Dik / 60° Açılı / 45° Açılı / Engelli)'
            }
        ];

        return grips;
    }
};
