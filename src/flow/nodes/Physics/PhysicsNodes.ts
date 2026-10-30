/**
 * AluCalculator OS — Universal Physics Engine
 *
 * Implements deterministic physics calculation nodes:
 * 1. Kinematics 1D/2D (Newtonian motion & projectile trajectories)
 * 2. Dynamics & Friction (Newton's 2nd law on inclines & Coulomb friction)
 * 3. Work, Energy & Power (Kinetic, Potential, Conservation of Energy)
 * 4. Rotational Dynamics (Torque, Angular acceleration, Rotational Kinetic Energy)
 * 5. SDOF Harmonic Vibration (Natural frequency, Damping ratio, Resonance per ISO 10816)
 * 6. Heat Transfer (Fourier conduction & Newton convection)
 * 7. Electrical Power & AC Impedance (RLC Circuits, Real/Reactive Power)
 *
 * Layer: flow (Pure TypeScript, zero DOM/React dependencies).
 */

import type { EngineeringNodeSchema } from '@/flow/types/core';

// ---------------------------------------------------------------------------
// 1. Kinematics 1D / 2D Node
// ---------------------------------------------------------------------------
export const KinematicsNode: EngineeringNodeSchema = {
    id: 'phys-kinematics',
    version: '1.0.0',
    title: 'Kinematics (Motion & Trajectory)',
    description: 'Calculates 1D/2D kinematics: final velocity, displacement, projectile range, and apex height.',
    category: 'physics',
    deterministic: true,
    isoStandard: 'ISO 80000-3 (Space and Time)',
    inputs: [
        { id: 'v0', label: 'Initial Velocity v₀ (m/s)', type: 'velocity_m_s', required: true, defaultValue: 20 },
        { id: 'angle_deg', label: 'Launch Angle θ (deg)', type: 'number', required: true, defaultValue: 45 },
        { id: 'accel', label: 'Constant Accel a (m/s²)', type: 'acceleration_m_s2', required: false, defaultValue: 0 },
        { id: 'time', label: 'Elapsed Time t (s)', type: 'number', required: false, defaultValue: 2 },
    ],
    outputs: [
        { id: 'v_final', label: 'Final Velocity v (m/s)', type: 'velocity_m_s' },
        { id: 'displacement_1d', label: '1D Displacement s (m)', type: 'number' },
        { id: 'apex_height', label: 'Max Projectile Height H (m)', type: 'number' },
        { id: 'range_2d', label: 'Horizontal Range R (m)', type: 'number' },
        { id: 'time_flight', label: 'Total Flight Time (s)', type: 'number' },
    ],
    validate: (inputs: Record<string, number>) => {
        const errors: string[] = [];
        if (inputs.v0 < 0) errors.push('Initial velocity v₀ must be non-negative');
        if (inputs.time !== undefined && inputs.time < 0) errors.push('Time cannot be negative');
        return { valid: errors.length === 0, errors, warnings: [] };
    },
    compute: (inputs: Record<string, number>) => {
        const v0 = Number(inputs.v0 || 0);
        const thetaRad = (Number(inputs.angle_deg || 0) * Math.PI) / 180;
        const a = Number(inputs.accel || 0);
        const t = Number(inputs.time || 0);
        const g = 9.80665; // Standard gravity m/s²

        // 1D Linear Motion: v = v0 + a*t, s = v0*t + 0.5*a*t^2
        const v_final = v0 + a * t;
        const displacement_1d = v0 * t + 0.5 * a * Math.pow(t, 2);

        // 2D Projectile in standard gravity:
        const v0x = v0 * Math.cos(thetaRad);
        const v0y = v0 * Math.sin(thetaRad);

        let apex_height = 0;
        let time_flight = 0;
        let range_2d = 0;

        if (v0y > 0) {
            apex_height = Math.pow(v0y, 2) / (2 * g);
            time_flight = (2 * v0y) / g;
            range_2d = v0x * time_flight;
        }

        return {
            v_final,
            displacement_1d,
            apex_height,
            range_2d,
            time_flight,
        };
    },
};

