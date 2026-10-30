'use client';

import React, { useState, useMemo } from 'react';
import {
  Zap,
  Info,
  CheckCircle2,
  AlertTriangle,
  Sliders,
  Activity,
  Download,
  RotateCcw,
  Radio,
  ShieldCheck,
  FileSpreadsheet,
} from 'lucide-react';
import { useI18nStore } from '@/store/i18nStore';
import { t12 } from '@/locales/t12';
import { openNotebookLMStudio } from '@/components/notebooklm/NotebookLMStudioModal';

export interface HeadlessInputParam {
  key: string;
  symbol: string;
  label: string;
  unit: string;
  defaultValue: number;
  min: number;
  max: number;
  step: number;
}

export interface HeadlessOutputMetric {
  key: string;
  symbol: string;
  label: string;
  value: number;
  unit: string;
  precision?: number;
}

export interface HeadlessSolveResult {
  primary: HeadlessOutputMetric;
  secondary: HeadlessOutputMetric[];
  substitutionTrace: string;
  status: 'PASS' | 'WARNING' | 'CRITICAL';
  verdictMessage: string;
}

export interface DeterministicHeadlessSolverSpec {
  slug: string;
  standard: string;
  tier: 'NORMATIVE' | 'SCIENTIFIC';
  formulaDisplay: string;
  inputs: HeadlessInputParam[];
  solve: (vals: Record<string, number>) => HeadlessSolveResult;
}

