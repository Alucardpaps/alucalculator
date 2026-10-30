/**
 * 🧱 Dynamic Pneumatic Parallel Gripper (ISO/DIS 20468 / SMC MHC2 / Schunk PGN-plus Series)
 *
 * - Lookup Catalog: Size 16, 20, 25, 32, 40, 50, 64 Parallel 2-Finger Grippers
 * - Linear Params: Jaw Opening Percentage (0–100%), Custom Tooling Finger Length (20–120 mm)
 * - Visibility States:
 *    - Front Section View (Ön Kesit — Eloksallı Gövde, Kama-Kızak Mekanizması, Piston ve ISO 128 Tarama)
 *    - Top Jaw Mounting View (Üst Görünüş — T-Kızak Çeneler ve Merkezleme Burçları)
 *    - Side Profile View (Yan Görünüş — Hava Portları M5 / G1/8 ve Sensör Kanalı)
 * - 3D Solids: Anodized gripper housing + left/right sliding base jaws + custom tooling fingers
 */

import {
    CadEntity,
    createLineEntity,
    createRectangleEntity,
    createCircleEntity,
    createHatchEntity
} from '../../../kernel/types';
import { DynamicBlockDef, DynamicGrip, DynamicPart3DDef } from '../types';

export interface PneumaticGripperSpec {
    code: string;
    bodyW: number;     // Housing width (mm)
    bodyD: number;     // Housing depth/thickness (mm)
    bodyH: number;     // Housing height without jaws (mm)
    jawW: number;      // Single base jaw width (mm)
    jawH: number;      // Base jaw height above housing (mm)
    closedSpan: number;// Inner gap when closed (mm)
    strokeTotal: number;// Total opening stroke (mm)
    forceN: number;    // Gripping force per finger at 6 bar (N)
    portThread: string;
}

export const PNEUMATIC_GRIPPER_CATALOG: Record<string, PneumaticGripperSpec> = {
    PGN_16: { code: 'PGN_16', bodyW: 34,  bodyD: 20, bodyH: 42, jawW: 11, jawH: 8,  closedSpan: 4,  strokeTotal: 6,  forceN: 45,   portThread: 'M3' },
    PGN_20: { code: 'PGN_20', bodyW: 44,  bodyD: 25, bodyH: 50, jawW: 14, jawH: 10, closedSpan: 6,  strokeTotal: 10, forceN: 85,   portThread: 'M5' },
    PGN_25: { code: 'PGN_25', bodyW: 54,  bodyD: 30, bodyH: 58, jawW: 17, jawH: 12, closedSpan: 8,  strokeTotal: 14, forceN: 140,  portThread: 'M5' },
    PGN_32: { code: 'PGN_32', bodyW: 68,  bodyD: 36, bodyH: 68, jawW: 21, jawH: 14, closedSpan: 10, strokeTotal: 20, forceN: 245,  portThread: 'M5' },
    PGN_40: { code: 'PGN_40', bodyW: 84,  bodyD: 44, bodyH: 80, jawW: 26, jawH: 16, closedSpan: 12, strokeTotal: 26, forceN: 390,  portThread: 'G1/8' },
    PGN_50: { code: 'PGN_50', bodyW: 104, bodyD: 54, bodyH: 96, jawW: 32, jawH: 20, closedSpan: 14, strokeTotal: 34, forceN: 680,  portThread: 'G1/8' },
    PGN_64: { code: 'PGN_64', bodyW: 130, bodyD: 66, bodyH: 115, jawW: 40, jawH: 24, closedSpan: 18, strokeTotal: 44, forceN: 1180, portThread: 'G1/4' }
};

