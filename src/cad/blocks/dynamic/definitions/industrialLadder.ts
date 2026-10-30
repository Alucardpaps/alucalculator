/**
 * 🪜 Dynamic Industrial Safety Caged Ladder (DIN EN ISO 14122-4)
 * 
 * Mechanical & Plant Safety Dynamic Block:
 * - Deterministic DIN EN ISO 14122-4 safety regulations:
 *   - Safety cage mandatory for heights > 3000 mm
 *   - Cage starts between 2200 mm and 3000 mm above ground
 *   - Rung spacing: 225 mm - 300 mm (ISO standard)
 *   - Clear ladder width: 400 mm - 600 mm
 * - Visibility: Plan View (Cage Hoop & Rung), Front Elevation, Side Elevation with Wall Brackets
 */

import { Point, CadEntity, createLineEntity, createRectangleEntity, createArcEntity } from '../../../kernel/types';
import { DynamicBlockDef, DynamicGrip, DynamicPart3DDef } from '../types';

export const DYN_INDUSTRIAL_LADDER: DynamicBlockDef = {
    id: 'dyn_industrial_ladder',
    name: 'Dynamic Industrial Caged Ladder (ISO 14122-4)',
    nameTr: 'Dinamik Kafesli Emniyet Merdiveni (ISO 14122-4)',
    category: 'Mechanical',
    subcategory: 'Safety & Access Platforms',
    subcategoryTr: 'İş Güvenliği ve Erişim Platformları',
    description: 'AutoCAD-grade parametric industrial safety ladder with fall-protection cage according to DIN EN ISO 14122-4.',
    descriptionTr: 'DIN EN ISO 14122-4 normuna uygun düşme koruma kafesli, otomatik basamak dizilimli dinamik emniyet merdiveni.',
    icon: '🪜',
    citation: {
        tier: 1,
        standard: 'DIN EN ISO 14122-4',
        clause: 'Safety of machinery - Permanent means of access to machinery - Part 4: Fixed ladders',
        description: 'Mandatory cage hoop diameter (650-800mm), 250-300mm rung spacing, and wall standoff clearance >= 200mm.'
    },
    linearParams: [
        {
            id: 'totalHeight',
            name: 'totalHeight',
            label: 'Total Climb Height',
            labelTr: 'Toplam Tırmanma Yüksekliği',
            min: 2500,
            max: 12000,
            step: 250,
            default: 6000,
            unit: 'mm',
            axis: 'y'
        },
        {
            id: 'ladderWidth',
            name: 'ladderWidth',
            label: 'Clear Ladder Width',
            labelTr: 'Merdiven Basamak Genişliği',
            min: 400,
            max: 600,
            step: 50,
            default: 500,
            unit: 'mm',
            axis: 'x'
        },
        {
            id: 'cageStartHeight',
            name: 'cageStartHeight',
            label: 'Cage Start Height (ISO: 2200-3000mm)',
            labelTr: 'Kafes Başlangıç Kotu',
            min: 2200,
            max: 3000,
            step: 100,
            default: 2500,
            unit: 'mm',
            axis: 'y'
        },
        {
            id: 'wallStandoff',
            name: 'wallStandoff',
            label: 'Wall Standoff Distance',
            labelTr: 'Duvar Ankraj Mesafesi',
            min: 200,
            max: 400,
            step: 25,
            default: 250,
            unit: 'mm',
            axis: 'y'
        }
    ],
    flipParams: [
        {
            id: 'flipExitGate',
            name: 'flipExitGate',
            label: 'Top Exit Flange (Straight / Side)',
            labelTr: 'Üst Çıkış Flanşı (Düz / Yan)',
            axis: 'horizontal',
            default: false
        }
    ],
    visibilityParam: {
        id: 'visState',
        name: 'visState',
        label: 'View Type',
        labelTr: 'Görünüm Durumu',
        states: [
            { id: 'plan', label: 'Plan View (Cage Hoop & Stile)', labelTr: 'Plan Görünüşü (Kafes Çemberi ve Basamak)' },
            { id: 'elevation_front', label: 'Front Elevation (Rungs & Hoops)', labelTr: 'Ön Görünüş (Basamaklar ve Çemberler)' },
            { id: 'elevation_side', label: 'Side Elevation (Wall Brackets)', labelTr: 'Yan Görünüş (Duvar Ankrajları)' }
        ],
        default: 'elevation_front'
    },
    lookupParams: [
        {
            id: 'standardLadder',
            name: 'standardLadder',
            label: 'Standard Machinery Access Heights',
            labelTr: 'Standart Tesis Yükseklikleri',
            options: [
                { id: 'ladder_4m', label: '4.0m Tank / Silo Tırmanma (Kafesli)', standard: 'ISO 14122-4', values: { totalHeight: 4000, cageStartHeight: 2400, ladderWidth: 500, visState: 'elevation_front' } },
                { id: 'ladder_6m', label: '6.0m Fabrika Çatı Çıkışı (ISO 14122-4)', standard: 'ISO 14122-4', values: { totalHeight: 6000, cageStartHeight: 2500, ladderWidth: 500, visState: 'elevation_front' } },
                { id: 'ladder_8m', label: '8.0m Endüstriyel Tesis Merdiveni', standard: 'ISO 14122-4', values: { totalHeight: 8000, cageStartHeight: 2500, ladderWidth: 500, visState: 'elevation_side' } }
            ]
        }
    ],
    defaultValues: {
        totalHeight: 6000,
        ladderWidth: 500,
        cageStartHeight: 2500,
        wallStandoff: 250,
        flipExitGate: false,
        visState: 'elevation_front'
    },
    generate2D: (params: Record<string, any>, basePoint: Point = { x: 0, y: 0 }): CadEntity[] => {
        const entities: CadEntity[] = [];
        const height = Number(params.totalHeight || 6000);
        const width = Number(params.ladderWidth || 500);
        const cageStart = Number(params.cageStartHeight || 2500);
        const standoff = Number(params.wallStandoff || 250);
        const visState = String(params.visState || 'elevation_front');

        const rungSpacing = 280; // 280mm ISO rung spacing
        const numRungs = Math.floor(height / rungSpacing);

        if (visState === 'plan') {
            // Plan View: Wall line, 2 Standoff brackets, 2 Ladder Stiles, Rung, Circular Safety Cage Hoop (D=700mm)
            // Wall line
            entities.push(createLineEntity(
                { x: basePoint.x - 500, y: basePoint.y },
                { x: basePoint.x + 500, y: basePoint.y },
                '#64748b'
            ));

            // Standoff brackets
            entities.push(createLineEntity(
                { x: basePoint.x - width / 2, y: basePoint.y },
                { x: basePoint.x - width / 2, y: basePoint.y + standoff },
                '#38bdf8'
            ));
            entities.push(createLineEntity(
                { x: basePoint.x + width / 2, y: basePoint.y },
                { x: basePoint.x + width / 2, y: basePoint.y + standoff },
                '#38bdf8'
            ));

            // Stiles
            entities.push(createRectangleEntity(
                { x: basePoint.x - width / 2, y: basePoint.y + standoff },
                40,
                20,
                0,
                '#00e5ff'
            ));
            entities.push(createRectangleEntity(
                { x: basePoint.x + width / 2, y: basePoint.y + standoff },
                40,
                20,
                0,
                '#00e5ff'
            ));

            // Rung
            entities.push(createLineEntity(
                { x: basePoint.x - width / 2, y: basePoint.y + standoff },
                { x: basePoint.x + width / 2, y: basePoint.y + standoff },
                '#f59e0b'
            ));

            // Safety Cage Horseshoe Arch (D=700mm, center at standoff + 350)
            const cageCenter = { x: basePoint.x, y: basePoint.y + standoff + 350 };
            entities.push(createArcEntity(cageCenter, 350, 0, Math.PI * 2, '#ec4899'));

            // Vertical cage straps
            for (let a = 0; a < 5; a++) {
                const ang = Math.PI * 0.25 + a * (Math.PI * 0.5 / 4);
                entities.push(createArcEntity(
                    { x: cageCenter.x + Math.cos(ang) * 350, y: cageCenter.y + Math.sin(ang) * 350 },
                    10,
                    0,
                    Math.PI * 2,
                    '#f43f5e'
                ));
            }
            return entities;
        }

        if (visState === 'elevation_side') {
            // Side Elevation View: Ground line, Stile, Wall brackets (every 2m), Cage profile
            // Ground
            entities.push(createLineEntity(
                { x: basePoint.x - 100, y: basePoint.y },
                { x: basePoint.x + standoff + 800, y: basePoint.y },
                '#64748b'
            ));

            // Wall line
            entities.push(createLineEntity(
                { x: basePoint.x, y: basePoint.y },
                { x: basePoint.x, y: basePoint.y + height + 500 },
                '#334155'
            ));

            // Stile (Vertical)
            entities.push(createLineEntity(
                { x: basePoint.x + standoff, y: basePoint.y },
                { x: basePoint.x + standoff, y: basePoint.y + height },
                '#00e5ff'
            ));

            // Wall Brackets (Every 2000mm)
            for (let y = 1000; y < height; y += 2000) {
                entities.push(createLineEntity(
                    { x: basePoint.x, y: basePoint.y + y },
                    { x: basePoint.x + standoff, y: basePoint.y + y },
                    '#38bdf8'
                ));
            }

            // Cage Profile (Starts at cageStartHeight, extends to height + 1100mm)
            entities.push(createLineEntity(
                { x: basePoint.x + standoff + 700, y: basePoint.y + cageStart },
                { x: basePoint.x + standoff + 700, y: basePoint.y + height + 1100 },
                '#ec4899'
            ));

            // Cage Horizontal Hoops
            for (let y = cageStart; y <= height + 1000; y += 1200) {
                entities.push(createLineEntity(
                    { x: basePoint.x + standoff, y: basePoint.y + y },
                    { x: basePoint.x + standoff + 700, y: basePoint.y + y },
                    '#f43f5e'
                ));
            }

            return entities;
        }

        // Front Elevation View
        // Ground line
        entities.push(createLineEntity(
            { x: basePoint.x - width, y: basePoint.y },
            { x: basePoint.x + width * 2, y: basePoint.y },
            '#64748b'
        ));

        // 2 Main Vertical Stiles
        entities.push(createRectangleEntity(
            { x: basePoint.x - width / 2, y: basePoint.y + height / 2 },
            30,
            height,
            0,
            '#00e5ff'
        ));
        entities.push(createRectangleEntity(
            { x: basePoint.x + width / 2, y: basePoint.y + height / 2 },
            30,
            height,
            0,
            '#00e5ff'
        ));

        // Rungs
        for (let i = 1; i <= numRungs; i++) {
            const ry = basePoint.y + i * rungSpacing;
            if (ry < basePoint.y + height) {
                entities.push(createRectangleEntity(
                    { x: basePoint.x, y: ry },
                    width,
                    20,
                    0,
                    '#38bdf8'
                ));
            }
        }

        // Cage Hoops (Hoop diameter ~ 700mm)
        for (let cy = cageStart; cy <= height + 1000; cy += 1200) {
            entities.push(createArcEntity(
                { x: basePoint.x, y: basePoint.y + cy },
                350,
                0,
                Math.PI,
                '#ec4899'
            ));
        }

        // Vertical Cage Straps
        for (let s = -2; s <= 2; s++) {
            const sx = basePoint.x + s * 140;
            entities.push(createLineEntity(
                { x: sx, y: basePoint.y + cageStart },
                { x: sx, y: basePoint.y + height + 1000 },
                '#f43f5e'
            ));
        }

        return entities;
    },
    getGrips: (params: Record<string, any>, basePoint: Point): DynamicGrip[] => {
        const height = Number(params.totalHeight || 6000);
        const width = Number(params.ladderWidth || 500);

        return [
            {
                id: 'grip_origin',
                type: 'point',
                position: basePoint,
                paramId: 'origin',
                label: 'Merdiven Taban Ankrajı'
            },
            {
                id: 'grip_height',
                type: 'linear',
                position: { x: basePoint.x, y: basePoint.y + height },
                direction: { x: 0, y: 1 },
                paramId: 'totalHeight',
                label: 'Tırmanma Yüksekliğini Esnet'
            },
            {
                id: 'grip_width',
                type: 'linear',
                position: { x: basePoint.x + width / 2, y: basePoint.y + 1500 },
                direction: { x: 1, y: 0 },
                paramId: 'ladderWidth',
                label: 'Merdiven Genişliği'
            },
            {
                id: 'grip_flip',
                type: 'flip',
                position: { x: basePoint.x - width / 2 - 60, y: basePoint.y + 2000 },
                paramId: 'flipExitGate',
                label: 'Çıkış Flanş Yönü'
            },
            {
                id: 'grip_vis',
                type: 'visibility',
                position: { x: basePoint.x + width / 2 + 60, y: basePoint.y + 2000 },
                paramId: 'visState',
                label: 'Ön Cephe / Yan Ankraj / Plan'
            }
        ];
    },
    generate3D: (params: Record<string, any>, basePos = { x: 0, y: 0, z: 0 }): DynamicPart3DDef[] => {
        const height = Number(params.totalHeight || 6000) / 1000;
        const width = Number(params.ladderWidth || 500) / 1000;

        const parts: DynamicPart3DDef[] = [
            // Left Stile
            {
                name: 'Ladder_Stile_L',
                shape: 'cylinder',
                dimensions: { radius: 0.02, height },
                position: { x: basePos.x - width / 2, y: basePos.y + height / 2, z: basePos.z },
                color: '#f59e0b',
                materialType: 'aluminum_anodized'
            },
            // Right Stile
            {
                name: 'Ladder_Stile_R',
                shape: 'cylinder',
                dimensions: { radius: 0.02, height },
                position: { x: basePos.x + width / 2, y: basePos.y + height / 2, z: basePos.z },
                color: '#f59e0b',
                materialType: 'aluminum_anodized'
            }
        ];

        // Rungs
        const rungSpacing = 0.28;
        const count = Math.floor(height / rungSpacing);
        for (let i = 1; i <= count; i++) {
            parts.push({
                name: `Ladder_Rung_${i}`,
                shape: 'cylinder',
                dimensions: { radius: 0.012, height: width },
                position: { x: basePos.x, y: basePos.y + i * rungSpacing, z: basePos.z },
                color: '#cbd5e1',
                materialType: 'stainless_316'
            });
        }

        return parts;
    }
};
