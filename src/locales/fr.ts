export default {
    osName: "AluCalc OS",
    version: "v5.0",
    welcomeTitle: "Choisissez votre",
    welcomeHighlight: "Espace de travail",
    welcomeDesc: "Sélectionnez votre interface principale. Vous pouvez changer à tout moment.",
    systemInit: "Système initialisé",
    bootInit: "Initialisation de l’environnement d’ingénierie…",
    bootLoading: "Chargement ALU_CORE, FLOW_ENGINE, CAD_RT",
    bootMounting: "Montage du système de fichiers virtuel…",
    bootReady: "Système prêt.",
    systemReadyStatus: "Système prêt",
    noActiveNodes: "Aucun nœud de calcul actif dans le flow",
    confirmClearWorkspace: "Vider l’espace de travail ?",
    nodeTypeNote: "Note",
    nodeTypeMedia: "Média",
    nodeTypeNode: "Nœud",
    flowTitle: "Flow Engine",
    flowDesc: "Canvas infini pour calculs d’ingénierie. Connectez des nœuds, créez des flux et enchaînez des formules.",
    cadTitle: "Studio CAD",
    cadDesc: "Dessin 2D pro avec lignes, cercles, cotes et accrochage grille.",
    deskTitle: "Bureau créatif",
    deskDesc: "Tableau blanc libre pour brainstorm. Esquissez, glissez des fichiers et organisez visuellement.",
    feaTitle: "Système FEA",
    projects: {
        title: "Projets",
        newProject: "Nouveau projet",
        allProjects: "Tous les projets",
        noProjects: "Aucun projet pour l’instant",
        createFirst: "Créer le premier projet",
        projectName: "Nom du projet",
        description: "Description (optionnelle)",
        placeholderName: "Mon projet d’ingénierie",
        placeholderDesc: "Description courte…",
        exportProject: "Exporter le projet",
        importProject: "Importer le projet",
        duplicate: "Dupliquer",
        delete: "Supprimer",
        updatedAt: "Mis à jour",
        workspacesCount: "espace(s) de travail"
    },
    viewFlow: "FLOW",
    welding: {
        title: "Calculateur de soudage",
        subtitle: "Apport thermique • Résistance du joint • AWS D1.1",
        process: "Procédé de soudage",
        jointType: "Type de joint",
        parameters: "Paramètres de soudure",
        electrodes: "Électrode / Fil",
        processes: {
            mig: "MIG/MAG (GMAW)",
            tig: "TIG (GTAW)",
            smaw: "Baguette (SMAW)",
            fcaw: "Fil fourré (FCAW)",
            saw: "Submerged Arc (SAW)",
            mma: "Électrode enrobée (SMAW)",
            mag: "MAG (GMAW)"
        },
        joints: {
            fillet: "Cordons d’angle",
            doubleFillet: "Double cordon d’angle",
            butt: "Soudure bout à bout (carrée)",
            vGroove: "Chanfrein en V",
            uGroove: "Chanfrein en U",
            jGroove: "Chanfrein en J",
            lap: "Joint à recouvrement",
            tee: "Joint en T",
            corner: "Joint d’angle"
        },
        profiles: "Profils matière",
        materials: "Matériaux",
        material1: "Matériau 1",
        material2: "Matériau 2",
        dissimilarWarning: "Matériaux dissemblables : {m1} + {m2} - Un métal d’apport spécial peut être requis",
        heatInput: "Apport thermique",
        weldStress: "Contrainte de soudure",
        throatArea: "Section de gorge",
        minWeldSize: "Taille mini du cordon",
        jointEfficiency: "Efficacité du joint",
        preheat: "Préchauffage",
        fillerMetal: "Métal d’apport estimé",
        efficiency: "Rendement (η)",
        depositionRate: "Débit de dépôt",
        positions: "Positions",
        thermodynamics: "Thermodynamique du soudage",
        heatFormula: "Formule d’apport thermique",
        carbonEquivalent: "Équivalent carbone (CE)",
        notRequired: "Non requis",
        inputs: {
            current: "Courant",
            voltage: "Tension",
            speed: "Vitesse",
            thickness: "Épaisseur (t)",
            legSize: "Taille de patte (a)",
            length: "Longueur (L)",
            load: "Charge (F)",
            grooveAngle: "Angle de chanfrein"
        },
        dims: {
            width: "Largeur",
            thick: "Épaisseur",
            diameter: "Diamètre",
            wallThick: "Épaisseur de paroi",
            height: "Hauteur",
            flange: "Semelle",
            webT: "Âme",
            leg: "Patte"
        },
        materialSteel: "Acier",
        materialStainless: "Inox",
        materialAluminum: "Aluminium",
        materialCopper: "Cuivre",
        materialBrass: "Laiton",
        heatFormulaDesc: "Énergie transmise par unité de longueur de soudure. Contrôle le refroidissement et les propriétés métallurgiques.",
        carbonEquivalentDesc: "Prévoit la trempabilité et la sensibilité aux fissures à froid. CE > 0,40 % requiert souvent un préchauffage.",
        power: "Puissance",
        geometry: "Géométrie",
        simulationLabel: "SIMULATION DU JOINT",
        setup: "Configuration du procédé"
    },
    viewCad: "CAD",
    viewFea: "FEA",
    viewDesk: "DESK",
    startMenu: "Menu Démarrer",
    allApps: "Toutes les applications",
    searchApps: "Rechercher des applications…",
    pinned: "Modules épinglés",
    searchResults: "Résultats de recherche",
    categoryOther: "Autre",
    userPro: "AluCalc Professionnel",
    toggleDevMode: "Basculer le mode développeur",
    settings: "Paramètres",
    appearance: "Apparence",
    language: "Langue",
    typography: "Typographie",
    about: "À propos",
    securityVerified: "Sécurité vérifiée",
    appearanceDesc: "Personnalisez l’identité visuelle de votre poste.",
    languageDesc: "Choisissez vos paramètres régionaux et la langue de l’interface.",
    typographyDesc: "Optimisez la lisibilité pour votre environnement technique.",
    fontFamily: "Famille de polices",
    fontSizeKey: "Taille de police",
    fontPreviewLabel: "Aperçu",
    fontPreviewText: "Portez ce vieux whisky au juge blond qui fume. 1234567890. Tous les calculs d’ingénierie sont soumis à des règles de validation.",
    systemVersion: "Version de l’espace d’ingénierie 5.0.0-Stable",
    architecture: "Architecture",
    archName: "Hybride Cloud B-Model",
    engineStatus: "État du moteur",
    statusOptimized: "OPTIMISÉ",
    localeLatency: "Latence de langue",
    latencyValue: "2,4 ms (cache)",
    aboutDesc: "Conçu pour l’ingénierie aluminium et l’analyse structurelle professionnelles.",
    themeDark: "Cyber sombre",
    themeLight: "Clair",
    themePaper: "Blueprint",
    themeSea: "Mer profonde",
    themeSky: "Ciel ouvert",
    themeDarkDesc: "Contraste élevé, faible fatigue",
    themeLightDesc: "Optimisé pour la lumière du jour",
    themePaperDesc: "Esthétique d’ingénierie",
    themeSeaDesc: "Tons sombres doux",
    themeSkyDesc: "Aérien et minimal",
    languageEn: "Anglais",
    languageTr: "Turc",
    languageDe: "Allemand",
    languageEs: "Espagnol",
    languageZh: "Chinois",
    languageJa: "Japonais",
    languageKo: "Coréen",
    languageAr: "Arabe",
    modules: {
        calculator: {
            title: "Calculatrice scientifique"
        },
        "unit-converter": {
            title: "Convertisseur d’unités"
        },
        "ai-copilot": {
            title: "Aegis AI"
        },
        "file-explorer": {
            title: "Explorateur de fichiers"
        },
        settings: {
            title: "Paramètres"
        },
        handbook: {
            title: "Manuel d’ingénierie"
        },
        browser: {
            title: "Navigateur web"
        },
        paint: {
            title: "CAD Paint"
        },
        terminal: {
            title: "Terminal"
        },
        "flow-editor": {
            title: "Éditeur de flow"
        },
        "parametric-cad": {
            title: "CAD paramétrique"
        },
        "cad-editor": {
            title: "Éditeur CAD"
        },
        "sketch-pad": {
            title: "Bloc d’esquisse"
        },
        "sheet-metal": {
            title: "Tôle"
        },
        "periodic-table": {
            title: "Table périodique"
        },
        "simulation-fea": {
            title: "Simulation FEA"
        },
        "profile-weight": {
            title: "Poids de profil"
        },
        "gears-bearings": {
            title: "Calculateur d’engrenages"
        },
        welding: {
            title: "Calculateur de soudure"
        },
        fasteners: {
            title: "Couple de fixation"
        },
        "materials-db": {
            title: "Base matériaux"
        },
        "cutting-optimizer": {
            title: "Optimiseur de coupe"
        },
        "music-player": {
            title: "Lecteur audio"
        },
        "belt-drive": {
            title: "Transmission par courroie"
        },
        "beam-deflection": {
            title: "Flèche de poutre"
        },
        bearings: {
            title: "Durée de vie roulement (L10)"
        },
        "bolt-stress": {
            title: "Contrainte boulon"
        },
        "column-buckling": {
            title: "Flambage colonne (Euler)"
        },
        "fits-tolerances": {
            title: "Ajustements & tolérances (ISO 286)"
        },
        "fluid-flow": {
            title: "Perte de charge tuyauterie"
        },
        "gear-spur": {
            title: "Engrenage droit"
        },
        "hydraulic-cylinder": {
            title: "Vérin hydraulique"
        },
        "ohms-law": {
            title: "Loi d’Ohm"
        },
        pumps: {
            title: "Pompe centrifuge"
        },
        "sheet-metal-v2": {
            title: "Pliage tôle"
        },
        "spring-compression": {
            title: "Ressort compression"
        },
        "strength-analysis": {
            title: "Analyse de résistance"
        },
        "thread-geometry": {
            title: "Géométrie de filetage"
        },
        "torsion-shaft": {
            title: "Torsion (arbre)"
        },
        "vat-calculator": {
            title: "Calcul TVA"
        },
        "voltage-drop": {
            title: "Chute de tension"
        },
        "welding-fillet": {
            title: "Résistance cordon d’angle"
        },
        "welding-heat": {
            title: "Apport thermique soudage"
        },
        nesting: {
            title: "Nesting"
        },
        "analytics-dashboard": {
            title: "Analytique"
        },
        "engineering-notes": {
            title: "Notes d'ingénierie"
        },
        "manufacturing-sandbox": {
            title: "Mfg. Sandbox"
        },
        "engineering-selection": {
            title: "Engineering Selection"
        },
        "thermal-expansion": {
            title: "Dilatation thermique"
        },
        "project-manager": {
            title: "Nomenclature projet"
        },
        "cost-estimator": {
            title: "Moteur de coûts"
        },
        "manufacturing-readiness": {
            title: "Mfg Readiness Analyzer"
        },
        "topology-optimization": {
            title: "Conception générative"
        },
        "machine-assembly": {
            title: "Assemblage machine"
        },
        "failure-prediction": {
            title: "Failure Predictor"
        },
        "fluid-dynamics": {
            title: "Dynamique des fluides"
        },
        "bolt-torque": {
            title: "Bolt Torque & Preload"
        },
        "chain-drive": {
            title: "Transmission par chaîne à rouleaux"
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
            input: "Entrées & constantes",
            mechanical: "Noyau mécanique",
            chemical: "Chimie / Thermo",
            validation: "Validation / ISO",
            visual: "Visuels",
            export: "Export / Rapport"
        },
        searchPlaceholder: "Rechercher des nœuds…"
    },
    moduleHints: {
        calculator: "Calculs mathématiques avancés",
        "unit-converter": "Unités d’ingénierie",
        "ai-copilot": "Aegis AI",
        "file-explorer": "Fichiers système",
        settings: "Préférences système",
        handbook: "Formules & données de référence",
        terminal: "Interface ligne de commande",
        "profile-weight": "Poids d’extrusion aluminium",
        "gears-bearings": "Rapports d’engrenage & durée de vie roulement",
        welding: "Gorge et résistance des soudures",
        fasteners: "Couple et précharge des boulons",
        "materials-db": "Propriétés des matériaux",
        "cutting-optimizer": "Efficacité de coupe",
        "music-player": "Audio local & streaming",
        "belt-drive": "Calcul de poulies & courroies",
        "thermal-expansion": "Dilatation thermique et variation dimensionnelle",
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
        mechanical: "Mécanique",
        structural: "Structurel",
        utilities: "Utilitaires",
        reference: "Référence",
        science: "Sciences",
        software: "Logiciel",
        civil: "Génie civil",
        finance: "Finance",
        other: "Autre"
    },
    ribbon: {
        theme: "Thème",
        guide: "Guide",
        variables: "Variables",
        select: "Sélectionner",
        pan: "Déplacer",
        line: "Ligne (L)",
        polyline: "Polyligne (PL)",
        rectangle: "Rectangle (REC)",
        circle: "Cercle (C)",
        copy: "Copier (CO)",
        rotate: "Rotation (RO)",
        mirror: "Miroir (MI)",
        trim: "Rogner (TR)",
        extend: "Prolonger (EX)",
        offset: "Décaler (O)",
        fillet: "Congé (F)",
        smartDim: "Cote intelligente",
        linear: "Linéaire",
        text: "Texte",
        coincident: "Coïncident",
        horizontal: "Horizontal",
        vertical: "Vertical",
        parallel: "Parallèle",
        perpendicular: "Perpendiculaire",
        tangent: "Tangente",
        equal: "Égal",
        angle: "Angle",
        dist: "Distance",
        undo: "Annuler",
        redo: "Rétablir",
        zoomIn: "Zoom +",
        zoomOut: "Zoom -",
        zoomExtents: "Tout",
        osnap: "OSNAP (F3)",
        grid: "Grille (F7)",
        importDxf: "Importer DXF",
        exportDxf: "DXF 2D",
        exportStep: "STEP 3D",
        clearAll: "Tout effacer",
        groupDraw: "Dessiner",
        groupModify: "Modifier",
        groupDim: "Coter",
        groupConstraints: "Contraintes",
        groupExport: "Exporter",
        groupPaint: "Peindre",
        groupContent: "Contenu",
        groupCanvas: "Canvas",
        groupJob: "Pilotage",
        groupOutput: "Sortie",
        labelCreativeDesk: "BUREAU CRÉATIF",
        labelMfgCam: "ESPACE MFG / CAM",
        labelFeaSim: "MOTEUR FEA / SIMULATION",
        labelPen: "Stylo",
        labelMarker: "Marqueur",
        labelEraser: "Gomme",
        labelArrow: "Flèche",
        labelRect: "Rect",
        labelCircle: "Cercle",
        labelClear: "Effacer",
        labelNote: "Note",
        labelVideo: "Vidéo",
        labelMusic: "Musique",
        labelImage: "Image",
        labelExcel: "Excel",
        labelWord: "Word",
        labelPpt: "PPT",
        labelPdf: "PDF",
        labelStartNesting: "Démarrer le nesting",
        labelResetJob: "Réinitialiser job",
        labelFullReport: "Rapport complet",
        labelExportNc: "Exporter NC",
        labelSolverReady: "Solveur prêt",
        labelWorkstation: "POSTE D'INGÉNIERIE",
        labelMatrixSparse: "Matrice : creuse",
        labelStrokeColor: "Couleur du trait",
        defaultNote: "📌 Nouvelle note",
        promptYoutubeUrl: "Entrez l’URL YouTube :",
        confirmClearSketches: "Effacer tous les croquis ?",
        confirmClearFlow: "Voulez-vous vraiment vider tout le flow ? Cette action est irréversible.",
        confirmDeleteWindow: "Fermer cette fenêtre ?",
        alertSelect2: "Sélectionnez au moins 2 entités (points ou lignes) à contraindre.",
        exportFailed: "Échec export",
        dxfExportFailed: "Échec export DXF",
        stepExportFailed: "Échec export STEP",
        noGeometry: "Aucune géométrie à exporter. Dessinez d’abord.",
        noExportableGeometry: "Aucune géométrie exportable (lignes et cercles seulement).",
        stepExportComplete: "Export STEP terminé : {count} entités exportées.",
        importedEntities: "{count} entités importées.",
        labelNewNote: "Nouvelle note",
        comingSoon: "Bientôt disponible…",
        handbookPdf: "Engineering Handbook.pdf",
        newsFeedTitle: "Fil d’actualité ingénierie",
        newsItem1: "Prix de l’aluminium +2 %",
        newsItem2: "Nouvelle norme ISO 898-1 publiée",
        newsItem3: "AluCalc V2 lancé"
    },
    featureTree: "Arbre des fonctions",
    sketches: "Esquisses",
    bodies: "Corps",
    constraints: "Contraintes",
    parameters: "Paramètres",
    noBodies: "Aucun corps pour l’instant",
    dofLabel: "DDL",
    fullyConstrained: "Entièrement contraint",
    overConstrained: "Surcontraint",
    underConstrained: "Sous-contraint",
    addBody: "Ajouter un corps",
    parametersTitle: "PARAMÈTRES",
    resultsTitle: "RÉSULTATS",
    fixInputs: "CORRIGER LES ENTRÉES",
    switch2D: "PASSER EN 2D",
    switch3D: "PASSER EN 3D",
    quickSelect: "SÉLECTION RAPIDE",
    varLabel: "VAR",
    dbLabel: "DB",
    selectStandard: "Sélectionner un standard…",
    calcCommon: {
        length: {
            label: "Longueur (L)"
        },
        width: {
            label: "Largeur (w)"
        },
        height: {
            label: "Hauteur (h)"
        },
        thickness: {
            label: "Épaisseur (t)"
        },
        radius: {
            label: "Rayon (R)",
            desc: "Rayon intérieur de pliage"
        },
        angle: {
            label: "Angle (θ)"
        },
        force: {
            label: "Force (F)"
        },
        torque: {
            label: "Couple (T)"
        },
        pressure: {
            label: "Pression (P)"
        },
        velocity: {
            label: "Vitesse (v)"
        },
        diameter: {
            label: "Diamètre (d)"
        },
        density: {
            label: "Densité (ρ)"
        },
        mass: {
            label: "Masse (m)"
        },
        volume: {
            label: "Volume (V)"
        },
        area: {
            label: "Surface (A)"
        },
        material: {
            label: "Type de matériau"
        },
        yieldStrength: {
            label: "Limite élastique (Sy)"
        },
        Sy: {
            label: "Limite élastique (Sy)"
        },
        safetyFactor: {
            label: "Coefficient de sécurité"
        },
        SF: {
            label: "Coefficient de sécurité (SF)"
        },
        deflection: {
            label: "Flèche"
        },
        bendingStress: {
            label: "Contrainte de flexion"
        },
        sigmaBending: {
            label: "Contrainte de flexion (σb)"
        },
        m: {
            label: "Module (m)",
            desc: "Module d’engrenage"
        },
        z1: {
            label: "Dents pignon (z₁)"
        },
        z2: {
            label: "Dents roue (z₂)"
        },
        alpha: {
            label: "Angle de pression (α)"
        },
        b: {
            label: "Largeur de denture (b)"
        },
        T: {
            label: "Couple (T)"
        },
        d: {
            label: "Diamètre (d)"
        },
        p: {
            label: "Pas (p)"
        },
        k: {
            label: "Hauteur de tête (k)"
        },
        s: {
            label: "Largeur six pans (s)"
        },
        drill: {
            label: "Ø perçage"
        },
        dh: {
            label: "Ø trou (dh)"
        },
        ix: {
            label: "Inertie Ix",
            desc: "Moment d’inertie axe X"
        },
        iy: {
            label: "Inertie Iy",
            desc: "Moment d’inertie axe Y"
        },
        slot: {
            label: "Taille de fente"
        }
    },
    handbook: {
        title: "Bibliothèque d’ingénierie",
        searchPlaceholder: "Rechercher dans la bibliothèque…",
        results: "Résultats",
        noResults: "Aucun résultat.",
        description: "Référentiel complet et consultable de normes, tolérances et données d’ingénierie.",
        featured: "Sélection",
        openTable: "Ouvrir le tableau",
        mathFormula: "Formule mathématique",
        readEntry: "Lire l’entrée",
        viewAll: "Tout voir",
        viewDetails: "Voir les détails",
        categories: "Catégories de la bibliothèque",
        shortcuts: {
            isoTolerances: "Tolérances ISO",
            isoTolerancesDesc: "Cotes linéaires et limites",
            fasteners: "Fixations & filetages",
            fastenersDesc: "Séries M, UN, G et classes de boulons",
            materials: "Propriétés des matériaux",
            materialsDesc: "Densités, limite d’élasticité (Re)",
            mohr: "Cercle de Mohr",
            mohrDesc: "Contraintes principales & déformation 2D",
            beams: "Flèche des poutres",
            beamsDesc: "Formules poutres encastrées et simples",
            roughness: "Rugosité de surface",
            roughnessDesc: "Valeurs Ra & usinage"
        }
    },
    variables: {
        title: "VARIABLES PROJET",
        addVariable: "Ajouter une variable",
        name: "NOM",
        value: "VALEUR",
        unit: "UNITÉ",
        description: "DESCRIPTION",
        placeholderName: "NomVar",
        placeholderDesc: "Description optionnelle…",
        noVariables: "Aucune variable globale définie. Cliquez sur « Ajouter une variable »."
    },
    close: "Fermer",
    minimize: "Réduire",
    maximize: "Agrandir",
    save: "Enregistrer",
    cancel: "Annuler",
    apply: "Appliquer",
    ok: "OK",
    error: "Erreur",
    feedbackTitle: "Contact & feedback",
    costTitle: "Estimateur de coût",
    costDesc: "Détail des coûts de fabrication",
    costBom: "Nomenclature matière",
    costOps: "Opérations",
    costOverhead: "Frais généraux %",
    costMargin: "Marge %",
    costBatch: "Taille de lot",
    costTotal: "Coût total",
    costUnit: "Prix unitaire",
    termPlaceholder: "Saisir une commande… (essayez « help »)",
    termPrefix: "AluCalc ❯",
    shutDown: "Arrêter",
    noModulesFound: "Aucun module trouvé",
    noModulesHint: "Modifiez votre recherche.",
    disciplinesLabel: "Disciplines",
    languageFr: "Français",
    languageIt: "Italien",
    languagePt: "Portugais",
    languageRu: "Russe",
    closeAll: "Fermer toutes les apps"
} as const;
