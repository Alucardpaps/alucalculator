import type { Language } from '@/store/i18nStore';

export type ReducerModuleStrings = {
  thermalCharacteristic: string;
  thermalLimit: string;
  oilInterval: string;
  hr: string;
  coolingConfig: string;
  forcedFan: string;
  naturalConv: string;
  lubeStandard: string;
  mineralOil: string;
  syntheticOil: string;
  transmissionAnalytics: string;
  outputTorque: string;
  estimatedTemp: string;
  lubricantVolume: string;
  liters: string;
  isoMaintenance: string;
  maintenanceRec: string;
  thermalSaturation: string;
};

const EN: ReducerModuleStrings = {
  "thermalCharacteristic": "THERMAL CHARACTERISTIC",
  "thermalLimit": "Thermal Limit",
  "oilInterval": "Oil Interval",
  "hr": "Hr",
  "coolingConfig": "Cooling Config",
  "forcedFan": "Forced Fan Conv.",
  "naturalConv": "Natural Conv.",
  "lubeStandard": "Lube Standard",
  "mineralOil": "Mineral Base (CLP)",
  "syntheticOil": "Synthetic PAO",
  "transmissionAnalytics": "Transmission Analytics",
  "outputTorque": "Output Torque T2",
  "estimatedTemp": "Estimated Operating Temp",
  "lubricantVolume": "Lubricant Volume",
  "liters": "Liters",
  "isoMaintenance": "ISO Maintenance Recommendation",
  "maintenanceRec": "Based on {oil} operating at {temp}°C, oil degradation accelerates. Schedule the next flushing session in {hours} hours.",
  "thermalSaturation": "Thermal saturation reached. Extra cooling required."
} as ReducerModuleStrings;

const TR: ReducerModuleStrings = {
  "thermalCharacteristic": "TERMAL KARAKTERİSTİK",
  "thermalLimit": "Termal Sınır",
  "oilInterval": "Yağ Ömrü",
  "hr": "Sa",
  "coolingConfig": "Soğutma Yapılandırması",
  "forcedFan": "Fanlı Soğutma (Cebri)",
  "naturalConv": "Doğal Konveksiyon",
  "lubeStandard": "Yağ Tipi",
  "mineralOil": "Mineral Esaslı (CLP)",
  "syntheticOil": "Sentetik PAO",
  "transmissionAnalytics": "Şanzıman Analizi",
  "outputTorque": "Çıkış Torku T2",
  "estimatedTemp": "Tahmini Çalışma Sıcaklığı",
  "lubricantVolume": "Yağ Hacmi",
  "liters": "Litre",
  "isoMaintenance": "ISO Bakım Tavsiyesi",
  "maintenanceRec": "{oil} yağın {temp}°C sıcaklıkta çalışması sebebiyle yağ bozunması hızlanmaktadır. Bir sonraki yağ değişimini/temizliğini {hours} saat sonra yapılması planlanmalıdır.",
  "thermalSaturation": "Termal doygunluğa ulaşıldı. Ek soğutma gerekiyor."
} as ReducerModuleStrings;

const DE: ReducerModuleStrings = {
  "thermalCharacteristic": "THERMISCHE KENNLINIE",
  "thermalLimit": "Thermische Grenze",
  "oilInterval": "Ölwechselintervall",
  "hr": "Std",
  "coolingConfig": "Kühlkonfiguration",
  "forcedFan": "Zwangsbelüftung",
  "naturalConv": "Natürliche Konvektion",
  "lubeStandard": "Schmierstoff",
  "mineralOil": "Mineralöl (CLP)",
  "syntheticOil": "Synthetisches PAO",
  "transmissionAnalytics": "Getriebeanalyse",
  "outputTorque": "Abtriebsdrehmoment T2",
  "estimatedTemp": "Geschätzte Betriebstemp.",
  "lubricantVolume": "Ölmenge",
  "liters": "Liter",
  "isoMaintenance": "ISO-Wartungsempfehlung",
  "maintenanceRec": "Bei {oil} bei {temp}°C beschleunigt sich die Ölalterung. Nächsten Ölwechsel in {hours} Stunden planen.",
  "thermalSaturation": "Thermische Sättigung erreicht. Zusätzliche Kühlung erforderlich."
} as ReducerModuleStrings;

const ES: ReducerModuleStrings = {
  "thermalCharacteristic": "CARACTERÍSTICA TÉRMICA",
  "thermalLimit": "Límite Térmico",
  "oilInterval": "Intervalo de Aceite",
  "hr": "h",
  "coolingConfig": "Config. de Refrigeración",
  "forcedFan": "Ventilador Forzado",
  "naturalConv": "Convección Natural",
  "lubeStandard": "Lubricante",
  "mineralOil": "Base Mineral (CLP)",
  "syntheticOil": "PAO Sintético",
  "transmissionAnalytics": "Análisis de Transmisión",
  "outputTorque": "Par de Salida T2",
  "estimatedTemp": "Temp. de Operación Est.",
  "lubricantVolume": "Volumen de Lubricante",
  "liters": "Litros",
  "isoMaintenance": "Recomendación ISO de Mantenimiento",
  "maintenanceRec": "Con {oil} operando a {temp}°C, la degradación del aceite se acelera. Programar el próximo cambio en {hours} horas.",
  "thermalSaturation": "Saturación térmica alcanzada. Se requiere refrigeración adicional."
} as ReducerModuleStrings;

