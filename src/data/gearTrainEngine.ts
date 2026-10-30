/**
 * gearTrainEngine.ts
 * Multi-Gear & Compound (Coaxial) Gear Train Kinematic & Manufacturing Engine
 * Conforms to ISO 6336, DIN 3960, DIN 3962, ISO 1328 & AGMA standards.
 * Supports External, Internal Ring, Hybrid, and Integrated Planetary Stages.
 */

import { calculateIso6336Mesh, elasticConstantsForGearMaterial } from '@/lib/iso6336';
import { ratePlanetaryStage } from '@/lib/planetaryRating';
import { GEAR_MATERIALS } from '@/data/gearsData';

export type GearKind = 'external' | 'internal' | 'planetary_stage' | 'hybrid';

export type PlanetaryMode = 
  | 'fixed_ring_carrier_out'   // Ring Fixed, Sun In -> Carrier Out (Standard Reducer: i = 1 + z_r/z_s, same dir)
  | 'fixed_sun_carrier_out'    // Sun Fixed, Ring In -> Carrier Out (Low-Ratio Reducer: i = (z_s + z_r)/z_r, same dir)
  | 'fixed_carrier_ring_out'   // Carrier Fixed, Sun In -> Ring Out (Inverting Reducer: i = -z_r/z_s, reverse dir)
  | 'fixed_carrier_sun_out'    // Carrier Fixed, Ring In -> Sun Out (Inverting Increaser: i = -z_s/z_r, reverse dir)
  | 'fixed_ring_sun_out'       // Ring Fixed, Carrier In -> Sun Out (Speed Increaser: i = 1 / (1 + z_r/z_s), same dir)
  | 'fixed_sun_ring_out';      // Sun Fixed, Carrier In -> Ring Out (Speed Increaser: i = z_r / (z_s + z_r), same dir)

export interface GearTrainNode {
  id: string;
  name: string;
  shaftId: number;           // Shaft index (1 for input, 2 for intermediate, etc.)
  isCoaxial: boolean;        // True if mounted coaxially on the same shaft as previous gear
  gearType?: GearKind;       // 'external' | 'internal' | 'planetary_stage' | 'hybrid'
  planetaryMode?: PlanetaryMode; // Kinematic configuration based on stationary element
  numPlanets?: number;       // Number of planets (default 3, or 4)
  teeth: number;             // Number of teeth (z or z_sun for planetary)
  planetTeeth?: number;      // For planetary stage: planet teeth (z_p)
  ringTeeth?: number;        // For planetary stage: ring teeth (z_r = z_s + 2*z_p)
  module: number;            // Normal module (m_n in mm)
  helixAngle: number;        // Helix angle (beta in degrees)
  pressureAngle: number;     // Pressure angle (alpha in degrees, typically 20)
  faceWidth: number;         // Face width (b in mm)
  profileShift: number;      // Profile shift factor (x)
  material: string;          // Material key (e.g., '16MnCr5', '42CrMo4')
  meshWithId?: string;       // ID of the driving gear that meshes with this gear
}

export interface GearCalculatedData {
  id: string;
  name: string;
  shaftId: number;
  isCoaxial: boolean;
  gearType: GearKind;
  planetaryMode?: PlanetaryMode;
  numPlanets?: number;
  teeth: number;
  planetTeeth?: number;
  ringTeeth?: number;
  module: number;
  helixAngle: number;
  pressureAngle: number;
  faceWidth: number;
  profileShift: number;
  material: string;
  meshWithId?: string;

  // Kinematic Results
  rpm: number;
  torque: number;
  rotationDir: 'cw' | 'ccw';
  stageRatio: number;
  pitchVelocity: number;

  // Geometric Parameters
  mt: number;                // Transverse module
  alpha_t: number;           // Transverse pressure angle (rad)
  d: number;                 // Pitch diameter (mm)
  da: number;                // Tip diameter (mm)
  df: number;                // Root diameter (mm)
  db: number;                // Base diameter (mm)
  ha: number;                // Addendum (mm)
  hf: number;                // Dedendum (mm)
  h: number;                 // Total tooth height (mm)
  p: number;                 // Pitch (mm)
  pb: number;                // Base pitch (mm)
  s: number;                 // Normal tooth thickness (mm)
  e: number;                 // Tooth space width (mm)

  // Manufacturing & Inspection Data
  chordalThickness: number;  // Kiriş Diş Kalınlığı (s_bar)
  chordalAddendum: number;   // Kiriş Baş Yüksekliği (ha_bar)
  wildhaberW: number;        // Wildhaber W-ölçüsü (Base tangent length)
  wildhaberK: number;        // Span teeth count (k)
  pinDiameter: number;       // Measurement pin diameter (dp)
  dimensionOverPins: number; // Pimler/Bilyalar üzeri ölçü (M_d)

  // Quality & Machining Recommendations
  qualityGrade: number;      // ISO 1328 Grade (e.g. 6)
  radialRunoutFr: number;    // Radyal salgı toleransı (µm)
  pitchErrorFp: number;      // Toplam adım hatası (µm)
  profileErrorFf: number;    // Profil form sapması (µm)
  recMachining: string;      // Önerilen talaşlı imalat yöntemi
  cuttingSpeedVc: number;    // Kesme hızı (m/min)
  feedFz: number;            // İlerleme (mm/dev)
  machiningTimeSec: number;  // Tahmini diş açma süresi (sn)
  caseDepthCHD: string;      // Sementasyon derinliği (mm)
  coreStrength: string;      // Çekirdek mukavemeti
  surfaceHardness: string;   // Yüzey sertliği (HRC)

  // Diş Geometrisi Güvenilirlik Kontrolleri (Undercut & Pointing)
  isUndercut: boolean;       // Alttan kesilme riski (z < z_min)
  isPointed: boolean;        // Diş tepesi sivrilme riski (sa < 0.25*mn)
  topLandThickness: number;  // Diş üstü kalınlığı (sa in mm)
  transverseContactRatio: number; // Profil kavrama oranı (epsilon_alpha)
  overlapRatio: number;      // Adım kavrama oranı (epsilon_beta)
  totalContactRatio: number; // Toplam kavrama oranı (epsilon_gamma)

  // Diş Kuvvetleri & Mukavemet (ISO 6336)
  Ft: number;                // Çevresel teğetsel kuvvet (N)
  Fr: number;                // Radyal kuvvet (N)
  Fa: number;                // Eksenel kuvvet (N)
  Fn: number;                // Normal kavrama kuvveti (N)
  sigma_F: number;           // Diş dibi eğilme gerilmesi (MPa)
  SF_bending: number;        // Diş dibi eğilme emniyet katsayısı
  sigma_H: number;           // Yüzey ezilme gerilmesi (MPa)
  SF_contact: number;        // Yüzey ezilme (pitting) emniyet katsayısı
  minShaftDiameter: number;  // Burulmaya göre minimum mil çapı (mm)

  planetaryDetails?: {
    mode?: PlanetaryMode;
    modeLabel?: string;
    sun: any;
    planet: any;
    ring: any;
    carrier: {
      orbitDia: number;
      numPlanets: number;
      assemblyConditionOk: boolean;
      assemblyRemainder: number;
      proximityConditionOk: boolean;
      maxAllowedPlanetDia: number;
      reactionTorqueNm: number;
      carrierRpm: number;
      carrierTorqueNm: number;
    };
  };

  validationErrors?: GearValidationError[];
  isImpossible?: boolean;
}

