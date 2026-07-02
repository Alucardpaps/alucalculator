import type { Language } from '@/store/i18nStore';

export type FooterLink = { href: string; label: string };
export type FooterColumn = { title: string; links: FooterLink[] };
export type HomeFooterStrings = {
  whatTitle: string;
  whatParagraphs: string[];
  howTitle: string;
  howParagraphs: string[];
  footerColumns: FooterColumn[];
  copyright: string;
};

const FOOTER_LINKS: FooterColumn[] = [
  {
    title: 'Mechanical',
    links: [
      { href: '/bolt-torque', label: 'Bolt Torque Calculator' },
      { href: '/bearings', label: 'Bearing Life (ISO 281)' },
      { href: '/gears', label: 'Gear Ratio Calculator' },
      { href: '/shafts', label: 'Shaft Diameter' },
      { href: '/hooke-law', label: 'Spring Constant' },
      { href: '/motor-selection-std', label: 'Motor Power' },
    ],
  },
  {
    title: 'Structural',
    links: [
      { href: '/beam-deflection', label: 'Beam Deflection' },
      { href: '/concrete-reinforcement', label: 'Concrete Reinforcement' },
      { href: '/simulation-fea', label: 'FEA Analysis' },
      { href: '/topology-optimization', label: 'Topology Optimization' },
      { href: '/machine-assembly', label: 'Machine Assembly' },
    ],
  },
  {
    title: 'Fluid and Thermal',
    links: [
      { href: '/fluid-dynamics', label: 'Pressure Drop' },
      { href: '/thermal-expansion', label: 'Heat Transfer' },
      { href: '/pumps', label: 'Pump Performance' },
      { href: '/reducer-lubrication', label: 'Gearbox Lubrication' },
      { href: '/naval-hydrostatics', label: 'Naval Hydrostatics' },
    ],
  },
  {
    title: 'Electrical',
    links: [
      { href: '/three-phase-power', label: 'Power Calculator' },
      { href: '/ohms-law', label: "Ohm's Law" },
      { href: '/voltage-drop', label: 'Voltage Drop' },
      { href: '/3-phase-power', label: '3-Phase Power' },
      { href: '/filter-design', label: 'Filter Design' },
    ],
  },
  {
    title: 'Science',
    links: [
      { href: '/physics-solver', label: 'Physics CAS Solver' },
      { href: '/failure-prediction', label: 'Failure Prediction' },
      { href: '/failure-diagnosis', label: 'Failure Diagnosis' },
      { href: '/biology-genetics', label: 'Population Genetics' },
      { href: '/digital-logic', label: 'Digital Logic Lab' },
    ],
  },
  {
    title: 'Platform',
    links: [
      { href: '/academy?tab=calculators', label: 'All Calculators' },
      { href: '/workspace', label: 'Open Workspace' },
      { href: '/academy', label: 'Engineering Academy' },
      { href: '/', label: 'Home' },
    ],
  },
];

const EN: HomeFooterStrings = {
  whatTitle: 'What Are Engineering Calculators?',
  whatParagraphs: [
    'Engineering calculators are specialized tools that solve technical equations used in mechanical, structural, electrical, and thermal engineering. Unlike general-purpose calculators, they implement validated formulas from international standards such as ISO 281, VDI 2230, ASME PCC-1, and Euler-Bernoulli beam theory.',
    'These tools are used daily by design engineers, project engineers, manufacturing engineers, and students to verify hand calculations, perform preliminary sizing, and validate simulation results.',
    'Modern browser-based engineering calculators like AluCalc OS eliminate expensive desktop licenses. Engineers can perform accurate calculations from any device with results validated against the same standards used worldwide.',
  ],
  howTitle: 'How Engineers Use These Tools',
  howParagraphs: [
    'Professional engineers integrate online calculators into their design workflow at multiple stages. During conceptual design, quick sizing determines whether a shaft diameter, beam section, or motor rating is in the right ballpark before detailed CAD modeling.',
    'In manufacturing and field engineering, calculators serve as instant reference tools. Engineering students use them to check homework solutions and build intuition for how changing one variable affects the entire system.',
  ],
  footerColumns: FOOTER_LINKS,
  copyright: '\u00a9 2026 AluCalc Advanced Engineering Systems',
};

