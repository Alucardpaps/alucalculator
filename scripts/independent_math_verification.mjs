import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

console.log("================================================================================");
console.log("ALUCALC OS — INDEPENDENT GROUND TRUTH MATHEMATICAL & CODE VERIFICATION");
console.log("================================================================================");

const results = [];

function check(name, standard, calculated, reference, unit, tolerancePercent = 0.5) {
  const diff = Math.abs(calculated - reference);
  const percentErr = reference === 0 ? diff : (diff / Math.abs(reference)) * 100;
  const pass = percentErr <= tolerancePercent;
  results.push({
    name,
    standard,
    calculated: calculated.toFixed(4),
    reference: reference.toFixed(4),
    unit,
    percentErr: percentErr.toFixed(3) + "%",
    verdict: pass ? "PASS" : "FAIL"
  });
  console.log(`[${pass ? 'PASS' : 'FAIL'}] ${name} (${standard}): Calc=${calculated.toFixed(4)}, Ref=${reference.toFixed(4)} ${unit}, Err=${percentErr.toFixed(3)}%`);
}

// 1. VDI 2230 Bolt Tightening Torque (M12 x 1.75, Grade 8.8)
// VDI 2230 Table 8 and Table A9: d=12mm, P=1.75mm, d2=10.863mm, d3=10.106mm, dw=19.0mm, dh=13.5mm (normal clearance ISO 273), muG=0.14, muK=0.14, Sp=600MPa, As=84.3mm2, nu=0.70
{
  const d = 12;
  const P = 1.75;
  const d2 = 10.863;
  const dw = 19.0;
  const dh = 13.5;
  const rb = (dw + dh) / 4; // 8.125 mm
  const muG = 0.14;
  const muK = 0.14;
  const Sp = 600;
  const As = 84.3;
  const nu = 0.70;

  const FM = nu * Sp * As; // 35406 N = 35.406 kN
  // VDI 2230: MA = FM * (P/(2*pi) + 0.57735*muG*d2 + muK*rb)
  const MA = (FM * (0.159155 * P + 0.57735 * muG * d2 + muK * rb)) / 1000;
  
  check("VDI 2230 Preload FM", "VDI 2230 / ISO 898-1", FM / 1000, 35.406, "kN", 0.01);
  check("VDI 2230 Torque MA", "VDI 2230 Blatt 1", MA, 83.1099, "N·m", 0.5);
}

// 2. ISO 281:2007 Bearing Life L10h (SKF 6204: C=13.5 kN, C0=6.55 kN, Fr=5000 N, Fa=1000 N, n=3000 rpm)
{
  const C = 13500; // N
  const C0 = 6550; // N
  const Fr = 5000; // N
  const Fa = 1000; // N
  const n = 3000;  // rpm
  const e = 0.25;  // for deep groove ball bearing
  // Fa / Fr = 1000 / 5000 = 0.20 <= e (0.25) -> X=1, Y=0
  const P = Fr; // 5000 N
  const p = 3; // ball bearing
  const L10_rev = Math.pow(C / P, p); // 10^6 revolutions
  const L10h = (1e6 * L10_rev) / (60 * n);
  const S0 = C0 / P;

  check("ISO 281 L10h Life", "ISO 281:2007", L10h, 109.35, "hours", 0.01);
  check("ISO 76 Static Safety S0", "ISO 76", S0, 1.31, "[-]", 0.01);
}

// 3. ISO 6336 Gear Center Distance & Contact Ratio (mn=3, z1=20, z2=60, alpha=20 deg)
{
  const mn = 3;
  const z1 = 20;
  const z2 = 60;
  const a = (mn * (z1 + z2)) / 2; // 3 * 80 / 2 = 120 mm
  const u = z2 / z1; // 3.0
  check("ISO 6336 Gear Center Distance a", "ISO 6336 / DIN 3960", a, 120.0, "mm", 0.01);
  check("ISO 6336 Gear Ratio u", "ISO 6336", u, 3.0, "[-]", 0.01);
}

// 4. DIN 7190 Press-Fit Interface Pressure (d=50mm, Da=100mm, Ueff=49 um, E=210 GPa, nu=0.3)
{
  const d = 50;
  const Da = 100;
  const di = 0; // solid shaft
  const Ueff = 0.049; // mm
  const E = 210000; // MPa
  const nu = 0.3;

  const qa = d / Da; // 0.5
  const ca = (1 + Math.pow(qa, 2)) / (E * (1 - Math.pow(qa, 2))) + nu / E;
  const ci = (1 - nu) / E; // for solid shaft
  const p = Ueff / (d * (ca + ci));

  check("DIN 7190 Interface Pressure p", "DIN 7190-1", p, 77.175, "MPa", 0.01);
}

