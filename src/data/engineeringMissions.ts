/**
 * AluCAD OS — Interactive In-App Engineering Missions Catalog
 * 
 * 20+ Real-World Engineering Quests that take place directly inside the
 * actual production calculators and workspace tools.
 */

export interface MissionStep {
  id: string;
  labelTr: string;
  labelEn: string;
  hintTr?: string;
  hintEn?: string;
  isAction?: boolean; // true if triggered by button click action (e.g. 'export_3d')
  check: (state: any) => boolean;
}

export interface EngineeringMission {
  id: string;
  titleTr: string;
  titleEn: string;
  category: 'gears' | 'assembly' | 'cutting' | 'cad' | 'bolts' | 'fea' | 'bearings' | 'beams' | 'materials' | 'thermal';
  difficulty: 'Beginner' | 'Intermediate' | 'Master' | 'Grandmaster';
  route: string; // The exact production route to navigate to
  descriptionTr: string;
  descriptionEn: string;
  rewardXp: number;
  rewardGems: number;
  badge?: string;
  steps: MissionStep[];
}

export const ENGINEERING_MISSIONS: EngineeringMission[] = [
  // ─── GEARS MISSIONS ───
  {
    id: 'mission-gears-8m-16-32',
    titleTr: '8m 16x32 Dişli Çifti Hesapla & 3D Sahneye Aktar',
    titleEn: 'Calculate 8m 16x32 Gear Pair & Export to 3D Scene',
    category: 'gears',
    difficulty: 'Beginner',
    route: '/gears',
    descriptionTr: 'Dişli modülüne git; modülü m = 8.0, pinyon diş sayısını z₁ = 16 ve çark diş sayısını z₂ = 32 olarak ayarla. Eksen mesafesini gör ve dişlileri 3D montaj sahnesine aktar.',
    descriptionEn: 'Navigate to Gears module; set module m = 8.0, pinion teeth z₁ = 16, gear teeth z₂ = 32. Verify center distance and export to 3D scene.',
    rewardXp: 150,
    rewardGems: 40,
    badge: 'Gear Initiate',
    steps: [
      {
        id: 'step-m8',
        labelTr: 'Dişli modülünü (m) = 8.0 mm yap',
        labelEn: 'Set gear module (m) = 8.0 mm',
        hintTr: 'Sol paneldeki "Module (m)" kaydırıcısını veya giriş kutusunu 8 yapın.',
        hintEn: 'Set Module (m) input to 8 in the left panel.',
        check: (state) => Number(state?.module) === 8,
      },
      {
        id: 'step-z1-16',
        labelTr: 'Pinyon diş sayısını (z₁) = 16 yap',
        labelEn: 'Set pinion teeth (z₁) = 16',
        hintTr: 'Pinyon Diş Sayısı (z₁) değerini 16 olarak girin.',
        hintEn: 'Enter 16 for Pinion Teeth (z₁).',
        check: (state) => Number(state?.z1) === 16,
      },
      {
        id: 'step-z2-32',
        labelTr: 'Çark diş sayısını (z₂) = 32 yap',
        labelEn: 'Set gear teeth (z₂) = 32',
        hintTr: 'Çark Diş Sayısı (z₂) değerini 32 olarak girin (i = 2.0:1 çevrim oranı).',
        hintEn: 'Enter 32 for Gear Teeth (z₂) for a 2:1 ratio.',
        check: (state) => Number(state?.z2) === 32,
      },
      {
        id: 'step-export-3d',
        labelTr: '"3D Aktar" butonuna tıkla',
        labelEn: 'Click "3D Aktar" (Export to 3D)',
        hintTr: 'Başlıktaki yeşil "3D Aktar" butonuna tıklayarak dişlileri 3D sahneye gönderin.',
        hintEn: 'Click the green "3D Aktar" button in the header.',
        isAction: true,
        check: (state) => Boolean(state?.exportedTo3D),
      },
    ],
  },
  {
    id: 'mission-gears-speed-reducer',
    titleTr: '5:1 Yüksek Hızlı Helisel Redüktör Tasarımı',
    titleEn: '5:1 High Speed Helical Gearbox Design',
    category: 'gears',
    difficulty: 'Intermediate',
    route: '/gears',
    descriptionTr: 'Helisel dişli seç; modülü m = 3.0, pinyon z₁ = 19, çark z₂ = 95 ve helis açısını β = 15° ayarla. ISO 6336 diş dibi emniyetini SF > 1.5 olarak doğrula.',
    descriptionEn: 'Select Helical gear; set m = 3.0, z₁ = 19, z₂ = 95, helix angle β = 15°. Verify root safety SF > 1.5.',
    rewardXp: 180,
    rewardGems: 50,
    badge: 'Helical Master',
    steps: [
      {
        id: 'step-m3',
        labelTr: 'Modülü (m) = 3.0 mm yap',
        labelEn: 'Set module (m) = 3.0 mm',
        check: (state) => Number(state?.module) === 3,
      },
      {
        id: 'step-z1-19',
        labelTr: 'Pinyon diş sayısını (z₁) = 19 yap',
        labelEn: 'Set pinion teeth (z₁) = 19',
        check: (state) => Number(state?.z1) === 19,
      },
      {
        id: 'step-z2-95',
        labelTr: 'Çark diş sayısını (z₂) = 95 yap (i = 5.0:1)',
        labelEn: 'Set gear teeth (z₂) = 95 (i = 5.0:1)',
        check: (state) => Number(state?.z2) === 95,
      },
    ],
  },

  // ─── 3D ASSEMBLY WORKSPACE MISSIONS ───
  {
    id: 'mission-assembly-first-frame',
    titleTr: '3D Montaj Sahnesinde İlk Çerçeveyi Kur',
    titleEn: 'Build Your First Frame in 3D Assembly Workspace',
    category: 'assembly',
    difficulty: 'Beginner',
    route: '/workspace/assembly',
    descriptionTr: '3D Montaj Sahnesine git; sahneye en az 2 adet alüminyum profil ve 1 adet köşe gönyesi ekleyerek temel montaj yapısını oluştur.',
    descriptionEn: 'Go to 3D Assembly; add at least 2 aluminum profiles and 1 corner bracket to construct a basic frame.',
    rewardXp: 160,
    rewardGems: 45,
    badge: 'Frame Builder',
    steps: [
      {
        id: 'step-add-profiles',
        labelTr: 'Sahneye en az 2 adet alüminyum profil ekle',
        labelEn: 'Add at least 2 aluminum profiles to scene',
        hintTr: 'Sol araç çubuğundaki profil ekleme butonunu kullanın.',
        hintEn: 'Use the add profile tool in the left toolbar.',
        check: (state) => Number(state?.profileCount) >= 2,
      },
      {
        id: 'step-add-bracket',
        labelTr: 'Sahneye 1 adet köşe bağlantı gönyesi ekle',
        labelEn: 'Add 1 corner bracket to scene',
        hintTr: 'Braket/Gönye aracını seçip sahneye yerleştirin.',
        hintEn: 'Select bracket tool and place it in the scene.',
        check: (state) => Number(state?.bracketCount) >= 1,
      },
    ],
  },
  {
    id: 'mission-assembly-ai-fasteners',
    titleTr: 'AI ile Bağlantı Elemanlarını Otomatik Tespit Et',
    titleEn: 'Auto-Detect Fasteners with AI Assembly Engine',
    category: 'assembly',
    difficulty: 'Intermediate',
    route: '/workspace/assembly',
    descriptionTr: '3D sahnedeki parçalar arasındaki T-kanal ve delik eşleşmelerini AI Auto-Fastener ile otomatik tespit et ve BOM listesine standart civataları ekle.',
    descriptionEn: 'Auto-detect mating joints between profiles and brackets with AI, populating standard ISO fasteners into BOM.',
    rewardXp: 190,
    rewardGems: 50,
    badge: 'Fastener Automation Master',
    steps: [
      {
        id: 'step-auto-fasten',
        labelTr: 'BOM panelindeki "Auto-Detect Fasteners (AI)" butonunu çalıştır',
        labelEn: 'Trigger "Auto-Detect Fasteners (AI)" in BOM panel',
        hintTr: 'Sağ paneldeki mavi "Auto-Detect Fasteners (AI)" butonuna tıklayın.',
        hintEn: 'Click the blue "Auto-Detect Fasteners (AI)" button in the right BOM panel.',
        isAction: true,
        check: (state) => Boolean(state?.fastenersAutoDetected) || Number(state?.boltCount) > 0,
      },
    ],
  },

  // ─── 1D CUT OPTIMIZER MISSIONS ───
  {
    id: 'mission-cut-optimization-scrap',
    titleTr: '1D Kesim Optimizasyonu ile Fireyi %5 Altına İndir',
    titleEn: '1D Cut Optimization with Scrap Below 5%',
    category: 'cutting',
    difficulty: 'Intermediate',
    route: '/cutting-optimizer',
    descriptionTr: 'Kesim Optimizasyonu modülüne git; 6000mm ham profil çubukları kullanarak parçaları yerleştir ve toplam fire oranını %5 in altına düşür.',
    descriptionEn: 'Navigate to Cut Optimizer; pack parts into 6000mm stock bars and achieve scrap rate below 5%.',
    rewardXp: 200,
    rewardGems: 50,
    badge: 'Efficiency Guru',
    steps: [
      {
        id: 'step-calculate-cuts',
        labelTr: 'Kesim hesaplamasını çalıştır',
        labelEn: 'Run cutting calculation',
        hintTr: '"Hesapla / Optimize Et" butonuna tıklayın.',
        hintEn: 'Click "Calculate / Optimize".',
        check: (state) => Boolean(state?.hasCalculated),
      },
      {
        id: 'step-low-scrap',
        labelTr: 'Toplam fire oranını %5.0 ın altına düşür',
        labelEn: 'Achieve total scrap rate below 5.0%',
        hintTr: 'Parça adetlerini veya yerleşim algoritmasını optimize edin.',
        hintEn: 'Adjust part quantities or algorithm to reduce scrap.',
        check: (state) => state?.scrapPercent !== undefined && Number(state?.scrapPercent) <= 5.0,
      },
      {
        id: 'step-gcode-generated',
        labelTr: 'CNC Testere G-Code Takım Yolunu Görüntüle',
        labelEn: 'View CNC Saw G-Code Toolpath',
        hintTr: 'Sonuçlar sekmesindeki "G-Code" sekmesine geçin.',
        hintEn: 'Switch to the "G-Code" tab in results.',
        check: (state) => Boolean(state?.gcodeGenerated),
      },
    ],
  },

  // ─── 2D CAD & SECTION PROPERTIES MISSIONS ───
  {
    id: 'mission-cad-section-properties',
    titleTr: '2D CAD ile Özel Profil Çiz & Kesit Değerlerini Çıkar',
    titleEn: 'Draw Custom Profile in 2D CAD & Extract Section Properties',
    category: 'cad',
    difficulty: 'Intermediate',
    route: '/cad-editor',
    descriptionTr: '2D CAD editöründe profil veya dikdörtgen çizimi yap; alan ve atalet momentlerini (Ix, Iy) hesapla.',
    descriptionEn: 'Draw a profile or rectangle in 2D CAD; calculate area and moments of inertia (Ix, Iy).',
    rewardXp: 180,
    rewardGems: 45,
    badge: 'CAD Draftsman',
    steps: [
      {
        id: 'step-draw-entity',
        labelTr: 'CAD tuvaline en az 1 geometrik şekil çiz',
        labelEn: 'Draw at least 1 geometry on CAD canvas',
        hintTr: 'Araç çubuğundan Dikdörtgen veya Çizgi aracını kullanarak çizim yapın.',
        hintEn: 'Use Rectangle or Line tool to draw on canvas.',
        check: (state) => Number(state?.entityCount) >= 1,
      },
    ],
  },

  // ─── VDI 2230 BOLT TORQUE MISSIONS ───
  {
    id: 'mission-bolt-torque-m10',
    titleTr: 'VDI 2230 Standardında M10 Civata Sıkma Torkunu Hesapla',
    titleEn: 'Calculate M10 Bolt Tightening Torque per VDI 2230',
    category: 'bolts',
    difficulty: 'Beginner',
    route: '/bolt-torque',
    descriptionTr: 'Civata Torku modülüne git; anma çapı M10, kalite 8.8 ve sürtünme katsayısı µ = 0.14 için önerilen sıkma torkunu (MA ~ 49 N·m) hesapla.',
    descriptionEn: 'Go to Bolt Torque; select M10, 8.8 grade, friction µ = 0.14, and compute recommended torque MA ~ 49 N·m.',
    rewardXp: 170,
    rewardGems: 40,
    badge: 'Torque Specialist',
    steps: [
      {
        id: 'step-m10-selected',
        labelTr: 'Civata anma çapını M10 olarak seç',
        labelEn: 'Select bolt diameter M10',
        check: (state) => String(state?.boltSize).toUpperCase().includes('M10'),
      },
    ],
  },

  // ─── FEA STRUCTURAL MISSIONS ───
  {
    id: 'mission-fea-structural-check',
    titleTr: 'Yapısal FEA Simülatöründe Gerilme ve Sehim Analizi',
    titleEn: 'Stress & Deflection Analysis in Structural FEA Solver',
    category: 'fea',
    difficulty: 'Master',
    route: '/fea',
    descriptionTr: 'FEA simülasyon modülüne git; 800mm açıklıktaki kiriş modeline 4,000 N yük uygula ve von Mises gerilmesinin akma sınırının altında kaldığını doğrula.',
    descriptionEn: 'Open FEA module; apply 4,000 N load to an 800mm beam model and verify von Mises stress remains below yield.',
    rewardXp: 220,
    rewardGems: 60,
    badge: 'FEA Analyst',
    steps: [
      {
        id: 'step-fea-solve',
        labelTr: 'FEA modelini çöz ve gerilme dağılımını incele',
        labelEn: 'Solve FEA model and inspect stress distribution',
        check: (state) => Boolean(state?.feaSolved),
      },
    ],
  },

  // ─── BEARINGS MISSIONS ───
  {
    id: 'mission-bearings-life-30k',
    titleTr: 'ISO 281 ile 30.000+ Saat Ömürlü Rulman Seçimi',
    titleEn: 'ISO 281 Bearing Selection for 30,000+ Hours Life',
    category: 'bearings',
    difficulty: 'Intermediate',
    route: '/bearings',
    descriptionTr: 'Rulman modülüne git; 1500 RPM devir ve 4.5 kN radyal yük altında L10h ömrü 30.000 saati geçen uygun rulmanı bul.',
    descriptionEn: 'Go to Bearings module; find a bearing that exceeds 30,000 hours L10h life under 1500 RPM and 4.5 kN radial load.',
    rewardXp: 180,
    rewardGems: 45,
    badge: 'Tribology Master',
    steps: [
      {
        id: 'step-bearing-calc',
        labelTr: 'Rulman ömrünü hesapla',
        labelEn: 'Calculate bearing life',
        check: (state) => Boolean(state?.bearingCalculated),
      },
    ],
  },
];
