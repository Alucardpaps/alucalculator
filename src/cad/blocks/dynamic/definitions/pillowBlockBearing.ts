/**
 * 🧱 Dynamic Cast Iron Pillow Block Bearing Unit (ISO 3228 / JIS B 1559 / SKF UCP / SY Series)
 *
 * - Lookup Catalog: UCP204 (Ø20) through UCP212 (Ø60) Self-Aligning Pillow Block Units
 * - Linear Params: Shaft Bore (d), Base Length (L), Center Height (H)
 * - Visibility States:
 *    - Front View (Ön Görünüş — Döküm Gövde, Küresel Rulman, Gresörlük ve Taban Ayakları)
 *    - Axial Cross-Section (Yan Kesit — Küresel Yatak, Yaka Tespit Vidası ve ISO 128 Dökme Demir Tarama)
 *    - Top Base View (Üst Plan — Ankraj Cıvata Slotları ve Mil Ekseni)
 * - 3D Solids: Cast iron pedestal base + spherical outer housing ring + extended inner bearing ring
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

export interface PillowBlockCatalogSpec {
    code: string;
    d: number;      // Shaft diameter (mm)
    H: number;      // Shaft center height from base (mm)
    L: number;      // Total base length (mm)
    J: number;      // Bolt hole center distance (mm)
    A: number;      // Base width / thickness (mm)
    N: number;      // Bolt slot width (mm)
    N1: number;     // Bolt slot length (mm)
    H1: number;     // Base foot height (mm)
    H2: number;     // Overall total height (mm)
    Bi: number;     // Inner ring total width (mm)
    boltSize: string;
    dynC_kN: number;
}

export const UCP_PILLOW_CATALOG: Record<string, PillowBlockCatalogSpec> = {
    UCP204: { code: 'UCP204', d: 20, H: 33.3, L: 127, J: 95,  A: 38, N: 13, N1: 19, H1: 14, H2: 65,  Bi: 31.0, boltSize: 'M10', dynC_kN: 12.8 },
    UCP205: { code: 'UCP205', d: 25, H: 36.5, L: 140, J: 105, A: 38, N: 13, N1: 19, H1: 15, H2: 71,  Bi: 34.1, boltSize: 'M10', dynC_kN: 14.0 },
    UCP206: { code: 'UCP206', d: 30, H: 42.9, L: 165, J: 121, A: 48, N: 17, N1: 21, H1: 17, H2: 83,  Bi: 38.1, boltSize: 'M14', dynC_kN: 19.5 },
    UCP207: { code: 'UCP207', d: 35, H: 47.6, L: 167, J: 127, A: 48, N: 17, N1: 21, H1: 18, H2: 93,  Bi: 42.9, boltSize: 'M14', dynC_kN: 25.7 },
    UCP208: { code: 'UCP208', d: 40, H: 49.2, L: 184, J: 137, A: 54, N: 17, N1: 21, H1: 18, H2: 98,  Bi: 49.2, boltSize: 'M14', dynC_kN: 29.6 },
    UCP209: { code: 'UCP209', d: 45, H: 54.0, L: 190, J: 146, A: 54, N: 17, N1: 21, H1: 20, H2: 106, Bi: 49.2, boltSize: 'M14', dynC_kN: 32.5 },
    UCP210: { code: 'UCP210', d: 50, H: 57.2, L: 206, J: 159, A: 60, N: 20, N1: 22, H1: 21, H2: 114, Bi: 51.6, boltSize: 'M16', dynC_kN: 35.1 },
    UCP212: { code: 'UCP212', d: 60, H: 69.8, L: 241, J: 184, A: 70, N: 20, N1: 25, H1: 25, H2: 138, Bi: 65.1, boltSize: 'M16', dynC_kN: 52.7 }
};

export const DYN_PILLOW_BLOCK: DynamicBlockDef = {
    id: 'dyn_pillow_block',
    name: 'Pillow Block Bearing Unit (ISO 3228 / SKF UCP Series)',
    nameTr: 'Dinamik Yataklı Rulman Ünitesi (UCP / SY — ISO 3228)',
    category: 'Mechanical',
    subcategory: 'Bearings & Power Transmission',
    subcategoryTr: 'Rulman ve Yataklama Sistemleri',
    description: 'ISO 3228 / JIS B 1559 cast iron pillow block bearing housing (UCP204–UCP212) with self-aligning insert bearing, grease nipple, front/section/top views.',
    descriptionTr: 'ISO 3228 normunda UCP204–UCP212 döküm gövdeli ayaklı yataklı rulman ünitesi; ön görünüş, eksenel kesit ve üst bağlantı slot görünüşü.',
    icon: '🧱',
    calculatorRoute: '/bearings/',
    calculatorModuleType: 'bearings',
    calculatorLabelTr: 'Yataklı Rulman Ömür ve Yük Hesabına Git (ISO 281)',
    citation: {
        tier: 1,
        standard: 'ISO 3228:2013 / JIS B 1559 / SKF Y-Bearing Plummer Block Units',
        clause: 'Cast or pressed housings for insert bearings — Boundary dimensions',
        description: 'Standard shaft center height H, base length L, bolt hole spacing J, and UC insert bearing widths Bi.'
    },
    linearParams: [],
    flipParams: [],
    visibilityParam: {
        id: 'viewMode',
        name: 'viewMode',
        label: 'Projection View Mode',
        labelTr: 'Görünüş / Kesit Tipi',
        states: [
            { id: 'front_view', label: 'Front Elevation View (Ön Görünüş — Mil Karşıdan)', labelTr: 'Ön Görünüş (Döküm Gövde & Rulman)' },
            { id: 'side_section', label: 'Axial Cross-Section (Yan Kesit — ISO 128 Tarama)', labelTr: 'Yan Kesit (Küresel Yatak & Gres Kanalı)' },
            { id: 'top_plan', label: 'Top Base View (Üst Görünüş — Cıvata Slotları)', labelTr: 'Üst Görünüş (Ankraj Cıvata Slotları)' }
        ],
        default: 'front_view'
    },
    lookupParams: [
        {
            id: 'ucpModel',
            name: 'ucpModel',
            label: 'UCP / SY Housing Model',
            labelTr: 'Standart UCP Yataklı Rulman Modeli',
            options: Object.values(UCP_PILLOW_CATALOG).map((u) => ({
                id: u.code,
                label: `${u.code} (Mil Ø${u.d}mm — H=${u.H}mm, L=${u.L}mm, J=${u.J}mm, Cıvata: ${u.boltSize})`,
                standard: 'ISO 3228',
                values: { ucpModel: u.code }
            })),
            default: 'UCP206'
        }
    ],
    defaultValues: {
        ucpModel: 'UCP206',
        viewMode: 'front_view'
    },
    generate2D: (params, basePoint = { x: 0, y: 0 }) => {
        const modelKey = String(params.ucpModel || 'UCP206');
        const spec = UCP_PILLOW_CATALOG[modelKey] || UCP_PILLOW_CATALOG.UCP206;
        const viewMode = String(params.viewMode || 'front_view');

        const { d, H, L, J, A, N, N1, H1, H2, Bi } = spec;
        const entities: CadEntity[] = [];
        const layerHousing = 'layer-mech';
        const layerBearing = 'layer-accent';
        const layerRef = 'layer-ref';

        const cx = basePoint.x;
        const cy = basePoint.y; // Base bottom at y = basePoint.y

        if (viewMode === 'top_plan') {
            // Top Plan View centered at (cx, cy)
            entities.push(
                createLineEntity({ x: cx - L / 2 - 12, y: cy }, { x: cx + L / 2 + 12, y: cy }, layerRef, '#ef4444'),
                createLineEntity({ x: cx, y: cy - A / 2 - 12 }, { x: cx, y: cy + A / 2 + 12 }, layerRef, '#ef4444')
            );
            // Cast Iron Base Footprint
            entities.push(
                createRectangleEntity({ x: cx, y: cy }, L, A, layerHousing, '#38bdf8')
            );
            // Central Housing Arch Boss
            const archW = (H2 - H) * 2.05;
            entities.push(
                createRectangleEntity({ x: cx, y: cy }, archW, A, layerHousing, '#94a3b8')
            );
            // Extended Inner Ring protruding from housing
            entities.push(
                createRectangleEntity({ x: cx, y: cy }, d * 1.45, Bi, layerBearing, '#f59e0b')
            );
            // Left & Right Slotted Bolt Holes (J spacing, N x N1 slot)
            for (const sign of [-1, 1]) {
                const bx = cx + sign * (J / 2);
                entities.push(
                    createRectangleEntity({ x: bx, y: cy }, N1, N, layerBearing, '#22c55e'),
                    createCircleEntity({ x: bx, y: cy }, N / 2, layerRef, '#f8fafc')
                );
            }
            // Grease Nipple at top center
            entities.push(createCircleEntity({ x: cx, y: cy }, 4, layerBearing, '#eab308'));
            return entities;
        }

        if (viewMode === 'side_section') {
            // Axial Side Cross-Section (Width A, Inner Ring Bi, Height H2)
            const centerY = cy + H;
            // Shaft Axis
            entities.push(
                createLineEntity({ x: cx - Bi / 2 - 15, y: centerY }, { x: cx + Bi / 2 + 15, y: centerY }, layerRef, '#ef4444')
            );
            // Cast Housing Section Profile
            entities.push(
                createRectangleEntity({ x: cx, y: cy + H2 / 2 }, A, H2, layerHousing, '#38bdf8')
            );
            const outerRaceR = (H2 - H) * 0.72;
            const innerRaceR = d / 2 + (outerRaceR - d / 2) * 0.35;
            // Upper & Lower Cast Iron Housing Hatches
            entities.push(
                createHatchEntity([
                    { x: cx - A / 2, y: centerY + outerRaceR },
                    { x: cx + A / 2, y: centerY + outerRaceR },
                    { x: cx + A / 2, y: cy + H2 },
                    { x: cx - A / 2, y: cy + H2 }
                ], 'ANSI31', layerHousing, '#0284c7'),
                createHatchEntity([
                    { x: cx - A / 2, y: cy },
                    { x: cx + A / 2, y: cy },
                    { x: cx + A / 2, y: centerY - outerRaceR },
                    { x: cx - A / 2, y: centerY - outerRaceR }
                ], 'ANSI31', layerHousing, '#0284c7')
            );
            // Extended Inner Bearing Ring (Width Bi)
            entities.push(
                createRectangleEntity({ x: cx, y: centerY + (d / 2 + innerRaceR) / 2 }, Bi, innerRaceR - d / 2, layerBearing, '#f59e0b'),
                createRectangleEntity({ x: cx, y: centerY - (d / 2 + innerRaceR) / 2 }, Bi, innerRaceR - d / 2, layerBearing, '#f59e0b'),
                createHatchEntity([
                    { x: cx - Bi / 2, y: centerY + d / 2 },
                    { x: cx + Bi / 2, y: centerY + d / 2 },
                    { x: cx + Bi / 2, y: centerY + innerRaceR },
                    { x: cx - Bi / 2, y: centerY + innerRaceR }
                ], 'CROSS', layerBearing, '#d97706'),
                createHatchEntity([
                    { x: cx - Bi / 2, y: centerY - innerRaceR },
                    { x: cx + Bi / 2, y: centerY - innerRaceR },
                    { x: cx + Bi / 2, y: centerY - d / 2 },
                    { x: cx - Bi / 2, y: centerY - d / 2 }
                ], 'CROSS', layerBearing, '#d97706')
            );
            // Top & Bottom Balls
            const ballDia = (outerRaceR - innerRaceR) * 0.72;
            const pitchR = (outerRaceR + innerRaceR) / 2;
            entities.push(
                createCircleEntity({ x: cx, y: centerY + pitchR }, ballDia / 2, layerBearing, '#f8fafc'),
                createCircleEntity({ x: cx, y: centerY - pitchR }, ballDia / 2, layerBearing, '#f8fafc')
            );
            return entities;
        }

        // FRONT ELEVATION VIEW (Default)
        const shaftCy = cy + H;
        const housingR = H2 - H;
        const outerRaceR = housingR * 0.72;
        const innerRingOD = d + (outerRaceR * 2 - d) * 0.38;

        // Centerlines
        entities.push(
            createLineEntity({ x: cx - housingR - 14, y: shaftCy }, { x: cx + housingR + 14, y: shaftCy }, layerRef, '#ef4444'),
            createLineEntity({ x: cx, y: cy - 10 }, { x: cx, y: cy + H2 + 16 }, layerRef, '#ef4444')
        );

        // Base Foot Plate (Length L x Height H1)
        entities.push(
            createRectangleEntity({ x: cx, y: cy + H1 / 2 }, L, H1, layerHousing, '#38bdf8'),
            createHatchEntity([
                { x: cx - L / 2, y: cy },
                { x: cx - housingR * 0.85, y: cy },
                { x: cx - housingR * 0.85, y: cy + H1 },
                { x: cx - L / 2, y: cy + H1 }
            ], 'ANSI31', layerHousing, '#0284c7'),
            createHatchEntity([
                { x: cx + housingR * 0.85, y: cy },
                { x: cx + L / 2, y: cy },
                { x: cx + L / 2, y: cy + H1 },
                { x: cx + housingR * 0.85, y: cy + H1 }
            ], 'ANSI31', layerHousing, '#0284c7')
        );

        // Bolt Hole Dashed Lines in Base Foot at +- J/2
        for (const sign of [-1, 1]) {
            const bx = cx + sign * (J / 2);
            entities.push(
                createLineEntity({ x: bx - N / 2, y: cy }, { x: bx - N / 2, y: cy + H1 }, layerRef, '#94a3b8'),
                createLineEntity({ x: bx + N / 2, y: cy }, { x: bx + N / 2, y: cy + H1 }, layerRef, '#94a3b8'),
                createLineEntity({ x: bx, y: cy - 5 }, { x: bx, y: cy + H1 + 6 }, layerRef, '#ef4444')
            );
        }

        // Pedestal Web Gussets connecting Base Foot to Spherical Housing Ring
        entities.push(
            createLineEntity({ x: cx - housingR * 1.15, y: cy + H1 }, { x: cx - housingR * 0.92, y: shaftCy - housingR * 0.35 }, layerHousing, '#38bdf8'),
            createLineEntity({ x: cx + housingR * 1.15, y: cy + H1 }, { x: cx + housingR * 0.92, y: shaftCy - housingR * 0.35 }, layerHousing, '#38bdf8')
        );

        // Spherical Cast Iron Outer Housing Ring
        entities.push(
            createCircleEntity({ x: cx, y: shaftCy }, housingR, layerHousing, '#38bdf8'),
            // Bearing Spherical Outer Race
            createCircleEntity({ x: cx, y: shaftCy }, outerRaceR, layerBearing, '#94a3b8'),
            // Bearing Inner Ring with Set Screws
            createCircleEntity({ x: cx, y: shaftCy }, innerRingOD / 2, layerBearing, '#f59e0b'),
            // Shaft Bore d
            createCircleEntity({ x: cx, y: shaftCy }, d / 2, layerBearing, '#f8fafc')
        );

        // Ball Elements Circle
        const pitchR = (outerRaceR + innerRingOD / 2) / 2;
        const ballR = (outerRaceR - innerRingOD / 2) * 0.36;
        const numBalls = 8;
        for (let i = 0; i < numBalls; i++) {
            const ang = (i * 2 * Math.PI) / numBalls;
            entities.push(
                createCircleEntity(
                    { x: cx + pitchR * Math.cos(ang), y: shaftCy + pitchR * Math.sin(ang) },
                    ballR,
                    layerBearing,
                    '#e2e8f0'
                )
            );
        }

        // Top Grease Nipple (Gresörlük — 45° or vertical boss)
        entities.push(
            createRectangleEntity({ x: cx, y: cy + H2 + 4 }, 8, 8, layerBearing, '#eab308'),
            createCircleEntity({ x: cx, y: cy + H2 + 9.5 }, 2.5, layerBearing, '#eab308')
        );

        return entities;
    },
    generate3D: (params, basePos = { x: 0, y: 0, z: 0 }) => {
        const modelKey = String(params.ucpModel || 'UCP206');
        const spec = UCP_PILLOW_CATALOG[modelKey] || UCP_PILLOW_CATALOG.UCP206;
        const { d, H, L, A, H1, H2, Bi } = spec;
        const housingR = H2 - H;

        const parts: DynamicPart3DDef[] = [
            // Cast Iron Base Foot
            {
                id: `ucp_base_${Date.now()}`,
                name: `${spec.code} Pik Döküm Taban Plakası (L=${L}mm)`,
                kind: 'box',
                color: '#1e3a5f',
                position: { x: basePos.x, y: basePos.y + H1 / 2, z: basePos.z },
                rotation: { x: 0, y: 0, z: 0 },
                params: { width: L, height: H1, depth: A },
                designStandard: 'ISO 3228'
            },
            // Pedestal Support Neck
            {
                id: `ucp_neck_${Date.now()}`,
                name: `${spec.code} Döküm Yatak Gövde Boynu`,
                kind: 'box',
                color: '#1e3a5f',
                position: { x: basePos.x, y: basePos.y + (H1 + H) / 2, z: basePos.z },
                rotation: { x: 0, y: 0, z: 0 },
                params: { width: housingR * 1.9, height: H - H1, depth: A * 0.88 },
                designStandard: 'ISO 3228'
            },
            // Spherical Outer Housing Ring
            {
                id: `ucp_ring_${Date.now()}`,
                name: `${spec.code} Küresel Rulman Yuvası`,
                kind: 'tube',
                color: '#1e3a5f',
                position: { x: basePos.x, y: basePos.y + H, z: basePos.z },
                rotation: { x: 90, y: 0, z: 0 },
                params: { diameter: housingR * 2, wall: housingR - d * 0.82, length: A },
                designStandard: 'ISO 3228'
            },
            // UC Extended Inner Bearing Ring
            {
                id: `ucp_insert_${Date.now()}`,
                name: `UC${spec.code.slice(3)} Küresel Rulman İç Bileziği (Ø${d}mm)`,
                kind: 'tube',
                color: '#cbd5e1',
                position: { x: basePos.x, y: basePos.y + H, z: basePos.z },
                rotation: { x: 90, y: 0, z: 0 },
                params: { diameter: d * 1.45, wall: d * 0.225, length: Bi },
                designStandard: 'ISO 3228'
            }
        ];

        return parts;
    },
    getGrips: (params, basePoint = { x: 0, y: 0 }) => {
        const modelKey = String(params.ucpModel || 'UCP206');
        const spec = UCP_PILLOW_CATALOG[modelKey] || UCP_PILLOW_CATALOG.UCP206;

        return [
            {
                id: 'grip_ucp_lookup',
                type: 'lookup',
                paramId: 'ucpModel',
                position: { x: basePoint.x + spec.L / 2 + 12, y: basePoint.y + spec.H },
                tooltip: `UCP Yataklı Rulman Seç (${spec.code} — Ø${spec.d} mm)`,
                tooltipTr: `UCP Yataklı Rulman Seç (${spec.code} — Ø${spec.d} mm)`
            },
            {
                id: 'grip_ucp_vis',
                type: 'visibility',
                paramId: 'viewMode',
                position: { x: basePoint.x - spec.L / 2 - 12, y: basePoint.y },
                tooltip: 'Görünüş Değiştir (Ön Görünüş / Yan Kesit / Üst Plan)',
                tooltipTr: 'Görünüş Değiştir (Ön Görünüş / Yan Kesit / Üst Plan)'
            }
        ];
    }
};