// ---------------------------------------------------------------------------
// 2. Dynamics & Incline Friction Node (Newton 2nd Law & Coulomb Friction)
// ---------------------------------------------------------------------------
export const DynamicsFrictionNode: EngineeringNodeSchema = {
    id: 'phys-dynamics-friction',
    version: '1.0.0',
    title: 'Dynamics & Incline Friction',
    description: 'Calculates acceleration, normal force, Coulomb friction, and breakaway threshold on slopes.',
    category: 'physics',
    deterministic: true,
    isoStandard: 'ISO 80000-4 (Mechanics)',
    inputs: [
        { id: 'mass', label: 'Mass m (kg)', type: 'mass_kg', required: true, defaultValue: 50 },
        { id: 'force_applied', label: 'Applied Force F (N)', type: 'force_n', required: true, defaultValue: 300 },
        { id: 'angle_deg', label: 'Incline Angle θ (deg)', type: 'number', required: false, defaultValue: 15 },
        { id: 'mu_s', label: 'Static Friction Coeff μs', type: 'number', required: false, defaultValue: 0.35 },
        { id: 'mu_k', label: 'Kinetic Friction Coeff μk', type: 'number', required: false, defaultValue: 0.25 },
    ],
    outputs: [
        { id: 'accel', label: 'Net Acceleration a (m/s²)', type: 'acceleration_m_s2' },
        { id: 'normal_force', label: 'Normal Force Fn (N)', type: 'force_n' },
        { id: 'friction_force', label: 'Friction Force Ff (N)', type: 'force_n' },
        { id: 'breakaway_force', label: 'Breakaway Threshold (N)', type: 'force_n' },
        { id: 'is_moving', label: 'Body in Motion', type: 'boolean' },
    ],
    validate: (inputs: Record<string, number>) => {
        const errors: string[] = [];
        if (inputs.mass <= 0) errors.push('Mass must be greater than zero');
        if (inputs.mu_s < 0 || inputs.mu_k < 0) errors.push('Friction coefficients cannot be negative');
        return { valid: errors.length === 0, errors, warnings: [] };
    },
    compute: (inputs: Record<string, number>) => {
        const m = Number(inputs.mass);
        const F = Number(inputs.force_applied);
        const thetaRad = (Number(inputs.angle_deg || 0) * Math.PI) / 180;
        const mu_s = Number(inputs.mu_s ?? 0.35);
        const mu_k = Number(inputs.mu_k ?? 0.25);
        const g = 9.80665;

        // Normal Force: Fn = m * g * cos(theta)
        const normal_force = m * g * Math.cos(thetaRad);

        // Gravitational force parallel to incline: F_parallel = m * g * sin(theta)
        const F_grav_parallel = m * g * Math.sin(thetaRad);

        // Maximum static friction: Fs_max = mu_s * Fn
        const maxStaticFriction = mu_s * normal_force;
        const breakaway_force = F_grav_parallel + maxStaticFriction;

        // Net driving force up the incline:
        const drivingForce = F - F_grav_parallel;

        let is_moving = false;
        let friction_force = 0;
        let accel = 0;

        if (Math.abs(drivingForce) > maxStaticFriction) {
            is_moving = true;
            friction_force = mu_k * normal_force * Math.sign(drivingForce);
            const netForce = drivingForce - friction_force;
            accel = netForce / m;
        } else {
            is_moving = false;
            friction_force = drivingForce;
            accel = 0;
        }

        return {
            accel,
            normal_force,
            friction_force: Math.abs(friction_force),
            breakaway_force,
            is_moving,
        };
    },
};