const TR: HomeFooterStrings = {
  whatTitle: 'M\u00fchendislik Hesaplay\u0131c\u0131lar\u0131 Nedir?',
  whatParagraphs: [
    'M\u00fchendislik hesaplay\u0131c\u0131lar\u0131, mekanik, yap\u0131sal, elektrik ve termal m\u00fchendislikte kullan\u0131lan teknik denklemleri \u00e7\u00f6zen \u00f6zel ara\u00e7lard\u0131r. ISO 281, VDI 2230, ASME PCC-1 ve Euler-Bernoulli kiri\u015f teorisi gibi uluslararas\u0131 standartlara dayan\u0131rlar.',
    'Tasar\u0131m m\u00fchendisleri, proje m\u00fchendisleri, imalat m\u00fchendisleri ve \u00f6\u011frenciler el hesaplar\u0131n\u0131 do\u011frulamak, \u00f6n boyutland\u0131rma yapmak ve sim\u00fclasyon sonu\u00e7lar\u0131n\u0131 kontrol etmek i\u00e7in g\u00fcnl\u00fck kullan\u0131r.',
    'AluCalc OS gibi taray\u0131c\u0131 tabanl\u0131 hesaplay\u0131c\u0131lar pahal\u0131 masa\u00fcst\u00fc lisanslar\u0131 ortadan kald\u0131r\u0131r. M\u00fchendisler her cihazdan, d\u00fcnya \u00e7ap\u0131nda kullan\u0131lan standartlara g\u00f6re do\u011frulanm\u0131\u015f sonu\u00e7lar al\u0131r.',
  ],
  howTitle: 'M\u00fchendisler Bu Ara\u00e7lar\u0131 Nas\u0131l Kullan\u0131r?',
  howParagraphs: [
    'Profesyonel m\u00fchendisler \u00e7evrimi\u00e7i hesaplay\u0131c\u0131lar\u0131 tasar\u0131m s\u00fcrecinin bir\u00e7ok a\u015famas\u0131na entegre eder. Konsept tasar\u0131mda h\u0131zl\u0131 boyutland\u0131rma, mil \u00e7ap\u0131 veya motor g\u00fcc\u00fcn\u00fcn do\u011fru aral\u0131kta olup olmad\u0131\u011f\u0131n\u0131 g\u00f6sterir.',
    'Imalat ve saha m\u00fchendisli\u011finde hesaplay\u0131c\u0131lar anl\u0131k referans arac\u0131d\u0131r. \u00d6\u011frenciler \u00f6dev \u00e7\u00f6z\u00fcmlerini kontrol eder ve de\u011fi\u015fkenlerin sistemi nas\u0131l etkiledi\u011fini \u00f6\u011frenir.',
  ],
  footerColumns: FOOTER_LINKS.map((col, i) => ({
    title: ['Mekanik', 'Yap\u0131sal', 'Ak\u0131\u015fkan ve Termal', 'Elektrik', 'Bilim', 'Platform'][i] ?? col.title,
    links: col.links.map((l, j) => ({
      href: l.href,
      label:
        [
          ['C\u0131vata Tork', 'Rulman \u00d6mr\u00fc', 'Di\u015fli Oran\u0131', 'Mil \u00c7ap\u0131', 'Yay Sabiti', 'Motor G\u00fcc\u00fc'],
          ['Kiri\u015f Sehimi', 'Betonarme', 'FEA Analizi', 'Topoloji Optimizasyonu', 'Makine Montaj\u0131'],
          ['Bas\u0131n\u00e7 D\u00fc\u015f\u00fcm\u00fc', 'Is\u0131 Transferi', 'Pompa', 'Red\u00fckt\u00f6r Ya\u011flama', 'Gemi Hidrostati\u011fi'],
          ['G\u00fc\u00e7', 'Ohm Kanunu', 'Gerilim D\u00fc\u015f\u00fcm\u00fc', '3 Faz G\u00fc\u00e7', 'Filtre Tasar\u0131m\u0131'],
          ['Fizik \u00c7\u00f6z\u00fcc\u00fc', 'Ar\u0131za Tahmini', 'Ar\u0131za Te\u015fhisi', 'Genetik', 'Dijital Mant\u0131k'],
          ['T\u00fcm Hesaplay\u0131c\u0131lar', 'Workspace', 'Akademi', 'Ana Sayfa'],
        ][i]?.[j] ?? l.label,
    })),
  })),
  copyright: '\u00a9 2026 AluCalc Geli\u015fmi\u015f M\u00fchendislik Sistemleri',
};

const DE: HomeFooterStrings = {
    whatTitle: "Was sind Ingenieurrechner?",
    whatParagraphs: [
        "Ingenieurrechner sind spezialisierte Werkzeuge, die technische Gleichungen aus dem Maschinen-, Bau-, Elektro- und Thermoingenieurwesen lösen. Im Gegensatz zu allgemeinen Taschenrechnern setzen sie validierte Formeln internationaler Normen wie ISO 281, VDI 2230, ASME PCC-1 und die Euler-Bernoulli-Balkentheorie um.",
        "Konstruktionsingenieure, Projektingenieure, Fertigungsingenieure und Studierende nutzen diese Werkzeuge täglich, um Handrechnungen zu überprüfen, Vorabdimensionierungen durchzuführen und Simulationsergebnisse zu validieren.",
        "Moderne browserbasierte Ingenieurrechner wie AluCalc OS machen teure Desktop-Lizenzen überflüssig. Ingenieure können von jedem Gerät aus präzise Berechnungen durchführen – mit Ergebnissen, die anhand derselben weltweit anerkannten Normen validiert werden.",
    ],
    howTitle: "Wie Ingenieure diese Werkzeuge nutzen",
    howParagraphs: [
        "Berufliche Ingenieure integrieren Online-Rechner in mehrere Phasen ihres Konstruktionsworkflows. In der Konzeptphase liefert eine schnelle Dimensionierung erste Hinweise, ob Wellendurchmesser, Balkenquerschnitt oder Motorleistung im richtigen Bereich liegen, bevor detaillierte CAD-Modelle erstellt werden.",
        "In Fertigung und Außendienst dienen Rechner als sofort verfügbare Referenzwerkzeuge. Studierende prüfen damit Hausaufgabenlösungen und entwickeln ein Gefühl dafür, wie sich die Änderung einer Größe auf das gesamte System auswirkt.",
    ],
    footerColumns: [{"title":"Mechanik","links":[{"href":"/bolt-torque","label":"Schraubenanzugsmoment-Rechner"},{"href":"/bearings","label":"Lagerlebensdauer (ISO 281)"},{"href":"/gears","label":"Übersetzungsrechner"},{"href":"/shafts","label":"Wellendurchmesser"},{"href":"/hooke-law","label":"Federkonstante"},{"href":"/motor-selection-std","label":"Motorleistung"}]},{"title":"Statik","links":[{"href":"/beam-deflection","label":"Balkendurchbiegung"},{"href":"/concrete-reinforcement","label":"Betonbewehrung"},{"href":"/simulation-fea","label":"FEA-Analyse"},{"href":"/topology-optimization","label":"Topologieoptimierung"},{"href":"/machine-assembly","label":"Maschinenmontage"}]},{"title":"Strömung und Thermik","links":[{"href":"/fluid-dynamics","label":"Druckverlust"},{"href":"/thermal-expansion","label":"Wärmeübertragung"},{"href":"/pumps","label":"Pumpenleistung"},{"href":"/reducer-lubrication","label":"Getriebeschmierung"},{"href":"/naval-hydrostatics","label":"Schiffshydrostatik"}]},{"title":"Elektrotechnik","links":[{"href":"/three-phase-power","label":"Leistungsrechner"},{"href":"/ohms-law","label":"Ohmsches Gesetz"},{"href":"/voltage-drop","label":"Spannungsabfall"},{"href":"/3-phase-power","label":"Drehstromleistung"},{"href":"/filter-design","label":"Filterauslegung"}]},{"title":"Naturwissenschaften","links":[{"href":"/physics-solver","label":"Physik-CAS-Löser"},{"href":"/failure-prediction","label":"Ausfallvorhersage"},{"href":"/failure-diagnosis","label":"Ausfalldiagnose"},{"href":"/biology-genetics","label":"Populationsgenetik"},{"href":"/digital-logic","label":"Digitale Logik-Labor"}]},{"title":"Plattform","links":[{"href":"/academy?tab=calculators","label":"Alle Rechner"},{"href":"/workspace","label":"Workspace öffnen"},{"href":"/academy","label":"Ingenieur-Akademie"},{"href":"/","label":"Startseite"}]}],
    copyright: "© 2026 AluCalc Advanced Engineering Systems",
};

