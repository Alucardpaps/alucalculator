import type { Language } from '@/store/i18nStore';

export type GearsModuleStrings = {
  // General Header & Actions
  title: string;
  subtitle: string;
  export3D: string;
  export3DTooltip: string;
  exportCSV: string;
  exportCSVTooltip: string;
  exportPDF: string;
  exportPDFTooltip: string;

  // Workflow Modes
  pairMode: string;
  trainMode: string;

  // Multi-Gear Train Controls
  quickAddPresets: string;
  reset: string;
  addPlanetary: string;
  addInternal: string;
  addExternal: string;
  addCoaxial: string;
  presetLabel: string;
  presetCompound: string;
  presetPlanetary: string;
  presetHybrid: string;
  trainGearsTitle: string;
  coaxialTag: string;
  internalTag: string;
  planetaryTag: string;
  deleteGear: string;
  gearParamsTitle: string;
  shaftLabel: string;
  gearTypeLabel: string;
  externalType: string;
  internalType: string;
  planetaryType: string;
  sunTeeth: string;
  planetTeeth: string;
  computedRing: string;
  teethCount: string;
  gearModule: string;
  helixAngle: string;
  profileShift: string;
  faceWidth: string;
  materialType: string;
  trainMotorDrive: string;
  motorSpeedTorque: string;

  // Single Pair Controls
  toothGeometry: string;
  meshTypeLabel: string;
  externalPair: string;
  internalRing: string;
  pinionTeeth: string;
  gearTeeth: string;
  internalRingTeeth: string;
  pressureAngle: string;
  profileShiftSection: string;
  shiftX1: string;
  shiftX2: string;
  pinionPinDia: string;
  gearPinDia: string;
  workingPressureAngle: string;
  workingCenterDistance: string;
  wildhaberSpan: string;
  overPinsMeasure: string;
  materialSection: string;
  materialSelect: string;
  sigmaBending: string;
  sigmaContact: string;
  serviceConditions: string;
  loadClass: string;
  loadUniform: string;
  loadModerate: string;
  loadHeavy: string;
  dailyHours: string;
  hoursLess3: string;
  hours3to10: string;
  hoursMore10: string;
  startsPerHour: string;
  outputConnect: string;
  connDirect: string;
  connChain: string;
  connVBelt: string;
  connFlatBelt: string;
  serviceFactor: string;
  reqFs: string;
  motorLoad: string;
  motorPower: string;
  motorPoles: string;
  poles2: string;
  poles4: string;
  poles6: string;

  // Right Panel KPI & Visualizer
  kpiTotalRatio: string;
  kpiInputRpm: string;
  kpiOutputRpm: string;
  kpiOutputTorque: string;
  kpiTotalEfficiency: string;
  canvasTitle: string;
  viewBoth: string;
  viewFront: string;
  viewSection: string;
  designSafe: string;
  designWarning: string;
  bendingSafety: string;
  contactSafety: string;
  ratio: string;
  centerDist: string;
  pitchVelocity: string;
  contactRatio: string;
  circPitch: string;
  tipInterferenceWarning: string;
  internalMeshBlueprint: string;
  dynamicBlueprint: string;
  mfgDimensions: string;
  parameter: string;
  pinionCol: string;
  gearCol: string;
  internalGearCol: string;
  tipDia: string;
  refDia: string;
  rootDia: string;
  workingPitchDia?: string;
  workingPitchRadius?: string;
  baseDia?: string;
  ringOuterDia: string;
  overPins: string;
  mfgSheetTitle?: string;
  mfgSheetSubtitle?: string;
  alertTitle: string;
  alertDesc: string;

  // Descriptions & Tooltips
  descModule: string;
  descFaceWidth: string;
  descPinionTeeth: string;
  descGearTeeth: string;
  descHelixAngle: string;
  descPressureAngle: string;
  descMotorPower: string;
  descMaterial: string;
  descLoadClass: string;
  descDailyHours: string;
  descStartsPerHour: string;
  descConnection: string;
  descShiftX1: string;
  descShiftX2: string;
  descPoles: string;
  isoSubtitle: string;

  // Passport Strings
  clickGearHint: string;
  passportTitle: string;
  tabGages: string;
  tabMachining: string;
  tabForces: string;
  tabQuality: string;
  tabCarrier: string;
  sunGear: string;
  planetGear: string;
  ringGear: string;

  // KHK Gear Families
  khkFamilyTitle: string;
  khkCylindrical: string;
  khkInternal: string;
  khkRack: string;
  khkBevel: string;
  khkWorm: string;
  khkScrew: string;

  // Rack & Pinion
  rackTitle: string;
  rackPitchHeight: string;
  rackFeedForce: string;
  rackTravelPerRev: string;
  rackFeedVelocity: string;
  rackSeparatingForce: string;
  rackBlueprintTitle: string;

  // Bevel Gear
  bevelTitle: string;
  bevelGleasonSystem: string;
  bevelStandardSystem: string;
  bevelShaftAngle: string;
  bevelConeDistance: string;
  bevelApexToCrown: string;
  bevelMaxFaceWidth: string;
  bevelBlueprintTitle: string;

  // Worm Gear
  wormTitle: string;
  wormAxialModule: string;
  wormStarts: string;
  wormWheelTeeth: string;
  wormDiameterFactor: string;
  wormFrictionCoeff: string;
  wormSelfLocking: string;
  wormReversible: string;
  wormLeadAngle: string;
  wormEfficiency: string;
  wormOutputTorque: string;
  wormThroatRadius: string;
  wormBlueprintTitle: string;

  // Screw Gear
  screwTitle: string;
  screwHelixPinion: string;
  screwHelixGear: string;
  screwShaftAngle: string;
  screwSlidingVelocity: string;
  screwBlueprintTitle: string;
};

