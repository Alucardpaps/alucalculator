import type { Language } from '@/store/i18nStore';

export type ConcreteReinforcementStrings = {
  beamGeometry: string;
  width: string;
  height: string;
  cover: string;
  propertyMatrix: string;
  concreteFck: string;
  steelFyk: string;
  designVector: string;
  moment: string;
  barDiameter: string;
  quantity: string;
  tensionRebar: string;
  percentRatio: string;
  doubleReinforced: string;
  singleReinforced: string;
  ec2Compliant: string;
  reinforcementDeficit: string;
  profileSection: string;
  mainTension: string;
  shearLinks: string;
  designCode: string;
  steelStrain: string;
  yielded: string;
  civilKernel: string;
  deficitMsg: string;
  deficitHint: string;
};

const EN: ConcreteReinforcementStrings = {
  "beamGeometry": "Beam Geometry",
  "width": "Width (b)",
  "height": "Height (h)",
  "cover": "Cover (c_nom)",
  "propertyMatrix": "Property Matrix",
  "concreteFck": "Concrete fck",
  "steelFyk": "Steel fyk",
  "designVector": "Design Vector",
  "moment": "Moment (M_ed)",
  "barDiameter": "Bar Diameter",
  "quantity": "Quantity",
  "tensionRebar": "TENSION REBAR",
  "percentRatio": "% RATIO",
  "doubleReinforced": "X-COMP REQ",
  "singleReinforced": "SINGLE REINFORCED",
  "ec2Compliant": "Compliant with EC2",
  "reinforcementDeficit": "Reinforcement Deficit",
  "profileSection": "Cast-in-Situ Structural Profile Section",
  "mainTension": "Main Tension",
  "shearLinks": "Shear Links",
  "designCode": "Design Code",
  "steelStrain": "Steel Strain",
  "yielded": "YIELDED",
  "civilKernel": "Civil Kernel",
  "deficitMsg": "Reinforcement insufficient: beam cannot carry {moment} kNm design moment.",
  "deficitHint": "Increase bar count or diameter for safe load transfer."
} as ConcreteReinforcementStrings;

const TR: ConcreteReinforcementStrings = {
  "beamGeometry": "Kiriş Geometrisi",
  "width": "Genişlik (b)",
  "height": "Yükseklik (h)",
  "cover": "Paspayı (c_nom)",
  "propertyMatrix": "Malzeme Özellikleri",
  "concreteFck": "Beton fck",
  "steelFyk": "Çelik fyk",
  "designVector": "Tasarım Vektörü",
  "moment": "Moment (M_ed)",
  "barDiameter": "Donatı Çapı",
  "quantity": "Donatı Adedi",
  "tensionRebar": "ÇEKME DONATISI",
  "percentRatio": "% ORAN",
  "doubleReinforced": "ÇİFT DONATILI",
  "singleReinforced": "TEK DONATILI",
  "ec2Compliant": "EC2 Uyumlu",
  "reinforcementDeficit": "Yetersiz Donatı",
  "profileSection": "Yerinde Dökme Yapısal Profil Kesiti",
  "mainTension": "Ana Donatı",
  "shearLinks": "Etriyeler",
  "designCode": "Tasarım Standardı",
  "steelStrain": "Çelik Birim Uzaması",
  "yielded": "AKTI",
  "civilKernel": "İnşaat Çekirdeği",
  "deficitMsg": "Donatı yetersizliği: Kiriş {moment} kNm tasarım momentini taşıyamıyor.",
  "deficitHint": "Güvenli yük aktarımı için donatı adetini veya çapını artırın."
} as ConcreteReinforcementStrings;

const DE: ConcreteReinforcementStrings = {
  "beamGeometry": "Balkengeometrie",
  "width": "Breite (b)",
  "height": "Höhe (h)",
  "cover": "Betondeckung (c_nom)",
  "propertyMatrix": "Materialeigenschaften",
  "concreteFck": "Beton fck",
  "steelFyk": "Stahl fyk",
  "designVector": "Bemessungsvektor",
  "moment": "Moment (M_ed)",
  "barDiameter": "Stabdurchmesser",
  "quantity": "Anzahl Stäbe",
  "tensionRebar": "ZUGBewehrung",
  "percentRatio": "% VERHÄLTNIS",
  "doubleReinforced": "DOPPELBEMESSUNG",
  "singleReinforced": "EINFACH BEWEHRT",
  "ec2Compliant": "EC2-konform",
  "reinforcementDeficit": "Bewehrungsdefizit",
  "profileSection": "Ortbeton-Querschnitt",
  "mainTension": "Hauptbewehrung",
  "shearLinks": "Bügel",
  "designCode": "Bemessungsnorm",
  "steelStrain": "Stahldehnung",
  "yielded": "FLIESSEN",
  "civilKernel": "Bau-Kernel",
  "deficitMsg": "Bewehrung unzureichend: Balken trägt {moment} kNm Bemessungsmoment nicht.",
  "deficitHint": "Stabanzahl oder -durchmesser für sichere Lastübertragung erhöhen."
} as ConcreteReinforcementStrings;

