/**
 * 🦉 ALUCALC DUOLINGO ENGINEERING CURRICULUM DATA
 * 
 * 15 Structured Units grouped into 4 Master Sections:
 * - Section 1: Fasteners & Basic Statics (VDI 2230, ISO 898-1, Statics, Threads)
 * - Section 2: Rotating Elements & Power (ISO 281 Bearings, ISO 6336 Gears, DIN 743 Shafts, Belts)
 * - Section 3: Strength of Materials & Beams (Euler-Bernoulli, Mohr's Circle, Euler Buckling, Torsion)
 * - Section 4: Manufacturing & FEA (DIN 6935 Bending, Chip Breakers, FEA Von Mises)
 */

export interface DuolingoLessonStep {
  type: 'concept' | 'multiple_choice' | 'match_pairs';
  titleTr: string;
  titleEn: string;
  // Concept step fields
  conceptTr?: string;
  conceptEn?: string;
  formula?: string;
  // Question step fields
  questionTr?: string;
  questionEn?: string;
  optionsTr?: string[];
  optionsEn?: string[];
  correctIndex?: number;
  explanationTr?: string;
  explanationEn?: string;
  // Match pairs step fields
  pairsTr?: { left: string; right: string }[];
  pairsEn?: { left: string; right: string }[];
}

export interface DuolingoLesson {
  id: string;
  slug: string;
  number: number;
  titleTr: string;
  titleEn: string;
  standard: string;
  category: string;
  iconName: string;
  xpReward: number;
  steps: DuolingoLessonStep[];
}

export interface DuolingoSection {
  id: string;
  number: number;
  titleTr: string;
  titleEn: string;
  descriptionTr: string;
  descriptionEn: string;
  gradient: string;
  lessons: DuolingoLesson[];
}