const EN: GearsModuleStrings = {
  title: "Gear Design & Strength",
  subtitle: "ISO 6336 Spur, Helical & Multi-Gear Train",
  export3D: "Export to 3D",
  export3DTooltip: "Exports gear geometry & kinematic parameters to 3D Design Studio & BOM",
  exportCSV: "CSV",
  exportCSVTooltip: "Download gear parameters & manufacturing table as CSV",
  exportPDF: "PDF",
  exportPDFTooltip: "Generate & print complete ISO 6336 Technical Drawing & Passport PDF",

  pairMode: "2-Gear Pair (Single Stage)",
  trainMode: "Multi-Gear & Compound Train",

  quickAddPresets: "Quick Add & Presets",
  reset: "Reset",
  addPlanetary: "+ Planetary Stage",
  addInternal: "+ Internal Ring",
  addExternal: "+ External Gear",
  addCoaxial: "+ Coaxial Shaft",
  presetLabel: "Presets:",
  presetCompound: "Compound Train",
  presetPlanetary: "Planetary Set",
  presetHybrid: "Int+Ext Hybrid",
  trainGearsTitle: "Train Gears",
  coaxialTag: "COAXIAL (SHAFT {n})",
  internalTag: "INTERNAL RING",
  planetaryTag: "PLANET SET",
  deleteGear: "Delete gear",
  gearParamsTitle: "Parameters",
  shaftLabel: "Shaft",
  gearTypeLabel: "Gear Type",
  externalType: "External Gear",
  internalType: "Internal Gear",
  planetaryType: "Planetary",
  sunTeeth: "Sun Gear (z_sun)",
  planetTeeth: "Planet Gear (z_p)",
  computedRing: "Computed Ring (z_ring):",
  teethCount: "Teeth Count (z)",
  gearModule: "Module (m)",
  helixAngle: "Helix Angle (β)",
  profileShift: "Profile Shift (x)",
  faceWidth: "Face Width (b)",
  materialType: "Material Grade",
  trainMotorDrive: "Drive Motor & Input Power",
  motorSpeedTorque: "Input Speed / Torque:",

  toothGeometry: "Tooth Geometry",
  meshTypeLabel: "Mesh Connection Type",
  externalPair: "External Gear Pair",
  internalRing: "Internal Gear (Ring)",
  pinionTeeth: "Pinion Teeth (z₁)",
  gearTeeth: "Driven Gear Teeth (z₂)",
  internalRingTeeth: "Ring Teeth (z₂)",
  pressureAngle: "Pressure Angle (αn)",
  profileShiftSection: "Profile Shift & Inspection (x₁, x₂)",
  shiftX1: "Pinion Shift (x₁)",
  shiftX2: "Gear Shift (x₂)",
  pinionPinDia: "Pinion Pin Dia (dp₁)",
  gearPinDia: "Gear Pin Dia (dp₂)",
  workingPressureAngle: "Working Pressure Angle (α_wt):",
  workingCenterDistance: "Working Center Distance (a_wt):",
  wildhaberSpan: "Wildhaber Span (W_k):",
  overPinsMeasure: "Over-Pins Dimension (M_d):",
  materialSection: "Material & Strength",
  materialSelect: "Gear Material",
  sigmaBending: "σ_Flim (Bending):",
  sigmaContact: "σ_Hlim (Contact):",
  serviceConditions: "Service Conditions & Service Factor",
  loadClass: "Load Characteristic",
  loadUniform: "Uniform (U)",
  loadModerate: "Moderate Shock (M)",
  loadHeavy: "Heavy Shock (H)",
  dailyHours: "Daily Operating Time",
  hoursLess3: "< 3 Hours/Day",
  hours3to10: "3 – 10 Hours/Day",
  hoursMore10: "> 10 Hours/Day",
  startsPerHour: "Starts / Hour",
  outputConnect: "Output Connection Type",
  connDirect: "Direct Coupling (fz=1.0)",
  connChain: "Sprocket / Chain (fz=1.25)",
  connVBelt: "V-Belt (fz=1.5)",
  connFlatBelt: "Flat Belt (fz=2.5)",
  serviceFactor: "Service Factor (fs)",
  reqFs: "Required Service Factor (fs_req):",
  motorLoad: "Drive & Motor",
  motorPower: "Motor Power (kW)",
  motorPoles: "Pole Count",
  poles2: "2 Poles (~3000 RPM)",
  poles4: "4 Poles (~1500 RPM)",
  poles6: "6 Poles (~1000 RPM)",

  kpiTotalRatio: "Total Ratio",
  kpiInputRpm: "Input Speed",
  kpiOutputRpm: "Output Speed",
  kpiOutputTorque: "Output Torque",
  kpiTotalEfficiency: "Total Efficiency",
  canvasTitle: "2D TECHNICAL DRAFTING CANVAS:",
  viewBoth: "Full Sheet (Front + Section)",
  viewFront: "Front Kinematics",
  viewSection: "Top Section",
  designSafe: "SCREENING TARGET MET — SAFE",
  designWarning: "WARNING: INSUFFICIENT SAFETY FACTOR",
  bendingSafety: "Tooth Root Bending Safety (SF)",
  contactSafety: "Tooth Flank Contact Safety (SH)",
  ratio: "Gear Ratio",
  centerDist: "Center Dist",
  pitchVelocity: "Pitch Velocity (v)",
  contactRatio: "Contact Ratio (εα)",
  circPitch: "Circ. Pitch (p)",
  tipInterferenceWarning: "TOOTH TIP INTERFERENCE (DIN 3960: Δz < 8)",
  internalMeshBlueprint: "INTERNAL RING & PINION MESH BLUEPRINT",
  dynamicBlueprint: "DYNAMIC MESH BLUEPRINT",
  mfgDimensions: "Manufacturing Dimensions (mm)",
  parameter: "Parameter",
  pinionCol: "Pinion (z₁)",
  gearCol: "Gear (z₂)",
  internalGearCol: "Internal Ring (z₂)",
  tipDia: "Tip Dia (da)",
  refDia: "Ref Dia (d)",
  rootDia: "Root Dia (df)",
  workingPitchDia: "Working Pitch Dia (dw)",
  workingPitchRadius: "Working Pitch Radius (rw)",
  baseDia: "Base Dia (db)",
  ringOuterDia: "Ring Outer Dia (D_ring)",
  overPins: "Over Pins (M)",
  mfgSheetTitle: "GEAR MANUFACTURING DATA SHEET (DIN 3960 / ISO 1328)",
  mfgSheetSubtitle: "Standard technical drawing manufacturing parameters & inspection table",
  alertTitle: "Safety Factor Below Threshold",
  alertDesc: "Root bending requires SF > 1.4, flank contact requires SF > 1.0. Increase module, face width, or select stronger material.",

  descModule: "Standard tooth size parameter; increases bending strength.",
  descFaceWidth: "Face width of the tooth; increases contact load capacity.",
  descPinionTeeth: "Pinion teeth count. Min 17 recommended to avoid undercut.",
  descGearTeeth: "Driven gear teeth count; determines speed reduction ratio.",
  descHelixAngle: "Helix angle. Increasing it grows mt = m/cosβ, so diameters and center distance (a) increase.",
  descPressureAngle: "Pressure (contact) angle. Affects base circle, over-pin dimension and radial force.",
  descMotorPower: "Nominal drive motor power based on IEC standards.",
  descMaterial: "Gear material chemistry; hardness limits safety margins.",
  descLoadClass: "Operational shock severity level.",
  descDailyHours: "Daily operating time.",
  descStartsPerHour: "Starts per hour; affects fatigue.",
  descConnection: "Output shaft connection factor.",
  descShiftX1: "Pinion profile shift; thickens tooth root.",
  descShiftX2: "Gear profile shift; avoids undercutting.",
  descPoles: "Motor pole count determines operating speed.",
  isoSubtitle: "ISO 6336 Spur & Helical",

  clickGearHint: "Click on any gear in the diagram to inspect manufacturing & machining parameters.",
  passportTitle: "Manufacturing Passport",
  tabGages: "Gages & Inspection",
  tabMachining: "Machining & Tooling",
  tabForces: "Forces & Strength",
  tabQuality: "Quality & Standards",
  tabCarrier: "Planetary Carrier",
  sunGear: "Sun Gear",
  planetGear: "Planet Gear",
  ringGear: "Ring Gear",

  // KHK Gear Families
  khkFamilyTitle: "KHK Gear Family",
  khkCylindrical: "Cylindrical",
  khkInternal: "Internal Ring",
  khkRack: "Rack & Pinion",
  khkBevel: "Bevel Gear",
  khkWorm: "Worm Gear",
  khkScrew: "Screw Gear",

  // Rack & Pinion
  rackTitle: "RACK & PINION PARAMETERS",
  rackPitchHeight: "Pitch Line Height (H)",
  rackFeedForce: "Linear Feed Thrust (Fx)",
  rackTravelPerRev: "Travel / 1 Rev",
  rackFeedVelocity: "Feed Velocity (v)",
  rackSeparatingForce: "Separating Force (Fr)",
  rackBlueprintTitle: "RACK & PINION PRECISION MESH BLUEPRINT",

  // Bevel Gear
  bevelTitle: "BEVEL GEAR PARAMETERS",
  bevelGleasonSystem: "Gleason System",
  bevelStandardSystem: "Standard Bevel",
  bevelShaftAngle: "Shaft Angle (Σ)",
  bevelConeDistance: "Outer Cone Distance (Re)",
  bevelApexToCrown: "Apex to Crown (X)",
  bevelMaxFaceWidth: "Max Face Width (b)",
  bevelBlueprintTitle: "GLEASON BEVEL GEAR SECTION & MESH BLUEPRINT",

  // Worm Gear
  wormTitle: "WORM & WHEEL PARAMETERS",
  wormAxialModule: "Axial Module (mx)",
  wormStarts: "Worm Starts (z₁)",
  wormWheelTeeth: "Wheel Teeth (z₂)",
  wormDiameterFactor: "Diameter Factor (q)",
  wormFrictionCoeff: "Friction Coeff (μ)",
  wormSelfLocking: "SELF-LOCKING (SAFE)",
  wormReversible: "REVERSIBLE (BACKDRIVE)",
  wormLeadAngle: "Lead Angle (γ)",
  wormEfficiency: "Mechanical Efficiency (η)",
  wormOutputTorque: "Output Torque (T₂)",
  wormThroatRadius: "Throat Radius (ri)",
  wormBlueprintTitle: "CYLINDRICAL WORM & GLOBOID WHEEL BLUEPRINT",

  // Screw Gear
  screwTitle: "CROSSED HELICAL PARAMETERS",
  screwHelixPinion: "Pinion Helix (β₁)",
  screwHelixGear: "Gear Helix (β₂)",
  screwShaftAngle: "Shaft Angle (Σ)",
  screwSlidingVelocity: "Sliding Speed (vs)",
  screwBlueprintTitle: "CROSSED HELICAL GEAR SPATIAL BLUEPRINT",
};

