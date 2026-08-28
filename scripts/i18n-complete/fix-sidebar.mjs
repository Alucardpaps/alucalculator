import fs from 'fs';
import { LANGS } from './table-data.mjs';

const T = {
  'Parametric Part Configurator (3D Preview)': {
    de: 'Parametrischer Teilekonfigurator (3D-Vorschau)',
    es: 'Configurador paramétrico de piezas (vista 3D)',
    fr: 'Configurateur paramétrique de pièces (aperçu 3D)',
    it: 'Configuratore parametrico pezzi (anteprima 3D)',
    pt: 'Configurador paramétrico de peças (pré-visualização 3D)',
    ru: 'Параметрический конфигуратор деталей (3D)',
    ja: 'パラメトリック部品コンフィグレータ (3Dプレビュー)',
    ko: '파라메트릭 부품 구성기 (3D 미리보기)',
  },
  '2D AluCAD Drafting': {
    de: '2D-AluCAD-Zeichnung', es: 'Dibujo 2D AluCAD', fr: 'Dessin 2D AluCAD', it: 'Disegno 2D AluCAD',
    pt: 'Desenho 2D AluCAD', ru: '2D-черчение AluCAD', ja: '2D AluCAD製図', ko: '2D AluCAD 제도',
  },
  'FEA Linear Static v1': {
    de: 'FEA linear-statisch v1', es: 'FEA estática lineal v1', fr: 'EF statique linéaire v1', it: 'FEA statica lineare v1',
    pt: 'FEA estática linear v1', ru: 'FEA линейная статика v1', ja: 'FEA線形静解析 v1', ko: 'FEA 선형 정적 v1',
  },
  '2D Sheet Nesting': {
    de: '2D-Tafelverschachtelung', es: 'Anidado 2D de chapas', fr: 'Imbrication 2D de tôles', it: 'Nesting 2D lamiere',
    pt: 'Nesting 2D de chapas', ru: '2D-раскрой листа', ja: '2D板ネスティング', ko: '2D 판재 네스팅',
  },
  '1D Linear Cut Optimizer': {
    de: '1D-Stangenoptimierer', es: 'Optimizador de corte lineal 1D', fr: 'Optimiseur de coupe linéaire 1D', it: 'Ottimizzatore taglio lineare 1D',
    pt: 'Otimizador de corte linear 1D', ru: '1D-оптимизатор резки', ja: '1D直線切断オプティマイザ', ko: '1D 선형 절단 최적화',
  },
  'Technical Sketch Pad': {
    de: 'Technischer Skizzenblock', es: 'Bloc de croquis técnico', fr: 'Bloc à croquis technique', it: 'Blocco schizzi tecnici',
    pt: 'Bloco de esboço técnico', ru: 'Техническая доска эскизов', ja: '技術スケッチパッド', ko: '기술 스케치 패드',
  },
  'Bolt Torque (VDI 2230)': {
    de: 'Schraubendrehmoment (VDI 2230)', es: 'Par de apriete (VDI 2230)', fr: 'Couple de serrage (VDI 2230)', it: 'Coppia di serraggio (VDI 2230)',
    pt: 'Torque de aperto (VDI 2230)', ru: 'Момент затяжки (VDI 2230)', ja: 'ボルトトルク (VDI 2230)', ko: '볼트 토크 (VDI 2230)',
  },
  'Bearing Life (ISO 281)': {
    de: 'Lagerlebensdauer (ISO 281)', es: 'Vida de rodamiento (ISO 281)', fr: 'Durée de roulement (ISO 281)', it: 'Durata cuscinetto (ISO 281)',
    pt: 'Vida do rolamento (ISO 281)', ru: 'Ресурс подшипника (ISO 281)', ja: '軸受寿命 (ISO 281)', ko: '베어링 수명 (ISO 281)',
  },
  'Gear Design (ISO 6336)': {
    de: 'Zahnradauslegung (ISO 6336)', es: 'Diseño de engranajes (ISO 6336)', fr: 'Conception d’engrenages (ISO 6336)', it: 'Progetto ingranaggi (ISO 6336)',
    pt: 'Projeto de engrenagens (ISO 6336)', ru: 'Расчёт зубчатых колёс (ISO 6336)', ja: '歯車設計 (ISO 6336)', ko: '기어 설계 (ISO 6336)',
  },
  'Planetary Gearbox Solver': {
    de: 'Planetengetriebe-Rechner', es: 'Solucionador de reductor planetario', fr: 'Solveur de réducteur planétaire', it: 'Solutore riduttore epicicloidale',
    pt: 'Solucionador de redutor planetário', ru: 'Расчёт планетарного редуктора', ja: '遊星減速機ソルバー', ko: '유성 감속기 솔버',
  },
  'Gearbox Design Engine': {
    de: 'Getriebeauslegungs-Engine', es: 'Motor de diseño de reductores', fr: 'Moteur de conception de réducteurs', it: 'Motore di progetto riduttori',
    pt: 'Motor de projeto de redutores', ru: 'Движок проектирования редукторов', ja: '減速機設計エンジン', ko: '감속기 설계 엔진',
  },
  'Gearbox Thermal & Lube': {
    de: 'Getriebe Wärme & Schmierung', es: 'Térmica y lubricación de reductor', fr: 'Thermique et lubrification réducteur', it: 'Termica e lubrificazione riduttore',
    pt: 'Térmica e lubrificação do redutor', ru: 'Тепловой режим и смазка редуктора', ja: '減速機の熱・潤滑', ko: '감속기 열 및 윤활',
  },
  'Roller Chain (ISO 606)': {
    de: 'Rollenkette (ISO 606)', es: 'Cadena de rodillos (ISO 606)', fr: 'Chaîne à rouleaux (ISO 606)', it: 'Catena a rulli (ISO 606)',
    pt: 'Corrente de rolos (ISO 606)', ru: 'Роликовая цепь (ISO 606)', ja: 'ローラチェーン (ISO 606)', ko: '롤러 체인 (ISO 606)',
  },
  'Belt Drive (ISO 5291)': {
    de: 'Riementrieb (ISO 5291)', es: 'Transmisión por correa (ISO 5291)', fr: 'Transmission par courroie (ISO 5291)', it: 'Trasmissione a cinghia (ISO 5291)',
    pt: 'Transmissão por correia (ISO 5291)', ru: 'Ременная передача (ISO 5291)', ja: 'ベルト駆動 (ISO 5291)', ko: '벨트 구동 (ISO 5291)',
  },
  'Sheet Metal & Bend': {
    de: 'Blech & Biegung', es: 'Chapa y plegado', fr: 'Tôlerie et pliage', it: 'Lamiera e piegatura',
    pt: 'Chapa e dobragem', ru: 'Листовой металл и гибка', ja: '板金・曲げ', ko: '판금 및 굽힘',
  },
  'Helical Spring Design': {
    de: 'Schraubenfedernauslegung', es: 'Diseño de muelle helicoidal', fr: 'Conception de ressort hélicoïdal', it: 'Progetto molla elicoidale',
    pt: 'Projeto de mola helicoidal', ru: 'Расчёт винтовой пружины', ja: 'コイルばね設計', ko: '코일 스프링 설계',
  },
  'Shaft Sizing & Reactions': {
    de: 'Wellenbemessung & Auflager', es: 'Dimensionado de ejes y reacciones', fr: 'Dimensionnement d’arbre et réactions', it: 'Dimensionamento albero e reazioni',
    pt: 'Dimensionamento de eixos e reações', ru: 'Расчёт вала и реакций опор', ja: '軸寸法と反力', ko: '축 치수 및 반력',
  },
  'Motor Selection Engine': {
    de: 'Motorauswahl-Engine', es: 'Motor de selección de motores', fr: 'Moteur de sélection de moteurs', it: 'Motore di selezione motori',
    pt: 'Motor de seleção de motores', ru: 'Подбор электродвигателя', ja: 'モータ選定エンジン', ko: '모터 선정 엔진',
  },
  'Beam Deflection Analysis': {
    de: 'Balkendurchbiegungsanalyse', es: 'Análisis de deflexión de viga', fr: 'Analyse de flèche de poutre', it: 'Analisi deflessione trave',
    pt: 'Análise de deflexão de viga', ru: 'Анализ прогиба балки', ja: '梁たわみ解析', ko: '보 처짐 해석',
  },
  'Fits & Tolerances (ISO 286)': {
    de: 'Passungen & Toleranzen (ISO 286)', es: 'Ajustes y tolerancias (ISO 286)', fr: 'Ajustements et tolérances (ISO 286)', it: 'Accoppiamenti e tolleranze (ISO 286)',
    pt: 'Ajustes e tolerâncias (ISO 286)', ru: 'Посадки и допуски (ISO 286)', ja: '公差とはめあい (ISO 286)', ko: '끼워맞춤 및 공차 (ISO 286)',
  },
  'Welding & Joint Stress': {
    de: 'Schweißen & Nahtspannung', es: 'Soldadura y esfuerzo de junta', fr: 'Soudage et contrainte de joint', it: 'Saldatura e sforzo del giunto',
    pt: 'Soldagem e tensão da junta', ru: 'Сварка и напряжение шва', ja: '溶接と継手応力', ko: '용접 및 이음 응력',
  },
  'Fillet Weld Strength': {
    de: 'Kehlnahtfestigkeit', es: 'Resistencia de filete', fr: 'Résistance de soudure d’angle', it: 'Resistenza cordone d’angolo',
    pt: 'Resistência de filete', ru: 'Прочность углового шва', ja: '隅肉溶接強度', ko: '필릿 용접 강도',
  },
  'Thread Geometry & Fasteners': {
    de: 'Gewindegeometrie & Verbindungselemente', es: 'Geometría de rosca y fijaciones', fr: 'Géométrie de filetage et fixations', it: 'Geometria filettatura e bulloneria',
    pt: 'Geometria de rosca e fixadores', ru: 'Геометрия резьбы и крепёж', ja: 'ねじ幾何と締結部品', ko: '나사 기하 및 체결부품',
  },
  'Machining Speeds & Feeds': {
    de: 'Schnittgeschwindigkeiten & Vorschübe', es: 'Velocidades y avances de mecanizado', fr: 'Vitesses et avances d’usinage', it: 'Velocità e avanzamenti di lavorazione',
    pt: 'Velocidades e avanços de usinagem', ru: 'Режимы резания', ja: '切削速度と送り', ko: '절삭 속도 및 이송',
  },
  'Profile Weight & Mass': {
    de: 'Profilgewicht & Masse', es: 'Peso y masa de perfil', fr: 'Poids et masse de profilé', it: 'Peso e massa profilo',
    pt: 'Peso e massa de perfil', ru: 'Масса профиля', ja: '形材重量と質量', ko: '프로파일 중량 및 질량',
  },
  'Hardness & Tensile Converter': {
    de: 'Härte- & Zugfestigkeitsumrechner', es: 'Conversor de dureza y tracción', fr: 'Convertisseur dureté/traction', it: 'Convertitore durezza/trazione',
    pt: 'Conversor de dureza e tração', ru: 'Конвертер твёрдости и прочности', ja: '硬さ・引張換算', ko: '경도 및 인장 변환기',
  },
  'Fatigue Life (Goodman)': {
    de: 'Ermüdungslebensdauer (Goodman)', es: 'Vida a fatiga (Goodman)', fr: 'Durée en fatigue (Goodman)', it: 'Vita a fatica (Goodman)',
    pt: 'Vida à fadiga (Goodman)', ru: 'Усталостная долговечность (Goodman)', ja: '疲労寿命 (Goodman)', ko: '피로 수명 (Goodman)',
  },
  'AI Failure Prediction': {
    de: 'KI-Ausfallvorhersage', es: 'Predicción de fallos con IA', fr: 'Prédiction de défaillance IA', it: 'Predizione guasti con IA',
    pt: 'Previsão de falhas com IA', ru: 'ИИ-прогноз отказов', ja: 'AI故障予測', ko: 'AI 고장 예측',
  },
  'Column Buckling (Euler)': {
    de: 'Knicken von Stützen (Euler)', es: 'Pandeo de columnas (Euler)', fr: 'Flambement de poteau (Euler)', it: 'Instabilità di colonna (Euler)',
    pt: 'Flambagem de coluna (Euler)', ru: 'Потеря устойчивости стойки (Эйлер)', ja: '柱の座屈 (Euler)', ko: '기둥 좌굴 (Euler)',
  },
  'Vibration & Isolation': {
    de: 'Schwingung & Isolierung', es: 'Vibración y aislamiento', fr: 'Vibration et isolation', it: 'Vibrazione e isolamento',
    pt: 'Vibração e isolamento', ru: 'Вибрация и виброизоляция', ja: '振動と絶縁', ko: '진동 및 절연',
  },
  'Fluid Dynamics Suite': {
    de: 'Strömungsmechanik-Suite', es: 'Suite de dinámica de fluidos', fr: 'Suite de dynamique des fluides', it: 'Suite di dinamica dei fluidi',
    pt: 'Suite de dinâmica dos fluidos', ru: 'Пакет гидродинамики', ja: '流体力学スイート', ko: '유체역학 스위트',
  },
  'Pipe Friction (Darcy)': {
    de: 'Rohrreibung (Darcy)', es: 'Fricción en tuberías (Darcy)', fr: 'Frottement en conduite (Darcy)', it: 'Attrito in tubi (Darcy)',
    pt: 'Atrito em tubulações (Darcy)', ru: 'Трение в трубах (Дарси)', ja: '管摩擦 (Darcy)', ko: '관 마찰 (Darcy)',
  },
  'ASME Pressure Vessel': {
    de: 'ASME-Druckbehälter', es: 'Recipiente a presión ASME', fr: 'Appareil à pression ASME', it: 'Recipiente in pressione ASME',
    pt: 'Vaso de pressão ASME', ru: 'Сосуд под давлением ASME', ja: 'ASME圧力容器', ko: 'ASME 압력용기',
  },
  'Pump Flow & Head': {
    de: 'Pumpendurchfluss & Förderhöhe', es: 'Caudal y altura de bomba', fr: 'Débit et HMT de pompe', it: 'Portata e prevalenza pompa',
    pt: 'Vazão e altura de bomba', ru: 'Подача и напор насоса', ja: 'ポンプ流量と揚程', ko: '펌프 유량 및 양정',
  },
  'Heat Sink Thermal': {
    de: 'Kühlkörper-Thermik', es: 'Térmica de disipador', fr: 'Thermique de dissipateur', it: 'Termica dissipatore',
    pt: 'Térmica de dissipador', ru: 'Тепловой расчёт радиатора', ja: 'ヒートシンク熱計算', ko: '히트싱크 열해석',
  },
  'HVAC Load Estimation': {
    de: 'HLK-Lastabschätzung', es: 'Estimación de carga HVAC', fr: 'Estimation de charge CVC', it: 'Stima carico HVAC',
    pt: 'Estimativa de carga HVAC', ru: 'Оценка нагрузки ОВК', ja: 'HVAC負荷算定', ko: 'HVAC 부하 산정',
  },
  '3D Aerodynamic Wind Tunnel': {
    de: '3D-aerodynamischer Windkanal', es: 'Túnel aerodinámico 3D', fr: 'Soufflerie aérodynamique 3D', it: 'Galleria aerodinamica 3D',
    pt: 'Túnel aerodinâmico 3D', ru: '3D аэродинамическая труба', ja: '3D空力風洞', ko: '3D 공력 풍동',
  },
  'Aerospace Dynamics': {
    de: 'Luft- und Raumfahrtdynamik', es: 'Dinámica aeroespacial', fr: 'Dynamique aérospatiale', it: 'Dinamica aerospaziale',
    pt: 'Dinâmica aeroespacial', ru: 'Аэрокосмическая динамика', ja: '航空宇宙ダイナミクス', ko: '항공우주 역학',
  },
  'Naval Hydrostatics': {
    de: 'Schiffshydrostatik', es: 'Hidrostática naval', fr: 'Hydrostatique navale', it: 'Idrostatica navale',
    pt: 'Hidrostática naval', ru: 'Корабельная гидростатика', ja: '船舶静水力学', ko: '선박 정수역학',
  },
  'Thermal Expansion': {
    de: 'Wärmedehnung', es: 'Expansión térmica', fr: 'Dilatation thermique', it: 'Dilatazione termica',
    pt: 'Expansão térmica', ru: 'Тепловое расширение', ja: '熱膨張', ko: '열팽창',
  },
  '3-Phase Power Workstation': {
    de: 'Drehstrom-Arbeitsplatz', es: 'Estación de potencia trifásica', fr: 'Poste de puissance triphasée', it: 'Postazione potenza trifase',
    pt: 'Estação de potência trifásica', ru: 'Рабочее место 3-фазной мощности', ja: '三相電力ワークステーション', ko: '3상 전력 워크스테이션',
  },
  "Ohm's Law & Power": {
    de: 'Ohmsches Gesetz & Leistung', es: 'Ley de Ohm y potencia', fr: 'Loi d’Ohm et puissance', it: 'Legge di Ohm e potenza',
    pt: 'Lei de Ohm e potência', ru: 'Закон Ома и мощность', ja: 'オームの法則と電力', ko: '옴의 법칙 및 전력',
  },
  'Voltage Drop & Cable Sizing': {
    de: 'Spannungsabfall & Kabelquerschnitt', es: 'Caída de tensión y sección de cable', fr: 'Chute de tension et section de câble', it: 'Caduta di tensione e sezione cavo',
    pt: 'Queda de tensão e seção de cabo', ru: 'Падение напряжения и сечение кабеля', ja: '電圧降下とケーブルサイジング', ko: '전압 강하 및 케이블 단면',
  },
  'Digital Logic Lab': {
    de: 'Digital-Logik-Labor', es: 'Laboratorio de lógica digital', fr: 'Labo de logique numérique', it: 'Laboratorio di logica digitale',
    pt: 'Laboratório de lógica digital', ru: 'Лаборатория цифровой логики', ja: 'デジタル論理ラボ', ko: '디지털 논리 랩',
  },
  'Filter Design Engine': {
    de: 'Filterentwurfs-Engine', es: 'Motor de diseño de filtros', fr: 'Moteur de conception de filtres', it: 'Motore di progetto filtri',
    pt: 'Motor de projeto de filtros', ru: 'Движок проектирования фильтров', ja: 'フィルタ設計エンジン', ko: '필터 설계 엔진',
  },
  'RC Concrete Reinforcement': {
    de: 'Stahlbetonbewehrung', es: 'Armadura de hormigón armado', fr: 'Armature béton armé', it: 'Armatura calcestruzzo armato',
    pt: 'Armadura de concreto armado', ru: 'Армирование ЖБ', ja: 'RCコンクリート配筋', ko: '철근콘크리트 배근',
  },
  'Materials Database': {
    de: 'Werkstoffdatenbank', es: 'Base de datos de materiales', fr: 'Base de données matériaux', it: 'Database materiali',
    pt: 'Base de dados de materiais', ru: 'База данных материалов', ja: '材料データベース', ko: '재료 데이터베이스',
  },
  'AI Material Selector': {
    de: 'KI-Werkstoffauswahl', es: 'Selector de materiales IA', fr: 'Sélecteur de matériaux IA', it: 'Selettore materiali IA',
    pt: 'Seletor de materiais IA', ru: 'ИИ-подбор материалов', ja: 'AI材料選定', ko: 'AI 재료 선정',
  },
  'Materials Explorer': {
    de: 'Werkstoff-Explorer', es: 'Explorador de materiales', fr: 'Explorateur de matériaux', it: 'Esploratore materiali',
    pt: 'Explorador de materiais', ru: 'Обозреватель материалов', ja: '材料エクスプローラー', ko: '재료 탐색기',
  },
  'AI Failure Diagnosis': {
    de: 'KI-Schadensdiagnose', es: 'Diagnóstico de fallos IA', fr: 'Diagnostic de défaillance IA', it: 'Diagnosi guasti IA',
    pt: 'Diagnóstico de falhas IA', ru: 'ИИ-диагностика отказов', ja: 'AI故障診断', ko: 'AI 고장 진단',
  },
  'Manufacturing Cost Estimator': {
    de: 'Fertigungskostenrechner', es: 'Estimador de costes de fabricación', fr: 'Estimateur de coût de fabrication', it: 'Stimatore costi di produzione',
    pt: 'Estimador de custos de fabricação', ru: 'Калькулятор себестоимости', ja: '製造コスト見積', ko: '제조 원가 산정',
  },
  'Interactive Periodic Table': {
    de: 'Interaktives Periodensystem', es: 'Tabla periódica interactiva', fr: 'Tableau périodique interactif', it: 'Tavola periodica interattiva',
    pt: 'Tabela periódica interativa', ru: 'Интерактивная периодическая таблица', ja: 'インタラクティブ周期表', ko: '인터랙티브 주기율표',
  },
  'Engineering Unit Converter': {
    de: 'Technischer Einheitenumrechner', es: 'Conversor de unidades de ingeniería', fr: 'Convertisseur d’unités d’ingénierie', it: 'Convertitore di unità ingegneristiche',
    pt: 'Conversor de unidades de engenharia', ru: 'Инженерный конвертер единиц', ja: '工学単位換算', ko: '공학 단위 변환기',
  },
  'Scientific CAS Calculator': {
    de: 'Wissenschaftlicher CAS-Rechner', es: 'Calculadora científica CAS', fr: 'Calculatrice scientifique CAS', it: 'Calcolatrice scientifica CAS',
    pt: 'Calculadora científica CAS', ru: 'Научный CAS-калькулятор', ja: '科学CAS電卓', ko: '과학 CAS 계산기',
  },
  'Physics & Kinematics': {
    de: 'Physik & Kinematik', es: 'Física y cinemática', fr: 'Physique et cinématique', it: 'Fisica e cinematica',
    pt: 'Física e cinemática', ru: 'Физика и кинематика', ja: '物理と運動学', ko: '물리 및 운동학',
  },
  'Physics CAS Engine': {
    de: 'Physik-CAS-Engine', es: 'Motor CAS de física', fr: 'Moteur CAS de physique', it: 'Motore CAS di fisica',
    pt: 'Motor CAS de física', ru: 'Физический CAS-движок', ja: '物理CASエンジン', ko: '물리 CAS 엔진',
  },
  'Chemistry Lab': {
    de: 'Chemielabor', es: 'Laboratorio de química', fr: 'Labo de chimie', it: 'Laboratorio di chimica',
    pt: 'Laboratório de química', ru: 'Химическая лаборатория', ja: '化学ラボ', ko: '화학 랩',
  },
  'Biology & Genetics': {
    de: 'Biologie & Genetik', es: 'Biología y genética', fr: 'Biologie et génétique', it: 'Biologia e genetica',
    pt: 'Biologia e genética', ru: 'Биология и генетика', ja: '生物学と遺伝学', ko: '생물학 및 유전학',
  },
  'CS Algorithm Visualizer': {
    de: 'Informatik-Algorithmusvisualisierer', es: 'Visualizador de algoritmos', fr: 'Visualiseur d’algorithmes', it: 'Visualizzatore di algoritmi',
    pt: 'Visualizador de algoritmos', ru: 'Визуализатор алгоритмов', ja: 'アルゴリズム可視化', ko: '알고리즘 시각화',
  },
  'Field Engineering Suite (24 Tools)': {
    de: 'Feld-Engineering-Suite (24 Tools)', es: 'Suite de ingeniería de campo (24 herramientas)', fr: 'Suite d’ingénierie de terrain (24 outils)', it: 'Suite di ingegneria da campo (24 strumenti)',
    pt: 'Suite de engenharia de campo (24 ferramentas)', ru: 'Полевой инженерный набор (24 инструмента)', ja: '現場エンジニアリングスイート (24ツール)', ko: '현장 엔지니어링 스위트 (24개 도구)',
  },
  'Mobile & Watch APK': {
    de: 'Mobil- & Watch-APK', es: 'APK móvil y reloj', fr: 'APK mobile et montre', it: 'APK mobile e orologio',
    pt: 'APK móvel e relógio', ru: 'APK для телефона и часов', ja: 'モバイル＆ウォッチAPK', ko: '모바일 및 워치 APK',
  },
  'Engineering Academy': {
    de: 'Ingenieurakademie', es: 'Academia de ingeniería', fr: 'Académie d’ingénierie', it: 'Accademia di ingegneria',
    pt: 'Academia de engenharia', ru: 'Инженерная академия', ja: 'エンジニアリングアカデミー', ko: '엔지니어링 아카데미',
  },
  'Standards Handbook': {
    de: 'Normenhandbuch', es: 'Manual de normas', fr: 'Manuel des normes', it: 'Manuale delle norme',
    pt: 'Manual de normas', ru: 'Справочник стандартов', ja: '規格ハンドブック', ko: '규격 핸드북',
  },
};