export interface GearValidationError {
  gearId: string;
  gearName: string;
  severity: 'critical_impossible' | 'warning';
  titleTr: string;
  titleEn: string;
  messageTr: string;
  messageEn: string;
  remedyTr: string;
  remedyEn: string;
}

export interface ShaftLayoutInfo {
  shaftId: number;
  rpm: number;
  torque: number;
  rotationDir: 'cw' | 'ccw';
  gearIds: string[];
  xPos: number;              // 2D schematic X coordinate (relative mm)
  yPos: number;              // 2D schematic Y coordinate
}

export interface GearTrainAnalysisResult {
  gears: GearCalculatedData[];
  shafts: ShaftLayoutInfo[];
  totalRatio: number;
  inputRpm: number;
  inputPowerKW: number;
  inputTorqueNm: number;
  outputRpm: number;
  outputTorqueNm: number;
  overallEfficiency: number;
  totalPowerLossKW: number;
  heatDissipationReqKW: number;
  lubrication: string;
  centerDistances: { fromGear: string; toGear: string; a: number }[];
  validationErrors: GearValidationError[];
  isImpossible: boolean;
}

/**
 * Standard Involute Function: inv(alpha) = tan(alpha) - alpha
 */
export function inv(rad: number): number {
  return Math.tan(rad) - rad;
}

/**
 * Inverse Involute approximation
 */
export function invInv(involute: number): number {
  let alpha = Math.pow(3 * involute, 1 / 3);
  for (let i = 0; i < 5; i++) {
    const diff = inv(alpha) - involute;
    const deriv = Math.tan(alpha) * Math.tan(alpha);
    if (Math.abs(deriv) < 1e-10) break;
    alpha -= diff / deriv;
  }
  return alpha;
}

/**
 * Compute detailed manufacturing and inspection passport data for a single gear.
 */
export function computeGearManufacturingData(
  z: number,
  mn: number,
  betaDeg: number = 0,
  alphaDeg: number = 20,
  x: number = 0,
  b: number = 30,
  material: string = '16MnCr5',
  rpm: number = 1450,
  torque: number = 20,
  gearType: GearKind = 'external',
  mateTeeth: number = 0
): Omit<GearCalculatedData, 'id' | 'name' | 'shaftId' | 'isCoaxial' | 'meshWithId' | 'rotationDir' | 'stageRatio' | 'gearType'> {
  const betaRad = (betaDeg * Math.PI) / 180;
  const alphaRad = (alphaDeg * Math.PI) / 180;

  // Transverse parameters
  const mt = betaDeg > 0 ? mn / Math.cos(betaRad) : mn;
  const alpha_t = Math.atan(Math.tan(alphaRad) / Math.cos(betaRad));

  // Pitch, base, tip and root diameters
  const d = z * mt;
  const db = d * Math.cos(alpha_t);
  const ha = mn * (1.0 + x);
  const hf = mn * (1.25 - x);
  const h = ha + hf;
  const da = gearType === 'internal' ? d - 2 * ha : d + 2 * ha;
  const df = gearType === 'internal' ? d + 2 * hf : d - 2 * hf;

  const p = Math.PI * mt;
  const pb = p * Math.cos(alpha_t);

  // Normal tooth thickness and space width
  const s = (Math.PI * mn) / 2 + 2 * x * mn * Math.tan(alphaRad);
  const e = Math.PI * mn - s;

  // Chordal tooth thickness & chordal addendum (Kiriş ölçümleri)
  const gamma = (90 / z) * (Math.PI / 180);
  const chordalThickness = d * Math.sin(gamma) + 2 * x * mn * Math.cos(alphaRad);
  const chordalAddendum = ha + (d / 2) * (1 - Math.cos(gamma));

  // Wildhaber Base Tangent Length (W_k)
  const kFloat = z * (alpha_t / Math.PI) + 0.5 + (2 * x * Math.tan(alphaRad)) / Math.PI;
  const wildhaberK = Math.max(2, Math.min(z - 1, Math.round(kFloat)));
  const invAlpha_t = inv(alpha_t);
  const wildhaberW =
    mn *
    Math.cos(alphaRad) *
    (Math.PI * (wildhaberK - 0.5) + z * invAlpha_t + 2 * x * Math.tan(alphaRad));

  // Dimension over pins (Md)
  const pinDiameter = Number((1.7 * mn).toFixed(2));
  const invAlphaM = inv(alpha_t) + pinDiameter / db - (Math.PI / (2 * z) - (2 * x * Math.tan(alphaRad)) / z);
  const alphaM = invInv(Math.max(0.001, invAlphaM));
  const dm = db / Math.cos(alphaM);
  let dimensionOverPins = 0;
  if (z % 2 === 0) {
    dimensionOverPins = dm + pinDiameter;
  } else {
    dimensionOverPins = dm * Math.cos((90 / z) * (Math.PI / 180)) + pinDiameter;
  }

  // Pitch line velocity
  const pitchVelocity = (Math.PI * d * rpm) / 60000;

  // ISO 1328 Grade 6/7 tolerances (DIN 3962)
  const Fr_tol = Number((0.8 * Math.sqrt(d) + 0.2 * mn + 6).toFixed(1)); // Radial runout
  const Fp = Number((1.2 * Math.sqrt(d) + 0.4 * mn + 10).toFixed(1)); // Cumulative pitch error
  const Ff = Number((0.5 * Math.sqrt(mn) + 0.1 * Math.sqrt(d) + 4).toFixed(1)); // Profile form deviation

  // Machining data
  const recMachining =
    gearType === 'internal'
      ? 'Fellows Dişli Planyası (Shaping) / Broşlama (Broaching) + İndüksiyon Sertleştirme'
      : gearType === 'planetary_stage'
      ? 'CNC Azdırma (Güneş/Planet) + Dişli Profil Taşlama (DIN 6) + Halka Planyalama'
      : mn <= 6
      ? 'CNC Azdırma (Hobbing) + Sementasyon + Dişli Profil Taşlama (DIN 6)'
      : 'Ağır Hizmet Azdırma (Hobbing) + Gerilim Giderme + DIN 7 Hassas Taşlama';

  const cuttingSpeedVc = material.toLowerCase().includes('16mn') ? 95 : 75; // m/min
  const feedFz = Number((0.25 * Math.sqrt(mn)).toFixed(2)); // mm/rev
  const machiningTimeSec = Math.round((Math.PI * d * b * 0.08) / (cuttingSpeedVc * feedFz) + z * 1.5);

  const caseDepthCHD = `${(0.12 * mn).toFixed(2)} – ${(0.22 * mn).toFixed(2)} mm`;
  const coreStrength = material.toLowerCase().includes('16mn') ? '850 – 1100 MPa' : '950 – 1250 MPa';
  const surfaceHardness = '58 – 62 HRC (Derin Sementasyon & Meneviş)';

  // ═══ Diş Kuvvetleri (Forces in N) ═══
  const Ft = d > 0 ? Number(((2000 * Math.abs(torque)) / d).toFixed(1)) : 0;
  const betaRadForForce = (betaDeg * Math.PI) / 180;
  const Fr = Number((Ft * (Math.tan(alpha_t) / Math.max(0.1, Math.cos(betaRadForForce)))).toFixed(1));
  const Fa = Number((Ft * Math.tan(betaRadForForce)).toFixed(1));
  const Fn = Number(Math.sqrt(Ft * Ft + Fr * Fr + Fa * Fa).toFixed(1));

  // ═══ Mukavemet & Emniyet (ISO 6336 Method B) ═══
  const matRow = GEAR_MATERIALS.find((row) => material.toLowerCase().includes(row.name.split(' ')[0].toLowerCase()));
  const sigma_Flim = matRow?.sigma_Flim
    ?? (material.toLowerCase().includes('16mn') || material.toLowerCase().includes('20mn')
      ? 430
      : material.toLowerCase().includes('18cr')
        ? 480
        : material.toLowerCase().includes('42cr')
          ? 300
          : material.toLowerCase().includes('c45')
            ? 190
            : 250);
  const sigma_Hlim = matRow?.sigma_Hlim
    ?? (material.toLowerCase().includes('16mn') || material.toLowerCase().includes('20mn')
      ? 1500
      : material.toLowerCase().includes('18cr')
        ? 1590
        : material.toLowerCase().includes('42cr')
          ? 550
          : material.toLowerCase().includes('c45')
            ? 450
            : 500);
  const elastic = elasticConstantsForGearMaterial(material);
  const zMate = mateTeeth > 0 ? mateTeeth : Math.max(z + 8, Math.round(z * 2));
  const iso = calculateIso6336Mesh({
    mn,
    z1: z,
    z2: zMate,
    b,
    alphaNDeg: alphaDeg,
    betaDeg,
    x1: x,
    torqueNm: torque,
    rpmPinion: rpm,
    applicationFactor: 1.25,
    qualityGrade: 6,
    internal: gearType === 'internal',
    E1GPa: elastic.E,
    E2GPa: elastic.E,
    nu1: elastic.nu,
    nu2: elastic.nu,
    sigmaHlim: sigma_Hlim,
    sigmaFlim1: sigma_Flim,
    sigmaFlim2: sigma_Flim,
  });
  const Kv = iso.Kv;
  const sigma_F = Number(iso.sigmaF1.toFixed(1));
  const SF_bending = sigma_F > 0 ? Number(iso.SF1.toFixed(2)) : 9.99;
  const sigma_H = Number(iso.sigmaH.toFixed(1));
  const SF_contact = sigma_H > 0 ? Number(iso.SH.toFixed(2)) : 9.99;

  // ═══ Diş Geometrisi Emniyet Kontrolleri (Undercutting & Pointing) ═══
  const sinAlphaT = Math.sin(alpha_t);
  const z_min = Number(((2 * (1 - x)) / Math.max(0.01, sinAlphaT * sinAlphaT)).toFixed(1));
  const isUndercut = gearType === 'external' && z < z_min;

  // Diş başı kalınlığı (sa) ve sivrilme kontrolü
  const alpha_a = da > db ? Math.acos(db / da) : alpha_t;
  const invAlpha_a = inv(alpha_a);
  const topLandThickness = da > 0 ? Number((da * Math.max(0.02, s / d + invAlpha_t - invAlpha_a)).toFixed(2)) : mn * 0.4;
  const isPointed = topLandThickness < 0.25 * mn;

  // Kavrama Oranları (Contact Ratios) — ISO 21771 εα = gα / pbt
  const ra = da / 2;
  const rb = db / 2;
  const r_val = d / 2;
  const g_alpha_approx = Math.sqrt(Math.max(0, ra * ra - rb * rb)) - r_val * sinAlphaT;
  const transverseContactRatio = Number(iso.epsilonAlpha.toFixed(2));
  const overlapRatio = Number(iso.epsilonBeta.toFixed(2));
  const totalContactRatio = Number(iso.epsilonGamma.toFixed(2));

  // Burulmaya göre min mil çapı (tau_allowable = 45 MPa)
  const minShaftDiameter = Math.abs(torque) > 0
    ? Number(Math.cbrt((16 * Math.abs(torque) * 1000) / (Math.PI * 45)).toFixed(1))
    : 15;

  return {
    teeth: z,
    module: mn,
    helixAngle: betaDeg,
    pressureAngle: alphaDeg,
    faceWidth: b,
    profileShift: x,
    material,
    rpm,
    torque,
    pitchVelocity,
    mt,
    alpha_t,
    d,
    da,
    df,
    db,
    ha,
    hf,
    h,
    p,
    pb,
    s,
    e,
    chordalThickness,
    chordalAddendum,
    wildhaberW,
    wildhaberK,
    pinDiameter,
    dimensionOverPins,
    qualityGrade: 6,
    radialRunoutFr: Fr_tol,
    pitchErrorFp: Fp,
    profileErrorFf: Ff,
    recMachining,
    cuttingSpeedVc,
    feedFz,
    machiningTimeSec,
    caseDepthCHD,
    coreStrength,
    surfaceHardness,
    isUndercut,
    isPointed,
    topLandThickness,
    transverseContactRatio,
    overlapRatio,
    totalContactRatio,
    Ft,
    Fr,
    Fa,
    Fn,
    sigma_F,
    SF_bending,
    sigma_H,
    SF_contact,
    minShaftDiameter,
  };
}

