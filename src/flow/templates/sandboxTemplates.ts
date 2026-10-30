/**
 * AluCalculator OS — Turnkey Engineering Sandbox Templates
 *
 * Pre-wired, multi-disciplinary engineering laboratories:
 * 1. Structural Profile & Beam Deflection Lab (EN 10034 / Eurocode 3)
 * 2. Metallurgy & Quench-Temper Lab (ISO 4957 / Hollomon-Jaffe)
 * 3. Harmonic Vibration & Resonance SDOF Lab (ISO 10816)
 * 4. Thermodynamics & Real Gas Lab (Van der Waals / IUPAC)
 * 5. Kinematics, Dynamics & Friction Lab (Newton / Coulomb)
 *
 * Layer: flow (Pure TypeScript, zero DOM/React dependencies).
 */

import type { FlowTemplate } from './types';

export const SANDBOX_TEMPLATES: FlowTemplate[] = [
    // ---------------------------------------------------------------------------
    // 1. Structural Profile & Beam Deflection Lab
    // ---------------------------------------------------------------------------
    {
        id: 'sandbox-structural-beam',
        title: 'Structural Profile & Beam Deflection Lab',
        titleTr: 'Yapısal Profil & Kiriş Sehim Laboratuvarı',
        category: 'structural',
        standard: 'EN 10034 / DIN 1025 / Eurocode 3',
        description: 'Calculates I-Beam section properties (A, Ix, Wx) and bridges directly into beam bending deflection and stress safety factor.',
        descriptionTr: 'I-Kiriş profil kesit özelliklerini (A, Ix, Wx) hesaplar ve kiriş sehimi ile gerilme güvenlik faktörüne aktarır.',
        tags: ['I-Beam', 'Deflection', 'Bending', 'Bridge', 'Eurocode 3'],
        featured: true,
        nodes: [
            {
                id: 'beam-section',
                type: 'engineering',
                position: { x: 50, y: 150 },
                data: {
                    type: 'engineering',
                    schemaId: 'geom-i-beam',
                    title: 'I-Beam (IPE 200)',
                    nodeVersion: '1.0.0',
                    h: 200,
                    b: 100,
                    tw: 5.6,
                    tf: 8.5,
                    r: 12,
                } as any,
            },
            {
                id: 'geom-bridge',
                type: 'engineering',
                position: { x: 380, y: 150 },
                data: {
                    type: 'engineering',
                    schemaId: 'geom-transfer-bridge',
                    title: 'Geometry Transfer Bridge',
                    nodeVersion: '1.0.0',
                } as any,
            },
            {
                id: 'beam-solver',
                type: 'engineering',
                position: { x: 720, y: 150 },
                data: {
                    type: 'engineering',
                    schemaId: 'mech-beam-deflection',
                    title: 'Beam Deflection (3-Point)',
                    nodeVersion: '1.0.0',
                    load: 12000,
                    length: 3000,
                    e_modulus: 210000,
                    support_type: 0, // Simply supported point load
                } as any,
            },
        ],
        edges: [
            {
                id: 'e-profile-bridge',
                source: 'beam-section',
                sourceHandle: 'profile',
                target: 'geom-bridge',
                targetHandle: 'profile',
                animated: true,
                style: { stroke: '#38bdf8', strokeWidth: 2 },
            },
            {
                id: 'e-bridge-inertia',
                source: 'geom-bridge',
                sourceHandle: 'ix',
                target: 'beam-solver',
                targetHandle: 'I',
                animated: true,
                style: { stroke: '#38bdf8', strokeWidth: 2 },
            },
        ],
    },

    // ---------------------------------------------------------------------------
    // 2. Metallurgy & Quench-Temper Transformation Lab
    // ---------------------------------------------------------------------------
    {
        id: 'sandbox-metallurgy-qt',
        title: 'Metallurgy & Heat Treatment Lab',
        titleTr: 'Metalurji & Isıl İşlem Simülasyonu',
        category: 'metallurgy_materials',
        standard: 'ISO 4957 / DIN 17014 / Hollomon-Jaffe',
        description: 'Simulates quenching and tempering transformations on AISI 4140 steel, calculating tempered hardness (HRC), yield strength, and microstructure.',
        descriptionTr: 'AISI 4140 çeliği üzerinde su verme ve menevişleme dönüşümünü simüle ederek sertlik, akma mukavemeti ve mikroyapıyı hesaplar.',
        tags: ['Metallurgy', 'Quench & Temper', 'Hollomon-Jaffe', 'AISI 4140', 'Hardness'],
        featured: true,
        nodes: [
            {
                id: 'mat-selector',
                type: 'engineering',
                position: { x: 60, y: 180 },
                data: {
                    type: 'engineering',
                    schemaId: 'mat-universal-selector',
                    title: 'Alloy: AISI 4140',
                    nodeVersion: '1.0.0',
                    material_name: 'AISI 4140 (Cr-Mo)',
                } as any,
            },
            {
                id: 'mat-qt-treatment',
                type: 'engineering',
                position: { x: 420, y: 180 },
                data: {
                    type: 'engineering',
                    schemaId: 'mat-heat-treatment',
                    title: 'Quench & Tempering Engine',
                    nodeVersion: '1.0.0',
                    process_type: 0, // Q&T
                    treatment_temp_c: 480,
                    soak_time_hours: 2,
                } as any,
            },
        ],
        edges: [
            {
                id: 'e-mat-yield',
                source: 'mat-selector',
                sourceHandle: 'yield_strength',
                target: 'mat-qt-treatment',
                targetHandle: 'base_yield',
                animated: true,
                style: { stroke: '#fb923c', strokeWidth: 2 },
            },
            {
                id: 'e-mat-tensile',
                source: 'mat-selector',
                sourceHandle: 'tensile_strength',
                target: 'mat-qt-treatment',
                targetHandle: 'base_tensile',
                animated: true,
                style: { stroke: '#fb923c', strokeWidth: 2 },
            },
        ],
    },

    // ---------------------------------------------------------------------------
    // 3. SDOF Harmonic Vibration & Resonance Lab
    // ---------------------------------------------------------------------------
    {
        id: 'sandbox-vibration-sdof',
        title: 'Vibration & Resonance SDOF Lab',
        titleTr: 'Titreşim & Rezonans Laboratuvarı (SDOF)',
        category: 'physics_dynamics',
        standard: 'ISO 10816 / ISO 20816-1',
        description: 'Single Degree of Freedom oscillator exploring natural frequency fn, damping ratio ζ, and resonance amplification factor Q.',
        descriptionTr: 'Tek serbestlik dereceli osilatör: Doğal frekans fn, sönüm oranı ζ ve rezonans büyütme faktörü Q hesaplaması.',
        tags: ['Vibration', 'ISO 10816', 'Resonance', 'SDOF', 'Damping'],
        featured: true,
        nodes: [
            {
                id: 'vib-sdof',
                type: 'engineering',
                position: { x: 120, y: 160 },
                data: {
                    type: 'engineering',
                    schemaId: 'phys-vibration-sdof',
                    title: 'Harmonic Oscillator (m=35kg)',
                    nodeVersion: '1.0.0',
                    mass: 35,
                    stiffness: 85000,
                    damping_c: 120,
                    freq_driving: 7.84,
                } as any,
            },
        ],
        edges: [],
    },

    // ---------------------------------------------------------------------------
    // 4. Thermodynamics & Real Gas Lab
    // ---------------------------------------------------------------------------
    {
        id: 'sandbox-thermo-gas',
        title: 'Thermodynamics & Real Gas Lab',
        titleTr: 'Termodinamik & Gerçek Gaz Laboratuvarı',
        category: 'chemistry_thermo',
        standard: 'ISO 80000-5 / IUPAC Green Book',
        description: 'Computes real gas compressibility Z via Van der Waals and evaluates Gibbs free energy spontaneity ΔG = ΔH - TΔS.',
        descriptionTr: 'Van der Waals ile gerçek gaz sıkıştırılabilirlik faktörü Z ve Gibbs serbest enerji kendiliğindenliğini (ΔG) hesaplar.',
        tags: ['Van der Waals', 'Gibbs Energy', 'Gas Laws', 'IUPAC'],
        featured: false,
        nodes: [
            {
                id: 'chem-vdw',
                type: 'engineering',
                position: { x: 80, y: 150 },
                data: {
                    type: 'engineering',
                    schemaId: 'chem-gas-laws',
                    title: 'Real Gas (VDW N2)',
                    nodeVersion: '2.0.0',
                    T: 320,
                    V: 15,
                    n: 2.5,
                    a_vdw: 1.370,
                    b_vdw: 0.0387,
                } as any,
            },
            {
                id: 'chem-gibbs',
                type: 'engineering',
                position: { x: 450, y: 150 },
                data: {
                    type: 'engineering',
                    schemaId: 'chem-thermo',
                    title: 'Gibbs Reaction Spontaneity',
                    nodeVersion: '2.0.0',
                    dH: -92.22,
                    dS: -198.75,
                    T_c: 450,
                } as any,
            },
        ],
        edges: [],
    },

    // ---------------------------------------------------------------------------
    // 5. Kinematics, Dynamics & Incline Friction Lab
    // ---------------------------------------------------------------------------
    {
        id: 'sandbox-physics-dynamics',
        title: 'Kinematics & Incline Friction Lab',
        titleTr: 'Kinematik & Eğik Düzlem Sürtünme Laboratuvarı',
        category: 'physics_dynamics',
        standard: 'ISO 80000-3 / ISO 80000-4',
        description: 'Calculates acceleration, normal force, Coulomb friction, breakaway threshold, and ballistic trajectory apex.',
        descriptionTr: 'İvme, normal kuvvet, Coulomb sürtünmesi, kopma eşiği ve balistik yörünge tepe noktasını hesaplar.',
        tags: ['Kinematics', 'Dynamics', 'Coulomb Friction', 'Newton'],
        featured: false,
        nodes: [
            {
                id: 'phys-dyn',
                type: 'engineering',
                position: { x: 80, y: 150 },
                data: {
                    type: 'engineering',
                    schemaId: 'phys-dynamics-friction',
                    title: 'Incline Slider (m=75kg, θ=20°)',
                    nodeVersion: '1.0.0',
                    mass: 75,
                    force_applied: 450,
                    angle_deg: 20,
                    mu_s: 0.40,
                    mu_k: 0.28,
                } as any,
            },
            {
                id: 'phys-kin',
                type: 'engineering',
                position: { x: 460, y: 150 },
                data: {
                    type: 'engineering',
                    schemaId: 'phys-kinematics',
                    title: 'Projectile Trajectory (45°)',
                    nodeVersion: '1.0.0',
                    v0: 25,
                    angle_deg: 45,
                    time: 2.5,
                } as any,
            },
        ],
        edges: [],
    },
];

export function getSandboxTemplateById(id: string): FlowTemplate | undefined {
    return SANDBOX_TEMPLATES.find((t) => t.id === id);
}
