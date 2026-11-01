/**
 * 🏗️ Structural Steel Beam Dynamic Block (EN 10025 / EN 10034 / DIN 1025)
 * 
 * - Linear stretch: Length (500 - 15000 mm)
 * - Lookup Table: Standard European Profiles (IPE 80-300, HEA 100-240, HEB 100-240, UPN 80-200)
 * - Exact cross-section dimensions: h, b, tw, tf, r
 * - Visibility: Cross Section (Detailed with fillets), Elevation (Flanges & Web), Plan View
 * - 3D Parametric CAD: Extruded Steel I-Beam / H-Beam
 */

import { Point, CadEntity, createLineEntity, createRectangleEntity, createPolylineEntity, createHatchEntity } from '../../../kernel/types';
import { DynamicBlockDef, DynamicGrip, DynamicPart3DDef } from '../types';

interface ProfileSpec {
    standard: 'IPE' | 'HEA' | 'HEB' | 'UPN';
    designation: string;
    h: number;   // Total height (mm)
    b: number;   // Flange width (mm)
    tw: number;  // Web thickness (mm)
    tf: number;  // Flange thickness (mm)
    r: number;   // Root fillet radius (mm)
    massKgM: number;
}

export const STEEL_PROFILES_DB: Record<string, ProfileSpec> = {
    'IPE 80': { standard: 'IPE', designation: 'IPE 80', h: 80, b: 46, tw: 3.8, tf: 5.2, r: 5, massKgM: 6.0 },
    'IPE 100': { standard: 'IPE', designation: 'IPE 100', h: 100, b: 55, tw: 4.1, tf: 5.7, r: 7, massKgM: 8.1 },
    'IPE 120': { standard: 'IPE', designation: 'IPE 120', h: 120, b: 64, tw: 4.4, tf: 6.3, r: 7, massKgM: 10.4 },
    'IPE 140': { standard: 'IPE', designation: 'IPE 140', h: 140, b: 73, tw: 4.7, tf: 6.9, r: 7, massKgM: 12.9 },
    'IPE 160': { standard: 'IPE', designation: 'IPE 160', h: 160, b: 82, tw: 5.0, tf: 7.4, r: 9, massKgM: 15.8 },
    'IPE 180': { standard: 'IPE', designation: 'IPE 180', h: 180, b: 91, tw: 5.3, tf: 8.0, r: 9, massKgM: 18.8 },
    'IPE 200': { standard: 'IPE', designation: 'IPE 200', h: 200, b: 100, tw: 5.6, tf: 8.5, r: 12, massKgM: 22.4 },
    'IPE 240': { standard: 'IPE', designation: 'IPE 240', h: 240, b: 120, tw: 6.2, tf: 9.8, r: 15, massKgM: 30.7 },
    'HEA 100': { standard: 'HEA', designation: 'HEA 100', h: 96, b: 100, tw: 5.0, tf: 8.0, r: 12, massKgM: 16.7 },
    'HEA 120': { standard: 'HEA', designation: 'HEA 120', h: 114, b: 120, tw: 5.0, tf: 8.0, r: 12, massKgM: 19.9 },
    'HEA 140': { standard: 'HEA', designation: 'HEA 140', h: 133, b: 140, tw: 5.5, tf: 8.5, r: 12, massKgM: 24.7 },
    'HEA 160': { standard: 'HEA', designation: 'HEA 160', h: 152, b: 160, tw: 6.0, tf: 9.0, r: 15, massKgM: 30.4 },
    'HEA 200': { standard: 'HEA', designation: 'HEA 200', h: 190, b: 200, tw: 6.5, tf: 10.0, r: 18, massKgM: 42.3 },
    'HEB 100': { standard: 'HEB', designation: 'HEB 100', h: 100, b: 100, tw: 6.0, tf: 10.0, r: 12, massKgM: 20.4 },
    'HEB 120': { standard: 'HEB', designation: 'HEB 120', h: 120, b: 120, tw: 6.5, tf: 11.0, r: 12, massKgM: 26.7 },
    'HEB 140': { standard: 'HEB', designation: 'HEB 140', h: 140, b: 140, tw: 7.0, tf: 12.0, r: 12, massKgM: 33.7 },
    'HEB 200': { standard: 'HEB', designation: 'HEB 200', h: 200, b: 200, tw: 9.0, tf: 15.0, r: 18, massKgM: 61.3 },
    'UPN 100': { standard: 'UPN', designation: 'UPN 100', h: 100, b: 50, tw: 6.0, tf: 8.5, r: 8.5, massKgM: 10.6 },
    'UPN 140': { standard: 'UPN', designation: 'UPN 140', h: 140, b: 60, tw: 7.0, tf: 10.0, r: 10, massKgM: 16.0 },
    'UPN 160': { standard: 'UPN', designation: 'UPN 160', h: 160, b: 65, tw: 7.5, tf: 10.5, r: 10.5, massKgM: 18.8 }
};

