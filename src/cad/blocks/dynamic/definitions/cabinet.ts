/**
 * 🗄️ Dynamic Cabinet & Wardrobe Block (Production & Manufacturing Grade)
 * 
 * Complies with:
 * - DIN 68858 / DIN 68874: Standard 32mm boring system (System 32 hole grid)
 * - ISO 7170: Storage furniture - Determination of strength and durability
 * 
 * FEATURES:
 * - Linear stretch: Width (400 - 3200 mm), Height (600 - 2600 mm), Depth (350 - 650 mm)
 * - Dynamic Door Partitions: calculates 1, 2, 3, 4, 5, or 6 doors with 3mm reveals and brushed bar handles
 * - Front Elevation: 18mm carcass double lines, 80mm recessed plinth kick, hinge locations, bar pulls
 * - Cross Section:
 *   - 32mm hole drilling grid (System 32 per DIN 68858)
 *   - Upper hat shelf + oval clothes hanging rail with hangers
 *   - Lower internal drawers with ball-bearing slide indicators
 *   - Adjustable intermediate shelves on support pins
 *   - 4mm backboard recessed into 8mm carcass groove
 * - Top Plan View: 18mm carcass box, 90° door swing arc guidelines, handles, wall anchor brackets
 * - 3D Solid Assembly: True multi-part cabinet carcass, backboard, doors, and metallic handle extrusions
 */

import { Point, CadEntity, createLineEntity, createCircleEntity, createRectangleEntity, createArcEntity } from '../../../kernel/types';
import { DynamicBlockDef, DynamicGrip, DynamicPart3DDef } from '../types';

