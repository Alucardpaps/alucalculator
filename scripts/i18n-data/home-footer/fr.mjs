/** Home page footer — French */
export default {
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
  footerColumns: [
    {
      title: "Mécanique",
      links: [
        { href: "/bolt-torque", label: "Calculateur de couple de serrage" },
        { href: "/bearings", label: "Durée de vie des roulements (ISO 281)" },
        { href: "/gears", label: "Calculateur de rapport d’engrenage" },
        { href: "/shafts", label: "Diamètre d’arbre" },
        { href: "/hooke-law", label: "Constante de ressort" },
        { href: "/motor-selection-std", label: "Puissance moteur" },
      ],
    },
    {
      title: "Structure",
      links: [
        { href: "/beam-deflection", label: "Flèche de poutre" },
        { href: "/concrete-reinforcement", label: "Armature béton" },
        { href: "/simulation-fea", label: "Analyse FEA" },
        { href: "/topology-optimization", label: "Optimisation topologique" },
        { href: "/machine-assembly", label: "Assemblage machine" },
      ],
    },
    {
      title: "Fluides et thermique",
      links: [
        { href: "/fluid-dynamics", label: "Perte de charge" },
        { href: "/thermal-expansion", label: "Transfert thermique" },
        { href: "/pumps", label: "Performance des pompes" },
        { href: "/reducer-lubrication", label: "Lubrification réducteur" },
        { href: "/naval-hydrostatics", label: "Hydrostatique navale" },
      ],
    },
    {
      title: "Électrique",
      links: [
        { href: "/three-phase-power", label: "Calculateur de puissance" },
        { href: "/ohms-law", label: "Loi d’Ohm" },
        { href: "/voltage-drop", label: "Chute de tension" },
        { href: "/3-phase-power", label: "Puissance triphasée" },
        { href: "/filter-design", label: "Conception de filtres" },
      ],
    },
    {
      title: "Sciences",
      links: [
        { href: "/physics-solver", label: "Solveur CAS de physique" },
        { href: "/failure-prediction", label: "Prédiction de défaillance" },
        { href: "/failure-diagnosis", label: "Diagnostic de défaillance" },
        { href: "/biology-genetics", label: "Génétique des populations" },
        { href: "/digital-logic", label: "Laboratoire de logique numérique" },
      ],
    },
    {
      title: "Plateforme",
      links: [
        { href: "/academy?tab=calculators", label: "Tous les calculateurs" },
        { href: "/workspace", label: "Ouvrir le workspace" },
        { href: "/academy", label: "Académie d’ingénierie" },
        { href: "/", label: "Accueil" },
      ],
    },
  ],
  copyright: "© 2026 AluCalc Advanced Engineering Systems",
};
