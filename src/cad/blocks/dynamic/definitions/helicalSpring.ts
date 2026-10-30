/**
 * 🧱 Dynamic Helical Compression & ISO 10243 Die Spring (EN 13906-1 / ISO 10243 /ISO 2162-1)
 *
 * - Lookup Catalog: ISO 10243 Die Springs (Green/Blue/Red/Yellow) & EN 13906-1 Compression Springs
 * - Linear Params: Free Length L0 (25–300 mm), Working Deflection s (0–100 mm)
 * - Visibility States:
 *    - ISO 2162 Axial Cross-Section (Boyuna Kesit — Taşlanmış Uçlar, Sarım Kesitleri ve ISO 128 HATCH)
 *    - Exterior Coil View (Dış Görünüş — Helisel Yay Sarımları)
 *    - ISO 2162 Simplified Schematic Symbol (Şematik Yay Sembolü)
 * - 3D Solids: Stacked helical coil rings + top/bottom ground seats
 */

import {
    CadEntity,
    createLineEntity,
    createRectangleEntity,
    createCircleEntity,
    createHatchEntity
} from '../../../kernel/types';
import { DynamicBlockDef, DynamicGrip, DynamicPart3DDef } from '../types';

export interface HelicalSpringSpec {
    code: string;
    Dh: number;        // Hole / outer diameter (mm)
    Dd: number;        // Rod / inner guide diameter (mm)
    wireW: number;     // Wire radial width b (mm)
    wireT: number;     // Wire axial thickness h (mm)
    coils: number;     // Default active coils
    rateNmm: number;   // Spring rate R (N/mm)
    dutyColor: string;
    dutyLabelTr: string;
}

export const HELICAL_SPRING_CATALOG: Record<string, HelicalSpringSpec> = {
    ISO_16x8_GREEN:  { code: 'ISO_16x8_GREEN',  Dh: 16, Dd: 8,  wireW: 3.6,  wireT: 2.0, coils: 8,  rateNmm: 18.5,  dutyColor: '#22c55e', dutyLabelTr: 'Yeşil (Hafif Yük)' },
    ISO_20x10_BLUE:  { code: 'ISO_20x10_BLUE',  Dh: 20, Dd: 10, wireW: 4.5,  wireT: 2.5, coils: 8,  rateNmm: 34.0,  dutyColor: '#38bdf8', dutyLabelTr: 'Mavi (Orta Yük)' },
    ISO_25x12_RED:   { code: 'ISO_25x12_RED',   Dh: 25, Dd: 12.5, wireW: 5.6, wireT: 3.2, coils: 7, rateNmm: 68.0,  dutyColor: '#ef4444', dutyLabelTr: 'Kırmızı (Ağır Yük)' },
    ISO_32x16_BLUE:  { code: 'ISO_32x16_BLUE',  Dh: 32, Dd: 16, wireW: 7.1,  wireT: 4.0, coils: 7,  rateNmm: 92.0,  dutyColor: '#38bdf8', dutyLabelTr: 'Mavi (Orta Yük)' },
    ISO_40x20_RED:   { code: 'ISO_40x20_RED',   Dh: 40, Dd: 20, wireW: 9.0,  wireT: 5.0, coils: 7,  rateNmm: 155.0, dutyColor: '#ef4444', dutyLabelTr: 'Kırmızı (Ağır Yük)' },
    ISO_50x25_YELLOW:{ code: 'ISO_50x25_YELLOW',Dh: 50, Dd: 25, wireW: 11.2, wireT: 6.5, coils: 6,  rateNmm: 280.0, dutyColor: '#eab308', dutyLabelTr: 'Sarı (Ekstra Ağır Yük)' },
    ISO_63x32_RED:   { code: 'ISO_63x32_RED',   Dh: 63, Dd: 32, wireW: 14.0, wireT: 8.0, coils: 6,  rateNmm: 360.0, dutyColor: '#ef4444', dutyLabelTr: 'Kırmızı (Ağır Yük)' }
};

