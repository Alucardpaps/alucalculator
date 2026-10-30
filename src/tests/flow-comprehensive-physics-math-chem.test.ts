import { describe, it, expect } from 'vitest';
import {
    IBeamProfileNode,
    RHSProfileNode,
    CHSProfileNode,
    LAngleProfileNode,
    CChannelProfileNode,
    SolidSectionNode,
    GeometryBridgeNode,
} from '@/flow/nodes/Geometry/SectionProfileNodes';
import {
    Vector3DNode,
    VectorOperationsNode,
    Matrix3x3Node,
    NumericalCalculusNode,
    PolynomialRootsNode,
    StatisticsRegressionNode,
} from '@/flow/nodes/StandardLibrary/AdvancedMathNodes';
import {
    KinematicsNode,
    DynamicsFrictionNode,
    WorkEnergyPowerNode,
    RotationalDynamicsNode,
    HarmonicVibrationNode,
    HeatTransferNode,
    ElectricalPowerImpedanceNode,
} from '@/flow/nodes/Physics/PhysicsNodes';
import {
    PeriodicElementNode,
    GasLawsNode,
    ThermodynamicsNode,
    StoichiometryNode,
    SolutionConcentrationPHNode,
} from '@/flow/nodes/Chemical/ChemistryNodes';
import {
    UniversalMaterialNode,
    HeatTreatmentNode,
} from '@/flow/nodes/Materials/MaterialAndHeatTreatmentNodes';
import { SANDBOX_TEMPLATES } from '@/flow/templates/sandboxTemplates';
import { FlowEngine } from '@/flow/engine/ExecutionEngine';
import { NODE_REGISTRY } from '@/flow/nodes/Registry';

describe('Geometry & Cross-Section Profile Nodes (EN/DIN/ISO)', () => {
    it('I-Beam: calculates deterministic area, Ix, Wx, and radii of gyration per EN 10034', () => {
        const res = IBeamProfileNode.compute({ h: 200, b: 100, tw: 5.6, tf: 8.5, r: 12 });
        expect(res.area).toBeGreaterThan(2500); // mm²
        expect(res.ix).toBeGreaterThan(1.8e7); // mm⁴
        expect(res.wx).toBeCloseTo(res.ix / 100, 1);
        expect(res.ix_gyration).toBeGreaterThan(70);
        expect(res.svg).toContain('M -50 -100');
    });

    it('RHS Box Tube: calculates section properties per EN 10219', () => {
        const res = RHSProfileNode.compute({ b: 100, h: 150, t: 5 });
        expect(res.area).toBe(100 * 150 - 90 * 140); // 2400 mm²
        expect(res.ix).toBeGreaterThan(res.iy);
        expect(res.torsion_j).toBeGreaterThan(0);
        expect(res.perimeter).toBe(2 * (100 + 150));
    });

    it('CHS Pipe: calculates circular section properties per EN 10210', () => {
        const res = CHSProfileNode.compute({ d_ext: 114.3, t: 6.3 });
        expect(res.area).toBeGreaterThan(2000);
        expect(res.polar_j).toBeCloseTo(2 * res.ix, 4);
        expect(res.radius_gyration).toBeGreaterThan(35);
    });

    it('L-Angle: calculates centroidal offsets and moments per EN 10056', () => {
        const res = LAngleProfileNode.compute({ a: 100, b: 100, t: 10 });
        expect(res.area).toBe(10 * (100 + 100 - 10)); // 1900 mm²
        expect(res.centroid_x).toBeCloseTo(res.centroid_y, 4);
        expect(res.ix).toBeCloseTo(res.iy, 4);
    });

    it('C-Channel: calculates U-profile properties per EN 10279', () => {
        const res = CChannelProfileNode.compute({ h: 160, b: 65, tw: 7.5, tf: 10.5 });
        expect(res.area).toBeGreaterThan(2000);
        expect(res.ix).toBeGreaterThan(res.iy);
        expect(res.centroid_x).toBeGreaterThan(7.5 / 2);
    });

    it('Solid Section: calculates rectangle, circle, and hexagon properties', () => {
        // Rectangle
        const rect = SolidSectionNode.compute({ shape_type: 0, dim1: 50, dim2: 80 });
        expect(rect.area).toBe(4000);
        expect(rect.ix).toBe((50 * Math.pow(80, 3)) / 12);

        // Round
        const round = SolidSectionNode.compute({ shape_type: 1, dim1: 40 });
        expect(round.area).toBeCloseTo((Math.PI / 4) * 1600, 2);
        expect(round.torsion_j).toBeCloseTo((Math.PI / 32) * Math.pow(40, 4), 2);
    });

    it('GeometryBridgeNode: unpacks profile for downstream beam/buckling solvers', () => {
        const iBeamRes = IBeamProfileNode.compute({ h: 200, b: 100, tw: 5.6, tf: 8.5, r: 12 });
        const bridgeRes = GeometryBridgeNode.compute({ profile: iBeamRes.profile });
        expect(bridgeRes.area).toBe(iBeamRes.area);
        expect(bridgeRes.ix).toBe(iBeamRes.ix);
        expect(bridgeRes.d_eq).toBeGreaterThan(0);
    });
});

