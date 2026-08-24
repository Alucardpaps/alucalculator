import type { Language } from '@/store/i18nStore';
import { ACADEMY_PAGE_UI_CHROME } from './academyPageUiChrome';

export type AcademyPageStrings = {
  badge: string;
  heroTitle1: string;
  heroTitle2: string;
  heroDesc: string;
  year: string;
  modules: string;
  reference: string;
  noModules: string;
  viewResearch: string;
  databankTitle: string;
  databankDesc: string;
  standardVerified: string;
  standardVerifiedDesc: string;
  realTimeData: string;
  realTimeDataDesc: string;
  footerTitle: string;
  footerSubtitle: string;
  backToFaculty: string;
  articleNotFound: string;
  facultySubtitle: string;
  academicLevel: string;
  readTime: string;
  governingFormula: string;
  intelligenceLab: string;
  liveEngineBadge: string;
  principalStressSimulator: string;
  physicsLabBadge: string;
  stepByStepTitle: string;
  workedExampleTitle: string;
  inputParameters: string;
  calculation: string;
  whyThisMatters: string;
  commonMistakes: string;
  textbookDeepDive: string;
  pageSource: string;
  referenceMaterial: string;
  download: string;
  technicalQA: string;
  liveSimulationEngine: string;
  articleFooter: string;
  searchPlaceholder: string;
  allYears: string;
  statsModules: string;
  statsHours: string;
  statsLabs: string;
  statsStandards: string;
  learningPathTitle: string;
  learningPathDesc: string;
  startYear1Cta: string;
  howToLearnTitle: string;
  howToLearnStep1Title: string;
  howToLearnStep1Desc: string;
  howToLearnStep2Title: string;
  howToLearnStep2Desc: string;
  howToLearnStep3Title: string;
  howToLearnStep3Desc: string;
  difficultyBasic: string;
  difficultyIntermediate: string;
  difficultyAdvanced: string;
  difficultyExpert: string;
  prerequisitesLabel: string;
  readLesson: string;
  openCalculator: string;
  engineeringGuide: string;
  interactiveLab: string;
  minutesShort: string;
  noSearchResults: string;
  formulaPreview: string;
  progressLabel: string;
  learningOutcomes: string;
  yearPathLabel: string;
  engineWalkthroughTitle: string;
  engineWalkthroughDesc: string;
  engineNameLabel: string;
  engineInputsLabel: string;
  engineOutputsLabel: string;
  enginePipelineLabel: string;
  engineeringTipLabel: string;
  prevLesson: string;
  nextLesson: string;
  openInAluCalc: string;
  quizTitle: string;
  quizDesc: string;
  quizSubmit: string;
  quizScore: string;
  quizRetry: string;
  quizPassed: string;
  practiceTitle: string;
  practiceDesc: string;
  practiceDoneHint: string;
  lessonProgressTitle: string;
  progressRead: string;
  progressPractice: string;
  progressQuiz: string;
  lessonComplete: string;
  tocTitle: string;
  relatedLessons: string;
  continueLearning: string;
  continueLearningDesc: string;
  completionPercent: string;
  resumeLesson: string;
  tabCurriculum: string;
  tabCalculators: string;
  calculatorsTabDesc: string;
  learningObjectivesTitle: string;
  keyTakeawaysTitle: string;
  designChecklistTitle: string;
  practicalApplicationTitle: string;
  technicalDataTitle: string;
  openLiveCalculator: string;
  openLiveCalculatorDesc: string;
  relatedGuidesTitle: string;
  quizOptionNone: string;
  quizOptionDepends: string;
  quizOptionNA: string;
  visitedLabel: string;
};

export type AcademyCourse = {
  slug: string;
  title: string;
  year: number;
  ref: string;
  kind?: 'lesson' | 'guide';
  category?: string;
};

export type AcademyDepartment = {
  id: string;
  title: string;
  head: string;
  color: string;
  courses: AcademyCourse[];
};

const EN: AcademyPageStrings = {
  badge: 'Established v5.1 — Pure Engineering Integration',
  heroTitle1: 'Academic',
  heroTitle2: 'Engineering Syllabus',
  heroDesc:
    'Our curriculum is not a collection of articles. It is a deterministic path built from industry-leading textbooks, handbooks, and faculty lecture notes.',
  year: 'Year',
  modules: 'Modules',
  reference: 'Reference',
  noModules: 'No modules scheduled for Year {year} in this department.',
  viewResearch: 'View Departmental Research',
  databankTitle: 'Integrated Engineering Databank',
  databankDesc:
    "AluCalc Faculty syncs directly with the OS Kernels. When you study 'Thread Profiles' in our Manufacturing department, you are looking at the exact parameters used in the Bolt Calculation Engine.",
  standardVerified: 'Standard Verified',
  standardVerifiedDesc: 'ISO/DIN/VDI 2230 Compliant',
  realTimeData: 'Real-Time Data',
  realTimeDataDesc: 'Synced with OS Kernel v5.0',
  footerTitle: 'AluCalc Faculty of Engineering',
  footerSubtitle: 'Academic Strategy & Data Mining by AluCalc AI Engine.',
  backToFaculty: 'AluCalc Faculty',
  articleNotFound: 'Article not found.',
  facultySubtitle: 'Faculty',
  academicLevel: 'Academic Level: {year}. Year',
  readTime: '{minutes}m Read',
  governingFormula: 'Governing Formula',
  intelligenceLab: 'Intelligence Lab',
  liveEngineBadge: 'Live Engine v5.0',
  principalStressSimulator: 'Principal Stress Simulator',
  physicsLabBadge: 'Physics Lab v2.1',
  stepByStepTitle: 'Step-by-Step Calculation',
  workedExampleTitle: 'Worked Example',
  inputParameters: 'Input Parameters',
  calculation: 'Calculation',
  whyThisMatters: 'Why This Matters',
  commonMistakes: 'Common Mistakes',
  textbookDeepDive: 'Textbook Deep-Dive',
  pageSource: 'Page {page} \u2022 {source}',
  referenceMaterial: 'Reference Material & Handbooks',
  download: 'Download',
  technicalQA: 'Technical Q&A',
  liveSimulationEngine: 'Live Simulation Engine',
  articleFooter: '\u00a9 {year} AluCalc Faculty of Engineering. All rights reserved.',
  searchPlaceholder: 'Search lessons, formulas, standards\u2026',
  allYears: 'All years',
  statsModules: 'Lessons',
  statsHours: 'Study hours',
  statsLabs: 'Practice & labs',
  statsStandards: 'Standards',
  learningPathTitle: 'Recommended learning path',
  learningPathDesc: 'Follow the curriculum year by year. Each lesson builds on the previous one with theory, worked examples, and linked calculators.',
  startYear1Cta: 'Start with Year 1 fundamentals',
  howToLearnTitle: 'How to learn effectively',
  howToLearnStep1Title: '1. Read the lesson',
  howToLearnStep1Desc: 'Each module explains the governing formula, variables, and a real worked example from industry handbooks.',
  howToLearnStep2Title: '2. Check your understanding',
  howToLearnStep2Desc: 'Review common mistakes and FAQ sections \u2014 they mirror what design reviewers ask in practice.',
  howToLearnStep3Title: '3. Practice in the calculator',
  howToLearnStep3Desc: 'Open the linked AluCalc tool and reproduce the example numbers. Change one input and observe the effect.',
  difficultyBasic: 'Basic',
  difficultyIntermediate: 'Intermediate',
  difficultyAdvanced: 'Advanced',
  difficultyExpert: 'Expert',
  prerequisitesLabel: 'Prerequisites',
  readLesson: 'Read lesson',
  openCalculator: 'Practice in calculator',
  engineeringGuide: 'Engineering Guide',
  interactiveLab: 'Interactive lab',
  minutesShort: 'min',
  noSearchResults: 'No lessons match your search.',
  formulaPreview: 'Key formula',
  progressLabel: '{done} of {total} lessons visited',
  learningOutcomes: 'What you will learn',
  yearPathLabel: 'Year {year} path',
  engineWalkthroughTitle: 'How AluCalc computes this',
  engineWalkthroughDesc:
    'This is the exact calculation pipeline used in the OS kernel — not a simplified textbook approximation.',
  engineNameLabel: 'Engine',
  engineInputsLabel: 'Inputs the tool reads',
  engineOutputsLabel: 'Outputs you get',
  enginePipelineLabel: 'Calculation pipeline',
  engineeringTipLabel: 'Engineering tip',
  prevLesson: 'Previous lesson',
  nextLesson: 'Next lesson',
  openInAluCalc: 'Open in AluCalc',
  quizTitle: 'Check your understanding',
  quizDesc: 'Answer all questions correctly to mark this lesson complete.',
  quizSubmit: 'Check answers',
  quizScore: 'Score: {score} / {total}',
  quizRetry: 'Try again',
  quizPassed: 'Quiz passed',
  practiceTitle: 'Hands-on practice',
  practiceDesc: 'Adjust inputs \u2014 results update live using the same formulas as AluCalc OS.',
  practiceDoneHint: 'Practice logged \u2014 great job exploring the parameter space.',
  lessonProgressTitle: 'Lesson checklist',
  progressRead: 'Read lesson',
  progressPractice: 'Tried practice widget',
  progressQuiz: 'Passed quiz',
  lessonComplete: 'Lesson complete',
  tocTitle: 'On this page',
  relatedLessons: 'Related lessons',
  continueLearning: 'Continue learning',
  continueLearningDesc: 'Pick up where you left off in the curriculum.',
  completionPercent: '{pct}% curriculum mastery',
  resumeLesson: 'Resume lesson',
  tabCurriculum: 'Curriculum',
  tabCalculators: 'Calculators',
  calculatorsTabDesc: 'Launch any AluCalc engine or open an ISO-documented engineering guide.',
  learningObjectivesTitle: 'Learning objectives',
  keyTakeawaysTitle: 'Key takeaways',
  designChecklistTitle: 'Design checklist',
  practicalApplicationTitle: 'Practical application',
  technicalDataTitle: 'Technical reference data',
  openLiveCalculator: 'Open Live Calculator',
  openLiveCalculatorDesc: 'Run this calculation with your own inputs in the AluCalc calculator workspace.',
  relatedGuidesTitle: 'Related engineering guides',
  quizOptionNone: 'None of the above',
  quizOptionDepends: 'It depends on application details',
  quizOptionNA: 'Not applicable',
  visitedLabel: 'Visited',
};