const FR: ReducerModuleStrings = {
  "thermalCharacteristic": "CARACTÉRISTIQUE THERMIQUE",
  "thermalLimit": "Limite Thermique",
  "oilInterval": "Intervalle Huile",
  "hr": "h",
  "coolingConfig": "Config. Refroidissement",
  "forcedFan": "Ventilation Forcée",
  "naturalConv": "Convection Naturelle",
  "lubeStandard": "Lubrifiant",
  "mineralOil": "Base Minérale (CLP)",
  "syntheticOil": "PAO Synthétique",
  "transmissionAnalytics": "Analyse Transmission",
  "outputTorque": "Couple Sortie T2",
  "estimatedTemp": "Temp. de Fonctionnement Est.",
  "lubricantVolume": "Volume Lubrifiant",
  "liters": "Litres",
  "isoMaintenance": "Recommandation Maintenance ISO",
  "maintenanceRec": "Avec {oil} à {temp}°C, la dégradation de l'huile s'accélère. Planifier le prochain changement dans {hours} heures.",
  "thermalSaturation": "Saturation thermique atteinte. Refroidissement supplémentaire requis."
} as ReducerModuleStrings;

const IT: ReducerModuleStrings = {
  "thermalCharacteristic": "CARATTERISTICA TERMICA",
  "thermalLimit": "Limite Termico",
  "oilInterval": "Intervallo Olio",
  "hr": "ore",
  "coolingConfig": "Config. Raffreddamento",
  "forcedFan": "Ventola Forzata",
  "naturalConv": "Convezione Naturale",
  "lubeStandard": "Lubrificante",
  "mineralOil": "Base Minerale (CLP)",
  "syntheticOil": "PAO Sintetico",
  "transmissionAnalytics": "Analisi Trasmissione",
  "outputTorque": "Coppia Uscita T2",
  "estimatedTemp": "Temp. Operativa Stimata",
  "lubricantVolume": "Volume Lubrificante",
  "liters": "Litri",
  "isoMaintenance": "Raccomandazione Manutenzione ISO",
  "maintenanceRec": "Con {oil} a {temp}°C, il degrado dell'olio accelera. Pianificare il prossimo cambio tra {hours} ore.",
  "thermalSaturation": "Saturazione termica raggiunta. Raffreddamento aggiuntivo necessario."
} as ReducerModuleStrings;

const PT: ReducerModuleStrings = {
  "thermalCharacteristic": "CARACTERÍSTICA TÉRMICA",
  "thermalLimit": "Limite Térmico",
  "oilInterval": "Intervalo de Óleo",
  "hr": "h",
  "coolingConfig": "Config. de Resfriamento",
  "forcedFan": "Ventilação Forçada",
  "naturalConv": "Convecção Natural",
  "lubeStandard": "Lubrificante",
  "mineralOil": "Base Mineral (CLP)",
  "syntheticOil": "PAO Sintético",
  "transmissionAnalytics": "Análise de Transmissão",
  "outputTorque": "Torque de Saída T2",
  "estimatedTemp": "Temp. de Operação Est.",
  "lubricantVolume": "Volume de Lubrificante",
  "liters": "Litros",
  "isoMaintenance": "Recomendação de Manutenção ISO",
  "maintenanceRec": "Com {oil} operando a {temp}°C, a degradação do óleo acelera. Agendar próxima troca em {hours} horas.",
  "thermalSaturation": "Saturação térmica atingida. Resfriamento extra necessário."
} as ReducerModuleStrings;

const RU: ReducerModuleStrings = {
  "thermalCharacteristic": "ТЕПЛОВАЯ ХАРАКТЕРИСТИКА",
  "thermalLimit": "Тепловой предел",
  "oilInterval": "Интервал замены масла",
  "hr": "ч",
  "coolingConfig": "Конфигурация охлаждения",
  "forcedFan": "Принудительное охлаждение",
  "naturalConv": "Естественная конвекция",
  "lubeStandard": "Смазочный материал",
  "mineralOil": "Минеральное (CLP)",
  "syntheticOil": "Синтетическое PAO",
  "transmissionAnalytics": "Анализ редуктора",
  "outputTorque": "Выходной момент T2",
  "estimatedTemp": "Расчётная рабочая темп.",
  "lubricantVolume": "Объём смазки",
  "liters": "Литры",
  "isoMaintenance": "Рекомендация ISO по ТО",
  "maintenanceRec": "При работе {oil} при {temp}°C деградация масла ускоряется. Запланируйте замену через {hours} часов.",
  "thermalSaturation": "Достигнуто тепловое насыщение. Требуется дополнительное охлаждение."
} as ReducerModuleStrings;

