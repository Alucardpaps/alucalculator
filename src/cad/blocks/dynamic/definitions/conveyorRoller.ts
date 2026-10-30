/**
 * 🧱 Dynamic Conveyor Roller & Drive Drum (DIN 15207 / FEM 2.131 / Interroll Series 1700 & 3500)
 *
 * - Lookup Catalog: Ø50, Ø60, Ø89, Ø108, Ø133, Ø159 mm Industrial Conveyor Rollers
 * - Linear Params: Roller Face Length (EL: 200–2000 mm), Sprocket Offset
 * - Visibility States:
 *    - Axial Cross-Section (Boyuna Kesit — Çelik Boru, 6204/6205 Rulman Yatakları, Labirent Keçe, 08B-2 Dişli ve ISO 128 Tarama)
 *    - Exterior Top View (Dış Görünüş — Zincir Dişli Tahrikli veya Avare Rulo)
 *    - Side End Profile (Alın Görünüşü — Altıgen/Dişli Mil Ucu ve Rulo Çapı)
 * - 3D Solids: Steel drum shell + stepped shaft + bearing housings + dual chain sprocket
 */

import {
    CadEntity,
    createLineEntity,
    createRectangleEntity,
    createCircleEntity,
    createHatchEntity
} from '../../../kernel/types';
import { DynamicBlockDef, DynamicGrip, DynamicPart3DDef } from '../types';

export interface ConveyorRollerSpec {
    code: string;
    D: number;         // Roller outer diameter (mm)
    wallT: number;     // Tube wall thickness (mm)
    shaftD: number;    // Shaft diameter (mm)
    bearingCode: string;
    bearingOD: number; // Bearing outer diameter (mm)
    bearingB: number;  // Bearing width (mm)
    sprocketOD: number;// 08B-2 chain sprocket OD (mm)
    loadCapKg: number;
}

export const CONVEYOR_ROLLER_CATALOG: Record<string, ConveyorRollerSpec> = {
    R50x1_5:  { code: 'R50x1_5',  D: 50,  wallT: 1.5, shaftD: 12, bearingCode: '6002-2RS', bearingOD: 32, bearingB: 9,  sprocketOD: 62,  loadCapKg: 120 },
    R60x2_0:  { code: 'R60x2_0',  D: 60,  wallT: 2.0, shaftD: 15, bearingCode: '6202-2RS', bearingOD: 35, bearingB: 11, sprocketOD: 71,  loadCapKg: 200 },
    R89x3_0:  { code: 'R89x3_0',  D: 89,  wallT: 3.0, shaftD: 20, bearingCode: '6204-2RS', bearingOD: 47, bearingB: 14, sprocketOD: 89,  loadCapKg: 450 },
    R108x3_6: { code: 'R108x3_6', D: 108, wallT: 3.6, shaftD: 25, bearingCode: '6205-2RS', bearingOD: 52, bearingB: 15, sprocketOD: 105, loadCapKg: 750 },
    R133x4_0: { code: 'R133x4_0', D: 133, wallT: 4.0, shaftD: 30, bearingCode: '6206-2RS', bearingOD: 62, bearingB: 16, sprocketOD: 122, loadCapKg: 1200 },
    R159x4_5: { code: 'R159x4_5', D: 159, wallT: 4.5, shaftD: 40, bearingCode: '6208-2RS', bearingOD: 80, bearingB: 18, sprocketOD: 146, loadCapKg: 1850 }
};

