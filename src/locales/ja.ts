export default {
    osName: "AluCalc OS",
    version: "v5.0",
    welcomeTitle: "ワークスペースを",
    welcomeHighlight: "選択",
    welcomeDesc: "主要なインターフェースを選択してください。いつでも切り替え可能です。",
    systemInit: "システムを初期化しました",
    bootInit: "エンジニアリング・ランタイムを初期化中...",
    bootLoading: "ALU_CORE, FLOW_ENGINE, CAD_RT をロード中...",
    bootMounting: "仮想ファイルシステムをマウント中...",
    bootReady: "システム準備完了。",
    systemReadyStatus: "システム準備完了",
    noActiveNodes: "フローにアクティブな計算ノードがありません",
    confirmClearWorkspace: "ワークスペースをクリアしますか？",
    nodeTypeNote: "ノート",
    nodeTypeMedia: "メディア",
    nodeTypeNode: "ノード",
    flowTitle: "フローエンジン (Flow)",
    flowDesc: "エンジニアリング計算のための無限のキャンバス。ノードを接続し、データフローを作成し、数式を連鎖させます。",
    cadTitle: "CAD スタジオ",
    cadDesc: "線、円、寸法、グリッドスナップ精度を備えたプロフェッショナルな 2D ドラフティング。",
    deskTitle: "クリエイティブデスク",
    deskDesc: "ブレインストーミング用のフリーフォームホワイトボード。スケッチ、ファイルのドラッグ、アイデアの視覚的な整理が可能です。",
    feaTitle: "FEA システム",
    projects: {
        title: "プロジェクト",
        newProject: "新規プロジェクト",
        allProjects: "すべてのプロジェクト",
        noProjects: "プロジェクトはまだありません",
        createFirst: "最初のプロジェクトを作成",
        projectName: "プロジェクト名",
        description: "説明（オプション）",
        placeholderName: "マイ・エンジニアリング・プロジェクト",
        placeholderDesc: "簡単な説明...",
        exportProject: "プロジェクトを書き出し",
        importProject: "プロジェクトを読み込み",
        duplicate: "複製",
        delete: "削除",
        updatedAt: "更新日",
        workspacesCount: "個のワークスペース"
    },
    welding: {
        title: "溶接計算機",
        subtitle: "入熱 • 接合強度 • AWS D1.1",
        process: "溶接プロセス",
        jointType: "継手種類",
        parameters: "溶接パラメータ",
        electrodes: "溶接棒 / ワイヤ選択",
        profiles: "材料面",
        materials: "材料",
        material1: "材料 1",
        material2: "材料 2",
        dissimilarWarning: "異種材料: {m1} + {m2} - 特殊な溶加材が必要な場合があります",
        heatInput: "入熱",
        weldStress: "溶接応力",
        throatArea: "のど断面厚",
        minWeldSize: "最小脚長",
        jointEfficiency: "継手効率",
        preheat: "予熱",
        fillerMetal: "推定溶加材量",
        efficiency: "効率 (η)",
        depositionRate: "溶着速度",
        positions: "姿勢",
        thermodynamics: "溶接熱力学",
        heatFormula: "入熱公式",
        carbonEquivalent: "炭素当量 (CE)",
        notRequired: "不要",
        inputs: {
            current: "電流",
            voltage: "電圧",
            speed: "速度",
            thickness: "厚さ (t)",
            legSize: "脚長 (a)",
            length: "長さ (L)",
            load: "荷重 (F)",
            grooveAngle: "開先角度"
        },
        dims: {
            width: "幅",
            thick: "厚さ",
            diameter: "径",
            wallThick: "肉厚",
            height: "高さ",
            flange: "フランジ",
            webT: "ウェブ厚",
            leg: "脚"
        },
        materialSteel: "鋼",
        materialStainless: "ステンレス",
        materialAluminum: "アルミニウム",
        materialCopper: "銅",
        materialBrass: "真鍮",
        heatFormulaDesc: "溶接単位長さあたりに伝達されるエネルギー。冷却速度と冶金的性質を制御します。",
        carbonEquivalentDesc: "焼入性と低温割れ感受性を予測します。CE > 0.40% は通常予熱が必要です。",
        processes: {
            mig: "MIG/MAG (GMAW)",
            tig: "TIG (GTAW)",
            smaw: "被覆アーク溶接 (SMAW)",
            fcaw: "フラックス入りワイヤ溶接 (FCAW)",
            saw: "サブマージアーク溶接 (SAW)",
            mma: "被覆アーク (SMAW)",
            mag: "MAG (GMAW)"
        },
        joints: {
            fillet: "すみ肉溶接",
            doubleFillet: "両面すみ肉溶接",
            butt: "突き合わせ溶接",
            vGroove: "V形開先溶接",
            uGroove: "U形開先溶接",
            jGroove: "J形開先溶接",
            lap: "重ね継手",
            tee: "T形継手",
            corner: "角継手"
        },
        power: "動力",
        geometry: "幾何",
        simulationLabel: "溶接継手シミュレーション",
        setup: "プロセス設定"
    },
    viewCad: "CAD",
    viewFea: "FEA",
    viewDesk: "デスク",
    startMenu: "スタートメニュー",
    allApps: "すべてのアプリケーション",
    searchApps: "アプリケーションを検索...",
    pinned: "固定プログラム",
    settings: "設定",
    appearance: "外観",
    language: "言語",
    typography: "タイポグラフィ",
    about: "OSについて",
    securityVerified: "セキュリティ検証済み",
    appearanceDesc: "ワークステーションの視覚的アイデンティティをカスタマイズします。",
    languageDesc: "優先する地域設定とインターフェース言語を選択してください。",
    typographyDesc: "技術環境に合わせて読みやすさを最適化します。",
    fontFamily: "フォントファミリー",
    fontSizeKey: "フォントサイズ",
    fontPreviewLabel: "プレビュー",
    fontPreviewText: "色は匂へど散りぬるを我が世誰ぞ常ならむ。1234567890。すべてのエンジニアリング計算は検証ルールの対象となります。",
    systemVersion: "エンジニアリング・ワークスペース バージョン 5.0.0-Stable",
    architecture: "アーキテクチャ",
    archName: "B-Model クラウドハイブリッド",
    engineStatus: "エンジンステータス",
    toggleDevMode: "開発者モードを切り替え",
    statusOptimized: "最適化済み",
    localeLatency: "ロケール・レイテンシ",
    latencyValue: "2.4ms (キャッシュヒット)",
    aboutDesc: "プロフェッショナルなアルミニウム設計と構造解析のために設計されました。",
    themeDark: "サイバー・ダーク",
    themeLight: "クリーン・ライト",
    themePaper: "ブループリント",
    themeSea: "ディープ・シー",
    themeSky: "オープン・スカイ",
    themeDarkDesc: "高コントラスト、低疲労",
    themeLightDesc: "昼光最適化",
    themePaperDesc: "エンジニアリング・エステティクス",
    themeSeaDesc: "柔らかなダークトーン",
    themeSkyDesc: "エアリーでミニマル",
    languageEn: "英語 (English)",
    languageTr: "トルコ語 (Türkçe)",
    languageDe: "ドイツ語 (Deutsch)",
    languageEs: "スペイン語 (Español)",
    languageZh: "中国語 (Chinese)",
    languageJa: "日本語 (Japanese)",
    languageKo: "韓国語 (Korean)",
    languageAr: "アラビア語 (Arabic)",
    modules: {
        calculator: {
            title: "科学計算機"
        },
        "unit-converter": {
            title: "単位変換器"
        },
        "ai-copilot": {
            title: "Aegis AI"
        },
        "file-explorer": {
            title: "ファイルエクスプローラー"
        },
        settings: {
            title: "設定"
        },
        handbook: {
            title: "エンジニアリングハンドブック"
        },
        terminal: {
            title: "ターミナル"
        },
        "profile-weight": {
            title: "プロファイル重量"
        },
        "gears-bearings": {
            title: "ギア計算機"
        },
        welding: {
            title: "溶接計算機"
        },
        fasteners: {
            title: "締結トルク"
        },
        "materials-db": {
            title: "材料データベース"
        },
        "cutting-optimizer": {
            title: "切断オプティマイザー"
        },
        "music-player": {
            title: "音楽プレーヤー"
        },
        "belt-drive": {
            title: "ベルトドライブ"
        },
        "beam-deflection": {
            title: "梁のたわみ計算"
        },
        bearings: {
            title: "軸承寿命 (L10)"
        },
        "bolt-stress": {
            title: "ボルト引張応力"
        },
        "column-buckling": {
            title: "柱の座屈 (オイラー)"
        },
        "fits-tolerances": {
            title: "はめあいと公差 (ISO 286)"
        },
        "fluid-flow": {
            title: "配管圧力損失"
        },
        "gear-spur": {
            title: "平歯車計算機"
        },
        "hydraulic-cylinder": {
            title: "油圧シリンダ"
        },
        "ohms-law": {
            title: "オームの法則"
        },
        pumps: {
            title: "遠心ポンプ"
        },
        "sheet-metal": {
            title: "板金曲げ計算"
        },
        "spring-compression": {
            title: "圧縮ばね計算"
        },
        "strength-analysis": {
            title: "強度解析"
        },
        "thread-geometry": {
            title: "ねじ幾何"
        },
        "torsion-shaft": {
            title: "ねじり (軸)"
        },
        "vat-calculator": {
            title: "付加価値税計算機"
        },
        "voltage-drop": {
            title: "電圧降下"
        },
        "welding-fillet": {
            title: "すみ肉溶接強度"
        },
        "welding-heat": {
            title: "溶接入熱"
        },
        "analytics-dashboard": {
            title: "分析"
        },
        "engineering-notes": {
            title: "エンジニアリングノート"
        },
        "cad-editor": {
            title: "CADエディタ"
        },
        "sketch-pad": {
            title: "スケッチパッド"
        },
        "periodic-table": {
            title: "周期表"
        },
        "simulation-fea": {
            title: "FEAシミュレーション"
        },
        "manufacturing-sandbox": {
            title: "Mfg. Sandbox"
        },
        "engineering-selection": {
            title: "Engineering Selection"
        },
        "thermal-expansion": {
            title: "熱膨張"
        },
        "project-manager": {
            title: "プロジェクトBOM"
        },
        "cost-estimator": {
            title: "コストエンジン"
        },
        "manufacturing-readiness": {
            title: "Mfg Readiness Analyzer"
        },
        "topology-optimization": {
            title: "ジェネレーティブデザイン"
        },
        "machine-assembly": {
            title: "機械組立"
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
            title: "Roller Chain Drive"
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
        calculator: "高度な数学計算",
        "unit-converter": "エンジニアリング単位換算",
        "ai-copilot": "Aegis AI",
        "file-explorer": "システムファイル管理",
        settings: "システム設定",
        handbook: "参考公式とデータ",
        terminal: "コマンドラインインターフェース",
        "profile-weight": "アルミ押し出し型材の重量計算",
        "gears-bearings": "ギア比と軸受寿命",
        welding: "溶接のど厚と強度",
        fasteners: "ボルトのトルクと初期引張力",
        "materials-db": "材料特性の照会",
        "cutting-optimizer": "材料切断効率の最適化",
        "music-player": "ローカルおよびストリーミングオーディオ",
        "belt-drive": "プーリとベルト長の計算",
        "thermal-expansion": "熱膨張と寸法変化",
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
        mechanical: "機械",
        structural: "構造",
        utilities: "ユーティリティ",
        reference: "リファレンス",
        science: "科学",
        software: "ソフトウェア",
        civil: "土木",
        finance: "金融",
        other: "その他"
    },
    ribbon: {
        theme: "テーマ",
        guide: "ガイド",
        variables: "変数",
        select: "選択",
        pan: "パン",
        line: "線 (L)",
        polyline: "ポリライン (PL)",
        rectangle: "長方形 (REC)",
        circle: "円 (C)",
        copy: "コピー (CO)",
        rotate: "回転 (RO)",
        mirror: "ミラー (MI)",
        trim: "トリム (TR)",
        extend: "延長 (EX)",
        offset: "オフセット (O)",
        fillet: "フィレット (F)",
        smartDim: "スマート寸法",
        linear: "並行寸法",
        text: "テキスト",
        coincident: "一致",
        horizontal: "水平",
        vertical: "垂直",
        parallel: "平行",
        perpendicular: "直交",
        tangent: "接線",
        equal: "等しい",
        angle: "角度",
        dist: "距離",
        undo: "元に戻す",
        redo: "やり直し",
        zoomIn: "拡大",
        zoomOut: "縮小",
        zoomExtents: "全体表示",
        osnap: "オブジェクトスナップ (F3)",
        grid: "グリッド (F7)",
        importDxf: "DXF インポート",
        exportDxf: "DXF 2D 書き出し",
        exportStep: "STEP 3D 書き出し",
        clearAll: "すべて消去",
        groupDraw: "描画",
        groupModify: "修正",
        groupDim: "寸法",
        groupConstraints: "拘束",
        groupExport: "エクスポート",
        groupPaint: "ペイント",
        groupContent: "コンテンツ",
        labelWorkstation: "エンジニアリングワークステーション",
        groupCanvas: "キャンバス",
        groupJob: "ジョブ制御",
        groupOutput: "出力",
        labelCreativeDesk: "クリエイティブデスク",
        labelMfgCam: "製造 / CAM ワークスペース",
        labelFeaSim: "FEA / シミュレーション",
        labelPen: "ペン",
        labelMarker: "マーカー",
        labelEraser: "消しゴム",
        labelArrow: "矢印",
        labelRect: "矩形",
        labelCircle: "円",
        labelClear: "クリア",
        labelNote: "メモ",
        labelVideo: "動画",
        labelMusic: "音楽",
        labelImage: "画像",
        labelExcel: "Excel",
        labelWord: "Word",
        labelPpt: "PPT",
        labelPdf: "PDF",
        labelStartNesting: "ネスティング開始",
        labelResetJob: "ジョブをリセット",
        labelFullReport: "完全レポート",
        labelExportNc: "NCエクスポート",
        labelSolverReady: "ソルバー準備完了",
        labelMatrixSparse: "行列: 疎",
        labelStrokeColor: "線の色",
        defaultNote: "📌 新しいメモ",
        promptYoutubeUrl: "YouTube URLを入力:",
        confirmClearSketches: "すべてのスケッチを消去しますか？",
        confirmClearFlow: "フロー作業領域をすべて消去しますか？この操作は元に戻せません。",
        confirmDeleteWindow: "このウィンドウを閉じますか？",
        alertSelect2: "拘束するには点または線を2つ以上選択してください。",
        exportFailed: "エクスポート失敗",
        dxfExportFailed: "DXFエクスポート失敗",
        stepExportFailed: "STEPエクスポート失敗",
        noGeometry: "エクスポートする幾何がありません。先に描画してください。",
        noExportableGeometry: "エクスポート可能な幾何がありません（線と円のみ）。",
        stepExportComplete: "STEPエクスポート完了: {count} 個の要素を出力。",
        importedEntities: "{count} 個の要素を読み込みました。",
        labelNewNote: "新しいメモ",
        comingSoon: "近日公開...",
        handbookPdf: "技術便覧.pdf",
        newsFeedTitle: "エンジニアリングニュース",
        newsItem1: "アルミ価格 2%上昇",
        newsItem2: "新規格 ISO 898-1 発行",
        newsItem3: "AluCalc V2 公開"
    },
    palette: {
        categories: {
            input: "入力と定数",
            mechanical: "メカニカルコア",
            chemical: "化学 / 熱力学",
            validation: "検証 / ISO",
            visual: "ビジュアライザー",
            export: "出力 / レポート"
        },
        searchPlaceholder: "ノードを検索..."
    },
    calcCommon: {
        length: {
            label: "長さ (L)"
        },
        width: {
            label: "幅 (w)"
        },
        height: {
            label: "高さ (h)"
        },
        thickness: {
            label: "厚さ (t)"
        },
        radius: {
            label: "半径 (R)",
            desc: "内側曲げ半径"
        },
        angle: {
            label: "角度 (θ)"
        },
        force: {
            label: "力 (F)"
        },
        torque: {
            label: "トルク (T)"
        },
        pressure: {
            label: "圧力 (P)"
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
            label: "質量 (m)"
        },
        volume: {
            label: "体積 (V)"
        },
        area: {
            label: "面積 (A)"
        },
        material: {
            label: "材料の種類"
        },
        yieldStrength: {
            label: "降伏強度 (Sy)"
        },
        Sy: {
            label: "降伏強度 (Sy)"
        },
        safetyFactor: {
            label: "安全率"
        },
        SF: {
            label: "安全率 (SF)"
        },
        deflection: {
            label: "たわみ"
        },
        bendingStress: {
            label: "曲げ応力"
        },
        sigmaBending: {
            label: "曲げ応力 (σb)"
        },
        m: {
            label: "モジュール (m)",
            desc: "歯車のモジュール"
        },
        z1: {
            label: "小歯車の歯数 (z₁)"
        },
        z2: {
            label: "大歯車の歯数 (z₂)"
        },
        alpha: {
            label: "圧力角 (α)"
        },
        b: {
            label: "歯幅 (b)"
        },
        T: {
            label: "トルク (T)"
        },
        d: {
            label: "直径 (d)"
        },
        p: {
            label: "ピッチ (p)"
        },
        k: {
            label: "頭高さ (k)"
        },
        s: {
            label: "二面幅 (s)"
        },
        drill: {
            label: "ドリル径"
        },
        dh: {
            label: "穴径 (dh)"
        },
        ix: {
            label: "慣性 Ix",
            desc: "X軸まわりの断面二次モーメント"
        },
        iy: {
            label: "慣性 Iy",
            desc: "Y軸まわりの断面二次モーメント"
        },
        slot: {
            label: "溝サイズ"
        }
    },
    close: "閉じる",
    minimize: "最小化",
    maximize: "最大化",
    save: "保存",
    cancel: "キャンセル",
    apply: "適用",
    ok: "OK",
    error: "エラー",
    handbook: {
        title: "エンジニアリング知識ベース",
        searchPlaceholder: "知識ベースを検索...",
        results: "件の結果",
        noResults: "結果が見つかりませんでした。",
        description: "機械規格、公差、設計データの包括的で検索可能なリポジトリ。",
        featured: "注目",
        openTable: "テーブルを開く",
        mathFormula: "数式",
        readEntry: "エントリを読む",
        viewAll: "すべて表示",
        viewDetails: "詳細を表示",
        categories: "ナレッジカテゴリ",
        shortcuts: {
            isoTolerances: "ISO 公差",
            isoTolerancesDesc: "線形寸法と限界",
            fasteners: "ファスナーとねじ",
            fastenersDesc: "M、UN、G シリーズとボルトグレード",
            materials: "材料特性",
            materialsDesc: "密度、降伏強度 (Re)",
            mohr: "モールの応力円",
            mohrDesc: "主応力と 2D 歪み",
            beams: "梁のたわみ",
            beamsDesc: "固定梁と単純梁の公式",
            roughness: "表面粗さ",
            roughnessDesc: "Ra 値と加工"
        }
    },
    variables: {
        title: "プロジェクト変数",
        addVariable: "変数を追加",
        name: "名前",
        value: "値",
        unit: "単位",
        description: "説明",
        placeholderName: "変数名",
        placeholderDesc: "オプションの説明...",
        noVariables: "グローバル変数が定義されていません。「変数を追加」をクリックして作成してください。"
    },
    termPlaceholder: "コマンドを入力... ('help' でヘルプ表示)",
    termPrefix: "AluCalc ❯",
    viewFlow: "FLOW",
    searchResults: "検索結果",
    categoryOther: "その他",
    userPro: "AluCalc Professional",
    shutDown: "シャットダウン",
    noModulesFound: "モジュールが見つかりません",
    noModulesHint: "検索語を変更してください。",
    disciplinesLabel: "分野",
    languageFr: "フランス語",
    languageIt: "イタリア語",
    languagePt: "ポルトガル語",
    languageRu: "ロシア語",
    featureTree: "フィーチャツリー",
    sketches: "スケッチ",
    bodies: "ボディ",
    constraints: "拘束",
    parameters: "パラメータ",
    noBodies: "ボディはまだありません",
    dofLabel: "自由度",
    fullyConstrained: "完全拘束",
    overConstrained: "過剰拘束",
    underConstrained: "不足拘束",
    addBody: "ボディを追加",
    parametersTitle: "パラメータ",
    resultsTitle: "結果",
    fixInputs: "入力を固定",
    switch2D: "2Dに切替",
    switch3D: "3Dに切替",
    quickSelect: "クイック選択",
    varLabel: "VAR",
    dbLabel: "DB",
    selectStandard: "規格を選択...",
    closeAll: "すべてのアプリを閉じる",
    feedbackTitle: "連絡とフィードバック",
    costTitle: "コスト見積",
    costDesc: "製造コスト内訳",
    costBom: "材料BOM",
    costOps: "工程",
    costOverhead: "間接費 %",
    costMargin: "利益率 %",
    costBatch: "ロットサイズ",
    costTotal: "総コスト",
    costUnit: "単価"
} as const;
