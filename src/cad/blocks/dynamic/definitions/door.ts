/**
 * 🚪 Dynamic Door Block (ISO 2898 / DIN 18101)
 * 
 * AutoCAD-Grade Dynamic Architectural Door
 * - Linear stretch: Width (600-1600mm) & Wall Thickness (100-350mm)
 * - Flip parameters: Hinge (Left/Right) & Swing (Inward/Outward)
 * - Visibility states: Plan 90°, Plan 45°, Plan Closed, Double Door, Front Elevation
 * - Standard lookup sizes (DIN 18101 residential & commercial doors)
 */

import { Point, CadEntity, createLineEntity, createArcEntity, createRectangleEntity } from '../../../kernel/types';
import { DynamicBlockDef, DynamicGrip, DynamicPart3DDef } from '../types';

export const DYN_DOOR: DynamicBlockDef = {
    id: 'dyn_door',
    name: 'Architectural Dynamic Door',
    nameTr: 'Dinamik Mimari Kapı',
    category: 'Architectural',
    subcategory: 'Doors & Openings',
    subcategoryTr: 'Kapılar ve Boşluklar',
    description: 'AutoCAD-grade parametric door with interactive stretch, swing flip, and visibility states.',
    descriptionTr: 'Etkileşimli genişlik esnetme, yön aynalama ve 90°/45°/kapalı açılma durumlu dinamik kapı.',
    icon: '🚪',
    citation: {
        tier: 1,
        standard: 'DIN 18101 / ISO 2898',
        clause: 'Clauses 4.1-4.3 (Doorsets - Dimensions and tolerances)',
        description: 'Standard modular door dimensions, frames, and clear opening clearances.'
    },
    linearParams: [
        {
            id: 'width',
            name: 'width',
            label: 'Door Opening Width',
            labelTr: 'Kapı Boşluğu Genişliği',
            min: 600,
            max: 2000,
            step: 50,
            default: 900,
            unit: 'mm',
            axis: 'x'
        },
        {
            id: 'wallThickness',
            name: 'wallThickness',
            label: 'Wall Thickness',
            labelTr: 'Duvar Kalınlığı',
            min: 100,
            max: 350,
            step: 10,
            default: 150,
            unit: 'mm',
            axis: 'y'
        }
    ],
    flipParams: [
        {
            id: 'flipHinge',
            name: 'flipHinge',
            label: 'Flip Hinge (Left / Right)',
            labelTr: 'Menteşe Yönü (Sol / Sağ)',
            axis: 'horizontal',
            default: false
        },
        {
            id: 'flipSwing',
            name: 'flipSwing',
            label: 'Flip Swing (Inward / Outward)',
            labelTr: 'Açılış Yönü (İçeri / Dışarı)',
            axis: 'vertical',
            default: false
        }
    ],
    visibilityParam: {
        id: 'visState',
        name: 'visState',
        label: 'Representation State',
        labelTr: 'Görünüm Durumu',
        states: [
            { id: 'plan_90', label: 'Plan View — 90° Swing', labelTr: 'Plan Görünüşü — 90° Açık' },
            { id: 'plan_45', label: 'Plan View — 45° Swing', labelTr: 'Plan Görünüşü — 45° Açık' },
            { id: 'plan_closed', label: 'Plan View — Closed', labelTr: 'Plan Görünüşü — Kapalı' },
            { id: 'double_90', label: 'Plan View — Double Door 90°', labelTr: 'Plan — Çift Kanat 90°' },
            { id: 'elevation', label: 'Front Elevation View', labelTr: 'Ön Görünüş (Cephe)' }
        ],
        default: 'plan_90'
    },
    lookupParams: [
        {
            id: 'standardSize',
            name: 'standardSize',
            label: 'Standard DIN Size',
            labelTr: 'Standart DIN Kapı Boyutu',
            options: [
                { id: 'din_700', label: '700 × 2100 mm (Banyo / WC)', standard: 'DIN 18101', values: { width: 700, wallThickness: 120 } },
                { id: 'din_800', label: '800 × 2100 mm (Oda Kapısı)', standard: 'DIN 18101', values: { width: 800, wallThickness: 150 } },
                { id: 'din_900', label: '900 × 2100 mm (Ana Giriş / Ofis)', standard: 'DIN 18101', values: { width: 900, wallThickness: 150 } },
                { id: 'din_1000', label: '1000 × 2100 mm (Geniş Giriş / Yangın)', standard: 'DIN 18101', values: { width: 1000, wallThickness: 200 } },
                { id: 'din_1400_double', label: '1400 × 2100 mm (Çift Kanat)', standard: 'DIN 18101', values: { width: 1400, wallThickness: 200, visState: 'double_90' } }
            ],
            default: 'din_900'
        }
    ],
    defaultValues: {
        width: 900,
        wallThickness: 150,
        flipHinge: false,
        flipSwing: false,
        visState: 'plan_90'
    },
    generate2D: (params, basePoint = { x: 0, y: 0 }) => {
        const width = Number(params.width) || 900;
        const wallT = Number(params.wallThickness) || 150;
        const flipH = Boolean(params.flipHinge);
        const flipS = Boolean(params.flipSwing);
        const state = String(params.visState || 'plan_90');

        const entities: CadEntity[] = [];
        const layer = 'layer-arch';
        const colorFrame = '#3ad0e6'; // Cyan
        const colorLeaf = '#ffffff';  // White
        const colorSwing = '#64748b'; // Muted slate arc

        const frameW = 50;  // Jamb width
        const frameD = wallT;
        const leafT = 40;   // Door leaf thickness

        if (state === 'elevation') {
            const h = 2100;
            // Outer frame
            entities.push(createRectangleEntity(
                { x: basePoint.x + width / 2, y: basePoint.y + h / 2 },
                width + frameW * 2,
                h,
                layer,
                colorFrame
            ));
            // Inner opening (Leaf)
            entities.push(createRectangleEntity(
                { x: basePoint.x + width / 2, y: basePoint.y + (h - frameW) / 2 },
                width,
                h - frameW,
                layer,
                colorLeaf
            ));
            // Handle
            const handleX = flipH ? basePoint.x + width - 60 : basePoint.x + 60;
            entities.push(createRectangleEntity(
                { x: handleX, y: basePoint.y + 1000 },
                100,
                20,
                layer,
                '#f59e0b'
            ));
            return entities;
        }

        // Plan Views: Left Jamb and Right Jamb
        const leftJambCenter = { x: basePoint.x - frameW / 2, y: basePoint.y + frameD / 2 };
        const rightJambCenter = { x: basePoint.x + width + frameW / 2, y: basePoint.y + frameD / 2 };

        entities.push(createRectangleEntity(leftJambCenter, frameW, frameD, layer, colorFrame));
        entities.push(createRectangleEntity(rightJambCenter, frameW, frameD, layer, colorFrame));

        // Wall end lines
        entities.push(createLineEntity(
            { x: basePoint.x - frameW, y: basePoint.y },
            { x: basePoint.x - frameW - 200, y: basePoint.y },
            layer,
            '#94a3b8'
        ));
        entities.push(createLineEntity(
            { x: basePoint.x - frameW, y: basePoint.y + frameD },
            { x: basePoint.x - frameW - 200, y: basePoint.y + frameD },
            layer,
            '#94a3b8'
        ));
        entities.push(createLineEntity(
            { x: basePoint.x + width + frameW, y: basePoint.y },
            { x: basePoint.x + width + frameW + 200, y: basePoint.y },
            layer,
            '#94a3b8'
        ));
        entities.push(createLineEntity(
            { x: basePoint.x + width + frameW, y: basePoint.y + frameD },
            { x: basePoint.x + width + frameW + 200, y: basePoint.y + frameD },
            layer,
            '#94a3b8'
        ));

        const yDir = flipS ? -1 : 1;

        if (state === 'double_90') {
            const halfW = width / 2;
            // Left leaf (swings 90° out)
            entities.push(createRectangleEntity(
                { x: basePoint.x + leafT / 2, y: basePoint.y + yDir * (halfW / 2) },
                leafT,
                halfW,
                layer,
                colorLeaf
            ));
            // Right leaf (swings 90° out)
            entities.push(createRectangleEntity(
                { x: basePoint.x + width - leafT / 2, y: basePoint.y + yDir * (halfW / 2) },
                leafT,
                halfW,
                layer,
                colorLeaf
            ));
            // Swing Arcs
            entities.push(createArcEntity(
                { x: basePoint.x, y: basePoint.y },
                halfW,
                yDir > 0 ? 0 : -Math.PI / 2,
                yDir > 0 ? Math.PI / 2 : 0,
                layer,
                colorSwing
            ));
            entities.push(createArcEntity(
                { x: basePoint.x + width, y: basePoint.y },
                halfW,
                yDir > 0 ? Math.PI / 2 : Math.PI,
                yDir > 0 ? Math.PI : 1.5 * Math.PI,
                layer,
                colorSwing
            ));
            return entities;
        }

        // Single Door
        const hingeX = flipH ? basePoint.x + width : basePoint.x;
        const leafDirection = flipH ? -1 : 1;

        if (state === 'plan_closed') {
            entities.push(createRectangleEntity(
                { x: basePoint.x + width / 2, y: basePoint.y + leafT / 2 },
                width,
                leafT,
                layer,
                colorLeaf
            ));
        } else if (state === 'plan_45') {
            const rad = Math.PI / 4;
            const cos = Math.cos(rad);
            const sin = Math.sin(rad) * yDir;
            const endX = hingeX + leafDirection * width * cos;
            const endY = basePoint.y + width * sin;
            entities.push(createLineEntity(
                { x: hingeX, y: basePoint.y },
                { x: endX, y: endY },
                layer,
                colorLeaf
            ));
            // Swing Arc (45°)
            const startAng = flipH ? Math.PI : 0;
            const endAng = flipH ? (yDir > 0 ? Math.PI - rad : Math.PI + rad) : (yDir > 0 ? rad : -rad);
            entities.push(createArcEntity(
                { x: hingeX, y: basePoint.y },
                width,
                Math.min(startAng, endAng),
                Math.max(startAng, endAng),
                layer,
                colorSwing
            ));
        } else {
            // Default: 90° Swing
            entities.push(createRectangleEntity(
                { x: hingeX + leafDirection * (leafT / 2), y: basePoint.y + yDir * (width / 2) },
                leafT,
                width,
                layer,
                colorLeaf
            ));
            // 90° Swing Arc
            let startA = 0;
            let endA = Math.PI / 2;
            if (!flipH && yDir > 0) { startA = 0; endA = Math.PI / 2; }
            else if (!flipH && yDir < 0) { startA = -Math.PI / 2; endA = 0; }
            else if (flipH && yDir > 0) { startA = Math.PI / 2; endA = Math.PI; }
            else { startA = Math.PI; endA = 1.5 * Math.PI; }

            entities.push(createArcEntity(
                { x: hingeX, y: basePoint.y },
                width,
                startA,
                endA,
                layer,
                colorSwing
            ));
        }

        return entities;
    },
    generate3D: (params, basePos = { x: 0, y: 0, z: 0 }) => {
        const width = Number(params.width) || 900;
        const wallT = Number(params.wallThickness) || 150;
        const h = 2100;
        const frameW = 50;

        const parts: DynamicPart3DDef[] = [
            // Left jamb
            {
                id: `door_jamb_l_${Date.now()}`,
                name: 'Sol Kasa Profili',
                kind: 'box',
                color: '#64748b',
                position: { x: basePos.x - frameW / 2, y: basePos.y + h / 2, z: basePos.z },
                rotation: { x: 0, y: 0, z: 0 },
                params: { width: frameW, height: h, depth: wallT }
            },
            // Right jamb
            {
                id: `door_jamb_r_${Date.now()}`,
                name: 'Sağ Kasa Profili',
                kind: 'box',
                color: '#64748b',
                position: { x: basePos.x + width + frameW / 2, y: basePos.y + h / 2, z: basePos.z },
                rotation: { x: 0, y: 0, z: 0 },
                params: { width: frameW, height: h, depth: wallT }
            },
            // Header
            {
                id: `door_header_${Date.now()}`,
                name: 'Üst Kasa Başlığı',
                kind: 'box',
                color: '#64748b',
                position: { x: basePos.x + width / 2, y: basePos.y + h - frameW / 2, z: basePos.z },
                rotation: { x: 0, y: 0, z: 0 },
                params: { width: width + frameW * 2, height: frameW, depth: wallT }
            },
            // Door Leaf (Kanat)
            {
                id: `door_leaf_${Date.now()}`,
                name: 'Kapı Kanadı (DIN 18101)',
                kind: 'box',
                color: '#e2e8f0',
                position: { x: basePos.x + width / 2, y: basePos.y + (h - frameW) / 2, z: basePos.z },
                rotation: { x: 0, y: 0, z: 0 },
                params: { width: width - 6, height: h - frameW - 6, depth: 40 },
                designStandard: 'DIN 18101'
            }
        ];

        return parts;
    },
    getGrips: (params, basePoint = { x: 0, y: 0 }) => {
        const width = Number(params.width) || 900;
        const wallT = Number(params.wallThickness) || 150;
        const flipH = Boolean(params.flipHinge);
        const flipS = Boolean(params.flipSwing);

        const grips: DynamicGrip[] = [
            // Linear Stretch Width Grip (Cyan triangle at opening edge)
            {
                id: 'grip_stretch_width',
                type: 'stretch',
                paramId: 'width',
                position: { x: basePoint.x + width, y: basePoint.y },
                direction: { x: 1, y: 0 },
                tooltip: `Grip: Genişlik (${width} mm)`,
                tooltipTr: `Grip: Genişlik (${width} mm)`
            },
            // Linear Stretch Wall Thickness
            {
                id: 'grip_stretch_wall',
                type: 'stretch',
                paramId: 'wallThickness',
                position: { x: basePoint.x + width / 2, y: basePoint.y + wallT },
                direction: { x: 0, y: 1 },
                tooltip: `Grip: Duvar Kalınlığı (${wallT} mm)`,
                tooltipTr: `Grip: Duvar Kalınlığı (${wallT} mm)`
            },
            // Flip Hinge Arrow
            {
                id: 'grip_flip_hinge',
                type: 'flip',
                paramId: 'flipHinge',
                position: { x: basePoint.x + (flipH ? width : 0), y: basePoint.y - 30 },
                tooltip: 'Menteşe Yönünü Aynala (Sol / Sağ)',
                tooltipTr: 'Menteşe Yönünü Aynala (Sol / Sağ)'
            },
            // Flip Swing Arrow
            {
                id: 'grip_flip_swing',
                type: 'flip',
                paramId: 'flipSwing',
                position: { x: basePoint.x + width / 2, y: basePoint.y - 30 },
                tooltip: 'Açılış Yönünü Aynala (İçeri / Dışarı)',
                tooltipTr: 'Açılış Yönünü Aynala (İçeri / Dışarı)'
            },
            // Visibility State Menu / Grip
            {
                id: 'grip_visibility',
                type: 'visibility',
                paramId: 'visState',
                position: { x: basePoint.x - 40, y: basePoint.y - 30 },
                tooltip: 'Görünüm Durumu Değiştir (90° / 45° / Kapalı / Cephe)',
                tooltipTr: 'Görünüm Durumu Değiştir (90° / 45° / Kapalı / Cephe)'
            }
        ];

        return grips;
    }
};