const ES: ConcreteReinforcementStrings = {
  "beamGeometry": "Geometría de Viga",
  "width": "Ancho (b)",
  "height": "Altura (h)",
  "cover": "Recubrimiento (c_nom)",
  "propertyMatrix": "Propiedades",
  "concreteFck": "Hormigón fck",
  "steelFyk": "Acero fyk",
  "designVector": "Vector de Diseño",
  "moment": "Momento (M_ed)",
  "barDiameter": "Diámetro Barra",
  "quantity": "Cantidad",
  "tensionRebar": "ARMADURA A TRACCIÓN",
  "percentRatio": "% RATIO",
  "doubleReinforced": "DOBLE ARMADO",
  "singleReinforced": "ARMADO SIMPLE",
  "ec2Compliant": "Conforme EC2",
  "reinforcementDeficit": "Déficit de Armadura",
  "profileSection": "Sección Estructural",
  "mainTension": "Armadura Principal",
  "shearLinks": "Estribos",
  "designCode": "Norma de Diseño",
  "steelStrain": "Deformación Acero",
  "yielded": "FLUENCIA",
  "civilKernel": "Núcleo Civil",
  "deficitMsg": "Armadura insuficiente: la viga no soporta {moment} kNm.",
  "deficitHint": "Aumente cantidad o diámetro de barras."
} as ConcreteReinforcementStrings;

const FR: ConcreteReinforcementStrings = {
  "beamGeometry": "Géométrie Poutre",
  "width": "Largeur (b)",
  "height": "Hauteur (h)",
  "cover": "Enrobage (c_nom)",
  "propertyMatrix": "Propriétés",
  "concreteFck": "Béton fck",
  "steelFyk": "Acier fyk",
  "designVector": "Vecteur Conception",
  "moment": "Moment (M_ed)",
  "barDiameter": "Diamètre Barre",
  "quantity": "Quantité",
  "tensionRebar": "ARMATURE TRACTION",
  "percentRatio": "% RATIO",
  "doubleReinforced": "DOUBLE ARMATURE",
  "singleReinforced": "ARMATURE SIMPLE",
  "ec2Compliant": "Conforme EC2",
  "reinforcementDeficit": "Déficit Armature",
  "profileSection": "Section Structurelle",
  "mainTension": "Armature Principale",
  "shearLinks": "Cadres",
  "designCode": "Code de Conception",
  "steelStrain": "Déformation Acier",
  "yielded": "PLASTICITÉ",
  "civilKernel": "Noyau Civil",
  "deficitMsg": "Armature insuffisante: la poutre ne supporte pas {moment} kNm.",
  "deficitHint": "Augmentez le nombre ou le diamètre des barres."
} as ConcreteReinforcementStrings;

const IT: ConcreteReinforcementStrings = {
  "beamGeometry": "Geometria Trave",
  "width": "Larghezza (b)",
  "height": "Altezza (h)",
  "cover": "Copriferro (c_nom)",
  "propertyMatrix": "Proprietà",
  "concreteFck": "Calcestruzzo fck",
  "steelFyk": "Acciaio fyk",
  "designVector": "Vettore Progetto",
  "moment": "Momento (M_ed)",
  "barDiameter": "Diametro Barra",
  "quantity": "Quantità",
  "tensionRebar": "ARMATURA TRAZIONE",
  "percentRatio": "% RAPPORTO",
  "doubleReinforced": "DOPPIA ARMATURA",
  "singleReinforced": "ARMATURA SINGOLA",
  "ec2Compliant": "Conforme EC2",
  "reinforcementDeficit": "Deficit Armatura",
  "profileSection": "Sezione Strutturale",
  "mainTension": "Armatura Principale",
  "shearLinks": "Staffe",
  "designCode": "Norma Progetto",
  "steelStrain": "Deformazione Acciaio",
  "yielded": "SNERVAMENTO",
  "civilKernel": "Kernel Civile",
  "deficitMsg": "Armatura insufficiente: la trave non regge {moment} kNm.",
  "deficitHint": "Aumentare numero o diametro barre."
} as ConcreteReinforcementStrings;

