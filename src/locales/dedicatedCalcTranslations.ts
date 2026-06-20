import type { Language } from '@/store/i18nStore';

export type BeamDeflectionStrings = {
  titleMain: string;
  titleAccent: string;
  subtitle: string;
  supportMode: string;
  boundaryConditions: string;
  structuralMode: string;
  modeSsUniform: string;
  modeSsCenter: string;
  modeCUniform: string;
  beamParameters: string;
  loadMagnitudeUniform: string;
  loadMagnitudePoint: string;
  fineTuneLoad: string;
  spanLength: string;
  beamSpan: string;
  modulusOfElasticity: string;
  inertiaMoment: string;
  schematic: string;
  maxDeflection: string;
  maxMoment: string;
  infoText: string;
  standard: string;
};

export type ColumnBucklingStrings = {
  titleMain: string;
  titleAccent: string;
  subtitle: string;
  boundarySetup: string;
  cFactorLabel: string;
  columnEndCondition: string;
  endPinnedPinned: string;
  endFixedFixed: string;
  endFixedPinned: string;
  endFixedFree: string;
  columnParameters: string;
  columnLength: string;
  columnHeight: string;
  modulus: string;
  minInertia: string;
  schematic: string;
  eulerCriticalLoad: string;
  infoText: string;
  standard: string;
};

export type BearingLifeStrings = {
  titleMain: string;
  titleAccent: string;
  subtitle: string;
  bearingGeometry: string;
  loadExponentLabel: string;
  bearingElementType: string;
  ballBearing: string;
  rollerBearing: string;
  appliedLoads: string;
  dynamicLoadRating: string;
  ratingCapacity: string;
  equivDynamicLoad: string;
  dynamicLoad: string;
  rotationalSpeed: string;
  shaftSpeed: string;
  ratingLife: string;
  infoText: string;
  standard: string;
};

export type Vdi2230Strings = {
  titleMain: string;
  titleAccent: string;
  subtitle: string;
  tighteningTorqueParams: string;
  boltNominalDiameter: string;
  nominalSize: string;
  initialPreload: string;
  assemblyPreload: string;
  nutFrictionCoefficient: string;
  nutFrictionFactor: string;
  jointStiffnessParams: string;
  externalAppliedLoad: string;
  externalForce: string;
  boltStiffness: string;
  flangeStiffness: string;
  tighteningTorque: string;
  totalWorkingBoltLoad: string;
  infoText: string;
  standard: string;
};

export type DedicatedCalcPageStrings = {
  beamDeflection: BeamDeflectionStrings;
  columnBuckling: ColumnBucklingStrings;
  bearingLife: BearingLifeStrings;
  vdi2230: Vdi2230Strings;
};

