/**
 * 🛤️ Dynamic Profiled Linear Guideway Rail & Carriage Block (ISO 12090-1 / HIWIN HGR Series)
 *
 * - Lookup Catalog: HGR15, HGR20, HGR25, HGR30, HGR35, HGR45 Heavy-Load Ball Guideways
 * - Linear Params: Rail Length (120–4000 mm), Carriage Position X
 * - Visibility States:
 *    - End Cross-Section (Alın Kesit — Ray Profili, Bilya Kanalları, Araba Gövdesi, ISO 128 Tarama)
 *    - Top Plan View (Üst Görünüş — Ray Montaj Delik Dizisi & Araba Flanş Delikleri)
 *    - Side Elevation View (Yan Görünüş — Ray Boyu ve Araba Konumu)
 * - 3D Solids: Ground steel profile rail + anodized red/green carriage slider block
 */

import {
    CadEntity,
    createLineEntity,
    createRectangleEntity,
    createCircleEntity,
    createHatchEntity
} from '../../../kernel/types';
import { DynamicBlockDef, DynamicGrip, DynamicPart3DDef } from '../types';

export interface LinearGuideCatalogSpec {
    code: string;
    model: string;
    H: number;       // Total assembly height (mm)
    W: number;       // Carriage block width (mm)
    L: number;       // Carriage total length (mm)
    wr: number;      // Rail width (mm)
    hr: number;      // Rail height (mm)
    pitchE: number;  // Rail bolt hole pitch F (mm)
    boltHoleD: number; // Rail counterbore d2 (mm)
    blockPitchB: number; // Carriage bolt transversal pitch B (mm)
    blockPitchC: number; // Carriage bolt longitudinal pitch C (mm)
    dynC_kN: number; // Dynamic load rating C (kN)
}

export const HIWIN_HGR_CATALOG: Record<string, LinearGuideCatalogSpec> = {
    HGR15: {
        code: 'HGR15',
        model: 'HIWIN HGW15CC / HGR15R',
        H: 24,
        W: 47,
        L: 61.4,
        wr: 15,
        hr: 15,
        pitchE: 60,
        boltHoleD: 4.5,
        blockPitchB: 38,
        blockPitchC: 30,
        dynC_kN: 11.38
    },
    HGR20: {
        code: 'HGR20',
        model: 'HIWIN HGW20CC / HGR20R',
        H: 30,
        W: 63,
        L: 77.5,
        wr: 20,
        hr: 17.5,
        pitchE: 60,
        boltHoleD: 6.0,
        blockPitchB: 53,
        blockPitchC: 40,
        dynC_kN: 17.75
    },
    HGR25: {
        code: 'HGR25',
        model: 'HIWIN HGW25CC / HGR25R',
        H: 36,
        W: 70,
        L: 84.0,
        wr: 23,
        hr: 22,
        pitchE: 60,
        boltHoleD: 7.0,
        blockPitchB: 57,
        blockPitchC: 45,
        dynC_kN: 26.48
    },
    HGR30: {
        code: 'HGR30',
        model: 'HIWIN HGW30CC / HGR30R',
        H: 42,
        W: 90,
        L: 97.4,
        wr: 28,
        hr: 26,
        pitchE: 80,
        boltHoleD: 9.0,
        blockPitchB: 72,
        blockPitchC: 52,
        dynC_kN: 38.74
    },
    HGR35: {
        code: 'HGR35',
        model: 'HIWIN HGW35CC / HGR35R',
        H: 48,
        W: 100,
        L: 112.4,
        wr: 34,
        hr: 29,
        pitchE: 80,
        boltHoleD: 9.0,
        blockPitchB: 82,
        blockPitchC: 62,
        dynC_kN: 49.52
    },
    HGR45: {
        code: 'HGR45',
        model: 'HIWIN HGW45CC / HGR45R',
        H: 60,
        W: 120,
        L: 139.4,
        wr: 45,
        hr: 38,
        pitchE: 105,
        boltHoleD: 14.0,
        blockPitchB: 100,
        blockPitchC: 80,
        dynC_kN: 77.57
    }
};