export const DYN_PNEUMATIC_GRIPPER: DynamicBlockDef = {
    id: 'dyn_pneumatic_gripper',
    name: 'Pneumatic 2-Finger Parallel Gripper (Schunk PGN / SMC MHC2)',
    nameTr: 'Dinamik Pnömatik Paralel Tutucu / Gripper (Schunk PGN / SMC)',
    category: 'Mechanical',
    subcategory: 'Robotics & Automation',
    subcategoryTr: 'Robotik ve Otomasyon Elemanları',
    description: 'High-precision 2-finger parallel pneumatic gripper (PGN-plus / MHC2 series) with wedge-hook kinematics, T-slot guide, adjustable jaw opening percentage, custom finger length, and ISO 128 section hatch.',
    descriptionTr: 'Kama-kızak mekanizmalı 2 çeneli pnömatik paralel robot tutucu (Gripper); ayarlanabilir çene açıklık yüzdesi (%0–%100), özel parmak boyu, ön kesit (HATCH) ve üst görünüş.',
    icon: '🦀',
    calculatorRoute: '/hydraulics/',
    calculatorModuleType: 'hydraulics',
    calculatorLabelTr: 'Pnömatik Kuvvet ve Basınç Hesabına Git',
    citation: {
        tier: 2,
        standard: 'ISO 9409-1 / Schunk PGN-plus / SMC MHC2 Engineering Handbook',
        clause: 'Pneumatic parallel grippers with T-slot guidance and wedge-hook transmission',
        description: 'Standard housing dimensions, jaw strokes, gripping force at 0.6 MPa, and pneumatic port positions.'
    },
    linearParams: [
        {
            id: 'openPct',
            name: 'openPct',
            label: 'Jaw Opening Percentage (%)',
            labelTr: 'Çene Açıklık Oranı (%)',
            min: 0,
            max: 100,
            step: 10,
            default: 50,
            unit: '%',
            axis: 'x'
        },
        {
            id: 'fingerLength',
            name: 'fingerLength',
            label: 'Custom Finger Length (Lf)',
            labelTr: 'Tutucu Parmak Boyu (Lf)',
            min: 15,
            max: 120,
            step: 5,
            default: 40,
            unit: 'mm',
            axis: 'y'
        }
    ],
    flipParams: [],
    visibilityParam: {
        id: 'viewMode',
        name: 'viewMode',
        label: 'View / Section Mode',
        labelTr: 'Görünüş / Kesit Modu',
        states: [
            { id: 'front_section', label: 'Front Section View (Ön Kesit — Kama-Kızak & Piston)', labelTr: 'Ön Kesit (Piston, Kama Mekanizması & Çeneler — HATCH)' },
            { id: 'top_view', label: 'Top Jaw Mounting View (Üst Görünüş — T-Kızak Çeneler)', labelTr: 'Üst Görünüş (T-Kızak Çene Montaj Delikleri)' },
            { id: 'side_view', label: 'Side Profile View (Yan Görünüş — Sensör & Hava Portları)', labelTr: 'Yan Görünüş (Sensör Kanalı & Hava Girişleri)' }
        ],
        default: 'front_section'
    },
    lookupParams: [
        {
            id: 'gripperModel',
            name: 'gripperModel',
            label: 'Gripper Size Series',
            labelTr: 'Pnömatik Gripper Boyutu',
            options: Object.values(PNEUMATIC_GRIPPER_CATALOG).map((g) => ({
                id: g.code,
                label: `${g.code} (Gövde ${g.bodyW}×${g.bodyH}mm — Strok ${g.strokeTotal}mm, Kuvvet: ${g.forceN} N @ 6 bar)`,
                standard: 'ISO 9409 / PGN',
                values: { gripperModel: g.code }
            })),
            default: 'PGN_32'
        }
    ],
    defaultValues: {
        gripperModel: 'PGN_32',
        openPct: 50,
        fingerLength: 40,
        viewMode: 'front_section'
    },
    generate2D: (params, basePoint = { x: 0, y: 0 }) => {
        const modelKey = String(params.gripperModel || 'PGN_32');
        const spec = PNEUMATIC_GRIPPER_CATALOG[modelKey] || PNEUMATIC_GRIPPER_CATALOG.PGN_32;
        const openPct = Math.max(0, Math.min(100, Number(params.openPct) ?? 50));
        const fingerLen = Math.max(15, Math.min(120, Number(params.fingerLength) || 40));
        const viewMode = String(params.viewMode || 'front_section');

        const { bodyW, bodyD, bodyH, jawW, jawH, closedSpan, strokeTotal } = spec;
        const halfGap = (closedSpan + (strokeTotal * openPct) / 100) / 2;

        const entities: CadEntity[] = [];
        const layerBody = 'layer-mech';
        const layerJaw = 'layer-accent';
        const layerRef = 'layer-ref';

        const cx = basePoint.x;
        const cy = basePoint.y;

        if (viewMode === 'top_view') {
            // Top Plan View centered at (cx, cy)
            entities.push(
                createLineEntity({ x: cx - bodyW / 2 - 14, y: cy }, { x: cx + bodyW / 2 + 14, y: cy }, layerRef, '#ef4444'),
                createLineEntity({ x: cx, y: cy - bodyD / 2 - 14 }, { x: cx, y: cy + bodyD / 2 + 14 }, layerRef, '#ef4444'),
                createRectangleEntity({ x: cx, y: cy }, bodyW, bodyD, layerBody, '#38bdf8'),
                // Full-width T-slot guideway groove
                createRectangleEntity({ x: cx, y: cy }, bodyW, bodyD * 0.42, layerRef, '#64748b')
            );
            // Left & Right Sliding Base Jaws
            for (const sign of [-1, 1]) {
                const jx = cx + sign * (halfGap + jawW / 2);
                entities.push(
                    createRectangleEntity({ x: jx, y: cy }, jawW, bodyD * 0.48, layerJaw, '#f59e0b'),
                    createCircleEntity({ x: jx - sign * (jawW * 0.22), y: cy }, 2.5, layerRef, '#f8fafc'),
                    createCircleEntity({ x: jx + sign * (jawW * 0.22), y: cy }, 2.5, layerRef, '#f8fafc')
                );
            }
            return entities;
        }

        if (viewMode === 'side_view') {
            // Side Profile View (Width = bodyD, Height = bodyH + jawH + fingerLen)
            entities.push(
                createLineEntity({ x: cx, y: cy - 10 }, { x: cx, y: cy + bodyH + jawH + fingerLen + 10 }, layerRef, '#ef4444'),
                createRectangleEntity({ x: cx, y: cy + bodyH / 2 }, bodyD, bodyH, layerBody, '#38bdf8'),
                createRectangleEntity({ x: cx, y: cy + bodyH + jawH / 2 }, bodyD * 0.52, jawH, layerJaw, '#f59e0b'),
                createRectangleEntity({ x: cx, y: cy + bodyH + jawH + fingerLen / 2 }, bodyD * 0.44, fingerLen, layerJaw, '#22c55e'),
                // Magnetic reed sensor slots
                createRectangleEntity({ x: cx - bodyD * 0.28, y: cy + bodyH * 0.45 }, 4, bodyH * 0.65, layerRef, '#eab308'),
                createRectangleEntity({ x: cx + bodyD * 0.28, y: cy + bodyH * 0.45 }, 4, bodyH * 0.65, layerRef, '#eab308')
            );
            return entities;
        }

        // Front Cross-Section View (ISO 128 HATCH)
        // Symmetry axis
        entities.push(
            createLineEntity({ x: cx, y: cy - 12 }, { x: cx, y: cy + bodyH + jawH + fingerLen + 14 }, layerRef, '#ef4444')
        );

        // Anodized Aluminum Gripper Housing
        entities.push(
            createRectangleEntity({ x: cx, y: cy + bodyH / 2 }, bodyW, bodyH, layerBody, '#38bdf8')
        );

        // Internal Pneumatic Cylinder Bore & Piston Chamber
        const boreW = bodyW * 0.68;
        const boreH = bodyH * 0.48;
        const boreY = cy + bodyH * 0.36;
        const pistonLift = (openPct / 100) * (boreH * 0.35);
        const pistonY = boreY - boreH * 0.12 + pistonLift;
        const pistonThick = boreH * 0.24;

        // Left & Right Housing Wall Section Hatches (ISO 128)
        const wallW = (bodyW - boreW) / 2;
        entities.push(
            createHatchEntity([
                { x: cx - bodyW / 2, y: cy },
                { x: cx - bodyW / 2 + wallW, y: cy },
                { x: cx - bodyW / 2 + wallW, y: cy + bodyH },
                { x: cx - bodyW / 2, y: cy + bodyH }
            ], 'ANSI31', layerBody, '#0284c7'),
            createHatchEntity([
                { x: cx + bodyW / 2 - wallW, y: cy },
                { x: cx + bodyW / 2, y: cy },
                { x: cx + bodyW / 2, y: cy + bodyH },
                { x: cx + bodyW / 2 - wallW, y: cy + bodyH }
            ], 'ANSI31', layerBody, '#0284c7')
        );

        // Cylinder Chamber & Hatched Pneumatic Piston
        entities.push(
            createRectangleEntity({ x: cx, y: boreY }, boreW, boreH, layerRef, '#64748b'),
            createRectangleEntity({ x: cx, y: pistonY }, boreW * 0.96, pistonThick, layerJaw, '#f59e0b'),
            createHatchEntity([
                { x: cx - boreW * 0.48, y: pistonY - pistonThick / 2 },
                { x: cx + boreW * 0.48, y: pistonY - pistonThick / 2 },
                { x: cx + boreW * 0.48, y: pistonY + pistonThick / 2 },
                { x: cx - boreW * 0.48, y: pistonY + pistonThick / 2 }
            ], 'ANSI31', layerJaw, '#d97706')
        );

        // Wedge-Hook Kinematic Links from Piston to Base Jaws
        for (const sign of [-1, 1]) {
            const jx = cx + sign * (halfGap + jawW / 2);
            const jawCenterY = cy + bodyH + jawH / 2;
            const fingerCenterY = cy + bodyH + jawH + fingerLen / 2;

            // Diagonal wedge-hook transmission bar
            entities.push(
                createLineEntity({ x: cx + sign * (boreW * 0.18), y: pistonY + pistonThick / 2 }, { x: jx, y: cy + bodyH }, layerJaw, '#eab308')
            );

            // Base Jaw (T-Slot Hardened Steel)
            entities.push(
                createRectangleEntity({ x: jx, y: jawCenterY }, jawW, jawH, layerJaw, '#f59e0b')
            );

            // Custom Tooling Finger with stepped workpiece grip ledge
            const fingerW = jawW * 0.65;
            const fingerX = cx + sign * (halfGap + fingerW / 2);
            entities.push(
                createRectangleEntity({ x: fingerX, y: fingerCenterY }, fingerW, fingerLen, layerJaw, '#22c55e'),
                createHatchEntity([
                    { x: fingerX - fingerW / 2, y: fingerCenterY - fingerLen / 2 },
                    { x: fingerX + fingerW / 2, y: fingerCenterY - fingerLen / 2 },
                    { x: fingerX + fingerW / 2, y: fingerCenterY + fingerLen / 2 },
                    { x: fingerX - fingerW / 2, y: fingerCenterY + fingerLen / 2 }
                ], 'ANSI31', layerJaw, '#16a34a')
            );
        }

        // Open / Close Pneumatic Ports (M5 / G1/8)
        entities.push(
            createCircleEntity({ x: cx - bodyW * 0.34, y: cy + bodyH * 0.22 }, 3.2, layerRef, '#38bdf8'),
            createCircleEntity({ x: cx + bodyW * 0.34, y: cy + bodyH * 0.52 }, 3.2, layerRef, '#ef4444')
        );

        return entities;
    },
    generate3D: (params, basePos = { x: 0, y: 0, z: 0 }) => {
        const modelKey = String(params.gripperModel || 'PGN_32');
        const spec = PNEUMATIC_GRIPPER_CATALOG[modelKey] || PNEUMATIC_GRIPPER_CATALOG.PGN_32;
        const openPct = Math.max(0, Math.min(100, Number(params.openPct) ?? 50));
        const fingerLen = Math.max(15, Math.min(120, Number(params.fingerLength) || 40));

        const { bodyW, bodyD, bodyH, jawW, jawH, closedSpan, strokeTotal } = spec;
        const halfGap = (closedSpan + (strokeTotal * openPct) / 100) / 2;

        return [
            {
                id: 'gripper-body',
                name: `${spec.code} Pneumatic Gripper Body`,
                kind: 'box',
                color: '#334155',
                position: { x: basePos.x, y: basePos.y + bodyH / 2, z: basePos.z },
                params: { width: bodyW, height: bodyH, depth: bodyD }
            },
            {
                id: 'gripper-jaw-left',
                name: 'Left Sliding Finger',
                kind: 'box',
                color: '#f59e0b',
                position: { x: basePos.x - (halfGap + jawW / 2), y: basePos.y + bodyH + (jawH + fingerLen) / 2, z: basePos.z },
                params: { width: jawW, height: jawH + fingerLen, depth: bodyD * 0.5 }
            },
            {
                id: 'gripper-jaw-right',
                name: 'Right Sliding Finger',
                kind: 'box',
                color: '#f59e0b',
                position: { x: basePos.x + (halfGap + jawW / 2), y: basePos.y + bodyH + (jawH + fingerLen) / 2, z: basePos.z },
                params: { width: jawW, height: jawH + fingerLen, depth: bodyD * 0.5 }
            }
        ];
    },
    getGrips: (params, basePoint = { x: 0, y: 0 }): DynamicGrip[] => {
        const modelKey = String(params.gripperModel || 'PGN_32');
        const spec = PNEUMATIC_GRIPPER_CATALOG[modelKey] || PNEUMATIC_GRIPPER_CATALOG.PGN_32;
        const openPct = Math.max(0, Math.min(100, Number(params.openPct) ?? 50));
        const fingerLen = Math.max(15, Math.min(120, Number(params.fingerLength) || 40));
        const halfGap = (spec.closedSpan + (spec.strokeTotal * openPct) / 100) / 2;

        return [
            {
                id: 'grip-origin',
                type: 'point',
                paramId: 'basePoint',
                position: { x: basePoint.x, y: basePoint.y },
                tooltip: 'Move Pneumatic Gripper',
                tooltipTr: 'Pnömatik Tutucuyu Taşı'
            },
            {
                id: 'grip-open-pct',
                type: 'linear',
                paramId: 'openPct',
                position: { x: basePoint.x + halfGap + spec.jawW, y: basePoint.y + spec.bodyH + spec.jawH / 2 },
                direction: { x: 1, y: 0 },
                label: `Open ${openPct}%`,
                labelTr: `Açıklık %${openPct}`
            },
            {
                id: 'grip-finger-len',
                type: 'linear',
                paramId: 'fingerLength',
                position: { x: basePoint.x, y: basePoint.y + spec.bodyH + spec.jawH + fingerLen },
                direction: { x: 0, y: 1 },
                label: `Lf=${fingerLen}mm`,
                labelTr: `Parmak Lf=${fingerLen}mm`
            }
        ];
    }
};
