/**
 * 🔩 Dynamic Hydraulic & Pneumatic Actuator Cylinder (ISO 6020-2 / ISO 15552)
 *
 * - Lookup Catalog: ISO 15552 Pneumatic & ISO 6020-2 160 bar Hydraulic Cylinders (Ø32 to Ø160)
 * - Linear Params: Stroke (50–2000 mm), Extension % (0–100%), Bore Diameter, Rod Diameter
 * - Visibility States:
 *    - Axial Cross-Section (Boyuna Kesit — Piston, Keçe, Silindir Gömleği, Kapaklar ve ISO 128 Tarama)
 *    - Side Exterior View (Dış Montaj Görünüşü — Bağlantı Saplamaları, Portlar ve Mil Ucu)
 *    - ISO 1219 Fluid Power Symbol (Hidrolik / Pnömatik Devre Şeması Sembolü)
 * - 3D Solids: Cylinder barrel, head/cap end covers, piston rod, rod-end thread/clevis
 */

import {
    CadEntity,
    createLineEntity,
    createRectangleEntity,
    createCircleEntity,
    createHatchEntity
} from '../../../kernel/types';
import { DynamicBlockDef, DynamicGrip, DynamicPart3DDef } from '../types';

export interface CylinderCatalogSpec {
    code: string;
    series: string;
    boreD: number;     // Piston bore diameter D (mm)
    rodD: number;      // Piston rod diameter d (mm)
    barrelOD: number;  // Outer barrel / head square size E (mm)
    headL: number;     // Head/Cap thickness each (mm)
    baseDeadL: number; // Base dead length ZJ at 0 stroke (mm)
    rodExtL: number;   // Rod protrusion WH at 0 stroke (mm)
    portSize: string;
    forcePush100BarKn: number;
}

export const ISO_CYLINDER_CATALOG: Record<string, CylinderCatalogSpec> = {
    ISO_32_20: {
        code: 'ISO_32_20',
        series: 'ISO 6020-2 / ISO 15552 Ø32xØ20',
        boreD: 32,
        rodD: 20,
        barrelOD: 47,
        headL: 28,
        baseDeadL: 120,
        rodExtL: 26,
        portSize: 'G1/4"',
        forcePush100BarKn: 8.04
    },
    ISO_40_25: {
        code: 'ISO_40_25',
        series: 'ISO 6020-2 / ISO 15552 Ø40xØ25',
        boreD: 40,
        rodD: 25,
        barrelOD: 56,
        headL: 32,
        baseDeadL: 135,
        rodExtL: 30,
        portSize: 'G3/8"',
        forcePush100BarKn: 12.57
    },
    ISO_50_32: {
        code: 'ISO_50_32',
        series: 'ISO 6020-2 / ISO 15552 Ø50xØ32',
        boreD: 50,
        rodD: 32,
        barrelOD: 68,
        headL: 36,
        baseDeadL: 143,
        rodExtL: 37,
        portSize: 'G1/2"',
        forcePush100BarKn: 19.63
    },
    ISO_63_40: {
        code: 'ISO_63_40',
        series: 'ISO 6020-2 / ISO 15552 Ø63xØ40',
        boreD: 63,
        rodD: 40,
        barrelOD: 82,
        headL: 40,
        baseDeadL: 158,
        rodExtL: 37,
        portSize: 'G1/2"',
        forcePush100BarKn: 31.17
    },
    ISO_80_50: {
        code: 'ISO_80_50',
        series: 'ISO 6020-2 / ISO 15552 Ø80xØ50',
        boreD: 80,
        rodD: 50,
        barrelOD: 102,
        headL: 45,
        baseDeadL: 174,
        rodExtL: 46,
        portSize: 'G3/4"',
        forcePush100BarKn: 50.27
    },
    ISO_100_63: {
        code: 'ISO_100_63',
        series: 'ISO 6020-2 / ISO 15552 Ø100xØ63',
        boreD: 100,
        rodD: 63,
        barrelOD: 125,
        headL: 50,
        baseDeadL: 189,
        rodExtL: 51,
        portSize: 'G3/4"',
        forcePush100BarKn: 78.54
    },
    ISO_125_80: {
        code: 'ISO_125_80',
        series: 'ISO 6020-2 / ISO 15552 Ø125xØ80',
        boreD: 125,
        rodD: 80,
        barrelOD: 155,
        headL: 58,
        baseDeadL: 225,
        rodExtL: 65,
        portSize: 'G1"',
        forcePush100BarKn: 122.72
    },
    ISO_160_100: {
        code: 'ISO_160_100',
        series: 'ISO 6020-2 / ISO 15552 Ø160xØ100',
        boreD: 160,
        rodD: 100,
        barrelOD: 196,
        headL: 65,
        baseDeadL: 260,
        rodExtL: 80,
        portSize: 'G1-1/4"',
        forcePush100BarKn: 201.06
    }
};

