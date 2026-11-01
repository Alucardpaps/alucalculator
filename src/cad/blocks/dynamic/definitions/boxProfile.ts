/**
 * 📦 Dynamic Hollow Structural Section (HSS / Kutu Profil) Block
 * 
 * Standards:
 * - EN 10219: Cold formed welded structural hollow sections of non-alloy steels
 * - EN 10210: Hot finished structural hollow sections
 * - EN 755-8: Aluminum extruded hollow tubes (Alüminyum Kutu Profil)
 * 
 * Types:
 * - Square Hollow Sections (SHS / Kare Kutu Profil)
 * - Rectangular Hollow Sections (RHS / Dikdörtgen Kutu Profil)
 * - Parametric custom dimensions (Width W, Height H, Thickness t, Radius r)
 */

import { Point, CadEntity, createLineEntity, createRectangleEntity, createPolylineEntity, createHatchEntity } from '../../../kernel/types';
import { DynamicBlockDef, DynamicGrip, DynamicPart3DDef } from '../types';

export interface BoxProfileSpec {
    id: string;
    type: 'SHS' | 'RHS';
    w: number;         // Width (mm)
    h: number;         // Height (mm)
    t: number;         // Wall thickness (mm)
    rExt: number;      // Outer corner radius (mm, approx 1.5t to 2.0t)
    massKgM: number;   // Linear mass in steel (kg/m, ~7.85 g/cm3)
    massAluKgM: number;// Linear mass in aluminum (kg/m, ~2.70 g/cm3)
    standard: string;
}

export const BOX_PROFILES_DB: Record<string, BoxProfileSpec> = {
    // ── SQUARE HOLLOW SECTIONS (SHS) ──
    'SHS 20x20x2':   { id: 'SHS 20x20x2',   type: 'SHS', w: 20,  h: 20,  t: 2.0, rExt: 3.0, massKgM: 1.12, massAluKgM: 0.38, standard: 'EN 10219' },
    'SHS 25x25x2':   { id: 'SHS 25x25x2',   type: 'SHS', w: 25,  h: 25,  t: 2.0, rExt: 3.5, massKgM: 1.44, massAluKgM: 0.49, standard: 'EN 10219' },
    'SHS 30x30x2.5': { id: 'SHS 30x30x2.5', type: 'SHS', w: 30,  h: 30,  t: 2.5, rExt: 4.0, massKgM: 2.15, massAluKgM: 0.74, standard: 'EN 10219' },
    'SHS 40x40x3':   { id: 'SHS 40x40x3',   type: 'SHS', w: 40,  h: 40,  t: 3.0, rExt: 5.0, massKgM: 3.41, massAluKgM: 1.17, standard: 'EN 10219' },
    'SHS 50x50x3':   { id: 'SHS 50x50x3',   type: 'SHS', w: 50,  h: 50,  t: 3.0, rExt: 5.5, massKgM: 4.35, massAluKgM: 1.50, standard: 'EN 10219' },
    'SHS 60x60x4':   { id: 'SHS 60x60x4',   type: 'SHS', w: 60,  h: 60,  t: 4.0, rExt: 6.5, massKgM: 6.91, massAluKgM: 2.38, standard: 'EN 10219' },
    'SHS 80x80x4':   { id: 'SHS 80x80x4',   type: 'SHS', w: 80,  h: 80,  t: 4.0, rExt: 7.0, massKgM: 9.42, massAluKgM: 3.24, standard: 'EN 10219' },
    'SHS 80x80x5':   { id: 'SHS 80x80x5',   type: 'SHS', w: 80,  h: 80,  t: 5.0, rExt: 8.0, massKgM: 11.5, massAluKgM: 3.96, standard: 'EN 10219' },
    'SHS 100x100x4': { id: 'SHS 100x100x4', type: 'SHS', w: 100, h: 100, t: 4.0, rExt: 8.0, massKgM: 11.9, massAluKgM: 4.10, standard: 'EN 10219' },
    'SHS 100x100x6': { id: 'SHS 100x100x6', type: 'SHS', w: 100, h: 100, t: 6.0, rExt: 10.0,massKgM: 17.3, massAluKgM: 5.95, standard: 'EN 10219' },
    'SHS 120x120x5': { id: 'SHS 120x120x5', type: 'SHS', w: 120, h: 120, t: 5.0, rExt: 9.0, massKgM: 17.8, massAluKgM: 6.13, standard: 'EN 10219' },
    'SHS 150x150x6': { id: 'SHS 150x150x6', type: 'SHS', w: 150, h: 150, t: 6.0, rExt: 12.0,massKgM: 26.7, massAluKgM: 9.19, standard: 'EN 10219' },
    'SHS 200x200x8': { id: 'SHS 200x200x8', type: 'SHS', w: 200, h: 200, t: 8.0, rExt: 16.0,massKgM: 47.1, massAluKgM: 16.2, standard: 'EN 10219' },

    // ── RECTANGULAR HOLLOW SECTIONS (RHS) ──
    'RHS 40x20x2':   { id: 'RHS 40x20x2',   type: 'RHS', w: 40,  h: 20,  t: 2.0, rExt: 3.0, massKgM: 1.75, massAluKgM: 0.60, standard: 'EN 10219' },
    'RHS 50x30x2.5': { id: 'RHS 50x30x2.5', type: 'RHS', w: 50,  h: 30,  t: 2.5, rExt: 4.0, massKgM: 2.93, massAluKgM: 1.01, standard: 'EN 10219' },
    'RHS 60x40x3':   { id: 'RHS 60x40x3',   type: 'RHS', w: 60,  h: 40,  t: 3.0, rExt: 5.0, massKgM: 4.35, massAluKgM: 1.50, standard: 'EN 10219' },
    'RHS 80x40x3':   { id: 'RHS 80x40x3',   type: 'RHS', w: 80,  h: 40,  t: 3.0, rExt: 5.0, massKgM: 5.29, massAluKgM: 1.82, standard: 'EN 10219' },
    'RHS 80x40x4':   { id: 'RHS 80x40x4',   type: 'RHS', w: 80,  h: 40,  t: 4.0, rExt: 6.0, massKgM: 6.91, massAluKgM: 2.38, standard: 'EN 10219' },
    'RHS 100x50x4':  { id: 'RHS 100x50x4',  type: 'RHS', w: 100, h: 50,  t: 4.0, rExt: 7.0, massKgM: 8.79, massAluKgM: 3.02, standard: 'EN 10219' },
    'RHS 100x50x5':  { id: 'RHS 100x50x5',  type: 'RHS', w: 100, h: 50,  t: 5.0, rExt: 8.0, massKgM: 10.7, massAluKgM: 3.69, standard: 'EN 10219' },
    'RHS 120x60x5':  { id: 'RHS 120x60x5',  type: 'RHS', w: 120, h: 60,  t: 5.0, rExt: 9.0, massKgM: 13.1, massAluKgM: 4.51, standard: 'EN 10219' },
    'RHS 150x100x5': { id: 'RHS 150x100x5', type: 'RHS', w: 150, h: 100, t: 5.0, rExt: 9.0, massKgM: 18.5, massAluKgM: 6.37, standard: 'EN 10219' },
    'RHS 150x100x6': { id: 'RHS 150x100x6', type: 'RHS', w: 150, h: 100, t: 6.0, rExt: 11.0,massKgM: 22.0, massAluKgM: 7.57, standard: 'EN 10219' },
    'RHS 200x100x6': { id: 'RHS 200x100x6', type: 'RHS', w: 200, h: 100, t: 6.0, rExt: 11.0,massKgM: 26.7, massAluKgM: 9.19, standard: 'EN 10219' }
};

