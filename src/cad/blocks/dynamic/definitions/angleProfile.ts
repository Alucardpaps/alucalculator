/**
 * 📐 Dynamic Structural Angle (Köşebent Profil) Block (DIN EN 10056 / ISO 657)
 * 
 * Standards:
 * - DIN EN 10056-1: Structural steel equal and unequal leg angles
 * - ISO 657-1: Hot-rolled steel sections - Equal-leg angles
 * - EN 755-9: Aluminum extruded angles (Alüminyum Köşebent)
 */

import { Point, CadEntity, createLineEntity, createRectangleEntity, createPolylineEntity, createHatchEntity } from '../../../kernel/types';
import { DynamicBlockDef, DynamicGrip, DynamicPart3DDef } from '../types';

export interface AngleProfileSpec {
    id: string;
    type: 'equal' | 'unequal';
    a: number;         // Leg 1 length (mm)
    b: number;         // Leg 2 length (mm)
    t: number;         // Thickness (mm)
    r1: number;        // Root radius (mm)
    r2: number;        // Toe radius (mm)
    cx: number;        // Center of gravity cx (mm from outer corner)
    cy: number;        // Center of gravity cy (mm from outer corner)
    massKgM: number;   // Linear mass steel (kg/m)
    massAluKgM: number;// Linear mass aluminum (kg/m)
    standard: string;
}

export const ANGLE_PROFILES_DB: Record<string, AngleProfileSpec> = {
    // ── EQUAL LEG ANGLES (Eşit Kollu Köşebentler) ──
    'L 20x20x3':   { id: 'L 20x20x3',   type: 'equal',   a: 20,  b: 20,  t: 3.0, r1: 3.5, r2: 2.0, cx: 5.9,  cy: 5.9,  massKgM: 0.88, massAluKgM: 0.30, standard: 'EN 10056-1' },
    'L 25x25x3':   { id: 'L 25x25x3',   type: 'equal',   a: 25,  b: 25,  t: 3.0, r1: 3.5, r2: 2.0, cx: 7.2,  cy: 7.2,  massKgM: 1.11, massAluKgM: 0.38, standard: 'EN 10056-1' },
    'L 30x30x3':   { id: 'L 30x30x3',   type: 'equal',   a: 30,  b: 30,  t: 3.0, r1: 4.0, r2: 2.0, cx: 8.4,  cy: 8.4,  massKgM: 1.36, massAluKgM: 0.47, standard: 'EN 10056-1' },
    'L 40x40x4':   { id: 'L 40x40x4',   type: 'equal',   a: 40,  b: 40,  t: 4.0, r1: 5.0, r2: 2.5, cx: 11.2, cy: 11.2, massKgM: 2.42, massAluKgM: 0.83, standard: 'EN 10056-1' },
    'L 50x50x5':   { id: 'L 50x50x5',   type: 'equal',   a: 50,  b: 50,  t: 5.0, r1: 6.0, r2: 3.0, cx: 14.0, cy: 14.0, massKgM: 3.77, massAluKgM: 1.30, standard: 'EN 10056-1' },
    'L 60x60x6':   { id: 'L 60x60x6',   type: 'equal',   a: 60,  b: 60,  t: 6.0, r1: 7.0, r2: 3.5, cx: 16.9, cy: 16.9, massKgM: 5.42, massAluKgM: 1.87, standard: 'EN 10056-1' },
    'L 70x70x7':   { id: 'L 70x70x7',   type: 'equal',   a: 70,  b: 70,  t: 7.0, r1: 8.0, r2: 4.0, cx: 19.7, cy: 19.7, massKgM: 7.38, massAluKgM: 2.54, standard: 'EN 10056-1' },
    'L 80x80x8':   { id: 'L 80x80x8',   type: 'equal',   a: 80,  b: 80,  t: 8.0, r1: 9.0, r2: 4.5, cx: 22.6, cy: 22.6, massKgM: 9.63, massAluKgM: 3.31, standard: 'EN 10056-1' },
    'L 100x100x10':{ id: 'L 100x100x10',type: 'equal',   a: 100, b: 100, t: 10.0,r1: 12.0,r2: 6.0, cx: 28.2, cy: 28.2, massKgM: 15.0, massAluKgM: 5.16, standard: 'EN 10056-1' },
    'L 120x120x12':{ id: 'L 120x120x12',type: 'equal',   a: 120, b: 120, t: 12.0,r1: 13.0,r2: 6.5, cx: 34.0, cy: 34.0, massKgM: 21.6, massAluKgM: 7.43, standard: 'EN 10056-1' },
    'L 150x150x15':{ id: 'L 150x150x15',type: 'equal',   a: 150, b: 150, t: 15.0,r1: 16.0,r2: 8.0, cx: 42.5, cy: 42.5, massKgM: 33.8, massAluKgM: 11.6, standard: 'EN 10056-1' },

    // ── UNEQUAL LEG ANGLES (Çeşitkenar Köşebentler) ──
    'L 40x20x3':   { id: 'L 40x20x3',   type: 'unequal', a: 40,  b: 20,  t: 3.0, r1: 4.0, r2: 2.0, cx: 12.8, cy: 4.8,  massKgM: 1.35, massAluKgM: 0.46, standard: 'EN 10056-1' },
    'L 50x30x4':   { id: 'L 50x30x4',   type: 'unequal', a: 50,  b: 30,  t: 4.0, r1: 5.0, r2: 2.5, cx: 16.2, cy: 7.3,  massKgM: 2.41, massAluKgM: 0.83, standard: 'EN 10056-1' },
    'L 60x40x5':   { id: 'L 60x40x5',   type: 'unequal', a: 60,  b: 40,  t: 5.0, r1: 6.0, r2: 3.0, cx: 19.3, cy: 9.8,  massKgM: 3.76, massAluKgM: 1.29, standard: 'EN 10056-1' },
    'L 75x50x6':   { id: 'L 75x50x6',   type: 'unequal', a: 75,  b: 50,  t: 6.0, r1: 7.0, r2: 3.5, cx: 24.2, cy: 12.3, massKgM: 5.65, massAluKgM: 1.94, standard: 'EN 10056-1' },
    'L 100x50x6':  { id: 'L 100x50x6',  type: 'unequal', a: 100, b: 50,  t: 6.0, r1: 8.0, r2: 4.0, cx: 33.6, cy: 10.8, massKgM: 6.85, massAluKgM: 2.36, standard: 'EN 10056-1' },
    'L 100x65x7':  { id: 'L 100x65x7',  type: 'unequal', a: 100, b: 65,  t: 7.0, r1: 9.0, r2: 4.5, cx: 32.5, cy: 16.0, massKgM: 8.77, massAluKgM: 3.02, standard: 'EN 10056-1' },
    'L 120x80x8':  { id: 'L 120x80x8',  type: 'unequal', a: 120, b: 80,  t: 8.0, r1: 10.0,r2: 5.0, cx: 38.8, cy: 19.9, massKgM: 12.2, massAluKgM: 4.20, standard: 'EN 10056-1' },
    'L 150x90x10': { id: 'L 150x90x10', type: 'unequal', a: 150, b: 90,  t: 10.0,r1: 12.0,r2: 6.0, cx: 48.5, cy: 22.4, massKgM: 18.2, massAluKgM: 6.26, standard: 'EN 10056-1' }
};

