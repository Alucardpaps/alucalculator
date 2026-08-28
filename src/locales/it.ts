export default {
    osName: "AluCalc OS",
    version: "v5.0",
    welcomeTitle: "Scegli il tuo",
    welcomeHighlight: "Spazio di lavoro",
    welcomeDesc: "Seleziona l’interfaccia principale. Puoi cambiarla in qualsiasi momento.",
    systemInit: "Sistema inizializzato",
    bootInit: "Inizializzazione runtime ingegneristico…",
    bootLoading: "Caricamento ALU_CORE, FLOW_ENGINE, CAD_RT",
    bootMounting: "Montaggio file system virtuale…",
    bootReady: "Sistema pronto.",
    systemReadyStatus: "Sistema pronto",
    noActiveNodes: "Nessun nodo di calcolo attivo nel flow",
    confirmClearWorkspace: "Svuotare l’area di lavoro?",
    nodeTypeNote: "Nota",
    nodeTypeMedia: "Media",
    nodeTypeNode: "Nodo",
    flowTitle: "Flow Engine",
    flowDesc: "Canvas infinito per calcoli ingegneristici. Connetti nodi, crea flussi di dati e concatenazioni di formule.",
    cadTitle: "Studio CAD",
    cadDesc: "Disegno 2D professionale con linee, cerchi, quote e snap alla griglia.",
    deskTitle: "Scrivania creativa",
    deskDesc: "Lavagna libera per brainstorming. Schizza, trascina file e organizza visivamente.",
    feaTitle: "Sistema FEA",
    projects: {
        title: "Progetti",
        newProject: "Nuovo progetto",
        allProjects: "Tutti i progetti",
        noProjects: "Nessun progetto",
        createFirst: "Crea il primo progetto",
        projectName: "Nome progetto",
        description: "Descrizione (opzionale)",
        placeholderName: "Il mio progetto di ingegneria",
        placeholderDesc: "Descrizione breve…",
        exportProject: "Esporta progetto",
        importProject: "Importa progetto",
        duplicate: "Duplica",
        delete: "Elimina",
        updatedAt: "Aggiornato",
        workspacesCount: "spazio/i di lavoro"
    },
    viewFlow: "FLOW",
    welding: {
        title: "Calcolatore saldatura",
        subtitle: "Apporto termico • Resistenza giunto • AWS D1.1",
        process: "Processo di saldatura",
        jointType: "Tipo di giunto",
        parameters: "Parametri di saldatura",
        electrodes: "Elettrodo / Filo",
        processes: {
            mig: "MIG/MAG (GMAW)",
            tig: "TIG (GTAW)",
            smaw: "Elettrodo rivestito (SMAW)",
            fcaw: "Filo animato (FCAW)",
            saw: "Arco sommerso (SAW)",
            mma: "Elettrodo rivestito (SMAW)",
            mag: "MAG (GMAW)"
        },
        joints: {
            fillet: "Cordone d’angolo",
            doubleFillet: "Doppio cordone d’angolo",
            butt: "Saldatura di testa (piana)",
            vGroove: "Cianfrino a V",
            uGroove: "Cianfrino a U",
            jGroove: "Cianfrino a J",
            lap: "Giunto a sovrapposizione",
            tee: "Giunto a T",
            corner: "Giunto d’angolo"
        },
        profiles: "Profili materiale",
        materials: "Materiali",
        material1: "Materiale 1",
        material2: "Materiale 2",
        dissimilarWarning: "Materiali dissimili: {m1} + {m2} - potrebbe essere necessario un materiale d’apporto speciale",
        heatInput: "Apporto termico",
        weldStress: "Tensione di saldatura",
        throatArea: "Area di gola",
        minWeldSize: "Dimensione minima cordone",
        jointEfficiency: "Efficienza giunto",
        preheat: "Preriscaldo",
        fillerMetal: "Metallo d’apporto stimato",
        efficiency: "Efficienza (η)",
        depositionRate: "Velocità di deposito",
        positions: "Posizioni",
        thermodynamics: "Termodinamica di saldatura",
        heatFormula: "Formula apporto termico",
        carbonEquivalent: "Equivalente di carbonio (CE)",
        notRequired: "Non richiesto",
        inputs: {
            current: "Corrente",
            voltage: "Tensione",
            speed: "Velocità",
            thickness: "Spessore (t)",
            legSize: "Cateto (a)",
            length: "Lunghezza (L)",
            load: "Carico (F)",
            grooveAngle: "Angolo cianfrino"
        },
        dims: {
            width: "Larghezza",
            thick: "Spessore",
            diameter: "Diametro",
            wallThick: "Spessore parete",
            height: "Altezza",
            flange: "Ala",
            webT: "Anima",
            leg: "Cateto"
        },
        materialSteel: "Acciaio",
        materialStainless: "Acciaio inox",
        materialAluminum: "Alluminio",
        materialCopper: "Rame",
        materialBrass: "Ottone",
        heatFormulaDesc: "Energia trasferita per unità di lunghezza di saldatura. Controlla il raffreddamento e le proprietà metallurgiche.",
        carbonEquivalentDesc: "Predice temprabilità e sensibilità alle cricche a freddo. CE > 0,40% richiede spesso preriscaldo.",
        power: "Potenza",
        geometry: "Geometria",
        simulationLabel: "SIMULAZIONE GIUNTO",
        setup: "Impostazione processo"
    },
    viewCad: "CAD",
    viewFea: "FEA",
    viewDesk: "DESK",
    startMenu: "Menu Start",
    allApps: "Tutte le applicazioni",
    searchApps: "Cerca applicazioni…",
    pinned: "Moduli fissati",
    searchResults: "Risultati ricerca",
    categoryOther: "Altro",
    userPro: "AluCalc Professional",
    toggleDevMode: "Attiva/Disattiva modalità sviluppatore",
    settings: "Impostazioni",
    appearance: "Aspetto",
    language: "Lingua",
    typography: "Tipografia",
    about: "Info",
    securityVerified: "Sicurezza verificata",
    appearanceDesc: "Personalizza l’identità visiva della workstation.",
    languageDesc: "Seleziona impostazioni regionali e lingua interfaccia.",
    typographyDesc: "Ottimizza la leggibilità per il tuo ambiente tecnico.",
    fontFamily: "Famiglia font",
    fontSizeKey: "Dimensione font",
    fontPreviewLabel: "Anteprima",
    fontPreviewText: "Quel viticcio strozzò il ghiro e divenne troppo grande. 1234567890. Tutti i calcoli sono soggetti a regole di validazione.",
    systemVersion: "Versione workspace ingegneristico 5.0.0-Stable",
    architecture: "Architettura",
    archName: "B-Model Cloud Hybrid",
    engineStatus: "Stato motore",
    statusOptimized: "OTTIMIZZATO",
    localeLatency: "Latenza lingua",
    latencyValue: "2,4 ms (cache)",
    aboutDesc: "Progettato per ingegneria professionale dell’alluminio e analisi strutturale.",
    themeDark: "Cyber scuro",
    themeLight: "Chiaro",
    themePaper: "Blueprint",
    themeSea: "Mare profondo",
    themeSky: "Cielo aperto",
    themeDarkDesc: "Alto contrasto, bassa fatica",
    themeLightDesc: "Ottimizzato per luce diurna",
    themePaperDesc: "Estetica ingegneristica",
    themeSeaDesc: "Toni scuri morbidi",
    themeSkyDesc: "Aria e minimale",
    languageEn: "Inglese",
    languageTr: "Turco",
    languageDe: "Tedesco",
    languageEs: "Spagnolo",
    languageZh: "Cinese",
    languageJa: "Giapponese",
    languageKo: "Coreano",
    languageAr: "Arabo",
    modules: {
        calculator: {
            title: "Calcolatrice scientifica"
        },
        "unit-converter": {
            title: "Convertitore di unità"
        },
        "ai-copilot": {
            title: "Aegis AI"
        },
        "file-explorer": {
            title: "Esplora file"
        },
        settings: {
            title: "Impostazioni"
        },
        handbook: {
            title: "Manuale ingegneria"
        },
        browser: {
            title: "Browser web"
        },
        paint: {
            title: "CAD Paint"
        },
        terminal: {
            title: "Terminale"
        },
        "flow-editor": {
            title: "Editor flow"
        },
        "parametric-cad": {
            title: "CAD parametrico"
        },
        "cad-editor": {
            title: "Editor CAD"
        },
        "sketch-pad": {
            title: "Blocco schizzi"
        },
        "sheet-metal": {
            title: "Lamiera"
        },
        "periodic-table": {
            title: "Tavola periodica"
        },
        "simulation-fea": {
            title: "Simulazione FEA"
        },
        "profile-weight": {
            title: "Peso profilo"
        },
        "gears-bearings": {
            title: "Calcolatore ingranaggi"
        },
        welding: {
            title: "Calcolatore saldatura"
        },
        fasteners: {
            title: "Coppia fissaggi"
        },
        "materials-db": {
            title: "DB materiali"
        },
        "cutting-optimizer": {
            title: "Ottimizzatore taglio"
        },
        "music-player": {
            title: "Lettore musicale"
        },
        "belt-drive": {
            title: "Trasmissione a cinghia"
        },
        "beam-deflection": {
            title: "Freccia trave"
        },
        bearings: {
            title: "Vita cuscinetti (L10)"
        },
        "bolt-stress": {
            title: "Tensione bullone"
        },
        "column-buckling": {
            title: "Instabilità colonna (Euler)"
        },
        "fits-tolerances": {
            title: "Accoppiamenti & tolleranze (ISO 286)"
        },
        "fluid-flow": {
            title: "Perdita di carico tubi"
        },
        "gear-spur": {
            title: "Ingranaggio dritto"
        },
        "hydraulic-cylinder": {
            title: "Cilindro idraulico"
        },
        "ohms-law": {
            title: "Legge di Ohm"
        },
        pumps: {
            title: "Pompa centrifuga"
        },
        "sheet-metal-v2": {
            title: "Piegatura lamiera"
        },
        "spring-compression": {
            title: "Molla a compressione"
        },
        "strength-analysis": {
            title: "Analisi resistenza"
        },
        "thread-geometry": {
            title: "Geometria filetti"
        },
        "torsion-shaft": {
            title: "Torsione (albero)"
        },
        "vat-calculator": {
            title: "Calcolatore IVA"
        },
        "voltage-drop": {
            title: "Caduta di tensione"
        },
        "welding-fillet": {
            title: "Resistenza cordone d’angolo"
        },
        "welding-heat": {
            title: "Apporto termico saldatura"
        },
        nesting: {
            title: "Nesting"
        },
        "analytics-dashboard": {
            title: "Analitica"
        },
        "engineering-notes": {
            title: "Note ingegneristiche"
        },
        "manufacturing-sandbox": {
            title: "Mfg. Sandbox"
        },
        "engineering-selection": {
            title: "Engineering Selection"
        },
        "thermal-expansion": {
            title: "Dilatazione termica"
        },
        "project-manager": {
            title: "Distinta progetto"
        },
        "cost-estimator": {
            title: "Motore costi"
        },
        "manufacturing-readiness": {
            title: "Mfg Readiness Analyzer"
        },
        "topology-optimization": {
            title: "Progettazione generativa"
        },
        "machine-assembly": {
            title: "Assemblaggio macchina"
        },
        "failure-prediction": {
            title: "Failure Predictor"
        },
        "fluid-dynamics": {
            title: "Dinamica dei fluidi"
        },
        "bolt-torque": {
            title: "Bolt Torque & Preload"
        },
        "chain-drive": {
            title: "Trasmissione a catena a rulli"
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
    palette: {
        categories: {
            input: "Input e costanti",
            mechanical: "Nucleo meccanico",
            chemical: "Chimica / Termo",
            validation: "Validazione / ISO",
            visual: "Visualizzatori",
            export: "Export / Report"
        },
        searchPlaceholder: "Cerca nodi…"
    },
    moduleHints: {
        calculator: "Calcoli matematici avanzati",
        "unit-converter": "Unità ingegneristiche",
        "ai-copilot": "Aegis AI",
        "file-explorer": "File di sistema",
        settings: "Preferenze sistema",
        handbook: "Formule e dati di riferimento",
        terminal: "Interfaccia riga di comando",
        "profile-weight": "Peso estrusi alluminio",
        "gears-bearings": "Rapporti ingranaggi e vita cuscinetti",
        welding: "Gola e resistenza saldature",
        fasteners: "Coppia e precarico bulloni",
        "materials-db": "Proprietà materiali",
        "cutting-optimizer": "Efficienza di taglio",
        "music-player": "Audio locale e streaming",
        "belt-drive": "Calcolo pulegge e cinghie",
        "thermal-expansion": "Dilatazione termica e variazione dimensionale",
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
        mechanical: "Meccanica",
        structural: "Strutturale",
        utilities: "Utilità",
        reference: "Riferimento",
        science: "Scienze",
        software: "Software",
        civil: "Civile",
        finance: "Finanza",
        other: "Altro"
    },
    ribbon: {
        theme: "Tema",
        guide: "Guida",
        variables: "Variabili",
        select: "Seleziona",
        pan: "Pan",
        line: "Linea (L)",
        polyline: "Polilinea (PL)",
        rectangle: "Rettangolo (REC)",
        circle: "Cerchio (C)",
        copy: "Copia (CO)",
        rotate: "Ruota (RO)",
        mirror: "Specchia (MI)",
        trim: "Taglia (TR)",
        extend: "Estendi (EX)",
        offset: "Offset (O)",
        fillet: "Raccordo (F)",
        smartDim: "Quota smart",
        linear: "Lineare",
        text: "Testo",
        coincident: "Coincidente",
        horizontal: "Orizzontale",
        vertical: "Verticale",
        parallel: "Parallelo",
        perpendicular: "Perpendicolare",
        tangent: "Tangente",
        equal: "Uguale",
        angle: "Angolo",
        dist: "Distanza",
        undo: "Annulla",
        redo: "Ripeti",
        zoomIn: "Zoom +",
        zoomOut: "Zoom -",
        zoomExtents: "Estensioni",
        osnap: "OSNAP (F3)",
        grid: "Griglia (F7)",
        importDxf: "Importa DXF",
        exportDxf: "DXF 2D",
        exportStep: "STEP 3D",
        clearAll: "Cancella tutto",
        groupDraw: "Disegno",
        groupModify: "Modifica",
        groupDim: "Quote",
        groupConstraints: "Vincoli",
        groupExport: "Esporta",
        groupPaint: "Pittura",
        groupContent: "Contenuto",
        groupCanvas: "Canvas",
        groupJob: "Controllo job",
        groupOutput: "Output",
        labelCreativeDesk: "SCRIVANIA CREATIVA",
        labelMfgCam: "SPAZIO MFG / CAM",
        labelFeaSim: "MOTORE FEA / SIMULAZIONE",
        labelPen: "Penna",
        labelMarker: "Evidenziatore",
        labelEraser: "Gomma",
        labelArrow: "Freccia",
        labelRect: "Rett",
        labelCircle: "Cerchio",
        labelClear: "Pulisci",
        labelNote: "Nota",
        labelVideo: "Video",
        labelMusic: "Musica",
        labelImage: "Immagine",
        labelExcel: "Excel",
        labelWord: "Word",
        labelPpt: "PPT",
        labelPdf: "PDF",
        labelStartNesting: "Avvia nesting",
        labelResetJob: "Reset job",
        labelFullReport: "Report completo",
        labelExportNc: "Esporta NC",
        labelSolverReady: "Solutore pronto",
        labelWorkstation: "POSTAZIONE INGEGNERISTICA",
        labelMatrixSparse: "Matrice: sparsa",
        labelStrokeColor: "Colore tratto",
        defaultNote: "📌 Nuova nota",
        promptYoutubeUrl: "Inserisci URL YouTube:",
        confirmClearSketches: "Cancellare tutti gli schizzi?",
        confirmClearFlow: "Sei sicuro di voler cancellare l’intero flow? Operazione irreversibile.",
        confirmDeleteWindow: "Chiudere questa finestra?",
        alertSelect2: "Seleziona almeno 2 entità (punti o linee) da vincolare.",
        exportFailed: "Export fallito",
        dxfExportFailed: "Export DXF fallito",
        stepExportFailed: "Export STEP fallito",
        noGeometry: "Nessuna geometria da esportare. Disegna qualcosa.",
        noExportableGeometry: "Nessuna geometria esportabile (solo linee e cerchi).",
        stepExportComplete: "Export STEP completato: {count} entità esportate.",
        importedEntities: "Importate {count} entità.",
        labelNewNote: "Nuova nota",
        comingSoon: "In arrivo…",
        handbookPdf: "Engineering Handbook.pdf",
        newsFeedTitle: "News ingegneria",
        newsItem1: "Prezzi alluminio +2%",
        newsItem2: "Nuova norma ISO 898-1 pubblicata",
        newsItem3: "AluCalc V2 lanciato"
    },
    featureTree: "Albero funzioni",
    sketches: "Schizzi",
    bodies: "Corpi",
    constraints: "Vincoli",
    parameters: "Parametri",
    noBodies: "Nessun corpo",
    dofLabel: "GDL",
    fullyConstrained: "Completamente vincolato",
    overConstrained: "Sovra-vincolato",
    underConstrained: "Sotto-vincolato",
    addBody: "Aggiungi corpo",
    parametersTitle: "PARAMETRI",
    resultsTitle: "RISULTATI",
    fixInputs: "CORREGGI INPUT",
    switch2D: "PASSA A 2D",
    switch3D: "PASSA A 3D",
    quickSelect: "SELEZIONE RAPIDA",
    varLabel: "VAR",
    dbLabel: "DB",
    selectStandard: "Seleziona standard…",
    calcCommon: {
        length: {
            label: "Lunghezza (L)"
        },
        width: {
            label: "Larghezza (w)"
        },
        height: {
            label: "Altezza (h)"
        },
        thickness: {
            label: "Spessore (t)"
        },
        radius: {
            label: "Raggio (R)",
            desc: "Raggio interno di piega"
        },
        angle: {
            label: "Angolo (θ)"
        },
        force: {
            label: "Forza (F)"
        },
        torque: {
            label: "Coppia (T)"
        },
        pressure: {
            label: "Pressione (P)"
        },
        velocity: {
            label: "Velocità (v)"
        },
        diameter: {
            label: "Diametro (d)"
        },
        density: {
            label: "Densità (ρ)"
        },
        mass: {
            label: "Massa (m)"
        },
        volume: {
            label: "Volume (V)"
        },
        area: {
            label: "Area (A)"
        },
        material: {
            label: "Tipo materiale"
        },
        yieldStrength: {
            label: "Limite di snervamento (Sy)"
        },
        Sy: {
            label: "Limite di snervamento (Sy)"
        },
        safetyFactor: {
            label: "Fattore di sicurezza"
        },
        SF: {
            label: "Fattore di sicurezza (SF)"
        },
        deflection: {
            label: "Freccia"
        },
        bendingStress: {
            label: "Tensione di flessione"
        },
        sigmaBending: {
            label: "Tensione di flessione (σb)"
        },
        m: {
            label: "Modulo (m)",
            desc: "Modulo ingranaggi"
        },
        z1: {
            label: "Denti pignone (z₁)"
        },
        z2: {
            label: "Denti ruota (z₂)"
        },
        alpha: {
            label: "Angolo di pressione (α)"
        },
        b: {
            label: "Larghezza faccia (b)"
        },
        T: {
            label: "Coppia (T)"
        },
        d: {
            label: "Diametro (d)"
        },
        p: {
            label: "Passo (p)"
        },
        k: {
            label: "Altezza testa (k)"
        },
        s: {
            label: "Larghezza esagono (s)"
        },
        drill: {
            label: "Ø punta"
        },
        dh: {
            label: "Ø foro (dh)"
        },
        ix: {
            label: "Inerzia Ix",
            desc: "Momento d’inerzia asse X"
        },
        iy: {
            label: "Inerzia Iy",
            desc: "Momento d’inerzia asse Y"
        },
        slot: {
            label: "Dimensione asola"
        }
    },
    handbook: {
        title: "Biblioteca ingegneristica",
        searchPlaceholder: "Cerca nella biblioteca…",
        results: "Risultati",
        noResults: "Nessun risultato.",
        description: "Archivio completo e consultabile di standard meccanici, tolleranze e dati d’ingegneria.",
        featured: "In evidenza",
        openTable: "Apri tabella",
        mathFormula: "Formula matematica",
        readEntry: "Leggi voce",
        viewAll: "Vedi tutto",
        viewDetails: "Vedi dettagli",
        categories: "Categorie della biblioteca",
        shortcuts: {
            isoTolerances: "Tolleranze ISO",
            isoTolerancesDesc: "Quote lineari e limiti",
            fasteners: "Fissaggi & filetti",
            fastenersDesc: "Serie M, UN, G e classi bulloni",
            materials: "Proprietà materiali",
            materialsDesc: "Densità, limite di snervamento (Re)",
            mohr: "Cerchio di Mohr",
            mohrDesc: "Tensioni principali & deformazione 2D",
            beams: "Freccia travi",
            beamsDesc: "Formule per travi incastrate e semplici",
            roughness: "Rugosità superficiale",
            roughnessDesc: "Valori Ra & lavorazioni"
        }
    },
    variables: {
        title: "VARIABILI PROGETTO",
        addVariable: "Aggiungi variabile",
        name: "NOME",
        value: "VALORE",
        unit: "UNITÀ",
        description: "DESCRIZIONE",
        placeholderName: "NomeVar",
        placeholderDesc: "Descrizione opzionale…",
        noVariables: "Nessuna variabile globale definita. Clicca \"Aggiungi variabile\"."
    },
    close: "Chiudi",
    minimize: "Minimizza",
    maximize: "Massimizza",
    save: "Salva",
    cancel: "Annulla",
    apply: "Applica",
    ok: "OK",
    error: "Errore",
    feedbackTitle: "Contatto & feedback",
    costTitle: "Stimatore costi",
    costDesc: "Dettaglio costi di produzione",
    costBom: "Distinta materiali",
    costOps: "Operazioni",
    costOverhead: "Spese generali %",
    costMargin: "Margine %",
    costBatch: "Dimensione lotto",
    costTotal: "Costo totale",
    costUnit: "Prezzo unitario",
    termPlaceholder: "Digita un comando… (prova 'help')",
    termPrefix: "AluCalc ❯",
    shutDown: "Arresta",
    noModulesFound: "Nessun modulo trovato",
    noModulesHint: "Prova a modificare la ricerca.",
    disciplinesLabel: "Discipline",
    languageFr: "Francese",
    languageIt: "Italiano",
    languagePt: "Portoghese",
    languageRu: "Russo",
    closeAll: "Chiudi tutte le app"
} as const;