const TR: GearsModuleStrings = {
  title: "Dişli Tasarımı & Mukavemet",
  subtitle: "ISO 6336 Düz, Helis ve Çoklu Dişli Treni",
  export3D: "3D Aktar",
  export3DTooltip: "Dişli geometrisini ve kinematik parametrelerini 3D Tasarım Stüdyosuna ve BOM'a aktarır",
  exportCSV: "CSV",
  exportCSVTooltip: "Dişli ve imalat tablosunu CSV olarak indir",
  exportPDF: "PDF",
  exportPDFTooltip: "ISO 6336 Teknik Resim ve İmalat Pasaportunu PDF Olarak Kaydet / Yazdır",

  pairMode: "2'li Eşleşme (Çift)",
  trainMode: "Çoklu & Bileşik Tren",

  quickAddPresets: "Hızlı Ekle & Şablonlar",
  reset: "Sıfırla",
  addPlanetary: "+ Planet Redüktör",
  addInternal: "+ İç Dişli Ring",
  addExternal: "+ Dış Dişli",
  addCoaxial: "+ Koaksiyel Mil",
  presetLabel: "Hazır:",
  presetCompound: "Bileşik Tren",
  presetPlanetary: "Planet Set",
  presetHybrid: "İç+Dış Hibrit",
  trainGearsTitle: "Tren Dişlileri",
  coaxialTag: "KOAKSİYEL (MİL {n})",
  internalTag: "İÇ DİŞLİ",
  planetaryTag: "PLANET SET",
  deleteGear: "Dişliyi sil",
  gearParamsTitle: "Parametreleri",
  shaftLabel: "Mil",
  gearTypeLabel: "Dişli Türü",
  externalType: "Dış Dişli",
  internalType: "İç Dişli",
  planetaryType: "Planet",
  sunTeeth: "Güneş Dişlisi (z_sun)",
  planetTeeth: "Planet Dişlisi (z_p)",
  computedRing: "Hesaplanan Çember (z_ring):",
  teethCount: "Diş Sayısı (z)",
  gearModule: "Modül (m)",
  helixAngle: "Helis Açısı (β)",
  profileShift: "Profil Kaydırma (x)",
  faceWidth: "Diş Genişliği (b)",
  materialType: "Malzeme Cinsi",
  trainMotorDrive: "Tahrik Motoru & Giriş Gücü",
  motorSpeedTorque: "Giriş Devri / Torku:",

  toothGeometry: "Diş Geometrisi",
  meshTypeLabel: "Bağlantı Türü",
  externalPair: "Dış Dişli Çifti",
  internalRing: "İç Dişli (Ring)",
  pinionTeeth: "Pinyon Diş Sayısı (z₁)",
  gearTeeth: "Çark Diş Sayısı (z₂)",
  internalRingTeeth: "İç Dişli Sayısı (z₂)",
  pressureAngle: "Kavrama Açısı (αn)",
  profileShiftSection: "Profil Kaydırma & Kontrol (x₁, x₂)",
  shiftX1: "Pinyon Kaydırma (x₁)",
  shiftX2: "Çark Kaydırma (x₂)",
  pinionPinDia: "Pinyon Pim Çapı (dp₁)",
  gearPinDia: "Çark Pim Çapı (dp₂)",
  workingPressureAngle: "İşletme Kavrama Açısı (α_wt):",
  workingCenterDistance: "İşletme Eksen Mesafesi (a_wt):",
  wildhaberSpan: "Wildhaber Kiriş Ölçüsü (W_k):",
  overPinsMeasure: "Pimler Üzeri Ölçü (M_d):",
  materialSection: "Malzeme & Mukavemet",
  materialSelect: "Dişli Malzemesi",
  sigmaBending: "σ_Flim (Eğilme):",
  sigmaContact: "σ_Hlim (Ezilme):",
  serviceConditions: "İşletme Şartları & Servis Faktörü",
  loadClass: "Yük Karakteristiği",
  loadUniform: "Düzgün Yük (U)",
  loadModerate: "Orta Darbeli (M)",
  loadHeavy: "Ağır Şok (H)",
  dailyHours: "Günlük Çalışma",
  hoursLess3: "< 3 Saat/Gün",
  hours3to10: "3 – 10 Saat/Gün",
  hoursMore10: "> 10 Saat/Gün",
  startsPerHour: "Başlatma / Saat",
  outputConnect: "Çıkış Bağlantı Türü",
  connDirect: "Kaplin / Direkt (fz=1.0)",
  connChain: "Zincir Dişli (fz=1.25)",
  connVBelt: "V-Kayış (fz=1.5)",
  connFlatBelt: "Düz Kayış (fz=2.5)",
  serviceFactor: "Servis Faktörü (fs)",
  reqFs: "Gerekli Servis Faktörü (fs_req):",
  motorLoad: "Tahrik & Motor",
  motorPower: "Motor Gücü (kW)",
  motorPoles: "Kutup Sayısı",
  poles2: "2 Kutup (~3000 RPM)",
  poles4: "4 Kutup (~1500 RPM)",
  poles6: "6 Kutup (~1000 RPM)",

  kpiTotalRatio: "Toplam Çevrim Oranı",
  kpiInputRpm: "Giriş Devri",
  kpiOutputRpm: "Çıkış Devri",
  kpiOutputTorque: "Çıkış Torku",
  kpiTotalEfficiency: "Toplam Verim",
  canvasTitle: "2D TEKNİK RESİM KANVASI:",
  viewBoth: "Tam Levha (Önden + Kesit)",
  viewFront: "Önden Kinematik",
  viewSection: "Üstten Kesit",
  designSafe: "ÖN ELEME HEDEFİ SAĞLANDI — GÜVENLİ",
  designWarning: "UYARI: YETERSİZ GÜVENLİK FAKTÖRÜ",
  bendingSafety: "Diş Dibi Eğilme Emniyeti (SF)",
  contactSafety: "Diş Yüzeyi Ezilme Emniyeti (SH)",
  ratio: "Çevrim Oranı",
  centerDist: "Eksen Mesafesi",
  pitchVelocity: "Çevre Hızı (v)",
  contactRatio: "Kavrama Oranı (εα)",
  circPitch: "Diş Adımı (p)",
  tipInterferenceWarning: "DİŞ TEPE GİRİŞİMİ (DIN 3960: Δz < 8)",
  internalMeshBlueprint: "İÇ DİŞLİ VE PİNYON KAVRAMA ŞEMASI",
  dynamicBlueprint: "DİNAMİK DİŞLİ ŞABLONU",
  mfgDimensions: "İmalat Boyutları (mm)",
  parameter: "Parametre",
  pinionCol: "Pinyon (z₁)",
  gearCol: "Çark (z₂)",
  internalGearCol: "İç Dişli (z₂)",
  tipDia: "Diş Üstü Çapı (da)",
  refDia: "Bölüm / Referans Çapı (d)",
  rootDia: "Diş Dibi / Kök Çapı (df)",
  workingPitchDia: "Yuvarlanma Çapı (dw)",
  workingPitchRadius: "Yuvarlanma Yarıçapı (rw)",
  baseDia: "Temel Daire Çapı (db)",
  ringOuterDia: "Halka Dış Çapı (D_ring)",
  overPins: "Pimler Üzeri Ölçü (M)",
  mfgSheetTitle: "DİŞLİ İMALAT TABLOSU (DIN 3960 / ISO 1328)",
  mfgSheetSubtitle: "Teknik resim imalat verileri & kalite kontrol parametreleri tablosu",
  alertTitle: "Güvenlik Sınırının Altında",
  alertDesc: "Diş dibi eğilmesi için SF > 1.4, yüzey ezilmesi için SF > 1.0 olmalıdır. Modülü, diş genişliğini veya malzeme dayanımını artırın.",

  descModule: "Diş boyutu ve dayanımını belirleyen modül değeri.",
  descFaceWidth: "Diş genişliği. Genişlik arttıkça yük taşıma kapasitesi artar.",
  descPinionTeeth: "Pinyon diş sayısı. Girişimi önlemek için min. 17 önerilir.",
  descGearTeeth: "Dişli diş sayısı. Hızı düşürme oranını belirler.",
  descHelixAngle: "Helis açısı. Artırınca mt = m/cos(β) büyür; çaplar ve eksenler arası mesafe (a) artar.",
  descPressureAngle: "Kavrama (değme) açısı. Taban dairesini, ölçü piminden ölçüyü ve radyal kuvveti değiştirir.",
  descMotorPower: "Tahrik motoru nominal gücü (IEC standartları).",
  descMaterial: "Dişli malzemesi. Sertlik yük sınırlarını belirler.",
  descLoadClass: "Çalışmadaki şok seviyesi.",
  descDailyHours: "Günlük toplam çalışma süresi.",
  descStartsPerHour: "Saatteki start-stop sayısı.",
  descConnection: "Mil bağlantı tipi.",
  descShiftX1: "Pinyon dişli profil kaydırma miktarı.",
  descShiftX2: "Dişli profil kaydırma miktarı.",
  descPoles: "Motorun kutup sayısı devir hızını belirler.",
  isoSubtitle: "ISO 6336 Düz ve Helisel",

  clickGearHint: "İmalat ve talaşlı işleme parametrelerini görmek için şemadan bir dişliye tıklayın.",
  passportTitle: "İmalat Pasaportu",
  tabGages: "Mastar & Kontrol",
  tabMachining: "Talaşlı İmalat",
  tabForces: "Kuvvetler & Mukavemet",
  tabQuality: "Kalite & Standartlar",
  tabCarrier: "Planet Taşıyıcı",
  sunGear: "Güneş Dişlisi",
  planetGear: "Planet Dişlisi",
  ringGear: "İç Çember (Ring)",

  // KHK Gear Families
  khkFamilyTitle: "KHK Dişli Mimarisi",
  khkCylindrical: "Silindirik",
  khkInternal: "İç Dişli",
  khkRack: "Kremayer",
  khkBevel: "Konik",
  khkWorm: "Sonsuz Vida",
  khkScrew: "Çapraz Helis",

  // Rack & Pinion
  rackTitle: "KREMAYER & PİNYON GİRDİLERİ",
  rackPitchHeight: "Bölüm Yüksekliği (H)",
  rackFeedForce: "Doğrusal İtme Kuvveti (Fx)",
  rackTravelPerRev: "1 Turda İlerleme",
  rackFeedVelocity: "İlerleme Hızı (v)",
  rackSeparatingForce: "Ayrılma Kuvveti (Fr)",
  rackBlueprintTitle: "KREMAYER - PİNYON HASSAS KAVRAMA ŞEMASI",

  // Bevel Gear
  bevelTitle: "KONİK DİŞLİ GİRDİLERİ",
  bevelGleasonSystem: "Gleason Sistemi",
  bevelStandardSystem: "Standart Konik",
  bevelShaftAngle: "Mil Açısı (Σ)",
  bevelConeDistance: "Dış Koni Mesafesi (Re)",
  bevelApexToCrown: "Tepe - Taç Mesafesi (X)",
  bevelMaxFaceWidth: "Azami Diş Eni (b)",
  bevelBlueprintTitle: "GLEASON KONİK DİŞLİ KESİT & KAVRAMA ŞEMASI",

  // Worm Gear
  wormTitle: "SONSUZ VİDA & ÇARK GİRDİLERİ",
  wormAxialModule: "Eksenel Modül (mx)",
  wormStarts: "Vida Ağız Sayısı (z₁)",
  wormWheelTeeth: "Çark Diş Sayısı (z₂)",
  wormDiameterFactor: "Çap Katsayısı (q)",
  wormFrictionCoeff: "Sürtünme Katsayısı (μ)",
  wormSelfLocking: "KENDİ KENDİNE KİLİTLENİR (OTO-BLOKAJ)",
  wormReversible: "TERS SÜRÜLEBİLİR (SERBEST)",
  wormLeadAngle: "Vida Hatve Açısı (γ)",
  wormEfficiency: "Mekanik Verim (η)",
  wormOutputTorque: "Çıkış Torku (T₂)",
  wormThroatRadius: "Boğaz Yarıçapı (ri)",
  wormBlueprintTitle: "SONSUZ VİDA & GLOBOİD ÇARK HASSAS KAVRAMA ŞEMASI",

  // Screw Gear
  screwTitle: "ÇAPRAZ HELİS GİRDİLERİ",
  screwHelixPinion: "Pinyon Helis Açısı (β₁)",
  screwHelixGear: "Çark Helis Açısı (β₂)",
  screwShaftAngle: "Uzaysal Mil Açısı (Σ)",
  screwSlidingVelocity: "Kayma Hızı (vs)",
  screwBlueprintTitle: "ÇAPRAZ HELİS UZAYSAL KAVRAMA ŞEMASI",
};

