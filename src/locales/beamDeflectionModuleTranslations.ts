import type { Language } from '@/store/i18nStore';

export type BeamDeflectionModuleStrings = {
  kinematicSetup: string;
  simplySupported: string;
  cantilever: string;
  appliedLoad: string;
  integrityNormal: string;
  limitExceeded: string;
  allowableLimit: string;
  liveDeformation: string;
  criticalWarning: string;
  criticalWarningDesc: string;
};

const EN: BeamDeflectionModuleStrings = {
  "kinematicSetup": "Kinematic Setup",
  "simplySupported": "Simply Supported",
  "cantilever": "Cantilevered",
  "appliedLoad": "Applied Load (F)",
  "integrityNormal": "INTEGRITY: NORMAL",
  "limitExceeded": "WARNING: LIMIT EXCEEDED",
  "allowableLimit": "Allowable Limit (L/300)",
  "liveDeformation": "LIVE DEFORMATION KINEMATICS",
  "criticalWarning": "Critical Structural Warning",
  "criticalWarningDesc": "Deflection exceeds the structural limit. Consider increasing beam inertia ({inertia} → {suggested}) or utilizing a higher modulus material."
} as BeamDeflectionModuleStrings;

const TR: BeamDeflectionModuleStrings = {
  "kinematicSetup": "Sınır Koşulları",
  "simplySupported": "Basit Mesnet",
  "cantilever": "Konsol",
  "appliedLoad": "Uygulanan Yük (F)",
  "integrityNormal": "YAPISAL GÜVENLİK: NORMAL",
  "limitExceeded": "UYARI: SEHİM LİMİTİ AŞILDI",
  "allowableLimit": "İzin Verilen Limit (L/300)",
  "liveDeformation": "ANLIK DEFORMASYON KİNEMATİĞİ",
  "criticalWarning": "Kritik Yapısal Sehim Uyarısı",
  "criticalWarningDesc": "Sehim miktarı izin verilen limiti aşıyor. Kiriş atalet momentini artırmayı ({inertia} → {suggested}) veya daha rijit bir malzeme seçmeyi düşünün."
} as BeamDeflectionModuleStrings;

const DE: BeamDeflectionModuleStrings = {
  "kinematicSetup": "Randbedingungen",
  "simplySupported": "Einfach Gelagert",
  "cantilever": "Kragträger",
  "appliedLoad": "Aufgebrachte Last (F)",
  "integrityNormal": "INTEGRITÄT: NORMAL",
  "limitExceeded": "WARNUNG: GRENZWERT ÜBERSCHRITTEN",
  "allowableLimit": "Zulässige Grenze (L/300)",
  "liveDeformation": "LIVE-VERFORMUNGSKINEMATIK",
  "criticalWarning": "Kritische Strukturwarnung",
  "criticalWarningDesc": "Durchbiegung überschreitet die Grenze. Erwägen Sie eine Erhöhung des Trägheitsmoments ({inertia} → {suggested}) oder ein steiferes Material."
} as BeamDeflectionModuleStrings;

const ES: BeamDeflectionModuleStrings = {
  "kinematicSetup": "Configuración Cinemática",
  "simplySupported": "Simplemente Apoyada",
  "cantilever": "Voladizo",
  "appliedLoad": "Carga Aplicada (F)",
  "integrityNormal": "INTEGRIDAD: NORMAL",
  "limitExceeded": "ADVERTENCIA: LÍMITE EXCEDIDO",
  "allowableLimit": "Límite Permisible (L/300)",
  "liveDeformation": "CINEMÁTICA DE DEFORMACIÓN EN VIVO",
  "criticalWarning": "Advertencia Estructural Crítica",
  "criticalWarningDesc": "La deflexión excede el límite. Considere aumentar la inercia ({inertia} → {suggested}) o un material más rígido."
} as BeamDeflectionModuleStrings;

const FR: BeamDeflectionModuleStrings = {
  "kinematicSetup": "Configuration Cinématique",
  "simplySupported": "Simplement Appuyée",
  "cantilever": "Console",
  "appliedLoad": "Charge Appliquée (F)",
  "integrityNormal": "INTÉGRITÉ: NORMALE",
  "limitExceeded": "AVERTISSEMENT: LIMITE DÉPASSÉE",
  "allowableLimit": "Limite Admissible (L/300)",
  "liveDeformation": "CINÉMATIQUE DE DÉFORMATION EN DIRECT",
  "criticalWarning": "Avertissement Structurel Critique",
  "criticalWarningDesc": "La flèche dépasse la limite. Envisagez d'augmenter l'inertie ({inertia} → {suggested}) ou un matériau plus rigide."
} as BeamDeflectionModuleStrings;

const IT: BeamDeflectionModuleStrings = {
  "kinematicSetup": "Configurazione Cinematica",
  "simplySupported": "Semplicemente Appoggiata",
  "cantilever": "Console",
  "appliedLoad": "Carico Applicato (F)",
  "integrityNormal": "INTEGRITÀ: NORMALE",
  "limitExceeded": "AVVISO: LIMITE SUPERATO",
  "allowableLimit": "Limite Ammissibile (L/300)",
  "liveDeformation": "CINEMATICA DEFORMAZIONE LIVE",
  "criticalWarning": "Avviso Strutturale Critico",
  "criticalWarningDesc": "La freccia supera il limite. Considerare di aumentare l'inerzia ({inertia} → {suggested}) o un materiale più rigido."
} as BeamDeflectionModuleStrings;

