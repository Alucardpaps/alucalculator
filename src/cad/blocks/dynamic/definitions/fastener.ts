/**
 * 🔩 Universal Metric Fastener & Hole Dynamic Block (ISO / DIN / ASME / VDI 2230)
 * 
 * Complies with:
 * - ISO 4014 / DIN 931: Hexagon head bolts with shank
 * - ISO 4017 / DIN 933: Hexagon head bolts full thread
 * - DIN 912 / ISO 4762: Hexagon socket head cap screws (İmbus)
 * - DIN 7991 / ISO 10642: Countersunk socket head screws 90°
 * - ISO 7380-1: Button head socket screws (Bombeli)
 * - DIN 6921 / EN 1665: Hexagon flange bolts
 * - ISO 4032 / DIN 934: Hexagon regular nuts Form 1
 * - ISO 4035 / DIN 439: Hexagon thin nuts (Kontra Somun)
 * - DIN 985 / ISO 10511: Prevailing torque type hexagon nuts with non-metallic insert (Nyloc)
 * - DIN 1587: Hexagon domed cap nuts (Kör / Kubbeli Somun)
 * - DIN 6923 / EN 1661: Hexagon nuts with flange
 * - ISO 7089 / DIN 125-A: Plain washers Form A
 * - ISO 7093 / DIN 9021: Large plain washers Form C (Geniş Pul)
 * - DIN 127: Spring lock washers Form B
 * - ISO 273: Clearance holes for bolts and screws (Close, Medium, Free)
 * - DIN 974-1: Counterbores for socket head cap screws
 * - DIN 74 Form A: Countersinks 90° for countersunk screws
 * - ISO 68-1 / ISO 261 / ISO 6410: Metric screw threads and technical drawings for holes
 * - VDI 2230 / ISO 898-1: Systematic calculation of high-duty bolted joints
 * 
 * FEATURES:
 * - Single universal block for ALL metric fasteners: M3 to M36
 * - Component modes: Assembly, Bolt only, Nut only (zero bolt!), Washer only, Tapped Joint, Clearance Hole, Tapped Hole
 * - Linear stretch: Shank Length (L), Thread Length (b), Hole Depth (Lh), Tap Depth (Lth)
 * - Paso / Thread Pitch selection: Coarse (ISO 261), Fine (ISO metric fine), Custom pitch
 * - Paso / Thread Length selection: ISO 4014 standard (b = 2d + 6/12/25), Full thread (DIN 933), Custom thread length with on-canvas stretch grip
 * - 5 Head Types: Hex Bolt, Socket Cap (İmbus), Countersunk 90°, Button Head, Flange Bolt
 * - 5 Nut Types: Regular Hex, Thin Jam Nut, Nyloc Lock Nut, Dome Cap Nut, Flange Nut
 * - 4 Washer Types: Standard Plain, Large Wide, Spring Lock, None
 * - 5 Hole Types: Clearance Through (ISO 273), Counterbore (DIN 974), Countersink 90° (DIN 74), Tapped Blind Hole with 118° drill cone, Tapped Through
 * - Projection Views: Side Detailed (ISO thread root lines & chamfer), Side Section (ISO 128 / TS 88-20 45° hatching), Side Schematic, Top Head, Top Nut, Top Hole
 * - 3D Solid Assembly: Multi-part solid modeling strictly matching active component mode
 */

import { Point, CadEntity, createLineEntity, createRectangleEntity, createHexagonEntity, createCircleEntity, createArcEntity } from '../../../kernel/types';
import { DynamicBlockDef, DynamicGrip, DynamicPart3DDef } from '../types';
import { getBoltHeadDimensions, BoltTypeId } from '../../../../data/boltHeadStandards';

export interface MetricFastenerSpec {
    pitch: number;           // Standard coarse pitch (ISO 261, mm)
    finePitches: number[];   // Common ISO metric fine pitches (mm)
    mNut: number;            // ISO 4032 regular nut height (mm)
    mThin: number;           // DIN 439 thin jam nut height (mm)
    mNyloc: number;          // DIN 985 nyloc nut height (mm)
    hCap: number;            // DIN 1587 domed cap nut total height (mm)
    mFlange: number;         // DIN 6923 flange nut height (mm)
    dFlangeNut: number;      // DIN 6923 flange nut skirt diameter (mm)
    sHex: number;            // ISO 4032 nut across flats (mm)
    tWasher: number;         // ISO 7089 Form A washer thickness (mm)
    dWasher: number;         // ISO 7089 Form A washer outer diameter (mm)
    tWasherLarge: number;    // ISO 7093 Form C large washer thickness (mm)
    dWasherLarge: number;    // ISO 7093 Form C large washer outer diameter (mm)
    tSpring: number;         // DIN 127 spring washer thickness (mm)
    dSpring: number;         // DIN 127 spring washer outer diameter (mm)
    dTap: number;            // Standard tap drill diameter (mm)
    dhClose: number;         // ISO 273 Close clearance hole (mm)
    dhMed: number;           // ISO 273 Medium clearance hole (mm)
    dhFree: number;          // ISO 273 Free clearance hole (mm)
    cbDia: number;           // DIN 974-1 counterbore diameter (mm)
    cbDepth: number;         // DIN 974-1 counterbore depth (mm)
    csDia: number;           // DIN 74 Form A countersink diameter (mm)
    As: number;              // Nominal tensile stress area (mm²)
    preload88: number;       // VDI 2230 standard preload FM (kN) for grade 8.8 (approx mu=0.14)
    torque88: number;        // VDI 2230 standard tightening torque MA (N.m) for grade 8.8 (approx mu=0.14)
}