describe('Advanced Engineering Mathematics Library', () => {
    it('Vector 3D & Operations: calculates magnitude, dot product, cross product, and angle', () => {
        const vA = Vector3DNode.compute({ x: 3, y: 0, z: 0 });
        const vB = Vector3DNode.compute({ x: 0, y: 4, z: 0 });
        expect(vA.magnitude).toBe(3);
        expect(vB.magnitude).toBe(4);

        const ops = VectorOperationsNode.compute({ v1: vA.vec, v2: vB.vec });
        expect(ops.dot).toBe(0); // Perpendicular
        expect(ops.angle_deg).toBe(90);
        expect(ops.cross).toEqual({ x: 0, y: 0, z: 12 });
    });

    it('Matrix 3x3: computes determinant, trace, and vector transformation', () => {
        const res = Matrix3x3Node.compute({
            m00: 2, m01: 0, m02: 0,
            m10: 0, m11: 3, m12: 0,
            m20: 0, m21: 0, m22: 4,
            vec: { x: 1, y: 2, z: 3 },
        });
        expect(res.det).toBe(24);
        expect(res.trace).toBe(9);
        expect(res.transformed_vec).toEqual({ x: 2, y: 6, z: 12 });
    });

    it('Numerical Calculus: Simpson 1/3 integration and central difference derivative', () => {
        // f(x) = x^2 at x=2, h=1 -> f(1)=1, f(2)=4, f(3)=9
        const res = NumericalCalculusNode.compute({ f_xm1: 1, f_x: 4, f_xp1: 9, h_step: 1 });
        expect(res.derivative_1st).toBe(4); // d/dx (x^2) at x=2 is 2*2 = 4
        expect(res.derivative_2nd).toBe(2); // d2/dx2 (x^2) is 2
        // Integral of x^2 from 1 to 3: [x^3/3]_1^3 = 27/3 - 1/3 = 26/3 ≈ 8.6667
        expect(res.simpson_integral).toBeCloseTo(26 / 3, 4);
    });

    it('Polynomial Roots: finds exact real roots of quadratic & cubic', () => {
        // x^2 - 5x + 6 = 0 -> roots 3, 2
        const quad = PolynomialRootsNode.compute({ a: 1, b: -5, c: 6, d: 0 });
        expect(quad.real_root_count).toBe(2);
        expect(Math.max(quad.root1, quad.root2)).toBe(3);
        expect(Math.min(quad.root1, quad.root2)).toBe(2);
    });

    it('Statistics & Regression: linear fit y = mx + c and R²', () => {
        const res = StatisticsRegressionNode.compute({
            data_x: [1, 2, 3, 4, 5],
            data_y: [2, 4, 6, 8, 10],
        });
        expect(res.slope_m).toBeCloseTo(2, 4);
        expect(res.intercept_c).toBeCloseTo(0, 4);
        expect(res.r_squared).toBeCloseTo(1.0, 4);
    });
});