const TR: AcademyPageStrings = {
  badge: 'Kuruldu v5.1 — Saf Mühendislik Entegrasyonu',
  heroTitle1: 'Akademik',
  heroTitle2: 'Mühendislik Müfredatı',
  heroDesc:
    'Müfredatımız bir makale koleksiyonu değildir. Endüstri lideri ders kitapları, el kitapları ve fakülte ders notlarından oluşturulmuş deterministik bir yoldur.',
  year: 'Yıl',
  modules: 'Modül',
  reference: 'Referans',
  noModules: 'Bu bölümde {year}. yıl için planlanmış modül yok.',
  viewResearch: 'Bölüm Araştırmalarını Gör',
  databankTitle: 'Entegre Mühendislik Veri Bankası',
  databankDesc:
    'AluCalc Fakültesi doğrudan OS çekirdekleriyle senkronize olur. İmalat bölümünde "Diş Profilleri"ni incelerken, Cıvata Hesaplama Motorunda kullanılan parametrelere bakıyorsunuz.',
  standardVerified: 'Standart Doğrulandı',
  standardVerifiedDesc: 'ISO/DIN/VDI 2230 Uyumlu',
  realTimeData: 'Gerçek Zamanlı Veri',
  realTimeDataDesc: 'OS Çekirdek v5.0 ile senkronize',
  footerTitle: 'AluCalc M\u00fchendislik Fak\u00fcltesi',
  footerSubtitle: 'Akademik Strateji ve Veri Madencili\u011fi \u2014 AluCalc AI Engine.',
  backToFaculty: 'AluCalc Fak\u00fcltesi',
  articleNotFound: 'Makale bulunamad\u0131.',
  facultySubtitle: 'Fak\u00fclte',
  academicLevel: 'Akademik Seviye: {year}. Y\u0131l',
  readTime: '{minutes} dk Okuma',
  governingFormula: 'Y\u00f6netici Form\u00fcl',
  intelligenceLab: 'Zeka Laboratuvar\u0131',
  liveEngineBadge: 'Canl\u0131 Motor v5.0',
  principalStressSimulator: 'Ana Gerilim Sim\u00fclat\u00f6r\u00fc',
  physicsLabBadge: 'Fizik Lab v2.1',
  stepByStepTitle: 'Ad\u0131m Ad\u0131m Hesaplama',
  workedExampleTitle: '\u00c7\u00f6z\u00fclm\u00fc\u015f \u00d6rnek',
  inputParameters: 'Girdi Parametreleri',
  calculation: 'Hesaplama',
  whyThisMatters: 'Neden \u00d6nemli',
  commonMistakes: 'Yayg\u0131n Hatalar',
  textbookDeepDive: 'Ders Kitab\u0131 Derinlemesine',
  pageSource: 'Sayfa {page} \u2022 {source}',
  referenceMaterial: 'Referans Materyaller ve El Kitaplar\u0131',
  download: 'Indir',
  technicalQA: 'Teknik Soru-Cevap',
  liveSimulationEngine: 'Canl\u0131 Sim\u00fclasyon Motoru',
  articleFooter: '\u00a9 {year} AluCalc M\u00fchendislik Fak\u00fcltesi. T\u00fcm haklar\u0131 sakl\u0131d\u0131r.',
  searchPlaceholder: 'Ders, form\u00fcl veya standart ara\u2026',
  allYears: 'T\u00fcm y\u0131llar',
  statsModules: 'Ders',
  statsHours: 'Cal\u0131\u015fma saati',
  statsLabs: 'Pratik & lab',
  statsStandards: 'Standart',
  learningPathTitle: '\u00d6nerilen \u00f6\u011frenme yolu',
  learningPathDesc: 'M\u00fcfredat\u0131 y\u0131l y\u0131l takip edin. Her ders bir \u00f6ncekine dayan\u0131r: teori, \u00e7\u00f6z\u00fclm\u00fc\u015f \u00f6rnek ve ba\u011f\u006c\u0131 hesaplay\u0131c\u0131.',
  startYear1Cta: '1. y\u0131l temelleriyle ba\u015fla',
  howToLearnTitle: 'Nas\u0131l etkili \u00f6\u011frenilir',
  howToLearnStep1Title: '1. Dersi oku',
  howToLearnStep1Desc: 'Her mod\u00fcl y\u00f6netici form\u00fcl\u00fc, de\u011fi\u015fkenleri ve end\u00fcstri el kitaplar\u0131ndan ger\u00e7ek bir \u00f6rne\u011fi a\u00e7\u0131klar.',
  howToLearnStep2Title: '2. Anlay\u0131\u015f\u0131n\u0131 kontrol et',
  howToLearnStep2Desc: 'Yayg\u0131n hatalar ve SSS b\u00f6l\u00fcmlerini incele \u2014 sahadaki tasar\u0131m incelemelerini yans\u0131t\u0131r.',
  howToLearnStep3Title: '3. Hesaplay\u0131c\u0131da uygula',
  howToLearnStep3Desc: 'Ba\u011f\u006c\u0131 AluCalc arac\u0131n\u0131 a\u00e7 ve \u00f6rnek say\u0131lar\u0131 tekrarla. Bir girdiyi de\u011fi\u015ftirip etkisini g\u00f6zlemle.',
  difficultyBasic: 'Temel',
  difficultyIntermediate: 'Orta',
  difficultyAdvanced: '\u0130leri',
  difficultyExpert: 'Uzman',
  prerequisitesLabel: '\u00d6n ko\u015fullar',
  readLesson: 'Dersi oku',
  openCalculator: 'Hesaplay\u0131c\u0131da uygula',
  engineeringGuide: 'M\u00fchendislik Rehberi',
  interactiveLab: 'Interaktif lab',
  minutesShort: 'dk',
  noSearchResults: 'Araman\u0131zla e\u015fle\u015fen ders yok.',
  formulaPreview: 'Ana form\u00fcl',
  progressLabel: '{done} / {total} ders ziyaret edildi',
  learningOutcomes: 'Ne \u00f6\u011freneceksiniz',
  yearPathLabel: '{year}. y\u0131l yolu',
  engineWalkthroughTitle: 'AluCalc bunu nas\u0131l hesaplar',
  engineWalkthroughDesc:
    'Bu, OS \u00e7ekirde\u011findeki ger\u00e7ek hesaplama hatt\u0131d\u0131r \u2014 basitle\u015ftirilmi\u015f ders kitab\u0131 yakla\u015f\u0131m\u0131 de\u011fil.',
  engineNameLabel: 'Motor',
  engineInputsLabel: 'Arac\u0131n okudu\u011fu girdiler',
  engineOutputsLabel: 'Ald\u0131\u011f\u0131n\u0131z \u00e7\u0131kt\u0131lar',
  enginePipelineLabel: 'Hesaplama hatt\u0131',
  engineeringTipLabel: 'M\u00fchendislik ipucu',
  prevLesson: '\u00d6nceki ders',
  nextLesson: 'Sonraki ders',
  openInAluCalc: 'AluCalc\'ta a\u00e7',
  quizTitle: 'Anlay\u0131\u015f\u0131n\u0131 kontrol et',
  quizDesc: 'Dersi tamamlamak i\u00e7in t\u00fcm sorular\u0131 do\u011fru yan\u0131tlay\u0131n.',
  quizSubmit: 'Cevaplar\u0131 kontrol et',
  quizScore: 'Puan: {score} / {total}',
  quizRetry: 'Tekrar dene',
  quizPassed: 'Quiz ge\u00e7ildi',
  practiceTitle: 'Uygulamal\u0131 al\u0131\u015ft\u0131rma',
  practiceDesc: 'Girdileri de\u011fi\u015ftirin \u2014 sonu\u00e7lar AluCalc OS ile ayn\u0131 form\u00fcllerle an\u0131nda g\u00fcncellenir.',
  practiceDoneHint: 'Al\u0131\u015ft\u0131rma kaydedildi \u2014 parametreleri ke\u015ffetmeye devam edin.',
  lessonProgressTitle: 'Ders kontrol listesi',
  progressRead: 'Dersi oku',
  progressPractice: 'Al\u0131\u015ft\u0131rmay\u0131 dene',
  progressQuiz: 'Quizi ge\u00e7',
  lessonComplete: 'Ders tamamland\u0131',
  tocTitle: 'Bu sayfada',
  relatedLessons: '\u0130lgili dersler',
  continueLearning: '\u00d6\u011frenmeye devam et',
  continueLearningDesc: 'M\u00fcfredatta kald\u0131\u011f\u0131n\u0131z yerden devam edin.',
  completionPercent: '%{pct} m\u00fcfredat ustal\u0131\u011f\u0131',
  resumeLesson: 'Derse devam et',
  tabCurriculum: 'M\u00fcfredat',
  tabCalculators: 'Hesaplay\u0131c\u0131lar',
  calculatorsTabDesc: 'AluCalc motorlar\u0131n\u0131 ba\u015flat\u0131n veya ISO belgeli m\u00fchendislik rehberlerini a\u00e7\u0131n.',
  learningObjectivesTitle: '\u00d6\u011frenme hedefleri',
  keyTakeawaysTitle: 'Temel \u00e7\u0131kar\u0131mlar',
  designChecklistTitle: 'Tasar\u0131m kontrol listesi',
  practicalApplicationTitle: 'Pratik uygulama',
  technicalDataTitle: 'Teknik referans verileri',
  openLiveCalculator: 'Canl\u0131 Hesaplay\u0131c\u0131y\u0131 A\u00e7',
  openLiveCalculatorDesc: 'Bu hesaplamay\u0131 kendi girdilerinizle AluCalc hesaplay\u0131c\u0131 \u00e7al\u0131\u015fma alan\u0131nda \u00e7al\u0131\u015ft\u0131r\u0131n.',
  relatedGuidesTitle: '\u0130lgili m\u00fchendislik rehberleri',
  quizOptionNone: 'Hiçbiri',
  quizOptionDepends: 'Uygulama detaylarına bağlıdır',
  quizOptionNA: 'Geçersiz / Uygulanamaz',
  visitedLabel: 'Ziyaret edildi',
};