const ES: HomeFooterStrings = {
    whatTitle: "¿Qué son las calculadoras de ingeniería?",
    whatParagraphs: [
        "Las calculadoras de ingeniería son herramientas especializadas que resuelven ecuaciones técnicas utilizadas en ingeniería mecánica, estructural, eléctrica y térmica. A diferencia de las calculadoras de uso general, implementan fórmulas validadas según normas internacionales como ISO 281, VDI 2230, ASME PCC-1 y la teoría de vigas Euler-Bernoulli.",
        "Ingenieros de diseño, de proyecto, de fabricación y estudiantes las utilizan a diario para verificar cálculos manuales, realizar dimensionamientos preliminares y validar resultados de simulación.",
        "Las calculadoras de ingeniería modernas basadas en navegador, como AluCalc OS, eliminan las costosas licencias de escritorio. Los ingenieros pueden realizar cálculos precisos desde cualquier dispositivo, con resultados validados según los mismos estándares utilizados en todo el mundo.",
    ],
    howTitle: "Cómo usan estas herramientas los ingenieros",
    howParagraphs: [
        "Los ingenieros profesionales integran las calculadoras en línea en múltiples etapas de su flujo de diseño. Durante el diseño conceptual, un dimensionamiento rápido permite determinar si el diámetro de un eje, la sección de una viga o la potencia de un motor se encuentran en el rango adecuado antes de modelar en CAD.",
        "En fabricación e ingeniería de campo, las calculadoras sirven como herramientas de referencia instantánea. Los estudiantes las usan para comprobar ejercicios y comprender cómo el cambio de una variable afecta a todo el sistema.",
    ],
    footerColumns: [{"title":"Mecánica","links":[{"href":"/bolt-torque","label":"Calculadora de par de apriete"},{"href":"/bearings","label":"Vida útil de rodamientos (ISO 281)"},{"href":"/gears","label":"Calculadora de relación de engranajes"},{"href":"/shafts","label":"Diámetro de eje"},{"href":"/hooke-law","label":"Constante de resorte"},{"href":"/motor-selection-std","label":"Potencia del motor"}]},{"title":"Estructural","links":[{"href":"/beam-deflection","label":"Deflexión de viga"},{"href":"/concrete-reinforcement","label":"Refuerzo de hormigón"},{"href":"/simulation-fea","label":"Análisis FEA"},{"href":"/topology-optimization","label":"Optimización topológica"},{"href":"/machine-assembly","label":"Montaje de máquinas"}]},{"title":"Fluidos y térmica","links":[{"href":"/fluid-dynamics","label":"Caída de presión"},{"href":"/thermal-expansion","label":"Transferencia de calor"},{"href":"/pumps","label":"Rendimiento de bombas"},{"href":"/reducer-lubrication","label":"Lubricación de reductores"},{"href":"/naval-hydrostatics","label":"Hidrostática naval"}]},{"title":"Eléctrica","links":[{"href":"/three-phase-power","label":"Calculadora de potencia"},{"href":"/ohms-law","label":"Ley de Ohm"},{"href":"/voltage-drop","label":"Caída de tensión"},{"href":"/3-phase-power","label":"Potencia trifásica"},{"href":"/filter-design","label":"Diseño de filtros"}]},{"title":"Ciencias","links":[{"href":"/physics-solver","label":"Solucionador CAS de física"},{"href":"/failure-prediction","label":"Predicción de fallos"},{"href":"/failure-diagnosis","label":"Diagnóstico de fallos"},{"href":"/biology-genetics","label":"Genética de poblaciones"},{"href":"/digital-logic","label":"Laboratorio de lógica digital"}]},{"title":"Plataforma","links":[{"href":"/academy?tab=calculators","label":"Todas las calculadoras"},{"href":"/workspace","label":"Abrir workspace"},{"href":"/academy","label":"Academia de ingeniería"},{"href":"/","label":"Inicio"}]}],
    copyright: "© 2026 AluCalc Advanced Engineering Systems",
};

