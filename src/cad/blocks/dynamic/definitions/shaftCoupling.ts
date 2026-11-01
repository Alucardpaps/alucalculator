/**
 * 🔗 Dynamic Flexible Jaw Shaft Coupling (DIN 740 / KTR ROTEX Series)
 *
 * - Lookup Catalog: ROTEX 19, 24, 28, 38, 42, 48, 55, 65, 75, 90 Flexible Jaw Couplings
 * - Linear Params: Left Shaft Bore d1 (mm), Right Shaft Bore d2 (mm)
 * - Visibility States:
 *    - Axial Cross-Section (Boyuna Kesit — Sol/Sağ Göbek, Poliüretan Yıldız Kaplin Lastiği, Kama Kanalı ve ISO 128 Tarama)
 *    - Radial Spider View (Ön Görünüş — Çene Dişleri, Yıldız Elastomer ve DIN 6885 Kama Yuvası)
 *    - Exterior Side View (Dış Yan Görünüş — Montaj Boşluğu E ve Göbek Uzunlukları)
 * - 3D Solids: Left jaw hub + Polyurethane T-PUR spider insert + Right jaw hub
 */

import {
    CadEntity,
    createLineEntity,
    createRectangleEntity,
    createCircleEntity,
    createHatchEntity
} from '../../../kernel/types';
import { DynamicBlockDef, DynamicGrip, DynamicPart3DDef } from '../types';

export interface JawCouplingCatalogSpec {
    code: string;
    size: number;
    outerD: number;    // Outer diameter DH (mm)
    hubD: number;      // Hub boss diameter dH (mm)
    totalL: number;    // Total assembled length L (mm)
    hubL: number;      // Single hub length l1=l2 (mm)
    gapE: number;      // Spider axial length E (mm)
    defaultBore: number;
    maxBore: number;
    torqueNomNm: number; // Nominal torque TKN (98 ShA)
}

export const ROTEX_COUPLING_CATALOG: Record<string, JawCouplingCatalogSpec> = {
    ROTEX_19: { code: 'ROTEX_19', size: 19, outerD: 40,  hubD: 40,  totalL: 66,  hubL: 25, gapE: 16, defaultBore: 14, maxBore: 20, torqueNomNm: 17 },
    ROTEX_24: { code: 'ROTEX_24', size: 24, outerD: 55,  hubD: 55,  totalL: 78,  hubL: 30, gapE: 18, defaultBore: 19, maxBore: 28, torqueNomNm: 60 },
    ROTEX_28: { code: 'ROTEX_28', size: 28, outerD: 65,  hubD: 65,  totalL: 90,  hubL: 35, gapE: 20, defaultBore: 24, maxBore: 38, torqueNomNm: 160 },
    ROTEX_38: { code: 'ROTEX_38', size: 38, outerD: 80,  hubD: 66,  totalL: 114, hubL: 45, gapE: 24, defaultBore: 28, maxBore: 45, torqueNomNm: 325 },
    ROTEX_42: { code: 'ROTEX_42', size: 42, outerD: 95,  hubD: 75,  totalL: 126, hubL: 50, gapE: 26, defaultBore: 32, maxBore: 55, torqueNomNm: 450 },
    ROTEX_48: { code: 'ROTEX_48', size: 48, outerD: 105, hubD: 85,  totalL: 140, hubL: 56, gapE: 28, defaultBore: 38, maxBore: 60, torqueNomNm: 525 },
    ROTEX_55: { code: 'ROTEX_55', size: 55, outerD: 120, hubD: 98,  totalL: 160, hubL: 65, gapE: 30, defaultBore: 45, maxBore: 70, torqueNomNm: 685 },
    ROTEX_65: { code: 'ROTEX_65', size: 65, outerD: 135, hubD: 115, totalL: 185, hubL: 75, gapE: 35, defaultBore: 55, maxBore: 75, torqueNomNm: 940 },
    ROTEX_75: { code: 'ROTEX_75', size: 75, outerD: 160, hubD: 135, totalL: 210, hubL: 85, gapE: 40, defaultBore: 65, maxBore: 90, torqueNomNm: 1920 }
};

