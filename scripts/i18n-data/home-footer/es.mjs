/** Home page footer — Spanish */
export default {
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
  footerColumns: [
    {
      title: "Mecánica",
      links: [
        { href: "/bolt-torque", label: "Calculadora de par de apriete" },
        { href: "/bearings", label: "Vida útil de rodamientos (ISO 281)" },
        { href: "/gears", label: "Calculadora de relación de engranajes" },
        { href: "/shafts", label: "Diámetro de eje" },
        { href: "/hooke-law", label: "Constante de resorte" },
        { href: "/motor-selection-std", label: "Potencia del motor" },
      ],
    },
    {
      title: "Estructural",
      links: [
        { href: "/beam-deflection", label: "Deflexión de viga" },
        { href: "/concrete-reinforcement", label: "Refuerzo de hormigón" },
        { href: "/simulation-fea", label: "Análisis FEA" },
        { href: "/topology-optimization", label: "Optimización topológica" },
        { href: "/machine-assembly", label: "Montaje de máquinas" },
      ],
    },
    {
      title: "Fluidos y térmica",
      links: [
        { href: "/fluid-dynamics", label: "Caída de presión" },
        { href: "/thermal-expansion", label: "Transferencia de calor" },
        { href: "/pumps", label: "Rendimiento de bombas" },
        { href: "/reducer-lubrication", label: "Lubricación de reductores" },
        { href: "/naval-hydrostatics", label: "Hidrostática naval" },
      ],
    },
    {
      title: "Eléctrica",
      links: [
        { href: "/three-phase-power", label: "Calculadora de potencia" },
        { href: "/ohms-law", label: "Ley de Ohm" },
        { href: "/voltage-drop", label: "Caída de tensión" },
        { href: "/3-phase-power", label: "Potencia trifásica" },
        { href: "/filter-design", label: "Diseño de filtros" },
      ],
    },
    {
      title: "Ciencias",
      links: [
        { href: "/physics-solver", label: "Solucionador CAS de física" },
        { href: "/failure-prediction", label: "Predicción de fallos" },
        { href: "/failure-diagnosis", label: "Diagnóstico de fallos" },
        { href: "/biology-genetics", label: "Genética de poblaciones" },
        { href: "/digital-logic", label: "Laboratorio de lógica digital" },
      ],
    },
    {
      title: "Plataforma",
      links: [
        { href: "/academy?tab=calculators", label: "Todas las calculadoras" },
        { href: "/workspace", label: "Abrir workspace" },
        { href: "/academy", label: "Academia de ingeniería" },
        { href: "/", label: "Inicio" },
      ],
    },
  ],
  copyright: "© 2026 AluCalc Advanced Engineering Systems",
};