export const DUOLINGO_SECTIONS: DuolingoSection[] = [
  // ─── BÖLÜM 1 ───
  {
    id: 'section-1',
    number: 1,
    titleTr: 'Bölüm 1: Bağlantı Elemanları & Temel Mekanik',
    titleEn: 'Section 1: Fasteners & Fundamental Mechanics',
    descriptionTr: 'Cıvata ön gerilimi, sıkma torku kayıpları ve statik denge temelleri.',
    descriptionEn: 'Bolt preloading, tightening friction mechanics, and static equilibrium.',
    gradient: 'from-cyan-500 to-blue-600',
    lessons: [
      {
        id: 'lesson-1',
        slug: 'bolt-torque-vdi2230',
        number: 1,
        titleTr: 'Cıvata Torku & Ön Gerilme (VDI 2230)',
        titleEn: 'Bolt Torque & Preload (VDI 2230)',
        standard: 'VDI 2230',
        category: 'Bağlantı Elemanları',
        iconName: 'Wrench',
        xpReward: 30,
        steps: [
          {
            type: 'concept',
            titleTr: 'Sıkma Torkunun Temel Prensibi',
            titleEn: 'Core Principle of Tightening Torque',
            conceptTr: 'Uyguladığınız sıkma torkunun %85-90\'ı diş ve kafa altı sürtünmesinde ısı olarak harcanır. Sadece kalan %10-15 cıvatayı uzatarak parçaları birbirine kenetleyen ön gerilme kuvvetine (FM) dönüşür.',
            conceptEn: '85-90% of bolt torque is consumed by thread and underhead friction. Only 10-15% converts into clamping preload (FM).',
            formula: 'T = F_M \\cdot \\left( 0.5 d_2 \\tan(\\varphi + \\rho\') + 0.5 D_b \\mu_b \\right)'
          },
          {
            type: 'multiple_choice',
            titleTr: 'Soru 1',
            titleEn: 'Question 1',
            questionTr: 'Cıvata sıkma torkunun yaklaşık yüzde kaçı sürtünme nedeniyle kaybolur?',
            questionEn: 'Approximately what percentage of bolt tightening torque is consumed by friction?',
            optionsTr: ['%10 - %20', '%30 - %45', '%50 - %60', '%85 - %90'],
            optionsEn: ['10% - 20%', '30% - 45%', '50% - 60%', '85% - 90%'],
            correctIndex: 3,
            explanationTr: 'Doğru! Torkun sadece %10-15\'i ön gerilme kuvveti üretir, kalan %85-90\'ı sürtünmede kaybolur.',
            explanationEn: 'Correct! Only 10-15% produces clamp load, the rest overcomes friction.'
          },
          {
            type: 'multiple_choice',
            titleTr: 'Soru 2',
            titleEn: 'Question 2',
            questionTr: '8.8 kalite çelik bir cıvatanın akma dayanımı (Rp0.2) kaç MPa\'dır?',
            questionEn: 'What is the yield strength (Rp0.2) of an 8.8 grade steel bolt?',
            optionsTr: ['640 MPa', '800 MPa', '400 MPa', '880 MPa'],
            optionsEn: ['640 MPa', '800 MPa', '400 MPa', '880 MPa'],
            correctIndex: 0,
            explanationTr: 'Doğru! 8 x 100 = 800 MPa çekme dayanımı; 800 x 0.8 = 640 MPa akma dayanımıdır.',
            explanationEn: 'Correct! 8 x 100 = 800 MPa ultimate strength; 800 x 0.8 = 640 MPa yield strength.'
          },
          {
            type: 'match_pairs',
            titleTr: 'Birim ve Terimleri Eşleştir',
            titleEn: 'Match Terms and Units',
            pairsTr: [
              { left: 'Sıkma Torku (T)', right: 'N·m' },
              { left: 'Ön Gerilme (FM)', right: 'kN (Kilonewton)' },
              { left: 'Gerilme Kesit Alanı (As)', right: 'mm²' }
            ],
            pairsEn: [
              { left: 'Tightening Torque (T)', right: 'N·m' },
              { left: 'Preload Force (FM)', right: 'kN' },
              { left: 'Stress Area (As)', right: 'mm²' }
            ]
          }
        ]
      },
      {
        id: 'lesson-2',
        slug: 'steel-bolt-grades-iso898',
        number: 2,
        titleTr: 'Çelik Cıvata Dayanım Sınıfları (ISO 898-1)',
        titleEn: 'Steel Bolt Property Classes (ISO 898-1)',
        standard: 'ISO 898-1',
        category: 'Bağlantı Elemanları',
        iconName: 'ShieldCheck',
        xpReward: 30,
        steps: [
          {
            type: 'concept',
            titleTr: 'ISO 898-1 Kodlama Sistemi',
            titleEn: 'ISO 898-1 Designation System',
            conceptTr: 'Metrik cıvatalarda kalite sınıfı (8.8, 10.9, 12.9) iki sayı ile gösterilir. İlk sayı x 100 nominal çekme dayanımını (Rm), ikinci sayı ise akma/çekme oranını verir.',
            conceptEn: 'Bolt classes (8.8, 10.9, 12.9) define nominal tensile strength (Rm) and yield ratio.',
            formula: 'R_m = 100 \\times \\text{İlk Sayı}, \\quad R_{p0.2} = R_m \\times (0.1 \\times \\text{İkinci Sayı})'
          },
          {
            type: 'multiple_choice',
            titleTr: 'Soru 1',
            titleEn: 'Question 1',
            questionTr: '10.9 kalite bir cıvatanın minimum çekme dayanımı (Rm) nedir?',
            questionEn: 'What is the minimum tensile strength (Rm) of a 10.9 grade bolt?',
            optionsTr: ['900 MPa', '1000 MPa', '1090 MPa', '1200 MPa'],
            optionsEn: ['900 MPa', '1000 MPa', '1090 MPa', '1200 MPa'],
            correctIndex: 1,
            explanationTr: 'Doğru! 10 x 100 = 1000 MPa nominal çekme dayanımıdır.',
            explanationEn: 'Correct! 10 x 100 = 1000 MPa nominal tensile strength.'
          },
          {
            type: 'multiple_choice',
            titleTr: 'Soru 2',
            titleEn: 'Question 2',
            questionTr: 'VDI 2230\'a göre montaj sırasında izin verilen maksimum akma kullanım oranı:',
            questionEn: 'According to VDI 2230, maximum assembly yield utilization is:',
            optionsTr: ['%50', '%75', '%90 (0.90)', '%110'],
            optionsEn: ['50%', '75%', '90% (0.90)', '110%'],
            correctIndex: 2,
            explanationTr: 'Doğru! Kalıcı plastik deformasyonu önlemek için montaj gerilmesi akma sınırının %90\'ı ile sınırlandırılır.',
            explanationEn: 'Correct! Assembly stress is capped at 90% of yield strength to prevent plastic deformation.'
          }
        ]
      },
      {
        id: 'lesson-3',
        slug: 'statics-free-body-diagrams',
        number: 3,
        titleTr: 'Serbest Cisim Diyagramı & Statik Denge',
        titleEn: 'Free Body Diagrams & Static Equilibrium',
        standard: 'Newton / Euler',
        category: 'Statik & Mukavemet',
        iconName: 'Compass',
        xpReward: 30,
        steps: [
          {
            type: 'concept',
            titleTr: 'Statik Dengenin 3 Temel Şartı',
            titleEn: '3 Equilibrium Conditions in 2D',
            conceptTr: 'Hareketsiz bir mekanik sistemde tüm kuvvetlerin vektörel toplamı ve herhangi bir noktaya göre momentlerin toplamı sıfır olmak zorundadır.',
            conceptEn: 'In a static body, the sum of all forces and moments about any reference point must equal zero.',
            formula: '\\sum F_x = 0, \\quad \\sum F_y = 0, \\quad \\sum M_O = 0'
          },
          {
            type: 'multiple_choice',
            titleTr: 'Soru 1',
            titleEn: 'Question 1',
            questionTr: '2D düzlemde sabit bir mafsallı mesnet (pinned support) kaç adet tepki kuvveti üretir?',
            questionEn: 'How many reaction forces does a 2D pinned support generate?',
            optionsTr: ['1 (Yalnızca Düşey)', '2 (Yatay ve Düşey)', '3 (Yatay, Düşey ve Moment)', '0'],
            optionsEn: ['1 (Vertical only)', '2 (Horizontal & Vertical)', '3 (Fx, Fy, Moment)', '0'],
            correctIndex: 1,
            explanationTr: 'Doğru! Mafsallı mesnet x ve y yönünde ötelemeyi engeller (Fx, Fy), ancak serbest dönmeye izin verir.',
            explanationEn: 'Correct! Pinned supports prevent X and Y translation but allow rotation.'
          }
        ]
      }
    ]
  },

  // ─── BÖLÜM 2 ───
  {
    id: 'section-2',
    number: 2,
    titleTr: 'Bölüm 2: Döner Ekipmanlar, Rulmanlar & Dişliler',
    titleEn: 'Section 2: Rotating Machinery, Bearings & Gears',
    descriptionTr: 'ISO 281 L10 rulman ömrü, ISO 6336 dişli mukavemeti ve DIN 743 mil boyutlandırma.',
    descriptionEn: 'ISO 281 L10 bearing fatigue life, ISO 6336 gear durability, and DIN 743 shaft sizing.',
    gradient: 'from-blue-600 to-indigo-600',
    lessons: [
      {
        id: 'lesson-4',
        slug: 'bearing-life-iso281',
        number: 4,
        titleTr: 'Rulman L10 Yorulma Ömrü (ISO 281)',
        titleEn: 'Bearing L10 Fatigue Life (ISO 281)',
        standard: 'ISO 281:2007',
        category: 'Makine Elemanları',
        iconName: 'CircleDot',
        xpReward: 35,
        steps: [
          {
            type: 'concept',
            titleTr: 'L10 Temel Anma Ömrü Formülü',
            titleEn: 'L10 Basic Rating Life Formula',
            conceptTr: 'L10 ömrü, aynı şartlarda çalışan özdeş rulmanların %90\'ının malzeme yorulması olmadan tamamlayacağı milyon devir cinsinden çalışma ömrüdür. Bilyalı rulmanlar için p=3, makaralı rulmanlar için p=10/3 alınır.',
            conceptEn: 'L10 represents the life in million revolutions that 90% of identical bearings will achieve without metal fatigue.',
            formula: 'L_{10} = \\left( \\frac{C}{P} \\right)^p \\times 10^6 \\text{ devir}, \\quad L_{10h} = \\frac{10^6 L_{10}}{60 n}'
          },
          {
            type: 'multiple_choice',
            titleTr: 'Soru 1',
            titleEn: 'Question 1',
            questionTr: 'Rulmana uygulanan dinamik yük (P) iki katına çıkarsa, bilyalı bir rulmanın (p=3) ömrü nasıl değişir?',
            questionEn: 'If the equivalent load (P) on a ball bearing (p=3) is doubled, how does fatigue life change?',
            optionsTr: ['Yarıya iner (1/2)', '4 katına iner (1/4)', '8 katına iner (1/8)', 'Değişmez'],
            optionsEn: ['Halved (1/2)', 'Quartered (1/4)', 'Drops by 8x (1/8)', 'No change'],
            correctIndex: 2,
            explanationTr: 'Doğru! Formülde (1/2)³ = 1/8 olduğundan ömür tam 8 kat azalır!',
            explanationEn: 'Correct! (1/2)^3 = 1/8, so life is reduced by a factor of 8.'
          },
          {
            type: 'match_pairs',
            titleTr: 'Rulman Tipleri ve Üsleri',
            titleEn: 'Bearing Types and Exponents',
            pairsTr: [
              { left: 'Bilyalı Rulman (Ball Bearing)', right: 'p = 3' },
              { left: 'Makaralı Rulman (Roller Bearing)', right: 'p = 10/3 (3.33)' },
              { left: 'Dinamik Yük Sayısı', right: 'C (kN)' }
            ],
            pairsEn: [
              { left: 'Ball Bearing', right: 'p = 3' },
              { left: 'Roller Bearing', right: 'p = 10/3 (3.33)' },
              { left: 'Dynamic Load Rating', right: 'C (kN)' }
            ]
          }
        ]
      },
      {
        id: 'lesson-5',
        slug: 'gear-design-iso6336',
        number: 5,
        titleTr: 'Düz Dişli Mukavemeti (ISO 6336)',
        titleEn: 'Spur Gear Strength (ISO 6336)',
        standard: 'ISO 6336',
        category: 'Makine Elemanları',
        iconName: 'Cog',
        xpReward: 35,
        steps: [
          {
            type: 'concept',
            titleTr: 'Diş Dibi Eğilme & Yüzey Basıncı',
            titleEn: 'Tooth Root Bending & Surface Durability',
            conceptTr: 'Dişlilerde iki ana hasar kriteri vardır: Diş dibi kırılması (Lewis/ISO eğilme gerilmesi σF) ve diş yüzeyi çukurlaşması/pitting (Hertz temas gerilmesi σH).',
            conceptEn: 'Gears are limited by tooth root bending fatigue (σF) and flank pitting (Hertzian contact stress σH).',
            formula: '\\sigma_F = \\frac{F_t}{b \\cdot m_n} Y_F Y_S Y_\\beta \\le \\sigma_{FP}'
          },
          {
            type: 'multiple_choice',
            titleTr: 'Soru 1',
            titleEn: 'Question 1',
            questionTr: 'Modülü m = 3 mm ve diş sayısı z = 30 olan düz bir dişlinin bölüm dairesi çapı (d) kaç mm\'dir?',
            questionEn: 'What is the pitch diameter (d) of a spur gear with module m = 3 mm and z = 30 teeth?',
            optionsTr: ['30 mm', '60 mm', '90 mm', '100 mm'],
            optionsEn: ['30 mm', '60 mm', '90 mm', '100 mm'],
            correctIndex: 2,
            explanationTr: 'Doğru! Bölüm dairesi çapı d = m x z = 3 x 30 = 90 mm\'dir.',
            explanationEn: 'Correct! Pitch diameter d = m * z = 3 * 30 = 90 mm.'
          }
        ]
      }
    ]
  },

  // ─── BÖLÜM 3 ───
  {
    id: 'section-3',
    number: 3,
    titleTr: 'Bölüm 3: Kirişler, Sehim, Gerilme & Kolonlar',
    titleEn: 'Section 3: Beams, Deflection, Stress & Columns',
    descriptionTr: 'Euler-Bernoulli sehim formülleri, Mohr çemberi asal gerilmeleri ve Euler burkulması.',
    descriptionEn: 'Euler-Bernoulli beam deflection, Mohr circle principal stresses, and Euler column buckling.',
    gradient: 'from-emerald-500 to-teal-600',
    lessons: [
      {
        id: 'lesson-6',
        slug: 'beam-deflection-euler-bernoulli',
        number: 6,
        titleTr: 'Kiriş Sehim & Moment Analizi (Euler-Bernoulli)',
        titleEn: 'Beam Deflection Analysis (Euler-Bernoulli)',
        standard: 'Euler-Bernoulli',
        category: 'Mukavemet & Yapısal',
        iconName: 'Layers',
        xpReward: 35,
        steps: [
          {
            type: 'concept',
            titleTr: 'Eğilme Sehim İlişkisi',
            titleEn: 'Governing Deflection Formula',
            conceptTr: 'Basit mesnetli bir kirişin ortasında tekil bir F yükü olduğunda, maksimum sehim açıklığın küpüyle (L³) doğru, profil atalet momenti (I) ve elastisite modülü (E) ile ters orantılıdır.',
            conceptEn: 'For a simply supported beam with center point load F, maximum deflection scales with L³ and is inversely proportional to E*I.',
            formula: 'w_{\\max} = \\frac{F \\cdot L^3}{48 E \\cdot I}, \\quad M_{\\max} = \\frac{F \\cdot L}{4}'
          },
          {
            type: 'multiple_choice',
            titleTr: 'Soru 1',
            titleEn: 'Question 1',
            questionTr: 'Kiriş açıklığı (L) iki katına çıkarılırsa, aynı yük altındaki sehim (w_max) kaç katına çıkar?',
            questionEn: 'If the beam span length (L) is doubled, by what factor does the maximum deflection increase?',
            optionsTr: ['2 katına', '4 katına', '8 katına (2³)', '16 katına'],
            optionsEn: ['2x', '4x', '8x (2³)', '16x'],
            correctIndex: 2,
            explanationTr: 'Doğru! Formülde L³ terimi olduğundan 2³ = 8 katına çıkar!',
            explanationEn: 'Correct! Due to the L³ term, deflection increases by 2³ = 8x.'
          }
        ]
      },
      {
        id: 'lesson-7',
        slug: 'euler-column-buckling',
        number: 7,
        titleTr: 'Kolon Burkulması ve Kritik Yük (Euler)',
        titleEn: 'Column Buckling & Critical Load (Euler)',
        standard: 'Euler / DIN EN 1993',
        category: 'Mukavemet & Yapısal',
        iconName: 'Activity',
        xpReward: 35,
        steps: [
          {
            type: 'concept',
            titleTr: 'Euler Kritik Burkulma Yükü',
            titleEn: 'Euler Critical Buckling Load',
            conceptTr: 'Bası altındaki ince ve uzun elemanlar doğrudan malzeme akma sınırına ulaşmadan ani elastik kararsızlık (burkulma) ile göçer. Mesnet tipi (K katsayısı) taşıma kapasitesini radikal şekilde değiştirir.',
            conceptEn: 'Slender compressive columns fail by elastic instability before yielding. Boundary condition factor K strongly dictates critical load.',
            formula: 'P_{cr} = \\frac{\\pi^2 E \\cdot I}{(K \\cdot L)^2}'
          },
          {
            type: 'multiple_choice',
            titleTr: 'Soru 1',
            titleEn: 'Question 1',
            questionTr: 'İki ucu da ankastre (tam rijit) bağlı bir kolonun etkin boy katsayısı (K) nedir?',
            questionEn: 'What is the effective length factor (K) for a column fixed at both ends?',
            optionsTr: ['K = 1.0', 'K = 0.5', 'K = 0.7', 'K = 2.0'],
            optionsEn: ['K = 1.0', 'K = 0.5', 'K = 0.7', 'K = 2.0'],
            correctIndex: 1,
            explanationTr: 'Doğru! İki uçtan ankastre kolonda K = 0.5 olup kritik burkulma yükü mafsallı kolona göre 4 kat daha yüksektir!',
            explanationEn: 'Correct! For fixed-fixed ends, K = 0.5, quadrupling the critical load.'
          }
        ]
      }
    ]
  },

  // ─── BÖLÜM 4 ───
  {
    id: 'section-4',
    number: 4,
    titleTr: 'Bölüm 4: İmalat, Sac Büküm & FEA Analizi',
    titleEn: 'Section 4: Sheet Metal, Manufacturing & FEA',
    descriptionTr: 'DIN 6935 sac büküm açınımı, K-faktörü ve Von Mises eşdeğer gerilme kriteri.',
    descriptionEn: 'DIN 6935 sheet metal bend allowance, K-factor, and Von Mises yield criterion.',
    gradient: 'from-amber-500 to-rose-600',
    lessons: [
      {
        id: 'lesson-8',
        slug: 'sheet-metal-bending-din6935',
        number: 8,
        titleTr: 'Sac Büküm & K-Faktörü Açınımı (DIN 6935)',
        titleEn: 'Sheet Metal Bending & K-Factor (DIN 6935)',
        standard: 'DIN 6935',
        category: 'İmalat & CAD',
        iconName: 'Layers',
        xpReward: 35,
        steps: [
          {
            type: 'concept',
            titleTr: 'Nötr Eksen ve K-Faktörü',
            titleEn: 'Neutral Axis & K-Factor',
            conceptTr: 'Sac büküldüğünde dış yüzey çekmeye, iç yüzey basıya maruz kalır. Boyu değişmeyen nötr eksenin malzeme kalınlığı içindeki konum oranına K-faktörü denir (genellikle 0.33 - 0.45 arasıdır).',
            conceptEn: 'During bending, the outer surface stretches while the inner surface compresses. The neutral axis position ratio is the K-factor.',
            formula: 'BA = \\frac{\\pi \\cdot \\alpha}{180} \\left( R_i + K \\cdot t \\right)'
          },
          {
            type: 'multiple_choice',
            titleTr: 'Soru 1',
            titleEn: 'Question 1',
            questionTr: 'K-faktörü standart hava bükümünde (air bending) tipik olarak hangi aralıktadır?',
            questionEn: 'What is the typical K-factor range in standard sheet air bending?',
            optionsTr: ['0.10 - 0.20', '0.33 - 0.45', '0.75 - 0.90', '1.00'],
            optionsEn: ['0.10 - 0.20', '0.33 - 0.45', '0.75 - 0.90', '1.00'],
            correctIndex: 1,
            explanationTr: 'Doğru! Standart sac hava bükümlerinde K-faktörü malzeme türüne göre 0.33 ile 0.45 arasında kabul edilir.',
            explanationEn: 'Correct! In standard air bending, the K-factor typically ranges between 0.33 and 0.45.'
          }
        ]
      }
    ]
  }
];