const FR: HomeFooterStrings = {
    whatTitle: "Que sont les calculateurs d'ingénierie ?",
    whatParagraphs: [
        "Les calculateurs d'ingénierie sont des outils spécialisés qui résolvent les équations techniques utilisées en génie mécanique, structural, électrique et thermique. Contrairement aux calculatrices générales, ils implémentent des formules validées selon des normes internationales telles que l'ISO 281, la VDI 2230, l'ASME PCC-1 et la théorie des poutres Euler-Bernoulli.",
        "Les ingénieurs conception, projet, fabrication et les étudiants les utilisent quotidiennement pour vérifier des calculs manuels, effectuer des pré-dimensionnements et valider des résultats de simulation.",
        "Les calculateurs d'ingénierie modernes basés sur le navigateur, comme AluCalc OS, éliminent les licences de bureau coûteuses. Les ingénieurs peuvent réaliser des calculs précis depuis n'importe quel appareil, avec des résultats validés selon les mêmes normes utilisées dans le monde entier.",
    ],
    howTitle: "Comment les ingénieurs utilisent ces outils",
    howParagraphs: [
        "Les ingénieurs professionnels intègrent les calculateurs en ligne à plusieurs étapes de leur processus de conception. Lors de la phase conceptuelle, un dimensionnement rapide permet de vérifier si le diamètre d'un arbre, la section d'une poutre ou la puissance d'un moteur se situent dans la bonne fourchette avant la modélisation CAO détaillée.",
        "En fabrication et en ingénierie de terrain, les calculateurs servent d'outils de référence instantanés. Les étudiants s'en servent pour vérifier leurs exercices et comprendre comment la modification d'une variable affecte l'ensemble du système.",
    ],
    footerColumns: [{"title":"Mécanique","links":[{"href":"/bolt-torque","label":"Calculateur de couple de serrage"},{"href":"/bearings","label":"Durée de vie des roulements (ISO 281)"},{"href":"/gears","label":"Calculateur de rapport d’engrenage"},{"href":"/shafts","label":"Diamètre d’arbre"},{"href":"/hooke-law","label":"Constante de ressort"},{"href":"/motor-selection-std","label":"Puissance moteur"}]},{"title":"Structure","links":[{"href":"/beam-deflection","label":"Flèche de poutre"},{"href":"/concrete-reinforcement","label":"Armature béton"},{"href":"/simulation-fea","label":"Analyse FEA"},{"href":"/topology-optimization","label":"Optimisation topologique"},{"href":"/machine-assembly","label":"Assemblage machine"}]},{"title":"Fluides et thermique","links":[{"href":"/fluid-dynamics","label":"Perte de charge"},{"href":"/thermal-expansion","label":"Transfert thermique"},{"href":"/pumps","label":"Performance des pompes"},{"href":"/reducer-lubrication","label":"Lubrification réducteur"},{"href":"/naval-hydrostatics","label":"Hydrostatique navale"}]},{"title":"Électrique","links":[{"href":"/three-phase-power","label":"Calculateur de puissance"},{"href":"/ohms-law","label":"Loi d’Ohm"},{"href":"/voltage-drop","label":"Chute de tension"},{"href":"/3-phase-power","label":"Puissance triphasée"},{"href":"/filter-design","label":"Conception de filtres"}]},{"title":"Sciences","links":[{"href":"/physics-solver","label":"Solveur CAS de physique"},{"href":"/failure-prediction","label":"Prédiction de défaillance"},{"href":"/failure-diagnosis","label":"Diagnostic de défaillance"},{"href":"/biology-genetics","label":"Génétique des populations"},{"href":"/digital-logic","label":"Laboratoire de logique numérique"}]},{"title":"Plateforme","links":[{"href":"/academy?tab=calculators","label":"Tous les calculateurs"},{"href":"/workspace","label":"Ouvrir le workspace"},{"href":"/academy","label":"Académie d’ingénierie"},{"href":"/","label":"Accueil"}]}],
    copyright: "© 2026 AluCalc Advanced Engineering Systems",
};

const IT: HomeFooterStrings = {
    whatTitle: "Cosa sono i calcolatori ingegneristici?",
    whatParagraphs: [
        "I calcolatori ingegneristici sono strumenti specializzati che risolvono equazioni tecniche utilizzate nell’ingegneria meccanica, strutturale, elettrica e termica. A differenza delle calcolatrici generiche, implementano formule validate secondo standard internazionali come ISO 281, VDI 2230, ASME PCC-1 e la teoria delle travi Euler-Bernoulli.",
        "Ingegneri di progettazione, di commessa, di produzione e studenti li usano ogni giorno per verificare calcoli manuali, eseguire dimensionamenti preliminari e validare i risultati delle simulazioni.",
        "I moderni calcolatori ingegneristici basati su browser, come AluCalc OS, eliminano le costose licenze desktop. Gli ingegneri possono eseguire calcoli accurati da qualsiasi dispositivo, con risultati validati secondo gli stessi standard utilizzati in tutto il mondo.",
    ],
    howTitle: "Come gli ingegneri usano questi strumenti",
    howParagraphs: [
        "Gli ingegneri professionisti integrano i calcolatori online in diverse fasi del flusso di progettazione. Durante la fase concettuale, un dimensionamento rapido consente di verificare se il diametro di un albero, la sezione di una trave o la potenza di un motore rientrano nell’intervallo corretto prima della modellazione CAD dettagliata.",
        "In produzione e ingegneria di campo, i calcolatori fungono da strumenti di riferimento immediati. Gli studenti li usano per controllare gli esercizi e capire come la modifica di una variabile influisce sull’intero sistema.",
    ],
    footerColumns: [{"title":"Meccanica","links":[{"href":"/bolt-torque","label":"Calcolatore coppia di serraggio"},{"href":"/bearings","label":"Vita cuscinetti (ISO 281)"},{"href":"/gears","label":"Calcolatore rapporto ingranaggi"},{"href":"/shafts","label":"Diametro albero"},{"href":"/hooke-law","label":"Costante elastica"},{"href":"/motor-selection-std","label":"Potenza motore"}]},{"title":"Strutturale","links":[{"href":"/beam-deflection","label":"Freccia trave"},{"href":"/concrete-reinforcement","label":"Armatura calcestruzzo"},{"href":"/simulation-fea","label":"Analisi FEA"},{"href":"/topology-optimization","label":"Ottimizzazione topologica"},{"href":"/machine-assembly","label":"Assemblaggio macchina"}]},{"title":"Fluidi e termica","links":[{"href":"/fluid-dynamics","label":"Caduta di pressione"},{"href":"/thermal-expansion","label":"Trasferimento termico"},{"href":"/pumps","label":"Prestazioni pompa"},{"href":"/reducer-lubrication","label":"Lubrificazione riduttore"},{"href":"/naval-hydrostatics","label":"Idrostatica navale"}]},{"title":"Elettrica","links":[{"href":"/three-phase-power","label":"Calcolatore di potenza"},{"href":"/ohms-law","label":"Legge di Ohm"},{"href":"/voltage-drop","label":"Caduta di tensione"},{"href":"/3-phase-power","label":"Potenza trifase"},{"href":"/filter-design","label":"Progettazione filtri"}]},{"title":"Scienze","links":[{"href":"/physics-solver","label":"Solver CAS di fisica"},{"href":"/failure-prediction","label":"Previsione guasti"},{"href":"/failure-diagnosis","label":"Diagnosi guasti"},{"href":"/biology-genetics","label":"Genetica delle popolazioni"},{"href":"/digital-logic","label":"Laboratorio logica digitale"}]},{"title":"Piattaforma","links":[{"href":"/academy?tab=calculators","label":"Tutti i calcolatori"},{"href":"/workspace","label":"Apri workspace"},{"href":"/academy","label":"Accademia ingegneristica"},{"href":"/","label":"Home"}]}],
    copyright: "© 2026 AluCalc Advanced Engineering Systems",
};

