export default {
    osName: "AluCalc OS",
    version: "v5.0",
    welcomeTitle: "اختر مساحة",
    welcomeHighlight: "عملك",
    welcomeDesc: "حدد واجهتك الأساسية. يمكنك التبديل في أي وقت.",
    systemInit: "تم بدء تشغيل النظام",
    bootInit: "تهيئة بيئة تشغيل الهندسة...",
    bootLoading: "تحميل ALU_CORE, FLOW_ENGINE, CAD_RT",
    bootMounting: "تركيب نظام الملفات الافتراضي...",
    bootReady: "النظام جاهز.",
    systemReadyStatus: "النظام جاهز",
    noActiveNodes: "لا توجد عقد حسابية نشطة في التدفق",
    confirmClearWorkspace: "مسح مساحة العمل؟",
    nodeTypeNote: "ملاحظة",
    nodeTypeMedia: "وسائط",
    nodeTypeNode: "عقدة",
    flowTitle: "محرك التدفق (Flow)",
    flowDesc: "لوحة لانهائية للحسابات الهندسية. ربط العقد، وإنشاء تدفقات البيانات، وتسلسل الصيغ.",
    cadTitle: "استوديو CAD",
    cadDesc: "رسم ثنائي الأبعاد احترافي مع الخطوط والدوائر والأبعاد ودقة الانجذاب إلى الشبكة.",
    deskTitle: "المكتب الإبداعي",
    deskDesc: "لوحة بيضاء حرة للعصف الذهني. ارسم، واسحب الملفات، ونظم الأفكار بصريًا.",
    feaTitle: "نظام FEA",
    projects: {
        title: "المشاريع",
        newProject: "مشروع جديد",
        allProjects: "كل المشاريع",
        noProjects: "لا توجد مشاريع بعد",
        createFirst: "إنشاء أول مشروع",
        projectName: "اسم المشروع",
        description: "الوصف (اختياري)",
        placeholderName: "مشروعي الهندسي",
        placeholderDesc: "وصف موجز...",
        exportProject: "تصدير المشروع",
        importProject: "استيراد المشروع",
        duplicate: "تكرار",
        delete: "حذف",
        updatedAt: "تم التحديث",
        workspacesCount: "مساحة (مساحات) عمل"
    },
    welding: {
        title: "حاسبة اللحام",
        subtitle: "مدخلات الحرارة • قوة الوصلة • AWS D1.1",
        process: "عملية اللحام",
        jointType: "نوع الوصلة",
        parameters: "معلمات اللحام",
        electrodes: "اختيار القطب / السلك",
        profiles: "مقاطع المواد",
        materials: "المواد",
        material1: "المادة 1",
        material2: "المادة 2",
        dissimilarWarning: "مواد مختلفة: {m1} + {m2} - قد يتطلب حشوًا خاصًا",
        heatInput: "مدخلات الحرارة",
        weldStress: "إجهاد اللحام",
        throatArea: "مساحة الحلق",
        minWeldSize: "أدنى حجم للحام",
        jointEfficiency: "كفاءة الوصلة",
        preheat: "التسخين المسبق",
        fillerMetal: "تقدير معدن الحشو",
        efficiency: "الكفاءة (η)",
        depositionRate: "معدل الترسيب",
        positions: "الأوضاع",
        thermodynamics: "ديناميكا حرارة اللحام",
        heatFormula: "صيغة مدخلات الحرارة",
        carbonEquivalent: "مكافئ الكربون (CE)",
        notRequired: "غير مطلوب",
        inputs: {
            current: "التيار",
            voltage: "الجهد",
            speed: "السرعة",
            thickness: "السماكة (t)",
            legSize: "حجم الساق (a)",
            length: "الطول (L)",
            load: "الحمل (F)",
            grooveAngle: "زاوية الأخدود"
        },
        dims: {
            width: "العرض",
            thick: "السماكة",
            diameter: "القطر",
            wallThick: "سماكة الجدار",
            height: "الارتفاع",
            flange: "الشفة",
            webT: "سماكة العصب",
            leg: "الساق"
        },
        materialSteel: "فولاذ",
        materialStainless: "فولاذ مقاوم للصدأ",
        materialAluminum: "ألومنيوم",
        materialCopper: "نحاس",
        materialBrass: "نحاس أصفر",
        heatFormulaDesc: "الطاقة المنقولة لكل وحدة طول من اللحام. تتحكم في معدل التبريد والخصائص المعدنية.",
        carbonEquivalentDesc: "يتنبأ بالقابلية للتصلد والحساسية للتشقق البارد. CE > 0.40% يتطلب عادة تسخيناً مسبقاً.",
        processes: {
            mma: "لحام قوس معدني (SMAW)",
            mig: "MIG (GMAW)",
            mag: "MAG (GMAW)",
            tig: "TIG (GTAW)",
            fcaw: "سلك قلوب (FCAW)",
            saw: "لحام تحت الخبث (SAW)"
        },
        joints: {
            fillet: "لحام زاوية",
            doubleFillet: "زاوية مزدوجة",
            butt: "لحام تناكبي (مربع)",
            vGroove: "أخدود V",
            uGroove: "أخدود U",
            jGroove: "أخدود J",
            lap: "وصلة تراكب",
            tee: "وصلة T",
            corner: "وصلة زاوية"
        },
        power: "القدرة",
        geometry: "الهندسة",
        simulationLabel: "محاكاة وصلة اللحام",
        setup: "إعداد العملية"
    },
    viewCad: "CAD",
    viewFea: "FEA",
    viewDesk: "المكتب",
    startMenu: "قائمة ابدأ",
    allApps: "모든 الأجهزة التطبيقات",
    searchApps: "البحث في التطبيقات...",
    pinned: "الوحدات المثبتة",
    settings: "الإعدادات",
    appearance: "المظهر",
    language: "اللغة",
    typography: "الخطوط",
    about: "حول النظام",
    securityVerified: "تم التحقق من الأمان",
    appearanceDesc: "تخصيص الهوية البصرية لمحطة عملك.",
    languageDesc: "حدد الإعدادات الإقليمية المفضلة ولغة الواجهة.",
    typographyDesc: "تحسين القراءة لبيئتك التقنية.",
    fontFamily: "عائلة الخطوط",
    fontSizeKey: "حجم الخط",
    fontPreviewLabel: "معاينة",
    fontPreviewText: "نص حكيم له سر قاطع وذو شأن عظيم حرف وبراعة. 1234567890. تخضع جميع الحسابات الهندسية لقواعد التحقق.",
    systemVersion: "نسخة مساحة عمل الهندسة 5.0.0-Stable",
    architecture: "البنية",
    archName: "B-Model Cloud Hybrid",
    engineStatus: "حالة المحرك",
    toggleDevMode: "تبديل وضع المطور",
    statusOptimized: "محسن",
    localeLatency: "زمن وصول اللغة",
    latencyValue: "2.4ms (Cache Hit)",
    aboutDesc: "مصمم لهندسة الألومنيوم الاحترافية والتحليل الإنشائي.",
    themeDark: "سايبر داكن",
    themeLight: "فاتح نظيف",
    themePaper: "مخطط هندسي",
    themeSea: "بحر عميق",
    themeSky: "سماء مفتوحة",
    themeDarkDesc: "تباين عالٍ، تظليل منخفض",
    themeLightDesc: "محسن لضوء النهار",
    themePaperDesc: "جماليات هندسية",
    themeSeaDesc: "نغمات داكنة ناعمة",
    themeSkyDesc: "جوي وبسيط",
    languageEn: "الإنجليزية (English)",
    languageTr: "التركية (Türkçe)",
    languageDe: "الألمانية (Deutsch)",
    languageEs: "الإسبانية (Español)",
    languageZh: "الصينية (Chinese)",
    languageJa: "اليابانية (Japanese)",
    languageKo: "الكورية (Korean)",
    languageAr: "العربية (Arabic)",
    modules: {
        calculator: {
            title: "حاسبة علمية"
        },
        "unit-converter": {
            title: "محول الوحدات"
        },
        "ai-copilot": {
            title: "Aegis AI"
        },
        "file-explorer": {
            title: "مستكشف الملفات"
        },
        settings: {
            title: "الإعدادات"
        },
        handbook: {
            title: "كتيب الهندسة"
        },
        terminal: {
            title: "محطة الأوامر"
        },
        "profile-weight": {
            title: "وزن البروفايل"
        },
        "gears-bearings": {
            title: "حاسبة التروس"
        },
        welding: {
            title: "حاسبة اللحام"
        },
        fasteners: {
            title: "عزم الدوران"
        },
        "materials-db": {
            title: "قاعدة بيانات المواد"
        },
        "cutting-optimizer": {
            title: "محسن القطع"
        },
        "music-player": {
            title: "مشغل الموسيقى"
        },
        "belt-drive": {
            title: "محرك الحزام"
        },
        "beam-deflection": {
            title: "حساب انحراف الشعاع"
        },
        bearings: {
            title: "عمر المحمل (L10)"
        },
        "bolt-stress": {
            title: "إجهاد شد البراغي"
        },
        "column-buckling": {
            title: "انبعاج الأعمدة (Euler)"
        },
        "fits-tolerances": {
            title: "التوافق والتفاوتات (ISO 286)"
        },
        "fluid-flow": {
            title: "فقدان ضغط الأنابيب"
        },
        "gear-spur": {
            title: "حاسبة التروس الأسطوانية"
        },
        "hydraulic-cylinder": {
            title: "أسطوانة هيدروليكية"
        },
        "ohms-law": {
            title: "قانون أوم"
        },
        pumps: {
            title: "مضخة طرد مركزي"
        },
        "sheet-metal": {
            title: "حساب ثني الصاج"
        },
        "spring-compression": {
            title: "حاسبة زنبرك الضغط"
        },
        "strength-analysis": {
            title: "تحليل القوة"
        },
        "thread-geometry": {
            title: "هندسة اللولب"
        },
        "torsion-shaft": {
            title: "الالتواء (عمود)"
        },
        "vat-calculator": {
            title: "حاسبة ضريبة القيمة المضافة"
        },
        "voltage-drop": {
            title: "هبوط الجهد"
        },
        "welding-fillet": {
            title: "قوة اللحام الزاوي"
        },
        "welding-heat": {
            title: "دخل حرارة اللحام"
        },
        "analytics-dashboard": {
            title: "التحليلات"
        },
        "engineering-notes": {
            title: "ملاحظات هندسية"
        },
        "cad-editor": {
            title: "محرر CAD"
        },
        "sketch-pad": {
            title: "لوحة الرسم"
        },
        "periodic-table": {
            title: "الجدول الدوري"
        },
        "simulation-fea": {
            title: "محاكاة العناصر المحدودة"
        },
        "manufacturing-sandbox": {
            title: "Mfg. Sandbox"
        },
        "engineering-selection": {
            title: "Engineering Selection"
        },
        "thermal-expansion": {
            title: "التمدد الحراري"
        },
        "project-manager": {
            title: "قائمة مواد المشروع"
        },
        "cost-estimator": {
            title: "محرك التكلفة"
        },
        "manufacturing-readiness": {
            title: "Mfg Readiness Analyzer"
        },
        "topology-optimization": {
            title: "التصميم التوليدي"
        },
        "machine-assembly": {
            title: "تجميع الآلة"
        },
        "failure-prediction": {
            title: "Failure Predictor"
        },
        "fluid-dynamics": {
            title: "ديناميكا الموائع"
        },
        "bolt-torque": {
            title: "Bolt Torque & Preload"
        },
        "chain-drive": {
            title: "ناقل الحركة بالسلسلة الأسطوانية"
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
        calculator: "حسابات رياضية متقدمة",
        "unit-converter": "تحويل الوحدات الهندسية",
        "ai-copilot": "Aegis AI",
        "file-explorer": "إدارة ملفات النظام",
        settings: "تفضيلات النظام",
        handbook: "صيغ وبيانات مرجعية",
        terminal: "واجهة سطر الأوامر",
        "profile-weight": "حساب وزن بروفيلات الألومنيوم",
        "gears-bearings": "نسب التروس وعمر المحامل",
        welding: "قوة اللحام وحجمه",
        fasteners: "عزم البراغي والشد المسبق",
        "materials-db": "خصائص المواد",
        "cutting-optimizer": "تحسين كفاءة قطع المواد",
        "music-player": "صوتيات محلية وعبر الإنترنت",
        "belt-drive": "حساب البكرة وطول الحزام",
        "thermal-expansion": "التمدد الحراري والتغير البعدي",
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
        mechanical: "ميكانيكي",
        structural: "إنشائي",
        utilities: "أدوات المساعدة",
        reference: "مرجع",
        science: "علوم",
        software: "برمجيات",
        civil: "مدني",
        finance: "مالية",
        other: "أخرى"
    },
    ribbon: {
        theme: "المظهر",
        guide: "دليل",
        variables: "متغيرات",
        select: "تحديد",
        pan: "تحريك",
        line: "خط (L)",
        polyline: "خط متعدد (PL)",
        rectangle: "مستطيل (REC)",
        circle: "دائرة (C)",
        copy: "نسخ (CO)",
        rotate: "تدوير (RO)",
        mirror: "مرآة (MI)",
        trim: "قص (TR)",
        extend: "تعديل (EX)",
        offset: "إزاحة (O)",
        fillet: "شطب (F)",
        smartDim: "أبعاد ذكية",
        linear: "خطي",
        text: "نص",
        coincident: "منطبق",
        horizontal: "أفقي",
        vertical: "رأسي",
        parallel: "موازي",
        perpendicular: "عمودي",
        tangent: "مماس",
        equal: "متساوي",
        angle: "زاوية",
        dist: "مسافة",
        undo: "تراجع",
        redo: "إعادة",
        zoomIn: "تكبير",
        zoomOut: "تصغير",
        zoomExtents: "ملاءمة",
        osnap: "الالتقاط (F3)",
        grid: "الشبكة (F7)",
        importDxf: "استيراد DXF",
        exportDxf: "تصدير DXF 2D",
        exportStep: "تصدير STEP 3D",
        clearAll: "مسح الكل",
        groupDraw: "رسم",
        groupModify: "تعديل",
        groupDim: "أبعاد",
        groupConstraints: "قيود",
        groupExport: "تصدير",
        groupPaint: "رسم",
        groupContent: "محتوى",
        labelWorkstation: "محطة الهندسة",
        groupCanvas: "اللوحة",
        groupJob: "التحكم بالمهمة",
        groupOutput: "المخرجات",
        labelCreativeDesk: "المكتب الإبداعي",
        labelMfgCam: "مساحة التصنيع / CAM",
        labelFeaSim: "محرك FEA / المحاكاة",
        labelPen: "قلم",
        labelMarker: "قلم تحديد",
        labelEraser: "ممحاة",
        labelArrow: "سهم",
        labelRect: "مستطيل",
        labelCircle: "دائرة",
        labelClear: "مسح",
        labelNote: "ملاحظة",
        labelVideo: "فيديو",
        labelMusic: "موسيقى",
        labelImage: "صورة",
        labelExcel: "Excel",
        labelWord: "Word",
        labelPpt: "PPT",
        labelPdf: "PDF",
        labelStartNesting: "بدء التداخل",
        labelResetJob: "إعادة تعيين المهمة",
        labelFullReport: "تقرير كامل",
        labelExportNc: "تصدير NC",
        labelSolverReady: "الحلّال جاهز",
        labelMatrixSparse: "مصفوفة: متفرقة",
        labelStrokeColor: "لون الخط",
        defaultNote: "📌 ملاحظة جديدة",
        promptYoutubeUrl: "أدخل رابط YouTube:",
        confirmClearSketches: "مسح كل المخططات؟",
        confirmClearFlow: "هل تريد مسح مساحة Flow بالكامل؟ لا يمكن التراجع عن هذا.",
        confirmDeleteWindow: "إغلاق هذه النافذة؟",
        alertSelect2: "حدد كيانين على الأقل (نقاط أو خطوط) للتقييد.",
        exportFailed: "فشل التصدير",
        dxfExportFailed: "فشل تصدير DXF",
        stepExportFailed: "فشل تصدير STEP",
        noGeometry: "لا توجد هندسة للتصدير. ارسم أولاً.",
        noExportableGeometry: "لا توجد هندسة قابلة للتصدير (خطوط ودوائر فقط).",
        stepExportComplete: "اكتمل تصدير STEP: تم تصدير {count} كيان.",
        importedEntities: "تم استيراد {count} كيان.",
        labelNewNote: "ملاحظة جديدة",
        comingSoon: "قريباً...",
        handbookPdf: "دليل-المهندس.pdf",
        newsFeedTitle: "تغذية أخبار الهندسة",
        newsItem1: "أسعار الألمنيوم +2%",
        newsItem2: "صدرت مواصفة ISO 898-1 الجديدة",
        newsItem3: "تم إطلاق AluCalc V2"
    },
    palette: {
        categories: {
            input: "الإدخال والثوابت",
            mechanical: "اللب الميكانيكي",
            chemical: "كيميائي / حراري",
            validation: "التحقق / ISO",
            visual: "المصورات",
            export: "الإخراج / التقارير"
        },
        searchPlaceholder: "بحث عن العقد..."
    },
    calcCommon: {
        length: {
            label: "الطول (L)"
        },
        width: {
            label: "العرض (w)"
        },
        height: {
            label: "الارتفاع (h)"
        },
        thickness: {
            label: "السمك (t)"
        },
        radius: {
            label: "نصف القطر (R)",
            desc: "نصف قطر الثني الداخلي"
        },
        angle: {
            label: "الزاوية (θ)"
        },
        force: {
            label: "القوة (F)"
        },
        torque: {
            label: "عزم الدوران (T)"
        },
        pressure: {
            label: "الضغط (P)"
        },
        velocity: {
            label: "السرعة (v)"
        },
        diameter: {
            label: "القطر (d)"
        },
        density: {
            label: "الكثافة (ρ)"
        },
        mass: {
            label: "الكتلة (m)"
        },
        volume: {
            label: "الحجم (V)"
        },
        area: {
            label: "المساحة (A)"
        },
        material: {
            label: "نوع المادة"
        },
        yieldStrength: {
            label: "إجهاد الخضوع (Sy)"
        },
        Sy: {
            label: "إجهاد الخضوع (Sy)"
        },
        safetyFactor: {
            label: "معامل الأمان"
        },
        SF: {
            label: "معامل الأمان (SF)"
        },
        deflection: {
            label: "الانحراف"
        },
        bendingStress: {
            label: "إجهاد الانحناء"
        },
        sigmaBending: {
            label: "إجهاد الانحناء (σb)"
        },
        m: {
            label: "الموديول (m)",
            desc: "حجم موديول الترس"
        },
        z1: {
            label: "عدد أسنان الترس الصغير (z₁)"
        },
        z2: {
            label: "عدد أسنان الترس الكبير (z₂)"
        },
        alpha: {
            label: "زاوية الضغط (α)"
        },
        b: {
            label: "عرض الوجه (b)"
        },
        T: {
            label: "عزم الدوران (T)"
        },
        d: {
            label: "القطر (d)"
        },
        p: {
            label: "الخطوة (p)"
        },
        k: {
            label: "ارتفاع الرأس (k)"
        },
        s: {
            label: "عرض السداسي (s)"
        },
        drill: {
            label: "قطر المثقاب"
        },
        dh: {
            label: "قطر الثقب (dh)"
        },
        ix: {
            label: "القصور Ix",
            desc: "عزم القصور حول المحور X"
        },
        iy: {
            label: "القصور Iy",
            desc: "عزم القصور حول المحور Y"
        },
        slot: {
            label: "حجم الأخدود"
        }
    },
    close: "إغلاق",
    minimize: "تصغير",
    maximize: "تكبير",
    save: "حفظ",
    cancel: "إلغاء",
    apply: "تطبيق",
    ok: "تم",
    error: "خطأ",
    handbook: {
        title: "مكتبة الهندسة",
        searchPlaceholder: "البحث في المكتبة...",
        results: "نتائج",
        noResults: "لم يتم العثور على نتائج.",
        description: "مستودع شامل وقابل للبحث للمعايير الميكانيكية والتفاوتات وبيانات التصميم.",
        featured: "مميزة",
        openTable: "فتح الجدول",
        mathFormula: "صيغة رياضية",
        readEntry: "قراءة المدخل",
        viewAll: "عرض الكل",
        viewDetails: "عرض التفاصيل",
        categories: "فئات المكتبة",
        shortcuts: {
            isoTolerances: "تفاوتات ISO",
            isoTolerancesDesc: "الأبعاد الخطية والحدود",
            fasteners: "المثبتات والأسنان اللولبية",
            fastenersDesc: "سلاسل M و UN و G وفئات البراغي",
            materials: "خصائص المواد",
            materialsDesc: "الكثافة، قوة الخضوع (Re)",
            mohr: "دائرة مور",
            mohrDesc: "الإجهادات الرئيسية والانفعال 2D",
            beams: "انحراف العوارض",
            beamsDesc: "صيغ العوارض الثابتة والبسيطة",
            roughness: "خشونة السطح",
            roughnessDesc: "قيم Ra والمعالجة"
        }
    },
    variables: {
        title: "متغيرات المشروع",
        addVariable: "إضافة متغير",
        name: "الاسم",
        value: "القيمة",
        unit: "الوحدة",
        description: "الوصف",
        placeholderName: "اسم_المتغير",
        placeholderDesc: "وصف اختياري...",
        noVariables: "لا توجد متغيرات عامة محددة. انقر فوق \"إضافة متغير\" لإنشاء واحد."
    },
    termPlaceholder: "اكتب أمراً... (جرب 'help')",
    termPrefix: "AluCalc ❯",
    viewFlow: "FLOW",
    searchResults: "نتائج البحث",
    categoryOther: "أخرى",
    userPro: "AluCalc Professional",
    shutDown: "إيقاف التشغيل",
    noModulesFound: "لا توجد وحدات",
    noModulesHint: "جرّب تعديل عبارة البحث.",
    disciplinesLabel: "التخصصات",
    languageFr: "الفرنسية",
    languageIt: "الإيطالية",
    languagePt: "البرتغالية",
    languageRu: "الروسية",
    featureTree: "شجرة السمات",
    sketches: "المخططات",
    bodies: "الأجسام",
    constraints: "القيود",
    parameters: "المعلمات",
    noBodies: "لا توجد أجسام بعد",
    dofLabel: "درجات الحرية",
    fullyConstrained: "مقيّد بالكامل",
    overConstrained: "مقيّد زيادة",
    underConstrained: "ناقص التقييد",
    addBody: "إضافة جسم",
    parametersTitle: "المعلمات",
    resultsTitle: "النتائج",
    fixInputs: "تثبيت المدخلات",
    switch2D: "التبديل إلى 2D",
    switch3D: "التبديل إلى 3D",
    quickSelect: "اختيار سريع",
    varLabel: "VAR",
    dbLabel: "قاعدة",
    selectStandard: "اختر المواصفة...",
    closeAll: "إغلاق كل التطبيقات",
    feedbackTitle: "التواصل والملاحظات",
    costTitle: "مقدّر التكلفة",
    costDesc: "تفصيل تكلفة التصنيع",
    costBom: "قائمة المواد",
    costOps: "العمليات",
    costOverhead: "التكاليف غير المباشرة %",
    costMargin: "الهامش %",
    costBatch: "حجم الدفعة",
    costTotal: "التكلفة الإجمالية",
    costUnit: "سعر الوحدة"
} as const;
