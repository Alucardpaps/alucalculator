/**
 * AluCalculator OS — Geometric Cross-Section & Profile Calculation Nodes
 *
 * Implements deterministic section properties (Area, Ix, Iy, Wx, Wy, ix, iy, J, Perimeter)
 * according to international standards (EN 10034, EN 10219, EN 10210, EN 10056, EN 10279).
 * Layer: flow (Pure TypeScript, zero DOM/React dependencies).
 */

import type { EngineeringNodeSchema } from '../../types/core';

export interface SectionProperties {
    type: 'i_beam' | 'rhs' | 'chs' | 'l_angle' | 'c_channel' | 'solid_rect' | 'solid_circle' | 'solid_hex';
    area: number; // mm²
    perimeter: number; // mm
    ix: number; // mm⁴ (Major axis)
    iy: number; // mm⁴ (Minor axis)
    wx: number; // mm³ (Major axis elastic section modulus)
    wy: number; // mm³ (Minor axis elastic section modulus)
    radiusOfGyrationX: number; // mm
    radiusOfGyrationY: number; // mm
    torsionalJ: number; // mm⁴ (Torsional constant / polar moment)
    centroidX: number; // mm
    centroidY: number; // mm
    massPerMeterKg?: number; // kg/m for steel (density = 7850 kg/m³)
    svgPath?: string;
}

