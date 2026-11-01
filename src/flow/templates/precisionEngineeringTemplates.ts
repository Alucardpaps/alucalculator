/**
 * AluCalculator OS — Precision Engineering Templates (Batch 3)
 *
 * 12 Multi-Disciplinary Deterministic Calculation Pipelines:
 * 1. High-Speed Roller Chain Conveyor Drive (ISO 606 / DIN 8187 / ISO 10823)
 * 2. Heavy-Duty Helical Compression Die Spring (DIN EN 13906-1 / DIN 2089)
 * 3. Spherical Roller Bearing Dynamic Rating Life (ISO 281 / ISO 76)
 * 4. CHS Tubular Mast Column Buckling (EN 10210 / Eurocode 3)
 * 5. Structural C-Channel Gantry Crane Trolley Beam (EN 10279 / Eurocode 3)
 * 6. Precision Hydraulic Tooling Clamp Actuator (ISO 6020-2 / DIN 24554)
 * 7. Industrial V-Belt Transmission Drive (ISO 4184 / DIN 2215)
 * 8. High-Strength Flange Bolt Pretension & Torque (VDI 2230 / ISO 898-1)
 * 9. Precision Sheet Metal Enclosure Forming (DIN 6935 / VDI 3388)
 * 10. Carburized & Quenched Heavy Pinion Gear (ISO 2639 / ISO 6336-5)
 * 11. Cryogenic Stainless Storage Pressure Vessel (ASME BPVC VIII-1 / EN 13445)
 * 12. High-Inertia Flywheel & Shaft Torsion Drive (ISO 80000-4 / DIN 743)
 *
 * Layer: flow (Pure TypeScript, zero DOM/React dependencies).
 */

import type { FlowNode, FlowEdge } from '@/store/flowStore';
import type { FlowTemplate } from './types';

function node(
    id: string,
    x: number,
    y: number,
    schemaId: string,
    extra: Record<string, unknown> = {}
): FlowNode {
    return {
        id,
        type: 'engineering',
        position: { x, y },
        data: { type: 'engineering', schemaId, nodeVersion: '1.0.0', ...extra } as FlowNode['data'],
    };
}

function edge(
    id: string,
    source: string,
    sourceHandle: string,
    target: string,
    targetHandle: string,
    color = '#00e5ff'
): FlowEdge {
    return {
        id,
        source,
        sourceHandle,
        target,
        targetHandle,
        animated: true,
        style: { stroke: color, strokeWidth: 2 },
    };
}

const DXF = '#10b981';
const PDF = '#a855f7';
const STRESS = '#ef4444';
const YIELD = '#f59e0b';
const FORCE = '#38bdf8';

