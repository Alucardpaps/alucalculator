/**
 * 🦉 ALUCALC DUOLINGO ENGINEERING CURRICULUM — 100 SECTIONS (10 MASTER UNITS x 10 LESSONS)
 * 
 * Comprehensive, verified mechanical engineering curriculum with strict difficulty tiers:
 * - Unit 1 (1-10): Fundamentals of Statics, SI Units & Stresses (🟢 Beginner)
 * - Unit 2 (11-20): Bolted Joints & VDI 2230 Norm (🟡 Intermediate)
 * - Unit 3 (21-30): Bearings, Tribology & ISO 281 Fatigue (🟡 Intermediate)
 * - Unit 4 (31-40): Gear Mechanisms & ISO 6336 Design (🟡-🔴 Advanced)
 * - Unit 5 (41-50): Shafts, Keys & DIN 743 Sizing (🔴 Advanced)
 * - Unit 6 (51-60): Beams, Deflection & Advanced Strength (🔴 Advanced)
 * - Unit 7 (61-70): Elastic Instability & Column Buckling (🔴-🔥 Expert)
 * - Unit 8 (71-80): Sheet Metal, Bending DIN 6935 & Manufacturing (🔥 Expert)
 * - Unit 9 (81-90): Thermodynamics, Fluid Mechanics & Heat Transfer (🔥 Expert)
 * - Unit 10 (91-100): ADVANCED FEA, MULTI-AXIAL FATIGUE & EXTREME ENGINEERING (💀 EXTREME HARD)
 */

import { Language } from '@/store/i18nStore';

export type DifficultyLevel = 'easy' | 'medium' | 'hard' | 'expert' | 'extreme';

export interface DuolingoLessonStep {
  type: 'concept' | 'multiple_choice' | 'match_pairs';
  titleTr: string;
  titleEn: string;
  conceptTr?: string;
  conceptEn?: string;
  formula?: string;
  questionTr?: string;
  questionEn?: string;
  optionsTr?: string[];
  optionsEn?: string[];
  correctIndex?: number;
  explanationTr?: string;
  explanationEn?: string;
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
  difficulty: DifficultyLevel;
  iconName: string;
  xpReward: number;
  isBoss?: boolean;
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
  difficulty: DifficultyLevel;
  accentColor: string;
  lessons: DuolingoLesson[];
}

