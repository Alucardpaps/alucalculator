/**
 * 🌀 Dynamic Precision Ball Screw & Flanged Nut Assembly (ISO 3408 / DIN 69051 / SFU Series)
 *
 * - Lookup Catalog: SFU1204, SFU1605, SFU2005, SFU2505, SFU3205, SFU4010, SFU5010
 * - Linear Params: Total Screw Length (200–3000 mm), Nut Travel Position X (mm)
 * - Visibility States:
 *    - Axial Cross-Section (Boyuna Kesit — Vidalı Mil, Bilyalı Somun, BK/BF Yatak Uçları ve ISO 128 Tarama)
 *    - Nut Flange Face View (Somun Flanş Alın Görünüşü — DIN 69051 Kesik Flanş & Montaj Delikleri)
 *    - Side Elevation View (Dış Yan Görünüş — Helisel Vida Diş İzleri & Yataklanmış Mil Uçları)
 * - 3D Solids: Threaded ball screw shaft + machined journal ends + flanged ball nut body
 */

import {
    CadEntity,
    createLineEntity,
    createRectangleEntity,
    createCircleEntity,
    createHatchEntity
} from '../../../kernel/types';
import { DynamicBlockDef, DynamicGrip, DynamicPart3DDef } from '../types';

export interface BallScrewCatalogSpec {
    code: string;
    d0: number;       // Nominal screw diameter (mm)
    leadPh: number;   // Lead / pitch Ph (mm)
    nutD: number;     // Nut body outer diameter D (mm)
    flangeD: number;  // Nut flange outer diameter D1 (mm)
    flangeT: number;  // Nut flange thickness T (mm)
    nutL: number;     // Total nut length L (mm)
    bcd: number;      // Bolt circle diameter (mm)
    boltHoleD: number;// Mounting bolt hole diameter (mm)
    journalD: number; // BK/BF bearing journal diameter (mm)
    dynCa_kN: number; // Dynamic axial load rating Ca (kN)
}

export const SFU_BALLSCREW_CATALOG: Record<string, BallScrewCatalogSpec> = {
    SFU1204: { code: 'SFU1204', d0: 12, leadPh: 4,  nutD: 24, flangeD: 40, flangeT: 10, nutL: 40, bcd: 32, boltHoleD: 4.5, journalD: 8,  dynCa_kN: 5.8 },
    SFU1605: { code: 'SFU1605', d0: 16, leadPh: 5,  nutD: 28, flangeD: 48, flangeT: 10, nutL: 42, bcd: 38, boltHoleD: 5.5, journalD: 12, dynCa_kN: 11.8 },
    SFU2005: { code: 'SFU2005', d0: 20, leadPh: 5,  nutD: 36, flangeD: 58, flangeT: 10, nutL: 51, bcd: 47, boltHoleD: 6.6, journalD: 15, dynCa_kN: 13.7 },
    SFU2505: { code: 'SFU2505', d0: 25, leadPh: 5,  nutD: 40, flangeD: 62, flangeT: 10, nutL: 51, bcd: 51, boltHoleD: 6.6, journalD: 20, dynCa_kN: 15.9 },
    SFU3205: { code: 'SFU3205', d0: 32, leadPh: 5,  nutD: 50, flangeD: 80, flangeT: 12, nutL: 52, bcd: 65, boltHoleD: 9.0, journalD: 25, dynCa_kN: 21.3 },
    SFU4010: { code: 'SFU4010', d0: 40, leadPh: 10, nutD: 63, flangeD: 93, flangeT: 14, nutL: 85, bcd: 78, boltHoleD: 9.0, journalD: 30, dynCa_kN: 49.5 },
    SFU5010: { code: 'SFU5010', d0: 50, leadPh: 10, nutD: 75, flangeD: 110, flangeT: 16, nutL: 90, bcd: 93, boltHoleD: 11.0, journalD: 40, dynCa_kN: 63.8 }
};

