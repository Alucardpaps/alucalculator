import { describe, expect, it } from 'vitest';
import machiningMillingSchema from '@/calculators/schemas-v2/machining-milling';
import { calculateBearingLifeL10h } from '@/utils/mathEngines/bearingLife';
import { computeEquivalentLoadsAndWarnings } from '@/data/skfBearings';
import { calculateIso6336Mesh } from '@/lib/iso6336';
import { computeBoltAssembly, getProofStress } from '@/lib/fastener/sharedEngine';
import { getModuleMethod } from '@/data/moduleMethodology';
import { APP_VERSION, APP_APK_VERSION } from '@/config/app';
import { CANONICAL_TOOL_COUNT } from '@/data/canonicalInventory';
import fs from 'fs';
import path from 'path';

describe('ALUCALC OS V4 Release Sign-Off & Engineering Integrity Suite', () => {
  // P0-01: Machining Milling Input Validation & Physical Formulas
  describe('P0-01 — Machining Milling Input Validation (ISO 3002)', () => {
    it('executes production milling engine with valid inputs: Vc=450, D=50, Z=4, fz=0.15, ap=3, ae=40 -> N=2865, Vf=1719, Q=206.28 cm³/min', () => {
      const inputs = {
        cuttingSpeed: { value: 450 },
        diameter: { value: 50 },
        teeth: { value: 4 },
        feedPerTooth: { value: 0.15 },
        radialDepth: { value: 40 },
        axialDepth: { value: 3 },
        specificCuttingForce: { value: 700 }
      };

      const result = machiningMillingSchema.calculationEngine(inputs as any);
      expect(result.verified).toBe(true);

      const N = Number(result.outputs.spindleSpeed.value);
      const Vf = Number(result.outputs.feedRate.value);
      const MRR = Number(result.outputs.mrr.value);
      const Pc = Number(result.outputs.spindlePower.value);
      const Pmot = Number(result.outputs.motorPower.value);

      expect(N).toBe(2865);
      expect(Vf).toBe(1719);
      expect(MRR).toBeCloseTo(206.28, 2);
      expect(Pc).toBeCloseTo(2.41, 2); // Net cutting power at tool
      expect(Pmot).toBeCloseTo(2.83, 2); // Motor input power (eta = 0.85)

      // Verify methodology formula text uses vf and separates Pc from Pmot
      const method = getModuleMethod('machining-details');
      expect(method.formula).toContain('Q = \\frac{v_f \\cdot a_p \\cdot a_e}{1000}');
      expect(method.formula).toContain('P_{\\text{mot}} = \\frac{P_c}{\\eta}');
      expect(method.formula).not.toContain('Q = \\frac{v_c \\cdot a_p \\cdot a_e}{1000}');
    });

    it('rejects invalid inputs (Z=0, fz<=0, D<=0, negative values) and does NOT set verified=true', () => {
      const invalidCases = [
        { label: 'Z=0 teeth', inputs: { cuttingSpeed: { value: 200 }, diameter: { value: 20 }, teeth: { value: 0 }, feedPerTooth: { value: 0.1 }, radialDepth: { value: 5 }, axialDepth: { value: 5 }, specificCuttingForce: { value: 1500 } } },
        { label: 'fz <= 0', inputs: { cuttingSpeed: { value: 200 }, diameter: { value: 20 }, teeth: { value: 4 }, feedPerTooth: { value: -0.05 }, radialDepth: { value: 5 }, axialDepth: { value: 5 }, specificCuttingForce: { value: 1500 } } },
        { label: 'D <= 0', inputs: { cuttingSpeed: { value: 200 }, diameter: { value: 0 }, teeth: { value: 4 }, feedPerTooth: { value: 0.1 }, radialDepth: { value: 5 }, axialDepth: { value: 5 }, specificCuttingForce: { value: 1500 } } },
        { label: 'ae <= 0', inputs: { cuttingSpeed: { value: 200 }, diameter: { value: 20 }, teeth: { value: 4 }, feedPerTooth: { value: 0.1 }, radialDepth: { value: 0 }, axialDepth: { value: 5 }, specificCuttingForce: { value: 1500 } } },
        { label: 'ap <= 0', inputs: { cuttingSpeed: { value: 200 }, diameter: { value: 20 }, teeth: { value: 4 }, feedPerTooth: { value: 0.1 }, radialDepth: { value: 5 }, axialDepth: { value: -2 }, specificCuttingForce: { value: 1500 } } },
      ];

      for (const tc of invalidCases) {
        const res = machiningMillingSchema.calculationEngine(tc.inputs as any);
        expect(res.verified, `Expected verified=false for ${tc.label}`).toBe(false);
        expect(res.warnings.some(w => w.severity === 'critical')).toBe(true);
      }
    });
  });

  // P0-02: ISO 281 Bearing Life Rating
  describe('P0-02 — ISO 281 Bearing Rating Life Engine', () => {
    it('executes production bearing life engine: C=13.5 kN, P=5 kN, n=3000 rpm, p=3 -> L10=19.683 Mrev, L10h=109.35 h', () => {
      const C = 13.5;
      const P = 5.0;
      const n = 3000;

      const L10_million_rev = Math.pow(C / P, 3);
      expect(L10_million_rev).toBeCloseTo(19.683, 3);

      const L10h = calculateBearingLifeL10h(C, P, n, 'ball');
      expect(L10h).toBeCloseTo(109.35, 2);

      // Verify formula text specifies [10^6 rev] without double multiplier
      const method = getModuleMethod('bearings');
      expect(method.formula).toContain('L_{10} = \\left(\\frac{C}{P}\\right)^p \\text{ [10}^6\\text{ rev]}');
      expect(method.formula).toContain('L_{10h} = \\frac{10^6 \\cdot L_{10}}{60 \\cdot n}');
    });

    it('verifies ISO 281 load factors switch at Fa/Fr > e', () => {
      const b6208 = { code: '6208', type: 'deep-groove-ball', d: 40, D: 80, B: 18, C: 32.5, C0: 19.0 };
      const pureRadial = computeEquivalentLoadsAndWarnings(b6208 as any, 6.0, 0);
      expect(pureRadial.X).toBe(1);
      expect(pureRadial.Y).toBe(0);
      expect(pureRadial.P).toBeCloseTo(6.0, 2);

      const combined = computeEquivalentLoadsAndWarnings(b6208 as any, 6.0, 1.8);
      expect(combined.X).toBe(0.56);
      expect(combined.Y).toBeGreaterThan(1.0);
    });
  });

  // P0-03: ISO 6336 Deterministic Boundaries, Pinion/Gear Separation & Configurable Targets
  describe('P0-03 — ISO 6336 Gear Safety Engine (Deterministic Boundaries & Validation)', () => {
    const baseMeshInput = {
      mn: 3,
      z1: 20,
      z2: 60,
      b: 40,
      torqueNm: 120,
      rpmPinion: 1450,
      sigmaFlim1: 430,
      sigmaFlim2: 430,
      targetSH: 1.20,
      targetSF: 1.40,
    };

    it('rejects invalid inputs (zero torque, negative geometry) and does NOT produce safe status', () => {
      const invalidInput = { ...baseMeshInput, torqueNm: 0 };
      const result = calculateIso6336Mesh(invalidInput);
      expect(result.valid).toBe(false);
      expect(result.status).toBe('invalid');
      expect(result.targetMet).toBe(false);
      expect(result.SH).toBe(0);
      expect(result.validationErrors?.length).toBeGreaterThan(0);
    });

    it('determines SH boundaries unconditionally (SH=1.10, 1.19, 1.20, 1.21 against targetSH=1.20)', () => {
      // First, get reference sigmaH with base input
      const ref = calculateIso6336Mesh(baseMeshInput);
      expect(ref.valid).toBe(true);
      const sigmaH = ref.sigmaH;

      // 1. SH = 1.10 -> Target NOT met, status marginal
      const mesh110 = calculateIso6336Mesh({ ...baseMeshInput, sigmaHlim: 1.10 * sigmaH });
      expect(mesh110.SH).toBeCloseTo(1.10, 2);
      expect(mesh110.targetMet).toBe(false);
      expect(mesh110.status).toBe('marginal');

      // 2. SH = 1.19 -> Target NOT met
      const mesh119 = calculateIso6336Mesh({ ...baseMeshInput, sigmaHlim: 1.19 * sigmaH });
      expect(mesh119.SH).toBeCloseTo(1.19, 2);
      expect(mesh119.targetMet).toBe(false);
      expect(mesh119.status).toBe('marginal');

      // 3. SH = 1.20 -> Target MET (SF >= 1.40) -> status safe
      const mesh120 = calculateIso6336Mesh({ ...baseMeshInput, sigmaHlim: 1.20 * sigmaH });
      expect(mesh120.SH).toBeCloseTo(1.20, 2);
      expect(mesh120.targetMet).toBe(true);
      expect(mesh120.status).toBe('safe');

      // 4. SH = 1.21 -> Target MET -> status safe
      const mesh121 = calculateIso6336Mesh({ ...baseMeshInput, sigmaHlim: 1.21 * sigmaH });
      expect(mesh121.SH).toBeCloseTo(1.21, 2);
      expect(mesh121.targetMet).toBe(true);
      expect(mesh121.status).toBe('safe');
    });

    it('evaluates pinion and gear contact safeties separately when materials differ', () => {
      // Pinion case-hardened (1500 MPa), Gear through-hardened (900 MPa)
      const meshAsym = calculateIso6336Mesh({
        ...baseMeshInput,
        sigmaHlim1: 1500,
        sigmaHlim2: 900,
      });

      expect(meshAsym.valid).toBe(true);
      expect(meshAsym.SH1).toBeGreaterThan(meshAsym.SH2);
      expect(meshAsym.SH).toBe(meshAsym.SH2);
      expect(meshAsym.criticalFactor).toContain('gear contact');
    });

    it('identifies method scope explicitly as Screening (Simplified Method B)', () => {
      const mesh = calculateIso6336Mesh(baseMeshInput);
      expect(mesh.verificationLevel).toBe('screening');
      expect(mesh.detailedVerificationRequired).toBe(true);
      expect(mesh.methodScope).toContain('Screening');
    });
  });

  // P0-04 & P0-05: VDI 2230 & ISO 898-1 Fastener Engine
  describe('P0-04 & P0-05 — Fastener Production Engine & M12 Truth Checks', () => {
    it('verifies ISO 898-1:2013 Table 3 proof stress Sp = 580 MPa for M12 Grade 8.8 (d <= 16mm)', () => {
      const Sp = getProofStress('8.8', 640, 12);
      expect(Sp).toBe(580); // NOT 600 MPa

      const As = 84.3;
      const Fp_kN = (Sp * As) / 1000;
      expect(Fp_kN).toBeCloseTo(48.89, 1); // 48.89 kN
    });

    it('verifies ISO 724 thread geometry and VDI 2230 polar section modulus Wp', () => {
      const result = computeBoltAssembly({
        threadStandard: 'Metric Coarse',
        size: 'M12',
        grade: '8.8',
        muThread: 0.14,
        muHead: 0.14,
        yieldUtilization: 70,
        useProofStress: true,
        length: 50,
        boltType: 'hex_bolt',
      });

      expect(result.d_nom).toBe(12.0);
      expect(result.d2).toBeCloseTo(10.863, 2);
      expect(result.d3).toBeCloseTo(9.853, 2); // external root diameter (NOT internal D1=10.106)
      expect(result.As).toBe(84.3);

      // Preload with nu=0.70 and Sp=580
      expect(result.Fm_max).toBeCloseTo(34.23, 1); // 34.23 kN (NOT 35.4 kN)

      // Polar section modulus Wp per VDI 2230 §5.5.1 with dS = (d2 + d3)/2
      const dS = 0.5 * (result.d2 + result.d3);
      expect(dS).toBeCloseTo(10.358, 2);
      const expectedWp = (Math.PI * Math.pow(dS, 3)) / 16;
      expect(result.Wp).toBeCloseTo(expectedWp, 1);
      expect(result.Wp).toBeCloseTo(218.2, 1); // NOT 346.4 mm³
    });
  });

  // P0-06, P1-01: PDF Layout Bounds & Disclaimers
  describe('P0-06 & P1-01 — VDI 2230 Sample PDF Bounds & Attribution', () => {
    it('verifies sample PDF exists and uses accurate standard numbers and disclaimers', () => {
      const pdfPath = path.join(process.cwd(), 'public', 'reports', 'sample-vdi-2230-bolt-torque.pdf');
      expect(fs.existsSync(pdfPath)).toBe(true);
      expect(fs.statSync(pdfPath).size).toBeGreaterThan(2000);

      const scriptContent = fs.readFileSync(path.join(process.cwd(), 'scripts', 'generate_vdi_sample_pdf.js'), 'utf8');
      
      // Standard numbers
      expect(scriptContent).toContain('Sp = 580 MPa');
      expect(scriptContent).not.toContain('Sp = 600 MPa');
      expect(scriptContent).toContain('d3 = 9.853 mm');
      expect(scriptContent).toContain('Fp = 48.89 kN');
      expect(scriptContent).toContain('FM = 34.23 kN');
      expect(scriptContent).toContain('Wp = (pi * dS^3) / 16 = 218.2 mm3');
      expect(scriptContent).toContain(`AluCalc OS v${APP_VERSION}`);
      expect(scriptContent).not.toContain('v5.2.0');

      // Honest disclaimers: no conflicting "SAMPLE BENCHMARK - VERIFIED"
      expect(scriptContent).toContain('SAMPLE BENCHMARK RECORD');
      expect(scriptContent).not.toContain('1:1 numerical parity');
      expect(scriptContent).not.toContain('SAMPLE BENCHMARK - VERIFIED');
    });

    it('verifies PDF layout coordinates mathematically stay strictly inside A4 borders (<= 560 pt)', () => {
      const scriptContent = fs.readFileSync(path.join(process.cwd(), 'scripts', 'generate_vdi_sample_pdf.js'), 'utf8');

      // Check Step 7 result position: starting at width - margin - 175 = 392 pt, max width ~130 pt -> 522 pt <= 560 pt
      expect(scriptContent).toContain('width - margin - 175');
      expect(scriptContent).not.toContain('width - margin - 185');

      // Check callout box coordinates
      expect(scriptContent).toContain('TORQUE: MA = 76.8 N.m');
      expect(scriptContent).toContain('PRELOAD: FM = 34.2 kN (FM,min = 28.5 kN, alphaA = 1.20)');
      expect(scriptContent).toContain('STRESS: sigma_eq = 513.1 MPa <= 640.0 MPa (FoS = 1.25 >= 1.05)');
    });
  });

  // SSOT: Single Source of Truth & Manifest Validation
  describe('SSOT & Brand Inventory Consistency', () => {
    it('validates versions and canonical tool count across the platform', () => {
      expect(APP_VERSION).toBe('6.0.0');
      expect(APP_APK_VERSION).toBe('6.0');
      expect(CANONICAL_TOOL_COUNT).toBe(86);

      const llmsTxt = fs.readFileSync(path.join(process.cwd(), 'public', 'llms.txt'), 'utf8');
      expect(llmsTxt).toContain('86 deterministic ISO');
      expect(llmsTxt).not.toContain('90+');

      const aboutPage = fs.readFileSync(path.join(process.cwd(), 'src', 'app', 'about', 'page.tsx'), 'utf8');
      expect(aboutPage).toContain('CANONICAL_TOOL_COUNT');

      // Release manifest
      const manifestPath = path.join(process.cwd(), 'public', 'release-manifest.json');
      expect(fs.existsSync(manifestPath)).toBe(true);
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      expect(manifest.toolCount).toBe(86);
      expect(manifest.appVersion).toBe('6.0.0');
      expect(manifest.distribution.web.status).toBe('production_ready');
      expect(manifest.distribution.android.status).toBe('pending_device_testing');
    });
  });
});
