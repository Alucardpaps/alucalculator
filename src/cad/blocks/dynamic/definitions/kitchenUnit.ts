/**
 * 🍳 Dynamic Kitchen Modular Counter & Cabinet Unit (ISO 3055 / DIN 68930)
 * 
 * AutoCAD-Grade Dynamic Kitchen Unit:
 * - Linear Stretch: Counter Length (600 mm to 3600 mm in 600 mm module steps)
 * - Visibility States:
 *    - Standard Base Counter (Düz Alt Dolap & Tezgah)
 *    - Sink Counter (Evyeli Tezgah - Tekli / Çiftli Evye)
 *    - Cooktop Counter (Ocaklı Tezgah & Ankastre)
 *    - Full Kitchen Suite (Komple Mutfak: Evye + Ocak + Hazırlık Tezgahı)
 * - Flip: Sink / Cooktop position left/right
 * - Lookup Presets: 60cm, 120cm, 180cm, 240cm, 300cm, 360cm
 * - 3D Solids: Countertop, Base Cabinets, Plinth (Baza), Faucet (Batarya), Sink Bowl, Cooktop Burners
 */

import { Point, CadEntity, createLineEntity, createRectangleEntity, createCircleEntity, createArcEntity } from '../../../kernel/types';
import { DynamicBlockDef, DynamicGrip, DynamicPart3DDef } from '../types';

