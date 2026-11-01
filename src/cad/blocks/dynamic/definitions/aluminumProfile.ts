/**
 * 🏗️ Dynamic Structural Aluminum Profile Suite (I-Beam, H-Beam, T-Bar - EN 755 / DIN 1748)
 * 
 * Standards:
 * - EN 755-1/-2/-9: Aluminum and aluminum alloys - Extruded rod/bar, tube and profiles
 * - DIN 1748: Extruded aluminum sections in alloys EN AW-6060 / 6082
 * - Eurocode 9 (EN 1999-1-1): Design of aluminum structures
 * 
 * Profile Types:
 * - Aluminum I-Sections (Alüminyum I Kirişler)
 * - Aluminum H-Sections (Alüminyum H Kirişler)
 * - Aluminum T-Sections (Alüminyum T Profiller)
 */

import { Point, CadEntity, createLineEntity, createRectangleEntity, createPolylineEntity, createHatchEntity } from '../../../kernel/types';
import { DynamicBlockDef, DynamicGrip, DynamicPart3DDef } from '../types';

export interface AluSectionSpec {
    id: string;
    type: 'I' | 'H' | 'T';
    h: number;         // Height (mm)
    b: number;         // Flange / Bar Width (mm)
    tw: number;        // Web thickness (mm)
    tf: number;        // Flange thickness (mm)
    r: number;         // Fillet radius (mm)
    massKgM: number;   // Linear mass in aluminum (~2.70 g/cm3)
    standard: string;
}

export const ALU_PROFILES_DB: Record<string, AluSectionSpec> = {
    // ── ALUMINUM I-SECTIONS ──
    'Alu I 50x30x3':   { id: 'Alu I 50x30x3',   type: 'I', h: 50,  b: 30, tw: 3.0, tf: 3.0, r: 3.0, massKgM: 0.86, standard: 'EN 755-9' },
    'Alu I 80x40x4':   { id: 'Alu I 80x40x4',   type: 'I', h: 80,  b: 40, tw: 4.0, tf: 4.0, r: 4.0, massKgM: 1.63, standard: 'EN 755-9' },
    'Alu I 100x50x5':  { id: 'Alu I 100x50x5',  type: 'I', h: 100, b: 50, tw: 5.0, tf: 5.0, r: 5.0, massKgM: 2.56, standard: 'EN 755-9' },
    'Alu I 120x60x6':  { id: 'Alu I 120x60x6',  type: 'I', h: 120, b: 60, tw: 6.0, tf: 6.0, r: 6.0, massKgM: 3.69, standard: 'EN 755-9' },
    'Alu I 140x70x7':  { id: 'Alu I 140x70x7',  type: 'I', h: 140, b: 70, tw: 7.0, tf: 7.0, r: 7.0, massKgM: 5.03, standard: 'EN 755-9' },
    'Alu I 160x80x8':  { id: 'Alu I 160x80x8',  type: 'I', h: 160, b: 80, tw: 8.0, tf: 8.0, r: 8.0, massKgM: 6.57, standard: 'EN 755-9' },

    // ── ALUMINUM H-SECTIONS ──
    'Alu H 60x60x4':   { id: 'Alu H 60x60x4',   type: 'H', h: 60,  b: 60, tw: 4.0, tf: 4.0, r: 4.0, massKgM: 1.85, standard: 'EN 755-9' },
    'Alu H 80x80x5':   { id: 'Alu H 80x80x5',   type: 'H', h: 80,  b: 80, tw: 5.0, tf: 5.0, r: 5.0, massKgM: 3.11, standard: 'EN 755-9' },
    'Alu H 100x100x6': { id: 'Alu H 100x100x6', type: 'H', h: 100, b: 100,tw: 6.0, tf: 6.0, r: 6.0, massKgM: 4.67, standard: 'EN 755-9' },
    'Alu H 120x120x8': { id: 'Alu H 120x120x8', type: 'H', h: 120, b: 120,tw: 8.0, tf: 8.0, r: 8.0, massKgM: 7.43, standard: 'EN 755-9' },

    // ── ALUMINUM T-SECTIONS ──
    'Alu T 20x20x2':   { id: 'Alu T 20x20x2',   type: 'T', h: 20,  b: 20, tw: 2.0, tf: 2.0, r: 2.0, massKgM: 0.21, standard: 'EN 755-9' },
    'Alu T 30x30x3':   { id: 'Alu T 30x30x3',   type: 'T', h: 30,  b: 30, tw: 3.0, tf: 3.0, r: 3.0, massKgM: 0.46, standard: 'EN 755-9' },
    'Alu T 40x40x4':   { id: 'Alu T 40x40x4',   type: 'T', h: 40,  b: 40, tw: 4.0, tf: 4.0, r: 4.0, massKgM: 0.82, standard: 'EN 755-9' },
    'Alu T 50x50x5':   { id: 'Alu T 50x50x5',   type: 'T', h: 50,  b: 50, tw: 5.0, tf: 5.0, r: 5.0, massKgM: 1.28, standard: 'EN 755-9' },
    'Alu T 60x60x6':   { id: 'Alu T 60x60x6',   type: 'T', h: 60,  b: 60, tw: 6.0, tf: 6.0, r: 6.0, massKgM: 1.85, standard: 'EN 755-9' }
};