const DE: GearsModuleStrings = {
  ...EN,
  title: "Getriebeberechnung & Festigkeit",
  subtitle: "ISO 6336 Stirn-, Schräg- & Mehrstufengetriebe",
  export3D: "In 3D exportieren",
  export3DTooltip: "Überträgt Verzahnungsdaten in das 3D Design Studio & Stückliste",
  pairMode: "2-Rad Paar (Einzelstufe)",
  trainMode: "Mehrstufen- & Koppelgetriebe",
  quickAddPresets: "Schnell hinzufügen & Vorlagen",
  reset: "Zurücksetzen",
  addPlanetary: "+ Planetenstufe",
  addInternal: "+ Hohlrad",
  addExternal: "+ Stirnrad",
  addCoaxial: "+ Koaxialwelle",
  presetLabel: "Vorlagen:",
  presetCompound: "Stufengetriebe",
  presetPlanetary: "Planetensatz",
  presetHybrid: "Innen+Außen Hybrid",
  trainGearsTitle: "Getrieberäder",
  gearParamsTitle: "Parameter",
  shaftLabel: "Welle",
  gearTypeLabel: "Zahnradtyp",
  externalType: "Außenverzahnung",
  internalType: "Innenverzahnung",
  planetaryType: "Planetenstufe",
  toothGeometry: "Zahngeometrie",
  meshTypeLabel: "Eingriffsart",
  externalPair: "Außenradpaar",
  internalRing: "Innenzahnkranz (Hohlrad)",
  pinionTeeth: "Ritzel Zähnezahl (z₁)",
  gearTeeth: "Rad Zähnezahl (z₂)",
  pressureAngle: "Eingriffswinkel (αn)",
  profileShiftSection: "Profilverschiebung & Prüfung (x₁, x₂)",
  shiftX1: "Profilverschiebung x₁",
  shiftX2: "Profilverschiebung x₂",
  materialSection: "Werkstoff & Festigkeit",
  materialSelect: "Werkstoff",
  serviceConditions: "Betriebsbedingungen & Betriebsfaktor",
  loadClass: "Lastklasse",
  dailyHours: "Tägliche Betriebszeit",
  startsPerHour: "Starts / Stunde",
  outputConnect: "Wellenanschluss",
  serviceFactor: "Betriebsfaktor (fs)",
  motorLoad: "Antrieb & Motor",
  motorPower: "Motorleistung (kW)",
  motorPoles: "Polzahl",
  kpiTotalRatio: "Gesamtübersetzung",
  kpiInputRpm: "Eingangsdrehzahl",
  kpiOutputRpm: "Ausgangsdrehzahl",
  kpiOutputTorque: "Ausgangsdrehmoment",
  kpiTotalEfficiency: "Gesamtwirkungsgrad",
  canvasTitle: "2D TECHNISCHE ZEICHNUNG:",
  viewBoth: "Gesamtblatt (Vorne + Schnitt)",
  viewFront: "Kinematik (Vorne)",
  viewSection: "Draufsicht (Schnitt)",
  designSafe: "AUSLEGUNG VERIFIZIERT — SICHER",
  designWarning: "WARNUNG: UNZUREICHENDER SICHERHEITSFAKTOR",
  bendingSafety: "Zahnfuß-Sicherheit (SF)",
  contactSafety: "Flanken-Sicherheit (SH)",
  ratio: "Übersetzung",
  centerDist: "Achsabstand",
  pitchVelocity: "Umfangsgeschwindigkeit (v)",
  mfgDimensions: "Fertigungsmaße (mm)",
  parameter: "Parameter",
  pinionCol: "Ritzel (z₁)",
  gearCol: "Rad (z₂)",
  tipDia: "Kopfkreis (da)",
  refDia: "Teilkreis (d)",
  rootDia: "Fußkreis (df)",
  overPins: "Rollenmaß (M)",
  clickGearHint: "Klicken Sie auf ein Zahnrad im Schema, um Fertigungsparameter anzuzeigen.",
  passportTitle: "Fertigungspass",
  tabGages: "Lehren & Messung",
  tabMachining: "Zerspanung & Werkzeuge",
  tabForces: "Kräfte & Festigkeit",
  tabQuality: "Qualität & Normen",
  tabCarrier: "Planetenträger",

  // KHK Gear Families
  khkFamilyTitle: "KHK Getriebefamilie",
  khkCylindrical: "Zylindrisch",
  khkInternal: "Hohlrad",
  khkRack: "Zahnstange",
  khkBevel: "Kegelrad",
  khkWorm: "Schneckengetriebe",
  khkScrew: "Schraubenrad",

  // Rack & Pinion
  rackTitle: "ZAHNSTANGEN-PARAMETER",
  rackPitchHeight: "Teilungshöhe (H)",
  rackFeedForce: "Vorschubkraft (Fx)",
  rackTravelPerRev: "Vorschub / Umdrehung",
  rackFeedVelocity: "Vorschubgeschwindigkeit (v)",
  rackSeparatingForce: "Trennkraft (Fr)",
  rackBlueprintTitle: "ZAHNSTANGEN-RITZEL-EINGRIFFSPLAN",

  // Bevel Gear
  bevelTitle: "KEGELRAD-PARAMETER",
  bevelGleasonSystem: "Gleason-System",
  bevelStandardSystem: "Standard-Kegelrad",
  bevelShaftAngle: "Achswinkel (Σ)",
  bevelConeDistance: "Äußere Teillänge (Re)",
  bevelApexToCrown: "Spitzenabstand (X)",
  bevelMaxFaceWidth: "Max. Zahnbreite (b)",
  bevelBlueprintTitle: "GLEASON-KEGELRAD SCHNITT- UND EINGRIFFSPLAN",

  // Worm Gear
  wormTitle: "SCHNECKENGETRIEBE-PARAMETER",
  wormAxialModule: "Axialmodul (mx)",
  wormStarts: "Gangzahl (z₁)",
  wormWheelTeeth: "Schneckenradzähne (z₂)",
  wormDiameterFactor: "Durchmesserfaktor (q)",
  wormFrictionCoeff: "Reibungskoeffizient (μ)",
  wormSelfLocking: "SELBSTHEMMEND (SICHER)",
  wormReversible: "RÜCKTREIBBAR",
  wormLeadAngle: "Steigungswinkel (γ)",
  wormEfficiency: "Wirkungsgrad (η)",
  wormOutputTorque: "Abtriebsdrehmoment (T₂)",
  wormThroatRadius: "Halsradius (ri)",
  wormBlueprintTitle: "SCHNECKEN- UND GLOBOIDRAD-EINGRIFFSPLAN",

  // Screw Gear
  screwTitle: "SCHRAUBENRAD-PARAMETER",
  screwHelixPinion: "Schrägungswinkel Ritzel (β₁)",
  screwHelixGear: "Schrägungswinkel Rad (β₂)",
  screwShaftAngle: "Achsenkreuzungswinkel (Σ)",
  screwSlidingVelocity: "Gleitgeschwindigkeit (vs)",
  screwBlueprintTitle: "KREUZSCHRAUBENRAD-RAUMPLAN",
};