const EN_DEPARTMENTS: AcademyDepartment[] = [
  {
    id: 'Design',
    title: 'Machine Design & Elements',
    head: 'VDI 2230 / ISO 898-1 Specialist',
    color: 'blue',
    courses: [
      { slug: 'how-to-calculate-bolt-torque', title: 'Bolt Torque Analysis', year: 3, ref: 'VDI 2230 / PCB Manual' },
      { slug: 'bearing-life-calculation-explained', title: 'Bearing Fatigue Life', year: 3, ref: 'ISO 281' },
      { slug: 'motor-power-calculation', title: 'Power Transmission Sizing', year: 3, ref: 'Engineering Handbook' },
    ],
  },
  {
    id: 'Structural',
    title: 'Structural Mechanics & Analysis',
    head: "Roark's Methodology Lab",
    color: 'emerald',
    courses: [
      { slug: 'mechanics-of-materials-fundamentals', title: 'Stress & Strain DNA', year: 2, ref: 'Strength of Materials Intro' },
      { slug: 'mohrs-circle-stress-analysis', title: "Mohr's Circle Simulation", year: 2, ref: 'Stress Analysis PPT' },
      { slug: 'torsion-and-buckling-mechanics', title: 'Stability: Torsion & Buckling', year: 2, ref: 'Euler Stability Models' },
      { slug: 'beam-deflection-formula-explained', title: 'Beam Theory (Euler-Bernoulli)', year: 2, ref: "Roark's Section 8" },
      { slug: 'pressure-drop-calculation-guide', title: 'Pressure Drop (Darcy-Weisbach)', year: 2, ref: 'Fluid Mechanics' },
    ],
  },
  {
    id: 'Manufacturing',
    title: 'Manufacturing & Tooling',
    head: 'KYOCERA J-Section Standards',
    color: 'orange',
    courses: [
      { slug: 'thread-geometry-standards', title: 'Thread Profiles (M, UN, W, Tr)', year: 1, ref: 'Kyocera Bolum-J' },
      { slug: 'chip-breaker-logic', title: 'Machining & Chip Control', year: 3, ref: 'TQ-Breaker Performance' },
    ],
  },
  {
    id: 'Physics',
    title: 'Engineering Fundamentals',
    head: 'SI Core Standards',
    color: 'rose',
    courses: [
      { slug: 'engineering-units-and-standards', title: 'Units & Dimensions', year: 1, ref: 'SI Standards Board' },
      { slug: 'fundamentals-of-statics', title: 'Equilibrium & FBD', year: 1, ref: 'Newtonian Statics' },
      { slug: 'introduction-to-machine-elements', title: 'Elements Overview', year: 1, ref: 'Design Fundamentals' },
    ],
  },
];