export const DYN_BOX_PROFILE: DynamicBlockDef = {
    id: 'dyn_box_profile',
    name: 'Hollow Box Profile (SHS / RHS - EN 10219)',
    nameTr: 'Kutu Profil (Kare / Dikdörtgen Profil)',
    category: 'Structural',
    subcategory: 'Steel & Aluminum Hollow Sections',
    subcategoryTr: 'Kutu Profiller (Çelik & Alüminyum)',
    description: 'AutoCAD-grade dynamic hollow structural section (SHS/RHS) with exact wall thicknesses, corner radii, cross-section, elevation, and 3D extrusion.',
    descriptionTr: 'EN 10219 ve EN 10210 normunda kare ve dikdörtgen kutu profiller; et kalınlığı, köşe radyusları, boy esnetme ve atalet momenti.',
    icon: '📦',
    calculatorRoute: '/calculators/beam-deflection/',
    calculatorModuleType: 'beam-deflection',
    calculatorLabelTr: 'Kiriş Mukavemet ve Sehim Hesabına Git',
    citation: {
        tier: 1,
        standard: 'EN 10219-2 / EN 10210-2 / EN 755-8',
        clause: 'Tolerances, dimensions and sectional properties of cold formed and hot finished hollow sections',
        description: 'Standard dimensions W, H, wall thickness t, corner radius r, area A, moments of inertia Ix and Iy.'
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
            { id: 'cross_section', label: 'Cross Section (Enkesit & Et Kalınlığı)', labelTr: 'Enkesit (Et Kalınlığı & Radyus)' },
            { id: 'elevation', label: 'Elevation View (Boy Kesit)', labelTr: 'Boyuna Yan Görünüş' },
            { id: 'plan', label: 'Plan View (Üst Görünüş)', labelTr: 'Üst Plan Görünüşü' }
        ],
        default: 'cross_section'
    },
    lookupParams: [
        {
            id: 'profileKey',
            name: 'profileKey',
            label: 'Standard Profile Specification',
            labelTr: 'Standart Kutu Profil Boyutu',
            options: Object.keys(BOX_PROFILES_DB).map(key => {
                const p = BOX_PROFILES_DB[key];
                return {
                    id: key,
                    label: `${key} (${p.w}×${p.h}×${p.t} mm — ${p.massKgM} kg/m Çelik / ${p.massAluKgM} kg/m Alüminyum)`,
                    standard: p.standard,
                    values: { profileKey: key }
                };
            }),
            default: 'SHS 50x50x3'
        }
    ],
    defaultValues: {
        profileKey: 'SHS 50x50x3',
        length: 2000,
        visState: 'cross_section'
    },
    generate2D: (params, basePoint = { x: 0, y: 0 }) => {
        const key = String(params.profileKey || 'SHS 50x50x3');
        const spec = BOX_PROFILES_DB[key] || BOX_PROFILES_DB['SHS 50x50x3'];
        const length = Number(params.length) || 2000;
        const state = String(params.visState || 'cross_section');

        const entities: CadEntity[] = [];
        const layer = 'layer-struct';
        const colorBox = '#38bdf8';
        const colorHidden = '#0284c7';
        const colorCenter = '#ef4444';

        if (state === 'cross_section') {
            const { w, h, t } = spec;
            const hw = w / 2;
            const hh = h / 2;
            const inW = w - 2 * t;
            const inH = h - 2 * t;
            const inHw = inW / 2;
            const inHh = inH / 2;

            // Outer rectangular boundary
            entities.push(createRectangleEntity(
                basePoint,
                w,
                h,
                layer,
                colorBox
            ));

            // Inner hollow boundary
            entities.push(createRectangleEntity(
                basePoint,
                inW,
                inH,
                layer,
                colorBox
            ));

            // Continuous solid section hatch with inner hole
            const outerPts: Point[] = [
                { x: basePoint.x - hw, y: basePoint.y - hh },
                { x: basePoint.x + hw, y: basePoint.y - hh },
                { x: basePoint.x + hw, y: basePoint.y + hh },
                { x: basePoint.x - hw, y: basePoint.y + hh }
            ];
            const innerHole: Point[] = [
                { x: basePoint.x - inHw, y: basePoint.y - inHh },
                { x: basePoint.x + inHw, y: basePoint.y - inHh },
                { x: basePoint.x + inHw, y: basePoint.y + inHh },
                { x: basePoint.x - inHw, y: basePoint.y + inHh }
            ];

            entities.push(createHatchEntity(
                outerPts,
                'ANSI31',
                layer,
                'rgba(56, 189, 248, 0.45)',
                undefined,
                [innerHole],
                false
            ));

            // Centerlines
            const ext = Math.max(8, Math.min(w, h) * 0.2);
            entities.push(createLineEntity(
                { x: basePoint.x - hw - ext, y: basePoint.y },
                { x: basePoint.x + hw + ext, y: basePoint.y },
                layer,
                colorCenter
            ));
            entities.push(createLineEntity(
                { x: basePoint.x, y: basePoint.y - hh - ext },
                { x: basePoint.x, y: basePoint.y + hh + ext },
                layer,
                colorCenter
            ));
        } else {
            // Elevation / Plan Views
            const dimH = state === 'plan' ? spec.w : spec.h;
            const halfH = dimH / 2;
            const t = spec.t;
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
                colorBox
            ));

            // Inner wall lines (hidden / dashed representation)
            entities.push(createLineEntity({ x: x1, y: y1 + t }, { x: x2, y: y1 + t }, layer, colorHidden));
            entities.push(createLineEntity({ x: x1, y: y2 - t }, { x: x2, y: y2 - t }, layer, colorHidden));

            // Centerline
            entities.push(createLineEntity({ x: x1 - 10, y: basePoint.y }, { x: x2 + 10, y: basePoint.y }, layer, colorCenter));
        }

        return entities;
    },
    generate3D: (params, basePos = { x: 0, y: 0, z: 0 }) => {
        const key = String(params.profileKey || 'SHS 50x50x3');
        const spec = BOX_PROFILES_DB[key] || BOX_PROFILES_DB['SHS 50x50x3'];
        const length = Number(params.length) || 2000;

        const parts: DynamicPart3DDef[] = [
            {
                name: `Box Profile ${key} L=${length}mm`,
                kind: 'tube',
                color: '#64748b',
                position: basePos,
                dimensions: {
                    width: spec.w,
                    height: spec.h,
                    wallThickness: spec.t,
                    length
                },
                designStandard: spec.standard,
                materialType: 'Steel / S235JRH'
            }
        ];
        return parts;
    },
    getGrips: (params, basePoint = { x: 0, y: 0 }) => {
        const key = String(params.profileKey || 'SHS 50x50x3');
        const spec = BOX_PROFILES_DB[key] || BOX_PROFILES_DB['SHS 50x50x3'];
        const length = Number(params.length) || 2000;
        const state = String(params.visState || 'cross_section');

        const grips: DynamicGrip[] = [
            {
                id: 'origin_grip',
                type: 'point',
                paramId: 'basePoint',
                position: basePoint,
                label: 'Insertion Point',
                labelTr: 'Yerleşim Noktası'
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
                tooltip: 'Drag to stretch box profile length',
                tooltipTr: 'Kutu profil boyunu uzatmak için sürükleyin'
            });
        }

        return grips;
    }
};
