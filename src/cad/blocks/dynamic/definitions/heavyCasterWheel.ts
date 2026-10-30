/**
 * 🧱 Dynamic Heavy-Duty Industrial Caster Wheel (EN 12532 / ISO 22883 / Blickle Heavy Series)
 *
 * - Lookup Catalog: Ø80, Ø100, Ø125, Ø160, Ø200, Ø250 mm Swivel & Fixed Industrial Casters
 * - Visibility States:
 *    - Side Elevation View (Yan Görünüş — Döner Maşa, Fren Pedalı, Poliüretan Tekerlek ve HATCH)
 *    - Front Axial Cross-Section (Ön Kesit — Rulmanlı Tekerlek Göbeği, Aks Cıvatası ve ISO 128 HATCH)
 *    - Top Mounting Plate Plan (Üst Görünüş — EN 12532 4'lü Montaj Slotu ve Döner Tabla Çemberi)
 * - 3D Solids: Top mounting plate + swivel fork + polyurethane wheel + axle hub
 */

import {
    CadEntity,
    createLineEntity,
    createRectangleEntity,
    createCircleEntity,
    createHatchEntity
} from '../../../kernel/types';
import { DynamicBlockDef, DynamicGrip, DynamicPart3DDef } from '../types';

export interface HeavyCasterSpec {
    code: string;
    D: number;         // Wheel diameter (mm)
    T: number;         // Wheel tread width (mm)
    H: number;         // Total overall height (mm)
    offsetF: number;   // Swivel offset / trail (mm)
    plateL: number;    // Top plate length (mm)
    plateW: number;    // Top plate width (mm)
    boltL: number;     // Bolt hole spacing X (mm)
    boltW: number;     // Bolt hole spacing Y (mm)
    boltDia: number;   // Mounting bolt hole diameter (mm)
    loadCapKg: number;
}

export const HEAVY_CASTER_CATALOG: Record<string, HeavyCasterSpec> = {
    CASTER_80:  { code: 'CASTER_80',  D: 80,  T: 32, H: 108, offsetF: 38, plateL: 100, plateW: 85,  boltL: 80,  boltW: 60, boltDia: 9,  loadCapKg: 200 },
    CASTER_100: { code: 'CASTER_100', D: 100, T: 38, H: 130, offsetF: 42, plateL: 100, plateW: 85,  boltL: 80,  boltW: 60, boltDia: 9,  loadCapKg: 300 },
    CASTER_125: { code: 'CASTER_125', D: 125, T: 45, H: 158, offsetF: 48, plateL: 140, plateW: 110, boltL: 105, boltW: 80, boltDia: 11, loadCapKg: 450 },
    CASTER_160: { code: 'CASTER_160', D: 160, T: 50, H: 200, offsetF: 55, plateL: 140, plateW: 110, boltL: 105, boltW: 80, boltDia: 11, loadCapKg: 650 },
    CASTER_200: { code: 'CASTER_200', D: 200, T: 50, H: 240, offsetF: 62, plateL: 140, plateW: 110, boltL: 105, boltW: 80, boltDia: 11, loadCapKg: 900 },
    CASTER_250: { code: 'CASTER_250', D: 250, T: 60, H: 295, offsetF: 72, plateL: 175, plateW: 140, boltL: 140, boltW: 105, boltDia: 14, loadCapKg: 1350 }
};