const PT: HomeFooterStrings = {
    whatTitle: "O que são calculadoras de engenharia?",
    whatParagraphs: [
        "As calculadoras de engenharia são ferramentas especializadas que resolvem equações técnicas utilizadas na engenharia mecânica, estrutural, elétrica e térmica. Ao contrário das calculadoras de uso geral, implementam fórmulas validadas segundo normas internacionais como ISO 281, VDI 2230, ASME PCC-1 e a teoria das vigas Euler-Bernoulli.",
        "Engenheiros de projeto, de design, de fabrico e estudantes utilizam-nas diariamente para verificar cálculos manuais, realizar dimensionamentos preliminares e validar resultados de simulação.",
        "Calculadoras de engenharia modernas baseadas no navegador, como o AluCalc OS, eliminam licenças de desktop dispendiosas. Os engenheiros podem realizar cálculos precisos a partir de qualquer dispositivo, com resultados validados segundo os mesmos padrões utilizados em todo o mundo.",
    ],
    howTitle: "Como os engenheiros usam estas ferramentas",
    howParagraphs: [
        "Os engenheiros profissionais integram calculadoras online em várias fases do fluxo de projeto. Durante o design conceptual, um dimensionamento rápido permite verificar se o diâmetro de um eixo, a secção de uma viga ou a potência de um motor estão na faixa correta antes da modelação CAD detalhada.",
        "Na fabricação e na engenharia de campo, as calculadoras servem como ferramentas de referência instantânea. Os estudantes usam-nas para verificar exercícios e compreender como a alteração de uma variável afeta todo o sistema.",
    ],
    footerColumns: [{"title":"Mecânica","links":[{"href":"/bolt-torque","label":"Calculadora de torque de aperto"},{"href":"/bearings","label":"Vida útil de rolamentos (ISO 281)"},{"href":"/gears","label":"Calculadora de relação de engrenagens"},{"href":"/shafts","label":"Diâmetro do eixo"},{"href":"/hooke-law","label":"Constante da mola"},{"href":"/motor-selection-std","label":"Potência do motor"}]},{"title":"Estrutural","links":[{"href":"/beam-deflection","label":"Deflexão de viga"},{"href":"/concrete-reinforcement","label":"Armadura de betão"},{"href":"/simulation-fea","label":"Análise FEA"},{"href":"/topology-optimization","label":"Otimização topológica"},{"href":"/machine-assembly","label":"Montagem de máquinas"}]},{"title":"Fluidos e térmica","links":[{"href":"/fluid-dynamics","label":"Queda de pressão"},{"href":"/thermal-expansion","label":"Transferência de calor"},{"href":"/pumps","label":"Desempenho da bomba"},{"href":"/reducer-lubrication","label":"Lubrificação de redutores"},{"href":"/naval-hydrostatics","label":"Hidrostática naval"}]},{"title":"Elétrica","links":[{"href":"/three-phase-power","label":"Calculadora de potência"},{"href":"/ohms-law","label":"Lei de Ohm"},{"href":"/voltage-drop","label":"Queda de tensão"},{"href":"/3-phase-power","label":"Potência trifásica"},{"href":"/filter-design","label":"Projeto de filtros"}]},{"title":"Ciências","links":[{"href":"/physics-solver","label":"Solucionador CAS de física"},{"href":"/failure-prediction","label":"Previsão de falhas"},{"href":"/failure-diagnosis","label":"Diagnóstico de falhas"},{"href":"/biology-genetics","label":"Genética de populações"},{"href":"/digital-logic","label":"Laboratório de lógica digital"}]},{"title":"Plataforma","links":[{"href":"/academy?tab=calculators","label":"Todas as calculadoras"},{"href":"/workspace","label":"Abrir workspace"},{"href":"/academy","label":"Academia de engenharia"},{"href":"/","label":"Início"}]}],
    copyright: "© 2026 AluCalc Advanced Engineering Systems",
};

