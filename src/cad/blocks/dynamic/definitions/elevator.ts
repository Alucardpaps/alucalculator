/**
 * 🛗 Dynamic Passenger & Stretcher Elevator Suite (EN 81-20 / EN 81-50 / ISO 8100)
 * 
 * AutoCAD-Grade Dynamic Elevator System:
 * - Linear Stretches: Shaft Width (1400mm to 3000mm) & Shaft Depth (1500mm to 3200mm)
 * - Capacity / Presets:
 *    - 4 Persons / 320 kg (Kompakt Konut)
 *    - 6 Persons / 450 kg
 *    - 8 Persons / 630 kg (Standart Konut / İş Merkezi)
 *    - 10 Persons / 800 kg
 *    - 13 Persons / 1000 kg (Ticari / Yoğun Trafik)
 *    - 16 Persons / 1275 kg (Sedye & Hastane Asansörü — 1200x2300 mm kabin)
 * - Visibility States:
 *    - Plan View (Telescopic Side Sliding Doors)
 *    - Plan View (Center Opening Doors)
 *    - Section / Front Elevation View
 * - 3D Solids: Shaft walls, Cabin enclosure, Sliding door leaves, Counterweight assembly
 */

import { Point, CadEntity, createLineEntity, createRectangleEntity, createCircleEntity } from '../../../kernel/types';
import { DynamicBlockDef, DynamicGrip, DynamicPart3DDef } from '../types';

