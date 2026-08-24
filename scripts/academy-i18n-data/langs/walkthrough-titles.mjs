/** Shared engineName-only walkthrough titles for de/es/fr. */
export const WALKTHROUGH_TITLES = {
  de: {
    'engineering-units-and-standards': 'Einheitenumrechner-Kernel',
    'fundamentals-of-statics': 'Gleichgewichtslöser',
    'introduction-to-machine-elements': 'Maschinenelemente-Karte',
    'thread-geometry-standards': 'Gewindegeometrie-Engine',
    'how-to-calculate-bolt-torque': 'VDI 2230 Schrauben-Engine',
    'bearing-life-calculation-explained': 'ISO 281 Lagerlebensdauer-Engine',
    'motor-power-calculation': 'Kraftübertragungs-Engine',
    'mechanics-of-materials-fundamentals': 'Spannungs-Dehnungs-Engine',
    'mohrs-circle-stress-analysis': 'Mohr-Kreis-Kernel',
    'torsion-and-buckling-mechanics': 'Stabilitäts-Engine',
    'beam-deflection-formula-explained': 'Balkendurchbiegungs-Engine',
    'pressure-drop-calculation-guide': 'Darcy-Weisbach Strömungs-Engine',
    'chip-breaker-logic': 'Bearbeitungsparameter-Engine',
  },
  es: {
    'engineering-units-and-standards': 'Núcleo convertidor de unidades',
    'fundamentals-of-statics': 'Solucionador de equilibrio',
    'introduction-to-machine-elements': 'Mapa de elementos de máquina',
    'thread-geometry-standards': 'Motor de geometría de roscas',
    'how-to-calculate-bolt-torque': 'Motor de tornillería VDI 2230',
    'bearing-life-calculation-explained': 'Motor de vida útil ISO 281',
    'motor-power-calculation': 'Motor de transmisión de potencia',
    'mechanics-of-materials-fundamentals': 'Motor esfuerzo-deformación',
    'mohrs-circle-stress-analysis': 'Núcleo del círculo de Mohr',
    'torsion-and-buckling-mechanics': 'Motor de estabilidad',
    'beam-deflection-formula-explained': 'Motor de deflexión de vigas',
    'pressure-drop-calculation-guide': 'Motor de flujo Darcy-Weisbach',
    'chip-breaker-logic': 'Motor de parámetros de mecanizado',
  },
  fr: {
    'engineering-units-and-standards': 'Noyau convertisseur d\'unités',
    'fundamentals-of-statics': 'Solveur d\'équilibre',
    'introduction-to-machine-elements': 'Carte des éléments de machine',
    'thread-geometry-standards': 'Moteur de géométrie de filetage',
    'how-to-calculate-bolt-torque': 'Moteur de boulonnage VDI 2230',
    'bearing-life-calculation-explained': 'Moteur de durée de vie ISO 281',
    'motor-power-calculation': 'Moteur de transmission de puissance',
    'mechanics-of-materials-fundamentals': 'Moteur contrainte-déformation',
    'mohrs-circle-stress-analysis': 'Noyau du cercle de Mohr',
    'torsion-and-buckling-mechanics': 'Moteur de stabilité',
    'beam-deflection-formula-explained': 'Moteur de flèche de poutre',
    'pressure-drop-calculation-guide': 'Moteur d\'écoulement Darcy-Weisbach',
    'chip-breaker-logic': 'Moteur de paramètres d\'usinage',
  },
};

export function buildWalkthroughTitles(lang) {
  const titles = WALKTHROUGH_TITLES[lang] ?? {};
  return Object.fromEntries(
    Object.entries(titles).map(([slug, engineName]) => [slug, { engineName }]),
  );
}