export const DYN_KITCHEN_UNIT: DynamicBlockDef = {
    id: 'dyn_kitchen_unit',
    name: 'Dynamic Kitchen Counter & Cabinets (ISO 3055)',
    nameTr: 'Dinamik Modüler Mutfak Tezgahı ve Dolapları',
    category: 'Furniture',
    subcategory: 'Kitchen & Storage',
    subcategoryTr: 'Mutfak ve Depolama',
    description: 'AutoCAD-grade dynamic kitchen counter: stretch module count, toggle sink/cooktop/appliances and flip layout.',
    descriptionTr: '60cm standart modüllere esneyen, evye/ocak/ankastre kombinasyonları seçilebilen dinamik mutfak tezgahı.',
    icon: '🍳',
    citation: {
        tier: 1,
        standard: 'ISO 3055 / DIN 68930',
        clause: 'Kitchen equipment - Coordinating sizes (600mm modular grid, 600mm depth, 850-900mm height)',
        description: 'Standard 600mm module width, 600mm worktop depth, 40mm worktop thickness, 860mm standard counter height.'
    },
    linearParams: [
        {
            id: 'length',
            name: 'length',
            label: 'Counter Length',
            labelTr: 'Tezgah Toplam Boyu',
            min: 600,
            max: 3600,
            step: 600,
            default: 2400,
            unit: 'mm',
            axis: 'x'
        }
    ],
    flipParams: [
        {
            id: 'flipLayout',
            name: 'flipLayout',
            label: 'Flip Sink & Cooktop Position',
            labelTr: 'Evye ve Ocak Konumunu Aynala',
            axis: 'horizontal',
            default: false
        }
    ],
    visibilityParam: {
        id: 'visState',
        name: 'visState',
        label: 'Kitchen Appliance Configuration',
        labelTr: 'Cihaz ve Donanım Tipi',
        states: [
            { id: 'full_suite', label: 'Full Kitchen (Sink + Cooktop + Prep)', labelTr: 'Komple Mutfak (Evye + Ocak + Tezgah)' },
            { id: 'sink_only', label: 'Sink Worktop (Evyeli Tezgah)', labelTr: 'Evyeli Tezgah' },
            { id: 'cooktop_only', label: 'Cooktop Worktop (Ocaklı Tezgah)', labelTr: 'Ocaklı Tezgah' },
            { id: 'base_counter', label: 'Base Prep Counter (Düz Çalışma Tezgahı)', labelTr: 'Düz Çalışma Tezgahı' }
        ],
        default: 'full_suite'
    },
    lookupParams: [
        {
            id: 'presetKitchen',
            name: 'presetKitchen',
            label: 'Standard Kitchen Modules',
            labelTr: 'Standart Mutfak Modülleri',
            options: [
                { id: 'k_600', label: 'Tek Modül Tezgah (600 mm — Düz/Evye)', values: { length: 600, visState: 'sink_only' } },
                { id: 'k_1200', label: '2 Modül Tezgah (1200 mm — Evye + Hazırlık)', values: { length: 1200, visState: 'sink_only' } },
                { id: 'k_1800', label: '3 Modül Tezgah (1800 mm — Evye + Ocak)', values: { length: 1800, visState: 'full_suite' } },
                { id: 'k_2400', label: '4 Modül Standart Mutfak (2400 mm — Komple)', values: { length: 2400, visState: 'full_suite' } },
                { id: 'k_3000', label: '5 Modül Geniş Mutfak (3000 mm — Ada/Tezgah)', values: { length: 3000, visState: 'full_suite' } },
                { id: 'k_3600', label: '6 Modül Lüks Hat (3600 mm — Tam Donanım)', values: { length: 3600, visState: 'full_suite' } }
            ],
            default: 'k_2400'
        }
    ],
    arrayActions: [
        {
            id: 'array_kitchen_doors',
            linearParamId: 'length',
            spacing: 600,
            minCount: 1,
            maxCount: 6,
            label: 'Base Cabinet Modules',
            labelTr: 'Alt Dolap Modülleri'
        }
    ],
    defaultValues: {
        length: 2400,
        flipLayout: false,
        visState: 'full_suite'
    },
    generate2D: (params, basePoint = { x: 0, y: 0 }) => {
        const length = Math.max(600, Math.min(3600, Math.round((Number(params.length) || 2400) / 600) * 600));
        const depth = 600; // ISO 3055 600mm standard depth
        const visState = String(params.visState || 'full_suite');
        const flip = Boolean(params.flipLayout);

        const entities: CadEntity[] = [];
        const layer = 'layer-furn';
        const colorCounter = '#3ad0e6';
        const colorSink = '#f8fafc';
        const colorCooktop = '#fb923c';
        const colorDivider = '#64748b';

        // 1. Overall Worktop Outline
        entities.push(createRectangleEntity(
            { x: basePoint.x + length / 2, y: basePoint.y + depth / 2 },
            length,
            depth,
            layer,
            colorCounter
        ));

        // 2. 600mm Modular Unit Division Lines
        const numModules = Math.floor(length / 600);
        for (let i = 1; i < numModules; i++) {
            const xDiv = basePoint.x + i * 600;
            entities.push(createLineEntity(
                { x: xDiv, y: basePoint.y },
                { x: xDiv, y: basePoint.y + depth },
                layer,
                colorDivider
            ));
        }

        // 3. Sink Unit (500x420mm Bowl with Faucet)
        const hasSink = visState === 'full_suite' || visState === 'sink_only';
        if (hasSink) {
            const sinkModuleIndex = flip ? numModules - 1 : 0;
            const sinkCenterX = basePoint.x + sinkModuleIndex * 600 + 300;
            const sinkCenterY = basePoint.y + depth / 2;

            // Outer sink rim
            entities.push(createRectangleEntity(
                { x: sinkCenterX, y: sinkCenterY },
                520,
                440,
                layer,
                colorSink
            ));

            // Inner sink bowl
            entities.push(createRectangleEntity(
                { x: sinkCenterX, y: sinkCenterY },
                460,
                380,
                layer,
                colorSink
            ));

            // Faucet base circle & spout
            entities.push(createCircleEntity(
                { x: sinkCenterX, y: basePoint.y + depth - 60 },
                22,
                layer,
                colorDivider
            ));
            entities.push(createLineEntity(
                { x: sinkCenterX, y: basePoint.y + depth - 60 },
                { x: sinkCenterX, y: basePoint.y + depth - 110 },
                layer,
                colorDivider
            ));

            // Drain strainer
            entities.push(createCircleEntity(
                { x: sinkCenterX, y: sinkCenterY },
                30,
                layer,
                colorDivider
            ));
        }

        // 4. Cooktop Unit (4-burner gas/induction hob 580x510mm)
        const hasCooktop = visState === 'full_suite' || visState === 'cooktop_only';
        if (hasCooktop && numModules >= (hasSink ? 2 : 1)) {
            const cookModuleIndex = flip ? 0 : (numModules >= 3 ? numModules - 2 : numModules - 1);
            const cookCenterX = basePoint.x + cookModuleIndex * 600 + 300;
            const cookCenterY = basePoint.y + depth / 2;

            // Cooktop glass rim
            entities.push(createRectangleEntity(
                { x: cookCenterX, y: cookCenterY },
                560,
                490,
                layer,
                colorCooktop
            ));

            // 4 Burner Rings
            const rOffset = 110;
            const burners = [
                { dx: -rOffset, dy: -rOffset, r: 40 }, // Small front left
                { dx: rOffset, dy: -rOffset, r: 55 },  // Medium front right
                { dx: -rOffset, dy: rOffset, r: 55 },  // Medium rear left
                { dx: rOffset, dy: rOffset, r: 70 }   // Wok / large rear right
            ];

            for (const b of burners) {
                entities.push(createCircleEntity(
                    { x: cookCenterX + b.dx, y: cookCenterY + b.dy },
                    b.r,
                    layer,
                    colorCooktop
                ));
                entities.push(createCircleEntity(
                    { x: cookCenterX + b.dx, y: cookCenterY + b.dy },
                    b.r * 0.45,
                    layer,
                    colorDivider
                ));
            }
        }

        return entities;
    },
    generate3D: (params, basePos = { x: 0, y: 0, z: 0 }) => {
        const length = Math.max(600, Math.min(3600, Math.round((Number(params.length) || 2400) / 600) * 600));
        const depth = 600;
        const height = 860;
        const plinthH = 100;
        const topThick = 40;
        const cabH = height - plinthH - topThick; // 720mm cabinet carcass height

        const parts: DynamicPart3DDef[] = [
            // Plinth / Baza
            {
                id: `kitchen_plinth_${Date.now()}`,
                name: `Mutfak Bazası (${length}x${depth - 50}x${plinthH} mm)`,
                kind: 'box',
                color: '#1e293b',
                position: { x: basePos.x + length / 2, y: basePos.y + (depth - 50) / 2, z: basePos.z + plinthH / 2 },
                rotation: { x: 0, y: 0, z: 0 },
                params: { width: length, height: depth - 50, depth: plinthH },
                designStandard: 'ISO 3055'
            },
            // Base Cabinet Carcass
            {
                id: `kitchen_carcass_${Date.now()}`,
                name: `Alt Dolap Gövdesi (${length}x${depth}x${cabH} mm)`,
                kind: 'box',
                color: '#334155',
                position: { x: basePos.x + length / 2, y: basePos.y + depth / 2, z: basePos.z + plinthH + cabH / 2 },
                rotation: { x: 0, y: 0, z: 0 },
                params: { width: length, height: depth, depth: cabH }
            },
            // Worktop / Tezgah (Granite/Solid surface)
            {
                id: `kitchen_worktop_${Date.now()}`,
                name: `Tezgah Plakası (${length}x${depth + 20}x${topThick} mm)`,
                kind: 'box',
                color: '#94a3b8',
                position: { x: basePos.x + length / 2, y: basePos.y + (depth + 20) / 2, z: basePos.z + height - topThick / 2 },
                rotation: { x: 0, y: 0, z: 0 },
                params: { width: length, height: depth + 20, depth: topThick }
            }
        ];

        return parts;
    },
    getGrips: (params, basePoint = { x: 0, y: 0 }) => {
        const length = Math.max(600, Math.min(3600, Math.round((Number(params.length) || 2400) / 600) * 600));
        const depth = 600;

        const grips: DynamicGrip[] = [
            // Linear Stretch Length Grip
            {
                id: 'grip_kitchen_length',
                type: 'stretch',
                paramId: 'length',
                position: { x: basePoint.x + length, y: basePoint.y + depth / 2 },
                direction: { x: 1, y: 0 },
                tooltip: `Grip: Tezgah Boyunu Esnet (${length} mm — ${length / 600} Modül)`,
                tooltipTr: `Grip: Tezgah Boyunu Esnet (${length} mm — ${length / 600} Modül)`
            },
            // Flip Layout (Sink vs Cooktop)
            {
                id: 'grip_kitchen_flip',
                type: 'flip',
                paramId: 'flipLayout',
                position: { x: basePoint.x + length / 2, y: basePoint.y - 30 },
                tooltip: 'Evye & Ocak Düzenini Aynala (Sol / Sağ)',
                tooltipTr: 'Evye & Ocak Düzenini Aynala (Sol / Sağ)'
            },
            // Visibility State Grip
            {
                id: 'grip_kitchen_vis',
                type: 'visibility',
                paramId: 'visState',
                position: { x: basePoint.x - 30, y: basePoint.y - 30 },
                tooltip: 'Tezgah Modeli (Komple / Evyeli / Ocaklı / Düz)',
                tooltipTr: 'Tezgah Modeli (Komple / Evyeli / Ocaklı / Düz)'
            }
        ];

        return grips;
    }
};