// ════════════════════════════════════════════════════════════════════════
// 10 MASTER UNITS WITH 10 DETAILED LESSONS EACH (100 TOTAL SECTIONS)
// ════════════════════════════════════════════════════════════════════════
export const DUOLINGO_100_SECTIONS: DuolingoSection[] = [
  // ─── ÜNİTE 1 (1 - 10): STATİK & TEMEL MEKANİK ───
  {
    id: 'unit-1',
    number: 1,
    titleTr: 'Ünite 1: Temel Mekanik, Statik & Birimler',
    titleEn: 'Unit 1: Fundamentals of Statics & SI Units',
    descriptionTr: 'Birim dönüşümleri, serbest cisim diyagramı, mesnet tepkileri ve atalet momentleri.',
    descriptionEn: 'Unit conversions, free body diagrams, support reactions, and area moment of inertia.',
    gradient: 'from-cyan-500 to-blue-600',
    difficulty: 'easy',
    accentColor: '#00e5ff',
    lessons: [
      {
        id: 'l-1',
        slug: 'si-units-and-stress-conversions',
        number: 1,
        titleTr: '1. SI Birim Sistemleri & Gerilme Dönüşümleri',
        titleEn: '1. SI Units & Stress Conversions',
        standard: 'ISO 80000-1',
        category: 'Temel Mekanik',
        difficulty: 'easy',
        iconName: 'Compass',
        xpReward: 25,
        steps: [
          {
            type: 'concept',
            titleTr: 'Gerilme ve Basınç Birimleri',
            titleEn: 'Stress and Pressure Units',
            conceptTr: 'Mekanik mühendisliğinde standart gerilme birimi Pascal\'dır (Pa = N/m²). Pratikte 1 MegaPascal (1 MPa = 10⁶ Pa), tam olarak 1 N/mm² değerine eşittir.',
            conceptEn: 'In mechanical engineering, the SI unit of stress is Pascal (Pa = N/m²). In practice, 1 MegaPascal (1 MPa) is exactly equal to 1 N/mm².',
            formula: '1 \\text{ MPa} = 10^6 \\text{ Pa} = 1 \\frac{\\text{N}}{\\text{mm}^2} = 10 \\text{ bar}'
          },
          {
            type: 'multiple_choice',
            titleTr: 'Soru 1',
            titleEn: 'Question 1',
            questionTr: '250 N/mm² değerindeki bir çekme gerilmesi kaç MPa\'a eşittir?',
            questionEn: 'How many MPa is a tensile stress of 250 N/mm² equal to?',
            optionsTr: ['25 MPa', '250 MPa', '2500 MPa', '0.25 MPa'],
            optionsEn: ['25 MPa', '250 MPa', '2500 MPa', '0.25 MPa'],
            correctIndex: 1,
            explanationTr: 'Doğru! 1 N/mm² = 1 MPa olduğundan, 250 N/mm² doğrudan 250 MPa\'dır.',
            explanationEn: 'Correct! Since 1 N/mm² = 1 MPa, 250 N/mm² is exactly 250 MPa.'
          },
          {
            type: 'match_pairs',
            titleTr: 'Birimleri Eşleştir',
            titleEn: 'Match Units',
            pairsTr: [
              { left: '1 MPa', right: '1 N/mm²' },
              { left: '1 bar', right: '0.1 MPa (100 kPa)' },
              { left: '1 kN', right: '1000 N' }
            ],
            pairsEn: [
              { left: '1 MPa', right: '1 N/mm²' },
              { left: '1 bar', right: '0.1 MPa (100 kPa)' },
              { left: '1 kN', right: '1000 N' }
            ]
          }
        ]
      },
      {
        id: 'l-2',
        slug: 'free-body-diagrams-and-equilibrium',
        number: 2,
        titleTr: '2. Serbest Cisim Diyagramı & Denge',
        titleEn: '2. Free Body Diagrams & Equilibrium',
        standard: 'Newtonian Statics',
        category: 'Statik',
        difficulty: 'easy',
        iconName: 'Compass',
        xpReward: 25,
        steps: [
          {
            type: 'concept',
            titleTr: '2D Statik Denge Denklemleri',
            titleEn: '2D Static Equilibrium Equations',
            conceptTr: 'Durgun bir rijit cismin dengede kalması için x ve y eksenlerindeki net kuvvetlerin toplamı ile herhangi bir referans noktasına göre toplam moment sıfır olmalıdır.',
            conceptEn: 'For a rigid body to remain in static equilibrium, net forces in X and Y, plus the net moment about any pivot, must equal zero.',
            formula: '\\sum F_x = 0, \\quad \\sum F_y = 0, \\quad \\sum M_O = 0'
          },
          {
            type: 'multiple_choice',
            titleTr: 'Soru 1',
            titleEn: 'Question 1',
            questionTr: 'Bir noktaya 100 N sağa ve 100 N sola zıt kuvvet uygulanırsa net yatay kuvvet ne olur?',
            questionEn: 'If 100 N right and 100 N left forces are applied at a point, what is the net horizontal force?',
            optionsTr: ['200 N', '100 N', '0 N (Denge)', '-100 N'],
            optionsEn: ['200 N', '100 N', '0 N (Equilibrium)', '-100 N'],
            correctIndex: 2,
            explanationTr: 'Doğru! Zıt yönlü eşit kuvvetler birbirini sıfırlar (ΣFx = 100 - 100 = 0 N).',
            explanationEn: 'Correct! Opposing equal forces cancel out (ΣFx = 0 N).'
          }
        ]
      },
      {
        id: 'l-3',
        slug: 'support-reactions-and-degrees-of-freedom',
        number: 3,
        titleTr: '3. Mesnet Tepkileri & Serbestlik Dereceleri',
        titleEn: '3. Support Reactions & DOF',
        standard: 'ISO Statics',
        category: 'Statik',
        difficulty: 'easy',
        iconName: 'Layers',
        xpReward: 25,
        steps: [
          {
            type: 'concept',
            titleTr: 'Mesnet Tipleri ve Tepki Kuvvetleri',
            titleEn: 'Support Types and Reaction Forces',
            conceptTr: 'Kayar mesnet (roller) 1 tepki (düşey Fy), sabit mafsallı mesnet (pin) 2 tepki (Fx, Fy), ankastre mesnet (fixed) ise 3 tepki (Fx, Fy ve ankastrelik momenti M) üretir.',
            conceptEn: 'Roller supports generate 1 reaction (Fy), pinned supports 2 (Fx, Fy), and fixed supports 3 (Fx, Fy, and moment M).',
            formula: '\\text{Fixed Support: } R_x, R_y, M_z'
          },
          {
            type: 'multiple_choice',
            titleTr: 'Soru 1',
            titleEn: 'Question 1',
            questionTr: 'Duvara gömülü ankastre bir kiriş mesnedi kaç adet bağımsız tepki kuvveti ve momenti üretir?',
            questionEn: 'How many independent reaction forces and moments does a fixed wall support produce?',
            optionsTr: ['1', '2', '3 (Fx, Fy, Mz)', '0'],
            optionsEn: ['1', '2', '3 (Fx, Fy, Mz)', '0'],
            correctIndex: 2,
            explanationTr: 'Doğru! Ankastre mesnet dönmeyi ve her iki yönde ötelemeyi engellediğinden 3 tepki üretir.',
            explanationEn: 'Correct! Fixed supports restrict translation in X, Y and rotation, creating 3 reactions.'
          }
        ]
      },
      {
        id: 'l-4',
        slug: 'centroid-and-cross-section-area',
        number: 4,
        titleTr: '4. Ağırlık Merkezi & Kesit Alanı',
        titleEn: '4. Centroid & Cross-Section Area',
        standard: 'ISO Geometric',
        category: 'Mukavemet',
        difficulty: 'easy',
        iconName: 'Compass',
        xpReward: 25,
        steps: [
          {
            type: 'concept',
            titleTr: 'Bileşik Kesitlerde Ağırlık Merkezi',
            titleEn: 'Centroid of Composite Cross-Sections',
            conceptTr: 'Farklı geometrilerden oluşan karmaşık bir profilin ağırlık merkezi, alt parçaların alanları ile ağırlık merkezlerinin çarpımının toplam alana bölünmesiyle bulunur.',
            conceptEn: 'The centroid of a composite section is found by dividing the first moment of area by the total cross-sectional area.',
            formula: '\\bar{y} = \\frac{\\sum A_i \\cdot y_i}{\\sum A_i}'
          },
          {
            type: 'multiple_choice',
            titleTr: 'Soru 1',
            titleEn: 'Question 1',
            questionTr: 'Genişliği b=40 mm ve yüksekliği h=80 mm olan dikdörtgen kesitin tabana göre ağırlık merkezi nerededir?',
            questionEn: 'Where is the centroid of a rectangle with width b=40 mm and height h=80 mm relative to its base?',
            optionsTr: ['y = 20 mm', 'y = 40 mm (h/2)', 'y = 80 mm', 'y = 60 mm'],
            optionsEn: ['y = 20 mm', 'y = 40 mm (h/2)', 'y = 80 mm', 'y = 60 mm'],
            correctIndex: 1,
            explanationTr: 'Doğru! Simetrik dikdörtgende ağırlık merkezi tam ortadadır (h/2 = 80/2 = 40 mm).',
            explanationEn: 'Correct! For a symmetric rectangle, centroid is at h/2 = 40 mm.'
          }
        ]
      },
      {
        id: 'l-5',
        slug: 'second-moment-of-area-inertia',
        number: 5,
        titleTr: '5. Alan Eylemsizlik Momenti (Atalet Momenti Ix)',
        titleEn: '5. Second Moment of Area (Inertia Ix)',
        standard: 'Euler-Bernoulli',
        category: 'Mukavemet',
        difficulty: 'medium',
        iconName: 'Layers',
        xpReward: 30,
        steps: [
          {
            type: 'concept',
            titleTr: 'Dikdörtgen Kesit Atalet Momenti',
            titleEn: 'Rectangular Moment of Inertia',
            conceptTr: 'Eğilmeye karşı direnci belirleyen atalet momenti, yüksekliğin küpüyle ($h^3$) orantılıdır. Yüksekliği 2 katına çıkarmak eğilme direncini tam 8 kat artırır!',
            conceptEn: 'Bending resistance scales with height cubed (h³). Doubling the height increases stiffness by 8 times!',
            formula: 'I_x = \\frac{b \\cdot h^3}{12}, \\quad I_y = \\frac{h \\cdot b^3}{12}'
          },
          {
            type: 'multiple_choice',
            titleTr: 'Soru 1',
            titleEn: 'Question 1',
            questionTr: 'b=10 mm, h=20 mm dikdörtgen profilin Ix atalet momenti nedir?',
            questionEn: 'What is the moment of inertia Ix for b=10 mm and h=20 mm?',
            optionsTr: ['6,667 mm⁴', '13,333 mm⁴', '8,000 mm⁴', '20,000 mm⁴'],
            optionsEn: ['6,667 mm⁴', '13,333 mm⁴', '8,000 mm⁴', '20,000 mm⁴'],
            correctIndex: 0,
            explanationTr: 'Doğru! Ix = (10 x 20³) / 12 = (10 x 8000) / 12 = 6666.67 mm⁴.',
            explanationEn: 'Correct! Ix = (10 * 20^3) / 12 = 6,666.67 mm⁴.'
          }
        ]
      },
      {
        id: 'l-6',
        slug: 'parallel-axis-theorem-steiner',
        number: 6,
        titleTr: '6. Paralel Eksen Teoremi (Steiner)',
        titleEn: '6. Parallel Axis Theorem (Steiner)',
        standard: 'ISO Mechanics',
        category: 'Mukavemet',
        difficulty: 'medium',
        iconName: 'Layers',
        xpReward: 30,
        steps: [
          {
            type: 'concept',
            titleTr: 'Steiner Kaydırma Kuralı',
            titleEn: 'Steiner Shift Formula',
            conceptTr: 'Kendi ağırlık merkezine paralel başka bir eksene göre atalet momenti, merkezcil atalet momentine alan çarpı mesafenin karesi ($A \\cdot d^2$) eklenerek hesaplanır.',
            conceptEn: 'Moment of inertia about a parallel axis equals centroidal inertia plus area times distance squared (A*d²).',
            formula: 'I_{x\'} = I_{xc} + A \\cdot d^2'
          },
          {
            type: 'multiple_choice',
            titleTr: 'Soru 1',
            titleEn: 'Question 1',
            questionTr: 'Alanı A=100 mm² olan bir parçanın ekseni d=10 mm kaydırılırsa Steiner ekleme terimi (A·d²) ne olur?',
            questionEn: 'If a component with area A=100 mm² is shifted by d=10 mm, what is the Steiner term (A*d²)?',
            optionsTr: ['1,000 mm⁴', '10,000 mm⁴', '100,000 mm⁴', '5,000 mm⁴'],
            optionsEn: ['1,000 mm⁴', '10,000 mm⁴', '100,000 mm⁴', '5,000 mm⁴'],
            correctIndex: 1,
            explanationTr: 'Doğru! A x d² = 100 x (10)² = 100 x 100 = 10,000 mm⁴.',
            explanationEn: 'Correct! A * d² = 100 * (10)^2 = 10,000 mm⁴.'
          }
        ]
      },
      {
        id: 'l-7',
        slug: 'section-modulus-and-elastic-bending',
        number: 7,
        titleTr: '7. Kesit Mukavemet Momenti (W)',
        titleEn: '7. Section Modulus (W)',
        standard: 'Euler-Bernoulli',
        category: 'Mukavemet',
        difficulty: 'medium',
        iconName: 'Layers',
        xpReward: 30,
        steps: [
          {
            type: 'concept',
            titleTr: 'Mukavemet Momenti ve Maksimum Gerilme',
            titleEn: 'Section Modulus and Peak Stress',
            conceptTr: 'Eğilme gerilmesini doğrudan hesaplamak için kesit mukavemet momenti $W = I / y_{max}$ kullanılır. Dikdörtgen kesitler için $W = b \\cdot h^2 / 6$\'dır.',
            conceptEn: 'To directly calculate maximum bending stress, section modulus W = I / y_max is used. For rectangles, W = b*h²/6.',
            formula: 'W_x = \\frac{b \\cdot h^2}{6}, \\quad \\sigma_{\\max} = \\frac{M}{W_x}'
          },
          {
            type: 'multiple_choice',
            titleTr: 'Soru 1',
            titleEn: 'Question 1',
            questionTr: 'M = 60,000 N·mm eğilme momenti altında W = 600 mm³ olan profilde maksimum gerilme kaç MPa olur?',
            questionEn: 'Under bending moment M = 60,000 N·mm and W = 600 mm³, what is the peak stress in MPa?',
            optionsTr: ['10 MPa', '100 MPa', '1000 MPa', '60 MPa'],
            optionsEn: ['10 MPa', '100 MPa', '1000 MPa', '60 MPa'],
            correctIndex: 1,
            explanationTr: 'Doğru! σ = M / W = 60,000 / 600 = 100 N/mm² (100 MPa).',
            explanationEn: 'Correct! σ = M / W = 60,000 / 600 = 100 MPa.'
          }
        ]
      },
      {
        id: 'l-8',
        slug: 'fits-and-tolerances-iso286',
        number: 8,
        titleTr: '8. Toleranslar & Geçmeler (ISO 286)',
        titleEn: '8. Fits & Tolerances (ISO 286)',
        standard: 'ISO 286-1 / ISO 2768',
        category: 'İmalat',
        difficulty: 'medium',
        iconName: 'Wrench',
        xpReward: 30,
        steps: [
          {
            type: 'concept',
            titleTr: 'Delik ve Mil Geçme Sistemi',
            titleEn: 'Hole-Basis and Shaft-Basis Fits',
            conceptTr: 'Büyük harfler deliği (örn. H7), küçük harfler mili (örn. g6, h6, p6) simgeler. H7/g6 boşluklu döner geçme, H7/p6 ise presle sıkı geçmedir.',
            conceptEn: 'Capital letters denote holes (e.g. H7), lowercase denotes shafts (e.g. g6, p6). H7/g6 is clearance, H7/p6 is interference.',
            formula: '\\text{Clearance Fit: } D_{\\min} > d_{\\max}'
          },
          {
            type: 'multiple_choice',
            titleTr: 'Soru 1',
            titleEn: 'Question 1',
            questionTr: 'H7/p6 geçme toleransı hangi tür bir geçmeyi tanımlar?',
            questionEn: 'What type of fit does the H7/p6 tolerance pair represent?',
            optionsTr: ['Boşluklu Geçme', 'Sıkı (Pres) Geçme', 'Geçiş Geçmesi', 'Serbest Dönme'],
            optionsEn: ['Clearance Fit', 'Interference (Press) Fit', 'Transition Fit', 'Free Running'],
            correctIndex: 1,
            explanationTr: 'Doğru! \'p\' harfi milin delikten daha büyük olduğu sıkı/pres geçmeyi gösterir.',
            explanationEn: 'Correct! Letter \'p\' designates an interference fit where the shaft is larger than the hole.'
          }
        ]
      },
      {
        id: 'l-9',
        slug: 'tensile-testing-and-stress-strain',
        number: 9,
        titleTr: '9. Çekme Testi & Gerilme-Şekil Değişimi',
        titleEn: '9. Tensile Testing & Stress-Strain',
        standard: 'ISO 6892-1',
        category: 'Malzeme',
        difficulty: 'medium',
        iconName: 'Activity',
        xpReward: 30,
        steps: [
          {
            type: 'concept',
            titleTr: 'Elastik Bölge, Akma ve Çekme Dayanımı',
            titleEn: 'Elastic Region, Yield and Tensile Strength',
            conceptTr: 'Hooke Kanunu doğrusal elastik bölgede geçerlidir ($\sigma = E \cdot \epsilon$). Kalıcı deformasyonun başladığı nokta akma dayanımı ($R_{p0.2}$), kopmadan önceki maksimum gerilme ise çekme dayanımıdır ($R_m$).',
            conceptEn: 'Hooke\'s law applies in linear elastic regime (σ = E*ε). Yield strength (Rp0.2) marks plastic deformation onset.',
            formula: '\\sigma = E \\cdot \\varepsilon, \\quad R_{p0.2} \\le \\sigma_{allow}'
          },
          {
            type: 'multiple_choice',
            titleTr: 'Soru 1',
            titleEn: 'Question 1',
            questionTr: 'Alüminyum 6061-T6 için elastisite modülü (E) yaklaşık kaç GPa\'dır?',
            questionEn: 'What is the approximate Young\'s modulus (E) for Aluminum 6061-T6?',
            optionsTr: ['70 GPa', '210 GPa', '110 GPa', '45 GPa'],
            optionsEn: ['70 GPa', '210 GPa', '110 GPa', '45 GPa'],
            correctIndex: 0,
            explanationTr: 'Doğru! Alüminyumun elastisite modülü ~70 GPa iken çeliğinki ~210 GPa\'dır (çelik 3 kat daha rijittir).',
            explanationEn: 'Correct! Aluminum modulus is ~70 GPa, whereas steel is ~210 GPa (3x stiffer).'
          }
        ]
      },
      {
        id: 'l-10',
        slug: 'boss-statics-and-composite-frames',
        number: 10,
        titleTr: '10. 👑 BOSS SINAVI: Çok Mesnetli Sistem Çözümü',
        titleEn: '10. 👑 BOSS TEST: Multi-Support Frame Equilibrium',
        standard: 'Comprehensive Statics',
        category: 'Statik & Mukavemet',
        difficulty: 'hard',
        iconName: 'Trophy',
        isBoss: true,
        xpReward: 60,
        steps: [
          {
            type: 'concept',
            titleTr: 'Bileşik Çerçeve Statik Denetimi',
            titleEn: 'Composite Frame Equilibrium Check',
            conceptTr: 'Karmaşık 2D kafes ve çerçevelerde önce tüm sistemin dış mesnet tepkileri çözülmeli, ardından kesim yöntemi (method of sections) ile iç kuvvetler ayrıştırılmalıdır.',
            conceptEn: 'In 2D frames, first solve global reactions, then apply the method of sections to isolate internal member forces.',
            formula: '\\sum F_x = 0, \\quad \\sum F_y = 0, \\quad \\sum M_A = 0'
          },
          {
            type: 'multiple_choice',
            titleTr: 'Boss Sorusu',
            titleEn: 'Boss Question',
            questionTr: 'L=4m boyundaki basit mesnetli kirişe tam ortasından F=20 kN yük binerse, her iki mesnet tepkisi ne kadar olur?',
            questionEn: 'For a 4m simply supported beam loaded with 20 kN at midspan, what is each reaction force?',
            optionsTr: ['RA = 10 kN, RB = 10 kN', 'RA = 20 kN, RB = 0 kN', 'RA = 5 kN, RB = 15 kN', 'RA = 40 kN, RB = 40 kN'],
            optionsEn: ['RA = 10 kN, RB = 10 kN', 'RA = 20 kN, RB = 0 kN', 'RA = 5 kN, RB = 15 kN', 'RA = 40 kN, RB = 40 kN'],
            correctIndex: 0,
            explanationTr: 'Tebrikler! Simetrik yükleme nedeniyle 20 kN iki mesnede eşit dağılır (10 kN + 10 kN).',
            explanationEn: 'Congratulations! Due to symmetry, the 20 kN load is equally split into 10 kN + 10 kN.'
          }
        ]
      }
    ]
  },

  // ─── ÜNİTE 2 (11 - 20): CIVATALI BAĞLANTILAR & VDI 2230 ───
  {
    id: 'unit-2',
    number: 2,
    titleTr: 'Ünite 2: Cıvatalı Bağlantılar & VDI 2230',
    titleEn: 'Unit 2: Bolted Joints & VDI 2230 Standard',
    descriptionTr: 'Sıkma torku, sürtünme katsayıları, cıvata esnekliği ve yorulma güvenliği.',
    descriptionEn: 'Tightening torque, friction coefficients, joint resilience, and fatigue safety.',
    gradient: 'from-blue-600 to-indigo-600',
    difficulty: 'medium',
    accentColor: '#38bdf8',
    lessons: [
      {
        id: 'l-11',
        slug: 'kellermann-klein-torque-equation',
        number: 11,
        titleTr: '11. Kellermann-Klein Tork Denklemi',
        titleEn: '11. Kellermann-Klein Torque Equation',
        standard: 'VDI 2230',
        category: 'Bağlantı Elemanları',
        difficulty: 'medium',
        iconName: 'Wrench',
        xpReward: 30,
        steps: [
          {
            type: 'concept',
            titleTr: 'VDI 2230 Sıkma Torku Bileşenleri',
            titleEn: 'VDI 2230 Tightening Torque Components',
            conceptTr: 'Sıkma torku iki ana direnci yenmek için harcanır: Helisel diş sürtünmesi + kafa altı oturma yüzeyi sürtünmesi.',
            conceptEn: 'Tightening torque overcomes two main resistances: helical thread friction + underhead bearing friction.',
            formula: 'T = F_M \\left( \\frac{d_2}{2} \\tan(\\varphi + \\rho\') + \\frac{D_b}{2} \\mu_b \\right)'
          },
          {
            type: 'multiple_choice',
            titleTr: 'Soru 1',
            titleEn: 'Question 1',
            questionTr: 'Diş yüzeylerinin yağlanması (düşük sürtünme μ), aynı tork uygulandığında ön gerilme kuvvetini (FM) nasıl etkiler?',
            questionEn: 'How does lubricating bolt threads (lower friction μ) affect preload (FM) for the same applied torque?',
            optionsTr: ['Ön gerilmeyi önemli ölçüde artırır', 'Ön gerilmeyi azaltır', 'Değiştirmez', 'Cıvatayı gevşetir'],
            optionsEn: ['Significantly increases preload', 'Decreases preload', 'No effect', 'Loosens the bolt'],
            correctIndex: 0,
            explanationTr: 'Doğru! Sürtünme düştüğünde torkun daha büyük kısmı ön gerilmeye dönüşür.',
            explanationEn: 'Correct! Lower friction means a greater fraction of torque converts to axial preload.'
          }
        ]
      },
      {
        id: 'l-12',
        slug: 'friction-coefficients-in-fasteners',
        number: 12,
        titleTr: '12. Cıvata Sürtünme Katsayıları (μth, μb)',
        titleEn: '12. Fastener Friction Classes',
        standard: 'DIN EN ISO 16047',
        category: 'Bağlantı Elemanları',
        difficulty: 'medium',
        iconName: 'Wrench',
        xpReward: 30,
        steps: [
          {
            type: 'concept',
            titleTr: 'Sürtünme Katsayısı Sınıfları',
            titleEn: 'Friction Coefficient Classes',
            conceptTr: 'Yağlı çelik yüzeylerde μ ≈ 0.10 - 0.12 iken, kuru/fosfat kaplı yüzeylerde μ ≈ 0.15, paslanmaz çeliklerde ise yağsız durumda μ > 0.25 olup soğuk kaynama riski oluşur.',
            conceptEn: 'Lubricated steel has μ ≈ 0.10-0.12, dry steel μ ≈ 0.15, and dry stainless steel μ > 0.25 (risk of galling).',
            formula: '\\mu_{total} = \\frac{\\mu_{th} + \\mu_b}{2}'
          },
          {
            type: 'multiple_choice',
            titleTr: 'Soru 1',
            titleEn: 'Question 1',
            questionTr: 'Standart kuru çelik bir montajda sürtünme katsayısı tipik olarak hangi değerde kabul edilir?',
            questionEn: 'In a standard dry steel assembly, what friction coefficient is typically assumed?',
            optionsTr: ['0.05', '0.14 - 0.15', '0.40', '0.01'],
            optionsEn: ['0.05', '0.14 - 0.15', '0.40', '0.01'],
            correctIndex: 1,
            explanationTr: 'Doğru! Standart kuru çelik temaslarda μ = 0.14-0.15 referans alınır.',
            explanationEn: 'Correct! Dry as-received steel typically exhibits μ = 0.14-0.15.'
          }
        ]
      },
      {
        id: 'l-13',
        slug: 'steel-bolt-grades-iso898-1',
        number: 13,
        titleTr: '13. Çelik Cıvata Kaliteleri (8.8, 10.9, 12.9)',
        titleEn: '13. Bolt Property Classes (ISO 898-1)',
        standard: 'ISO 898-1',
        category: 'Bağlantı Elemanları',
        difficulty: 'medium',
        iconName: 'ShieldCheck',
        xpReward: 30,
        steps: [
          {
            type: 'concept',
            titleTr: 'ISO 898-1 Dayanım Hesaplama',
            titleEn: 'ISO 898-1 Strength Calculation',
            conceptTr: '12.9 kalite bir cıvata için: Çekme dayanımı $R_m = 12 \\times 100 = 1200$ MPa, akma dayanımı $R_{p0.2} = 1200 \\times 0.9 = 1080$ MPa\'dır.',
            conceptEn: 'For grade 12.9: Ultimate tensile strength Rm = 12*100 = 1200 MPa, yield strength Rp0.2 = 1200*0.9 = 1080 MPa.',
            formula: 'R_{p0.2} = R_m \\times 0.9 = 1080 \\text{ MPa (12.9)}'
          },
          {
            type: 'multiple_choice',
            titleTr: 'Soru 1',
            titleEn: 'Question 1',
            questionTr: '10.9 kalite bir cıvatanın akma dayanımı (Rp0.2) nedir?',
            questionEn: 'What is the yield strength (Rp0.2) of a grade 10.9 bolt?',
            optionsTr: ['900 MPa', '1000 MPa', '1090 MPa', '640 MPa'],
            optionsEn: ['900 MPa', '1000 MPa', '1090 MPa', '640 MPa'],
            correctIndex: 0,
            explanationTr: 'Doğru! 10 x 100 = 1000 MPa çekme; 1000 x 0.9 = 900 MPa akma dayanımıdır.',
            explanationEn: 'Correct! 10*100 = 1000 MPa tensile; 1000*0.9 = 900 MPa yield.'
          }
        ]
      },
      {
        id: 'l-14',
        slug: 'stainless-steel-bolts-iso3506',
        number: 14,
        titleTr: '14. Paslanmaz Cıvatalar (A2-70, A4-80)',
        titleEn: '14. Stainless Steel Bolts (ISO 3506)',
        standard: 'ISO 3506-1',
        category: 'Bağlantı Elemanları',
        difficulty: 'medium',
        iconName: 'ShieldCheck',
        xpReward: 30,
        steps: [
          {
            type: 'concept',
            titleTr: 'Östenitik Paslanmaz Cıvatalar',
            titleEn: 'Austenitic Stainless Fasteners',
            conceptTr: 'A2 (AISI 304) genel korozyon direnci sağlarken, A4 (AISI 316) molibden içeriğiyle deniz suyu ve asit ortamlarına dayanıklıdır. -70 eki 700 MPa çekme dayanımını belirtir.',
            conceptEn: 'A2 (304) is general stainless, A4 (316) resists marine/acids. Suffix -70 denotes 700 MPa tensile strength.',
            formula: 'A4\\text{-}80: R_m = 800 \\text{ MPa}, R_{p0.2} = 600 \\text{ MPa}'
          },
          {
            type: 'multiple_choice',
            titleTr: 'Soru 1',
            titleEn: 'Question 1',
            questionTr: 'A4-80 paslanmaz cıvatanın minimum çekme dayanımı (Rm) nedir?',
            questionEn: 'What is the minimum tensile strength (Rm) of an A4-80 stainless bolt?',
            optionsTr: ['400 MPa', '700 MPa', '800 MPa', '1000 MPa'],
            optionsEn: ['400 MPa', '700 MPa', '800 MPa', '1000 MPa'],
            correctIndex: 2,
            explanationTr: 'Doğru! 80 eki x 10 = 800 MPa çekme dayanımı anlamına gelir.',
            explanationEn: 'Correct! The 80 designation corresponds to 800 MPa tensile strength.'
          }
        ]
      },
      {
        id: 'l-15',
        slug: 'stress-area-and-nominal-stress',
        number: 15,
        titleTr: '15. Diş Gerilme Alanı (As) & Çekme Gerilmesi',
        titleEn: '15. Stress Area (As) & Tensile Stress',
        standard: 'ISO 898 / DIN 13',
        category: 'Bağlantı Elemanları',
        difficulty: 'medium',
        iconName: 'Wrench',
        xpReward: 30,
        steps: [
          {
            type: 'concept',
            titleTr: 'Diş Gerilme Kesit Alanı Formülü',
            titleEn: 'Tensile Stress Area Calculation',
            conceptTr: 'Dişli kısımda gerilme nominal gövde çapından değil, diş dibi ($d_3$) ve hatve çapının ($d_2$) ortalamasını alan $A_s$ gerilme kesit alanı üzerinden hesaplanır.',
            conceptEn: 'Stress in threads is computed using tensile stress area As, based on pitch diameter d2 and minor diameter d3.',
            formula: 'A_s = \\frac{\\pi}{4} \\left( \\frac{d_2 + d_3}{2} \\right)^2, \\quad \\sigma_0 = \\frac{F_M}{A_s}'
          },
          {
            type: 'multiple_choice',
            titleTr: 'Soru 1',
            titleEn: 'Question 1',
            questionTr: 'M12 cıvatanın standart gerilme kesit alanı (As) yaklaşık kaç mm²\'dir?',
            questionEn: 'What is the approximate tensile stress area (As) of an M12 bolt?',
            optionsTr: ['84.3 mm²', '113.1 mm²', '58.0 mm²', '157.0 mm²'],
            optionsEn: ['84.3 mm²', '113.1 mm²', '58.0 mm²', '157.0 mm²'],
            correctIndex: 0,
            explanationTr: 'Doğru! M12 standart diş gerilme alanı As = 84.3 mm²\'dir.',
            explanationEn: 'Correct! Standard M12 tensile stress area As is 84.3 mm².'
          }
        ]
      },
      {
        id: 'l-16',
        slug: 'joint-resilience-and-clamping-stiffness',
        number: 16,
        titleTr: '16. Cıvata ve Parça Esneklik Katsayıları',
        titleEn: '16. Bolt & Clamped Part Resilience',
        standard: 'VDI 2230',
        category: 'Bağlantı Elemanları',
        difficulty: 'hard',
        iconName: 'Layers',
        xpReward: 35,
        steps: [
          {
            type: 'concept',
            titleTr: 'Yay Sabitleri ve Deformasyon Konisi',
            titleEn: 'Joint Resilience and Clamping Cone',
            conceptTr: 'Cıvata bir gerilme yayı ($\delta_S$), sıkılan parçalar ise bası yayı ($\delta_P$) gibi davranır. Dış işletme yükünün cıvataya aktarılan payı $\Phi = \delta_P / (\delta_S + \delta_P)$ katsayısı ile belirlenir.',
            conceptEn: 'The bolt acts as a tensile spring (δS) and the clamped parts as a compressive spring (δP). Load ratio Φ = δP / (δS + δP).',
            formula: '\\Phi = \\frac{\\delta_P}{\\delta_S + \\delta_P} \\approx 0.15 - 0.30'
          },
          {
            type: 'multiple_choice',
            titleTr: 'Soru 1',
            titleEn: 'Question 1',
            questionTr: 'İdeal bir cıvatalı bağlantıda işletme yükünün cıvataya binen ek payı (Φ) neden düşük olmalıdır?',
            questionEn: 'Why is a low load factor (Φ) desirable in a preloaded bolted joint?',
            optionsTr: ['Cıvatanın çevrimsel yorulma genliğini düşürmek için', 'Torku sıfırlamak için', 'Sürtünmeyi artırmak için', 'Cıvatayı uzatmak için'],
            optionsEn: ['To minimize bolt cyclic fatigue amplitude', 'To zero out torque', 'To increase friction', 'To stretch the bolt'],
            correctIndex: 0,
            explanationTr: 'Doğru! Düşük Φ yük faktörü, cıvatanın dinamik yorulma gerilmesi genliğini minimize eder.',
            explanationEn: 'Correct! Low load factor minimizes dynamic fatigue stress amplitude in the bolt.'
          }
        ]
      },
      {
        id: 'l-17',
        slug: 'bolt-assembly-preload-utilization',
        number: 17,
        titleTr: '17. Montaj Ön Yükü & Akma Kullanımı (αA)',
        titleEn: '17. Assembly Preload & Yield Utilization',
        standard: 'VDI 2230',
        category: 'Bağlantı Elemanları',
        difficulty: 'hard',
        iconName: 'ShieldCheck',
        xpReward: 35,
        steps: [
          {
            type: 'concept',
            titleTr: 'Maksimum Akma Kullanım Sınırı',
            titleEn: 'Maximum Yield Utilization Limit',
            conceptTr: 'VDI 2230 uyarınca sıkma anında oluşan bileşik gerilme (çekme + burulma), cıvata malzemesi akma dayanımının %90\'ını ($\alpha_A \le 0.90$) aşmamalıdır.',
            conceptEn: 'Under VDI 2230, combined assembly stress (tension + torsion) must not exceed 90% of yield strength (αA ≤ 0.90).',
            formula: '\\sigma_{vM} = \\sqrt{\\sigma_0^2 + 3 \\tau_t^2} \\le 0.90 R_{p0.2}'
          },
          {
            type: 'multiple_choice',
            titleTr: 'Soru 1',
            titleEn: 'Question 1',
            questionTr: 'Sıkma sırasında oluşan burulma gerilmesi (τ) gevşeme sonrasında nereye gider?',
            questionEn: 'What happens to the torsional stress (τ) in a bolt after tightening tool release?',
            optionsTr: ['Kısmen elastik geri yaylanma ile rahatlar', 'İki katına çıkar', 'Ön gerilmeyi sıfırlar', 'Hiç değişmez'],
            optionsEn: ['Partially relaxes due to elastic springback', 'Doubles', 'Zeros the preload', 'Never changes'],
            correctIndex: 0,
            explanationTr: 'Doğru! Tork anahtarı çekildiğinde elastik geri yaylanma burulma gerilmesini yaklaşık %50 oranında rahatlatır.',
            explanationEn: 'Correct! Release of tightening tool allows partial elastic untwisting, reducing torsion by ~50%.'
          }
        ]
      },
      {
        id: 'l-18',
        slug: 'fatigue-strength-of-bolted-joints',
        number: 18,
        titleTr: '18. Cıvata Dinamik Yorulma Dayanımı',
        titleEn: '18. Dynamic Fatigue in Bolted Joints',
        standard: 'VDI 2230 / ISO 3800',
        category: 'Bağlantı Elemanları',
        difficulty: 'hard',
        iconName: 'Activity',
        xpReward: 35,
        steps: [
          {
            type: 'concept',
            titleTr: 'Yorulma Gerilme Genliği (σA)',
            titleEn: 'Fatigue Stress Amplitude',
            conceptTr: 'Cıvatalar statik ön yük altında yüksek gerilme taşır ancak dinamik gerilme genliği $\sigma_a = \\Phi \\cdot F_A / (2 A_s)$ çok küçük kaldığı için yorulmaya karşı dayanıklıdır.',
            conceptEn: 'Bolts carry high static preload, but dynamic stress amplitude σa is kept small by high joint clamping stiffness.',
            formula: '\\sigma_a = \\frac{\\Phi \\cdot F_A}{2 A_s} \\le \\sigma_{ASG}'
          },
          {
            type: 'multiple_choice',
            titleTr: 'Soru 1',
            titleEn: 'Question 1',
            questionTr: 'Yorulma hasarları cıvatanın en çok hangi bölgesinde başlar?',
            questionEn: 'Where do fatigue cracks most commonly initiate in a bolted joint?',
            optionsTr: ['Gövdenin tam ortasında', 'Kafa altı radyusu ve ilk kavrayan dişte', 'Somun dış yüzeyinde', 'Cıvata ucunda'],
            optionsEn: ['Mid-shank', 'Underhead fillet radius & first engaged thread', 'Nut outer hex', 'Bolt tip'],
            correctIndex: 1,
            explanationTr: 'Doğru! Gerilme yığılmasının en yüksek olduğu kafa altı radyusu ve ilk kavrayan diş kritik noktalardır.',
            explanationEn: 'Correct! Underhead fillet and first load-bearing thread exhibit highest stress concentration.'
          }
        ]
      },
      {
        id: 'l-19',
        slug: 'loosening-and-locking-mechanisms',
        number: 19,
        titleTr: '19. Kendiliğinden Gevşeme & Kilit Pulları',
        titleEn: '19. Self-Loosening & Wedge Washers',
        standard: 'DIN 65151 (Junker Test)',
        category: 'Bağlantı Elemanları',
        difficulty: 'hard',
        iconName: 'Wrench',
        xpReward: 35,
        steps: [
          {
            type: 'concept',
            titleTr: 'Junker Titreşim Testi ve Kamalı Pullar',
            titleEn: 'Junker Transverse Vibration and Nord-Lock',
            conceptTr: 'Enine dinamik titreşimler cıvatanın kendiliğinden gevşemesine yol açar. Nord-Lock kamalı pulları, kama açısının ($\alpha$) diş helis açısından ($\beta$) büyük olması sayesinde gevşemeyi mekanik olarak kilitler.',
            conceptEn: 'Transverse vibration causes self-loosening. Wedge lock washers prevent loosening because cam angle α exceeds thread pitch β.',
            formula: '\\alpha > \\beta \\implies \\text{Wedge Locking Active}'
          },
          {
            type: 'multiple_choice',
            titleTr: 'Soru 1',
            titleEn: 'Question 1',
            questionTr: 'Junker titreşim testinde en tehlikeli gevşeme nedeni hangi yöndeki titreşimdir?',
            questionEn: 'In the Junker vibration test, what vibration direction causes the most rapid loosening?',
            optionsTr: ['Eksenel (boyuna)', 'Enine (transverse) kayma titreşimi', 'Burulma titreşimi', 'Statik basınç'],
            optionsEn: ['Axial (longitudinal)', 'Transverse shear vibration', 'Torsional vibration', 'Static pressure'],
            correctIndex: 1,
            explanationTr: 'Doğru! Enine kayma titreşimi sürtünmeyi geçici olarak sıfırlayarak hızla gevşemeye yol açar.',
            explanationEn: 'Correct! Transverse cyclic shear overcomes friction and triggers rapid unwinding.'
          }
        ]
      },
      {
        id: 'l-20',
        slug: 'boss-vdi2230-flange-joint-verification',
        number: 20,
        titleTr: '20. 👑 BOSS SINAVI: VDI 2230 Flanş Bağlantı Analizi',
        titleEn: '20. 👑 BOSS TEST: Complete VDI 2230 Joint Verification',
        standard: 'VDI 2230 Full Verification',
        category: 'Bağlantı Elemanları',
        difficulty: 'hard',
        iconName: 'Trophy',
        isBoss: true,
        xpReward: 70,
        steps: [
          {
            type: 'concept',
            titleTr: 'Flanş Bağlantısında 4 Kritik Kontrol',
            titleEn: '4 Critical Checks in Flanged Joints',
            conceptTr: '1) Montaj akma kontrolü (αA ≤ 0.90), 2) İşletme akma kontrolü, 3) Parça yüzey ezilme kontrolü (p ≤ p_Grenz), 4) Açılma/sızdırmazlık emniyeti (FKQ ≥ 1.2).',
            conceptEn: '1) Assembly yield, 2) Operating stress, 3) Surface pressure under bolt head, 4) Flange separation safety.',
            formula: 'p = \\frac{F_{M\\max}}{A_p} \\le p_{Grenz}'
          },
          {
            type: 'multiple_choice',
            titleTr: 'Boss Sorusu',
            titleEn: 'Boss Question',
            questionTr: 'Yumuşak alüminyum gövdeye sıkılan 12.9 kalite çelik cıvatada en kritik hasar modu nedir?',
            questionEn: 'When clamping a soft aluminum housing with a grade 12.9 steel bolt, what is the primary failure risk?',
            optionsTr: ['Cıvatanın kopması', 'Alüminyum yüzeyin ezilmesi (gömülme)', 'Cıvatanın paslanması', 'Diş sıyırması'],
            optionsEn: ['Bolt tensile rupture', 'Underhead surface yielding/crushing in aluminum', 'Rusting', 'Thread stripping'],
            correctIndex: 1,
            explanationTr: 'Tebrikler! 12.9 cıvatanın yüksek ön yükü yumuşak alüminyumun sınır yüzey basıncını (p_Grenz ~280 MPa) aşarak gömülmeye ve gevşemeye yol açar!',
            explanationEn: 'Congratulations! Extreme clamp force crushes soft aluminum (p_limit ~280 MPa), causing embedding and loss of clamp load.'
          }
        ]
      }
    ]
  },

  // ─── ÜNİTE 3 (21 - 30): RULMANLAR & TRİBOLOJİ ───
  {
    id: 'unit-3',
    number: 3,
    titleTr: 'Ünite 3: Rulmanlar, Triboloji & ISO 281',
    titleEn: 'Unit 3: Bearings, Tribology & ISO 281 Life',
    descriptionTr: 'L10 yorulma ömrü, hız katsayıları, viskozite oranı ve rulman hasar modları.',
    descriptionEn: 'L10 fatigue life, speed factors, viscosity ratio, and bearing failure modes.',
    gradient: 'from-indigo-600 to-purple-600',
    difficulty: 'medium',
    accentColor: '#a855f7',
    lessons: [
      {
        id: 'l-21',
        slug: 'bearing-types-and-kinematics',
        number: 21,
        titleTr: '21. Rulman Tipleri ve Kinematik Seçim',
        titleEn: '21. Bearing Types & Kinematics',
        standard: 'ISO 15 / DIN 625',
        category: 'Rulmanlar',
        difficulty: 'medium',
        iconName: 'CircleDot',
        xpReward: 30,
        steps: [
          {
            type: 'concept',
            titleTr: 'Radyal ve Eksenel Yük Kapasiteleri',
            titleEn: 'Radial vs Axial Load Capacities',
            conceptTr: 'Sabit bilyalı rulmanlar saf radyal ve hafif eksenel yükler için uygundur. Ağır kombine yüklerde konik makaralı veya eğik bilyalı rulmanlar tercih edilir.',
            conceptEn: 'Deep groove ball bearings take radial and light axial loads. Tapered and angular contact bearings carry heavy combined loads.',
            formula: 'F_r \\text{ (Radial)}, \\quad F_a \\text{ (Axial)}'
          },
          {
            type: 'multiple_choice',
            titleTr: 'Soru 1',
            titleEn: 'Question 1',
            questionTr: 'Yüksek radyal ve tek yönlü yüksek eksenel yükün bir arada olduğu miller için hangi rulman uygundur?',
            questionEn: 'Which bearing is optimal for combined high radial and single-direction heavy axial load?',
            optionsTr: ['İğneli rulman', 'Konik makaralı rulman (Tapered roller)', 'Eksenel bilyalı rulman', 'Oynak bilyalı rulman'],
            optionsEn: ['Needle bearing', 'Tapered roller bearing', 'Thrust ball bearing', 'Self-aligning ball bearing'],
            correctIndex: 1,
            explanationTr: 'Doğru! Konik makaralı rulmanlar temas açısı sayesinde kombine radyal ve eksenel yükleri mükemmel taşır.',
            explanationEn: 'Correct! Tapered roller bearings handle heavy combined radial and thrust loads.'
          }
        ]
      },
      {
        id: 'l-22',
        slug: 'static-load-capacity-iso76',
        number: 22,
        titleTr: '22. Statik Yük Sayısı (C0) & ISO 76',
        titleEn: '22. Static Load Rating (C0) & ISO 76',
        standard: 'ISO 76',
        category: 'Rulmanlar',
        difficulty: 'medium',
        iconName: 'CircleDot',
        xpReward: 30,
        steps: [
          {
            type: 'concept',
            titleTr: 'Kalıcı Plastik Deformasyon Sınırı',
            titleEn: 'Permanent Contact Deformation Limit',
            conceptTr: 'Statik yük sayısı C0, en çok zorlanan yuvarlanma elemanı temas merkezinde 4000 MPa (bilyalı) veya 4600 MPa (makaralı) basınca ve $0.0001 \\cdot d_w$ kalıcı deformasyona karşılık gelen yüktür.',
            conceptEn: 'Static capacity C0 corresponds to contact stress of 4000-4600 MPa causing 0.0001*dw plastic indentation.',
            formula: 'S_0 = \\frac{C_0}{P_0} \\ge 1.5 \\text{ (Darbeli yüklerde } \\ge 2.5)'
          },
          {
            type: 'multiple_choice',
            titleTr: 'Soru 1',
            titleEn: 'Question 1',
            questionTr: 'Ağır darbeli çalışan bir makinede statik emniyet katsayısı S0 en az kaç seçilmelidir?',
            questionEn: 'In heavy shock load machinery, what minimum static safety factor S0 is recommended?',
            optionsTr: ['S0 ≥ 0.5', 'S0 ≥ 1.0', 'S0 ≥ 2.5 - 3.0', 'S0 = 0.1'],
            optionsEn: ['S0 ≥ 0.5', 'S0 ≥ 1.0', 'S0 ≥ 2.5 - 3.0', 'S0 = 0.1'],
            correctIndex: 2,
            explanationTr: 'Doğru! Darbeli yüklerde bilyaların yola batmasını önlemek için S0 ≥ 2.5-3.0 önerilir.',
            explanationEn: 'Correct! Heavy shock loads require S0 ≥ 2.5-3.0 to prevent raceway brinelling.'
          }
        ]
      },
      {
        id: 'l-23',
        slug: 'dynamic-load-rating-and-equivalent-load',
        number: 23,
        titleTr: '23. Dinamik Eşdeğer Yük (P) & ISO 281',
        titleEn: '23. Dynamic Equivalent Load (P)',
        standard: 'ISO 281',
        category: 'Rulmanlar',
        difficulty: 'medium',
        iconName: 'CircleDot',
        xpReward: 30,
        steps: [
          {
            type: 'concept',
            titleTr: 'X ve Y Radyal/Eksenel Faktörleri',
            titleEn: 'X and Y Radial/Axial Factors',
            conceptTr: 'Kombine radyal ($F_r$) ve eksenel ($F_a$) yükler altında çalışan rulmanın eşdeğer dinamik yükü $P = X \\cdot F_r + Y \\cdot F_a$ formülüyle hesaplanır.',
            conceptEn: 'Under combined loads, equivalent dynamic load is calculated as P = X*Fr + Y*Fa based on limiting factor e.',
            formula: 'P = X \\cdot F_r + Y \\cdot F_a'
          },
          {
            type: 'multiple_choice',
            titleTr: 'Soru 1',
            titleEn: 'Question 1',
            questionTr: 'Saf radyal yük altında çalışan bilyalı rulmanda (Fa=0) eşdeğer dinamik yük (P) neye eşittir?',
            questionEn: 'For a ball bearing under pure radial load (Fa=0), what is the equivalent load P?',
            optionsTr: ['P = Fr', 'P = 2 Fr', 'P = 0', 'P = C / 2'],
            optionsEn: ['P = Fr', 'P = 2 Fr', 'P = 0', 'P = C / 2'],
            correctIndex: 0,
            explanationTr: 'Doğru! Eksenel yük sıfır olduğunda X=1, Y=0 alınır ve P = Fr olur.',
            explanationEn: 'Correct! With zero axial force, X=1 and P = Fr.'
          }
        ]
      },
      {
        id: 'l-24',
        slug: 'l10-basic-rating-life-calculation',
        number: 24,
        titleTr: '24. L10 Anma Ömrü (Milyon Devir)',
        titleEn: '24. L10 Basic Rating Life (Million Revs)',
        standard: 'ISO 281',
        category: 'Rulmanlar',
        difficulty: 'medium',
        iconName: 'CircleDot',
        xpReward: 30,
        steps: [
          {
            type: 'concept',
            titleTr: 'L10 Milyon Devir Hesabı',
            titleEn: 'L10 Million Revolutions Formula',
            conceptTr: 'L10 ömrü $L_{10} = (C/P)^p$ milyon devirdir. Bilyalı rulmanlarda $p=3$, makaralı rulmanlarda temas çizgisel olduğu için $p=10/3 \\approx 3.33$\'tür.',
            conceptEn: 'L10 life is L10 = (C/P)^p million revs. Exponent p=3 for balls, p=10/3 (~3.33) for rollers.',
            formula: 'L_{10} = \\left( \\frac{C}{P} \\right)^p \\times 10^6 \\text{ rev}'
          },
          {
            type: 'multiple_choice',
            titleTr: 'Soru 1',
            titleEn: 'Question 1',
            questionTr: 'Dinamik kapasitesi C=40 kN ve yükü P=20 kN olan bilyalı bir rulmanın (p=3) L10 ömrü kaç milyon devirdir?',
            questionEn: 'For a ball bearing (p=3) with C=40 kN and P=20 kN, what is L10 life in million revs?',
            optionsTr: ['2 M-rev', '4 M-rev', '8 M-rev ((40/20)³ = 2³ = 8)', '16 M-rev'],
            optionsEn: ['2 M-rev', '4 M-rev', '8 M-rev ((40/20)³ = 8)', '16 M-rev'],
            correctIndex: 2,
            explanationTr: 'Doğru! L10 = (40 / 20)³ = 2³ = 8 milyon devir.',
            explanationEn: 'Correct! L10 = (40/20)^3 = 2^3 = 8 million revolutions.'
          }
        ]
      },
      {
        id: 'l-25',
        slug: 'l10h-operating-hours-and-rpm',
        number: 25,
        titleTr: '25. L10h Çalışma Saati & Dönme Hızı (RPM)',
        titleEn: '25. L10h Operating Hours & RPM',
        standard: 'ISO 281',
        category: 'Rulmanlar',
        difficulty: 'medium',
        iconName: 'CircleDot',
        xpReward: 30,
        steps: [
          {
            type: 'concept',
            titleTr: 'Devirden Çalışma Saatine Geçiş',
            titleEn: 'Revolutions to Operating Hours Conversion',
            conceptTr: 'L10 milyon devir ömrü, mil dönme hızı $n$ (devir/dakika) ile saat cinsine çevrilir.',
            conceptEn: 'L10 million revs life is converted to operating hours using shaft speed n (RPM).',
            formula: 'L_{10h} = \\frac{10^6 \\cdot L_{10}}{60 \\cdot n} \\text{ saat}'
          },
          {
            type: 'multiple_choice',
            titleTr: 'Soru 1',
            titleEn: 'Question 1',
            questionTr: 'Mil devri n iki katına çıkarılırsa rulmanın saat cinsinden ömrü (L10h) nasıl değişir?',
            questionEn: 'If shaft RPM is doubled, how does bearing life in hours (L10h) change?',
            optionsTr: ['Yarıya iner (1/2)', 'İki katına çıkar', 'Dört katına iner', 'Değişmez'],
            optionsEn: ['Halved (1/2)', 'Doubles', 'Drops by 4x', 'No change'],
            correctIndex: 0,
            explanationTr: 'Doğru! Hız arttıkça devir sayısı daha çabuk tüketilir ve saat ömrü yarıya düşer.',
            explanationEn: 'Correct! Higher RPM consumes fatigue cycles faster, halving the hourly life.'
          }
        ]
      },
      {
        id: 'l-26',
        slug: 'lubrication-viscosity-ratio-kappa',
        number: 26,
        titleTr: '26. Yağlama Viskozite Oranı (κ)',
        titleEn: '26. Lubrication Viscosity Ratio (κ)',
        standard: 'ISO 281 Annex',
        category: 'Triboloji',
        difficulty: 'hard',
        iconName: 'Activity',
        xpReward: 35,
        steps: [
          {
            type: 'concept',
            titleTr: 'Elastohidrodinamik Yağ Filmi (EHL)',
            titleEn: 'Elastohydrodynamic Lubrication (EHL)',
            conceptTr: 'Viskozite oranı $\\kappa = \\nu / \\nu_1$, çalışma sıcaklığındaki gerçek yağ viskozitesinin ($\nu$) gerekli anma viskozitesine ($\nu_1$) oranıdır. $\\kappa \\ge 1.0$ tam hidrodinamik film ayırmasını garantiler.',
            conceptEn: 'Viscosity ratio κ = ν / ν1. Values κ ≥ 1.0 indicate full fluid film separation, preventing metal-to-metal contact.',
            formula: '\\kappa = \\frac{\\nu}{\\nu_1} \\ge 1.0 - 4.0'
          },
          {
            type: 'multiple_choice',
            titleTr: 'Soru 1',
            titleEn: 'Question 1',
            questionTr: 'κ < 0.4 durumunda rulmanda hangi olumsuz durum meydana gelir?',
            questionEn: 'What adverse condition occurs in a bearing when κ < 0.4?',
            optionsTr: ['Metal metale temas ve aşırı mikro aşınma', 'Sonsuz yorulma ömrü', 'Yağ sızıntısı', 'Aşırı soğuma'],
            optionsEn: ['Metal-to-metal boundary contact & adhesive wear', 'Infinite fatigue life', 'Oil leakage', 'Excess cooling'],
            correctIndex: 0,
            explanationTr: 'Doğru! κ < 0.4 sınır sürtünme bölgesidir ve bilyalar ile bilezik arasında doğrudan metal teması yaşanır.',
            explanationEn: 'Correct! κ < 0.4 indicates boundary lubrication with direct asperity metal contact.'
          }
        ]
      },
      {
        id: 'l-27',
        slug: 'internal-clearance-and-preload',
        number: 27,
        titleTr: '27. Rulman İç Boşlukları (C2, CN, C3, C4)',
        titleEn: '27. Internal Clearance (C2, CN, C3, C4)',
        standard: 'DIN 620-4 / ISO 5753',
        category: 'Rulmanlar',
        difficulty: 'medium',
        iconName: 'CircleDot',
        xpReward: 30,
        steps: [
          {
            type: 'concept',
            titleTr: 'Radyal İç Boşluk ve Sıcaklık Genleşmesi',
            titleEn: 'Radial Clearance & Thermal Growth',
            conceptTr: 'Mil ile iç bilezik arasındaki sıkı geçme ve iç bileziğin sıcaklık farkı iç boşluğu daraltır. Sıcak çalışan millerde sıkışmayı önlemek için C3 veya C4 büyük boşluklu rulmanlar seçilir.',
            conceptEn: 'Interference fits and temperature differentials reduce clearance. High temp applications require C3/C4 larger clearance.',
            formula: '\\Delta r_{op} = r_{initial} - \\Delta r_{fit} - \\Delta r_{temp}'
          },
          {
            type: 'multiple_choice',
            titleTr: 'Soru 1',
            titleEn: 'Question 1',
            questionTr: 'Yüksek sıcaklıkta (örn. 120°C) çalışan bir elektrik motoru mili için hangi boşluk sınıfı uygundur?',
            questionEn: 'Which clearance class is suited for an electric motor shaft operating at elevated temperatures (e.g. 120°C)?',
            optionsTr: ['C2 (Dar)', 'C3 veya C4 (Geniş Boşluk)', 'Sıfır boşluk', 'C1'],
            optionsEn: ['C2 (Reduced)', 'C3 or C4 (Increased Clearance)', 'Zero clearance', 'C1'],
            correctIndex: 1,
            explanationTr: 'Doğru! İç bilezik ısıyla genleştiğinde rulmanın kilitlenmemesi için C3 geniş boşluk seçilir.',
            explanationEn: 'Correct! C3 clearance prevents thermal preloading and bearing seizure at elevated temperatures.'
          }
        ]
      },
      {
        id: 'l-28',
        slug: 'bearing-failure-modes-spalling-fretting',
        number: 28,
        titleTr: '28. Rulman Hasar Modları & Arıza Teşhisi',
        titleEn: '28. Bearing Failure Modes & Diagnostics',
        standard: 'ISO 15243',
        category: 'Triboloji',
        difficulty: 'hard',
        iconName: 'Activity',
        xpReward: 35,
        steps: [
          {
            type: 'concept',
            titleTr: 'ISO 15243 Hasar Sınıflandırması',
            titleEn: 'ISO 15243 Failure Mechanisms',
            conceptTr: 'Klasik yorulma pullanması (spalling), aşındırıcı aşınma (abrasive wear), korozyon, elektriksel akım geçişi (fluting) ve sahte brinell korozyonu (false brinelling) ana hasar türleridir.',
            conceptEn: 'Fatigue spalling, abrasive wear, corrosion, electrical fluting, and false brinelling are major failure modes.',
            formula: '\\text{Failure Mode: Surface/Subsurface Fatigue}'
          },
          {
            type: 'multiple_choice',
            titleTr: 'Soru 1',
            titleEn: 'Question 1',
            questionTr: 'Duran bir makinenin nakliye sırasındaki titreşimden dolayı rulman yolunda oluşan izlere ne denir?',
            questionEn: 'What is the shallow raceway marking caused by vibration during transport of stationary machinery called?',
            optionsTr: ['Sahte Brinell (False Brinelling)', 'Spalling (Pullanma)', 'Elektrik arkı', 'Kavitasyon'],
            optionsEn: ['False Brinelling', 'Spalling', 'Electrical fluting', 'Cavitation'],
            correctIndex: 0,
            explanationTr: 'Doğru! Duran rulmanda mikrometre düzeyindeki mikro titreşimler koruyucu yağ filmini kırarak Sahte Brinell çukurları oluşturur.',
            explanationEn: 'Correct! False brinelling occurs when micro-vibrations in stationary bearings rupture the lubricant film.'
          }
        ]
      },
      {
        id: 'l-29',
        slug: 'bearing-seals-and-friction-losses',
        number: 29,
        titleTr: '29. Sızdırmazlık Elemanları & Sürtünme Gücü',
        titleEn: '29. Bearing Seals & Friction Losses',
        standard: 'DIN 3760 / ISO 6194',
        category: 'Rulmanlar',
        difficulty: 'medium',
        iconName: 'Wrench',
        xpReward: 30,
        steps: [
          {
            type: 'concept',
            titleTr: 'Kapaklı (2RS, 2Z) ve Keçeli Rulmanlar',
            titleEn: 'Shielded (2Z) and Sealed (2RS) Bearings',
            conceptTr: 'Metal kapaklı (2Z) temas etmeyen kapaklar sıfır ek sürtünme ile yüksek hız sunar. Kauçuk temaslı (2RS) keçeler mükemmel toz/su koruması sağlar ancak sürtünme torkunu artırır.',
            conceptEn: 'Non-contact metal shields (2Z) allow maximum speed. Contact rubber seals (2RS) provide superior sealing at the expense of drag.',
            formula: 'P_{loss} = M_{frict} \\cdot \\omega = M_{frict} \\cdot \\frac{2\\pi n}{60}'
          },
          {
            type: 'multiple_choice',
            titleTr: 'Soru 1',
            titleEn: 'Question 1',
            questionTr: 'Çok yüksek devirli (örn. 25,000 RPM) bir fener mili için hangi kapak tipi tercih edilir?',
            questionEn: 'Which shield type is preferred for ultra-high speed spindle applications (e.g. 25,000 RPM)?',
            optionsTr: ['Temassız metal kapak (2Z) veya açık', 'Sürtünmeli çift kauçuk keçe (2RS)', 'Deri keçe', 'Keçe kullanılmaz'],
            optionsEn: ['Non-contact metal shield (2Z) or open', 'Full-contact rubber seal (2RS)', 'Leather seal', 'No sealing'],
            correctIndex: 0,
            explanationTr: 'Doğru! 2Z temassız kapaklar sürtünme ısısı üretmediğinden ultra yüksek devirlere uygundur.',
            explanationEn: 'Correct! Non-contact 2Z shields eliminate contact friction, preventing thermal runaway at high RPM.'
          }
        ]
      },
      {
        id: 'l-30',
        slug: 'boss-gearbox-input-shaft-bearing-life',
        number: 30,
        titleTr: '30. 👑 BOSS SINAVI: Redüktör Giriş Mili Rulman Analizi',
        titleEn: '30. 👑 BOSS TEST: Industrial Gearbox Bearing Sizing',
        standard: 'ISO 281 Full Analysis',
        category: 'Rulmanlar',
        difficulty: 'hard',
        iconName: 'Trophy',
        isBoss: true,
        xpReward: 70,
        steps: [
          {
            type: 'concept',
            titleTr: 'Kombine Helis Dişli Kuvvetleri Altında Rulman',
            titleEn: 'Bearings Under Helical Gear Reactions',
            conceptTr: 'Helis dişli milinde teğetsel ($F_t$), radyal ($F_r$) ve eksenel ($F_a$) kuvvetler iki rulman mesnedine moment kolları ile dağıtılır. Sabit ve serbest yatak (fixed-floating) düzeni eksenel yükü tek rulmana aktarır.',
            conceptEn: 'Helical gears generate Fr, Ft, Fa. Fixed-floating bearing arrangements assign all axial thrust to the locating bearing.',
            formula: 'L_{10h} = \\frac{10^6}{60 n} \\left( \\frac{C}{X F_r + Y F_a} \\right)^p \\ge 20,000 \\text{ saat}'
          },
          {
            type: 'multiple_choice',
            titleTr: 'Boss Sorusu',
            titleEn: 'Boss Question',
            questionTr: 'Ağır sanayi 7/24 sürekli çalışan redüktörlerde hedeflenen minimum L10h anma ömrü kaç saat olmalıdır?',
            questionEn: 'What is the industry-standard minimum target L10h rating life for 24/7 continuous industrial gearboxes?',
            optionsTr: ['2,000 - 5,000 saat', '20,000 - 40,000 saat', '500 saat', '100,000,000 saat'],
            optionsEn: ['2,000 - 5,000 hours', '20,000 - 40,000 hours', '500 hours', '100,000,000 hours'],
            correctIndex: 1,
            explanationTr: 'Tebrikler! 7/24 sanayi standartlarında (yaklaşık 5 yıl kesintisiz) minimum 20,000 - 40,000 saat hedeflenir.',
            explanationEn: 'Congratulations! Industrial continuous duty requires 20,000 to 40,000 operating hours (~5 years continuous).'
          }
        ]
      }
    ]
  },

  // ─── ÜNİTE 4 (31 - 40): DİŞLİ MEKANİZMALARI & ISO 6336 ───
  {
    id: 'unit-4',
    number: 4,
    titleTr: 'Ünite 4: Dişli Mekanizmaları & ISO 6336',
    titleEn: 'Unit 4: Gear Mechanisms & ISO 6336 Strength',
    descriptionTr: 'Düz ve helis dişli mukavemeti, diş dibi eğilme gerilmesi, pitting ve temas yorulması.',
    descriptionEn: 'Spur & helical gear geometry, tooth root bending fatigue, and contact pitting durability.',
    gradient: 'from-purple-600 to-pink-600',
    difficulty: 'hard',
    accentColor: '#ec4899',
    lessons: [
      {
        id: 'l-31',
        slug: 'involute-gear-geometry-and-module',
        number: 31,
        titleTr: '31. Evolvent Diş Geometrisi & Standart Modül',
        titleEn: '31. Involute Geometry & Module',
        standard: 'DIN 867 / ISO 53',
        category: 'Dişliler',
        difficulty: 'medium',
        iconName: 'Cog',
        xpReward: 30,
        steps: [
          {
            type: 'concept',
            titleTr: 'Modül ve Taksimat Çapı',
            titleEn: 'Module and Pitch Diameter',
            conceptTr: 'Metrik dişlilerde boyutlandırma standart modül $m$ üzerinden yapılır. Taksimat dairesi çapı $d = m \\cdot z$, diş adımı ise $p = \\pi \\cdot m$\'dir.',
            conceptEn: 'Metric gear sizing is defined by module m. Pitch diameter d = m*z, circular pitch p = π*m.',
            formula: 'd = m \\cdot z, \\quad d_a = m \\cdot (z + 2), \\quad d_f = m \\cdot (z - 2.5)'
          },
          {
            type: 'multiple_choice',
            titleTr: 'Soru 1',
            titleEn: 'Question 1',
            questionTr: 'Modülü m = 4 mm ve diş sayısı z = 25 olan düz dişlinin diş üstü çapı (da) kaç mm\'dir?',
            questionEn: 'What is the tip diameter (da) of a spur gear with m = 4 mm and z = 25 teeth?',
            optionsTr: ['100 mm', '108 mm (4 x (25 + 2))', '112 mm', '90 mm'],
            optionsEn: ['100 mm', '108 mm (4 * (25 + 2))', '112 mm', '90 mm'],
            correctIndex: 1,
            explanationTr: 'Doğru! da = m x (z + 2) = 4 x (25 + 2) = 4 x 27 = 108 mm.',
            explanationEn: 'Correct! da = m * (z + 2) = 4 * 27 = 108 mm.'
          }
        ]
      },
      {
        id: 'l-32',
        slug: 'contact-ratio-and-undercutting',
        number: 32,
        titleTr: '32. Kavrama Oranı (εα) & Alt Kesilme (Undercut)',
        titleEn: '32. Contact Ratio & Undercutting',
        standard: 'ISO 21771',
        category: 'Dişliler',
        difficulty: 'hard',
        iconName: 'Cog',
        xpReward: 35,
        steps: [
          {
            type: 'concept',
            titleTr: 'Kavrama Oranı ve Minimum Diş Sayısı',
            titleEn: 'Contact Ratio and Minimum Tooth Count',
            conceptTr: 'Sarsıntısız ve sürekli güç iletimi için kavrama oranı $\\epsilon_\\alpha > 1.2$ olmalıdır. Standart $20^\\circ$ kavrama açılı düz dişlilerde alt kesilme (undercutting) olmaması için minimum diş sayısı $z_{min} = 17$\'dir.',
            conceptEn: 'Smooth transmission requires contact ratio εα > 1.2. Standard 20° spur gears require z_min ≥ 17 to prevent undercutting.',
            formula: 'z_{\\min} = \\frac{2}{\\sin^2(20^\\circ)} \\approx 17.1 \\implies 17 \\text{ diş}'
          },
          {
            type: 'multiple_choice',
            titleTr: 'Soru 1',
            titleEn: 'Question 1',
            questionTr: 'Standart düz bir dişlide 17\'den az diş (örn. z=12) açılırsa ne tür bir kusur oluşur?',
            questionEn: 'If fewer than 17 teeth (e.g. z=12) are cut without profile shift, what defect occurs?',
            optionsTr: ['Alt kesilme (Undercut) ile diş dibi zayıflaması', 'Modülün büyümesi', 'Kavrama açısının sıfırlanması', 'Aşırı sertleşme'],
            optionsEn: ['Undercutting weakening the tooth root', 'Module enlargement', 'Zero pressure angle', 'Excess hardening'],
            correctIndex: 0,
            explanationTr: 'Doğru! z < 17 durumunda kesici takım diş dibini oyarak alt kesilmeye ve kırılma riskine yol açar.',
            explanationEn: 'Correct! z < 17 causes the hob cutter to undercut the tooth root, severely reducing strength.'
          }
        ]
      },
      {
        id: 'l-33',
        slug: 'gear-forces-tangential-radial-axial',
        number: 33,
        titleTr: '33. Dişli Kuvvetleri (Ft, Fr, Fa)',
        titleEn: '33. Gear Forces (Tangential, Radial, Axial)',
        standard: 'ISO 6336-1',
        category: 'Dişliler',
        difficulty: 'medium',
        iconName: 'Cog',
        xpReward: 30,
        steps: [
          {
            type: 'concept',
            titleTr: 'Kuvvet Ayrışımları',
            titleEn: 'Gear Force Decomposition',
            conceptTr: 'İletilen torktan teğetsel kuvvet $F_t = 2T / d$ doğar. $20^\\circ$ kavrama açısından radyal kuvvet $F_r = F_t \\cdot \\tan(\\alpha)$, helis açısı $\\beta$\'dan ise eksenel kuvvet $F_a = F_t \\cdot \\tan(\\beta)$ doğar.',
            conceptEn: 'Torque creates tangential force Ft = 2T/d. Pressure angle yields Fr = Ft*tan(α), helix angle yields Fa = Ft*tan(β).',
            formula: 'F_t = \\frac{2000 T}{d}, \\quad F_r = F_t \\cdot \\frac{\\tan(\\alpha)}{\\cos(\\beta)}, \\quad F_a = F_t \\cdot \\tan(\\beta)'
          },
          {
            type: 'multiple_choice',
            titleTr: 'Soru 1',
            titleEn: 'Question 1',
            questionTr: 'd = 100 mm çapında bir dişliye T = 150 Nm tork uygulanırsa teğetsel kuvvet (Ft) kaç N olur?',
            questionEn: 'For a gear with d = 100 mm transmitting T = 150 Nm, what is the tangential force Ft in N?',
            optionsTr: ['150 N', '1,500 N', '3,000 N ((2 x 150,000) / 100)', '750 N'],
            optionsEn: ['150 N', '1,500 N', '3,000 N ((2 * 150,000) / 100)', '750 N'],
            correctIndex: 2,
            explanationTr: 'Doğru! Ft = 2T / d = (2 x 150,000 N·mm) / 100 mm = 3,000 N (3 kN).',
            explanationEn: 'Correct! Ft = (2 * 150,000 N·mm) / 100 mm = 3,000 N.'
          }
        ]
      },
      {
        id: 'l-34',
        slug: 'iso6336-tooth-root-bending-stress',
        number: 34,
        titleTr: '34. ISO 6336 Diş Dibi Eğilme Mukavemeti (σF)',
        titleEn: '34. ISO 6336 Tooth Root Bending (σF)',
        standard: 'ISO 6336-3',
        category: 'Dişliler',
        difficulty: 'hard',
        iconName: 'Cog',
        xpReward: 35,
        steps: [
          {
            type: 'concept',
            titleTr: 'Diş Dibi Kırılma Emniyeti',
            titleEn: 'Tooth Root Fatigue Safety',
            conceptTr: 'Diş bir konsol kiriş gibi eğilir. ISO 6336 Metot B\'ye göre diş dibi gerilmesi $\\sigma_F = \\frac{F_t}{b \\cdot m_n} Y_F Y_S Y_\\beta K_A K_v K_{F\\beta} \\le \\sigma_{FP}$ formülüyle hesaplanır.',
            conceptEn: 'The tooth acts as a cantilever beam. ISO 6336 root stress σF must not exceed allowable bending limit σFP.',
            formula: '\\sigma_F = \\frac{F_t}{b \\cdot m_n} Y_F Y_S Y_\\beta K_A K_v \\le \\sigma_{FP}'
          },
          {
            type: 'multiple_choice',
            titleTr: 'Soru 1',
            titleEn: 'Question 1',
            questionTr: 'Diş genişliği (b) iki katına çıkarılırsa diş dibi eğilme gerilmesi (σF) nasıl değişir?',
            questionEn: 'If gear face width (b) is doubled, how does tooth root bending stress (σF) change?',
            optionsTr: ['Yarıya iner (1/2)', 'İki katına çıkar', 'Dört katına iner', 'Değişmez'],
            optionsEn: ['Halved (1/2)', 'Doubles', 'Drops by 4x', 'No change'],
            correctIndex: 0,
            explanationTr: 'Doğru! Formülde b paydada yer aldığından gerilme yarıya iner.',
            explanationEn: 'Correct! Face width b is in the denominator, so stress is cut in half.'
          }
        ]
      },
      {
        id: 'l-35',
        slug: 'iso6336-hertzian-contact-stress-pitting',
        number: 35,
        titleTr: '35. ISO 6336 Yüzey Basıncı & Pitting (σH)',
        titleEn: '35. ISO 6336 Surface Pitting (σH)',
        standard: 'ISO 6336-2',
        category: 'Dişliler',
        difficulty: 'hard',
        iconName: 'Cog',
        xpReward: 35,
        steps: [
          {
            type: 'concept',
            titleTr: 'Hertz Temas Gerilmesi ve Çukurlaşma (Pitting)',
            titleEn: 'Hertzian Contact Stress & Pitting',
            conceptTr: 'Diş yanağındaki temas gerilmesi Hertz teorisi ile hesaplanır. İzin verilen temas sınırının aşılması mikroskobik yorulma çatlaklarına ve yüzey dökülmesine (pitting) neden olur.',
            conceptEn: 'Flank contact stress σH is calculated via Hertzian theory. Exceeding limit causes micro-fatigue pitting.',
            formula: '\\sigma_H = Z_E Z_H Z_\\epsilon \\sqrt{\\frac{F_t}{d_1 \\cdot b} \\frac{u+1}{u} K_A K_v} \\le \\sigma_{HP}'
          },
          {
            type: 'multiple_choice',
            titleTr: 'Soru 1',
            titleEn: 'Question 1',
            questionTr: 'Çelik-çelik dişli eşleşmesinde elastisite katsayısı (ZE) tipik olarak kaç MPa^0.5 değerindedir?',
            questionEn: 'What is the typical elasticity factor ZE for steel-steel gear pairing in MPa^0.5?',
            optionsTr: ['189.8 MPa^0.5', '50.0 MPa^0.5', '500.0 MPa^0.5', '1.0 MPa^0.5'],
            optionsEn: ['189.8 MPa^0.5', '50.0 MPa^0.5', '500.0 MPa^0.5', '1.0 MPa^0.5'],
            correctIndex: 0,
            explanationTr: 'Doğru! Çelik/çelik (E=206 GPa, ν=0.3) eşleşmesinde ZE = 189.8 MPa^0.5 standarttır.',
            explanationEn: 'Correct! For steel-on-steel pairs, ZE = 189.8 MPa^0.5 is the standard ISO value.'
          }
        ]
      },
      {
        id: 'l-36',
        slug: 'helical-gears-overlap-and-axial-thrust',
        number: 36,
        titleTr: '36. Helis Dişliler & Eksenel Kuvvet Dengesi',
        titleEn: '36. Helical Gears & Thrust Balance',
        standard: 'ISO 6336',
        category: 'Dişliler',
        difficulty: 'hard',
        iconName: 'Cog',
        xpReward: 35,
        steps: [
          {
            type: 'concept',
            titleTr: 'Helis Açısı (β) ve Çavuş Dişli (Herringbone)',
            titleEn: 'Helix Angle and Double Helical Gears',
            conceptTr: 'Helis dişliler daha sessiz ve yüksek taşıma kapasitelidir ancak eksenel kuvvet ($F_a$) üretir. Çavuş dişliler (çift helis) zıt açılar sayesinde eksenel kuvveti kendi içinde sıfırlar.',
            conceptEn: 'Helical gears offer smoother meshing but produce axial thrust Fa. Herringbone gears cancel thrust internally.',
            formula: 'F_a = F_t \\cdot \\tan(\\beta), \\quad \\text{Herringbone: } \\sum F_a = 0'
          },
          {
            type: 'multiple_choice',
            titleTr: 'Soru 1',
            titleEn: 'Question 1',
            questionTr: 'Çift helis (çavuş) dişli geometrisinin tek helise göre en büyük avantajı nedir?',
            questionEn: 'What is the primary mechanical advantage of double helical (herringbone) gears over single helical?',
            optionsTr: ['Eksenel yatak yükünü sıfırlaması', 'Daha ucuz imalat', 'Daha az diş sayısı', 'Yağ gerektirmemesi'],
            optionsEn: ['Eliminates net axial thrust on bearings', 'Cheaper manufacturing', 'Fewer teeth', 'No oil required'],
            correctIndex: 0,
            explanationTr: 'Doğru! Zıt yönlü çift helis açısı eksenel kuvvetleri sıfırlayarak yatakları rahatlatır.',
            explanationEn: 'Correct! Opposed helix angles cancel out axial thrust, protecting shaft bearings.'
          }
        ]
      },
      {
        id: 'l-37',
        slug: 'planetary-gear-ratios-and-willis-formula',
        number: 37,
        titleTr: '37. Planet Dişli Mekanizmaları & Willis Formülü',
        titleEn: '37. Planetary Gears & Willis Formula',
        standard: 'VDI 2157',
        category: 'Dişliler',
        difficulty: 'hard',
        iconName: 'Cog',
        xpReward: 35,
        steps: [
          {
            type: 'concept',
            titleTr: 'Güneş, Planet, Taşıyıcı ve Çember Dişli',
            titleEn: 'Sun, Planet, Carrier, and Ring Gear',
            conceptTr: 'Planet dişli sistemlerinde çevrim oranı Willis formülü ile çözülür: $\\frac{n_s - n_c}{n_r - n_c} = -\\frac{z_r}{z_s}$. Çember dişli sabitken taşıyıcıdan çıkış alınırsa $i = 1 + z_r/z_s$ elde edilir.',
            conceptEn: 'Planetary gear ratio is solved via Willis equation: (ns - nc)/(nr - nc) = -zr/zs. With fixed ring, ratio is i = 1 + zr/zs.',
            formula: 'i_{s-c} = 1 + \\frac{z_{\\text{ring}}}{z_{\\text{sun}}} \\quad (\\text{Çember Sabit})'
          },
          {
            type: 'multiple_choice',
            titleTr: 'Soru 1',
            titleEn: 'Question 1',
            questionTr: 'Güneş dişli z_sun=20 ve çember dişli z_ring=80 olan sistemde çember sabitken çevrim oranı (i) nedir?',
            questionEn: 'With sun z_sun=20, ring z_ring=80, and fixed ring, what is the reduction ratio (i)?',
            optionsTr: ['i = 4', 'i = 5 (1 + 80/20)', 'i = 3', 'i = 0.2'],
            optionsEn: ['i = 4', 'i = 5 (1 + 80/20)', 'i = 3', 'i = 0.2'],
            correctIndex: 1,
            explanationTr: 'Doğru! i = 1 + (80 / 20) = 1 + 4 = 5:1 redüksiyon oranı elde edilir.',
            explanationEn: 'Correct! i = 1 + (80/20) = 1 + 4 = 5:1 speed reduction.'
          }
        ]
      },
      {
        id: 'l-38',
        slug: 'bevel-and-hypoid-gears',
        number: 38,
        titleTr: '38. Konik & Hipoid Dişliler',
        titleEn: '38. Bevel & Hypoid Gears',
        standard: 'ISO 10300 / DIN 3971',
        category: 'Dişliler',
        difficulty: 'hard',
        iconName: 'Cog',
        xpReward: 35,
        steps: [
          {
            type: 'concept',
            titleTr: 'Kesişen ve Ayrık Eksenli Güç İletimi',
            titleEn: 'Intersecting vs Non-Intersecting Shafts',
            conceptTr: 'Düz konik dişliler $90^\\circ$ kesişen millerde güç iletir. Hipoid dişlilerde ise miller kesişmez (ofsetlidir); bu durum otomotiv diferansiyellerinde ağırlık merkezini alçaltmak için kullanılır.',
            conceptEn: 'Bevel gears connect intersecting shafts (typically 90°). Hypoid gears feature offset non-intersecting shafts for automotive differentials.',
            formula: '\\delta_1 + \\delta_2 = 90^\\circ \\quad (\\text{Konik Açıları Toplamı})'
          },
          {
            type: 'multiple_choice',
            titleTr: 'Soru 1',
            titleEn: 'Question 1',
            questionTr: 'Hipoid dişlilerin konik dişlilere göre en belirgin geometrik farkı nedir?',
            questionEn: 'What is the distinctive geometric feature of hypoid gears compared to standard bevel gears?',
            optionsTr: ['Mil eksenlerinin kesişmeyip ofsetli (kayık) olması', 'Dişlerinin olmaması', 'Daha az tork iletmesi', 'Sadece plastikten yapılması'],
            optionsEn: ['Shaft axes do not intersect (offset shafts)', 'No teeth', 'Lower torque rating', 'Made only of plastic'],
            correctIndex: 0,
            explanationTr: 'Doğru! Hipoid dişlilerde pinyon mili diferansiyel taç dişlisi ekseninden aşağı veya yukarı ofsetlidir.',
            explanationEn: 'Correct! Hypoid gears feature pinion axis offset relative to crown wheel axis.'
          }
        ]
      },
      {
        id: 'l-39',
        slug: 'worm-gear-drives-and-self-locking',
        number: 39,
        titleTr: '39. Sonsuz Vida Mekanizması & Kendi Kendine Kilitleme',
        titleEn: '39. Worm Drives & Self-Locking',
        standard: 'DIN 3975 / ISO 14521',
        category: 'Dişliler',
        difficulty: 'hard',
        iconName: 'Cog',
        xpReward: 35,
        steps: [
          {
            type: 'concept',
            titleTr: 'Sonsuz Vida Verimi ve Otoblokaj',
            titleEn: 'Worm Drive Efficiency & Self-Locking',
            conceptTr: 'Vida hatve açısı $\\gamma$, sürtünme açısından $\\rho$\'dan küçük olduğunda ($\gamma < \rho$), mekanizma kendi kendine kilitlenir (otoblokaj). Çıkıştan giriş döndürülemez (vinç ve asansörlerde güvenlik sağlar).',
            conceptEn: 'When lead angle γ is smaller than friction angle ρ (γ < ρ), the drive is self-locking (cannot be back-driven by output torque).',
            formula: '\\eta = \\frac{\\tan(\\gamma)}{\\tan(\\gamma + \\rho\')}, \\quad \\gamma < \\rho\' \\implies \\text{Otoblokaj}'
          },
          {
            type: 'multiple_choice',
            titleTr: 'Soru 1',
            titleEn: 'Question 1',
            questionTr: 'Asansör ve vinç redüktörlerinde otoblokajlı sonsuz vida kullanılmasının en büyük sebebi nedir?',
            questionEn: 'Why are self-locking worm drives preferred in elevator and hoist winches?',
            optionsTr: ['Elektrik kesildiğinde yükün yerçekimiyle geri kaymasını engellemek', 'Yüksek verim sağlamak', 'Sıcaklığı düşürmek', 'Hızı artırmak'],
            optionsEn: ['Prevent load back-driving and falling during power failure', 'Maximize efficiency', 'Lower temperature', 'Increase speed'],
            correctIndex: 0,
            explanationTr: 'Doğru! Otoblokaj mekanik bir fren görevi görerek yükün serbest düşüşünü engeller.',
            explanationEn: 'Correct! Self-locking acts as an intrinsic mechanical brake preventing suspended loads from dropping.'
          }
        ]
      },
      {
        id: 'l-40',
        slug: 'boss-multistage-helical-gearbox-sizing',
        number: 40,
        titleTr: '40. 👑 BOSS SINAVI: Çift Kademeli Redüktör Tasarımı',
        titleEn: '40. 👑 BOSS TEST: Two-Stage Gearbox Complete Verification',
        standard: 'ISO 6336 Complete Analysis',
        category: 'Dişliler',
        difficulty: 'hard',
        iconName: 'Trophy',
        isBoss: true,
        xpReward: 75,
        steps: [
          {
            type: 'concept',
            titleTr: 'Redüktör Boyutlandırma Sentezi',
            titleEn: 'Comprehensive Gearbox Synthesis',
            conceptTr: 'Toplam redüksiyon $i_{top} = i_1 \\cdot i_2$. Giriş kademesinde yüksek hızdan dolayı pitting ($\sigma_H$), çıkış kademesinde ise yüksek torktan dolayı diş dibi kırılması ($\sigma_F$) kritik kontrol parametresidir.',
            conceptEn: 'Total ratio i_total = i1 * i2. High-speed stage is governed by pitting (σH); high-torque output is governed by root bending (σF).',
            formula: 'S_F = \\frac{\\sigma_{FP}}{\\sigma_F} \\ge 1.4, \\quad S_H = \\frac{\\sigma_{HP}}{\\sigma_H} \\ge 1.2'
          },
          {
            type: 'multiple_choice',
            titleTr: 'Boss Sorusu',
            titleEn: 'Boss Question',
            questionTr: 'P = 15 kW motor, n1 = 1450 RPM giriş ve i_top = 25 redüktörde çıkış mili nominal torku (T2) yaklaşık kaç Nm olur?',
            questionEn: 'With 15 kW motor, 1450 RPM input, and i_total = 25 reduction, what is nominal output torque T2?',
            optionsTr: ['98 Nm', '2,470 Nm (~2.5 kNm)', '500 Nm', '10,000 Nm'],
            optionsEn: ['98 Nm', '2,470 Nm (~2.5 kNm)', '500 Nm', '10,000 Nm'],
            correctIndex: 1,
            explanationTr: 'Tebrikler! T1 = 9550 x 15 / 1450 ≈ 98.8 Nm; T2 = 98.8 x 25 ≈ 2,470 Nm.',
            explanationEn: 'Congratulations! T1 = (9550 * 15) / 1450 ≈ 98.8 Nm; T2 = 98.8 * 25 ≈ 2,470 Nm.'
          }
        ]
      }
    ]
  },

  // ─── ÜNİTE 5 (41 - 50): MİLLER, KAMALAR & DIN 743 ───
  {
    id: 'unit-5',
    number: 5,
    titleTr: 'Ünite 5: Miller, Kamalar & DIN 743 Standardı',
    titleEn: 'Unit 5: Shafts, Keys & DIN 743 Fatigue Sizing',
    descriptionTr: 'Burulma ve eğilme gerilmeleri, çentik faktörleri, kama ezilme basıncı ve dinamik güvenlik.',
    descriptionEn: 'Torsion & bending stresses, notch sensitivity, keyway surface pressure, and dynamic safety.',
    gradient: 'from-pink-600 to-rose-600',
    difficulty: 'hard',
    accentColor: '#f43f5e',
    lessons: [
      {
        id: 'l-41',
        slug: 'shaft-torsion-and-polar-modulus',
        number: 41,
        titleTr: '41. Mil Burulma Gerilmesi & Polar Mukavemet (Wt)',
        titleEn: '41. Shaft Torsion & Polar Modulus (Wt)',
        standard: 'DIN 743',
        category: 'Miller',
        difficulty: 'medium',
        iconName: 'Wrench',
        xpReward: 30,
        steps: [
          {
            type: 'concept',
            titleTr: 'Dairesel Mil Burulma Gerilmesi',
            titleEn: 'Circular Shaft Torsional Shear Stress',
            conceptTr: 'Dolu dairesel milde iletilen tork $T$, dış yüzeyde maksimum kayma gerilmesi $\\tau_t = T / W_t$ oluşturur. Polar mukavemet momenti $W_t = \\pi d^3 / 16$\'dır.',
            conceptEn: 'Applied torque T creates maximum surface torsional shear stress τ = T/Wt. Polar modulus Wt = π*d³/16.',
            formula: 'W_t = \\frac{\\pi \\cdot d^3}{16} \\approx 0.2 d^3, \\quad \\tau_t = \\frac{T}{W_t}'
          },
          {
            type: 'multiple_choice',
            titleTr: 'Soru 1',
            titleEn: 'Question 1',
            questionTr: 'Mil çapı (d) iki katına çıkarılırsa burulma taşıma kapasitesi (Wt) kaç katına çıkar?',
            questionEn: 'If shaft diameter (d) is doubled, by what factor does torsional load capacity (Wt) increase?',
            optionsTr: ['2 katına', '4 katına', '8 katına (2³)', '16 katına'],
            optionsEn: ['2x', '4x', '8x (2³)', '16x'],
            correctIndex: 2,
            explanationTr: 'Doğru! Formülde d³ terimi olduğundan 2³ = 8 katına çıkar!',
            explanationEn: 'Correct! Due to d³ dependence, capacity scales by 2³ = 8x.'
          }
        ]
      },
      {
        id: 'l-42',
        slug: 'combined-bending-and-torsion-von-mises',
        number: 42,
        titleTr: '42. Birleşik Eğilme & Burulma Eşdeğer Gerilmesi',
        titleEn: '42. Combined Bending & Torsion (Von Mises)',
        standard: 'DIN 743 / Von Mises',
        category: 'Miller',
        difficulty: 'hard',
        iconName: 'Layers',
        xpReward: 35,
        steps: [
          {
            type: 'concept',
            titleTr: 'Von Mises Eşdeğer Gerilme Kriteri',
            titleEn: 'Von Mises Equivalent Stress in Shafts',
            conceptTr: 'Dönen bir milde eğilme momenti değişken ($\sigma_b$), burulma momenti ise durağandır ($\tau_t$). Eşdeğer gerilme $\\sigma_v = \\sqrt{\\sigma_b^2 + 3 \\tau_t^2}$ formülüyle hesaplanır.',
            conceptEn: 'Rotating shafts experience alternating bending (σb) and static torsion (τt). Von Mises equivalent stress is σv = sqrt(σb² + 3τt²).',
            formula: '\\sigma_v = \\sqrt{\\sigma_b^2 + 3 \\tau_t^2} \\le \\sigma_{allow}'
          },
          {
            type: 'multiple_choice',
            titleTr: 'Soru 1',
            titleEn: 'Question 1',
            questionTr: 'σb = 80 MPa eğilme ve τt = 40 MPa burulma etkisindeki bir milde Von Mises eşdeğer gerilmesi yaklaşık kaç MPa\'dır?',
            questionEn: 'For σb = 80 MPa and τt = 40 MPa, what is the approximate Von Mises stress?',
            optionsTr: ['120 MPa', '106 MPa (sqrt(80² + 3x40²))', '80 MPa', '40 MPa'],
            optionsEn: ['120 MPa', '106 MPa (sqrt(80² + 3*40²))', '80 MPa', '40 MPa'],
            correctIndex: 1,
            explanationTr: 'Doğru! sqrt(6400 + 3 x 1600) = sqrt(6400 + 4800) = sqrt(11200) ≈ 105.8 MPa.',
            explanationEn: 'Correct! sqrt(6400 + 3*1600) = sqrt(11200) ≈ 105.8 MPa.'
          }
        ]
      },
      {
        id: 'l-43',
        slug: 'stress-concentration-and-notch-effect',
        number: 43,
        titleTr: '43. Çentik Etkisi & Geometrik Faktör (αk)',
        titleEn: '43. Stress Concentration & Notches (αk)',
        standard: 'DIN 743-2',
        category: 'Miller',
        difficulty: 'hard',
        iconName: 'Activity',
        xpReward: 35,
        steps: [
          {
            type: 'concept',
            titleTr: 'Kademe Geçişleri ve Kama Yuvası Çentikleri',
            titleEn: 'Shoulder Fillets and Keyway Notches',
            conceptTr: 'Mil kademelerindeki keskin köşeler gerilme çizgilerini sıkıştırarak gerilme yığılması ($\alpha_k > 1.0$) oluşturur. Radyusu büyütmek gerilme tepe noktasını hızla düşürür.',
            conceptEn: 'Sharp shoulder fillets crowd stress trajectories, causing concentration αk > 1.0. Increasing radius drastically reduces peak stress.',
            formula: '\\sigma_{\\max} = \\alpha_k \\cdot \\sigma_{nom}'
          },
          {
            type: 'multiple_choice',
            titleTr: 'Soru 1',
            titleEn: 'Question 1',
            questionTr: 'Bir mil kademesinde radyusu r=0.5 mm yerine r=3 mm yapmak yorulma dayanımını nasıl etkiler?',
            questionEn: 'How does increasing a shaft shoulder fillet radius from r=0.5 mm to r=3 mm affect fatigue life?',
            optionsTr: ['Çentik katsayısını düşürerek yorulma dayanımını belirgin şekilde artırır', 'Dayanımı azaltır', 'Değiştirmez', 'Ağırlığı artırır'],
            optionsEn: ['Reduces notch factor, drastically improving fatigue strength', 'Reduces strength', 'No effect', 'Increases weight'],
            correctIndex: 0,
            explanationTr: 'Doğru! Büyük geçiş radyusu gerilme yığılmasını dağıtarak dinamik ömrü kat kat uzatır.',
            explanationEn: 'Correct! Generous transition radii lower stress peaks, dramatically extending fatigue life.'
          }
        ]
      },
      {
        id: 'l-44',
        slug: 'parallel-keys-din6885-surface-pressure',
        number: 44,
        titleTr: '44. Paralel Kamalar (DIN 6885) & Ezilme Basıncı',
        titleEn: '44. Parallel Keys (DIN 6885) & Pressure',
        standard: 'DIN 6885-1',
        category: 'Miller',
        difficulty: 'medium',
        iconName: 'Wrench',
        xpReward: 30,
        steps: [
          {
            type: 'concept',
            titleTr: 'Kama Yanak Ezilme Basıncı (p)',
            titleEn: 'Key Flank Surface Pressure',
            conceptTr: 'Kamalar torku yan yüzey teması ile aktarır. Yanak ezilme basıncı $p = \\frac{2000 T}{d \\cdot h\' \\cdot l_t} \\le p_{zul}$ sınırını aşmamalıdır (çelik göbek için $p_{zul} \\approx 100-150$ MPa).',
            conceptEn: 'Keys transmit torque via flank contact. Flank pressure p = 2000*T / (d*h\'*l_eff) must not exceed allowable limit p_zul.',
            formula: 'p = \\frac{2000 T}{d \\cdot (h - t_1) \\cdot l_{\\text{eff}}} \\le p_{zul}'
          },
          {
            type: 'multiple_choice',
            titleTr: 'Soru 1',
            titleEn: 'Question 1',
            questionTr: 'Kama bağlantısında hasar genellikle nerede meydana gelir?',
            questionEn: 'Where does failure most typically occur in a parallel key connection?',
            optionsTr: ['Kama yan yüzeylerinde plastik ezilme veya milde kama yuvası çatlağı', 'Kamanın erimesi', 'Milin boyuna uzaması', 'Kama vidasının kopması'],
            optionsEn: ['Plastic yielding on key flanks or fatigue crack at keyway corners', 'Melting', 'Shaft elongation', 'Screw failure'],
            correctIndex: 0,
            explanationTr: 'Doğru! Aşırı tork kamayı ezer veya kama yuvası köşe çentiğinden yorulma çatlağı başlatır.',
            explanationEn: 'Correct! Over-torque crushes key flanks or initiates fatigue cracks at keyway root radius.'
          }
        ]
      },
      {
        id: 'l-45',
        slug: 'din5480-involute-spline-shafts',
        number: 45,
        titleTr: '45. Evolvent Frezeli Miller (DIN 5480)',
        titleEn: '45. Involute Splines (DIN 5480)',
        standard: 'DIN 5480 / ISO 4156',
        category: 'Miller',
        difficulty: 'hard',
        iconName: 'Wrench',
        xpReward: 35,
        steps: [
          {
            type: 'concept',
            titleTr: 'Çoklu Dişli Freze Bağlantıları',
            titleEn: 'Multi-Tooth Splined Connections',
            conceptTr: 'Tek kamaya göre frezeli miller torku çevre boyunca onlarca dişe eşit yayar. Yüksek dinamik, tersinir torklar ve havacılık şaftları için standarttır.',
            conceptEn: 'Involute splines distribute torque over multiple teeth, offering superior fatigue capacity for alternating heavy loads.',
            formula: 'p = \\frac{2000 T}{d_m \\cdot h \\cdot l \\cdot z \\cdot k_m} \\le p_{zul}'
          },
          {
            type: 'multiple_choice',
            titleTr: 'Soru 1',
            titleEn: 'Question 1',
            questionTr: 'Frezeli şaftların tek paralel kamaya göre en kritik avantajı nedir?',
            questionEn: 'What is the primary advantage of splined shafts over a single keyway?',
            optionsTr: ['Eşmerkezlilik (merkezleme) ve çok daha yüksek tork kapasitesi', 'Daha az işleme süresi', 'Daha ucuz malzeme', 'Radyal yük taşımaması'],
            optionsEn: ['Self-centering and vastly superior torque capacity', 'Faster machining', 'Cheaper steel', 'Zero radial load'],
            correctIndex: 0,
            explanationTr: 'Doğru! Çoklu dişler mükemmel dinamik balans, merkezleme ve yüksek tork taşır.',
            explanationEn: 'Correct! Splines provide self-centering, dynamic balance, and multi-tooth load sharing.'
          }
        ]
      },
      {
        id: 'l-46',
        slug: 'press-fit-and-interference-joints',
        number: 46,
        titleTr: '46. Sıkı Geçme (Pres-Fit) Bağlantıları',
        titleEn: '46. Press-Fit & Interference Joints',
        standard: 'DIN 7190',
        category: 'Miller',
        difficulty: 'hard',
        iconName: 'Layers',
        xpReward: 35,
        steps: [
          {
            type: 'concept',
            titleTr: 'Elastik Radyal Temas Basıncı (pF)',
            titleEn: 'Elastic Joint Pressure (pF)',
            conceptTr: 'Mil çapı göbek deliğinden büyük imal edilip preslendiğinde arayüzde $p_F$ temas basıncı oluşur. Tork aktarımı $T = p_F \\cdot \\pi d \\cdot L \\cdot \\mu \\cdot d/2$ sürtünme kuvvetiyle gerçekleşir.',
            conceptEn: 'Interference fit generates radial contact pressure pF. Transmissible torque is T = pF * π*d*L * μ * d/2.',
            formula: 'T = p_F \\cdot \\pi \\cdot d \\cdot L \\cdot \\mu \\cdot \\frac{d}{2}'
          },
          {
            type: 'multiple_choice',
            titleTr: 'Soru 1',
            titleEn: 'Question 1',
            questionTr: 'Sıkı geçme montajını kolaylaştırmak ve talaş kaldırmayı önlemek için endüstride ne yapılır?',
            questionEn: 'How are heavy interference fits assembled without scuffing the mating surfaces?',
            optionsTr: ['Göbeği fırında ısıtıp mili sıvı azotta soğutma (termal montaj)', 'Zımparalama', 'Darbe ile çekiçleme', 'Gres yağıyla zorlama'],
            optionsEn: ['Thermal induction heating of hub & cryogenic cooling of shaft', 'Sanding down', 'Hammering dry', 'Grease forcing'],
            correctIndex: 0,
            explanationTr: 'Doğru! Termal genleşme/büzüşme aradaki sıkılığı geçici olarak boşluğa çevirerek pürüzsüz montaj sağlar.',
            explanationEn: 'Correct! Heating the hub and cooling the shaft creates temporary assembly clearance.'
          }
        ]
      },
      {
        id: 'l-47',
        slug: 'critical-speeds-and-whirling-of-shafts',
        number: 47,
        titleTr: '47. Millerin Kritik Dönme Hızı & Rezonans',
        titleEn: '47. Critical Speeds & Whirling',
        standard: 'ISO 7919 / Dunkerley',
        category: 'Dinamik',
        difficulty: 'hard',
        iconName: 'Activity',
        xpReward: 35,
        steps: [
          {
            type: 'concept',
            titleTr: 'Eğilme Rezonansı (Dunkerley Yöntemi)',
            titleEn: 'Bending Whirling & Dunkerley Method',
            conceptTr: 'Milin dönme frekansı doğal eğilme titreşim frekansı ile çakıştığında ($\omega = \omega_n$), merkezkaç kuvveti mili sonsuz genlikle savurmaya çalışır (kritik devir $n_{kr}$).',
            conceptEn: 'When rotation frequency matches natural bending frequency (ω = ωn), centrifugal unbalance excites resonance whirling.',
            formula: 'n_{kr} = \\frac{30}{\\pi} \\sqrt{\\frac{g}{w_{\\max}}} \\approx \\frac{300}{\\sqrt{w_{\\max} \\text{ (cm)}}} \\text{ RPM}'
          },
          {
            type: 'multiple_choice',
            titleTr: 'Soru 1',
            titleEn: 'Question 1',
            questionTr: 'Çalışma devri n, kritik devir n_kr\'ye çok yakınsa (örn. 0.95 n_kr) ne yapılmalıdır?',
            questionEn: 'If continuous operating speed is dangerously close to critical speed (0.95 n_cr), what design change is required?',
            optionsTr: ['Mil çapını büyüterek rijitliği artırmak ve n_kr\'yi yukarı taşımak', 'Yağı boşaltmak', 'Devri artırmak', 'Radyusu silmek'],
            optionsEn: ['Increase shaft diameter/stiffness to shift n_cr well above operating RPM', 'Drain oil', 'Increase RPM blindly', 'Remove fillets'],
            correctIndex: 0,
            explanationTr: 'Doğru! Çapı büyütmek eğilme rijitliğini artırır ve kritik devri işletme devrinin en az %25 üzerine çıkarır.',
            explanationEn: 'Correct! Increasing shaft diameter increases stiffness, shifting critical speed comfortably above operating range.'
          }
        ]
      },
      {
        id: 'l-48',
        slug: 'din743-fatigue-notch-factor-beta-k',
        number: 48,
        titleTr: '48. DIN 743 Yorulma Çentik Faktörü (βk)',
        titleEn: '48. DIN 743 Fatigue Notch Factor (βk)',
        standard: 'DIN 743-2',
        category: 'Miller',
        difficulty: 'hard',
        iconName: 'Activity',
        xpReward: 35,
        steps: [
          {
            type: 'concept',
            titleTr: 'Malzeme Çentik Duyarlılığı ve Boyut Faktörü',
            titleEn: 'Notch Sensitivity & Size Factor',
            conceptTr: 'Geometrik faktör $\\alpha_k$, malzemenin çentik duyarlılığı ($q$) ve teknolojik boyut faktörü ($K_d$) ile dinamik yorulma çentik faktörüne ($\\beta_k$) dönüştürülür.',
            conceptEn: 'Geometric notch factor αk is scaled by notch sensitivity q and size factor Kd to yield fatigue notch factor βk.',
            formula: '\\beta_k = 1 + q \\cdot (\\alpha_k - 1), \\quad \\sigma_{Wk} = \\frac{\\sigma_W \\cdot K_F}{\\beta_k}'
          },
          {
            type: 'multiple_choice',
            titleTr: 'Soru 1',
            titleEn: 'Question 1',
            questionTr: 'Yüksek dayanımlı sertleştirilmiş çelikler yumuşak yapı çeliklerine göre çentik etkisine nasıl tepki verir?',
            questionEn: 'How do high-strength hardened steels respond to notches compared to ductile mild steels?',
            optionsTr: ['Çentik duyarlılıkları çok daha yüksektir (çatlağa daha hassas)', 'Çentikten hiç etkilenmezler', 'Daha az hassastırlar', 'Plastik akarlar'],
            optionsEn: ['Significantly higher notch sensitivity (highly notch brittle)', 'Not affected by notches', 'Less sensitive', 'Flow plastically'],
            correctIndex: 0,
            explanationTr: 'Doğru! Yüksek dayanımlı çeliklerde gerilme yığılması plastik gevşeyemediği için çentik hassasiyeti (q ≈ 1) çok yüksektir.',
            explanationEn: 'Correct! High strength steels have higher notch sensitivity (q ≈ 1.0) due to limited local plastic stress redistribution.'
          }
        ]
      },
      {
        id: 'l-49',
        slug: 'din743-fatigue-safety-factor-calculation',
        number: 49,
        titleTr: '49. DIN 743 Dinamik Güvenlik Faktörü (SD)',
        titleEn: '49. DIN 743 Dynamic Safety Factor (SD)',
      }
    ]
  },

  // ─── ÜNİTE 6 (51 - 60): KİRİŞLER, SEHİM & İLERİ MUKAVEMET ───
  {
    id: 'unit-6',
    number: 6,
    titleTr: 'Ünite 6: Kirişler, Sehim & İleri Mukavemet',
    titleEn: 'Unit 6: Beams, Deflection & Advanced Strength',
    descriptionTr: 'Kesme-moment diyagramları, Jourawski kayması, Timoshenko kalın kirişler ve eğrilikli elemanlar.',
    descriptionEn: 'Shear-moment diagrams, Jourawski shear flow, Timoshenko thick beams, and curved members.',
    gradient: 'from-emerald-500 to-teal-600',
    difficulty: 'hard',
    accentColor: '#10b981',
    lessons: [
      {
        id: 'l-51',
        slug: 'shear-force-and-bending-moment-diagrams',
        number: 51,
        titleTr: '51. Kesme Kuvveti & Eğilme Momenti Diyagramları',
        titleEn: '51. Shear & Moment Diagrams (V-M)',
        standard: 'Euler-Bernoulli',
        category: 'Mukavemet',
        difficulty: 'medium',
        iconName: 'Layers',
        xpReward: 30,
        steps: [
          {
            type: 'concept',
            titleTr: 'V-M İntegral Bağıntıları',
            titleEn: 'V-M Differential Relationships',
            conceptTr: 'Yayılı yük $q(x)$ kesme kuvvetinin türevidir ($V = \\int q dx$), kesme kuvveti ise eğilme momentinin türevidir ($M = \\int V dx$). Kesme kuvvetinin sıfır olduğu noktada eğilme momenti maksimuma ulaşır!',
            conceptEn: 'Distributed load q is derivative of shear (V = ∫q dx), and shear is derivative of moment (M = ∫V dx). Max moment occurs where V=0!',
            formula: '\\frac{dV}{dx} = -q(x), \\quad \\frac{dM}{dx} = V(x), \\quad V=0 \\implies M = M_{\\max}'
          },
          {
            type: 'multiple_choice',
            titleTr: 'Soru 1',
            titleEn: 'Question 1',
            questionTr: 'Kirişte kesme kuvvetinin (V) işaret değiştirip sıfırdan geçtiği noktada eğilme momenti (M) ne değer alır?',
            questionEn: 'At the point where shear force V changes sign and crosses zero, what value does bending moment M achieve?',
            optionsTr: ['Sıfır olur', 'Yerel maksimum veya minimum (ekstremum tepe noktası)', 'Sonsuz olur', 'Sabit kalır'],
            optionsEn: ['Becomes zero', 'Local maximum or minimum (peak extremum)', 'Becomes infinite', 'Remains constant'],
            correctIndex: 1,
            explanationTr: 'Doğru! dM/dx = V olduğundan, V=0 noktası moment eğrisinin tepe (maksimum gerilme) noktasıdır.',
            explanationEn: 'Correct! Since dM/dx = V, V=0 identifies the mathematical extremum peak of the moment diagram.'
          }
        ]
      },
      {
        id: 'l-52',
        slug: 'flexure-formula-normal-stress-distribution',
        number: 52,
        titleTr: '52. Normal Eğilme Gerilmesi (Navier)',
        titleEn: '52. Flexure Formula (Navier)',
        standard: 'Navier / Euler',
        category: 'Mukavemet',
        difficulty: 'medium',
        iconName: 'Layers',
        xpReward: 30,
        steps: [
          {
            type: 'concept',
            titleTr: 'Navier Eğilme Gerilmesi Dağılımı',
            titleEn: 'Navier Normal Bending Distribution',
            conceptTr: 'Nötr eksende gerilme sıfırdır. Nötr eksenden uzaklaştıkça gerilme doğrusal artar ($\sigma = M \\cdot y / I$). En dış liflerde maksimum çekme ve bası oluşur.',
            conceptEn: 'Stress is zero at the neutral axis and increases linearly with distance y (σ = M*y / I). Max tension/compression occurs at outer fibers.',
            formula: '\\sigma(y) = \\frac{M \\cdot y}{I_x}, \\quad \\sigma_{\\max} = \\frac{M}{W_x}'
          },
          {
            type: 'multiple_choice',
            titleTr: 'Soru 1',
            titleEn: 'Question 1',
            questionTr: 'Simetrik bir I-profilinde eğilme anında nötr eksendeki (y=0) normal gerilme nedir?',
            questionEn: 'In a symmetric I-beam under pure bending, what is the normal stress at the neutral axis (y=0)?',
            optionsTr: ['0 MPa', 'Maksimum gerilme', 'Akma gerilmesi', 'Basınç gerilmesi'],
            optionsEn: ['0 MPa', 'Peak stress', 'Yield strength', 'Compressive stress'],
            correctIndex: 0,
            explanationTr: 'Doğru! Nötr eksende ne uzama ne kısalma olur; gerilme tam olarak 0 MPa\'dır.',
            explanationEn: 'Correct! At the neutral plane, strain is zero, resulting in exactly 0 MPa normal stress.'
          }
        ]
      },
      {
        id: 'l-53',
        slug: 'jourawski-transverse-shear-stress',
        number: 53,
        titleTr: '53. Enine Kayma Gerilmesi & Jourawski Formülü',
        titleEn: '53. Transverse Shear (Jourawski)',
        standard: 'Jourawski Formula',
        category: 'Mukavemet',
        difficulty: 'hard',
        iconName: 'Layers',
        xpReward: 35,
        steps: [
          {
            type: 'concept',
            titleTr: 'Jourawski Kayma Akısı Formülü',
            titleEn: 'Jourawski Shear Stress Distribution',
            conceptTr: 'Eğilme anında katmanların birbiri üzerinde kaymasını engelleyen enine kayma gerilmesi $\\tau = \\frac{V \\cdot Q}{I \\cdot b}$ formülü ile hesaplanır. Dikdörtgen kesitte nötr eksende $\\tau_{max} = 1.5 \\cdot V / A$\'dır.',
            conceptEn: 'Transverse shear stress prevents horizontal laminar slipping: τ = (V*Q)/(I*b). For rectangles, peak shear at neutral axis is 1.5*V/A.',
            formula: '\\tau(y) = \\frac{V \\cdot Q(y)}{I \\cdot b(y)}, \\quad \\tau_{\\max,\\text{rect}} = 1.5 \\frac{V}{A}'
          },
          {
            type: 'multiple_choice',
            titleTr: 'Soru 1',
            titleEn: 'Question 1',
            questionTr: 'Dikdörtgen bir kesitte maksimum kayma gerilmesi (τ_max) nerede oluşur?',
            questionEn: 'Where does maximum transverse shear stress (τ_max) occur in a rectangular cross-section?',
            optionsTr: ['Nötr eksende (tam ortada)', 'En üst dış yüzeyde', 'En alt dış yüzeyde', 'Köşelerde'],
            optionsEn: ['At the neutral axis (centerline)', 'At extreme top fiber', 'At extreme bottom fiber', 'At corners'],
            correctIndex: 0,
            explanationTr: 'Doğru! Normal gerilmenin sıfır olduğu nötr eksende birinci alan momenti Q maksimuma ulaşır ve kayma tepe yapar.',
            explanationEn: 'Correct! First moment of area Q peaks at the neutral axis, making shear stress maximum.'
          }
        ]
      },
      {
        id: 'l-54',
        slug: 'euler-bernoulli-deflection-differential-equation',
        number: 54,
        titleTr: '54. Kiriş Diferansiyel Sehim Denklemi',
        titleEn: '54. Beam Deflection Differential Equation',
        standard: 'Euler-Bernoulli',
        category: 'Mukavemet',
        difficulty: 'hard',
        iconName: 'Layers',
        xpReward: 35,
        steps: [
          {
            type: 'concept',
            titleTr: '4. Mertebe Sehim Denklemi',
            titleEn: '4th Order Beam Deflection Equation',
            conceptTr: 'Eğrilik $w\'\' = -M / (EI)$. İki kez integral eğimi ($w\' = \\theta$) ve sehimi ($w$) verir. 4 kez türev ise yayılı yükü ($EI \\frac{d^4 w}{dx^4} = q(x)$) verir.',
            conceptEn: 'Curvature w\'\' = -M / (EI). Integrating twice yields slope and deflection w(x). 4th derivative gives load q(x).',
            formula: 'E I \\frac{d^2 w}{dx^2} = -M(x), \\quad E I \\frac{d^4 w}{dx^4} = q(x)'
          },
          {
            type: 'multiple_choice',
            titleTr: 'Soru 1',
            titleEn: 'Question 1',
            questionTr: 'L boyundaki konsol (ankastre) kirişin serbest ucundaki F yükü altında maksimum sehimi nedir?',
            questionEn: 'What is the maximum tip deflection of a cantilever beam of length L under end load F?',
            optionsTr: ['w = (F L³) / (3 E I)', 'w = (F L³) / (48 E I)', 'w = (F L) / (E I)', 'w = (5 q L⁴) / (384 E I)'],
            optionsEn: ['w = (F L³) / (3 E I)', 'w = (F L³) / (48 E I)', 'w = (F L) / (E I)', 'w = (5 q L⁴) / (384 E I)'],
            correctIndex: 0,
            explanationTr: 'Doğru! Konsol kiriş ucu için w = F L³ / (3 EI).',
            explanationEn: 'Correct! For an end-loaded cantilever, deflection is w = (F*L³) / (3*E*I).'
          }
        ]
      },
      {
        id: 'l-55',
        slug: 'timoshenko-beam-shear-deformation-theory',
        number: 55,
        titleTr: '55. Timoshenko Kalın Kiriş Teorisi',
        titleEn: '55. Timoshenko Thick Beam Theory',
        standard: 'Timoshenko Beam',
        category: 'Mukavemet',
        difficulty: 'hard',
        iconName: 'Layers',
        xpReward: 35,
        steps: [
          {
            type: 'concept',
            titleTr: 'Kalın Kirişlerde Kayma Deformasyonu Etkisi',
            titleEn: 'Shear Deformation in Short Thick Beams',
            conceptTr: 'Euler-Bernoulli teorisi düzlem kesitlerin düzlem kalacağını varsayar. Ancak kısa ve derin kirişlerde ($L/h < 8$) enine kayma deformasyonu ihmal edilemez ve toplam sehim artar.',
            conceptEn: 'Euler-Bernoulli neglects shear strains. For short/deep beams (L/h < 8), Timoshenko theory accounts for shear flexibility.',
            formula: 'w_{\\text{total}} = w_{\\text{bending}} + w_{\\text{shear}} = \\frac{F L^3}{48 E I} + \\frac{F L}{4 k_s G A}'
          },
          {
            type: 'multiple_choice',
            titleTr: 'Soru 1',
            titleEn: 'Question 1',
            questionTr: 'L/h oranı çok küçük olan (derin ve kısa) bir kirişte Euler-Bernoulli sehim hesabı gerçek duruma göre nasıl sonuç verir?',
            questionEn: 'For a deep short beam (small L/h), how does Euler-Bernoulli deflection compare to actual deflection?',
            optionsTr: ['Sehimi olduğundan daha AZ (fazla iyimser) tahmin eder', 'Sehimi çok büyük tahmin eder', 'Tam doğru verir', 'Sıfır verir'],
            optionsEn: ['Underestimates deflection (too stiff / non-conservative)', 'Overestimates', 'Exact', 'Zero'],
            correctIndex: 0,
            explanationTr: 'Doğru! Kayma deformasyonunu ihmal ettiği için Euler-Bernoulli kirişi gerçekte olduğundan daha rijit hesaplar.',
            explanationEn: 'Correct! Neglecting shear deformation leads to underestimating true deflection in deep beams.'
          }
        ]
      },
      {
        id: 'l-56',
        slug: 'shear-center-in-thin-walled-open-sections',
        number: 56,
        titleTr: '56. Kayma Merkezi (Shear Center) & Burulma',
        titleEn: '56. Shear Center in Open Profiles',
        standard: 'Thin-Walled Theory',
        category: 'Mukavemet',
        difficulty: 'hard',
        iconName: 'Layers',
        xpReward: 35,
        steps: [
          {
            type: 'concept',
            titleTr: 'Açık Kesitlerde Burulmasız Eğilme',
            titleEn: 'Torsion-Free Bending in C/U Channels',
            conceptTr: 'C ve U gibi tek eksenli asimetrik açık profillerde yük ağırlık merkezine uygulanırsa profil eğilirken aynı zamanda burulur. Burulmayı önlemek için yük profilin dışındaki "Kayma Merkezi"nden uygulanmalıdır.',
            conceptEn: 'In asymmetric open profiles (C-channels), loading through centroid causes coupled twisting. Force must pass through Shear Center.',
            formula: 'e = \\frac{b}{2 + \\frac{h \\cdot t_w}{3 b \\cdot t_f}} \\quad (\\text{C-Kanalı Kayma Merkezi Ofseti})'
          },
          {
            type: 'multiple_choice',
            titleTr: 'Soru 1',
            titleEn: 'Question 1',
            questionTr: 'U-profil bir kirişin ağırlık merkezinden düşey yük uygulanırsa ne gerçekleşir?',
            questionEn: 'If a vertical load is applied through the centroid of a U-channel beam, what happens?',
            optionsTr: ['Kiriş hem eğilir hem de kendi ekseni etrafında burulur', 'Saf eğilme yapar', 'Hiç sehim yapmaz', 'Kopma gerçekleşir'],
            optionsEn: ['Beam undergoes coupled bending AND twisting', 'Pure bending', 'Zero deflection', 'Instant fracture'],
            correctIndex: 0,
            explanationTr: 'Doğru! Yük kayma merkezinden geçmediği için aradaki ofset mesafesi burulma momenti üretir.',
            explanationEn: 'Correct! Loading away from shear center generates eccentric torque, coupling bending with torsion.'
          }
        ]
      },
      {
        id: 'l-57',
        slug: 'curved-beams-and-winkler-bach-theory',
        number: 57,
        titleTr: '57. Eğrilikli Kirişler (Winkler-Bach)',
        titleEn: '57. Curved Beams (Winkler-Bach)',
        standard: 'Winkler-Bach Theory',
        category: 'Mukavemet',
        difficulty: 'hard',
        iconName: 'Layers',
        xpReward: 35,
        steps: [
          {
            type: 'concept',
            titleTr: 'Hiperbolik Gerilme Dağılımı ve Vinç Kancaları',
            titleEn: 'Hyperbolic Stress Distribution in Hooks',
            conceptTr: 'Vinç kancası veya C-kelepçesi gibi ilk eğriliği olan elemanlarda gerilme doğrusal değil hiperboliktir. Nötr eksen iç eğrilik merkezine doğru kayar ve iç liflerde aşırı gerilme tepe noktası oluşur.',
            conceptEn: 'In curved beams (crane hooks), stress distribution is hyperbolic. The neutral axis shifts toward the center of curvature.',
            formula: '\\sigma_i = \\frac{M}{A \\cdot e} \\left( \\frac{y_i}{R_n - y_i} \\right), \\quad R_n < R_c'
          },
          {
            type: 'multiple_choice',
            titleTr: 'Soru 1',
            titleEn: 'Question 1',
            questionTr: 'Bir vinç kancasında en yüksek çekme gerilmesi kancanın neresinde oluşur?',
            questionEn: 'Where does the highest tensile stress occur in a loaded crane hook?',
            optionsTr: ['En iç yarıçaplı kavisli yüzeyde (inner fiber)', 'En dış yüzeyde', 'Tam ortada', 'Kanca ucunda'],
            optionsEn: ['At the innermost concave radius (inner fiber)', 'Outer fiber', 'Geometric centroid', 'Hook tip'],
            correctIndex: 0,
            explanationTr: 'Doğru! Hiperbolik gerilme artışı nedeniyle iç kavis yüzeyinde aşırı yüksek çekme gerilmesi yığılır.',
            explanationEn: 'Correct! Hyperbolic stress concentration peaks sharply at the innermost concave radius.'
          }
        ]
      },
      {
        id: 'l-58',
        slug: 'mohrs-circle-2d-plane-stress',
        number: 58,
        titleTr: '58. Mohr Çemberi & 2D Düzlem Gerilme',
        titleEn: '58. Mohr\'s Circle & 2D Plane Stress',
        standard: 'Mohr\'s Stress Circle',
        category: 'Mukavemet',
        difficulty: 'hard',
        iconName: 'Compass',
        xpReward: 35,
        steps: [
          {
            type: 'concept',
            titleTr: 'Asal Gerilmeler (σ1, σ2) ve Maksimum Kayma',
            titleEn: 'Principal Stresses & Max In-Plane Shear',
            conceptTr: 'Herhangi bir gerilme durumunda ($\sigma_x, \sigma_y, \tau_{xy}$), kayma gerilmesinin sıfır olduğu asal düzlemlerde asal gerilmeler ($\sigma_1, \sigma_2$) ve maksimum kayma gerilmesi $\tau_{max} = (\sigma_1 - \sigma_2)/2$ oluşur.',
            conceptEn: 'Principal planes have zero shear stress. Principal stresses σ1, σ2 and max in-plane shear τ_max = (σ1 - σ2)/2 are found on Mohr\'s circle.',
            formula: '\\sigma_{1,2} = \\frac{\\sigma_x + \\sigma_y}{2} \\pm \\sqrt{\\left( \\frac{\\sigma_x - \\sigma_y}{2} \\right)^2 + \\tau_{xy}^2}'
          },
          {
            type: 'multiple_choice',
            titleTr: 'Soru 1',
            titleEn: 'Question 1',
            questionTr: 'Saf kayma gerilmesi (σx=0, σy=0, τxy=100 MPa) altındaki bir elemanda asal gerilmeler nedir?',
            questionEn: 'Under pure shear (σx=0, σy=0, τxy=100 MPa), what are the principal stresses?',
            optionsTr: ['σ1 = +100 MPa, σ2 = -100 MPa', 'σ1 = 0, σ2 = 0', 'σ1 = 200 MPa, σ2 = 0', 'σ1 = 50 MPa, σ2 = -50 MPa'],
            optionsEn: ['σ1 = +100 MPa, σ2 = -100 MPa', 'σ1 = 0, σ2 = 0', 'σ1 = 200 MPa, σ2 = 0', 'σ1 = 50 MPa, σ2 = -50 MPa'],
            correctIndex: 0,
            explanationTr: 'Doğru! Saf kaymada 45° açılı asal düzlemlerde +100 MPa çekme ve -100 MPa bası asal gerilmeleri doğar.',
            explanationEn: 'Correct! Pure shear produces equal tension (+100 MPa) and compression (-100 MPa) on 45° planes.'
          }
        ]
      },
      {
        id: 'l-59',
        slug: 'castigliano-theorem-energy-methods',
        number: 59,
        titleTr: '59. Castigliano Teoremi & Enerji Yöntemleri',
        titleEn: '59. Castigliano\'s Theorem (Energy Method)',
        standard: 'Castigliano / Strain Energy',
        category: 'Mukavemet',
        difficulty: 'hard',
        iconName: 'Activity',
        xpReward: 35,
        steps: [
          {
            type: 'concept',
            titleTr: 'Şekil Değiştirme Enerjisi ile Deplasman',
            titleEn: 'Displacement via Strain Energy Derivative',
            conceptTr: 'Sistemin toplam elastik şekil değiştirme enerjisi $U$\'nun herhangi bir $P_i$ noktası yüküne göre kısmi türevi, o noktadaki deplasmanı ($\delta_i$) verir.',
            conceptEn: 'The partial derivative of total strain energy U with respect to applied force Pi gives the displacement δi at that point.',
            formula: '\\delta_i = \\frac{\\partial U}{\\partial P_i}, \\quad U = \\int \\frac{M^2}{2 E I} dx'
          },
          {
            type: 'multiple_choice',
            titleTr: 'Soru 1',
            titleEn: 'Question 1',
            questionTr: 'Castigliano teoremi en çok hangi tür sistemlerin çözümünde büyük kolaylık sağlar?',
            questionEn: 'What type of structural systems are most elegantly solved using Castigliano\'s theorem?',
            optionsTr: ['Statikçe belirsiz (hiperstatik) karmaşık çerçeve ve kemerler', 'Sadece tek yaylı sistemler', 'Sıvı akışkanlar', 'Sürtünmeli frenler'],
            optionsEn: ['Statically indeterminate (hyperstatic) complex frames and arches', 'Single spring systems', 'Fluids', 'Friction brakes'],
            correctIndex: 0,
            explanationTr: 'Doğru! Fazlalık kuvvetler enerji türevi sıfıra eşitlenerek hızla çözülür.',
            explanationEn: 'Correct! Hyperstatic redundant forces are resolved by setting displacement derivatives to zero.'
          }
        ]
      },
      {
        id: 'l-60',
        slug: 'boss-statically-indeterminate-continuous-beam',
        number: 60,
        titleTr: '60. 👑 BOSS SINAVI: Statikçe Belirsiz Kiriş Çözümü',
        titleEn: '60. 👑 BOSS TEST: Indeterminate Continuous Beam Solver',
        standard: 'Hyperstatic Strength',
        category: 'Mukavemet',
        difficulty: 'hard',
        iconName: 'Trophy',
        isBoss: true,
        xpReward: 80,
        steps: [
          {
            type: 'concept',
            titleTr: 'Çift Açıklıklı Sürekli Kiriş Çözümü',
            titleEn: 'Two-Span Continuous Beam Analysis',
            conceptTr: '3 mesnetli sürekli bir kirişte statik denge denklemleri mesnet tepkilerini çözmeye yetmez. Uygunluk denklemi (mesnet çökme sıfır şartı) kullanılarak orta mesnet tepkisi $B_y = \\frac{10}{8} q L$ bulunur.',
            conceptEn: 'In a 3-support beam, static equations are insufficient. Compatibility condition yields center reaction By = (10/8)*qL.',
            formula: 'B_y = \\frac{10}{8} q L = 1.25 q L \\quad (\\text{Orta Mesnet Tepkisi})'
          },
          {
            type: 'multiple_choice',
            titleTr: 'Boss Sorusu',
            titleEn: 'Boss Question',
            questionTr: 'İki açıklığı da eşit ve düzgün yayılı q yükü taşıyan 3 mesnetli sürekli kirişte orta mesnet üzerindeki moment nedir?',
            questionEn: 'In an equal two-span continuous beam with uniform load q, what is the bending moment over the center support?',
            optionsTr: ['M = - (q L²) / 8', 'M = 0', 'M = + (q L²) / 4', 'M = (q L²) / 2'],
            optionsEn: ['M = - (q L²) / 8', 'M = 0', 'M = + (q L²) / 4', 'M = (q L²) / 2'],
            correctIndex: 0,
            explanationTr: 'Tebrikler! Orta mesnet üzerinde negatif (çekme üstte) moment M = -qL²/8 oluşur!',
            explanationEn: 'Congratulations! Center continuous support develops negative hogging moment M = -(q*L²)/8.'
          }
        ]
      }
    ]
  },

  // ─── ÜNİTE 7 (61 - 70): BURKULMA & KARARSIZLIK ───
  {
    id: 'unit-7',
    number: 7,
    titleTr: 'Ünite 7: Elastik Kararsızlık & Kolon Burkulması',
    titleEn: 'Unit 7: Elastic Instability & Column Buckling',
    descriptionTr: 'Euler kritik yükü, narinlik oranı, Johnson-Tetmajer yaklaşımı ve yanal burulmalı burkulma.',
    descriptionEn: 'Euler buckling load, slenderness ratio, inelastic column behavior, and lateral torsional buckling.',
    gradient: 'from-teal-600 to-emerald-600',
    difficulty: 'expert',
    accentColor: '#14b8a6',
    lessons: [
      {
        id: 'l-61',
        slug: 'euler-column-buckling-fundamentals',
        number: 61,
        titleTr: '61. Euler Kolon Burkulma Teorisi',
        titleEn: '61. Euler Column Buckling Fundamentals',
        standard: 'Euler Buckling',
        category: 'Burkulma',
        difficulty: 'medium',
        iconName: 'Activity',
        xpReward: 30,
        steps: [
          {
            type: 'concept',
            titleTr: 'Elastik Kararsızlık ve Euler Kritik Yükü',
            titleEn: 'Elastic Instability & Critical Load',
            conceptTr: 'Bası altındaki narin kolonlar malzeme akma sınırına varmadan aniden yana doğru bükülerek göçer. Euler kritik yükü $P_{cr} = \\pi^2 E I / L_e^2$\'dir.',
            conceptEn: 'Slender compressive columns buckle elastically before yielding. Euler critical load is Pcr = π²*E*I / Le².',
            formula: 'P_{cr} = \\frac{\\pi^2 E \\cdot I}{L_e^2}, \\quad L_e = K \\cdot L'
          },
          {
            type: 'multiple_choice',
            titleTr: 'Soru 1',
            titleEn: 'Question 1',
            questionTr: 'Kolon boyu (L) iki katına çıkarılırsa Euler kritik burkulma yükü (Pcr) nasıl değişir?',
            questionEn: 'If column length (L) is doubled, by what factor does Euler critical buckling load change?',
            optionsTr: ['4 katına iner (1/4)', 'Yarıya iner (1/2)', '8 katına iner', 'Değişmez'],
            optionsEn: ['Drops to 1/4 (quartered)', 'Halved (1/2)', 'Drops to 1/8', 'No change'],
            correctIndex: 0,
            explanationTr: 'Doğru! Formülde L² paydada olduğu için boy 2 katına çıkınca taşıma kapasitesi 1/4\'e düşer!',
            explanationEn: 'Correct! Due to 1/L² relationship, doubling length cuts critical load to 25% (1/4).'
          }
        ]
      },
      {
        id: 'l-62',
        slug: 'slenderness-ratio-and-radius-of-gyration',
        number: 62,
        titleTr: '62. Narinlik Oranı (λ) & Atalet Yarıçapı (i)',
        titleEn: '62. Slenderness Ratio & Radius of Gyration',
        standard: 'DIN EN 1993',
        category: 'Burkulma',
        difficulty: 'hard',
        iconName: 'Activity',
        xpReward: 35,
        steps: [
          {
            type: 'concept',
            titleTr: 'Narinlik Oranı Hesabı',
            titleEn: 'Slenderness Ratio Definition',
            conceptTr: 'Atalet yarıçapı $i = \\sqrt{I / A}$. Narinlik oranı $\\lambda = L_e / i$. Narinlik $\\lambda > \\lambda_{lim} \\approx 105$ (çelik için) ise Euler elastik formülü geçerlidir.',
            conceptEn: 'Radius of gyration i = sqrt(I/A). Slenderness ratio λ = Le / i. For λ > 105 (mild steel), Euler elastic theory holds.',
            formula: 'i = \\sqrt{\\frac{I}{A}}, \\quad \\lambda = \\frac{K \\cdot L}{i}, \\quad \\sigma_{cr} = \\frac{\\pi^2 E}{\\lambda^2}'
          },
          {
            type: 'multiple_choice',
            titleTr: 'Soru 1',
            titleEn: 'Question 1',
            questionTr: 'Kare kesit ile daire kesit aynı alana sahipse hangisinin atalet yarıçapı (i) ve burkulma direnci daha yüksektir?',
            questionEn: 'Between a square and circular section of equal area, which has higher radius of gyration (i)?',
            optionsTr: ['Kare kesit (malzeme eksenden daha uzakta)', 'Daire kesit', 'İkisi de eşittir', 'Kesit fark etmez'],
            optionsEn: ['Square section (material distributed further from axis)', 'Circle', 'Exactly equal', 'Irrelevant'],
            correctIndex: 0,
            explanationTr: 'Doğru! Eşit alanda kare kesitin köşeleri atalet momentini artırarak daha yüksek i yarıçapı sağlar.',
            explanationEn: 'Correct! Square corners place area further from centroid, yielding ~4% higher gyration radius.'
          }
        ]
      },
      {
        id: 'l-63',
        slug: 'boundary-condition-factors-k-in-columns',
        number: 63,
        titleTr: '63. Uç Mesnet Koşulları (K Faktörü)',
        titleEn: '63. End Condition Factor (K Factor)',
        standard: 'ISO Structural',
        category: 'Burkulma',
        difficulty: 'medium',
        iconName: 'Compass',
        xpReward: 30,
        steps: [
          {
            type: 'concept',
            titleTr: '4 Klasik Euler Uç Koşulu',
            titleEn: '4 Classical Euler Boundary Conditions',
            conceptTr: '1) Mafsallı-Mafsallı: K = 1.0; 2) Ankastre-Ankastre: K = 0.5; 3) Ankastre-Mafsallı: K = 0.7; 4) Konsol (Serbest Uç): K = 2.0.',
            conceptEn: '1) Pinned-Pinned: K=1.0; 2) Fixed-Fixed: K=0.5; 3) Fixed-Pinned: K=0.7; 4) Fixed-Free (Cantilever): K=2.0.',
            formula: 'K_{\\text{Fixed-Fixed}} = 0.5 \\implies P_{cr} = 4 \\times P_{cr,\\text{pinned}}'
          },
          {
            type: 'multiple_choice',
            titleTr: 'Soru 1',
            titleEn: 'Question 1',
            questionTr: 'Bir ucu ankastre diğer ucu tamamen serbest olan konsol kolonun K katsayısı nedir?',
            questionEn: 'What is the effective length factor K for a cantilever column (fixed at base, free at top)?',
            optionsTr: ['K = 0.5', 'K = 1.0', 'K = 2.0 (Taşıma kapasitesi 4 kat düşer)', 'K = 0.7'],
            optionsEn: ['K = 0.5', 'K = 1.0', 'K = 2.0 (Capacity drops by 4x)', 'K = 0.7'],
            correctIndex: 2,
            explanationTr: 'Doğru! Konsol kolonda K = 2.0 olup etkin burkulma boyu kolonun gerçek boyunun iki katıdır.',
            explanationEn: 'Correct! Fixed-free cantilever columns exhibit K = 2.0, doubling the effective buckling length.'
          }
        ]
      },
      {
        id: 'l-64',
        slug: 'inelastic-buckling-tetmajer-and-johnson',
        number: 64,
        titleTr: '64. Plastik Burkulma (Tetmajer & Johnson)',
        titleEn: '64. Inelastic Buckling (Tetmajer & Johnson)',
        standard: 'Tetmajer / Johnson Parabolic',
        category: 'Burkulma',
        difficulty: 'hard',
        iconName: 'Activity',
        xpReward: 35,
        steps: [
          {
            type: 'concept',
            titleTr: 'Kısa ve Orta Boy Kolonlarda Akma Etkisi',
            titleEn: 'Inelastic Range for Short/Intermediate Columns',
            conceptTr: 'Narinlik $\lambda < \lambda_{lim}$ olduğunda kolon elastik Euler formülüne göre değil, malzemenin akmasıyla birlikte plastik olarak burkulur (Johnson parabolik formülü: $\sigma_{cr} = S_y - \frac{S_y^2}{4 \pi^2 E} \lambda^2$).',
            conceptEn: 'For intermediate columns (λ < λ_limit), buckling is inelastic. Johnson parabolic formula governs critical stress.',
            formula: '\\sigma_{cr} = R_{p0.2} \\left[ 1 - \\frac{R_{p0.2} \\cdot \\lambda^2}{4 \\pi^2 E} \\right]'
          },
          {
            type: 'multiple_choice',
            titleTr: 'Soru 1',
            titleEn: 'Question 1',
            questionTr: 'Çok kısa ve kalın bir bası çubuğunda (narinlik λ < 20) göçme modu nedir?',
            questionEn: 'In a very short and stocky compression block (λ < 20), what is the governing failure mode?',
            optionsTr: ['Doğrudan malzeme plastik akması / ezilme', 'Euler elastik burkulması', 'Yorulma', 'Rezonans'],
            optionsEn: ['Direct material plastic yield / crushing', 'Euler elastic buckling', 'Fatigue', 'Resonance'],
            correctIndex: 0,
            explanationTr: 'Doğru! Düşük narinlikte kolon burkulmaz, doğrudan akma dayanımına (Sy) ulaşıp ezilir.',
            explanationEn: 'Correct! At very low slenderness, instability cannot occur; failure is pure material compressive yielding.'
          }
        ]
      },
      {
        id: 'l-65',
        slug: 'beam-columns-secant-formula',
        number: 65,
        titleTr: '65. Kiriş-Kolonlar & Sekant Formülü',
        titleEn: '65. Beam-Columns & Secant Formula',
        standard: 'Secant Formula',
        category: 'Burkulma',
        difficulty: 'hard',
        iconName: 'Layers',
        xpReward: 35,
        steps: [
          {
            type: 'concept',
            titleTr: 'Eksantrik Yükleme ve İkinci Mertebe P-Delta Etkisi',
            titleEn: 'Eccentric Loading & P-Delta Effect',
            conceptTr: 'Eksenel bası kuvveti $P$ eksenden $e$ kadar kaçık uygulandığında bir ek moment ($P \\cdot e$) doğar. Sekant formülü eksantrisite altındaki maksimum gerilmeyi hesaplar.',
            conceptEn: 'Eccentric load P applied at distance e creates bending moment P*e, amplified by deflection (P-Delta effect).',
            formula: '\\sigma_{\\max} = \\frac{P}{A} \\left[ 1 + \\frac{e \\cdot c}{i^2} \\sec\\left( \\frac{L}{2 i} \\sqrt{\\frac{P}{E A}} \\right) \\right]'
          },
          {
            type: 'multiple_choice',
            titleTr: 'Soru 1',
            titleEn: 'Question 1',
            questionTr: 'P-Delta (P-Δ) etkisi neyi ifade eder?',
            questionEn: 'What does the structural P-Delta (P-Δ) effect describe?',
            optionsTr: ['Eksenel bası yükünün oluşan sehimle çarpılarak ek moment üretmesini', 'Hızın karesiyle artan sürtünmeyi', 'Isıl genleşmeyi', 'Tork artışını'],
            optionsEn: ['Axial load multiplying lateral deflection to generate secondary bending moments', 'Velocity squared drag', 'Thermal growth', 'Torque rise'],
            correctIndex: 0,
            explanationTr: 'Doğru! Eksenel kuvvet sehimi artırır, artan sehim momenti büyütür (2. mertebe geometrik lineer olmayan etki).',
            explanationEn: 'Correct! Axial load amplifies lateral deflections, creating non-linear geometric secondary moments.'
          }
        ]
      },
      {
        id: 'l-66',
        slug: 'lateral-torsional-buckling-ltb',
        number: 66,
        titleTr: '66. Yanal Burulmalı Burkulma (LTB)',
        titleEn: '66. Lateral Torsional Buckling (LTB)',
        standard: 'Eurocode 3 / AISC 360',
        category: 'Burkulma',
        difficulty: 'expert',
        iconName: 'Activity',
        xpReward: 40,
        steps: [
          {
            type: 'concept',
            titleTr: 'Yüksek I-Profillerinde Yanal Kararsızlık',
            titleEn: 'Lateral-Torsional Instability in Deep I-Beams',
            conceptTr: 'Yüksekliği genişliğinden çok büyük olan I-kirişler eğilirken üst bası başlığı yana kaçmaya ve kiriş burulmaya zorlanır. Bu durum kritik elastik moment $M_{cr}$ ile sınırlandırılır.',
            conceptEn: 'Deep slender I-beams under major axis bending undergo coupled lateral displacement and twist of the compression flange at Mcr.',
            formula: 'M_{cr} = \\frac{\\pi}{L} \\sqrt{E I_y G I_t + \\left( \\frac{\\pi E}{L} \\right)^2 I_y I_w}'
          },
          {
            type: 'multiple_choice',
            titleTr: 'Soru 1',
            titleEn: 'Question 1',
            questionTr: 'Çelik bir I-kirişte yanal burulmalı burkulmayı (LTB) engellemenin en pratik yolu nedir?',
            questionEn: 'What is the most effective engineering method to prevent Lateral Torsional Buckling in I-beams?',
            optionsTr: ['Üst bası başlığını belirli aralıklarla yanal mesnetlerle (çapraz bağlarla) tutturmak', 'Kirişi boyamak', 'Yükü iki katına çıkarmak', 'Alt başlığı kalınlaştırmak'],
            optionsEn: ['Providing intermediate lateral bracing to the compression flange', 'Painting the beam', 'Doubling load', 'Thickening bottom flange'],
            correctIndex: 0,
            explanationTr: 'Doğru! Bası başlığına atılan yanal ara çaprazlar (bracing) etkin boyu küçülterek LTB\'yi tamamen engeller.',
            explanationEn: 'Correct! Lateral bracing restrains compression flange movement, dramatically elevating Mcr.'
          }
        ]
      },
      {
        id: 'l-67',
        slug: 'local-buckling-of-thin-plates',
        number: 67,
        titleTr: '67. İnce Levhalarda Yerel Burkulma (Local Buckling)',
        titleEn: '67. Local Buckling of Thin Plates',
        standard: 'Bryan Plate Buckling Formula',
        category: 'Burkulma',
        difficulty: 'expert',
        iconName: 'Layers',
        xpReward: 40,
        steps: [
          {
            type: 'concept',
            titleTr: 'Bryan Plaka Burkulma Formülü',
            titleEn: 'Bryan Thin Plate Buckling Equation',
            conceptTr: 'İnce cidarlı kutu profiller ve I-profil gövdeleri kalınlık/genişlik oranı ($t/b$) küçük olduğunda yerel kırışma (local buckling) yaşar. Kritik plaka gerilmesi $\\sigma_{cr} = k_\\sigma \\frac{\\pi^2 E}{12(1-\\nu^2)} (t/b)^2$\'dir.',
            conceptEn: 'Thin plates under in-plane compression buckle into local waves governed by Bryan\'s formula with plate buckling coefficient kσ.',
            formula: '\\sigma_{cr} = k_\\sigma \\frac{\\pi^2 E}{12 (1 - \\nu^2)} \\left( \\frac{t}{b} \\right)^2'
          },
          {
            type: 'multiple_choice',
            titleTr: 'Soru 1',
            titleEn: 'Question 1',
            questionTr: 'Levha et kalınlığı (t) iki katına çıkarılırsa yerel burkulma dayanımı kaç katına çıkar?',
            questionEn: 'If plate thickness (t) is doubled, by what factor does local buckling resistance increase?',
            optionsTr: ['4 katına (t²)', '2 katına', '8 katına', '16 katına'],
            optionsEn: ['4x (t²)', '2x', '8x', '16x'],
            correctIndex: 0,
            explanationTr: 'Doğru! (t/b)² terimi nedeniyle kalınlık iki katına çıktığında dayanım tam 4 kat artar.',
            explanationEn: 'Correct! Due to the (t/b)² squared dependence, doubling thickness increases capacity by 4x.'
          }
        ]
      },
      {
        id: 'l-68',
        slug: 'buckling-under-external-pressure-cylinders',
        number: 68,
        titleTr: '68. Dış Basınç Altında Boru & Halka Burkulması',
        titleEn: '68. External Pressure Cylinder Buckling',
        standard: 'ASME Section VIII Div 1',
        category: 'Burkulma',
        difficulty: 'expert',
        iconName: 'CircleDot',
        xpReward: 40,
        steps: [
          {
            type: 'concept',
            titleTr: 'Vakum ve Dış Hidrostatik Basınç Çökmesi',
            titleEn: 'Collapse Under External Hydrostatic Pressure',
            conceptTr: 'İç basınç boruyu germeye çalışırken (stabil), dış basınç boru çeperini içe doğru burulup çökmeye (collapse) zorlar. Kritik çökme basıncı $P_{ext,cr} = \\frac{2 E}{1-\\nu^2} (t/D)^3$\'tür.',
            conceptEn: 'External pressure induces compressive hoop stresses, causing catastrophic ovalization collapse at critical pressure Pcr.',
            formula: 'P_{cr} = \\frac{2 E}{1 - \\nu^2} \\left( \\frac{t}{D_m} \\right)^3'
          },
          {
            type: 'multiple_choice',
            titleTr: 'Soru 1',
            titleEn: 'Question 1',
            questionTr: 'Denizaltı gövdeleri ve vakum tanklarında dış basınç çökmesini engellemek için ne eklenir?',
            questionEn: 'What structural element is welded inside vacuum vessels and submarines to prevent external pressure collapse?',
            optionsTr: ['Çevresel takviye halkaları (stiffener rings)', 'Daha fazla boya', 'İç delikler', 'Plastik astar'],
            optionsEn: ['Circumferential stiffener rings', 'Extra paint', 'Perforations', 'Plastic liner'],
            correctIndex: 0,
            explanationTr: 'Doğru! Takviye halkaları serbest burkulma boyunu kısaltarak kritik çökme basıncını kat kat artırır.',
            explanationEn: 'Correct! Circumferential stiffener rings break the cylinder into short lengths, multiplying buckling resistance.'
          }
        ]
      },
      {
        id: 'l-69',
        slug: 'post-buckling-strength-and-tension-field',
        number: 69,
        titleTr: '69. Burkulma Sonrası Dayanım & Çekme Alanı (Wagner)',
        titleEn: '69. Post-Buckling & Tension Field Action',
        standard: 'Wagner Tension Field (NACA)',
        category: 'Havacılık',
        difficulty: 'expert',
        iconName: 'Activity',
        xpReward: 40,
        steps: [
          {
            type: 'concept',
            titleTr: 'Havacılık İnce Saclarında Burkulma Sonrası Taşıma',
            titleEn: 'Post-Buckling Capacity in Aircraft Webs',
            conceptTr: 'İnce alüminyum uçak gövde sacları kayma altında burkulsa bile kopmaz; köşegen doğrultuda bir çekme alanı (tension field) oluşturarak kafes kiriş gibi yük taşımaya devam eder.',
            conceptEn: 'Thin aircraft shear webs buckle into diagonal wrinkles but continue carrying large loads via Wagner tension field action.',
            formula: '\\tau_{\\text{ultimate}} = \\tau_{cr} + \\sigma_{\\text{tension field}} \\cdot \\sin(\\alpha) \\cos(\\alpha)'
          },
          {
            type: 'multiple_choice',
            titleTr: 'Soru 1',
            titleEn: 'Question 1',
            questionTr: 'Havacılık yapılarında sacların ilk elastik burkulmasına izin verilmesinin temel sebebi nedir?',
            questionEn: 'Why do aerospace structures intentionally permit post-buckling behavior in shear webs?',
            optionsTr: ['Aşırı hafif ve yüksek mukavemetli yapılar elde etmek', 'İmalatı kolaylaştırmak', 'Sürtünmeyi azaltmak', 'Maliyeti sıfırlamak'],
            optionsEn: ['Achieving ultra-lightweight high-efficiency structures', 'Easier assembly', 'Aerodynamic drag reduction', 'Zero cost'],
            correctIndex: 0,
            explanationTr: 'Doğru! Burkulma sonrası çekme alanından yararlanmak uçak yapılarında tonlarca ağırlık tasarrufu sağlar.',
            explanationEn: 'Correct! Utilizing post-buckling reserve strength saves massive structural weight in aircraft fuselages.'
          }
        ]
      },
      {
        id: 'l-70',
        slug: 'boss-aerospace-stiffened-panel-buckling',
        number: 70,
        titleTr: '70. 👑 BOSS SINAVI: Havacılık Takviyeli Panel Burkulması',
        titleEn: '70. 👑 BOSS TEST: Aerospace Stiffened Panel Verification',
        standard: 'NASA-SP-8007 / MIL-HDBK-5',
        category: 'Havacılık & Mukavemet',
        difficulty: 'expert',
        iconName: 'Trophy',
        isBoss: true,
        xpReward: 85,
        steps: [
          {
            type: 'concept',
            titleTr: 'Bileşik Yerel ve Genel Panel Burkulması',
            titleEn: 'Coupled Skin and Stringer Buckling',
            conceptTr: 'Takviyeli bir uçak kanat panelinde 3 aşamalı denetim yapılır: 1) Sac yerel burkulması (skin wrinkling), 2) Takviye kirişi burkulması (stringer buckling), 3) Genel panel burkulması (global orthotropic buckling).',
            conceptEn: 'Verification checks: 1) Skin local sheet buckling, 2) Stringer column/torsional crippling, 3) Global orthotropic panel collapse.',
            formula: '\\left( \\frac{\\sigma}{\\sigma_{cr}} \\right) + \\left( \\frac{\\tau}{\\tau_{cr}} \\right)^2 \\le 1.0 \\quad (\\text{Etkileşim Eğrisi})'
          },
          {
            type: 'multiple_choice',
            titleTr: 'Boss Sorusu',
            titleEn: 'Boss Question',
            questionTr: 'Bası ve kayma gerilmesinin bir arada olduğu havacılık panelinde burkulma emniyet sınırı etkileşim formülü nasıldır?',
            questionEn: 'Under combined normal compression (σ) and shear (τ), what interaction criterion dictates panel buckling?',
            optionsTr: ['(σ/σcr) + (τ/τcr)² ≤ 1.0', '(σ + τ) = 0', 'σ / τ = 1', 'σ² + τ² = 0'],
            optionsEn: ['(σ/σcr) + (τ/τcr)² ≤ 1.0', '(σ + τ) = 0', 'σ / τ = 1', 'σ² + τ² = 0'],
            correctIndex: 0,
            explanationTr: 'Tebrikler! Bası doğrusal, kayma ise karesel olarak burkulmayı tetikler ((σ/σcr) + (τ/τcr)² ≤ 1.0).',
            explanationEn: 'Congratulations! Classical combined stability interaction uses linear compression plus quadratic shear.'
          }
        ]
      }
    ]
  },

  // ─── ÜNİTE 8 (71 - 80): SAC METAL & İMALAT ───
  {
    id: 'unit-8',
    number: 8,
    titleTr: 'Ünite 8: Sac Metal, Büküm & İmalat Teknolojisi',
    titleEn: 'Unit 8: Sheet Metal, Bending & Manufacturing',
    descriptionTr: 'DIN 6935 büküm açınımı, K-faktörü, geri esneme (springback) ve talaş kaldırma mekaniği.',
    descriptionEn: 'DIN 6935 bend allowance, neutral axis shift, springback compensation, and chip formation mechanics.',
    gradient: 'from-amber-500 to-orange-600',
    difficulty: 'expert',
    accentColor: '#f59e0b',
    lessons: [
      {
        id: 'l-71',
        slug: 'din6935-sheet-metal-bend-allowance',
        number: 71,
        titleTr: '71. DIN 6935 Sac Büküm Açınımı & Büküm Payı (BA)',
        titleEn: '71. DIN 6935 Sheet Bend Allowance (BA)',
        standard: 'DIN 6935',
        category: 'Sac Metal',
        difficulty: 'medium',
        iconName: 'Layers',
        xpReward: 30,
        steps: [
          {
            type: 'concept',
            titleTr: 'Büküm Payı (Bend Allowance) Formülü',
            titleEn: 'Bend Allowance Calculation',
            conceptTr: 'Sac büküldüğünde nötr eksen boyunca boy uzaması $BA = \\frac{\\pi \\cdot \\alpha}{180} (R_i + K \\cdot t)$ formülüyle hesaplanır. Lazer kesim açınım boyu $L = A + B - BD$ ile bulunur.',
            conceptEn: 'Bend allowance along the neutral axis is BA = (π*α/180)*(Ri + K*t). Flat pattern length is L = FlangeA + FlangeB - Setback.',
            formula: 'BA = \\frac{\\pi \\cdot \\alpha}{180} \\left( R_i + K \\cdot t \\right), \\quad BD = 2 (R_i + t) \\tan\\left(\\frac{\\alpha}{2}\\right) - BA'
          },
          {
            type: 'multiple_choice',
            titleTr: 'Soru 1',
            titleEn: 'Question 1',
            questionTr: 't = 2 mm sac, Ri = 2 mm iç radyus, K = 0.40 ve α = 90° bükümde Büküm Payı (BA) yaklaşık kaç mm\'dir?',
            questionEn: 'For t=2mm, Ri=2mm, K=0.40, and 90° bend, what is the approximate Bend Allowance (BA)?',
            optionsTr: ['4.40 mm', '2.80 mm', '6.28 mm', '1.00 mm'],
            optionsEn: ['4.40 mm', '2.80 mm', '6.28 mm', '1.00 mm'],
            correctIndex: 0,
            explanationTr: 'Doğru! BA = (π x 90 / 180) x (2 + 0.40 x 2) = (1.5708) x (2 + 0.8) = 1.5708 x 2.8 ≈ 4.40 mm.',
            explanationEn: 'Correct! BA = (π*90/180) * (2 + 0.4*2) = 1.5708 * 2.8 ≈ 4.40 mm.'
          }
        ]
      },
      {
        id: 'l-72',
        slug: 'k-factor-and-neutral-axis-shift',
        number: 72,
        titleTr: '72. K-Faktörü ve Nötr Eksen Kayması',
        titleEn: '72. K-Factor & Neutral Axis Shift',
        standard: 'DIN 6935',
        category: 'Sac Metal',
        difficulty: 'medium',
        iconName: 'Layers',
        xpReward: 30,
        steps: [
          {
            type: 'concept',
            titleTr: 'K-Faktörünün Fiziksel Anlamı',
            titleEn: 'Physical Significance of K-Factor',
            conceptTr: 'K-faktörü, büküm anında boyu hiç değişmeyen nötr eksenin sacın iç yüzeyine olan mesafesinin sac kalınlığına ($t$) oranıdır ($K = t_{in} / t$). Genellikle $0.30 \\le K \\le 0.50$ aralığındadır.',
            conceptEn: 'K-factor represents the shifted position of the neutral axis relative to material thickness (K = distance_from_inner_face / t).',
            formula: 'K = \\frac{y_{\\text{neutral}}}{t} \\quad (0.33 \\le K \\le 0.50)'
          },
          {
            type: 'multiple_choice',
            titleTr: 'Soru 1',
            titleEn: 'Question 1',
            questionTr: 'Büküm iç radyusu sac kalınlığına göre çok büyükse (Ri >> t) K-faktörü hangi değere yaklaşır?',
            questionEn: 'When the bend inner radius is very large compared to thickness (Ri >> t), what value does K-factor approach?',
            optionsTr: ['0.50 (Tam merkeze)', '0.10', '1.00', '0.00'],
            optionsEn: ['0.50 (Exact centerline)', '0.10', '1.00', '0.00'],
            correctIndex: 0,
            explanationTr: 'Doğru! Geniş radyuslu bükümlerde plastik akma simetrikleşir ve nötr eksen tam sacın ortasına ($K=0.50$) oturur.',
            explanationEn: 'Correct! For large bend radii, strain distribution is nearly linear, shifting the neutral axis to the centerline (K=0.50).'
          }
        ]
      },
      {
        id: 'l-73',
        slug: 'springback-mechanisms-and-angle-compensation',
        number: 73,
        titleTr: '73. Geri Esneme (Springback) & Açı Telafisi',
        titleEn: '73. Springback Mechanisms & Compensation',
        standard: 'VDI 3388',
        category: 'Sac Metal',
        difficulty: 'hard',
        iconName: 'Activity',
        xpReward: 35,
        steps: [
          {
            type: 'concept',
            titleTr: 'Elastik Geri Yaylanma Oranı',
            titleEn: 'Elastic Springback Ratio',
            conceptTr: 'Büküm zımbası geri çekildiğinde dış liflerdeki elastik gerilmeler sacı geriye doğru açar. Yüksek akma dayanımlı çeliklerde ve büyük radyuslarda geri esneme açısı ($\Delta\theta$) çok daha büyüktür.',
            conceptEn: 'Release of bending punch causes residual elastic stress to spring the flange back. High-strength alloys exhibit large springback angles.',
            formula: '\\frac{R_i}{R_f} = 4 \\left( \\frac{R_i \\cdot S_y}{E \\cdot t} \\right)^3 - 3 \\left( \\frac{R_i \\cdot S_y}{E \\cdot t} \\right) + 1'
          },
          {
            type: 'multiple_choice',
            titleTr: 'Soru 1',
            titleEn: 'Question 1',
            questionTr: '90° büküm sonrasında 3° geri esneme yapan bir sac için pres freni kalıbında açı nasıl ayarlanmalıdır?',
            questionEn: 'For a sheet metal part with 3° elastic springback, to what angle should the press brake tool be overbent for a 90° finished flange?',
            optionsTr: ['87° (Aşırı büküm / Overbending)', '93°', '90°', '45°'],
            optionsEn: ['87° (Overbending)', '93°', '90°', '45°'],
            correctIndex: 0,
            explanationTr: 'Doğru! 87°\'ye kadar aşırı bükülür; pres çekildiğinde 3° geri açılarak tam 90° elde edilir.',
            explanationEn: 'Correct! Overbending to 87° allows the part to spring back exactly 3° to achieve the final 90° angle.'
          }
        ]
      },
      {
        id: 'l-74',
        slug: 'minimum-bend-radius-and-grain-direction',
        number: 74,
        titleTr: '74. Minimum Büküm Radyusu (Rmin) & Hadde Yönü',
        titleEn: '74. Minimum Bend Radius & Grain Direction',
        standard: 'DIN 6935 Table 2',
        category: 'Sac Metal',
        difficulty: 'medium',
        iconName: 'Wrench',
        xpReward: 30,
        steps: [
          {
            type: 'concept',
            titleTr: 'Hadde Yönü ve Dış Yüzey Çatlaması',
            titleEn: 'Grain Direction and Flange Cracking',
            conceptTr: 'Saclar haddelenme yönüne paralel büküldüğünde dış liflerde çatlama riski çok yüksektir. Büküm ekseni hadde liflerine dik ($90^\\circ$) veya $45^\\circ$ açılı olmalıdır.',
            conceptEn: 'Bending parallel to grain orientation risks outer fiber cracking. Bends should be perpendicular (90°) or diagonal (45°) to grain.',
            formula: 'R_{\\min} \\ge 1.0 \\cdot t \\quad (\\text{Al 6061-T6 için } \\ge 2.5 t)'
          },
          {
            type: 'multiple_choice',
            titleTr: 'Soru 1',
            titleEn: 'Question 1',
            questionTr: 'Sert temperli Alüminyum 6061-T6 sacı R = 0.5 mm keskin bıçakla 90° bükmeye çalışırsak ne olur?',
            questionEn: 'What happens when attempting a 90° bend on hard-temper Aluminum 6061-T6 with a sharp R=0.5mm punch?',
            optionsTr: ['Dış büküm yüzeyinde derin yırtılma ve çatlak oluşur', 'Mükemmel bükülür', 'Sac erir', 'Tolerans sıfır olur'],
            optionsEn: ['Severe outer surface cracking and tearing occurs', 'Bends perfectly', 'Melts', 'Zero tolerance'],
            correctIndex: 0,
            explanationTr: 'Doğru! 6061-T6 düşük sünekliğe sahiptir ve en az R_min ≥ 2.5*t büküm radyusu gerektirir.',
            explanationEn: 'Correct! 6061-T6 has low ductility and cracks if bent below R_min ≥ 2.5*t.'
          }
        ]
      },
      {
        id: 'l-75',
        slug: 'laser-plasma-and-waterjet-cutting-iso9013',
        number: 75,
        titleTr: '75. Lazer, Plazma & Su Jeti Kesim (ISO 9013)',
        titleEn: '75. Thermal & Waterjet Cutting (ISO 9013)',
        standard: 'ISO 9013',
        category: 'İmalat',
        difficulty: 'medium',
        iconName: 'Wrench',
        xpReward: 30,
        steps: [
          {
            type: 'concept',
            titleTr: 'Kesim Yöntemleri ve Isıdan Etkilenen Bölge (HAZ)',
            titleEn: 'Cutting Processes & Heat Affected Zone (HAZ)',
            conceptTr: 'Fiber Lazer yüksek hız ve dar tolerans sunar. Su Jeti sıfır termal gerilme ve sıfır HAZ ile kalın kompozit ve alüminyum için idealdir. Plazma kalın çelik plakalarda ekonomiktir.',
            conceptEn: 'Fiber laser offers high precision. Abrasive waterjet introduces zero heat affected zone (HAZ). Plasma cuts thick structural plates economically.',
            formula: '\\text{ISO 9013: Perpendicularity & Surface Roughness Range 1-5}'
          },
          {
            type: 'multiple_choice',
            titleTr: 'Soru 1',
            titleEn: 'Question 1',
            questionTr: 'Havacılık sınıfı titanyum veya karbon fiber kompozit plakalarda sıfır ısı etkisiyle kesim için hangi yöntem zorunludur?',
            questionEn: 'Which cutting process is mandatory for aerospace titanium or carbon composites to guarantee zero thermal degradation (no HAZ)?',
            optionsTr: ['Aşındırıcılı Su Jeti (Abrasive Waterjet)', 'Oksijenli alev kesme', 'Plazma kesim', 'Hızlı sürtünme testeresi'],
            optionsEn: ['Abrasive Waterjet Cutting', 'Oxy-fuel flame', 'Plasma torch', 'Friction saw'],
            correctIndex: 0,
            explanationTr: 'Doğru! Su jeti soğuk bir talaş kaldırma süreci olduğu için mikro yapısal faz dönüşümü ve ısıl çatlak yaratmaz.',
            explanationEn: 'Correct! Abrasive waterjet is a cold supersonic erosion process, avoiding all thermal microstructural damage.'
          }
        ]
      },
      {
        id: 'l-76',
        slug: 'merchants-circle-metal-cutting-mechanics',
        number: 76,
        titleTr: '76. Talaş Kaldırma Mekaniği & Merchant Çemberi',
        titleEn: '76. Metal Cutting Mechanics (Merchant Circle)',
        standard: 'Merchant Orthogonal Cutting',
        category: 'Talaşlı İmalat',
        difficulty: 'hard',
        iconName: 'Activity',
        xpReward: 35,
        steps: [
          {
            type: 'concept',
            titleTr: 'Kayma Düzlemi Açısı (ϕ) ve Kesme Kuvveti (Fc)',
            titleEn: 'Shear Plane Angle & Cutting Force',
            conceptTr: 'Merchant teorisinde kayma düzlemi açısı $\\phi = 45^\\circ + \\alpha/2 - \\beta/2$\'dir. Kesme kuvveti $F_c = F_s \\cos(\\beta - \\alpha) / \\cos(\\phi + \\beta - \\alpha)$ ile hesaplanır.',
            conceptEn: 'Merchant\'s shear plane angle is φ = 45° + α/2 - β/2. Cutting force Fc overcomes material primary shear stress τs.',
            formula: '\\phi = 45^\\circ + \\frac{\\alpha}{2} - \\frac{\\beta}{2}, \\quad P_c = F_c \\cdot v_c'
          },
          {
            type: 'multiple_choice',
            titleTr: 'Soru 1',
            titleEn: 'Question 1',
            questionTr: 'Talaş açısı (Rake Angle α) pozitif yapıldığında kesme kuvveti ve güç tüketimi nasıl değişir?',
            questionEn: 'When the tool rake angle (α) is increased to a more positive angle, how do cutting force and power consume change?',
            optionsTr: ['Kesme kuvveti ve güç tüketimi azalır', 'Kuvvet iki katına çıkar', 'Kesici takım aşınmaz', 'Sıcaklık 1000°C artar'],
            optionsEn: ['Cutting force and power consumption decrease', 'Force doubles', 'Zero tool wear', 'Temp rises by 1000°C'],
            correctIndex: 0,
            explanationTr: 'Doğru! Pozitif talaş açısı talaşın akışını kolaylaştırır ve gereken kesme kuvvetini belirgin şekilde düşürür.',
            explanationEn: 'Correct! Positive rake angles reduce shear plane resistance, lowering cutting force and spindle power.'
          }
        ]
      },
      {
        id: 'l-77',
        slug: 'chip-breaker-geometry-and-thermal-management',
        number: 77,
        titleTr: '77. CNC Talaş Kırıcı Geometrisi & Isı Dağılımı',
        titleEn: '77. CNC Chip Breakers & Heat Partition',
        standard: 'ISO Cutting Inserts',
        category: 'Talaşlı İmalat',
        difficulty: 'hard',
        iconName: 'Wrench',
        xpReward: 35,
        steps: [
          {
            type: 'concept',
            titleTr: 'Isı Dağılımı ve Talaş Kırma',
            titleEn: 'Thermal Partition and Chip Control',
            conceptTr: 'Tornalama ısısının yaklaşık %70-80\'i talaş ile uzaklaştırılır. Talaş kırıcı geometrisi uzun sarıcı talaşları C-tipi kısa parçalara kırarak iş parçası ve operatör güvenliğini sağlar.',
            conceptEn: '70-80% of cutting heat is evacuated by the chip. Chip breaker grooves induce cyclic bending strain to fracture continuous ribbon chips.',
            formula: 'Q_{\\text{total}} = Q_{\\text{chip}} (\\approx 75\\%) + Q_{\\text{tool}} (\\approx 15\\%) + Q_{\\text{work}} (\\approx 10\\%)'
          },
          {
            type: 'multiple_choice',
            titleTr: 'Soru 1',
            titleEn: 'Question 1',
            questionTr: 'Talaşlı imalatta oluşan ısının en büyük kısmı nereye aktarılır?',
            questionEn: 'In high-speed metal cutting, where is the largest percentage of generated heat conducted away?',
            optionsTr: ['Akan talaşın içine (%70 - %80)', 'Kesici takım ucuna', 'İş parçasına', 'Tezgah gövdesine'],
            optionsEn: ['Into the evacuated chip (70-80%)', 'Into cutting insert', 'Into workpiece', 'Into machine base'],
            correctIndex: 0,
            explanationTr: 'Doğru! Sağlıklı bir talaş kaldırma operasyonunda ısının %75\'i talaşla birlikte atılır.',
            explanationEn: 'Correct! Primary plastic shear heat is swept away with the continuous evacuating chip.'
          }
        ]
      },
      {
        id: 'l-78',
        slug: 'aluminum-extrusion-die-design-en755',
        number: 78,
        titleTr: '78. Alüminyum Ekstrüzyon Kalıp Tasarımı (EN 755)',
        titleEn: '78. Aluminum Extrusion Die Design (EN 755)',
        standard: 'EN 755 / EN 12020',
        category: 'İmalat',
        difficulty: 'hard',
        iconName: 'Layers',
        xpReward: 35,
        steps: [
          {
            type: 'concept',
            titleTr: 'Kalıp Yataklama Boyu (Bearing Length)',
            titleEn: 'Extrusion Die Bearing Length & Flow Balance',
            conceptTr: 'Alüminyum biyet 500°C\'de kalıptan basılırken kalın cidarlı bölgelerde alüminyum daha hızlı akar. Profilin her yerinde homojen çıkış hızı sağlamak için kalın bölgelerde kalıp yataklama boyu uzatılır (sürtünme artırılır).',
            conceptEn: 'To equalize exit velocity across varying wall thicknesses, die bearing lengths are lengthened at thick sections to choke flow.',
            formula: 'v_{\\text{exit}} = \\text{sabit} \\implies L_{\\text{bearing}} \\propto t_{\\text{wall}}'
          },
          {
            type: 'multiple_choice',
            titleTr: 'Soru 1',
            titleEn: 'Question 1',
            questionTr: 'Ekstrüzyon profilinde bir bölge diğerinden daha hızlı akarsa profilde ne tür bir kusur oluşur?',
            questionEn: 'If aluminum flows faster through one section of an extrusion die than another, what defect occurs?',
            optionsTr: ['Profilde dalgalanma, eğrilik ve kılıçlaşma (camber/bowing)', 'Erime', 'Renk değişimi', 'Ağırlık artışı'],
            optionsEn: ['Bowing, twisting, and wave distortion (camber)', 'Melting', 'Color shift', 'Weight gain'],
            correctIndex: 0,
            explanationTr: 'Doğru! Hız dengesizliği profilin boyuna eğrilmesine ve dalgalanmasına neden olur.',
            explanationEn: 'Correct! Velocity differentials across the cross-section force the profile to bow and twist longitudinally.'
          }
        ]
      },
      {
        id: 'l-79',
        slug: 'additive-manufacturing-thermal-residual-stresses',
        number: 79,
        titleTr: '79. 3D Metal Katmanlı İmalat & Kalıntı Gerilmeler',
        titleEn: '79. Metal AM & Thermal Residual Stresses',
        standard: 'ASTM F42 / ISO 52900',
        category: 'İleri İmalat',
        difficulty: 'expert',
        iconName: 'Layers',
        xpReward: 40,
        steps: [
          {
            type: 'concept',
            titleTr: 'Lazer Toz Yataklı Ergitme (LPBF / DMLS)',
            titleEn: 'Laser Powder Bed Fusion Thermal Gradients',
            conceptTr: 'Lazerin erittiği mikroskobik havuz hızla katılaşırken ($10^6$ K/s soğuma hızı) aşırı yüksek çekme kalıntı gerilmeleri doğar. Parçanın tabladan kopmasını ve çarpılmasını önlemek için destek yapıları (support structures) ve gerilim giderme tavlaması zorunludur.',
            conceptEn: 'Extreme cooling rates in LPBF create high tensile residual stresses. Support structures and stress-relief heat treatments are critical.',
            formula: '\\sigma_{\\text{thermal}} \\approx E \\cdot \\alpha_{\\text{CTE}} \\cdot \\Delta T'
          },
          {
            type: 'multiple_choice',
            titleTr: 'Soru 1',
            titleEn: 'Question 1',
            questionTr: 'DMLS/LPBF ile üretilen titanyum veya inconel parçalar tabladan kesilmeden önce neden fırına sokulur?',
            questionEn: 'Why must metal 3D printed components undergo furnace heat treatment BEFORE being wire-EDM cut from the build plate?',
            optionsTr: ['Termal kalıntı gerilmeleri giderip parçanın çarpılmasını ve çatlamasını önlemek', 'Rengini parlatmak', 'Tozları eritmek', 'Ağırlığını azaltmak'],
            optionsEn: ['Relieve thermal residual stresses and prevent severe part distortion/cracking', 'Polish color', 'Melt extra powder', 'Reduce weight'],
            correctIndex: 0,
            explanationTr: 'Doğru! Gerilim giderme yapılmadan kesilirse parçanın içindeki hapsolmuş gerilmeler parçayı anında büküp çatlatır.',
            explanationEn: 'Correct! Releasing un-relieved parts causes instant distortion and warping driven by stored residual stresses.'
          }
        ]
      },
      {
        id: 'l-80',
        slug: 'boss-multibend-chassis-flat-pattern-manufacturing',
        number: 80,
        titleTr: '80. 👑 BOSS SINAVI: Çok Bükümlü Şasi Hassas İmalat Planı',
        titleEn: '80. 👑 BOSS TEST: Multi-Bend Aerospace Chassis Plan',
        standard: 'DIN 6935 Complete Manufacturing Plan',
        category: 'Sac Metal',
        difficulty: 'expert',
        iconName: 'Trophy',
        isBoss: true,
        xpReward: 85,
        steps: [
          {
            type: 'concept',
            titleTr: 'Tolerans Yığılması ve Büküm Sırası Optimizasyonu',
            titleEn: 'Tolerance Stackup & Bending Sequence',
            conceptTr: 'Ardışık 6 büküm içeren bir şaside her bükümün $BD$ payı ve geri esnemesi kümülatif tolerans yığılmasına ($T_{top} = \\sqrt{\\sum t_i^2}$) yol açar. İmalat sırası kalıp çarpışmalarını (collision) önleyecek şekilde optimize edilmelidir.',
            conceptEn: 'Consecutive bending induces cumulative tolerance stackup. Sequence must avoid tooling collisions and preserve datum alignment.',
            formula: 'L_{\\text{flat}} = \\sum L_{\\text{flange}} - \\sum BD_i'
          },
          {
            type: 'multiple_choice',
            titleTr: 'Boss Sorusu',
            titleEn: 'Boss Question',
            questionTr: 'Sac bükümünde iki delik büküm çizgisine çok yakın (d < 2t) yerleştirilirse ne tür bir geometrik hata oluşur?',
            questionEn: 'If a hole is placed too close to a sheet bend line (distance d < 2*t), what defect occurs?',
            optionsTr: ['Delik daireselliğini kaybedip yumurta şeklinde ovallik kazanır (delik bozulması)', 'Delik büyür', 'Sac erir', 'Büküm açısı sıfırlanır'],
            optionsEn: ['Hole loses roundness and distorts into an oval shape', 'Hole expands cleanly', 'Sheet melts', 'Bend angle zeros'],
            correctIndex: 0,
            explanationTr: 'Tebrikler! Büküm bölgesindeki plastik gerinim deliğin kenarını çekerek deliği deforme eder (minimum mesafe d ≥ 2t + R olmalıdır).',
            explanationEn: 'Congratulations! Plastic deformation in the bend zone pulls the edge, distorting holes placed closer than 2*t + R.'
          }
        ]
      }
    ]
  },

  // ─── ÜNİTE 9 (81 - 90): TERMODİNAMİK, AKIŞKANLAR & ISI TRANSFERİ ───
  {
    id: 'unit-9',
    number: 9,
    titleTr: 'Ünite 9: Termodinamik, Akışkanlar & Isı Transferi',
    titleEn: 'Unit 9: Thermodynamics, Fluids & Heat Transfer',
    descriptionTr: 'Navier-Stokes, Darcy-Weisbach boru sürtünmesi, Fourier iletimi ve su koçu darbesi.',
    descriptionEn: 'Navier-Stokes foundations, Darcy-Weisbach pipe losses, Fourier conduction, and water hammer shock.',
    gradient: 'from-orange-600 to-red-600',
    difficulty: 'expert',
    accentColor: '#ea580c',
    lessons: [
      {
        id: 'l-81',
        slug: 'control-volume-energy-conservation-first-law',
        number: 81,
        titleTr: '81. 1. Termodinamik Kanunu & Kontrol Hacmi Dengesi',
        titleEn: '81. First Law of Thermodynamics (Energy Balance)',
        standard: 'First Law / SFEE',
        category: 'Termodinamik',
        difficulty: 'medium',
        iconName: 'Activity',
        xpReward: 30,
        steps: [
          {
            type: 'concept',
            titleTr: 'Sürekli Akışlı Açık Sistem Enerji Denklemi (SFEE)',
            titleEn: 'Steady-Flow Energy Equation (SFEE)',
            conceptTr: 'Açık bir akışkan sisteminde giren ve çıkan enerjiler dengededir: Isı girişi $\dot{Q}$ ve iş çıkışı $\dot{W}$ akışkanın entalpi ($h$), kinetik enerji ve potansiyel enerji farkına eşittir.',
            conceptEn: 'In open steady-flow systems, net heat Q and work W balance enthalpy h, kinetic energy, and potential energy changes.',
            formula: '\\dot{Q} - \\dot{W} = \\dot{m} \\left[ \\left(h_2 - h_1\\right) + \\frac{v_2^2 - v_1^2}{2} + g (z_2 - z_1) \\right]'
          },
          {
            type: 'multiple_choice',
            titleTr: 'Soru 1',
            titleEn: 'Question 1',
            questionTr: 'İdeal adyabatik (ısı yalıtımlı) bir gaz türbininde üretilen iş (W) doğrudan neye eşittir?',
            questionEn: 'In an ideal adiabatic gas turbine (Q=0), the power output is directly equal to what?',
            optionsTr: ['Giriş ve çıkış entalpi farkına (m * (h1 - h2))', 'Basınca', 'Sürtünmeye', 'Sıfıra'],
            optionsEn: ['Enthalpy drop across stages (m * (h1 - h2))', 'Pressure', 'Friction', 'Zero'],
            correctIndex: 0,
            explanationTr: 'Doğru! Adyabatik akışta W = m*(h1 - h2) entalpi düşüşü mekanik şaft işine dönüşür.',
            explanationEn: 'Correct! For adiabatic expansion, power equals mass flow rate times specific enthalpy drop.'
          }
        ]
      },
      {
        id: 'l-82',
        slug: 'navier-stokes-and-continuity-equation',
        number: 82,
        titleTr: '82. Süreklilik & Navier-Stokes Denklemleri',
        titleEn: '82. Continuity & Navier-Stokes Equations',
        standard: 'Navier-Stokes / Fluid Continuum',
        category: 'Akışkanlar',
        difficulty: 'expert',
        iconName: 'Activity',
        xpReward: 40,
        steps: [
          {
            type: 'concept',
            titleTr: 'Kütle ve Momentum Korunumu',
            titleEn: 'Conservation of Mass & Momentum',
            conceptTr: 'Sıkıştırılamaz bir akışkan için süreklilik denklemi $\\nabla \\cdot \\vec{v} = 0$, momentum korunumu ise Navier-Stokes denklemi $\\rho \\left( \\frac{\\partial \\vec{v}}{\\partial t} + \\vec{v} \\cdot \\nabla \\vec{v} \\right) = -\\nabla p + \\mu \\nabla^2 \\vec{v} + \\rho \\vec{g}$ ile tanımlanır.',
            conceptEn: 'Incompressible flow obeys continuity ∇·v = 0 and Navier-Stokes momentum balance equating acceleration to pressure, viscous shear, and gravity.',
            formula: '\\rho \\left( \\frac{\\partial \\vec{v}}{\\partial t} + \\vec{v} \\cdot \\nabla \\vec{v} \\right) = -\\nabla p + \\mu \\nabla^2 \\vec{v} + \\rho \\vec{g}'
          },
          {
            type: 'multiple_choice',
            titleTr: 'Soru 1',
            titleEn: 'Question 1',
            questionTr: 'Sıkıştırılamaz kararlı akışta boru kesit alanı yarıya (A2 = A1 / 2) inerse akış hızı ne olur?',
            questionEn: 'In steady incompressible pipe flow, if the cross-sectional area is halved (A2 = A1/2), what happens to velocity?',
            optionsTr: ['2 katına çıkar (v2 = 2 v1)', 'Yarıya iner', '4 katına çıkar', 'Değişmez'],
            optionsEn: ['Doubles (v2 = 2 v1)', 'Halved', 'Quadruples', 'No change'],
            correctIndex: 0,
            explanationTr: 'Doğru! Süreklilik denklemi A1*v1 = A2*v2 gereğince hız tam iki katına çıkar.',
            explanationEn: 'Correct! By continuity A1*v1 = A2*v2, halving area doubles flow velocity.'
          }
        ]
      },
      {
        id: 'l-83',
        slug: 'darcy-weisbach-pipe-friction-losses',
        number: 83,
        titleTr: '83. Borularda Basınç Kaybı (Darcy-Weisbach)',
        titleEn: '83. Darcy-Weisbach Pipe Friction Losses',
        standard: 'ISO 5167 / Moody',
        category: 'Akışkanlar',
        difficulty: 'hard',
        iconName: 'Activity',
        xpReward: 35,
        steps: [
          {
            type: 'concept',
            titleTr: 'Darcy-Weisbach ve Moody Sürtünme Faktörü',
            titleEn: 'Darcy-Weisbach & Moody Friction Factor (f)',
            conceptTr: 'Borulardaki sürtünme basınç kaybı $\\Delta p = f \\frac{L}{D} \\frac{\\rho v^2}{2}$ formülü ile hesaplanır. Laminer akışta ($Re < 2300$) $f = 64/Re$, türbülanslı akışta ise Colebrook-White bağıntısı kullanılır.',
            conceptEn: 'Pipe friction pressure drop is Δp = f*(L/D)*(ρv²/2). For laminar flow (Re < 2300), f = 64/Re.',
            formula: '\\Delta p = f \\cdot \\frac{L}{D} \\cdot \\frac{\\rho \\cdot v^2}{2}, \\quad f_{\\text{laminar}} = \\frac{64}{Re}'
          },
          {
            type: 'multiple_choice',
            titleTr: 'Soru 1',
            titleEn: 'Question 1',
            questionTr: 'Boru içindeki akış hızı (v) iki katına çıkarılırsa basınç kaybı (Δp) kaç katına çıkar?',
            questionEn: 'If flow velocity in a pipe is doubled, by what factor does friction pressure drop (Δp) increase?',
            optionsTr: ['4 katına (v² ile orantılı)', '2 katına', '8 katına', '16 katına'],
            optionsEn: ['4x (proportional to v²)', '2x', '8x', '16x'],
            correctIndex: 0,
            explanationTr: 'Doğru! Basınç kaybı hızın karesiyle ($v^2$) orantılı olduğundan 2² = 4 katına çıkar!',
            explanationEn: 'Correct! Pressure drop scales quadratically with velocity (v²), quadrupling for 2x velocity.'
          }
        ]
      },
      {
        id: 'l-84',
        slug: 'minor-head-losses-fittings-valves',
        number: 84,
        titleTr: '84. Yerel Yük Kayıp Katsayıları (KL: Dirsek, Vana)',
        titleEn: '84. Minor Head Losses in Fittings & Valves',
        standard: 'Hydraulic Institute Standards',
        category: 'Akışkanlar',
        difficulty: 'medium',
        iconName: 'Activity',
        xpReward: 30,
        steps: [
          {
            type: 'concept',
            titleTr: 'Dirsek, Vana ve Giriş-Çıkış Kayıpları',
            titleEn: 'Minor Losses in Valves and Bends',
            conceptTr: 'Boru armatürlerindeki girdap kayıpları $\\Delta p_{minor} = K_L \\frac{\\rho v^2}{2}$ formülü ile hesaplanır ($90^\\circ$ standart dirsek için $K_L \\approx 0.75$, tam açık sürgülü vana için $K_L \\approx 0.2$).',
            conceptEn: 'Turbulent eddy separation in fittings is quantified by minor loss coefficient KL: Δp = KL * (ρv²/2).',
            formula: 'h_L = K_L \\cdot \\frac{v^2}{2 g}, \\quad \\Delta p_{\\text{minor}} = K_L \\cdot \\frac{\\rho v^2}{2}'
          },
          {
            type: 'multiple_choice',
            titleTr: 'Soru 1',
            titleEn: 'Question 1',
            questionTr: 'Boru hattında vanayı kısmak (yarı kapalı yapmak) sistemde neyi artırır?',
            questionEn: 'Throttling a valve in a piping system increases which parameter?',
            optionsTr: ['Yerel kayıp katsayısını (KL) artırarak debiyi kısar', 'Debiyi artırır', 'Sıcaklığı mutlak sıfıra indirir', 'Sürtünmeyi sıfırlar'],
            optionsEn: ['Increases minor loss coefficient KL, throttling mass flow', 'Increases flow', 'Drops temp to absolute zero', 'Zeros friction'],
            correctIndex: 0,
            explanationTr: 'Doğru! Vana kısıldıkça KL katsayısı hızla büyür ve akışa yüksek direnç uygular.',
            explanationEn: 'Correct! Closing the valve increases restriction KL, dissipating pressure and reducing flow.'
          }
        ]
      },
      {
        id: 'l-85',
        slug: 'fourier-law-thermal-conduction',
        number: 85,
        titleTr: '85. İletimle Isı Transferi (Fourier Yasası)',
        titleEn: '85. Thermal Conduction (Fourier\'s Law)',
        standard: 'ISO 10211 / Fourier',
        category: 'Isı Transferi',
        difficulty: 'medium',
        iconName: 'Activity',
        xpReward: 30,
        steps: [
          {
            type: 'concept',
            titleTr: 'Fourier Isı İletimi Denklemi',
            titleEn: 'Fourier\'s Conduction Equation',
            conceptTr: 'Bir katı içindeki ısı akısı, sıcaklık gradyanı ve malzemenin ısıl iletkenliği ($k$) ile doğru orantılıdır: $\dot{q} = -k \\frac{dT}{dx}$. Çok katmanlı duvarlarda termal dirençler elektriksel dirençler gibi toplanır ($R_{top} = \sum L_i / k_i$).',
            conceptEn: 'Heat conduction flux is proportional to thermal conductivity k and temperature gradient: q = -k*dT/dx.',
            formula: '\\dot{Q} = k \\cdot A \\cdot \\frac{T_1 - T_2}{L} = \\frac{\\Delta T}{R_{\\text{thermal}}}, \\quad R_{\\text{th}} = \\frac{L}{k \\cdot A}'
          },
          {
            type: 'multiple_choice',
            titleTr: 'Soru 1',
            titleEn: 'Question 1',
            questionTr: 'Alüminyumun ısıl iletkenliği (k ≈ 200 W/m·K) paslanmaz çeliğe (k ≈ 15 W/m·K) göre nasıldır?',
            questionEn: 'How does the thermal conductivity of aluminum (k ≈ 200 W/m·K) compare to stainless steel (k ≈ 15 W/m·K)?',
            optionsTr: ['Alüminyum ısıyı yaklaşık 13 kat daha hızlı iletir', 'Paslanmaz çelik daha hızlı iletir', 'İkisi de aynıdır', 'Alüminyum yalıtkandır'],
            optionsEn: ['Aluminum conducts heat ~13x faster', 'Stainless steel conducts faster', 'Equal', 'Aluminum is an insulator'],
            correctIndex: 0,
            explanationTr: 'Doğru! Alüminyum yüksek ısıl iletkenliği nedeniyle soğutucu gövdeler ve radyatörler için idealdir.',
            explanationEn: 'Correct! Aluminum is a superior heat conductor, making it ideal for electronic heatsinks.'
          }
        ]
      },
      {
        id: 'l-86',
        slug: 'convection-heat-transfer-nusselt-reynolds-prandtl',
        number: 86,
        titleTr: '86. Taşınımla Isı Transferi (Nusselt, Pr, Re)',
        titleEn: '86. Convection (Nusselt, Pr, Re Numbers)',
        standard: 'Newton\'s Law of Cooling',
        category: 'Isı Transferi',
        difficulty: 'hard',
        iconName: 'Activity',
        xpReward: 35,
        steps: [
          {
            type: 'concept',
            titleTr: 'Newton Soğuma Yasası ve Boyutsuz Sayılar',
            titleEn: 'Newton\'s Law of Cooling & Dimensionless Groups',
            conceptTr: 'Taşınım ısısı $\dot{Q} = h \\cdot A (T_s - T_\\infty)$. Isı transfer katsayısı $h$, Nusselt sayısı $Nu = h L / k$, Reynolds sayısı $Re$ ve Prandtl sayısı $Pr = \\nu / \\alpha$ bağıntılarıyla (örn. Dittus-Boelter) çözülür.',
            conceptEn: 'Convection heat is Q = h*A*(Ts - T_inf). Heat transfer coefficient h is evaluated from Nusselt number correlations (e.g. Dittus-Boelter).',
            formula: '\\dot{Q} = h \\cdot A \\left(T_{\\text{surface}} - T_{\\infty}\\right), \\quad Nu = \\frac{h \\cdot L}{k} = 0.023 \\cdot Re^{0.8} Pr^{0.4}'
          },
          {
            type: 'multiple_choice',
            titleTr: 'Soru 1',
            titleEn: 'Question 1',
            questionTr: 'Zorlanmış taşınımda (fanlı hava akışı) ısı transfer katsayısı (h) durgun havaya (doğal taşınım) göre nasıl değişir?',
            questionEn: 'How does the heat transfer coefficient (h) in forced convection (fan cooling) compare to natural convection?',
            optionsTr: ['Belirgin şekilde artar (5 ila 20 kat daha yüksek h)', 'Yarıya iner', 'Değişmez', 'Sıfır olur'],
            optionsEn: ['Substantially increases (5 to 20x higher h)', 'Halved', 'No change', 'Zeros out'],
            correctIndex: 0,
            explanationTr: 'Doğru! Zorlanmış akış sınır tabakayı incelterek ısı transfer katsayısını kat kat artırır.',
            explanationEn: 'Correct! Forced fluid velocity thins the thermal boundary layer, boosting h significantly.'
          }
        ]
      },
      {
        id: 'l-87',
        slug: 'thermal-radiation-stefan-boltzmann-view-factor',
        number: 87,
        titleTr: '87. Işınımla Isı Transferi (Stefan-Boltzmann)',
        titleEn: '87. Thermal Radiation (Stefan-Boltzmann)',
        standard: 'Stefan-Boltzmann Law',
        category: 'Isı Transferi',
        difficulty: 'hard',
        iconName: 'Activity',
        xpReward: 35,
        steps: [
          {
            type: 'concept',
            titleTr: '4. Kuvvet Sıcaklık Işıması',
            titleEn: 'T⁴ Thermal Radiation Power',
            conceptTr: 'Işınım ortam gerektirmeyen elektromanyetik dalgadır. Isı transferi mutlak sıcaklığın 4. kuvveti ile ($T^4$) orantılıdır: $\dot{Q} = \epsilon \\sigma A (T_1^4 - T_2^4)$. $\sigma = 5.67 \\times 10^{-8}$ W/m²K⁴ Stefan-Boltzmann sabitidir.',
            conceptEn: 'Radiation requires no medium and scales with T⁴: Q = ε*σ*A*(T1⁴ - T2⁴). σ = 5.67e-8 W/m²K⁴.',
            formula: '\\dot{Q}_{rad} = \\epsilon \\cdot \\sigma \\cdot A \\left( T_1^4 - T_2^4 \\right), \\quad \\sigma = 5.67 \\times 10^{-8} \\frac{\\text{W}}{\\text{m}^2 \\text{K}^4}'
          },
          {
            type: 'multiple_choice',
            titleTr: 'Soru 1',
            titleEn: 'Question 1',
            questionTr: 'Yüzey mutlak sıcaklığı (Kelvin) iki katına çıkarılırsa (örn. 300 K\'den 600 K\'e), yayılan ışınım ısısı kaç katına çıkar?',
            questionEn: 'If the absolute temperature (Kelvin) of a blackbody is doubled, by what factor does radiated thermal power increase?',
            optionsTr: ['16 katına (2⁴ = 16)', '2 katına', '4 katına', '8 katına'],
            optionsEn: ['16x (2⁴ = 16)', '2x', '4x', '8x'],
            correctIndex: 0,
            explanationTr: 'Doğru! Işınım T⁴ bağıntısına sahip olduğundan 2⁴ = 16 kat artar!',
            explanationEn: 'Correct! Due to the T⁴ dependence, doubling temperature increases radiation by 2⁴ = 16 times.'
          }
        ]
      },
      {
        id: 'l-88',
        slug: 'water-hammer-and-joukowsky-pressure-surge',
        number: 88,
        titleTr: '88. Su Koçu (Hidrolik Şok) & Joukowsky Basıncı',
        titleEn: '88. Water Hammer & Joukowsky Surge Pressure',
        standard: 'Joukowsky Formula',
        category: 'Akışkanlar',
        difficulty: 'hard',
        iconName: 'Activity',
        xpReward: 35,
        steps: [
          {
            type: 'concept',
            titleTr: 'Ani Vana Kapanması ve Akustik Basınç Dalgası',
            titleEn: 'Rapid Valve Closure & Acoustic Shock Waves',
            conceptTr: 'Boru hattında akan sıvı aniden durdurulduğunda kinetik enerji sıkışma basıncına dönüşür. Joukowsky şok dalgası $\Delta p = \rho \\cdot c \\cdot \Delta v$ ile boruyu patlatabilecek devasa tepe basınçları doğurur ($c \\approx 1200$ m/s ses hızı).',
            conceptEn: 'Rapid valve closure converts kinetic energy to shock waves. Joukowsky pressure rise Δp = ρ*c*Δv can burst pipelines.',
            formula: '\\Delta p = \\rho \\cdot c \\cdot \\Delta v, \\quad t_{\\text{crit}} = \\frac{2 L}{c}'
          },
          {
            type: 'multiple_choice',
            titleTr: 'Soru 1',
            titleEn: 'Question 1',
            questionTr: 'Su boru hattında su koçu (koç darbesi) hasarını engellemek için ne kullanılır?',
            questionEn: 'What engineering device is installed on water pipelines to absorb water hammer shock waves?',
            optionsTr: ['Genleşme tankı / Hidrolik akümülatör (Darbe emici)', 'Vanayı daha hızlı kapatmak', 'Boru çapını küçültmek', 'Yağ eklemek'],
            optionsEn: ['Hydraulic surge vessel / expansion accumulator', 'Closing valve faster', 'Reducing pipe size', 'Adding oil'],
            correctIndex: 0,
            explanationTr: 'Doğru! Akümülatörün gaz yastığı elastik sönümleme yaparak basınç dalgasını zararsızca emer.',
            explanationEn: 'Correct! Surge vessels with compressible gas cushions safely absorb transient shock waves.'
          }
        ]
      },
      {
        id: 'l-89',
        slug: 'heat-exchanger-lmtd-and-ntu-method',
        number: 89,
        titleTr: '89. Isı Değiştiricileri (LMTD & ε-NTU Yöntemi)',
        titleEn: '89. Heat Exchangers (LMTD & ε-NTU)',
        standard: 'TEMA Standards',
        category: 'Isı Transferi',
        difficulty: 'hard',
        iconName: 'Activity',
        xpReward: 35,
        steps: [
          {
            type: 'concept',
            titleTr: 'Logaritmik Ortalama Sıcaklık Farkı (LMTD)',
            titleEn: 'Log Mean Temperature Difference (LMTD)',
            conceptTr: 'Isı eşanjöründe toplam aktarılan ısı $\dot{Q} = U \\cdot A \\cdot \\Delta T_{lm}$ formülüyle hesaplanır. Karşıt akışlı (counter-flow) eşanjörler paralel akışa göre çok daha yüksek LMTD ve termal verim sunar.',
            conceptEn: 'Heat exchanger capacity is Q = U*A*LMTD. Counter-flow configurations provide superior LMTD compared to parallel flow.',
            formula: '\\Delta T_{lm} = \\frac{\\Delta T_1 - \\Delta T_2}{\\ln\\left(\\frac{\\Delta T_1}{\\Delta T_2}\\right)}, \\quad \\dot{Q} = U \\cdot A \\cdot F \\cdot \\Delta T_{lm}'
          },
          {
            type: 'multiple_choice',
            titleTr: 'Soru 1',
            titleEn: 'Question 1',
            questionTr: 'Aynı yüzey alanında karşıt akışlı (counter-flow) eşanjörün paralel akışlıya göre en büyük üstünlüğü nedir?',
            questionEn: 'What is the primary thermodynamic advantage of a counter-flow heat exchanger over parallel-flow?',
            optionsTr: ['Soğuk akışkan çıkış sıcaklığı sıcak akışkan çıkış sıcaklığının üzerine çıkabilir (yüksek verim)', 'Daha az yer kaplaması', 'Sıfır basınç kaybı', 'Pompa gerektirmemesi'],
            optionsEn: ['Cold fluid outlet temp can exceed hot fluid outlet temp (maximum thermal effectiveness)', 'Smaller size only', 'Zero pressure drop', 'No pump needed'],
            correctIndex: 0,
            explanationTr: 'Doğru! Karşıt akışta sıcaklık gradyanı homojen kalır ve maksimum ısıl etkinlik elde edilir.',
            explanationEn: 'Correct! Counter-flow maintains a continuous temperature gradient, maximizing thermal effectiveness.'
          }
        ]
      },
      {
        id: 'l-90',
        slug: 'boss-power-electronics-liquid-cooling-cold-plate',
        number: 90,
        titleTr: '90. 👑 BOSS SINAVI: Güç Elektroniği Sıvı Soğutma Bloğu',
        titleEn: '90. 👑 BOSS TEST: Liquid Cold Plate Thermal-Hydraulic Sizing',
        standard: 'ASME Thermal Engineering',
        category: 'Isı & Akışkanlar',
        difficulty: 'expert',
        iconName: 'Trophy',
        isBoss: true,
        xpReward: 90,
        steps: [
          {
            type: 'concept',
            titleTr: 'Mikro-Kanallı Soğutma Bloğu Termal-Hidrolik Sentezi',
            titleEn: 'Microchannel Cold Plate Optimization',
            conceptTr: '5 kW güç elektroniği IGBT modülünün sıcaklığını $T_j < 85^\\circ$C tutmak için su-glikol debisi, mikro-kanatçık sürtünme basınç kaybı ($\Delta p < 0.5$ bar) ve toplam termal direnç ($R_{th} = R_{cond} + R_{conv} + R_{caloric} \\le 0.012$ K/W) optimize edilmelidir.',
            conceptEn: 'Sizing requires balancing thermal resistance (R_th = R_cond + R_conv + R_caloric ≤ 0.012 K/W) against pumping power Δp < 0.5 bar.',
            formula: 'R_{\\text{total}} = \\frac{t}{k A} + \\frac{1}{h A_{\\text{fins}}} + \\frac{1}{2 \\dot{m} c_p} \\le R_{\\text{allow}}'
          },
          {
            type: 'multiple_choice',
            titleTr: 'Boss Sorusu',
            titleEn: 'Boss Question',
            questionTr: 'Soğutma bloğunda mikro-kanatçık sayısını aşırı artırmak ısıl direnci düşürürken ne tür olumsuz bir bedele yol açar?',
            questionEn: 'While adding ultra-dense microfins reduces convective thermal resistance, what severe hydraulic penalty occurs?',
            optionsTr: ['Basınç kaybı (Δp) ve gereken pompa gücü katlanarak artar', 'Soğutma sıvısı donar', 'Isı transferi sıfırlanır', 'Alüminyum paslanır'],
            optionsEn: ['Hydraulic pressure drop and required pump power increase exponentially', 'Coolant freezes', 'Zero heat transfer', 'Aluminum rusts'],
            correctIndex: 0,
            explanationTr: 'Tebrikler! Mikrokanallarda sürtünme alanı arttıkça hidrolik basınç kaybı devasa artar (pompa güç dengesi kurulmalıdır).',
            explanationEn: 'Congratulations! Tighter micro-channels skyrocket friction pressure drop, requiring massive pumping power.'
          }
        ]
      }
    ]
  },

  // ─── ÜNİTE 10 (91 - 100): İLERİ FEA, ÇOK EKSENLİ YORULMA & EKSTREM MÜHENDİSLİK [ÇOK ZOR / BOSS LEVEL] ───
  {
    id: 'unit-10',
    number: 10,
    titleTr: 'Ünite 10: 💀 İleri FEA, Çok Eksenli Yorulma & Ekstrem Mühendislik',
    titleEn: 'Unit 10: 💀 Advanced FEA, Multi-Axial Fatigue & Extreme Engineering',
    descriptionTr: 'Cauchy gerilme tensörü, J2 akma teorisi, 3D Mohr küresi, SIMP topoloji optimizasyonu ve kırılma mekaniği.',
    descriptionEn: 'Cauchy stress tensors, J2 plasticity invariants, 3D Mohr sphere, SIMP topology optimization, and LEFM fracture.',
    gradient: 'from-purple-950 via-rose-950 to-amber-950',
    difficulty: 'extreme',
    accentColor: '#f59e0b',
    lessons: [
      {
        id: 'l-91',
        slug: 'cauchy-stress-tensor-and-invariants',
        number: 91,
        titleTr: '91. Cauchy Gerilme Tensörü & Değişmezler (I1, I2, I3)',
        titleEn: '91. Cauchy Stress Tensor & Invariants',
        standard: 'Continuum Mechanics / Tensor Calculus',
        category: 'Sürekli Ortamlar',
        difficulty: 'extreme',
        iconName: 'Activity',
        xpReward: 50,
        steps: [
          {
            type: 'concept',
            titleTr: '3 Boyutlu İkinci Mertebe Gerilme Tensörü (σij)',
            titleEn: '3D 2nd-Order Cauchy Stress Tensor',
            conceptTr: '3D uzayda herhangi bir noktadaki gerilme durumu simetrik $3 \\times 3$ Cauchy gerilme tensörü $[\boldsymbol{\sigma}]$ ile tanımlanır. Koordinat eksenlerinin dönüşümünden bağımsız kalan 3 skaler invaryant: $I_1 = \\text{tr}(\\boldsymbol{\sigma})$, $I_2$, ve $I_3 = \\det(\\boldsymbol{\sigma})$\'tür.',
            conceptEn: '3D stress state is governed by symmetric 3x3 Cauchy tensor [σ]. The 3 coordinate-invariant scalars are I1 = tr(σ), I2, and I3 = det(σ).',
            formula: '[\\boldsymbol{\\sigma}] = \\begin{bmatrix} \\sigma_{xx} & \\tau_{xy} & \\tau_{xz} \\\\ \\tau_{xy} & \\sigma_{yy} & \\tau_{yz} \\\\ \\tau_{xz} & \\tau_{yz} & \\sigma_{zz} \\end{bmatrix}, \\quad I_1 = \\sigma_{xx} + \\sigma_{yy} + \\sigma_{zz}'
          },
          {
            type: 'multiple_choice',
            titleTr: 'Soru 1',
            titleEn: 'Question 1',
            questionTr: 'Cauchy gerilme tensörünün köşegen elemanlarının toplamı olan birinci invaryant (I1) fiziksel olarak neyi temsil eder?',
            questionEn: 'What does the first invariant I1 = tr(σ) of the Cauchy stress tensor physically represent?',
            optionsTr: ['Hidrostatik (hacimsel küresel) basıncın 3 katını (3 * p_hydro)', 'Maksimum kayma gerilmesini', 'Von Mises eşdeğer gerilmesini', 'Plastik akmayı'],
            optionsEn: ['3 times the hydrostatic mean pressure (3 * p_hydro)', 'Max shear stress', 'Von Mises stress', 'Plastic flow'],
            correctIndex: 0,
            explanationTr: 'Doğru! Hidrostatik basınç p = (σxx + σyy + σzz)/3 = I1/3 olup malzemenin sadece hacim değişimine yol açar.',
            explanationEn: 'Correct! Mean hydrostatic stress p = I1/3 causes pure volumetric dilatation without distortional shape change.'
          }
        ]
      },
      {
        id: 'l-92',
        slug: 'von-mises-deviatoric-stress-j2-plasticity',
        number: 92,
        titleTr: '92. Deviatorik Gerilme Tensörü (Sij) & J2 Akma Teorisi',
        titleEn: '92. Deviatoric Stress (Sij) & J2 Yield Theory',
        standard: 'Huber-Von Mises-Hencky',
        category: 'Plastisite',
        difficulty: 'extreme',
        iconName: 'Activity',
        xpReward: 50,
        steps: [
          {
            type: 'concept',
            titleTr: 'Şekil Değiştirme Enerjisi ve J2 İkinci Değişmezi',
            titleEn: 'Distortional Energy & J2 Invariant',
            conceptTr: 'Metallerde plastik akmayı hidrostatik basınç değil, şekil bozulmasını sağlayan deviatorik gerilme tensörü $\\mathbf{S} = \\boldsymbol{\sigma} - \\frac{1}{3}I_1 \\mathbf{I}$ oluşturur. Von Mises akma kriteri doğrudan ikinci deviatorik değişmeze bağlıdır: $\\sigma_{vM} = \\sqrt{3 J_2}$.',
            conceptEn: 'Plastic yield in ductile metals is driven by deviatoric stress tensor S = σ - (I1/3)I. Von Mises stress equals sqrt(3*J2).',
            formula: 'J_2 = \\frac{1}{2} S_{ij} S_{ij} = \\frac{1}{6}\\left[(\\sigma_1-\\sigma_2)^2 + (\\sigma_2-\\sigma_3)^2 + (\\sigma_3-\\sigma_1)^2\\right], \\quad \\sigma_{vM} = \\sqrt{3 J_2}'
          },
          {
            type: 'multiple_choice',
            titleTr: 'Soru 1',
            titleEn: 'Question 1',
            questionTr: 'Bir metal parçaya her yönden eşit hidrostatik basınç (σ1 = σ2 = σ3 = -5000 MPa) uygulanırsa Von Mises gerilmesi ne olur?',
            questionEn: 'If a metal cube is subjected to pure hydrostatic compression (σ1 = σ2 = σ3 = -5000 MPa), what is the Von Mises stress?',
            optionsTr: ['0 MPa (Plastik akma gerçekleşmez)', '5000 MPa', '15000 MPa', 'Sonsuz'],
            optionsEn: ['0 MPa (No plastic yielding occurs)', '5000 MPa', '15000 MPa', 'Infinite'],
            correctIndex: 0,
            explanationTr: 'Doğru! σ1=σ2=σ3 durumunda tüm (σi - σj) farkları sıfır olduğundan J2=0 ve Von Mises gerilmesi tam 0 MPa\'dır!',
            explanationEn: 'Correct! Pure hydrostatic pressure creates zero deviatoric distortion (J2=0), producing 0 MPa Von Mises stress.'
          }
        ]
      },
      {
        id: 'l-93',
        slug: 'mohrs-3d-stress-sphere-and-maximum-shear',
        number: 93,
        titleTr: '93. 3 Boyutlu Mohr Gerilme Küresi',
        titleEn: '93. 3D Mohr\'s Stress Sphere & Max Shear',
        standard: '3D Mohr Continuum',
        category: 'Mukavemet',
        difficulty: 'extreme',
        iconName: 'Compass',
        xpReward: 50,
        steps: [
          {
            type: 'concept',
            titleTr: '3 Asal Daire ve Mutlak Maksimum Kayma Gerilmesi',
            titleEn: '3 Principal Circles & Absolute Maximum Shear',
            conceptTr: '3 boyutlu uzayda gerilme durumu 3 asal gerilme ($\sigma_1 \\ge \\sigma_2 \\ge \\sigma_3$) arasındaki 3 daire ile taranır. Mutlak maksimum kayma gerilmesi en büyük ve en küçük asal gerilme farkının yarısıdır: $\\tau_{abs,\\max} = (\\sigma_1 - \\sigma_3) / 2$.',
            conceptEn: '3D stress states lie within 3 concentric Mohr circles. Absolute maximum shear stress is τ_abs,max = (σ1 - σ3)/2.',
            formula: '\\tau_{\\text{abs},\\max} = \\frac{\\sigma_1 - \\sigma_3}{2} = \\frac{\\sigma_{\\text{Tresca}}}{2}'
          },
          {
            type: 'multiple_choice',
            titleTr: 'Soru 1',
            titleEn: 'Question 1',
            questionTr: 'İnce cidarlı bir basınçlı kapta teğetsel gerilme σ_h = 200 MPa, boyuna gerilme σ_a = 100 MPa ve dış yüzey radyal gerilme σ_r = 0 ise mutlak maksimum kayma gerilmesi nedir?',
            questionEn: 'In a thin vessel with hoop σ_h=200 MPa, axial σ_a=100 MPa, and radial σ_r=0, what is the absolute maximum shear stress?',
            optionsTr: ['τ_abs,max = 100 MPa ((200 - 0) / 2)', 'τ = 50 MPa', 'τ = 200 MPa', 'τ = 0 MPa'],
            optionsEn: ['τ_abs,max = 100 MPa ((200 - 0) / 2)', 'τ = 50 MPa', 'τ = 200 MPa', 'τ = 0 MPa'],
            correctIndex: 0,
            explanationTr: 'Doğru! σ1 = 200, σ2 = 100, σ3 = 0 olduğundan mutlak maksimum kayma düzlem dışı dairede (200 - 0)/2 = 100 MPa\'dır.',
            explanationEn: 'Correct! With σ1=200, σ2=100, σ3=0, out-of-plane maximum shear is (200 - 0)/2 = 100 MPa.'
          }
        ]
      },
      {
        id: 'l-94',
        slug: 'finite-element-method-stiffness-matrix-formulation',
        number: 94,
        titleTr: '94. Sonlu Elemanlar (FEA) Rijitlik Matrisi [K]',
        titleEn: '94. FEA Global Stiffness Matrix Formulation',
        standard: 'Finite Element Method (Galerkin / Ritz)',
        category: 'FEA & Simülasyon',
        difficulty: 'extreme',
        iconName: 'Layers',
        xpReward: 50,
        steps: [
          {
            type: 'concept',
            titleTr: 'Eleman Rijitlik Matrisinin Türetimi',
            titleEn: 'Stiffness Matrix & Shape Functions',
            conceptTr: 'FEA\'da sürekli ortam şekil fonksiyonları $[N]$ ile ayrıklaştırılır. Eleman rijitlik matrisi $[k^e] = \\int_V [B]^T [D] [B] dV$ entegrasyonuyla türetilir. Global sistem $[K]\{u\} = \{F\}$ denklem takımıyla çözülür.',
            conceptEn: 'FEA discretizes continuum via shape functions [N]. Element stiffness [k] = ∫ [B]^T [D] [B] dV. Global solution is [K]{u} = {F}.',
            formula: '[k^e] = \\int_V [B]^T [D] [B] dV, \\quad [K] \\{u\\} = \\{F\\}'
          },
          {
            type: 'multiple_choice',
            titleTr: 'Soru 1',
            titleEn: 'Question 1',
            questionTr: 'FEA rijitlik matrisinde [B] matrisi neyi temsil eder?',
            questionEn: 'In the FEA stiffness formulation, what does the [B] matrix mathematically represent?',
            optionsTr: ['Şekil fonksiyonlarının türevlerini içeren birim şekil değiştirme - deplasman matrisini (Strain-Displacement)', 'Kütle matrisini', 'Sıcaklığı', 'Dış yük vektörünü'],
            optionsEn: ['Strain-displacement matrix derived from shape function spatial gradients', 'Mass matrix', 'Temperature', 'External force'],
            correctIndex: 0,
            explanationTr: 'Doğru! [B] matrisi düğüm noktası deplasmanlarını {u} eleman içi gerinim tensörüne {ε} bağlar ({ε} = [B]{u}).',
            explanationEn: 'Correct! [B] maps nodal displacements {u} into element strain tensor {ε} = [B]{u}.'
          }
        ]
      },
      {
        id: 'l-95',
        slug: 'nonlinear-plasticity-isotropic-vs-kinematic-hardening',
        number: 95,
        titleTr: '95. Non-Lineer Plastisite & Bauschinger Etkisi',
        titleEn: '95. Non-Linear Plasticity & Bauschinger Effect',
        standard: 'Continuum Plasticity (Chaboche)',
        category: 'Plastisite',
        difficulty: 'extreme',
        iconName: 'Activity',
        xpReward: 50,
        steps: [
          {
            type: 'concept',
            titleTr: 'İzotropik vs Kinematik Sertleşme',
            titleEn: 'Isotropic vs Kinematic Hardening',
            conceptTr: 'İzotropik sertleşmede akma yüzeyi her yönde simetrik genişler. Kinematik sertleşmede ise akma yüzeyi gerilme uzayında merkez değiştirerek ötelenir (back-stress $\boldsymbol{\alpha}$). Tersinir yüklerde akma sınırının düşmesine "Bauschinger Etkisi" denir.',
            conceptEn: 'Isotropic hardening expands yield surface radially. Kinematic hardening translates yield surface, modeling the Bauschinger effect.',
            formula: 'f(\\boldsymbol{\sigma} - \\boldsymbol{\alpha}) - \\sigma_y(p) = 0'
          },
          {
            type: 'multiple_choice',
            titleTr: 'Soru 1',
            titleEn: 'Question 1',
            questionTr: 'Çekme yönünde plastik deformasyona uğrayan bir çubuk derhal basma yönünde zorlanırsa basma akma sınırı nasıl değişir (Bauschinger Etkisi)?',
            questionEn: 'When a bar plastically deformed in tension is immediately reloaded in compression, what happens to compressive yield strength?',
            optionsTr: ['Basma akma dayanımı belirgin şekilde düşer (Bauschinger Etkisi)', 'İki katına çıkar', 'Değişmez', 'Sonsuz olur'],
            optionsEn: ['Compressive yield strength decreases significantly (Bauschinger Effect)', 'Doubles', 'No change', 'Infinite'],
            correctIndex: 0,
            explanationTr: 'Doğru! Mikro-yapısal dislokasyon yığılmaları ters yönde kolayca hareket ederek basma akma sınırını düşürür.',
            explanationEn: 'Correct! Dislocation pileups readily reverse under opposite loading, triggering premature compressive yielding.'
          }
        ]
      },
      {
        id: 'l-96',
        slug: 'multiaxial-fatigue-dang-van-criterion',
        number: 96,
        titleTr: '96. Çok Eksenli Yüksek Çevrimli Yorulma (Dang Van)',
        titleEn: '96. Multi-Axial High-Cycle Fatigue (Dang Van)',
        standard: 'Dang Van / Crossland Multi-Axial Criteria',
        category: 'Yorulma Mekaniği',
        difficulty: 'extreme',
        iconName: 'ShieldCheck',
        xpReward: 50,
        steps: [
          {
            type: 'concept',
            titleTr: 'Kritik Düzlem ve Mikroskobik Kayma Gerilmesi',
            titleEn: 'Critical Plane & Mesoscopic Shear Stress',
            conceptTr: 'Karmaşık çok eksenli faz dışı dinamik gerilmelerde skalersel formüller yetersizdir. Dang Van kriteri mikroskobik kayma gerilmesi genliği $\tau(t)$ ile eşzamanlı hidrostatik basıncı $p_{hyd}(t)$ birleştirir.',
            conceptEn: 'Under out-of-phase multi-axial cyclic stress, Dang Van evaluates mesoscopic shear amplitude τ(t) combined with instantaneous hydrostatic stress.',
            formula: '\\max_{t} \\left[ \\tau(t) + a \\cdot p_{hyd}(t) \\right] \\le b \\quad (\\text{Dang Van Yorulma Sınırı})'
          },
          {
            type: 'multiple_choice',
            titleTr: 'Soru 1',
            titleEn: 'Question 1',
            questionTr: 'Çok eksenli yorulmada çekme hidrostatik basıncının (+p_hyd) varlığı yorulma ömrünü nasıl etkiler?',
            questionEn: 'How does the presence of tensile hydrostatic mean stress (+p_hyd) affect multi-axial fatigue life?',
            optionsTr: ['Mikro çatlakları açarak yorulma ömrünü şiddetle azaltır', 'Ömrü uzatır', 'Etkilemez', 'Titreşimi yutar'],
            optionsEn: ['Opens microcracks and severely accelerates fatigue failure', 'Extends life', 'No effect', 'Absorbs vibration'],
            correctIndex: 0,
            explanationTr: 'Doğru! Çekme hidrostatik gerilmesi çatlak yüzeylerini birbirinden ayırarak çatlak ilerlemesini hızlandırır.',
            explanationEn: 'Correct! Tensile hydrostatic stress opens microcrack faces, reducing shear threshold and accelerating fatigue failure.'
          }
        ]
      },
      {
        id: 'l-97',
        slug: 'linear-elastic-fracture-mechanics-lefm-and-paris-law',
        number: 97,
        titleTr: '97. Kırılma Mekaniği (LEFM) & Paris Çatlak İlerleme Yasası',
        titleEn: '97. Fracture Mechanics (LEFM) & Paris Law',
        standard: 'ASTM E399 / Paris Law',
        category: 'Kırılma Mekaniği',
        difficulty: 'extreme',
        iconName: 'Activity',
        xpReward: 50,
        steps: [
          {
            type: 'concept',
            titleTr: 'Gerilme Şiddet Faktörü (KI) ve Kırılma Tokluğu (KIC)',
            titleEn: 'Stress Intensity Factor (KI) & Paris Law',
            conceptTr: 'Çatlak ucundaki tekil gerilme alanı $K_I = Y \\sigma \\sqrt{\\pi a}$ ile tanımlanır. $K_I \\ge K_{IC}$ olduğunda gevrek kırılma patlar. Çevrimsel yükte çatlak ilerleme hızı Paris Yasası $da/dN = C (\\Delta K)^m$ ile hesaplanır.',
            conceptEn: 'Crack tip singularity is characterized by stress intensity KI = Y*σ*sqrt(πa). Subcritical fatigue growth obeys Paris Law da/dN = C*(ΔK)^m.',
            formula: 'K_I = Y \\cdot \\sigma \\sqrt{\\pi a}, \\quad \\frac{da}{dN} = C \\left( \\Delta K \\right)^m'
          },
          {
            type: 'multiple_choice',
            titleTr: 'Soru 1',
            titleEn: 'Question 1',
            questionTr: 'Uçak gövdesi muayenesinde tespit edilen a boyundaki bir çatlakta KI ≥ KIC durumuna ulaşılırsa ne gerçekleşir?',
            questionEn: 'If a detected crack in an aircraft fuselage reaches the critical condition KI ≥ KIC, what occurs?',
            optionsTr: ['Ses hızında ani ve felaket şeklinde gevrek kopma (katastrofik kırılma)', 'Çatlak kendi kendine kapanır', 'Metal erir', 'Plastik akma başlar'],
            optionsEn: ['Instantaneous catastrophic brittle fracture at the speed of sound', 'Crack self-heals', 'Metal melts', 'Plastic flow onset'],
            correctIndex: 0,
            explanationTr: 'Doğru! Kırılma tokluğu KIC aşıldığında çatlak kararsız şekilde ışık/ses hızına yakın hızla gövdeyi yırtar.',
            explanationEn: 'Correct! Exceeding critical fracture toughness KIC triggers unstable catastrophic crack propagation.'
          }
        ]
      },
      {
        id: 'l-98',
        slug: 'structural-dynamics-modal-eigenvalue-and-resonance',
        number: 98,
        titleTr: '98. Yapısal Dinamik: Modal Frekans & Özdeğer Çözümü',
        titleEn: '98. Structural Dynamics: Modal Eigenvalues',
        standard: 'Modal Analysis / FEA Dynamics',
        category: 'Dinamik & Titreşim',
        difficulty: 'extreme',
        iconName: 'Activity',
        xpReward: 50,
        steps: [
          {
            type: 'concept',
            titleTr: 'Genelleştirilmiş Özdeğer Problemi',
            titleEn: 'Generalized Eigenvalue Problem',
            conceptTr: 'Sönümsüz serbest titreşim denkleminde $([K] - \omega_i^2 [M])\{\phi_i\} = 0$ çözülerek yapının doğal rezonans frekansları ($\omega_i$) ve mod şekilleri ($\{\phi_i\}$) bulunur.',
            conceptEn: 'Solving ([K] - ω²[M]){φ} = 0 yields undamped natural resonance frequencies ωi and orthogonal mode shape eigenvectors {φi}.',
            formula: '\\det\\left( [K] - \\omega^2 [M] \\right) = 0, \\quad f_i = \\frac{\\omega_i}{2\\pi} \\text{ Hz}'
          },
          {
            type: 'multiple_choice',
            titleTr: 'Soru 1',
            titleEn: 'Question 1',
            questionTr: 'Bir roket gövdesinde kütle matrisi [M] sabit kalırken rijitlik matrisi [K] 4 katına çıkarılırsa doğal rezonans frekansı (f) nasıl değişir?',
            questionEn: 'In a rocket structure, if stiffness [K] is quadrupled while mass [M] remains constant, how does natural frequency (f) change?',
            optionsTr: ['2 katına çıkar (sqrt(4) = 2)', '4 katına çıkar', 'Yarıya iner', '16 katına çıkar'],
            optionsEn: ['Doubles (sqrt(4) = 2)', 'Quadruples', 'Halved', '16x'],
            correctIndex: 0,
            explanationTr: 'Doğru! Doğal frekans sqrt(K/M) ile orantılı olduğundan rijitlik 4 katına çıkınca frekans 2 kat artar.',
            explanationEn: 'Correct! Natural frequency scales with sqrt(K/M), so 4x stiffness doubles the modal frequency.'
          }
        ]
      },
      {
        id: 'l-99',
        slug: 'topology-optimization-simp-algorithm',
        number: 99,
        titleTr: '99. Topoloji Optimizasyonu & SIMP Algoritması',
        titleEn: '99. Topology Optimization & SIMP Algorithm',
        standard: 'SIMP (Solid Isotropic Material with Penalization)',
        category: 'Hesaplamalı Mekanik',
        difficulty: 'extreme',
        iconName: 'Layers',
        xpReward: 50,
        steps: [
          {
            type: 'concept',
            titleTr: 'Malzeme Yoğunluğu Cezalandırma Yöntemi (SIMP)',
            titleEn: 'SIMP Density Penalization Method',
            conceptTr: 'SIMP algoritmasında her sonlu elemana $0 \\le \\rho_e \\le 1$ yapay yoğunluk atanır. Rijitlik $E_e(\\rho_e) = \\rho_e^p E_0$ formülüyle cezalandırılır ($p=3$). Amaç belirli kütle kısıtı altında global uyumluluğu (esnekliği) minimize edip rijitliği maksimize etmektir.',
            conceptEn: 'SIMP assigns element density 0 ≤ ρe ≤ 1 with penalization E(ρ) = ρ^p * E0 (p=3) to maximize stiffness under volume constraint.',
            formula: '\\min_{\\rho_e} C = \\{u\\}^T [K] \\{u\\}, \\quad \\text{subject to } \\sum \\rho_e V_e \\le V^*, \\quad E_e = \\rho_e^p E_0'
          },
          {
            type: 'multiple_choice',
            titleTr: 'Soru 1',
            titleEn: 'Question 1',
            questionTr: 'SIMP topoloji optimizasyonunda ceza üssü (p) neden genellikle p=3 seçilir?',
            questionEn: 'Why is the penalization power in SIMP typically chosen as p = 3?',
            optionsTr: ['Gri (ara yoğunluklu 0.5) elemanları yok edip kesin 0 (boşluk) veya 1 (dolu) malzeme elde etmek için', 'Hesaplama süresini uzatmak için', 'Hepsini 0.5 yapmak için', 'Ağırlığı artırmak için'],
            optionsEn: ['To penalize intermediate gray densities, forcing distinct 0 (void) or 1 (solid) material distribution', 'To slow convergence', 'To force 0.5 density', 'To add weight'],
            correctIndex: 0,
            explanationTr: 'Doğru! p=3 ara yoğunlukların rijitlik/ağırlık verimini düşürerek algoritmayı saf dolu (1) veya boş (0) geometrilere zorlar.',
            explanationEn: 'Correct! p=3 renders intermediate densities uneconomical, driving the solution to sharp 0/1 binary topology.'
          }
        ]
      },
      {
        id: 'l-100',
        slug: 'grand-boss-hypersonic-aerothermoelastic-multiphysics',
        number: 100,
        titleTr: '100. 👑 BÜYÜK FİNAL BOSS: Hipersonik Termo-Mekanik Kuplaj',
        titleEn: '100. 👑 GRAND FINAL BOSS: Hypersonic Aerothermoelasticity',
        standard: 'Extreme Multiphysics Mastery',
        category: 'Ekstrem Mühendislik',
        difficulty: 'extreme',
        iconName: 'Trophy',
        isBoss: true,
        xpReward: 100,
        steps: [
          {
            type: 'concept',
            titleTr: 'Mach 7 Hipersonik Termo-Mekanik-Akustik Rezonans',
            titleEn: 'Mach 7 Multi-Physics Coupled Flight Analysis',
            conceptTr: 'Mach 7 uçuşunda şok dalgası aerodinamik bası oluştururken gövde yüzeyi 1600°C aerotermal ısınmaya maruz kalır. Termal genleşme bası gerilmeleri yaratır, sıcaklık elastisite modülünü $E(T)$ düşürür ve aeroelastik panel çırpınması (flutter) tetiklenir.',
            conceptEn: 'At Mach 7, aerodynamic shock combines with 1600°C aerothermal heating. Thermal expansion induces compression, modulus degrades E(T), triggering aerothermoelastic flutter instability.',
            formula: '\\left( [K(T)] + [K_{\\sigma}(\\Delta T)] - \\omega^2 [M] \\right) \\{\\phi\\} = \\{F_{\\text{aero}}(M_\\infty, q_\\infty)\\}'
          },
          {
            type: 'multiple_choice',
            titleTr: 'BÜYÜK FİNAL BOSS SORUSU',
            titleEn: 'GRAND FINAL BOSS QUESTION',
            questionTr: 'Yüksek sıcaklıkta (1600°C) çalışan bir hipersonik kanat panelinde aeroelastik çırpınma (flutter) hızının düşmesinin (erken kararsızlık) ana sebebi nedir?',
            questionEn: 'In a hypersonic skin panel at 1600°C, what two primary physical phenomena drastically degrade aerothermoelastic flutter stability?',
            optionsTr: ['Sıcaklıkla elastisite modülünün (E) düşmesi + Isıl genleşmenin yarattığı bası gerilmesinin paneli burkulmaya yaklaştırması', 'Sadece havanın yoğunlaşması', 'Rengin kararması', 'Hızın sıfıra düşmesi'],
            optionsEn: ['Degradation of elastic modulus E(T) + Compressive thermal in-plane prestress driving the panel toward buckling', 'Air thickening only', 'Surface darkening', 'Zero speed'],
            correctIndex: 0,
            explanationTr: 'TEBRİKLER BAŞMÜHENDİS! Sıcaklık hem malzemeyi yumuşatır (düşük E) hem de ısıl genleşme bası gerilmesi üreterek geometrik rijitliği [Kσ] zayıflatır ve kritik çırpınma hızını dramatik şekilde düşürür!',
            explanationEn: 'CONGRATULATIONS MASTER ENGINEER! Thermal degradation of Young\'s modulus coupled with in-plane thermal compressive prestress erodes structural stiffness, triggering premature catastrophic flutter!'
          }
        ]
      }
    ]
  }
];

