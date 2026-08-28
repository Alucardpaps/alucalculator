import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const DIR = path.join(ROOT, 'src/dictionaries');

function setPath(obj, dotted, value) {
  const parts = dotted.split('.');
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const k = parts[i];
    if (cur[k] == null || typeof cur[k] !== 'object' || Array.isArray(cur[k])) cur[k] = {};
    cur = cur[k];
  }
  cur[parts[parts.length - 1]] = value;
}

const PATCH = {
  'nav.mechanical': {
    de: 'Mechanik', es: 'Mecánica', fr: 'Mécanique', it: 'Meccanica', pt: 'Mecânica',
    ru: 'Механика', zh: '机械', ja: '機械', ko: '기계', ar: 'ميكانيكا',
  },
  'nav.civil': {
    de: 'Bauwesen', es: 'Civil', fr: 'Génie civil', it: 'Civile', pt: 'Civil',
    ru: 'Строительство', zh: '土木', ja: '土木', ko: '토목', ar: 'مدني',
  },
  'nav.electrical': {
    de: 'Elektrotechnik', es: 'Eléctrica', fr: 'Électrique', it: 'Elettrica', pt: 'Elétrica',
    ru: 'Электротехника', zh: '电气', ja: '電気', ko: '전기', ar: 'كهربائي',
  },
  'nav.science': {
    de: 'Naturwissenschaft', es: 'Ciencia', fr: 'Sciences', it: 'Scienza', pt: 'Ciência',
    ru: 'Наука', zh: '科学', ja: '科学', ko: '과학', ar: 'علوم',
  },
  'nav.finance': {
    de: 'Finanzen', es: 'Finanzas', fr: 'Finance', it: 'Finanza', pt: 'Finanças',
    ru: 'Финансы', zh: '金融', ja: '金融', ko: '금융', ar: 'مالية',
  },
  'nav.software': {
    de: 'Software', es: 'Software', fr: 'Logiciel', it: 'Software', pt: 'Software',
    ru: 'ПО', zh: '软件', ja: 'ソフトウェア', ko: '소프트웨어', ar: 'برمجيات',
  },
  'nav.other': {
    de: 'Sonstiges', es: 'Otro', fr: 'Autre', it: 'Altro', pt: 'Outro',
    ru: 'Прочее', zh: '其他', ja: 'その他', ko: '기타', ar: 'أخرى',
  },
  'modules.thermalExpansion.title': {
    de: 'Wärmedehnung', es: 'Expansión térmica', fr: 'Dilatation thermique', it: 'Dilatazione termica',
    pt: 'Expansão térmica', ru: 'Тепловое расширение', zh: '热膨胀', ja: '熱膨張', ko: '열팽창', ar: 'التمدد الحراري',
  },
  'modules.thermalExpansion.desc': {
    de: 'Dimensionsstabilitätsanalyse', es: 'Análisis de estabilidad dimensional', fr: 'Analyse de stabilité dimensionnelle',
    it: 'Analisi di stabilità dimensionale', pt: 'Análise de estabilidade dimensional', ru: 'Анализ размерной стабильности',
    zh: '尺寸稳定性分析', ja: '寸法安定性解析', ko: '치수 안정성 분석', ar: 'تحليل الاستقرار البعدي',
  },
  'modules.manufacturingSandbox.title': {
    de: 'Fertigungssimulator', es: 'Simulador de fabricación', fr: 'Bac à sable fabrication', it: 'Sandbox di produzione',
    pt: 'Simulador de fabricação', ru: 'Производственный симулятор', zh: '制造沙盒', ja: '製造サンドボックス',
    ko: '제조 시뮬레이터', ar: 'محاكي التصنيع',
  },
  'modules.manufacturingSandbox.desc': {
    de: 'Virtuelle Fertigungslinie', es: 'Línea de producción virtual', fr: 'Ligne de production virtuelle',
    it: 'Linea di produzione virtuale', pt: 'Linha de produção virtual', ru: 'Виртуальная производственная линия',
    zh: '虚拟产线', ja: '仮想生産ライン', ko: '가상 생산 라인', ar: 'خط إنتاج افتراضي',
  },
  'modules.simulationFea.title': {
    de: 'FEA-Simulation', es: 'Simulación FEA', fr: 'Simulation EF', it: 'Simulazione FEA',
    pt: 'Simulação FEA', ru: 'FEA-моделирование', zh: 'FEA 仿真', ja: 'FEAシミュレーション',
    ko: 'FEA 시뮬레이션', ar: 'محاكاة العناصر المحدودة',
  },
  'modules.simulationFea.desc': {
    de: 'Spannung & Verformung', es: 'Tensión y deformación', fr: 'Contrainte et déformation',
    it: 'Sforzo e deformazione', pt: 'Tensão e deformação', ru: 'Напряжения и деформации',
    zh: '应力与变形', ja: '応力と変形', ko: '응력 및 변형', ar: 'الإجهاد والتشوه',
  },
  'modules.analytics.title': {
    de: 'Analyse-Dashboard', es: 'Panel de analítica', fr: 'Tableau de bord analytique', it: 'Cruscotto analitico',
    pt: 'Painel analítico', ru: 'Аналитическая панель', zh: '分析仪表板', ja: '分析ダッシュボード',
    ko: '분석 대시보드', ar: 'لوحة التحليلات',
  },
  'modules.analytics.desc': {
    de: 'Systemleistungsdaten', es: 'Datos de rendimiento del sistema', fr: 'Données de performance système',
    it: 'Dati di prestazione del sistema', pt: 'Dados de desempenho do sistema', ru: 'Данные производительности системы',
    zh: '系统性能数据', ja: 'システム性能データ', ko: '시스템 성능 데이터', ar: 'بيانات أداء النظام',
  },
  'modules.fileExplorer.title': {
    de: 'Datei-Explorer', es: 'Explorador de archivos', fr: 'Explorateur de fichiers', it: 'Esplora file',
    pt: 'Explorador de arquivos', ru: 'Проводник', zh: '文件资源管理器', ja: 'ファイルエクスプローラー',
    ko: '파일 탐색기', ar: 'مستكشف الملفات',
  },
  'modules.fileExplorer.desc': {
    de: 'OS-Dateisystem', es: 'Sistema de archivos del OS', fr: 'Système de fichiers OS', it: 'File system OS',
    pt: 'Sistema de arquivos do OS', ru: 'Файловая система ОС', zh: '操作系统文件系统', ja: 'OSファイルシステム',
    ko: 'OS 파일 시스템', ar: 'نظام ملفات نظام التشغيل',
  },
  'modules.terminal.title': {
    de: 'Terminal', es: 'Terminal', fr: 'Terminal', it: 'Terminale', pt: 'Terminal',
    ru: 'Терминал', zh: '终端', ja: 'ターミナル', ko: '터미널', ar: 'الطرفية',
  },
  'modules.terminal.desc': {
    de: 'Befehlszeilenschnittstelle', es: 'Interfaz de línea de comandos', fr: 'Interface en ligne de commande',
    it: 'Interfaccia a riga di comando', pt: 'Interface de linha de comando', ru: 'Интерфейс командной строки',
    zh: '命令行界面', ja: 'コマンドラインインターフェイス', ko: '명령줄 인터페이스', ar: 'واجهة سطر الأوامر',
  },
  'modules.settings.title': {
    de: 'Einstellungen', es: 'Ajustes', fr: 'Paramètres', it: 'Impostazioni', pt: 'Configurações',
    ru: 'Настройки', zh: '设置', ja: '設定', ko: '설정', ar: 'الإعدادات',
  },
  'modules.settings.desc': {
    de: 'Systemkonfiguration', es: 'Configuración del sistema', fr: 'Configuration système', it: 'Configurazione di sistema',
    pt: 'Configuração do sistema', ru: 'Конфигурация системы', zh: '系统配置', ja: 'システム設定',
    ko: '시스템 구성', ar: 'إعداد النظام',
  },
  'gear.outputs.tipDia': {
    de: 'Kopfkreisdurchmesser', es: 'Diámetro de cabeza', fr: 'Diamètre de tête', it: 'Diametro di testa',
    pt: 'Diâmetro de cabeça', ru: 'Диаметр вершин', zh: '齿顶圆直径', ja: '歯先円直径', ko: '이끝원 지름', ar: 'قطر الرأس',
  },
  'gear.outputs.rootDia': {
    de: 'Fußkreisdurchmesser', es: 'Diámetro de pie', fr: 'Diamètre de pied', it: 'Diametro di piede',
    pt: 'Diâmetro de pé', ru: 'Диаметр впадин', zh: '齿根圆直径', ja: '歯底円直径', ko: '이뿌리원 지름', ar: 'قطر الجذر',
  },
  'beam-deflection.title': {
    de: 'Balkendurchbiegung', es: 'Deflexión de viga', fr: 'Flèche de poutre', it: 'Deflessione della trave',
    pt: 'Deflexão de viga', ru: 'Прогиб балки', zh: '梁挠度', ja: '梁のたわみ', ko: '보 처짐', ar: 'انحراف العارضة',
  },
  'beam-deflection.desc': {
    de: 'Durchbiegung und Spannung berechnen', es: 'Calcular deflexión y esfuerzo', fr: 'Calculer flèche et contrainte',
    it: 'Calcola deflessione e sforzo', pt: 'Calcular deflexão e tensão', ru: 'Расчёт прогиба и напряжения',
    zh: '计算挠度与应力', ja: 'たわみと応力を計算', ko: '처짐 및 응력 계산', ar: 'حساب الانحراف والإجهاد',
  },
  'concrete-reinforcement.title': {
    de: 'Betonbewehrung', es: 'Armadura de hormigón', fr: 'Armature béton', it: 'Armatura del calcestruzzo',
    pt: 'Armadura de concreto', ru: 'Армирование бетона', zh: '混凝土配筋', ja: 'コンクリート鉄筋',
    ko: '콘크리트 철근', ar: 'تسليح الخرسانة',
  },
  'concrete-reinforcement.desc': {
    de: 'Bewehrungsquerschnitt', es: 'Área de refuerzo', fr: 'Section d’armature', it: 'Area di armatura',
    pt: 'Área de armadura', ru: 'Площадь арматуры', zh: '配筋面积', ja: '鉄筋断面積', ko: '철근 단면적', ar: 'مساحة التسليح',
  },
  'ohms-law.title': {
    de: 'Ohmsches Gesetz', es: 'Ley de Ohm', fr: 'Loi d’Ohm', it: 'Legge di Ohm', pt: 'Lei de Ohm',
    ru: 'Закон Ома', zh: '欧姆定律', ja: 'オームの法則', ko: '옴의 법칙', ar: 'قانون أوم',
  },
  'ohms-law.desc': {
    de: 'V = I × R', es: 'V = I × R', fr: 'V = I × R', it: 'V = I × R', pt: 'V = I × R',
    ru: 'V = I × R', zh: 'V = I × R', ja: 'V = I × R', ko: 'V = I × R', ar: 'V = I × R',
  },
  'voltage-drop.title': {
    de: 'Spannungsabfall', es: 'Caída de tensión', fr: 'Chute de tension', it: 'Caduta di tensione',
    pt: 'Queda de tensão', ru: 'Падение напряжения', zh: '电压降', ja: '電圧降下', ko: '전압 강하', ar: 'هبوط الجهد',
  },
  'voltage-drop.desc': {
    de: 'Kabeldimensionierung', es: 'Dimensionado de cables', fr: 'Dimensionnement des câbles', it: 'Dimensionamento cavi',
    pt: 'Dimensionamento de cabos', ru: 'Подбор сечения кабеля', zh: '电缆选型', ja: 'ケーブルサイジング',
    ko: '케이블 단면 선정', ar: 'تحديد مقطع الكابل',
  },
  'periodic-table.title': {
    de: 'Periodensystem', es: 'Tabla periódica', fr: 'Tableau périodique', it: 'Tavola periodica',
    pt: 'Tabela periódica', ru: 'Периодическая таблица', zh: '元素周期表', ja: '周期表', ko: '주기율표', ar: 'الجدول الدوري',
  },
  'periodic-table.desc': {
    de: 'Chemische Elemente', es: 'Elementos químicos', fr: 'Éléments chimiques', it: 'Elementi chimici',
    pt: 'Elementos químicos', ru: 'Химические элементы', zh: '化学元素', ja: '化学元素', ko: '화학 원소', ar: 'العناصر الكيميائية',
  },
  'calculator.title': {
    de: 'Wissenschaftlicher Rechner', es: 'Calculadora científica', fr: 'Calculatrice scientifique', it: 'Calcolatrice scientifica',
    pt: 'Calculadora científica', ru: 'Научный калькулятор', zh: '科学计算器', ja: '関数電卓',
    ko: '과학 계산기', ar: 'آلة حاسبة علمية',
  },
  'calculator.desc': {
    de: 'Höhere Mathematik', es: 'Matemáticas avanzadas', fr: 'Mathématiques avancées', it: 'Matematica avanzata',
    pt: 'Matemática avançada', ru: 'Высшая математика', zh: '高等数学', ja: '高度な数学', ko: '고급 수학', ar: 'رياضيات متقدمة',
  },
  'vat-calculator.title': {
    de: 'MwSt-Rechner', es: 'Calculadora de IVA', fr: 'Calculateur de TVA', it: 'Calcolatore IVA',
    pt: 'Calculadora de IVA', ru: 'Калькулятор НДС', zh: '增值税计算器', ja: '消費税計算機', ko: '부가세 계산기', ar: 'حاسبة ضريبة القيمة المضافة',
  },
  'vat-calculator.desc': {
    de: 'Steuerberechnung', es: 'Cálculo de impuestos', fr: 'Calcul fiscal', it: 'Calcolo fiscale',
    pt: 'Cálculo de impostos', ru: 'Расчёт налога', zh: '税额计算', ja: '税額計算', ko: '세금 계산', ar: 'حساب الضريبة',
  },
  'excel-helper.title': {
    de: 'Excel-Helfer', es: 'Asistente Excel', fr: 'Assistant Excel', it: 'Helper Excel', pt: 'Assistente Excel',
    ru: 'Помощник Excel', zh: 'Excel 助手', ja: 'Excelヘルパー', ko: '엑셀 도우미', ar: 'مساعد Excel',
  },
  'excel-helper.desc': {
    de: 'Formelerzeuger', es: 'Generador de fórmulas', fr: 'Générateur de formules', it: 'Generatore di formule',
    pt: 'Gerador de fórmulas', ru: 'Генератор формул', zh: '公式生成器', ja: '数式ジェネレーター',
    ko: '수식 생성기', ar: 'مولّد الصيغ',
  },
  'json-formatter.title': {
    de: 'JSON-Formatierer', es: 'Formateador JSON', fr: 'Formateur JSON', it: 'Formattatore JSON',
    pt: 'Formatador JSON', ru: 'Форматтер JSON', zh: 'JSON 格式化', ja: 'JSONフォーマッター',
    ko: 'JSON 포맷터', ar: 'منسق JSON',
  },
  'json-formatter.desc': {
    de: 'JSON verschönern', es: 'Embellecer JSON', fr: 'Embellir JSON', it: 'Abbellire JSON',
    pt: 'Embelezar JSON', ru: 'Форматирование JSON', zh: '美化 JSON', ja: 'JSONを整形', ko: 'JSON 정리', ar: 'تنسيق JSON',
  },
  'regex-tester.title': {
    de: 'Regex-Tester', es: 'Probador Regex', fr: 'Testeur Regex', it: 'Tester Regex', pt: 'Testador Regex',
    ru: 'Тестер Regex', zh: '正则测试器', ja: '正規表現テスター', ko: '정규식 테스터', ar: 'مختبر التعبيرات النمطية',
  },
  'regex-tester.desc': {
    de: 'Muster testen', es: 'Probar patrones', fr: 'Tester des motifs', it: 'Testare pattern',
    pt: 'Testar padrões', ru: 'Проверка шаблонов', zh: '测试模式', ja: 'パターンをテスト', ko: '패턴 테스트', ar: 'اختبار الأنماط',
  },
  'feedback.title': {
    de: 'Feedback', es: 'Comentarios', fr: 'Retour', it: 'Feedback', pt: 'Feedback',
    ru: 'Обратная связь', zh: '反馈', ja: 'フィードバック', ko: '피드백', ar: 'ملاحظات',
  },
  'feedback.desc': {
    de: 'Senden Sie uns Ihre Meinung', es: 'Envíenos sus comentarios', fr: 'Envoyez-nous vos impressions',
    it: 'Inviateci i vostri commenti', pt: 'Envie-nos a sua opinião', ru: 'Пришлите нам ваши мысли',
    zh: '把您的想法发给我们', ja: 'ご意見をお送りください', ko: '의견을 보내 주세요', ar: 'أرسل لنا ملاحظاتك',
  },
  'thermal.initialLength': {
    de: 'Ausgangslänge', es: 'Longitud inicial', fr: 'Longueur initiale', it: 'Lunghezza iniziale',
    pt: 'Comprimento inicial', ru: 'Начальная длина', zh: '初始长度', ja: '初期長さ', ko: '초기 길이', ar: 'الطول الابتدائي',
  },
  'thermal.tempDelta': {
    de: 'Temperaturdifferenz', es: 'Delta de temperatura', fr: 'Écart de température', it: 'Delta di temperatura',
    pt: 'Delta de temperatura', ru: 'Перепад температуры', zh: '温差', ja: '温度差', ko: '온도 차이', ar: 'فرق الحرارة',
  },
  'thermal.finalLength': {
    de: 'Endlänge', es: 'Longitud final', fr: 'Longueur finale', it: 'Lunghezza finale',
    pt: 'Comprimento final', ru: 'Конечная длина', zh: '最终长度', ja: '最終長さ', ko: '최종 길이', ar: 'الطول النهائي',
  },
  'thermal.expansion': {
    de: 'Dehnungsbetrag', es: 'Cantidad de expansión', fr: 'Grandeur de dilatation', it: 'Entità della dilatazione',
    pt: 'Quantidade de expansão', ru: 'Величина расширения', zh: '膨胀量', ja: '膨張量', ko: '팽창량', ar: 'مقدار التمدد',
  },
  'thermal.strain': {
    de: 'Dehnung', es: 'Deformación unitaria', fr: 'Déformation unitaire', it: 'Deformazione unitaria',
    pt: 'Deformação unitária', ru: 'Относительная деформация', zh: '应变率', ja: 'ひずみ', ko: '변형률', ar: 'معدل الانفعال',
  },
};

const LANGS = ['de', 'es', 'fr', 'it', 'pt', 'ru', 'zh', 'ja', 'ko', 'ar'];

for (const lang of LANGS) {
  const file = path.join(DIR, `${lang}.json`);
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  let n = 0;
  for (const [k, byLang] of Object.entries(PATCH)) {
    if (byLang[lang] == null) continue;
    setPath(data, k, byLang[lang]);
    n++;
  }
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
  console.log('patched', lang, n, 'keys');
}
