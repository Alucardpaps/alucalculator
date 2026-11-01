/**
 * 🧱 Dynamic Cable Drag Chain / Energy Chain (igus E2 / E4 Series)
 *
 * - Lookup Catalog: E2_15, E2_25, E4_35, E4_45, E4_56 Polymer Energy Chains
 * - Linear Params: Travel Stroke Length (300–2500 mm), Moving Carriage Position (0–100%)
 * - Visibility States:
 *    - Side Loop Elevation (Yan U-Dönüş Görünüşü — Bakla Dizisi, Bükülme Yarıçapı R ve Sabit/Hareketli Ayaklar)
 *    - Link Cross-Section (Enine Kesit — Açılır Köprü, Ayırıcı Bölmeler, Güç/Sinyal Kabloları ve ISO 128 HATCH)
 *    - Top Plan View (Üst Görünüş — Zincir İç/Dış Genişliği Bi/Ba)
 * - 3D Solids: Lower stationary run + 180° bend loop + upper moving run
 */

import {
    CadEntity,
    createLineEntity,
    createRectangleEntity,
    createCircleEntity,
    createArcEntity,
    createHatchEntity
} from '../../../kernel/types';
import { DynamicBlockDef, DynamicGrip, DynamicPart3DDef } from '../types';

export interface CableDragChainSpec {
    code: string;
    hi: number;        // Inner cavity height (mm)
    ha: number;        // Outer link height (mm)
    Bi: number;        // Inner cavity width (mm)
    Ba: number;        // Outer link width (mm)
    pitch: number;     // Link pitch (mm)
    bendR: number;     // Standard bending radius R (mm)
    maxCableD: number; // Max single cable diameter (mm)
}

export const DRAG_CHAIN_CATALOG: Record<string, CableDragChainSpec> = {
    E2_15: { code: 'E2_15', hi: 15, ha: 23, Bi: 30,  Ba: 42,  pitch: 30.5, bendR: 55,  maxCableD: 12 },
    E2_25: { code: 'E2_25', hi: 25, ha: 35, Bi: 50,  Ba: 66,  pitch: 46.0, bendR: 75,  maxCableD: 21 },
    E4_35: { code: 'E4_35', hi: 35, ha: 50, Bi: 75,  Ba: 96,  pitch: 56.0, bendR: 100, maxCableD: 30 },
    E4_45: { code: 'E4_45', hi: 45, ha: 64, Bi: 100, Ba: 124, pitch: 67.0, bendR: 125, maxCableD: 39 },
    E4_56: { code: 'E4_56', hi: 56, ha: 80, Bi: 125, Ba: 155, pitch: 91.0, bendR: 150, maxCableD: 50 }
};