/**
 * 12-LANGUAGE LOCALIZATION DICTIONARY & HELPER
 */
export const LOCALIZED_UI_STRINGS: Record<Language, Record<string, string>> = {
  tr: {
    campusTitle: 'AluDuolingo Mühendislik Akademisi',
    campusSubtitle: '100 Bölümlük Kapsamlı Mekanik Mühendisliği & Sertifikasyon Parkuru',
    startLesson: 'BAŞLA',
    reviewLesson: 'TEKRAR ET',
    lockedLesson: 'KİLİTLİ',
    dailyStreak: 'Günlük Seri',
    gems: 'Kristal',
    hearts: 'Can',
    league: 'Lig',
    bossTest: 'BOSS MÜCADELESİ',
    easy: 'Kolay',
    medium: 'Orta',
    hard: 'İleri',
    expert: 'Uzman',
    extreme: 'EKSTREM',
    question: 'Soru',
    checkAnswer: 'Kontrol Et',
    continue: 'Devam Et',
    understood: 'Anladım',
    nicelyDone: 'Harika! Doğru Yanıt',
    incorrect: 'Doğru Cevap Değil',
    lessonCompleted: 'Ders Başarıyla Tamamlandı!',
    earnedXp: 'Kazanılan XP',
    starScore: 'Yıldız Skoru',
    backToPath: 'Müfredata Dön',
    leaderboardTitle: 'Haftalık Liderlik Sıralaması',
    dailyQuests: 'Günlük Görevler',
    engineerShop: 'Mühendislik Atölyesi',
    refillHearts: 'Canları Yenile (50 💎)',
    streakFreeze: 'Seri Dondurucu (80 💎)',
    myCertificates: 'Doğrulanabilir Sertifikalarım (PDF)',
    allUnits: 'Tüm Üniteler',
    jumpToUnit: 'Üniteye Git',
  },
  en: {
    campusTitle: 'AluDuolingo Engineering Academy',
    campusSubtitle: '100-Section Comprehensive Mechanical Engineering & Certification Path',
    startLesson: 'START',
    reviewLesson: 'REVIEW',
    lockedLesson: 'LOCKED',
    dailyStreak: 'Daily Streak',
    gems: 'Gems',
    hearts: 'Hearts',
    league: 'League',
    bossTest: 'BOSS TEST',
    easy: 'Easy',
    medium: 'Medium',
    hard: 'Hard',
    expert: 'Expert',
    extreme: 'EXTREME',
    question: 'Question',
    checkAnswer: 'Check Answer',
    continue: 'Continue',
    understood: 'Understood',
    nicelyDone: 'Nicely Done! Correct Answer',
    incorrect: 'Incorrect Answer',
    lessonCompleted: 'Lesson Completed Successfully!',
    earnedXp: 'Earned XP',
    starScore: 'Star Rating',
    backToPath: 'Return to Path',
    leaderboardTitle: 'Weekly Leaderboard Ranking',
    dailyQuests: 'Daily Quests',
    engineerShop: 'Engineer Workshop',
    refillHearts: 'Refill Hearts (50 💎)',
    streakFreeze: 'Streak Freeze (80 💎)',
    myCertificates: 'My Verified Certificates (PDF)',
    allUnits: 'All Units',
    jumpToUnit: 'Jump to Unit',
  },
  de: {
    campusTitle: 'AluDuolingo Ingenieur-Akademie',
    campusSubtitle: '100-teiliger Maschinenbau- & Zertifizierungspfad',
    startLesson: 'STARTEN',
    reviewLesson: 'WIEDERHOLEN',
    lockedLesson: 'GESPERRT',
    dailyStreak: 'Tages-Serie',
    gems: 'Edelsteine',
    hearts: 'Herzen',
    league: 'Liga',
    bossTest: 'BOSS-PRÜFUNG',
    easy: 'Leicht',
    medium: 'Mittel',
    hard: 'Schwer',
    expert: 'Experte',
    extreme: 'EXTREM',
    question: 'Frage',
    checkAnswer: 'Prüfen',
    continue: 'Weiter',
    understood: 'Verstanden',
    nicelyDone: 'Hervorragend! Richtig',
    incorrect: 'Falsche Antwort',
    lessonCompleted: 'Lektion erfolgreich abgeschlossen!',
    earnedXp: 'Erhaltene XP',
    starScore: 'Sterne-Bewertung',
    backToPath: 'Zurück zum Pfad',
    leaderboardTitle: 'Wöchentliche Rangliste',
    dailyQuests: 'Tägliche Quests',
    engineerShop: 'Ingenieur-Werkstatt',
    refillHearts: 'Herzen auffüllen (50 💎)',
    streakFreeze: 'Serien-Frost (80 💎)',
    myCertificates: 'Meine Zertifikate (PDF)',
    allUnits: 'Alle Einheiten',
    jumpToUnit: 'Zu Einheit springen',
  },
  es: {
    campusTitle: 'Academia de Ingeniería AluDuolingo',
    campusSubtitle: 'Ruta completa de 100 lecciones de ingeniería mecánica',
    startLesson: 'EMPEZAR',
    reviewLesson: 'REPASAR',
    lockedLesson: 'BLOQUEADO',
    dailyStreak: 'Racha Diaria',
    gems: 'Gemas',
    hearts: 'Vidas',
    league: 'Liga',
    bossTest: 'DESAFÍO FINAL',
    easy: 'Fácil',
    medium: 'Medio',
    hard: 'Difícil',
    expert: 'Experto',
    extreme: 'EXTREMO',
    question: 'Pregunta',
    checkAnswer: 'Comprobar',
    continue: 'Continuar',
    understood: 'Entendido',
    nicelyDone: '¡Excelente! Respuesta Correcta',
    incorrect: 'Respuesta Incorrecta',
    lessonCompleted: '¡Lección Completada con Éxito!',
    earnedXp: 'XP Ganados',
    starScore: 'Calificación de Estrellas',
    backToPath: 'Volver a la Ruta',
    leaderboardTitle: 'Clasificación Semanal',
    dailyQuests: 'Misiones Diarias',
    engineerShop: 'Taller de Ingeniería',
    refillHearts: 'Rellenar Vidas (50 💎)',
    streakFreeze: 'Protector de Racha (80 💎)',
    myCertificates: 'Mis Certificados (PDF)',
    allUnits: 'Todas las Unidades',
    jumpToUnit: 'Ir a la Unidad',
  },
  fr: {
    campusTitle: 'Académie d\'Ingénierie AluDuolingo',
    campusSubtitle: 'Parcours complet de 100 sections en génie mécanique',
    startLesson: 'COMMENCER',
    reviewLesson: 'RÉVISER',
    lockedLesson: 'VERROUILLÉ',
    dailyStreak: 'Série Quotidienne',
    gems: 'Gemmes',
    hearts: 'Vies',
    league: 'Ligue',
    bossTest: 'ÉPREUVE BOSS',
    easy: 'Facile',
    medium: 'Moyen',
    hard: 'Difficile',
    expert: 'Expert',
    extreme: 'EXTRÊME',
    question: 'Question',
    checkAnswer: 'Vérifier',
    continue: 'Continuer',
    understood: 'Compris',
    nicelyDone: 'Excellent ! Bonne Réponse',
    incorrect: 'Réponse Incorrecte',
    lessonCompleted: 'Leçon terminée avec succès !',
    earnedXp: 'XP Gagnés',
    starScore: 'Étoiles',
    backToPath: 'Retour au Parcours',
    leaderboardTitle: 'Classement Hebdomadaire',
    dailyQuests: 'Quêtes Quotidiennes',
    engineerShop: 'Atelier d\'Ingénierie',
    refillHearts: 'Recharger les Vies (50 💎)',
    streakFreeze: 'Gel de Série (80 💎)',
    myCertificates: 'Mes Certificats (PDF)',
    allUnits: 'Toutes les Unités',
    jumpToUnit: 'Aller à l\'Unité',
  },
  it: {
    campusTitle: 'Accademia di Ingegneria AluDuolingo',
    campusSubtitle: 'Percorso completo di 100 sezioni di ingegneria meccanica',
    startLesson: 'INIZIA',
    reviewLesson: 'RIPASSA',
    lockedLesson: 'BLOCCATO',
    dailyStreak: 'Serie Giornaliera',
    gems: 'Gemme',
    hearts: 'Vite',
    league: 'Lega',
    bossTest: 'PROVA BOSS',
    easy: 'Facile',
    medium: 'Medio',
    hard: 'Difficile',
    expert: 'Esperto',
    extreme: 'ESTREMO',
    question: 'Domanda',
    checkAnswer: 'Controlla',
    continue: 'Continua',
    understood: 'Ho Capito',
    nicelyDone: 'Ottimo! Risposta Corretta',
    incorrect: 'Risposta Non Corretta',
    lessonCompleted: 'Lezione Completata con Successo!',
    earnedXp: 'XP Guadagnati',
    starScore: 'Punteggio Stelle',
    backToPath: 'Torna al Percorso',
    leaderboardTitle: 'Classifica Settimanale',
    dailyQuests: 'Missioni Giornaliere',
    engineerShop: 'Bottega dell\'Ingegnere',
    refillHearts: 'Ricarica Vite (50 💎)',
    streakFreeze: 'Congela Serie (80 💎)',
    myCertificates: 'I Miei Certificati (PDF)',
    allUnits: 'Tutte le Unità',
    jumpToUnit: 'Vai all\'Unità',
  },
  pt: {
    campusTitle: 'Academia de Engenharia AluDuolingo',
    campusSubtitle: 'Trilha completa de 100 seções em engenharia mecânica',
    startLesson: 'COMEÇAR',
    reviewLesson: 'REVISAR',
    lockedLesson: 'BLOQUEADO',
    dailyStreak: 'Sequência Diária',
    gems: 'Gemas',
    hearts: 'Vidas',
    league: 'Liga',
    bossTest: 'DESAFIO BOSS',
    easy: 'Fácil',
    medium: 'Médio',
    hard: 'Difícil',
    expert: 'Especialista',
    extreme: 'EXTREMO',
    question: 'Pergunta',
    checkAnswer: 'Verificar',
    continue: 'Continuar',
    understood: 'Entendido',
    nicelyDone: 'Excelente! Resposta Correta',
    incorrect: 'Resposta Incorreta',
    lessonCompleted: 'Lição Concluída com Sucesso!',
    earnedXp: 'XP Ganho',
    starScore: 'Avaliação por Estrelas',
    backToPath: 'Voltar à Trilha',
    leaderboardTitle: 'Classificação Semanal',
    dailyQuests: 'Missões Diárias',
    engineerShop: 'Oficina do Engenheiro',
    refillHearts: 'Recarregar Vidas (50 💎)',
    streakFreeze: 'Congelar Sequência (80 💎)',
    myCertificates: 'Meus Certificados (PDF)',
    allUnits: 'Todas as Unidades',
    jumpToUnit: 'Pular para Unidade',
  },
  ru: {
    campusTitle: 'Инженерная Академия AluDuolingo',
    campusSubtitle: 'Полный курс из 100 уроков по машиностроению и сертификации',
    startLesson: 'НАЧАТЬ',
    reviewLesson: 'ПОВТОРИТЬ',
    lockedLesson: 'ЗАБЛОКИРОВАНО',
    dailyStreak: 'Дневная серия',
    gems: 'Кристаллы',
    hearts: 'Жизни',
    league: 'Лига',
    bossTest: 'БОСС-ТЕСТ',
    easy: 'Легко',
    medium: 'Средне',
    hard: 'Сложно',
    expert: 'Эксперт',
    extreme: 'ЭКСТРИМ',
    question: 'Вопрос',
    checkAnswer: 'Проверить',
    continue: 'Продолжить',
    understood: 'Понятно',
    nicelyDone: 'Отлично! Верный ответ',
    incorrect: 'Неверный ответ',
    lessonCompleted: 'Урок успешно завершен!',
    earnedXp: 'Получено XP',
    starScore: 'Оценка звездами',
    backToPath: 'Вернуться к курсу',
    leaderboardTitle: 'Еженедельный рейтинг',
    dailyQuests: 'Ежедневные задания',
    engineerShop: 'Мастерская инженера',
    refillHearts: 'Восстановить жизни (50 💎)',
    streakFreeze: 'Заморозка серии (80 💎)',
    myCertificates: 'Мои сертификаты (PDF)',
    allUnits: 'Все модули',
    jumpToUnit: 'Перейти к модулю',
  },
  zh: {
    campusTitle: 'AluDuolingo 机械工程学院',
    campusSubtitle: '100节全方位机械工程与官方认证通关路径',
    startLesson: '开始学习',
    reviewLesson: '复习',
    lockedLesson: '未解锁',
    dailyStreak: '连续签到',
    gems: '宝石',
    hearts: '生命值',
    league: '段位联赛',
    bossTest: '终极考核',
    easy: '入门',
    medium: '中级',
    hard: '高级',
    expert: '专家',
    extreme: '极难',
    question: '题目',
    checkAnswer: '提交检查',
    continue: '继续',
    understood: '掌握了',
    nicelyDone: '太棒了！回答正确',
    incorrect: '回答错误',
    lessonCompleted: '课程圆满完成！',
    earnedXp: '获得经验值',
    starScore: '星级评分',
    backToPath: '返回课程路径',
    leaderboardTitle: '每周排行榜',
    dailyQuests: '每日任务',
    engineerShop: '工程师工坊',
    refillHearts: '恢复生命 (50 💎)',
    streakFreeze: '连胜保护卡 (80 💎)',
    myCertificates: '我的认证证书 (PDF)',
    allUnits: '所有单元',
    jumpToUnit: '跳转至单元',
  },
  ja: {
    campusTitle: 'AluDuolingo 機械工学アカデミー',
    campusSubtitle: '100セクションで学ぶ機械設計エンジニアリング認定コース',
    startLesson: '開始',
    reviewLesson: '復習',
    lockedLesson: 'ロック中',
    dailyStreak: '連続学習日数',
    gems: 'ジェム',
    hearts: 'ライフ',
    league: 'リーグ',
    bossTest: 'ボス検定',
    easy: '初級',
    medium: '中級',
    hard: '上級',
    expert: 'エキスパート',
    extreme: '超難関',
    question: '問題',
    checkAnswer: '回答を確認',
    continue: '次へ進む',
    understood: '理解しました',
    nicelyDone: '素晴らしい！正解です',
    incorrect: '不正解',
    lessonCompleted: 'レッスン完了！',
    earnedXp: '獲得XP',
    starScore: 'スター評価',
    backToPath: 'マップに戻る',
    leaderboardTitle: '週間ランキング',
    dailyQuests: 'デイリークエスト',
    engineerShop: 'エンジニアショップ',
    refillHearts: 'ライフ回復 (50 💎)',
    streakFreeze: '連続記録フリーズ (80 💎)',
    myCertificates: '認定証明書 (PDF)',
    allUnits: '全ユニット',
    jumpToUnit: 'ユニットへジャンプ',
  },
  ko: {
    campusTitle: 'AluDuolingo 기계공학 아카데미',
    campusSubtitle: '100개 세션으로 마스터하는 기계공학 인증 코스',
    startLesson: '시작하기',
    reviewLesson: '복습하기',
    lockedLesson: '잠김',
    dailyStreak: '연속 학습',
    gems: '보석',
    hearts: '하트',
    league: '리그',
    bossTest: '보스 시험',
    easy: '초급',
    medium: '중급',
    hard: '고급',
    expert: '전문가',
    extreme: '최고난도',
    question: '문제',
    checkAnswer: '정답 확인',
    continue: '계속하기',
    understood: '이해했습니다',
    nicelyDone: '완벽합니다! 정답입니다',
    incorrect: '오답입니다',
    lessonCompleted: '학습을 완료했습니다!',
    earnedXp: '획득 경험치',
    starScore: '별점 평가',
    backToPath: '학습 경로로 복귀',
    leaderboardTitle: '주간 순위표',
    dailyQuests: '일일 퀘스트',
    engineerShop: '엔지니어 상점',
    refillHearts: '하트 충전 (50 💎)',
    streakFreeze: '연속 학습 보호 (80 💎)',
    myCertificates: '내 인증서 (PDF)',
    allUnits: '전체 유닛',
    jumpToUnit: '유닛 바로가기',
  },
  ar: {
    campusTitle: 'أكاديمية هندسة ألودولينجو',
    campusSubtitle: 'مسار تدريبي شامل من 100 قسم في الهندسة الميكانيكية والاعتماد الرسمي',
    startLesson: 'ابدأ',
    reviewLesson: 'مراجعة',
    lockedLesson: 'مغلق',
    dailyStreak: 'أيام متتالية',
    gems: 'الجواهر',
    hearts: 'القلوب',
    league: 'الدوري',
    bossTest: 'اختبار الزعيم',
    easy: 'سهل',
    medium: 'متوسط',
    hard: 'متقدم',
    expert: 'خبير',
    extreme: 'شديد الصعوبة',
    question: 'السؤال',
    checkAnswer: 'تحقق من الإجابة',
    continue: 'استمرار',
    understood: 'فهمت',
    nicelyDone: 'أحسنت! إجابة صحيحة',
    incorrect: 'إجابة خاطئة',
    lessonCompleted: 'اكتمل الدرس بنجاح!',
    earnedXp: 'نقاط الخبرة المكتسبة',
    starScore: 'تقييم النجوم',
    backToPath: 'العودة للمسار',
    leaderboardTitle: 'لوحة الصدارة الأسبوعية',
    dailyQuests: 'المهام اليومية',
    engineerShop: 'ورشة المهندس',
    refillHearts: 'تعبئة القلوب (50 💎)',
    streakFreeze: 'تجميد الحماسة (80 💎)',
    myCertificates: 'شهاداتي الرسمية (PDF)',
    allUnits: 'جميع الوحدات',
    jumpToUnit: 'الانتقال إلى الوحدة',
  },
};

export function getDuolingoUiText(lang: Language, key: string): string {
  const dict = LOCALIZED_UI_STRINGS[lang] || LOCALIZED_UI_STRINGS.en;
  return dict[key] || LOCALIZED_UI_STRINGS.en[key] || key;
}