export const DYN_SHAFT_COUPLING: DynamicBlockDef = {
    id: 'dyn_shaft_coupling',
    name: 'Flexible Jaw Shaft Coupling (DIN 740 / KTR ROTEX)',
    nameTr: 'Dinamik Elastik Yıldız Kaplin (DIN 740 / ROTEX)',
    category: 'Mechanical',
    subcategory: 'Bearings & Power Transmission',
    subcategoryTr: 'Rulman ve Güç Aktarım Elemanları',
    description: 'DIN 740 / KTR ROTEX flexible jaw shaft coupling with independent d1/d2 bores, DIN 6885 keyways, polyurethane spider insert, and ISO 128 section hatches.',
    descriptionTr: 'DIN 740 ve ROTEX standartlarında bağımsız d1/d2 mil delik çaplı, DIN 6885 kama kanallı ve elastomer yıldızlı esnek mil kaplini.',
    icon: '🔗',
    calculatorRoute: '/shaft/',
    calculatorModuleType: 'shaft',
    calculatorLabelTr: 'Mil Tork ve Kama Mukavemet Hesabına Git (DIN 743)',
    citation: {
        tier: 1,
        standard: 'DIN 740-1 / DIN 6885-1 / KTR ROTEX Standard',
        clause: 'Flexible shaft couplings — Dimensions, nominal torques & parallel keyways',
        description: 'Standard jaw coupling envelope DH, total length L, spider gap E, and keyway proportions.'
    },
    linearParams: [
        {
            id: 'boreD1',
            name: 'boreD1',
            label: 'Left Shaft Bore (d1)',
            labelTr: 'Sol Mil Delik Çapı (d1)',
            min: 10,
            max: 90,
            step: 2,
            default: 28,
            unit: 'mm',
            axis: 'y'
        },
        {
            id: 'boreD2',
            name: 'boreD2',
            label: 'Right Shaft Bore (d2)',
            labelTr: 'Sağ Mil Delik Çapı (d2)',
            min: 10,
            max: 90,
            step: 2,
            default: 28,
            unit: 'mm',
            axis: 'y'
        }
    ],
    flipParams: [],
    visibilityParam: {
        id: 'viewMode',
        name: 'viewMode',
        label: 'Projection View Mode',
        labelTr: 'Görünüş / Kesit Tipi',
        states: [
            { id: 'axial_section', label: 'Axial Cross-Section (Boyuna Kesit — Göbek & Elastomer)', labelTr: 'Boyuna Kesit (Göbek & Yıldız Tarama)' },
            { id: 'radial_spider', label: 'Radial Spider & Keyway View (Ön Görünüş)', labelTr: 'Ön Görünüş (Yıldız Dişler & Kama Yuvası)' },
            { id: 'exterior_side', label: 'Exterior Side View (Dış Yan Görünüş)', labelTr: 'Dış Yan Görünüş' }
        ],
        default: 'axial_section'
    },
    lookupParams: [
        {
            id: 'couplingSize',
            name: 'couplingSize',
            label: 'ROTEX / DIN 740 Coupling Size',
            labelTr: 'ROTEX Kaplin Anma Boyutu',
            options: Object.values(ROTEX_COUPLING_CATALOG).map((c) => ({
                id: c.code,
                label: `ROTEX ${c.size} (Ø${c.outerD}x${c.totalL} mm — T_nom=${c.torqueNomNm} Nm, Max Ø${c.maxBore} mm)`,
                standard: 'DIN 740',
                values: { couplingSize: c.code, boreD1: c.defaultBore, boreD2: c.defaultBore }
            })),
            default: 'ROTEX_38'
        }
    ],
    defaultValues: {
        couplingSize: 'ROTEX_38',
        boreD1: 28,
        boreD2: 28,
        viewMode: 'axial_section'
    },
    generate2D: (params, basePoint = { x: 0, y: 0 }) => {
        const sizeKey = String(params.couplingSize || 'ROTEX_38');
        const spec = ROTEX_COUPLING_CATALOG[sizeKey] || ROTEX_COUPLING_CATALOG.ROTEX_38;
        const d1 = Math.min(spec.maxBore, Math.max(8, Number(params.boreD1) || spec.defaultBore));
        const d2 = Math.min(spec.maxBore, Math.max(8, Number(params.boreD2) || spec.defaultBore));
        const viewMode = String(params.viewMode || 'axial_section');

        const { outerD, hubD, totalL, hubL, gapE } = spec;
        const entities: CadEntity[] = [];
        const layerHub = 'layer-mech';
        const layerSpider = 'layer-accent';
        const layerRef = 'layer-ref';

        if (viewMode === 'radial_spider') {
            // Radial End View with Spider Teeth & DIN 6885 Keyway
            const cx = basePoint.x + outerD / 2;
            const cy = basePoint.y;
            entities.push(
                createLineEntity({ x: cx - outerD * 0.6, y: cy }, { x: cx + outerD * 0.6, y: cy }, layerRef, '#ef4444'),
                createLineEntity({ x: cx, y: cy - outerD * 0.6 }, { x: cx, y: cy + outerD * 0.6 }, layerRef, '#ef4444'),
                createCircleEntity({ x: cx, y: cy }, outerD / 2, layerHub, '#38bdf8'),
                createCircleEntity({ x: cx, y: cy }, hubD / 2, layerHub, '#94a3b8'),
                createCircleEntity({ x: cx, y: cy }, d1 / 2, layerHub, '#f8fafc')
            );
            // DIN 6885 Keyway at top of bore d1
            const keyW = Math.max(4, Math.round(d1 * 0.28));
            const keyH = Math.max(2, Math.round(keyW * 0.45));
            entities.push(
                createRectangleEntity({ x: cx, y: cy + d1 / 2 + keyH / 2 - 0.5 }, keyW, keyH, layerSpider, '#f59e0b')
            );
            // 6 Spider Elastomer Lobes around pitch circle
            const lobePitchR = (outerD * 0.48 + d1 * 0.65) / 2;
            const lobeR = (outerD - d1) * 0.11;
            for (let i = 0; i < 6; i++) {
                const ang = (i * Math.PI) / 3;
                entities.push(
                    createCircleEntity(
                        { x: cx + lobePitchR * Math.cos(ang), y: cy + lobePitchR * Math.sin(ang) },
                        lobeR,
                        layerSpider,
                        '#ec4899'
                    )
                );
            }
            return entities;
        }

        // Centerline
        entities.push(
            createLineEntity(
                { x: basePoint.x - 20, y: basePoint.y },
                { x: basePoint.x + totalL + 20, y: basePoint.y },
                layerRef,
                '#ef4444'
            )
        );

        const collarLen = hubL - gapE * 0.45;
        const jawStartL = basePoint.x + collarLen;
        const jawEndR = basePoint.x + totalL - collarLen;
        const jawZoneLen = jawEndR - jawStartL;

        // Left Hub Boss + Jaw Flange + Spider + Right Hub Boss
        entities.push(
            // Left Hub Collar
            createRectangleEntity(
                { x: basePoint.x + collarLen / 2, y: basePoint.y },
                collarLen,
                hubD,
                layerHub,
                '#38bdf8'
            ),
            // Center Jaw & Elastomer Ring (Outer Diameter DH)
            createRectangleEntity(
                { x: jawStartL + jawZoneLen / 2, y: basePoint.y },
                jawZoneLen,
                outerD,
                layerHub,
                '#38bdf8'
            ),
            // Elastomer Spider Band in the middle (Gap E)
            createRectangleEntity(
                { x: basePoint.x + totalL / 2, y: basePoint.y },
                gapE,
                outerD,
                layerSpider,
                '#ec4899'
            ),
            // Right Hub Collar
            createRectangleEntity(
                { x: basePoint.x + totalL - collarLen / 2, y: basePoint.y },
                collarLen,
                hubD,
                layerHub,
                '#38bdf8'
            )
        );

        if (viewMode === 'exterior_side') {
            return entities;
        }

        // AXIAL CROSS-SECTION VIEW (Default)
        // Left Bore d1 & Right Bore d2 lines
        entities.push(
            createLineEntity({ x: basePoint.x, y: basePoint.y + d1 / 2 }, { x: basePoint.x + hubL, y: basePoint.y + d1 / 2 }, layerHub, '#f8fafc'),
            createLineEntity({ x: basePoint.x, y: basePoint.y - d1 / 2 }, { x: basePoint.x + hubL, y: basePoint.y - d1 / 2 }, layerHub, '#f8fafc'),
            createLineEntity({ x: basePoint.x + totalL - hubL, y: basePoint.y + d2 / 2 }, { x: basePoint.x + totalL, y: basePoint.y + d2 / 2 }, layerHub, '#f8fafc'),
            createLineEntity({ x: basePoint.x + totalL - hubL, y: basePoint.y - d2 / 2 }, { x: basePoint.x + totalL, y: basePoint.y - d2 / 2 }, layerHub, '#f8fafc')
        );

        // Left Hub Section Hatch (ANSI31)
        entities.push(
            createHatchEntity([
                { x: basePoint.x, y: basePoint.y + d1 / 2 },
                { x: basePoint.x + collarLen, y: basePoint.y + d1 / 2 },
                { x: basePoint.x + collarLen, y: basePoint.y + hubD / 2 },
                { x: basePoint.x, y: basePoint.y + hubD / 2 }
            ], 'ANSI31', layerHub, '#0284c7'),
            createHatchEntity([
                { x: basePoint.x, y: basePoint.y - hubD / 2 },
                { x: basePoint.x + collarLen, y: basePoint.y - hubD / 2 },
                { x: basePoint.x + collarLen, y: basePoint.y - d1 / 2 },
                { x: basePoint.x, y: basePoint.y - d1 / 2 }
            ], 'ANSI31', layerHub, '#0284c7')
        );

        // Center Elastomer Spider Hatch (CROSS)
        entities.push(
            createHatchEntity([
                { x: basePoint.x + totalL / 2 - gapE / 2, y: basePoint.y + Math.max(d1, d2) * 0.55 },
                { x: basePoint.x + totalL / 2 + gapE / 2, y: basePoint.y + Math.max(d1, d2) * 0.55 },
                { x: basePoint.x + totalL / 2 + gapE / 2, y: basePoint.y + outerD / 2 },
                { x: basePoint.x + totalL / 2 - gapE / 2, y: basePoint.y + outerD / 2 }
            ], 'CROSS', layerSpider, '#db2777'),
            createHatchEntity([
                { x: basePoint.x + totalL / 2 - gapE / 2, y: basePoint.y - outerD / 2 },
                { x: basePoint.x + totalL / 2 + gapE / 2, y: basePoint.y - outerD / 2 },
                { x: basePoint.x + totalL / 2 + gapE / 2, y: basePoint.y - Math.max(d1, d2) * 0.55 },
                { x: basePoint.x + totalL / 2 - gapE / 2, y: basePoint.y - Math.max(d1, d2) * 0.55 }
            ], 'CROSS', layerSpider, '#db2777')
        );

        // Right Hub Section Hatch (ANSI31)
        entities.push(
            createHatchEntity([
                { x: basePoint.x + totalL - collarLen, y: basePoint.y + d2 / 2 },
                { x: basePoint.x + totalL, y: basePoint.y + d2 / 2 },
                { x: basePoint.x + totalL, y: basePoint.y + hubD / 2 },
                { x: basePoint.x + totalL - collarLen, y: basePoint.y + hubD / 2 }
            ], 'ANSI31', layerHub, '#0284c7'),
            createHatchEntity([
                { x: basePoint.x + totalL - collarLen, y: basePoint.y - hubD / 2 },
                { x: basePoint.x + totalL, y: basePoint.y - hubD / 2 },
                { x: basePoint.x + totalL, y: basePoint.y - d2 / 2 },
                { x: basePoint.x + totalL - collarLen, y: basePoint.y - d2 / 2 }
            ], 'ANSI31', layerHub, '#0284c7')
        );

        return entities;
    },
    generate3D: (params, basePos = { x: 0, y: 0, z: 0 }) => {
        const sizeKey = String(params.couplingSize || 'ROTEX_38');
        const spec = ROTEX_COUPLING_CATALOG[sizeKey] || ROTEX_COUPLING_CATALOG.ROTEX_38;
        const d1 = Math.min(spec.maxBore, Math.max(8, Number(params.boreD1) || spec.defaultBore));
        const d2 = Math.min(spec.maxBore, Math.max(8, Number(params.boreD2) || spec.defaultBore));
        const { outerD, totalL, hubL, gapE } = spec;

        const parts: DynamicPart3DDef[] = [
            // Left Steel Jaw Hub
            {
                id: `rotex_hub_l_${Date.now()}`,
                name: `ROTEX ${spec.size} Sol Kaplin Göbeği (Ød1=${d1}mm)`,
                kind: 'tube',
                color: '#64748b',
                position: { x: basePos.x + (totalL - gapE) / 4, y: basePos.y, z: basePos.z },
                rotation: { x: 0, y: 90, z: 0 },
                params: { diameter: outerD, wall: (outerD - d1) / 2, length: (totalL - gapE) / 2 },
                designStandard: 'DIN 740'
            },
            // Polyurethane T-PUR Elastomer Spider
            {
                id: `rotex_spider_${Date.now()}`,
                name: `ROTEX ${spec.size} T-PUR Elastomer Kaplin Yıldızı`,
                kind: 'tube',
                color: '#db2777',
                position: { x: basePos.x + totalL / 2, y: basePos.y, z: basePos.z },
                rotation: { x: 0, y: 90, z: 0 },
                params: { diameter: outerD * 0.98, wall: (outerD * 0.98 - Math.max(d1, d2) * 1.1) / 2, length: gapE },
                designStandard: 'DIN 740'
            },
            // Right Steel Jaw Hub
            {
                id: `rotex_hub_r_${Date.now()}`,
                name: `ROTEX ${spec.size} Sağ Kaplin Göbeği (Ød2=${d2}mm)`,
                kind: 'tube',
                color: '#64748b',
                position: { x: basePos.x + totalL - (totalL - gapE) / 4, y: basePos.y, z: basePos.z },
                rotation: { x: 0, y: 90, z: 0 },
                params: { diameter: outerD, wall: (outerD - d2) / 2, length: (totalL - gapE) / 2 },
                designStandard: 'DIN 740'
            }
        ];
        void hubL;
        return parts;
    },
    getGrips: (params, basePoint = { x: 0, y: 0 }) => {
        const sizeKey = String(params.couplingSize || 'ROTEX_38');
        const spec = ROTEX_COUPLING_CATALOG[sizeKey] || ROTEX_COUPLING_CATALOG.ROTEX_38;

        return [
            {
                id: 'grip_rotex_lookup',
                type: 'lookup',
                paramId: 'couplingSize',
                position: { x: basePoint.x + spec.totalL / 2, y: basePoint.y + spec.outerD / 2 + 12 },
                tooltip: `Kaplin Boyutu Seç (ROTEX ${spec.size} — ${spec.torqueNomNm} Nm)`,
                tooltipTr: `Kaplin Boyutu Seç (ROTEX ${spec.size} — ${spec.torqueNomNm} Nm)`
            },
            {
                id: 'grip_rotex_vis',
                type: 'visibility',
                paramId: 'viewMode',
                position: { x: basePoint.x - 15, y: basePoint.y - spec.outerD / 2 },
                tooltip: 'Görünüş Değiştir (Boyuna Kesit / Ön Yıldız Görünüş / Dış Görünüş)',
                tooltipTr: 'Görünüş Değiştir (Boyuna Kesit / Ön Yıldız Görünüş / Dış Görünüş)'
            }
        ];
    }
};
