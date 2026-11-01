/**
 * ⚡ Dynamic Aluminum T-Slot / Sigma Extrusion Block (DIN EN 12020 / EN 755)
 * 
 * Complies with AGENTS.md & GEMINI.md:
 * - 1:1 True industrial CAD precision (Wellste / Bosch Rexroth / Item compatibility)
 * - Series: 2020, 2040, 3030, 3060, 4040, 4080, 4545, 4590, 8080, 9090
 * - Dynamic linear stretch: Length (100mm to 6000mm)
 * - Projections: Cross Section (True T-Slots & Center Bores), Elevation (Slot grooves), Plan View
 * - 3D Parametric CAD Solid Extrusion
 */

import { Point, CadEntity, createLineEntity, createRectangleEntity, createPolylineEntity, createHatchEntity, createCircleEntity } from '../../../kernel/types';
import { DynamicBlockDef, DynamicGrip, DynamicPart3DDef } from '../types';
import { TSLOT_CATALOG, TSlotSpec, tSlotToCadEntities, buildTSlotSection } from '@/cad/catalog/tSlotProfiles';

export const DYN_TSLOT_PROFILE: DynamicBlockDef = {
    id: 'dyn_tslot_profile',
    name: 'Aluminum T-Slot / Sigma Profile (DIN EN 12020)',
    nameTr: 'Alüminyum T-Slot / Sigma Profil (Modüler Seri)',
    category: 'Structural',
    subcategory: 'Aluminum Extrusions',
    subcategoryTr: 'Alüminyum Profiller & T-Kanal',
    description: 'AutoCAD-grade dynamic aluminum extrusion: 2020 through 9090 modular T-Slot/Sigma profiles with exact slot shoulders, bores, and live deflection metrics.',
    descriptionTr: 'DIN EN 12020 normunda 2020-9090 modüler alüminyum sigma profiller; T-kanallı kesit, boyuna esnetme ve canlı sehim hesabı.',
    icon: '⚡',
    calculatorRoute: '/calculators/beam-deflection/',
    calculatorModuleType: 'beam-deflection',
    calculatorLabelTr: 'Kiriş Sehimi & Mukavemet Hesabına Git',
    citation: {
        tier: 1,
        standard: 'DIN EN 12020 / EN 755 / DIN EN 1999-1-1',
        clause: 'Extruded precision profiles in alloys EN AW-6060 and EN AW-6063',
        description: 'Standard modular T-slot dimensions, slot mouth ws, lip t1, center bore, and geometric section inertia.'
    },
    linearParams: [
        {
            id: 'length',
            name: 'length',
            label: 'Extrusion Length (L)',
            labelTr: 'Profil Boyu (L)',
            min: 50,
            max: 6000,
            step: 10,
            default: 1000,
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
            { id: 'cross_section', label: 'Cross Section (T-Kanal Detaylı Enkesit)', labelTr: 'Detaylı Enkesit (T-Kanal & Delik)' },
            { id: 'elevation', label: 'Elevation View (Boy Kesit & Kanal Çizgileri)', labelTr: 'Boyuna Yan Görünüş' },
            { id: 'plan', label: 'Plan View (Üst Görünüş)', labelTr: 'Üst Plan Görünüşü' }
        ],
        default: 'cross_section'
    },
    lookupParams: [
        {
            id: 'profileId',
            name: 'profileId',
            label: 'Standard T-Slot Series',
            labelTr: 'Standart Sigma Profil Serisi',
            options: TSLOT_CATALOG.map((s) => ({
                id: s.id,
                label: `${s.name} (${s.width}×${s.height} mm, ${s.massKgPerM.toFixed(2)} kg/m)`,
                standard: s.standard,
                values: { profileId: s.id }
            })),
            default: '4040'
        }
    ],
    defaultValues: {
        profileId: '4040',
        length: 1000,
        visState: 'cross_section'
    },
    generate2D: (params, basePoint = { x: 0, y: 0 }) => {
        const profileId = String(params.profileId || '4040');
        const spec = TSLOT_CATALOG.find(s => s.id === profileId) || TSLOT_CATALOG[2]; // default 4040
        const length = Number(params.length) || 1000;
        const state = String(params.visState || 'cross_section');

        const entities: CadEntity[] = [];
        const layerStruct = 'layer-struct';
        const colorAlu = '#38bdf8';
        const colorGroove = '#0284c7';
        const colorCenter = '#ef4444';

        if (state === 'cross_section') {
            const geom = buildTSlotSection(spec, basePoint);

            // 1. Single authentic continuous ANSI31 section hatch covering the solid metal walls
            // geom.outer = outer T-slot perimeter, geom.holes = center bore circle(s)
            // strokeBorder: false prevents drawing duplicate perimeter borders
            entities.push(createHatchEntity(
                geom.outer,
                'ANSI31',
                layerStruct,
                'rgba(56, 189, 248, 0.45)',
                undefined,
                geom.holes,
                false
            ));

            // 2. 1:1 true precision geometry from tSlotProfiles catalog (outer polyline & bore circles)
            const sectionEntities = tSlotToCadEntities(spec, basePoint, layerStruct, colorAlu);
            entities.push(...sectionEntities);

            // 3. Central core hub tube and diagonal reinforcement webs (DIN EN 12020 / Bosch Rexroth)
            const W = spec.width;
            const H = spec.height;
            const xMin = -W / 2;
            const yMin = -H / 2;
            const nx = spec.slotsX;
            const ny = spec.slotsY;
            const pitchX = W / nx;
            const pitchY = H / ny;
            const rBore = spec.bore / 2;
            const rHub = rBore + Math.max(1.4, spec.bore * 0.28);

            for (let i = 0; i < nx; i++) {
                for (let j = 0; j < ny; j++) {
                    const bx = basePoint.x + xMin + (i + 0.5) * pitchX;
                    const by = basePoint.y + yMin + (j + 0.5) * pitchY;

                    // Hub outer circle (concentric to bore)
                    entities.push(createCircleEntity({ x: bx, y: by }, rHub, layerStruct, colorGroove));

                    // 4 diagonal reinforcement webs connecting hub to corner pockets
                    const cellHalfX = pitchX / 2;
                    const cellHalfY = pitchY / 2;
                    const hd = Math.min(spec.headDepth, Math.min(cellHalfX, cellHalfY) - 1.2);

                    const cornerCoords = [
                        { dx: cellHalfX - hd, dy: cellHalfY - hd },
                        { dx: -(cellHalfX - hd), dy: cellHalfY - hd },
                        { dx: -(cellHalfX - hd), dy: -(cellHalfY - hd) },
                        { dx: cellHalfX - hd, dy: -(cellHalfY - hd) }
                    ];

                    for (const c of cornerCoords) {
                        const len = Math.hypot(c.dx, c.dy);
                        if (len > rHub) {
                            const startX = bx + (c.dx / len) * rHub;
                            const startY = by + (c.dy / len) * rHub;
                            const endX = bx + c.dx;
                            const endY = by + c.dy;
                            entities.push(createLineEntity(
                                { x: startX, y: startY },
                                { x: endX, y: endY },
                                layerStruct,
                                colorGroove
                            ));
                        }
                    }
                }
            }

            // Add centerlines
            const halfW = spec.width / 2;
            const halfH = spec.height / 2;
            const ext = Math.max(4, Math.min(halfW, halfH) * 0.25);
            entities.push(createLineEntity(
                { x: basePoint.x - halfW - ext, y: basePoint.y },
                { x: basePoint.x + halfW + ext, y: basePoint.y },
                layerStruct,
                colorCenter
            ));
            entities.push(createLineEntity(
                { x: basePoint.x, y: basePoint.y - halfH - ext },
                { x: basePoint.x, y: basePoint.y + halfH + ext },
                layerStruct,
                colorCenter
            ));
        } else {
            // Elevation / Plan Views
            const dimH = state === 'plan' ? spec.width : spec.height;
            const halfH = dimH / 2;
            const x1 = basePoint.x;
            const x2 = basePoint.x + length;
            const y1 = basePoint.y - halfH;

            // Outer boundary
            entities.push(createRectangleEntity(
                { x: basePoint.x + length / 2, y: basePoint.y },
                length,
                dimH,
                layerStruct,
                colorAlu
            ));

            // Longitudinal T-Slot groove representation lines
            const slotMouth = spec.slot;
            const numSlots = state === 'plan' ? spec.slotsX : spec.slotsY;
            const pitch = dimH / numSlots;

            for (let i = 0; i < numSlots; i++) {
                const yc = y1 + (i + 0.5) * pitch;
                // Centerline of groove
                entities.push(createLineEntity(
                    { x: x1, y: yc },
                    { x: x2, y: yc },
                    layerStruct,
                    colorCenter
                ));
                // Groove lip margins
                entities.push(createLineEntity(
                    { x: x1, y: yc - slotMouth / 2 },
                    { x: x2, y: yc - slotMouth / 2 },
                    layerStruct,
                    colorGroove
                ));
                entities.push(createLineEntity(
                    { x: x1, y: yc + slotMouth / 2 },
                    { x: x2, y: yc + slotMouth / 2 },
                    layerStruct,
                    colorGroove
                ));
            }
        }

        return entities;
    },
    generate3D: (params, basePos = { x: 0, y: 0, z: 0 }) => {
        const profileId = String(params.profileId || '4040');
        const spec = TSLOT_CATALOG.find(s => s.id === profileId) || TSLOT_CATALOG[2];
        const length = Number(params.length) || 1000;

        const parts: DynamicPart3DDef[] = [
            {
                name: `T-Slot Extrusion ${spec.name} L=${length}mm`,
                kind: 't-slot',
                color: '#94a3b8',
                position: basePos,
                dimensions: {
                    width: spec.width,
                    height: spec.height,
                    length,
                    series: spec.series,
                    boreDia: spec.bore,
                    slotWidth: spec.slot
                },
                designStandard: spec.standard,
                materialType: spec.alloy
            }
        ];
        return parts;
    },
    getGrips: (params, basePoint = { x: 0, y: 0 }) => {
        const profileId = String(params.profileId || '4040');
        const spec = TSLOT_CATALOG.find(s => s.id === profileId) || TSLOT_CATALOG[2];
        const length = Number(params.length) || 1000;
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
                paramId: 'profileId',
                position: { x: basePoint.x + 20, y: basePoint.y + 20 },
                label: `Profile: ${spec.name}`,
                labelTr: `Profil: ${spec.name}`
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
                tooltip: 'Drag to stretch profile length',
                tooltipTr: 'Profil boyunu uzatmak için sürükleyin'
            });
        }

        return grips;
    }
};