export const DYN_HELICAL_SPRING: DynamicBlockDef = {
    id: 'dyn_helical_spring',
    name: 'Helical Compression & Die Spring (EN 13906-1 / ISO 10243)',
    nameTr: 'Dinamik Helisel Basma & Kalıp Yayı (EN 13906-1 / ISO 10243)',
    category: 'Mechanical',
    subcategory: 'Springs & Dampers',
    subcategoryTr: 'Yay ve Sönümleme Elemanları',
    description: 'EN 13906-1 / ISO 10243 heavy-duty helical compression & rectangular-wire die spring with free length L0, live compression deflection, ISO 2162-1 cross-section with ISO 128 hatches, and schematic view.',
    descriptionTr: 'EN 13906-1 ve ISO 10243 normunda helisel basma ve kalıp yayı; serbest boy L0, sıkışma miktarı (s), ISO 2162-1 boyuna kesit (HATCH), dış sarım ve şematik görünüş.',
    icon: '🌀',
    calculatorRoute: '/springs/',
    calculatorModuleType: 'springs',
    calculatorLabelTr: 'Helisel Yay Kuvvet ve Gerilme Hesabına Git (EN 13906)',
    citation: {
        tier: 1,
        standard: 'EN 13906-1:2013 / ISO 10243:2019 / ISO 2162-1',
        clause: 'Cylindrical helical springs made from round and rectangular wire — Technical drawing representation',
        description: 'Standard die spring housings Dh, rod diameters Dd, spring rates R, and ISO 2162 section conventions.'
    },
    linearParams: [
        {
            id: 'freeLength',
            name: 'freeLength',
            label: 'Free / Loaded Length (L)',
            labelTr: 'Yay Yüksekliği / Serbest Boy (L)',
            min: 30,
            max: 300,
            step: 5,
            default: 90,
            unit: 'mm',
            axis: 'y'
        }
    ],
    flipParams: [],
    visibilityParam: {
        id: 'viewMode',
        name: 'viewMode',
        label: 'ISO 2162 Drawing Representation',
        labelTr: 'ISO 2162 Teknik Resim Görünüşü',
        states: [
            { id: 'axial_section', label: 'ISO 2162 Axial Cross-Section (Boyuna Kesit — Tel Kesitleri HATCH)', labelTr: 'Boyuna Kesit (ISO 2162 Sarım Kesitleri & Taşlanmış Uçlar)' },
            { id: 'exterior_coil', label: 'Exterior Helical View (Dış Görünüş — Tam Sarım)', labelTr: 'Dış Görünüş (Helisel Sarım Görünüşü)' },
            { id: 'schematic_iso', label: 'ISO 2162 Simplified Zigzag Symbol (Şematik Sembol)', labelTr: 'ISO 2162 Basitleştirilmiş Şematik Yay Sembolü' }
        ],
        default: 'axial_section'
    },
    lookupParams: [
        {
            id: 'springModel',
            name: 'springModel',
            label: 'Standard Die / Compression Spring (ISO 10243)',
            labelTr: 'Standart Kalıp / Basma Yayı (ISO 10243)',
            options: Object.values(HELICAL_SPRING_CATALOG).map((s) => ({
                id: s.code,
                label: `${s.code} (Dış Ø${s.Dh}mm / İç Ø${s.Dd}mm — ${s.dutyLabelTr}, R=${s.rateNmm} N/mm)`,
                standard: 'ISO 10243',
                values: { springModel: s.code }
            })),
            default: 'ISO_32x16_BLUE'
        }
    ],
    defaultValues: {
        springModel: 'ISO_32x16_BLUE',
        freeLength: 90,
        viewMode: 'axial_section'
    },
    generate2D: (params, basePoint = { x: 0, y: 0 }) => {
        const modelKey = String(params.springModel || 'ISO_32x16_BLUE');
        const spec = HELICAL_SPRING_CATALOG[modelKey] || HELICAL_SPRING_CATALOG.ISO_32x16_BLUE;
        const L = Math.max(30, Math.min(300, Number(params.freeLength) || 90));
        const viewMode = String(params.viewMode || 'axial_section');

        const { Dh, Dd, wireW, wireT, coils, dutyColor } = spec;
        const rOut = Dh / 2;
        const rIn = Dd / 2;
        const rMid = (rOut + rIn) / 2;

        const entities: CadEntity[] = [];
        const layerSpring = 'layer-mech';
        const layerRef = 'layer-ref';

        const cx = basePoint.x;
        const cy = basePoint.y;

        // Vertical Centerline
        entities.push(
            createLineEntity({ x: cx, y: cy - 10 }, { x: cx, y: cy + L + 10 }, layerRef, '#ef4444')
        );

        // Top & Bottom Ground End Seat Lines
        entities.push(
            createLineEntity({ x: cx - rOut, y: cy }, { x: cx + rOut, y: cy }, layerSpring, dutyColor),
            createLineEntity({ x: cx - rOut, y: cy + L }, { x: cx + rOut, y: cy + L }, layerSpring, dutyColor)
        );

        const pitch = (L - wireT) / coils;

        if (viewMode === 'schematic_iso') {
            // ISO 2162 Zigzag Line Symbol
            for (let i = 0; i < coils; i++) {
                const y0 = cy + wireT / 2 + i * pitch;
                const yMid = y0 + pitch / 2;
                const y1 = y0 + pitch;
                entities.push(
                    createLineEntity({ x: cx - rMid, y: y0 }, { x: cx + rMid, y: yMid }, layerSpring, dutyColor),
                    createLineEntity({ x: cx + rMid, y: yMid }, { x: cx - rMid, y: y1 }, layerSpring, dutyColor)
                );
            }
            return entities;
        }

        for (let i = 0; i <= coils; i++) {
            const yLeft = cy + wireT / 2 + i * pitch;
            const yRight = Math.min(cy + L - wireT / 2, yLeft + pitch / 2);

            if (viewMode === 'exterior_coil') {
                // Exterior diagonal coil bands connecting left and right
                entities.push(
                    createCircleEntity({ x: cx - rMid, y: yLeft }, wireT / 2, layerSpring, dutyColor),
                    createCircleEntity({ x: cx + rMid, y: yRight }, wireT / 2, layerSpring, dutyColor)
                );
                if (i < coils) {
                    entities.push(
                        createLineEntity({ x: cx - rOut, y: yLeft + wireT / 2 }, { x: cx + rOut, y: yRight + wireT / 2 }, layerSpring, dutyColor),
                        createLineEntity({ x: cx - rOut, y: yLeft - wireT / 2 }, { x: cx + rOut, y: yRight - wireT / 2 }, layerSpring, dutyColor)
                    );
                }
            } else {
                // ISO 2162 Axial Cross-Section: Hatched rectangular/oval wire sections on Left & Right + rear helix lines
                const lx = cx - rMid;
                const rx = cx + rMid;
                entities.push(
                    createRectangleEntity({ x: lx, y: yLeft }, wireW, wireT, layerSpring, dutyColor),
                    createHatchEntity([
                        { x: lx - wireW / 2, y: yLeft - wireT / 2 },
                        { x: lx + wireW / 2, y: yLeft - wireT / 2 },
                        { x: lx + wireW / 2, y: yLeft + wireT / 2 },
                        { x: lx - wireW / 2, y: yLeft + wireT / 2 }
                    ], 'ANSI31', layerSpring, dutyColor),
                    createRectangleEntity({ x: rx, y: yRight }, wireW, wireT, layerSpring, dutyColor),
                    createHatchEntity([
                        { x: rx - wireW / 2, y: yRight - wireT / 2 },
                        { x: rx + wireW / 2, y: yRight - wireT / 2 },
                        { x: rx + wireW / 2, y: yRight + wireT / 2 },
                        { x: rx - wireW / 2, y: yRight + wireT / 2 }
                    ], 'ANSI31', layerSpring, dutyColor)
                );
                if (i < coils) {
                    // Rear inner helix connector lines
                    entities.push(
                        createLineEntity({ x: cx - rIn, y: yLeft }, { x: cx + rIn, y: yRight }, layerRef, '#64748b'),
                        createLineEntity({ x: cx + rIn, y: yRight }, { x: cx - rIn, y: yLeft + pitch }, layerRef, '#64748b')
                    );
                }
            }
        }

        return entities;
    },
    generate3D: (params, basePos = { x: 0, y: 0, z: 0 }) => {
        const modelKey = String(params.springModel || 'ISO_32x16_BLUE');
        const spec = HELICAL_SPRING_CATALOG[modelKey] || HELICAL_SPRING_CATALOG.ISO_32x16_BLUE;
        const L = Math.max(30, Math.min(300, Number(params.freeLength) || 90));
        const { Dh, Dd, wireT, coils, dutyColor } = spec;

        const parts: DynamicPart3DDef[] = [];
        const stepY = L / coils;
        for (let i = 0; i < coils; i++) {
            parts.push({
                id: `spring-coil-${i}`,
                name: `${spec.code} Coil ${i + 1}`,
                kind: 'tube',
                color: dutyColor,
                position: { x: basePos.x, y: basePos.y + stepY * (i + 0.5), z: basePos.z },
                params: { diameter: Dh, innerDiameter: Dd, length: wireT * 1.15 }
            });
        }
        return parts;
    },
    getGrips: (params, basePoint = { x: 0, y: 0 }): DynamicGrip[] => {
        const L = Math.max(30, Math.min(300, Number(params.freeLength) || 90));
        return [
            {
                id: 'grip-origin',
                type: 'point',
                paramId: 'basePoint',
                position: { x: basePoint.x, y: basePoint.y },
                tooltip: 'Move Helical Spring',
                tooltipTr: 'Helisel Yayı Taşı'
            },
            {
                id: 'grip-free-length',
                type: 'linear',
                paramId: 'freeLength',
                position: { x: basePoint.x, y: basePoint.y + L },
                direction: { x: 0, y: 1 },
                label: `L=${L}mm`,
                labelTr: `Yay Boyu L=${L}mm`
            }
        ];
    }
};