export const DYN_HYDRAULIC_CYLINDER: DynamicBlockDef = {
    id: 'dyn_hydraulic_cylinder',
    name: 'Hydraulic / Pneumatic Cylinder (ISO 6020-2 / ISO 15552)',
    nameTr: 'Dinamik Hidrolik & Pnömatik Silindir (ISO 6020 / 15552)',
    category: 'Mechanical',
    subcategory: 'Hydraulics & Pneumatics',
    subcategoryTr: 'Hidrolik ve Pnömatik Ekipmanlar',
    description: 'Parametric ISO 6020-2 / ISO 15552 actuator cylinder with adjustable stroke, piston extension percentage, axial cross-section hatches, and ISO 1219 schematic.',
    descriptionTr: 'ISO 6020-2 ve ISO 15552 standartlarında strok boyu, mil açılma oranı, boyuna kesit taraması ve devre şeması sembollü dinamik piston.',
    icon: '🔩',
    calculatorRoute: '/hydraulics/',
    calculatorModuleType: 'hydraulics',
    calculatorLabelTr: 'Hidrolik Silindir Kuvvet ve Basınç Hesabına Git (ISO 6020)',
    citation: {
        tier: 1,
        standard: 'ISO 6020-2:2015 / ISO 15552:2018 / ISO 1219-1',
        clause: 'Clause 4 — Mounting dimensions, bore/rod series & fluid power graphical symbols',
        description: 'Standard metric cylinder bore & piston rod combinations, tie-rod envelope dimensions, and ISO 1219 schematic symbols.'
    },
    linearParams: [
        {
            id: 'stroke',
            name: 'stroke',
            label: 'Cylinder Stroke (S)',
            labelTr: 'Silindir Strok Boyu (S)',
            min: 50,
            max: 2000,
            step: 25,
            default: 300,
            unit: 'mm',
            axis: 'x'
        },
        {
            id: 'extensionPct',
            name: 'extensionPct',
            label: 'Rod Extension (%)',
            labelTr: 'Piston Açılma Oranı (%)',
            min: 0,
            max: 100,
            step: 10,
            default: 40,
            unit: 'mm',
            axis: 'x'
        }
    ],
    flipParams: [
        {
            id: 'flipX',
            name: 'flipX',
            label: 'Flip Rod Direction',
            labelTr: 'Mil Çıkış Yönünü Çevir',
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
            { id: 'axial_section', label: 'Axial Cross-Section (Boyuna Kesit — Piston & Gömlek)', labelTr: 'Boyuna Kesit (Piston & Keçe Detaylı)' },
            { id: 'side_view', label: 'Exterior Side View (Dış Montaj Görünüşü)', labelTr: 'Dış Yan Görünüş (Saplamalı Gövde)' },
            { id: 'iso_symbol', label: 'ISO 1219 Fluid Power Schematic Symbol', labelTr: 'ISO 1219 Hidrolik/Pnömatik Şema Sembolü' }
        ],
        default: 'axial_section'
    },
    lookupParams: [
        {
            id: 'cylSize',
            name: 'cylSize',
            label: 'ISO Cylinder Bore x Rod Series',
            labelTr: 'ISO Silindir Çap x Mil Serisi',
            options: Object.values(ISO_CYLINDER_CATALOG).map((c) => ({
                id: c.code,
                label: `${c.series} (Port: ${c.portSize} — F_100bar: ${c.forcePush100BarKn} kN)`,
                standard: 'ISO 6020-2',
                values: { cylSize: c.code }
            })),
            default: 'ISO_63_40'
        }
    ],
    defaultValues: {
        cylSize: 'ISO_63_40',
        stroke: 300,
        extensionPct: 40,
        flipX: false,
        viewMode: 'axial_section'
    },
    generate2D: (params, basePoint = { x: 0, y: 0 }) => {
        const sizeKey = String(params.cylSize || 'ISO_63_40');
        const spec = ISO_CYLINDER_CATALOG[sizeKey] || ISO_CYLINDER_CATALOG.ISO_63_40;
        const stroke = Math.max(50, Number(params.stroke) || 300);
        const extPct = Math.min(100, Math.max(0, Number(params.extensionPct ?? 40)));
        const viewMode = String(params.viewMode || 'axial_section');

        const { boreD, rodD, barrelOD, headL, rodExtL } = spec;
        const pistonWidth = Math.max(20, Math.round(boreD * 0.42));
        const bodyLen = headL * 2 + stroke + pistonWidth;
        const extDist = (stroke * extPct) / 100;
        const rodTotalLen = stroke + headL + rodExtL;
        const pistonX = basePoint.x + headL + pistonWidth / 2 + extDist;

        const entities: CadEntity[] = [];
        const layerBody = 'layer-mech';
        const layerRod = 'layer-accent';
        const layerRef = 'layer-ref';

        // Centerline
        entities.push(
            createLineEntity(
                { x: basePoint.x - 25, y: basePoint.y },
                { x: basePoint.x + bodyLen + rodExtL + extDist + 35, y: basePoint.y },
                layerRef,
                '#ef4444'
            )
        );

        if (viewMode === 'iso_symbol') {
            // ISO 1219 Double-Acting Cylinder Symbol
            entities.push(
                createRectangleEntity(
                    { x: basePoint.x + bodyLen / 2, y: basePoint.y },
                    bodyLen,
                    boreD,
                    layerBody,
                    '#38bdf8'
                )
            );
            // Piston line inside symbol
            entities.push(
                createLineEntity(
                    { x: pistonX, y: basePoint.y - boreD / 2 },
                    { x: pistonX, y: basePoint.y + boreD / 2 },
                    layerRod,
                    '#f8fafc'
                )
            );
            // Rod line
            entities.push(
                createLineEntity(
                    { x: pistonX, y: basePoint.y },
                    { x: basePoint.x + bodyLen + rodExtL + extDist, y: basePoint.y },
                    layerRod,
                    '#f8fafc'
                )
            );
            // Ports A & B lines
            entities.push(
                createLineEntity(
                    { x: basePoint.x + headL * 1.2, y: basePoint.y + boreD / 2 },
                    { x: basePoint.x + headL * 1.2, y: basePoint.y + boreD * 0.85 },
                    layerBody,
                    '#f59e0b'
                ),
                createLineEntity(
                    { x: basePoint.x + bodyLen - headL * 1.2, y: basePoint.y + boreD / 2 },
                    { x: basePoint.x + bodyLen - headL * 1.2, y: basePoint.y + boreD * 0.85 },
                    layerBody,
                    '#f59e0b'
                )
            );
            return entities;
        }

        // Rear Cap & Front Head Blocks
        entities.push(
            createRectangleEntity(
                { x: basePoint.x + headL / 2, y: basePoint.y },
                headL,
                barrelOD,
                layerBody,
                '#64748b'
            ),
            createRectangleEntity(
                { x: basePoint.x + bodyLen - headL / 2, y: basePoint.y },
                headL,
                barrelOD,
                layerBody,
                '#64748b'
            )
        );

        // Cylinder Barrel Tube
        const barrelLen = bodyLen - headL * 2;
        const barrelOuterD = boreD + (barrelOD - boreD) * 0.55;
        entities.push(
            createRectangleEntity(
                { x: basePoint.x + headL + barrelLen / 2, y: basePoint.y },
                barrelLen,
                barrelOuterD,
                layerBody,
                '#3ad0e6'
            )
        );

        // Ports A & B bosses on top of Rear Cap & Front Head
        const portW = Math.max(12, headL * 0.48);
        const portH = 8;
        entities.push(
            createRectangleEntity(
                { x: basePoint.x + headL / 2, y: basePoint.y + barrelOD / 2 + portH / 2 },
                portW,
                portH,
                layerBody,
                '#f59e0b'
            ),
            createRectangleEntity(
                { x: basePoint.x + bodyLen - headL / 2, y: basePoint.y + barrelOD / 2 + portH / 2 },
                portW,
                portH,
                layerBody,
                '#f59e0b'
            )
        );

        if (viewMode === 'side_view') {
            // Tie rods visible on exterior view
            const tieY = barrelOD * 0.42;
            entities.push(
                createLineEntity({ x: basePoint.x, y: basePoint.y + tieY }, { x: basePoint.x + bodyLen, y: basePoint.y + tieY }, layerRef, '#94a3b8'),
                createLineEntity({ x: basePoint.x, y: basePoint.y - tieY }, { x: basePoint.x + bodyLen, y: basePoint.y - tieY }, layerRef, '#94a3b8')
            );
            // Extended part of Piston Rod outside Front Head
            const extRodLen = rodExtL + extDist;
            entities.push(
                createRectangleEntity(
                    { x: basePoint.x + bodyLen + extRodLen / 2, y: basePoint.y },
                    extRodLen,
                    rodD,
                    layerRod,
                    '#f8fafc'
                )
            );
            // Rod-end thread shoulder
            const threadLen = Math.min(extRodLen * 0.4, rodD * 1.2);
            entities.push(
                createRectangleEntity(
                    { x: basePoint.x + bodyLen + extRodLen + threadLen / 2, y: basePoint.y },
                    threadLen,
                    rodD * 0.8,
                    layerRod,
                    '#38bdf8'
                )
            );
            return entities;
        }

        // AXIAL SECTION VIEW: Inner Bore, Piston, Rod, Seals & ISO 128 Cross-Section Hatches
        // Inner cylinder bore walls
        entities.push(
            createLineEntity(
                { x: basePoint.x + headL, y: basePoint.y + boreD / 2 },
                { x: basePoint.x + bodyLen - headL, y: basePoint.y + boreD / 2 },
                layerBody,
                '#f8fafc'
            ),
            createLineEntity(
                { x: basePoint.x + headL, y: basePoint.y - boreD / 2 },
                { x: basePoint.x + bodyLen - headL, y: basePoint.y - boreD / 2 },
                layerBody,
                '#f8fafc'
            )
        );

        // Barrel Wall Section Hatches (Top & Bottom)
        entities.push(
            createHatchEntity([
                { x: basePoint.x + headL, y: basePoint.y + boreD / 2 },
                { x: basePoint.x + bodyLen - headL, y: basePoint.y + boreD / 2 },
                { x: basePoint.x + bodyLen - headL, y: basePoint.y + barrelOuterD / 2 },
                { x: basePoint.x + headL, y: basePoint.y + barrelOuterD / 2 }
            ], 'ANSI31', layerBody, '#0284c7'),
            createHatchEntity([
                { x: basePoint.x + headL, y: basePoint.y - barrelOuterD / 2 },
                { x: basePoint.x + bodyLen - headL, y: basePoint.y - barrelOuterD / 2 },
                { x: basePoint.x + bodyLen - headL, y: basePoint.y - boreD / 2 },
                { x: basePoint.x + headL, y: basePoint.y - boreD / 2 }
            ], 'ANSI31', layerBody, '#0284c7')
        );

        // Rear Cap & Front Head Section Hatches
        entities.push(
            createHatchEntity([
                { x: basePoint.x, y: basePoint.y - barrelOD / 2 },
                { x: basePoint.x + headL, y: basePoint.y - barrelOD / 2 },
                { x: basePoint.x + headL, y: basePoint.y + barrelOD / 2 },
                { x: basePoint.x, y: basePoint.y + barrelOD / 2 }
            ], 'CROSS', layerBody, '#475569'),
            createHatchEntity([
                { x: basePoint.x + bodyLen - headL, y: basePoint.y + rodD / 2 },
                { x: basePoint.x + bodyLen, y: basePoint.y + rodD / 2 },
                { x: basePoint.x + bodyLen, y: basePoint.y + barrelOD / 2 },
                { x: basePoint.x + bodyLen - headL, y: basePoint.y + barrelOD / 2 }
            ], 'CROSS', layerBody, '#475569'),
            createHatchEntity([
                { x: basePoint.x + bodyLen - headL, y: basePoint.y - barrelOD / 2 },
                { x: basePoint.x + bodyLen, y: basePoint.y - barrelOD / 2 },
                { x: basePoint.x + bodyLen, y: basePoint.y - rodD / 2 },
                { x: basePoint.x + bodyLen - headL, y: basePoint.y - rodD / 2 }
            ], 'CROSS', layerBody, '#475569')
        );

        // Piston Disc inside bore
        entities.push(
            createRectangleEntity(
                { x: pistonX, y: basePoint.y },
                pistonWidth,
                boreD,
                layerRod,
                '#f59e0b'
            ),
            createHatchEntity([
                { x: pistonX - pistonWidth / 2, y: basePoint.y + rodD / 2 },
                { x: pistonX + pistonWidth / 2, y: basePoint.y + rodD / 2 },
                { x: pistonX + pistonWidth / 2, y: basePoint.y + boreD / 2 },
                { x: pistonX - pistonWidth / 2, y: basePoint.y + boreD / 2 }
            ], 'ANSI31', layerRod, '#d97706'),
            createHatchEntity([
                { x: pistonX - pistonWidth / 2, y: basePoint.y - boreD / 2 },
                { x: pistonX + pistonWidth / 2, y: basePoint.y - boreD / 2 },
                { x: pistonX + pistonWidth / 2, y: basePoint.y - rodD / 2 },
                { x: pistonX - pistonWidth / 2, y: basePoint.y - rodD / 2 }
            ], 'ANSI31', layerRod, '#d97706')
        );

        // Full Piston Rod (from piston to rod end)
        const rodStartX = pistonX - pistonWidth / 2;
        const rodEndX = basePoint.x + bodyLen + rodExtL + extDist;
        const actualRodLen = rodEndX - rodStartX;
        entities.push(
            createRectangleEntity(
                { x: rodStartX + actualRodLen / 2, y: basePoint.y },
                actualRodLen,
                rodD,
                layerRod,
                '#f8fafc'
            )
        );

        return entities;
    },
    generate3D: (params, basePos = { x: 0, y: 0, z: 0 }) => {
        const sizeKey = String(params.cylSize || 'ISO_63_40');
        const spec = ISO_CYLINDER_CATALOG[sizeKey] || ISO_CYLINDER_CATALOG.ISO_63_40;
        const stroke = Math.max(50, Number(params.stroke) || 300);
        const extPct = Math.min(100, Math.max(0, Number(params.extensionPct ?? 40)));
        const { boreD, rodD, barrelOD, headL, rodExtL } = spec;

        const pistonWidth = Math.max(20, Math.round(boreD * 0.42));
        const bodyLen = headL * 2 + stroke + pistonWidth;
        const barrelLen = bodyLen - headL * 2;
        const extDist = (stroke * extPct) / 100;
        const extRodLen = rodExtL + extDist;

        const parts: DynamicPart3DDef[] = [
            // Rear End Cap
            {
                id: `cyl_cap_rear_${Date.now()}`,
                name: `${spec.series} Arka Kapak`,
                kind: 'box',
                color: '#334155',
                position: { x: basePos.x + headL / 2, y: basePos.y, z: basePos.z },
                rotation: { x: 0, y: 0, z: 0 },
                params: { width: headL, height: barrelOD, depth: barrelOD },
                designStandard: 'ISO 6020-2'
            },
            // Main Cylinder Barrel
            {
                id: `cyl_barrel_${Date.now()}`,
                name: `${spec.series} Silindir Gömleği (Strok=${stroke}mm)`,
                kind: 'tube',
                color: '#0284c7',
                position: { x: basePos.x + headL + barrelLen / 2, y: basePos.y, z: basePos.z },
                rotation: { x: 0, y: 90, z: 0 },
                params: { diameter: boreD + 12, wall: 6, length: barrelLen },
                designStandard: 'ISO 6020-2'
            },
            // Front Head Cap
            {
                id: `cyl_cap_front_${Date.now()}`,
                name: `${spec.series} Ön Boğaz Kapağı`,
                kind: 'box',
                color: '#334155',
                position: { x: basePos.x + bodyLen - headL / 2, y: basePos.y, z: basePos.z },
                rotation: { x: 0, y: 0, z: 0 },
                params: { width: headL, height: barrelOD, depth: barrelOD },
                designStandard: 'ISO 6020-2'
            },
            // Chromed Piston Rod
            {
                id: `cyl_rod_${Date.now()}`,
                name: `Krom Kaplı Piston Mili Ø${rodD} mm`,
                kind: 'cylinder',
                color: '#e2e8f0',
                position: { x: basePos.x + bodyLen + extRodLen / 2, y: basePos.y, z: basePos.z },
                rotation: { x: 0, y: 90, z: 0 },
                params: { diameter: rodD, length: extRodLen + stroke * 0.5 },
                designStandard: 'ISO 6020-2'
            }
        ];

        return parts;
    },
    getGrips: (params, basePoint = { x: 0, y: 0 }) => {
        const sizeKey = String(params.cylSize || 'ISO_63_40');
        const spec = ISO_CYLINDER_CATALOG[sizeKey] || ISO_CYLINDER_CATALOG.ISO_63_40;
        const stroke = Math.max(50, Number(params.stroke) || 300);
        const extPct = Math.min(100, Math.max(0, Number(params.extensionPct ?? 40)));
        const pistonWidth = Math.max(20, Math.round(spec.boreD * 0.42));
        const bodyLen = spec.headL * 2 + stroke + pistonWidth;
        const extDist = (stroke * extPct) / 100;

        const grips: DynamicGrip[] = [
            {
                id: 'grip_cyl_stroke',
                type: 'stretch',
                paramId: 'stroke',
                position: { x: basePoint.x + bodyLen, y: basePoint.y },
                direction: { x: 1, y: 0 },
                tooltip: `Strok Boyu Esnet (${stroke} mm)`,
                tooltipTr: `Strok Boyu Esnet (${stroke} mm)`
            },
            {
                id: 'grip_cyl_ext',
                type: 'stretch',
                paramId: 'extensionPct',
                position: { x: basePoint.x + bodyLen + spec.rodExtL + extDist, y: basePoint.y },
                direction: { x: 1, y: 0 },
                tooltip: `Piston Açılma Oranı (%${extPct})`,
                tooltipTr: `Piston Açılma Oranı (%${extPct})`
            },
            {
                id: 'grip_cyl_vis',
                type: 'visibility',
                paramId: 'viewMode',
                position: { x: basePoint.x, y: basePoint.y - spec.barrelOD * 0.7 },
                tooltip: 'Görünüş Değiştir (Boyuna Kesit / Dış Görünüş / ISO 1219 Sembol)',
                tooltipTr: 'Görünüş Değiştir (Boyuna Kesit / Dış Görünüş / ISO 1219 Sembol)'
            }
        ];
        return grips;
    }
};
