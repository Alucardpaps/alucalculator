/** Home page footer — German */
export default {
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
  footerColumns: [
    {
      title: "Mechanik",
      links: [
        { href: "/bolt-torque", label: "Schraubenanzugsmoment-Rechner" },
        { href: "/bearings", label: "Lagerlebensdauer (ISO 281)" },
        { href: "/gears", label: "Übersetzungsrechner" },
        { href: "/shafts", label: "Wellendurchmesser" },
        { href: "/hooke-law", label: "Federkonstante" },
        { href: "/motor-selection-std", label: "Motorleistung" },
      ],
    },
    {
      title: "Statik",
      links: [
        { href: "/beam-deflection", label: "Balkendurchbiegung" },
        { href: "/concrete-reinforcement", label: "Betonbewehrung" },
        { href: "/simulation-fea", label: "FEA-Analyse" },
        { href: "/topology-optimization", label: "Topologieoptimierung" },
        { href: "/machine-assembly", label: "Maschinenmontage" },
      ],
    },
    {
      title: "Strömung und Thermik",
      links: [
        { href: "/fluid-dynamics", label: "Druckverlust" },
        { href: "/thermal-expansion", label: "Wärmeübertragung" },
        { href: "/pumps", label: "Pumpenleistung" },
        { href: "/reducer-lubrication", label: "Getriebeschmierung" },
        { href: "/naval-hydrostatics", label: "Schiffshydrostatik" },
      ],
    },
    {
      title: "Elektrotechnik",
      links: [
        { href: "/three-phase-power", label: "Leistungsrechner" },
        { href: "/ohms-law", label: "Ohmsches Gesetz" },
        { href: "/voltage-drop", label: "Spannungsabfall" },
        { href: "/3-phase-power", label: "Drehstromleistung" },
        { href: "/filter-design", label: "Filterauslegung" },
      ],
    },
    {
      title: "Naturwissenschaften",
      links: [
        { href: "/physics-solver", label: "Physik-CAS-Löser" },
        { href: "/failure-prediction", label: "Ausfallvorhersage" },
        { href: "/failure-diagnosis", label: "Ausfalldiagnose" },
        { href: "/biology-genetics", label: "Populationsgenetik" },
        { href: "/digital-logic", label: "Digitale Logik-Labor" },
      ],
    },
    {
      title: "Plattform",
      links: [
        { href: "/academy?tab=calculators", label: "Alle Rechner" },
        { href: "/workspace", label: "Workspace öffnen" },
        { href: "/academy", label: "Ingenieur-Akademie" },
        { href: "/", label: "Startseite" },
      ],
    },
  ],
  copyright: "© 2026 AluCalc Advanced Engineering Systems",
};