export const PRECISION_ENGINEERING_TEMPLATES: FlowTemplate[] = [
    // ---------------------------------------------------------------------------
    // 1. High-Speed Roller Chain Conveyor Drive (ISO 606 / DIN 8187 / ISO 10823)
    // ---------------------------------------------------------------------------
    {
        id: 'template-roller-chain-conveyor',
        title: 'High-Speed Roller Chain Conveyor Drive',
        titleTr: 'Yüksek Hızlı Makaralı Zincir Konveyör Tahriki',
        category: 'powertrain',
        standard: 'ISO 606 / DIN 8187 / ISO 10823',
        description:
            'Sizing industrial chain transmission: 11 kW drive motor, ISO 10B duplex sprocket mesh, center distance pitch back-solving, chain pull tension, and DXF schematic.',
        descriptionTr:
            '11 kW elektrik motoru, ISO 10B dubleks zincir dişlisi, merkez eksen diş adımı ters çözümü, zincir çekme kuvveti ve DXF teknik şeması.',
        tags: ['ISO 606', 'DIN 8187', 'ISO 10823', 'Chain Drive', 'Conveyor'],
        featured: true,
        nodes: [
            node('rcc-p', 40, 60, 'input-constant-power', { value: 11 }),
            node('rcc-rpm', 40, 200, 'input-constant-rpm', { value: 960 }),
            node('rcc-c', 40, 340, 'input-constant-length', { value: 650 }),
            node('rcc-chain', 420, 100, 'mech-chain-drive', {
                z1: 19,
                z2: 57,
                Ks: 1.3,
                chain_no: '10B',
                strands: 2,
            }),
            node('rcc-export-dxf', 920, 60, 'export-dxf'),
            node('rcc-export-pdf', 920, 260, 'export-pdf-report', {
                title: 'Roller Chain Conveyor Drive Report',
                standard: 'ISO 606 / ISO 10823',
                engine_version: '1.1.0',
            }),
        ],
        edges: [
            edge('e-rcc-p', 'rcc-p', 'value', 'rcc-chain', 'power_kw', FORCE),
            edge('e-rcc-rpm', 'rcc-rpm', 'value', 'rcc-chain', 'rpm', FORCE),
            edge('e-rcc-c', 'rcc-c', 'value', 'rcc-chain', 'C', FORCE),
            edge('e-rcc-dxf-geom', 'rcc-chain', 'geometry', 'rcc-export-dxf', 'geometry', DXF),
            edge('e-rcc-dxf-rep', 'rcc-chain', 'validation_report', 'rcc-export-dxf', 'validation_report', DXF),
            edge('e-rcc-pdf-rep', 'rcc-chain', 'validation_report', 'rcc-export-pdf', 'validation_report', PDF),
            edge('e-rcc-pdf-pl', 'rcc-chain', 'report_payload', 'rcc-export-pdf', 'report_payload', PDF),
            edge('e-rcc-pdf-dxf', 'rcc-chain', 'geometry', 'rcc-export-pdf', 'dxf_file', PDF),
        ],
    },

    // ---------------------------------------------------------------------------
    // 2. Heavy-Duty Helical Compression Die Spring (DIN EN 13906-1 / DIN 2089)
    // ---------------------------------------------------------------------------
    {
        id: 'template-compression-die-spring',
        title: 'Heavy-Duty Helical Compression Die Spring',
        titleTr: 'Ağır Hizmet Helisel Baskı Kalıp Yayı',
        category: 'manufacturing',
        standard: 'DIN EN 13906-1 / DIN 2089',
        description:
            'Heavy stamping die return spring: Wahl dynamic stress factor Kw, spring rate k, solid height Lc, first-order surge resonance fn, and safety factor against 51CrV4 spring steel.',
        descriptionTr:
            'Pres kalıbı geri dönüş yayı: Wahl dinamik gerilme faktörü Kw, yay rijitliği k, blok boyu Lc, birinci rezonans frekansı fn ve 51CrV4 yay çeliği emniyet katsayısı.',
        tags: ['DIN EN 13906-1', 'DIN 2089', 'Helical Spring', 'Die Spring', 'Stamping'],
        featured: false,
        nodes: [
            node('cds-f', 40, 60, 'input-constant-force', { value: 500 }),
            node('cds-mat', 40, 220, 'mech-material', { materialName: 'AISI 4140' }),
            node('cds-spring', 420, 60, 'mech-spring-design', {
                d: 6.0,
                D: 42.0,
                Na: 8.5,
                G: 79.5,
            }),
            node('cds-sf', 820, 60, 'val-safety-factor'),
            node('cds-export-dxf', 1200, 60, 'export-dxf'),
            node('cds-export-pdf', 1200, 260, 'export-pdf-report', {
                title: 'Helical Compression Die Spring Report',
                standard: 'DIN EN 13906-1 / DIN 2089',
                engine_version: '1.1.0',
            }),
        ],
        edges: [
            edge('e-cds-f', 'cds-f', 'value', 'cds-spring', 'F', FORCE),
            edge('e-cds-tau', 'cds-spring', 'tau', 'cds-sf', 'stress_mpa', STRESS),
            edge('e-cds-sy', 'cds-mat', 'Sy', 'cds-sf', 'yield_strength_mpa', YIELD),
            edge('e-cds-dxf-geom', 'cds-spring', 'geometry', 'cds-export-dxf', 'geometry', DXF),
            edge('e-cds-dxf-rep', 'cds-sf', 'validation_report', 'cds-export-dxf', 'validation_report', DXF),
            edge('e-cds-pdf-rep', 'cds-sf', 'validation_report', 'cds-export-pdf', 'validation_report', PDF),
            edge('e-cds-pdf-pl', 'cds-spring', 'report_payload', 'cds-export-pdf', 'report_payload', PDF),
            edge('e-cds-pdf-dxf', 'cds-spring', 'geometry', 'cds-export-pdf', 'dxf_file', PDF),
        ],
    },

    // ---------------------------------------------------------------------------
    // 3. Spherical Roller Bearing Dynamic Rating Life (ISO 281 / ISO 76)
    // ---------------------------------------------------------------------------
    {
        id: 'template-spherical-roller-bearing-life',
        title: 'Spherical Roller Bearing Dynamic Rating Life',
        titleTr: 'Oynak Makaralı Rulman Dinamik Ömür Analizi',
        category: 'powertrain',
        standard: 'ISO 281 / ISO 76',
        description:
            'ISO 281 equivalent dynamic load Pe, L10h rating life (hours), and static safety factor s0 for high-load crusher drivetrain under combined radial and axial thrust.',
        descriptionTr:
            'Ağır kırıcı güç aktarımında radyal ve eksenel kombine yükler altında ISO 281 eşdeğer dinamik yük Pe, L10h anma ömrü ve statik emniyet s0 hesabı.',
        tags: ['ISO 281', 'ISO 76', 'Bearing Life', 'L10h', 'Roller Bearing'],
        featured: false,
        nodes: [
            node('srb-fr', 40, 60, 'input-constant-force', { value: 18000 }),
            node('srb-fa', 40, 200, 'input-constant-force', { value: 3500 }),
            node('srb-rpm', 40, 340, 'input-constant-rpm', { value: 720 }),
            node('srb-bearing', 420, 100, 'mech-bearing-life', {
                C: 145000,
                C0: 170000,
                type: 1,
            }),
            node('srb-export-dxf', 920, 60, 'export-dxf'),
            node('srb-export-pdf', 920, 260, 'export-pdf-report', {
                title: 'Spherical Roller Bearing Life Report',
                standard: 'ISO 281 / ISO 76',
                engine_version: '1.1.0',
            }),
        ],
        edges: [
            edge('e-srb-fr', 'srb-fr', 'value', 'srb-bearing', 'Fr', FORCE),
            edge('e-srb-fa', 'srb-fa', 'value', 'srb-bearing', 'Fa', FORCE),
            edge('e-srb-rpm', 'srb-rpm', 'value', 'srb-bearing', 'rpm', FORCE),
            edge('e-srb-dxf-geom', 'srb-bearing', 'geometry', 'srb-export-dxf', 'geometry', DXF),
            edge('e-srb-dxf-rep', 'srb-bearing', 'validation_report', 'srb-export-dxf', 'validation_report', DXF),
            edge('e-srb-pdf-rep', 'srb-bearing', 'validation_report', 'srb-export-pdf', 'validation_report', PDF),
            edge('e-srb-pdf-pl', 'srb-bearing', 'report_payload', 'srb-export-pdf', 'report_payload', PDF),
            edge('e-srb-pdf-dxf', 'srb-bearing', 'geometry', 'srb-export-pdf', 'dxf_file', PDF),
        ],
    },

    // ---------------------------------------------------------------------------
    // 4. CHS Tubular Mast Column Buckling (EN 10210 / Eurocode 3)
    // ---------------------------------------------------------------------------
    {
        id: 'template-chs-tubular-mast-column',
        title: 'CHS Tubular Mast Column Buckling',
        titleTr: 'CHS Dairesel Boru Direk & Kolon Burkulması',
        category: 'structural',
        standard: 'EN 10210 / EN 1993-1-1 / Eurocode 3',
        description:
            'Circular Hollow Section (CHS 168.3x6.3) structural mast column with cross-section bridge, Euler buckling critical force Pcr, slenderness ratio lambda, and Eurocode 3 safety factor.',
        descriptionTr:
            'EN 10210 dairesel içi boş kesit (CHS 168.3x6.3) direk kolonu: Kesit aktarım köprüsü, Euler kritik burkulma kuvveti Pcr, narinlik oranı lambda ve Eurocode 3 emniyeti.',
        tags: ['EN 10210', 'Eurocode 3', 'CHS Tube', 'Buckling', 'Mast Column'],
        featured: false,
        nodes: [
            node('chs-geom', 40, 60, 'geom-chs-pipe', { d_ext: 168.3, t: 6.3 }),
            node('chs-bridge', 420, 60, 'geom-transfer-bridge'),
            node('chs-mat', 40, 220, 'mech-material', { materialName: 'S355J2 (St52)' }),
            node('chs-force', 40, 360, 'input-constant-force', { value: 140000 }),
            node('chs-len', 40, 500, 'input-constant-length', { value: 3800 }),
            node('chs-buckle', 820, 100, 'mech-column-buckling', {
                I: 10540000,
                A: 3206,
                buckling_curve: 'a',
                K: 1,
            }),
            node('chs-export-dxf', 1240, 60, 'export-dxf'),
            node('chs-export-pdf', 1240, 260, 'export-pdf-report', {
                title: 'CHS Tubular Column Buckling Report',
                standard: 'EN 10210 / EN 1993-1-1',
                engine_version: '1.0.0',
            }),
        ],
        edges: [
            edge('e-chs-p', 'chs-geom', 'profile', 'chs-bridge', 'profile', '#38bdf8'),
            edge('e-chs-l', 'chs-len', 'value', 'chs-buckle', 'L', FORCE),
            edge('e-chs-f', 'chs-force', 'value', 'chs-buckle', 'P', FORCE),
            edge('e-chs-mat-fy', 'chs-mat', 'Sy', 'chs-buckle', 'fy', YIELD),
            edge('e-chs-mat-e', 'chs-mat', 'E', 'chs-buckle', 'E', YIELD),
            edge('e-chs-dxf-geom', 'chs-buckle', 'geometry', 'chs-export-dxf', 'geometry', DXF),
            edge('e-chs-dxf-rep', 'chs-buckle', 'validation_report', 'chs-export-dxf', 'validation_report', DXF),
            edge('e-chs-pdf-rep', 'chs-buckle', 'validation_report', 'chs-export-pdf', 'validation_report', PDF),
            edge('e-chs-pdf-pl', 'chs-buckle', 'report_payload', 'chs-export-pdf', 'report_payload', PDF),
            edge('e-chs-pdf-dxf', 'chs-buckle', 'geometry', 'chs-export-pdf', 'dxf_file', PDF),
        ],
    },

    // ---------------------------------------------------------------------------
    // 5. Structural C-Channel Gantry Crane Trolley Beam (EN 10279 / Eurocode 3)
    // ---------------------------------------------------------------------------
    {
        id: 'template-c-channel-gantry-trolley',
        title: 'Structural C-Channel Gantry Crane Trolley Beam',
        titleTr: 'C-Kanal Portal Vinç Kedi Kirişi & Sehim',
        category: 'structural',
        standard: 'EN 10279 / DIN 1026 / Eurocode 3',
        description:
            'Hot-rolled C-Channel (UPN 200) gantry girder: Asymmetric section properties, cantilever point load deflection, maximum bending stress, and Eurocode 3 safety verification.',
        descriptionTr:
            'Sıcak haddelenmiş C-Kanal (UPN 200) vinç taşıyıcı kirişi: Asimetrik kesit köprüsü, noktasal yük altında sehim hesabı, eğilme gerilmesi ve Eurocode 3 emniyeti.',
        tags: ['EN 10279', 'DIN 1026', 'C-Channel', 'Beam Deflection', 'Crane Gantry'],
        featured: false,
        nodes: [
            node('ccg-geom', 40, 60, 'geom-c-channel', { h: 200, b: 75, tw: 8.5, tf: 11.5, r: 11.5 }),
            node('ccg-bridge', 420, 60, 'geom-transfer-bridge'),
            node('ccg-mat', 40, 220, 'mech-material', { materialName: 'S355J2 (St52)' }),
            node('ccg-force', 40, 360, 'input-constant-force', { value: 8500 }),
            node('ccg-len', 40, 500, 'input-constant-length', { value: 2400 }),
            node('ccg-beam', 820, 60, 'mech-beam-deflection', {
                beamType: 'simply_supported',
                loadType: 'point_center',
            }),
            node('ccg-sf', 1200, 60, 'val-safety-factor'),
            node('ccg-export-dxf', 1580, 60, 'export-dxf'),
            node('ccg-export-pdf', 1580, 260, 'export-pdf-report', {
                title: 'C-Channel Crane Trolley Beam Report',
                standard: 'EN 10279 / Eurocode 3',
                engine_version: '1.1.0',
            }),
        ],
        edges: [
            edge('e-ccg-p', 'ccg-geom', 'profile', 'ccg-bridge', 'profile', '#38bdf8'),
            edge('e-ccg-ix', 'ccg-bridge', 'ix', 'ccg-beam', 'I', '#38bdf8'),
            edge('e-ccg-wx', 'ccg-bridge', 'wx', 'ccg-beam', 'Z', '#38bdf8'),
            edge('e-ccg-e', 'ccg-mat', 'E', 'ccg-beam', 'E', YIELD),
            edge('e-ccg-f', 'ccg-force', 'value', 'ccg-beam', 'P', FORCE),
            edge('e-ccg-l', 'ccg-len', 'value', 'ccg-beam', 'L', FORCE),
            edge('e-ccg-stress', 'ccg-beam', 'stress', 'ccg-sf', 'stress_mpa', STRESS),
            edge('e-ccg-sy', 'ccg-mat', 'Sy', 'ccg-sf', 'yield_strength_mpa', YIELD),
            edge('e-ccg-dxf-geom', 'ccg-beam', 'geometry', 'ccg-export-dxf', 'geometry', DXF),
            edge('e-ccg-dxf-rep', 'ccg-sf', 'validation_report', 'ccg-export-dxf', 'validation_report', DXF),
            edge('e-ccg-pdf-rep', 'ccg-sf', 'validation_report', 'ccg-export-pdf', 'validation_report', PDF),
            edge('e-ccg-pdf-pl', 'ccg-beam', 'report_payload', 'ccg-export-pdf', 'report_payload', PDF),
            edge('e-ccg-pdf-dxf', 'ccg-beam', 'geometry', 'ccg-export-pdf', 'dxf_file', PDF),
        ],
    },

    // ---------------------------------------------------------------------------
    // 6. Precision Hydraulic Tooling Clamp Actuator (ISO 6020-2 / DIN 24554)
    // ---------------------------------------------------------------------------
    {
        id: 'template-hydraulic-clamp-actuator',
        title: 'Precision Hydraulic Tooling Clamp Actuator',
        titleTr: 'Hassas Hidrolik Takım Sıkma Silindiri',
        category: 'manufacturing',
        standard: 'ISO 6020-2 / DIN 24554',
        description:
            'Double-acting tie-rod hydraulic cylinder: 160 bar clamping circuit, push force F_push, annular pull force F_pull, flow rate Q, and hydraulic port DXF geometry.',
        descriptionTr:
            'Çift etkili hidrolik silindir: 160 bar sıkma devresi, itme kuvveti F_push, çekme kuvveti F_pull, debi Q gereksinimi ve AutoCAD DXF şeması.',
        tags: ['ISO 6020-2', 'DIN 24554', 'Hydraulic Cylinder', 'Clamping', 'Fluid Power'],
        featured: false,
        nodes: [
            node('hca-f', 40, 60, 'input-constant-force', { value: 35000 }),
            node('hca-p', 40, 190, 'input-constant-pressure', { value: 16 }),
            node('hca-stroke', 40, 320, 'input-constant-length', { value: 250 }),
            node('hca-mat', 40, 450, 'mech-material', { materialName: 'Steel AISI 1020' }),
            node('hca-cyl', 420, 150, 'mech-hydraulic-cylinder', {
                piston_speed_mm_s: 120,
                K: 1,
            }),
            node('hca-export-dxf', 920, 60, 'export-dxf'),
            node('hca-export-pdf', 920, 260, 'export-pdf-report', {
                title: 'Hydraulic Tooling Clamp Actuator Report',
                standard: 'ISO 6020-2 / DIN 24554',
                engine_version: '1.0.0',
            }),
        ],
        edges: [
            edge('e-hca-f', 'hca-f', 'value', 'hca-cyl', 'F', FORCE),
            edge('e-hca-p', 'hca-p', 'value', 'hca-cyl', 'P', FORCE),
            edge('e-hca-stroke', 'hca-stroke', 'value', 'hca-cyl', 'stroke', FORCE),
            edge('e-hca-e', 'hca-mat', 'E', 'hca-cyl', 'E', YIELD),
            edge('e-hca-fy', 'hca-mat', 'Sy', 'hca-cyl', 'fy', YIELD),
            edge('e-hca-dxf-geom', 'hca-cyl', 'geometry', 'hca-export-dxf', 'geometry', DXF),
            edge('e-hca-dxf-rep', 'hca-cyl', 'validation_report', 'hca-export-dxf', 'validation_report', DXF),
            edge('e-hca-pdf-rep', 'hca-cyl', 'validation_report', 'hca-export-pdf', 'validation_report', PDF),
            edge('e-hca-pdf-pl', 'hca-cyl', 'report_payload', 'hca-export-pdf', 'report_payload', PDF),
            edge('e-hca-pdf-dxf', 'hca-cyl', 'geometry', 'hca-export-pdf', 'dxf_file', PDF),
        ],
    },

    // ---------------------------------------------------------------------------
    // 7. Industrial V-Belt Transmission Drive (ISO 4184 / DIN 2215)
    // ---------------------------------------------------------------------------
    {
        id: 'template-poly-v-belt-transmission',
        title: 'Industrial V-Belt Transmission Drive',
        titleTr: 'Endüstriyel V-Kayış Güç İletim Sistemi',
        category: 'powertrain',
        standard: 'ISO 4184 / DIN 2215 / BS 3790',
        description:
            'Classical SPB V-belt transmission: 18.5 kW electric motor, standard pitch diameters (d1=160mm, d2=315mm), belt speed, contact arc factor, tight/slack tensions, and layout DXF.',
        descriptionTr:
            'SPB profil V-kayış tahrik mekanizması: 18.5 kW motor, standart kasnak çapları (160/315 mm), kayış çizgisel hızı, sarım açısı faktörü, kayış gergi kuvvetleri ve DXF şeması.',
        tags: ['ISO 4184', 'DIN 2215', 'V-Belt', 'Belt Drive', 'Pulley'],
        featured: false,
        nodes: [
            node('pvb-p', 40, 60, 'input-constant-power', { value: 18.5 }),
            node('pvb-rpm', 40, 200, 'input-constant-rpm', { value: 1450 }),
            node('pvb-d1', 40, 340, 'input-constant-diameter', { value: 160 }),
            node('pvb-d2', 40, 480, 'input-constant-diameter', { value: 315 }),
            node('pvb-c', 40, 620, 'input-constant-length', { value: 700 }),
            node('pvb-belt', 420, 200, 'mech-belt-drive', {
                profile: 'SPB',
                belt_type: 'v',
                service_factor: 1.25,
            }),
            node('pvb-export-dxf', 920, 60, 'export-dxf'),
            node('pvb-export-pdf', 920, 260, 'export-pdf-report', {
                title: 'Industrial V-Belt Transmission Drive Report',
                standard: 'ISO 4184 / DIN 2215',
                engine_version: '1.1.0',
            }),
        ],
        edges: [
            edge('e-pvb-p', 'pvb-p', 'value', 'pvb-belt', 'power_kw', FORCE),
            edge('e-pvb-rpm', 'pvb-rpm', 'value', 'pvb-belt', 'rpm', FORCE),
            edge('e-pvb-d1', 'pvb-d1', 'value', 'pvb-belt', 'd1', FORCE),
            edge('e-pvb-d2', 'pvb-d2', 'value', 'pvb-belt', 'd2', FORCE),
            edge('e-pvb-c', 'pvb-c', 'value', 'pvb-belt', 'C', FORCE),
            edge('e-pvb-dxf-geom', 'pvb-belt', 'geometry', 'pvb-export-dxf', 'geometry', DXF),
            edge('e-pvb-dxf-rep', 'pvb-belt', 'validation_report', 'pvb-export-dxf', 'validation_report', DXF),
            edge('e-pvb-pdf-rep', 'pvb-belt', 'validation_report', 'pvb-export-pdf', 'validation_report', PDF),
            edge('e-pvb-pdf-pl', 'pvb-belt', 'report_payload', 'pvb-export-pdf', 'report_payload', PDF),
            edge('e-pvb-pdf-dxf', 'pvb-belt', 'geometry', 'pvb-export-pdf', 'dxf_file', PDF),
        ],
    },

    // ---------------------------------------------------------------------------
    // 8. High-Strength Flange Bolt Pretension & Torque (VDI 2230 / ISO 898-1)
    // ---------------------------------------------------------------------------
    {
        id: 'template-flange-bolt-pretension',
        title: 'High-Strength Flange Bolt Pretension & Torque',
        titleTr: 'Yüksek Mukavemetli Flanş Cıvatası Ön Gerilme & Tork',
        category: 'fasteners',
        standard: 'VDI 2230 / ISO 898-1',
        description:
            'Critical pipe flange joint: M24 Grade 10.9 fastener bolt, VDI 2230 nut tightening torque (450 Nm), clamp preload force, tensile stress area, and proof strength safety verification.',
        descriptionTr:
            'Basınçlı boru flanş bağlantısı: M24 Kalite 10.9 cıvata, VDI 2230 sıkma torku (450 Nm), ön yükleme kuvveti, çekme gerilme alanı ve akma dayanımı emniyet doğrulaması.',
        tags: ['VDI 2230', 'ISO 898-1', 'Bolt Stress', 'Preload', 'Flange Fastener'],
        featured: false,
        nodes: [
            node('fbp-t', 40, 100, 'input-constant-torque', { value: 450 }),
            node('fbp-bolt', 420, 100, 'mech-bolt-stress', {
                diameter: 24,
                pitch: 3.0,
                grade: 10.9,
            }),
            node('fbp-export-dxf', 920, 60, 'export-dxf'),
            node('fbp-export-pdf', 920, 260, 'export-pdf-report', {
                title: 'High-Strength Flange Bolt Report',
                standard: 'VDI 2230 / ISO 898-1',
                engine_version: '1.1.0',
            }),
        ],
        edges: [
            edge('e-fbp-t', 'fbp-t', 'value', 'fbp-bolt', 'torque', FORCE),
            edge('e-fbp-dxf-geom', 'fbp-bolt', 'geometry', 'fbp-export-dxf', 'geometry', DXF),
            edge('e-fbp-dxf-rep', 'fbp-bolt', 'validation_report', 'fbp-export-dxf', 'validation_report', DXF),
            edge('e-fbp-pdf-rep', 'fbp-bolt', 'validation_report', 'fbp-export-pdf', 'validation_report', PDF),
            edge('e-fbp-pdf-pl', 'fbp-bolt', 'report_payload', 'fbp-export-pdf', 'report_payload', PDF),
            edge('e-fbp-pdf-dxf', 'fbp-bolt', 'geometry', 'fbp-export-pdf', 'dxf_file', PDF),
        ],
    },

    // ---------------------------------------------------------------------------
    // 9. Precision Sheet Metal Enclosure Forming (DIN 6935 / VDI 3388)
    // ---------------------------------------------------------------------------
    {
        id: 'template-sheet-metal-chassis-kfactor',
        title: 'Precision Sheet Metal Enclosure Forming (K-Factor)',
        titleTr: 'Hassas Sac Kasa Büküm & K-Faktörü Açınımı',
        category: 'manufacturing',
        standard: 'DIN 6935 / VDI 3388',
        description:
            'Industrial electronic chassis sheet metal bend: DIN 6935 neutral axis K-factor (0.38), bend allowance BA, bend deduction BD, outside setback OSSB, and flat blank layout DXF.',
        descriptionTr:
            'Elektronik cihaz şasisi sac büküm hesabı: DIN 6935 nötr eksen K-faktörü (0.38), büküm payı BA, büküm düşümü BD, dış çekme OSSB ve açınım düzlem DXF çıktısı.',
        tags: ['DIN 6935', 'VDI 3388', 'Sheet Metal', 'K-Factor', 'Bend Allowance'],
        featured: false,
        nodes: [
            node('smc-t', 40, 80, 'input-constant-length', { value: 2.5 }),
            node('smc-r', 40, 240, 'input-constant-length', { value: 2.5 }),
            node('smc-bend', 420, 120, 'mech-sheet-metal', {
                angle: 90,
                kFactor: 0.38,
                flangeA: 65,
                flangeB: 110,
                width: 180,
            }),
            node('smc-export-dxf', 920, 60, 'export-dxf'),
            node('smc-export-pdf', 920, 260, 'export-pdf-report', {
                title: 'Sheet Metal Enclosure Forming Report',
                standard: 'DIN 6935 / VDI 3388',
                engine_version: '1.1.0',
            }),
        ],
        edges: [
            edge('e-smc-t', 'smc-t', 'value', 'smc-bend', 'thickness', FORCE),
            edge('e-smc-r', 'smc-r', 'value', 'smc-bend', 'radius', FORCE),
            edge('e-smc-dxf-geom', 'smc-bend', 'geometry', 'smc-export-dxf', 'geometry', DXF),
            edge('e-smc-dxf-rep', 'smc-bend', 'validation_report', 'smc-export-dxf', 'validation_report', DXF),
            edge('e-smc-pdf-rep', 'smc-bend', 'validation_report', 'smc-export-pdf', 'validation_report', PDF),
            edge('e-smc-pdf-pl', 'smc-bend', 'report_payload', 'smc-export-pdf', 'report_payload', PDF),
            edge('e-smc-pdf-dxf', 'smc-bend', 'geometry', 'smc-export-pdf', 'dxf_file', PDF),
        ],
    },

    // ---------------------------------------------------------------------------
    // 10. Carburized & Quenched Heavy Pinion Gear (ISO 2639 / ISO 6336-5)
    // ---------------------------------------------------------------------------
    {
        id: 'template-carburized-pinion-quench',
        title: 'Carburized & Quenched Heavy Pinion Gear',
        titleTr: 'Semente Edilmiş & Islahlı Ağır Pinyon Dişli',
        category: 'metallurgy_materials',
        standard: 'ISO 2639 / ISO 6336-5 / DIN 3960',
        description:
            '18CrNiMo7-6 alloy gear steel: Case hardening & carburizing at 920°C, effective case depth CHD, tempered core yield strength, and ISO 6336 spur pinion tooth bending check.',
        descriptionTr:
            '18CrNiMo7-6 sementasyon çeliği: 920°C sementasyon ve su verme, efektif sertlik derinliği CHD, çekirdek akma dayanımı ve ISO 6336 düz dişli diş dibi gerilme kontrolü.',
        tags: ['ISO 2639', 'ISO 6336-5', 'DIN 3960', 'Case Hardening', 'Carburizing', 'Gear'],
        featured: false,
        nodes: [
            node('cpq-mat', 40, 60, 'mat-universal-selector', { material_name: 'AISI 4140 (Cr-Mo)' }),
            node('cpq-ht', 420, 60, 'mat-heat-treatment', {
                process_type: 1,
                treatment_temp_c: 920,
                soak_time_hours: 4,
            }),
            node('cpq-mod', 40, 220, 'input-constant-module', { value: 4 }),
            node('cpq-z1', 40, 360, 'input-constant-teeth', { value: 19 }),
            node('cpq-z2', 40, 500, 'input-constant-teeth', { value: 57 }),
            node('cpq-torque', 40, 640, 'input-constant-torque', { value: 350 }),
            node('cpq-gear', 420, 300, 'mech-gear-spur', {
                face_width_mm: 45,
                pressure_angle_deg: 20,
            }),
            node('cpq-sf', 840, 180, 'val-safety-factor'),
            node('cpq-export-dxf', 1240, 60, 'export-dxf'),
            node('cpq-export-pdf', 1240, 260, 'export-pdf-report', {
                title: 'Carburized Pinion Gear Report',
                standard: 'ISO 2639 / ISO 6336',
                engine_version: '1.2.0',
            }),
        ],
        edges: [
            edge('e-cpq-by', 'cpq-mat', 'yield_strength', 'cpq-ht', 'base_yield', YIELD),
            edge('e-cpq-bt', 'cpq-mat', 'tensile_strength', 'cpq-ht', 'base_tensile', YIELD),
            edge('e-cpq-m', 'cpq-mod', 'value', 'cpq-gear', 'module_mm', FORCE),
            edge('e-cpq-z1', 'cpq-z1', 'value', 'cpq-gear', 'pinion_teeth', FORCE),
            edge('e-cpq-z2', 'cpq-z2', 'value', 'cpq-gear', 'gear_teeth', FORCE),
            edge('e-cpq-t', 'cpq-torque', 'value', 'cpq-gear', 'torque_nm', FORCE),
            edge('e-cpq-stress', 'cpq-gear', 'sigma_F', 'cpq-sf', 'stress_mpa', STRESS),
            edge('e-cpq-yield', 'cpq-ht', 'final_yield', 'cpq-sf', 'yield_strength_mpa', YIELD),
            edge('e-cpq-dxf-geom', 'cpq-gear', 'geometry', 'cpq-export-dxf', 'geometry', DXF),
            edge('e-cpq-dxf-rep', 'cpq-sf', 'validation_report', 'cpq-export-dxf', 'validation_report', DXF),
            edge('e-cpq-pdf-rep', 'cpq-sf', 'validation_report', 'cpq-export-pdf', 'validation_report', PDF),
            edge('e-cpq-pdf-pl', 'cpq-gear', 'report_payload', 'cpq-export-pdf', 'report_payload', PDF),
            edge('e-cpq-pdf-dxf', 'cpq-gear', 'geometry', 'cpq-export-pdf', 'dxf_file', PDF),
        ],
    },

    // ---------------------------------------------------------------------------
    // 11. Cryogenic Stainless Storage Pressure Vessel (ASME BPVC VIII-1 / EN 13445)
    // ---------------------------------------------------------------------------
    {
        id: 'template-cryogenic-pressure-cylinder',
        title: 'Cryogenic Stainless Storage Pressure Vessel',
        titleTr: 'Kriyojenik Paslanmaz Depolama Basınçlı Kabı',
        category: 'pressure_vessels',
        standard: 'ASME BPVC VIII-1 (UG-27) / EN 13445',
        description:
            'Cryogenic stainless steel cylindrical pressure vessel (Di=750 mm, P=3.2 MPa): ASME Section VIII Division 1 hoop stress sizing, corrosion allowance, and comparison against EN 13445.',
        descriptionTr:
            'Kriyojenik paslanmaz çelik silindirik basınçlı kap (İç çap 750 mm, 32 bar basınç): ASME Section VIII Div 1 çevre gerilmesi et kalınlığı hesabı ve EN 13445 kıyaslaması.',
        tags: ['ASME VIII-1', 'EN 13445', 'UG-27', 'Pressure Vessel', 'Stainless 316L'],
        featured: false,
        nodes: [
            node('cpc-p', 40, 100, 'input-constant-pressure', { value: 3.2 }),
            node('cpc-vessel', 420, 100, 'mech-pressure-vessel-code', {
                R: 375,
                S: 115,
                E: 1.0,
                CA: 0.5,
            }),
            node('cpc-export-dxf', 920, 60, 'export-dxf'),
            node('cpc-export-pdf', 920, 260, 'export-pdf-report', {
                title: 'Cryogenic Stainless Vessel Report',
                standard: 'ASME BPVC VIII-1 / EN 13445',
                engine_version: '1.0.0',
            }),
        ],
        edges: [
            edge('e-cpc-p', 'cpc-p', 'value', 'cpc-vessel', 'P', FORCE),
            edge('e-cpc-dxf-geom', 'cpc-vessel', 'geometry', 'cpc-export-dxf', 'geometry', DXF),
            edge('e-cpc-dxf-rep', 'cpc-vessel', 'validation_report', 'cpc-export-dxf', 'validation_report', DXF),
            edge('e-cpc-pdf-rep', 'cpc-vessel', 'validation_report', 'cpc-export-pdf', 'validation_report', PDF),
            edge('e-cpc-pdf-pl', 'cpc-vessel', 'report_payload', 'cpc-export-pdf', 'report_payload', PDF),
            edge('e-cpc-pdf-dxf', 'cpc-vessel', 'geometry', 'cpc-export-pdf', 'dxf_file', PDF),
        ],
    },

    // ---------------------------------------------------------------------------
    // 12. High-Inertia Flywheel & Shaft Torsion Drive (ISO 80000-4 / DIN 743)
    // ---------------------------------------------------------------------------
    {
        id: 'template-flywheel-shaft-torsion',
        title: 'High-Inertia Flywheel & Shaft Torsion Drive',
        titleTr: 'Yüksek Eylemsizlik Volan & Mil Burulma Tahriki',
        category: 'physics_dynamics',
        standard: 'ISO 80000-4 / DIN 743 / ASME B106.1M',
        description:
            'Energy storage flywheel rotational dynamics: 1.8 kg·m² inertia rotor at 2400 rpm, instantaneous kinetic energy, shaft torque, Saint-Venant torsional shear stress, and DIN 743 safety factor.',
        descriptionTr:
            'Enerji depolama volanı dönme dinamiği: 2400 d/d hızda 1.8 kg·m² eylemsizlik diski, kinetik enerji, mil torku, Saint-Venant kayma gerilmesi ve DIN 743 emniyet katsayısı.',
        tags: ['ISO 80000-4', 'DIN 743', 'Flywheel', 'Rotational Dynamics', 'Shaft Torsion'],
        featured: false,
        nodes: [
            node('fst-t', 40, 60, 'input-constant-torque', { value: 160 }),
            node('fst-rot', 420, 60, 'phys-rotational-dynamics', {
                inertia_kgm2: 1.8,
                rpm_init: 2400,
                duration: 2.5,
            }),
            node('fst-d', 40, 220, 'input-constant-diameter', { value: 38 }),
            node('fst-l', 40, 360, 'input-constant-length', { value: 550 }),
            node('fst-mat', 40, 500, 'mech-material', { materialName: 'AISI 4140' }),
            node('fst-torsion', 420, 260, 'mech-torsion', {
                G: 79,
            }),
            node('fst-sf', 840, 180, 'val-safety-factor'),
            node('fst-export-dxf', 1240, 60, 'export-dxf'),
            node('fst-export-pdf', 1240, 260, 'export-pdf-report', {
                title: 'Flywheel & Shaft Torsion Report',
                standard: 'ISO 80000-4 / DIN 743',
                engine_version: '1.1.0',
            }),
        ],
        edges: [
            edge('e-fst-rot-t', 'fst-t', 'value', 'fst-rot', 'torque', FORCE),
            edge('e-fst-tor-t', 'fst-t', 'value', 'fst-torsion', 'T', FORCE),
            edge('e-fst-d', 'fst-d', 'value', 'fst-torsion', 'd', FORCE),
            edge('e-fst-l', 'fst-l', 'value', 'fst-torsion', 'L', FORCE),
            edge('e-fst-stress', 'fst-torsion', 'stress', 'fst-sf', 'stress_mpa', STRESS),
            edge('e-fst-sy', 'fst-mat', 'Sy', 'fst-sf', 'yield_strength_mpa', YIELD),
            edge('e-fst-dxf-geom', 'fst-torsion', 'geometry', 'fst-export-dxf', 'geometry', DXF),
            edge('e-fst-dxf-rep', 'fst-sf', 'validation_report', 'fst-export-dxf', 'validation_report', DXF),
            edge('e-fst-pdf-rep', 'fst-sf', 'validation_report', 'fst-export-pdf', 'validation_report', PDF),
            edge('e-fst-pdf-pl', 'fst-torsion', 'report_payload', 'fst-export-pdf', 'report_payload', PDF),
            edge('e-fst-pdf-dxf', 'fst-torsion', 'geometry', 'fst-export-pdf', 'dxf_file', PDF),
        ],
    },
];