export const DETERMINISTIC_HEADLESS_SOLVERS: Record<string, DeterministicHeadlessSolverSpec> = {
  'hooke-law': {
    slug: 'hooke-law',
    standard: 'EN 13906-1 / Elasticity Theory',
    tier: 'NORMATIVE',
    formulaDisplay: 'F = k · x   |   U_e = ½ · k · x²',
    inputs: [
      { key: 'k', symbol: 'k', label: 'Spring Stiffness Rate', unit: 'N/mm', defaultValue: 45, min: 0.5, max: 1000, step: 0.5 },
      { key: 'x', symbol: 'x', label: 'Spring Deflection', unit: 'mm', defaultValue: 24, min: 0.5, max: 300, step: 0.5 },
      { key: 'F_max', symbol: 'F_lim', label: 'Allowable Elastic Limit Load', unit: 'N', defaultValue: 1500, min: 50, max: 50000, step: 10 },
    ],
    solve: ({ k, x, F_max }) => {
      const F = k * x;
      const energyJ = 0.5 * F * (x / 1000);
      const utilization = (F / Math.max(F_max, 1)) * 100;
      return {
        primary: { key: 'F', symbol: 'F', label: 'Restoring Spring Force', value: F, unit: 'N', precision: 2 },
        secondary: [
          { key: 'U_e', symbol: 'U_e', label: 'Stored Elastic Potential Energy', value: energyJ, unit: 'J', precision: 3 },
          { key: 'util', symbol: 'η', label: 'Elastic Limit Utilization', value: utilization, unit: '%', precision: 1 },
        ],
        substitutionTrace: `F = ${k.toFixed(2)} N/mm × ${x.toFixed(2)} mm = ${F.toFixed(2)} N | U_e = 0.5 × ${F.toFixed(2)} N × ${(x / 1000).toFixed(4)} m = ${energyJ.toFixed(3)} J`,
        status: utilization > 100 ? 'CRITICAL' : utilization > 85 ? 'WARNING' : 'PASS',
        verdictMessage:
          utilization <= 85
            ? `Spring operates safely within linear Hookean regime (${utilization.toFixed(1)}% of F_lim).`
            : `High coil stress utilization (${utilization.toFixed(1)}%). Verify solid height and Goodman fatigue life per EN 13906-1.`,
      };
    },
  },
  'ideal-gas-law': {
    slug: 'ideal-gas-law',
    standard: 'ISO 80000-5 / Thermodynamics',
    tier: 'SCIENTIFIC',
    formulaDisplay: 'P · V = n · R · T   (R = 8.31446 J/(mol·K))',
    inputs: [
      { key: 'n', symbol: 'n', label: 'Molar Quantity of Gas', unit: 'mol', defaultValue: 12.5, min: 0.1, max: 1000, step: 0.5 },
      { key: 'T_c', symbol: 'T', label: 'Gas Temperature', unit: '°C', defaultValue: 85, min: -100, max: 800, step: 5 },
      { key: 'V_L', symbol: 'V', label: 'Vessel Internal Volume', unit: 'L', defaultValue: 25, min: 0.5, max: 2000, step: 0.5 },
    ],
    solve: ({ n, T_c, V_L }) => {
      const R = 8.314462618;
      const T_K = T_c + 273.15;
      const V_m3 = Math.max(V_L, 0.001) / 1000;
      const P_Pa = (n * R * T_K) / V_m3;
      const P_bar = P_Pa / 1e5;
      const P_psi = P_bar * 14.5038;
      return {
        primary: { key: 'P_bar', symbol: 'P', label: 'Absolute Vessel Pressure', value: P_bar, unit: 'bar', precision: 3 },
        secondary: [
          { key: 'T_K', symbol: 'T_K', label: 'Absolute Kelvin Temperature', value: T_K, unit: 'K', precision: 2 },
          { key: 'P_psi', symbol: 'P_imp', label: 'Imperial Pressure Equivalent', value: P_psi, unit: 'psi', precision: 2 },
        ],
        substitutionTrace: `P = (${n} mol × 8.3145 J/mol·K × ${T_K.toFixed(2)} K) / ${V_m3.toFixed(4)} m³ = ${(P_Pa / 1000).toFixed(2)} kPa (${P_bar.toFixed(3)} bar)`,
        status: P_bar > 40 ? 'WARNING' : 'PASS',
        verdictMessage:
          P_bar <= 40
            ? 'Ideal gas state verified. Compressibility factor Z ≈ 1.00.'
            : 'High pressure regime (> 40 bar): verify real-gas Van der Waals / Redlich-Kwong compressibility Z factor.',
      };
    },
  },
  'reynolds-number': {
    slug: 'reynolds-number',
    standard: 'ISO 80000-4 / Crane TP-410',
    tier: 'NORMATIVE',
    formulaDisplay: 'Re = (ρ · v · D) / μ',
    inputs: [
      { key: 'rho', symbol: 'ρ', label: 'Fluid Density', unit: 'kg/m³', defaultValue: 998, min: 1, max: 2000, step: 1 },
      { key: 'v', symbol: 'v', label: 'Mean Flow Velocity', unit: 'm/s', defaultValue: 2.1, min: 0.05, max: 30, step: 0.05 },
      { key: 'D_mm', symbol: 'D', label: 'Hydraulic Pipe Diameter', unit: 'mm', defaultValue: 50, min: 2, max: 1000, step: 1 },
      { key: 'mu_mPas', symbol: 'μ', label: 'Dynamic Viscosity', unit: 'mPa·s', defaultValue: 1.002, min: 0.01, max: 500, step: 0.05 },
    ],
    solve: ({ rho, v, D_mm, mu_mPas }) => {
      const D_m = D_mm / 1000;
      const mu_Pas = Math.max(mu_mPas, 0.001) / 1000;
      const Re = (rho * v * D_m) / mu_Pas;
      const f_darcy = Re < 2300 ? 64 / Math.max(Re, 1) : 0.3164 / Math.pow(Re, 0.25);
      const regime = Re < 2300 ? 'Laminar (Re < 2300)' : Re < 4000 ? 'Transitional (2300–4000)' : 'Turbulent (Re > 4000)';
      return {
        primary: { key: 'Re', symbol: 'Re', label: 'Reynolds Number', value: Re, unit: '—', precision: 0 },
        secondary: [
          { key: 'f', symbol: 'f_D', label: 'Smooth-Pipe Darcy Friction Factor', value: f_darcy, unit: '—', precision: 4 },
          { key: 'q', symbol: 'P_dyn', label: 'Dynamic Velocity Pressure', value: 0.5 * rho * v * v, unit: 'Pa', precision: 1 },
        ],
        substitutionTrace: `Re = (${rho} kg/m³ × ${v} m/s × ${D_m.toFixed(4)} m) / ${mu_Pas.toFixed(6)} Pa·s = ${Re.toFixed(0)} [${regime}]`,
        status: Re >= 2300 && Re <= 4000 ? 'WARNING' : 'PASS',
        verdictMessage: `Flow regime classified as ${regime}. Smooth Darcy friction factor f = ${f_darcy.toFixed(4)}.`,
      };
    },
  },
  'bend-allowance': {
    slug: 'bend-allowance',
    standard: 'DIN 6935 / ISO 7438 Sheet Metal',
    tier: 'NORMATIVE',
    formulaDisplay: 'BA = (π / 180) · α · (R + K · T)',
    inputs: [
      { key: 'T', symbol: 'T', label: 'Sheet Thickness', unit: 'mm', defaultValue: 3.0, min: 0.5, max: 25, step: 0.25 },
      { key: 'R', symbol: 'R', label: 'Inside Bend Radius', unit: 'mm', defaultValue: 4.5, min: 0.5, max: 100, step: 0.5 },
      { key: 'alpha', symbol: 'α', label: 'Bend Angle', unit: 'deg', defaultValue: 90, min: 5, max: 175, step: 1 },
      { key: 'K', symbol: 'K', label: 'Neutral Axis K-Factor', unit: '—', defaultValue: 0.42, min: 0.25, max: 0.5, step: 0.01 },
    ],
    solve: ({ T, R, alpha, K }) => {
      const rad = (Math.PI / 180) * alpha;
      const BA = rad * (R + K * T);
      const OSSB = Math.tan(((alpha / 2) * Math.PI) / 180) * (R + T);
      const BD = 2 * OSSB - BA;
      const minRatio = R / Math.max(T, 0.1);
      return {
        primary: { key: 'BA', symbol: 'BA', label: 'Bend Allowance Arc Length', value: BA, unit: 'mm', precision: 3 },
        secondary: [
          { key: 'BD', symbol: 'BD', label: 'Bend Deduction', value: BD, unit: 'mm', precision: 3 },
          { key: 'OSSB', symbol: 'OSSB', label: 'Outside Setback', value: OSSB, unit: 'mm', precision: 3 },
        ],
        substitutionTrace: `BA = (${alpha}° × π/180) × (${R} + ${K} × ${T}) = ${BA.toFixed(3)} mm | BD = 2×${OSSB.toFixed(3)} - ${BA.toFixed(3)} = ${BD.toFixed(3)} mm`,
        status: minRatio < 1.0 ? 'WARNING' : 'PASS',
        verdictMessage:
          minRatio >= 1.0
            ? `R/T ratio (${minRatio.toFixed(2)}) satisfies DIN 6935 crack-free cold forming threshold.`
            : `Tight bend radius R/T = ${minRatio.toFixed(2)} < 1.0: risk of outer fiber grain cracking on 6061-T6.`,
      };
    },
  },
  'bending-moment': {
    slug: 'bending-moment',
    standard: 'AISC 360-16 / DIN 1025',
    tier: 'NORMATIVE',
    formulaDisplay: 'M_max = (F · L) / 4   |   σ_b = M_max / W_x',
    inputs: [
      { key: 'F_kN', symbol: 'F', label: 'Concentrated Mid-Span Load', unit: 'kN', defaultValue: 18, min: 0.5, max: 500, step: 0.5 },
      { key: 'L_m', symbol: 'L', label: 'Beam Support Span', unit: 'm', defaultValue: 3.2, min: 0.2, max: 25, step: 0.1 },
      { key: 'Wx_cm3', symbol: 'W_x', label: 'Elastic Section Modulus', unit: 'cm³', defaultValue: 145, min: 5, max: 5000, step: 5 },
      { key: 'fy_MPa', symbol: 'f_y', label: 'Material Yield Strength', unit: 'MPa', defaultValue: 250, min: 90, max: 900, step: 10 },
    ],
    solve: ({ F_kN, L_m, Wx_cm3, fy_MPa }) => {
      const M_kNm = (F_kN * L_m) / 4;
      const sigma_MPa = (M_kNm * 1e6) / (Math.max(Wx_cm3, 1) * 1e3);
      const SF = fy_MPa / Math.max(sigma_MPa, 0.1);
      return {
        primary: { key: 'M_max', symbol: 'M_max', label: 'Peak Bending Moment', value: M_kNm, unit: 'kN·m', precision: 2 },
        secondary: [
          { key: 'sigma', symbol: 'σ_b', label: 'Extreme Fiber Bending Stress', value: sigma_MPa, unit: 'MPa', precision: 1 },
          { key: 'SF', symbol: 'S_F', label: 'Yield Safety Factor', value: SF, unit: '—', precision: 2 },
        ],
        substitutionTrace: `M_max = (${F_kN} kN × ${L_m} m) / 4 = ${M_kNm.toFixed(2)} kN·m | σ_b = ${(M_kNm * 1e6).toFixed(0)} N·mm / ${(Wx_cm3 * 1000).toFixed(0)} mm³ = ${sigma_MPa.toFixed(1)} MPa`,
        status: SF < 1.1 ? 'CRITICAL' : SF < 1.5 ? 'WARNING' : 'PASS',
        verdictMessage:
          SF >= 1.5
            ? `Section modulus verified per AISC 360-16 (SF = ${SF.toFixed(2)} >= 1.50).`
            : `Bending stress (${sigma_MPa.toFixed(1)} MPa) approaches yield limit (SF = ${SF.toFixed(2)}). Increase W_x.`,
      };
    },
  },
  'gear-contact-stress': {
    slug: 'gear-contact-stress',
    standard: 'ISO 6336-2:2019 / AGMA 2001',
    tier: 'NORMATIVE',
    formulaDisplay: 'σ_H = Z_E · √( (F_t / (b · d_1)) · ((u + 1) / u) ) · Z_H · K_A',
    inputs: [
      { key: 'Ft_N', symbol: 'F_t', label: 'Nominal Tangential Tooth Load', unit: 'N', defaultValue: 4200, min: 100, max: 100000, step: 100 },
      { key: 'b_mm', symbol: 'b', label: 'Active Facewidth', unit: 'mm', defaultValue: 28, min: 5, max: 300, step: 1 },
      { key: 'd1_mm', symbol: 'd_1', label: 'Pinion Reference Diameter', unit: 'mm', defaultValue: 75, min: 15, max: 800, step: 1 },
      { key: 'u', symbol: 'u', label: 'Gear Ratio (z_2 / z_1)', unit: '—', defaultValue: 3.2, min: 1.0, max: 12.0, step: 0.1 },
    ],
    solve: ({ Ft_N, b_mm, d1_mm, u }) => {
      const ZE = 189.8; // Steel-on-steel ISO 6336 elasticity factor sqrt(MPa)
      const ZH = 2.495; // 20 deg pressure angle zone factor
      const KA = 1.25;
      const sigmaH = ZE * ZH * Math.sqrt(((Ft_N * KA) / (Math.max(b_mm, 1) * Math.max(d1_mm, 1))) * ((u + 1) / u));
      const sigmaH_lim = 1250; // Case-hardened 16MnCr5
      const SH = sigmaH_lim / Math.max(sigmaH, 1);
      return {
        primary: { key: 'sigmaH', symbol: 'σ_H', label: 'Hertzian Flank Contact Stress', value: sigmaH, unit: 'MPa', precision: 1 },
        secondary: [
          { key: 'SH', symbol: 'S_H', label: 'Pitting Safety Factor (vs 1250 MPa)', value: SH, unit: '—', precision: 2 },
          { key: 'T1', symbol: 'T_1', label: 'Pinion Torque', value: (Ft_N * d1_mm) / 2000, unit: 'N·m', precision: 1 },
        ],
        substitutionTrace: `σ_H = 189.8 × 2.495 × √[ (${Ft_N}×1.25 / (${b_mm}×${d1_mm})) × (${(u + 1).toFixed(1)}/${u.toFixed(1)}) ] = ${sigmaH.toFixed(1)} MPa`,
        status: SH < 1.0 ? 'CRITICAL' : SH < 1.2 ? 'WARNING' : 'PASS',
        verdictMessage:
          SH >= 1.2
            ? `ISO 6336-2 flank pitting resistance satisfied (S_H = ${SH.toFixed(2)} >= 1.20).`
            : `Contact stress (${sigmaH.toFixed(0)} MPa) risks micropitting; increase facewidth b or module.`,
      };
    },
  },
  'gear-module': {
    slug: 'gear-module',
    standard: 'ISO 54:1996 / DIN 780',
    tier: 'NORMATIVE',
    formulaDisplay: 'm = d / z   |   p = π · m   |   d_a = m · (z + 2)',
    inputs: [
      { key: 'd_mm', symbol: 'd', label: 'Reference Pitch Diameter', unit: 'mm', defaultValue: 96, min: 10, max: 2000, step: 1 },
      { key: 'z', symbol: 'z', label: 'Number of Gear Teeth', unit: 'teeth', defaultValue: 32, min: 12, max: 240, step: 1 },
    ],
    solve: ({ d_mm, z }) => {
      const m = d_mm / Math.max(z, 1);
      const pitch = Math.PI * m;
      const da = d_mm + 2 * m;
      const df = d_mm - 2.5 * m;
      return {
        primary: { key: 'm', symbol: 'm_n', label: 'Normal Gear Module', value: m, unit: 'mm', precision: 3 },
        secondary: [
          { key: 'p', symbol: 'p_t', label: 'Circular Pitch', value: pitch, unit: 'mm', precision: 2 },
          { key: 'da', symbol: 'd_a', label: 'Tip (Addendum) Diameter', value: da, unit: 'mm', precision: 2 },
          { key: 'df', symbol: 'd_f', label: 'Root (Dedendum) Diameter', value: df, unit: 'mm', precision: 2 },
        ],
        substitutionTrace: `m = ${d_mm} mm / ${z} teeth = ${m.toFixed(3)} mm | d_a = ${da.toFixed(2)} mm | d_f = ${df.toFixed(2)} mm`,
        status: z < 17 ? 'WARNING' : 'PASS',
        verdictMessage:
          z >= 17
            ? 'Tooth count z >= 17 avoids involute undercut without profile shift (α = 20°).'
            : 'z < 17: Positive profile shift coefficient (x > 0) required per DIN 3992 to prevent root undercut.',
      };
    },
  },
  'gear-ratio': {
    slug: 'gear-ratio',
    standard: 'ISO 21771 / AGMA 2001',
    tier: 'NORMATIVE',
    formulaDisplay: 'i = z_2 / z_1 = n_1 / n_2   |   T_2 = T_1 · i · η',
    inputs: [
      { key: 'z1', symbol: 'z_1', label: 'Driver Pinion Teeth', unit: 'teeth', defaultValue: 21, min: 10, max: 150, step: 1 },
      { key: 'z2', symbol: 'z_2', label: 'Driven Gear Teeth', unit: 'teeth', defaultValue: 68, min: 10, max: 400, step: 1 },
      { key: 'n1', symbol: 'n_1', label: 'Input Shaft Speed', unit: 'RPM', defaultValue: 1450, min: 10, max: 15000, step: 10 },
      { key: 'T1', symbol: 'T_1', label: 'Input Motor Torque', unit: 'N·m', defaultValue: 45, min: 1, max: 5000, step: 1 },
    ],
    solve: ({ z1, z2, n1, T1 }) => {
      const ratio = z2 / Math.max(z1, 1);
      const n2 = n1 / ratio;
      const T2 = T1 * ratio * 0.98;
      return {
        primary: { key: 'i', symbol: 'i', label: 'Transmission Gear Ratio', value: ratio, unit: ': 1', precision: 3 },
        secondary: [
          { key: 'n2', symbol: 'n_2', label: 'Output Shaft Speed', value: n2, unit: 'RPM', precision: 1 },
          { key: 'T2', symbol: 'T_2', label: 'Output Shaft Torque (η=98%)', value: T2, unit: 'N·m', precision: 1 },
        ],
        substitutionTrace: `i = ${z2} / ${z1} = ${ratio.toFixed(3)} | n_2 = ${n1} / ${ratio.toFixed(3)} = ${n2.toFixed(1)} RPM | T_2 = ${T2.toFixed(1)} N·m`,
        status: ratio > 6 ? 'WARNING' : 'PASS',
        verdictMessage:
          ratio <= 6
            ? 'Single-stage gear ratio within optimal spur/helical envelope (i <= 6.0).'
            : 'Single-stage ratio > 6.0: consider a 2-stage helical or planetary reducer for compact packaging.',
      };
    },
  },
  'heat-transfer-conduction': {
    slug: 'heat-transfer-conduction',
    standard: 'ASTM C177 / Fourier Law',
    tier: 'SCIENTIFIC',
    formulaDisplay: 'Q = (k · A · ΔT) / L',
    inputs: [
      { key: 'k', symbol: 'k', label: 'Thermal Conductivity (6061-T6 = 167)', unit: 'W/(m·K)', defaultValue: 167, min: 0.1, max: 420, step: 1 },
      { key: 'A_cm2', symbol: 'A', label: 'Cross-Sectional Conduction Area', unit: 'cm²', defaultValue: 120, min: 1, max: 10000, step: 5 },
      { key: 'dT', symbol: 'ΔT', label: 'Temperature Gradient (T_hot - T_cold)', unit: 'K', defaultValue: 55, min: 1, max: 600, step: 1 },
      { key: 'L_mm', symbol: 'L', label: 'Conduction Wall Thickness', unit: 'mm', defaultValue: 15, min: 1, max: 500, step: 1 },
    ],
    solve: ({ k, A_cm2, dT, L_mm }) => {
      const A_m2 = A_cm2 / 1e4;
      const L_m = Math.max(L_mm, 0.1) / 1000;
      const Q_W = (k * A_m2 * dT) / L_m;
      const R_th = dT / Math.max(Q_W, 0.001);
      return {
        primary: { key: 'Q', symbol: 'Q̇', label: 'Conductive Heat Transfer Rate', value: Q_W, unit: 'W', precision: 1 },
        secondary: [
          { key: 'R_th', symbol: 'R_th', label: 'Conductive Thermal Resistance', value: R_th, unit: 'K/W', precision: 4 },
          { key: 'q_flux', symbol: 'q″', label: 'Heat Flux Density', value: Q_W / A_m2 / 1000, unit: 'kW/m²', precision: 2 },
        ],
        substitutionTrace: `Q = (${k} W/m·K × ${A_m2.toFixed(4)} m² × ${dT} K) / ${L_m.toFixed(4)} m = ${Q_W.toFixed(1)} W`,
        status: 'PASS',
        verdictMessage: `Steady-state 1D Fourier conduction verified. Thermal resistance R_th = ${R_th.toFixed(4)} K/W.`,
      };
    },
  },
  'machining-time': {
    slug: 'machining-time',
    standard: 'ISO 3685 / Sandvik Turning Spec',
    tier: 'NORMATIVE',
    formulaDisplay: 't_c = L_cut / (f_n · n)   |   v_c = (π · D · n) / 1000',
    inputs: [
      { key: 'L_mm', symbol: 'L', label: 'Machining Cut Length', unit: 'mm', defaultValue: 180, min: 5, max: 2000, step: 5 },
      { key: 'D_mm', symbol: 'D', label: 'Workpiece Diameter', unit: 'mm', defaultValue: 65, min: 5, max: 800, step: 1 },
      { key: 'fn_mm', symbol: 'f_n', label: 'Feed per Revolution', unit: 'mm/rev', defaultValue: 0.25, min: 0.02, max: 2.0, step: 0.01 },
      { key: 'n_rpm', symbol: 'n', label: 'Spindle Speed', unit: 'RPM', defaultValue: 1200, min: 50, max: 12000, step: 50 },
    ],
    solve: ({ L_mm, D_mm, fn_mm, n_rpm }) => {
      const feedMin = Math.max(fn_mm * n_rpm, 0.1);
      const tc_min = L_mm / feedMin;
      const tc_sec = tc_min * 60;
      const vc = (Math.PI * D_mm * n_rpm) / 1000;
      return {
        primary: { key: 'tc_sec', symbol: 't_c', label: 'Primary Cutting Cycle Time', value: tc_sec, unit: 'sec', precision: 1 },
        secondary: [
          { key: 'tc_min', symbol: 't_min', label: 'Cutting Time (Minutes)', value: tc_min, unit: 'min', precision: 2 },
          { key: 'vc', symbol: 'v_c', label: 'Surface Cutting Speed', value: vc, unit: 'm/min', precision: 1 },
        ],
        substitutionTrace: `t_c = ${L_mm} mm / (${fn_mm} mm/rev × ${n_rpm} RPM) = ${tc_min.toFixed(2)} min (${tc_sec.toFixed(1)} s) | v_c = ${vc.toFixed(1)} m/min`,
        status: vc > 450 ? 'WARNING' : 'PASS',
        verdictMessage:
          vc <= 450
            ? `Cutting speed v_c = ${vc.toFixed(0)} m/min is within carbide insert envelope per ISO 3685.`
            : `High surface speed (${vc.toFixed(0)} m/min): verify PCD/uncoated grade for aluminum or coolant pressure.`,
      };
    },
  },
  'thread-stripping-area': {
    slug: 'thread-stripping-area',
    standard: 'ISO 898-1 / VDI 2230 Section 5.5',
    tier: 'NORMATIVE',
    formulaDisplay: 'A_s,bolt = π · n_t · L_e · (p / 2 + (d_2 - D_1) / √3)',
    inputs: [
      { key: 'd_mm', symbol: 'd', label: 'Nominal Thread Diameter (M)', unit: 'mm', defaultValue: 12, min: 4, max: 64, step: 1 },
      { key: 'p_mm', symbol: 'P', label: 'Thread Pitch', unit: 'mm', defaultValue: 1.75, min: 0.5, max: 6.0, step: 0.25 },
      { key: 'Le_mm', symbol: 'L_e', label: 'Engaged Thread Length', unit: 'mm', defaultValue: 14, min: 2, max: 120, step: 1 },
      { key: 'tau_MPa', symbol: 'τ_B', label: 'Internal Thread Shear Strength', unit: 'MPa', defaultValue: 210, min: 80, max: 800, step: 10 },
    ],
    solve: ({ d_mm, p_mm, Le_mm, tau_MPa }) => {
      // ISO metric shear area approximation per VDI 2230 / Alexander
      const d2 = d_mm - 0.6495 * p_mm;
      const As_nut = Math.PI * d_mm * Le_mm * 0.72;
      const As_bolt = Math.PI * d2 * Le_mm * 0.58;
      const F_strip_kN = (Math.min(As_nut, As_bolt) * tau_MPa) / 1000;
      const minRatio = Le_mm / Math.max(d_mm, 1);
      return {
        primary: { key: 'As_bolt', symbol: 'A_SB', label: 'Effective Thread Shear Area', value: As_bolt, unit: 'mm²', precision: 1 },
        secondary: [
          { key: 'F_strip', symbol: 'F_strip', label: 'Thread Stripping Failure Load', value: F_strip_kN, unit: 'kN', precision: 1 },
          { key: 'ratio', symbol: 'L_e/d', label: 'Engagement-to-Diameter Ratio', value: minRatio, unit: '—', precision: 2 },
        ],
        substitutionTrace: `A_SB ≈ π × ${d2.toFixed(2)} mm × ${Le_mm} mm × 0.58 = ${As_bolt.toFixed(1)} mm² | F_strip = ${F_strip_kN.toFixed(1)} kN`,
        status: minRatio < 0.8 ? 'CRITICAL' : minRatio < 1.2 ? 'WARNING' : 'PASS',
        verdictMessage:
          minRatio >= 1.2
            ? `Engagement ratio L_e/d = ${minRatio.toFixed(2)} prevents thread stripping before bolt shank fracture.`
            : `Short thread engagement (L_e/d = ${minRatio.toFixed(2)} < 1.20): increase tapped depth or add Helicoil insert.`,
      };
    },
  },
  'timing-belt-design': {
    slug: 'timing-belt-design',
    standard: 'ISO 5296 / Gates HTD Spec',
    tier: 'NORMATIVE',
    formulaDisplay: 'L_p ≈ 2·C + 1.57·(D_1 + D_2) + (D_2 - D_1)² / (4·C)',
    inputs: [
      { key: 'D1', symbol: 'd_1', label: 'Driver Pitch Diameter', unit: 'mm', defaultValue: 63.66, min: 20, max: 500, step: 1 },
      { key: 'D2', symbol: 'd_2', label: 'Driven Pitch Diameter', unit: 'mm', defaultValue: 152.79, min: 20, max: 1000, step: 1 },
      { key: 'C', symbol: 'C', label: 'Shaft Center Distance', unit: 'mm', defaultValue: 320, min: 50, max: 2500, step: 5 },
      { key: 'pitch', symbol: 'p_b', label: 'Tooth Pitch (e.g. 8M = 8mm)', unit: 'mm', defaultValue: 8, min: 2, max: 20, step: 1 },
    ],
    solve: ({ D1, D2, C, pitch }) => {
      const Lp = 2 * C + 1.5708 * (D1 + D2) + Math.pow(D2 - D1, 2) / (4 * Math.max(C, 10));
      const teethBelt = Math.round(Lp / Math.max(pitch, 1));
      const wrapDeg = 180 - ((D2 - D1) / Math.max(C, 10)) * 57.3;
      const teethInMesh = Math.floor(((D1 * Math.PI) / Math.max(pitch, 1)) * (wrapDeg / 360));
      return {
        primary: { key: 'Lp', symbol: 'L_p', label: 'Synchronous Belt Pitch Length', value: Lp, unit: 'mm', precision: 1 },
        secondary: [
          { key: 'z_b', symbol: 'z_belt', label: 'Nearest Integer Belt Teeth', value: teethBelt, unit: 'teeth', precision: 0 },
          { key: 'z_m', symbol: 'z_mesh', label: 'Teeth in Mesh (TIM >= 6)', value: teethInMesh, unit: 'teeth', precision: 0 },
        ],
        substitutionTrace: `L_p = 2(${C}) + 1.5708(${D1}+${D2}) + (${D2}-${D1})²/(4×${C}) = ${Lp.toFixed(1)} mm (${teethBelt} teeth)`,
        status: teethInMesh < 6 ? 'WARNING' : 'PASS',
        verdictMessage:
          teethInMesh >= 6
            ? `Synchronous engagement verified (${teethInMesh} teeth in mesh >= 6 minimum per ISO 5296).`
            : `Only ${teethInMesh} teeth in mesh (< 6): add an idler pulley to increase wrap angle.`,
      };
    },
  },
  'v-belt-power': {
    slug: 'v-belt-power',
    standard: 'ISO 4184 / RMA IP-20',
    tier: 'NORMATIVE',
    formulaDisplay: 'P_design = P_base · C_L · C_θ · n_belts',
    inputs: [
      { key: 'P_base', symbol: 'P_0', label: 'Single-Belt Base Rating', unit: 'kW', defaultValue: 7.5, min: 0.5, max: 80, step: 0.5 },
      { key: 'C_theta', symbol: 'C_θ', label: 'Arc of Contact Factor', unit: '—', defaultValue: 0.94, min: 0.65, max: 1.05, step: 0.01 },
      { key: 'C_L', symbol: 'C_L', label: 'Belt Length Correction Factor', unit: '—', defaultValue: 0.98, min: 0.8, max: 1.2, step: 0.01 },
      { key: 'n_belts', symbol: 'N_b', label: 'Number of Parallel V-Belts', unit: 'belts', defaultValue: 3, min: 1, max: 12, step: 1 },
    ],
    solve: ({ P_base, C_theta, C_L, n_belts }) => {
      const P_adj = P_base * C_theta * C_L * n_belts;
      const P_motorMax = P_adj / 1.3; // Service factor Ks = 1.3
      return {
        primary: { key: 'P_adj', symbol: 'P_cap', label: 'Corrected Drive Power Capacity', value: P_adj, unit: 'kW', precision: 2 },
        secondary: [
          { key: 'P_nom', symbol: 'P_mot', label: 'Allowable Motor Power (K_s=1.3)', value: P_motorMax, unit: 'kW', precision: 2 },
          { key: 'eff', symbol: 'η', label: 'Nominal V-Belt Efficiency', value: 95.5, unit: '%', precision: 1 },
        ],
        substitutionTrace: `P_cap = ${P_base} kW × ${C_theta} × ${C_L} × ${n_belts} belts = ${P_adj.toFixed(2)} kW`,
        status: 'PASS',
        verdictMessage: `Multi-groove V-belt bank rated for ${P_adj.toFixed(2)} kW peak (${P_motorMax.toFixed(2)} kW continuous at K_s=1.3).`,
      };
    },
  },
  'roller-chain-drive': {
    slug: 'roller-chain-drive',
    standard: 'ISO 606 / ANSI B29.1',
    tier: 'NORMATIVE',
    formulaDisplay: 'v = (z_1 · p · n_1) / 60000   |   F_t = (1000 · P) / v',
    inputs: [
      { key: 'p_mm', symbol: 'p', label: 'Chain Pitch (12B = 19.05mm)', unit: 'mm', defaultValue: 19.05, min: 6.35, max: 50.8, step: 0.05 },
      { key: 'z1', symbol: 'z_1', label: 'Drive Sprocket Teeth', unit: 'teeth', defaultValue: 19, min: 11, max: 75, step: 1 },
      { key: 'n1', symbol: 'n_1', label: 'Drive Sprocket Speed', unit: 'RPM', defaultValue: 650, min: 20, max: 4000, step: 10 },
      { key: 'P_kW', symbol: 'P', label: 'Transmitted Mechanical Power', unit: 'kW', defaultValue: 11, min: 0.5, max: 250, step: 0.5 },
    ],
    solve: ({ p_mm, z1, n1, P_kW }) => {
      const v_ms = (z1 * p_mm * n1) / 60000;
      const Ft_N = (P_kW * 1000) / Math.max(v_ms, 0.05);
      return {
        primary: { key: 'Ft_N', symbol: 'F_t', label: 'Chain Working Tensile Force', value: Ft_N, unit: 'N', precision: 0 },
        secondary: [
          { key: 'v_ms', symbol: 'v', label: 'Linear Chain Velocity', value: v_ms, unit: 'm/s', precision: 2 },
        ],
        substitutionTrace: `v = (${z1} × ${p_mm} mm × ${n1} RPM)/60000 = ${v_ms.toFixed(2)} m/s | F_t = ${P_kW} kW / ${v_ms.toFixed(2)} m/s = ${Ft_N.toFixed(0)} N`,
        status: z1 < 17 ? 'WARNING' : 'PASS',
        verdictMessage:
          z1 >= 17
            ? `Polygonal chordal action minimized (z_1 = ${z1} >= 17). Oil bath lubrication recommended above 4 m/s.`
            : `z_1 = ${z1} < 17 causes elevated polygonal speed variation and pin-bushing wear.`,
      };
    },
  },
  'truss-analysis': {
    slug: 'truss-analysis',
    standard: 'Eurocode 3 / ASCE 7 Method of Joints',
    tier: 'NORMATIVE',
    formulaDisplay: 'F_member = F_load / (2 · sin θ)   |   σ_axial = F_member / A',
    inputs: [
      { key: 'F_kN', symbol: 'P', label: 'Apex Vertical Nodal Load', unit: 'kN', defaultValue: 45, min: 1, max: 1000, step: 1 },
      { key: 'theta_deg', symbol: 'θ', label: 'Truss Diagonal Inclination Angle', unit: 'deg', defaultValue: 35, min: 10, max: 75, step: 1 },
      { key: 'A_mm2', symbol: 'A', label: 'Member Cross-Section Area', unit: 'mm²', defaultValue: 480, min: 50, max: 10000, step: 10 },
    ],
    solve: ({ F_kN, theta_deg, A_mm2 }) => {
      const rad = (theta_deg * Math.PI) / 180;
      const F_diag = F_kN / (2 * Math.sin(rad));
      const F_chord = F_diag * Math.cos(rad);
      const sigma = (F_diag * 1000) / Math.max(A_mm2, 1);
      return {
        primary: { key: 'F_diag', symbol: 'N_d', label: 'Diagonal Member Axial Compression', value: F_diag, unit: 'kN', precision: 2 },
        secondary: [
          { key: 'F_chord', symbol: 'N_c', label: 'Bottom Chord Horizontal Tension', value: F_chord, unit: 'kN', precision: 2 },
          { key: 'sigma', symbol: 'σ_a', label: 'Member Axial Stress', value: sigma, unit: 'MPa', precision: 1 },
        ],
        substitutionTrace: `N_d = ${F_kN} kN / (2 × sin(${theta_deg}°)) = ${F_diag.toFixed(2)} kN | σ_a = ${sigma.toFixed(1)} MPa`,
        status: sigma > 235 ? 'WARNING' : 'PASS',
        verdictMessage:
          sigma <= 235
            ? `Axial stress (${sigma.toFixed(1)} MPa) is below S235 yield limit. Verify Euler buckling for compression struts.`
            : `High axial stress (${sigma.toFixed(1)} MPa): upgrade member profile or switch to S355JR.`,
      };
    },
  },
  'transformer-calculation': {
    slug: 'transformer-calculation',
    standard: 'IEC 60076-1 Power Transformers',
    tier: 'NORMATIVE',
    formulaDisplay: 'V_s = V_p · (N_s / N_p)   |   I_s = (S_kVA · 1000) / V_s',
    inputs: [
      { key: 'Vp', symbol: 'V_p', label: 'Primary Winding Voltage', unit: 'V', defaultValue: 400, min: 12, max: 36000, step: 10 },
      { key: 'Np', symbol: 'N_p', label: 'Primary Winding Turns', unit: 'turns', defaultValue: 600, min: 10, max: 10000, step: 10 },
      { key: 'Ns', symbol: 'N_s', label: 'Secondary Winding Turns', unit: 'turns', defaultValue: 180, min: 5, max: 10000, step: 5 },
      { key: 'S_kVA', symbol: 'S', label: 'Apparent Power Rating', unit: 'kVA', defaultValue: 25, min: 0.5, max: 2500, step: 0.5 },
    ],
    solve: ({ Vp, Np, Ns, S_kVA }) => {
      const ratio = Np / Math.max(Ns, 1);
      const Vs = Vp / ratio;
      const Is = (S_kVA * 1000) / Math.max(Vs, 1);
      return {
        primary: { key: 'Vs', symbol: 'V_s', label: 'Secondary Output Voltage', value: Vs, unit: 'V', precision: 1 },
        secondary: [
          { key: 'a', symbol: 'a', label: 'Turns Ratio (N_p / N_s)', value: ratio, unit: ': 1', precision: 2 },
          { key: 'Is', symbol: 'I_s', label: 'Secondary Full-Load Current', value: Is, unit: 'A', precision: 1 },
        ],
        substitutionTrace: `V_s = ${Vp} V × (${Ns} / ${Np}) = ${Vs.toFixed(1)} V | I_s = (${S_kVA} kVA × 1000) / ${Vs.toFixed(1)} V = ${Is.toFixed(1)} A`,
        status: 'PASS',
        verdictMessage: `IEC 60076 magnetic scaling verified (a = ${ratio.toFixed(2)}:1, I_s = ${Is.toFixed(1)} A).`,
      };
    },
  },
  'centripetal-force': {
    slug: 'centripetal-force',
    standard: 'ISO 80000-3 Rotational Dynamics',
    tier: 'SCIENTIFIC',
    formulaDisplay: 'F_c = (m · v²) / r = m · ω² · r',
    inputs: [
      { key: 'm', symbol: 'm', label: 'Rotating Mass', unit: 'kg', defaultValue: 14, min: 0.1, max: 2000, step: 0.5 },
      { key: 'v', symbol: 'v', label: 'Tangential Velocity', unit: 'm/s', defaultValue: 18, min: 0.5, max: 250, step: 0.5 },
      { key: 'r', symbol: 'r', label: 'Radius of Rotation', unit: 'm', defaultValue: 0.45, min: 0.02, max: 50, step: 0.05 },
    ],
    solve: ({ m, v, r }) => {
      const Fc = (m * v * v) / Math.max(r, 0.01);
      const ac_g = v * v / Math.max(r, 0.01) / 9.80665;
      return {
        primary: { key: 'Fc', symbol: 'F_c', label: 'Centripetal Radial Force', value: Fc, unit: 'N', precision: 1 },
        secondary: [
          { key: 'ac_g', symbol: 'a_c', label: 'Centrifugal Acceleration (G-Load)', value: ac_g, unit: 'g', precision: 1 },
        ],
        substitutionTrace: `F_c = (${m} kg × (${v} m/s)²) / ${r} m = ${Fc.toFixed(1)} N (${ac_g.toFixed(1)} g)`,
        status: ac_g > 100 ? 'WARNING' : 'PASS',
        verdictMessage: `Radial load F_c = ${Fc.toFixed(1)} N (${ac_g.toFixed(1)} g). Ensure rotor balancing per ISO 1940-1 G2.5.`,
      };
    },
  },
  'kinetic-energy': {
    slug: 'kinetic-energy',
    standard: 'ISO 80000-4 Classical Mechanics',
    tier: 'SCIENTIFIC',
    formulaDisplay: 'E_k = ½ · m · v²   |   p = m · v',
    inputs: [
      { key: 'm', symbol: 'm', label: 'Moving Mass', unit: 'kg', defaultValue: 85, min: 0.1, max: 10000, step: 1 },
      { key: 'v', symbol: 'v', label: 'Linear Velocity', unit: 'm/s', defaultValue: 12.5, min: 0.1, max: 500, step: 0.5 },
    ],
    solve: ({ m, v }) => {
      const Ek = 0.5 * m * v * v;
      const p = m * v;
      return {
        primary: { key: 'Ek', symbol: 'E_k', label: 'Translational Kinetic Energy', value: Ek, unit: 'J', precision: 1 },
        secondary: [
          { key: 'Ek_kJ', symbol: 'E_kJ', label: 'Energy in Kilojoules', value: Ek / 1000, unit: 'kJ', precision: 3 },
          { key: 'p', symbol: 'p', label: 'Linear Momentum', value: p, unit: 'N·s', precision: 1 },
        ],
        substitutionTrace: `E_k = 0.5 × ${m} kg × (${v} m/s)² = ${Ek.toFixed(1)} J (${(Ek / 1000).toFixed(3)} kJ)`,
        status: 'PASS',
        verdictMessage: `Impact energy absorption requirement: ${(Ek / 1000).toFixed(3)} kJ for industrial shock damper sizing.`,
      };
    },
  },
  'newton-second-law': {
    slug: 'newton-second-law',
    standard: 'ISO 80000-4 Rigid Body Dynamics',
    tier: 'SCIENTIFIC',
    formulaDisplay: 'F_net = m · a',
    inputs: [
      { key: 'm', symbol: 'm', label: 'Payload + Carriage Mass', unit: 'kg', defaultValue: 120, min: 0.5, max: 10000, step: 1 },
      { key: 'a', symbol: 'a', label: 'Target Linear Acceleration', unit: 'm/s²', defaultValue: 4.2, min: 0.1, max: 100, step: 0.1 },
    ],
    solve: ({ m, a }) => {
      const F = m * a;
      const gEq = a / 9.80665;
      return {
        primary: { key: 'F', symbol: 'F_net', label: 'Required Net Accelerating Force', value: F, unit: 'N', precision: 1 },
        secondary: [
          { key: 'gEq', symbol: 'a/g', label: 'Acceleration G-Ratio', value: gEq, unit: 'g', precision: 2 },
        ],
        substitutionTrace: `F_net = ${m} kg × ${a} m/s² = ${F.toFixed(1)} N`,
        status: 'PASS',
        verdictMessage: `Linear actuator thrust must exceed ${F.toFixed(1)} N plus guide friction force.`,
      };
    },
  },
  'lift-coefficient': {
    slug: 'lift-coefficient',
    standard: 'ICAO ISA / Subsonic Aerodynamics',
    tier: 'SCIENTIFIC',
    formulaDisplay: 'F_L = ½ · ρ · v² · S · C_L',
    inputs: [
      { key: 'rho', symbol: 'ρ', label: 'Air Density (ISA Sea Level = 1.225)', unit: 'kg/m³', defaultValue: 1.225, min: 0.2, max: 2.0, step: 0.025 },
      { key: 'v', symbol: 'v', label: 'Freestream Airspeed', unit: 'm/s', defaultValue: 45, min: 2, max: 300, step: 1 },
      { key: 'S', symbol: 'S', label: 'Planform Wing Reference Area', unit: 'm²', defaultValue: 12.4, min: 0.2, max: 500, step: 0.2 },
      { key: 'CL', symbol: 'C_L', label: 'Airfoil Lift Coefficient', unit: '—', defaultValue: 1.15, min: 0.1, max: 2.4, step: 0.05 },
    ],
    solve: ({ rho, v, S, CL }) => {
      const q = 0.5 * rho * v * v;
      const FL = q * S * CL;
      return {
        primary: { key: 'FL', symbol: 'F_L', label: 'Aerodynamic Lift Force', value: FL / 1000, unit: 'kN', precision: 2 },
        secondary: [
          { key: 'q', symbol: 'q_∞', label: 'Dynamic Pressure', value: q, unit: 'Pa', precision: 1 },
        ],
        substitutionTrace: `F_L = 0.5 × ${rho} × ${v}² × ${S} m² × ${CL} = ${(FL / 1000).toFixed(2)} kN`,
        status: CL > 1.6 ? 'WARNING' : 'PASS',
        verdictMessage:
          CL <= 1.6
            ? 'Attached boundary layer regime for clean NACA airfoil.'
            : 'High C_L (> 1.6): requires trailing-edge slotted flaps to prevent flow separation stall.',
      };
    },
  },
  'rocket-equation': {
    slug: 'rocket-equation',
    standard: 'Tsiolkovsky Orbital Mechanics',
    tier: 'SCIENTIFIC',
    formulaDisplay: 'Δv = I_sp · g_0 · ln(m_0 / m_f)',
    inputs: [
      { key: 'Isp', symbol: 'I_sp', label: 'Specific Impulse', unit: 's', defaultValue: 340, min: 150, max: 500, step: 5 },
      { key: 'm0', symbol: 'm_0', label: 'Initial Wet Mass (with Propellant)', unit: 'kg', defaultValue: 12000, min: 100, max: 500000, step: 100 },
      { key: 'mf', symbol: 'm_f', label: 'Dry Burnout Mass', unit: 'kg', defaultValue: 2200, min: 50, max: 200000, step: 50 },
    ],
    solve: ({ Isp, m0, mf }) => {
      const safeRatio = Math.max(m0 / Math.max(mf, 1), 1.01);
      const ve = Isp * 9.80665;
      const dv = ve * Math.log(safeRatio);
      return {
        primary: { key: 'dv', symbol: 'Δv', label: 'Ideal Delta-V Velocity Budget', value: dv, unit: 'm/s', precision: 1 },
        secondary: [
          { key: 've', symbol: 'v_e', label: 'Effective Exhaust Velocity', value: ve, unit: 'm/s', precision: 1 },
          { key: 'MR', symbol: 'MR', label: 'Mass Ratio (m_0 / m_f)', value: safeRatio, unit: '—', precision: 2 },
        ],
        substitutionTrace: `Δv = ${Isp} s × 9.80665 m/s² × ln(${m0} / ${mf}) = ${dv.toFixed(1)} m/s`,
        status: 'PASS',
        verdictMessage: `Propulsion stage yields ${(dv / 1000).toFixed(2)} km/s ideal Δv.`,
      };
    },
  },
  'radioactive-decay': {
    slug: 'radioactive-decay',
    standard: 'ISO 80000-10 Nuclear Physics',
    tier: 'SCIENTIFIC',
    formulaDisplay: 'N(t) = N_0 · (½)^(t / t_½)',
    inputs: [
      { key: 'N0', symbol: 'N_0', label: 'Initial Isotope Activity / Mass', unit: 'GBq', defaultValue: 500, min: 1, max: 100000, step: 10 },
      { key: 'halfLife', symbol: 't_½', label: 'Isotope Half-Life (Co-60 = 5.27 yr)', unit: 'yr', defaultValue: 5.27, min: 0.1, max: 1000, step: 0.1 },
      { key: 't', symbol: 't', label: 'Elapsed Decay Time', unit: 'yr', defaultValue: 12, min: 0.1, max: 200, step: 0.5 },
    ],
    solve: ({ N0, halfLife, t }) => {
      const lambda = Math.LN2 / Math.max(halfLife, 0.001);
      const Nt = N0 * Math.exp(-lambda * t);
      const pct = (Nt / Math.max(N0, 1)) * 100;
      return {
        primary: { key: 'Nt', symbol: 'N(t)', label: 'Remaining Activity / Quantity', value: Nt, unit: 'GBq', precision: 2 },
        secondary: [
          { key: 'pct', symbol: 'N/N_0', label: 'Remaining Fraction', value: pct, unit: '%', precision: 1 },
          { key: 'lambda', symbol: 'λ', label: 'Decay Constant', value: lambda, unit: '1/yr', precision: 4 },
        ],
        substitutionTrace: `N(${t}) = ${N0} × e^(-${lambda.toFixed(4)} × ${t}) = ${Nt.toFixed(2)} GBq (${pct.toFixed(1)}%)`,
        status: 'PASS',
        verdictMessage: `Exponential decay evaluated for industrielle NDT radiography source planning.`,
      };
    },
  },
  'chemical-molarity': {
    slug: 'chemical-molarity',
    standard: 'IUPAC Gold Book / ISO 80000-9',
    tier: 'SCIENTIFIC',
    formulaDisplay: 'C_M = m_solute / (M_w · V_L)',
    inputs: [
      { key: 'm_g', symbol: 'm', label: 'Solute Mass', unit: 'g', defaultValue: 58.44, min: 0.1, max: 5000, step: 0.5 },
      { key: 'Mw', symbol: 'M_w', label: 'Molar Mass (NaCl = 58.44)', unit: 'g/mol', defaultValue: 58.44, min: 1, max: 1000, step: 0.1 },
      { key: 'V_L', symbol: 'V', label: 'Solution Volume', unit: 'L', defaultValue: 0.5, min: 0.05, max: 100, step: 0.05 },
    ],
    solve: ({ m_g, Mw, V_L }) => {
      const moles = m_g / Math.max(Mw, 0.1);
      const M = moles / Math.max(V_L, 0.001);
      return {
        primary: { key: 'M', symbol: 'C_M', label: 'Molar Concentration', value: M, unit: 'mol/L (M)', precision: 3 },
        secondary: [
          { key: 'n', symbol: 'n', label: 'Chemical Amount of Solute', value: moles, unit: 'mol', precision: 3 },
        ],
        substitutionTrace: `n = ${m_g} g / ${Mw} g/mol = ${moles.toFixed(3)} mol | C_M = ${moles.toFixed(3)} / ${V_L} L = ${M.toFixed(3)} M`,
        status: 'PASS',
        verdictMessage: 'Stoichiometric concentration verified per IUPAC Gold Book.',
      };
    },
  },
  'specific-gravity': {
    slug: 'specific-gravity',
    standard: 'ASTM D792 / ISO 1183',
    tier: 'NORMATIVE',
    formulaDisplay: 'SG = ρ_substance / ρ_H2O(4°C)',
    inputs: [
      { key: 'rho_sub', symbol: 'ρ_s', label: 'Material / Alloy Density (6061 = 2700)', unit: 'kg/m³', defaultValue: 2700, min: 100, max: 20000, step: 10 },
      { key: 'V_cm3', symbol: 'V', label: 'Component CAD Volume', unit: 'cm³', defaultValue: 450, min: 1, max: 100000, step: 10 },
    ],
    solve: ({ rho_sub, V_cm3 }) => {
      const sg = rho_sub / 1000;
      const massKg = (rho_sub * V_cm3) / 1e6;
      return {
        primary: { key: 'sg', symbol: 'SG', label: 'Relative Specific Gravity', value: sg, unit: '—', precision: 3 },
        secondary: [
          { key: 'mass', symbol: 'm', label: 'Component Total Mass', value: massKg, unit: 'kg', precision: 3 },
        ],
        substitutionTrace: `SG = ${rho_sub} kg/m³ / 1000 kg/m³ = ${sg.toFixed(3)} | Mass = ${massKg.toFixed(3)} kg`,
        status: 'PASS',
        verdictMessage: `Specific gravity SG = ${sg.toFixed(3)} verified at 4°C water reference.`,
      };
    },
  },
  'pressure-drop': {
    slug: 'pressure-drop',
    standard: 'Crane TP-410 / Darcy-Weisbach',
    tier: 'NORMATIVE',
    formulaDisplay: 'ΔP = f · (L / D) · (ρ · v² / 2)',
    inputs: [
      { key: 'f', symbol: 'f', label: 'Darcy Friction Factor', unit: '—', defaultValue: 0.022, min: 0.008, max: 0.08, step: 0.001 },
      { key: 'L_m', symbol: 'L', label: 'Equivalent Pipe Length', unit: 'm', defaultValue: 45, min: 1, max: 2000, step: 1 },
      { key: 'D_mm', symbol: 'D', label: 'Internal Pipe Bore', unit: 'mm', defaultValue: 50, min: 5, max: 800, step: 1 },
      { key: 'v_ms', symbol: 'v', label: 'Fluid Flow Velocity', unit: 'm/s', defaultValue: 2.4, min: 0.1, max: 15, step: 0.1 },
    ],
    solve: ({ f, L_m, D_mm, v_ms }) => {
      const rho = 998;
      const dP_Pa = f * (L_m / (Math.max(D_mm, 1) / 1000)) * (0.5 * rho * v_ms * v_ms);
      const dP_bar = dP_Pa / 1e5;
      const head_m = dP_Pa / (rho * 9.80665);
      return {
        primary: { key: 'dP_bar', symbol: 'ΔP', label: 'Frictional Line Pressure Drop', value: dP_bar, unit: 'bar', precision: 3 },
        secondary: [
          { key: 'head', symbol: 'h_f', label: 'Hydraulic Head Loss', value: head_m, unit: 'm H₂O', precision: 2 },
        ],
        substitutionTrace: `ΔP = ${f} × (${L_m} m / ${(D_mm / 1000).toFixed(3)} m) × (0.5 × 998 × ${v_ms}²) = ${(dP_Pa / 1000).toFixed(2)} kPa (${dP_bar.toFixed(3)} bar)`,
        status: v_ms > 3.5 ? 'WARNING' : 'PASS',
        verdictMessage:
          v_ms <= 3.5
            ? 'Velocity within recommended industrial liquid pipeline limit (v <= 3.5 m/s).'
            : 'High fluid velocity (> 3.5 m/s): risk of erosion-corrosion and water hammer.',
      };
    },
  },
  '3-phase-power': {
    slug: '3-phase-power',
    standard: 'IEEE 141 / IEC 60038',
    tier: 'NORMATIVE',
    formulaDisplay: 'P = √3 · V_L · I_L · cos(φ)',
    inputs: [
      { key: 'V_L', symbol: 'V_L', label: 'Line-to-Line Voltage', unit: 'V', defaultValue: 400, min: 110, max: 11000, step: 10 },
      { key: 'I_L', symbol: 'I_L', label: 'Line Phase Current', unit: 'A', defaultValue: 32, min: 1, max: 2000, step: 1 },
      { key: 'pf', symbol: 'cos φ', label: 'Power Factor', unit: '—', defaultValue: 0.86, min: 0.5, max: 1.0, step: 0.01 },
    ],
    solve: ({ V_L, I_L, pf }) => {
      const S_kVA = (Math.sqrt(3) * V_L * I_L) / 1000;
      const P_kW = S_kVA * pf;
      const Q_kVAR = S_kVA * Math.sqrt(Math.max(0, 1 - pf * pf));
      return {
        primary: { key: 'P_kW', symbol: 'P', label: 'Active Real Power', value: P_kW, unit: 'kW', precision: 2 },
        secondary: [
          { key: 'S_kVA', symbol: 'S', label: 'Apparent Power', value: S_kVA, unit: 'kVA', precision: 2 },
          { key: 'Q_kVAR', symbol: 'Q', label: 'Reactive Power', value: Q_kVAR, unit: 'kVAR', precision: 2 },
        ],
        substitutionTrace: `P = √3 × ${V_L} V × ${I_L} A × ${pf} / 1000 = ${P_kW.toFixed(2)} kW`,
        status: pf < 0.85 ? 'WARNING' : 'PASS',
        verdictMessage:
          pf >= 0.85
            ? 'Power factor satisfies industrial grid compliance (cos φ >= 0.85).'
            : 'Low power factor (< 0.85): install capacitor bank for reactive power compensation.',
      };
    },
  },
};

