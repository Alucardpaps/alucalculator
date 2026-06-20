import type { Language } from '@/store/i18nStore';

export type WorkstationLayoutStrings = {
  returnToCommandCenter: string;
  executeAnalysis: string;
  saveToWorkspace: string;
  status: string;
  statusIdle: string;
  statusStable: string;
  statusError: string;
  moduleLoading: string;
};

export type ResultPanelStrings = {
  processing: string;
  awaiting: string;
  reportIssue: string;
  engineVerified: string;
  hideLogs: string;
  inspect: string;
  calculatedStress: string;
  displacementTonnes: string;
  executionMs: string;
  determinism: string;
  executionTimeline: string;
  totalLogicStages: string;
  steps: string;
};

export type NavalPageStrings = {
  title: string;
  hullDimensions: string;
  length: string;
  beam: string;
  draft: string;
  blockCoeff: string;
  loadingStability: string;
  centerOfGravity: string;
  waterDensity: string;
  simulationFailed: string;
  marineAssessment: string;
  stable: string;
  unstable: string;
  stableDesc: string;
  unstableDesc: string;
  metacentricHeight: string;
  displacement: string;
  buoyancyForce: string;
  schematicCaption: string;
  initiating: string;
};

export type FailurePageStrings = {
  title: string;
  stressParameters: string;
  operatingStress: string;
  concentration: string;
  materialLimits: string;
  yieldStrength: string;
  enduranceLimit: string;
  diagnosticFailed: string;
  integrityDiagnosis: string;
  safe: string;
  critical: string;
  safeDesc: string;
  criticalDesc: string;
  primaryFailureMode: string;
  staticSf: string;
  fatigueSf: string;
  schematicCaption: string;
  waitingInput: string;
};

export type ShaftsPageStrings = {
  breadcrumb: string;
  assembly: string;
  title: string;
  subtitle: string;
  inputTitle: string;
  totalLength: string;
  forcePosition: string;
  assemblyConnector: string;
  refHint: string;
  refPlaceholder: string;
  appliedForce: string;
  reactionMatrix: string;
  reactionDesc: string;
  dataBusSync: string;
  dataBusDesc: string;
};

export type WorkstationPageStrings = {
  layout: WorkstationLayoutStrings;
  resultPanel: ResultPanelStrings;
  naval: NavalPageStrings;
  failure: FailurePageStrings;
  shafts: ShaftsPageStrings;
};