const PT: ConcreteReinforcementStrings = {
  "beamGeometry": "Geometria Viga",
  "width": "Largura (b)",
  "height": "Altura (h)",
  "cover": "Cobrimento (c_nom)",
  "propertyMatrix": "Propriedades",
  "concreteFck": "Betão fck",
  "steelFyk": "Aço fyk",
  "designVector": "Vetor de Projeto",
  "moment": "Momento (M_ed)",
  "barDiameter": "Diâmetro Barra",
  "quantity": "Quantidade",
  "tensionRebar": "ARMADURA TRAÇÃO",
  "percentRatio": "% RAZÃO",
  "doubleReinforced": "DUPLA ARMADURA",
  "singleReinforced": "ARMADURA SIMPLES",
  "ec2Compliant": "Conforme EC2",
  "reinforcementDeficit": "Déficit Armadura",
  "profileSection": "Secção Estrutural",
  "mainTension": "Armadura Principal",
  "shearLinks": "Estribos",
  "designCode": "Norma de Projeto",
  "steelStrain": "Deformação Aço",
  "yielded": "ESCORAMENTO",
  "civilKernel": "Kernel Civil",
  "deficitMsg": "Armadura insuficiente: viga não suporta {moment} kNm.",
  "deficitHint": "Aumente quantidade ou diâmetro das barras."
} as ConcreteReinforcementStrings;

const RU: ConcreteReinforcementStrings = {
  "beamGeometry": "Геометрия Балки",
  "width": "Ширина (b)",
  "height": "Высота (h)",
  "cover": "Защитный слой (c_nom)",
  "propertyMatrix": "Свойства",
  "concreteFck": "Бетон fck",
  "steelFyk": "Сталь fyk",
  "designVector": "Расчётный Вектор",
  "moment": "Момент (M_ed)",
  "barDiameter": "Диаметр Стержня",
  "quantity": "Количество",
  "tensionRebar": "РАСТЯГИВАЮЩАЯ АРМ.",
  "percentRatio": "% СООТН.",
  "doubleReinforced": "ДВОЙНОЕ АРМИР.",
  "singleReinforced": "ОДИНОЧНОЕ АРМИР.",
  "ec2Compliant": "Соответствует EC2",
  "reinforcementDeficit": "Недостаток Армирования",
  "profileSection": "Конструктивное Сечение",
  "mainTension": "Основная Арматура",
  "shearLinks": "Хомуты",
  "designCode": "Норма Проектирования",
  "steelStrain": "Деформация Стали",
  "yielded": "ТЕКУЧЕСТЬ",
  "civilKernel": "Строительное Ядро",
  "deficitMsg": "Армирования недостаточно: балка не выдерживает {moment} kNm.",
  "deficitHint": "Увеличьте количество или диаметр стержней."
} as ConcreteReinforcementStrings;

const JA: ConcreteReinforcementStrings = {
  "beamGeometry": "梁の寸法",
  "width": "幅 (b)",
  "height": "高さ (h)",
  "cover": "かぶり厚さ (c_nom)",
  "propertyMatrix": "材料強度",
  "concreteFck": "コンクリート fck",
  "steelFyk": "鉄筋 fyk",
  "designVector": "設計荷重",
  "moment": "設計モーメント (M_ed)",
  "barDiameter": "鉄筋径",
  "quantity": "本数",
  "tensionRebar": "引張鉄筋",
  "percentRatio": "% 比率",
  "doubleReinforced": "複筋",
  "singleReinforced": "単筋梁",
  "ec2Compliant": "EC2適合",
  "reinforcementDeficit": "鉄筋量不足",
  "profileSection": "構造断面図 (現場打ち)",
  "mainTension": "主筋",
  "shearLinks": "せん断補強筋",
  "designCode": "設計基準",
  "steelStrain": "鉄筋ひずみ",
  "yielded": "降伏",
  "civilKernel": "計算エンジン",
  "deficitMsg": "設計モーメント {moment} kNm に対する鉄筋の耐力が不足しています。",
  "deficitHint": "本数または鉄筋径を増やしてください。"
} as ConcreteReinforcementStrings;

