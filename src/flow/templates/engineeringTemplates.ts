import type { FlowNode, FlowEdge } from '@/store/flowStore';
import type { FlowTemplate } from './types';
import { INDUSTRIAL_TEMPLATES } from './industrialTemplates';

export type { FlowTemplate, FlowTemplateCategory } from './types';
export { TEMPLATE_CATEGORY_META } from './types';

const CLASSIC_TEMPLATES: FlowTemplate[] = [
    {
        id: 'template-spur-gear-dxf',
        title: 'Spur Gear Train & DXF Pipeline',
        titleTr: 'Düz Dişli Treni & DXF Hattı',
        category: 'gears',
        standard: 'DIN 3960 / ISO 6336',
        description: 'Complete involute gear generator with module, teeth ratio, undercut detection, and AutoCAD R12 DXF export.',
        tags: ['DIN 3960', 'ISO 6336', 'involute', 'DXF'],
        nodes: [
            {
                id: 'gear-mod',
                type: 'engineering',
                position: { x: 60, y: 100 },
                data: { type: 'engineering', schemaId: 'input-constant-module', value: 3, nodeVersion: '1.0.0' } as any
            },
            {
                id: 'gear-z1',
                type: 'engineering',
                position: { x: 60, y: 230 },
                data: { type: 'engineering', schemaId: 'input-constant-teeth', value: 18, nodeVersion: '1.0.0' } as any
            },
            {
                id: 'gear-z2',
                type: 'engineering',
                position: { x: 60, y: 360 },
                data: { type: 'engineering', schemaId: 'input-constant-teeth', value: 54, nodeVersion: '1.0.0' } as any
            },
            {
                id: 'gear-alpha',
                type: 'engineering',
                position: { x: 60, y: 490 },
                data: { type: 'engineering', schemaId: 'input-constant-angle', value: 20, nodeVersion: '1.0.0' } as any
            },
            {
                id: 'gear-torque',
                type: 'engineering',
                position: { x: 60, y: 620 },
                data: { type: 'engineering', schemaId: 'input-constant-torque', value: 250, nodeVersion: '1.0.0' } as any
            },
            {
                id: 'gear-core',
                type: 'engineering',
                position: { x: 420, y: 220 },
                data: { type: 'engineering', schemaId: 'mech-gear-spur', face_width_mm: 35, nodeVersion: '1.0.0' } as any
            },
            {
                id: 'gear-undercut',
                type: 'engineering',
                position: { x: 800, y: 100 },
                data: { type: 'engineering', schemaId: 'val-undercut', nodeVersion: '1.0.0' } as any
            },
            {
                id: 'gear-export-dxf',
                type: 'engineering',
                position: { x: 800, y: 350 },
                data: { type: 'engineering', schemaId: 'export-dxf', nodeVersion: '1.0.0' } as any
            },
            {
                id: 'gear-export-pdf',
                type: 'engineering',
                position: { x: 800, y: 500 },
                data: {
                    type: 'engineering',
                    schemaId: 'export-pdf-report',
                    title: 'Spur Gear DIN 3960 Report',
                    standard: 'DIN 3960 / ISO 6336',
                    engine_version: '1.2.0',
                    nodeVersion: '1.0.0'
                } as any
            },
        ],
        edges: [
            {
                id: 'e-gear-mod',
                source: 'gear-mod',
                sourceHandle: 'value',
                target: 'gear-core',
                targetHandle: 'module_mm',
                animated: true,
                style: { stroke: '#00e5ff', strokeWidth: 2 }
            },
            {
                id: 'e-gear-z1',
                source: 'gear-z1',
                sourceHandle: 'value',
                target: 'gear-core',
                targetHandle: 'pinion_teeth',
                animated: true,
                style: { stroke: '#00e5ff', strokeWidth: 2 }
            },
            {
                id: 'e-gear-z2',
                source: 'gear-z2',
                sourceHandle: 'value',
                target: 'gear-core',
                targetHandle: 'gear_teeth',
                animated: true,
                style: { stroke: '#00e5ff', strokeWidth: 2 }
            },
            {
                id: 'e-gear-alpha',
                source: 'gear-alpha',
                sourceHandle: 'value',
                target: 'gear-core',
                targetHandle: 'pressure_angle_deg',
                animated: true,
                style: { stroke: '#00e5ff', strokeWidth: 2 }
            },
            {
                id: 'e-gear-torque',
                source: 'gear-torque',
                sourceHandle: 'value',
                target: 'gear-core',
                targetHandle: 'torque_nm',
                animated: true,
                style: { stroke: '#00e5ff', strokeWidth: 2 }
            },
            {
                id: 'e-gear-uc-z',
                source: 'gear-z1',
                sourceHandle: 'value',
                target: 'gear-undercut',
                targetHandle: 'tooth_count',
                animated: true,
                style: { stroke: '#00e5ff', strokeWidth: 2 }
            },
            {
                id: 'e-gear-uc-a',
                source: 'gear-alpha',
                sourceHandle: 'value',
                target: 'gear-undercut',
                targetHandle: 'pressure_angle_deg',
                animated: true,
                style: { stroke: '#00e5ff', strokeWidth: 2 }
            },
            {
                id: 'e-gear-dxf-geom',
                source: 'gear-core',
                sourceHandle: 'geometry',
                target: 'gear-export-dxf',
                targetHandle: 'geometry',
                animated: true,
                style: { stroke: '#10b981', strokeWidth: 2 }
            },
            {
                id: 'e-gear-dxf-rep',
                source: 'gear-core',
                sourceHandle: 'validation_report',
                target: 'gear-export-dxf',
                targetHandle: 'validation_report',
                animated: true,
                style: { stroke: '#10b981', strokeWidth: 2 }
            },
            {
                id: 'e-gear-pdf-rep',
                source: 'gear-core',
                sourceHandle: 'validation_report',
                target: 'gear-export-pdf',
                targetHandle: 'validation_report',
                animated: true,
                style: { stroke: '#a855f7', strokeWidth: 2 }
            },
            {
                id: 'e-gear-pdf-payload',
                source: 'gear-core',
                sourceHandle: 'report_payload',
                target: 'gear-export-pdf',
                targetHandle: 'report_payload',
                animated: true,
                style: { stroke: '#a855f7', strokeWidth: 2 }
            },
            {
                id: 'e-gear-pdf-dxf',
                source: 'gear-core',
                sourceHandle: 'geometry',
                target: 'gear-export-pdf',
                targetHandle: 'dxf_file',
                animated: true,
                style: { stroke: '#a855f7', strokeWidth: 2 }
            },
        ]
    },
    {
        id: 'template-beam-deflection-sf',
        title: 'Beam Deflection & Stress Analysis',
        titleTr: 'Kiriş Sehim ve Gerilme Analizi',
        category: 'structural',
        standard: 'Euler-Bernoulli / ISO 7438',
        description: 'Point-loaded simply supported beam deflection with alloy database integration and safety factor check.',
        tags: ['ISO 7438', 'Euler-Bernoulli', 'sehim'],
        nodes: [
            {
                id: 'beam-mat',
                type: 'engineering',
                position: { x: 60, y: 100 },
                data: { type: 'engineering', schemaId: 'mech-material', materialName: 'Aluminum 6061-T6', nodeVersion: '1.0.0' } as any
            },
            {
                id: 'beam-len',
                type: 'engineering',
                position: { x: 60, y: 340 },
                data: { type: 'engineering', schemaId: 'input-constant-length', value: 1200, nodeVersion: '1.0.0' } as any
            },
            {
                id: 'beam-force',
                type: 'engineering',
                position: { x: 60, y: 470 },
                data: { type: 'engineering', schemaId: 'input-constant-force', value: 4500, nodeVersion: '1.0.0' } as any
            },
            {
                id: 'beam-core',
                type: 'engineering',
                position: { x: 420, y: 220 },
                data: { type: 'engineering', schemaId: 'mech-beam-deflection', I: 150000, Z: 8500, nodeVersion: '1.0.0' } as any
            },
            {
                id: 'beam-sf',
                type: 'engineering',
                position: { x: 800, y: 180 },
                data: { type: 'engineering', schemaId: 'val-safety-factor', nodeVersion: '1.0.0' } as any
            },
            {
                id: 'beam-export-dxf',
                type: 'engineering',
                position: { x: 1140, y: 80 },
                data: { type: 'engineering', schemaId: 'export-dxf', nodeVersion: '1.0.0' } as any
            },
            {
                id: 'beam-export-pdf',
                type: 'engineering',
                position: { x: 1140, y: 280 },
                data: {
                    type: 'engineering',
                    schemaId: 'export-pdf-report',
                    title: 'Beam Deflection Report',
                    standard: 'Euler-Bernoulli / ISO 7438',
                    engine_version: '1.1.0',
                    nodeVersion: '1.0.0'
                } as any
            },
        ],
        edges: [
            {
                id: 'e-beam-len',
                source: 'beam-len',
                sourceHandle: 'value',
                target: 'beam-core',
                targetHandle: 'L',
                animated: true,
                style: { stroke: '#00e5ff', strokeWidth: 2 }
            },
            {
                id: 'e-beam-force',
                source: 'beam-force',
                sourceHandle: 'value',
                target: 'beam-core',
                targetHandle: 'P',
                animated: true,
                style: { stroke: '#00e5ff', strokeWidth: 2 }
            },
            {
                id: 'e-beam-mat-sy',
                source: 'beam-mat',
                sourceHandle: 'Sy',
                target: 'beam-sf',
                targetHandle: 'yield_strength_mpa',
                animated: true,
                style: { stroke: '#f59e0b', strokeWidth: 2 }
            },
            {
                id: 'e-beam-stress',
                source: 'beam-core',
                sourceHandle: 'stress',
                target: 'beam-sf',
                targetHandle: 'stress_mpa',
                animated: true,
                style: { stroke: '#ef4444', strokeWidth: 2 }
            },
            {
                id: 'e-beam-dxf-geom',
                source: 'beam-core',
                sourceHandle: 'geometry',
                target: 'beam-export-dxf',
                targetHandle: 'geometry',
                animated: true,
                style: { stroke: '#10b981', strokeWidth: 2 }
            },
            {
                id: 'e-beam-dxf-rep',
                source: 'beam-sf',
                sourceHandle: 'validation_report',
                target: 'beam-export-dxf',
                targetHandle: 'validation_report',
                animated: true,
                style: { stroke: '#10b981', strokeWidth: 2 }
            },
            {
                id: 'e-beam-pdf-rep',
                source: 'beam-sf',
                sourceHandle: 'validation_report',
                target: 'beam-export-pdf',
                targetHandle: 'validation_report',
                animated: true,
                style: { stroke: '#a855f7', strokeWidth: 2 }
            },
            {
                id: 'e-beam-pdf-payload',
                source: 'beam-core',
                sourceHandle: 'report_payload',
                target: 'beam-export-pdf',
                targetHandle: 'report_payload',
                animated: true,
                style: { stroke: '#a855f7', strokeWidth: 2 }
            },
            {
                id: 'e-beam-pdf-dxf',
                source: 'beam-core',
                sourceHandle: 'geometry',
                target: 'beam-export-pdf',
                targetHandle: 'dxf_file',
                animated: true,
                style: { stroke: '#a855f7', strokeWidth: 2 }
            },
        ]
    },
    {
        id: 'template-bolt-stress-vdi',
        title: 'High-Strength Bolt Joint (VDI 2230)',
        titleTr: 'Yüksek Mukavemetli Cıvata Birleşimi',
        category: 'fasteners',
        standard: 'VDI 2230 / ISO 898-1',
        description: 'Tightening torque calculation, pretension force, and proof-strength safety factor validation.',
        tags: ['VDI 2230', 'ISO 898-1', 'cıvata'],
        nodes: [
            {
                id: 'bolt-torque',
                type: 'engineering',
                position: { x: 80, y: 180 },
                data: { type: 'engineering', schemaId: 'input-constant-torque', value: 110, nodeVersion: '1.0.0' } as any
            },
            {
                id: 'bolt-core',
                type: 'engineering',
                position: { x: 420, y: 150 },
                data: { type: 'engineering', schemaId: 'mech-bolt-stress', diameter: 12, pitch: 1.75, grade: 8.8, torque: 110, nodeVersion: '1.0.0' } as any
            },
            {
                id: 'bolt-sf',
                type: 'engineering',
                position: { x: 780, y: 150 },
                data: { type: 'engineering', schemaId: 'val-safety-factor', nodeVersion: '1.0.0' } as any
            },
            {
                id: 'bolt-export-dxf',
                type: 'engineering',
                position: { x: 1120, y: 60 },
                data: { type: 'engineering', schemaId: 'export-dxf', nodeVersion: '1.0.0' } as any
            },
            {
                id: 'bolt-export-pdf',
                type: 'engineering',
                position: { x: 1120, y: 250 },
                data: {
                    type: 'engineering',
                    schemaId: 'export-pdf-report',
                    title: 'Bolt Joint VDI 2230 Report',
                    standard: 'VDI 2230 / ISO 898-1',
                    engine_version: '1.1.0',
                    nodeVersion: '1.0.0'
                } as any
            },
        ],
        edges: [
            {
                id: 'e-bolt-torque',
                source: 'bolt-torque',
                sourceHandle: 'value',
                target: 'bolt-core',
                targetHandle: 'torque',
                animated: true,
                style: { stroke: '#00e5ff', strokeWidth: 2 }
            },
            {
                id: 'e-bolt-stress',
                source: 'bolt-core',
                sourceHandle: 'stress',
                target: 'bolt-sf',
                targetHandle: 'stress_mpa',
                animated: true,
                style: { stroke: '#ef4444', strokeWidth: 2 }
            },
            {
                id: 'e-bolt-sy',
                source: 'bolt-core',
                sourceHandle: 'proofStrength',
                target: 'bolt-sf',
                targetHandle: 'yield_strength_mpa',
                animated: true,
                style: { stroke: '#f59e0b', strokeWidth: 2 }
            },
            {
                id: 'e-bolt-dxf-geom',
                source: 'bolt-core',
                sourceHandle: 'geometry',
                target: 'bolt-export-dxf',
                targetHandle: 'geometry',
                animated: true,
                style: { stroke: '#10b981', strokeWidth: 2 }
            },
            {
                id: 'e-bolt-dxf-rep',
                source: 'bolt-sf',
                sourceHandle: 'validation_report',
                target: 'bolt-export-dxf',
                targetHandle: 'validation_report',
                animated: true,
                style: { stroke: '#10b981', strokeWidth: 2 }
            },
            {
                id: 'e-bolt-pdf-rep',
                source: 'bolt-sf',
                sourceHandle: 'validation_report',
                target: 'bolt-export-pdf',
                targetHandle: 'validation_report',
                animated: true,
                style: { stroke: '#a855f7', strokeWidth: 2 }
            },
            {
                id: 'e-bolt-pdf-payload',
                source: 'bolt-core',
                sourceHandle: 'report_payload',
                target: 'bolt-export-pdf',
                targetHandle: 'report_payload',
                animated: true,
                style: { stroke: '#a855f7', strokeWidth: 2 }
            },
            {
                id: 'e-bolt-pdf-dxf',
                source: 'bolt-core',
                sourceHandle: 'geometry',
                target: 'bolt-export-pdf',
                targetHandle: 'dxf_file',
                animated: true,
                style: { stroke: '#a855f7', strokeWidth: 2 }
            },
        ]
    },
    {
        id: 'template-shaft-torsion',
        title: 'Transmission Shaft & Torsion Sizing',
        titleTr: 'Aktarma Mili ve Burulma Boyutlandırma',
        category: 'powertrain',
        standard: 'DIN 743 / ASME B106.1M',
        description: 'Torsional shear stress, angle of twist, and shaft diameter verification under dynamic torque.',
        tags: ['DIN 743', 'burulma', 'mil'],
        nodes: [
            {
                id: 'shaft-torque',
                type: 'engineering',
                position: { x: 60, y: 120 },
                data: { type: 'engineering', schemaId: 'input-constant-torque', value: 350, nodeVersion: '1.0.0' } as any
            },
            {
                id: 'shaft-rpm',
                type: 'engineering',
                position: { x: 60, y: 250 },
                data: { type: 'engineering', schemaId: 'input-constant-rpm', value: 1450, nodeVersion: '1.0.0' } as any
            },
            {
                id: 'shaft-mat',
                type: 'engineering',
                position: { x: 60, y: 380 },
                data: { type: 'engineering', schemaId: 'mech-material', materialName: 'AISI 1045 (Carbon)', nodeVersion: '1.0.0' } as any
            },
            {
                id: 'shaft-torsion',
                type: 'engineering',
                position: { x: 420, y: 150 },
                data: { type: 'engineering', schemaId: 'mech-torsion', d: 35, L: 600, nodeVersion: '1.0.0' } as any
            },
            {
                id: 'shaft-sf',
                type: 'engineering',
                position: { x: 800, y: 200 },
                data: { type: 'engineering', schemaId: 'val-safety-factor', nodeVersion: '1.0.0' } as any
            },
            {
                id: 'shaft-export-dxf',
                type: 'engineering',
                position: { x: 1140, y: 80 },
                data: { type: 'engineering', schemaId: 'export-dxf', nodeVersion: '1.0.0' } as any
            },
            {
                id: 'shaft-export-pdf',
                type: 'engineering',
                position: { x: 1140, y: 280 },
                data: {
                    type: 'engineering',
                    schemaId: 'export-pdf-report',
                    title: 'Shaft Torsion DIN 743 Report',
                    standard: 'DIN 743 / ASME B106.1M',
                    engine_version: '1.1.0',
                    nodeVersion: '1.0.0'
                } as any
            },
        ],
        edges: [
            {
                id: 'e-shaft-t',
                source: 'shaft-torque',
                sourceHandle: 'value',
                target: 'shaft-torsion',
                targetHandle: 'T',
                animated: true,
                style: { stroke: '#00e5ff', strokeWidth: 2 }
            },
            {
                id: 'e-shaft-tau',
                source: 'shaft-torsion',
                sourceHandle: 'stress',
                target: 'shaft-sf',
                targetHandle: 'stress_mpa',
                animated: true,
                style: { stroke: '#ef4444', strokeWidth: 2 }
            },
            {
                id: 'e-shaft-sy',
                source: 'shaft-mat',
                sourceHandle: 'Sy',
                target: 'shaft-sf',
                targetHandle: 'yield_strength_mpa',
                animated: true,
                style: { stroke: '#f59e0b', strokeWidth: 2 }
            },
            {
                id: 'e-shaft-dxf-geom',
                source: 'shaft-torsion',
                sourceHandle: 'geometry',
                target: 'shaft-export-dxf',
                targetHandle: 'geometry',
                animated: true,
                style: { stroke: '#10b981', strokeWidth: 2 }
            },
            {
                id: 'e-shaft-dxf-rep',
                source: 'shaft-sf',
                sourceHandle: 'validation_report',
                target: 'shaft-export-dxf',
                targetHandle: 'validation_report',
                animated: true,
                style: { stroke: '#10b981', strokeWidth: 2 }
            },
            {
                id: 'e-shaft-pdf-rep',
                source: 'shaft-sf',
                sourceHandle: 'validation_report',
                target: 'shaft-export-pdf',
                targetHandle: 'validation_report',
                animated: true,
                style: { stroke: '#a855f7', strokeWidth: 2 }
            },
            {
                id: 'e-shaft-pdf-payload',
                source: 'shaft-torsion',
                sourceHandle: 'report_payload',
                target: 'shaft-export-pdf',
                targetHandle: 'report_payload',
                animated: true,
                style: { stroke: '#a855f7', strokeWidth: 2 }
            },
            {
                id: 'e-shaft-pdf-dxf',
                source: 'shaft-torsion',
                sourceHandle: 'geometry',
                target: 'shaft-export-pdf',
                targetHandle: 'dxf_file',
                animated: true,
                style: { stroke: '#a855f7', strokeWidth: 2 }
            },
        ]
    },
    {
        id: 'template-sheet-metal-bend',
        title: 'Sheet Metal Bend Deduction (DIN 6935)',
        titleTr: 'Sac Büküm Payı (DIN 6935)',
        category: 'manufacturing',
        standard: 'DIN 6935',
        description: 'Bend allowance, flat pattern layout, required tonnage and punch force calculation.',
        tags: ['DIN 6935', 'sac', 'büküm'],
        nodes: [
            {
                id: 'sm-thick',
                type: 'engineering',
                position: { x: 80, y: 140 },
                data: { type: 'engineering', schemaId: 'input-constant-length', value: 2.5, nodeVersion: '1.0.0' } as any
            },
            {
                id: 'sm-radius',
                type: 'engineering',
                position: { x: 80, y: 270 },
                data: { type: 'engineering', schemaId: 'input-constant-length', value: 3.5, nodeVersion: '1.0.0' } as any
            },
            {
                id: 'sm-bend',
                type: 'engineering',
                position: { x: 440, y: 180 },
                data: { type: 'engineering', schemaId: 'mech-sheet-metal', angle: 90, kFactor: 0.33, nodeVersion: '1.1.0' } as any
            },
            {
                id: 'sm-export-dxf',
                type: 'engineering',
                position: { x: 800, y: 80 },
                data: { type: 'engineering', schemaId: 'export-dxf', nodeVersion: '1.0.0' } as any
            },
            {
                id: 'sm-export-pdf',
                type: 'engineering',
                position: { x: 800, y: 280 },
                data: {
                    type: 'engineering',
                    schemaId: 'export-pdf-report',
                    title: 'Sheet Metal Bend DIN 6935 Report',
                    standard: 'DIN 6935',
                    engine_version: '1.1.0',
                    nodeVersion: '1.0.0'
                } as any
            },
        ],
        edges: [
            {
                id: 'e-sm-t',
                source: 'sm-thick',
                sourceHandle: 'value',
                target: 'sm-bend',
                targetHandle: 'thickness',
                animated: true,
                style: { stroke: '#00e5ff', strokeWidth: 2 }
            },
            {
                id: 'e-sm-r',
                source: 'sm-radius',
                sourceHandle: 'value',
                target: 'sm-bend',
                targetHandle: 'radius',
                animated: true,
                style: { stroke: '#00e5ff', strokeWidth: 2 }
            },
            {
                id: 'e-sm-dxf-geom',
                source: 'sm-bend',
                sourceHandle: 'geometry',
                target: 'sm-export-dxf',
                targetHandle: 'geometry',
                animated: true,
                style: { stroke: '#10b981', strokeWidth: 2 }
            },
            {
                id: 'e-sm-dxf-rep',
                source: 'sm-bend',
                sourceHandle: 'validation_report',
                target: 'sm-export-dxf',
                targetHandle: 'validation_report',
                animated: true,
                style: { stroke: '#10b981', strokeWidth: 2 }
            },
            {
                id: 'e-sm-pdf-rep',
                source: 'sm-bend',
                sourceHandle: 'validation_report',
                target: 'sm-export-pdf',
                targetHandle: 'validation_report',
                animated: true,
                style: { stroke: '#a855f7', strokeWidth: 2 }
            },
            {
                id: 'e-sm-pdf-payload',
                source: 'sm-bend',
                sourceHandle: 'report_payload',
                target: 'sm-export-pdf',
                targetHandle: 'report_payload',
                animated: true,
                style: { stroke: '#a855f7', strokeWidth: 2 }
            },
            {
                id: 'e-sm-pdf-dxf',
                source: 'sm-bend',
                sourceHandle: 'geometry',
                target: 'sm-export-pdf',
                targetHandle: 'dxf_file',
                animated: true,
                style: { stroke: '#a855f7', strokeWidth: 2 }
            },
        ]
    }
];

import { ADVANCED_ENGINEERING_TEMPLATES } from './advancedEngineeringTemplates';
import { PRECISION_ENGINEERING_TEMPLATES } from './precisionEngineeringTemplates';
import { SANDBOX_TEMPLATES } from './sandboxTemplates';

const ALL_TEMPLATES = [...INDUSTRIAL_TEMPLATES, ...ADVANCED_ENGINEERING_TEMPLATES, ...PRECISION_ENGINEERING_TEMPLATES];
const FEATURED = ALL_TEMPLATES.filter((t) => t.featured);
const REST = ALL_TEMPLATES.filter((t) => !t.featured);

export const ENGINEERING_TEMPLATES: FlowTemplate[] = [...FEATURED, ...CLASSIC_TEMPLATES, ...REST];

export function getTemplateById(id: string): FlowTemplate | undefined {
    return ENGINEERING_TEMPLATES.find((t) => t.id === id) || SANDBOX_TEMPLATES.find((t) => t.id === id);
}

export { ADVANCED_ENGINEERING_TEMPLATES } from './advancedEngineeringTemplates';
export { PRECISION_ENGINEERING_TEMPLATES } from './precisionEngineeringTemplates';
export { SANDBOX_TEMPLATES } from './sandboxTemplates';