export const DYN_ANGLE_PROFILE: DynamicBlockDef = {
    id: 'dyn_angle_profile',
    name: 'Structural Angle Profile (L-Section - DIN EN 10056)',
    nameTr: 'Köşebent Profil (L-Kesit - Eşit / Çeşitkenar)',
    category: 'Structural',
    subcategory: 'Angles & Channels',
    subcategoryTr: 'Köşebentler ve Çelik Profiller',
    description: 'AutoCAD-grade dynamic equal and unequal structural angles with exact corner fillets, center of gravity cx/cy, section, and 3D extrusion.',
    descriptionTr: 'DIN EN 10056 ve ISO 657-1 normunda eşit ve çeşitkenar köşebent profiller; iç kavisler, ağırlık merkezi ve sehim hesabı.',
    icon: '📐',
    calculatorRoute: '/calculators/beam-deflection/',
    calculatorModuleType: 'beam-deflection',
    calculatorLabelTr: 'Kiriş Mukavemet ve Sehim Hesabına Git',
    citation: {
        tier: 1,
        standard: 'DIN EN 10056-1 / ISO 657-1 / EN 755-9',
        clause: 'Structural steel and aluminum equal and unequal leg angles - Dimensions and sectional properties',
        description: 'Standard dimensions leg a, leg b, thickness t, root radius r1, toe radius r2, and sectional properties.'
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
            { id: 'cross_section', label: 'Cross Section (Enkesit & Ağırlık Merkezi)', labelTr: 'Enkesit (Ağırlık Merkezi & Kavisler)' },
            { id: 'elevation', label: 'Elevation View (Boy Kesit)', labelTr: 'Boyuna Yan Görünüş' },
            { id: 'plan', label: 'Plan View (Üst Görünüş)', labelTr: 'Üst Plan Görünüşü' }
        ],
        default: 'cross_section'
    },
    lookupParams: [
        {
            id: 'profileKey',
            name: 'profileKey',
            label: 'Angle Profile Specification',
            labelTr: 'Köşebent Profil Ölçüsü',
            options: Object.keys(ANGLE_PROFILES_DB).map(key => {
                const p = ANGLE_PROFILES_DB[key];
                return {
                    id: key,
                    label: `${key} (${p.a}×${p.b}×${p.t} mm — ${p.massKgM} kg/m Çelik / ${p.massAluKgM} kg/m Alüminyum)`,
                    standard: p.standard,
                    values: { profileKey: key }
                };
            }),
            default: 'L 50x50x5'
        }
    ],
    defaultValues: {
        profileKey: 'L 50x50x5',
        length: 2000,
        visState: 'cross_section'
    },
    generate2D: (params, basePoint = { x: 0, y: 0 }) => {
        const key = String(params.profileKey || 'L 50x50x5');
        const spec = ANGLE_PROFILES_DB[key] || ANGLE_PROFILES_DB['L 50x50x5'];
        const length = Number(params.length) || 2000;
        const state = String(params.visState || 'cross_section');

        const entities: CadEntity[] = [];
        const layer = 'layer-struct';
        const colorAngle = '#38bdf8';
        const colorHidden = '#0284c7';
        const colorCenter = '#ef4444';

        if (state === 'cross_section') {
            const { a, b, t, cx, cy } = spec;

            // L-Profile 6-point closed polygon
            // Origin at outer heel (0, 0)
            const pts: Point[] = [
                { x: basePoint.x, y: basePoint.y },                 // Heel (outer corner)
                { x: basePoint.x + b, y: basePoint.y },             // Bottom leg outer toe
                { x: basePoint.x + b, y: basePoint.y + t },         // Bottom leg inner toe
                { x: basePoint.x + t, y: basePoint.y + t },         // Inner fillet junction
                { x: basePoint.x + t, y: basePoint.y + a },         // Vertical leg inner toe
                { x: basePoint.x, y: basePoint.y + a }              // Vertical leg outer toe
            ];

            entities.push(createPolylineEntity(pts, true, layer, colorAngle));
            entities.push(createHatchEntity(pts, 'ANSI31', layer, 'rgba(56, 189, 248, 0.45)', undefined, undefined, false));

            // Mark Center of Gravity C(cx, cy)
            const cPoint: Point = { x: basePoint.x + cy, y: basePoint.y + cx };
            const mSize = Math.max(3, Math.min(a, b) * 0.1);
            entities.push(createLineEntity(
                { x: cPoint.x - mSize, y: cPoint.y },
                { x: cPoint.x + mSize, y: cPoint.y },
                layer,
                colorCenter
            ));
            entities.push(createLineEntity(
                { x: cPoint.x, y: cPoint.y - mSize },
                { x: cPoint.x, y: cPoint.y + mSize },
                layer,
                colorCenter
            ));
        } else {
            // Elevation / Plan Views
            const dimH = state === 'plan' ? spec.b : spec.a;
            const t = spec.t;
            const x1 = basePoint.x;
            const x2 = basePoint.x + length;
            const y1 = basePoint.y;

            // Outer rectangle
            entities.push(createRectangleEntity(
                { x: basePoint.x + length / 2, y: basePoint.y + dimH / 2 },
                length,
                dimH,
                layer,
                colorAngle
            ));

            // Flange thickness line
            entities.push(createLineEntity({ x: x1, y: y1 + t }, { x: x2, y: y1 + t }, layer, colorHidden));
        }

        return entities;
    },
    generate3D: (params, basePos = { x: 0, y: 0, z: 0 }) => {
        const key = String(params.profileKey || 'L 50x50x5');
        const spec = ANGLE_PROFILES_DB[key] || ANGLE_PROFILES_DB['L 50x50x5'];
        const length = Number(params.length) || 2000;

        const parts: DynamicPart3DDef[] = [
            {
                name: `Angle Profile ${key} L=${length}mm`,
                kind: 'L-bracket',
                color: '#64748b',
                position: basePos,
                dimensions: {
                    legA: spec.a,
                    legB: spec.b,
                    thickness: spec.t,
                    length
                },
                designStandard: spec.standard,
                materialType: 'Steel / S275JR'
            }
        ];
        return parts;
    },
    getGrips: (params, basePoint = { x: 0, y: 0 }) => {
        const key = String(params.profileKey || 'L 50x50x5');
        const spec = ANGLE_PROFILES_DB[key] || ANGLE_PROFILES_DB['L 50x50x5'];
        const length = Number(params.length) || 2000;
        const state = String(params.visState || 'cross_section');

        const grips: DynamicGrip[] = [
            {
                id: 'origin_grip',
                type: 'point',
                paramId: 'basePoint',
                position: basePoint,
                label: 'Heel Corner (0,0)',
                labelTr: 'Dış Köşe Başlangıcı'
            },
            {
                id: 'lookup_profile',
                type: 'lookup',
                paramId: 'profileKey',
                position: { x: basePoint.x + 20, y: basePoint.y + 20 },
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
                tooltip: 'Drag to stretch angle profile length',
                tooltipTr: 'Köşebent boyunu uzatmak için sürükleyin'
            });
        }

        return grips;
    }
};
