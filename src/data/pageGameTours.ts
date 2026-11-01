/**
 * 🎮 PC-GAME STYLE INTERACTIVE PAGE TOURS & TACTICAL QUEST DEFINITIONS
 *
 * Every major page in AluCAD OS has a step-by-step interactive tutorial
 * with real DOM element targeting (`selector`), "CLICK THIS / DO THIS" action badges,
 * AeGiS mascot poses, XP rewards, and cross-page campaign progression.
 */

import type { AegisPose } from '@/components/copilot/AegisMascot';

export interface GameTourStep {
  id: string;
  /** CSS selector(s) comma-separated to spotlight on the current page */
  selector: string;
  /** Short imperative game command badge ("BUNA TIKLA", "BURAYA YAZ", "SÜRÜKLE") */
  actionBadgeTr: string;
  actionBadgeEn: string;
  titleTr: string;
  titleEn: string;
  instructionTr: string;
  instructionEn: string;
  /** Concrete tip on what happens when the user performs the action */
  proTipTr: string;
  proTipEn: string;
  pose: Exclude<AegisPose, 'auto'>;
  xpReward: number;
  /** If true, clicking the highlighted DOM element automatically advances to the next step */
  advanceOnTargetClick?: boolean;
}

export interface PageGameTourConfig {
  pageKey: 'home' | 'design-studio' | 'cad-editor' | 'calculators' | 'flow' | 'materials' | 'solver-detail';
  routePattern: string;
  questTitleTr: string;
  questTitleEn: string;
  subtitleTr: string;
  subtitleEn: string;
  nextPageHref?: string;
  nextPageLabelTr?: string;
  nextPageLabelEn?: string;
  steps: GameTourStep[];
}