export const DYN_LINEAR_GUIDE: DynamicBlockDef = {
    id: 'dyn_linear_guide',
    name: 'Profiled Linear Guideway & Carriage (ISO 12090 / HIWIN HGR)',
    nameTr: 'Dinamik Kremayer / Lineer Kızak ve Araba (HIWIN HGR / ISO 12090)',
    category: 'Mechanical',
    subcategory: 'Linear Motion & CNC',
    subcategoryTr: 'Lineer Hareket ve CNC Sistemleri',
    description: 'ISO 12090-1 / HIWIN HGR series profiled linear rail and flanged ball carriage with parametric rail length, automatic bolt hole array, and end cross-section.',
    descriptionTr: 'ISO 12090-1 ve HIWIN HGR15-HGR45 serisi bilyalı lineer kızak ve flanşlı araba; esnetilebilir ray boyu, otomatik delik dizisi ve alın kesiti.',
    icon: '🛤️',
    calculatorRoute: '/bearings/',
    calculatorModuleType: 'bearings',
    calculatorLabelTr: 'Lineer Yataklama ve Ömür Hesabına Git (ISO 14728)',
    citation: {
        tier: 1,
        standard: 'ISO 12090-1:2011 / ISO 14728-1 / HIWIN HGR Technical Manual',
        clause: 'Series 1 & 2 Boundary Dimensions for Profiled Rail Rolling Guides',
        description: 'Standard envelope dimensions H, W, L, rail pitch F, and dynamic load capacities C for four-row ball linear guides.'
    },
    linearParams: [
        {
            id: 'railLength',
            name: 'railLength',
            label: 'Rail Total Length (L_rail)',
            labelTr: 'Lineer Ray Boyu (L_ray)',
            min: 150,
            max: 4000,
            step: 60,
            default: 600,
            unit: 'mm',
            axis: 'x'
        },
        {
            id: 'carriageOffset',
            name: 'carriageOffset',
            label: 'Carriage Position along Rail',
            labelTr: 'Araba Ray Üzeri Konumu (X)',
            min: 60,
            max: 3800,
            step: 20,
            default: 220,
            unit: 'mm',
            axis: 'x'
        }
    ],
    flipParams: [],
    visibilityParam: {
        id: 'viewMode',
        name: 'viewMode',
        label: 'Projection View Mode',
        labelTr: 'Görünüş / Kesit Tipi',
        states: [
            { id: 'top_plan', label: 'Top Plan View (Üst Montaj & Delik Dizisi)', labelTr: 'Üst Görünüş (Montaj Delik Dizisi)' },
            { id: 'end_section', label: 'End Cross-Section (Alın Kesit — Ray & Araba)', labelTr: 'Alın Kesit (Ray & Bilya Kanalları)' },
            { id: 'side_elevation', label: 'Side Elevation View (Yan Görünüş)', labelTr: 'Yan Görünüş (Ray ve Araba Yüksekliği)' }
        ],
        default: 'top_plan'
    },
    lookupParams: [
        {
            id: 'guideSize',
            name: 'guideSize',
            label: 'HIWIN / ISO Guideway Size',
            labelTr: 'Lineer Kızak & Araba Serisi',
            options: Object.values(HIWIN_HGR_CATALOG).map((g) => ({
                id: g.code,
                label: `${g.model} (H=${g.H}mm, W=${g.W}mm, Ray=${g.wr}mm — C=${g.dynC_kN} kN)`,
                standard: 'ISO 12090-1',
                values: { guideSize: g.code }
            })),
            default: 'HGR25'
        }
    ],
    defaultValues: {
        guideSize: 'HGR25',
        railLength: 600,
        carriageOffset: 220,
        viewMode: 'top_plan'
    },
    generate2D: (params, basePoint = { x: 0, y: 0 }) => {
        const sizeKey = String(params.guideSize || 'HGR25');
        const spec = HIWIN_HGR_CATALOG[sizeKey] || HIWIN_HGR_CATALOG.HGR25;
        const railLength = Math.max(150, Number(params.railLength) || 600);
        const carriageOffset = Math.min(railLength - spec.L / 2 - 10, Math.max(spec.L / 2 + 10, Number(params.carriageOffset) || 220));
        const viewMode = String(params.viewMode || 'top_plan');

        const { H, W, L, wr, hr, pitchE, boltHoleD, blockPitchB, blockPitchC } = spec;
        const entities: CadEntity[] = [];
        const layerRail = 'layer-mech';
        const layerBlock = 'layer-accent';
        const layerRef = 'layer-ref';

        if (viewMode === 'end_section') {
            // Alın Kesit (End Cross-Section of Rail + Flanged Carriage Block)
            const cx = basePoint.x + W / 2;
            const cy = basePoint.y;

            // Vertical centerline
            entities.push(
                createLineEntity({ x: cx, y: cy - 8 }, { x: cx, y: cy + H + 8 }, layerRef, '#ef4444')
            );

            // Profiled Rail Cross-Section
            entities.push(
                createRectangleEntity({ x: cx, y: cy + hr / 2 }, wr, hr, layerRail, '#94a3b8'),
                createHatchEntity([
                    { x: cx - wr / 2, y: cy },
                    { x: cx + wr / 2, y: cy },
                    { x: cx + wr / 2, y: cy + hr },
                    { x: cx - wr / 2, y: cy + hr }
                ], 'ANSI31', layerRail, '#64748b')
            );

            // Carriage Block Upper Envelope (straddling the rail)
            const clearance = Math.max(3, hr * 0.22);
            const blockH = H - clearance;
            entities.push(
                createRectangleEntity({ x: cx, y: cy + clearance + blockH / 2 }, W, blockH, layerBlock, '#22c55e')
            );
            // Left & Right Carriage Flanges Hatch
            const wingW = (W - wr - 2) / 2;
            entities.push(
                createHatchEntity([
                    { x: cx - W / 2, y: cy + clearance },
                    { x: cx - wr / 2 - 1, y: cy + clearance },
                    { x: cx - wr / 2 - 1, y: cy + H },
                    { x: cx - W / 2, y: cy + H }
                ], 'CROSS', layerBlock, '#16a34a'),
                createHatchEntity([
                    { x: cx + wr / 2 + 1, y: cy + clearance },
                    { x: cx + W / 2, y: cy + clearance },
                    { x: cx + W / 2, y: cy + H },
                    { x: cx + wr / 2 + 1, y: cy + H }
                ], 'CROSS', layerBlock, '#16a34a')
            );

            // 4 Recirculating Ball Rows (Upper/Lower Left & Right)
            const ballR = Math.max(1.5, wr * 0.08);
            entities.push(
                createCircleEntity({ x: cx - wr / 2, y: cy + hr * 0.55 }, ballR, layerBlock, '#f8fafc'),
                createCircleEntity({ x: cx - wr / 2, y: cy + hr * 0.8 }, ballR, layerBlock, '#f8fafc'),
                createCircleEntity({ x: cx + wr / 2, y: cy + hr * 0.55 }, ballR, layerBlock, '#f8fafc'),
                createCircleEntity({ x: cx + wr / 2, y: cy + hr * 0.8 }, ballR, layerBlock, '#f8fafc')
            );
            return entities;
        }

        if (viewMode === 'side_elevation') {
            // Side View: Rail base + Carriage riding on top
            entities.push(
                createRectangleEntity(
                    { x: basePoint.x + railLength / 2, y: basePoint.y + hr / 2 },
                    railLength,
                    hr,
                    layerRail,
                    '#94a3b8'
                ),
                createRectangleEntity(
                    { x: basePoint.x + carriageOffset, y: basePoint.y + H / 2 + 2 },
                    L,
                    H - 4,
                    layerBlock,
                    '#22c55e'
                )
            );
            // End seals (red caps) on carriage
            const sealW = 5;
            entities.push(
                createRectangleEntity(
                    { x: basePoint.x + carriageOffset - L / 2 + sealW / 2, y: basePoint.y + H / 2 + 2 },
                    sealW,
                    H - 4,
                    layerBlock,
                    '#ef4444'
                ),
                createRectangleEntity(
                    { x: basePoint.x + carriageOffset + L / 2 - sealW / 2, y: basePoint.y + H / 2 + 2 },
                    sealW,
                    H - 4,
                    layerBlock,
                    '#ef4444'
                )
            );
            return entities;
        }

        // TOP PLAN VIEW (Default)
        // Centerline
        entities.push(
            createLineEntity(
                { x: basePoint.x - 20, y: basePoint.y },
                { x: basePoint.x + railLength + 20, y: basePoint.y },
                layerRef,
                '#ef4444'
            )
        );

        // Rail Body
        entities.push(
            createRectangleEntity(
                { x: basePoint.x + railLength / 2, y: basePoint.y },
                railLength,
                wr,
                layerRail,
                '#94a3b8'
            )
        );

        // Rail Counterbored Mounting Holes along Pitch E
        const numHoles = Math.max(2, Math.floor((railLength - 20) / pitchE) + 1);
        const endMargin = (railLength - (numHoles - 1) * pitchE) / 2;
        for (let i = 0; i < numHoles; i++) {
            const hx = basePoint.x + endMargin + i * pitchE;
            entities.push(
                createCircleEntity({ x: hx, y: basePoint.y }, boltHoleD / 2, layerRail, '#38bdf8'),
                createCircleEntity({ x: hx, y: basePoint.y }, boltHoleD * 0.85, layerRef, '#64748b')
            );
        }

        // Carriage Block Body (Straddling the rail at carriageOffset)
        const blockCx = basePoint.x + carriageOffset;
        entities.push(
            createRectangleEntity(
                { x: blockCx, y: basePoint.y },
                L,
                W,
                layerBlock,
                '#22c55e'
            ),
            // Red end wiper seals
            createRectangleEntity(
                { x: blockCx - L / 2 + 4, y: basePoint.y },
                8,
                W * 0.92,
                layerBlock,
                '#ef4444'
            ),
            createRectangleEntity(
                { x: blockCx + L / 2 - 4, y: basePoint.y },
                8,
                W * 0.92,
                layerBlock,
                '#ef4444'
            )
        );

        // 4 Tapped/Flange Mounting Holes on Carriage Block (B x C pattern)
        const halfB = blockPitchB / 2;
        const halfC = blockPitchC / 2;
        const mountBoltR = boltHoleD * 0.55;
        for (const dx of [-halfC, halfC]) {
            for (const dy of [-halfB, halfB]) {
                entities.push(
                    createCircleEntity({ x: blockCx + dx, y: basePoint.y + dy }, mountBoltR, layerBlock, '#f59e0b')
                );
            }
        }

        return entities;
    },
    generate3D: (params, basePos = { x: 0, y: 0, z: 0 }) => {
        const sizeKey = String(params.guideSize || 'HGR25');
        const spec = HIWIN_HGR_CATALOG[sizeKey] || HIWIN_HGR_CATALOG.HGR25;
        const railLength = Math.max(150, Number(params.railLength) || 600);
        const carriageOffset = Math.min(railLength - spec.L / 2 - 10, Math.max(spec.L / 2 + 10, Number(params.carriageOffset) || 220));
        const { H, W, L, wr, hr } = spec;

        const parts: DynamicPart3DDef[] = [
            // Ground Steel Linear Rail
            {
                id: `hgr_rail_${Date.now()}`,
                name: `${spec.model} Taşlanmış Lineer Kızak Rayı (L=${railLength}mm)`,
                kind: 'box',
                color: '#94a3b8',
                position: { x: basePos.x + railLength / 2, y: basePos.y + hr / 2, z: basePos.z },
                rotation: { x: 0, y: 0, z: 0 },
                params: { width: railLength, height: hr, depth: wr },
                designStandard: 'ISO 12090-1'
            },
            // Flanged Ball Carriage Block
            {
                id: `hgr_carriage_${Date.now()}`,
                name: `${spec.model} Flanşlı Lineer Rulman Arabası`,
                kind: 'box',
                color: '#16a34a',
                position: { x: basePos.x + carriageOffset, y: basePos.y + H * 0.6, z: basePos.z },
                rotation: { x: 0, y: 0, z: 0 },
                params: { width: L - 10, height: H - hr * 0.25, depth: W },
                designStandard: 'ISO 12090-1'
            },
            // Red Wiper End Caps
            {
                id: `hgr_seal_l_${Date.now()}`,
                name: `${spec.code} Sol Toz Keçesi`,
                kind: 'box',
                color: '#dc2626',
                position: { x: basePos.x + carriageOffset - L / 2 + 2.5, y: basePos.y + H * 0.6, z: basePos.z },
                rotation: { x: 0, y: 0, z: 0 },
                params: { width: 5, height: H - hr * 0.28, depth: W * 0.96 },
                designStandard: 'ISO 12090-1'
            },
            {
                id: `hgr_seal_r_${Date.now()}`,
                name: `${spec.code} Sağ Toz Keçesi`,
                kind: 'box',
                color: '#dc2626',
                position: { x: basePos.x + carriageOffset + L / 2 - 2.5, y: basePos.y + H * 0.6, z: basePos.z },
                rotation: { x: 0, y: 0, z: 0 },
                params: { width: 5, height: H - hr * 0.28, depth: W * 0.96 },
                designStandard: 'ISO 12090-1'
            }
        ];

        return parts;
    },
    getGrips: (params, basePoint = { x: 0, y: 0 }) => {
        const sizeKey = String(params.guideSize || 'HGR25');
        const spec = HIWIN_HGR_CATALOG[sizeKey] || HIWIN_HGR_CATALOG.HGR25;
        const railLength = Math.max(150, Number(params.railLength) || 600);
        const carriageOffset = Math.min(railLength - spec.L / 2 - 10, Math.max(spec.L / 2 + 10, Number(params.carriageOffset) || 220));

        return [
            {
                id: 'grip_rail_len',
                type: 'stretch',
                paramId: 'railLength',
                position: { x: basePoint.x + railLength, y: basePoint.y },
                direction: { x: 1, y: 0 },
                tooltip: `Ray Boyunu Esnet (${railLength} mm)`,
                tooltipTr: `Ray Boyunu Esnet (${railLength} mm)`
            },
            {
                id: 'grip_carriage_pos',
                type: 'stretch',
                paramId: 'carriageOffset',
                position: { x: basePoint.x + carriageOffset, y: basePoint.y },
                direction: { x: 1, y: 0 },
                tooltip: `Arabayı Ray Üzerinde Kaydır (${carriageOffset} mm)`,
                tooltipTr: `Arabayı Ray Üzerinde Kaydır (${carriageOffset} mm)`
            },
            {
                id: 'grip_guide_vis',
                type: 'visibility',
                paramId: 'viewMode',
                position: { x: basePoint.x - 15, y: basePoint.y - spec.W * 0.7 },
                tooltip: 'Görünüş Değiştir (Üst Plan / Alın Kesit / Yan Görünüş)',
                tooltipTr: 'Görünüş Değiştir (Üst Plan / Alın Kesit / Yan Görünüş)'
            }
        ];
    }
};