// ---------------------------------------------------------------------------
// 1. I-Beam / H-Beam Profile Node (EN 10034 / DIN 1025)
// ---------------------------------------------------------------------------
export const IBeamProfileNode: EngineeringNodeSchema = {
    id: 'geom-i-beam',
    version: '1.0.0',
    title: 'I-Beam / H-Beam Section',
    description: 'Calculates cross-sectional properties for I and H structural beams per EN 10034 / DIN 1025.',
    category: 'geometry',
    deterministic: true,
    isoStandard: 'EN 10034:1993 / DIN 1025',
    inputs: [
        { id: 'h', label: 'Height h (mm)', type: 'length_mm', required: true, defaultValue: 200 },
        { id: 'b', label: 'Flange Width b (mm)', type: 'length_mm', required: true, defaultValue: 100 },
        { id: 'tw', label: 'Web Thickness tw (mm)', type: 'length_mm', required: true, defaultValue: 5.6 },
        { id: 'tf', label: 'Flange Thickness tf (mm)', type: 'length_mm', required: true, defaultValue: 8.5 },
        { id: 'r', label: 'Root Radius r (mm)', type: 'length_mm', required: false, defaultValue: 12 },
    ],
    outputs: [
        { id: 'profile', label: 'Section Profile', type: 'section_profile' },
        { id: 'area', label: 'Cross-Section Area A', type: 'area_mm2' },
        { id: 'ix', label: 'Moment of Inertia Ix', type: 'moment_of_inertia_mm4' },
        { id: 'iy', label: 'Moment of Inertia Iy', type: 'moment_of_inertia_mm4' },
        { id: 'wx', label: 'Elastic Modulus Wx', type: 'section_modulus_mm3' },
        { id: 'wy', label: 'Elastic Modulus Wy', type: 'section_modulus_mm3' },
        { id: 'ix_gyration', label: 'Radius of Gyration ix', type: 'radius_of_gyration_mm' },
        { id: 'iy_gyration', label: 'Radius of Gyration iy', type: 'radius_of_gyration_mm' },
        { id: 'torsion_j', label: 'Torsional Constant It', type: 'moment_of_inertia_mm4' },
        { id: 'perimeter', label: 'Outer Perimeter', type: 'perimeter_mm' },
        { id: 'svg', label: 'SVG Outline', type: 'svg_geometry' },
    ],
    validate: (inputs: Record<string, number>) => {
        const errors: string[] = [];
        const { h = 0, b = 0, tw = 0, tf = 0, r = 0 } = inputs;
        if (h <= 0) errors.push('Beam height h must be > 0');
        if (b <= 0) errors.push('Flange width b must be > 0');
        if (tw <= 0) errors.push('Web thickness tw must be > 0');
        if (tf <= 0) errors.push('Flange thickness tf must be > 0');
        if (2 * tf >= h) errors.push('Total flange thickness (2*tf) cannot exceed or equal beam height h');
        if (tw >= b) errors.push('Web thickness tw cannot exceed flange width b');
        if (r < 0) errors.push('Root radius r cannot be negative');
        return { valid: errors.length === 0, errors, warnings: [] };
    },
    compute: (inputs: Record<string, number>) => {
        const h = Number(inputs.h);
        const b = Number(inputs.b);
        const tw = Number(inputs.tw);
        const tf = Number(inputs.tf);
        const r = Number(inputs.r || 0);

        const hw = h - 2 * tf; // web height
        // Area per EN 10034: A = 2*b*tf + (h - 2*tf)*tw + (4 - pi)*r^2
        const filletArea = (4 - Math.PI) * (r * r);
        const area = 2 * b * tf + hw * tw + filletArea;

        // Moment of Inertia Ix (Major axis bending)
        const filletIx = 4 * ((1 - Math.PI / 4) * (r * r) * Math.pow(hw / 2 + (1 - 2 / (3 * (4 - Math.PI))) * r, 2));
        const ix = (b * Math.pow(h, 3) - (b - tw) * Math.pow(hw, 3)) / 12 + filletIx;

        // Moment of Inertia Iy (Minor axis bending)
        const filletIy = 4 * ((1 - Math.PI / 4) * (r * r) * Math.pow(tw / 2 + (1 - 2 / (3 * (4 - Math.PI))) * r, 2));
        const iy = (2 * tf * Math.pow(b, 3) + hw * Math.pow(tw, 3)) / 12 + filletIy;

        // Elastic Section Moduli
        const wx = ix / (h / 2);
        const wy = iy / (b / 2);

        // Radii of Gyration
        const radiusOfGyrationX = Math.sqrt(ix / area);
        const radiusOfGyrationY = Math.sqrt(iy / area);

        // St. Venant Torsional Constant It approx
        const torsion_j = (2 * b * Math.pow(tf, 3) + hw * Math.pow(tw, 3)) / 3 + 0.15 * Math.pow(r, 4);

        // Perimeter
        const perimeter = 4 * b + 2 * h - 2 * tw - (8 - 2 * Math.PI) * r;

        // SVG Outline (Centered at 0,0)
        const x1 = -b / 2;
        const x2 = -tw / 2;
        const x3 = tw / 2;
        const x4 = b / 2;
        const yTop = -h / 2;
        const yFlangeB = -h / 2 + tf;
        const yFlangeT = h / 2 - tf;
        const yBot = h / 2;

        const svgPath = `M ${x1} ${yTop} L ${x4} ${yTop} L ${x4} ${yFlangeB} L ${x3} ${yFlangeB} L ${x3} ${yFlangeT} L ${x4} ${yFlangeT} L ${x4} ${yBot} L ${x1} ${yBot} L ${x1} ${yFlangeT} L ${x2} ${yFlangeT} L ${x2} ${yFlangeB} L ${x1} ${yFlangeB} Z`;

        const profile: SectionProperties = {
            type: 'i_beam',
            area,
            perimeter,
            ix,
            iy,
            wx,
            wy,
            radiusOfGyrationX,
            radiusOfGyrationY,
            torsionalJ: torsion_j,
            centroidX: 0,
            centroidY: 0,
            massPerMeterKg: (area * 7850) / 1e6,
            svgPath,
        };

        return {
            profile,
            area,
            ix,
            iy,
            wx,
            wy,
            ix_gyration: radiusOfGyrationX,
            iy_gyration: radiusOfGyrationY,
            torsion_j,
            perimeter,
            svg: svgPath,
        };
    },
};