const EN: DedicatedCalcPageStrings = {
  beamDeflection: {
    titleMain: 'Beam',
    titleAccent: 'Deflection',
    subtitle: "Roark's Formulas for Structural Beams \u2022 AluCalcOS 2.0",
    supportMode: 'Support Mode',
    boundaryConditions: 'Boundary conditions',
    structuralMode: 'Structural Mode',
    modeSsUniform: 'Simply Supported - Uniform Load',
    modeSsCenter: 'Simply Supported - Point Load at Center',
    modeCUniform: 'Cantilever - Uniform Load',
    beamParameters: 'Beam Parameters',
    loadMagnitudeUniform: 'Load magnitude (w)',
    loadMagnitudePoint: 'Load magnitude (W)',
    fineTuneLoad: 'Fine-tune Load',
    spanLength: 'Span Length (L)',
    beamSpan: 'Beam Span',
    modulusOfElasticity: 'Modulus of Elasticity (E)',
    inertiaMoment: 'Inertia Moment (I)',
    schematic: 'SCHEMATIC',
    maxDeflection: 'Maximum Deflection (v_max)',
    maxMoment: 'Maximum Moment (M_max)',
    infoText:
      'Formula calculation uses Euler-Bernoulli beam theory. Moment of Inertia (I) determines the resistance to bending, and Elastic Modulus (E) reflects the structural stiffness.',
    standard: 'Standard: AISC / Euler-Bernoulli',
  },
  columnBuckling: {
    titleMain: 'Column',
    titleAccent: 'Buckling',
    subtitle: 'Euler Critical Load Sizing for Slender Columns \u2022 AluCalcOS 2.0',
    boundarySetup: 'Boundary Setup',
    cFactorLabel: 'C Factor =',
    columnEndCondition: 'Column End Condition',
    endPinnedPinned: 'Pinned-Pinned (C=1)',
    endFixedFixed: 'Fixed-Fixed (C=4)',
    endFixedPinned: 'Fixed-Pinned (C=2)',
    endFixedFree: 'Fixed-Free (C=0.25)',
    columnParameters: 'Column Parameters',
    columnLength: 'Column Length (L)',
    columnHeight: 'Column Height',
    modulus: 'Modulus (E)',
    minInertia: 'Min Inertia (I)',
    schematic: 'SCHEMATIC',
    eulerCriticalLoad: 'Euler Critical Load (P_cr)',
    infoText:
      "Calculations use Euler's buckling theory. Euler load assumes a perfectly straight column under concentric axial load, before yielding occurs. Applicable to long slender columns (slenderness ratio \u03bb > \u03bb_c).",
    standard: 'Standard: AISC / Euler Equation',
  },
  bearingLife: {
    titleMain: 'Bearing',
    titleAccent: 'Life (ISO 281)',
    subtitle: 'Rating Life Calculation for Rolling Bearings \u2022 AluCalcOS 2.0',
    bearingGeometry: 'Bearing Geometry',
    loadExponentLabel: 'Load exponent p =',
    bearingElementType: 'Bearing Element Type',
    ballBearing: 'Ball Bearing (p=3)',
    rollerBearing: 'Roller Bearing (p=10/3)',
    appliedLoads: 'Applied Loads',
    dynamicLoadRating: 'Dynamic Load Rating (C)',
    ratingCapacity: 'Rating Capacity',
    equivDynamicLoad: 'Equiv. Dynamic Load (P)',
    dynamicLoad: 'Dynamic Load',
    rotationalSpeed: 'Rotational Speed (n)',
    shaftSpeed: 'Shaft Speed',
    ratingLife: 'Rating Life (L10h)',
    infoText:
      'Calculations use the standard ISO 281 formula L10h = (10^6 / 60n) * (C/P)^p. L10h represents the dynamic rating life with 90% reliability. Exponent p is 3 for ball bearings and 10/3 (3.33) for roller bearings.',
    standard: 'Standard: ISO 281:2007',
  },
  vdi2230: {
    titleMain: 'VDI 2230',
    titleAccent: 'Joint Sizing',
    subtitle: 'Tightening Torque & Preload Calculations \u2022 AluCalcOS 2.0',
    tighteningTorqueParams: '1. Tightening Torque Parameters',
    boltNominalDiameter: 'Bolt Nominal Diameter (d)',
    nominalSize: 'Nominal Size',
    initialPreload: 'Initial Preload (F_M)',
    assemblyPreload: 'Assembly Preload',
    nutFrictionCoefficient: 'Nut Friction Coefficient (K)',
    nutFrictionFactor: 'Nut Friction Factor',
    jointStiffnessParams: '2. Joint Stiffness & Load Parameters',
    externalAppliedLoad: 'External Applied Load (F_ext)',
    externalForce: 'External Force',
    boltStiffness: 'Bolt Stiffness (K_c)',
    flangeStiffness: 'Flange Stiffness (K_B)',
    tighteningTorque: 'Tightening Torque (T)',
    totalWorkingBoltLoad: 'Total Working Bolt Load (F_c)',
    infoText:
      'Calculations adhere to VDI 2230 guidelines for systematic calculation of high-duty bolted joints. Bolt load Fc includes the assembly preload Fm and the portion of external load Fext transferred based on the stiffness ratio Kc / (Kc + Kb).',
    standard: 'Standard: VDI 2230-1',
  },
};

