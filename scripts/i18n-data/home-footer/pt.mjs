/** Home page footer — Portuguese */
export default {
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
  footerColumns: [
    {
      title: "Mecânica",
      links: [
        { href: "/bolt-torque", label: "Calculadora de torque de aperto" },
        { href: "/bearings", label: "Vida útil de rolamentos (ISO 281)" },
        { href: "/gears", label: "Calculadora de relação de engrenagens" },
        { href: "/shafts", label: "Diâmetro do eixo" },
        { href: "/hooke-law", label: "Constante da mola" },
        { href: "/motor-selection-std", label: "Potência do motor" },
      ],
    },
    {
      title: "Estrutural",
      links: [
        { href: "/beam-deflection", label: "Deflexão de viga" },
        { href: "/concrete-reinforcement", label: "Armadura de betão" },
        { href: "/simulation-fea", label: "Análise FEA" },
        { href: "/topology-optimization", label: "Otimização topológica" },
        { href: "/machine-assembly", label: "Montagem de máquinas" },
      ],
    },
    {
      title: "Fluidos e térmica",
      links: [
        { href: "/fluid-dynamics", label: "Queda de pressão" },
        { href: "/thermal-expansion", label: "Transferência de calor" },
        { href: "/pumps", label: "Desempenho da bomba" },
        { href: "/reducer-lubrication", label: "Lubrificação de redutores" },
        { href: "/naval-hydrostatics", label: "Hidrostática naval" },
      ],
    },
    {
      title: "Elétrica",
      links: [
        { href: "/three-phase-power", label: "Calculadora de potência" },
        { href: "/ohms-law", label: "Lei de Ohm" },
        { href: "/voltage-drop", label: "Queda de tensão" },
        { href: "/3-phase-power", label: "Potência trifásica" },
        { href: "/filter-design", label: "Projeto de filtros" },
      ],
    },
    {
      title: "Ciências",
      links: [
        { href: "/physics-solver", label: "Solucionador CAS de física" },
        { href: "/failure-prediction", label: "Previsão de falhas" },
        { href: "/failure-diagnosis", label: "Diagnóstico de falhas" },
        { href: "/biology-genetics", label: "Genética de populações" },
        { href: "/digital-logic", label: "Laboratório de lógica digital" },
      ],
    },
    {
      title: "Plataforma",
      links: [
        { href: "/academy?tab=calculators", label: "Todas as calculadoras" },
        { href: "/workspace", label: "Abrir workspace" },
        { href: "/academy", label: "Academia de engenharia" },
        { href: "/", label: "Início" },
      ],
    },
  ],
  copyright: "© 2026 AluCalc Advanced Engineering Systems",
};