const TR_DEPARTMENTS: AcademyDepartment[] = [
  {
    id: 'Design',
    title: 'Makine Tasar\u0131m\u0131 ve Elemanlar\u0131',
    head: 'VDI 2230 / ISO 898-1 Uzmanl\u0131\u011f\u0131',
    color: 'blue',
    courses: [
      { slug: 'how-to-calculate-bolt-torque', title: 'C\u0131vata Tork Analizi', year: 3, ref: 'VDI 2230 / PCB Manual' },
      { slug: 'bearing-life-calculation-explained', title: 'Rulman Yorulma \u00d6mr\u00fc', year: 3, ref: 'ISO 281' },
      { slug: 'motor-power-calculation', title: 'G\u00fc\u00e7 Aktar\u0131m Boyutland\u0131rma', year: 3, ref: 'M\u00fchendislik El Kitab\u0131' },
    ],
  },
  {
    id: 'Structural',
    title: 'Yap\u0131sal Mekanik ve Analiz',
    head: "Roark Metodoloji Laboratuvar\u0131",
    color: 'emerald',
    courses: [
      { slug: 'mechanics-of-materials-fundamentals', title: 'Gerilme ve \u015eekil De\u011fi\u015fimi', year: 2, ref: 'Malzeme Mukavemeti Giri\u015f' },
      { slug: 'mohrs-circle-stress-analysis', title: 'Mohr \u00c7emberi Sim\u00fclasyonu', year: 2, ref: 'Gerilme Analizi PPT' },
      { slug: 'torsion-and-buckling-mechanics', title: 'Stabilite: Burulma ve Burkulma', year: 2, ref: 'Euler Stabilite Modelleri' },
      { slug: 'beam-deflection-formula-explained', title: 'Kiri\u015f Teorisi (Euler-Bernoulli)', year: 2, ref: "Roark B\u00f6l\u00fcm 8" },
      { slug: 'pressure-drop-calculation-guide', title: 'Bas\u0131n\u00e7 D\u00fc\u015f\u00fcm\u00fc (Darcy-Weisbach)', year: 2, ref: 'Ak\u0131\u015fkanlar Mekani\u011fi' },
    ],
  },
  {
    id: 'Manufacturing',
    title: '\u0130malat ve Tak\u0131m Tezg\u00e2hlar\u0131',
    head: 'KYOCERA J-B\u00f6l\u00fcm Standartlar\u0131',
    color: 'orange',
    courses: [
      { slug: 'thread-geometry-standards', title: 'Di\u015f Profilleri (M, UN, W, Tr)', year: 1, ref: 'Kyocera Bolum-J' },
      { slug: 'chip-breaker-logic', title: 'Tala\u015f K\u0131rma ve Kontrol', year: 3, ref: 'TQ-Breaker Performans\u0131' },
    ],
  },
  {
    id: 'Physics',
    title: 'M\u00fchendislik Temelleri',
    head: 'SI Temel Standartlar',
    color: 'rose',
    courses: [
      { slug: 'engineering-units-and-standards', title: 'Birimler ve Boyutlar', year: 1, ref: 'SI Standartlar Kurulu' },
      { slug: 'fundamentals-of-statics', title: 'Denge ve Serbest Cisim Diyagram\u0131', year: 1, ref: 'Newton Statik' },
      { slug: 'introduction-to-machine-elements', title: 'Elemanlara Genel Bak\u0131\u015f', year: 1, ref: 'Tasar\u0131m Temelleri' },
    ],
  },
];

const DE: Partial<AcademyPageStrings> = {
  badge: 'Gegründet v5.1 — Reine Engineering-Integration',
  heroTitle1: 'Akademisch',
  heroTitle2: 'Ingenieur-Lehrplan',
  heroDesc:
    'Unser Lehrplan ist keine Artikelsammlung. Er ist ein deterministischer Pfad aus führenden Lehrbüchern, Handbüchern und Vorlesungsnotizen.',
  year: 'Jahr',
  modules: 'Module',
  reference: 'Referenz',
  noModules: 'Keine Module für Jahr {year} in dieser Abteilung geplant.',
  viewResearch: 'Abteilungsforschung anzeigen',
  databankTitle: 'Integrierte Ingenieur-Datenbank',
  databankDesc:
    'AluCalc Faculty synchronisiert direkt mit den OS-Kernen. Thread-Profile in der Fertigung nutzen dieselben Parameter wie die Bolzen-Berechnungsengine.',
  standardVerified: 'Standard verifiziert',
  standardVerifiedDesc: 'ISO/DIN/VDI 2230 konform',
  realTimeData: 'Echtzeitdaten',
  realTimeDataDesc: 'Synchronisiert mit OS Kernel v5.0',
  footerTitle: 'AluCalc Ingenieurfakultät',
  footerSubtitle: 'Akademische Strategie & Data Mining — AluCalc AI Engine.',
  backToFaculty: 'AluCalc Faculty',
};

const ES: Partial<AcademyPageStrings> = {
  badge: 'Establecido v5.1 — Integración de ingeniería pura',
  heroTitle1: 'Académico',
  heroTitle2: 'Plan de estudios de ingeniería',
  heroDesc:
    'Nuestro plan no es una colección de artículos. Es un camino determinista basado en libros de texto, manuales y apuntes de facultad líderes en la industria.',
  year: 'Año',
  modules: 'Módulos',
  reference: 'Referencia',
  noModules: 'No hay módulos programados para el año {year} en este departamento.',
  viewResearch: 'Ver investigación del departamento',
  databankTitle: 'Banco de datos de ingeniería integrado',
  databankDesc:
    'AluCalc Faculty se sincroniza con los núcleos del OS. Al estudiar perfiles de rosca, ves los mismos parámetros del motor de cálculo de pernos.',
  standardVerified: 'Estándar verificado',
  standardVerifiedDesc: 'Conforme ISO/DIN/VDI 2230',
  realTimeData: 'Datos en tiempo real',
  realTimeDataDesc: 'Sincronizado con OS Kernel v5.0',
  footerTitle: 'Facultad de Ingeniería AluCalc',
  footerSubtitle: 'Estrategia académica y minería de datos — AluCalc AI Engine.',
  backToFaculty: 'AluCalc Faculty',
};

const FR: Partial<AcademyPageStrings> = {
  badge: 'Établi v5.1 — Intégration ingénierie pure',
  heroTitle1: 'Académique',
  heroTitle2: 'Programme d\'ingénierie',
  heroDesc:
    'Notre programme n\'est pas une collection d\'articles. C\'est un parcours déterministe basé sur des manuels, guides et notes de cours de référence.',
  year: 'Année',
  modules: 'Modules',
  reference: 'Référence',
  noModules: 'Aucun module prévu pour l\'année {year} dans ce département.',
  viewResearch: 'Voir la recherche du département',
  databankTitle: 'Banque de données ingénierie intégrée',
  databankDesc:
    'AluCalc Faculty se synchronise avec les noyaux OS. Les profils de filetage utilisent les mêmes paramètres que le moteur de calcul des boulons.',
  standardVerified: 'Norme vérifiée',
  standardVerifiedDesc: 'Conforme ISO/DIN/VDI 2230',
  realTimeData: 'Données en temps réel',
  realTimeDataDesc: 'Synchronisé avec OS Kernel v5.0',
  footerTitle: 'Faculté d\'ingénierie AluCalc',
  footerSubtitle: 'Stratégie académique et data mining — AluCalc AI Engine.',
  backToFaculty: 'AluCalc Faculty',
};

const IT: Partial<AcademyPageStrings> = {
  badge: 'Fondato v5.1 — Integrazione ingegneristica pura',
  heroTitle1: 'Accademico',
  heroTitle2: 'Programma di ingegneria',
  heroDesc:
    'Il nostro curriculum non è una raccolta di articoli. È un percorso deterministico basato su testi, manuali e appunti di facoltà di riferimento.',
  year: 'Anno',
  modules: 'Moduli',
  reference: 'Riferimento',
  noModules: 'Nessun modulo programmato per l\'anno {year} in questo dipartimento.',
  viewResearch: 'Visualizza ricerca del dipartimento',
  databankTitle: 'Banca dati ingegneristica integrata',
  databankDesc:
    'AluCalc Faculty si sincronizza con i kernel OS. I profili filettatura usano gli stessi parametri del motore di calcolo bulloni.',
  standardVerified: 'Standard verificato',
  standardVerifiedDesc: 'Conforme ISO/DIN/VDI 2230',
  realTimeData: 'Dati in tempo reale',
  realTimeDataDesc: 'Sincronizzato con OS Kernel v5.0',
  footerTitle: 'Facoltà di ingegneria AluCalc',
  footerSubtitle: 'Strategia accademica e data mining — AluCalc AI Engine.',
  backToFaculty: 'AluCalc Faculty',
};

