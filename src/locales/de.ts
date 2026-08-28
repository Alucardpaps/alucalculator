export default {
    osName: "AluCalc OS",
    version: "v5.0",
    welcomeTitle: "Wählen Sie Ihren",
    welcomeHighlight: "Arbeitsbereich",
    welcomeDesc: "Wählen Sie Ihre primäre Benutzeroberfläche. Sie können jederzeit wechseln.",
    systemInit: "System initialisiert",
    bootInit: "Ingenieurs-Runtime wird initialisiert...",
    bootLoading: "Lade ALU_CORE, FLOW_ENGINE, CAD_RT",
    bootMounting: "Virtuelles Dateisystem wird gemountet...",
    bootReady: "System bereit.",
    systemReadyStatus: "System bereit",
    noActiveNodes: "Keine aktiven Berechnungsknoten im Flow",
    confirmClearWorkspace: "Arbeitsbereich löschen?",
    nodeTypeNote: "Notiz",
    nodeTypeMedia: "Medien",
    nodeTypeNode: "Knoten",
    flowTitle: "Flow Engine",
    flowDesc: "Unendliche Arbeitsfläche für technische Berechnungen. Knoten verbinden und Formeln verketten.",
    cadTitle: "CAD Studio",
    cadDesc: "Professionelles 2D-Zeichnen mit Linien, Kreisen, Bemaßungen und Rasterfang-Präzision.",
    deskTitle: "Kreativer Schreibtisch",
    deskDesc: "Freiform-Whiteboard für Brainstorming. Skizzieren, Dateien ziehen und Ideen visuell organisieren.",
    feaTitle: "FEA-System",
    projects: {
        title: "Projekte",
        newProject: "Neues Projekt",
        allProjects: "Alle Projekte",
        noProjects: "Noch keine Projekte",
        createFirst: "Erstes Projekt erstellen",
        projectName: "Projektname",
        description: "Beschreibung (optional)",
        placeholderName: "Mein Ingenieurprojekt",
        placeholderDesc: "Kurze Beschreibung...",
        exportProject: "Projekt exportieren",
        importProject: "Projekt importieren",
        duplicate: "Duplizieren",
        delete: "Löschen",
        updatedAt: "Aktualisiert",
        workspacesCount: "Arbeitsbereich(e)"
    },
    welding: {
        title: "Schweiß-Rechner",
        subtitle: "Wärmeeintrag • Verbindungsfestigkeit • AWS D1.1",
        process: "Schweißverfahren",
        jointType: "Verbindungsart",
        parameters: "Schweißparameter",
        electrodes: "Elektroden- / Drahtauswahl",
        processes: {
            mig: "MIG/MAG (GMAW)",
            tig: "TIG (GTAW)",
            smaw: "Elektrode (SMAW)",
            fcaw: "Fülldraht (FCAW)",
            saw: "Unterpulverschweißen (SAW)",
            mma: "Lichtbogenhandschweißen (SMAW)",
            mag: "MAG (GMAW)"
        },
        joints: {
            fillet: "Kehlnaht",
            doubleFillet: "Doppel-Kehlnaht",
            butt: "Stumpfstoß (I-Naht)",
            vGroove: "V-Naht (Augefast)",
            uGroove: "U-Naht (Augefast)",
            jGroove: "J-Naht (Augefast)",
            lap: "Überlappstoß",
            tee: "T-Stoß",
            corner: "Eckstoß"
        },
        profiles: "Materialprofile",
        materials: "Materialien",
        material1: "Material 1",
        material2: "Material 2",
        dissimilarWarning: "Verschiedene Materialien: {m1} + {m2} - Spezieller Zusatzwerkstoff erforderlich",
        heatInput: "Wärmeeintrag",
        weldStress: "Schweißnahtspannung",
        throatArea: "Nahtquerschnitt",
        minWeldSize: "Min. Schweißnahtgröße",
        jointEfficiency: "Verbindungswirkungsgrad",
        preheat: "Vorwärmen",
        fillerMetal: "Geschätzter Zusatzwerkstoff",
        efficiency: "Wirkungsgrad (η)",
        depositionRate: "Abschmelzrate",
        positions: "Positionen",
        thermodynamics: "Schweißthermodynamik",
        heatFormula: "Wärmeeintragsformel",
        carbonEquivalent: "Kohlenstoffäquivalent (CE)",
        notRequired: "Nicht erforderlich",
        inputs: {
            current: "Stromstärke",
            voltage: "Spannung",
            speed: "Geschwindigkeit",
            thickness: "Dicke (t)",
            legSize: "Kehlnahtgröße (a)",
            length: "Länge (L)",
            load: "Last (F)",
            grooveAngle: "Nutwinkel"
        },
        dims: {
            width: "Breite",
            thick: "Dicke",
            diameter: "Durchmesser",
            wallThick: "Wandstärke",
            height: "Höhe",
            flange: "Flansche",
            webT: "Stegdicke",
            leg: "Schenkel"
        },
        materialSteel: "Stahl",
        materialStainless: "Edelstahl",
        materialAluminum: "Aluminium",
        materialCopper: "Kupfer",
        materialBrass: "Messing",
        heatFormulaDesc: "Pro Längeneinheit der Schweißnaht übertragene Energie. Kontrolliert die Abkühlrate und metallurgische Eigenschaften.",
        carbonEquivalentDesc: "Sagt die Härtbarkeit und Kaltrissempfindlichkeit voraus. CE > 0,40% erfordert normalerweise Vorwärmen.",
        power: "Leistung",
        geometry: "Geometrie",
        simulationLabel: "SCHWEISSBILD-SIMULATION",
        setup: "Prozess-Setup"
    },
    viewCad: "CAD",
    viewFea: "FEA",
    viewDesk: "DESK",
    startMenu: "Startmenü",
    allApps: "Alle Anwendungen",
    searchApps: "Anwendungen suchen...",
    pinned: "Angeheftete Module",
    settings: "Einstellungen",
    appearance: "Aussehen",
    language: "Sprache",
    typography: "Typografie",
    about: "Über das OS",
    securityVerified: "Sicherheit verifiziert",
    appearanceDesc: "Passen Sie die visuelle Identität Ihrer Workstation an.",
    languageDesc: "Wählen Sie Ihre bevorzugten Regionaleinstellungen und die Oberflächensprache.",
    typographyDesc: "Optimieren Sie die Lesbarkeit für Ihre technische Umgebung.",
    fontFamily: "Schriftfamilie",
    fontSizeKey: "Schriftgröße",
    fontPreviewLabel: "Vorschau",
    fontPreviewText: "Franz jagt im komplett verwahrlosten Taxi quer durch Bayern. 1234567890. Alle technischen Berechnungen unterliegen Validierungsregeln.",
    systemVersion: "Engineering Workspace Version 5.0.0-Stabil",
    architecture: "Architektur",
    archName: "B-Model Cloud Hybrid",
    engineStatus: "Engine-Status",
    toggleDevMode: "Entwicklermodus umschalten",
    statusOptimized: "OPTIMIERT",
    localeLatency: "Locale-Latenz",
    latencyValue: "2.4ms (Cache Hit)",
    aboutDesc: "Entwickelt für professionelle Aluminium-Entwicklung und Strukturanalyse.",
    themeDark: "Cyber Dark",
    themeLight: "Clean Light",
    themePaper: "Blueprint",
    themeSea: "Deep Sea",
    themeSky: "Open Sky",
    themeDarkDesc: "Hoher Kontrast, geringe Ermüdung",
    themeLightDesc: "Tageslicht optimiert",
    themePaperDesc: "Ingenieur-Ästhetik",
    themeSeaDesc: "Sanfte dunkle Töne",
    themeSkyDesc: "Luftig und minimal",
    languageEn: "Englisch",
    languageTr: "Türkisch",
    languageDe: "Deutsch",
    languageEs: "Spanisch",
    languageZh: "Chinesisch",
    languageJa: "Japanisch",
    languageKo: "Koreanisch",
    languageAr: "Arabisch",
    modules: {
        calculator: {
            title: "Wissenschaftlicher Rechner"
        },
        "unit-converter": {
            title: "Einheitenumrechner"
        },
        "ai-copilot": {
            title: "Aegis AI"
        },
        "file-explorer": {
            title: "Dateimanager"
        },
        settings: {
            title: "Einstellungen"
        },
        handbook: {
            title: "Technisches Handbuch"
        },
        terminal: {
            title: "Terminal"
        },
        "profile-weight": {
            title: "Profilgewicht"
        },
        "gears-bearings": {
            title: "Getriebe/Lager Rechner"
        },
        welding: {
            title: "Schweißnaht Rechner"
        },
        fasteners: {
            title: "Verbindungstechnik"
        },
        "materials-db": {
            title: "Werkstoffdatenbank"
        },
        "cutting-optimizer": {
            title: "Zuschnittsoptimierung"
        },
        "music-player": {
            title: "Musik-Player"
        },
        "belt-drive": {
            title: "Riementrieb"
        },
        "beam-deflection": {
            title: "Balkendurchbiegung"
        },
        bearings: {
            title: "Lagerlebensdauer (L10)"
        },
        "bolt-stress": {
            title: "Schraubenbelastung"
        },
        "column-buckling": {
            title: "Knickung (Euler)"
        },
        "fits-tolerances": {
            title: "Passungen & Toleranzen"
        },
        "fluid-flow": {
            title: "Rohrströmung & Druck"
        },
        "gear-spur": {
            title: "Stirnradgetriebe"
        },
        "hydraulic-cylinder": {
            title: "Hydraulikzylinder"
        },
        "ohms-law": {
            title: "Ohmsches Gesetz"
        },
        pumps: {
            title: "Kreiselpumpe"
        },
        "sheet-metal": {
            title: "Blechbiegen"
        },
        "spring-compression": {
            title: "Druckfeder"
        },
        "strength-analysis": {
            title: "Festigkeitslehre"
        },
        "thread-geometry": {
            title: "Gewindegeometrie"
        },
        "torsion-shaft": {
            title: "Torsion (Welle)"
        },
        "vat-calculator": {
            title: "MwSt Rechner"
        },
        "voltage-drop": {
            title: "Spannungsabfall"
        },
        "welding-fillet": {
            title: "Kehlnahtfestigkeit"
        },
        "welding-heat": {
            title: "Schweißwärmeeinbringung"
        },
        "analytics-dashboard": {
            title: "Analytik"
        },
        "engineering-notes": {
            title: "Ingenieurnotizen"
        },
        "cad-editor": {
            title: "CAD-Editor"
        },
        "sketch-pad": {
            title: "Skizzenblock"
        },
        "periodic-table": {
            title: "Periodensystem"
        },
        "simulation-fea": {
            title: "FEA-Simulation"
        },
        "manufacturing-sandbox": {
            title: "Mfg. Sandbox"
        },
        "engineering-selection": {
            title: "Engineering Selection"
        },
        "thermal-expansion": {
            title: "Wärmedehnung"
        },
        "project-manager": {
            title: "Projekt-Stückliste"
        },
        "cost-estimator": {
            title: "Kostenrechner"
        },
        "manufacturing-readiness": {
            title: "Mfg Readiness Analyzer"
        },
        "topology-optimization": {
            title: "Generatives Design"
        },
        "machine-assembly": {
            title: "Maschinenbaugruppe"
        },
        "failure-prediction": {
            title: "Failure Predictor"
        },
        "fluid-dynamics": {
            title: "Strömungsmechanik"
        },
        "bolt-torque": {
            title: "Bolt Torque & Preload"
        },
        "chain-drive": {
            title: "Rollenkettengetriebe"
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
        calculator: "Erweiterte Berechnungen",
        "unit-converter": "Einheiten umrechnen",
        "ai-copilot": "Aegis AI",
        "file-explorer": "Systemdateien",
        settings: "Systemeinstellungen",
        handbook: "Formeln & Daten",
        terminal: "Kommandozeile",
        "profile-weight": "Alu-Profil Gewicht",
        "gears-bearings": "Übersetzung & Lager",
        welding: "Schweißnähte",
        fasteners: "Schrauben & Drehmoment",
        "materials-db": "Materialeigenschaften",
        "cutting-optimizer": "Verschnittoptimierung",
        "music-player": "Lokales & Web-Audio",
        "belt-drive": "Riementrieb Berechnung",
        "thermal-expansion": "Wärmedehnung und Maßänderung",
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
        mechanical: "Mechanik",
        structural: "Gehäuse/Struktur",
        utilities: "Dienstprogramme",
        reference: "Referenz",
        science: "Naturwissenschaften",
        software: "Software",
        civil: "Bauwesen",
        finance: "Finanzen",
        other: "Sonstiges"
    },
    ribbon: {
        theme: "Thema",
        guide: "Anleitung",
        variables: "Variablen",
        select: "Auswählen",
        pan: "Verschieben",
        line: "Linie (L)",
        polyline: "Polylinie (PL)",
        rectangle: "Rechteck (REC)",
        circle: "Kreis (C)",
        copy: "Kopieren (CO)",
        rotate: "Drehen (RO)",
        mirror: "Spiegeln (MI)",
        trim: "Stutzen (TR)",
        extend: "Dehnen (EX)",
        offset: "Versatz (O)",
        fillet: "Abrunden (F)",
        smartDim: "Smart-Maß",
        linear: "Linear",
        text: "Text",
        coincident: "Koinzidenz",
        horizontal: "Horiz",
        vertical: "Vert",
        parallel: "Parallel",
        perpendicular: "Senkrecht",
        tangent: "Tangente",
        equal: "Gleich",
        angle: "Winkel",
        dist: "Abstand",
        undo: "Rückgängig",
        redo: "Wiederholen",
        zoomIn: "Vergrößern",
        zoomOut: "Verkleinern",
        zoomExtents: "Anpassen",
        osnap: "OSNAP (F3)",
        grid: "Raster (F7)",
        importDxf: "DXF Import",
        exportDxf: "DXF 2D",
        exportStep: "STEP 3D",
        clearAll: "Alles löschen",
        groupDraw: "Zeichnen",
        groupModify: "Ändern",
        groupDim: "Maße",
        groupConstraints: "Bedingungen",
        groupExport: "Export",
        groupPaint: "Malen",
        groupContent: "Inhalt",
        labelWorkstation: "INGENIEURARBEITSPLATZ",
        groupCanvas: "Leinwand",
        groupJob: "Jobsteuerung",
        groupOutput: "Ausgabe",
        labelCreativeDesk: "CREATIVE DESK",
        labelMfgCam: "FERTIGUNG / CAM",
        labelFeaSim: "FEA / SIMULATION",
        labelPen: "Stift",
        labelMarker: "Marker",
        labelEraser: "Radierer",
        labelArrow: "Pfeil",
        labelRect: "Rechteck",
        labelCircle: "Kreis",
        labelClear: "Löschen",
        labelNote: "Notiz",
        labelVideo: "Video",
        labelMusic: "Musik",
        labelImage: "Bild",
        labelExcel: "Excel",
        labelWord: "Word",
        labelPpt: "PPT",
        labelPdf: "PDF",
        labelStartNesting: "Nesting starten",
        labelResetJob: "Job zurücksetzen",
        labelFullReport: "Vollständiger Bericht",
        labelExportNc: "NC exportieren",
        labelSolverReady: "Solver bereit",
        labelMatrixSparse: "Matrix: Sparse",
        labelStrokeColor: "Strichfarbe",
        defaultNote: "📌 Neue Notiz",
        promptYoutubeUrl: "YouTube-URL eingeben:",
        confirmClearSketches: "Alle Skizzen löschen?",
        confirmClearFlow: "Gesamten Flow-Arbeitsbereich wirklich löschen? Dies kann nicht rückgängig gemacht werden.",
        confirmDeleteWindow: "Dieses Fenster schließen?",
        alertSelect2: "Wählen Sie mindestens 2 Elemente (Punkte oder Linien) zum Einschränken.",
        exportFailed: "Export fehlgeschlagen",
        dxfExportFailed: "DXF-Export fehlgeschlagen",
        stepExportFailed: "STEP-Export fehlgeschlagen",
        noGeometry: "Keine Geometrie zum Export. Zeichnen Sie zuerst etwas.",
        noExportableGeometry: "Keine exportierbare Geometrie (nur Linien und Kreise).",
        stepExportComplete: "STEP-Export abgeschlossen: {count} Elemente exportiert.",
        importedEntities: "{count} Elemente importiert.",
        labelNewNote: "Neue Notiz",
        comingSoon: "Demnächst...",
        handbookPdf: "Ingenieurhandbuch.pdf",
        newsFeedTitle: "Ingenieur-Nachrichten",
        newsItem1: "Aluminiumpreise +2 %",
        newsItem2: "Neue Norm ISO 898-1 veröffentlicht",
        newsItem3: "AluCalc V2 gestartet"
    },
    palette: {
        categories: {
            input: "Eingabe & Konstanten",
            mechanical: "Mechanischer Kern",
            chemical: "Chemie / Thermo",
            validation: "Validierung / ISO",
            visual: "Visualisierungen",
            export: "Ausgabe / Berichte"
        },
        searchPlaceholder: "Knoten suchen..."
    },
    calcCommon: {
        length: {
            label: "Länge (L)"
        },
        width: {
            label: "Breite (w)"
        },
        height: {
            label: "Höhe (h)"
        },
        thickness: {
            label: "Dicke (t)"
        },
        radius: {
            label: "Radius (R)",
            desc: "Innerer Biegeradius"
        },
        angle: {
            label: "Winkel (θ)"
        },
        force: {
            label: "Kraft (F)"
        },
        torque: {
            label: "Drehmoment (T)"
        },
        pressure: {
            label: "Druck (P)"
        },
        velocity: {
            label: "Geschwindigkeit (v)"
        },
        diameter: {
            label: "Durchmesser (d)"
        },
        density: {
            label: "Dichte (ρ)"
        },
        mass: {
            label: "Masse (m)"
        },
        volume: {
            label: "Volumen (V)"
        },
        area: {
            label: "Fläche (A)"
        },
        material: {
            label: "Werkstoff"
        },
        yieldStrength: {
            label: "Streckgrenze (Sy)"
        },
        Sy: {
            label: "Streckgrenze (Sy)"
        },
        safetyFactor: {
            label: "Sicherheitsfaktor"
        },
        SF: {
            label: "Sicherheitsfaktor (SF)"
        },
        deflection: {
            label: "Durchbiegung"
        },
        bendingStress: {
            label: "Biegespannung"
        },
        sigmaBending: {
            label: "Biegespannung (σb)"
        },
        m: {
            label: "Modul (m)",
            desc: "Zahnradmodul"
        },
        z1: {
            label: "Ritzel Zähnezahl (z₁)"
        },
        z2: {
            label: "Rad Zähnezahl (z₂)"
        },
        alpha: {
            label: "Eingriffswinkel (α)"
        },
        b: {
            label: "Zahnbreite (b)"
        },
        T: {
            label: "Drehmoment (T)"
        },
        d: {
            label: "Durchmesser (d)"
        },
        p: {
            label: "Steigung (p)"
        },
        k: {
            label: "Kopfhöhe (k)"
        },
        s: {
            label: "Schlüsselweite (s)"
        },
        drill: {
            label: "Bohr-Ø"
        },
        dh: {
            label: "Bohrungs-Ø (dh)"
        },
        ix: {
            label: "Trägheit Ix",
            desc: "Trägheitsmoment um die X-Achse"
        },
        iy: {
            label: "Trägheit Iy",
            desc: "Trägheitsmoment um die Y-Achse"
        },
        slot: {
            label: "Nutgröße"
        }
    },
    close: "Schließen",
    minimize: "Minimieren",
    maximize: "Maximieren",
    save: "Speichern",
    cancel: "Abbrechen",
    apply: "Anwenden",
    ok: "OK",
    error: "Fehler",
    handbook: {
        title: "Ingenieurbibliothek",
        searchPlaceholder: "Bibliothek durchsuchen...",
        results: "Ergebnisse",
        noResults: "Keine Ergebnisse gefunden.",
        description: "Ein umfassendes, suchbares Repository für mechanische Standards, Toleranzen und Konstruktionsdaten.",
        featured: "Vorgestellt",
        openTable: "Tabelle öffnen",
        mathFormula: "Mathematische Formel",
        readEntry: "Eintrag lesen",
        viewAll: "Alle ansehen",
        viewDetails: "Details anzeigen",
        categories: "Bibliothekskategorien",
        shortcuts: {
            isoTolerances: "ISO-Toleranzen",
            isoTolerancesDesc: "Lineare Maße & Grenzwerte",
            fasteners: "Verbindungselemente",
            fastenersDesc: "M-, UN-, G-Serien & Schraubengüten",
            materials: "Werkstoffeigenschaften",
            materialsDesc: "Dichten, Streckgrenze (Re)",
            mohr: "Mohrscher Kreis",
            mohrDesc: "Hauptspannungen & 2D-Verformung",
            beams: "Balkendurchbiegung",
            beamsDesc: "Formeln für feste & einfache Balken",
            roughness: "Oberflächenrauheit",
            roughnessDesc: "Ra-Werte & Bearbeitung"
        }
    },
    variables: {
        title: "PROJEKTVARIABLEN",
        addVariable: "Variable hinzufügen",
        name: "NAME",
        value: "WERT",
        unit: "EINHEIT",
        description: "BESCHREIBUNG",
        placeholderName: "VarName",
        placeholderDesc: "Optionale Beschreibung...",
        noVariables: "Keine globalen Variablen definiert. Klicken Sie auf \"Variable hinzufügen\", um eine zu erstellen."
    },
    termPlaceholder: "Befehl eingeben... (z.B. 'help')",
    termPrefix: "AluCalc ❯",
    viewFlow: "FLOW",
    searchResults: "Suchergebnisse",
    categoryOther: "Sonstiges",
    userPro: "AluCalc Professional",
    shutDown: "Herunterfahren",
    noModulesFound: "Keine Module gefunden",
    noModulesHint: "Passen Sie die Suchanfrage an.",
    disciplinesLabel: "Disziplinen",
    languageFr: "Französisch",
    languageIt: "Italienisch",
    languagePt: "Portugiesisch",
    languageRu: "Russisch",
    featureTree: "Konstruktionsbaum",
    sketches: "Skizzen",
    bodies: "Körper",
    constraints: "Bedingungen",
    parameters: "Parameter",
    noBodies: "Noch keine Körper",
    dofLabel: "FG",
    fullyConstrained: "Vollständig bestimmt",
    overConstrained: "Überbestimmt",
    underConstrained: "Unterbestimmt",
    addBody: "Körper hinzufügen",
    parametersTitle: "PARAMETER",
    resultsTitle: "ERGEBNISSE",
    fixInputs: "EINGABEN FIXIEREN",
    switch2D: "ZU 2D WECHSELN",
    switch3D: "ZU 3D WECHSELN",
    quickSelect: "SCHNELLAUSWAHL",
    varLabel: "VAR",
    dbLabel: "DB",
    selectStandard: "Norm wählen...",
    closeAll: "Alle Apps schließen",
    feedbackTitle: "Kontakt & Feedback",
    costTitle: "Kostenkalkulator",
    costDesc: "Fertigungskostenaufschlüsselung",
    costBom: "Materialstückliste",
    costOps: "Operationen",
    costOverhead: "Gemeinkosten %",
    costMargin: "Marge %",
    costBatch: "Losgröße",
    costTotal: "Gesamtkosten",
    costUnit: "Stückpreis"
} as const;