// ---------------------------------------------------------------------------
// 3. Work, Energy & Power Node
// ---------------------------------------------------------------------------
export const WorkEnergyPowerNode: EngineeringNodeSchema = {
    id: 'phys-work-energy-power',
    version: '1.0.0',
    title: 'Work, Energy & Power',
    description: 'Calculates kinetic energy, gravitational potential energy, and required average mechanical power.',
    category: 'physics',
    deterministic: true,
    isoStandard: 'ISO 80000-4:2019',
    inputs: [
        { id: 'mass', label: 'Mass m (kg)', type: 'mass_kg', required: true, defaultValue: 100 },
        { id: 'velocity', label: 'Velocity v (m/s)', type: 'velocity_m_s', required: true, defaultValue: 15 },
        { id: 'height', label: 'Height Δh (m)', type: 'number', required: false, defaultValue: 10 },
        { id: 'duration', label: 'Time Duration Δt (s)', type: 'number', required: false, defaultValue: 5 },
    ],
    outputs: [
        { id: 'ke_joules', label: 'Kinetic Energy Ek (J)', type: 'energy_joules' },
        { id: 'pe_joules', label: 'Potential Energy Ep (J)', type: 'energy_joules' },
        { id: 'total_energy_j', label: 'Total Mechanical Energy (J)', type: 'energy_joules' },
        { id: 'power_kw', label: 'Average Power (kW)', type: 'power_kw' },
    ],
    validate: (inputs: Record<string, number>) => {
        const errors: string[] = [];
        if (inputs.mass <= 0) errors.push('Mass must be > 0');
        if (inputs.duration !== undefined && inputs.duration <= 0) errors.push('Duration must be > 0');
        return { valid: errors.length === 0, errors, warnings: [] };
    },
    compute: (inputs: Record<string, number>) => {
        const m = Number(inputs.mass);
        const v = Number(inputs.velocity);
        const h = Number(inputs.height || 0);
        const dt = Number(inputs.duration || 1);
        const g = 9.80665;

        // Kinetic Energy: 0.5 * m * v^2
        const ke_joules = 0.5 * m * Math.pow(v, 2);

        // Potential Energy: m * g * h
        const pe_joules = m * g * h;

        const total_energy_j = ke_joules + pe_joules;
        const power_kw = total_energy_j / (dt * 1000); // kW

        return {
            ke_joules,
            pe_joules,
            total_energy_j,
            power_kw,
        };
    },
};

// ---------------------------------------------------------------------------
// 4. Rotational Dynamics Node
// ---------------------------------------------------------------------------
export const RotationalDynamicsNode: EngineeringNodeSchema = {
    id: 'phys-rotational-dynamics',
    version: '1.0.0',
    title: 'Rotational Dynamics & Flywheel',
    description: 'Calculates angular acceleration, rotational kinetic energy, and instantaneous shaft power.',
    category: 'physics',
    deterministic: true,
    isoStandard: 'DIN 1052 / Mechanics of Rotating Bodies',
    inputs: [
        { id: 'inertia_kgm2', label: 'Mass Moment of Inertia J (kg·m²)', type: 'number', required: true, defaultValue: 0.25 },
        { id: 'torque', label: 'Applied Torque T (N·m)', type: 'torque_nm', required: true, defaultValue: 50 },
        { id: 'rpm_init', label: 'Rotational Speed n (rpm)', type: 'rpm', required: true, defaultValue: 1500 },
        { id: 'duration', label: 'Acceleration Time t (s)', type: 'number', required: false, defaultValue: 2 },
    ],
    outputs: [
        { id: 'angular_accel', label: 'Angular Accel α (rad/s²)', type: 'number' },
        { id: 'omega_rad_s', label: 'Angular Velocity ω (rad/s)', type: 'angular_velocity_rad_s' },
        { id: 'rot_energy_j', label: 'Rotational Energy (J)', type: 'energy_joules' },
        { id: 'power_kw', label: 'Shaft Power P (kW)', type: 'power_kw' },
    ],
    validate: (inputs: Record<string, number>) => {
        const errors: string[] = [];
        if (inputs.inertia_kgm2 <= 0) errors.push('Moment of inertia must be > 0');
        return { valid: errors.length === 0, errors, warnings: [] };
    },
    compute: (inputs: Record<string, number>) => {
        const J = Number(inputs.inertia_kgm2);
        const T = Number(inputs.torque);
        const rpm = Number(inputs.rpm_init);
        const t = Number(inputs.duration || 0);

        // Angular velocity: omega = 2 * pi * n / 60
        const omega_initial = (2 * Math.PI * rpm) / 60;

        // Angular acceleration: alpha = T / J
        const angular_accel = T / J;

        // Final angular velocity
        const omega_rad_s = omega_initial + angular_accel * t;

        // Rotational kinetic energy: 0.5 * J * omega^2
        const rot_energy_j = 0.5 * J * Math.pow(omega_rad_s, 2);

        // Power: P = T * omega (W) -> kW
        const power_kw = (T * omega_rad_s) / 1000;

        return {
            angular_accel,
            omega_rad_s,
            rot_energy_j,
            power_kw,
        };
    },
};

