import type { Language } from '@/store/i18nStore';

export type NewsFeedItem = {
  id: number;
  title: string;
  source: string;
  date: string;
  category: 'Standards' | 'Materials' | 'Manufacturing' | 'Automotive' | 'Sustainability' | 'Regulations' | 'Software';
};

type NewsLocale = {
  items: Omit<NewsFeedItem, 'id' | 'date'>[];
};

const DATES = ['2026-02-05', '2026-02-04', '2026-02-03', '2026-02-02', '2026-02-01', '2026-01-30', '2026-01-28', '2026-01-25'];

const EN: NewsLocale = {
  items: [
    { title: 'New ISO Standards for Aluminum Alloy Specifications Released', source: 'ISO Updates', category: 'Standards' },
    { title: 'Breakthrough in Lightweight Composite Materials for Aerospace', source: 'Materials Today', category: 'Materials' },
    { title: 'CNC Machining Accuracy Reaches New Precision Levels', source: 'Manufacturing Weekly', category: 'Manufacturing' },
    { title: 'Electric Vehicle Battery Technology Advances', source: 'Tech News', category: 'Automotive' },
    { title: 'Sustainable Steel Production Methods Gain Traction', source: 'Green Engineering', category: 'Sustainability' },
    { title: '3D Metal Printing Cost Reduced by 40%', source: 'Additive Manufacturing', category: 'Manufacturing' },
    { title: 'EU Releases New Machinery Directive Guidelines', source: 'EU Commission', category: 'Regulations' },
    { title: 'AI Integration in CAD/CAM Software Accelerates', source: 'Design World', category: 'Software' },
  ],
};

const TR: NewsLocale = {
  items: [
    { title: 'Alüminyum Alaşım Spesifikasyonları için Yeni ISO Standartları Yayınlandı', source: 'ISO Güncellemeleri', category: 'Standards' },
    { title: 'Havacılıkta Hafif Kompozit Malzemelerde Çığır Açan Gelişme', source: 'Malzeme Gündemi', category: 'Materials' },
    { title: 'CNC İşleme Hassasiyeti Yeni Seviyelere Ulaştı', source: 'İmalat Haftalığı', category: 'Manufacturing' },
    { title: 'Elektrikli Araç Batarya Teknolojisinde İlerleme', source: 'Teknoloji Haberleri', category: 'Automotive' },
    { title: 'Sürdürülebilir Çelik Üretim Yöntemleri Yaygınlaşıyor', source: 'Yeşil Mühendislik', category: 'Sustainability' },
    { title: '3D Metal Baskı Maliyeti %40 Azaldı', source: 'Katmanlı İmalat', category: 'Manufacturing' },
    { title: 'AB Yeni Makine Direktifi Kılavuzunu Yayınladı', source: 'AB Komisyonu', category: 'Regulations' },
    { title: 'CAD/CAM Yazılımlarında Yapay Zeka Entegrasyonu Hızlanıyor', source: 'Tasarım Dünyası', category: 'Software' },
  ],
};

const DE: NewsLocale = {
  items: [
    { title: 'Neue ISO-Normen für Aluminiumlegierungen veröffentlicht', source: 'ISO Updates', category: 'Standards' },
    { title: 'Durchbruch bei leichten Verbundwerkstoffen für die Luftfahrt', source: 'Materials Today', category: 'Materials' },
    { title: 'CNC-Bearbeitungsgenauigkeit erreicht neue Präzisionsstufen', source: 'Manufacturing Weekly', category: 'Manufacturing' },
    { title: 'Fortschritte bei Elektrofahrzeug-Batterietechnologie', source: 'Tech News', category: 'Automotive' },
    { title: 'Nachhaltige Stahlproduktion gewinnt an Bedeutung', source: 'Green Engineering', category: 'Sustainability' },
    { title: 'Kosten des 3D-Metalldrucks um 40 % gesenkt', source: 'Additive Manufacturing', category: 'Manufacturing' },
    { title: 'EU veröffentlicht neue Maschinenrichtlinie', source: 'EU-Kommission', category: 'Regulations' },
    { title: 'KI-Integration in CAD/CAM-Software beschleunigt sich', source: 'Design World', category: 'Software' },
  ],
};

const ES: NewsLocale = {
  items: [
    { title: 'Nuevas normas ISO para especificaciones de aleaciones de aluminio', source: 'Actualizaciones ISO', category: 'Standards' },
    { title: 'Avance en materiales compuestos ligeros para aeroespacial', source: 'Materials Today', category: 'Materials' },
    { title: 'La precisión del mecanizado CNC alcanza nuevos niveles', source: 'Manufacturing Weekly', category: 'Manufacturing' },
    { title: 'Avances en tecnología de baterías para vehículos eléctricos', source: 'Tech News', category: 'Automotive' },
    { title: 'Métodos sostenibles de producción de acero ganan terreno', source: 'Green Engineering', category: 'Sustainability' },
    { title: 'El coste de impresión 3D metal se reduce un 40 %', source: 'Additive Manufacturing', category: 'Manufacturing' },
    { title: 'La UE publica nuevas directrices de maquinaria', source: 'Comisión UE', category: 'Regulations' },
    { title: 'La integración de IA en software CAD/CAM se acelera', source: 'Design World', category: 'Software' },
  ],
};

