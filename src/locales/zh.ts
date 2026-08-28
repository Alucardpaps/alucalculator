export default {
    osName: "AluCalc OS",
    version: "v5.0",
    welcomeTitle: "选择您的",
    welcomeHighlight: "工作区",
    welcomeDesc: "选择您的主要界面。您可以随时切换。",
    systemInit: "系统已启动",
    bootInit: "正在初始化工程运行时...",
    bootLoading: "正在加载 ALU_CORE, FLOW_ENGINE, CAD_RT",
    bootMounting: "正在挂载虚拟文件系统...",
    bootReady: "系统就绪。",
    systemReadyStatus: "系统就绪",
    noActiveNodes: "流程中无活动计算节点",
    confirmClearWorkspace: "清除工作区？",
    nodeTypeNote: "笔记",
    nodeTypeMedia: "媒体",
    nodeTypeNode: "节点",
    flowTitle: "流程引擎 (Flow)",
    flowDesc: "工程计算的无限画布。连接节点、创建数据流并链接公式。",
    cadTitle: "CAD 开发室",
    cadDesc: "具有线、圆、尺寸和网格捕捉精度的专业 2D 绘图。",
    deskTitle: "创意桌面",
    deskDesc: "头脑风暴的自由白板。绘图、拖动文件并以视觉方式组织想法。",
    feaTitle: "FEA 系统",
    projects: {
        title: "项目",
        newProject: "新建项目",
        allProjects: "所有项目",
        noProjects: "暂无项目",
        createFirst: "创建第一个项目",
        projectName: "项目名称",
        description: "描述（可选）",
        placeholderName: "我的工程项目",
        placeholderDesc: "简短描述...",
        exportProject: "导出项目",
        importProject: "导入项目",
        duplicate: "复制",
        delete: "删除",
        updatedAt: "更新于",
        workspacesCount: "个工作区"
    },
    welding: {
        title: "焊接计算器",
        subtitle: "热输入 • 接头强度 • AWS D1.1",
        process: "焊接工艺",
        jointType: "接头类型",
        parameters: "焊接参数",
        electrodes: "焊条 / 焊丝选择",
        profiles: "材料截面",
        materials: "材料",
        material1: "材料 1",
        material2: "材料 2",
        dissimilarWarning: "异种材料: {m1} + {m2} - 可能需要特殊的填充材料",
        heatInput: "热输入",
        weldStress: "焊接应力",
        throatArea: "焊喉面积",
        minWeldSize: "最小焊脚尺寸",
        jointEfficiency: "接头效率",
        preheat: "预热",
        fillerMetal: "填充金属估算",
        efficiency: "效率 (η)",
        depositionRate: "熔敷率",
        positions: "位置",
        thermodynamics: "焊接热力学",
        heatFormula: "热输入公式",
        carbonEquivalent: "碳当量 (CE)",
        notRequired: "不需要",
        inputs: {
            current: "电流",
            voltage: "电压",
            speed: "速度",
            thickness: "厚度 (t)",
            legSize: "焊缝尺寸 (a)",
            length: "长度 (L)",
            load: "载荷 (F)",
            grooveAngle: "坡口角度"
        },
        dims: {
            width: "宽度",
            thick: "厚度",
            diameter: "直径",
            wallThick: "壁厚",
            height: "高度",
            flange: "翼缘",
            webT: "腹板厚度",
            leg: "腿长"
        },
        materialSteel: "钢",
        materialStainless: "不锈钢",
        materialAluminum: "铝",
        materialCopper: "铜",
        materialBrass: "黄铜",
        heatFormulaDesc: "单位长度焊缝传递的能量。控制冷却速度和金相特性。",
        carbonEquivalentDesc: "预测淬透性和冷裂纹敏感性。CE > 0.40% 通常需要预热。",
        processes: {
            mig: "熔化极气体保护焊 (MIG/MAG)",
            tig: "钨极氩弧焊 (TIG)",
            smaw: "手工电弧焊 (SMAW)",
            fcaw: "药芯焊丝电弧焊 (FCAW)",
            saw: "埋弧焊 (SAW)",
            mma: "焊条电弧焊 (SMAW)",
            mag: "MAG (GMAW)"
        },
        joints: {
            fillet: "角焊缝",
            doubleFillet: "双面角焊缝",
            butt: "对接焊缝",
            vGroove: "V型坡口焊",
            uGroove: "U型坡口焊",
            jGroove: "J型坡口焊",
            lap: "搭接接头",
            tee: "T型接头",
            corner: "角接接头"
        },
        power: "功率",
        geometry: "几何",
        simulationLabel: "焊缝仿真",
        setup: "工艺设置"
    },
    viewCad: "CAD",
    viewFea: "FEA",
    viewDesk: "桌面",
    startMenu: "开始菜单",
    allApps: "所有应用程序",
    searchApps: "搜索应用程序...",
    pinned: "固定模块",
    settings: "设置",
    appearance: "外观",
    language: "语言",
    typography: "字体排版",
    about: "关于系统",
    securityVerified: "安全已验证",
    appearanceDesc: "自定义工作站的视觉识别。",
    languageDesc: "选择您偏好的区域设置和界面语言。",
    typographyDesc: "为您的技术环境优化可读性。",
    fontFamily: "字体系列",
    fontSizeKey: "字体大小",
    fontPreviewLabel: "预览",
    fontPreviewText: "敏捷的棕色狐狸跳过懒惰的狗。1234567890。所有工程计算均受验证规则约束。",
    systemVersion: "工程工作区版本 5.0.0-稳定版",
    architecture: "架构",
    archName: "B-Model 云混合架构",
    engineStatus: "引擎状态",
    toggleDevMode: "切换开发者模式",
    statusOptimized: "已优化",
    localeLatency: "区域延迟",
    latencyValue: "2.4ms (缓存命中)",
    aboutDesc: "专为专业铝工程和结构分析设计。",
    themeDark: "赛博深邃",
    themeLight: "纯净明亮",
    themePaper: "工程蓝图",
    themeSea: "深海蓝",
    themeSky: "晴空蓝",
    themeDarkDesc: "高对比度，低疲劳",
    themeLightDesc: "日光优化",
    themePaperDesc: "工程设计美学",
    themeSeaDesc: "柔和的深色调",
    themeSkyDesc: "轻盈极简",
    languageEn: "英语 (English)",
    languageTr: "土耳其语 (Türkçe)",
    languageDe: "德语 (Deutsch)",
    languageEs: "西班牙语 (Español)",
    languageZh: "中文 (Chinese)",
    languageJa: "日语 (Japanese)",
    languageKo: "韩语 (Korean)",
    languageAr: "阿拉伯语 (Arabic)",
    modules: {
        calculator: {
            title: "科学计算器"
        },
        "unit-converter": {
            title: "单位换算器"
        },
        "ai-copilot": {
            title: "Aegis AI"
        },
        "file-explorer": {
            title: "文件管理器"
        },
        settings: {
            title: "设置"
        },
        handbook: {
            title: "工程手册"
        },
        terminal: {
            title: "终端"
        },
        "profile-weight": {
            title: "型材重量"
        },
        "gears-bearings": {
            title: "齿轮计算器"
        },
        welding: {
            title: "焊接计算器"
        },
        fasteners: {
            title: "紧固件扭矩"
        },
        "materials-db": {
            title: "材料数据库"
        },
        "cutting-optimizer": {
            title: "切割优化器"
        },
        "music-player": {
            title: "音乐播放器"
        },
        "belt-drive": {
            title: "带传动"
        },
        "beam-deflection": {
            title: "梁挠度计算"
        },
        bearings: {
            title: "轴承寿命 (L10)"
        },
        "bolt-stress": {
            title: "螺栓拉应力"
        },
        "column-buckling": {
            title: "压杆稳定 (欧拉)"
        },
        "fits-tolerances": {
            title: "配合与公差 (ISO 286)"
        },
        "fluid-flow": {
            title: "管道压力降"
        },
        "gear-spur": {
            title: "直齿轮计算器"
        },
        "hydraulic-cylinder": {
            title: "液压缸"
        },
        "ohms-law": {
            title: "欧姆定律"
        },
        pumps: {
            title: "离心泵"
        },
        "sheet-metal": {
            title: "钣金折弯计算"
        },
        "spring-compression": {
            title: "压缩弹簧计算"
        },
        "strength-analysis": {
            title: "强度分析"
        },
        "thread-geometry": {
            title: "螺纹几何"
        },
        "torsion-shaft": {
            title: "扭转 (轴)"
        },
        "vat-calculator": {
            title: "增值税计算器"
        },
        "voltage-drop": {
            title: "电压降"
        },
        "welding-fillet": {
            title: "角焊缝强度"
        },
        "welding-heat": {
            title: "焊接热输入"
        },
        "analytics-dashboard": {
            title: "分析"
        },
        "engineering-notes": {
            title: "工程笔记"
        },
        "cad-editor": {
            title: "CAD 编辑器"
        },
        "sketch-pad": {
            title: "草图板"
        },
        "periodic-table": {
            title: "元素周期表"
        },
        "simulation-fea": {
            title: "FEA 仿真"
        },
        "manufacturing-sandbox": {
            title: "Mfg. Sandbox"
        },
        "engineering-selection": {
            title: "Engineering Selection"
        },
        "thermal-expansion": {
            title: "热膨胀"
        },
        "project-manager": {
            title: "项目物料清单"
        },
        "cost-estimator": {
            title: "成本引擎"
        },
        "manufacturing-readiness": {
            title: "Mfg Readiness Analyzer"
        },
        "topology-optimization": {
            title: "生成式设计"
        },
        "machine-assembly": {
            title: "机器装配"
        },
        "failure-prediction": {
            title: "Failure Predictor"
        },
        "fluid-dynamics": {
            title: "流体力学"
        },
        "bolt-torque": {
            title: "Bolt Torque & Preload"
        },
        "chain-drive": {
            title: "滚子链传动"
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
        calculator: "高级数学计算",
        "unit-converter": "工程单位换算",
        "ai-copilot": "Aegis AI",
        "file-explorer": "系统文件管理",
        settings: "系统偏好设置",
        handbook: "参考公式与数据",
        terminal: "命令行界面",
        "profile-weight": "铝型材重量计算",
        "gears-bearings": "齿轮比与轴承寿命",
        welding: "焊喉与强度",
        fasteners: "螺栓扭矩与预紧力",
        "materials-db": "材料属性查询",
        "cutting-optimizer": "材料切割效率优化",
        "music-player": "本地与在线音频",
        "belt-drive": "皮带轮与皮带长度",
        "thermal-expansion": "热膨胀与尺寸变化",
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
        mechanical: "机械",
        structural: "结构",
        utilities: "实用工具",
        reference: "参考资料",
        science: "科学",
        software: "软件",
        civil: "土木",
        finance: "金融",
        other: "其他"
    },
    ribbon: {
        theme: "主题",
        guide: "指南",
        variables: "变量",
        select: "选择",
        pan: "平移",
        line: "直线 (L)",
        polyline: "多段线 (PL)",
        rectangle: "矩形 (REC)",
        circle: "圆 (C)",
        copy: "复制 (CO)",
        rotate: "旋转 (RO)",
        mirror: "镜像 (MI)",
        trim: "修剪 (TR)",
        extend: "延伸 (EX)",
        offset: "偏移 (O)",
        fillet: "圆角 (F)",
        smartDim: "智能标注",
        linear: "线性标注",
        text: "文本",
        coincident: "重合",
        horizontal: "水平",
        vertical: "垂直",
        parallel: "平行",
        perpendicular: "垂直",
        tangent: "切线",
        equal: "相等",
        angle: "角度",
        dist: "距离",
        undo: "撤销",
        redo: "重做",
        zoomIn: "放大",
        zoomOut: "缩小",
        zoomExtents: "全屏显示",
        osnap: "对象捕捉 (F3)",
        grid: "网格 (F7)",
        importDxf: "导入 DXF",
        exportDxf: "导出 DXF 2D",
        exportStep: "导出 STEP 3D",
        clearAll: "全部清除",
        groupDraw: "绘制",
        groupModify: "修改",
        groupDim: "标注",
        groupConstraints: "约束",
        groupExport: "导出",
        groupPaint: "绘制",
        groupContent: "内容",
        labelWorkstation: "工程工作站",
        groupCanvas: "画布",
        groupJob: "作业控制",
        groupOutput: "输出",
        labelCreativeDesk: "创意桌面",
        labelMfgCam: "制造 / CAM 工作区",
        labelFeaSim: "FEA / 仿真引擎",
        labelPen: "笔",
        labelMarker: "马克笔",
        labelEraser: "橡皮",
        labelArrow: "箭头",
        labelRect: "矩形",
        labelCircle: "圆",
        labelClear: "清除",
        labelNote: "便笺",
        labelVideo: "视频",
        labelMusic: "音乐",
        labelImage: "图像",
        labelExcel: "Excel",
        labelWord: "Word",
        labelPpt: "PPT",
        labelPdf: "PDF",
        labelStartNesting: "开始排料",
        labelResetJob: "重置作业",
        labelFullReport: "完整报告",
        labelExportNc: "导出 NC",
        labelSolverReady: "求解器就绪",
        labelMatrixSparse: "矩阵：稀疏",
        labelStrokeColor: "描边颜色",
        defaultNote: "📌 新建便笺",
        promptYoutubeUrl: "输入 YouTube 链接：",
        confirmClearSketches: "清除全部草图？",
        confirmClearFlow: "确定清空整个 Flow 工作区吗？此操作无法撤销。",
        confirmDeleteWindow: "关闭此窗口？",
        alertSelect2: "请至少选择 2 个实体（点或线）以添加约束。",
        exportFailed: "导出失败",
        dxfExportFailed: "DXF 导出失败",
        stepExportFailed: "STEP 导出失败",
        noGeometry: "没有可导出的几何。请先绘制。",
        noExportableGeometry: "未找到可导出几何（仅直线和圆）。",
        stepExportComplete: "STEP 导出完成：已导出 {count} 个实体。",
        importedEntities: "已导入 {count} 个实体。",
        labelNewNote: "新建便笺",
        comingSoon: "即将推出...",
        handbookPdf: "工程师手册.pdf",
        newsFeedTitle: "工程新闻源",
        newsItem1: "铝价上涨 2%",
        newsItem2: "新标准 ISO 898-1 发布",
        newsItem3: "AluCalc V2 发布"
    },
    palette: {
        categories: {
            input: "输入与常量",
            mechanical: "机械核心",
            chemical: "化学 / 热力学",
            validation: "验证 / ISO",
            visual: "可视化",
            export: "输出 / 报告"
        },
        searchPlaceholder: "搜索节点..."
    },
    calcCommon: {
        length: {
            label: "长度 (L)"
        },
        width: {
            label: "宽度 (w)"
        },
        height: {
            label: "高度 (h)"
        },
        thickness: {
            label: "厚度 (t)"
        },
        radius: {
            label: "半径 (R)",
            desc: "内部折弯半径"
        },
        angle: {
            label: "角度 (θ)"
        },
        force: {
            label: "力 (F)"
        },
        torque: {
            label: "扭矩 (T)"
        },
        pressure: {
            label: "压力 (P)"
        },
        velocity: {
            label: "速度 (v)"
        },
        diameter: {
            label: "直径 (d)"
        },
        density: {
            label: "密度 (ρ)"
        },
        mass: {
            label: "质量 (m)"
        },
        volume: {
            label: "体积 (V)"
        },
        area: {
            label: "面积 (A)"
        },
        material: {
            label: "材料类型"
        },
        yieldStrength: {
            label: "屈服强度 (Sy)"
        },
        Sy: {
            label: "屈服强度 (Sy)"
        },
        safetyFactor: {
            label: "安全系数"
        },
        SF: {
            label: "安全系数 (SF)"
        },
        deflection: {
            label: "挠度"
        },
        bendingStress: {
            label: "弯曲应力"
        },
        sigmaBending: {
            label: "弯曲应力 (σb)"
        },
        m: {
            label: "模数 (m)",
            desc: "齿轮模数"
        },
        z1: {
            label: "小齿轮齿数 (z₁)"
        },
        z2: {
            label: "大齿轮齿数 (z₂)"
        },
        alpha: {
            label: "压力角 (α)"
        },
        b: {
            label: "齿宽 (b)"
        },
        T: {
            label: "扭矩 (T)"
        },
        d: {
            label: "直径 (d)"
        },
        p: {
            label: "螺距 (p)"
        },
        k: {
            label: "头高 (k)"
        },
        s: {
            label: "对边宽度 (s)"
        },
        drill: {
            label: "钻头直径"
        },
        dh: {
            label: "孔径 (dh)"
        },
        ix: {
            label: "惯性矩 Ix",
            desc: "关于 X 轴的惯性矩"
        },
        iy: {
            label: "惯性矩 Iy",
            desc: "关于 Y 轴的惯性矩"
        },
        slot: {
            label: "槽尺寸"
        }
    },
    close: "关闭",
    minimize: "最小化",
    maximize: "最大化",
    save: "保存",
    cancel: "取消",
    apply: "应用",
    ok: "确定",
    error: "错误",
    handbook: {
        title: "工程知识库",
        searchPlaceholder: "在知识库中搜索...",
        results: "个结果",
        noResults: "未找到结果。",
        description: "一个全面且可搜索的基础机械标准、公差和设计数据存储库。",
        featured: "精选",
        openTable: "打开表格",
        mathFormula: "数学公式",
        readEntry: "阅读条目",
        viewAll: "查看全部",
        viewDetails: "查看详情",
        categories: "知识库分类",
        shortcuts: {
            isoTolerances: "ISO 公差",
            isoTolerancesDesc: "线性尺寸和极限",
            fasteners: "紧固件与螺纹",
            fastenersDesc: "M, UN, G 系列与螺栓等级",
            materials: "材料特性",
            materialsDesc: "密度、屈服强度 (Re)",
            mohr: "莫尔圆",
            mohrDesc: "主应力和 2D 应变",
            beams: "梁挠度",
            beamsDesc: "固定梁和简支梁公式",
            roughness: "表面粗糙度",
            roughnessDesc: "Ra 值与加工"
        }
    },
    variables: {
        title: "项目变量",
        addVariable: "添加变量",
        name: "名称",
        value: "数值",
        unit: "单位",
        description: "描述",
        placeholderName: "变量名",
        placeholderDesc: "可选描述...",
        noVariables: "未定义全局变量。点击“添加变量”创建一个。"
    },
    termPlaceholder: "输入命令... (输入 'help' 获取帮助)",
    termPrefix: "AluCalc ❯",
    viewFlow: "FLOW",
    searchResults: "搜索结果",
    categoryOther: "其他",
    userPro: "AluCalc Professional",
    shutDown: "关机",
    noModulesFound: "未找到模块",
    noModulesHint: "请调整搜索词。",
    disciplinesLabel: "学科",
    languageFr: "法语",
    languageIt: "意大利语",
    languagePt: "葡萄牙语",
    languageRu: "俄语",
    featureTree: "特征树",
    sketches: "草图",
    bodies: "实体",
    constraints: "约束",
    parameters: "参数",
    noBodies: "暂无实体",
    dofLabel: "自由度",
    fullyConstrained: "完全约束",
    overConstrained: "过约束",
    underConstrained: "欠约束",
    addBody: "添加实体",
    parametersTitle: "参数",
    resultsTitle: "结果",
    fixInputs: "固定输入",
    switch2D: "切换到 2D",
    switch3D: "切换到 3D",
    quickSelect: "快速选择",
    varLabel: "VAR",
    dbLabel: "DB",
    selectStandard: "选择标准...",
    closeAll: "关闭全部应用",
    feedbackTitle: "联系与反馈",
    costTitle: "成本估算",
    costDesc: "制造成本分解",
    costBom: "物料清单",
    costOps: "工序",
    costOverhead: "间接费率 %",
    costMargin: "利润率 %",
    costBatch: "批量",
    costTotal: "总成本",
    costUnit: "单价"
} as const;
