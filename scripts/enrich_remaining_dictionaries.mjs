import fs from 'fs';

const TABLE_PATH = 'src/locales/t12table.json';
const table = JSON.parse(fs.readFileSync(TABLE_PATH, 'utf8'));

const DICT = {
  // Keyway materials & calculation items
  "Carbon Steel C45 / 1.0503 (Standard Key Steel)": {
    tr: "Karbon Çeliği C45 / 1.0503 (Standart Kama Çeliği)",
    de: "Kohlenstoffstahl C45 / 1.0503 (Standard-Passfederstahl)",
    zh: "碳素结构钢 C45 / 1.0503 (标准键用钢)",
    ja: "機械構造用炭素鋼 C45 / 1.0503 (標準キー鋼)",
    ko: "기계구조용 탄소강 C45 / 1.0503 (표준 키용 강재)",
    fr: "Acier au carbone C45 / 1.0503 (Acier standard pour clavettes)",
    es: "Acero al carbono C45 / 1.0503 (Acero estándar para chavetas)",
    it: "Acciaio al carbonio C45 / 1.0503 (Acciaio standard per linguette)",
    pt: "Aço carbono C45 / 1.0503 (Aço padrão para chavetas)",
    ru: "Углеродистая сталь C45 / 1.0503 (стандартная шпоночная сталь)",
    ar: "فولاذ كربوني C45 / 1.0503 (فولاذ خابور قياسي)"
  },
  "Quenched & Tempered Steel 42CrMo4 / 1.7225 (High Strength)": {
    tr: "Islah Çeliği 42CrMo4 / 1.7225 (Yüksek Dayanımlı)",
    de: "Vergütungsstahl 42CrMo4 / 1.7225 (Hochfest)",
    zh: "调质合金钢 42CrMo4 / 1.7225 (高强度)",
    ja: "調質合金鋼 42CrMo4 / 1.7225 (高強度)",
    ko: "조질 합금강 42CrMo4 / 1.7225 (고강도)",
    fr: "Acier trempé et revenu 42CrMo4 / 1.7225 (Haute résistance)",
    es: "Acero bonificado 42CrMo4 / 1.7225 (Alta resistencia)",
    it: "Acciaio bonificato 42CrMo4 / 1.7225 (Alta resistenza)",
    pt: "Aço temperado e revenido 42CrMo4 / 1.7225 (Alta resistência)",
    ru: "Улучшаемая сталь 42CrMo4 / 1.7225 (высокопрочная)",
    ar: "فولاذ مقسى ومطبع 42CrMo4 / 1.7225 (عالي المقاومة)"
  },
  "Structural Steel S275 / St 44 (General Machinery)": {
    tr: "Yapı Çeliği S275 / St 44 (Genel İmalat)",
    de: "Baustahl S275 / St 44 (Allgemeiner Maschinenbau)",
    zh: "通用结构钢 S275 / St 44 (一般机械用)",
    ja: "一般構造用圧延鋼材 S275 / St 44 (一般機械)",
    ko: "일반 구조용강 S275 / St 44 (일반 기계용)",
    fr: "Acier de construction S275 / St 44 (Mécanique générale)",
    es: "Acero estructural S275 / St 44 (Maquinaria general)",
    it: "Acciaio strutturale S275 / St 44 (Meccanica generale)",
    pt: "Aço estrutural S275 / St 44 (Máquinas em geral)",
    ru: "Конструкционная сталь S275 / St 44 (общее машиностроение)",
    ar: "فولاذ إنشائي S275 / St 44 (آلات عامة)"
  },
  "Structural Steel S355 / St 52": {
    tr: "Yapı Çeliği S355 / St 52",
    de: "Baustahl S355 / St 52 (Hochfest)",
    zh: "高强结构钢 S355 / St 52",
    ja: "溶接構造用圧延鋼材 S355 / St 52",
    ko: "고장력 구조용강 S355 / St 52",
    fr: "Acier de construction S355 / St 52",
    es: "Acero estructural S355 / St 52",
    it: "Acciaio strutturale S355 / St 52",
    pt: "Aço estrutural S355 / St 52",
    ru: "Конструкционная сталь S355 / St 52",
    ar: "فولاذ إنشائي S355 / St 52"
  },
  "Grey Cast Iron GG-25 / EN-GJL-250 (Cast Hub)": {
    tr: "Pik Döküm GG-25 / EN-GJL-250 (Dökme Gövde/Göbek)",
    de: "Grauguss GG-25 / EN-GJL-250 (Gussnabe)",
    zh: "灰口铸铁 GG-25 / EN-GJL-250 (铸造轮毂)",
    ja: "ねずみ鋳鉄 GG-25 / EN-GJL-250 (鋳鉄ハブ)",
    ko: "회주철 GG-25 / EN-GJL-250 (주철 허브)",
    fr: "Fonte grise GG-25 / EN-GJL-250 (Moyeu coulé)",
    es: "Fundición gris GG-25 / EN-GJL-250 (Cubo fundido)",
    it: "Ghisa grigia GG-25 / EN-GJL-250 (Mozzo fuso)",
    pt: "Ferro fundido cinzento GG-25 / EN-GJL-250 (Cubo fundido)",
    ru: "Серый чугун GG-25 / EN-GJL-250 (литая ступица)",
    ar: "حديد زهر رمادي GG-25 / EN-GJL-250 (محور مصبوب)"
  },
  "Ductile Iron GGG-40 / EN-GJS-400 (Impact Resistant)": {
    tr: "Sfero Döküm GGG-40 / EN-GJS-400 (Darbe Dayanımlı)",
    de: "Sphäroguss GGG-40 / EN-GJS-400 (Schlagzäh)",
    zh: "球墨铸铁 GGG-40 / EN-GJS-400 (耐冲击高韧性)",
    ja: "球状黒鉛鋳鉄 GGG-40 / EN-GJS-400 (耐衝撃性)",
    ko: "구상흑연주철 GGG-40 / EN-GJS-400 (내충격성)",
    fr: "Fonte ductile GGG-40 / EN-GJS-400 (Résistante aux chocs)",
    es: "Fundición dúctil GGG-40 / EN-GJS-400 (Resistente al impacto)",
    it: "Ghisa sferoidale GGG-40 / EN-GJS-400 (Resistente agli urti)",
    pt: "Ferro fundido dúctil GGG-40 / EN-GJS-400 (Resistente ao impacto)",
    ru: "Высокопрочный чугун GGG-40 / EN-GJS-400 (ударопрочный)",
    ar: "حديد زهر مرن GGG-40 / EN-GJS-400 (مقاوم للصدمات)"
  },
  "Aluminum 6061-T6 (Lightweight Hub)": {
    tr: "Alüminyum 6061-T6 (Hafif Yapı Göbeği)",
    de: "Aluminium 6061-T6 (Leichtbaunabe)",
    zh: "铝合金 6061-T6 (轻量化轮毂)",
    ja: "アルミニウム合金 6061-T6 (軽量ハブ)",
    ko: "알루미늄 6061-T6 (경량 허브)",
    fr: "Aluminium 6061-T6 (Moyeu allégé)",
    es: "Aluminio 6061-T6 (Cubo ligero)",
    it: "Alluminio 6061-T6 (Mozzo leggero)",
    pt: "Alumínio 6061-T6 (Cubo leve)",
    ru: "Алюминий 6061-T6 (облегченная ступица)",
    ar: "ألومنيوم 6061-T6 (محور خفيف الوزن)"
  },
  "DIN 6885 PARALLEL KEYWAY CALCULATION REPORT": {
    tr: "DIN 6885 PARALEL KAMA HESAP RAPORU",
    de: "DIN 6885 PASSFEDERVERBINDUNG BERECHNUNGSBERICHT",
    zh: "DIN 6885 平键联接工程计算与校核报告",
    ja: "DIN 6885 平行キー結合強度計算書",
    ko: "DIN 6885 평행 키 연결 강도 계산 보고서",
    fr: "RAPPORT DE CALCUL DE CLAVETTE PARALLÈLE DIN 6885",
    es: "INFORME DE CÁLCULO DE CHAVETA PARALELA DIN 6885",
    it: "REPORT CALCOLO LINGUETTA PARALLELA DIN 6885",
    pt: "RELATÓRIO DE CÁLCULO DE CHAVETA PARALELA DIN 6885",
    ru: "ОТЧЕТ РАСЧЕТА ПРИЗМАТИЧЕСКОЙ ШПОНКИ DIN 6885",
    ar: "تقرير حساب وصلة الخابور المتوازي DIN 6885"
  },
  "Form A Round Ends": {
    tr: "Form A Yuvarlak Uç",
    de: "Form A (Rundstirnig)",
    zh: "A型 圆弧端头",
    ja: "A形 両丸キー",
    ko: "형식 A 원형 끝단",
    fr: "Forme A (Bouts ronds)",
    es: "Forma A (Extremos redondos)",
    it: "Forma A (Estremità arrotondate)",
    pt: "Forma A (Extremidades redondas)",
    ru: "Форма A (скругленные торцы)",
    ar: "شكل A أطراف دائرية"
  },
  "Form B Square Ends": {
    tr: "Form B Düz Uç",
    de: "Form B (Geradstirnig)",
    zh: "B型 平方端头",
    ja: "B形 両角キー",
    ko: "형식 B 사각 끝단",
    fr: "Forme B (Bouts droits)",
    es: "Forma B (Extremos rectos)",
    it: "Forma B (Estremità squadrate)",
    pt: "Forma B (Extremidades retas)",
    ru: "Форма B (прямые торцы)",
    ar: "شكل B أطراف مربعة"
  },
  "Calculated Torque": {
    tr: "Hesaplanan Tork",
    de: "Berechnetes Drehmoment",
    zh: "计算扭矩",
    ja: "計算トルク",
    ko: "계산된 토크",
    fr: "Couple calculé",
    es: "Par calculado",
    it: "Coppia calcolata",
    pt: "Torque calculado",
    ru: "Расчетный момент",
    ar: "عزم الدوران المحسوب"
  },
  "Tangential Force (F_t)": {
    tr: "Teğetsel Kuvvet (F_t)",
    de: "Tangentialkraft (F_t)",
    zh: "圆周切向力 (F_t)",
    ja: "接線力 (F_t)",
    ko: "접선력 (F_t)",
    fr: "Force tangentielle (F_t)",
    es: "Fuerza tangencial (F_t)",
    it: "Forza tangenziale (F_t)",
    pt: "Força tangencial (F_t)",
    ru: "Тангенциальная сила (F_t)",
    ar: "القوة المماسية (F_t)"
  },
  "Hub Surface Pressure (p_hub)": {
    tr: "Göbek Yüzey Basıncı (p_hub)",
    de: "Nabenflächenpressung (p_hub)",
    zh: "轮毂表面接触挤压应力 (p_hub)",
    ja: "ハブ受圧面圧 (p_hub)",
    ko: "허브 표면 면압 (p_hub)",
    fr: "Pression de surface du moyeu (p_hub)",
    es: "Presión superficial del cubo (p_hub)",
    it: "Pressione superficiale mozzo (p_hub)",
    pt: "Pressão superficial do cubo (p_hub)",
    ru: "Поверхностное давление на ступицу (p_hub)",
    ar: "ضغط سطح المحور (p_hub)"
  },
  "Safety": {
    tr: "Emniyet",
    de: "Sicherheit",
    zh: "安全系数",
    ja: "安全率",
    ko: "안전율",
    fr: "Sécurité",
    es: "Seguridad",
    it: "Sicurezza",
    pt: "Segurança",
    ru: "Запас прочности",
    ar: "الأمان"
  },
  "Key Shear Stress (tau)": {
    tr: "Kama Kayma Gerilmesi (tau)",
    de: "Scherspannung der Passfeder (τ)",
    zh: "键体剪切应力 (τ)",
    ja: "キーせん断応力 (τ)",
    ko: "키 전단 응력 (τ)",
    fr: "Contrainte de cisaillement de clavette (τ)",
    es: "Tensión cortante de chaveta (τ)",
    it: "Tensione di taglio linguetta (τ)",
    pt: "Tensão de cisalhamento da chaveta (τ)",
    ru: "Напряжение среза шпонки (τ)",
    ar: "إجهاد قص الخابور (tau)"
  },
  "1.0 - Uniform / Smooth (Electric Motor, Centrifugal Pump)": {
    tr: "1.0 - Düzgün / Sabit (Elektrik Motoru, Santrifüj Pompa)",
    de: "1,0 - Gleichmäßig / Ruhig (Elektromotor, Kreiselpumpe)",
    zh: "1.0 - 均匀平稳工况 (电动机、离心泵)",
    ja: "1.0 - 均一・平滑負荷 (電動機、遠心ポンプ)",
    ko: "1.0 - 균일 / 완만한 부하 (전동기, 원심 펌프)",
    fr: "1,0 - Uniforme / Régulier (Moteur électrique, Pompe centrifuge)",
    es: "1,0 - Uniforme / Suave (Motor eléctrico, Bomba centrífuga)",
    it: "1,0 - Uniforme / Fluido (Motore elettrico, Pompa centrifuga)",
    pt: "1,0 - Uniforme / Suave (Motor elétrico, Bomba centrífuga)",
    ru: "1.0 - Равномерная / плавная (электродвигатель, центробежный насос)",
    ar: "1.0 - منتظم / هادئ (محرك كهربائي، مضخة طرد مركزي)"
  },
  "1.25 - Light Shocks (Conveyor, Machine Tool)": {
    tr: "1.25 - Hafif Darbeli (Konveyör, Takım Tezgahı)",
    de: "1,25 - Leichte Stöße (Förderband, Werkzeugmaschine)",
    zh: "1.25 - 轻微冲击工况 (输送机、金属切削机床)",
    ja: "1.25 - 軽度の衝撃 (コンベア、工作機械)",
    ko: "1.25 - 경미한 충격 (컨베이어, 공작 기계)",
    fr: "1,25 - Chocs légers (Convoyeur, Machine-outil)",
    es: "1,25 - Impactos ligeros (Transportador, Máquina herramienta)",
    it: "1,25 - Urti leggeri (Trasportatore, Macchina utensile)",
    pt: "1,25 - Choques leves (Transportador, Máquina ferramenta)",
    ru: "1.25 - Легкие толчки (конвейер, станок)",
    ar: "1.25 - صدمات خفيفة (ناقل، آلة تشغيل)"
  },
  "1.50 - Moderate Shocks (Crane, Piston Pump)": {
    tr: "1.50 - Orta Darbeli (Vinç, Pistonlu Pompa)",
    de: "1,50 - Mäßige Stöße (Kran, Kolbenpumpe)",
    zh: "1.50 - 中等冲击工况 (起重机、活塞泵)",
    ja: "1.50 - 中程度の衝撃 (クレーン、ピストンポンプ)",
    ko: "1.50 - 보통 충격 (크레인, 피스톤 펌프)",
    fr: "1,50 - Chocs modérés (Grue, Pompe à piston)",
    es: "1,50 - Impactos moderados (Grúa, Bomba de pistón)",
    it: "1,50 - Urti moderati (Gru, Pompa a pistoni)",
    pt: "1,50 - Choques moderados (Guindaste, Bomba de pistão)",
    ru: "1.50 - Умеренные толчки (кран, поршневой насос)",
    ar: "1.50 - صدمات متوسطة (رافعة، مضخة مكبسية)"
  },
  "2.00 - Heavy Shocks (Crusher, Mill, Press)": {
    tr: "2.00 - Ağır Darbeli (Kırıcı, Değirmen, Pres)",
    de: "2,00 - Schwere Stöße (Brecher, Mühle, Presse)",
    zh: "2.00 - 强烈冲击与换向工况 (破碎机、轧机、冲压机)",
    ja: "2.00 - 重大な衝撃 (破砕機、ミル、プレス)",
    ko: "2.00 - 심한 충격 (파쇄기, 분쇄기, 프레스)",
    fr: "2,00 - Chocs violents (Concasseur, Broyeur, Presse)",
    es: "2,00 - Impactos fuertes (Trituradora, Molino, Prensa)",
    it: "2,00 - Urti pesanti (Frantoio, Mulino, Pressa)",
    pt: "2,00 - Choques pesados (Britador, Moinho, Prensa)",
    ru: "2.00 - Тяжелые удары (дробилка, мельница, пресс)",
    ar: "2.00 - صدمات شديدة (كسارة، طاحونة، مكبس)"
  },
  "DIN 471/472 Retaining Ring": {
    tr: "DIN 471/472 Emniyet Segmanı",
    de: "DIN 471/472 Sicherungsring",
    zh: "DIN 471/472 轴用与孔用挡圈",
    ja: "DIN 471/472 止め輪",
    ko: "DIN 471/472 스냅 링 (멈춤링)",
    fr: "Circlips DIN 471/472",
    es: "Anillo de seguridad DIN 471/472",
    it: "Anello d'arresto DIN 471/472 (Seeger)",
    pt: "Anel de retenção DIN 471/472",
    ru: "Стопорное кольцо DIN 471/472",
    ar: "حلقة تثبيت DIN 471/472"
  },
  "DIN 509 Relief Undercut": {
    tr: "DIN 509 Taşlama Kanalı",
    de: "DIN 509 Freistich",
    zh: "DIN 509 磨削退刀槽",
    ja: "DIN 509 研削逃げ溝",
    ko: "DIN 509 연삭 릴리프 홈",
    fr: "Dégagement de rectification DIN 509",
    es: "Entalladura de rectificado DIN 509",
    it: "Gola di scarico DIN 509",
    pt: "Canal de alívio DIN 509",
    ru: "Шлифовальная проточка DIN 509",
    ar: "أخدود التخليص للجلخ DIN 509"
  },
  "DIN 332 Center Hole": {
    tr: "DIN 332 Torna Puntası",
    de: "DIN 332 Zentrierbohrung",
    zh: "DIN 332 顶尖中心孔",
    ja: "DIN 332 センタ穴",
    ko: "DIN 332 센터 구멍",
    fr: "Trou de centre DIN 332",
    es: "Agujero de centrado DIN 332",
    it: "Foro da centro DIN 332",
    pt: "Furo de centro DIN 332",
    ru: "Центровое отверстие DIN 332",
    ar: "ثقب التمركز DIN 332"
  },
  "DIN 912 / 74 Fasteners": {
    tr: "DIN 912 / 74 Cıvata Yuvaları",
    de: "DIN 912 / 74 Schraubensenkungen",
    zh: "DIN 912 / 74 螺栓沉孔与座孔",
    ja: "DIN 912 / 74 ボルト座ぐり",
    ko: "DIN 912 / 74 볼트 자리파기",
    fr: "Lamages de vis DIN 912 / 74",
    es: "Avellanados de tornillos DIN 912 / 74",
    it: "Sedi viti DIN 912 / 74",
    pt: "Rebaixos de parafusos DIN 912 / 74",
    ru: "Цековки под болты DIN 912 / 74",
    ar: "تجاويف المسامير DIN 912 / 74"
  },
  "Retaining Rings": {
    tr: "Emniyet Segmanları",
    de: "Sicherungsringe",
    zh: "弹性挡圈",
    ja: "止め輪",
    ko: "스냅 링",
    fr: "Anneaux de retenue",
    es: "Anillos de retención",
    it: "Anelli di sicurezza",
    pt: "Anéis de retenção",
    ru: "Стопорные кольца",
    ar: "حلقات التثبيت"
  },
  "Relief Undercuts": {
    tr: "Taşlama Oyukları",
    de: "Freistiche",
    zh: "退刀槽 / 越程槽",
    ja: "逃げ溝",
    ko: "릴리프 홈",
    fr: "Dégagements",
    es: "Entalladuras de alivio",
    it: "Gole di scarico",
    pt: "Canais de alívio",
    ru: "Разгрузочные проточки",
    ar: "أخاديد التخليص"
  },
  "Center Drill Holes": {
    tr: "Torna Punta Delikleri",
    de: "Zentrierbohrungen",
    zh: "中心孔",
    ja: "センタ穴",
    ko: "센터 구멍",
    fr: "Trous de centrage",
    es: "Agujeros de centrado",
    it: "Fori di centraggio",
    pt: "Furos de centro",
    ru: "Центровочные отверстия",
    ar: "ثقوب التمركز"
  },
  "Fastener Recesses": {
    tr: "Cıvata Yuvaları",
    de: "Schraubenvertiefungen",
    zh: "紧固件沉孔",
    ja: "締結部座ぐり",
    ko: "패스너 홈",
    fr: "Logements de fixations",
    es: "Alojamientos para tornillos",
    it: "Sedi per elementi di fissaggio",
    pt: "Alojamentos de fixadores",
    ru: "Углубления под крепеж",
    ar: "تجاويف المثبتات"
  },
  "Axial Retaining Ring & Groove Calculation": {
    tr: "Eksenel Emniyet Segmanı ve Yuvası",
    de: "Axialer Sicherungsring & Nutberechnung",
    zh: "轴向弹性挡圈与槽体承载力计算",
    ja: "軸方向止め輪およびみぞ強度計算",
    ko: "축방향 스냅링 및 홈 강도 계산",
    fr: "Calcul d'anneau d'arrêt axial et de gorge",
    es: "Cálculo de anillo de seguridad axial y ranura",
    it: "Calcolo anello elastico assiale e cava",
    pt: "Cálculo de anel elástico axial e ranhura",
    ru: "Расчет упорного стопорного кольца и паза",
    ar: "حساب حلقة التثبيت المحورية والأخدود"
  },
  "Grinding Relief Undercut Geometry (DIN 509)": {
    tr: "DIN 509 Taşlama Serbest Oyuk Formları",
    de: "DIN 509 Freistichgeometrie für Schleifen",
    zh: "DIN 509 磨削用退刀槽几何形状规范",
    ja: "DIN 509 研削逃げ溝幾何形状",
    ko: "DIN 509 연삭 릴리프 언더컷 기하학",
    fr: "Géométrie de dégagement DIN 509 pour rectification",
    es: "Geometría de entalladuras de alivio DIN 509 para rectificado",
    it: "Geometria scarichi di rettifica DIN 509",
    pt: "Geometria do canal de alívio DIN 509 para retificação",
    ru: "Геометрия проточек под шлифование DIN 509",
    ar: "هندسة أخدود تخليص الجلخ DIN 509"
  },
  "Machining Center Hole & Chamfers (DIN 332)": {
    tr: "DIN 332 Torna Punta ve Havşa Geometrisi",
    de: "DIN 332 Zentrierbohrung & Fasen",
    zh: "DIN 332 顶尖中心孔与防护倒角规范",
    ja: "DIN 332 センタ穴および面取り",
    ko: "DIN 332 센터 구멍 및 모따기 가공",
    fr: "Usinage de trous de centrage et chanfreins DIN 332",
    es: "Mecanizado de agujero de centrado y chaflanes DIN 332",
    it: "Lavorazione fori da centro e smussi DIN 332",
    pt: "Usinagem de furos de centro e chanfros DIN 332",
    ru: "Обработка центровых отверстий и фасок DIN 332",
    ar: "تشغيل ثقوب التمركز والشطب DIN 332"
  },
  "Cap Screw Counterbore & Countersink Standards": {
    tr: "DIN 912 / 74 Cıvata Yuvası ve Havşaları",
    de: "Normen für Schraubensenkungen & Senkköpfe",
    zh: "DIN 912 / 74 圆柱头与沉头螺钉沉孔标准",
    ja: "キャップスクリュー座ぐり・皿座ぐり規格",
    ko: "캡 스크루 자리파기 및 카운터싱크 표준",
    fr: "Normes de lamages et fraisures pour vis",
    es: "Normas de avellanado para tornillos",
    it: "Standard svasature e lamature per viti",
    pt: "Padrões de rebaixo e escareado para parafusos",
    ru: "Стандарты цековок и зенковок под винты",
    ar: "معايير التخويش الغاطس والأسطواني للمسامير"
  },
  "1. Shaft & Key Dimensions": {
    tr: "1. Mil & Kama Boyutları",
    de: "1. Wellen- & Passfederabmessungen",
    zh: "1. 轴径与平键尺寸参数",
    ja: "1. 軸およびキー寸法",
    ko: "1. 축 및 키 치수",
    fr: "1. Dimensions d'arbre et de clavette",
    es: "1. Dimensiones de eje y chaveta",
    it: "1. Dimensioni albero e linguetta",
    pt: "1. Dimensões do eixo e chaveta",
    ru: "1. Размеры вала и шпонки",
    ar: "1. أبعاد العمود والخابور"
  },
  "2. Transmitted Load & Materials": {
    tr: "2. İletilen Yük & Malzemeler",
    de: "2. Übertragene Last & Werkstoffe",
    zh: "2. 传递载荷与构件材料",
    ja: "2. 伝達負荷および材料",
    ko: "2. 전달 하중 및 재질",
    fr: "2. Charge transmise et matériaux",
    es: "2. Carga transmitida y materiales",
    it: "2. Carico trasmesso e materiali",
    pt: "2. Carga transmitida e materiais",
    ru: "2. Передаваемая нагрузка и материалы",
    ar: "2. الحمل المنقول والمواد"
  },
  "Engineering Calculation Steps & DIN 6885 Stress Formulas": {
    tr: "Mühendislik Hesap Adımları & DIN 6885 Formülleri",
    de: "Ingenieurmäßige Berechnungsschritte & DIN 6885 Formeln",
    zh: "工程计算步骤与 DIN 6885 应力校核公式",
    ja: "工学計算手順および DIN 6885 応力算定式",
    ko: "엔지니어링 계산 단계 및 DIN 6885 응력 공식",
    fr: "Étapes de calcul et formules DIN 6885",
    es: "Pasos de cálculo y fórmulas DIN 6885",
    it: "Fasi di calcolo e formule di sollecitazione DIN 6885",
    pt: "Etapas de cálculo e fórmulas de tensão DIN 6885",
    ru: "Этапы расчета и формулы напряжений по DIN 6885",
    ar: "خطوات الحساب الهندسي وصيغ إجهاد DIN 6885"
  },
  "DIN 6885 Engineering Recommendation": {
    tr: "DIN 6885 Mühendislik Tavsiyesi",
    de: "DIN 6885 Ingenieurempfehlung",
    zh: "DIN 6885 平键联接结构工程建议",
    ja: "DIN 6885 工学設計推奨事項",
    ko: "DIN 6885 엔지니어링 권장사항",
    fr: "Recommandation technique DIN 6885",
    es: "Recomendación de ingeniería DIN 6885",
    it: "Raccomandazione ingegneristica DIN 6885",
    pt: "Recomendação de engenharia DIN 6885",
    ru: "Инженерные рекомендации по DIN 6885",
    ar: "توصية هندسية حسب DIN 6885"
  }
};

let added = 0;
let updated = 0;

for (const [key, trans] of Object.entries(DICT)) {
  if (!table[key]) {
    table[key] = trans;
    added++;
  } else {
    let changed = false;
    for (const [lang, val] of Object.entries(trans)) {
      if (!table[key][lang] || table[key][lang] !== val) {
        table[key][lang] = val;
        changed = true;
      }
    }
    if (changed) updated++;
  }
}

console.log(`Enriched remaining dictionaries: added ${added} new keys, updated ${updated} keys.`);
fs.writeFileSync(TABLE_PATH, JSON.stringify(table, null, 2), 'utf8');
console.log('Saved t12table.json successfully.');