const RU: HomeFooterStrings = {
    whatTitle: "Что такое инженерные калькуляторы?",
    whatParagraphs: [
        "Инженерные калькуляторы — это специализированные инструменты для решения технических уравнений в машиностроении, строительной, электрической и теплотехнике. В отличие от обычных калькуляторов они реализуют проверенные формулы международных стандартов, таких как ISO 281, VDI 2230, ASME PCC-1 и теория балок Эйлера-Бернулли.",
        "Конструкторы, проектировщики, производственные инженеры и студенты ежедневно используют их для проверки ручных расчётов, предварительного подбора размеров и валидации результатов моделирования.",
        "Современные браузерные инженерные калькуляторы, такие как AluCalc OS, избавляют от дорогих настольных лицензий. Инженеры могут выполнять точные расчёты с любого устройства, получая результаты, проверенные по тем же стандартам, что используются по всему миру.",
    ],
    howTitle: "Как инженеры используют эти инструменты",
    howParagraphs: [
        "Профессиональные инженеры включают онлайн-калькуляторы в различные этапы проектного процесса. На этапе концептуального проектирования быстрый подбор размеров позволяет определить, находится ли диаметр вала, сечение балки или мощность двигателя в нужном диапазоне до детального CAD-моделирования.",
        "В производстве и на выезде калькуляторы служат мгновенными справочными инструментами. Студенты используют их для проверки домашних заданий и понимания того, как изменение одной переменной влияет на всю систему.",
    ],
    footerColumns: [{"title":"Механика","links":[{"href":"/bolt-torque","label":"Калькулятор момента затяжки"},{"href":"/bearings","label":"Ресурс подшипника (ISO 281)"},{"href":"/gears","label":"Передаточное отношение шестерён"},{"href":"/shafts","label":"Диаметр вала"},{"href":"/hooke-law","label":"Жёсткость пружины"},{"href":"/motor-selection-std","label":"Мощность двигателя"}]},{"title":"Строительная","links":[{"href":"/beam-deflection","label":"Прогиб балки"},{"href":"/concrete-reinforcement","label":"Армирование бетона"},{"href":"/simulation-fea","label":"Анализ МКЭ"},{"href":"/topology-optimization","label":"Топологическая оптимизация"},{"href":"/machine-assembly","label":"Сборка машин"}]},{"title":"Гидравлика и тепло","links":[{"href":"/fluid-dynamics","label":"Падение давления"},{"href":"/thermal-expansion","label":"Теплопередача"},{"href":"/pumps","label":"Характеристики насоса"},{"href":"/reducer-lubrication","label":"Смазка редуктора"},{"href":"/naval-hydrostatics","label":"Судовая гидростатика"}]},{"title":"Электрика","links":[{"href":"/three-phase-power","label":"Калькулятор мощности"},{"href":"/ohms-law","label":"Закон Ома"},{"href":"/voltage-drop","label":"Падение напряжения"},{"href":"/3-phase-power","label":"Трёхфазная мощность"},{"href":"/filter-design","label":"Проектирование фильтров"}]},{"title":"Наука","links":[{"href":"/physics-solver","label":"Физический CAS-решатель"},{"href":"/failure-prediction","label":"Прогноз отказов"},{"href":"/failure-diagnosis","label":"Диагностика отказов"},{"href":"/biology-genetics","label":"Популяционная генетика"},{"href":"/digital-logic","label":"Лаборатория цифровой логики"}]},{"title":"Платформа","links":[{"href":"/academy?tab=calculators","label":"Все калькуляторы"},{"href":"/workspace","label":"Открыть workspace"},{"href":"/academy","label":"Инженерная академия"},{"href":"/","label":"Главная"}]}],
    copyright: "© 2026 AluCalc Advanced Engineering Systems",
};

const JA: HomeFooterStrings = {
    whatTitle: "工学計算機とは？",
    whatParagraphs: [
        "工学計算機は、機械、構造、電気、熱工学で使用される技術的な方程式を解く専門ツールです。一般的な電子計算機と異なり、ISO 281、VDI 2230、ASME PCC-1、オイラー・ベルヌーリの梁理論などの国際規格に基づく検証済みの式を実装しています。",
        "設計エンジニア、プロジェクトエンジニア、生産技術者、学生は手計算の検証、事前サイジング、シミュレーション結果の検証に毎日利用しています。",
        "AluCalc OSのような現代的なブラウザベースの工学計算機は、高額なデスクトップライセンスを不要にします。エンジニアはいつでもどこから精密な計算を行え、世界中で使用される同じ規格に基づいて検証された結果を得られます。",
    ],
    howTitle: "エンジニアはこのツールをどう使うか",
    howParagraphs: [
        "プロのエンジニアは、設計ワークフローの複数の階段でオンライン計算機を組み込みます。概念設計の階段では、軸径、梁断面、モータ定格が適切な範囲にあるかを、詳細なCADモデリングの前に快速サイジングで確認できます。",
        "製造や現場工学では、計算機は即座の参照ツールとして機能します。学生は宿題の確認や、変数を変えるとシステム全体にどう影響するかの理解を深めるために使います。",
    ],
    footerColumns: [{"title":"機械","links":[{"href":"/bolt-torque","label":"ボルトトルク計算機"},{"href":"/bearings","label":"軸受寿命（ISO 281）"},{"href":"/gears","label":"歯車比計算機"},{"href":"/shafts","label":"軸径"},{"href":"/hooke-law","label":"バネ定数"},{"href":"/motor-selection-std","label":"モータ出力"}]},{"title":"構造","links":[{"href":"/beam-deflection","label":"梁たわみ"},{"href":"/concrete-reinforcement","label":"鉄筋コンクリート"},{"href":"/simulation-fea","label":"FEA解析"},{"href":"/topology-optimization","label":"トポロジー最適化"},{"href":"/machine-assembly","label":"機械組立"}]},{"title":"流体・熱","links":[{"href":"/fluid-dynamics","label":"圧力損失"},{"href":"/thermal-expansion","label":"熱伝遞"},{"href":"/pumps","label":"ポンプ性能"},{"href":"/reducer-lubrication","label":"減速機潤滑"},{"href":"/naval-hydrostatics","label":"船舶静水力学"}]},{"title":"電気","links":[{"href":"/three-phase-power","label":"電力計算機"},{"href":"/ohms-law","label":"オームの法則"},{"href":"/voltage-drop","label":"電圧降下"},{"href":"/3-phase-power","label":"三相電力"},{"href":"/filter-design","label":"フィルタ設計"}]},{"title":"科学","links":[{"href":"/physics-solver","label":"物理CASソルバー"},{"href":"/failure-prediction","label":"故障予測"},{"href":"/failure-diagnosis","label":"故障診断"},{"href":"/biology-genetics","label":"群体遺伝学"},{"href":"/digital-logic","label":"デジタル逻輯ラボ"}]},{"title":"プラットフォーム","links":[{"href":"/academy?tab=calculators","label":"すべての計算機"},{"href":"/workspace","label":"Workspaceを開く"},{"href":"/academy","label":"工学アカデミー"},{"href":"/","label":"ホーム"}]}],
    copyright: "© 2026 AluCalc Advanced Engineering Systems",
};