const FR: NewsLocale = {
  items: [
    { title: 'Nouvelles normes ISO pour les alliages d\'aluminium', source: 'Mises à jour ISO', category: 'Standards' },
    { title: 'Percée dans les composites légers pour l\'aérospatiale', source: 'Materials Today', category: 'Materials' },
    { title: 'La précision d\'usinage CNC atteint de nouveaux niveaux', source: 'Manufacturing Weekly', category: 'Manufacturing' },
    { title: 'Progrès de la technologie des batteries pour véhicules électriques', source: 'Tech News', category: 'Automotive' },
    { title: 'Les méthodes durables de production d\'acier se développent', source: 'Green Engineering', category: 'Sustainability' },
    { title: 'Coût de l\'impression 3D métal réduit de 40 %', source: 'Additive Manufacturing', category: 'Manufacturing' },
    { title: 'L\'UE publie de nouvelles directives machines', source: 'Commission UE', category: 'Regulations' },
    { title: 'L\'intégration de l\'IA dans les logiciels CAD/CAM s\'accélère', source: 'Design World', category: 'Software' },
  ],
};

const IT: NewsLocale = {
  items: [
    { title: 'Nuove norme ISO per le leghe di alluminio', source: 'Aggiornamenti ISO', category: 'Standards' },
    { title: 'Svolta nei compositi leggeri per l\'aerospaziale', source: 'Materials Today', category: 'Materials' },
    { title: 'La precisione CNC raggiunge nuovi livelli', source: 'Manufacturing Weekly', category: 'Manufacturing' },
    { title: 'Progressi nella tecnologia delle batterie per veicoli elettrici', source: 'Tech News', category: 'Automotive' },
    { title: 'Metodi sostenibili di produzione dell\'acciaio in crescita', source: 'Green Engineering', category: 'Sustainability' },
    { title: 'Costo della stampa 3D metallo ridotto del 40 %', source: 'Additive Manufacturing', category: 'Manufacturing' },
    { title: 'UE pubblica nuove linee guida sulle macchine', source: 'Commissione UE', category: 'Regulations' },
    { title: 'Integrazione IA nei software CAD/CAM in accelerazione', source: 'Design World', category: 'Software' },
  ],
};

const PT: NewsLocale = {
  items: [
    { title: 'Novas normas ISO para ligas de alumínio publicadas', source: 'Atualizações ISO', category: 'Standards' },
    { title: 'Avanço em compósitos leves para aeroespacial', source: 'Materials Today', category: 'Materials' },
    { title: 'Precisão de usinagem CNC atinge novos níveis', source: 'Manufacturing Weekly', category: 'Manufacturing' },
    { title: 'Avanços na tecnologia de baterias para veículos elétricos', source: 'Tech News', category: 'Automotive' },
    { title: 'Métodos sustentáveis de produção de aço ganham tração', source: 'Green Engineering', category: 'Sustainability' },
    { title: 'Custo de impressão 3D metal reduzido em 40 %', source: 'Additive Manufacturing', category: 'Manufacturing' },
    { title: 'UE publica novas diretrizes de máquinas', source: 'Comissão UE', category: 'Regulations' },
    { title: 'Integração de IA em software CAD/CAM acelera', source: 'Design World', category: 'Software' },
  ],
};

const RU: NewsLocale = {
  items: [
    { title: 'Опубликованы новые стандарты ISO для алюминиевых сплавов', source: 'Обновления ISO', category: 'Standards' },
    { title: 'Прорыв в лёгких композитах для аэрокосмоса', source: 'Materials Today', category: 'Materials' },
    { title: 'Точность ЧПУ-обработки достигла нового уровня', source: 'Manufacturing Weekly', category: 'Manufacturing' },
    { title: 'Прогресс в технологии батарей для электромобилей', source: 'Tech News', category: 'Automotive' },
    { title: 'Устойчивые методы производства стали набирают обороты', source: 'Green Engineering', category: 'Sustainability' },
    { title: 'Стоимость 3D-печати металлом снижена на 40 %', source: 'Additive Manufacturing', category: 'Manufacturing' },
    { title: 'ЕС опубликовал новые директивы по машинам', source: 'Комиссия ЕС', category: 'Regulations' },
    { title: 'Интеграция ИИ в CAD/CAM ускоряется', source: 'Design World', category: 'Software' },
  ],
};