const JA: ReducerModuleStrings = {
  "thermalCharacteristic": "熱特性",
  "thermalLimit": "熱限界",
  "oilInterval": "給油間隔",
  "hr": "時間",
  "coolingConfig": "冷却設定",
  "forcedFan": "強制ファン対流",
  "naturalConv": "自然対流",
  "lubeStandard": "潤滑油規格",
  "mineralOil": "鉱物油 (CLP)",
  "syntheticOil": "合成油 PAO",
  "transmissionAnalytics": "減速機熱解析",
  "outputTorque": "出力トルク T2",
  "estimatedTemp": "運転温度 (推定)",
  "lubricantVolume": "潤滑油量",
  "liters": "リットル",
  "isoMaintenance": "ISO メンテナンス推奨",
  "maintenanceRec": "{temp}°C で運転中の {oil} は、劣化速度が早まります。{hours} 時間後にオイル交換を推奨します。",
  "thermalSaturation": "熱的飽和に達しました。追加の冷却が必要です。"
} as ReducerModuleStrings;

const ZH: ReducerModuleStrings = {
  "thermalCharacteristic": "热特性",
  "thermalLimit": "热极限",
  "oilInterval": "换油间隔",
  "hr": "小时",
  "coolingConfig": "冷却配置",
  "forcedFan": "强制风冷",
  "naturalConv": "自然对流",
  "lubeStandard": "润滑油标准",
  "mineralOil": "矿物油 (CLP)",
  "syntheticOil": "合成 PAO",
  "transmissionAnalytics": "传动分析",
  "outputTorque": "输出扭矩 T2",
  "estimatedTemp": "估计工作温度",
  "lubricantVolume": "润滑油量",
  "liters": "升",
  "isoMaintenance": "ISO 维护建议",
  "maintenanceRec": "{oil} 在 {temp}°C 下运行会加速油品劣化。建议在 {hours} 小时后进行下次换油。",
  "thermalSaturation": "已达热饱和。需要额外冷却。"
} as ReducerModuleStrings;

const KO: ReducerModuleStrings = {
  "thermalCharacteristic": "열 특성",
  "thermalLimit": "열 한계",
  "oilInterval": "오일 교환 주기",
  "hr": "시간",
  "coolingConfig": "냉각 구성",
  "forcedFan": "강제 팬 대류",
  "naturalConv": "자연 대류",
  "lubeStandard": "윤활유 규격",
  "mineralOil": "미네랄 오일 (CLP)",
  "syntheticOil": "합성 PAO",
  "transmissionAnalytics": "감속기 열 분석",
  "outputTorque": "출력 토크 T2",
  "estimatedTemp": "추정 운전 온도",
  "lubricantVolume": "윤활유 용량",
  "liters": "리터",
  "isoMaintenance": "ISO 유지보수 권장",
  "maintenanceRec": "{oil}이(가) {temp}°C에서 운전되면 오일 열화가 가속됩니다. {hours}시간 후 교환을 예약하세요.",
  "thermalSaturation": "열 포화에 도달했습니다. 추가 냉각이 필요합니다."
} as ReducerModuleStrings;

const AR: ReducerModuleStrings = {
  "thermalCharacteristic": "الخاصية الحرارية",
  "thermalLimit": "الحد الحراري",
  "oilInterval": "فترة تغيير الزيت",
  "hr": "س",
  "coolingConfig": "إعداد التبريد",
  "forcedFan": "تبريد بالمروحة",
  "naturalConv": "حمل حراري طبيعي",
  "lubeStandard": "معيار التزييت",
  "mineralOil": "زيت معدني (CLP)",
  "syntheticOil": "PAO اصطناعي",
  "transmissionAnalytics": "تحليل ناقل الحركة",
  "outputTorque": "عزم الخرج T2",
  "estimatedTemp": "درجة التشغيل المقدرة",
  "lubricantVolume": "حجم المزلق",
  "liters": "لتر",
  "isoMaintenance": "توصية صيانة ISO",
  "maintenanceRec": "مع تشغيل {oil} عند {temp}°C، يتسارع تدهور الزيت. جدولة التغيير التالي خلال {hours} ساعة.",
  "thermalSaturation": "تم الوصول إلى التشبع الحراري. يلزم تبريد إضافي."
} as ReducerModuleStrings;

const BY_LOCALE: Record<Language, ReducerModuleStrings> = {
  en: EN,
  tr: TR,
  de: DE,
  es: ES,
  fr: FR,
  it: IT,
  pt: PT,
  ru: RU,
  ja: JA,
  zh: ZH,
  ko: KO,
  ar: AR,
};

export function getReducerModuleStrings(locale: string): ReducerModuleStrings {
  return BY_LOCALE[locale as Language] ?? EN;
}

export function formatReducerMaintenance(
  s: ReducerModuleStrings,
  oilType: 'mineral' | 'synthetic',
  temp: number,
  hours: number
): string {
  const oil = oilType === 'synthetic' ? s.syntheticOil : s.mineralOil;
  return s.maintenanceRec
    .replace('{oil}', oil)
    .replace('{temp}', String(Math.round(temp)))
    .replace('{hours}', String(hours));
}
