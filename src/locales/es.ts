export default {
    osName: "AluCalc OS",
    version: "v5.0",
    welcomeTitle: "Elige tu",
    welcomeHighlight: "Espacio de trabajo",
    welcomeDesc: "Selecciona tu interfaz principal. Puedes cambiar en cualquier momento.",
    systemInit: "Sistema Inicializado",
    bootInit: "Inicializando el tiempo de ejecución de ingeniería...",
    bootLoading: "Cargando ALU_CORE, FLOW_ENGINE, CAD_RT",
    bootMounting: "Montando el sistema de archivos virtual...",
    bootReady: "Sistema listo.",
    systemReadyStatus: "Sistema listo",
    noActiveNodes: "No hay nodos de cálculo activos en el flujo",
    confirmClearWorkspace: "¿Limpiar espacio de trabajo?",
    nodeTypeNote: "Nota",
    nodeTypeMedia: "Medios",
    nodeTypeNode: "Nodo",
    flowTitle: "Motor de Flujo",
    flowDesc: "Lienzo infinito para cálculos de ingeniería. Conecta nodos, crea flujos y encadena fórmulas.",
    cadTitle: "Estudio CAD",
    cadDesc: "Dibujo 2D profesional con líneas, círculos, cotas y precisión de cuadrícula.",
    deskTitle: "Escritorio Creativo",
    deskDesc: "Pizarra de forma libre para la lluvia de ideas. Dibuja, arrastra archivos y organiza ideas.",
    feaTitle: "Sistema FEA",
    projects: {
        title: "Proyectos",
        newProject: "Nuevo Proyecto",
        allProjects: "Todos los Proyectos",
        noProjects: "Aún no hay proyectos",
        createFirst: "Crear Primer Proyecto",
        projectName: "Nombre del Proyecto",
        description: "Descripción (opcional)",
        placeholderName: "Mi Proyecto de Ingeniería",
        placeholderDesc: "Breve descripción...",
        exportProject: "Exportar Proyecto",
        importProject: "Importar Proyecto",
        duplicate: "Duplicar",
        delete: "Eliminar",
        updatedAt: "Actualizado",
        workspacesCount: "espacio(s) de trabajo"
    },
    welding: {
        title: "Calculadora de Soldadura",
        subtitle: "Aporte Térmico • Resistencia de la Unión • AWS D1.1",
        process: "Proceso de Soldadura",
        jointType: "Tipo de Unión",
        parameters: "Parámetros de Soldadura",
        electrodes: "Selección de Electrodo / Alambre",
        processes: {
            mig: "MIG/MAG (GMAW)",
            tig: "TIG (GTAW)",
            smaw: "Electrodo (SMAW)",
            fcaw: "Núcleo de Fundente (FCAW)",
            saw: "Arco Sumergido (SAW)",
            mma: "Electrodo revestido (SMAW)",
            mag: "MAG (GMAW)"
        },
        joints: {
            fillet: "Soldadura de Filete",
            doubleFillet: "Doble Filete",
            butt: "Soldadura a Tope (Cuadrada)",
            vGroove: "Ranura en V",
            uGroove: "Ranura en U",
            jGroove: "Ranura en J",
            lap: "Junta de Traslape",
            tee: "Junta en T",
            corner: "Junta de Esquina"
        },
        profiles: "Perfiles de Material",
        materials: "Materiales",
        material1: "Material 1",
        material2: "Material 2",
        dissimilarWarning: "Materiales diferentes: {m1} + {m2} - Puede requerir material de aporte especial",
        heatInput: "Aporte Térmico",
        weldStress: "Esfuerzo de Soldadura",
        throatArea: "Área de la Garganta",
        minWeldSize: "Tamaño Mín. de Soldadura",
        jointEfficiency: "Eficiencia de la Unión",
        preheat: "Precalentamiento",
        fillerMetal: "Est. de Metal de Aporte",
        efficiency: "Eficiencia (η)",
        depositionRate: "Tasa de Deposición",
        positions: "Posiciones",
        thermodynamics: "Termodinámica de la Soldadura",
        heatFormula: "Fórmula de Aporte Térmico",
        carbonEquivalent: "Equivalente de Carbono (CE)",
        notRequired: "No Requerido",
        inputs: {
            current: "Corriente",
            voltage: "Voltaje",
            speed: "Velocidad",
            thickness: "Espesor (t)",
            legSize: "Tamaño del Cateto (a)",
            length: "Longitud (L)",
            load: "Carga (F)",
            grooveAngle: "Ángulo de Ranura"
        },
        dims: {
            width: "Ancho",
            thick: "Espesor",
            diameter: "Diámetro",
            wallThick: "Espesor de Pared",
            height: "Altura",
            flange: "Ala",
            webT: "Espesor de Alma",
            leg: "Cateto"
        },
        materialSteel: "Acero",
        materialStainless: "Acero Inoxidable",
        materialAluminum: "Aluminio",
        materialCopper: "Cobre",
        materialBrass: "Latón",
        heatFormulaDesc: "Energía transferida por unidad de longitud de soldadura. Controla la velocidad de enfriamiento y las propiedades metalúrgicas.",
        carbonEquivalentDesc: "Predice la templabilidad y la susceptibilidad al agrietamiento en frío. CE > 0.40% normalmente requiere precalentamiento.",
        power: "Potencia",
        geometry: "Geometría",
        simulationLabel: "SIMULACIÓN DE JUNTA DE SOLDADURA",
        setup: "Configuración del Proceso"
    },
    viewCad: "CAD",
    viewFea: "FEA",
    viewDesk: "ESCR.",
    startMenu: "Menú de Inicio",
    allApps: "Todas las Aplicaciones",
    searchApps: "Buscar aplicaciones...",
    pinned: "Módulos Anclados",
    settings: "Configuración",
    appearance: "Apariencia",
    language: "Idioma",
    typography: "Tipografía",
    about: "Sobre el OS",
    securityVerified: "Seguridad Verificada",
    appearanceDesc: "Personaliza la identidad visual de tu estación de trabajo.",
    languageDesc: "Selecciona tus ajustes regionales preferidos y el idioma de la interfaz.",
    typographyDesc: "Optimiza la legibilidad para tu entorno técnico.",
    fontFamily: "Familia de Fuentes",
    fontSizeKey: "Tamaño de Fuente",
    fontPreviewLabel: "Vista Previa",
    fontPreviewText: "El veloz murciélago hindú comía feliz cardillo y escabeche. 1234567890. Todos los cálculos de ingeniería están sujetos a reglas de validación.",
    systemVersion: "Versión del Espacio de Trabajo de Ingeniería 5.0.0-Estable",
    architecture: "Arquitectura",
    archName: "B-Model Cloud Hybrid",
    engineStatus: "Estado del Motor",
    toggleDevMode: "Alternar modo desarrollador",
    statusOptimized: "OPTIMIZADO",
    localeLatency: "Latencia de Localización",
    latencyValue: "2.4ms (Cache Hit)",
    aboutDesc: "Diseñado para ingeniería profesional de aluminio y análisis estructural.",
    themeDark: "Cyber Dark",
    themeLight: "Clean Light",
    themePaper: "Blueprint",
    themeSea: "Deep Sea",
    themeSky: "Open Sky",
    themeDarkDesc: "Alto contraste, baja fatiga",
    themeLightDesc: "Optimizado para luz diurna",
    themePaperDesc: "Estética de ingeniería",
    themeSeaDesc: "Tonos oscuros suaves",
    themeSkyDesc: "Aireado y minimalista",
    languageEn: "Inglés",
    languageTr: "Turco",
    languageDe: "Alemán",
    languageEs: "Español",
    languageZh: "Chino",
    languageJa: "Japonés",
    languageKo: "Coreano",
    languageAr: "Árabe",
    modules: {
        calculator: {
            title: "Calculadora Científica"
        },
        "unit-converter": {
            title: "Convertidor de Unidades"
        },
        "ai-copilot": {
            title: "Aegis AI"
        },
        "file-explorer": {
            title: "Explorador de Archivos"
        },
        settings: {
            title: "Configuración"
        },
        handbook: {
            title: "Manual de Ingeniería"
        },
        terminal: {
            title: "Terminal"
        },
        "profile-weight": {
            title: "Peso de Perfil"
        },
        "gears-bearings": {
            title: "Calculadora de Engranajes/Cojinetes"
        },
        welding: {
            title: "Calculadora de Soldadura"
        },
        fasteners: {
            title: "Calculadora de Sujetadores"
        },
        "materials-db": {
            title: "BD de Materiales"
        },
        "cutting-optimizer": {
            title: "Optimizador de Corte"
        },
        "music-player": {
            title: "Reproductor de Música"
        },
        "belt-drive": {
            title: "Transmisión por Correa"
        },
        "beam-deflection": {
            title: "Deflexión de Vigas"
        },
        bearings: {
            title: "Vida útil del rodamiento (L10)"
        },
        "bolt-stress": {
            title: "Esfuerzo de Tracción de Perno"
        },
        "column-buckling": {
            title: "Pandeo de Columnas (Euler)"
        },
        "fits-tolerances": {
            title: "Ajustes y Tolerancias"
        },
        "fluid-flow": {
            title: "Caída de Presión en Tubería"
        },
        "gear-spur": {
            title: "Engranaje Recto"
        },
        "hydraulic-cylinder": {
            title: "Cilindro Hidráulico"
        },
        "ohms-law": {
            title: "Ley de Ohm"
        },
        pumps: {
            title: "Bomba Centrífuga"
        },
        "sheet-metal": {
            title: "Doblado de Chapa"
        },
        "spring-compression": {
            title: "Muelle de Compresión"
        },
        "strength-analysis": {
            title: "Análisis de Resistencia"
        },
        "thread-geometry": {
            title: "Geometría de Rosca"
        },
        "torsion-shaft": {
            title: "Torsión (Eje)"
        },
        "vat-calculator": {
            title: "Calculadora de IVA"
        },
        "voltage-drop": {
            title: "Caída de Tensión"
        },
        "welding-fillet": {
            title: "Resistencia de Soldadura de Filete"
        },
        "welding-heat": {
            title: "Entrada de Calor de Soldadura"
        },
        "analytics-dashboard": {
            title: "Analítica"
        },
        "engineering-notes": {
            title: "Notas de ingeniería"
        },
        "cad-editor": {
            title: "Editor CAD"
        },
        "sketch-pad": {
            title: "Bloc de dibujo"
        },
        "periodic-table": {
            title: "Tabla periódica"
        },
        "simulation-fea": {
            title: "Simulación FEA"
        },
        "manufacturing-sandbox": {
            title: "Mfg. Sandbox"
        },
        "engineering-selection": {
            title: "Engineering Selection"
        },
        "thermal-expansion": {
            title: "Expansión térmica"
        },
        "project-manager": {
            title: "LDM del proyecto"
        },
        "cost-estimator": {
            title: "Motor de costes"
        },
        "manufacturing-readiness": {
            title: "Mfg Readiness Analyzer"
        },
        "topology-optimization": {
            title: "Diseño generativo"
        },
        "machine-assembly": {
            title: "Ensamblaje de máquina"
        },
        "failure-prediction": {
            title: "Failure Predictor"
        },
        "fluid-dynamics": {
            title: "Dinámica de fluidos"
        },
        "bolt-torque": {
            title: "Bolt Torque & Preload"
        },
        "chain-drive": {
            title: "Transmisión por cadena de rodillos"
        },
        "physics-kinematics": {
            title: "Physics & Kinematics"
        },
        "chemistry-reactions": {
            title: "Chemistry Lab"
        },
        "biology-genetics": {
            title: "Biology & Genetics"
        },
        "cs-algorithms": {
            title: "CS & Algorithms"
        },
        "aerospace-dynamics": {
            title: "Aerospace Dynamics"
        },
        "naval-hydrostatics": {
            title: "Naval Architecture"
        },
        "three-phase-power": {
            title: "3-Phase Power Analytics"
        },
        "digital-logic": {
            title: "Digital Logic Lab"
        },
        "filter-design": {
            title: "Electronic Filter Design"
        },
        "failure-diagnosis": {
            title: "Failure Analysis Tool"
        },
        "fatigue-advanced": {
            title: "Fatigue Life (Advanced)"
        },
        "planetary-gearbox": {
            title: "Planetary Gearbox Solver"
        },
        "material-selector-ai": {
            title: "Material Selector AI"
        },
        "materials-explorer": {
            title: "Materials Intelligence"
        },
        "physics-solver": {
            title: "Physics CAS Solver"
        },
        "gearbox-design": {
            title: "Gearbox Design Engine"
        },
        "motor-selection-std": {
            title: "Motor Selection Engine"
        },
        "worm-gear": {
            title: "Worm Gear Design"
        },
        "planetary-gear": {
            title: "Planetary Gear Train"
        },
        "cam-follower": {
            title: "Cam & Follower Design"
        },
        "flywheel-design": {
            title: "Flywheel Energy Storage"
        },
        "concrete-beam-design": {
            title: "Concrete Beam (ACI 318)"
        },
        "foundation-bearing": {
            title: "Foundation Bearing Capacity"
        },
        "transformer-design": {
            title: "Transformer Design"
        },
        "motor-efficiency": {
            title: "Motor Efficiency & Load"
        },
        "heat-exchanger": {
            title: "Heat Exchanger Sizing"
        },
        "sound-meter": {
            title: "Sound Decibel Meter"
        },
        clinometer: {
            title: "Clinometer / Height Finder"
        },
        "gps-surveyor": {
            title: "GPS Surveyor & Compass"
        },
        "hardness-converter": {
            title: "Hardness & Strength Converter"
        }
    },
    moduleHints: {
        calculator: "Cálculos matemáticos",
        "unit-converter": "Unidades de ingeniería",
        "ai-copilot": "Aegis AI",
        "file-explorer": "Archivos de sistema",
        settings: "Preferencias del SO",
        handbook: "Fórmulas y datos",
        terminal: "Línea de comandos",
        "profile-weight": "Peso de perfiles",
        "gears-bearings": "Engranajes y rodamientos",
        welding: "Resistencia de soldadura",
        fasteners: "Torque y precarga",
        "materials-db": "Propiedades de materiales",
        "cutting-optimizer": "Optimización de cortes",
        "music-player": "Audio local y web",
        "belt-drive": "Poleas y correas",
        "thermal-expansion": "Expansión térmica y cambio dimensional",
        "cost-estimator": "Predict manufacturing costs in real-time",
        "manufacturing-readiness": "Analyze part for CNC & 3D print readiness",
        "topology-optimization": "AI-driven generative geometry reduction",
        "machine-assembly": "Pre-built mechanical system libraries",
        "failure-prediction": "Stress and fatigue failure AI simulation",
        "fluid-dynamics": "Pipe flow, pressure drop & Reynolds number",
        "bolt-torque": "ISO standard fastening torque & preload calculator",
        "chain-drive": "ISO 606 roller chain sprocket ratio, length & tension",
        "physics-kinematics": "Projectile motion and rigid body dynamics",
        "chemistry-reactions": "Reaction balancing and chemical computing",
        "biology-genetics": "DNA sequencing and bioinformatics assistant",
        "cs-algorithms": "Algorithm visualization",
        "aerospace-dynamics": "Flight envelope and aerodynamic modeling",
        "naval-hydrostatics": "Ship stability and hydrostatic curves",
        "three-phase-power": "Industrial 3-phase system analysis and vector diagrams",
        "digital-logic": "Logic gate simulation and truth tables",
        "filter-design": "Active and passive RC filter frequency response (Bode)",
        "failure-diagnosis": "Probabilistic failure analysis and root cause diagnosis",
        "fatigue-advanced": "High-cycle fatigue and mean stress correction (Haigh)",
        "planetary-gearbox": "Multi-stage planetary gear kinematics and Willis equation",
        "material-selector-ai": "AI-driven material selection engine",
        "materials-explorer": "Curation of material informatics and properties",
        "analytics-dashboard": "Project metrics and usage analytics",
        "engineering-notes": "Field notes and engineering records",
        "physics-solver": "Symbolic CAS physics engine for dynamic equations",
        "gearbox-design": "Complete gear train design and analysis suite",
        "motor-selection-std": "Standard motor curves and torque-speed matching",
        "worm-gear": "Worm gear geometry, efficiency & sliding speed",
        "planetary-gear": "Planetary gear ratios, torque & assembly validation",
        "cam-follower": "Cam displacement, velocity & acceleration analysis",
        "flywheel-design": "Flywheel energy storage, size & centrifugal stress",
        "concrete-beam-design": "Reinforced concrete beam bending capacity (ACI 318)",
        "foundation-bearing": "Ultimate & allowable bearing capacity of soils",
        "transformer-design": "Transformer core area, windings & turns ratio",
        "motor-efficiency": "3-phase motor load factor, efficiency & CO2 footprint",
        "heat-exchanger": "Heat exchanger LMTD, thermal power & surface area",
        "hydraulic-cylinder": "Hydraulic cylinder bore, rod buckling & volume",
        "sound-meter": "Real-time decibel meter & frequency analyzer",
        clinometer: "Trigonometric slope & height analyzer using gyroscope",
        "gps-surveyor": "Real-time GPS coordinates, elevation tracking & digital compass",
        "hardness-converter": "Metal hardness scales (HB, HRC, HRB, HV) and tensile strength conversions"
    },
    categories: {
        mechanical: "Mecánica",
        structural: "Estructural",
        utilities: "Utilidades",
        reference: "Referencia",
        science: "Ciencias",
        software: "Software",
        civil: "Civil",
        finance: "Finanzas",
        other: "Otro"
    },
    ribbon: {
        theme: "Tema",
        guide: "Guía",
        variables: "Variables",
        select: "Seleccionar",
        pan: "Encuadre",
        line: "Línea (L)",
        polyline: "Polilínea (PL)",
        rectangle: "Rectángulo (REC)",
        circle: "Círculo (C)",
        copy: "Copiar (CO)",
        rotate: "Rotar (RO)",
        mirror: "Simetría (MI)",
        trim: "Recortar (TR)",
        extend: "Alargar (EX)",
        offset: "Desfase (O)",
        fillet: "Empalme (F)",
        smartDim: "Cota Inteligente",
        linear: "Lineal",
        text: "Texto",
        coincident: "Coincidente",
        horizontal: "Horiz",
        vertical: "Vert",
        parallel: "Paralela",
        perpendicular: "Perp",
        tangent: "Tangente",
        equal: "Igual",
        angle: "Ángulo",
        dist: "Dist",
        undo: "Deshacer",
        redo: "Rehacer",
        zoomIn: "Acercar",
        zoomOut: "Alejar",
        zoomExtents: "Extensión",
        osnap: "OSNAP (F3)",
        grid: "Rejilla (F7)",
        importDxf: "Importar DXF",
        exportDxf: "DXF 2D",
        exportStep: "STEP 3D",
        clearAll: "Borrar todo",
        groupDraw: "Dibujo",
        groupModify: "Modificar",
        groupDim: "Cotas",
        groupConstraints: "Restricciones",
        groupExport: "Exportar",
        groupPaint: "Pintar",
        groupContent: "Contenido",
        labelWorkstation: "ESTACIÓN DE INGENIERÍA",
        groupCanvas: "Lienzo",
        groupJob: "Control de trabajo",
        groupOutput: "Salida",
        labelCreativeDesk: "MESA CREATIVA",
        labelMfgCam: "FABRICACIÓN / CAM",
        labelFeaSim: "FEA / SIMULACIÓN",
        labelPen: "Lápiz",
        labelMarker: "Rotulador",
        labelEraser: "Borrador",
        labelArrow: "Flecha",
        labelRect: "Rect",
        labelCircle: "Círculo",
        labelClear: "Borrar",
        labelNote: "Nota",
        labelVideo: "Vídeo",
        labelMusic: "Música",
        labelImage: "Imagen",
        labelExcel: "Excel",
        labelWord: "Word",
        labelPpt: "PPT",
        labelPdf: "PDF",
        labelStartNesting: "Iniciar nesting",
        labelResetJob: "Reiniciar trabajo",
        labelFullReport: "Informe completo",
        labelExportNc: "Exportar NC",
        labelSolverReady: "Solver listo",
        labelMatrixSparse: "Matriz: dispersa",
        labelStrokeColor: "Color de trazo",
        defaultNote: "📌 Nueva nota",
        promptYoutubeUrl: "Introduzca URL de YouTube:",
        confirmClearSketches: "¿Borrar todos los bocetos?",
        confirmClearFlow: "¿Seguro que desea vaciar todo el espacio Flow? Esta acción no se puede deshacer.",
        confirmDeleteWindow: "¿Cerrar esta ventana?",
        alertSelect2: "Seleccione al menos 2 entidades (puntos o líneas) para restringir.",
        exportFailed: "Error de exportación",
        dxfExportFailed: "Error al exportar DXF",
        stepExportFailed: "Error al exportar STEP",
        noGeometry: "No hay geometría para exportar. Dibuje primero.",
        noExportableGeometry: "No hay geometría exportable (solo líneas y círculos).",
        stepExportComplete: "Exportación STEP completa: {count} entidades exportadas.",
        importedEntities: "{count} entidades importadas.",
        labelNewNote: "Nueva nota",
        comingSoon: "Próximamente...",
        handbookPdf: "ManualDeIngenieria.pdf",
        newsFeedTitle: "Noticias de ingeniería",
        newsItem1: "Precios del aluminio +2 %",
        newsItem2: "Nueva norma ISO 898-1 publicada",
        newsItem3: "AluCalc V2 lanzado"
    },
    palette: {
        categories: {
            input: "Entrada y Constantes",
            mechanical: "Núcleo Mecánico",
            chemical: "Química / Termo",
            validation: "Validación / ISO",
            visual: "Visualizadores",
            export: "Salida / Informes"
        },
        searchPlaceholder: "Buscar nodos..."
    },
    calcCommon: {
        length: {
            label: "Longitud (L)"
        },
        width: {
            label: "Ancho (w)"
        },
        height: {
            label: "Altura (h)"
        },
        thickness: {
            label: "Espesor (t)"
        },
        radius: {
            label: "Radio (R)",
            desc: "Radio de doblez interno"
        },
        angle: {
            label: "Ángulo (θ)"
        },
        force: {
            label: "Fuerza (F)"
        },
        torque: {
            label: "Torque (T)"
        },
        pressure: {
            label: "Presión (P)"
        },
        velocity: {
            label: "Velocidad (v)"
        },
        diameter: {
            label: "Diámetro (d)"
        },
        density: {
            label: "Densidad (ρ)"
        },
        mass: {
            label: "Masa (m)"
        },
        volume: {
            label: "Volumen (V)"
        },
        area: {
            label: "Área (A)"
        },
        material: {
            label: "Tipo de material"
        },
        yieldStrength: {
            label: "Límite elástico (Sy)"
        },
        Sy: {
            label: "Límite elástico (Sy)"
        },
        safetyFactor: {
            label: "Factor de seguridad"
        },
        SF: {
            label: "Factor de seguridad (SF)"
        },
        deflection: {
            label: "Deflexión"
        },
        bendingStress: {
            label: "Tensión de flexión"
        },
        sigmaBending: {
            label: "Tensión de flexión (σb)"
        },
        m: {
            label: "Módulo (m)",
            desc: "Tamaño del módulo"
        },
        z1: {
            label: "Dientes de piñón (z₁)"
        },
        z2: {
            label: "Dientes de engranaje (z₂)"
        },
        alpha: {
            label: "Ángulo de presión (α)"
        },
        b: {
            label: "Ancho de cara (b)"
        },
        T: {
            label: "Torque (T)"
        },
        d: {
            label: "Diámetro (d)"
        },
        p: {
            label: "Paso (p)"
        },
        k: {
            label: "Altura de cabeza (k)"
        },
        s: {
            label: "Ancho de hexágono (s)"
        },
        drill: {
            label: "Ø broca"
        },
        dh: {
            label: "Ø agujero (dh)"
        },
        ix: {
            label: "Inercia Ix",
            desc: "Momento de inercia respecto al eje X"
        },
        iy: {
            label: "Inercia Iy",
            desc: "Momento de inercia respecto al eje Y"
        },
        slot: {
            label: "Tamaño de ranura"
        }
    },
    close: "Cerrar",
    minimize: "Minimizar",
    maximize: "Maximizar",
    save: "Guardar",
    cancel: "Cancelar",
    apply: "Aplicar",
    ok: "Aceptar",
    error: "Error",
    handbook: {
        title: "Biblioteca de Ingeniería",
        searchPlaceholder: "Buscar en la biblioteca...",
        results: "resultados",
        noResults: "No se encontraron resultados.",
        description: "Un repositorio completo y consultable de estándares mecánicos, tolerancias y datos de diseño.",
        featured: "Destacado",
        openTable: "Abrir tabla",
        mathFormula: "Fórmula matemática",
        readEntry: "Leer entrada",
        viewAll: "Ver todo",
        viewDetails: "Ver detalles",
        categories: "Categorías de la biblioteca",
        shortcuts: {
            isoTolerances: "Tolerancias ISO",
            isoTolerancesDesc: "Dimensiones lineales y límites",
            fasteners: "Sujetadores y Roscas",
            fastenersDesc: "Series M, UN, G y grados de pernos",
            materials: "Propiedades de Materiales",
            materialsDesc: "Densidades, límite elástico (Re)",
            mohr: "Círculo de Mohr",
            mohrDesc: "Esfuerzos principales y deformación 2D",
            beams: "Deflexión de Vigas",
            beamsDesc: "Fórmulas para vigas fijas y simples",
            roughness: "Rugosidad Superficial",
            roughnessDesc: "Valores Ra y mecanizado"
        }
    },
    variables: {
        title: "VARIABLES DEL PROYECTO",
        addVariable: "Añadir Variable",
        name: "NOMBRE",
        value: "VALOR",
        unit: "UNIDAD",
        description: "DESCRIPCIÓN",
        placeholderName: "NombreVar",
        placeholderDesc: "Descripción opcional...",
        noVariables: "No hay variables globales definidas. Haga clic en \"Añadir Variable\" para crear una."
    },
    termPlaceholder: "Escribe un comando... (intenta 'help')",
    termPrefix: "AluCalc ❯",
    viewFlow: "FLOW",
    searchResults: "Resultados de búsqueda",
    categoryOther: "Otro",
    userPro: "AluCalc Professional",
    shutDown: "Apagar",
    noModulesFound: "No se encontraron módulos",
    noModulesHint: "Pruebe a ajustar la búsqueda.",
    disciplinesLabel: "Disciplinas",
    languageFr: "Francés",
    languageIt: "Italiano",
    languagePt: "Portugués",
    languageRu: "Ruso",
    featureTree: "Árbol de operaciones",
    sketches: "Bocetos",
    bodies: "Sólidos",
    constraints: "Restricciones",
    parameters: "Parámetros",
    noBodies: "Aún no hay sólidos",
    dofLabel: "GDL",
    fullyConstrained: "Totalmente restringido",
    overConstrained: "Sobre restringido",
    underConstrained: "Sub restringido",
    addBody: "Añadir sólido",
    parametersTitle: "PARÁMETROS",
    resultsTitle: "RESULTADOS",
    fixInputs: "FIJAR ENTRADAS",
    switch2D: "CAMBIAR A 2D",
    switch3D: "CAMBIAR A 3D",
    quickSelect: "SELECCIÓN RÁPIDA",
    varLabel: "VAR",
    dbLabel: "DB",
    selectStandard: "Seleccionar norma...",
    closeAll: "Cerrar todas las apps",
    feedbackTitle: "Contacto y comentarios",
    costTitle: "Estimador de costes",
    costDesc: "Desglose de costes de fabricación",
    costBom: "LDM de materiales",
    costOps: "Operaciones",
    costOverhead: "Gastos generales %",
    costMargin: "Margen %",
    costBatch: "Tamaño de lote",
    costTotal: "Coste total",
    costUnit: "Precio unitario"
} as const;