const ZH: HomeFooterStrings = {
    whatTitle: "什么是工程计算器？",
    whatParagraphs: [
        "工程计算器是专门用于解决机械、结构、电气和热工程领域技术方程的专业工具。与通用计算器不同，它们实现了经国际标准（如 ISO 281、VDI 2230、ASME PCC-1 和欧拉-伯努利梁理论）验证的公式。",
        "设计工程师、项目工程师、制造工程师和学生每天都使用这些工具来验证手算结果、进行预设计尺寸并验证仿真结果。",
        "像 AluCalc OS 这样的现代浏览器工程计算器可免除昂贵的桌面软件许可费用。工程师可从任何设备进行精确计算，结果按全球通用的同一标准验证。",
    ],
    howTitle: "工程师如何使用这些工具",
    howParagraphs: [
        "专业工程师在设计流程的多个阶段集成在线计算器。在概念设计阶段，快速尺寸可判断轴径、梁截面或电机功率是否在合理范围内，然后再进行详细 CAD 建模。",
        "在制造和现场工程中，计算器是即时参考工具。学生用于检查作业解答，并理解变量改变如何影响整个系统。",
    ],
    footerColumns: [{"title":"机械","links":[{"href":"/bolt-torque","label":"螺栓扭矩计算器"},{"href":"/bearings","label":"轴承寿命（ISO 281）"},{"href":"/gears","label":"齿轮比计算器"},{"href":"/shafts","label":"轴径"},{"href":"/hooke-law","label":"弹簧常数"},{"href":"/motor-selection-std","label":"电机功率"}]},{"title":"结构","links":[{"href":"/beam-deflection","label":"梁挫度"},{"href":"/concrete-reinforcement","label":"混凝土配筋"},{"href":"/simulation-fea","label":"FEA 分析"},{"href":"/topology-optimization","label":"拓扑优化"},{"href":"/machine-assembly","label":"机械装配"}]},{"title":"流体与热工","links":[{"href":"/fluid-dynamics","label":"压力降"},{"href":"/thermal-expansion","label":"热传递"},{"href":"/pumps","label":"泵性能"},{"href":"/reducer-lubrication","label":"减速箱润滑"},{"href":"/naval-hydrostatics","label":"船舶静水力学"}]},{"title":"电气","links":[{"href":"/three-phase-power","label":"功率计算器"},{"href":"/ohms-law","label":"欧姆定律"},{"href":"/voltage-drop","label":"电压降"},{"href":"/3-phase-power","label":"三相功率"},{"href":"/filter-design","label":"滤波器设计"}]},{"title":"科学","links":[{"href":"/physics-solver","label":"物理 CAS 求解器"},{"href":"/failure-prediction","label":"故障预测"},{"href":"/failure-diagnosis","label":"故障诊断"},{"href":"/biology-genetics","label":"群体遗传学"},{"href":"/digital-logic","label":"数字逻辑实验室"}]},{"title":"平台","links":[{"href":"/academy?tab=calculators","label":"全部计算器"},{"href":"/workspace","label":"打开工作区"},{"href":"/academy","label":"工程学院"},{"href":"/","label":"首页"}]}],
    copyright: "© 2026 AluCalc Advanced Engineering Systems",
};

const KO: HomeFooterStrings = {
    whatTitle: "공학 계산기란?",
    whatParagraphs: [
        "공학 계산기는 기계, 구조, 전기, 열 공학에서 사용되는 기술 방정식을 풀는 전문 도구입니다. 일반 계산기와 달리 ISO 281, VDI 2230, ASME PCC-1, 오일러-베르누리 보 이론 등 국제 표준에 기반한 검증된 공식을 구현합니다.",
        "설계 엔지니어, 프로젝트 엔지니어, 생산 엔지니어, 학생들은 수계산 검증, 사전 치수 선정, 시뮬레이션 결과 검증을 위해 매일 이를 사용합니다.",
        "AluCalc OS와 같은 최신 브라우저 기반 공학 계산기는 비싼 데스크톱 라이선스가 필요 없습니다. 엔지니어는 어떤 기기에서든 전 세계적으로 사용되는 동일한 표준으로 검증된 결과를 얻을 수 있습니다.",
    ],
    howTitle: "엔지니어가 이 도구를 사용하는 방법",
    howParagraphs: [
        "전문 엔지니어는 설계 워크플로의 여러 단계에 온라인 계산기를 통합합니다. 개념 설계 단계에서 빠른 치수 선정으로 샤프트 직경, 보 단면, 모터 정격이 적절한 범위에 있는지 확인할 수 있습니다.",
        "제조 및 현장 공학에서 계산기는 즉시 참고 도구로 사용됩니다. 학생들은 숙제 풀이를 확인하고 변수 하나가 전체 시스템에 미치는 영향을 이해합니다.",
    ],
    footerColumns: [{"title":"기계","links":[{"href":"/bolt-torque","label":"볼트 토크 계산기"},{"href":"/bearings","label":"볪ring 수명 (ISO 281)"},{"href":"/gears","label":"기어 비 계산기"},{"href":"/shafts","label":"샤프트 직경"},{"href":"/hooke-law","label":"스프링 상수"},{"href":"/motor-selection-std","label":"모터 출력"}]},{"title":"구조","links":[{"href":"/beam-deflection","label":"보 척오"},{"href":"/concrete-reinforcement","label":"간짜 배근"},{"href":"/simulation-fea","label":"FEA 분석"},{"href":"/topology-optimization","label":"토폴로지 최적화"},{"href":"/machine-assembly","label":"기계 조립"}]},{"title":"유체 및 열","links":[{"href":"/fluid-dynamics","label":"압력 감소"},{"href":"/thermal-expansion","label":"열전달"},{"href":"/pumps","label":"펌프 성능"},{"href":"/reducer-lubrication","label":"감속기 각진"},{"href":"/naval-hydrostatics","label":"선박 정수력학"}]},{"title":"전기","links":[{"href":"/three-phase-power","label":"전력 계산기"},{"href":"/ohms-law","label":"오즘의 법칙"},{"href":"/voltage-drop","label":"전압 감소"},{"href":"/3-phase-power","label":"3상 전력"},{"href":"/filter-design","label":"필터 설계"}]},{"title":"과학","links":[{"href":"/physics-solver","label":"물리 CAS 솔버"},{"href":"/failure-prediction","label":"고장 예측"},{"href":"/failure-diagnosis","label":"고장 진단"},{"href":"/biology-genetics","label":"군집 유전학"},{"href":"/digital-logic","label":"디지털 로직 랩"}]},{"title":"플랫폼","links":[{"href":"/academy?tab=calculators","label":"모든 계산기"},{"href":"/workspace","label":"Workspace 열기"},{"href":"/academy","label":"공학 아카데미"},{"href":"/","label":"홈"}]}],
    copyright: "© 2026 AluCalc Advanced Engineering Systems",
};

