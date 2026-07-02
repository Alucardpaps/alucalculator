/** Home page footer SEO block — 10 locales */
export const HOME_FOOTER = {
  de: {
    whatTitle: 'Was sind Ingenieurrechner?',
    whatParagraphs: [
      'Ingenieurrechner sind spezialisierte Werkzeuge, die technische Gleichungen aus dem Maschinen-, Bau-, Elektro- und Thermoingenieurwesen lösen. Im Gegensatz zu allgemeinen Taschenrechnern setzen sie validierte Formeln internationaler Normen wie ISO 281, VDI 2230, ASME PCC-1 und die Euler-Bernoulli-Balkentheorie um.',
      'Konstruktionsingenieure, Projektingenieure, Fertigungsingenieure und Studierende nutzen diese Werkzeuge täglich, um Handrechnungen zu überprüfen, Vorabdimensionierungen durchzuführen und Simulationsergebnisse zu validieren.',
      'Moderne browserbasierte Ingenieurrechner wie AluCalc OS machen teure Desktop-Lizenzen überflüssig. Ingenieure können von jedem Gerät aus präzise Berechnungen durchführen – mit Ergebnissen, die anhand derselben weltweit anerkannten Normen validiert werden.',
    ],
    howTitle: 'Wie Ingenieure diese Werkzeuge nutzen',
    howParagraphs: [
      'Berufliche Ingenieure integrieren Online-Rechner in mehrere Phasen ihres Konstruktionsworkflows. In der Konzeptphase liefert eine schnelle Dimensionierung erste Hinweise, ob Wellendurchmesser, Balkenquerschnitt oder Motorleistung im richtigen Bereich liegen, bevor detaillierte CAD-Modelle erstellt werden.',
      'In Fertigung und Außendienst dienen Rechner als sofort verfügbare Referenzwerkzeuge. Studierende prüfen damit Hausaufgabenlösungen und entwickeln ein Gefühl dafür, wie sich die Änderung einer Größe auf das gesamte System auswirkt.',
    ],
    footerColumns: [
      {
        title: 'Mechanik',
        links: [
          { href: '/bolt-torque', label: 'Schraubenanzugsmoment-Rechner' },
          { href: '/bearings', label: 'Lagerlebensdauer (ISO 281)' },
          { href: '/gears', label: 'Übersetzungsrechner' },
          { href: '/shafts', label: 'Wellendurchmesser' },
          { href: '/hooke-law', label: 'Federkonstante' },
          { href: '/motor-selection-std', label: 'Motorleistung' },
        ],
      },
      {
        title: 'Statik',
        links: [
          { href: '/beam-deflection', label: 'Balkendurchbiegung' },
          { href: '/concrete-reinforcement', label: 'Betonbewehrung' },
          { href: '/simulation-fea', label: 'FEA-Analyse' },
          { href: '/topology-optimization', label: 'Topologieoptimierung' },
          { href: '/machine-assembly', label: 'Maschinenmontage' },
        ],
      },
      {
        title: 'Strömung und Thermik',
        links: [
          { href: '/fluid-dynamics', label: 'Druckverlust' },
          { href: '/thermal-expansion', label: 'Wärmeübertragung' },
          { href: '/pumps', label: 'Pumpenleistung' },
          { href: '/reducer-lubrication', label: 'Getriebeschmierung' },
          { href: '/naval-hydrostatics', label: 'Schiffshydrostatik' },
        ],
      },
      {
        title: 'Elektrotechnik',
        links: [
          { href: '/three-phase-power', label: 'Leistungsrechner' },
          { href: '/ohms-law', label: 'Ohmsches Gesetz' },
          { href: '/voltage-drop', label: 'Spannungsabfall' },
          { href: '/3-phase-power', label: 'Drehstromleistung' },
          { href: '/filter-design', label: 'Filterauslegung' },
        ],
      },
      {
        title: 'Naturwissenschaften',
        links: [
          { href: '/physics-solver', label: 'Physik-CAS-Löser' },
          { href: '/failure-prediction', label: 'Ausfallvorhersage' },
          { href: '/failure-diagnosis', label: 'Ausfalldiagnose' },
          { href: '/biology-genetics', label: 'Populationsgenetik' },
          { href: '/digital-logic', label: 'Digitale Logik-Labor' },
        ],
      },
      {
        title: 'Plattform',
        links: [
          { href: '/academy?tab=calculators', label: 'Alle Rechner' },
          { href: '/workspace', label: 'Workspace öffnen' },
          { href: '/academy', label: 'Ingenieur-Akademie' },
          { href: '/', label: 'Startseite' },
        ],
      },
    ],
    copyright: '\u00a9 2026 AluCalc Advanced Engineering Systems',
  },

  es: {
    whatTitle: '\u00bfQu\u00e9 son las calculadoras de ingenier\u00eda?',
    whatParagraphs: [
      'Las calculadoras de ingenier\u00eda son herramientas especializadas que resuelven ecuaciones t\u00e9cnicas utilizadas en ingenier\u00eda mec\u00e1nica, estructural, el\u00e9ctrica y t\u00e9rmica. A diferencia de las calculadoras de uso general, implementan f\u00f3rmulas validadas seg\u00fan normas internacionales como ISO 281, VDI 2230, ASME PCC-1 y la teor\u00eda de vigas Euler-Bernoulli.',
      'Ingenieros de dise\u00f1o, de proyecto, de fabricaci\u00f3n y estudiantes las utilizan a diario para verificar c\u00e1lculos manuales, realizar dimensionamientos preliminares y validar resultados de simulaci\u00f3n.',
      'Las calculadoras de ingenier\u00eda modernas basadas en navegador, como AluCalc OS, eliminan las costosas licencias de escritorio. Los ingenieros pueden realizar c\u00e1lculos precisos desde cualquier dispositivo, con resultados validados seg\u00fan los mismos est\u00e1ndares utilizados en todo el mundo.',
    ],
    howTitle: 'C\u00f3mo usan estas herramientas los ingenieros',
    howParagraphs: [
      'Los ingenieros profesionales integran las calculadoras en l\u00ednea en m\u00faltiples etapas de su flujo de dise\u00f1o. Durante el dise\u00f1o conceptual, un dimensionamiento r\u00e1pido permite determinar si el di\u00e1metro de un eje, la secci\u00f3n de una viga o la potencia de un motor se encuentran en el rango adecuado antes de modelar en CAD.',
      'En fabricaci\u00f3n e ingenier\u00eda de campo, las calculadoras sirven como herramientas de referencia instant\u00e1nea. Los estudiantes las usan para comprobar ejercicios y comprender c\u00f3mo el cambio de una variable afecta a todo el sistema.',
    ],
    footerColumns: [
      {
        title: 'Mec\u00e1nica',
        links: [
          { href: '/bolt-torque', label: 'Calculadora de par de apriete' },
          { href: '/bearings', label: 'Vida \u00fatil de rodamientos (ISO 281)' },
          { href: '/gears', label: 'Calculadora de relaci\u00f3n de engranajes' },
          { href: '/shafts', label: 'Di\u00e1metro de eje' },
          { href: '/hooke-law', label: 'Constante de resorte' },
          { href: '/motor-selection-std', label: 'Potencia del motor' },
        ],
      },
      {
        title: 'Estructural',
        links: [
          { href: '/beam-deflection', label: 'Deflexi\u00f3n de viga' },
          { href: '/concrete-reinforcement', label: 'Refuerzo de hormig\u00f3n' },
          { href: '/simulation-fea', label: 'An\u00e1lisis FEA' },
          { href: '/topology-optimization', label: 'Optimizaci\u00f3n topol\u00f3gica' },
          { href: '/machine-assembly', label: 'Montaje de m\u00e1quinas' },
        ],
      },
      {
        title: 'Fluidos y t\u00e9rmica',
        links: [
          { href: '/fluid-dynamics', label: 'Ca\u00edda de presi\u00f3n' },
          { href: '/thermal-expansion', label: 'Transferencia de calor' },
          { href: '/pumps', label: 'Rendimiento de bombas' },
          { href: '/reducer-lubrication', label: 'Lubricaci\u00f3n de reductores' },
          { href: '/naval-hydrostatics', label: 'Hidrost\u00e1tica naval' },
        ],
      },
      {
        title: 'El\u00e9ctrica',
        links: [
          { href: '/three-phase-power', label: 'Calculadora de potencia' },
          { href: '/ohms-law', label: 'Ley de Ohm' },
          { href: '/voltage-drop', label: 'Ca\u00edda de tensi\u00f3n' },
          { href: '/3-phase-power', label: 'Potencia trif\u00e1sica' },
          { href: '/filter-design', label: 'Dise\u00f1o de filtros' },
        ],
      },
      {
        title: 'Ciencias',
        links: [
          { href: '/physics-solver', label: 'Solucionador CAS de f\u00edsica' },
          { href: '/failure-prediction', label: 'Predicci\u00f3n de fallos' },
          { href: '/failure-diagnosis', label: 'Diagn\u00f3stico de fallos' },
          { href: '/biology-genetics', label: 'Gen\u00e9tica de poblaciones' },
          { href: '/digital-logic', label: 'Laboratorio de l\u00f3gica digital' },
        ],
      },
      {
        title: 'Plataforma',
        links: [
          { href: '/academy?tab=calculators', label: 'Todas las calculadoras' },
          { href: '/workspace', label: 'Abrir workspace' },
          { href: '/academy', label: 'Academia de ingenier\u00eda' },
          { href: '/', label: 'Inicio' },
        ],
      },
    ],
    copyright: '\u00a9 2026 AluCalc Advanced Engineering Systems',
  },

  fr: {
    whatTitle: "Que sont les calculateurs d'ing\u00e9nierie ?",
    whatParagraphs: [
      "Les calculateurs d'ing\u00e9nierie sont des outils sp\u00e9cialis\u00e9s qui r\u00e9solvent les \u00e9quations techniques utilis\u00e9es en g\u00e9nie m\u00e9canique, structural, \u00e9lectrique et thermique. Contrairement aux calculatrices g\u00e9n\u00e9rales, ils impl\u00e9mentent des formules valid\u00e9es selon des normes internationales telles que l'ISO 281, la VDI 2230, l'ASME PCC-1 et la th\u00e9orie des poutres Euler-Bernoulli.",
      "Les ing\u00e9nieurs conception, projet, fabrication et les \u00e9tudiants les utilisent quotidiennement pour v\u00e9rifier des calculs manuels, effectuer des pr\u00e9-dimensionnements et valider des r\u00e9sultats de simulation.",
      "Les calculateurs d'ing\u00e9nierie modernes bas\u00e9s sur le navigateur, comme AluCalc OS, \u00e9liminent les licences de bureau co\u00fbteuses. Les ing\u00e9nieurs peuvent r\u00e9aliser des calculs pr\u00e9cis depuis n'importe quel appareil, avec des r\u00e9sultats valid\u00e9s selon les m\u00eames normes utilis\u00e9es dans le monde entier.",
    ],
    howTitle: 'Comment les ing\u00e9nieurs utilisent ces outils',
    howParagraphs: [
      "Les ing\u00e9nieurs professionnels int\u00e8grent les calculateurs en ligne \u00e0 plusieurs \u00e9tapes de leur processus de conception. Lors de la phase conceptuelle, un dimensionnement rapide permet de v\u00e9rifier si le diam\u00e8tre d'un arbre, la section d'une poutre ou la puissance d'un moteur se situent dans la bonne fourchette avant la mod\u00e9lisation CAO d\u00e9taill\u00e9e.",
      "En fabrication et en ing\u00e9nierie de terrain, les calculateurs servent d'outils de r\u00e9f\u00e9rence instantan\u00e9s. Les \u00e9tudiants s'en servent pour v\u00e9rifier leurs exercices et comprendre comment la modification d'une variable affecte l'ensemble du syst\u00e8me.",
    ],
    footerColumns: [
      {
        title: 'M\u00e9canique',
        links: [
          { href: '/bolt-torque', label: 'Calculateur de couple de serrage' },
          { href: '/bearings', label: 'Dur\u00e9e de vie des roulements (ISO 281)' },
          { href: '/gears', label: 'Calculateur de rapport d\u2019engrenage' },
          { href: '/shafts', label: 'Diam\u00e8tre d\u2019arbre' },
          { href: '/hooke-law', label: 'Constante de ressort' },
          { href: '/motor-selection-std', label: 'Puissance moteur' },
        ],
      },
      {
        title: 'Structure',
        links: [
          { href: '/beam-deflection', label: 'Fl\u00e8che de poutre' },
          { href: '/concrete-reinforcement', label: 'Armature b\u00e9ton' },
          { href: '/simulation-fea', label: 'Analyse FEA' },
          { href: '/topology-optimization', label: 'Optimisation topologique' },
          { href: '/machine-assembly', label: 'Assemblage machine' },
        ],
      },
      {
        title: 'Fluides et thermique',
        links: [
          { href: '/fluid-dynamics', label: 'Perte de charge' },
          { href: '/thermal-expansion', label: 'Transfert thermique' },
          { href: '/pumps', label: 'Performance des pompes' },
          { href: '/reducer-lubrication', label: 'Lubrification r\u00e9ducteur' },
          { href: '/naval-hydrostatics', label: 'Hydrostatique navale' },
        ],
      },
      {
        title: '\u00c9lectrique',
        links: [
          { href: '/three-phase-power', label: 'Calculateur de puissance' },
          { href: '/ohms-law', label: 'Loi d\u2019Ohm' },
          { href: '/voltage-drop', label: 'Chute de tension' },
          { href: '/3-phase-power', label: 'Puissance triphas\u00e9e' },
          { href: '/filter-design', label: 'Conception de filtres' },
        ],
      },
      {
        title: 'Sciences',
        links: [
          { href: '/physics-solver', label: 'Solveur CAS de physique' },
          { href: '/failure-prediction', label: 'Pr\u00e9diction de d\u00e9faillance' },
          { href: '/failure-diagnosis', label: 'Diagnostic de d\u00e9faillance' },
          { href: '/biology-genetics', label: 'G\u00e9n\u00e9tique des populations' },
          { href: '/digital-logic', label: 'Laboratoire de logique num\u00e9rique' },
        ],
      },
      {
        title: 'Plateforme',
        links: [
          { href: '/academy?tab=calculators', label: 'Tous les calculateurs' },
          { href: '/workspace', label: 'Ouvrir le workspace' },
          { href: '/academy', label: 'Acad\u00e9mie d\u2019ing\u00e9nierie' },
          { href: '/', label: 'Accueil' },
        ],
      },
    ],
    copyright: '\u00a9 2026 AluCalc Advanced Engineering Systems',
  },

  it: {
    whatTitle: 'Cosa sono i calcolatori ingegneristici?',
    whatParagraphs: [
      'I calcolatori ingegneristici sono strumenti specializzati che risolvono equazioni tecniche utilizzate nell\u2019ingegneria meccanica, strutturale, elettrica e termica. A differenza delle calcolatrici generiche, implementano formule validate secondo standard internazionali come ISO 281, VDI 2230, ASME PCC-1 e la teoria delle travi Euler-Bernoulli.',
      'Ingegneri di progettazione, di commessa, di produzione e studenti li usano ogni giorno per verificare calcoli manuali, eseguire dimensionamenti preliminari e validare i risultati delle simulazioni.',
      'I moderni calcolatori ingegneristici basati su browser, come AluCalc OS, eliminano le costose licenze desktop. Gli ingegneri possono eseguire calcoli accurati da qualsiasi dispositivo, con risultati validati secondo gli stessi standard utilizzati in tutto il mondo.',
    ],
    howTitle: 'Come gli ingegneri usano questi strumenti',
    howParagraphs: [
      'Gli ingegneri professionisti integrano i calcolatori online in diverse fasi del flusso di progettazione. Durante la fase concettuale, un dimensionamento rapido consente di verificare se il diametro di un albero, la sezione di una trave o la potenza di un motore rientrano nell\u2019intervallo corretto prima della modellazione CAD dettagliata.',
      'In produzione e ingegneria di campo, i calcolatori fungono da strumenti di riferimento immediati. Gli studenti li usano per controllare gli esercizi e capire come la modifica di una variabile influisce sull\u2019intero sistema.',
    ],
    footerColumns: [
      {
        title: 'Meccanica',
        links: [
          { href: '/bolt-torque', label: 'Calcolatore coppia di serraggio' },
          { href: '/bearings', label: 'Vita cuscinetti (ISO 281)' },
          { href: '/gears', label: 'Calcolatore rapporto ingranaggi' },
          { href: '/shafts', label: 'Diametro albero' },
          { href: '/hooke-law', label: 'Costante elastica' },
          { href: '/motor-selection-std', label: 'Potenza motore' },
        ],
      },
      {
        title: 'Strutturale',
        links: [
          { href: '/beam-deflection', label: 'Freccia trave' },
          { href: '/concrete-reinforcement', label: 'Armatura calcestruzzo' },
          { href: '/simulation-fea', label: 'Analisi FEA' },
          { href: '/topology-optimization', label: 'Ottimizzazione topologica' },
          { href: '/machine-assembly', label: 'Assemblaggio macchina' },
        ],
      },
      {
        title: 'Fluidi e termica',
        links: [
          { href: '/fluid-dynamics', label: 'Caduta di pressione' },
          { href: '/thermal-expansion', label: 'Trasferimento termico' },
          { href: '/pumps', label: 'Prestazioni pompa' },
          { href: '/reducer-lubrication', label: 'Lubrificazione riduttore' },
          { href: '/naval-hydrostatics', label: 'Idrostatica navale' },
        ],
      },
      {
        title: 'Elettrica',
        links: [
          { href: '/three-phase-power', label: 'Calcolatore di potenza' },
          { href: '/ohms-law', label: 'Legge di Ohm' },
          { href: '/voltage-drop', label: 'Caduta di tensione' },
          { href: '/3-phase-power', label: 'Potenza trifase' },
          { href: '/filter-design', label: 'Progettazione filtri' },
        ],
      },
      {
        title: 'Scienze',
        links: [
          { href: '/physics-solver', label: 'Solver CAS di fisica' },
          { href: '/failure-prediction', label: 'Previsione guasti' },
          { href: '/failure-diagnosis', label: 'Diagnosi guasti' },
          { href: '/biology-genetics', label: 'Genetica delle popolazioni' },
          { href: '/digital-logic', label: 'Laboratorio logica digitale' },
        ],
      },
      {
        title: 'Piattaforma',
        links: [
          { href: '/academy?tab=calculators', label: 'Tutti i calcolatori' },
          { href: '/workspace', label: 'Apri workspace' },
          { href: '/academy', label: 'Accademia ingegneristica' },
          { href: '/', label: 'Home' },
        ],
      },
    ],
    copyright: '\u00a9 2026 AluCalc Advanced Engineering Systems',
  },

  pt: {
    whatTitle: 'O que s\u00e3o calculadoras de engenharia?',
    whatParagraphs: [
      'As calculadoras de engenharia s\u00e3o ferramentas especializadas que resolvem equa\u00e7\u00f5es t\u00e9cnicas utilizadas na engenharia mec\u00e2nica, estrutural, el\u00e9trica e t\u00e9rmica. Ao contr\u00e1rio das calculadoras de uso geral, implementam f\u00f3rmulas validadas segundo normas internacionais como ISO 281, VDI 2230, ASME PCC-1 e a teoria das vigas Euler-Bernoulli.',
      'Engenheiros de projeto, de design, de fabrico e estudantes utilizam-nas diariamente para verificar c\u00e1lculos manuais, realizar dimensionamentos preliminares e validar resultados de simula\u00e7\u00e3o.',
      'Calculadoras de engenharia modernas baseadas no navegador, como o AluCalc OS, eliminam licen\u00e7as de desktop dispendiosas. Os engenheiros podem realizar c\u00e1lculos precisos a partir de qualquer dispositivo, com resultados validados segundo os mesmos padr\u00f5es utilizados em todo o mundo.',
    ],
    howTitle: 'Como os engenheiros usam estas ferramentas',
    howParagraphs: [
      'Os engenheiros profissionais integram calculadoras online em v\u00e1rias fases do fluxo de projeto. Durante o design conceptual, um dimensionamento r\u00e1pido permite verificar se o di\u00e2metro de um eixo, a sec\u00e7\u00e3o de uma viga ou a pot\u00eancia de um motor est\u00e3o na faixa correta antes da modela\u00e7\u00e3o CAD detalhada.',
      'Na fabrica\u00e7\u00e3o e na engenharia de campo, as calculadoras servem como ferramentas de refer\u00eancia instant\u00e2nea. Os estudantes usam-nas para verificar exerc\u00edcios e compreender como a altera\u00e7\u00e3o de uma vari\u00e1vel afeta todo o sistema.',
    ],
    footerColumns: [
      {
        title: 'Mec\u00e2nica',
        links: [
          { href: '/bolt-torque', label: 'Calculadora de torque de aperto' },
          { href: '/bearings', label: 'Vida \u00fatil de rolamentos (ISO 281)' },
          { href: '/gears', label: 'Calculadora de rela\u00e7\u00e3o de engrenagens' },
          { href: '/shafts', label: 'Di\u00e2metro do eixo' },
          { href: '/hooke-law', label: 'Constante da mola' },
          { href: '/motor-selection-std', label: 'Pot\u00eancia do motor' },
        ],
      },
      {
        title: 'Estrutural',
        links: [
          { href: '/beam-deflection', label: 'Deflex\u00e3o de viga' },
          { href: '/concrete-reinforcement', label: 'Armadura de bet\u00e3o' },
          { href: '/simulation-fea', label: 'An\u00e1lise FEA' },
          { href: '/topology-optimization', label: 'Otimiza\u00e7\u00e3o topol\u00f3gica' },
          { href: '/machine-assembly', label: 'Montagem de m\u00e1quinas' },
        ],
      },
      {
        title: 'Fluidos e t\u00e9rmica',
        links: [
          { href: '/fluid-dynamics', label: 'Queda de press\u00e3o' },
          { href: '/thermal-expansion', label: 'Transfer\u00eancia de calor' },
          { href: '/pumps', label: 'Desempenho da bomba' },
          { href: '/reducer-lubrication', label: 'Lubrifica\u00e7\u00e3o de redutores' },
          { href: '/naval-hydrostatics', label: 'Hidrost\u00e1tica naval' },
        ],
      },
      {
        title: 'El\u00e9trica',
        links: [
          { href: '/three-phase-power', label: 'Calculadora de pot\u00eancia' },
          { href: '/ohms-law', label: 'Lei de Ohm' },
          { href: '/voltage-drop', label: 'Queda de tens\u00e3o' },
          { href: '/3-phase-power', label: 'Pot\u00eancia trif\u00e1sica' },
          { href: '/filter-design', label: 'Projeto de filtros' },
        ],
      },
      {
        title: 'Ci\u00eancias',
        links: [
          { href: '/physics-solver', label: 'Solucionador CAS de f\u00edsica' },
          { href: '/failure-prediction', label: 'Previs\u00e3o de falhas' },
          { href: '/failure-diagnosis', label: 'Diagn\u00f3stico de falhas' },
          { href: '/biology-genetics', label: 'Gen\u00e9tica de popula\u00e7\u00f5es' },
          { href: '/digital-logic', label: 'Laborat\u00f3rio de l\u00f3gica digital' },
        ],
      },
      {
        title: 'Plataforma',
        links: [
          { href: '/academy?tab=calculators', label: 'Todas as calculadoras' },
          { href: '/workspace', label: 'Abrir workspace' },
          { href: '/academy', label: 'Academia de engenharia' },
          { href: '/', label: 'In\u00edcio' },
        ],
      },
    ],
    copyright: '\u00a9 2026 AluCalc Advanced Engineering Systems',
  },

  ru: {
    whatTitle: '\u0427\u0442\u043e \u0442\u0430\u043a\u043e\u0435 \u0438\u043d\u0436\u0435\u043d\u0435\u0440\u043d\u044b\u0435 \u043a\u0430\u043b\u044c\u043a\u0443\u043b\u044f\u0442\u043e\u0440\u044b?',
    whatParagraphs: [
      '\u0418\u043d\u0436\u0435\u043d\u0435\u0440\u043d\u044b\u0435 \u043a\u0430\u043b\u044c\u043a\u0443\u043b\u044f\u0442\u043e\u0440\u044b \u2014 \u044d\u0442\u043e \u0441\u043f\u0435\u0446\u0438\u0430\u043b\u0438\u0437\u0438\u0440\u043e\u0432\u0430\u043d\u043d\u044b\u0435 \u0438\u043d\u0441\u0442\u0440\u0443\u043c\u0435\u043d\u0442\u044b \u0434\u043b\u044f \u0440\u0435\u0448\u0435\u043d\u0438\u044f \u0442\u0435\u0445\u043d\u0438\u0447\u0435\u0441\u043a\u0438\u0445 \u0443\u0440\u0430\u0432\u043d\u0435\u043d\u0438\u0439 \u0432 \u043c\u0430\u0448\u0438\u043d\u043e\u0441\u0442\u0440\u043e\u0435\u043d\u0438\u0438, \u0441\u0442\u0440\u043e\u0438\u0442\u0435\u043b\u044c\u043d\u043e\u0439, \u044d\u043b\u0435\u043a\u0442\u0440\u0438\u0447\u0435\u0441\u043a\u043e\u0439 \u0438 \u0442\u0435\u043f\u043b\u043e\u0442\u0435\u0445\u043d\u0438\u043a\u0435. \u0412 \u043e\u0442\u043b\u0438\u0447\u0438\u0435 \u043e\u0442 \u043e\u0431\u044b\u0447\u043d\u044b\u0445 \u043a\u0430\u043b\u044c\u043a\u0443\u043b\u044f\u0442\u043e\u0440\u043e\u0432 \u043e\u043d\u0438 \u0440\u0435\u0430\u043b\u0438\u0437\u0443\u044e\u0442 \u043f\u0440\u043e\u0432\u0435\u0440\u0435\u043d\u043d\u044b\u0435 \u0444\u043e\u0440\u043c\u0443\u043b\u044b \u043c\u0435\u0436\u0434\u0443\u043d\u0430\u0440\u043e\u0434\u043d\u044b\u0445 \u0441\u0442\u0430\u043d\u0434\u0430\u0440\u0442\u043e\u0432, \u0442\u0430\u043a\u0438\u0445 \u043a\u0430\u043a ISO 281, VDI 2230, ASME PCC-1 \u0438 \u0442\u0435\u043e\u0440\u0438\u044f \u0431\u0430\u043b\u043e\u043a \u042d\u0439\u043b\u0435\u0440\u0430-\u0411\u0435\u0440\u043d\u0443\u043b\u043b\u0438.',
      '\u041a\u043e\u043d\u0441\u0442\u0440\u0443\u043a\u0442\u043e\u0440\u044b, \u043f\u0440\u043e\u0435\u043a\u0442\u0438\u0440\u043e\u0432\u0449\u0438\u043a\u0438, \u043f\u0440\u043e\u0438\u0437\u0432\u043e\u0434\u0441\u0442\u0432\u0435\u043d\u043d\u044b\u0435 \u0438\u043d\u0436\u0435\u043d\u0435\u0440\u044b \u0438 \u0441\u0442\u0443\u0434\u0435\u043d\u0442\u044b \u0435\u0436\u0435\u0434\u043d\u0435\u0432\u043d\u043e \u0438\u0441\u043f\u043e\u043b\u044c\u0437\u0443\u044e\u0442 \u0438\u0445 \u0434\u043b\u044f \u043f\u0440\u043e\u0432\u0435\u0440\u043a\u0438 \u0440\u0443\u0447\u043d\u044b\u0445 \u0440\u0430\u0441\u0447\u0451\u0442\u043e\u0432, \u043f\u0440\u0435\u0434\u0432\u0430\u0440\u0438\u0442\u0435\u043b\u044c\u043d\u043e\u0433\u043e \u043f\u043e\u0434\u0431\u043e\u0440\u0430 \u0440\u0430\u0437\u043c\u0435\u0440\u043e\u0432 \u0438 \u0432\u0430\u043b\u0438\u0434\u0430\u0446\u0438\u0438 \u0440\u0435\u0437\u0443\u043b\u044c\u0442\u0430\u0442\u043e\u0432 \u043c\u043e\u0434\u0435\u043b\u0438\u0440\u043e\u0432\u0430\u043d\u0438\u044f.',
      '\u0421\u043e\u0432\u0440\u0435\u043c\u0435\u043d\u043d\u044b\u0435 \u0431\u0440\u0430\u0443\u0437\u0435\u0440\u043d\u044b\u0435 \u0438\u043d\u0436\u0435\u043d\u0435\u0440\u043d\u044b\u0435 \u043a\u0430\u043b\u044c\u043a\u0443\u043b\u044f\u0442\u043e\u0440\u044b, \u0442\u0430\u043a\u0438\u0435 \u043a\u0430\u043a AluCalc OS, \u0438\u0437\u0431\u0430\u0432\u043b\u044f\u044e\u0442 \u043e\u0442 \u0434\u043e\u0440\u043e\u0433\u0438\u0445 \u043d\u0430\u0441\u0442\u043e\u043b\u044c\u043d\u044b\u0445 \u043b\u0438\u0446\u0435\u043d\u0437\u0438\u0439. \u0418\u043d\u0436\u0435\u043d\u0435\u0440\u044b \u043c\u043e\u0433\u0443\u0442 \u0432\u044b\u043f\u043e\u043b\u043d\u044f\u0442\u044c \u0442\u043e\u0447\u043d\u044b\u0435 \u0440\u0430\u0441\u0447\u0451\u0442\u044b \u0441 \u043b\u044e\u0431\u043e\u0433\u043e \u0443\u0441\u0442\u0440\u043e\u0439\u0441\u0442\u0432\u0430, \u043f\u043e\u043b\u0443\u0447\u0430\u044f \u0440\u0435\u0437\u0443\u043b\u044c\u0442\u0430\u0442\u044b, \u043f\u0440\u043e\u0432\u0435\u0440\u0435\u043d\u043d\u044b\u0435 \u043f\u043e \u0442\u0435\u043c \u0436\u0435 \u0441\u0442\u0430\u043d\u0434\u0430\u0440\u0442\u0430\u043c, \u0447\u0442\u043e \u0438\u0441\u043f\u043e\u043b\u044c\u0437\u0443\u044e\u0442\u0441\u044f \u043f\u043e \u0432\u0441\u0435\u043c\u0443 \u043c\u0438\u0440\u0443.',
    ],
    howTitle: '\u041a\u0430\u043a \u0438\u043d\u0436\u0435\u043d\u0435\u0440\u044b \u0438\u0441\u043f\u043e\u043b\u044c\u0437\u0443\u044e\u0442 \u044d\u0442\u0438 \u0438\u043d\u0441\u0442\u0440\u0443\u043c\u0435\u043d\u0442\u044b',
    howParagraphs: [
      '\u041f\u0440\u043e\u0444\u0435\u0441\u0441\u0438\u043e\u043d\u0430\u043b\u044c\u043d\u044b\u0435 \u0438\u043d\u0436\u0435\u043d\u0435\u0440\u044b \u0432\u043a\u043b\u044e\u0447\u0430\u044e\u0442 \u043e\u043d\u043b\u0430\u0439\u043d-\u043a\u0430\u043b\u044c\u043a\u0443\u043b\u044f\u0442\u043e\u0440\u044b \u0432 \u0440\u0430\u0437\u043b\u0438\u0447\u043d\u044b\u0435 \u044d\u0442\u0430\u043f\u044b \u043f\u0440\u043e\u0435\u043a\u0442\u043d\u043e\u0433\u043e \u043f\u0440\u043e\u0446\u0435\u0441\u0441\u0430. \u041d\u0430 \u044d\u0442\u0430\u043f\u0435 \u043a\u043e\u043d\u0446\u0435\u043f\u0442\u0443\u0430\u043b\u044c\u043d\u043e\u0433\u043e \u043f\u0440\u043e\u0435\u043a\u0442\u0438\u0440\u043e\u0432\u0430\u043d\u0438\u044f \u0431\u044b\u0441\u0442\u0440\u044b\u0439 \u043f\u043e\u0434\u0431\u043e\u0440 \u0440\u0430\u0437\u043c\u0435\u0440\u043e\u0432 \u043f\u043e\u0437\u0432\u043e\u043b\u044f\u0435\u0442 \u043e\u043f\u0440\u0435\u0434\u0435\u043b\u0438\u0442\u044c, \u043d\u0430\u0445\u043e\u0434\u0438\u0442\u0441\u044f \u043b\u0438 \u0434\u0438\u0430\u043c\u0435\u0442\u0440 \u0432\u0430\u043b\u0430, \u0441\u0435\u0447\u0435\u043d\u0438\u0435 \u0431\u0430\u043b\u043a\u0438 \u0438\u043b\u0438 \u043c\u043e\u0449\u043d\u043e\u0441\u0442\u044c \u0434\u0432\u0438\u0433\u0430\u0442\u0435\u043b\u044f \u0432 \u043d\u0443\u0436\u043d\u043e\u043c \u0434\u0438\u0430\u043f\u0430\u0437\u043e\u043d\u0435 \u0434\u043e \u0434\u0435\u0442\u0430\u043b\u044c\u043d\u043e\u0433\u043e CAD-\u043c\u043e\u0434\u0435\u043b\u0438\u0440\u043e\u0432\u0430\u043d\u0438\u044f.',
      '\u0412 \u043f\u0440\u043e\u0438\u0437\u0432\u043e\u0434\u0441\u0442\u0432\u0435 \u0438 \u043d\u0430 \u0432\u044b\u0435\u0437\u0434\u0435 \u043a\u0430\u043b\u044c\u043a\u0443\u043b\u044f\u0442\u043e\u0440\u044b \u0441\u043b\u0443\u0436\u0430\u0442 \u043c\u0433\u043d\u043e\u0432\u0435\u043d\u043d\u044b\u043c\u0438 \u0441\u043f\u0440\u0430\u0432\u043e\u0447\u043d\u044b\u043c\u0438 \u0438\u043d\u0441\u0442\u0440\u0443\u043c\u0435\u043d\u0442\u0430\u043c\u0438. \u0421\u0442\u0443\u0434\u0435\u043d\u0442\u044b \u0438\u0441\u043f\u043e\u043b\u044c\u0437\u0443\u044e\u0442 \u0438\u0445 \u0434\u043b\u044f \u043f\u0440\u043e\u0432\u0435\u0440\u043a\u0438 \u0434\u043e\u043c\u0430\u0448\u043d\u0438\u0445 \u0437\u0430\u0434\u0430\u043d\u0438\u0439 \u0438 \u043f\u043e\u043d\u0438\u043c\u0430\u043d\u0438\u044f \u0442\u043e\u0433\u043e, \u043a\u0430\u043a \u0438\u0437\u043c\u0435\u043d\u0435\u043d\u0438\u0435 \u043e\u0434\u043d\u043e\u0439 \u043f\u0435\u0440\u0435\u043c\u0435\u043d\u043d\u043e\u0439 \u0432\u043b\u0438\u044f\u0435\u0442 \u043d\u0430 \u0432\u0441\u044e \u0441\u0438\u0441\u0442\u0435\u043c\u0443.',
    ],
    footerColumns: [
      {
        title: '\u041c\u0435\u0445\u0430\u043d\u0438\u043a\u0430',
        links: [
          { href: '/bolt-torque', label: '\u041a\u0430\u043b\u044c\u043a\u0443\u043b\u044f\u0442\u043e\u0440 \u043c\u043e\u043c\u0435\u043d\u0442\u0430 \u0437\u0430\u0442\u044f\u0436\u043a\u0438' },
          { href: '/bearings', label: '\u0420\u0435\u0441\u0443\u0440\u0441 \u043f\u043e\u0434\u0448\u0438\u043f\u043d\u0438\u043a\u0430 (ISO 281)' },
          { href: '/gears', label: '\u041f\u0435\u0440\u0435\u0434\u0430\u0442\u043e\u0447\u043d\u043e\u0435 \u043e\u0442\u043d\u043e\u0448\u0435\u043d\u0438\u0435 \u0448\u0435\u0441\u0442\u0435\u0440\u0451\u043d' },
          { href: '/shafts', label: '\u0414\u0438\u0430\u043c\u0435\u0442\u0440 \u0432\u0430\u043b\u0430' },
          { href: '/hooke-law', label: '\u0416\u0451\u0441\u0442\u043a\u043e\u0441\u0442\u044c \u043f\u0440\u0443\u0436\u0438\u043d\u044b' },
          { href: '/motor-selection-std', label: '\u041c\u043e\u0449\u043d\u043e\u0441\u0442\u044c \u0434\u0432\u0438\u0433\u0430\u0442\u0435\u043b\u044f' },
        ],
      },
      {
        title: '\u0421\u0442\u0440\u043e\u0438\u0442\u0435\u043b\u044c\u043d\u0430\u044f',
        links: [
          { href: '/beam-deflection', label: '\u041f\u0440\u043e\u0433\u0438\u0431 \u0431\u0430\u043b\u043a\u0438' },
          { href: '/concrete-reinforcement', label: '\u0410\u0440\u043c\u0438\u0440\u043e\u0432\u0430\u043d\u0438\u0435 \u0431\u0435\u0442\u043e\u043d\u0430' },
          { href: '/simulation-fea', label: '\u0410\u043d\u0430\u043b\u0438\u0437 \u041c\u041a\u042d' },
          { href: '/topology-optimization', label: '\u0422\u043e\u043f\u043e\u043b\u043e\u0433\u0438\u0447\u0435\u0441\u043a\u0430\u044f \u043e\u043f\u0442\u0438\u043c\u0438\u0437\u0430\u0446\u0438\u044f' },
          { href: '/machine-assembly', label: '\u0421\u0431\u043e\u0440\u043a\u0430 \u043c\u0430\u0448\u0438\u043d' },
        ],
      },
      {
        title: '\u0413\u0438\u0434\u0440\u0430\u0432\u043b\u0438\u043a\u0430 \u0438 \u0442\u0435\u043f\u043b\u043e',
        links: [
          { href: '/fluid-dynamics', label: '\u041f\u0430\u0434\u0435\u043d\u0438\u0435 \u0434\u0430\u0432\u043b\u0435\u043d\u0438\u044f' },
          { href: '/thermal-expansion', label: '\u0422\u0435\u043f\u043b\u043e\u043f\u0435\u0440\u0435\u0434\u0430\u0447\u0430' },
          { href: '/pumps', label: '\u0425\u0430\u0440\u0430\u043a\u0442\u0435\u0440\u0438\u0441\u0442\u0438\u043a\u0438 \u043d\u0430\u0441\u043e\u0441\u0430' },
          { href: '/reducer-lubrication', label: '\u0421\u043c\u0430\u0437\u043a\u0430 \u0440\u0435\u0434\u0443\u043a\u0442\u043e\u0440\u0430' },
          { href: '/naval-hydrostatics', label: '\u0421\u0443\u0434\u043e\u0432\u0430\u044f \u0433\u0438\u0434\u0440\u043e\u0441\u0442\u0430\u0442\u0438\u043a\u0430' },
        ],
      },
      {
        title: '\u042d\u043b\u0435\u043a\u0442\u0440\u0438\u043a\u0430',
        links: [
          { href: '/three-phase-power', label: '\u041a\u0430\u043b\u044c\u043a\u0443\u043b\u044f\u0442\u043e\u0440 \u043c\u043e\u0449\u043d\u043e\u0441\u0442\u0438' },
          { href: '/ohms-law', label: '\u0417\u0430\u043a\u043e\u043d \u041e\u043c\u0430' },
          { href: '/voltage-drop', label: '\u041f\u0430\u0434\u0435\u043d\u0438\u0435 \u043d\u0430\u043f\u0440\u044f\u0436\u0435\u043d\u0438\u044f' },
          { href: '/3-phase-power', label: '\u0422\u0440\u0451\u0445\u0444\u0430\u0437\u043d\u0430\u044f \u043c\u043e\u0449\u043d\u043e\u0441\u0442\u044c' },
          { href: '/filter-design', label: '\u041f\u0440\u043e\u0435\u043a\u0442\u0438\u0440\u043e\u0432\u0430\u043d\u0438\u0435 \u0444\u0438\u043b\u044c\u0442\u0440\u043e\u0432' },
        ],
      },
      {
        title: '\u041d\u0430\u0443\u043a\u0430',
        links: [
          { href: '/physics-solver', label: '\u0424\u0438\u0437\u0438\u0447\u0435\u0441\u043a\u0438\u0439 CAS-\u0440\u0435\u0448\u0430\u0442\u0435\u043b\u044c' },
          { href: '/failure-prediction', label: '\u041f\u0440\u043e\u0433\u043d\u043e\u0437 \u043e\u0442\u043a\u0430\u0437\u043e\u0432' },
          { href: '/failure-diagnosis', label: '\u0414\u0438\u0430\u0433\u043d\u043e\u0441\u0442\u0438\u043a\u0430 \u043e\u0442\u043a\u0430\u0437\u043e\u0432' },
          { href: '/biology-genetics', label: '\u041f\u043e\u043f\u0443\u043b\u044f\u0446\u0438\u043e\u043d\u043d\u0430\u044f \u0433\u0435\u043d\u0435\u0442\u0438\u043a\u0430' },
          { href: '/digital-logic', label: '\u041b\u0430\u0431\u043e\u0440\u0430\u0442\u043e\u0440\u0438\u044f \u0446\u0438\u0444\u0440\u043e\u0432\u043e\u0439 \u043b\u043e\u0433\u0438\u043a\u0438' },
        ],
      },
      {
        title: '\u041f\u043b\u0430\u0442\u0444\u043e\u0440\u043c\u0430',
        links: [
          { href: '/academy?tab=calculators', label: '\u0412\u0441\u0435 \u043a\u0430\u043b\u044c\u043a\u0443\u043b\u044f\u0442\u043e\u0440\u044b' },
          { href: '/workspace', label: '\u041e\u0442\u043a\u0440\u044b\u0442\u044c workspace' },
          { href: '/academy', label: '\u0418\u043d\u0436\u0435\u043d\u0435\u0440\u043d\u0430\u044f \u0430\u043a\u0430\u0434\u0435\u043c\u0438\u044f' },
          { href: '/', label: '\u0413\u043b\u0430\u0432\u043d\u0430\u044f' },
        ],
      },
    ],
    copyright: '\u00a9 2026 AluCalc Advanced Engineering Systems',
  },

  ja: {
    whatTitle: '\u5de5\u5b66\u8a08\u7b97\u6a5f\u3068\u306f\uff1f',
    whatParagraphs: [
      '\u5de5\u5b66\u8a08\u7b97\u6a5f\u306f\u3001\u6a5f\u68b0\u3001\u69cb\u9020\u3001\u96fb\u6c17\u3001\u71b1\u5de5\u5b66\u3067\u4f7f\u7528\u3055\u308c\u308b\u6280\u8853\u7684\u306a\u65b9\u7a0b\u5f0f\u3092\u89e3\u304f\u5c02\u9580\u30c4\u30fc\u30eb\u3067\u3059\u3002\u4e00\u822c\u7684\u306a\u96fb\u5b50\u8a08\u7b97\u6a5f\u3068\u7570\u306a\u308a\u3001ISO 281\u3001VDI 2230\u3001ASME PCC-1\u3001\u30aa\u30a4\u30e9\u30fc\u30fb\u30d9\u30eb\u30cc\u30fc\u30ea\u306e\u6881\u7406\u8ad6\u306a\u3069\u306e\u56fd\u969b\u898f\u683c\u306b\u57fa\u3065\u304f\u691c\u8a3c\u6e08\u307f\u306e\u5f0f\u3092\u5b9f\u88c5\u3057\u3066\u3044\u307e\u3059\u3002',
      '\u8a2d\u8a08\u30a8\u30f3\u30b8\u30cb\u30a2\u3001\u30d7\u30ed\u30b8\u30a7\u30af\u30c8\u30a8\u30f3\u30b8\u30cb\u30a2\u3001\u751f\u7523\u6280\u8853\u8005\u3001\u5b66\u751f\u306f\u624b\u8a08\u7b97\u306e\u691c\u8a3c\u3001\u4e8b\u524d\u30b5\u30a4\u30b8\u30f3\u30b0\u3001\u30b7\u30df\u30e5\u30ec\u30fc\u30b7\u30e7\u30f3\u7d50\u679c\u306e\u691c\u8a3c\u306b\u6bce\u65e5\u5229\u7528\u3057\u3066\u3044\u307e\u3059\u3002',
      'AluCalc OS\u306e\u3088\u3046\u306a\u73fe\u4ee3\u7684\u306a\u30d6\u30e9\u30a6\u30b6\u30d9\u30fc\u30b9\u306e\u5de5\u5b66\u8a08\u7b97\u6a5f\u306f\u3001\u9ad8\u984d\u306a\u30c7\u30b9\u30af\u30c8\u30c3\u30d7\u30e9\u30a4\u30bb\u30f3\u30b9\u3092\u4e0d\u8981\u306b\u3057\u307e\u3059\u3002\u30a8\u30f3\u30b8\u30cb\u30a2\u306f\u3044\u3064\u3067\u3082\u3069\u3053\u304b\u3089\u7cbe\u5bc6\u306a\u8a08\u7b97\u3092\u884c\u3048\u3001\u4e16\u754c\u4e2d\u3067\u4f7f\u7528\u3055\u308c\u308b\u540c\u3058\u898f\u683c\u306b\u57fa\u3065\u3044\u3066\u691c\u8a3c\u3055\u308c\u305f\u7d50\u679c\u3092\u5f97\u3089\u308c\u307e\u3059\u3002',
    ],
    howTitle: '\u30a8\u30f3\u30b8\u30cb\u30a2\u306f\u3053\u306e\u30c4\u30fc\u30eb\u3092\u3069\u3046\u4f7f\u3046\u304b',
    howParagraphs: [
      '\u30d7\u30ed\u306e\u30a8\u30f3\u30b8\u30cb\u30a2\u306f\u3001\u8a2d\u8a08\u30ef\u30fc\u30af\u30d5\u30ed\u30fc\u306e\u8907\u6570\u306e\u968e\u6bb5\u3067\u30aa\u30f3\u30e9\u30a4\u30f3\u8a08\u7b97\u6a5f\u3092\u7d44\u307f\u8fbc\u307f\u307e\u3059\u3002\u6982\u5ff5\u8a2d\u8a08\u306e\u968e\u6bb5\u3067\u306f\u3001\u8ef8\u5f84\u3001\u6881\u65ad\u9762\u3001\u30e2\u30fc\u30bf\u5b9a\u683c\u304c\u9069\u5207\u306a\u7bc4\u56f2\u306b\u3042\u308b\u304b\u3092\u3001\u8a73\u7d30\u306aCAD\u30e2\u30c7\u30ea\u30f3\u30b0\u306e\u524d\u306b\u5feb\u901f\u30b5\u30a4\u30b8\u30f3\u30b0\u3067\u78ba\u8a8d\u3067\u304d\u307e\u3059\u3002',
      '\u88fd\u9020\u3084\u73fe\u5834\u5de5\u5b66\u3067\u306f\u3001\u8a08\u7b97\u6a5f\u306f\u5373\u5ea7\u306e\u53c2\u7167\u30c4\u30fc\u30eb\u3068\u3057\u3066\u6a5f\u80fd\u3057\u307e\u3059\u3002\u5b66\u751f\u306f\u5bbf\u984c\u306e\u78ba\u8a8d\u3084\u3001\u5909\u6570\u3092\u5909\u3048\u308b\u3068\u30b7\u30b9\u30c6\u30e0\u5168\u4f53\u306b\u3069\u3046\u5f71\u97ff\u3059\u308b\u304b\u306e\u7406\u89e3\u3092\u6df1\u3081\u308b\u305f\u3081\u306b\u4f7f\u3044\u307e\u3059\u3002',
    ],
    footerColumns: [
      {
        title: '\u6a5f\u68b0',
        links: [
          { href: '/bolt-torque', label: '\u30dc\u30eb\u30c8\u30c8\u30eb\u30af\u8a08\u7b97\u6a5f' },
          { href: '/bearings', label: '\u8ef8\u53d7\u5bff\u547d\uff08ISO 281\uff09' },
          { href: '/gears', label: '\u6b6f\u8eca\u6bd4\u8a08\u7b97\u6a5f' },
          { href: '/shafts', label: '\u8ef8\u5f84' },
          { href: '/hooke-law', label: '\u30d0\u30cd\u5b9a\u6570' },
          { href: '/motor-selection-std', label: '\u30e2\u30fc\u30bf\u51fa\u529b' },
        ],
      },
      {
        title: '\u69cb\u9020',
        links: [
          { href: '/beam-deflection', label: '\u6881\u305f\u308f\u307f' },
          { href: '/concrete-reinforcement', label: '\u9244\u7b4b\u30b3\u30f3\u30af\u30ea\u30fc\u30c8' },
          { href: '/simulation-fea', label: 'FEA\u89e3\u6790' },
          { href: '/topology-optimization', label: '\u30c8\u30dd\u30ed\u30b8\u30fc\u6700\u9069\u5316' },
          { href: '/machine-assembly', label: '\u6a5f\u68b0\u7d44\u7acb' },
        ],
      },
      {
        title: '\u6d41\u4f53\u30fb\u71b1',
        links: [
          { href: '/fluid-dynamics', label: '\u5727\u529b\u640d\u5931' },
          { href: '/thermal-expansion', label: '\u71b1\u4f1d\u905e' },
          { href: '/pumps', label: '\u30dd\u30f3\u30d7\u6027\u80fd' },
          { href: '/reducer-lubrication', label: '\u6e1b\u901f\u6a5f\u6f64\u6ed1' },
          { href: '/naval-hydrostatics', label: '\u8239\u8236\u9759\u6c34\u529b\u5b66' },
        ],
      },
      {
        title: '\u96fb\u6c17',
        links: [
          { href: '/three-phase-power', label: '\u96fb\u529b\u8a08\u7b97\u6a5f' },
          { href: '/ohms-law', label: '\u30aa\u30fc\u30e0\u306e\u6cd5\u5247' },
          { href: '/voltage-drop', label: '\u96fb\u5727\u964d\u4e0b' },
          { href: '/3-phase-power', label: '\u4e09\u76f8\u96fb\u529b' },
          { href: '/filter-design', label: '\u30d5\u30a3\u30eb\u30bf\u8a2d\u8a08' },
        ],
      },
      {
        title: '\u79d1\u5b66',
        links: [
          { href: '/physics-solver', label: '\u7269\u7406CAS\u30bd\u30eb\u30d0\u30fc' },
          { href: '/failure-prediction', label: '\u6545\u969c\u4e88\u6e2c' },
          { href: '/failure-diagnosis', label: '\u6545\u969c\u8a3a\u65ad' },
          { href: '/biology-genetics', label: '\u7fa4\u4f53\u907a\u4f1d\u5b66' },
          { href: '/digital-logic', label: '\u30c7\u30b8\u30bf\u30eb\u903b\u8f2f\u30e9\u30dc' },
        ],
      },
      {
        title: '\u30d7\u30e9\u30c3\u30c8\u30d5\u30a9\u30fc\u30e0',
        links: [
          { href: '/academy?tab=calculators', label: '\u3059\u3079\u3066\u306e\u8a08\u7b97\u6a5f' },
          { href: '/workspace', label: 'Workspace\u3092\u958b\u304f' },
          { href: '/academy', label: '\u5de5\u5b66\u30a2\u30ab\u30c7\u30df\u30fc' },
          { href: '/', label: '\u30db\u30fc\u30e0' },
        ],
      },
    ],
    copyright: '\u00a9 2026 AluCalc Advanced Engineering Systems',
  },

  zh: {
    whatTitle: '\u4ec0\u4e48\u662f\u5de5\u7a0b\u8ba1\u7b97\u5668\uff1f',
    whatParagraphs: [
      '\u5de5\u7a0b\u8ba1\u7b97\u5668\u662f\u4e13\u95e8\u7528\u4e8e\u89e3\u51b3\u673a\u68b0\u3001\u7ed3\u6784\u3001\u7535\u6c14\u548c\u70ed\u5de5\u7a0b\u9886\u57df\u6280\u672f\u65b9\u7a0b\u7684\u4e13\u4e1a\u5de5\u5177\u3002\u4e0e\u901a\u7528\u8ba1\u7b97\u5668\u4e0d\u540c\uff0c\u5b83\u4eec\u5b9e\u73b0\u4e86\u7ecf\u56fd\u9645\u6807\u51c6\uff08\u5982 ISO 281\u3001VDI 2230\u3001ASME PCC-1 \u548c\u6b27\u62c9-\u4f2f\u52aa\u5229\u6881\u7406\u8bba\uff09\u9a8c\u8bc1\u7684\u516c\u5f0f\u3002',
      '\u8bbe\u8ba1\u5de5\u7a0b\u5e08\u3001\u9879\u76ee\u5de5\u7a0b\u5e08\u3001\u5236\u9020\u5de5\u7a0b\u5e08\u548c\u5b66\u751f\u6bcf\u5929\u90fd\u4f7f\u7528\u8fd9\u4e9b\u5de5\u5177\u6765\u9a8c\u8bc1\u624b\u7b97\u7ed3\u679c\u3001\u8fdb\u884c\u9884\u8bbe\u8ba1\u5c3a\u5bf8\u5e76\u9a8c\u8bc1\u4eff\u771f\u7ed3\u679c\u3002',
      '\u50cf AluCalc OS \u8fd9\u6837\u7684\u73b0\u4ee3\u6d4f\u89c8\u5668\u5de5\u7a0b\u8ba1\u7b97\u5668\u53ef\u514d\u9664\u6602\u8d35\u7684\u684c\u9762\u8f6f\u4ef6\u8bb8\u53ef\u8d39\u7528\u3002\u5de5\u7a0b\u5e08\u53ef\u4ece\u4efb\u4f55\u8bbe\u5907\u8fdb\u884c\u7cbe\u786e\u8ba1\u7b97\uff0c\u7ed3\u679c\u6309\u5168\u7403\u901a\u7528\u7684\u540c\u4e00\u6807\u51c6\u9a8c\u8bc1\u3002',
    ],
    howTitle: '\u5de5\u7a0b\u5e08\u5982\u4f55\u4f7f\u7528\u8fd9\u4e9b\u5de5\u5177',
    howParagraphs: [
      '\u4e13\u4e1a\u5de5\u7a0b\u5e08\u5728\u8bbe\u8ba1\u6d41\u7a0b\u7684\u591a\u4e2a\u9636\u6bb5\u96c6\u6210\u5728\u7ebf\u8ba1\u7b97\u5668\u3002\u5728\u6982\u5ff5\u8bbe\u8ba1\u9636\u6bb5\uff0c\u5feb\u901f\u5c3a\u5bf8\u53ef\u5224\u65ad\u8f74\u5f84\u3001\u6881\u622a\u9762\u6216\u7535\u673a\u529f\u7387\u662f\u5426\u5728\u5408\u7406\u8303\u56f4\u5185\uff0c\u7136\u540e\u518d\u8fdb\u884c\u8be6\u7ec6 CAD \u5efa\u6a21\u3002',
      '\u5728\u5236\u9020\u548c\u73b0\u573a\u5de5\u7a0b\u4e2d\uff0c\u8ba1\u7b97\u5668\u662f\u5373\u65f6\u53c2\u8003\u5de5\u5177\u3002\u5b66\u751f\u7528\u4e8e\u68c0\u67e5\u4f5c\u4e1a\u89e3\u7b54\uff0c\u5e76\u7406\u89e3\u53d8\u91cf\u6539\u53d8\u5982\u4f55\u5f71\u54cd\u6574\u4e2a\u7cfb\u7edf\u3002',
    ],
    footerColumns: [
      {
        title: '\u673a\u68b0',
        links: [
          { href: '/bolt-torque', label: '\u87ba\u6813\u626d\u77e9\u8ba1\u7b97\u5668' },
          { href: '/bearings', label: '\u8f74\u627f\u5bff\u547d\uff08ISO 281\uff09' },
          { href: '/gears', label: '\u9f7f\u8f6e\u6bd4\u8ba1\u7b97\u5668' },
          { href: '/shafts', label: '\u8f74\u5f84' },
          { href: '/hooke-law', label: '\u5f39\u7c27\u5e38\u6570' },
          { href: '/motor-selection-std', label: '\u7535\u673a\u529f\u7387' },
        ],
      },
      {
        title: '\u7ed3\u6784',
        links: [
          { href: '/beam-deflection', label: '\u6881\u632b\u5ea6' },
          { href: '/concrete-reinforcement', label: '\u6df7\u51dd\u571f\u914d\u7b4b' },
          { href: '/simulation-fea', label: 'FEA \u5206\u6790' },
          { href: '/topology-optimization', label: '\u62d3\u6251\u4f18\u5316' },
          { href: '/machine-assembly', label: '\u673a\u68b0\u88c5\u914d' },
        ],
      },
      {
        title: '\u6d41\u4f53\u4e0e\u70ed\u5de5',
        links: [
          { href: '/fluid-dynamics', label: '\u538b\u529b\u964d' },
          { href: '/thermal-expansion', label: '\u70ed\u4f20\u9012' },
          { href: '/pumps', label: '\u6cf5\u6027\u80fd' },
          { href: '/reducer-lubrication', label: '\u51cf\u901f\u7bb1\u6da6\u6ed1' },
          { href: '/naval-hydrostatics', label: '\u8239\u8236\u9759\u6c34\u529b\u5b66' },
        ],
      },
      {
        title: '\u7535\u6c14',
        links: [
          { href: '/three-phase-power', label: '\u529f\u7387\u8ba1\u7b97\u5668' },
          { href: '/ohms-law', label: '\u6b27\u59c6\u5b9a\u5f8b' },
          { href: '/voltage-drop', label: '\u7535\u538b\u964d' },
          { href: '/3-phase-power', label: '\u4e09\u76f8\u529f\u7387' },
          { href: '/filter-design', label: '\u6ee4\u6ce2\u5668\u8bbe\u8ba1' },
        ],
      },
      {
        title: '\u79d1\u5b66',
        links: [
          { href: '/physics-solver', label: '\u7269\u7406 CAS \u6c42\u89e3\u5668' },
          { href: '/failure-prediction', label: '\u6545\u969c\u9884\u6d4b' },
          { href: '/failure-diagnosis', label: '\u6545\u969c\u8bca\u65ad' },
          { href: '/biology-genetics', label: '\u7fa4\u4f53\u9057\u4f20\u5b66' },
          { href: '/digital-logic', label: '\u6570\u5b57\u903b\u8f91\u5b9e\u9a8c\u5ba4' },
        ],
      },
      {
        title: '\u5e73\u53f0',
        links: [
          { href: '/academy?tab=calculators', label: '\u5168\u90e8\u8ba1\u7b97\u5668' },
          { href: '/workspace', label: '\u6253\u5f00\u5de5\u4f5c\u533a' },
          { href: '/academy', label: '\u5de5\u7a0b\u5b66\u9662' },
          { href: '/', label: '\u9996\u9875' },
        ],
      },
    ],
    copyright: '\u00a9 2026 AluCalc Advanced Engineering Systems',
  },

  ko: {
    whatTitle: '\uacf5\ud559 \uacc4\uc0b0\uae30\ub780?',
    whatParagraphs: [
      '\uacf5\ud559 \uacc4\uc0b0\uae30\ub294 \uae30\uacc4, \uad6c\uc870, \uc804\uae30, \uc5f4 \uacf5\ud559\uc5d0\uc11c \uc0ac\uc6a9\ub418\ub294 \uae30\uc220 \ubc29\uc815\uc2dd\uc744 \ud480\ub294 \uc804\ubb38 \ub3c4\uad6c\uc785\ub2c8\ub2e4. \uc77c\ubc18 \uacc4\uc0b0\uae30\uc640 \ub2ec\ub9ac ISO 281, VDI 2230, ASME PCC-1, \uc624\uc77c\ub7ec-\ubca0\ub974\ub204\ub9ac \ubcf4 \uc774\ub860 \ub4f1 \uad6d\uc81c \ud45c\uc900\uc5d0 \uae30\ubc18\ud55c \uac80\uc99d\ub41c \uacf5\uc2dd\uc744 \uad6c\ud604\ud569\ub2c8\ub2e4.',
      '\uc124\uacc4 \uc5d4\uc9c0\ub2c8\uc5b4, \ud504\ub85c\uc81d\ud2b8 \uc5d4\uc9c0\ub2c8\uc5b4, \uc0dd\uc0b0 \uc5d4\uc9c0\ub2c8\uc5b4, \ud559\uc0dd\ub4e4\uc740 \uc218\uacc4\uc0b0 \uac80\uc99d, \uc0ac\uc804 \uce58\uc218 \uc120\uc815, \uc2dc\ubbac\ub808\uc774\uc158 \uacb0\uacfc \uac80\uc99d\uc744 \uc704\ud574 \ub9e4\uc77c \uc774\ub97c \uc0ac\uc6a9\ud569\ub2c8\ub2e4.',
      'AluCalc OS\uc640 \uac19\uc740 \ucd5c\uc2e0 \ube0c\ub77c\uc6b0\uc800 \uae30\ubc18 \uacf5\ud559 \uacc4\uc0b0\uae30\ub294 \ube44\uc2fc \ub370\uc2a4\ud06c\ud1b1 \ub77c\uc774\uc120\uc2a4\uac00 \ud544\uc694 \uc5c6\uc2b5\ub2c8\ub2e4. \uc5d4\uc9c0\ub2c8\uc5b4\ub294 \uc5b4\ub5a4 \uae30\uae30\uc5d0\uc11c\ub4e0 \uc804 \uc138\uacc4\uc801\uc73c\ub85c \uc0ac\uc6a9\ub418\ub294 \ub3d9\uc77c\ud55c \ud45c\uc900\uc73c\ub85c \uac80\uc99d\ub41c \uacb0\uacfc\ub97c \uc5bb\uc744 \uc218 \uc788\uc2b5\ub2c8\ub2e4.',
    ],
    howTitle: '\uc5d4\uc9c0\ub2c8\uc5b4\uac00 \uc774 \ub3c4\uad6c\ub97c \uc0ac\uc6a9\ud558\ub294 \ubc29\ubc95',
    howParagraphs: [
      '\uc804\ubb38 \uc5d4\uc9c0\ub2c8\uc5b4\ub294 \uc124\uacc4 \uc6cc\ud06c\ud50c\ub85c\uc758 \uc5ec\ub7ec \ub2e8\uacc4\uc5d0 \uc628\ub77c\uc778 \uacc4\uc0b0\uae30\ub97c \ud1b5\ud569\ud569\ub2c8\ub2e4. \uac1c\ub150 \uc124\uacc4 \ub2e8\uacc4\uc5d0\uc11c \ube60\ub978 \uce58\uc218 \uc120\uc815\uc73c\ub85c \uc0e4\ud504\ud2b8 \uc9c1\uacbd, \ubcf4 \ub2e8\uba74, \ubaa8\ud130 \uc815\uaca9\uc774 \uc801\uc808\ud55c \ubc94\uc704\uc5d0 \uc788\ub294\uc9c0 \ud655\uc778\ud560 \uc218 \uc788\uc2b5\ub2c8\ub2e4.',
      '\uc81c\uc870 \ubc0f \ud604\uc7a5 \uacf5\ud559\uc5d0\uc11c \uacc4\uc0b0\uae30\ub294 \uc989\uc2dc \ucc38\uace0 \ub3c4\uad6c\ub85c \uc0ac\uc6a9\ub429\ub2c8\ub2e4. \ud559\uc0dd\ub4e4\uc740 \uc219\uc81c \ud480\uc774\ub97c \ud655\uc778\ud558\uace0 \ubcc0\uc218 \ud558\ub098\uac00 \uc804\uccb4 \uc2dc\uc2a4\ud15c\uc5d0 \ubbf8\uce58\ub294 \uc601\ud5a5\uc744 \uc774\ud574\ud569\ub2c8\ub2e4.',
    ],
    footerColumns: [
      {
        title: '\uae30\uacc4',
        links: [
          { href: '/bolt-torque', label: '\ubcfc\ud2b8 \ud1a0\ud06c \uacc4\uc0b0\uae30' },
          { href: '/bearings', label: '\ubcearing \uc218\uba85 (ISO 281)' },
          { href: '/gears', label: '\uae30\uc5b4 \ube44 \uacc4\uc0b0\uae30' },
          { href: '/shafts', label: '\uc0e4\ud504\ud2b8 \uc9c1\uacbd' },
          { href: '/hooke-law', label: '\uc2a4\ud504\ub9c1 \uc0c1\uc218' },
          { href: '/motor-selection-std', label: '\ubaa8\ud130 \ucd9c\ub825' },
        ],
      },
      {
        title: '\uad6c\uc870',
        links: [
          { href: '/beam-deflection', label: '\ubcf4 \ucc99\uc624' },
          { href: '/concrete-reinforcement', label: '\uac04\uc9dc \ubc30\uadfc' },
          { href: '/simulation-fea', label: 'FEA \ubd84\uc11d' },
          { href: '/topology-optimization', label: '\ud1a0\ud3f4\ub85c\uc9c0 \ucd5c\uc801\ud654' },
          { href: '/machine-assembly', label: '\uae30\uacc4 \uc870\ub9bd' },
        ],
      },
      {
        title: '\uc720\uccb4 \ubc0f \uc5f4',
        links: [
          { href: '/fluid-dynamics', label: '\uc555\ub825 \uac10\uc18c' },
          { href: '/thermal-expansion', label: '\uc5f4\uc804\ub2ec' },
          { href: '/pumps', label: '\ud38c\ud504 \uc131\ub2a5' },
          { href: '/reducer-lubrication', label: '\uac10\uc18d\uae30 \uac01\uc9c4' },
          { href: '/naval-hydrostatics', label: '\uc120\ubc15 \uc815\uc218\ub825\ud559' },
        ],
      },
      {
        title: '\uc804\uae30',
        links: [
          { href: '/three-phase-power', label: '\uc804\ub825 \uacc4\uc0b0\uae30' },
          { href: '/ohms-law', label: '\uc624\uc998\uc758 \ubc95\uce59' },
          { href: '/voltage-drop', label: '\uc804\uc555 \uac10\uc18c' },
          { href: '/3-phase-power', label: '3\uc0c1 \uc804\ub825' },
          { href: '/filter-design', label: '\ud544\ud130 \uc124\uacc4' },
        ],
      },
      {
        title: '\uacfc\ud559',
        links: [
          { href: '/physics-solver', label: '\ubb3c\ub9ac CAS \uc194\ubc84' },
          { href: '/failure-prediction', label: '\uace0\uc7a5 \uc608\uce21' },
          { href: '/failure-diagnosis', label: '\uace0\uc7a5 \uc9c4\ub2e8' },
          { href: '/biology-genetics', label: '\uad70\uc9d1 \uc720\uc804\ud559' },
          { href: '/digital-logic', label: '\ub514\uc9c0\ud138 \ub85c\uc9c1 \ub7a9' },
        ],
      },
      {
        title: '\ud50c\ub7ab\ud3fc',
        links: [
          { href: '/academy?tab=calculators', label: '\ubaa8\ub4e0 \uacc4\uc0b0\uae30' },
          { href: '/workspace', label: 'Workspace \uc5f4\uae30' },
          { href: '/academy', label: '\uacf5\ud559 \uc544\uce74\ub370\ubbf8' },
          { href: '/', label: '\ud648' },
        ],
      },
    ],
    copyright: '\u00a9 2026 AluCalc Advanced Engineering Systems',
  },

  ar: {
    whatTitle: '\u0645\u0627 \u0647\u064a \u062d\u0627\u0633\u0628\u0627\u062a \u0627\u0644\u0647\u0646\u062f\u0633\u0629\u061f',
    whatParagraphs: [
      '\u062d\u0627\u0633\u0628\u0627\u062a \u0627\u0644\u0647\u0646\u062f\u0633\u0629 \u0623\u062f\u0648\u0627\u062a \u0645\u062a\u062e\u0635\u0635\u0629 \u062a\u062d\u0644 \u0627\u0644\u0645\u0639\u0627\u062f\u0644\u0627\u062a \u0627\u0644\u062a\u0642\u0646\u064a\u0629 \u0627\u0644\u0645\u0633\u062a\u062e\u062f\u0645\u0629 \u0641\u064a \u0627\u0644\u0647\u0646\u062f\u0633\u0629 \u0627\u0644\u0645\u064a\u0643\u0627\u0646\u064a\u0643\u064a\u0629 \u0648\u0627\u0644\u0625\u0646\u0634\u0627\u0626\u064a\u0629 \u0648\u0627\u0644\u0643\u0647\u0631\u0628\u0627\u0626\u064a\u0629 \u0648\u0627\u0644\u062d\u0631\u0627\u0631\u064a\u0629. \u0648\u0628\u062e\u0644\u0627\u0641 \u0639\u0646 \u0627\u0644\u062d\u0627\u0633\u0628\u0627\u062a \u0627\u0644\u0639\u0627\u0645\u0629\u060c \u062a\u0646\u0641\u0651\u0630 \u0645\u0639\u0627\u062f\u0644\u0627\u062a \u0645\u062f\u0642\u0642\u0629 \u0645\u0646 \u0645\u0639\u0627\u064a\u064a\u0631 \u062f\u0648\u0644\u064a\u0629 \u0645\u062b\u0644 ISO 281 \u0648VDI 2230 \u0648ASME PCC-1 \u0648\u0646\u0638\u0631\u064a\u0629 \u0639\u0631\u062f \u0625\u064a\u0644\u0631-\u0628\u0631\u0646\u0648\u0644\u064a.',
      '\u064a\u0633\u062a\u062e\u062f\u0645 \u0645\u0647\u0646\u062f\u0633\u0648 \u0627\u0644\u062a\u0635\u0645\u064a\u0645 \u0648\u0627\u0644\u0645\u0634\u0627\u0631\u064a\u0639 \u0648\u0627\u0644\u062a\u0635\u0646\u064a\u0639 \u0648\u0627\u0644\u0637\u0644\u0627\u0628 \u0647\u0630\u0647 \u0627\u0644\u0623\u062f\u0648\u0627\u062a \u064a\u0648\u0645\u064a\u064b\u0627 \u0644\u0644\u062a\u062d\u0642\u0642 \u0645\u0646 \u0627\u0644\u062d\u0633\u0627\u0628\u0627\u062a \u0627\u0644\u064a\u062f\u0648\u064a\u0629 \u0648\u0625\u062c\u0631\u0627\u0621 \u062a\u0642\u062f\u064a\u0631\u0627\u062a \u0623\u0648\u0644\u064a\u0629 \u0648\u0627\u0644\u062a\u062d\u0642\u0642 \u0645\u0646 \u0646\u062a\u0627\u0626\u062c \u0627\u0644\u0645\u062d\u0627\u0643\u0627\u0629.',
      '\u062a\u0639\u0641\u064a \u062d\u0627\u0633\u0628\u0627\u062a \u0627\u0644\u0647\u0646\u062f\u0633\u0629 \u0627\u0644\u062d\u062f\u064a\u062b\u0629 \u0639\u0628\u0631 \u0627\u0644\u0645\u062a\u0635\u0641\u062d\u060c \u0645\u062b\u0644 AluCalc OS\u060c \u0645\u0646 \u0627\u0644\u062d\u0627\u062c\u0629 \u0625\u0644\u0649 \u062a\u0631\u0627\u062e\u064a\u0635 \u0627\u0644\u0645\u0643\u062a\u0628 \u0627\u0644\u0645\u0643\u0644\u0641\u0629. \u064a\u0645\u0643\u0646 \u0644\u0644\u0645\u0647\u0646\u062f\u0633\u064a\u0646 \u0625\u062c\u0631\u0627\u0621 \u062d\u0633\u0627\u0628\u0627\u062a \u062f\u0642\u064a\u0642\u0629 \u0645\u0646 \u0623\u064a \u062c\u0647\u0627\u0632\u060c \u0645\u0639 \u0646\u062a\u0627\u0626\u062c \u0645\u062f\u0642\u0642\u0629 \u0628\u0646\u0641\u0633 \u0627\u0644\u0645\u0639\u0627\u064a\u064a\u0631 \u0627\u0644\u0645\u0633\u062a\u062e\u062f\u0645\u0629 \u0639\u0627\u0644\u0645\u064a\u064b\u0627.',
    ],
    howTitle: '\u0643\u064a\u0641 \u064a\u0633\u062a\u062e\u062f\u0645 \u0627\u0644\u0645\u0647\u0646\u062f\u0633\u0648\u0646 \u0647\u0630\u0647 \u0627\u0644\u0623\u062f\u0648\u0627\u062a',
    howParagraphs: [
      '\u064a\u062f\u0645\u062c \u0627\u0644\u0645\u0647\u0646\u062f\u0633\u0648\u0646 \u0627\u0644\u0645\u062d\u062a\u0631\u0641\u0648\u0646 \u0627\u0644\u062d\u0627\u0633\u0628\u0627\u062a \u0639\u0628\u0631 \u0627\u0644\u0625\u0646\u062a\u0631\u0646\u062a \u0641\u064a \u0645\u0631\u0627\u062d\u0644 \u0645\u062a\u0639\u062f\u062f\u0629 \u0645\u0646 \u0633\u064a\u0631 \u0627\u0644\u062a\u0635\u0645\u064a\u0645. \u0641\u064a \u0627\u0644\u062a\u0635\u0645\u064a\u0645 \u0627\u0644\u0645\u0641\u0627\u0647\u064a\u0645\u064a\u060c \u064a\u0633\u0627\u0639\u062f \u0627\u0644\u062a\u0642\u062f\u064a\u0631 \u0627\u0644\u0633\u0631\u064a\u0639 \u0639\u0644\u0649 \u062a\u062d\u062f\u064a\u062f \u0645\u0627 \u0625\u0630\u0627 \u0643\u0627\u0646 \u0642\u0637\u0631 \u0627\u0644\u0639\u0645\u0648\u062f \u0623\u0648 \u0642\u0637\u0639\u0629 \u0627\u0644\u0639\u0627\u0631\u0636\u0629 \u0623\u0648 \u0642\u062f\u0631\u0629 \u0627\u0644\u0645\u062d\u0631\u0643 \u0636\u0645\u0646 \u0627\u0644\u0646\u0637\u0627\u0642 \u0627\u0644\u0645\u0646\u0627\u0633\u0628 \u0642\u0628\u0644 \u0627\u0644\u0646\u0645\u0630\u062c \u0627\u0644\u062a\u0641\u0635\u064a\u0644\u064a \u0628\u0627\u0644\u0640CAD.',
      '\u0641\u064a \u0627\u0644\u062a\u0635\u0646\u064a\u0639 \u0648\u0627\u0644\u0647\u0646\u062f\u0633\u0629 \u0627\u0644\u0645\u064a\u062f\u0627\u0646\u064a\u0629\u060c \u062a\u0639\u0645\u0644 \u0627\u0644\u062d\u0627\u0633\u0628\u0627\u062a \u0643\u0623\u062f\u0648\u0627\u062a \u0645\u0631\u062c\u0639 \u0641\u0648\u0631\u064a\u0629. \u064a\u0633\u062a\u062e\u062f\u0645\u0647\u0627 \u0627\u0644\u0637\u0644\u0627\u0628 \u0644\u0644\u062a\u062d\u0642\u0642 \u0645\u0646 \u062d\u0644\u0648\u0644 \u0627\u0644\u0648\u0627\u062c\u0628\u0627\u062a \u0648\u0641\u0647\u0645 \u0643\u064a\u0641\u064a\u0629 \u062a\u0623\u062b\u064a\u0631 \u062a\u063a\u064a\u064a\u0631 \u0645\u062a\u063a\u064a\u0631 \u0648\u0627\u062d\u062f \u0639\u0644\u0649 \u0627\u0644\u0646\u0638\u0627\u0645 \u0628\u0623\u0633\u0631\u0647.',
    ],
    footerColumns: [
      {
        title: '\u0645\u064a\u0643\u0627\u0646\u064a\u0643\u0627',
        links: [
          { href: '/bolt-torque', label: '\u062d\u0627\u0633\u0628\u0629 \u0639\u0632\u0645 \u0627\u0644\u0628\u0631\u0627\u063a\u064a' },
          { href: '/bearings', label: '\u0639\u0645\u0631 \u0627\u0644\u0645\u062d\u0645\u0644 (ISO 281)' },
          { href: '/gears', label: '\u062d\u0627\u0633\u0628\u0629 \u0646\u0633\u0628\u0629 \u0627\u0644\u062a\u0631\u0633' },
          { href: '/shafts', label: '\u0642\u0637\u0631 \u0627\u0644\u0639\u0645\u0648\u062f' },
          { href: '/hooke-law', label: '\u062b\u0627\u0628\u062a \u0627\u0644\u0632\u0646\u0628\u0631' },
          { href: '/motor-selection-std', label: '\u0642\u062f\u0631\u0629 \u0627\u0644\u0645\u062d\u0631\u0643' },
        ],
      },
      {
        title: '\u0625\u0646\u0634\u0627\u0626\u064a',
        links: [
          { href: '/beam-deflection', label: '\u0627\u0646\u062d\u0646\u0627\u0621 \u0627\u0644\u0639\u0627\u0631\u0636\u0629' },
          { href: '/concrete-reinforcement', label: '\u062a\u0633\u0644\u064a\u062d \u0627\u0644\u062e\u0631\u0633\u0627\u0646\u0629' },
          { href: '/simulation-fea', label: '\u062a\u062d\u0644\u064a\u0644 FEA' },
          { href: '/topology-optimization', label: '\u062a\u062d\u0633\u064a\u0646 \u0627\u0644\u062a\u0648\u067e\u0648\u0644\u0648\u062c\u064a\u0627' },
          { href: '/machine-assembly', label: '\u062a\u0631\u0643\u064a\u0628 \u0627\u0644\u0622\u0644\u0627\u062a' },
        ],
      },
      {
        title: '\u0627\u0644\u0633\u0648\u0627\u0626\u0644 \u0648\u0627\u0644\u062d\u0631\u0627\u0631\u064a\u0629',
        links: [
          { href: '/fluid-dynamics', label: '\u0627\u0646\u062e\u0641\u0627\u0636 \u0627\u0644\u0636\u063a\u0637' },
          { href: '/thermal-expansion', label: '\u0646\u0642\u0644 \u0627\u0644\u062d\u0631\u0627\u0631\u0629' },
          { href: '/pumps', label: '\u0623\u062f\u0627\u0621 \u0627\u0644\u0645\u0636\u062e\u0629' },
          { href: '/reducer-lubrication', label: '\u062a\u0632\u064a\u064a\u062a \u0635\u0646\u062f\u0648\u0642 \u0627\u0644\u062a\u0631\u0633' },
          { href: '/naval-hydrostatics', label: '\u0627\u0644\u0647\u064a\u062f\u0631\u0648\u0633\u062a\u0627\u062a\u064a\u0643\u0627 \u0627\u0644\u0628\u062d\u0631\u064a\u0629' },
        ],
      },
      {
        title: '\u0643\u0647\u0631\u0628\u0627\u0626\u064a',
        links: [
          { href: '/three-phase-power', label: '\u062d\u0627\u0633\u0628\u0629 \u0627\u0644\u0642\u062f\u0631\u0629' },
          { href: '/ohms-law', label: '\u0642\u0627\u0646\u0648\u0646 \u0623\u0648\u0645' },
          { href: '/voltage-drop', label: '\u0627\u0646\u062e\u0641\u0627\u0636 \u0627\u0644\u062c\u0647\u062f' },
          { href: '/3-phase-power', label: '\u0627\u0644\u0642\u062f\u0631\u0629 \u062b\u0644\u0627\u062b\u064a\u0629 \u0627\u0644\u0623\u0637\u0648\u0627\u0644' },
          { href: '/filter-design', label: '\u062a\u0635\u0645\u064a\u0645 \u0627\u0644\u0645\u0631\u0634\u062d\u0627\u062a' },
        ],
      },
      {
        title: '\u0639\u0644\u0648\u0645',
        links: [
          { href: '/physics-solver', label: '\u062d\u0627\u0644\u0644 \u0641\u064a\u0632\u064a\u0627\u0621 CAS' },
          { href: '/failure-prediction', label: '\u062a\u0648\u0642\u0639 \u0627\u0644\u0639\u0637\u0644' },
          { href: '/failure-diagnosis', label: '\u062a\u0634\u062e\u064a\u0635 \u0627\u0644\u0639\u0637\u0644' },
          { href: '/biology-genetics', label: '\u0639\u0644\u0645 \u0627\u0644\u062c\u064a\u0646\u064a\u0627\u062a \u0627\u0644\u0633\u0643\u0627\u0646\u064a' },
          { href: '/digital-logic', label: '\u0645\u062e\u062a\u0628\u0631 \u0627\u0644\u0645\u0646\u0637\u0642 \u0627\u0644\u0631\u0642\u0645\u064a' },
        ],
      },
      {
        title: '\u0627\u0644\u0645\u0646\u0635\u0629',
        links: [
          { href: '/academy?tab=calculators', label: '\u062c\u0645\u064a\u0639 \u0627\u0644\u062d\u0627\u0633\u0628\u0627\u062a' },
          { href: '/workspace', label: '\u0641\u062a\u062d \u0645\u0633\u0627\u062d \u0627\u0644\u0639\u0645\u0644' },
          { href: '/academy', label: '\u0623\u0643\u0627\u062f\u064a\u0645\u064a\u0629 \u0627\u0644\u0647\u0646\u062f\u0633\u0629' },
          { href: '/', label: '\u0627\u0644\u0631\u0626\u064a\u0633\u064a\u0629' },
        ],
      },
    ],
    copyright: '\u00a9 2026 AluCalc Advanced Engineering Systems',
  },

};
