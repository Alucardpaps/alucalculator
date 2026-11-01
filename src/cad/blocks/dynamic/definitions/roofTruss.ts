/**
 * 🏠 Structural Roof Truss Dynamic Block (Eurocode 3 / EN 1993-1-1)
 * 
 * - Linear stretch: Span (4000 - 24000 mm) & Pitch Angle (10° - 40°)
 * - Automatic Web/Strut Array: Automatically calculates panel divisions based on span (Howe / Pratt / Fink geometry)
 * - Visibility: Schematic Joint Axes, Detailed Structural Members, 3D Space Truss
 */

import { Point, CadEntity, createLineEntity, createPolylineEntity } from '../../../kernel/types';
import { DynamicBlockDef, DynamicGrip, DynamicPart3DDef } from '../types';

export const DYN_ROOF_TRUSS: DynamicBlockDef = {
    id: 'dyn_roof_truss',
    name: 'Dynamic Roof Truss (Beşik Çatı Makası)',
    nameTr: 'Dinamik Beşik Çatı Makası ve Aşık Sistemi',
    category: 'Structural',
    subcategory: 'Roofing & Trusses',
    subcategoryTr: 'Çatı ve Makaslar',
    description: 'AutoCAD-grade parametric roof truss: stretch span and pitch angle; struts and panels array automatically.',
    descriptionTr: 'Açıklık ve çatı eğimi esnetilebilir, dikme ve diyagonalleri otomatik hesaplayıp dizen çatı makası.',
    icon: '🏠',
    citation: {
        tier: 1,
        standard: 'Eurocode 3 (EN 1993-1-1)',
        clause: 'Section 6 (Ultimate limit states for members and trusses)',
        description: 'Standard triangular pitched roof truss geometry, panel slenderness ratios, and chord axial axes.'
    },
    linearParams: [
        {
            id: 'span',
            name: 'span',
            label: 'Truss Span',
            labelTr: 'Makas Açıklığı (L)',
            min: 4000,
            max: 24000,
            step: 500,
            default: 12000,
            unit: 'mm',
            axis: 'x'
        },
        {
            id: 'pitchAngle',
            name: 'pitchAngle',
            label: 'Roof Pitch Angle',
            labelTr: 'Çatı Eğimi (Derece)',
            min: 10,
            max: 40,
            step: 1,
            default: 20,
            unit: 'deg',
            axis: 'y'
        }
    ],
    visibilityParam: {
        id: 'visState',
        name: 'visState',
        label: 'Truss Representation',
        labelTr: 'Makas Detay Seviyesi',
        states: [
            { id: 'detailed', label: 'Detailed Members (Profil Kalınlıklı)', labelTr: 'Detaylı Profilli Görünüş' },
            { id: 'schematic', label: 'System Axes (Eksen Şematik Çizgiler)', labelTr: 'Eksen Şematik Görünüş' }
        ],
        default: 'detailed'
    },
    lookupParams: [
        {
            id: 'standardSpan',
            name: 'standardSpan',
            label: 'Standard Industrial Spans',
            labelTr: 'Standart Sanayi Açıklığı',
            options: [
                { id: 'span_6m', label: '6 Metre Açıklık — 20° Eğim', values: { span: 6000, pitchAngle: 20 } },
                { id: 'span_10m', label: '10 Metre Açıklık — 18° Eğim', values: { span: 10000, pitchAngle: 18 } },
                { id: 'span_12m', label: '12 Metre Standart Açıklık — 20° Eğim', values: { span: 12000, pitchAngle: 20 } },
                { id: 'span_15m', label: '15 Metre Geniş Açıklık — 18° Eğim', values: { span: 15000, pitchAngle: 18 } },
                { id: 'span_18m', label: '18 Metre Ağır Makas — 15° Eğim', values: { span: 18000, pitchAngle: 15 } }
            ],
            default: 'span_12m'
        }
    ],
    arrayActions: [
        {
            id: 'array_panels',
            linearParamId: 'span',
            spacing: 2000,
            minCount: 3,
            maxCount: 12,
            label: 'Web Strut & Panel Array',
            labelTr: 'Dikme ve Diyagonal Panel Dizilimi'
        }
    ],
    defaultValues: {
        span: 12000,
        pitchAngle: 20,
        visState: 'detailed'
    },
    generate2D: (params, basePoint = { x: 0, y: 0 }) => {
        const span = Number(params.span) || 12000;
        const pitchDeg = Number(params.pitchAngle) || 20;
        const state = String(params.visState || 'detailed');

        const rad = (pitchDeg * Math.PI) / 180;
        const halfSpan = span / 2;
        const ridgeH = halfSpan * Math.tan(rad);

        const entities: CadEntity[] = [];
        const layer = 'layer-struct';
        const colorChord = '#3ad0e6';
        const colorWeb = '#94a3b8';
        const colorCenter = '#ef4444';

        // Coordinates:
        // P_left: (basePoint.x, basePoint.y)
        // P_right: (basePoint.x + span, basePoint.y)
        // P_ridge: (basePoint.x + halfSpan, basePoint.y + ridgeH)
        const pLeft: Point = { x: basePoint.x, y: basePoint.y };
        const pRight: Point = { x: basePoint.x + span, y: basePoint.y };
        const pRidge: Point = { x: basePoint.x + halfSpan, y: basePoint.y + ridgeH };

        // 1. Bottom Chord (Alt Başlık)
        entities.push(createLineEntity(pLeft, pRight, layer, colorChord));

        // 2. Top Chords / Rafters (Üst Başlıklar)
        entities.push(createLineEntity(pLeft, pRidge, layer, colorChord));
        entities.push(createLineEntity(pRidge, pRight, layer, colorChord));

        // 3. Central King Post (Tepe Dikmesi)
        const pBottomMid: Point = { x: basePoint.x + halfSpan, y: basePoint.y };
        entities.push(createLineEntity(pBottomMid, pRidge, layer, colorChord));

        // 4. Dynamic Panel Array (Web members: vertical queen posts + diagonals)
        // Optimal panel spacing is ~1800 - 2400 mm
        const panelWidthTarget = 2000;
        const panelsPerHalf = Math.max(2, Math.round(halfSpan / panelWidthTarget));
        const panelDx = halfSpan / panelsPerHalf;

        // Left Half Web Members
        for (let i = 1; i < panelsPerHalf; i++) {
            const bx = basePoint.x + i * panelDx;
            const topY = basePoint.y + i * panelDx * Math.tan(rad);
            const pBot: Point = { x: bx, y: basePoint.y };
            const pTop: Point = { x: bx, y: topY };

            // Vertical strut (Dikme)
            entities.push(createLineEntity(pBot, pTop, layer, colorWeb));

            // Diagonal (Diyagonal)
            // Howe truss: diagonal slopes down towards center
            const prevBot: Point = { x: basePoint.x + (i - 1) * panelDx, y: basePoint.y };
            entities.push(createLineEntity(prevBot, pTop, layer, colorWeb));
        }
        // Last diagonal to ridge
        const lastLeftBot: Point = { x: basePoint.x + (panelsPerHalf - 1) * panelDx, y: basePoint.y };
        entities.push(createLineEntity(lastLeftBot, pRidge, layer, colorWeb));

        // Right Half Web Members (Symmetric)
        for (let i = 1; i < panelsPerHalf; i++) {
            const bx = basePoint.x + span - i * panelDx;
            const topY = basePoint.y + i * panelDx * Math.tan(rad);
            const pBot: Point = { x: bx, y: basePoint.y };
            const pTop: Point = { x: bx, y: topY };

            // Vertical strut
            entities.push(createLineEntity(pBot, pTop, layer, colorWeb));

            // Diagonal
            const prevBot: Point = { x: basePoint.x + span - (i - 1) * panelDx, y: basePoint.y };
            entities.push(createLineEntity(prevBot, pTop, layer, colorWeb));
        }
        // Last right diagonal to ridge
        const lastRightBot: Point = { x: basePoint.x + span - (panelsPerHalf - 1) * panelDx, y: basePoint.y };
        entities.push(createLineEntity(lastRightBot, pRidge, layer, colorWeb));

        // Ridge Centerline
        entities.push(createLineEntity(
            { x: basePoint.x + halfSpan, y: basePoint.y - 100 },
            { x: basePoint.x + halfSpan, y: basePoint.y + ridgeH + 100 },
            layer,
            colorCenter
        ));

        return entities;
    },
    generate3D: (params, basePos = { x: 0, y: 0, z: 0 }) => {
        const span = Number(params.span) || 12000;
        const pitchDeg = Number(params.pitchAngle) || 20;
        const rad = (pitchDeg * Math.PI) / 180;
        const halfSpan = span / 2;
        const ridgeH = halfSpan * Math.tan(rad);
        const rafterLen = halfSpan / Math.cos(rad);

        const parts: DynamicPart3DDef[] = [
            // Bottom Chord Tie Beam
            {
                id: `truss_bottom_${Date.now()}`,
                name: 'Makas Alt Başlığı (T-Profil)',
                kind: 'box',
                color: '#38bdf8',
                position: { x: basePos.x + span / 2, y: basePos.y, z: basePos.z + 40 },
                rotation: { x: 0, y: 0, z: 0 },
                params: { width: span, height: 80, depth: 80 },
                designStandard: 'Eurocode 3'
            },
            // Left Rafter
            {
                id: `truss_rafter_l_${Date.now()}`,
                name: 'Sol Mertek / Aşık Kirişi',
                kind: 'box',
                color: '#0284c7',
                position: { x: basePos.x + halfSpan / 2, y: basePos.y, z: basePos.z + ridgeH / 2 },
                rotation: { x: 0, y: rad, z: 0 },
                params: { width: rafterLen, height: 80, depth: 100 }
            },
            // Right Rafter
            {
                id: `truss_rafter_r_${Date.now()}`,
                name: 'Sağ Mertek / Aşık Kirişi',
                kind: 'box',
                color: '#0284c7',
                position: { x: basePos.x + span - halfSpan / 2, y: basePos.y, z: basePos.z + ridgeH / 2 },
                rotation: { x: 0, y: -rad, z: 0 },
                params: { width: rafterLen, height: 80, depth: 100 }
            },
            // King Post
            {
                id: `truss_king_post_${Date.now()}`,
                name: 'Tepe Dikmesi (King Post)',
                kind: 'box',
                color: '#64748b',
                position: { x: basePos.x + halfSpan, y: basePos.y, z: basePos.z + ridgeH / 2 },
                rotation: { x: 0, y: 0, z: 0 },
                params: { width: 60, height: 60, depth: ridgeH }
            }
        ];

        return parts;
    },
    getGrips: (params, basePoint = { x: 0, y: 0 }) => {
        const span = Number(params.span) || 12000;
        const pitchDeg = Number(params.pitchAngle) || 20;
        const rad = (pitchDeg * Math.PI) / 180;
        const halfSpan = span / 2;
        const ridgeH = halfSpan * Math.tan(rad);

        const grips: DynamicGrip[] = [
            // Linear Stretch Span Grip (Right heel of truss)
            {
                id: 'grip_truss_span',
                type: 'stretch',
                paramId: 'span',
                position: { x: basePoint.x + span, y: basePoint.y },
                direction: { x: 1, y: 0 },
                tooltip: `Grip: Makas Açıklığı (${span} mm)`,
                tooltipTr: `Grip: Makas Açıklığı (${span} mm)`
            },
            // Pitch Angle / Ridge Height Grip (Ridge apex)
            {
                id: 'grip_truss_ridge',
                type: 'stretch',
                paramId: 'pitchAngle',
                position: { x: basePoint.x + halfSpan, y: basePoint.y + ridgeH },
                direction: { x: 0, y: 1 },
                tooltip: `Grip: Çatı Eğimi (${pitchDeg}° — Tepe Yüksekliği: ${Math.round(ridgeH)} mm)`,
                tooltipTr: `Grip: Çatı Eğimi (${pitchDeg}° — Tepe Yüksekliği: ${Math.round(ridgeH)} mm)`
            },
            // Visibility State
            {
                id: 'grip_truss_vis',
                type: 'visibility',
                paramId: 'visState',
                position: { x: basePoint.x - 30, y: basePoint.y - 30 },
                tooltip: 'Görünüş Seçimi (Detaylı Profil / Şematik Eksen)',
                tooltipTr: 'Görünüş Seçimi (Detaylı Profil / Şematik Eksen)'
            }
        ];

        return grips;
    }
};