const PT: Partial<AcademyPageStrings> = {
  badge: 'Estabelecido v5.1 — Integração pura de engenharia',
  heroTitle1: 'Acadêmico',
  heroTitle2: 'Programa de engenharia',
  heroDesc:
    'Nosso currículo não é uma coleção de artigos. É um caminho determinístico baseado em livros, manuais e notas de aula de referência.',
  year: 'Ano',
  modules: 'Módulos',
  reference: 'Referência',
  noModules: 'Nenhum módulo agendado para o ano {year} neste departamento.',
  viewResearch: 'Ver pesquisa do departamento',
  databankTitle: 'Banco de dados de engenharia integrado',
  databankDesc:
    'AluCalc Faculty sincroniza com os kernels do OS. Perfis de rosca usam os mesmos parâmetros do motor de cálculo de parafusos.',
  standardVerified: 'Padrão verificado',
  standardVerifiedDesc: 'Conforme ISO/DIN/VDI 2230',
  realTimeData: 'Dados em tempo real',
  realTimeDataDesc: 'Sincronizado com OS Kernel v5.0',
  footerTitle: 'Faculdade de Engenharia AluCalc',
  footerSubtitle: 'Estratégia acadêmica e mineração de dados — AluCalc AI Engine.',
  backToFaculty: 'AluCalc Faculty',
};

const RU: Partial<AcademyPageStrings> = {
  badge: 'Основано v5.1 — Чистая инженерная интеграция',
  heroTitle1: 'Академический',
  heroTitle2: 'Инженерный учебный план',
  heroDesc:
    'Наша программа — не набор статей. Это детерминированный путь, построенный на ведущих учебниках, справочниках и лекционных материалах.',
  year: 'Год',
  modules: 'Модули',
  reference: 'Ссылка',
  noModules: 'Нет модулей для {year} года в этом отделе.',
  viewResearch: 'Исследования отдела',
  databankTitle: 'Интегрированный инженерный банк данных',
  databankDesc:
    'AluCalc Faculty синхронизируется с ядрами OS. Профили резьбы используют те же параметры, что и движок расчёта болтов.',
  standardVerified: 'Стандарт проверен',
  standardVerifiedDesc: 'Соответствует ISO/DIN/VDI 2230',
  realTimeData: 'Данные в реальном времени',
  realTimeDataDesc: 'Синхронизировано с OS Kernel v5.0',
  footerTitle: 'Инженерный факультет AluCalc',
  footerSubtitle: 'Академическая стратегия и data mining — AluCalc AI Engine.',
  backToFaculty: 'AluCalc Faculty',
};

const ZH: Partial<AcademyPageStrings> = {
  badge: '成立 v5.1 — 纯工程集成',
  heroTitle1: '学术',
  heroTitle2: '工程教学大纲',
  heroDesc:
    '我们的课程不是文章集合，而是基于行业领先教材、手册和 faculty 讲义构建的确定性路径。',
  year: '年级',
  modules: '模块',
  reference: '参考',
  noModules: '该部门第 {year} 年暂无安排模块。',
  viewResearch: '查看部门研究',
  databankTitle: '集成工程数据库',
  databankDesc:
    'AluCalc Faculty 与 OS 内核直接同步。学习螺纹轮廓时，您看到的是螺栓计算引擎使用的相同参数。',
  standardVerified: '标准已验证',
  standardVerifiedDesc: '符合 ISO/DIN/VDI 2230',
  realTimeData: '实时数据',
  realTimeDataDesc: '与 OS Kernel v5.0 同步',
  footerTitle: 'AluCalc 工程学院',
  footerSubtitle: '学术策略与数据挖掘 — AluCalc AI Engine。',
  backToFaculty: 'AluCalc Faculty',
};

const JA: Partial<AcademyPageStrings> = {
  badge: '設立 v5.1 — 純粋なエンジニアリング統合',
  heroTitle1: 'アカデミック',
  heroTitle2: 'エンジニアリングシラバス',
  heroDesc:
    'カリキュラムは記事の集まりではありません。業界をリードする教科書、ハンドブック、講義ノートから構築された決定論的な道筋です。',
  year: '年次',
  modules: 'モジュール',
  reference: '参照',
  noModules: 'この学科に{year}年次のモジュールはありません。',
  viewResearch: '学科研究を見る',
  databankTitle: '統合エンジニアリングデータバンク',
  databankDesc:
    'AluCalc FacultyはOSカーネルと直接同期します。ねじプロファイルはボルト計算エンジンと同じパラメータを使用します。',
  standardVerified: '規格検証済み',
  standardVerifiedDesc: 'ISO/DIN/VDI 2230 準拠',
  realTimeData: 'リアルタイムデータ',
  realTimeDataDesc: 'OS Kernel v5.0 と同期',
  footerTitle: 'AluCalc 工学部',
  footerSubtitle: 'アカデミック戦略とデータマイニング — AluCalc AI Engine。',
  backToFaculty: 'AluCalc Faculty',
};

const KO: Partial<AcademyPageStrings> = {
  badge: '설립 v5.1 — 순수 엔지니어링 통합',
  heroTitle1: '학술',
  heroTitle2: '엔지니어링 교육과정',
  heroDesc:
    '커리큘럼은 기사 모음이 아닙니다. 업계 선도 교재, 핸드북, 강의 노트로 구성된 결정론적 경로입니다.',
  year: '학년',
  modules: '모듈',
  reference: '참고',
  noModules: '이 학과에 {year}학년 모듈이 없습니다.',
  viewResearch: '학과 연구 보기',
  databankTitle: '통합 엔지니어링 데이터뱅크',
  databankDesc:
    'AluCalc Faculty는 OS 커널과 직접 동기화됩니다. 나사 프로파일은 볼트 계산 엔진과 동일한 매개변수를 사용합니다.',
  standardVerified: '표준 검증됨',
  standardVerifiedDesc: 'ISO/DIN/VDI 2230 준수',
  realTimeData: '실시간 데이터',
  realTimeDataDesc: 'OS Kernel v5.0과 동기화',
  footerTitle: 'AluCalc 공과대학',
  footerSubtitle: '학술 전략 및 데이터 마이닝 — AluCalc AI Engine.',
  backToFaculty: 'AluCalc Faculty',
};

const AR: Partial<AcademyPageStrings> = {
  badge: 'تأسست v5.1 — تكامل هندسي خالص',
  heroTitle1: 'أكاديمي',
  heroTitle2: 'منهج الهندسة',
  heroDesc:
    'منهجنا ليس مجموعة مقالات. إنه مسار حتمي مبني على كتب ومراجع وملاحظات محاضرات رائدة في الصناعة.',
  year: 'السنة',
  modules: 'وحدات',
  reference: 'مرجع',
  noModules: 'لا توجد وحدات مجدولة للسنة {year} في هذا القسم.',
  viewResearch: 'عرض أبحاث القسم',
  databankTitle: 'بنك بيانات الهندسة المتكامل',
  databankDesc:
    'تتزامن AluCalc Faculty مباشرة مع نوى OS. ملفات الخيوط تستخدم نفس معاملات محرك حساب البراغي.',
  standardVerified: 'معيار موثق',
  standardVerifiedDesc: 'متوافق مع ISO/DIN/VDI 2230',
  realTimeData: 'بيانات فورية',
  realTimeDataDesc: 'متزامن مع OS Kernel v5.0',
  footerTitle: 'كلية الهندسة AluCalc',
  footerSubtitle: 'الاستراتيجية الأكاديمية واستخراج البيانات — AluCalc AI Engine.',
  backToFaculty: 'AluCalc Faculty',
};