export const PAGE_GAME_TOURS: Record<PageGameTourConfig['pageKey'], PageGameTourConfig> = {
  home: {
    pageKey: 'home',
    routePattern: '/',
    questTitleTr: 'BÖLÜM 1: KOMUTA MERKEZİ & ATÖLYE REHBERİ',
    questTitleEn: 'STAGE 1: COMMAND CENTER & STUDIO BRIEFING',
    subtitleTr: 'AluCAD OS Mühendislik İşletim Sistemine Hoş Geldin! İlk görevlerini tamamla.',
    subtitleEn: 'Welcome to AluCAD OS! Follow the tactical markers to master the workspace.',
    nextPageHref: '/design-studio',
    nextPageLabelTr: '3B Tasarım Stüdyosu Turuna Geç →',
    nextPageLabelEn: 'Proceed to 3D CAD Studio Tour →',
    steps: [
      {
        id: 'home-step-mascot',
        selector: '[data-tour="home-mascot"]',
        actionBadgeTr: '🤖 AEGIS’E TIKLA',
        actionBadgeEn: '🤖 CLICK AEGIS',
        titleTr: '1. AeGiS ile tanış',
        titleEn: '1. Meet AeGiS',
        instructionTr:
          'Ortadaki AeGiS’e TIKLA, sevinsin; ya da yana sürükleyip bırak. Fareyi gezdirdiğinde gözleriyle seni takip eder, yazmaya başladığında arama kutusuna bakar.',
        instructionEn:
          'CLICK AeGiS in the middle to cheer it up, or drag it sideways and let go. It follows your cursor and looks at the search box while you type.',
        proTipTr: 'İpucu: Göğsündeki pirinç dişliye dokunursan Overdrive moduna geçer.',
        proTipEn: 'Tip: Tap the brass gear in its chest to switch on Overdrive.',
        pose: 'wave',
        xpReward: 50,
        advanceOnTargetClick: false,
      },
      {
        id: 'home-step-search',
        selector: '[data-tour="home-search"]',
        actionBadgeTr: '⌨️ KUTUYA YAZ',
        actionBadgeEn: '⌨️ TYPE IN THE BOX',
        titleTr: '2. Ne hesaplamak istediğini yaz',
        titleEn: '2. Type what you want to calculate',
        instructionTr:
          '"M12", "6205 rulman" ya da "H7/g6" yaz. Enter ilgili ISO / DIN / VDI hesabını açar; hazır bir hesap yoksa AeGiS sohbette yanıtlar.',
        instructionEn:
          'Type "M12", "6205 bearing" or "H7/g6". Enter opens the matching ISO / DIN / VDI calculation; if there is none, AeGiS answers in the chat.',
        proTipTr: 'İpucu: Ctrl+K her sayfada komut paletini açar.',
        proTipEn: 'Tip: Ctrl+K opens the command palette on any page.',
        pose: 'calculation',
        xpReward: 50,
        advanceOnTargetClick: false,
      },
      {
        id: 'home-step-cta',
        selector: '[data-tour="home-cta-bar"]',
        actionBadgeTr: '🚀 BİR ÇALIŞMA ALANI SEÇ',
        actionBadgeEn: '🚀 PICK A WORKSPACE',
        titleTr: '3. Beş çalışma alanı',
        titleEn: '3. Five workspaces',
        instructionTr:
          'Çözücüler, 3D CAD, 2D CAD, Flow ve Akademi buradan açılır. Birine TIKLA ya da aşağıdaki düğmeyle 3D stüdyo turuna geç.',
        instructionEn:
          'Solvers, 3D CAD, 2D CAD, Flow and Academy open from here. CLICK one, or continue to the 3D studio tour with the button below.',
        proTipTr: 'İpucu: Bir çözücüde hesapladığın dişliyi ya da flanşı tek tıkla 2D/3D CAD’e aktarabilirsin.',
        proTipEn: 'Tip: A gear or flange you calculate in a solver can be sent to 2D/3D CAD in one click.',
        pose: 'celebrate',
        xpReward: 100,
        advanceOnTargetClick: true,
      },
    ],
  },

  'design-studio': {
    pageKey: 'design-studio',
    routePattern: '/design-studio',
    questTitleTr: 'BÖLÜM 2: 3B PARAMETRİK CAD & DOĞRUDAN YÜZEY MODELLEME',
    questTitleEn: 'STAGE 2: 3D PARAMETRIC CAD & DIRECT FACE MODELING',
    subtitleTr: '3B parçaları karmaşık menüler olmadan doğrudan yüzeyinden çekerek, delerek ve ölçülendirerek düzenle!',
    subtitleEn: 'Edit 3D parts effortlessly with Shapr3D-style Push/Pull, Click-to-Drill, and inline hole editing!',
    nextPageHref: '/cad-editor',
    nextPageLabelTr: '2B AluCAD & Dinamik Bloklar Turuna Geç →',
    nextPageLabelEn: 'Proceed to 2D AluCAD & Dynamic Blocks Tour →',
    steps: [
      {
        id: 'ds-step-library',
        selector: '[data-tour="ds-left-panel"], aside',
        actionBadgeTr: '📦 SOL PANELDEN PARÇA EKLE',
        actionBadgeEn: '📦 ADD A PART FROM LEFT PANEL',
        titleTr: '1. Sahneye 3B Parça veya Hazır Makine Elemanı Ekle',
        titleEn: '1. Spawn a 3D Primitive or Machine Element',
        instructionTr:
          'Sol paneldeki "Kutu (Box)", "Silindir", "Plaka", "Dişli" veya "Alüminyum Profil" butonlarından birine TIKLA. Parça anında 3B sahnenin merkezinde oluşur.',
        instructionEn:
          'CLICK any shape in the left library ("Box", "Cylinder", "Plate", "Gear", or "Profile") to spawn it at the center of the 3D viewport.',
        proTipTr: 'İpucu: Şablonlar sekmesinden komple redüktör veya rulman yatağı montajı da yükleyebilirsin.',
        proTipEn: 'Tip: You can also load complete gearbox or bearing assemblies from the Templates tab.',
        pose: 'cad3d',
        xpReward: 60,
        advanceOnTargetClick: false,
      },
      {
        id: 'ds-step-viewport',
        selector: '[data-tour="ds-viewport"], canvas',
        actionBadgeTr: '🖱️ 3B PARÇANIN YÜZEYİNE TIKLA',
        actionBadgeEn: '🖱️ CLICK ON THE 3D PART SURFACE',
        titleTr: '2. Yüzey Seç & Canlı Normal Okunu Gör',
        titleEn: '2. Select a Face & Use Live 3D Handles',
        instructionTr:
          '3B sahnedeki parçanın üzerine TIKLA! Seçtiğin yüzeyde mavi bir yüzey normali oku, üzerinde "-5 / +5" Push-Pull butonları ve kenarlarda "W / H / D" canlı ölçü etiketleri belirecek.',
        instructionEn:
          'CLICK on the 3D part in the viewport! A cyan face-normal arrow with "-5 / +5" Push/Pull buttons and live "W / H / D" dimension badges will appear right on the model.',
        proTipTr: 'İpucu: 3B sahnedeki W/H/D ölçü rozetlerinin yanındaki [-] ve [+] butonlarına tıklayarak veya çift tıklayıp sayı yazarak parçayı anında büyütebilirsin!',
        proTipEn: 'Tip: Click the [-] / [+] buttons on the 3D dimension badges or double-click them to type exact mm values!',
        pose: 'laser',
        xpReward: 75,
        advanceOnTargetClick: false,
      },
      {
        id: 'ds-step-direct-bar',
        selector: '[data-tour="ds-direct-bar"]',
        actionBadgeTr: '⚡ ALT ÇUBUKTAN İT/ÇEK VEYA DELİK AÇ',
        actionBadgeEn: '⚡ PUSH/PULL OR DRILL FROM BOTTOM BAR',
        titleTr: '3. Doğrudan Yüzey Modelleme Çubuğu (Shapr3D Modu)',
        titleEn: '3. Direct Face Modeling Bar (Push/Pull & Click-to-Drill)',
        instructionTr:
          'Parça seçiliyken ekranın altında açılan bu çubuktan: (1) Doğrudan mm yazıp yüzeyi İT/ÇEK, (2) "Delik (M6)" menüsüne tıklayıp "3B Yüzeye Tıkla-Del"i açarak parçanın istediğin noktasına TIKLAYIP delik del, (3) Kama kanalı veya pah aç!',
        instructionEn:
          'Use the bottom Direct Modeling Bar to: (1) Type exact mm or click -5/+5 to Push/Pull the face, (2) Open "Hole (M6)" and activate "Click-on-Face" to drill anywhere you click on the 3D surface, or (3) Stamp a keyway slot!',
        proTipTr: 'İpucu: "Y=0" butonuna tıklayarak havada kalan parçayı tek tıkla zemine sıfırlayabilirsin.',
        proTipEn: 'Tip: Click the "Y=0" button to drop any floating part flush to the workshop floor.',
        pose: 'calculation',
        xpReward: 90,
        advanceOnTargetClick: false,
      },
      {
        id: 'ds-step-inspector',
        selector: '[data-tour="ds-inspector"]',
        actionBadgeTr: '🛠️ SAĞ PANELDEN DELİK & ÖLÇÜ DÜZENLE',
        actionBadgeEn: '🛠️ INLINE-EDIT HOLES & DIMENSIONS',
        titleTr: '4. Delikleri ve Cepleri Silmeden Canlı Düzenle!',
        titleEn: '4. Edit Existing Holes & Pockets Inline Without Deleting!',
        instructionTr:
          'Sağdaki Denetçi panelinde "📏 Ölçü" ve "🕳️ Delik/Cep" sekmelerine TIKLA. Parçaya açtığın deliklerin çapını (M3–M20), tipini (İmbus/Kılavuz), yüzeyini ve X/Y koordinatını silmeye gerek kalmadan buradan anında değiştirebilirsin!',
        instructionEn:
          'In the right Inspector panel, CLICK the "📏 Dim" and "🕳️ Holes" tabs. You can change any existing hole’s bolt size (M3–M20), type, face, or X/Y coordinates live without deleting and re-drilling!',
        proTipTr: 'İpucu: Sağ panelden ayrıca R2 / R5 / R10 tek tıkla köşe radyüsü (Fillet) verebilirsin.',
        proTipEn: 'Tip: You can also apply 1-click Edge Fillets (R2 / R5 / R10) right from the Inspector.',
        pose: 'celebrate',
        xpReward: 100,
        advanceOnTargetClick: false,
      },
    ],
  },

  'cad-editor': {
    pageKey: 'cad-editor',
    routePattern: '/cad-editor',
    questTitleTr: 'BÖLÜM 3: 2B ALUCAD, 49+ DİNAMİK BLOK & KESİM OPTİMİZASYONU',
    questTitleEn: 'STAGE 3: 2D ALUCAD, 49+ DYNAMIC BLOCKS & NESTING',
    subtitleTr: 'AutoCAD kalitesinde 2B teknik çizim yap, ISO 128 taramalı dinamik blokları sürükle ve sac kesim planı çıkar!',
    subtitleEn: 'Draft 2D drawings, stretch parametric ISO/DIN dynamic blocks with live grips, and optimize sheet cutting!',
    nextPageHref: '/calculators',
    nextPageLabelTr: 'Mühendislik Çözücüleri Turuna Geç →',
    nextPageLabelEn: 'Proceed to Engineering Solvers Tour →',
    steps: [
      {
        id: 'cad-step-ribbon',
        selector: '[data-tour="cad-ribbon"], header, nav',
        actionBadgeTr: '📐 ÇİZİM VEYA DİNAMİK BLOK SEÇ',
        actionBadgeEn: '📐 PICK A DRAFTING TOOL OR DYNAMIC BLOCK',
        titleTr: '1. Üst Araç Şeridi & Dinamik Blok Kütüphanesi',
        titleEn: '1. Drafting Ribbon & Dynamic Block Library',
        instructionTr:
          'Üst araç şeridinden Çizgi (L), Daire (C), Dikdörtgen (REC), Ölçülendirme veya "Dinamik Bloklar (49+ Hazır Makine & Mimari Eleman)" butonuna TIKLA.',
        instructionEn:
          'CLICK Line (L), Circle (C), Rectangle (REC), Dimension, or "Dynamic Blocks (49+ Parametric Components)" in the top ribbon.',
        proTipTr: 'İpucu: Hidrolik silindir, HIWIN lineer kızak, vidalı mil, konveyör rulosu, pnömatik gripper, vana ve yay bloklarının tamamı gerçek ISO 128 HATCH kesit taramalıdır!',
        proTipEn: 'Tip: Hydraulic cylinders, HIWIN linear guides, ball screws, conveyor rollers, grippers, and valves include ISO 128 HATCH cross-sections!',
        pose: 'blueprint',
        xpReward: 60,
        advanceOnTargetClick: false,
      },
      {
        id: 'cad-step-canvas',
        selector: '[data-tour="cad-canvas"], canvas',
        actionBadgeTr: '🟦 TUVALE TIKLA & MAVİ GRİPLERİ SÜRÜKLE',
        actionBadgeEn: '🟦 CLICK CANVAS & DRAG BLUE GRIPS',
        titleTr: '2. 2B Tuval & Mavi Grip Tutamaçları ile Canlı Uzatma',
        titleEn: '2. 2D Canvas & Live Dynamic Grip Stretching',
        instructionTr:
          'Tuvale yerleştirdiğin herhangi bir Dinamik Bloğun üzerine TIKLA: Üzerinde beliren mavi kare/ok tutamaçlarını (Grip) fareyle sürükleyerek silindir kursunu, ray boyunu veya çene açıklığını anında uzatıp kısaltabilir, merkez noktasından istediğin yere taşıyabilirsin!',
        instructionEn:
          'CLICK any Dynamic Block on the canvas: drag its cyan/blue Grip handles to stretch cylinder stroke, rail length, or gripper opening in real time, or drag its center grip to move it!',
        proTipTr: 'İpucu: Bloğa çift tıklayarak görünüşünü (Ön Görünüş / Boyuna Kesit / Üst Plan) veya standart modelini (UCP206 -> UCP210) değiştirebilirsin.',
        proTipEn: 'Tip: Double-click any block instance to switch its Visibility State (Front / Cross-Section / Top Plan) or catalog size.',
        pose: 'cad3d',
        xpReward: 90,
        advanceOnTargetClick: false,
      },
    ],
  },

  calculators: {
    pageKey: 'calculators',
    routePattern: '/calculators',
    questTitleTr: 'BÖLÜM 4: NORMATİF ISO / DIN / VDI MÜHENDİSLİK ÇÖZÜCÜLERİ',
    questTitleEn: 'STAGE 4: NORMATIVE ISO / DIN / VDI ENGINEERING SOLVERS',
    subtitleTr: 'Sıfır yuvarlama hatasıyla çalışan deterministik mühendislik hesap motorlarını keşfet.',
    subtitleEn: 'Explore deterministic engineering solvers with step-by-step formulas and PDF certification.',
    nextPageHref: '/flow',
    nextPageLabelTr: 'Görsel Akış Motoru (Flow) Turuna Geç →',
    nextPageLabelEn: 'Proceed to Visual Flow Engine Tour →',
    steps: [
      {
        id: 'calc-step-search',
        selector: 'input[type="text"], input[type="search"], main',
        actionBadgeTr: '🔍 STANDART VEYA KONU ARA',
        actionBadgeEn: '🔍 FILTER BY STANDARD OR TOPIC',
        titleTr: '1. Standart Kodu veya Makine Elemanına Göre Filtrele',
        titleEn: '1. Filter by ISO/DIN Standard or Machine Element',
        instructionTr:
          'Arama kutusuna "ISO 6336", "VDI 2230", "ISO 281" veya aradığın makine elemanını yazarak ya da kategori sekmelerine TIKLAYARAK ilgili çözücü kartını bul.',
        instructionEn:
          'Type "ISO 6336", "VDI 2230", "ISO 281", or click a category tab to filter the verified solver catalog.',
        proTipTr: 'İpucu: Her çözücü kartında kullanılan resmi norm (Tier-1 Normative / Tier-2 Scientific) açıkça belirtilir.',
        proTipEn: 'Tip: Every solver card cites its exact normative standard (ISO, DIN, VDI, Eurocode).',
        pose: 'calculation',
        xpReward: 60,
        advanceOnTargetClick: false,
      },
      {
        id: 'calc-step-open',
        selector: 'main a[href*="/"], main',
        actionBadgeTr: '⚡ BİR ÇÖZÜCÜ KARTINA TIKLA',
        actionBadgeEn: '⚡ CLICK ANY SOLVER CARD',
        titleTr: '2. Çözücüyü Aç, Parametreleri Gir & Rapor Al',
        titleEn: '2. Open a Solver, Enter Parameters & Export PDF',
        instructionTr:
          'Herhangi bir çözücü kartına TIKLAYARAK hesap ekranını aç. Kuvvet, devir ve malzeme değerlerini girdiğinde emniyet katsayısı (S_F) ve 3B/2B önizleme anında hesaplanır!',
        instructionEn:
          'CLICK any solver card to launch its workbench. Adjust load, speed, and material inputs to compute safety factors and export a traceable PDF report!',
        proTipTr: 'İpucu: Çözücü içindeki "CAD\'e Gönder" butonuyla hesaplanan parçayı doğrudan 2B/3B çizime aktarabilirsin.',
        proTipEn: 'Tip: Use the "Send to CAD" button inside any solver to transfer the calculated geometry straight into 2D/3D CAD.',
        pose: 'celebrate',
        xpReward: 80,
        advanceOnTargetClick: false,
      },
    ],
  },

  flow: {
    pageKey: 'flow',
    routePattern: '/flow',
    questTitleTr: 'BÖLÜM 5: GÖRSEL AKIŞ GRAFİĞİ (FLOW ENGINE)',
    questTitleEn: 'STAGE 5: VISUAL COMPUTATION GRAPH (FLOW ENGINE)',
    subtitleTr: 'Motor, redüktör, mil ve rulman hesaplarını kablolarla birbirine bağlayarak zincirleme çöz!',
    subtitleEn: 'Wire motor power to gearboxes, shafts, and bearings in a deterministic node graph!',
    nextPageHref: '/materials',
    nextPageLabelTr: 'Malzeme & Alaşım Kütüphanesi Turuna Geç →',
    nextPageLabelEn: 'Proceed to Materials & Alloys Tour →',
    steps: [
      {
        id: 'flow-step-nodes',
        selector: 'main, canvas, [class*="flow"]',
        actionBadgeTr: '🔌 DÜĞÜMLERİ BAĞLA & ZİNCİRLEME ÇÖZ',
        actionBadgeEn: '🔌 WIRE NODES & SOLVE GRAPH',
        titleTr: '1. Düğüm Tabanlı Mühendislik Otomasyonu',
        titleEn: '1. Node-Based Engineering Automation',
        instructionTr:
          'Sol kütüphaneden "Elektrik Motoru", "Dişli Çifti" ve "Mil Mukavemet" düğümlerini sahneye ekle; motorun "Çıkış Torku (Nm)" portunu dişlinin giriş portuna sürükleyip bağla! Motor gücünü değiştirdiğinde tüm sistem otomatik güncellenir.',
        instructionEn:
          'Add "Electric Motor", "Gear Pair", and "Shaft Stress" nodes, then wire the Motor "Torque (Nm)" output port into the Gear input port! Changing motor power automatically propagates through the entire drivetrain.',
        proTipTr: 'İpucu: Portlar birim korumalıdır (Nm, MPa, mm); uyumsuz birimleri yanlışlıkla birbirine bağlamanı engeller.',
        proTipEn: 'Tip: Ports are semantically typed (Nm, MPa, mm) to prevent unit mismatch errors.',
        pose: 'tesla',
        xpReward: 100,
        advanceOnTargetClick: false,
      },
    ],
  },

  materials: {
    pageKey: 'materials',
    routePattern: '/materials',
    questTitleTr: 'BÖLÜM 6: MALZEME & ALAŞIM EL KİTABI',
    questTitleEn: 'STAGE 6: MATERIALS & ALLOYS HANDBOOK',
    subtitleTr: 'Alüminyum (6061-T6, 7075-T6), çelik (42CrMo4, S355J2) ve titanyum alaşımlarını karşılaştır.',
    subtitleEn: 'Compare certified mechanical, thermal, and CNC machinability properties across alloys.',
    nextPageHref: '/',
    nextPageLabelTr: 'Ana Komuta Merkezine Dön 🏠',
    nextPageLabelEn: 'Return to Command Center 🏠',
    steps: [
      {
        id: 'mat-step-explore',
        selector: 'main',
        actionBadgeTr: '🧪 ALAŞIM SEÇ & KARŞILAŞTIR',
        actionBadgeEn: '🧪 SELECT & COMPARE ALLOYS',
        titleTr: '1. Sertifikalı Malzeme Veri Sayfaları',
        titleEn: '1. Certified Alloy Datasheets',
        instructionTr:
          'Alaşım kartlarına TIKLAYARAK akma dayanımı (Rp0.2), çekme dayanımı (Rm), elastisite modülü (E), ısıl iletkenlik ve CNC işlenebilirlik verilerini incele ve doğrudan çözücülere aktar.',
        instructionEn:
          'CLICK any alloy card to inspect yield strength (Rp0.2), tensile strength (Rm), Young’s modulus (E), and thermal conductivity, or apply it directly to your active solver.',
        proTipTr: 'Tebrikler! Tüm ana atölyelerin saha eğitimini tamamladın!',
        proTipEn: 'Congratulations! You have completed the full AluCAD OS field training campaign!',
        pose: 'celebrate',
        xpReward: 100,
        advanceOnTargetClick: false,
      },
    ],
  },

  'solver-detail': {
    pageKey: 'solver-detail',
    routePattern: '/*',
    questTitleTr: 'CANLI MÜHENDİSLİK ÇÖZÜCÜ REHBERİ',
    questTitleEn: 'LIVE ENGINEERING SOLVER GUIDE',
    subtitleTr: 'Parametreleri gir, emniyet katsayısını doğrula ve 2B/3B CAD veya PDF rapora aktar.',
    subtitleEn: 'Enter parameters, verify safety factors, and export to 2D/3D CAD or PDF report.',
    nextPageHref: '/design-studio',
    nextPageLabelTr: '3B Tasarım Stüdyosuna Git →',
    nextPageLabelEn: 'Go to 3D CAD Studio →',
    steps: [
      {
        id: 'solver-step-inputs',
        selector: 'main input, main select, main',
        actionBadgeTr: '🔢 DEĞERLERİ DEĞİŞTİR & SONUCU GÖR',
        actionBadgeEn: '🔢 ADJUST INPUTS & INSPECT RESULTS',
        titleTr: '1. Canlı Parametre Girişi & Normatif Doğrulama',
        titleEn: '1. Live Parameter Input & Normative Verification',
        instructionTr:
          'Sol/üst bölümdeki sayısal giriş kutularına TIKLAYARAK yük, devir, boyut veya malzeme parametrelerini değiştir. Sağdaki sonuç panelinde emniyet katsayısı (PASS / FAIL), adım adım formüller ve grafikler anında güncellenir!',
        instructionEn:
          'CLICK any input field to modify load, speed, geometry, or material parameters. Watch the safety factor (PASS / FAIL), step-by-step formulas, and diagrams update instantaneously!',
        proTipTr: 'İpucu: Sonuç panelindeki PDF Rapor veya CAD dışa aktarma butonlarıyla hesabı resmi dökümana dönüştürebilirsin.',
        proTipEn: 'Tip: Use the PDF Report or CAD export buttons in the results panel to generate production documentation.',
        pose: 'calculation',
        xpReward: 75,
        advanceOnTargetClick: false,
      },
    ],
  },
};