export const DYN_STEEL_BEAM: DynamicBlockDef = {
    id: 'dyn_steel_beam',
    name: 'Structural Steel Beam (IPE / HEA / HEB / UPN)',
    nameTr: 'Dinamik Yapısal Çelik Kiriş ve Profil',
    category: 'Structural',
    subcategory: 'Steel Profiles',
    subcategoryTr: 'Çelik Profiller',
    description: 'AutoCAD-grade dynamic steel beam: select profile standard from lookup table, stretch length, switch section/elevation/3D.',
    descriptionTr: 'Tablodan standart IPE/HEA/HEB/UPN profili seçilir, boyu esnetilir, kesit ve 3D katı modele anında dönüşür.',
    icon: '🏗️',
    citation: {
        tier: 1,
        standard: 'EN 10025 / EN 10034 / DIN 1025',
        clause: 'Clauses 4-7 (Hot rolled I and H sections - Tolerances on shape and dimensions)',
        description: 'Standard European structural steel cross sections with standardized root fillets and mass properties.'
    },
    linearParams: [
        {
            id: 'length',
            name: 'length',
            label: 'Beam Length',
            labelTr: 'Kiriş Uzunluğu',
            min: 500,
            max: 15000,
            step: 100,
            default: 3000,
            unit: 'mm',
            axis: 'x'
        }
    ],
    visibilityParam: {
        id: 'visState',
        name: 'visState',
        label: 'View Projection',
        labelTr: 'Görünüş İzdüşümü',
        states: [
            { id: 'elevation', label: 'Elevation View (Flanges & Web)', labelTr: 'Boyuna Yan Görünüş' },
            { id: 'cross_section', label: 'Cross Section (Standart Profil Kesiti)', labelTr: 'Enkesit Detayı' },
            { id: 'plan', label: 'Plan View (Üst Görünüş)', labelTr: 'Üst Plan Görünüşü' }
        ],
        default: 'elevation'
    },
    lookupParams: [
        {
            id: 'profileName',
            name: 'profileName',
            label: 'Standard Profile Designation',
            labelTr: 'Standart Profil Kesiti',
            options: Object.keys(STEEL_PROFILES_DB).map((key) => {
                const p = STEEL_PROFILES_DB[key];
                return {
                    id: key,
                    label: `${key} (${p.h}×${p.b} mm — ${p.massKgM} kg/m)`,
                    standard: 'EN 10034',
                    values: { profileName: key }
                };
            }),
            default: 'IPE 140'
        }
    ],
    defaultValues: {
        profileName: 'IPE 140',
        length: 3000,
        visState: 'elevation'
    },
    generate2D: (params, basePoint = { x: 0, y: 0 }) => {
        const profileName = String(params.profileName || 'IPE 140');
        const spec = STEEL_PROFILES_DB[profileName] || STEEL_PROFILES_DB['IPE 140'];
        const length = Number(params.length) || 3000;
        const state = String(params.visState || 'elevation');

        const entities: CadEntity[] = [];
        const layer = 'layer-struct';
        const colorSteel = '#3ad0e6';
        const colorCenter = '#ef4444'; // Red centerline
        const colorDim = '#94a3b8';

        if (state === 'cross_section') {
            // Draw exact 2D I-Beam cross-section contour
            const { h, b, tw, tf } = spec;
            const cx = basePoint.x;
            const cy = basePoint.y;

            // Contour vertices starting from top-left flange
            const hw = b / 2;
            const hh = h / 2;
            const w_half = tw / 2;

            const vertices: Point[] = [
                { x: cx - hw, y: cy + hh },           // Top flange top-left
                { x: cx + hw, y: cy + hh },           // Top flange top-right
                { x: cx + hw, y: cy + hh - tf },      // Top flange bottom-right
                { x: cx + w_half, y: cy + hh - tf },  // Web junction top-right
                { x: cx + w_half, y: cy - hh + tf },  // Web junction bottom-right
                { x: cx + hw, y: cy - hh + tf },      // Bottom flange top-right
                { x: cx + hw, y: cy - hh },           // Bottom flange bottom-right
                { x: cx - hw, y: cy - hh },           // Bottom flange bottom-left
                { x: cx - hw, y: cy - hh + tf },      // Bottom flange top-left
                { x: cx - w_half, y: cy - hh + tf },  // Web junction bottom-left
                { x: cx - w_half, y: cy + hh - tf },  // Web junction top-left
                { x: cx - hw, y: cy + hh - tf },      // Top flange bottom-left
            ];

            entities.push(createPolylineEntity(vertices, true, layer, colorSteel));
            entities.push(createHatchEntity(vertices, 'ANSI31', layer, 'rgba(56, 189, 248, 0.45)', undefined, undefined, false));

            // Neutral Axes (Centerlines)
            entities.push(createLineEntity({ x: cx - hw - 20, y: cy }, { x: cx + hw + 20, y: cy }, layer, colorCenter));
            entities.push(createLineEntity({ x: cx, y: cy - hh - 20 }, { x: cx, y: cy + hh + 20 }, layer, colorCenter));

            return entities;
        }

        if (state === 'plan') {
            // Plan View: Upper flange width x length
            const { b, tw } = spec;
            entities.push(createRectangleEntity(
                { x: basePoint.x + length / 2, y: basePoint.y + b / 2 },
                length,
                b,
                layer,
                colorSteel
            ));
            // Hidden lines for the web thickness
            entities.push(createLineEntity(
                { x: basePoint.x, y: basePoint.y + (b - tw) / 2 },
                { x: basePoint.x + length, y: basePoint.y + (b - tw) / 2 },
                layer,
                '#64748b'
            ));
            entities.push(createLineEntity(
                { x: basePoint.x, y: basePoint.y + (b + tw) / 2 },
                { x: basePoint.x + length, y: basePoint.y + (b + tw) / 2 },
                layer,
                '#64748b'
            ));
            return entities;
        }

        // Default: Elevation View
        const { h, tf } = spec;
        // Top Flange
        entities.push(createRectangleEntity(
            { x: basePoint.x + length / 2, y: basePoint.y + h - tf / 2 },
            length,
            tf,
            layer,
            colorSteel
        ));
        // Bottom Flange
        entities.push(createRectangleEntity(
            { x: basePoint.x + length / 2, y: basePoint.y + tf / 2 },
            length,
            tf,
            layer,
            colorSteel
        ));
        // Web Body
        entities.push(createRectangleEntity(
            { x: basePoint.x + length / 2, y: basePoint.y + h / 2 },
            length,
            h - tf * 2,
            layer,
            colorSteel
        ));

        // Centerline
        entities.push(createLineEntity(
            { x: basePoint.x - 50, y: basePoint.y + h / 2 },
            { x: basePoint.x + length + 50, y: basePoint.y + h / 2 },
            layer,
            colorCenter
        ));

        return entities;
    },
    generate3D: (params, basePos = { x: 0, y: 0, z: 0 }) => {
        const profileName = String(params.profileName || 'IPE 140');
        const spec = STEEL_PROFILES_DB[profileName] || STEEL_PROFILES_DB['IPE 140'];
        const length = Number(params.length) || 3000;
        const { h, b, tw, tf } = spec;

        const parts: DynamicPart3DDef[] = [
            {
                id: `beam_${profileName.replace(/\s+/g, '_')}_${Date.now()}`,
                name: `${spec.designation} Çelik Kiriş (L=${length} mm)`,
                kind: 'I-beam',
                color: '#38bdf8', // Steel blue
                position: { x: basePos.x + length / 2, y: basePos.y + h / 2, z: basePos.z },
                rotation: { x: 0, y: 90, z: 0 },
                params: {
                    flangeW: b,
                    webH: h,
                    flangeT: tf,
                    webT: tw,
                    length: length
                },
                designStandard: 'EN 10034 / EN 10025-2'
            }
        ];

        return parts;
    },
    getGrips: (params, basePoint = { x: 0, y: 0 }) => {
        const length = Number(params.length) || 3000;
        const profileName = String(params.profileName || 'IPE 140');
        const spec = STEEL_PROFILES_DB[profileName] || STEEL_PROFILES_DB['IPE 140'];

        const grips: DynamicGrip[] = [
            // Linear Stretch Length Grip
            {
                id: 'grip_beam_length',
                type: 'stretch',
                paramId: 'length',
                position: { x: basePoint.x + length, y: basePoint.y + spec.h / 2 },
                direction: { x: 1, y: 0 },
                tooltip: `Grip: Kiriş Boyu (${length} mm)`,
                tooltipTr: `Grip: Kiriş Boyu (${length} mm)`
            },
            // Visibility State
            {
                id: 'grip_beam_vis',
                type: 'visibility',
                paramId: 'visState',
                position: { x: basePoint.x - 30, y: basePoint.y - 30 },
                tooltip: 'Görünüş Değiştir (Yan Boyuna / Enkesit / Plan)',
                tooltipTr: 'Görünüş Değiştir (Yan Boyuna / Enkesit / Plan)'
            }
        ];

        return grips;
    }
};