const ACADEMY_PAGE: Record<Language, AcademyPageStrings> = {
  en: EN,
  tr: TR,
  de: DE as AcademyPageStrings,
  es: ES as AcademyPageStrings,
  fr: FR as AcademyPageStrings,
  it: IT as AcademyPageStrings,
  pt: PT as AcademyPageStrings,
  ru: RU as AcademyPageStrings,
  zh: ZH as AcademyPageStrings,
  ja: JA as AcademyPageStrings,
  ko: KO as AcademyPageStrings,
  ar: AR as AcademyPageStrings,
};

export function getAcademyPage(locale: string): AcademyPageStrings {
  const lang = locale as Language;
  const loc = ACADEMY_PAGE[lang];
  const chrome = ACADEMY_PAGE_UI_CHROME[lang] ?? {};
  if (!loc) return { ...EN, ...chrome };
  return { ...EN, ...loc, ...chrome };
}

export function formatAcademyYear(template: string, year: number): string {
  return template.replace('{year}', String(year));
}

const DEPT_TRANSLATIONS: Record<Language, Record<string, { title: string; head: string }>> = {
  en: {
    Design: { title: 'Machine Design & Elements', head: 'VDI 2230 / ISO 898-1 Specialist' },
    Structural: { title: 'Structural Mechanics & Analysis', head: "Roark's Methodology Lab" },
    Manufacturing: { title: 'Manufacturing & Tooling', head: 'KYOCERA J-Section Standards' },
    Physics: { title: 'Engineering Fundamentals', head: 'SI Core Standards' }
  },
  tr: {
    Design: { title: 'Makine Tasarımı ve Elemanları', head: 'VDI 2230 / ISO 898-1 Uzmanlığı' },
    Structural: { title: 'Yapısal Mekanik ve Analiz', head: 'Roark Metodoloji Laboratuvarı' },
    Manufacturing: { title: 'İmalat ve Takım Tezgâhları', head: 'KYOCERA J-Bölümü Standartları' },
    Physics: { title: 'Mühendislik Temelleri', head: 'SI Temel Standartları' }
  },
  de: {
    Design: { title: 'Maschinenbau & Konstruktionselemente', head: 'Fachkompetenz VDI 2230 / ISO 898-1' },
    Structural: { title: 'Strukturmechanik & Analyse', head: 'Roark-Methodik-Labor' },
    Manufacturing: { title: 'Fertigungstechnik & Werkzeuge', head: 'KYOCERA J-Sektion Normen' },
    Physics: { title: 'Ingenieurgrundlagen', head: 'SI-Kernstandards' }
  },
  es: {
    Design: { title: 'Diseño de Máquinas y Elementos', head: 'Especialista VDI 2230 / ISO 898-1' },
    Structural: { title: 'Mecánica Estructural y Análisis', head: 'Laboratorio de Metodología Roark' },
    Manufacturing: { title: 'Fabricación y Herramental', head: 'Normas KYOCERA Sección J' },
    Physics: { title: 'Fundamentos de Ingeniería', head: 'Normas Básicas de SI' }
  },
  fr: {
    Design: { title: 'Conception de Machines et Éléments', head: 'Spécialiste VDI 2230 / ISO 898-1' },
    Structural: { title: 'Mécanique Structurelle et Analyse', head: 'Laboratoire de Méthodologie Roark' },
    Manufacturing: { title: 'Fabrication et Outillage', head: 'Normes KYOCERA Section J' },
    Physics: { title: 'Fondements de l\'Ingénierie', head: 'Normes de Base du SI' }
  },
  it: {
    Design: { title: 'Progettazione di Macchine ed Elementi', head: 'Specialista VDI 2230 / ISO 898-1' },
    Structural: { title: 'Meccanica Strutturale e Analisi', head: 'Laboratorio di Metodologia Roark' },
    Manufacturing: { title: 'Produzione e Utensili', head: 'Norme KYOCERA Sezione J' },
    Physics: { title: 'Fondamenti di Ingegneria', head: 'Standard di Base del SI' }
  },
  pt: {
    Design: { title: 'Projeto de Máquinas e Elementos', head: 'Especialista VDI 2230 / ISO 898-1' },
    Structural: { title: 'Mecânica Estrutural e Análise', head: 'Laboratório de Metodologia Roark' },
    Manufacturing: { title: 'Fabricação e Ferramental', head: 'Normas KYOCERA Seção J' },
    Physics: { title: 'Fundamentos de Engenharia', head: 'Padrões de Base do SI' }
  },
  ru: {
    Design: { title: 'Проектирование машин и деталей', head: 'Эксперт по VDI 2230 / ISO 898-1' },
    Structural: { title: 'Строительная механика и анализ', head: 'Лаборатория методологии Роарка' },
    Manufacturing: { title: 'Производство и оснастка', head: 'Стандарты KYOCERA, раздел J' },
    Physics: { title: 'Основы инженерного дела', head: 'Базовые стандарты SI' }
  },
  zh: {
    Design: { title: '机械设计与零部件', head: 'VDI 2230 / ISO 898-1 专家' },
    Structural: { title: '结构力学与分析', head: '罗克方法论实验室' },
    Manufacturing: { title: '制造与工装技术', head: '京瓷 J 部分标准' },
    Physics: { title: '工程基本原理', head: 'SI 核心标准' }
  },
  ja: {
    Design: { title: '機械設計・機械要素', head: 'VDI 2230 / ISO 898-1 専門家' },
    Structural: { title: '構造力学・構造解析', head: 'ローアーク手法研究室' },
    Manufacturing: { title: '製造・工具技術', head: '京セラ Jセクション規格' },
    Physics: { title: '工学の基礎', head: 'SI 基本規格' }
  },
  ko: {
    Design: { title: '기계 설계 및 요소', head: 'VDI 2230 / ISO 898-1 전문가' },
    Structural: { title: '구조 역학 및 해석', head: '로아크 방법론 연구실' },
    Manufacturing: { title: '제조 및 공구 기술', head: '교세라 J-섹션 표준' },
    Physics: { title: '공학의 기초', head: 'SI 기본 표준' }
  },
  ar: {
    Design: { title: 'تصميم الآلات وعناصرها', head: 'أخصائي VDI 2230 / ISO 898-1' },
    Structural: { title: 'ميكانيكا الهياكل وتحليلها', head: 'مختبر منهجية روارك' },
    Manufacturing: { title: 'التصنيع والأدوات والماكينات', head: 'معايير KYOCERA القسم J' },
    Physics: { title: 'أساسيات الهندسة', head: 'معايير SI الأساسية' }
  }
};

export function getAcademyDepartments(locale: string): AcademyDepartment[] {
  const baseDepts = locale === 'tr' ? TR_DEPARTMENTS : EN_DEPARTMENTS;

  return baseDepts.map((dept) => {
    const translation =
      locale === 'tr' || locale === 'en'
        ? undefined
        : DEPT_TRANSLATIONS[locale as Language]?.[dept.id];
    return {
      ...dept,
      title: translation?.title ?? dept.title,
      head: translation?.head ?? dept.head,
    };
  });
}