describe('Universal Physics Engine', () => {
    it('Kinematics: 1D motion & 2D ballistic trajectory', () => {
        const res = KinematicsNode.compute({ v0: 20, angle_deg: 45, accel: 0, time: 2 });
        expect(res.v_final).toBe(20);
        expect(res.apex_height).toBeGreaterThan(10);
        expect(res.range_2d).toBeGreaterThan(40);
        expect(res.time_flight).toBeGreaterThan(2.5);
    });

    it('Dynamics & Friction: Coulomb friction on incline', () => {
        const res = DynamicsFrictionNode.compute({
            mass: 50,
            force_applied: 500,
            angle_deg: 20,
            mu_s: 0.35,
            mu_k: 0.25,
        });
        expect(res.normal_force).toBeGreaterThan(400);
        expect(res.is_moving).toBe(true);
        expect(res.accel).toBeGreaterThan(0);
    });

    it('Work, Energy & Power: kinetic, potential, and kilowatt power', () => {
        const res = WorkEnergyPowerNode.compute({ mass: 100, velocity: 20, height: 10, duration: 5 });
        expect(res.ke_joules).toBe(20000); // 0.5 * 100 * 400
        expect(res.pe_joules).toBeCloseTo(9806.65, 1);
        expect(res.power_kw).toBeGreaterThan(5);
    });

    it('Rotational Dynamics: torque, angular acceleration, and flywheel energy', () => {
        const res = RotationalDynamicsNode.compute({
            inertia_kgm2: 0.5,
            torque: 100,
            rpm_init: 1200,
            duration: 1,
        });
        expect(res.angular_accel).toBe(200); // 100 / 0.5
        expect(res.omega_rad_s).toBeGreaterThan(125);
        expect(res.rot_energy_j).toBeGreaterThan(10000);
    });

    it('Harmonic Vibration SDOF: natural frequency, damping ratio, and resonance amplification', () => {
        const res = HarmonicVibrationNode.compute({
            mass: 25,
            stiffness: 100000,
            damping_c: 100,
            freq_driving: 10.0658, // At resonance
        });
        expect(res.omega_n).toBeCloseTo(Math.sqrt(100000 / 25), 4); // 63.2455 rad/s
        expect(res.fn_hz).toBeCloseTo(63.2455 / (2 * Math.PI), 3); // ~10.066 Hz
        expect(res.damping_ratio).toBeCloseTo(100 / (2 * Math.sqrt(100000 * 25)), 4);
        expect(res.amplification_q).toBeGreaterThan(10); // Resonance amplification
    });

    it('Heat Transfer: Fourier 1D conduction and Newton convection', () => {
        const res = HeatTransferNode.compute({
            k_thermal: 205, // Aluminum
            area: 0.5,
            thickness_mm: 10,
            temp_hot: 80,
            temp_cold: 20,
            h_conv: 25,
        });
        expect(res.heat_flow_w).toBeCloseTo((205 * 0.5 * 60) / 0.01, 1); // 615,000 W
        expect(res.thermal_resistance).toBeCloseTo(0.01 / (205 * 0.5), 6);
        expect(res.conv_heat_w).toBe(25 * 0.5 * 60); // 750 W
    });

    it('Electrical Power & AC RLC: impedance, current, active power, and resonance', () => {
        const res = ElectricalPowerImpedanceNode.compute({
            voltage: 230,
            freq_hz: 50,
            resistance: 10,
            inductance_mh: 50,
            capacitance_uf: 100,
        });
        expect(res.impedance_ohm).toBeGreaterThan(10);
        expect(res.current_a).toBeGreaterThan(5);
        expect(res.power_factor).toBeGreaterThan(0);
        expect(res.power_factor).toBeLessThanOrEqual(1.0);
        expect(res.resonant_freq_hz).toBeGreaterThan(60);
    });
});

describe('Chemistry & Chemical Thermodynamics Engine', () => {
    it('Periodic Element Database: retrieves IUPAC data for Carbon and Iron', () => {
        const iron = PeriodicElementNode.compute({ Z: 26 });
        expect(iron.element_name).toBe('Iron');
        expect(iron.symbol_out).toBe('Fe');
        expect(iron.mass).toBeCloseTo(55.845, 3);
        expect(iron.density).toBeCloseTo(7.874, 3);

        const aluminum = PeriodicElementNode.compute({ symbol: 'Al' });
        expect(aluminum.element_name).toBe('Aluminum');
        expect(aluminum.mass).toBeCloseTo(26.982, 3);
    });

    it('Gas Laws: compares ideal vs Van der Waals real gas compressibility Z', () => {
        const res = GasLawsNode.compute({ T: 300, V: 10, n: 2, a_vdw: 1.37, b_vdw: 0.0387 });
        expect(res.P_ideal_bar).toBeGreaterThan(0);
        expect(res.P_vdw_bar).toBeGreaterThan(0);
        expect(res.Z_compressibility).toBeCloseTo(res.P_vdw_bar / res.P_ideal_bar, 3);
        expect(res.P_mpa).toBeCloseTo(res.P_vdw_bar * 0.1, 4);
    });

    it('Thermodynamics: calculates Gibbs energy ΔG and evaluates reaction spontaneity', () => {
        // Exothermic & entropy favored reaction: dH = -100 kJ/mol, dS = +50 J/mol*K at 25°C
        const res = ThermodynamicsNode.compute({ dH: -100, dS: 50, T_c: 25 });
        expect(res.dG_kj_mol).toBeLessThan(-100);
        expect(res.spontaneous).toBe(true);
        expect(res.keq).toBeGreaterThan(1);
    });

    it('Stoichiometry: parses chemical formulas into exact molecular weights and molar quantities', () => {
        // Al2O3: 2 * 26.982 + 3 * 15.999 = 53.964 + 47.997 = 101.961 g/mol
        const res = StoichiometryNode.compute({ formula: 'Al2O3', mass_g: 203.92 });
        expect(res.molar_mass).toBeCloseTo(101.96, 1);
        expect(res.moles).toBeCloseTo(2.0, 1);
        expect(res.composition_summary).toContain('Al:');
        expect(res.composition_summary).toContain('O:');
    });

    it('Solution Concentration & pH: calculates molarity, dilution, and strong acid pH', () => {
        const res = SolutionConcentrationPHNode.compute({
            moles: 0.1,
            volume_l: 1.0,
            target_v2_l: 2.0,
            is_acid: true,
        });
        expect(res.molarity).toBe(0.1);
        expect(res.diluted_c2).toBe(0.05);
        expect(res.ph).toBeCloseTo(1.0, 2);
    });
});