export const DYN_CABINET: DynamicBlockDef = {
    id: 'dyn_cabinet',
    name: 'Dynamic Cabinet & Wardrobe (System 32)',
    nameTr: 'Dinamik Üretime Uygun Gardırop ve Dolap (Sistem 32)',
    category: 'Furniture',
    subcategory: 'Storage & Cabinets',
    subcategoryTr: 'Depolama ve Dolaplar',
    description: 'Manufacturing-grade wardrobe: 18mm carcass, 32mm hole grid (DIN 68858), plinth kick, internal drawers & door swings.',
    descriptionTr: 'Üretime hazır gardırop: 18mm gövde, Sistem 32 delik aksı (DIN 68858), bazalı ayak, raylı iç çekmeceler ve kapak açılımları.',
    icon: '🗄️',
    citation: {
        tier: 1,
        standard: 'DIN 68858 / DIN 68874 / ISO 7170',
        clause: 'DIN 68858 Clause 3 (System 32 drill grid), ISO 7170 Clauses 4.1-4.4',
        description: 'Standard 32mm boring pitch, 37mm setback from front/rear edges, 18mm melamine/MDF panels, 80mm recessed plinth.'
    },
    linearParams: [
        {
            id: 'width',
            name: 'width',
            label: 'Cabinet Width',
            labelTr: 'Dolap Genişliği',
            min: 400,
            max: 3200,
            step: 50,
            default: 1200,
            unit: 'mm',
            axis: 'x'
        },
        {
            id: 'height',
            name: 'height',
            label: 'Cabinet Height',
            labelTr: 'Dolap Yüksekliği',
            min: 600,
            max: 2600,
            step: 50,
            default: 2100,
            unit: 'mm',
            axis: 'y'
        },
        {
            id: 'depth',
            name: 'depth',
            label: 'Cabinet Depth',
            labelTr: 'Dolap Derinliği',
            min: 350,
            max: 650,
            step: 10,
            default: 600,
            unit: 'mm',
            axis: 'y'
        }
    ],
    visibilityParam: {
        id: 'visState',
        name: 'visState',
        label: 'Projection View',
        labelTr: 'İzdüşüm Görünüşü',
        states: [
            { id: 'elevation', label: 'Front Elevation (Kapaklı Ön Görünüş)', labelTr: 'Ön Görünüş (Kapaklı)' },
            { id: 'section', label: 'Cross Section (Sistem 32 & İç Detay)', labelTr: 'İç Kesit (Sistem 32 & Çekmece)' },
            { id: 'plan', label: 'Top Plan View (Kapak Açılımlı Üst Plan)', labelTr: 'Üst Plan (Kapak Açılımlı)' }
        ],
        default: 'elevation'
    },
    lookupParams: [
        {
            id: 'presetUnit',
            name: 'presetUnit',
            label: 'Standard Cabinet Preset',
            labelTr: 'Standart Modül Seçimi',
            options: [
                { id: 'unit_single', label: 'Tekli Dolap (500 × 2100 × 600 mm)', values: { width: 500, height: 2100, depth: 600 } },
                { id: 'unit_double', label: 'Çift Kapılı Gardırop (1000 × 2100 × 600 mm)', values: { width: 1000, height: 2100, depth: 600 } },
                { id: 'unit_triple', label: '3 Kapılı Gardırop (1500 × 2100 × 600 mm)', values: { width: 1500, height: 2100, depth: 600 } },
                { id: 'unit_quad', label: '4 Kapılı Büyük Gardırop (2000 × 2100 × 600 mm)', values: { width: 2000, height: 2100, depth: 600 } },
                { id: 'kitchen_base', label: 'Mutfak Alt Dolap (800 × 850 × 600 mm)', values: { width: 800, height: 850, depth: 600 } },
                { id: 'kitchen_wall', label: 'Mutfak Üst Dolap (800 × 720 × 350 mm)', values: { width: 800, height: 720, depth: 350 } }
            ],
            default: 'unit_double'
        },
        {
            id: 'doorStyle',
            name: 'doorStyle',
            label: 'Door Leaf Style',
            labelTr: 'Kapak Tasarım Stili',
            options: [
                { id: 'modern_slab', label: 'Modern Düz Panel (Slab Handle)', values: { doorStyle: 'modern_slab' } },
                { id: 'shaker_routed', label: 'Shaker Çerçeveli Frezeli Kapak', values: { doorStyle: 'shaker_routed' } }
            ],
            default: 'modern_slab'
        }
    ],
    arrayActions: [
        {
            id: 'array_doors',
            linearParamId: 'width',
            spacing: 500,
            minCount: 1,
            maxCount: 6,
            label: 'Door Leaf Partition',
            labelTr: 'Kapak Bölüntüsü'
        },
        {
            id: 'array_shelves',
            linearParamId: 'height',
            spacing: 380,
            minCount: 1,
            maxCount: 8,
            label: 'Internal Shelves Array',
            labelTr: 'İç Raf Dizilimi'
        }
    ],
    defaultValues: {
        width: 1200,
        height: 2100,
        depth: 600,
        doorStyle: 'modern_slab',
        visState: 'elevation'
    },
    generate2D: (params, basePoint = { x: 0, y: 0 }) => {
        const width = Number(params.width) || 1200;
        const height = Number(params.height) || 2100;
        const depth = Number(params.depth) || 600;
        const state = String(params.visState || 'elevation');
        const doorStyle = String(params.doorStyle || 'modern_slab');

        const entities: CadEntity[] = [];
        const layer = 'layer-furn';
        const colorMain = '#3ad0e6';      // Primary cyan chassis
        const colorInner = '#94a3b8';     // Light slate panel lines
        const colorHandle = '#f59e0b';    // Amber brushed metallic hardware
        const colorSystem32 = '#64748b';  // Muted steel for System 32 drill points
        const colorDashed = '#475569';    // Construction dashed lines
        const colorDrawer = '#38bdf8';    // Sky blue internal slide mechanisms

        const carcaseT = 18; // 18mm standard melamine/MDF panel
        const plinthH = 80;  // 80mm baseboard kick
        const plinthRecess = 20; // 20mm toe recess

        // ═══════════════════════════════════════════════════════════════
        // 1. TOP PLAN VIEW (Kapak Açılımlı Üst Plan)
        // ═══════════════════════════════════════════════════════════════
        if (state === 'plan') {
            // Outer carcass boundary (Width x Depth)
            entities.push(createRectangleEntity(
                { x: basePoint.x + width / 2, y: basePoint.y + depth / 2 },
                width,
                depth,
                layer,
                colorMain
            ));

            // Left & Right Carcass side panels (18mm thick)
            entities.push(createLineEntity(
                { x: basePoint.x + carcaseT, y: basePoint.y },
                { x: basePoint.x + carcaseT, y: basePoint.y + depth },
                layer,
                colorInner
            ));
            entities.push(createLineEntity(
                { x: basePoint.x + width - carcaseT, y: basePoint.y },
                { x: basePoint.x + width - carcaseT, y: basePoint.y + depth },
                layer,
                colorInner
            ));

            // 4mm Backboard groove (setback 15mm from rear wall)
            entities.push(createLineEntity(
                { x: basePoint.x + carcaseT, y: basePoint.y + 15 },
                { x: basePoint.x + width - carcaseT, y: basePoint.y + 15 },
                layer,
                colorDashed
            ));
            entities.push(createLineEntity(
                { x: basePoint.x + carcaseT, y: basePoint.y + 19 },
                { x: basePoint.x + width - carcaseT, y: basePoint.y + 19 },
                layer,
                colorDashed
            ));

            // Door Leaf Partitions and 90° Swing Arcs in front (extending upward in +Y)
            const doorCount = Math.max(1, Math.round(width / 500));
            const doorW = width / doorCount;

            for (let i = 0; i < doorCount; i++) {
                const isLeftHinged = i % 2 === 0;
                const hingeX = isLeftHinged ? basePoint.x + i * doorW : basePoint.x + (i + 1) * doorW;
                const openDir = isLeftHinged ? 1 : -1;

                // Closed Door line in front of carcass
                entities.push(createLineEntity(
                    { x: basePoint.x + i * doorW + 2, y: basePoint.y + depth + 4 },
                    { x: basePoint.x + (i + 1) * doorW - 2, y: basePoint.y + depth + 4 },
                    layer,
                    colorInner
                ));

                // 90° Door Swing Arc (from front edge out into room)
                // Left-hinged swings counter-clockwise from 0 to 90 deg; right-hinged from 90 to 180 deg
                const startAngle = isLeftHinged ? 0 : Math.PI / 2;
                const endAngle = isLeftHinged ? Math.PI / 2 : Math.PI;

                entities.push(createArcEntity(
                    { x: hingeX, y: basePoint.y + depth },
                    doorW - 4,
                    startAngle,
                    endAngle,
                    layer,
                    colorDashed
                ));

                // Open door leaf line
                entities.push(createLineEntity(
                    { x: hingeX, y: basePoint.y + depth },
                    { x: hingeX, y: basePoint.y + depth + (doorW - 4) },
                    layer,
                    colorInner
                ));

                // External Bar Pull Handle on front
                const handleX = isLeftHinged ? basePoint.x + (i + 1) * doorW - 45 : basePoint.x + i * doorW + 45;
                entities.push(createRectangleEntity(
                    { x: handleX, y: basePoint.y + depth + 14 },
                    40,
                    12,
                    layer,
                    colorHandle
                ));
            }

            // Wall Anchoring L-Brackets at back corners
            entities.push(createLineEntity({ x: basePoint.x + 25, y: basePoint.y + 2 }, { x: basePoint.x + 55, y: basePoint.y + 2 }, layer, '#ef4444'));
            entities.push(createLineEntity({ x: basePoint.x + width - 55, y: basePoint.y + 2 }, { x: basePoint.x + width - 25, y: basePoint.y + 2 }, layer, '#ef4444'));

            return entities;
        }

        // ═══════════════════════════════════════════════════════════════
        // 2. FRONT ELEVATION (Kapaklı Ön Görünüş)
        // ═══════════════════════════════════════════════════════════════
        if (state === 'elevation') {
            // Recessed Plinth Base (Kick plate 80mm high, indented 20mm on both sides)
            entities.push(createRectangleEntity(
                { x: basePoint.x + width / 2, y: basePoint.y + plinthH / 2 },
                width - plinthRecess * 2,
                plinthH,
                layer,
                '#334155'
            ));
            // Floor contact line
            entities.push(createLineEntity(
                { x: basePoint.x - 20, y: basePoint.y },
                { x: basePoint.x + width + 20, y: basePoint.y },
                layer,
                '#475569'
            ));

            // Main Carcass Body Outline
            const bodyH = height - plinthH;
            entities.push(createRectangleEntity(
                { x: basePoint.x + width / 2, y: basePoint.y + plinthH + bodyH / 2 },
                width,
                bodyH,
                layer,
                colorMain
            ));

            // Dynamic Door Partitions (Calculates modular doors ~400 - 600mm)
            const doorCount = Math.max(1, Math.round(width / 500));
            const doorW = width / doorCount;
            const revealGap = 3; // 3mm standard furniture reveal gap

            for (let i = 0; i < doorCount; i++) {
                const doorLeft = basePoint.x + i * doorW;
                const doorCenter = doorLeft + doorW / 2;
                const doorLeafW = doorW - revealGap * 2;
                const doorLeafH = bodyH - revealGap * 2;

                // Outer door leaf rectangle
                entities.push(createRectangleEntity(
                    { x: doorCenter, y: basePoint.y + plinthH + bodyH / 2 },
                    doorLeafW,
                    doorLeafH,
                    layer,
                    colorInner
                ));

                // Shaker panel routed border if selected
                if (doorStyle === 'shaker_routed') {
                    const stileW = 60; // 60mm shaker frame stiles and rails
                    if (doorLeafW > stileW * 2 + 20 && doorLeafH > stileW * 2 + 20) {
                        entities.push(createRectangleEntity(
                            { x: doorCenter, y: basePoint.y + plinthH + bodyH / 2 },
                            doorLeafW - stileW * 2,
                            doorLeafH - stileW * 2,
                            layer,
                            '#475569'
                        ));
                    }
                }

                // Ergonomic Brushed Bar Pull Handle (Length: 160mm, Width: 14mm, Standoffs)
                const isLeftHinged = i % 2 === 0;
                const handleX = isLeftHinged ? doorLeft + doorW - 45 : doorLeft + 45;
                const handleY = basePoint.y + 1050; // Standard 1050mm ergonomic grip height

                // Main handle bar
                entities.push(createRectangleEntity(
                    { x: handleX, y: handleY },
                    14,
                    160,
                    layer,
                    colorHandle
                ));
                // Handle mounting standoffs
                entities.push(createCircleEntity({ x: handleX, y: handleY - 60 }, 5, layer, '#f59e0b'));
                entities.push(createCircleEntity({ x: handleX, y: handleY + 60 }, 5, layer, '#f59e0b'));

                // Subtle hinge location indicator ticks on hinge side (100mm from top/bottom)
                const hingeEdgeX = isLeftHinged ? doorLeft + revealGap : doorLeft + doorW - revealGap;
                const hingeTickDir = isLeftHinged ? 12 : -12;
                const hingeYTop = basePoint.y + height - 120;
                const hingeYBot = basePoint.y + plinthH + 120;

                entities.push(createLineEntity({ x: hingeEdgeX, y: hingeYTop }, { x: hingeEdgeX + hingeTickDir, y: hingeYTop }, layer, colorDashed));
                entities.push(createLineEntity({ x: hingeEdgeX, y: hingeYBot }, { x: hingeEdgeX + hingeTickDir, y: hingeYBot }, layer, colorDashed));
                if (height >= 1800) {
                    const hingeYMid = basePoint.y + (plinthH + bodyH) / 2;
                    entities.push(createLineEntity({ x: hingeEdgeX, y: hingeYMid }, { x: hingeEdgeX + hingeTickDir, y: hingeYMid }, layer, colorDashed));
                }
            }

            return entities;
        }

        // ═══════════════════════════════════════════════════════════════
        // 3. CROSS SECTION VIEW (Sistem 32 & İç Detay Kesiti)
        // ═══════════════════════════════════════════════════════════════
        // Carcass Outer Envelope
        entities.push(createRectangleEntity(
            { x: basePoint.x + width / 2, y: basePoint.y + height / 2 },
            width,
            height,
            layer,
            colorMain
        ));

        // Plinth Kick Plate & Bottom Panel
        entities.push(createLineEntity(
            { x: basePoint.x, y: basePoint.y + plinthH },
            { x: basePoint.x + width, y: basePoint.y + plinthH },
            layer,
            colorMain
        ));
        entities.push(createRectangleEntity(
            { x: basePoint.x + width / 2, y: basePoint.y + plinthH + carcaseT / 2 },
            width - carcaseT * 2,
            carcaseT,
            layer,
            colorInner
        ));

        // Left & Right Carcass Vertical Walls (18mm thick)
        entities.push(createLineEntity(
            { x: basePoint.x + carcaseT, y: basePoint.y + plinthH },
            { x: basePoint.x + carcaseT, y: basePoint.y + height },
            layer,
            colorInner
        ));
        entities.push(createLineEntity(
            { x: basePoint.x + width - carcaseT, y: basePoint.y + plinthH },
            { x: basePoint.x + width - carcaseT, y: basePoint.y + height },
            layer,
            colorInner
        ));

        // Top Carcass Roof Panel (18mm)
        entities.push(createRectangleEntity(
            { x: basePoint.x + width / 2, y: basePoint.y + height - carcaseT / 2 },
            width - carcaseT * 2,
            carcaseT,
            layer,
            colorInner
        ));

        // Vertical Center Divider (Partition) if wide (width >= 1200mm)
        const hasCenterDivider = width >= 1200;
        const centerX = basePoint.x + width / 2;
        if (hasCenterDivider) {
            entities.push(createRectangleEntity(
                { x: centerX, y: basePoint.y + plinthH + (height - plinthH) / 2 },
                carcaseT,
                height - plinthH - carcaseT * 2,
                layer,
                colorInner
            ));
        }

        // DIN 68858 System 32 Boring Hole Grid (Two vertical lines of 5mm peg holes at 32mm pitch)
        // Setback 37mm from left side and 37mm inside partition
        const gridColXs: number[] = [
            basePoint.x + carcaseT + 37,
            basePoint.x + (hasCenterDivider ? centerX - carcaseT / 2 - 37 : width - carcaseT - 37)
        ];
        if (hasCenterDivider) {
            gridColXs.push(centerX + carcaseT / 2 + 37);
            gridColXs.push(basePoint.x + width - carcaseT - 37);
        }

        const gridStartY = basePoint.y + plinthH + 150;
        const gridEndY = basePoint.y + height - 200;
        const gridStep = 32; // 32mm System 32 standard pitch

        for (const colX of gridColXs) {
            // Draw System 32 dashed axis line
            entities.push(createLineEntity(
                { x: colX, y: gridStartY - 10 },
                { x: colX, y: gridEndY + 10 },
                layer,
                '#1e293b'
            ));
            for (let y = gridStartY; y <= gridEndY; y += gridStep) {
                entities.push(createCircleEntity(
                    { x: colX, y },
                    2.5, // 5mm diameter peg hole (r=2.5mm)
                    layer,
                    colorSystem32
                ));
            }
        }

        // Top Hat Shelf (350mm below top roof)
        const hatShelfY = basePoint.y + height - 350;
        entities.push(createRectangleEntity(
            { x: basePoint.x + width / 2, y: hatShelfY },
            width - carcaseT * 2,
            carcaseT,
            layer,
            colorInner
        ));

        // Clothes Hanging Oval Rail (65mm below hat shelf)
        if (height >= 1600) {
            const rodY = hatShelfY - 65;
            entities.push(createLineEntity(
                { x: basePoint.x + carcaseT + 10, y: rodY },
                { x: basePoint.x + (hasCenterDivider ? centerX - carcaseT / 2 - 10 : width - carcaseT - 10), y: rodY },
                layer,
                colorHandle
            ));
            entities.push(createLineEntity(
                { x: basePoint.x + carcaseT + 10, y: rodY - 15 },
                { x: basePoint.x + (hasCenterDivider ? centerX - carcaseT / 2 - 10 : width - carcaseT - 10), y: rodY - 15 },
                layer,
                colorHandle
            ));

            // Clothes Hangers silhouettes on rod
            const rodW = hasCenterDivider ? (width / 2 - carcaseT - 20) : (width - carcaseT * 2 - 20);
            const hangerCount = Math.max(1, Math.floor(rodW / 120));
            for (let h = 1; h <= hangerCount; h++) {
                const hX = basePoint.x + carcaseT + 30 + h * (rodW / (hangerCount + 1));
                // Triangle hanger wire
                entities.push(createLineEntity({ x: hX, y: rodY }, { x: hX - 35, y: rodY - 70 }, layer, colorHandle));
                entities.push(createLineEntity({ x: hX, y: rodY }, { x: hX + 35, y: rodY - 70 }, layer, colorHandle));
                entities.push(createLineEntity({ x: hX - 35, y: rodY - 70 }, { x: hX + 35, y: rodY - 70 }, layer, colorHandle));
                entities.push(createCircleEntity({ x: hX, y: rodY + 8 }, 8, layer, colorHandle));
            }
        }

        // Internal Lower Drawers (Right compartment if divided, or bottom compartment)
        const drawerCompartmentLeft = hasCenterDivider ? centerX + carcaseT / 2 : basePoint.x + carcaseT;
        const drawerCompartmentW = hasCenterDivider ? (width - carcaseT - (centerX + carcaseT / 2)) : (width - carcaseT * 2);
        const drawerCount = 3;
        const drawerH = 140; // 140mm drawer box height
        const drawerStartY = basePoint.y + plinthH + carcaseT + 10;

        for (let d = 0; d < drawerCount; d++) {
            const dCenterY = drawerStartY + d * (drawerH + 15) + drawerH / 2;
            // Drawer front box
            entities.push(createRectangleEntity(
                { x: drawerCompartmentLeft + drawerCompartmentW / 2, y: dCenterY },
                drawerCompartmentW - 20,
                drawerH,
                layer,
                colorDrawer
            ));
            // Ball-bearing telescopic slide rails on both sides
            entities.push(createLineEntity(
                { x: drawerCompartmentLeft + 5, y: dCenterY },
                { x: drawerCompartmentLeft + drawerCompartmentW - 5, y: dCenterY },
                layer,
                '#64748b'
            ));
            // Drawer pull cut-out handle in center
            entities.push(createRectangleEntity(
                { x: drawerCompartmentLeft + drawerCompartmentW / 2, y: dCenterY + 35 },
                80,
                16,
                layer,
                colorHandle
            ));
        }

        // Intermediate Adjustable Shelves (Left compartment or upper section)
        const shelfSpanW = hasCenterDivider ? (centerX - carcaseT / 2 - (basePoint.x + carcaseT)) : (width - carcaseT * 2);
        const shelfCenterX = hasCenterDivider ? basePoint.x + carcaseT + shelfSpanW / 2 : basePoint.x + width / 2;
        const availH = (hatShelfY - 200) - (basePoint.y + plinthH + carcaseT);
        const shelfCount = Math.max(1, Math.floor(availH / 380));

        for (let s = 1; s <= shelfCount; s++) {
            const sY = basePoint.y + plinthH + carcaseT + s * (availH / (shelfCount + 1));
            // Shelf panel
            entities.push(createRectangleEntity(
                { x: shelfCenterX, y: sY },
                shelfSpanW - 6,
                carcaseT,
                layer,
                colorInner
            ));
            // Shelf pin support brackets on left & right
            entities.push(createRectangleEntity({ x: shelfCenterX - shelfSpanW / 2 + 6, y: sY - carcaseT / 2 - 4 }, 8, 8, layer, '#f59e0b'));
            entities.push(createRectangleEntity({ x: shelfCenterX + shelfSpanW / 2 - 6, y: sY - carcaseT / 2 - 4 }, 8, 8, layer, '#f59e0b'));
        }

        return entities;
    },
    generate3D: (params, basePos = { x: 0, y: 0, z: 0 }) => {
        const width = Number(params.width) || 1200;
        const height = Number(params.height) || 2100;
        const depth = Number(params.depth) || 600;
        const carcaseT = 18;
        const plinthH = 80;

        const parts: DynamicPart3DDef[] = [
            // Left panel
            {
                id: `cab_left_${Date.now()}`,
                name: 'Dolap Sol Yan Panel (18mm Melamin)',
                kind: 'box',
                color: '#e2e8f0',
                position: { x: basePos.x + carcaseT / 2, y: basePos.y + height / 2, z: basePos.z + depth / 2 },
                rotation: { x: 0, y: 0, z: 0 },
                params: { width: carcaseT, height: height, depth: depth }
            },
            // Right panel
            {
                id: `cab_right_${Date.now()}`,
                name: 'Dolap Sağ Yan Panel (18mm Melamin)',
                kind: 'box',
                color: '#e2e8f0',
                position: { x: basePos.x + width - carcaseT / 2, y: basePos.y + height / 2, z: basePos.z + depth / 2 },
                rotation: { x: 0, y: 0, z: 0 },
                params: { width: carcaseT, height: height, depth: depth }
            },
            // Top roof panel
            {
                id: `cab_top_${Date.now()}`,
                name: 'Dolap Üst Tabla (Tavan)',
                kind: 'box',
                color: '#e2e8f0',
                position: { x: basePos.x + width / 2, y: basePos.y + height - carcaseT / 2, z: basePos.z + depth / 2 },
                rotation: { x: 0, y: 0, z: 0 },
                params: { width: width - carcaseT * 2, height: carcaseT, depth: depth }
            },
            // Bottom shelf panel
            {
                id: `cab_bottom_${Date.now()}`,
                name: 'Dolap Alt Tabla (Taban)',
                kind: 'box',
                color: '#e2e8f0',
                position: { x: basePos.x + width / 2, y: basePos.y + plinthH + carcaseT / 2, z: basePos.z + depth / 2 },
                rotation: { x: 0, y: 0, z: 0 },
                params: { width: width - carcaseT * 2, height: carcaseT, depth: depth }
            },
            // Recessed plinth kickboard
            {
                id: `cab_plinth_${Date.now()}`,
                name: 'Dolap Baza Süpürgeliği (80mm)',
                kind: 'box',
                color: '#475569',
                position: { x: basePos.x + width / 2, y: basePos.y + plinthH / 2, z: basePos.z + depth - 40 },
                rotation: { x: 0, y: 0, z: 0 },
                params: { width: width - carcaseT * 2, height: plinthH, depth: carcaseT }
            },
            // HDF Backboard panel
            {
                id: `cab_back_${Date.now()}`,
                name: 'Dolap Arkalık (HDF 4mm Kanallı)',
                kind: 'box',
                color: '#cbd5e1',
                position: { x: basePos.x + width / 2, y: basePos.y + plinthH + (height - plinthH) / 2, z: basePos.z + 15 },
                rotation: { x: 0, y: 0, z: 0 },
                params: { width: width - carcaseT * 2 + 16, height: height - plinthH - carcaseT, depth: 4 }
            }
        ];

        // Center partition for cabinets width >= 1200mm
        if (width >= 1200) {
            parts.push({
                id: `cab_divider_${Date.now()}`,
                name: 'Dolap Orta Dikme Bölme Paneli',
                kind: 'box',
                color: '#e2e8f0',
                position: { x: basePos.x + width / 2, y: basePos.y + plinthH + (height - plinthH) / 2, z: basePos.z + depth / 2 },
                rotation: { x: 0, y: 0, z: 0 },
                params: { width: carcaseT, height: height - plinthH - carcaseT * 2, depth: depth - 20 }
            });
        }

        // Add Door leaves & Metallic Bar Handles
        const doorCount = Math.max(1, Math.round(width / 500));
        const doorW = width / doorCount;
        const bodyH = height - plinthH;

        for (let i = 0; i < doorCount; i++) {
            const isLeftHinged = i % 2 === 0;
            const doorCenterX = basePos.x + i * doorW + doorW / 2;
            const doorCenterY = basePos.y + plinthH + bodyH / 2;
            const doorCenterZ = basePos.z + depth + carcaseT / 2 + 2;

            // Door Leaf
            parts.push({
                id: `cab_door_${i + 1}_${Date.now()}`,
                name: `Dolap Kapağı ${i + 1}`,
                kind: 'box',
                color: '#38bdf8', // Modern satin sky blue lacquered finish
                position: { x: doorCenterX, y: doorCenterY, z: doorCenterZ },
                rotation: { x: 0, y: 0, z: 0 },
                params: { width: doorW - 4, height: bodyH - 4, depth: carcaseT }
            });

            // Handle
            const handleX = isLeftHinged ? basePos.x + (i + 1) * doorW - 45 : basePos.x + i * doorW + 45;
            parts.push({
                id: `cab_handle_${i + 1}_${Date.now()}`,
                name: `Krom Bar Kulp ${i + 1}`,
                kind: 'cylinder',
                color: '#f59e0b',
                position: { x: handleX, y: basePos.y + 1050, z: doorCenterZ + carcaseT / 2 + 15 },
                rotation: { x: 0, y: 0, z: 0 },
                params: { diameter: 14, length: 160 }
            });
        }

        return parts;
    },
    getGrips: (params, basePoint = { x: 0, y: 0 }) => {
        const width = Number(params.width) || 1200;
        const height = Number(params.height) || 2100;

        const grips: DynamicGrip[] = [
            // Linear Stretch Width Grip
            {
                id: 'grip_cab_width',
                type: 'stretch',
                paramId: 'width',
                position: { x: basePoint.x + width, y: basePoint.y + height / 2 },
                direction: { x: 1, y: 0 },
                tooltip: `Grip: Dolap Genişliği (${width} mm)`,
                tooltipTr: `Grip: Dolap Genişliği (${width} mm)`
            },
            // Linear Stretch Height Grip
            {
                id: 'grip_cab_height',
                type: 'stretch',
                paramId: 'height',
                position: { x: basePoint.x + width / 2, y: basePoint.y + height },
                direction: { x: 0, y: 1 },
                tooltip: `Grip: Dolap Yüksekliği (${height} mm)`,
                tooltipTr: `Grip: Dolap Yüksekliği (${height} mm)`
            },
            // Visibility State Flip Grip
            {
                id: 'grip_cab_vis',
                type: 'visibility',
                paramId: 'visState',
                position: { x: basePoint.x - 40, y: basePoint.y - 40 },
                tooltip: 'Görünüş Değiştir (Ön Cephe / Kesit Sistem 32 / Plan)',
                tooltipTr: 'Görünüş Değiştir (Ön Cephe / Kesit Sistem 32 / Plan)'
            }
        ];

        return grips;
    }
};

