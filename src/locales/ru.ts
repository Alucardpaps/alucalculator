export default {
    osName: "AluCalc OS",
    version: "v5.0",
    welcomeTitle: "Выберите",
    welcomeHighlight: "рабочее пространство",
    welcomeDesc: "Выберите основной интерфейс. Можно сменить в любой момент.",
    systemInit: "Система инициализирована",
    bootInit: "Инициализация инженерного окружения…",
    bootLoading: "Загрузка ALU_CORE, FLOW_ENGINE, CAD_RT",
    bootMounting: "Монтирование виртуальной файловой системы…",
    bootReady: "Система готова.",
    systemReadyStatus: "Система готова",
    noActiveNodes: "Нет активных узлов расчёта в flow",
    confirmClearWorkspace: "Очистить рабочее пространство?",
    nodeTypeNote: "Заметка",
    nodeTypeMedia: "Медиа",
    nodeTypeNode: "Узел",
    flowTitle: "Flow Engine",
    flowDesc: "Бесконечное полотно для инженерных расчётов. Соединяйте узлы, создавайте потоки и связывайте формулы.",
    cadTitle: "CAD Studio",
    cadDesc: "Профессиональный 2D‑черчёж с линиями, окружностями, размерами и привязкой к сетке.",
    deskTitle: "Творческий стол",
    deskDesc: "Свободная доска для идей. Делайте наброски, перетаскивайте файлы, упорядочивайте визуально.",
    feaTitle: "Система FEA",
    projects: {
        title: "Проекты",
        newProject: "Новый проект",
        allProjects: "Все проекты",
        noProjects: "Проектов пока нет",
        createFirst: "Создать первый проект",
        projectName: "Название проекта",
        description: "Описание (опционально)",
        placeholderName: "Мой инженерный проект",
        placeholderDesc: "Краткое описание…",
        exportProject: "Экспортировать проект",
        importProject: "Импортировать проект",
        duplicate: "Дублировать",
        delete: "Удалить",
        updatedAt: "Обновлено",
        workspacesCount: "рабочее пространство(а)"
    },
    viewFlow: "FLOW",
    welding: {
        title: "Калькулятор сварки",
        subtitle: "Тепловложение • Прочность соединения • AWS D1.1",
        process: "Процесс сварки",
        jointType: "Тип соединения",
        parameters: "Параметры сварки",
        electrodes: "Электрод / проволока",
        processes: {
            mig: "MIG/MAG (GMAW)",
            tig: "TIG (GTAW)",
            smaw: "Ручная дуговая (SMAW)",
            fcaw: "Порошковая (FCAW)",
            saw: "Под флюсом (SAW)",
            mma: "Ручная дуговая (SMAW)",
            mag: "MAG (GMAW)"
        },
        joints: {
            fillet: "Угловой шов",
            doubleFillet: "Двойной угловой",
            butt: "Стыковой (прямой)",
            vGroove: "V‑образный",
            uGroove: "U‑образный",
            jGroove: "J‑образный",
            lap: "Нахлёст",
            tee: "Т‑соединение",
            corner: "Угловое"
        },
        profiles: "Профили материала",
        materials: "Материалы",
        material1: "Материал 1",
        material2: "Материал 2",
        dissimilarWarning: "Разные материалы: {m1} + {m2} — может потребоваться специальный присадочный материал",
        heatInput: "Тепловложение",
        weldStress: "Напряжение в шве",
        throatArea: "Площадь горла",
        minWeldSize: "Мин. размер шва",
        jointEfficiency: "Эффективность соединения",
        preheat: "Предварительный подогрев",
        fillerMetal: "Присадка (оценка)",
        efficiency: "КПД (η)",
        depositionRate: "Скорость наплавки",
        positions: "Положения",
        thermodynamics: "Термодинамика сварки",
        heatFormula: "Формула тепловложения",
        carbonEquivalent: "Эквивалент углерода (CE)",
        notRequired: "Не требуется",
        inputs: {
            current: "Ток",
            voltage: "Напряжение",
            speed: "Скорость",
            thickness: "Толщина (t)",
            legSize: "Катет (a)",
            length: "Длина (L)",
            load: "Нагрузка (F)",
            grooveAngle: "Угол разделки"
        },
        dims: {
            width: "Ширина",
            thick: "Толщина",
            diameter: "Диаметр",
            wallThick: "Толщина стенки",
            height: "Высота",
            flange: "Полка",
            webT: "Стенка",
            leg: "Катет"
        },
        materialSteel: "Сталь",
        materialStainless: "Нержавеющая сталь",
        materialAluminum: "Алюминий",
        materialCopper: "Медь",
        materialBrass: "Латунь",
        heatFormulaDesc: "Энергия, переданная на единицу длины шва. Влияет на охлаждение и металлургию.",
        carbonEquivalentDesc: "Предсказывает прокаливаемость и склонность к холодным трещинам. CE > 0,40% обычно требует подогрева.",
        power: "Мощность",
        geometry: "Геометрия",
        simulationLabel: "СИМУЛЯЦИЯ СОЕДИНЕНИЯ",
        setup: "Настройка процесса"
    },
    viewCad: "CAD",
    viewFea: "FEA",
    viewDesk: "DESK",
    startMenu: "Меню Пуск",
    allApps: "Все приложения",
    searchApps: "Поиск приложений…",
    pinned: "Закреплённые модули",
    searchResults: "Результаты поиска",
    categoryOther: "Другое",
    userPro: "AluCalc Professional",
    toggleDevMode: "Переключить режим разработчика",
    settings: "Настройки",
    appearance: "Внешний вид",
    language: "Язык",
    typography: "Типографика",
    about: "О системе",
    securityVerified: "Безопасность подтверждена",
    appearanceDesc: "Настройте визуальную идентичность рабочей станции.",
    languageDesc: "Выберите региональные настройки и язык интерфейса.",
    typographyDesc: "Оптимизируйте читаемость для техсреды.",
    fontFamily: "Семейство шрифтов",
    fontSizeKey: "Размер шрифта",
    fontPreviewLabel: "Предпросмотр",
    fontPreviewText: "Съешь же ещё этих мягких французских булок, да выпей чаю. 1234567890. Все расчёты подлежат проверке.",
    systemVersion: "Версия инженерного рабочего пространства 5.0.0-Stable",
    architecture: "Архитектура",
    archName: "B-Model Cloud Hybrid",
    engineStatus: "Состояние движка",
    statusOptimized: "ОПТИМИЗИРОВАНО",
    localeLatency: "Задержка локали",
    latencyValue: "2,4 мс (кэш)",
    aboutDesc: "Разработано для профессиональной алюминиевой инженерии и структурного анализа.",
    themeDark: "Кибер‑тёмная",
    themeLight: "Светлая",
    themePaper: "Blueprint",
    themeSea: "Глубокое море",
    themeSky: "Открытое небо",
    themeDarkDesc: "Высокий контраст, низкая утомляемость",
    themeLightDesc: "Оптимизировано для дневного света",
    themePaperDesc: "Инженерная эстетика",
    themeSeaDesc: "Мягкие тёмные тона",
    themeSkyDesc: "Воздушная и минимальная",
    languageEn: "Английский",
    languageTr: "Турецкий",
    languageDe: "Немецкий",
    languageEs: "Испанский",
    languageZh: "Китайский",
    languageJa: "Японский",
    languageKo: "Корейский",
    languageAr: "Арабский",
    modules: {
        calculator: {
            title: "Научный калькулятор"
        },
        "unit-converter": {
            title: "Конвертер единиц"
        },
        "ai-copilot": {
            title: "Aegis AI"
        },
        "file-explorer": {
            title: "Файловый менеджер"
        },
        settings: {
            title: "Настройки"
        },
        handbook: {
            title: "Инженерный справочник"
        },
        browser: {
            title: "Веб‑браузер"
        },
        paint: {
            title: "CAD Paint"
        },
        terminal: {
            title: "Терминал"
        },
        "flow-editor": {
            title: "Редактор flow"
        },
        "parametric-cad": {
            title: "Параметрический CAD"
        },
        "cad-editor": {
            title: "CAD‑редактор"
        },
        "sketch-pad": {
            title: "Блокнот"
        },
        "sheet-metal": {
            title: "Листовой металл"
        },
        "periodic-table": {
            title: "Периодическая таблица"
        },
        "simulation-fea": {
            title: "FEA‑симуляция"
        },
        "profile-weight": {
            title: "Вес профиля"
        },
        "gears-bearings": {
            title: "Калькулятор шестерён"
        },
        welding: {
            title: "Калькулятор сварки"
        },
        fasteners: {
            title: "Момент крепежа"
        },
        "materials-db": {
            title: "База материалов"
        },
        "cutting-optimizer": {
            title: "Оптимизатор раскроя"
        },
        "music-player": {
            title: "Музыкальный плеер"
        },
        "belt-drive": {
            title: "Ремённая передача"
        },
        "beam-deflection": {
            title: "Прогиб балки"
        },
        bearings: {
            title: "Ресурс подшипника (L10)"
        },
        "bolt-stress": {
            title: "Напряжение болта"
        },
        "column-buckling": {
            title: "Потеря устойчивости колонны (Эйлер)"
        },
        "fits-tolerances": {
            title: "Посадки и допуски (ISO 286)"
        },
        "fluid-flow": {
            title: "Потери давления в трубопроводе"
        },
        "gear-spur": {
            title: "Прямозубая шестерня"
        },
        "hydraulic-cylinder": {
            title: "Гидроцилиндр"
        },
        "ohms-law": {
            title: "Закон Ома"
        },
        pumps: {
            title: "Центробежный насос"
        },
        "sheet-metal-v2": {
            title: "Гибка листа"
        },
        "spring-compression": {
            title: "Пружина сжатия"
        },
        "strength-analysis": {
            title: "Анализ прочности"
        },
        "thread-geometry": {
            title: "Геометрия резьбы"
        },
        "torsion-shaft": {
            title: "Кручение (вал)"
        },
        "vat-calculator": {
            title: "Калькулятор НДС"
        },
        "voltage-drop": {
            title: "Падение напряжения"
        },
        "welding-fillet": {
            title: "Прочность углового шва"
        },
        "welding-heat": {
            title: "Тепловложение сварки"
        },
        nesting: {
            title: "Нестинг"
        },
        "analytics-dashboard": {
            title: "Аналитика"
        },
        "engineering-notes": {
            title: "Инженерные заметки"
        },
        "manufacturing-sandbox": {
            title: "Mfg. Sandbox"
        },
        "engineering-selection": {
            title: "Engineering Selection"
        },
        "thermal-expansion": {
            title: "Тепловое расширение"
        },
        "project-manager": {
            title: "Спецификация проекта"
        },
        "cost-estimator": {
            title: "Расчёт стоимости"
        },
        "manufacturing-readiness": {
            title: "Mfg Readiness Analyzer"
        },
        "topology-optimization": {
            title: "Генеративный дизайн"
        },
        "machine-assembly": {
            title: "Сборка машины"
        },
        "failure-prediction": {
            title: "Failure Predictor"
        },
        "fluid-dynamics": {
            title: "Гидродинамика"
        },
        "bolt-torque": {
            title: "Bolt Torque & Preload"
        },
        "chain-drive": {
            title: "Роликовая цепная передача"
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
            input: "Входы и константы",
            mechanical: "Механическое ядро",
            chemical: "Химия / термо",
            validation: "Проверка / ISO",
            visual: "Визуализация",
            export: "Экспорт / отчёт"
        },
        searchPlaceholder: "Поиск узлов…"
    },
    moduleHints: {
        calculator: "Продвинутые математические расчёты",
        "unit-converter": "Инженерные единицы",
        "ai-copilot": "Aegis AI",
        "file-explorer": "Системные файлы",
        settings: "Системные настройки",
        handbook: "Формулы и справочные данные",
        terminal: "Интерфейс командной строки",
        "profile-weight": "Вес алюминиевого профиля",
        "gears-bearings": "Передаточные отношения и ресурс подшипников",
        welding: "Горло и прочность сварки",
        fasteners: "Момент и преднатяг болтов",
        "materials-db": "Свойства материалов",
        "cutting-optimizer": "Эффективность раскроя",
        "music-player": "Локальное и потоковое аудио",
        "belt-drive": "Расчёт шкивов и ремня",
        "thermal-expansion": "Тепловое расширение и изменение размеров",
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
        mechanical: "Механика",
        structural: "Строительная",
        utilities: "Утилиты",
        reference: "Справка",
        science: "Науки",
        software: "ПО",
        civil: "Строительство",
        finance: "Финансы",
        other: "Прочее"
    },
    ribbon: {
        theme: "Тема",
        guide: "Гид",
        variables: "Переменные",
        select: "Выбрать",
        pan: "Панорама",
        line: "Линия (L)",
        polyline: "Полилиния (PL)",
        rectangle: "Прямоугольник (REC)",
        circle: "Окружность (C)",
        copy: "Копия (CO)",
        rotate: "Повернуть (RO)",
        mirror: "Отразить (MI)",
        trim: "Обрезать (TR)",
        extend: "Продлить (EX)",
        offset: "Смещение (O)",
        fillet: "Скругление (F)",
        smartDim: "Умный размер",
        linear: "Линейный",
        text: "Текст",
        coincident: "Совпадение",
        horizontal: "Горизонтально",
        vertical: "Вертикально",
        parallel: "Параллельно",
        perpendicular: "Перпендикулярно",
        tangent: "Касательно",
        equal: "Равно",
        angle: "Угол",
        dist: "Расстояние",
        undo: "Отменить",
        redo: "Повторить",
        zoomIn: "Увеличить",
        zoomOut: "Уменьшить",
        zoomExtents: "По размеру",
        osnap: "OSNAP (F3)",
        grid: "Сетка (F7)",
        importDxf: "Импорт DXF",
        exportDxf: "DXF 2D",
        exportStep: "STEP 3D",
        clearAll: "Очистить всё",
        groupDraw: "Рисование",
        groupModify: "Правка",
        groupDim: "Размеры",
        groupConstraints: "Ограничения",
        groupExport: "Экспорт",
        groupPaint: "Рисование",
        groupContent: "Контент",
        groupCanvas: "Холст",
        groupJob: "Управление",
        groupOutput: "Вывод",
        labelCreativeDesk: "ТВОРЧЕСКИЙ СТОЛ",
        labelMfgCam: "ПРОСТРАНСТВО MFG / CAM",
        labelFeaSim: "ДВИЖОК FEA / СИМУЛЯЦИЯ",
        labelPen: "Перо",
        labelMarker: "Маркер",
        labelEraser: "Ластик",
        labelArrow: "Стрелка",
        labelRect: "Прямоуг.",
        labelCircle: "Окруж.",
        labelClear: "Очистить",
        labelNote: "Заметка",
        labelVideo: "Видео",
        labelMusic: "Музыка",
        labelImage: "Изображение",
        labelExcel: "Excel",
        labelWord: "Word",
        labelPpt: "PPT",
        labelPdf: "PDF",
        labelStartNesting: "Запустить нестинг",
        labelResetJob: "Сбросить задачу",
        labelFullReport: "Полный отчёт",
        labelExportNc: "Экспорт NC",
        labelSolverReady: "Решатель готов",
        labelWorkstation: "ИНЖЕНЕРНАЯ СТАНЦИЯ",
        labelMatrixSparse: "Матрица: разреженная",
        labelStrokeColor: "Цвет линии",
        defaultNote: "📌 Новая заметка",
        promptYoutubeUrl: "Введите URL YouTube:",
        confirmClearSketches: "Очистить все эскизы?",
        confirmClearFlow: "Очистить весь flow? Это действие нельзя отменить.",
        confirmDeleteWindow: "Закрыть это окно?",
        alertSelect2: "Выберите минимум 2 сущности (точки или линии) для ограничения.",
        exportFailed: "Экспорт не удался",
        dxfExportFailed: "Экспорт DXF не удался",
        stepExportFailed: "Экспорт STEP не удался",
        noGeometry: "Нет геометрии для экспорта. Сначала нарисуйте.",
        noExportableGeometry: "Нет экспортируемой геометрии (только линии и окружности).",
        stepExportComplete: "Экспорт STEP завершён: {count} сущностей экспортировано.",
        importedEntities: "Импортировано сущностей: {count}.",
        labelNewNote: "Новая заметка",
        comingSoon: "Скоро…",
        handbookPdf: "Engineering Handbook.pdf",
        newsFeedTitle: "Новости инженерии",
        newsItem1: "Цена алюминия +2%",
        newsItem2: "Опубликован новый стандарт ISO 898-1",
        newsItem3: "Выпущен AluCalc V2"
    },
    featureTree: "Дерево функций",
    sketches: "Эскизы",
    bodies: "Тела",
    constraints: "Ограничения",
    parameters: "Параметры",
    noBodies: "Нет тел",
    dofLabel: "СЭС",
    fullyConstrained: "Полностью ограничено",
    overConstrained: "Сверхограничено",
    underConstrained: "Недоограничено",
    addBody: "Добавить тело",
    parametersTitle: "ПАРАМЕТРЫ",
    resultsTitle: "РЕЗУЛЬТАТЫ",
    fixInputs: "ИСПРАВИТЬ ВХОДНЫЕ",
    switch2D: "ПЕРЕЙТИ В 2D",
    switch3D: "ПЕРЕЙТИ В 3D",
    quickSelect: "БЫСТРЫЙ ВЫБОР",
    varLabel: "ПЕРЕМ",
    dbLabel: "БД",
    selectStandard: "Выбрать стандарт…",
    calcCommon: {
        length: {
            label: "Длина (L)"
        },
        width: {
            label: "Ширина (w)"
        },
        height: {
            label: "Высота (h)"
        },
        thickness: {
            label: "Толщина (t)"
        },
        radius: {
            label: "Радиус (R)",
            desc: "Внутренний радиус гиба"
        },
        angle: {
            label: "Угол (θ)"
        },
        force: {
            label: "Сила (F)"
        },
        torque: {
            label: "Крутящий момент (T)"
        },
        pressure: {
            label: "Давление (P)"
        },
        velocity: {
            label: "Скорость (v)"
        },
        diameter: {
            label: "Диаметр (d)"
        },
        density: {
            label: "Плотность (ρ)"
        },
        mass: {
            label: "Масса (m)"
        },
        volume: {
            label: "Объём (V)"
        },
        area: {
            label: "Площадь (A)"
        },
        material: {
            label: "Тип материала"
        },
        yieldStrength: {
            label: "Предел текучести (Sy)"
        },
        Sy: {
            label: "Предел текучести (Sy)"
        },
        safetyFactor: {
            label: "Коэффициент запаса"
        },
        SF: {
            label: "Коэффициент запаса (SF)"
        },
        deflection: {
            label: "Прогиб"
        },
        bendingStress: {
            label: "Напряжение изгиба"
        },
        sigmaBending: {
            label: "Напряжение изгиба (σb)"
        },
        m: {
            label: "Модуль (m)",
            desc: "Модуль зубчатого колеса"
        },
        z1: {
            label: "Зубья шестерни (z₁)"
        },
        z2: {
            label: "Зубья колеса (z₂)"
        },
        alpha: {
            label: "Угол давления (α)"
        },
        b: {
            label: "Ширина венца (b)"
        },
        T: {
            label: "Крутящий момент (T)"
        },
        d: {
            label: "Диаметр (d)"
        },
        p: {
            label: "Шаг (p)"
        },
        k: {
            label: "Высота головки (k)"
        },
        s: {
            label: "Ширина под ключ (s)"
        },
        drill: {
            label: "Ø сверла"
        },
        dh: {
            label: "Ø отверстия (dh)"
        },
        ix: {
            label: "Инерция Ix",
            desc: "Момент инерции по оси X"
        },
        iy: {
            label: "Инерция Iy",
            desc: "Момент инерции по оси Y"
        },
        slot: {
            label: "Размер паза"
        }
    },
    handbook: {
        title: "Инженерная библиотека",
        searchPlaceholder: "Поиск по библиотеке…",
        results: "Результаты",
        noResults: "Ничего не найдено.",
        description: "Полная и поисковая база стандартов, допусков и инженерных данных.",
        featured: "Избранное",
        openTable: "Открыть таблицу",
        mathFormula: "Математическая формула",
        readEntry: "Читать запись",
        viewAll: "Показать всё",
        viewDetails: "Подробнее",
        categories: "Категории библиотеки",
        shortcuts: {
            isoTolerances: "Допуски ISO",
            isoTolerancesDesc: "Линейные размеры и пределы",
            fasteners: "Крепёж и резьбы",
            fastenersDesc: "Серии M, UN, G и классы болтов",
            materials: "Свойства материалов",
            materialsDesc: "Плотности, предел текучести (Re)",
            mohr: "Круг Мора",
            mohrDesc: "Главные напряжения и 2D деформация",
            beams: "Прогиб балок",
            beamsDesc: "Формулы для защемлённых и простых балок",
            roughness: "Шероховатость поверхности",
            roughnessDesc: "Значения Ra и обработка"
        }
    },
    variables: {
        title: "ПЕРЕМЕННЫЕ ПРОЕКТА",
        addVariable: "Добавить переменную",
        name: "ИМЯ",
        value: "ЗНАЧЕНИЕ",
        unit: "ЕДИНИЦА",
        description: "ОПИСАНИЕ",
        placeholderName: "ИмяПерем",
        placeholderDesc: "Описание (опционально)…",
        noVariables: "Глобальные переменные не определены. Нажмите «Добавить переменную»."
    },
    close: "Закрыть",
    minimize: "Свернуть",
    maximize: "Развернуть",
    save: "Сохранить",
    cancel: "Отмена",
    apply: "Применить",
    ok: "OK",
    error: "Ошибка",
    feedbackTitle: "Контакты и обратная связь",
    costTitle: "Оценка стоимости",
    costDesc: "Разбивка производственных затрат",
    costBom: "Материальная ведомость",
    costOps: "Операции",
    costOverhead: "Накладные %",
    costMargin: "Маржа %",
    costBatch: "Размер партии",
    costTotal: "Итоговая стоимость",
    costUnit: "Цена за единицу",
    termPlaceholder: "Введите команду… (попробуйте 'help')",
    termPrefix: "AluCalc ❯",
    shutDown: "Выключить",
    noModulesFound: "Модули не найдены",
    noModulesHint: "Измените поисковый запрос.",
    disciplinesLabel: "Дисциплины",
    languageFr: "Французский",
    languageIt: "Итальянский",
    languagePt: "Португальский",
    languageRu: "Русский",
    closeAll: "Закрыть все приложения"
} as const;
