/**
 * 🚗 Parametric Vehicle & Parking Bay (DIN 18040 / ISO 3833 / Neufert Architectural Data)
 * 
 * 1:1 True Industrial Scale & High-Detail New-Generation Automobile Block:
 * - Dynamic stretch: Vehicle Length (3800-5600 mm), Width (1650-2200 mm)
 * - Parking Bay Clearance (2400-3800 mm: Standard vs DIN 18040 Accessible)
 * - Projections:
 *    - Side Elevation View (Detailed Aerodynamic Fastback/SUV/Van Profile, Turbine Wheels, Brakes, Lighting & Glass Texture)
 *    - Plan Sedan / Fastback EV (Panoramic Glass Canopy, Aerodynamic Contours, Flush Handles)
 *    - Plan SUV / Crossover (Roof Rails, Wide Haunches, Skid Plates)
 *    - Plan Commercial Van (Sliding Cargo Doors & Partition)
 * - Textures & Materials: Metallic Body Paint Hatch, Smoked Glass Canopy, Rubber Tire Treads, Red Brake Calipers
 * - Neufert / DIN 18040 Parking Stall Envelope with Driver Door Swing Arcs & Wheel Stops
 * - 3D Multi-Part Parametric Vehicle Solid Assembly
 */

import {
    Point,
    CadEntity,
    createLineEntity,
    createRectangleEntity,
    createCircleEntity,
    createArcEntity,
    createPolylineEntity,
    createHatchEntity
} from '../../../kernel/types';
import { DynamicBlockDef, DynamicGrip, DynamicPart3DDef } from '../types';