const PT: BeamDeflectionModuleStrings = {
  "kinematicSetup": "Configuração Cinemática",
  "simplySupported": "Simplesmente Apoiada",
  "cantilever": "Consola",
  "appliedLoad": "Carga Aplicada (F)",
  "integrityNormal": "INTEGRIDADE: NORMAL",
  "limitExceeded": "AVISO: LIMITE EXCEDIDO",
  "allowableLimit": "Limite Permitido (L/300)",
  "liveDeformation": "CINEMÁTICA DE DEFORMAÇÃO AO VIVO",
  "criticalWarning": "Aviso Estrutural Crítico",
  "criticalWarningDesc": "A deflexão excede o limite. Considere aumentar a inércia ({inertia} → {suggested}) ou um material mais rígido."
} as BeamDeflectionModuleStrings;

const RU: BeamDeflectionModuleStrings = {
  "kinematicSetup": "Кинематическая Настройка",
  "simplySupported": "Шарнирно Опёртая",
  "cantilever": "Консоль",
  "appliedLoad": "Прикладная Нагрузка (F)",
  "integrityNormal": "ЦЕЛОСТНОСТЬ: НОРМА",
  "limitExceeded": "ПРЕДУПРЕЖДЕНИЕ: ПРЕДЕЛ ПРЕВЫШЕН",
  "allowableLimit": "Допустимый Предел (L/300)",
  "liveDeformation": "КИНЕМАТИКА ДЕФОРМАЦИИ LIVE",
  "criticalWarning": "Критическое Структурное Предупреждение",
  "criticalWarningDesc": "Прогиб превышает предел. Рассмотрите увеличение инерции ({inertia} → {suggested}) или более жёсткий материал."
} as BeamDeflectionModuleStrings;

const JA: BeamDeflectionModuleStrings = {
  "kinematicSetup": "境界条件",
  "simplySupported": "単純支持梁",
  "cantilever": "片持ち梁",
  "appliedLoad": "集中荷重 (F)",
  "integrityNormal": "構造健全性: 正常",
  "limitExceeded": "警告: たわみ制限超過",
  "allowableLimit": "許容たわみ量 (L/300)",
  "liveDeformation": "変形解析シミュレーション",
  "criticalWarning": "構造上の危険警告",
  "criticalWarningDesc": "たわみ量が許容限界を超えています。断面二次モーメントを増やすか（{inertia} → {suggested}）、高剛性の材料をご検討ください。"
} as BeamDeflectionModuleStrings;

const ZH: BeamDeflectionModuleStrings = {
  "kinematicSetup": "运动学设置",
  "simplySupported": "简支梁",
  "cantilever": "悬臂梁",
  "appliedLoad": "施加载荷 (F)",
  "integrityNormal": "结构完整性: 正常",
  "limitExceeded": "警告: 挠度超限",
  "allowableLimit": "允许限值 (L/300)",
  "liveDeformation": "实时变形运动学",
  "criticalWarning": "严重结构警告",
  "criticalWarningDesc": "挠度超过结构限值。考虑增加惯性矩（{inertia} → {suggested}）或使用更高模量材料。"
} as BeamDeflectionModuleStrings;

const KO: BeamDeflectionModuleStrings = {
  "kinematicSetup": "운동학 설정",
  "simplySupported": "단순 지지",
  "cantilever": "캔틸레버",
  "appliedLoad": "적용 하중 (F)",
  "integrityNormal": "구조 무결성: 정상",
  "limitExceeded": "경고: 한계 초과",
  "allowableLimit": "허용 한계 (L/300)",
  "liveDeformation": "실시간 변형 운동학",
  "criticalWarning": "심각한 구조 경고",
  "criticalWarningDesc": "처짐이 구조 한계를 초과했습니다. 관성 모멘트 증가({inertia} → {suggested}) 또는 더 높은 탄성계수 재료를 고려하세요."
} as BeamDeflectionModuleStrings;

const AR: BeamDeflectionModuleStrings = {
  "kinematicSetup": "الإعداد الحركي",
  "simplySupported": "مدعوم ببساطة",
  "cantilever": "كابولي",
  "appliedLoad": "الحمل المطبق (F)",
  "integrityNormal": "السلامة: طبيعي",
  "limitExceeded": "تحذير: تجاوز الحد",
  "allowableLimit": "الحد المسموح (L/300)",
  "liveDeformation": "حركة التشوه المباشرة",
  "criticalWarning": "تحذير إنشائي حرج",
  "criticalWarningDesc": "الانحراف يتجاوز الحد. فكر في زيادة عزم القصور ({inertia} → {suggested}) أو مادة أكثر صلابة."
} as BeamDeflectionModuleStrings;

const BY_LOCALE: Record<Language, BeamDeflectionModuleStrings> = {
  en: EN, tr: TR, de: DE, es: ES, fr: FR, it: IT, pt: PT, ru: RU, ja: JA, zh: ZH, ko: KO, ar: AR,
};

export function getBeamDeflectionModuleStrings(locale: string): BeamDeflectionModuleStrings {
  return BY_LOCALE[locale as Language] ?? EN;
}

export function formatBeamCriticalWarning(s: BeamDeflectionModuleStrings, inertia: number, suggested: number): string {
  return s.criticalWarningDesc.replace('{inertia}', String(inertia)).replace('{suggested}', String(suggested));
}