const AR: HomeFooterStrings = {
    whatTitle: "ما هي حاسبات الهندسة؟",
    whatParagraphs: [
        "حاسبات الهندسة أدوات متخصصة تحل المعادلات التقنية المستخدمة في الهندسة الميكانيكية والإنشائية والكهربائية والحرارية. وبخلاف عن الحاسبات العامة، تنفّذ معادلات مدققة من معايير دولية مثل ISO 281 وVDI 2230 وASME PCC-1 ونظرية عرد إيلر-برنولي.",
        "يستخدم مهندسو التصميم والمشاريع والتصنيع والطلاب هذه الأدوات يوميًا للتحقق من الحسابات اليدوية وإجراء تقديرات أولية والتحقق من نتائج المحاكاة.",
        "تعفي حاسبات الهندسة الحديثة عبر المتصفح، مثل AluCalc OS، من الحاجة إلى تراخيص المكتب المكلفة. يمكن للمهندسين إجراء حسابات دقيقة من أي جهاز، مع نتائج مدققة بنفس المعايير المستخدمة عالميًا.",
    ],
    howTitle: "كيف يستخدم المهندسون هذه الأدوات",
    howParagraphs: [
        "يدمج المهندسون المحترفون الحاسبات عبر الإنترنت في مراحل متعددة من سير التصميم. في التصميم المفاهيمي، يساعد التقدير السريع على تحديد ما إذا كان قطر العمود أو قطعة العارضة أو قدرة المحرك ضمن النطاق المناسب قبل النمذج التفصيلي بالـCAD.",
        "في التصنيع والهندسة الميدانية، تعمل الحاسبات كأدوات مرجع فورية. يستخدمها الطلاب للتحقق من حلول الواجبات وفهم كيفية تأثير تغيير متغير واحد على النظام بأسره.",
    ],
    footerColumns: [{"title":"ميكانيكا","links":[{"href":"/bolt-torque","label":"حاسبة عزم البراغي"},{"href":"/bearings","label":"عمر المحمل (ISO 281)"},{"href":"/gears","label":"حاسبة نسبة الترس"},{"href":"/shafts","label":"قطر العمود"},{"href":"/hooke-law","label":"ثابت الزنبر"},{"href":"/motor-selection-std","label":"قدرة المحرك"}]},{"title":"إنشائي","links":[{"href":"/beam-deflection","label":"انحناء العارضة"},{"href":"/concrete-reinforcement","label":"تسليح الخرسانة"},{"href":"/simulation-fea","label":"تحليل FEA"},{"href":"/topology-optimization","label":"تحسين التوپولوجيا"},{"href":"/machine-assembly","label":"تركيب الآلات"}]},{"title":"السوائل والحرارية","links":[{"href":"/fluid-dynamics","label":"انخفاض الضغط"},{"href":"/thermal-expansion","label":"نقل الحرارة"},{"href":"/pumps","label":"أداء المضخة"},{"href":"/reducer-lubrication","label":"تزييت صندوق الترس"},{"href":"/naval-hydrostatics","label":"الهيدروستاتيكا البحرية"}]},{"title":"كهربائي","links":[{"href":"/three-phase-power","label":"حاسبة القدرة"},{"href":"/ohms-law","label":"قانون أوم"},{"href":"/voltage-drop","label":"انخفاض الجهد"},{"href":"/3-phase-power","label":"القدرة ثلاثية الأطوال"},{"href":"/filter-design","label":"تصميم المرشحات"}]},{"title":"علوم","links":[{"href":"/physics-solver","label":"حالل فيزياء CAS"},{"href":"/failure-prediction","label":"توقع العطل"},{"href":"/failure-diagnosis","label":"تشخيص العطل"},{"href":"/biology-genetics","label":"علم الجينيات السكاني"},{"href":"/digital-logic","label":"مختبر المنطق الرقمي"}]},{"title":"المنصة","links":[{"href":"/academy?tab=calculators","label":"جميع الحاسبات"},{"href":"/workspace","label":"فتح مساح العمل"},{"href":"/academy","label":"أكاديمية الهندسة"},{"href":"/","label":"الرئيسية"}]}],
    copyright: "© 2026 AluCalc Advanced Engineering Systems",
};

const MAP: Record<Language, HomeFooterStrings> = {
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

export function getHomeFooterStrings(locale: string): HomeFooterStrings {
  return MAP[locale as Language] ?? EN;
}