const JA: NewsLocale = {
  items: [
    { title: 'アルミ合金仕様の新ISO規格が発表', source: 'ISOアップデート', category: 'Standards' },
    { title: '航空宇宙向け軽量複合材料で画期的進展', source: 'Materials Today', category: 'Materials' },
    { title: 'CNC加工精度が新たなレベルに到達', source: 'Manufacturing Weekly', category: 'Manufacturing' },
    { title: 'EVバッテリー技術が進展', source: 'Tech News', category: 'Automotive' },
    { title: '持続可能な鉄鋼生産方式が普及', source: 'Green Engineering', category: 'Sustainability' },
    { title: '金属3Dプリントコストが40%削減', source: 'Additive Manufacturing', category: 'Manufacturing' },
    { title: 'EUが新機械指令ガイドラインを発表', source: 'EU委員会', category: 'Regulations' },
    { title: 'CAD/CAMソフトへのAI統合が加速', source: 'Design World', category: 'Software' },
  ],
};

const ZH: NewsLocale = {
  items: [
    { title: '铝合金规格新 ISO 标准发布', source: 'ISO 动态', category: 'Standards' },
    { title: '航空航天轻质复合材料取得突破', source: '材料前沿', category: 'Materials' },
    { title: 'CNC 加工精度达到新水平', source: '制造周刊', category: 'Manufacturing' },
    { title: '电动汽车电池技术取得进展', source: '科技新闻', category: 'Automotive' },
    { title: '可持续炼钢方法受到关注', source: '绿色工程', category: 'Sustainability' },
    { title: '金属 3D 打印成本降低 40%', source: '增材制造', category: 'Manufacturing' },
    { title: '欧盟发布新机械指令指南', source: '欧盟委员会', category: 'Regulations' },
    { title: 'CAD/CAM 软件 AI 集成加速', source: '设计世界', category: 'Software' },
  ],
};

const KO: NewsLocale = {
  items: [
    { title: '알루미늄 합금 규격 신규 ISO 표준 발표', source: 'ISO 업데이트', category: 'Standards' },
    { title: '항공우주용 경량 복합재 혁신적 진전', source: 'Materials Today', category: 'Materials' },
    { title: 'CNC 가공 정밀도 새 수준 달성', source: 'Manufacturing Weekly', category: 'Manufacturing' },
    { title: '전기차 배터리 기술 발전', source: 'Tech News', category: 'Automotive' },
    { title: '지속 가능한 철강 생산 방식 확산', source: 'Green Engineering', category: 'Sustainability' },
    { title: '금속 3D 프린팅 비용 40% 절감', source: 'Additive Manufacturing', category: 'Manufacturing' },
    { title: 'EU, 새 기계 지침 가이드라인 발표', source: 'EU 집행위원회', category: 'Regulations' },
    { title: 'CAD/CAM 소프트웨어 AI 통합 가속', source: 'Design World', category: 'Software' },
  ],
};

const AR: NewsLocale = {
  items: [
    { title: 'إصدار معايير ISO جديدة لسبائك الألومنيوم', source: 'تحديثات ISO', category: 'Standards' },
    { title: 'اختراق في المواد المركبة الخفيفة للطيران', source: 'Materials Today', category: 'Materials' },
    { title: 'دقة التشغيل CNC تصل إلى مستويات جديدة', source: 'Manufacturing Weekly', category: 'Manufacturing' },
    { title: 'تقدم في تقنية بطاريات المركبات الكهربائية', source: 'Tech News', category: 'Automotive' },
    { title: 'طرق إنتاج الصلب المستدامة تتوسع', source: 'Green Engineering', category: 'Sustainability' },
    { title: 'انخفاض تكلفة الطباعة ثلاثية الأبعاد للمعادن بنسبة 40%', source: 'Additive Manufacturing', category: 'Manufacturing' },
    { title: 'الاتحاد الأوروبي يصدر إرشادات جديدة للآلات', source: 'مفوضية الاتحاد الأوروبي', category: 'Regulations' },
    { title: 'تسارع دمج الذكاء الاصطناعي في برامج CAD/CAM', source: 'Design World', category: 'Software' },
  ],
};

const LOCALE_MAP: Record<Language, NewsLocale> = {
  en: EN, tr: TR, de: DE, es: ES, fr: FR, it: IT, pt: PT, ru: RU, ja: JA, zh: ZH, ko: KO, ar: AR,
};

export function getNewsFeedCatalog(locale: string): NewsFeedItem[] {
  const loc = LOCALE_MAP[locale as Language] ?? EN;
  return loc.items.map((item, i) => ({
    id: i + 1,
    ...item,
    date: DATES[i] ?? DATES[0],
  }));
}
