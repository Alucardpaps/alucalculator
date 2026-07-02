/** Home page footer — Italian */
export default {
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
  footerColumns: [
    {
      title: "Meccanica",
      links: [
        { href: "/bolt-torque", label: "Calcolatore coppia di serraggio" },
        { href: "/bearings", label: "Vita cuscinetti (ISO 281)" },
        { href: "/gears", label: "Calcolatore rapporto ingranaggi" },
        { href: "/shafts", label: "Diametro albero" },
        { href: "/hooke-law", label: "Costante elastica" },
        { href: "/motor-selection-std", label: "Potenza motore" },
      ],
    },
    {
      title: "Strutturale",
      links: [
        { href: "/beam-deflection", label: "Freccia trave" },
        { href: "/concrete-reinforcement", label: "Armatura calcestruzzo" },
        { href: "/simulation-fea", label: "Analisi FEA" },
        { href: "/topology-optimization", label: "Ottimizzazione topologica" },
        { href: "/machine-assembly", label: "Assemblaggio macchina" },
      ],
    },
    {
      title: "Fluidi e termica",
      links: [
        { href: "/fluid-dynamics", label: "Caduta di pressione" },
        { href: "/thermal-expansion", label: "Trasferimento termico" },
        { href: "/pumps", label: "Prestazioni pompa" },
        { href: "/reducer-lubrication", label: "Lubrificazione riduttore" },
        { href: "/naval-hydrostatics", label: "Idrostatica navale" },
      ],
    },
    {
      title: "Elettrica",
      links: [
        { href: "/three-phase-power", label: "Calcolatore di potenza" },
        { href: "/ohms-law", label: "Legge di Ohm" },
        { href: "/voltage-drop", label: "Caduta di tensione" },
        { href: "/3-phase-power", label: "Potenza trifase" },
        { href: "/filter-design", label: "Progettazione filtri" },
      ],
    },
    {
      title: "Scienze",
      links: [
        { href: "/physics-solver", label: "Solver CAS di fisica" },
        { href: "/failure-prediction", label: "Previsione guasti" },
        { href: "/failure-diagnosis", label: "Diagnosi guasti" },
        { href: "/biology-genetics", label: "Genetica delle popolazioni" },
        { href: "/digital-logic", label: "Laboratorio logica digitale" },
      ],
    },
    {
      title: "Piattaforma",
      links: [
        { href: "/academy?tab=calculators", label: "Tutti i calcolatori" },
        { href: "/workspace", label: "Apri workspace" },
        { href: "/academy", label: "Accademia ingegneristica" },
        { href: "/", label: "Home" },
      ],
    },
  ],
  copyright: "© 2026 AluCalc Advanced Engineering Systems",
};