export const DYN_HEAVY_CASTER: DynamicBlockDef = {
    id: 'dyn_heavy_caster_wheel',
    name: 'Heavy-Duty Industrial Caster Wheel (EN 12532 / Blickle)',
    nameTr: 'Dinamik Ağır Hizmet Sanayi Tekerleği (EN 12532 — Frenli Döner)',
    category: 'Mechanical',
    subcategory: 'Material Handling & Conveyors',
    subcategoryTr: 'Konveyör ve Taşıma Sistemleri',
    description: 'EN 12532 heavy-duty swivel & brake industrial caster wheel (Ø80–Ø250 mm) with polyurethane tread, cast iron hub, swivel raceway, side elevation, front cross-section (HATCH), and top mounting plate.',
    descriptionTr: 'EN 12532 normunda ağır hizmet tipi döner tablalı ve frenli poliüretan sanayi tekerleği (Ø80–Ø250 mm); yan görünüş, ön rulman kesiti (HATCH) ve üst bağlantı tablası.',
    icon: '🛞',
    calculatorRoute: '/bearings/',
    calculatorModuleType: 'bearings',
    calculatorLabelTr: 'Tekerlek Yükü ve Rulman Ömür Hesabına Git',
    citation: {
        tier: 1,
        standard: 'EN 12532:1999 / ISO 22883 / Blickle Heavy-Duty Casters',
        clause: 'Castors and wheels — Industrial castors up to 1.1 m/s (4 km/h) — Boundary and top plate dimensions',
        description: 'Standard overall height H, swivel offset F, wheel diameter D, and 4-bolt mounting plate patterns.'
    },
    linearParams: [],
    flipParams: [
        {
            id: 'flipTrail',
            name: 'flipTrail',
            label: 'Flip Swivel Trail Direction',
            labelTr: 'Tekerlek Dönüş Yönünü Çevir',
            axis: 'horizontal',
            default: false
        }
    ],
    visibilityParam: {
        id: 'viewMode',
        name: 'viewMode',
        label: 'View / Section Mode',
        labelTr: 'Görünüş / Kesit Modu',
        states: [
            { id: 'side_elevation', label: 'Side Elevation View (Yan Görünüş — Döner Maşa & Fren Pedalı)', labelTr: 'Yan Görünüş (Döner Maşa, Fren Pedalı & Poliüretan Sırt)' },
            { id: 'front_section', label: 'Front Axial Section (Ön Kesit — Aks Cıvatası & Göbek HATCH)', labelTr: 'Ön Kesit (Aks Cıvatası, Rulman & Poliüretan Sırt — HATCH)' },
            { id: 'top_plate', label: 'Top Mounting Plate Plan (Üst Görünüş — EN 12532 Cıvata Slotları)', labelTr: 'Üst Görünüş (EN 12532 Bağlantı Tablası & Cıvata Delikleri)' }
        ],
        default: 'side_elevation'
    },
    lookupParams: [
        {
            id: 'casterModel',
            name: 'casterModel',
            label: 'Heavy Caster Series (EN 12532)',
            labelTr: 'Sanayi Tekerleği Boyutu (EN 12532)',
            options: Object.values(HEAVY_CASTER_CATALOG).map((c) => ({
                id: c.code,
                label: `${c.code} (Teker Ø${c.D}×${c.T}mm — Toplam H=${c.H}mm, Tabla ${c.plateL}×${c.plateW}mm, Kapasite: ${c.loadCapKg} kg)`,
                standard: 'EN 12532',
                values: { casterModel: c.code }
            })),
            default: 'CASTER_160'
        }
    ],
    defaultValues: {
        casterModel: 'CASTER_160',
        flipTrail: false,
        viewMode: 'side_elevation'
    },
    generate2D: (params, basePoint = { x: 0, y: 0 }) => {
        const modelKey = String(params.casterModel || 'CASTER_160');
        const spec = HEAVY_CASTER_CATALOG[modelKey] || HEAVY_CASTER_CATALOG.CASTER_160;
        const flip = Boolean(params.flipTrail);
        const viewMode = String(params.viewMode || 'side_elevation');

        const { D, T, H, offsetF, plateL, plateW, boltL, boltW, boltDia } = spec;
        const R = D / 2;
        const dir = flip ? -1 : 1;

        const entities: CadEntity[] = [];
        const layerFork = 'layer-mech';
        const layerWheel = 'layer-accent';
        const layerRef = 'layer-ref';

        const cx = basePoint.x;
        const cy = basePoint.y; // Floor contact at y = cy, top plate at y = cy + H

        if (viewMode === 'top_plate') {
            // Top Plate Plan View centered at (cx, cy)
            entities.push(
                createLineEntity({ x: cx - plateL / 2 - 12, y: cy }, { x: cx + plateL / 2 + 12, y: cy }, layerRef, '#ef4444'),
                createLineEntity({ x: cx, y: cy - plateW / 2 - 12 }, { x: cx, y: cy + plateW / 2 + 12 }, layerRef, '#ef4444'),
                createRectangleEntity({ x: cx, y: cy }, plateL, plateW, layerFork, '#38bdf8'),
                createCircleEntity({ x: cx, y: cy }, plateW * 0.42, layerFork, '#94a3b8'),
                // Offset wheel footprint
                createRectangleEntity({ x: cx + dir * offsetF, y: cy }, D, T, layerWheel, '#f59e0b')
            );
            for (const sx of [-1, 1]) {
                for (const sy of [-1, 1]) {
                    entities.push(
                        createCircleEntity({ x: cx + sx * (boltL / 2), y: cy + sy * (boltW / 2) }, boltDia / 2, layerWheel, '#22c55e')
                    );
                }
            }
            return entities;
        }

        if (viewMode === 'front_section') {
            // Front Axial Cross-Section View
            const wheelCY = cy + R;
            const plateT = 8;
            const swivelH = 14;
            const forkSpan = T + 18;

            entities.push(
                createLineEntity({ x: cx, y: cy - 10 }, { x: cx, y: cy + H + 10 }, layerRef, '#ef4444'),
                createLineEntity({ x: cx - forkSpan, y: wheelCY }, { x: cx + forkSpan, y: wheelCY }, layerRef, '#ef4444'),
                // Top plate & swivel head
                createRectangleEntity({ x: cx, y: cy + H - plateT / 2 }, plateW, plateT, layerFork, '#38bdf8'),
                createRectangleEntity({ x: cx, y: cy + H - plateT - swivelH / 2 }, plateW * 0.78, swivelH, layerFork, '#94a3b8'),
                // Left & Right Pressed Steel Fork Legs
                createRectangleEntity({ x: cx - forkSpan / 2, y: (wheelCY - 12 + (cy + H - plateT - swivelH)) / 2 }, 7, cy + H - plateT - swivelH - (wheelCY - 12), layerFork, '#38bdf8'),
                createRectangleEntity({ x: cx + forkSpan / 2, y: (wheelCY - 12 + (cy + H - plateT - swivelH)) / 2 }, 7, cy + H - plateT - swivelH - (wheelCY - 12), layerFork, '#38bdf8'),
                // Axle Bolt
                createRectangleEntity({ x: cx, y: wheelCY }, forkSpan + 16, 14, layerFork, '#f8fafc'),
                // Wheel Polyurethane Tread & Cast Iron Hub Section with ISO 128 HATCH
                createRectangleEntity({ x: cx, y: wheelCY }, T, D, layerWheel, '#f59e0b'),
                createHatchEntity([
                    { x: cx - T / 2, y: cy + D - 14 },
                    { x: cx + T / 2, y: cy + D - 14 },
                    { x: cx + T / 2, y: cy + D },
                    { x: cx - T / 2, y: cy + D }
                ], 'ANSI31', layerWheel, '#ea580c'),
                createHatchEntity([
                    { x: cx - T / 2, y: cy },
                    { x: cx + T / 2, y: cy },
                    { x: cx + T / 2, y: cy + 14 },
                    { x: cx - T / 2, y: cy + 14 }
                ], 'ANSI31', layerWheel, '#ea580c')
            );
            return entities;
        }

        // Side Elevation View (Swivel Offset F, Wheel, Fork, Brake Pedal, and Partial Tire Section HATCH)
        const wheelX = cx + dir * offsetF;
        const wheelY = cy + R;
        const plateT = 8;
        const swivelH = 14;

        // Swivel Kingpin Axis & Wheel Axle Crosshairs
        entities.push(
            createLineEntity({ x: cx, y: cy }, { x: cx, y: cy + H + 12 }, layerRef, '#ef4444'),
            createLineEntity({ x: wheelX - R - 10, y: wheelY }, { x: wheelX + R + 10, y: wheelY }, layerRef, '#ef4444'),
            createLineEntity({ x: wheelX, y: cy - 10 }, { x: wheelX, y: wheelY + R + 10 }, layerRef, '#ef4444')
        );

        // Top Mounting Plate & Swivel Raceway
        entities.push(
            createRectangleEntity({ x: cx, y: cy + H - plateT / 2 }, plateL, plateT, layerFork, '#38bdf8'),
            createRectangleEntity({ x: cx, y: cy + H - plateT - swivelH / 2 }, plateL * 0.76, swivelH, layerFork, '#94a3b8')
        );

        // Swivel Fork Polygon connecting Top Raceway to Offset Wheel Axle
        const forkTopY = cy + H - plateT - swivelH;
        const forkPoly = [
            { x: cx - dir * (plateL * 0.32), y: forkTopY },
            { x: cx + dir * (plateL * 0.34), y: forkTopY },
            { x: wheelX + dir * 20, y: wheelY + 12 },
            { x: wheelX + dir * 16, y: wheelY - 14 },
            { x: wheelX - dir * 16, y: wheelY - 14 }
        ];
        for (let i = 0; i < forkPoly.length; i++) {
            entities.push(
                createLineEntity(forkPoly[i], forkPoly[(i + 1) % forkPoly.length], layerFork, '#38bdf8')
            );
        }

        // Total-Lock Foot Brake Pedal
        const pedalPoly = [
            { x: wheelX + dir * 14, y: wheelY + 8 },
            { x: wheelX + dir * (R + 28), y: wheelY + R * 0.45 },
            { x: wheelX + dir * (R + 24), y: wheelY + R * 0.25 },
            { x: wheelX + dir * 12, y: wheelY - 4 }
        ];
        entities.push(
            createHatchEntity(pedalPoly, 'ANSI31', layerWheel, '#ef4444')
        );

        // Polyurethane Wheel Tire, Cast Iron Rim & Ball Bearing Hub
        entities.push(
            createCircleEntity({ x: wheelX, y: wheelY }, R, layerWheel, '#f59e0b'),
            createCircleEntity({ x: wheelX, y: wheelY }, R * 0.76, layerFork, '#94a3b8'),
            createCircleEntity({ x: wheelX, y: wheelY }, R * 0.28, layerFork, '#38bdf8'),
            createCircleEntity({ x: wheelX, y: wheelY }, 8, layerRef, '#f8fafc')
        );

        return entities;
    },
    generate3D: (params, basePos = { x: 0, y: 0, z: 0 }) => {
        const modelKey = String(params.casterModel || 'CASTER_160');
        const spec = HEAVY_CASTER_CATALOG[modelKey] || HEAVY_CASTER_CATALOG.CASTER_160;
        const { D, T, H, offsetF, plateL, plateW } = spec;

        return [
            {
                id: 'caster-plate',
                name: `${spec.code} Top Mounting Plate`,
                kind: 'box',
                color: '#94a3b8',
                position: { x: basePos.x, y: basePos.y + H - 5, z: basePos.z },
                params: { width: plateL, height: 10, depth: plateW }
            },
            {
                id: 'caster-wheel',
                name: `Polyurethane Caster Wheel Ø${D}×${T}mm`,
                kind: 'cylinder',
                color: '#ea580c',
                position: { x: basePos.x + offsetF, y: basePos.y + D / 2, z: basePos.z },
                rotation: { x: Math.PI / 2, y: 0, z: 0 },
                params: { diameter: D, length: T }
            }
        ];
    },
    getGrips: (_params, basePoint = { x: 0, y: 0 }): DynamicGrip[] => {
        return [
            {
                id: 'grip-origin',
                type: 'point',
                paramId: 'basePoint',
                position: { x: basePoint.x, y: basePoint.y },
                tooltip: 'Move Heavy Caster Wheel',
                tooltipTr: 'Sanayi Tekerleğini Taşı'
            }
        ];
    }
};