export const METRIC_FASTENER_SPECS: Record<string, MetricFastenerSpec> = {
    M3:  { pitch: 0.5,  finePitches: [0.35],       mNut: 2.4,  mThin: 1.8, mNyloc: 4.0,  hCap: 6.0,  mFlange: 4.0,  dFlangeNut: 8.0,  sHex: 5.5,  tWasher: 0.5, dWasher: 7.0,  tWasherLarge: 0.8, dWasherLarge: 9.0,  tSpring: 0.8, dSpring: 6.2,  dTap: 2.5,  dhClose: 3.2,  dhMed: 3.4,  dhFree: 3.6,  cbDia: 6.0,  cbDepth: 3.5,  csDia: 6.5,  As: 5.03, preload88: 2.21, torque88: 1.28 },
    M4:  { pitch: 0.7,  finePitches: [0.5],        mNut: 3.2,  mThin: 2.2, mNyloc: 5.0,  hCap: 8.0,  mFlange: 4.6,  dFlangeNut: 10.0, sHex: 7.0,  tWasher: 0.8, dWasher: 9.0,  tWasherLarge: 1.0, dWasherLarge: 12.0, tSpring: 1.0, dSpring: 7.6,  dTap: 3.3,  dhClose: 4.3,  dhMed: 4.5,  dhFree: 4.8,  cbDia: 8.0,  cbDepth: 4.5,  csDia: 8.6,  As: 8.78, preload88: 3.90, torque88: 2.90 },
    M5:  { pitch: 0.8,  finePitches: [0.5],        mNut: 4.7,  mThin: 2.7, mNyloc: 5.0,  hCap: 10.0, mFlange: 5.0,  dFlangeNut: 11.8, sHex: 8.0,  tWasher: 1.0, dWasher: 10.0, tWasherLarge: 1.2, dWasherLarge: 15.0, tSpring: 1.2, dSpring: 9.2,  dTap: 4.2,  dhClose: 5.3,  dhMed: 5.5,  dhFree: 5.8,  cbDia: 10.0, cbDepth: 5.5,  csDia: 10.4, As: 14.2, preload88: 6.30, torque88: 5.90 },
    M6:  { pitch: 1.0,  finePitches: [0.75],       mNut: 5.2,  mThin: 3.2, mNyloc: 6.0,  hCap: 12.0, mFlange: 6.0,  dFlangeNut: 14.2, sHex: 10.0, tWasher: 1.6, dWasher: 12.0, tWasherLarge: 1.6, dWasherLarge: 18.0, tSpring: 1.6, dSpring: 11.8, dTap: 5.0,  dhClose: 6.4,  dhMed: 6.6,  dhFree: 7.0,  cbDia: 11.0, cbDepth: 6.5,  csDia: 12.4, As: 20.1, preload88: 8.90, torque88: 10.1 },
    M8:  { pitch: 1.25, finePitches: [1.0],        mNut: 6.8,  mThin: 4.0, mNyloc: 8.0,  hCap: 15.0, mFlange: 8.0,  dFlangeNut: 17.9, sHex: 13.0, tWasher: 1.6, dWasher: 16.0, tWasherLarge: 2.0, dWasherLarge: 24.0, tSpring: 2.0, dSpring: 14.8, dTap: 6.8,  dhClose: 8.4,  dhMed: 9.0,  dhFree: 10.0, cbDia: 15.0, cbDepth: 8.5,  csDia: 16.4, As: 36.6, preload88: 16.3, torque88: 24.6 },
    M10: { pitch: 1.5,  finePitches: [1.25, 1.0],  mNut: 8.4,  mThin: 5.0, mNyloc: 10.0, hCap: 18.0, mFlange: 10.0, dFlangeNut: 21.8, sHex: 16.0, tWasher: 2.0, dWasher: 20.0, tWasherLarge: 2.5, dWasherLarge: 30.0, tSpring: 2.2, dSpring: 18.1, dTap: 8.5,  dhClose: 10.5, dhMed: 11.0, dhFree: 12.0, cbDia: 18.0, cbDepth: 10.5, csDia: 20.4, As: 58.0, preload88: 26.0, torque88: 48.0 },
    M12: { pitch: 1.75, finePitches: [1.5, 1.25],  mNut: 10.8, mThin: 6.0, mNyloc: 12.0, hCap: 22.0, mFlange: 12.0, dFlangeNut: 26.0, sHex: 18.0, tWasher: 2.5, dWasher: 24.0, tWasherLarge: 3.0, dWasherLarge: 37.0, tSpring: 2.5, dSpring: 21.1, dTap: 10.2, dhClose: 13.0, dhMed: 13.5, dhFree: 14.5, cbDia: 20.0, cbDepth: 12.5, csDia: 24.4, As: 84.3, preload88: 37.8, torque88: 84.0 },
    M14: { pitch: 2.0,  finePitches: [1.5],        mNut: 12.8, mThin: 7.0, mNyloc: 14.0, hCap: 25.0, mFlange: 14.0, dFlangeNut: 29.9, sHex: 21.0, tWasher: 2.5, dWasher: 28.0, tWasherLarge: 3.0, dWasherLarge: 44.0, tSpring: 3.0, dSpring: 24.1, dTap: 12.0, dhClose: 15.0, dhMed: 15.5, dhFree: 16.5, cbDia: 24.0, cbDepth: 14.5, csDia: 27.0, As: 115,  preload88: 52.0, torque88: 135.0 },
    M16: { pitch: 2.0,  finePitches: [1.5],        mNut: 14.8, mThin: 8.0, mNyloc: 16.0, hCap: 28.0, mFlange: 16.0, dFlangeNut: 34.5, sHex: 24.0, tWasher: 3.0, dWasher: 30.0, tWasherLarge: 3.0, dWasherLarge: 50.0, tSpring: 3.5, dSpring: 27.4, dTap: 14.0, dhClose: 17.0, dhMed: 17.5, dhFree: 18.5, cbDia: 26.0, cbDepth: 16.5, csDia: 30.0, As: 157,  preload88: 70.6, torque88: 206.0 },
    M18: { pitch: 2.5,  finePitches: [2.0, 1.5],   mNut: 15.8, mThin: 9.0, mNyloc: 18.5, hCap: 32.0, mFlange: 18.0, dFlangeNut: 38.0, sHex: 27.0, tWasher: 3.0, dWasher: 34.0, tWasherLarge: 4.0, dWasherLarge: 56.0, tSpring: 3.5, dSpring: 29.4, dTap: 15.5, dhClose: 19.0, dhMed: 20.0, dhFree: 21.0, cbDia: 30.0, cbDepth: 18.5, csDia: 34.0, As: 192,  preload88: 86.4, torque88: 290.0 },
    M20: { pitch: 2.5,  finePitches: [2.0, 1.5],   mNut: 18.0, mThin: 10.0,mNyloc: 20.0, hCap: 34.0, mFlange: 20.0, dFlangeNut: 42.8, sHex: 30.0, tWasher: 3.0, dWasher: 37.0, tWasherLarge: 4.0, dWasherLarge: 60.0, tSpring: 4.0, dSpring: 33.6, dTap: 17.5, dhClose: 21.0, dhMed: 22.0, dhFree: 24.0, cbDia: 33.0, cbDepth: 20.5, csDia: 38.0, As: 245,  preload88: 110.0, torque88: 410.0 },
    M22: { pitch: 2.5,  finePitches: [2.0, 1.5],   mNut: 19.4, mThin: 11.0,mNyloc: 22.0, hCap: 39.0, mFlange: 22.0, dFlangeNut: 46.5, sHex: 34.0, tWasher: 3.0, dWasher: 39.0, tWasherLarge: 4.0, dWasherLarge: 66.0, tSpring: 4.0, dSpring: 35.9, dTap: 19.5, dhClose: 23.0, dhMed: 24.0, dhFree: 26.0, cbDia: 36.0, cbDepth: 22.5, csDia: 42.0, As: 303,  preload88: 136.0, torque88: 550.0 },
    M24: { pitch: 3.0,  finePitches: [2.0],        mNut: 21.5, mThin: 12.0,mNyloc: 24.0, hCap: 42.0, mFlange: 24.0, dFlangeNut: 51.0, sHex: 36.0, tWasher: 4.0, dWasher: 44.0, tWasherLarge: 4.0, dWasherLarge: 72.0, tSpring: 5.0, dSpring: 40.0, dTap: 21.0, dhClose: 25.0, dhMed: 26.0, dhFree: 28.0, cbDia: 40.0, cbDepth: 24.5, csDia: 46.0, As: 353,  preload88: 159.0, torque88: 710.0 },
    M27: { pitch: 3.0,  finePitches: [2.0],        mNut: 23.8, mThin: 13.5,mNyloc: 27.0, hCap: 47.0, mFlange: 27.0, dFlangeNut: 57.0, sHex: 41.0, tWasher: 4.0, dWasher: 50.0, tWasherLarge: 5.0, dWasherLarge: 85.0, tSpring: 5.0, dSpring: 45.0, dTap: 24.0, dhClose: 28.0, dhMed: 30.0, dhFree: 32.0, cbDia: 43.0, cbDepth: 27.5, csDia: 51.0, As: 459,  preload88: 207.0, torque88: 1050.0 },
    M30: { pitch: 3.5,  finePitches: [2.0],        mNut: 25.6, mThin: 15.0,mNyloc: 30.0, hCap: 52.0, mFlange: 30.0, dFlangeNut: 63.0, sHex: 46.0, tWasher: 4.0, dWasher: 56.0, tWasherLarge: 5.0, dWasherLarge: 92.0, tSpring: 6.0, dSpring: 48.2, dTap: 26.5, dhClose: 31.0, dhMed: 33.0, dhFree: 35.0, cbDia: 48.0, cbDepth: 30.5, csDia: 56.0, As: 561,  preload88: 252.0, torque88: 1450.0 },
    M33: { pitch: 3.5,  finePitches: [2.0],        mNut: 28.7, mThin: 16.5,mNyloc: 33.0, hCap: 58.0, mFlange: 33.0, dFlangeNut: 69.0, sHex: 50.0, tWasher: 5.0, dWasher: 60.0, tWasherLarge: 6.0, dWasherLarge: 105.0,tSpring: 6.0, dSpring: 53.2, dTap: 29.5, dhClose: 34.0, dhMed: 36.0, dhFree: 38.0, cbDia: 52.0, cbDepth: 33.5, csDia: 61.0, As: 694,  preload88: 312.0, torque88: 1950.0 },
    M36: { pitch: 4.0,  finePitches: [3.0],        mNut: 31.0, mThin: 18.0,mNyloc: 36.0, hCap: 64.0, mFlange: 36.0, dFlangeNut: 75.0, sHex: 55.0, tWasher: 5.0, dWasher: 66.0, tWasherLarge: 6.0, dWasherLarge: 110.0,tSpring: 7.0, dSpring: 58.2, dTap: 32.0, dhClose: 37.0, dhMed: 39.0, dhFree: 42.0, cbDia: 57.0, cbDepth: 36.5, csDia: 66.0, As: 817,  preload88: 368.0, torque88: 2500.0 },
};

// Backward-compatible alias
export const METRIC_THREAD_PITCH_DB = METRIC_FASTENER_SPECS;

/**
 * Robust ISO 128 compliant 45° cross-hatch generator within rectangular boundary.
 */
function generateHatchLines(
    xMin: number,
    xMax: number,
    yMin: number,
    yMax: number,
    spacing = 2.0,
    angleDeg = 45,
    layer = 'layer-mech',
    color = '#64748b'
): CadEntity[] {
    const entities: CadEntity[] = [];
    if (xMax <= xMin || yMax <= yMin || spacing <= 0) return entities;

    const rad = (angleDeg * Math.PI) / 180;
    const isPositive = Math.sin(rad) * Math.cos(rad) >= 0;

    if (isPositive) {
        // Line equation: y - x = c => y = x + c
        const minC = yMin - xMax;
        const maxC = yMax - xMin;
        const stepC = spacing * Math.SQRT2;

        for (let c = minC + stepC * 0.5; c < maxC; c += stepC) {
            const pts: Point[] = [];
            const y1 = xMin + c;
            if (y1 >= yMin && y1 <= yMax) pts.push({ x: xMin, y: y1 });
            const y2 = xMax + c;
            if (y2 >= yMin && y2 <= yMax) pts.push({ x: xMax, y: y2 });
            const x1 = yMin - c;
            if (x1 > xMin && x1 < xMax) pts.push({ x: x1, y: yMin });
            const x2 = yMax - c;
            if (x2 > xMin && x2 < xMax) pts.push({ x: x2, y: yMax });

            if (pts.length >= 2) {
                entities.push(createLineEntity(pts[0], pts[1], layer, color));
            }
        }
    } else {
        // Line equation: y + x = c => y = -x + c
        const minC = yMin + xMin;
        const maxC = yMax + xMax;
        const stepC = spacing * Math.SQRT2;

        for (let c = minC + stepC * 0.5; c < maxC; c += stepC) {
            const pts: Point[] = [];
            const y1 = c - xMin;
            if (y1 >= yMin && y1 <= yMax) pts.push({ x: xMin, y: y1 });
            const y2 = c - xMax;
            if (y2 >= yMin && y2 <= yMax) pts.push({ x: xMax, y: y2 });
            const x1 = c - yMin;
            if (x1 > xMin && x1 < xMax) pts.push({ x: x1, y: yMin });
            const x2 = c - yMax;
            if (x2 > xMin && x2 < xMax) pts.push({ x: x2, y: yMax });

            if (pts.length >= 2) {
                entities.push(createLineEntity(pts[0], pts[1], layer, color));
            }
        }
    }

    return entities;
}