export const DYN_ALUMINUM_PROFILE: DynamicBlockDef = {
    id: 'dyn_aluminum_profile',
    name: 'Aluminum Structural Profile (I / H / T Beam - EN 755)',
    nameTr: 'Alüminyum Yapısal Profil (I / H / T Kesit)',
    category: 'Structural',
    subcategory: 'Aluminum Profiles',
    subcategoryTr: 'Alüminyum Yapısal Profiller',
    description: 'AutoCAD-grade dynamic aluminum extruded I-Beam, H-Beam, and T-Bar profiles with exact section geometry, stretch length, and Eurocode 9 inertia metrics.',
    descriptionTr: 'EN 755 ve DIN 1748 normunda alüminyum I, H ve T yapısal profiller; kesit detayları, boyuna esnetme ve canlı Eurocode 9 sehim hesabı.',
    icon: '🏗️',
    calculatorRoute: '/calculators/beam-deflection/',
    calculatorModuleType: 'beam-deflection',
    calculatorLabelTr: 'Kiriş Mukavemet ve Sehim Hesabına Git',
    citation: {
        tier: 1,
        standard: 'EN 755-9 / DIN 1748 / Eurocode 9 (EN 1999-1-1)',
        clause: 'Extruded aluminum I, H and T profiles in alloy EN AW-6060-T6 and 6082-T6',
        description: 'Standard dimensions h, b, web tw, flange tf, moments of inertia Ix and Iy, and deflection limits.'
    },
    linearParams: [
        {
            id: 'length',
            name: 'length',
            label: 'Extrusion Length (L)',
            labelTr: 'Profil Boyu (L)',
            min: 50,
            max: 12000,
            step: 50,
            default: 2000,
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
            { id: 'cross_section', label: 'Cross Section (Enkesit Görünüşü)', labelTr: 'Enkesit Detayı' },
            { id: 'elevation', label: 'Elevation View (Boy Kesit)', labelTr: 'Boyuna Yan Görünüş' },
            { id: 'plan', label: 'Plan View (Üst Görünüş)', labelTr: 'Üst Plan Görünüşü' }
        ],
        default: 'cross_section'
    },
    lookupParams: [
        {
            id: 'profileKey',
            name: 'profileKey',
            label: 'Aluminum Profile Specification',
            labelTr: 'Alüminyum Profil Kesiti',
            options: Object.keys(ALU_PROFILES_DB).map(key => {
                const p = ALU_PROFILES_DB[key];
                return {
                    id: key,
                    label: `${key} (${p.h}×${p.b} mm — ${p.massKgM.toFixed(2)} kg/m)`,
                    standard: p.standard,
                    values: { profileKey: key }
                };
            }),
            default: 'Alu I 100x50x5'
        }
    ],
    defaultValues: {
        profileKey: 'Alu I 100x50x5',
        length: 2000,
        visState: 'cross_section'
    },
    generate2D: (params, basePoint = { x: 0, y: 0 }) => {
        const key = String(params.profileKey || 'Alu I 100x50x5');
        const spec = ALU_PROFILES_DB[key] || ALU_PROFILES_DB['Alu I 100x50x5'];
        const length = Number(params.length) || 2000;
        const state = String(params.visState || 'cross_section');

        const entities: CadEntity[] = [];
        const layer = 'layer-struct';
        const colorAlu = '#38bdf8';
        const colorHidden = '#0284c7';
        const colorCenter = '#ef4444';

        if (state === 'cross_section') {
            const { h, b, tw, tf, type } = spec;
            const cx = basePoint.x;
            const cy = basePoint.y;
            const hw = b / 2;
            const hh = h / 2;
            const w_half = tw / 2;

            if (type === 'I' || type === 'H') {
                // Closed 12-vertex I/H-Beam polygon
                const pts: Point[] = [
                    { x: cx - hw, y: cy + hh },
                    { x: cx + hw, y: cy + hh },
                    { x: cx + hw, y: cy + hh - tf },
                    { x: cx + w_half, y: cy + hh - tf },
                    { x: cx + w_half, y: cy - hh + tf },
                    { x: cx + hw, y: cy - hh + tf },
                    { x: cx + hw, y: cy - hh },
                    { x: cx - hw, y: cy - hh },
                    { x: cx - hw, y: cy - hh + tf },
                    { x: cx - w_half, y: cy - hh + tf },
                    { x: cx - w_half, y: cy + hh - tf },
                    { x: cx - hw, y: cy + hh - tf }
                ];
                entities.push(createPolylineEntity(pts, true, layer, colorAlu));
                entities.push(createHatchEntity(pts, 'ANSI31', layer, 'rgba(56, 189, 248, 0.45)', undefined, undefined, false));
            } else {
                // T-Bar polygon (8 vertices)
                const pts: Point[] = [
                    { x: cx - hw, y: cy + hh },
                    { x: cx + hw, y: cy + hh },
                    { x: cx + hw, y: cy + hh - tf },
                    { x: cx + w_half, y: cy + hh - tf },
                    { x: cx + w_half, y: cy - hh },
                    { x: cx - w_half, y: cy - hh },
                    { x: cx - w_half, y: cy + hh - tf },
                    { x: cx - hw, y: cy + hh - tf }
                ];
                entities.push(createPolylineEntity(pts, true, layer, colorAlu));
                entities.push(createHatchEntity(pts, 'ANSI31', layer, 'rgba(56, 189, 248, 0.45)', undefined, undefined, false));
            }

            // Centerlines
            const ext = Math.max(8, Math.min(b, h) * 0.2);
            entities.push(createLineEntity({ x: cx - hw - ext, y: cy }, { x: cx + hw + ext, y: cy }, layer, colorCenter));
            entities.push(createLineEntity({ x: cx, y: cy - hh - ext }, { x: cx, y: cy + hh + ext }, layer, colorCenter));
        } else {
            // Elevation / Plan Views
            const dimH = state === 'plan' ? spec.b : spec.h;
            const halfH = dimH / 2;
            const x1 = basePoint.x;
            const x2 = basePoint.x + length;
            const y1 = basePoint.y - halfH;
            const y2 = basePoint.y + halfH;

            // Outer rectangle
            entities.push(createRectangleEntity(
                { x: basePoint.x + length / 2, y: basePoint.y },
                length,
                dimH,
                layer,
                colorAlu
            ));

            // Flange lines
            if (spec.type === 'I' || spec.type === 'H') {
                entities.push(createLineEntity({ x: x1, y: y1 + spec.tf }, { x: x2, y: y1 + spec.tf }, layer, colorHidden));
                entities.push(createLineEntity({ x: x1, y: y2 - spec.tf }, { x: x2, y: y2 - spec.tf }, layer, colorHidden));
            } else {
                entities.push(createLineEntity({ x: x1, y: y2 - spec.tf }, { x: x2, y: y2 - spec.tf }, layer, colorHidden));
            }

            // Centerline
            entities.push(createLineEntity({ x: x1 - 10, y: basePoint.y }, { x: x2 + 10, y: basePoint.y }, layer, colorCenter));
        }

        return entities;
    },
    generate3D: (params, basePos = { x: 0, y: 0, z: 0 }) => {
        const key = String(params.profileKey || 'Alu I 100x50x5');
        const spec = ALU_PROFILES_DB[key] || ALU_PROFILES_DB['Alu I 100x50x5'];
        const length = Number(params.length) || 2000;

        const parts: DynamicPart3DDef[] = [
            {
                name: `Aluminum Profile ${key} L=${length}mm`,
                kind: spec.type === 'T' ? 'T-beam' : 'I-beam',
                color: '#94a3b8',
                position: basePos,
                dimensions: {
                    height: spec.h,
                    width: spec.b,
                    webThickness: spec.tw,
                    flangeThickness: spec.tf,
                    length
                },
                designStandard: spec.standard,
                materialType: 'Aluminum EN AW-6082-T6'
            }
        ];
        return parts;
    },
    getGrips: (params, basePoint = { x: 0, y: 0 }) => {
        const key = String(params.profileKey || 'Alu I 100x50x5');
        const spec = ALU_PROFILES_DB[key] || ALU_PROFILES_DB['Alu I 100x50x5'];
        const length = Number(params.length) || 2000;
        const state = String(params.visState || 'cross_section');

        const grips: DynamicGrip[] = [
            {
                id: 'origin_grip',
                type: 'point',
                paramId: 'basePoint',
                position: basePoint,
                label: 'Center Origin',
                labelTr: 'Merkez Noktası'
            },
            {
                id: 'lookup_profile',
                type: 'lookup',
                paramId: 'profileKey',
                position: { x: basePoint.x + 25, y: basePoint.y + 25 },
                label: `Profile: ${spec.id}`,
                labelTr: `Profil: ${spec.id}`
            }
        ];

        if (state !== 'cross_section') {
            grips.push({
                id: 'stretch_length',
                type: 'stretch',
                paramId: 'length',
                position: { x: basePoint.x + length, y: basePoint.y },
                direction: { x: 1, y: 0 },
                label: `L = ${length} mm`,
                labelTr: `Boy L = ${length} mm`,
                tooltip: 'Drag to stretch aluminum profile length',
                tooltipTr: 'Alüminyum profil boyunu uzatmak için sürükleyin'
            });
        }

        return grips;
    }
};
