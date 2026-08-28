import type { CurriculumLesson, CurriculumUnit, LessonStep, LocalizedString } from './DuolingoCurriculumData';

function L(tr: string, en: string): LocalizedString {
  return { tr, en, de: en, es: en, fr: en, it: en, pt: en, ru: en, zh: en, ja: en, ko: en, ar: en };
}

function mc(id: string, qTr: string, qEn: string, opts: [string, string][], correct: number, expTr: string, expEn: string): LessonStep {
  return {
    id,
    type: 'multiple_choice',
    questionData: {
      question: L(qTr, qEn),
      options: opts.map(([tr, en]) => L(tr, en)),
      correctIndex: correct,
      explanation: L(expTr, expEn),
    },
  };
}

function calc(id: string, pTr: string, pEn: string, target: number, tol: number, unit: string, hint: string, solTr: string, solEn: string): LessonStep {
  return {
    id,
    type: 'calculation_input',
    calculationData: {
      prompt: L(pTr, pEn),
      targetValue: target,
      tolerance: tol,
      unit,
      formulaHint: hint,
      stepByStepSolution: L(solTr, solEn),
    },
  };
}

const UNIT_EXTRAS: Record<number, LessonStep[]> = {
  1: [
    mc('x1-1', 'ΣF = 0 ve ΣM = 0 ne anlama gelir?', 'What do ΣF = 0 and ΣM = 0 mean?',
      [['Dinamik rezonans', 'Dynamic resonance'], ['Statik denge', 'Static equilibrium'], ['Yorulma limiti', 'Fatigue limit'], ['Plastik akma', 'Plastic yield']], 1,
      'Serbest cisim dengesinde hem kuvvetler hem momentler sıfırdır.', 'Static equilibrium requires zero net force and zero net moment.'),
    calc('x1-2', '200 N kuvvet 80 mm kola etkiyor. Moment (N·mm)?', 'A 200 N force acts on an 80 mm arm. Moment (N·mm)?',
      16000, 1, 'N·mm', 'M = F · L', 'M = 200 × 80 = 16 000 N·mm', 'M = 200 × 80 = 16 000 N·mm'),
    mc('x1-3', 'Dikdörtgen kesitte Ix hangisidir?', 'Which is Ix of a rectangle?',
      [['bh³/12', 'bh³/12'], ['b³h/12', 'b³h/12'], ['bh/6', 'bh/6'], ['πd⁴/32', 'πd⁴/32']], 0,
      'Eğilme eksenine dik yükseklik küp alınır: bh³/12.', 'The cubed dimension is the height about the bending axis: bh³/12.'),
  ],
  2: [
    mc('x2-1', 'VDI 2230 torkunun çoğu nereye gider?', 'Where does most VDI 2230 tightening torque go?',
      [['Ön yük', 'Preload'], ['Sürtünme', 'Friction'], ['Kesme', 'Shear'], ['Eğilme', 'Bending']], 1,
      'Torkun ~%85–90’ı diş ve başaltı sürtünmesinde harcanır.', 'About 85–90% of torque is consumed by thread and underhead friction.'),
    calc('x2-2', '8.8 cıvatanın akma dayanımı (MPa)?', 'Yield strength of property class 8.8 (MPa)?',
      640, 1, 'MPa', 'Rp0.2 = 0.8 × 800', '8.8 → Rm=800 MPa, Rp0.2=640 MPa', '8.8 → Rm=800 MPa, Rp0.2=640 MPa'),
    mc('x2-3', 'ISO 898-1 12.9 ne demektir?', 'What does ISO 898-1 12.9 mean?',
      [['1200 MPa çekme, 1080 MPa akma', '1200 MPa UTS, 1080 MPa yield'], ['12 mm, 9.8 kalite', '12 mm, grade 9'], ['120 MPa akma', '120 MPa yield'], ['Sadece paslanmaz', 'Stainless only']], 0,
      'İlk rakam×100 = Rm, ikinci×0.1×Rm = akma.', 'First digit×100 = UTS; second×0.1×UTS = yield.'),
  ],
  3: [
    mc('x3-1', 'ISO 281 L10 ömrü neyi ifade eder?', 'What does ISO 281 L10 life mean?',
      [['%10 rulman 1 saatte bozulur', '10% fail in 1 hour'], ['%90 rulman bu ömre ulaşır', '90% of bearings reach this life'], ['Maksimum hız', 'Max speed'], ['Statik güvenlik', 'Static safety']], 1,
      'L10, %90 güvenilirlikte temel ömürdür.', 'L10 is basic rating life at 90% reliability.'),
    calc('x3-2', 'C=14 kN, P=7 kN, bilyalı (p=3). L10 (10⁶ devir)?', 'C=14 kN, P=7 kN, ball (p=3). L10 (10⁶ rev)?',
      8, 0.2, '10⁶ rev', 'L10 = (C/P)^p', '(14/7)^3 = 8', '(14/7)^3 = 8'),
    mc('x3-3', 'Makaralı rulman ömür üssü p nedir?', 'Life exponent p for roller bearings?',
      [['3', '3'], ['10/3', '10/3'], ['4', '4'], ['2', '2']], 1,
      'Bilyalı p=3, makaralı p=10/3.', 'Ball bearings p=3; rollers p=10/3.'),
  ],
  4: [
    mc('x4-1', 'ISO 6336 diş dibi gerilmesi hangi bölgede?', 'ISO 6336 root bending stress acts where?',
      [['Diş tepesi', 'Tooth tip'], ['Diş dibi filetosu', 'Tooth root fillet'], ['Hatve dairesi', 'Pitch circle'], ['Göbek', 'Hub']], 1,
      'Eğilme kırılması diş dibi filetosunda başlar.', 'Bending cracks initiate at the root fillet.'),
    calc('x4-2', 'm=3 mm, z=20. Hatve çapı d (mm)?', 'm=3 mm, z=20. Pitch diameter d (mm)?',
      60, 0.1, 'mm', 'd = m·z', 'd = 3×20 = 60 mm', 'd = 3×20 = 60 mm'),
    mc('x4-3', 'Kesilme (undercut) riski ne zaman artar?', 'When does undercut risk increase?',
      [['z büyük', 'Large z'], ['z küçük, x≈0', 'Small z, x≈0'], ['β=0 her zaman güvenli', 'β=0 always safe'], ['Sadece helisel', 'Helical only']], 1,
      'z < 17 civarı profil kayması olmadan undercut olur.', 'Around z < 17, undercut occurs without profile shift.'),
  ],
  5: [
    mc('x5-1', 'Kayış sarım açısı küçülünce ne olur?', 'If belt wrap angle decreases, what happens?',
      [['Sürtünme kapasitesi düşer', 'Friction capacity drops'], ['Tork artar', 'Torque rises'], ['Kayış kısalır daima', 'Belt always shortens'], ['Hız sonsuz olur', 'Speed becomes infinite']], 0,
      'Euler formülü T1/T2 = e^{μθ}; θ azalınca kayma riski artar.', 'Euler: T1/T2 = e^{μθ}; smaller θ raises slip risk.'),
    calc('x5-2', 'z1=19, z2=57. Zincir oranı i?', 'z1=19, z2=57. Chain ratio i?',
      3, 0.01, '-', 'i = z2/z1', 'i = 57/19 = 3', 'i = 57/19 = 3'),
    mc('x5-3', 'Triger kayışını V-kayıştan ayıran nedir?', 'What separates a timing belt from a V-belt?',
      [['Sürtünme', 'Friction'], ['Pozitif diş kavraması', 'Positive tooth mesh'], ['Daha yüksek μ', 'Higher μ'], ['Sadece kauçuk', 'Rubber only']], 1,
      'Triger kayışı dişle kilitlenir, kayma modeli geçerli değildir.', 'Timing belts lock by teeth; friction ratio is not governing.'),
  ],
  6: [
    mc('x6-1', 'Euler burkulması hangi kolonlar için geçerlidir?', 'Euler buckling applies to which columns?',
      [['Kısa ve kalın', 'Short and stocky'], ['İnce ve uzun (λ yüksek)', 'Slender (high λ)'], ['Sadece beton', 'Concrete only'], ['Akma sonrası', 'Post-yield']], 1,
      'Euler, akmadan önce burkulacak narin kolonlar içindir.', 'Euler is for slender columns that buckle before yield.'),
    calc('x6-2', 'σ = 120 N / 40 mm². Gerilme (MPa)?', 'σ = 120 N / 40 mm². Stress (MPa)?',
      3, 0.05, 'MPa', 'σ = F/A', '120/40 = 3 MPa', '120/40 = 3 MPa'),
    mc('x6-3', 'Kirişte max eğilme gerilmesi formülü?', 'Max bending stress formula?',
      [['Mc/I', 'Mc/I'], ['P/A', 'P/A'], ['T/Wp', 'T/Wp'], ['V/A', 'V/A']], 0,
      'σ = M y / I, yüzeyde y = c.', 'σ = M y / I with y = c at the outer fiber.'),
  ],
  7: [
    mc('x7-1', 'K-factor sac bükümde neyi etkiler?', 'What does K-factor affect in sheet-metal bending?',
      [['Sadece boya', 'Paint only'], ['Açınım boyu (BA/BD)', 'Bend allowance'], ['Yoğunluk', 'Density'], ['Kaynak ağzı', 'Weld groove']], 1,
      'Nötr eksen konumu açınım boyunu belirler.', 'Neutral-axis location sets developed length.'),
    calc('x7-2', 't=2 mm, r=4 mm, K=0.42. BA 90° için (mm)?', 't=2 mm, r=4 mm, K=0.42. BA for 90° (mm)?',
      7.54, 0.2, 'mm', 'BA = θ(r + K t)', 'BA = (π/2)(4+0.84) ≈ 7.54 mm', 'BA = (π/2)(4+0.84) ≈ 7.54 mm'),
    mc('x7-3', 'Kerf nedir?', 'What is kerf?',
      [['Takım izi genişliği', 'Tool cut width'], ['Sac kalınlığı', 'Sheet thickness'], ['Bükme açısı', 'Bend angle'], ['Isıl genleşme', 'Thermal expansion']], 0,
      'Kesim payı (kerf) nesting ve boy hesabına girer.', 'Kerf is the material removed by the cutting tool.'),
  ],
  8: [
    mc('x8-1', 'Reynolds sayısı laminar-türbülans sınırına yakın değeri?', 'Reynolds number near laminar-turbulent transition in pipes?',
      [['~10', '~10'], ['~2300', '~2300'], ['~1e6', '~1e6'], ['0', '0']], 1,
      'Boru akışında ~2300 civarı geçiş başlar.', 'Pipe flow transition starts around Re ≈ 2300.'),
    calc('x8-2', 'Q=0.002 m³/s, A=0.01 m². Hız v (m/s)?', 'Q=0.002 m³/s, A=0.01 m². Velocity v (m/s)?',
      0.2, 0.01, 'm/s', 'v = Q/A', '0.002/0.01 = 0.2 m/s', '0.002/0.01 = 0.2 m/s'),
    mc('x8-3', 'NPSH yetersizse pompa ne yapar?', 'If NPSH is insufficient a pump will:',
      [['Kavitasyon', 'Cavitate'], ['Verim artar', 'Gain efficiency'], ['Debi sonsuz', 'Infinite flow'], ['Sadece ısınır', 'Only heat up']], 0,
      'NPSHa < NPSHr kavitasyona yol açar.', 'NPSHa < NPSHr causes cavitation.'),
  ],
  9: [
    mc('x9-1', 'FEA lineer statikte hangisi varsayılır?', 'Linear-static FEA assumes which?',
      [['Büyük deformasyon', 'Large deflection'], ['Hooke, küçük gerinim', 'Hooke, small strain'], ['Temas sürtünmesi zorunlu', 'Contact friction required'], ['Zaman bağımlı', 'Time dependent']], 1,
      'Küçük yer değiştirme ve lineer malzeme varsayılır.', 'Small displacement and linear material are assumed.'),
    calc('x9-2', 'E=210 GPa, ε=0.001. σ (MPa)?', 'E=210 GPa, ε=0.001. σ (MPa)?',
      210, 1, 'MPa', 'σ = E ε', '210e3 × 0.001 = 210 MPa', '210e3 × 0.001 = 210 MPa'),
    mc('x9-3', 'Mesh sıkılaşınca yakınsama ne gösterir?', 'Mesh refinement that converges indicates:',
      [['Model yanlış', 'Model is wrong'], ['Sonuç kararlılaşıyor', 'Result is stabilizing'], ['CPU hatası', 'CPU error'], ['Sınır şartı yok', 'No BCs']], 1,
      'h-yakınsama, çözümün mesh’ten bağımsızlaştığını gösterir.', 'h-convergence shows the solution is becoming mesh-independent.'),
  ],
  10: [
    mc('x10-1', 'Goodman diyagramı neyi düzeltir?', 'The Goodman diagram corrects for:',
      [['Sıcaklık', 'Temperature'], ['Ortalama gerilme', 'Mean stress'], ['Yağ cinsi', 'Oil grade'], ['Renk kodu', 'Color code']], 1,
      'Yorulmada ortalama gerilme Goodman/Haigh ile düzeltilir.', 'Mean stress in fatigue is corrected via Goodman/Haigh.'),
    calc('x10-2', 'σa=80, σm=40, Se=200, Sut=400. Goodman SF?', 'σa=80, σm=40, Se=200, Sut=400. Goodman SF?',
      2, 0.05, '-', '1/SF = σa/Se + σm/Sut', '80/200 + 40/400 = 0.5 → SF = 2', '80/200 + 40/400 = 0.5 → SF = 2'),
    mc('x10-3', 'Miner kuralı neyi toplar?', 'Miner’s rule sums what?',
      [['Gerinim enerjisi', 'Strain energy'], ['Hasar oranları n/N', 'Damage ratios n/N'], ['Sadece sıcaklık', 'Temperature only'], ['Poisson oranları', 'Poisson ratios']], 1,
      'Σ ni/Ni = 1 kırılma kabulüdür.', 'Failure is assumed when Σ ni/Ni = 1.'),
  ],
};

export function enrichCurriculum(units: CurriculumUnit[]): CurriculumUnit[] {
  return units.map((unit) => ({
    ...unit,
    lessons: unit.lessons.map((lesson, idx) => {
      const pack = UNIT_EXTRAS[unit.number] ?? UNIT_EXTRAS[1];
      const extra: LessonStep[] = [
        { ...pack[idx % pack.length], id: `${lesson.id}-x1` },
        { ...pack[(idx + 1) % pack.length], id: `${lesson.id}-x2` },
      ];
      if (lesson.isBoss) {
        extra.push({ ...pack[(idx + 2) % pack.length], id: `${lesson.id}-x3` });
      }
      return { ...lesson, steps: [...lesson.steps, ...extra] } satisfies CurriculumLesson;
    }),
  }));
}
