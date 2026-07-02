import type { Language } from '@/store/i18nStore';

export type GearboxModuleStrings = {
  ratioEngine: string;
  multiStage: string;
  totalRatio: string;
  motorParams: string;
  motorPower: string;
  motorSpeed: string;
  initialTorque: string;
  outputMetrics: string;
  finalRpm: string;
  finalTorque: string;
  globalEfficiency: string;
  transmissionCascade: string;
  stage: string;
  pinion: string;
  gear: string;
  efficiency: string;
  ratio: string;
  outRpm: string;
  outNm: string;
};

const EN: GearboxModuleStrings = {
  "ratioEngine": "Gearbox Ratio Engine",
  "multiStage": "Multi-Stage Transmission Synthesis",
  "totalRatio": "Total Global Ratio",
  "motorParams": "Motor Parameters",
  "motorPower": "Motor Power (P)",
  "motorSpeed": "Motor Speed (n1)",
  "initialTorque": "Initial Torque",
  "outputMetrics": "Output Shaft Metrics",
  "finalRpm": "Final RPM",
  "finalTorque": "Final Torque",
  "globalEfficiency": "Global Efficiency",
  "transmissionCascade": "Transmission Cascade",
  "stage": "Stage",
  "pinion": "Pinion (Z1)",
  "gear": "Gear (Z2)",
  "efficiency": "Efficiency (0.1 - 1.0)",
  "ratio": "Ratio",
  "outRpm": "Out RPM",
  "outNm": "Out Nm"
} as GearboxModuleStrings;

const TR: GearboxModuleStrings = {
  "ratioEngine": "Şanzıman Oranı Motoru",
  "multiStage": "Çok Kademeli Transmisyon Sentezi",
  "totalRatio": "Toplam Genel Oran",
  "motorParams": "Motor Parametreleri",
  "motorPower": "Motor Gücü (P)",
  "motorSpeed": "Motor Devri (n1)",
  "initialTorque": "Giriş Torku",
  "outputMetrics": "Çıkış Mili Değerleri",
  "finalRpm": "Çıkış Devri",
  "finalTorque": "Çıkış Torku",
  "globalEfficiency": "Toplam Verim",
  "transmissionCascade": "Aktarım Kademeleri",
  "stage": "Kademe",
  "pinion": "Pinyon (Z1)",
  "gear": "Çark (Z2)",
  "efficiency": "Verim (0.1 - 1.0)",
  "ratio": "Oran",
  "outRpm": "Çıkış Devri",
  "outNm": "Çıkış Torku"
} as GearboxModuleStrings;

const DE: GearboxModuleStrings = {
  "ratioEngine": "Getriebeübersetzungs-Engine",
  "multiStage": "Mehrstufige Getriebesynthese",
  "totalRatio": "Gesamtübersetzung",
  "motorParams": "Motorparameter",
  "motorPower": "Motorleistung (P)",
  "motorSpeed": "Motordrehzahl (n1)",
  "initialTorque": "Anfangsdrehmoment",
  "outputMetrics": "Abtriebswellen-Kennwerte",
  "finalRpm": "Enddrehzahl",
  "finalTorque": "Enddrehmoment",
  "globalEfficiency": "Gesamtwirkungsgrad",
  "transmissionCascade": "Übersetzungskaskade",
  "stage": "Stufe",
  "pinion": "Ritzel (Z1)",
  "gear": "Rad (Z2)",
  "efficiency": "Wirkungsgrad (0.1 - 1.0)",
  "ratio": "Übersetzung",
  "outRpm": "Abtriebsdrehzahl",
  "outNm": "Abtriebsdrehmoment"
} as GearboxModuleStrings;

const ES: GearboxModuleStrings = {
  "ratioEngine": "Motor de Relación de Caja",
  "multiStage": "Síntesis Multi-Etapa",
  "totalRatio": "Relación Global Total",
  "motorParams": "Parámetros del Motor",
  "motorPower": "Potencia (P)",
  "motorSpeed": "Velocidad (n1)",
  "initialTorque": "Par Inicial",
  "outputMetrics": "Métricas del Eje de Salida",
  "finalRpm": "RPM Final",
  "finalTorque": "Par Final",
  "globalEfficiency": "Eficiencia Global",
  "transmissionCascade": "Cascada de Transmisión",
  "stage": "Etapa",
  "pinion": "Piñón (Z1)",
  "gear": "Engranaje (Z2)",
  "efficiency": "Eficiencia (0.1 - 1.0)",
  "ratio": "Relación",
  "outRpm": "RPM Salida",
  "outNm": "Nm Salida"
} as GearboxModuleStrings;

