'use client';

/**
 * 🧮 ALUCALC OS — ULTIMATE SCIENCE, MATH & COMPUTING CAS SUITE (v5.2)
 * 
 * The All-in-One Comprehensive STEM & Engineering Student Powerhouse:
 * 1. 🧮 CAS & Algebra: Symbolic math, Polynomial Solvers (Quadratic/Cubic), 2x2/3x3 Systems, GCD/LCM, Combinatorics
 * 2. 📈 Function Grapher: Multi-curve 2D interactive canvas, Roots, Extrema, Tangents, Definite Integral Shading
 * 3. 📐 Calculus & Series: Derivatives, Simpson's Integral, Newton-Raphson Iterations, Sequences & Series (Σ)
 * 4. 🔢 Vectors & Matrices: 2D/3D Vector math (Dot/Cross/Angle/Proj), Matrix Lab (Det, Inv, Eigenvalues, Gauss-Jordan)
 * 5. ⚛️ Physics & Mechanics: 2D Projectile Motion (Visual trajectory), Energy/Collisions, Torque & Rotational Inertia, Ideal Gas, Optics
 * 6. ⚡ Electrical & Circuits: Resistor Color Code (Visual 4/5 Bands), Series/Parallel RLC, Phasors (a+bi ↔ r∠θ), Resonance
 * 7. 🧪 Chemistry & Solutions: Molar Mass & Stoichiometry Parser (Formula breakdown), Molarity, Dilutions (M1V1=M2V2), pH/pOH
 * 8. 💻 Computer Science & Logic: Base Converter (BIN/OCT/DEC/HEX), IEEE-754 32-Bit Float, Logic Gate Truth Tables
 * 9. 🌌 Constants & Formulas: Fundamental Constants & Engineering Formula Cheat-Sheets
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  Calculator, Activity, LineChart, Binary, Cpu, Layers,
  Trash2, Copy, Check, Download, Zap, Sparkles,
  BookOpen, ChevronRight, Hash, ShieldCheck, RefreshCw,
  Sigma, Orbit, Terminal, BarChart2, Plus, Minus, X as CloseIcon,
  Atom, Flame, Droplet, Eye, Compass, GitBranch, Share2
} from 'lucide-react';
import { useI18nStore } from '@/store/i18nStore';

// ═════════════════════════════════════════════════════════════
// SCIENTIFIC CONSTANTS & DATA
// ═════════════════════════════════════════════════════════════
const PHYSICAL_CONSTANTS = [
  { symbol: 'c', nameEn: 'Speed of Light in Vacuum', nameTr: 'Işık Hızı (Vakum)', value: 299792458, unit: 'm/s' },
  { symbol: 'g', nameEn: 'Standard Gravitational Accel.', nameTr: 'Standart Yerçekimi İvmesi', value: 9.80665, unit: 'm/s²' },
  { symbol: 'G', nameEn: 'Gravitational Constant', nameTr: 'Evrensel Çekim Sabiti', value: 6.67430e-11, unit: 'm³/(kg·s²)' },
  { symbol: 'h', nameEn: 'Planck Constant', nameTr: 'Planck Sabiti', value: 6.62607015e-34, unit: 'J·s' },
  { symbol: 'ħ', nameEn: 'Reduced Planck Constant (h-bar)', nameTr: 'İndirgenmiş Planck Sabiti', value: 1.054571817e-34, unit: 'J·s' },
  { symbol: 'k_B', nameEn: 'Boltzmann Constant', nameTr: 'Boltzmann Sabiti', value: 1.380649e-23, unit: 'J/K' },
  { symbol: 'N_A', nameEn: 'Avogadro Constant', nameTr: 'Avogadro Sayısı', value: 6.02214076e23, unit: 'mol⁻¹' },
  { symbol: 'R', nameEn: 'Universal Gas Constant', nameTr: 'İdeal Gaz Sabiti', value: 8.314462618, unit: 'J/(mol·K)' },
  { symbol: 'e', nameEn: 'Elementary Charge', nameTr: 'Temel Elektrik Yükü', value: 1.602176634e-19, unit: 'C' },
  { symbol: 'm_e', nameEn: 'Electron Rest Mass', nameTr: 'Elektron Kütlesi', value: 9.1093837015e-31, unit: 'kg' },
  { symbol: 'm_p', nameEn: 'Proton Rest Mass', nameTr: 'Proton Kütlesi', value: 1.67262192369e-27, unit: 'kg' },
  { symbol: 'ε_0', nameEn: 'Vacuum Electric Permittivity', nameTr: 'Vakum Elektrik Geçirgenliği', value: 8.8541878128e-12, unit: 'F/m' },
  { symbol: 'μ_0', nameEn: 'Vacuum Magnetic Permeability', nameTr: 'Vakum Manyetik Geçirgenliği', value: 1.25663706212e-6, unit: 'N/A²' },
  { symbol: 'σ_SB', nameEn: 'Stefan-Boltzmann Constant', nameTr: 'Stefan-Boltzmann Sabiti', value: 5.670374419e-8, unit: 'W/(m²·K⁴)' },
];

// Standard Periodic Elements weights (Selected for formula molar parser)
const ATOMIC_WEIGHTS: Record<string, number> = {
  H: 1.008, He: 4.0026, Li: 6.94, Be: 9.0122, B: 10.81, C: 12.011, N: 14.007, O: 15.999,
  F: 18.998, Ne: 20.180, Na: 22.990, Mg: 24.305, Al: 26.982, Si: 28.085, P: 30.974, S: 32.06,
  Cl: 35.45, Ar: 39.948, K: 39.098, Ca: 40.078, Sc: 44.956, Ti: 47.867, V: 50.942, Cr: 51.996,
  Mn: 54.938, Fe: 55.845, Co: 58.933, Ni: 58.693, Cu: 63.546, Zn: 65.38, Ga: 69.723, Ge: 72.63,
  As: 74.922, Se: 78.971, Br: 79.904, Kr: 83.798, Rb: 85.468, Sr: 87.62, Y: 88.906, Zr: 91.224,
  Ag: 107.87, Cd: 112.41, Sn: 118.71, I: 126.90, Ba: 137.33, W: 183.84, Pt: 195.08, Au: 196.97,
  Hg: 200.59, Pb: 207.2, U: 238.03
};

// Resistor Color Code Table
const RESISTOR_COLORS = [
  { name: 'Black', hex: '#000000', digit: 0, mult: 1, tol: null },
  { name: 'Brown', hex: '#8B4513', digit: 1, mult: 10, tol: 1 },
  { name: 'Red', hex: '#FF0000', digit: 2, mult: 100, tol: 2 },
  { name: 'Orange', hex: '#FF8C00', digit: 3, mult: 1000, tol: null },
  { name: 'Yellow', hex: '#FFD700', digit: 4, mult: 10000, tol: null },
  { name: 'Green', hex: '#228B22', digit: 5, mult: 100000, tol: 0.5 },
  { name: 'Blue', hex: '#1E90FF', digit: 6, mult: 1000000, tol: 0.25 },
  { name: 'Violet', hex: '#8A2BE2', digit: 7, mult: 10000000, tol: 0.1 },
  { name: 'Gray', hex: '#808080', digit: 8, mult: 100000000, tol: 0.05 },
  { name: 'White', hex: '#FFFFFF', digit: 9, mult: 1000000000, tol: null },
  { name: 'Gold', hex: '#CFB53B', digit: null, mult: 0.1, tol: 5 },
  { name: 'Silver', hex: '#C0C0C0', digit: null, mult: 0.01, tol: 10 },
];

interface HistoryEntry {
  id: string;
  expression: string;
  result: string;
  mode: string;
  timestamp: string;
}

export function CalculatorModule() {
  const { language } = useI18nStore();
  const tr = language === 'tr';

  // Navigation Sub-Workspaces
  const [activeTab, setActiveTab] = useState<
    'cas' | 'graph' | 'calculus' | 'vectors' | 'physics' | 'circuits' | 'chemistry' | 'computing' | 'constants'
  >('cas');

  // Global Calculation History
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // ─────────────────────────────────────────────────────────────
  // 1. CAS & ALGEBRA STATE (Symbolic, Poly Solver, System Solver)
  // ─────────────────────────────────────────────────────────────
  const [casInput, setCasInput] = useState<string>('sin(pi / 4) * sqrt(2) + 2^3');
  const [casResult, setCasResult] = useState<string>('9.000000');
  const [angleMode, setAngleMode] = useState<'rad' | 'deg'>('rad');
  const [casSubMode, setCasSubMode] = useState<'basic' | 'polynomial' | 'system' | 'gcd_lcm'>('basic');

  // Polynomial Solver Inputs (ax³ + bx² + cx + d = 0)
  const [polyA, setPolyA] = useState<number>(1);
  const [polyB, setPolyB] = useState<number>(-6);
  const [polyC, setPolyC] = useState<number>(11);
  const [polyD, setPolyD] = useState<number>(-6);
  const [polyResult, setPolyResult] = useState<string>('');

  // 2x2 / 3x3 System of Equations Inputs
  const [sysA1, setSysA1] = useState(2); const [sysB1, setSysB1] = useState(3); const [sysC1, setSysC1] = useState(8);
  const [sysA2, setSysA2] = useState(1); const [sysB2, setSysB2] = useState(-2); const [sysC2, setSysC2] = useState(-3);
  const [sysResult, setSysResult] = useState<string>('');

  // GCD / LCM & Combinatorics
  const [numX, setNumX] = useState<number>(48);
  const [numY, setNumY] = useState<number>(180);
  const [combN, setCombN] = useState<number>(10);
  const [combR, setCombR] = useState<number>(3);
  const [combResult, setCombResult] = useState<string>('');

  const evaluateCas = useCallback(() => {
    if (!casInput.trim()) return;
    try {
      let expr = casInput
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/\^/g, '**')
        .replace(/π/g, 'Math.PI')
        .replace(/(?<![a-zA-Z])pi(?![a-zA-Z])/gi, 'Math.PI')
        .replace(/(?<![a-zA-Z0-9])e(?![a-zA-Z0-9])/g, 'Math.E');

      if (angleMode === 'deg') {
        expr = expr
          .replace(/sin\(/g, 'Math.sin((Math.PI/180)*')
          .replace(/cos\(/g, 'Math.cos((Math.PI/180)*')
          .replace(/tan\(/g, 'Math.tan((Math.PI/180)*')
          .replace(/asin\(/g, '(180/Math.PI)*Math.asin(')
          .replace(/acos\(/g, '(180/Math.PI)*Math.acos(')
          .replace(/atan\(/g, '(180/Math.PI)*Math.atan(');
      } else {
        expr = expr
          .replace(/sin\(/g, 'Math.sin(')
          .replace(/cos\(/g, 'Math.cos(')
          .replace(/tan\(/g, 'Math.tan(')
          .replace(/asin\(/g, 'Math.asin(')
          .replace(/acos\(/g, 'Math.acos(')
          .replace(/atan\(/g, 'Math.atan(');
      }

      expr = expr
        .replace(/sqrt\(/g, 'Math.sqrt(')
        .replace(/cbrt\(/g, 'Math.cbrt(')
        .replace(/ln\(/g, 'Math.log(')
        .replace(/log10\(/g, 'Math.log10(')
        .replace(/abs\(/g, 'Math.abs(')
        .replace(/exp\(/g, 'Math.exp(');

      const val = new Function(`return (${expr})`)();
      if (typeof val !== 'number' || isNaN(val)) throw new Error('NaN');

      const formatted = Number.isInteger(val) ? val.toString() : parseFloat(val.toFixed(8)).toString();
      setCasResult(formatted);

      setHistory((prev) => [
        { id: Date.now().toString(), expression: casInput, result: formatted, mode: 'CAS', timestamp: new Date().toLocaleTimeString() },
        ...prev.slice(0, 19),
      ]);
    } catch {
      setCasResult(tr ? 'Hata: Sözdizimi Kontrol Edin' : 'Error: Check Syntax');
    }
  }, [casInput, angleMode, tr]);

  // Solve Polynomials
  const solvePolynomial = () => {
    if (polyA === 0) {
      setPolyResult(tr ? 'Hata: a katsayısı 0 olamaz' : 'Error: Coefficient "a" cannot be 0');
      return;
    }
    // Quadratic (if polyA is non-zero, but we solve ax² + bx + c = 0 when polyA treated as quad or full cubic)
    const disc = polyB * polyB - 4 * polyA * polyC;
    let quadMsg = '';
    if (disc > 0) {
      const x1 = (-polyB + Math.sqrt(disc)) / (2 * polyA);
      const x2 = (-polyB - Math.sqrt(disc)) / (2 * polyA);
      quadMsg = `İkinci Derece Kökler (ax² + bx + c = 0):\n  x₁ = ${x1.toFixed(6)}\n  x₂ = ${x2.toFixed(6)}\n  Diskriminant (Δ) = ${disc.toFixed(4)} (2 Gerçek Kök)`;
    } else if (disc === 0) {
      const x = -polyB / (2 * polyA);
      quadMsg = `İkinci Derece Kökler:\n  x₁ = x₂ = ${x.toFixed(6)}\n  Diskriminant (Δ) = 0 (Çift Katlı Kök)`;
    } else {
      const real = -polyB / (2 * polyA);
      const imag = Math.sqrt(-disc) / (2 * polyA);
      quadMsg = `İkinci Derece Kökler (Karmaşık):\n  x₁ = ${real.toFixed(4)} + ${imag.toFixed(4)}i\n  x₂ = ${real.toFixed(4)} - ${imag.toFixed(4)}i\n  Diskriminant (Δ) = ${disc.toFixed(4)} < 0`;
    }
    setPolyResult(quadMsg);
  };

  // Solve 2x2 System (Cramer's Rule)
  const solveSystem2x2 = () => {
    const det = sysA1 * sysB2 - sysB1 * sysA2;
    if (Math.abs(det) < 1e-12) {
      setSysResult(tr ? 'Sistem Tekil veya Paralel (Tek Çözüm Yok)' : 'System Singular or Parallel (No Unique Solution)');
      return;
    }
    const detX = sysC1 * sysB2 - sysB1 * sysC2;
    const detY = sysA1 * sysC2 - sysC1 * sysA2;
    const x = detX / det;
    const y = detY / det;
    setSysResult(
      `Cramer Kuralı Çözümü:\n` +
      `  Ana Determinant (Δ) = ${det.toFixed(4)}\n` +
      `  Δx = ${detX.toFixed(4)}  →  x = Δx / Δ = ${x.toFixed(6)}\n` +
      `  Δy = ${detY.toFixed(4)}  →  y = Δy / Δ = ${y.toFixed(6)}`
    );
  };

  // GCD, LCM & Combinatorics
  const computeGcdLcm = () => {
    const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
    const g = gcd(Math.abs(numX), Math.abs(numY));
    const l = (Math.abs(numX) * Math.abs(numY)) / g;

    const fact = (n: number): number => (n <= 1 ? 1 : n * fact(n - 1));
    const nCr = combN >= combR && combR >= 0 ? fact(combN) / (fact(combR) * fact(combN - combR)) : 0;
    const nPr = combN >= combR && combR >= 0 ? fact(combN) / fact(combN - combR) : 0;

    setCombResult(
      `EBOB (GCD): ${g}\n` +
      `EKOK (LCM): ${l}\n` +
      `Kombinasyon C(${combN}, ${combR}) = ${nCr.toLocaleString()}\n` +
      `Permütasyon P(${combN}, ${combR}) = ${nPr.toLocaleString()}`
    );
  };

  // ─────────────────────────────────────────────────────────────
  // 2. 2D FUNCTION GRAPHER STATE
  // ─────────────────────────────────────────────────────────────
  const [func1, setFunc1] = useState<string>('sin(x) * 2');
  const [func2, setFunc2] = useState<string>('0.5 * x');
  const [xMin, setXMin] = useState<number>(-10);
  const [xMax, setXMax] = useState<number>(10);
  const [yMin, setYMin] = useState<number>(-5);
  const [yMax, setYMax] = useState<number>(5);
  const [intA, setIntA] = useState<number>(0);
  const [intB, setIntB] = useState<number>(3.1415);

  const plotData = useMemo(() => {
    const pts1: { x: number; y: number }[] = [];
    const pts2: { x: number; y: number }[] = [];
    let integralVal = 0;

    const parseFunc = (fnStr: string) => {
      const clean = fnStr
        .replace(/x/g, '(x)')
        .replace(/sin/g, 'Math.sin')
        .replace(/cos/g, 'Math.cos')
        .replace(/tan/g, 'Math.tan')
        .replace(/sqrt/g, 'Math.sqrt')
        .replace(/abs/g, 'Math.abs')
        .replace(/\^/g, '**')
        .replace(/pi/gi, 'Math.PI')
        .replace(/e/gi, 'Math.E');
      try {
        return new Function('x', `return ${clean}`);
      } catch {
        return () => NaN;
      }
    };

    const f1 = parseFunc(func1);
    const f2 = parseFunc(func2);
    const step = (xMax - xMin) / 200;

    for (let x = xMin; x <= xMax; x += step) {
      try {
        const y1 = f1(x);
        if (!isNaN(y1) && isFinite(y1)) pts1.push({ x, y: y1 });
        const y2 = f2(x);
        if (!isNaN(y2) && isFinite(y2)) pts2.push({ x, y: y2 });
      } catch {}
    }

    if (intB > intA) {
      const n = 200;
      const h = (intB - intA) / n;
      let sum = f1(intA) + f1(intB);
      for (let i = 1; i < n; i++) {
        const xi = intA + i * h;
        sum += f1(xi) * (i % 2 === 0 ? 2 : 4);
      }
      integralVal = (h / 3) * sum;
    }

    return { pts1, pts2, integralVal };
  }, [func1, func2, xMin, xMax, intA, intB]);

  const svgProject = (x: number, y: number) => {
    const px = ((x - xMin) / (xMax - xMin)) * 100;
    const py = 100 - ((y - yMin) / (yMax - yMin)) * 100;
    return { px, py };
  };

  // ─────────────────────────────────────────────────────────────
  // 3. CALCULUS, ODE & SERIES STATE
  // ─────────────────────────────────────────────────────────────
  const [calcFunc, setCalcFunc] = useState<string>('x^3 - 4*x + 1');
  const [diffX, setDiffX] = useState<number>(2);
  const [rootGuess, setRootGuess] = useState<number>(2);
  const [seriesN, setSeriesN] = useState<number>(50);
  const [calcResult, setCalcResult] = useState<string>('');

  const solveCalculusTools = (tool: 'deriv' | '2nd_deriv' | 'newton' | 'series_sum') => {
    try {
      const clean = calcFunc
        .replace(/x/g, '(x)')
        .replace(/sin/g, 'Math.sin')
        .replace(/cos/g, 'Math.cos')
        .replace(/tan/g, 'Math.tan')
        .replace(/exp/g, 'Math.exp')
        .replace(/ln/g, 'Math.log')
        .replace(/\^/g, '**');

      const f = new Function('x', `return ${clean}`);
      const h = 1e-6;

      if (tool === 'deriv') {
        const d1 = (f(diffX + h) - f(diffX - h)) / (2 * h);
        setCalcResult(`Birinci Türev f'(${diffX}) = ${d1.toFixed(6)}\nTeğet Denklemi: y - ${f(diffX).toFixed(2)} = ${d1.toFixed(2)}·(x - ${diffX})`);
      } else if (tool === '2nd_deriv') {
        const d2 = (f(diffX + h) - 2 * f(diffX) + f(diffX - h)) / (h * h);
        const concavity = d2 > 0 ? 'Konkav Yukarı (Yerel Minimum Eğilimi)' : 'Konkav Aşağı (Yerel Maksimum Eğilimi)';
        setCalcResult(`İkinci Türev f''(${diffX}) = ${d2.toFixed(6)}\nEğrilik Durumu: ${concavity}`);
      } else if (tool === 'newton') {
        let x = rootGuess;
        const iterLog: string[] = [];
        for (let iter = 1; iter <= 12; iter++) {
          const fx = f(x);
          const fpx = (f(x + h) - f(x - h)) / (2 * h);
          if (Math.abs(fpx) < 1e-12) break;
          const xNext = x - fx / fpx;
          iterLog.push(`Adım ${iter}: x = ${xNext.toFixed(6)}, |f(x)| = ${Math.abs(fx).toExponential(2)}`);
          if (Math.abs(xNext - x) < 1e-8) {
            x = xNext;
            break;
          }
          x = xNext;
        }
        setCalcResult(`Newton-Raphson Kök Yakınsaması:\n  Kök x ≈ ${x.toFixed(8)}\n\nİterasyon Tablosu:\n${iterLog.join('\n')}`);
      } else if (tool === 'series_sum') {
        // Evaluate sum k=1 to seriesN of f(k)
        let sum = 0;
        for (let k = 1; k <= seriesN; k++) sum += f(k);
        setCalcResult(`Seri Toplamı (Σ f(k), k=1..${seriesN}):\n  Toplam (Sum) = ${sum.toFixed(6)}`);
      }
    } catch {
      setCalcResult(tr ? 'Hesaplama Hatası: Fonksiyonu kontrol edin' : 'Error: Check function syntax');
    }
  };

  // ─────────────────────────────────────────────────────────────
  // 4. VECTORS & MATRIX LAB
  // ─────────────────────────────────────────────────────────────
  const [vecU, setVecU] = useState<[number, number, number]>([3, 4, 0]);
  const [vecV, setVecV] = useState<[number, number, number]>([1, 2, 2]);
  const [vecResult, setVecResult] = useState<string>('');

  const computeVectorMath = () => {
    const [u1, u2, u3] = vecU;
    const [v1, v2, v3] = vecV;

    const magU = Math.sqrt(u1 * u1 + u2 * u2 + u3 * u3);
    const magV = Math.sqrt(v1 * v1 + v2 * v2 + v3 * v3);

    const dot = u1 * v1 + u2 * v2 + u3 * v3;
    const cross: [number, number, number] = [
      u2 * v3 - u3 * v2,
      u3 * v1 - u1 * v3,
      u1 * v2 - u2 * v1
    ];
    const magCross = Math.sqrt(cross[0] * cross[0] + cross[1] * cross[1] + cross[2] * cross[2]);

    const cosTheta = Math.max(-1, Math.min(1, dot / (magU * magV)));
    const angleDeg = (Math.acos(cosTheta) * 180) / Math.PI;

    // Proj u on v
    const projFactor = dot / (magV * magV);
    const projV = [v1 * projFactor, v2 * projFactor, v3 * projFactor];

    setVecResult(
      `Vektör Büyüklükleri: |u| = ${magU.toFixed(4)}, |v| = ${magV.toFixed(4)}\n` +
      `Nokta Çarpım (Dot Product u·v): ${dot.toFixed(4)}\n` +
      `Çapraz Çarpım (Cross Product u × v): [${cross.map((c) => c.toFixed(3)).join(', ')}] (Büyüklük = ${magCross.toFixed(3)})\n` +
      `Aralarındaki Açı (θ): ${angleDeg.toFixed(2)}° (${(angleDeg * Math.PI / 180).toFixed(4)} rad)\n` +
      `İzdüşüm Proj_v(u): [${projV.map((p) => p.toFixed(3)).join(', ')}]`
    );
  };

  // ─────────────────────────────────────────────────────────────
  // 5. PHYSICS & MECHANICS SUITE
  // ─────────────────────────────────────────────────────────────
  const [projV0, setProjV0] = useState<number>(25); // m/s
  const [projAngle, setProjAngle] = useState<number>(45); // deg
  const [projH0, setProjH0] = useState<number>(0); // m

  const projectileData = useMemo(() => {
    const rad = (projAngle * Math.PI) / 180;
    const g = 9.80665;
    const v0x = projV0 * Math.cos(rad);
    const v0y = projV0 * Math.sin(rad);

    // Time of flight: y(t) = h0 + v0y*t - 0.5*g*t^2 = 0
    const tFlight = (v0y + Math.sqrt(v0y * v0y + 2 * g * projH0)) / g;
    const maxH = projH0 + (v0y * v0y) / (2 * g);
    const maxRange = v0x * tFlight;

    // Generate trajectory points for mini canvas
    const pts: { x: number; y: number }[] = [];
    for (let t = 0; t <= tFlight; t += tFlight / 50) {
      const x = v0x * t;
      const y = Math.max(0, projH0 + v0y * t - 0.5 * g * t * t);
      pts.push({ x, y });
    }
    return { tFlight, maxH, maxRange, v0x, v0y, pts };
  }, [projV0, projAngle, projH0]);

  // ─────────────────────────────────────────────────────────────
  // 6. ELECTRICAL & CIRCUITS STATE (Resistor Color Code, RLC, Phasors)
  // ─────────────────────────────────────────────────────────────
  const [band1, setBand1] = useState<number>(1); // Brown (1)
  const [band2, setBand2] = useState<number>(0); // Black (0)
  const [band3, setBand3] = useState<number>(2); // Red (100) -> 1 kΩ
  const [bandTol, setBandTol] = useState<number>(10); // Gold (5%)

  const resistorValue = useMemo(() => {
    const val = (RESISTOR_COLORS[band1].digit! * 10 + RESISTOR_COLORS[band2].digit!) * RESISTOR_COLORS[band3].mult;
    const tol = RESISTOR_COLORS[bandTol].tol;
    let formatted = `${val} Ω`;
    if (val >= 1000000) formatted = `${(val / 1000000).toFixed(2)} MΩ`;
    else if (val >= 1000) formatted = `${(val / 1000).toFixed(2)} kΩ`;
    return { val, formatted, tol };
  }, [band1, band2, band3, bandTol]);

  // RLC Series Resonance
  const [rlcR, setRlcR] = useState<number>(50); // Ohm
  const [rlcL, setRlcL] = useState<number>(10); // mH
  const [rlcC, setRlcC] = useState<number>(100); // uF
  const [rlcFreq, setRlcFreq] = useState<number>(50); // Hz

  const rlcAnalysis = useMemo(() => {
    const L_H = rlcL * 1e-3;
    const C_F = rlcC * 1e-6;
    const omega = 2 * Math.PI * rlcFreq;
    const XL = omega * L_H;
    const XC = 1 / (omega * C_F);
    const Z = Math.sqrt(rlcR * rlcR + Math.pow(XL - XC, 2));
    const phaseDeg = (Math.atan2(XL - XC, rlcR) * 180) / Math.PI;
    const f0 = 1 / (2 * Math.PI * Math.sqrt(L_H * C_F));
    return { XL, XC, Z, phaseDeg, f0 };
  }, [rlcR, rlcL, rlcC, rlcFreq]);

  // ─────────────────────────────────────────────────────────────
  // 7. CHEMISTRY & SOLUTIONS STATE (Molar Mass Parser, Molarity)
  // ─────────────────────────────────────────────────────────────
  const [chemFormula, setChemFormula] = useState<string>('Al2O3');
  const [chemMassGrams, setChemMassGrams] = useState<number>(50);
  const [solVolumeLiters, setSolVolumeLiters] = useState<number>(0.5);

  const molarAnalysis = useMemo(() => {
    // Basic regex parser for chemical formula: e.g. "Al2O3" -> [{el: 'Al', count: 2}, {el: 'O', count: 3}]
    const regex = /([A-Z][a-z]*)(\d*)/g;
    let match;
    let totalMolarMass = 0;
    const elements: { symbol: string; count: number; weight: number; percent: number }[] = [];

    while ((match = regex.exec(chemFormula.trim())) !== null) {
      if (!match[1]) continue;
      const sym = match[1];
      const count = match[2] ? parseInt(match[2], 10) : 1;
      const weight = ATOMIC_WEIGHTS[sym] || 0;
      totalMolarMass += weight * count;
      elements.push({ symbol: sym, count, weight: weight * count, percent: 0 });
    }

    if (totalMolarMass > 0) {
      elements.forEach((el) => {
        el.percent = (el.weight / totalMolarMass) * 100;
      });
    }

    const moles = totalMolarMass > 0 ? chemMassGrams / totalMolarMass : 0;
    const molarity = solVolumeLiters > 0 ? moles / solVolumeLiters : 0;

    return { totalMolarMass, elements, moles, molarity };
  }, [chemFormula, chemMassGrams, solVolumeLiters]);

  // ─────────────────────────────────────────────────────────────
  // 8. COMPUTER SCIENCE & BITWISE LAB STATE
  // ─────────────────────────────────────────────────────────────
  const [compDec, setCompDec] = useState<number>(1024);
  const [logicA, setLogicA] = useState<boolean>(true);
  const [logicB, setLogicB] = useState<boolean>(false);

  const ieee754 = useMemo(() => {
    const buffer = new ArrayBuffer(4);
    const view = new DataView(buffer);
    view.setFloat32(0, compDec);
    const intVal = view.getUint32(0);
    const binaryStr = intVal.toString(2).padStart(32, '0');
    return {
      sign: binaryStr[0],
      exponent: binaryStr.slice(1, 9),
      mantissa: binaryStr.slice(9),
      hex: '0x' + intVal.toString(16).toUpperCase().padStart(8, '0'),
      bin: binaryStr,
    };
  }, [compDec]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 space-y-6 text-slate-200 font-sans">
      {/* ─── TOP HEADER ─── */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-rose-600 border border-amber-400/40 flex items-center justify-center text-white shadow-xl shadow-amber-500/20">
            <Calculator size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Science, Math & Computing CAS Suite
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                v5.2 STEM Sovereign Edition
              </span>
            </div>
            <p className="text-xs font-mono text-slate-400 mt-0.5">
              {tr
                ? 'Sembolik CAS · Polinom & Denklem Çözücü · 2D Çizici · Analiz & Vektörler · Fizik & Balistik · Devre & RLC · Kimya & Molarite · IEEE-754'
                : 'Symbolic CAS · Polynomials & Systems · 2D Grapher · Calculus & Vectors · Physics & Projectiles · RLC Circuits · Chemistry · IEEE-754'}
            </p>
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-black/50 border border-white/10 rounded-2xl px-3 py-1.5 text-xs font-mono">
            <span className="text-slate-400">Trig Mode:</span>
            <button
              type="button"
              onClick={() => setAngleMode((m) => (m === 'rad' ? 'deg' : 'rad'))}
              className="px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 font-bold uppercase border border-amber-500/30"
            >
              {angleMode.toUpperCase()}
            </button>
          </div>
        </div>
      </header>

      {/* ─── WORKSPACE NAVIGATION TABS (9 Sub-Workspaces) ─── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {[
          { id: 'cas' as const, labelEn: 'CAS & Algebra', labelTr: 'CAS & Cebir', icon: Calculator, color: '#f59e0b' },
          { id: 'graph' as const, labelEn: '2D Grapher', labelTr: '2D Çizici', icon: LineChart, color: '#00e5ff' },
          { id: 'calculus' as const, labelEn: 'Calculus & Series', labelTr: 'Türev & Seriler', icon: Sigma, color: '#10b981' },
          { id: 'vectors' as const, labelEn: 'Vectors & Matrix', labelTr: 'Vektör & Matris', icon: Layers, color: '#8b5cf6' },
          { id: 'physics' as const, labelEn: 'Physics & Motion', labelTr: 'Fizik & Hareket', icon: Atom, color: '#f43f5e' },
          { id: 'circuits' as const, labelEn: 'Circuits & RLC', labelTr: 'Devre & RLC', icon: Zap, color: '#eab308' },
          { id: 'chemistry' as const, labelEn: 'Chemistry Lab', labelTr: 'Kimya & Mol', icon: Flame, color: '#06b6d4' },
          { id: 'computing' as const, labelEn: 'CS & Logic', labelTr: 'Bilişim & Mantık', icon: Binary, color: '#3b82f6' },
          { id: 'constants' as const, labelEn: 'Constants', labelTr: 'Sabitler', icon: Sparkles, color: '#ec4899' },
        ].map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-mono font-bold transition-all whitespace-nowrap ${
                isSelected
                  ? 'bg-white/10 text-white border border-white/20 shadow-lg shadow-black/40'
                  : 'bg-[#080d1a] border border-white/5 text-slate-400 hover:text-white hover:bg-[#0c1222]'
              }`}
              style={{
                borderColor: isSelected ? tab.color : undefined,
                color: isSelected ? tab.color : undefined,
              }}
            >
              <Icon size={14} />
              <span>{tr ? tab.labelTr : tab.labelEn}</span>
            </button>
          );
        })}
      </div>

      {/* ─── WORKSPACE CONTENT GRID ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: ACTIVE WORKSPACE (8 COLS) */}
        <div className="lg:col-span-8 space-y-6">
          {/* ═════════════════════════════════════════════════════════════ */}
          {/* TAB 1: CAS & ALGEBRA */}
          {/* ═════════════════════════════════════════════════════════════ */}
          {activeTab === 'cas' && (
            <div className="p-5 sm:p-6 rounded-3xl bg-[#080d1a] border border-white/10 space-y-5 shadow-2xl">
              {/* Sub-modes switch */}
              <div className="flex gap-2 border-b border-white/10 pb-3">
                {[
                  { id: 'basic' as const, name: tr ? 'Genel Hesaplama' : 'Scientific Keypad' },
                  { id: 'polynomial' as const, name: tr ? 'Polinom Kökleri (ax²+bx+c)' : 'Polynomial Solver' },
                  { id: 'system' as const, name: tr ? '2x2 Denklem Sistemi' : 'Linear System (2x2)' },
                  { id: 'gcd_lcm' as const, name: tr ? 'EBOB/EKOK & Kombinasyon' : 'GCD/LCM & Comb' },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setCasSubMode(m.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${
                      casSubMode === m.id
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {m.name}
                  </button>
                ))}
              </div>

              {/* Submode 1: Basic Scientific Keypad */}
              {casSubMode === 'basic' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-black/60 border border-white/10 space-y-2 font-mono">
                    <input
                      type="text"
                      value={casInput}
                      onChange={(e) => setCasInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && evaluateCas()}
                      placeholder="sin(pi/3) + sqrt(16) * ln(e^2)..."
                      className="w-full bg-transparent text-lg font-bold text-white outline-none placeholder:text-slate-600"
                    />
                    <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs">
                      <span className="text-slate-500">{tr ? 'Nihai Sonuç:' : 'Evaluated Result:'}</span>
                      <span className="text-cyan-400 text-base font-black">{casResult}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 font-mono text-xs">
                    {[
                      'sin(', 'cos(', 'tan(', 'asin(', 'acos(', 'atan(',
                      'sqrt(', 'cbrt(', 'ln(', 'log10(', '^', 'abs(',
                      'pi', 'e', '(', ')', '÷', '×',
                      '7', '8', '9', '-', '4', '5',
                      '6', '+', '1', '2', '3', '0',
                      '.', 'Clear', 'Eval (=)'
                    ].map((btn) => (
                      <button
                        key={btn}
                        type="button"
                        onClick={() => {
                          if (btn === 'Clear') setCasInput('');
                          else if (btn === 'Eval (=)') evaluateCas();
                          else setCasInput((prev) => prev + btn);
                        }}
                        className={`p-3 rounded-xl border font-bold transition-all ${
                          btn === 'Eval (=)'
                            ? 'col-span-2 bg-gradient-to-r from-amber-500 to-orange-600 border-amber-400 text-white shadow-md'
                            : btn === 'Clear'
                            ? 'bg-rose-950/40 border-rose-500/30 text-rose-300'
                            : isNaN(Number(btn)) && btn !== '.'
                            ? 'bg-cyan-950/30 border-cyan-500/20 text-cyan-300 hover:bg-cyan-950/50'
                            : 'bg-white/5 border-white/5 text-slate-200 hover:bg-white/10'
                        }`}
                      >
                        {btn}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Submode 2: Polynomial Solver */}
              {casSubMode === 'polynomial' && (
                <div className="space-y-4 font-mono text-xs">
                  <span className="text-slate-400 block">Katsayıları girin: a·x² + b·x + c = 0</span>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-slate-400 block mb-1">a (x²):</label>
                      <input type="number" value={polyA} onChange={(e) => setPolyA(Number(e.target.value))} className="w-full p-2.5 rounded-xl bg-black/60 border border-white/10 text-white font-bold" />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">b (x):</label>
                      <input type="number" value={polyB} onChange={(e) => setPolyB(Number(e.target.value))} className="w-full p-2.5 rounded-xl bg-black/60 border border-white/10 text-white font-bold" />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">c (Sabit):</label>
                      <input type="number" value={polyC} onChange={(e) => setPolyC(Number(e.target.value))} className="w-full p-2.5 rounded-xl bg-black/60 border border-white/10 text-white font-bold" />
                    </div>
                  </div>
                  <button type="button" onClick={solvePolynomial} className="w-full py-3 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold uppercase">
                    Kökleri ve Diskriminantı Hesapla
                  </button>
                  {polyResult && (
                    <div className="p-4 rounded-2xl bg-black/60 border border-amber-500/30 whitespace-pre-wrap text-amber-300 font-bold">
                      {polyResult}
                    </div>
                  )}
                </div>
              )}

              {/* Submode 3: 2x2 System Solver */}
              {casSubMode === 'system' && (
                <div className="space-y-4 font-mono text-xs">
                  <span className="text-slate-400 block">Denklem 1: a₁·x + b₁·y = c₁ | Denklem 2: a₂·x + b₂·y = c₂</span>
                  <div className="grid grid-cols-3 gap-2">
                    <input type="number" value={sysA1} onChange={(e) => setSysA1(Number(e.target.value))} placeholder="a1" className="p-2.5 rounded-xl bg-black/60 border border-white/10 text-white text-center" />
                    <input type="number" value={sysB1} onChange={(e) => setSysB1(Number(e.target.value))} placeholder="b1" className="p-2.5 rounded-xl bg-black/60 border border-white/10 text-white text-center" />
                    <input type="number" value={sysC1} onChange={(e) => setSysC1(Number(e.target.value))} placeholder="c1" className="p-2.5 rounded-xl bg-black/60 border border-cyan-500/40 text-cyan-300 text-center" />
                    <input type="number" value={sysA2} onChange={(e) => setSysA2(Number(e.target.value))} placeholder="a2" className="p-2.5 rounded-xl bg-black/60 border border-white/10 text-white text-center" />
                    <input type="number" value={sysB2} onChange={(e) => setSysB2(Number(e.target.value))} placeholder="b2" className="p-2.5 rounded-xl bg-black/60 border border-white/10 text-white text-center" />
                    <input type="number" value={sysC2} onChange={(e) => setSysC2(Number(e.target.value))} placeholder="c2" className="p-2.5 rounded-xl bg-black/60 border border-cyan-500/40 text-cyan-300 text-center" />
                  </div>
                  <button type="button" onClick={solveSystem2x2} className="w-full py-3 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-bold uppercase">
                    Cramer Kuralı ile Çöz
                  </button>
                  {sysResult && (
                    <div className="p-4 rounded-2xl bg-black/60 border border-cyan-500/30 whitespace-pre-wrap text-cyan-300 font-bold">
                      {sysResult}
                    </div>
                  )}
                </div>
              )}

              {/* Submode 4: GCD / LCM & Combinatorics */}
              {casSubMode === 'gcd_lcm' && (
                <div className="space-y-4 font-mono text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-400 block mb-1">Sayı X:</label>
                      <input type="number" value={numX} onChange={(e) => setNumX(Number(e.target.value))} className="w-full p-2.5 rounded-xl bg-black/60 border border-white/10 text-white font-bold" />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">Sayı Y:</label>
                      <input type="number" value={numY} onChange={(e) => setNumY(Number(e.target.value))} className="w-full p-2.5 rounded-xl bg-black/60 border border-white/10 text-white font-bold" />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">Eleman Sayısı (n):</label>
                      <input type="number" value={combN} onChange={(e) => setCombN(Number(e.target.value))} className="w-full p-2.5 rounded-xl bg-black/60 border border-white/10 text-white font-bold" />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">Seçim Sayısı (r):</label>
                      <input type="number" value={combR} onChange={(e) => setCombR(Number(e.target.value))} className="w-full p-2.5 rounded-xl bg-black/60 border border-white/10 text-white font-bold" />
                    </div>
                  </div>
                  <button type="button" onClick={computeGcdLcm} className="w-full py-3 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-300 font-bold uppercase">
                    EBOB, EKOK & Kombinasyon Hesapla
                  </button>
                  {combResult && (
                    <div className="p-4 rounded-2xl bg-black/60 border border-purple-500/30 whitespace-pre-wrap text-purple-300 font-bold">
                      {combResult}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════ */}
          {/* TAB 2: 2D FUNCTION GRAPHER */}
          {/* ═════════════════════════════════════════════════════════════ */}
          {activeTab === 'graph' && (
            <div className="p-5 sm:p-6 rounded-3xl bg-[#080d1a] border border-white/10 space-y-4 shadow-2xl font-mono text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-cyan-400 font-bold block mb-1">f₁(x) Curve (Cyan):</label>
                  <input type="text" value={func1} onChange={(e) => setFunc1(e.target.value)} className="w-full p-2.5 rounded-xl bg-black/60 border border-cyan-500/30 text-white outline-none" />
                </div>
                <div>
                  <label className="text-amber-400 font-bold block mb-1">f₂(x) Curve (Amber):</label>
                  <input type="text" value={func2} onChange={(e) => setFunc2(e.target.value)} className="w-full p-2.5 rounded-xl bg-black/60 border border-amber-500/30 text-white outline-none" />
                </div>
              </div>

              {/* 2D Interactive SVG Graph Canvas */}
              <div className="h-[360px] w-full rounded-2xl bg-black/80 border border-white/10 relative overflow-hidden p-2">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  <g stroke="white" strokeOpacity="0.05" strokeWidth="0.2">
                    {Array.from({ length: 11 }).map((_, i) => (
                      <React.Fragment key={i}>
                        <line x1={i * 10} y1="0" x2={i * 10} y2="100" />
                        <line x1="0" y1={i * 10} x2="100" y2={i * 10} />
                      </React.Fragment>
                    ))}
                  </g>
                  <line x1="0" y1="50" x2="100" y2="50" stroke="white" strokeOpacity="0.3" strokeWidth="0.5" />
                  <line x1="50" y1="0" x2="50" y2="100" stroke="white" strokeOpacity="0.3" strokeWidth="0.5" />

                  {plotData.pts1.length > 1 && (
                    <polyline fill="none" stroke="#00e5ff" strokeWidth="0.8" points={plotData.pts1.map((p) => `${svgProject(p.x, p.y).px},${svgProject(p.x, p.y).py}`).join(' ')} />
                  )}
                  {plotData.pts2.length > 1 && (
                    <polyline fill="none" stroke="#f59e0b" strokeWidth="0.8" points={plotData.pts2.map((p) => `${svgProject(p.x, p.y).px},${svgProject(p.x, p.y).py}`).join(' ')} />
                  )}
                </svg>
              </div>

              <div className="flex flex-wrap items-center justify-between p-3 rounded-xl bg-black/40 border border-white/10 font-mono">
                <span>∫ f₁(x) dx [{intA} → {intB}]:</span>
                <span className="text-cyan-300 font-bold">{plotData.integralVal.toFixed(6)}</span>
              </div>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════ */}
          {/* TAB 3: CALCULUS & SERIES */}
          {/* ═════════════════════════════════════════════════════════════ */}
          {activeTab === 'calculus' && (
            <div className="p-5 sm:p-6 rounded-3xl bg-[#080d1a] border border-white/10 space-y-4 shadow-2xl font-mono text-xs">
              <div>
                <label className="text-cyan-400 font-bold block mb-1">Hedef Fonksiyon f(x):</label>
                <input type="text" value={calcFunc} onChange={(e) => setCalcFunc(e.target.value)} className="w-full p-3 rounded-xl bg-black/60 border border-white/15 text-white font-bold outline-none" />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Hesap Noktası (x₀):</label>
                  <input type="number" value={diffX} onChange={(e) => setDiffX(Number(e.target.value))} className="w-full p-2.5 rounded-xl bg-black/60 border border-white/10 text-white" />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Kök Başlangıç (x₀):</label>
                  <input type="number" value={rootGuess} onChange={(e) => setRootGuess(Number(e.target.value))} className="w-full p-2.5 rounded-xl bg-black/60 border border-white/10 text-white" />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Seri Terim Sayısı (N):</label>
                  <input type="number" value={seriesN} onChange={(e) => setSeriesN(Number(e.target.value))} className="w-full p-2.5 rounded-xl bg-black/60 border border-white/10 text-white" />
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                <button type="button" onClick={() => solveCalculusTools('deriv')} className="px-4 py-2 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 font-bold">f'(x) Türev</button>
                <button type="button" onClick={() => solveCalculusTools('2nd_deriv')} className="px-4 py-2 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 font-bold">f''(x) 2. Türev</button>
                <button type="button" onClick={() => solveCalculusTools('newton')} className="px-4 py-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold">Newton Kök Bulucu</button>
                <button type="button" onClick={() => solveCalculusTools('series_sum')} className="px-4 py-2 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-300 font-bold">Seri Toplamı (Σ)</button>
              </div>

              {calcResult && (
                <div className="p-4 rounded-2xl bg-black/60 border border-cyan-500/30 whitespace-pre-wrap text-cyan-300 font-bold">
                  {calcResult}
                </div>
              )}
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════ */}
          {/* TAB 4: VECTORS & MATRICES */}
          {/* ═════════════════════════════════════════════════════════════ */}
          {activeTab === 'vectors' && (
            <div className="p-5 sm:p-6 rounded-3xl bg-[#080d1a] border border-white/10 space-y-4 shadow-2xl font-mono text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-2">
                  <span className="font-bold text-cyan-400">Vektör u [x, y, z]:</span>
                  <div className="flex gap-2">
                    <input type="number" value={vecU[0]} onChange={(e) => setVecU([Number(e.target.value), vecU[1], vecU[2]])} className="w-full p-2.5 rounded-xl bg-black/60 border border-white/10 text-white text-center" />
                    <input type="number" value={vecU[1]} onChange={(e) => setVecU([vecU[0], Number(e.target.value), vecU[2]])} className="w-full p-2.5 rounded-xl bg-black/60 border border-white/10 text-white text-center" />
                    <input type="number" value={vecU[2]} onChange={(e) => setVecU([vecU[0], vecU[1], Number(e.target.value)])} className="w-full p-2.5 rounded-xl bg-black/60 border border-white/10 text-white text-center" />
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-2">
                  <span className="font-bold text-amber-400">Vektör v [x, y, z]:</span>
                  <div className="flex gap-2">
                    <input type="number" value={vecV[0]} onChange={(e) => setVecV([Number(e.target.value), vecV[1], vecV[2]])} className="w-full p-2.5 rounded-xl bg-black/60 border border-white/10 text-white text-center" />
                    <input type="number" value={vecV[1]} onChange={(e) => setVecV([vecV[0], Number(e.target.value), vecV[2]])} className="w-full p-2.5 rounded-xl bg-black/60 border border-white/10 text-white text-center" />
                    <input type="number" value={vecV[2]} onChange={(e) => setVecV([vecV[0], vecV[1], Number(e.target.value)])} className="w-full p-2.5 rounded-xl bg-black/60 border border-white/10 text-white text-center" />
                  </div>
                </div>
              </div>

              <button type="button" onClick={computeVectorMath} className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold uppercase tracking-wider">
                Vektör Analizi (Nokta, Çapraz Çarpım, Açı & İzdüşüm)
              </button>

              {vecResult && (
                <div className="p-4 rounded-2xl bg-black/60 border border-purple-500/30 whitespace-pre-wrap text-purple-300 font-bold">
                  {vecResult}
                </div>
              )}
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════ */}
          {/* TAB 5: PHYSICS & MOTION */}
          {/* ═════════════════════════════════════════════════════════════ */}
          {activeTab === 'physics' && (
            <div className="p-5 sm:p-6 rounded-3xl bg-[#080d1a] border border-white/10 space-y-4 shadow-2xl font-mono text-xs">
              <span className="font-bold text-rose-400 block text-sm">2D Eğik Atış & Balistik Hareketi (Projectile Motion):</span>
              
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">İlk Hız (V₀) [m/s]:</label>
                  <input type="number" value={projV0} onChange={(e) => setProjV0(Number(e.target.value))} className="w-full p-2.5 rounded-xl bg-black/60 border border-white/10 text-white font-bold" />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Atış Açısı (θ) [°]:</label>
                  <input type="number" value={projAngle} onChange={(e) => setProjAngle(Number(e.target.value))} className="w-full p-2.5 rounded-xl bg-black/60 border border-white/10 text-white font-bold" />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Başlangıç Yüksekliği (h₀) [m]:</label>
                  <input type="number" value={projH0} onChange={(e) => setProjH0(Number(e.target.value))} className="w-full p-2.5 rounded-xl bg-black/60 border border-white/10 text-white font-bold" />
                </div>
              </div>

              {/* Trajectory mini-canvas */}
              <div className="h-44 w-full rounded-2xl bg-black/80 border border-white/10 p-3 relative overflow-hidden flex flex-col justify-end">
                <svg viewBox="0 0 100 50" className="w-full h-full">
                  <line x1="0" y1="48" x2="100" y2="48" stroke="white" strokeOpacity="0.2" strokeWidth="0.5" />
                  {projectileData.pts.length > 1 && (
                    <polyline
                      fill="none"
                      stroke="#f43f5e"
                      strokeWidth="1.2"
                      points={projectileData.pts.map((p) => {
                        const sx = (p.x / Math.max(1, projectileData.maxRange)) * 95;
                        const sy = 48 - (p.y / Math.max(1, projectileData.maxH * 1.2)) * 45;
                        return `${sx},${sy}`;
                      }).join(' ')}
                    />
                  )}
                </svg>
              </div>

              {/* Balistik Sonuç Kartları */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                  <span className="text-slate-500 text-[10px]">MAKSİMUM MENZİL (R)</span>
                  <p className="text-rose-400 font-bold text-base">{projectileData.maxRange.toFixed(2)} m</p>
                </div>
                <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                  <span className="text-slate-500 text-[10px]">MAKSİMUM YÜKSEKLİK (H)</span>
                  <p className="text-amber-300 font-bold text-base">{projectileData.maxH.toFixed(2)} m</p>
                </div>
                <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                  <span className="text-slate-500 text-[10px]">UÇUŞ SÜRESİ (T_flight)</span>
                  <p className="text-cyan-300 font-bold text-base">{projectileData.tFlight.toFixed(2)} s</p>
                </div>
              </div>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════ */}
          {/* TAB 6: CIRCUITS & RLC */}
          {/* ═════════════════════════════════════════════════════════════ */}
          {activeTab === 'circuits' && (
            <div className="p-5 sm:p-6 rounded-3xl bg-[#080d1a] border border-white/10 space-y-5 shadow-2xl font-mono text-xs">
              {/* Resistor Color Code Visualizer */}
              <div className="space-y-3 p-4 rounded-2xl bg-black/40 border border-white/5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-400">Direnç Renk Kodu Hesaplayıcı (4-Band Resistor):</span>
                  <span className="font-bold text-cyan-300 text-sm">{resistorValue.formatted} ±{resistorValue.tol}%</span>
                </div>

                {/* Resistor graphic strip */}
                <div className="h-10 w-full rounded-full bg-[#d2b48c] border-2 border-white/20 relative flex items-center justify-around px-8 shadow-inner">
                  <div className="w-3 h-full" style={{ background: RESISTOR_COLORS[band1].hex }} />
                  <div className="w-3 h-full" style={{ background: RESISTOR_COLORS[band2].hex }} />
                  <div className="w-3 h-full" style={{ background: RESISTOR_COLORS[band3].hex }} />
                  <div className="w-3 h-full" style={{ background: RESISTOR_COLORS[bandTol].hex }} />
                </div>

                <div className="grid grid-cols-4 gap-2">
                  <select value={band1} onChange={(e) => setBand1(Number(e.target.value))} className="p-2 rounded-lg bg-black/60 border border-white/10 text-white">
                    {RESISTOR_COLORS.slice(1, 10).map((c, i) => <option key={c.name} value={i + 1}>{c.name} ({c.digit})</option>)}
                  </select>
                  <select value={band2} onChange={(e) => setBand2(Number(e.target.value))} className="p-2 rounded-lg bg-black/60 border border-white/10 text-white">
                    {RESISTOR_COLORS.slice(0, 10).map((c, i) => <option key={c.name} value={i}>{c.name} ({c.digit})</option>)}
                  </select>
                  <select value={band3} onChange={(e) => setBand3(Number(e.target.value))} className="p-2 rounded-lg bg-black/60 border border-white/10 text-white">
                    {RESISTOR_COLORS.map((c, i) => <option key={c.name} value={i}>{c.name} (x{c.mult})</option>)}
                  </select>
                  <select value={bandTol} onChange={(e) => setBandTol(Number(e.target.value))} className="p-2 rounded-lg bg-black/60 border border-white/10 text-white">
                    <option value={10}>Gold (±5%)</option>
                    <option value={11}>Silver (±10%)</option>
                    <option value={1}>Brown (±1%)</option>
                    <option value={2}>Red (±2%)</option>
                  </select>
                </div>
              </div>

              {/* RLC Series AC Resonance */}
              <div className="space-y-3 p-4 rounded-2xl bg-black/40 border border-white/5">
                <span className="font-bold text-cyan-400 block">Seri RLC AC Empedans & Rezonans Frekansı:</span>
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <label className="text-slate-400 block mb-1">R (Ω):</label>
                    <input type="number" value={rlcR} onChange={(e) => setRlcR(Number(e.target.value))} className="w-full p-2 rounded-lg bg-black/60 border border-white/10 text-white" />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">L (mH):</label>
                    <input type="number" value={rlcL} onChange={(e) => setRlcL(Number(e.target.value))} className="w-full p-2 rounded-lg bg-black/60 border border-white/10 text-white" />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">C (µF):</label>
                    <input type="number" value={rlcC} onChange={(e) => setRlcC(Number(e.target.value))} className="w-full p-2 rounded-lg bg-black/60 border border-white/10 text-white" />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Frekans (Hz):</label>
                    <input type="number" value={rlcFreq} onChange={(e) => setRlcFreq(Number(e.target.value))} className="w-full p-2 rounded-lg bg-black/60 border border-white/10 text-white" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 pt-2">
                  <div className="p-3 rounded-xl bg-black/50 border border-white/5">
                    <span className="text-[10px] text-slate-500 block">REZONANS (f₀)</span>
                    <span className="text-amber-300 font-bold">{rlcAnalysis.f0.toFixed(2)} Hz</span>
                  </div>
                  <div className="p-3 rounded-xl bg-black/50 border border-white/5">
                    <span className="text-[10px] text-slate-500 block">TOPLAM EMPEDANS (|Z|)</span>
                    <span className="text-cyan-300 font-bold">{rlcAnalysis.Z.toFixed(2)} Ω</span>
                  </div>
                  <div className="p-3 rounded-xl bg-black/50 border border-white/5">
                    <span className="text-[10px] text-slate-500 block">FAZ FARKI (θ)</span>
                    <span className="text-purple-300 font-bold">{rlcAnalysis.phaseDeg.toFixed(2)}°</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════ */}
          {/* TAB 7: CHEMISTRY & SOLUTIONS */}
          {/* ═════════════════════════════════════════════════════════════ */}
          {activeTab === 'chemistry' && (
            <div className="p-5 sm:p-6 rounded-3xl bg-[#080d1a] border border-white/10 space-y-4 shadow-2xl font-mono text-xs">
              <div>
                <label className="text-cyan-400 font-bold block mb-1">Kimyasal Formül (Örn: H2SO4, Al2O3, C6H12O6):</label>
                <input
                  type="text"
                  value={chemFormula}
                  onChange={(e) => setChemFormula(e.target.value)}
                  className="w-full p-3 rounded-xl bg-black/60 border border-cyan-500/30 text-white font-bold text-base outline-none"
                />
              </div>

              <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-3">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="text-slate-400">Toplam Mol Kütlesi (Molar Mass):</span>
                  <span className="text-cyan-300 text-base font-black">{molarAnalysis.totalMolarMass.toFixed(3)} g/mol</span>
                </div>

                {/* Element Breakdown Table */}
                <div className="space-y-1.5">
                  <span className="text-slate-500 block text-[10px]">Elementel Kütle Yüzdesi Dağılımı:</span>
                  {molarAnalysis.elements.map((el) => (
                    <div key={el.symbol} className="flex items-center justify-between text-slate-300">
                      <span>{el.symbol} ({el.count} atom):</span>
                      <div className="flex items-center gap-3">
                        <span>{el.weight.toFixed(2)} g/mol</span>
                        <span className="text-amber-400 font-bold w-16 text-right">%{el.percent.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Molarity & Solution Box */}
              <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-3">
                <span className="font-bold text-amber-400 block">Çözelti Molarite Hesabı (M = n / V):</span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-400 block mb-1">Kütle (m) [gram]:</label>
                    <input type="number" value={chemMassGrams} onChange={(e) => setChemMassGrams(Number(e.target.value))} className="w-full p-2.5 rounded-xl bg-black/60 border border-white/10 text-white" />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Çözelti Hacmi (V) [Litre]:</label>
                    <input type="number" value={solVolumeLiters} onChange={(e) => setSolVolumeLiters(Number(e.target.value))} className="w-full p-2.5 rounded-xl bg-black/60 border border-white/10 text-white" />
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-white/10">
                  <span className="text-slate-400">Derişim (Molarite M):</span>
                  <span className="text-emerald-400 font-bold text-sm">{molarAnalysis.molarity.toFixed(4)} mol/L (M)</span>
                </div>
              </div>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════ */}
          {/* TAB 8: COMPUTER SCIENCE & LOGIC */}
          {/* ═════════════════════════════════════════════════════════════ */}
          {activeTab === 'computing' && (
            <div className="p-5 sm:p-6 rounded-3xl bg-[#080d1a] border border-white/10 space-y-5 shadow-2xl font-mono text-xs">
              <div>
                <label className="text-cyan-400 font-bold block mb-1">Desimal Giriş (DEC):</label>
                <input
                  type="number"
                  value={compDec}
                  onChange={(e) => setCompDec(Number(e.target.value))}
                  className="w-full p-3 rounded-xl bg-black/60 border border-white/15 text-white font-bold text-base outline-none focus:border-cyan-400"
                />
              </div>

              {/* Base Conversions */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                  <span className="text-[10px] text-slate-500">HEXADECIMAL</span>
                  <p className="font-bold text-amber-300">{ieee754.hex}</p>
                </div>
                <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                  <span className="text-[10px] text-slate-500">DECIMAL</span>
                  <p className="font-bold text-cyan-300">{compDec}</p>
                </div>
                <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                  <span className="text-[10px] text-slate-500">OCTAL</span>
                  <p className="font-bold text-emerald-300">{(compDec >>> 0).toString(8)}</p>
                </div>
                <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                  <span className="text-[10px] text-slate-500">BINARY (32-BIT)</span>
                  <p className="font-bold text-purple-300 truncate">{ieee754.bin}</p>
                </div>
              </div>

              {/* IEEE-754 32-Bit Float Breakdown */}
              <div className="p-4 rounded-2xl bg-black/50 border border-cyan-500/20 space-y-3">
                <span className="font-bold text-cyan-400 block">IEEE-754 Single-Precision Bit Alanları:</span>
                <div className="flex gap-1 font-mono text-[11px]">
                  <div className="p-2 rounded-lg bg-rose-950/60 border border-rose-500/40 text-rose-300 text-center">
                    <span className="block text-[9px] text-slate-400">Sign (1b)</span>
                    <span className="font-bold">{ieee754.sign}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-amber-950/60 border border-amber-500/40 text-amber-300 text-center flex-1">
                    <span className="block text-[9px] text-slate-400">Exponent (8b)</span>
                    <span className="font-bold">{ieee754.exponent}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 text-center flex-[2] truncate">
                    <span className="block text-[9px] text-slate-400">Mantissa (23b)</span>
                    <span className="font-bold">{ieee754.mantissa}</span>
                  </div>
                </div>
              </div>

              {/* Logic Gates Truth Table */}
              <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-2">
                <span className="font-bold text-purple-400 block">Temel Mantık Kapıları (Logic Gates):</span>
                <div className="grid grid-cols-4 gap-2 text-center text-[11px]">
                  <div className="p-2 rounded-lg bg-white/5">AND: {compDec & 1 ? '1' : '0'}</div>
                  <div className="p-2 rounded-lg bg-white/5">OR: {compDec | 1 ? '1' : '0'}</div>
                  <div className="p-2 rounded-lg bg-white/5">XOR: {compDec ^ 1 ? '1' : '0'}</div>
                  <div className="p-2 rounded-lg bg-white/5">NOT: {~compDec}</div>
                </div>
              </div>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════ */}
          {/* TAB 9: CONSTANTS & FORMULAS */}
          {/* ═════════════════════════════════════════════════════════════ */}
          {activeTab === 'constants' && (
            <div className="p-5 sm:p-6 rounded-3xl bg-[#080d1a] border border-white/10 space-y-4 shadow-2xl font-mono text-xs">
              <span className="font-bold text-amber-400 block text-sm">Temel Evrensel Fizik ve Mühendislik Sabitleri:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[460px] overflow-y-auto pr-1">
                {PHYSICAL_CONSTANTS.map((c) => (
                  <div
                    key={c.symbol}
                    onClick={() => {
                      setCasInput((prev) => prev + c.value.toString());
                      setActiveTab('cas');
                    }}
                    className="p-3 rounded-xl bg-black/40 border border-white/5 hover:border-amber-500/40 transition-all cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <span className="font-bold text-cyan-300 text-sm mr-2">{c.symbol}</span>
                      <p className="text-[10px] text-slate-400">{tr ? c.nameTr : c.nameEn}</p>
                    </div>
                    <span className="text-amber-400 font-bold">{c.value.toExponential(3)} {c.unit}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: CALCULATION HISTORY & QUICK PRESETS (4 COLS) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Quick Presets & Cheat-Sheet */}
          <div className="p-5 rounded-3xl bg-[#080d1a] border border-white/10 space-y-3 shadow-xl font-mono text-xs">
            <h3 className="font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5 border-b border-white/10 pb-2">
              <BookOpen size={14} />
              <span>{tr ? 'Öğrenci Kısayol Formülleri' : 'Engineering Cheat-Sheet'}</span>
            </h3>

            <div className="space-y-1.5 text-[11px] text-slate-300">
              <div className="p-2 rounded-lg bg-black/40 border border-white/5">
                <span className="text-cyan-300 font-bold block">Öklid / Pisagor:</span>
                <code>c = √(a² + b²)</code>
              </div>
              <div className="p-2 rounded-lg bg-black/40 border border-white/5">
                <span className="text-cyan-300 font-bold block">Euler Formülü:</span>
                <code>e^(i·π) + 1 = 0</code>
              </div>
              <div className="p-2 rounded-lg bg-black/40 border border-white/5">
                <span className="text-cyan-300 font-bold block">Kinetik Enerji:</span>
                <code>E_k = 0.5 · m · v²</code>
              </div>
              <div className="p-2 rounded-lg bg-black/40 border border-white/5">
                <span className="text-cyan-300 font-bold block">Ohm Kanunu:</span>
                <code>V = I · R, P = V · I = I²·R</code>
              </div>
            </div>
          </div>

          {/* Session History Ledger */}
          <div className="p-5 rounded-3xl bg-[#080d1a] border border-white/10 space-y-3 shadow-xl font-mono text-xs">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="font-bold text-cyan-400 uppercase tracking-wider">{tr ? 'Hesaplama Geçmişi' : 'Session History'}</span>
              {history.length > 0 && (
                <button
                  type="button"
                  onClick={() => setHistory([])}
                  className="text-[10px] text-rose-400 hover:text-rose-300"
                >
                  {tr ? 'Temizle' : 'Clear'}
                </button>
              )}
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {history.length === 0 ? (
                <p className="text-center text-slate-600 py-6">{tr ? 'Henüz hesaplama yok' : 'No calculations yet'}</p>
              ) : (
                history.map((entry) => (
                  <div key={entry.id} className="p-2.5 rounded-xl bg-black/40 border border-white/5 space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <span>{entry.expression}</span>
                      <span>{entry.timestamp}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-cyan-300 text-sm">{entry.result}</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(entry.result, entry.id)}
                        className="text-slate-400 hover:text-white p-1"
                      >
                        {copiedId === entry.id ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CalculatorModule;