const ES: GearsModuleStrings = {
  ...EN,
  title: "Diseño de Engranajes y Resistencia",
  subtitle: "ISO 6336 Rectos, Helicoidales y Trenes de Engranajes",
  export3D: "Exportar a 3D",
  pairMode: "Par de Engranajes",
  trainMode: "Tren de Engranajes Múltiple",
  toothGeometry: "Geometría del Diente",
  materialSection: "Material y Resistencia",
  serviceConditions: "Condiciones de Servicio",
  profileShift: "Desplazamiento de Perfil",
  loadClass: "Clase de Carga",
  dailyHours: "Horas Diarias",
  designSafe: "DISEÑO VERIFICADO — SEGURO",
  designWarning: "ADVERTENCIA: FACTOR DE SEGURIDAD INSUFICIENTE",
  bendingSafety: "Seguridad a Flexión (SF)",
  contactSafety: "Seguridad a Contacto (SH)",
  mfgDimensions: "Dimensiones de Fabricación (mm)",
  passportTitle: "Pasaporte de Fabricación",

  // KHK Gear Families
  khkFamilyTitle: "Familia de Engranajes KHK",
  khkCylindrical: "Cilíndrico",
  khkInternal: "Corona Interior",
  khkRack: "Cremallera",
  khkBevel: "Cónico",
  khkWorm: "Tornillo Sin Fin",
  khkScrew: "Helicoidal Cruzado",

  // Rack & Pinion
  rackTitle: "PARÁMETROS CREMALLERA Y PIÑÓN",
  rackPitchHeight: "Altura Primitiva (H)",
  rackFeedForce: "Fuerza de Avance (Fx)",
  rackTravelPerRev: "Avance / Revolución",
  rackFeedVelocity: "Velocidad de Avance (v)",
  rackSeparatingForce: "Fuerza Radial (Fr)",
  rackBlueprintTitle: "PLANO DE ENGRANE PIÑÓN-CREMALLERA",

  // Bevel Gear
  bevelTitle: "PARÁMETROS ENGRANAJE CÓNICO",
  bevelGleasonSystem: "Sistema Gleason",
  bevelStandardSystem: "Cónico Estándar",
  bevelShaftAngle: "Ángulo entre Ejes (Σ)",
  bevelConeDistance: "Distancia de Cono Exterior (Re)",
  bevelApexToCrown: "Distancia Vértice-Corona (X)",
  bevelMaxFaceWidth: "Ancho de Diente Máx (b)",
  bevelBlueprintTitle: "SECCIÓN Y ENGRANE CÓNICO GLEASON",

  // Worm Gear
  wormTitle: "PARÁMETROS SINFÍN Y CORONA",
  wormAxialModule: "Módulo Axial (mx)",
  wormStarts: "Número de Entradas (z₁)",
  wormWheelTeeth: "Dientes de la Corona (z₂)",
  wormDiameterFactor: "Factor de Diámetro (q)",
  wormFrictionCoeff: "Coeficiente de Fricción (μ)",
  wormSelfLocking: "AUTOBLOQUEANTE (SEGURO)",
  wormReversible: "REVERSIBLE",
  wormLeadAngle: "Ángulo de Hélice (γ)",
  wormEfficiency: "Rendimiento Mecánico (η)",
  wormOutputTorque: "Par de Salida (T₂)",
  wormThroatRadius: "Radio de Garganta (ri)",
  wormBlueprintTitle: "PLANO DE SINFÍN CILÍNDRICO Y CORONA GLOBOIDE",

  // Screw Gear
  screwTitle: "PARÁMETROS HELICOIDALES CRUZADOS",
  screwHelixPinion: "Hélice Piñón (β₁)",
  screwHelixGear: "Hélice Rueda (β₂)",
  screwShaftAngle: "Ángulo de Ejes (Σ)",
  screwSlidingVelocity: "Velocidad de Deslizamiento (vs)",
  screwBlueprintTitle: "PLANO ESPACIAL HELICOIDAL CRUZADO",
};

const FR: GearsModuleStrings = {
  ...EN,
  title: "Conception et Résistance des Engrenages",
  subtitle: "ISO 6336 Droits, Hélicoïdaux et Trains d'Engrenages",
  export3D: "Exporter en 3D",
  pairMode: "Paire d'Engrenages",
  trainMode: "Train d'Engrenages Multiple",
  toothGeometry: "Géométrie Dentaire",
  materialSection: "Matériau et Résistance",
  serviceConditions: "Conditions de Service",
  profileShift: "Déport de Profil",
  designSafe: "CONCEPTION VÉRIFIÉE — SÛRE",
  designWarning: "ALERTE : FACTEUR DE SÉCURITÉ INSUFFISANT",
  bendingSafety: "Sécurité Flexion Racine (SF)",
  contactSafety: "Sécurité Contact Flanc (SH)",
  mfgDimensions: "Dimensions de Fabrication (mm)",
  passportTitle: "Passeport de Fabrication",

  // KHK Gear Families
  khkFamilyTitle: "Famille d'Engrenages KHK",
  khkCylindrical: "Cylindrique",
  khkInternal: "Couronne Interne",
  khkRack: "Crémaillère",
  khkBevel: "Conique",
  khkWorm: "Roue et Vis Sans Fin",
  khkScrew: "Hélicoïdal Croisé",

  // Rack & Pinion
  rackTitle: "PARAMÈTRES PIGNON-CRÉMAILLÈRE",
  rackPitchHeight: "Hauteur Primitive (H)",
  rackFeedForce: "Force d'Avance (Fx)",
  rackTravelPerRev: "Avance / Tour",
  rackFeedVelocity: "Vitesse d'Avance (v)",
  rackSeparatingForce: "Force Radiale (Fr)",
  rackBlueprintTitle: "PLAN D'ENGRENEMENT PIGNON-CRÉMAILLÈRE",

  // Bevel Gear
  bevelTitle: "PARAMÈTRES ENGRENAGE CONIQUE",
  bevelGleasonSystem: "Système Gleason",
  bevelStandardSystem: "Conique Standard",
  bevelShaftAngle: "Angle des Arbres (Σ)",
  bevelConeDistance: "Distance de Cône Externe (Re)",
  bevelApexToCrown: "Distance Sommet-Couronne (X)",
  bevelMaxFaceWidth: "Largeur de Denture Max (b)",
  bevelBlueprintTitle: "SECTION ET ENGRENEMENT CONIQUE GLEASON",

  // Worm Gear
  wormTitle: "PARAMÈTRES ROUE ET VIS SANS FIN",
  wormAxialModule: "Module Axial (mx)",
  wormStarts: "Nombre de Filets (z₁)",
  wormWheelTeeth: "Dents de la Roue (z₂)",
  wormDiameterFactor: "Facteur de Diamètre (q)",
  wormFrictionCoeff: "Coefficient de Frottement (μ)",
  wormSelfLocking: "AUTO-BLOQUANT (SÉCURITÉ)",
  wormReversible: "RÉVERSIBLE",
  wormLeadAngle: "Angle d'Hélice (γ)",
  wormEfficiency: "Rendement Mécanique (η)",
  wormOutputTorque: "Couple de Sortie (T₂)",
  wormThroatRadius: "Rayon de Gorge (ri)",
  wormBlueprintTitle: "PLAN VIS CYLINDRIQUE ET ROUE GLOBOÏDE",

  // Screw Gear
  screwTitle: "PARAMÈTRES ENGRENAGES HÉLICOÏDAUX CROISÉS",
  screwHelixPinion: "Hélice Pignon (β₁)",
  screwHelixGear: "Hélice Roue (β₂)",
  screwShaftAngle: "Angle des Arbres (Σ)",
  screwSlidingVelocity: "Vitesse de Glissement (vs)",
  screwBlueprintTitle: "PLAN SPATIAL HÉLICOÏDAL CROISÉ",
};