const ACADEMY_CATEGORY_LABELS: Record<string, Partial<Record<Language, string>>> = {
  mechanical: { en: 'Mechanical', tr: 'Mekanik', de: 'Maschinenbau', es: 'Mecánica', fr: 'Mécanique', it: 'Meccanica', pt: 'Mecânica', ru: 'Механика', ja: '機械', zh: '机械', ko: '기계', ar: 'ميكانيكي' },
  structural: { en: 'Structural', tr: 'Yapısal', de: 'Konstruktion', es: 'Estructural', fr: 'Structure', it: 'Strutturale', pt: 'Estrutural', ru: 'Конструкции', ja: '構造', zh: '结构', ko: '구조', ar: 'إنشائي' },
  structures: { en: 'Structures', tr: 'Yapılar', de: 'Tragwerke', es: 'Estructuras', fr: 'Structures', it: 'Strutture', pt: 'Estruturas', ru: 'Конструкции', ja: '構造物', zh: '结构', ko: '구조물', ar: 'هياكل' },
  civil: { en: 'Civil', tr: 'İnşaat', de: 'Bauwesen', es: 'Civil', fr: 'Génie civil', it: 'Civile', pt: 'Civil', ru: 'Строительство', ja: '土木', zh: '土木', ko: '토목', ar: 'مدني' },
  aerospace: { en: 'Aerospace', tr: 'Havacılık', de: 'Luft- und Raumfahrt', es: 'Aeroespacial', fr: 'Aérospatial', it: 'Aerospaziale', pt: 'Aeroespacial', ru: 'Авиакосмос', ja: '航空宇宙', zh: '航空航天', ko: '항공우주', ar: 'فضاء جوي' },
  fluid: { en: 'Fluid', tr: 'Akışkan', de: 'Strömung', es: 'Fluidos', fr: 'Fluides', it: 'Fluidi', pt: 'Fluidos', ru: 'Гидравлика', ja: '流体', zh: '流体', ko: '유체', ar: 'سوائل' },
  fluids: { en: 'Fluids', tr: 'Akışkanlar', de: 'Strömungslehre', es: 'Fluidos', fr: 'Fluides', it: 'Fluidi', pt: 'Fluidos', ru: 'Гидравлика', ja: '流体', zh: '流体', ko: '유체', ar: 'سوائل' },
  manufacturing: { en: 'Manufacturing', tr: 'İmalat', de: 'Fertigung', es: 'Fabricación', fr: 'Fabrication', it: 'Produzione', pt: 'Manufatura', ru: 'Производство', ja: '製造', zh: '制造', ko: '제조', ar: 'تصنيع' },
  electrical: { en: 'Electrical', tr: 'Elektrik', de: 'Elektrotechnik', es: 'Eléctrica', fr: 'Électrique', it: 'Elettrica', pt: 'Elétrica', ru: 'Электротехника', ja: '電気', zh: '电气', ko: '전기', ar: 'كهربائي' },
  science: { en: 'Science', tr: 'Bilim', de: 'Naturwissenschaft', es: 'Ciencia', fr: 'Sciences', it: 'Scienza', pt: 'Ciência', ru: 'Наука', ja: '科学', zh: '科学', ko: '과학', ar: 'علوم' },
  thermal: { en: 'Thermal', tr: 'Termal', de: 'Thermik', es: 'Térmica', fr: 'Thermique', it: 'Termica', pt: 'Térmica', ru: 'Теплотехника', ja: '熱', zh: '热工', ko: '열', ar: 'حراري' },
  fasteners: { en: 'Fasteners', tr: 'Bağlantı Elemanları', de: 'Verbindungselemente', es: 'Fijaciones', fr: 'Fixations', it: 'Fissaggi', pt: 'Fixadores', ru: 'Крепёж', ja: '締結', zh: '紧固件', ko: '체결', ar: 'مثبتات' },
};

export function getAcademyCategoryLabel(category: string | undefined, locale: string): string | undefined {
  if (!category) return undefined;
  const key = category.toLowerCase();
  const labels = ACADEMY_CATEGORY_LABELS[key];
  if (!labels) return category;
  return labels[locale as Language] ?? labels.en ?? category;
}

const DEPT_OUTCOMES_EN: Record<string, string[]> = {
  Design: [
    'Size bolted joints using VDI 2230 preload methodology',
    'Predict rolling bearing L10 life per ISO 281',
    'Match motor power to transmission loads',
  ],
  Structural: [
    'Relate stress and strain in axially loaded members',
    'Use Mohr’s circle for plane stress states',
    'Evaluate beam deflection and Euler buckling limits',
    'Calculate pipe pressure drop for pump sizing',
  ],
  Manufacturing: [
    'Read ISO metric and UN thread designations',
    'Select chip breaker geometry for turning operations',
  ],
  Physics: [
    'Convert between SI units without ambiguity',
    'Draw free-body diagrams and solve equilibrium',
    'Map machine elements to their design functions',
  ],
};

const DEPT_OUTCOMES_TR: Record<string, string[]> = {
  Design: [
    'VDI 2230 ön yük metodolojisi ile cıvatalı birleşim boyutlandırma',
    'ISO 281’e göre rulman L10 ömrü tahmini',
    'Motor gücünü aktarım yükleriyle eşleme',
  ],
  Structural: [
    'Eksenel yüklü elemanlarda gerilme-şekil değişimi ilişkisi',
    'Düzlem gerilme için Mohr çemberi kullanımı',
    'Kiriş sehimi ve Euler burkulma limitleri',
    'Pompa boyutlandırma için boru basınç düşümü',
  ],
  Manufacturing: [
    'ISO metrik ve UN diş tanımlarını okuma',
    'Tornalama için talaş kırıcı geometrisi seçimi',
  ],
  Physics: [
    'SI birimleri arasında belirsizlik olmadan dönüşüm',
    'Serbest cisim diyagramı ve denge çözümü',
    'Makine elemanlarını tasarım işlevlerine eşleme',
  ],
};

