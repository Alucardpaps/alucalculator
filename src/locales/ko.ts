export default {
    osName: "AluCalc OS",
    version: "v5.0",
    welcomeTitle: "작업 공간",
    welcomeHighlight: "선택",
    welcomeDesc: "기본 인터페이스를 선택하세요. 언제든지 변경할 수 있습니다.",
    systemInit: "시스템 초기화됨",
    bootInit: "엔지니어링 런타임 초기화 중...",
    bootLoading: "ALU_CORE, FLOW_ENGINE, CAD_RT 로드 중...",
    bootMounting: "가상 파일 시스템 마운트 중...",
    bootReady: "시스템 준비 완료.",
    systemReadyStatus: "시스템 준비 완료",
    noActiveNodes: "플로우에 활성 계산 노드 없음",
    confirmClearWorkspace: "작업 공간을 비우시겠습니까?",
    nodeTypeNote: "노트",
    nodeTypeMedia: "미디어",
    nodeTypeNode: "노드",
    flowTitle: "플로우 엔진 (Flow)",
    flowDesc: "엔지니어링 계산을 위한 무한 캔버스. 노드를 연결하고 데이터 흐름을 생성하며 공식을 연결합니다.",
    cadTitle: "CAD 스튜디오",
    cadDesc: "선, 원, 치수 및 그리드 스냅 정밀도를 갖춘 전문 2D 제도 도구.",
    deskTitle: "크리에이티브 데스크",
    deskDesc: "브레인스토밍을 위한 자유 형식 화이트보드. 스케치, 파일 드래그 및 아이디어를 시각적으로 정리합니다.",
    feaTitle: "FEA 시스템",
    projects: {
        title: "프로젝트",
        newProject: "새 프로젝트",
        allProjects: "모든 프로젝트",
        noProjects: "아직 프로젝트가 없습니다",
        createFirst: "첫 번째 프로젝트 생성",
        projectName: "프로젝트 이름",
        description: "설명 (선택 사항)",
        placeholderName: "나의 엔지니어링 프로젝트",
        placeholderDesc: "짧은 설명...",
        exportProject: "프로젝트 내보내기",
        importProject: "프로젝트 가져오기",
        duplicate: "복제",
        delete: "삭제",
        updatedAt: "최종 수정",
        workspacesCount: "개의 작업 공간"
    },
    welding: {
        title: "용접 계산기",
        subtitle: "열 입력 • 조인트 강도 • AWS D1.1",
        process: "용접 공정",
        jointType: "조인트 유형",
        parameters: "용접 매개변수",
        electrodes: "전극 / 와이어 선택",
        profiles: "재료 프로필",
        materials: "재료",
        material1: "재료 1",
        material2: "재료 2",
        dissimilarWarning: "이종 재료: {m1} + {m2} - 특수 용가재가 필요할 수 있습니다",
        heatInput: "열 입력",
        weldStress: "용접 응력",
        throatArea: "목 단면적",
        minWeldSize: "최소 용접 크기",
        jointEfficiency: "조인트 효율",
        preheat: "예열",
        fillerMetal: "예상 용가재",
        efficiency: "효율 (η)",
        depositionRate: "용착 속도",
        positions: "자세",
        thermodynamics: "용접 열역학",
        heatFormula: "열 입력 공식",
        carbonEquivalent: "탄소 함량 (CE)",
        notRequired: "필요 없음",
        inputs: {
            current: "전류",
            voltage: "전압",
            speed: "속도",
            thickness: "두께 (t)",
            legSize: "다리 길이 (a)",
            length: "길이 (L)",
            load: "하중 (F)",
            grooveAngle: "그루브 각도"
        },
        dims: {
            width: "너비",
            thick: "두께",
            diameter: "지름",
            wallThick: "벽 두께",
            height: "높이",
            flange: "플랜지",
            webT: "웨브 두께",
            leg: "다리"
        },
        materialSteel: "강철",
        materialStainless: "스테인리스강",
        materialAluminum: "알루미늄",
        materialCopper: "구리",
        materialBrass: "황동",
        heatFormulaDesc: "용접 단위 길이당 전달되는 에너지. 냉각 속도와 금속학적 특성을 제어합니다.",
        carbonEquivalentDesc: "경화능과 저온 균열 민감성을 예측합니다. CE > 0.40%는 대게 예열이 필요합니다.",
        processes: {
            mig: "MIG/MAG (GMAW)",
            tig: "TIG (GTAW)",
            smaw: "피복 아크 용접 (SMAW)",
            fcaw: "플럭스 코어드 아크 용접 (FCAW)",
            saw: "서브머지드 아크 용접 (SAW)",
            mma: "피복 아크 (SMAW)",
            mag: "MAG (GMAW)"
        },
        joints: {
            fillet: "필릿 용접",
            doubleFillet: "양면 필릿 용접",
            butt: "맞대기 용접",
            vGroove: "V-그루브 용접",
            uGroove: "U-그루브 용접",
            jGroove: "J-그루브 용접",
            lap: "겹치기 이음",
            tee: "T-이음",
            corner: "모서리 이음"
        },
        power: "동력",
        geometry: "기하",
        simulationLabel: "용접 이음 시뮬레이션",
        setup: "공정 설정"
    },
    viewCad: "CAD",
    viewFea: "FEA",
    viewDesk: "데스크",
    startMenu: "시작 메뉴",
    allApps: "모든 애플리케이션",
    searchApps: "애플리케이션 검색...",
    pinned: "고정된 모듈",
    settings: "설정",
    appearance: "모양",
    language: "언어",
    typography: "타이포그래피",
    about: "정보",
    securityVerified: "보안 검증됨",
    appearanceDesc: "워크스테이션의 시각적 정체성을 사용자 정의합니다.",
    languageDesc: "선호하는 지역 설정 및 인터페이스 언어를 선택하십시오.",
    typographyDesc: "기술 환경에 맞게 가독성을 최적화하십시오.",
    fontFamily: "글꼴 패밀리",
    fontSizeKey: "글꼴 크기",
    fontPreviewLabel: "미리보기",
    fontPreviewText: "키스의 고유함은 잊을 수 없는 추억이다. 1234567890. 모든 엔지니어링 계산은 검증 규칙을 따릅니다.",
    systemVersion: "엔지니어링 작업 공간 버전 5.0.0-Stable",
    architecture: "아키텍처",
    archName: "B-Model 클라우드 하이브리드",
    engineStatus: "엔진 상태",
    toggleDevMode: "개발자 모드 전환",
    statusOptimized: "최적화됨",
    localeLatency: "로케일 지연 시간",
    latencyValue: "2.4ms (캐시 히트)",
    aboutDesc: "전문적인 알루미늄 엔지니어링 및 구조 해석을 위해 설계되었습니다.",
    themeDark: "사이버 다크",
    themeLight: "클린 라이트",
    themePaper: "청사진",
    themeSea: "심해",
    themeSky: "맑은 하늘",
    themeDarkDesc: "고대비, 저피로",
    themeLightDesc: "주광 최적화",
    themePaperDesc: "엔지니어링 미학",
    themeSeaDesc: "부드러운 어두운 톤",
    themeSkyDesc: "가볍고 미니멀함",
    languageEn: "영어 (English)",
    languageTr: "터키어 (Türkçe)",
    languageDe: "독일어 (Deutsch)",
    languageEs: "스페인어 (Español)",
    languageZh: "중국어 (Chinese)",
    languageJa: "일본어 (Japanese)",
    languageKo: "한국어 (Korean)",
    languageAr: "아랍어 (Arabic)",
    modules: {
        calculator: {
            title: "공학용 계산스"
        },
        "unit-converter": {
            title: "단위 변환기"
        },
        "ai-copilot": {
            title: "Aegis AI"
        },
        "file-explorer": {
            title: "파일 탐색기"
        },
        settings: {
            title: "설정"
        },
        handbook: {
            title: "엔지니어링 핸드북"
        },
        terminal: {
            title: "터미널"
        },
        "profile-weight": {
            title: "프로파일 중량"
        },
        "gears-bearings": {
            title: "기어 계산기"
        },
        welding: {
            title: "용접 계산기"
        },
        fasteners: {
            title: "체결 토크"
        },
        "materials-db": {
            title: "재료 DB"
        },
        "cutting-optimizer": {
            title: "절단 최적화"
        },
        "music-player": {
            title: "음악 플레이어"
        },
        "belt-drive": {
            title: "벨트 드라이브"
        },
        "beam-deflection": {
            title: "보 처짐 계산"
        },
        bearings: {
            title: "베어링 수명 (L10)"
        },
        "bolt-stress": {
            title: "볼트 인장 응력"
        },
        "column-buckling": {
            title: "기둥 좌굴 (오일러)"
        },
        "fits-tolerances": {
            title: "끼워맞춤 및 공차 (ISO 286)"
        },
        "fluid-flow": {
            title: "배관 압력 손실"
        },
        "gear-spur": {
            title: "평기어 계산기"
        },
        "hydraulic-cylinder": {
            title: "유압 실린더"
        },
        "ohms-law": {
            title: "옴의 법칙"
        },
        pumps: {
            title: "원심 펌프"
        },
        "sheet-metal": {
            title: "판금 굽힘 계산"
        },
        "spring-compression": {
            title: "압축 스프링 계산"
        },
        "strength-analysis": {
            title: "강도 해석"
        },
        "thread-geometry": {
            title: "나사 기하학"
        },
        "torsion-shaft": {
            title: "틀림 (축)"
        },
        "vat-calculator": {
            title: "부가세 계산기"
        },
        "voltage-drop": {
            title: "전압 강하"
        },
        "welding-fillet": {
            title: "필렛 용접 강도"
        },
        "welding-heat": {
            title: "용접 열 입력"
        },
        "analytics-dashboard": {
            title: "분석"
        },
        "engineering-notes": {
            title: "엔지니어링 노트"
        },
        "cad-editor": {
            title: "CAD 편집기"
        },
        "sketch-pad": {
            title: "스케치 패드"
        },
        "periodic-table": {
            title: "주기율표"
        },
        "simulation-fea": {
            title: "FEA 시뮬레이션"
        },
        "manufacturing-sandbox": {
            title: "Mfg. Sandbox"
        },
        "engineering-selection": {
            title: "Engineering Selection"
        },
        "thermal-expansion": {
            title: "열팽창"
        },
        "project-manager": {
            title: "프로젝트 BOM"
        },
        "cost-estimator": {
            title: "비용 엔진"
        },
        "manufacturing-readiness": {
            title: "Mfg Readiness Analyzer"
        },
        "topology-optimization": {
            title: "생성 설계"
        },
        "machine-assembly": {
            title: "기계 조립"
        },
        "failure-prediction": {
            title: "Failure Predictor"
        },
        "fluid-dynamics": {
            title: "유체 역학"
        },
        "bolt-torque": {
            title: "Bolt Torque & Preload"
        },
        "chain-drive": {
            title: "롤러 체인 구동"
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
        calculator: "고급 수학 계산",
        "unit-converter": "엔지니어링 단위 변환",
        "ai-copilot": "Aegis AI",
        "file-explorer": "시스템 파일 관리",
        settings: "시스템 환경 설정",
        handbook: "참조 공식 및 데이터",
        terminal: "명령줄 인터페이스",
        "profile-weight": "알루미늄 압출 프로파일 중량 계산",
        "gears-bearings": "기어비 및 베어링 수명",
        welding: "용접 목두께 및 강도",
        fasteners: "볼트 토크 및 초기 장력",
        "materials-db": "재료 특성 조회",
        "cutting-optimizer": "자재 절단 효율성 최적화",
        "music-player": "로컬 및 스트리밍 오디오",
        "belt-drive": "풀리 및 벨트 길이 계산",
        "thermal-expansion": "열팽창 및 치수 변화",
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
        mechanical: "기계",
        structural: "구조",
        utilities: "유틸리티",
        reference: "참조",
        science: "과학",
        software: "소프트웨어",
        civil: "토목",
        finance: "금융",
        other: "기타"
    },
    ribbon: {
        theme: "테마",
        guide: "가이드",
        variables: "변수",
        select: "선택",
        pan: "팬",
        line: "선 (L)",
        polyline: "폴리라인 (PL)",
        rectangle: "직사각형 (REC)",
        circle: "원 (C)",
        copy: "복사 (CO)",
        rotate: "회전 (RO)",
        mirror: "대칭 (MI)",
        trim: "트림 (TR)",
        extend: "연장 (EX)",
        offset: "오프셋 (O)",
        fillet: "필렛 (F)",
        smartDim: "스마트 치수",
        linear: "선형 치수",
        text: "텍스트",
        coincident: "일치",
        horizontal: "수평",
        vertical: "수직",
        parallel: "평행",
        perpendicular: "직교",
        tangent: "접선",
        equal: "같음",
        angle: "각도",
        dist: "거리",
        undo: "실행 취소",
        redo: "다시 실행",
        zoomIn: "확대",
        zoomOut: "축소",
        zoomExtents: "전체 화면",
        osnap: "객체 스냅 (F3)",
        grid: "그리드 (F7)",
        importDxf: "DXF 가져오기",
        exportDxf: "DXF 2D 내보내기",
        exportStep: "STEP 3D 내보내기",
        clearAll: "모두 지우기",
        groupDraw: "그리기",
        groupModify: "수정",
        groupDim: "치수",
        groupConstraints: "구속",
        groupExport: "내보내기",
        groupPaint: "페인트",
        groupContent: "콘텐츠",
        labelWorkstation: "엔지니어링 워크스테이션",
        groupCanvas: "캔버스",
        groupJob: "작업 제어",
        groupOutput: "출력",
        labelCreativeDesk: "크리에이티브 데스크",
        labelMfgCam: "제조 / CAM 작업공간",
        labelFeaSim: "FEA / 시뮬레이션",
        labelPen: "펜",
        labelMarker: "마커",
        labelEraser: "지우개",
        labelArrow: "화살표",
        labelRect: "사각형",
        labelCircle: "원",
        labelClear: "지우기",
        labelNote: "메모",
        labelVideo: "비디오",
        labelMusic: "음악",
        labelImage: "이미지",
        labelExcel: "Excel",
        labelWord: "Word",
        labelPpt: "PPT",
        labelPdf: "PDF",
        labelStartNesting: "네스팅 시작",
        labelResetJob: "작업 재설정",
        labelFullReport: "전체 보고서",
        labelExportNc: "NC 내보내기",
        labelSolverReady: "솔버 준비됨",
        labelMatrixSparse: "행렬: 희소",
        labelStrokeColor: "선 색",
        defaultNote: "📌 새 메모",
        promptYoutubeUrl: "YouTube URL 입력:",
        confirmClearSketches: "모든 스케치를 지울까요?",
        confirmClearFlow: "전체 Flow 작업 영역을 비울까요? 이 작업은 되돌릴 수 없습니다.",
        confirmDeleteWindow: "이 창을 닫을까요?",
        alertSelect2: "구속하려면 점 또는 선 2개 이상을 선택하세요.",
        exportFailed: "내보내기 실패",
        dxfExportFailed: "DXF 내보내기 실패",
        stepExportFailed: "STEP 내보내기 실패",
        noGeometry: "내보낼 기하가 없습니다. 먼저 그리세요.",
        noExportableGeometry: "내보낼 기하가 없습니다(선과 원만).",
        stepExportComplete: "STEP 내보내기 완료: {count}개 엔티티.",
        importedEntities: "{count}개 엔티티를 가져왔습니다.",
        labelNewNote: "새 메모",
        comingSoon: "곧 제공...",
        handbookPdf: "엔지니어링핸드북.pdf",
        newsFeedTitle: "엔지니어링 뉴스",
        newsItem1: "알루미늄 가격 2% 상승",
        newsItem2: "새 ISO 898-1 규격 발표",
        newsItem3: "AluCalc V2 출시"
    },
    palette: {
        categories: {
            input: "입력 및 상수",
            mechanical: "기계 코어",
            chemical: "화학 / 열역학",
            validation: "검증 / ISO",
            visual: "시각화",
            export: "출력 / 보고서"
        },
        searchPlaceholder: "노드 검색..."
    },
    calcCommon: {
        length: {
            label: "길이 (L)"
        },
        width: {
            label: "너비 (w)"
        },
        height: {
            label: "높이 (h)"
        },
        thickness: {
            label: "두께 (t)"
        },
        radius: {
            label: "반경 (R)",
            desc: "내부 굽힘 반경"
        },
        angle: {
            label: "각도 (θ)"
        },
        force: {
            label: "힘 (F)"
        },
        torque: {
            label: "토크 (T)"
        },
        pressure: {
            label: "압력 (P)"
        },
        velocity: {
            label: "속도 (v)"
        },
        diameter: {
            label: "직경 (d)"
        },
        density: {
            label: "밀도 (ρ)"
        },
        mass: {
            label: "질량 (m)"
        },
        volume: {
            label: "부피 (V)"
        },
        area: {
            label: "면적 (A)"
        },
        material: {
            label: "재질 유형"
        },
        yieldStrength: {
            label: "항복 강도 (Sy)"
        },
        Sy: {
            label: "항복 강도 (Sy)"
        },
        safetyFactor: {
            label: "안전 계수"
        },
        SF: {
            label: "안전 계수 (SF)"
        },
        deflection: {
            label: "처짐"
        },
        bendingStress: {
            label: "굽힘 응력"
        },
        sigmaBending: {
            label: "굽힘 응력 (σb)"
        },
        m: {
            label: "모듈 (m)",
            desc: "기어 모듈"
        },
        z1: {
            label: "피니언 잇수 (z₁)"
        },
        z2: {
            label: "기어 잇수 (z₂)"
        },
        alpha: {
            label: "압력각 (α)"
        },
        b: {
            label: "치폭 (b)"
        },
        T: {
            label: "토크 (T)"
        },
        d: {
            label: "지름 (d)"
        },
        p: {
            label: "피치 (p)"
        },
        k: {
            label: "머리 높이 (k)"
        },
        s: {
            label: "육각 폭 (s)"
        },
        drill: {
            label: "드릴 지름"
        },
        dh: {
            label: "구멍 지름 (dh)"
        },
        ix: {
            label: "관성 Ix",
            desc: "X축 관성 모멘트"
        },
        iy: {
            label: "관성 Iy",
            desc: "Y축 관성 모멘트"
        },
        slot: {
            label: "슬롯 크기"
        }
    },
    close: "닫기",
    minimize: "최소화",
    maximize: "최대화",
    save: "저장",
    cancel: "취소",
    apply: "적용",
    ok: "확인",
    error: "오류",
    handbook: {
        title: "엔지니어링 지식 베이스",
        searchPlaceholder: "지식 베이스 검색...",
        results: "개의 결과",
        noResults: "결과를 찾을 수 없습니다.",
        description: "기계 표준, 공차 및 설계 데이터의 포괄적이고 검색 가능한 저장소입니다.",
        featured: "주요 항목",
        openTable: "표 열기",
        mathFormula: "수학 공식",
        readEntry: "항목 읽기",
        viewAll: "모두 보기",
        viewDetails: "상세 정보",
        categories: "지식 카테고리",
        shortcuts: {
            isoTolerances: "ISO 공차",
            isoTolerancesDesc: "선형 치수 및 한계",
            fasteners: "패스너 및 나사산",
            fastenersDesc: "M, UN, G 시리즈 및 볼트 등급",
            materials: "재료 특성",
            materialsDesc: "밀도, 항복 강도 (Re)",
            mohr: "모어 원",
            mohrDesc: "주응력 및 2D 변형률",
            beams: "보의 처짐",
            beamsDesc: "고정 및 단순 보의 공식",
            roughness: "표면 거칠기",
            roughnessDesc: "Ra 값 및 가공"
        }
    },
    variables: {
        title: "프로젝트 변수",
        addVariable: "변수 추가",
        name: "이름",
        value: "값",
        unit: "단위",
        description: "설명",
        placeholderName: "변수명",
        placeholderDesc: "선택적 설명...",
        noVariables: "정의된 전역 변수가 없습니다. \"변수 추가\"를 클릭하여 생성하세요."
    },
    termPlaceholder: "명령어 입력... ('help'로 도움말 확인)",
    termPrefix: "AluCalc ❯",
    viewFlow: "FLOW",
    searchResults: "검색 결과",
    categoryOther: "기타",
    userPro: "AluCalc Professional",
    shutDown: "종료",
    noModulesFound: "모듈을 찾을 수 없습니다",
    noModulesHint: "검색어를 바꿔 보세요.",
    disciplinesLabel: "분야",
    languageFr: "프랑스어",
    languageIt: "이탈리아어",
    languagePt: "포르투갈어",
    languageRu: "러시아어",
    featureTree: "피처 트리",
    sketches: "스케치",
    bodies: "솔리드",
    constraints: "구속",
    parameters: "매개변수",
    noBodies: "솔리드가 없습니다",
    dofLabel: "자유도",
    fullyConstrained: "완전 구속",
    overConstrained: "과구속",
    underConstrained: "미구속",
    addBody: "솔리드 추가",
    parametersTitle: "매개변수",
    resultsTitle: "결과",
    fixInputs: "입력 고정",
    switch2D: "2D로 전환",
    switch3D: "3D로 전환",
    quickSelect: "빠른 선택",
    varLabel: "VAR",
    dbLabel: "DB",
    selectStandard: "규격 선택...",
    closeAll: "모든 앱 닫기",
    feedbackTitle: "문의 및 피드백",
    costTitle: "원가 산정",
    costDesc: "제조 원가 내역",
    costBom: "자재 BOM",
    costOps: "공정",
    costOverhead: "간접비 %",
    costMargin: "마진 %",
    costBatch: "배치 크기",
    costTotal: "총비용",
    costUnit: "단가"
} as const;