/**
 * Multi-Gear Train Kinematics & Full System Analyzer
 */
export function solveGearTrain(
  gearsInput: GearTrainNode[],
  inputRPM: number = 1450,
  inputPowerKW: number = 4.0
): GearTrainAnalysisResult {
  if (!gearsInput || gearsInput.length === 0) {
    return {
      gears: [],
      shafts: [],
      totalRatio: 1,
      inputRpm: inputRPM,
      inputPowerKW,
      inputTorqueNm: 0,
      outputRpm: inputRPM,
      outputTorqueNm: 0,
      overallEfficiency: 1,
      centerDistances: [],
      totalPowerLossKW: 0,
      heatDissipationReqKW: 0,
      lubrication: 'ISO VG 220 Yağ Banyosu',
      validationErrors: [],
      isImpossible: false,
    };
  }

  const inputTorqueNm = inputRPM > 0 ? (9549.27 * inputPowerKW) / inputRPM : 0;

  const calculatedGears: GearCalculatedData[] = [];
  const shaftMap = new Map<number, { rpm: number; torque: number; dir: 'cw' | 'ccw'; gearIds: string[] }>();
  const centerDistances: { fromGear: string; toGear: string; a: number }[] = [];

  let currentRPM = inputRPM;
  let currentTorque = inputTorqueNm;
  let currentDir: 'cw' | 'ccw' = 'cw';
  let overallEfficiency = 1.0;

  // Process gears sequentially
  for (let i = 0; i < gearsInput.length; i++) {
    const g = gearsInput[i];
    const gearType = g.gearType || 'external';
    let gearRpm = currentRPM;
    let gearTorque = currentTorque;
    let gearDir: 'cw' | 'ccw' = currentDir;
    let stageRatio = 1.0;

    let planetTeeth = g.planetTeeth;
    let ringTeeth = g.ringTeeth;
    let planetaryMode = g.planetaryMode || 'fixed_ring_carrier_out';

    let planetaryDetails: any = undefined;

    if (gearType === 'planetary_stage') {
      // ══════════════════════════════════════════════════════════════════════
      // COMPLETE PLANETARY STAGE KINEMATICS & 3-GEAR MANUFACTURING
      // ══════════════════════════════════════════════════════════════════════
      const zs = g.teeth;
      const zp = g.planetTeeth || Math.max(12, Math.floor(zs * 0.6));
      // STRICT CONCENTRICITY ENFORCEMENT: z_r = z_s + 2*z_p
      const zr = zs + 2 * zp;
      planetTeeth = zp;
      ringTeeth = zr;

      const numPlanets = g.numPlanets || 3;
      const fixedMember: 'ring' | 'sun' | 'carrier' = planetaryMode.startsWith('fixed_sun')
        ? 'sun'
        : planetaryMode.startsWith('fixed_carrier')
          ? 'carrier'
          : 'ring';
      const stagePowerKW = (currentTorque * Math.abs(currentRPM)) / 9549.27;
      const stageRating = ratePlanetaryStage({
        zs,
        zp,
        zr,
        planetCount: numPlanets,
        mn: g.module,
        betaDeg: g.helixAngle,
        faceWidth: g.faceWidth,
        alphaNDeg: g.pressureAngle,
        mode: fixedMember,
        nInRpm: currentRPM,
        powerKW: Math.max(0.01, stagePowerKW),
        floatingSun: true,
      });
      const stageEff = stageRating.etaStage;
      overallEfficiency *= stageEff;

      let sunRpm = 0;
      let ringRpm = 0;
      let carrierRpm = 0;
      let planetRelRpm = 0;
      let reactionTorqueNm = 0;
      let modeLabel = '';

      switch (planetaryMode) {
        case 'fixed_sun_carrier_out':
          // Fixed Sun (n_s = 0), Input Ring (n_r = currentRPM), Output Carrier (n_c)
          stageRatio = (zs + zr) / zr;
          carrierRpm = currentRPM / stageRatio;
          ringRpm = currentRPM;
          sunRpm = 0;
          planetRelRpm = Math.abs((ringRpm - carrierRpm) * (zr / zp));
          gearRpm = carrierRpm;
          gearDir = currentDir;
          gearTorque = currentTorque * stageRatio * stageEff;
          reactionTorqueNm = Math.abs(gearTorque - currentTorque);
          modeLabel = 'Güneş Sabit / Halka Giriş → Taşıyıcı Çıkış (i = ' + stageRatio.toFixed(2) + ':1)';
          break;

        case 'fixed_carrier_ring_out':
          // Fixed Carrier (n_c = 0), Input Sun (n_s = currentRPM), Output Ring (n_r) - Inverter
          stageRatio = zr / zs;
          ringRpm = currentRPM / stageRatio;
          carrierRpm = 0;
          sunRpm = currentRPM;
          planetRelRpm = Math.abs(currentRPM * (zs / zp));
          gearRpm = ringRpm;
          gearDir = currentDir === 'cw' ? 'ccw' : 'cw'; // REVERSE
          gearTorque = currentTorque * stageRatio * stageEff;
          reactionTorqueNm = Math.abs(gearTorque + currentTorque);
          modeLabel = 'Taşıyıcı Sabit / Güneş Giriş → Halka Çıkış [Geri Vites] (i = -' + stageRatio.toFixed(2) + ':1)';
          break;

        case 'fixed_carrier_sun_out':
          // Fixed Carrier (n_c = 0), Input Ring (n_r = currentRPM), Output Sun (n_s) - Inverter Increaser
          stageRatio = zs / zr;
          sunRpm = currentRPM / stageRatio;
          carrierRpm = 0;
          ringRpm = currentRPM;
          planetRelRpm = Math.abs(currentRPM * (zr / zp));
          gearRpm = sunRpm;
          gearDir = currentDir === 'cw' ? 'ccw' : 'cw'; // REVERSE
          gearTorque = currentTorque * stageRatio * stageEff;
          reactionTorqueNm = Math.abs(gearTorque + currentTorque);
          modeLabel = 'Taşıyıcı Sabit / Halka Giriş → Güneş Çıkış [Ters Hız Artırıcı] (i = -' + stageRatio.toFixed(2) + ':1)';
          break;

        case 'fixed_ring_sun_out':
          // Fixed Ring (n_r = 0), Input Carrier (n_c = currentRPM), Output Sun (n_s) - Speed Multiplier
          stageRatio = 1 / (1 + zr / zs);
          sunRpm = currentRPM * (1 + zr / zs);
          carrierRpm = currentRPM;
          ringRpm = 0;
          planetRelRpm = Math.abs((sunRpm - carrierRpm) * (zs / zp));
          gearRpm = sunRpm;
          gearDir = currentDir;
          gearTorque = currentTorque * stageRatio * stageEff;
          reactionTorqueNm = Math.abs(currentTorque - gearTorque);
          modeLabel = 'Halka Sabit / Taşıyıcı Giriş → Güneş Çıkış [Hız Artırıcı] (i = ' + stageRatio.toFixed(3) + ':1)';
          break;

        case 'fixed_sun_ring_out':
          // Fixed Sun (n_s = 0), Input Carrier (n_c = currentRPM), Output Ring (n_r) - Speed Multiplier
          stageRatio = zr / (zs + zr);
          ringRpm = currentRPM * ((zs + zr) / zr);
          carrierRpm = currentRPM;
          sunRpm = 0;
          planetRelRpm = Math.abs((ringRpm - carrierRpm) * (zr / zp));
          gearRpm = ringRpm;
          gearDir = currentDir;
          gearTorque = currentTorque * stageRatio * stageEff;
          reactionTorqueNm = Math.abs(currentTorque - gearTorque);
          modeLabel = 'Güneş Sabit / Taşıyıcı Giriş → Halka Çıkış [Hız Artırıcı] (i = ' + stageRatio.toFixed(3) + ':1)';
          break;

        case 'fixed_ring_carrier_out':
        default:
          // Fixed Ring (n_r = 0), Input Sun (n_s = currentRPM), Output Carrier (n_c) - Standard Reducer
          stageRatio = 1 + zr / zs;
          carrierRpm = currentRPM / stageRatio;
          sunRpm = currentRPM;
          ringRpm = 0;
          planetRelRpm = Math.abs((currentRPM - carrierRpm) * (zs / zp));
          gearRpm = carrierRpm;
          gearDir = currentDir;
          gearTorque = currentTorque * stageRatio * stageEff;
          reactionTorqueNm = Math.abs(gearTorque - currentTorque);
          modeLabel = 'Halka Sabit / Güneş Giriş → Taşıyıcı Çıkış [Standart Redüktör] (i = ' + stageRatio.toFixed(2) + ':1)';
          break;
      }

      // Torques for 3 individual components
      const sunTorque = planetaryMode.startsWith('fixed_ring_carrier') || planetaryMode.startsWith('fixed_carrier_ring')
        ? currentTorque
        : planetaryMode === 'fixed_ring_sun_out' || planetaryMode === 'fixed_carrier_sun_out'
        ? gearTorque
        : reactionTorqueNm;

      const planetTorque = (sunTorque * (zp / zs)) / numPlanets;

      const ringTorque = planetaryMode === 'fixed_sun_carrier_out' || planetaryMode === 'fixed_carrier_sun_out'
        ? currentTorque
        : planetaryMode === 'fixed_carrier_ring_out' || planetaryMode === 'fixed_sun_ring_out'
        ? gearTorque
        : reactionTorqueNm;

      // ─── 1. SUN GEAR MANUFACTURING PASSPORT ───
      const sunMfg = computeGearManufacturingData(
        zs,
        g.module,
        g.helixAngle,
        g.pressureAngle,
        g.profileShift,
        g.faceWidth,
        g.material,
        sunRpm,
        sunTorque,
        'external'
      );

      // ─── 2. PLANET GEAR (3x) MANUFACTURING PASSPORT ───
      const planetMfg = computeGearManufacturingData(
        zp,
        g.module,
        g.helixAngle,
        g.pressureAngle,
        g.profileShift,
        g.faceWidth,
        g.material,
        planetRelRpm,
        planetTorque,
        'external'
      );
      const planetFt = planetMfg.Ft || 0;
      const pinBearingRadialLoadN = Number((2 * planetFt * Math.cos((g.pressureAngle * Math.PI) / 180)).toFixed(1));

      // ─── 3. INTERNAL RING GEAR (ANULAR) MANUFACTURING PASSPORT ───
      const ringMfg = computeGearManufacturingData(
        zr,
        g.module,
        g.helixAngle,
        g.pressureAngle,
        g.profileShift,
        g.faceWidth + 6,
        g.material,
        ringRpm,
        ringTorque,
        'internal'
      );
      const minCasingWallMm = Number(Math.max(8, 2.4 * g.module).toFixed(1));

      // ─── ASSEMBLY & KINEMATIC CONDITIONS ───
      const asp = (g.module * (zs + zp)) / 2;
      const assemblyConditionOk = (zs + zr) % numPlanets === 0;
      const assemblyRemainder = (zs + zr) % numPlanets;
      const maxAllowedPlanetDia = 2 * asp * Math.sin(Math.PI / numPlanets);
      const proximityConditionOk = planetMfg.da < maxAllowedPlanetDia;

      planetaryDetails = {
        mode: planetaryMode,
        modeLabel,
        sun: {
          ...sunMfg,
          name: `Güneş Dişlisi (Sun Gear, z=${zs})`,
          teeth: zs,
          rpm: Number(sunRpm.toFixed(1)),
          torque: Number(sunTorque.toFixed(1)),
        },
        planet: {
          ...planetMfg,
          name: `Planet Dişlisi (${numPlanets}x Planet, z=${zp})`,
          teeth: zp,
          rpm: Number(planetRelRpm.toFixed(1)),
          torque: Number(planetTorque.toFixed(1)),
          pinBearingRadialLoadN,
        },
        ring: {
          ...ringMfg,
          name: `İç Çember Halka (Ring Gear, z=${zr})`,
          teeth: zr,
          rpm: Number(ringRpm.toFixed(1)),
          torque: Number(ringTorque.toFixed(1)),
          minCasingWallMm,
        },
        carrier: {
          orbitDia: Number((2 * asp).toFixed(2)),
          numPlanets,
          assemblyConditionOk,
          assemblyRemainder,
          proximityConditionOk,
          maxAllowedPlanetDia: Number(maxAllowedPlanetDia.toFixed(2)),
          reactionTorqueNm: Number(reactionTorqueNm.toFixed(1)),
          carrierRpm: Number(carrierRpm.toFixed(1)),
          carrierTorqueNm: Number((planetaryMode.includes('carrier') ? gearTorque : currentTorque).toFixed(1)),
          etaStage: Number(stageRating.etaStage.toFixed(4)),
          Kgamma: Number(stageRating.Kgamma.toFixed(3)),
          SFsp: Number(stageRating.sunPlanet.SF.toFixed(2)),
          SHsp: Number(stageRating.sunPlanet.SH.toFixed(2)),
          SFpr: Number(stageRating.planetRing.SF.toFixed(2)),
          SHpr: Number(stageRating.planetRing.SH.toFixed(2)),
        },
      };
    } else if (i === 0) {
      // First gear is the motor driver
      gearRpm = inputRPM;
      gearTorque = inputTorqueNm;
      gearDir = 'cw';
      stageRatio = 1.0;
    } else {
      const prevGear = calculatedGears[i - 1];

      if (g.isCoaxial) {
        // Coaxial gear on the SAME shaft as previous gear!
        gearRpm = prevGear.rpm;
        gearDir = prevGear.rotationDir;
        gearTorque = prevGear.torque;
        stageRatio = 1.0;
      } else {
        const driver = g.meshWithId
          ? calculatedGears.find((cg) => cg.id === g.meshWithId) || prevGear
          : prevGear;

        stageRatio = g.teeth / driver.teeth;
        gearRpm = driver.rpm / stageRatio;

        // In internal mesh, driver and internal gear rotate in SAME direction.
        // In external mesh, direction reverses.
        if (gearType === 'internal') {
          gearDir = driver.rotationDir;
        } else {
          gearDir = driver.rotationDir === 'cw' ? 'ccw' : 'cw';
        }

        const stageEff = 0.98;
        overallEfficiency *= stageEff;
        gearTorque = driver.torque * stageRatio * stageEff;

        // Calculate center distance
        const isPlanetaryConn = (driver.gearType as string) === 'planetary_stage';
        const mt_driver = driver.mt;
        const mt_this = g.helixAngle > 0 ? g.module / Math.cos((g.helixAngle * Math.PI) / 180) : g.module;
        const mt_eff = (mt_driver + mt_this) / 2;
        const a = isPlanetaryConn
          ? 0.0
          : gearType === 'internal'
            ? (mt_eff * Math.abs(g.teeth - driver.teeth)) / 2
            : (mt_eff * (driver.teeth + g.teeth)) / 2;

        centerDistances.push({
          fromGear: driver.name,
          toGear: g.name,
          a: Number(a.toFixed(2)),
        });
      }
    }

    currentRPM = gearRpm;
    currentTorque = gearTorque;
    currentDir = gearDir;

    const mateZ = g.meshWithId
      ? (gearsInput.find((n) => n.id === g.meshWithId)?.teeth
        ?? (calculatedGears.find((cg) => cg.id === g.meshWithId)?.teeth)
        ?? 0)
      : (calculatedGears.length > 0 ? calculatedGears[calculatedGears.length - 1].teeth : 0);
    const mfgData = computeGearManufacturingData(
      g.teeth,
      g.module,
      g.helixAngle,
      g.pressureAngle,
      g.profileShift,
      g.faceWidth,
      g.material,
      gearRpm,
      gearTorque,
      gearType,
      mateZ
    );

    // ══════════════════════════════════════════════════════════════════════════
    // GEOMETRIC & PHYSICAL INCOMPATIBILITY / IMPOSSIBILITY CHECKS
    // ══════════════════════════════════════════════════════════════════════════
    const gearErrors: GearValidationError[] = [];

    if (gearType === 'planetary_stage') {
      const zs = g.teeth;
      const zp = planetTeeth || Math.max(12, Math.floor(zs * 0.6));
      const zr = ringTeeth || (zs + 2 * zp);
      const numPlanets = g.numPlanets || 3;

      // 1. Concentricity Check
      if (g.ringTeeth !== undefined && g.ringTeeth !== zs + 2 * zp) {
        gearErrors.push({
          gearId: g.id,
          gearName: g.name,
          severity: 'critical_impossible',
          titleTr: 'BU TASARIM İMKANSIZ: Planet Eş Merkezlilik Şartı Bozuk',
          titleEn: 'IMPOSSIBLE DESIGN: Planetary Concentricity Violated',
          messageTr: `İç Çember Dişli (zr = ${g.ringTeeth}), Güneş (zs = ${zs}) ve Planet (zp = ${zp}) ile eş merkezli olamaz! Geometrik Kural: zr = zs + 2·zp = ${zs + 2 * zp} olmalıdır.`,
          messageEn: `Ring gear teeth (${g.ringTeeth}) violates concentricity: zr = zs + 2·zp = ${zs + 2 * zp}.`,
          remedyTr: `İç çember diş sayısını zr = ${zs + 2 * zp} olarak düzeltin.`,
          remedyEn: `Set ring teeth count to zr = ${zs + 2 * zp}.`,
        });
      }

      // 2. Planet Collision / Proximity Check
      if (planetaryDetails && !planetaryDetails.carrier.proximityConditionOk) {
        gearErrors.push({
          gearId: g.id,
          gearName: g.name,
          severity: 'critical_impossible',
          titleTr: 'BU TASARIM İMKANSIZ: Planetler Birbirine Çarpıyor (Girişim)',
          titleEn: 'IMPOSSIBLE DESIGN: Planets Collide in Carrier',
          messageTr: `Planet dişli dış tepe çapı (da = ${planetaryDetails.planet.da.toFixed(1)} mm), taşıyıcıda izin verilen maksimum çapı (da_max = ${planetaryDetails.carrier.maxAllowedPlanetDia.toFixed(1)} mm) aşıyor! ${numPlanets} adet planet dönerken birbirine fiziksel olarak çarpar ve kilitlenir.`,
          messageEn: `Planet tip diameter (${planetaryDetails.planet.da.toFixed(1)} mm) exceeds maximum allowable diameter (${planetaryDetails.carrier.maxAllowedPlanetDia.toFixed(1)} mm). Planets will crash into each other!`,
          remedyTr: `Planet diş sayısını (zp = ${zp}) düşürün veya güneş diş sayısını (zs = ${zs}) artırın.`,
          remedyEn: `Decrease planet teeth or increase sun teeth.`,
        });
      }

      // 3. Assembly Divisibility Check
      if (planetaryDetails && !planetaryDetails.carrier.assemblyConditionOk) {
        gearErrors.push({
          gearId: g.id,
          gearName: g.name,
          severity: 'critical_impossible',
          titleTr: 'BU TASARIM İMKANSIZ: Planet Eşit Açılı Montaj Şartı Bozuk',
          titleEn: 'IMPOSSIBLE DESIGN: Planetary Assembly Condition Violated',
          messageTr: `(zs + zr) = ${zs + zr} sayısı planet sayısı Np=${numPlanets}'e tam bölünmüyor (Kalan = ${(zs + zr) % numPlanets}). Dişliler eşit 120° / 90° açılarla taşıyıcıya monte edilemez, dişler kavrama boşluğuna denk gelmez!`,
          messageEn: `(zs + zr) = ${zs + zr} is not divisible by planet count Np=${numPlanets} (Remainder = ${(zs + zr) % numPlanets}). Planets cannot be assembled symmetrically!`,
          remedyTr: `(zs + zr) toplamını ${numPlanets}'in tam katı olacak şekilde ayarlayın.`,
          remedyEn: `Adjust tooth counts so (zs + zr) is a multiple of ${numPlanets}.`,
        });
      }

      // 4. Minimum Sun Teeth Limit
      if (zs < 11) {
        gearErrors.push({
          gearId: g.id,
          gearName: g.name,
          severity: 'critical_impossible',
          titleTr: 'BU TASARIM İMKANSIZ: Güneş Diş Sayısı Çok Az (zs < 11)',
          titleEn: 'IMPOSSIBLE DESIGN: Sun Teeth Too Low (zs < 11)',
          messageTr: `Güneş dişli sayısı zs=${zs} olup aşırı alttan kesilme (undercut) nedeniyle diş kökü zayıflar ve mil yuvası sığmaz.`,
          messageEn: `Sun gear teeth zs=${zs} is too low for safe operation.`,
          remedyTr: `Güneş diş sayısını en az zs=12 yapın.`,
          remedyEn: `Set sun teeth to at least zs=12.`,
        });
      }
    } else if (i > 0 && !g.isCoaxial) {
      const prevGear = calculatedGears[i - 1];
      const driver = g.meshWithId
        ? calculatedGears.find((cg) => cg.id === g.meshWithId) || prevGear
        : prevGear;

      if ((gearType as string) !== 'planetary_stage' && (driver.gearType as string) !== 'planetary_stage') {
        // 5. Module Mismatch
        if (Math.abs(g.module - driver.module) > 0.001) {
          gearErrors.push({
            gearId: g.id,
            gearName: g.name,
            severity: 'critical_impossible',
            titleTr: 'BU TASARIM İMKANSIZ: Modül Uyuşmazlığı',
            titleEn: 'IMPOSSIBLE DESIGN: Module Mismatch',
            messageTr: `${driver.name} (m=${driver.module} mm) ile ${g.name} (m=${g.module} mm) modülleri farklıdır! Farklı modüldeki dişliler birbirini kavrayamaz ve dişler kırılır.`,
            messageEn: `Module mismatch: ${driver.name} (m=${driver.module} mm) vs ${g.name} (m=${g.module} mm). Gears with different modules cannot mesh!`,
            remedyTr: `${g.name} modülünü ${driver.module} mm yapın.`,
            remedyEn: `Set ${g.name} module to ${driver.module} mm.`,
          });
        }

        // 6. Pressure Angle Mismatch
        if (Math.abs(g.pressureAngle - driver.pressureAngle) > 0.1) {
          gearErrors.push({
            gearId: g.id,
            gearName: g.name,
            severity: 'critical_impossible',
            titleTr: 'BU TASARIM İMKANSIZ: Kavrama Açısı Uyuşmazlığı',
            titleEn: 'IMPOSSIBLE DESIGN: Pressure Angle Mismatch',
            messageTr: `${driver.name} (α=${driver.pressureAngle}°) ile ${g.name} (α=${g.pressureAngle}°) kavrama açıları farklıdır. Evolvent temas profilleri uyuşmaz.`,
            messageEn: `Pressure angle mismatch: ${driver.name} (α=${driver.pressureAngle}°) vs ${g.name} (α=${g.pressureAngle}°).`,
            remedyTr: `Her iki dişlinin kavrama açısını standart 20° yapın.`,
            remedyEn: `Set pressure angle to standard 20° for both gears.`,
          });
        }

        // 7. Internal Gear Tip Interference
        if (gearType === 'internal' && Math.abs(g.teeth - driver.teeth) < 8) {
          gearErrors.push({
            gearId: g.id,
            gearName: g.name,
            severity: 'critical_impossible',
            titleTr: 'BU TASARIM İMKANSIZ: İç Dişli Diş Tepesi Girişimi (Interference)',
            titleEn: 'IMPOSSIBLE DESIGN: Internal Gear Tooth Tip Interference',
            messageTr: `İç çember (zr=${g.teeth}) ile pinyon (zp=${driver.teeth}) diş farkı |zr - zp| = ${Math.abs(g.teeth - driver.teeth)} < 8 olduğu için pinyon diş tepeleri iç dişliyle dönerken kilitlenir!`,
            messageEn: `Internal ring (${g.teeth}) and pinion (${driver.teeth}) tooth difference is ${Math.abs(g.teeth - driver.teeth)} < 8, causing tooth tip lockup!`,
            remedyTr: `İç çember dişli sayısını en az zr=${driver.teeth + 9} yapın.`,
            remedyEn: `Increase ring teeth count to at least zr=${driver.teeth + 9}.`,
          });
        }
      }
    }

    // 8. Undercut Check for any gear
    if (g.teeth < 12 && (g.profileShift || 0) <= 0.05 && gearType !== 'planetary_stage') {
      gearErrors.push({
        gearId: g.id,
        gearName: g.name,
        severity: 'critical_impossible',
        titleTr: 'BU TASARIM İMKANSIZ: Aşırı Alttan Kesilme (Undercut)',
        titleEn: 'IMPOSSIBLE DESIGN: Severe Undercut',
        messageTr: `Diş sayısı z=${g.teeth} < 12 olup profil kaydırma uygulanmamıştır. İmalatta takım diş dibini oyarak mukavemeti yok eder.`,
        messageEn: `Teeth count z=${g.teeth} < 12 without positive profile shift will suffer severe undercut.`,
        remedyTr: `Diş sayısını en az 14'e çıkarın veya pozitif profil kaydırma (x ≥ +0.3) uygulayın.`,
        remedyEn: `Increase teeth count or apply positive profile shift x ≥ +0.3.`,
      });
    }

    const isImpossible = gearErrors.some((e) => e.severity === 'critical_impossible');

    const fullGearData: GearCalculatedData = {
      ...g,
      ...mfgData,
      gearType,
      planetaryMode: g.planetaryMode || (gearType === 'planetary_stage' ? 'fixed_ring_carrier_out' : undefined),
      numPlanets: g.numPlanets || (gearType === 'planetary_stage' ? 3 : undefined),
      planetTeeth,
      ringTeeth,
      rpm: gearRpm,
      torque: gearTorque,
      rotationDir: gearDir,
      stageRatio,
      planetaryDetails: gearType === 'planetary_stage' ? planetaryDetails : undefined,
      validationErrors: gearErrors,
      isImpossible,
    };

    calculatedGears.push(fullGearData);

    // Track shaft info
    const existingShaft = shaftMap.get(g.shaftId);
    if (!existingShaft) {
      shaftMap.set(g.shaftId, {
        rpm: gearRpm,
        torque: gearTorque,
        dir: gearDir,
        gearIds: [g.id],
      });
    } else {
      existingShaft.gearIds.push(g.id);
    }
  }

  // Calculate layout coordinates for 2D visualizer
  const shafts: ShaftLayoutInfo[] = [];
  let currentX = 100;
  shaftMap.forEach((val, shaftId) => {
    shafts.push({
      shaftId,
      rpm: val.rpm,
      torque: val.torque,
      rotationDir: val.dir,
      gearIds: val.gearIds,
      xPos: currentX,
      yPos: 160,
    });
    currentX += 160;
  });

  const totalRatio = calculatedGears.length > 0 && calculatedGears[0].rpm > 0
    ? inputRPM / (calculatedGears[calculatedGears.length - 1].rpm || 1)
    : 1;

  const outputGear = calculatedGears[calculatedGears.length - 1];
  const outputRpm = outputGear ? outputGear.rpm : inputRPM;
  const outputTorqueNm = outputGear ? outputGear.torque : inputTorqueNm;

  const totalPowerLossKW = Number(((1 - overallEfficiency) * inputPowerKW).toFixed(2));
  const heatDissipationReqKW = totalPowerLossKW;

  let lubrication = 'ISO VG 220 Yağ Banyosu';
  const maxPitchVelocity = Math.max(...calculatedGears.map((g) => g.pitchVelocity), 0);
  if (maxPitchVelocity > 15) {
    lubrication = 'ISO VG 150 Basınçlı Yağ Püskürtme (Pompajlı)';
  } else if (maxPitchVelocity > 4) {
    lubrication = 'ISO VG 220 Daldırmalı Yağ Banyosu (Splash)';
  } else {
    lubrication = 'NLGI-2 Sentetik Gres veya ISO VG 320 Daldırma';
  }

  const allValidationErrors = calculatedGears.flatMap((g) => g.validationErrors || []);
  const isSystemImpossible = allValidationErrors.some((e) => e.severity === 'critical_impossible');

  return {
    gears: calculatedGears,
    shafts,
    totalRatio: Number(totalRatio.toFixed(3)),
    inputRpm: inputRPM,
    inputPowerKW,
    inputTorqueNm: Number(inputTorqueNm.toFixed(2)),
    outputRpm: Number(outputRpm.toFixed(1)),
    outputTorqueNm: Number(outputTorqueNm.toFixed(1)),
    overallEfficiency: Number(overallEfficiency.toFixed(3)),
    totalPowerLossKW,
    heatDissipationReqKW,
    lubrication,
    centerDistances,
    validationErrors: allValidationErrors,
    isImpossible: isSystemImpossible,
  };
}