describe('Universal Materials & Heat Treatment Metallurgy Engine', () => {
    it('Universal Material Selector: returns verified alloy properties for AISI 4140', () => {
        const res = UniversalMaterialNode.compute({ material_name: 'AISI 4140 (Cr-Mo)' });
        expect(res.yield_strength).toBe(655);
        expect(res.tensile_strength).toBe(1020);
        expect(res.youngs_modulus).toBe(210);
        expect(res.carbon_pct).toBe(0.40);
        expect(res.hardness_hrc).toBeGreaterThanOrEqual(28);
    });

    it('Heat Treatment: simulates Quench & Tempering with Hollomon-Jaffe softening', () => {
        const highTemper = HeatTreatmentNode.compute({
            base_yield: 655,
            base_tensile: 1020,
            carbon_pct: 0.40,
            process_type: 0, // Q&T
            treatment_temp_c: 550, // Higher temper -> softer, higher ductility
            soak_time_hours: 2,
        });

        const lowTemper = HeatTreatmentNode.compute({
            base_yield: 655,
            base_tensile: 1020,
            carbon_pct: 0.40,
            process_type: 0, // Q&T
            treatment_temp_c: 250, // Lower temper -> harder, higher tensile
            soak_time_hours: 2,
        });

        expect(lowTemper.final_hardness_hrc).toBeGreaterThan(highTemper.final_hardness_hrc);
        expect(lowTemper.final_tensile).toBeGreaterThan(highTemper.final_tensile);
        expect(highTemper.elongation_pct).toBeGreaterThan(lowTemper.elongation_pct);
        expect(highTemper.microstructure).toContain('Tempered Martensite');
    });

    it('Heat Treatment: simulates Case Hardening diffusion depth (CHD) per Fick’s Law', () => {
        const res = HeatTreatmentNode.compute({
            base_yield: 350,
            base_tensile: 500,
            carbon_pct: 0.20,
            process_type: 1, // Case Harden
            treatment_temp_c: 920,
            soak_time_hours: 4,
        });
        expect(res.final_hardness_hrc).toBe(62);
        expect(res.case_depth_mm).toBeGreaterThan(0.5);
        expect(res.microstructure).toContain('martensitic case');
    });
});

describe('Turnkey Sandbox Templates & Execution Pipeline', () => {
    it('All 5 turnkey sandbox templates load with valid nodes, edges, and schemas', () => {
        expect(SANDBOX_TEMPLATES.length).toBe(5);
        for (const tmpl of SANDBOX_TEMPLATES) {
            expect(tmpl.id).toBeDefined();
            expect(tmpl.nodes.length).toBeGreaterThan(0);
            expect(tmpl.standard).toBeDefined();
        }
    });

    it('Executes the Structural Beam Deflection Sandbox pipeline end-to-end', () => {
        const tmpl = SANDBOX_TEMPLATES.find((t) => t.id === 'sandbox-structural-beam')!;
        const graphNodes = tmpl.nodes.map((n) => ({
            id: n.id,
            data: { ...n.data },
        }));

        const engine = new FlowEngine(graphNodes, tmpl.edges, NODE_REGISTRY);
        const result = engine.execute();

        expect(result.success).toBe(true);
        expect(result.errors.size).toBe(0);

        // Check outputs
        const sectionOut = result.nodeResults.get('beam-section');
        expect(sectionOut?.profile).toBeDefined();

        const bridgeOut = result.nodeResults.get('geom-bridge');
        expect(bridgeOut?.ix).toBeGreaterThan(0);

        const solverOut = result.nodeResults.get('beam-solver');
        expect(solverOut?.deflection).toBeGreaterThan(0);
        expect(solverOut?.stress).toBeGreaterThan(0);
    });
});