const NON_SOLVER_PREFIXES = [
  '/admin',
  '/login',
  '/register',
  '/pricing',
  '/privacy',
  '/terms',
  '/about',
  '/contact',
  '/blog',
  '/academy',
  '/field',
  '/glossary',
];

export function resolvePageTourForPathname(pathname: string): PageGameTourConfig | null {
  const clean = (pathname || '/').replace(/\/+$/, '') || '/';
  if (clean === '/') return PAGE_GAME_TOURS.home;
  if (clean.startsWith('/design-studio') || clean.startsWith('/parametric-cad') || clean.startsWith('/split-cad')) {
    return PAGE_GAME_TOURS['design-studio'];
  }
  if (clean.startsWith('/cad-editor') || clean.startsWith('/sketch-pad') || clean.startsWith('/nesting-2d')) {
    return PAGE_GAME_TOURS['cad-editor'];
  }
  if (clean === '/calculators') return PAGE_GAME_TOURS.calculators;
  if (clean.startsWith('/flow')) return PAGE_GAME_TOURS.flow;
  if (clean.startsWith('/materials')) return PAGE_GAME_TOURS.materials;

  if (NON_SOLVER_PREFIXES.some((p) => clean.startsWith(p))) {
    return null;
  }

  // Individual calculator / engineering workbench route
  return PAGE_GAME_TOURS['solver-detail'];
}