// ---------------------------------------------------------------------------
// 2. RHS Box Tube / Rectangular Hollow Section Node (EN 10219 / ASTM A500)
// ---------------------------------------------------------------------------
export const RHSProfileNode: EngineeringNodeSchema = {
    id: 'geom-rhs-tube',
    version: '1.0.0',
    title: 'RHS Box / Hollow Section',
    description: 'Calculates section properties for rectangular and square structural hollow tubes per EN 10219.',
    category: 'geometry',
    deterministic: true,
    isoStandard: 'EN 10219-2:2019',
    inputs: [
        { id: 'b', label: 'Width B (mm)', type: 'length_mm', required: true, defaultValue: 100 },
        { id: 'h', label: 'Height H (mm)', type: 'length_mm', required: true, defaultValue: 150 },
        { id: 't', label: 'Wall Thickness t (mm)', type: 'length_mm', required: true, defaultValue: 5 },
    ],
    outputs: [
        { id: 'profile', label: 'Section Profile', type: 'section_profile' },
        { id: 'area', label: 'Cross-Section Area A', type: 'area_mm2' },
        { id: 'ix', label: 'Moment of Inertia Ix', type: 'moment_of_inertia_mm4' },
        { id: 'iy', label: 'Moment of Inertia Iy', type: 'moment_of_inertia_mm4' },
        { id: 'wx', label: 'Elastic Modulus Wx', type: 'section_modulus_mm3' },
        { id: 'wy', label: 'Elastic Modulus Wy', type: 'section_modulus_mm3' },
        { id: 'ix_gyration', label: 'Radius of Gyration ix', type: 'radius_of_gyration_mm' },
        { id: 'iy_gyration', label: 'Radius of Gyration iy', type: 'radius_of_gyration_mm' },
        { id: 'torsion_j', label: 'Torsional Constant J', type: 'moment_of_inertia_mm4' },
        { id: 'perimeter', label: 'Outer Perimeter', type: 'perimeter_mm' },
        { id: 'svg', label: 'SVG Outline', type: 'svg_geometry' },
    ],
    validate: (inputs: Record<string, number>) => {
        const errors: string[] = [];
        const { b = 0, h = 0, t = 0 } = inputs;
        if (b <= 0) errors.push('Width B must be > 0');
        if (h <= 0) errors.push('Height H must be > 0');
        if (t <= 0) errors.push('Wall thickness t must be > 0');
        if (2 * t >= b) errors.push('Double wall thickness (2*t) must be less than width B');
        if (2 * t >= h) errors.push('Double wall thickness (2*t) must be less than height H');
        return { valid: errors.length === 0, errors, warnings: [] };
    },
    compute: (inputs: Record<string, number>) => {
        const b = Number(inputs.b);
        const h = Number(inputs.h);
        const t = Number(inputs.t);

        const bi = b - 2 * t;
        const hi = h - 2 * t;

        const area = b * h - bi * hi;
        const ix = (b * Math.pow(h, 3) - bi * Math.pow(hi, 3)) / 12;
        const iy = (h * Math.pow(b, 3) - hi * Math.pow(bi, 3)) / 12;

        const wx = ix / (h / 2);
        const wy = iy / (b / 2);

        const radiusOfGyrationX = Math.sqrt(ix / area);
        const radiusOfGyrationY = Math.sqrt(iy / area);

        const bm = b - t;
        const hm = h - t;
        const torsion_j = (2 * t * Math.pow(bm, 2) * Math.pow(hm, 2)) / (bm + hm);

        const perimeter = 2 * (b + h);

        const svgPath = `M ${-b / 2} ${-h / 2} L ${b / 2} ${-h / 2} L ${b / 2} ${h / 2} L ${-b / 2} ${h / 2} Z M ${-bi / 2} ${-hi / 2} L ${-bi / 2} ${hi / 2} L ${bi / 2} ${hi / 2} L ${bi / 2} ${-hi / 2} Z`;

        const profile: SectionProperties = {
            type: 'rhs',
            area,
            perimeter,
            ix,
            iy,
            wx,
            wy,
            radiusOfGyrationX,
            radiusOfGyrationY,
            torsionalJ: torsion_j,
            centroidX: 0,
            centroidY: 0,
            massPerMeterKg: (area * 7850) / 1e6,
            svgPath,
        };

        return {
            profile,
            area,
            ix,
            iy,
            wx,
            wy,
            ix_gyration: radiusOfGyrationX,
            iy_gyration: radiusOfGyrationY,
            torsion_j,
            perimeter,
            svg: svgPath,
        };
    },
};