const TR: DedicatedCalcPageStrings = {
  beamDeflection: {
    titleMain: 'Kiri\u015f',
    titleAccent: 'Sehimi',
    subtitle: 'Yap\u0131sal Kiri\u015fler i\u00e7in Roark Form\u00fclleri \u2022 AluCalcOS 2.0',
    supportMode: 'Mesnet Modu',
    boundaryConditions: 'S\u0131n\u0131r ko\u015fullar\u0131',
    structuralMode: 'Yap\u0131sal Mod',
    modeSsUniform: 'Basit Mesnetli - D\u00fczg\u00fcn Y\u00fck',
    modeSsCenter: 'Basit Mesnetli - Orta Noktada Nokta Y\u00fck\u00fc',
    modeCUniform: 'Konsol - D\u00fczg\u00fcn Y\u00fck',
    beamParameters: 'Kiri\u015f Parametreleri',
    loadMagnitudeUniform: 'Y\u00fck b\u00fcy\u00fckl\u00fc\u011f\u00fc (w)',
    loadMagnitudePoint: 'Y\u00fck b\u00fcy\u00fckl\u00fc\u011f\u00fc (W)',
    fineTuneLoad: 'Y\u00fck\u00fc Ayarla',
    spanLength: 'A\u00e7\u0131kl\u0131k Uzunlu\u011fu (L)',
    beamSpan: 'Kiri\u015f A\u00e7\u0131kl\u0131\u011f\u0131',
    modulusOfElasticity: 'Elastisite Mod\u00fcl\u00fc (E)',
    inertiaMoment: 'Atalet Momenti (I)',
    schematic: '\u015eEMA',
    maxDeflection: 'Maksimum Sehim (v_max)',
    maxMoment: 'Maksimum Moment (M_max)',
    infoText:
      'Hesaplama Euler-Bernoulli kiri\u015f teorisini kullan\u0131r. Atalet momenti (I) e\u011filime kar\u015f\u0131 direnci, elastisite mod\u00fcl\u00fc (E) yap\u0131sal rijitli\u011fi belirler.',
    standard: 'Standart: AISC / Euler-Bernoulli',
  },
  columnBuckling: {
    titleMain: 'Kolon',
    titleAccent: 'Burkulma',
    subtitle: '\u0130nce Kolonlar i\u00e7in Euler Kritik Y\u00fck Boyutland\u0131rma \u2022 AluCalcOS 2.0',
    boundarySetup: 'S\u0131n\u0131r Ayar\u0131',
    cFactorLabel: 'C Fakt\u00f6r\u00fc =',
    columnEndCondition: 'Kolon U\u00e7 Ko\u015fulu',
    endPinnedPinned: 'Mafsal\u0131-Mafsal\u0131 (C=1)',
    endFixedFixed: 'Ankastre-Ankastre (C=4)',
    endFixedPinned: 'Ankastre-Mafsal\u0131 (C=2)',
    endFixedFree: 'Ankastre-Serbest (C=0.25)',
    columnParameters: 'Kolon Parametreleri',
    columnLength: 'Kolon Uzunlu\u011fu (L)',
    columnHeight: 'Kolon Y\u00fcksekli\u011fi',
    modulus: 'Mod\u00fcl (E)',
    minInertia: 'Min Atalet (I)',
    schematic: '\u015eEMA',
    eulerCriticalLoad: 'Euler Kritik Y\u00fck\u00fc (P_cr)',
    infoText:
      'Hesaplamalar Euler burkulma teorisini kullan\u0131r. Euler y\u00fck\u00fc, akma \u00f6ncesi eksenel y\u00fck alt\u0131nda m\u00fckemmel d\u00fcz bir kolon varsayar. Uzun ince kolonlar i\u00e7in ge\u00e7erlidir (incelik oran\u0131 \u03bb > \u03bb_c).',
    standard: 'Standart: AISC / Euler Denklemi',
  },
  bearingLife: {
    titleMain: 'Rulman',
    titleAccent: '\u00d6mr\u00fc (ISO 281)',
    subtitle: 'Yuvarlanmal\u0131 Rulmanlar i\u00e7in Nominal \u00d6m\u00fcr Hesab\u0131 \u2022 AluCalcOS 2.0',
    bearingGeometry: 'Rulman Geometrisi',
    loadExponentLabel: 'Y\u00fck \u00fcss\u00fc p =',
    bearingElementType: 'Rulman Eleman Tipi',
    ballBearing: 'Bilyal\u0131 Rulman (p=3)',
    rollerBearing: 'Makaral\u0131 Rulman (p=10/3)',
    appliedLoads: 'Uygulanan Y\u00fckler',
    dynamicLoadRating: 'Dinamik Y\u00fck Kapasitesi (C)',
    ratingCapacity: 'Kapasite Derecesi',
    equivDynamicLoad: 'E\u015fde\u011fer Dinamik Y\u00fck (P)',
    dynamicLoad: 'Dinamik Y\u00fck',
    rotationalSpeed: 'Devir H\u0131z\u0131 (n)',
    shaftSpeed: 'Mil H\u0131z\u0131',
    ratingLife: 'Nominal \u00d6m\u00fcr (L10h)',
    infoText:
      'Hesaplamalar ISO 281 form\u00fcl\u00fcn\u00fc kullan\u0131r: L10h = (10^6 / 60n) * (C/P)^p. L10h, %90 g\u00fcvenilirlikle dinamik nominal \u00f6mr\u00fc temsil eder. Bilyal\u0131 rulmanlarda p=3, makaral\u0131 rulmanlarda 10/3 (3.33) kullan\u0131l\u0131r.',
    standard: 'Standart: ISO 281:2007',
  },
  vdi2230: {
    titleMain: 'VDI 2230',
    titleAccent: 'Ba\u011flant\u0131 Boyutland\u0131rma',
    subtitle: 'S\u0131kma Torku ve \u00d6n Y\u00fck Hesaplamalar\u0131 \u2022 AluCalcOS 2.0',
    tighteningTorqueParams: '1. S\u0131kma Torku Parametreleri',
    boltNominalDiameter: 'Civata Nominal \u00c7ap\u0131 (d)',
    nominalSize: 'Nominal Boyut',
    initialPreload: 'Ba\u015flang\u0131\u00e7 \u00d6n Y\u00fck\u00fc (F_M)',
    assemblyPreload: 'Montaj \u00d6n Y\u00fck\u00fc',
    nutFrictionCoefficient: 'Somun S\u00fcrt\u00fcnme Katsay\u0131s\u0131 (K)',
    nutFrictionFactor: 'Somun S\u00fcrt\u00fcnme Fakt\u00f6r\u00fc',
    jointStiffnessParams: '2. Ba\u011flant\u0131 Rijitli\u011fi ve Y\u00fck Parametreleri',
    externalAppliedLoad: 'Harici Uygulanan Y\u00fck (F_ext)',
    externalForce: 'Harici Kuvvet',
    boltStiffness: 'Civata Rijitli\u011fi (K_c)',
    flangeStiffness: 'Flan\u015f Rijitli\u011fi (K_B)',
    tighteningTorque: 'S\u0131kma Torku (T)',
    totalWorkingBoltLoad: 'Toplam \u00c7al\u0131\u015fma Civata Y\u00fck\u00fc (F_c)',
    infoText:
      'Hesaplamalar VDI 2230 y\u00f6nergelerine uyar. Civata y\u00fck\u00fc Fc, montaj \u00f6n y\u00fck\u00fc Fm ve rijitlik oran\u0131 Kc / (Kc + Kb) ile aktar\u0131lan harici y\u00fck\u00fcn bir k\u0131sm\u0131n\u0131 i\u00e7erir.',
    standard: 'Standart: VDI 2230-1',
  },
};

const MAP: Record<Language, DedicatedCalcPageStrings> = {
  en: EN,
  tr: TR,
  de: EN,
  es: EN,
  fr: EN,
  it: EN,
  pt: EN,
  ru: EN,
  zh: EN,
  ja: EN,
  ko: EN,
  ar: EN,
};

export function getDedicatedCalcPage(locale: string): DedicatedCalcPageStrings {
  return MAP[locale as Language] ?? EN;
}