/**
 * Auto-Correction Engine: Corrects physically impossible gear train parameters
 * to strictly valid, manufacturable engineering configurations.
 */
export function autoFixGearTrain(gears: GearTrainNode[]): GearTrainNode[] {
  return gears.map((g, idx) => {
    const copy = { ...g };
    if (copy.gearType === 'planetary_stage') {
      const numPlanets = copy.numPlanets || 3;
      let zs = Math.max(12, copy.teeth);
      let zp = copy.planetTeeth || Math.max(14, Math.floor(zs * 0.6));
      
      // Enforce concentricity: zr = zs + 2*zp
      let zr = zs + 2 * zp;

      // Enforce divisibility: (zs + zr) % numPlanets === 0
      while ((zs + zr) % numPlanets !== 0) {
        zs += 1;
        zr = zs + 2 * zp;
      }

      // Enforce proximity condition: da_p < 2 * a_sp * sin(pi/Np)
      const asp = (copy.module * (zs + zp)) / 2;
      const maxAllowed = 2 * asp * Math.sin(Math.PI / numPlanets);
      const dap = (zp + 2) * copy.module;
      if (dap >= maxAllowed) {
        zp = Math.max(12, Math.floor((maxAllowed / copy.module) - 3));
        zr = zs + 2 * zp;
        while ((zs + zr) % numPlanets !== 0) {
          zs += 1;
          zr = zs + 2 * zp;
        }
      }

      copy.teeth = zs;
      copy.planetTeeth = zp;
      copy.ringTeeth = zr;
    } else if (idx > 0 && !copy.isCoaxial) {
      const prev = gears[idx - 1];
      if ((copy.gearType as string) !== 'planetary_stage' && (prev.gearType as string) !== 'planetary_stage') {
        // Enforce same module & pressure angle
        copy.module = prev.module;
        copy.pressureAngle = prev.pressureAngle;

        // Enforce internal gear clearance
        if (copy.gearType === 'internal' && copy.teeth < prev.teeth + 10) {
          copy.teeth = prev.teeth + 12;
        }
      }
    }

    // Enforce minimum teeth or profile shift
    if (copy.teeth < 13 && (copy.profileShift || 0) < 0.25) {
      copy.profileShift = 0.3;
    }

    return copy;
  });
}

