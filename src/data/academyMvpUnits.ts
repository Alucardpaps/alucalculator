/**
 * 🎓 ALUCALC OS — ACADEMY MVP (15 CURATED UNITS)
 * 
 * 15 Verified Core Engineering Lessons with Normative Theory,
 * Direct Solver Links, Interactive Quizzes, and Verified Certificates.
 */

export interface AcademyQuizQuestion {
  id: string;
  questionEn: string;
  questionTr: string;
  optionsEn: string[];
  optionsTr: string[];
  correctIndex: number;
  explanationEn: string;
  explanationTr: string;
}

export interface AcademyMvpUnit {
  id: string;
  slug: string;
  unitNumber: number;
  titleEn: string;
  titleTr: string;
  category: 'Fasteners' | 'Machine Elements' | 'Structural' | 'Manufacturing' | 'Materials' | 'FEA & CAD';
  standard: string;
  solverRoute: string;
  summaryEn: string;
  summaryTr: string;
  formulas: { label: string; latex: string }[];
  theoryEn: string;
  theoryTr: string;
  questions: AcademyQuizQuestion[];
}

export const ACADEMY_MVP_UNITS: AcademyMvpUnit[] = [
  {
    id: 'unit-1',
    slug: 'bolt-torque-vdi2230',
    unitNumber: 1,
    titleEn: 'Bolt Torque & Preload (VDI 2230)',
    titleTr: 'Cıvata Torku ve Ön Yük Hesabı (VDI 2230)',
    category: 'Fasteners',
    standard: 'VDI 2230 / ISO 898-1',
    solverRoute: '/calculators/fasteners/vdi2230',
    summaryEn: 'Learn how to calculate precise tightening torque, clamp load, and thread friction coefficients without yielding the fastener.',
    summaryTr: 'Cıvatayı akma sınırına sokmadan hassas sıkma torku, ön gerilme kuvveti ve sürtünme katsayılarını hesaplamayı öğrenin.',
    formulas: [
      { label: 'Tightening Torque (Kellermann-Klein)', latex: 'T = F_M \\left( \\frac{d_2}{2} \\tan(\\varphi + \\rho\') + \\frac{D_b}{2} \\mu_b \\right)' },
      { label: 'Tensile Stress Area', latex: 'A_s = \\frac{\\pi}{4} \\left( \\frac{d_2 + d_3}{2} \\right)^2' },
      { label: 'Utilization Ratio', latex: '\\alpha_A = \\frac{\\sigma_{vM}}{R_{p0.2}} \\le 0.90' }
    ],
    theoryEn: 'Per VDI 2230, bolt tightening torque converts into clamp load FM through helical thread geometry and head bearing friction. Over 85% of applied torque is lost to friction (thread friction μth and underhead friction μb). Exceeding 90% of yield strength Rp0.2 during assembly causes plastic elongation and joint relaxation.',
    theoryTr: 'VDI 2230 standardına göre cıvataya uygulanan sıkma torku, helisel diş geometrisi ve kafa altı sürtünmesi üzerinden eksenel ön yüke (FM) dönüşür. Uygulanan torkun %85\'inden fazlası sürtünmeyle harcanır. Montaj sırasında akma dayanımının (Rp0.2) %90\'ının aşılması kalıcı plastik uzamaya ve bağlantı gevşemesine yol açar.',
    questions: [
      {
        id: 'q1',
        questionEn: 'Approximately what percentage of bolt tightening torque is typically consumed by friction?',
        questionTr: 'Cıvata sıkma torkunun yaklaşık yüzde kaçı sürtünme nedeniyle kaybolur?',
        optionsEn: ['10% - 20%', '30% - 45%', '50% - 60%', '85% - 90%'],
        optionsTr: ['%10 - %20', '%30 - %45', '%50 - %60', '%85 - %90'],
        correctIndex: 3,
        explanationEn: 'Only about 10-15% of torque generates clamp load; the remaining 85-90% overcomes thread and underhead friction.',
        explanationTr: 'Torkun sadece %10-15\'i ön gerilmeye dönüşür, kalan %85-90\'ı diş ve kafa sürtünmesinde harcanır.'
      },
      {
        id: 'q2',
        questionEn: 'What does property class 8.8 mean for a steel bolt?',
        questionTr: '8.8 kalite çelik bir cıvata ne anlama gelir?',
        optionsEn: ['800 MPa tensile, 640 MPa yield', '800 MPa yield, 80 MPa shear', '80 GPa modulus', '8 mm diameter, grade 8'],
        optionsTr: ['800 MPa çekme, 640 MPa akma', '800 MPa akma, 80 MPa kesme', '80 GPa elastisite', '8 mm çap, 8 kademe'],
        correctIndex: 0,
        explanationEn: 'First digit x 100 = 800 MPa ultimate tensile strength; second digit x 0.1 x 800 = 640 MPa yield strength.',
        explanationTr: 'İlk rakam x 100 = 800 MPa çekme dayanımı; ikinci rakam x 0.1 x 800 = 640 MPa akma dayanımıdır.'
      },
      {
        id: 'q3',
        questionEn: 'How does thread lubrication affect required torque for the same clamp load?',
        questionTr: 'Diş yağlaması aynı ön yük için gereken sıkma torkunu nasıl etkiler?',
        optionsEn: ['Increases required torque', 'Decreases required torque', 'Has no effect', 'Doubles yield strength'],
        optionsTr: ['Gereken torku artırır', 'Gereken torku düşürür', 'Etki etmez', 'Akma dayanımını ikiye katlar'],
        correctIndex: 1,
        explanationEn: 'Lubrication lowers the friction coefficient μ, meaning less torque is needed to achieve the target preload FM.',
        explanationTr: 'Yağlama sürtünme katsayısını (μ) düşürdüğünden hedef ön gerilmeye daha düşük torkla ulaşılır.'
      },
      {
        id: 'q4',
        questionEn: 'Per VDI 2230, the maximum allowable yield utilization during tightening is typically:',
        questionTr: 'VDI 2230\'a göre montaj sıkması sırasında izin verilen maksimum akma oranı:',
        optionsEn: ['50%', '75%', '90%', '115%'],
        optionsTr: ['%50', '%75', '%90', '%115'],
        correctIndex: 2,
        explanationEn: 'VDI 2230 restricts tightening stress to 90% of Rp0.2 (0.90) to prevent plastic yielding.',
        explanationTr: 'VDI 2230, cıvatanın kalıcı deformasyona uğramaması için akma gerilmesini %90 (0.90) ile sınırlar.'
      },
      {
        id: 'q5',
        questionEn: 'Which area is used to calculate nominal tensile stress in a threaded fastener?',
        questionTr: 'Dişli bir elemanda anma çekme gerilmesi hangi kesit alanı ile hesaplanır?',
        optionsEn: ['Nominal shank area (A)', 'Tensile stress area (As)', 'Minor thread area (A3)', 'Head area'],
        optionsTr: ['Anma gövde alanı (A)', 'Gerilme kesit alanı (As)', 'Diş dibi alanı (A3)', 'Kafa alanı'],
        correctIndex: 1,
        explanationEn: 'Tensile stress area As (based on mean pitch and minor diameter) determines tensile capacity per ISO 898-1.',
        explanationTr: 'ISO 898-1 standardına göre çekme kapasitesi ortalama diş gerilme alanı (As) üzerinden belirlenir.'
      }
    ]
  },
  {
    id: 'unit-2',
    slug: 'bearing-life-iso281',
    unitNumber: 2,
    titleEn: 'Rolling Bearing Life & Rating (ISO 281)',
    titleTr: 'Rulman Ömrü ve Yük Kapasitesi (ISO 281)',
    category: 'Machine Elements',
    standard: 'ISO 281 / DIN ISO 76',
    solverRoute: '/calculators/machine-elements/bearing-life',
    summaryEn: 'Understand basic rating life L10, dynamic equivalent load P, and life exponents for ball vs roller bearings.',
    summaryTr: 'Temel L10 anma ömrü, eşdeğer dinamik yük P ve bilyalı/makaralı rulman ömür üslerini kavrayın.',
    formulas: [
      { label: 'Basic Rating Life L10 (Millions Revs)', latex: 'L_{10} = \\left( \\frac{C}{P} \\right)^p' },
      { label: 'Equivalent Dynamic Load P', latex: 'P = X \\cdot F_r + Y \\cdot F_a' },
      { label: 'Life in Operating Hours', latex: 'L_{10h} = \\frac{10^6}{60 \\cdot n} \\left( \\frac{C}{P} \\right)^p' }
    ],
    theoryEn: 'ISO 281 defines bearing life L10 as the number of revolutions (or hours at constant rpm) that 90% of a group of identical bearings will achieve before first evidence of fatigue spalling. The life exponent p is 3 for ball bearings and 10/3 (3.333) for roller bearings.',
    theoryTr: 'ISO 281 standardı L10 ömrünü, aynı koşullardaki rulman grubunun %90\'ının metal yorulması yaşamadan ulaştığı çalışma süresi olarak tanımlar. Ömür üssü p, bilyalı rulmanlar için 3, makaralı rulmanlar için 10/3 (3.333) olarak alınır.',
    questions: [
      {
        id: 'q1',
        questionEn: 'What does L10 bearing life represent statistically?',
        questionTr: 'L10 rulman ömrü istatistiksel olarak neyi ifade eder?',
        optionsEn: ['10% survival rate', '90% reliability (10% failure)', '100% lifetime guarantee', '10 operating years'],
        optionsTr: ['%10 hayatta kalma', '%90 güvenilirlik (%10 hasar)', '%100 garanti', '10 çalışma yılı'],
        correctIndex: 1,
        explanationEn: 'L10 is the 90% reliability rating life where only 10% of bearings show fatigue spalling.',
        explanationTr: 'L10, rulmanların %90\'ının sorunsuz çalıştığı, sadece %10\'unun yorulma gösterebileceği ömür standardıdır.'
      },
      {
        id: 'q2',
        questionEn: 'What is the life exponent p for ball bearings vs roller bearings?',
        questionTr: 'Bilyalı ve makaralı rulmanlar için p ömür üssü değerleri nelerdir?',
        optionsEn: ['p = 2 for ball, p = 3 for roller', 'p = 3 for ball, p = 10/3 for roller', 'p = 4 for both', 'p = 1.5 for ball'],
        optionsTr: ['Bilyalı 2, Makaralı 3', 'Bilyalı 3, Makaralı 10/3', 'Her ikisi için 4', 'Bilyalı 1.5'],
        correctIndex: 1,
        explanationEn: 'ISO 281 specifies p = 3 for point contact (ball) and p = 10/3 (3.333) for line contact (roller).',
        explanationTr: 'ISO 281 standardında noktasal temas (bilyalı) için p=3, çizgisel temas (makaralı) için p=10/3 kullanılır.'
      },
      {
        id: 'q3',
        questionEn: 'If the dynamic load on a ball bearing is doubled, its fatigue life decreases by a factor of:',
        questionTr: 'Bilyalı rulmandaki yük iki katına çıkarsa ömrü kaç katına düşer?',
        optionsEn: ['2x (50%)', '4x (25%)', '8x (12.5%)', '16x (6.25%)'],
        optionsTr: ['2 kat (%50)', '4 kat (%25)', '8 kat (%12.5)', '16 kat (%6.25)'],
        correctIndex: 2,
        explanationEn: 'Because p = 3, (1/2)^3 = 1/8. Doubling load reduces ball bearing life by a factor of 8.',
        explanationTr: 'p=3 olduğundan (1/2)^3 = 1/8 olur; yük 2 katına çıkınca rulman ömrü 8 kat azalır.'
      },
      {
        id: 'q4',
        questionEn: 'What happens if equivalent load P exceeds dynamic capacity C (P > C)?',
        questionTr: 'Eşdeğer dinamik yük P, katalog kapasitesi C\'den büyük olursa (P > C) ne olur?',
        optionsEn: ['Bearing operates normally', 'Life drops below 1 million revs; premature fatigue', 'Grease melts instantly', 'Clearance increases'],
        optionsTr: ['Rulman normal çalışır', 'Ömür 1 milyon devrin altına iner, erken hasar', 'Gres anında erir', 'Boşluk artar'],
        correctIndex: 1,
        explanationEn: 'P > C means L10 < 1 million revolutions, signaling dangerous overload under ISO 281.',
        explanationTr: 'P > C durumunda ömür 1 milyon devrin altına düşer; ISO 281\'e göre kritik aşırı yük uyarısıdır.'
      },
      {
        id: 'q5',
        questionEn: 'Which factors combine radial force Fr and axial force Fa into equivalent load P?',
        questionTr: 'Radyal yük Fr ile eksenel yük Fa\'yı eşdeğer yük P\'ye dönüştüren faktörler hangileridir?',
        optionsEn: ['X and Y factors', 'Kt and Kf factors', 'KA and KV factors', 'E and G moduli'],
        optionsTr: ['X ve Y faktörleri', 'Kt ve Kf faktörleri', 'KA ve KV faktörleri', 'E ve G modülleri'],
        correctIndex: 0,
        explanationEn: 'Radial factor X and axial factor Y weight the forces depending on contact angle and Fa/Fr ratio.',
        explanationTr: 'Temas açısı ve Fa/Fr oranına göre radyal faktör X ve eksenel faktör Y ile yükler birleştirilir.'
      }
    ]
  },
  {
    id: 'unit-3',
    slug: 'gear-strength-iso6336',
    unitNumber: 3,
    titleEn: 'Gear Strength & Pitting (ISO 6336)',
    titleTr: 'Dişli Mukavemeti ve Yüzey Ezilmesi (ISO 6336)',
    category: 'Machine Elements',
    standard: 'ISO 6336 / AGMA 2001',
    solverRoute: '/calculators/planetary-gearbox',
    summaryEn: 'Master tooth root bending stress (Lewis formula) and flank contact pressure (Hertzian contact).',
    summaryTr: 'Diş dibi eğilme mukavemeti (Lewis formülü) ve diş yüzeyi Hertz temas basıncını hesaplayın.',
    formulas: [
      { label: 'Root Bending Stress', latex: '\\sigma_F = \\frac{F_t}{b \\cdot m_n} \\cdot Y_F \\cdot Y_S \\cdot K_A \\cdot K_V' },
      { label: 'Hertzian Contact Stress', latex: '\\sigma_H = Z_H \\cdot Z_E \\cdot \\sqrt{\\frac{F_t}{d_1 \\cdot b} \\cdot \\frac{u + 1}{u}}' }
    ],
    theoryEn: 'Gear failures occur primarily in two modes: tooth root fatigue fracture due to cyclical bending stresses, and tooth flank pitting due to excessive Hertzian contact pressure. ISO 6336 evaluates both safety factors SF (bending) and SH (contact pitting).',
    theoryTr: 'Dişli hasarları iki ana modda gerçekleşir: devirsel eğilmeden kaynaklı diş dibi yorulma kırılması ve yüksek Hertz temas basıncından kaynaklı yüzey çukurlaşması (pitting). ISO 6336 hem SF (kırılma) hem SH (yüzey) güvenlik katsayılarını inceler.',
    questions: [
      {
        id: 'q1',
        questionEn: 'What is gear module m (in millimeters)?',
        questionTr: 'Dişli modülü m (milimetre) neyi ifade eder?',
        optionsEn: ['Pitch diameter divided by number of teeth (d / z)', 'Number of teeth times pitch', 'Tooth height', 'Center distance'],
        optionsTr: ['Bölüm dairesi çapının diş sayısına oranı (d / z)', 'Diş sayısı x hatve', 'Diş yüksekliği', 'Eksen mesafesi'],
        correctIndex: 0,
        explanationEn: 'Module m = d / z (mm). It is the standardized geometric scale of gear teeth.',
        explanationTr: 'Modül m = d / z (mm) olarak tanımlanır ve dişli dişlerinin standart boyut ölçeğidir.'
      },
      {
        id: 'q2',
        questionEn: 'Which stress leads to tooth root breakage?',
        questionTr: 'Diş dibi kırılmasına yol açan gerilme türü hangisidir?',
        optionsEn: ['Hertzian contact pressure', 'Bending tensile stress', 'Thermal expansion', 'Residual hoop stress'],
        optionsTr: ['Hertz temas basıncı', 'Eğilme çekme gerilmesi', 'Termal genleşme', 'Radyal gerilme'],
        correctIndex: 1,
        explanationEn: 'Tangential tooth force creates cyclical cantilever bending tensile stress at the root fillet.',
        explanationTr: 'Teğetsel diş kuvveti diş dibi kavisinde periyodik konsol eğilme çekme gerilmesi oluşturur.'
      },
      {
        id: 'q3',
        questionEn: 'What is gear pitting (flank failure) caused by?',
        questionTr: 'Dişli yüzey çukurlaşması (pitting) neyden kaynaklanır?',
        optionsEn: ['Excessive Hertzian contact pressure and surface fatigue', 'Too few teeth on gear', 'High module', 'Low torque'],
        optionsTr: ['Aşırı Hertz temas basıncı ve yüzey yorulması', 'Çok az diş sayısı', 'Yüksek modül', 'Düşük tork'],
        correctIndex: 0,
        explanationEn: 'High contact stress sigma_H causes subsurface shear stress and fatigue pitting micro-craters.',
        explanationTr: 'Yüksek temas gerilmesi yüzey altında kayma yorulmasına ve çukurcuklara yol açar.'
      },
      {
        id: 'q4',
        questionEn: 'What is the standard pressure angle alpha for most industrial spur gears?',
        questionTr: 'Endüstriyel düz dişlilerde en yaygın standart kavrama açısı alfa kaçtır?',
        optionsEn: ['14.5°', '20°', '30°', '45°'],
        optionsTr: ['14.5°', '20°', '30°', '45°'],
        correctIndex: 1,
        explanationEn: '20 degrees is the international ISO standard pressure angle for metric involute gears.',
        explanationTr: '20 derece, metrik evolvent dişliler için uluslararası ISO standart kavrama açısıdır.'
      },
      {
        id: 'q5',
        questionEn: 'To prevent gear tooth undercut during hobbing, the minimum teeth count for 20° spur gear is approximately:',
        questionTr: '20° kavrama açılı düz dişlide diş dibi kesilmesini (undercut) önlemek için gereken minimum diş sayısı yaklaşık kaçtır?',
        optionsEn: ['7', '12', '17', '25'],
        optionsTr: ['7', '12', '17', '25'],
        correctIndex: 2,
        explanationEn: 'Standard 20° involute gears require at least z_min = 17 teeth without profile shift to avoid undercut.',
        explanationTr: 'Profil kaydırmasız standart 20° dişlilerde diş dibi kesilmesini önlemek için en az 17 diş gerekir.'
      }
    ]
  },
  {
    id: 'unit-4',
    slug: 'shaft-diameter-din743',
    unitNumber: 4,
    titleEn: 'Shaft Sizing & Torsion (DIN 743)',
    titleTr: 'Mil Çapı ve Burulma Mukavemeti (DIN 743)',
    category: 'Machine Elements',
    standard: 'DIN 743 / ASME B106.1M',
    solverRoute: '/shafts',
    summaryEn: 'Calculate minimum transmission shaft diameter under combined bending moment and torsional torque.',
    summaryTr: 'Bileşik eğilme momenti ve burulma torku altında minimum transmisyon mili çapını hesaplayın.',
    formulas: [
      { label: 'Polar Section Modulus', latex: 'W_p = \\frac{\\pi \\cdot d^3}{16}' },
      { label: 'Equivalent Stress (Tresca)', latex: '\\sigma_e = \\sqrt{\\sigma_b^2 + 4 \\tau_t^2}' },
      { label: 'Minimum Shaft Diameter', latex: 'd_{min} = \\left( \\frac{32 \\cdot S_F}{\\pi \\cdot S_y} \\sqrt{M^2 + T^2} \\right)^{1/3}' }
    ],
    theoryEn: 'Power transmission shafts experience simultaneously alternating bending (from gears/pulleys) and steady or pulsating torsion (from transmitted torque). Sizing requires calculating equivalent stress via Tresca or von Mises combined fatigue criteria.',
    theoryTr: 'Güç iletim milleri aynı anda devirsel eğilme momenti ve burulma torku etkisinde kalır. Boyutlandırma, Tresca veya von Mises bileşik gerilme kriterleri üzerinden minimum çapın belirlenmesini gerektirir.',
    questions: [
      {
        id: 'q1',
        questionEn: 'Which formula gives the polar section modulus Wp of a solid circular shaft?',
        questionTr: 'Dolu dairesel bir milin kutupsal mukavemet momenti Wp formülü hangisidir?',
        optionsEn: ['pi * d^3 / 16', 'pi * d^4 / 32', 'pi * d^2 / 4', 'd^3 / 6'],
        optionsTr: ['pi * d^3 / 16', 'pi * d^4 / 32', 'pi * d^2 / 4', 'd^3 / 6'],
        correctIndex: 0,
        explanationEn: 'For a solid round shaft, Wp = (pi * d^3) / 16, used to determine torsional shear stress tau = T / Wp.',
        explanationTr: 'Dolu yuvarlak mil için Wp = (pi * d^3) / 16 olup burulma kayma gerilmesi tau = T / Wp formülünde kullanılır.'
      },
      {
        id: 'q2',
        questionEn: 'When torque T is applied to a shaft, maximum shear stress occurs at:',
        questionTr: 'Bir mile burulma torku T uygulandığında maksimum kayma gerilmesi nerede oluşur?',
        optionsEn: ['The central axis (r = 0)', 'The outer surface (r = d/2)', 'Mid-radius (r = d/4)', 'Uniform everywhere'],
        optionsTr: ['Merkez eksende (r = 0)', 'Dış yüzeyde (r = d/2)', 'Orta yarıçapta (r = d/4)', 'Her yerde eşit'],
        correctIndex: 1,
        explanationEn: 'Torsional shear stress varies linearly from zero at the center to maximum at the outermost fiber.',
        explanationTr: 'Burulma gerilmesi merkezde sıfır olup dış yüzeyde maksimum değere ulaşır.'
      },
      {
        id: 'q3',
        questionEn: 'Why do stepped shafts have keyways and shoulder fillets sized carefully?',
        questionTr: 'Kademeli millerde kama kanalları ve fatura kavisleri neden titizlikle boyutlandırılır?',
        optionsEn: ['To reduce weight', 'To prevent stress concentrations and fatigue failure', 'To ease painting', 'To increase rpm'],
        optionsTr: ['Ağırlığı azaltmak', 'Gerilme yığılmasını ve yorulma kırılmasını önlemek', 'Boyamayı kolaylaştırmak', 'Devri artırmak'],
        correctIndex: 1,
        explanationEn: 'Sharp changes in geometry cause stress concentrations Kt that dramatically lower fatigue endurance.',
        explanationTr: 'Keskin geometri değişimleri gerilme yığılması yaratarak yorulma ömrünü dramatik şekilde düşürür.'
      },
      {
        id: 'q4',
        questionEn: 'How does transmitting torque T at higher RPM affect required shaft diameter for the same power P?',
        questionTr: 'Aynı gücü (P) daha yüksek devirde (RPM) iletmek gereken mil çapını nasıl etkiler?',
        optionsEn: ['Requires smaller diameter (T is lower)', 'Requires larger diameter', 'Diameter remains identical', 'Doubles shaft weight'],
        optionsTr: ['Daha küçük çap gerekir (Tork düşer)', 'Daha büyük çap gerekir', 'Çap aynı kalır', 'Ağırlık ikiye katlanır'],
        correctIndex: 0,
        explanationEn: 'Power P = T * omega. Higher speed means lower torque, reducing required shaft size.',
        explanationTr: 'Güç P = T * omega olduğundan yüksek devirde tork düşer ve daha ince mil yeterli olur.'
      },
      {
        id: 'q5',
        questionEn: 'Torsional angle of twist theta (in radians) is proportional to:',
        questionTr: 'Milin burulma açısı teta (radyan) aşağıdakilerden hangisiyle doğru orantılıdır?',
        optionsEn: ['Length L and Torque T', 'Diameter d^4', 'Shear modulus G', 'Area A'],
        optionsTr: ['Mil uzunluğu L ve Tork T', 'Çap d^4', 'Kayma modülü G', 'Alan A'],
        correctIndex: 0,
        explanationEn: 'theta = (T * L) / (G * Ip). Angle of twist is directly proportional to Torque and Length.',
        explanationTr: 'theta = (T * L) / (G * Ip) formülüne göre burulma açısı tork ve uzunluk ile doğru orantılıdır.'
      }
    ]
  },
  {
    id: 'unit-5',
    slug: 'beam-deflection-euler-bernoulli',
    unitNumber: 5,
    titleEn: 'Beam Deflection & Bending (Euler-Bernoulli)',
    titleTr: 'Kiriş Sehimi ve Eğilme (Euler-Bernoulli)',
    category: 'Structural',
    standard: 'Euler-Bernoulli / ISO 16834',
    solverRoute: '/calculators/structural/beam-deflection',
    summaryEn: 'Calculate moments of inertia, bending moments, maximum fiber stress, and elastic deflection curves.',
    summaryTr: 'Atalet momentlerini, eğilme momentlerini, maksimum lif gerilmesini ve elastik sehim eğrilerini hesaplayın.',
    formulas: [
      { label: 'Area Moment of Inertia (Rectangular)', latex: 'I_x = \\frac{b \\cdot h^3}{12}' },
      { label: 'Flexure Formula', latex: '\\sigma = \\frac{M \\cdot y}{I}' },
      { label: 'Cantilever Tip Deflection', latex: '\\delta_{max} = \\frac{P \\cdot L^3}{3 \\cdot E \\cdot I}' }
    ],
    theoryEn: 'The Euler-Bernoulli beam equation relates bending moment M(x) to curvature d2v/dx2 = M / EI. The beam section stiffness EI depends on Young’s modulus E and area moment of inertia I. Bending stresses are tensile on one side of the neutral axis and compressive on the other.',
    theoryTr: 'Euler-Bernoulli kiriş teorisi, eğilme momenti M(x) ile eğrilik d2v/dx2 = M / EI arasındaki ilişkiyi kurar. Kiriş eğilme rijitliği EI, elastisite modülü E ve atalet momenti I\'ya bağlıdır. Nötr eksenin bir tarafında çekme, diğer tarafında basma gerilmesi oluşur.',
    questions: [
      {
        id: 'q1',
        questionEn: 'How does doubling beam height h affect rectangular moment of inertia I = b*h^3 / 12?',
        questionTr: 'Dikdörtgen kiriş yüksekliği h iki katına çıkarsa atalet momenti I nasıl değişir?',
        optionsEn: ['Increases 2x', 'Increases 4x', 'Increases 8x', 'Increases 16x'],
        optionsTr: ['2 kat artar', '4 kat artar', '8 kat artar', '16 kat artar'],
        correctIndex: 2,
        explanationEn: 'Because h is cubed (h^3), doubling height increases moment of inertia by 2^3 = 8 times.',
        explanationTr: 'Yükseklik küp mertebesinde (h^3) olduğundan yüksekliği 2 katına çıkarmak ataleti 8 kat artırır.'
      },
      {
        id: 'q2',
        questionEn: 'Where is bending stress zero in a symmetric beam?',
        questionTr: 'Simetrik bir kirişte eğilme gerilmesi nerede sıfırdır?',
        optionsEn: ['Top outer fiber', 'Bottom outer fiber', 'At the neutral axis (centroid)', 'At the supports'],
        optionsTr: ['En üst lifte', 'En alt lifte', 'Nötr eksende (ağırlık merkezi)', 'Mesnetlerde'],
        correctIndex: 2,
        explanationEn: 'At the neutral axis y = 0, so flexure stress sigma = (M * y) / I = 0.',
        explanationTr: 'Nötr eksende y = 0 olduğundan sigma = (M * y) / I = 0 olur.'
      },
      {
        id: 'q3',
        questionEn: 'For a cantilever beam of length L with end load P, max deflection delta is proportional to:',
        questionTr: 'Uzunluğu L olan uçtan yüklü konsol kirişte maksimum sehim aşağıdakilerden hangisiyle orantılıdır?',
        optionsEn: ['L', 'L^2', 'L^3', '1/L'],
        optionsTr: ['L', 'L^2', 'L^3', '1/L'],
        correctIndex: 2,
        explanationEn: 'Cantilever deflection delta = P * L^3 / (3*E*I). Doubling length increases deflection 8x.',
        explanationTr: 'Konsol sehim formülü delta = P * L^3 / (3EI) olup uzunluğun küpüyle doğru orantılıdır.'
      },
      {
        id: 'q4',
        questionEn: 'What does Young’s Modulus E represent in beam mechanics?',
        questionTr: 'Kiriş mekaniğinde Young Modülü E neyi temsil eder?',
        optionsEn: ['Material density', 'Material stiffness / elastic resistance to stretching', 'Yield strength', 'Poisson ratio'],
        optionsTr: ['Malzeme yoğunluğu', 'Malzemenin rijitliği / elastik uzamaya direnci', 'Akma dayanımı', 'Poisson oranı'],
        correctIndex: 1,
        explanationEn: 'E represents material elastic stiffness (e.g. 70 GPa for Aluminum, 210 GPa for Steel).',
        explanationTr: 'E malzemenin elastik rijitliğidir (örneğin Alüminyum için 70 GPa, Çelik için 210 GPa).'
      },
      {
        id: 'q5',
        questionEn: 'What is the parallel axis theorem (Steiner rule) used for?',
        questionTr: 'Paralel eksen teoremi (Steiner kuralı) ne için kullanılır?',
        optionsEn: ['Calculating inertia about a non-centroidal parallel axis (I = I_c + A*d^2)', 'Finding weight', 'Measuring torque', 'Calculating shear'],
        optionsTr: ['Ağırlık merkezinden kaçık paralel eksene göre atalet hesaplama (I = Ic + A*d^2)', 'Ağırlık bulma', 'Tork ölçme', 'Kayma hesabı'],
        correctIndex: 0,
        explanationEn: 'The parallel axis theorem I = I_cm + A*d^2 computes composite section inertia (like I-beams).',
        explanationTr: 'I = Ic + A*d^2 formülüyle bileşik kesitlerin (I-profil gibi) ataleti hesaplanır.'
      }
    ]
  },
  {
    id: 'unit-6',
    slug: 'spring-design-din2089',
    unitNumber: 6,
    titleEn: 'Helical Compression Spring Design (DIN 2089)',
    titleTr: 'Helisel Basma Yayı Tasarımı (DIN 2089)',
    category: 'Machine Elements',
    standard: 'DIN 2089 / EN 13906-1',
    solverRoute: '/calculators/spring-calculator',
    summaryEn: 'Compute spring rate k, shear stress with Wahl correction factor k_w, and solid height.',
    summaryTr: 'Yay sabiti k, Wahl gerilme düzeltme faktörü kw ile kayma gerilmesi ve blok boyunu hesaplayın.',
    formulas: [
      { label: 'Spring Rate (Stiffness)', latex: 'R = \\frac{G \\cdot d^4}{8 \\cdot D_m^3 \\cdot n}' },
      { label: 'Wahl Curvature Correction Factor', latex: 'k_w = \\frac{4C - 1}{4C - 4} + \\frac{0.615}{C}' },
      { label: 'Corrected Torsional Stress', latex: '\\tau = k_w \\cdot \\frac{8 \\cdot F \\cdot D_m}{\\pi \\cdot d^3}' }
    ],
    theoryEn: 'Helical compression springs primarily carry torsion in the wire. The curvature and direct shear produce stress concentration on the inside wire diameter, quantified by the Wahl factor kw based on spring index C = Dm / d.',
    theoryTr: 'Helisel basma yayları tel ekseninde ağırlıklı olarak burulma taşır. Eğrilik ve doğrudan kayma, telin iç yüzeyinde Wahl faktörü (kw) ile hesaplanan gerilme yığılması oluşturur (Yay indeksi C = Dm / d).',
    questions: [
      {
        id: 'q1',
        questionEn: 'What is the spring index C?',
        questionTr: 'Yay indeksi C nedir?',
        optionsEn: ['Mean coil diameter divided by wire diameter (Dm / d)', 'Outer diameter / length', 'Number of coils', 'Free length / solid height'],
        optionsTr: ['Ortalama yay çapının tel çapına oranı (Dm / d)', 'Dış çap / boy', 'Sarım sayısı', 'Serbest boy / blok boy'],
        correctIndex: 0,
        explanationEn: 'Spring index C = Dm / d represents spring proportion (recommended range is 4 to 12).',
        explanationTr: 'Yay indeksi C = Dm / d olup yay oranını belirler (tavsiye edilen aralık 4 ile 12 arasıdır).'
      },
      {
        id: 'q2',
        questionEn: 'Why is the Wahl factor kw applied to spring stress calculations?',
        questionTr: 'Yay gerilme hesaplarında Wahl faktörü kw neden uygulanır?',
        optionsEn: ['To correct for wire curvature and direct transverse shear on the inner coil surface', 'To increase spring stiffness', 'To account for paint', 'To reduce coils'],
        optionsTr: ['Telin iç yüzeyindeki eğrilik ve doğrudan kayma gerilme yığılmasını düzeltmek için', 'Rijitliği artırmak için', 'Boya payı için', 'Sarımı azaltmak için'],
        correctIndex: 0,
        explanationEn: 'Wahl factor corrects for stress concentration on the inside of the wire due to tight curvature.',
        explanationTr: 'Wahl faktörü telin iç kavisinde oluşan yerel gerilme yığılmasını hesaba katar.'
      },
      {
        id: 'q3',
        questionEn: 'How does doubling spring wire diameter d affect stiffness R = (G*d^4)/(8*Dm^3*n)?',
        questionTr: 'Tel çapı d iki katına çıkarsa yay rijitliği R nasıl değişir?',
        optionsEn: ['Increases 2x', 'Increases 4x', 'Increases 8x', 'Increases 16x'],
        optionsTr: ['2 kat artar', '4 kat artar', '8 kat artar', '16 kat artar'],
        correctIndex: 3,
        explanationEn: 'Because d is to the 4th power (d^4), 2^4 = 16 times increase in spring rate.',
        explanationTr: 'Tel çapı 4. kuvvette (d^4) olduğundan tel çapını 2 kat artırmak rijitliği 16 kat artırır.'
      },
      {
        id: 'q4',
        questionEn: 'What is spring solid length (block length Lc)?',
        questionTr: 'Yayın blok boyu (kapanma boyu Lc) ne demektir?',
        optionsEn: ['Length when all active coils contact each other completely compressed', 'Unloaded length', 'Working length', 'Wire length'],
        optionsTr: ['Tüm yay sarımlarının birbirine tamamen temas ettiği kapanmış boy', 'Yüksüz boy', 'Çalışma boyu', 'Tel uzunluğu'],
        correctIndex: 0,
        explanationEn: 'Solid length Lc = n_total * d is the compressed height when coils touch solidly.',
        explanationTr: 'Blok boyu, tüm sarımların birbirine değdiği maksimum sıkışma yüksekliğidir.'
      },
      {
        id: 'q5',
        questionEn: 'Which elastic property determines spring rate for helical wire springs?',
        questionTr: 'Helisel yaylarda yay sabitini belirleyen elastik malzeme özelliği hangisidir?',
        optionsEn: ['Shear Modulus G (Torsional Modulus)', 'Thermal conductivity', 'Ultimate tensile strength', 'Hardness'],
        optionsTr: ['Kayma Modülü G (Burulma Modülü)', 'Isıl iletkenlik', 'Çekme dayanımı', 'Sertlik'],
        correctIndex: 0,
        explanationEn: 'Since the wire twists in torsion, Shear Modulus G (approx. 78.5 GPa for steel) governs stiffness.',
        explanationTr: 'Tel burulmaya maruz kaldığı için kayma modülü G (çelik için ~78.5 GPa) yay sabitini belirler.'
      }
    ]
  },
  {
    id: 'unit-7',
    slug: 'fits-and-tolerances-iso286',
    unitNumber: 7,
    titleEn: 'Fits & Tolerances (ISO 286)',
    titleTr: 'Toleranslar ve Geçmeler (ISO 286)',
    category: 'Manufacturing',
    standard: 'ISO 286-1 / DIN 7154',
    solverRoute: '/calculators/limits-fits',
    summaryEn: 'Understand Hole-Basis system (H7/g6, H7/p6), Clearance, Transition, and Interference fits.',
    summaryTr: 'Delik Esaslı sistem (H7/g6, H7/p6), Boşluklu, Geçişli ve Sıkı geçme toleranslarını öğrenin.',
    formulas: [
      { label: 'Fundamental Tolerance IT', latex: 'i = 0.45 \\cdot \\sqrt[3]{D} + 0.001 \\cdot D' },
      { label: 'Hole Tolerance Band', latex: 'EI = 0, \\quad ES = +IT' },
      { label: 'Max Clearance', latex: 'C_{max} = ES_{hole} - ei_{shaft}' }
    ],
    theoryEn: 'ISO 286 establishes the standard tolerance system for mating cylindrical features. Capital letters (H7) denote holes, lowercase letters (g6, p6) denote shafts. The Hole-Basis system sets the hole lower deviation to zero (EI = 0), adjusting shaft tolerance for the fit.',
    theoryTr: 'ISO 286, birbirine geçen silindirik parçalar için tolerans sistemidir. Büyük harfler deliği (H7), küçük harfler mili (g6, p6) temsil eder. Delik Esaslı sistemde delik alt sapması sıfır (EI=0) kabul edilir ve geçme tipi mil toleransı ile ayarlanır.',
    questions: [
      {
        id: 'q1',
        questionEn: 'In ISO 286, capital letters (e.g. H7) represent:',
        questionTr: 'ISO 286 sisteminde büyük harfler (örn. H7) neyi temsil eder?',
        optionsEn: ['Holes (Internal features)', 'Shafts (External features)', 'Hardness grade', 'Roughness'],
        optionsTr: ['Delikleri (İç çaplar)', 'Milleri (Dış çaplar)', 'Sertlik derecesi', 'Yüzey pürüzlülüğü'],
        correctIndex: 0,
        explanationEn: 'Capital letters (H, G, P) are holes/internal dimensions; lowercase letters (h, g, p) are shafts.',
        explanationTr: 'Büyük harfler delikleri, küçük harfler ise milleri temsil eder.'
      },
      {
        id: 'q2',
        questionEn: 'What type of fit is H7/g6?',
        questionTr: 'H7/g6 nasıl bir geçmedir?',
        optionsEn: ['Clearance fit (free sliding/rotation)', 'Interference fit (press fit)', 'Transition fit', 'Thread fit'],
        optionsTr: ['Boşluklu geçme (serbest dönme/kayma)', 'Sıkı geçme (pres)', 'Geçişli geçme', 'Dişli geçme'],
        correctIndex: 0,
        explanationEn: 'H7/g6 is a precision clearance fit with guaranteed positive clearance for lubricated sliding.',
        explanationTr: 'H7/g6, yağlamalı serbest kayma ve dönme sağlayan hassas boşluklu geçmedir.'
      },
      {
        id: 'q3',
        questionEn: 'What type of fit is H7/p6 or H7/r6?',
        questionTr: 'H7/p6 veya H7/r6 nasıl bir geçmedir?',
        optionsEn: ['Interference fit (requires press or thermal expansion)', 'Loose clearance', 'Keyway fit', 'Snap fit'],
        optionsTr: ['Sıkı geçme (pres veya ısıtma gerektirir)', 'Gevşek boşluklu', 'Kama geçme', 'Geçmeli'],
        correctIndex: 0,
        explanationEn: 'H7/p6 is a permanent interference press-fit where the shaft is always larger than the hole.',
        explanationTr: 'H7/p6 sıkı geçmedir; mil çapı her zaman delik çapından büyüktür ve pres montajı gerekir.'
      },
      {
        id: 'q4',
        questionEn: 'Why is the Hole-Basis system (H) preferred over the Shaft-Basis system (h) in machining?',
        questionTr: 'İmalatta Delik Esaslı sistem (H) neden Mil Esaslı sisteme (h) tercih edilir?',
        optionsEn: ['Standard reamers and drills produce fixed hole sizes; shafts are easily turned to size on CNC lathes', 'Holes are cheaper', 'Shafts are too soft', 'ISO bans shaft basis'],
        optionsTr: ['Standart rayba ve matkaplar sabit delik açar; miller CNC tornada kolayca istenen çapa işlenebilir', 'Delikler daha ucuzdur', 'Miller çok yumuşaktır', 'ISO yasaklamıştır'],
        correctIndex: 0,
        explanationEn: 'Fixed standard tooling (drills/reamers) makes standard holes economical, while shaft OD is easily turned.',
        explanationTr: 'Standart takım maliyeti (rayba/matkap) nedeniyle deliği H7 sabitleyip mili işlemek çok daha ekonomiktir.'
      },
      {
        id: 'q5',
        questionEn: 'What does IT stand for in IT7, IT6?',
        questionTr: 'IT7, IT6 ifadesindeki IT ne anlama gelir?',
        optionsEn: ['International Tolerance grade', 'Information Technology', 'Internal Thread', 'Iron Tension'],
        optionsTr: ['Uluslararası Tolerans Derecesi (International Tolerance)', 'Bilişim Teknolojisi', 'İç Diş', 'Demir Çekme'],
        correctIndex: 0,
        explanationEn: 'IT stands for International Tolerance grade per ISO 286 (lower number = tighter tolerance).',
        explanationTr: 'IT, Uluslararası Tolerans kalitesidir (rakam küçüldükçe tolerans hassasiyeti artar).'
      }
    ]
  },
  {
    id: 'unit-8',
    slug: 'sheet-metal-bend-din6935',
    unitNumber: 8,
    titleEn: 'Sheet Metal Bending & K-Factor (DIN 6935)',
    titleTr: 'Sac Büküm ve K-Faktörü (DIN 6935)',
    category: 'Manufacturing',
    standard: 'DIN 6935',
    solverRoute: '/calculators/sheet-metal-bend',
    summaryEn: 'Calculate flat pattern length, Bend Allowance (BA), Bend Deduction (BD), and neutral axis shifting.',
    summaryTr: 'Sac açınım boyu, Büküm Payı (BA), Büküm Düşümü (BD) ve nötr eksen kaymasını hesaplayın.',
    formulas: [
      { label: 'Bend Allowance BA', latex: 'BA = \\frac{\\pi}{180} \\cdot \\alpha \\cdot (R + K \\cdot T)' },
      { label: 'Setback (OSB)', latex: 'OSB = \\tan\\left(\\frac{\\alpha}{2}\\right) \\cdot (R + T)' },
      { label: 'Flat Blank Length', latex: 'L_{flat} = L_1 + L_2 - 2 \\cdot OSB + BA' }
    ],
    theoryEn: 'When sheet metal is bent, the outer fiber is in tension and the inner fiber is in compression. The neutral line shifts inward toward the compression side. The K-factor (ratio of neutral line depth to sheet thickness T) typically ranges between 0.33 and 0.50 depending on tooling radius R and material ductility.',
    theoryTr: 'Sac metal büküldüğünde dış yüzey çekmeye, iç yüzey basmaya maruz kalır. Nötr eksen içe doğru kayar. K-faktörü (nötr eksen derinliğinin et kalınlığına oranı), büküm yarıçapı R ve malzeme sünekliğine göre 0.33 ile 0.50 arasında değişir.',
    questions: [
      {
        id: 'q1',
        questionEn: 'What is the K-factor in sheet metal bending?',
        questionTr: 'Sac bükümünde K-faktörü nedir?',
        optionsEn: ['Ratio of neutral axis distance from inside surface to sheet thickness (t_neutral / T)', 'Die width ratio', 'Bend angle in radians', 'Springback factor'],
        optionsTr: ['Nötr eksenin iç yüzeye olan mesafesinin sac kalınlığına oranı (t_nötr / T)', 'Kalıp genişlik oranı', 'Büküm açısı', 'Geri yaylanma katsayısı'],
        correctIndex: 0,
        explanationEn: 'K-factor = t_neutral / T. It locates the unelongated neutral plane during bending.',
        explanationTr: 'K-faktörü = t_nötr / T olup büküm sırasında boyu değişmeyen nötr eksenin konumunu belirler.'
      },
      {
        id: 'q2',
        questionEn: 'When air bending standard aluminum 6061-T6 with R ≈ T, typical K-factor is approximately:',
        questionTr: 'Standart alüminyum 6061-T6 sac bükümünde (R ≈ T) tipik K-faktörü yaklaşık kaçtır?',
        optionsEn: ['0.10', '0.40 - 0.45', '0.85', '1.00'],
        optionsTr: ['0.10', '0.40 - 0.45', '0.85', '1.00'],
        correctIndex: 1,
        explanationEn: 'For moderate radius bending, K-factor is typically 0.40 to 0.45 (DIN 6935 baseline ~0.44).',
        explanationTr: 'Orta yarıçaplı bükümlerde K-faktörü genellikle 0.40 ile 0.45 arasındadır (DIN 6935 taban değeri ~0.44).'
      },
      {
        id: 'q3',
        questionEn: 'What happens if the inside bend radius R is chosen too small (e.g. sharp corner R < 0.5*T in hard alloys)?',
        questionTr: 'İç büküm yarıçapı R çok küçük seçilirse (örn. sert alaşımlarda R < 0.5*T) ne olur?',
        optionsEn: ['The sheet cracks on the outer tension surface', 'The sheet gets thicker', 'Tonnage drops to zero', 'Angle increases automatically'],
        optionsTr: ['Sacın dış çekme yüzeyinde çatlaklar ve kırılma oluşur', 'Sac kalınlaşır', 'Baskı tonajı sıfıra iner', 'Açı kendiliğinden büyür'],
        correctIndex: 0,
        explanationEn: 'Excessive tensile strain on the outer radius causes cracking in materials with limited elongation.',
        explanationTr: 'Dış yüzeydeki aşırı çekme birim uzaması sacın dış kaviste çatlamasına ve yırtılmasına neden olur.'
      },
      {
        id: 'q4',
        questionEn: 'What is springback in sheet metal press braking?',
        questionTr: 'Abkant pres bükümünde geri yaylanma (springback) nedir?',
        optionsEn: ['Elastic recovery after releasing bending pressure that opens the bend angle', 'Thermal contraction', 'Die wear', 'Punch speed'],
        optionsTr: ['Büküm kuvveti kalktığında elastik geri dönüş nedeniyle büküm açısının açılması', 'Isıl büzülme', 'Kalıp aşınması', 'Zımba hızı'],
        correctIndex: 0,
        explanationEn: 'Elastic strain partially recovers when load is removed, requiring overbending to reach target angle.',
        explanationTr: 'Kuvvet kalkınca malzeme elastik uzamasını geri alır; bu nedenle hedef açı için hafif fazla büküm yapılır.'
      },
      {
        id: 'q5',
        questionEn: 'What is Bend Deduction (BD)?',
        questionTr: 'Büküm Düşümü (Bend Deduction - BD) nedir?',
        optionsEn: ['Total flange length sum minus flat blank length (2*OSB - BA)', 'Punch radius', 'Kerf loss', 'Die clearance'],
        optionsTr: ['Dış flanş toplam boyu ile açınım boyu arasındaki fark (2*OSB - BA)', 'Zımba yarıçapı', 'Lazer kesim payı', 'Kalıp boşluğu'],
        correctIndex: 0,
        explanationEn: 'BD = 2*OSB - BA. It is the value subtracted from the sum of outside dimensions to get flat length.',
        explanationTr: 'BD = 2*OSB - BA olup dış ölçüler toplamından düşülerek düz sac açınım boyunu veren değerdir.'
      }
    ]
  },
  {
    id: 'unit-9',
    slug: 'roller-chain-iso606',
    unitNumber: 9,
    titleEn: 'Roller Chain Drive Power (ISO 606)',
    titleTr: 'Makaralı Zincir Mekanizmaları (ISO 606)',
    category: 'Machine Elements',
    standard: 'ISO 606 / DIN 8187',
    solverRoute: '/calculators/belt-drive',
    summaryEn: 'Compute chain link count, center distance, sprocket pitch diameter, and chordal action effects.',
    summaryTr: 'Zincir bakla sayısı, eksenler arası mesafe, dişli bölüm dairesi ve poligon etkisini hesaplayın.',
    formulas: [
      { label: 'Sprocket Pitch Diameter', latex: 'd = \\frac{p}{\\sin(180^\\circ / z)}' },
      { label: 'Chain Length in Pitches', latex: 'X = \\frac{2a}{p} + \\frac{z_1 + z_2}{2} + \\frac{(z_2 - z_1)^2 \\cdot p}{4\\pi^2 \\cdot a}' }
    ],
    theoryEn: 'Roller chains transmit synchronous power via positively meshing sprockets. Small tooth counts (<17) create severe chordal speed variations (polygonal action). Chain selection per ISO 606 requires checking power capacity based on fatigue and galling limits.',
    theoryTr: 'Makaralı zincirler dişlilerle pozitif kavrama ile güç iletir. Küçük diş sayıları (<17) poligon etkisine ve hız dalgalanmalarına yol açar. ISO 606 standardı plaka yorulması ve pim aşınması limitlerini denetler.',
    questions: [
      {
        id: 'q1',
        questionEn: 'What causes polygonal action (chordal effect) in chain drives?',
        questionTr: 'Zincir mekanizmalarında poligon etkisi (hız dalgalanması) neyden kaynaklanır?',
        optionsEn: ['The chain link seating on flat chord lines rather than a true circle', 'Chain elongation from wear', 'Lubrication breakdown', 'Sprocket misalignment'],
        optionsTr: ['Zincir baklasının dairesel değil düz kirişler üzerinde oturması', 'Aşınma uzaması', 'Yağsızlık', 'Eksen kaçıklığı'],
        correctIndex: 0,
        explanationEn: 'Chain links form polygons around sprockets, causing periodic pitch radius and velocity fluctuations.',
        explanationTr: 'Baklalar dişli üzerinde çokgen oluşturur; bu da periyodik yarıçap ve hız dalgalanmasına yol açar.'
      },
      {
        id: 'q2',
        questionEn: 'Why should chain link count preferably be an even number?',
        questionTr: 'Zincir bakla sayısı neden tercihen çift sayı olmalıdır?',
        optionsEn: ['To avoid using weak cranked half-links (offset links)', 'To match odd sprocket teeth', 'To reduce weight', 'For aesthetic reasons'],
        optionsTr: ['Zayıf deveboynu (yarım kilit) bakla kullanımından kaçınmak için', 'Tek diş sayısına uymak için', 'Hafiflik için', 'Simetri için'],
        correctIndex: 0,
        explanationEn: 'Even link counts allow standard inner/outer link pairs without weaker cranked offset links.',
        explanationTr: 'Çift bakla sayısı standart iç/dış bakla dizilimi sağlar; mukavemeti düşük yarım baklayı önler.'
      },
      {
        id: 'q3',
        questionEn: 'What is the recommended minimum number of teeth on the driving sprocket for smooth operation?',
        questionTr: 'Sarsıntısız çalışma için tahrik dişlisinde önerilen minimum diş sayısı yaklaşık kaçtır?',
        optionsEn: ['6', '11', '17 - 19', '35'],
        optionsTr: ['6', '11', '17 - 19', '35'],
        correctIndex: 2,
        explanationEn: 'At least 17-19 teeth minimizes chordal velocity variation and impact wear.',
        explanationTr: 'En az 17-19 diş poligon hız dalgalanmalarını ve darbe aşınmasını minimuma indirir.'
      },
      {
        id: 'q4',
        questionEn: 'What is the maximum allowable chain wear elongation before replacement is mandatory?',
        questionTr: 'Zincirin değiştirilmesini gerektiren maksimum izin verilen aşınma uzaması yaklaşık yüzde kaçtır?',
        optionsEn: ['0.2%', '1.5% - 2.0%', '10%', '25%'],
        optionsTr: ['%0.2', '%1.5 - %2.0', '%10', '%25'],
        correctIndex: 1,
        explanationEn: 'Over 1.5-2.0% pitch elongation causes chains to climb and damage sprocket teeth.',
        explanationTr: '%1.5-2.0 üzeri aşınma uzamasında zincir diş tepe noktasına tırmanarak dişliyi bozar.'
      },
      {
        id: 'q5',
        questionEn: 'Which standard covers European British Standard (BS) and American (ANSI) roller chains?',
        questionTr: 'Metrik ve ANSI makaralı zincir standartlarını birleştiren uluslararası norm hangisidir?',
        optionsEn: ['ISO 606', 'ISO 281', 'VDI 2230', 'DIN 6935'],
        optionsTr: ['ISO 606', 'ISO 281', 'VDI 2230', 'DIN 6935'],
        correctIndex: 0,
        explanationEn: 'ISO 606 standardizes both ISO-A (ANSI) and ISO-B (European/BS) short-pitch transmission chains.',
        explanationTr: 'ISO 606 standardı hem Avrupa (ISO-B) hem Amerikan (ANSI) transmisyon zincirlerini kapsar.'
      }
    ]
  },
  {
    id: 'unit-10',
    slug: 'belt-drive-iso5291',
    unitNumber: 10,
    titleEn: 'Belt Drive Transmission (ISO 5291)',
    titleTr: 'Kayış-Kasnak Mekanizmaları (ISO 5291)',
    category: 'Machine Elements',
    standard: 'ISO 5291 / DIN 2215',
    solverRoute: '/calculators/belt-drive',
    summaryEn: 'Evaluate V-belt wedging friction, wrap angle, Euler-Eytelwein tension ratio, and belt length.',
    summaryTr: 'V-kayış kama sürtünmesi, sarım açısı, Euler-Eytelwein gergi oranı ve kayış boyunu hesaplayın.',
    formulas: [
      { label: 'Euler-Eytelwein Tension Ratio', latex: '\\frac{F_1}{F_2} = e^{\\mu\' \\cdot \\beta}' },
      { label: 'Apparent V-Belt Friction', latex: '\\mu\' = \\frac{\\mu}{\\sin(\\gamma / 2)}' },
      { label: 'Wrap Angle on Small Pulley', latex: '\\beta_1 = 180^\\circ - 2 \\arcsin\\left(\\frac{d_2 - d_1}{2a}\\right)' }
    ],
    theoryEn: 'V-belts gain mechanical advantage through groove wedging (included angle gamma ≈ 34°–38°), amplifying apparent friction by 1/sin(gamma/2) ≈ 3x. Power capacity is limited by wrap angle beta on the small pulley and centrifugal tension Fc.',
    theoryTr: 'V-kayışlar kanal kama etkisiyle (açı gama ≈ 34°–38°) sürtünme katsayısını yaklaşık 3 katına çıkarır. İletilen güç, küçük kasnaktaki sarım açısı beta ve merkezkaç kuvveti Fc ile sınırlanır.',
    questions: [
      {
        id: 'q1',
        questionEn: 'Why do V-belts transmit more power than flat belts of the same width?',
        questionTr: 'V-kayışlar aynı genişlikteki düz kayışlara göre neden daha fazla güç iletir?',
        optionsEn: ['Wedging action in the pulley groove amplifies friction by 1 / sin(gamma/2)', 'They are made of metal', 'They run at 10x higher rpm', 'They have no slip'],
        optionsTr: ['Kasnak kanalındaki kama etkisi sürtünmeyi 1 / sin(gama/2) oranında katlar', 'Metalden yapılmışlardır', '10 kat hızlı dönerler', 'Sürtünmesizdirler'],
        correctIndex: 0,
        explanationEn: 'The groove wedges the belt flanks, multiplying effective friction by approximately 3x.',
        explanationTr: 'Kanal yan yüzeylerindeki kama sıkışması sürtünme kuvvetini yaklaşık 3 katına çıkarır.'
      },
      {
        id: 'q2',
        questionEn: 'Which formula governs belt drive tension ratio F1/F2 before slip occurs?',
        questionTr: 'Kayış kaymadan önceki F1/F2 gergi oranını veren temel teorem hangisidir?',
        optionsEn: ['Euler-Eytelwein equation: F1 / F2 = e^(mu * beta)', 'Hooke\'s Law', 'Bernoulli equation', 'Lewis formula'],
        optionsTr: ['Euler-Eytelwein denklemi: F1 / F2 = e^(mu * beta)', 'Hooke Yasası', 'Bernoulli denklemi', 'Lewis formülü'],
        correctIndex: 0,
        explanationEn: 'Euler-Eytelwein formula governs the exponential tension buildup around curved wraps.',
        explanationTr: 'Euler-Eytelwein formülü, eğrisel sarımlardaki eksponansiyel gergi oranını tanımlar.'
      },
      {
        id: 'q3',
        questionEn: 'How does high belt linear speed v (> 30 m/s) affect usable tension?',
        questionTr: 'Yüksek kayış hızı v (> 30 m/s) kullanılabilir çekme kuvvetini nasıl etkiler?',
        optionsEn: ['Centrifugal force Fc = m * v^2 pulls belt away from pulley, reducing grip', 'Increases grip', 'Doubles wrap angle', 'Cooler belt'],
        optionsTr: ['Merkezkaç kuvveti Fc = m*v^2 kayışı kasnaktan dışa doğru iter ve tutunmayı düşürür', 'Tutunmayı artırır', 'Sarım açısını büyütür', 'Kayışı soğutur'],
        correctIndex: 0,
        explanationEn: 'Centrifugal tension reduces contact pressure between belt and pulley at high velocity.',
        explanationTr: 'Merkezkaç kuvveti kayışın kasnağa yaptığı basma kuvvetini azaltarak kaymaya yol açar.'
      },
      {
        id: 'q4',
        questionEn: 'What is the minimum recommended wrap angle beta on the small driving pulley?',
        questionTr: 'Küçük kasnakta önerilen minimum sarım açısı beta yaklaşık kaç derecedir?',
        optionsEn: ['45°', '90°', '120°', '180°'],
        optionsTr: ['45°', '90°', '120°', '180°'],
        correctIndex: 2,
        explanationEn: 'Wrap angle should generally stay above 120° to prevent excessive slip and loss of capacity.',
        explanationTr: 'Kaymayı önlemek ve tam güç iletimi için sarım açısı genellikle 120° üzerinde tutulmalıdır.'
      },
      {
        id: 'q5',
        questionEn: 'Which belt type provides strictly positive, non-slip synchronous timing transmission?',
        questionTr: 'Kaymasız, senkron ve pozitif zamanlama iletimi sağlayan kayış tipi hangisidir?',
        optionsEn: ['Timing / Toothed synchronous belt', 'Classical V-belt', 'Flat leather belt', 'Round belt'],
        optionsTr: ['Triger / Dişli senkron kayış', 'Klasik V-kayışı', 'Düz deri kayış', 'Yuvarlak kayış'],
        correctIndex: 0,
        explanationEn: 'Timing belts mesh tooth-to-groove, eliminating slip for synchronous motion control.',
        explanationTr: 'Triger (dişli) kayışlar dişli kasnakla pozitif kavrama yaparak kaymayı tamamen engeller.'
      }
    ]
  },
  {
    id: 'unit-11',
    slug: 'material-selection-alloys',
    unitNumber: 11,
    titleEn: 'Engineering Material Selection & Density',
    titleTr: 'Mühendislik Malzeme Seçimi ve Yoğunluk',
    category: 'Materials',
    standard: 'EN 573-3 / ASTM B221',
    solverRoute: '/materials',
    summaryEn: 'Compare structural aluminum (6061-T6, 7075-T6), steels, and titanium for strength-to-weight optimization.',
    summaryTr: 'Yapısal alüminyum (6061, 7075), çelik ve titanyumu mukavemet/ağırlık optimizasyonu için karşılaştırın.',
    formulas: [
      { label: 'Specific Strength', latex: '\\text{Strength-to-Weight} = \\frac{S_y}{\\rho}' },
      { label: 'Specific Stiffness', latex: '\\text{Stiffness-to-Weight} = \\frac{E}{\\rho}' }
    ],
    theoryEn: 'Engineering material selection balances yield strength Sy, stiffness E, density rho, machinability, and corrosion resistance. While Steel (E=210 GPa, rho=7.85 g/cm3) and Aluminum (E=70 GPa, rho=2.70 g/cm3) have nearly identical specific stiffness E/rho, high-strength Aluminum 7075-T6 excels in strength-to-weight.',
    theoryTr: 'Mühendislik malzeme seçimi akma dayanımı (Sy), elastisite (E), yoğunluk (rho), işlenebilirlik ve korozyon direncini dengeler. Çelik ile Alüminyumun özgül rijitliği (E/rho) neredeyse eşitken, Al 7075-T6 mukavemet/ağırlık oranında üstündür.',
    questions: [
      {
        id: 'q1',
        questionEn: 'What is the density of standard structural aluminum 6061-T6?',
        questionTr: 'Standart yapısal alüminyum 6061-T6 alaşımının yoğunluğu yaklaşık kaçtır?',
        optionsEn: ['1.20 g/cm³', '2.70 g/cm³', '4.50 g/cm³', '7.85 g/cm³'],
        optionsTr: ['1.20 g/cm³', '2.70 g/cm³', '4.50 g/cm³', '7.85 g/cm³'],
        correctIndex: 1,
        explanationEn: 'Aluminum alloys have a density of ~2.70 g/cm³ (approx. one-third of steel 7.85 g/cm³).',
        explanationTr: 'Alüminyum alaşımları ~2.70 g/cm³ yoğunluğa sahiptir (çeliğin yaklaşık 3\'te biri).'
      },
      {
        id: 'q2',
        questionEn: 'Which aluminum alloy is widely known as aerospace-grade ultra-high-strength alloy?',
        questionTr: 'Havacılık ve savunma sanayiinde yüksek mukavemetiyle bilinen alüminyum alaşımı hangisidir?',
        optionsEn: ['1050-O', '6063-T5', '7075-T6', '3003-H14'],
        optionsTr: ['1050-O', '6063-T5', '7075-T6', '3003-H14'],
        correctIndex: 2,
        explanationEn: '7075-T6 (zinc alloyed) reaches yield strengths over 500 MPa, comparable to structural steels.',
        explanationTr: 'Çinko katkılı 7075-T6, 500 MPa üzeri akma dayanımıyla yapısal çeliklere rakip havacılık alaşımıdır.'
      },
      {
        id: 'q3',
        questionEn: 'What does the T6 temper designation mean in aluminum alloys?',
        questionTr: 'Alüminyum alaşımlarındaki T6 ısıl işlem kodu ne anlama gelir?',
        optionsEn: ['Solution heat treated and artificially aged', 'Annealed soft', 'Cold rolled only', 'Cast as-is'],
        optionsTr: ['Çözeltiye alınıp yapay yaşlandırılmış (tam sertleştirilmiş)', 'Tavlanmış yumuşak', 'Sadece soğuk haddelenmiş', 'Döküm hali'],
        correctIndex: 0,
        explanationEn: 'T6 designates solution heat treatment followed by artificial precipitation aging for peak strength.',
        explanationTr: 'T6, çözeltiye alma ve yapay yaşlandırma ile malzemenin en yüksek mukavemete ulaştığı durumdur.'
      },
      {
        id: 'q4',
        questionEn: 'Why is Aluminum 6063 preferred over 6061 for architectural window and door extrusions?',
        questionTr: 'Mimari profil ve doğramalarda 6061 yerine neden 6063 alaşımı tercih edilir?',
        optionsEn: ['Superior anodizing surface finish and extrusion ease', 'Much higher hardness', 'Higher melting point', 'Cheaper alloy elements only'],
        optionsTr: ['Mükemmel eloksal yüzey kalitesi ve kolay ekstrüzyon kabiliyeti', 'Çok daha yüksek sertlik', 'Daha yüksek ergime sıcaklığı', 'Sadece ucuzluk'],
        correctIndex: 0,
        explanationEn: '6063 yields smooth decorative surfaces with excellent anodizing response.',
        explanationTr: '6063, pürüzsüz eloksal kaplama ve karmaşık profillerin kolay ekstrüzyonu için idealdir.'
      },
      {
        id: 'q5',
        questionEn: 'How does Poisson’s ratio nu differ between structural steel (~0.30) and aluminum alloys (~0.33)?',
        questionTr: 'Yapısal çelik (nu ≈ 0.30) ile alüminyum (nu ≈ 0.33) Poisson oranları arasındaki fark ne anlama gelir?',
        optionsEn: ['Aluminum undergoes slightly more lateral contraction per unit axial strain', 'Steel expands laterally faster', 'Neither contracts', 'Poisson ratio is zero'],
        optionsTr: ['Alüminyum eksenel çekildiğinde enine biraz daha fazla daralır', 'Çelik daha fazla genleşir', 'Hiçbiri daralmaz', 'Poisson oranı sıfırdır'],
        correctIndex: 0,
        explanationEn: 'Higher Poisson ratio indicates greater transverse contraction under tensile load.',
        explanationTr: 'Daha yüksek Poisson oranı çekme yükü altında enine büzülmenin biraz daha belirgin olduğunu gösterir.'
      }
    ]
  },
  {
    id: 'unit-12',
    slug: 'fatigue-goodman-criterion',
    unitNumber: 12,
    titleEn: 'Fatigue Life & Goodman Criterion',
    titleTr: 'Yorulma Ömrü ve Goodman Kriteri',
    category: 'Structural',
    standard: 'DIN 743 / FKM-Guideline',
    solverRoute: '/calculators/fatigue-life',
    summaryEn: 'Analyze mean stress vs alternating stress with the Modified Goodman and Soderberg diagrams.',
    summaryTr: 'Ortalama ve genlik gerilmelerini Modifiye Goodman ve Soderberg diyagramlarıyla analiz edin.',
    formulas: [
      { label: 'Alternating Stress', latex: '\\sigma_a = \\frac{\\sigma_{max} - \\sigma_{min}}{2}' },
      { label: 'Mean Stress', latex: '\\sigma_m = \\frac{\\sigma_{max} + \\sigma_{min}}{2}' },
      { label: 'Modified Goodman Relation', latex: '\\frac{\\sigma_a}{S_e} + \\frac{\\sigma_m}{S_{ut}} = \\frac{1}{S_F}' }
    ],
    theoryEn: 'Over 80% of mechanical failures are caused by cyclical fatigue below the yield strength. Tensile mean stress accelerates crack propagation, whereas compressive mean stress suppresses it. The Goodman line provides a reliable design boundary for infinite fatigue life.',
    theoryTr: 'Mekanik parça hasarlarının %80\'inden fazlası akma sınırının altındaki yorulma yüklerinden kaynaklanır. Çekme ortalama gerilme çatlak ilerlemesini hızlandırırken, basma gerilimi yavaşlatır. Goodman doğrusu sonsuz ömür sınırını belirler.',
    questions: [
      {
        id: 'q1',
        questionEn: 'In cyclical loading, what is the alternating stress sigma_a?',
        questionTr: 'Periyodik yüklemede gerilme genliği (sigma_a) nasıl hesaplanır?',
        optionsEn: ['(sigma_max - sigma_min) / 2', '(sigma_max + sigma_min) / 2', 'sigma_max * sigma_min', 'sqrt(sigma_max)'],
        optionsTr: ['(sigma_max - sigma_min) / 2', '(sigma_max + sigma_min) / 2', 'sigma_max * sigma_min', 'kök(sigma_max)'],
        correctIndex: 0,
        explanationEn: 'Alternating stress is half the peak-to-peak range: (sigma_max - sigma_min) / 2.',
        explanationTr: 'Gerilme genliği tepe-dip farkının yarısıdır: (sigma_max - sigma_min) / 2.'
      },
      {
        id: 'q2',
        questionEn: 'How does positive tensile mean stress sigma_m affect fatigue endurance?',
        questionTr: 'Pozitif (çekme) ortalama gerilme yorulma dayanımını nasıl etkiler?',
        optionsEn: ['Significantly reduces allowable alternating stress (accelerates crack opening)', 'Increases fatigue life', 'Has no effect', 'Heals microcracks'],
        optionsTr: ['İzin verilen gerilme genliğini düşürür (çatlak açılmasını hızlandırır)', 'Yorulma ömrünü uzatır', 'Etki etmez', 'Çatlakları kapatır'],
        correctIndex: 0,
        explanationEn: 'Tensile mean stress opens micro-cracks, reducing fatigue limit according to Goodman relation.',
        explanationTr: 'Çekme ortalama gerilme mikro çatlakların açılmasını kolaylaştırarak yorulma limitini düşürür.'
      },
      {
        id: 'q3',
        questionEn: 'What is the endurance limit Se of a material?',
        questionTr: 'Bir malzemenin yorulma limiti (Se / Sürekli Mukavemet Sınırı) nedir?',
        optionsEn: ['Stress level below which a material can endure infinite cycles without failure', 'Ultimate tensile strength', 'Yield strength', 'Hardness'],
        optionsTr: ['Altında kalındığında malzemenin sonsuz devir hasarsız çalışabildiği gerilme sınırı', 'Çekme dayanımı', 'Akma dayanımı', 'Sertlik'],
        correctIndex: 0,
        explanationEn: 'Steels exhibit an endurance limit below which fatigue failure will theoretically never occur.',
        explanationTr: 'Demir esaslı çelikler, altında yorulma hasarının oluşmadığı bir sürekli mukavemet sınırına sahiptir.'
      },
      {
        id: 'q4',
        questionEn: 'Which criterion is more conservative (safer): Soderberg or Goodman?',
        questionTr: 'Soderberg ve Goodman kriterlerinden hangisi daha muhafazakardır (daha güvenli tarafta kalır)?',
        optionsEn: ['Soderberg (uses Yield Strength Sy instead of Sut)', 'Goodman', 'Both are identical', 'Gerber'],
        optionsTr: ['Soderberg (Çekme Sut yerine Akma Sy dayanımını kullanır)', 'Goodman', 'Her ikisi aynıdır', 'Gerber'],
        correctIndex: 0,
        explanationEn: 'Soderberg references Yield Strength Sy, making it more conservative than Goodman (Sut).',
        explanationTr: 'Soderberg formülü paydada Sut yerine daha düşük olan akma dayanımı Sy\'yi kullandığı için daha güvenli taraftadır.'
      },
      {
        id: 'q5',
        questionEn: 'Why do surface treatments like shot peening improve fatigue life?',
        questionTr: 'Bilyalı dövme (shot peening) gibi yüzey işlemleri yorulma ömrünü neden artırır?',
        optionsEn: ['They induce beneficial compressive residual stresses on the surface', 'They soften the surface', 'They increase thermal expansion', 'They change the alloy'],
        optionsTr: ['Yüzeyde faydalı basma artık gerilmeleri oluşturarak çatlak başlangıcını engeller', 'Yüzeyi yumuşatır', 'Isıl genleşmeyi artırır', 'Alaşımı değiştirir'],
        correctIndex: 0,
        explanationEn: 'Compressive residual stresses close surface flaws and prevent tensile crack initiation.',
        explanationTr: 'Yüzeyde oluşturulan basma gerilmesi mikro çatlakların çekmeyle ilerlemesini zorlaştırır.'
      }
    ]
  },
  {
    id: 'unit-13',
    slug: 'fea-linear-static-intro',
    unitNumber: 13,
    titleEn: 'FEA Linear Static Analysis (3 Validated Templates)',
    titleTr: 'FEA Doğrusal Statik Analiz (3 Doğrulanmış Şablon)',
    category: 'FEA & CAD',
    standard: 'Euler-Bernoulli / Kirsch / Peterson',
    solverRoute: '/fea',
    summaryEn: 'Understand linear elasticity, mesh density, boundary fixity, and stress concentration verification.',
    summaryTr: 'Doğrusal elastisite, ağ sıklığı, sınır koşulları ve gerilme yığılması doğrulamasını öğrenin.',
    formulas: [
      { label: 'Hooke\'s Law (Stiffness Matrix)', latex: '\\mathbf{K} \\cdot \\mathbf{u} = \\mathbf{F}' },
      { label: 'von Mises Equivalent Stress', latex: '\\sigma_{vM} = \\sqrt{\\frac{1}{2} \\left[ (\\sigma_x - \\sigma_y)^2 + (\\sigma_y - \\sigma_z)^2 + (\\sigma_z - \\sigma_x)^2 + 6(\\tau_{xy}^2 + \\tau_{yz}^2 + \\tau_{zx}^2) \\right]}' }
    ],
    theoryEn: 'Linear static FEA solves K*u = F assuming small displacements and linear elastic material response. AluCalc OS validates FEA results against closed-form analytical solutions (Cantilever Beam, Plate with Hole, L-Bracket) to maintain error bounds under 8%.',
    theoryTr: 'Doğrusal statik FEA, küçük yer değiştirmeler ve elastik malzeme kabulüyle K*u = F matris sistemini çözer. AluCalc OS, sonuçları analitik çözümlerle (Konsol Kiriş, Delikli Plaka, L-Braket) karşılaştırarak hata payını %8\'in altında tutar.',
    questions: [
      {
        id: 'q1',
        questionEn: 'What is the primary governing matrix equation in linear static FEA?',
        questionTr: 'Doğrusal statik sonlu elemanlar analizinin temel matris denklemi nedir?',
        optionsEn: ['K * u = F (Stiffness * Displacement = Force)', 'F = m * a', 'P = I * V', 'E = m * c^2'],
        optionsTr: ['K * u = F (Rijitlik * Deplasman = Kuvvet)', 'F = m * a', 'P = I * V', 'E = m * c^2'],
        correctIndex: 0,
        explanationEn: 'The global stiffness matrix K multiplied by nodal displacements u equals applied force vector F.',
        explanationTr: 'Global rijitlik matrisi K ile düğüm deplasman vektörü u çarpımı dış kuvvet vektörü F\'ye eşittir.'
      },
      {
        id: 'q2',
        questionEn: 'Why does a central hole in a tension plate triple the nominal stress (Kt ≈ 3.0)?',
        questionTr: 'Çekme plakasındaki dairesel delik anma gerilmesini neden yaklaşık 3 katına çıkarır (Kt ≈ 3.0)?',
        optionsEn: ['Stress trajectories deflect around the void, crowding peak shear and normal stress at the hole edge (Kirsch problem)', 'The material melts', 'Hole creates bending', 'Density doubles'],
        optionsTr: ['Kuvvet akı çizgileri boşluğun etrafından dolaşarak delik kenarında sıkışır ve gerilme yığılması oluşturur (Kirsch problemi)', 'Malzeme erir', 'Delik eğilme yaratır', 'Yoğunluk ikiye katlanır'],
        correctIndex: 0,
        explanationEn: 'Kirsch equations prove that a circular hole in an infinite plate under tension produces 3x nominal stress.',
        explanationTr: 'Kirsch analitik denklemleri çekme altındaki dairesel delik kenarında gerilmenin 3 katına çıktığını kanıtlar.'
      },
      {
        id: 'q3',
        questionEn: 'What does the von Mises yield criterion predict for ductile metals?',
        questionTr: 'von Mises akma kriteri sünek metaller için neyi tahmin eder?',
        optionsEn: ['Yielding begins when distortion energy reaches the yield point in pure tension', 'Brittle cleavage fracture', 'Corrosion rate', 'Melting'],
        optionsTr: ['Şekil değiştirme enerjisi tek eksenli çekmedeki akma noktasına ulaştığında kalıcı akma başlar', 'Gevrek çatlama', 'Korozyon hızı', 'Erime'],
        correctIndex: 0,
        explanationEn: 'von Mises compares 3D multi-axial stress states to uniaxial tensile yield strength Sy.',
        explanationTr: 'von Mises çok eksenli 3D gerilme durumunu tek eksenli akma dayanımıyla karşılaştırır.'
      },
      {
        id: 'q4',
        questionEn: 'Why must mesh convergence be checked in FEA?',
        questionTr: 'FEA analizlerinde ağ yakınsaması (mesh convergence) neden kontrol edilmelidir?',
        optionsEn: ['To ensure numerical results stabilize independently of element size', 'To increase file size', 'To change colors', 'To test graphics card'],
        optionsTr: ['Sayısal sonuçların eleman boyutundan bağımsız şekilde doğru değere oturduğundan emin olmak için', 'Dosya boyutunu büyütmek için', 'Renkleri değiştirmek için', 'Ekran kartını test etmek için'],
        correctIndex: 0,
        explanationEn: 'Refining the mesh should lead to stable peak stresses converging toward the true analytical solution.',
        explanationTr: 'Ağ sıklaştırıldığında gerilme değerinin analitik doğru sonuca yakınsaması gerekir.'
      },
      {
        id: 'q5',
        questionEn: 'What are the 3 verified templates in AluCalc FEA Linear Static v1?',
        questionTr: 'AluCalc FEA Doğrusal Statik v1 modülündeki 3 doğrulanmış şablon hangileridir?',
        optionsEn: ['Cantilever Beam, Plate with Hole, L-Bracket', 'Car Chassis, Airplane Wing, Submarine', 'Gear, Spring, Bolt', 'Piston, Cylinder, Crank'],
        optionsTr: ['Konsol Kiriş, Delikli Plaka, L-Braket', 'Araba Şasisi, Uçak Kanadı, Denizaltı', 'Dişli, Yay, Cıvata', 'Piston, Silindir, Krank'],
        correctIndex: 0,
        explanationEn: 'AluCalc locks FEA v1 to Cantilever, Plate with Hole, and L-Bracket with <8% verified analytical accuracy.',
        explanationTr: 'AluCalc FEA v1, %8 altı analitik doğrulukla Konsol Kiriş, Delikli Plaka ve L-Braket şablonlarına odaklanır.'
      }
    ]
  },
  {
    id: 'unit-14',
    slug: 'nesting-cut-optimization',
    unitNumber: 14,
    titleEn: '1D & 2D Cutting Optimization & Nesting',
    titleTr: '1D ve 2D Kesim Optimizasyonu ve Yerleşim',
    category: 'Manufacturing',
    standard: 'First-Fit Decreasing / Guillotine Nesting',
    solverRoute: '/cutting-optimizer',
    summaryEn: 'Optimize bar stock and sheet metal layouts to maximize material yield and reduce scrap.',
    summaryTr: 'Profil ve sac plaka yerleşimlerini optimize ederek fire oranını düşürün ve verimi maksimize edin.',
    formulas: [
      { label: 'Scrap Rate Percentage', latex: '\\text{Scrap \\%} = \\frac{\\text{Total Raw Stock} - \\text{Total Cut Parts}}{\\text{Total Raw Stock}} \\times 100' },
      { label: 'Kerf Loss Adjustment', latex: 'L_{effective} = L_{part} + K_{blade}' }
    ],
    theoryEn: '1D cutting optimization solves the NP-hard Stock Cutting Problem using heuristics like First-Fit Decreasing and Column Generation. Kerf width (blade/laser thickness) must be accounted for on every cut to avoid undersized parts.',
    theoryTr: '1D kesim optimizasyonu, First-Fit Decreasing ve Genetik Algoritmalar ile fireyi minimize eder. Her kesimde testere/lazer kesim payının (kerf) hesaba katılması parçaların kısa çıkmasını önler.',
    questions: [
      {
        id: 'q1',
        questionEn: 'What is cutting kerf loss?',
        questionTr: 'Kesim payı (kerf loss) nedir?',
        optionsEn: ['Width of material removed by the saw blade or laser beam during each cut', 'Scrap left at the end', 'Angle of cut', 'Stock length'],
        optionsTr: ['Her kesimde testere bıçağı veya lazer ışını tarafından talaşa dönüştürülen malzeme genişliği', 'Kalan hurda parça', 'Kesim açısı', 'Ham profil boyu'],
        correctIndex: 0,
        explanationEn: 'Kerf is the blade thickness (e.g. 3-4 mm saw blade or 0.2 mm laser) consumed per cut.',
        explanationTr: 'Kerf, testere bıçağı (3-4 mm) veya lazer (0.2 mm) tarafından talaş olarak yok edilen genişliktir.'
      },
      {
        id: 'q2',
        questionEn: 'Which classic algorithmic strategy sorts parts from longest to shortest before placement?',
        questionTr: 'Parçaları yerleştirmeden önce en uzundan en kısaya doğru sıralayan klasik optimizasyon algoritması hangisidir?',
        optionsEn: ['First-Fit Decreasing (FFD)', 'Random Walk', 'Bubble Sort', 'Linear Regression'],
        optionsTr: ['First-Fit Decreasing (FFD)', 'Rastgele Seçim', 'Kabarcık Sıralaması', 'Doğrusal Regresyon'],
        correctIndex: 0,
        explanationEn: 'FFD sorts parts by descending length to pack large pieces first, minimizing overall stock bars.',
        explanationTr: 'FFD algoritması önce büyük parçaları yerleştirerek ham profil sayısını ve fireyi minimize eder.'
      },
      {
        id: 'q3',
        questionEn: 'In 2D sheet guillotine cutting, what is a guillotine cut constraint?',
        questionTr: '2D sac plaka giyotin kesiminde giyotin kısıtı ne demektir?',
        optionsEn: ['Every cut must run straight from one edge of the sheet completely across to the opposite edge', 'Cuts can be circular', 'Cuts start inside', 'Cuts curve'],
        optionsTr: ['Her kesim sacın bir kenarından başlayıp karşı kenarına kadar boydan boya düz olmak zorundadır', 'Dairesel kesim', 'İçten başlayan kesim', 'Eğrisel kesim'],
        correctIndex: 0,
        explanationEn: 'Guillotine shears cannot stop mid-plate; they slice entirely across the material.',
        explanationTr: 'Mekanik giyotin makaslar plaka ortasında duramaz, baştan başa düz kesmek zorundadır.'
      },
      {
        id: 'q4',
        questionEn: 'If 5 cuts are made on a profile with a 4 mm blade, total kerf lost is:',
        questionTr: '4 mm testere ile bir profilden 5 kesim yapıldığında toplam talaş kaybı kaç mm olur?',
        optionsEn: ['20 mm', '4 mm', '0 mm', '25 mm'],
        optionsTr: ['20 mm', '4 mm', '0 mm', '25 mm'],
        correctIndex: 0,
        explanationEn: '5 cuts * 4 mm/cut = 20 mm consumed in saw dust.',
        explanationTr: '5 kesim * 4 mm = 20 mm malzeme talaş olarak kaybolur.'
      },
      {
        id: 'q5',
        questionEn: 'What is primary goal of nesting software in manufacturing?',
        questionTr: 'İmalatta nesting (yerleşim) yazılımlarının birincil hedefi nedir?',
        optionsEn: ['Maximize sheet/bar material utilization and minimize raw material scrap cost', 'Color the parts', 'Make files heavier', 'Slow down machines'],
        optionsTr: ['Plaka/profil malzeme verimini maksimize etmek ve ham madde fire maliyetini düşürmek', 'Parçaları boyamak', 'Dosyayı ağırlaştırmak', 'Makineleri yavaşlatmak'],
        correctIndex: 0,
        explanationEn: 'Nesting maximizes material utilization, directly lowering manufacturing raw material costs.',
        explanationTr: 'Nesting, parça yerleşimini sıkılaştırarak malzeme firesini ve imalat maliyetini doğrudan düşürür.'
      }
    ]
  },
  {
    id: 'unit-15',
    slug: 'engineering-report-certification',
    unitNumber: 15,
    titleEn: 'Engineering Report & Quality Traceability',
    titleTr: 'Mühendislik Raporu ve Kalite İzlenebilirliği',
    category: 'Fasteners',
    standard: 'ISO 9001 / ISO/IEC 17025',
    solverRoute: '/calculators/fasteners/vdi2230',
    summaryEn: 'Learn documentation integrity, norm references, digital verification seals, and client-ready reporting.',
    summaryTr: 'Dökümantasyon güvenilirliği, normatif referanslar, dijital doğrulama mühürleri ve raporlamayı öğrenin.',
    formulas: [
      { label: 'Traceability Hash Format', latex: '\\text{Verification Code} = \\text{SHA256}(\\text{Inputs} + \\text{Outputs} + \\text{Timestamp})' }
    ],
    theoryEn: 'Engineering calculations carry legal and safety liability. ISO 9001 and ISO/IEC 17025 require full traceability: every output must document the exact standard, mathematical formulas, input boundary parameters, engineer name, and timestamp with cryptographic verification.',
    theoryTr: 'Mühendislik hesapları yasal ve güvenlik sorumluluğu taşır. ISO 9001 ve ISO 17025 tam izlenebilirlik gerektirir: her teknik raporda normatif standart, matematiksel formül, girdi parametreleri, mühendis ve zaman damgası yer almalıdır.',
    questions: [
      {
        id: 'q1',
        questionEn: 'Why must engineering calculation reports reference formal international standards (e.g. ISO, DIN, VDI)?',
        questionTr: 'Mühendislik hesap raporları neden resmi uluslararası standartlara (ISO, DIN, VDI) atıfta bulunmalıdır?',
        optionsEn: ['To establish legal compliance, auditability, and validated deterministic accuracy', 'For marketing only', 'To make reports longer', 'To hide formulas'],
        optionsTr: ['Yasal uyumluluk, denetlenebilirlik ve doğrulanmış matematiksel kesinlik sağlamak için', 'Sadece reklam için', 'Raporu uzatmak için', 'Formülleri gizlemek için'],
        correctIndex: 0,
        explanationEn: 'Standards provide globally recognized methodologies acceptable in legal audits and certifications.',
        explanationTr: 'Resmi normlar, teknik denetimlerde ve yasal sorumlulukta kabul gören doğrulanmış metodolojiler sunar.'
      },
      {
        id: 'q2',
        questionEn: 'What constitutes an auditable engineering report?',
        questionTr: 'Denetlenebilir bir mühendislik raporu neleri içermelidir?',
        optionsEn: ['Input design parameters, applied standard equations, calculated outputs, safety margins, and author timestamp', 'Only the final answer', '3D model pictures only', 'Price list only'],
        optionsTr: ['Girdi tasarım parametreleri, uygulanan standart formüller, çıktılar, güvenlik payı ve zaman damgası', 'Sadece nihai sonuç', 'Sadece 3D resimler', 'Sadece fiyat listesi'],
        correctIndex: 0,
        explanationEn: 'Complete documentation allows peer review and third-party validation under ISO 9001.',
        explanationTr: 'Tam dökümantasyon bağımsız denetçilerin hesapları adım adım doğrulamasını sağlar.'
      },
      {
        id: 'q3',
        questionEn: 'How does digital hash verification protect an engineering report?',
        questionTr: 'Dijital doğrulama kodu (hash) bir mühendislik raporunu nasıl korur?',
        optionsEn: ['Proves the report data has not been altered or tampered with since generation', 'Compresses the file', 'Translates the language', 'Prints it faster'],
        optionsTr: ['Rapor verilerinin oluşturulduğu andan itibaren değiştirilmediğini ve manipüle edilmediğini kanıtlar', 'Dosyayı sıkıştırır', 'Dili çevirir', 'Daha hızlı yazdırır'],
        correctIndex: 0,
        explanationEn: 'Cryptographic hashes provide non-repudiation and detect any post-generation tampering.',
        explanationTr: 'Kriptografik özet (hash), rapordaki en ufak bir sayısal değişikliği anında tespit eder.'
      },
      {
        id: 'q4',
        questionEn: 'What is the role of safety factors (SF) in certified reports?',
        questionTr: 'Onaylı raporlarda güvenlik katsayısının (SF) rolü nedir?',
        optionsEn: ['Accounts for real-world uncertainties in material tolerances, dynamic shock loads, and operational wear', 'Hides errors', 'Reduces material cost', 'Speeds up motors'],
        optionsTr: ['Malzeme toleransları, dinamik şok yükler ve aşınma gibi belirsizliklere karşı emniyet payı bırakır', 'Hataları gizler', 'Maliyeti düşürür', 'Motorları hızlandırır'],
        correctIndex: 0,
        explanationEn: 'Safety factors guard against fatigue, unexpected overloads, and material property scatter.',
        explanationTr: 'Güvenlik katsayısı beklenmedik aşırı yükler ve malzeme saçılmalarına karşı yapıyı korur.'
      },
      {
        id: 'q5',
        questionEn: 'Which AluCalc OS feature exports certified, unwatermarked client-ready engineering reports?',
        questionTr: 'AluCalc OS\'ta filigransız ve müşteriye hazır onaylı teknik rapor hangi lisansla üretilir?',
        optionsEn: ['AluCalc Pro / Team / Enterprise License', 'Free Trial (Demo)', 'Guest Mode', 'Offline Reader'],
        optionsTr: ['AluCalc Pro / Team / Enterprise Lisansı', 'Ücretsiz Deneme (Demo)', 'Misafir Modu', 'Çevrimdışı Okuyucu'],
        correctIndex: 0,
        explanationEn: 'Paid plans unlock unwatermarked, professional PDF engineering reports with full digital traceability.',
        explanationTr: 'Pro ve üstü lisanslar filigransız, tam izlenebilirlik mühürlü teknik rapor üretimini açar.'
      }
    ]
  }
];