export const DYN_FASTENER: DynamicBlockDef = {
    id: 'dyn_fastener',
    name: 'Universal Metric Fastener & Hole (ISO 4014 / DIN 912 / ISO 4032 / ISO 273)',
    nameTr: 'Evrensel Dinamik Metrik Cıvata, Somun & Delik (ISO/DIN/VDI 2230)',
    category: 'Fasteners',
    subcategory: 'Universal Fasteners',
    subcategoryTr: 'Evrensel Bağlantı Elemanları & Delikler',
    description: 'AutoCAD-grade universal fastener & hole: M3 to M36, stretch length/pitch/thread length, 2D cross-sections with 45° hatching, clearance & tapped holes, VDI 2230 calculation.',
    descriptionTr: 'Tek blokla tüm bağlantılar: M3-M36 metrik çap, serbest gövde/diş/delik esnetme, adım (paso) seçimi, 45° ISO 128 taramalı kesit görünüşü, geçiş ve kılavuz delikler.',
    icon: '🔩',
    calculatorRoute: '/bolt-torque',
    calculatorModuleType: 'bolt-torque',
    calculatorLabelTr: '🔩 Cıvata Tork & Ön Gerilme Hesabı (VDI 2230)',
    citation: {
        tier: 1,
        standard: 'ISO 4014 / DIN 912 / ISO 4032 / ISO 273 / DIN 974 / VDI 2230',
        clause: 'ISO 4014 Cl 4-6, ISO 4032 Cl 4, ISO 273 Cl 3, DIN 974-1, VDI 2230 Sheet 1',
        description: 'Standard metric thread pitches, thread length b = 2d + 6/12/25, DIN 974 counterbore and tapped hole representations with ISO 128 longitudinal section hatching.'
    },
    linearParams: [
        {
            id: 'length',
            name: 'length',
            label: 'Bolt Shank Length (L)',
            labelTr: 'Cıvata Gövde Boyu (L)',
            min: 10,
            max: 300,
            step: 5,
            default: 60,
            unit: 'mm',
            axis: 'x'
        },
        {
            id: 'threadLength',
            name: 'threadLength',
            label: 'Thread / Paso Length (b)',
            labelTr: 'Diş / Paso Boyu (b)',
            min: 5,
            max: 300,
            step: 1,
            default: 30,
            unit: 'mm',
            axis: 'x'
        },
        {
            id: 'customPitch',
            name: 'customPitch',
            label: 'Custom Thread Pitch (P)',
            labelTr: 'Özel Diş Adımı / Paso (P)',
            min: 0.25,
            max: 6.0,
            step: 0.05,
            default: 1.75,
            unit: 'mm',
            axis: 'x'
        },
        {
            id: 'holeDepth',
            name: 'holeDepth',
            label: 'Hole / Drill Depth (Lh)',
            labelTr: 'Delik / Matkap Derinliği (Lh)',
            min: 5,
            max: 200,
            step: 1,
            default: 35,
            unit: 'mm',
            axis: 'x'
        },
        {
            id: 'tapDepth',
            name: 'tapDepth',
            label: 'Usable Thread Depth (Lth)',
            labelTr: 'Kılavuz Diş Derinliği (Lth)',
            min: 5,
            max: 150,
            step: 1,
            default: 25,
            unit: 'mm',
            axis: 'x'
        },
        {
            id: 'plateThickness',
            name: 'plateThickness',
            label: 'Plate / Joint Thickness (T)',
            labelTr: 'Plaka Kalınlığı (T)',
            min: 3,
            max: 100,
            step: 1,
            default: 25,
            unit: 'mm',
            axis: 'x'
        }
    ],
    visibilityParam: {
        id: 'visState',
        name: 'visState',
        label: 'Fastener Projection View',
        labelTr: 'Görünüş Tipi',
        states: [
            { id: 'side_detailed', label: 'Side Detailed (Teknik Resim Diş Çizgili)', labelTr: 'Yan Detaylı (Diş Çizgili)' },
            { id: 'side_section', label: 'Side Section (45° Taramalı Kesit Görünüşü)', labelTr: 'Yan Kesit (45° Taramalı)' },
            { id: 'side_schematic', label: 'Side Schematic (Sade Şematik Dış Hat)', labelTr: 'Yan Şematik (Kontur)' },
            { id: 'top_head', label: 'Top View: Head (Kafa Üstten Görünüş)', labelTr: 'Kafa Üstten Görünüş' },
            { id: 'top_nut', label: 'Top View: Nut (Somun Üstten Görünüş)', labelTr: 'Somun Üstten Görünüş' },
            { id: 'top_hole', label: 'Top View: Hole (Delik Üstten Görünüş)', labelTr: 'Delik Üstten Görünüş' }
        ],
        default: 'side_detailed'
    },
    lookupParams: [
        {
            id: 'size',
            name: 'size',
            label: 'Nominal Metric Diameter',
            labelTr: 'Metrik Çap (d)',
            options: Object.keys(METRIC_FASTENER_SPECS).map((s) => ({
                id: s,
                label: `${s} (Standart Adım ${METRIC_FASTENER_SPECS[s].pitch} mm)`,
                standard: 'ISO Metric',
                values: { size: s }
            })),
            default: 'M12'
        },
        {
            id: 'componentMode',
            name: 'componentMode',
            label: 'Component Mode',
            labelTr: 'Bağlantı & Eleman Modu',
            options: [
                { id: 'assembly', label: 'Cıvata + Somun + Pul Montajı (Fastener Assembly)', values: { componentMode: 'assembly' } },
                { id: 'bolt_only', label: 'Yalnızca Cıvata (Bolt Only)', values: { componentMode: 'bolt_only' } },
                { id: 'nut_only', label: 'Yalnızca Somun (Nut Only - ISO 4032)', values: { componentMode: 'nut_only' } },
                { id: 'washer_only', label: 'Yalnızca Pul (Washer Only - ISO 7089)', values: { componentMode: 'washer_only' } },
                { id: 'tapped_joint', label: 'Cıvata + Kılavuz Delik Montajı (Tapped Joint)', values: { componentMode: 'tapped_joint' } },
                { id: 'hole_clearance', label: 'Geçiş Deliği / Havşa (Clearance Hole ISO 273)', values: { componentMode: 'hole_clearance' } },
                { id: 'hole_tapped', label: 'Dişli Kılavuz Deliği (Tapped Hole ISO 68-1)', values: { componentMode: 'hole_tapped' } }
            ],
            default: 'assembly'
        },
        {
            id: 'pitchMode',
            name: 'pitchMode',
            label: 'Thread Pitch (Paso Adımı)',
            labelTr: 'Diş Adımı (Paso)',
            options: [
                { id: 'coarse', label: 'Standart Metrik Kaba Adım (ISO 261)', values: { pitchMode: 'coarse' } },
                { id: 'fine', label: 'İnce Diş Adımı (Metric Fine)', values: { pitchMode: 'fine' } },
                { id: 'custom', label: 'Özel Adım (Kullanıcı Belirler)', values: { pitchMode: 'custom' } }
            ],
            default: 'coarse'
        },
        {
            id: 'threadLengthMode',
            name: 'threadLengthMode',
            label: 'Thread Length Mode (Diş Boyu)',
            labelTr: 'Diş Boyu Tipi (Paso Boyu)',
            options: [
                { id: 'standard', label: 'Standart Diş Boyu (ISO 4014: b=2d+6/12/25)', values: { threadLengthMode: 'standard' } },
                { id: 'full', label: 'Tam Boy Diş (DIN 933 / DIN 912: b=L)', values: { threadLengthMode: 'full' } },
                { id: 'custom', label: 'Özel Diş Boyu (Serbest Ayarlanır)', values: { threadLengthMode: 'custom' } }
            ],
            default: 'standard'
        },
        {
            id: 'headType',
            name: 'headType',
            label: 'Head Style',
            labelTr: 'Kafa Tipi & Standardı',
            options: [
                { id: 'hex_iso4014', label: 'Altı Köşe Başlı (ISO 4014 / DIN 931)', values: { headType: 'hex_iso4014' } },
                { id: 'socket_din912', label: 'Silindirik İmbus / Allen (DIN 912 / ISO 4762)', values: { headType: 'socket_din912' } },
                { id: 'countersunk_din7991', label: 'Havşa Başlı İmbus 90° (DIN 7991 / ISO 10642)', values: { headType: 'countersunk_din7991' } },
                { id: 'button_iso7380', label: 'Bombeli Kubbe Başlı İmbus (ISO 7380)', values: { headType: 'button_iso7380' } },
                { id: 'flange_din6921', label: 'Flanşlı Altı Köşe Başlı (DIN 6921 / EN 1665)', values: { headType: 'flange_din6921' } }
            ],
            default: 'hex_iso4014'
        },
        {
            id: 'nutType',
            name: 'nutType',
            label: 'Nut Type & Standard',
            labelTr: 'Somun Tipi & Standardı',
            options: [
                { id: 'hex_iso4032', label: 'Standart Altı Köşe Somun (ISO 4032 / DIN 934)', values: { nutType: 'hex_iso4032' } },
                { id: 'thin_din439', label: 'İnce Kontra Somun (DIN 439 / ISO 4035)', values: { nutType: 'thin_din439' } },
                { id: 'nyloc_din985', label: 'Fiberli Emniyet Somunu (DIN 985 / ISO 10511)', values: { nutType: 'nyloc_din985' } },
                { id: 'cap_din1587', label: 'Kör / Kubbeli Somun (DIN 1587)', values: { nutType: 'cap_din1587' } },
                { id: 'flange_din6923', label: 'Flanşlı Altı Köşe Somun (DIN 6923 / EN 1661)', values: { nutType: 'flange_din6923' } }
            ],
            default: 'hex_iso4032'
        },
        {
            id: 'washerType',
            name: 'washerType',
            label: 'Washer Style',
            labelTr: 'Pul / Rondela Standardı',
            options: [
                { id: 'standard_iso7089', label: 'Standart Düz Pul (ISO 7089 / DIN 125 Form A)', values: { washerType: 'standard_iso7089' } },
                { id: 'wide_iso7093', label: 'Geniş Pul (ISO 7093 / DIN 9021 Form C)', values: { washerType: 'wide_iso7093' } },
                { id: 'spring_din127', label: 'Yaylı Rondela (DIN 127 Form B)', values: { washerType: 'spring_din127' } },
                { id: 'none', label: 'Pulsuz (Doğrudan Temas)', values: { washerType: 'none' } }
            ],
            default: 'standard_iso7089'
        },
        {
            id: 'holeType',
            name: 'holeType',
            label: 'Hole Standard & Geometry',
            labelTr: 'Delik Tipi & Standardı',
            options: [
                { id: 'clearance_through', label: 'Standart Boydan Boya Geçiş Deliği (ISO 273)', values: { holeType: 'clearance_through' } },
                { id: 'counterbore_din974', label: 'İmbus Silindirik Havşa Deliği (DIN 974-1)', values: { holeType: 'counterbore_din974' } },
                { id: 'countersink_din74', label: '90° Konik Havşa Deliği (DIN 74 Form A)', values: { holeType: 'countersink_din74' } },
                { id: 'tapped_blind', label: 'Kör Kılavuz Delik (118° Matkap Uçlu - ISO 68-1)', values: { holeType: 'tapped_blind' } },
                { id: 'tapped_through', label: 'Boydan Boya Dişli Delik (Through Tapped)', values: { holeType: 'tapped_through' } }
            ],
            default: 'clearance_through'
        },
        {
            id: 'clearanceFit',
            name: 'clearanceFit',
            label: 'ISO 273 Clearance Fit',
            labelTr: 'Geçiş Deliği Toleransı (ISO 273)',
            options: [
                { id: 'medium', label: 'Orta Geçme (Medium - Genel Standart)', values: { clearanceFit: 'medium' } },
                { id: 'close', label: 'Hassas Geçme (Close - Kalıpçılık)', values: { clearanceFit: 'close' } },
                { id: 'free', label: 'Serbest Geçme (Free - Kaynaklı Konstrüksiyon)', values: { clearanceFit: 'free' } }
            ],
            default: 'medium'
        },
        {
            id: 'propertyClass',
            name: 'propertyClass',
            label: 'Bolt Property Class (ISO 898-1)',
            labelTr: 'Cıvata Mukavemet Sınıfı (ISO 898)',
            options: [
                { id: '8.8', label: 'Kalite 8.8 (Rp0.2=640 MPa, Rm=800 MPa - Genel İmalat)', values: { propertyClass: '8.8' } },
                { id: '10.9', label: 'Kalite 10.9 (Rp0.2=940 MPa, Rm=1000 MPa - Ağır Sanayi)', values: { propertyClass: '10.9' } },
                { id: '12.9', label: 'Kalite 12.9 (Rp0.2=1080 MPa, Rm=1200 MPa - Yüksek Gerilme)', values: { propertyClass: '12.9' } },
                { id: 'A2_70', label: 'Paslanmaz A2-70 (Inox 304 - Korozyon Dayanımlı)', values: { propertyClass: 'A2_70' } },
                { id: 'A4_80', label: 'Paslanmaz A4-80 (Inox 316 - Deniz & Kimya)', values: { propertyClass: 'A4_80' } }
            ],
            default: '8.8'
        },
        // Backward compatibility parameter for prior nutOption
        {
            id: 'nutOption',
            name: 'nutOption',
            label: 'Legacy Washer & Nut Option',
            labelTr: 'Somun ve Pul Donatısı (Eski)',
            options: [
                { id: 'washer_nut', label: 'Pul + Standart Somun (ISO 7089 + ISO 4032)', values: { nutOption: 'washer_nut' } },
                { id: 'nut_only', label: 'Yalnızca Somun (ISO 4032)', values: { nutOption: 'nut_only' } },
                { id: 'double_nut', label: 'Çift Kontra Somun (Locknut)', values: { nutOption: 'double_nut' } },
                { id: 'washer_only', label: 'Yalnızca Pul (ISO 7089)', values: { nutOption: 'washer_only' } },
                { id: 'none', label: 'Yalnızca Cıvata (Kör/Kılavuz Delik)', values: { nutOption: 'none' } }
            ],
            default: 'washer_nut'
        }
    ],
    defaultValues: {
        size: 'M12',
        componentMode: 'assembly',
        pitchMode: 'coarse',
        threadLengthMode: 'standard',
        length: 60,
        threadLength: 30,
        customPitch: 1.75,
        holeDepth: 35,
        tapDepth: 25,
        plateThickness: 25,
        headType: 'hex_iso4014',
        nutType: 'hex_iso4032',
        washerType: 'standard_iso7089',
        holeType: 'clearance_through',
        clearanceFit: 'medium',
        propertyClass: '8.8',
        nutOption: 'washer_nut',
        visState: 'side_detailed'
    },
    generate2D: (params, basePoint = { x: 0, y: 0 }) => {
        const size = String(params.size || 'M12');
        const spec = METRIC_FASTENER_SPECS[size] || METRIC_FASTENER_SPECS['M12'];
        const length = Math.max(10, Number(params.length) || 60);
        const headTypeKey = String(params.headType || 'hex_iso4014');
        const nutTypeKey = String(params.nutType || 'hex_iso4032');
        const washerTypeKey = String(params.washerType || 'standard_iso7089');
        const holeTypeKey = String(params.holeType || 'clearance_through');
        const clearanceFit = String(params.clearanceFit || 'medium');
        const state = String(params.visState || 'side_detailed');
        const holeDepth = Math.max(5, Number(params.holeDepth) || 35);
        const tapDepth = Math.max(5, Number(params.tapDepth) || 25);
        const plateT = Math.max(3, Number(params.plateThickness) || 25);

        // Resolve componentMode with legacy nutOption fallback
        let compMode = String(params.componentMode || '');
        if (!compMode) {
            const legacyNut = String(params.nutOption || 'washer_nut');
            if (legacyNut === 'nut_only') compMode = 'nut_only';
            else if (legacyNut === 'washer_only') compMode = 'washer_only';
            else if (legacyNut === 'none') compMode = 'bolt_only';
            else compMode = 'assembly';
        }

        // Active thread pitch (P)
        const pitchMode = String(params.pitchMode || 'coarse');
        let pitch = spec.pitch;
        if (pitchMode === 'fine') {
            pitch = spec.finePitches[0] || spec.pitch;
        } else if (pitchMode === 'custom') {
            pitch = Math.max(0.2, Number(params.customPitch) || spec.pitch);
        }

        // Active thread length (b)
        const thMode = String(params.threadLengthMode || 'standard');
        const dNom = parseFloat(size.replace('M', '')) || 12;
        let bStd = length <= 125 ? 2 * dNom + 6 : length <= 200 ? 2 * dNom + 12 : 2 * dNom + 25;
        if (thMode === 'full') bStd = length;
        else if (thMode === 'custom') bStd = Math.min(length, Math.max(5, Number(params.threadLength) || bStd));
        const threadLen = Math.min(length, bStd);

        const entities: CadEntity[] = [];
        const layer = 'layer-mech';
        const colorBolt = '#3ad0e6';      // Instrument cyan
        const colorThread = '#f59e0b';    // Amber thread root
        const colorCenter = '#ef4444';    // Red center line
        const colorHardware = '#94a3b8';  // Steel slate for washer/nut
        const colorHatch = '#64748b';     // Cross-section 45° hatch lines

        // Bolt head dimensions
        let boltTypeId: BoltTypeId = 'hex_bolt';
        if (headTypeKey === 'socket_din912') boltTypeId = 'socket_cap';
        else if (headTypeKey === 'countersunk_din7991') boltTypeId = 'countersunk';
        else if (headTypeKey === 'button_iso7380') boltTypeId = 'button_head';
        else if (headTypeKey === 'flange_din6921') boltTypeId = 'flange_hex';

        const headDim = getBoltHeadDimensions(boltTypeId, size);
        const d = headDim.d_nom;
        const kHead = headDim.k;
        const wHead = headDim.s || headDim.dk || headDim.dc || d * 1.6;

        // Nut dimensions based on nutTypeKey
        let mNutActive = spec.mNut;
        if (nutTypeKey === 'thin_din439') mNutActive = spec.mThin;
        else if (nutTypeKey === 'nyloc_din985') mNutActive = spec.mNyloc;
        else if (nutTypeKey === 'cap_din1587') mNutActive = spec.hCap;
        else if (nutTypeKey === 'flange_din6923') mNutActive = spec.mFlange;

        const sNutHex = spec.sHex;
        const rootD = d - 1.0825 * pitch; // Standard metric thread root / tap drill diameter

        // Washer dimensions
        let tWasherActive = spec.tWasher;
        let dWasherActive = spec.dWasher;
        if (washerTypeKey === 'wide_iso7093') {
            tWasherActive = spec.tWasherLarge;
            dWasherActive = spec.dWasherLarge;
        } else if (washerTypeKey === 'spring_din127') {
            tWasherActive = spec.tSpring;
            dWasherActive = spec.dSpring;
        }

        // Clearance hole diameter
        const dh = clearanceFit === 'close' ? spec.dhClose : clearanceFit === 'free' ? spec.dhFree : spec.dhMed;

        // ═══════════════════════════════════════════════════════════════
        // A. HOLE MODES (Clearance or Tapped Hole)
        // ═══════════════════════════════════════════════════════════════
        if (compMode === 'hole_clearance' || compMode === 'hole_tapped') {
            const isTapped = compMode === 'hole_tapped';
            const hDepth = Math.max(10, holeDepth);
            const pThickness = Math.max(5, plateT);
            const plateHalfH = Math.max(30, spec.cbDia * 1.5);

            // 1. Top View Hole
            if (state === 'top_hole') {
                if (isTapped) {
                    // Tap drill circle (thick continuous) + 3/4 arc thread crest (thin amber per ISO 128)
                    entities.push(createCircleEntity(basePoint, spec.dTap / 2, layer, colorBolt));
                    entities.push(createArcEntity(basePoint, d / 2, Math.PI * 0.25, Math.PI * 1.85, layer, colorThread));
                } else if (holeTypeKey === 'counterbore_din974') {
                    // Outer counterbore circle + inner hole circle
                    entities.push(createCircleEntity(basePoint, spec.cbDia / 2, layer, colorBolt));
                    entities.push(createCircleEntity(basePoint, dh / 2, layer, colorHardware));
                } else if (holeTypeKey === 'countersink_din74') {
                    // Outer countersink circle + inner hole circle
                    entities.push(createCircleEntity(basePoint, spec.csDia / 2, layer, colorBolt));
                    entities.push(createCircleEntity(basePoint, dh / 2, layer, colorHardware));
                } else {
                    // Plain clearance through hole circle
                    entities.push(createCircleEntity(basePoint, dh / 2, layer, colorBolt));
                }

                // Centerlines
                const extent = Math.max(d * 1.5, spec.cbDia / 2 + 8);
                entities.push(createLineEntity({ x: basePoint.x - extent, y: basePoint.y }, { x: basePoint.x + extent, y: basePoint.y }, layer, colorCenter));
                entities.push(createLineEntity({ x: basePoint.x, y: basePoint.y - extent }, { x: basePoint.x, y: basePoint.y + extent }, layer, colorCenter));
                return entities;
            }

            // 2. Section or Side View of Hole in Plate
            if (isTapped) {
                // Tapped Blind / Through Hole
                const Lth = Math.min(hDepth - 3 * pitch, Math.max(5, tapDepth));
                const tipLen = (spec.dTap / 2) / Math.tan((59 * Math.PI) / 180); // 118° drill point cone

                // Drill cylinder
                entities.push(createLineEntity({ x: basePoint.x, y: basePoint.y + spec.dTap / 2 }, { x: basePoint.x + hDepth, y: basePoint.y + spec.dTap / 2 }, layer, colorBolt));
                entities.push(createLineEntity({ x: basePoint.x, y: basePoint.y - spec.dTap / 2 }, { x: basePoint.x + hDepth, y: basePoint.y - spec.dTap / 2 }, layer, colorBolt));

                // 118° drill point cone
                entities.push(createLineEntity({ x: basePoint.x + hDepth, y: basePoint.y + spec.dTap / 2 }, { x: basePoint.x + hDepth + tipLen, y: basePoint.y }, layer, colorBolt));
                entities.push(createLineEntity({ x: basePoint.x + hDepth, y: basePoint.y - spec.dTap / 2 }, { x: basePoint.x + hDepth + tipLen, y: basePoint.y }, layer, colorBolt));

                // Internal thread crest lines (thin amber per ISO 6410)
                entities.push(createLineEntity({ x: basePoint.x, y: basePoint.y + d / 2 }, { x: basePoint.x + Lth, y: basePoint.y + d / 2 }, layer, colorThread));
                entities.push(createLineEntity({ x: basePoint.x, y: basePoint.y - d / 2 }, { x: basePoint.x + Lth, y: basePoint.y - d / 2 }, layer, colorThread));
                // End-of-usable-thread line
                entities.push(createLineEntity({ x: basePoint.x + Lth, y: basePoint.y - d / 2 }, { x: basePoint.x + Lth, y: basePoint.y + d / 2 }, layer, colorBolt));

                // Plate boundary & 45° hatching
                const plateLen = hDepth + tipLen + 15;
                // Upper plate wall hatching
                entities.push(...generateHatchLines(basePoint.x, basePoint.x + plateLen, basePoint.y + d / 2, basePoint.y + plateHalfH, 2.5, 45, layer, colorHatch));
                // Lower plate wall hatching
                entities.push(...generateHatchLines(basePoint.x, basePoint.x + plateLen, basePoint.y - plateHalfH, basePoint.y - d / 2, 2.5, 45, layer, colorHatch));

                // Outer plate boundary
                entities.push(createLineEntity({ x: basePoint.x, y: basePoint.y + d / 2 }, { x: basePoint.x, y: basePoint.y + plateHalfH }, layer, colorHardware));
                entities.push(createLineEntity({ x: basePoint.x, y: basePoint.y - plateHalfH }, { x: basePoint.x, y: basePoint.y - d / 2 }, layer, colorHardware));
                entities.push(createLineEntity({ x: basePoint.x, y: basePoint.y + plateHalfH }, { x: basePoint.x + plateLen, y: basePoint.y + plateHalfH }, layer, colorHardware));
                entities.push(createLineEntity({ x: basePoint.x, y: basePoint.y - plateHalfH }, { x: basePoint.x + plateLen, y: basePoint.y - plateHalfH }, layer, colorHardware));
                entities.push(createLineEntity({ x: basePoint.x + plateLen, y: basePoint.y - plateHalfH }, { x: basePoint.x + plateLen, y: basePoint.y + plateHalfH }, layer, colorHardware));
            } else {
                // Clearance hole (through, counterbore, or countersink)
                const throughLen = pThickness;
                if (holeTypeKey === 'counterbore_din974') {
                    const cbD = spec.cbDia;
                    const cbT = spec.cbDepth;
                    // Counterbore pocket
                    entities.push(createLineEntity({ x: basePoint.x, y: basePoint.y + cbD / 2 }, { x: basePoint.x + cbT, y: basePoint.y + cbD / 2 }, layer, colorBolt));
                    entities.push(createLineEntity({ x: basePoint.x, y: basePoint.y - cbD / 2 }, { x: basePoint.x + cbT, y: basePoint.y - cbD / 2 }, layer, colorBolt));
                    entities.push(createLineEntity({ x: basePoint.x + cbT, y: basePoint.y + cbD / 2 }, { x: basePoint.x + cbT, y: basePoint.y + dh / 2 }, layer, colorBolt));
                    entities.push(createLineEntity({ x: basePoint.x + cbT, y: basePoint.y - cbD / 2 }, { x: basePoint.x + cbT, y: basePoint.y - dh / 2 }, layer, colorBolt));
                    // Remaining clearance through hole
                    entities.push(createLineEntity({ x: basePoint.x + cbT, y: basePoint.y + dh / 2 }, { x: basePoint.x + throughLen, y: basePoint.y + dh / 2 }, layer, colorBolt));
                    entities.push(createLineEntity({ x: basePoint.x + cbT, y: basePoint.y - dh / 2 }, { x: basePoint.x + throughLen, y: basePoint.y - dh / 2 }, layer, colorBolt));

                    // Hatching
                    entities.push(...generateHatchLines(basePoint.x, basePoint.x + cbT, basePoint.y + cbD / 2, basePoint.y + plateHalfH, 2.5, 45, layer, colorHatch));
                    entities.push(...generateHatchLines(basePoint.x + cbT, basePoint.x + throughLen, basePoint.y + dh / 2, basePoint.y + plateHalfH, 2.5, 45, layer, colorHatch));
                    entities.push(...generateHatchLines(basePoint.x, basePoint.x + cbT, basePoint.y - plateHalfH, basePoint.y - cbD / 2, 2.5, 45, layer, colorHatch));
                    entities.push(...generateHatchLines(basePoint.x + cbT, basePoint.x + throughLen, basePoint.y - plateHalfH, basePoint.y - dh / 2, 2.5, 45, layer, colorHatch));
                } else if (holeTypeKey === 'countersink_din74') {
                    const csD = spec.csDia;
                    const csT = (csD - dh) / 2; // 90° countersink depth = half delta
                    // 90° cone lines
                    entities.push(createLineEntity({ x: basePoint.x, y: basePoint.y + csD / 2 }, { x: basePoint.x + csT, y: basePoint.y + dh / 2 }, layer, colorBolt));
                    entities.push(createLineEntity({ x: basePoint.x, y: basePoint.y - csD / 2 }, { x: basePoint.x + csT, y: basePoint.y - dh / 2 }, layer, colorBolt));
                    // Through hole
                    entities.push(createLineEntity({ x: basePoint.x + csT, y: basePoint.y + dh / 2 }, { x: basePoint.x + throughLen, y: basePoint.y + dh / 2 }, layer, colorBolt));
                    entities.push(createLineEntity({ x: basePoint.x + csT, y: basePoint.y - dh / 2 }, { x: basePoint.x + throughLen, y: basePoint.y - dh / 2 }, layer, colorBolt));

                    entities.push(...generateHatchLines(basePoint.x, basePoint.x + throughLen, basePoint.y + csD / 2, basePoint.y + plateHalfH, 2.5, 45, layer, colorHatch));
                    entities.push(...generateHatchLines(basePoint.x, basePoint.x + throughLen, basePoint.y - plateHalfH, basePoint.y - csD / 2, 2.5, 45, layer, colorHatch));
                } else {
                    // Plain through hole
                    entities.push(createLineEntity({ x: basePoint.x, y: basePoint.y + dh / 2 }, { x: basePoint.x + throughLen, y: basePoint.y + dh / 2 }, layer, colorBolt));
                    entities.push(createLineEntity({ x: basePoint.x, y: basePoint.y - dh / 2 }, { x: basePoint.x + throughLen, y: basePoint.y - dh / 2 }, layer, colorBolt));

                    entities.push(...generateHatchLines(basePoint.x, basePoint.x + throughLen, basePoint.y + dh / 2, basePoint.y + plateHalfH, 2.5, 45, layer, colorHatch));
                    entities.push(...generateHatchLines(basePoint.x, basePoint.x + throughLen, basePoint.y - plateHalfH, basePoint.y - dh / 2, 2.5, 45, layer, colorHatch));
                }

                // Plate outer bounds
                entities.push(createLineEntity({ x: basePoint.x, y: basePoint.y + plateHalfH }, { x: basePoint.x + throughLen, y: basePoint.y + plateHalfH }, layer, colorHardware));
                entities.push(createLineEntity({ x: basePoint.x, y: basePoint.y - plateHalfH }, { x: basePoint.x + throughLen, y: basePoint.y - plateHalfH }, layer, colorHardware));
                entities.push(createLineEntity({ x: basePoint.x + throughLen, y: basePoint.y - plateHalfH }, { x: basePoint.x + throughLen, y: basePoint.y + plateHalfH }, layer, colorHardware));
            }

            // Centerline
            const totalHoleExtent = (isTapped ? hDepth + 20 : pThickness) + 10;
            entities.push(createLineEntity(
                { x: basePoint.x - 8, y: basePoint.y },
                { x: basePoint.x + totalHoleExtent, y: basePoint.y },
                layer,
                colorCenter
            ));
            return entities;
        }

        // ═══════════════════════════════════════════════════════════════
        // B. NUT ONLY MODE (CRITICAL USER REQUEST: ZERO BOLT DRAWN!)
        // ═══════════════════════════════════════════════════════════════
        if (compMode === 'nut_only') {
            // 1. Top View Nut
            if (state === 'top_nut' || state === 'top_head') {
                const rHex = sNutHex / Math.sqrt(3);
                entities.push(createCircleEntity(basePoint, sNutHex / 2, layer, '#64748b'));
                entities.push(createHexagonEntity(basePoint, rHex, layer, colorBolt));
                entities.push(createCircleEntity(basePoint, rootD / 2, layer, colorBolt)); // Inner bore (diş dibi)
                // 3/4 thread crest arc per ISO 128
                entities.push(createArcEntity(basePoint, d / 2, Math.PI * 0.25, Math.PI * 1.85, layer, colorThread));

                const extent = sNutHex / 2 + 6;
                entities.push(createLineEntity({ x: basePoint.x - extent, y: basePoint.y }, { x: basePoint.x + extent, y: basePoint.y }, layer, colorCenter));
                entities.push(createLineEntity({ x: basePoint.x, y: basePoint.y - extent }, { x: basePoint.x, y: basePoint.y + extent }, layer, colorCenter));
                return entities;
            }

            // 2. Section View of Nut (ISO 128 Longitudinal Section with 45° Hatching)
            const nutX0 = basePoint.x;
            const nutX1 = basePoint.x + mNutActive;

            if (state === 'side_section') {
                // Outer nut contour
                entities.push(createLineEntity({ x: nutX0, y: basePoint.y + sNutHex / 2 }, { x: nutX1, y: basePoint.y + sNutHex / 2 }, layer, colorBolt));
                entities.push(createLineEntity({ x: nutX0, y: basePoint.y - sNutHex / 2 }, { x: nutX1, y: basePoint.y - sNutHex / 2 }, layer, colorBolt));
                entities.push(createLineEntity({ x: nutX0, y: basePoint.y + rootD / 2 }, { x: nutX0, y: basePoint.y + sNutHex / 2 }, layer, colorBolt));
                entities.push(createLineEntity({ x: nutX0, y: basePoint.y - sNutHex / 2 }, { x: nutX0, y: basePoint.y - rootD / 2 }, layer, colorBolt));
                entities.push(createLineEntity({ x: nutX1, y: basePoint.y + rootD / 2 }, { x: nutX1, y: basePoint.y + sNutHex / 2 }, layer, colorBolt));
                entities.push(createLineEntity({ x: nutX1, y: basePoint.y - sNutHex / 2 }, { x: nutX1, y: basePoint.y - rootD / 2 }, layer, colorBolt));

                // Internal thread lines per ISO 128:
                // Minor diameter (bore) is thick line
                entities.push(createLineEntity({ x: nutX0, y: basePoint.y + rootD / 2 }, { x: nutX1, y: basePoint.y + rootD / 2 }, layer, colorBolt));
                entities.push(createLineEntity({ x: nutX0, y: basePoint.y - rootD / 2 }, { x: nutX1, y: basePoint.y - rootD / 2 }, layer, colorBolt));
                // Nominal thread diameter (crest) is thin line
                entities.push(createLineEntity({ x: nutX0, y: basePoint.y + d / 2 }, { x: nutX1, y: basePoint.y + d / 2 }, layer, colorThread));
                entities.push(createLineEntity({ x: nutX0, y: basePoint.y - d / 2 }, { x: nutX1, y: basePoint.y - d / 2 }, layer, colorThread));

                // 60°/120° Entry chamfers at both ends
                const chamfer = (d - rootD) / 2;
                entities.push(createLineEntity({ x: nutX0, y: basePoint.y + rootD / 2 }, { x: nutX0 + chamfer, y: basePoint.y + d / 2 }, layer, colorBolt));
                entities.push(createLineEntity({ x: nutX0, y: basePoint.y - rootD / 2 }, { x: nutX0 + chamfer, y: basePoint.y - d / 2 }, layer, colorBolt));
                entities.push(createLineEntity({ x: nutX1, y: basePoint.y + rootD / 2 }, { x: nutX1 - chamfer, y: basePoint.y + d / 2 }, layer, colorBolt));
                entities.push(createLineEntity({ x: nutX1, y: basePoint.y - rootD / 2 }, { x: nutX1 - chamfer, y: basePoint.y - d / 2 }, layer, colorBolt));

                // Special geometry for Domed Cap Nut (DIN 1587)
                if (nutTypeKey === 'cap_din1587') {
                    const domeH = spec.hCap - spec.mNut;
                    entities.push(createArcEntity({ x: nutX1, y: basePoint.y }, sNutHex / 2, -Math.PI / 2, Math.PI / 2, layer, colorBolt));
                    entities.push(createArcEntity({ x: nutX1, y: basePoint.y }, rootD / 2, -Math.PI / 2, Math.PI / 2, layer, colorThread));
                }

                // Special geometry for Flange Nut (DIN 6923)
                if (nutTypeKey === 'flange_din6923') {
                    const dFl = spec.dFlangeNut;
                    const cFl = Math.max(1.5, d * 0.2);
                    entities.push(createRectangleEntity({ x: nutX0 - cFl / 2, y: basePoint.y }, cFl, dFl, layer, colorBolt));
                    entities.push(...generateHatchLines(nutX0 - cFl, nutX0, basePoint.y + rootD / 2, basePoint.y + dFl / 2, 2.0, 45, layer, colorHatch));
                    entities.push(...generateHatchLines(nutX0 - cFl, nutX0, basePoint.y - dFl / 2, basePoint.y - rootD / 2, 2.0, 45, layer, colorHatch));
                }

                // 45° Hatching lines for top and bottom nut walls!
                entities.push(...generateHatchLines(nutX0, nutX1, basePoint.y + rootD / 2, basePoint.y + sNutHex / 2, 2.0, 45, layer, colorHatch));
                entities.push(...generateHatchLines(nutX0, nutX1, basePoint.y - sNutHex / 2, basePoint.y - rootD / 2, 2.0, 45, layer, colorHatch));
            } else {
                // Side Detailed / Schematic
                entities.push(createRectangleEntity(
                    { x: (nutX0 + nutX1) / 2, y: basePoint.y },
                    mNutActive,
                    sNutHex,
                    layer,
                    colorBolt
                ));
                // Facet chamfer lines
                const innerNutW = sNutHex * 0.58;
                entities.push(createLineEntity({ x: nutX0, y: basePoint.y - innerNutW / 2 }, { x: nutX1, y: basePoint.y - innerNutW / 2 }, layer, '#64748b'));
                entities.push(createLineEntity({ x: nutX0, y: basePoint.y + innerNutW / 2 }, { x: nutX1, y: basePoint.y + innerNutW / 2 }, layer, '#64748b'));

                // Internal hidden bore thread lines (dashed)
                entities.push(createLineEntity({ x: nutX0, y: basePoint.y + rootD / 2 }, { x: nutX1, y: basePoint.y + rootD / 2 }, layer, colorThread));
                entities.push(createLineEntity({ x: nutX0, y: basePoint.y - rootD / 2 }, { x: nutX1, y: basePoint.y - rootD / 2 }, layer, colorThread));
            }

            // Centerline (dash-dot)
            entities.push(createLineEntity(
                { x: nutX0 - 8, y: basePoint.y },
                { x: nutX1 + 8, y: basePoint.y },
                layer,
                colorCenter
            ));
            return entities;
        }

        // ═══════════════════════════════════════════════════════════════
        // C. WASHER ONLY MODE
        // ═══════════════════════════════════════════════════════════════
        if (compMode === 'washer_only') {
            if (state === 'top_nut' || state === 'top_head' || state === 'top_hole') {
                entities.push(createCircleEntity(basePoint, dWasherActive / 2, layer, colorBolt));
                entities.push(createCircleEntity(basePoint, dh / 2, layer, colorHardware));
                const extent = dWasherActive / 2 + 5;
                entities.push(createLineEntity({ x: basePoint.x - extent, y: basePoint.y }, { x: basePoint.x + extent, y: basePoint.y }, layer, colorCenter));
                entities.push(createLineEntity({ x: basePoint.x, y: basePoint.y - extent }, { x: basePoint.x, y: basePoint.y + extent }, layer, colorCenter));
                return entities;
            }

            const wX0 = basePoint.x;
            const wX1 = basePoint.x + tWasherActive;

            if (state === 'side_section') {
                entities.push(createLineEntity({ x: wX0, y: basePoint.y + dWasherActive / 2 }, { x: wX1, y: basePoint.y + dWasherActive / 2 }, layer, colorHardware));
                entities.push(createLineEntity({ x: wX0, y: basePoint.y - dWasherActive / 2 }, { x: wX1, y: basePoint.y - dWasherActive / 2 }, layer, colorHardware));
                entities.push(createLineEntity({ x: wX0, y: basePoint.y + dh / 2 }, { x: wX1, y: basePoint.y + dh / 2 }, layer, colorHardware));
                entities.push(createLineEntity({ x: wX0, y: basePoint.y - dh / 2 }, { x: wX1, y: basePoint.y - dh / 2 }, layer, colorHardware));
                entities.push(createLineEntity({ x: wX0, y: basePoint.y + dh / 2 }, { x: wX0, y: basePoint.y + dWasherActive / 2 }, layer, colorHardware));
                entities.push(createLineEntity({ x: wX0, y: basePoint.y - dWasherActive / 2 }, { x: wX0, y: basePoint.y - dh / 2 }, layer, colorHardware));
                entities.push(createLineEntity({ x: wX1, y: basePoint.y + dh / 2 }, { x: wX1, y: basePoint.y + dWasherActive / 2 }, layer, colorHardware));
                entities.push(createLineEntity({ x: wX1, y: basePoint.y - dWasherActive / 2 }, { x: wX1, y: basePoint.y - dh / 2 }, layer, colorHardware));

                // 45° Hatching
                entities.push(...generateHatchLines(wX0, wX1, basePoint.y + dh / 2, basePoint.y + dWasherActive / 2, 1.5, 45, layer, colorHatch));
                entities.push(...generateHatchLines(wX0, wX1, basePoint.y - dWasherActive / 2, basePoint.y - dh / 2, 1.5, 45, layer, colorHatch));
            } else {
                entities.push(createRectangleEntity(
                    { x: (wX0 + wX1) / 2, y: basePoint.y },
                    tWasherActive,
                    dWasherActive,
                    layer,
                    colorHardware
                ));
            }

            entities.push(createLineEntity(
                { x: wX0 - 6, y: basePoint.y },
                { x: wX1 + 6, y: basePoint.y },
                layer,
                colorCenter
            ));
            return entities;
        }

        // ═══════════════════════════════════════════════════════════════
        // D. BOLT / ASSEMBLY / TAPPED JOINT MODES
        // ═══════════════════════════════════════════════════════════════

        // 1. TOP VIEWS
        if (state === 'top_head') {
            if (headTypeKey === 'hex_iso4014') {
                const s = headDim.s || d * 1.6;
                entities.push(createCircleEntity(basePoint, s / 2, layer, '#64748b'));
                entities.push(createHexagonEntity(basePoint, s / Math.sqrt(3), layer, colorBolt));
            } else if (headTypeKey === 'socket_din912') {
                const dk = headDim.dk || d * 1.5;
                const sKey = headDim.s || d * 0.8;
                entities.push(createCircleEntity(basePoint, dk / 2, layer, colorBolt));
                entities.push(createHexagonEntity(basePoint, sKey / Math.sqrt(3), layer, colorThread));
            } else if (headTypeKey === 'countersunk_din7991') {
                const dk = headDim.dk || d * 2.0;
                const sKey = headDim.s || d * 0.6;
                entities.push(createCircleEntity(basePoint, dk / 2, layer, colorBolt));
                entities.push(createCircleEntity(basePoint, d / 2, layer, '#64748b'));
                entities.push(createHexagonEntity(basePoint, sKey / Math.sqrt(3), layer, colorThread));
            } else if (headTypeKey === 'button_iso7380') {
                const dk = headDim.dk || d * 1.75;
                const sKey = headDim.s || d * 0.6;
                entities.push(createCircleEntity(basePoint, dk / 2, layer, colorBolt));
                entities.push(createHexagonEntity(basePoint, sKey / Math.sqrt(3), layer, colorThread));
            } else if (headTypeKey === 'flange_din6921') {
                const dc = headDim.dc || d * 2.15;
                const s = headDim.s || d * 1.4;
                entities.push(createCircleEntity(basePoint, dc / 2, layer, '#64748b'));
                entities.push(createHexagonEntity(basePoint, s / Math.sqrt(3), layer, colorBolt));
            }

            const extent = Math.max(d * 1.2, (headDim.dk || headDim.s || headDim.dc || d * 1.6) / 2 + 5);
            entities.push(createLineEntity({ x: basePoint.x - extent, y: basePoint.y }, { x: basePoint.x + extent, y: basePoint.y }, layer, colorCenter));
            entities.push(createLineEntity({ x: basePoint.x, y: basePoint.y - extent }, { x: basePoint.x, y: basePoint.y + extent }, layer, colorCenter));
            return entities;
        }

        if (state === 'top_nut') {
            const rHex = sNutHex / Math.sqrt(3);
            entities.push(createCircleEntity(basePoint, sNutHex / 2, layer, '#64748b'));
            entities.push(createHexagonEntity(basePoint, rHex, layer, colorBolt));
            entities.push(createCircleEntity(basePoint, rootD / 2, layer, colorBolt));
            entities.push(createArcEntity(basePoint, d / 2, Math.PI * 0.25, Math.PI * 1.85, layer, colorThread));

            const extent = sNutHex / 2 + 6;
            entities.push(createLineEntity({ x: basePoint.x - extent, y: basePoint.y }, { x: basePoint.x + extent, y: basePoint.y }, layer, colorCenter));
            entities.push(createLineEntity({ x: basePoint.x, y: basePoint.y - extent }, { x: basePoint.x, y: basePoint.y + extent }, layer, colorCenter));
            return entities;
        }

        // 2. SIDE VIEWS (Detailed, Section, Schematic)
        // ISO 128 Drawing Standard: Solid bolts and shafts are NOT cut longitudinally!
        // Bolt Head
        if (headTypeKey === 'countersunk_din7991') {
            const dk = headDim.dk || d * 2.0;
            entities.push(createLineEntity({ x: basePoint.x - kHead, y: basePoint.y - dk / 2 }, { x: basePoint.x - kHead, y: basePoint.y + dk / 2 }, layer, colorBolt));
            entities.push(createLineEntity({ x: basePoint.x - kHead, y: basePoint.y + dk / 2 }, { x: basePoint.x, y: basePoint.y + d / 2 }, layer, colorBolt));
            entities.push(createLineEntity({ x: basePoint.x, y: basePoint.y - d / 2 }, { x: basePoint.x - kHead, y: basePoint.y - dk / 2 }, layer, colorBolt));
        } else if (headTypeKey === 'flange_din6921') {
            const dc = headDim.dc || d * 2.15;
            const cFlange = headDim.c || Math.max(1.5, d * 0.2);
            entities.push(createRectangleEntity({ x: basePoint.x - cFlange / 2, y: basePoint.y }, cFlange, dc, layer, colorBolt));
            entities.push(createRectangleEntity({ x: basePoint.x - cFlange - (kHead - cFlange) / 2, y: basePoint.y }, kHead - cFlange, wHead, layer, colorBolt));
        } else if (headTypeKey === 'button_iso7380') {
            entities.push(createRectangleEntity({ x: basePoint.x - kHead / 2, y: basePoint.y }, kHead, wHead, layer, colorBolt));
            entities.push(createArcEntity({ x: basePoint.x, y: basePoint.y }, wHead / 2, Math.PI * 0.7, Math.PI * 1.3, layer, colorThread));
        } else {
            // Hex or Socket Cap Head
            entities.push(createRectangleEntity({ x: basePoint.x - kHead / 2, y: basePoint.y }, kHead, wHead, layer, colorBolt));
            if (headTypeKey === 'hex_iso4014') {
                const innerW = wHead * 0.58;
                entities.push(createLineEntity({ x: basePoint.x - kHead, y: basePoint.y - innerW / 2 }, { x: basePoint.x, y: basePoint.y - innerW / 2 }, layer, '#64748b'));
                entities.push(createLineEntity({ x: basePoint.x - kHead, y: basePoint.y + innerW / 2 }, { x: basePoint.x, y: basePoint.y + innerW / 2 }, layer, '#64748b'));
            }
        }

        // Bolt Shank
        entities.push(createRectangleEntity(
            { x: basePoint.x + length / 2, y: basePoint.y },
            length,
            d,
            layer,
            colorBolt
        ));

        // Threaded Portion & Runout
        const threadStartX = basePoint.x + length - threadLen;

        if (state === 'side_detailed' || state === 'side_section') {
            // Thread root lines (dashed/amber per ISO)
            entities.push(createLineEntity({ x: threadStartX, y: basePoint.y + rootD / 2 }, { x: basePoint.x + length, y: basePoint.y + rootD / 2 }, layer, colorThread));
            entities.push(createLineEntity({ x: threadStartX, y: basePoint.y - rootD / 2 }, { x: basePoint.x + length, y: basePoint.y - rootD / 2 }, layer, colorThread));
            // Thread runout / end line
            entities.push(createLineEntity({ x: threadStartX, y: basePoint.y - d / 2 }, { x: threadStartX, y: basePoint.y + d / 2 }, layer, colorThread));

            // 45° Point end chamfer
            const chamfer = Math.min(pitch * 1.5, 2.5);
            entities.push(createLineEntity({ x: basePoint.x + length - chamfer, y: basePoint.y + d / 2 }, { x: basePoint.x + length, y: basePoint.y + rootD / 2 }, layer, colorBolt));
            entities.push(createLineEntity({ x: basePoint.x + length - chamfer, y: basePoint.y - d / 2 }, { x: basePoint.x + length, y: basePoint.y - rootD / 2 }, layer, colorBolt));
        }

        // Clamped Joint or Washer & Nut Attachment
        if (compMode === 'assembly') {
            let curX = basePoint.x + length - threadLen + Math.max(5, d * 0.5);

            // Washer
            if (washerTypeKey !== 'none') {
                if (state === 'side_section') {
                    // Washer section with 45° hatch
                    entities.push(createLineEntity({ x: curX, y: basePoint.y + dWasherActive / 2 }, { x: curX + tWasherActive, y: basePoint.y + dWasherActive / 2 }, layer, colorHardware));
                    entities.push(createLineEntity({ x: curX, y: basePoint.y - dWasherActive / 2 }, { x: curX + tWasherActive, y: basePoint.y - dWasherActive / 2 }, layer, colorHardware));
                    entities.push(createLineEntity({ x: curX, y: basePoint.y + d / 2 }, { x: curX + tWasherActive, y: basePoint.y + d / 2 }, layer, colorHardware));
                    entities.push(createLineEntity({ x: curX, y: basePoint.y - d / 2 }, { x: curX + tWasherActive, y: basePoint.y - d / 2 }, layer, colorHardware));
                    entities.push(createLineEntity({ x: curX, y: basePoint.y + d / 2 }, { x: curX, y: basePoint.y + dWasherActive / 2 }, layer, colorHardware));
                    entities.push(createLineEntity({ x: curX, y: basePoint.y - dWasherActive / 2 }, { x: curX, y: basePoint.y - d / 2 }, layer, colorHardware));
                    entities.push(createLineEntity({ x: curX + tWasherActive, y: basePoint.y + d / 2 }, { x: curX + tWasherActive, y: basePoint.y + dWasherActive / 2 }, layer, colorHardware));
                    entities.push(createLineEntity({ x: curX + tWasherActive, y: basePoint.y - dWasherActive / 2 }, { x: curX + tWasherActive, y: basePoint.y - d / 2 }, layer, colorHardware));

                    entities.push(...generateHatchLines(curX, curX + tWasherActive, basePoint.y + d / 2, basePoint.y + dWasherActive / 2, 1.5, 45, layer, colorHatch));
                    entities.push(...generateHatchLines(curX, curX + tWasherActive, basePoint.y - dWasherActive / 2, basePoint.y - d / 2, 1.5, 45, layer, colorHatch));
                } else {
                    entities.push(createRectangleEntity({ x: curX + tWasherActive / 2, y: basePoint.y }, tWasherActive, dWasherActive, layer, colorHardware));
                }
                curX += tWasherActive;
            }

            // Nut
            if (state === 'side_section') {
                // Sectioned nut with 45° hatching showing thread engagement
                const nutX0 = curX;
                const nutX1 = curX + mNutActive;

                entities.push(createLineEntity({ x: nutX0, y: basePoint.y + sNutHex / 2 }, { x: nutX1, y: basePoint.y + sNutHex / 2 }, layer, colorBolt));
                entities.push(createLineEntity({ x: nutX0, y: basePoint.y - sNutHex / 2 }, { x: nutX1, y: basePoint.y - sNutHex / 2 }, layer, colorBolt));
                entities.push(createLineEntity({ x: nutX0, y: basePoint.y + d / 2 }, { x: nutX0, y: basePoint.y + sNutHex / 2 }, layer, colorBolt));
                entities.push(createLineEntity({ x: nutX0, y: basePoint.y - sNutHex / 2 }, { x: nutX0, y: basePoint.y - d / 2 }, layer, colorBolt));
                entities.push(createLineEntity({ x: nutX1, y: basePoint.y + d / 2 }, { x: nutX1, y: basePoint.y + sNutHex / 2 }, layer, colorBolt));
                entities.push(createLineEntity({ x: nutX1, y: basePoint.y - sNutHex / 2 }, { x: nutX1, y: basePoint.y - d / 2 }, layer, colorBolt));

                // 45° Nut walls hatching
                entities.push(...generateHatchLines(nutX0, nutX1, basePoint.y + d / 2, basePoint.y + sNutHex / 2, 2.0, 45, layer, colorHatch));
                entities.push(...generateHatchLines(nutX0, nutX1, basePoint.y - sNutHex / 2, basePoint.y - d / 2, 2.0, 45, layer, colorHatch));

                if (nutTypeKey === 'cap_din1587') {
                    entities.push(createArcEntity({ x: nutX1, y: basePoint.y }, sNutHex / 2, -Math.PI / 2, Math.PI / 2, layer, colorBolt));
                }
            } else {
                entities.push(createRectangleEntity({ x: curX + mNutActive / 2, y: basePoint.y }, mNutActive, sNutHex, layer, colorBolt));
                const innerNutW = sNutHex * 0.58;
                entities.push(createLineEntity({ x: curX, y: basePoint.y - innerNutW / 2 }, { x: curX + mNutActive, y: basePoint.y - innerNutW / 2 }, layer, '#64748b'));
                entities.push(createLineEntity({ x: curX, y: basePoint.y + innerNutW / 2 }, { x: curX + mNutActive, y: basePoint.y + innerNutW / 2 }, layer, '#64748b'));
            }
        } else if (compMode === 'tapped_joint') {
            // Tapped Joint Assembly: Bolt passes through top plate into tapped bottom plate
            const jointPlateH = Math.max(35, wHead * 1.4);
            const tTop = plateT * 0.45;
            const tBottom = length - tTop - 5;

            if (state === 'side_section') {
                // Top Plate (+45° Hatching)
                entities.push(...generateHatchLines(basePoint.x, basePoint.x + tTop, basePoint.y + dh / 2, basePoint.y + jointPlateH, 2.5, 45, layer, colorHatch));
                entities.push(...generateHatchLines(basePoint.x, basePoint.x + tTop, basePoint.y - jointPlateH, basePoint.y - dh / 2, 2.5, 45, layer, colorHatch));

                // Bottom Plate (-45° Hatching for adjacent part per ISO 128)
                entities.push(...generateHatchLines(basePoint.x + tTop, basePoint.x + tTop + tBottom, basePoint.y + d / 2, basePoint.y + jointPlateH, 2.5, -45, layer, '#475569'));
                entities.push(...generateHatchLines(basePoint.x + tTop, basePoint.x + tTop + tBottom, basePoint.y - jointPlateH, basePoint.y - d / 2, 2.5, -45, layer, '#475569'));

                // Joint interface line between plates
                entities.push(createLineEntity({ x: basePoint.x + tTop, y: basePoint.y + dh / 2 }, { x: basePoint.x + tTop, y: basePoint.y + jointPlateH }, layer, colorHardware));
                entities.push(createLineEntity({ x: basePoint.x + tTop, y: basePoint.y - jointPlateH }, { x: basePoint.x + tTop, y: basePoint.y - dh / 2 }, layer, colorHardware));
            }
        }

        // Centerline
        entities.push(createLineEntity(
            { x: basePoint.x - kHead - 10, y: basePoint.y },
            { x: basePoint.x + length + 15, y: basePoint.y },
            layer,
            colorCenter
        ));

        return entities;
    },
    generate3D: (params, basePos = { x: 0, y: 0, z: 0 }) => {
        const size = String(params.size || 'M12');
        const spec = METRIC_FASTENER_SPECS[size] || METRIC_FASTENER_SPECS['M12'];
        const length = Math.max(10, Number(params.length) || 60);
        const headTypeKey = String(params.headType || 'hex_iso4014');
        const nutTypeKey = String(params.nutType || 'hex_iso4032');
        const washerTypeKey = String(params.washerType || 'standard_iso7089');
        const holeDepth = Math.max(5, Number(params.holeDepth) || 35);

        // Resolve componentMode
        let compMode = String(params.componentMode || '');
        if (compMode === 'bolt_nut_washer') compMode = 'assembly';
        if (!compMode) {
            const legacyNut = String(params.nutOption || 'washer_nut');
            if (legacyNut === 'nut_only') compMode = 'nut_only';
            else if (legacyNut === 'washer_only') compMode = 'washer_only';
            else if (legacyNut === 'none') compMode = 'bolt_only';
            else compMode = 'assembly';
        }

        let mNutActive = spec.mNut;
        if (nutTypeKey === 'thin_din439') mNutActive = spec.mThin;
        else if (nutTypeKey === 'nyloc_din985') mNutActive = spec.mNyloc;
        else if (nutTypeKey === 'cap_din1587') mNutActive = spec.hCap;
        else if (nutTypeKey === 'flange_din6923') mNutActive = spec.mFlange;

        const sNutHex = spec.sHex;
        let tWasherActive = spec.tWasher;
        let dWasherActive = spec.dWasher;
        if (washerTypeKey === 'wide_iso7093') {
            tWasherActive = spec.tWasherLarge;
            dWasherActive = spec.dWasherLarge;
        } else if (washerTypeKey === 'spring_din127') {
            tWasherActive = spec.tSpring;
            dWasherActive = spec.dSpring;
        }

        const d = parseFloat(size.replace('M', '')) || 12;

        // ═══════════════════════════════════════════════════════════════
        // 1. NUT ONLY: ONLY NUT! ZERO BOLT GENERATED!
        // ═══════════════════════════════════════════════════════════════
        if (compMode === 'nut_only') {
            return [
                {
                    id: `bolt_nut_${Date.now()}`,
                    name: `${size} Altı Köşe Somun (${nutTypeKey})`,
                    kind: 'hex-nut',
                    color: '#94a3b8',
                    position: { x: basePos.x + mNutActive / 2, y: basePos.y, z: basePos.z },
                    rotation: { x: 0, y: 0, z: 90 },
                    params: { nominalDiameter: d, headSize: sNutHex, depth: mNutActive, pitch: spec.pitch },
                    designStandard: 'ISO 4032 / DIN 934'
                }
            ];
        }

        // ═══════════════════════════════════════════════════════════════
        // 2. WASHER ONLY: ONLY WASHER!
        // ═══════════════════════════════════════════════════════════════
        if (compMode === 'washer_only') {
            return [
                {
                    id: `bolt_washer_${Date.now()}`,
                    name: `${size} Düz Pul (${washerTypeKey})`,
                    kind: 'washer',
                    color: '#cbd5e1',
                    position: { x: basePos.x + tWasherActive / 2, y: basePos.y, z: basePos.z },
                    rotation: { x: 0, y: 0, z: 90 },
                    params: { diameter: dWasherActive, innerDiameter: spec.dhMed, depth: tWasherActive },
                    designStandard: 'ISO 7089'
                }
            ];
        }

        // ═══════════════════════════════════════════════════════════════
        // 3. HOLE MODES: Plate Block with Bore
        // ═══════════════════════════════════════════════════════════════
        if (compMode === 'hole_clearance' || compMode === 'hole_tapped') {
            const hDepth = Math.max(10, holeDepth);
            return [
                {
                    id: `fastener_hole_block_${Date.now()}`,
                    name: `${size} Delik Bloğu (${compMode === 'hole_tapped' ? 'Kılavuz' : 'Geçiş'})`,
                    kind: 'box',
                    color: '#334155',
                    position: { x: basePos.x + hDepth / 2, y: basePos.y, z: basePos.z },
                    rotation: { x: 0, y: 0, z: 0 },
                    params: { width: hDepth, height: d * 3, depth: d * 3 }
                }
            ];
        }

        // ═══════════════════════════════════════════════════════════════
        // 4. BOLT, ASSEMBLY, TAPPED JOINT MODES
        // ═══════════════════════════════════════════════════════════════
        let boltTypeId: BoltTypeId = 'hex_bolt';
        if (headTypeKey === 'socket_din912') boltTypeId = 'socket_cap';
        else if (headTypeKey === 'countersunk_din7991') boltTypeId = 'countersunk';
        else if (headTypeKey === 'button_iso7380') boltTypeId = 'button_head';
        else if (headTypeKey === 'flange_din6921') boltTypeId = 'flange_hex';

        const headDim = getBoltHeadDimensions(boltTypeId, size);
        const kHead = headDim.k;
        const wHead = headDim.s || headDim.dk || headDim.dc || d * 1.6;

        const parts: DynamicPart3DDef[] = [
            // Parametric 3D Solid Bolt (Head, Shank, Threads)
            {
                id: `bolt_solid_${Date.now()}`,
                name: `${size} Cıvata (${headTypeKey}, L=${length} mm)`,
                kind: 'hex-bolt',
                color: '#94a3b8',
                position: { x: basePos.x, y: basePos.y, z: basePos.z },
                rotation: { x: 0, y: 0, z: 90 },
                params: {
                    diameter: d,
                    length,
                    headSize: wHead,
                    headHeight: kHead,
                    boltType: boltTypeId,
                    threadLength: Math.min(length, Math.max(d * 1.5, length - 2 * d)),
                    pitch: spec.pitch
                },
                designStandard: 'ISO 4014 / DIN 912'
            }
        ];

        // 3D Washer & Nut for Assembly
        if (compMode === 'assembly') {
            const threadLen = Math.min(length, 2 * d + 6);
            let curX = basePos.x + length - threadLen + Math.max(5, d * 0.5);

            if (washerTypeKey !== 'none') {
                parts.push({
                    id: `bolt_washer_${Date.now()}`,
                    name: `${size} Düz Pul (${washerTypeKey})`,
                    kind: 'washer',
                    color: '#cbd5e1',
                    position: { x: curX + tWasherActive / 2, y: basePos.y, z: basePos.z },
                    rotation: { x: 0, y: 0, z: 90 },
                    params: { diameter: dWasherActive, innerDiameter: spec.dhMed, depth: tWasherActive },
                    designStandard: 'ISO 7089'
                });
                curX += tWasherActive;
            }

            parts.push({
                id: `bolt_nut_${Date.now()}`,
                name: `${size} Altı Köşe Somun (${nutTypeKey})`,
                kind: 'hex-nut',
                color: '#94a3b8',
                position: { x: curX + mNutActive / 2, y: basePos.y, z: basePos.z },
                rotation: { x: 0, y: 0, z: 90 },
                params: { nominalDiameter: d, headSize: sNutHex, depth: mNutActive, pitch: spec.pitch },
                designStandard: 'ISO 4032 / DIN 934'
            });
        }

        return parts;
    },
    getGrips: (params, basePoint = { x: 0, y: 0 }) => {
        let compMode = String(params.componentMode || '');
        if (!compMode) {
            const legacyNut = String(params.nutOption || 'washer_nut');
            if (legacyNut === 'nut_only') compMode = 'nut_only';
            else if (legacyNut === 'washer_only') compMode = 'washer_only';
            else if (legacyNut === 'none') compMode = 'bolt_only';
            else compMode = 'assembly';
        }

        const grips: DynamicGrip[] = [];

        // Nut or Washer Only Grips: Only visibility selector
        if (compMode === 'nut_only' || compMode === 'washer_only') {
            grips.push({
                id: 'grip_fastener_vis',
                type: 'visibility',
                paramId: 'visState',
                position: { x: basePoint.x + 25, y: basePoint.y - 25 },
                tooltip: 'Görünüş Değiştir (Yan Detaylı / 45° Kesit / Şematik / Üst)',
                tooltipTr: 'Görünüş Değiştir (Yan Detaylı / 45° Kesit / Şematik / Üst)'
            });
            return grips;
        }

        // Hole Modes Grips: Stretch Hole Depth & Tap Depth
        if (compMode === 'hole_clearance' || compMode === 'hole_tapped') {
            const holeDepth = Math.max(5, Number(params.holeDepth) || 35);
            const tapDepth = Math.max(5, Number(params.tapDepth) || 25);

            grips.push({
                id: 'grip_hole_depth',
                type: 'stretch',
                paramId: 'holeDepth',
                position: { x: basePoint.x + holeDepth, y: basePoint.y },
                direction: { x: 1, y: 0 },
                tooltip: `Grip: Delik Derinliği (${holeDepth} mm)`,
                tooltipTr: `Grip: Delik Derinliği (${holeDepth} mm)`
            });

            if (compMode === 'hole_tapped') {
                grips.push({
                    id: 'grip_tap_depth',
                    type: 'stretch',
                    paramId: 'tapDepth',
                    position: { x: basePoint.x + tapDepth, y: basePoint.y + 8 },
                    direction: { x: 1, y: 0 },
                    tooltip: `Grip: Kılavuz Diş Boyu (${tapDepth} mm)`,
                    tooltipTr: `Grip: Kılavuz Diş Boyu (${tapDepth} mm)`
                });
            }

            grips.push({
                id: 'grip_hole_vis',
                type: 'visibility',
                paramId: 'visState',
                position: { x: basePoint.x - 20, y: basePoint.y - 25 },
                tooltip: 'Görünüş Değiştir (Kesit / Üstten Görünüş)',
                tooltipTr: 'Görünüş Değiştir (Kesit / Üstten Görünüş)'
            });
            return grips;
        }

        // Bolt / Assembly Modes: Shank Length & Thread Length Grips
        const length = Math.max(10, Number(params.length) || 60);
        const size = String(params.size || 'M12');
        const spec = METRIC_FASTENER_SPECS[size] || METRIC_FASTENER_SPECS['M12'];
        const dNom = parseFloat(size.replace('M', '')) || 12;
        const thMode = String(params.threadLengthMode || 'standard');
        let bStd = length <= 125 ? 2 * dNom + 6 : length <= 200 ? 2 * dNom + 12 : 2 * dNom + 25;
        if (thMode === 'full') bStd = length;
        else if (thMode === 'custom') bStd = Math.min(length, Math.max(5, Number(params.threadLength) || bStd));
        const threadLen = Math.min(length, bStd);
        const threadStartX = basePoint.x + length - threadLen;

        grips.push(
            // Linear Stretch Shank Length Grip
            {
                id: 'grip_bolt_length',
                type: 'stretch',
                paramId: 'length',
                position: { x: basePoint.x + length, y: basePoint.y },
                direction: { x: 1, y: 0 },
                tooltip: `Grip: Cıvata Boyu (L = ${length} mm)`,
                tooltipTr: `Grip: Cıvata Boyu (L = ${length} mm)`
            },
            // Thread / Paso Length Stretch Grip
            {
                id: 'grip_bolt_thread_len',
                type: 'stretch',
                paramId: 'threadLength',
                position: { x: threadStartX, y: basePoint.y },
                direction: { x: -1, y: 0 },
                tooltip: `Grip: Diş/Paso Boyu (b = ${threadLen.toFixed(0)} mm)`,
                tooltipTr: `Grip: Diş/Paso Boyu (b = ${threadLen.toFixed(0)} mm)`
            },
            // Visibility State Flip Grip
            {
                id: 'grip_bolt_vis',
                type: 'visibility',
                paramId: 'visState',
                position: { x: basePoint.x - 35, y: basePoint.y - 25 },
                tooltip: 'Görünüş Değiştir (Yan Detaylı / 45° Kesit / Şematik / Kafa Üst / Somun Üst)',
                tooltipTr: 'Görünüş Değiştir (Yan Detaylı / 45° Kesit / Şematik / Kafa Üst / Somun Üst)'
            }
        );

        return grips;
    }
};