export const DYN_BALL_SCREW: DynamicBlockDef = {
    id: 'dyn_ball_screw',
    name: 'Ball Screw & Flanged Nut Assembly (ISO 3408 / DIN 69051)',
    nameTr: 'Dinamik Bilyalı Vidalı Mil ve Somun (SFU / ISO 3408)',
    category: 'Mechanical',
    subcategory: 'Linear Motion & CNC',
    subcategoryTr: 'Lineer Hareket ve CNC Sistemleri',
    description: 'ISO 3408 / DIN 69051 Form B precision ball screw assembly (SFU1204–SFU5010) with adjustable screw length, sliding ball nut position, and machined BK/BF bearing journals.',
    descriptionTr: 'ISO 3408 ve DIN 69051 normlarında SFU1204–SFU5010 bilyalı vidalı mil, flanşlı somun ve BK/BF işlenmiş mil uçları.',
    icon: '🌀',
    calculatorRoute: '/power-screw/',
    calculatorModuleType: 'power-screw',
    calculatorLabelTr: 'Vidalı Mil Tork, Kritik Devir ve Burkulma Hesabına Git (ISO 3408)',
    citation: {
        tier: 1,
        standard: 'ISO 3408-3:2006 / DIN 69051-5',
        clause: 'Ball screws — Nominal diameters, basic leads & flanged ball nut boundary dimensions',
        description: 'Standard SFU/DIN 69051 Form B flanged nut dimensions, bolt circle diameters, and dynamic axial load ratings Ca.'
    },
    linearParams: [
        {
            id: 'screwLength',
            name: 'screwLength',
            label: 'Total Screw Length (L)',
            labelTr: 'Toplam Vidalı Mil Boyu (L)',
            min: 200,
            max: 3000,
            step: 50,
            default: 650,
            unit: 'mm',
            axis: 'x'
        },
        {
            id: 'nutPos',
            name: 'nutPos',
            label: 'Ball Nut Travel Position (X)',
            labelTr: 'Bilyalı Somun Konumu (X)',
            min: 80,
            max: 2800,
            step: 25,
            default: 260,
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
            { id: 'axial_section', label: 'Axial Cross-Section (Boyuna Kesit — Somun & Mil)', labelTr: 'Boyuna Kesit (Somun & Bilya Kanalı Tarama)' },
            { id: 'flange_face', label: 'Nut Flange Face View (DIN 69051 Alın Görünüşü)', labelTr: 'Somun Flanş Alın Görünüşü (Montaj Delikleri)' },
            { id: 'side_view', label: 'Exterior Side View (Dış Yan Görünüş)', labelTr: 'Dış Yan Görünüş (BK/BF Uç İşlemeli)' }
        ],
        default: 'axial_section'
    },
    lookupParams: [
        {
            id: 'sfuModel',
            name: 'sfuModel',
            label: 'SFU / ISO 3408 Ball Screw Size',
            labelTr: 'Standart SFU Vidalı Mil & Somun Serisi',
            options: Object.values(SFU_BALLSCREW_CATALOG).map((s) => ({
                id: s.code,
                label: `${s.code} (Ø${s.d0}x${s.leadPh} mm Hatve — Flanş Ø${s.flangeD}mm, Ca=${s.dynCa_kN} kN)`,
                standard: 'ISO 3408 / DIN 69051',
                values: { sfuModel: s.code }
            })),
            default: 'SFU2005'
        }
    ],
    defaultValues: {
        sfuModel: 'SFU2005',
        screwLength: 650,
        nutPos: 260,
        viewMode: 'axial_section'
    },
    generate2D: (params, basePoint = { x: 0, y: 0 }) => {
        const modelKey = String(params.sfuModel || 'SFU2005');
        const spec = SFU_BALLSCREW_CATALOG[modelKey] || SFU_BALLSCREW_CATALOG.SFU2005;
        const screwLength = Math.max(200, Number(params.screwLength) || 650);
        const { d0, leadPh, nutD, flangeD, flangeT, nutL, bcd, boltHoleD, journalD } = spec;

        const journalL = Math.max(35, d0 * 2.1);
        const minNutX = journalL + flangeT + 15;
        const maxNutX = Math.max(minNutX + 20, screwLength - journalL - nutL - 10);
        const nutPos = Math.min(maxNutX, Math.max(minNutX, Number(params.nutPos) || 260));
        const viewMode = String(params.viewMode || 'axial_section');

        const entities: CadEntity[] = [];
        const layerScrew = 'layer-mech';
        const layerNut = 'layer-accent';
        const layerRef = 'layer-ref';

        if (viewMode === 'flange_face') {
            // DIN 69051 Flanged Nut End View (with flat milled sides & 6 bolt holes)
            const cx = basePoint.x + flangeD / 2;
            const cy = basePoint.y;
            entities.push(
                createLineEntity({ x: cx - flangeD * 0.6, y: cy }, { x: cx + flangeD * 0.6, y: cy }, layerRef, '#ef4444'),
                createLineEntity({ x: cx, y: cy - flangeD * 0.6 }, { x: cx, y: cy + flangeD * 0.6 }, layerRef, '#ef4444'),
                createCircleEntity({ x: cx, y: cy }, flangeD / 2, layerNut, '#f59e0b'),
                createCircleEntity({ x: cx, y: cy }, bcd / 2, layerRef, '#64748b'),
                createCircleEntity({ x: cx, y: cy }, nutD / 2, layerNut, '#38bdf8'),
                createCircleEntity({ x: cx, y: cy }, d0 / 2, layerScrew, '#f8fafc')
            );
            // 6 Mounting Bolt Holes around BCD
            for (let i = 0; i < 6; i++) {
                const ang = Math.PI / 6 + (i * Math.PI) / 3;
                entities.push(
                    createCircleEntity(
                        { x: cx + (bcd / 2) * Math.cos(ang), y: cy + (bcd / 2) * Math.sin(ang) },
                        boltHoleD / 2,
                        layerNut,
                        '#22c55e'
                    )
                );
            }
            return entities;
        }

        // Centerline
        entities.push(
            createLineEntity(
                { x: basePoint.x - 20, y: basePoint.y },
                { x: basePoint.x + screwLength + 20, y: basePoint.y },
                layerRef,
                '#ef4444'
            )
        );

        // Left BK Fixed-Side Machined Journal + Right BF Floating-Side Journal
        const threadLen = screwLength - journalL * 1.65;
        const threadStartX = basePoint.x + journalL;
        const threadEndX = threadStartX + threadLen;
        const rightJournalLen = screwLength - ( journalL + threadLen );

        entities.push(
            // Left BK Journal + Motor Coupling Step
            createRectangleEntity(
                { x: basePoint.x + journalL * 0.3, y: basePoint.y },
                journalL * 0.6,
                journalD * 0.8,
                layerScrew,
                '#94a3b8'
            ),
            createRectangleEntity(
                { x: basePoint.x + journalL * 0.8, y: basePoint.y },
                journalL * 0.4,
                journalD,
                layerScrew,
                '#cbd5e1'
            ),
            // Main Threaded Ball Screw Shaft
            createRectangleEntity(
                { x: threadStartX + threadLen / 2, y: basePoint.y },
                threadLen,
                d0,
                layerScrew,
                '#38bdf8'
            ),
            // Right BF Floating Journal
            createRectangleEntity(
                { x: threadEndX + rightJournalLen / 2, y: basePoint.y },
                rightJournalLen,
                journalD,
                layerScrew,
                '#cbd5e1'
            )
        );

        // Helical Thread Pitch Lines along Screw (every max(12mm, leadPh*2))
        const pitchVis = Math.max(12, leadPh * 2.5);
        for (let tx = threadStartX + 8; tx < threadEndX - 8; tx += pitchVis) {
            if (tx >= basePoint.x + nutPos && tx <= basePoint.x + nutPos + nutL) continue;
            entities.push(
                createLineEntity(
                    { x: tx - 2, y: basePoint.y - d0 / 2 },
                    { x: tx + 2, y: basePoint.y + d0 / 2 },
                    layerRef,
                    '#0284c7'
                )
            );
        }

        // Flanged Ball Nut Body at nutPos
        const nutStartX = basePoint.x + nutPos;
        const bodyCylLen = nutL - flangeT;
        entities.push(
            // Nut Flange Collar
            createRectangleEntity(
                { x: nutStartX + flangeT / 2, y: basePoint.y },
                flangeT,
                flangeD,
                layerNut,
                '#f59e0b'
            ),
            // Nut Cylindrical Body
            createRectangleEntity(
                { x: nutStartX + flangeT + bodyCylLen / 2, y: basePoint.y },
                bodyCylLen,
                nutD,
                layerNut,
                '#f59e0b'
            )
        );

        if (viewMode === 'axial_section') {
            // ISO 128 Section Hatches on Ball Nut Flange & Body (Top & Bottom halves around screw d0)
            entities.push(
                createHatchEntity([
                    { x: nutStartX, y: basePoint.y + d0 / 2 },
                    { x: nutStartX + flangeT, y: basePoint.y + d0 / 2 },
                    { x: nutStartX + flangeT, y: basePoint.y + flangeD / 2 },
                    { x: nutStartX, y: basePoint.y + flangeD / 2 }
                ], 'ANSI31', layerNut, '#d97706'),
                createHatchEntity([
                    { x: nutStartX, y: basePoint.y - flangeD / 2 },
                    { x: nutStartX + flangeT, y: basePoint.y - flangeD / 2 },
                    { x: nutStartX + flangeT, y: basePoint.y - d0 / 2 },
                    { x: nutStartX, y: basePoint.y - d0 / 2 }
                ], 'ANSI31', layerNut, '#d97706'),
                createHatchEntity([
                    { x: nutStartX + flangeT, y: basePoint.y + d0 / 2 },
                    { x: nutStartX + nutL, y: basePoint.y + d0 / 2 },
                    { x: nutStartX + nutL, y: basePoint.y + nutD / 2 },
                    { x: nutStartX + flangeT, y: basePoint.y + nutD / 2 }
                ], 'ANSI31', layerNut, '#d97706'),
                createHatchEntity([
                    { x: nutStartX + flangeT, y: basePoint.y - nutD / 2 },
                    { x: nutStartX + nutL, y: basePoint.y - nutD / 2 },
                    { x: nutStartX + nutL, y: basePoint.y - d0 / 2 },
                    { x: nutStartX + flangeT, y: basePoint.y - d0 / 2 }
                ], 'ANSI31', layerNut, '#d97706')
            );

            // Recirculating Balls inside Nut
            const ballR = Math.max(1.5, leadPh * 0.3);
            for (let bx = nutStartX + flangeT + 5; bx < nutStartX + nutL - 5; bx += leadPh * 1.4) {
                entities.push(
                    createCircleEntity({ x: bx, y: basePoint.y + d0 / 2 }, ballR, layerNut, '#f8fafc'),
                    createCircleEntity({ x: bx, y: basePoint.y - d0 / 2 }, ballR, layerNut, '#f8fafc')
                );
            }
        }

        return entities;
    },
    generate3D: (params, basePos = { x: 0, y: 0, z: 0 }) => {
        const modelKey = String(params.sfuModel || 'SFU2005');
        const spec = SFU_BALLSCREW_CATALOG[modelKey] || SFU_BALLSCREW_CATALOG.SFU2005;
        const screwLength = Math.max(200, Number(params.screwLength) || 650);
        const { d0, nutD, flangeD, flangeT, nutL } = spec;
        const nutPos = Math.min(screwLength - nutL - 30, Math.max(40, Number(params.nutPos) || 260));

        const parts: DynamicPart3DDef[] = [
            // Precision Ground Ball Screw Shaft
            {
                id: `sfu_shaft_${Date.now()}`,
                name: `${spec.code} Hassas Vidalı Mil (L=${screwLength}mm)`,
                kind: 'cylinder',
                color: '#cbd5e1',
                position: { x: basePos.x + screwLength / 2, y: basePos.y, z: basePos.z },
                rotation: { x: 0, y: 90, z: 0 },
                params: { diameter: d0, length: screwLength },
                designStandard: 'ISO 3408'
            },
            // Flanged Ball Nut Collar
            {
                id: `sfu_flange_${Date.now()}`,
                name: `${spec.code} Bilyalı Somun Flanşı`,
                kind: 'tube',
                color: '#d97706',
                position: { x: basePos.x + nutPos + flangeT / 2, y: basePos.y, z: basePos.z },
                rotation: { x: 0, y: 90, z: 0 },
                params: { diameter: flangeD, wall: (flangeD - d0) / 2, length: flangeT },
                designStandard: 'DIN 69051'
            },
            // Ball Nut Cylindrical Body
            {
                id: `sfu_nut_${Date.now()}`,
                name: `${spec.code} Bilyalı Somun Gövdesi`,
                kind: 'tube',
                color: '#475569',
                position: { x: basePos.x + nutPos + flangeT + (nutL - flangeT) / 2, y: basePos.y, z: basePos.z },
                rotation: { x: 0, y: 90, z: 0 },
                params: { diameter: nutD, wall: (nutD - d0) / 2, length: nutL - flangeT },
                designStandard: 'DIN 69051'
            }
        ];

        return parts;
    },
    getGrips: (params, basePoint = { x: 0, y: 0 }) => {
        const modelKey = String(params.sfuModel || 'SFU2005');
        const spec = SFU_BALLSCREW_CATALOG[modelKey] || SFU_BALLSCREW_CATALOG.SFU2005;
        const screwLength = Math.max(200, Number(params.screwLength) || 650);
        const nutPos = Math.min(screwLength - spec.nutL - 30, Math.max(40, Number(params.nutPos) || 260));

        return [
            {
                id: 'grip_sfu_len',
                type: 'stretch',
                paramId: 'screwLength',
                position: { x: basePoint.x + screwLength, y: basePoint.y },
                direction: { x: 1, y: 0 },
                tooltip: `Vidalı Mil Boyunu Esnet (${screwLength} mm)`,
                tooltipTr: `Vidalı Mil Boyunu Esnet (${screwLength} mm)`
            },
            {
                id: 'grip_sfu_nut',
                type: 'stretch',
                paramId: 'nutPos',
                position: { x: basePoint.x + nutPos + spec.nutL / 2, y: basePoint.y + spec.flangeD / 2 },
                direction: { x: 1, y: 0 },
                tooltip: `Bilyalı Somunu Kaydır (${nutPos} mm)`,
                tooltipTr: `Bilyalı Somunu Kaydır (${nutPos} mm)`
            },
            {
                id: 'grip_sfu_vis',
                type: 'visibility',
                paramId: 'viewMode',
                position: { x: basePoint.x - 15, y: basePoint.y - spec.flangeD / 2 },
                tooltip: 'Görünüş Değiştir (Boyuna Kesit / Somun Alın Flanş / Dış Görünüş)',
                tooltipTr: 'Görünüş Değiştir (Boyuna Kesit / Somun Alın Flanş / Dış Görünüş)'
            }
        ];
    }
};