// ---------------------------------------------------------------------------
// 3. CHS Circular Hollow Section / Pipe Node (EN 10210 / ASTM A53)
// ---------------------------------------------------------------------------
export const CHSProfileNode: EngineeringNodeSchema = {
    id: 'geom-chs-pipe',
    version: '1.0.0',
    title: 'CHS Circular Hollow / Pipe',
    description: 'Calculates cross-sectional properties for circular hollow tubes and pipes per EN 10210.',
    category: 'geometry',
    deterministic: true,
    isoStandard: 'EN 10210-2:2019',
    inputs: [
        { id: 'd_ext', label: 'Outer Diameter D (mm)', type: 'diameter_mm', required: true, defaultValue: 114.3 },
        { id: 't', label: 'Wall Thickness t (mm)', type: 'length_mm', required: true, defaultValue: 6.3 },
    ],
    outputs: [
        { id: 'profile', label: 'Section Profile', type: 'section_profile' },
        { id: 'area', label: 'Cross-Section Area A', type: 'area_mm2' },
        { id: 'ix', label: 'Moment of Inertia Ix = Iy', type: 'moment_of_inertia_mm4' },
        { id: 'wx', label: 'Elastic Modulus W', type: 'section_modulus_mm3' },
        { id: 'radius_gyration', label: 'Radius of Gyration i', type: 'radius_of_gyration_mm' },
        { id: 'polar_j', label: 'Polar / Torsional Moment J', type: 'moment_of_inertia_mm4' },
        { id: 'perimeter', label: 'Outer Perimeter', type: 'perimeter_mm' },
        { id: 'svg', label: 'SVG Outline', type: 'svg_geometry' },
    ],
    validate: (inputs: Record<string, number>) => {
        const errors: string[] = [];
        const { d_ext = 0, t = 0 } = inputs;
        if (d_ext <= 0) errors.push('Outer diameter D must be > 0');
        if (t <= 0) errors.push('Wall thickness t must be > 0');
        if (2 * t >= d_ext) errors.push('Wall thickness 2*t cannot exceed or equal outer diameter D');
        return { valid: errors.length === 0, errors, warnings: [] };
    },
    compute: (inputs: Record<string, number>) => {
        const D = Number(inputs.d_ext);
        const t = Number(inputs.t);
        const d = D - 2 * t;

        const area = (Math.PI / 4) * (Math.pow(D, 2) - Math.pow(d, 2));
        const ix = (Math.PI / 64) * (Math.pow(D, 4) - Math.pow(d, 4));
        const wx = (Math.PI / 32) * (Math.pow(D, 4) - Math.pow(d, 4)) / D;
        const polar_j = 2 * ix;
        const radius_gyration = Math.sqrt((Math.pow(D, 2) + Math.pow(d, 2)) / 16);
        const perimeter = Math.PI * D;

        const rOut = D / 2;
        const rIn = d / 2;
        const svgPath = `M 0 ${-rOut} A ${rOut} ${rOut} 0 1 0 0 ${rOut} A ${rOut} ${rOut} 0 1 0 0 ${-rOut} Z M 0 ${-rIn} A ${rIn} ${rIn} 0 1 1 0 ${rIn} A ${rIn} ${rIn} 0 1 1 0 ${-rIn} Z`;

        const profile: SectionProperties = {
            type: 'chs',
            area,
            perimeter,
            ix,
            iy: ix,
            wx,
            wy: wx,
            radiusOfGyrationX: radius_gyration,
            radiusOfGyrationY: radius_gyration,
            torsionalJ: polar_j,
            centroidX: 0,
            centroidY: 0,
            massPerMeterKg: (area * 7850) / 1e6,
            svgPath,
        };

        return {
            profile,
            area,
            ix,
            wx,
            radius_gyration,
            polar_j,
            perimeter,
            svg: svgPath,
        };
    },
};