const EN: WorkstationPageStrings = {
  layout: {
    returnToCommandCenter: 'Return to Command Center',
    executeAnalysis: 'Execute Analysis',
    saveToWorkspace: 'Save to Workspace',
    status: 'Status',
    statusIdle: 'idle',
    statusStable: 'stable',
    statusError: 'error',
    moduleLoading: 'Loading...',
  },
  resultPanel: {
    processing: 'Processing Engine Request',
    awaiting: 'Awaiting Parameters',
    reportIssue: 'Report Issue',
    engineVerified: 'Engine Verified',
    hideLogs: 'Hide Logs',
    inspect: 'Inspect',
    calculatedStress: 'Calculated Stress Output',
    displacementTonnes: 'Displacement / Tonnes',
    executionMs: 'Execution',
    determinism: 'Determinism v1.0',
    executionTimeline: 'Execution Timeline',
    totalLogicStages: 'Total Logic Stages',
    steps: 'steps',
  },
  naval: {
    title: 'Naval Hydrostatics',
    hullDimensions: 'Hull Dimensions',
    length: 'Length (Lpp)',
    beam: 'Beam (B)',
    draft: 'Draft (T)',
    blockCoeff: 'Block Coeff (Cb)',
    loadingStability: 'Loading & Stability',
    centerOfGravity: 'Center of Gravity (KG)',
    waterDensity: 'Water Density',
    simulationFailed: 'Simulation Failed',
    marineAssessment: 'Marine Stability Assessment',
    stable: 'STABLE',
    unstable: 'UNSTABLE',
    stableDesc:
      'The vessel possesses a positive metacentric height, ensuring a self-righting moment during heeling.',
    unstableDesc:
      'WARNING: Negative GM detected. The vessel lacks initial stability and may capsize under external moments.',
    metacentricHeight: 'Metacentric Height (GM)',
    displacement: 'Displacement',
    buoyancyForce: 'Buoyancy Force',
    schematicCaption: 'Technical Schematic // Static Stability Curve',
    initiating: 'Initiating hydrostatic simulation...',
  },
  failure: {
    title: 'Failure Diagnosis',
    stressParameters: 'Stress Parameters',
    operatingStress: 'Operating Stress (\u03c3)',
    concentration: 'Kt (Concentration)',
    materialLimits: 'Material Limits',
    yieldStrength: 'Yield Strength (Sy)',
    enduranceLimit: 'Endurance Limit (Se)',
    diagnosticFailed: 'Diagnostic Failed',
    integrityDiagnosis: 'Structural Integrity Diagnosis',
    safe: 'SAFE',
    critical: 'CRITICAL',
    safeDesc:
      'The component is within safe operating limits for the specified cycles and load conditions.',
    criticalDesc:
      'WARNING: High probability of fatigue failure. The applied cyclic loads exceed the material endurance limit.',
    primaryFailureMode: 'Primary Failure Mode',
    staticSf: 'Static SF',
    fatigueSf: 'Fatigue SF',
    schematicCaption: 'Technical Schematic // S-N Fatigue Curve Analysis',
    waitingInput: 'Waiting for diagnostic input payload...',
  },
  shafts: {
    breadcrumb: 'Workstation',
    assembly: 'Assembly',
    title: 'Shaft Analysis',
    subtitle: 'Beam statics and reaction force resolution for bearings.',
    inputTitle: 'Shaft Statics & Loading',
    totalLength: 'Total Length (L)',
    forcePosition: 'Force Position (a)',
    assemblyConnector: 'Assembly Connector',
    refHint: 'Provide $ref to Gear Stress Output:',
    refPlaceholder: 'e.g. {calc_id}.stress',
    appliedForce: 'Applied Force (F)',
    reactionMatrix: 'Reaction Matrix',
    reactionDesc: 'Forces resolved at Support A and Support B for direct bearing load injection.',
    dataBusSync: 'Data-Bus Sync',
    dataBusDesc: 'Resolved values are tracked in the execution timeline for project-wide consistency.',
  },
};