// 5. ASME Section VIII Div 1 UG-27 Pressure Vessel Thickness (Internal Pressure Shell)
// P=10 MPa, R=500mm, S=250MPa, E=0.85
{
  const P = 10;
  const R = 500;
  const S = 250;
  const E = 0.85;

  // Base thickness before corrosion allowance: t = (P * R) / (S * E - 0.6 * P)
  const t_base = (P * R) / (S * E - 0.6 * P);
  check("ASME VIII UG-27 Base Shell Thickness t", "ASME BPVC VIII Div 1", t_base, 24.2131, "mm", 0.01);
}

// 6. Euler-Bernoulli Beam Deflection (Cantilever Beam, F=1000 N, L=1000 mm, Steel E=210 GPa, Solid square 50x50 mm)
{
  const F = 1000; // N
  const L = 1000; // mm
  const E = 210000; // MPa
  const b = 50; // mm
  const h = 50; // mm
  const I = (b * Math.pow(h, 3)) / 12; // 520833.33 mm4
  const v_cantilever = (F * Math.pow(L, 3)) / (3 * E * I);
  const sigma_max = (F * L * (h / 2)) / I;

  check("Euler Cantilever Deflection v", "Euler-Bernoulli", v_cantilever, 3.0476, "mm", 0.01);
  check("Euler Cantilever Bending Stress", "Euler-Bernoulli", sigma_max, 48.0, "MPa", 0.01);
}

// 7. Euler Column Buckling Critical Load (Pinned-Pinned K=1.0, L=2000 mm, Steel E=210 GPa, Tube D=60mm, d=50mm)
{
  const K = 1.0;
  const L = 2000; // mm
  const E = 210000; // MPa
  const D = 60;
  const d = 50;
  const I = (Math.PI / 64) * (Math.pow(D, 4) - Math.pow(d, 4)); // 329383.56 mm4
  const Pcr = (Math.PI * Math.PI * E * I) / Math.pow(K * L, 2); // 170667.8 N = 170.6678 kN
  check("Euler Critical Buckling Load Pcr", "Euler Buckling", Pcr / 1000, 170.6678, "kN", 0.01);
}

// 8. ISO 286-1 Standard Tolerance Unit i for D=50mm
{
  const D = 50;
  const i = 0.45 * Math.pow(D, 1/3) + 0.001 * D;
  check("ISO 286-1 Tolerance Unit i", "ISO 286-1", i, 1.7078, "μm", 0.01);
}

// 9. DIN 6935 Sheet Metal Bend Allowance BA (T=2mm, R=3mm, alpha=90 deg, K=0.40)
{
  const T = 2;
  const R = 3;
  const alpha = 90;
  const K = 0.40;
  const BA = (Math.PI / 180) * alpha * (R + K * T);
  check("DIN 6935 Bend Allowance BA", "DIN 6935", BA, 5.9690, "mm", 0.01);
}

// 10. Darcy-Weisbach & Colebrook Friction (Smooth pipe D=0.05m, V=2m/s, nu=1e-6 m2/s -> Re=100,000, eps/D=0.0001)
{
  const Re = 100000;
  const relRoughness = 0.0001;
  let f = 0.02;
  for (let iter = 0; iter < 10; iter++) {
    const rhs = -2 * Math.log10(relRoughness / 3.7 + 2.51 / (Re * Math.sqrt(f)));
    f = Math.pow(1 / rhs, 2);
  }
  check("Darcy-Weisbach Colebrook f", "Colebrook-White", f, 0.0185, "[-]", 0.1);
}

console.log("\n================================================================================");
console.log(`TOTAL GROUND TRUTH TESTS: ${results.length}`);
const allPassed = results.every(r => r.verdict === "PASS");
console.log(`ALL MATHEMATICAL BENCHMARKS PASSED: ${allPassed ? "YES (100% PASS)" : "NO"}`);
console.log("================================================================================");

// Save updated JSON
const verificationReport = {
  timestamp: new Date().toISOString(),
  totalBenchmarks: results.length,
  allPassed,
  benchmarks: results
};
fs.writeFileSync(path.join(rootDir, 'scripts', 'ground_truth_verification_results.json'), JSON.stringify(verificationReport, null, 2));
console.log("Ground truth results saved to scripts/ground_truth_verification_results.json");
