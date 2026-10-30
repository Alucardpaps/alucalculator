/**
 * AluCalculator OS — Advanced Engineering Templates
 *
 * 12 Multi-Disciplinary Deterministic Calculation Pipelines:
 * 1. Heavy Welded Crane Bracket Frame (EN 1993-1-8 / AWS D1.1)
 * 2. Dual-Stage Helical Reduction Drivetrain (ISO 6336 / DIN 3960 / ISO 281)
 * 3. Heavy Hydraulic Press Ram & Column Circuit (ISO 6020 / DIN 4114)
 * 4. Autoclave Chemical Reactor & ASME Vessel (ASME BPVC VIII-1 / IUPAC)
 * 5. Aerospace Alloy Aging & Shaft Torsion Lab (AMS 4027 / DIN 743)
 * 6. AC Motor Power & Belt Transmission Drive (IEC 60038 / ISO 5296)
 * 7. Thermal Conduction & Pressure Vessel Exchanger (ISO 13789 / ASME VIII)
 * 8. 2D Projectile Trajectory & Guide Rail Deflection (ISO 80000-3 / Eurocode 3)
 * 9. Hollow Structural Section (RHS) Column Buckling (EN 10219 / EN 1993-1-1)
 * 10. Multi-Axis Shaft Fatigue & 3D Mohr Stress State (DIN 743 / ASME B106.1M)
 * 11. Chemical Stoichiometry & Pressure Pipeline (IUPAC / ASME VIII)
 * 12. Harmonic Vibration & Spring Isolation Mount (ISO 10816 / DIN EN 13906-1)
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

export const ADVANCED_ENGINEERING_TEMPLATES: FlowTemplate[] = [
    // ---------------------------------------------------------------------------
    // 1. Heavy Welded Crane Bracket Frame (EN 1993-1-8 / AWS D1.1)
    // ---------------------------------------------------------------------------
    {
        id: 'template-welded-bracket-frame',
        title: 'Heavy Welded Crane Bracket Frame',
        titleTr: 'Ağır Kaynaklı Vinç Konsolu & Kaynak Doğrulaması',
        category: 'structural',
        standard: 'EN 1993-1-8 / AWS D1.1',
        description:
            'Cantilever crane bracket with I-Beam profile section bridge, EN 1993-1-8 double fillet weld joint sizing, von Mises throat stress, and PDF report.',
        descriptionTr:
            'I-Kiriş kesit köprüsü, EN 1993-1-8 çift köşe kaynak dayanımı, von Mises kaynak boğaz gerilmesi ve teknik PDF raporu içeren konsol vinç mesnet sistemi.',
        tags: ['EN 1993-1-8', 'AWS D1.1', 'I-Beam', 'Weld', 'Crane Bracket'],
        featured: true,
        nodes: [
            node('wbf-force', 40, 60, 'input-constant-force', { value: 45000 }),
            node('wbf-beam', 40, 200, 'geom-i-beam', { h: 240, b: 120, tw: 6.2, tf: 9.8, r: 15 }),
            node('wbf-bridge', 420, 200, 'geom-transfer-bridge'),
            node('wbf-mat', 40, 360, 'mech-material', { materialName: 'S355J2 (St52)' }),
            node('wbf-weld', 420, 60, 'mech-weld-joint', {
                L: 180,
                z: 8,
                fu: 510,
                fy: 355,
                joint: 'fillet-double',
                load_dir: 'transverse',
            }),
            node('wbf-sf', 840, 60, 'val-safety-factor'),
            node('wbf-export-dxf', 1220, 60, 'export-dxf'),
            node('wbf-export-pdf', 1220, 260, 'export-pdf-report', {
                title: 'Heavy Welded Crane Bracket Report',
                standard: 'EN 1993-1-8 / AWS D1.1',
                engine_version: '1.0.0',
            }),
        ],
        edges: [
            edge('e-wbf-beam', 'wbf-beam', 'profile', 'wbf-bridge', 'profile', FORCE),
            edge('e-wbf-f', 'wbf-force', 'value', 'wbf-weld', 'F', FORCE),
            edge('e-wbf-fy', 'wbf-mat', 'Sy', 'wbf-weld', 'fy', YIELD),
            edge('e-wbf-fu', 'wbf-mat', 'Su', 'wbf-weld', 'fu', STRESS),
            edge('e-wbf-tau', 'wbf-weld', 'sigma_w', 'wbf-sf', 'stress_mpa', STRESS),
            edge('e-wbf-sy', 'wbf-mat', 'Sy', 'wbf-sf', 'yield_strength_mpa', YIELD),
            edge('e-wbf-dxf-g', 'wbf-weld', 'geometry', 'wbf-export-dxf', 'geometry', DXF),
            edge('e-wbf-dxf-r', 'wbf-sf', 'validation_report', 'wbf-export-dxf', 'validation_report', DXF),
            edge('e-wbf-pdf-r', 'wbf-sf', 'validation_report', 'wbf-export-pdf', 'validation_report', PDF),
            edge('e-wbf-pdf-p', 'wbf-weld', 'report_payload', 'wbf-export-pdf', 'report_payload', PDF),
            edge('e-wbf-pdf-d', 'wbf-weld', 'geometry', 'wbf-export-pdf', 'dxf_file', PDF),
        ],
    },

    // ---------------------------------------------------------------------------
    // 2. Dual-Stage Helical Reduction Drivetrain (ISO 6336 / DIN 3960 / ISO 281)
    // ---------------------------------------------------------------------------
    {
        id: 'template-dual-stage-helical-drivetrain',
        title: 'Dual-Stage Helical Reduction Drivetrain',
        titleTr: 'Çift Kademeli Helisel Redüktör Aktarma Hattı',
        category: 'gears',
        standard: 'ISO 6336 / DIN 3960 / ISO 281',
        description:
            'High-torque helical gear pair with transverse contact ratio εγ, tooth forces Ft/Fr/Fa, high-capacity tapered roller bearing L10h rating, and DXF involute export.',
        descriptionTr:
            'Yüksek torklu helisel dişli çifti (kavrama oranı εγ, diş kuvvetleri Ft/Fr/Fa), konik makaralı rulman L10h ömrü ve DXF evolvent çıktısı.',
        tags: ['ISO 6336', 'DIN 3960', 'ISO 281', 'Helical Gear', 'Bearing Life'],
        featured: true,
        nodes: [
            node('dhd-power', 40, 60, 'input-constant-power', { value: 15 }),
            node('dhd-rpm', 40, 190, 'input-constant-rpm', { value: 1450 }),
            node('dhd-pt', 400, 100, 'mech-power-torque'),
            node('dhd-mod', 40, 320, 'input-constant-module', { value: 4 }),
            node('dhd-z1', 40, 450, 'input-constant-teeth', { value: 21 }),
            node('dhd-z2', 40, 580, 'input-constant-teeth', { value: 63 }),
            node('dhd-alpha', 40, 710, 'input-constant-angle', { value: 20 }),
            node('dhd-beta', 40, 840, 'input-constant-helix-angle', { value: 18 }),
            node('dhd-gear', 760, 200, 'mech-gear-helical', { face_width_mm: 55 }),
            node('dhd-brg', 1160, 200, 'mech-bearing-life', { C: 88000, C0: 56000, type: 1 }),
            node('dhd-export-dxf', 1540, 120, 'export-dxf'),
            node('dhd-export-pdf', 1540, 320, 'export-pdf-report', {
                title: 'Dual-Stage Helical Drivetrain Report',
                standard: 'ISO 6336 / DIN 3960 / ISO 281',
                engine_version: '1.0.0',
            }),
        ],
        edges: [
            edge('e-dhd-p', 'dhd-power', 'value', 'dhd-pt', 'power_kw'),
            edge('e-dhd-n', 'dhd-rpm', 'value', 'dhd-pt', 'rpm'),
            edge('e-dhd-t', 'dhd-pt', 'torque_nm', 'dhd-gear', 'torque_nm'),
            edge('e-dhd-nrpm', 'dhd-rpm', 'value', 'dhd-gear', 'rpm'),
            edge('e-dhd-m', 'dhd-mod', 'value', 'dhd-gear', 'module_mm'),
            edge('e-dhd-z1', 'dhd-z1', 'value', 'dhd-gear', 'pinion_teeth'),
            edge('e-dhd-z2', 'dhd-z2', 'value', 'dhd-gear', 'gear_teeth'),
            edge('e-dhd-a', 'dhd-alpha', 'value', 'dhd-gear', 'pressure_angle_deg'),
            edge('e-dhd-b', 'dhd-beta', 'value', 'dhd-gear', 'helix_angle_deg'),
            edge('e-dhd-fr', 'dhd-gear', 'Fr', 'dhd-brg', 'Fr', FORCE),
            edge('e-dhd-fa', 'dhd-gear', 'Fa', 'dhd-brg', 'Fa', FORCE),
            edge('e-dhd-nout', 'dhd-gear', 'output_rpm', 'dhd-brg', 'rpm', FORCE),
            edge('e-dhd-dxf-g', 'dhd-gear', 'geometry', 'dhd-export-dxf', 'geometry', DXF),
            edge('e-dhd-dxf-r', 'dhd-gear', 'validation_report', 'dhd-export-dxf', 'validation_report', DXF),
            edge('e-dhd-pdf-r', 'dhd-gear', 'validation_report', 'dhd-export-pdf', 'validation_report', PDF),
            edge('e-dhd-pdf-p', 'dhd-gear', 'report_payload', 'dhd-export-pdf', 'report_payload', PDF),
            edge('e-dhd-pdf-d', 'dhd-gear', 'geometry', 'dhd-export-pdf', 'dxf_file', PDF),
        ],
    },

    // ---------------------------------------------------------------------------
    // 3. Heavy Hydraulic Press Ram & Column Circuit (ISO 6020 / DIN 4114)
    // ---------------------------------------------------------------------------
    {
        id: 'template-hydraulic-press-circuit',
        title: 'Heavy Hydraulic Press Ram & Column Circuit',
        titleTr: 'Ağır Hidrolik Pres Pistonu & Kolon Burkulması',
        category: 'manufacturing',
        standard: 'ISO 6020 / ISO 6022 / DIN 4114',
        description:
            '120 kN hydraulic press cylinder sizing (Lamé hoop stress, push/pull forces), combined with piston rod Euler-Tetmajer column buckling stability check and DXF export.',
        descriptionTr:
            '120 kN hidrolik pres silindiri boyutlandırma (Lamé çeper gerilmesi, itme/çekme), piston kolu Euler-Tetmajer burkulma kararlılığı ve DXF çıktısı.',
        tags: ['ISO 6020', 'ISO 6022', 'DIN 4114', 'Hydraulic Press', 'Buckling'],
        featured: true,
        nodes: [
            node('hpc-F', 40, 60, 'input-constant-force', { value: 120000 }),
            node('hpc-P', 40, 190, 'input-constant-pressure', { value: 25 }),
            node('hpc-stroke', 40, 320, 'input-constant-length', { value: 750 }),
            node('hpc-K', 40, 450, 'input-constant-ratio', { value: 1 }),
            node('hpc-mat', 40, 580, 'mech-material', { materialName: 'Steel AISI 1020' }),
            node('hpc-cyl', 420, 200, 'mech-hydraulic-cylinder', { piston_speed_mm_s: 80 }),
            node('hpc-buckle', 820, 100, 'mech-column-buckling', {
                buckling_curve: 'b',
                L: 750,
                I: 49087,
                A: 706,
                E: 210,
                fy: 350,
                K: 1,
                P: 120000,
            }),
            node('hpc-sf', 820, 360, 'val-safety-factor'),
            node('hpc-export-dxf', 1200, 100, 'export-dxf'),
            node('hpc-export-pdf', 1200, 300, 'export-pdf-report', {
                title: 'Hydraulic Press Ram & Column Report',
                standard: 'ISO 6020 / DIN 4114',
                engine_version: '1.0.0',
            }),
        ],
        edges: [
            edge('e-hpc-F', 'hpc-F', 'value', 'hpc-cyl', 'F'),
            edge('e-hpc-P', 'hpc-P', 'value', 'hpc-cyl', 'P'),
            edge('e-hpc-stroke', 'hpc-stroke', 'value', 'hpc-cyl', 'stroke'),
            edge('e-hpc-K', 'hpc-K', 'value', 'hpc-cyl', 'K'),
            edge('e-hpc-mat-e', 'hpc-mat', 'E', 'hpc-cyl', 'E'),
            edge('e-hpc-mat-fy', 'hpc-mat', 'Sy', 'hpc-cyl', 'fy', YIELD),
            edge('e-hpc-b-len', 'hpc-stroke', 'value', 'hpc-buckle', 'L'),
            edge('e-hpc-b-f', 'hpc-F', 'value', 'hpc-buckle', 'P'),
            edge('e-hpc-b-k', 'hpc-K', 'value', 'hpc-buckle', 'K'),
            edge('e-hpc-b-e', 'hpc-mat', 'E', 'hpc-buckle', 'E'),
            edge('e-hpc-b-fy', 'hpc-mat', 'Sy', 'hpc-buckle', 'fy', YIELD),
            edge('e-hpc-hoop', 'hpc-cyl', 'hoop_stress', 'hpc-sf', 'stress_mpa', STRESS),
            edge('e-hpc-sy', 'hpc-mat', 'Sy', 'hpc-sf', 'yield_strength_mpa', YIELD),
            edge('e-hpc-dxf-g', 'hpc-cyl', 'geometry', 'hpc-export-dxf', 'geometry', DXF),
            edge('e-hpc-dxf-r', 'hpc-sf', 'validation_report', 'hpc-export-dxf', 'validation_report', DXF),
            edge('e-hpc-pdf-r', 'hpc-sf', 'validation_report', 'hpc-export-pdf', 'validation_report', PDF),
            edge('e-hpc-pdf-p', 'hpc-cyl', 'report_payload', 'hpc-export-pdf', 'report_payload', PDF),
            edge('e-hpc-pdf-d', 'hpc-cyl', 'geometry', 'hpc-export-pdf', 'dxf_file', PDF),
        ],
    },

    // ---------------------------------------------------------------------------
    // 4. Autoclave Chemical Reactor & ASME Vessel (ASME BPVC VIII-1 / IUPAC)
    // ---------------------------------------------------------------------------
    {
        id: 'template-autoclave-reactor-thermo',
        title: 'Autoclave Chemical Reactor & ASME Vessel',
        titleTr: 'Kimyasal Otoklav Reaktörü & ASME Basınçlı Kap',
        category: 'chemistry_thermo',
        standard: 'ASME BPVC VIII-1 / ISO 80000-5 / IUPAC',
        description:
            'High-pressure Van der Waals real gas equation of state and Gibbs ΔG spontaneity connected to ASME Section VIII Div 1 cylindrical vessel shell and torispherical head sizing with DXF CAD output.',
        descriptionTr:
            'Van der Waals gerçek gaz hal denklemi ve Gibbs serbest enerjisi ΔG hesabından ASME Bölüm VIII Kısım 1 silindirik gövde ve bombe et kalınlığına bağlı CAD DXF hattı.',
        tags: ['ASME BPVC', 'Van der Waals', 'Gibbs Free Energy', 'Autoclave', 'Pressure Vessel'],
        featured: true,
        nodes: [
            node('aut-gas', 40, 100, 'chem-gas-laws', { T: 380, V: 50, n: 3.5, a_vdw: 1.37, b_vdw: 0.0387 }),
            node('aut-thermo', 40, 300, 'chem-thermo', { dH: -92.2, dS: -198.7, T_c: 105 }),
            node('aut-radius', 40, 480, 'input-constant-length', { value: 350 }),
            node('aut-e', 40, 610, 'input-constant-ratio', { value: 0.85 }),
            node('aut-mat', 40, 740, 'mech-material', { materialName: 'SS 304 (Std)' }),
            node('aut-vessel', 440, 200, 'mech-pressure-vessel-code', { S: 138, CA: 2.0 }),
            node('aut-sf', 840, 100, 'val-safety-factor'),
            node('aut-export-dxf', 1200, 100, 'export-dxf'),
            node('aut-export-pdf', 1200, 300, 'export-pdf-report', {
                title: 'Autoclave Reactor ASME VIII Report',
                standard: 'ASME BPVC VIII-1 / IUPAC',
                engine_version: '1.0.0',
            }),
        ],
        edges: [
            edge('e-aut-p', 'aut-gas', 'P_mpa', 'aut-vessel', 'P', FORCE),
            edge('e-aut-r', 'aut-radius', 'value', 'aut-vessel', 'R', FORCE),
            edge('e-aut-e', 'aut-e', 'value', 'aut-vessel', 'E', FORCE),
            edge('e-aut-s-circ', 'aut-vessel', 'hoop_stress_mpa', 'aut-sf', 'stress_mpa', STRESS),
            edge('e-aut-sy', 'aut-mat', 'Sy', 'aut-sf', 'yield_strength_mpa', YIELD),
            edge('e-aut-dxf-g', 'aut-vessel', 'geometry', 'aut-export-dxf', 'geometry', DXF),
            edge('e-aut-dxf-r', 'aut-sf', 'validation_report', 'aut-export-dxf', 'validation_report', DXF),
            edge('e-aut-pdf-r', 'aut-sf', 'validation_report', 'aut-export-pdf', 'validation_report', PDF),
            edge('e-aut-pdf-p', 'aut-vessel', 'report_payload', 'aut-export-pdf', 'report_payload', PDF),
            edge('e-aut-pdf-d', 'aut-vessel', 'geometry', 'aut-export-pdf', 'dxf_file', PDF),
        ],
    },

    // ---------------------------------------------------------------------------
    // 5. Aerospace Alloy Aging & Shaft Torsion Lab (AMS 4027 / MIL-H-6088 / DIN 743)
    // ---------------------------------------------------------------------------
    {
        id: 'template-aerospace-aluminum-aging',
        title: 'Aerospace Alloy Aging & Shaft Torsion Lab',
        titleTr: 'Havacılık Alüminyumu Yaşlandırma & Mil Burulması',
        category: 'metallurgy_materials',
        standard: 'AMS 4027 / MIL-H-6088 / DIN 743',
        description:
            'Artificial aging transformation kinetics of certified aerospace alloys (Al 7075-T6) mapped directly into dynamic torque transmission and driveshaft torsional shear stress DXF validation.',
        descriptionTr:
            'Havacılık alaşımının (Al 7075-T6) yapay yaşlandırma dönüşümüyle elde edilen mukavemetinin dinamik tork mili burulma gerilmesine ve CAD DXF çizimine aktarımı.',
        tags: ['AMS 4027', 'MIL-H-6088', 'Al 7075', 'Aging', 'Torsion'],
        featured: true,
        nodes: [
            node('aero-mat', 40, 60, 'mat-universal-selector', { material_name: 'Aluminum 7075-T6' }),
            node('aero-treat', 440, 60, 'mat-heat-treatment', {
                treatment_temp_c: 120,
                soak_time_hours: 24,
                process_type: 4,
                base_yield: 480,
                base_tensile: 570,
            }),
            node('aero-torque', 40, 260, 'input-constant-torque', { value: 650 }),
            node('aero-len', 40, 390, 'input-constant-length', { value: 600 }),
            node('aero-dia', 40, 520, 'input-constant-diameter', { value: 38 }),
            node('aero-shaft', 440, 300, 'mech-torsion', { d: 38, L: 600 }),
            node('aero-sf', 840, 150, 'val-safety-factor'),
            node('aero-export-dxf', 1200, 100, 'export-dxf'),
            node('aero-export-pdf', 1200, 300, 'export-pdf-report', {
                title: 'Aerospace Alloy Aging & Torsion Report',
                standard: 'AMS 4027 / DIN 743',
                engine_version: '1.0.0',
            }),
        ],
        edges: [
            edge('e-aero-sy', 'aero-mat', 'yield_strength', 'aero-treat', 'base_yield', YIELD),
            edge('e-aero-su', 'aero-mat', 'tensile_strength', 'aero-treat', 'base_tensile', STRESS),
            edge('e-aero-hrc', 'aero-mat', 'hardness_hrc', 'aero-treat', 'base_hardness_hrc', FORCE),
            edge('e-aero-t', 'aero-torque', 'value', 'aero-shaft', 'torque', FORCE),
            edge('e-aero-l', 'aero-len', 'value', 'aero-shaft', 'L', FORCE),
            edge('e-aero-d', 'aero-dia', 'value', 'aero-shaft', 'd', FORCE),
            edge('e-aero-stress', 'aero-shaft', 'stress', 'aero-sf', 'stress_mpa', STRESS),
            edge('e-aero-fy', 'aero-treat', 'final_yield', 'aero-sf', 'yield_strength_mpa', YIELD),
            edge('e-aero-dxf-g', 'aero-shaft', 'geometry', 'aero-export-dxf', 'geometry', DXF),
            edge('e-aero-dxf-r', 'aero-sf', 'validation_report', 'aero-export-dxf', 'validation_report', DXF),
            edge('e-aero-pdf-r', 'aero-sf', 'validation_report', 'aero-export-pdf', 'validation_report', PDF),
            edge('e-aero-pdf-p', 'aero-shaft', 'report_payload', 'aero-export-pdf', 'report_payload', PDF),
            edge('e-aero-pdf-d', 'aero-shaft', 'geometry', 'aero-export-pdf', 'dxf_file', PDF),
        ],
    },

    // ---------------------------------------------------------------------------
    // 6. AC Motor Power & Belt Transmission Drive (IEC 60038 / ISO 5296 / DIN 2215)
    // ---------------------------------------------------------------------------
    {
        id: 'template-ac-motor-drivetrain',
        title: 'AC Motor Power & Belt Transmission Drive',
        titleTr: 'AC Motor Gücü & Kayış Kasnak Aktarımı',
        category: 'powertrain',
        standard: 'IEC 60038 / ISO 5296 / DIN 2215',
        description:
            'AC electrical motor RLC impedance, real power P, and power factor cos(φ) routed to torque and industrial V-belt drive transmission ratio and wrap angle DXF generation.',
        descriptionTr:
            'AC elektrik motoru RLC empedansı, aktif güç P ve güç faktöründen mekanik torka, V-kayış aktarım oranına ve kasnak DXF çizimine bağlanan entegre hat.',
        tags: ['IEC 60038', 'ISO 5296', 'DIN 2215', 'Belt Drive', 'AC Motor'],
        featured: false,
        nodes: [
            node('acm-elec', 40, 100, 'phys-electrical-rlc', {
                voltage: 400,
                freq_hz: 50,
                resistance: 15,
                inductance_mh: 65,
                capacitance_uf: 80,
            }),
            node('acm-rpm', 40, 300, 'input-constant-rpm', { value: 1450 }),
            node('acm-d1', 40, 430, 'input-constant-diameter', { value: 160 }),
            node('acm-d2', 40, 560, 'input-constant-diameter', { value: 315 }),
            node('acm-c', 40, 690, 'input-constant-length', { value: 650 }),
            node('acm-pt', 440, 160, 'mech-power-torque'),
            node('acm-belt', 820, 220, 'mech-belt-drive', { section: 'SPB', P: 5.5, rpm: 1450 }),
            node('acm-export-dxf', 1220, 120, 'export-dxf'),
            node('acm-export-pdf', 1220, 320, 'export-pdf-report', {
                title: 'AC Motor & Belt Drive Report',
                standard: 'IEC 60038 / ISO 5296',
                engine_version: '1.0.0',
            }),
        ],
        edges: [
            edge('e-acm-p', 'acm-elec', 'real_power_w', 'acm-pt', 'power_kw'),
            edge('e-acm-n', 'acm-rpm', 'value', 'acm-pt', 'rpm'),
            edge('e-acm-bp', 'acm-elec', 'real_power_w', 'acm-belt', 'power_kw'),
            edge('e-acm-bn', 'acm-rpm', 'value', 'acm-belt', 'rpm'),
            edge('e-acm-bd1', 'acm-d1', 'value', 'acm-belt', 'd1'),
            edge('e-acm-bd2', 'acm-d2', 'value', 'acm-belt', 'd2'),
            edge('e-acm-bc', 'acm-c', 'value', 'acm-belt', 'C'),
            edge('e-acm-dxf-g', 'acm-belt', 'geometry', 'acm-export-dxf', 'geometry', DXF),
            edge('e-acm-dxf-r', 'acm-belt', 'validation_report', 'acm-export-dxf', 'validation_report', DXF),
            edge('e-acm-pdf-r', 'acm-belt', 'validation_report', 'acm-export-pdf', 'validation_report', PDF),
            edge('e-acm-pdf-p', 'acm-belt', 'report_payload', 'acm-export-pdf', 'report_payload', PDF),
            edge('e-acm-pdf-d', 'acm-belt', 'geometry', 'acm-export-pdf', 'dxf_file', PDF),
        ],
    },

    // ---------------------------------------------------------------------------
    // 7. Thermal Conduction & Pressure Vessel Exchanger (ISO 13789 / ASME VIII)
    // ---------------------------------------------------------------------------
    {
        id: 'template-heat-exchanger-conduction',
        title: 'Thermal Conduction & Pressure Vessel Exchanger',
        titleTr: 'Isıl İletim & Basınçlı Kap Isı Değiştirici',
        category: 'chemistry_thermo',
        standard: 'ISO 13789 / EN ISO 6946 / ASME BPVC VIII-1',
        description:
            'Fourier 1D thermal wall conduction with external Newton convection, coupled with ASME Section VIII pressure containment shell thickness sizing and DXF CAD drawing.',
        descriptionTr:
            'Fourier 1D cidardan ısı iletimi ve dış Newton taşınımı ile ASME Bölüm VIII basınç tutma gövdesi et kalınlığı ve CAD DXF çizimi.',
        tags: ['ISO 13789', 'ASME BPVC', 'Fourier Law', 'Heat Exchanger', 'Conduction'],
        featured: false,
        nodes: [
            node('hex-mat', 40, 60, 'mat-universal-selector', { material_name: 'Aluminum 6061-T6' }),
            node('hex-thick', 40, 240, 'input-constant-length', { value: 12 }),
            node('hex-heat', 440, 100, 'phys-heat-transfer', { area: 2.2, temp_hot: 165, temp_cold: 30, h_conv: 85 }),
            node('hex-press', 40, 420, 'input-constant-pressure', { value: 1.8 }),
            node('hex-radius', 40, 550, 'input-constant-length', { value: 350 }),
            node('hex-e', 40, 680, 'input-constant-ratio', { value: 0.85 }),
            node('hex-vessel', 440, 380, 'mech-pressure-vessel-code', { S: 140, CA: 1.5 }),
            node('hex-sf', 840, 380, 'val-safety-factor'),
            node('hex-export-dxf', 1220, 200, 'export-dxf'),
            node('hex-export-pdf', 1220, 400, 'export-pdf-report', {
                title: 'Thermal Exchanger Pressure Vessel Report',
                standard: 'ISO 13789 / ASME VIII',
                engine_version: '1.0.0',
            }),
        ],
        edges: [
            edge('e-hex-k', 'hex-mat', 'thermal_cond', 'hex-heat', 'k_thermal'),
            edge('e-hex-th', 'hex-thick', 'value', 'hex-heat', 'thickness_mm'),
            edge('e-hex-p', 'hex-press', 'value', 'hex-vessel', 'P'),
            edge('e-hex-r', 'hex-radius', 'value', 'hex-vessel', 'R'),
            edge('e-hex-e', 'hex-e', 'value', 'hex-vessel', 'E'),
            edge('e-hex-stress', 'hex-vessel', 'hoop_stress_mpa', 'hex-sf', 'stress_mpa', STRESS),
            edge('e-hex-sy', 'hex-mat', 'yield_strength', 'hex-sf', 'yield_strength_mpa', YIELD),
            edge('e-hex-dxf-g', 'hex-vessel', 'geometry', 'hex-export-dxf', 'geometry', DXF),
            edge('e-hex-dxf-r', 'hex-sf', 'validation_report', 'hex-export-dxf', 'validation_report', DXF),
            edge('e-hex-pdf-r', 'hex-sf', 'validation_report', 'hex-export-pdf', 'validation_report', PDF),
            edge('e-hex-pdf-p', 'hex-vessel', 'report_payload', 'hex-export-pdf', 'report_payload', PDF),
            edge('e-hex-pdf-d', 'hex-vessel', 'geometry', 'hex-export-pdf', 'dxf_file', PDF),
        ],
    },

    // ---------------------------------------------------------------------------
    // 8. 2D Projectile Trajectory & Guide Rail Deflection (ISO 80000-3 / Eurocode 3)
    // ---------------------------------------------------------------------------
    {
        id: 'template-ballistic-projectile-motion',
        title: '2D Projectile Trajectory & Guide Rail Deflection',
        titleTr: '2D Balistik Yörünge & Kılavuz Ray Sehimi',
        category: 'physics_dynamics',
        standard: 'ISO 80000-3 / ISO 80000-4 / Eurocode 3',
        description:
            'Newtonian 2D ballistic kinematics (apex height, flight duration, horizontal range) coupled with incline slider Coulomb friction normal force and launch guide beam bending deflection.',
        descriptionTr:
            'Newton 2D balistik kinematik (tepe yüksekliği, uçuş süresi, menzil), eğimli düzlem sürtünme normal kuvveti ve kılavuz ray kiriş eğilme sehimi hattı.',
        tags: ['ISO 80000-3', 'Kinematics', 'Dynamics', 'Beam Deflection', 'Ballistics'],
        featured: false,
        nodes: [
            node('bpm-dyn', 40, 80, 'phys-dynamics-friction', {
                mass: 85,
                force_applied: 520,
                angle_deg: 30,
                mu_s: 0.38,
                mu_k: 0.26,
            }),
            node('bpm-kin', 440, 80, 'phys-kinematics', { v0: 35, angle_deg: 30, time: 3 }),
            node('bpm-mat', 40, 260, 'mech-material', { materialName: 'S355J2 (St52)' }),
            node('bpm-beam', 440, 320, 'mech-beam-deflection', {
                load: 850,
                length: 2500,
                e_modulus: 210000,
                I: 450000,
                support_type: 0,
            }),
            node('bpm-sf', 840, 200, 'val-safety-factor'),
            node('bpm-export-dxf', 1200, 120, 'export-dxf'),
            node('bpm-export-pdf', 1200, 320, 'export-pdf-report', {
                title: 'Ballistic Trajectory & Rail Report',
                standard: 'ISO 80000-3 / Eurocode 3',
                engine_version: '1.0.0',
            }),
        ],
        edges: [
            edge('e-bpm-accel', 'bpm-dyn', 'accel', 'bpm-kin', 'accel', FORCE),
            edge('e-bpm-fn', 'bpm-dyn', 'normal_force', 'bpm-beam', 'P', FORCE),
            edge('e-bpm-stress', 'bpm-beam', 'stress', 'bpm-sf', 'stress_mpa', STRESS),
            edge('e-bpm-sy', 'bpm-mat', 'Sy', 'bpm-sf', 'yield_strength_mpa', YIELD),
            edge('e-bpm-dxf-g', 'bpm-beam', 'geometry', 'bpm-export-dxf', 'geometry', DXF),
            edge('e-bpm-dxf-r', 'bpm-sf', 'validation_report', 'bpm-export-dxf', 'validation_report', DXF),
            edge('e-bpm-pdf-r', 'bpm-sf', 'validation_report', 'bpm-export-pdf', 'validation_report', PDF),
            edge('e-bpm-pdf-p', 'bpm-beam', 'report_payload', 'bpm-export-pdf', 'report_payload', PDF),
            edge('e-bpm-pdf-d', 'bpm-beam', 'geometry', 'bpm-export-pdf', 'dxf_file', PDF),
        ],
    },

    // ---------------------------------------------------------------------------
    // 9. Hollow Structural Section (RHS) Column Buckling (EN 10219 / EN 1993-1-1)
    // ---------------------------------------------------------------------------
    {
        id: 'template-structural-rhs-truss-column',
        title: 'Hollow Structural Section (RHS) Column Buckling',
        titleTr: 'Kutu Profil (RHS) Kolon Burkulma Analizi',
        category: 'structural',
        standard: 'EN 10219 / EN 1993-1-1',
        description:
            'Rectangular hollow section (RHS) tube profile properties routed via geometry bridge into EN 1993-1-1 / Euler column buckling solver.',
        descriptionTr:
            'Dikdörtgen kutu profil (RHS) kesit özelliklerinin geometri aktarım köprüsüyle EN 1993-1-1 / Euler kolon burkulma çözücüsüne aktarımı.',
        tags: ['EN 10219', 'EN 1993-1-1', 'RHS Tube', 'Column Buckling', 'Euler'],
        featured: false,
        nodes: [
            node('rhs-sec', 40, 80, 'geom-rhs-tube', { b: 150, h: 100, t: 6.3, r: 10 }),
            node('rhs-bridge', 420, 80, 'geom-transfer-bridge'),
            node('rhs-mat', 40, 280, 'mech-material', { materialName: 'S355J2 (St52)' }),
            node('rhs-force', 40, 420, 'input-constant-force', { value: 18000 }),
            node('rhs-len', 40, 550, 'input-constant-length', { value: 2800 }),
            node('rhs-buckle', 820, 120, 'mech-column-buckling', { buckling_curve: 'b', K: 1 }),
            node('rhs-export-dxf', 1220, 100, 'export-dxf'),
            node('rhs-export-pdf', 1220, 300, 'export-pdf-report', {
                title: 'RHS Structural Column Buckling Report',
                standard: 'EN 10219 / EN 1993-1-1',
                engine_version: '1.0.0',
            }),
        ],
        edges: [
            edge('e-rhs-prof', 'rhs-sec', 'profile', 'rhs-bridge', 'profile', FORCE),
            edge('e-rhs-len', 'rhs-len', 'value', 'rhs-buckle', 'L', FORCE),
            edge('e-rhs-f', 'rhs-force', 'value', 'rhs-buckle', 'P', FORCE),
            edge('e-rhs-mat-fy', 'rhs-mat', 'Sy', 'rhs-buckle', 'fy', YIELD),
            edge('e-rhs-mat-e', 'rhs-mat', 'E', 'rhs-buckle', 'E', YIELD),
            edge('e-rhs-dxf-g', 'rhs-buckle', 'geometry', 'rhs-export-dxf', 'geometry', DXF),
            edge('e-rhs-dxf-r', 'rhs-buckle', 'validation_report', 'rhs-export-dxf', 'validation_report', DXF),
            edge('e-rhs-pdf-r', 'rhs-buckle', 'validation_report', 'rhs-export-pdf', 'validation_report', PDF),
            edge('e-rhs-pdf-p', 'rhs-buckle', 'report_payload', 'rhs-export-pdf', 'report_payload', PDF),
            edge('e-rhs-pdf-d', 'rhs-buckle', 'geometry', 'rhs-export-pdf', 'dxf_file', PDF),
        ],
    },

    // ---------------------------------------------------------------------------
    // 10. Multi-Axis Shaft Fatigue & 3D Mohr Stress State (DIN 743 / ASME B106.1M)
    // ---------------------------------------------------------------------------
    {
        id: 'template-shaft-fatigue-combined-stress',
        title: 'Multi-Axis Shaft Fatigue & 3D Mohr Stress State',
        titleTr: 'Çok Eksenli Mil Yorulması & 3D Mohr Gerilme Analizi',
        category: 'powertrain',
        standard: 'DIN 743 / ASME B106.1M / Goodman',
        description:
            'Combined alternating bending and mean torsion stresses evaluated through 3D Mohr circle principal tensor analysis and Goodman fatigue shaft sizing.',
        descriptionTr:
            'Birleşik değişken eğilme ve ortalama burulma gerilmelerinin 3D Mohr çemberi asal tensörleri ve Goodman dinamik mil boyutlandırması ile analizi.',
        tags: ['DIN 743', 'ASME B106.1M', 'Goodman', 'Mohr 3D', 'Fatigue'],
        featured: false,
        nodes: [
            node('sfc-torque', 40, 80, 'input-constant-torque', { value: 380 }),
            node('sfc-dia', 40, 220, 'input-constant-diameter', { value: 45 }),
            node('sfc-len', 40, 360, 'input-constant-length', { value: 450 }),
            node('sfc-mat', 40, 500, 'mech-material', { materialName: 'AISI 1045 (Carbon)' }),
            node('sfc-torsion', 440, 160, 'mech-torsion', { d: 45, L: 450 }),
            node('sfc-shaft-design', 440, 420, 'mech-shaft-design', {
                Ma: 220,
                Mm: 0,
                Ta: 0,
                Tm: 380,
                Sut: 600,
                Sy: 450,
                Se: 220,
                n: 2.0,
                theory: 0,
            }),
            node('sfc-mohr', 840, 100, 'mech-mohr-3d', { sx: 110, sy: 0, sz: 0, txy: 45, tyz: 0, tzx: 0 }),
            node('sfc-sf', 840, 320, 'val-safety-factor'),
            node('sfc-export-dxf', 1220, 160, 'export-dxf'),
            node('sfc-export-pdf', 1220, 380, 'export-pdf-report', {
                title: 'Shaft Fatigue & Combined Stress Report',
                standard: 'DIN 743 / ASME B106.1M',
                engine_version: '1.0.0',
            }),
        ],
        edges: [
            edge('e-sfc-t', 'sfc-torque', 'value', 'sfc-torsion', 'torque', FORCE),
            edge('e-sfc-d', 'sfc-dia', 'value', 'sfc-torsion', 'd', FORCE),
            edge('e-sfc-l', 'sfc-len', 'value', 'sfc-torsion', 'L', FORCE),
            edge('e-sfc-tm', 'sfc-torque', 'value', 'sfc-shaft-design', 'Tm', FORCE),
            edge('e-sfc-stress', 'sfc-torsion', 'stress', 'sfc-sf', 'stress_mpa', STRESS),
            edge('e-sfc-sy', 'sfc-mat', 'Sy', 'sfc-sf', 'yield_strength_mpa', YIELD),
            edge('e-sfc-dxf-g', 'sfc-torsion', 'geometry', 'sfc-export-dxf', 'geometry', DXF),
            edge('e-sfc-dxf-r', 'sfc-sf', 'validation_report', 'sfc-export-dxf', 'validation_report', DXF),
            edge('e-sfc-pdf-r', 'sfc-sf', 'validation_report', 'sfc-export-pdf', 'validation_report', PDF),
            edge('e-sfc-pdf-p', 'sfc-torsion', 'report_payload', 'sfc-export-pdf', 'report_payload', PDF),
            edge('e-sfc-pdf-d', 'sfc-torsion', 'geometry', 'sfc-export-pdf', 'dxf_file', PDF),
        ],
    },

    // ---------------------------------------------------------------------------
    // 11. Chemical Stoichiometry & Pressure Pipeline (IUPAC / ASME VIII)
    // ---------------------------------------------------------------------------
    {
        id: 'template-chemical-stoichiometry-ph',
        title: 'Chemical Stoichiometry & Pressure Pipeline',
        titleTr: 'Kimyasal Stokiyometri & Basınçlı Boru Hattı',
        category: 'chemistry_thermo',
        standard: 'IUPAC Green Book / ASME BPVC VIII-1',
        description:
            'Molecular mass and molar stoichiometry connected to reaction vessel gas pressure generation, ASME cylindrical pipe wall containment, and CAD DXF generation.',
        descriptionTr:
            'Moleküler kütle ve molar stokiyometriden reaksiyon kabı gaz basıncına, ASME silindirik boru et kalınlığı tutumu ve CAD DXF çizimine bağlanan entegre hat.',
        tags: ['IUPAC', 'Stoichiometry', 'ASME BPVC', 'Molarity', 'Pipeline'],
        featured: false,
        nodes: [
            node('csp-elem', 40, 80, 'chem-element', { z: 13 }),
            node('csp-stoich', 40, 240, 'chem-stoichiometry', { formula: 'Al2(SO4)3', mass_g: 250 }),
            node('csp-ph', 40, 420, 'chem-concentration-ph', { moles: 0.75, volume_l: 3.5, target_v2_l: 7.0, is_acid: true }),
            node('csp-gas', 440, 120, 'chem-gas-laws', { T: 360, V: 18, n: 4.5, a_vdw: 1.37, b_vdw: 0.0387 }),
            node('csp-radius', 440, 300, 'input-constant-length', { value: 200 }),
            node('csp-e', 440, 440, 'input-constant-ratio', { value: 0.85 }),
            node('csp-mat', 440, 580, 'mech-material', { materialName: 'SS 316 (Marine)' }),
            node('csp-pipe', 840, 200, 'mech-pressure-vessel-code', { S: 120, CA: 1.5 }),
            node('csp-sf', 840, 440, 'val-safety-factor'),
            node('csp-export-dxf', 1220, 160, 'export-dxf'),
            node('csp-export-pdf', 1220, 360, 'export-pdf-report', {
                title: 'Chemical Stoichiometry & Piping Report',
                standard: 'IUPAC / ASME VIII',
                engine_version: '1.0.0',
            }),
        ],
        edges: [
            edge('e-csp-p', 'csp-gas', 'P_mpa', 'csp-pipe', 'P', FORCE),
            edge('e-csp-r', 'csp-radius', 'value', 'csp-pipe', 'R', FORCE),
            edge('e-csp-e', 'csp-e', 'value', 'csp-pipe', 'E', FORCE),
            edge('e-csp-stress', 'csp-pipe', 'hoop_stress_mpa', 'csp-sf', 'stress_mpa', STRESS),
            edge('e-csp-sy', 'csp-mat', 'Sy', 'csp-sf', 'yield_strength_mpa', YIELD),
            edge('e-csp-dxf-g', 'csp-pipe', 'geometry', 'csp-export-dxf', 'geometry', DXF),
            edge('e-csp-dxf-r', 'csp-sf', 'validation_report', 'csp-export-dxf', 'validation_report', DXF),
            edge('e-csp-pdf-r', 'csp-sf', 'validation_report', 'csp-export-pdf', 'validation_report', PDF),
            edge('e-csp-pdf-p', 'csp-pipe', 'report_payload', 'csp-export-pdf', 'report_payload', PDF),
            edge('e-csp-pdf-d', 'csp-pipe', 'geometry', 'csp-export-pdf', 'dxf_file', PDF),
        ],
    },

    // ---------------------------------------------------------------------------
    // 12. Harmonic Vibration & Spring Isolation Mount (ISO 10816 / DIN EN 13906-1)
    // ---------------------------------------------------------------------------
    {
        id: 'template-harmonic-vibration-spring-isolation',
        title: 'Harmonic Vibration & Spring Isolation Mount',
        titleTr: 'Harmonik Titreşim & Yaylı İzolasyon Takozu',
        category: 'physics_dynamics',
        standard: 'ISO 10816 / DIN EN 13906-1 / DIN 2089',
        description:
            'Machine foundation SDOF vibration frequency response and resonance amplification factor Q coupled with DIN EN 13906-1 helical compression spring design and DXF CAD drawing.',
        descriptionTr:
            'Makine kaidesi tek serbestlik dereceli titreşim tepkisi ve rezonans büyütme faktörü Q\'dan DIN EN 13906-1 helisel basma yayı boyutlandırmasına bağlanan CAD DXF hattı.',
        tags: ['ISO 10816', 'DIN EN 13906-1', 'Vibration', 'Spring Design', 'Resonance'],
        featured: false,
        nodes: [
            node('hvi-sdof', 40, 80, 'phys-vibration-sdof', {
                mass: 350,
                stiffness: 600000,
                damping_c: 850,
                freq_driving: 6.2,
            }),
            node('hvi-force', 40, 300, 'input-constant-force', { value: 1200 }),
            node('hvi-spring', 440, 180, 'mech-spring-design', { d: 8, D: 55, Na: 9, G: 81.5 }),
            node('hvi-export-dxf', 840, 120, 'export-dxf'),
            node('hvi-export-pdf', 840, 320, 'export-pdf-report', {
                title: 'Vibration & Isolation Spring Report',
                standard: 'ISO 10816 / DIN EN 13906-1',
                engine_version: '1.0.0',
            }),
        ],
        edges: [
            edge('e-hvi-f', 'hvi-force', 'value', 'hvi-spring', 'F', FORCE),
            edge('e-hvi-dxf-g', 'hvi-spring', 'geometry', 'hvi-export-dxf', 'geometry', DXF),
            edge('e-hvi-dxf-r', 'hvi-spring', 'validation_report', 'hvi-export-dxf', 'validation_report', DXF),
            edge('e-hvi-pdf-r', 'hvi-spring', 'validation_report', 'hvi-export-pdf', 'validation_report', PDF),
            edge('e-hvi-pdf-p', 'hvi-spring', 'report_payload', 'hvi-export-pdf', 'report_payload', PDF),
            edge('e-hvi-pdf-d', 'hvi-spring', 'geometry', 'hvi-export-pdf', 'dxf_file', PDF),
        ],
    },
];