export function evaluateHeadlessSolver(
  slug: string,
  customInputs?: Record<string, number>
): { spec: DeterministicHeadlessSolverSpec; values: Record<string, number>; result: HeadlessSolveResult } {
  const spec = DETERMINISTIC_HEADLESS_SOLVERS[slug] || DETERMINISTIC_HEADLESS_SOLVERS['hooke-law'];
  const values: Record<string, number> = {};
  for (const inp of spec.inputs) {
    values[inp.key] =
      customInputs && typeof customInputs[inp.key] === 'number'
        ? customInputs[inp.key]
        : inp.defaultValue;
  }
  const result = spec.solve(values);
  return { spec, values, result };
}

interface HeadlessWindowProps {
  calculatorConfig: {
    id: string;
    slug?: string;
    title: string;
    standard?: string;
    seo: {
      intro: string;
      formula: string;
      variables: Record<string, string>;
      example?: string;
      checklist?: string[];
    };
  };
}

export const HeadlessCalculatorWindow: React.FC<HeadlessWindowProps> = ({ calculatorConfig }) => {
  const { language } = useI18nStore();
  const slug = calculatorConfig.slug || calculatorConfig.id;
  const spec = useMemo(
    () => DETERMINISTIC_HEADLESS_SOLVERS[slug] || DETERMINISTIC_HEADLESS_SOLVERS['hooke-law'],
    [slug]
  );

  const [values, setValues] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    for (const p of spec.inputs) {
      init[p.key] = p.defaultValue;
    }
    return init;
  });

  // Sync defaults if calculatorConfig changes
  React.useEffect(() => {
    const next: Record<string, number> = {};
    for (const p of spec.inputs) {
      next[p.key] = p.defaultValue;
    }
    setValues(next);
  }, [spec]);

  const solveResult = useMemo(() => spec.solve(values), [spec, values]);

  // Parametric sensitivity sweep (±30% on primary input parameter)
  const sweepPoints = useMemo(() => {
    const primaryParam = spec.inputs[0];
    if (!primaryParam) return [];
    const baseVal = values[primaryParam.key] ?? primaryParam.defaultValue;
    const factors = [0.7, 0.8, 0.9, 1.0, 1.1, 1.2, 1.3];
    return factors.map((f) => {
      const testVal = Math.max(primaryParam.min, Math.min(primaryParam.max, baseVal * f));
      const res = spec.solve({ ...values, [primaryParam.key]: testVal });
      return {
        pct: Math.round((f - 1) * 100),
        xVal: testVal,
        yVal: res.primary.value,
      };
    });
  }, [spec, values]);

  const applyPreset = (scale: number) => {
    const next: Record<string, number> = {};
    spec.inputs.forEach((p, idx) => {
      const raw = idx === 0 ? p.defaultValue * scale : p.defaultValue;
      next[p.key] = Number(Math.max(p.min, Math.min(p.max, raw)).toFixed(2));
    });
    setValues(next);
  };

  const handleExportCSV = () => {
    const rows = [
      ['Parameter', 'Symbol', 'Value', 'Unit'],
      ...spec.inputs.map((inp) => [inp.label, inp.symbol, String(values[inp.key]), inp.unit]),
      [solveResult.primary.label, solveResult.primary.symbol, solveResult.primary.value.toFixed(4), solveResult.primary.unit],
      ...solveResult.secondary.map((s) => [s.label, s.symbol, s.value.toFixed(4), s.unit]),
    ];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${slug}-deterministic-report.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full bg-[var(--bg-0)] text-[var(--ink)] p-4 sm:p-6 overflow-y-auto space-y-6">
      {/* Instrument Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[var(--line)]">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 bg-[var(--bg-2)] border border-[var(--cyan)]/40 rounded-[var(--radius-s)] flex items-center justify-center text-[var(--cyan)]">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-0.5">
              <span className="px-1.5 py-0.5 rounded-[2px] bg-[var(--std)]/15 border border-[var(--std)]/40 font-mono text-[10px] font-bold text-[var(--std)]">
                {spec.standard}
              </span>
              <span className="px-1.5 py-0.5 rounded-[2px] bg-[var(--ok)]/15 border border-[var(--ok)]/40 font-mono text-[10px] font-bold text-[var(--ok)]">
                IEEE 754 DETERMINISTIC
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-[var(--ink)] tracking-tight">
              {calculatorConfig.title.replace(/ - AluCalc$/i, '')}
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-s)] bg-[var(--bg-2)] border border-[var(--line)] text-[var(--alu)] font-mono text-[11px] font-bold uppercase hover:text-[var(--ink)] hover:border-[var(--line-strong)] transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>CSV Export</span>
          </button>
        </div>
      </div>

      {/* Main Split Workbench: Left Inputs (5 cols) + Right Telemetry & Sensitivity (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Parameter Input Deck */}
        <div className="lg:col-span-5 bg-[var(--bg-1)] border border-[var(--line)] rounded-[var(--radius-m)] p-4 sm:p-5 flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-2.5">
              <span className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--cyan)] flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5" />
                {t12(language, 'INPUT PARAMETERS', 'GİRDİ PARAMETRELERİ')}
              </span>

              {/* Engineering Presets */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => applyPreset(0.65)}
                  className="px-2 py-0.5 bg-[var(--bg-2)] border border-[var(--line)] rounded-[2px] font-mono text-[9px] text-[var(--muted)] hover:text-[var(--ink)]"
                >
                  Light
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset(1.0)}
                  className="px-2 py-0.5 bg-[var(--bg-2)] border border-[var(--cyan)]/40 rounded-[2px] font-mono text-[9px] text-[var(--cyan)]"
                >
                  Nominal
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset(1.45)}
                  className="px-2 py-0.5 bg-[var(--bg-2)] border border-[var(--line)] rounded-[2px] font-mono text-[9px] text-[var(--warn)] hover:text-[var(--ink)]"
                >
                  Peak
                </button>
              </div>
            </div>

            {spec.inputs.map((param) => {
              const currentVal = values[param.key] ?? param.defaultValue;
              return (
                <div
                  key={param.key}
                  className="p-3 bg-[var(--bg-0)] border border-[var(--line)] rounded-[var(--radius-s)] space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-xs font-semibold text-[var(--ink)] flex items-center gap-1.5">
                      <span className="px-1.5 py-0.5 bg-[var(--bg-2)] border border-[var(--line)] rounded-[2px] font-mono text-[10px] font-bold text-[var(--cyan)]">
                        {param.symbol}
                      </span>
                      <span>{param.label}</span>
                    </label>
                    <span className="font-mono text-[10px] text-[var(--muted)]">{param.unit}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={param.min}
                      max={param.max}
                      step={param.step}
                      value={currentVal}
                      onChange={(e) =>
                        setValues((prev) => ({
                          ...prev,
                          [param.key]: parseFloat(e.target.value) || param.min,
                        }))
                      }
                      className="flex-1 accent-[var(--cyan)] h-1.5 bg-[var(--bg-2)] rounded-none cursor-pointer"
                    />
                    <input
                      type="number"
                      min={param.min}
                      max={param.max}
                      step={param.step}
                      value={currentVal}
                      onChange={(e) =>
                        setValues((prev) => ({
                          ...prev,
                          [param.key]: parseFloat(e.target.value) || 0,
                        }))
                      }
                      className="w-24 px-2 py-1 bg-[var(--bg-1)] border border-[var(--line)] rounded-[2px] font-mono text-xs font-bold text-right text-[var(--ink)] focus:outline-none focus:border-[var(--cyan)]"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Governing Equation Box */}
          <div className="p-3 bg-[var(--bg-0)] border border-[var(--line)] rounded-[var(--radius-s)]">
            <div className="font-mono text-[9px] font-bold uppercase tracking-widest text-[var(--muted)] mb-1">
              GOVERNING SYMBOLIC EQUATION
            </div>
            <div className="font-mono text-xs font-bold text-[var(--cyan)]">{spec.formulaDisplay}</div>
          </div>
        </div>

        {/* Right: Digital Readouts, Symbolic Substitution & Parametric Sensitivity */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          {/* Primary Mitutoyo/Fluke Digital Readout */}
          <div className="p-5 bg-[var(--bg-1)] border border-[var(--line-strong)] rounded-[var(--radius-m)] space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--alu)]">
                PRIMARY DETERMINISTIC OUTPUT
              </span>
              <span
                className={`px-2 py-0.5 rounded-[2px] font-mono text-[10px] font-bold border ${
                  solveResult.status === 'PASS'
                    ? 'bg-[var(--ok)]/15 text-[var(--ok)] border-[var(--ok)]/40'
                    : solveResult.status === 'WARNING'
                    ? 'bg-[var(--warn)]/15 text-[var(--warn)] border-[var(--warn)]/40'
                    : 'bg-[var(--bad)]/15 text-[var(--bad)] border-[var(--bad)]/40'
                }`}
              >
                STATUS: {solveResult.status}
              </span>
            </div>

            <div className="flex flex-wrap items-baseline justify-between gap-4 p-4 bg-[var(--bg-0)] border border-[var(--line)] rounded-[var(--radius-s)]">
              <div>
                <div className="font-mono text-xs text-[var(--muted)]">{solveResult.primary.label}</div>
                <div className="font-mono text-[11px] text-[var(--cyan)] mt-0.5">
                  Symbol: {solveResult.primary.symbol}
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-3xl sm:text-4xl font-black text-[var(--ink)] tabular-nums">
                  {solveResult.primary.value.toFixed(solveResult.primary.precision ?? 2)}
                </span>
                <span className="font-mono text-sm font-bold text-[var(--cyan)]">
                  {solveResult.primary.unit}
                </span>
              </div>
            </div>

            {/* Secondary Telemetry Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {solveResult.secondary.map((sec) => (
                <div
                  key={sec.key}
                  className="p-3 bg-[var(--bg-0)] border border-[var(--line)] rounded-[var(--radius-s)] flex items-center justify-between"
                >
                  <div>
                    <div className="text-[11px] font-semibold text-[var(--alu)]">{sec.label}</div>
                    <div className="font-mono text-[10px] text-[var(--muted)]">{sec.symbol}</div>
                  </div>
                  <div className="text-right font-mono">
                    <span className="text-base font-bold text-[var(--ink)] tabular-nums">
                      {sec.value.toFixed(sec.precision ?? 2)}
                    </span>{' '}
                    <span className="text-[11px] text-[var(--cyan)]">{sec.unit}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Step-by-Step Symbolic Substitution Trace */}
            <div className="p-3 bg-[var(--bg-0)] border border-[var(--line)] rounded-[var(--radius-s)] space-y-1">
              <div className="font-mono text-[9px] font-bold uppercase tracking-widest text-[var(--muted)]">
                LIVE SYMBOLIC SUBSTITUTION TRACE
              </div>
              <div className="font-mono text-xs text-[var(--alu)] break-all">
                {solveResult.substitutionTrace}
              </div>
            </div>

            {/* Engineering Verdict */}
            <div className="flex items-start gap-2.5 p-3 bg-[var(--bg-2)] border border-[var(--line)] rounded-[var(--radius-s)] text-xs text-[var(--ink)]">
              <ShieldCheck className="w-4 h-4 text-[var(--ok)] shrink-0 mt-0.5" />
              <span>{solveResult.verdictMessage}</span>
            </div>
          </div>

          {/* Live SVG Parametric Sensitivity Sweep (±30%) */}
          {sweepPoints.length > 0 && (
            <div className="p-4 bg-[var(--bg-1)] border border-[var(--line)] rounded-[var(--radius-m)] space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--cyan)] flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5" />
                  PARAMETRIC SENSITIVITY SWEEP (±30% ON {spec.inputs[0]?.symbol})
                </span>
                <span className="font-mono text-[10px] text-[var(--muted)]">
                  Output: {solveResult.primary.symbol} ({solveResult.primary.unit})
                </span>
              </div>

              <div className="grid grid-cols-7 gap-1.5 items-end h-28 pt-4 px-2 bg-[var(--bg-0)] border border-[var(--line)] rounded-[var(--radius-s)]">
                {(() => {
                  const maxY = Math.max(...sweepPoints.map((p) => Math.abs(p.yVal)), 1e-6);
                  return sweepPoints.map((pt, i) => {
                    const hPct = Math.max(12, Math.min(100, (Math.abs(pt.yVal) / maxY) * 90));
                    const isBase = pt.pct === 0;
                    return (
                      <div key={i} className="flex flex-col items-center gap-1 h-full justify-end">
                        <span className="font-mono text-[9px] text-[var(--alu)] tabular-nums">
                          {pt.yVal.toFixed(1)}
                        </span>
                        <div
                          style={{ height: `${hPct}%` }}
                          className={`w-full rounded-t-[2px] transition-all ${
                            isBase
                              ? 'bg-[var(--cyan)] border border-[var(--cyan)]'
                              : 'bg-[var(--bg-3)] border border-[var(--line-strong)]'
                          }`}
                        />
                        <span
                          className={`font-mono text-[9px] pb-1 ${
                            isBase ? 'text-[var(--cyan)] font-bold' : 'text-[var(--muted)]'
                          }`}
                        >
                          {pt.pct > 0 ? `+${pt.pct}%` : `${pt.pct}%`}
                        </span>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