const file = 'src/locales/sidebarTranslations.ts';
let src = fs.readFileSync(file, 'utf8');

src = src.replace(/'([^']+)':\s*\{[\s\S]*?\n  \},/g, (full, id) => {
  if (!full.includes('en:')) return full;
  const enM = full.match(/en:\s*"((?:\\.|[^"])*)"/);
  if (!enM) return full;
  const en = enM[1];
  const trM = full.match(/tr:\s*"((?:\\.|[^"])*)"/);
  const zhM = full.match(/zh:\s*"((?:\\.|[^"])*)"/);
  const arM = full.match(/ar:\s*"((?:\\.|[^"])*)"/);
  const pack = T[en] || {};
  const lines = [
    `    en: ${JSON.stringify(en)},`,
    `    tr: ${JSON.stringify(trM ? trM[1] : en)},`,
    `    de: ${JSON.stringify(pack.de || en)},`,
    `    es: ${JSON.stringify(pack.es || en)},`,
    `    fr: ${JSON.stringify(pack.fr || en)},`,
    `    it: ${JSON.stringify(pack.it || en)},`,
    `    pt: ${JSON.stringify(pack.pt || en)},`,
    `    ru: ${JSON.stringify(pack.ru || en)},`,
    `    zh: ${JSON.stringify(zhM ? zhM[1] : en)},`,
    `    ja: ${JSON.stringify(pack.ja || en)},`,
    `    ko: ${JSON.stringify(pack.ko || en)},`,
    `    ar: ${JSON.stringify(arM ? arM[1] : en)},`,
  ];
  return `'${id}': {\n${lines.join('\n')}\n  },`;
});

fs.writeFileSync(file, src);
console.log('sidebar labels translated');
console.log('mapped', Object.keys(T).length);
