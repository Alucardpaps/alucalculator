/**
 * 🧱 AluCAD — Standard Engineering Block & Template Library (ISO / DIN / VDI)
 * 
 * Provides an extensive, industrial-grade library of standard engineering blocks:
 * 1. Sheet Templates (DIN EN ISO 5457 A4, A3, A2)
 * 2. Title Blocks, Bill of Materials (BOM) & Notes (ISO 7200, DIN 6771, ISO 2768)
 * 3. Technical Drawing Symbols (GD&T ISO 1101, Surface ISO 1302, Welding ISO 2553, Projection ISO 5456-2)
 * 4. Fasteners & Machine Elements (ISO 4014, DIN 912, ISO 10642, ISO 4032, ISO 7089, DIN 471)
 * 5. Structural Extrusions & Brackets (2020, 2040, 3030, 4040, Gusset Brackets)
 * 6. Mounts & Motors (NEMA 17, 23, 34, 608/6204 Ball Bearings)
 * 7. Fluid Power & Pneumatic Schematics (ISO 1219 Cylinder, 5/2 Valve, Gauge, Pump, FRL)
 */

import {
    BlockDefinition,
    createLineEntity,
    createCircleEntity,
    createArcEntity,
    createRectangleEntity,
    createHexagonEntity,
    createPolylineEntity,
    createTextEntity,
    createLeaderEntity
} from '../kernel/types';
import {
    createSurfaceFinishBlock,
    createCollectiveCalloutEntities,
    createLegacyTriangleEntities
} from './SurfaceFinishGenerator';

