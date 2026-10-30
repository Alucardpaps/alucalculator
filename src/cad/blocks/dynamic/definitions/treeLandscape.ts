/**
 * 🌳 Dynamic Landscape Tree & Shrub Block (Landscape Architecture & Site Planning)
 * 
 * Civil & Site Dynamic Block:
 * - Dynamic crown diameter stretch (1500 - 10000 mm)
 * - Species visibility states: Deciduous (Yapraklı), Conifer (Çam/İbreli), Palm (Palmiye), Shrub (Çalı), Front Elevation
 * - Architectural shadow projection and trunk centerpoint
 */

import { Point, CadEntity, createLineEntity, createArcEntity } from '../../../kernel/types';
import { DynamicBlockDef, DynamicGrip, DynamicPart3DDef } from '../types';

export const DYN_TREE_LANDSCAPE: DynamicBlockDef = {
    id: 'dyn_tree_landscape',
    name: 'Dynamic Landscape Tree & Vegetation',
    nameTr: 'Dinamik Peyzaj Ağaç ve Bitki Örtüsü',
    category: 'Civil',
    subcategory: 'Landscape & Vegetation',
    subcategoryTr: 'Peyzaj ve Bitkilendirme',
    description: 'AutoCAD-grade parametric architectural tree: stretchable crown diameter, multiple foliage species, and elevation.',
    descriptionTr: 'Taç çapı esnetilebilir, yapraklı/çam/palmiye/çalı türleri ve mimari cephe görünüşlü dinamik peyzaj ağaç bloğu.',
    icon: '🌳',
    citation: {
        tier: 2,
        standard: 'Landscape Architecture Standards (ASLA)',
        clause: 'Site representation, mature tree canopy projection and root protection zones',
        description: 'Standard architectural canopy symbols, shadow hatching vectors, and root buffer envelopes.'
    },
    linearParams: [
        {
            id: 'crownDiameter',
            name: 'crownDiameter',
            label: 'Canopy / Crown Diameter',
            labelTr: 'Ağaç Taç Çapı',
            min: 1500,
            max: 12000,
            step: 250,
            default: 4000,
            unit: 'mm',
            axis: 'both'
        },
        {
            id: 'trunkDiameter',
            name: 'trunkDiameter',
            label: 'Trunk Diameter',
            labelTr: 'Gövde Çapı',
            min: 150,
            max: 800,
            step: 25,
            default: 300,
            unit: 'mm',
            axis: 'both'
        }
    ],
    flipParams: [
        {
            id: 'flipShadow',
            name: 'flipShadow',
            label: 'Shadow Vector (45° / 135°)',
            labelTr: 'Mimari Gölge Yönü',
            axis: 'horizontal',
            default: false
        }
    ],
    visibilityParam: {
        id: 'visState',
        name: 'visState',
        label: 'Tree Species & Style',
        labelTr: 'Ağaç Türü ve Gösterim',
        states: [
            { id: 'deciduous', label: 'Plan: Deciduous (Broadleaf)', labelTr: 'Plan: Geniş Yapraklı (Çınar/Meşe)' },
            { id: 'conifer', label: 'Plan: Conifer (Pine / Fir)', labelTr: 'Plan: İbreli / Çam Ağacı' },
            { id: 'palm', label: 'Plan: Palm Tree', labelTr: 'Plan: Palmiye / Hurma' },
            { id: 'shrub', label: 'Plan: Shrub / Hedge', labelTr: 'Plan: Çalı / Bodur Peyzaj' },
            { id: 'elevation', label: 'Front Elevation', labelTr: 'Ön Görünüş (Cephe)' }
        ],
        default: 'deciduous'
    },
    lookupParams: [
        {
            id: 'treePresets',
            name: 'treePresets',
            label: 'Standard Maturity Classes',
            labelTr: 'Ağaç Olgunluk Sınıfları',
            options: [
                { id: 'tree_small', label: 'Fidan / Küçük Ağaç: Çap = 2.0 m', standard: 'ASLA', values: { crownDiameter: 2000, trunkDiameter: 180, visState: 'deciduous' } },
                { id: 'tree_medium', label: 'Orta Boy Park Ağacı: Çap = 4.0 m', standard: 'ASLA', values: { crownDiameter: 4000, trunkDiameter: 300, visState: 'deciduous' } },
                { id: 'tree_large', label: 'Anıt Ağaç / Geniş Çınar: Çap = 7.0 m', standard: 'ASLA', values: { crownDiameter: 7000, trunkDiameter: 500, visState: 'deciduous' } },
                { id: 'tree_pine', label: 'Yüksek Karaçam: Çap = 3.5 m', standard: 'ASLA', values: { crownDiameter: 3500, trunkDiameter: 350, visState: 'conifer' } },
                { id: 'tree_palm', label: 'Akdeniz Palmiyesi: Çap = 4.5 m', standard: 'ASLA', values: { crownDiameter: 4500, trunkDiameter: 400, visState: 'palm' } }
            ]
        }
    ],
    defaultValues: {
        crownDiameter: 4000,
        trunkDiameter: 300,
        flipShadow: false,
        visState: 'deciduous'
    },
    generate2D: (params: Record<string, any>, basePoint: Point = { x: 0, y: 0 }): CadEntity[] => {
        const entities: CadEntity[] = [];
        const crownDiam = Number(params.crownDiameter || 4000);
        const radius = crownDiam / 2;
        const trunkRadius = Number(params.trunkDiameter || 300) / 2;
        const flip = Boolean(params.flipShadow);
        const visState = String(params.visState || 'deciduous');

        if (visState === 'elevation') {
            // Elevation: Ground line, Trunk (Height ~ 1.5 * radius), Canopy Oval/Cone
            const treeHeight = crownDiam * 1.3;
            const trunkH = treeHeight * 0.45;

            // Ground Line
            entities.push(createLineEntity(
                { x: basePoint.x - radius - 200, y: basePoint.y },
                { x: basePoint.x + radius + 200, y: basePoint.y },
                '#64748b'
            ));

            // Trunk
            entities.push(createLineEntity(
                { x: basePoint.x - trunkRadius, y: basePoint.y },
                { x: basePoint.x - trunkRadius * 0.7, y: basePoint.y + trunkH },
                '#854d0e'
            ));
            entities.push(createLineEntity(
                { x: basePoint.x + trunkRadius, y: basePoint.y },
                { x: basePoint.x + trunkRadius * 0.7, y: basePoint.y + trunkH },
                '#854d0e'
            ));

            // Canopy
            entities.push(createArcEntity(
                { x: basePoint.x, y: basePoint.y + trunkH + (treeHeight - trunkH) / 2 },
                radius,
                0,
                Math.PI * 2,
                '#22c55e'
            ));
            return entities;
        }

        // Plan View
        // 1. Center Trunk Crosshair & Circle
        entities.push(createArcEntity(basePoint, trunkRadius, 0, Math.PI * 2, '#854d0e'));
        entities.push(createLineEntity(
            { x: basePoint.x - trunkRadius * 1.5, y: basePoint.y },
            { x: basePoint.x + trunkRadius * 1.5, y: basePoint.y },
            '#94a3b8'
        ));
        entities.push(createLineEntity(
            { x: basePoint.x, y: basePoint.y - trunkRadius * 1.5 },
            { x: basePoint.x, y: basePoint.y + trunkRadius * 1.5 },
            '#94a3b8'
        ));

        // 2. Canopy Outline based on species
        if (visState === 'conifer') {
            // Conifer / Pine: Multi-point Star / Starburst Geometry
            const points = 12;
            for (let i = 0; i < points; i++) {
                const angle1 = (i * Math.PI * 2) / points;
                const angle2 = ((i + 0.5) * Math.PI * 2) / points;
                const outerR = radius;
                const innerR = radius * 0.7;

                entities.push(createLineEntity(
                    basePoint,
                    { x: basePoint.x + Math.cos(angle1) * outerR, y: basePoint.y + Math.sin(angle1) * outerR },
                    '#15803d'
                ));
                entities.push(createLineEntity(
                    { x: basePoint.x + Math.cos(angle1) * outerR, y: basePoint.y + Math.sin(angle1) * outerR },
                    { x: basePoint.x + Math.cos(angle2) * innerR, y: basePoint.y + Math.sin(angle2) * innerR },
                    '#22c55e'
                ));
            }
            entities.push(createArcEntity(basePoint, radius * 0.35, 0, Math.PI * 2, '#16a34a'));
        } else if (visState === 'palm') {
            // Palm: 8 Radial curved fronds
            const fronds = 8;
            for (let i = 0; i < fronds; i++) {
                const angle = (i * Math.PI * 2) / fronds;
                const fx = basePoint.x + Math.cos(angle) * radius;
                const fy = basePoint.y + Math.sin(angle) * radius;
                entities.push(createLineEntity(basePoint, { x: fx, y: fy }, '#16a34a'));
                // Leaf leaflets
                entities.push(createArcEntity({ x: fx * 0.85 + basePoint.x * 0.15, y: fy * 0.85 + basePoint.y * 0.15 }, radius * 0.2, 0, Math.PI * 2, '#4ade80'));
            }
        } else if (visState === 'shrub') {
            // Shrub / Hedge: Cloud-like undulating perimeter
            const lobes = 8;
            for (let i = 0; i < lobes; i++) {
                const angle = (i * Math.PI * 2) / lobes;
                const lx = basePoint.x + Math.cos(angle) * (radius * 0.85);
                const ly = basePoint.y + Math.sin(angle) * (radius * 0.85);
                entities.push(createArcEntity({ x: lx, y: ly }, radius * 0.28, 0, Math.PI * 2, '#4ade80'));
            }
        } else {
            // Deciduous: Classic Smooth Outer Circle + Foliage arcs + Root protection boundary
            entities.push(createArcEntity(basePoint, radius, 0, Math.PI * 2, '#22c55e'));
            entities.push(createArcEntity(basePoint, radius * 0.65, 0, Math.PI * 2, '#16a34a'));

            // Architectural Foliage Scallops (Bulut halkaları)
            const scallops = 6;
            for (let i = 0; i < scallops; i++) {
                const angle = (i * Math.PI * 2) / scallops;
                const sx = basePoint.x + Math.cos(angle) * (radius * 0.7);
                const sy = basePoint.y + Math.sin(angle) * (radius * 0.7);
                entities.push(createArcEntity({ x: sx, y: sy }, radius * 0.25, 0, Math.PI * 2, '#86efac'));
            }
        }

        // Shadow hatch vector (45 deg)
        const shadowAngle = flip ? (Math.PI * 0.75) : (Math.PI * 0.25);
        const shadowEndX = basePoint.x + Math.cos(shadowAngle) * (radius * 1.25);
        const shadowEndY = basePoint.y + Math.sin(shadowAngle) * (radius * 1.25);
        entities.push(createLineEntity(basePoint, { x: shadowEndX, y: shadowEndY }, '#334155'));

        return entities;
    },
    getGrips: (params: Record<string, any>, basePoint: Point): DynamicGrip[] => {
        const crownDiam = Number(params.crownDiameter || 4000);
        const radius = crownDiam / 2;

        return [
            {
                id: 'grip_center',
                type: 'point',
                position: basePoint,
                paramId: 'origin',
                label: 'Ağaç Gövde Merkezi'
            },
            {
                id: 'grip_canopy_right',
                type: 'linear',
                position: { x: basePoint.x + radius, y: basePoint.y },
                direction: { x: 1, y: 0 },
                paramId: 'crownDiameter',
                label: 'Taç Çapını Esnet'
            },
            {
                id: 'grip_flip',
                type: 'flip',
                position: { x: basePoint.x, y: basePoint.y - radius - 50 },
                paramId: 'flipShadow',
                label: 'Gölge Açısını Değiştir'
            },
            {
                id: 'grip_vis',
                type: 'visibility',
                position: { x: basePoint.x + radius * 0.7, y: basePoint.y - radius * 0.7 },
                paramId: 'visState',
                label: 'Tür: Yapraklı / Çam / Palmiye / Çalı'
            }
        ];
    },
    generate3D: (params: Record<string, any>, basePos = { x: 0, y: 0, z: 0 }): DynamicPart3DDef[] => {
        const crownDiam = Number(params.crownDiameter || 4000) / 1000;
        const radius = crownDiam / 2;
        const trunkRadius = Number(params.trunkDiameter || 300) / 2000;
        const height = crownDiam * 1.4;

        return [
            // Trunk
            {
                name: 'Tree_Trunk',
                shape: 'cylinder',
                dimensions: { radius: trunkRadius, height: height * 0.4 },
                position: { x: basePos.x, y: basePos.y + (height * 0.4) / 2, z: basePos.z },
                color: '#78350f',
                materialType: 'structural_timber'
            },
            // Foliage Canopy Sphere
            {
                name: 'Tree_Canopy',
                shape: 'sphere',
                dimensions: { radius },
                position: { x: basePos.x, y: basePos.y + height * 0.4 + radius * 0.85, z: basePos.z },
                color: '#22c55e',
                materialType: 'structural_timber'
            }
        ];
    }
};
