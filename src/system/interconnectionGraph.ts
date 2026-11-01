/**
 * AluCAD OS — Universal Interconnection Graph & Mesh Engine
 * 
 * Defines and registers 52+ bi-directional cross-module engineering links
 * connecting 3D Assembly, CAD, Solvers, FEA, Nesting, Materials, and Duolingo Chess Quests.
 */

export interface InterconnectionEdge {
  id: string;
  sourceModule: string;
  targetModule: string;
  name: string;
  nameTr: string;
  description: string;
  descriptionTr: string;
  category: 'power-transmission' | 'structural-frame' | 'cad-nesting' | 'fasteners-joints' | 'thermal-fluids' | 'academy-chess';
  icon: string;
  actionKey: string;
}

export const INTERCONNECTION_GRAPH: InterconnectionEdge[] = [
  // ─── CLUSTER 1: MECHANICAL POWER TRANSMISSION MESH (1-10) ───
  {
    id: 'link-1',
    sourceModule: 'gears-bearings',
    targetModule: 'workspace/assembly',
    name: 'Export Gear Kinematics to 3D Assembly',
    nameTr: 'Dişli Kinematiğini 3D Montaj Sahnesine Aktar',
    description: 'Generates procedural 3D involute gears with pitch center distances and shaft alignment.',
    descriptionTr: 'Eksen mesafeleri ve mil hizalaması ile prosedürel 3D evolvent dişliler oluşturur.',
    category: 'power-transmission',
    icon: '⚙️',
    actionKey: 'exportGearsTo3D'
  },
  {
    id: 'link-2',
    sourceModule: 'workspace/assembly',
    targetModule: 'gears-bearings',
    name: 'Inspect 3D Gear Kinematics & Strength',
    nameTr: '3D Dişli Kinematiği ve Mukavemetini İncele',
    description: 'Selects 3D gear and opens ISO 6336 bending & contact stress analysis.',
    descriptionTr: '3D dişliyi seçip ISO 6336 diş dibi ve yüzey ezilme analizini açar.',
    category: 'power-transmission',
    icon: '🔍',
    actionKey: 'inspectGearInSolver'
  },
  {
    id: 'link-3',
    sourceModule: 'gears-bearings',
    targetModule: 'shafts',
    name: 'Transfer Gear Forces to Shaft Design',
    nameTr: 'Dişli Teğetsel & Radyal Kuvvetlerini Mile Aktar',
    description: 'Exports tangential force Ft and radial force Fr to calculate shaft bending and torsion.',
    descriptionTr: 'Ft ve Fr kuvvetlerini mil eğilme ve burulma hesabına aktarır.',
    category: 'power-transmission',
    icon: '🔄',
    actionKey: 'sendGearForcesToShaft'
  },
  {
    id: 'link-4',
    sourceModule: 'shafts',
    targetModule: 'workspace/assembly',
    name: 'Generate Stepped Shaft & Keyways in 3D',
    nameTr: '3D Kademeli Mil ve Kama Yuvası Oluştur',
    description: 'Builds 3D parametric shaft geometry with shoulders, fillets, and key seats.',
    descriptionTr: 'Fatura, kavis ve kama yuvaları ile 3D parametrik mil oluşturur.',
    category: 'power-transmission',
    icon: '📏',
    actionKey: 'sendShaftTo3D'
  },
  {
    id: 'link-5',
    sourceModule: 'shafts',
    targetModule: 'keyway',
    name: 'Size DIN 6885 Parallel Key',
    nameTr: 'DIN 6885 Paralel Kama Boyutlandır',
    description: 'Calculates key width, height, and shear stress under shaft torque.',
    descriptionTr: 'Mil torku altında kama genişliği, yüksekliği ve kesme gerilmesini hesaplar.',
    category: 'power-transmission',
    icon: '▱',
    actionKey: 'sendShaftTorqueToKeyway'
  },
  {
    id: 'link-6',
    sourceModule: 'keyway',
    targetModule: 'workspace/assembly',
    name: 'Spawn Standard Key into 3D Assembly',
    nameTr: 'Standart Kamayı 3D Montaja Ekle',
    description: 'Places DIN 6885 feather key into matching shaft keyway.',
    descriptionTr: 'DIN 6885 kamayı mil yuvasına monte eder.',
    category: 'power-transmission',
    icon: '🧩',
    actionKey: 'spawnKeyIn3D'
  },
  {
    id: 'link-7',
    sourceModule: 'gears-bearings',
    targetModule: 'bearings',
    name: 'Transfer Bearing Reactions to ISO 281 Solver',
    nameTr: 'Rulman Reaksiyonlarını ISO 281 Çözücüye Aktar',
    description: 'Exports radial and axial reaction forces to compute L10h bearing fatigue life.',
    descriptionTr: 'Radyal ve eksenel reaksiyon kuvvetlerini L10h rulman ömrü hesabına aktarır.',
    category: 'power-transmission',
    icon: '◎',
    actionKey: 'sendReactionsToBearing'
  },
  {
    id: 'link-8',
    sourceModule: 'bearings',
    targetModule: 'workspace/assembly',
    name: 'Mount Selected Deep Groove Bearing in 3D',
    nameTr: 'Seçilen Rulmanı 3D Montaja Yerleştir',
    description: 'Adds ISO standard ball/roller bearing at exact shaft support positions.',
    descriptionTr: 'ISO standart bilyalı/makaralı rulmanı mil destek noktasına yerleştirir.',
    category: 'power-transmission',
    icon: '🛞',
    actionKey: 'mountBearingIn3D'
  },
  {
    id: 'link-9',
    sourceModule: 'motor-selection',
    targetModule: 'gears-bearings',
    name: 'Feed IEC Motor Power & Poles to Gearbox',
    nameTr: 'IEC Motor Güç & Devrini Redüktöre Besle',
    description: 'Transfers nominal power, synchronous speed, and torque to gear train.',
    descriptionTr: 'Anma gücü, senkron devir ve torku dişli aktarımına besler.',
    category: 'power-transmission',
    icon: '⚡',
    actionKey: 'feedMotorToGearbox'
  },
  {
    id: 'link-10',
    sourceModule: 'gears-bearings',
    targetModule: 'belt-drive',
    name: 'Chain Secondary Belt/Chain Drive',
    nameTr: 'İkincil Kayış/Zincir Aktarımını Bağla',
    description: 'Connects gearbox output shaft speed and torque to belt or roller chain drive.',
    descriptionTr: 'Redüktör çıkış devir ve torkunu kayış veya zincir mekanizmasına bağlar.',
    category: 'power-transmission',
    icon: '⛓️',
    actionKey: 'chainDriveToBelt'
  },

  // ─── CLUSTER 2: STRUCTURAL & FRAME ENGINEERING MESH (11-20) ───
  {
    id: 'link-11',
    sourceModule: 'workspace/assembly',
    targetModule: 'cutting-optimizer',
    name: 'Export Profile Cut List to 1D Nesting',
    nameTr: 'Profil Kesim Listesini 1D Optimizasyona Aktar',
    description: 'Extracts all extrusion lengths, quantities, and material series for bar packing.',
    descriptionTr: 'Tüm profil boylarını, adetlerini ve malzeme serilerini 1D yerleşime aktarır.',
    category: 'structural-frame',
    icon: '✂️',
    actionKey: 'extractProfilesForCutting'
  },
  {
    id: 'link-12',
    sourceModule: 'cutting-optimizer',
    targetModule: 'gcode-export',
    name: 'Generate CNC Saw G-Code Toolpath',
    nameTr: 'CNC Profil Testeresi G-Code Takım Yolu Üret',
    description: 'Generates ISO G-code with kerf compensation, feed rate, and plunge control.',
    descriptionTr: 'Bıçak payı (kerf), ilerleme hızı ve dalma kontrolüyle G-code üretir.',
    category: 'structural-frame',
    icon: '🤖',
    actionKey: 'generateCutGCode'
  },
  {
    id: 'link-13',
    sourceModule: 'cutting-optimizer',
    targetModule: 'workspace/bom',
    name: 'Update BOM Stock Bar Counts & Waste Cost',
    nameTr: 'BOM Hammadde Çubuk Adedi ve Fire Maliyetini Güncelle',
    description: 'Calculates exact raw stock bars required (6m/3m) and scrap cost in BOM.',
    descriptionTr: 'Gereken ham çubuk adedini (6m/3m) ve fire maliyetini BOM tablosuna yansıtır.',
    category: 'structural-frame',
    icon: '📊',
    actionKey: 'updateBomStockBars'
  },
  {
    id: 'link-14',
    sourceModule: 'workspace/assembly',
    targetModule: 'simulation-fea',
    name: 'Solve Frame Structural Linear Static FEA',
    nameTr: 'Çerçeve Yapısal Lineer Statik FEA Analizini Çöz',
    description: 'Converts 3D profile assembly into 3D beam/truss FEA elements to solve von Mises stress.',
    descriptionTr: '3D montajı kiriş/kafes FEA elemanlarına dönüştürüp von Mises gerilmesini çözer.',
    category: 'structural-frame',
    icon: '🔬',
    actionKey: 'extractAssemblyStructuralAnalysis'
  },
  {
    id: 'link-15',
    sourceModule: 'beam-deflection',
    targetModule: 'workspace/assembly',
    name: 'Visualize Beam Deflection Curve in 3D',
    nameTr: 'Kiriş Sehim Eğrisini 3D Sahne Üzerinde Göster',
    description: 'Renders exaggerated deflection curve and stress contour on 3D profile mesh.',
    descriptionTr: '3D profil gövdesi üzerinde büyütülmüş sehim eğrisini ve gerilme haritasını çizer.',
    category: 'structural-frame',
    icon: '〰️',
    actionKey: 'visualizeDeflectionIn3D'
  },
  {
    id: 'link-16',
    sourceModule: 'column-buckling',
    targetModule: 'workspace/assembly',
    name: 'Check Euler Column Buckling on 3D Posts',
    nameTr: '3D Dikey Dikmelerde Euler Burkulma Kontrolü Yap',
    description: 'Calculates critical buckling load Pcr based on column effective length factor K.',
    descriptionTr: 'Etkin boy katsayısı K bazında kritik burkulma yükü Pcr hesabını yapar.',
    category: 'structural-frame',
    icon: '🏛️',
    actionKey: 'checkColumnBuckling'
  },
  {
    id: 'link-17',
    sourceModule: 'materials',
    targetModule: 'workspace/assembly',
    name: 'Apply Material Alloy Properties to 3D Scene',
    nameTr: 'Malzeme Alaşım Özelliklerini 3D Sahneye Uygula',
    description: 'Updates Elastic Modulus (E), Density, and Yield Strength across all 3D parts.',
    descriptionTr: 'Elastisite Modülü (E), Yoğunluk ve Akma Dayanımını tüm 3D parçalara uygular.',
    category: 'structural-frame',
    icon: '🧪',
    actionKey: 'applyMaterialToAssembly'
  },
  {
    id: 'link-18',
    sourceModule: 'materials',
    targetModule: 'simulation-fea',
    name: 'Feed Constitutive Matrix to FEA Solver',
    nameTr: 'Bünye Matrisini FEA Çözücüye Besle',
    description: 'Updates Young modulus E and Poisson ratio nu in FEA stiffness matrix.',
    descriptionTr: 'FEA rijitlik matrisinde Young modülü E ve Poisson oranını günceller.',
    category: 'structural-frame',
    icon: '📐',
    actionKey: 'feedMaterialToFea'
  },
  {
    id: 'link-19',
    sourceModule: 'materials',
    targetModule: 'cutting-optimizer',
    name: 'Set Material Cutting Speeds & Kerf Allowance',
    nameTr: 'Malzeme Kesim Hızları ve Bıçak Payını Tanımla',
    description: 'Sets recommended blade RPM, feed per tooth, and kerf for aluminum alloys.',
    descriptionTr: 'Alüminyum alaşımları için önerilen testere devri, diş başı ilerleme ve talaş payını ayarlar.',
    category: 'structural-frame',
    icon: '⚙️',
    actionKey: 'setCutMaterialParams'
  },
  {
    id: 'link-20',
    sourceModule: 'materials/compare',
    targetModule: 'workspace/bom',
    name: 'Instant Alloy Mass & Cost Comparison in BOM',
    nameTr: 'BOM İçinde Anlık Alaşım Ağırlık ve Maliyet Kıyaslaması',
    description: 'Compares total weight & cost across 6061-T6, 6063-T5, 7075-T6, and Steel.',
    descriptionTr: '6061-T6, 6063-T5, 7075-T6 ve Çelik arasında toplam ağırlık ve maliyeti kıyaslar.',
    category: 'structural-frame',
    icon: '⚖️',
    actionKey: 'compareAlloyInBom'
  },

  // ─── CLUSTER 3: 2D CAD, SHEET METAL & 2D NESTING MESH (21-28) ───
  {
    id: 'link-21',
    sourceModule: 'cad-editor',
    targetModule: 'nesting-2d',
    name: 'Send 2D CAD Polygons to 2D Sheet Nesting',
    nameTr: '2D CAD Çizimlerini 2D Plaka Yerleşime Gönder',
    description: 'Exports closed DXF profiles and gussets directly into 2D bin packing engine.',
    descriptionTr: 'Kapalı DXF profillerini ve braketleri doğrudan 2D plaka yerleşim motoruna aktarır.',
    category: 'cad-nesting',
    icon: '📐',
    actionKey: 'sendCadTo2DNesting'
  },
  {
    id: 'link-22',
    sourceModule: 'nesting-2d',
    targetModule: 'gcode-export',
    name: 'Generate 2D Laser/Plasma G-Code Toolpath',
    nameTr: '2D Lazer/Plazma Kesim G-Code Takım Yolu Üret',
    description: 'Generates 2D profile cutting toolpath with lead-in/lead-out and sheet utilization metrics.',
    descriptionTr: 'Giriş/çıkış (lead-in) ve plaka doluluk verimliliği ile 2D kesim G-code üretir.',
    category: 'cad-nesting',
    icon: '🔥',
    actionKey: 'generate2DNestingGCode'
  },
  {
    id: 'link-23',
    sourceModule: 'cad-editor',
    targetModule: 'section-properties',
    name: 'Calculate Custom Cross-Section Properties (Ix, Iy)',
    nameTr: 'Özel Kesit Eylemsizlik Momentlerini (Ix, Iy) Hesapla',
    description: 'Calculates moment of inertia, section modulus, centroid, and area from closed CAD contour.',
    descriptionTr: 'Kapalı CAD çiziminden atalet momenti, mukavemet momenti, ağırlık merkezi ve alanı hesaplar.',
    category: 'cad-nesting',
    icon: '📊',
    actionKey: 'computeCadSectionProperties'
  },
  {
    id: 'link-24',
    sourceModule: 'section-properties',
    targetModule: 'workspace/assembly',
    name: 'Extrude Custom 2D CAD Section into 3D Workspace',
    nameTr: 'Özel 2D CAD Kesitini 3D Montaj Sahnesinde Katılaştır',
    description: 'Extrudes custom drawn profile shape into a parametric 3D workspace component.',
    descriptionTr: 'Çizilen özel profil kesitini 3D parametrik montaj parçası olarak katılaştırır.',
    category: 'cad-nesting',
    icon: '🧊',
    actionKey: 'extrudeCadTo3D'
  },
  {
    id: 'link-25',
    sourceModule: 'section-properties',
    targetModule: 'beam-deflection',
    name: 'Feed Custom Ix/Iy into Beam Deflection Solver',
    nameTr: 'Özel Ix/Iy Değerlerini Kiriş Sehim Çözücüsüne Besle',
    description: 'Solves custom beam bending using precise section modulus of extruded CAD section.',
    descriptionTr: 'Çizilen kesitin kesin mukavemet momentini kullanarak kiriş eğilme hesabını çözer.',
    category: 'cad-nesting',
    icon: '📈',
    actionKey: 'feedSectionToBeam'
  },
  {
    id: 'link-26',
    sourceModule: 'sheet-metal',
    targetModule: 'cad-editor',
    name: 'Unfold Sheet Metal Bending Flat Pattern (K-Factor)',
    nameTr: 'Sac Büküm Açınımını 2D CAD Sahnesine Çiz (K-Faktörü)',
    description: 'Generates unfolded flat sheet pattern considering bend allowance and neutral axis shift.',
    descriptionTr: 'Büküm payı ve nötr eksen kaymasını hesaba katarak sac açınımını 2D CAD düzlemine çizer.',
    category: 'cad-nesting',
    icon: '📄',
    actionKey: 'unfoldSheetToCad'
  },
  {
    id: 'link-27',
    sourceModule: 'sheet-metal',
    targetModule: 'nesting-2d',
    name: 'Queue Unfolded Sheet Parts for 2D Nesting',
    nameTr: 'Açınımı Yapılan Sac Parçaları 2D Nesting Sırasına Al',
    description: 'Sends flattened sheet components with quantity multipliers into nesting queue.',
    descriptionTr: 'Açınımı çıkarılan sac parçaları adetleriyle birlikte 2D yerleşim kuyruğuna aktarır.',
    category: 'cad-nesting',
    icon: '📥',
    actionKey: 'sendSheetToNesting'
  },
  {
    id: 'link-28',
    sourceModule: 'workspace/assembly',
    targetModule: 'nesting-2d',
    name: 'Extract 3D Gussets & Brackets to 2D Nesting',
    nameTr: '3D Braket ve Gusset Plakalarını 2D Nesting Modülüne Aktar',
    description: 'Pulls all flat connecting plates and angle brackets for sheet metal layout.',
    descriptionTr: 'Tüm düz bağlantı plakalarını ve köşe gönyelerini plaka yerleşimine aktarır.',
    category: 'cad-nesting',
    icon: '📑',
    actionKey: 'extractBracketsToNesting'
  },

  // ─── CLUSTER 4: FASTENERS, JOINTS & RELIABILITY MESH (29-36) ───
  {
    id: 'link-29',
    sourceModule: 'workspace/assembly',
    targetModule: 'ai-assembly-engine',
    name: 'Run AI Fastener Auto-Detection on 3D Joints',
    nameTr: '3D Birleşim Noktalarında AI Otomatik Bağlantı Elemanı Bul',
    description: 'Detects mating profile T-slots and bracket holes to auto-place standard ISO bolts.',
    descriptionTr: 'Profil kanal ve braket deliklerini tespit edip standart ISO civataları otomatik yerleştirir.',
    category: 'fasteners-joints',
    icon: '🔩',
    actionKey: 'autoDetectFasteners'
  },
  {
    id: 'link-30',
    sourceModule: 'ai-assembly-engine',
    targetModule: 'bolt-torque',
    name: 'Verify Clamping & Torque via VDI 2230',
    nameTr: 'VDI 2230 Standardında Ön Gerilme ve Sıkma Torkunu Doğrula',
    description: 'Transfers bolt size, clamp length, and grade to calculate tightening torque MA.',
    descriptionTr: 'Civata anma çapı, sıkma boyu ve kalitesini aktararak sıkma torku MA hesabını yapar.',
    category: 'fasteners-joints',
    icon: '🔧',
    actionKey: 'sendJointToBoltTorque'
  },
  {
    id: 'link-31',
    sourceModule: 'bolt-torque',
    targetModule: 'workspace/assembly',
    name: 'Update 3D Bolt Model Specs & Washers',
    nameTr: '3D Civata Model Özellikleri ve Pulları Güncelle',
    description: 'Updates 3D bolt dimensions, thread engagement length, and washer stacks.',
    descriptionTr: '3D civata boyunu, diş kavrama derinliğini ve pul dizilimini günceller.',
    category: 'fasteners-joints',
    icon: '🔩',
    actionKey: 'update3DBolts'
  },
  {
    id: 'link-32',
    sourceModule: 'bolt-torque',
    targetModule: 'workspace/health',
    name: 'Validate Joint Structural Health & Safety Factor',
    nameTr: 'Birleşim Yapısal Güvenlik Katsayısı ve Sağlık Barını Doğrula',
    description: 'Computes bolt yield safety (SF) and thread stripping safety in assembly health HUD.',
    descriptionTr: 'Montaj sağlık göstergesinde civata akma ve diş sıyırma emniyet katsayılarını doğrular.',
    category: 'fasteners-joints',
    icon: '💚',
    actionKey: 'validateAssemblyHealth'
  },
  {
    id: 'link-33',
    sourceModule: 'welded-joints',
    targetModule: 'simulation-fea',
    name: 'Evaluate Weld Throat Thickness & Stress',
    nameTr: 'Kaynak Boğaz Kalınlığı ve Birleşim Gerilmesini Değerlendir',
    description: 'Calculates equivalent shear and normal stress in fillet welds under frame loading.',
    descriptionTr: 'Çerçeve yükü altında köşe kaynaklarındaki eşdeğer kayma ve çekme gerilmelerini hesaplar.',
    category: 'fasteners-joints',
    icon: '⚡',
    actionKey: 'evaluateWeldStress'
  },
  {
    id: 'link-34',
    sourceModule: 'workspace/bom',
    targetModule: 'qr-passport',
    name: 'Encode Complete Assembly BOM into Production QR',
    nameTr: 'Tüm Montaj BOM Verisini Üretim QR Pasaportuna Kodla',
    description: 'Generates ISO manufacturing QR code containing parts, fasteners, and cost specs.',
    descriptionTr: 'Parça, bağlantı elemanı ve maliyet verilerini içeren ISO üretim QR kodunu oluşturur.',
    category: 'fasteners-joints',
    icon: '📱',
    actionKey: 'encodeBomQrPassport'
  },
  {
    id: 'link-35',
    sourceModule: 'workspace/bom',
    targetModule: 'cost-estimator',
    name: 'Aggregate Standard Hardware Costs into Budget',
    nameTr: 'Standart Donanım Maliyetlerini Toplam Bütçeye Ekle',
    description: 'Combines DIN 912 bolts, T-nuts, brackets, and raw extrusions into total project quote.',
    descriptionTr: 'DIN 912 civata, T-somun, gönye ve ham profilleri birleştirip toplam proje teklifini çıkarır.',
    category: 'fasteners-joints',
    icon: '💰',
    actionKey: 'aggregateProjectCost'
  },
  {
    id: 'link-36',
    sourceModule: 'thermal',
    targetModule: 'bolt-torque',
    name: 'Check Thermal Preload Loss in Dissimilar Joints',
    nameTr: 'Farklı Malzemeli Birleşimlerde Termal Ön Gerilme Kaybını Kontrol Et',
    description: 'Calculates preload variation due to delta-alpha between aluminum profile and steel bolt.',
    descriptionTr: 'Alüminyum profil ile çelik civata arasındaki genleşme farkından doğan ön gerilme kaybını hesaplar.',
    category: 'fasteners-joints',
    icon: '🌡️',
    actionKey: 'checkThermalPreloadLoss'
  },

  // ─── CLUSTER 5: THERMAL, FLUIDS & DYNAMICS MESH (37-42) ───
  {
    id: 'link-37',
    sourceModule: 'thermal',
    targetModule: 'workspace/assembly',
    name: 'Spawn Extruded Finned Heat Sink in 3D',
    nameTr: '3D Montaj Sahnesine Kanatçıklı Soğutucu Profil Ekle',
    description: 'Creates parametric finned extruded aluminum heat sink with thermal dissipation area.',
    descriptionTr: 'Isı yayılım yüzey alanı optimize edilmiş parametrik kanatçıklı alüminyum profil ekler.',
    category: 'thermal-fluids',
    icon: '❄️',
    actionKey: 'spawnHeatSinkIn3D'
  },
  {
    id: 'link-38',
    sourceModule: 'materials',
    targetModule: 'thermal',
    name: 'Fetch Alloy Thermal Conductivity (k) & Expansion (alpha)',
    nameTr: 'Alaşım Isı İletim (k) ve Isıl Genleşme (alpha) Değerlerini Çek',
    description: 'Feeds exact thermal coefficients into transient heat dissipation equations.',
    descriptionTr: 'Zamana bağlı ısı yayılım denklemlerine malzeme ısı iletim katsayılarını aktarır.',
    category: 'thermal-fluids',
    icon: '🔥',
    actionKey: 'fetchThermalProperties'
  },
  {
    id: 'link-39',
    sourceModule: 'hydraulics',
    targetModule: 'workspace/assembly',
    name: 'Apply Hydraulic Cylinder Actuation Force to Frame',
    nameTr: 'Hidrolik Silindir İtme/Çekme Kuvvetini Çerçeveye Uygula',
    description: 'Calculates cylinder thrust based on bore and pressure, applying load to 3D joint mounts.',
    descriptionTr: 'Silindir çapı ve basınca göre itme kuvvetini hesaplayıp 3D montaj mafsallarına uygular.',
    category: 'thermal-fluids',
    icon: '💧',
    actionKey: 'applyHydraulicForceToFrame'
  },
  {
    id: 'link-40',
    sourceModule: 'pneumatics',
    targetModule: 'workspace/assembly',
    name: 'Size Pneumatic Linear Actuator & Stroke in 3D',
    nameTr: '3D Sahne Üzerinde Pnömatik Eyleyici ve Strok Boyutlandır',
    description: 'Calculates air consumption and sizing for automated pick-and-place gantry arms.',
    descriptionTr: 'Otomasyon kartezyen robot kolları için hava tüketimi ve strok boyutlandırmasını hesaplar.',
    category: 'thermal-fluids',
    icon: '💨',
    actionKey: 'sizePneumaticsIn3D'
  },
  {
    id: 'link-41',
    sourceModule: 'physics-solver',
    targetModule: 'workspace/assembly',
    name: 'Compute 3D Assembly Center of Mass & Inertia Tensor',
    nameTr: '3D Montaj Ağırlık Merkezi (CoM) ve Eylemsizlik Tensörünü Hesapla',
    description: 'Calculates global Center of Gravity (CoG) and moment of inertia tensor Ixx, Iyy, Izz.',
    descriptionTr: 'Genel ağırlık merkezi (CoG) ve asal eylemsizlik tensörünü (Ixx, Iyy, Izz) hesaplar.',
    category: 'thermal-fluids',
    icon: '🎯',
    actionKey: 'computeAssemblyCoM'
  },
  {
    id: 'link-42',
    sourceModule: 'fluid-dynamics',
    targetModule: 'workspace/assembly',
    name: 'Analyze Buoyancy & Metacenter for Floating Structures',
    nameTr: 'Yüzen Yapılarda Batma Hacmi ve Metasantr Stabilitesini Analiz Et',
    description: 'Evaluates hydrostatic displacement and righting arm GZ for extruded marine pontoons.',
    descriptionTr: 'Alüminyum duba ve yüzer yapılar için batma hacmi ve doğrultucu moment kolu GZ analizini yapar.',
    category: 'thermal-fluids',
    icon: '⛵',
    actionKey: 'analyzeHydrostaticsIn3D'
  },

  // ─── CLUSTER 6: DUOLINGO "ENGINEERING CHESS" & ACADEMY MESH (43-52) ───
  {
    id: 'link-43',
    sourceModule: 'academy/duolingo',
    targetModule: 'interactive-solvers',
    name: 'Launch Interactive Solver Sandbox from Lesson Step',
    nameTr: 'Ders İçi Canlı Hesaplayıcı Köprüsünü Aç',
    description: 'Transfers exact lesson problem parameters into live engineering calculator sandbox.',
    descriptionTr: 'Ders sorusundaki parametreleri anında canlı mühendislik hesaplayıcı havuzuna aktarır.',
    category: 'academy-chess',
    icon: '⚡',
    actionKey: 'openLiveSolverFromLesson'
  },
  {
    id: 'link-44',
    sourceModule: 'academy/chess',
    targetModule: 'workspace/assembly',
    name: 'Interactive 3D Assembly Chess Quest',
    nameTr: 'İnteraktif 3D Montaj Satranç Görevi',
    description: 'User assembles a physical 3D frame that meets load and deflection constraints.',
    descriptionTr: 'Kullanıcı yük ve sehim kısıtlarını sağlayan gerçek 3D çerçeveyi monte eder.',
    category: 'academy-chess',
    icon: '♟️',
    actionKey: 'launch3DAssemblyChess'
  },
  {
    id: 'link-45',
    sourceModule: 'academy/chess',
    targetModule: 'simulation-fea',
    name: 'Real-Time FEA Verification in Chess Challenge',
    nameTr: 'Satranç Görevinde Anlık FEA Doğrulaması',
    description: 'Evaluates stress and safety factor in background; awards 3 Stars if criteria met.',
    descriptionTr: 'Arka planda gerilme ve emniyeti hesaplar; kriter sağlandığında 3 Yıldız ve Mücevher verir.',
    category: 'academy-chess',
    icon: '⭐',
    actionKey: 'verifyChessInFEA'
  },
  {
    id: 'link-46',
    sourceModule: 'academy/chess',
    targetModule: 'gears-bearings',
    name: 'Gear Kinematics Epicyclic Chess Puzzle',
    nameTr: 'Dişli Kinematiği ve Planet Satranç Bulmacası',
    description: 'Solve target transmission ratio i=12.5:1 by adjusting pinion, idler, and sun gears.',
    descriptionTr: 'Pinyon, avare ve güneş dişlileri ayarlayarak hedef i=12.5:1 çevrim oranını çözdürür.',
    category: 'academy-chess',
    icon: '⚙️',
    actionKey: 'launchGearChessPuzzle'
  },
  {
    id: 'link-47',
    sourceModule: 'academy/chess',
    targetModule: 'cutting-optimizer',
    name: '1D Cut Optimization <3% Scrap Chess Puzzle',
    nameTr: '1D Kesim Optimizasyonu <%3 Fire Satranç Bulmacası',
    description: 'Fit 14 cut segments into minimum raw bars with scrap waste strictly below 3%.',
    descriptionTr: '14 parça kesimini ham çubuklara en az fireyle (<%3) yerleştirme bulmacasını çözer.',
    category: 'academy-chess',
    icon: '🧩',
    actionKey: 'launchCutOptimizerChess'
  },
  {
    id: 'link-48',
    sourceModule: 'academy/chess',
    targetModule: 'bolt-torque',
    name: 'VDI 2230 Bolt Tightening Master Quest',
    nameTr: 'VDI 2230 Civata Torklama Usta Görevi',
    description: 'Achieve FM=24.5kN preload without yielding bolt or crushing aluminum contact face.',
    descriptionTr: 'Civatayı akıtmadan veya alüminyum yüzeyi ezmeden FM=24.5kN ön gerilmeye ulaşma görevi.',
    category: 'academy-chess',
    icon: '🎯',
    actionKey: 'launchBoltTorqueChess'
  },
  {
    id: 'link-49',
    sourceModule: 'academy/chess',
    targetModule: 'bearings',
    name: 'Bearing L10h Life Selection Chess Puzzle',
    nameTr: 'Rulman L10h Ömür Seçim Satranç Bulmacası',
    description: 'Select bearing under 6.2kN radial load at 1800 RPM that exceeds 35,000 operating hours.',
    descriptionTr: '1800 RPM devirde 6.2kN yük altında 35.000 saati aşan doğru rulmanı seçme bulmacası.',
    category: 'academy-chess',
    icon: '👑',
    actionKey: 'launchBearingLifeChess'
  },
  {
    id: 'link-50',
    sourceModule: 'academy/gamification',
    targetModule: 'certificate',
    name: 'Unlock Verified Professional Certificate on Master Tier',
    nameTr: 'Usta Seviyesinde Doğrulanabilir Mühendislik Sertifikası Aç',
    description: 'High XP and solved chess quests generate cryptographic ISO verified engineering diploma.',
    descriptionTr: 'Yüksek XP ve çözülen satranç görevleri kriptografik doğrulamalı mühendislik diploması üretir.',
    category: 'academy-chess',
    icon: '🎓',
    actionKey: 'unlockVerifiedCertificate'
  },
  {
    id: 'link-51',
    sourceModule: 'aegis-copilot',
    targetModule: 'academy/duolingo',
    name: 'AeGiS AI Dynamic Tutor & Contextual Hint Engine',
    nameTr: 'AeGiS AI Dinamik Özel Ders Öğretmeni ve İpucu Motoru',
    description: 'Provides step-by-step formula breakdown and 1-click solver fixes on lesson mistakes.',
    descriptionTr: 'Yanlış cevaplarda adım adım formül açılımı ve tek tıkla çözücü düzeltmesi sunar.',
    category: 'academy-chess',
    icon: '🧠',
    actionKey: 'launchAegisTutor'
  },
  {
    id: 'link-52',
    sourceModule: 'command-palette',
    targetModule: 'all-modules',
    name: 'Universal Omnibox & Cross-Action Dispatcher (Ctrl+K)',
    nameTr: 'Evrensel Komut Paleti ve Çapraz Eylem Dağıtıcı (Ctrl+K)',
    description: 'Searches, links, and executes all cross-module workflows from a single keystroke.',
    descriptionTr: 'Tek tuşla tüm çapraz mühendislik iş akışlarını arar, birbirine bağlar ve anında çalıştırır.',
    category: 'academy-chess',
    icon: '🚀',
    actionKey: 'openCommandPalette'
  },
  // ─── CLUSTER 7: CAD DYNAMIC BLOCKS & FLOW ENGINE MESH (53-56) ───
  {
    id: 'link-53',
    sourceModule: 'cad-dynamic-blocks',
    targetModule: 'flow-engine',
    name: 'Instantiate Flow Computation Node from Dynamic CAD Block',
    nameTr: 'Dinamik CAD Blokundan Flow Hesaplama Düğümü Oluştur',
    description: 'Transfers parametric CAD block dimensions into a deterministic Flow Engine computation graph.',
    descriptionTr: 'Parametrik CAD blok ebatlarını deterministik Flow Engine hesaplama grafiğine aktarır.',
    category: 'cad-nesting',
    icon: '🕸️',
    actionKey: 'exportBlockToFlow'
  },
  {
    id: 'link-54',
    sourceModule: 'flow-engine',
    targetModule: 'cad-dynamic-blocks',
    name: 'Export Flow Engineering Output to 2D CAD Dynamic Block',
    nameTr: 'Flow Hesaplama Çıktısını 2D CAD Dinamik Blokuna Aktar',
    description: 'Instantiates AutoCAD-standard dynamic blocks from calculated Flow outputs with grip parameters.',
    descriptionTr: 'Hesaplanan Flow çıktılarından tutamaç parametreli standart dinamik bloklar üretir.',
    category: 'cad-nesting',
    icon: '📐',
    actionKey: 'exportFlowToDynamicBlock'
  },
  {
    id: 'link-55',
    sourceModule: 'cad-dynamic-blocks',
    targetModule: 'calculators',
    name: 'Bi-directional Solver Parameter Binding for Dynamic Blocks',
    nameTr: 'Dinamik Bloklar İçin Çift Yönlü Hesaplayıcı Parametre Bağlantısı',
    description: 'Synchronizes block grips with full-page engineering solvers (ISO 53, ISO 281, VDI 2230, Eurocode 3).',
    descriptionTr: 'Blok tutamaçlarını tam ekran mühendislik çözücüleriyle senkronize eder.',
    category: 'power-transmission',
    icon: '⚡',
    actionKey: 'openBlockCalculator'
  },
  {
    id: 'link-56',
    sourceModule: 'calculators',
    targetModule: 'cad-dynamic-blocks',
    name: 'Export Dedicated Calculator Sizing to CAD Dynamic Block',
    nameTr: 'Özel Hesaplayıcı Boyutlarını CAD Dinamik Blokuna Aktar',
    description: 'Pushes validated calculator engineering dimensions directly to 2D CAD as interactive blocks.',
    descriptionTr: 'Doğrulanmış mühendislik boyutlarını doğrudan 2D CAD ortamına dinamik blok olarak gönderir.',
    category: 'power-transmission',
    icon: '🧱',
    actionKey: 'exportSolverToDynamicBlock'
  }
];

export class InterconnectionGraphEngine {
  /** Get all 52+ registered connections */
  static getAllEdges(): InterconnectionEdge[] {
    return INTERCONNECTION_GRAPH;
  }

  /** Filter by category */
  static getByCategory(category: InterconnectionEdge['category']): InterconnectionEdge[] {
    return INTERCONNECTION_GRAPH.filter(e => e.category === category);
  }

  /** Find edges involving a specific module */
  static getConnectedEdges(moduleId: string): InterconnectionEdge[] {
    return INTERCONNECTION_GRAPH.filter(
      e => e.sourceModule === moduleId || e.targetModule === moduleId || e.targetModule === 'all-modules'
    );
  }

  /** Total number of verified cross-module connections */
  static get totalCount(): number {
    return INTERCONNECTION_GRAPH.length;
  }
}