const DEPT_OUTCOMES: Record<Language, Record<string, string[]>> = {
  en: DEPT_OUTCOMES_EN,
  tr: DEPT_OUTCOMES_TR,
  de: {
    Design: [
      'Dimensionieren von Schraubenverbindungen nach VDI 2230',
      'Berechnung der Wälzlager-Lebensdauer L10 nach ISO 281',
      'Abstimmung der Motorleistung auf die Getriebebelastungen'
    ],
    Structural: [
      'Verbindung von Spannung und Dehnung bei axial belasteten Elementen',
      'Verwendung des Mohrschen Kreises für den ebenen Spannungszustand',
      'Bewertung der Balkendurchbiegung und Euler-Knickgrenzen',
      'Berechnung des Rohrdruckabfalls zur Pumpenauslegung'
    ],
    Manufacturing: [
      'Lesen von metrischen ISO- und UN-Gewindebezeichnungen',
      'Auswahl der Spanbrechergeometrie für Drehoperationen'
    ],
    Physics: [
      'Eindeutige Umrechnung zwischen SI-Einheiten',
      'Zeichnen von Freikörperdiagrammen und Lösen des Gleichgewichts',
      'Zuordnung von Maschinenelementen zu ihren Konstruktionsfunktionen'
    ]
  },
  es: {
    Design: [
      'Dimensionar uniones atornilladas usando la metodología de precarga VDI 2230',
      'Predecir la vida útil L10 de rodamientos según ISO 281',
      'Adaptar la potencia del motor a las cargas de transmisión'
    ],
    Structural: [
      'Relacionar el esfuerzo y la deformación en elementos con carga axial',
      'Utilizar el círculo de Mohr para estados de tensión plana',
      'Evaluar la deflexión de vigas y los límites de pandeo de Euler',
      'Calcular la caída de presión en tuberías para el dimensionamiento de bombas'
    ],
    Manufacturing: [
      'Leer designaciones de roscas métricas ISO y UN',
      'Seleccionar la geometría del rompevirutas para operaciones de torneado'
    ],
    Physics: [
      'Convertir entre unidades SI sin ambigüedad',
      'Dibujar diagramas de cuerpo libre y resolver el equilibrio',
      'Asociar elementos de máquina a sus funciones de diseño'
    ]
  },
  fr: {
    Design: [
      'Dimensionner les assemblages boulonnés selon la méthode de précharge VDI 2230',
      'Prédire la durée de vie L10 des roulements selon la norme ISO 281',
      'Associer la puissance du moteur aux charges de transmission'
    ],
    Structural: [
      'Relier la contrainte et la déformation dans les éléments sollicités axialement',
      'Utiliser le cercle de Mohr pour les états de contraintes planes',
      'Évaluer la déflexion des poutres et les limites de flambement d\'Euler',
      'Calculer la perte de charge dans les tuyaux pour le dimensionnement des pompes'
    ],
    Manufacturing: [
      'Lire les désignations de filetages métriques ISO et UN',
      'Sélectionner la géométrie du brise-copeaux pour les opérations de tournage'
    ],
    Physics: [
      'Convertir entre les unités SI sans ambiguïté',
      'Dessiner des diagrammes de corps libre et résoudre l\'équilibre',
      'Associer les éléments de machine à leurs fonctions de conception'
    ]
  },
  it: {
    Design: [
      'Dimensionare giunti bullonati usando la metodologia di precarico VDI 2230',
      'Prevedere la vita utile L10 dei cuscinetti secondo la norma ISO 281',
      'Abbinare la potenza del motore ai carichi di trasmissione'
    ],
    Structural: [
      'Relazionare lo sforzo e la deformazione negli elementi caricati assialmente',
      'Utilizzare il cerchio di Mohr per stati di tensione piana',
      'Valutare la flessione della trave e i limiti di instabilità di Eulero',
      'Calcolare la caduta di pressione nei tubi per il dimensionamento delle pompe'
    ],
    Manufacturing: [
      'Leggere le designazioni delle filettature metriche ISO e UN',
      'Selezionare la geometria del rompitruciolo per le operazioni di tornitura'
    ],
    Physics: [
      'Convertire tra unità SI senza ambiguità',
      'Disegnare diagrammi di corpo libero e risolvere l\'equilibrio',
      'Mappare gli elementi della macchina alle loro funzioni di progettazione'
    ]
  },
  pt: {
    Design: [
      'Dimensionar juntas parafusadas usando a metodologia de pré-carga VDI 2230',
      'Prever a vida útil L10 de rolamentos segundo a norma ISO 281',
      'Associar a potência do motor às cargas de transmissão'
    ],
    Structural: [
      'Relacionar a tensão e a deformação em elementos sob carga axial',
      'Utilizar o círculo de Mohr para estados de tensão plana',
      'Avaliar a deflexão de vigas e limites de flambagem de Euler',
      'Calcular a perda de carga em tubulações para dimensionamento de bombas'
    ],
    Manufacturing: [
      'Ler as designações de roscas métricas ISO e UN',
      'Selecionar a geometria do quebra-cavacos para operações de torneamento'
    ],
    Physics: [
      'Converter entre unidades SI sem ambiguidade',
      'Desenhar diagramas de corpo livre e resolver o equilíbrio',
      'Mapear os elementos da máquina para suas funções de projeto'
    ]
  },
  ru: {
    Design: [
      'Расчет резьбовых соединений по методологии предварительной затяжки VDI 2230',
      'Определение ресурса подшипников L10 согласно ISO 281',
      'Подбор мощности двигателя в соответствии с трансмиссионными нагрузками'
    ],
    Structural: [
      'Связь между напряжением и деформацией в деталях при осевом нагружении',
      'Использование круга Мора для плоских напряженных состояний',
      'Оценка прогиба балок и пределов устойчивости Эйлера (продольный изгиб)',
      'Расчет потерь давления в трубопроводах для подбора насосов'
    ],
    Manufacturing: [
      'Чтение обозначений метрической резьбы ISO и UN',
      'Выбор геометрии стружколома для токарных операций'
    ],
    Physics: [
      'Однозначный перевод физических величин в системе СИ',
      'Построение эпюр и решение уравнений статического равновесия',
      'Соотнесение деталей машин с их конструкционными функциями'
    ]
  },
  zh: {
    Design: [
      '使用 VDI 2230 预紧力方法设计螺栓连接尺寸',
      '根据 ISO 281 预测滚动轴承 L10 寿命',
      '使电机功率与传动负载相匹配'
    ],
    Structural: [
      '关联轴向受载构件中的应力与应变',
      '将莫尔圆应用于平面应力状态分析',
      '评估梁的挠度与欧拉临界失稳极限',
      '计算管路压力降以进行水泵选型'
    ],
    Manufacturing: [
      '识读 ISO 公制和 UN 统一制螺纹标记',
      '为车削加工选择合适的断屑槽几何形状'
    ],
    Physics: [
      '在不同单位制与标准 SI 单位之间进行无歧义转换',
      '绘制受力分析图并求解静态平衡方程',
      '将标准机械零件与其具体设计功能进行对应映射'
    ]
  },
  ja: {
    Design: [
      'VDI 2230の予張力手法を用いたボルト締結部の設計',
      'ISO 281に基づく転がり軸受のL10寿命の予測',
      'モータ出力と伝達負荷の整合'
    ],
    Structural: [
      '軸荷重を受ける部材における応力とひずみの関係の把握',
      '平面応力状態におけるモールの応力円の適用',
      '梁のたわみおよび Euler 座屈限界の評価',
      'ポンプ選定のための配管圧力損失の計算'
    ],
    Manufacturing: [
      'ISOメートルねじおよびUNねじ規格の図面指示の解読',
      '旋盤加工におけるチップブレーカの形状選定'
    ],
    Physics: [
      'SI単位と各種単位間の正確な相互変換の実施',
      '自由体ダイヤグラム（FBD）の作成と静的釣合いの計算',
      '各機械要素の機能と適用箇所の対応付け'
    ]
  },
  ko: {
    Design: [
      'VDI 2230 예하중 설계법을 이용한 볼트 연결부 치수 산정',
      'ISO 281 표준에 따른 회전 베어링 L10 수명 예측',
      '모터 동력과 동력 전달 장치의 부하 매칭'
    ],
    Structural: [
      '축방향 하중을 받는 부재의 응력과 변형률 관계 파악',
      '평면 응력 상태 분석을 위한 모어 원(Mohr circle) 활용',
      '보의 처짐량 계산 및 오일러 좌굴 한계 평가',
      '펌프 용량 선정을 위한 관로 내 압력 손실 계산'
    ],
    Manufacturing: [
      'ISO 메트릭 규격 및 UN 나사 표시법 해독',
      '선삭 가공을 위한 칩 브레이커 형상 선정'
    ],
    Physics: [
      '오차 없는 SI 단위와 타 단위계 간 변환 수행',
      '자유물체도(FBD) 작성 및 정적 평형 상태 해석',
      '규격 기계 부품의 기능과 설계 요구 조건 간 매핑'
    ]
  },
  ar: {
    Design: [
      'تحديد أبعاد الوصلات اللولبية باستخدام منهجية التحميل المسبق VDI 2230',
      'التنبؤ بعمر المحمل L10 وفقًا لمعيار ISO 281',
      'مواءمة قدرة المحرك الكهربائي مع أحمال نقل الحركة'
    ],
    Structural: [
      'ربط الإجهاد والانفعال في العناصر المحملة محوريًا',
      'استخدام دائرة مور لتحليل حالات الإجهاد المستوي',
      'تقييم انحراف العوارض وحدود انبعاج إيولر للركائز',
      'حساب انخفاض ضغط الأنابيب لأغراض أبعاد المضخات'
    ],
    Manufacturing: [
      'قراءة وتفسير ترميز اللوالب المترية ISO والمعيارية UN',
      'اختيار هندسة كاسر الرايش لعمليات الخراطة'
    ],
    Physics: [
      'التحويل بين وحدات القياس الهندسية ووحدات SI دون لبس',
      'رسم مخططات الجسم الحر وحساب معادلات التوازن الاستاتيكي',
      'ربط عناصر الماكينات القياسية بوظائفها التصميمية'
    ]
  }
};

export function getDepartmentOutcomes(locale: string, deptId: string): string[] {
  const map = DEPT_OUTCOMES[locale as Language] ?? DEPT_OUTCOMES_EN;
  return map[deptId] ?? DEPT_OUTCOMES_EN[deptId] ?? [];
}

export function formatAcademyTemplate(template: string, vars: Record<string, string | number>): string {
  return Object.entries(vars).reduce(
    (s, [k, v]) => s.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v)),
    template,
  );
}

const ALL_ACADEMY_LOCALES: Language[] = ['en', 'tr', 'de', 'es', 'fr', 'it', 'pt', 'ru', 'zh', 'ja', 'ko', 'ar'];
for (const locale of ALL_ACADEMY_LOCALES) {
  const target = ACADEMY_PAGE[locale];
  if (!target) continue;
  for (const key of Object.keys(EN) as (keyof AcademyPageStrings)[]) {
    if (target[key] === undefined) {
      (target as Record<string, string>)[key] = EN[key];
    }
  }
}