// ---------------------------------------------------------------------------
// 4. L-Angle Profile Node (EN 10056 / DIN 1028)
// ---------------------------------------------------------------------------
export const LAngleProfileNode: EngineeringNodeSchema = {
    id: 'geom-l-angle',
    version: '1.0.0',
    title: 'L-Angle Profile (Equal/Unequal)',
    description: 'Calculates section properties and principal centroidal axes for L-angles per EN 10056.',
    category: 'geometry',
    deterministic: true,
    isoStandard: 'EN 10056-1:2017',
    inputs: [
        { id: 'a', label: 'Vertical Leg a (mm)', type: 'length_mm', required: true, defaultValue: 100 },
        { id: 'b', label: 'Horizontal Leg b (mm)', type: 'length_mm', required: true, defaultValue: 100 },
        { id: 't', label: 'Leg Thickness t (mm)', type: 'length_mm', required: true, defaultValue: 10 },
    ],
    outputs: [
        { id: 'profile', label: 'Section Profile', type: 'section_profile' },
        { id: 'area', label: 'Cross-Section Area A', type: 'area_mm2' },
        { id: 'centroid_x', label: 'Centroid xc (from back)', type: 'centroid_mm' },
        { id: 'centroid_y', label: 'Centroid yc (from back)', type: 'centroid_mm' },
        { id: 'ix', label: 'Centroidal Inertia Ix', type: 'moment_of_inertia_mm4' },
        { id: 'iy', label: 'Centroidal Inertia Iy', type: 'moment_of_inertia_mm4' },
        { id: 'wx', label: 'Minimum Section Modulus Wx', type: 'section_modulus_mm3' },
        { id: 'wy', label: 'Minimum Section Modulus Wy', type: 'section_modulus_mm3' },
        { id: 'perimeter', label: 'Perimeter', type: 'perimeter_mm' },
        { id: 'svg', label: 'SVG Outline', type: 'svg_geometry' },
    ],
    validate: (inputs: Record<string, number>) => {
        const errors: string[] = [];
        const { a = 0, b = 0, t = 0 } = inputs;
        if (a <= 0) errors.push('Leg a must be > 0');
        if (b <= 0) errors.push('Leg b must be > 0');
        if (t <= 0) errors.push('Thickness t must be > 0');
        if (t >= a || t >= b) errors.push('Thickness t must be less than both legs a and b');
        return { valid: errors.length === 0, errors, warnings: [] };
    },
    compute: (inputs: Record<string, number>) => {
        const a = Number(inputs.a);
        const b = Number(inputs.b);
        const t = Number(inputs.t);

        const a1 = t * (a - t);
        const x1 = t / 2;
        const y1 = t + (a - t) / 2;

        const a2 = b * t;
        const x2 = b / 2;
        const y2 = t / 2;

        const area = a1 + a2;
        const centroid_x = (a1 * x1 + a2 * x2) / area;
        const centroid_y = (a1 * y1 + a2 * y2) / area;

        const ix1 = (t * Math.pow(a - t, 3)) / 12 + a1 * Math.pow(y1 - centroid_y, 2);
        const ix2 = (b * Math.pow(t, 3)) / 12 + a2 * Math.pow(y2 - centroid_y, 2);
        const ix = ix1 + ix2;

        const iy1 = ((a - t) * Math.pow(t, 3)) / 12 + a1 * Math.pow(x1 - centroid_x, 2);
        const iy2 = (t * Math.pow(b, 3)) / 12 + a2 * Math.pow(x2 - centroid_x, 2);
        const iy = iy1 + iy2;

        const wx = ix / Math.max(centroid_y, a - centroid_y);
        const wy = iy / Math.max(centroid_x, b - centroid_x);

        const radiusOfGyrationX = Math.sqrt(ix / area);
        const radiusOfGyrationY = Math.sqrt(iy / area);
        const torsionalJ = (a + b - t) * Math.pow(t, 3) / 3;
        const perimeter = 2 * (a + b);

        const svgPath = `M 0 0 L ${b} 0 L ${b} ${t} L ${t} ${t} L ${t} ${a} L 0 ${a} Z`;

        const profile: SectionProperties = {
            type: 'l_angle',
            area,
            perimeter,
            ix,
            iy,
            wx,
            wy,
            radiusOfGyrationX,
            radiusOfGyrationY,
            torsionalJ,
            centroidX: centroid_x,
            centroidY: centroid_y,
            massPerMeterKg: (area * 7850) / 1e6,
            svgPath,
        };

        return {
            profile,
            area,
            centroid_x,
            centroid_y,
            ix,
            iy,
            wx,
            wy,
            perimeter,
            svg: svgPath,
        };
    },
};