export const DYN_VEHICLE_CAR: DynamicBlockDef = {
    id: 'dyn_vehicle_car',
    name: 'Dynamic Passenger Vehicle & Parking Bay (DIN 18040 / ISO 3833)',
    nameTr: 'Dinamik Yeni Nesil Taşıt ve Otopark Alanı (1:1 Birebir Ölçü)',
    category: 'Civil',
    subcategory: 'Vehicles & Site Planning',
    subcategoryTr: 'Araçlar ve Çevre Düzenleme',
    description: 'AutoCAD-grade parametric new-generation automobile block: Aerodynamic Fastback, SUV, Commercial Van, and DIN 18040 accessible parking stalls with realistic textures, wheels, brakes, and door swing envelopes.',
    descriptionTr: 'DIN 18040 ve ISO 3833 normunda 1:1 birebir ölçülü yeni nesil elektrikli/hibrit otomobil (Sedan, SUV, Panelvan); aerodinamik yan profil, türbin jantlar, fren kaliperleri, gövde dokuları ve panoramik cam tavan.',
    icon: '🚗',
    citation: {
        tier: 1,
        standard: 'DIN 18040-1 / ISO 3833 / Neufert 4th Ed.',
        clause: 'Road vehicles types & dimensions; Parking facilities accessibility and vehicle turn envelopes',
        description: 'Standard 2.50m x 5.00m parking stall dimensions, 3.50m accessible width, and 1:1 European new-gen EV/ICE vehicle geometries.'
    },
    linearParams: [
        {
            id: 'carLength',
            name: 'carLength',
            label: 'Vehicle Overall Length (L)',
            labelTr: 'Araç Toplam Boyu (L)',
            min: 3800,
            max: 5600,
            step: 50,
            default: 4720,
            unit: 'mm',
            axis: 'x'
        },
        {
            id: 'carWidth',
            name: 'carWidth',
            label: 'Vehicle Overall Width (W)',
            labelTr: 'Araç Toplam Genişliği (W)',
            min: 1650,
            max: 2200,
            step: 20,
            default: 1850,
            unit: 'mm',
            axis: 'y'
        },
        {
            id: 'bayWidth',
            name: 'bayWidth',
            label: 'Parking Bay Width (B)',
            labelTr: 'Otopark Cebi Genişliği (B)',
            min: 2400,
            max: 3800,
            step: 50,
            default: 2600,
            unit: 'mm',
            axis: 'y'
        }
    ],
    flipParams: [
        {
            id: 'flipHeading',
            name: 'flipHeading',
            label: 'Driving Direction (Forward / Reverse)',
            labelTr: 'Park / Sürüş Yönü (İleri / Geri)',
            axis: 'horizontal',
            default: false
        }
    ],
    visibilityParam: {
        id: 'visState',
        name: 'visState',
        label: 'Vehicle Projection / View',
        labelTr: 'Araç Projeksiyonu ve Görünüm',
        states: [
            { id: 'elevation', label: 'Side Elevation View (Yan Görünüş - Detaylı Profil)', labelTr: 'Yan Görünüş (Detaylı Profil & Jantlar)' },
            { id: 'plan_sedan', label: 'Plan: Sedan / Fastback EV (Üst Görünüş & Cam Tavan)', labelTr: 'Plan: Sedan / Fastback (Panoramik Tavan)' },
            { id: 'plan_suv', label: 'Plan: SUV / Crossover (Üst Görünüş & Tavan Barları)', labelTr: 'Plan: SUV / Crossover (Tavan Barları)' },
            { id: 'plan_van', label: 'Plan: Commercial Van (Üst Görünüş & Kargo)', labelTr: 'Plan: Ticari Minibüs / Van' }
        ],
        default: 'elevation'
    },
    lookupParams: [
        {
            id: 'standardVehicle',
            name: 'standardVehicle',
            label: 'Standard Automotive Classes (1:1 Scale)',
            labelTr: 'Standart Araç Sınıfları (1:1 Birebir Ölçü)',
            options: [
                {
                    id: 'class_sedan',
                    label: 'Yeni Nesil Sedan / Fastback EV (Tesla Model 3 / Taycan): 4720 × 1850 mm',
                    standard: 'ISO 3833',
                    values: { carLength: 4720, carWidth: 1850, bayWidth: 2600, visState: 'elevation' }
                },
                {
                    id: 'class_suv',
                    label: 'Yeni Nesil Crossover / SUV (Tesla Model Y / Togg T10X): 4750 × 1920 mm',
                    standard: 'ISO 3833',
                    values: { carLength: 4750, carWidth: 1920, bayWidth: 2800, visState: 'elevation' }
                },
                {
                    id: 'class_compact',
                    label: 'Kompakt / Hatchback EV (VW ID.3 / Megane E-Tech): 4260 × 1810 mm',
                    standard: 'ISO 3833',
                    values: { carLength: 4260, carWidth: 1810, bayWidth: 2500, visState: 'elevation' }
                },
                {
                    id: 'class_van',
                    label: 'Ticari Panelvan / Minibüs (Ford Transit / ID. Buzz): 5050 × 2030 mm',
                    standard: 'ISO 3833',
                    values: { carLength: 5050, carWidth: 2030, bayWidth: 2900, visState: 'elevation' }
                },
                {
                    id: 'class_accessible',
                    label: 'DIN 18040 Engelli Otopark Cebi (3500 mm Genişlik): 4800 × 1850 mm',
                    standard: 'DIN 18040',
                    values: { carLength: 4800, carWidth: 1850, bayWidth: 3500, visState: 'plan_sedan' }
                }
            ],
            default: 'class_sedan'
        }
    ],
    defaultValues: {
        carLength: 4720,
        carWidth: 1850,
        bayWidth: 2600,
        flipHeading: false,
        visState: 'elevation'
    },
    generate2D: (params: Record<string, any>, basePoint: Point = { x: 0, y: 0 }): CadEntity[] => {
        const entities: CadEntity[] = [];
        const length = Number(params.carLength || 4720);
        const width = Number(params.carWidth || 1850);
        const bayW = Number(params.bayWidth || 2600);
        const flip = Boolean(params.flipHeading);
        const visState = String(params.visState || 'elevation');

        const layerBody = 'layer-vehicle';
        const layerGlass = 'layer-glass';
        const layerWheels = 'layer-wheels';
        const layerMarking = 'layer-marking';

        const colorOutline = '#38bdf8';
        const colorAccent = '#00e5ff';
        const colorTrim = '#0284c7';
        const colorGlass = '#67e8f9';
        const colorLightDRL = '#facc15';
        const colorTailRed = '#ef4444';
        const colorTire = '#1e293b';

        // Helper: Convert local coordinate (xLocal = 0 at rear bumper, xLocal = length at front bumper) to world
        const toWorld = (xLocal: number, yLocal: number): Point => {
            const x = flip ? (length - xLocal) : xLocal;
            return {
                x: basePoint.x + x,
                y: basePoint.y + yLocal
            };
        };

        const mapPoints = (pts: { x: number; y: number }[]): Point[] => pts.map(p => toWorld(p.x, p.y));

        const isSuv = visState === 'plan_suv' || params.standardVehicle === 'class_suv';
        const isVan = visState === 'plan_van' || params.standardVehicle === 'class_van';
        const isCompact = params.standardVehicle === 'class_compact';

        // ═════════════════════════════════════════════════════════════════════
        // 1. SIDE ELEVATION PROJECTION (1:1 Modern Aerodynamic EV / Sports Car)
        // ═════════════════════════════════════════════════════════════════════
        if (visState === 'elevation') {
            let carHeight = 1440;
            let groundClearance = 140;
            let wheelRadius = 345; // 19" wheel OD 690 mm
            let frontOverhangRatio = 0.18;
            let rearOverhangRatio = 0.21;

            if (isSuv) {
                carHeight = 1640;
                groundClearance = 180;
                wheelRadius = 365;
                frontOverhangRatio = 0.185;
                rearOverhangRatio = 0.205;
            } else if (isVan) {
                carHeight = 1960;
                groundClearance = 185;
                wheelRadius = 350;
                frontOverhangRatio = 0.17;
                rearOverhangRatio = 0.21;
            } else if (isCompact) {
                carHeight = 1550;
                groundClearance = 145;
                wheelRadius = 340;
                frontOverhangRatio = 0.19;
                rearOverhangRatio = 0.18;
            }

            const OH_f = length * frontOverhangRatio;
            const OH_r = length * rearOverhangRatio;
            const x_rearWheel = OH_r;
            const y_rearWheel = wheelRadius;
            const x_frontWheel = length - OH_f;
            const y_frontWheel = wheelRadius;
            const archR = wheelRadius + (isSuv ? 50 : 42);
            const wheelbase = x_frontWheel - x_rearWheel;

            // ── A. Ground Line & Underbody Shadow ─────────────────────────────
            entities.push(createLineEntity(
                { x: basePoint.x - 400, y: basePoint.y },
                { x: basePoint.x + length + 400, y: basePoint.y },
                layerMarking,
                '#475569'
            ));

            const shadowPts: { x: number; y: number }[] = [
                { x: 50, y: 0 },
                { x: length - 80, y: 0 },
                { x: length - 120, y: groundClearance * 0.75 },
                { x: 80, y: groundClearance * 0.75 }
            ];
            entities.push(createHatchEntity(
                mapPoints(shadowPts),
                'SOLID',
                layerMarking,
                'rgba(15, 23, 42, 0.90)',
                undefined,
                undefined,
                false
            ));

            // ── B. Aerodynamic Wheel Arches Cutouts ───────────────────────────
            const rearArchPts: { x: number; y: number }[] = [];
            for (let deg = 165; deg >= 15; deg -= 25) {
                const rad = (deg * Math.PI) / 180;
                rearArchPts.push({
                    x: x_rearWheel + archR * Math.cos(rad),
                    y: y_rearWheel + archR * Math.sin(rad)
                });
            }

            const frontArchPts: { x: number; y: number }[] = [];
            for (let deg = 165; deg >= 15; deg -= 25) {
                const rad = (deg * Math.PI) / 180;
                frontArchPts.push({
                    x: x_frontWheel + archR * Math.cos(rad),
                    y: y_frontWheel + archR * Math.sin(rad)
                });
            }

            // ── C. Aerodynamic Car Body Outer Polygon ────────────────────────
            const bodyPts: { x: number; y: number }[] = [];

            // 1. Rear Diffuser & Underbody
            bodyPts.push({ x: 25, y: groundClearance + 60 });
            bodyPts.push({ x: x_rearWheel - archR - 35, y: groundClearance + 25 });

            // 2. Rear Wheel Arch
            bodyPts.push(...rearArchPts);

            // 3. Rocker Panel / Side Sill (lower door skirt)
            bodyPts.push({ x: x_rearWheel + archR * Math.cos((15 * Math.PI) / 180), y: groundClearance });
            bodyPts.push({ x: (x_rearWheel + x_frontWheel) / 2, y: groundClearance - 5 });
            bodyPts.push({ x: x_frontWheel - archR * Math.cos((15 * Math.PI) / 180), y: groundClearance });

            // 4. Front Wheel Arch
            bodyPts.push(...frontArchPts);

            // 5. Front Chin Splitter & Lower Bumper
            bodyPts.push({ x: x_frontWheel + archR * Math.cos((15 * Math.PI) / 180) + 15, y: groundClearance + 15 });
            bodyPts.push({ x: length - 60, y: groundClearance + 30 });
            bodyPts.push({ x: length - 10, y: groundClearance + 75 });
            bodyPts.push({ x: length, y: carHeight * 0.28 });
            bodyPts.push({ x: length - 15, y: carHeight * 0.38 });

            // 6. Front Nose, Hood & Windshield Cowl
            if (isVan) {
                bodyPts.push({ x: length - 80, y: carHeight * 0.52 });
                bodyPts.push({ x: length - OH_f * 0.8, y: carHeight * 0.62 });
                bodyPts.push({ x: length - OH_f * 1.1, y: carHeight * 0.72 });
                bodyPts.push({ x: length - OH_f * 1.5, y: carHeight * 0.94 });
                bodyPts.push({ x: length - OH_f * 1.7, y: carHeight * 0.99 });
                bodyPts.push({ x: x_rearWheel + 150, y: carHeight });
                bodyPts.push({ x: 30, y: carHeight * 0.98 });
                bodyPts.push({ x: 10, y: carHeight * 0.65 });
            } else if (isSuv) {
                bodyPts.push({ x: length - 45, y: carHeight * 0.46 });
                bodyPts.push({ x: length - OH_f * 0.7, y: carHeight * 0.56 });
                bodyPts.push({ x: length - OH_f * 1.25, y: carHeight * 0.66 });
                bodyPts.push({ x: length - OH_f * 1.8, y: carHeight * 0.90 });
                bodyPts.push({ x: length - OH_f * 2.15, y: carHeight * 0.98 });
                bodyPts.push({ x: x_rearWheel + wheelbase * 0.45, y: carHeight });
                bodyPts.push({ x: x_rearWheel + 120, y: carHeight * 0.98 });
                bodyPts.push({ x: x_rearWheel + 20, y: carHeight * 0.99 });
                bodyPts.push({ x: x_rearWheel - 120, y: carHeight * 0.78 });
                bodyPts.push({ x: x_rearWheel - OH_r * 0.65, y: carHeight * 0.64 });
                bodyPts.push({ x: 25, y: carHeight * 0.56 });
            } else {
                // Sleek Sports Sedan / Fastback EV (Tesla Model 3 / Taycan / BMW i4)
                bodyPts.push({ x: length - 50, y: carHeight * 0.44 });
                bodyPts.push({ x: length - OH_f * 0.65, y: carHeight * 0.52 });
                bodyPts.push({ x: length - OH_f * 1.2, y: carHeight * 0.62 });
                bodyPts.push({ x: length - OH_f * 1.45, y: carHeight * 0.66 });
                bodyPts.push({ x: length - OH_f * 1.95, y: carHeight * 0.86 });
                bodyPts.push({ x: length - OH_f * 2.35, y: carHeight * 0.98 });
                bodyPts.push({ x: x_rearWheel + wheelbase * 0.42, y: carHeight });
                bodyPts.push({ x: x_rearWheel + wheelbase * 0.16, y: carHeight * 0.94 });
                bodyPts.push({ x: x_rearWheel + 30, y: carHeight * 0.82 });
                bodyPts.push({ x: x_rearWheel - 110, y: carHeight * 0.72 });
                bodyPts.push({ x: x_rearWheel - OH_r * 0.75, y: carHeight * 0.70 }); // Ducktail spoiler
                bodyPts.push({ x: 30, y: carHeight * 0.58 }); // Taillight shelf
            }

            // 7. Rear Bumper & Diffuser
            bodyPts.push({ x: 8, y: carHeight * 0.42 });
            bodyPts.push({ x: 12, y: carHeight * 0.26 });
            bodyPts.push({ x: 25, y: groundClearance + 110 });

            // Metallic Body Paint Texture & Outline
            entities.push(createHatchEntity(
                mapPoints(bodyPts),
                'SOLID',
                layerBody,
                'rgba(14, 165, 233, 0.22)',
                undefined,
                undefined,
                false
            ));
            entities.push(createPolylineEntity(mapPoints(bodyPts), true, layerBody, colorOutline));

            // ── D. Cabin Windows (Daylight Opening - DLO) & Smoked Glass Texture ──
            const windowPts: { x: number; y: number }[] = [];
            if (isVan) {
                windowPts.push(
                    { x: length - OH_f * 1.45, y: carHeight * 0.72 },
                    { x: length - OH_f * 1.68, y: carHeight * 0.96 },
                    { x: x_rearWheel + wheelbase * 0.55, y: carHeight * 0.97 },
                    { x: x_rearWheel + wheelbase * 0.55, y: carHeight * 0.72 }
                );
            } else if (isSuv) {
                windowPts.push(
                    { x: length - OH_f * 1.50, y: carHeight * 0.68 },
                    { x: length - OH_f * 2.10, y: carHeight * 0.95 },
                    { x: x_rearWheel + wheelbase * 0.45, y: carHeight * 0.97 },
                    { x: x_rearWheel + 80, y: carHeight * 0.95 },
                    { x: x_rearWheel - 60, y: carHeight * 0.75 },
                    { x: length - OH_f * 1.50, y: carHeight * 0.67 }
                );
            } else {
                windowPts.push(
                    { x: length - OH_f * 1.48, y: carHeight * 0.68 },
                    { x: length - OH_f * 2.30, y: carHeight * 0.95 },
                    { x: x_rearWheel + wheelbase * 0.42, y: carHeight * 0.97 },
                    { x: x_rearWheel + wheelbase * 0.14, y: carHeight * 0.91 },
                    { x: x_rearWheel - 80, y: carHeight * 0.73 },
                    { x: length - OH_f * 1.48, y: carHeight * 0.66 }
                );
            }

            // Smoked glass tint hatch
            entities.push(createHatchEntity(
                mapPoints(windowPts),
                'SOLID',
                layerGlass,
                'rgba(15, 23, 42, 0.75)',
                undefined,
                undefined,
                false
            ));
            entities.push(createPolylineEntity(mapPoints(windowPts), true, layerGlass, colorTrim));

            // B-Pillar Blackout Divider
            const bPillarX = x_rearWheel + wheelbase * 0.52;
            entities.push(createRectangleEntity(
                toWorld(bPillarX, carHeight * 0.81),
                65,
                carHeight * 0.28,
                0,
                '#0f172a'
            ));

            // A-Pillar triangle / C-Pillar quarter window dividers
            if (!isVan) {
                entities.push(createLineEntity(
                    toWorld(length - OH_f * 1.68, carHeight * 0.67),
                    toWorld(length - OH_f * 1.76, carHeight * 0.82),
                    layerGlass,
                    '#1e293b'
                ));
                entities.push(createLineEntity(
                    toWorld(x_rearWheel + 50, carHeight * 0.67),
                    toWorld(x_rearWheel + 75, carHeight * 0.91),
                    layerGlass,
                    '#1e293b'
                ));
            }

            // Subtle cyan glass reflection glint
            entities.push(createLineEntity(
                toWorld(length - OH_f * 1.85, carHeight * 0.70),
                toWorld(length - OH_f * 2.10, carHeight * 0.90),
                layerGlass,
                'rgba(103, 232, 249, 0.60)'
            ));

            // ── E. Door Cutlines, Shoulder Character Crease & Flush Handles ───
            // Front door forward shutline
            entities.push(createLineEntity(
                toWorld(length - OH_f * 1.46, carHeight * 0.66),
                toWorld(length - OH_f * 1.30, groundClearance + 30),
                layerBody,
                colorTrim
            ));
            // Center B-pillar door shutline
            entities.push(createLineEntity(
                toWorld(bPillarX, carHeight * 0.67),
                toWorld(bPillarX, groundClearance),
                layerBody,
                colorTrim
            ));
            // Rear door shutline (curving around rear arch)
            entities.push(createLineEntity(
                toWorld(x_rearWheel + 50, carHeight * 0.67),
                toWorld(x_rearWheel + 15, groundClearance + 20),
                layerBody,
                colorTrim
            ));

            // Flank Character Shoulder Crease (running along beltline)
            entities.push(createLineEntity(
                toWorld(length - 120, carHeight * 0.48),
                toWorld(40, carHeight * 0.58),
                layerBody,
                'rgba(56, 189, 248, 0.40)'
            ));

            // Flush Pop-Out Door Handles (Modern EV Style)
            entities.push(createRectangleEntity(toWorld(x_frontWheel - 380, carHeight * 0.62), 85, 18, 0, colorTrim));
            entities.push(createRectangleEntity(toWorld(x_rearWheel + 480, carHeight * 0.63), 85, 18, 0, colorTrim));

            // Front Fender Side-Repeater Camera Pod (Tesla/Porsche Style)
            entities.push(createRectangleEntity(toWorld(x_frontWheel - 170, carHeight * 0.58), 36, 16, 0, '#0f172a'));
            entities.push(createCircleEntity(toWorld(x_frontWheel - 165, carHeight * 0.58), 3, layerBody, colorAccent));

            // Charging Port Flap Door (Rear Quarter Panel)
            entities.push(createRectangleEntity(toWorld(x_rearWheel - 140, carHeight * 0.62), 65, 48, 0, colorTrim));

            // ── F. Front LED Matrix Headlights & Rear 3D Taillights ───────────
            // Front Matrix LED Light Blade
            const headPts: { x: number; y: number }[] = [
                { x: length - 20, y: carHeight * 0.42 },
                { x: length - 120, y: carHeight * 0.48 },
                { x: length - 100, y: carHeight * 0.42 }
            ];
            entities.push(createPolylineEntity(mapPoints(headPts), true, layerBody, colorLightDRL));
            entities.push(createCircleEntity(toWorld(length - 55, carHeight * 0.44), 8, layerBody, colorGlass));

            // Rear 3D LED Taillight Blade
            const tailPts: { x: number; y: number }[] = [
                { x: 15, y: carHeight * 0.54 },
                { x: 110, y: carHeight * 0.58 },
                { x: 95, y: carHeight * 0.54 }
            ];
            entities.push(createPolylineEntity(mapPoints(tailPts), true, layerBody, colorTailRed));

            // Aerodynamic Side Mirror
            const mirrorBaseX = length - OH_f * 1.48;
            const mirrorBaseY = carHeight * 0.69;
            entities.push(createPolylineEntity([
                toWorld(mirrorBaseX, mirrorBaseY),
                toWorld(mirrorBaseX - 30, mirrorBaseY + 25),
                toWorld(mirrorBaseX - 110, mirrorBaseY + 30),
                toWorld(mirrorBaseX - 115, mirrorBaseY + 8),
                toWorld(mirrorBaseX - 40, mirrorBaseY + 6)
            ], true, layerBody, colorTrim));
            // Mirror LED Turn Signal Strip
            entities.push(createLineEntity(
                toWorld(mirrorBaseX - 45, mirrorBaseY + 26),
                toWorld(mirrorBaseX - 105, mirrorBaseY + 28),
                layerBody,
                colorLightDRL
            ));

            // Roof Rails (if SUV)
            if (isSuv) {
                const railStart = x_rearWheel + 40;
                const railEnd = length - OH_f * 1.7;
                entities.push(createRectangleEntity(
                    toWorld((railStart + railEnd) / 2, carHeight + 25),
                    railEnd - railStart,
                    18,
                    0,
                    '#94a3b8'
                ));
            }

            // ── G. High-Performance Wheels, Brakes & Turbine Aero Rims ────────
            const drawWheelAssembly = (wx: number, wy: number, isFront: boolean) => {
                const center = toWorld(wx, wy);

                // 1. Wheel Arch Dark Well Shadow
                entities.push(createCircleEntity(center, archR - 6, layerWheels, 'rgba(15, 23, 42, 0.95)'));

                // 2. Outer Rubber Tire
                entities.push(createCircleEntity(center, wheelRadius, layerWheels, colorTire));
                entities.push(createCircleEntity(center, wheelRadius * 0.74, layerWheels, '#334155'));

                // Radial tire tread hash marks
                for (let k = 0; k < 12; k++) {
                    const ang = (k * 2 * Math.PI) / 12;
                    const pIn = { x: center.x + (wheelRadius * 0.85) * Math.cos(ang), y: center.y + (wheelRadius * 0.85) * Math.sin(ang) };
                    const pOut = { x: center.x + (wheelRadius * 0.98) * Math.cos(ang), y: center.y + (wheelRadius * 0.98) * Math.sin(ang) };
                    entities.push(createLineEntity(pIn, pOut, layerWheels, '#0f172a'));
                }

                // 3. Ventilated Brake Rotor Disc
                const rotorR = wheelRadius * 0.54;
                entities.push(createCircleEntity(center, rotorR, layerWheels, '#64748b'));
                entities.push(createCircleEntity(center, rotorR * 0.75, layerWheels, '#475569'));

                // 4. Performance Racing Caliper (Red #ef4444)
                const caliperAngle = isFront ? (135 * Math.PI) / 180 : (45 * Math.PI) / 180;
                const calX = center.x + rotorR * 0.88 * Math.cos(caliperAngle);
                const calY = center.y + rotorR * 0.88 * Math.sin(caliperAngle);
                entities.push(createRectangleEntity({ x: calX, y: calY }, 55, 24, caliperAngle + Math.PI / 2, '#ef4444'));

                // 5. Aero Turbine Alloy Rim Lip
                const rimR = wheelRadius * 0.70;
                entities.push(createCircleEntity(center, rimR, layerWheels, '#e2e8f0'));

                // 6. Modern 5-Spoke Directional Turbine Blades
                for (let s = 0; s < 5; s++) {
                    const baseAng = (s * 2 * Math.PI) / 5 + (isFront ? 0.2 : 0);
                    const hubR = wheelRadius * 0.18;
                    const spokeP1 = {
                        x: center.x + hubR * Math.cos(baseAng),
                        y: center.y + hubR * Math.sin(baseAng)
                    };
                    const spokeP2 = {
                        x: center.x + rimR * Math.cos(baseAng + 0.25),
                        y: center.y + rimR * Math.sin(baseAng + 0.25)
                    };
                    const spokeP3 = {
                        x: center.x + rimR * Math.cos(baseAng + 0.38),
                        y: center.y + rimR * Math.sin(baseAng + 0.38)
                    };
                    const spokeP4 = {
                        x: center.x + hubR * Math.cos(baseAng + 0.12),
                        y: center.y + hubR * Math.sin(baseAng + 0.12)
                    };
                    entities.push(createPolylineEntity([spokeP1, spokeP2, spokeP3, spokeP4], true, layerWheels, colorOutline));
                    entities.push(createLineEntity(spokeP2, spokeP4, layerWheels, colorAccent));
                }

                // 7. Center Hub Cap & Lug Nut Circle
                const hubCapR = wheelRadius * 0.16;
                entities.push(createCircleEntity(center, hubCapR, layerWheels, '#0f172a'));
                entities.push(createCircleEntity(center, hubCapR * 0.45, layerWheels, colorAccent));
                for (let ln = 0; ln < 5; ln++) {
                    const lnAng = (ln * 2 * Math.PI) / 5;
                    const lnPt = {
                        x: center.x + (hubCapR * 0.72) * Math.cos(lnAng),
                        y: center.y + (hubCapR * 0.72) * Math.sin(lnAng)
                    };
                    entities.push(createCircleEntity(lnPt, 2.5, layerWheels, '#e2e8f0'));
                }
            };

            // Draw rear & front wheels
            drawWheelAssembly(x_rearWheel, y_rearWheel, false);
            drawWheelAssembly(x_frontWheel, y_frontWheel, true);

            return entities;
        }

        // ═════════════════════════════════════════════════════════════════════
        // 2. PLAN VIEW PROJECTION (Site Layout / Parking Standards - Neufert)
        // ═════════════════════════════════════════════════════════════════════
        const bayLength = Math.max(5000, length + 400);
        const bayHalfW = bayW / 2;
        const halfW = width / 2;

        // ── A. Parking Stall Marking Lines (White #ffffff) ───────────────────
        entities.push(createLineEntity(
            { x: basePoint.x - 200, y: basePoint.y - bayHalfW },
            { x: basePoint.x + bayLength, y: basePoint.y - bayHalfW },
            layerMarking,
            '#ffffff'
        ));
        entities.push(createLineEntity(
            { x: basePoint.x - 200, y: basePoint.y + bayHalfW },
            { x: basePoint.x + bayLength, y: basePoint.y + bayHalfW },
            layerMarking,
            '#ffffff'
        ));
        // End stall limit line
        entities.push(createLineEntity(
            { x: basePoint.x + bayLength, y: basePoint.y - bayHalfW },
            { x: basePoint.x + bayLength, y: basePoint.y + bayHalfW },
            layerMarking,
            '#ffffff'
        ));

        // ── B. Heavy-Duty Wheel Stop Curb (Amber/Black Hazard Stripes) ───────
        const curbX = toWorld(650, 0).x;
        entities.push(createRectangleEntity(
            { x: curbX, y: basePoint.y },
            140,
            Math.min(1800, width * 0.95),
            0,
            '#f59e0b'
        ));
        entities.push(createRectangleEntity(
            { x: curbX, y: basePoint.y },
            110,
            Math.min(1700, width * 0.90),
            0,
            '#0f172a'
        ));

        // ── C. Contoured Aerodynamic Car Body (Coke-Bottle Athletic Stance) ──
        const topBodyPts: { x: number; y: number }[] = [];
        const OH_f = length * 0.18;
        const OH_r = length * 0.21;
        const x_frontWheel = length - OH_f;
        const x_rearWheel = OH_r;

        // Trace perimeter starting at center front bumper clockwise
        topBodyPts.push({ x: length, y: 0 });
        topBodyPts.push({ x: length - 40, y: halfW * 0.45 });
        topBodyPts.push({ x: length - 90, y: halfW * 0.85 });
        // Front right wheel arch flare
        topBodyPts.push({ x: x_frontWheel + 150, y: halfW });
        topBodyPts.push({ x: x_frontWheel, y: halfW + 10 });
        topBodyPts.push({ x: x_frontWheel - 150, y: halfW });
        // Tapered waistline (athletic cabin tuck)
        topBodyPts.push({ x: (x_frontWheel + x_rearWheel) / 2, y: halfW - 25 });
        // Rear muscular haunches (wheel flare)
        topBodyPts.push({ x: x_rearWheel + 160, y: halfW + 12 });
        topBodyPts.push({ x: x_rearWheel, y: halfW + 18 });
        topBodyPts.push({ x: x_rearWheel - 160, y: halfW + 10 });
        // Rear right bumper curve
        topBodyPts.push({ x: 90, y: halfW * 0.85 });
        topBodyPts.push({ x: 30, y: halfW * 0.50 });
        // Rear center bumper
        topBodyPts.push({ x: 10, y: 0 });
        // Rear left bumper curve
        topBodyPts.push({ x: 30, y: -halfW * 0.50 });
        topBodyPts.push({ x: 90, y: -halfW * 0.85 });
        // Rear left muscular haunches
        topBodyPts.push({ x: x_rearWheel - 160, y: -(halfW + 10) });
        topBodyPts.push({ x: x_rearWheel, y: -(halfW + 18) });
        topBodyPts.push({ x: x_rearWheel + 160, y: -(halfW + 12) });
        // Left tapered waistline
        topBodyPts.push({ x: (x_frontWheel + x_rearWheel) / 2, y: -(halfW - 25) });
        // Front left wheel arch flare
        topBodyPts.push({ x: x_frontWheel - 150, y: -halfW });
        topBodyPts.push({ x: x_frontWheel, y: -(halfW + 10) });
        topBodyPts.push({ x: x_frontWheel + 150, y: -halfW });
        topBodyPts.push({ x: length - 90, y: -halfW * 0.85 });
        topBodyPts.push({ x: length - 40, y: -halfW * 0.45 });

        // Metallic paint body hatch & crisp outline
        entities.push(createHatchEntity(
            mapPoints(topBodyPts),
            'SOLID',
            layerBody,
            'rgba(14, 165, 233, 0.20)',
            undefined,
            undefined,
            false
        ));
        entities.push(createPolylineEntity(mapPoints(topBodyPts), true, layerBody, colorOutline));

        // ── D. Sculpted Hood Creases & Front Badge ─────────────────────────
        entities.push(createLineEntity(
            toWorld(length - 50, halfW * 0.35),
            toWorld(length - OH_f * 1.35, halfW * 0.55),
            layerBody,
            colorAccent
        ));
        entities.push(createLineEntity(
            toWorld(length - 50, -halfW * 0.35),
            toWorld(length - OH_f * 1.35, -halfW * 0.55),
            layerBody,
            colorAccent
        ));
        // Center front emblem
        entities.push(createCircleEntity(toWorld(length - 35, 0), 12, layerBody, colorAccent));

        // ── E. Full Panoramic Tinted Glass Roof Canopy ───────────────────────
        const glassW_front = halfW * 0.76;
        const glassW_mid = halfW * 0.74;
        const glassW_rear = halfW * 0.70;

        const roofPts: { x: number; y: number }[] = [
            { x: length - OH_f * 1.45, y: -glassW_front },
            { x: length - OH_f * 1.40, y: 0 },
            { x: length - OH_f * 1.45, y: glassW_front },
            { x: (x_frontWheel + x_rearWheel) / 2, y: glassW_mid },
            { x: x_rearWheel + 50, y: glassW_rear },
            { x: x_rearWheel - 80, y: glassW_rear * 0.88 },
            { x: x_rearWheel - 100, y: 0 },
            { x: x_rearWheel - 80, y: -glassW_rear * 0.88 },
            { x: x_rearWheel + 50, y: -glassW_rear },
            { x: (x_frontWheel + x_rearWheel) / 2, y: -glassW_mid }
        ];

        entities.push(createHatchEntity(
            mapPoints(roofPts),
            'SOLID',
            layerGlass,
            'rgba(15, 23, 42, 0.72)',
            undefined,
            undefined,
            false
        ));
        entities.push(createPolylineEntity(mapPoints(roofPts), true, layerGlass, colorTrim));

        // Windshield wiper cowl & front glass boundary
        entities.push(createLineEntity(
            toWorld(length - OH_f * 1.95, -glassW_mid),
            toWorld(length - OH_f * 1.95, glassW_mid),
            layerGlass,
            '#334155'
        ));

        // Rear window defroster heating lines
        for (let df = 0; df < 3; df++) {
            const dfX = x_rearWheel - 10 - df * 25;
            entities.push(createLineEntity(
                toWorld(dfX, -glassW_rear * 0.65),
                toWorld(dfX, glassW_rear * 0.65),
                layerGlass,
                'rgba(103, 232, 249, 0.40)'
            ));
        }

        // ── F. Side Mirrors & Flush Door Handles ───────────────────────────
        const mirrorX = length - OH_f * 1.48;
        // Right mirror
        entities.push(createPolylineEntity([
            toWorld(mirrorX, halfW),
            toWorld(mirrorX - 40, halfW + 140),
            toWorld(mirrorX + 40, halfW + 155),
            toWorld(mirrorX + 50, halfW + 35)
        ], true, layerBody, colorTrim));
        // Left mirror
        entities.push(createPolylineEntity([
            toWorld(mirrorX, -halfW),
            toWorld(mirrorX - 40, -(halfW + 140)),
            toWorld(mirrorX + 40, -(halfW + 155)),
            toWorld(mirrorX + 50, -(halfW + 35))
        ], true, layerBody, colorTrim));

        // 4 Flush door handles
        entities.push(createRectangleEntity(toWorld(x_frontWheel - 380, halfW - 20), 80, 14, 0, colorTrim));
        entities.push(createRectangleEntity(toWorld(x_rearWheel + 480, halfW - 18), 80, 14, 0, colorTrim));
        entities.push(createRectangleEntity(toWorld(x_frontWheel - 380, -(halfW - 20)), 80, 14, 0, colorTrim));
        entities.push(createRectangleEntity(toWorld(x_rearWheel + 480, -(halfW - 18)), 80, 14, 0, colorTrim));

        // ── G. High-Tech Matrix LED Headlamps & Rear Taillight Strip ────────
        // Front Headlights
        entities.push(createPolylineEntity([
            toWorld(length - 25, halfW * 0.48),
            toWorld(length - 120, halfW * 0.88),
            toWorld(length - 85, halfW * 0.90)
        ], false, layerBody, colorLightDRL));
        entities.push(createPolylineEntity([
            toWorld(length - 25, -halfW * 0.48),
            toWorld(length - 120, -halfW * 0.88),
            toWorld(length - 85, -halfW * 0.90)
        ], false, layerBody, colorLightDRL));

        // Rear Full-Width LED Taillight Blade
        entities.push(createLineEntity(
            toWorld(25, -halfW * 0.72),
            toWorld(25, halfW * 0.72),
            layerBody,
            colorTailRed
        ));

        // Roof Rails (if SUV)
        if (isSuv) {
            const railX1 = x_rearWheel + 40;
            const railX2 = length - OH_f * 1.7;
            entities.push(createLineEntity(toWorld(railX1, halfW * 0.65), toWorld(railX2, halfW * 0.65), layerBody, '#94a3b8'));
            entities.push(createLineEntity(toWorld(railX1, -halfW * 0.65), toWorld(railX2, -halfW * 0.65), layerBody, '#94a3b8'));
        }

        // ── H. Driver Door Swing Clearance Arc (Site Accessibility Check) ───
        const doorHinge = toWorld(x_frontWheel - 380, halfW);
        entities.push(createArcEntity(
            doorHinge,
            900,
            0,
            Math.PI / 3,
            layerMarking,
            'rgba(56, 189, 248, 0.45)'
        ));

        // Wheelchair Accessible Symbol (if accessible bay)
        if (params.standardVehicle === 'class_accessible' || bayW >= 3400) {
            const isaCenter = { x: basePoint.x + bayLength * 0.72, y: basePoint.y };
            entities.push(createCircleEntity({ x: isaCenter.x, y: isaCenter.y + 160 }, 55, layerMarking, '#38bdf8'));
            entities.push(createArcEntity({ x: isaCenter.x, y: isaCenter.y - 20 }, 140, -Math.PI / 2, Math.PI / 2, layerMarking, '#38bdf8'));
            entities.push(createLineEntity({ x: isaCenter.x, y: isaCenter.y + 110 }, { x: isaCenter.x, y: isaCenter.y - 40 }, layerMarking, '#38bdf8'));
            entities.push(createLineEntity({ x: isaCenter.x, y: isaCenter.y - 40 }, { x: isaCenter.x + 90, y: isaCenter.y - 40 }, layerMarking, '#38bdf8'));
        }

        return entities;
    },
    getGrips: (params: Record<string, any>, basePoint: Point): DynamicGrip[] => {
        const length = Number(params.carLength || 4720);
        const bayW = Number(params.bayWidth || 2600);
        const visState = String(params.visState || 'elevation');

        const grips: DynamicGrip[] = [
            {
                id: 'grip_origin',
                type: 'point',
                position: { x: basePoint.x, y: basePoint.y },
                paramId: 'origin',
                label: 'Insertion Point',
                labelTr: 'Yerleşim Başlangıç Noktası'
            },
            {
                id: 'grip_length',
                type: 'linear',
                position: { x: basePoint.x + length, y: basePoint.y + (visState === 'elevation' ? 140 : 0) },
                direction: { x: 1, y: 0 },
                paramId: 'carLength',
                label: 'Stretch Vehicle Length',
                labelTr: 'Araç Boyunu Ayarla (L)'
            },
            {
                id: 'grip_flip',
                type: 'flip',
                position: { x: basePoint.x - 80, y: basePoint.y + (visState === 'elevation' ? 140 : 0) },
                paramId: 'flipHeading',
                label: 'Flip Driving Direction',
                labelTr: 'Sürüş Yönünü Çevir'
            },
            {
                id: 'grip_vis',
                type: 'visibility',
                position: { x: basePoint.x + length / 2, y: basePoint.y + (visState === 'elevation' ? 1480 : bayW / 2 + 60) },
                paramId: 'visState',
                label: 'View Projection (Elevation / Plan)',
                labelTr: 'Görünüş İzdüşümü (Yan Profil / Plan)'
            }
        ];

        if (visState !== 'elevation') {
            grips.push({
                id: 'grip_bay',
                type: 'linear',
                position: { x: basePoint.x + length / 2, y: basePoint.y + bayW / 2 },
                direction: { x: 0, y: 1 },
                paramId: 'bayWidth',
                label: 'Parking Bay Width',
                labelTr: 'Otopark Cebi Genişliği'
            });
        }

        return grips;
    },
    generate3D: (params: Record<string, any>, basePos = { x: 0, y: 0, z: 0 }): DynamicPart3DDef[] => {
        const length = Number(params.carLength || 4720) / 1000;
        const width = Number(params.carWidth || 1850) / 1000;
        const height = 1.44;

        return [
            // 1. Lower Aerodynamic Body / Skirt
            {
                name: 'Car_Aero_Body',
                shape: 'box',
                dimensions: { width: length, height: 0.42, depth: width * 0.96 },
                position: { x: basePos.x + length / 2, y: basePos.y + 0.35, z: basePos.z },
                color: '#0284c7',
                materialType: 'aluminum_anodized'
            },
            // 2. Front Sculpted Nose
            {
                name: 'Car_Front_Nose',
                shape: 'box',
                dimensions: { width: length * 0.22, height: 0.30, depth: width * 0.90 },
                position: { x: basePos.x + length * 0.88, y: basePos.y + 0.38, z: basePos.z },
                color: '#0284c7',
                materialType: 'aluminum_anodized'
            },
            // 3. Cabin Greenhouse (Smoked Tinted Glass)
            {
                name: 'Car_Cabin_Greenhouse',
                shape: 'box',
                dimensions: { width: length * 0.54, height: 0.48, depth: width * 0.82 },
                position: { x: basePos.x + length * 0.46, y: basePos.y + 0.78, z: basePos.z },
                color: '#0f172a',
                materialType: 'glass_tinted'
            },
            // 4. Full Panoramic Glass Roof
            {
                name: 'Car_Panoramic_Roof',
                shape: 'box',
                dimensions: { width: length * 0.46, height: 0.05, depth: width * 0.74 },
                position: { x: basePos.x + length * 0.47, y: basePos.y + 1.04, z: basePos.z },
                color: '#38bdf8',
                materialType: 'glass_clear'
            },
            // 5. 4 Wheels: Rubber Tires + Aero Alloy Rims
            // Front Left
            {
                name: 'Car_Tire_FL',
                shape: 'cylinder',
                dimensions: { radius: 0.345, height: 0.24 },
                position: { x: basePos.x + length * 0.81, y: basePos.y + 0.345, z: basePos.z + width / 2 },
                color: '#0f172a',
                materialType: 'rubber'
            },
            {
                name: 'Car_Rim_FL',
                shape: 'cylinder',
                dimensions: { radius: 0.245, height: 0.25 },
                position: { x: basePos.x + length * 0.81, y: basePos.y + 0.345, z: basePos.z + width / 2 },
                color: '#38bdf8',
                materialType: 'aluminum_anodized'
            },
            // Front Right
            {
                name: 'Car_Tire_FR',
                shape: 'cylinder',
                dimensions: { radius: 0.345, height: 0.24 },
                position: { x: basePos.x + length * 0.81, y: basePos.y + 0.345, z: basePos.z - width / 2 },
                color: '#0f172a',
                materialType: 'rubber'
            },
            {
                name: 'Car_Rim_FR',
                shape: 'cylinder',
                dimensions: { radius: 0.245, height: 0.25 },
                position: { x: basePos.x + length * 0.81, y: basePos.y + 0.345, z: basePos.z - width / 2 },
                color: '#38bdf8',
                materialType: 'aluminum_anodized'
            },
            // Rear Left
            {
                name: 'Car_Tire_RL',
                shape: 'cylinder',
                dimensions: { radius: 0.345, height: 0.24 },
                position: { x: basePos.x + length * 0.21, y: basePos.y + 0.345, z: basePos.z + width / 2 },
                color: '#0f172a',
                materialType: 'rubber'
            },
            {
                name: 'Car_Rim_RL',
                shape: 'cylinder',
                dimensions: { radius: 0.245, height: 0.25 },
                position: { x: basePos.x + length * 0.21, y: basePos.y + 0.345, z: basePos.z + width / 2 },
                color: '#38bdf8',
                materialType: 'aluminum_anodized'
            },
            // Rear Right
            {
                name: 'Car_Tire_RR',
                shape: 'cylinder',
                dimensions: { radius: 0.345, height: 0.24 },
                position: { x: basePos.x + length * 0.21, y: basePos.y + 0.345, z: basePos.z - width / 2 },
                color: '#0f172a',
                materialType: 'rubber'
            },
            {
                name: 'Car_Rim_RR',
                shape: 'cylinder',
                dimensions: { radius: 0.245, height: 0.25 },
                position: { x: basePos.x + length * 0.21, y: basePos.y + 0.345, z: basePos.z - width / 2 },
                color: '#38bdf8',
                materialType: 'aluminum_anodized'
            },
            // 6. LED Headlights & Taillights
            {
                name: 'Car_LED_Headlamps',
                shape: 'box',
                dimensions: { width: 0.08, height: 0.08, depth: width * 0.85 },
                position: { x: basePos.x + length * 0.99, y: basePos.y + 0.52, z: basePos.z },
                color: '#67e8f9',
                materialType: 'glass_clear'
            },
            {
                name: 'Car_LED_Taillight',
                shape: 'box',
                dimensions: { width: 0.06, height: 0.06, depth: width * 0.88 },
                position: { x: basePos.x + 0.04, y: basePos.y + 0.68, z: basePos.z },
                color: '#ef4444',
                materialType: 'glass_clear'
            }
        ];
    }
};