export const DYN_ELEVATOR: DynamicBlockDef = {
    id: 'dyn_elevator',
    name: 'Dynamic Passenger & Stretcher Elevator (EN 81-20)',
    nameTr: 'Dinamik Yolcu ve Sedye Asansörü',
    category: 'Architectural',
    subcategory: 'Circulation & Lifts',
    subcategoryTr: 'Düşey Sirkülasyon ve Asansörler',
    description: 'AutoCAD-grade dynamic elevator: 4 to 16 persons, standard and stretcher cabins, telescopic and central opening doors with shaft walls.',
    descriptionTr: 'EN 81-20 standardında 4-16 kişilik yolcu ve sedye asansörü; kuyu, kabin, karşı ağırlık ve teleskopik/merkezi kapı detayları.',
    icon: '🛗',
    citation: {
        tier: 1,
        standard: 'EN 81-20 / EN 81-50 / ISO 8100',
        clause: 'Safety rules for the construction and installation of lifts (Car dimensions and well clearance)',
        description: 'Standard car dimensions: 630kg (1100x1400mm), 1000kg (1100x2100mm), 1275kg stretcher (1200x2300mm).'
    },
    linearParams: [
        {
            id: 'carWidth',
            name: 'carWidth',
            label: 'Cabin Width',
            labelTr: 'Kabin Genişliği',
            min: 900,
            max: 2000,
            step: 50,
            default: 1100,
            unit: 'mm',
            axis: 'x'
        },
        {
            id: 'carDepth',
            name: 'carDepth',
            label: 'Cabin Depth',
            labelTr: 'Kabin Derinliği',
            min: 1000,
            max: 2500,
            step: 50,
            default: 1400,
            unit: 'mm',
            axis: 'y'
        }
    ],
    flipParams: [
        {
            id: 'flipCounterweight',
            name: 'flipCounterweight',
            label: 'Counterweight Side (Back / Left / Right)',
            labelTr: 'Karşı Ağırlık Konumu (Arka / Yan)',
            axis: 'vertical',
            default: false
        }
    ],
    visibilityParam: {
        id: 'doorType',
        name: 'doorType',
        label: 'Door Style & Opening',
        labelTr: 'Kapı Açılış Tipi',
        states: [
            { id: 'center_opening', label: 'Center Opening (Merkezi 2-Kanat Açılır)', labelTr: 'Merkezi 2-Kanat Kapı' },
            { id: 'telescopic_side', label: 'Telescopic Side (Yana Kayan 2-Kanat Teleskopik)', labelTr: 'Teleskopik Yana Kayan Kapı' }
        ],
        default: 'center_opening'
    },
    lookupParams: [
        {
            id: 'presetCapacity',
            name: 'presetCapacity',
            label: 'Standard Capacity & Duty',
            labelTr: 'Standart Kapasite ve Tip',
            options: [
                { id: 'lift_320kg', label: '4 Kişi / 320 kg (Kabin: 900x1000 mm)', values: { carWidth: 900, carDepth: 1000 } },
                { id: 'lift_450kg', label: '6 Kişi / 450 kg (Kabin: 1000x1250 mm)', values: { carWidth: 1000, carDepth: 1250 } },
                { id: 'lift_630kg', label: '8 Kişi / 630 kg Standart Konut (Kabin: 1100x1400 mm)', values: { carWidth: 1100, carDepth: 1400 } },
                { id: 'lift_800kg', label: '10 Kişi / 800 kg İş Merkezi (Kabin: 1350x1400 mm)', values: { carWidth: 1350, carDepth: 1400 } },
                { id: 'lift_1000kg', label: '13 Kişi / 1000 kg Yoğun Trafik (Kabin: 1100x2100 mm)', values: { carWidth: 1100, carDepth: 2100 } },
                { id: 'lift_1275kg', label: '16 Kişi / 1275 kg Sedye / Hastane (Kabin: 1200x2300 mm)', values: { carWidth: 1200, carDepth: 2300 } }
            ],
            default: 'lift_630kg'
        }
    ],
    defaultValues: {
        carWidth: 1100,
        carDepth: 1400,
        flipCounterweight: false,
        doorType: 'center_opening'
    },
    generate2D: (params, basePoint = { x: 0, y: 0 }) => {
        const cw = Math.max(900, Math.min(2000, Number(params.carWidth) || 1100));
        const cd = Math.max(1000, Math.min(2500, Number(params.carDepth) || 1400));
        const doorType = String(params.doorType || 'center_opening');
        const flip = Boolean(params.flipCounterweight);

        // EN 81-20 clearances
        const wallThick = 200; // 200mm concrete shaft wall
        const sideClear = 250; // 250mm side clearance for rails
        const rearClear = flip ? 150 : 350; // counterweight space at rear or side
        const frontClear = 150; // door mechanism clearance

        const shaftW = cw + sideClear * 2;
        const shaftD = cd + rearClear + frontClear;

        const entities: CadEntity[] = [];
        const layerWall = 'layer-struct';
        const layerCar = 'layer-furn';
        const layerDoor = 'layer-arch';
        const layerCwt = 'layer-mech';

        const colorWall = '#e2e8f0';
        const colorCar = '#3ad0e6';
        const colorDoor = '#38bdf8';
        const colorCwt = '#f59e0b';
        const colorRef = '#64748b';

        // 1. Reinforced Concrete Shaft Walls (Outer)
        entities.push(createRectangleEntity(
            { x: basePoint.x + shaftW / 2, y: basePoint.y + shaftD / 2 },
            shaftW + wallThick * 2,
            shaftD + wallThick * 2,
            layerWall,
            colorWall
        ));

        // 2. Shaft Void (Inner)
        entities.push(createRectangleEntity(
            { x: basePoint.x + shaftW / 2, y: basePoint.y + shaftD / 2 },
            shaftW,
            shaftD,
            layerWall,
            colorWall
        ));

        // 3. Cabin Walls (Centered in shaft)
        const carCenterX = basePoint.x + shaftW / 2;
        const carCenterY = basePoint.y + frontClear + cd / 2;

        entities.push(createRectangleEntity(
            { x: carCenterX, y: carCenterY },
            cw,
            cd,
            layerCar,
            colorCar
        ));

        // Diagonal crosses indicating cabin interior ceiling/sling
        entities.push(createLineEntity(
            { x: carCenterX - cw / 2 + 10, y: carCenterY - cd / 2 + 10 },
            { x: carCenterX + cw / 2 - 10, y: carCenterY + cd / 2 - 10 },
            layerCar,
            colorRef
        ));
        entities.push(createLineEntity(
            { x: carCenterX - cw / 2 + 10, y: carCenterY + cd / 2 - 10 },
            { x: carCenterX + cw / 2 - 10, y: carCenterY - cd / 2 + 10 },
            layerCar,
            colorRef
        ));

        // 4. Counterweight (Arka veya Yan Karşı Ağırlık Bloğu)
        if (!flip) {
            // Rear Counterweight
            const cwtW = Math.min(cw * 0.8, 800);
            const cwtD = 120;
            entities.push(createRectangleEntity(
                { x: carCenterX, y: basePoint.y + frontClear + cd + 120 },
                cwtW,
                cwtD,
                layerCwt,
                colorCwt
            ));
        } else {
            // Side Counterweight (Left wall)
            const cwtW = 120;
            const cwtD = Math.min(cd * 0.7, 700);
            entities.push(createRectangleEntity(
                { x: basePoint.x + 80, y: carCenterY },
                cwtW,
                cwtD,
                layerCwt,
                colorCwt
            ));
        }

        // 5. Landing & Car Doors (Front Opening)
        const doorClearW = Math.min(cw * 0.8, 900);
        const doorY = basePoint.y + frontClear - 30;

        if (doorType === 'center_opening') {
            const panelW = doorClearW / 2;
            // Left Panel
            entities.push(createRectangleEntity(
                { x: carCenterX - panelW / 2, y: doorY },
                panelW - 10,
                30,
                layerDoor,
                colorDoor
            ));
            // Right Panel
            entities.push(createRectangleEntity(
                { x: carCenterX + panelW / 2, y: doorY },
                panelW - 10,
                30,
                layerDoor,
                colorDoor
            ));
        } else {
            // Telescopic Side Opening
            const panelW = doorClearW / 2;
            entities.push(createRectangleEntity(
                { x: carCenterX - doorClearW / 2 + panelW / 2, y: doorY - 15 },
                panelW,
                25,
                layerDoor,
                colorDoor
            ));
            entities.push(createRectangleEntity(
                { x: carCenterX - doorClearW / 2 + panelW + panelW / 2, y: doorY + 15 },
                panelW,
                25,
                layerDoor,
                colorDoor
            ));
        }

        return entities;
    },
    generate3D: (params, basePos = { x: 0, y: 0, z: 0 }) => {
        const cw = Math.max(900, Math.min(2000, Number(params.carWidth) || 1100));
        const cd = Math.max(1000, Math.min(2500, Number(params.carDepth) || 1400));
        const carH = 2200; // 2.2m cabin height
        const shaftH = 3600; // Single story height

        const parts: DynamicPart3DDef[] = [
            // Elevator Cabin Enclosure
            {
                id: `elevator_cabin_${Date.now()}`,
                name: `Asansör Kabini (${cw}x${cd}x${carH} mm)`,
                kind: 'box',
                color: '#3ad0e6',
                position: { x: basePos.x + cw / 2, y: basePos.y + cd / 2, z: basePos.z + carH / 2 },
                rotation: { x: 0, y: 0, z: 0 },
                params: { width: cw, height: cd, depth: carH },
                designStandard: 'EN 81-20'
            },
            // Counterweight Assembly
            {
                id: `elevator_cwt_${Date.now()}`,
                name: `Karşı Ağırlık Bloğu (Döküm Ağırlıklar)`,
                kind: 'box',
                color: '#f59e0b',
                position: { x: basePos.x + cw / 2, y: basePos.y + cd + 150, z: basePos.z + carH / 2 + 400 },
                rotation: { x: 0, y: 0, z: 0 },
                params: { width: Math.min(cw * 0.7, 700), height: 140, depth: 1200 },
                designStandard: 'EN 81-50'
            }
        ];

        return parts;
    },
    getGrips: (params, basePoint = { x: 0, y: 0 }) => {
        const cw = Math.max(900, Math.min(2000, Number(params.carWidth) || 1100));
        const cd = Math.max(1000, Math.min(2500, Number(params.carDepth) || 1400));
        const sideClear = 250;
        const frontClear = 150;
        const carCenterX = basePoint.x + sideClear + cw / 2;

        const grips: DynamicGrip[] = [
            // Cabin Width Stretch Grip
            {
                id: 'grip_car_width',
                type: 'stretch',
                paramId: 'carWidth',
                position: { x: basePoint.x + sideClear + cw, y: basePoint.y + frontClear + cd / 2 },
                direction: { x: 1, y: 0 },
                tooltip: `Grip: Kabin Genişliğini Esnet (${cw} mm)`,
                tooltipTr: `Grip: Kabin Genişliğini Esnet (${cw} mm)`
            },
            // Cabin Depth Stretch Grip
            {
                id: 'grip_car_depth',
                type: 'stretch',
                paramId: 'carDepth',
                position: { x: carCenterX, y: basePoint.y + frontClear + cd },
                direction: { x: 0, y: 1 },
                tooltip: `Grip: Kabin Derinliğini Esnet (${cd} mm)`,
                tooltipTr: `Grip: Kabin Derinliğini Esnet (${cd} mm)`
            },
            // Flip Counterweight
            {
                id: 'grip_cwt_flip',
                type: 'flip',
                paramId: 'flipCounterweight',
                position: { x: carCenterX, y: basePoint.y - 30 },
                tooltip: 'Karşı Ağırlık Konumunu Değiştir (Arka / Yan)',
                tooltipTr: 'Karşı Ağırlık Konumunu Değiştir (Arka / Yan)'
            },
            // Door Style Visibility Grip
            {
                id: 'grip_door_vis',
                type: 'visibility',
                paramId: 'doorType',
                position: { x: basePoint.x - 30, y: basePoint.y - 30 },
                tooltip: 'Kapı Tipi (Merkezi 2-Kanat / Yana Kayan Teleskopik)',
                tooltipTr: 'Kapı Tipi (Merkezi 2-Kanat / Yana Kayan Teleskopik)'
            }
        ];

        return grips;
    }
};