// ---------------------------------------------------------------------------
// 5. C-Channel / U-Profile Node (EN 10279 / DIN 1026)
// ---------------------------------------------------------------------------
export const CChannelProfileNode: EngineeringNodeSchema = {
    id: 'geom-c-channel',
    version: '1.0.0',
    title: 'C-Channel / U-Profile',
    description: 'Calculates cross-sectional properties for structural U-channels per EN 10279 / DIN 1026.',
    category: 'geometry',
    deterministic: true,
    isoStandard: 'EN 10279:2000 / DIN 1026-1',
    inputs: [
        { id: 'h', label: 'Channel Height h (mm)', type: 'length_mm', required: true, defaultValue: 160 },
        { id: 'b', label: 'Flange Width b (mm)', type: 'length_mm', required: true, defaultValue: 65 },
        { id: 'tw', label: 'Web Thickness tw (mm)', type: 'length_mm', required: true, defaultValue: 7.5 },
        { id: 'tf', label: 'Flange Thickness tf (mm)', type: 'length_mm', required: true, defaultValue: 10.5 },
    ],
    outputs: [
        { id: 'profile', label: 'Section Profile', type: 'section_profile' },
        { id: 'area', label: 'Cross-Section Area A', type: 'area_mm2' },
        { id: 'centroid_x', label: 'Centroid e (from back)', type: 'centroid_mm' },
        { id: 'ix', label: 'Moment of Inertia Ix', type: 'moment_of_inertia_mm4' },
        { id: 'iy', label: 'Moment of Inertia Iy', type: 'moment_of_inertia_mm4' },
        { id: 'wx', label: 'Elastic Modulus Wx', type: 'section_modulus_mm3' },
        { id: 'wy', label: 'Elastic Modulus Wy', type: 'section_modulus_mm3' },
        { id: 'perimeter', label: 'Perimeter', type: 'perimeter_mm' },
        { id: 'svg', label: 'SVG Outline', type: 'svg_geometry' },
    ],
    validate: (inputs: Record<string, number>) => {
        const errors: string[] = [];
        const { h = 0, b = 0, tw = 0, tf = 0 } = inputs;
        if (h <= 0) errors.push('Channel height h must be > 0');
        if (b <= 0) errors.push('Flange width b must be > 0');
        if (tw <= 0) errors.push('Web thickness tw must be > 0');
        if (tf <= 0) errors.push('Flange thickness tf must be > 0');
        if (2 * tf >= h) errors.push('Flanges (2*tf) must be less than height h');
        if (tw >= b) errors.push('Web thickness tw must be less than flange width b');
        return { valid: errors.length === 0, errors, warnings: [] };
    },
    compute: (inputs: Record<string, number>) => {
        const h = Number(inputs.h);
        const b = Number(inputs.b);
        const tw = Number(inputs.tw);
        const tf = Number(inputs.tf);

        const hw = h - 2 * tf;
        const area = 2 * b * tf + hw * tw;

        const areaFlanges = 2 * (b - tw) * tf;
        const xFlanges = tw + (b - tw) / 2;
        const areaWeb = h * tw;
        const xWeb = tw / 2;
        const centroid_x = (areaFlanges * xFlanges + areaWeb * xWeb) / area;

        const ix = (b * Math.pow(h, 3) - (b - tw) * Math.pow(hw, 3)) / 12;

        const iyFlanges = 2 * ((tf * Math.pow(b - tw, 3)) / 12 + (b - tw) * tf * Math.pow(xFlanges - centroid_x, 2));
        const iyWeb = (h * Math.pow(tw, 3)) / 12 + areaWeb * Math.pow(xWeb - centroid_x, 2);
        const iy = iyFlanges + iyWeb;

        const wx = ix / (h / 2);
        const wy = iy / Math.max(centroid_x, b - centroid_x);

        const radiusOfGyrationX = Math.sqrt(ix / area);
        const radiusOfGyrationY = Math.sqrt(iy / area);
        const torsionalJ = (2 * b * Math.pow(tf, 3) + hw * Math.pow(tw, 3)) / 3;
        const perimeter = 2 * h + 4 * b - 2 * tw;

        const svgPath = `M 0 0 L ${b} 0 L ${b} ${tf} L ${tw} ${tf} L ${tw} ${h - tf} L ${b} ${h - tf} L ${b} ${h} L 0 ${h} Z`;

        const profile: SectionProperties = {
            type: 'c_channel',
            area,
            perimeter,
            ix,
            iy,
            wx,
            wy,
            radiusOfGyrationX,
            radiusOfGyrationY,
            torsionalJ,
            centroidX: centroid_x,
            centroidY: h / 2,
            massPerMeterKg: (area * 7850) / 1e6,
            svgPath,
        };

        return {
            profile,
            area,
            centroid_x,
            ix,
            iy,
            wx,
            wy,
            perimeter,
            svg: svgPath,
        };
    },
};