const IT: GearsModuleStrings = {
  ...EN,
  title: "Progettazione Ingranaggi e Resistenza",
  subtitle: "ISO 6336 Cilindrici, Elicoidali e Treni di Ingranaggi",
  export3D: "Esporta in 3D",
  pairMode: "Coppia Ingranaggi",
  trainMode: "Treno di Ingranaggi Multiplo",
  toothGeometry: "Geometria del Dente",
  materialSection: "Materiale e Resistenza",
  serviceConditions: "Condizioni di Servizio",
  designSafe: "PROGETTO VERIFICATO — SICURO",
  designWarning: "ATTENZIONE: FATTORE DI SICUREZZA INSUFFICIENTE",
  bendingSafety: "Sicurezza Flessione Radice (SF)",
  contactSafety: "Sicurezza Pressione Fianco (SH)",
  mfgDimensions: "Dimensioni di Produzione (mm)",
  passportTitle: "Passaporto di Produzione",

  // KHK Gear Families
  khkFamilyTitle: "Famiglia Ingranaggi KHK",
  khkCylindrical: "Cilindrico",
  khkInternal: "Corona Interna",
  khkRack: "Cremagliera",
  khkBevel: "Conico",
  khkWorm: "Vite Senza Fine",
  khkScrew: "Elicoidale Incrociato",

  // Rack & Pinion
  rackTitle: "PARAMETRI PIGNONE-CREMAGLIERA",
  rackPitchHeight: "Altezza Primitiva (H)",
  rackFeedForce: "Forza di Avanzamento (Fx)",
  rackTravelPerRev: "Avanzamento / Giro",
  rackFeedVelocity: "Velocità di Avanzamento (v)",
  rackSeparatingForce: "Forza Radiale (Fr)",
  rackBlueprintTitle: "SCHEMA D'INGRANAMENTO PIGNONE-CREMAGLIERA",

  // Bevel Gear
  bevelTitle: "PARAMETRI INGRANAGGIO CONICO",
  bevelGleasonSystem: "Sistema Gleason",
  bevelStandardSystem: "Conico Standard",
  bevelShaftAngle: "Angolo Tra gli Alberi (Σ)",
  bevelConeDistance: "Distanza Conica Esterna (Re)",
  bevelApexToCrown: "Distanza Vertice-Corona (X)",
  bevelMaxFaceWidth: "Larghezza Fascia Max (b)",
  bevelBlueprintTitle: "SEZIONE E INGRANAMENTO CONICO GLEASON",

  // Worm Gear
  wormTitle: "PARAMETRI VITE SENZA FINE E RUOTA",
  wormAxialModule: "Modulo Assiale (mx)",
  wormStarts: "Principi Vite (z₁)",
  wormWheelTeeth: "Denti Ruota (z₂)",
  wormDiameterFactor: "Fattore di Diametro (q)",
  wormFrictionCoeff: "Coefficiente di Attrito (μ)",
  wormSelfLocking: "AUTOBLOCCANTE (SICURO)",
  wormReversible: "REVERSIBILE",
  wormLeadAngle: "Angolo d'Elica (γ)",
  wormEfficiency: "Rendimento Meccanico (η)",
  wormOutputTorque: "Coppia d'Uscita (T₂)",
  wormThroatRadius: "Raggio di Gola (ri)",
  wormBlueprintTitle: "SCHEMA VITE CILINDRICA E RUOTA GLOBOIDE",

  // Screw Gear
  screwTitle: "PARAMETRI ELICOIDALI INCROCIATI",
  screwHelixPinion: "Elica Pignone (β₁)",
  screwHelixGear: "Elica Ruota (β₂)",
  screwShaftAngle: "Angolo Assi (Σ)",
  screwSlidingVelocity: "Velocità di Strisciamento (vs)",
  screwBlueprintTitle: "SCHEMA SPAZIALE ELICOIDALE INCROCIATO",
};

const PT: GearsModuleStrings = {
  ...EN,
  title: "Projeto de Engrenagens e Resistência",
  subtitle: "ISO 6336 Retas, Helicoidais e Trens de Engrenagens",
  export3D: "Exportar para 3D",
  pairMode: "Par de Engranagens",
  trainMode: "Trem de Engrenagens Múltiplo",
  toothGeometry: "Geometria do Dente",
  materialSection: "Material e Resistência",
  serviceConditions: "Condições de Serviço",
  designSafe: "PROJETO VERIFICADO — SEGURO",
  designWarning: "AVISO: FATOR DE SEGURANÇA INSUFICIENTE",
  bendingSafety: "Segurança Flexão Raiz (SF)",
  contactSafety: "Segurança Contacto Flanco (SH)",
  mfgDimensions: "Dimensões de Fabrico (mm)",
  passportTitle: "Passaporto de Fabrico",

  // KHK Gear Families
  khkFamilyTitle: "Família de Engrenagens KHK",
  khkCylindrical: "Cilíndrica",
  khkInternal: "Coroa Interna",
  khkRack: "Cremalheira",
  khkBevel: "Cônica",
  khkWorm: "Sem-Fim e Coroa",
  khkScrew: "Helicoidal Cruzada",

  // Rack & Pinion
  rackTitle: "PARÂMETROS PINHÃO E CREMALHEIRA",
  rackPitchHeight: "Altura Primitiva (H)",
  rackFeedForce: "Força de Avanço (Fx)",
  rackTravelPerRev: "Avanço / Volta",
  rackFeedVelocity: "Velocidade de Avanço (v)",
  rackSeparatingForce: "Força Radial (Fr)",
  rackBlueprintTitle: "PLANO DE ENGRENAMENTO PINHÃO-CREMALHEIRA",

  // Bevel Gear
  bevelTitle: "PARÂMETROS ENGRENAGEM CÔNICA",
  bevelGleasonSystem: "Sistema Gleason",
  bevelStandardSystem: "Cônica Padrão",
  bevelShaftAngle: "Ângulo dos Eixos (Σ)",
  bevelConeDistance: "Distância Cônica Externa (Re)",
  bevelApexToCrown: "Distância Vértice-Coroa (X)",
  bevelMaxFaceWidth: "Largura Máx do Dente (b)",
  bevelBlueprintTitle: "SEÇÃO E ENGRENAMENTO CÔNICO GLEASON",

  // Worm Gear
  wormTitle: "PARÂMETROS PAR SEM-FIM E COROA",
  wormAxialModule: "Módulo Axial (mx)",
  wormStarts: "Entradas do Sem-Fim (z₁)",
  wormWheelTeeth: "Dentes da Coroa (z₂)",
  wormDiameterFactor: "Fator de Diâmetro (q)",
  wormFrictionCoeff: "Coeficiente de Atrito (μ)",
  wormSelfLocking: "AUTO-BLOQUEANTE (SEGURO)",
  wormReversible: "REVERSÍVEL",
  wormLeadAngle: "Ângulo de Hélice (γ)",
  wormEfficiency: "Rendimento Mecânico (η)",
  wormOutputTorque: "Torque de Saída (T₂)",
  wormThroatRadius: "Raio de Garganta (ri)",
  wormBlueprintTitle: "PLANO SEM-FIM CILÍNDRICO E COROA GLOBOIDE",

  // Screw Gear
  screwTitle: "PARÂMETROS HELICOIDAIS CRUZADOS",
  screwHelixPinion: "Hélice Pinhão (β₁)",
  screwHelixGear: "Hélice Coroa (β₂)",
  screwShaftAngle: "Ângulo dos Eixos (Σ)",
  screwSlidingVelocity: "Velocidade de Deslizamento (vs)",
  screwBlueprintTitle: "PLANO ESPACIAL HELICOIDAL CRUZADO",
};