// ═══════════════════════════════════════════════════════════════
// STANDARD PRESETS FOR QUICK INITIALIZATION & RESET
// ═══════════════════════════════════════════════════════════════

export const DEFAULT_COMPOUND_PRESET: GearTrainNode[] = [
  { id: 'g1', name: 'G1 (Giriş Pinyonu)', shaftId: 1, isCoaxial: false, gearType: 'external', teeth: 20, module: 3, helixAngle: 0, pressureAngle: 20, faceWidth: 35, profileShift: 0, material: '16MnCr5' },
  { id: 'g2', name: 'G2 (Kademe 1 Çarkı)', shaftId: 2, isCoaxial: false, gearType: 'external', teeth: 50, module: 3, helixAngle: 0, pressureAngle: 20, faceWidth: 35, profileShift: 0, material: '16MnCr5' },
  { id: 'g3', name: 'G3 (Bileşik Pinyon)', shaftId: 2, isCoaxial: true, gearType: 'external', teeth: 18, module: 2.5, helixAngle: 0, pressureAngle: 20, faceWidth: 30, profileShift: 0, material: '42CrMo4' },
  { id: 'g4', name: 'G4 (Çıkış Çarkı)', shaftId: 3, isCoaxial: false, gearType: 'external', teeth: 54, module: 2.5, helixAngle: 0, pressureAngle: 20, faceWidth: 30, profileShift: 0, material: '42CrMo4' },
];

