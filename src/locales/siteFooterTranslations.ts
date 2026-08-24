import type { Language } from '@/store/i18nStore';

export type SiteFooterStrings = {
  disclaimerStable: string;
  disclaimerText: string;
};

const EN: SiteFooterStrings = {
  "disclaimerStable": "v4.0.0 Stable",
  "disclaimerText": "This software is v4.0.0 Stable. Calculation results are for reference only. Final production and engineering decisions must be verified by a qualified professional."
} as SiteFooterStrings;

const TR: SiteFooterStrings = {
  "disclaimerStable": "v4.0.0 Stable",
  "disclaimerText": "Bu yazılım v4.0.0 Stable sürümüdür. Hesaplama sonuçları referans amaçlıdır. Nihai üretim ve mühendislik kararları öncesinde mutlaka uzman bir profesyonel tarafından kontrol edilmelidir."
} as SiteFooterStrings;

const DE: SiteFooterStrings = {
  "disclaimerStable": "v4.0.0 Stable",
  "disclaimerText": "Diese Software ist v4.0.0 Stable. Berechnungsergebnisse dienen nur als Referenz. Endgültige Entscheidungen müssen von Fachpersonal geprüft werden."
} as SiteFooterStrings;

const ES: SiteFooterStrings = {
  "disclaimerStable": "v4.0.0 Stable",
  "disclaimerText": "Este software es v4.0.0 Stable. Los resultados son solo de referencia. Deben ser verificados por un profesional cualificado."
} as SiteFooterStrings;

const FR: SiteFooterStrings = {
  "disclaimerStable": "v4.0.0 Stable",
  "disclaimerText": "Ce logiciel est v4.0.0 Stable. Les résultats sont indicatifs. Ils doivent être vérifiés par un professionnel qualifié."
} as SiteFooterStrings;

const IT: SiteFooterStrings = {
  "disclaimerStable": "v4.0.0 Stable",
  "disclaimerText": "Questo software è v4.0.0 Stable. I risultati sono solo di riferimento. Devono essere verificati da un professionista qualificato."
} as SiteFooterStrings;

const PT: SiteFooterStrings = {
  "disclaimerStable": "v4.0.0 Stable",
  "disclaimerText": "Este software é v4.0.0 Stable. Os resultados são apenas referência. Devem ser verificados por um profissional qualificado."
} as SiteFooterStrings;

const RU: SiteFooterStrings = {
  "disclaimerStable": "v4.0.0 Stable",
  "disclaimerText": "ПО версии v4.0.0 Stable. Результаты справочные. Решения должны проверять специалисты."
} as SiteFooterStrings;

const JA: SiteFooterStrings = {
  "disclaimerStable": "v4.0.0 Stable",
  "disclaimerText": "本ソフトウェアは v4.0.0 Stable です。結果は参考値です。最終判断は専門家の確認が必要です。"
} as SiteFooterStrings;

const ZH: SiteFooterStrings = {
  "disclaimerStable": "v4.0.0 Stable",
  "disclaimerText": "本软件为 v4.0.0 Stable。计算结果仅供参考，最终决策须由合格专业人员核实。"
} as SiteFooterStrings;

const KO: SiteFooterStrings = {
  "disclaimerStable": "v4.0.0 Stable",
  "disclaimerText": "본 소프트웨어는 v4.0.0 Stable입니다. 결과는 참고용이며 전문가 검증이 필요합니다."
} as SiteFooterStrings;

const AR: SiteFooterStrings = {
  "disclaimerStable": "v4.0.0 Stable",
  "disclaimerText": "هذا البرنامج v4.0.0 Stable. النتائج للمرجع فقط ويجب التحقق منها من قبل مختص."
} as SiteFooterStrings;

const BY_LOCALE: Record<Language, SiteFooterStrings> = {
  en: EN, tr: TR, de: DE, es: ES, fr: FR, it: IT, pt: PT, ru: RU, ja: JA, zh: ZH, ko: KO, ar: AR,
};

export function getSiteFooterStrings(locale: string): SiteFooterStrings {
  return BY_LOCALE[locale as Language] ?? EN;
}