const TR: WorkstationPageStrings = {
  layout: {
    returnToCommandCenter: 'Komuta Merkezine D\u00f6n',
    executeAnalysis: 'Analizi \u00c7al\u0131\u015ft\u0131r',
    saveToWorkspace: 'Workspace\u2019e Kaydet',
    status: 'Durum',
    statusIdle: 'beklemede',
    statusStable: 'kararl\u0131',
    statusError: 'hata',
    moduleLoading: 'Y\u00fckleniyor...',
  },
  resultPanel: {
    processing: 'Motor \u0130ste\u011fi \u0130\u015fleniyor',
    awaiting: 'Parametreler Bekleniyor',
    reportIssue: 'Sorun Bildir',
    engineVerified: 'Motor Do\u011fruland\u0131',
    hideLogs: 'Loglar\u0131 Gizle',
    inspect: '\u0130ncele',
    calculatedStress: 'Hesaplanan Gerilim \u00c7\u0131kt\u0131s\u0131',
    displacementTonnes: 'Deplasman / Ton',
    executionMs: '\u00c7al\u0131\u015ft\u0131rma',
    determinism: 'Determinizm v1.0',
    executionTimeline: '\u00c7al\u0131\u015ft\u0131rma Zaman \u00c7izelgesi',
    totalLogicStages: 'Toplam Mant\u0131k A\u015famas\u0131',
    steps: 'ad\u0131m',
  },
  naval: {
    title: 'Gemi Hidrostati\u011fi',
    hullDimensions: 'G\u00f6vde Boyutlar\u0131',
    length: 'Uzunluk (Lpp)',
    beam: 'Geni\u015flik (B)',
    draft: 'Su \u00c7ekimi (T)',
    blockCoeff: 'Blok Katsay\u0131s\u0131 (Cb)',
    loadingStability: 'Y\u00fckleme ve Stabilite',
    centerOfGravity: 'A\u011f\u0131rl\u0131k Merkezi (KG)',
    waterDensity: 'Su Yo\u011funlu\u011fu',
    simulationFailed: 'Sim\u00fclasyon Ba\u015far\u0131s\u0131z',
    marineAssessment: 'Denizcilik Stabilite De\u011ferlendirmesi',
    stable: 'STAB\u0130L',
    unstable: 'STAB\u0130L DE\u011e\u0130L',
    stableDesc:
      'Gemi pozitif metasantrik y\u00fcksekli\u011fe sahip; yalpalama s\u0131ras\u0131nda kendini d\u00fczeltme momenti sa\u011flar.',
    unstableDesc:
      'UYARI: Negatif GM tespit edildi. Gemi ba\u015flang\u0131\u00e7 stabilitesine sahip de\u011fil ve devrilebilir.',
    metacentricHeight: 'Metasantrik Y\u00fckseklik (GM)',
    displacement: 'Deplasman',
    buoyancyForce: 'Kald\u0131rma Kuvveti',
    schematicCaption: 'Teknik \u015eema // Statik Stabilite E\u011frisi',
    initiating: 'Hidrostatik sim\u00fclasyon ba\u015flat\u0131l\u0131yor...',
  },
  failure: {
    title: 'Ar\u0131za Te\u015fhisi',
    stressParameters: 'Gerilim Parametreleri',
    operatingStress: '\u00c7al\u0131\u015fma Gerilimi (\u03c3)',
    concentration: 'Kt (Konsantrasyon)',
    materialLimits: 'Malzeme Limitleri',
    yieldStrength: 'Akma Dayan\u0131m\u0131 (Sy)',
    enduranceLimit: 'Yorulma Limiti (Se)',
    diagnosticFailed: 'Te\u015fhis Ba\u015far\u0131s\u0131z',
    integrityDiagnosis: 'Yap\u0131sal B\u00fct\u00fcnl\u00fck Te\u015fhisi',
    safe: 'G\u00dcVENL\u0130',
    critical: 'KR\u0130T\u0130K',
    safeDesc:
      'Bile\u015fen belirtilen d\u00f6ng\u00fc ve y\u00fck ko\u015fullar\u0131 i\u00e7in g\u00fcvenli \u00e7al\u0131\u015fma s\u0131n\u0131rlar\u0131 i\u00e7inde.',
    criticalDesc:
      'UYARI: Y\u00fcksek yorulma ar\u0131zas\u0131 olas\u0131l\u0131\u011f\u0131. Uygulanan d\u00f6ng\u00fcsel y\u00fckler malzeme dayan\u0131m limitini a\u015f\u0131yor.',
    primaryFailureMode: 'Birincil Ar\u0131za Modu',
    staticSf: 'Statik SF',
    fatigueSf: 'Yorulma SF',
    schematicCaption: 'Teknik \u015eema // S-N Yorulma E\u011frisi Analizi',
    waitingInput: 'Te\u015fhis girdi y\u00fck\u00fc bekleniyor...',
  },
  shafts: {
    breadcrumb: 'Workstation',
    assembly: 'Montaj',
    title: 'Mil Analizi',
    subtitle: 'Rulmanlar i\u00e7in kiri\u015f stati\u011fi ve reaksiyon kuvveti \u00e7\u00f6z\u00fcm\u00fc.',
    inputTitle: 'Mil Stati\u011fi ve Y\u00fckleme',
    totalLength: 'Toplam Uzunluk (L)',
    forcePosition: 'Kuvvet Konumu (a)',
    assemblyConnector: 'Montaj Ba\u011flant\u0131s\u0131',
    refHint: 'Di\u015fli Gerilim \u00c7\u0131kt\u0131s\u0131 i\u00e7in $ref girin:',
    refPlaceholder: '\u00f6rn. {calc_id}.stress',
    appliedForce: 'Uygulanan Kuvvet (F)',
    reactionMatrix: 'Reaksiyon Matrisi',
    reactionDesc:
      'A ve B mesnetlerindeki kuvvetler rulman y\u00fck enjeksiyonu i\u00e7in \u00e7\u00f6z\u00fcl\u00fcr.',
    dataBusSync: 'Veri Yolu Senkronizasyonu',
    dataBusDesc:
      '\u00c7\u00f6z\u00fclen de\u011ferler proje genelinde tutarl\u0131l\u0131k i\u00e7in zaman \u00e7izelgesinde izlenir.',
  },
};

const MAP: Record<Language, WorkstationPageStrings> = {
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

export function getWorkstationPage(locale: string): WorkstationPageStrings {
  return MAP[locale as Language] ?? EN;
}