const FR: GearboxModuleStrings = {
  "ratioEngine": "Moteur de Rapport Boîte",
  "multiStage": "Synthèse Multi-Étages",
  "totalRatio": "Rapport Global Total",
  "motorParams": "Paramètres Moteur",
  "motorPower": "Puissance (P)",
  "motorSpeed": "Vitesse (n1)",
  "initialTorque": "Couple Initial",
  "outputMetrics": "Métriques Arbre Sortie",
  "finalRpm": "RPM Final",
  "finalTorque": "Couple Final",
  "globalEfficiency": "Rendement Global",
  "transmissionCascade": "Cascade Transmission",
  "stage": "Étape",
  "pinion": "Pignon (Z1)",
  "gear": "Roue (Z2)",
  "efficiency": "Rendement (0.1 - 1.0)",
  "ratio": "Rapport",
  "outRpm": "RPM Sortie",
  "outNm": "Nm Sortie"
} as GearboxModuleStrings;

const IT: GearboxModuleStrings = {
  "ratioEngine": "Motore Rapporto Riduttore",
  "multiStage": "Sintesi Multi-Stadio",
  "totalRatio": "Rapporto Globale Totale",
  "motorParams": "Parametri Motore",
  "motorPower": "Potenza (P)",
  "motorSpeed": "Velocità (n1)",
  "initialTorque": "Coppia Iniziale",
  "outputMetrics": "Metriche Albero Uscita",
  "finalRpm": "RPM Finale",
  "finalTorque": "Coppia Finale",
  "globalEfficiency": "Efficienza Globale",
  "transmissionCascade": "Cascata Trasmissione",
  "stage": "Stadio",
  "pinion": "Pignone (Z1)",
  "gear": "Ruota (Z2)",
  "efficiency": "Efficienza (0.1 - 1.0)",
  "ratio": "Rapporto",
  "outRpm": "RPM Uscita",
  "outNm": "Nm Uscita"
} as GearboxModuleStrings;

const PT: GearboxModuleStrings = {
  "ratioEngine": "Motor de Relação",
  "multiStage": "Síntese Multi-Estágio",
  "totalRatio": "Relação Global Total",
  "motorParams": "Parâmetros do Motor",
  "motorPower": "Potência (P)",
  "motorSpeed": "Velocidade (n1)",
  "initialTorque": "Torque Inicial",
  "outputMetrics": "Métricas do Eixo de Saída",
  "finalRpm": "RPM Final",
  "finalTorque": "Torque Final",
  "globalEfficiency": "Eficiência Global",
  "transmissionCascade": "Cascata de Transmissão",
  "stage": "Estágio",
  "pinion": "Pinhão (Z1)",
  "gear": "Coroa (Z2)",
  "efficiency": "Eficiência (0.1 - 1.0)",
  "ratio": "Relação",
  "outRpm": "RPM Saída",
  "outNm": "Nm Saída"
} as GearboxModuleStrings;

const RU: GearboxModuleStrings = {
  "ratioEngine": "Движок Передаточного Числа",
  "multiStage": "Многоступенчатый Синтез",
  "totalRatio": "Общее Передаточное Число",
  "motorParams": "Параметры Двигателя",
  "motorPower": "Мощность (P)",
  "motorSpeed": "Скорость (n1)",
  "initialTorque": "Начальный Момент",
  "outputMetrics": "Параметры Выходного Вала",
  "finalRpm": "Конечные об/мин",
  "finalTorque": "Конечный Момент",
  "globalEfficiency": "Общий КПД",
  "transmissionCascade": "Каскад Передачи",
  "stage": "Ступень",
  "pinion": "Шестерня (Z1)",
  "gear": "Колесо (Z2)",
  "efficiency": "КПД (0.1 - 1.0)",
  "ratio": "Передаточное Число",
  "outRpm": "об/мин вых.",
  "outNm": "Нм вых."
} as GearboxModuleStrings;