// ---------------------------------------------------------------------------
// 5. Harmonic Vibration SDOF Node (ISO 10816 / Single Degree of Freedom)
// ---------------------------------------------------------------------------
export const HarmonicVibrationNode: EngineeringNodeSchema = {
    id: 'phys-vibration-sdof',
    version: '1.0.0',
    title: 'Harmonic Vibration (SDOF)',
    description: 'Calculates natural frequency, critical damping ratio, and resonance amplification per ISO 10816.',
    category: 'physics',
    deterministic: true,
    isoStandard: 'ISO 10816 / ISO 20816-1',
    inputs: [
        { id: 'mass', label: 'Oscillator Mass m (kg)', type: 'mass_kg', required: true, defaultValue: 25 },
        { id: 'stiffness', label: 'Spring Stiffness k (N/m)', type: 'number', required: true, defaultValue: 50000 },
        { id: 'damping_c', label: 'Damping Coeff c (N·s/m)', type: 'number', required: false, defaultValue: 75 },
        { id: 'freq_driving', label: 'Driving Frequency f (Hz)', type: 'frequency_hz', required: false, defaultValue: 7.1 },
    ],
    outputs: [
        { id: 'fn_hz', label: 'Natural Frequency fn (Hz)', type: 'frequency_hz' },
        { id: 'omega_n', label: 'Natural Angular Freq ωn (rad/s)', type: 'angular_velocity_rad_s' },
        { id: 'damping_ratio', label: 'Damping Ratio ζ', type: 'damping_ratio' },
        { id: 'critical_damping', label: 'Critical Damping cc (N·s/m)', type: 'number' },
        { id: 'amplification_q', label: 'Dynamic Amplification Factor Q', type: 'number' },
    ],
    validate: (inputs: Record<string, number>) => {
        const errors: string[] = [];
        if (inputs.mass <= 0) errors.push('Mass must be > 0');
        if (inputs.stiffness <= 0) errors.push('Spring stiffness k must be > 0');
        if (inputs.damping_c !== undefined && inputs.damping_c < 0) errors.push('Damping coeff cannot be negative');
        return { valid: errors.length === 0, errors, warnings: [] };
    },
    compute: (inputs: Record<string, number>) => {
        const m = Number(inputs.mass);
        const k = Number(inputs.stiffness);
        const c = Number(inputs.damping_c || 0);
        const f_drive = Number(inputs.freq_driving || 0);

        // Undamped natural frequency: omega_n = sqrt(k / m)
        const omega_n = Math.sqrt(k / m);
        const fn_hz = omega_n / (2 * Math.PI);

        // Critical damping: cc = 2 * sqrt(k * m)
        const critical_damping = 2 * Math.sqrt(k * m);

        // Damping ratio: zeta = c / cc
        const damping_ratio = c / critical_damping;

        // Driving angular frequency: omega = 2 * pi * f_drive
        const omega_drive = 2 * Math.PI * f_drive;
        const freq_ratio = omega_n > 1e-12 ? omega_drive / omega_n : 0;

        // Dynamic Amplification Factor: Q = 1 / sqrt((1 - r^2)^2 + (2*zeta*r)^2)
        const denom = Math.sqrt(
            Math.pow(1 - Math.pow(freq_ratio, 2), 2) + Math.pow(2 * damping_ratio * freq_ratio, 2)
        );
        const amplification_q = denom > 1e-6 ? 1 / denom : 100;

        return {
            fn_hz,
            omega_n,
            damping_ratio,
            critical_damping,
            amplification_q,
        };
    },
};