// ---------------------------------------------------------------------------
// 6. Solid Section Profile Node (Rectangle / Round / Hexagon)
// ---------------------------------------------------------------------------
export const SolidSectionNode: EngineeringNodeSchema = {
    id: 'geom-solid-section',
    version: '1.0.0',
    title: 'Solid Section (Bar / Rod / Hex)',
    description: 'Calculates engineering cross-section properties for solid bars, shafts, and hex profiles.',
    category: 'geometry',
    deterministic: true,
    isoStandard: 'ISO 657 / DIN 1013 / DIN 1014',
    inputs: [
        { id: 'shape_type', label: 'Shape (0=Rect, 1=Round, 2=Hex)', type: 'number', required: true, defaultValue: 0 },
        { id: 'dim1', label: 'Dimension 1: b or D (mm)', type: 'length_mm', required: true, defaultValue: 50 },
        { id: 'dim2', label: 'Dimension 2: h or Across Flats s (mm)', type: 'length_mm', required: false, defaultValue: 80 },
    ],
    outputs: [
        { id: 'profile', label: 'Section Profile', type: 'section_profile' },
        { id: 'area', label: 'Cross-Section Area A', type: 'area_mm2' },
        { id: 'ix', label: 'Moment of Inertia Ix', type: 'moment_of_inertia_mm4' },
        { id: 'iy', label: 'Moment of Inertia Iy', type: 'moment_of_inertia_mm4' },
        { id: 'wx', label: 'Elastic Modulus Wx', type: 'section_modulus_mm3' },
        { id: 'wy', label: 'Elastic Modulus Wy', type: 'section_modulus_mm3' },
        { id: 'torsion_j', label: 'Torsional Constant J', type: 'moment_of_inertia_mm4' },
        { id: 'perimeter', label: 'Perimeter', type: 'perimeter_mm' },
        { id: 'svg', label: 'SVG Outline', type: 'svg_geometry' },
    ],
    validate: (inputs: Record<string, number>) => {
        const errors: string[] = [];
        const { shape_type = 0, dim1 = 0, dim2 = 0 } = inputs;
        if (dim1 <= 0) errors.push('Dimension 1 must be > 0');
        if (shape_type === 0 && dim2 <= 0) errors.push('For rectangular bars, Dimension 2 (h) must be > 0');
        return { valid: errors.length === 0, errors, warnings: [] };
    },
    compute: (inputs: Record<string, number>) => {
        const shape = Math.round(Number(inputs.shape_type || 0));
        const dim1 = Number(inputs.dim1);
        const dim2 = Number(inputs.dim2 || dim1);

        let area = 0;
        let ix = 0;
        let iy = 0;
        let wx = 0;
        let wy = 0;
        let torsion_j = 0;
        let perimeter = 0;
        let svgPath = '';
        let profileType: SectionProperties['type'] = 'solid_rect';

        if (shape === 1) {
            profileType = 'solid_circle';
            const D = dim1;
            area = (Math.PI / 4) * Math.pow(D, 2);
            ix = (Math.PI / 64) * Math.pow(D, 4);
            iy = ix;
            wx = (Math.PI / 32) * Math.pow(D, 3);
            wy = wx;
            torsion_j = (Math.PI / 32) * Math.pow(D, 4);
            perimeter = Math.PI * D;
            const r = D / 2;
            svgPath = `M 0 ${-r} A ${r} ${r} 0 1 0 0 ${r} A ${r} ${r} 0 1 0 0 ${-r} Z`;
        } else if (shape === 2) {
            profileType = 'solid_hex';
            const s = dim1;
            area = (Math.sqrt(3) / 2) * Math.pow(s, 2);
            ix = (5 * Math.sqrt(3) / 72) * Math.pow(s, 4);
            iy = ix;
            wx = ix / (s / 2);
            wy = wx;
            torsion_j = 0.8 * ix * 2;
            perimeter = 6 * (s / Math.sqrt(3));
            const R = s / Math.sqrt(3);
            const pts: string[] = [];
            for (let i = 0; i < 6; i++) {
                const ang = (Math.PI / 3) * i;
                pts.push(`${R * Math.cos(ang)} ${R * Math.sin(ang)}`);
            }
            svgPath = `M ${pts.join(' L ')} Z`;
        } else {
            profileType = 'solid_rect';
            const b = dim1;
            const h = dim2;
            area = b * h;
            ix = (b * Math.pow(h, 3)) / 12;
            iy = (h * Math.pow(b, 3)) / 12;
            wx = (b * Math.pow(h, 2)) / 6;
            wy = (h * Math.pow(b, 2)) / 6;
            const a_max = Math.max(b, h);
            const b_min = Math.min(b, h);
            const ratio = a_max / b_min;
            const beta = (1 / 3) * (1 - 0.63 / ratio + 0.052 / Math.pow(ratio, 5));
            torsion_j = beta * a_max * Math.pow(b_min, 3);
            perimeter = 2 * (b + h);
            svgPath = `M ${-b / 2} ${-h / 2} L ${b / 2} ${-h / 2} L ${b / 2} ${h / 2} L ${-b / 2} ${h / 2} Z`;
        }

        const radiusOfGyrationX = Math.sqrt(ix / area);
        const radiusOfGyrationY = Math.sqrt(iy / area);

        const profile: SectionProperties = {
            type: profileType,
            area,
            perimeter,
            ix,
            iy,
            wx,
            wy,
            radiusOfGyrationX,
            radiusOfGyrationY,
            torsionalJ: torsion_j,
            centroidX: 0,
            centroidY: 0,
            massPerMeterKg: (area * 7850) / 1e6,
            svgPath,
        };

        return {
            profile,
            area,
            ix,
            iy,
            wx,
            wy,
            torsion_j,
            perimeter,
            svg: svgPath,
        };
    },
};

