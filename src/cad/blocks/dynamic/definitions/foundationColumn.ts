/**
 * 🧱 Dynamic Reinforced Concrete Isolated Footing & Column (TS 500 / Eurocode 2)
 * 
 * Structural Engineering Dynamic Block:
 * - Deterministic TS 500 / Eurocode 2 (EN 1992-1-1) structural contracts:
 *   - Punching shear perimeter (Zımbalama çevresi)
 *   - Centric vs. Eccentric boundary footing (Kaçık komşu sınır temeli)
 *   - Column dimensions and footing projection (Ampatman)
 * - Visibility: Foundation Plan (Kalıp Planı), Section View (Betonarme Kesit), Eccentric Boundary
 */

import { Point, CadEntity, createLineEntity, createRectangleEntity } from '../../../kernel/types';
import { DynamicBlockDef, DynamicGrip, DynamicPart3DDef } from '../types';

export const DYN_FOUNDATION_COLUMN: DynamicBlockDef = {
    id: 'dyn_foundation_column',
    name: 'Dynamic Isolated Footing & Column (TS 500)',
    nameTr: 'Dinamik Tekil Temel Pabuç ve Kolon (Eurocode 2)',
    category: 'Structural',
    subcategory: 'Foundations & Concrete',
    subcategoryTr: 'Temeller ve Betonarme',
    description: 'AutoCAD-grade parametric reinforced concrete isolated pad footing with column pier and punching shear perimeter.',
    descriptionTr: 'TS 500 ve Eurocode 2 standardında ampatman, zımbalama çevresi ve kaçık temel opsiyonlu tekil pabuç bloğu.',
    icon: '🧱',
    citation: {
        tier: 1,
        standard: 'TS 500 / Eurocode 2 (EN 1992-1-1)',
        clause: 'Section 9.8 (Foundations and column punching shear checks)',
        description: 'Pad footing depth-to-cantilever rigidity ratios, minimum lean concrete pad, and starter bar embedments.'
    },
    linearParams: [
        {
            id: 'footingWidth',
            name: 'footingWidth',
            label: 'Footing Width (Bx)',
            labelTr: 'Pabuç Genişliği (Bx)',
            min: 1000,
            max: 4500,
            step: 100,
            default: 2000,
            unit: 'mm',
            axis: 'x'
        },
        {
            id: 'footingLength',
            name: 'footingLength',
            label: 'Footing Length (By)',
            labelTr: 'Pabuç Boyu (By)',
            min: 1000,
            max: 4500,
            step: 100,
            default: 2000,
            unit: 'mm',
            axis: 'y'
        },
        {
            id: 'columnWidth',
            name: 'columnWidth',
            label: 'Column Width (Cx)',
            labelTr: 'Kolon Genişliği (Cx)',
            min: 250,
            max: 1000,
            step: 50,
            default: 400,
            unit: 'mm',
            axis: 'x'
        },
        {
            id: 'columnLength',
            name: 'columnLength',
            label: 'Column Length (Cy)',
            labelTr: 'Kolon Boyu (Cy)',
            min: 250,
            max: 1000,
            step: 50,
            default: 400,
            unit: 'mm',
            axis: 'y'
        },
        {
            id: 'footingHeight',
            name: 'footingHeight',
            label: 'Footing Thickness (H)',
            labelTr: 'Pabuç Kalınlığı (H)',
            min: 350,
            max: 1200,
            step: 50,
            default: 600,
            unit: 'mm',
            axis: 'y'
        }
    ],
    flipParams: [
        {
            id: 'flipBoundary',
            name: 'flipBoundary',
            label: 'Eccentric Boundary Side (Left / Right)',
            labelTr: 'Kaçıklık / Sınır Yönü',
            axis: 'horizontal',
            default: false
        }
    ],
    visibilityParam: {
        id: 'visState',
        name: 'visState',
        label: 'Foundation Type / View',
        labelTr: 'Temel Tipi ve Görünüm',
        states: [
            { id: 'plan_centric', label: 'Plan: Centric Isolated Footing', labelTr: 'Plan: Merkezi Tekil Pabuç' },
            { id: 'plan_eccentric', label: 'Plan: Eccentric Boundary Footing', labelTr: 'Plan: Kaçık Komşu Sınır Temeli' },
            { id: 'section', label: 'Section View (Rebar & Lean Concrete)', labelTr: 'Kesit: Grobeton ve Donatı' }
        ],
        default: 'plan_centric'
    },
    lookupParams: [
        {
            id: 'standardFootings',
            name: 'standardFootings',
            label: 'Standard Foundation Classes',
            labelTr: 'Standart Pabuç Sınıfları',
            options: [
                { id: 'ftg_1600', label: 'Pabuç: 1.6m × 1.6m (Kolon: 30×30 cm)', standard: 'TS 500', values: { footingWidth: 1600, footingLength: 1600, columnWidth: 300, columnLength: 300, footingHeight: 500, visState: 'plan_centric' } },
                { id: 'ftg_2000', label: 'Pabuç: 2.0m × 2.0m (Kolon: 40×40 cm)', standard: 'TS 500', values: { footingWidth: 2000, footingLength: 2000, columnWidth: 400, columnLength: 400, footingHeight: 600, visState: 'plan_centric' } },
                { id: 'ftg_2600_heavy', label: 'Pabuç: 2.6m × 2.6m (Kolon: 50×50 cm Ağır Yük)', standard: 'TS 500', values: { footingWidth: 2600, footingLength: 2600, columnWidth: 500, columnLength: 500, footingHeight: 700, visState: 'plan_centric' } },
                { id: 'ftg_eccentric', label: 'Kaçık Sınır Pabucu: 2.2m × 1.8m', standard: 'Eurocode 2', values: { footingWidth: 2200, footingLength: 1800, columnWidth: 400, columnLength: 400, footingHeight: 600, visState: 'plan_eccentric' } }
            ]
        }
    ],
    defaultValues: {
        footingWidth: 2000,
        footingLength: 2000,
        columnWidth: 400,
        columnLength: 400,
        footingHeight: 600,
        flipBoundary: false,
        visState: 'plan_centric'
    },
    generate2D: (params: Record<string, any>, basePoint: Point = { x: 0, y: 0 }): CadEntity[] => {
        const entities: CadEntity[] = [];
        const bx = Number(params.footingWidth || 2000);
        const by = Number(params.footingLength || 2000);
        const cx = Number(params.columnWidth || 400);
        const cy = Number(params.columnLength || 400);
        const h = Number(params.footingHeight || 600);
        const flip = Boolean(params.flipBoundary);
        const visState = String(params.visState || 'plan_centric');

        if (visState === 'section') {
            // Section View: 100mm Lean concrete (Grobeton), Pad footing (H), Column pier (1000mm up)
            const leanH = 100;
            const leanOffset = 100;

            // 1. Lean concrete slab (Grobeton)
            entities.push(createRectangleEntity(
                { x: basePoint.x + bx / 2, y: basePoint.y - leanH / 2 },
                bx + leanOffset * 2,
                leanH,
                0,
                '#64748b'
            ));

            // 2. Pad Footing Body
            entities.push(createRectangleEntity(
                { x: basePoint.x + bx / 2, y: basePoint.y + h / 2 },
                bx,
                h,
                0,
                '#38bdf8'
            ));

            // 3. Column Pier stub
            entities.push(createRectangleEntity(
                { x: basePoint.x + bx / 2, y: basePoint.y + h + 500 },
                cx,
                1000,
                0,
                '#00e5ff'
            ));

            // 4. Rebar reinforcement mesh (Bottom mat)
            entities.push(createLineEntity(
                { x: basePoint.x + 50, y: basePoint.y + 50 },
                { x: basePoint.x + bx - 50, y: basePoint.y + 50 },
                '#f59e0b'
            ));

            // Starter dowels (Kolon filizleri)
            entities.push(createLineEntity(
                { x: basePoint.x + bx / 2 - cx / 2 + 40, y: basePoint.y + 60 },
                { x: basePoint.x + bx / 2 - cx / 2 + 40, y: basePoint.y + h + 800 },
                '#ef4444'
            ));
            entities.push(createLineEntity(
                { x: basePoint.x + bx / 2 + cx / 2 - 40, y: basePoint.y + 60 },
                { x: basePoint.x + bx / 2 + cx / 2 - 40, y: basePoint.y + h + 800 },
                '#ef4444'
            ));

            return entities;
        }

        // Plan View
        // 1. Lean Concrete Offset (Grobeton izi - 100mm)
        entities.push(createRectangleEntity(
            { x: basePoint.x + bx / 2, y: basePoint.y + by / 2 },
            bx + 200,
            by + 200,
            0,
            '#334155'
        ));

        // 2. Main Pad Footing Contour (Pabuç Sınırı)
        entities.push(createRectangleEntity(
            { x: basePoint.x + bx / 2, y: basePoint.y + by / 2 },
            bx,
            by,
            0,
            '#00e5ff'
        ));

        // 3. Column Location
        const isEccentric = visState === 'plan_eccentric';
        const colCenterX = isEccentric
            ? (flip ? (basePoint.x + bx - cx / 2) : (basePoint.x + cx / 2))
            : (basePoint.x + bx / 2);
        const colCenterY = basePoint.y + by / 2;

        entities.push(createRectangleEntity(
            { x: colCenterX, y: colCenterY },
            cx,
            cy,
            0,
            '#38bdf8'
        ));

        // Column cross hatch
        entities.push(createLineEntity(
            { x: colCenterX - cx / 2, y: colCenterY - cy / 2 },
            { x: colCenterX + cx / 2, y: colCenterY + cy / 2 },
            '#38bdf8'
        ));
        entities.push(createLineEntity(
            { x: colCenterX - cx / 2, y: colCenterY + cy / 2 },
            { x: colCenterX + cx / 2, y: colCenterY - cy / 2 },
            '#38bdf8'
        ));

        // 4. Punching Shear Perimeter (Zımbalama Konturu: d/2 = h/4 offset)
        const punchOffset = h * 0.5;
        entities.push(createRectangleEntity(
            { x: colCenterX, y: colCenterY },
            cx + punchOffset * 2,
            cy + punchOffset * 2,
            0,
            '#ec4899'
        ));

        // 5. Grid Axis Centerlines (Aks Çizgileri)
        entities.push(createLineEntity(
            { x: colCenterX, y: basePoint.y - 150 },
            { x: colCenterX, y: basePoint.y + by + 150 },
            '#ef4444'
        ));
        entities.push(createLineEntity(
            { x: basePoint.x - 150, y: colCenterY },
            { x: basePoint.x + bx + 150, y: colCenterY },
            '#ef4444'
        ));

        return entities;
    },
    getGrips: (params: Record<string, any>, basePoint: Point): DynamicGrip[] => {
        const bx = Number(params.footingWidth || 2000);
        const by = Number(params.footingLength || 2000);

        return [
            {
                id: 'grip_origin',
                type: 'point',
                position: basePoint,
                paramId: 'origin',
                label: 'Temel Köşe Noktası'
            },
            {
                id: 'grip_bx',
                type: 'linear',
                position: { x: basePoint.x + bx, y: basePoint.y + by / 2 },
                direction: { x: 1, y: 0 },
                paramId: 'footingWidth',
                label: 'Pabuç Genişliğini (Bx) Esnet'
            },
            {
                id: 'grip_by',
                type: 'linear',
                position: { x: basePoint.x + bx / 2, y: basePoint.y + by },
                direction: { x: 0, y: 1 },
                paramId: 'footingLength',
                label: 'Pabuç Boyunu (By) Esnet'
            },
            {
                id: 'grip_flip',
                type: 'flip',
                position: { x: basePoint.x - 40, y: basePoint.y + by / 2 },
                paramId: 'flipBoundary',
                label: 'Sınır / Kaçıklık Yönünü Değiştir'
            },
            {
                id: 'grip_vis',
                type: 'visibility',
                position: { x: basePoint.x + bx / 2, y: basePoint.y - 40 },
                paramId: 'visState',
                label: 'Merkezi / Kaçık / Kesit'
            }
        ];
    },
    generate3D: (params: Record<string, any>, basePos = { x: 0, y: 0, z: 0 }): DynamicPart3DDef[] => {
        const bx = Number(params.footingWidth || 2000) / 1000;
        const by = Number(params.footingLength || 2000) / 1000;
        const cx = Number(params.columnWidth || 400) / 1000;
        const cy = Number(params.columnLength || 400) / 1000;
        const h = Number(params.footingHeight || 600) / 1000;

        return [
            // Lean Concrete (Grobeton)
            {
                name: 'Foundation_Lean_Concrete',
                shape: 'box',
                dimensions: { width: bx + 0.2, height: 0.1, depth: by + 0.2 },
                position: { x: basePos.x + bx / 2, y: basePos.y - 0.05, z: basePos.z },
                color: '#475569',
                materialType: 'concrete_c25'
            },
            // Pad Footing
            {
                name: 'Foundation_Pad_Footing',
                shape: 'box',
                dimensions: { width: bx, height: h, depth: by },
                position: { x: basePos.x + bx / 2, y: basePos.y + h / 2, z: basePos.z },
                color: '#94a3b8',
                materialType: 'concrete_c25'
            },
            // Column Pier Stub
            {
                name: 'Foundation_Column_Pier',
                shape: 'box',
                dimensions: { width: cx, height: 1.2, depth: cy },
                position: { x: basePos.x + bx / 2, y: basePos.y + h + 0.6, z: basePos.z },
                color: '#0284c7',
                materialType: 'concrete_c25'
            }
        ];
    }
};