// ---------------------------------------------------------------------------
// 6. Heat Transfer (Conduction & Convection) Node
// ---------------------------------------------------------------------------
export const HeatTransferNode: EngineeringNodeSchema = {
    id: 'phys-heat-transfer',
    version: '1.0.0',
    title: 'Heat Transfer (Conduction / Convection)',
    description: 'Calculates Fourier 1D wall thermal conduction and Newton boundary surface convection.',
    category: 'physics',
    deterministic: true,
    isoStandard: 'ISO 13789 / EN ISO 6946',
    inputs: [
        { id: 'k_thermal', label: 'Conductivity k (W/m·K)', type: 'thermal_conductivity_w_mk', required: true, defaultValue: 205 }, // Aluminum
        { id: 'area', label: 'Heat Transfer Area A (m²)', type: 'number', required: true, defaultValue: 0.5 },
        { id: 'thickness_mm', label: 'Wall Thickness L (mm)', type: 'length_mm', required: true, defaultValue: 10 },
        { id: 'temp_hot', label: 'Hot Surface Temp T1 (°C)', type: 'temperature_c', required: true, defaultValue: 85 },
        { id: 'temp_cold', label: 'Cold Surface Temp T2 (°C)', type: 'temperature_c', required: true, defaultValue: 25 },
        { id: 'h_conv', label: 'Convection Coeff h (W/m²·K)', type: 'heat_transfer_coeff_w_m2k', required: false, defaultValue: 25 },
    ],
    outputs: [
        { id: 'heat_flow_w', label: 'Conduction Heat Rate Q (W)', type: 'number' },
        { id: 'heat_flux', label: 'Heat Flux q (W/m²)', type: 'number' },
        { id: 'thermal_resistance', label: 'Thermal Resistance Rth (K/W)', type: 'number' },
        { id: 'conv_heat_w', label: 'Convective Transfer Qc (W)', type: 'number' },
    ],
    validate: (inputs: Record<string, number>) => {
        const errors: string[] = [];
        if (inputs.k_thermal <= 0) errors.push('Thermal conductivity k must be > 0');
        if (inputs.area <= 0) errors.push('Area A must be > 0');
        if (inputs.thickness_mm <= 0) errors.push('Thickness L must be > 0');
        return { valid: errors.length === 0, errors, warnings: [] };
    },
    compute: (inputs: Record<string, number>) => {
        const k = Number(inputs.k_thermal);
        const A = Number(inputs.area);
        const L = Number(inputs.thickness_mm) / 1000; // m
        const T1 = Number(inputs.temp_hot);
        const T2 = Number(inputs.temp_cold);
        const h_conv = Number(inputs.h_conv || 25);

        const deltaT = T1 - T2;

        // Fourier's Law: Q = k * A * deltaT / L
        const heat_flow_w = (k * A * deltaT) / L;
        const heat_flux = heat_flow_w / A;

        // Thermal resistance: R = L / (k * A)
        const thermal_resistance = L / (k * A);

        // Newton's Law of Cooling: Q_conv = h * A * deltaT
        const conv_heat_w = h_conv * A * deltaT;

        return {
            heat_flow_w,
            heat_flux,
            thermal_resistance,
            conv_heat_w,
        };
    },
};