export const DYN_CABLE_DRAG_CHAIN: DynamicBlockDef = {
    id: 'dyn_cable_drag_chain',
    name: 'Cable Drag Chain / Energy Chain (igus E2/E4 Series)',
    nameTr: 'Dinamik Hareketli Kablo Taşıyıcı Zincir (igus E2 / E4 Serisi)',
    category: 'Mechanical',
    subcategory: 'Robotics & Automation',
    subcategoryTr: 'Robotik ve Otomasyon Elemanları',
    description: 'Articulated polymer cable drag chain / energy chain (igus E2/E4 series) with configurable travel stroke, carriage position, bending radius R, and cable cross-section view with ISO 128 hatches.',
    descriptionTr: 'CNC ve otomasyon eksenleri için hareketli kablo taşıyıcı enerji zinciri (igus E2/E4); sürüklenebilir kurs boyu, yan U-dönüş görünüşü ve kablo dizilimli enine kesit (HATCH).',
    icon: '⛓️',
    calculatorRoute: '/power-screw/',
    calculatorModuleType: 'power-screw',
    calculatorLabelTr: 'Lineer Eksen ve Hareket Hesabına Git',
    citation: {
        tier: 2,
        standard: 'igus E2/E4 Energy Chain Engineering Specification / VDI 2860',
        clause: 'Self-supporting energy supply systems — Bend radius R, link pitch T, and loop height H_F',
        description: 'Loop height H_F = 2R + ha, link pitch segmentation, and internal cable fill factor.'
    },
    linearParams: [
        {
            id: 'strokeLength',
            name: 'strokeLength',
            label: 'Chain Run Length (Ls)',
            labelTr: 'Kablo Zinciri Hat Boyu (Ls)',
            min: 250,
            max: 2400,
            step: 50,
            default: 600,
            unit: 'mm',
            axis: 'x'
        },
        {
            id: 'travelPct',
            name: 'travelPct',
            label: 'Upper Carriage Travel (%)',
            labelTr: 'Üst Hareketli Uç Konumu (%)',
            min: 10,
            max: 100,
            step: 10,
            default: 70,
            unit: '%',
            axis: 'x'
        }
    ],
    flipParams: [],
    visibilityParam: {
        id: 'viewMode',
        name: 'viewMode',
        label: 'View / Section Mode',
        labelTr: 'Görünüş / Kesit Modu',
        states: [
            { id: 'side_loop', label: 'Side U-Loop Elevation (Yan Görünüş — U-Dönüş & Baklalar)', labelTr: 'Yan Görünüş (U-Dönüş Yarıçapı R & Bakla Dizisi)' },
            { id: 'cross_section', label: 'Link & Cable Cross-Section (Enine Kesit — Kablolar & HATCH)', labelTr: 'Enine Kesit (Bakla Köprüsü, Bölmeler & Kablolar — HATCH)' },
            { id: 'top_plan', label: 'Top Plan View (Üst Görünüş — İç/Dış Genişlik Bi/Ba)', labelTr: 'Üst Görünüş (Zincir Genişliği & Köprüler)' }
        ],
        default: 'side_loop'
    },
    lookupParams: [
        {
            id: 'chainModel',
            name: 'chainModel',
            label: 'Energy Chain Series (igus E2/E4)',
            labelTr: 'Kablo Zinciri Serisi (igus E2/E4)',
            options: Object.values(DRAG_CHAIN_CATALOG).map((c) => ({
                id: c.code,
                label: `${c.code} (İç ${c.Bi}×${c.hi}mm, Dış ${c.Ba}×${c.ha}mm, Bükülme R=${c.bendR}mm)`,
                standard: 'igus E2/E4',
                values: { chainModel: c.code }
            })),
            default: 'E4_35'
        }
    ],
    defaultValues: {
        chainModel: 'E4_35',
        strokeLength: 600,
        travelPct: 70,
        viewMode: 'side_loop'
    },
    generate2D: (params, basePoint = { x: 0, y: 0 }) => {
        const modelKey = String(params.chainModel || 'E4_35');
        const spec = DRAG_CHAIN_CATALOG[modelKey] || DRAG_CHAIN_CATALOG.E4_35;
        const Ls = Math.max(250, Math.min(2400, Number(params.strokeLength) || 600));
        const travelPct = Math.max(10, Math.min(100, Number(params.travelPct) ?? 70));
        const viewMode = String(params.viewMode || 'side_loop');

        const { hi, ha, Bi, Ba, pitch, bendR } = spec;
        const entities: CadEntity[] = [];
        const layerChain = 'layer-mech';
        const layerCable = 'layer-accent';
        const layerRef = 'layer-ref';

        const cx = basePoint.x;
        const cy = basePoint.y;

        if (viewMode === 'cross_section') {
            // Link Cross-Section View (Ba x ha) with ISO 128 hatches & internal cables
            const sideT = (Ba - Bi) / 2;
            const crossbarT = (ha - hi) / 2;
            entities.push(
                createRectangleEntity({ x: cx, y: cy + ha / 2 }, Ba, ha, layerChain, '#38bdf8'),
                createRectangleEntity({ x: cx, y: cy + ha / 2 }, Bi, hi, layerChain, '#0284c7'),
                // Left & Right side link hatches
                createHatchEntity([
                    { x: cx - Ba / 2, y: cy },
                    { x: cx - Bi / 2, y: cy },
                    { x: cx - Bi / 2, y: cy + ha },
                    { x: cx - Ba / 2, y: cy + ha }
                ], 'ANSI31', layerChain, '#0284c7'),
                createHatchEntity([
                    { x: cx + Bi / 2, y: cy },
                    { x: cx + Ba / 2, y: cy },
                    { x: cx + Ba / 2, y: cy + ha },
                    { x: cx + Bi / 2, y: cy + ha }
                ], 'ANSI31', layerChain, '#0284c7'),
                // Top & Bottom snap-open crossbars
                createRectangleEntity({ x: cx, y: cy + crossbarT / 2 }, Bi, crossbarT, layerCable, '#f59e0b'),
                createRectangleEntity({ x: cx, y: cy + ha - crossbarT / 2 }, Bi, crossbarT, layerCable, '#f59e0b'),
                // Vertical separator rib
                createRectangleEntity({ x: cx, y: cy + ha / 2 }, Math.max(2, sideT * 0.35), hi, layerCable, '#94a3b8'),
                // Internal Power, Servo & Pneumatic Cables
                createCircleEntity({ x: cx - Bi * 0.26, y: cy + ha / 2 }, hi * 0.34, layerCable, '#eab308'),
                createCircleEntity({ x: cx - Bi * 0.26, y: cy + ha / 2 }, hi * 0.20, layerRef, '#d97706'),
                createCircleEntity({ x: cx + Bi * 0.18, y: cy + ha * 0.38 }, hi * 0.22, layerCable, '#22c55e'),
                createCircleEntity({ x: cx + Bi * 0.32, y: cy + ha * 0.62 }, hi * 0.18, layerCable, '#ef4444')
            );
            return entities;
        }

        if (viewMode === 'top_plan') {
            // Top Plan View
            entities.push(
                createRectangleEntity({ x: cx + Ls / 2, y: cy }, Ls, Ba, layerChain, '#38bdf8'),
                createRectangleEntity({ x: cx + Ls / 2, y: cy }, Ls, Bi, layerChain, '#64748b')
            );
            const count = Math.floor(Ls / pitch);
            for (let i = 1; i < count; i++) {
                const lx = cx + i * pitch;
                entities.push(
                    createLineEntity({ x: lx, y: cy - Ba / 2 }, { x: lx, y: cy + Ba / 2 }, layerCable, '#f59e0b')
                );
            }
            return entities;
        }

        // Side U-Loop Elevation View
        const upperEndX = cx + Ls * (travelPct / 100);
        const loopCenterX = cx + Ls;
        const loopCenterY = cy + ha / 2 + bendR;
        const upperRunY = cy + bendR * 2 + ha / 2;

        // Lower stationary run
        entities.push(
            createRectangleEntity({ x: (cx + loopCenterX) / 2, y: cy + ha / 2 }, Ls, ha, layerChain, '#38bdf8')
        );

        // Upper moving run
        const upperLen = Math.max(pitch * 2, loopCenterX - upperEndX);
        entities.push(
            createRectangleEntity(
                { x: loopCenterX - upperLen / 2, y: upperRunY },
                upperLen,
                ha,
                layerChain,
                '#38bdf8'
            )
        );

        // 180° Bend Loop (Outer, Pitch Centerline, and Inner Arcs)
        entities.push(
            createArcEntity({ x: loopCenterX, y: loopCenterY }, bendR + ha / 2, -Math.PI / 2, Math.PI / 2, layerChain, '#38bdf8'),
            createArcEntity({ x: loopCenterX, y: loopCenterY }, bendR, -Math.PI / 2, Math.PI / 2, layerRef, '#ef4444'),
            createArcEntity({ x: loopCenterX, y: loopCenterY }, Math.max(10, bendR - ha / 2), -Math.PI / 2, Math.PI / 2, layerChain, '#38bdf8')
        );

        // Link Pitch Dividers & Pivot Pins along lower and upper runs
        const lowerLinks = Math.floor(Ls / pitch);
        for (let i = 1; i < lowerLinks; i++) {
            const lx = cx + i * pitch;
            entities.push(
                createLineEntity({ x: lx, y: cy }, { x: lx, y: cy + ha }, layerChain, '#0284c7'),
                createCircleEntity({ x: lx, y: cy + ha / 2 }, 3, layerCable, '#f59e0b')
            );
        }

        const upperLinks = Math.floor(upperLen / pitch);
        for (let i = 1; i < upperLinks; i++) {
            const lx = loopCenterX - i * pitch;
            entities.push(
                createLineEntity({ x: lx, y: upperRunY - ha / 2 }, { x: lx, y: upperRunY + ha / 2 }, layerChain, '#0284c7'),
                createCircleEntity({ x: lx, y: upperRunY }, 3, layerCable, '#f59e0b')
            );
        }

        // Fixed & Moving End Brackets (Hatched)
        entities.push(
            createHatchEntity([
                { x: cx, y: cy },
                { x: cx + pitch * 0.7, y: cy },
                { x: cx + pitch * 0.7, y: cy + ha },
                { x: cx, y: cy + ha }
            ], 'ANSI31', layerCable, '#22c55e'),
            createHatchEntity([
                { x: loopCenterX - upperLen, y: upperRunY - ha / 2 },
                { x: loopCenterX - upperLen + pitch * 0.7, y: upperRunY - ha / 2 },
                { x: loopCenterX - upperLen + pitch * 0.7, y: upperRunY + ha / 2 },
                { x: loopCenterX - upperLen, y: upperRunY + ha / 2 }
            ], 'ANSI31', layerCable, '#f59e0b')
        );

        return entities;
    },
    generate3D: (params, basePos = { x: 0, y: 0, z: 0 }) => {
        const modelKey = String(params.chainModel || 'E4_35');
        const spec = DRAG_CHAIN_CATALOG[modelKey] || DRAG_CHAIN_CATALOG.E4_35;
        const Ls = Math.max(250, Math.min(2400, Number(params.strokeLength) || 600));
        const { ha, Ba, bendR } = spec;

        return [
            {
                id: 'drag-chain-lower',
                name: `${spec.code} Lower Energy Chain Run`,
                kind: 'box',
                color: '#1e293b',
                position: { x: basePos.x + Ls / 2, y: basePos.y + ha / 2, z: basePos.z },
                params: { width: Ls, height: ha, depth: Ba }
            },
            {
                id: 'drag-chain-upper',
                name: `${spec.code} Upper Moving Energy Chain Run`,
                kind: 'box',
                color: '#334155',
                position: { x: basePos.x + Ls * 0.65, y: basePos.y + bendR * 2 + ha / 2, z: basePos.z },
                params: { width: Ls * 0.7, height: ha, depth: Ba }
            }
        ];
    },
    getGrips: (params, basePoint = { x: 0, y: 0 }): DynamicGrip[] => {
        const modelKey = String(params.chainModel || 'E4_35');
        const spec = DRAG_CHAIN_CATALOG[modelKey] || DRAG_CHAIN_CATALOG.E4_35;
        const Ls = Math.max(250, Math.min(2400, Number(params.strokeLength) || 600));

        return [
            {
                id: 'grip-origin',
                type: 'point',
                paramId: 'basePoint',
                position: { x: basePoint.x, y: basePoint.y },
                tooltip: 'Move Energy Chain',
                tooltipTr: 'Kablo Zincirini Taşı'
            },
            {
                id: 'grip-stroke-length',
                type: 'linear',
                paramId: 'strokeLength',
                position: { x: basePoint.x + Ls + spec.bendR, y: basePoint.y + spec.bendR },
                direction: { x: 1, y: 0 },
                label: `Ls=${Ls}mm`,
                labelTr: `Hat Boyu Ls=${Ls}mm`
            }
        ];
    }
};