export const DYN_CONVEYOR_ROLLER: DynamicBlockDef = {
    id: 'dyn_conveyor_roller',
    name: 'Conveyor Roller & Chain Drive Drum (DIN 15207 / FEM 2.131)',
    nameTr: 'Dinamik Konveyör Rulosu & Zincir Tahrik Tamburu (DIN 15207)',
    category: 'Mechanical',
    subcategory: 'Material Handling & Conveyors',
    subcategoryTr: 'Konveyör ve Taşıma Sistemleri',
    description: 'DIN 15207 / FEM 2.131 heavy-duty conveyor roller and 08B-2 chain-driven drum with precision ball bearings, labyrinth seals, stretchable roller length, and ISO 128 cross-section.',
    descriptionTr: 'DIN 15207 normunda rulman yataklı, labirent keçeli ve 08B-2 çift sıra zincir dişli tahrikli konveyör rulosu; boyuna kesit (HATCH), üst görünüş ve alın görünüşü.',
    icon: '🛞',
    calculatorRoute: '/chain-drive/',
    calculatorModuleType: 'chain-drive',
    calculatorLabelTr: 'Zincir Tahrik ve Konveyör Hesabına Git (ISO 606)',
    citation: {
        tier: 1,
        standard: 'DIN 15207-1 / FEM 2.131 / ISO 1537',
        clause: 'Idler and drive rollers for belt and unit load conveyors — Main dimensions',
        description: 'Standard tube diameters Ø50–Ø159 mm, precision bearing housings, and 08B duplex chain drive heads.'
    },
    linearParams: [
        {
            id: 'rollerLength',
            name: 'rollerLength',
            label: 'Roller Shell Length (EL)',
            labelTr: 'Rulo Boru Boyu (EL)',
            min: 200,
            max: 2000,
            step: 50,
            default: 500,
            unit: 'mm',
            axis: 'x'
        }
    ],
    flipParams: [
        {
            id: 'flipDrive',
            name: 'flipDrive',
            label: 'Flip Sprocket Side',
            labelTr: 'Tahrik Dişlisi Yönünü Çevir',
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
            { id: 'axial_section', label: 'Axial Cross-Section (Boyuna Kesit — Rulman & Keçe Detaylı)', labelTr: 'Boyuna Kesit (Rulman, Boru & Zincir Dişli — ISO 128 HATCH)' },
            { id: 'exterior_top', label: 'Exterior Top View (Dış Görünüş — Tahrikli Rulo)', labelTr: 'Dış Üst Görünüş (Tahrik Dişlili Konveyör Rulosu)' },
            { id: 'side_profile', label: 'End Side View (Alın Görünüşü — Mil & Rulo Çapı)', labelTr: 'Alın Görünüşü (Mil Ucu & Rulo Kesiti)' }
        ],
        default: 'axial_section'
    },
    lookupParams: [
        {
            id: 'rollerModel',
            name: 'rollerModel',
            label: 'Standard Roller Series (DIN 15207)',
            labelTr: 'Standart Rulo Serisi (DIN 15207)',
            options: Object.values(CONVEYOR_ROLLER_CATALOG).map((r) => ({
                id: r.code,
                label: `${r.code} (Ø${r.D}×${r.wallT}mm — Mil Ø${r.shaftD}mm, Rulman ${r.bearingCode}, Kapasite: ${r.loadCapKg} kg)`,
                standard: 'DIN 15207',
                values: { rollerModel: r.code }
            })),
            default: 'R89x3_0'
        }
    ],
    defaultValues: {
        rollerModel: 'R89x3_0',
        rollerLength: 500,
        flipDrive: false,
        viewMode: 'axial_section'
    },
    generate2D: (params, basePoint = { x: 0, y: 0 }) => {
        const modelKey = String(params.rollerModel || 'R89x3_0');
        const spec = CONVEYOR_ROLLER_CATALOG[modelKey] || CONVEYOR_ROLLER_CATALOG.R89x3_0;
        const EL = Math.max(200, Math.min(2000, Number(params.rollerLength) || 500));
        const flip = Boolean(params.flipDrive);
        const viewMode = String(params.viewMode || 'axial_section');

        const { D, wallT, shaftD, bearingOD, bearingB, sprocketOD } = spec;
        const R = D / 2;
        const innerR = R - wallT;
        const rShaft = shaftD / 2;

        const entities: CadEntity[] = [];
        const layerShell = 'layer-mech';
        const layerBearing = 'layer-accent';
        const layerRef = 'layer-ref';

        const cx = basePoint.x;
        const cy = basePoint.y;

        if (viewMode === 'side_profile') {
            // End Profile View centered at (cx, cy)
            entities.push(
                createLineEntity({ x: cx - R - 18, y: cy }, { x: cx + R + 18, y: cy }, layerRef, '#ef4444'),
                createLineEntity({ x: cx, y: cy - R - 18 }, { x: cx, y: cy + R + 18 }, layerRef, '#ef4444'),
                createCircleEntity({ x: cx, y: cy }, sprocketOD / 2, layerBearing, '#f59e0b'),
                createCircleEntity({ x: cx, y: cy }, R, layerShell, '#38bdf8'),
                createCircleEntity({ x: cx, y: cy }, innerR, layerShell, '#0284c7'),
                createCircleEntity({ x: cx, y: cy }, bearingOD / 2, layerBearing, '#22c55e'),
                createCircleEntity({ x: cx, y: cy }, rShaft, layerShell, '#f8fafc'),
                // Internal M10/M12 female thread circle
                createCircleEntity({ x: cx, y: cy }, rShaft * 0.55, layerRef, '#eab308')
            );
            return entities;
        }

        const dir = flip ? -1 : 1;
        const sprocketHeadW = 46;
        const shaftExt = 22;

        // Centerline Axis
        entities.push(
            createLineEntity(
                { x: cx - shaftExt - 20, y: cy },
                { x: cx + dir * (EL + shaftExt + 20), y: cy },
                layerRef,
                '#ef4444'
            )
        );

        // Through-Shaft Left & Right Extensions
        const totalShaftLen = EL + shaftExt * 2;
        entities.push(
            createRectangleEntity(
                { x: cx + dir * (EL / 2), y: cy },
                totalShaftLen,
                shaftD,
                layerShell,
                '#94a3b8'
            )
        );

        // Main Steel Tube Outer Boundaries
        entities.push(
            createRectangleEntity(
                { x: cx + dir * (EL / 2), y: cy },
                EL,
                D,
                layerShell,
                '#38bdf8'
            )
        );

        // Duplex 08B-2 Chain Sprocket Head on Drive End
        const spX = cx + dir * (sprocketHeadW / 2);
        const toothW = 9;
        entities.push(
            createRectangleEntity({ x: spX, y: cy }, sprocketHeadW, D * 0.86, layerBearing, '#f59e0b'),
            createRectangleEntity({ x: cx + dir * 14, y: cy }, toothW, sprocketOD, layerBearing, '#eab308'),
            createRectangleEntity({ x: cx + dir * 30, y: cy }, toothW, sprocketOD, layerBearing, '#eab308')
        );

        if (viewMode === 'exterior_top') {
            // Exterior top view with knurled/grooved traction rings
            const grooveCount = Math.max(2, Math.floor((EL - sprocketHeadW - 40) / 90));
            for (let i = 1; i <= grooveCount; i++) {
                const gx = cx + dir * (sprocketHeadW + i * 80);
                if (Math.abs(gx - cx) < EL - 25) {
                    entities.push(
                        createLineEntity({ x: gx, y: cy - R }, { x: gx, y: cy + R }, layerRef, '#64748b')
                    );
                }
            }
            return entities;
        }

        // Axial Cross-Section Mode (ISO 128 HATCH)
        const tubeStartX = cx;
        const tubeEndX = cx + dir * EL;
        const xMin = Math.min(tubeStartX, tubeEndX);
        const xMax = Math.max(tubeStartX, tubeEndX);

        // Top & Bottom Tube Wall Cross-Sections with ISO 128 Steel Hatch
        entities.push(
            createRectangleEntity({ x: (xMin + xMax) / 2, y: cy + (R + innerR) / 2 }, EL, wallT, layerShell, '#38bdf8'),
            createRectangleEntity({ x: (xMin + xMax) / 2, y: cy - (R + innerR) / 2 }, EL, wallT, layerShell, '#38bdf8'),
            createHatchEntity([
                { x: xMin, y: cy + innerR },
                { x: xMax, y: cy + innerR },
                { x: xMax, y: cy + R },
                { x: xMin, y: cy + R }
            ], 'ANSI31', layerShell, '#0284c7'),
            createHatchEntity([
                { x: xMin, y: cy - R },
                { x: xMax, y: cy - R },
                { x: xMax, y: cy - innerR },
                { x: xMin, y: cy - innerR }
            ], 'ANSI31', layerShell, '#0284c7')
        );

        // Pressed Steel Bearing Cups & Deep-Groove Ball Bearings at Both Ends
        const endPositions = [xMin + bearingB * 0.9, xMax - bearingB * 0.9];
        for (const bx of endPositions) {
            const rBrgOut = bearingOD / 2;
            // Bearing cup between tube inner wall and bearing OD
            entities.push(
                createRectangleEntity({ x: bx, y: cy + (innerR + rBrgOut) / 2 }, bearingB * 1.4, innerR - rBrgOut, layerBearing, '#64748b'),
                createRectangleEntity({ x: bx, y: cy - (innerR + rBrgOut) / 2 }, bearingB * 1.4, innerR - rBrgOut, layerBearing, '#64748b'),
                // Bearing ring & ball circle
                createRectangleEntity({ x: bx, y: cy + (rBrgOut + rShaft) / 2 }, bearingB, rBrgOut - rShaft, layerBearing, '#f59e0b'),
                createRectangleEntity({ x: bx, y: cy - (rBrgOut + rShaft) / 2 }, bearingB, rBrgOut - rShaft, layerBearing, '#f59e0b'),
                createCircleEntity({ x: bx, y: cy + (rBrgOut + rShaft) / 2 }, (rBrgOut - rShaft) * 0.34, layerRef, '#f8fafc'),
                createCircleEntity({ x: bx, y: cy - (rBrgOut + rShaft) / 2 }, (rBrgOut - rShaft) * 0.34, layerRef, '#f8fafc')
            );
        }

        // Solid Stepped Shaft Hatch
        entities.push(
            createHatchEntity([
                { x: xMin - shaftExt, y: cy - rShaft },
                { x: xMax + shaftExt, y: cy - rShaft },
                { x: xMax + shaftExt, y: cy + rShaft },
                { x: xMin - shaftExt, y: cy + rShaft }
            ], 'ANSI31', layerShell, '#475569')
        );

        return entities;
    },
    generate3D: (params, basePos = { x: 0, y: 0, z: 0 }) => {
        const modelKey = String(params.rollerModel || 'R89x3_0');
        const spec = CONVEYOR_ROLLER_CATALOG[modelKey] || CONVEYOR_ROLLER_CATALOG.R89x3_0;
        const EL = Math.max(200, Math.min(2000, Number(params.rollerLength) || 500));
        const { D, shaftD, sprocketOD } = spec;

        return [
            {
                id: 'roller-shell',
                name: `Conveyor Drum Shell Ø${D}×${EL}mm`,
                kind: 'cylinder',
                color: '#94a3b8',
                position: { x: basePos.x + EL / 2, y: basePos.y + D / 2, z: basePos.z },
                rotation: { x: 0, y: 0, z: Math.PI / 2 },
                params: { diameter: D, length: EL }
            },
            {
                id: 'roller-shaft',
                name: `Roller Axle Shaft Ø${shaftD}mm`,
                kind: 'cylinder',
                color: '#475569',
                position: { x: basePos.x + EL / 2, y: basePos.y + D / 2, z: basePos.z },
                rotation: { x: 0, y: 0, z: Math.PI / 2 },
                params: { diameter: shaftD, length: EL + 44 }
            },
            {
                id: 'roller-sprocket-1',
                name: `08B-2 Drive Sprocket Ø${sprocketOD}mm`,
                kind: 'cylinder',
                color: '#f59e0b',
                position: { x: basePos.x + 20, y: basePos.y + D / 2, z: basePos.z },
                rotation: { x: 0, y: 0, z: Math.PI / 2 },
                params: { diameter: sprocketOD, length: 18 }
            }
        ];
    },
    getGrips: (params, basePoint = { x: 0, y: 0 }): DynamicGrip[] => {
        const EL = Math.max(200, Math.min(2000, Number(params.rollerLength) || 500));
        const flip = Boolean(params.flipDrive);
        const dir = flip ? -1 : 1;
        return [
            {
                id: 'grip-origin',
                type: 'point',
                paramId: 'basePoint',
                position: { x: basePoint.x, y: basePoint.y },
                tooltip: 'Move Conveyor Roller',
                tooltipTr: 'Konveyör Rulosunu Taşı'
            },
            {
                id: 'grip-roller-length',
                type: 'linear',
                paramId: 'rollerLength',
                position: { x: basePoint.x + dir * EL, y: basePoint.y },
                direction: { x: dir, y: 0 },
                label: `EL=${EL}mm`,
                labelTr: `Rulo Boyu EL=${EL}mm`
            },
            {
                id: 'grip-flip-drive',
                type: 'flip',
                paramId: 'flipDrive',
                position: { x: basePoint.x + dir * 25, y: basePoint.y + 55 },
                label: 'Flip Drive',
                labelTr: 'Dişli Yönünü Çevir'
            }
        ];
    }
};