// ---------------------------------------------------------------------------
// 7. Electrical Power & AC Impedance Node
// ---------------------------------------------------------------------------
export const ElectricalPowerImpedanceNode: EngineeringNodeSchema = {
    id: 'phys-electrical-rlc',
    version: '1.0.0',
    title: 'Electrical Power & AC RLC Circuit',
    description: 'Calculates AC circuit impedance, reactive powers, power factor, and resonance frequency.',
    category: 'physics',
    deterministic: true,
    isoStandard: 'IEC 60038 / IEEE 1459',
    inputs: [
        { id: 'voltage', label: 'AC Voltage Vrms (V)', type: 'voltage_v', required: true, defaultValue: 230 },
        { id: 'freq_hz', label: 'Frequency f (Hz)', type: 'frequency_hz', required: true, defaultValue: 50 },
        { id: 'resistance', label: 'Resistance R (Ω)', type: 'resistance_ohm', required: true, defaultValue: 12 },
        { id: 'inductance_mh', label: 'Inductance L (mH)', type: 'number', required: false, defaultValue: 45 },
        { id: 'capacitance_uf', label: 'Capacitance C (μF)', type: 'number', required: false, defaultValue: 100 },
    ],
    outputs: [
        { id: 'impedance_ohm', label: 'Net Impedance |Z| (Ω)', type: 'resistance_ohm' },
        { id: 'current_a', label: 'Current Irms (A)', type: 'current_a' },
        { id: 'real_power_w', label: 'Active Power P (W)', type: 'power_kw' },
        { id: 'reactive_power_var', label: 'Reactive Power Q (VAR)', type: 'number' },
        { id: 'power_factor', label: 'Power Factor cos(φ)', type: 'number' },
        { id: 'resonant_freq_hz', label: 'Resonant Frequency f₀ (Hz)', type: 'frequency_hz' },
    ],
    validate: (inputs: Record<string, number>) => {
        const errors: string[] = [];
        if (inputs.voltage <= 0) errors.push('Voltage must be > 0');
        if (inputs.freq_hz <= 0) errors.push('Frequency must be > 0');
        if (inputs.resistance <= 0) errors.push('Resistance R must be > 0');
        return { valid: errors.length === 0, errors, warnings: [] };
    },
    compute: (inputs: Record<string, number>) => {
        const V = Number(inputs.voltage);
        const f = Number(inputs.freq_hz);
        const R = Number(inputs.resistance);
        const L = Number(inputs.inductance_mh || 0) / 1000; // Henry
        const C = Number(inputs.capacitance_uf || 0) / 1e6; // Farad

        const omega = 2 * Math.PI * f;

        // Inductive reactance XL = omega * L
        const XL = omega * L;

        // Capacitive reactance XC = 1 / (omega * C)
        const XC = C > 0 ? 1 / (omega * C) : 0;

        // Net Reactance X = XL - XC
        const X = XL - XC;

        // Net Impedance |Z| = sqrt(R^2 + X^2)
        const impedance_ohm = Math.sqrt(R * R + X * X);

        // Current I = V / |Z|
        const current_a = V / impedance_ohm;

        // Power factor cos(phi) = R / |Z|
        const power_factor = R / impedance_ohm;

        // Active Power P = V * I * cos(phi)
        const real_power_w = V * current_a * power_factor;

        // Reactive Power Q = V * I * sin(phi)
        const sin_phi = X / impedance_ohm;
        const reactive_power_var = V * current_a * sin_phi;

        // Resonant frequency: f0 = 1 / (2 * pi * sqrt(L * C))
        let resonant_freq_hz = 0;
        if (L > 0 && C > 0) {
            resonant_freq_hz = 1 / (2 * Math.PI * Math.sqrt(L * C));
        }

        return {
            impedance_ohm,
            current_a,
            real_power_w,
            reactive_power_var,
            power_factor,
            resonant_freq_hz,
        };
    },
};