export const STANDARD_BLOCKS: BlockDefinition[] = [
    // ═══════════════════════════════════════════════════════════════
    // 1. SHEET TEMPLATES (DIN EN ISO 5457)
    // ═══════════════════════════════════════════════════════════════

    // A4 Landscape (297 x 210 mm)
    {
        id: 'std_tpl_a4_l',
        name: 'ISO 5457 A4 Sheet (Landscape)',
        description: 'Standard A4 297x210mm Sheet with 20mm binding margin, grid zones & ISO 7200 antet zone',
        category: 'Templates',
        subcategory: 'ISO 5457 Sheets',
        basePoint: { x: 0, y: 0 },
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
        entities: [
            // Outer paper boundary (297 x 210)
            createLineEntity({ x: 0, y: 0 }, { x: 297, y: 0 }, 'layer-0', '#334155'),
            createLineEntity({ x: 297, y: 0 }, { x: 297, y: 210 }, 'layer-0', '#334155'),
            createLineEntity({ x: 297, y: 210 }, { x: 0, y: 210 }, 'layer-0', '#334155'),
            createLineEntity({ x: 0, y: 210 }, { x: 0, y: 0 }, 'layer-0', '#334155'),

            // Drawing border (Left margin 20mm, other margins 10mm -> 20 to 287, 10 to 200)
            createLineEntity({ x: 20, y: 10 }, { x: 287, y: 10 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 287, y: 10 }, { x: 287, y: 200 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 287, y: 200 }, { x: 20, y: 200 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 20, y: 200 }, { x: 20, y: 10 }, 'layer-0', '#3ad0e6'),

            // Centering marks (5mm extending across border)
            createLineEntity({ x: 148.5, y: 5 }, { x: 148.5, y: 15 }, 'layer-0', '#e85d5d'),
            createLineEntity({ x: 148.5, y: 195 }, { x: 148.5, y: 205 }, 'layer-0', '#e85d5d'),
            createLineEntity({ x: 15, y: 105 }, { x: 25, y: 105 }, 'layer-0', '#e85d5d'),
            createLineEntity({ x: 282, y: 105 }, { x: 292, y: 105 }, 'layer-0', '#e85d5d'),

            // Grid Zone References (A, B, C, D / 1, 2, 3, 4, 5, 6)
            createTextEntity({ x: 10, y: 152.5 }, 'A', 3.5, 'layer-0', '#8a96a6', 'center'),
            createTextEntity({ x: 10, y: 105 }, 'B', 3.5, 'layer-0', '#8a96a6', 'center'),
            createTextEntity({ x: 10, y: 57.5 }, 'C', 3.5, 'layer-0', '#8a96a6', 'center'),
            createTextEntity({ x: 10, y: 20 }, 'D', 3.5, 'layer-0', '#8a96a6', 'center'),

            createTextEntity({ x: 42, y: 205 }, '1', 3.5, 'layer-0', '#8a96a6', 'center'),
            createTextEntity({ x: 86, y: 205 }, '2', 3.5, 'layer-0', '#8a96a6', 'center'),
            createTextEntity({ x: 130, y: 205 }, '3', 3.5, 'layer-0', '#8a96a6', 'center'),
            createTextEntity({ x: 174, y: 205 }, '4', 3.5, 'layer-0', '#8a96a6', 'center'),
            createTextEntity({ x: 218, y: 205 }, '5', 3.5, 'layer-0', '#8a96a6', 'center'),
            createTextEntity({ x: 262, y: 205 }, '6', 3.5, 'layer-0', '#8a96a6', 'center'),

            // Title Block placeholder zone (180x36 in bottom-right corner: x: 107..287, y: 10..46)
            createLineEntity({ x: 107, y: 46 }, { x: 287, y: 46 }, 'layer-0', '#334155'),
            createLineEntity({ x: 107, y: 10 }, { x: 107, y: 46 }, 'layer-0', '#334155'),
            createTextEntity({ x: 197, y: 28 }, 'TITLE BLOCK ZONE (ISO 7200 - 180x36mm)', 3, 'layer-0', '#8a96a6', 'center', false, true),
        ]
    },

    // A4 Portrait (210 x 297 mm)
    {
        id: 'std_tpl_a4_p',
        name: 'ISO 5457 A4 Sheet (Portrait)',
        description: 'Standard A4 210x297mm Sheet with 20mm binding margin & title block boundary',
        category: 'Templates',
        subcategory: 'ISO 5457 Sheets',
        basePoint: { x: 0, y: 0 },
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
        entities: [
            // Outer paper boundary (210 x 297)
            createLineEntity({ x: 0, y: 0 }, { x: 210, y: 0 }, 'layer-0', '#334155'),
            createLineEntity({ x: 210, y: 0 }, { x: 210, y: 297 }, 'layer-0', '#334155'),
            createLineEntity({ x: 210, y: 297 }, { x: 0, y: 297 }, 'layer-0', '#334155'),
            createLineEntity({ x: 0, y: 297 }, { x: 0, y: 0 }, 'layer-0', '#334155'),

            // Drawing border (Left 20mm, other 10mm -> 20 to 200, 10 to 287)
            createLineEntity({ x: 20, y: 10 }, { x: 200, y: 10 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 200, y: 10 }, { x: 200, y: 287 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 200, y: 287 }, { x: 20, y: 287 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 20, y: 287 }, { x: 20, y: 10 }, 'layer-0', '#3ad0e6'),

            // Centering marks
            createLineEntity({ x: 105, y: 5 }, { x: 105, y: 15 }, 'layer-0', '#e85d5d'),
            createLineEntity({ x: 105, y: 282 }, { x: 105, y: 292 }, 'layer-0', '#e85d5d'),
            createLineEntity({ x: 15, y: 148.5 }, { x: 25, y: 148.5 }, 'layer-0', '#e85d5d'),
            createLineEntity({ x: 195, y: 148.5 }, { x: 205, y: 148.5 }, 'layer-0', '#e85d5d'),

            // Title Block placeholder (180x36mm across bottom: x: 20..200, y: 10..46)
            createLineEntity({ x: 20, y: 46 }, { x: 200, y: 46 }, 'layer-0', '#334155'),
            createTextEntity({ x: 110, y: 28 }, 'TITLE BLOCK ZONE (ISO 7200 - 180x36mm)', 3, 'layer-0', '#8a96a6', 'center', false, true),
        ]
    },

    // A3 Landscape (420 x 297 mm)
    {
        id: 'std_tpl_a3_l',
        name: 'ISO 5457 A3 Sheet (Landscape)',
        description: 'Standard A3 420x297mm Drawing Sheet with border, grid zones (A-D, 1-8) & title block corner',
        category: 'Templates',
        subcategory: 'ISO 5457 Sheets',
        basePoint: { x: 0, y: 0 },
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
        entities: [
            createLineEntity({ x: 0, y: 0 }, { x: 420, y: 0 }, 'layer-0', '#334155'),
            createLineEntity({ x: 420, y: 0 }, { x: 420, y: 297 }, 'layer-0', '#334155'),
            createLineEntity({ x: 420, y: 297 }, { x: 0, y: 297 }, 'layer-0', '#334155'),
            createLineEntity({ x: 0, y: 297 }, { x: 0, y: 0 }, 'layer-0', '#334155'),

            // Drawing border (20mm left binding, 10mm others -> 20 to 410, 10 to 287)
            createLineEntity({ x: 20, y: 10 }, { x: 410, y: 10 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 410, y: 10 }, { x: 410, y: 287 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 410, y: 287 }, { x: 20, y: 287 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 20, y: 287 }, { x: 20, y: 10 }, 'layer-0', '#3ad0e6'),

            // Centering marks
            createLineEntity({ x: 210, y: 5 }, { x: 210, y: 15 }, 'layer-0', '#e85d5d'),
            createLineEntity({ x: 210, y: 282 }, { x: 210, y: 292 }, 'layer-0', '#e85d5d'),
            createLineEntity({ x: 15, y: 148.5 }, { x: 25, y: 148.5 }, 'layer-0', '#e85d5d'),
            createLineEntity({ x: 405, y: 148.5 }, { x: 415, y: 148.5 }, 'layer-0', '#e85d5d'),

            // Title block box (180x36mm at bottom right: x: 230..410, y: 10..46)
            createLineEntity({ x: 230, y: 46 }, { x: 410, y: 46 }, 'layer-0', '#334155'),
            createLineEntity({ x: 230, y: 10 }, { x: 230, y: 46 }, 'layer-0', '#334155'),
            createTextEntity({ x: 320, y: 28 }, 'ISO 7200 TITLE BLOCK POSITION', 3, 'layer-0', '#8a96a6', 'center', false, true),
        ]
    },

    // A2 Landscape (594 x 420 mm)
    {
        id: 'std_tpl_a2_l',
        name: 'ISO 5457 A2 Sheet (Landscape)',
        description: 'Standard A2 594x420mm Large Format Sheet with 20mm binding margin',
        category: 'Templates',
        subcategory: 'ISO 5457 Sheets',
        basePoint: { x: 0, y: 0 },
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
        entities: [
            createLineEntity({ x: 0, y: 0 }, { x: 594, y: 0 }, 'layer-0', '#334155'),
            createLineEntity({ x: 594, y: 0 }, { x: 594, y: 420 }, 'layer-0', '#334155'),
            createLineEntity({ x: 594, y: 420 }, { x: 0, y: 420 }, 'layer-0', '#334155'),
            createLineEntity({ x: 0, y: 420 }, { x: 0, y: 0 }, 'layer-0', '#334155'),

            // Drawing border (20mm left, 10mm others -> 20 to 584, 10 to 410)
            createLineEntity({ x: 20, y: 10 }, { x: 584, y: 10 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 584, y: 10 }, { x: 584, y: 410 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 584, y: 410 }, { x: 20, y: 410 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 20, y: 410 }, { x: 20, y: 10 }, 'layer-0', '#3ad0e6'),

            // Centering marks
            createLineEntity({ x: 297, y: 5 }, { x: 297, y: 15 }, 'layer-0', '#e85d5d'),
            createLineEntity({ x: 297, y: 405 }, { x: 297, y: 415 }, 'layer-0', '#e85d5d'),
            createLineEntity({ x: 15, y: 210 }, { x: 25, y: 210 }, 'layer-0', '#e85d5d'),
            createLineEntity({ x: 579, y: 210 }, { x: 589, y: 210 }, 'layer-0', '#e85d5d'),

            // Title block box (180x36mm: x: 404..584, y: 10..46)
            createLineEntity({ x: 404, y: 46 }, { x: 584, y: 46 }, 'layer-0', '#334155'),
            createLineEntity({ x: 404, y: 10 }, { x: 404, y: 46 }, 'layer-0', '#334155'),
            createTextEntity({ x: 494, y: 28 }, 'ISO 7200 TITLE BLOCK POSITION', 3, 'layer-0', '#8a96a6', 'center', false, true),
        ]
    },

    // Quick Simple Border (297 x 210)
    {
        id: 'std_tpl_border_simple',
        name: 'Quick Engineering Border (A4)',
        description: 'Clean single-line drawing border with 10mm margins for rapid sketching',
        category: 'Templates',
        subcategory: 'Borders',
        basePoint: { x: 0, y: 0 },
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
        entities: [
            createLineEntity({ x: 10, y: 10 }, { x: 287, y: 10 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 287, y: 10 }, { x: 287, y: 200 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 287, y: 200 }, { x: 10, y: 200 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 10, y: 200 }, { x: 10, y: 10 }, 'layer-0', '#3ad0e6'),
        ]
    },


    // ═══════════════════════════════════════════════════════════════
    // 2. TITLE BLOCKS, BILL OF MATERIALS & STAMPS (ISO 7200 / DIN 6771)
    // ═══════════════════════════════════════════════════════════════

    // ISO 7200 Official Title Block (Antet)
    {
        id: 'std_iso7200_titleblock',
        name: 'ISO 7200 Drawing Title Block (Antet)',
        description: 'Complete 180x36mm Engineering Title Block with legal ownership, title, part number, scale & revision fields',
        category: 'TitleBlocks',
        subcategory: 'Title Blocks',
        basePoint: { x: 0, y: 0 },
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
        entities: [
            // Outer frame 180 x 36
            createLineEntity({ x: 0, y: 0 }, { x: 180, y: 0 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 180, y: 0 }, { x: 180, y: 36 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 180, y: 36 }, { x: 0, y: 36 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 0, y: 36 }, { x: 0, y: 0 }, 'layer-0', '#3ad0e6'),

            // Horizontal dividers (y = 9, 18, 27)
            createLineEntity({ x: 0, y: 18 }, { x: 180, y: 18 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 0, y: 9 }, { x: 130, y: 9 }, 'layer-0', '#334155'),
            createLineEntity({ x: 0, y: 27 }, { x: 130, y: 27 }, 'layer-0', '#334155'),

            // Vertical dividers
            createLineEntity({ x: 45, y: 18 }, { x: 45, y: 36 }, 'layer-0', '#334155'),
            createLineEntity({ x: 90, y: 18 }, { x: 90, y: 36 }, 'layer-0', '#334155'),
            createLineEntity({ x: 130, y: 0 }, { x: 130, y: 36 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 155, y: 0 }, { x: 155, y: 18 }, 'layer-0', '#334155'),

            // Field Labels & Text
            createTextEntity({ x: 2, y: 33 }, 'LEGAL OWNER / COMPANY', 1.8, 'layer-0', '#8a96a6'),
            createTextEntity({ x: 2, y: 22 }, 'ALUCALC PRECISION ENGINEERING', 2.8, 'layer-0', '#e7edf4', 'left', true),

            createTextEntity({ x: 47, y: 33 }, 'DRAWN BY', 1.8, 'layer-0', '#8a96a6'),
            createTextEntity({ x: 47, y: 22 }, 'ENGINEERING DEPT', 2.5, 'layer-0', '#e7edf4'),

            createTextEntity({ x: 92, y: 33 }, 'DATE / APPROVAL', 1.8, 'layer-0', '#8a96a6'),
            createTextEntity({ x: 92, y: 22 }, '2026-09-13 / APPROVED', 2.2, 'layer-0', '#e7edf4'),

            createTextEntity({ x: 2, y: 15 }, 'TITLE / DESCRIPTION', 1.8, 'layer-0', '#8a96a6'),
            createTextEntity({ x: 2, y: 4 }, 'TRANSMISSION SHAFT ASSEMBLY', 3.5, 'layer-0', '#3ad0e6', 'left', true),

            createTextEntity({ x: 132, y: 33 }, 'DOCUMENT NUMBER / DWG NO', 1.8, 'layer-0', '#8a96a6'),
            createTextEntity({ x: 132, y: 22 }, 'ALU-DWG-2026-001', 3.2, 'layer-0', '#e7edf4', 'left', true),

            createTextEntity({ x: 132, y: 15 }, 'REV', 1.8, 'layer-0', '#8a96a6'),
            createTextEntity({ x: 138, y: 5 }, '01', 3.5, 'layer-0', '#3dd68c', 'center', true),

            createTextEntity({ x: 157, y: 15 }, 'SCALE / SHEET', 1.8, 'layer-0', '#8a96a6'),
            createTextEntity({ x: 167, y: 5 }, '1:1  |  1/1', 2.8, 'layer-0', '#e7edf4', 'center'),
        ]
    },

    // DIN 6771 Bill of Materials (BOM Table)
    {
        id: 'std_bom_table',
        name: 'DIN 6771 Bill of Materials (BOM)',
        description: 'Standard 180x42mm Engineering Parts List with Item, Part Name, Qty, Material & Weight columns',
        category: 'TitleBlocks',
        subcategory: 'Tables & Lists',
        basePoint: { x: 0, y: 0 },
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
        entities: [
            // Outer frame 180 x 42
            createLineEntity({ x: 0, y: 0 }, { x: 180, y: 0 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 180, y: 0 }, { x: 180, y: 42 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 180, y: 42 }, { x: 0, y: 42 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 0, y: 42 }, { x: 0, y: 0 }, 'layer-0', '#3ad0e6'),

            // Horizontal row lines (header at 35, rows at 28, 21, 14, 7)
            createLineEntity({ x: 0, y: 35 }, { x: 180, y: 35 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 0, y: 28 }, { x: 180, y: 28 }, 'layer-0', '#334155'),
            createLineEntity({ x: 0, y: 21 }, { x: 180, y: 21 }, 'layer-0', '#334155'),
            createLineEntity({ x: 0, y: 14 }, { x: 180, y: 14 }, 'layer-0', '#334155'),
            createLineEntity({ x: 0, y: 7 }, { x: 180, y: 7 }, 'layer-0', '#334155'),

            // Vertical column dividers (ITEM: 14, PART NAME: 90, QTY: 18, MATERIAL: 38, WT: 20)
            createLineEntity({ x: 14, y: 0 }, { x: 14, y: 42 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 104, y: 0 }, { x: 104, y: 42 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 122, y: 0 }, { x: 122, y: 42 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 160, y: 0 }, { x: 160, y: 42 }, 'layer-0', '#3ad0e6'),

            // Header Labels
            createTextEntity({ x: 7, y: 38.5 }, 'ITEM', 2.2, 'layer-0', '#3ad0e6', 'center', true),
            createTextEntity({ x: 59, y: 38.5 }, 'DESIGNATION / DESCRIPTION', 2.2, 'layer-0', '#3ad0e6', 'center', true),
            createTextEntity({ x: 113, y: 38.5 }, 'QTY', 2.2, 'layer-0', '#3ad0e6', 'center', true),
            createTextEntity({ x: 141, y: 38.5 }, 'MATERIAL', 2.2, 'layer-0', '#3ad0e6', 'center', true),
            createTextEntity({ x: 170, y: 38.5 }, 'WEIGHT', 2.2, 'layer-0', '#3ad0e6', 'center', true),

            // Row 01
            createTextEntity({ x: 7, y: 31.5 }, '01', 2.2, 'layer-0', '#e7edf4', 'center'),
            createTextEntity({ x: 17, y: 31.5 }, 'MAIN SPUR GEAR m=2.5 z=34', 2.2, 'layer-0', '#e7edf4'),
            createTextEntity({ x: 113, y: 31.5 }, '1', 2.2, 'layer-0', '#e7edf4', 'center'),
            createTextEntity({ x: 125, y: 31.5 }, '16MnCr5 Case Hard.', 2.0, 'layer-0', '#8a96a6'),
            createTextEntity({ x: 170, y: 31.5 }, '0.62 kg', 2.0, 'layer-0', '#8a96a6', 'center'),

            // Row 02
            createTextEntity({ x: 7, y: 24.5 }, '02', 2.2, 'layer-0', '#e7edf4', 'center'),
            createTextEntity({ x: 17, y: 24.5 }, 'DRIVE SHAFT d=20 L=180', 2.2, 'layer-0', '#e7edf4'),
            createTextEntity({ x: 113, y: 24.5 }, '1', 2.2, 'layer-0', '#e7edf4', 'center'),
            createTextEntity({ x: 125, y: 24.5 }, '42CrMo4+QT', 2.0, 'layer-0', '#8a96a6'),
            createTextEntity({ x: 170, y: 24.5 }, '0.44 kg', 2.0, 'layer-0', '#8a96a6', 'center'),

            // Row 03
            createTextEntity({ x: 7, y: 17.5 }, '03', 2.2, 'layer-0', '#e7edf4', 'center'),
            createTextEntity({ x: 17, y: 17.5 }, 'DEEP GROOVE BEARING 6204-2RS', 2.2, 'layer-0', '#e7edf4'),
            createTextEntity({ x: 113, y: 17.5 }, '2', 2.2, 'layer-0', '#e7edf4', 'center'),
            createTextEntity({ x: 125, y: 17.5 }, '100Cr6 Standard', 2.0, 'layer-0', '#8a96a6'),
            createTextEntity({ x: 170, y: 17.5 }, '0.22 kg', 2.0, 'layer-0', '#8a96a6', 'center'),

            // Row 04
            createTextEntity({ x: 7, y: 10.5 }, '04', 2.2, 'layer-0', '#e7edf4', 'center'),
            createTextEntity({ x: 17, y: 10.5 }, 'SHAFT CIRCLIP DIN 471 20x1.2', 2.2, 'layer-0', '#e7edf4'),
            createTextEntity({ x: 113, y: 10.5 }, '2', 2.2, 'layer-0', '#e7edf4', 'center'),
            createTextEntity({ x: 125, y: 10.5 }, 'Spring Steel Phosp.', 2.0, 'layer-0', '#8a96a6'),
            createTextEntity({ x: 170, y: 10.5 }, '0.01 kg', 2.0, 'layer-0', '#8a96a6', 'center'),

            // Row 05
            createTextEntity({ x: 7, y: 3.5 }, '05', 2.2, 'layer-0', '#e7edf4', 'center'),
            createTextEntity({ x: 17, y: 3.5 }, 'HEX SOCKET CAP SCREW M8x25 DIN 912', 2.2, 'layer-0', '#e7edf4'),
            createTextEntity({ x: 113, y: 3.5 }, '4', 2.2, 'layer-0', '#e7edf4', 'center'),
            createTextEntity({ x: 125, y: 3.5 }, 'Steel Gr 8.8 Zn', 2.0, 'layer-0', '#8a96a6'),
            createTextEntity({ x: 170, y: 3.5 }, '0.06 kg', 2.0, 'layer-0', '#8a96a6', 'center'),
        ]
    },

    // Revision History Table
    {
        id: 'std_revision_table',
        name: 'Revision History Table',
        description: 'Standard 180x28mm Engineering Revision Block for tracking design changes',
        category: 'TitleBlocks',
        subcategory: 'Tables & Lists',
        basePoint: { x: 0, y: 0 },
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
        entities: [
            createLineEntity({ x: 0, y: 0 }, { x: 180, y: 0 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 180, y: 0 }, { x: 180, y: 28 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 180, y: 28 }, { x: 0, y: 28 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 0, y: 28 }, { x: 0, y: 0 }, 'layer-0', '#3ad0e6'),

            // Rows: Header at 21, row 2 at 14, row 1 at 7
            createLineEntity({ x: 0, y: 21 }, { x: 180, y: 21 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 0, y: 14 }, { x: 180, y: 14 }, 'layer-0', '#334155'),
            createLineEntity({ x: 0, y: 7 }, { x: 180, y: 7 }, 'layer-0', '#334155'),

            // Columns (REV: 14, ZONE: 16, DESCRIPTION: 95, DATE: 30, APP: 25)
            createLineEntity({ x: 14, y: 0 }, { x: 14, y: 28 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 30, y: 0 }, { x: 30, y: 28 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 125, y: 0 }, { x: 125, y: 28 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 155, y: 0 }, { x: 155, y: 28 }, 'layer-0', '#3ad0e6'),

            // Header
            createTextEntity({ x: 7, y: 24.5 }, 'REV', 2.2, 'layer-0', '#3ad0e6', 'center', true),
            createTextEntity({ x: 22, y: 24.5 }, 'ZONE', 2.2, 'layer-0', '#3ad0e6', 'center', true),
            createTextEntity({ x: 77, y: 24.5 }, 'REVISION DESCRIPTION', 2.2, 'layer-0', '#3ad0e6', 'center', true),
            createTextEntity({ x: 140, y: 24.5 }, 'DATE', 2.2, 'layer-0', '#3ad0e6', 'center', true),
            createTextEntity({ x: 167, y: 24.5 }, 'APPROVED', 2.2, 'layer-0', '#3ad0e6', 'center', true),

            // Entries
            createTextEntity({ x: 7, y: 17.5 }, '01', 2.2, 'layer-0', '#e7edf4', 'center'),
            createTextEntity({ x: 22, y: 17.5 }, 'B3', 2.2, 'layer-0', '#8a96a6', 'center'),
            createTextEntity({ x: 33, y: 17.5 }, 'Initial release for prototype tooling', 2.0, 'layer-0', '#e7edf4'),
            createTextEntity({ x: 140, y: 17.5 }, '2026-08-10', 2.0, 'layer-0', '#8a96a6', 'center'),
            createTextEntity({ x: 167, y: 17.5 }, 'CHIEF', 2.0, 'layer-0', '#3dd68c', 'center'),

            createTextEntity({ x: 7, y: 10.5 }, '02', 2.2, 'layer-0', '#e7edf4', 'center'),
            createTextEntity({ x: 22, y: 10.5 }, 'C2', 2.2, 'layer-0', '#8a96a6', 'center'),
            createTextEntity({ x: 33, y: 10.5 }, 'Changed circlip groove DIN 471 tolerance to h11', 2.0, 'layer-0', '#e7edf4'),
            createTextEntity({ x: 140, y: 10.5 }, '2026-09-02', 2.0, 'layer-0', '#8a96a6', 'center'),
            createTextEntity({ x: 167, y: 10.5 }, 'CHIEF', 2.0, 'layer-0', '#3dd68c', 'center'),

            createTextEntity({ x: 7, y: 3.5 }, '03', 2.2, 'layer-0', '#e7edf4', 'center'),
            createTextEntity({ x: 22, y: 3.5 }, 'A4', 2.2, 'layer-0', '#8a96a6', 'center'),
            createTextEntity({ x: 33, y: 3.5 }, 'Added hard anodizing requirement per MIL-A-8625', 2.0, 'layer-0', '#e7edf4'),
            createTextEntity({ x: 140, y: 3.5 }, '2026-09-13', 2.0, 'layer-0', '#8a96a6', 'center'),
            createTextEntity({ x: 167, y: 3.5 }, 'ENG', 2.0, 'layer-0', '#3dd68c', 'center'),
        ]
    },

    // ISO 2768-mK General Tolerances Stamp
    {
        id: 'std_iso2768_stamp',
        name: 'ISO 2768-mK General Tolerances Stamp',
        description: 'Standard engineering callout table for medium linear and fine angular tolerances',
        category: 'TitleBlocks',
        subcategory: 'Stamps & Notes',
        basePoint: { x: 0, y: 0 },
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
        entities: [
            createLineEntity({ x: 0, y: 0 }, { x: 80, y: 0 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 80, y: 0 }, { x: 80, y: 26 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 80, y: 26 }, { x: 0, y: 26 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 0, y: 26 }, { x: 0, y: 0 }, 'layer-0', '#3ad0e6'),

            createLineEntity({ x: 0, y: 20 }, { x: 80, y: 20 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 0, y: 15 }, { x: 80, y: 15 }, 'layer-0', '#334155'),
            createLineEntity({ x: 0, y: 10 }, { x: 80, y: 10 }, 'layer-0', '#334155'),
            createLineEntity({ x: 0, y: 5 }, { x: 80, y: 5 }, 'layer-0', '#334155'),

            createLineEntity({ x: 50, y: 0 }, { x: 50, y: 20 }, 'layer-0', '#334155'),

            createTextEntity({ x: 40, y: 23 }, 'GENERAL TOLERANCES ISO 2768-mK', 2.2, 'layer-0', '#3ad0e6', 'center', true),

            createTextEntity({ x: 5, y: 16.5 }, '0.5 to 6 mm', 1.9, 'layer-0', '#8a96a6'),
            createTextEntity({ x: 65, y: 16.5 }, '±0.1 mm', 1.9, 'layer-0', '#e7edf4', 'center'),

            createTextEntity({ x: 5, y: 11.5 }, 'over 6 to 30 mm', 1.9, 'layer-0', '#8a96a6'),
            createTextEntity({ x: 65, y: 11.5 }, '±0.2 mm', 1.9, 'layer-0', '#e7edf4', 'center'),

            createTextEntity({ x: 5, y: 6.5 }, 'over 30 to 120 mm', 1.9, 'layer-0', '#8a96a6'),
            createTextEntity({ x: 65, y: 6.5 }, '±0.3 mm', 1.9, 'layer-0', '#e7edf4', 'center'),

            createTextEntity({ x: 5, y: 1.5 }, 'over 120 to 400 mm', 1.9, 'layer-0', '#8a96a6'),
            createTextEntity({ x: 65, y: 1.5 }, '±0.5 mm', 1.9, 'layer-0', '#e7edf4', 'center'),
        ]
    },

    // Standard Shop Notes Stamp
    {
        id: 'std_shop_notes',
        name: 'Standard Manufacturing Notes Stamp',
        description: 'Standard shop floor notes for deburring, cleaning, surface treatment and inspection',
        category: 'TitleBlocks',
        subcategory: 'Stamps & Notes',
        basePoint: { x: 0, y: 0 },
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
        entities: [
            createLineEntity({ x: 0, y: 0 }, { x: 120, y: 0 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 120, y: 0 }, { x: 120, y: 32 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 120, y: 32 }, { x: 0, y: 32 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 0, y: 32 }, { x: 0, y: 0 }, 'layer-0', '#3ad0e6'),

            createTextEntity({ x: 5, y: 26 }, 'GENERAL MANUFACTURING NOTES:', 2.4, 'layer-0', '#3ad0e6', 'left', true),
            createTextEntity({ x: 5, y: 20 }, '1. ALL DIMENSIONS IN MILLIMETERS UNLESS SPECIFIED.', 2.0, 'layer-0', '#e7edf4'),
            createTextEntity({ x: 5, y: 15 }, '2. DEBURR AND BREAK ALL SHARP EDGES 0.2 - 0.4 mm.', 2.0, 'layer-0', '#e7edf4'),
            createTextEntity({ x: 5, y: 10 }, '3. SURFACE FINISH: ANODIZE BLACK MIL-A-8625 TYPE II CL 2.', 2.0, 'layer-0', '#e7edf4'),
            createTextEntity({ x: 5, y: 5 }, '4. 100% CMM INSPECTION REQUIRED ON CRITICAL PCD HOLES.', 2.0, 'layer-0', '#e7edf4'),
        ]
    },

    // Confidentiality Notice Stamp
    {
        id: 'std_confidentiality_stamp',
        name: 'Proprietary & Confidential Stamp',
        description: 'Legal warning notice regarding proprietary engineering data and trade secrets',
        category: 'TitleBlocks',
        subcategory: 'Stamps & Notes',
        basePoint: { x: 0, y: 0 },
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
        entities: [
            createLineEntity({ x: 0, y: 0 }, { x: 110, y: 0 }, 'layer-0', '#e85d5d'),
            createLineEntity({ x: 110, y: 0 }, { x: 110, y: 20 }, 'layer-0', '#e85d5d'),
            createLineEntity({ x: 110, y: 20 }, { x: 0, y: 20 }, 'layer-0', '#e85d5d'),
            createLineEntity({ x: 0, y: 20 }, { x: 0, y: 0 }, 'layer-0', '#e85d5d'),

            createTextEntity({ x: 55, y: 14 }, 'CONFIDENTIAL & PROPRIETARY', 2.4, 'layer-0', '#e85d5d', 'center', true),
            createTextEntity({ x: 55, y: 8 }, 'PROPERTY OF ALUCALC PRECISION ENGINEERING', 1.8, 'layer-0', '#8a96a6', 'center'),
            createTextEntity({ x: 55, y: 3 }, 'DO NOT COPY, DISTRIBUTE OR DISCLOSE WITHOUT CONSENT', 1.6, 'layer-0', '#8a96a6', 'center'),
        ]
    },


    // ═══════════════════════════════════════════════════════════════
    // 3. TECHNICAL DRAWING SYMBOLS (ISO 1101, ISO 1302, ISO 2553, ISO 5456)
    // ═══════════════════════════════════════════════════════════════

    // GD&T: Flatness (ISO 1101)
    {
        id: 'std_gdt_flatness',
        name: 'GD&T Flatness [ ⏥ | 0.02 ]',
        description: 'ISO 1101 Geometric Tolerance Feature Control Frame for Flatness',
        category: 'Symbols',
        subcategory: 'GD&T',
        basePoint: { x: 0, y: 0 },
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
        entities: [
            createLineEntity({ x: 0, y: 0 }, { x: 30, y: 0 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 30, y: 0 }, { x: 30, y: 10 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 30, y: 10 }, { x: 0, y: 10 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 0, y: 10 }, { x: 0, y: 0 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 10, y: 0 }, { x: 10, y: 10 }, 'layer-0', '#3ad0e6'),
            // Symbol: Flatness parallelogram (⏥)
            createLineEntity({ x: 2.5, y: 3 }, { x: 7, y: 3 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 7, y: 3 }, { x: 8, y: 7 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 8, y: 7 }, { x: 3.5, y: 7 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 3.5, y: 7 }, { x: 2.5, y: 3 }, 'layer-0', '#3ad0e6'),
            // Tolerance Value
            createTextEntity({ x: 20, y: 4.5 }, '0.02', 3.5, 'layer-0', '#e7edf4', 'center'),
        ]
    },

    // GD&T: Perpendicularity (ISO 1101)
    {
        id: 'std_gdt_perpendicularity',
        name: 'GD&T Perpendicularity [ ⟂ | 0.05 | A ]',
        description: 'ISO 1101 Feature Control Frame for Perpendicularity with Datum A reference',
        category: 'Symbols',
        subcategory: 'GD&T',
        basePoint: { x: 0, y: 0 },
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
        entities: [
            createLineEntity({ x: 0, y: 0 }, { x: 42, y: 0 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 42, y: 0 }, { x: 42, y: 10 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 42, y: 10 }, { x: 0, y: 10 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 0, y: 10 }, { x: 0, y: 0 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 10, y: 0 }, { x: 10, y: 10 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 32, y: 0 }, { x: 32, y: 10 }, 'layer-0', '#3ad0e6'),
            // Symbol: Perpendicularity (⟂)
            createLineEntity({ x: 2.5, y: 3 }, { x: 7.5, y: 3 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 5, y: 3 }, { x: 5, y: 8 }, 'layer-0', '#3ad0e6'),
            // Value
            createTextEntity({ x: 21, y: 4.5 }, '0.05', 3.5, 'layer-0', '#e7edf4', 'center'),
            // Datum A
            createTextEntity({ x: 37, y: 4.5 }, 'A', 3.5, 'layer-0', '#3dd68c', 'center', true),
        ]
    },

    // GD&T: Parallelism (ISO 1101)
    {
        id: 'std_gdt_parallelism',
        name: 'GD&T Parallelism [ ∥ | 0.03 | A ]',
        description: 'ISO 1101 Feature Control Frame for Parallelism with Datum A',
        category: 'Symbols',
        subcategory: 'GD&T',
        basePoint: { x: 0, y: 0 },
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
        entities: [
            createLineEntity({ x: 0, y: 0 }, { x: 42, y: 0 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 42, y: 0 }, { x: 42, y: 10 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 42, y: 10 }, { x: 0, y: 10 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 0, y: 10 }, { x: 0, y: 0 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 10, y: 0 }, { x: 10, y: 10 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 32, y: 0 }, { x: 32, y: 10 }, 'layer-0', '#3ad0e6'),
            // Symbol: Parallelism (∥ at 60 deg)
            createLineEntity({ x: 3.5, y: 2.5 }, { x: 5.5, y: 7.5 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 5.5, y: 2.5 }, { x: 7.5, y: 7.5 }, 'layer-0', '#3ad0e6'),
            createTextEntity({ x: 21, y: 4.5 }, '0.03', 3.5, 'layer-0', '#e7edf4', 'center'),
            createTextEntity({ x: 37, y: 4.5 }, 'A', 3.5, 'layer-0', '#3dd68c', 'center', true),
        ]
    },

    // GD&T: True Position (ISO 1101 / ASME Y14.5)
    {
        id: 'std_gdt_position',
        name: 'GD&T True Position [ ⌖ | ⌀0.05 Ⓜ | A | B ]',
        description: 'ISO 1101 True Position Feature Control Frame with Diameter symbol & Datums A & B',
        category: 'Symbols',
        subcategory: 'GD&T',
        basePoint: { x: 0, y: 0 },
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
        entities: [
            createLineEntity({ x: 0, y: 0 }, { x: 62, y: 0 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 62, y: 0 }, { x: 62, y: 10 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 62, y: 10 }, { x: 0, y: 10 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 0, y: 10 }, { x: 0, y: 0 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 10, y: 0 }, { x: 10, y: 10 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 42, y: 0 }, { x: 42, y: 10 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 52, y: 0 }, { x: 52, y: 10 }, 'layer-0', '#3ad0e6'),
            // Symbol: True Position crosshair in circle (⌖)
            createCircleEntity({ x: 5, y: 5 }, 2.6, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 1.5, y: 5 }, { x: 8.5, y: 5 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 5, y: 1.5 }, { x: 5, y: 8.5 }, 'layer-0', '#3ad0e6'),
            // Value
            createTextEntity({ x: 26, y: 4.5 }, '⌀0.05 Ⓜ', 3.2, 'layer-0', '#e7edf4', 'center'),
            // Datum A & B
            createTextEntity({ x: 47, y: 4.5 }, 'A', 3.5, 'layer-0', '#3dd68c', 'center', true),
            createTextEntity({ x: 57, y: 4.5 }, 'B', 3.5, 'layer-0', '#3dd68c', 'center', true),
        ]
    },

    // GD&T: Circular Runout (ISO 1101)
    {
        id: 'std_gdt_runout',
        name: 'GD&T Circular Runout [ ↗ | 0.03 | A ]',
        description: 'ISO 1101 Feature Control Frame for Circular Runout with Datum A',
        category: 'Symbols',
        subcategory: 'GD&T',
        basePoint: { x: 0, y: 0 },
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
        entities: [
            createLineEntity({ x: 0, y: 0 }, { x: 42, y: 0 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 42, y: 0 }, { x: 42, y: 10 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 42, y: 10 }, { x: 0, y: 10 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 0, y: 10 }, { x: 0, y: 0 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 10, y: 0 }, { x: 10, y: 10 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 32, y: 0 }, { x: 32, y: 10 }, 'layer-0', '#3ad0e6'),
            // Symbol: Runout diagonal arrow (↗)
            createLineEntity({ x: 3, y: 3 }, { x: 7, y: 7.5 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 4.5, y: 7.5 }, { x: 7, y: 7.5 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 7, y: 5 }, { x: 7, y: 7.5 }, 'layer-0', '#3ad0e6'),
            createTextEntity({ x: 21, y: 4.5 }, '0.03', 3.5, 'layer-0', '#e7edf4', 'center'),
            createTextEntity({ x: 37, y: 4.5 }, 'A', 3.5, 'layer-0', '#3dd68c', 'center', true),
        ]
    },

    // Datum Feature Symbol [ A ]
    {
        id: 'std_datum_a',
        name: 'Datum Feature Symbol [ A ]',
        description: 'ISO 5459 Datum Feature Symbol A with filled base triangle and boxed letter',
        category: 'Symbols',
        subcategory: 'GD&T',
        basePoint: { x: 0, y: 0 },
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
        entities: [
            // Triangle at bottom (base on surface)
            createLineEntity({ x: -3, y: 0 }, { x: 3, y: 0 }, 'layer-0', '#3dd68c'),
            createLineEntity({ x: -3, y: 0 }, { x: 0, y: 4 }, 'layer-0', '#3dd68c'),
            createLineEntity({ x: 3, y: 0 }, { x: 0, y: 4 }, 'layer-0', '#3dd68c'),
            // Stem
            createLineEntity({ x: 0, y: 4 }, { x: 0, y: 10 }, 'layer-0', '#3dd68c'),
            // Box 8x8
            createLineEntity({ x: -4, y: 10 }, { x: 4, y: 10 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 4, y: 10 }, { x: 4, y: 18 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 4, y: 18 }, { x: -4, y: 18 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: -4, y: 18 }, { x: -4, y: 10 }, 'layer-0', '#3ad0e6'),
            // Letter A
            createTextEntity({ x: 0, y: 13.5 }, 'A', 4.5, 'layer-0', '#3dd68c', 'center', true),
        ]
    },

    // Datum Feature Symbol [ B ]
    {
        id: 'std_datum_b',
        name: 'Datum Feature Symbol [ B ]',
        description: 'ISO 5459 Datum Feature Symbol B with filled base triangle and boxed letter',
        category: 'Symbols',
        subcategory: 'GD&T',
        basePoint: { x: 0, y: 0 },
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
        entities: [
            createLineEntity({ x: -3, y: 0 }, { x: 3, y: 0 }, 'layer-0', '#3dd68c'),
            createLineEntity({ x: -3, y: 0 }, { x: 0, y: 4 }, 'layer-0', '#3dd68c'),
            createLineEntity({ x: 3, y: 0 }, { x: 0, y: 4 }, 'layer-0', '#3dd68c'),
            createLineEntity({ x: 0, y: 4 }, { x: 0, y: 10 }, 'layer-0', '#3dd68c'),
            createLineEntity({ x: -4, y: 10 }, { x: 4, y: 10 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 4, y: 10 }, { x: 4, y: 18 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 4, y: 18 }, { x: -4, y: 18 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: -4, y: 18 }, { x: -4, y: 10 }, 'layer-0', '#3ad0e6'),
            createTextEntity({ x: 0, y: 13.5 }, 'B', 4.5, 'layer-0', '#3dd68c', 'center', true),
        ]
    },

    // ═══════════════════════════════════════════════════════════════
    // 3.1 SURFACE TEXTURE SUITE (ISO 1302 / DIN EN ISO 1302 / ISO 21920)
    // ═══════════════════════════════════════════════════════════════

    // --- Group 1: Standard Machined Ra Roughness Grades (ISO 1302 Closed Bar) ---
    createSurfaceFinishBlock({
        id: 'std_surface_ra005',
        name: 'Surface Finish Ra 0.05 μm (ISO 1302)',
        description: 'ISO 1302 Superfinish / Mirror Polished surface with Ra 0.05 μm',
        symbolType: 'machining_required',
        roughnessParameter: 'Ra',
        roughnessValue: '0.05'
    }),
    createSurfaceFinishBlock({
        id: 'std_surface_ra01',
        name: 'Surface Finish Ra 0.1 μm (ISO 1302)',
        description: 'ISO 1302 Precision Lapped / Superfinished surface with Ra 0.1 μm',
        symbolType: 'machining_required',
        roughnessParameter: 'Ra',
        roughnessValue: '0.1'
    }),
    createSurfaceFinishBlock({
        id: 'std_surface_ra02',
        name: 'Surface Finish Ra 0.2 μm (ISO 1302)',
        description: 'ISO 1302 Honed / Fine Lapped bearing journal surface with Ra 0.2 μm',
        symbolType: 'machining_required',
        roughnessParameter: 'Ra',
        roughnessValue: '0.2'
    }),
    createSurfaceFinishBlock({
        id: 'std_surface_ra04',
        name: 'Surface Finish Ra 0.4 μm (ISO 1302)',
        description: 'ISO 1302 Precision Cylindrical Ground / Fine Turned seal surface with Ra 0.4 μm',
        symbolType: 'machining_required',
        roughnessParameter: 'Ra',
        roughnessValue: '0.4'
    }),
    createSurfaceFinishBlock({
        id: 'std_surface_ra08',
        name: 'Surface Finish Ra 0.8 μm (ISO 1302)',
        description: 'ISO 1302 Surface Ground / Reamed H7 bore surface with Ra 0.8 μm',
        symbolType: 'machining_required',
        roughnessParameter: 'Ra',
        roughnessValue: '0.8'
    }),
    createSurfaceFinishBlock({
        id: 'std_surface_ra16',
        name: 'Surface Finish Ra 1.6 μm (ISO 1302)',
        description: 'ISO 1302 Fine Turned / Finish Milled bearing seat surface with Ra 1.6 μm',
        symbolType: 'machining_required',
        roughnessParameter: 'Ra',
        roughnessValue: '1.6'
    }),
    createSurfaceFinishBlock({
        id: 'std_surface_ra32',
        name: 'Surface Finish Ra 3.2 μm (ISO 1302)',
        description: 'ISO 1302 Commercial Machined (General Milling / Turning) surface with Ra 3.2 μm',
        symbolType: 'machining_required',
        roughnessParameter: 'Ra',
        roughnessValue: '3.2'
    }),
    createSurfaceFinishBlock({
        id: 'std_surface_ra63',
        name: 'Surface Finish Ra 6.3 μm (ISO 1302)',
        description: 'ISO 1302 Rough Machined / Fast Milled / Bandsawed surface with Ra 6.3 μm',
        symbolType: 'machining_required',
        roughnessParameter: 'Ra',
        roughnessValue: '6.3'
    }),
    createSurfaceFinishBlock({
        id: 'std_surface_ra125',
        name: 'Surface Finish Ra 12.5 μm (ISO 1302)',
        description: 'ISO 1302 Coarse Machined / Heavy Planed / Torched surface with Ra 12.5 μm',
        symbolType: 'machining_required',
        roughnessParameter: 'Ra',
        roughnessValue: '12.5'
    }),
    createSurfaceFinishBlock({
        id: 'std_surface_ra25',
        name: 'Surface Finish Ra 25 μm (ISO 1302)',
        description: 'ISO 1302 Heavy Roughing / Flame Cut edge with Ra 25 μm',
        symbolType: 'machining_required',
        roughnessParameter: 'Ra',
        roughnessValue: '25'
    }),

    // --- Group 2: Standard Rz Parameters (DIN EN ISO 4287 / ISO 1302) ---
    createSurfaceFinishBlock({
        id: 'std_surface_rz16',
        name: 'Surface Finish Rz 1.6 μm (ISO 1302)',
        description: 'ISO 1302 Precision Ground / Lapped profile peak-to-valley height Rz 1.6 μm',
        symbolType: 'machining_required',
        roughnessParameter: 'Rz',
        roughnessValue: '1.6'
    }),
    createSurfaceFinishBlock({
        id: 'std_surface_rz40',
        name: 'Surface Finish Rz 4.0 μm (ISO 1302)',
        description: 'ISO 1302 Ground / Fine Reamed profile peak-to-valley height Rz 4.0 μm',
        symbolType: 'machining_required',
        roughnessParameter: 'Rz',
        roughnessValue: '4.0'
    }),
    createSurfaceFinishBlock({
        id: 'std_surface_rz63',
        name: 'Surface Finish Rz 6.3 μm (ISO 1302)',
        description: 'ISO 1302 Fine Milled / Fine Turned profile peak-to-valley height Rz 6.3 μm',
        symbolType: 'machining_required',
        roughnessParameter: 'Rz',
        roughnessValue: '6.3'
    }),
    createSurfaceFinishBlock({
        id: 'std_surface_rz16_m',
        name: 'Surface Finish Rz 16 μm (ISO 1302)',
        description: 'ISO 1302 Standard Commercial Machined profile height Rz 16 μm',
        symbolType: 'machining_required',
        roughnessParameter: 'Rz',
        roughnessValue: '16'
    }),
    createSurfaceFinishBlock({
        id: 'std_surface_rz25',
        name: 'Surface Finish Rz 25 μm (ISO 1302)',
        description: 'ISO 1302 Rough Machined profile peak-to-valley height Rz 25 μm',
        symbolType: 'machining_required',
        roughnessParameter: 'Rz',
        roughnessValue: '25'
    }),
    createSurfaceFinishBlock({
        id: 'std_surface_rz63_m',
        name: 'Surface Finish Rz 63 μm (ISO 1302)',
        description: 'ISO 1302 Coarse Cut / Sawed profile peak-to-valley height Rz 63 μm',
        symbolType: 'machining_required',
        roughnessParameter: 'Rz',
        roughnessValue: '63'
    }),

    // --- Group 3: Basic Symbol (Any Process Permitted) ---
    createSurfaceFinishBlock({
        id: 'std_surface_basic',
        name: 'Basic Surface Symbol (ISO 1302)',
        description: 'ISO 1302 Basic Open V Symbol (Any manufacturing process permitted)',
        symbolType: 'any_process'
    }),
    createSurfaceFinishBlock({
        id: 'std_surface_basic_ra08',
        name: 'Basic Surface Ra 0.8 (Any Process)',
        description: 'ISO 1302 Basic surface symbol with Ra 0.8 μm (Any process permitted)',
        symbolType: 'any_process',
        roughnessParameter: 'Ra',
        roughnessValue: '0.8'
    }),
    createSurfaceFinishBlock({
        id: 'std_surface_basic_ra16',
        name: 'Basic Surface Ra 1.6 (Any Process)',
        description: 'ISO 1302 Basic surface symbol with Ra 1.6 μm (Any process permitted)',
        symbolType: 'any_process',
        roughnessParameter: 'Ra',
        roughnessValue: '1.6'
    }),
    createSurfaceFinishBlock({
        id: 'std_surface_basic_ra32',
        name: 'Basic Surface Ra 3.2 (Any Process)',
        description: 'ISO 1302 Basic surface symbol with Ra 3.2 μm (Any process permitted)',
        symbolType: 'any_process',
        roughnessParameter: 'Ra',
        roughnessValue: '3.2'
    }),
    createSurfaceFinishBlock({
        id: 'std_surface_basic_ra63',
        name: 'Basic Surface Ra 6.3 (Any Process)',
        description: 'ISO 1302 Basic surface symbol with Ra 6.3 μm (Any process permitted)',
        symbolType: 'any_process',
        roughnessParameter: 'Ra',
        roughnessValue: '6.3'
    }),
    createSurfaceFinishBlock({
        id: 'std_surface_basic_ra125',
        name: 'Basic Surface Ra 12.5 (Any Process)',
        description: 'ISO 1302 Basic surface symbol with Ra 12.5 μm (Any process permitted)',
        symbolType: 'any_process',
        roughnessParameter: 'Ra',
        roughnessValue: '12.5'
    }),

    // --- Group 4: Material Removal Prohibited (ISO Inscribed Tangent Circle) ---
    createSurfaceFinishBlock({
        id: 'std_surface_prohibited',
        name: 'Material Removal Prohibited (ISO 1302)',
        description: 'ISO 1302 Material Removal Prohibited with exact tangent inscribed circle (As-cast, forged, no machining)',
        symbolType: 'machining_prohibited'
    }),
    createSurfaceFinishBlock({
        id: 'std_surface_cast_ra125',
        name: 'As-Cast Surface Ra 12.5 (ISO 1302)',
        description: 'ISO 1302 Sand / Die Cast unmachined surface with Ra 12.5 μm',
        symbolType: 'machining_prohibited',
        roughnessParameter: 'Ra',
        roughnessValue: '12.5',
        manufacturingMethod: 'As-Cast'
    }),
    createSurfaceFinishBlock({
        id: 'std_surface_cast_ra63',
        name: 'Investment Cast Surface Ra 6.3',
        description: 'ISO 1302 Precision Investment Cast surface with Ra 6.3 μm',
        symbolType: 'machining_prohibited',
        roughnessParameter: 'Ra',
        roughnessValue: '6.3',
        manufacturingMethod: 'Precision Cast'
    }),
    createSurfaceFinishBlock({
        id: 'std_surface_extruded_ra63',
        name: 'Extruded Aluminum Ra 6.3',
        description: 'ISO 1302 Unmachined Extruded Aluminum profile surface with Ra 6.3 μm',
        symbolType: 'machining_prohibited',
        roughnessParameter: 'Ra',
        roughnessValue: '6.3',
        manufacturingMethod: 'Extruded'
    }),
    createSurfaceFinishBlock({
        id: 'std_surface_colddrawn_ra32',
        name: 'Cold Drawn Surface Ra 3.2',
        description: 'ISO 1302 Cold Drawn / Cold Rolled bright bar surface with Ra 3.2 μm',
        symbolType: 'machining_prohibited',
        roughnessParameter: 'Ra',
        roughnessValue: '3.2',
        manufacturingMethod: 'Cold Drawn'
    }),
    createSurfaceFinishBlock({
        id: 'std_surface_sheet_ra16',
        name: 'Sheet Metal Surface Ra 1.6',
        description: 'ISO 1302 Cold-rolled sheet metal surface with Ra 1.6 μm',
        symbolType: 'machining_prohibited',
        roughnessParameter: 'Ra',
        roughnessValue: '1.6',
        manufacturingMethod: 'Sheet Metal'
    }),

    // --- Group 5: Surface Lay Directions (İşleme İzi Yönleri) ---
    createSurfaceFinishBlock({
        id: 'std_surface_lay_parallel',
        name: 'Lay Direction Parallel = (Ra 3.2)',
        description: 'ISO 1302 Parallel lay direction (=) with Ra 3.2 μm',
        symbolType: 'machining_required',
        roughnessParameter: 'Ra',
        roughnessValue: '3.2',
        layDirection: '='
    }),
    createSurfaceFinishBlock({
        id: 'std_surface_lay_perpendicular',
        name: 'Lay Direction Perpendicular ⊥ (Ra 3.2)',
        description: 'ISO 1302 Perpendicular lay direction (⊥) with Ra 3.2 μm',
        symbolType: 'machining_required',
        roughnessParameter: 'Ra',
        roughnessValue: '3.2',
        layDirection: '⊥'
    }),
    createSurfaceFinishBlock({
        id: 'std_surface_lay_crossed',
        name: 'Lay Direction Crossed X (Ra 0.8 Honed)',
        description: 'ISO 1302 Crossed oblique lay direction (X) for cylinder honing with Ra 0.8 μm',
        symbolType: 'machining_required',
        roughnessParameter: 'Ra',
        roughnessValue: '0.8',
        layDirection: 'X',
        manufacturingMethod: 'Honed'
    }),
    createSurfaceFinishBlock({
        id: 'std_surface_lay_multidirectional',
        name: 'Lay Direction Multi M (Ra 1.6)',
        description: 'ISO 1302 Multi-directional lay pattern (M) with Ra 1.6 μm',
        symbolType: 'machining_required',
        roughnessParameter: 'Ra',
        roughnessValue: '1.6',
        layDirection: 'M'
    }),
    createSurfaceFinishBlock({
        id: 'std_surface_lay_circular',
        name: 'Lay Direction Circular C (Ra 3.2 Faced)',
        description: 'ISO 1302 Circular / Concentric lay direction (C) for turned face with Ra 3.2 μm',
        symbolType: 'machining_required',
        roughnessParameter: 'Ra',
        roughnessValue: '3.2',
        layDirection: 'C',
        manufacturingMethod: 'Turned'
    }),
    createSurfaceFinishBlock({
        id: 'std_surface_lay_radial',
        name: 'Lay Direction Radial R (Ra 3.2)',
        description: 'ISO 1302 Approximately radial lay direction (R) with Ra 3.2 μm',
        symbolType: 'machining_required',
        roughnessParameter: 'Ra',
        roughnessValue: '3.2',
        layDirection: 'R'
    }),
    createSurfaceFinishBlock({
        id: 'std_surface_lay_particulate',
        name: 'Lay Direction Particulate P (Ra 1.6 EDM)',
        description: 'ISO 1302 Non-directional particulate lay (P) for EDM / Shot Blasting with Ra 1.6 μm',
        symbolType: 'machining_required',
        roughnessParameter: 'Ra',
        roughnessValue: '1.6',
        layDirection: 'P',
        manufacturingMethod: 'EDM'
    }),

    // --- Group 6: Manufacturing Methods & Treatments Specified ---
    createSurfaceFinishBlock({
        id: 'std_surface_ground_ra04',
        name: 'Ground Finish Ra 0.4 (Taşlanmış)',
        description: 'ISO 1302 Precision Ground surface finish with Ra 0.4 μm',
        symbolType: 'machining_required',
        roughnessParameter: 'Ra',
        roughnessValue: '0.4',
        manufacturingMethod: 'Ground'
    }),
    createSurfaceFinishBlock({
        id: 'std_surface_ground_ra08',
        name: 'Ground Finish Ra 0.8 (Taşlanmış)',
        description: 'ISO 1302 Standard Surface Ground finish with Ra 0.8 μm',
        symbolType: 'machining_required',
        roughnessParameter: 'Ra',
        roughnessValue: '0.8',
        manufacturingMethod: 'Ground'
    }),
    createSurfaceFinishBlock({
        id: 'std_surface_milled_ra16',
        name: 'Milled Finish Ra 1.6 (Frezelenmiş)',
        description: 'ISO 1302 Face Milled finish with Ra 1.6 μm',
        symbolType: 'machining_required',
        roughnessParameter: 'Ra',
        roughnessValue: '1.6',
        manufacturingMethod: 'Milled'
    }),
    createSurfaceFinishBlock({
        id: 'std_surface_turned_ra32',
        name: 'Turned Finish Ra 3.2 (Tornalanmış)',
        description: 'ISO 1302 CNC Turned surface with Ra 3.2 μm',
        symbolType: 'machining_required',
        roughnessParameter: 'Ra',
        roughnessValue: '3.2',
        manufacturingMethod: 'Turned'
    }),
    createSurfaceFinishBlock({
        id: 'std_surface_honed_ra02',
        name: 'Honed Finish Ra 0.2 (Honlanmış)',
        description: 'ISO 1302 Precision Honed cylinder bore with Ra 0.2 μm and crossed lay',
        symbolType: 'machining_required',
        roughnessParameter: 'Ra',
        roughnessValue: '0.2',
        manufacturingMethod: 'Honed',
        layDirection: 'X'
    }),
    createSurfaceFinishBlock({
        id: 'std_surface_polished_ra005',
        name: 'Polished Mirror Ra 0.05 (Polisaj)',
        description: 'ISO 1302 Optical / Mirror Polished surface with Ra 0.05 μm',
        symbolType: 'machining_required',
        roughnessParameter: 'Ra',
        roughnessValue: '0.05',
        manufacturingMethod: 'Polished'
    }),
    createSurfaceFinishBlock({
        id: 'std_surface_lapped_ra01',
        name: 'Lapped Finish Ra 0.1 (Lepleme)',
        description: 'ISO 1302 Flat Lapped precision sealing face with Ra 0.1 μm',
        symbolType: 'machining_required',
        roughnessParameter: 'Ra',
        roughnessValue: '0.1',
        manufacturingMethod: 'Lapped'
    }),
    createSurfaceFinishBlock({
        id: 'std_surface_reamed_ra08',
        name: 'Reamed Bore H7 Ra 0.8 (Raybalanmış)',
        description: 'ISO 1302 Reamed bore surface H7 tolerance with Ra 0.8 μm',
        symbolType: 'machining_required',
        roughnessParameter: 'Ra',
        roughnessValue: '0.8',
        manufacturingMethod: 'Reamed H7'
    }),
    createSurfaceFinishBlock({
        id: 'std_surface_edm_ra16',
        name: 'EDM VDI 24 Ra 1.6 (Elektroerozyon)',
        description: 'ISO 1302 Spark Eroded EDM surface VDI 3400 class 24 with Ra 1.6 μm',
        symbolType: 'machining_required',
        roughnessParameter: 'Ra',
        roughnessValue: '1.6',
        manufacturingMethod: 'EDM VDI 24',
        layDirection: 'P'
    }),
    createSurfaceFinishBlock({
        id: 'std_surface_hardanodized_ra16',
        name: 'Hard Anodized Ra 1.6 (Sert Eloksal)',
        description: 'ISO 1302 Hard Anodized aluminum surface (50μm layer) with Ra 1.6 μm',
        symbolType: 'machining_required',
        roughnessParameter: 'Ra',
        roughnessValue: '1.6',
        manufacturingMethod: 'Hard Anodized'
    }),
    createSurfaceFinishBlock({
        id: 'std_surface_chrome_ra04',
        name: 'Hard Chrome Plated Ra 0.4 (Krom Kaplama)',
        description: 'ISO 1302 Hard Chrome Plated ground piston rod with Ra 0.4 μm',
        symbolType: 'machining_required',
        roughnessParameter: 'Ra',
        roughnessValue: '0.4',
        manufacturingMethod: 'Chrome Plated'
    }),
    createSurfaceFinishBlock({
        id: 'std_surface_shotpeened_ra32',
        name: 'Shot Peened Ra 3.2 (Bilyalı Dövme)',
        description: 'ISO 1302 Fatigue resistant Shot Peened surface with Ra 3.2 μm',
        symbolType: 'machining_required',
        roughnessParameter: 'Ra',
        roughnessValue: '3.2',
        manufacturingMethod: 'Shot Peened',
        layDirection: 'P'
    }),

    // --- Group 7: Dual Limits & Machining Allowances ---
    createSurfaceFinishBlock({
        id: 'std_surface_dual_32_16',
        name: 'Dual Limits Ra 3.2 max / Ra 1.6 min',
        description: 'ISO 1302 Upper and lower roughness tolerance limits (max 3.2 μm / min 1.6 μm)',
        symbolType: 'machining_required',
        roughnessParameter: 'Ra',
        roughnessValue: '3.2 max',
        lowerRoughnessValue: '1.6 min'
    }),
    createSurfaceFinishBlock({
        id: 'std_surface_dual_16_08',
        name: 'Dual Limits Ra 1.6 max / Ra 0.8 min',
        description: 'ISO 1302 Upper and lower roughness tolerance limits (max 1.6 μm / min 0.8 μm)',
        symbolType: 'machining_required',
        roughnessParameter: 'Ra',
        roughnessValue: '1.6 max',
        lowerRoughnessValue: '0.8 min'
    }),
    createSurfaceFinishBlock({
        id: 'std_surface_dual_08_04',
        name: 'Dual Limits Ra 0.8 max / Ra 0.4 min',
        description: 'ISO 1302 Precision upper and lower limits (max 0.8 μm / min 0.4 μm)',
        symbolType: 'machining_required',
        roughnessParameter: 'Ra',
        roughnessValue: '0.8 max',
        lowerRoughnessValue: '0.4 min'
    }),
    createSurfaceFinishBlock({
        id: 'std_surface_allowance_15',
        name: 'Allowance 1.5mm / Ra 1.6 (İşleme Payı)',
        description: 'ISO 1302 Machining allowance 1.5mm on left leg with Ra 1.6 μm',
        symbolType: 'machining_required',
        roughnessParameter: 'Ra',
        roughnessValue: '1.6',
        machiningAllowance: '1.5'
    }),
    createSurfaceFinishBlock({
        id: 'std_surface_allowance_20',
        name: 'Allowance 2.0mm / Ra 3.2 (İşleme Payı)',
        description: 'ISO 1302 Machining allowance 2.0mm on left leg with Ra 3.2 μm',
        symbolType: 'machining_required',
        roughnessParameter: 'Ra',
        roughnessValue: '3.2',
        machiningAllowance: '2.0'
    }),
    createSurfaceFinishBlock({
        id: 'std_surface_allowance_30',
        name: 'Allowance 3.0mm / Ra 6.3 (İşleme Payı)',
        description: 'ISO 1302 Machining allowance 3.0mm on left leg with Ra 6.3 μm',
        symbolType: 'machining_required',
        roughnessParameter: 'Ra',
        roughnessValue: '6.3',
        machiningAllowance: '3.0'
    }),
    createSurfaceFinishBlock({
        id: 'std_surface_allowance_50',
        name: 'Allowance 5.0mm / Ra 12.5 (İşleme Payı)',
        description: 'ISO 1302 Heavy casting machining allowance 5.0mm with Ra 12.5 μm',
        symbolType: 'machining_required',
        roughnessParameter: 'Ra',
        roughnessValue: '12.5',
        machiningAllowance: '5.0'
    }),

    // --- Group 8: All-Around & Drawing Header Collective Callouts ---
    createSurfaceFinishBlock({
        id: 'std_surface_allaround_ra16',
        name: 'All-Around Surface Finish Ra 1.6',
        description: 'ISO 1302 All-Around circle symbol with Ra 1.6 μm across entire workpiece perimeter',
        symbolType: 'machining_required',
        roughnessParameter: 'Ra',
        roughnessValue: '1.6',
        allAround: true
    }),
    createSurfaceFinishBlock({
        id: 'std_surface_allaround_ra32',
        name: 'All-Around Surface Finish Ra 3.2',
        description: 'ISO 1302 All-Around circle symbol with Ra 3.2 μm across entire workpiece perimeter',
        symbolType: 'machining_required',
        roughnessParameter: 'Ra',
        roughnessValue: '3.2',
        allAround: true
    }),
    {
        id: 'std_surface_header_ra32_root',
        name: 'Collective Callout Ra 3.2 ( √ )',
        description: 'ISO 1302 Drawing Header general surface callout: all surfaces Ra 3.2 unless noted',
        category: 'Symbols',
        subcategory: 'Surface Texture',
        basePoint: { x: 0, y: 0 },
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
        entities: createCollectiveCalloutEntities('Ra 3.2', 'machining_required')
    },
    {
        id: 'std_surface_header_ra16_root',
        name: 'Collective Callout Ra 1.6 ( √ )',
        description: 'ISO 1302 Drawing Header general surface callout: all surfaces Ra 1.6 unless noted',
        category: 'Symbols',
        subcategory: 'Surface Texture',
        basePoint: { x: 0, y: 0 },
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
        entities: createCollectiveCalloutEntities('Ra 1.6', 'machining_required')
    },
    {
        id: 'std_surface_header_multi',
        name: 'Header Callout Ra 3.2 (Ra 1.6, Ra 0.8)',
        description: 'ISO 1302 Drawing Header collective callout with secondary roughness list',
        category: 'Symbols',
        subcategory: 'Surface Texture',
        basePoint: { x: 0, y: 0 },
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
        entities: createCollectiveCalloutEntities('Ra 3.2', 'specific_list', 'Ra 1.6, Ra 0.8')
    },
    {
        id: 'std_surface_header_ascast',
        name: 'Header Callout ( ⍜ ) As-Cast',
        description: 'ISO 1302 Drawing Header general unmachined callout with prohibited symbol',
        category: 'Symbols',
        subcategory: 'Surface Texture',
        basePoint: { x: 0, y: 0 },
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
        entities: createCollectiveCalloutEntities('', 'machining_prohibited', 'As-Cast')
    },

    // --- Group 9: Legacy Triangles & Unmachined Wave (DIN 140 / JIS / GOST) ---
    {
        id: 'std_surface_legacy_1tri',
        name: 'Legacy ▽ Single Triangle (Ra 25)',
        description: 'DIN 140 / JIS B 0031 Single Triangle: Rough machining (Ra 25 μm / N10-N11)',
        category: 'Symbols',
        subcategory: 'Surface Texture',
        basePoint: { x: 0, y: 0 },
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
        entities: createLegacyTriangleEntities(1, '▽ Ra 25')
    },
    {
        id: 'std_surface_legacy_2tri',
        name: 'Legacy ▽▽ Double Triangle (Ra 6.3)',
        description: 'DIN 140 / JIS B 0031 Double Triangle: Medium machining (Ra 6.3 μm / N7-N8)',
        category: 'Symbols',
        subcategory: 'Surface Texture',
        basePoint: { x: 0, y: 0 },
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
        entities: createLegacyTriangleEntities(2, '▽▽ Ra 6.3')
    },
    {
        id: 'std_surface_legacy_3tri',
        name: 'Legacy ▽▽▽ Triple Triangle (Ra 1.6)',
        description: 'DIN 140 / JIS B 0031 Triple Triangle: Fine machining / Ground (Ra 1.6 μm / N5-N6)',
        category: 'Symbols',
        subcategory: 'Surface Texture',
        basePoint: { x: 0, y: 0 },
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
        entities: createLegacyTriangleEntities(3, '▽▽▽ Ra 1.6')
    },
    {
        id: 'std_surface_legacy_4tri',
        name: 'Legacy ▽▽▽▽ Quad Triangle (Ra 0.2)',
        description: 'DIN 140 / JIS B 0031 Quad Triangle: Superfinish / Mirror / Honed (Ra 0.2 μm / N2-N3)',
        category: 'Symbols',
        subcategory: 'Surface Texture',
        basePoint: { x: 0, y: 0 },
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
        entities: createLegacyTriangleEntities(4, '▽▽▽▽ Ra 0.2')
    },
    {
        id: 'std_surface_legacy_wave',
        name: 'Legacy ~ Unmachined (Ham Yüzey)',
        description: 'DIN 140 / JIS B 0031 Tilde wave: Unmachined / Raw as-cast or as-forged surface',
        category: 'Symbols',
        subcategory: 'Surface Texture',
        basePoint: { x: 0, y: 0 },
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
        entities: createLegacyTriangleEntities('wave', '~ (Unmachined)')
    },

    // Welding Symbol: Fillet Weld (ISO 2553)
    {
        id: 'std_weld_fillet',
        name: 'ISO 2553 Fillet Weld (a5 △)',
        description: 'ISO 2553 Standard Fillet Weld Symbol with throat thickness a=5mm and reference line',
        category: 'Symbols',
        subcategory: 'Welding',
        basePoint: { x: 0, y: 0 },
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
        entities: [
            // Leader arrow pointing to joint
            createLineEntity({ x: 0, y: 0 }, { x: 10, y: 8 }, 'layer-0', '#3ad0e6'),
            // Arrowhead
            createLineEntity({ x: 0, y: 0 }, { x: 2.5, y: 0.8 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 0, y: 0 }, { x: 1.8, y: 2.2 }, 'layer-0', '#3ad0e6'),
            // Reference line
            createLineEntity({ x: 10, y: 8 }, { x: 30, y: 8 }, 'layer-0', '#3ad0e6'),
            // Fillet Weld Triangle (under reference line)
            createLineEntity({ x: 16, y: 8 }, { x: 16, y: 4 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 16, y: 4 }, { x: 20, y: 8 }, 'layer-0', '#3ad0e6'),
            // Throat size 'a5'
            createTextEntity({ x: 12, y: 5 }, 'a5', 2.8, 'layer-0', '#e7edf4'),
        ]
    },

    // Welding Symbol: All-Around Fillet Weld (ISO 2553)
    {
        id: 'std_weld_all_around',
        name: 'ISO 2553 All-Around Weld Symbol (◯)',
        description: 'ISO 2553 Peripheral All-Around Fillet Weld Symbol with junction ring and tail',
        category: 'Symbols',
        subcategory: 'Welding',
        basePoint: { x: 0, y: 0 },
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
        entities: [
            createLineEntity({ x: 0, y: 0 }, { x: 10, y: 8 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 0, y: 0 }, { x: 2.5, y: 0.8 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 0, y: 0 }, { x: 1.8, y: 2.2 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 10, y: 8 }, { x: 32, y: 8 }, 'layer-0', '#3ad0e6'),
            // All-around circle at junction
            createCircleEntity({ x: 10, y: 8 }, 2, 'layer-0', '#e6b84a'),
            // Fillet weld triangle
            createLineEntity({ x: 17, y: 8 }, { x: 17, y: 4 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 17, y: 4 }, { x: 21, y: 8 }, 'layer-0', '#3ad0e6'),
            createTextEntity({ x: 13, y: 5 }, 'a4', 2.8, 'layer-0', '#e7edf4'),
            // Tail chevron for specification
            createLineEntity({ x: 32, y: 8 }, { x: 36, y: 11 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 32, y: 8 }, { x: 36, y: 5 }, 'layer-0', '#3ad0e6'),
        ]
    },

    // First Angle Projection Symbol (ISO 5456-2 European)
    {
        id: 'std_proj_first_angle',
        name: 'First Angle Projection Symbol (ISO European)',
        description: 'ISO 5456-2 Standard First Angle Projection Symbol (Cone frustum + Concentric circles)',
        category: 'Symbols',
        subcategory: 'Projection',
        basePoint: { x: 0, y: 0 },
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
        entities: [
            // Centerline
            createLineEntity({ x: -14, y: 0 }, { x: 22, y: 0 }, 'layer-0', '#e85d5d'),
            createLineEntity({ x: 14, y: -7 }, { x: 14, y: 7 }, 'layer-0', '#e85d5d'),
            // Truncated Cone Frustum on Left
            createLineEntity({ x: -10, y: -5 }, { x: -10, y: 5 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: -10, y: 5 }, { x: 0, y: 2.5 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 0, y: 2.5 }, { x: 0, y: -2.5 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 0, y: -2.5 }, { x: -10, y: -5 }, 'layer-0', '#3ad0e6'),
            // Concentric Circles on Right
            createCircleEntity({ x: 14, y: 0 }, 5, 'layer-0', '#3ad0e6'),
            createCircleEntity({ x: 14, y: 0 }, 2.5, 'layer-0', '#8a96a6'),
        ]
    },

    // Third Angle Projection Symbol (ISO 5456-2 / ANSI American)
    {
        id: 'std_proj_third_angle',
        name: 'Third Angle Projection Symbol (ANSI American)',
        description: 'ISO 5456-2 / ANSI Standard Third Angle Projection Symbol (Concentric circles + Cone frustum)',
        category: 'Symbols',
        subcategory: 'Projection',
        basePoint: { x: 0, y: 0 },
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
        entities: [
            createLineEntity({ x: -14, y: 0 }, { x: 22, y: 0 }, 'layer-0', '#e85d5d'),
            createLineEntity({ x: -6, y: -7 }, { x: -6, y: 7 }, 'layer-0', '#e85d5d'),
            // Concentric Circles on Left
            createCircleEntity({ x: -6, y: 0 }, 5, 'layer-0', '#3ad0e6'),
            createCircleEntity({ x: -6, y: 0 }, 2.5, 'layer-0', '#8a96a6'),
            // Cone Frustum on Right
            createLineEntity({ x: 6, y: -2.5 }, { x: 6, y: 2.5 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 6, y: 2.5 }, { x: 16, y: 5 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 16, y: 5 }, { x: 16, y: -5 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 16, y: -5 }, { x: 6, y: -2.5 }, 'layer-0', '#3ad0e6'),
        ]
    },

    // Precision Center Mark Crosshair (⊕)
    {
        id: 'std_center_mark',
        name: 'Precision Center Mark Crosshair (⊕)',
        description: 'Standard technical drawing center mark cross with 5mm ticks and center gap circle',
        category: 'Symbols',
        subcategory: 'Annotations',
        basePoint: { x: 0, y: 0 },
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
        entities: [
            createCircleEntity({ x: 0, y: 0 }, 1.2, 'layer-0', '#e85d5d'),
            createLineEntity({ x: -6, y: 0 }, { x: -1.2, y: 0 }, 'layer-0', '#e85d5d'),
            createLineEntity({ x: 1.2, y: 0 }, { x: 6, y: 0 }, 'layer-0', '#e85d5d'),
            createLineEntity({ x: 0, y: -6 }, { x: 0, y: -1.2 }, 'layer-0', '#e85d5d'),
            createLineEntity({ x: 0, y: 1.2 }, { x: 0, y: 6 }, 'layer-0', '#e85d5d'),
        ]
    },

    // Section Cutting Arrow Symbol (A-A)
    {
        id: 'std_section_arrow',
        name: 'Section Cutting Plane Arrow (A)',
        description: 'Standard cutting plane line with bold direction arrow and section callout letter',
        category: 'Symbols',
        subcategory: 'Annotations',
        basePoint: { x: 0, y: 0 },
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
        entities: [
            // Thick section line segment
            createLineEntity({ x: 0, y: 0 }, { x: 0, y: 12 }, 'layer-0', '#3ad0e6'),
            // Arrow pointing in sight direction (rightwards)
            createLineEntity({ x: 0, y: 12 }, { x: 8, y: 12 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 5, y: 14 }, { x: 8, y: 12 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 5, y: 10 }, { x: 8, y: 12 }, 'layer-0', '#3ad0e6'),
            // Section Identification Letter A
            createTextEntity({ x: 11, y: 11 }, 'A', 5.0, 'layer-0', '#3ad0e6', 'left', true),
        ]
    },


    // ═══════════════════════════════════════════════════════════════
    // 4. FASTENERS & MACHINE ELEMENTS (ISO / DIN)
    // ═══════════════════════════════════════════════════════════════

    // ISO 4014 M6x25 Hex Bolt Profile
    {
        id: 'std_m6_bolt',
        name: 'ISO 4014 M6x25 Hex Bolt',
        description: 'M6 Grade 8.8 Hex Head Cap Screw Profile (Head s=10mm, k=4mm, L=25mm)',
        category: 'Fasteners',
        subcategory: 'Hex Bolts',
        basePoint: { x: 0, y: 0 },
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
        entities: [
            createLineEntity({ x: -5, y: 0 }, { x: 5, y: 0 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 5, y: 0 }, { x: 5, y: 4 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 5, y: 4 }, { x: -5, y: 4 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: -5, y: 4 }, { x: -5, y: 0 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: -3, y: 0 }, { x: -3, y: -25 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 3, y: 0 }, { x: 3, y: -25 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: -3, y: -25 }, { x: 3, y: -25 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: -2.5, y: -7 }, { x: -2.5, y: -25 }, 'layer-0', '#8a96a6'),
            createLineEntity({ x: 2.5, y: -7 }, { x: 2.5, y: -25 }, 'layer-0', '#8a96a6'),
            createLineEntity({ x: 0, y: 6 }, { x: 0, y: -28 }, 'layer-0', '#e85d5d'),
        ]
    },

    // ISO 4014 M8x30 Hex Bolt Profile
    {
        id: 'std_m8_bolt',
        name: 'ISO 4014 M8x30 Hex Bolt',
        description: 'M8 Grade 8.8 Hex Head Cap Screw (s=13mm, k=5.3mm, L=30mm)',
        category: 'Fasteners',
        subcategory: 'Hex Bolts',
        basePoint: { x: 0, y: 0 },
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
        entities: [
            createLineEntity({ x: -6.5, y: 0 }, { x: 6.5, y: 0 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 6.5, y: 0 }, { x: 6.5, y: 5.3 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 6.5, y: 5.3 }, { x: -6.5, y: 5.3 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: -6.5, y: 5.3 }, { x: -6.5, y: 0 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: -4, y: 0 }, { x: -4, y: -30 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 4, y: 0 }, { x: 4, y: -30 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: -4, y: -30 }, { x: 4, y: -30 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: -3.3, y: -8 }, { x: -3.3, y: -30 }, 'layer-0', '#8a96a6'),
            createLineEntity({ x: 3.3, y: -8 }, { x: 3.3, y: -30 }, 'layer-0', '#8a96a6'),
            createLineEntity({ x: 0, y: 8 }, { x: 0, y: -34 }, 'layer-0', '#e85d5d'),
        ]
    },

    // ISO 4014 M10x40 Hex Bolt Profile
    {
        id: 'std_m10_bolt',
        name: 'ISO 4014 M10x40 Hex Bolt',
        description: 'M10 Grade 8.8 Hex Head Cap Screw (s=16mm, k=6.4mm, L=40mm)',
        category: 'Fasteners',
        subcategory: 'Hex Bolts',
        basePoint: { x: 0, y: 0 },
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
        entities: [
            createLineEntity({ x: -8, y: 0 }, { x: 8, y: 0 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 8, y: 0 }, { x: 8, y: 6.4 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 8, y: 6.4 }, { x: -8, y: 6.4 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: -8, y: 6.4 }, { x: -8, y: 0 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: -5, y: 0 }, { x: -5, y: -40 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 5, y: 0 }, { x: 5, y: -40 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: -5, y: -40 }, { x: 5, y: -40 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: -4.2, y: -12 }, { x: -4.2, y: -40 }, 'layer-0', '#8a96a6'),
            createLineEntity({ x: 4.2, y: -12 }, { x: 4.2, y: -40 }, 'layer-0', '#8a96a6'),
            createLineEntity({ x: 0, y: 10 }, { x: 0, y: -45 }, 'layer-0', '#e85d5d'),
        ]
    },

    // ISO 4014 M12x50 Hex Bolt Profile
    {
        id: 'std_m12_bolt',
        name: 'ISO 4014 M12x50 Hex Bolt',
        description: 'M12 Grade 8.8 Hex Head Cap Screw (s=18mm, k=7.5mm, L=50mm)',
        category: 'Fasteners',
        subcategory: 'Hex Bolts',
        basePoint: { x: 0, y: 0 },
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
        entities: [
            createLineEntity({ x: -9, y: 0 }, { x: 9, y: 0 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 9, y: 0 }, { x: 9, y: 7.5 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 9, y: 7.5 }, { x: -9, y: 7.5 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: -9, y: 7.5 }, { x: -9, y: 0 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: -6, y: 0 }, { x: -6, y: -50 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 6, y: 0 }, { x: 6, y: -50 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: -6, y: -50 }, { x: 6, y: -50 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: -5.1, y: -15 }, { x: -5.1, y: -50 }, 'layer-0', '#8a96a6'),
            createLineEntity({ x: 5.1, y: -15 }, { x: 5.1, y: -50 }, 'layer-0', '#8a96a6'),
            createLineEntity({ x: 0, y: 11 }, { x: 0, y: -56 }, 'layer-0', '#e85d5d'),
        ]
    },

    // DIN 912 M6x20 Socket Head Cap Screw Profile
    {
        id: 'std_m6_shcs',
        name: 'DIN 912 M6x20 Socket Head Cap Screw',
        description: 'M6 Inbus / Socket Head Cap Screw Profile (Head dk=10mm, k=6mm, s=5mm hex key)',
        category: 'Fasteners',
        subcategory: 'Socket Screws',
        basePoint: { x: 0, y: 0 },
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
        entities: [
            createLineEntity({ x: -5, y: 0 }, { x: 5, y: 0 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 5, y: 0 }, { x: 5, y: 6 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 5, y: 6 }, { x: -5, y: 6 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: -5, y: 6 }, { x: -5, y: 0 }, 'layer-0', '#3ad0e6'),
            // Internal Hex Socket recess
            createLineEntity({ x: -2.5, y: 6 }, { x: -2.5, y: 3 }, 'layer-0', '#8a96a6'),
            createLineEntity({ x: 2.5, y: 6 }, { x: 2.5, y: 3 }, 'layer-0', '#8a96a6'),
            createLineEntity({ x: -2.5, y: 3 }, { x: 2.5, y: 3 }, 'layer-0', '#8a96a6'),
            // Shank
            createLineEntity({ x: -3, y: 0 }, { x: -3, y: -20 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 3, y: 0 }, { x: 3, y: -20 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: -3, y: -20 }, { x: 3, y: -20 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 0, y: 8 }, { x: 0, y: -23 }, 'layer-0', '#e85d5d'),
        ]
    },

    // DIN 912 M8x30 Socket Head Cap Screw Profile
    {
        id: 'std_m8_shcs',
        name: 'DIN 912 M8x30 Socket Head Cap Screw',
        description: 'M8 Inbus / Socket Head Cap Screw Profile (Head dk=13mm, k=8mm, s=6mm hex key)',
        category: 'Fasteners',
        subcategory: 'Socket Screws',
        basePoint: { x: 0, y: 0 },
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
        entities: [
            createLineEntity({ x: -6.5, y: 0 }, { x: 6.5, y: 0 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 6.5, y: 0 }, { x: 6.5, y: 8 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 6.5, y: 8 }, { x: -6.5, y: 8 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: -6.5, y: 8 }, { x: -6.5, y: 0 }, 'layer-0', '#3ad0e6'),
            // Internal Hex Socket recess
            createLineEntity({ x: -3, y: 8 }, { x: -3, y: 4 }, 'layer-0', '#8a96a6'),
            createLineEntity({ x: 3, y: 8 }, { x: 3, y: 4 }, 'layer-0', '#8a96a6'),
            createLineEntity({ x: -3, y: 4 }, { x: 3, y: 4 }, 'layer-0', '#8a96a6'),
            // Shank
            createLineEntity({ x: -4, y: 0 }, { x: -4, y: -30 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 4, y: 0 }, { x: 4, y: -30 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: -4, y: -30 }, { x: 4, y: -30 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 0, y: 10 }, { x: 0, y: -34 }, 'layer-0', '#e85d5d'),
        ]
    },

    // ISO 10642 M6 Countersunk Screw Profile
    {
        id: 'std_m6_csk',
        name: 'ISO 10642 M6 Countersunk Screw',
        description: 'M6 90-Degree Countersunk Flat Head Screw Profile (Head dk=12mm)',
        category: 'Fasteners',
        subcategory: 'Socket Screws',
        basePoint: { x: 0, y: 0 },
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
        entities: [
            createLineEntity({ x: -6, y: 0 }, { x: 6, y: 0 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 6, y: 0 }, { x: 3, y: -3.3 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: -6, y: 0 }, { x: -3, y: -3.3 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: -3, y: -3.3 }, { x: -3, y: -20 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 3, y: -3.3 }, { x: 3, y: -20 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: -3, y: -20 }, { x: 3, y: -20 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 0, y: 3 }, { x: 0, y: -23 }, 'layer-0', '#e85d5d'),
        ]
    },

    // ISO 4032 M6 Hex Nut (Top View)
    {
        id: 'std_m6_nut',
        name: 'ISO 4032 M6 Hex Nut',
        description: 'Standard M6 Hexagon Nut Top View (s=10mm, pitch 1.0mm)',
        category: 'Fasteners',
        subcategory: 'Nuts & Washers',
        basePoint: { x: 0, y: 0 },
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
        entities: [
            createHexagonEntity({ x: 0, y: 0 }, 5.77, 'layer-0', '#3ad0e6'),
            createCircleEntity({ x: 0, y: 0 }, 3, 'layer-0', '#3ad0e6'),
            createCircleEntity({ x: 0, y: 0 }, 2.5, 'layer-0', '#8a96a6'),
        ]
    },

    // ISO 4032 M8 Hex Nut (Top View)
    {
        id: 'std_m8_nut',
        name: 'ISO 4032 M8 Hex Nut',
        description: 'Standard M8 Regular Hexagon Nut Top View (s=13mm)',
        category: 'Fasteners',
        subcategory: 'Nuts & Washers',
        basePoint: { x: 0, y: 0 },
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
        entities: [
            createHexagonEntity({ x: 0, y: 0 }, 7.5, 'layer-0', '#3ad0e6'),
            createCircleEntity({ x: 0, y: 0 }, 4, 'layer-0', '#3ad0e6'),
            createCircleEntity({ x: 0, y: 0 }, 3.38, 'layer-0', '#8a96a6'),
        ]
    },

    // ISO 4032 M10 Hex Nut (Top View)
    {
        id: 'std_m10_nut',
        name: 'ISO 4032 M10 Hex Nut',
        description: 'Standard M10 Regular Hexagon Nut Top View (s=16mm)',
        category: 'Fasteners',
        subcategory: 'Nuts & Washers',
        basePoint: { x: 0, y: 0 },
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
        entities: [
            createHexagonEntity({ x: 0, y: 0 }, 9.24, 'layer-0', '#3ad0e6'),
            createCircleEntity({ x: 0, y: 0 }, 5, 'layer-0', '#3ad0e6'),
            createCircleEntity({ x: 0, y: 0 }, 4.25, 'layer-0', '#8a96a6'),
        ]
    },

    // ISO 7089 M8 Flat Washer
    {
        id: 'std_m8_washer',
        name: 'ISO 7089 M8 Flat Washer',
        description: 'Standard M8 Plain Washer Form A (d1=8.4mm, d2=16mm, t=1.6mm)',
        category: 'Fasteners',
        subcategory: 'Nuts & Washers',
        basePoint: { x: 0, y: 0 },
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
        entities: [
            createCircleEntity({ x: 0, y: 0 }, 8, 'layer-0', '#3ad0e6'),
            createCircleEntity({ x: 0, y: 0 }, 4.2, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: -10, y: 0 }, { x: 10, y: 0 }, 'layer-0', '#e85d5d'),
            createLineEntity({ x: 0, y: -10 }, { x: 0, y: 10 }, 'layer-0', '#e85d5d'),
        ]
    },

    // DIN 471 External Circlip / Retaining Ring (d=20mm)
    {
        id: 'std_circlip_shaft',
        name: 'DIN 471 External Circlip (d=20)',
        description: 'Standard Retaining Ring for 20mm shaft with assembly plier lugs',
        category: 'Fasteners',
        subcategory: 'Pins & Rings',
        basePoint: { x: 0, y: 0 },
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
        entities: [
            // Outer ring arc
            createArcEntity({ x: 0, y: 0 }, 11.2, 0.45, 2 * Math.PI - 0.45, 'layer-0', '#3ad0e6'),
            // Inner ring arc
            createArcEntity({ x: 0, y: 0 }, 9.25, 0.5, 2 * Math.PI - 0.5, 'layer-0', '#3ad0e6'),
            // Plier Lug Left
            createCircleEntity({ x: 10.5, y: 4.8 }, 0.9, 'layer-0', '#3dd68c'),
            // Plier Lug Right
            createCircleEntity({ x: 10.5, y: -4.8 }, 0.9, 'layer-0', '#3dd68c'),
            createLineEntity({ x: 0, y: -13 }, { x: 0, y: 13 }, 'layer-0', '#e85d5d'),
        ]
    },

    // DIN 6325 Ground Dowel Pin 8x30mm
    {
        id: 'std_dowel_pin',
        name: 'DIN 6325 Dowel Pin 8x30',
        description: 'Hardened and ground precision dowel pin m6 tolerance with chamfered ends',
        category: 'Fasteners',
        subcategory: 'Pins & Rings',
        basePoint: { x: 0, y: 0 },
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
        entities: [
            createLineEntity({ x: -4, y: 14 }, { x: -4, y: -14 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 4, y: 14 }, { x: 4, y: -14 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: -3, y: 15 }, { x: 3, y: 15 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: -4, y: 14 }, { x: -3, y: 15 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 4, y: 14 }, { x: 3, y: 15 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: -3, y: -15 }, { x: 3, y: -15 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: -4, y: -14 }, { x: -3, y: -15 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 4, y: -14 }, { x: 3, y: -15 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 0, y: 18 }, { x: 0, y: -18 }, 'layer-0', '#e85d5d'),
        ]
    },

    // DIN 74 Form H Counterbore Profile (M6)
    {
        id: 'std_din74_cbore',
        name: 'DIN 74 Form H Counterbore Profile',
        description: 'M6 Socket Head Cap Screw Stepped Counterbore Hole Section (11mm dia x 6.5mm depth)',
        category: 'Fasteners',
        subcategory: 'Hole Sections',
        basePoint: { x: 0, y: 0 },
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
        entities: [
            createLineEntity({ x: -12, y: 0 }, { x: 12, y: 0 }, 'layer-0', '#8a96a6'),
            createLineEntity({ x: -5.5, y: 0 }, { x: -5.5, y: -6.5 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 5.5, y: 0 }, { x: 5.5, y: -6.5 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: -5.5, y: -6.5 }, { x: -3.3, y: -6.5 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 5.5, y: -6.5 }, { x: 3.3, y: -6.5 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: -3.3, y: -6.5 }, { x: -3.3, y: -20 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 3.3, y: -6.5 }, { x: 3.3, y: -20 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 0, y: 3 }, { x: 0, y: -23 }, 'layer-0', '#e85d5d'),
        ]
    },


    // ═══════════════════════════════════════════════════════════════
    // 5. STRUCTURAL PROFILES & EXTRUSIONS
    // ═══════════════════════════════════════════════════════════════

    // 2020 T-Slot Aluminum Profile
    {
        id: 'std_alu_2020',
        name: '2020 Aluminum T-Slot Profile',
        description: '20x20mm Aluminum Extrusion with 6mm T-slots and 5.0mm center bore',
        category: 'Profiles',
        subcategory: 'Extrusions',
        basePoint: { x: 0, y: 0 },
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
        entities: [
            // Outer 20x20 boundary
            createRectangleEntity({ x: 0, y: 0 }, 20, 20, 'layer-0', '#3ad0e6'),
            // Center bore 5mm (radius 2.5)
            createCircleEntity({ x: 0, y: 0 }, 2.5, 'layer-0', '#3dd68c'),
            // Slot openings 6mm x 6mm depth
            createLineEntity({ x: -3, y: 10 }, { x: -3, y: 7 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 3, y: 10 }, { x: 3, y: 7 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: -3, y: -10 }, { x: -3, y: -7 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 3, y: -10 }, { x: 3, y: -7 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 10, y: -3 }, { x: 7, y: -3 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 10, y: 3 }, { x: 7, y: 3 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: -10, y: -3 }, { x: -7, y: -3 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: -10, y: 3 }, { x: -7, y: 3 }, 'layer-0', '#3ad0e6'),
            // Centerlines
            createLineEntity({ x: -14, y: 0 }, { x: 14, y: 0 }, 'layer-0', '#e85d5d'),
            createLineEntity({ x: 0, y: -14 }, { x: 0, y: 14 }, 'layer-0', '#e85d5d'),
        ]
    },

    // 2040 T-Slot Aluminum Profile
    {
        id: 'std_alu_2040',
        name: '2040 Aluminum T-Slot Profile',
        description: '20x40mm Aluminum Extrusion with 6x T-slots and dual 5.0mm center bores',
        category: 'Profiles',
        subcategory: 'Extrusions',
        basePoint: { x: 0, y: 0 },
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
        entities: [
            createRectangleEntity({ x: 0, y: 0 }, 40, 20, 'layer-0', '#3ad0e6'),
            createCircleEntity({ x: -10, y: 0 }, 2.5, 'layer-0', '#3dd68c'),
            createCircleEntity({ x: 10, y: 0 }, 2.5, 'layer-0', '#3dd68c'),
            createLineEntity({ x: 0, y: 10 }, { x: 0, y: -10 }, 'layer-0', '#334155'),
            createLineEntity({ x: -24, y: 0 }, { x: 24, y: 0 }, 'layer-0', '#e85d5d'),
            createLineEntity({ x: -10, y: -14 }, { x: -10, y: 14 }, 'layer-0', '#e85d5d'),
            createLineEntity({ x: 10, y: -14 }, { x: 10, y: 14 }, 'layer-0', '#e85d5d'),
        ]
    },

    // 3030 T-Slot Aluminum Profile
    {
        id: 'std_alu_3030',
        name: '3030 Aluminum T-Slot Profile',
        description: '30x30mm Heavy Duty Extrusion with 8mm T-slots and 8.0mm center core',
        category: 'Profiles',
        subcategory: 'Extrusions',
        basePoint: { x: 0, y: 0 },
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
        entities: [
            createRectangleEntity({ x: 0, y: 0 }, 30, 30, 'layer-0', '#3ad0e6'),
            createCircleEntity({ x: 0, y: 0 }, 4, 'layer-0', '#3dd68c'),
            createLineEntity({ x: -4, y: 15 }, { x: -4, y: 11 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 4, y: 15 }, { x: 4, y: 11 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: -4, y: -15 }, { x: -4, y: -11 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 4, y: -15 }, { x: 4, y: -11 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 15, y: -4 }, { x: 11, y: -4 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 15, y: 4 }, { x: 11, y: 4 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: -15, y: -4 }, { x: -11, y: -4 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: -15, y: 4 }, { x: -11, y: 4 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: -20, y: 0 }, { x: 20, y: 0 }, 'layer-0', '#e85d5d'),
            createLineEntity({ x: 0, y: -20 }, { x: 0, y: 20 }, 'layer-0', '#e85d5d'),
        ]
    },

    // 4040 T-Slot Aluminum Profile
    {
        id: 'std_alu_4040',
        name: '4040 Aluminum T-Slot Profile',
        description: '40x40mm Structural Extrusion with 8mm T-slots and 12mm central bore',
        category: 'Profiles',
        subcategory: 'Extrusions',
        basePoint: { x: 0, y: 0 },
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
        entities: [
            createRectangleEntity({ x: 0, y: 0 }, 40, 40, 'layer-0', '#3ad0e6'),
            createCircleEntity({ x: 0, y: 0 }, 6, 'layer-0', '#3dd68c'),
            createLineEntity({ x: -26, y: 0 }, { x: 26, y: 0 }, 'layer-0', '#e85d5d'),
            createLineEntity({ x: 0, y: -26 }, { x: 0, y: 26 }, 'layer-0', '#e85d5d'),
        ]
    },

    // 2020 90° Corner Gusset Bracket
    {
        id: 'std_bracket_2020',
        name: '2020 90° Corner Gusset Bracket',
        description: 'Die-cast Aluminum 90-degree Corner Joint Bracket (20x20mm side profile)',
        category: 'Profiles',
        subcategory: 'Brackets',
        basePoint: { x: 0, y: 0 },
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
        entities: [
            createLineEntity({ x: 0, y: 0 }, { x: 20, y: 0 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 20, y: 0 }, { x: 20, y: 4 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 20, y: 4 }, { x: 4, y: 20 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 4, y: 20 }, { x: 0, y: 20 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 0, y: 20 }, { x: 0, y: 0 }, 'layer-0', '#3ad0e6'),
            // Mounting bolt hole
            createCircleEntity({ x: 7, y: 7 }, 2.5, 'layer-0', '#3dd68c'),
        ]
    },


    // ═══════════════════════════════════════════════════════════════
    // 6. MOUNTS & MOTORS
    // ═══════════════════════════════════════════════════════════════

    // NEMA 17 Stepper Motor Faceplate
    {
        id: 'std_nema17',
        name: 'NEMA 17 Stepper Motor Faceplate',
        description: '42.3mm Square Frame, 31mm PCD (4x M3), 22mm pilot boss, 5mm shaft',
        category: 'Mounts',
        subcategory: 'Motors',
        basePoint: { x: 0, y: 0 },
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
        entities: [
            createRectangleEntity({ x: 0, y: 0 }, 42.3, 42.3, 'layer-0', '#3ad0e6'),
            createCircleEntity({ x: 0, y: 0 }, 11, 'layer-0', '#8a96a6'),
            createCircleEntity({ x: 0, y: 0 }, 2.5, 'layer-0', '#e6b84a'),
            // 4x M3 mounting holes at 31mm PCD (15.5mm from center)
            createCircleEntity({ x: -15.5, y: -15.5 }, 1.5, 'layer-0', '#3dd68c'),
            createCircleEntity({ x: 15.5, y: -15.5 }, 1.5, 'layer-0', '#3dd68c'),
            createCircleEntity({ x: 15.5, y: 15.5 }, 1.5, 'layer-0', '#3dd68c'),
            createCircleEntity({ x: -15.5, y: 15.5 }, 1.5, 'layer-0', '#3dd68c'),
            createLineEntity({ x: -24, y: 0 }, { x: 24, y: 0 }, 'layer-0', '#e85d5d'),
            createLineEntity({ x: 0, y: -24 }, { x: 0, y: 24 }, 'layer-0', '#e85d5d'),
        ]
    },

    // NEMA 23 Stepper Motor Faceplate
    {
        id: 'std_nema23',
        name: 'NEMA 23 Stepper Motor Faceplate',
        description: '56.4mm Square Frame, 47.14mm PCD (4x 5.2mm holes), 38.1mm pilot boss, 6.35mm shaft',
        category: 'Mounts',
        subcategory: 'Motors',
        basePoint: { x: 0, y: 0 },
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
        entities: [
            createRectangleEntity({ x: 0, y: 0 }, 56.4, 56.4, 'layer-0', '#3ad0e6'),
            createCircleEntity({ x: 0, y: 0 }, 19.05, 'layer-0', '#8a96a6'),
            createCircleEntity({ x: 0, y: 0 }, 3.175, 'layer-0', '#e6b84a'),
            createCircleEntity({ x: -23.57, y: -23.57 }, 2.6, 'layer-0', '#3dd68c'),
            createCircleEntity({ x: 23.57, y: -23.57 }, 2.6, 'layer-0', '#3dd68c'),
            createCircleEntity({ x: 23.57, y: 23.57 }, 2.6, 'layer-0', '#3dd68c'),
            createCircleEntity({ x: -23.57, y: 23.57 }, 2.6, 'layer-0', '#3dd68c'),
            createLineEntity({ x: -32, y: 0 }, { x: 32, y: 0 }, 'layer-0', '#e85d5d'),
            createLineEntity({ x: 0, y: -32 }, { x: 0, y: 32 }, 'layer-0', '#e85d5d'),
        ]
    },

    // NEMA 34 Stepper Motor Faceplate
    {
        id: 'std_nema34',
        name: 'NEMA 34 Stepper Motor Faceplate',
        description: '86mm Square Frame, 69.6mm PCD (4x 6.5mm holes), 73mm pilot, 14mm shaft',
        category: 'Mounts',
        subcategory: 'Motors',
        basePoint: { x: 0, y: 0 },
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
        entities: [
            createRectangleEntity({ x: 0, y: 0 }, 86, 86, 'layer-0', '#3ad0e6'),
            createCircleEntity({ x: 0, y: 0 }, 36.5, 'layer-0', '#8a96a6'),
            createCircleEntity({ x: 0, y: 0 }, 7, 'layer-0', '#e6b84a'),
            createCircleEntity({ x: -34.8, y: -34.8 }, 3.25, 'layer-0', '#3dd68c'),
            createCircleEntity({ x: 34.8, y: -34.8 }, 3.25, 'layer-0', '#3dd68c'),
            createCircleEntity({ x: 34.8, y: 34.8 }, 3.25, 'layer-0', '#3dd68c'),
            createCircleEntity({ x: -34.8, y: 34.8 }, 3.25, 'layer-0', '#3dd68c'),
            createLineEntity({ x: -48, y: 0 }, { x: 48, y: 0 }, 'layer-0', '#e85d5d'),
            createLineEntity({ x: 0, y: -48 }, { x: 0, y: 48 }, 'layer-0', '#e85d5d'),
        ]
    },

    // 608 Ball Bearing Front View
    {
        id: 'std_bearing_608',
        name: '608 Ball Bearing (d=8, D=22, B=7)',
        description: 'Standard 608 Skate / 3D Printer Deep Groove Ball Bearing Front View with rolling balls',
        category: 'Mounts',
        subcategory: 'Bearings',
        basePoint: { x: 0, y: 0 },
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
        entities: [
            createCircleEntity({ x: 0, y: 0 }, 11, 'layer-0', '#3ad0e6'),
            createCircleEntity({ x: 0, y: 0 }, 9.5, 'layer-0', '#8a96a6'),
            createCircleEntity({ x: 0, y: 0 }, 5.5, 'layer-0', '#8a96a6'),
            createCircleEntity({ x: 0, y: 0 }, 4, 'layer-0', '#3ad0e6'),
            // 7x rolling balls at pitch circle 7.5mm, ball diameter 3.96mm (r=1.98)
            createCircleEntity({ x: 7.5 * Math.cos(0), y: 7.5 * Math.sin(0) }, 1.8, 'layer-0', '#e6b84a'),
            createCircleEntity({ x: 7.5 * Math.cos(2*Math.PI/7), y: 7.5 * Math.sin(2*Math.PI/7) }, 1.8, 'layer-0', '#e6b84a'),
            createCircleEntity({ x: 7.5 * Math.cos(4*Math.PI/7), y: 7.5 * Math.sin(4*Math.PI/7) }, 1.8, 'layer-0', '#e6b84a'),
            createCircleEntity({ x: 7.5 * Math.cos(6*Math.PI/7), y: 7.5 * Math.sin(6*Math.PI/7) }, 1.8, 'layer-0', '#e6b84a'),
            createCircleEntity({ x: 7.5 * Math.cos(8*Math.PI/7), y: 7.5 * Math.sin(8*Math.PI/7) }, 1.8, 'layer-0', '#e6b84a'),
            createCircleEntity({ x: 7.5 * Math.cos(10*Math.PI/7), y: 7.5 * Math.sin(10*Math.PI/7) }, 1.8, 'layer-0', '#e6b84a'),
            createCircleEntity({ x: 7.5 * Math.cos(12*Math.PI/7), y: 7.5 * Math.sin(12*Math.PI/7) }, 1.8, 'layer-0', '#e6b84a'),
            createLineEntity({ x: -14, y: 0 }, { x: 14, y: 0 }, 'layer-0', '#e85d5d'),
            createLineEntity({ x: 0, y: -14 }, { x: 0, y: 14 }, 'layer-0', '#e85d5d'),
        ]
    },

    // 6204 Bearing Longitudinal Cross Section
    {
        id: 'std_bearing_6204',
        name: '6204 Bearing Cross Section (d=20, D=47, B=14)',
        description: 'Deep Groove Radial Ball Bearing 6204 Axial Section View with upper/lower races and rolling ball',
        category: 'Mounts',
        subcategory: 'Bearings',
        basePoint: { x: 0, y: 0 },
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
        entities: [
            // Centerline
            createLineEntity({ x: -10, y: 0 }, { x: 10, y: 0 }, 'layer-0', '#e85d5d'),

            // Upper Race (y from 10 to 23.5)
            // Inner race ring
            createRectangleEntity({ x: 0, y: 12.5 }, 14, 5, 'layer-0', '#3ad0e6'),
            // Outer race ring
            createRectangleEntity({ x: 0, y: 21 }, 14, 5, 'layer-0', '#3ad0e6'),
            // Ball at center y = 16.75, diameter 7.9mm (r=3.95)
            createCircleEntity({ x: 0, y: 16.75 }, 3.95, 'layer-0', '#e6b84a'),

            // Lower Race (y from -10 to -23.5)
            createRectangleEntity({ x: 0, y: -12.5 }, 14, 5, 'layer-0', '#3ad0e6'),
            createRectangleEntity({ x: 0, y: -21 }, 14, 5, 'layer-0', '#3ad0e6'),
            createCircleEntity({ x: 0, y: -16.75 }, 3.95, 'layer-0', '#e6b84a'),
        ]
    },


    // ═══════════════════════════════════════════════════════════════
    // 7. FLUID POWER & PNEUMATIC SCHEMATICS (ISO 1219)
    // ═══════════════════════════════════════════════════════════════

    // ISO 1219 Double-Acting Pneumatic Cylinder
    {
        id: 'std_pneu_cylinder',
        name: 'ISO 1219 Double-Acting Cylinder',
        description: 'Standard Schematic Symbol for Double-Acting Pneumatic Cylinder with Ports A and B',
        category: 'Schematics',
        subcategory: 'Actuators',
        basePoint: { x: 0, y: 0 },
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
        entities: [
            // Barrel (30mm wide x 16mm high)
            createLineEntity({ x: 0, y: 8 }, { x: 30, y: 8 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 30, y: 8 }, { x: 30, y: -8 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 30, y: -8 }, { x: 0, y: -8 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 0, y: -8 }, { x: 0, y: 8 }, 'layer-0', '#3ad0e6'),
            // Piston (at x=12)
            createLineEntity({ x: 12, y: 7 }, { x: 12, y: -7 }, 'layer-0', '#3ad0e6'),
            // Piston Rod extending out through front face
            createLineEntity({ x: 12, y: 0 }, { x: 42, y: 0 }, 'layer-0', '#3ad0e6'),
            // Supply Ports (bottom)
            createLineEntity({ x: 4, y: -8 }, { x: 4, y: -14 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 26, y: -8 }, { x: 26, y: -14 }, 'layer-0', '#3ad0e6'),
            createTextEntity({ x: 4, y: -16 }, 'A', 2.5, 'layer-0', '#8a96a6', 'center'),
            createTextEntity({ x: 26, y: -16 }, 'B', 2.5, 'layer-0', '#8a96a6', 'center'),
        ]
    },

    // ISO 1219 5/2 Directional Control Valve
    {
        id: 'std_pneu_valve_52',
        name: 'ISO 1219 5/2 Directional Valve',
        description: '5-Port, 2-Position Pneumatic Directional Control Valve Symbol with flow arrows and blocked paths',
        category: 'Schematics',
        subcategory: 'Valves',
        basePoint: { x: 0, y: 0 },
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
        entities: [
            // Twin square envelopes (16x16 each -> 32x16 total)
            createLineEntity({ x: 0, y: 8 }, { x: 32, y: 8 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 32, y: 8 }, { x: 32, y: -8 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 32, y: -8 }, { x: 0, y: -8 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 0, y: -8 }, { x: 0, y: 8 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 16, y: 8 }, { x: 16, y: -8 }, 'layer-0', '#3ad0e6'),

            // Left Box Flow Paths (P->B, A->R)
            createLineEntity({ x: 8, y: -8 }, { x: 12, y: 8 }, 'layer-0', '#3ad0e6'), // Arrow
            createLineEntity({ x: 10.5, y: 5 }, { x: 12, y: 8 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 12.8, y: 5 }, { x: 12, y: 8 }, 'layer-0', '#3ad0e6'),

            createLineEntity({ x: 4, y: 8 }, { x: 4, y: -5 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 2, y: -5 }, { x: 6, y: -5 }, 'layer-0', '#3ad0e6'), // T-stop

            // Right Box Flow Paths
            createLineEntity({ x: 24, y: -8 }, { x: 20, y: 8 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 28, y: 8 }, { x: 28, y: -5 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 26, y: -5 }, { x: 30, y: -5 }, 'layer-0', '#3ad0e6'),

            // Port Callouts (1/P, 2/B, 3/S, 4/A, 5/R)
            createTextEntity({ x: 16, y: -13 }, '1(P)', 2.2, 'layer-0', '#8a96a6', 'center'),
            createTextEntity({ x: 6, y: 11 }, '4(A)', 2.2, 'layer-0', '#8a96a6', 'center'),
            createTextEntity({ x: 26, y: 11 }, '2(B)', 2.2, 'layer-0', '#8a96a6', 'center'),
        ]
    },

    // Pressure Gauge / Manometer
    {
        id: 'std_gauge_manometer',
        name: 'ISO 1219 Pressure Gauge (Manometer)',
        description: 'Standard Dial Indicator / Pressure Gauge with indicator pointer and connection stem',
        category: 'Schematics',
        subcategory: 'Instruments',
        basePoint: { x: 0, y: 0 },
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
        entities: [
            createCircleEntity({ x: 0, y: 10 }, 8, 'layer-0', '#3ad0e6'),
            // Connection stem
            createLineEntity({ x: 0, y: 0 }, { x: 0, y: 2 }, 'layer-0', '#3ad0e6'),
            // Dial pointer at 45 degrees
            createLineEntity({ x: 0, y: 10 }, { x: 4.5, y: 14.5 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 2.5, y: 14.5 }, { x: 4.5, y: 14.5 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 4.5, y: 12.5 }, { x: 4.5, y: 14.5 }, 'layer-0', '#3ad0e6'),
            // Dial center dot
            createCircleEntity({ x: 0, y: 10 }, 0.8, 'layer-0', '#e85d5d'),
        ]
    },

    // Hydraulic Fixed Displacement Pump
    {
        id: 'std_hyd_pump',
        name: 'ISO 1219 Hydraulic Pump',
        description: 'Unidirectional Fixed Displacement Hydraulic Pump Symbol with drive shaft',
        category: 'Schematics',
        subcategory: 'Actuators',
        basePoint: { x: 0, y: 0 },
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
        entities: [
            createCircleEntity({ x: 0, y: 10 }, 8, 'layer-0', '#3ad0e6'),
            // Ports
            createLineEntity({ x: 0, y: 0 }, { x: 0, y: 2 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 0, y: 18 }, { x: 0, y: 24 }, 'layer-0', '#3ad0e6'),
            // Filled discharge triangle pointing OUT (upwards)
            createLineEntity({ x: -3.5, y: 14 }, { x: 3.5, y: 14 }, 'layer-0', '#3dd68c'),
            createLineEntity({ x: -3.5, y: 14 }, { x: 0, y: 18 }, 'layer-0', '#3dd68c'),
            createLineEntity({ x: 3.5, y: 14 }, { x: 0, y: 18 }, 'layer-0', '#3dd68c'),
            // Shaft indicator on left
            createLineEntity({ x: -8, y: 10 }, { x: -14, y: 10 }, 'layer-0', '#8a96a6'),
        ]
    },

    // Air Preparation FRL Unit (Filter + Regulator + Lubricator)
    {
        id: 'std_frl_unit',
        name: 'ISO 1219 Air Preparation FRL Unit',
        description: 'Combined Filter, Pressure Regulator with Gauge & Lubricator Service Unit',
        category: 'Schematics',
        subcategory: 'Instruments',
        basePoint: { x: 0, y: 0 },
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
        entities: [
            // Outer dashed boundary box (36 x 18)
            createRectangleEntity({ x: 18, y: 0 }, 36, 18, 'layer-0', '#334155'),
            // Flow line through unit
            createLineEntity({ x: -4, y: 0 }, { x: 40, y: 0 }, 'layer-0', '#3ad0e6'),
            // Filter diamond
            createLineEntity({ x: 6, y: 6 }, { x: 12, y: 0 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 12, y: 0 }, { x: 6, y: -6 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 6, y: -6 }, { x: 0, y: 0 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 0, y: 0 }, { x: 6, y: 6 }, 'layer-0', '#3ad0e6'),
            // Regulator triangle / spring
            createLineEntity({ x: 18, y: 6 }, { x: 18, y: -6 }, 'layer-0', '#3ad0e6'),
            createCircleEntity({ x: 18, y: 10 }, 3, 'layer-0', '#3ad0e6'),
            // Lubricator marker
            createLineEntity({ x: 30, y: 6 }, { x: 30, y: -6 }, 'layer-0', '#3ad0e6'),
            createLineEntity({ x: 30, y: 3 }, { x: 27, y: 0 }, 'layer-0', '#8a96a6'),
        ]
    }
];