export const THREE_STAGE_HEAVY_PRESET: GearTrainNode[] = [
  { id: 'g1', name: 'G1 (Yüksek Hız Pinyonu)', shaftId: 1, isCoaxial: false, gearType: 'external', teeth: 18, module: 2.5, helixAngle: 12, pressureAngle: 20, faceWidth: 40, profileShift: 0.1, material: '18CrNiMo7-6' },
  { id: 'g2', name: 'G2 (Ara Kademe 1 Çarkı)', shaftId: 2, isCoaxial: false, gearType: 'external', teeth: 54, module: 2.5, helixAngle: 12, pressureAngle: 20, faceWidth: 40, profileShift: 0, material: '18CrNiMo7-6' },
  { id: 'g3', name: 'G3 (Ara Kademe 2 Pinyonu)', shaftId: 2, isCoaxial: true, gearType: 'external', teeth: 16, module: 3.5, helixAngle: 10, pressureAngle: 20, faceWidth: 50, profileShift: 0.2, material: '18CrNiMo7-6' },
  { id: 'g4', name: 'G4 (Ara Kademe 2 Çarkı)', shaftId: 3, isCoaxial: false, gearType: 'external', teeth: 48, module: 3.5, helixAngle: 10, pressureAngle: 20, faceWidth: 50, profileShift: 0, material: '18CrNiMo7-6' },
  { id: 'g5', name: 'G5 (Düşük Hız Çıkış Pinyonu)', shaftId: 3, isCoaxial: true, gearType: 'external', teeth: 15, module: 5.0, helixAngle: 8, pressureAngle: 20, faceWidth: 70, profileShift: 0.25, material: '16MnCr5' },
  { id: 'g6', name: 'G6 (Ağır Hizmet Çıkış Çarkı)', shaftId: 4, isCoaxial: false, gearType: 'external', teeth: 60, module: 5.0, helixAngle: 8, pressureAngle: 20, faceWidth: 70, profileShift: 0, material: '42CrMo4' },
];