const ZH: ConcreteReinforcementStrings = {
  "beamGeometry": "梁几何",
  "width": "宽度 (b)",
  "height": "高度 (h)",
  "cover": "保护层 (c_nom)",
  "propertyMatrix": "材料属性",
  "concreteFck": "混凝土 fck",
  "steelFyk": "钢筋 fyk",
  "designVector": "设计向量",
  "moment": "弯矩 (M_ed)",
  "barDiameter": "钢筋直径",
  "quantity": "数量",
  "tensionRebar": "受拉钢筋",
  "percentRatio": "% 比率",
  "doubleReinforced": "双筋",
  "singleReinforced": "单筋梁",
  "ec2Compliant": "符合 EC2",
  "reinforcementDeficit": "配筋不足",
  "profileSection": "现浇结构截面",
  "mainTension": "主筋",
  "shearLinks": "箍筋",
  "designCode": "设计规范",
  "steelStrain": "钢筋应变",
  "yielded": "屈服",
  "civilKernel": "土木内核",
  "deficitMsg": "配筋不足：梁无法承受 {moment} kNm 设计弯矩。",
  "deficitHint": "增加钢筋数量或直径以确保安全传力。"
} as ConcreteReinforcementStrings;

const KO: ConcreteReinforcementStrings = {
  "beamGeometry": "보 기하",
  "width": "폭 (b)",
  "height": "높이 (h)",
  "cover": "피복 (c_nom)",
  "propertyMatrix": "재료 특성",
  "concreteFck": "콘크리트 fck",
  "steelFyk": "철근 fyk",
  "designVector": "설계 벡터",
  "moment": "모멘트 (M_ed)",
  "barDiameter": "철근 직경",
  "quantity": "수량",
  "tensionRebar": "인장 철근",
  "percentRatio": "% 비율",
  "doubleReinforced": "복근",
  "singleReinforced": "단근 보",
  "ec2Compliant": "EC2 준수",
  "reinforcementDeficit": "철근 부족",
  "profileSection": "현장 타설 구조 단면",
  "mainTension": "주철근",
  "shearLinks": "늑근",
  "designCode": "설계 기준",
  "steelStrain": "철근 변형률",
  "yielded": "항복",
  "civilKernel": "토목 커널",
  "deficitMsg": "철근 부족: 보가 {moment} kNm 설계 모멘트를 견디지 못합니다.",
  "deficitHint": "안전한 하중 전달을 위해 철근 수량 또는 직경을 늘리세요."
} as ConcreteReinforcementStrings;

const AR: ConcreteReinforcementStrings = {
  "beamGeometry": "هندسة العتبة",
  "width": "العرض (b)",
  "height": "الارتفاع (h)",
  "cover": "الغطاء (c_nom)",
  "propertyMatrix": "خصائص المواد",
  "concreteFck": "خرسانة fck",
  "steelFyk": "فولاذ fyk",
  "designVector": "متجه التصميم",
  "moment": "العزم (M_ed)",
  "barDiameter": "قطر القضيب",
  "quantity": "الكمية",
  "tensionRebar": "حديد الشد",
  "percentRatio": "% النسبة",
  "doubleReinforced": "تسليح مزدوج",
  "singleReinforced": "تسليح مفرد",
  "ec2Compliant": "متوافق مع EC2",
  "reinforcementDeficit": "عجز التسليح",
  "profileSection": "مقطع إنشائي مصبوب",
  "mainTension": "التسليح الرئيسي",
  "shearLinks": "كانات القص",
  "designCode": "كود التصميم",
  "steelStrain": "انفعال الفولاذ",
  "yielded": "خضوع",
  "civilKernel": "نواة مدنية",
  "deficitMsg": "التسليح غير كافٍ: العتبة لا تحمل {moment} kNm.",
  "deficitHint": "زد عدد أو قطر القضبان لنقل آمن للحمل."
} as ConcreteReinforcementStrings;

const BY_LOCALE: Record<Language, ConcreteReinforcementStrings> = {
  en: EN, tr: TR, de: DE, es: ES, fr: FR, it: IT, pt: PT, ru: RU, ja: JA, zh: ZH, ko: KO, ar: AR,
};

export function getConcreteReinforcementStrings(locale: string): ConcreteReinforcementStrings {
  return BY_LOCALE[locale as Language] ?? EN;
}

export function formatConcreteDeficitMsg(s: ConcreteReinforcementStrings, moment: number): string {
  return s.deficitMsg.replace('{moment}', String(moment));
}
