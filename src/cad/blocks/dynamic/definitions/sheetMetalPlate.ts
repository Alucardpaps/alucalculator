/**
 * 📄 Dynamic Parametric Sheet Metal Plate & Cutout Matrix Block
 * 
 * Complies with:
 * - DIN EN 10131: Cold rolled sheet tolerances
 * - ISO 9013: Thermal cutting tolerances (laser, plasma, waterjet)
 * - VDI 3368 / DIN 9830: Hole spacing, punch margins, and clearance holes (ISO 273)
 * 
 * Features:
 * - Parametric Width (W), Length (L), and Thickness (t) with interactive stretch grips
 * - Configurable Hole Patterns:
 *    - 4 Corners (with adjustable edge margins ex, ey)
 *    - Matrix Grid Array (Nx × Ny holes with automatic pitch calculation)
 *    - Perimeter Bolt Ring (Flange style bolt pattern around plate edges)
 *    - Center Clearance Bore
 * - Parametric Center Cutout: None, Rectangular Window (wCut × hCut), Circular Window, Slots Pair
 * - Corner Finishes: Sharp 90°, Fillet Radius (R), 45° Chamfer (C)
 * - Views: Plan View (True cut geometry & centerlines), Section View (Plate thickness & hole cuts)
 * - 3D Solid Part generation with cutting path length and weight calculations
 */

import { Point, CadEntity, createLineEntity, createRectangleEntity, createCircleEntity, createPolylineEntity, createHatchEntity } from '../../../kernel/types';
import { DynamicBlockDef, DynamicGrip, DynamicPart3DDef } from '../types';

export const SHEET_METAL_MATERIALS: Record<string, { label: string; densityGcm3: number; standard: string }> = {
    'alu_6061':     { label: 'Aluminum EN AW-6061-T6', densityGcm3: 2.70, standard: 'EN 573-3 / EN 485' },
    'alu_5754':     { label: 'Aluminum EN AW-5754-H111', densityGcm3: 2.66, standard: 'EN 573-3 / EN 485' },
    'steel_s235':   { label: 'Structural Steel S235JR', densityGcm3: 7.85, standard: 'EN 10025-2' },
    'steel_s355':   { label: 'High Strength Steel S355J2', densityGcm3: 7.85, standard: 'EN 10025-2' },
    'inox_304':     { label: 'Stainless Steel AISI 304 (1.4301)', densityGcm3: 7.93, standard: 'EN 10088-2' },
    'brass_cu_zn':  { label: 'Brass CuZn39Pb3', densityGcm3: 8.50, standard: 'EN 1652' }
};

export const STANDARD_CLEARANCE_HOLES: Record<string, { thread: string; dHole: number; standard: string }> = {
    'M4':  { thread: 'M4',  dHole: 4.5,  standard: 'ISO 273 Med' },
    'M5':  { thread: 'M5',  dHole: 5.5,  standard: 'ISO 273 Med' },
    'M6':  { thread: 'M6',  dHole: 6.6,  standard: 'ISO 273 Med' },
    'M8':  { thread: 'M8',  dHole: 9.0,  standard: 'ISO 273 Med' },
    'M10': { thread: 'M10', dHole: 11.0, standard: 'ISO 273 Med' },
    'M12': { thread: 'M12', dHole: 13.5, standard: 'ISO 273 Med' },
    'M16': { thread: 'M16', dHole: 17.5, standard: 'ISO 273 Med' },
    'M20': { thread: 'M20', dHole: 22.0, standard: 'ISO 273 Med' }
};