export const BEVEL_HELICAL_PRESET: GearTrainNode[] = [
  { id: 'g1', name: 'G1 (90° Giriş Konik Pinyon)', shaftId: 1, isCoaxial: false, gearType: 'external', teeth: 19, module: 3.0, helixAngle: 0, pressureAngle: 20, faceWidth: 35, profileShift: 0, material: '16MnCr5' },
  { id: 'g2', name: 'G2 (90° Konik Ayna Çarkı)', shaftId: 2, isCoaxial: false, gearType: 'external', teeth: 57, module: 3.0, helixAngle: 0, pressureAngle: 20, faceWidth: 35, profileShift: 0, material: '16MnCr5' },
  { id: 'g3', name: 'G3 (Helisel Pinyon)', shaftId: 2, isCoaxial: true, gearType: 'external', teeth: 18, module: 3.5, helixAngle: 15, pressureAngle: 20, faceWidth: 45, profileShift: 0.15, material: '42CrMo4' },
  { id: 'g4', name: 'G4 (Helisel Çıkış Çarkı)', shaftId: 3, isCoaxial: false, gearType: 'external', teeth: 72, module: 3.5, helixAngle: 15, pressureAngle: 20, faceWidth: 45, profileShift: 0, material: '42CrMo4' },
];

export const PLANETARY_TRAIN_PRESET: GearTrainNode[] = [
  { id: 'g1', name: 'G1 (Motor Pinyonu)', shaftId: 1, isCoaxial: false, gearType: 'external', teeth: 24, module: 3, helixAngle: 0, pressureAngle: 20, faceWidth: 35, profileShift: 0, material: '16MnCr5' },
  { id: 'g2', name: 'G2 (Planet Kademesi Güneş)', shaftId: 2, isCoaxial: false, gearType: 'planetary_stage', teeth: 20, planetTeeth: 25, ringTeeth: 70, module: 2.5, helixAngle: 0, pressureAngle: 20, faceWidth: 40, profileShift: 0, material: '16MnCr5' },
  { id: 'g3', name: 'G3 (Çıkış Mil Çarkı)', shaftId: 3, isCoaxial: false, gearType: 'external', teeth: 48, module: 2.5, helixAngle: 0, pressureAngle: 20, faceWidth: 35, profileShift: 0, material: '42CrMo4' },
];

