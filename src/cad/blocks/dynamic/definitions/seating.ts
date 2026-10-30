/**
 * 🛋️ Dynamic Living Room Sofa & Seating (DWGShare Interior Architecture Collection)
 * 
 * - Linear stretch: Seat Count (1 to 5 seats) & Chaise Lounger (L-Koltuk / Köşe Koltuk)
 * - Flip parameter: Chaise orientation (Left / Right)
 * - Visibility: Plan View, Front Elevation
 * - Standard Presets: Armchair (Berjer), 2-Seater, 3-Seater, L-Shape Sectional
 */

import { Point, CadEntity, createLineEntity, createRectangleEntity, createArcEntity } from '../../../kernel/types';
import { DynamicBlockDef, DynamicGrip, DynamicPart3DDef } from '../types';

export const DYN_SEATING: DynamicBlockDef = {
    id: 'dyn_seating',
    name: 'Dynamic Sofa & Sectional (Koltuk Takımı)',
    nameTr: 'Dinamik Modüler Koltuk ve L-Kanepe',
    category: 'Furniture',
    subcategory: 'Living Room',
    subcategoryTr: 'Oturma Odası',
    description: 'AutoCAD-grade dynamic sofa: stretches number of seats, toggles and flips L-shape chaise lounge.',
    descriptionTr: 'Oturum sayısı esnetilebilir, L-köşe uzantısı açılıp yönü aynalanabilir dinamik koltuk takımı.',
    icon: '🛋️',
    citation: {
        tier: 2,
        standard: 'ISO 7173 / EN 12520',
        clause: 'Clauses 4.1-4.3 (Furniture - Chairs and seating - Determination of strength and durability)',
        description: 'Standard 600-700mm seat module width, 550mm seating depth, 850-950mm total depth.'
    },
    linearParams: [
        {
            id: 'seats',
            name: 'seats',
            label: 'Seat Count',
            labelTr: 'Koltuk Oturum Sayısı',
            min: 1,
            max: 5,
            step: 1,
            default: 3,
            unit: 'adet',
            axis: 'x'
        }
    ],
    flipParams: [
        {
            id: 'flipChaise',
            name: 'flipChaise',
            label: 'Chaise Side (Left / Right)',
            labelTr: 'L-Köşe Yönü (Sol / Sağ)',
            axis: 'horizontal',
            default: false
        }
    ],
    visibilityParam: {
        id: 'visState',
        name: 'visState',
        label: 'Chaise & Model Configuration',
        labelTr: 'Köşe ve Model Tipi',
        states: [
            { id: 'linear_sofa', label: 'Linear Sofa (Düz Kanepe)', labelTr: 'Düz Kanepe' },
            { id: 'l_sectional', label: 'L-Shape Sectional (L-Köşe Koltuk)', labelTr: 'L-Köşe Koltuk' }
        ],
        default: 'linear_sofa'
    },
    lookupParams: [
        {
            id: 'presetSofa',
            name: 'presetSofa',
            label: 'Standard Sofa Type',
            labelTr: 'Standart Model Tipi',
            options: [
                { id: 'sofa_1', label: 'Tekli Berjer (1 Kişilik — 900 mm)', values: { seats: 1, visState: 'linear_sofa' } },
                { id: 'sofa_2', label: 'İkili Koltuk (2 Kişilik — 1550 mm)', values: { seats: 2, visState: 'linear_sofa' } },
                { id: 'sofa_3', label: 'Üçlü Koltuk (3 Kişilik — 2200 mm)', values: { seats: 3, visState: 'linear_sofa' } },
                { id: 'sofa_4', label: 'Dörtlü Geniş Kanepe (4 Kişilik — 2850 mm)', values: { seats: 4, visState: 'linear_sofa' } },
                { id: 'sofa_l_left', label: 'L-Köşe Koltuk (Sol Dinlenme)', values: { seats: 3, visState: 'l_sectional', flipChaise: false } },
                { id: 'sofa_l_right', label: 'L-Köşe Koltuk (Sağ Dinlenme)', values: { seats: 3, visState: 'l_sectional', flipChaise: true } }
            ],
            default: 'sofa_3'
        }
    ],
    arrayActions: [
        {
            id: 'array_seat_cushions',
            linearParamId: 'seats',
            spacing: 650,
            minCount: 1,
            maxCount: 5,
            label: 'Cushion Array',
            labelTr: 'Minder Dizilimi'
        }
    ],
    defaultValues: {
        seats: 3,
        flipChaise: false,
        visState: 'linear_sofa'
    },
    generate2D: (params, basePoint = { x: 0, y: 0 }) => {
        const seats = Math.max(1, Math.min(5, Number(params.seats) || 3));
        const isL = params.visState === 'l_sectional';
        const flipRight = Boolean(params.flipChaise);

        const entities: CadEntity[] = [];
        const layer = 'layer-furn';
        const colorMain = '#3ad0e6';
        const colorCushion = '#f8fafc';
        const colorAccent = '#64748b';

        const armW = 150;      // 150mm armrest width
        const seatW = 650;     // 650mm per seat cushion
        const totalW = armW * 2 + seats * seatW;
        const sofaD = 900;     // 900mm depth
        const backD = 200;     // 200mm backrest cushion depth
        const chaiseExtraD = 750; // extra chaise extension depth (total 1650mm)

        // 1. Main Base Outline
        entities.push(createRectangleEntity(
            { x: basePoint.x + totalW / 2, y: basePoint.y + sofaD / 2 },
            totalW,
            sofaD,
            layer,
            colorMain
        ));

        // 2. Backrest (along the top edge)
        entities.push(createRectangleEntity(
            { x: basePoint.x + totalW / 2, y: basePoint.y + sofaD - backD / 2 },
            totalW - armW * 2,
            backD,
            layer,
            colorAccent
        ));

        // 3. Left Armrest
        entities.push(createRectangleEntity(
            { x: basePoint.x + armW / 2, y: basePoint.y + sofaD / 2 },
            armW,
            sofaD,
            layer,
            colorAccent
        ));

        // 4. Right Armrest
        entities.push(createRectangleEntity(
            { x: basePoint.x + totalW - armW / 2, y: basePoint.y + sofaD / 2 },
            armW,
            sofaD,
            layer,
            colorAccent
        ));

        // 5. Dynamic Seat Cushions Array
        for (let i = 0; i < seats; i++) {
            const isChaiseSeat = isL && ((flipRight && i === seats - 1) || (!flipRight && i === 0));
            const cx = basePoint.x + armW + i * seatW + seatW / 2;

            if (isChaiseSeat) {
                // Extended Chaise Cushion
                entities.push(createRectangleEntity(
                    { x: cx, y: basePoint.y - chaiseExtraD / 2 + (sofaD - backD) / 2 },
                    seatW - 10,
                    sofaD - backD + chaiseExtraD - 10,
                    layer,
                    colorCushion
                ));
            } else {
                // Standard Seat Cushion
                entities.push(createRectangleEntity(
                    { x: cx, y: basePoint.y + (sofaD - backD) / 2 },
                    seatW - 10,
                    sofaD - backD - 10,
                    layer,
                    colorCushion
                ));
            }
        }

        return entities;
    },
    generate3D: (params, basePos = { x: 0, y: 0, z: 0 }) => {
        const seats = Math.max(1, Math.min(5, Number(params.seats) || 3));
        const armW = 150;
        const seatW = 650;
        const totalW = armW * 2 + seats * seatW;
        const sofaD = 900;
        const sofaH = 800;

        const parts: DynamicPart3DDef[] = [
            // Base frame
            {
                id: `sofa_base_${Date.now()}`,
                name: `Kanepe İskeleti (${totalW} mm)`,
                kind: 'box',
                color: '#1e293b',
                position: { x: basePos.x + totalW / 2, y: basePos.y + sofaD / 2, z: basePos.z + 200 },
                rotation: { x: 0, y: 0, z: 0 },
                params: { width: totalW, height: sofaD, depth: 400 },
                designStandard: 'ISO 7173'
            },
            // Backrest
            {
                id: `sofa_back_${Date.now()}`,
                name: 'Kanepe Sırtlığı',
                kind: 'box',
                color: '#334155',
                position: { x: basePos.x + totalW / 2, y: basePos.y + sofaD - 100, z: basePos.z + sofaH / 2 },
                rotation: { x: 0, y: 0, z: 0 },
                params: { width: totalW - armW * 2, height: 200, depth: sofaH }
            },
            // Left Arm
            {
                id: `sofa_arm_l_${Date.now()}`,
                name: 'Sol Kolçak',
                kind: 'box',
                color: '#334155',
                position: { x: basePos.x + armW / 2, y: basePos.y + sofaD / 2, z: basePos.z + 300 },
                rotation: { x: 0, y: 0, z: 0 },
                params: { width: armW, height: sofaD, depth: 600 }
            },
            // Right Arm
            {
                id: `sofa_arm_r_${Date.now()}`,
                name: 'Sağ Kolçak',
                kind: 'box',
                color: '#334155',
                position: { x: basePos.x + totalW - armW / 2, y: basePos.y + sofaD / 2, z: basePos.z + 300 },
                rotation: { x: 0, y: 0, z: 0 },
                params: { width: armW, height: sofaD, depth: 600 }
            }
        ];

        return parts;
    },
    getGrips: (params, basePoint = { x: 0, y: 0 }) => {
        const seats = Math.max(1, Math.min(5, Number(params.seats) || 3));
        const armW = 150;
        const seatW = 650;
        const totalW = armW * 2 + seats * seatW;

        const grips: DynamicGrip[] = [
            // Linear Stretch Seats Grip
            {
                id: 'grip_sofa_seats',
                type: 'stretch',
                paramId: 'seats',
                position: { x: basePoint.x + totalW, y: basePoint.y + 450 },
                direction: { x: 1, y: 0 },
                tooltip: `Grip: Koltuk Oturum Sayısı (${seats} Kişilik — ${totalW} mm)`,
                tooltipTr: `Grip: Koltuk Oturum Sayısı (${seats} Kişilik — ${totalW} mm)`
            },
            // Flip Chaise Direction
            {
                id: 'grip_sofa_flip',
                type: 'flip',
                paramId: 'flipChaise',
                position: { x: basePoint.x + totalW / 2, y: basePoint.y - 30 },
                tooltip: 'L-Köşe Yönünü Aynala (Sol / Sağ)',
                tooltipTr: 'L-Köşe Yönünü Aynala (Sol / Sağ)'
            },
            // Visibility State
            {
                id: 'grip_sofa_vis',
                type: 'visibility',
                paramId: 'visState',
                position: { x: basePoint.x - 30, y: basePoint.y - 30 },
                tooltip: 'Model Tipi (Düz Kanepe / L-Köşe)',
                tooltipTr: 'Model Tipi (Düz Kanepe / L-Köşe)'
            }
        ];

        return grips;
    }
};