// ---------------------------------------------------------------------------
// 7. Geometry Transfer Bridge Node
// Transfers complex profile outputs directly into downstream mechanical solvers
// ---------------------------------------------------------------------------
export const GeometryBridgeNode: EngineeringNodeSchema = {
    id: 'geom-transfer-bridge',
    version: '1.0.0',
    title: 'Geometry Transfer Bridge',
    description: 'Bridges section profile properties (A, Ix, Wx, J, Perimeter) directly to downstream solvers and solvers.',
    category: 'geometry',
    deterministic: true,
    isoStandard: 'ISO 10303 (STEP AP214) / Section Mechanics',
    inputs: [
        { id: 'profile', label: 'Section Profile', type: 'section_profile', required: true },
    ],
    outputs: [
        { id: 'area', label: 'Area A (mm²)', type: 'area_mm2' },
        { id: 'ix', label: 'Major Inertia Ix (mm⁴)', type: 'moment_of_inertia_mm4' },
        { id: 'iy', label: 'Minor Inertia Iy (mm⁴)', type: 'moment_of_inertia_mm4' },
        { id: 'wx', label: 'Major Modulus Wx (mm³)', type: 'section_modulus_mm3' },
        { id: 'wy', label: 'Minor Modulus Wy (mm³)', type: 'section_modulus_mm3' },
        { id: 'd_eq', label: 'Equivalent Diameter (mm)', type: 'diameter_mm' },
        { id: 'torsion_j', label: 'Torsional J (mm⁴)', type: 'moment_of_inertia_mm4' },
        { id: 'perimeter', label: 'Perimeter (mm)', type: 'perimeter_mm' },
        { id: 'svg', label: 'SVG Outline', type: 'svg_geometry' },
    ],
    validate: (inputs: { profile?: SectionProperties }) => {
        if (!inputs.profile || typeof inputs.profile !== 'object') {
            return { valid: false, errors: ['Profile object is missing or invalid'], warnings: [] };
        }
        return { valid: true, errors: [], warnings: [] };
    },
    compute: (inputs: { profile: SectionProperties }) => {
        const p = inputs.profile;
        const area = p.area || 0;
        const d_eq = Math.sqrt((4 * area) / Math.PI); // Diameter of circle with equivalent area

        return {
            area,
            ix: p.ix || 0,
            iy: p.iy || 0,
            wx: p.wx || 0,
            wy: p.wy || 0,
            d_eq,
            torsion_j: p.torsionalJ || 0,
            perimeter: p.perimeter || 0,
            svg: p.svgPath || '',
        };
    },
};