export const INTERNAL_HYBRID_PRESET: GearTrainNode[] = [
  { id: 'g1', name: 'G1 (İç Pinyon)', shaftId: 1, isCoaxial: false, gearType: 'external', teeth: 18, module: 3, helixAngle: 0, pressureAngle: 20, faceWidth: 35, profileShift: 0, material: '16MnCr5' },
  { id: 'g2', name: 'G2 (İç Çember Ring)', shaftId: 2, isCoaxial: false, gearType: 'internal', teeth: 54, module: 3, helixAngle: 0, pressureAngle: 20, faceWidth: 40, profileShift: 0, material: '42CrMo4' },
  { id: 'g3', name: 'G3 (Halka Dış Çark)', shaftId: 2, isCoaxial: true, gearType: 'hybrid', teeth: 72, module: 2.5, helixAngle: 0, pressureAngle: 20, faceWidth: 30, profileShift: 0, material: '42CrMo4' },
  { id: 'g4', name: 'G4 (Çıkış Pinyonu)', shaftId: 3, isCoaxial: false, gearType: 'external', teeth: 24, module: 2.5, helixAngle: 0, pressureAngle: 20, faceWidth: 30, profileShift: 0, material: '16MnCr5' },
];

export const DUAL_PLANETARY_CASCADE_PRESET: GearTrainNode[] = [
  { id: 'g1', name: 'G1 (Giriş Adaptörü)', shaftId: 1, isCoaxial: false, gearType: 'external', teeth: 20, module: 2.5, helixAngle: 0, pressureAngle: 20, faceWidth: 30, profileShift: 0, material: '16MnCr5' },
  { id: 'g2', name: 'G2 (Kademe 1 Planet)', shaftId: 2, isCoaxial: false, gearType: 'planetary_stage', teeth: 18, planetTeeth: 24, ringTeeth: 66, module: 2.5, helixAngle: 0, pressureAngle: 20, faceWidth: 35, profileShift: 0, material: '18CrNiMo7-6' },
  { id: 'g3', name: 'G3 (Kademe 2 Planet Güneş)', shaftId: 3, isCoaxial: false, gearType: 'planetary_stage', teeth: 18, planetTeeth: 24, ringTeeth: 66, module: 3.0, helixAngle: 0, pressureAngle: 20, faceWidth: 45, profileShift: 0, material: '18CrNiMo7-6' },
  { id: 'g4', name: 'G4 (Ağır Yük Çıkış Flanşı)', shaftId: 4, isCoaxial: false, gearType: 'external', teeth: 36, module: 3.0, helixAngle: 0, pressureAngle: 20, faceWidth: 45, profileShift: 0, material: '42CrMo4' },
];