const RU: GearsModuleStrings = {
  ...EN,
  title: "Расчёт зубчатых передач и прочность",
  subtitle: "ISO 6336 Прямозубые, косозубые и планетарные передачи",
  export3D: "Экспорт в 3D",
  pairMode: "Пара шестерён",
  trainMode: "Многоступенчатый редуктор",
  toothGeometry: "Геометрия зуба",
  materialSection: "Материал и прочность",
  serviceConditions: "Условия эксплуатации",
  designSafe: "РАСЧЁТ ПОДТВЕРЖДЁН — БЕЗОПАСНО",
  designWarning: "ПРЕДУПРЕЖДЕНИЕ: НЕДОСТАТОЧНЫЙ ЗАПАС",
  bendingSafety: "Запас по изгибу (SF)",
  contactSafety: "Запас по контакту (SH)",
  mfgDimensions: "Производственные размеры (мм)",
  passportTitle: "Производственный паспорт",

  // KHK Gear Families
  khkFamilyTitle: "Семейство передач KHK",
  khkCylindrical: "Цилиндрическая",
  khkInternal: "Внутреннее зацепление",
  khkRack: "Рейка и шестерня",
  khkBevel: "Коническая",
  khkWorm: "Червячная",
  khkScrew: "Винтовая (винтовые колёса)",

  // Rack & Pinion
  rackTitle: "ПАРАМЕТРЫ РЕЕЧНОЙ ПЕРЕДАЧИ",
  rackPitchHeight: "Высота делительной линии (H)",
  rackFeedForce: "Сила подачи (Fx)",
  rackTravelPerRev: "Перемещение / оборот",
  rackFeedVelocity: "Скорость подачи (v)",
  rackSeparatingForce: "Радиальная сила (Fr)",
  rackBlueprintTitle: "ЧЕРТЁЖ ЗАЦЕПЛЕНИЯ ШЕСТЕРНЯ-РЕЙКА",

  // Bevel Gear
  bevelTitle: "ПАРАМЕТРЫ КОНИЧЕСКОЙ ПЕРЕДАЧИ",
  bevelGleasonSystem: "Система Gleason",
  bevelStandardSystem: "Стандартная коническая",
  bevelShaftAngle: "Угол между валами (Σ)",
  bevelConeDistance: "Внешнее конусное расстояние (Re)",
  bevelApexToCrown: "Расстояние от вершины до венца (X)",
  bevelMaxFaceWidth: "Макс. ширина венца (b)",
  bevelBlueprintTitle: "СЕЧЕНИЕ И ЗАЦЕПЛЕНИЕ КОНИЧЕСКИХ КОЛЁС GLEASON",

  // Worm Gear
  wormTitle: "ПАРАМЕТРЫ ЧЕРВЯЧНОЙ ПЕРЕДАЧИ",
  wormAxialModule: "Осевой модуль (mx)",
  wormStarts: "Число заходов червяка (z₁)",
  wormWheelTeeth: "Число зубьев колеса (z₂)",
  wormDiameterFactor: "Коэффициент диаметра червяка (q)",
  wormFrictionCoeff: "Коэффициент трения (μ)",
  wormSelfLocking: "САМОТОРМОЖЕНИЕ (НАДЁЖНО)",
  wormReversible: "ОБРАТИМАЯ ПЕРЕДАЧА",
  wormLeadAngle: "Угол подъема (γ)",
  wormEfficiency: "Механический КПД (η)",
  wormOutputTorque: "Выходной крутящий момент (T₂)",
  wormThroatRadius: "Радиус выемки колеса (ri)",
  wormBlueprintTitle: "ЧЕРТЁЖ ЦИЛИНДРИЧЕСКОГО ЧЕРВЯКА И ГЛОБОИДНОГО КОЛЕСА",

  // Screw Gear
  screwTitle: "ПАРАМЕТРЫ СКРЕЩИВАЮЩИХСЯ ВИНТОВЫХ КОЛЁС",
  screwHelixPinion: "Угол наклона шестерни (β₁)",
  screwHelixGear: "Угол наклона колеса (β₂)",
  screwShaftAngle: "Угол скрещивания осей (Σ)",
  screwSlidingVelocity: "Скорость скольжения (vs)",
  screwBlueprintTitle: "ПРОСТРАНСТВЕННАЯ СХЕМА ВИНТОВЫХ КОЛЁС",
};

const JA: GearsModuleStrings = {
  ...EN,
  title: "歯車設計と強度計算",
  subtitle: "ISO 6336 平歯車・はすば歯車・遊星歯車列",
  export3D: "3Dへ転送",
  pairMode: "2段歯車ペア",
  trainMode: "複合・遊星歯車列",
  toothGeometry: "歯形ジオメトリ",
  materialSection: "材料と強度",
  serviceConditions: "使用条件",
  designSafe: "設計検証済み — 安全",
  designWarning: "警告: 安全率が不十分です",
  bendingSafety: "歯根曲げ安全率 (SF)",
  contactSafety: "歯面接触安全率 (SH)",
  mfgDimensions: "製造寸法 (mm)",
  passportTitle: "製造パスポート",

  // KHK Gear Families
  khkFamilyTitle: "KHK歯車ファミリー",
  khkCylindrical: "円筒歯車",
  khkInternal: "内歯車",
  khkRack: "ラック＆ピニオン",
  khkBevel: "かさ歯車 (ベベル)",
  khkWorm: "ウォームギヤ",
  khkScrew: "ねじ歯車",

  // Rack & Pinion
  rackTitle: "ラック＆ピニオン諸元",
  rackPitchHeight: "基準線高さ (H)",
  rackFeedForce: "推力・送り力 (Fx)",
  rackTravelPerRev: "1回転あたり移動量",
  rackFeedVelocity: "送り速度 (v)",
  rackSeparatingForce: "分離力・ラジアル力 (Fr)",
  rackBlueprintTitle: "ラック＆ピニオン噛合い図面",

  // Bevel Gear
  bevelTitle: "かさ歯車諸元",
  bevelGleasonSystem: "グリーソン方式",
  bevelStandardSystem: "標準かさ歯車",
  bevelShaftAngle: "軸角 (Σ)",
  bevelConeDistance: "基準円すい母線の長さ (Re)",
  bevelApexToCrown: "頂点から歯先角までの距離 (X)",
  bevelMaxFaceWidth: "最大歯幅 (b)",
  bevelBlueprintTitle: "グリーソンかさ歯車断面・噛合い図面",

  // Worm Gear
  wormTitle: "ウォームギヤ諸元",
  wormAxialModule: "軸直角/軸方向モジュール (mx)",
  wormStarts: "ウォーム条数 (z₁)",
  wormWheelTeeth: "ホイール歯数 (z₂)",
  wormDiameterFactor: "直径係数 (q)",
  wormFrictionCoeff: "摩擦係数 (μ)",
  wormSelfLocking: "セルフロック (安全自ロック)",
  wormReversible: "逆駆動可能",
  wormLeadAngle: "進み角 (γ)",
  wormEfficiency: "伝達効率 (η)",
  wormOutputTorque: "出力トルク (T₂)",
  wormThroatRadius: "のど半径 (ri)",
  wormBlueprintTitle: "円筒ウォームとウォームホイール噛合い図面",

  // Screw Gear
  screwTitle: "ねじ歯車諸元",
  screwHelixPinion: "小歯車ねじれ角 (β₁)",
  screwHelixGear: "大歯車ねじれ角 (β₂)",
  screwShaftAngle: "食違い軸角 (Σ)",
  screwSlidingVelocity: "すべり速度 (vs)",
  screwBlueprintTitle: "ねじ歯車空間配置図面",
};

const ZH: GearsModuleStrings = {
  ...EN,
  title: "齿轮设计与强度计算",
  subtitle: "ISO 6336 直齿、斜齿与多级行星齿轮系",
  export3D: "导出至3D",
  pairMode: "双齿轮副",
  trainMode: "多级与行星轮系",
  toothGeometry: "齿形几何",
  materialSection: "材料与强度",
  serviceConditions: "工况条件",
  designSafe: "设计已验证 — 安全",
  designWarning: "警告：安全系数不足",
  bendingSafety: "齿根弯曲安全系数 (SF)",
  contactSafety: "齿面接触安全系数 (SH)",
  mfgDimensions: "制造尺寸 (mm)",
  passportTitle: "制造护照",

  // KHK Gear Families
  khkFamilyTitle: "KHK齿轮系列",
  khkCylindrical: "圆柱齿轮",
  khkInternal: "内齿轮",
  khkRack: "齿轮齿条",
  khkBevel: "锥齿轮",
  khkWorm: "蜗轮蜗杆",
  khkScrew: "交错轴斜齿轮",

  // Rack & Pinion
  rackTitle: "齿轮齿条参数",
  rackPitchHeight: "节线高度 (H)",
  rackFeedForce: "进给推力 (Fx)",
  rackTravelPerRev: "每转进给量",
  rackFeedVelocity: "进给线速度 (v)",
  rackSeparatingForce: "径向分离力 (Fr)",
  rackBlueprintTitle: "齿轮齿条啮合工程蓝图",

  // Bevel Gear
  bevelTitle: "锥齿轮参数",
  bevelGleasonSystem: "格里森制 (Gleason)",
  bevelStandardSystem: "标准锥齿轮制",
  bevelShaftAngle: "轴交角 (Σ)",
  bevelConeDistance: "外锥距 (Re)",
  bevelApexToCrown: "顶点至齿顶冠距 (X)",
  bevelMaxFaceWidth: "最大齿宽 (b)",
  bevelBlueprintTitle: "格里森锥齿轮剖面与啮合图",

  // Worm Gear
  wormTitle: "蜗轮蜗杆参数",
  wormAxialModule: "轴向模数 (mx)",
  wormStarts: "蜗杆头数 (z₁)",
  wormWheelTeeth: "蜗轮齿数 (z₂)",
  wormDiameterFactor: "蜗杆直径系数 (q)",
  wormFrictionCoeff: "摩擦系数 (μ)",
  wormSelfLocking: "自锁 (安全逆止)",
  wormReversible: "可逆驱动",
  wormLeadAngle: "导程角 (γ)",
  wormEfficiency: "传动效率 (η)",
  wormOutputTorque: "输出扭矩 (T₂)",
  wormThroatRadius: "喉部圆弧半径 (ri)",
  wormBlueprintTitle: "圆柱蜗杆与阿基米德蜗轮啮合图",

  // Screw Gear
  screwTitle: "交错轴斜齿轮参数",
  screwHelixPinion: "小轮螺旋角 (β₁)",
  screwHelixGear: "大轮螺旋角 (β₂)",
  screwShaftAngle: "轴交错角 (Σ)",
  screwSlidingVelocity: "相对滑动速度 (vs)",
  screwBlueprintTitle: "交错轴斜齿轮三维工程蓝图",
};