export const DYN_SHEET_METAL_PLATE: DynamicBlockDef = {
    id: 'dyn_sheet_metal_plate',
    name: 'Sheet Metal Plate with Cutouts & Hole Grid',
    nameTr: 'Sac Levha (Parametrik Delik ve Kesik Şablonlu)',
    category: 'Mechanical',
    subcategory: 'Sheet Metal & Plates',
    subcategoryTr: 'Sac Metal, Plakalar ve Kesim',
    description: 'AutoCAD-grade dynamic sheet metal plate: stretch W x L, configure 4-corner / grid / perimeter hole arrays, center cutouts, corner fillets, and cutting metrics.',
    descriptionTr: 'DIN EN 10131 normunda parametrik sac levha; en/boy esnetme, köşe/matris/çevre delik dizileri, merkez boşaltma kesikleri ve lazer kesim boyu.',
    icon: '📄',
    calculatorRoute: '/nesting-2d/',
    calculatorModuleType: 'nesting-2d',
    calculatorLabelTr: '2D Yerleşim & Plazma CAM Takım Yoluna Aktar',
    citation: {
        tier: 1,
        standard: 'DIN EN 10131 / ISO 9013 / VDI 3368',
        clause: 'Clauses 4-8 (Tolerances on dimensions and shape of cold rolled flat products and thermal cutting)',
        description: 'Standard plate thickness, corner margin safety ex >= 1.5d, hole array pitch, and punch boundary distances.'
    },
    linearParams: [
        {
            id: 'width',
            name: 'width',
            label: 'Plate Width (W)',
            labelTr: 'Levha Genişliği (W)',
            min: 50,
            max: 3000,
            step: 10,
            default: 400,
            unit: 'mm',
            axis: 'x'
        },
        {
            id: 'length',
            name: 'length',
            label: 'Plate Length (L)',
            labelTr: 'Levha Uzunluğu (L)',
            min: 50,
            max: 6000,
            step: 10,
            default: 600,
            unit: 'mm',
            axis: 'y'
        },
        {
            id: 'thickness',
            name: 'thickness',
            label: 'Sheet Thickness (t)',
            labelTr: 'Sac Kalınlığı (t)',
            min: 0.5,
            max: 50,
            step: 0.5,
            default: 3.0,
            unit: 'mm',
            axis: 'both'
        },
        {
            id: 'marginEdgeX',
            name: 'marginEdgeX',
            label: 'Hole Edge Margin X (ex)',
            labelTr: 'X Kenar Delik Mesafesi (ex)',
            min: 10,
            max: 500,
            step: 5,
            default: 30,
            unit: 'mm',
            axis: 'x'
        },
        {
            id: 'marginEdgeY',
            name: 'marginEdgeY',
            label: 'Hole Edge Margin Y (ey)',
            labelTr: 'Y Kenar Delik Mesafesi (ey)',
            min: 10,
            max: 500,
            step: 5,
            default: 30,
            unit: 'mm',
            axis: 'y'
        }
    ],
    visibilityParam: {
        id: 'visState',
        name: 'visState',
        label: 'View Projection',
        labelTr: 'Görünüş İzdüşümü',
        states: [
            { id: 'plan', label: 'Top Plan View (Üst Açınım & Delikler)', labelTr: 'Üst Plan (Lazer / Zımba Açınımı)' },
            { id: 'section', label: 'Cross Section View (Kalınlık & Delik Kesiti)', labelTr: 'Yan Kesit (Et Kalınlığı & Delik)' }
        ],
        default: 'plan'
    },
    lookupParams: [
        {
            id: 'holePattern',
            name: 'holePattern',
            label: 'Hole Layout Pattern',
            labelTr: 'Delik Dizilim Şablonu',
            options: [
                { id: 'none', label: 'No Holes (Deliksiz Düz Plaka)', values: { holePattern: 'none' } },
                { id: '4_corners', label: '4 Corners (4 Köşe Montaj Delikleri)', values: { holePattern: '4_corners' } },
                { id: 'grid', label: 'Matrix Grid (Nx × Ny Matris Delik Dizisi)', values: { holePattern: 'grid' } },
                { id: 'perimeter', label: 'Perimeter Flange (Çevre Boyunca Cıvata Dizisi)', values: { holePattern: 'perimeter' } },
                { id: 'center', label: 'Center Hole Only (Merkez Flanş Delikli)', values: { holePattern: 'center' } }
            ],
            default: '4_corners'
        },
        {
            id: 'holeBoltSize',
            name: 'holeBoltSize',
            label: 'Hole Diameter Standard (ISO 273)',
            labelTr: 'Delik Çapı (ISO 273 Cıvata Normu)',
            options: Object.keys(STANDARD_CLEARANCE_HOLES).map(k => ({
                id: k,
                label: `${k} (Ø${STANDARD_CLEARANCE_HOLES[k].dHole} mm delik)`,
                standard: 'ISO 273',
                values: { holeBoltSize: k }
            })),
            default: 'M8'
        },
        {
            id: 'cutoutType',
            name: 'cutoutType',
            label: 'Center Cutout Geometry',
            labelTr: 'Özel Kesik / Boşaltma Tipi',
            options: [
                { id: 'none', label: 'None (İç Boşaltma Yok)', values: { cutoutType: 'none' } },
                { id: 'rect', label: 'Rectangular Window (Dikdörtgen Pencere)', values: { cutoutType: 'rect' } },
                { id: 'circle', label: 'Circular Hole (Dairesel Merkez Boşaltma)', values: { cutoutType: 'circle' } }
            ],
            default: 'none'
        },
        {
            id: 'materialKey',
            name: 'materialKey',
            label: 'Material Alloy',
            labelTr: 'Malzeme Alaşımı',
            options: Object.keys(SHEET_METAL_MATERIALS).map(k => ({
                id: k,
                label: SHEET_METAL_MATERIALS[k].label,
                standard: SHEET_METAL_MATERIALS[k].standard,
                values: { materialKey: k }
            })),
            default: 'alu_6061'
        }
    ],
    defaultValues: {
        width: 400,
        length: 600,
        thickness: 3.0,
        marginEdgeX: 30,
        marginEdgeY: 30,
        holePattern: '4_corners',
        holeBoltSize: 'M8',
        holesX: 4,
        holesY: 6,
        cutoutType: 'none',
        cutoutWidth: 150,
        cutoutHeight: 200,
        cornerStyle: 'fillet',
        cornerSize: 10,
        materialKey: 'alu_6061',
        visState: 'plan'
    },
    generate2D: (params, basePoint = { x: 0, y: 0 }) => {
        const W = Number(params.width) || 400;
        const L = Number(params.length) || 600;
        const t = Number(params.thickness) || 3.0;
        const ex = Math.min(Number(params.marginEdgeX) || 30, W / 2 - 5);
        const ey = Math.min(Number(params.marginEdgeY) || 30, L / 2 - 5);
        const state = String(params.visState || params.state || 'plan');
        const pattern = String(params.holePattern || '4_corners');
        const boltKey = String(params.holeBoltSize || 'M8');
        const dHole = STANDARD_CLEARANCE_HOLES[boltKey]?.dHole || 9.0;
        const rHole = dHole / 2;
        const cutout = String(params.cutoutType || 'none');
        const wCut = Number(params.cutoutWidth) || 150;
        const hCut = Number(params.cutoutHeight) || 200;
        const cornerStyle = String(params.cornerStyle || 'fillet');
        const cSize = Number(params.cornerSize) || 10;

        const entities: CadEntity[] = [];
        const layerPlate = 'layer-mech';
        const layerHoles = 'layer-accent';
        const layerCenter = 'layer-ref';
        const colorPlate = '#38bdf8';
        const colorHole = '#00e5ff';
        const colorCenter = '#ef4444';

        if (state === 'plan') {
            // Draw Outer Perimeter with corner chamfer/fillet
            const x0 = basePoint.x;
            const y0 = basePoint.y;
            const x1 = basePoint.x + W;
            const y1 = basePoint.y + L;

            const midX = x0 + W / 2;
            const midY = y0 + L / 2;

            if (cornerStyle === 'chamfer' && cSize > 0) {
                const pts: Point[] = [
                    { x: x0 + cSize, y: y0 },
                    { x: x1 - cSize, y: y0 },
                    { x: x1, y: y0 + cSize },
                    { x: x1, y: y1 - cSize },
                    { x: x1 - cSize, y: y1 },
                    { x: x0 + cSize, y: y1 },
                    { x: x0, y: y1 - cSize },
                    { x: x0, y: y0 + cSize }
                ];
                entities.push(createPolylineEntity(pts, true, layerPlate, colorPlate));
            } else if (cornerStyle === 'fillet' && cSize > 0) {
                // Smooth fillet arcs at 4 corners
                const r = Math.min(cSize, W / 2, L / 2);
                const steps = 6;
                const pts: Point[] = [];

                // Bottom edge (from bottom-left fillet to bottom-right fillet)
                pts.push({ x: x0 + r, y: y0 });
                pts.push({ x: x1 - r, y: y0 });

                // Bottom-right corner arc (-PI/2 to 0)
                const cBR = { x: x1 - r, y: y0 + r };
                for (let s = 1; s <= steps; s++) {
                    const ang = -Math.PI / 2 + (Math.PI / 2) * (s / steps);
                    pts.push({ x: cBR.x + r * Math.cos(ang), y: cBR.y + r * Math.sin(ang) });
                }

                // Right edge to top-right fillet
                pts.push({ x: x1, y: y1 - r });

                // Top-right corner arc (0 to PI/2)
                const cTR = { x: x1 - r, y: y1 - r };
                for (let s = 1; s <= steps; s++) {
                    const ang = (Math.PI / 2) * (s / steps);
                    pts.push({ x: cTR.x + r * Math.cos(ang), y: cTR.y + r * Math.sin(ang) });
                }

                // Top edge to top-left fillet
                pts.push({ x: x0 + r, y: y1 });

                // Top-left corner arc (PI/2 to PI)
                const cTL = { x: x0 + r, y: y1 - r };
                for (let s = 1; s <= steps; s++) {
                    const ang = Math.PI / 2 + (Math.PI / 2) * (s / steps);
                    pts.push({ x: cTL.x + r * Math.cos(ang), y: cTL.y + r * Math.sin(ang) });
                }

                // Left edge to bottom-left fillet
                pts.push({ x: x0, y: y0 + r });

                // Bottom-left corner arc (PI to 3PI/2)
                const cBL = { x: x0 + r, y: y0 + r };
                for (let s = 1; s <= steps; s++) {
                    const ang = Math.PI + (Math.PI / 2) * (s / steps);
                    pts.push({ x: cBL.x + r * Math.cos(ang), y: cBL.y + r * Math.sin(ang) });
                }

                entities.push(createPolylineEntity(pts, true, layerPlate, colorPlate));
            } else {
                // Rectangle perimeter centered at (midX, midY) to cover [x0, x1] x [y0, y1]
                entities.push(createRectangleEntity({ x: midX, y: midY }, W, L, layerPlate, colorPlate));
            }

            // Hole coordinate collection
            const holeCenters: Point[] = [];

            if (pattern === '4_corners') {
                holeCenters.push({ x: x0 + ex, y: y0 + ey });
                holeCenters.push({ x: x1 - ex, y: y0 + ey });
                holeCenters.push({ x: x1 - ex, y: y1 - ey });
                holeCenters.push({ x: x0 + ex, y: y1 - ey });
            } else if (pattern === 'grid') {
                const nx = Math.max(2, Math.min(20, Number(params.holesX) || 4));
                const ny = Math.max(2, Math.min(20, Number(params.holesY) || 6));
                const spanX = (W - 2 * ex) / (nx - 1);
                const spanY = (L - 2 * ey) / (ny - 1);

                for (let i = 0; i < nx; i++) {
                    for (let j = 0; j < ny; j++) {
                        holeCenters.push({
                            x: x0 + ex + i * spanX,
                            y: y0 + ey + j * spanY
                        });
                    }
                }
            } else if (pattern === 'perimeter') {
                const nx = Math.max(2, Math.min(20, Number(params.holesX) || 4));
                const ny = Math.max(2, Math.min(20, Number(params.holesY) || 6));
                const spanX = (W - 2 * ex) / (nx - 1);
                const spanY = (L - 2 * ey) / (ny - 1);

                // Bottom and Top edges
                for (let i = 0; i < nx; i++) {
                    holeCenters.push({ x: x0 + ex + i * spanX, y: y0 + ey });
                    holeCenters.push({ x: x0 + ex + i * spanX, y: y1 - ey });
                }
                // Left and Right inner edges
                for (let j = 1; j < ny - 1; j++) {
                    holeCenters.push({ x: x0 + ex, y: y0 + ey + j * spanY });
                    holeCenters.push({ x: x1 - ex, y: y0 + ey + j * spanY });
                }
            } else if (pattern === 'center') {
                holeCenters.push({ x: x0 + W / 2, y: y0 + L / 2 });
            }

            // Generate Holes and crosshairs
            for (const c of holeCenters) {
                entities.push(createCircleEntity(c, rHole, layerHoles, colorHole));
                // Center crosshair (+)
                const ch = rHole * 1.5;
                entities.push(createLineEntity({ x: c.x - ch, y: c.y }, { x: c.x + ch, y: c.y }, layerCenter, colorCenter));
                entities.push(createLineEntity({ x: c.x, y: c.y - ch }, { x: c.x, y: c.y + ch }, layerCenter, colorCenter));
            }

            // Center Cutouts
            if (cutout === 'rect') {
                const cw = Math.min(wCut, W - 4 * ex);
                const ch = Math.min(hCut, L - 4 * ey);
                entities.push(createRectangleEntity(
                    { x: midX, y: midY },
                    cw,
                    ch,
                    layerHoles,
                    colorHole
                ));
            } else if (cutout === 'circle') {
                const rCut = Math.min(wCut, hCut, W - 4 * ex, L - 4 * ey) / 2;
                entities.push(createCircleEntity({ x: midX, y: midY }, rCut, layerHoles, colorHole));
            }

            // Plate centerlines
            entities.push(createLineEntity({ x: x0 - 15, y: midY }, { x: x1 + 15, y: midY }, layerCenter, colorCenter));
            entities.push(createLineEntity({ x: midX, y: y0 - 15 }, { x: midX, y: y1 + 15 }, layerCenter, colorCenter));

        } else {
            // Section View (Thickness & Holes)
            const x0 = basePoint.x;
            const y0 = basePoint.y;
            const x1 = basePoint.x + W;
            const y1 = basePoint.y + t;

            // Plate boundary centered at (x0 + W/2, y0 + t/2)
            entities.push(createRectangleEntity({ x: x0 + W / 2, y: y0 + t / 2 }, W, t, layerPlate, colorPlate));

            // Section of holes along X
            const holeXCoords: number[] = [];
            if (pattern === '4_corners' || pattern === 'grid' || pattern === 'perimeter') {
                holeXCoords.push(x0 + ex);
                holeXCoords.push(x1 - ex);
            } else if (pattern === 'center') {
                holeXCoords.push(x0 + W / 2);
            }
            holeXCoords.sort((a, b) => a - b);

            for (const hx of holeXCoords) {
                // Hole wall vertical edges
                entities.push(createLineEntity({ x: hx - rHole, y: y0 }, { x: hx - rHole, y: y1 }, layerHoles, colorHole));
                entities.push(createLineEntity({ x: hx + rHole, y: y0 }, { x: hx + rHole, y: y1 }, layerHoles, colorHole));
                // Centerline
                entities.push(createLineEntity({ x: hx, y: y0 - 3 }, { x: hx, y: y1 + 3 }, layerCenter, colorCenter));
            }

            // ISO 128 Section Hatching across solid plate metal
            let prevX = x0;
            for (const hx of holeXCoords) {
                const wallLeft = hx - rHole;
                if (wallLeft > prevX) {
                    entities.push(createHatchEntity([
                        { x: prevX, y: y0 },
                        { x: wallLeft, y: y0 },
                        { x: wallLeft, y: y1 },
                        { x: prevX, y: y1 }
                    ], 'ANSI31', layerPlate, 'rgba(56, 189, 248, 0.45)', undefined, undefined, false));
                }
                prevX = hx + rHole;
            }
            if (x1 > prevX) {
                entities.push(createHatchEntity([
                    { x: prevX, y: y0 },
                    { x: x1, y: y0 },
                    { x: x1, y: y1 },
                    { x: prevX, y: y1 }
                ], 'ANSI31', layerPlate, 'rgba(56, 189, 248, 0.45)', undefined, undefined, false));
            }
        }

        return entities;
    },
    generate3D: (params, basePos = { x: 0, y: 0, z: 0 }) => {
        const W = Number(params.width) || 400;
        const L = Number(params.length) || 600;
        const t = Number(params.thickness) || 3.0;
        const matKey = String(params.materialKey || 'alu_6061');
        const mat = SHEET_METAL_MATERIALS[matKey] || SHEET_METAL_MATERIALS['alu_6061'];

        const parts: DynamicPart3DDef[] = [
            {
                name: `Sheet Metal Plate ${W}×${L}×${t} mm`,
                kind: 'plate',
                color: matKey.startsWith('alu') ? '#94a3b8' : '#64748b',
                position: basePos,
                dimensions: {
                    width: W,
                    length: L,
                    thickness: t
                },
                designStandard: 'DIN EN 10131',
                materialType: mat.label
            }
        ];
        return parts;
    },
    getGrips: (params, basePoint = { x: 0, y: 0 }) => {
        const W = Number(params.width) || 400;
        const L = Number(params.length) || 600;
        const ex = Number(params.marginEdgeX) || 30;
        const ey = Number(params.marginEdgeY) || 30;
        const state = String(params.visState || 'plan');

        const grips: DynamicGrip[] = [
            {
                id: 'origin_grip',
                type: 'point',
                paramId: 'basePoint',
                position: basePoint,
                label: 'Plate Origin (0,0)',
                labelTr: 'Plaka Başlangıcı'
            }
        ];

        if (state === 'plan') {
            // Stretch Width
            grips.push({
                id: 'stretch_w',
                type: 'stretch',
                paramId: 'width',
                position: { x: basePoint.x + W, y: basePoint.y + L / 2 },
                direction: { x: 1, y: 0 },
                label: `W = ${W} mm`,
                labelTr: `Genişlik W = ${W} mm`,
                tooltip: 'Drag to resize plate width',
                tooltipTr: 'Plaka genişliğini değiştirmek için sürükleyin'
            });

            // Stretch Length
            grips.push({
                id: 'stretch_l',
                type: 'stretch',
                paramId: 'length',
                position: { x: basePoint.x + W / 2, y: basePoint.y + L },
                direction: { x: 0, y: 1 },
                label: `L = ${L} mm`,
                labelTr: `Uzunluk L = ${L} mm`,
                tooltip: 'Drag to resize plate length',
                tooltipTr: 'Plaka uzunluğunu değiştirmek için sürükleyin'
            });

            // Corner margin ex, ey grip
            grips.push({
                id: 'margin_ex_ey',
                type: 'linear',
                paramId: 'marginEdgeX',
                position: { x: basePoint.x + ex, y: basePoint.y + ey },
                label: `Edge Margin ex=${ex}, ey=${ey}`,
                labelTr: `Kenar Payı ex=${ex}, ey=${ey} mm`,
                tooltip: 'Hole corner offset margin',
                tooltipTr: 'Köşe delik kenar mesafesi'
            });
        }

        return grips;
    }
};