const JA: GearboxModuleStrings = {
  "ratioEngine": "ギアボックス比率エンジン",
  "multiStage": "多段変速機設計",
  "totalRatio": "総減速比",
  "motorParams": "モーター仕様",
  "motorPower": "モーター出力 (P)",
  "motorSpeed": "モーター回転数 (n1)",
  "initialTorque": "初期トルク",
  "outputMetrics": "出力軸特性",
  "finalRpm": "最終回転数",
  "finalTorque": "最終トルク",
  "globalEfficiency": "総合効率",
  "transmissionCascade": "トランスミッション列",
  "stage": "段",
  "pinion": "ピニオン (Z1)",
  "gear": "ギヤ (Z2)",
  "efficiency": "効率 (0.1 - 1.0)",
  "ratio": "ギヤ比",
  "outRpm": "出力回転数",
  "outNm": "出力トルク"
} as GearboxModuleStrings;

const ZH: GearboxModuleStrings = {
  "ratioEngine": "齿轮箱传动比引擎",
  "multiStage": "多级传动综合",
  "totalRatio": "总传动比",
  "motorParams": "电机参数",
  "motorPower": "电机功率 (P)",
  "motorSpeed": "电机转速 (n1)",
  "initialTorque": "输入扭矩",
  "outputMetrics": "输出轴指标",
  "finalRpm": "最终转速",
  "finalTorque": "最终扭矩",
  "globalEfficiency": "总效率",
  "transmissionCascade": "传动级联",
  "stage": "级",
  "pinion": "小齿轮 (Z1)",
  "gear": "大齿轮 (Z2)",
  "efficiency": "效率 (0.1 - 1.0)",
  "ratio": "传动比",
  "outRpm": "输出转速",
  "outNm": "输出扭矩"
} as GearboxModuleStrings;

const KO: GearboxModuleStrings = {
  "ratioEngine": "기어박스 비율 엔진",
  "multiStage": "다단 변속 합성",
  "totalRatio": "총 감속비",
  "motorParams": "모터 매개변수",
  "motorPower": "모터 출력 (P)",
  "motorSpeed": "모터 속도 (n1)",
  "initialTorque": "초기 토크",
  "outputMetrics": "출력축 지표",
  "finalRpm": "최종 RPM",
  "finalTorque": "최종 토크",
  "globalEfficiency": "전체 효율",
  "transmissionCascade": "변속 캐스케이드",
  "stage": "단계",
  "pinion": "피니언 (Z1)",
  "gear": "기어 (Z2)",
  "efficiency": "효율 (0.1 - 1.0)",
  "ratio": "비율",
  "outRpm": "출력 RPM",
  "outNm": "출력 Nm"
} as GearboxModuleStrings;

const AR: GearboxModuleStrings = {
  "ratioEngine": "محرك نسبة علبة التروس",
  "multiStage": "توليف متعدد المراحل",
  "totalRatio": "النسبة الإجمالية",
  "motorParams": "معاملات المحرك",
  "motorPower": "قدرة المحرك (P)",
  "motorSpeed": "سرعة المحرك (n1)",
  "initialTorque": "عزم الدوران الأولي",
  "outputMetrics": "مقاييس عمود الخرج",
  "finalRpm": "دورة/دقيقة نهائية",
  "finalTorque": "عزم نهائي",
  "globalEfficiency": "الكفاءة الإجمالية",
  "transmissionCascade": "تسلسل النقل",
  "stage": "مرحلة",
  "pinion": "ترس صغير (Z1)",
  "gear": "ترس (Z2)",
  "efficiency": "الكفاءة (0.1 - 1.0)",
  "ratio": "النسبة",
  "outRpm": "RPM خرج",
  "outNm": "Nm خرج"
} as GearboxModuleStrings;

const BY_LOCALE: Record<Language, GearboxModuleStrings> = {
  en: EN, tr: TR, de: DE, es: ES, fr: FR, it: IT, pt: PT, ru: RU, ja: JA, zh: ZH, ko: KO, ar: AR,
};

export function getGearboxModuleStrings(locale: string): GearboxModuleStrings {
  return BY_LOCALE[locale as Language] ?? EN;
}

export function formatGearboxStage(s: GearboxModuleStrings, n: number): string {
  return s.stage + ' ' + n;
}