const KO: GearsModuleStrings = {
  ...EN,
  title: "기어 설계 및 강도 해석",
  subtitle: "ISO 6336 평기어, 헬리컬 및 다단 유성기어열",
  export3D: "3D로 내보내기",
  pairMode: "2단 기어 맞물림",
  trainMode: "다단 및 유성기어열",
  toothGeometry: "치형 기하",
  materialSection: "재료 및 강도",
  serviceConditions: "운전 조건",
  designSafe: "설계 검증 완료 — 안전",
  designWarning: "경고: 안전계수 부족",
  bendingSafety: "치근 굽힘 안전계수 (SF)",
  contactSafety: "치면 접촉 안전계수 (SH)",
  mfgDimensions: "제조 치수 (mm)",
  passportTitle: "제조 패스포트",

  // KHK Gear Families
  khkFamilyTitle: "KHK 기어 시리즈",
  khkCylindrical: "원통 기어",
  khkInternal: "내치차 (링기어)",
  khkRack: "랙 & 피니언",
  khkBevel: "베벨 기어 (원추)",
  khkWorm: "웜 & 웜휠",
  khkScrew: "나사치차 (헬리컬 크로스)",

  // Rack & Pinion
  rackTitle: "랙 & 피니언 제원",
  rackPitchHeight: "피치선 높이 (H)",
  rackFeedForce: "선형 이송력 (Fx)",
  rackTravelPerRev: "1회전당 이송량",
  rackFeedVelocity: "이송 속도 (v)",
  rackSeparatingForce: "분리력 (Fr)",
  rackBlueprintTitle: "랙 & 피니언 맞물림 엔지니어링 도면",

  // Bevel Gear
  bevelTitle: "베벨 기어 제원",
  bevelGleasonSystem: "글리슨 방식 (Gleason)",
  bevelStandardSystem: "표준 베벨 방식",
  bevelShaftAngle: "축각 (Σ)",
  bevelConeDistance: "외측 원추거리 (Re)",
  bevelApexToCrown: "원추 정점-치선 거리 (X)",
  bevelMaxFaceWidth: "최대 치폭 (b)",
  bevelBlueprintTitle: "글리슨 베벨 기어 단면 및 맞물림도",

  // Worm Gear
  wormTitle: "웜 & 웜휠 제원",
  wormAxialModule: "축방향 모듈 (mx)",
  wormStarts: "웜 줄수 (z₁)",
  wormWheelTeeth: "웜휠 잇수 (z₂)",
  wormDiameterFactor: "직경 계수 (q)",
  wormFrictionCoeff: "마찰 계수 (μ)",
  wormSelfLocking: "셀프 록킹 (자립 잠금)",
  wormReversible: "역구동 가능",
  wormLeadAngle: "리드각 (γ)",
  wormEfficiency: "전달 효율 (η)",
  wormOutputTorque: "출력 토크 (T₂)",
  wormThroatRadius: "목 반경 (ri)",
  wormBlueprintTitle: "원통 웜 및 글로보이드 웜휠 맞물림도",

  // Screw Gear
  screwTitle: "나사치차 제원",
  screwHelixPinion: "소기어 비틀림각 (β₁)",
  screwHelixGear: "대기어 비틀림각 (β₂)",
  screwShaftAngle: "어긋난 축각 (Σ)",
  screwSlidingVelocity: "미끄럼 속도 (vs)",
  screwBlueprintTitle: "교차 나사치차 3차원 투영도",
};

const AR: GearsModuleStrings = {
  ...EN,
  title: "تصميم التروس وحساب الإجهادات",
  subtitle: "ISO 6336 مسننات مستقيمة وحلزونية وقطارات تروس",
  export3D: "تصدير إلى 3D",
  pairMode: "زوج تروس",
  trainMode: "قطار تروس مركب",
  toothGeometry: "هندسة السن",
  materialSection: "المادة والمقاومة",
  serviceConditions: "ظروف التشغيل",
  designSafe: "التصميم مُحقق — آمن",
  designWarning: "تحذير: عامل أمان غير كافٍ",
  bendingSafety: "أمان انحناء الجذر (SF)",
  contactSafety: "أمان تلامس السطح (SH)",
  mfgDimensions: "أبعاد التصنيع (مم)",
  passportTitle: "جواز التصنيع",

  // KHK Gear Families
  khkFamilyTitle: "عائلة تروس KHK",
  khkCylindrical: "أسطواني",
  khkInternal: "ترس داخلي",
  khkRack: "جريدة مسننة وبنيون",
  khkBevel: "مخروطي",
  khkWorm: "ترس ودودة (حلزوني)",
  khkScrew: "تروس لولبية متقاطعة",

  // Rack & Pinion
  rackTitle: "معلمات الجريدة والبنيون",
  rackPitchHeight: "ارتفاع خط الخطوة (H)",
  rackFeedForce: "قوة التغذية الخطية (Fx)",
  rackTravelPerRev: "المسافة لكل دورة",
  rackFeedVelocity: "سرعة التغذية (v)",
  rackSeparatingForce: "القوة الشعاعية (Fr)",
  rackBlueprintTitle: "مخطط تعشيق الجريدة المسننة والبنيون",

  // Bevel Gear
  bevelTitle: "معلمات الترس المخروطي",
  bevelGleasonSystem: "نظام جليسون",
  bevelStandardSystem: "مخروطي قياسي",
  bevelShaftAngle: "زاوية المحاور (Σ)",
  bevelConeDistance: "مسافة المخروط الخارجية (Re)",
  bevelApexToCrown: "مسافة القمة للتاج (X)",
  bevelMaxFaceWidth: "عرض السن الأقصى (b)",
  bevelBlueprintTitle: "مقطع ومخطط تعشيق الترس المخروطي جليسون",

  // Worm Gear
  wormTitle: "معلمات الترس الحلزوني (الدودة والعجلة)",
  wormAxialModule: "الموديول المحوري (mx)",
  wormStarts: "عدد أسنان الدودة (z₁)",
  wormWheelTeeth: "عدد أسنان العجلة (z₂)",
  wormDiameterFactor: "معامل القطر (q)",
  wormFrictionCoeff: "معامل الاحتكاك (μ)",
  wormSelfLocking: "قفل ذاتي (آمن)",
  wormReversible: "قابل للعكس",
  wormLeadAngle: "زاوية الخطوة (γ)",
  wormEfficiency: "الكفاءة الميكانيكية (η)",
  wormOutputTorque: "عزم الدوران الخارج (T₂)",
  wormThroatRadius: "نصف قطر الخنق (ri)",
  wormBlueprintTitle: "مخطط تعشيق الدودة الأسطوانية وعجلة الجلوبويد",

  // Screw Gear
  screwTitle: "معلمات التروس اللولبية المتقاطعة",
  screwHelixPinion: "زاوية ميل البنيون (β₁)",
  screwHelixGear: "زاوية ميل الترس (β₂)",
  screwShaftAngle: "زاوية تقاطع المحاور (Σ)",
  screwSlidingVelocity: "سرعة الانزلاق (vs)",
  screwBlueprintTitle: "المخطط الفضائي للتروس المتقاطعة",
};

const BY_LOCALE: Record<Language, GearsModuleStrings> = {
  en: EN,
  tr: TR,
  de: DE,
  es: ES,
  fr: FR,
  it: IT,
  pt: PT,
  ru: RU,
  ja: JA,
  zh: ZH,
  ko: KO,
  ar: AR,
};

export function getGearsModuleStrings(locale: string): GearsModuleStrings {
  return BY_LOCALE[locale as Language] ?? EN;
}

